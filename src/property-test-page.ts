import "./property-test.css";

type Photo = { src: string; alt: string };
type Scene = {
  title: string;
  copy: string;
  centerLabel: string;
  left: Photo;
  center: Photo;
  right: Photo;
};

const photo = (file: string, alt: string): Photo => ({ src: `/property-test-images/${file}`, alt });

const scenes: Scene[] = [
  {
    title: "Kitchen & entry",
    copy: "The widest available look establishes the kitchen, island, entry, windows, and fireplace edge.",
    centerLabel: "Kitchen overview",
    left: photo("hall-to-kitchen.webp", "Hallway looking toward the kitchen"),
    center: photo("kitchen-wide.webp", "Wide view of the private residence kitchen and entry"),
    right: photo("kitchen-island.webp", "Kitchen island, entry door, and front window"),
  },
  {
    title: "Living room & fireplace",
    copy: "The fireplace image anchors the living area. Kitchen views remain at either side to preserve the relationship between the spaces.",
    centerLabel: "Living-area anchor",
    left: photo("kitchen-wide.webp", "Kitchen viewed from the living area"),
    center: photo("fireplace.webp", "Private residence fireplace and living-room floor"),
    right: photo("kitchen-island.webp", "Kitchen island beside the living area"),
  },
  {
    title: "Bedroom & hall",
    copy: "Two room views and the short hall form a cautious sequence. The exact bedroom identities and dimensions remain unclaimed.",
    centerLabel: "Room view",
    left: photo("hall-to-bath.webp", "Short hallway leading toward the bathroom"),
    center: photo("bedroom-closet.webp", "Bedroom with open closet and doorway"),
    right: photo("bedroom-window.webp", "Empty room with a single window"),
  },
  {
    title: "Bath & circulation",
    copy: "The bathroom is shown from its single supplied angle, flanked by the two circulation views that connect it to the rest of the photo set.",
    centerLabel: "Bathroom view",
    left: photo("hall-to-bath.webp", "Hallway approaching the bathroom"),
    center: photo("bathroom.webp", "Bathroom with tub, tile, toilet, vanity, and window"),
    right: photo("hall-to-kitchen.webp", "Hallway and closet looking back toward the kitchen"),
  },
];

function required<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Private-residence photo-turn is missing ${selector}.`);
  return element;
}

const sequence = required<HTMLElement>(".turn-sequence");
const arc = required<HTMLElement>("#photo-arc");
const title = required<HTMLElement>("#scene-title");
const number = required<HTMLElement>("#scene-number");
const copy = required<HTMLElement>("#scene-copy");
const centerLabel = required<HTMLElement>("#center-label");
const left = required<HTMLImageElement>("#photo-left");
const center = required<HTMLImageElement>("#photo-center");
const right = required<HTMLImageElement>("#photo-right");
const dots = required<HTMLElement>("#scene-dots");
const previous = required<HTMLButtonElement>("#previous-scene");
const next = required<HTMLButtonElement>("#next-scene");

let activeScene = -1;
let framePending = false;

const dotButtons = scenes.map((scene, index) => {
  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-label", `Show ${scene.title}`);
  button.addEventListener("click", () => scrollToScene(index));
  dots.appendChild(button);
  return button;
});

function assignImage(element: HTMLImageElement, image: Photo) {
  element.src = image.src;
  element.alt = image.alt;
}

function setScene(index: number) {
  const safeIndex = Math.max(0, Math.min(scenes.length - 1, index));
  if (safeIndex === activeScene) return;
  activeScene = safeIndex;
  const scene = scenes[safeIndex];
  arc.classList.add("is-changing");
  window.setTimeout(() => {
    assignImage(left, scene.left);
    assignImage(center, scene.center);
    assignImage(right, scene.right);
    title.textContent = scene.title;
    number.textContent = String(safeIndex + 1).padStart(2, "0");
    copy.textContent = scene.copy;
    centerLabel.textContent = scene.centerLabel;
    dotButtons.forEach((button, dotIndex) => button.classList.toggle("is-active", dotIndex === safeIndex));
    previous.disabled = safeIndex === 0;
    next.disabled = safeIndex === scenes.length - 1;
    arc.classList.remove("is-changing");
  }, 150);
}

function scrollToScene(index: number) {
  const rect = sequence.getBoundingClientRect();
  const top = window.scrollY + rect.top;
  const travel = Math.max(1, sequence.offsetHeight - window.innerHeight);
  const progress = index / (scenes.length - 1);
  window.scrollTo({ top: top + travel * progress, behavior: "smooth" });
}

previous.addEventListener("click", () => scrollToScene(activeScene - 1));
next.addEventListener("click", () => scrollToScene(activeScene + 1));

const mapSequence = document.querySelector<HTMLElement>(".map-sequence");
const mapFrame = document.querySelector<HTMLElement>("#map-frame");
const mapEyebrow = document.querySelector<HTMLElement>("#map-eyebrow");
const mapTitle = document.querySelector<HTMLElement>("#map-title");
const mapCopy = document.querySelector<HTMLElement>("#map-copy");

const mapStates = [
  ["From the room", "Pull above the property.", "The supplied photographs end at the walls. The map begins as an honest change of source."],
  ["Property view", "Find the test area in place.", "The approximate street supplies location context while the exact residence remains withheld."],
  ["Neighborhood view", "Continue into Everett.", "This locator proves the handoff. A later Cesium build can turn it into one continuous terrain flight."],
] as const;

function updateFromScroll() {
  framePending = false;
  const sequenceRect = sequence.getBoundingClientRect();
  const sequenceTravel = Math.max(1, sequence.offsetHeight - window.innerHeight);
  const sequenceProgress = Math.max(0, Math.min(1, -sequenceRect.top / sequenceTravel));
  setScene(Math.min(scenes.length - 1, Math.floor(sequenceProgress * scenes.length)));

  if (mapSequence && mapFrame && mapEyebrow && mapTitle && mapCopy) {
    const mapRect = mapSequence.getBoundingClientRect();
    const mapTravel = Math.max(1, mapSequence.offsetHeight - window.innerHeight);
    const mapProgress = Math.max(0, Math.min(1, -mapRect.top / mapTravel));
    mapFrame.style.setProperty("--map-scale", String(1.34 - mapProgress * .34));
    mapFrame.style.setProperty("--map-light", String(.48 + mapProgress * .28));
    const stateIndex = Math.min(mapStates.length - 1, Math.floor(mapProgress * mapStates.length));
    const state = mapStates[stateIndex];
    mapEyebrow.textContent = state[0];
    mapTitle.textContent = state[1];
    mapCopy.textContent = state[2];
  }
}

function requestUpdate() {
  if (framePending) return;
  framePending = true;
  window.requestAnimationFrame(updateFromScroll);
}

window.addEventListener("scroll", requestUpdate, { passive: true });
window.addEventListener("resize", requestUpdate);
setScene(0);
requestUpdate();
