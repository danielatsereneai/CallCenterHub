import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const mimeTypes = new Map([
    ['.css', 'text/css; charset=utf-8'],
    ['.html', 'text/html; charset=utf-8'],
    ['.js', 'text/javascript; charset=utf-8'],
    ['.json', 'application/json; charset=utf-8'],
]);

const server = createServer(async (request, response) => {
    try {
        const url = new URL(request.url || '/', 'http://127.0.0.1');
        const requestedPath = url.pathname === '/' ? '/index.html' : url.pathname;
        const filePath = normalize(join(root, requestedPath));

        if (!filePath.startsWith(root)) {
            response.writeHead(403);
            response.end('Forbidden');
            return;
        }

        const body = await readFile(filePath);
        response.writeHead(200, {
            'Content-Type': mimeTypes.get(extname(filePath)) || 'application/octet-stream',
            'Cache-Control': 'no-store',
        });
        response.end(body);
    } catch {
        response.writeHead(404);
        response.end('Not found');
    }
});

await new Promise(resolveListen => server.listen(0, '127.0.0.1', resolveListen));

try {
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}`;
    const fetchText = async path => {
        const response = await fetch(`${baseUrl}${path}`);
        assert.equal(response.status, 200, `${path} should load`);
        return response.text();
    };

    const indexHtml = await fetchText('/');
    assert.match(indexHtml, /<form class="auth-card" id="loginForm">/);
    assert.match(indexHtml, /id="mainNavList"/);
    assert.match(indexHtml, /id="taskModal"/);
    assert.match(indexHtml, /id="knowledgeTabs"/);
    assert.match(indexHtml, /id="taskAttachmentCurrent"/);
    assert.doesNotMatch(indexHtml, /Systems|Command Center User|Command User/);

    const scriptHtml = indexHtml.match(/<script type="module" src="([^"]+)"/);
    const runtimeConfigHtml = indexHtml.match(/<script src="(config\.runtime\.js)"><\/script>/);
    assert.ok(runtimeConfigHtml?.[1], 'index.html should load runtime config before the app module');
    assert.ok(scriptHtml?.[1], 'index.html should reference a module script');

    const runtimeConfig = await fetchText(`/${runtimeConfigHtml[1]}`);
    assert.match(runtimeConfig, /globalThis\.LIFE_AT_PERCH_CONFIG/);

    const scriptJs = await fetchText(`/${scriptHtml[1]}`);
    const importedModules = [...scriptJs.matchAll(/from ['"](\.\/modules\/[^'"]+)['"]/g)]
        .map(match => match[1].replace('./', '/'));

    assert.ok(importedModules.length >= 6, 'script.js should import app modules');
    await Promise.all(importedModules.map(path => fetchText(path)));

    const headers = await fetchText('/_headers');
    assert.match(headers, /Content-Security-Policy:/);
    assert.match(headers, /frame-ancestors 'none'/);

    console.log(`Static smoke passed at ${baseUrl}`);
} finally {
    await new Promise(resolveClose => server.close(resolveClose));
}
