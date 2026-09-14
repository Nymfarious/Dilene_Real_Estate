# Executable phased spec

Status: **recommended implementation plan** — not an owner decision.

This plan converts the current prototypes into the smallest useful operating
product first, then adds the owned-tour differentiators without entangling the
two tracks. Dilene remains the App Owner; Q's publishing workflow is an
acceptance requirement. Prices, service areas, turnaround promises, compliance
copy, lead ownership, and other missing business facts remain `TBD` until an
owner approves them.

## The medium-term decision

Use **Python 3.11+ wherever the work is data, validation, media processing, or
an API**. Keep **TypeScript in the browser** for the existing Vite/Three.js
viewer, scrolling, and accessibility. Rewriting browser rendering in Python
would slow the project down and reduce what can be tested in a real browser.

The product remains two deliberately separate tracks:

1. **Core product:** branded per-listing page, Matterport embed, lead capture,
   and a simple operator workflow. This ships first.
2. **Owned premium track:** photo-turn, panoramas, plan-linked navigation,
   Three.js walkthrough, and the Cesium pull-away. This advances behind a
   feature flag and never blocks the core product.

## Working rules

- Finish and demonstrate each phase before starting the next.
- Every implemented behavior gets an automated test in the same change.
- Raw owner/customer media stays private; only processed publishable assets
  enter `public/`.
- Every public test page stays `noindex` and visibly marked non-live until the
  owners approve publication.
- No invented listing, price, legal, or customer data. Test fixtures are
  visibly fictional or owner-approved.
- A failing required test blocks deployment.

## Proposed project shape

```text
app/                         Python package
  listings/                  schemas, validation, publishing
  media/                     EXIF stripping, image ladders, manifests
  leads/                     validation and delivery adapters
  webmcp/                    read-only tools over approved content
api/                         thin deployable Python endpoints
data/
  listings/                  one approved JSON/YAML file per listing
  brand.json                 existing brand source of truth
public/listings/             processed public media only
src/                         existing TypeScript browser application
tests/
  python/                    pytest unit and integration tests
  browser/                   Playwright accessibility and journey tests
```

Recommended test commands once Phase 0 lands:

```powershell
python -m pytest
npm run check
npm run test:unit
npm run test:e2e
npm run build
```

## Phase 0 — Guardrails and test foundation

**Goal:** make the current repository safe to extend repeatedly.

Implementation:

- Add `pyproject.toml` targeting Python 3.11+ with `pytest`, `ruff`, and typed
  application dependencies only as they become necessary.
- Add Vitest for pure TypeScript behavior and Playwright for the two critical
  browser journeys.
- Define fixture rules: Apt D is owner-approved test media; all missing facts
  remain `TBD`; tests must not send email or write to a production service.
- Add one local command that runs Python, TypeScript, browser, and build gates.
- Preserve the existing sample 3D route and Apt D route as regression fixtures.

Tests delivered with the phase:

- `pytest` smoke test proves the Python package imports.
- TypeScript smoke test covers the photo-scene selection logic.
- Browser test loads `/apt-d/`, changes photo stops, reaches the map handoff,
  and verifies the non-live notice.
- Build test proves both HTML entry points are emitted.

**Done when:** a clean checkout can run one documented verification command and
all tests pass without credentials.

## Phase 1 — One useful Matterport-backed listing page

**Goal:** Q can provide approved listing details plus a Matterport share link,
and the repository produces one branded, mobile-first page Dilene can review.

Implementation:

- Create a Python listing schema and validator.
- Store title, address-display policy, agent contact, disclosure links,
  Matterport URL, publishing state, and approved FAQ content in one listing
  data file.
- Render a branded listing shell with the Matterport tour as the hero.
- Add share, call, email, and request-information actions.
- Use a preview state that is `noindex`; publishing remains a deliberate owner
  action.
- Do not require raw Matterport files for this phase. A permitted public/embed
  share URL is sufficient for the test.

Tests delivered with the phase:

- Schema accepts a valid fixture and rejects missing/unsafe fields.
- Matterport URLs are normalized and an unsupported host is rejected.
- Preview pages contain `noindex`; publishable fixtures omit it only when an
  explicit approved flag is present.
- Browser test verifies responsive layout, keyboard access, embed fallback,
  and truthful `TBD` handling.

**Owner acceptance:** Dilene approves the public page structure; Q can replace
the fixture with a test Matterport link without editing application code.

## Phase 2 — Lead capture and the private owner view

**Goal:** a visitor can send a minimal inquiry and Dilene/Q can review it
without exposing contact data publicly.

Implementation:

- Add a small Python endpoint for name, reply channel, listing ID, consent, and
  optional message.
- Validate and rate-limit submissions; add a honeypot before considering a
  third-party CAPTCHA.
