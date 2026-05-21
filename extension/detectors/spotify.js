function matchesSpotifyPage() {
  return window.location.hostname.includes("spotify.com") && window.location.pathname.includes("/account/");
}

function extractSpotifyCandidate() {
  try {
    const cardText = document.querySelector('[data-testid="plan-card"]').innerText;
    //'Twój plan\nPremium\nFamily\n\nTwój kolejny rachunek na dzień 3.06.2026 wynosi 45,99 zł.'

    const lines = cardText.split('\n').map(l => l.trim()).filter(l => l !== '');
    const plan_name = lines[1] + " " + lines[2];
    const billLine = lines.find(l => l.includes('wynosi') || l.includes('rachunek'));
    
    let price = 0;
    let renewal_date = null;
    
    if (billLine) {
        const priceMatch = billLine.match(/([\d,]+)\s*zł/);
        if (priceMatch) {
            price = parseFloat(priceMatch[1].replace(',', '.'));
        }

        const dateMatch = billLine.match(/dzień\s*([\d.]+)/);
        if (dateMatch) {
            const parts = dateMatch[1].split('.');
            if (parts.length === 3) {
                const day = parts[0].padStart(2, '0');
                const month = parts[1].padStart(2, '0');
                const year = parts[2];
                renewal_date = `${year}-${month}-${day}`;
            }
        }
    }

    return {
      service_name: "Spotify",
      plan_name: plan_name,
      price: price,         
      currency: "PLN",      
      billing_cycle: "monthly",
      renewal_date: renewal_date,
      source: "spotify",
      source_url: window.location.href,
      auto_renew: true
    };
  } catch (error) {
    console.error("Nie udało się wyciągnąć danych Spotify:", error);
    return null;
  }
}

function getSpotifyStableKey(candidate) {
  return `${candidate.service_name}:${candidate.plan_name}:${candidate.price}:${candidate.currency}`;
}
