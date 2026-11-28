import { test } from 'node:test';
import assert from 'node:assert/strict';
import { invalidateSharedReads, meKey, runWrite, sharedRead } from './sharedRead';

const later = <T>(value: T, ms = 5) => new Promise<T>(resolve => setTimeout(() => resolve(value), ms));

test('callers asking together share one run; each gets its own copy', async () => {
  invalidateSharedReads();
  let runs = 0;
  const run = async () => { runs++; return later({ items: [1, 2, 3] }); };
  const [a, b] = await Promise.all([sharedRead('k', run), sharedRead('k', run)]);
  assert.equal(runs, 1);
  assert.notEqual(a, b);
  a.items.push(4);
  assert.deepEqual(b.items, [1, 2, 3]);
});

test('different keys never share', async () => {
  invalidateSharedReads();
  let runs = 0;
  const run = async () => { runs++; return later(1); };
  await Promise.all([sharedRead('a', run), sharedRead('b', run)]);
  assert.equal(runs, 2);
});

test('a finished run is forgotten without a lifetime, kept with one', async () => {
  invalidateSharedReads();
  let runs = 0;
  const run = async () => { runs++; return runs; };
  await sharedRead('k', run);
  await sharedRead('k', run);
  assert.equal(runs, 2);
  await sharedRead('t', run, 1000);
  assert.equal(await sharedRead('t', run, 1000), 3);
  assert.equal(runs, 3);
});

test('an expired lifetime asks again', async () => {
  invalidateSharedReads();
  let runs = 0;
  const run = async () => ++runs;
  await sharedRead('k', run, 5);
  await later(null, 15);
  await sharedRead('k', run, 5);
  assert.equal(runs, 2);
});

test('failures reach everyone waiting, are never kept, and clear the way', async () => {
  invalidateSharedReads();
  let runs = 0;
  const run = async () => { runs++; await later(null); throw new Error('boom'); };
  const results = await Promise.allSettled([sharedRead('k', run, 1000), sharedRead('k', run, 1000)]);
  assert.deepEqual(results.map(r => r.status), ['rejected', 'rejected']);
  assert.equal(runs, 1);
  await assert.rejects(sharedRead('k', async () => { runs++; throw new Error('again'); }));
  assert.equal(runs, 2);
});

test('a run that throws before returning a promise is handled the same way', async () => {
  invalidateSharedReads();
  await assert.rejects(sharedRead('k', () => { throw new Error('sync'); }));
  assert.equal(await sharedRead('k', async () => 'fine'), 'fine');
});

test('a write drops running and kept reads: nothing before it is reused after it', async () => {
  invalidateSharedReads();
  let version = 1;
  const read = async () => { const seen = version; await later(null); return seen; };
  const early = sharedRead('k', read, 1000);
  await runWrite(async () => { version = 2; });
  assert.equal(await sharedRead('k', read, 1000), 2);
  assert.equal(await early, 1);
  // The early answer began before the write: it was not kept.
  assert.equal(await sharedRead('k', read, 1000), 2);
});

test('a lifetime answer started before an invalidation is not kept', async () => {
  invalidateSharedReads();
  let runs = 0;
  const run = async () => { runs++; await later(null); return runs; };
  const first = sharedRead('k', run, 1000);
  invalidateSharedReads();
  await first;
  await sharedRead('k', run, 1000);
  assert.equal(runs, 2);
});

test('the current-user key tells users and posts apart', () => {
  assert.notEqual(meKey('a', null), meKey('b', null));
  assert.notEqual(meKey('a', 'p1'), meKey('a', 'p2'));
  assert.equal(meKey('a', 'p1'), meKey('a', 'p1'));
});
