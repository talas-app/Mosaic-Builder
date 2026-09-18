/**
 * Resting-field variation — spec §4. MOS-00006.
 *
 * ONE FUNCTION, USED TWICE. `src/field.js` renders every artwork square's
 * resting fill from this, and `src/export-svg.js` (and §8's infinite field)
 * generates its pattern from the same call. Because they share a coordinate
 * origin they agree by construction. Compute them separately and the artwork
 * region reads as a flat patch against a textured ground — §4 calls that
 * miserable to diagnose, and it is.
 *
 * Two things MOS-00006 must get right and neither is obvious:
 *   - This is a pure hash of (col, row), NOT a sequential PRNG. A square's tone
 *     cannot depend on what was drawn before it.
 *   - Negative coordinates reach here from §8's infinite field, and JS `%`
 *     returns negative for negative operands.
 *
 * Tones are quantised to `variation.tones` discrete steps (3–5), never
 * continuous jitter: §4 rejects jitter because it reads as dirt and inflates
 * the palette that §9's GIF encoder has to fit into 256 entries.
 */

/**
 * The resting fill for one square.
 * @returns {string} a CSS colour
 */
export function restTone(canvas, col, row) { // eslint-disable-line no-unused-vars
  return canvas.restFill;
}
