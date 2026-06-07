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

const dashboardLogoutBtn = document.getElementById("dashboardLogoutBtn");

const refreshSubscriptionsBtn = document.getElementById("refreshSubscriptionsBtn");

const addSubscriptionBtn = document.getElementById("addSubscriptionBtn");
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
  tokenValue.textContent = token || "Brak tokenu";
}

async function registerUser() {
  clearStatus();

  const email = registerEmail.value.trim();
  const password = registerPassword.value;

  if (!email || !password) {
    showStatus("Podaj email i hasło, aby się zarejestrować.", "error");
    return;
  }

  try {
    await registerUserRequest(email, password);
    showStatus("Konto utworzone. Możesz się teraz zalogować.", "success");
    registerPassword.value = "";
    loginEmail.value = email;
    setActiveTab("login");
  } catch (error) {
    showStatus(`Błąd rejestracji: ${error.message}`, "error");
  }
}

async function logoutUser() {
  await removeToken();
  await refreshTokenPreview();
  showAuthView();
  setActiveTab("login");
  showStatus("Wylogowano.");
}

async function loginUser() {
  clearStatus();

  const email = loginEmail.value.trim();
  const password = loginPassword.value;

  if (!email || !password) {
    showStatus("Podaj email i hasło, aby się zalogować.", "error");
    return;
  }

  try {
    const data = await loginUserRequest(email, password);

    await saveToken(data.access_token);
    await refreshTokenPreview();
    await loadSubscriptions();

    loginPassword.value = "";
    showSubscriptionsView();
    showStatus("Zalogowano pomyślnie.", "success");
  } catch (error) {
    showStatus(`Błąd logowania: ${error.message}`, "error");
  }
}

function openManualSubscriptionForm() {
  showSubscriptionForm(
    {
      service_name: "",
      currency: "PLN",
      source: "manual",
      source_url: ""
    },
    async (payload) => {
      const token = await getToken();

      if (!token) {
        showStatus("Zaloguj się we wtyczce, aby dodać subskrypcję.", "error");
        return;
      }

      try {
        await createSubscriptionRequest(token, payload);
        await loadSubscriptions();
        showStatus("Subskrypcja dodana.", "success");
      } catch (error) {
        console.error("Failed to create subscription:", error);
        showStatus(`Nie udało się dodać subskrypcji: ${error.message}`, "error");
      }
    }
  );
}

async function checkSession() {
  const token = await getToken();

  if (!token) {
    showAuthView();
    return;
  }

  try {
    await getCurrentUserRequest(token);
    await loadSubscriptions();
    showSubscriptionsView();
  } catch (error) {
    await removeToken();
    await refreshTokenPreview();
    showAuthView();
    showStatus("Sesja wygasła. Zaloguj się ponownie.", "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  checkSession();
});

addSubscriptionBtn.addEventListener("click", openManualSubscriptionForm);
registerTab.addEventListener("click", () => setActiveTab("register"));
loginTab.addEventListener("click", () => setActiveTab("login"));
registerBtn.addEventListener("click", registerUser);
loginBtn.addEventListener("click", loginUser);
refreshTokenBtn.addEventListener("click", refreshTokenPreview);
logoutBtn.addEventListener("click", logoutUser);
dashboardLogoutBtn.addEventListener("click", logoutUser);
refreshSubscriptionsBtn.addEventListener("click", loadSubscriptions);

refreshTokenPreview();
