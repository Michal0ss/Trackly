from fastapi import APIRouter, HTTPException
from sqlalchemy.exc import SQLAlchemyError

from app.database.db import SessionLocal
from app.models import models

router = APIRouter()


@router.get("/health")
def health():
    db = SessionLocal()
    try:
        db.query(models.Users.id).first()
    except SQLAlchemyError:
        raise HTTPException(status_code=503, detail="Baza danych jest niedostępna")
    finally:
        db.close()

    return {"status": "ok"}
