from calendar import monthrange
from datetime import date


def month_index(day: date) -> int:
    return day.year * 12 + day.month - 1


def add_months(start: date, months: int) -> date:
    year, month = divmod(month_index(start) + months, 12)
    month += 1
    return date(year, month, min(start.day, monthrange(year, month)[1]))


def due_in_month(anchor: date, interval_months: int, year: int, month: int,
                 start: date | None = None, end: date | None = None) -> date | None:
    months = year * 12 + month - 1 - month_index(anchor)

    if months % interval_months:
        return None

    due = add_months(anchor, months)

    if (start and due < start) or (end and due > end):
        return None

    return due


def next_due(anchor: date, interval_months: int, today: date,
             start: date | None = None, end: date | None = None) -> date | None:
    earliest = max(today, start) if start else today
    steps = (month_index(earliest) - month_index(anchor)) // interval_months
    due = add_months(anchor, steps * interval_months)

    while due < earliest:
        steps += 1
        due = add_months(anchor, steps * interval_months)

    if end and due > end:
        return None

    return due
