/**
 * Schedule → animated SVG — spec §7. MOS-00010.
 *
 * Imports `src/schedule.js` and `src/rest.js` and NOTHING ELSE from the app.
 * It must never read `state.content.paintOrder`; that is what §2's seam means
 * in practice, and it is checkable by grep.
 *
 * The parts §7 says to read before implementing:
 *   - Animate `fill`, not opacity, with PER-GROUP @keyframes. Two animations
 *     on one element backwards-fill the out-state from time zero; a shared
 *     keyframe with per-square delay makes a travelling wave instead of a
 *     reveal. Neither is a near miss.
 *   - Percentages are computed against the total cycle, and the timing
 *     function is stated as `linear` explicitly — the default `ease` distorts
 *     a transition whose timing is already encoded in the percentages.
 *   - CSS in a <style> block. Not SMIL, not JS: CSS keyframes survive an <img>
 *     tag, a CSS background and a GitHub README.
 *   - `shape-rendering="crispEdges"`, or adjacent rects antialias their shared
 *     edges into hairline seams that get reported as a rendering fault.
 *   - The resting tone is per-square when variation is on, so key the keyframe
 *     block cache on `(inWave, outWave, restTone, paintColour)`.
 *   - Embed `serialise(state)` in <metadata> — §7's round-trip, and the same
 *     bytes `src/url.js` encodes. One codec, in `src/state.js`.
 *
 * Export bounds, and note this DIFFERS from the editor's extent on purpose:
 *   width = cols * pitch + gutter, first square at (gutter, gutter),
 * so two copies placed edge to edge give one continuous lattice rather than a
 * double gap. Comment it at the calculation — it reads as an off-by-one.
 */

export function exportSvg(state) { // eslint-disable-line no-unused-vars
  // MOS-00010.
}
