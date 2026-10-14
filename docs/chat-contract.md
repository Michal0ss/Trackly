# Chat parsing

Local M2 prototype: authenticated parsing, follow-up drafts, server-side calendar
calculations and editable mobile proposals saved only after confirmation. The test
parser uses 50 prepared PL/EN cases and a small set of explicit follow-ups. It does
not call a model or any external service. The offline scorer is separate from this
interactive test and does not measure a model until real provider outputs are supplied.

Both endpoints require `CHAT_TEST_MODE=1`, a SQLite database and a valid bearer
token. They return 503 when disabled, on PostgreSQL, or when `VERCEL` / `VERCEL_ENV`
is set. The mobile chat is available only in development. See
[`mobile/README.md`](../mobile/README.md) for the disposable local setup.

## Request

The `POST /api/assistant/parse` request is validated by `ParseRequest` in
`app/schemas/assistant.py`:

```json
{
  "text": "Czynsz 2400 zł",
  "language": "pl",
  "today": "2026-10-07",
  "default_currency": "PLN",
  "context": [],
  "draft": null
}
```

`today` is the phone's local date. The client supplies `default_currency` explicitly;
the backend must not infer it from language. `context` contains up to six previous
user messages kept in the phone's memory. Each message is limited to 2,000 characters.
`draft` carries the last partial proposal so an answer can fill a missing field.
The test parser uses that draft, not free-form context, to process follow-ups.
Context is untrusted user text, never system instructions. Raw messages are not
persisted or included in server logs. The authenticated session determines the owner;
the request cannot contain a user ID, credentials or permission to save.

## Parsing result

`parse_result_adapter` validates a discriminated union with four result kinds:

| Kind | Meaning |
| --- | --- |
| `proposal` | A partial payment or subscription draft and its missing fields |
| `question` | One of `month_total`, `next_due`, `subscriptions_total` |
| `clarify` | The entry type is unclear or the message contains several entries |
| `not_supported` | A one-off expense, unsupported recurrence/currency, edit, deletion or unrelated request |

For the request above:

```json
{
  "kind": "proposal",
  "draft": {
    "kind": "payment",
    "name": "Czynsz",
    "category": "rent",
    "amount": 2400,
    "currency": "PLN"
  },
  "missing": ["interval_months", "first_due"]
}
```

Omitted optional draft fields become `null`. Unknown fields are rejected. Amounts
must be finite positive JSON numbers below one billion. Supported currencies,
categories and intervals match the payments API; subscriptions use the `subscription`
category and can also carry `plan_name`.

`missing` lists all required unknown fields, regardless of the order in which the
interface asks questions. It must match the draft. An empty list is not permission to
save. The backend still has to resolve a complete date, validate the resulting write
payload and show the proposal for confirmation. Parsing never writes a payment or
subscription; it only updates the local request-limit counter.

Question results contain no generated totals or answer text. The backend answers
them from the signed-in user's data and existing calendar calculations. The month
comes from `today`, not the month currently selected in the overview. Currencies
stay separate. These are planned obligations, not a history of spending.

## Endpoint responses and confirmation

The parse response wraps the validated result:

```json
{
  "mode": "test",
  "result": {
    "kind": "proposal",
    "draft": {"kind": "payment", "name": "Czynsz", "category": "rent", "amount": 2400, "currency": "PLN"},
    "missing": ["interval_months", "first_due"]
  },
  "needs": ["interval_months", "first_due"],
  "entry": null,
  "proposal_id": null,
  "overview": null
}
```

Nullable draft fields are omitted above for readability. `needs` also includes
unresolved calendar fields, even when the parser's `missing` list is empty. A
complete proposal has an `entry` matching `ResolvedEntry` and a UUID `proposal_id`.
A question has an `overview` and no entry or proposal ID.

The mobile editor may change the proposed fields before sending
`POST /api/assistant/confirm` with `{"proposal_id": "<UUID>", "entry": {...}}`.
The server independently validates all fields and takes the owner from the token.
The ID is a retry key, not a credential or permission grant. Confirmation returns
`{"kind": "payment", "id": 123}` or the corresponding subscription result.

The confirmation receipt and entry are stored in one SQLite transaction. Retrying
the same key and payload returns the original ID; simultaneous attempts create
only one entry. Reusing a key with different fields returns 409. An active
subscription with the same service name also returns 409. Subscriptions added this
way use `source: "manual"` and appear read-only in the mobile list.

The local `chat_confirmations` table stores the owner, key, payload hash and saved
entry ID, without conversation text. `chat_test_usage` stores the per-user limit
of 60 parsing requests per minute. Both tables are created lazily after the local
guard succeeds, outside the production schema. Counters and receipts survive API
restarts. A new proposal key represents a new save, so restarting the app and
repeating the conversation is not a retry of the original confirmation.

Parsing times out after three seconds; the mobile request timeout is twelve
seconds. Neither parsing nor confirmation is retried automatically. The mobile
screen keeps the confirmation key and payload fixed after an uncertain save and
offers an explicit retry. Conversation state is held in memory only.

## Dates and follow-up questions

`first_due` and `until` contain only stated `year`, `month` and `day` parts. For example:

- "co miesiąc do 10-go" gives `interval_months: 1`, `first_due: {"day": 10}`.
- "rocznie w marcu" gives `interval_months: 12`, `first_due: {"month": 3}` and a
  missing first due date.
- "kwartalnie do 15-go" still needs the month of the first payment.
- "do grudnia 2045" gives `until: {"year": 2045, "month": 12}`.
- "przez 24 miesiące" gives `duration_months: 24`, not 24 payments or a monthly interval.

Calendar completion belongs to server code, not the model. The local prototype
requires a full first date, including year, month and day. These cases do not invent a year
when only a day and month were stated. An explicit "today" uses the request's date;
"paid" without a date leaves the date unknown. The name of a bill or service never
implies its frequency. Invalid calendar dates, contradictory end conditions and end
dates before a fully specified start are rejected. An end month with a year resolves
to that month's final day. A duration resolves to the last scheduled occurrence
within the stated number of months. For example, twelve months of quarterly
payments produces four occurrences, not twelve.

## Local checks

Run from the repository root. No provider key or paid calls are needed:

```bash
.venv/bin/python -m scripts.evaluate_chat
```

This validates the case file and expected results only. It does not measure a model's
quality. The reference day remains 2026-10-07 so that results are reproducible.

After a separate provider integration is available, collect one parsing result per
case in a JSON array outside the repository:

```json
[
  {
    "id": 29,
    "result": {"kind": "question", "question": "month_total"}
  }
]
```

```bash
.venv/bin/python -m scripts.evaluate_chat /tmp/trackly-chat-results.json
```

The scorer checks every normalized field, including unexpected invented values.
Only the named alternatives in the case file are accepted. Missing cases count as
failures; duplicate or unknown IDs invalidate the results file. Reports contain case
IDs, statuses and field paths, without the original text or rejected values. Exit
codes: `0` for all cases passing, `1` for incomplete or failing results, `2` for an
invalid file. Never treat reference answers passed through the scorer as model results.

The schemas, scorer and authenticated flow have regression tests in
`tests/test_assistant_contract.py`, `tests/test_chat_evaluation.py` and
`tests/test_assistant_flow.py`. The existing backend CI runs all three files.

Before enabling a real provider, select it using real runs of this suite, set a
budget and token limits, and replace the local-only storage and guard with reviewed
production migrations and configuration. Schema validation cannot prove extraction
accuracy. Any less explicit first-date policy still needs a product decision.
