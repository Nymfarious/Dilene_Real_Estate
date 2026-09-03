# Vendor notes

Tools evaluated for this project and the neighbouring ones, with the decision and the
reason. Add to this rather than re-litigating a vendor in chat.

## The rule

> **A tool sits in your workflow. A dependency sits in your product.**

Something with no API can only ever be the first. If using it means a human opens a
browser, uploads a file, waits, downloads a PNG and hand-feeds it back in, that is a
chore — and building a product on top of a chore does not work.

This is the same reflex that ruled out Lovable: renting a capability at the *application*
layer instead of buying it at the *model* layer, where it stays swappable. It is why
Higgsfield is acceptable (MCP endpoint + CLI, callable) and ArchyBase is not.

---

## Higgsfield — **adopted as a tool**

Image and video generation. Installed 2026-09-02.

- CLI `@higgsfield/cli` v1.1.24, global. Aliases `higgs` / `hf`.
- Auth is OAuth 2.0 PKCE (`higgsfield auth login`) — browser flow, no key pasted anywhere.
- Also ships an MCP endpoint (`https://mcp.higgsfield.ai/mcp`) usable from Claude Code
  directly, which is the door out of the reference video's funnel.
- Companion skills installed to `.agents/skills/` (8 of them); `skills-lock.json` is
  tracked so they can be restored. The generated skill directories are not tracked.
- Cost: the reference video claims ~$0.25/clip; a commenter reports far worse. Treat the
  low figure as best case. See `_archive/2026-09-source/extracted/scrollfilm.txt`.

Scope for this repo: exterior establishing shots and marketing pieces — the optional
cinematic layer in `site-spec.md`, and the movement library in the Listing Camera Book.
Not the interactive core.

## ArchyBase — **rejected as a dependency, optional as a tool**

Photo-to-render restyling for interiors.

**Why it can't be a dependency.** No `/api`, no docs, no developer section anywhere on
the site. It ships as a web app and a Chrome extension only. There is no programmatic
way to call it, so it structurally cannot sit inside a product.

**Pricing** (the page defaults to the Yearly tab, which makes it look annual-only — it
isn't):

| Shape | Starter | Plus | Professional |
|---|---|---|---|
| Monthly | $19.99/mo | $39.90/mo | $89.99/mo |
| Yearly | $15.92/mo ($191.04 up front) | $31.92/mo ($383.04) | $71.99/mo ($863.90) |
| One-time credits | $39.99 → 120 basic + 60 Pro | $199.99 → 1000 + 500 | $499.99 → 4000 + 2000 |

The one-time packs say credits never expire. That shape — buy a slug when you need it,
no renewal to forget — turns it from a subscription decision into a supply purchase.
~$40 is the honest answer if you want it for staging renders.

**Fine print.** Refunds generally unavailable once credits are used; 7-day window for
billing errors only. Commercial use is ambiguous — the pricing cards tick "Commercial
Use" on paid tiers, but the Terms say commercial permission attaches to *annual*
commercial plans. If anything made for Dilene could become paid work, get it in writing
from support before buying.

**What it's actually doing** is near-certainly a diffusion model with ControlNet
depth/segmentation holding room geometry steady while it repaints surfaces and
furniture. That is rentable directly from Replicate, fal.ai, or Hugging Face Inference —
per-call, swappable, no vendor credit balance.

### The room-scan / declutter app is two pipelines, not one

Recorded here because it is the reason ArchyBase looked more relevant than it is.

| Pipeline | Job | Right tool | ArchyBase? |
|---|---|---|---|
| **Understand** | Identify objects, spot clutter, read layout and lighting, reason about keep / donate / move | Vision-language model (Claude vision, Gemini) | ❌ no |
| **Show** | Render the "after" — restyled, decluttered, rearranged | Image model with depth + segmentation control, inpainting | ⚠️ yes, but only by hand |

The designer / organizer / rearranger personas all live in **Understand** — the
differentiated half, and the half ArchyBase has nothing to do with. Prototype the two
halves on an API-first stack so either can be swapped independently. The HF account
(`Nymfarious`) is already authenticated, so that is the zero-friction place to start.

## Lovable — **rejected**

Application-layer builder. Owning the code was the whole point; see `site-spec.md`.
