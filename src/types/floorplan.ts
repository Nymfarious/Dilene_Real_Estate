/**
 * TypeScript mirror of schema/floorplan.schema.json (v1).
 * The JSON Schema is canonical; keep this file in step with it.
 *
 * Plan coordinates: feet. X east, Y north, origin at the SW corner of the
 * exterior envelope. Heights are feet above the level's finished floor.
 */

export type Point = [x: number, y: number];
export type Point3 = [x: number, y: number, h: number];

export interface Camera {
  eye: Point3;
  look: Point3;
  fov?: number;
}

export interface Meta {
  id: string;
  title: string;
  subtitle?: string;
  units: "ft";
  north?: number;
  source: "sketch" | "measured" | "scan" | "listing";
  confidence: "rough" | "measured" | "surveyed";
  captured?: string;
  author?: string;
  notes?: string;
  attribution?: string;
}

export interface Wall {
  id: string;
  from: Point;
  to: Point;
  thickness?: number;
  height?: number;
  exterior?: boolean;
}

export type OpeningType = "door" | "window" | "cased" | "slider" | "pocket" | "bifold";
export type Swing = "in-left" | "in-right" | "out-left" | "out-right" | "none";

export interface Opening {
  id: string;
  wall: string;
  type: OpeningType;
  at: number;
  width: number;
  height?: number;
  sill?: number;
  swing?: Swing;
}

export type SpaceKind =
  | "entry" | "living" | "dining" | "kitchen" | "bedroom" | "bath" | "closet"
  | "hall" | "laundry" | "office" | "garage" | "porch" | "patio" | "other";

export type FloorKind = "wood" | "carpet" | "tile" | "concrete" | "vinyl" | "stone" | "other";

export interface Space {
  id: string;
  name: string;
  kind: SpaceKind;
  polygon: Point[];
  floor?: FloorKind;
  ceiling?: number;
  camera?: Camera;
  notes?: string;
  photos?: string[];
}

export type FixtureType =
  | "sofa" | "chair" | "table" | "bed-queen" | "bed-king" | "bed-twin" | "dresser" | "desk"
  | "kitchen-run" | "island" | "fridge" | "range" | "sink" | "dishwasher"
  | "toilet" | "vanity" | "tub" | "shower" | "washer" | "dryer"
  | "closet-rod" | "stair" | "fireplace" | "tv" | "plant" | "other";

export interface Fixture {
  id: string;
  type: FixtureType;
  at: Point;
  size: [w: number, d: number];
  height?: number;
  rotation?: number;
  space?: string;
  asset?: string;
  label?: string;
}

export interface Level {
  id: string;
  name: string;
  elevation?: number;
  ceiling?: number;
  walls: Wall[];
  openings?: Opening[];
  spaces: Space[];
  fixtures?: Fixture[];
}

export interface TourStop {
  space: string;
  title?: string;
  caption?: string;
  camera?: Camera;
  /** Waypoints on the way to this stop — one per doorway keeps the path out of the walls. */
  via?: Point3[];
  hold?: number;
}

export interface Floorplan {
  $schema?: string;
  version: 1;
  meta: Meta;
  levels: Level[];
  tour?: TourStop[];
}

/* ---------- small geometry helpers shared by the 2D and 3D renderers ---------- */

export const DEFAULTS = {
  wallThickness: 0.375,
  exteriorThickness: 0.5,
  ceiling: 8,
  doorHeight: 6.67,
  windowHeight: 6.67,
  windowSill: 3,
} as const;

export function wallLength(w: Wall): number {
  const dx = w.to[0] - w.from[0];
  const dy = w.to[1] - w.from[1];
  return Math.hypot(dx, dy);
}

export function wallThickness(w: Wall): number {
  return w.thickness ?? (w.exterior ? DEFAULTS.exteriorThickness : DEFAULTS.wallThickness);
}

export function openingHead(o: Opening, ceiling: number): number {
  if (o.height != null) return o.height;
  if (o.type === "cased") return ceiling;
  return DEFAULTS.doorHeight;
}

export function openingSill(o: Opening): number {
  if (o.sill != null) return o.sill;
  return o.type === "window" ? DEFAULTS.windowSill : 0;
}

/** Shoelace area, feet². Polygon may be either winding. */
export function polygonArea(poly: Point[]): number {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a) / 2;
}

export function polygonCentroid(poly: Point[]): Point {
  let cx = 0, cy = 0, a = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    const f = x1 * y2 - x2 * y1;
    a += f; cx += (x1 + x2) * f; cy += (y1 + y2) * f;
  }
  if (Math.abs(a) < 1e-9) return poly[0];
  a *= 0.5;
  return [cx / (6 * a), cy / (6 * a)];
}

export function bounds(points: Point[]): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of points) {
    if (x < minX) minX = x; if (y < minY) minY = y;
    if (x > maxX) maxX = x; if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY };
}

export function levelBounds(level: Level) {
  const pts: Point[] = [];
  for (const w of level.walls) pts.push(w.from, w.to);
  for (const s of level.spaces) pts.push(...s.polygon);
  return bounds(pts);
}

/** Feet → "18'-6\"" */
export function fmtFeet(ft: number): string {
  const whole = Math.floor(ft + 1e-9);
  const inches = Math.round((ft - whole) * 12);
  if (inches === 12) return `${whole + 1}'`;
  return inches ? `${whole}'-${inches}"` : `${whole}'`;
}
