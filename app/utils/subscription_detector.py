import re
from urllib.parse import urlparse


SERVICE_HINTS = {
    "netflix": "Netflix",
    "spotify": "Spotify",
    "youtube": "YouTube Premium",
    "disney": "Disney+",
    "hbo": "HBO Max",
    "max.com": "Max",
    "apple": "Apple",
    "icloud": "iCloud",
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
    "monthly": ["monthly", "per month", "/month", "month", "miesięcznie", "co miesiąc"],
    "yearly": ["yearly", "annually", "per year", "/year", "rok", "rocznie", "co rok"],
}

PRICE_PATTERN = re.compile(
    r"(?:(PLN|USD|EUR|GBP)\s*)?(\d+[,.]\d{2})(?:\s*(zł|PLN|USD|EUR|GBP))?",
    re.IGNORECASE,
)


def normalize_text(text: str) -> str:
    return " ".join(text.lower().split())


def detect_service(text: str, url: str | None = None) -> str | None:
    source = text

    if url:
        hostname = urlparse(url).hostname or ""
        source = f"{hostname} {text}"

    for hint, service_name in SERVICE_HINTS.items():
        if hint.lower() in source.lower():
            return service_name

    return None


def detect_plan(text: str) -> str | None:
    normalized = normalize_text(text)

    for plan in PLAN_KEYWORDS:
        if plan in normalized:
            return plan.capitalize()

    return None


def detect_price(text: str) -> float | None:
    match = PRICE_PATTERN.search(text)

    if not match:
        return None

    raw_price = match.group(2)
    return float(raw_price.replace(",", "."))


def detect_currency(text: str) -> str | None:
    match = PRICE_PATTERN.search(text)

    if match:
        before_currency = match.group(1)
        after_currency = match.group(3)

        currency = before_currency or after_currency

        if currency:
            currency = currency.upper()
            if currency == "ZŁ":
                return "PLN"
            return currency

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