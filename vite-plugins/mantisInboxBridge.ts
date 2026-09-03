// Dev-only Vite plugin: accepts Mantis reports from the running app and
// writes them into `docs/inbox/` so the next Claude Code session reads them
// without a download → drop dance. Ported from RootsGenie's bridge of the
// same name; same endpoint, same filename convention, same 5 MB cap, so a
// reader written for one works on the other.
//
// Wire-up: `mantisInboxBridge()` in vite.config.ts. `apply: "serve"` means
// prod builds are untouched — there is no server in a static deploy.
//
// The bridge writes files. It does not commit: silent pushes from a dev tool
// are a footgun. `git add docs/inbox/<file>.json` yourself.

import type { Plugin } from "vite";
import { promises as fs } from "node:fs";
import path from "node:path";

const MAX_BODY_BYTES = 5 * 1024 * 1024; // generous for an inline screenshot

function safeSlug(input: unknown): string {
  if (typeof input !== "string" || !input.trim()) return "entry";
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 4)
      .join("-") || "entry"
  );
}

function formatStamp(iso: unknown): string {
  const d = typeof iso === "string" ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return formatStamp(new Date().toISOString());
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

export function mantisInboxBridge(): Plugin {
  const inboxDir = path.resolve(process.cwd(), "docs/inbox");

  return {
    name: "dilene:mantis-inbox-bridge",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/__mantis/report", async (req, res) => {
        res.setHeader("Content-Type", "application/json");

        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Allow", "POST");
          res.end(JSON.stringify({ error: "POST only" }));
          return;
        }

        try {
          const chunks: Buffer[] = [];
          let total = 0;
          for await (const chunk of req) {
            const buf = chunk as Buffer;
            total += buf.length;
            if (total > MAX_BODY_BYTES) {
              res.statusCode = 413;
              res.end(JSON.stringify({ error: "Report exceeds 5 MB" }));
              return;
            }
            chunks.push(buf);
          }

          const payload = JSON.parse(Buffer.concat(chunks).toString("utf-8")) as Record<string, unknown>;
          const filename = `${formatStamp(payload?.createdAt)}-${safeSlug(payload?.note)}.json`;

          // Defensive: the resolved target must stay inside docs/inbox.
          const target = path.resolve(inboxDir, filename);
          if (!target.startsWith(inboxDir + path.sep)) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: "Refusing to write outside docs/inbox" }));
            return;
          }

          await fs.mkdir(inboxDir, { recursive: true });
          await fs.writeFile(target, JSON.stringify(payload, null, 2) + "\n", "utf-8");

          server.config.logger.info(`  mantis → docs/inbox/${filename}`);
          res.statusCode = 200;
          res.end(JSON.stringify({ ok: true, filename }));
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err instanceof Error ? err.message : "Write failed" }));
        }
      });
    },
  };
}
