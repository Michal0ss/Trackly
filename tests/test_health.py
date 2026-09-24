from sqlalchemy.exc import OperationalError

from app.routes import health


def test_health_reads_the_database(client):
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_health_needs_no_token(client):
    assert client.get("/api/health").status_code == 200


def test_health_reports_a_database_outage(client, monkeypatch):
    class BrokenSession:
        def query(self, *args):
            raise OperationalError("SELECT users.id", {}, Exception("connection refused"))

        def close(self):
            pass

    monkeypatch.setattr(health, "SessionLocal", BrokenSession)
    response = client.get("/api/health")

    assert response.status_code == 503
    assert response.json() == {"detail": "Baza danych jest niedostępna"}
