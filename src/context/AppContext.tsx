import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import {
  Project,
  ProjectAction,
  ApprovalRequest,
  TeamMember,
  ChatMessage,
  ChatChannel,
  NotificationItem,
  SystemSettings,
  Priority,
  ProjectStatus,
  TaskStatus
} from '../types';
import { CURRENT_SECURITY_PROTOCOL, SecurityProtocolStatus } from '../utils/crypto';
import { requestPushPermission, sendBrowserPushNotification } from '../utils/notifications';
import { api } from '../services/api';

export type ActiveNavKey =
  | 'dashboards.overview'
  | 'dashboards.project'
  | 'projects.portfolio'
  | 'projects.newProject'
  | 'projects.newAction'
  | 'inbox.tasks'
  | 'inbox.approvals'
  | 'knowledge.items'
  | 'knowledge.strategy'
  | 'users.list'
  | 'users.settings'
  | 'chat';

export interface DeadlineFilter {
  type: 'all' | 'today' | 'this_week' | 'overdue' | 'this_month';
}

interface AppContextType {
  // Navigation & View
  activeNav: ActiveNavKey;
  setActiveNav: (nav: ActiveNavKey) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;

  // Projects & Actions
  projects: Project[];
  actions: ProjectAction[];
  approvals: ApprovalRequest[];
  teamMembers: TeamMember[];
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  addProject: (projectData: Omit<Project, 'id' | 'createdAt'>) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addAction: (actionData: Omit<ProjectAction, 'id' | 'createdAt'>) => Promise<ProjectAction>;
  updateAction: (id: string, updates: Partial<ProjectAction>) => Promise<void>;
  deleteAction: (id: string) => void;
  handleApproval: (approvalId: string, status: 'approved' | 'rejected', comment?: string) => Promise<void>;

  // Quick Filters
  priorityFilter: Priority | 'all';
  setPriorityFilter: (p: Priority | 'all') => void;
  deadlineFilter: DeadlineFilter['type'];
  setDeadlineFilter: (d: DeadlineFilter['type']) => void;
  statusFilter: ProjectStatus | 'all';
  setStatusFilter: (s: ProjectStatus | 'all') => void;

  // Global Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isGlobalSearchOpen: boolean;
  setIsGlobalSearchOpen: (open: boolean) => void;

  // Chat
  chatChannels: ChatChannel[];
  chatMessages: ChatMessage[];
  activeChatChannelId: string;
  setActiveChatChannelId: (id: string) => void;
  activeDirectUserId: string | null;
  setActiveDirectUserId: (id: string | null) => void;
  sendChatMessage: (text: string, attachment?: { name: string; size: string; type: string }) => Promise<void>;

