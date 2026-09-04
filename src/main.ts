/**
 * main.ts — boots the Reveal: floorplan → 3D house, scroll → camera, Docent overlay.
 */
import "./styles.css";
import "./docent/docent.css";
import "./mantis/mantis.css";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

import planJson from "../data/floorplans/sample-apt.json";
import brand from "../data/brand.json";
import type { Floorplan } from "./types/floorplan";
import { createScene, makeLot } from "./scene/createScene";
import { buildHouse } from "./scene/house";
import { CameraRig } from "./scene/cameraRig";
import { Explore } from "./scene/explore";
import { Docent } from "./docent/Docent";
import { Mantis } from "./mantis/Mantis";

gsap.registerPlugin(ScrollTrigger);

const plan = planJson as unknown as Floorplan;
const level = plan.levels[0];
const stops = plan.tour ?? [];

/* ---------------- DOM: brand, scroll track, caption, rail ---------------- */
const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
document.title = `${brand.team} — ${plan.meta.title}`;
$("#brand-team").textContent = brand.team.toUpperCase();
$("#brand-tagline").textContent = brand.tagline;
$("#brand-brokerage").textContent = brand.brokerage;
const phone = $<HTMLAnchorElement>("#brand-phone");
phone.textContent = brand.phone;
phone.href = `tel:${brand.phone.replace(/[^\d+]/g, "")}`;
$("#notice").textContent = brand.notice;

const doc = $("#doc");
stops.forEach((s, i) => {
  const el = document.createElement("section");
  el.className = "stop" + ((s.hold ?? 1) > 1 ? " hold" : "");
  el.dataset.index = String(i);
  el.setAttribute("aria-label", s.title ?? s.space);
  doc.appendChild(el);
});

const rail = $("#rail");
stops.forEach((s, i) => {
  const b = document.createElement("button");
  b.dataset.index = String(i);
  b.setAttribute("aria-label", s.title ?? s.space);
  b.addEventListener("click", () => goTo(i));
  rail.appendChild(b);
});

const caption = $("#caption");
const capEyebrow = $("#cap-eyebrow"), capTitle = $("#cap-title"), capText = $("#cap-text");
function showCaption(i: number) {
  const s = stops[i];
  if (!s) return;
  caption.classList.add("is-hidden");
  window.setTimeout(() => {
    capEyebrow.textContent = `${String(i + 1).padStart(2, "0")} / ${String(stops.length).padStart(2, "0")}`;
    capTitle.textContent = s.title ?? s.space;
    capText.textContent = s.caption ?? "";
    caption.classList.remove("is-hidden");
  }, 180);
  rail.querySelectorAll("button").forEach((b, j) => b.classList.toggle("is-on", j === i));
}

/* ---------------- 3D ---------------- */
const canvas = $<HTMLCanvasElement>("#gl");
const kit = createScene(canvas);
const house = buildHouse(level);
kit.scene.add(house.group);
kit.scene.add(makeLot(house.bounds));

const rig = new CameraRig(plan, kit.camera);
let currentStop = 0;
rig.onStopChange = (i) => { currentStop = i; showCaption(i); docent.setActive(i); };

/* ---------------- scroll ---------------- */
const lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

ScrollTrigger.create({
  trigger: doc,
  start: "top top",
  end: "bottom bottom",
  scrub: true,
  onUpdate: (self) => rig.setProgress(self.progress),
});

function goTo(i: number) {
  if (mode === "explore") exitExplore();
  const p = rig.progressOf(i);
  const max = doc.offsetHeight - window.innerHeight;
  lenis.scrollTo(Math.max(0, Math.min(max, p * max)), { duration: 1.6, easing: (x) => 1 - Math.pow(1 - x, 3) });
}

/* ---------------- Explore: the camera, handed over ---------------- */
const explore = new Explore(kit.camera, canvas, house.bounds);
let mode: "tour" | "explore" = "tour";
const btnExplore = $<HTMLButtonElement>("#btn-explore");

function enterExplore() {
  if (mode === "explore") return;
  mode = "explore";
  lenis.stop();                       // the wheel belongs to the orbit now
  explore.enable();
  document.body.classList.add("is-exploring");
  btnExplore.textContent = "Back to tour";
  btnExplore.setAttribute("aria-pressed", "true");
}

