//neutralizowanie mylacych znakow, zamiana na bezpieczne odpowiedniki
//przydatne do pozniejszego scrapowania z ML
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function showConfirm(message) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "trackly-confirm-overlay";
    overlay.innerHTML = `
      <div class="trackly-confirm-card">
        <p class="trackly-confirm-message"></p>
        <div class="trackly-confirm-actions">
          <button type="button" class="trackly-confirm-cancel">Anuluj</button>
          <button type="button" class="trackly-confirm-ok">Usuń</button>
        </div>
      </div>
    `;

    overlay.querySelector(".trackly-confirm-message").textContent = message;
    document.body.appendChild(overlay);

    const close = (result) => {
      overlay.remove();
      resolve(result);
    };

    overlay.querySelector(".trackly-confirm-cancel").addEventListener("click", () => close(false));
    overlay.querySelector(".trackly-confirm-ok").addEventListener("click", () => close(true));
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        close(false);
      }
    });
  });
}

async function loadSubscriptions() {
  const token = await getToken();

  if (!token) {
    return;
  }

  renderListLoading();

  try {
    const [user, subscriptions, expiring] = await Promise.all([
      getCurrentUserRequest(token),
      getSubscriptionsRequest(token),
      getExpiringSubscriptionsRequest(token, 7)
    ]);

    renderUserInfo(user);
    renderSubscriptionsSummary(subscriptions);
    renderSubscriptionsList(subscriptions);
    renderExpiringList(expiring);
    bindSubscriptionActions();
  } catch (error) {
    console.error("Failed to load subscriptions:", error);

    if (error.status === 401) {
      await removeToken();

      if (typeof showAuthView === "function") {
        showAuthView();
      }
      if (typeof showStatus === "function") {
        showStatus("Sesja wygasła. Zaloguj się ponownie.", "error");
      }
    }
  }
}

let subscriptionActionsBound = false;
let currentSubscriptions = [];

function bindSubscriptionActions() {
  if (subscriptionActionsBound) {
    return;
  }

  const listElement = document.getElementById("subscriptionsList");

  if (!listElement) {
    return;
  }

  listElement.addEventListener("click", handleSubscriptionListClick);
  subscriptionActionsBound = true;
}

async function handleSubscriptionListClick(event) {
  const editBtn = event.target.closest("[data-action='edit']");

  if (editBtn) {
    handleEditClick(editBtn);
    return;
  }

  const deleteBtn = event.target.closest("[data-action='delete']");

  if (!deleteBtn) {
    return;
  }

  const id = deleteBtn.dataset.id;
  const item = deleteBtn.closest(".subscription-item");
  const serviceName = item
    ? item.querySelector(".subscription-service").textContent
    : "tę subskrypcję";

  const confirmed = await showConfirm(`Usunąć subskrypcję: ${serviceName}? Tej operacji nie można cofnąć.`);
  if (!confirmed) {
    return;
  }

  const token = await getToken();

  if (!token) {
    return;
  }

  try {
    await deleteSubscriptionRequest(token, id);
    await loadSubscriptions();
  } catch (error) {
    console.error("Failed to delete subscription:", error);
    if (typeof showStatus === "function") {
      showStatus(`Nie udało się usunąć subskrypcji: ${error.message}`, "error");
    }
  }
}

function handleEditClick(editBtn) {
  const id = editBtn.dataset.id;
  const sub = currentSubscriptions.find((s) => String(s.id) === String(id));

  if (!sub) {
    return;
  }

  showSubscriptionForm(
    sub,
    async (payload) => {
      const token = await getToken();

      if (!token) {
        return;
      }

      try {
        await updateSubscriptionRequest(token, id, payload);
        await loadSubscriptions();
      } catch (error) {
        console.error("Failed to update subscription:", error);
        if (typeof showStatus === "function") {
          showStatus(`Nie udało się zapisać zmian: ${error.message}`, "error");
        }
      }
    },
    { title: "Edytuj subskrypcję", submitLabel: "Zapisz" }
  );
}

function renderUserInfo(user) {
  const userEmailText = document.getElementById("userEmailText");
  userEmailText.textContent = user.email;
}

