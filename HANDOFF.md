# Handoff — Dilene Real Estate

Written 2026-09-13 by a Claude Code session, for whichever human or AI picks this up next.
State below was verified against `origin/main` at commit `d30c081` on that date.
Read `docs/README.md` and `CLAUDE.md` before changing anything; this file is a status
snapshot, not canon. If it disagrees with `docs/`, `docs/` wins.

## The project in one paragraph

A gift site for **Dilene Allen**, REALTOR® with eXp Realty, Dilene Realty Group,
Dallas–Fort Worth. A property you walk through by scrolling: one `floorplan.json`
drives both a Three.js walkthrough with a guided intro (the Docent) and an ink-and-wash
SVG floor plan. It is a third site on its own URL that links out to her two existing
sites, because neither of those can host a WebGL walkthrough. The owner's phrase for
the wider ambition was "ecommerce real estate"; the canon resolved that as **one shop,
two offers on one pipeline** — the Walkthrough (flagship) and the 360° Tour (fast tier),
sharing ingest, storage, viewer shell, brand block and Texas compliance furniture. See
`docs/offerings.md`. The guiding principle is *own the foundation, rent the discovery*.

## Links

**Repository**
- Repo: https://github.com/Nymfarious/Dilene_Real_Estate
- Tag `v0.1.0-reveal` (Explore mode landed): https://github.com/Nymfarious/Dilene_Real_Estate/releases/tag/v0.1.0-reveal
- PR #1, merged 2026-09-03 — self-hosted fonts folder: https://github.com/Nymfarious/Dilene_Real_Estate/pull/1
- PR #2, merged 2026-09-04 — Explore mode, Mantis report button, four canon docs: https://github.com/Nymfarious/Dilene_Real_Estate/pull/2
- PR #3, **open**, clean, spec only — 360° panorama pipeline: https://github.com/Nymfarious/Dilene_Real_Estate/pull/3

