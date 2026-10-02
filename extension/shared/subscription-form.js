const TRACKLY_FORM_ID = "trackly-subscription-form-modal";

function calculateRenewalDate(startDate, billingCycle) {
  const base = startDate ? new Date(`${startDate}T00:00:00Z`) : new Date();
  const monthsToAdd = billingCycle === "yearly" ? 12 : 1;

  const result = new Date(Date.UTC(
    base.getUTCFullYear(),
    base.getUTCMonth() + monthsToAdd,
    base.getUTCDate()
  ));

  return result.toISOString().split("T")[0];
}

function showSubscriptionForm(candidate, onSubmit, options = {}) {
  if (document.getElementById(TRACKLY_FORM_ID)) {
    return;
  }

  const title = options.title || t("addSubscription");
  const submitLabel = options.submitLabel || t("add");

  const modal = document.createElement("div");
  modal.id = TRACKLY_FORM_ID;

  modal.innerHTML = `
  <div class="trackly-card">
    <div class="trackly-top">
      <div>
        <img class="trackly-logo" src="${chrome.runtime.getURL("logo/wordmark.png")}" alt="Trackly" />
        <h2></h2>
        <p class="trackly-subtitle">${t("formSubtitle")}</p>
      </div>
      <button id="trackly-close-btn" class="trackly-icon-btn" type="button">×</button>
    </div>

    <div class="trackly-field">
      <label for="trackly-service-name">${t("formService")}</label>
      <input id="trackly-service-name" type="text" value="" />
    </div>

    <div class="trackly-field">
      <label for="trackly-plan-name">${t("formPlan")}</label>
      <input id="trackly-plan-name" type="text" placeholder="${t("formPlanPlaceholder")}" />
    </div>

    <div class="trackly-grid">
      <div class="trackly-field">
        <label for="trackly-price">${t("formPrice")}</label>
        <input id="trackly-price" type="number" step="0.01" placeholder="29.99" />
      </div>

      <div class="trackly-field">
        <label for="trackly-currency">${t("formCurrency")}</label>
        <select id="trackly-currency">
          <option value="PLN">PLN</option>
          <option value="EUR">EUR</option>
          <option value="USD">USD</option>
          <option value="GBP">GBP</option>
        </select>
      </div>
    </div>

    <div class="trackly-field">
      <label for="trackly-billing-cycle">${t("formCycle")}</label>
      <select id="trackly-billing-cycle">
        <option value="monthly">${t("cycleMonthly")}</option>
        <option value="yearly">${t("cycleYearly")}</option>
      </select>
    </div>

    <div class="trackly-field">
      <label for="trackly-renewal-date">${t("formRenewalDate")}</label>
      <input id="trackly-renewal-date" type="date" />
    </div>

    <label class="trackly-check">
      <input id="trackly-auto-renew" type="checkbox" checked />
      <span>${t("formAutoRenew")}</span>
    </label>

    <p id="trackly-form-error"></p>

    <div class="trackly-actions">
      <button id="trackly-cancel-btn" class="trackly-btn trackly-secondary" type="button">${t("cancel")}</button>
      <button id="trackly-save-btn" class="trackly-btn trackly-primary" type="button"></button>
    </div>
  </div>
`;

  document.body.appendChild(modal);

  modal.querySelector("h2").textContent = title;
  document.getElementById("trackly-save-btn").textContent = submitLabel;

  document.getElementById("trackly-service-name").value = candidate.service_name || "";
  document.getElementById("trackly-plan-name").value = candidate.plan_name || "";
  document.getElementById("trackly-price").value = candidate.price ?? "";
  document.getElementById("trackly-billing-cycle").value = candidate.billing_cycle || "monthly";
  document.getElementById("trackly-currency").value = candidate.currency || defaultCurrency();
  document.getElementById("trackly-auto-renew").checked = candidate.auto_renew ?? true;

  const billingCycleSelect = document.getElementById("trackly-billing-cycle");
  const renewalDateInput = document.getElementById("trackly-renewal-date");
  let renewalDateEdited = Boolean(candidate.renewal_date);

  renewalDateInput.value = candidate.renewal_date
    || calculateRenewalDate(candidate.start_date, billingCycleSelect.value);

  renewalDateInput.addEventListener("input", () => {
    renewalDateEdited = true;
  });

  billingCycleSelect.addEventListener("change", () => {
    if (!renewalDateEdited) {
      renewalDateInput.value = calculateRenewalDate(candidate.start_date, billingCycleSelect.value);
    }
  });

  const closeForm = () => {
    modal.remove();

    if (typeof options.onCancel === "function") {
      options.onCancel();
    }
  };

  document.getElementById("trackly-cancel-btn").addEventListener("click", closeForm);
  document.getElementById("trackly-close-btn").addEventListener("click", closeForm);

  const saveBtn = document.getElementById("trackly-save-btn");
  const savingLabel = t("saving");

  saveBtn.addEventListener("click", async () => {
    const payload = buildSubscriptionPayload(candidate);
    const error = validateSubscriptionPayload(payload);

    if (error) {
      document.getElementById("trackly-form-error").textContent = error;
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = savingLabel;

    try {
      await onSubmit(payload);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = submitLabel;
    }

    modal.remove();
  });
}

function buildSubscriptionPayload(candidate) {
  return {
    service_name: document.getElementById("trackly-service-name").value.trim(),
    plan_name: document.getElementById("trackly-plan-name").value.trim(),
    price: Number(document.getElementById("trackly-price").value),
    currency: document.getElementById("trackly-currency").value.trim().toUpperCase(),
    billing_cycle: document.getElementById("trackly-billing-cycle").value,
    start_date: candidate.start_date || new Date().toISOString().split("T")[0],
    renewal_date: document.getElementById("trackly-renewal-date").value || null,
    end_date: candidate.end_date || null,
    status: candidate.status || "confirmed",
    source: candidate.source,
    source_url: candidate.source_url,
    auto_renew: document.getElementById("trackly-auto-renew").checked
  };
}

function validateSubscriptionPayload(payload) {
  if (!payload.service_name) {
    return t("formErrorService");
  }

  if (!payload.plan_name) {
    return t("formErrorPlan");
  }

  if (!payload.price || payload.price <= 0) {
    return t("formErrorPrice");
  }

  if (!payload.currency || payload.currency.length !== 3) {
    return t("formErrorCurrency");
  }

  return null;
}

const style = document.createElement("style");
style.textContent = `
    #trackly-subscription-form-modal,
    #trackly-subscription-form-modal * {
    box-sizing: border-box;
    }
  
    #trackly-subscription-form-modal {
    position: fixed;
    inset: 0;
    z-index: 999999;
    background: rgba(2, 6, 23, 0.62);
    display: flex;
    justify-content: flex-end;
    align-items: flex-start;
    padding: 20px;
    overflow-y: auto;
    font-family: "Segoe UI", Arial, sans-serif;
  }

  #trackly-subscription-form-modal .trackly-card {
    width: 380px;
    background: #0f172a;
    color: #f8fafc;
    border: 1px solid rgba(148, 163, 184, 0.25);
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.45);
  }

  .trackly-top {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;
  }

  #trackly-subscription-form-modal .trackly-logo {
    display: block;
    width: 92px;
    height: auto;
    margin: 0 0 10px;
  }

  .trackly-top h2 {
    margin: 0 0 6px;
    font-size: 22px;
    line-height: 1.2;
  }

  .trackly-subtitle {
    margin: 0;
    color: #cbd5e1;
    font-size: 13px;
    line-height: 1.45;
  }

  .trackly-icon-btn {
    width: 32px;
    height: 32px;
    border: 1px solid rgba(148, 163, 184, 0.25);
    border-radius: 8px;
    background: rgba(15, 23, 42, 0.8);
    color: #e2e8f0;
    font-size: 22px;
    cursor: pointer;
  }

  .trackly-field {
    margin-bottom: 13px;
  }

  .trackly-field label {
    display: block;
    margin-bottom: 6px;
    color: #cbd5e1;
    font-size: 13px;
    font-weight: 600;
  }

  .trackly-field input,
  .trackly-field select {
    width: 100%;
    border: 1px solid rgba(148, 163, 184, 0.28);
    background: #020617;
    color: #f8fafc;
    border-radius: 10px;
    padding: 11px 12px;
    outline: none;
    font-size: 14px;
  }

  .trackly-field input:focus,
  .trackly-field select:focus {
    border-color: #22c55e;
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.18);
  }

  .trackly-grid {
    display: grid;
    grid-template-columns: 1.4fr 0.8fr;
    gap: 10px;
  }

  .trackly-check {
    display: flex;
    align-items: center;
    gap: 9px;
    margin: 4px 0 12px;
    color: #dbeafe;
    font-size: 13px;
  }

  .trackly-check input {
    width: 16px;
    height: 16px;
    accent-color: #22c55e;
  }

  #trackly-form-error {
    min-height: 18px;
    margin: 0 0 12px;
    color: #fca5a5;
    font-size: 13px;
  }

  .trackly-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .trackly-btn {
    border: 0;
    border-radius: 10px;
    padding: 11px 14px;
    cursor: pointer;
    font-weight: 800;
    font-size: 14px;
  }

  .trackly-secondary {
    background: #334155;
    color: #f8fafc;
  }

  .trackly-primary {
    background: #22c55e;
    color: #052e16;
  }

  .trackly-btn:hover,
  .trackly-icon-btn:hover {
    filter: brightness(1.08);
  }

  .trackly-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;


document.head.appendChild(style);
