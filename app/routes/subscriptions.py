from fastapi import APIRouter, Depends, HTTPException, status
from app.database.db import SessionLocal
from app.schemas import schemas
from app.models import models
from app.utils.security import get_current_user

router = APIRouter()
print("Subscriptions router loaded")

@router.post("/subscriptions")
def create_subscription(sub: schemas.SubscriptionCreate, current_user=Depends(get_current_user)):
    db = SessionLocal()
    try:
        new_sub = models.Subscription(**sub.model_dump(), user_id=current_user.id)
        db.add(new_sub)
        db.commit()
        db.refresh(new_sub)
        return new_sub
    finally:
        db.close()

@router.get("/subscriptions")
def get_subscriptions(current_user=Depends(get_current_user)):
    db = SessionLocal()
    try:
        return db.query(models.Subscription).filter(models.Subscription.user_id == current_user.id).all()
    finally:
        db.close()

@router.get("/subscriptions/{subscription_id}")
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
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found")
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
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found")
        db.delete(sub)
        db.commit()
        return {"message": "Subscription successfully deleted"}
    finally:
        db.close()

@router.put("/subscriptions/{subscription_id}")
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
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found")

        for key, value in updated.model_dump().items():
            setattr(sub, key, value)

        db.commit()
        db.refresh(sub)
        return sub
    finally:
        db.close()

