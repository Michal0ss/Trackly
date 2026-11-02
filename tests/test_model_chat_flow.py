import json
from uuid import uuid4

import pytest

from app.assistant.model_parser import ModelParser
from app.database.db import SessionLocal
from app.main import app
from app.models.models import Users
from app.routes import assistant
from app.utils.security import create_access_token


@pytest.fixture
def model_chat(monkeypatch):
    monkeypatch.setenv("CHAT_TEST_MODE", "1")
    monkeypatch.delenv("VERCEL", raising=False)
    monkeypatch.delenv("VERCEL_ENV", raising=False)
    with SessionLocal() as db:
        user = Users(email=f"{uuid4()}@example.com", google_id=str(uuid4()))
        db.add(user)
        db.commit()
        db.refresh(user)
        headers = {"Authorization": "Bearer " + create_access_token({"user_id": user.id})}
    yield headers
    app.dependency_overrides.pop(assistant.get_parser, None)


def completion_results(*results):
    replies = iter(results)
    calls = []

    async def complete(**request):
        calls.append(request)
        return json.dumps({"result": next(replies)})

    app.dependency_overrides[assistant.get_parser] = lambda: ModelParser(complete)
    return calls


def parse(client, headers, **changes):
    return client.post("/api/assistant/parse", headers=headers, json={"text": "Czynsz 2400 zł", "language": "pl", "today": "2026-10-30", "default_currency": "PLN", **changes})


def test_injected_completion_preserves_edited_context_and_requires_explicit_confirmation(client, model_chat):
    partial = {"kind": "payment", "name": "Czynsz", "category": "rent", "amount": 2400, "currency": "PLN"}
    complete = {**partial, "amount": 2500, "interval_months": 1, "first_due": {"year": 2026, "month": 10, "day": 31}, "note": "Przelew do wspólnoty"}
    calls = completion_results({"kind": "proposal", "draft": partial}, {"kind": "proposal", "draft": complete})
    first = parse(client, model_chat)
    assert first.status_code == 200
    assert set(first.json()["needs"]) == {"interval_months", "first_due"}
    assert first.json()["entry"] is None
    edited = {**first.json()["result"]["draft"], "note": complete["note"]}
    second = parse(client, model_chat, text="Jednak 2500 zł, co miesiąc od 2026-10-31", context=["Czynsz 2400 zł"], draft=edited)
    assert second.status_code == 200
    body = second.json()
    sent = json.loads(calls[1]["user_input"])
    assert sent["draft"] == edited
    assert sent["context"] == ["Czynsz 2400 zł"]
    assert model_chat["Authorization"] not in json.dumps(calls)
    assert set(sent) == {"text", "language", "today", "default_currency", "context", "draft"}
    assert body["entry"]["note"] == complete["note"]
    assert client.get("/api/payments", headers=model_chat).json() == []
    request = {"proposal_id": body["proposal_id"], "entry": body["entry"]}
    saved = client.post("/api/assistant/confirm", headers=model_chat, json=request)
    repeated = client.post("/api/assistant/confirm", headers=model_chat, json=request)
    assert saved.status_code == 200
    assert saved.json() == repeated.json()
    payments = client.get("/api/payments", headers=model_chat).json()
    assert len(payments) == 1
    assert payments[0]["amount"] == 2500
    assert len(calls) == 2


def test_question_completion_classifies_without_receiving_database_totals(client, model_chat):
    payment = {"name": "Czynsz", "category": "rent", "amount": 2400, "currency": "PLN", "interval_months": 1, "start_date": "2026-10-31", "end_date": None, "note": None}
    assert client.post("/api/payments", headers=model_chat, json=payment).status_code in (200, 201)
    calls = completion_results({"kind": "question", "question": "month_total"})
    response = parse(client, model_chat, text="Ile płacę miesięcznie?")
    assert response.status_code == 200
    assert response.json()["overview"]["totals"] == [{"currency": "PLN", "amount": 2400}]
    assert "2400" not in calls[0]["user_input"]
    assert response.json()["entry"] is None
    assert response.json()["proposal_id"] is None


@pytest.mark.parametrize("result", [
    {"kind": "proposal", "draft": {"kind": "payment", "amount": True}},
    {"kind": "proposal", "draft": {"kind": "payment", "user_id": 999}},
    {"kind": "proposal", "draft": {"kind": "payment", "first_due": {"year": 2026, "month": 2, "day": 30}}},
    {"kind": "question", "question": "month_total", "total": 999},
])
def test_invalid_completion_is_not_replaced_by_a_fixture_or_saved(client, model_chat, result):
    calls = completion_results(result)
    response = parse(client, model_chat)
    assert response.status_code == 502
    assert "999" not in response.text
    assert len(calls) == 1
    assert client.get("/api/payments", headers=model_chat).json() == []


def test_invalid_or_unauthenticated_requests_never_reach_completion(client, model_chat):
    calls = completion_results({"kind": "question", "question": "month_total"})
    assert parse(client, {}).status_code in (401, 403)
    assert parse(client, model_chat, text="x" * 2001).status_code == 422
    assert calls == []
