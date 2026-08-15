# Commit plan — export-timeout

> Produced by `/build-me` and approved before any code was written.
> Real path in a project: `docs/build/export-timeout.md`

Solution: `examples/export-timeout/2-solutions.md`
Problem:  `examples/export-timeout/1-grilling.md`

## Commit 1 — Record an export request and its state

- **From:** piece 1 of the solution
- **Builds:** Option C of piece 1 — background build with a state the page
  can ask about; this commit is the state itself
- **Serves:** R1, R6
- **Why we need it:** Nothing else can work until there's something to
  refer to. The instant answer, the progress checks, and the failure
  report all need a written-down request with a state on it.
- **Touches:** new migration and model for export requests; contacts
  export controller
- **Done when:** Clicking Export writes a row in `requested` state and
  answers immediately with its id, without building anything yet.

## Commit 2 — Build the file in the background

- **From:** piece 1 of the solution
- **Builds:** Option C of piece 1 — the actual background build
- **Serves:** R2, R6
- **Why we need it:** This is the part that produces the file. Without it
  a request is recorded and then nothing ever happens to it.
- **Touches:** new queued job; export request model; file storage
- **Done when:** A queued job moves a request `requested → building →
  ready`, leaves a complete file behind, and moves it to `failed` with the
  reason recorded if it throws.

## Commit 3 — Let the page ask whether it's done

- **From:** piece 1 of the solution
- **Builds:** Option C of piece 1 — the "check on it" half
- **Serves:** R1
- **Why we need it:** R1 isn't satisfied by answering fast if the person
  then has no way to learn the answer. This closes that loop.
- **Touches:** status endpoint; contacts page front-end
- **Done when:** The page polls and displays building, ready, or failed,
  and shows a download link only for ready.

## Commit 4 — Reuse an in-progress export instead of starting a second

- **From:** piece 2 of the solution
- **Builds:** Option C of piece 2 — hand back the one already running
- **Serves:** R3
- **Why we need it:** The pile-up from impatient clicking is half the
  reported problem. Until this lands, the fix makes that worse, because
  answering instantly means people can click far more often.
- **Touches:** contacts export controller
- **Done when:** Asking while one is `requested` or `building` returns
  that same export's id and queues no new job.

## Commit 5 — Restrict downloads to the owner, and expire them

- **From:** piece 3 of the solution
- **Builds:** Option C of piece 3 — owner check plus a fixed window
- **Serves:** R4, R5
- **Why we need it:** An export is a complete contact list. Until this
  commit, the download is open to anyone who has the link, forever.
- **Touches:** download endpoint; policy; a scheduled clean-up task
- **Done when:** A download by another account is refused, a download
  after 24 hours is refused with a plain explanation, and expired files
  are removed from storage.

---

> After each commit, `/build-me` stops. New logic carries `// WHY:`
> comments explaining the choice against the rejected options — meant to
> be deleted once read. For example, from commit 4:
>
> ```php
> // WHY: hands back the export already running instead of refusing the
> // second click, so impatient double-clicking looks the same as one
> // click. Refusing would satisfy R3 too, but turns ordinary behavior
> // into an error the person has to understand.
> ```
