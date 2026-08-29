---
name: verify-me
description: >
  Check that a built feature actually matches the original problem
  (/grill-me) and the chosen solution (/solve-me). Acts like a real user
  and a QA engineer, not a code reviewer: confirms scope, environment,
  database safety and login with the developer first, then creates real
  dummy data in the
  database (via Laravel MCP/Boost tools if available, otherwise artisan),
  then hits the real running app with curl — golden path, edge cases, and
  heavy/weird inputs. No automated tests are written. Produces one clean
  markdown file with a simple, readable log of every request tested
  (input/output) plus a plain-language list of the unit/feature tests that
  still need to be written, and then stops — it never writes those tests
  and never starts another skill. Use after /build-me, once a commit (or
  the whole feature) is implemented.
---

# Verify Me — Prove It Actually Works

Your job is to find out whether the built feature really does what the
problem and solution said it should — by using it, the way a real user
or an outside API caller would. You are not reading the code to judge
it. You are poking the running app and writing down what happens.

You do not write unit tests, feature tests, or any other code. You do
not fix bugs. You observe, compare against what was promised, and
report — cleanly.

---

## Input

You need three things:

1. The problem write-up (from `/grill-me`, e.g.
   `docs/grilling/<topic>.md`).
2. The solution write-up (from `/solve-me`, e.g.
   `docs/solutions/<topic>.md`).
3. What was actually built (from `/build-me` — recent commits, changed
   files, or just ask the developer what to verify).

If any of these are missing, ask for them or the file paths. Don't
guess at what "correct" means — pull it from the problem's rules and
edge cases and the solution's chosen options.

### Confirm with the developer before touching anything

Even when all three inputs are handed to you, **stop once, ask, and
wait** before running the first request. Keep it to one short round —
propose your own answers so they can just say "yes":

1. **What am I verifying?** — the list of R-numbers / behaviors you
   intend to hit, and anything you're deliberately skipping.
2. **Where do I run it?** — which base URL / environment, and is the
   server already running or should you start it.
3. **Is this database safe to write dummy data to?** — say exactly
   what rows you'd create and how they'll be recognisable.
4. **Anything I need to log in as?** — which user/role, and how to
   authenticate.

If the developer doesn't answer, don't proceed on assumptions —
verification against the wrong environment or the wrong account is
worse than no verification.

If the prompt that launched you already carries the developer's
answers to all four questions (e.g. `/ship-me` collected them before
spawning), don't re-ask — restate them in one line ("Verifying R1–R4
on <url>, dummy rows tagged <pattern>, as <user> — starting") and
proceed. Stop and ask only if any of the four is missing or unclear.

---

## Step 1 — Know what "correct" looks like

From the two write-ups, pull out a short checklist:

- The numbered requirements (R1, R2, …) from the grill-me file's
  requirements block — these are the spine of the whole verification.
- The golden path (the normal, everyday case).
- Every edge case either doc mentions.
- Every "must always stay true" rule.
- What's explicitly out of scope (don't test what was deliberately not
  built).
- How the problem doc says success should be observed — use that as
  your definition of "passed."

Key every checklist item to the requirement it belongs to, so each
request you send can later say which R-number it proves. If the
grill-me file has no numbered requirements (an older file), number the
plain rules yourself and say so in the report.

---

## Step 2 — Get real data and a real server

You need the actual app running and actual rows in the database —
not mocks, not assumptions.

- Check the app is actually running and reachable (the local dev
  server). If it isn't, start it or ask the developer to.
