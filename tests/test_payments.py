import uuid

import pytest

from app.database.db import SessionLocal
from app.models import models
from app.utils.security import create_access_token

RENT = {
    "name": "Czynsz",
    "category": "rent",
    "amount": 2400,
    "currency": "PLN",
    "interval_months": 1,
    "start_date": "2026-01-10",
    "end_date": None,
    "note": None,
}


def new_user_headers():
    db = SessionLocal()
    try:
        user = models.Users(email=f"{uuid.uuid4().hex}@example.com", google_id=uuid.uuid4().hex)
        db.add(user)
        db.commit()
        db.refresh(user)
        token = create_access_token({"user_id": user.id})
    finally:
        db.close()

    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def user_headers(client):
    return new_user_headers()


def add_payment(client, headers, **changes):
    response = client.post("/api/payments", json={**RENT, **changes}, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


def add_subscription(client, headers, **changes):
    payload = {
        "service_name": "Netflix",
        "plan_name": "Standard",
        "price": 49,
        "currency": "PLN",
        "billing_cycle": "monthly",
        "start_date": "2026-05-01",
        "renewal_date": "2026-10-22",
        "end_date": None,
        "status": "confirmed",
        "source": "manual",
        "source_url": "",
        "auto_renew": True,
        **changes,
    }
    response = client.post("/api/subscriptions", json=payload, headers=headers)
    assert response.status_code == 200, response.text
    return response.json()


def test_payment_can_be_added_read_changed_and_deleted(client, user_headers):
    created = add_payment(client, user_headers, name="  Czynsz  ", note="Przelew do 10.")
    assert created["name"] == "Czynsz"
    assert created["amount"] == 2400
    assert created["interval_months"] == 1
    assert created["note"] == "Przelew do 10."

    listed = client.get("/api/payments", headers=user_headers).json()
    assert [payment["id"] for payment in listed] == [created["id"]]

    one = client.get(f"/api/payments/{created['id']}", headers=user_headers)
    assert one.status_code == 200
    assert one.json()["start_date"] == "2026-01-10"

    changed = client.put(
        f"/api/payments/{created['id']}",
        json={**RENT, "amount": 2550.5, "end_date": "2027-06-10"},
        headers=user_headers,
    )
    assert changed.status_code == 200
    assert changed.json()["amount"] == 2550.5
    assert changed.json()["end_date"] == "2027-06-10"

    deleted = client.delete(f"/api/payments/{created['id']}", headers=user_headers)
    assert deleted.status_code == 200
    assert client.get(f"/api/payments/{created['id']}", headers=user_headers).status_code == 404


def test_payments_of_another_user_are_invisible(client, user_headers):
    created = add_payment(client, user_headers)
    stranger = new_user_headers()

    assert client.get("/api/payments", headers=stranger).json() == []
    assert client.get(f"/api/payments/{created['id']}", headers=stranger).status_code == 404
    assert client.put(f"/api/payments/{created['id']}", json=RENT, headers=stranger).status_code == 404
    assert client.delete(f"/api/payments/{created['id']}", headers=stranger).status_code == 404
    assert client.get(f"/api/payments/{created['id']}", headers=user_headers).status_code == 200


@pytest.mark.parametrize("changes", [
    {"name": "   "},
    {"category": "groceries"},
    {"amount": 0},
    {"amount": -10},
    {"currency": "BTC"},
    {"interval_months": 4},
    {"start_date": "2026-05-10", "end_date": "2026-04-10"},
    {"note": "x" * 501},
])
def test_invalid_payments_are_rejected(client, user_headers, changes):
    response = client.post("/api/payments", json={**RENT, **changes}, headers=user_headers)
    assert response.status_code == 422


def test_payments_need_a_session(client):
    assert client.get("/api/payments").status_code in (401, 403)
    assert client.get("/api/overview").status_code in (401, 403)


def test_overview_sums_what_is_due_in_the_month(client, user_headers):
    add_payment(client, user_headers)
    add_payment(client, user_headers, name="Internet", category="phone_internet", amount=89, start_date="2026-02-07")
    add_payment(client, user_headers, name="Ubezpieczenie", category="insurance", amount=600,
                interval_months=12, start_date="2026-10-20")
    add_payment(client, user_headers, name="Woda", category="utilities", amount=120,
                interval_months=2, start_date="2026-01-31")
    add_payment(client, user_headers, name="Kredyt", category="loan", amount=500, currency="EUR",
                start_date="2025-01-05", end_date="2026-09-05")
    add_subscription(client, user_headers)
    add_subscription(client, user_headers, service_name="Spotify", plan_name="Premium", price=23.99,
                     renewal_date="2026-11-03")
    add_subscription(client, user_headers, service_name="Max", status="cancelled")
    add_subscription(client, user_headers, service_name="Canal+", auto_renew=False)
    add_subscription(client, user_headers, service_name="Duolingo", billing_cycle="yearly", price=299.99,
                     renewal_date="2027-02-01")

    response = client.get("/api/overview", params={"month": "2026-10", "today": "2026-10-06"}, headers=user_headers)
    assert response.status_code == 200
    overview = response.json()

    assert overview["month"] == "2026-10"
    assert overview["totals"] == [{"currency": "PLN", "amount": 3161.99}]
    assert [(item["name"], item["due_date"]) for item in overview["items"]] == [
        ("Spotify", "2026-10-03"),
        ("Internet", "2026-10-07"),
        ("Czynsz", "2026-10-10"),
        ("Ubezpieczenie", "2026-10-20"),
        ("Netflix", "2026-10-22"),
    ]
    netflix = overview["items"][-1]
    assert netflix["kind"] == "subscription"
    assert netflix["category"] == "subscription"
    assert netflix["plan_name"] == "Standard"
    assert overview["next"]["name"] == "Internet"
    assert overview["next"]["due_date"] == "2026-10-07"


def test_overview_handles_short_months_and_separate_currencies(client, user_headers):
    add_payment(client, user_headers, name="Leasing", category="loan", amount=1000.10, start_date="2026-01-31")
    add_payment(client, user_headers, name="Mieszkanie w Berlinie", amount=950, currency="EUR", start_date="2026-01-01")

    february = client.get("/api/overview", params={"month": "2026-02", "today": "2026-02-01"},
                          headers=user_headers).json()
    assert [(item["name"], item["due_date"]) for item in february["items"]] == [
        ("Mieszkanie w Berlinie", "2026-02-01"),
        ("Leasing", "2026-02-28"),
    ]
    assert february["totals"] == [{"currency": "EUR", "amount": 950.0}, {"currency": "PLN", "amount": 1000.1}]
    assert february["next"]["name"] == "Mieszkanie w Berlinie"


def test_overview_defaults_to_the_month_of_today(client, user_headers):
    add_payment(client, user_headers, start_date="2026-01-10", end_date="2026-03-10")

    overview = client.get("/api/overview", params={"today": "2026-03-15"}, headers=user_headers).json()
    assert overview["month"] == "2026-03"
    assert overview["totals"] == [{"currency": "PLN", "amount": 2400.0}]
    assert overview["next"] is None


@pytest.mark.parametrize("month", ["2026-13", "2026-1", "26-10", "october"])
def test_overview_rejects_malformed_months(client, user_headers, month):
    response = client.get("/api/overview", params={"month": month}, headers=user_headers)
    assert response.status_code == 422
