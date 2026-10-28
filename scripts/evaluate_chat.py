import argparse
import json
from pathlib import Path

from pydantic import ValidationError

from app.schemas.assistant import ParseRequest, parse_result_adapter


CASES_PATH = Path(__file__).resolve().parents[1] / "tests" / "fixtures" / "chat_cases.json"


def normalize_result(value):
    result = parse_result_adapter.validate_python(value).model_dump(mode="json")
    if result["kind"] == "proposal":
        result["missing"] = sorted(result["missing"])
    return result


def flatten(value, prefix=""):
    fields = {}
    for key, item in value.items():
        path = f"{prefix}.{key}" if prefix else key
        if isinstance(item, dict):
            fields.update(flatten(item, path))
        else:
            fields[path] = item
    return fields


def load_cases(path=CASES_PATH):
    suite = json.loads(path.read_text(encoding="utf-8"))
    if suite.get("version") != 1 or not isinstance(suite.get("cases"), list) or not suite["cases"]:
        raise ValueError("Invalid test suite")
    ids = set()
    for case in suite["cases"]:
        case_id = case["id"]
        if type(case_id) is not int or case_id < 1 or case_id in ids:
            raise ValueError("Invalid or duplicate case ID")
        ids.add(case_id)
        ParseRequest.model_validate({
            "text": case["text"], "language": case["language"], "today": suite["today"],
            "default_currency": suite["default_currency"][case["language"]],
        })
        expected = flatten(normalize_result(case["expected"]))
        for field, alternatives in case.get("alternatives", {}).items():
            if field not in ("draft.name", "draft.category") or field not in expected:
                raise ValueError("Unsupported alternative field")
            if not alternatives or any(not isinstance(item, str) for item in alternatives):
                raise ValueError("Invalid alternatives")
            for alternative in alternatives:
                variant = json.loads(json.dumps(case["expected"]))
                variant["draft"][field.split(".")[1]] = alternative
                normalize_result(variant)
    return suite


def evaluate(suite, results):
    if not isinstance(results, list):
        raise ValueError("Results must be an array")
    cases = {case["id"]: case for case in suite["cases"]}
    by_id = {}
    for item in results:
        if not isinstance(item, dict) or set(item) != {"id", "result"}:
            raise ValueError("Each result requires only id and result")
        case_id = item["id"]
        if type(case_id) is not int or case_id not in cases or case_id in by_id:
            raise ValueError("Unknown or duplicate result ID")
        by_id[case_id] = item["result"]

    report = []
    for case_id, case in cases.items():
        if case_id not in by_id:
            report.append({"id": case_id, "status": "missing", "fields": []})
            continue
        try:
            actual = flatten(normalize_result(by_id[case_id]))
        except ValidationError as error:
            fields = sorted({".".join(map(str, item["loc"])) or "result"
                             for item in error.errors(include_input=False, include_context=False)})
            report.append({"id": case_id, "status": "invalid", "fields": fields})
            continue
        expected = flatten(normalize_result(case["expected"]))
        alternatives = case.get("alternatives", {})
        mismatches = [field for field in sorted(expected.keys() | actual.keys())
                      if field not in actual or field not in expected
                      or (actual[field] != expected[field] and actual[field] not in alternatives.get(field, []))]
        report.append({"id": case_id, "status": "failed" if mismatches else "passed", "fields": mismatches})

    return {
        "total": len(cases),
        "submitted": len(by_id),
        "passed": sum(item["status"] == "passed" for item in report),
        "cases": report,
    }


def main():
    parser = argparse.ArgumentParser(description="Validate chat cases or score saved parsing results without network calls.")
    parser.add_argument("results", nargs="?", type=Path)
    args = parser.parse_args()
    try:
        suite = load_cases()
        if args.results is None:
            print(f"{len(suite['cases'])} chat cases validated. No model was called or evaluated.")
            return 0
        report = evaluate(suite, json.loads(args.results.read_text(encoding="utf-8")))
    except (OSError, ValueError, KeyError, TypeError):
        print("Invalid test suite or results file. Check the documented format.")
        return 2
    print(json.dumps(report, indent=2))
    return 0 if report["passed"] == report["total"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
