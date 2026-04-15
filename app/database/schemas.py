from pydantic import BaseModel, ConfigDict
from datetime import date

class SubscriptionCreate(BaseModel):
    name: str
    price: float
    currency: str
    billing_cycle: str
    next_payment_date: date

class SubscriptionResponse(SubscriptionCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)

class SubscriptionUpdate(BaseModel):
    name: str
    price: float
    currency: str
    billing_cycle: str
    next_payment_date: date