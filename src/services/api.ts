import {
  ApprovalRequest, ChatChannel, ChatMessage, KnowledgeItem, NotificationItem,
  Project, ProjectAction, StrategicGoal, TeamMember
} from '../types';

type ApiUser = { id: string; tenantId: string; email: string; displayName: string; isActive: boolean; roles: string[] };
type AuthResponse = { accessToken: string; refreshToken: string; accessTokenExpiresAtUtc: string; user: ApiUser };
type ApiProject = {
  id: string; tenantId: string; name: string; code: string; type: number | string;
  status: number | string; approvalStatus: number | string; ownerUserId?: string;
  managerUserId?: string; organizationUnitId?: string; workCalendarId?: string;
  startDate?: string; endDate?: string; cost?: number; goal?: string; requirements?: string;
  constraints?: string; assumptions?: string; description?: string; charter?: string; createdAtUtc: string;
};
type ApiAction = {
  id: string; tenantId: string; title: string; description?: string; ownerUserId?: string;
  responsibleUserId?: string; status: number | string; organizationUnitId: string;
  workCalendarId: string; projectId?: string; startDate?: string; endDate?: string;
  approvalStatus: number | string;
};
type ApiConversation = { id: string; title?: string; type: string; createdAt: string; participantCount: number; lastMessage?: string; lastMessageAt?: string };
type ApiMessage = { id: string; senderUserId: string; text: string; sentAt: string; isOwnMessage: boolean; isRead: boolean };
type ApiNotification = { id: string; title: string; message: string; type: string; isRead: boolean; createdAt: string };
type ApiWorkflowInstance = { id: string; subjectType: string; subjectId: string; status: number | string };
type PagedResult<T> = { items: T[]; pageNumber: number; pageSize: number; totalCount: number };

const ACCESS_TOKEN_KEY = 'postbankpm.accessToken';
const REFRESH_TOKEN_KEY = 'postbankpm.refreshToken';
const USER_KEY = 'postbankpm.user';
const DEFAULT_AVATAR = '/avatar-placeholder.svg';

const enumValue = (value: number | string, names: string[]): number => {
  if (typeof value === 'number') return value;
  const numeric = Number(value);
  if (!Number.isNaN(numeric)) return numeric;
  return Math.max(0, names.findIndex(item => item.toLowerCase() === value.toLowerCase()));
};

