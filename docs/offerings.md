# Offerings — two products, one pipeline

Decided 2026-09-02. The 360° panorama work is **not** a competing direction for the
walkthrough; it is a second, cheaper offer sold from the same shop, running on the same
middle. Recording it here so it stops reading as a collision in the specs.

## The principle

> **Own the foundation. Rent the discovery.**

The same rule that governs tooling in `vendor-notes.md`, one layer up — applied to her
business instead of ours.

Dilene is currently a tenant on every layer she has. The eXp page is a brokerage template
she fills in. `dilenerealtydfw.com` is a vendor's build. She cannot drop a walkthrough
into either, which is the entire reason this site had to be a third thing rather than an
improvement to one of them.

| | What | Why |
|---|---|---|
| **Rent** | Zillow, the MLS, Instagram, the brokerage platform | Commodity distribution with network effects nobody out-builds. Renting is the correct answer, not a compromise. |
| **Own** | The domain, `brand.json`, the plan data, the engine | The part that survives a brokerage change. |

The caveat that keeps this honest: an agent genuinely *cannot* own discovery — the MLS is
a cooperative and Zillow has the network. The rule is not "own everything." It is: know
which layer you are standing on, and never mistake a rented storefront for a deed.

It runs all the way down into the ingest tiers below. Tier A is assembled from photos that
came off rented channels. Tier B — the walk-capture — produces an asset she owns outright,
of a property, on her own terms. That is the tier that is actually hers.

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

### Zillow — read this through the principle, not as a threat

**Zillow already gives agents a free 360° tour, hosted and syndicated, with the same
camera you would buy.** Filed originally as the risk that sinks Offer 2. It isn't, and the
principle above is why.

Zillow's free tour is *rented discovery*. It lives on Zillow's page, feeds Zillow's
traffic, and evaporates the day she changes brokerage. That is not a reason to skip it —
free distribution is free distribution, take it. But it is a leaflet, not a house.

So the answer is **both, deliberately, with the layers kept straight**: shoot the
panoramas, put them on Zillow because it costs nothing and reaches buyers, and keep the
same assets running on her own domain next to a walkthrough Zillow cannot syndicate.

Offer 2 therefore does not compete on the panorama. It competes on everything around it —
her brand, her compliance block, her domain — and on sitting one click from Offer 1.
Price and position it accordingly.

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
