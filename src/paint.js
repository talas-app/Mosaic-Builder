/**
 * Paint, erase and drag — spec §3 paint-order rules, §5. MOS-00004.
 *
 * The rules that are easy to get wrong, all from §3:
 *   - Painting unpainted squares APPENDS ONE GROUP per action. A click appends
 *     a group of one; a flood fill appends a group of many.
 *   - Recolouring already-painted squares leaves `paintOrder` untouched. The
 *     order records where the hand went; editing colour must not reshuffle the
 *     animation.
 *   - Erasing REMOVES entries, and an emptied group is dropped. Erase is a
 *     tool, not a colour — "paint the resting colour" leaves the square in
 *     `paintOrder` and is therefore wrong (§5).
 *   - Drag-painting appends squares as SEPARATE groups in pointer order: it is
 *     a continuous gesture, not a bulk action.
 */

export function paintCells(state, indices, colour) { // eslint-disable-line no-unused-vars
  // MOS-00004.
}

export function eraseCells(state, indices) { // eslint-disable-line no-unused-vars
  // MOS-00004.
}
