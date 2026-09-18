/**
 * SVG → state — spec §7 round-trip. MOS-00011.
 *
 * The only file in this project that parses input it did not write. Parse with
 * DOMParser into a detached document — never innerHTML, never eval — and
 * validate the recovered payload before trusting it, because a `cols` of
 * 1000000 hangs the tab.
 *
 * Two paths, in order:
 *   1. <metadata> holding the §3 document. Lossless.
 *   2. Geometric fallback, for files SVGO or Figma stripped. Derive the grid
 *      from the rects' dimensions and spacing.
 *
 * The trap in the fallback: a rect's `fill` attribute holds its RESTING tone,
 * not its painted colour — the painted colour lives in the @keyframes block.
 * A reader that trusts `fill` recovers a blank field AND REPORTS SUCCESS.
 *
 * Paint order is not recoverable geometrically. §7: say so plainly — "artwork
 * recovered, paint order lost" — rather than silently inventing an order.
 */

export function importSvg(text) { // eslint-disable-line no-unused-vars
  // MOS-00011.
}