  // Notifications
  notifications: NotificationItem[];
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  addNotification: (item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;
  pushPermission: NotificationPermission;
  enablePushNotifications: () => Promise<void>;

  // Settings & Theme
  settings: SystemSettings;
  updateSettings: (updates: Partial<SystemSettings>) => void;
  toggleTheme: () => void;
  securityStatus: SecurityProtocolStatus;

  // Modals
  isCreateProjectModalOpen: boolean;
  setIsCreateProjectModalOpen: (open: boolean) => void;
  isCreateActionModalOpen: boolean;
  setIsCreateActionModalOpen: (open: boolean) => void;

  // Authentication
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;

  // Current User
  currentUser: TeamMember;

  // Seed sample data option (user triggered only)
  loadSampleSeedData: () => void;
  clearAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Default Administrative Identity for Post Bank Iran
const DEFAULT_CURRENT_USER: TeamMember = {
  id: 'usr_admin',
  name: 'مدیر سامانه (ادمین)',
  role: 'مدیر پروژه‌های پست بانک',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  email: 'admin@postbank.ir',
  department: 'اداره کل فناوری اطلاعات و ارتباطات پست بانک ایران',
  activeTasksCount: 0,
  completedTasksCount: 0,
  isOnline: true
};

const DEFAULT_SETTINGS: SystemSettings = {
  theme: 'light',
  accentColor: 'teal',
  enablePushNotifications: false,
  enableSound: true,
  encryptionLevel: 'AES-GCM-256',
  securityAuditLogging: true,
  backendApiUrl: import.meta.env.VITE_API_BASE_URL || '',
  apiAuthToken: ''
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(api.isAuthenticated);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const loggedInUser = await api.login(username.trim(), password);
      setCurrentUser(loggedInUser);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'ورود به سامانه ناموفق بود.'
      };
    }
  };

  const logout = () => {
    api.clearSession();
    setIsAuthenticated(false);
    setProjects([]);
    setActions([]);
    setApprovals([]);
    setTeamMembers([]);
  };

  // Navigation
  const [activeNav, setActiveNav] = useState<ActiveNavKey>('dashboards.overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Settings & Theme
  const [settings, setSettings] = useState<SystemSettings>(() => {
    try {
      const saved = localStorage.getItem('pm_settings');
      if (!saved) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(saved) as SystemSettings;
      return parsed.backendApiUrl === 'https://api.postbank.ir/pm/v1'
        ? { ...parsed, backendApiUrl: DEFAULT_SETTINGS.backendApiUrl }
        : parsed;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Current User
  const [currentUser, setCurrentUser] = useState<TeamMember>(api.user || DEFAULT_CURRENT_USER);

  // Core Data Collections
  const [projects, setProjects] = useState<Project[]>([]);

  const [actions, setActions] = useState<ProjectAction[]>([]);

  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(api.user ? [api.user] : []);

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Chat Data
  const [chatChannels, setChatChannels] = useState<ChatChannel[]>([]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const [activeChatChannelId, setActiveChatChannelId] = useState<string>('');
  const [activeDirectUserId, setActiveDirectUserId] = useState<string | null>(null);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [pushPermission, setPushPermission] = useState<NotificationPermission>(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
  });

  // Filters
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [deadlineFilter, setDeadlineFilter] = useState<DeadlineFilter['type']>('all');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');

  // Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState<boolean>(false);

  // Modals
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState<boolean>(false);
  const [isCreateActionModalOpen, setIsCreateActionModalOpen] = useState<boolean>(false);

  // Server-owned data is loaded after login and is never treated as localStorage state.
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    const loadCoreData = async () => {
      try {
        api.setBaseUrl(settings.backendApiUrl);
        const members = await api.getUsers();
        if (cancelled) return;
        setTeamMembers(members);

        const loadedProjects = await api.getProjects();
        if (cancelled) return;
        setProjects(loadedProjects);

        const loadedActions = await api.getActions();
        if (cancelled) return;
        setActions(loadedActions);

        const [loadedApprovals, loadedChannels, loadedNotifications] = await Promise.all([
          api.getApprovals(loadedActions),
          api.getConversations(),
          api.getNotifications()
        ]);
        if (cancelled) return;
        setApprovals(loadedApprovals);
        setChatChannels(loadedChannels);
        setActiveChatChannelId(current => current || loadedChannels[0]?.id || '');
        setNotifications(loadedNotifications);
      } catch (error) {
        console.error('Loading PostbankPM data failed', error);
      }
    };

    void loadCoreData();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || activeDirectUserId || !activeChatChannelId) return;
    let cancelled = false;
    api.getMessages(activeChatChannelId)
      .then(messages => { if (!cancelled) setChatMessages(messages); })
      .catch(error => console.error('Loading chat messages failed', error));
    return () => { cancelled = true; };
  }, [isAuthenticated, activeChatChannelId, activeDirectUserId]);

  useEffect(() => {
    localStorage.setItem('pm_settings', JSON.stringify(settings));
    api.setBaseUrl(settings.backendApiUrl);
    // Apply or remove dark class on root html and body elements
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [settings.theme, settings]);

  // Push notification permission handler
  const enablePushNotifications = async () => {
    const perm = await requestPushPermission();
    setPushPermission(perm);
    if (perm === 'granted') {
      setSettings(prev => ({ ...prev, enablePushNotifications: true }));
      sendBrowserPushNotification('سیستم اعلان‌های سامانه فعال شد', {
        body: 'از این پس تغییرات و هشدارهای پروژه‌ها به صورت پوش برای شما ارسال خواهد شد.'
      });
      addNotification({
        title: 'فعال‌سازی نوتفیکیشن پوش',
        message: 'مجوز اعلان‌های لحظه‌ای مرورگر با موفقیت ثبت شد.',
        type: 'security',
        priority: 'low'
      });
    }
  };

  const addNotification = (item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
    const newItem: NotificationItem = {
      ...item,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      read: false
    };

    setNotifications(prev => [newItem, ...prev]);

    // Fire native push if enabled
    if (settings.enablePushNotifications && pushPermission === 'granted') {
      sendBrowserPushNotification(newItem.title, {
        body: newItem.message
      });
    }
  };

  const markNotificationAsRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  // Project handlers
  const addProject = async (projectData: Omit<Project, 'id' | 'createdAt'>): Promise<Project> => {
    const newProject = await api.createProject(projectData);
    setProjects(prev => [newProject, ...prev]);

    addNotification({
      title: 'پروژه جدید تعریف شد',
      message: `پروژه "${newProject.title}" با کد شناسایی ${newProject.code} ایجاد گردید.`,
      type: 'project',
      priority: newProject.priority
    });

    return newProject;
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    const updated = await api.updateProject(id, updates);
    setProjects(prev => prev.map(project => project.id === id ? updated : project));
    addNotification({
      title: 'بروزرسانی وضعیت پروژه',
      message: `تغییرات جدید در پروژه "${updated.title}" اعمال شد (پیشرفت: ${updated.progress}%).`,
      type: 'project',
      priority: updated.priority
    });
  };

  const deleteProject = async (id: string) => {
    const target = projects.find(p => p.id === id);
    await api.archiveProject(id);
    setProjects(prev => prev.filter(p => p.id !== id));
    setActions(prev => prev.filter(a => a.projectId !== id));
    if (target) {
      addNotification({
        title: 'حذف پروژه',
        message: `پروژه "${target.title}" از سامانه حذف شد.`,
        type: 'project',
        priority: 'medium'
      });
    }
  };

  // Action handlers
  const addAction = async (actionData: Omit<ProjectAction, 'id' | 'createdAt'>): Promise<ProjectAction> => {
    const newAction = await api.createAction(actionData);
    setActions(prev => [newAction, ...prev]);

    addNotification({
      title: 'اقدام جدید ثبت شد',
      message: `اقدام "${newAction.title}" در ذیل پروژه "${newAction.projectTitle}" ثبت شد.`,
      type: 'task',
      priority: newAction.priority
    });

    return newAction;
  };

  const updateAction = async (id: string, updates: Partial<ProjectAction>) => {
    const updated = await api.updateAction(id, updates);
    setActions(prev => prev.map(action => action.id === id ? updated : action));
  };

  const deleteAction = (id: string) => {
    addNotification({
      title: 'حذف اقدام پشتیبانی نمی‌شود',
      message: 'Core فعلاً endpoint حذف اقدام ندارد؛ هیچ داده‌ای حذف نشد.',
      type: 'security',
      priority: 'medium'
    });
  };

  const handleApproval = async (approvalId: string, status: 'approved' | 'rejected', comment?: string) => {
    const item = approvals.find(approval => approval.id === approvalId);
    await api.decideApproval(approvalId, status, comment);
    setApprovals(prev => prev.filter(approval => approval.id !== approvalId));
    if (item) {
      setActions(prev => prev.map(action => action.id === item.actionId
        ? { ...action, approvalStatus: status, status: status === 'approved' ? 'approved' : 'rejected' }
        : action));
      addNotification({
        title: status === 'approved' ? 'تایید اقدام سازمانی' : 'رد درخواست اقدام',
        message: `اقدام "${item.actionTitle}" توسط مدیریت ${status === 'approved' ? 'تایید' : 'رد'} شد.`,
        type: 'approval',
        priority: item.priority
      });
    }
  };

  // Encrypted Chat Handler
  const sendChatMessage = async (text: string, attachment?: { name: string; size: string; type: string }) => {
    if (attachment) throw new Error('Core فعلاً endpoint بارگذاری فایل پیوست چت ندارد.');
    const message = await api.sendMessage(activeDirectUserId ? null : activeChatChannelId, activeDirectUserId, text);
    setChatMessages(prev => [...prev, message]);
  };

  // Theme Toggler
  const toggleTheme = () => {
    setSettings(prev => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark'
    }));
  };

  const updateSettings = (updates: Partial<SystemSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  // Mock seed data removed per user request for backend integration.
  const loadSampleSeedData = () => {
    // Ready for backend integration
    addNotification({
      title: 'اتصال به سامانه backend',
      message: 'سامانه آماده اتصال به API و دریافت زنده داده‌های پروژه‌های پست بانک است.',
      type: 'project',
      priority: 'low'
    });
  };

  const clearAllData = () => {
    setProjects([]);
    setActions([]);
    setApprovals([]);
    setChatMessages([]);
    setNotifications([]);
  };

  return (
    <AppContext.Provider
      value={{
        activeNav,
        setActiveNav,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
        projects,
        actions,
        approvals,
        teamMembers,
        selectedProjectId,
        setSelectedProjectId,
        addProject,
        updateProject,
        deleteProject,
        addAction,
        updateAction,
        deleteAction,
        handleApproval,
        priorityFilter,
        setPriorityFilter,
        deadlineFilter,
        setDeadlineFilter,
        statusFilter,
        setStatusFilter,
        searchQuery,
        setSearchQuery,
        isGlobalSearchOpen,
        setIsGlobalSearchOpen,
        chatChannels,
        chatMessages,
        activeChatChannelId,
        setActiveChatChannelId,
        activeDirectUserId,
        setActiveDirectUserId,
        sendChatMessage,
        notifications,
        unreadNotificationsCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        addNotification,
        pushPermission,
        enablePushNotifications,
        settings,
        updateSettings,
        toggleTheme,
        securityStatus: CURRENT_SECURITY_PROTOCOL,
        isCreateProjectModalOpen,
        setIsCreateProjectModalOpen,
        isCreateActionModalOpen,
        setIsCreateActionModalOpen,
        currentUser,
        isAuthenticated,
        login,
        logout,
        loadSampleSeedData,
        clearAllData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
