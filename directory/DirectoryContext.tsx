import * as React from 'react';
import type { Calendar, OwningUnitTreeNode, User, UserRole } from '../types';
import { useAuth } from './AuthContext';
import { calendars as calendarsApi, organization, roles as rolesApi, users as usersApi } from '../services/backend/directory';
import type { BackendRole, BackendUnit } from '../services/backend/directory';
import { setRuntimeDirectory } from '../services/backend/runtimeDirectory';
import { toCalendarBody, toUiCalendar, toUiUser, toUnitNodes, UI_ROLE_TO_BACKEND_ROLE } from '../services/backend/mappers';

export interface Outcome {
  ok: boolean;
  message?: string;
}

export interface NewUserForm {
  username: string;       // national code
  firstName: string;
  lastName: string;
  phoneNumber: string;
  password: string;
  email?: string;
  role: UserRole;
}

export interface EditUserForm {
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  password?: string;      // only when it is being changed
  role: UserRole;
  isActive: boolean;
}

interface DirectoryState {
  loading: boolean;
  /** True once the first read for this sign-in has finished (whether it worked or not): what depends on the directory waits for it, so it starts once with the real data instead of once empty and once full. */
  ready: boolean;
  /** The last load failure, if any. */
  error: string | null;
  users: User[];
  calendars: Calendar[];
  /** Active organisation units as a tree, and as the full paths the old unit pickers work with. */
  unitNodes: OwningUnitTreeNode[];
  unitPaths: string[];
  /** Unit id <-> full path, for screens that store a unit as its path. */
  unitIdByPath: Map<string, string>;
  unitPathById: Map<string, string>;
  reload: () => Promise<void>;

  createUser: (form: NewUserForm) => Promise<Outcome>;
  updateUser: (id: string, form: EditUserForm) => Promise<Outcome>;
  setUserActive: (id: string, isActive: boolean) => Promise<Outcome>;
  deleteUser: (id: string) => Promise<Outcome>;

  saveCalendar: (calendar: Calendar) => Promise<Outcome>;
  deleteCalendar: (id: string) => Promise<Outcome>;
}

const fail = (message?: string): Outcome => ({ ok: false, message });

const DirectoryContext = React.createContext<DirectoryState>(null as unknown as DirectoryState);

