const DEDUPE_STORAGE_KEY = "subscription_prompt_state";
const PROMPT_SNOOZE_MS = 60 * 60 * 1000;

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
  state[key] = { status: status, updated_at: Date.now() };
  await savePromptState(state);
}

async function shouldPromptForKey(key) {
  const entry = await getKeyStatus(key);

  if (!entry || typeof entry !== "object") {
    return true;
  }

  if (entry.status === "submitted") {
    return false;
  }

  if (entry.status === "dismissed") {
    return Date.now() - entry.updated_at > PROMPT_SNOOZE_MS;
  }

  return true;
}

async function markKeyAsSubmitted(key) {
  await setKeyStatus(key, "submitted");
}

async function markKeyAsDismissed(key) {
  await setKeyStatus(key, "dismissed");
}
