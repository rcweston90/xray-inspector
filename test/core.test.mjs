import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { analyzeReading, createEvidence } from '../src/xray.mjs';

const reading = {
  schemaVersion: 1,
  target: { tag: 'input', component: null, selector: 'main > input', boundaryProvenance: 'unavailable' },
  viewport: { width: 1000, height: 700, devicePixelRatio: 2 },
  geometry: { width: 320, height: 44, provenance: 'computed' },
  typography: { family: 'system-ui', provenance: 'computed' },
  colour: { foreground: 'rgb(0, 0, 0)', provenance: 'computed' },
  semantics: { interactive: true, accessibleNamePresent: false, disabled: false, role: null },
  constraints: { viewportOverflow: { right: 0, left: 0 }, contentOverflow: { horizontal: false, vertical: false, overflowX: 'visible', overflowY: 'visible' } },
};

test('portable evidence defaults to a narrow redacted schema', () => {
  const evidence = createEvidence(reading);
  const json = JSON.stringify(evidence);
  assert.equal(evidence.privacy.text, 'omitted');
  assert.equal(evidence.privacy.formValues, 'omitted');
  assert.equal(evidence.privacy.urls, 'omitted');
  assert.equal(evidence.privacy.telemetry, 'none');
  assert.ok(!json.includes('textContent'));
  assert.ok(!json.includes('value'));
  assert.ok(!('page' in evidence));
  assert.equal(evidence.diagnostics.findings[0].id, 'accessible-name');
});

test('diagnostics explain accessibility, geometry, clipping, contrast, and type risks', () => {
  const diagnostics = analyzeReading({
    ...reading,
    geometry: { width: 30, height: 20, provenance: 'computed' },
    typography: { size: 16, weight: '400', lineHeight: 16, provenance: 'computed' },
    colour: { foreground: 'rgb(120, 120, 120)', background: 'rgb(255, 255, 255)', provenance: 'computed' },
    constraints: { viewportOverflow: { right: 12, left: 0 }, contentOverflow: { horizontal: true, vertical: false, overflowX: 'hidden', overflowY: 'visible' } },
  });
  assert.deepEqual(diagnostics.findings.map((finding) => finding.id), [
    'accessible-name', 'target-size', 'viewport-overflow', 'clipped-content', 'text-contrast', 'line-height',
  ]);
  assert.equal(diagnostics.contrastRatio, 4.4);
});

test('standalone demo inlines the exact portable runtime with no subresource dependency', async () => {
  const [source, html] = await Promise.all([
    readFile(new URL('../src/xray.mjs', import.meta.url), 'utf8'),
    readFile(new URL('../demo/index.html', import.meta.url), 'utf8'),
  ]);
  const inline = html.split('/* XRAY_RUNTIME_START */\n')[1]?.split('\n/* XRAY_RUNTIME_END */')[0];
  assert.equal(inline, source.trim(), 'run npm run xray:demo after changing the portable runtime');
  assert.ok(!html.includes("import { mountXRay }"));
});