- Create real dummy data using real Laravel tooling. Look for Laravel
  MCP / Boost tools first (search for tools like artisan, tinker,
  database-query — they may need to be loaded via tool search before
  they're callable). If none are available, fall back to running
  `php artisan tinker` or existing factories/seeders through the
  shell.
- Use the project's existing factories/relationships so the dummy data
  is realistic and satisfies real constraints — don't hand-craft rows
  that skip validation the real app would enforce.
- Make dummy data easy to spot and clean up later (e.g. a clearly
  fake, distinct name or email pattern). Never truncate tables or
  delete existing rows. If you're not sure the database is safe to
  write to, stop and ask first.

---

## Step 3 — Test it like a real user, with curl

Use `curl` against the real running endpoints — real HTTP requests,
real headers, real auth (log in for real or use a real token, however
this app actually authenticates), real request bodies. Do not call
internal PHP classes directly and do not use any test framework.

**Scale the battery to what changed.** The full boundary/heavy matrix
below applies only to endpoints that are NEW or whose input handling
changed in this build. For endpoints touched incidentally: golden
path, the specific edge cases the problem/solution docs name, plus one
or two hostile inputs aimed at the changed behavior. Never re-verify
validation this change did not touch — say in the report that it was
skipped and why.

Cover, for every new or input-changed endpoint or entry point:

- **The golden path** — the normal case, start to finish.
- **Every edge case** from the problem and solution docs.
- **Boundary and heavy inputs** — empty values, missing fields, huge
  strings, unicode/emoji, very large or negative numbers, wrong data
  types, duplicate submissions, doing the same action twice quickly,
  unauthorized or logged-out access, expired/invalid tokens/IDs that
  don't exist.
- **Anything solve-me flagged as a weak point** for the option that
  was actually chosen.

For every single request, keep a record of exactly what you sent and
exactly what came back (status code and body).

---

## Step 4 — Check the results against the rules

Go through your checklist from Step 1 one item at a time. For each
rule or edge case, state plainly whether what you observed matches
what was promised — yes or no, based on the actual response, not on
reading the code.

If something doesn't match, describe it in plain language: what
should have happened, what actually happened, and which request
proved it. Don't guess why it's broken and don't fix it — that's a
job for `/build-me` afterward.

---

## Step 5 — Note the tests that still need to be written

No automated tests exist yet for this feature on purpose. List, in
plain language, what should be written later to lock in this behavior:

- **Unit tests needed** — small, focused checks on individual pieces
  of logic (one line each: what it checks).
- **Feature tests needed** — end-to-end checks through the actual
  endpoints, covering the golden path and each important edge case you
  just verified by hand (one line each: the scenario and expected
  result).

Base this list on what you just tested manually — every scenario you
checked with curl is a candidate for a test someone should write.

---

## Step 6 — Save one clean markdown file

Write the results to `docs/verification/<short-topic-slug>.md` (create
the folder if needed, reuse the same topic slug as the matching
grill-me/solve-me files). Keep it very simple and easy to scan — short
lines, no clutter, no walls of text.

```markdown
# <Feature title, plain language>

## Source docs
- Problem: <path to grill-me file>
- Solution: <path to solve-me file>

## Dummy data used
<one or two lines — what was created, how to spot/clean it up>

## Requests tested

### 1. <short plain description> — <METHOD> <path>
Input:
  <field: value, one per line, or "none">
Output: <status code>
  <clean, short body — trim to what matters>
Result: ✅ / ❌ — <one line: proves which R-number / rule, or what
went wrong>

### 2. <short plain description> — <METHOD> <path>
...

## Requirements coverage
| Requirement | Verified by | Result |
|---|---|---|
| R1 — <short restatement> | requests 1, 3 | ✅ |
| R2 — <short restatement> | request 5 | ❌ — see Problems found |
| R3 — <short restatement> | skipped — <why, one line> | — |

## Rules checked
- <rule from problem/solution, plain language> — ✅ / ❌
- ...

## Edge cases checked
- <edge case, plain language> — ✅ / ❌
- ...

## Problems found
<list, or "none found">

## Unit tests still needed
- <one line per test: what it should check> (protects R<n>)

## Feature tests still needed
- <one line per test: scenario → expected result> (protects R<n>)
```

Every R-number from the requirements block must appear in the
coverage table — verified with the requests that prove it, failed with
a pointer to Problems found, or skipped with a one-line reason. No
requirement just disappears.

Keep the coverage table's shape exactly as above: three columns, the
first cell starting with the bare R-number, the third holding ✅, ❌ or
— and nothing else before the dash. `/map-me` reads this table to mark
which requirements are actually proven, so a reformatted table silently
turns a verified requirement into an unproven one.

Tell the developer the file path once it's written.

---

## Refresh the map

You just wrote something the map is built from, so bring it up to date
before moving on:

```bash
node ~/.claude/skills/map-me/map-me.mjs --brief
```

(If the skills were installed into this project rather than your home
directory, that's `.claude/skills/map-me/map-me.mjs`. If neither path
exists, `/map-me` isn't installed here — skip this step silently and
say nothing about it.)

`--brief` prints nothing at all unless something changed. When it does
print, relay those lines to the developer as they are — one line per
hole that opened or closed — and carry on.

**It is never a gate.** Don't stop, don't re-plan, don't rewrite the
artifact and don't touch code because of what it says. It is a running
account of what the written record does and doesn't cover, and the
developer decides what to do about it.

---

## Rules

- Never write unit tests, feature tests, or any other code.
- Never edit application code to "make it pass" — report, don't fix.
- **Ask before you start** (scope, environment, database, login) and
  wait for an answer. Silent, fully autonomous verification is a bug,
  not a feature.
- **This skill ends when the file is written** (bar the map refresh,
  which is a script, touches nothing but `docs/map/`, and starts no
  other skill). Never invoke `/test-me`, `/build-me`, or any other
  skill afterwards, and never start writing the tests you just listed — even if the missing tests
  are obvious and it feels like the natural next step. Report the file
  path, say what you found, and stop. Running the next phase is the
  developer's decision (or `/ship-me`'s).
- Never run destructive database commands (truncate, delete, drop)
  without explicit confirmation.
- Test the running app for real — no mocking, no calling internal
  classes directly, no skipping auth because it's inconvenient.
- Cover what changed exhaustively; don't re-prove what didn't. Every
  deliberate skip is named in the report.
- Keep the output file simple and clean — short, scannable, no jargon,
  no unnecessary detail. If a result needs more than a few lines to
  show, trim it to the part that proves the point.

---

## Done means

- The real app was hit with real curl requests, using real dummy data,
  covering the golden path, the documented edge cases, and heavy/messy
  inputs.
- Every rule and edge case from the problem and solution docs has been
  checked against something that was actually observed.
- Every R-number appears in the requirements coverage table —
  verified, failed, or skipped with a stated reason.
- Any mismatch between what was promised and what happened is written
  down plainly, with the request that proved it.
- A plain-language list of missing unit and feature tests has been
  produced.
- Everything has been saved to one clean markdown file at a path the
  developer knows, and the map was refreshed afterwards.
- The developer confirmed scope and environment before any request was
  sent, and nothing else was run afterwards — no tests written, no
  other skill started.