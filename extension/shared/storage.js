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
      chrome.storage.local.remove(["access_token", "panel_cache"], resolve);
    } else {
      localStorage.removeItem("access_token");
      resolve();
    }
  });
}

function readPanelCache() {
  return new Promise((resolve) => {
    if (!hasChromeStorage()) {
      resolve(null);
      return;
    }

    chrome.storage.local.get(["panel_cache"], (result) => {
      const panel = result.panel_cache;
      const valid = panel && panel.user && Array.isArray(panel.subscriptions) && Array.isArray(panel.expiring);

      resolve(valid ? panel : null);
    });
  });
}

function normalizeServiceName(value) {
  return String(value || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

async function isServiceInPanel(serviceName) {
  const panel = await readPanelCache();
  const name = normalizeServiceName(serviceName);

  if (!panel || !name) {
    return false;
  }

  return panel.subscriptions.some(
    (sub) => sub.status !== "cancelled" && ` ${normalizeServiceName(sub.service_name)} `.includes(` ${name} `)
  );
}

function writePanelCache(panel) {
  return new Promise((resolve) => {
    if (hasChromeStorage()) {
      chrome.storage.local.set({ panel_cache: panel }, resolve);
    } else {
      resolve();
    }
  });
}

const PENDING_DETECTION_LIMIT = 10;

function readPendingDetections() {
  return new Promise((resolve) => {
    if (!hasChromeStorage()) {
      resolve([]);
      return;
    }

    chrome.storage.local.get(["pending_detection"], (result) => {
      const stored = result.pending_detection;

      if (Array.isArray(stored)) {
        resolve(stored.filter((entry) => entry && entry.candidate));
      } else if (stored && stored.candidate) {
        resolve([stored]);
      } else {
        resolve([]);
      }
    });
  });
}

function writePendingDetections(entries) {
  return new Promise((resolve) => {
    if (!hasChromeStorage()) {
      resolve();
    } else if (!entries.length) {
      chrome.storage.local.remove(["pending_detection"], resolve);
    } else {
      chrome.storage.local.set({ pending_detection: entries }, resolve);
    }
  });
}

async function savePendingDetection(candidate, key) {
  const entries = await readPendingDetections();
  const others = entries.filter((entry) => entry.key !== key);

  others.push({ candidate, key });
  await writePendingDetections(others.slice(-PENDING_DETECTION_LIMIT));
}

async function getPendingDetection() {
  const entries = await readPendingDetections();

  return entries[0] || null;
}

async function countPendingDetections() {
  return (await readPendingDetections()).length;
}

async function hasPendingDetection(key) {
  const entries = await readPendingDetections();

  return entries.some((entry) => entry.key === key);
}

async function clearPendingDetection(key) {
  if (key === undefined || key === null) {
    await writePendingDetections([]);
    return;
  }

  const entries = await readPendingDetections();
  await writePendingDetections(entries.filter((entry) => entry.key !== key));
}