import json
import re
from pathlib import Path

EXTENSION = Path(__file__).resolve().parents[1] / "extension"
MANIFEST = json.loads((EXTENSION / "manifest.json").read_text(encoding="utf-8"))
LOCALES = {
    path.parent.name: json.loads(path.read_text(encoding="utf-8"))
    for path in (EXTENSION / "_locales").glob("*/messages.json")
}


def used_message_keys():
    keys = set()
    sources = [*EXTENSION.rglob("*.js"), *EXTENSION.rglob("*.html"), EXTENSION / "manifest.json"]

    for path in sources:
        text = path.read_text(encoding="utf-8")
        for call in re.findall(r"\bt\(([^()]*)\)", text):
            keys.update(re.findall(r'"([A-Za-z0-9_]+)"', call))
        for block in re.findall(r"_KEYS = [\[{](.*?)[\]}];", text, re.S):
            keys.update(re.findall(r'"([A-Za-z0-9_]+)"', block))
        keys.update(re.findall(r'data-i18n(?:-[a-z]+)?="([A-Za-z0-9_]+)"', text))
        keys.update(re.findall(r"__MSG_([A-Za-z0-9_]+)__", text))

    return keys


def test_polish_and_english_are_present():
    assert set(LOCALES) == {"pl", "en"}
    assert MANIFEST["default_locale"] in LOCALES


def test_both_languages_have_the_same_keys():
    assert set(LOCALES["pl"]) == set(LOCALES["en"])


def test_placeholders_match_between_languages():
    for key, entry in LOCALES["pl"].items():
        assert entry.get("placeholders", {}).keys() == LOCALES["en"][key].get("placeholders", {}).keys(), key


def test_every_key_used_in_the_extension_exists():
    missing = used_message_keys() - set(LOCALES["en"])

    assert not missing


def test_manifest_name_and_description_are_translated():
    assert MANIFEST["name"] == "__MSG_extName__"
    assert MANIFEST["description"] == "__MSG_extDescription__"


def test_notifications_stay_optional():
    assert "notifications" not in MANIFEST["permissions"]
    assert "notifications" in MANIFEST["optional_permissions"]
