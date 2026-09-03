/**
 * Mantis.ts — the user-facing bug button.
 *
 * A quiet mark in the bottom-left corner. Click it and you get four fields
 * and a screenshot you can see before you send. That is the whole feature.
 *
 * Deliberately unobtrusive: the canon's first rule for this site is that
 * quiet is the tell it isn't a template, so the affordance sits at low
 * opacity until you go near it, and it never appears over the docent card.
 *
 * The screenshot comes from the WebGL canvas directly, not `getDisplayMedia`.
 * That is the whole reason this is nicer than the RootsGenie flow here: no
 * permission prompt, no window picker, no chance of catching the visitor's
 * other tabs. It also means the capture is exactly what the renderer drew,
 * which is what a "the house looked wrong" report needs.
 */
import type { MantisCategory, MantisConfig, MantisEntry, MantisMetrics, MantisPriority } from "./types";
import { deliver, downloadEntry, newId } from "./report";

export interface MantisOptions {
  mount: HTMLElement;
  /** App state at report time. Called once, when the visitor hits send. */
  context: () => MantisMetrics;
  /** Returns a JPEG data URL of the current frame, or undefined. */
  capture?: () => string | undefined;
  config?: MantisConfig;
}

const CATEGORIES: Array<[MantisCategory, string]> = [
  ["bug", "Something's broken"],
  ["ux", "Confusing or awkward"],
  ["feature", "I want something"],
  ["spec", "This is wrong about the property"],
];

const PRIORITIES: Array<[MantisPriority, string]> = [
  ["high", "Blocks me"],
  ["med", "Annoying"],
  ["low", "Minor"],
];

/** The brand mark, inline so the button always renders even if the PNG 404s. */
const MARK = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <path d="M12 2.6 4.4 5.5v6.1c0 4.6 3.1 8.3 7.6 9.8 4.5-1.5 7.6-5.2 7.6-9.8V5.5Z"
        fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
  <path d="M8.9 9.3c.9-.5 1.9-.4 2.6.3M15.1 9.3c-.9-.5-1.9-.4-2.6.3M9.7 14.4c1.4 1 3.2 1 4.6 0"
        fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
