import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import type { User } from '../types';
import { useDirectory } from './DirectoryContext';

/** Whom the signed-in user may not make responsible for work (an action, a project), as the server says. */
interface AssignmentLimit { limited: boolean; blockedUserIds: string[]; allowedUserIds: string[] | null }

// Read afresh each time a picker opens: the organization chart may have changed since sign-in (someone placed, a
// manager set), and a stale answer hides people. Pickers opened together share one request.
let inFlight: { user: string; answer: Promise<AssignmentLimit | null> } | null = null;
const load = (user: string) => {
  if (!inFlight || inFlight.user !== user) {
    const answer = api.get<AssignmentLimit>('/api/identity/assignment-limit').then(r => (r.ok ? r.value ?? null : null));
    const entry = { user, answer };
    inFlight = entry;
    void answer.finally(() => { if (inFlight === entry) inFlight = null; });
  }
  return inFlight.answer;
};

/**
 * The people the signed-in user may choose as an action's responsible person or a project's manager: of their own
 * company and at their level or below where the organization structure keeps it so (as for tasks). The one already
 * chosen (keepId) and the user themselves always stay. The server checks again on save.
 */
export function useAssignableUsers(users: User[], meId?: string | number | null, keepId?: string | number | null): User[] {
  const [limit, setLimit] = useState<AssignmentLimit | null>(null);
  // The people list is read at sign-in; accounts created or placed since must show up here too.
  const { reload } = useDirectory();
  useEffect(() => { void reload(); }, [reload]);
  useEffect(() => {
    let alive = true;
    void load(String(meId ?? '')).then(l => { if (alive) setLimit(l); });
    return () => { alive = false; };
  }, [meId]);
  return useMemo(() => {
    const active = users.filter(u => u.isActive !== false);
    if (!limit) return active;
    const blocked = new Set(limit.blockedUserIds.map(String));
    const allowed = limit.allowedUserIds ? new Set(limit.allowedUserIds.map(String)) : null;
    const keep = new Set([meId, keepId].filter(v => v !== undefined && v !== null && v !== '').map(String));
    return active.filter(u => keep.has(String(u.id)) || (!blocked.has(String(u.id)) && (!allowed || allowed.has(String(u.id)))));
  }, [users, limit, meId, keepId]);
}
