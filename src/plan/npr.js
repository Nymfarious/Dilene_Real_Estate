/**
 * npr.js — floorplan.json → stylized SVG ("ink and wash" floor plan).
 *
 * Plain ES module on purpose: the same file is imported by the Vite app
 * (plan/ viewer) and by tools/plan-render/render.mjs under Node, with no
 * build step in between. Geometry conventions follow docs/drafting-standards.md.
 *
 * @typedef {import("../types/floorplan").Floorplan} Floorplan
 * @typedef {import("../types/floorplan").Level} Level
 * @typedef {import("../types/floorplan").Wall} Wall
 * @typedef {import("../types/floorplan").Opening} Opening
 * @typedef {import("../types/floorplan").Space} Space
 * @typedef {import("../types/floorplan").Fixture} Fixture
 * @typedef {[number, number]} Pt
 */

/** @typedef {{ scale?: number, margin?: number, level?: string, seed?: number, fonts?: boolean, background?: boolean }} RenderOptions */

const INK = "#241F1B";
const INK_SOFT = "#4A423B";
const PAPER = "#F5EFE3";
const GRID = "#D9CFBE";

/** Wash colour per space kind — pale, so ink stays dominant. */
const WASH = {
  entry: "#D8D3C8", hall: "#D8D3C8",
  living: "#EBD9B4", dining: "#EBD9B4",
  kitchen: "#CFDCC4",
  bedroom: "#CDD6E0", office: "#CDD6E0",
  bath: "#BFDAD6", laundry: "#BFDAD6",
  closet: "#E3DCCF",
  garage: "#D6D0C4", porch: "#E4DDCB", patio: "#E4DDCB",
  other: "#E0DACD",
};

const D = { wallThickness: 0.375, exteriorThickness: 0.5, ceiling: 8 };

/* ----------------------------- tiny geometry ----------------------------- */

/** @param {Wall} w */
function thickness(w) { return w.thickness ?? (w.exterior ? D.exteriorThickness : D.wallThickness); }
/** @param {Wall} w */
function dir(w) {
  const dx = w.to[0] - w.from[0], dy = w.to[1] - w.from[1];
  const len = Math.hypot(dx, dy) || 1;
  return { ux: dx / len, uy: dy / len, len };
}
/** @param {Pt[]} poly */
function area(poly) {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i], [x2, y2] = poly[(i + 1) % poly.length];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a) / 2;
}
/** @param {Pt[]} poly @returns {Pt} */
function centroid(poly) {
  let cx = 0, cy = 0, a = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i], [x2, y2] = poly[(i + 1) % poly.length];
    const f = x1 * y2 - x2 * y1;
    a += f; cx += (x1 + x2) * f; cy += (y1 + y2) * f;
  }
  if (Math.abs(a) < 1e-9) return poly[0];
  a *= 0.5;
  return [cx / (6 * a), cy / (6 * a)];
}
/** @param {Pt[]} pts */
function bbox(pts) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of pts) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
  return { minX, minY, maxX, maxY };
}
function fmtFt(ft) {
  const whole = Math.floor(ft + 1e-9);
  const inches = Math.round((ft - whole) * 12);
  if (inches === 12) return `${whole + 1}'`;
  return inches ? `${whole}'-${inches}"` : `${whole}'`;
}
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); }
const r2 = (n) => Math.round(n * 100) / 100;

/* -------------------------------- render -------------------------------- */

/**
 * @param {Floorplan} plan
 * @param {RenderOptions} [opts]
 * @returns {string} SVG markup
 */
