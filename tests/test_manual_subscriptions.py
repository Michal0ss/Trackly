from uuid import uuid4

import pytest
from sqlalchemy.exc import SQLAlchemyError

from app.database.db import SessionLocal
from app.models.models import Users
from app.routes import manual_subscriptions
from app.utils.security import create_access_token


PAYLOAD = {
    "service_name": "Netflix", "plan_name": "Standard", "price": 49,
    "currency": "PLN", "billing_cycle": "monthly", "start_date": "2026-10-31", "end_date": None,
}


def account_headers():
    with SessionLocal() as db:
        user = Users(email=f"{uuid4()}@example.com", google_id=str(uuid4()))
        db.add(user)
        db.commit()
        db.refresh(user)
        return {"Authorization": "Bearer " + create_access_token({"user_id": user.id})}


@pytest.fixture
def account():
    return account_headers()


def create(client, headers, **changes):
    response = client.post("/api/subscriptions", headers=headers, json={
        **PAYLOAD, "renewal_date": PAYLOAD["start_date"], "source": "manual", "source_url": "",
        "status": "confirmed", "auto_renew": True, **changes,
    })
    assert response.status_code == 200
    return response.json()


def test_edit_changes_existing_entry_and_overview_without_changing_ownership(client, account):
    saved = create(client, account)
    response = client.put(f"/api/manual-subscriptions/{saved['id']}", headers=account, json={
        **PAYLOAD, "plan_name": "Premium", "price": 59, "currency": "EUR",
        "billing_cycle": "yearly", "start_date": "2028-02-29", "end_date": "2030-02-28",
    })
    assert response.status_code == 200
    edited = response.json()
    for field in ("id", "user_id", "created_at", "detected_at", "source", "source_url", "status", "auto_renew"):
        assert edited[field] == saved[field]
    assert edited["renewal_date"] == "2028-02-29"
    assert edited["plan_name"] == "Premium"
    assert len(client.get("/api/subscriptions", headers=account).json()) == 1
    overview = client.get("/api/overview?month=2029-02&today=2029-02-01", headers=account).json()
    assert overview["totals"] == [{"currency": "EUR", "amount": 59}]
    assert overview["items"][0]["due_date"] == "2029-02-28"
    assert client.get("/api/overview?month=2029-03&today=2029-03-01", headers=account).json()["items"] == []


def test_price_edit_preserves_existing_renewal_anchor_and_inactive_status(client, account):
    saved = create(client, account, renewal_date="2026-11-30", status="cancelled", auto_renew=False)
    response = client.put(f"/api/manual-subscriptions/{saved['id']}", headers=account, json={**PAYLOAD, "price": 59})
    assert response.status_code == 200
    assert response.json()["renewal_date"] == "2026-11-30"
    assert response.json()["status"] == "cancelled"
    assert response.json()["auto_renew"] is False
    assert client.get("/api/overview?month=2026-11&today=2026-11-01", headers=account).json()["items"] == []


@pytest.mark.parametrize(("existing_name", "updated_name"), [
    ("Spotify", " spotify "), ("ŻÓŁĆ", "żółć"), ("Cafe\u0301", "CAFÉ"),
])
def test_duplicate_name_rejection_keeps_original_details(client, account, existing_name, updated_name):
    saved = create(client, account)
    create(client, account, service_name=existing_name, source="extension")
    response = client.put(f"/api/manual-subscriptions/{saved['id']}", headers=account, json={**PAYLOAD, "service_name": updated_name, "price": 999})
    assert response.status_code == 409
    unchanged = client.get(f"/api/subscriptions/{saved['id']}", headers=account).json()
    assert unchanged["service_name"] == "Netflix"
    assert unchanged["price"] == 49


@pytest.mark.parametrize(("existing_name", "new_name"), [
    ("Netflix", " netflix "), ("ŻÓŁĆ", "żółć"), ("Cafe\u0301", "CAFÉ"),
])
def test_chat_confirmation_uses_the_same_duplicate_check_as_editing(client, account, monkeypatch, existing_name, new_name):
    monkeypatch.setenv("CHAT_TEST_MODE", "1")
    monkeypatch.delenv("VERCEL", raising=False)
    monkeypatch.delenv("VERCEL_ENV", raising=False)
    create(client, account, service_name=existing_name)
    response = client.post("/api/assistant/confirm", headers=account, json={
        "proposal_id": str(uuid4()), "entry": {
            "kind": "subscription", "name": new_name, "category": "subscription", "amount": 49,
            "currency": "PLN", "interval_months": 1, "start_date": "2026-10-31", "end_date": None,
        },
    })
    assert response.status_code == 409
    assert len(client.get("/api/subscriptions", headers=account).json()) == 1


