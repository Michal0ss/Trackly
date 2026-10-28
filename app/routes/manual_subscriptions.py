from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import SQLAlchemyError

from app.database.db import SessionLocal
from app.models.models import Subscription
from app.schemas.manual_subscriptions import ManualSubscriptionUpdate
from app.schemas.schemas import SubscriptionResponse
from app.utils.security import get_current_user
from app.utils.subscriptions import has_subscription_duplicate


router = APIRouter()


def find_manual_subscription(db, subscription_id, user_id):
    subscription = db.query(Subscription).filter(
        Subscription.id == subscription_id, Subscription.user_id == user_id,
        Subscription.source == "manual",
    ).first()
    if subscription is None:
        raise HTTPException(404, "Nie znaleziono subskrypcji dodanej ręcznie.")
    return subscription


@router.put("/manual-subscriptions/{subscription_id}", response_model=SubscriptionResponse)
def update_manual_subscription(subscription_id: int, updated: ManualSubscriptionUpdate, current_user=Depends(get_current_user)):
    try:
        with SessionLocal() as db:
            subscription = find_manual_subscription(db, subscription_id, current_user.id)
            if subscription.status != "cancelled":
                if has_subscription_duplicate(db, current_user.id, updated.service_name, exclude_id=subscription_id):
                    raise HTTPException(409, "Subskrypcja o tej nazwie już istnieje.")
            if subscription.renewal_date is None or subscription.start_date != updated.start_date or subscription.billing_cycle != updated.billing_cycle:
                subscription.renewal_date = updated.start_date
            for key, value in updated.model_dump().items():
                setattr(subscription, key, value)
            db.commit()
            db.refresh(subscription)
            return subscription
    except SQLAlchemyError:
        raise HTTPException(503, "Nie udało się zapisać subskrypcji.") from None


@router.delete("/manual-subscriptions/{subscription_id}")
def delete_manual_subscription(subscription_id: int, current_user=Depends(get_current_user)):
    try:
        with SessionLocal() as db:
            subscription = find_manual_subscription(db, subscription_id, current_user.id)
            db.delete(subscription)
            db.commit()
            return {"message": "Subscription successfully deleted"}
    except SQLAlchemyError:
        raise HTTPException(503, "Nie udało się usunąć subskrypcji.") from None
