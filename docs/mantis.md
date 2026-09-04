# Mantis — the report button

A visitor-facing "Report" affordance in the bottom-left corner. Four fields, a
screenshot they can see before sending, and a delivery path that degrades to
something recoverable rather than losing the report.

Ported from the RootsGenie Mini Mantis client. **The payload shape is
deliberately identical**, so one reader parses reports from either app — see
`src/stores/debugMantisStore.ts` and `docs/inbox/README.md` in RootsGenie.
The `metrics` object is the app-specific part; the schema grows additively and
readers tolerate unknown fields.

## What it captures

| Field | Where from |
|---|---|
| `note` `category` `priority` | the visitor |
| `pagePath` `userAgent` `createdAt` | the browser |
| `screenshotDataUrl` | the WebGL canvas — see below |
| `metrics.view` / `.mode` | Reveal or plan; Tour or Explore |
| `metrics.tourStop` | index, space id, title |
| `metrics.gl` | **unmasked** renderer / vendor / version |
| `metrics.fps` | rolling 1-second average |
| `metrics.meshCount` | live mesh count in the house group |
| `metrics.fontsLoaded` | did the self-hosted faces resolve |
| `metrics.viewport` | w / h / dpr |

Three of these turn a vague report into a fixable one. **`gl.renderer`** —
most "it looked wrong" reports are GPU- or driver-specific, and this names the
chip. **`fps`** — `site-spec.md` requires 60fps on an integrated GPU, so a slow
report is a spec violation rather than an opinion. **`meshCount`** — the same
spec caps placeholder geometry at 200 meshes; this measures it instead of
trusting it.

## The screenshot

Taken straight off the WebGL canvas: render, then read the buffer in the same
task before the browser clears it. **Not `getDisplayMedia`.** No permission
prompt, no window picker, and no possibility of capturing the visitor's other
tabs — which matters on a site being handed to someone as a gift.

Downscaled to 1280px and JPEG-encoded at 0.8. A real capture lands around
35 KB, comfortably inside both the 200 KB inline guidance and the bridge's
5 MB cap. The visitor sees the exact image before it sends and can uncheck it.

## Delivery

First that works wins; the queue always runs.

1. **`POST /__mantis/report`** — the dev-server bridge
   (`vite-plugins/mantisInboxBridge.ts`) writes straight into `docs/inbox/`
   using `YYYY-MM-DD-HHMM-<slug>.json`. Dev only; `apply: "serve"` means a
   static build has no such endpoint.
2. **`POST config.endpoint`** — only when explicitly enabled. See below.
3. **`sessionStorage` queue** — always, capped at 50 entries, screenshots
   dropped from all but the last 3. If neither bridge took it, the panel
   offers the JSON as a download.

The bridge **writes files; it does not commit**. `git add docs/inbox/<file>.json`
yourself — silent pushes from a dev tool are a footgun.

## Enabling live delivery

Off by default, matching the Juniper contract. Before switching it on, the
receiving end must provide:

1. A documented HTTPS endpoint and versioned schema.
2. Rate limiting and an auth design suitable for a public static site.
3. Retention and deletion rules.

**n8n is the intended first endpoint** — a webhook node is exactly the shape
this needs, and it makes n8n the delivery and export layer for a queue that
already exists rather than a parallel system.

Then, before the app bundle loads:

```html
<script>
window.DILENE_MANTIS_CONFIG = {
  enabled: true,
  endpoint: "https://approved.example/webhook/mantis"
};
</script>
```

**Never put a secret in that object** — it ships to the browser in plain sight.

## Privacy

This app holds no personal data. Every fact it displays is public and lives in
`data/brand.json`. So the contract is easy to keep and must stay that way: the
only visitor-authored content that leaves the browser is the note they
knowingly typed. No analytics, no fingerprinting, no identifiers beyond a
per-report random id.

## Files

```
src/mantis/types.ts    the contract, matched to RootsGenie
src/mantis/report.ts   pure helpers + delivery; no DOM, so it's testable
src/mantis/Mantis.ts   the button and panel
src/mantis/mantis.css  styling, on the site's own tokens
vite-plugins/mantisInboxBridge.ts
docs/inbox/            where dev-mode reports land
```

The affordance hides itself while the docent card is up
(`body:has(.docent:not([hidden]))`), so it never competes with the first
impression — the canon's rule that quiet is the tell this isn't a template
applies to the bug button too.
