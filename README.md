# ship-me

A comprehension-first workflow for [Claude Code](https://claude.com/claude-code).

Most AI coding failures aren't coding failures. They're comprehension failures —
you didn't fully understand the problem, the model filled the gap with something
plausible, and you found out three commits later.

These skills put a gate in front of every step where that can happen — and
a map behind them, so you can see what the gates let through.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/pipeline-dark.svg">
  <img alt="The ship-me pipeline: grill-me, solve-me, build-me, verify-me and test-me, each writing a markdown artifact for the next, with developer approval gates between them." src="assets/pipeline-light.svg">
</picture>

You stay in control at every gate. The skills are deliberately hard to
steamroll: `/grill-me` won't advance until you can answer, `/build-me` won't
write code until you approve the commit plan, and `/verify-me` refuses to write
tests or start the next phase on its own.

## Install

```bash
git clone https://github.com/Kerliula/ship-me.git
cd ship-me && ./install.sh
```

That symlinks the skills into `~/.claude/skills/`, so `git pull` updates them.
Use `--copy` for real copies, or `--project <path>` to install into a single
project's `.claude/skills/` instead.

Restart Claude Code, then:

```
/grill-me the export endpoint times out on large accounts
```

## The skills

| Skill | What it does | Writes |
|---|---|---|
| `/grill-me` | Interrogates you until you can explain the problem, the constraints, and the consequences yourself. Drafts what's **out of scope** and **how we'd know it works** — the two things developers always leave vague — and makes you confirm or correct them. | `docs/grilling/<slug>.md` |
| `/solve-me` | Breaks the problem into sub-problems. For each, every genuinely different solution that exists — not three fake options — plus one recommendation. No framework or library names allowed, so the design survives a stack change. | `docs/solutions/<slug>.md` |
| `/build-me` | Cuts the work into commits, gets your approval on the plan, then builds one commit at a time. Each commit says which numbered requirement it serves. New logic gets a plain-language comment explaining the *why* — meant to be deleted once you've read it. | `docs/build/<slug>.md` |
| `/verify-me` | Acts like a QA engineer, not a code reviewer. Creates real data, hits the running app with curl — golden path, edge cases, hostile inputs — and logs every request and response. Ends with a list of the tests that are still missing. Writes none of them. | `docs/verification/<slug>.md` |
| `/test-me` | Writes the missing tests, and actively refuses the useless ones: tests that can't fail, that test the framework, or that lock in implementation details. Every test comes with one sentence on the real bug it catches. | test files |
| `/ship-me` | Conductor. Runs the whole pipeline, keeping the interactive phases in your session and spawning the rest fresh. Three approval gates: solution options, commit plan, go-ahead for tests. | — |
| `/map-me` | Builds one graph across **every** run in the project — requirements, options, commits, touched files, and the decisions made mid-build — then reports the holes: what nothing built, what nothing proved, and what never went through a gate. | `docs/map/` |

Each phase hands its markdown file to the next one, so the reasoning is on disk
and reviewable instead of buried in a chat log. Each skill is also usable on its
own — `/grill-me` alone is worth it for anything you don't fully understand yet.

## Where each phase runs

Invoking a skill doesn't reset your session. It loads instructions into the
conversation you're already in, and context keeps accumulating. What `/ship-me`
does instead is more selective:

| Phase | Runs in |
|---|---|
| `/grill-me` | your session |
| `/solve-me` | **a spawned session** — no memory of yours |
| `/build-me` | your session |
| `/verify-me` | **a spawned session** |
| `/test-me` | **a spawned session** |

The split is interactive versus not. `/grill-me` is a dialogue and `/build-me`
stops after every commit for you to review — neither can be spawned, because
you're in the loop. The other three take a file in and write a file out, so
they get a fresh agent with a fully self-contained prompt.

They're spawned so they **can't** see the conversation that produced their
input. If `/solve-me` could read the interrogation, it would inherit your
framing and its own earlier guesses instead of reading the write-up cold. The
file is the interface, and a session with no memory is what proves the file
actually stands on its own.

Run a skill by hand — `/solve-me` typed by you — and nothing is spawned at
all; it runs right where you are.

One consequence worth knowing: your session carries the whole interrogation
*and* every commit review, so it's the long-lived one. That's deliberate —
`/build-me` needs the requirements and the conventions it learned from your
codebase — but it's why the three spawned phases are the cheap ones.

## The map

The pipeline skills already write down everything a graph needs: R-numbers,
sub-problems, options with the reason each one lost, commits with the
requirement they serve and the files they touched, and a coverage table
saying which requirements were actually proven. `/map-me` reads those four files and
draws it.

```bash
node ~/.claude/skills/map-me/map-me.mjs
```

It writes `docs/map/` — a standalone `index.html` graph, a `HOLES.md`, and
one note per node that opens as an Obsidian vault. No dependencies, no
network, no tokens: a script parses, and `/map-me` reads the result back to
you in plain language.

**The map stays current on its own.** Every skill that writes an artifact
refreshes it immediately afterwards — grill-me and solve-me when they save,
build-me when the commit plan lands and again after every single commit,
verify-me when it reports. Those refreshes run with `--brief`, which prints
only the holes that opened or closed since the last one and prints nothing
when nothing changed. So during a build you see a line or two per commit:

```
map: +2 holes  (docs/map/index.html)
  + Decided mid-build, never approved at a gate — Commit 5: Put the 24-hour
    window check on the query that lists exports on the contacts page...
```

None of it is a gate. Nothing pauses, nothing gets fixed automatically — it
is a running account of what the written record covers, and what to do about
it is yours to decide.

Holes about work that hasn't happened yet are suppressed, so the early phases
stay silent: a commit is only judged once it's actually been built, and a
phase you haven't reached isn't a hole.

`docs/map/` is generated. Commit it if you want a diffable record of when
each hole opened, or add it to `.gitignore` — both work.

Its job is not to pretty-print the structure — you can read that in the four
markdown files. Its job is the part you **can't** see from inside any single
run:

- a requirement you approved that no commit ever served
- a requirement with code behind it and nothing that ever proved it — the
  one that reads as done and isn't
- a commit that builds an option the solution rejected
- every decision made *while the code was being written*, which went through
  no gate at all
- files that several separate runs have now touched — where debt compounds,
  and invisible from inside any one of them

File nodes are deliberately **not** namespaced per run. That's the whole
point: a file three runs have touched shows up as one node with three edges
into it.

A map that shows what's missing is worth more than one that redraws what you
already read. And it makes it legitimate to skim the rest — which is the only
version of this that survives contact with a tired brain.

## See it before you run it

[`examples/export-timeout/`](examples/export-timeout/) carries one feature —
a CSV export that times out on large accounts — through all four written
phases: the interrogation, the option comparison, the approved commit
plan, and the verification run that caught a requirement the code got
wrong. Start there if you want to know what these skills actually hand you.

[`examples/export-timeout/map.html`](examples/export-timeout/map.html) is the
map `/map-me` builds from exactly those four files — 44 nodes, 8 holes. It's
a single self-contained file; download it and open it in a browser.

## Design principles

**Comprehension debt is the real debt.** Speed you borrow by not understanding
the problem gets repaid at 10x during debugging.

**Plain language beats architecture diagrams.** `/solve-me` bans framework names
so you compare *ideas*, not familiarity.

**Nothing advances on a phase that isn't finished.** Every handoff is a real
gate, not a formality.

**A test that can't fail is worse than no test.** It's false confidence with a
green checkmark.

**The file is the interface.** Every phase reads a written artifact, not a
chat log — and the three non-interactive phases run with no memory of your
session, so a write-up that only makes sense in context fails loudly instead
of quietly.

**The decisions nobody approved are the ones that bite.** Every other choice
in this pipeline passes a gate. The ones made mid-commit don't — so
`/build-me` writes them down under `Unplanned:`, and `/map-me` puts them
where you'll see them.

## Stack notes

`/grill-me`, `/solve-me` and `/ship-me` are stack-agnostic.

`/map-me` is stack-agnostic and needs only Node 18+.

`/build-me`, `/verify-me` and `/test-me` currently assume a **Laravel/PHP**
project — they reference artisan, Eloquent conventions, and Pest/PHPUnit. They
adapt to other stacks reasonably well, but you'll get the best results on
Laravel. PRs that generalize these are welcome.

## Contributing

Issues and PRs welcome, particularly:

- Generalizing the three Laravel-coupled skills to other stacks
- Real example runs from your own projects (see [`examples/`](examples/))
- Cases where a skill let something through it should have caught

## License

MIT
