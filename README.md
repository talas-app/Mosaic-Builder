# Pixel Mosaic

A single-page tool for drawing on a field of squares and exporting the result as
an **animated SVG**, where squares change colour one group at a time to reveal
an image and then return to rest.

There is one static image. The animation is *derived, not authored* — the motion
comes from the order and timing in which squares change colour, so the
choreography falls out of how you drew.

Colours are free-form. There is no fixed or brand-locked palette anywhere.

No accounts, no backend, no server-side anything: the document lives in the URL,
so saving is keeping the link and sharing is sending it.

## Running it

There is no build step and nothing to install.

```sh
make serve          # then open http://localhost:8000
```

That is `python3 -m http.server` — any static file server works just as well. If
you would rather not install Python, `make serve-docker` runs nginx in a
container instead.

**It has to be served over http.** Opening `index.html` straight from the
filesystem will not work: browsers refuse to load JavaScript modules over
`file://`. The page says so if you try. See decision 4 in
[`DECISIONS.md`](DECISIONS.md).

## Layout

| Path | What lives there |
| --- | --- |
| `index.html` | The page shell. Loads `src/main.js` as a module. |
| `src/state.js` | The document model, and the one serialiser. |
| `src/field.js` | The SVG field render. |
| `src/rest.js` | `restTone(col, row)` — the resting-field texture. |
| `src/paint.js`, `src/select.js`, `src/palette.js`, `src/history.js` | Editing. |
| `src/schedule.js` | Ordering and timing. **The seam.** |
| `src/export-svg.js`, `src/import-svg.js` | The SVG round-trip. |
| `src/url.js` | The document ↔ the URL fragment. |

Two structural rules, both worth knowing before changing anything:

- **`schedule.js` is the seam.** Everything upstream produces `paintOrder`;
  every exporter consumes only the `Schedule` and knows nothing about ordering.
  This is what keeps a future GIF encoder from having to reverse-engineer the
  animation out of a generated SVG string.
- **`restTone` is one function used twice** — by the editor and by the export.
  Two copies drift, and the symptom is an artwork that reads as a flat patch
  against a textured ground.

## Documents

- [`spec/pixel-mosaic-plan.md`](spec/pixel-mosaic-plan.md) — the spec, and the
  authority. Where it states a decision, the decision is made.
- [`DECISIONS.md`](DECISIONS.md) — what has been decided since, and why.

## Licence

MIT. See [`LICENSE`](LICENSE).
