#pytest -v
from app.routes import users as users_route

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

    response = client.post("/users/google-login", json={"access_token": "cokolwiek"})

    assert response.status_code == 200
    assert "access_token" in response.json()


def test_google_login_rejects_token_from_another_app(client, monkeypatch):
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "trackly-client-id")
    fake_google(monkeypatch, 200, {
        "aud": "obca-aplikacja",
        "email": "ktos@example.com",
        "email_verified": "true",
    })

    response = client.post("/users/google-login", json={"access_token": "cokolwiek"})

    assert response.status_code == 401


def test_google_login_rejects_invalid_token(client, monkeypatch):
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "trackly-client-id")
    fake_google(monkeypatch, 400, {"error": "invalid_token"})

    response = client.post("/users/google-login", json={"access_token": "zly"})

    assert response.status_code == 401


def test_users_me_returns_logged_in_user(client, auth_headers):
    response = client.get("/users/me", headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["email"] == "testowy_conftest@example.com"


def test_users_me_without_token_fails(client):
    response = client.get("/users/me")

    assert response.status_code in (401, 403)
