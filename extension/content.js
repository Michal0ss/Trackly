/* global chrome */

console.log("Trackly działa");

async function runNetflixDetectorFlow() {
  if (!matchesNetflixPage()) {return;}

  const candidate = extractNetflixCandidate();

  if (!candidate) {return;}

  if (!shouldPromptNetflix(candidate)) {return;}

  const accepted = confirmSubscription(
    `Czy chcesz dodać subskrypcję ${candidate.service_name}?`
  );

  if (!accepted) {return;}

  const token = await getToken();

  if (!token) {
    showError("Zaloguj się najpierw w rozszerzeniu.");
    return;
  }

  try {
    const result = await createSubscriptionRequest(token, candidate);
    console.log("Subscription created:", result);
    showSuccess("Subskrypcja została dodana.");
  } catch (error) {
    console.error("Create subscription error:", error);
    showError(`Błąd dodawania subskrypcji: ${error.message}`);
  }
}

setTimeout(() => {
  runNetflixDetectorFlow();
}, 1000);
