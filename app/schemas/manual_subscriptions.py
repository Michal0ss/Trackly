from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.schemas.schemas import Currency


class ManualSubscriptionUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    service_name: str = Field(min_length=1, max_length=120)
    plan_name: str = Field(default="", max_length=120)
    price: float = Field(strict=True, gt=0, lt=1_000_000_000, allow_inf_nan=False)
    currency: Currency
    billing_cycle: Literal["monthly", "yearly"]
    start_date: date
    end_date: date | None = None

    @field_validator("start_date", "end_date", mode="before")
    @classmethod
    def calendar_date(cls, value):
        if value is None or type(value) is date:
            return value
        if not isinstance(value, str) or len(value) != 10:
            raise ValueError("Use YYYY-MM-DD")
        parsed = date.fromisoformat(value)
        if parsed.isoformat() != value:
            raise ValueError("Use YYYY-MM-DD")
        return parsed

    @model_validator(mode="after")
    def end_after_start(self):
        if self.end_date and self.end_date < self.start_date:
            raise ValueError("End precedes the first payment")
        return self