def test_edit_completes_missing_renewal_anchor_from_the_explicit_first_date(client, account):
    saved = create(client, account, renewal_date=None)
    response = client.put(f"/api/manual-subscriptions/{saved['id']}", headers=account, json=PAYLOAD)
    assert response.status_code == 200
    assert response.json()["renewal_date"] == PAYLOAD["start_date"]
    overview = client.get("/api/overview?month=2027-02&today=2027-02-01", headers=account).json()
    assert overview["items"][0]["due_date"] == "2027-02-28"


@pytest.mark.parametrize("change", [
    {"price": 0}, {"price": -1}, {"price": True}, {"price": "49"}, {"price": 1_000_000_000},
    {"service_name": " "}, {"service_name": "x" * 121}, {"plan_name": "x" * 121},
    {"billing_cycle": "weekly"}, {"currency": "CHF"}, {"start_date": "2026-02-30"},
    {"start_date": 1793404800}, {"start_date": "20261031"}, {"start_date": None},
    {"end_date": "2026-10-30"}, {"end_date": "invalid"},
    {"user_id": 999}, {"source": "extension"}, {"status": "cancelled"},
    {"auto_renew": False}, {"renewal_date": "2026-11-01"},
])
def test_invalid_or_protected_fields_never_change_saved_entry(client, account, change):
    saved = create(client, account)
    response = client.put(f"/api/manual-subscriptions/{saved['id']}", headers=account, json={**PAYLOAD, **change})
    assert response.status_code == 422
    assert client.get(f"/api/subscriptions/{saved['id']}", headers=account).json() == saved


def test_other_accounts_and_extension_entries_cannot_be_modified(client, account):
    other_account = account_headers()
    foreign = create(client, other_account, service_name=str(uuid4()))
    extension = create(client, account, source="extension")
    for subscription_id in (foreign["id"], extension["id"], 987654321):
        assert client.put(f"/api/manual-subscriptions/{subscription_id}", headers=account, json=PAYLOAD).status_code == 404
        assert client.delete(f"/api/manual-subscriptions/{subscription_id}", headers=account).status_code == 404
    assert client.get(f"/api/subscriptions/{foreign['id']}", headers=other_account).json() == foreign
    assert client.get(f"/api/subscriptions/{extension['id']}", headers=account).json() == extension
    assert client.put(f"/api/manual-subscriptions/{extension['id']}", json=PAYLOAD).status_code == 401
    assert client.delete(f"/api/manual-subscriptions/{extension['id']}").status_code == 401


def test_deletion_removes_only_selected_entry_and_its_planned_payments(client, account):
    first = create(client, account)
    second = create(client, account, service_name="Spotify", price=19)
    path = f"/api/manual-subscriptions/{first['id']}"
    assert client.delete(path, headers=account).status_code == 200
    assert client.delete(path, headers=account).status_code == 404
    assert [item["id"] for item in client.get("/api/subscriptions", headers=account).json()] == [second["id"]]
    overview = client.get("/api/overview?month=2026-10&today=2026-10-01", headers=account).json()
    assert overview["totals"] == [{"currency": "PLN", "amount": 19}]


def test_database_failures_return_safe_errors(client, account, monkeypatch):
    def unavailable():
        raise SQLAlchemyError("private connection details")
    monkeypatch.setattr(manual_subscriptions, "SessionLocal", unavailable)
    for response in (
        client.put("/api/manual-subscriptions/1", headers=account, json=PAYLOAD),
        client.delete("/api/manual-subscriptions/1", headers=account),
    ):
        assert response.status_code == 503
        assert "private" not in response.text


def test_chat_subscription_can_be_edited_deleted_and_confirmation_replayed_without_recreation(client, account, monkeypatch):
    monkeypatch.setenv("CHAT_TEST_MODE", "1")
    monkeypatch.delenv("VERCEL", raising=False)
    monkeypatch.delenv("VERCEL_ENV", raising=False)
    confirmation = {"proposal_id": str(uuid4()), "entry": {
        "kind": "subscription", "name": "Netflix", "category": "subscription", "amount": 49,
        "currency": "PLN", "interval_months": 1, "start_date": "2026-10-31",
        "end_date": None, "plan_name": "Standard", "note": None,
    }}
    saved = client.post("/api/assistant/confirm", headers=account, json=confirmation)
    assert saved.status_code == 200
    path = f"/api/manual-subscriptions/{saved.json()['id']}"
    assert client.put(path, headers=account, json={**PAYLOAD, "price": 59}).status_code == 200
    replayed = client.post("/api/assistant/confirm", headers=account, json=confirmation)
    assert replayed.json() == saved.json()
    assert client.get("/api/subscriptions", headers=account).json()[0]["price"] == 59
    assert client.delete(path, headers=account).status_code == 200
    assert client.post("/api/assistant/confirm", headers=account, json=confirmation).json() == saved.json()
    assert client.get("/api/subscriptions", headers=account).json() == []
