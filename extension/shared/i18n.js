function t(key, substitutions) {
  return chrome.i18n.getMessage(key, substitutions) || key;
}

function uiLanguage() {
  return chrome.i18n.getUILanguage();
}

function isPolishUi() {
  return uiLanguage().toLowerCase().startsWith("pl");
}

function defaultCurrency() {
  const language = uiLanguage().toLowerCase();

  if (language.startsWith("pl")) {
    return "PLN";
  }

  if (language === "en-gb") {
    return "GBP";
  }

  return language.startsWith("en") ? "USD" : "EUR";
}

function formatAmount(value) {
  const amount = Math.round(Number(value) * 100) / 100;

  return amount.toLocaleString(uiLanguage(), {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2
  });
}

function applyTranslations(root = document) {
  document.documentElement.lang = isPolishUi() ? "pl" : "en";

  root.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });

  root.querySelectorAll("[data-i18n-title]").forEach((element) => {
    element.title = t(element.dataset.i18nTitle);
  });

  root.querySelectorAll("[data-i18n-label]").forEach((element) => {
    element.setAttribute("aria-label", t(element.dataset.i18nLabel));
  });

  root.querySelectorAll("[data-i18n-href]").forEach((element) => {
    element.href = t(element.dataset.i18nHref);
  });
}
