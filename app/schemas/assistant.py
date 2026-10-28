from calendar import monthrange
from datetime import date
from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, StrictInt, TypeAdapter, field_validator, model_validator

from app.schemas.schemas import Currency, OverviewResponse, PaymentCategory, PaymentCreate


class ChatModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class DateParts(ChatModel):
    year: Annotated[StrictInt, Field(ge=1, le=9999)] | None = None
    month: Annotated[StrictInt, Field(ge=1, le=12)] | None = None
    day: Annotated[StrictInt, Field(ge=1, le=31)] | None = None

    @model_validator(mode="after")
    def valid_calendar_date(self):
        if self.year is None and self.month is None and self.day is None:
            raise ValueError("At least one date part is required")
        if self.year is not None and self.month is None:
            raise ValueError("A year requires a month")
        if self.month is not None and self.day is not None:
            if self.day > monthrange(self.year or 2000, self.month)[1]:
                raise ValueError("Invalid calendar date")
        return self


class EntryDraft(ChatModel):
    kind: Literal["payment", "subscription"]
    name: Annotated[str, Field(min_length=1, max_length=120)] | None = None
    category: PaymentCategory | Literal["subscription"] | None = None
    amount: Annotated[float, Field(strict=True, gt=0, lt=1_000_000_000, allow_inf_nan=False)] | None = None
    currency: Currency | None = None
    interval_months: Literal[1, 2, 3, 6, 12] | None = None
    first_due: DateParts | None = None
    until: DateParts | None = None
    duration_months: Annotated[StrictInt, Field(ge=1, le=1200)] | None = None
    plan_name: Annotated[str, Field(min_length=1, max_length=120)] | None = None
    note: Annotated[str, Field(max_length=500)] | None = None

    @field_validator("interval_months", mode="before")
    @classmethod
    def supported_interval(cls, value):
        if value is not None and type(value) is not int:
            raise ValueError("Use an integer interval")
        return value

    @model_validator(mode="after")
    def consistent_entry(self):
        if self.kind == "payment" and (self.category == "subscription" or self.plan_name is not None):
            raise ValueError("A payment cannot contain subscription fields")
        if self.kind == "subscription" and (self.category not in (None, "subscription") or self.note is not None):
            raise ValueError("Invalid subscription category")
        if self.until is not None and self.duration_months is not None:
            raise ValueError("Use one end condition")
        if self.first_due and self.until:
            start = self.first_due
            end = self.until
            if all(part is not None for part in (start.year, start.month, start.day, end.year, end.month)):
                end_day = end.day or monthrange(end.year, end.month)[1]
                if date(end.year, end.month, end_day) < date(start.year, start.month, start.day):
                    raise ValueError("End precedes the first payment")
        return self

    def missing_fields(self) -> list[str]:
        missing = [field for field in ("name", "category", "amount", "currency", "interval_months")
                   if getattr(self, field) is None]
        if self.first_due is None or self.first_due.day is None:
            missing.append("first_due")
        elif self.interval_months in (2, 3, 6, 12) and self.first_due.month is None:
            missing.append("first_due")
        return missing


MissingField = Literal["name", "category", "amount", "currency", "interval_months", "first_due"]


class ParseRequest(ChatModel):
    text: str = Field(min_length=1, max_length=2000)
    language: Literal["pl", "en"]
    today: date
    default_currency: Currency
    context: list[Annotated[str, Field(min_length=1, max_length=2000)]] = Field(default_factory=list, max_length=6)
    draft: EntryDraft | None = None

    @field_validator("today", mode="before")
    @classmethod
    def iso_calendar_date(cls, value):
        if type(value) is date:
            return value
        if not isinstance(value, str) or len(value) != 10:
            raise ValueError("Use YYYY-MM-DD")
        parsed = date.fromisoformat(value)
        if parsed.isoformat() != value:
            raise ValueError("Use YYYY-MM-DD")
        return parsed


class ProposalResult(ChatModel):
    kind: Literal["proposal"]
    draft: EntryDraft
    missing: list[MissingField] = Field(max_length=6)

    @model_validator(mode="after")
    def accurate_missing_fields(self):
        if len(set(self.missing)) != len(self.missing) or set(self.missing) != set(self.draft.missing_fields()):
            raise ValueError("Missing fields do not match the draft")
        return self


class QuestionResult(ChatModel):
    kind: Literal["question"]
    question: Literal["month_total", "next_due", "subscriptions_total"]


class ClarificationResult(ChatModel):
    kind: Literal["clarify"]
    reason: Literal["entry_type", "multiple_entries"]


class UnsupportedResult(ChatModel):
    kind: Literal["not_supported"]
    reason: Literal["one_off", "weekly", "interval", "currency", "edit_by_chat", "delete_by_chat", "unrelated", "test_message"]


ParseResult = Annotated[
    ProposalResult | QuestionResult | ClarificationResult | UnsupportedResult,
    Field(discriminator="kind"),
]
parse_result_adapter = TypeAdapter(ParseResult)


class ResolvedEntry(PaymentCreate):
    model_config = ConfigDict(extra="forbid")
    kind: Literal["payment", "subscription"]
    category: PaymentCategory | Literal["subscription"]
    plan_name: Annotated[str, Field(min_length=1, max_length=120)] | None = None
    amount: Annotated[float, Field(strict=True, gt=0, lt=1_000_000_000, allow_inf_nan=False)]

    @field_validator("interval_months", mode="before")
    @classmethod
    def strict_interval(cls, value):
        return EntryDraft.supported_interval(value)

    @field_validator("start_date", "end_date", mode="before")
    @classmethod
    def calendar_date(cls, value):
        return None if value is None else ParseRequest.iso_calendar_date(value)

    @model_validator(mode="after")
    def valid_entry_kind(self):
        if self.kind == "subscription":
            if self.category != "subscription" or self.interval_months not in (1, 12) or self.note is not None:
                raise ValueError("Unsupported subscription schedule")
        elif self.category == "subscription" or self.plan_name is not None:
            raise ValueError("Invalid payment category")
        return self


class ChatResponse(ChatModel):
    mode: Literal["test"] = "test"
    result: ParseResult
    needs: list[MissingField | Literal["until"]] = Field(default_factory=list)
    entry: ResolvedEntry | None = None
    proposal_id: UUID | None = None
    overview: OverviewResponse | None = None


class ConfirmRequest(ChatModel):
    proposal_id: UUID
    entry: ResolvedEntry


class ConfirmResponse(ChatModel):
    kind: Literal["payment", "subscription"]
    id: int
