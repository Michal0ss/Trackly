from fastapi import APIRouter, Depends, HTTPException, status
from app.database.db import SessionLocal
from app.schemas import schemas
from app.models import models
from app.utils.security import get_current_user
from sqlalchemy import func
from datetime import date, timedelta
from app.utils.subscription_detector import detect_subscription_from_text

router = APIRouter()
print("Subscriptions router loaded")

@router.post("/subscriptions/detect", response_model=schemas.SubscriptionDetectResponse)
def detect_subscription(
    request: schemas.SubscriptionDetectRequest,
    current_user=Depends(get_current_user),
):
    text = request.text.strip()

    if not text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tekst jest wymagany",
        )

    limited_text = text[:10000]

    return detect_subscription_from_text(
        text=limited_text,
        url=request.url,
    )


@router.post("/subscriptions", response_model=schemas.SubscriptionResponse)
def create_subscription(sub: schemas.SubscriptionCreate, current_user=Depends(get_current_user)):
    db = SessionLocal()
    try:
        existing_sub = (
            db.query(models.Subscription)
            .filter(models.Subscription.user_id == current_user.id,
                    models.Subscription.service_name == sub.service_name,
                    models.Subscription.status != "cancelled")
            .first()
        )
        if existing_sub:
            raise HTTPException(status_code=409, detail=f"Masz już aktywną subskrypcję serwisu {sub.service_name}")

        new_sub = models.Subscription(**sub.model_dump(), user_id=current_user.id)
        db.add(new_sub)
        db.commit()
        db.refresh(new_sub)
        return new_sub
    finally:
        db.close()

@router.get("/subscriptions", response_model=list[schemas.SubscriptionResponse])
def get_subscriptions(current_user=Depends(get_current_user)):
    db = SessionLocal()
    try:
        return db.query(models.Subscription).filter(models.Subscription.user_id == current_user.id).all()
    finally:
        db.close()

@router.get("/subscriptions/summary/budget")
def get_budget_summary(current_user=Depends(get_current_user)):
    db = SessionLocal()
    try:
        summary = (
                db.query(models.Subscription.currency, func.sum(models.Subscription.price).label("total"))
        .filter(models.Subscription.user_id == current_user.id)
        .group_by(models.Subscription.currency)
        .all()
        )
        budget_dict = {item.currency: item.total for item in summary}
        return budget_dict
    finally:
        db.close()

@router.get("/subscriptions/summary/expiring", response_model=list[schemas.SubscriptionResponse])
def get_expiring_subscriptions(days: int = 3, current_user=Depends(get_current_user)):
    db = SessionLocal()
    try:
        today = date.today()
        target_date = today + timedelta(days=days)
        expiring_subs = (
            db.query(models.Subscription)
            .filter(
                models.Subscription.user_id == current_user.id,
                models.Subscription.status == "confirmed",
                models.Subscription.renewal_date >= today,
                models.Subscription.renewal_date <= target_date,
            )
            .all()
        )
        return expiring_subs
    finally:
        db.close()


@router.get("/subscriptions/{subscription_id}", response_model=schemas.SubscriptionResponse)
def get_subscriptions_by_id(subscription_id: int, current_user=Depends(get_current_user)):
    db = SessionLocal()
    try:
        sub = (
            db.query(models.Subscription)
            .filter(
                models.Subscription.id == subscription_id,
                models.Subscription.user_id == current_user.id,
            )
            .first()
        )
        if not sub:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nie znaleziono subskrypcji")
        return sub
    finally:
        db.close()

@router.delete("/subscriptions/{subscription_id}")
def delete_subscription(subscription_id: int, current_user=Depends(get_current_user)) -> dict[str, str]:
    db = SessionLocal()
    try:
        sub = (
            db.query(models.Subscription)
            .filter(
                models.Subscription.id == subscription_id,
                models.Subscription.user_id == current_user.id,
            )
            .first()
        )
        if not sub:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nie znaleziono subskrypcji")
        db.delete(sub)
        db.commit()
        return {"message": "Subscription successfully deleted"}
    finally:
        db.close()

@router.put("/subscriptions/{subscription_id}", response_model=schemas.SubscriptionResponse)
def update_subscription(subscription_id: int, updated: schemas.SubscriptionUpdate, current_user=Depends(get_current_user)):
    db = SessionLocal()
    try:
        sub = (
            db.query(models.Subscription)
            .filter(
                models.Subscription.id == subscription_id,
                models.Subscription.user_id == current_user.id,
            )
            .first()
        )
        if not sub:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nie znaleziono subskrypcji")

        for key, value in updated.model_dump().items():
            setattr(sub, key, value)

        db.commit()
        db.refresh(sub)
        return sub
    finally:
        db.close()

