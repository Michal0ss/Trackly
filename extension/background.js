/* global chrome */

const BADGE_COLOR = "#0f172a";
const BADGE_TEXT_COLOR = "#ffffff";
const BLINK_PATTERN = [true, false, true, false, true];
const BLINK_STEP_MS = 300;

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

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "TRACKLY_DETECTION_PENDING") {
    flashBadge(message.count);
  }

  if (message?.type === "TRACKLY_DETECTION_CLEARED") {
    clearBadge();
  }
});
