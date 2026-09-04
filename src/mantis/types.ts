/**
 * types.ts — the Mantis report contract, matched to RootsGenie.
 *
 * Field names and value sets are deliberately identical to
 * `src/stores/debugMantisStore.ts` in RootsGenie so one reader can parse
 * reports from either app. `metrics` is the app-specific part: the schema
 * grows additively and readers tolerate unknown fields, so this app puts
 * walkthrough state there instead of tree/board counts.
 *
 * No PII. This app holds none — every fact it displays is public and lives
 * in `data/brand.json` — so the contract is easy to keep. Do not add
 * anything a visitor typed except the note they knowingly wrote.
 */

export type MantisCategory = "bug" | "feature" | "ux" | "spec";
export type MantisPriority = "high" | "med" | "low";

/**
 * App state at report time. This is what turns "the house looked wrong"
 * into something actionable: which stop, which mode, which GPU.
 */
export interface MantisMetrics {
  /** Which page — the Reveal or the plan sheet. */
  view?: "reveal" | "plan";
  /** Camera owner when the report was filed. */
  mode?: "tour" | "explore";
  /** Where the tour was, if it was driving. */
  tourStop?: { index: number; space: string; title: string };
  plan?: { id: string; title: string };
  /** Unmasked WebGL renderer where the browser allows it — the single most
   *  useful field for "it rendered wrong", since most such reports are
   *  driver- or GPU-specific. */
  gl?: { renderer: string; vendor: string; version: string };
  viewport?: { w: number; h: number; dpr: number };
  /** Rolling average over the last second. The spec asks for 60fps on an
   *  integrated GPU, so a slow report is a spec violation, not an opinion. */
  fps?: number;
  /** Placeholder geometry is meant to stay under 200 meshes until M2. */
  meshCount?: number;
  /** The three faces are self-hosted for the offline demo; if they failed,
   *  the page is wrong in a way the visitor can see but not name. */
  fontsLoaded?: boolean;
  /** Was the intro card shown on arrival? (Not a live open/closed flag —
   *  Mantis hides while the docent is up, so live state is always false.) */
  docentShownOnLoad?: boolean;
  /** Anything else the caller wants to attach. */
  [key: string]: unknown;
}

export interface MantisEntry {
  id: string;
  note: string;
  category: MantisCategory;
  priority: MantisPriority;
  pagePath: string;
  userAgent?: string;
  createdAt: string;
  /** Inline JPEG of the canvas at report time. Downscaled and compressed so
   *  it stays well inside the bridge's 5 MB cap. */
  screenshotDataUrl?: string;
  metrics?: MantisMetrics;
}

/**
 * Public runtime config. Mirrors `window.JUNIPER_MANTIS_CONFIG` from the
 * Juniper integration. Never put a secret here — this object ships to the
 * browser in plain sight.
 */
export interface MantisConfig {
  /** Delivery is off unless this is explicitly true. */
  enabled?: boolean;
  /** Approved HTTPS ingestion endpoint (an n8n webhook is the intended
   *  first one). Absent means queue-only. */
  endpoint?: string;
  /** 0..1. Applies to passive events, never to a report a human filed. */
  sampleRate?: number;
}

declare global {
  interface Window {
    DILENE_MANTIS_CONFIG?: MantisConfig;
  }
}
