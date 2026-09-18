# Pixel Mosaic — build plan

A single-page tool for drawing on a field of squares and exporting the result as
an animated SVG, where squares change colour one group at a time to reveal an
image and then return to their resting state. No accounts, no backend, no
server-side anything.

This document is the spec. Where it states a decision, the decision is made —
don't re-litigate it. Where it says OPEN, ask before choosing.

---

## 1. What it is

- A field of **individual squares** — not a grid of lines. Default **24 × 24**,
  size configurable.
- Each square has a size and there is a gutter between squares. The gutter shows
  whatever is behind it. There are no borders or strokes anywhere.
- Every square is **always present**, resting at a base colour. Painting changes
  a square's colour; it never creates or destroys one.
- The **animation is derived, not authored**. There is one static image; the
  motion comes from the order and timing in which squares change colour, resting
  → painted → resting.
- Export as an animated SVG. Re-open that SVG later and keep editing it.

### Who it's for

**A public tool, released for anyone to use** — and used by its author. That
decides the palette question: colours are free-form, with no fixed or
brand-locked palette anywhere. It also means the defaults have to be good on
first load, because most people will never open a settings panel.

### Explicitly out of scope for v1

- **Multi-frame animation.** Later: duplicate the current frame, edit it, and a
  frame timeline along the bottom. Not now — but §3 keeps it cheap.
- **GIF export.** Wanted, specced in §9 so the seams are right, built after the
  SVG path works end to end.
- **Strokes / borders on squares.** The gutter does this job. See §4 for the one
  case this gives up and why it's acceptable.
- Auth, accounts, cloud storage, collaboration.

---

## 2. Core principle: the schedule is the seam

Everything downstream of the editor consumes one intermediate structure:

```
Schedule = Array<{ cellIndex: number, inAt: seconds, outAt: seconds }>
```

Ordering and timing logic produces a `Schedule`. The SVG writer consumes it. The
GIF encoder later consumes the same one. Neither exporter knows how ordering
works; the ordering code knows nothing about SVG or GIF.

**Do not skip this.** The main cost of adding GIF later is reverse-engineering
the animation out of a generated SVG string. This structure is what prevents it.

---

## 3. Data model

Three clearly separate groups. Keep them separate in the code and in the
serialised document — this split is what makes frames cheap later.

```jsonc
{
  "version": 1,
  "canvas": {
    "cols": 24,
    "rows": 24,
    "squareSize": 24,          // px
    "gutter": 2,               // px; 0 is a real, desirable case
    "restFill": "#2A2440",     // or null for transparent
    "gapColor": "#161226",     // or null for transparent
    "variation": { "amount": 0.06, "tones": 4, "seed": 91823 }
  },
  "content": {
    "cells": ["", "", "#e4e4ff", ...],       // length cols*rows; "" = unpainted
    "paintOrder": [[57],[58],[83,84,85],...] // GROUPS of cell indices, in order
  },
  "motion": {
    "inOrder": "draw",         // see §6
    "outOrder": "reverse",
    "seed": 428173,            // scatter ordering; separate from variation.seed
    "revealDuration": 3.0,     // seconds, first group in to last group in
    "hold": 1.5,               // seconds at the complete image
    "concealDuration": 2.0,
    "pause": 0.5,              // seconds at rest before looping
    "cellFade": 0.1,           // seconds per square; 0 = snap
    "loop": true
  }
}
```

Notes:

- `content` is what frames will later duplicate. `canvas` and `motion` stay
  shared — a frame must never have its own background or square size.
- `cells` is flat, indexed `row * cols + col`.
- **`paintOrder` is an array of groups, not an array of cells.** See §7.
- `pitch = squareSize + gutter` is derived everywhere. Never stored.

### Paint-order maintenance rules

Decided; implement exactly this.

- Painting previously-unpainted squares **appends one group** containing all
  squares painted by that single action. A single click appends a group of one;
  a multi-select fill or a flood fill appends a group of many.
- **Recolouring** already-painted squares leaves their positions in `paintOrder`
  unchanged. The order records where the hand went; edits must not reshuffle the
  animation.
- **Erasing** removes those squares from their groups; a group left empty is
  dropped.
- Drag-painting appends squares in the order the pointer crosses them, as
  separate groups — it is a continuous gesture, not a bulk action.
- **Undo/redo must restore `paintOrder`**, not just `cells`. Easiest thing here
  to get wrong.
