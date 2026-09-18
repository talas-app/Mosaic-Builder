/**
 * The colour sidebar — spec §5. MOS-00008.
 *
 * Colours currently used, with counts. Click a swatch to select every square
 * using it; change a swatch to recolour globally (safe by construction, since
 * §3 keeps `paintOrder` untouched by recolouring). Swatch order is not
 * decoration — it drives the `colour` ordering in §6, and `src/schedule.js`
 * reads it.
 *
 * COLOUR GROUPS AND PAINT GROUPS ARE DIFFERENT THINGS (§5). This file groups
 * by colour, a property of the current image; `paintOrder` groups by gesture,
 * a record of history. Merging them silently breaks the choreography.
 */

export function usedColours(state) { // eslint-disable-line no-unused-vars
  // MOS-00008.
}
