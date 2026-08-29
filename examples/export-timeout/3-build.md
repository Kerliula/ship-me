# Commit plan — export-timeout

> Produced by `/build-me` and approved before any code was written.
> Real path in a project: `docs/build/export-timeout.md`
>
> `Touches:` and `Unplanned:` were written **after** each commit was built —
> everything else was approved before it. That's why the paths are real and
> why the mid-build decisions are here at all.

Solution: `examples/export-timeout/2-solutions.md`
Problem:  `examples/export-timeout/1-grilling.md`

## Commit 1 — Record an export request and its state

- **From:** sub-problem 1 of the solution
- **Builds:** Option C of sub-problem 1 — background build with a state
  the page can ask about; this commit is the state itself
- **Serves:** R1, R6
- **Why we need it:** Nothing else can work until there's something to
  refer to. The instant answer, the progress checks, and the failure
  report all need a written-down request with a state on it.
- **Touches:** `database/migrations/2024_05_01_000000_create_export_requests_table.php`,
  `app/Models/ExportRequest.php`, `app/Http/Controllers/ContactExportController.php`
- **Done when:** Clicking Export writes a row in `requested` state and
  answers immediately with its id, without building anything yet.
- **Unplanned:**
  - Stored the requesting account on the export row rather than deriving it
    from whoever owns the contact list. For a shared list those differ, and
    the solution never said which one should own the download.
  - Called the first state `requested` rather than `queued` — nothing is
    queued until commit 2 exists.

## Commit 2 — Build the file in the background

- **From:** sub-problem 1 of the solution
- **Builds:** Option C of sub-problem 1 — the actual background build
- **Serves:** R2, R6
- **Why we need it:** This is the part that produces the file. Without it
  a request is recorded and then nothing ever happens to it.
- **Touches:** `app/Jobs/BuildContactExport.php`, `app/Models/ExportRequest.php`,
  `config/filesystems.php`
- **Done when:** A queued job moves a request `requested → building →
  ready`, leaves a complete file behind, and moves it to `failed` with the
  reason recorded if it throws.
- **Unplanned:**
  - Recorded the failure reason as free text rather than a code. R6 only
    asks that failures are shown to the person; nothing reads it
    programmatically yet, and a code would need a list nobody has agreed.

## Commit 3 — Let the page ask whether it's done

- **From:** sub-problem 1 of the solution
- **Builds:** Option C of sub-problem 1 — the "check on it" half
- **Serves:** R1
- **Why we need it:** R1 isn't satisfied by answering fast if the person
  then has no way to learn the answer. This closes that loop.
- **Touches:** `app/Http/Controllers/ContactExportController.php`, `routes/web.php`,
  `resources/js/contacts/export-status.js`
- **Done when:** The page polls and displays building, ready, or failed,
  and shows a download link only for ready.
- **Unplanned:**
  - Polls every 3 seconds. The solution said "every few seconds" and never
    picked a number.

## Commit 4 — Reuse an in-progress export instead of starting a second

- **From:** sub-problem 2 of the solution
- **Builds:** Option C of sub-problem 2 — hand back the one already running
- **Serves:** R3
- **Why we need it:** The pile-up from impatient clicking is half the
  reported problem. Until this lands, the fix makes that worse, because
  answering instantly means people can click far more often.
- **Touches:** `app/Http/Controllers/ContactExportController.php`
- **Done when:** Asking while one is `requested` or `building` returns
  that same export's id and queues no new job.
- **Unplanned:**
  - Matched an existing export on contact list *and* requester, not on
    requester alone. Requester alone would hand someone exporting a second
    list the wrong file entirely.

## Commit 5 — Restrict downloads to the owner, and expire them

- **From:** sub-problem 3 of the solution
- **Builds:** Option C of sub-problem 3 — owner check plus a fixed window
- **Serves:** R4, R5
- **Why we need it:** An export is a complete contact list. Until this
  commit, the download is open to anyone who has the link, forever.
- **Touches:** `app/Http/Controllers/ContactExportDownloadController.php`,
  `app/Policies/ExportRequestPolicy.php`, `app/Console/Commands/PurgeExpiredExports.php`,
  `routes/console.php`
- **Done when:** A download by another account is refused, a download
  after 24 hours is refused with a plain explanation, and expired files
  are removed from storage.
- **Unplanned:**
  - Put the 24-hour window check on the query that lists exports on the
    contacts page, so expired ones stop being offered. The download route
    itself keeps only the owner check.
  - Clean-up runs nightly rather than hourly. The solution said downloads
    stop after 24 hours, not how quickly the files are deleted.

---

> The second entry under commit 5's `Unplanned:` is the whole argument for
> recording them. Nobody approved putting the expiry check on the listing
> query — it was decided while the code was being written, it looked right
> from the UI, and it is exactly the thing `/verify-me` caught as a failed
> R5 in [4-verification.md](4-verification.md). It was written down one
> phase before anyone knew it was a bug.

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
