import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { api } from './api';

const originalFetch = globalThis.fetch;
after(() => { globalThis.fetch = originalFetch; });

test('HTML returned by a stale frontend server becomes a recoverable API error', async () => {
  globalThis.fetch = async () => new Response('<!DOCTYPE html><html></html>', {
    status: 200, headers: { 'Content-Type': 'text/html' },
  });
  const result = await api.get('/api/identity/auth/me');
  assert.equal(result.ok, false);
  assert.equal(result.error?.code, 'invalid_response');
});

test('successful JSON and empty responses retain the API contract', async () => {
  globalThis.fetch = async () => new Response('{"count":3}', { status: 200 });
  assert.deepEqual(await api.get('/api/projects'), { ok: true, value: { count: 3 } });
  globalThis.fetch = async () => new Response(null, { status: 204 });
  assert.deepEqual(await api.get('/api/empty'), { ok: true, value: undefined });
});

test('connection failures return an error instead of throwing during session restoration', async () => {
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
  const result = await api.get('/api/identity/auth/me');
  assert.equal(result.ok, false);
  assert.equal(result.error?.code, 'network');
});
