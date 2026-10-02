const statusBox = document.getElementById("statusBox");
const panelStatusBox = document.getElementById("panelStatusBox");
const tokenValue = document.getElementById("tokenValue");
const refreshTokenBtn = document.getElementById("refreshTokenBtn");
const logoutBtn = document.getElementById("logoutBtn");
const authView = document.getElementById("authView");
const subscriptionsView = document.getElementById("subscriptionsView");
const dashboardLogoutBtn = document.getElementById("dashboardLogoutBtn");
const refreshSubscriptionsBtn = document.getElementById("refreshSubscriptionsBtn");
const addSubscriptionBtn = document.getElementById("addSubscriptionBtn");
const googleLoginBtn = document.getElementById("googleLoginBtn");
const reminderBtn = document.getElementById("reminderBtn");
const reminderMenu = document.getElementById("reminderMenu");
const rateBox = document.getElementById("rateBox");
const rateGoBtn = document.getElementById("rateGoBtn");
const rateLaterBtn = document.getElementById("rateLaterBtn");

const GREETING_KEYS = ["greeting1", "greeting2", "greeting3", "greeting4"];
const RATING_STATE_KEY = "rating_prompt";
const RATING_MIN_SUBSCRIPTIONS = 3;
const RATING_MIN_DAYS = 14;
const RATING_SNOOZE_DAYS = 30;
const RATING_MAX_SNOOZES = 1;

applyTranslations();

function showRandomGreeting() {
  const greeting = document.getElementById("greeting");

  if (greeting) {
    greeting.textContent = t(GREETING_KEYS[Math.floor(Math.random() * GREETING_KEYS.length)]);
  }
}

function getGoogleToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError || !token) {
        reject(new Error(chrome.runtime.lastError?.message || t("googleTokenFailed")));
        return;
      }

      resolve(token);
    });
  });
}

function startWebSignIn() {
  if (!GOOGLE_WEB_CLIENT_ID) {
    showStatus(t("webSignInUnavailable"), "error");
    return;
  }

  showStatus(t("webSignInStarted"));
  chrome.runtime.sendMessage({ type: "TRACKLY_WEB_SIGN_IN" }).catch(() => {});
}

async function loginWithGoogle() {
  clearStatus();

  if (isEdgeBrowser()) {
    startWebSignIn();
    return;
  }

  showStatus(t("connectingGoogle"));

  try {
    const googleToken = await getGoogleToken();
    const data = await googleLoginRequest(googleToken);

    await saveToken(data.access_token);
    await refreshTokenPreview();
    await loadSubscriptions();

    showSubscriptionsView();
    showStatus(t("signedIn"), "success");
  } catch (error) {
    showStatus(t("signInFailed", [error.status ? describeError(error) : error.message]), "error");
  }
}

let statusTimer = null;

function showStatus(message, type = "info") {
  clearStatus();

  const box = subscriptionsView.style.display === "block" ? panelStatusBox : statusBox;
  box.textContent = message;
  box.className = `status show ${type}`;

  if (type === "success") {
    statusTimer = setTimeout(clearStatus, 4000);
  }
}

function clearStatus() {
  clearTimeout(statusTimer);

  [statusBox, panelStatusBox].forEach((box) => {
    box.textContent = "";
    box.className = "status";
  });
}

function showAuthView() {
  authView.style.display = "block";
  subscriptionsView.style.display = "none";
}

function showSubscriptionsView() {
  authView.style.display = "none";
  subscriptionsView.style.display = "block";
}

async function refreshTokenPreview() {
  const token = await getToken();
  tokenValue.textContent = token || "Brak tokenu";
}

async function logoutUser() {
  await removeToken();
  resetPanel();
  await refreshTokenPreview();
  showAuthView();
  showStatus(t("signedOut"));
}

function openManualSubscriptionForm() {
  showSubscriptionForm(
    {
      service_name: "",
      currency: defaultCurrency(),
      source: "manual",
      source_url: ""
    },
    async (payload) => {
      const token = await getToken();

      if (!token) {
        showStatus(t("signInToAdd"), "error");
        return;
      }

      try {
        await createSubscriptionRequest(token, payload);
        await loadSubscriptions();
        showStatus(t("subscriptionAdded"), "success");
      } catch (error) {
        console.error("Failed to create subscription:", error);
        showStatus(t("addFailed", [describeError(error)]), "error");
      }
    }
  );
}

async function syncPendingBadge() {
  const pending = await countPendingDetections();

  chrome.action.setBadgeText({ text: pending ? String(pending) : "" });
}

async function maybeShowPendingDetection() {
  const pending = await getPendingDetection();

  chrome.action.setBadgeText({ text: "" });

  if (!pending || !pending.candidate) {
    return;
  }

  if (await isServiceInPanel(pending.candidate.service_name)) {
    await markKeyAsSubmitted(pending.key);
    await clearPendingDetection(pending.key);
    await syncPendingBadge();
    return;
  }

  showSubscriptionForm(
    pending.candidate,
    async (payload) => {
      const token = await getToken();

      if (!token) {
        showStatus(t("signInToAdd"), "error");
        return;
      }

      try {
        await createSubscriptionRequest(token, payload);

        if (pending.key) {
          await markKeyAsSubmitted(pending.key);
        }

        await clearPendingDetection(pending.key);
        await syncPendingBadge();
        await loadSubscriptions();
        showStatus(t("subscriptionAddedNamed", [payload.service_name]), "success");
      } catch (error) {
        console.error("Failed to create subscription:", error);

        if (error.status === 409 && pending.key) {
          await markKeyAsSubmitted(pending.key);
          await clearPendingDetection(pending.key);
          await syncPendingBadge();
        }

        showStatus(t("addFailed", [describeError(error)]), "error");
      }
    },
    {
      title: t("detectedTitle"),
      submitLabel: t("add"),
      onCancel: () => {
        clearPendingDetection(pending.key).then(syncPendingBadge);
      }
    }
  );
}

