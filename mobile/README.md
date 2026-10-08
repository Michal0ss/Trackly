# Trackly mobile

An Expo SDK 57 app for recurring payments and subscriptions saved by the Trackly
extension. M1 connects to a local test account. Google/Apple sign-in, chat and
reminders are not implemented yet.

## Features

- Monthly planned commitments, separate totals for each currency and the next due date.
- One list of recurring payments and read-only extension subscriptions.
- Payment creation, editing and confirmed deletion, with form validation.
- Refresh, loading, empty, expired-session and connection-error states.
- Polish and English, with a saved language preference.

## Run locally

Use Python 3.12, Node 24 and Expo Go compatible with SDK 57. No Docker is needed.
Run the following backend commands from the repository root, with dependencies
already installed in `.venv`.

Use only a disposable local SQLite database. Generate a separate local signing key
once, without displaying it. Keep this key separate from production credentials:

```bash
.venv/bin/python -c "import os,secrets; p='/tmp/trackly-dev-secret'; fd=os.open(p,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600); os.write(fd,secrets.token_bytes(48).hex().encode()); os.close(fd)"
```

If the file already exists, reuse it. In one terminal, start the local API:

```bash
DATABASE_URL=sqlite:////tmp/trackly-dev.db SECRET_KEY="$(cat /tmp/trackly-dev-secret)" ACCESS_TOKEN_EXPIRE_MINUTES=43200 ALLOWED_ORIGINS=http://localhost:8081 .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
```

In another terminal, create a local test user and print a 30-day development token:

```bash
DATABASE_URL=sqlite:////tmp/trackly-dev.db SECRET_KEY="$(cat /tmp/trackly-dev-secret)" ACCESS_TOKEN_EXPIRE_MINUTES=43200 .venv/bin/python - <<'PY'
from app.database.db import Base, SessionLocal, engine
from app.models.models import Users
from app.utils.security import create_access_token

Base.metadata.create_all(bind=engine)
with SessionLocal() as db:
    user = db.query(Users).filter_by(email='dev@trackly.local').first()
    if user is None:
        user = Users(email='dev@trackly.local', google_id='dev')
        db.add(user)
        db.commit()
        db.refresh(user)
    print(create_access_token({'user_id': user.id}))
PY
```

From `mobile/`, install packages and copy the environment template:

```bash
npm ci
```

```bash
cp .env.example .env.local
```

Edit `.env.local` yourself. Set `EXPO_PUBLIC_API_URL` to
`http://<your Mac's Wi-Fi IPv4 address>:8000` and `EXPO_PUBLIC_DEV_TOKEN` to the token
printed above. On macOS the Wi-Fi address is shown in System Settings > Wi-Fi >
Details > TCP/IP. For a browser-only preview, `http://localhost:8000` also works.
Keep the token out of Git, screenshots and messages.

```bash
npm start
```

Connect the iPhone and Mac to the same trusted Wi-Fi, scan the QR code with Camera
and open Expo Go. Allow local network access. The API and Expo terminals must stay
running. If connection fails, first open `http://<your Mac's Wi-Fi IPv4 address>:8000/docs`
in the phone's browser. Check the address, firewall and Wi-Fi client isolation.

To preview in a browser instead:

```bash
npm run web
```

Open `http://localhost:8081`. If Expo chooses another port, update `ALLOWED_ORIGINS`
on the backend to include that exact origin. Restart Expo after changing environment
variables and fully reload the app. Generate a new token when the old one expires.

Development sign-in only accepts localhost or private IPv4 addresses and is disabled
when `__DEV__` is false. `EXPO_PUBLIC_*` values are visible in development bundles,
so this must never contain a production token or a token for a real account.
Production exports remove the development sign-in code. Without this local setup,
the app shows a disconnected state. There is no production sign-in in M1.

Try adding a monthly payment, an annual payment and a second currency. Move between
months, edit a payment, cancel a deletion and then confirm it. Check a payment due on
the 31st in February and March, and one with an end date. Subscriptions saved in the
same local account appear read-only. Totals are planned obligations, not recorded
spending. The next due date is counted from today, even when browsing another month.

Switch languages in Settings. Stop the API and refresh to check the connection state;
previously loaded data is marked as potentially outdated. Restart the API and retry.
A failed save is never retried automatically because the server may already have
accepted it. Refresh the list before attempting another save.

```bash
npm run typecheck
```

```bash
npm run lint
```

```bash
npm test
```

```bash
npm run build
```

The build exports JavaScript and assets for iOS, Android and the browser into the
ignored `dist/` directory. It does not produce a signed IPA or APK. Browser checks
and exports do not replace Expo Go testing on a physical phone, particularly keyboard
behaviour, safe areas, larger text and pull to refresh.

## Data and credits

Payments are stored by the existing API. Only the language preference is persisted
on the device; fetched payment data stays in memory. There is no offline write queue,
analytics or model-provider integration. Expo Go has its own development tools.

The logo and icon come from the existing Trackly site and extension. Manrope and
Source Sans 3 use the SIL Open Font License. Feather icons come from `@expo/vector-icons`.
The initial template was trimmed and upgraded to SDK 57. The application screens,
API client and tests are project code; npm generates dependency metadata.
