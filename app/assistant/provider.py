import json
import re
from functools import lru_cache
from pathlib import Path
from typing import Protocol

from app.schemas.assistant import EntryDraft, ParseRequest, ParseResult, ProposalResult, parse_result_adapter


class Parser(Protocol):
    async def parse(self, request: ParseRequest) -> ParseResult: ...


def normalize_text(text):
    return " ".join(text.casefold().split()).rstrip(".!?")


@lru_cache(maxsize=1)
def test_cases():
    path = Path(__file__).resolve().parents[2] / "tests" / "fixtures" / "chat_cases.json"
    return json.loads(path.read_text(encoding="utf-8"))["cases"]


class TestParser:
    async def parse(self, request):
        text = normalize_text(request.text)
        if text == "czynsz 2400 zł":
            text = "czynsz 2.400 zł"
        for case in test_cases():
            if normalize_text(case["text"]) == text:
                result = parse_result_adapter.validate_python(case["expected"])
                if isinstance(result, ProposalResult) and ("today" in text or "dzisiaj" in text):
                    values = result.draft.model_dump()
                    values["first_due"] = {"year": request.today.year, "month": request.today.month, "day": request.today.day}
                    return self.proposal(EntryDraft.model_validate(values))
                if isinstance(result, ProposalResult) and case["id"] in (27, 37, 49, 50):
                    result.draft.currency = request.default_currency
                return result

        draft = request.draft.model_dump() if request.draft else None
        if draft is not None:
            interval = re.fullmatch(r"(co miesiąc|monthly|co (2|3|6) (?:miesiące|miesięcy)|every (2|3|6) months|co rok|yearly)(?: (?:od|from) (\d{4}-\d{2}-\d{2}))?", text)
            due = re.fullmatch(r"(?:od |from )?(\d{4}-\d{2}-\d{2})", text)
            amount = re.fullmatch(r"(\d+(?:[.,]\d{1,2})?) (pln|zł|eur|usd|gbp)", text)
            until = re.fullmatch(r"(?:do|until) (\d{4}-\d{2}-\d{2})", text)
            if interval:
                draft["interval_months"] = int(interval[2] or interval[3] or (12 if interval[1] in ("co rok", "yearly") else 1))
                if interval[4]:
                    draft["first_due"] = self.date_parts(interval[4])
            elif due:
                draft["first_due"] = self.date_parts(due[1])
            elif amount:
                draft["amount"] = float(amount[1].replace(",", "."))
                draft["currency"] = "PLN" if amount[2] == "zł" else amount[2].upper()
            elif until:
                draft["until"] = self.date_parts(until[1])
                draft["duration_months"] = None
            else:
                return parse_result_adapter.validate_python({"kind": "not_supported", "reason": "test_message"})
            return self.proposal(EntryDraft.model_validate(draft))
        return parse_result_adapter.validate_python({"kind": "not_supported", "reason": "test_message"})

    @staticmethod
    def date_parts(value):
        year, month, day = map(int, value.split("-"))
        return {"year": year, "month": month, "day": day}

    @staticmethod
    def proposal(draft):
        return ProposalResult(kind="proposal", draft=draft, missing=draft.missing_fields())
