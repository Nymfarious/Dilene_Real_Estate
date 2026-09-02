# Dilene Real Estate — notes for AI agents working in this repo

- Read `docs/README.md` before changing anything. The docs are canon; code follows them.
- Feet everywhere. Plan coordinates: X east, Y north, origin SW. World: plan (x, y, h) → (x, h, −y).
- Facts about Dilene live only in `data/brand.json`, all from her public pages. Never invent a fact, a listing, a price, or a review.
- Properties live only in `data/floorplans/<id>.json` and validate against `schema/floorplan.schema.json`.
- `src/plan/npr.js` is plain JS on purpose (shared by the browser page and the Node CLI). Don't convert it to TS.
- The docent overlay is owned by the `docent` agent (`.claude/agents/docent.md`); route docent work there.
- Before finishing: `npm run check` and `npm run build` must pass; if a plan changed, `npm run plan` it and look at the SVG.
- Keep the brass notice bar and the two TREC links. Keep `noindex` until told otherwise.
- No new dependencies without a line in `docs/stack-and-keys.md` saying why.
- Never commit keys, capture photos over 2 MB, or anything from `capture/` originals.
