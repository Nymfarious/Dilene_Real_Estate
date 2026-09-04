# The Docent — intro and guided tour

The docent is the layer that answers *"what is this?"* for someone who has just been handed a laptop, and then shows them every space in order if they want that. It is a card, not a modal. It explains once, offers the list, flies you to a room, and gets out of the way.

Code: `src/docent/Docent.ts` + `docent.css`. Data: `tour[]` in the property's `floorplan.json`. Owner: the `docent` agent (`.claude/agents/docent.md`).

## Behaviour

| Moment | What happens |
|---|---|
| First visit | Card opens on step 0 (*What is this?*): three sentences, the list of spaces, two buttons. The scene is visible and dimmed behind it. Nothing moves until she does. |
| "Show me the spaces" / any space in the list / → | Card closes; camera flies to that stop (`lenis.scrollTo` to the stop's progress); caption appears bottom-left. |
| "Tour" (nav) | Re-opens the card on the current stop so the visitor can see where they are and jump. |
| ← → with the card open | Previous / next step. Esc closes. |
| "Just let me look" | Closes and **remembers** (localStorage, per plan id). The card never auto-opens again on this browser. ✕ closes without remembering. |
| Scrolling with the card closed | Rail dots and caption follow the active stop; the card's own step follows silently so re-opening lands on the right space. |
| Reduced motion | No fade-in animation; everything still works. |

## Rules

1. **Never blocks scroll.** The card sits above the scene, but the scroll track keeps working; Esc always closes.
2. **Never autoplays.** No timers, no auto-advance. The visitor moves; the docent responds.
3. **Never lies about where you are.** `setActive()` is called from the camera rig on every stop change so dots and step stay honest.
4. **Reads from the plan file only.** Titles and captions come from `tour[]`; the intro copy lives in `main.ts` for now and moves to `brand.json` (or a `site.json`) when a second property arrives.
5. **Works without storage.** Every `localStorage` call is in `try/catch`; private windows get the card every time and that's fine.
6. **Keyboard complete.** Every action reachable by keyboard with a visible focus ring in gold.

## Copy

Step 0 (three lines, current):

> A property you can walk through by scrolling. Down moves you forward through the home; up brings you back.
> Every wall, door and window comes from one plan file, so the same file can draw the floor plan on paper and build the rooms here.
> This one is a sample apartment. Yours will be a real listing.

Buttons: **Show me the spaces** (primary) · **Just let me look** (dismiss & remember) · **Next space** / **Back** · **Start over** on the last step.

Space steps show `Space n of N`, the title, and the caption — the same caption the scroll view shows, so the docent never says something the room doesn't.

## Future (Milestone 2)

- Per-space **photo strip** on the step card (from `space.photos[]`), so the docent can show the real room next to the model.
- **"Ask about this room"** — a text field that sends the visitor's question to Dilene by email with the space id attached.
- **Multi-property** — step 0 lists properties; the tour list belongs to the chosen one.
- **Presenter mode** — a `?present` query flag that hides the notice bar and nav for in-person showings.
