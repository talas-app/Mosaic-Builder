# Decisions

The short decision note §10 of the spec asks for. Each entry states the
constraint it answers, so a contributor can tell *why* without having to ask.

`spec/pixel-mosaic-plan.md` is the authority. Where a decision below resolves
something the spec left open — or, in one case, overrules a stale README — it
says so.

Ratified 2026-09-18.

## 1. Colours are free-form. §1 governs

The README described this as a tool for illustrations "in the Talas brand
style". Spec §1 says it is "a public tool, released for anyone to use" where
"colours are free-form, with no fixed or brand-locked palette anywhere".

**§1 wins.** There is no brand palette, no design tokens and no locked swatches
anywhere in the artwork path. Any product styling is confined to the app chrome
and never reaches the mosaic — which is why `styles.css` carries no colour that
a square can render.

## 2. The editor renders as SVG/DOM, not canvas

One `<rect>` per square, the same coordinate model the export uses (§7), so the
geometry is written once instead of twice. Hit-testing, focus and keyboard
reachability come from the platform.

*Constraint answered:* §10 requires the tool to be keyboard-reachable. On canvas
that is a project of its own.

## 3. Grids are capped at 64 × 64

4,096 squares. Beyond that, both the DOM node count and the share link stop
being comfortable — see decision 5, which is really the same decision. The
default stays 24 × 24.

## 4. ES modules over http. No build step. `file://` is not supported

§10 asks for three things — no build step, works from a file on disk, real
modules — and you can hold two. A browser refuses `import` over `file://`,
because the module fetch is a cross-origin request from a null origin.

**`file://` is the one dropped**, since decision 5 makes the tool a hosted URL
anyway and a local file has no route to revisit. `index.html` plus `src/*.js`
loaded with `<script type="module">`; any static server will do, and
`make serve` is one. Opening the page from disk shows an explanation rather than
failing silently.

*Rejected:* one inlined `<script>` with no modules (holds all three constraints,
gives up the module layout twelve tickets are written against), and a build step
that inlines (gives up "no build step" for a `file://` capability decision 5
makes pointless).

## 5. The URL is the save file, and the link is the credential

No accounts, no backend. A visitor opens the page, makes a mosaic, and keeps the
URL to return to it. Anyone holding the link can open and edit it — the state
*is* the link, so the link is inherently the secret.

*Rejected:* gating reopening behind an email address. On static hosting the
payload is in the link, so a JavaScript prompt is bypassed with View Source and
protects nothing. A real gate needs a server, a database and a mail provider,
which would end "no backend, no server-side anything" and rule out GitHub Pages.

*Consequence:* the document must stay small enough to paste. The practical
ceiling is ~2,000 characters — browsers accept far more, but chat clients, mail
clients and QR codes truncate well below.

## 6. Hosted publicly on GitHub Pages

From `talas-app/Mosaic-Builder`, served from the default branch root. The repo
is public and MIT-licensed, so a visitor has the right to use and fork what they
find.
