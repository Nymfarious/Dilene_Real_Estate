/**
 * house.ts — builds a Three.js group from a floorplan.json level.
 *
 * World units are feet. Plan (x, y, h) → world (x, h, -y): plan north is -Z.
 * Everything here is procedural placeholder geometry; fixtures with an
 * `asset` reference will later be swapped for real models (Meshy, glTF).
 */
import * as THREE from "three";
import {
  type Level, type Wall, type Opening, type Space, type Fixture,
  wallThickness, wallLength, openingHead, openingSill, DEFAULTS,
} from "../types/floorplan";

export const toWorld = (x: number, y: number, h = 0) => new THREE.Vector3(x, h, -y);

const FLOOR_COLORS: Record<string, number> = {
  wood: 0xa9805a, carpet: 0xb8b3a6, tile: 0xd8d3c8, concrete: 0x9a9a9a,
  vinyl: 0xc9c0ae, stone: 0xb5afa3, other: 0xb0aba0,
};

const FIXTURE_COLORS: Partial<Record<Fixture["type"], number>> = {
  sofa: 0x6b5d52, chair: 0x6b5d52, table: 0x8c6e52, desk: 0x8c6e52, dresser: 0x8c6e52,
  "bed-queen": 0xd9d2c5, "bed-king": 0xd9d2c5, "bed-twin": 0xd9d2c5,
  "kitchen-run": 0xe4ded4, island: 0xe4ded4, vanity: 0xe4ded4,
  fridge: 0xc8cacd, range: 0x55585b, dishwasher: 0xc8cacd, sink: 0xd0d0d0,
  toilet: 0xf2f0ea, tub: 0xf2f0ea, shower: 0xdde3e6, washer: 0xe8e8e8, dryer: 0xe8e8e8,
  tv: 0x1e1e1e, fireplace: 0x555049, plant: 0x4f7a4a, "closet-rod": 0x9a8f80, stair: 0xa9805a,
};

export interface HouseBuild {
  group: THREE.Group;
  ceilings: THREE.Mesh[];
  ceilingMaterial: THREE.MeshStandardMaterial;
  spaceLights: THREE.PointLight[];
  bounds: THREE.Box3;
}

export function buildHouse(level: Level): HouseBuild {
  const group = new THREE.Group();
  group.name = `level:${level.id}`;
  const ceiling = level.ceiling ?? DEFAULTS.ceiling;

  const wallMat = new THREE.MeshStandardMaterial({ color: 0xe9e4da, roughness: 0.92, metalness: 0 });
  const extMat = new THREE.MeshStandardMaterial({ color: 0xd9d2c4, roughness: 0.95, metalness: 0 });

  /* ----- walls, split around openings ----- */
  const openingsByWall = new Map<string, Opening[]>();
  for (const o of level.openings ?? []) {
    const list = openingsByWall.get(o.wall) ?? [];
    list.push(o);
    openingsByWall.set(o.wall, list);
  }
  for (const w of level.walls) {
    const pieces = wallPieces(w, openingsByWall.get(w.id) ?? [], w.height ?? ceiling);
    const t = wallThickness(w);
    const len = wallLength(w);
    const ang = Math.atan2(w.to[1] - w.from[1], w.to[0] - w.from[0]);
    const mat = w.exterior ? extMat : wallMat;
    for (const p of pieces) {
      const geo = new THREE.BoxGeometry(p.end - p.start, p.top - p.bottom, t);
      const mesh = new THREE.Mesh(geo, mat);
      const mid = (p.start + p.end) / 2;
      const px = w.from[0] + Math.cos(ang) * mid;
      const py = w.from[1] + Math.sin(ang) * mid;
      mesh.position.copy(toWorld(px, py, (p.top + p.bottom) / 2));
      mesh.rotation.y = ang; // plan angle (CCW, +y north) → world yaw (Y-up, north = -Z)
      mesh.name = `wall:${w.id}`;
      mesh.userData.len = len;
      group.add(mesh);
    }
  }

  /* ----- floors and ceilings per space ----- */
  const ceilingMaterial = new THREE.MeshStandardMaterial({
    color: 0xf1ede4, roughness: 1, transparent: true, opacity: 1, side: THREE.DoubleSide,
  });
  const ceilings: THREE.Mesh[] = [];
  const spaceLights: THREE.PointLight[] = [];
  for (const s of level.spaces) {
    const shape = spaceShape(s);
    const floorGeo = new THREE.ShapeGeometry(shape);
    const floor = new THREE.Mesh(floorGeo, new THREE.MeshStandardMaterial({
      color: FLOOR_COLORS[s.floor ?? "wood"] ?? FLOOR_COLORS.other, roughness: 0.85,
    }));
    floor.rotation.x = -Math.PI / 2;      // XY shape → XZ, plan y → -z
    floor.position.y = 0.01;
    floor.name = `floor:${s.id}`;
    floor.userData.space = s.id;
    group.add(floor);

    const h = s.ceiling ?? ceiling;
    const ceil = new THREE.Mesh(new THREE.ShapeGeometry(shape), ceilingMaterial);
    ceil.rotation.x = -Math.PI / 2;
    ceil.position.y = h - 0.02;
    ceil.name = `ceiling:${s.id}`;
    group.add(ceil);
    ceilings.push(ceil);

    // one warm light per space, hung a foot below the ceiling at the centroid
    const [cx, cy] = centroid(s.polygon);
    const light = new THREE.PointLight(0xffd9a8, s.kind === "closet" ? 6 : 26, 0, 2);
    light.position.copy(toWorld(cx, cy, h - 1));
    light.name = `light:${s.id}`;
    group.add(light);
    spaceLights.push(light);
  }

  /* ----- fixtures (placeholder boxes) ----- */
  for (const f of level.fixtures ?? []) group.add(fixtureMesh(f));

  const bounds = new THREE.Box3().setFromObject(group);
  return { group, ceilings, ceilingMaterial, spaceLights, bounds };
}

