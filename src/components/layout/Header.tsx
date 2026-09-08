import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  Plus,
  Clock,
  Calendar,
  Check,
  ExternalLink,
  Trash2,
  FolderPlus,
  FilePlus2,
  LogOut
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PostBankLogo } from '../common/PostBankLogo';
import { toPersianDigits } from '../../utils/persianDigits';

export const Header: React.FC = () => {
  const {
    setIsMobileSidebarOpen,
    setIsGlobalSearchOpen,
    settings,
    toggleTheme,
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    pushPermission,
    enablePushNotifications,
    setIsCreateProjectModalOpen,
    setIsCreateActionModalOpen,
    setActiveNav,
    logout
  } = useApp();

  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState<boolean>(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState<boolean>(false);
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());
  const notifRef = useRef<HTMLDivElement>(null);
  const createRef = useRef<HTMLDivElement>(null);

  // Live ticking clock (seconds update)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const persianDateStr = toPersianDigits(
    currentDateTime.toLocaleDateString('fa-IR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  );

  const persianTimeStr = toPersianDigits(
    currentDateTime.toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  );

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifDropdownOpen(false);
      }
      if (createRef.current && !createRef.current.contains(event.target as Node)) {
        setIsQuickCreateOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsGlobalSearchOpen]);

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-4 flex items-center justify-between sticky top-0 z-30 shadow-xs relative">
      {/* Right Column: Hamburger Toggle + Post Bank Logo */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          id="mobile-hamburger-toggle"
          onClick={() => setIsMobileSidebarOpen(true)}
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="باز کردن منوی موبایل"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center">
          <PostBankLogo size="sm" showText={true} />
        </div>
      </div>

      {/* Center Column: Search Box (Strictly Centered in Header on Desktop) */}
      <div className="hidden md:flex items-center justify-center flex-1 max-w-md lg:max-w-lg mx-4">
        <button
          id="global-search-trigger"
          onClick={() => setIsGlobalSearchOpen(true)}
          className="w-full flex items-center justify-between bg-slate-100/90 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 text-slate-500 dark:text-slate-400 px-4 py-2 rounded-xl text-xs transition-all border border-slate-200/60 dark:border-slate-700/60 shadow-2xs group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="truncate">جستجو در پروژه‌ها، اقدامات، اسناد و همکاران...</span>
          </div>
          <span className="shrink-0 text-[10px] text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
            جستجو
          </span>
        </button>
      </div>

      {/* Left Column: Mobile Search Trigger + Quick Actions + Notifications + Theme + Clock + Logout */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Mobile Search Button (Dedicated and non-disruptive for mobile view) */}
        <button
          id="mobile-search-trigger"
          onClick={() => setIsGlobalSearchOpen(true)}
          className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="جستجو در سامانه"
          aria-label="جستجو در سامانه"
        >
          <Search className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>

        {/* Quick Create Dropdown */}
        <div className="relative" ref={createRef}>
          <button
            id="quick-create-button"
            onClick={() => setIsQuickCreateOpen(prev => !prev)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">ایجاد جدید</span>
          </button>

          {isQuickCreateOpen && (
            <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1.5 z-50 animate-in fade-in zoom-in-95">
              <button
                id="quick-create-project-opt"
                onClick={() => {
                  setIsCreateProjectModalOpen(true);
                  setIsQuickCreateOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-700/60 text-right"
              >
                <FolderPlus className="w-4 h-4 text-emerald-600" />
                <span>ایجاد پروژه جدید</span>
              </button>
              <button
                id="quick-create-action-opt"
                onClick={() => {
                  setIsCreateActionModalOpen(true);
                  setIsQuickCreateOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-700/60 text-right"
              >
                <FilePlus2 className="w-4 h-4 text-emerald-600" />
                <span>ایجاد اقدام جدید</span>
              </button>
            </div>
          )}
        </div>

        {/* Notification Bell Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            id="notifications-bell-btn"
            onClick={() => setIsNotifDropdownOpen(prev => !prev)}
            className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="اعلان‌ها و رویدادها"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse font-mono">
                {toPersianDigits(unreadNotificationsCount > 9 ? '+9' : unreadNotificationsCount)}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {isNotifDropdownOpen && (
            <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in">
              <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    سیستم اعلان‌ها و رویدادها
                  </h3>
                  {unreadNotificationsCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-mono">
                      {toPersianDigits(unreadNotificationsCount)} خوانده نشده
                    </span>
                  )}
                </div>
                {unreadNotificationsCount > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    علامت‌گذاری همه
                  </button>
                )}
              </div>

              {/* Push Permission Prompt if not granted */}
              {pushPermission !== 'granted' && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-100 dark:border-amber-900/40 flex items-center justify-between">
                  <div className="text-[11px] text-amber-800 dark:text-amber-200">
                    برای دریافت هشدارهای لحظه‌ای، نوتیفیکیشن مرورگر را فعال کنید.
                  </div>
                  <button
                    onClick={enablePushNotifications}
                    className="px-2.5 py-1 text-[10px] font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors shrink-0"
                  >
                    فعال‌سازی
                  </button>
                </div>
              )}

              {/* Notifications List */}
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    هیچ اعلانی در حال حاضر وجود ندارد
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationAsRead(n.id)}
                      className={`p-3 text-right hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer ${
                        !n.read ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {n.title}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {toPersianDigits(n.timestamp)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-center">
                <button
                  onClick={() => {
                    setActiveNav('inbox.approvals');
                    setIsNotifDropdownOpen(false);
                  }}
                  className="text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
                >
                  مشاهده همه درخواست‌ها و کارتابل
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Dark / Light Mode Toggle Button */}
        <button
          id="theme-toggle-button"
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={settings.theme === 'dark' ? 'حالت روز' : 'حالت شب'}
        >
          {settings.theme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-slate-600" />
          )}
        </button>

        {/* Live Clock & Date Widget */}
        <div
          id="header-live-clock"
          className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 select-none shadow-2xs transition-colors"
          title="ساعت و تاریخ رسمی سامانه"
        >
          <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div className="flex items-center gap-2 text-right">
            <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 tracking-wider">
              {persianTimeStr}
            </span>
            <span className="hidden xl:inline-block w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
            <span className="hidden lg:inline-block text-[11px] text-slate-600 dark:text-slate-300 font-medium">
              {persianDateStr}
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          id="header-logout-button"
          onClick={logout}
          className="p-2 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          title="خروج از حساب کاربری"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
