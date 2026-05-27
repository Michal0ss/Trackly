import os
import pytest

#testowa baza danych
os.environ["DATABASE_URL"] = "sqlite:///./test_trackly.db"

from fastapi.testclient import TestClient
from app.main import app
from app.database.db import engine, Base

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    #po zakonczeniu testow usuwam baze
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("./test_trackly.db"):
        os.remove("./test_trackly.db")

@pytest.fixture
def client():
    #wirtualny klient api do testow
    with TestClient(app) as c:
        yield c
