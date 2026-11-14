import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import vm from 'node:vm';
import { activateXRay } from '../extension/service-worker.mjs';

const packageUrl = new URL('../', import.meta.url);

function fakeApi({ reject = false, result = 'opened' } = {}) {
  const calls = [];
  return {
    calls,
    scripting: {
      async executeScript(options) {
        calls.push(['executeScript', options]);
        if (reject) throw new Error('Cannot access this page');
        return [{ frameId: 0, result }];
      },
    },
    action: {
      async setBadgeBackgroundColor(options) { calls.push(['setBadgeBackgroundColor', options]); },
      async setBadgeText(options) { calls.push(['setBadgeText', options]); },
      async setTitle(options) { calls.push(['setTitle', options]); },
    },
  };
}

function pageRealm() {
  const listeners = new Map();
  const controls = new Map();
  const control = () => ({
    style: {},
    addEventListener(type, callback) { this[`on${type}`] = callback; },
  });
  const shadow = {
    set innerHTML(value) { this.markup = value; },
    querySelector(selector) {
      if (!controls.has(selector)) controls.set(selector, control());
      return controls.get(selector);
    },
  };
  const root = {
    dataset: {},
    attachShadow() { return shadow; },
    contains(node) { return node === root; },
    remove() { this.removed = true; },
  };
  const eventTarget = {
    addEventListener(type, callback) { listeners.set(type, callback); },
    removeEventListener(type) { listeners.delete(type); },
  };
  const document = {
    ...eventTarget,
    body: {},
    documentElement: { append(node) { node.appended = true; } },
    createElement() { return root; },
  };
  const window = { ...eventTarget, innerWidth: 1200, innerHeight: 800, devicePixelRatio: 2 };
  const context = vm.createContext({
    document,
    window,
    Element: class Element {},
    CSS: { escape: String },
    Blob,
    URL,
    setTimeout,
    console,
  });
  return { context, listeners, root };
}

test('manifest requests temporary access without hosts, tabs, or persistent content scripts', async () => {
  const manifest = JSON.parse(await readFile(new URL('extension/manifest.json', packageUrl), 'utf8'));
  assert.deepEqual(manifest.permissions, ['activeTab', 'scripting']);
  assert.equal(manifest.host_permissions, undefined);
  assert.equal(manifest.optional_host_permissions, undefined);
  assert.equal(manifest.content_scripts, undefined);
  assert.equal(manifest.web_accessible_resources, undefined);
});

test('activation injects only the isolated main frame by default', async () => {
  const api = fakeApi();
  const outcome = await activateXRay({ id: 42 }, api);
  assert.deepEqual(outcome, { ok: true, state: 'opened' });
  const injection = api.calls.find(([name]) => name === 'executeScript')[1];
  assert.deepEqual(injection, { target: { tabId: 42 }, files: ['content.js'] });
  assert.equal(injection.target.allFrames, undefined);
  assert.equal(injection.world, undefined);
});

test('restricted-page denial is contained and shown without reading the page URL', async () => {
  const api = fakeApi({ reject: true });
  const scheduled = [];
  const outcome = await activateXRay({ id: 9 }, api, (callback, delay) => scheduled.push({ callback, delay }));
  assert.deepEqual(outcome, { ok: false, reason: 'injection-denied' });
  assert.equal(scheduled[0].delay, 3000);
  assert.ok(api.calls.some(([name, value]) => name === 'setBadgeText' && value.text === 'NO'));
  assert.equal(api.calls.some(([, value]) => 'url' in value), false);
  scheduled[0].callback();
});

test('generated content has toggle cleanup and retains safe evidence defaults', async () => {
  const content = await readFile(new URL('extension/content.js', packageUrl), 'utf8');
  assert.match(content, /activeCleanup\(\);\s+return 'closed'/);
  assert.match(content, /return 'opened'/);
  assert.match(content, /text: 'omitted', html: 'omitted', formValues: 'omitted', urls: 'omitted'/);
  assert.match(content, /identifiers: 'omitted', images: 'omitted', telemetry: 'none'/);
  assert.match(content, /provenance: 'computed'/);
  assert.doesNotMatch(content, /fetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket/);
});

test('repeated activation cleans up, while a new document starts inactive', async () => {
  const content = await readFile(new URL('extension/content.js', packageUrl), 'utf8');
  const firstDocument = pageRealm();
  assert.equal(vm.runInContext(content, firstDocument.context), 'opened');
  assert.equal(firstDocument.root.appended, true);
  assert.equal(vm.runInContext(content, firstDocument.context), 'closed');
  assert.equal(firstDocument.root.removed, true);
  assert.equal(firstDocument.listeners.size, 0);

  const navigatedDocument = pageRealm();
  assert.equal(vm.runInContext(content, navigatedDocument.context), 'opened');
  assert.equal(navigatedDocument.root.appended, true);
});