/* ------------------------------------------------------------------------ */

interface Piece { start: number; end: number; bottom: number; top: number }

/** Split a wall along its length into solid pieces, leaving holes for openings. */
function wallPieces(w: Wall, openings: Opening[], height: number): Piece[] {
  const len = wallLength(w);
  const t = wallThickness(w);
  const sorted = [...openings].sort((a, b) => a.at - b.at);
  const pieces: Piece[] = [];
  let cursor = -t / 2;                       // extend ends by half thickness so corners close
  for (const o of sorted) {
    const a = Math.max(o.at, 0), b = Math.min(o.at + o.width, len);
    if (b <= a) continue;
    if (a > cursor) pieces.push({ start: cursor, end: a, bottom: 0, top: height });
    const sill = openingSill(o);
    const head = Math.min(openingHead(o, height), height);
    if (sill > 0) pieces.push({ start: a, end: b, bottom: 0, top: sill });
    if (head < height) pieces.push({ start: a, end: b, bottom: head, top: height });
    cursor = b;
  }
  const end = len + t / 2;
  if (end > cursor) pieces.push({ start: cursor, end, bottom: 0, top: height });
  return pieces;
}

function spaceShape(s: Space): THREE.Shape {
  const shape = new THREE.Shape();
  s.polygon.forEach(([x, y], i) => (i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)));
  shape.closePath();
  return shape;
}

function centroid(poly: [number, number][]): [number, number] {
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

function fixtureMesh(f: Fixture): THREE.Object3D {
  const [w, d] = f.size;
  const h = f.height ?? 2.5;
  const color = FIXTURE_COLORS[f.type] ?? 0x9a938a;
  const obj = new THREE.Group();
  obj.name = `fixture:${f.id}`;
  obj.position.copy(toWorld(f.at[0], f.at[1], 0));
  obj.rotation.y = THREE.MathUtils.degToRad(f.rotation ?? 0);

  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
  if (f.type === "closet-rod") {
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, w, 8), mat);
    rod.rotation.z = Math.PI / 2;
    rod.position.y = h - 1.2;
    obj.add(rod);
    return obj;
  }
  if (f.type.startsWith("bed")) {
    const base = new THREE.Mesh(new THREE.BoxGeometry(w, h * 0.7, d), new THREE.MeshStandardMaterial({ color: 0x7a6552, roughness: 0.9 }));
    base.position.y = h * 0.35;
    const mattress = new THREE.Mesh(new THREE.BoxGeometry(w * 0.96, h * 0.4, d * 0.96), mat);
    mattress.position.y = h * 0.7 + h * 0.2;
    const head = new THREE.Mesh(new THREE.BoxGeometry(w, h * 1.9, 0.25), new THREE.MeshStandardMaterial({ color: 0x5b4a3c, roughness: 0.9 }));
    head.position.set(0, h * 0.95, -d / 2 + 0.125); // headboard on the north edge (plan +y → -z)
    obj.add(base, mattress, head);
    return obj;
  }
  if (f.type === "sofa") {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(w, h * 0.55, d), mat);
    seat.position.y = h * 0.275;
    const back = new THREE.Mesh(new THREE.BoxGeometry(w, h, d * 0.3), mat);
    back.position.set(0, h / 2, -d / 2 + d * 0.15);
    obj.add(seat, back);
    return obj;
  }
  if (f.type === "tv") {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(w, w * 0.56, 0.1), mat);
    panel.position.y = h + w * 0.28;
    const stand = new THREE.Mesh(new THREE.BoxGeometry(w * 1.1, h, d), new THREE.MeshStandardMaterial({ color: 0x3a332c }));
    stand.position.y = h / 2;
    obj.add(panel, stand);
    return obj;
  }
  if (f.type === "table" || f.type === "desk") {
    const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, d), mat);
    top.position.y = h;
    obj.add(top);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.15, h, 0.15), mat);
      leg.position.set(sx * (w / 2 - 0.15), h / 2, sz * (d / 2 - 0.15));
      obj.add(leg);
    }
    return obj;
  }
  const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  box.position.y = h / 2;
  obj.add(box);
  return obj;
}
