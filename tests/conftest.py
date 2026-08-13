#pytest -v
import os
import pytest

#testowa baza danych
os.environ["DATABASE_URL"] = "sqlite:///./test_trackly.db"

from fastapi.testclient import TestClient
from app.main import app
from app.database.db import engine, Base
from app.database.db import SessionLocal
from app.models import models
from app.utils.security import create_access_token

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
    db = SessionLocal()
    try:
        email = "testowy_conftest@example.com"
        user = db.query(models.Users).filter(models.Users.email == email).first()

        if not user:
            user = models.Users(email=email, google_id="test-google-id")
            db.add(user)
            db.commit()
            db.refresh(user)

        token = create_access_token({"user_id": user.id})
    finally:
        db.close()

    return {"Authorization": f"Bearer {token}"}
