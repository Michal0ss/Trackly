const statusBox = document.getElementById("statusBox");
const panelStatusBox = document.getElementById("panelStatusBox");
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

let statusTimer = null;

function showStatus(message, type = "info") {
  clearStatus();

  const box = subscriptionsView.style.display === "block" ? panelStatusBox : statusBox;
  box.textContent = message;
  box.className = `status show ${type}`;

  if (type === "success") {
    statusTimer = setTimeout(clearStatus, 4000);
  }
}

function clearStatus() {
  clearTimeout(statusTimer);

  [statusBox, panelStatusBox].forEach((box) => {
    box.textContent = "";
    box.className = "status";
  });
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
  resetPanel();
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

  if (await isServiceInPanel(pending.candidate.service_name)) {
    await markKeyAsSubmitted(pending.key);
    await clearPendingDetection(pending.key);
    await syncPendingBadge();
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

        if (error.status === 409 && pending.key) {
          await markKeyAsSubmitted(pending.key);
          await clearPendingDetection(pending.key);
          await syncPendingBadge();
        }

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

async function checkSession() {
  const [token, cached] = await Promise.all([getToken(), readPanelCache()]);

  if (!token) {
    showAuthView();
    return;
  }

  showSubscriptionsView();

  if (cached) {
    renderPanel(cached);
  } else {
    renderPanelLoading();
  }

  await maybeShowPendingDetection();
  await loadSubscriptions();
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
