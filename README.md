# X-ray Inspector

An experimental, framework-free browser inspector for computed layout evidence.
It measures live DOM geometry, labels provenance honestly, runs bounded design and
accessibility quick checks, and exports a redacted JSON record.

This repository contains `src/` (core and overlay), `demo/` (self-contained
review page), `extension/` (unpacked Chromium Manifest V3 prototype), and `test/`.

## Try the demo

```sh
npm test
python3 -m http.server 4173
```

Open `http://localhost:4173/demo/`. Select **Start inspecting**, then click an
element to pin it. The deliberately compact target demonstrates a diagnostic.
Escape unpins; Escape again closes.

## Try the extension

1. Run `npm run build:extension`.
2. Open `chrome://extensions`, enable Developer mode, and choose **Load unpacked**.
3. Select this repository's `extension/` directory.
4. Click the toolbar action on an ordinary page.

The extension requests only `activeTab` and `scripting`, injects only after the
toolbar click, targets the main frame in Chrome's default isolated world, stores
nothing, and makes no network requests. It does not run on browser-managed pages.

## Evidence and limitations

Safe export omits text, HTML, form values, URLs, ids, classes, images, and query
strings. Computed CSS is not authored-rule or token provenance. Contrast is only
checked when the foreground and background are both opaque. Cross-origin frames,
closed shadow roots, SVG, transforms, writing modes, zoom, and fragmented inline
boxes need broader browser fixtures. Quick checks do not replace axe, assistive
technology testing, or design review. See [architecture](docs/ARCHITECTURE.md).

## License status

No license has been granted yet. The source is public for review, but it is not
open source in the OSI sense until ownership is confirmed and a license is added.
MIT and Apache-2.0 are under consideration; Apache-2.0 includes an express patent
grant. Do not redistribute or publish packages derived from this repository until
that decision is recorded.
