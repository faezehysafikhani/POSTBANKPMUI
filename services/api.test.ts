import { test, after } from 'node:test';
import assert from 'node:assert/strict';
// The client reads the page's address (window.location) to decide how the refresh token travels; Node has no window.
(globalThis as any).window ??= { location: { protocol: 'https:', hostname: 'localhost' } };

import { api, refreshSession, sessionEvents, tokenStore } from './api';
import { invalidateSharedReads } from '../tmpb/utils/sharedRead';

const originalFetch = globalThis.fetch;
after(() => { globalThis.fetch = originalFetch; });

/** A fetch double that counts calls per "METHOD path" and lets each test decide the answer. */
function stubFetch(answer: (method: string, path: string, init: RequestInit) => Response | Promise<Response>) {
  const calls: string[] = [];
  globalThis.fetch = (async (input: any, init: RequestInit = {}) => {
    const path = new URL(String(input), 'http://x').pathname + new URL(String(input), 'http://x').search;
    const method = (init.method ?? 'GET').toUpperCase();
    calls.push(`${method} ${path}`);
    return answer(method, path, init);
  }) as typeof fetch;
  return calls;
}
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status });
const tick = () => new Promise(resolve => setTimeout(resolve, 5));
const reset = () => { tokenStore.clear(); invalidateSharedReads(); };

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

test('identical reads asked together are one request, and each caller gets its own copy', async () => {
  reset();
  const calls = stubFetch(async () => { await tick(); return json({ list: [3, 1, 2] }); });
  const [a, b, c] = await Promise.all([api.get<{ list: number[] }>('/api/x'), api.get<{ list: number[] }>('/api/x'), api.get<{ list: number[] }>('/api/x')]);
  assert.equal(calls.length, 1);
  a.value!.list.sort();
  assert.deepEqual(b.value!.list, [3, 1, 2], 'one caller editing its answer must not change another caller\'s');
  assert.deepEqual(c.value, { list: [3, 1, 2] });
});

test('reads that differ in query, user or working post stay separate requests', async () => {
  reset();
  const calls = stubFetch(async () => json({}));
  await Promise.all([api.get('/api/subordinates?all=false'), api.get('/api/subordinates?all=true')]);
  assert.equal(calls.length, 2);
  tokenStore.set('token-of-user-a');
  await api.get('/api/me');
  tokenStore.set('token-of-user-b');
  await api.get('/api/me');
  assert.equal(calls.filter(c => c === 'GET /api/me').length, 2, 'another user never joins or reuses the previous user\'s answer');
});

test('a read asked after a write never joins a read that began before it', async () => {
  reset();
  let version = 1;
  const calls = stubFetch(async (method) => {
    if (method === 'GET') { const seen = version; await tick(); return json({ version: seen }); }
    version = 2;
    return json({});
  });
  const before = api.get<{ version: number }>('/api/item');
  const write = api.put('/api/item', { name: 'new' });
  const after = api.get<{ version: number }>('/api/item');
  await Promise.all([before, write, after]);
  assert.equal(calls.filter(c => c === 'GET /api/item').length, 2);
  assert.equal((await after).value!.version, 2);
});

test('a failed read is shared with those waiting but never blocks the next one', async () => {
  reset();
  let fail = true;
  const calls = stubFetch(async () => { await tick(); return fail ? json({ title: 'conflict', detail: 'no' }, 409) : json({ ok: 1 }); });
  const [a, b] = await Promise.all([api.get('/api/y'), api.get('/api/y')]);
  assert.equal(a.ok, false);
  assert.equal(b.ok, false);
  assert.equal(calls.length, 1);
  fail = false;
  assert.equal((await api.get('/api/y')).ok, true);
  assert.equal(calls.length, 2);
});

test('with a lifetime the answer is reused, until a write or a sign-out', async () => {
  reset();
  const calls = stubFetch(async () => json({ n: 1 }));
  await api.get('/api/z', { ttlMs: 10_000 });
  await api.get('/api/z', { ttlMs: 10_000 });
  assert.equal(calls.length, 1);
  await api.post('/api/z/change');
  await api.get('/api/z', { ttlMs: 10_000 });
  assert.equal(calls.length, 3, 'the write, then a new read');
  tokenStore.clear();
  await api.get('/api/z', { ttlMs: 10_000 });
  assert.equal(calls.length, 4, 'a sign-out forgets what was kept');
});

