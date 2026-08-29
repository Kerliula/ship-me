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

## The map

The pipeline skills already write down everything a graph needs: R-numbers,
sub-problems, options with the reason each one lost, commits with the
requirement they serve and the files they touched, and a coverage table saying which
requirements were actually proven. `/map-me` reads those four files and
draws it.

```bash
node ~/.claude/skills/map-me/map-me.mjs
```

It writes `docs/map/` — a standalone `index.html` graph, a `HOLES.md`, and
one note per node that opens as an Obsidian vault. No dependencies, no
network, no tokens: a script parses, and `/map-me` reads the result back to
you in plain language.

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
