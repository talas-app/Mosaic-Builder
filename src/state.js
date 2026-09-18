/**
 * The document model — spec §3.
 *
 * Three separate groups, and they stay separate both here and in the
 * serialised form: `canvas` and `motion` are shared, `content` is the part a
 * future multi-frame mode duplicates. Flattening them into one bag is what
 * makes frames expensive later, which is the whole reason §3 splits them.
 *
 * `pitch` is derived, never stored. See `pitch()` below.
 */

export const VERSION = 1;

/** Sentinel for an unpainted cell. Spec §3 uses "" in `content.cells`. */
export const UNPAINTED = '';

/**
 * A new document at the defaults.
 *
 * The defaults matter more than they look: §10 notes most visitors will never
 * open a settings panel, so first load *is* the product for them.
 */
export function createState({ cols = 24, rows = 24 } = {}) {
  return {
    version: VERSION,
    canvas: {
      cols,
      rows,
      squareSize: 24,
      gutter: 2,
      restFill: '#2A2440',
      gapColor: '#161226',
      variation: { amount: 0.06, tones: 4, seed: 91823 },
    },
    content: {
      // Flat, indexed `row * cols + col` (§3).
      cells: new Array(cols * rows).fill(UNPAINTED),
      // GROUPS of cell indices, in paint order — not a flat list of cells.
      // The maintenance rules in §3 are owned by MOS-00004 (paint/erase) and
      // MOS-00005 (undo must restore this, not just `cells`).
      paintOrder: [],
    },
    motion: {
      inOrder: 'draw',
      outOrder: 'reverse',
      // Separate from `canvas.variation.seed` on purpose: reshuffling the
      // animation must not rearrange the resting texture (§4).
      seed: 428173,
      revealDuration: 3.0,
      hold: 1.5,
      concealDuration: 2.0,
      pause: 0.5,
      cellFade: 0.1,
      loop: true,
    },
  };
}

/**
 * `pitch = squareSize + gutter`, derived everywhere and stored nowhere (§3/§4).
 *
 * Storing it lets the two drift, and the symptom is geometry that is subtly
 * wrong in the export but right in the editor, or vice versa.
 */
export function pitch(canvas) {
  return canvas.squareSize + canvas.gutter;
}

/** Cell index from coordinates, and back. Flat, `row * cols + col`. */
export function indexOf(canvas, col, row) {
  return row * canvas.cols + col;
}

export function coordsOf(canvas, index) {
  return { col: index % canvas.cols, row: Math.floor(index / canvas.cols) };
}

/**
 * Serialise to a string.
 *
 * This is the one encoding of the document, and both persistence paths go
 * through it: `src/url.js` compresses and base64url-encodes *this output*, and
 * `src/export-svg.js` embeds *this output* raw in the SVG's <metadata>. One
 * codec, so `version` and any future migration live in exactly one place —
 * two encoders drifting apart is how a share link and an exported file stop
 * agreeing about the same document.
 */
export function serialise(state) {
  return JSON.stringify(state);
}

/**
 * Parse a serialised document back into state.
 *
 * Deliberately minimal for now. MOS-00011 needs real validation here, because
 * an imported SVG is input this tool did not write — a `cols` of 1000000 hangs
 * the tab. Trusting the payload is fine while the only producer is `serialise`
 * above; it stops being fine the moment a file from elsewhere reaches it.
 */
export function deserialise(text) {
  const parsed = JSON.parse(text);
  if (parsed.version !== VERSION) {
    throw new Error(`Unsupported document version: ${parsed.version}`);
  }
  return parsed;
}
