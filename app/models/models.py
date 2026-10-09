from datetime import datetime, UTC, date
from sqlalchemy import Boolean, Column, Date, Float, ForeignKey, Integer, String, DateTime
from sqlalchemy.orm import relationship

from app.database.db import Base

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    service_name = Column(String)
    plan_name = Column(String)
    price = Column(Float)
    currency = Column(String(3))
    billing_cycle = Column(String)

    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    renewal_date = Column(Date, nullable=True)
    detected_at = Column(DateTime, nullable=True, default=datetime.now(UTC))
    created_at = Column(DateTime, default=datetime.now(UTC))

    status = Column(String)
    source = Column(String)
    source_url = Column(String)
    auto_renew = Column(Boolean)

    user = relationship("Users", back_populates="subscriptions")

class Users(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=True)
    google_id = Column(String, unique=True, nullable=True)
    created_at = Column(DateTime, default=datetime.now(UTC))

    subscriptions = relationship("Subscription", back_populates="user")


class WaitlistEntry(Base):
    __tablename__ = "waitlist"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    language = Column(String(2))
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(3), nullable=False)
    interval_months = Column(Integer, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    note = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))
