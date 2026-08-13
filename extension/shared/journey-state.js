const JOURNEY_STORAGE_KEY = "subscription_journey_state";
const JOURNEY_TTL_MS = 60 * 60 * 1000;

const JOURNEY_FIELDS = [
  "service_name",
  "plan_name",
  "price",
  "currency",
  "billing_cycle"
];

function getJourneyState() {
  return new Promise((resolve) => {
    chrome.storage.local.get([JOURNEY_STORAGE_KEY], (result) => {
      resolve(result[JOURNEY_STORAGE_KEY] || {});
    });
  });
}

function saveJourneyState(state) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [JOURNEY_STORAGE_KEY]: state }, resolve);
  });
}

function isJourneyFresh(entry) {
  return Boolean(entry) && Date.now() - entry.updated_at <= JOURNEY_TTL_MS;
}

async function rememberJourneyData(serviceKey, detected, pageUrl) {
  const state = await getJourneyState();
  const merged = isJourneyFresh(state[serviceKey]) ? { ...state[serviceKey].data } : {};

  for (const field of JOURNEY_FIELDS) {
    const value = detected[field];

    if (value !== null && value !== undefined && value !== "") {
      merged[field] = value;
    }
  }

  merged.source_url = pageUrl;

  state[serviceKey] = { data: merged, updated_at: Date.now() };
  await saveJourneyState(state);
}

async function getJourneyData(serviceKey) {
  const state = await getJourneyState();
  const entry = state[serviceKey];

  return isJourneyFresh(entry) ? entry.data : null;
}

async function clearJourneyData(serviceKey) {
  const state = await getJourneyState();

  delete state[serviceKey];
  await saveJourneyState(state);
}