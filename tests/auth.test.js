import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSessionStore } from '../modules/auth.js';

function createStorage() {
    const store = new Map();
    return {
        getItem: key => store.has(key) ? store.get(key) : null,
        setItem: (key, value) => store.set(key, String(value)),
        removeItem: key => store.delete(key),
    };
}

test('auth sessions are stored in sessionStorage and legacy localStorage auth is cleared', () => {
    globalThis.localStorage = createStorage();
    globalThis.sessionStorage = createStorage();

    const session = createSessionStore({
        authStorageKey: 'auth',
    });

    session.persistAuthSession({
        token: 'pb-token',
        record: { id: 'user-1', email: 'user@example.com' },
    });

    assert.equal(globalThis.localStorage.getItem('auth'), null);
    assert.match(globalThis.sessionStorage.getItem('auth'), /pb-token/);
    assert.deepEqual(session.hydrateAuthSession(), {
        token: 'pb-token',
        record: { id: 'user-1', email: 'user@example.com' },
    });

    globalThis.localStorage.setItem('auth', JSON.stringify({ token: 'old-token', record: { id: 'old' } }));
    globalThis.sessionStorage.removeItem('auth');

    assert.equal(session.hydrateAuthSession().token, 'old-token');
    assert.equal(globalThis.localStorage.getItem('auth'), null);
});
