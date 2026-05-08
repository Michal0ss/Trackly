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

const authView = document.getElementById("authView");
const subscriptionsView = document.getElementById("subscriptionsView");

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

function showAuthView() {
  authView.style.display = "block";
  subscriptionsView.style.display = "none";
}

function showSubscriptionsView() {
  authView.style.display = "none";
  subscriptionsView.style.display = "block";
}

async function refreshTokenPreview() {
  const token = await getToken();
  tokenValue.textContent = token || "No token";
}

async function registerUser() {
  clearStatus();

  const email = registerEmail.value.trim();
  const password = registerPassword.value;

  if (!email || !password) {
    showStatus("Please enter email and password to register.", "error");
    return;
  }

  try {
    await registerUserRequest(email, password);
    showStatus("Account created. You can now log in.", "success");
    registerPassword.value = "";
    loginEmail.value = email;
    setActiveTab("login");
  } catch (error) {
    showStatus(`Registration error: ${error.message}`, "error");
  }
}

async function loginUser() {
  clearStatus();

  const email = loginEmail.value.trim();
  const password = loginPassword.value;

  if (!email || !password) {
    showStatus("Please enter email and password to log in.", "error");
    return;
  }

  try {
    const data = await loginUserRequest(email, password);

    await saveToken(data.access_token);
    await refreshTokenPreview();

    loginPassword.value = "";
    showSubscriptionsView();
    showStatus("Logged in successfully.", "success");
  } catch (error) {
    showStatus(`Login error: ${error.message}`, "error");
  }
}

async function logoutUser() {
  await removeToken();
  await refreshTokenPreview();
  showAuthView();
  showStatus("Logged out.", "info");
}

async function checkSession() {
  const token = await getToken();

  if (!token) {
    showAuthView();
    return;
  }

  try {
    await getCurrentUserRequest(token);
    showSubscriptionsView();
  } catch (error) {
    await removeToken();
    await refreshTokenPreview();
    showAuthView();
    showStatus("Session expired. Please log in again.", "error");
  }
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
