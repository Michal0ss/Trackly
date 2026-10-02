const REMINDER_ALARM = "trackly-reminders";
const REMINDER_NOTIFICATION_PREFIX = "trackly-reminder:";
const REMINDER_SETTINGS_KEY = "reminder_settings";
const REMINDERS_SENT_KEY = "reminders_sent";
const REMINDER_HOUR = 9;
const REMINDER_DAY_OPTIONS = [1, 3, 7];
const DEFAULT_REMINDER_DAYS = 3;
const SENT_REMINDER_TTL_DAYS = 60;
const DAY_MS = 24 * 60 * 60 * 1000;

function readReminderSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get([REMINDER_SETTINGS_KEY], (result) => {
      const stored = result[REMINDER_SETTINGS_KEY] || {};
      const days = REMINDER_DAY_OPTIONS.includes(stored.days) ? stored.days : DEFAULT_REMINDER_DAYS;

      resolve({ enabled: stored.enabled === true, days });
    });
  });
}

function saveReminderSettings(settings) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [REMINDER_SETTINGS_KEY]: settings }, resolve);
  });
}

function readSentReminders() {
  return new Promise((resolve) => {
    chrome.storage.local.get([REMINDERS_SENT_KEY], (result) => {
      resolve(result[REMINDERS_SENT_KEY] || {});
    });
  });
}

function saveSentReminders(sent) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [REMINDERS_SENT_KEY]: sent }, resolve);
  });
}

function nextReminderTime(now = new Date()) {
  const next = new Date(now);
  next.setHours(REMINDER_HOUR, 0, 0, 0);

  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  return next.getTime();
}

function daysUntil(dateString, now = new Date()) {
  const [year, month, day] = String(dateString).split("-").map(Number);
  const target = new Date(year, month - 1, day);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return Math.round((target - today) / DAY_MS);
}

function reminderKey(sub) {
  return `${sub.id}:${sub.renewal_date}`;
}

function dueReminders(subscriptions, sent, days, now = new Date()) {
  return subscriptions
    .filter((sub) => sub.status === "confirmed" && sub.auto_renew !== false && sub.renewal_date)
    .map((sub) => ({ sub, inDays: daysUntil(sub.renewal_date, now), key: reminderKey(sub) }))
    .filter(({ inDays, key }) => inDays >= 0 && inDays <= days && !sent[key]);
}

function pruneSentReminders(sent, now = new Date()) {
  const cutoff = now.getTime() - SENT_REMINDER_TTL_DAYS * DAY_MS;

  return Object.fromEntries(Object.entries(sent).filter(([, sentAt]) => sentAt >= cutoff));
}

function reminderTitle(serviceName, inDays) {
  if (inDays === 0) {
    return t("reminderToday", [serviceName]);
  }

  if (inDays === 1) {
    return t("reminderTomorrow", [serviceName]);
  }

  return t("reminderInDays", [serviceName, String(inDays)]);
}

function reminderMessage(sub) {
  const price = `${formatAmount(sub.price)} ${sub.currency}`;

  return sub.plan_name ? `${sub.plan_name} · ${price}` : price;
}

function showNotification(id, options) {
  return new Promise((resolve) => {
    chrome.notifications.create(id, { type: "basic", iconUrl: chrome.runtime.getURL("icons/icon128.png"), ...options }, () => {
      if (chrome.runtime.lastError) {
        console.error("Notification failed:", chrome.runtime.lastError.message);
        resolve(false);
        return;
      }

      resolve(true);
    });
  });
}

function showReminderPreview() {
  return showNotification(`${REMINDER_NOTIFICATION_PREFIX}preview`, {
    title: t("remindersPreviewTitle"),
    message: t("remindersPreviewText")
  });
}

async function notifyDueRenewals(subscriptions) {
  const settings = await readReminderSettings();

  if (!settings.enabled || !chrome.notifications) {
    return;
  }

  const now = new Date();
  const sent = pruneSentReminders(await readSentReminders(), now);

  for (const { sub, inDays, key } of dueReminders(subscriptions, sent, settings.days, now)) {
    const id = `${REMINDER_NOTIFICATION_PREFIX}${key}`;
    const options = { title: reminderTitle(sub.service_name, inDays), message: reminderMessage(sub) };

    if (findServiceLink(sub.service_name)) {
      options.contextMessage = t("reminderManageHint");
    }

    await chrome.storage.session.set({ [id]: sub.service_name });

    if (await showNotification(id, options)) {
      sent[key] = now.getTime();
    }
  }

  await saveSentReminders(sent);
}
