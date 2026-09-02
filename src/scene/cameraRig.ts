/**
 * cameraRig.ts — a scroll-driven camera path through the tour stops.
 *
 * Progress 0..1 (from ScrollTrigger) is mapped onto the stops. Each stop owns
 * a slice of the timeline proportional to its `hold`; inside a slice the
 * camera travels for the first 65% and rests for the last 35%, so every room
 * gets a moment of stillness the visitor can read a caption in.
 *
 * A stop's `via` waypoints are threaded into the path between the previous
 * stop and this one — put one in each doorway and the camera never cuts
 * through a wall. Waypoints look toward the next point on the path.
 */
import * as THREE from "three";
import type { Camera as PlanCamera, Floorplan, TourStop } from "../types/floorplan";
import { toWorld } from "./house";

export interface Keyframe {
  index: number;
  stop: TourStop;
  eye: THREE.Vector3;
  look: THREE.Vector3;
  fov: number;
  /** progress at which this keyframe is fully reached */
  at: number;
  /** index into the point list that backs the curves */
  pointIndex: number;
}

const TRAVEL = 0.65;

export class CameraRig {
  readonly keyframes: Keyframe[] = [];
  readonly camera: THREE.PerspectiveCamera;
  private eyeCurve: THREE.CatmullRomCurve3;
  private lookCurve: THREE.CatmullRomCurve3;
  private pointCount: number;
  private targetEye = new THREE.Vector3();
  private targetLook = new THREE.Vector3();
  private targetFov = 55;
  private currentLook = new THREE.Vector3();
  private progress = 0;
  private starts: number[] = [];   // slice start per keyframe (keyframe 0 has a zero-length slice)
  activeIndex = 0;
  onStopChange?: (index: number) => void;

  constructor(plan: Floorplan, camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    const level = plan.levels[0];
    const spaces = new Map(level.spaces.map((s) => [s.id, s]));
    const stops: TourStop[] = plan.tour ?? level.spaces.filter((s) => s.camera).map((s) => ({ space: s.id, title: s.name }));

    const weights = stops.map((s, i) => (i === 0 ? 0 : (s.hold ?? 1)));
    const total = weights.reduce((a, b) => a + b, 0) || 1;

    // Build the backing point lists: [stop0, via…, stop1, via…, stop2, …]
    const eyes: THREE.Vector3[] = [];
    const looks: THREE.Vector3[] = [];
    let acc = 0;
    stops.forEach((stop, i) => {
      const cam: PlanCamera | undefined = stop.camera ?? spaces.get(stop.space)?.camera;
      if (!cam) throw new Error(`tour stop "${stop.space}" has no camera`);
      const stopEye = toWorld(...cam.eye);
      const stopLook = toWorld(...cam.look);

      const vias = (i === 0 ? [] : stop.via ?? []).map((v) => toWorld(...v));
      vias.forEach((v, j) => {
        eyes.push(v);
        // look where you're going: at the next waypoint, or the stop itself
        const next = vias[j + 1] ?? stopEye;
        const ahead = next.clone().sub(v);
        looks.push(ahead.lengthSq() < 1e-6 ? stopLook.clone() : v.clone().add(ahead.setLength(Math.max(ahead.length(), 6))));
      });

      this.starts.push(acc / total);
      acc += weights[i];
      eyes.push(stopEye);
      looks.push(stopLook);
      this.keyframes.push({
        index: i, stop, eye: stopEye, look: stopLook,
        fov: cam.fov ?? 55, at: acc / total, pointIndex: eyes.length - 1,
      });
    });

    this.pointCount = eyes.length;
    this.eyeCurve = new THREE.CatmullRomCurve3(eyes, false, "centripetal");
    this.lookCurve = new THREE.CatmullRomCurve3(looks, false, "centripetal");

    const k0 = this.keyframes[0];
    this.camera.position.copy(k0.eye);
    this.currentLook.copy(k0.look);
    this.camera.fov = k0.fov;
    this.camera.lookAt(k0.look);
    this.setProgress(0, true);
  }

  /** progress at which the camera rests on stop i (use for scrollTo). */
  progressOf(i: number): number {
    if (i <= 0) return 0;
    const k = this.keyframes[Math.min(i, this.keyframes.length - 1)];
    const s = this.starts[k.index];
    return s + (k.at - s) * TRAVEL + 0.001;
  }

  setProgress(p: number, snap = false) {
    this.progress = THREE.MathUtils.clamp(p, 0, 1);
    const n = this.keyframes.length;
    if (n < 2) return;

    // which slice are we in?
    let i = 1;
    while (i < n - 1 && this.progress > this.keyframes[i].at) i++;
    const k = this.keyframes[i], prev = this.keyframes[i - 1];
    const s = this.starts[i];
    const local = (this.progress - s) / Math.max(k.at - s, 1e-6);
    const u = smooth(THREE.MathUtils.clamp(local / TRAVEL, 0, 1));
    // curve parameter: interpolate between the two stops' point indices (vias sit between them)
    const pi = prev.pointIndex + u * (k.pointIndex - prev.pointIndex);
    const t = pi / (this.pointCount - 1);

    this.eyeCurve.getPoint(t, this.targetEye);
    this.lookCurve.getPoint(t, this.targetLook);
    this.targetFov = THREE.MathUtils.lerp(prev.fov, k.fov, u);

    const active = u >= 0.5 ? i : i - 1;
    if (active !== this.activeIndex) {
      this.activeIndex = active;
      this.onStopChange?.(active);
    }
    if (snap) {
      this.camera.position.copy(this.targetEye);
      this.currentLook.copy(this.targetLook);
      this.camera.fov = this.targetFov;
      this.camera.updateProjectionMatrix();
      this.camera.lookAt(this.currentLook);
    }
  }

  /** Call every frame; eases the camera toward the scroll target so wheel steps don't jolt. */
  update(dt: number) {
    const a = 1 - Math.pow(0.001, dt);       // frame-rate independent lerp (~fast)
    this.camera.position.lerp(this.targetEye, a);
    this.currentLook.lerp(this.targetLook, a);
    const fov = THREE.MathUtils.lerp(this.camera.fov, this.targetFov, a);
    if (Math.abs(fov - this.camera.fov) > 0.01) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }
    this.camera.lookAt(this.currentLook);
  }

  get eyeHeight() { return this.camera.position.y; }
}

function smooth(x: number) { return x * x * (3 - 2 * x); }
