async function getBudgetSummaryRequest(token) {
  return apiRequest("/subscriptions/summary/budget", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
}

async function loadSubscriptions() {
  const token = await getToken();

  if (!token) {
    return;
  }

  try {
    const [user, subscriptions, budget] = await Promise.all([
      getCurrentUserRequest(token),
      getSubscriptionsRequest(token),
      getBudgetSummaryRequest(token)
    ]);

    renderUserInfo(user);
    renderSubscriptionsSummary(subscriptions, budget);
    renderSubscriptionsList(subscriptions);
    bindSubscriptionActions();
  } catch (error) {
    console.error("Failed to load subscriptions:", error);
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

  if (!confirm(`Usunąć subskrypcję: ${serviceName}? Tej operacji nie można cofnąć.`)) {
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
    alert(`Nie udało się usunąć subskrypcji: ${error.message}`);
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
        alert(`Nie udało się zapisać zmian: ${error.message}`);
      }
    },
    { title: "Edytuj subskrypcję", submitLabel: "Zapisz" }
  );
}

function renderUserInfo(user) {
  const userEmailText = document.getElementById("userEmailText");
  userEmailText.textContent = user.email;
}

function renderSubscriptionsSummary(subscriptions, budget) {
  const subscriptionsCount = document.getElementById("subscriptionsCount");
  const monthlyTotal = document.getElementById("monthlyTotal");

  subscriptionsCount.textContent = subscriptions.length;

  const budgetEntries = Object.entries(budget);

  if (!budgetEntries.length) {
    monthlyTotal.textContent = "0 PLN";
    return;
  }

  monthlyTotal.textContent = budgetEntries
    .map(([currency, total]) => `${total} ${currency}`)
    .join(" / ");
}

function renderSubscriptionItem(sub) {
  return `
    <div class="subscription-item">
      <div class="subscription-item-header">
        <p class="subscription-service">${sub.service_name}</p>
        <span class="subscription-status">${sub.status}</span>
      </div>

      <p class="subscription-plan">Plan: ${sub.plan_name}</p>

      <div class="subscription-meta">
        <span>Cena: ${sub.price} ${sub.currency}</span>
        <span>Cykl: ${sub.billing_cycle}</span>
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