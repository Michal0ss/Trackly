import hashlib
import json
import threading
import time

from fastapi import HTTPException
from sqlalchemy import Column, Integer, MetaData, String, Table, case, select, update
from sqlalchemy.dialects.sqlite import insert

from app.database.db import engine
from app.models.models import Payment, Subscription
from app.schemas.assistant import ConfirmResponse


metadata = MetaData()
confirmations = Table(
    "chat_confirmations", metadata,
    Column("user_id", Integer, primary_key=True), Column("proposal_id", String(36), primary_key=True),
    Column("fingerprint", String(64), nullable=False), Column("kind", String(20), nullable=False),
    Column("entry_id", Integer),
)
usage = Table(
    "chat_test_usage", metadata,
    Column("user_id", Integer, primary_key=True), Column("window", Integer, nullable=False),
    Column("count", Integer, nullable=False),
)
setup_lock = threading.Lock()


def prepare_store():
    with setup_lock:
        metadata.create_all(engine)


def consume_request(user_id):
    prepare_store()
    window = int(time.time()) // 60
    statement = insert(usage).values(user_id=user_id, window=window, count=1)
    statement = statement.on_conflict_do_update(
        index_elements=[usage.c.user_id],
        set_={"window": window, "count": case((usage.c.window != window, 1), else_=usage.c.count + 1)},
        where=(usage.c.window != window) | (usage.c.count < 60),
    )
    with engine.begin() as connection:
        if connection.execute(statement).rowcount == 0:
            raise HTTPException(429, "Limit rozmowy. Spróbuj za minutę.", headers={"Retry-After": "60"})


def confirm_entry(user_id, request):
    prepare_store()
    entry = request.entry
    fingerprint = hashlib.sha256(json.dumps(entry.model_dump(mode="json"), sort_keys=True).encode()).hexdigest()
    key = str(request.proposal_id)
    with engine.begin() as connection:
        created = connection.execute(insert(confirmations).values(
            user_id=user_id, proposal_id=key, fingerprint=fingerprint, kind=entry.kind,
        ).on_conflict_do_nothing()).rowcount
        if not created:
            previous = connection.execute(select(confirmations).where(
                confirmations.c.user_id == user_id, confirmations.c.proposal_id == key,
            )).mappings().one()
            if previous["fingerprint"] != fingerprint:
                raise HTTPException(409, "Ta propozycja została już użyta z innymi danymi.")
            return ConfirmResponse(kind=previous["kind"], id=previous["entry_id"])

        if entry.kind == "payment":
            values = entry.model_dump(exclude={"kind", "plan_name"})
            statement = Payment.__table__.insert().values(**values, user_id=user_id)
        else:
            exists = connection.execute(select(Subscription.id).where(
                Subscription.user_id == user_id, Subscription.service_name == entry.name,
                Subscription.status != "cancelled",
            )).first()
            if exists:
                raise HTTPException(409, "Ta subskrypcja już istnieje.")
            statement = Subscription.__table__.insert().values(
                user_id=user_id, service_name=entry.name, plan_name=entry.plan_name or "",
                price=entry.amount, currency=entry.currency,
                billing_cycle="monthly" if entry.interval_months == 1 else "yearly",
                start_date=entry.start_date, renewal_date=entry.start_date, end_date=entry.end_date,
                status="confirmed", source="manual", source_url="", auto_renew=True,
            )
        entry_id = connection.execute(statement).inserted_primary_key[0]
        connection.execute(update(confirmations).where(
            confirmations.c.user_id == user_id, confirmations.c.proposal_id == key,
        ).values(entry_id=entry_id))
        return ConfirmResponse(kind=entry.kind, id=entry_id)
