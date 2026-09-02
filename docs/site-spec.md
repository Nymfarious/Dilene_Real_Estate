# Site Spec — For Dilene

Two milestones, one codebase. The first exists to be shown in person before she leaves for the cruise; the second is what she comes back to. Everything in this spec that names a fact about Dilene comes from her public pages and is stored once, in `data/brand.json`.

## Who this is for

**Dilene Allen** — REALTOR®, GRI, MBA, with eXp Realty; runs Dilene Realty Group in the Dallas–Fort Worth metroplex (Dallas, Frisco, Plano, Cedar Hill, Southlake, Highland Park, DeSoto, Little Elm; office in Mesquite). Tagline *Empowering You Through Real Estate*. Five years in, full-service: buying, selling, investing, property management, financing, tax planning.

**What she has today.** Two sites, neither hers to change much:

| Site | Who built it | What it is |
|---|---|---|
| `dileneallen.exprealty.com/agents/302858` | eXp Realty (brokerage platform) | Auto-generated agent page from her profile. Blocks crawlers. |
| `dilenerealtydfw.com` | True Digital Marketing (a vendor, per the footer) | Brochure site: About, Buyers, Sellers, Investors, Consulting, Cash Offers, Contact. Dallas skyline video hero. |

So the instinct was right in spirit and slightly off in detail: the eXp page *is* a brokerage template she fills in; the DFW site is a small agency's build. Either way, she cannot drop a WebGL walkthrough into them. **The gift site is a third thing, on its own URL, that links out to both.** It does not replace anything; it gives her something neither of those platforms can produce.

**What she is used to seeing.** Zillow-style listing pages, brokerage templates, and the "AI slop" tier of agent sites. Anything generic reads to her as one of those within two seconds. The bar for impressing her is *specificity*: it knows her cities, it says her tagline in her voice, it gets the Texas compliance right, and it does one thing the others cannot — you can walk through the house.

## Milestone 1 — The Reveal (show in person, before the cruise)

**Job:** thirty seconds on a laptop that make her lean in. Then ninety seconds she drives herself.

**The sequence she experiences**

1. **The card.** The page opens on the docent's *What is this?* — three sentences, her brand in the corner, the dim house behind. She reads it. No autoplay, no video, nothing moving yet. Quiet is the first tell that this isn't a template.
2. **"Show me the spaces."** The card lists the rooms. She taps one. The card gets out of the way and the camera glides through the doorway into that room, caption fading in at the bottom-left with a line of copy that only fits *that* room.
3. **She scrolls.** Down walks forward, up walks back. She discovers this herself — the hint says so in small caps, but the point is that it feels like control, not a video.
4. **The pull-back.** The last stop lifts the camera through the ceiling. Ceilings fade as the eye rises and the whole apartment is a lit dollhouse on a dark lot. Every realtor knows the dollhouse view from Matterport; this one she can read at a glance because it's the plan.
5. **"Plan."** One tap in the nav opens the same data drawn as an ink-and-wash floor plan — dimension strings, door swings, north arrow, title block. The reveal here is *the same file draws both*.
6. **The footer.** Her name, designations, brokerage, phone, email, office, hours, her cities as chips, links to her two sites and socials, and the two TREC notices with their exact required labels. This is the paragraph a realtor actually reads. Getting it right is the difference between "cute demo" and "this person understands my business."

**Content**
- Property: the sample apartment (or Apt D once measured). Say so out loud when showing it: *"This is my place. Hand me one of your listings and it's yours."* Honesty is part of the pitch.
- Copy: seven captions, ≤ 2 sentences each, no adjectives without a noun to hang on. Written in `data/floorplans/*.json`.
- Brand: `data/brand.json` only. Nothing hand-typed in HTML that could drift.

**Technical**
- Vite + TypeScript + Three.js, Lenis + GSAP ScrollTrigger. Static build; deploys to Vercel with no config.
- Runs offline for the in-person demo: `npm run build && npm run preview`. Self-host the three Google Fonts before the demo so a hotel Wi-Fi hiccup can't strip the typography (`public/fonts/`, `@font-face` in `styles.css`).
- Must hold 60 fps on a laptop integrated GPU: placeholder geometry is ~40 meshes; keep it under 200 until Milestone 2 introduces real assets.
- Mobile: scroll works, docent card fits, rail hidden, caption full-width. Not the demo target but it must not embarrass.
- `noindex` until she says otherwise. The brass notice bar stays: *Concept preview built as a gift.*

**Done when**
- [ ] Docent opens on first visit, dismisses with ✕ / Esc / "Just let me look", re-opens from "Tour", remembers dismissal
- [ ] Every tour stop reached by scroll, by rail dot, by docent list, by ← → keys with the card open
- [ ] Camera never passes through a wall (every stop has its `via` doorways)
- [ ] Pull-back fades ceilings; plan page renders the same file; SVG download works
- [ ] Footer facts match `brand.json`; both TREC links present with exact labels; brokerage named
- [ ] Fonts self-hosted; works with Wi-Fi off
- [ ] Deployed at a Vercel URL she can open on her phone in the car afterward

## Milestone 2 — The Residence (when she's back)

**Job:** a site she could actually send a buyer. Same engine, real data, real assets, real place in the world.

**Additions, in the order they earn their keep**

1. **A real property.** Run the capture protocol on Apt D; write a measured `floorplan.json`; replace the sample. Then trace one of *her* listings from public listing photos as a second plan (`source: "listing"`, attributed). Multi-property means a small index page and `?plan=<id>` routing.
2. **Real furniture and materials.** Meshy-generated assets referenced by `fixture.asset`, loaded as glTF; floor and wall materials from capture photos. This is where the placeholder boxes stop being charming.
3. **The zoom-out.** Her flythrough idea: bay window → room → whole home → lot → neighborhood → the DFW map with her cities lit. Ground truth comes from Cesium World Terrain and Google Photorealistic 3D Tiles streamed into Three.js by `3d-tiles-renderer` (NASA-AMMOS), keyed with a free Cesium ion token. The house sits on real terrain at its real coordinates; the pull-back keeps going. This is the moment no template can copy.
4. **Contact that works.** "Request a private showing" form posting to a serverless function (Vercel) or Formspree; confirmation to her email. Until then, `mailto:` and `tel:` links are honest and fine.
5. **A home for it.** Custom subdomain (e.g. `tour.dilenerealtydfw.com`, if her vendor will add a CNAME) or a new domain. Remove `noindex`. Vercel Web Analytics on.
6. **Compliance for real.** Her *completed* IABS PDF linked with the exact TREC label; brokerage name prominent on every page; if MLS listings are displayed, NTREIS IDX display rules apply — check before showing any listing that isn't hers.
7. **Cinematic layer (optional).** The reference prompt's technique — image-to-video clips scrubbed by scroll — for the exterior approach and the neighborhood, where a real scene is overkill. Higgsfield via MCP, clips 16:9, no audio. Hybrid, not replacement.

**Non-goals for M2:** CRM integration, lead capture funnels, MLS search. Those live in her brokerage tools; this site links to them.

## The Docent (the "what is this?" layer)

Spec in `docs/docent.md`; the code is `src/docent/Docent.ts`; the agent that owns it is `.claude/agents/docent.md`. The short version: it is a card, not a modal. It explains once, lists the spaces, flies you to one, and gets out of the way. It never blocks scrolling, never autoplays, and never opens again once dismissed unless asked.

## Voice

Short, quiet, specific. Facts and mood. Her tagline appears once in the nav and once in the footer, in the script face, never as a headline. The house does the selling.
