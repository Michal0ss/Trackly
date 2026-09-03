from app.utils.subscription_detector import (
    detect_billing_cycle,
    detect_currency,
    detect_plan,
    detect_price,
    detect_service,
    detect_subscription_from_text,
)


#cena i waluta

def test_date_is_not_a_price():
    assert detect_price("Ostatnia aktualizacja 21.07.2026") is None


def test_version_number_is_not_a_price():
    assert detect_price("wersja 2.15 aplikacji") is None


def test_price_with_currency_after():
    assert detect_price("19,99 zł miesięcznie") == 19.99


def test_price_with_currency_before():
    assert detect_price("PLN 43,00") == 43.0


def test_price_skips_date_and_finds_real_price():
    text = "Twój plan odnowi się 12.05.2026, cena 29,99 zł"
    assert detect_price(text) == 29.99
    assert detect_currency(text) == "PLN"


def test_currency_symbols_are_mapped():
    assert detect_currency("€10.99/month") == "EUR"
    assert detect_currency("$9.99 per month") == "USD"


def test_currency_fallback_pln():
    assert detect_currency("płatność w zł") == "PLN"


def test_price_with_zl_without_diacritic():
    assert detect_price("26,99 zl miesiecznie") == 26.99
    assert detect_currency("26,99 zl miesiecznie") == "PLN"
    assert detect_price("zl 43,00") == 43.0


def test_zl_inside_a_word_is_not_a_currency():
    assert detect_currency("zlecenie na kwote 12,99 bez waluty") is None
    assert detect_currency("faktura 99,99 zlecenia dodatkowe") is None


#plan

def test_plan_not_matched_inside_words():
    assert detect_plan("zmień swój profil, sprawdź program i promocje") is None


def test_plan_matched_as_word():
    assert detect_plan("GitHub Pro 4.00 USD") == "Pro"
    assert detect_plan("Plan Premium - 43,00 zł") == "Premium"


def test_plan_not_matched_before_polish_ending():
    assert detect_plan("plan ma same plusów i zalet") is None
    assert detect_plan("nasze plusy to niska cena") is None


def test_bare_family_noun_is_not_a_plan():
    assert detect_plan("cała rodzina moze korzystac z konta") is None
    assert detect_plan("Spotify Premium Rodzinny") == "Premium"


#cykl rozliczen

def test_year_mention_is_not_yearly_billing():
    assert detect_billing_cycle("nagrodzony w 2026 roku film") is None


def test_polish_abbreviations():
    assert detect_billing_cycle("49,99 zł/mies.") == "monthly"
    assert detect_billing_cycle("349 zł/rok") == "yearly"


def test_english_cycles():
    assert detect_billing_cycle("billed monthly") == "monthly"
    assert detect_billing_cycle("$99 per year") == "yearly"


#serwis

def test_hostname_wins_over_text():
    assert detect_service("posłuchaj też na spotify", "https://www.youtube.com/premium") == "YouTube Premium"


def test_icloud_before_apple():
    assert detect_service("zaloguj się swoim apple id", "https://www.icloud.com/") == "iCloud"


def test_unknown_domain_and_text():
    assert detect_service("plan premium bez nazwy serwisu", "https://sklep.przyklad.pl/") is None


#integracyjnie

def test_full_detection_netflix():
    result = detect_subscription_from_text(
        "Netflix Premium 43,00 zł/mies.",
        url="https://www.netflix.com/account",
    )
    assert result["is_subscription"] is True
    assert result["service_name"] == "Netflix"
    assert result["plan_name"] == "Premium"
    assert result["price"] == 43.0
    assert result["currency"] == "PLN"
    assert result["billing_cycle"] == "monthly"


def test_page_without_subscription_data():
    result = detect_subscription_from_text(
        "regulamin serwisu i polityka prywatności",
        url="https://www.netflix.com/legal",
    )
    assert result["is_subscription"] is False