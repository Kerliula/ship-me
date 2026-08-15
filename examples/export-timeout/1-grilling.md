# Exporting a big contact list never finishes

> Produced by `/grill-me`. Real path in a project: `docs/grilling/export-timeout.md`

## What happens now

Someone clicks "Export" on their contacts page. The page sits there
spinning. On small accounts it hands back a file after a few seconds. On
big accounts the page eventually gives up with a generic error, and no
file ever arrives.

People assume the click didn't register, so they click again. Each click
starts the whole thing over, which makes the account slower for everyone
using it, including the person waiting.

## What should happen instead

Clicking "Export" should always come back immediately with "we're working
on it." The file gets made in the background. When it's ready, the person
can download it. If it fails, they're told it failed.

## Why this matters

Export is how people get their data out — for a mailing tool, for a
report, for their accountant. An export that silently fails on exactly
the accounts with the most data is worst for the customers who matter
most. Two of them have asked about it by email.

## Who / what this affects

- Anyone exporting contacts (all plans)
- Most visible on accounts above roughly 20,000 contacts
- The shared background workers, which the repeated clicking ties up

## States and how they change

    requested → building → ready → (expired)
                       ↘ failed

- **requested** — we've written down that they asked, nothing made yet
- **building** — the file is actively being put together
- **ready** — the file exists and can be downloaded
- **failed** — something went wrong; the person is told
- **expired** — the file is past its keep-window and is gone

## Rules

- Asking for an export always answers straight away, whatever the size.
- One account can only have one export being built at a time, per list.
- Asking again while one is building points at the one already running —
  it does not start a second.
- Only the person's own account can download the result.
- A finished file stays downloadable for a limited window, then goes away.
- A failure is shown to the person, not swallowed.

## Limits / must-respect constraints

- Background workers are shared with billing and email jobs — an export
  can't be allowed to hog them indefinitely.
- File storage is not free; finished exports can't accumulate forever.
- We can't change the contacts table structure as part of this work.

## Out of scope

- Exporting anything other than contacts (deals, invoices, notes)
- Choosing which columns are exported — it stays the fixed column set
- Scheduled or recurring exports
- Emailing the file as an attachment
- Any change to the contacts page's design beyond the button's behavior
- Making the export itself faster — slow is fine as long as it finishes

## Must always stay true

- Nobody can ever download another account's export.
- A person is never left with a spinning page and no answer.
- An export that says "ready" actually has a complete, openable file
  behind it — never a partial one.

## Edge cases and what happens

- **Clicks Export twice quickly** → second click attaches to the first
  export, no second build starts
- **Clicks Export while a previous one is still building** → same as above
- **Account has zero contacts** → export still completes, file has just
  the header row
- **The build crashes halfway** → state becomes failed, the person sees
  it, the half-made file is not downloadable
- **Person opens an old link after the keep-window** → told it expired,
  no file
- **Person is logged out and pastes a download link** → refused
- **Person from another account pastes the link** → refused

## How we'll know it worked

Ask for an export on the biggest test account. The page answers instantly.
Some time later the file is downloadable and opens with the right number
of rows. Asking twice in a row produces one export, not two. An old link
stops working. Another account's link is refused.

## Open questions

- Exact keep-window length. Starting at 24 hours; the person on support
  can change it later without redesigning anything.

---

## Requirements (copy-paste ready)

### What we're building

- R1 — Asking for an export answers immediately, no matter how big the account is.
- R2 — The finished file becomes downloadable once it's fully built.
- R3 — Asking again while one is already building does not start a second one.
- R4 — Only the account that asked for an export can download it.
- R5 — A finished export stops being downloadable after 24 hours.
- R6 — An export that fails is shown as failed, not left silent.

### What we touch

- The contacts export button and the page it lives on
- A new record of export requests and their state
- Background job processing
- Wherever generated files are stored

### What we do NOT touch / out of scope

- Exports of anything other than contacts
- Which columns get exported
- Scheduled or recurring exports
- Emailing the file as an attachment
- The visual design of the contacts page
- The speed of the export itself

### How we'll know it works

1. Export on a 50,000-contact account → page answers in under a second.
2. Wait for it to finish → file downloads and has 50,000 rows plus a header.
3. Click Export twice in a row → only one export exists.
4. Try to download it from a different account → refused.
5. Try to download it 24 hours later → refused, clearly explained.
6. Force a failure mid-build → state shows failed, no file is offered.
