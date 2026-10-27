import asyncio
from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4

import pytest
from sqlalchemy import select

from app.assistant.local_store import confirm_entry, confirmations, usage
from app.assistant.service import resolve_proposal
from app.database.db import SessionLocal, engine
from app.main import app
from app.models.models import Payment, Users
from app.routes import assistant
from app.schemas.assistant import ConfirmRequest, EntryDraft, ProposalResult
from app.utils.security import create_access_token


@pytest.fixture
def chat_headers(monkeypatch):
    monkeypatch.setenv("CHAT_TEST_MODE", "1")
    monkeypatch.delenv("VERCEL", raising=False)
    monkeypatch.delenv("VERCEL_ENV", raising=False)
    with SessionLocal() as db:
        user = Users(email=f"{uuid4()}@example.com", google_id=str(uuid4()))
        db.add(user)
        db.commit()
        db.refresh(user)
        return {"Authorization": "Bearer " + create_access_token({"user_id": user.id})}, user.id


def parse(client, headers, text, **changes):
    return client.post("/api/assistant/parse", headers=headers, json={
        "text": text, "language": "pl", "today": "2026-10-10", "default_currency": "PLN", **changes,
    })


def proposal(client, headers):
    first = parse(client, headers, "Czynsz 2400 zł")
    assert first.status_code == 200, first.text
    assert set(first.json()["needs"]) == {"interval_months", "first_due"}
    assert first.json()["entry"] is None
    result = parse(client, headers, "Co miesiąc od 2026-10-31", draft=first.json()["result"]["draft"])
    assert result.status_code == 200, result.text
    return result.json()


def confirmation(response):
    return {"proposal_id": response["proposal_id"], "entry": response["entry"]}


def test_complete_conversation_writes_only_after_confirmation_and_replays_after_reconnect(client, chat_headers):
    headers, user_id = chat_headers
    response = proposal(client, headers)
    assert response["entry"]["amount"] == 2400
    assert response["entry"]["start_date"] == "2026-10-31"
    assert client.get("/api/payments", headers=headers).json() == []
    saved = client.post("/api/assistant/confirm", headers=headers, json=confirmation(response))
    assert saved.status_code == 200, saved.text
    engine.dispose()
    repeated = client.post("/api/assistant/confirm", headers=headers, json=confirmation(response))
    assert repeated.json() == saved.json()
    payments = client.get("/api/payments", headers=headers).json()
    assert len(payments) == 1
    assert payments[0]["id"] == saved.json()["id"]
    with engine.connect() as connection:
        stored = connection.execute(select(confirmations).where(confirmations.c.user_id == user_id)).mappings().one()
        assert "Czynsz" not in str(stored)
    february = client.get("/api/overview?month=2027-02&today=2027-02-01", headers=headers).json()
    assert february["items"][0]["due_date"] == "2027-02-28"
    march = client.get("/api/overview?month=2027-03&today=2027-03-01", headers=headers).json()
    assert march["items"][0]["due_date"] == "2027-03-31"


def test_concurrent_confirmations_create_one_record(client, chat_headers):
    headers, user_id = chat_headers
    response = proposal(client, headers)
    request = ConfirmRequest.model_validate(confirmation(response))
    with ThreadPoolExecutor(max_workers=4) as pool:
        saved = list(pool.map(lambda _: confirm_entry(user_id, request), range(4)))
    assert len({item.id for item in saved}) == 1
    assert len(client.get("/api/payments", headers=headers).json()) == 1


def test_confirmation_key_cannot_be_reused_for_different_amounts(client, chat_headers):
    headers, _ = chat_headers
    request = confirmation(proposal(client, headers))
    assert client.post("/api/assistant/confirm", headers=headers, json=request).status_code == 200
    request["entry"]["amount"] = 2500
    assert client.post("/api/assistant/confirm", headers=headers, json=request).status_code == 409
    assert client.get("/api/payments", headers=headers).json()[0]["amount"] == 2400


