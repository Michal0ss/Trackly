/* global chrome */

console.log("Trackly działa");

async function runDetectorFlow() {
  if (!matchesNetflixPage()) {
    return;
  }

  const candidate = extractNetflixCandidate();

  if (!candidate) {
    console.log("No subscription candidate found");
    return;
  }

  const key = getNetflixStableKey(candidate);

  if (!(await shouldPromptForKey(key))) {
    console.log("Prompt skipped because this candidate was already handled");
    return;
  }

  showSubscriptionForm(candidate, async (payload) => {
    const token = await getToken();

    if (!token) {
      showError("Najpierw zaloguj się we wtyczce.");
      return;
    }

    try {
      const createdSubscription = await createSubscriptionRequest(token, payload);

      await markKeyAsSubmitted(key);

      console.log("Subscription created:", createdSubscription);
      showSuccess(`Subskrypcja ${payload.service_name} została dodana.`);
    } catch (error) {
      console.error("Failed to create subscription:", error);
      showError(`Nie udało się dodać subskrypcji: ${error.message}`);
    }
  });
}


setTimeout(() => {
  runDetectorFlow();
}, 1000);
