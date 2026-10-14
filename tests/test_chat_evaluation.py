from copy import deepcopy
import json
import subprocess
import sys

import pytest

from scripts.evaluate_chat import evaluate, load_cases, normalize_result


def saved_results(suite):
    return [{"id": case["id"], "result": deepcopy(case["expected"])} for case in suite["cases"]]


def test_all_50_cases_are_valid_and_reference_answers_pass_the_scorer():
    suite = load_cases()
    assert {case["id"] for case in suite["cases"]} == set(range(1, 51))
    assert {case["language"] for case in suite["cases"]} == {"pl", "en"}
    report = evaluate(suite, saved_results(suite))
    assert (report["passed"], report["submitted"], report["total"]) == (50, 50, 50)


@pytest.mark.parametrize("case_id", [1, 4, 5, 13, 15, 18, 21, 22, 23, 24, 25, 34, 35, 40, 41, 46, 50])
def test_implicit_monthly_billing_is_never_accepted(case_id):
    suite = load_cases()
    case = next(case for case in suite["cases"] if case["id"] == case_id)
    expected = normalize_result(case["expected"])
    assert expected["draft"]["interval_months"] is None
    assert "interval_months" in expected["missing"]
    candidate = deepcopy(expected)
    candidate["draft"]["interval_months"] = 1
    candidate["missing"].remove("interval_months")
    row = next(row for row in evaluate(suite, [{"id": case_id, "result": candidate}])["cases"] if row["id"] == case_id)
    assert row["status"] == "failed"
    assert "draft.interval_months" in row["fields"]


@pytest.mark.parametrize("case_id", [1, 24, 25])
def test_paid_without_a_date_does_not_mean_today(case_id):
    expected = normalize_result(load_cases()["cases"][case_id - 1]["expected"])
    assert expected["draft"]["first_due"] is None
    assert "first_due" in expected["missing"]


def test_explicit_today_is_preserved_but_does_not_imply_recurrence():
    expected = normalize_result(load_cases()["cases"][39]["expected"])
    assert expected["draft"]["first_due"] == {"year": 2026, "month": 10, "day": 7}
    assert expected["missing"] == ["interval_months"]


def test_scorer_accepts_only_named_alternatives_and_ignores_missing_field_order():
    suite = load_cases()
    results = saved_results(suite)
    results[2]["result"]["draft"]["name"] = "Czynsz"
    results[0]["result"]["missing"].reverse()
    assert evaluate(suite, results)["passed"] == 50
    results[2]["result"]["draft"]["name"] = "Unrelated service"
    report = evaluate(suite, results)
    assert report["passed"] == 49
    assert report["cases"][2]["fields"] == ["draft.name"]


@pytest.mark.parametrize("field,value", [("amount", 2401), ("currency", "USD"), ("plan_name", "Invented plan")])
def test_wrong_numbers_currency_and_invented_fields_cannot_pass(field, value):
    suite = load_cases()
    results = saved_results(suite)
    results[13]["result"]["draft"][field] = value
    report = evaluate(suite, results)
    assert report["passed"] == 49
    assert report["cases"][13]["status"] == "failed"


def test_missing_or_invalid_results_count_against_the_full_suite():
    suite = load_cases()
    report = evaluate(suite, [{"id": 1, "result": {"kind": "unexpected", "private": "do-not-print-this"}}])
    assert (report["total"], report["submitted"], report["passed"]) == (50, 1, 0)
    assert report["cases"][0]["status"] == "invalid"
    assert all(row["status"] == "missing" for row in report["cases"][1:])
    assert "do-not-print-this" not in json.dumps(report)


@pytest.mark.parametrize("results", [
    {}, [{"id": 1, "result": {}}, {"id": 1, "result": {}}], [{"id": 51, "result": {}}],
    [{"id": True, "result": {}}], [{"id": "1", "result": {}}], [{"id": 1, "result": {}, "extra": True}],
])
def test_duplicate_unknown_or_malformed_results_are_rejected(results):
    with pytest.raises(ValueError):
        evaluate(load_cases(), results)


def test_schema_errors_do_not_include_message_contents():
    suite = load_cases()
    candidate = deepcopy(suite["cases"][0]["expected"])
    candidate["draft"]["amount"] = "private-value-never-print"
    report = evaluate(suite, [{"id": 1, "result": candidate}])
    assert report["cases"][0]["status"] == "invalid"
    assert "private-value-never-print" not in json.dumps(report)


def test_cli_validates_cases_without_a_model_and_reports_missing_results(tmp_path):
    command = [sys.executable, "-m", "scripts.evaluate_chat"]
    validation = subprocess.run(command, capture_output=True, text=True, check=False)
    assert validation.returncode == 0
    assert "No model was called or evaluated" in validation.stdout
    results_path = tmp_path / "results.json"
    results_path.write_text("[]")
    incomplete = subprocess.run([*command, str(results_path)], capture_output=True, text=True, check=False)
    assert incomplete.returncode == 1
    assert json.loads(incomplete.stdout)["passed"] == 0
    results_path.write_text('{"private":')
    malformed = subprocess.run([*command, str(results_path)], capture_output=True, text=True, check=False)
    assert malformed.returncode == 2
    assert "Traceback" not in malformed.stderr
