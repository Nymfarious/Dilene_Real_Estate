# Drafting Standards — how a plan is drawn in this project

These are the conventions every plan in the repo follows, whether it is rendered by `src/plan/npr.js`, sketched on paper during capture, or described in a caption. They are a small subset of ordinary architectural drafting practice (the parts that matter for reading a home plan at a glance), plus the project's own rules for coordinates and naming. If `floorplan.json` and this document disagree, this document wins and the JSON gets fixed.

## 1. Coordinates and units

- **Units are feet.** Inches are decimals: 6 in = `0.5`, 4 in = `0.333`. Write `15'-4"` in prose, `15.333` in JSON.
- **X grows east (right on the page), Y grows north (up the page).** Origin is the south-west corner of the exterior envelope. There are no negative coordinates on a single-building plan.
- **Heights** are feet above that level's finished floor. A standard door head is `6.67` (6'-8"), a standard window sill `3.0`, a standard ceiling `8.0`.
- **`meta.north`** is the clockwise angle from +Y to true north. `0` means the top of the sheet is north. Every plan shows a north arrow; the renderer rotates it by this value.
- **3D mapping** (for anyone touching the scene code): plan `(x, y, h)` → world `(x, h, −y)`. Plan north is world −Z. Rotations that are counter-clockwise in plan are positive yaw in world.

## 2. Walls

- A wall is a **straight centerline segment** with a thickness. Split walls at every corner and at every change of thickness. Never model an L as one wall.
- Interior walls default to `0.375` ft (4½ in — 2×4 with drywall both sides). Exterior walls default to `0.5` ft. Use real measurements when you have them.
- Walls are drawn as **solid poché** (filled black) on the plan. Poché is what makes a plan readable at thumbnail size; do not outline walls and leave them hollow.
- Wall ends extend by half their thickness so corners close. The renderer does this; the JSON stores the true centerline.

## 3. Openings

Every opening belongs to exactly one wall and is located by **`at`: the distance along the wall from its `from` point to the near edge of the opening**. Width is the clear opening.

| Type | Symbol on the plan | Notes |
|---|---|---|
| `door` | Gap, door leaf at 90°, dashed quarter-circle swing arc | Standard interior 2'-6" to 3'-0"; front door 3'-0". |
| `window` | Gap with three parallel lines (two faces + center glass line) | Default sill 3'-0", head 6'-8". Record real values. |
| `cased` | Gap with a light dashed line across | Cased opening / archway with no door. Head defaults to ceiling. |
| `slider` | Gap with two offset overlapping lines | Sliding glass or bypass closet doors. |
| `pocket` | Gap with a long-dash line | Door slides into the wall. |
| `bifold` | Gap with a zigzag | Closet bifolds. |

**Door swing** is the one thing people get wrong, so the rule is mechanical. Walk the wall from its `from` point toward its `to` point. Your **left** is the wall's left side.

- `in-…` swings to the wall's left side; `out-…` swings to its right side.
- `…-left` hinges at the near jamb (the `at` end); `…-right` hinges at the far jamb (`at + width`).

Convention for what should swing where: doors swing **into the room they serve** (bedroom doors open into the bedroom, bath doors into the bath), and **against the nearest wall** so the leaf lies flat when open. Exterior doors swing in. Closet doors swing out or bifold. When capturing, note "into bedroom, hinge on the closet side" — that sentence maps to one enum value.

## 4. Spaces

- A space is a **closed polygon, counter-clockwise, drawn to the finished face of the walls** (not the centerline). The sample plan cheats and uses centerlines because it is a sketch; a measured plan must not.
- Every space has a `kind`; the renderer's wash colour and the 3D floor material come from it. Pick the closest: a "flex room" is `office`; a "bonus room" is `living`; a mudroom is `entry`.
- **Names** are what the docent says out loud: "Primary Bedroom", "Kitchen", "Entry & Hall". Title case. No abbreviations. Never "Master".
- **Labels** on the plan show the name, then `width × depth · area` in small caps. Width and depth are the polygon's bounding box, so an L-shaped room reads a little large — that is fine for a home plan and expected by anyone who reads listings.
- **Area** is the polygon area (shoelace), shown in whole square feet. A level's total is the sum of its spaces, excluding `closet`, `garage`, `porch`, `patio`.

## 5. Fixtures

- Placed by the **center of their footprint**, `size` is `[width, depth]` before rotation, `rotation` is degrees counter-clockwise on the plan.
- Beds: depth runs head-to-foot; the **headboard is on the north (`+y`) edge** before rotation. Queen `5 × 6.67`, king `6.33 × 6.67`, twin `3.25 × 6.25`.
- Kitchen runs are one `kitchen-run` fixture per straight counter, `2.08` (25 in) deep; put range and fridge as their own fixtures so they read on the plan.
- Fixtures never determine geometry. If a fixture doesn't fit, the wall is wrong or the fixture is; fix the measurement, don't move the wall.
- Fixtures with an `asset` reference will be replaced by real models in the 3D scene. Until then they render as proportioned placeholder boxes — good enough to judge a room.

## 6. Sheet conventions (the rendered plan)

- **Paper**, not screen: warm off-white, a 1-ft drafting grid under everything, visible grain on top.
- **Line weights**, thick to thin: wall poché → door leaves → fixtures → window glass line → dimension strings → grid.
- **Dimension strings** use 45° tick marks, not arrowheads. Overall width along the bottom, overall depth along the left, text centered on the line. Room dimensions live in the room label, not as strings.
- **North arrow** top-right. **Scale bar** bottom-left (0–5–10 ft). **Title block** bottom-right: title, subtitle, then `LEVEL · UNITS · CONFIDENCE · DATE` in small caps.
- Every plan whose `meta.confidence` is not `surveyed` carries the line **ROUGH SKETCH — NOT FOR CONSTRUCTION**. Do not remove it for a nicer picture.

## 7. Naming

- `space.id`, `wall.id`, `opening.id`, `fixture.id` are lowercase kebab-case and stable — they are referenced from photos, captions, and the 3D scene. Renaming an id is a migration.
- Walls: `ext-<side>` for exterior (`ext-n`, `ext-e`, …), `i-<a>-<b>` for interior between spaces `a` and `b`.
- Openings: `door-<space>`, `win-<space>-<side><n>`, `open-<a>-<b>` for cased openings.
- Photos: `<space-id>_<direction>_<n>.jpg` (see the capture protocol).

## 8. What is deliberately out of scope for v1

Curved walls, multiple levels' stairs as connected geometry, roof geometry, plumbing/electrical, and metric units. Each is a v2 conversation, not a workaround in v1.
