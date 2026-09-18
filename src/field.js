/**
 * The SVG field render — spec §1, §4. MOS-00003.
 *
 * One <rect> per square, always present: painting changes a square's colour,
 * it never creates or destroys one. SVG/DOM rather than canvas (MOS-00001
 * decision 2) so the editor and the export share one coordinate model and
 * §10's keyboard reachability comes from the platform.
 *
 * Geometry keys off `pitch(canvas)`. Note the editor's extent and the export's
 * differ on purpose — the export adds a trailing gutter so two copies tile
 * (§7) — so do not copy one into the other.
 */

export function renderField(host, state) { // eslint-disable-line no-unused-vars
  // MOS-00003.
}