- Nudging a selection moves its entries within `paintOrder` too.

---

## 4. Geometry and colour

Controls: `cols`, `rows`, `squareSize`, `gutter`, `restFill`, `gapColor`.

- **`pitch = squareSize + gutter`.** Everything keys off pitch.
- **Gutter 0 is a first-class case** — squares touch and you get a continuous
  colour field, the classic pixel-art look. Should be one click away. It is also
  when the antialiasing seam problem bites hardest (§8).
- Both `restFill` and `gapColor` can be a colour **or transparent**,
  independently. The four combinations are all legitimate:
  - transparent gaps, filled squares → squares floating, page showing between
  - opaque gaps, transparent squares → page showing through cells, visible lattice
  - both opaque → solid field
  - both transparent → nothing renders until painted (the sparse model)

### Naming

Call the gap control **gap colour** or **field colour** in the UI, never
"background". Once the gutter shows it, that colour *is* what reads as the grid
lines, and it inverts how anyone would describe a look out loud — cream squares
with purple lines means setting squares cream and gaps purple.

### Why no strokes

A gutter does the same job with fewer moving parts and is better at
intersections: borders double up on shared edges, a gutter is one continuous
lattice by construction. It also avoids SVG's stroke-centring problem entirely
(no `box-sizing`; a 1px stroke on a 22px rect renders 23px and quietly breaks the
gutter).

**The one case given up:** a square that is see-through *and* has a visible
outline, over a non-flat background. A gutter can't fake that. Accepted. Adding
`stroke` later is purely additive if it's ever wanted.

### Resting-field variation

The resting field should read as texture, not a flat checkerboard.

- **Discrete tones, not continuous jitter.** 3–5 variants of `restFill`, assigned
  per square by a seeded function of its coordinates. Quantised variation reads
  as deliberate; continuous jitter reads as noise or dirt at low amplitude, and
  it inflates the palette (§9 wants few colours).
- `variation.amount` of 0 means uniform. Its seed is **separate** from the
  scatter seed — reshuffling the animation must not rearrange the texture.
- Variation applies to the **fill only**, never to anything else.

**One function, used twice.** Define `restTone(col, row)`. The infinite-field
pattern (§8) is generated from it, and every artwork square's resting fill is the
same call. Because they share a coordinate origin they agree by construction. If
these are computed separately the artwork region reads as a flat patch against a
textured ground, and it is miserable to diagnose.

Worth trying once built: variation in **alpha** rather than lightness. With
transparent gaps the page tints the field, so the same mosaic picks up whatever
it sits on. Lovely for ambient decoration, wrong if the piece must look identical
everywhere.

---

## 5. Editor UX

### Tools

**Paint** and **Select** are separate tools. Do not overload click — painting is
the primary action and shouldn't be modal-guessy.

Within Select: click for one, shift-click to add/remove, drag for a marquee, and
**select-by-colour** (click a square, get every square sharing that colour).
Select-by-colour is ~6 lines and is the fastest way to recolour a whole element.

Selection operations, in order of value: set fill, clear, nudge with arrow keys,
copy/paste, invert, select-all-painted.

Render selection as a per-square outline, not one unified boundary around the
region — unified looks better in a vector editor but gets confusing with disjoint
selections, and per-square is unambiguous about what's in the set.

### The colour sidebar

A panel listing every colour currently used in the piece, with a count per
colour. It is worth building early — it is the discoverable form of
select-by-colour and it carries most of the palette workflow.

- **Click a swatch → select every square using that colour.** Otherwise the user
  has to go hunting for an example square to click.
- **Global recolour** — change a swatch and every square using it updates. This
  is the main tool for iterating on a palette. It is safe by construction:
  recolouring preserves positions in `paintOrder` (§3), so the animation is
  undisturbed.
- **Counts** show what is actually dominant in the piece.
- **Solo / hide** per colour makes editing a busy mosaic tractable.
- **Drag to reorder** the swatches. This order is not decoration — it drives the
  `colour` ordering in §6.

**Colour groups and paint groups are different things. Do not conflate them.**
The sidebar groups by *colour*, a property of the current image. `paintOrder`
groups by *gesture*, a record of history. Two squares may share a colour and sit
in different paint groups, or share a paint group and differ in colour. Both are
useful; merging them silently breaks the choreography.

Swatches are free-form colours — no fixed palette, no design-token lock-in (§1).
Show hex, and let a swatch be renamed so a user can label their own palette.

