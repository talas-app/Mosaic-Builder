/**
 * The select tool — spec §5. MOS-00007.
 *
 * Separate tool from paint; click is not overloaded. Click, shift-click,
 * marquee drag, and select-by-colour. Operations: set fill, clear, nudge,
 * copy/paste, invert, select-all-painted — and nudging moves entries within
 * `paintOrder` too (§3), which is the part that gets forgotten.
 *
 * Selection renders as a per-square outline, not one boundary around the
 * region: unified looks better until the selection is disjoint.
 */

export function createSelection() {
  // MOS-00007.
}
