const PRODUCTION_API_BASE_URL = "https://trackly-api-michal-team00.vercel.app";

let cachedApiBaseUrl = null;

function getApiBaseUrl() {
  if (cachedApiBaseUrl) {
    return Promise.resolve(cachedApiBaseUrl);
  }

  return new Promise((resolve) => {
    if (typeof chrome === "undefined" || !chrome.storage || !chrome.storage.local) {
      cachedApiBaseUrl = PRODUCTION_API_BASE_URL;
      resolve(cachedApiBaseUrl);
      return;
    }

    chrome.storage.local.get(["api_base_url"], (result) => {
      cachedApiBaseUrl = result.api_base_url || PRODUCTION_API_BASE_URL;
      resolve(cachedApiBaseUrl);
    });
  });
}

async function apiRequest(path, options = {}) {
  const baseUrl = await getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api${path}`, options);

  const rawText = await response.text();
  let data = null;

  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    data = rawText;
  }

  if (!response.ok) {
    const errorMessage =
      (data && data.detail) ||
      (typeof data === "string" && data) ||
      `Request failed with status ${response.status}`;

    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }

  return data;
}

async function googleLoginRequest(googleToken) {
  return apiRequest("/users/google-login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ access_token: googleToken })
  });
}

async function getCurrentUserRequest(token) {
  return apiRequest("/users/me", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
}

async function getSubscriptionsRequest(token) {
  return apiRequest("/subscriptions", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
}

async function createSubscriptionRequest(token, payload) {
  return apiRequest("/subscriptions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
}

async function deleteSubscriptionRequest(token, id) {
  return apiRequest(`/subscriptions/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
}

async function updateSubscriptionRequest(token, id, payload) {
  return apiRequest(`/subscriptions/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
}

async function getExpiringSubscriptionsRequest(token, days = 3) {
  return apiRequest(`/subscriptions/summary/expiring?days=${days}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
}
