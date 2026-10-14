import asyncio
import os
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ValidationError
from sqlalchemy.exc import SQLAlchemyError
from starlette.concurrency import run_in_threadpool

from app.assistant.local_store import confirm_entry, consume_request
from app.assistant.provider import Parser, TestParser
from app.assistant.service import resolve_proposal
from app.database.db import engine
from app.routes.overview import get_overview
from app.schemas.assistant import ChatResponse, ConfirmRequest, ConfirmResponse, ParseRequest, QuestionResult, parse_result_adapter
from app.schemas.schemas import OverviewTotal
from app.utils.security import get_current_user


def require_local_chat():
    if os.getenv("CHAT_TEST_MODE") != "1" or engine.dialect.name != "sqlite" or os.getenv("VERCEL") or os.getenv("VERCEL_ENV"):
        raise HTTPException(503, "Rozmowa testowa jest wyłączona.")


router = APIRouter(dependencies=[Depends(require_local_chat)])
PARSER_TIMEOUT = 3


def get_parser() -> Parser:
    return TestParser()


@router.post("/assistant/parse", response_model=ChatResponse)
async def parse_message(request: ParseRequest, current_user=Depends(get_current_user), parser=Depends(get_parser)):
    try:
        await run_in_threadpool(consume_request, current_user.id)
        raw = await asyncio.wait_for(parser.parse(request), timeout=PARSER_TIMEOUT)
        try:
            result = parse_result_adapter.validate_python(raw.model_dump() if isinstance(raw, BaseModel) else raw)
        except ValidationError:
            raise HTTPException(502, "Nie udało się odczytać odpowiedzi rozmowy.") from None
        response = resolve_proposal(result)
        if isinstance(result, QuestionResult):
            overview = await run_in_threadpool(get_overview, request.today.strftime("%Y-%m"), request.today, current_user)
            if result.question == "subscriptions_total":
                totals = defaultdict(float)
                overview.items = [item for item in overview.items if item.kind == "subscription"]
                for item in overview.items:
                    totals[item.currency] += item.amount
                overview.totals = [OverviewTotal(currency=currency, amount=round(amount, 2)) for currency, amount in sorted(totals.items())]
                overview.next = None
            response.overview = overview
        return response
    except TimeoutError:
        raise HTTPException(504, "Rozmowa nie odpowiedziała na czas.") from None
    except (ValidationError, ValueError):
        raise HTTPException(422, "Sprawdź kwotę i datę w wiadomości.") from None
    except (SQLAlchemyError, OSError):
        raise HTTPException(503, "Rozmowa jest chwilowo niedostępna.") from None


@router.post("/assistant/confirm", response_model=ConfirmResponse)
def confirm_proposal(request: ConfirmRequest, current_user=Depends(get_current_user)):
    try:
        return confirm_entry(current_user.id, request)
    except SQLAlchemyError:
        raise HTTPException(503, "Nie udało się potwierdzić zapisu.") from None
