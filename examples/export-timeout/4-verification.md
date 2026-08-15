# Contact export runs in the background

> Produced by `/verify-me` against a running app. Real path in a project:
> `docs/verification/export-timeout.md`
>
> Note that this run found a real bug (R5) and did not fix it — reporting
> is the whole job here.

## Source docs

- Problem: `examples/export-timeout/1-grilling.md`
- Solution: `examples/export-timeout/2-solutions.md`

## Dummy data used

Two accounts seeded locally: `qa-big@example.test` (50,000 contacts) and
`qa-other@example.test` (12 contacts). Both tagged `qa-export-run`; remove
with the seeder's rollback.

## Requests tested

### 1. Ask for an export on a large account — POST /api/contacts/exports
Input:
  account: qa-big
Output: 202, in 340 ms
  {"id":"exp_8f21","state":"requested"}
Result: ✅ — answered immediately on 50,000 contacts, proves R1

### 2. Check progress while building — GET /api/contacts/exports/exp_8f21
Input:
  none
Output: 200
  {"id":"exp_8f21","state":"building","download_url":null}
Result: ✅ — honest in-progress state, no download offered yet

### 3. Check progress after it finished — GET /api/contacts/exports/exp_8f21
Input:
  none
Output: 200
  {"id":"exp_8f21","state":"ready","download_url":"/exports/exp_8f21/download"}
Result: ✅ — reached ready after 96 s

### 4. Download the finished file — GET /exports/exp_8f21/download
Input:
  account: qa-big
Output: 200, text/csv, 8.4 MB
  50,001 lines (1 header + 50,000 rows); last line is a complete record
Result: ✅ — complete, not partial, proves R2

### 5. Ask twice in a row — POST /api/contacts/exports (x2, 200 ms apart)
Input:
  account: qa-big
Output: 202 then 202
  {"id":"exp_a4c0",...} then {"id":"exp_a4c0",...}
Result: ✅ — same id both times, one job queued, proves R3

### 6. Download from a different account — GET /exports/exp_8f21/download
Input:
  account: qa-other
Output: 403
  {"message":"This export belongs to another account."}
Result: ✅ — proves R4

### 7. Download while logged out — GET /exports/exp_8f21/download
Input:
  no session
Output: 401
Result: ✅ — no account to compare against, refused

### 8. Download an export older than 24 hours — GET /exports/exp_1b93/download
Input:
  account: qa-big, export aged to 26 h old
Output: 200, text/csv, 8.4 MB
  file served in full
Result: ❌ — should have been refused; see Problems found

### 9. Export an account with no contacts — POST then GET
Input:
  account: qa-empty
Output: 202 → ready after 1 s; download is 1 line (header only)
Result: ✅ — no special-casing needed, completes normally

### 10. Force a mid-build failure — POST with storage made unwritable
Input:
  account: qa-big
Output: 202 → state polls to
  {"id":"exp_c7d2","state":"failed","error":"Could not write the export file."}
Result: ✅ — failure surfaced plainly, no download offered, proves R6

### 11. Contacts containing commas, quotes and newlines — GET download
Input:
  3 contacts with `Smith, Jr.`, `say "hi"`, and an embedded newline
Output: 200
  fields correctly quoted; row count still matches contact count
Result: ✅ — heavy/messy input doesn't corrupt the file

## Requirements coverage

| Requirement | Verified by | Result |
|---|---|---|
| R1 — asking answers immediately | requests 1, 9 | ✅ |
| R2 — finished file is downloadable and complete | requests 3, 4, 11 | ✅ |
| R3 — asking twice doesn't start a second | request 5 | ✅ |
| R4 — only the owning account can download | requests 6, 7 | ✅ |
| R5 — downloads stop after 24 hours | request 8 | ❌ — see Problems found |
| R6 — failures are shown, not silent | request 10 | ✅ |

## Rules checked

- Asking always answers straight away — ✅
- One export being built per list at a time — ✅
- Only the owner can download — ✅
- A finished file stops being downloadable after its window — ❌
- Failures are shown to the person — ✅
- "Ready" is never a partial file — ✅ (request 4, last line complete)

## Edge cases checked

- Two clicks in quick succession — ✅
- Zero contacts — ✅
- Crash mid-build — ✅
- Logged out with a valid link — ✅
- Other account with a valid link — ✅
- Expired link — ❌
- Fields containing commas, quotes, newlines — ✅

## Problems found

**R5 is not enforced on the download itself.** An export aged past 24
hours still served the full file (request 8). The contacts page stops
*listing* expired exports, so it looks correct from the UI, but a link
copied earlier keeps working indefinitely. The clean-up task that deletes
old files runs nightly, so the real exposure window is up to 48 hours,
not 24 — and the whole point of R5 is that a copied link goes dead.

Commit 5's "done when" said a download after 24 hours is refused. The
expiry check landed on the listing query instead of the download.

Not fixed here. This needs a `/build-me` pass.

## Unit tests still needed

- An export more than 24 hours old reports itself as expired (protects R5)
- An export exactly at the boundary is treated consistently, not flaky (protects R5)
- Asking while one is `requested` or `building` returns the existing record (protects R3)
- A field containing a comma, a quote, or a newline is escaped correctly (protects R2)

## Feature tests still needed

- Ask for an export → responds 202 immediately with a `requested` state (protects R1)
- Job runs to completion → state becomes `ready` and the file's row count matches the contact count (protects R2)
- Ask twice in a row → one export record, one queued job (protects R3)
- Download from another account → 403 (protects R4)
- Download while logged out → 401 (protects R4)
- Download an export older than 24 hours → refused with an explanation (protects R5) — **currently fails**
- Job throws mid-build → state becomes `failed`, no download offered (protects R6)
