const TRACKLY_TOAST_ID = "trackly-detection-toast";
const TRACKLY_TOAST_AUTO_HIDE_MS = 20000;
const TRACKLY_TOAST_CONFIRM_MS = 4000;

function formatToastSubtitle(candidate) {
  const parts = [];

  if (candidate.plan_name) {
    parts.push(candidate.plan_name);
  }

  if (candidate.price) {
    parts.push(`${candidate.price} ${candidate.currency || ""}`.trim());
  }

  return parts.join(" · ");
}

function showDetectionToast(candidate, { onAccept, onDismiss } = {}) {
  if (document.getElementById(TRACKLY_TOAST_ID)) {
    return;
  }

  const toast = document.createElement("div");
  toast.id = TRACKLY_TOAST_ID;
  toast.innerHTML = `<div class="trackly-toast-card"></div>`;
  document.body.appendChild(toast);

  const card = toast.querySelector(".trackly-toast-card");
  let autoHideTimer;

  function renderPrompt() {
    card.innerHTML = `
      <p class="trackly-toast-badge">Trackly Detector</p>
      <p class="trackly-toast-title"></p>
      <p class="trackly-toast-subtitle"></p>
      <div class="trackly-toast-actions">
        <button type="button" class="trackly-toast-btn trackly-toast-dismiss">Nie teraz</button>
        <button type="button" class="trackly-toast-btn trackly-toast-accept">Dodaj</button>
      </div>
    `;

    card.querySelector(".trackly-toast-title").textContent = `Wykryto: ${candidate.service_name}`;

    const subtitle = formatToastSubtitle(candidate);
    const subtitleEl = card.querySelector(".trackly-toast-subtitle");

    if (subtitle) {
      subtitleEl.textContent = subtitle;
    } else {
      subtitleEl.remove();
    }

    card.querySelector(".trackly-toast-dismiss").addEventListener("click", () => {
      clearTimeout(autoHideTimer);
      toast.remove();
      if (onDismiss) onDismiss();
    });

    card.querySelector(".trackly-toast-accept").addEventListener("click", async () => {
      clearTimeout(autoHideTimer);
      if (onAccept) {
        await onAccept();
      }
      renderConfirmation();
    });

    autoHideTimer = setTimeout(() => {
      toast.remove();
      if (onDismiss) onDismiss();
    }, TRACKLY_TOAST_AUTO_HIDE_MS);
  }

  function renderConfirmation() {
    card.innerHTML = `
      <p class="trackly-toast-badge">Trackly Detector</p>
      <p class="trackly-toast-title">Zapisano ✓</p>
      <p class="trackly-toast-subtitle">Otwórz Trackly z paska narzędzi, aby dokończyć dodawanie.</p>
    `;
    setTimeout(() => toast.remove(), TRACKLY_TOAST_CONFIRM_MS);
  }

  renderPrompt();
}

const TRACKLY_MESSAGE_TOAST_ID = "trackly-message-toast";
const TRACKLY_MESSAGE_TOAST_MS = 6000;

function showPageToast(message, { variant = "error" } = {}) {
  const existing = document.getElementById(TRACKLY_MESSAGE_TOAST_ID);

  if (existing) {
    existing.remove();
  }

  const toast = document.createElement("div");
  toast.id = TRACKLY_MESSAGE_TOAST_ID;
  toast.innerHTML = `
    <div class="trackly-toast-card trackly-toast-${variant}">
      <p class="trackly-toast-badge">Trackly</p>
      <p class="trackly-toast-title"></p>
    </div>
  `;

  toast.querySelector(".trackly-toast-title").textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), TRACKLY_MESSAGE_TOAST_MS);
}

const tracklyToastStyle = document.createElement("style");
tracklyToastStyle.textContent = `
  #trackly-detection-toast,
  #trackly-message-toast {
    position: fixed;
    right: 20px;
    bottom: 20px;
    z-index: 999999;
    font-family: "Segoe UI", Arial, sans-serif;
    animation: trackly-toast-in 0.25s ease;
  }

  @keyframes trackly-toast-in {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  #trackly-detection-toast .trackly-toast-card,
  #trackly-message-toast .trackly-toast-card {
    width: 300px;
    background: #0f172a;
    color: #f8fafc;
    border: 1px solid rgba(148, 163, 184, 0.25);
    border-radius: 14px;
    padding: 16px;
    box-shadow: 0 18px 50px rgba(0, 0, 0, 0.45);
  }

  .trackly-toast-badge {
    margin: 0 0 6px;
    color: #86efac;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .trackly-toast-title {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    line-height: 1.3;
  }

  .trackly-toast-subtitle {
    margin: 4px 0 0;
    font-size: 13px;
    color: #cbd5e1;
  }

  .trackly-toast-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 14px;
  }

  .trackly-toast-btn {
    border: 0;
    border-radius: 10px;
    padding: 9px 10px;
    cursor: pointer;
    font-weight: 700;
    font-size: 13px;
  }

  .trackly-toast-dismiss {
    background: #334155;
    color: #f8fafc;
  }

  .trackly-toast-accept {
    background: #22c55e;
    color: #052e16;
  }

  .trackly-toast-btn:hover {
    filter: brightness(1.08);
  }

  .trackly-toast-error .trackly-toast-badge {
    color: #fca5a5;
  }
`;

document.head.appendChild(tracklyToastStyle);
