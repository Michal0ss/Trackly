#pytest -v
import os
import pytest

#testowa baza danych
os.environ["DATABASE_URL"] = "sqlite:///./test_trackly.db"

from fastapi.testclient import TestClient
from app.main import app
from app.database.db import engine, Base

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    engine.dispose()
    if os.path.exists("./test_trackly.db"):
        try: os.remove("./test_trackly.db")
        except Exception:
            pass

    Base.metadata.create_all(bind=engine)
    yield

    #po zakonczeniu testow usuwam baze i zwalniam polaczenia
    engine.dispose()
    if os.path.exists("./test_trackly.db"):
        try: os.remove("./test_trackly.db")
        except Exception:
            pass

@pytest.fixture
def client():
    #wirtualny klient api do testow
    with TestClient(app) as c:
        yield c

@pytest.fixture
def auth_headers(client):
    email = "testowy_conftest@example.com"
    password = "testowy123"

    #rejestracja
    client.post("/users/register", json={"email": email, "password": password})

    #logowanie po token
    login_response = client.post("/users/login", data={"username": email, "password": password})
    token = login_response.json()["access_token"]

    return {"Authorization": f"Bearer {token}"}
