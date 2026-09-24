const STATUS_LABELS = {
  confirmed: "Aktywna",
  cancelled: "Anulowana",
  expired: "Wygasła"
};

const BILLING_CYCLE_LABELS = {
  monthly: "Miesięcznie",
  yearly: "Rocznie"
};

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

let panelRendered = false;

function renderPanel({ user, subscriptions, expiring }) {
  renderUserInfo(user);
  renderSubscriptionsSummary(subscriptions);
  renderSubscriptionsList(subscriptions);
  renderExpiringList(expiring);
  bindSubscriptionActions();
  document.getElementById("subscriptionsView").classList.remove("is-loading");
  panelRendered = true;
}

function renderPanelLoading() {
  document.getElementById("subscriptionsView").classList.add("is-loading");
  document.getElementById("expiringList").innerHTML = `
    <div class="subscription-empty-state">
      Ładowanie…
    </div>
  `;
  renderListLoading();
}

function renderPanelError() {
  document.getElementById("subscriptionsView").classList.remove("is-loading");
  document.querySelectorAll("#subscriptionsView .summary-value").forEach((value) => {
    value.textContent = "-";
  });
  document.getElementById("expiringList").innerHTML = `
    <div class="subscription-empty-state">
      Brak danych.
    </div>
  `;
  document.getElementById("subscriptionsList").innerHTML = `
    <div class="subscription-empty-state">
      Nie udało się pobrać subskrypcji.
    </div>
  `;
}

function resetPanel() {
  panelRendered = false;
}

async function loadSubscriptions() {
  const token = await getToken();

  if (!token) {
    return;
  }

  if (!panelRendered) {
    renderPanelLoading();
  }

  try {
    const [user, subscriptions, expiring] = await Promise.all([
      getCurrentUserRequest(token),
      getSubscriptionsRequest(token),
      getExpiringSubscriptionsRequest(token, 7)
    ]);
    const panel = { user, subscriptions, expiring };

    renderPanel(panel);
    await writePanelCache(panel);
  } catch (error) {
    console.error("Failed to load subscriptions:", error);

    if (error.status === 401 || error.status === 403) {
      await removeToken();
      resetPanel();

      if (typeof showAuthView === "function") {
        showAuthView();
      }
      if (typeof showStatus === "function") {
        showStatus("Sesja wygasła. Zaloguj się ponownie.", "error");
      }
      return;
    }

    if (!panelRendered) {
      renderPanelError();
    }
    if (typeof showStatus === "function") {
      showStatus(
        panelRendered
          ? "Brak połączenia z serwerem. Widzisz ostatnio pobrane dane."
          : "Nie udało się połączyć z serwerem. Spróbuj ponownie za chwilę.",
        "error"
      );
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

function formatAmount(value) {
  const amount = Math.round(Number(value) * 100) / 100;

  return amount.toLocaleString("pl-PL", {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2
  });
}

function formatMoney(totalsByCurrency) {
  const entries = Object.entries(totalsByCurrency);

  if (!entries.length) {
    return "0 PLN";
  }

  return entries
    .map(([currency, total]) => `${formatAmount(total)} ${currency}`)
    .join("\n");
}

const ACTION_ICONS = {
  manage: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
  edit: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>`,
  delete: `<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`
};

function renderManageLink(sub, className) {
  const url = findServiceLink(sub.service_name);

  if (!url) {
    return "";
  }

  return `<a class="${className}" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer"
    aria-label="Zarządzaj subskrypcją"
    title="Otwiera stronę serwisu z ustawieniami subskrypcji albo instrukcją rezygnacji">${ACTION_ICONS.manage}</a>`;
}

function renderSubscriptionItem(sub) {
  return `
    <div class="subscription-item">
      <div class="subscription-item-header">
         <p class="subscription-service">${escapeHtml(sub.service_name)}</p>
            <span class="subscription-status status-${sub.status}">${STATUS_LABELS[sub.status] || escapeHtml(sub.status)}</span>
      </div>

      <p class="subscription-plan">Plan: ${escapeHtml(sub.plan_name)}</p>

      <div class="subscription-meta">
        <span>Cena: ${formatAmount(sub.price)} ${escapeHtml(sub.currency)}</span>
        <span>Cykl: ${BILLING_CYCLE_LABELS[sub.billing_cycle] || escapeHtml(sub.billing_cycle)}</span>
        <span>Odnowienie: ${sub.renewal_date || "brak danych"}</span>
        <span>Automatyczne odnawianie: ${sub.auto_renew ? "tak" : "nie"}</span>
      </div>

      <div class="subscription-actions-row">
        ${renderManageLink(sub, "sub-action-btn sub-manage-btn")}
        <button class="sub-action-btn sub-edit-btn" data-action="edit" data-id="${sub.id}" type="button"
          aria-label="Edytuj" title="Edytuj">${ACTION_ICONS.edit}</button>
        <button class="sub-action-btn sub-delete-btn" data-action="delete" data-id="${sub.id}" type="button"
          aria-label="Usuń" title="Usuń">${ACTION_ICONS.delete}</button>
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
        <div class="subscription-item-header">
          <p class="subscription-service">${escapeHtml(sub.service_name)}</p>
          ${renderManageLink(sub, "expiring-manage")}
        </div>
        <div class="subscription-meta">
          <span>Plan: ${escapeHtml(sub.plan_name)}</span>
          <span>Cena: ${formatAmount(sub.price)} ${escapeHtml(sub.currency)}</span>
          <span>Odnowienie: ${sub.renewal_date}</span>
        </div>
      </div>
    `)
    .join("");
}