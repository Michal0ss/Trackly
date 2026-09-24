import json
import re
import shutil
import subprocess
from pathlib import Path

import pytest

from app.utils.subscription_detector import (
    BILLING_CYCLE_HINTS,
    SERVICE_HINTS,
    detect_subscription_from_text,
)

EXTENSION = Path(__file__).resolve().parents[1] / "extension"
DETECTOR_JS = (EXTENSION / "shared" / "detector.js").read_text(encoding="utf-8")
LINKS_JS = (EXTENSION / "shared" / "service-links.js").read_text(encoding="utf-8")
CONTENT_JS = (EXTENSION / "content.js").read_text(encoding="utf-8")
MANIFEST = json.loads((EXTENSION / "manifest.json").read_text(encoding="utf-8"))

SERVICES_WITHOUT_LINK = {"Canal+", "SkyShowtime", "Storytel"}

PARITY_CASES = [
    ("Netflix Premium 43,00 zł/mies.", "https://www.netflix.com/account"),
    ("Standardowy 37 zł/miesiąc, Premium 75 zł/miesiąc", "https://www.netflix.com/pl/"),
    ("0 zł za 1 miesiąc, potem 26,99 zł/mies.", "https://www.spotify.com/pl/premium/"),
    ("plan roczny 69 zł za rok", "https://www.amazon.pl/amazonprime"),
    ("YouTube Premium Subskrypcje Historia", "https://www.youtube.com/watch?v=abc"),
    ("Ostatnia aktualizacja 21.07.2026, wersja 2.15", "https://www.netflix.com/legal"),
    ("€10.99/month Premium", "https://www.deezer.com/pl/offers"),
    ("zamówienie 12345 zł", "https://allegro.pl/smart"),
    ("Abonament 39,99 zł miesięcznie", "https://www.empik.com/go/abonament"),
    ("Plus $20 per month", "https://pay.openai.com/c/pay/cs_live_1"),
    ("26.99zł Individual", "https://tidal.com/pricing"),
    ("regulamin serwisu", None),
]


def js_object_pairs(source, name):
    body = re.search(rf"const {name} = \{{(.*?)\n\}};", source, re.S).group(1)
    return re.findall(r'"([^"]+)":\s*"([^"]+)"', body)


def manifest_hosts():
    return [re.match(r"\*://(?:\*\.)?([^/]+)/", pattern).group(1)
            for pattern in MANIFEST["content_scripts"][0]["matches"]]


def service_links():
    return [(re.findall(r'"([^"]+)"', keys), url)
            for keys, url in re.findall(r'match: \[([^\]]*)\], url: "([^"]+)"', LINKS_JS)]


def find_link(service_name):
    words = " ".join(re.sub(r"[^\w]+|_", " ", service_name.lower()).split())
    padded = f" {words} "
    for keys, url in service_links():
        if any(f" {key} " in padded for key in keys):
            return url
    return None


def test_service_hints_are_the_same_in_js_and_python():
    assert js_object_pairs(DETECTOR_JS, "SERVICE_HINTS") == list(SERVICE_HINTS.items())


def test_billing_cycle_hints_are_the_same_in_js_and_python():
    for cycle, hints in BILLING_CYCLE_HINTS.items():
        js_hints = re.search(rf"{cycle}: \[([^\]]*)\]", DETECTOR_JS).group(1)
        assert re.findall(r'"([^"]+)"', js_hints) == hints


def test_resource_and_script_matches_are_identical():
    assert MANIFEST["web_accessible_resources"][0]["matches"] == MANIFEST["content_scripts"][0]["matches"]


def test_every_manifest_host_has_a_service_name():
    hints = [hint.partition("/")[0] for hint in SERVICE_HINTS]
    for host in manifest_hosts():
        assert any(hint in host for hint in hints), host


def test_detection_paths_cover_only_manifest_hosts():
    domains = re.findall(r'^\s+"([a-z0-9.-]+)": \[', CONTENT_JS, re.M)
    hosts = manifest_hosts()
    assert domains
    for domain in domains:
        assert any(host == domain or host.endswith(f".{domain}") or domain.endswith(host) for host in hosts), domain


