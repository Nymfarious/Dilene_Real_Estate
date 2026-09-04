# Session artifacts — from sandbox to real vox

How thinking done in a chat gets into this repo instead of dying in scrollback.

## The failure this exists to prevent

On 2026-09-02 four architectural decisions — empty rooms permanently, prerender-and-scrub
as the shipping path, camera waypoints from the room graph, NPR as the visual identity —
were made at roughly 01:38 in one conversation. They were not written down anywhere until
an artifact was published at 18:32.

The canon in this folder was written between 15:10 and 17:23, in a *different* session.

So `site-spec.md` says "Meshy-generated furniture in Milestone 2" and the artifact says
"empty rooms, permanently, no furniture assets." Nobody overruled anybody. The thinking
had nowhere to live for seventeen hours, and the session that wrote the specs could not
see it. Four conflicts, none of them a real disagreement.

## The rule

**Every session that produces a decision ends with an artifact.**

Artifacts are durable, timestamped, and readable directly — `list` returns titles, URLs
and dates; `read` returns the content. No download, no `.mhtml`, no page saves. The eight
duplicate 5 MB page dumps in `_archive/2026-09-source/sessions/` were solving a problem
that does not exist.

## Four things that make one useful

**Title it like an index entry.** A listing shows the title, the URL and a date — nothing
else. That title is the only discovery surface across sessions. *Stylized Walkthrough
Pipeline* is findable. *Notes* is invisible. Distinctive noun phrases.

**Date the thinking, not the publish.** The trap we actually fell into. An artifact's
`updated` timestamp is when it was *published*, which can be many hours after the
conversation that produced it — and reading it as the decision time inverts the
chronology. Put the as-of date in the document itself:

> Issued 2026-09-02 · Working draft

**Carry a register.** The single most useful thing in that artifact was its A-7 sheet,
which sorted every claim into three buckets:

| Marker | Means |
|---|---|
| `Canon` | Already agreed. Should already be in `docs/`. |
| `New` | Decided in this session. **Needs to land in `docs/`.** |
| `Open` | Still an argument. Do not build on it. |

Most documents make a reader infer that. This one stated it, which is why the four
conflicts were findable at all.

**Say what would prove it stale.** That artifact listed "Capture protocol not yet written"
under `Open`. `docs/capture-protocol.md` existed by then — so the claim was falsifiable
against the repo, which is exactly how its true age got established. A checkable claim
beats a confident one.

## The loop has to close

An artifact is **transport, not destination**. `docs/` remains the source of truth; the
rule in `docs/README.md` still holds — *if a doc and the code disagree, the doc wins and
the code is a bug.*

```
session → artifact (timestamped, registered) → decision → committed doc → artifact goes stale
```

Skip the last two steps and the artifacts silently become a second, competing canon.
That is the state this repo was found in on 2026-09-02: five artifacts, one landed, four
unreconciled. The archive at `_archive/2026-09-source/extracted/` holds the plain text of
all five if any of it still needs folding in.
