import re
from urllib.parse import urlparse


SERVICE_HINTS = {
    "netflix": "Netflix",
    "spotify": "Spotify",
    "youtube": "YouTube Premium",
    "disney": "Disney+",
    "hbo": "HBO Max",
    "max.com": "HBO Max",
    "skyshowtime": "SkyShowtime",
    "canalplus": "Canal+",
    "player.pl": "Player",
    "polsatboxgo": "Polsat Box Go",
    "crunchyroll": "Crunchyroll",
    "primevideo": "Prime Video",
    "amazon": "Amazon Prime",
    "music.apple": "Apple Music",
    "icloud": "iCloud",
    "apple": "Apple",
    "tidal": "TIDAL",
    "deezer": "Deezer",
    "storytel": "Storytel",
    "bookbeat": "BookBeat",
    "legimi": "Legimi",
    "empik.com/go": "Empik Go",
    "empik.com/premium": "Empik Premium",
    "openai": "ChatGPT",
    "claude": "Claude",
    "canva": "Canva",
    "notion": "Notion",
    "dropbox": "Dropbox",
    "one.google": "Google One",
    "duolingo": "Duolingo",
    "adobe": "Adobe",
    "microsoft": "Microsoft 365",
    "github": "GitHub",
    "nordvpn": "NordVPN",
    "surfshark": "Surfshark",
    "proton": "Proton",
    "playstation": "PlayStation Plus",
    "xbox": "Xbox Game Pass",
    "nintendo": "Nintendo Switch Online",
    "allegro": "Allegro Smart!",
}

PLAN_KEYWORDS = [
    "basic",
    "podstawowy",
    "podstawowa",
    "standard",
    "standardowy",
    "premium",
    "family",
    "rodzinny",
    "duo",
    "individual",
    "indywidualny",
    "student",
    "studencki",
    "pro",
    "plus",
    "ultimate",
    "business",
    "biznes",
]

BILLING_CYCLE_HINTS = {
    "monthly": ["monthly", "per month", "/month", "/mies", "miesięcznie", "co miesiąc", "za miesiąc"],
    "yearly": ["yearly", "annually", "per year", "/year", "/rok", "rocznie", "co rok", "za rok"],
}

CURRENCY_MAP = {
    "ZŁ": "PLN",
    "ZL": "PLN",
    "€": "EUR",
    "$": "USD",
    "£": "GBP",
}

PRICE_PATTERN = re.compile(
    r"(?:(?<!\w)(?P<cur_before>zł|zl|PLN|USD|EUR|GBP|€|\$|£)\s*)?(?<![\d.,])(?P<amount>\d{1,4}(?:[,.]\d{2})?)(?!\d)(?:\s*(?P<cur_after>zł|zl|PLN|USD|EUR|GBP|€|\$|£)(?!\w))?",
    re.IGNORECASE,
)


def normalize_text(text: str) -> str:
    return " ".join(text.lower().split())


def path_contains(path: str, rule: str) -> bool:
    segments = "/".join(part for part in path.lower().split("/") if part)
    return f"/{rule}/" in f"/{segments}/"


def hint_matches_url(hint: str, hostname: str, path: str) -> bool:
    host, slash, rule = hint.partition("/")

    if not slash:
        return hint in hostname

    return host in hostname and path_contains(path, rule)


def detect_service(text: str, url: str | None = None) -> str | None:
    if url:
        parsed = urlparse(url)
        hostname = (parsed.hostname or "").lower()

        for hint, service_name in SERVICE_HINTS.items():
            if hint_matches_url(hint, hostname, parsed.path):
                return service_name

    lowered = text.lower()

    for hint, service_name in SERVICE_HINTS.items():
        if "/" not in hint and hint in lowered:
            return service_name

    return None


def detect_plan(text: str) -> str | None:
    normalized = normalize_text(text)

    for plan in PLAN_KEYWORDS:
        if re.search(rf"\b{plan}\b", normalized):
            return plan.capitalize()

    return None


def find_price_match(text: str):
    """Zwraca dopasowanie ceny, które faktycznie ma przy sobie walutę,
    najbliższe wzmiance o cyklu rozliczenia. Gołe liczby bez waluty
    (oceny, wersje, daty) są odrzucane, bo w praktyce to głównie one
    trafiały jako "cena" przy naiwnym pierwszym dopasowaniu."""
    candidates = [
        match for match in PRICE_PATTERN.finditer(text)
        if (match.group("cur_before") or match.group("cur_after"))
        and float(match.group("amount").replace(",", ".")) > 0
    ]

    if not candidates:
        return None

    lowered = text.lower()
    cycle_positions = []

    for hints in BILLING_CYCLE_HINTS.values():
        for hint in hints:
            pos = lowered.find(hint)
            if pos != -1:
                cycle_positions.append(pos)

    if not cycle_positions:
        return candidates[0]

    return min(candidates, key=lambda m: min(abs(m.start() - pos) for pos in cycle_positions))


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

    if re.search(r"(?<!\w)(zł|zl|pln)(?!\w)", normalized):
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

    is_subscription = bool(price) and confidence >= 0.5

    return {
        "is_subscription": is_subscription,
        "service_name": service_name,
        "plan_name": plan_name,
        "price": price,
        "currency": currency,
        "billing_cycle": billing_cycle,
        "confidence": confidence,
    }