### Build the rest in this order

1. **Drag to paint**, not click-per-square.
2. **Undo / redo** over the whole document (see the `paintOrder` rule).
3. **Eyedropper**, plus a recent-colours strip.
4. **Mirror / symmetry mode** — horizontal, vertical, both. Large multiplier:
   draw a quarter, get a whole.
5. Flood fill.
6. Reference image underlay at low opacity, for tracing.

Erase is a tool, not a colour — it must remove entries from `paintOrder`, so it
cannot be implemented as "paint the resting colour".

---

## 6. Motion

### Ordering vocabulary

**One shared list of orderings, selected twice — independently for in and out.**
Do not build two separate hand-written lists.

| Key | Behaviour |
|---|---|
| `scatter` | Random, seeded from `motion.seed` |
| `draw` | The order the groups were painted |
| `reverse` | The reverse of the paint order |
| `colour` | Colour group by colour group, in the sidebar's order (§5) |

Sixteen combinations fall out. `draw` as an *out* order reads as the image being
erased in the order it was made — a different gesture from `reverse` (rewind).
Both are wanted.

Later additions (row sweep, column sweep, radial, diagonal) go in this one list
and both selectors get them for free.

**Scatter must be seeded.** Store the seed and offer a "reshuffle" button. An
unseeded shuffle means the export doesn't match the preview and no piece is
reproducible.

### Groups, not cells

Orderings and the timing spread operate over **groups** from `paintOrder`, not
individual squares. A group's squares share one `inAt` and one `outAt` and land
together as a wave.

This is the point of §3's group structure: choreography emerges from how you
worked. Squares drawn one at a time trickle; a flood-filled shape lands at once.
For `scatter`, shuffle the groups — do not flatten and shuffle squares, or bulk
actions dissolve into noise.

`colour` is the exception: it groups by **colour**, not by paint group, so it
ignores `paintOrder` entirely and uses the sidebar's swatch order (§5). Every
square of one colour arrives together. This is deliberate — see the warning in §5
about not conflating the two kinds of group.

### Timing

`revealDuration` spreads the groups across that window in the chosen order; same
for `concealDuration`. `hold`, `pause` and `loop` set the rhythm. Total cycle =
reveal + hold + conceal + pause.

`cellFade` is the per-square colour transition. **Default 0.1s.** At this scale a
hard snap often reads as a rendering glitch rather than a choice. Keep 0
available for a deliberate snap.

All motion settings are **non-destructive** — they never touch `content`. The
export panel should be a live preview, and the artwork is never at risk.

---

## 7. SVG export

### Structure

- One `<rect>` per square. Squares are **always** emitted — unpainted ones sit at
  their resting tone. Nothing is created or destroyed by the animation.
- Square at `(gutter + col*pitch, gutter + row*pitch)`, sized `squareSize`.
- Gap colour is one `<rect>` behind everything, or **no rect at all when
  transparent**. Do not paint white. Test the export against a dark page early —
  a white background is invisible in the editor and only reveals itself as wrong
  elsewhere.
- CSS in a `<style>` block inside the SVG. **Not SMIL, not JS.** CSS keyframes
  survive use in an `<img>` tag, a CSS background and a GitHub README; JS-driven
  animation dies in all three.

### Export bounds

Trim to the **outside edge of the surrounding gutter**:

```
width  = cols × pitch + gutter
height = rows × pitch + gutter
```

First square at `(gutter, gutter)`. At gutter 0 this collapses to `cols × size`
with squares at the origin — the zero case needs no special handling. Two copies
placed edge to edge produce one continuous lattice rather than a double gap.

### Animation technique — read this before implementing

Each square animates **`fill`**, not opacity: resting tone → painted colour →
resting tone, looping. `inAt` and `outAt` differ per group.

**The obvious approach does not work.** Two animations on one element (`cellIn`
delayed to `inAt`, `cellOut` delayed to `outAt`) fails because
`animation-fill-mode` backwards-fills `cellOut`'s from-state from time zero, so
every square shows its painted colour immediately. A shared keyframe with
per-square `animation-delay` fails differently: it puts each square at a
different phase of the cycle, so they are never all on at once — a travelling
wave rather than a reveal.

**Use per-group `@keyframes`,** with percentages computed from `inAt`/`outAt`
against the total cycle:

