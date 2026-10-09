from collections import defaultdict
from datetime import date

from fastapi import APIRouter, Depends, Query

from app.database.db import SessionLocal
from app.models import models
from app.schemas import schemas
from app.utils.schedule import due_in_month, next_due
from app.utils.security import get_current_user

router = APIRouter()

SUBSCRIPTION_INTERVALS = {"monthly": 1, "yearly": 12}


def payment_plans(payments):
    for payment in payments:
        yield payment.start_date, payment.interval_months, payment.start_date, payment.end_date, {
            "kind": "payment",
            "id": payment.id,
            "name": payment.name,
            "category": payment.category,
            "amount": payment.amount,
            "currency": payment.currency,
        }


def subscription_plans(subscriptions):
    for sub in subscriptions:
        interval = SUBSCRIPTION_INTERVALS.get(sub.billing_cycle)
        if sub.status != "confirmed" or sub.auto_renew is False or not sub.renewal_date or not interval:
            continue
        yield sub.renewal_date, interval, sub.start_date, sub.end_date, {
            "kind": "subscription",
            "id": sub.id,
            "name": sub.service_name,
            "plan_name": sub.plan_name,
            "category": "subscription",
            "amount": sub.price,
            "currency": sub.currency,
        }


@router.get("/overview", response_model=schemas.OverviewResponse)
def get_overview(
    month: str | None = Query(default=None, pattern=r"^\d{4}-(0[1-9]|1[0-2])$"),
    today: date | None = None,
    current_user=Depends(get_current_user),
):
    today = today or date.today()
    year, month_number = (int(part) for part in month.split("-")) if month else (today.year, today.month)

    db = SessionLocal()
    try:
        payments = db.query(models.Payment).filter(models.Payment.user_id == current_user.id).all()
        subscriptions = db.query(models.Subscription).filter(models.Subscription.user_id == current_user.id).all()
        plans = [*payment_plans(payments), *subscription_plans(subscriptions)]
    finally:
        db.close()

    items, upcoming = [], []
    totals = defaultdict(float)

    for anchor, interval, start, end, fields in plans:
        due = due_in_month(anchor, interval, year, month_number, start, end)
        if due:
            items.append(schemas.OverviewItem(**fields, due_date=due))
            totals[fields["currency"]] += fields["amount"]

        following = next_due(anchor, interval, today, start, end)
        if following:
            upcoming.append(schemas.OverviewItem(**fields, due_date=following))

    items.sort(key=lambda item: (item.due_date, item.name.lower()))
    upcoming.sort(key=lambda item: (item.due_date, item.name.lower()))

    return schemas.OverviewResponse(
        month=f"{year:04d}-{month_number:02d}",
        totals=[
            schemas.OverviewTotal(currency=currency, amount=round(amount, 2))
            for currency, amount in sorted(totals.items())
        ],
        items=items,
        next=upcoming[0] if upcoming else None,
    )