export function renderFloorplanSVG(plan, opts = {}) {
  const S = opts.scale ?? 22;           // px per foot
  const M = opts.margin ?? 96;          // px outside the plan for dims and blocks
  const seed = opts.seed ?? 3;
  const level = plan.levels.find((l) => l.id === opts.level) ?? plan.levels[0];
  const useFonts = opts.fonts ?? true;

  const pts = [];
  for (const w of level.walls) pts.push(w.from, w.to);
  for (const s of level.spaces) pts.push(...s.polygon);
  const B = bbox(pts);
  const planW = B.maxX - B.minX, planH = B.maxY - B.minY;
  const W = Math.round(planW * S + M * 2);
  const H = Math.round(planH * S + M * 2 + 70); // extra room for the title block

  /** plan → svg (Y flipped) @param {number} x @param {number} y */
  const P = (x, y) => [r2(M + (x - B.minX) * S), r2(M + (B.maxY - y) * S)];
  const pt = (x, y) => P(x, y).join(",");

  const out = [];
  const push = (s) => out.push(s);

  /* ----- defs: paper grain, hand-drawn wobble, wash bleed, hatch ----- */
  push(`<defs>
  <filter id="wobble" x="-5%" y="-5%" width="110%" height="110%">
    <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="${seed}" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="2.4" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <filter id="wobble-soft" x="-5%" y="-5%" width="110%" height="110%">
    <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="${seed + 5}" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <filter id="bleed" x="-10%" y="-10%" width="120%" height="120%">
    <feGaussianBlur stdDeviation="${(S * 0.16).toFixed(2)}"/>
  </filter>
  <filter id="grain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="${seed + 11}" stitchTiles="stitch" result="g"/>
    <feColorMatrix in="g" type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.30  0 0 0 0 0.24  0 0 0 0.09 0"/>
  </filter>
  <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <line x1="0" y1="0" x2="0" y2="6" stroke="${INK_SOFT}" stroke-width="0.6" opacity="0.55"/>
  </pattern>
</defs>`);

  /* ----- paper ----- */
  if (opts.background ?? true) {
    push(`<rect width="${W}" height="${H}" fill="${PAPER}"/>`);
    // faint drafting grid, 1 ft
    const g = [];
    for (let x = 0; x <= planW; x++) g.push(`M${pt(B.minX + x, B.minY)}L${pt(B.minX + x, B.maxY)}`);
    for (let y = 0; y <= planH; y++) g.push(`M${pt(B.minX, B.minY + y)}L${pt(B.maxX, B.minY + y)}`);
    push(`<path d="${g.join("")}" stroke="${GRID}" stroke-width="0.5" fill="none" opacity="0.55"/>`);
  }

  /* ----- space washes (two passes: bleed halo, then flat) ----- */
  push(`<g id="wash">`);
  for (const s of level.spaces) {
    const poly = s.polygon.map(([x, y]) => pt(x, y)).join(" ");
    const c = WASH[s.kind] ?? WASH.other;
    push(`<polygon points="${poly}" fill="${c}" opacity="0.55" filter="url(#bleed)"/>`);
    push(`<polygon points="${poly}" fill="${c}" opacity="0.5" filter="url(#wobble-soft)"/>`);
  }
  push(`</g>`);

  /* ----- fixtures (under the walls so wall poché always wins) ----- */
  push(`<g id="fixtures" filter="url(#wobble-soft)" stroke="${INK_SOFT}" stroke-width="1.1" fill="none" stroke-linejoin="round" stroke-linecap="round">`);
  for (const f of level.fixtures ?? []) push(fixtureGlyph(f, P, S));
  push(`</g>`);

  /* ----- walls: poché ----- */
  push(`<g id="walls" filter="url(#wobble)">`);
  for (const w of level.walls) {
    const t = thickness(w), { ux, uy, len } = dir(w);
    const nx = -uy, ny = ux, h = t / 2;
    // extend ends by half thickness so corners close
    const ax = w.from[0] - ux * h, ay = w.from[1] - uy * h;
    const bx = w.to[0] + ux * h, by = w.to[1] + uy * h;
    const poly = [
      pt(ax + nx * h, ay + ny * h), pt(bx + nx * h, by + ny * h),
      pt(bx - nx * h, by - ny * h), pt(ax - nx * h, ay - ny * h),
    ].join(" ");
    push(`<polygon points="${poly}" fill="${INK}" stroke="${INK}" stroke-width="0.8" stroke-linejoin="round" data-wall="${esc(w.id)}" data-len="${r2(len)}"/>`);
  }
  push(`</g>`);

  /* ----- openings: cut the gap, then draw the symbol ----- */
  push(`<g id="openings" filter="url(#wobble)" stroke="${INK}" fill="none" stroke-linecap="round" stroke-linejoin="round">`);
  const wallsById = new Map(level.walls.map((w) => [w.id, w]));
  for (const o of level.openings ?? []) {
    const w = wallsById.get(o.wall);
    if (!w) continue;
    push(openingGlyph(o, w, P, S));
  }
  push(`</g>`);

  /* ----- labels ----- */
  const labelFont = useFonts ? `'Caveat','Patrick Hand','Segoe Print','Bradley Hand',cursive` : `'Segoe Print','Bradley Hand',cursive`;
  const capsFont = `'Public Sans','Helvetica Neue',Arial,sans-serif`;
  push(`<g id="labels" fill="${INK}" text-anchor="middle">`);
  for (const s of level.spaces) {
    const [cx, cy] = centroid(s.polygon);
    const [sx, sy] = P(cx, cy);
    const bb = bbox(s.polygon);
    const sqft = Math.round(area(s.polygon));
    const dims = `${fmtFt(bb.maxX - bb.minX)} × ${fmtFt(bb.maxY - bb.minY)}`;
    const small = (bb.maxX - bb.minX) * S < 70 || (bb.maxY - bb.minY) * S < 60;
    const nameSize = small ? 12 : 17;
    push(`<text x="${sx}" y="${sy - (small ? 2 : 4)}" font-family="${labelFont}" font-size="${nameSize}" font-weight="600">${esc(s.name)}</text>`);
    if (!small) {
      push(`<text x="${sx}" y="${sy + 13}" font-family="${capsFont}" font-size="8.5" letter-spacing="0.08em" fill="${INK_SOFT}">${esc(dims)}  ·  ${sqft} SQ FT</text>`);
    }
  }
  push(`</g>`);

  /* ----- overall dimension strings (bottom and left) ----- */
  push(`<g id="dims" stroke="${INK_SOFT}" stroke-width="0.9" fill="${INK_SOFT}" font-family="${capsFont}" font-size="9.5" letter-spacing="0.06em">`);
  {
    const off = S * 1.6; // distance outside the envelope
    // bottom (width)
    const y = M + planH * S + off;
    const [x1] = P(B.minX, 0), [x2] = P(B.maxX, 0);
    push(dimString(x1, y, x2, y, fmtFt(planW), false));
    // left (depth)
    const x = M - off;
    const [, y1] = P(0, B.maxY), [, y2] = P(0, B.minY);
    push(dimString(x, y1, x, y2, fmtFt(planH), true));
  }
  push(`</g>`);

  /* ----- north arrow, scale bar ----- */
  {
    const nx = W - M * 0.55, ny = M * 0.55, r = 15;
    const rot = plan.meta.north ?? 0;
    push(`<g transform="translate(${nx} ${ny}) rotate(${-rot})" stroke="${INK}" fill="none" stroke-width="1.1" filter="url(#wobble-soft)">
  <circle r="${r}"/>
  <path d="M0,${-r + 3} L${r * 0.42},${r * 0.55} L0,${r * 0.2} L${-r * 0.42},${r * 0.55} Z" fill="${INK}"/>
  <text y="${-r - 5}" text-anchor="middle" font-family="${capsFont}" font-size="9" fill="${INK}" stroke="none" letter-spacing="0.1em">N</text>
</g>`);
    const sx = M, sy = H - 26, ft = 10, px = ft * S;
    push(`<g stroke="${INK}" fill="${INK}" font-family="${capsFont}" font-size="8.5" letter-spacing="0.06em" filter="url(#wobble-soft)">
  <line x1="${sx}" y1="${sy}" x2="${sx + px}" y2="${sy}" stroke-width="1"/>
  ${[0, 5, 10].map((f) => `<line x1="${sx + f * S}" y1="${sy - 4}" x2="${sx + f * S}" y2="${sy + 4}" stroke-width="1"/><text x="${sx + f * S}" y="${sy + 15}" text-anchor="middle" stroke="none">${f}</text>`).join("")}
  <text x="${sx + px + 8}" y="${sy + 3}" stroke="none">FT</text>
</g>`);
  }

  /* ----- title block ----- */
  {
    const tx = W - M, ty = H - 58;
    const line = `${esc(level.name)}  ·  ${plan.meta.units.toUpperCase()}  ·  ${esc(plan.meta.confidence)}${plan.meta.captured ? "  ·  " + esc(plan.meta.captured) : ""}`;
    push(`<g text-anchor="end" fill="${INK}">
  <line x1="${tx - 260}" y1="${ty - 20}" x2="${tx}" y2="${ty - 20}" stroke="${INK}" stroke-width="1" filter="url(#wobble-soft)"/>
  <text x="${tx}" y="${ty}" font-family="'Fraunces',Georgia,serif" font-size="19" font-weight="600">${esc(plan.meta.title)}</text>
  ${plan.meta.subtitle ? `<text x="${tx}" y="${ty + 15}" font-family="${labelFont}" font-size="12.5" fill="${INK_SOFT}">${esc(plan.meta.subtitle)}</text>` : ""}
  <text x="${tx}" y="${ty + 30}" font-family="${capsFont}" font-size="8" letter-spacing="0.12em" fill="${INK_SOFT}">${line.toUpperCase()}</text>
  <text x="${tx}" y="${ty + 42}" font-family="${capsFont}" font-size="7.5" letter-spacing="0.1em" fill="${INK_SOFT}">${plan.meta.confidence === "surveyed" ? "" : "ROUGH SKETCH — NOT FOR CONSTRUCTION"}</text>
</g>`);
  }

  /* ----- paper grain on top ----- */
  if (opts.background ?? true) push(`<rect width="${W}" height="${H}" filter="url(#grain)" style="mix-blend-mode:multiply" pointer-events="none"/>`);

  const fontLink = useFonts
    ? `<style>@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500;600&amp;family=Fraunces:opsz,wght@9..144,600&amp;family=Public+Sans:wght@400;500&amp;display=swap');</style>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(plan.meta.title)} floor plan">${fontLink}${out.join("\n")}</svg>`;
}