test('writes are never merged: two identical POSTs are two requests', async () => {
  reset();
  const calls = stubFetch(async () => json({}));
  await Promise.all([api.post('/api/create', { a: 1 }), api.post('/api/create', { a: 1 })]);
  assert.equal(calls.length, 2);
});

test('a POST that only asks (api.read) is shared by body, and is not a write', async () => {
  reset();
  const calls = stubFetch(async (method, path) => { await tick(); if (path === '/api/slow') await tick(); return json([]); });
  await Promise.all([api.read('/api/for-projects', { projectIds: ['1'] }), api.read('/api/for-projects', { projectIds: ['1'] }), api.read('/api/for-projects', { projectIds: ['2'] })]);
  assert.equal(calls.length, 2);
  // It must not drop a read that is running.
  const running = api.get('/api/slow');
  await api.read('/api/for-projects', { projectIds: ['3'] });
  await api.get('/api/slow');
  await running;
  assert.equal(calls.filter(c => c === 'GET /api/slow').length, 1);
});

test('requests refused together with an expired token cause exactly one refresh, then all succeed', async () => {
  reset();
  tokenStore.set('old');
  const calls = stubFetch(async (method, path, init) => {
    if (path === '/api/identity/auth/refresh') { await tick(); return json({ accessToken: 'new' }); }
    const authorization = (init.headers as Record<string, string>)?.Authorization;
    return authorization === 'Bearer new' ? json({ path }) : json({}, 401);
  });
  const results = await Promise.all(['/api/a', '/api/b', '/api/c', '/api/d'].map(path => api.get<{ path: string }>(path)));
  assert.ok(results.every(r => r.ok));
  assert.equal(calls.filter(c => c.includes('/auth/refresh')).length, 1);
});

test('a request refused with the old token after the refresh finished retries with the new one, without a second refresh', async () => {
  reset();
  tokenStore.set('old');
  let release!: () => void;
  const late = new Promise<void>(resolve => { release = resolve; });
  const calls = stubFetch(async (method, path, init) => {
    if (path === '/api/identity/auth/refresh') return json({ accessToken: 'new' });
    const authorization = (init.headers as Record<string, string>)?.Authorization;
    if (authorization === 'Bearer new') return json({ path });
    if (path === '/api/late') await late; // answered 401 only after the refresh is over
    return json({}, 401);
  });
  const slow = api.get<{ path: string }>('/api/late');
  const fast = await api.get<{ path: string }>('/api/fast');
  assert.ok(fast.ok);
  release();
  assert.ok((await slow).ok);
  assert.equal(calls.filter(c => c.includes('/auth/refresh')).length, 1);
});

test('a refused refresh ends the session once and does not loop', async () => {
  reset();
  tokenStore.set('old');
  let expired = 0;
  const onExpired = () => { expired++; };
  sessionEvents.addEventListener('expired', onExpired);
  const calls = stubFetch(async (method, path) => (path === '/api/identity/auth/refresh' ? json({ title: 'session.revoked' }, 401) : json({}, 401)));
  const [a, b] = await Promise.all([api.get('/api/p'), api.get('/api/q')]);
  sessionEvents.removeEventListener('expired', onExpired);
  assert.equal(a.ok, false);
  assert.equal(b.ok, false);
  assert.equal(tokenStore.access, null);
  assert.equal(calls.filter(c => c.includes('/auth/refresh')).length, 1);
  assert.ok(expired >= 1);
  assert.ok(calls.length <= 4, 'two requests, one refresh, no retries of the refresh');
});

test('refreshSession itself is single flight', async () => {
  reset();
  const calls = stubFetch(async () => { await tick(); return json({ accessToken: 'n' }); });
  const [a, b] = await Promise.all([refreshSession(), refreshSession()]);
  assert.equal(a && b, true);
  assert.equal(calls.length, 1);
});
