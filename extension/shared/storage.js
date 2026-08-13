function hasChromeStorage() {
  return typeof chrome !== "undefined" && chrome.storage && chrome.storage.local;
}

function saveToken(token) {
  return new Promise((resolve) => {
    if (hasChromeStorage()) {
      chrome.storage.local.set({ access_token: token }, resolve);
    } else {
      localStorage.setItem("access_token", token);
      resolve();
    }
  });
}

function getToken() {
  return new Promise((resolve) => {
    if (hasChromeStorage()) {
      chrome.storage.local.get(["access_token"], (result) => {
        resolve(result.access_token || null);
      });
    } else {
      resolve(localStorage.getItem("access_token"));
    }
  });
}

function removeToken() {
  return new Promise((resolve) => {
    if (hasChromeStorage()) {
      chrome.storage.local.remove(["access_token"], resolve);
    } else {
      localStorage.removeItem("access_token");
      resolve();
    }
  });
}

function savePendingDetection(candidate, key) {
  return new Promise((resolve) => {
    if (hasChromeStorage()) {
      chrome.storage.local.set({ pending_detection: { candidate, key } }, resolve);
    } else {
      resolve();
    }
  });
}

function getPendingDetection() {
  return new Promise((resolve) => {
    if (hasChromeStorage()) {
      chrome.storage.local.get(["pending_detection"], (result) => {
        resolve(result.pending_detection || null);
      });
    } else {
      resolve(null);
    }
  });
}

function clearPendingDetection() {
  return new Promise((resolve) => {
    if (hasChromeStorage()) {
      chrome.storage.local.remove(["pending_detection"], resolve);
    } else {
      resolve();
    }
  });
}