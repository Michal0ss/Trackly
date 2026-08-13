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
  if (candidate.service_name) {
    return candidate.service_name.toLowerCase();
  }

  return new URL(candidate.source_url).hostname;
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

    showDetectionToast(candidate, {
      onAccept: async () => {
        await savePendingDetection(candidate, key);
        chrome.runtime.sendMessage({ type: "TRACKLY_DETECTION_PENDING" }).catch(() => {});
      },
      onDismiss: () => {
        console.log("Detection dismissed by user");
      }
    });
  } catch (error) {
    console.error("Subscription detection failed:", error);

    if (error.status === 401) {
      showPageToast("Sesja wygasła. Zaloguj się ponownie.", { variant: "error" });
    }
  }
}

setTimeout(() => {
  runDetectorFlow();
}, 1000);