---
name: ship-me
description: >
  Run the full pipeline end to end for one problem or feature: /grill-me,
  /solve-me, /build-me, /verify-me, /test-me, in order. The interactive
  phases (grill-me's interrogation, build-me's per-commit review) run right
  here in this conversation. The non-interactive phases (solve-me,
  verify-me, test-me) each run as a freshly spawned, separate session with
  no memory of this conversation. The developer keeps three approval
  gates: the solution options after solve-me, the commit plan at the
  start of build-me, and the go-ahead for tests after verify-me. Use when
  the developer wants the
  whole problem-to-tested-code pipeline run for something, instead of
  invoking each skill by hand one at a time.
---

# Ship Me — Run the Whole Pipeline

You are the conductor, not a sixth phase. Every real decision still
belongs to the skill responsible for it — you just make sure each one
starts at the right time, with the right input, and that nothing moves
forward on a phase that isn't actually finished.

---

## Before you start

Get a short topic name for this run — a few words, e.g. "email
change" or "tender matching fix." Turn it into a slug (e.g.
`email-change`) and use that same slug for every phase's output file,
so the whole run stays linked together:

- `docs/grilling/<slug>.md`
- `docs/solutions/<slug>.md`
- `docs/build/<slug>.md`
- `docs/verification/<slug>.md`

If the developer already has some of these phases done (e.g. a
grill-me file already exists for this topic), skip straight to the
first phase that's still missing — don't redo finished work.

---

## The five phases

| # | Phase | Skill | Where it runs | Produces |
|---|-------|-------|----------------|----------|
| 1 | Understand the problem | `/grill-me` | **This conversation** | `docs/grilling/<slug>.md` |
| 2 | Design the solution | `/solve-me` | **Spawned session** | `docs/solutions/<slug>.md` |
| — | *Developer approves the solution* | — | **This conversation** | a decision |
| 3 | Build it | `/build-me` | **This conversation** | `docs/build/<slug>.md`, then code, commit by commit |
| — | *Developer approves the commit plan (inside Phase 3, before code)* | — | **This conversation** | a decision |
| 4 | Verify it | `/verify-me` | **Spawned session** | `docs/verification/<slug>.md` |
| — | *Developer approves moving to tests* | — | **This conversation** | a decision |
| 5 | Test it | `/test-me` | **Spawned session** | test files |

"This conversation" means: invoke the skill directly here, exactly as
if the developer had typed the slash command themselves, and let it
run its normal back-and-forth with the developer.

"Spawned session" means: use the Agent tool to start a brand-new
session with no memory of this conversation. Give it a fully
self-contained prompt (see below). Let it run in the background. Move
on to the next phase only when its completion notification actually
arrives — never before, and never guess or narrate what it will find.

---

## Phase 1 — grill-me (here)

Invoke `/grill-me` in this conversation for the topic. Let the full
interrogation happen normally — don't shortcut its questions or answer
on the developer's behalf. Don't move to Phase 2 until it has actually
written `docs/grilling/<slug>.md` and said "Comprehension gate
passed."

## Phase 2 — solve-me (spawned)

Once the grill-me file exists, immediately spawn a new agent. Its
prompt must be self-contained — it has no access to this conversation:

> "Run the `/solve-me` skill using `docs/grilling/<slug>.md` as the
> problem write-up. Produce `docs/solutions/<slug>.md`. When finished,
> report the file path and a one-paragraph summary of what was
> decided."

Tell the developer this is now running as a separate session and give
its name so they can check on it with `ListAgents` or message it
directly if they want to weigh in on a trade-off while it runs.

When its completion notification arrives, confirm
`docs/solutions/<slug>.md` actually exists and looks complete (has a
recommendation for every piece) before moving on. If it doesn't, stop
and tell the developer instead of pushing forward.

### Gate — the developer reviews the solution before anything is built

**This is a hard stop. Phase 2 never flows straight into Phase 3.**
The whole point of solve-me is that each piece has several real
options — that's worthless if the build starts before the developer
has looked at them.

When the solve-me file is ready, post a decision-grade summary in this
conversation — enough to decide from chat without opening the file.
Per piece, two lines:

> **Piece N — <title>**
> Recommended: <option> — <its one-line why, copied from the file>
> Runner-up: <strongest rejected option> — <one line on why it lost>

Then list each item from the file's "Open trade-offs" section as its
own numbered question. Give the file path for the full reasoning, and
ask plainly:

> "Keep these recommendations, or change any of them? And I need your
> answer on each open trade-off above — nothing gets built until you
> say go."

Don't proceed while any open trade-off is unanswered — those are
exactly the questions solve-me deferred to the developer.

Wait for an actual answer. If they change a recommendation, update the
solve-me file (or send the change to that session) so the file and the
build agree, then confirm the change back to them. "No response yet"
is not approval, and neither is silence after a long-running spawned
phase.

## Phase 3 — build-me (here)

Only after the developer has approved the solution, invoke `/build-me`
in this conversation using `docs/solutions/<slug>.md` and
`docs/grilling/<slug>.md`.

This is also where the work gets cut into commits — solve-me
deliberately doesn't do that. build-me writes its commit plan to
`docs/build/<slug>.md` and stops for the developer to approve it
before writing any code. Let that gate happen; don't approve the plan
on their behalf.

