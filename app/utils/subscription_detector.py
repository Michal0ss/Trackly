import re
from urllib.parse import urlparse


SERVICE_HINTS = {
    "netflix": "Netflix",
    "spotify": "Spotify",
    "youtube": "YouTube Premium",
    "disney": "Disney+",
    "hbo": "HBO Max",
    "max.com": "Max",
    "icloud": "iCloud",
    "apple": "Apple",
    "adobe": "Adobe",
    "microsoft": "Microsoft",
    "github": "GitHub",
}

PLAN_KEYWORDS = [
    "basic",
    "standard",
    "premium",
    "family",
    "individual",
    "student",
    "pro",
    "plus",
    "ultimate",
    "business",
]

BILLING_CYCLE_HINTS = {
    "monthly": ["monthly", "per month", "/month", "/mies", "miesięcznie", "co miesiąc"],
    "yearly": ["yearly", "annually", "per year", "/year", "/rok", "rocznie", "co rok"],
}

CURRENCY_MAP = {
    "ZŁ": "PLN",
    "€": "EUR",
    "$": "USD",
    "£": "GBP",
}

PRICE_PATTERN = re.compile(
    r"(?:(?P<cur_before>zł|PLN|USD|EUR|GBP|€|\$|£)\s*)?(?P<amount>\d{1,4}[,.]\d{2})(?:\s*(?P<cur_after>zł|PLN|USD|EUR|GBP|€|\$|£))?",
    re.IGNORECASE,
)


def normalize_text(text: str) -> str:
    return " ".join(text.lower().split())


def detect_service(text: str, url: str | None = None) -> str | None:
    if url:
        hostname = (urlparse(url).hostname or "").lower()

        for hint, service_name in SERVICE_HINTS.items():
            if hint in hostname:
                return service_name

    lowered = text.lower()

    for hint, service_name in SERVICE_HINTS.items():
        if hint in lowered:
            return service_name

    return None


def detect_plan(text: str) -> str | None:
    normalized = normalize_text(text)

    for plan in PLAN_KEYWORDS:
        if re.search(rf"\b{plan}\b", normalized):
            return plan.capitalize()

    return None


def find_price_match(text: str):
    for match in PRICE_PATTERN.finditer(text):
        if match.group("cur_before") or match.group("cur_after"):
            return match

    return None


def detect_price(text: str) -> float | None:
    match = find_price_match(text)

    if not match:
        return None

    return float(match.group("amount").replace(",", "."))


def detect_currency(text: str) -> str | None:
    match = find_price_match(text)

    if match:
        currency = (match.group("cur_before") or match.group("cur_after")).upper()
        return CURRENCY_MAP.get(currency, currency)

    normalized = normalize_text(text)

    if "zł" in normalized or "pln" in normalized:
        return "PLN"

    return None


def detect_billing_cycle(text: str) -> str | None:
    normalized = normalize_text(text)

    for cycle, hints in BILLING_CYCLE_HINTS.items():
        if any(hint in normalized for hint in hints):
            return cycle

    return None


def calculate_confidence(service_name: str | None, plan_name: str | None, price: float | None, currency: str | None, billing_cycle: str | None) -> float:
    score = 0.0

    if service_name:
        score += 0.3
    if plan_name:
        score += 0.2
    if price:
        score += 0.25
    if currency:
        score += 0.15
    if billing_cycle:
        score += 0.1

    return min(score, 1.0)


def detect_subscription_from_text(text: str, url: str | None = None) -> dict:
    normalized = normalize_text(text)

    service_name = detect_service(normalized, url)
    plan_name = detect_plan(normalized)
    price = detect_price(text)
    currency = detect_currency(text)
    billing_cycle = detect_billing_cycle(normalized)

    confidence = calculate_confidence(
        service_name,
        plan_name,
        price,
        currency,
        billing_cycle,
    )

    is_subscription = confidence >= 0.5

    return {
        "is_subscription": is_subscription,
        "service_name": service_name,
        "plan_name": plan_name,
        "price": price,
        "currency": currency,
        "billing_cycle": billing_cycle,
        "confidence": confidence,
    }