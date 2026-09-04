# Panorama pipeline — 360° tours we own

Decided 2026-09-04. We build this pipeline ourselves. What we do **not** do is
spend $485 on an Insta360 X4 — an earlier draft of `offerings.md` treated that
as a prerequisite and it never was. The cost model in
`_archive/2026-09-source/extracted/tourstack.txt` should be read with that
assumption removed.

## Two capture paths

The pipeline is the same from ingest onward. Only the front end differs.

| | **Path A — phone only** | **Path B — budget dual-fisheye** |
|---|---|---|
| Hardware | none | a ~$200–300 360 cam (e.g. AKASO 360: dual 48MP, 72MP 360 stills, native 5760×2880 equirect) |
| Capture | 14 guided frames per station | one shutter press |
| Stitching | **we build it** — the hard case, see below | mostly free: fixed known lens geometry, or straight equirect out of the camera |
| Parallax risk | high; the governing constraint | eliminated by the hardware |
| Time to first tour | weeks | days |

Path A is the interesting engineering problem and costs nothing but time.
Path B skips the one part that is physics rather than software.

**Either way, the same things stay ours**: ingest, the viewer, and the
plan-linked graph — which is where all the differentiation lives. A camera
absorbs optics; it does not build a tour that knows what a doorway is.

Not in the running: pan/tilt security cameras (Ring and similar). They rotate
about the mount rather than the lens, so parallax returns; 1080p is far below
the ~5760×2880 an equirect needs; and the footage sits in a vendor cloud with
no supported still export, which is a dependency at the worst possible layer.

The rest of this document specs **Path A**, because it is the one that needs
speccing. Under Path B, skip to *Ingest*.

## Why building Path A is reasonable

The usual argument against writing a stitcher is that a 360 camera solves
parallax in firmware with fixed, known lens geometry. True — but it buys that
by throwing away the one advantage we actually have.

**We own the capture app, so we can record orientation with every frame.**

Hugin, PTGui and OpenCV all solve camera orientation *blind*, from image
features alone. That search is the expensive, fragile part of stitching. If
each shot arrives already carrying the phone's gyro attitude, orientation stops
being a search and becomes a refinement — a prior good to a degree or two that
the optimiser only has to polish. That is a materially easier problem than the
one general-purpose stitchers solve, and it is available to us and not to them.

The second lever is the same one `capture-protocol.md` already applies to
measuring: **discipline at capture beats cleverness in software.**

## The physics that governs everything

Stitching artifacts are parallax artifacts. Parallax appears when the camera
*translates* between shots, and its severity scales with how close the nearest
surface is. Outdoors, everything is far away and sloppy handheld panoramas
stitch fine. In a bathroom the walls are four feet away and the same technique
tears and ghosts.

The fix is not software. Rotate the camera about its **no-parallax point** —
roughly the lens's entrance pupil, a centimetre or two behind the glass — and
parallax is *zero* regardless of scene depth. Rotate about your wrist or your
spine and it is large.

So the capture rule is one sentence: **pivot around the lens, not around
yourself.** Everything below follows from that.

## Capture pattern

Phone held **portrait** — the tall axis gives ~70–75° of vertical coverage, so
one ring does most of the sphere and you need fewer rings.

| Step | Shots | Notes |
|---|---|---|
| Mark the spot | — | Tape or a floor tile. The position goes in the plan, so it has to be repeatable. |
| Ring at eye level | 12 @ 30° | ~55° horizontal FOV in portrait, so 30° steps give ~45% overlap |
| Zenith | 1 | straight up |
| Nadir | 1 | straight down; you will be in it, see below |

Fourteen frames per station. Conditions, same as `capture-protocol.md`: lights
on, blinds open, interior doors propped, nothing moving in frame — a ceiling
fan or a curtain in a breeze is the classic ghosting source.

**Rotate the phone around the lens.** Hold it out and turn the phone in place
rather than turning your body with the phone at arm's length. A phone tripod
bracket makes this exact, and costs about the price of lunch, but it is an
accuracy upgrade and not a prerequisite.

**The nadir will contain the photographer.** Everyone has this problem. Either
patch it with the floor material, or drop a logo disc over it — which is what
most commercial tours do and it reads as intentional.

## Stitch

Hugin's toolchain, driven from Node, mirroring how `tools/plan-render/` wraps
`npr.js` — a CLI wrapper the browser never sees.

```
cpfind        → find control points between overlapping frames
cpclean       → drop the bad ones
autooptimiser → solve orientation and lens params  ← seeded with our gyro prior
nona          → warp each frame into equirectangular
enblend       → multi-band seam blending
```

All GPL, all scriptable, all mature. `enblend` in particular is the reason to
use this chain rather than OpenCV's `cv::Stitcher`: its multi-band blending is
substantially better at hiding the seams that small residual parallax leaves,
and seams are what make a tour look amateur.

