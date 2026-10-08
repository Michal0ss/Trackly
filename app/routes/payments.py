from fastapi import APIRouter, Depends, HTTPException, status

from app.database.db import SessionLocal
from app.models import models
from app.schemas import schemas
from app.utils.security import get_current_user

router = APIRouter()


def find_payment(db, payment_id: int, user_id: int):
    payment = (
        db.query(models.Payment)
        .filter(models.Payment.id == payment_id, models.Payment.user_id == user_id)
        .first()
    )
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nie znaleziono płatności")
    return payment


@router.get("/payments", response_model=list[schemas.PaymentResponse])
def list_payments(current_user=Depends(get_current_user)):
    db = SessionLocal()
    try:
        return (
            db.query(models.Payment)
            .filter(models.Payment.user_id == current_user.id)
            .order_by(models.Payment.start_date, models.Payment.id)
            .all()
        )
    finally:
        db.close()


@router.post("/payments", response_model=schemas.PaymentResponse, status_code=status.HTTP_201_CREATED)
def create_payment(payment: schemas.PaymentCreate, current_user=Depends(get_current_user)):
    db = SessionLocal()
    try:
        new_payment = models.Payment(**payment.model_dump(), user_id=current_user.id)
        db.add(new_payment)
        db.commit()
        db.refresh(new_payment)
        return new_payment
    finally:
        db.close()


@router.get("/payments/{payment_id}", response_model=schemas.PaymentResponse)
def get_payment(payment_id: int, current_user=Depends(get_current_user)):
    db = SessionLocal()
    try:
        return find_payment(db, payment_id, current_user.id)
    finally:
        db.close()


@router.put("/payments/{payment_id}", response_model=schemas.PaymentResponse)
def update_payment(payment_id: int, updated: schemas.PaymentCreate, current_user=Depends(get_current_user)):
    db = SessionLocal()
    try:
        payment = find_payment(db, payment_id, current_user.id)
        for key, value in updated.model_dump().items():
            setattr(payment, key, value)
        db.commit()
        db.refresh(payment)
        return payment
    finally:
        db.close()


@router.delete("/payments/{payment_id}")
def delete_payment(payment_id: int, current_user=Depends(get_current_user)) -> dict[str, str]:
    db = SessionLocal()
    try:
        payment = find_payment(db, payment_id, current_user.id)
        db.delete(payment)
        db.commit()
        return {"message": "Payment successfully deleted"}
    finally:
        db.close()
