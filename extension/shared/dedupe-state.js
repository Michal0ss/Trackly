const DEDUPE_STORAGE_KEY = "subscription_prompt_state";

function getPromptState() {
  return new Promise((resolve) => {
    chrome.storage.local.get([DEDUPE_STORAGE_KEY], (result) => {
      resolve(result[DEDUPE_STORAGE_KEY] || {});
    });
  });
}

function savePromptState(state) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [DEDUPE_STORAGE_KEY]: state }, resolve);
  });
}

async function getKeyStatus(key) {
  const state = await getPromptState();
  return state[key] || null;
}

async function setKeyStatus(key, status) {
  const state = await getPromptState();
  state[key] = status;
  await savePromptState(state);
}

async function shouldPromptForKey(key) {
  const status = await getKeyStatus(key);

  if (status === "prompted" || status === "accepted" || status === "submitted") {
    return false;
  }

  return true;
}

async function markKeyAsPrompted(key) {
  await setKeyStatus(key, "prompted");
}

async function markKeyAsAccepted(key) {
  await setKeyStatus(key, "accepted");
}

async function markKeyAsRejected(key) {
  await setKeyStatus(key, "rejected");
}

async function markKeyAsSubmitted(key) {
  await setKeyStatus(key, "submitted");
}
