/**
 * Undo / redo — spec §3, §5. MOS-00005.
 *
 * Must restore `content.paintOrder`, not just `content.cells`. §3 names this
 * the easiest thing here to get wrong: the artwork looks correct after an undo
 * while the animation quietly no longer matches it.
 */

export function createHistory(state) { // eslint-disable-line no-unused-vars
  // MOS-00005.
}
