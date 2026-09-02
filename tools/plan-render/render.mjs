#!/usr/bin/env node
// tools/plan-render/render.mjs
// Usage:  node tools/plan-render/render.mjs data/floorplans/sample-apt.json [out/sample-apt.svg] [--scale 22] [--level L1] [--no-fonts]
//
// Renders a floorplan.json to a stylized SVG using the same renderer the
// /plan/ page uses in the browser. PNG export is a separate, optional step
// (see README.md in this folder) so the core tool has zero dependencies.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, basename, resolve } from "node:path";
import { renderFloorplanSVG } from "../../src/plan/npr.js";

const args = process.argv.slice(2);
if (!args[0] || args.includes("--help")) {
  console.error("usage: node tools/plan-render/render.mjs <floorplan.json> [out.svg] [--scale N] [--level ID] [--no-fonts]");
  process.exit(1);
}

const input = resolve(args[0]);
const flag = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const outPath = resolve(args[1] && !args[1].startsWith("--") ? args[1] : `out/${basename(input, ".json")}.svg`);

const plan = JSON.parse(await readFile(input, "utf8"));
const svg = renderFloorplanSVG(plan, {
  scale: flag("--scale") ? Number(flag("--scale")) : undefined,
  level: flag("--level"),
  fonts: !args.includes("--no-fonts"),
});

await mkdir(dirname(outPath), { recursive: true });
await writeFile(outPath, svg, "utf8");
console.log(`wrote ${outPath} (${(svg.length / 1024).toFixed(1)} KB)`);