@pytest.mark.parametrize("change", [
    {"amount": True}, {"amount": "2400"}, {"amount": 0},
    {"interval_months": True}, {"interval_months": 4},
    {"start_date": 1793404800}, {"start_date": "2026-02-30"},
    {"end_date": "2026-10-01"}, {"user_id": 999},
    {"kind": "subscription", "category": "subscription", "note": "unsupported"},
])
def test_confirmation_rejects_invalid_or_unowned_fields_before_writing(client, chat_headers, change):
    headers, _ = chat_headers
    request = confirmation(proposal(client, headers))
    request["entry"].update(change)
    assert client.post("/api/assistant/confirm", headers=headers, json=request).status_code == 422
    assert client.get("/api/payments", headers=headers).json() == []
    assert client.get("/api/subscriptions", headers=headers).json() == []


def test_confirmation_belongs_to_authenticated_user_and_rejects_owner_override(client, chat_headers):
    headers, user_id = chat_headers
    request = confirmation(proposal(client, headers))
    bad = {**request, "user_id": user_id + 1}
    assert client.post("/api/assistant/confirm", headers=headers, json=bad).status_code == 422
    with SessionLocal() as db:
        other = Users(email=f"{uuid4()}@example.com", google_id=str(uuid4()))
        db.add(other)
        db.commit()
        db.refresh(other)
        other_headers = {"Authorization": "Bearer " + create_access_token({"user_id": other.id})}
    first = client.post("/api/assistant/confirm", headers=headers, json=request).json()
    second = client.post("/api/assistant/confirm", headers=other_headers, json=request).json()
    assert first["id"] != second["id"]
    assert len(client.get("/api/payments", headers=headers).json()) == 1
    assert len(client.get("/api/payments", headers=other_headers).json()) == 1


@pytest.mark.parametrize("name,value", [("CHAT_TEST_MODE", "0"), ("VERCEL", "1"), ("VERCEL_ENV", "production")])
def test_test_chat_is_disabled_by_default_and_on_vercel(client, chat_headers, monkeypatch, name, value):
    headers, _ = chat_headers
    monkeypatch.setenv(name, value)
    assert parse(client, headers, "Czynsz 2400 zł").status_code == 503
    assert client.post("/api/assistant/confirm", headers=headers, json={}).status_code == 503


def test_test_chat_rejects_postgres_even_when_the_flag_is_enabled(client, chat_headers, monkeypatch):
    headers, _ = chat_headers
    monkeypatch.setattr(assistant.engine.dialect, "name", "postgresql")
    assert parse(client, headers, "Czynsz 2400 zł").status_code == 503


def test_both_routes_require_authentication(client, chat_headers):
    assert parse(client, {}, "Czynsz 2400 zł").status_code in (401, 403)
    assert client.post("/api/assistant/confirm", json={}).status_code in (401, 403)


def test_questions_use_current_users_real_planned_totals(client, chat_headers):
    headers, _ = chat_headers
    request = confirmation(proposal(client, headers))
    client.post("/api/assistant/confirm", headers=headers, json=request)
    second = {**request, "proposal_id": str(uuid4()), "entry": {**request["entry"], "name": "Rent abroad", "currency": "EUR", "amount": 950}}
    client.post("/api/assistant/confirm", headers=headers, json=second)
    answer = parse(client, headers, "Ile płacę miesięcznie?").json()
    assert answer["overview"]["totals"] == [{"currency": "EUR", "amount": 950}, {"currency": "PLN", "amount": 2400}]
    assert answer["entry"] is None
    assert answer["proposal_id"] is None
    assert parse(client, headers, "Kiedy mam najbliższą płatność?").json()["overview"]["next"]["due_date"] == "2026-10-31"


def test_subscription_confirmation_prevents_duplicates_and_uses_existing_overview(client, chat_headers):
    headers, _ = chat_headers
    first = parse(client, headers, "Netflix 49 zł co miesiąc").json()
    ready = parse(client, headers, "Od 2026-10-15", draft=first["result"]["draft"]).json()
    request = confirmation(ready)
    saved = client.post("/api/assistant/confirm", headers=headers, json=request)
    assert saved.status_code == 200, saved.text
    assert saved.json()["kind"] == "subscription"
    assert client.post("/api/assistant/confirm", headers=headers, json=request).json() == saved.json()
    assert client.post("/api/assistant/confirm", headers=headers, json={**request, "proposal_id": str(uuid4())}).status_code == 409
    answer = parse(client, headers, "Ile wydaję na subskrypcje?").json()
    assert answer["overview"]["totals"] == [{"currency": "PLN", "amount": 49}]
    assert all(item["kind"] == "subscription" for item in answer["overview"]["items"])


