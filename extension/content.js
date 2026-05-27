/* global chrome */

console.log("Trackly is running on Spotify");

async function runDetectorFlow() {
  if (!matchesSpotifyPage()) {
    return;
  }

  const candidate = extractSpotifyCandidate();

  if (!candidate || !candidate.plan_name || !candidate.price) {
    console.log("Prompt skipped because of incomplete subscription data");
    return;
  }

  const key = getSpotifyStableKey(candidate);

  if (!(await shouldPromptForKey(key))) {
    console.log("Prompt skipped because this candidate was already handled");
    return;
  }

  showSubscriptionForm(candidate, async (payload) => {
    const token = await getToken();

    if (!token) {
      showError("Log in to the Trackly extension first.");
      return;
    }

    try {
      const createdSubscription = await createSubscriptionRequest(token, payload);

      await markKeyAsSubmitted(key);

      console.log("Subscription created:", createdSubscription);
      showSuccess(`${payload.service_name} subscription was added successfully.`);

    } catch (error) {
      console.error("Failed to create subscription:", error);
      const errMsg = error.message || "";

      if (errMsg.includes("401") || errMsg.toLowerCase().includes("credentials") || errMsg.toLowerCase().includes("unauthorized")) {
        showError("Your session has expired. Please log in again via the extension.")

      } else if (errMsg.toLowerCase().includes("already exists") || errMsg.includes("400") || errMsg.includes("409")) {
        showError("This subscription is already on your list.");
        await markKeyAsSubmitted(key); // Don't ask again for this specific duplicate

      } else {
        showError(`Could not add subscription: ${errMsg}`);
      }
    }
  });
}

setTimeout(() => {
  runDetectorFlow();
}, 2500);