**Canon docs** (all under `docs/`, indexed in `docs/README.md`)
`site-spec.md` · `floorplan-schema.md` · `drafting-standards.md` · `capture-protocol.md` ·
`docent.md` · `stack-and-keys.md` · `offerings.md` · `vendor-notes.md` · `mantis.md` ·
`session-artifacts.md` · (`panorama-pipeline.md` arrives with PR #3)

**Research artifacts on claude.ai** (the owner's account; readable by Claude sessions,
shareable by link to anyone else). Dated by the thinking inside, not the publish time.
| Artifact | What it holds |
|---|---|
| [Dilene Realty Group](https://claude.ai/code/artifact/7c62327e-316e-4fdf-b9e2-d39064cd8c87) | The original concept page the scaffold was built from: dark ink and gold palette, Bodoni Moda / Karla / Mrs Saint Delafield, Three.js hero. |
| [Stylized Walkthrough Pipeline](https://claude.ai/code/artifact/817adf26-bf33-4afa-904a-5b2114f7c79f) | Four architecture decisions of 2026-09-02 with a Canon / New / Open register. `docs/session-artifacts.md` explains why it matters. |
| [Dilene Tour Stack](https://claude.ai/code/artifact/b0433ca0-7ddf-409d-b558-458e26f782ff) | Feasibility and cost model: Cloudflare R2 + Pages for free egress, Photo Sphere Viewer on the same Three.js renderer, the four "Acceptable Excellence" rungs (build to AE 1 before spending, aim at AE 2). Read with the $485 camera assumption removed, per PR #3. |
| [Own the Foundation, Rent the Discovery](https://claude.ai/code/artifact/7b91a8f7-d220-4498-b907-2c4d33623a1a) | The principle behind `docs/offerings.md` and the Zillow reframe. |
| [Scroll Film Property Prompt](https://claude.ai/code/artifact/4a803049-0dfc-44d1-9e63-e4879c0813d3) | The six-chapter cinematic prompt transcribed from a video; the "do not invent" source-of-truth block, the withheld reveal, Lenis + ScrollTrigger. |
| [The Listing Camera Book](https://claude.ai/code/artifact/af8944e1-5749-491e-b9dd-3802d2d1eb6d) | 46 camera-movement prompts annotated for property, plus the nine-beat continuous flythrough (bay window → living → kitchen → porch → fountain → crane → block → map → card). |
| [Room Capture Kit](https://claude.ai/code/artifact/feab6325-16e9-4ef3-8f65-e73f55e65f95) | Hardware decisions: the Pixel 7 Pro covers both capture jobs; buy nothing until Dilene has shot a house herself; Colab free tier is the splat trainer for this setup. |
| [Room to Splat](https://claude.ai/code/artifact/792bf72a-264f-4350-8ac7-3a51efa1b0a7) | Eight steps from phone video to a Gaussian splat rendered with Spark inside Three.js. |

**Sessions**: fonts PR came from https://claude.ai/code/session_01EdNJAcdhHKc37wY1jAdTC1 ·
PR #3 came from https://claude.ai/code/session_017hTVQePRLmgkVgH5yzPrdQ

## What is on main, verified 2026-09-13

- Stack: Vite 6, TypeScript, Three.js r170, Lenis, GSAP ScrollTrigger. Node 22 (`.nvmrc`).
- `npm install`, `npm run check` (tsc) and `npm run build` all pass. The main chunk is
  ~655 KB minified / 186 KB gzip, mostly Three.js; Vite warns about it, nothing fails.
- Built and working: the Reveal (scroll walkthrough, seven stops, dollhouse pull-back),
  the Docent card, Explore mode (free orbit outside), the `/plan/` page rendering the same
  JSON as SVG, the `npm run plan` CLI, and Mantis (bottom-left report button; dev-server
  bridge writes JSON into `docs/inbox/`).
- Content: `data/floorplans/sample-apt.json` (a sample apartment, stated as such in the
  copy) and `data/brand.json` (every public fact about Dilene; nothing else may hold one).
- `public/fonts/` holds Bodoni Moda, Karla and Mrs Saint Delafield as latin + latin-ext
  WOFF2 with OFL licences and a `fonts.css`. **They are not wired in yet** — see below.

### Milestone 1 "Done when" checklist, as far as it can be checked from the repo

| Item | Status | Note |
|---|---|---|
| Docent opens / dismisses / remembers / re-opens | not verified here | needs a browser pass; code and spec exist |
| Every stop reachable by scroll, rail, docent list, ← → | not verified here | same |
| Camera never passes through a wall | not verified here | check every stop has its `via` doorways |
| Pull-back fades ceilings; plan page; SVG download | not verified here | plan CLI does run |
| Footer matches `brand.json`; both TREC labels; brokerage named | not verified here | brand.json has a `compliance` key |
| **Fonts self-hosted; works with Wi-Fi off** | **half done** | files in `public/fonts/`, but `index.html` still loads Google Fonts, and `plan/index.html` loads three more faces (Caveat, Fraunces, Public Sans) that are not self-hosted at all |
| **Deployed at a Vercel URL** | **not done** | no Vercel project exists for this repo on the `nymfarious-projects` team as of today |

## Decisions already made (do not re-litigate; change the doc first if you must)

- One plan file draws both the floor plan and the 3D rooms. Feet everywhere; X east,
  Y north, origin SW; world = (x, h, −y). `docs/drafting-standards.md`.
- Free orbit outside, guided stops inside. Free-walk-anywhere was ruled out because
  Tier A (drafted from listing photos) cannot support it. `src/scene/explore.ts`.
- Camera waypoints derive from the room graph, not hand-authored keyframes. First cheap
  application is panorama hotspots from doorways (PR #3).
- Tool vs dependency rule: a tool sits in your workflow, a dependency sits in your
  product; nothing without an API can be a dependency. Higgsfield adopted as a tool
  (MCP + CLI). ArchyBase and Lovable rejected. `docs/vendor-notes.md`.
- Hosting: Vercel for the site (free, auto-deploys from GitHub). For heavy panorama
  assets later, an egress-free store (Cloudflare R2) is the decision that matters most.
- Zillow's free 360° tour is rented discovery: use it, and keep the same assets on her
  own domain beside the walkthrough Zillow cannot syndicate.
- No 360° camera purchase until Dilene has personally shot one house. Buy only from
  Zillow's compatible list if one is bought. No drone without a Part 107 certificate.
- Virtually staged images must carry a disclosure label rendered automatically; confirm
  wording with her broker.
- Milestone 2 order: real property (Apt D via capture protocol) → real materials →
  the zoom-out on Cesium terrain via `3d-tiles-renderer` → showing-request form →
  her domain → compliance for real → optional cinematic clip layer. `docs/site-spec.md`.

**Known unresolved tension**, recorded in `docs/session-artifacts.md`: the Stylized
Walkthrough Pipeline artifact says "empty rooms, permanently"; `site-spec.md` still says
Meshy furniture in Milestone 2. Nobody has ruled. Treat as `Open`.

## Next steps, in order

1. **Merge PR #3** (clean, docs only) or comment why not.
2. **Wire the self-hosted fonts.** In `index.html` replace the two `preconnect` tags and
   the Google Fonts stylesheet link with a preload of `bodoni-moda-latin.woff2` and
   `karla-latin.woff2` plus `<link rel="stylesheet" href="/fonts/fonts.css">`. Exact
   lines are in `public/fonts/README.md`. Note `site-spec.md` says the `@font-face`
   rules live in `styles.css`; either import `fonts.css` from there or update the spec
   line. Mantis reports `metrics.fontsLoaded`, so a report from the running app confirms it.
3. **Self-host the plan page's three faces** the same way (Caveat 500/600, Fraunces
   opsz 9–144 wght 600, Public Sans 400/500) and switch `plan/index.html` to them.
   Then `npm run build && npm run preview` with the network off.
4. **Create the Vercel project**: Add New → Project → import the repo; framework
   auto-detects Vite; no env vars. Put the production URL in `docs/stack-and-keys.md`.
5. **Walk the Milestone 1 checklist in a real browser** and tick each row in
   `docs/site-spec.md`. File anything broken through Mantis so it lands in `docs/inbox/`.
6. **Consolidate research into the repo.** The artifacts above are the only copy of a
   lot of thinking. A `docs/research/` folder with a markdown version of each, dated
   inside, would close the loop `docs/session-artifacts.md` asks for. `_archive/` is
   git-ignored and local to the owner's machine, so do not rely on it existing.
7. **Milestone 2 starts with capture**, not code: run `docs/capture-protocol.md` on
   Apt D and write a measured `floorplan.json`.

## Questions only the owner or Dilene can answer

- What phone does Dilene carry? iPhone 11+ means free on-device splat processing.
- Does her brokerage already supply a photographer or a 360° camera?
- Would she shoot listings herself, every time? Ask her to do one house first.
- What exact virtual-staging disclosure wording does her MLS board require?
- Does she want `noindex` lifted and a real domain, and who holds DNS for
  `dilenerealtydfw.com` (the footer names True Digital Marketing)?
- Empty rooms permanently, or Meshy furniture in Milestone 2? (the open tension above)

## Working conventions for any AI on this repo

- Read `docs/README.md` first; then `CLAUDE.md`, which applies to any agent, not only Claude.
- Work on a branch and open a pull request; keep `main` deployable. Claude sessions use
  `claude/<topic>` branch names; use whatever prefix your tooling expects.
- Before finishing: `npm run check` and `npm run build` must pass; if a plan changed,
  `npm run plan` it and look at the SVG.
- Never invent a fact about Dilene, a listing, a price or a review. Public facts go in
  `data/brand.json` only.
- No new dependency without a line in `docs/stack-and-keys.md` saying why.
- Never commit keys, capture originals, or photos over 2 MB. `.env.local` is ignored.
- Keep the brass notice bar, both TREC links and `noindex` until Dilene says otherwise.
- The three font families and their OFL licence files must ship together.
- End a session that decided something with a dated, titled record: an artifact if you
  are a Claude session, otherwise a dated markdown note under `docs/`.