function exitExplore() {
  if (mode !== "explore") return;
  mode = "tour";
  explore.disable();
  lenis.start();
  document.body.classList.remove("is-exploring");
  btnExplore.textContent = "Explore";
  btnExplore.setAttribute("aria-pressed", "false");
  // The rig still holds the scroll position's target, so its own easing
  // walks the camera back onto the rails — no cut.
}

btnExplore.addEventListener("click", () => (mode === "explore" ? exitExplore() : enterExplore()));
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && mode === "explore") exitExplore();
});

/* ---------------- Docent ---------------- */
const docent = new Docent({
  mount: document.body,
  intro: {
    title: "What is this?",
    lines: [
      `A property you can walk through by scrolling. Down moves you forward through the home; up brings you back.`,
      `Every wall, door and window comes from one plan file, so the same file can draw the floor plan on paper and build the rooms here.`,
      `This one is a sample apartment. Yours will be a real listing.`,
    ],
  },
  stops: stops.map((s) => ({ title: s.title ?? s.space, caption: s.caption })),
  onGo: goTo,
  storageKey: `docent:${plan.meta.id}`,
});
$("#btn-tour").addEventListener("click", () => docent.open());
const opened = docent.openUnlessDismissed();
if (!opened) showCaption(0);

/* ---------------- Mantis: report a problem ---------------- */
// Screenshot comes straight off the WebGL canvas: render, then read the
// buffer in the same task before the browser clears it. No getDisplayMedia,
// so no permission prompt and no chance of catching the visitor's other
// windows. Downscaled to 1280 and JPEG-encoded to stay well inside the
// bridge's 5 MB cap — a raw 1440×900 PNG is ~1 MB on its own.
function captureFrame(): string | undefined {
  try {
    kit.renderer.render(kit.scene, kit.camera);
    const src = kit.renderer.domElement;
    const scale = Math.min(1, 1280 / src.width);
    const off = document.createElement("canvas");
    off.width = Math.round(src.width * scale);
    off.height = Math.round(src.height * scale);
    const ctx = off.getContext("2d");
    if (!ctx) return undefined;
    ctx.drawImage(src, 0, 0, off.width, off.height);
    return off.toDataURL("image/jpeg", 0.8);
  } catch {
    return undefined; // tainted canvas or lost context — send the note alone
  }
}

let fps = 0;
new Mantis({
  mount: document.body,
  capture: captureFrame,
  context: () => {
    const gl = kit.renderer.getContext();
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    let meshCount = 0;
    house.group.traverse((o) => { if ((o as THREE.Mesh).isMesh) meshCount++; });
    const stop = stops[currentStop];
    return {
      view: "reveal",
      mode,
      ...(stop ? { tourStop: { index: currentStop, space: stop.space, title: stop.title ?? stop.space } } : {}),
      plan: { id: plan.meta.id, title: plan.meta.title },
      gl: {
        renderer: String(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)),
        vendor: String(dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR)),
        version: String(gl.getParameter(gl.VERSION)),
      },
      viewport: { w: window.innerWidth, h: window.innerHeight, dpr: Math.round(window.devicePixelRatio * 100) / 100 },
      fps: Math.round(fps),
      meshCount,
      fontsLoaded: document.fonts?.check?.('500 16px "Bodoni Moda"') ?? undefined,
      // Whether this visitor was shown the intro card on arrival. Not "is it
      // open now" — Mantis hides itself while the docent is up, so that would
      // always read false and tell us nothing.
      docentShownOnLoad: opened,
    };
  },
});

/* ---------------- render loop ---------------- */
const clock = new THREE.Clock();
let fpsAccum = 0, fpsFrames = 0;
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  // Rolling 1s average, so a Mantis report carries a real number.
  fpsAccum += dt; fpsFrames++;
  if (fpsAccum >= 1) { fps = fpsFrames / fpsAccum; fpsAccum = 0; fpsFrames = 0; }
  if (mode === "explore") explore.update(dt);
  else rig.update(dt);
  // Dollhouse reveal: ceilings fade out as the eye rises above them. Read the
  // height off the camera itself so it works whichever mode is driving.
  const h = level.ceiling ?? 8;
  house.ceilingMaterial.opacity = THREE.MathUtils.clamp((h + 1.5 - kit.camera.position.y) / 2.5, 0, 1);
  house.ceilingMaterial.visible = house.ceilingMaterial.opacity > 0.02;
  kit.renderer.render(kit.scene, kit.camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// After fonts/layout settle, ScrollTrigger needs fresh measurements.
window.addEventListener("load", () => ScrollTrigger.refresh());
