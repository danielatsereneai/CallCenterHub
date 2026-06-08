import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    escapeHtml,
    getUserBoardName,
    normalizeAssignmentValue,
    normalizeTaskStatus,
    parseTaskJson,
} from '../modules/utils.js';

test('escapeHtml escapes browser-significant characters', () => {
    assert.equal(escapeHtml('<img src=x onerror=alert("x")>'), '&lt;img src=x onerror=alert(&quot;x&quot;)&gt;');
});

test('normalizeTaskStatus handles known aliases', () => {
    assert.equal(normalizeTaskStatus('To Do'), 'todo');
    assert.equal(normalizeTaskStatus('done'), 'completed');
    assert.equal(normalizeTaskStatus('unknown'), 'new');
});

test('getUserBoardName maps supported org identifiers to board names', () => {
    assert.equal(getUserBoardName({ org_id: 'Perch' }), 'PerchGroup');
    assert.equal(getUserBoardName({ org: 'aci' }), 'ACI');
});

test('parseTaskJson safely handles objects, JSON strings, and invalid JSON', () => {
    assert.deepEqual(parseTaskJson({ a: 1 }), { a: 1 });
    assert.deepEqual(parseTaskJson('{"a":1}'), { a: 1 });
    assert.deepEqual(parseTaskJson('{bad'), {});
});

test('normalizeAssignmentValue supports relation arrays and expanded objects', () => {
    assert.equal(normalizeAssignmentValue(['user-1']), 'user-1');
    assert.equal(normalizeAssignmentValue({ id: 'user-2', email: 'x@example.com' }), 'user-2');
});
