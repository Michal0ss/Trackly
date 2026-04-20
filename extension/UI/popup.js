const API_BASE_URL = "http://127.0.0.1:8000";

const registerTab = document.getElementById("registerTab");
const loginTab = document.getElementById("loginTab");
const registerPanel = document.getElementById("registerPanel");
const loginPanel = document.getElementById("loginPanel");

const statusBox = document.getElementById("statusBox");
const tokenValue = document.getElementById("tokenValue");

const registerEmail = document.getElementById("registerEmail");
const registerPassword = document.getElementById("registerPassword");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");

const registerBtn = document.getElementById("registerBtn");
const loginBtn = document.getElementById("loginBtn");
const refreshTokenBtn = document.getElementById("refreshTokenBtn");
const logoutBtn = document.getElementById("logoutBtn");

function setActiveTab(tab) {
  const isRegister = tab === "register";

  registerTab.classList.toggle("active", isRegister);
  loginTab.classList.toggle("active", !isRegister);

  registerPanel.classList.toggle("active", isRegister);
  loginPanel.classList.toggle("active", !isRegister);
}

function showStatus(message, type = "info") {
  statusBox.textContent = message;
  statusBox.className = `status show ${type}`;
}

function clearStatus() {
  statusBox.textContent = "";
  statusBox.className = "status";
}

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

async function refreshTokenPreview() {
  const token = await getToken();
  tokenValue.textContent = token || "Brak tokenu";
}

async function registerUser() {
  clearStatus();

  const email = registerEmail.value.trim();
  const password = registerPassword.value;

  if (!email || !password) {
    showStatus("Uzupełnij email i hasło do rejestracji.", "error");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

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
        "Rejestracja nie powiodła się.";
      throw new Error(errorMessage);
    }

    showStatus("Konto zostało utworzone. Możesz się teraz zalogować.", "success");
    registerPassword.value = "";
    loginEmail.value = email;
    setActiveTab("login");
  } catch (error) {
    showStatus(`Błąd rejestracji: ${error.message}`, "error");
  }
}

async function loginUser() {
  clearStatus();

  const email = loginEmail.value.trim();
  const password = loginPassword.value;

  if (!email || !password) {
    showStatus("Uzupełnij email i hasło do logowania.", "error");
    return;
  }

  try {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: formData.toString()
    });

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
        "Logowanie nie powiodło się.";
      throw new Error(errorMessage);
    }

    if (!data || !data.access_token) {
      throw new Error("Backend nie zwrócił access_token.");
    }

    await saveToken(data.access_token);
    await refreshTokenPreview();

    loginPassword.value = "";
    showStatus("Token saved, logged in succesfully.", "success");
  } catch (error) {
    showStatus(`Loggin error: ${error.message}`, "error");
  }
}

async function logoutUser() {
  await removeToken();
  await refreshTokenPreview();
  showStatus("Token was deleted. User logged out.", "info");
}


async function checkSession() {
  chrome.storage.local.get(["access_token"], async (result) => {
  const token = result.access_token;

  if (!token) {
    console.log("No token");
    return;
  }

  try {
    const response = await fetch("http://127.0.0.1:8000/users/me", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      console.log("Session expired");
      chrome.storage.local.remove(["access_token"]);
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const user = await response.json();
    console.log("Logged in user:", user);
  } catch (error) {
    console.error("Trouble in session check:", error);
  }
});

}

document.addEventListener("DOMContentLoaded", () => {
  checkSession();
});

registerTab.addEventListener("click", () => setActiveTab("register"));
loginTab.addEventListener("click", () => setActiveTab("login"));
registerBtn.addEventListener("click", registerUser);
loginBtn.addEventListener("click", loginUser);
refreshTokenBtn.addEventListener("click", refreshTokenPreview);
logoutBtn.addEventListener("click", logoutUser);

refreshTokenPreview();
