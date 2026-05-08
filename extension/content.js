/* global chrome */

console.log("Trackly działa");

async function runNetflixDetectorFlow() {
  if (!matchesNetflixPage()) {return;}

  const candidate = extractNetflixCandidate();

  if (!candidate) {
    console.log("No Netflix subscription candidate found");
    return;
  }
  const key = getNetflixStableKey(candidate);

  if (!(await shouldPromptForKey(key))){
    console.log("Prompt skipped because this candidate was already handled");
    return;
  }

  await markKeyAsPrompted(key);

  const accepted = confirmSubscription(
    `Do you want to add ${candidate.service_name} subscription?`
  );

  if (!accepted) {
    await markKeyAsRejected(key);
    console.log("User rejected subscription prompt");
    return;
  }

  await markKeyAsAccepted(key);

  const token = await getToken();

  if (!token) {
    showError("Log in to the extension first.");
    return;
  }

  try {
    const createdSubscription = await createSubscriptionRequest(token, candidate);

    await markKeyAsSubmitted(key);

    console.log("Subscription created:", createdSubscription);
    showSuccess(`${candidate.service_name} subscription was added successfully.`);
  } catch (error) {
    console.error("Failed to create subscription:", error);
    showError(`Could not add subscription: ${error.message}`);
  }
}

setTimeout(() => {
  runNetflixDetectorFlow();
}, 1000);
