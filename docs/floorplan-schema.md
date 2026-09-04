# floorplan.json — the one file that drives everything

`schema/floorplan.schema.json` is the machine-checkable truth. This page is the human version: what each part means, why it is shaped this way, and how to write one without fighting it.

**The idea.** One property = one JSON file. From it, `src/plan/npr.js` draws the stylized floor plan and `src/scene/house.ts` builds the walk-through. The docent reads the tour from it. Nothing about a property lives anywhere else. If a caption is wrong, the fix is in this file.

## Shape at a glance

```
{
  "version": 1,
  "meta":   { id, title, subtitle?, units:"ft", north?, source, confidence, captured?, author?, notes?, attribution? },
  "levels": [
    { id, name, elevation?, ceiling?,
      walls:    [ { id, from:[x,y], to:[x,y], thickness?, height?, exterior? } ],
      openings: [ { id, wall, type, at, width, height?, sill?, swing? } ],
      spaces:   [ { id, name, kind, polygon:[[x,y]…], floor?, ceiling?, camera?, notes?, photos? } ],
      fixtures: [ { id, type, at:[x,y], size:[w,d], height?, rotation?, space?, asset?, label? } ] }
  ],
  "tour":   [ { space, title?, caption?, camera?, via?, hold? } ]
}
```

Coordinates: feet, X east, Y north, origin at the SW corner of the envelope. Heights: feet above the level's finished floor. Full conventions in `drafting-standards.md`.

## `meta`

| Field | Meaning |
|---|---|
| `id` | Slug; also the filename (`sample-apt.json`). Stable forever. |
| `title` / `subtitle` | What the sheet and the page call it. Subtitle is a city or unit, never a street address unless the owner has agreed to publish it. |
| `source` | `sketch` (drawn from memory/photos), `measured` (tape), `scan` (LiDAR/photogrammetry), `listing` (traced from a listing's plan). |
| `confidence` | `rough` ±1 ft · `measured` ±2 in · `surveyed` professional. Anything below `surveyed` prints NOT FOR CONSTRUCTION. |
| `north` | Degrees clockwise from +Y to true north. |
| `attribution` | Where imagery/plans came from when you didn't shoot them. |

## `levels[]`

One entry per floor. `ceiling` is the default height for the level's walls and spaces; override per wall (pony walls) or per space (vaulted rooms).

### `walls[]`

Straight centerline segments. `thickness` defaults to 0.375 (interior) or 0.5 (`exterior: true`). Split at corners. IDs: `ext-n`, `i-living-kitchen`, …

### `openings[]`

Cuts in a named wall. **`at`** is the distance from the wall's `from` point to the near edge; **`width`** is the clear width. `sill`/`height` are bottom/top above the floor (defaults: doors 0 → 6.67; windows 3 → 6.67; cased → ceiling). `swing` is only for doors — see the mechanical rule in drafting standards §3. In 3D, the wall is split around each opening: pieces either side, a header above, a sill piece below for windows.

### `spaces[]`

Closed polygons to the finished wall faces, counter-clockwise. `kind` picks colour/material. `camera` is the default viewpoint for the tour: `eye` and `look` are `[x, y, h]` in plan feet — stand where a visitor would stand, look where they'd look, eye height around 5.3. `photos[]` lists capture photos by relative path.

### `fixtures[]`

Center-placed footprints with a type from a fixed list. Placeholder boxes in 3D until `asset` points at a real model. Beds' headboards face +y before rotation.

## `tour[]`

The ordered story the docent tells and the camera follows. Each stop names a `space`; it inherits that space's `camera` unless it overrides one (the final aerial stop does — it reuses `living` with a camera 48 ft up). `via` is a list of `[x, y, h]` waypoints the camera passes through on the way *to* this stop: one in each doorway and the path never cuts a wall. `hold` weights how much of the scroll a stop owns (default 1).

Captions are ≤ 240 characters and follow the copy rule from the reference prompt: short, specific, no generic luxury phrases, facts and mood only.

## Writing one from a capture

1. Exterior walls first, clockwise from the SW corner: `ext-s`, `ext-e`, `ext-n`, `ext-w`. Check the envelope numbers against your sketch.
2. Interior walls, longest first. Name them by the two spaces they separate.
3. Openings, wall by wall, walking each wall from `from` to `to` with the sketch in hand.
4. Spaces, one polygon each, to the wall faces. Give each a `camera` from the doorway shot you took.
5. Fixtures only where they explain the room.
6. The tour: entry first, aerial last, one `via` per doorway between stops.
7. `npm run plan data/floorplans/<id>.json` → open `out/<id>.svg` → compare to the sketch → fix → repeat.
8. `npm run dev` → walk it.

## Validation

The schema is draft 2020-12 with `additionalProperties: false` everywhere, so a typo in a key fails loudly. Validate with any JSON Schema tool; VS Code will do it inline if the file's `$schema` points at `../../schema/floorplan.schema.json` (it does in the sample). Things the schema cannot check and a human must: polygons match wall faces, openings sit on the wall they name, `via` points are actually in doorways, every `tour[].space` exists.

## Versioning

`version` is `1`. Additive changes (new optional fields, new enum values) don't bump it. A change to coordinate conventions, units, or the meaning of an existing field bumps it to `2` and ships with a migration script under `tools/`.
