/* global chrome */

// Ikona jest teraz zielona litera bez tla, wiec zielony badge zlewalby sie z nia
// w jedna plame. Ciemne tlo badge to ta sama barwa co "track" w wordmarku.
const BADGE_COLOR = "#0f172a";
const BADGE_TEXT_COLOR = "#ffffff";
const BLINK_PATTERN = [true, false, true, false, true];
const BLINK_STEP_MS = 300;

function flashBadge() {
  chrome.action.setBadgeBackgroundColor({ color: BADGE_COLOR });
  // setBadgeTextColor istnieje dopiero od Chrome 110. Gdyby go nie bylo,
  // Chrome i tak dobierze kolor tekstu pod kontrast z tlem, wiec pomijamy.
  chrome.action.setBadgeTextColor?.({ color: BADGE_TEXT_COLOR });

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
