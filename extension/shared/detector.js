const CURRENCY_MAP = {
  "ZŁ": "PLN",
  "€": "EUR",
  "$": "USD",
  "£": "GBP"
};

const SERVICE_HINTS = {
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
  "github": "GitHub"
};

const PLAN_KEYWORDS = [
  "basic",
  "podstawowy",
  "podstawowa",
  "standard",
  "standardowy",
  "premium",
  "family",
  "rodzinny",
  "rodzina",
  "duo",
  "individual",
  "indywidualny",
  "student",
  "studencki",
  "pro",
  "plus",
  "ultimate",
  "business",
  "biznes"
];

const BILLING_CYCLE_HINTS = {
  monthly: ["monthly", "per month", "/month", "/mies", "miesięcznie", "co miesiąc"],
  yearly: ["yearly", "annually", "per year", "/year", "/rok", "rocznie", "co rok"]
};

const PRICE_PATTERN =
  /(?:(?<curBefore>zł|PLN|USD|EUR|GBP|€|\$|£)\s*)?(?<amount>\d{1,4}[,.]\d{2})(?:\s*(?<curAfter>zł|PLN|USD|EUR|GBP|€|\$|£))?/gi;

function normalizeText(text) {
  return text.toLowerCase().trim().split(/\s+/).join(" ");
}

function detectService(text, url) {
  if (url) {
    let hostname = "";

    try {
      hostname = new URL(url).hostname.toLowerCase();
    } catch {
      hostname = "";
    }

    for (const [hint, serviceName] of Object.entries(SERVICE_HINTS)) {
      if (hostname.includes(hint)) {
        return serviceName;
      }
    }
  }

  const lowered = text.toLowerCase();

  for (const [hint, serviceName] of Object.entries(SERVICE_HINTS)) {
    if (lowered.includes(hint)) {
      return serviceName;
    }
  }

  return null;
}

function detectPlan(text) {
  const normalized = normalizeText(text);

  for (const plan of PLAN_KEYWORDS) {
    if (new RegExp(`\\b${plan}\\b`).test(normalized)) {
      return plan.charAt(0).toUpperCase() + plan.slice(1);
    }
  }

  return null;
}

function findPriceMatch(text) {
  const candidates = [...text.matchAll(PRICE_PATTERN)].filter(
    (match) => match.groups.curBefore || match.groups.curAfter
  );

  if (!candidates.length) {
    return null;
  }

  const lowered = text.toLowerCase();
  const cyclePositions = [];

  for (const hints of Object.values(BILLING_CYCLE_HINTS)) {
    for (const hint of hints) {
      const pos = lowered.indexOf(hint);

      if (pos !== -1) {
        cyclePositions.push(pos);
      }
    }
  }

  if (!cyclePositions.length) {
    return candidates[0];
  }

  const distanceToNearestCycle = (match) =>
    Math.min(...cyclePositions.map((pos) => Math.abs(match.index - pos)));

  return candidates.reduce((best, match) =>
    distanceToNearestCycle(match) < distanceToNearestCycle(best) ? match : best
  );
}

function detectPrice(text) {
  const match = findPriceMatch(text);

  if (!match) {
    return null;
  }

  return parseFloat(match.groups.amount.replace(",", "."));
}

function detectCurrency(text) {
  const match = findPriceMatch(text);

  if (match) {
    const currency = (match.groups.curBefore || match.groups.curAfter).toUpperCase();
    return CURRENCY_MAP[currency] || currency;
  }

  const normalized = normalizeText(text);

  if (normalized.includes("zł") || normalized.includes("pln")) {
    return "PLN";
  }

  return null;
}

function detectBillingCycle(text) {
  const normalized = normalizeText(text);

  for (const [cycle, hints] of Object.entries(BILLING_CYCLE_HINTS)) {
    if (hints.some((hint) => normalized.includes(hint))) {
      return cycle;
    }
  }

  return null;
}

function calculateConfidence(serviceName, planName, price, currency, billingCycle) {
  let score = 0;

  if (serviceName) score += 0.3;
  if (planName) score += 0.2;
  if (price) score += 0.25;
  if (currency) score += 0.15;
  if (billingCycle) score += 0.1;

  return Math.min(score, 1.0);
}

function detectSubscriptionFromText(text, url = null) {
  const normalized = normalizeText(text);

  const serviceName = detectService(normalized, url);
  const planName = detectPlan(normalized);
  const price = detectPrice(text);
  const currency = detectCurrency(text);
  const billingCycle = detectBillingCycle(normalized);

  const confidence = calculateConfidence(serviceName, planName, price, currency, billingCycle);

  return {
    is_subscription: confidence >= 0.5,
    service_name: serviceName,
    plan_name: planName,
    price: price,
    currency: currency,
    billing_cycle: billingCycle,
    confidence: confidence
  };
}