function renderSubscriptionsSummary(subscriptions) {
  const confirmed = subscriptions.filter((s) => s.status === "confirmed");

  document.getElementById("subscriptionsCount").textContent = confirmed.length;

  const monthly = {};
  const yearly = {};

  confirmed.forEach((sub) => {
    const currency = sub.currency || "PLN";
    const price = Number(sub.price) || 0;

    if (sub.billing_cycle === "yearly") {
      yearly[currency] = (yearly[currency] || 0) + price;
    } else {
      monthly[currency] = (monthly[currency] || 0) + price;
    }
  });

  const annual = {};

  Object.entries(monthly).forEach(([currency, total]) => {
    annual[currency] = (annual[currency] || 0) + total * 12;
  });

  Object.entries(yearly).forEach(([currency, total]) => {
    annual[currency] = (annual[currency] || 0) + total;
  });

  document.getElementById("monthlyTotal").textContent = formatMoney(monthly);
  document.getElementById("yearlyTotal").textContent = formatMoney(yearly);
  document.getElementById("annualTotal").textContent = formatMoney(annual);
}

function formatMoney(totalsByCurrency) {
  const entries = Object.entries(totalsByCurrency);

  if (!entries.length) {
    return "0 PLN";
  }

  return entries
    .map(([currency, total]) => `${Math.round(total * 100) / 100} ${currency}`)
    .join(" / ");
}

function renderSubscriptionItem(sub) {
  return `
    <div class="subscription-item">
      <div class="subscription-item-header">
         <p class="subscription-service">${escapeHtml(sub.service_name)}</p>
                <span class="subscription-status status-${sub.status}">${sub.status}</span>
      </div>

      <p class="subscription-plan">Plan: ${escapeHtml(sub.plan_name)}</p>

      <div class="subscription-meta">
        <span>Cena: ${sub.price} ${escapeHtml(sub.currency)}</span>
        <span>Cykl: ${escapeHtml(sub.billing_cycle)}</span>
        <span>Odnowienie: ${sub.renewal_date || "brak danych"}</span>
        <span>Auto-renew: ${sub.auto_renew ? "tak" : "nie"}</span>
      </div>

      <div class="subscription-actions-row">
      <button class="sub-action-btn sub-edit-btn" data-action="edit" data-id="${sub.id}" type="button">
          Edytuj
        </button>
        <button class="sub-action-btn sub-delete-btn" data-action="delete" data-id="${sub.id}" type="button">
          Usuń
        </button>
      </div>
    </div>
  `;
}

function renderListLoading() {
  const listElement = document.getElementById("subscriptionsList");

  if (!listElement) {
    return;
  }

  listElement.innerHTML = `
    <div class="subscription-empty-state">
      Ładowanie subskrypcji…
    </div>
  `;
}

function renderSubscriptionsList(subscriptions) {
  currentSubscriptions = subscriptions;
  const listElement = document.getElementById("subscriptionsList");

  if (!subscriptions.length) {
    listElement.innerHTML = `
      <div class="subscription-empty-state">
        Nie masz jeszcze żadnych subskrypcji.
      </div>
    `;
    return;
  }

  const html = subscriptions.map(renderSubscriptionItem).join("");
  listElement.innerHTML = html;
}

function renderExpiringList(subscriptions) {
  const listElement = document.getElementById("expiringList");

  if (!subscriptions.length) {
    listElement.innerHTML = `
      <div class="subscription-empty-state">
        Brak subskrypcji odnawiających się wkrótce.
      </div>
    `;
    return;
  }

  listElement.innerHTML = subscriptions
    .map((sub) => `
      <div class="subscription-item">
        <p class="subscription-service">${escapeHtml(sub.service_name)}</p>
        <div class="subscription-meta">
          <span>Plan: ${escapeHtml(sub.plan_name)}</span>
          <span>Cena: ${sub.price} ${escapeHtml(sub.currency)}</span>
          <span>Odnowienie: ${sub.renewal_date}</span>
        </div>
      </div>
    `)
    .join("");
}