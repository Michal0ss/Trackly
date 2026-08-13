/* global chrome */

const BADGE_COLOR = "#22c55e";
const BLINK_PATTERN = [true, false, true, false, true];
const BLINK_STEP_MS = 300;

function flashBadge() {
  chrome.action.setBadgeBackgroundColor({ color: BADGE_COLOR });

  BLINK_PATTERN.forEach((visible, index) => {
    setTimeout(() => {
      chrome.action.setBadgeText({ text: visible ? "1" : "" });
    }, index * BLINK_STEP_MS);
  });
}

function clearBadge() {
  chrome.action.setBadgeText({ text: "" });
}

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "TRACKLY_DETECTION_PENDING") {
    flashBadge();
  }

  if (message?.type === "TRACKLY_DETECTION_CLEARED") {
    clearBadge();
  }
});
