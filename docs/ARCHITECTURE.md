# Architecture

The portable boundary has three layers:

1. **Core:** DOM measurement, versioned evidence, redaction policy, and explainable
   diagnostics. `getComputedStyle()` values are marked `computed`.
2. **Overlay:** selection, highlight, facts, findings, copy/download, and complete
   listener/node cleanup in an open shadow root.
3. **Adapters:** the extension is the first adapter. Hosts may declare stable
   component boundaries with `data-xray-component`; framework-private trees are
   not treated as ground truth.

The extension uses `activeTab` plus `scripting`, with no host permissions or
persistent content script. Generated `extension/content.js` contains the same
core used by the demo. `npm run check` regenerates artifacts, tests behavior, and
fails if generated files drift.

## Next priorities

- Playwright geometry/privacy fixtures across Chromium, Firefox, and WebKit.
- Box-model layers and between-element measurement.
- Keyboard-driven traversal and stronger screen-reader announcements.
- Optional CSSOM/source-map and axe adapters with explicit provenance.
- Schema validation and migrations for diffable evidence bundles.

Remote collaboration must remain optional and off by default. Define retention,
consent, and redaction before adding any hosted sharing feature.
