// One door for "read" requests that several parts of the page may ask for at the same time.
//
// - Single flight: while a read is on its way, the same read asked again (another component, a Provider and a page,
//   React StrictMode mounting twice in development ...) joins it and gets its own copy of the answer. Nothing more
//   goes to the backend.
// - Short cache (optional, per call): data that rarely changes (who is signed in, the system's look) may be reused for a
//   few seconds instead of being asked again by the next screen.
// - A request is "the same" when its key is: the caller builds it from the method, the full address with its query, the
//   caller's identity (the access token) and the posts worked as (X-Active-Posts) - so another user, tenant or post never
//   shares an answer.
//
// Never shared: writes. A write calls `invalidateSharedReads()` when it starts and when it ends, so a read asked after
// a write is always new (it can neither join a read that began before the write nor hit a cached answer of before it).
// Failures are shared with the callers that were waiting, but are never kept: the next call asks again.
// Nothing here cancels a request for the others: callers only ignore an answer they no longer want.

const inflight = new Map<string, { promise: Promise<unknown>; shared: boolean }>();
const fresh = new Map<string, { value: unknown; expiresAt: number }>();
/** Moves on with every invalidation: an answer that began in an older generation is not kept. */
let generation = 0;

/** Every consumer gets its own object, so one that edits its answer (sort in place ...) cannot change another's. */
function copyOf<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    try {
      return structuredClone(value);
    } catch {
      // Not cloneable: shared as it is.
    }
  }
  return value;
}

function pruneExpired(now: number): void {
  if (fresh.size < 50) return;
  for (const [key, entry] of fresh) if (entry.expiresAt <= now) fresh.delete(key);
}

/**
 * Runs `run` unless the same `key` is already running (then joins it) or was answered within `ttlMs`.
 * `ttlMs` 0 (the default) keeps nothing after the answer: only callers that overlap share it.
 */
export function sharedRead<T>(key: string, run: () => Promise<T>, ttlMs = 0): Promise<T> {
  const now = Date.now();
  const kept = fresh.get(key);
  if (kept) {
    if (kept.expiresAt > now) return Promise.resolve(copyOf(kept.value as T));
    fresh.delete(key);
  }

  const running = inflight.get(key);
  if (running) {
    running.shared = true;
    return (running.promise as Promise<T>).then(copyOf);
  }

  const startedIn = generation;
  let started: Promise<T>;
  try {
    started = run();
  } catch (err) {
    started = Promise.reject(err);
  }
  const flight = {
    shared: false,
    promise: started
      .then((value) => {
        if (ttlMs > 0 && startedIn === generation) {
          fresh.set(key, { value: copyOf(value), expiresAt: Date.now() + ttlMs });
          pruneExpired(Date.now());
        }
        return value;
      })
      .finally(() => {
        if (inflight.get(key) === flight) inflight.delete(key);
      }) as Promise<unknown>,
  };
  inflight.set(key, flight);
  // The first caller gets the original only when nobody else joined and nothing was kept; otherwise a copy of it.
  return (flight.promise as Promise<T>).then((value) => (flight.shared || ttlMs > 0 ? copyOf(value) : value));
}

/** A write began or ended, or the person changed: nothing already running or kept may be reused any more. */
export function invalidateSharedReads(): void {
  generation++;
  inflight.clear();
  fresh.clear();
}

/** Sign-out, session end, another sign-in: forget everything (same effect as an invalidation). */
export const resetSharedReads = invalidateSharedReads;

/** Runs a write: reads asked from now on, and after it has finished, are new ones. */
export function runWrite<T>(write: () => Promise<T>): Promise<T> {
  invalidateSharedReads();
  return write().finally(invalidateSharedReads);
}

/**
 * Who is signed in and what they may do (GET /api/identity/auth/me) is asked by the sign-in restore, the settings
 * screens and the permission hooks, through two different clients. They all read it through this key, so it is one
 * request, and for this long the next screen reuses the answer. A write (own profile, password, roles ...), a sign-out
 * and a change of post (part of the key) always ask again.
 */
export const ME_TTL_MS = 30_000;
export const meKey = (accessToken: string | null, activePosts: string | null): string => `me|${accessToken ?? ''}|${activePosts ?? ''}`;

/**
 * The signed-in person's place in the organization (GET /api/org-structure/me): the post switcher in the header, the
 * «جایگاه من» panel and the "is the module there" check all need it. One request, kept for a minute; any write (an
 * assignment changed, a post moved ...) and a sign-out drop it, and a window focus inside the minute does not ask again.
 */
export const PLACEMENT_TTL_MS = 60_000;
export const placementKey = (accessToken: string | null, activePosts: string | null): string => `placement|${accessToken ?? ''}|${activePosts ?? ''}`;
