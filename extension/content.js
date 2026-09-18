/* global chrome */

const DEBUG = false;
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
  "wypróbuj",
  "wyprobuj",
  "okres próbny",
  "buy",
  "subscribe",
  "pay now",
  "checkout",
  "place order",
  "complete purchase",
  "confirm purchase",
  "start membership",
  "proceed to payment",
  "free trial",
  "start trial",
  "try free"
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

function buildCandidate(journeyData, serviceKey) {
  const data = journeyData || {};

  return {
    service_name: data.service_name || serviceKey,
    plan_name: data.plan_name || "",
    price: data.price ?? null,
    currency: data.currency || "PLN",
    billing_cycle: data.billing_cycle || "monthly",
    start_date: new Date().toISOString().split("T")[0],
    renewal_date: null,
    end_date: null,
    status: "confirmed",
    source: "detected",
    source_url: "",
    auto_renew: true
  };
}

async function isServiceAlreadySaved(serviceKey) {
  const entry = await getKeyStatus(serviceKey);

  return Boolean(entry && typeof entry === "object" && entry.status === "submitted");
}

async function queueDetection(serviceKey, candidate) {
  await savePendingDetection(candidate, serviceKey);

  const pending = await countPendingDetections();

  chrome.runtime
    .sendMessage({ type: "TRACKLY_DETECTION_PENDING", count: pending })
    .catch(() => {});
  debugLog("Kandydat czeka w popupie:", serviceKey, candidate);
}

async function collectAndMaybeOfferToast() {
  const token = await getToken();

  if (!token) {
    return;
  }

  const detected = detectCurrentPage();

  if (!detected) {
    return;
  }

  const pageUrl = window.location.href;
  const serviceKey = getServiceKey(detected, pageUrl);

  if (hasAnythingWorthSaving(detected)) {
    await rememberJourneyData(serviceKey, detected);
    debugLog("Zebrano dane:", serviceKey, detected);
  }

  if (!detected.is_subscription) {
    return;
  }

  if (!(await shouldPromptForKey(serviceKey))) {
    debugLog("Toast pominiety:", serviceKey, await getKeyStatus(serviceKey));
    return;
  }

  const candidate = buildCandidate(await getJourneyData(serviceKey), serviceKey);

  showDetectionToast(candidate, {
    onAccept: async () => {
      await queueDetection(serviceKey, candidate);
    },
    onDismiss: async () => {
      await markKeyAsDismissed(serviceKey);
      debugLog("Toast odrzucony, wyciszam serwis:", serviceKey);
    }
  });
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

  return PURCHASE_KEYWORDS.some((keyword) =>
    new RegExp(`(?<![\\p{L}\\p{N}])${keyword}(?![\\p{L}\\p{N}])`, "u").test(label)
  );
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

  const token = await getToken();

  if (!token) {
    return;
  }

  const pageUrl = window.location.href;
  const detected = detectCurrentPage() || {};
  const serviceKey = getServiceKey(detected, pageUrl);

  if (hasAnythingWorthSaving(detected)) {
    await rememberJourneyData(serviceKey, detected);
  }

  if (await isServiceAlreadySaved(serviceKey)) {
    debugLog("Zakup pominiety, serwis juz zapisany:", serviceKey);
    return;
  }

  debugLog("Wykryto klikniecie zakupu:", serviceKey);

  const candidate = buildCandidate(await getJourneyData(serviceKey), serviceKey);

  const alreadyPending = await hasPendingDetection(serviceKey);

  await queueDetection(serviceKey, candidate);
  hideDetectionToast();

  if (!alreadyPending) {
    showPageToast(
        `Zapisaliśmy ${candidate.service_name}. Otwórz Trackly z paska narzędzi, aby dokończyć.`,
        {variant: "success"}
    );
  }
}

function watchUrlChanges() {
  let lastUrl = window.location.href;

  setInterval(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      setTimeout(collectAndMaybeOfferToast, URL_WATCH_INTERVAL_MS);
    }
  }, URL_WATCH_INTERVAL_MS);
}

document.addEventListener("click", handlePossiblePurchaseClick, true);
watchUrlChanges();
setTimeout(collectAndMaybeOfferToast, 1000);
