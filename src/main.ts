/**
 * main.ts — boots the Reveal: floorplan → 3D house, scroll → camera, Docent overlay.
 */
import "./styles.css";
import "./docent/docent.css";
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
import { Docent } from "./docent/Docent";

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
rig.onStopChange = (i) => { showCaption(i); docent.setActive(i); };

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
  const p = rig.progressOf(i);
  const max = doc.offsetHeight - window.innerHeight;
  lenis.scrollTo(Math.max(0, Math.min(max, p * max)), { duration: 1.6, easing: (x) => 1 - Math.pow(1 - x, 3) });
}

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

/* ---------------- render loop ---------------- */
const clock = new THREE.Clock();
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  rig.update(dt);
  // Dollhouse reveal: ceilings fade out as the eye rises above them.
  const h = level.ceiling ?? 8;
  house.ceilingMaterial.opacity = THREE.MathUtils.clamp((h + 1.5 - rig.eyeHeight) / 2.5, 0, 1);
  house.ceilingMaterial.visible = house.ceilingMaterial.opacity > 0.02;
  kit.renderer.render(kit.scene, kit.camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// After fonts/layout settle, ScrollTrigger needs fresh measurements.
window.addEventListener("load", () => ScrollTrigger.refresh());
