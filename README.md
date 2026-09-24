![Trackly](docs/banner.png)

# Trackly

Chrome extension that recognises a subscription at the moment you buy it, and keeps the
costs and renewal dates in one place.

Recognition runs locally in the browser. Page content never leaves the machine - only
what you confirm and save is sent to the backend.

## Layout

| Path | What it is |
| --- | --- |
| `app/` | FastAPI backend, SQLAlchemy, JWT issued after Google sign-in |
| `extension/` | Chrome extension, Manifest V3 |
| `site/` | Landing page and privacy policy, Next.js |
| `tests/` | pytest suite |

## How detection works

1. On a supported service the content script collects candidates - service name, plan,
   price, billing cycle - and keeps them in local storage as you browse. Nothing is shown.
2. The prompt appears only when you click a purchase button. The form comes prefilled.
3. Once you confirm, the subscription is saved through the API and shows up in the popup.

The recogniser is a set of regular expressions in `extension/shared/detector.js` and makes
no network calls. It was ported from the Python version, which the test suite still covers.

## Running locally

### Backend

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

Copy `.env.example` to `.env` and fill in:

- `SECRET_KEY` - signs the JWTs. Generate one with
  `python3 -c "import secrets; print(secrets.token_urlsafe(48))"`
- `GOOGLE_CLIENT_ID` - OAuth client id from the Google Cloud Console
- `ALLOWED_ORIGINS` - `chrome-extension://<id>`, already filled in with the pinned id
- `DATABASE_URL` - optional. Defaults to a local SQLite file. Point it at a Postgres
  connection string (Supabase or otherwise) to use that instead - `app/database/db.py`
  switches pooling behaviour automatically based on the scheme.

```bash
.venv/bin/python -m uvicorn app.main:app --reload
```

Runs on `http://127.0.0.1:8000`, docs at `/docs`.

### Extension

Open `chrome://extensions`, turn on Developer mode, choose Load unpacked and point it at
`extension/`.

The extension id is pinned by the `key` field in the manifest, so it is identical on every
machine. That matters because the Google OAuth client is registered against one id.

It talks to the deployed API by default. To point it at a backend running on your own
machine, open the popup, then its devtools console, and run:

```js
chrome.storage.local.set({ api_base_url: "http://127.0.0.1:8000" })
```

Reload the extension afterwards. Remove the key to go back to production:

```js
chrome.storage.local.remove("api_base_url")
```

Chrome only waives CORS for hosts listed in `host_permissions`, which now covers the
deployed API alone. If local calls get blocked, add `"http://127.0.0.1:8000/*"` to that
list while you work, and take it out before packaging for the store.

### Site

```bash
cd site
npm install
npm run dev
```

## Tests

```bash
.venv/bin/python -m pytest
```

## API

| Method | Path |
| --- | --- |
| POST | `/users/google-login` |
| GET | `/users/me` |
| GET | `/subscriptions` |
| POST | `/subscriptions` |
| GET | `/subscriptions/{id}` |
| PUT | `/subscriptions/{id}` |
| DELETE | `/subscriptions/{id}` |
| GET | `/subscriptions/summary/budget` |
| GET | `/subscriptions/summary/expiring` |
| GET | `/health` |

Everything except the login and health endpoints expects a bearer token.

## Deployment

| What | Where |
| --- | --- |
| Site | Vercel, git-linked to `main` - https://tracklyapp.pl |
| Backend | Vercel, git-linked to `main` (Python serverless, zero-config `api/index.py`, no `vercel.json`) - https://trackly-api-git-main-michal-team00.vercel.app |
| Database | Supabase Postgres, reached through its connection pooler (`*.pooler.supabase.com:6543`) - the direct host doesn't resolve from Vercel's network. Free tier: pauses after a week idle, `restore_project` (Supabase MCP) or the dashboard brings it back in a minute or two. |

Every FastAPI route lives under `/api/*` - that's the one thing Vercel's zero-config Python
detection actually routes to `api/index.py`; nothing outside `/api` reaches it. There's
deliberately no `vercel.json` anywhere in the repo: an earlier one at the repo root (meant
only for the backend) got read by the site project too, since Vercel resolves `vercel.json`
from the repository root regardless of a project's own Root Directory setting - it broke
every route on the site until it was removed.

A scheduled GitHub Actions workflow (`.github/workflows/keepalive.yml`) calls `/api/health` once a
day. The endpoint reads from the users table, which counts as database activity, so the Supabase
free tier doesn't pause the project after a week without users. A failed run means the backend or
the database is down.

Push to `main` and both Vercel projects redeploy on their own. `SECRET_KEY` / `GOOGLE_CLIENT_ID`
/ `ALLOWED_ORIGINS` / `DATABASE_URL` live in the backend project's environment variables
(Production and Preview are separate scopes there).

## Status

Built by two people as a university project, aimed at a Chrome Web Store release.

A mobile app is next: the same subscriptions, on the phone, reading the API this backend
already exposes.

Not affiliated with any of the services whose subscriptions it helps track.
