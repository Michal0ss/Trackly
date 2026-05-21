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
  } catch (error) {
    console.error("Failed to load subscriptions:", error);
  }
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
    </div>
  `;
}


function renderSubscriptionsList(subscriptions) {
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