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
      showError("Log in to the extension first.");
      return;
    }

    try {
      const createdSubscription = await createSubscriptionRequest(token, payload);

      await markKeyAsSubmitted(key);

      console.log("Subscription created:", createdSubscription);
      showSuccess(`${payload.service_name} subscription was added successfully.`);
    } catch (error) {
      console.error("Failed to create subscription:", error);
      showError(`Could not add subscription: ${error.message}`);
    }
  });
}


setTimeout(() => {
  runDetectorFlow();
}, 1000);
