#pytest -v
from app.routes import users as users_route
from app.database.db import SessionLocal
from app.models import models

class FakeGoogleResponse:
    def __init__(self, status_code, payload):
        self.status_code = status_code
        self._payload = payload

    def json(self):
        return self._payload


def fake_google(monkeypatch, status_code, payload):
    monkeypatch.setattr(
        users_route.httpx,
        "get",
        lambda *args, **kwargs: FakeGoogleResponse(status_code, payload),
    )


def test_google_login_creates_user(client, monkeypatch):
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "trackly-client-id")
    fake_google(monkeypatch, 200, {
        "aud": "trackly-client-id",
        "email": "nowy@example.com",
        "email_verified": "true",
        "sub": "google-123",
    })

    response = client.post("/api/users/google-login", json={"access_token": "cokolwiek"})

    assert response.status_code == 200
    assert "access_token" in response.json()


def test_google_login_rejects_token_from_another_app(client, monkeypatch):
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "trackly-client-id")
    fake_google(monkeypatch, 200, {
        "aud": "obca-aplikacja",
        "email": "ktos@example.com",
        "email_verified": "true",
    })

    response = client.post("/api/users/google-login", json={"access_token": "cokolwiek"})

    assert response.status_code == 401


def test_google_login_rejects_invalid_token(client, monkeypatch):
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "trackly-client-id")
    fake_google(monkeypatch, 400, {"error": "invalid_token"})

    response = client.post("/api/users/google-login", json={"access_token": "zly"})

    assert response.status_code == 401


def test_google_login_rejects_token_without_subject(client, monkeypatch):
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "trackly-client-id")
    fake_google(monkeypatch, 200, {
        "aud": "trackly-client-id",
        "email": "bez-sub@example.com",
        "email_verified": "true",
    })

    response = client.post("/api/users/google-login", json={"access_token": "cokolwiek"})

    assert response.status_code == 401
    assert response.json()["detail"] == "Google token has no subject"


def test_google_login_rejects_email_linked_to_another_google_account(client, monkeypatch):
    db = SessionLocal()
    try:
        db.add(models.Users(
            email="konflikt@example.com",
            google_id="google-existing",
        ))
        db.commit()
    finally:
        db.close()

    monkeypatch.setenv("GOOGLE_CLIENT_ID", "trackly-client-id")
    fake_google(monkeypatch, 200, {
        "aud": "trackly-client-id",
        "email": "konflikt@example.com",
        "email_verified": "true",
        "sub": "google-different",
    })

    response = client.post("/api/users/google-login", json={"access_token": "cokolwiek"})

    assert response.status_code == 401


def test_google_login_uses_google_id_as_primary_identity(client, monkeypatch):
    db = SessionLocal()
    try:
        user = models.Users(
            email="stary-email@example.com",
            google_id="google-stable-id",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        expected_user_id = user.id
    finally:
        db.close()

    monkeypatch.setenv("GOOGLE_CLIENT_ID", "trackly-client-id")
    fake_google(monkeypatch, 200, {
        "aud": "trackly-client-id",
        "email": "nowy-email@example.com",
        "email_verified": "true",
        "sub": "google-stable-id",
    })

    response = client.post("/api/users/google-login", json={"access_token": "cokolwiek"})

    assert response.status_code == 200

    from jose import jwt
    from app.utils.security import ALGORITHM, SECRET_KEY

    payload = jwt.decode(
        response.json()["access_token"],
        SECRET_KEY,
        algorithms=[ALGORITHM],
    )
    assert payload["user_id"] == expected_user_id


def test_users_me_returns_logged_in_user(client, auth_headers):
    response = client.get("/api/users/me", headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["email"] == "testowy_conftest@example.com"


def test_users_me_without_token_fails(client):
    response = client.get("/api/users/me")

    assert response.status_code in (401, 403)
