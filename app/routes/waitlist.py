import re

from fastapi import APIRouter, HTTPException
from sqlalchemy.exc import IntegrityError

from app.database.db import SessionLocal
from app.models import models
from app.schemas import schemas

router = APIRouter()

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


@router.post("/waitlist")
def join_waitlist(payload: schemas.WaitlistRequest):
    if payload.website:
        return {"status": "ok"}

    email = payload.email.strip().lower()

    if len(email) > 254 or not EMAIL_PATTERN.match(email):
        raise HTTPException(status_code=422, detail="Invalid email address")

    if not payload.consent:
        raise HTTPException(status_code=422, detail="Consent is required")

    db = SessionLocal()
    try:
        exists = db.query(models.WaitlistEntry).filter(models.WaitlistEntry.email == email).first()

        if not exists:
            db.add(models.WaitlistEntry(email=email, language=payload.language))
            db.commit()
    except IntegrityError:
        db.rollback()
    finally:
        db.close()

    return {"status": "ok"}
