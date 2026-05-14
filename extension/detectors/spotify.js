function matchesSpotifyPage() {
  return window.location.hostname.includes("spotify.com") && window.location.pathname.includes("/account/");
}

function extractSpotifyCandidate() {
  // TODO: sztywne dane na selektory html ze strony spotify
  return {
    service_name: "Spotify",
    plan_name: "Premium",
    price: 19.99,
    currency: "PLN",      
    billing_cycle: "monthly",
    source: "spotify",
    source_url: window.location.href,
    auto_renew: true
  };
}

function getSpotifyStableKey(candidate) {
  return `${candidate.service_name}:${candidate.plan_name}:${candidate.price}:${candidate.currency}`;
}
