from app.database.db import SessionLocal
from app.models import models


def waitlist_emails():
    db = SessionLocal()
    try:
        return [entry.email for entry in db.query(models.WaitlistEntry).all()]
    finally:
        db.close()


def test_signup_is_saved_once_and_lowercased(client):
    payload = {"email": " Pierwszy@Example.com ", "language": "pl", "consent": True}

    first = client.post("/api/waitlist", json=payload)
    second = client.post("/api/waitlist", json=payload)

    assert first.status_code == 200
    assert second.status_code == 200
    assert waitlist_emails().count("pierwszy@example.com") == 1


def test_signup_needs_consent(client):
    response = client.post("/api/waitlist", json={"email": "bez-zgody@example.com", "consent": False})

    assert response.status_code == 422
    assert "bez-zgody@example.com" not in waitlist_emails()


def test_invalid_email_is_rejected(client):
    response = client.post("/api/waitlist", json={"email": "to nie jest mail", "consent": True})

    assert response.status_code == 422


def test_filled_hidden_field_is_ignored(client):
    response = client.post(
        "/api/waitlist",
        json={"email": "bot@example.com", "consent": True, "website": "https://spam.example"},
    )

    assert response.status_code == 200
    assert "bot@example.com" not in waitlist_emails()


def test_language_is_stored(client):
    client.post("/api/waitlist", json={"email": "english@example.com", "language": "en", "consent": True})

    db = SessionLocal()
    try:
        entry = db.query(models.WaitlistEntry).filter(models.WaitlistEntry.email == "english@example.com").one()
    finally:
        db.close()

    assert entry.language == "en"
