from sqlalchemy import Column, Integer, String, Float, Date
from .db import Base

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    price = Column(Float)
    currency = Column(String)
    billing_cycle = Column(String)
    next_payment = Column(Date)