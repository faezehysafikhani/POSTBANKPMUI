import React, { useContext, ReactElement, useState, useMemo, useEffect } from 'react';
import { LoginPortalClock } from './LoginPortalClock';
import { WorkspaceThemeSwitch } from './WorkspaceTheme';
import { HeaderUserMenu } from './HeaderUserMenu';
import { LocalizationContext } from '../context';
import { User } from '../types';
import { toPersianDigits, appLogoUrl } from '../utils';

export const Header = ({ user, onNavigate }: { user: User, onLogout?: () => void, onNavigate?: (page: string) => void }): ReactElement => {
  const { t } = useContext(LocalizationContext);
  return React.createElement("header", null,
    React.createElement("div", { className: "header-content" },
      React.createElement("div", { className: "header-title-group" },
        React.createElement("img", { src: "/post-bank-iran-logo.png", alt: "پست بانک ایران", className: "header-logo" }),
        // The title moves word by word (a «Mexican wave»); splitting Persian letters would break how they join.
        React.createElement("h1", { className: "pb-wave-title", "aria-label": t('mainTitle') },
          t('mainTitle').split(' ').map((word, i, all) => React.createElement(React.Fragment, { key: i },
            React.createElement("span", { className: "pb-wave-word", style: { '--i': i } as React.CSSProperties, "aria-hidden": "true" }, word),
            i < all.length - 1 ? ' ' : null)))
      ),
      React.createElement(LoginPortalClock, { showGregorian: false }),
      React.createElement("div", { className: "user-info" },
        React.createElement(WorkspaceThemeSwitch),
        // Sign-out lives at the bottom of the sidebar; this menu opens the person's own pages.
        React.createElement(HeaderUserMenu, { name: user.name || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username, onNavigate })
      )
    )
  );
};

const toJalaliYear = (date: Date) => Number(new Intl.DateTimeFormat('en-US-u-ca-persian', { year: 'numeric', timeZone: 'Asia/Tehran' }).format(date).replace(/\D/g, ''));
export const Footer = (): ReactElement => {
  const { t, language } = useContext(LocalizationContext);
  return React.createElement("footer", null,
    // The year follows today's date: Shamsi in Persian, Gregorian in English.
    React.createElement("p", null, t('footerText', { year: language === 'fa'
      ? toPersianDigits(String(toJalaliYear(new Date())))
      : String(new Date().getFullYear()) }))
  );
};

export interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string, context?: any) => void;
  currentUser: User | null;
  overdueProjectsCount: number;
  pendingApprovalsCount: number;
  taskCenterNotificationCount: number;
  onLogout?: () => void;
}

interface SubMenuItem {
  id: string;
  page: string;
  context?: any;
  nameFa: string;
  nameEn: string;
  icon: string;
}

interface MenuItem {
  id?: string;
  page?: string;
  context?: any;
  nameFa: string;
  nameEn: string;
  icon: string;
  count: number;
  roles?: string[];
  subItems?: SubMenuItem[];
}

interface MenuGroup {
  id: string;
  page?: string;
  titleFa: string;
  titleEn: string;
  icon: string;
  items: MenuItem[];
}