```css
@keyframes k7 { 0%,18% {fill:#2A2440} 21%,74% {fill:#E4E4FF} 77%,100% {fill:#2A2440} }
.c7 { animation: k7 7s linear infinite; }
```

Loops cleanly, no fill-mode games. When `cellFade` is 0 the paired percentages
collapse to one value and CSS resolves it as a hard step — snap works for free.

**Specify `linear` explicitly.** The default `ease` distorts the transition,
because the keyframe percentages already encode all the timing.

**Note the resting tone is per-square** when variation is on, so squares sharing
a group but not a tone need separate blocks. Key the block cache on
`(inWave, outWave, restTone, paintColour)`.

### Quantise the timeline into waves

Snap the reveal into **~32–40 steps** across its duration, and the conceal
likewise. Emit one keyframe block per distinct key (above) and give squares the
matching class.

Nobody perceives 10ms of difference in arrival, so this is visually identical to
per-group staggering — but the block count collapses dramatically, especially
when in and out orders are correlated, which they are for `draw`/`reverse`.

**This is a size optimisation, not a correctness one.** The unoptimised version
is roughly tens of KB of highly repetitive text that gzips to a few KB. If waves
add friction during the build, ship without them.

### Rendering detail that will otherwise be reported as a bug

Set `shape-rendering="crispEdges"` on the squares. Adjacent rects on fractional
device pixels antialias their shared edges and produce hairline seams across the
field. It looks like a rendering fault and it is the first thing anyone notices —
especially at gutter 0, where every square shares an edge.

### Why not SMIL

SMIL is the technically better fit, and it's worth knowing why it was rejected.
`<animate>` lives inline on each rect — no class plumbing, no `<style>` block —
and SMIL's timing model composes two animations with different `begin` times
correctly, which is exactly what CSS fill-mode gets wrong above.

It is still not the choice. Chrome deprecated it in 2015 and only reversed under
pressure, some SVG tooling strips it, and it isn't a dependency worth taking on a
file format meant to outlive the tool. Keep it as the fallback if a target
renderer turns out to choke on CSS animation inside SVG.

### Round-trip — the SVG is the document

Embed the full document JSON from §3 inside the SVG in a `<metadata>` element.
Renderers ignore it, so the file still displays and animates anywhere, but the
tool can open it and recover the project losslessly.

This collapses save-versus-export: one file, both artwork and source, and "open"
is dragging it back in. No project format, no library, no "which file is real".

**Fallback for stripped files.** SVGO strips metadata by default and anything
round-tripped through Figma loses it. Implement a geometric reader too: parse the
rects, derive the grid from the dimensions and spacing, recover every square and
colour. Paint order and grouping are not recoverable this way — say so plainly
("artwork recovered, paint order lost") rather than silently inventing one.

### Also worth having

- Static SVG / PNG of the finished state.
- Copy SVG markup to clipboard.
- Share link — the document is small enough for a URL fragment, so sharing needs
  no storage at all.

---

## 8. The field mode — filling a web page

A second export mode for page illustrations: the artwork sits in an endless field
of resting squares that fills its container, **without the squares getting
bigger**. Same document, same animation, different wrapper. Generate both from
one source rather than treating one as a variant.

**A `viewBox` is what causes scaling.** For fixed-size squares use no viewBox, so
one user unit is one CSS pixel and a square is always `squareSize` px regardless
of container size.

**The alignment trap:** the obvious approach — an infinite field as a CSS
background on the container with the artwork layered on top — breaks when the
container width isn't a multiple of `pitch`. The artwork lands on a fractional
offset and the two lattices sit out of phase, changing as the window resizes.

**Instead, draw the field inside the artwork's own coordinate system:**

```html
<svg class="field" width="100%" height="100%">
  <defs>
    <pattern id="f" width="192" height="192" patternUnits="userSpaceOnUse">
      <!-- an 8x8 super-tile of resting squares, from restTone(col,row) -->
    </pattern>
  </defs>
  <svg x="50%" y="50%" overflow="visible">
    <g transform="translate(-288,-288)">
      <rect x="-4000" y="-4000" width="8000" height="8000" fill="url(#f)"/>
      <!-- the artwork's squares, same units -->
    </g>
  </svg>
</svg>
```

The pattern rect lives *inside the same translated group as the artwork*, so the
field and the artwork share an origin by construction and cannot drift out of
phase at any container size. The outer SVG clips the overspill. No `calc()`, no
`round()`, no resize listener.