The phase then pauses after every commit for the developer to review
and edit — that's by design. Don't try to speed it up or auto-approve
commits — unless the developer themselves asked to batch specific
commits ("run 3 through 5"); their call, never yours. Wait until every
commit has been built and approved before moving to Phase 4.

## Phase 4 — verify-me (spawned)

Once build-me has finished all its commits, spawn a new agent:

> "Run the `/verify-me` skill. Problem: `docs/grilling/<slug>.md`.
> Solution: `docs/solutions/<slug>.md`. What was built: [recent
> commits / changed files from this build-me run — list them
> explicitly in the prompt, since the new session can't see this
> conversation]. Produce `docs/verification/<slug>.md`. When finished,
> report the file path and whether any problems were found."

Before spawning, ask the developer verify-me's four pre-flight
questions here, in one compact message: what to verify (R-numbers /
behaviors), which base URL and whether the server is already running,
whether the database is safe to write tagged dummy rows to, and which
login to use. Propose defaults from the project so "yes" is a complete
answer — but the developer's reply is the authority. Never fill in the
database-safety or login answers on their behalf, however obvious they
look. Paste their answers verbatim into the spawn prompt, labeled as
the developer's confirmed answers, so the spawned session can start
immediately instead of relaying the same questions back through you.

When its notification arrives, read the result and **stop**. Summarise
in a few lines what was verified and anything that looked wrong, give
the file path, and ask the developer whether to go ahead with tests.
Never let verification roll straight into Phase 5 — and if the
verify-me session started writing tests itself, say so, because it
wasn't supposed to.

**If it found real problems** (anything marked ❌ or listed under
"Problems found"), say so plainly and recommend going back to
`/build-me` rather than writing tests against behavior that's known to
be broken.

## Phase 5 — test-me (spawned)

Once verification is clean and the developer has said go, spawn a new
agent:

> "Run the `/test-me` skill using `docs/verification/<slug>.md`.
> Problem: `docs/grilling/<slug>.md`. Solution:
> `docs/solutions/<slug>.md`. Write the missing tests it lists,
> following this project's conventions. When finished, report what
> was written and, for each test, why it's useful."

When it finishes, relay its explanation of each test to the developer.

---

## Wrapping up

Once all five phases are done, give the developer one short summary:
links to the four docs (grilling, solutions, build, verification),
what was built, what was tested, and anything
still open (dropped test candidates, unresolved trade-offs the
spawned phases flagged).

Finish by pasting the **Requirements (copy-paste ready)** block from
`docs/grilling/<slug>.md` — what was built, what was deliberately not
built, and how it was checked — so it can go straight into the PR
description or commit body.

---

## Rules

- Never skip a phase's own internal gate — the comprehension gate, the
  solution-review gate, the commit-plan approval, the per-commit
  pause, the "problems found" check — just to move faster.
- **The three developer gates are non-negotiable**: approve the
  solution (after Phase 2), approve the commit plan (start of Phase
  3), approve moving to tests (after Phase 4). Each needs a real
  answer from the developer, not your best guess at what they'd say.
- **Commits are cut in Phase 3, not Phase 2.** Don't ask solve-me for
  commit boundaries and don't invent them yourself — build-me writes
  the plan to `docs/build/<slug>.md` and gets it approved.
- **Keep the solve-me numbering, exactly.** The pieces in
  `docs/solutions/<slug>.md` are numbered, and that numbering is the
  build order. Commit 1 builds piece 1, and so on. Do not reorder them
  because a later piece "has no dependencies" or an earlier one
  "produces no code on its own" — the developer reads the solution
  file top to bottom and expects the build to match it line for line.
- **A piece may be split, never resequenced.** If a piece is too big
  for one review, split it into 3a / 3b / 3c and build those in
  order. The sub-commits stay inside their piece's slot; they never
  jump ahead of an earlier piece or trail behind a later one.
- **If a piece genuinely cannot be built in its slot** — it needs
  something a later piece creates — stop and say so before writing
  any code. Name the piece, name what it needs, and let the developer
  decide whether to reorder. Never resolve it silently.
- **Every commit traces to a requirement.** The R-numbers come from
  the grill-me file's requirements block; if a commit serves none of
  them, it doesn't belong in this run.
- A spawned phase's prompt must stand on its own: exact file paths,
  exact slug, exact skill to run, exact thing it must produce. It
  cannot see anything from this conversation unless you put it in the
  prompt.
- Never report or assume a spawned phase's outcome before its real
  completion notification arrives.
- If a spawned phase fails, stalls, or its output file doesn't hold
  up, stop the chain and tell the developer — don't feed a broken
  output into the next phase.
- If the developer wants to jump in on a spawned phase (answer a
  question, redirect it), point them to messaging that session
  directly by name rather than relaying through you.

---

## Done means

- All five phases completed in order, each phase's own completion
  criteria actually met (not assumed).
- Every spawned phase ran in its own fresh session, triggered once its
  input was ready and its gate (if it has one) was cleared.
- The developer explicitly approved the solution, the commit plan, and
  the move to tests.
- The developer has the four output docs and the final test suite,
  plus a short summary tying the whole run together and the
  copy-paste requirements block.
