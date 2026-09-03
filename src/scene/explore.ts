/**
 * explore.ts — free orbit around the house, for when the rails aren't enough.
 *
 * The Tour owns the camera on a scroll path; Explore hands it to the visitor.
 * Drag to swing around the building, wheel or pinch to close in. This is the
 * half of "walk through it" that scrolling can't give you, and it is the same
 * control surface whether the geometry was drafted from a plan or reconstructed
 * from a capture — so both ingest tiers land in one viewer.
 *
 * Feet everywhere, like the rest of the scene. World is (x, h, −y) from plan
 * coordinates, so up is +Y.
 *
 * Two clamps do the safety work: polar angle never reaches the horizon, so the
 * camera cannot drop under the slab and look up through the floor; and radius
 * is bounded by the plan's own footprint, so the house cannot be lost or
 * flown through.
 */
import * as THREE from "three";

const MIN_POLAR = 0.10;                 // almost straight down — the dollhouse read
const MAX_POLAR = Math.PI / 2 - 0.07;   // just above eye level; never below ground
const DAMP = 7;                         // higher is snappier
const DRAG_SPEED = 0.0055;              // radians per pixel
const WHEEL_SPEED = 0.0012;             // fraction of radius per wheel unit

export class Explore {
  readonly camera: THREE.PerspectiveCamera;

  private el: HTMLElement;
  private target = new THREE.Vector3();

  private radius = 60; private wantRadius = 60; private fitted = 60;
  private theta = 0.9; private wantTheta = 0.9;   // azimuth
  private phi = 0.85; private wantPhi = 0.85;     // polar from +Y
  private minRadius = 12; private maxRadius = 240;

  private pointers = new Map<number, { x: number; y: number }>();
  private pinchDist = 0;
  private detach: Array<() => void> = [];
  private reduced = false;

  enabled = false;

  constructor(camera: THREE.PerspectiveCamera, el: HTMLElement, bounds: THREE.Box3) {
    this.camera = camera;
    this.el = el;
    this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.fit(bounds);
    this.bind();
  }

  /** Point the orbit at this box and pick a radius that frames it. */
  fit(bounds: THREE.Box3) {
    const size = bounds.getSize(new THREE.Vector3());
    bounds.getCenter(this.target);
    // Aim a little above the floor so the building sits low in frame, not centred.
    this.target.y = bounds.min.y + size.y * 0.42;

    const span = Math.max(size.x, size.z);
    const fit = span / (2 * Math.tan((this.camera.fov * Math.PI) / 180 / 2));
    this.minRadius = Math.max(6, span * 0.28);
    this.maxRadius = Math.max(fit * 3.2, span * 2.6);
    this.fitted = THREE.MathUtils.clamp(fit * 1.55, this.minRadius, this.maxRadius);
    this.radius = this.wantRadius = this.fitted;
  }

  /**
   * Take over the camera. Starts from wherever the tour left it, so the
   * handover reads as picking the camera up rather than cutting to a new one.
   */
  enable() {
    if (this.enabled) return;
    this.enabled = true;

    const offset = this.camera.position.clone().sub(this.target);
    const r = offset.length();
    if (r > 1e-3) {
      this.radius = THREE.MathUtils.clamp(r, this.minRadius, this.maxRadius);
      this.theta = Math.atan2(offset.x, offset.z);
      this.phi = THREE.MathUtils.clamp(Math.acos(offset.y / r), MIN_POLAR, MAX_POLAR);
    }
    // Keep the visitor's bearing, but ease out to a framing that actually holds
    // the whole building — the tour usually hands over from inside a room, so
    // the inherited radius is far too tight to read as a dollhouse.
    this.wantRadius = Math.max(this.fitted, this.radius);
    this.wantTheta = this.theta;
    this.wantPhi = THREE.MathUtils.clamp(Math.min(this.phi, 0.72), MIN_POLAR, MAX_POLAR);

    if (this.reduced) { this.radius = this.wantRadius; this.phi = this.wantPhi; }
    this.el.style.cursor = "grab";
  }

  disable() {
    this.enabled = false;
    this.pointers.clear();
    this.pinchDist = 0;
    this.el.style.cursor = "";
  }

  /** Call every frame while enabled. */
  update(dt: number) {
    if (!this.enabled) return;
    const a = this.reduced ? 1 : 1 - Math.exp(-DAMP * dt);
    this.radius += (this.wantRadius - this.radius) * a;
    this.theta += (this.wantTheta - this.theta) * a;
    this.phi += (this.wantPhi - this.phi) * a;

    const sinPhi = Math.sin(this.phi);
    this.camera.position.set(
      this.target.x + this.radius * sinPhi * Math.sin(this.theta),
      this.target.y + this.radius * Math.cos(this.phi),
      this.target.z + this.radius * sinPhi * Math.cos(this.theta),
    );
    this.camera.lookAt(this.target);
  }

  dispose() {
    this.detach.forEach((off) => off());
    this.detach = [];
  }

  /* ------------------------------ input ------------------------------ */

  private bind() {
    const on = <K extends keyof HTMLElementEventMap>(
      type: K,
      fn: (e: HTMLElementEventMap[K]) => void,
      opts?: AddEventListenerOptions,
    ) => {
      this.el.addEventListener(type, fn as EventListener, opts);
      this.detach.push(() => this.el.removeEventListener(type, fn as EventListener, opts));
    };

    on("pointerdown", (e) => {
      if (!this.enabled) return;
      this.el.setPointerCapture(e.pointerId);
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.el.style.cursor = "grabbing";
    });

    on("pointermove", (e) => {
      if (!this.enabled) return;
      const prev = this.pointers.get(e.pointerId);
      if (!prev) return;
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (this.pointers.size >= 2) { this.pinch(); return; }

      this.wantTheta -= (e.clientX - prev.x) * DRAG_SPEED;
      this.wantPhi = THREE.MathUtils.clamp(
        this.wantPhi - (e.clientY - prev.y) * DRAG_SPEED,
        MIN_POLAR,
        MAX_POLAR,
      );
    });

    const release = (e: PointerEvent) => {
      this.pointers.delete(e.pointerId);
      if (this.pointers.size < 2) this.pinchDist = 0;
      if (this.enabled) this.el.style.cursor = this.pointers.size ? "grabbing" : "grab";
    };
    on("pointerup", release);
    on("pointercancel", release);
    on("pointerleave", release);

    on(
      "wheel",
      (e) => {
        if (!this.enabled) return;
        e.preventDefault(); // Lenis is stopped in Explore; the wheel is ours
        this.zoom(1 + e.deltaY * WHEEL_SPEED);
      },
      { passive: false },
    );
  }

  private pinch() {
    const [a, b] = [...this.pointers.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (this.pinchDist > 0 && d > 0) this.zoom(this.pinchDist / d);
    this.pinchDist = d;
  }

  private zoom(factor: number) {
    this.wantRadius = THREE.MathUtils.clamp(this.wantRadius * factor, this.minRadius, this.maxRadius);
  }
}
