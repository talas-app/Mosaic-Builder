/**
 * state ↔ URL fragment. MOS-00014.
 *
 * MOS-00001 decision 5: the URL is the save file and the link is the
 * credential. There are no accounts and no backend, so this is the only
 * persistence the tool has.
 *
 * It exists at scaffold time — ahead of its own ticket — for one reason: a
 * state shape that cannot round-trip through a URL is a problem discovered far
 * too late if `url.js` arrives last. Right now it round-trips `serialise` /
 * `deserialise` and nothing more.
 *
 * What MOS-00014 adds, and why each is not an implementation detail:
 *   - The FRAGMENT, never a query string. A fragment is not sent to the
 *     server, which is the mechanism behind "nothing leaves the browser" —
 *     that claim is one the code has to earn.
 *   - CompressionStream('deflate-raw') with feature detection, then base64url
 *     (`-`/`_`), over the SAME bytes `src/state.js` produces.
 *   - `history.replaceState`, throttled — not `pushState`, which would make
 *     every brush stroke a back-button step.
 *
 * The budget is ~2000 characters: browsers accept far more, but Slack, mail
 * clients and QR codes truncate well below. That ceiling and MOS-00001's
 * 64x64 grid cap are the same decision.
 */

import { serialise, deserialise } from './state.js';

/** Read a document from `location.hash`, or null if there isn't one. */
export function readFromUrl(hash = location.hash) {
  const payload = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!payload) return null;
  return deserialise(decodeURIComponent(payload));
}

/** Write the document to `location.hash`. MOS-00014 compresses this. */
export function writeToUrl(state) {
  const payload = encodeURIComponent(serialise(state));
  history.replaceState(null, '', `#${payload}`);
}
