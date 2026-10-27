from calendar import monthrange
from datetime import date
from uuid import uuid4

from app.schemas.assistant import ChatResponse, ProposalResult, ResolvedEntry
from app.utils.schedule import add_months


def resolve_proposal(result):
    response = ChatResponse(result=result)
    if not isinstance(result, ProposalResult):
        return response
    draft = result.draft
    response.needs = list(result.missing)
    first = draft.first_due
    if first is None or first.year is None or first.month is None or first.day is None:
        if "first_due" not in response.needs:
            response.needs.append("first_due")
    if draft.until and (draft.until.year is None or draft.until.month is None):
        response.needs.append("until")
    if response.needs:
        return response
    if draft.kind == "subscription" and draft.interval_months not in (1, 12):
        return ChatResponse(result={"kind": "not_supported", "reason": "interval"})
    start = date(first.year, first.month, first.day)
    end = None
    if draft.until:
        ending = draft.until
        end = date(ending.year, ending.month, ending.day or monthrange(ending.year, ending.month)[1])
    elif draft.duration_months:
        try:
            end = add_months(start, ((draft.duration_months - 1) // draft.interval_months) * draft.interval_months)
        except (ValueError, OverflowError):
            response.needs = ["until"]
            return response
    if end and end < start:
        response.needs = ["until"]
        return response
    response.entry = ResolvedEntry(
        kind=draft.kind, name=draft.name, category=draft.category, amount=draft.amount,
        currency=draft.currency, interval_months=draft.interval_months, start_date=start,
        end_date=end, plan_name=draft.plan_name, note=draft.note,
    )
    response.proposal_id = uuid4()
    return response
