from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from typing import Literal

class SubscriptionBase(BaseModel):
    service_name: str
    plan_name: str
    price: float
    currency: str
    billing_cycle: str
    start_date: date | None = None
    renewal_date: date | None = None
    end_date: date | None = None
    status: Literal["confirmed", "cancelled", "expired"] = "confirmed"
    source: str
    source_url: str
    auto_renew: bool

class SubscriptionCreate(SubscriptionBase):
    pass

class SubscriptionResponse(SubscriptionBase):
    id: int
    user_id: int
    created_at: datetime
    detected_at: datetime | None = None
    model_config = ConfigDict(from_attributes=True)

class SubscriptionUpdate(SubscriptionBase):
    pass

class UserCreate(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    model_config = ConfigDict(from_attributes=True)

# class UserLogin(BaseModel):
#     email: str
#     password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str

class UserMeResponse(BaseModel):
    id: int
    email: str
