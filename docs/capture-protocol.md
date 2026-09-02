# Capture Protocol — phone camera, no LiDAR

**Purpose.** Produce everything `floorplan.json` needs from one visit to a home, using a phone camera, a tape measure, and about ninety minutes. First subject: Apt D. Every later property uses the same protocol, so do it properly once and it becomes muscle memory.

**Output of one capture session**

| Artifact | Where it goes | Used by |
|---|---|---|
| `sketch.jpg` — photo of the hand-drawn plan with dimensions | `capture/<property>/` | you, while writing `floorplan.json` |
| `measurements.md` — the room-by-room numbers | `capture/<property>/` | `floorplan.json` |
| `photos/<space>/…` — reference photos, named by space and direction | `capture/<property>/photos/` | `space.photos[]`, lookdev, Meshy prompts |
| `notes.md` — anything the numbers don't say | `capture/<property>/` | captions, docent copy |

`capture/` is git-ignored above 2 MB per file. Keep originals in a cloud folder; only downsized photos (≤ 1600 px, ≤ 400 KB) get checked in, and only the ones a space actually references.

---

## 0. Kit

- Phone, fully charged, lens wiped. Any camera app; turn **grid** on and **HDR** on.
- 25-ft tape measure. A laser measure is nicer but not required.
- Clipboard, pencil, one sheet of grid paper per level (¼-inch grid; 1 square = 1 ft).
- Painter's tape — a small strip on the floor at each doorway you've measured, so you don't measure it twice.
- Optional: a compass app, for `meta.north`.

## 1. The walk (10 minutes, no measuring)

Walk every room once. On the grid paper, draw the **outline of each room as a rectangle, roughly to scale, in the position it actually sits**. Don't measure yet. Name each room on the sketch with the `space.id` you'll use (`living`, `kitchen`, `bedroom-1`, `bath`, `entry`, …). Mark every door as a gap with a small arc showing which way it swings, and every window as a double line.

Stop when the sketch shows every room, every door, every window, and how they connect. This sketch is the single most valuable artifact of the day; everything else hangs off it.

## 2. The envelope (5 minutes)

Measure the **overall exterior dimensions** first, along the longest walls you can get to — inside is fine (add wall thickness later). Write them along the outside of the sketch. These two numbers (width, depth) will be the first thing you check `floorplan.json` against, and the plan renderer prints them as dimension strings for exactly that reason.

Find north with the compass app while standing at the front door. Write it on the sketch as an arrow.

## 3. Room by room (40 minutes)

For each room, in the order they appear on the sketch, write on the sketch:

1. **Width × depth**, measured wall to wall at floor level. Round to the nearest inch. Write it as `15'4" × 12'0"`.
2. **Ceiling height**, once per level unless a room differs (sloped ceilings, soffits — note them).
3. **Each opening on each wall**: distance from the nearest corner to the near edge of the opening, then the opening's width. Doors also get: swing direction (into which room, hinge on which side as you face the door from the hall). Windows also get: sill height from the floor and head height.
4. **Fixed things** you'll want on the plan: kitchen run length, island size, tub, vanity width, closet depth. Furniture only if it stays with the listing.

Say the number out loud as you write it. It catches transposed digits.

## 4. Photos (30 minutes) — the naming rule is the whole protocol

Every photo is named **`<space-id>_<direction>_<n>.jpg`** — e.g. `living_n_1.jpg`, `kitchen_se_2.jpg`. Direction is the compass direction you're facing (n, ne, e, se, s, sw, w, nw). If you forget nothing else, remember this: a folder of `IMG_4471.jpg` is worthless in a week; `bedroom-1_w_1.jpg` is a fact.

Per room, in this order:

| Shot | How | Why |
|---|---|---|
| **4 corner shots** | Stand in each corner, phone at chest height (≈ 4½ ft), level, landscape, widest lens, facing the opposite corner. | Shows two walls and the floor at once; enough to reconstruct proportions later. |
| **1 doorway shot** | Stand in the doorway facing into the room. | This is the shot the 3D camera reproduces; compare later. |
| **1 ceiling shot** | From the center, phone flat, pointing up. | Ceiling fixtures, soffits, fans. |
| **Detail shots** | Anything that carries the room: the stone on the counter, the tile pattern, the window trim, the floor material at a seam. Get close, fill the frame. | Material reference for Meshy prompts and lookdev. |
| **Windows** | One shot *of* each window from inside, one *through* it. | The view is a selling point; also gives you daylight direction. |

Rules that matter more than they sound:

- **Level the phone.** A tilted phone makes vertical lines converge and every later estimate wrong. Use the grid overlay; keep verticals vertical.
- **Same height every shot.** Chest height. Not eye height, not hip height. Consistency beats perfection.
- **Lights on, blinds open, HDR on.** You are recording information, not making art. Shoot the pretty version separately if you want one.
- **Overlap.** Corner shots should share the same wall in adjacent frames. If it's ever fed to a photogrammetry tool, overlap is what makes it work.
- **No people, no pets, no mirrors with you in them.** Reference imagery ends up in prompts and in the repo.

## 5. Exterior and approach (10 minutes)

- Front elevation: straight on, from across the street, then from 45° each side.
- The approach: three shots walking from the sidewalk to the front door — where the docent's "Come in" moment starts.
- Any outdoor space: from the door looking out, from the far end looking back.
- If you can safely get height (a stairwell, a balcony, a neighbor's window), one shot looking down — a crude aerial anchor for the pull-out.

## 6. Before you leave

Stand at the front door and check:

- [ ] Sketch has every room, door, window; all named with `space.id`s
- [ ] Envelope width and depth written on the sketch
- [ ] North arrow on the sketch
- [ ] Each room has width, depth, and every opening's position and width
- [ ] Every photo follows `<space-id>_<direction>_<n>` — rename now, on the phone, while you remember which room was which
- [ ] Ceiling height(s) written down
- [ ] One photo of the sketch itself

## 7. At the desk, same day

1. Copy photos into `capture/<property>/photos/<space-id>/`. Downsize copies for the repo.
2. Transcribe the sketch into `capture/<property>/measurements.md`, one section per space, before you touch JSON. Numbers in the JSON must trace back to a line in this file.
3. Write `floorplan.json` per `docs/floorplan-schema.md`, starting from the exterior walls, then interior walls, then openings, then spaces, then fixtures. Set `meta.source: "measured"` and `meta.confidence: "measured"`.
4. Render the plan (`npm run plan data/floorplans/<property>.json`) and check it against the sketch: envelope dimensions match, every door swings the right way, every window is on the right wall. Fix and re-render until you would sign it.
5. Only then open the walkthrough.

## Adapting for Apt D from Zillow photos (before you can shoot)

Listing photos are the wrong height, wrong lens, and unmeasured, so treat them as a **pre-visit sketch aid only**: use them to draw the section-1 sketch and guess proportions, set `meta.source: "listing"`, `confidence: "rough"`, and record `attribution: "Zillow listing photos, <date>"`. Replace with measured data after the real visit. Never check listing photos into the repo — they're the listing's, not yours.

## If you later get LiDAR

The protocol doesn't change; a room-scan app (Polycam, Scaniverse, RoomPlan) becomes a *sixth* artifact that gives you a mesh and auto-dimensions to check your tape against. The sketch and the named photos stay canonical because they're what a human can verify at a glance.