const toIsoDate = (value?: string): string | null => {
  if (!value) return null;
  const normalized = value.replaceAll('/', '-').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized) && Number(normalized.slice(0, 4)) > 1700) return normalized;
  const match = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return null;
  const [jy, jm, jd] = match.slice(1).map(Number);
  let jYear = jy + 1595;
  let days = -355668 + (365 * jYear) + (Math.floor(jYear / 33) * 8) + Math.floor(((jYear % 33) + 3) / 4) + jd;
  days += jm < 7 ? (jm - 1) * 31 : ((jm - 7) * 30) + 186;
  let gy = 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const leap = (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0;
  const monthDays = [0, 31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 1;
  let day = days + 1;
  while (gm <= 12 && day > monthDays[gm]) day -= monthDays[gm++];
  return `${gy.toString().padStart(4, '0')}-${gm.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
};

class ApiService {
  private baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  private accessToken = localStorage.getItem(ACCESS_TOKEN_KEY) || '';
  private refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY) || '';
  private currentUser: ApiUser | null = this.readStoredUser();
  private users = new Map<string, TeamMember>();
  private rawProjects = new Map<string, ApiProject>();
  private rawActions = new Map<string, ApiAction>();
  private projects = new Map<string, Project>();

  get isAuthenticated() { return Boolean(this.accessToken && this.currentUser); }
  get tenantId() {
    if (!this.currentUser) throw new Error('نشست کاربری معتبر نیست. لطفاً دوباره وارد شوید.');
    return this.currentUser.tenantId;
  }
  get user(): TeamMember | null { return this.currentUser ? this.mapUser(this.currentUser) : null; }
  setBaseUrl(url: string) { this.baseUrl = url.replace(/\/$/, ''); }

  private readStoredUser(): ApiUser | null {
    try { const raw = localStorage.getItem(USER_KEY); return raw ? JSON.parse(raw) : null; }
    catch { return null; }
  }

  private saveSession(auth: AuthResponse) {
    this.accessToken = auth.accessToken;
    this.refreshToken = auth.refreshToken;
    this.currentUser = auth.user;
    localStorage.setItem(ACCESS_TOKEN_KEY, auth.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, auth.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
  }

  clearSession() {
    this.accessToken = '';
    this.refreshToken = '';
    this.currentUser = null;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  async login(email: string, password: string): Promise<TeamMember> {
    const normalizedEmail = email.includes('@') ? email : `${email}@nexus.local`;
    const auth = await this.request<AuthResponse>('/api/identity/auth/login', {
      method: 'POST', body: JSON.stringify({ email: normalizedEmail, password, tenantSlug: 'default' })
    }, false);
    this.saveSession(auth);
    return this.mapUser(auth.user);
  }

  private async refreshSession(): Promise<boolean> {
    if (!this.refreshToken) return false;
    try {
      const auth = await this.request<AuthResponse>('/api/identity/auth/refresh', {
        method: 'POST', body: JSON.stringify({ refreshToken: this.refreshToken })
      }, false);
      this.saveSession(auth);
      return true;
    } catch { this.clearSession(); return false; }
  }

  private async request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
    const headers = new Headers(init.headers);
    if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    if (this.accessToken) headers.set('Authorization', `Bearer ${this.accessToken}`);
    const response = await fetch(`${this.baseUrl}${path}`, { ...init, headers });
    if (response.status === 401 && retry && await this.refreshSession()) return this.request<T>(path, init, false);
    if (!response.ok) {
      const problem = await response.json().catch(() => null);
      throw new Error(problem?.detail || problem?.title || `خطای ارتباط با سرور (${response.status})`);
    }
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  private mapUser(user: ApiUser): TeamMember {
    const member: TeamMember = {
      id: user.id, name: user.displayName, role: user.roles.join('، ') || 'کاربر', avatar: DEFAULT_AVATAR,
      email: user.email, department: '', activeTasksCount: 0, completedTasksCount: 0, isOnline: user.isActive
    };
    this.users.set(member.id, member);
    return member;
  }

  private member(id?: string): TeamMember {
    return (id && this.users.get(id)) || this.user || {
      id: id || '', name: 'کاربر سامانه', role: 'کاربر', avatar: DEFAULT_AVATAR,
      email: '', department: '', activeTasksCount: 0, completedTasksCount: 0, isOnline: false
    };
  }

  async getUsers(): Promise<TeamMember[]> {
    const result = await this.request<PagedResult<ApiUser>>(`/api/identity/users/?tenantId=${this.tenantId}&pageNumber=1&pageSize=200`);
    return result.items.map(user => this.mapUser(user));
  }

  private async getProjectProgress(projectId: string): Promise<number> {
    const updates = await this.request<Array<{ actualProgress: number; registerDate: string }>>(`/api/project-management/progress-updates/?projectId=${projectId}`);
    return updates.sort((a, b) => b.registerDate.localeCompare(a.registerDate))[0]?.actualProgress ?? 0;
  }

  private mapProject(project: ApiProject, progress: number): Project {
    const type = enumValue(project.type, ['Waterfall', 'Agile']);
    const status = enumValue(project.status, ['Draft', 'Active', 'OnHold', 'Completed', 'Archived']);
    const mapped: Project = {
      id: project.id, code: project.code, title: project.name, description: project.description || '',
      category: type === 1 ? 'چابک' : 'آبشاری', manager: this.member(project.managerUserId), members: [],
      startDate: project.startDate || '', endDate: project.endDate || '', progress,
      status: ['planning', 'in_progress', 'on_hold', 'completed', 'on_hold'][status] as Project['status'],
      priority: 'medium', budget: project.cost || 0, spent: 0, tags: [],
      createdAt: new Date(project.createdAtUtc).toLocaleDateString('fa-IR')
    };
    this.rawProjects.set(project.id, project);
    this.projects.set(project.id, mapped);
    return mapped;
  }

  async getProjects(): Promise<Project[]> {
    const result = await this.request<PagedResult<ApiProject>>(`/api/project-management/projects/?tenantId=${this.tenantId}&pageNumber=1&pageSize=200`);
    return Promise.all(result.items.map(async project => this.mapProject(project, await this.getProjectProgress(project.id).catch(() => 0))));
  }

  async createProject(project: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
    const created = await this.request<ApiProject>('/api/project-management/projects/', {
      method: 'POST', body: JSON.stringify({
        tenantId: this.tenantId, name: project.title, code: project.code, type: 0,
        managerUserId: project.manager?.id || null, ownerUserId: this.currentUser?.id || null,
        organizationUnitId: null, workCalendarId: null, startDate: toIsoDate(project.startDate),
        endDate: toIsoDate(project.endDate), cost: project.budget, goal: project.description || null,
        requirements: null, constraints: null, assumptions: null, description: project.description || null, charter: null
      })
    });
    return this.mapProject(created, 0);
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const current = this.projects.get(id);
    const raw = this.rawProjects.get(id);
    if (!current || !raw) throw new Error('اطلاعات پروژه برای ویرایش پیدا نشد.');
    if (updates.progress !== undefined && updates.progress !== current.progress) {
      await this.request('/api/project-management/progress-updates/', {
        method: 'POST', body: JSON.stringify({
          tenantId: this.tenantId, projectId: id, statusDescription: 'به‌روزرسانی از رابط PostbankPM',
          registerDate: new Date().toISOString().slice(0, 10), plannedProgress: updates.progress,
          actualProgress: updates.progress, delayReasons: null
        })
      });
    }
    let mapped = { ...current, ...updates };
    if (Object.keys(updates).some(key => key !== 'progress')) {
      const updated = await this.request<ApiProject>(`/api/project-management/projects/${id}`, {
        method: 'PUT', body: JSON.stringify({
          name: mapped.title, code: mapped.code, managerUserId: mapped.manager?.id || raw.managerUserId || null,
          ownerUserId: raw.ownerUserId || null, organizationUnitId: raw.organizationUnitId || null,
          workCalendarId: raw.workCalendarId || null, startDate: toIsoDate(mapped.startDate), endDate: toIsoDate(mapped.endDate),
          cost: mapped.budget, goal: raw.goal || null, requirements: raw.requirements || null,
          constraints: raw.constraints || null, assumptions: raw.assumptions || null,
          description: mapped.description || null, charter: raw.charter || null
        })
      });
      mapped = this.mapProject(updated, mapped.progress);
    }
    this.projects.set(id, mapped);
    return mapped;
  }

  async archiveProject(id: string): Promise<void> {
    await this.request(`/api/project-management/projects/${id}/archive`, { method: 'POST' });
    this.projects.delete(id);
    this.rawProjects.delete(id);
  }

  private mapAction(action: ApiAction): ProjectAction {
    const status = enumValue(action.status, ['Open', 'InProgress', 'Completed', 'Cancelled']);
    const approval = enumValue(action.approvalStatus, ['NotSubmitted', 'PendingApproval', 'Approved', 'Rejected']);
    const project = action.projectId ? this.projects.get(action.projectId) : undefined;
    const mapped: ProjectAction = {
      id: action.id, projectId: action.projectId || '', projectCode: project?.code || '',
      projectTitle: project?.title || 'اقدام سازمانی', title: action.title, description: action.description || '',
      assignee: this.member(action.responsibleUserId), priority: 'medium',
      status: ['todo', 'in_progress', 'done', 'rejected'][status] as ProjectAction['status'],
      deadline: action.endDate || '', progress: status === 2 ? 100 : status === 1 ? 50 : 0,
      requiresApproval: approval > 0,
      approvalStatus: approval === 1 ? 'pending' : approval === 2 ? 'approved' : approval === 3 ? 'rejected' : undefined,
      createdAt: ''
    };
    this.rawActions.set(action.id, action);
    return mapped;
  }

  async getActions(): Promise<ProjectAction[]> {
    const result = await this.request<ApiAction[]>(`/api/actions/?tenantId=${this.tenantId}`);
    return result.map(action => this.mapAction(action));
  }

  private async getActionDependencies(): Promise<{ organizationUnitId: string; workCalendarId: string }> {
    const [units, calendars] = await Promise.all([
      this.request<Array<{ id: string }>>(`/api/organization/units/?tenantId=${this.tenantId}`),
      this.request<Array<{ id: string; isDefault: boolean }>>(`/api/calendar/work-calendars/?tenantId=${this.tenantId}`)
    ]);
    const calendar = calendars.find(item => item.isDefault) || calendars[0];
    if (!units[0] || !calendar) throw new Error('برای ثبت اقدام، ابتدا حداقل یک واحد سازمانی و یک تقویم کاری در Core تعریف کنید.');
    return { organizationUnitId: units[0].id, workCalendarId: calendar.id };
  }

  async createAction(action: Omit<ProjectAction, 'id' | 'createdAt'>): Promise<ProjectAction> {
    const dependencies = await this.getActionDependencies();
    const created = await this.request<ApiAction>('/api/actions/', {
      method: 'POST', body: JSON.stringify({
        tenantId: this.tenantId, title: action.title, description: action.description || null,
        ownerUserId: this.currentUser?.id || null, responsibleUserId: action.assignee?.id || null,
        organizationUnitId: dependencies.organizationUnitId, workCalendarId: dependencies.workCalendarId,
        projectId: action.projectId || null, startDate: new Date().toISOString().slice(0, 10), endDate: toIsoDate(action.deadline)
      })
    });
    if (action.requiresApproval) {
      try {
        await this.request(`/api/actions/${created.id}/submit-for-approval`, { method: 'POST' });
        created.approvalStatus = 1;
      } catch (error) {
        const detail = error instanceof Error ? error.message : 'پیکربندی گردش‌کار موجود نیست.';
        throw new Error(`اقدام ثبت شد، اما ارسال برای تأیید ناموفق بود: ${detail}`);
      }
    }
    return this.mapAction(created);
  }

  async updateAction(id: string, updates: Partial<ProjectAction>): Promise<ProjectAction> {
    const raw = this.rawActions.get(id);
    if (!raw) throw new Error('اطلاعات اقدام برای ویرایش پیدا نشد.');
    if (updates.status || updates.progress !== undefined) {
      const status = updates.status === 'done' || updates.progress === 100 ? 2 : updates.status === 'todo' ? 0 : 1;
      return this.mapAction(await this.request<ApiAction>(`/api/actions/${id}/status`, {
        method: 'PUT', body: JSON.stringify({ status })
      }));
    }
    return this.mapAction(await this.request<ApiAction>(`/api/actions/${id}`, {
      method: 'PUT', body: JSON.stringify({
        title: updates.title ?? raw.title, description: updates.description ?? raw.description ?? null,
        ownerUserId: raw.ownerUserId || null, responsibleUserId: updates.assignee?.id ?? raw.responsibleUserId ?? null,
        organizationUnitId: raw.organizationUnitId, workCalendarId: raw.workCalendarId, projectId: raw.projectId || null,
        startDate: raw.startDate || null, endDate: toIsoDate(updates.deadline) ?? raw.endDate ?? null
      })
    }));
  }

  async getApprovals(actions: ProjectAction[]): Promise<ApprovalRequest[]> {
    const items = await this.request<ApiWorkflowInstance[]>(`/api/workflow/approval-center/?tenantId=${this.tenantId}`);
    return items.map(item => {
      const action = actions.find(candidate => candidate.id === item.subjectId);
      const project = action ? this.projects.get(action.projectId) : undefined;
      return {
        id: item.id, actionId: item.subjectId, actionTitle: action?.title || item.subjectType,
        projectTitle: project?.title || '—', requester: action?.assignee || this.member(),
        assignedApprover: this.user?.name || 'تاییدکننده', dateSubmitted: '', status: 'pending',
        priority: action?.priority || 'medium'
      };
    });
  }

  async decideApproval(id: string, status: 'approved' | 'rejected', comment?: string): Promise<void> {
    await this.request(`/api/workflow/approval-center/${id}/${status === 'approved' ? 'approve' : 'reject'}`, {
      method: 'POST', body: JSON.stringify({ comment: comment || null })
    });
  }

  async getConversations(): Promise<ChatChannel[]> {
    const result = await this.request<{ value?: ApiConversation[] } | ApiConversation[]>('/api/chat/conversations/');
    const items = Array.isArray(result) ? result : result.value || [];
    return items.map(item => ({
      id: item.id, name: item.title || (item.type.toLowerCase() === 'direct' ? 'گفتگوی مستقیم' : 'گفتگوی گروهی'),
      description: item.lastMessage || '', isPrivate: item.type.toLowerCase() === 'direct', unreadCount: 0,
      membersCount: item.participantCount, lastMessage: item.lastMessage,
      lastMessageTime: item.lastMessageAt ? new Date(item.lastMessageAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) : undefined
    }));
  }

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    const result = await this.request<{ value?: ApiMessage[] } | ApiMessage[]>(`/api/chat/conversations/${conversationId}/messages?page=1&pageSize=100`);
    const items = Array.isArray(result) ? result : result.value || [];
    return items.map(item => ({
      id: item.id, senderId: item.senderUserId, senderName: this.member(item.senderUserId).name,
      senderAvatar: this.member(item.senderUserId).avatar, channelId: conversationId, text: item.text,
      timestamp: new Date(item.sentAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      isEncrypted: true, integrityHash: ''
    }));
  }

  async sendMessage(conversationId: string | null, otherUserId: string | null, message: string): Promise<ChatMessage> {
    let targetConversationId = conversationId;
    if (otherUserId) {
      const result = await this.request<{ value?: string } | string>('/api/chat/conversations/direct', {
        method: 'POST', body: JSON.stringify({ otherUserId })
      });
      targetConversationId = typeof result === 'string' ? result : result.value || null;
    }
    if (!targetConversationId) throw new Error('ابتدا یک گفتگو را انتخاب کنید.');
    const result = await this.request<{ value?: string } | string>('/api/chat/messages', {
      method: 'POST', body: JSON.stringify({ conversationId: targetConversationId, text: message, senderUserId: this.currentUser?.id || null })
    });
    const id = typeof result === 'string' ? result : result.value || crypto.randomUUID();
    return {
      id, senderId: this.currentUser?.id || '', senderName: this.currentUser?.displayName || '', senderAvatar: DEFAULT_AVATAR,
      channelId: targetConversationId, receiverId: otherUserId || undefined, text: message,
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      isEncrypted: true, integrityHash: ''
    };
  }

  async getNotifications(): Promise<NotificationItem[]> {
    const result = await this.request<{ value?: ApiNotification[] } | ApiNotification[]>('/api/notifications/?pageNumber=1&pageSize=100');
    const items = Array.isArray(result) ? result : result.value || [];
    return items.map(item => ({
      id: item.id, title: item.title, message: item.message,
      type: ['project', 'task', 'approval', 'security', 'chat'].includes(item.type.toLowerCase())
        ? item.type.toLowerCase() as NotificationItem['type'] : 'security',
      timestamp: new Date(item.createdAt).toLocaleString('fa-IR'), read: item.isRead, priority: 'medium'
    }));
  }

  async markNotificationRead(id: string): Promise<void> { await this.request(`/api/notifications/${id}/read`, { method: 'PUT' }); }
  async markAllNotificationsRead(): Promise<void> { await this.request('/api/notifications/read-all', { method: 'PUT' }); }

  async getKnowledgeItems(): Promise<KnowledgeItem[]> {
    const items = await this.request<Array<{ id: string; title: string; description?: string; documentType: number | string; fileName: string; sizeBytes: number; createdAtUtc: string }>>(`/api/knowledge/documents/?tenantId=${this.tenantId}`);
    return items.map(item => ({
      id: item.id, title: item.title, category: String(item.documentType), author: '—',
      date: new Date(item.createdAtUtc).toLocaleDateString('fa-IR'), tags: [],
      summary: item.description || item.fileName, content: '', attachmentsCount: item.sizeBytes > 0 ? 1 : 0
    }));
  }

  async getStrategicGoals(): Promise<StrategicGoal[]> {
    const items = await this.request<Array<{ id: string; name: string; weight: number }>>(`/api/strategy/?tenantId=${this.tenantId}`);
    return items.map(item => ({
      id: item.id, title: item.name, targetYear: '', progress: 0, owner: '—', linkedProjectsCount: 0, status: 'on_track'
    }));
  }
}

export const api = new ApiService();