/* ------------------------------ glyph makers ----------------------------- */

function dimString(x1, y1, x2, y2, label, vertical) {
  const t = 5; // tick half-length
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const ticks = vertical
    ? `M${x1 - t},${y1 + t}L${x1 + t},${y1 - t} M${x2 - t},${y2 + t}L${x2 + t},${y2 - t}`
    : `M${x1 - t},${y1 + t}L${x1 + t},${y1 - t} M${x2 - t},${y2 + t}L${x2 + t},${y2 - t}`;
  const text = vertical
    ? `<text x="${mx - 6}" y="${my}" text-anchor="middle" transform="rotate(-90 ${mx - 6} ${my})" stroke="none">${esc(label)}</text>`
    : `<text x="${mx}" y="${my + 13}" text-anchor="middle" stroke="none">${esc(label)}</text>`;
  return `<g filter="url(#wobble-soft)"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><path d="${ticks}" stroke-width="1.1"/>${text}</g>`;
}

/**
 * @param {Opening} o @param {Wall} w
 * @param {(x:number,y:number)=>number[]} P @param {number} S
 */
function openingGlyph(o, w, P, S) {
  const t = thickness(w), { ux, uy } = dir(w);
  const nx = -uy, ny = ux;                     // left-hand normal
  const a = [w.from[0] + ux * o.at, w.from[1] + uy * o.at];              // near jamb (centerline)
  const b = [a[0] + ux * o.width, a[1] + uy * o.width];                  // far jamb
  const h = t / 2 + 0.02;
  const pt = (x, y) => P(x, y).join(",");
  const gap = [pt(a[0] + nx * h, a[1] + ny * h), pt(b[0] + nx * h, b[1] + ny * h), pt(b[0] - nx * h, b[1] - ny * h), pt(a[0] - nx * h, a[1] - ny * h)].join(" ");
  const parts = [`<polygon points="${gap}" fill="${PAPER}" stroke="none"/>`];
  const face = (side) => `M${pt(a[0] + nx * h * side, a[1] + ny * h * side)}L${pt(b[0] + nx * h * side, b[1] + ny * h * side)}`;

  switch (o.type) {
    case "window": {
      parts.push(`<path d="${face(1)}${face(-1)}" stroke-width="1"/>`);
      parts.push(`<path d="M${pt(a[0], a[1])}L${pt(b[0], b[1])}" stroke-width="0.7"/>`);
      // jamb lines
      parts.push(`<path d="M${pt(a[0] + nx * h, a[1] + ny * h)}L${pt(a[0] - nx * h, a[1] - ny * h)}M${pt(b[0] + nx * h, b[1] + ny * h)}L${pt(b[0] - nx * h, b[1] - ny * h)}" stroke-width="1"/>`);
      break;
    }
    case "cased": {
      parts.push(`<path d="M${pt(a[0], a[1])}L${pt(b[0], b[1])}" stroke-width="0.8" stroke-dasharray="${S * 0.25} ${S * 0.18}"/>`);
      break;
    }
    case "slider": {
      const q = o.width / 2;
      parts.push(`<path d="M${pt(a[0] + nx * 0.06, a[1] + ny * 0.06)}L${pt(a[0] + ux * q * 1.1 + nx * 0.06, a[1] + uy * q * 1.1 + ny * 0.06)}" stroke-width="1.1"/>`);
      parts.push(`<path d="M${pt(b[0] - ux * q * 1.1 - nx * 0.06, b[1] - uy * q * 1.1 - ny * 0.06)}L${pt(b[0] - nx * 0.06, b[1] - ny * 0.06)}" stroke-width="1.1"/>`);
      break;
    }
    case "bifold": {
      const q = o.width / 4, side = 1;
      const d = `M${pt(a[0], a[1])}L${pt(a[0] + ux * q + nx * q * side, a[1] + uy * q + ny * q * side)}L${pt(a[0] + ux * 2 * q, a[1] + uy * 2 * q)}L${pt(a[0] + ux * 3 * q + nx * q * side, a[1] + uy * 3 * q + ny * q * side)}L${pt(b[0], b[1])}`;
      parts.push(`<path d="${d}" stroke-width="1"/>`);
      break;
    }
    case "pocket": {
      parts.push(`<path d="M${pt(a[0], a[1])}L${pt(b[0], b[1])}" stroke-width="0.9" stroke-dasharray="${S * 0.5} ${S * 0.15}"/>`);
      break;
    }
    case "door":
    default: {
      const swing = o.swing ?? "in-left";
      const side = swing.startsWith("out") ? -1 : 1;             // +1 = wall's left side
      const hingeFar = swing.endsWith("right");
      const hinge = hingeFar ? b : a;
      const jamb = hingeFar ? a : b;
      const leafEnd = [hinge[0] + nx * o.width * side, hinge[1] + ny * o.width * side];
      // arc from leafEnd to jamb around hinge, as a polyline (no sweep-flag headaches under Y-flip)
      const a0 = Math.atan2(leafEnd[1] - hinge[1], leafEnd[0] - hinge[0]);
      const a1 = Math.atan2(jamb[1] - hinge[1], jamb[0] - hinge[0]);
      let dA = a1 - a0;
      while (dA > Math.PI) dA -= 2 * Math.PI;
      while (dA < -Math.PI) dA += 2 * Math.PI;
      const N = 14, arc = [];
      for (let i = 0; i <= N; i++) {
        const ang = a0 + (dA * i) / N;
        arc.push(pt(hinge[0] + Math.cos(ang) * o.width, hinge[1] + Math.sin(ang) * o.width));
      }
      parts.push(`<path d="M${pt(hinge[0], hinge[1])}L${pt(leafEnd[0], leafEnd[1])}" stroke-width="1.3"/>`);
      parts.push(`<path d="M${arc.join("L")}" stroke-width="0.7" stroke-dasharray="1.5 2.2"/>`);
      break;
    }
  }
  return `<g data-opening="${esc(o.id)}">${parts.join("")}</g>`;
}