def test_every_detected_service_has_a_verified_link():
    for service_name in set(SERVICE_HINTS.values()) - SERVICES_WITHOUT_LINK:
        assert find_link(service_name), service_name


def test_services_without_a_verified_page_get_no_link():
    for service_name in SERVICES_WITHOUT_LINK:
        assert find_link(service_name) is None, service_name


def test_links_use_https():
    for _, url in service_links():
        assert url.startswith("https://"), url


def test_specific_links_win_over_general_ones():
    assert find_link("Prime Video") == "https://www.primevideo.com/settings"
    assert find_link("Amazon Prime") == "https://www.amazon.pl/gp/primecentral"
    assert find_link("Empik Go") == "https://www.empik.com/go/faq"
    assert find_link("spotify premium rodzinny") == "https://www.spotify.com/account/overview/"


@pytest.mark.skipif(shutil.which("node") is None, reason="node is not installed")
def test_js_detector_gives_the_same_results_as_python():
    script = DETECTOR_JS + (
        "\nconst cases = JSON.parse(process.argv[1]);"
        "\nprocess.stdout.write(JSON.stringify(cases.map(([text, url]) => detectSubscriptionFromText(text, url))));"
    )
    run = subprocess.run(["node", "-e", script, json.dumps(PARITY_CASES)],
                         capture_output=True, text=True, check=True)

    for (text, url), js_result in zip(PARITY_CASES, json.loads(run.stdout)):
        py_result = detect_subscription_from_text(text, url)
        assert js_result.pop("confidence") == pytest.approx(py_result.pop("confidence")), text
        assert js_result == py_result, text


DETECTION_ALLOWED = [
    "https://www.youtube.com/premium",
    "https://m.youtube.com/paid_memberships",
    "https://allegro.pl/smart/na-start",
    "https://www.apple.com/pl/apple-one/",
    "https://music.apple.com/pl/subscribe",
    "https://www.empik.com/go",
    "https://www.legimi.pl/cennik/",
    "https://www.amazon.pl/amazonprime",
    "https://github.com/settings/billing/summary",
    "https://www.xbox.com/pl-pl/games/store/xbox-game-pass-ultimate/cfq7ttc0khs0",
    "https://www.playstation.com/pl-pl/ps-plus/",
    "https://www.netflix.com/browse",
    "https://claude.ai/upgrade",
    "https://polsatboxgo.pl/pakiety",
]

DETECTION_BLOCKED = [
    "https://www.youtube.com/watch?v=abc",
    "https://allegro.pl/produkt/smartwatch-amazfit",
    "https://www.apple.com/pl/shop/buy-iphone/iphone-16",
    "https://www.empik.com/gotowanie",
    "https://www.legimi.pl/zakupy/koszyk/",
    "https://www.amazon.pl/dp/B0C1234567",
    "https://github.com/Michal0ss/Trackly/issues/1",
    "https://www.xbox.com/pl-pl/games/store/forza-horizon-5/9nkx70bbcdrn",
    "https://store.playstation.com/pl-pl/product/abc",
    "https://www.primevideo.com/detail/abc",
    "https://claude.ai/chat/123",
    "https://www.dropbox.com/home",
    "https://polsatboxgo.pl/wideo/sport/gala",
]


@pytest.mark.skipif(shutil.which("node") is None, reason="node is not installed")
def test_detection_runs_only_on_subscription_pages():
    paths = re.search(r"const DETECTION_PATHS = \{.*?\n\};", CONTENT_JS, re.S).group(0)
    func = re.search(r"function isDetectionPage\(url\) \{.*?\n\}", CONTENT_JS, re.S).group(0)
    script = DETECTOR_JS + "\n" + paths + "\n" + func + (
        "\nconst urls = JSON.parse(process.argv[1]);"
        "\nprocess.stdout.write(JSON.stringify(urls.map((url) => isDetectionPage(url))));"
    )
    urls = DETECTION_ALLOWED + DETECTION_BLOCKED
    run = subprocess.run(["node", "-e", script, json.dumps(urls)], capture_output=True, text=True, check=True)

    for url, allowed in zip(urls, json.loads(run.stdout)):
        assert allowed == (url in DETECTION_ALLOWED), url
