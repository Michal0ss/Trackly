function matchesNetflixPage() {
  return window.location.hostname.includes("netflix.com");
}

function extractNetflixCandidate() {
  return {
    service_name: "Netflix",
    currency: "PLN",
    billing_cycle: "monthly",
    source: "netflix",
    source_url: window.location.href,
    auto_renew: true
  };
}


function getNetflixStableKey(candidate) {
  return `${candidate.service_name}:${candidate.plan_name}:${candidate.price}:${candidate.currency}`;
}