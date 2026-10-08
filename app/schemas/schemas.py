from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
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

# class UserLogin(BaseModel):
#     email: str
#     password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str

class UserMeResponse(BaseModel):
    id: int
    email: str

class GoogleLoginRequest(BaseModel):
    access_token: str

class WaitlistRequest(BaseModel):
    email: str
    language: Literal["pl", "en"] = "pl"
    consent: bool
    website: str = ""


PaymentCategory = Literal["rent", "loan", "utilities", "insurance", "phone_internet", "other"]
Currency = Literal["PLN", "EUR", "USD", "GBP"]


class PaymentBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    category: PaymentCategory
    amount: float = Field(gt=0, lt=1_000_000_000)
    currency: Currency
    interval_months: Literal[1, 2, 3, 6, 12]
    start_date: date
    end_date: date | None = None
    note: str | None = Field(default=None, max_length=500)

    @field_validator("name")
    @classmethod
    def name_is_not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Name cannot be empty")
        return value

    @model_validator(mode="after")
    def end_after_start(self):
        if self.end_date and self.end_date < self.start_date:
            raise ValueError("end_date cannot be earlier than start_date")
        return self


class PaymentCreate(PaymentBase):
    pass


class PaymentResponse(PaymentBase):
    id: int
    created_at: datetime
    updated_at: datetime | None = None
    model_config = ConfigDict(from_attributes=True)


class OverviewItem(BaseModel):
    kind: Literal["payment", "subscription"]
    id: int
    name: str
    plan_name: str | None = None
    category: str
    amount: float
    currency: str
    due_date: date


class OverviewTotal(BaseModel):
    currency: str
    amount: float


class OverviewResponse(BaseModel):
    month: str
    totals: list[OverviewTotal]
    items: list[OverviewItem]
    next: OverviewItem | None = None
