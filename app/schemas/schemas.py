from pydantic import BaseModel, ConfigDict
from datetime import date

class SubscriptionCreate(BaseModel):
    service_name: str
    plan_name: str
    price: float
    currency: str
    billing_cycle: str
    start_date: date | None = None
    renewal_date: date | None = None
    end_date: date | None = None
    status: str
    source: str
    source_url: str
    auto_renew: bool


class SubscriptionResponse(SubscriptionCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)

class SubscriptionUpdate(BaseModel):
    service_name: str
    plan_name: str
    price: float
    currency: str
    billing_cycle: str
    start_date: date | None = None
    renewal_date: date | None = None
    end_date: date | None = None
    status: str
    source: str
    source_url: str
    auto_renew: bool

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