function readRatingState() {
  return new Promise((resolve) => {
    chrome.storage.local.get([RATING_STATE_KEY], (result) => {
      resolve(result[RATING_STATE_KEY] || {});
    });
  });
}

function saveRatingState(state) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [RATING_STATE_KEY]: state }, resolve);
  });
}

async function maybeShowRatingPrompt() {
  const url = storeReviewUrl();
  const state = await readRatingState();

  if (!state.first_seen) {
    await saveRatingState({ ...state, first_seen: Date.now() });
    return;
  }

  if (!url || state.done || Date.now() < (state.snoozed_until || 0)) {
    return;
  }

  const active = currentSubscriptions.filter((sub) => sub.status === "confirmed").length;
  const daysSinceFirstSeen = (Date.now() - state.first_seen) / DAY_MS;

  if (active >= RATING_MIN_SUBSCRIPTIONS || (active > 0 && daysSinceFirstSeen >= RATING_MIN_DAYS)) {
    rateGoBtn.href = url;
    rateBox.hidden = false;
  }
}

async function rateNow() {
  rateBox.hidden = true;
  await saveRatingState({ ...(await readRatingState()), done: true });
}

async function rateLater() {
  rateBox.hidden = true;

  const state = await readRatingState();
  const snoozes = (state.snoozes || 0) + 1;

  await saveRatingState({
    ...state,
    snoozes,
    done: snoozes > RATING_MAX_SNOOZES,
    snoozed_until: Date.now() + RATING_SNOOZE_DAYS * DAY_MS
  });
}

function reminderOptionLabel(days) {
  return t(days ? `remindersDays${days}` : "remindersOptionOff");
}

function renderReminderControls(settings) {
  const active = settings.enabled ? settings.days : 0;
  const label = settings.enabled ? t("remindersButtonOn", [reminderOptionLabel(settings.days)]) : t("remindersOff");

  reminderMenu.querySelectorAll(".reminder-option").forEach((option) => {
    option.setAttribute("aria-checked", String(Number(option.dataset.days) === active));
  });
  reminderBtn.classList.toggle("is-on", settings.enabled);
  reminderBtn.title = label;
  reminderBtn.setAttribute("aria-label", label);
}

function toggleReminderMenu(open) {
  reminderMenu.hidden = !open;
  reminderBtn.setAttribute("aria-expanded", String(open));
}

async function chooseReminder(days) {
  toggleReminderMenu(false);

  const granted = days ? await chrome.permissions.request({ permissions: ["notifications"] }).catch(() => false) : true;
  const current = await readReminderSettings();

  if (!granted) {
    showStatus(t("remindersDenied"), "error");
    return;
  }

  const settings = days ? { enabled: true, days } : { enabled: false, days: current.days };

  await saveReminderSettings(settings);
  renderReminderControls(settings);
  chrome.runtime.sendMessage({ type: "TRACKLY_REMINDERS_CHANGED" }).catch(() => {});

  if (!days) {
    showStatus(t("remindersOff"));
    return;
  }

  showStatus(t("remindersOn", [reminderOptionLabel(days)]), "success");

  if (!current.enabled) {
    await showReminderPreview();
  }

  await notifyDueRenewals(currentSubscriptions);
}

async function checkSession() {
  const [token, cached] = await Promise.all([getToken(), readPanelCache()]);

  if (!token) {
    showAuthView();
    return;
  }

  showSubscriptionsView();
  readReminderSettings().then(renderReminderControls);

  if (cached) {
    renderPanel(cached);
  } else {
    renderPanelLoading();
  }

  await maybeShowPendingDetection();
  await loadSubscriptions();
  await maybeShowRatingPrompt();
}

document.addEventListener("DOMContentLoaded", () => {
  showRandomGreeting();
  checkSession();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.access_token?.newValue && authView.style.display === "block") {
    checkSession();
  }
});

addSubscriptionBtn.addEventListener("click", openManualSubscriptionForm);
googleLoginBtn.addEventListener("click", loginWithGoogle);
refreshTokenBtn.addEventListener("click", refreshTokenPreview);
logoutBtn.addEventListener("click", logoutUser);
dashboardLogoutBtn.addEventListener("click", logoutUser);
refreshSubscriptionsBtn.addEventListener("click", loadSubscriptions);
rateGoBtn.addEventListener("click", rateNow);
rateLaterBtn.addEventListener("click", rateLater);

reminderBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleReminderMenu(reminderMenu.hidden);
});

reminderMenu.addEventListener("click", (event) => {
  const option = event.target.closest(".reminder-option");

  if (option) {
    chooseReminder(Number(option.dataset.days));
  }
});

document.addEventListener("click", (event) => {
  if (!reminderMenu.hidden && !event.target.closest(".reminder-anchor")) {
    toggleReminderMenu(false);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !reminderMenu.hidden) {
    toggleReminderMenu(false);
    reminderBtn.focus();
  }
});

refreshTokenPreview();
