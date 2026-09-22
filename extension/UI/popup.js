const statusBox = document.getElementById("statusBox");
const tokenValue = document.getElementById("tokenValue");
const refreshTokenBtn = document.getElementById("refreshTokenBtn");
const logoutBtn = document.getElementById("logoutBtn");
const authView = document.getElementById("authView");
const subscriptionsView = document.getElementById("subscriptionsView");
const dashboardLogoutBtn = document.getElementById("dashboardLogoutBtn");
const refreshSubscriptionsBtn = document.getElementById("refreshSubscriptionsBtn");
const addSubscriptionBtn = document.getElementById("addSubscriptionBtn");
const googleLoginBtn = document.getElementById("googleLoginBtn");

const GREETINGS = ["Witaj", "Cześć", "Miło Cię widzieć", "Dobrze Cię widzieć"];

function showRandomGreeting() {
  const greeting = document.getElementById("greeting");

  if (greeting) {
    greeting.textContent = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
  }
}

function getGoogleToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError || !token) {
        reject(new Error(chrome.runtime.lastError?.message || "Nie udało się pobrać tokenu Google"));
        return;
      }

      resolve(token);
    });
  });
}

async function loginWithGoogle() {
  clearStatus();
  showStatus("Łączenie z Google...");

  try {
    const googleToken = await getGoogleToken();
    const data = await googleLoginRequest(googleToken);

    await saveToken(data.access_token);
    await refreshTokenPreview();
    await loadSubscriptions();

    showSubscriptionsView();
    showStatus("Zalogowano pomyślnie.", "success");
  } catch (error) {
    showStatus(`Błąd logowania: ${error.message}`, "error");
  }
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

async function logoutUser() {
  await removeToken();
  await refreshTokenPreview();
  showAuthView();
  showStatus("Wylogowano.");
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
        showStatus("Subskrypcja dodana.",  "success");
      } catch (error) {
        console.error("Failed to create subscription:", error);
        showStatus(`Nie udało się dodać subskrypcji: ${error.message}`, "error");
      }
    }
  );
}

async function syncPendingBadge() {
  const pending = await countPendingDetections();

  chrome.action.setBadgeText({ text: pending ? String(pending) : "" });
}

async function maybeShowPendingDetection() {
  const pending = await getPendingDetection();

  chrome.action.setBadgeText({ text: "" });

  if (!pending || !pending.candidate) {
    return;
  }

  showSubscriptionForm(
    pending.candidate,
    async (payload) => {
      const token = await getToken();

      if (!token) {
        showStatus("Zaloguj się we wtyczce, aby dodać subskrypcję.", "error");
        return;
      }

      try {
        await createSubscriptionRequest(token, payload);

        if (pending.key) {
          await markKeyAsSubmitted(pending.key);
        }

        await clearPendingDetection(pending.key);
        await syncPendingBadge();
        await loadSubscriptions();
        showStatus(`Subskrypcja ${payload.service_name} została dodana.`, "success");
      } catch (error) {
        console.error("Failed to create subscription:", error);
        showStatus(`Nie udało się dodać subskrypcji: ${error.message}`, "error");
      }
    },
    {
      title: "Wykryto subskrypcję",
      submitLabel: "Dodaj",
      onCancel: () => {
        clearPendingDetection(pending.key).then(syncPendingBadge);
      }
    }
  );
}

function hideBothViews() {
  authView.style.display = "none";
  subscriptionsView.style.display = "none";
}

async function checkSession() {
  hideBothViews();

  const token = await getToken();

  if (!token) {
    showAuthView();
    return;
  }

  try {
    await getCurrentUserRequest(token);
  } catch (error) {
    showAuthView();

    if (error.status === 401 || error.status === 403) {
      await removeToken();
      await refreshTokenPreview();
      showStatus("Sesja wygasła. Zaloguj się ponownie.", "error");
    } else {
      showStatus("Nie udało się połączyć z serwerem. Spróbuj ponownie za chwilę.", "error");
    }

    return;
  }

  showSubscriptionsView();
  await loadSubscriptions();
  await maybeShowPendingDetection();
}

document.addEventListener("DOMContentLoaded", () => {
  showRandomGreeting();
  checkSession();
});

addSubscriptionBtn.addEventListener("click", openManualSubscriptionForm);
googleLoginBtn.addEventListener("click", loginWithGoogle);
refreshTokenBtn.addEventListener("click", refreshTokenPreview);
logoutBtn.addEventListener("click", logoutUser);
dashboardLogoutBtn.addEventListener("click", logoutUser);
refreshSubscriptionsBtn.addEventListener("click", loadSubscriptions);

refreshTokenPreview();
