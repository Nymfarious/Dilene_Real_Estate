# Offerings — two products, one pipeline

Decided 2026-09-02. The 360° panorama work is **not** a competing direction for the
walkthrough; it is a second, cheaper offer sold from the same shop, running on the same
middle. Recording it here so it stops reading as a collision in the specs.

## Offer 1 — The Walkthrough (flagship)

Real geometry the visitor moves through: orbit the building from outside, follow the
guided stops inside. This is the thing no brokerage template can produce.

Two ingest tiers feed one viewer:

| Tier | Input | Yields | Nav |
|---|---|---|---|
| **A — Drafted** | Listing photos that already exist, plus a traced plan | `floorplan.json` → extruded shell. Photos are material/lookdev reference only. | Orbit + guided stops |
| **B — Reconstructed** | A deliberate walk-capture: video or burst, ~70% frame overlap | Real captured geometry (see `capture-protocol.md` and the parallax rule) | Orbit + guided stops |

The tiers differ at **ingest** and at **fidelity**. They do not differ at the viewer —
that is the whole point, and it is why the navigation model had to be one that Tier A
can also satisfy. See `navigation.md`.

## Offer 2 — The 360° Tour (fast tier)

Panoramas shot with a consumer 360 camera, stitched into a room-to-room hotspot tour.
Cheap, quick, no reconstruction, no drafting. Sold beside the walkthrough, not instead
of it.

- **Viewer**: Photo Sphere Viewer — MIT, and built on Three.js, so it is a second camera
  rig inside the scene graph this repo already has rather than a bolted-on widget. Its
  virtual-tour plugin does hotspot navigation out of the box.
- **Capture**: Insta360 X4 bundle, ~$485 one-time (camera, invisible stick, tripod).
- **Running cost**: ~$1.25/mo for one agent, ~$25/mo at ten. Prototyping is free.
- **Known limit**: a panorama has no parallax, so the camera cannot translate. Panoramas
  are stop-and-look moments. Anything that needs to *move* belongs to Offer 1.

### The risk that shapes this offer

**Zillow already gives agents a free 360° tour, hosted and syndicated, with the same
camera you would buy.** So Offer 2 does not compete on the panorama itself — it competes
on everything around it: her brand, her compliance block, her domain, and the fact that
it sits next to a walkthrough Zillow cannot match. Price and position it accordingly.

Full cost model and scenarios: `_archive/2026-09-source/extracted/tourstack.txt`.

## What the two share

Ingest → optimise → store → index → publish, plus the viewer shell, `brand.json`, the
contact block, and the TREC compliance furniture. That shared middle is what makes this
one product with two offers rather than two side projects.

## Hook status

Not built. When it is: the panorama viewer mounts into the same canvas and takes the
camera the same way `Explore` does, so a property's JSON declaring panoramas gets a
third mode beside Tour and Explore. Nothing in the current code blocks it — the mode
switch in `main.ts` is the seam.