export const Sidebar = ({
  currentPage,
  onNavigate,
  currentUser,
  overdueProjectsCount,
  pendingApprovalsCount,
  taskCenterNotificationCount,
  onLogout
}: SidebarProps): ReactElement | null => {
  const { t, language } = useContext(LocalizationContext);
  const [isCollapsed, setIsCollapsed] = useState(false);
  useEffect(() => {
    if (!['settings_profile', 'dashboard'].includes(currentPage)) return;
    const media = window.matchMedia('(max-width: 700px)');
    const collapseForMobile = () => { if (media.matches) setIsCollapsed(true); };
    collapseForMobile();
    media.addEventListener('change', collapseForMobile);
    return () => media.removeEventListener('change', collapseForMobile);
  }, [currentPage]);
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const [expandedSubMenuId, setExpandedSubMenuId] = useState<string | null>(null);
  const [hoveredSubMenuId, setHoveredSubMenuId] = useState<string | null>(null);

  const isFa = language === 'fa' || !language;

  const menuGroups: MenuGroup[] = useMemo(() => [
    {
      id: 'dashboards',
      page: 'dashboard',
      titleFa: 'داشبورد مدیریتی',
      titleEn: 'Management Dashboard',
      icon: 'dashboard',
      items: [
        {
          id: 'dashboard',
          page: 'dashboard',
          nameFa: 'داشبورد',
          nameEn: 'Dashboard',
          icon: 'dashboard_customize',
          count: 0
        }
      ]
    },
    {
      id: 'reports',
      page: 'reports_dashboard',
      titleFa: 'گزارشات',
      titleEn: 'Reports',
      icon: 'summarize',
      items: [{ id: 'reports_dashboard', page: 'reports_dashboard', nameFa: 'گزارشات', nameEn: 'Reports', icon: 'analytics', count: 0 }]
    },
    {
      id: 'projects_actions',
      page: 'portfolio',
      titleFa: 'سبد پروژه‌ها و اقدامات',
      titleEn: 'Projects & Actions Portfolio',
      icon: 'folder_special',
      items: [
        {
          id: 'portfolio',
          page: 'portfolio',
          nameFa: 'سبد پروژه‌ها و اقدامات',
          nameEn: 'Projects & Actions Portfolio',
          icon: 'inventory',
          count: overdueProjectsCount
        }

      ]
    },
    {
      id: 'tasks_approvals',
      titleFa: 'کارتابل وظایف و تاییدات',
      titleEn: 'Task Inbox & Approvals',
      icon: 'inbox',
      items: [
        {
          id: 'task_center',
          page: 'task_center',
          nameFa: 'کارتابل وظایف',
          nameEn: 'Task Center',
          icon: 'task_alt',
          count: taskCenterNotificationCount
        },
        {
          id: 'approval_center',
          page: 'approval_center',
          nameFa: 'تاییدات',
          nameEn: 'Approval Center',
          icon: 'approval',
          count: pendingApprovalsCount
        }
      ]
    },
    {
      id: 'knowledge_strategy',
      titleFa: 'مدیریت دانش و استراتژی',
      titleEn: 'Knowledge & Strategy',
      icon: 'hub',
      items: [
        {
          id: 'knowledge_management',
          page: 'knowledge_management',
          nameFa: 'مدیریت دانش',
          nameEn: 'Knowledge Management',
          icon: 'school',
          count: 0
        },
        {
          id: 'strategy_management',
          page: 'strategy_management',
          nameFa: 'استراتژی',
          nameEn: 'Strategy Management',
          icon: 'lan',
          count: 0,
          roles: ['Admin', 'Project Manager']
        }
      ]
    },
    {
      id: 'users_settings',
      titleFa: 'کاربران و تنظیمات',
      titleEn: 'Users & Settings',
      icon: 'settings_suggest',
      items: [
        {
          id: 'settings_profile',
          page: 'settings_profile',
          nameFa: 'تنظیمات و پروفایل',
          nameEn: 'Settings & Profile',
          icon: 'settings',
          count: 0
        }
      ]
    }
  ].sort((a, b) => ['dashboards', 'projects_actions', 'tasks_approvals', 'knowledge_strategy', 'reports', 'users_settings'].indexOf(a.id) - ['dashboards', 'projects_actions', 'tasks_approvals', 'knowledge_strategy', 'reports', 'users_settings'].indexOf(b.id)), [overdueProjectsCount, pendingApprovalsCount, taskCenterNotificationCount]);

  if (!currentUser) return null;

  const isItemActive = (item: MenuItem | SubMenuItem) => {
    if (item.page && currentPage === item.page) return true;
    if ('subItems' in item && item.subItems) {
      return item.subItems.some(sub => sub.page === currentPage);
    }
    if (item.page === 'dashboard' && ['dashboard', 'dashboard_hub', 'project_dashboard_details'].includes(currentPage)) return true;
    if (item.page === 'action_dashboard' && currentPage === 'action_dashboard') return true;
    if (item.page === 'portfolio' && ['view_snapshot', 'create_project', 'create_waterfall_details', 'create_agile_details', 'define_action'].includes(currentPage)) return true;
    if (item.page === 'strategy_management' && ['define_strategies', 'alignment_matrix'].includes(currentPage)) return true;
    if (item.page === 'settings_profile' && ['edit_calendar'].includes(currentPage)) return true;
    return false;
  };

  const handleToggleGroup = (groupId: string) => {
    if (isCollapsed) {
      setIsCollapsed(false);
    }
    setOpenGroupId(prev => prev === groupId ? null : groupId);
  };

  const handleToggleSubMenu = (itemId: string, e: React.MouseEvent, isCurrentlyExpanded: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedSubMenuId(isCurrentlyExpanded ? '__CLOSED__' : itemId);
  };

  const collapseIcon = isCollapsed
    ? (language === 'fa' ? 'chevron_left' : 'chevron_right')
    : (language === 'fa' ? 'chevron_right' : 'chevron_left');

  return (
    React.createElement("aside", { className: `app-sidebar ${isCollapsed ? 'collapsed' : ''}` },
      React.createElement("div", { className: "sidebar-header" },
        !isCollapsed && React.createElement("div", { className: "sidebar-title-wrapper" },
          React.createElement("span", { className: "material-symbols-outlined sidebar-header-icon" }, "menu_open"),
          React.createElement("span", { className: "sidebar-title" }, t('mainMenuTitle'))
        ),
        React.createElement("button", {
          className: "sidebar-toggle-btn",
          onClick: () => setIsCollapsed(!isCollapsed),
          title: isCollapsed ? (isFa ? 'بزرگ‌نمایی منو' : 'Expand menu') : (isFa ? 'کوچک‌سازی منو' : 'Collapse menu'),
          "aria-label": "Toggle sidebar"
        },
          React.createElement("span", { className: "material-symbols-outlined" }, collapseIcon)
        )
      ),
      React.createElement("nav", { className: "sidebar-nav", "aria-label": "Sidebar Navigation" },
        menuGroups.map((group) => {
          const visibleItems = group.items.filter(item => {
            if (item.roles && !item.roles.includes(currentUser.role)) {
              return false;
            }
            return true;
          });

          if (visibleItems.length === 0) return null;

          // A group with a single plain item is shown as that item: one button, no submenu.
          const single = visibleItems.length === 1 && !visibleItems[0].subItems?.length ? visibleItems[0] : null;
          const directPage = group.page || single?.page;
          const isOpen = !directPage && openGroupId === group.id;
          const hasActiveChild = visibleItems.some(item => isItemActive(item));
          const totalGroupBadge = visibleItems.reduce((sum, item) => sum + (item.count || 0), 0);
          const groupTitle = isFa ? group.titleFa : group.titleEn;

          return React.createElement("div", {
            key: group.id,
            className: `sidebar-group ${isOpen ? 'open' : ''} ${hasActiveChild ? 'has-active-child' : ''}`
          },
            React.createElement("button", {
              type: "button",
              className: `sidebar-group-header ${isOpen ? 'open' : ''} ${hasActiveChild ? 'active-parent' : ''}`,
              onClick: () => directPage ? onNavigate(directPage, single?.context) : handleToggleGroup(group.id),
              title: isCollapsed ? groupTitle : undefined,
              "aria-expanded": directPage ? undefined : isOpen,
              "aria-current": directPage === currentPage ? "page" : undefined
            },
              React.createElement("div", { className: "sidebar-group-header-left" },
                React.createElement("span", { className: "material-symbols-outlined sidebar-icon" }, group.icon),
                !isCollapsed && React.createElement("span", { className: "sidebar-group-title" }, groupTitle)
              ),
              !isCollapsed && React.createElement("div", { className: "sidebar-group-header-right" },
                (!isOpen && totalGroupBadge > 0) && React.createElement("span", { className: "sidebar-badge" }, isFa ? toPersianDigits(totalGroupBadge) : totalGroupBadge),
                !directPage && React.createElement("span", { className: "material-symbols-outlined sidebar-group-chevron" }, isOpen ? "expand_less" : "expand_more")
              ),
              (isCollapsed && !isOpen && totalGroupBadge > 0) && React.createElement("span", { className: "sidebar-badge collapsed-badge" }, isFa ? toPersianDigits(totalGroupBadge) : totalGroupBadge)
            ),
            (!isCollapsed && isOpen) && React.createElement("div", { className: "sidebar-group-items" },
              visibleItems.map(item => {
                const active = isItemActive(item);
                const itemName = isFa ? item.nameFa : item.nameEn;
                const hasSubItems = item.subItems && item.subItems.length > 0;
                const isSubMenuExpanded = expandedSubMenuId === (item.id || item.nameEn) || (active && expandedSubMenuId !== '__CLOSED__');

                if (hasSubItems) {
                  return React.createElement("div", { key: item.id || item.nameEn, className: "sidebar-subitem-group" },
                    React.createElement("a", {
                      href: "#",
                      className: `sidebar-subitem ${active ? 'active-parent' : ''}`,
                      role: "button",
                      onClick: (e: React.MouseEvent) => handleToggleSubMenu(item.id || item.nameEn, e, isSubMenuExpanded)
                    },
                      React.createElement("span", { className: "material-symbols-outlined sidebar-subitem-icon" }, item.icon),
                      React.createElement("span", { className: "sidebar-text" }, itemName),
                      React.createElement("span", { className: "material-symbols-outlined sidebar-subitem-chevron" },
                        isSubMenuExpanded ? "expand_less" : "expand_more"
                      )
                    ),
                    isSubMenuExpanded && React.createElement("div", { className: "sidebar-nested-items" },
                      item.subItems!.map(sub => {
                        const subActive = currentPage === sub.page;
                        const subName = isFa ? sub.nameFa : sub.nameEn;
                        return React.createElement("a", {
                          href: "#",
                          key: sub.id,
                          className: `sidebar-nested-subitem ${subActive ? 'active' : ''}`,
                          role: "button",
                          onClick: (e: React.MouseEvent) => {
                            e.preventDefault();
                            onNavigate(sub.page, sub.context);
                          }
                        },
                          React.createElement("span", { className: "material-symbols-outlined nested-icon" }, sub.icon),
                          React.createElement("span", null, subName)
                        );
                      })
                    )
                  );
                }

                return React.createElement("a", {
                  href: "#",
                  key: item.page || item.nameEn,
                  className: `sidebar-subitem ${active ? 'active' : ''}`,
                  role: "button",
                  onClick: (e: React.MouseEvent) => {
                    e.preventDefault();
                    if (item.page) {
                      onNavigate(item.page, item.context);
                    }
                  }
                },
                  React.createElement("span", { className: "material-symbols-outlined sidebar-subitem-icon" }, item.icon),
                  React.createElement("span", { className: "sidebar-text" }, itemName),
                  item.count > 0 && React.createElement("span", { className: "sidebar-badge" }, isFa ? toPersianDigits(item.count) : item.count)
                );
              })
            ),
            (isCollapsed && isItemActive(group.items[0]) && false) && null
          );
        }),
        // Sign-out, right under «کاربران و تنظیمات».
        onLogout && React.createElement("div", { className: "sidebar-group sidebar-logout" },
          React.createElement("button", { type: "button", className: "sidebar-group-header sidebar-logout-button", onClick: onLogout, title: isCollapsed ? (isFa ? 'خروج از سیستم' : 'Sign out') : undefined },
            React.createElement("div", { className: "sidebar-group-header-left" },
              React.createElement("span", { className: "material-symbols-outlined sidebar-icon" }, "logout"),
              !isCollapsed && React.createElement("span", { className: "sidebar-group-title" }, isFa ? 'خروج از سیستم' : 'Sign out')
            )
          )
        )
      )
    )
  );
};
