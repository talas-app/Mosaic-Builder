/**
 * Ordering, timing, and the Schedule — spec §2, §6. MOS-00009.
 *
 * THIS FILE IS THE SEAM. Everything upstream (paint, select, palette) produces
 * `paintOrder`; everything downstream (export-svg, export-gif) consumes only
 * the Schedule and knows nothing about how ordering works:
 *
 *   Schedule = Array<{ cellIndex: number, inAt: seconds, outAt: seconds }>
 *
 * §2: the main cost of adding GIF later is reverse-engineering the animation
 * out of a generated SVG string, and this structure is what prevents it. The
 * discipline is enforced by imports — an exporter that reaches for
 * `state.content.paintOrder` has broken the seam even if the output looks right.
 *
 * ONE shared ordering list, selected twice (§6): `orderGroups(groups, mode,
 * seed)` is called once for `inOrder` and once for `outOrder`. Do not write two
 * lists. Orderings operate over GROUPS, not cells — flattening makes a flood
 * fill dissolve into noise under `scatter`. `colour` is the exception: it
 * ignores `paintOrder` entirely and uses the sidebar's swatch order.
 *
 * Scatter is seeded from `motion.seed`. No `Math.random()` in this file, ever:
 * an unseeded shuffle means the export does not match the preview.
 */

/** The seam's whole public surface, with `wavesFrom`. */
export function buildSchedule(state) { // eslint-disable-line no-unused-vars
  // MOS-00009.
}

/**
 * Re-derive waves by grouping the schedule on its `(inAt, outAt)` pair.
 *
 * Two groups landing on the same time pair merge, and that is harmless — the
 * consumer cares about timing, not identity, and §7's
 * `(inWave, outWave, restTone, paintColour)` cache key wants exactly that
 * merge. Keep `Schedule` flat and keyed by `cellIndex`; do not add a group id.
 */
export function wavesFrom(schedule) { // eslint-disable-line no-unused-vars
  // MOS-00009.
}