The gyro prior enters as initial yaw/pitch/roll per image in the `.pto` project
file, so `autooptimiser` starts near the answer instead of hunting for it.

Output: one equirectangular JPEG per station, 2:1 aspect.

## Ingest

A `tools/pano-ingest/` step, before anything reaches `public/`:

1. **Strip EXIF — mandatory, not optional.** Phone photos carry GPS. A 360 of a
   client's living room with coordinates baked in, published on a public site,
   is a real problem for a licensed agent. This is the single strongest reason
   to own the ingest step rather than uploading raw frames anywhere.
2. Downscale to a delivery ladder (4096 / 2048 / 1024 wide).
3. Emit a poster frame — the forward-facing crop, for the facade pattern in
   `offerings.md` so nothing heavy loads until asked.
4. Write a manifest the plan file references.

`sharp` handles all of it and is already a reasonable dependency; add the line
to `stack-and-keys.md` when it lands, per `CLAUDE.md`.

## Viewer

Trivial, and the engine is already running. An equirectangular image is a
sphere with inverted normals and the camera inside it — about thirty lines
against the `createScene.ts` we have. It becomes a third mode beside Tour and
Explore, taking the camera the same way `Explore` does. `main.ts`'s mode switch
is the seam; `docs/offerings.md` already names it as such.

No new dependency needed. Photo Sphere Viewer is the fallback if the hotspot
and transition work turns out fiddlier than expected, but it brings its own
scene graph and we already have one.

## The part worth owning

This is why the tour is ours and not an embed.

`floorplan.json` already carries rooms with coordinates **and openings — every
doorway is already in the data.** So a panorama is not a loose image, it is a
node at a known `(x, y)` in plan space. Which gives us:

- **Hotspots derived from the room adjacency graph**, not hand-placed per
  property. "Where can I walk from here" becomes a query over openings.
- **Camera pins on the plan page**, clicking one opens that sphere.
- **One coordinate system shared with the 3D walkthrough**, so a tour can hand
  off mid-stride — stand in the photographed kitchen, step through the door
  into the drafted model.

Zillow cannot do this; they have no plan. Photo Sphere Viewer cannot either; it
has no notion of one. It is the shared middle from `offerings.md` made real.

It is also the first cheap application of one of the four open Pipeline
decisions — *camera waypoints derive from the room graph, not hand-authored
keyframes*. That idea gets to prove itself on panoramas, where the graph is
simple and the stakes are low, long before it has to drive the 3D camera.

### Schema addition

```jsonc
"panoramas": [
  {
    "id": "kitchen-01",
    "space": "kitchen",          // must match a space id on the level
    "at": [18.5, 9.0, 5.4],      // plan coords, feet — X east, Y north, eye height
    "northYaw": 214,             // degrees to align the sphere with plan north
    "image": "kitchen-01",       // manifest key, not a path
    "links": "auto"              // or an explicit array to override the graph
  }
]
```

`links: "auto"` is the default and the point: the doorways are already known.

## Build order

| Phase | What | Rough |
|---|---|---|
| 1 | Viewer — one hard-coded equirect as a third mode | half a day |
| 2 | Ingest — EXIF strip, ladder, poster, manifest | 1–2 days |
| 3 | Capture app — guided ring, records gyro per frame | 2–3 days |
| 4 | Stitch wrapper — Hugin chain + `.pto` with priors | 2–4 days |
| 5 | Graph — nodes in plan space, hotspots from openings | 2–3 days |

Phase 1 is worth doing first and alone: it proves the viewer against any
equirect off the internet, and it is the piece the whole rest hangs from. Do
not build phases 3 and 4 until 1 and 2 are real.

**Under Path B, phases 3 and 4 drop out entirely** — the camera does them — and
the whole thing is phases 1, 2 and 5: roughly four days to a working owned tour.
That is the honest argument for the cheap camera: it does not remove work you
wanted to do, it removes the two phases with the highest chance of producing
something that looks amateur through no fault of the code.

## Known failure modes

| Symptom | Cause | Fix |
|---|---|---|
| Ghosted furniture edges | translation between frames | pivot at the lens; re-shoot the affected pair |
| Visible vertical seam | exposure drift | lock AE/AWB before the ring, never mid-ring |
| Torn doorway | large parallax on a near edge | add a frame centred on the doorway |
| Blurry band | slow shutter in low light | more light, or brace; do not push ISO |
| Warped ceiling | too few frames near zenith | second ring at +40° |

Interiors are the hard case for stitching and no amount of software makes a
sloppy capture stitch cleanly. Budget for the first two or three attempts
failing — same expectation `capture-protocol.md` already sets, and the same
reason Apt D is the right first subject: it can be reshot at midnight.
