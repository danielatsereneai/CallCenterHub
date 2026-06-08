import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('Cloudflare headers define a restrictive baseline policy', () => {
    const headers = read('_headers');
    assert.match(headers, /Content-Security-Policy:/);
    assert.match(headers, /frame-ancestors 'none'/);
    assert.match(headers, /connect-src 'self' https:\/\/api\.sereneai\.co\.uk https:\/\/pocketbase\.sereneai\.co\.uk/);
    assert.match(headers, /X-Content-Type-Options: nosniff/);
});

test('stale manual PocketBase token controls are removed from runtime wiring', () => {
    const app = `${read('index.html')}\n${read('script.js')}\n${read('modules/ui.js')}\n${read('modules/tasks.js')}`;
    assert.doesNotMatch(app, /taskPanelToken/);
    assert.doesNotMatch(app, /pocketbaseToken/);
    assert.doesNotMatch(app, /refreshTasksButton/);
});

test('runtime config is loaded before the app module', () => {
    const indexHtml = read('index.html');
    assert.match(indexHtml, /<script src="config\.runtime\.js"><\/script>\s*<script type="module" src="script\.js"><\/script>/);
    assert.match(read('config.runtime.js'), /globalThis\.LIFE_AT_PERCH_CONFIG/);
});

test('task attachment removal control is present', () => {
    const indexHtml = read('index.html');
    const taskCode = read('modules/tasks.js');
    const pbClient = read('modules/pocketbaseClient.js');

    assert.match(indexHtml, /id="taskAttachmentRemove"/);
    assert.match(taskCode, /removeAttachment/);
    assert.match(pbClient, /payload\.attatchemnt = null/);
});

test('legacy Command Center user branding is removed', () => {
    const app = `${read('index.html')}\n${read('modules/utils.js')}`;
    assert.doesNotMatch(app, /Command Center User|Command User/);
    assert.match(app, /Life@Perch User/);
});