- Store leads behind an adapter so the owners can choose the final destination
  later. Local/test mode uses an isolated test store.
- Add authenticated owner-only list/detail/status views after the owners decide
  who may access them and who owns each lead.
- Keep privacy text and retention period `TBD` until approved.

Tests delivered with the phase:

- Unit tests cover validation, consent, honeypot, duplicate idempotency, and
  status transitions.
- Integration tests use a disposable store and never send real messages.
- Browser test submits a lead, confirms success, and verifies private routes
  reject unauthenticated access.

**Owner acceptance:** Dilene receives and finds a test inquiry; Q can identify
which listing produced it.

## Phase 3 — Q's listing intake and publishing workflow

**Goal:** Q can add or update a listing without touching source code.

Implementation:

- Add a guided private form backed by the Phase 1 schema.
- Provide draft, ready-for-review, approved, published, and archived states.
- Validate the Matterport link and required owner-supplied fields before review.
- Generate a preview URL, then require an explicit approval action to publish.
- Record who changed status and when; do not invent a listing-agent assignment.

Tests delivered with the phase:

- State-machine tests prevent invalid transitions and publishing with `TBD`
  required fields.
- Integration test creates a draft, previews it, approves it, and archives it.
- Browser test covers Q's shortest happy path and recovery from a bad tour URL.

**Owner acceptance:** Q publishes a test listing in a short observed session;
Dilene can approve or reject it.

## Phase 4 — WebMCP over approved listing knowledge

**Goal:** AI systems can answer known questions and perform safe read-only
discovery without scraping the rendered site.

Implementation:

- Expose tools for `list_active_listings`, `get_listing`, `get_listing_faq`,
  `get_tour_link`, and `get_contact_options`.
- Return only approved structured fields from the same listing data used by the
  website.
- Add citations/field provenance in responses so answers can distinguish owner
  input, listing data, and `TBD`.
- Keep lead submission out of the first WebMCP release; add write actions only
  after authentication, consent, abuse, and ownership rules are approved.

Tests delivered with the phase:

- Contract tests validate every tool's input/output schema.
- Grounding tests prove tools cannot invent a price, availability, school,
  compliance claim, or service promise absent from approved data.
- Permission tests prove private leads and drafts never appear in public tools.

**Owner acceptance:** Dilene asks a fixed set of known listing questions and
approves the answers; unknown answers say `TBD` or route to contact.

## Phase 5 — Owned premium tour track

**Goal:** turn the current visual experiments into an owned differentiator
without delaying the Matterport product.

Implementation order:

1. Replace the Apt D adjacent-photo concept with real equirectangular source
   imagery when Q supplies it.
2. Build the Python ingest pipeline: EXIF removal, dimensions/aspect checks,
   image ladder, poster crop, checksums, and manifest.
3. Mount a tested panorama viewer with accessible hotspots.
4. Link panorama stations to plan-space rooms and doorway adjacency.
5. Add the Three.js/Cesium front-door-to-neighborhood pull-away behind a
   feature flag and quota-aware fallback.

Tests delivered with each step:

- Golden-file tests confirm EXIF/GPS removal and deterministic manifest output.
- Invalid or undersized panorama assets fail before publication.
- Graph tests reject missing rooms, broken links, and unreachable tour nodes.
- Browser tests cover hotspot navigation, reduced motion, WebGL fallback, and
  the non-Cesium map fallback.
- Performance budget checks protect mobile load size and interaction latency.

**Owner acceptance:** the owners compare the premium version with the same
listing's Matterport page and decide whether/where it becomes a paid offer.

## Phase 6 — Pilot and release

**Goal:** prove the entire operational loop on one real owner-approved test
listing before offering it broadly.

Implementation:

- Run one listing from intake through review, publishing, inquiry, response,
  archive, and export.
- Complete the owner decisions listed in
  `_INBOX D/For Dilene and Q/HER NOTES - Owner Requirements.md`.
- Complete Texas brokerage/advertising review before removing `noindex`.
- Add monitoring, backups/exports, a rollback procedure, and a short operator
  runbook.

Tests delivered with the phase:

- Staging smoke test covers the full public and private journey.
- Backup/restore drill recreates listing data and lead records in isolation.
- Link checker catches broken tour, disclosure, contact, and share URLs.
- Release checklist records Dilene's approval and Q's workflow sign-off.

**Done when:** Dilene and Q can operate one complete listing without developer
intervention and can export the business-owned data.

## Recommended next execution

Execute **Phase 0, then Phase 1 only**. That produces a tested Matterport-backed
listing link quickly and creates the foundation needed for every later phase.
Do not begin the custom stitcher, Cesium flight, production authentication, or
write-capable WebMCP actions during that push.
