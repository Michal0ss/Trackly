const API_BASE_URL = "http://127.0.0.1:8000";

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);

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

    throw new Error(errorMessage);
  }

  return data;
}

async function registerUserRequest(email, password) {
  return apiRequest("/users/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });
}

async function loginUserRequest(email, password) {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  return apiRequest("/users/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: formData.toString()
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
