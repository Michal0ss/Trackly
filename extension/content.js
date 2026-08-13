/* global chrome */

const DEBUG = true;

const PENDING_PURCHASE_KEY = "pending_purchase";
const PENDING_PURCHASE_TTL_MS = 10 * 60 * 1000;
const URL_WATCH_INTERVAL_MS = 1000;
const MAX_CONTROL_TEXT_LENGTH = 60;

const PURCHASE_KEYWORDS = [
  "kup",
  "kupuję",
  "zamawiam",
  "zamów",
  "zapłać",
  "subskrybuj",
  "wykup",
  "rozpocznij subskrypcję",
  "przejdź do płatności",
  "potwierdź zakup",
  "buy",
  "subscribe",
  "pay now",
  "checkout",
  "place order",
  "complete purchase",
  "confirm purchase",
  "start membership",
  "proceed to payment"
];

function debugLog(...args) {
  if (DEBUG) {
    console.log("[Trackly]", ...args);
  }
}

function getServiceKey(detected, pageUrl) {
  if (detected.service_name) {
    return detected.service_name.toLowerCase();
  }

  try {
    return new URL(pageUrl).hostname;
  } catch {
    return "unknown";
  }
}

function detectCurrentPage() {
  const pageText = document.body ? document.body.innerText.trim() : "";

  if (!pageText) {
    return null;
  }

  return detectSubscriptionFromText(pageText.slice(0, 10000), window.location.href);
}

function hasAnythingWorthSaving(detected) {
  return Boolean(
    detected.service_name ||
    detected.plan_name ||
    detected.price ||
    detected.billing_cycle
  );
}

function getPendingPurchase() {
  return new Promise((resolve) => {
    chrome.storage.local.get([PENDING_PURCHASE_KEY], (result) => {
      resolve(result[PENDING_PURCHASE_KEY] || null);
    });
  });
}

function setPendingPurchase(serviceKey) {
  return new Promise((resolve) => {
    chrome.storage.local.set(
      { [PENDING_PURCHASE_KEY]: { service_key: serviceKey, created_at: Date.now() } },
      resolve
    );
  });
}

function clearPendingPurchase() {
  return new Promise((resolve) => {
    chrome.storage.local.remove(PENDING_PURCHASE_KEY, resolve);
  });
}

function buildCandidate(journeyData, serviceKey, pageUrl) {
  const data = journeyData || {};

  return {
    service_name: data.service_name || serviceKey,
    plan_name: data.plan_name || "",
    price: data.price ?? null,
    currency: data.currency || "PLN",
    billing_cycle: data.billing_cycle || "monthly",
    renewal_date: null,
    status: "confirmed",
    source: "detected",
    source_url: pageUrl,
    auto_renew: true
  };
}

async function showPurchaseForm(serviceKey) {
  if (!(await shouldPromptForKey(serviceKey))) {
    debugLog("Formularz pominięty — serwis zapisany lub wyciszony:", serviceKey);
    return;
  }

  const token = await getToken();

  if (!token) {
    debugLog("Formularz pominięty — użytkownik niezalogowany");
    return;
  }

  const journeyData = await getJourneyData(serviceKey);
  const candidate = buildCandidate(journeyData, serviceKey, window.location.href);

  debugLog("Pokazuję formularz zakupu:", candidate);

  showSubscriptionForm(
    candidate,
    async (payload) => {
      try {
        await createSubscriptionRequest(token, payload);
        await markKeyAsSubmitted(serviceKey);
        await clearJourneyData(serviceKey);
        showSuccess(`Subskrypcja ${payload.service_name} została dodana.`);
      } catch (error) {
        console.error("Failed to create subscription:", error);
        showError(`Nie udało się dodać subskrypcji: ${error.message}`);
      }
    },
    {
      title: "Zapisz subskrypcję",
      submitLabel: "Zapisz",
      onClose: () => markKeyAsDismissed(serviceKey)
    }
  );

  await clearPendingPurchase();
}

function looksLikePurchaseControl(control) {
  const label = (control.innerText || control.value || control.getAttribute("aria-label") || "")
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .join(" ");

  if (!label || label.length > MAX_CONTROL_TEXT_LENGTH) {
    return false;
  }

  return PURCHASE_KEYWORDS.some((keyword) => label.includes(keyword));
}

async function handlePossiblePurchaseClick(event) {
  const target = event.target;

  if (!target || typeof target.closest !== "function") {
    return;
  }

  const control = target.closest(
    "button, a, [role='button'], input[type='submit'], input[type='button']"
  );

  if (!control || !looksLikePurchaseControl(control)) {
    return;
  }

  const detected = detectCurrentPage() || {};
  const serviceKey = getServiceKey(detected, window.location.href);

  debugLog("Wykryto kliknięcie zakupu:", serviceKey);

  await setPendingPurchase(serviceKey);
  await showPurchaseForm(serviceKey);
}

async function resumePendingPurchase(serviceKey) {
  const pending = await getPendingPurchase();

  if (!pending) {
    return;
  }

  if (Date.now() - pending.created_at > PENDING_PURCHASE_TTL_MS) {
    await clearPendingPurchase();
    return;
  }

  if (pending.service_key !== serviceKey) {
    return;
  }

  debugLog("Wznawiam formularz po przejściu na kolejną stronę:", serviceKey);
  await showPurchaseForm(serviceKey);
}

async function runCollectionFlow() {
  const token = await getToken();

  if (!token) {
    return;
  }

  const detected = detectCurrentPage();

  if (!detected) {
    return;
  }

  const serviceKey = getServiceKey(detected, window.location.href);

  if (hasAnythingWorthSaving(detected)) {
    await rememberJourneyData(serviceKey, detected, window.location.href);
    debugLog("Zebrano dane:", serviceKey, detected);
  }

  await resumePendingPurchase(serviceKey);
}

function watchUrlChanges() {
  let lastUrl = window.location.href;

  setInterval(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      setTimeout(runCollectionFlow, URL_WATCH_INTERVAL_MS);
    }
  }, URL_WATCH_INTERVAL_MS);
}

document.addEventListener("click", handlePossiblePurchaseClick, true);
watchUrlChanges();
setTimeout(runCollectionFlow, 1000);