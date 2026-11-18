import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import type { User } from '../types';

/** Whom the signed-in user may not make responsible for work (an action, a project), as the server says. */
interface AssignmentLimit { limited: boolean; blockedUserIds: string[]; allowedUserIds: string[] | null }

// Read once per signed-in person (a post switch reloads the page, so it is read again then).
let cached: { user: string; answer: Promise<AssignmentLimit | null> } | null = null;
const load = (user: string) => {
  if (!cached || cached.user !== user) {
    cached = { user, answer: api.get<AssignmentLimit>('/api/identity/assignment-limit').then(r => (r.ok ? r.value ?? null : null)) };
  }
  return cached.answer;
};

/**
 * The people the signed-in user may choose as an action's responsible person or a project's manager: of their own
 * company and at their level or below where the organization structure keeps it so (as for tasks). The one already
 * chosen (keepId) and the user themselves always stay. The server checks again on save.
 */
export function useAssignableUsers(users: User[], meId?: string | number | null, keepId?: string | number | null): User[] {
  const [limit, setLimit] = useState<AssignmentLimit | null>(null);
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
