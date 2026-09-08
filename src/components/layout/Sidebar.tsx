import React, { useState } from 'react';
import {
  LayoutDashboard,
  BarChart3,
  FolderKanban,
  FolderPlus,
  FilePlus2,
  Inbox,
  CheckCircle2,
  GraduationCap,
  Network,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  MessageSquare,
  ShieldCheck,
  Briefcase,
  X
} from 'lucide-react';
import { useApp, ActiveNavKey } from '../../context/AppContext';
import { toPersianDigits } from '../../utils/persianDigits';

export const Sidebar: React.FC = () => {
  const {
    activeNav,
    setActiveNav,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    projects,
    actions,
    approvals,
    setIsCreateProjectModalOpen,
    setIsCreateActionModalOpen,
    currentUser
  } = useApp();

  // Accordion open/close states (default open first category)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    dashboards: true,
    projects: true,
    inbox: false,
    knowledge: false,
    users: false
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleNavClick = (navKey: ActiveNavKey) => {
    if (navKey === 'projects.newProject') {
      setIsCreateProjectModalOpen(true);
    } else if (navKey === 'projects.newAction') {
      setIsCreateActionModalOpen(true);
    } else {
      setActiveNav(navKey);
    }
    // Close mobile drawer on item click
    setIsMobileSidebarOpen(false);
  };

  const totalProjectsCount = projects.length;
  const pendingApprovalsCount = approvals.filter(a => a.status === 'pending').length;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div
          id="sidebar-mobile-backdrop"
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="main-app-sidebar"
        className={`fixed lg:static top-0 right-0 h-full z-50 flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 transition-all duration-300 shadow-sm ${
          isMobileSidebarOpen ? 'translate-x-0 w-72' : 'translate-x-full lg:translate-x-0'
        } ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-72'}`}
      >
        {/* Top Header / User Profile & Collapse Toggle */}
        <div className="h-16 flex items-center justify-between px-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          {!isSidebarCollapsed ? (
            <div
              onClick={() => handleNavClick('users.settings')}
              className="flex items-center gap-2.5 overflow-hidden flex-1 cursor-pointer p-1 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              title="مشاهده و ویرایش پروفایل کاربری"
            >
              <div className="relative shrink-0">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700 shadow-2xs"
                />
                <span
                  className={`absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${
                    currentUser.isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                />
              </div>
              <div className="truncate text-right flex-1">
                <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                  {currentUser.name}
                </h2>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium truncate">
                  {currentUser.role}
                </p>
              </div>
            </div>
          ) : (
            <div
              onClick={() => handleNavClick('users.settings')}
              className="w-full flex justify-center py-1 cursor-pointer"
              title={`${currentUser.name} - ${currentUser.role}`}
            >
              <div className="relative">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700 shadow-2xs"
                />
                <span
                  className={`absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${
                    currentUser.isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Desktop Collapse Toggle Button */}
          <div className="hidden lg:flex items-center shrink-0">
            <button
              id="sidebar-collapse-toggle-btn"
              onClick={() => setIsSidebarCollapsed(prev => !prev)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={isSidebarCollapsed ? 'باز کردن منو' : 'جمع کردن منو'}
            >
              {isSidebarCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          {/* Mobile Close Button */}
          <button
            id="sidebar-mobile-close-btn"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2 select-none scrollbar-thin">
          {/* SECTION 1: داشبوردها */}
          <div className="space-y-1">
            <button
              id="nav-group-dashboards"
              onClick={() => toggleSection('dashboards')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                openSections.dashboards
                  ? 'bg-emerald-50/80 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
                  : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <LayoutDashboard className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                {!isSidebarCollapsed && <span>داشبوردها</span>}
              </div>
              {!isSidebarCollapsed && (
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    openSections.dashboards ? 'rotate-180' : ''
                  }`}
                />
              )}
            </button>

            {openSections.dashboards && !isSidebarCollapsed && (
              <div className="mr-4 pr-3 border-r-2 border-slate-100 dark:border-slate-800 space-y-1 pt-1">
                <button
                  id="nav-sub-overview"
                  onClick={() => handleNavClick('dashboards.overview')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeNav === 'dashboards.overview'
                      ? 'bg-emerald-800 text-white font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-slate-800'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>داشبورد اصلی</span>
                </button>
                <button
                  id="nav-sub-project-dashboard"
                  onClick={() => handleNavClick('dashboards.project')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeNav === 'dashboards.project'
                      ? 'bg-emerald-800 text-white font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-slate-800'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>داشبورد پیشرفت پروژه</span>
                </button>
              </div>
            )}
          </div>

          {/* SECTION 2: پروژه‌ها و اقدامات */}
          <div className="space-y-1">
            <button
              id="nav-group-projects"
              onClick={() => toggleSection('projects')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                openSections.projects
                  ? 'bg-emerald-50/80 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
                  : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <FolderKanban className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                {!isSidebarCollapsed && <span>پروژه‌ها و اقدامات</span>}
              </div>
              <div className="flex items-center gap-2">
                {totalProjectsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500 text-white shadow-xs font-mono">
                    {toPersianDigits(totalProjectsCount)}
                  </span>
                )}
                {!isSidebarCollapsed && (
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      openSections.projects ? 'rotate-180' : ''
                    }`}
                  />
                )}
              </div>
            </button>

            {openSections.projects && !isSidebarCollapsed && (
              <div className="mr-4 pr-3 border-r-2 border-slate-100 dark:border-slate-800 space-y-1 pt-1">
                <button
                  id="nav-sub-portfolio"
                  onClick={() => handleNavClick('projects.portfolio')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeNav === 'projects.portfolio'
                      ? 'bg-emerald-800 text-white font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FolderKanban className="w-4 h-4" />
                    <span>پروژه‌ها و اقدامات</span>
                  </div>
                  {totalProjectsCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-mono">
                      {toPersianDigits(totalProjectsCount)}
                    </span>
                  )}
                </button>
                <button
                  id="nav-sub-create-project"
                  onClick={() => handleNavClick('projects.newProject')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4 text-emerald-600" />
                  <span>ایجاد پروژه</span>
                </button>
                <button
                  id="nav-sub-create-action"
                  onClick={() => handleNavClick('projects.newAction')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <FilePlus2 className="w-4 h-4 text-emerald-600" />
                  <span>ایجاد اقدام</span>
                </button>
              </div>
            )}
          </div>

          {/* SECTION 3: کارتابل وظایف و تاییدات */}
          <div className="space-y-1">
            <button
              id="nav-group-inbox"
              onClick={() => toggleSection('inbox')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                openSections.inbox
                  ? 'bg-emerald-50/80 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
                  : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Inbox className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                {!isSidebarCollapsed && <span>کارتابل وظایف و تاییدات</span>}
              </div>
              <div className="flex items-center gap-2">
                {actions.length + pendingApprovalsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500 text-white shadow-xs font-mono">
                    {toPersianDigits(actions.length + pendingApprovalsCount)}
                  </span>
                )}
                {!isSidebarCollapsed && (
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      openSections.inbox ? 'rotate-180' : ''
                    }`}
                  />
                )}
              </div>
            </button>

            {openSections.inbox && !isSidebarCollapsed && (
              <div className="mr-4 pr-3 border-r-2 border-slate-100 dark:border-slate-800 space-y-1 pt-1">
                <button
                  id="nav-sub-task-inbox"
                  onClick={() => handleNavClick('inbox.tasks')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeNav === 'inbox.tasks'
                      ? 'bg-emerald-800 text-white font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>کارتابل وظایف</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    {toPersianDigits(actions.length)}
                  </span>
                </button>
                <button
                  id="nav-sub-approvals"
                  onClick={() => handleNavClick('inbox.approvals')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeNav === 'inbox.approvals'
                      ? 'bg-emerald-800 text-white font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span>تاییدات</span>
                  </div>
                  {pendingApprovalsCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-mono">
                      {toPersianDigits(pendingApprovalsCount)}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* SECTION 4: چت داخلی رمزنگاری شده (طلب شده در پرامپت) */}
          <div className="space-y-1">
            <button
              id="nav-group-chat"
              onClick={() => handleNavClick('chat')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                activeNav === 'chat'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <MessageSquare className={`w-5 h-5 shrink-0 ${activeNav === 'chat' ? 'text-white' : 'text-emerald-700 dark:text-emerald-400'}`} />
                {!isSidebarCollapsed && <span>چت و گفتگوی سازمانی</span>}
              </div>
            </button>
          </div>

          {/* SECTION 5: مدیریت دانش و استراتژی */}
          <div className="space-y-1">
            <button
              id="nav-group-knowledge"
              onClick={() => toggleSection('knowledge')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                openSections.knowledge
                  ? 'bg-emerald-50/80 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
                  : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Network className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                {!isSidebarCollapsed && <span>مدیریت دانش و استراتژی</span>}
              </div>
              {!isSidebarCollapsed && (
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    openSections.knowledge ? 'rotate-180' : ''
                  }`}
                />
              )}
            </button>

            {openSections.knowledge && !isSidebarCollapsed && (
              <div className="mr-4 pr-3 border-r-2 border-slate-100 dark:border-slate-800 space-y-1 pt-1">
                <button
                  id="nav-sub-knowledge"
                  onClick={() => handleNavClick('knowledge.items')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeNav === 'knowledge.items'
                      ? 'bg-emerald-800 text-white font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-slate-800'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>مدیریت دانش</span>
                </button>
                <button
                  id="nav-sub-strategy"
                  onClick={() => handleNavClick('knowledge.strategy')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeNav === 'knowledge.strategy'
                      ? 'bg-emerald-800 text-white font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Network className="w-4 h-4" />
                  <span>استراتژی</span>
                </button>
              </div>
            )}
          </div>

          {/* SECTION 6: کاربران و تنظیمات */}
          <div className="space-y-1">
            <button
              id="nav-group-users"
              onClick={() => toggleSection('users')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                openSections.users
                  ? 'bg-emerald-50/80 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
                  : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Settings className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                {!isSidebarCollapsed && <span>کاربران و تنظیمات</span>}
              </div>
              {!isSidebarCollapsed && (
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    openSections.users ? 'rotate-180' : ''
                  }`}
                />
              )}
            </button>

            {openSections.users && !isSidebarCollapsed && (
              <div className="mr-4 pr-3 border-r-2 border-slate-100 dark:border-slate-800 space-y-1 pt-1">
                <button
                  id="nav-sub-users"
                  onClick={() => handleNavClick('users.list')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeNav === 'users.list'
                      ? 'bg-emerald-800 text-white font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>مدیریت کاربران</span>
                </button>
                <button
                  id="nav-sub-settings"
                  onClick={() => handleNavClick('users.settings')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeNav === 'users.settings'
                      ? 'bg-emerald-800 text-white font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>تنظیمات</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Post Bank System Footer */}
        {!isSidebarCollapsed && (
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-0.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-semibold text-[11px] text-emerald-800 dark:text-emerald-400">پست بانک ایران</span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">نسخه سازمانی</span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
              سامانه جامع پایش و مدیریت پروژه‌ها
            </p>
          </div>
        )}
      </aside>
    </>
  );
};