`patternUnits="userSpaceOnUse"` is load-bearing — the default scales the pattern
with the bounding box and undoes the whole thing.

**Use a super-tile for variation.** A pattern tiles identically, so per-square
variation can't come from a single-square pattern. Make the tile 8×8 or 12×12
squares with the variation baked in. It repeats, but at subtle amplitude and that
size the period isn't perceptible, and you keep an endless field for one pattern
and one rect instead of thousands of elements.

**Narrow viewports need a rule.** Fixed square size means no responsive scaling —
that's the point, but a 24×24 field at 24px is 576px and won't fit a phone.
Options: crop the field and let the artwork anchor off-centre; drop the square
size at a breakpoint; or use a smaller grid in that context. Cropping keeps the
squares honest and looks best for ambient decoration, but part of the image goes
off-screen — fine for atmosphere, wrong if the mosaic is the content. OPEN.

---

## 9. GIF export (later, but design for it now)

Wanted because animated SVG is dead in Slack, email, Keynote, PowerPoint and
Figma. GIF is what makes a piece sendable.

- **No SVG rasterising.** Draw to a `<canvas>` directly — it's a loop filling
  squares. Consume the same `Schedule` from §2.
- **Pass an exact palette to the encoder.** The image is already palette-indexed
  by construction: gap colour, the resting tones, and the paint colours. No
  quantisation, perfect colours, tiny files. This is the one thing GIF is good at
  — and it's why §4 insists on discrete tones over continuous jitter.
- **Because squares animate `fill` between opaque colours, the old
  transparency-versus-fade conflict mostly disappears.** It only returns if the
  gap colour is transparent: GIF transparency is one bit, so transparent gaps are
  fine (hard-edged, no partial), but anything fading *to* transparent will pop.
  Squares crossfading between two opaque colours are unaffected.
- **Frame delays are quantised to 1/100s and browsers clamp very small ones**
  (under ~20ms gets stretched). Practical ceiling ~25fps; 12–15fps looks fine and
  halves the file size. The GIF won't be frame-identical to the SVG, only
  perceptually the same — expect that rather than debugging it.
- **Export at a multiple of the grid**, nearest-neighbour. A 24×24 field at 1px
  per square is twenty-four actual pixels.

---

## 10. Shipping it publicly

It's a public tool, so a few things that would be optional for a personal one
aren't.

- **Static, single page, no backend.** It should host anywhere — GitHub Pages,
  Netlify, a file on disk. No build step if that can be avoided.
- **Nothing leaves the browser.** No accounts, no uploads, no analytics by
  default. Say so plainly in the UI: it's a real privacy property and it's also
  the reason the tool can be trusted with someone's work.
- **The defaults are the product.** Most visitors will draw a few squares, press
  export, and judge it on that. The out-of-the-box grid size, square size,
  gutter, resting colour, ordering and timing should produce something that looks
  deliberate with zero configuration.
- **Share links matter more here** (§7). A piece that reconstructs from a URL is
  how the tool spreads, and it still needs no storage.
- **Keyboard and contrast.** Painting is pointer-driven, but tool switching,
  undo, nudge and export should all be reachable from the keyboard, and the
  chrome needs to pass contrast independently of whatever colours the user picks
  for their artwork.
- **Pick a licence** before publishing. OPEN.

---

## 11. Build order

1. Field render — squares, size, gutter, gap colour, resting fill.
2. Paint + erase + drag, with `cells` and `paintOrder` groups maintained per §3.
3. Undo/redo over the whole document.
4. Resting-field variation via `restTone(col,row)`.
5. Select tool: click, shift-click, marquee, select-by-colour, and the operations.
6. Colour sidebar: swatches with counts, click-to-select, global recolour,
   drag-to-reorder.
7. Ordering + timing → `Schedule`, with a live preview driven by the same
   `Schedule` the exporter will use.
8. SVG export: per-group keyframes, embedded metadata.
9. SVG open: metadata path, then the geometric fallback.
10. Field mode export (§8).
11. Editor niceties: eyedropper, recent colours, symmetry, flood fill.
12. Share link.
13. *Later:* GIF. *Later still:* frames.

---

## 12. Open questions

- Narrow-viewport behaviour for field mode (§8).
- The gap colour is animatable — holding it fixed is right for v1, but a field
  whose gaps shift during the reveal is a large effect for very little code.
  Parked, not rejected.
