import { useEffect, useState } from 'react';
import { getAssignment, getMyPlacement } from '../tmpb/services/orgStructureApi';
import type { UserAssignment } from '../tmpb/services/orgStructureApi';

/** The units where the person holds a post (their main place when they hold none), without repeats. */
const unitsOf = (assignment: UserAssignment | null | undefined): string[] => {
  if (!assignment) return [];
  const ids = (assignment.positions ?? []).map(p => p.unitId).filter((id): id is string => !!id);
  if (ids.length === 0 && assignment.unitId) ids.push(assignment.unitId);
  return [...new Set(ids)];
};

/**
 * The units a project's owner may own it from: where they hold a post in the organization chart. Null while unknown, or
 * when the chart cannot tell (the owner has no place, or their place may not be read): then every unit stays on offer.
 * `loading` is true until the answer is in, so a screen does not show every unit for a moment first.
 */
export function useOwnerUnitIds(ownerId?: string | number | null, meId?: string | number | null): { ids: string[] | null; loading: boolean } {
  const [ids, setIds] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    setIds(null);
    // Nobody signed in yet (the user is still being read): keep waiting rather than offer every unit.
    if (ownerId === undefined || ownerId === null || ownerId === '') return;
    setLoading(true);
    const own = String(ownerId) === String(meId ?? '');
    const read = own ? getMyPlacement().then(p => p?.assignment ?? null) : getAssignment(String(ownerId));
    read.then(a => { if (alive) { const units = unitsOf(a); setIds(units.length ? units : null); } })
      .catch(err => console.warn('Could not read the project owner\'s units; every unit is offered.', err))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [ownerId, meId]);
  return { ids, loading };
}
