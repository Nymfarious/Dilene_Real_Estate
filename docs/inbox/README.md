# `docs/inbox/` — Mantis reports

Reports filed from the running app land here when the dev-server bridge is
reachable (`vite-plugins/mantisInboxBridge.ts`, `POST /__mantis/report`).
Filename convention: `YYYY-MM-DD-HHMM-<slug>.json`.

A session opening cold should glance here first — anything committed to this
folder is by definition something a human took the trouble to keep.

Schema and field notes: [`../mantis.md`](../mantis.md). The payload matches
RootsGenie's so one reader handles both.

The bridge writes files; it does not commit. `git add` them yourself.
