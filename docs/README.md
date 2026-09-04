# Canon

The documents that define this project. Read in this order the first time.

| Doc | Answers |
|---|---|
| [`site-spec.md`](site-spec.md) | What we're building, for whom, in what order (Milestone 1: the Reveal · Milestone 2: the Residence). |
| [`floorplan-schema.md`](floorplan-schema.md) | What goes in a `floorplan.json` and how to write one. The JSON Schema is in `../schema/`. |
| [`drafting-standards.md`](drafting-standards.md) | Coordinates, units, wall/opening/space conventions, sheet layout, naming. |
| [`capture-protocol.md`](capture-protocol.md) | How to measure and photograph a home with a phone and a tape so the plan can be written from it. |
| [`docent.md`](docent.md) | The intro/guided-tour overlay: behaviour contract and copy. |
| [`stack-and-keys.md`](stack-and-keys.md) | The stack, every key/account by milestone, the Cesium answer, and what's missing. |
| [`offerings.md`](offerings.md) | The two products (walkthrough · 360° tour), the two ingest tiers, and what they share. |
| [`vendor-notes.md`](vendor-notes.md) | Tools evaluated, adopted or rejected, and the tool-vs-dependency rule. |
| [`mantis.md`](mantis.md) | The report button: what it captures, how it delivers, how to switch on live delivery. |
| [`session-artifacts.md`](session-artifacts.md) | How chat-session thinking reaches this repo, and the register that keeps it honest. |
| [`panorama-pipeline.md`](panorama-pipeline.md) | 360° tours from a phone or a budget dual-fisheye: capture, stitch, ingest, and the plan-linked graph. |

Changing a convention means changing the doc first, then the code. If a doc and the code disagree, the doc wins and the code is a bug.