/**
 * @param {Fixture} f @param {(x:number,y:number)=>number[]} P @param {number} S
 */
function fixtureGlyph(f, P, S) {
  const [cx, cy] = f.at, [w, d] = f.size;
  const [sx, sy] = P(cx, cy);
  const pw = w * S, pd = d * S;
  const rot = -(f.rotation ?? 0); // plan CCW → screen (Y-flipped) CW
  const g = (inner, extra = "") => `<g transform="translate(${sx} ${sy}) rotate(${rot})" data-fixture="${esc(f.id)}" ${extra}>${inner}</g>`;
  const box = (rx = 3) => `<rect x="${-pw / 2}" y="${-pd / 2}" width="${pw}" height="${pd}" rx="${rx}"/>`;
  const hx = pw / 2, hy = pd / 2;

  switch (f.type) {
    case "sofa":
      return g(`${box(5)}<line x1="${-hx}" y1="${-hy + pd * 0.3}" x2="${hx}" y2="${-hy + pd * 0.3}"/><line x1="${-hx + pw / 3}" y1="${-hy + pd * 0.3}" x2="${-hx + pw / 3}" y2="${hy}"/><line x1="${hx - pw / 3}" y1="${-hy + pd * 0.3}" x2="${hx - pw / 3}" y2="${hy}"/>`);
    case "bed-queen": case "bed-king": case "bed-twin": {
      const pillowW = pw * (f.type === "bed-twin" ? 0.7 : 0.38), pillowH = pd * 0.14;
      const pillows = f.type === "bed-twin"
        ? `<rect x="${-pillowW / 2}" y="${-hy + 4}" width="${pillowW}" height="${pillowH}" rx="3"/>`
        : `<rect x="${-hx + 5}" y="${-hy + 4}" width="${pillowW}" height="${pillowH}" rx="3"/><rect x="${hx - 5 - pillowW}" y="${-hy + 4}" width="${pillowW}" height="${pillowH}" rx="3"/>`;
      return g(`${box(2)}<line x1="${-hx}" y1="${-hy + pd * 0.24}" x2="${hx}" y2="${-hy + pd * 0.24}"/>${pillows}<path d="M${-hx},${-hy + pd * 0.24} Q${-hx + 10},${-hy + pd * 0.5} ${-hx},${hy}" stroke-width="0.7"/>`);
    }
    case "kitchen-run":
      return g(`${box(1)}<rect x="${-hx}" y="${-hy}" width="${pw}" height="${pd}" fill="url(#hatch)" stroke="none"/><circle cx="${hx - pw * 0.28}" cy="0" r="${Math.min(pw, pd) * 0.18}" fill="${PAPER}"/><rect x="${hx - pw * 0.28 - pd * 0.28}" y="${-pd * 0.25}" width="${pd * 0.56}" height="${pd * 0.5}" rx="2" fill="${PAPER}"/>`);
    case "range":
      return g(`${box(1)}${[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([i, j]) => `<circle cx="${i * pw * 0.22}" cy="${j * pd * 0.22}" r="${pw * 0.12}"/>`).join("")}`);
    case "fridge":
      return g(`${box(1)}<line x1="${-hx}" y1="${-hy + pd * 0.35}" x2="${hx}" y2="${-hy + pd * 0.35}"/>`);
    case "toilet":
      return g(`<rect x="${-hx}" y="${-hy}" width="${pw}" height="${pd * 0.32}" rx="2"/><ellipse cx="0" cy="${pd * 0.2}" rx="${pw * 0.42}" ry="${pd * 0.3}"/>`);
    case "vanity":
      return g(`${box(1)}<circle cx="0" cy="0" r="${Math.min(pw, pd) * 0.28}"/>`);
    case "tub":
      return g(`${box(4)}<rect x="${-hx + 5}" y="${-hy + 5}" width="${pw - 10}" height="${pd - 10}" rx="${Math.min(pw, pd) * 0.3}"/>`);
    case "shower":
      return g(`${box(1)}<line x1="${-hx}" y1="${-hy}" x2="${hx}" y2="${hy}" stroke-width="0.6"/><line x1="${hx}" y1="${-hy}" x2="${-hx}" y2="${hy}" stroke-width="0.6"/>`);
    case "closet-rod":
      return g(`<line x1="${-hx}" y1="0" x2="${hx}" y2="0" stroke-dasharray="4 3"/><rect x="${-hx}" y="${-hy}" width="${pw}" height="${pd}" rx="2" stroke-dasharray="2 2" stroke-width="0.7"/>`);
    case "tv":
      return g(`${box(1)}<rect x="${-hx}" y="${-hy}" width="${pw}" height="${pd}" fill="${INK_SOFT}" opacity="0.5" stroke="none"/>`);
    case "table":
      return g(`${box(3)}<rect x="${-hx + 4}" y="${-hy + 4}" width="${pw - 8}" height="${pd - 8}" rx="2" stroke-width="0.6" stroke-dasharray="2 2"/>`);
    case "desk": case "dresser": case "island":
      return g(`${box(2)}<line x1="${-hx}" y1="${-hy + pd * 0.5}" x2="${hx}" y2="${-hy + pd * 0.5}" stroke-width="0.6"/>`);
    case "chair":
      return g(`<rect x="${-hx}" y="${-hy}" width="${pw}" height="${pd}" rx="${Math.min(pw, pd) * 0.4}"/>`);
    case "plant":
      return g(`<circle r="${Math.min(pw, pd) / 2}"/><circle r="${Math.min(pw, pd) / 4}" stroke-width="0.6"/>`);
    default:
      return g(`${box(2)}${f.label ? `<text y="3" text-anchor="middle" font-size="7" fill="${INK_SOFT}" stroke="none">${esc(f.label)}</text>` : ""}`);
  }
}
