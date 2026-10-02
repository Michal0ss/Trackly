/* global chrome, importScripts */

importScripts(
  "shared/i18n.js",
  "shared/storage.js",
  "shared/api-client.js",
  "shared/service-links.js",
  "shared/reminders.js"
);

const BADGE_COLOR = "#0f172a";
const BADGE_TEXT_COLOR = "#ffffff";
const BLINK_PATTERN = [true, false, true, false, true];
const BLINK_STEP_MS = 300;
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_EMAIL_SCOPE = "https://www.googleapis.com/auth/userinfo.email";

function flashBadge(count) {
  const label = count > 1 ? String(count) : "1";

  chrome.action.setBadgeBackgroundColor({ color: BADGE_COLOR });
  chrome.action.setBadgeTextColor?.({ color: BADGE_TEXT_COLOR });

  BLINK_PATTERN.forEach((visible, index) => {
    setTimeout(() => {
      chrome.action.setBadgeText({ text: visible ? label : "" });
    }, index * BLINK_STEP_MS);
  });
}

function clearBadge() {
  chrome.action.setBadgeText({ text: "" });
}

async function applyReminderSettings() {
  const settings = await readReminderSettings();

  if (!settings.enabled) {
    await chrome.alarms.clear(REMINDER_ALARM);
    return;
  }

  if (!(await chrome.alarms.get(REMINDER_ALARM))) {
    await chrome.alarms.create(REMINDER_ALARM, { when: nextReminderTime(), periodInMinutes: 24 * 60 });
  }
}

async function runReminderCheck() {
  const token = await getToken();

  if (!token) {
    return;
  }

  try {
    await notifyDueRenewals(await getSubscriptionsRequest(token));
  } catch (error) {
    console.error("Reminder check failed:", error);
  }
}

async function openReminderTarget(notificationId) {
  if (!notificationId.startsWith(REMINDER_NOTIFICATION_PREFIX)) {
    return;
  }

  const stored = await chrome.storage.session.get(notificationId);
  const url = findServiceLink(stored[notificationId]);

  if (url) {
    chrome.tabs.create({ url });
  } else {
    chrome.action.openPopup?.()?.catch(() => {});
  }

  chrome.notifications.clear(notificationId);
}

function listenForNotificationClicks() {
  if (chrome.notifications && !chrome.notifications.onClicked.hasListener(openReminderTarget)) {
    chrome.notifications.onClicked.addListener(openReminderTarget);
  }
}

function launchGoogleWebAuth() {
  const params = new URLSearchParams({
    client_id: GOOGLE_WEB_CLIENT_ID,
    response_type: "token",
    redirect_uri: chrome.identity.getRedirectURL(),
    scope: GOOGLE_EMAIL_SCOPE,
    prompt: "select_account"
  });

  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow({ url: `${GOOGLE_AUTH_URL}?${params}`, interactive: true }, (responseUrl) => {
      if (chrome.runtime.lastError || !responseUrl) {
        reject(new Error(chrome.runtime.lastError?.message || "Sign-in was cancelled"));
        return;
      }

      const token = new URLSearchParams(new URL(responseUrl).hash.slice(1)).get("access_token");

      if (token) {
        resolve(token);
      } else {
        reject(new Error("Google returned no access token"));
      }
    });
  });
}

async function signInWithWebFlow() {
  try {
    const googleToken = await launchGoogleWebAuth();
    const data = await googleLoginRequest(googleToken);

    await saveToken(data.access_token);
  } catch (error) {
    console.error("Web sign-in failed:", error);
  }
}

listenForNotificationClicks();

chrome.permissions.onAdded.addListener(listenForNotificationClicks);

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === REMINDER_ALARM) {
    runReminderCheck();
  }
});

chrome.runtime.onInstalled.addListener(() => {
  applyReminderSettings();
});

chrome.runtime.onStartup.addListener(() => {
  applyReminderSettings().then(runReminderCheck);
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "TRACKLY_DETECTION_PENDING") {
    flashBadge(message.count);
  }

  if (message?.type === "TRACKLY_DETECTION_CLEARED") {
    clearBadge();
  }

  if (message?.type === "TRACKLY_REMINDERS_CHANGED") {
    applyReminderSettings();
  }

  if (message?.type === "TRACKLY_WEB_SIGN_IN") {
    signInWithWebFlow();
  }
});
