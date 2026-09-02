/**
 * Docent.ts — the "what is this?" intro and step-through tour overlay.
 *
 * Owned by the `docent` agent (see .claude/agents/docent.md and docs/docent.md).
 * It never touches the 3D scene directly: it asks the host to go somewhere
 * via `onGo(index)` and is told where the visitor is via `setActive(index)`.
 *
 * Behaviour contract:
 *  - Opens on first visit (unless dismissed before, remembered per browser).
 *  - Step 0 explains the page in three sentences. Steps 1..N are the spaces.
 *  - "Next" / "Back" / dots / ← → keys move between steps; Esc or ✕ dismisses.
 *  - Choosing a step flies the camera there and closes the card so the room is
 *    unobstructed; the small "Tour" button in the nav re-opens it.
 *  - Dismissal is remembered with localStorage, wrapped in try/catch — a page
 *    that can't remember must still work.
 */

export interface DocentStop {
  title: string;
  caption?: string;
}

export interface DocentOptions {
  mount: HTMLElement;
  intro: { title: string; lines: string[] };
  stops: DocentStop[];
  onGo: (index: number) => void;
  storageKey?: string;
}

export class Docent {
  private root: HTMLElement;
  private step = 0;
  private opts: DocentOptions;
  private opened = false;

  constructor(opts: DocentOptions) {
    this.opts = opts;
    this.root = document.createElement("div");
    this.root.className = "docent";
    this.root.setAttribute("role", "dialog");
    this.root.setAttribute("aria-modal", "false");
    this.root.setAttribute("aria-label", "Tour guide");
    this.root.hidden = true;
    opts.mount.appendChild(this.root);
    this.render();

    window.addEventListener("keydown", (e) => {
      if (!this.opened) return;
      if (e.key === "Escape") this.close(true);
      else if (e.key === "ArrowRight") this.go(this.step + 1);
      else if (e.key === "ArrowLeft") this.go(this.step - 1);
    });
  }

  /** Open unless the visitor dismissed it before. Returns whether it opened. */
  openUnlessDismissed(): boolean {
    let dismissed = false;
    try { dismissed = localStorage.getItem(this.key) === "1"; } catch { /* storage unavailable */ }
    if (!dismissed) this.open(0);
    return !dismissed;
  }

  open(step = this.step) {
    this.step = clamp(step, 0, this.opts.stops.length);
    this.opened = true;
    this.root.hidden = false;
    this.render();
    (this.root.querySelector<HTMLElement>("[data-primary]") ?? this.root).focus();
  }

  close(remember = false) {
    this.opened = false;
    this.root.hidden = true;
    if (remember) { try { localStorage.setItem(this.key, "1"); } catch { /* ignore */ } }
  }

  /** Host tells us where the visitor is (from scroll), so dots stay honest. */
  setActive(stopIndex: number) {
    const s = stopIndex + 1;
    if (s !== this.step && !this.opened) this.step = s;
    if (this.opened) this.updateDots();
  }

  private go(step: number) {
    step = clamp(step, 0, this.opts.stops.length);
    this.step = step;
    if (step > 0) {
      this.opts.onGo(step - 1);
      this.close(false);      // get out of the way of the room
    } else {
      this.render();
    }
  }

  private get key() { return this.opts.storageKey ?? "docent:dismissed"; }

  private render() {
    const n = this.opts.stops.length;
    const isIntro = this.step === 0;
    const stop = isIntro ? null : this.opts.stops[this.step - 1];
    const dots = Array.from({ length: n + 1 }, (_, i) =>
      `<button class="docent-dot${i === this.step ? " is-on" : ""}" data-step="${i}" aria-label="${i === 0 ? "Introduction" : esc(this.opts.stops[i - 1].title)}"></button>`
    ).join("");

    this.root.innerHTML = `
      <div class="docent-card">
        <button class="docent-x" data-close aria-label="Close the guide">✕</button>
        <p class="docent-eyebrow">${isIntro ? "A guided look" : `Space ${this.step} of ${n}`}</p>
        <h2 class="docent-title">${esc(isIntro ? this.opts.intro.title : stop!.title)}</h2>
        ${isIntro
          ? this.opts.intro.lines.map((l) => `<p class="docent-line">${esc(l)}</p>`).join("")
          : `<p class="docent-line">${esc(stop!.caption ?? "")}</p>`}
        <div class="docent-row">
          <div class="docent-dots">${dots}</div>
          <div class="docent-actions">
            ${this.step > 0 ? `<button class="docent-btn" data-prev>Back</button>` : `<button class="docent-btn" data-close-remember>Just let me look</button>`}
            <button class="docent-btn is-primary" data-next data-primary>${isIntro ? "Show me the spaces" : this.step < n ? "Next space" : "Start over"}</button>
          </div>
        </div>
        ${isIntro ? `<ol class="docent-list">${this.opts.stops.map((s, i) => `<li><button data-step="${i + 1}">${esc(s.title)}</button></li>`).join("")}</ol>` : ""}
      </div>`;

    this.root.querySelector("[data-close]")?.addEventListener("click", () => this.close(false));
    this.root.querySelector("[data-close-remember]")?.addEventListener("click", () => this.close(true));
    this.root.querySelector("[data-prev]")?.addEventListener("click", () => { this.step -= 1; this.render(); });
    this.root.querySelector("[data-next]")?.addEventListener("click", () => this.go(this.step < n ? this.step + 1 : 0));
    this.root.querySelectorAll<HTMLButtonElement>("[data-step]").forEach((b) =>
      b.addEventListener("click", () => this.go(Number(b.dataset.step))));
  }

  private updateDots() {
    this.root.querySelectorAll<HTMLElement>(".docent-dot").forEach((d, i) => d.classList.toggle("is-on", i === this.step));
  }
}

function clamp(n: number, a: number, b: number) { return Math.max(a, Math.min(b, n)); }
function esc(s: string) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); }
