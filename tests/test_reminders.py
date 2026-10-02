import json
import shutil
import subprocess
from pathlib import Path

import pytest

REMINDERS_JS = (Path(__file__).resolve().parents[1] / "extension" / "shared" / "reminders.js").read_text(encoding="utf-8")

pytestmark = pytest.mark.skipif(shutil.which("node") is None, reason="node is not installed")


def run_reminders(expression):
    script = REMINDERS_JS + f"\nprocess.stdout.write(JSON.stringify({expression}));"
    run = subprocess.run(["node", "-e", script], capture_output=True, text=True, check=True)
    return json.loads(run.stdout)


SUBSCRIPTIONS = """[
  {id: 1, status: "confirmed", auto_renew: true, renewal_date: "2026-10-03"},
  {id: 2, status: "confirmed", auto_renew: true, renewal_date: "2026-10-09"},
  {id: 3, status: "cancelled", auto_renew: true, renewal_date: "2026-10-02"},
  {id: 4, status: "confirmed", auto_renew: false, renewal_date: "2026-10-02"},
  {id: 5, status: "confirmed", auto_renew: true, renewal_date: "2026-09-30"},
  {id: 6, status: "confirmed", auto_renew: true, renewal_date: null}
]"""
NOW = "new Date(2026, 9, 1, 9, 0)"


def test_only_upcoming_active_renewals_are_due():
    due = run_reminders(f"dueReminders({SUBSCRIPTIONS}, {{}}, 3, {NOW}).map((item) => [item.sub.id, item.inDays])")

    assert due == [[1, 2]]


def test_a_longer_window_includes_later_renewals():
    due = run_reminders(f"dueReminders({SUBSCRIPTIONS}, {{}}, 7, {NOW}).map((item) => item.sub.id)")

    assert due == [1]


def test_window_edge_is_included():
    due = run_reminders(f"dueReminders({SUBSCRIPTIONS}, {{}}, 7, new Date(2026, 9, 2, 9, 0)).map((item) => item.sub.id)")

    assert due == [1, 2]


def test_a_sent_reminder_is_not_repeated():
    due = run_reminders(f'dueReminders({SUBSCRIPTIONS}, {{"1:2026-10-03": 1}}, 3, {NOW})')

    assert due == []


def test_renewal_today_is_due():
    due = run_reminders(f"dueReminders({SUBSCRIPTIONS}, {{}}, 1, new Date(2026, 9, 3, 9, 0)).map((item) => item.inDays)")

    assert due == [0]


def test_next_reminder_is_this_morning_or_tomorrow():
    before = run_reminders("new Date(nextReminderTime(new Date(2026, 9, 1, 7, 30))).getDate()")
    after = run_reminders("new Date(nextReminderTime(new Date(2026, 9, 1, 10, 0))).getDate()")

    assert before == 1
    assert after == 2


def test_old_sent_entries_are_pruned():
    kept = run_reminders(
        'Object.keys(pruneSentReminders({"old": new Date(2026, 6, 1).getTime(), "new": new Date(2026, 8, 20).getTime()}, '
        f"{NOW}))"
    )

    assert kept == ["new"]
