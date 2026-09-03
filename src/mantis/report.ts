/**
 * report.ts — pure helpers plus delivery. Dependency-free on purpose so the
 * payload shape can be tested without a DOM.
 *
 * Delivery order, first that works wins:
 *   1. POST /__mantis/report        — the dev-server bridge writes docs/inbox/
 *   2. POST config.endpoint         — only when explicitly enabled
 *   3. sessionStorage queue         — always, as the floor
 *
 * The queue is the floor rather than a fallback: a report that reaches
 * neither bridge is still recoverable from the tab until it closes, and the
 * panel can re-send or download it. Matches the Juniper contract's "at most
 * 50 privacy-safe events in sessionStorage".
 */
import type { MantisConfig, MantisEntry } from "./types";

export const QUEUE_KEY = "dilene:mantis:queue";
export const QUEUE_MAX = 50;
const BRIDGE_URL = "/__mantis/report";

/** Up-to-`maxWords` kebab-case slug, ASCII-only. Falls back to "entry". */
export function slugify(text: string, maxWords = 4): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, maxWords)
      .join("-") || "entry"
  );
}

/** `YYYY-MM-DD-HHMM-<slug>.json`, the docs/inbox naming convention. */
export function formatInboxFilename(entry: MantisEntry): string {
  const d = new Date(entry.createdAt);
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
  return `${stamp}-${slugify(entry.note)}.json`;
}

/** The wire payload. Optional fields are omitted rather than sent as null. */
export function buildInboxPayload(entry: MantisEntry): Record<string, unknown> {
  const userAgent = entry.userAgent ?? (typeof navigator !== "undefined" ? navigator.userAgent : "");
  return {
    id: entry.id,
    note: entry.note,
    category: entry.category,
    priority: entry.priority,
    pagePath: entry.pagePath,
    userAgent,
    createdAt: entry.createdAt,
    ...(entry.screenshotDataUrl ? { screenshotDataUrl: entry.screenshotDataUrl } : {}),
    ...(entry.metrics ? { metrics: entry.metrics } : {}),
  };
}

export function newId(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const rand = Math.random().toString(16).slice(2, 6);
  return `mantis-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${rand}`;
}

/* ------------------------------- queue ------------------------------- */

export function readQueue(): MantisEntry[] {
  try {
    const raw = sessionStorage.getItem(QUEUE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as MantisEntry[]) : [];
  } catch {
    return []; // private mode, quota, corrupt value — never throw at the user
  }
}

export function enqueue(entry: MantisEntry): void {
  try {
    const q = readQueue();
    q.push(entry);
    // Keep the newest; drop screenshots from all but the last few so a long
    // session can't blow the ~5 MB sessionStorage budget on images.
    const trimmed = q.slice(-QUEUE_MAX).map((e, i, arr) =>
      i < arr.length - 3 ? { ...e, screenshotDataUrl: undefined } : e,
    );
    sessionStorage.setItem(QUEUE_KEY, JSON.stringify(trimmed));
  } catch {
    /* nothing sensible to do; the report is still in the UI */
  }
}

export function clearQueue(): void {
  try {
    sessionStorage.removeItem(QUEUE_KEY);
  } catch {
    /* ignore */
  }
}

/* ------------------------------ delivery ------------------------------ */

export type DeliveryResult = { ok: boolean; via: "bridge" | "endpoint" | "queue"; detail?: string };

async function post(url: string, body: unknown): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/**
 * Try the bridges, then queue. Always queues, so a later panel can re-send.
 * Never throws — a failed bug report must not become a second bug.
 */
export async function deliver(entry: MantisEntry, config: MantisConfig = {}): Promise<DeliveryResult> {
  const payload = buildInboxPayload(entry);
  enqueue(entry);

  // 1. Dev-server bridge. Only meaningful under `npm run dev`; on a prod
  //    build this 404s fast and we move on.
  if (import.meta.env.DEV) {
    try {
      const res = await post(BRIDGE_URL, payload);
      if (res.ok) {
        const data = (await res.json().catch(() => ({}))) as { filename?: string };
        return { ok: true, via: "bridge", detail: data.filename ?? formatInboxFilename(entry) };
      }
      if (res.status === 413) return { ok: false, via: "queue", detail: "Report too large — try again without the screenshot." };
    } catch {
      /* dev server not reachable; fall through */
    }
  }

  // 2. Approved endpoint, only when switched on. See docs/mantis.md.
  if (config.enabled && config.endpoint) {
    try {
      const res = await post(config.endpoint, payload);
      if (res.ok) return { ok: true, via: "endpoint" };
      return { ok: false, via: "queue", detail: `Endpoint returned ${res.status}.` };
    } catch (err) {
      return { ok: false, via: "queue", detail: err instanceof Error ? err.message : "Network error." };
    }
  }

  return { ok: true, via: "queue" };
}

/** Hand the visitor the JSON when no bridge took it. */
export function downloadEntry(entry: MantisEntry): void {
  const blob = new Blob([JSON.stringify(buildInboxPayload(entry), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = formatInboxFilename(entry);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
