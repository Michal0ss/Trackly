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
    detected_at = Column(Date,default=datetime.now(UTC))

    status = Column(String)
    source = Column(String)
    source_url = Column(String)
    auto_renew = Column(Boolean)

    user = relationship("Users", back_populates="subscriptions")

class Users(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=True)
    password = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.now(UTC))

    subscriptions = relationship("Subscription", back_populates="user")