function matchesNetflixPage() {
  return window.location.hostname.includes("netflix.com");
}

function extractNetflixCandidate() {
  return {
    service_name: "Netflix",
    plan_name: "premium",
    price: 29.99,
    currency: "PLN",
    billing_cycle: "monthly",
    start_date: new Date().toISOString().split("T")[0],
    renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    end_date: null,
    status: "confirmed",
    source: "netflix",
    source_url: window.location.href,
    auto_renew: true
  };
}

function getNetflixStableKey(candidate) {
  return `${candidate.service_name}:${candidate.plan_name}:${candidate.price}:${candidate.currency}`;
}

function shouldPromptNetflix(candidate) {
  return Boolean(candidate);
}