/** Users, the organisation chart and work calendars as the backend holds them. Every change goes to the backend and the lists are read back after it. */
export const DirectoryProvider = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuth();
  const tenantId = session?.user.tenantId;

  const [loading, setLoading] = React.useState(false);
  const [loadedFor, setLoadedFor] = React.useState<unknown>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [users, setUsers] = React.useState<User[]>([]);
  const [calendars, setCalendars] = React.useState<Calendar[]>([]);
  const [units, setUnits] = React.useState<BackendUnit[]>([]);
  const [roles, setRoles] = React.useState<BackendRole[]>([]);

  const reload = React.useCallback(async () => {
    if (!session) return;
    setLoading(true);
    // The units are the organization structure's (the same rows its chart edits); they are read here, never changed.
    const [u, r, un, c] = await Promise.all([
      usersApi.list(), rolesApi.list(), organization.units(), calendarsApi.list()
    ]);
    const firstError = [u, r, un, c].find(result => !result.ok);
    setError(firstError ? firstError.error?.message ?? 'Loading failed.' : null);

    if (u.ok) setUsers((u.value ?? []).map(user => toUiUser(user)));
    if (r.ok) setRoles(r.value ?? []);
    if (un.ok) setUnits(un.value ?? []);
    if (c.ok) setCalendars((c.value ?? []).map(toUiCalendar));
    setLoading(false);
    setLoadedFor(session);
  }, [session]);

  React.useEffect(() => {
    if (session) void reload();
    else {
      setUsers([]);
      setCalendars([]);
      setUnits([]);
      setRoles([]);
    }
  }, [session, reload]);

  // Publish what was read, for the plain helper functions that cannot use context (see runtimeDirectory).
  const unitNodesNow = React.useMemo(() => toUnitNodes(units), [units]);
  setRuntimeDirectory({ unitNodes: unitNodesNow, calendars });

  const unitIdByPath = React.useMemo(() => new Map(units.map(u => [u.path ?? u.name, u.id])), [units]);
  const unitPathById = React.useMemo(() => new Map(units.map(u => [u.id, u.path ?? u.name])), [units]);
  const roleIdByName = React.useMemo(() => new Map(roles.map(r => [r.name, r.id])), [roles]);

  /** Runs a backend call, then refreshes. A failed call reports the backend's own message. */
  const run = React.useCallback(async (call: () => Promise<{ ok: boolean; error?: { message: string } }>): Promise<Outcome> => {
    const result = await call();
    if (!result.ok) return fail(result.error?.message);
    await reload();
    return { ok: true };
  }, [reload]);

  // A person's place (unit, post) is set only in the organization structure, never here.
  const applyRole = React.useCallback(async (userId: string, role: UserRole): Promise<Outcome> => {
    const roleId = roleIdByName.get(UI_ROLE_TO_BACKEND_ROLE[role]);
    if (!roleId) return fail(`نقش «${UI_ROLE_TO_BACKEND_ROLE[role]}» در سرور تعریف نشده است.`);
    const assigned = await usersApi.setRoles(userId, [roleId]);
    return assigned.ok ? { ok: true } : fail(assigned.error?.message);
  }, [roleIdByName]);

  const value = React.useMemo<DirectoryState>(() => ({
    loading,
    ready: !!session && loadedFor === session,
    error,
    users,
    calendars,
    unitNodes: toUnitNodes(units),
    unitPaths: units.map(u => u.path ?? u.name),
    unitIdByPath,
    unitPathById,
    reload,

    createUser: async form => {
      if (!tenantId) return fail();
      const created = await usersApi.create({
        tenantId, username: form.username, firstName: form.firstName, lastName: form.lastName,
        phoneNumber: form.phoneNumber, password: form.password, email: form.email || undefined
      });
      if (!created.ok || !created.value) return fail(created.error?.message);
      const applied = await applyRole(created.value.id, form.role);
      await reload();
      return applied.ok ? { ok: true } : { ok: false, message: `کاربر ساخته شد اما: ${applied.message}` };
    },

    updateUser: async (id, form) => {
      const updated = await usersApi.update(id, {
        displayName: `${form.firstName} ${form.lastName}`.trim(), isActive: form.isActive, email: form.email ?? '',
        password: form.password || undefined, username: form.username, phoneNumber: form.phoneNumber,
        firstName: form.firstName, lastName: form.lastName
      });
      if (!updated.ok) return fail(updated.error?.message);
      const applied = await applyRole(id, form.role);
      await reload();
      return applied.ok ? { ok: true } : fail(applied.message);
    },

    setUserActive: (id, isActive) => run(() => usersApi.setStatus(id, isActive)),
    deleteUser: id => run(() => usersApi.remove(id)),

    saveCalendar: async calendar => {
      if (!calendar.id && !tenantId) return fail('سازمان حساب کاربری مشخص نیست. دوباره وارد سامانه شوید.');
      const body = toCalendarBody(calendar);
      return run(async () => {
        const result = calendar.id
          ? await calendarsApi.update(calendar.id, body)
          : await calendarsApi.create(tenantId!, body);
        if (result.error?.status === 403) {
          return { ok: false, error: { message: 'حساب شما مجوز ثبت یا ویرایش تقویم را ندارد.' } };
        }
        return result;
      });
    },
    deleteCalendar: id => run(() => calendarsApi.remove(id))
  }), [loading, session, loadedFor, error, users, calendars, units, unitIdByPath, unitPathById, tenantId, reload, run, applyRole]);

  return <DirectoryContext.Provider value={value}>{children}</DirectoryContext.Provider>;
};

export const useDirectory = () => React.useContext(DirectoryContext);
