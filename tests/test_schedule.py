from datetime import date

from app.utils.schedule import add_months, due_in_month, next_due


def test_add_months_keeps_the_day_or_uses_the_last_day_of_a_shorter_month():
    assert add_months(date(2026, 1, 31), 1) == date(2026, 2, 28)
    assert add_months(date(2028, 1, 31), 1) == date(2028, 2, 29)
    assert add_months(date(2026, 1, 31), 2) == date(2026, 3, 31)
    assert add_months(date(2026, 3, 31), -1) == date(2026, 2, 28)


def test_add_months_crosses_year_boundaries():
    assert add_months(date(2026, 12, 15), 1) == date(2027, 1, 15)
    assert add_months(date(2026, 1, 10), -1) == date(2025, 12, 10)
    assert add_months(date(2026, 3, 20), 24) == date(2028, 3, 20)


def test_due_in_month_follows_the_interval():
    assert due_in_month(date(2026, 1, 10), 1, 2026, 10) == date(2026, 10, 10)
    assert due_in_month(date(2026, 1, 15), 2, 2026, 2) is None
    assert due_in_month(date(2026, 1, 15), 2, 2026, 3) == date(2026, 3, 15)
    assert due_in_month(date(2026, 3, 20), 12, 2027, 3) == date(2027, 3, 20)
    assert due_in_month(date(2026, 3, 20), 12, 2026, 10) is None


def test_due_in_month_respects_start_and_end():
    assert due_in_month(date(2026, 5, 1), 1, 2026, 4, start=date(2026, 5, 1)) is None
    assert due_in_month(date(2025, 1, 5), 1, 2026, 10, end=date(2026, 9, 5)) is None
    assert due_in_month(date(2025, 1, 5), 1, 2026, 9, end=date(2026, 9, 5)) == date(2026, 9, 5)


def test_due_in_month_counts_back_from_a_future_renewal_date():
    assert due_in_month(date(2026, 11, 3), 1, 2026, 10) == date(2026, 10, 3)
    assert due_in_month(date(2026, 11, 3), 1, 2026, 10, start=date(2026, 10, 15)) is None


def test_next_due_returns_the_first_date_from_today():
    assert next_due(date(2026, 1, 10), 1, date(2026, 10, 6)) == date(2026, 10, 10)
    assert next_due(date(2026, 1, 10), 1, date(2026, 10, 10)) == date(2026, 10, 10)
    assert next_due(date(2026, 1, 10), 1, date(2026, 10, 11)) == date(2026, 11, 10)
    assert next_due(date(2026, 12, 22), 12, date(2026, 10, 6)) == date(2026, 12, 22)
    assert next_due(date(2027, 3, 1), 1, date(2026, 10, 6)) == date(2026, 11, 1)


def test_next_due_respects_start_and_end():
    assert next_due(date(2026, 12, 1), 1, date(2026, 10, 6), start=date(2026, 12, 1)) == date(2026, 12, 1)
    assert next_due(date(2025, 1, 5), 1, date(2026, 10, 6), end=date(2026, 9, 5)) is None
    assert next_due(date(2026, 1, 31), 1, date(2026, 2, 1)) == date(2026, 2, 28)
