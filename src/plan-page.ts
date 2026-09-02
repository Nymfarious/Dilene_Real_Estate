import planJson from "../data/floorplans/sample-apt.json";
import type { Floorplan } from "./types/floorplan";
import { renderFloorplanSVG } from "./plan/npr.js";

const plan = planJson as unknown as Floorplan;
const svg = renderFloorplanSVG(plan, { scale: 24 });
document.getElementById("sheet")!.innerHTML = svg;
document.getElementById("title")!.textContent = `${plan.meta.title} — floor plan`;
document.getElementById("meta")!.textContent =
  `${plan.levels[0].spaces.length} spaces · ${plan.levels[0].walls.length} walls · ${plan.meta.confidence} · ${plan.meta.source}`;

document.getElementById("dl-svg")!.addEventListener("click", () => {
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${plan.meta.id}-plan.svg`;
  a.click();
  URL.revokeObjectURL(a.href);
});