</svg>`;

export class Mantis {
  private opts: MantisOptions;
  private root: HTMLDivElement;
  private panel: HTMLDivElement;
  private button: HTMLButtonElement;
  private note!: HTMLTextAreaElement;
  private category!: HTMLSelectElement;
  private priority!: HTMLSelectElement;
  private shotWrap!: HTMLLabelElement;
  private shotImg!: HTMLImageElement;
  private includeShot!: HTMLInputElement;
  private status!: HTMLParagraphElement;
  private submit!: HTMLButtonElement;

  private open = false;
  private shot?: string;
  private sending = false;

  constructor(opts: MantisOptions) {
    this.opts = opts;

    this.root = document.createElement("div");
    this.root.className = "mantis";

    this.button = document.createElement("button");
    this.button.type = "button";
    this.button.className = "mantis-fab";
    this.button.setAttribute("aria-expanded", "false");
    this.button.setAttribute("aria-label", "Report a problem");
    this.button.title = "Report a problem";
    this.button.innerHTML = `${MARK}<span>Report</span>`;
    this.button.addEventListener("click", () => this.toggle());

    this.panel = document.createElement("div");
    this.panel.className = "mantis-panel";
    this.panel.setAttribute("role", "dialog");
    this.panel.setAttribute("aria-label", "Report a problem");
    this.panel.hidden = true;
    this.panel.innerHTML = this.markup();

    this.root.append(this.button, this.panel);
    opts.mount.appendChild(this.root);
    this.wire();
  }

  private markup(): string {
    const cats = CATEGORIES.map(([v, l]) => `<option value="${v}">${l}</option>`).join("");
    const pris = PRIORITIES.map(([v, l]) => `<option value="${v}"${v === "med" ? " selected" : ""}>${l}</option>`).join("");
    return `
      <div class="mantis-head">
        <p class="mantis-eyebrow">Concept preview</p>
        <h2>What went wrong?</h2>
        <button type="button" class="mantis-x" aria-label="Close">&times;</button>
      </div>
      <label class="mantis-field">
        <span>What happened</span>
        <textarea rows="3" maxlength="1000" placeholder="The bedroom looked like it had no wall on the left."></textarea>
      </label>
      <div class="mantis-row">
        <label class="mantis-field"><span>Kind</span><select class="mantis-cat">${cats}</select></label>
        <label class="mantis-field"><span>How bad</span><select class="mantis-pri">${pris}</select></label>
      </div>
      <label class="mantis-shot">
        <input type="checkbox" checked>
        <span>Include a picture of what I'm seeing</span>
      </label>
      <figure class="mantis-preview"><img alt="Screenshot that will be sent with this report"></figure>
      <p class="mantis-status" role="status" aria-live="polite"></p>
      <div class="mantis-actions">
        <button type="button" class="mantis-cancel">Cancel</button>
        <button type="button" class="mantis-send">Send</button>
      </div>`;
  }

  private wire() {
    const q = <T extends HTMLElement>(sel: string) => this.panel.querySelector<T>(sel)!;
    this.note = q<HTMLTextAreaElement>("textarea");
    this.category = q<HTMLSelectElement>(".mantis-cat");
    this.priority = q<HTMLSelectElement>(".mantis-pri");
    this.shotWrap = q<HTMLLabelElement>(".mantis-shot");
    this.includeShot = q<HTMLInputElement>(".mantis-shot input");
    this.shotImg = q<HTMLImageElement>(".mantis-preview img");
    this.status = q<HTMLParagraphElement>(".mantis-status");
    this.submit = q<HTMLButtonElement>(".mantis-send");

    q<HTMLButtonElement>(".mantis-x").addEventListener("click", () => this.close());
    q<HTMLButtonElement>(".mantis-cancel").addEventListener("click", () => this.close());
    this.submit.addEventListener("click", () => void this.send());
    this.includeShot.addEventListener("change", () => this.renderPreview());

    // Capture phase + stopPropagation so Esc closes this panel without also
    // kicking the visitor out of Explore mode.
    window.addEventListener(
      "keydown",
      (e) => {
        if (!this.open) return;
        if (e.key === "Escape") {
          e.stopPropagation();
          this.close();
        }
      },
      true,
    );
  }

  /* ------------------------------ open/close ------------------------------ */

  toggle() {
    this.open ? this.close() : this.openPanel();
  }

  openPanel() {
    if (this.open) return;
    this.open = true;
    // Grab the frame before the panel paints over it.
    this.shot = this.opts.capture?.();
    this.panel.hidden = false;
    this.root.classList.add("is-open");
    this.button.setAttribute("aria-expanded", "true");
    this.shotWrap.hidden = !this.shot;
    this.renderPreview();
    this.status.textContent = "";
    this.note.focus();
  }

  close() {
    if (!this.open) return;
    this.open = false;
    this.panel.hidden = true;
    this.root.classList.remove("is-open");
    this.button.setAttribute("aria-expanded", "false");
    this.button.focus();
  }

  private renderPreview() {
    const show = Boolean(this.shot) && this.includeShot.checked;
    this.shotImg.parentElement!.hidden = !show;
    if (show && this.shot) this.shotImg.src = this.shot;
  }

  /* -------------------------------- send -------------------------------- */

  private async send() {
    if (this.sending) return;
    const note = this.note.value.trim();
    if (!note) {
      this.status.textContent = "Tell me what happened first — even a few words.";
      this.note.focus();
      return;
    }

    this.sending = true;
    this.submit.disabled = true;
    this.status.textContent = "Sending…";

    const entry: MantisEntry = {
      id: newId(),
      note,
      category: this.category.value as MantisCategory,
      priority: this.priority.value as MantisPriority,
      pagePath: location.pathname + location.search,
      userAgent: navigator.userAgent,
      createdAt: new Date().toISOString(),
      ...(this.includeShot.checked && this.shot ? { screenshotDataUrl: this.shot } : {}),
      metrics: this.opts.context(),
    };

    const res = await deliver(entry, this.opts.config ?? window.DILENE_MANTIS_CONFIG ?? {});

    this.sending = false;
    this.submit.disabled = false;

    if (res.via === "bridge") {
      this.status.textContent = `Filed as ${res.detail}. Thank you.`;
      setTimeout(() => this.close(), 1600);
      this.note.value = "";
      return;
    }
    if (res.via === "endpoint") {
      this.status.textContent = "Sent. Thank you.";
      setTimeout(() => this.close(), 1400);
      this.note.value = "";
      return;
    }

    // Queue-only: say so honestly and offer the file.
    this.status.textContent = res.detail
      ? `${res.detail} Saved in this tab — you can download it instead.`
      : "Saved in this tab. Download it and send it over, and it'll get picked up.";
    this.offerDownload(entry);
  }

  private offerDownload(entry: MantisEntry) {
    if (this.panel.querySelector(".mantis-dl")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mantis-dl";
    btn.textContent = "Download report";
    btn.addEventListener("click", () => {
      downloadEntry(entry);
      btn.textContent = "Downloaded ✓";
    });
    this.panel.querySelector(".mantis-actions")!.prepend(btn);
  }
}