def test_invalid_followup_can_be_corrected_without_losing_prior_fields(client, chat_headers):
    headers, _ = chat_headers
    first = parse(client, headers, "Czynsz 2400 zł").json()
    draft = first["result"]["draft"]
    assert parse(client, headers, "Co miesiąc od 2026-02-30", draft=draft).status_code == 422
    corrected = parse(client, headers, "Co miesiąc od 2026-02-28", draft=draft).json()
    assert corrected["entry"]["amount"] == 2400
    assert corrected["entry"]["name"] == "Czynsz"


def test_followup_preserves_edited_note_through_confirmation(client, chat_headers):
    headers, _ = chat_headers
    response = proposal(client, headers)
    draft = {**response["result"]["draft"], "note": "Przelew do wspólnoty"}
    changed = parse(client, headers, "2500 PLN", draft=draft).json()
    assert changed["entry"]["note"] == draft["note"]
    assert changed["entry"]["amount"] == 2500
    assert client.post("/api/assistant/confirm", headers=headers, json=confirmation(changed)).status_code == 200
    assert client.get("/api/payments", headers=headers).json()[0]["note"] == draft["note"]


def test_explicit_today_uses_phone_date_instead_of_benchmark_date(client, chat_headers):
    headers, _ = chat_headers
    response = parse(client, headers, "Paid $1,850 for rent today", language="en", today="2026-11-03", default_currency="USD")
    assert response.status_code == 200
    assert response.json()["result"]["draft"]["first_due"] == {"year": 2026, "month": 11, "day": 3}


def test_rate_limit_is_stored_in_database_and_does_not_log_text(client, chat_headers):
    headers, user_id = chat_headers
    assert parse(client, headers, "Czynsz 2400 zł").status_code == 200
    with engine.begin() as connection:
        connection.execute(usage.update().where(usage.c.user_id == user_id).values(count=60))
    limited = parse(client, headers, "Czynsz 2400 zł")
    assert limited.status_code == 429
    assert limited.headers["Retry-After"] == "60"


def test_provider_timeout_and_invalid_output_are_safe(client, chat_headers, monkeypatch):
    headers, _ = chat_headers

    class SlowParser:
        async def parse(self, request):
            await asyncio.sleep(1)

    class BrokenParser:
        async def parse(self, request):
            return {"private": "never-return-this"}

    try:
        monkeypatch.setattr(assistant, "PARSER_TIMEOUT", 0.01)
        app.dependency_overrides[assistant.get_parser] = SlowParser
        assert parse(client, headers, "Czynsz 2400 zł").status_code == 504
        app.dependency_overrides[assistant.get_parser] = BrokenParser
        broken = parse(client, headers, "Czynsz 2400 zł")
        assert broken.status_code == 502
        assert "never-return-this" not in broken.text
    finally:
        app.dependency_overrides.pop(assistant.get_parser, None)


@pytest.mark.parametrize("interval,duration,expected", [(1, 24, "2028-09-20"), (3, 12, "2027-07-20"), (12, 24, "2027-10-20")])
def test_duration_is_converted_to_last_scheduled_payment_in_code(interval, duration, expected):
    draft = EntryDraft(kind="payment", name="Loan", category="loan", amount=99, currency="PLN", interval_months=interval, first_due={"year": 2026, "month": 10, "day": 20}, duration_months=duration)
    response = resolve_proposal(ProposalResult(kind="proposal", draft=draft, missing=[]))
    assert response.entry.end_date.isoformat() == expected


def test_full_first_date_is_required_and_end_month_uses_last_calendar_day():
    draft = EntryDraft(kind="payment", name="Rent", category="rent", amount=99, currency="PLN", interval_months=1, first_due={"day": 10})
    assert resolve_proposal(ProposalResult(kind="proposal", draft=draft, missing=[])).needs == ["first_due"]
    draft = EntryDraft.model_validate({**draft.model_dump(), "first_due": {"year": 2026, "month": 1, "day": 31}, "until": {"year": 2028, "month": 2}})
    response = resolve_proposal(ProposalResult(kind="proposal", draft=draft, missing=[]))
    assert response.entry.end_date.isoformat() == "2028-02-29"
