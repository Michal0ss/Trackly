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