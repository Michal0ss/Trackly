/* global chrome */

console.log("Trackly content script loaded");

function buildCandidateFromDetection(detected, pageUrl) {
  return {
    service_name: detected.service_name || "",
    plan_name: detected.plan_name || "",
    price: detected.price ?? null,
    currency: detected.currency || "PLN",
    billing_cycle: detected.billing_cycle || "monthly",
    start_date: new Date().toISOString().split("T")[0],
    renewal_date: null,
    end_date: null,
    status: "confirmed",
    source: "detected",
    source_url: pageUrl,
    auto_renew: true
  };
}

function getDetectedSubscriptionKey(candidate) {
  return [
    candidate.source_url,
    candidate.service_name,
    candidate.plan_name,
    candidate.price,
    candidate.currency
  ].join(":");
}

async function runDetectorFlow() {
  const token = await getToken();

  if (!token) {
    console.log("Detection skipped: user is not logged in");
    return;
  }

  const pageText = document.body.innerText.trim();
  const pageUrl = window.location.href;

  if (!pageText) {
    console.log("Detection skipped: no visible page text");
    return;
  }

  try {
    const detected = await detectSubscriptionRequest(token, {
      text: pageText.slice(0, 10000),
      url: pageUrl
    });

    console.log("Detection result:", detected);
    if (!detected.is_subscription) {
    console.log("Detection skipped: page does not look like a subscription");
    return;
  }


    const candidate = buildCandidateFromDetection(detected, pageUrl);
    const key = getDetectedSubscriptionKey(candidate);

    if (!(await shouldPromptForKey(key))) {
      console.log("Prompt skipped: candidate was already handled");
      return;
    }

    await markKeyAsPrompted(key);

    showSubscriptionForm(candidate, async (payload) => {
      try {
        const createdSubscription = await createSubscriptionRequest(
          token,
          payload
        );

        await markKeyAsSubmitted(key);

        console.log("Subscription created:", createdSubscription);
        showSuccess(`Subskrypcja ${payload.service_name} została dodana.`);
      } catch (error) {
        console.error("Failed to create subscription:", error);
        showError(`Nie udało się dodać subskrypcji: ${error.message}`);
      }
    });
  } catch (error) {
    console.error("Subscription detection failed:", error);

    if (error.status === 401) {
      showError("Sesja wygasła. Zaloguj się ponownie.");
    }
  }
}

setTimeout(() => {
  runDetectorFlow();
}, 1000);