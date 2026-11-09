
import React, { useContext, useState, useEffect, useRef, FormEvent, MouseEvent, ReactElement, useMemo } from 'react';
import { LocalizationContext, ThemeContext } from '../context';
import { User, UserRole, TranslationKey, VisibilitySettings, DynamicWorkflowSettings } from '../types';
import { useGovernance } from '../directory/GovernanceContext';
import { toPersianDigits, appLogoUrl, appLogoWatermarkUrl } from '../utils';
import { FeaturesHandbook } from '../components/FeaturesHandbook';
import { DynamicWorkflowSettingsEditor } from '../components/DynamicWorkflowSettingsEditor';
import { LoginPortalClock } from '../components/LoginPortalClock';
import { FloatingSpheresCanvas } from '../components/FloatingSpheresCanvas';


// --- LoginPage ---
export const LoginPage = ({ onLogin, error, notice, captcha, onRefreshCaptcha }: {
  /** Signs in against the backend; the backend decides whether a CAPTCHA is needed and what any failure says. */
  onLogin: (username: string, password: string, captchaAnswer?: string) => Promise<void>,
  error: string | null,
  /** Why the previous session ended (from the backend), shown above the form. */
  notice?: string | null,
  captcha?: { imageDataUrl: string } | null,
  onRefreshCaptcha?: () => void
}): ReactElement => {
  const { t, language, setLanguage } = useContext(LocalizationContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFa = language === 'fa';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onLogin(username, password, captchaAnswer || undefined);
    } finally {
      setCaptchaAnswer('');
      setIsSubmitting(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fa' : 'en');
  };


  return (
    <div className="pb-login" id="login-container-root"><svg className="pb-flowing-background" viewBox="0 0 1744 920" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="pb-flow-green" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#b7e6d2"/><stop offset=".55" stopColor="#21a975"/><stop offset="1" stopColor="#00633d"/></linearGradient><linearGradient id="pb-flow-mint" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f5fcf8" stopOpacity=".95"/><stop offset="1" stopColor="#94d7bb" stopOpacity=".65"/></linearGradient></defs><path d="M1120 0H1744V920H0V850C460 560 790 1130 1240 480C1400 250 1460 110 1520 0Z" fill="url(#pb-flow-green)"/><g stroke="#effff6" strokeOpacity=".8" strokeWidth="1.2"><path d="M0 750C440 400 780 890 1320 0H1460C1100 570 1000 900 520 850C270 820 170 760 0 860Z" fill="url(#pb-flow-mint)"/><path d="M0 870C370 650 650 990 1120 700C1390 530 1430 240 1744 100V320C1460 390 1400 700 1050 840C600 1020 390 700 0 920Z" fill="url(#pb-flow-mint)"/><path d="M0 920C380 680 640 1060 1160 800C1410 680 1510 510 1744 480" fill="none"/><path d="M0 670C440 350 760 590 1060 0" fill="none" strokeOpacity=".35"/></g></svg><img className="pb-brand-watermark" src="/post-bank-iran-logo.png" alt="" aria-hidden="true" /><section className="pb-brand"><img className="pb-brand-mark" src="/post-bank-iran-logo.png" alt="نشان پست بانک ایران" width="160" height="160" /><LoginPortalClock /><div className="pb-features">{[['task_alt','اقدامات پروژه'],['layers','مدیریت پروژه'],['calendar_month','پایش و پیگیری'],['bar_chart','گزارش‌ها و داشبوردها']].map(([icon,label])=><div key={icon}><span className="material-symbols-outlined" aria-hidden="true">{icon}</span>{label}</div>)}</div></section>
      <FloatingSpheresCanvas />
      {/* Decorative ambient background glows */}
      <div className="login-ambient-glow login-glow-1" />
      <div className="login-ambient-glow login-glow-2" />

      {/* Glassmorphic Login Card */}
      <div className="login-form-wrapper glass-panel" id="login-card-wrapper">
        <div className="login-header">
          {/* Logo with no background box or glow ring beneath it */}
          <div className="login-logo-container" id="login-logo-container">
            <span className="material-symbols-outlined pb-person" aria-hidden="true">person</span>
          </div>

          <h2 className="login-main-title">{isFa ? 'سامانه مدیریت پروژه' : 'Project Management System'}</h2>
          <p className="login-subtitle">
            {isFa
              ? 'به سامانه پست بانک ایران خوش آمدید'
              : 'Smart Project & Task Management System'}
          </p>

        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-input-group">
            <label htmlFor="login-username" className="login-label">
              <span className="material-symbols-outlined login-input-icon">person</span>
              <span>{t('username')}</span>
            </label>
            <div className="login-input-wrapper">
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isFa ? 'نام کاربری خود را وارد کنید...' : 'Enter your username...'}
                required
                autoComplete="username"
                className="login-input"
              />
            </div>
          </div>

          <div className="login-input-group">
            <label htmlFor="login-password" className="login-label">
              <span className="material-symbols-outlined login-input-icon">lock</span>
              <span>{t('password')}</span>
            </label>
            <div className="login-input-wrapper">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isFa ? 'رمز عبور...' : 'Enter password...'}
                required
                autoComplete="current-password"
                className="login-input password-input"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? (isFa ? 'مخفی‌سازی رمز' : 'Hide password') : (isFa ? 'نمایش رمز' : 'Show password')}

              >
                <span className="material-symbols-outlined">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {captcha && (
            <div className="login-input-group">
              <label htmlFor="login-captcha" className="login-label">
                <span className="material-symbols-outlined login-input-icon">shield</span>
                <span>{isFa ? 'کد امنیتی' : 'Security code'}</span>
              </label>
              <div className="login-input-wrapper" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <img src={captcha.imageDataUrl} alt="captcha" style={{ height: '44px', borderRadius: '6px' }} />
                <button type="button" className="password-toggle-btn" onClick={onRefreshCaptcha} title={isFa ? 'تصویر جدید' : 'New image'} tabIndex={-1}>
                  <span className="material-symbols-outlined">refresh</span>
                </button>
                <input
                  id="login-captcha"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  required
                  className="login-input"
                />
              </div>
            </div>
          )}

          {notice && !error && (
            <div className="login-error-banner" id="session-end-notice">
              <span className="material-symbols-outlined">info</span>
              <span>{notice}</span>
            </div>
          )}

          {error && (
            <div className="login-error-banner" role="alert">
              <span className="material-symbols-outlined">error</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className={`login-btn ${isSubmitting ? 'loading' : ''}`}
            disabled={isSubmitting}
            id="login-submit-btn"
          >
            <span className="material-symbols-outlined">login</span>
            <span>{isSubmitting ? (isFa ? 'در حال بررسی...' : 'Signing in...') : (isFa ? 'ورود به سامانه' : 'Sign in')}</span>
          </button>

          <div className="login-actions-row">
            {/* Language Switcher */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="login-pill-btn"
              id="login-lang-toggle"
              title={isFa ? 'Change language' : 'تغییر زبان'}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>language</span>
              <span>{language === 'en' ? 'فارسی' : 'English'}</span>
            </button>
          </div>
        </form>

        {/* Support & Contact Footer */}
        <div className="login-support-info">
          <div className="support-badge-item">
            <span className="material-symbols-outlined">call</span>
            <span dir="ltr">۰۲۱-۸۸۷۳۱۶۰۱</span>
          </div>
          <div className="support-separator">•</div>
          <div className="support-badge-item">
            <span className="material-symbols-outlined">mail</span>
            <span dir="ltr">info@parspmi.ir</span>
          </div>
        </div>
      </div>
    </div>
  );
};


// --- MainMenu (Home Overview) ---
export const MainMenu = ({ onNavigate, currentUser, overdueProjectsCount, pendingApprovalsCount, taskCenterNotificationCount }: {
    onNavigate: (page: string, context?: any) => void,
    currentUser: User | null,
    overdueProjectsCount: number,
    pendingApprovalsCount: number,
    taskCenterNotificationCount: number
}): ReactElement => {
  const { t, language } = useContext(LocalizationContext);
  const [createProjectDropdownOpen, setCreateProjectDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isFa = language === 'fa' || !language;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | globalThis.MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setCreateProjectDropdownOpen(false);
      }
    };
    if (createProjectDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [createProjectDropdownOpen]);

  const getRoleTitle = (role?: UserRole) => {
    if (!role) return '';
    if (role === 'Admin') return t('admin');
    if (role === 'Project Manager') return t('projectManagerRole');
    if (role === 'Project Team') return t('projectTeamRole');
    return role;
  };

  return (
    React.createElement("div", { className: "content-container home-overview-container" },
      React.createElement("div", { className: "home-welcome-card" },
        React.createElement("div", { className: "welcome-avatar" },
          React.createElement("span", { className: "material-symbols-outlined" }, "person")
        ),
        React.createElement("div", { className: "welcome-info" },
          React.createElement("h2", null, t('welcomeUser', { username: currentUser?.username || '' })),
          React.createElement("span", { className: "role-badge" }, getRoleTitle(currentUser?.role)),
          React.createElement("p", { className: "welcome-subtext" },
            language === 'fa'
              ? 'به سامانه مدیریت پروژه و وظایف خوش آمدید. کلیه بخش‌ها و امکانات از طریق منوی سمت راست قابل دسترسی هستند.'
              : 'Welcome to PTMS. All modules and features are accessible via the right-side menu.'
          )
        )
      ),

      React.createElement("div", { className: "overview-metrics-grid" },
        React.createElement("div", { className: "metric-card", onClick: () => onNavigate('dashboard_hub') },
          React.createElement("div", { className: "metric-icon-box primary" },
            React.createElement("span", { className: "material-symbols-outlined" }, "dashboard_customize")
          ),
          React.createElement("div", { className: "metric-details" },
            React.createElement("h3", null, t('projectAndActionDashboard')),
            React.createElement("p", null, language === 'fa' ? 'تحلیل تصویری و گزارش‌های مدیریتی' : 'Visual analytics & dashboards')
          )
        ),

        React.createElement("div", { className: "metric-card", onClick: () => onNavigate('portfolio') },
          React.createElement("div", { className: "metric-icon-box info" },
            React.createElement("span", { className: "material-symbols-outlined" }, "inventory")
          ),
          React.createElement("div", { className: "metric-details" },
            React.createElement("h3", null, t('projectPortfolio')),
            React.createElement("p", null,
              overdueProjectsCount > 0
                ? (language === 'fa' ? `${toPersianDigits(overdueProjectsCount)} پروژه دارای تاخیر` : `${overdueProjectsCount} overdue projects`)
                : (language === 'fa' ? 'مشاهده و مدیریت پروژه‌ها' : 'View & manage projects')
            )
          ),
          overdueProjectsCount > 0 && React.createElement("span", { className: "card-alert-badge" }, language === 'fa' ? toPersianDigits(overdueProjectsCount) : overdueProjectsCount)
        ),

        React.createElement("div", { className: "metric-card", onClick: () => onNavigate('task_center') },
          React.createElement("div", { className: "metric-icon-box success" },
            React.createElement("span", { className: "material-symbols-outlined" }, "task_alt")
          ),
          React.createElement("div", { className: "metric-details" },
            React.createElement("h3", null, t('taskCenter')),
            React.createElement("p", null,
              taskCenterNotificationCount > 0
                ? (language === 'fa' ? `${toPersianDigits(taskCenterNotificationCount)} کار نیازمند بررسی` : `${taskCenterNotificationCount} tasks needing attention`)
                : (language === 'fa' ? 'مشاهده کارهای محوله' : 'View assigned tasks')
            )
          ),
          taskCenterNotificationCount > 0 && React.createElement("span", { className: "card-alert-badge" }, language === 'fa' ? toPersianDigits(taskCenterNotificationCount) : taskCenterNotificationCount)
        ),

        React.createElement("div", { className: "metric-card", onClick: () => onNavigate('approval_center') },
          React.createElement("div", { className: "metric-icon-box warning" },
            React.createElement("span", { className: "material-symbols-outlined" }, "approval")
          ),
          React.createElement("div", { className: "metric-details" },
            React.createElement("h3", null, t('approvalCenter')),
            React.createElement("p", null,
              pendingApprovalsCount > 0
                ? (language === 'fa' ? `${toPersianDigits(pendingApprovalsCount)} مورد در انتظار تایید` : `${pendingApprovalsCount} pending approvals`)
                : (language === 'fa' ? 'تایید گزارش‌های پیشرفت' : 'Approve progress reports')
            )
          ),
          pendingApprovalsCount > 0 && React.createElement("span", { className: "card-alert-badge" }, language === 'fa' ? toPersianDigits(pendingApprovalsCount) : pendingApprovalsCount)
        )
      ),

      React.createElement("div", { className: "quick-access-section" },
        React.createElement("h3", { className: "section-title" }, language === 'fa' ? 'دسترسی‌های سریع' : 'Quick Access'),
        React.createElement("div", { className: "quick-actions-flex" },
          ['Admin', 'Project Manager'].includes(currentUser?.role || '') && (
            React.createElement("div", { className: "quick-action-dropdown-wrapper", ref: dropdownRef },
              React.createElement("button", {
                type: "button",
                className: `quick-action-btn ${createProjectDropdownOpen ? 'active' : ''}`,
                onClick: () => setCreateProjectDropdownOpen(prev => !prev),
                "aria-expanded": createProjectDropdownOpen
              },
                React.createElement("span", { className: "material-symbols-outlined" }, "add_business"),
                React.createElement("span", null, t('createProject')),
                React.createElement("span", { className: "material-symbols-outlined", style: { fontSize: '1.1rem', marginInlineStart: '4px', transform: createProjectDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' } },
                  'expand_more'
                )
              ),
              createProjectDropdownOpen && React.createElement("div", { className: "quick-action-dropdown-menu" },
                React.createElement("button", {
                  type: "button",
                  className: "quick-action-dropdown-item",
                  onClick: () => {
                    setCreateProjectDropdownOpen(false);
                    onNavigate('create_waterfall_details', { type: 'waterfall' });
                  }
                },
                  React.createElement("div", { className: "item-icon-box" },
                    React.createElement("span", { className: "material-symbols-outlined" }, "account_tree")
                  ),
                  React.createElement("div", { className: "item-text" },
                    React.createElement("span", { className: "item-title" }, t('waterfallProject')),
                    React.createElement("span", { className: "item-desc" },
                      isFa ? 'پروژه‌های ساختاریافته و فازبندی شده با گانت چارت' : 'Structured phased projects with Gantt chart'
                    )
                  )
                ),
                React.createElement("button", {
                  type: "button",
                  className: "quick-action-dropdown-item",
                  onClick: () => {
                    setCreateProjectDropdownOpen(false);
                    onNavigate('create_agile_details', { type: 'agile' });
                  }
                },
                  React.createElement("div", { className: "item-icon-box" },
                    React.createElement("span", { className: "material-symbols-outlined" }, "sync_alt")
                  ),
                  React.createElement("div", { className: "item-text" },
                    React.createElement("span", { className: "item-title" }, t('agileProject')),
                    React.createElement("span", { className: "item-desc" },
                      isFa ? 'پروژه‌های چابک مبتنی بر اسپرینت، اسکرام و کانبان' : 'Agile sprint, Scrum and Kanban projects'
                    )
                  )
                )
              )
            )
          ),
          ['Admin', 'Project Manager'].includes(currentUser?.role || '') && (
            React.createElement("button", { className: "quick-action-btn", onClick: () => onNavigate('define_action') },
              React.createElement("span", { className: "material-symbols-outlined" }, "edit_note"),
              t('defineAction')
            )
          ),
          React.createElement("button", { className: "quick-action-btn secondary", onClick: () => onNavigate('knowledge_management') },
            React.createElement("span", { className: "material-symbols-outlined" }, "school"),
            t('knowledgeManagement')
          ),
          currentUser?.role === 'Admin' && (
            React.createElement("button", { className: "quick-action-btn secondary", onClick: () => onNavigate('settings_profile') },
              React.createElement("span", { className: "material-symbols-outlined" }, "settings"),
              t('settings')
            )
          )
        )
      ),

      React.createElement("div", { className: "navigation-hint-banner" },
        React.createElement("span", { className: "material-symbols-outlined hint-icon" }, "info"),
        React.createElement("span", null,
          language === 'fa'
            ? 'نکته: جهت پیمایش بین کلیه بخش‌های نرم‌افزار، از آیکون‌های منوی سمت راست استفاده نمایید.'
            : 'Tip: Use the icons in the right-side menu for navigating between all application modules.'
        )
      )
    )
  );
};

// --- SettingsPage ---
export const SettingsPage = ({
  onNavigate,
  currentUser,
  users = [],
  only
}: {
  /** Show just one block, open and without the page title (used by the settings page's project tab). */
  only?: 'workflow' | 'visibility',
  onNavigate: (page: string) => void,
  currentUser: User | null,
  users?: User[]
}): ReactElement => {
  const { t, language, setLanguage } = useContext(LocalizationContext);
  const { theme } = useContext(ThemeContext);
  const [showHandbook, setShowHandbook] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    language: false,
    process: only === 'workflow',
    visibility: only === 'visibility',
    other: false
  });

  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  const adminUsers = useMemo(() => {
    return users.filter(u => u.role === 'Admin');
  }, [users]);

  // Every switch on this page is the backend's: a change is sent at once and what the backend now holds is shown.
  const governance = useGovernance();
  const visibilitySettings: VisibilitySettings = governance.visibility;
  const allowApprovedProgress = governance.allowApprovedProgress;
  const charterStages = governance.workflow.charter ?? [];
  const isProjectWorkflowEnabled = governance.configured.charter && charterStages.length > 0;
  const firstCharterApprover = charterStages[0]?.approverId;
  const defaultProjectApproverId = firstCharterApprover && firstCharterApprover !== 'ROLE_PM' && firstCharterApprover !== 'ROLE_OWNER' ? String(firstCharterApprover) : null;

  const report = async (work: Promise<{ ok: boolean; message?: string }>) => {
    const outcome = await work;
    if (!outcome.ok) window.alert(outcome.message || (language === 'fa' ? 'انجام نشد.' : 'The change could not be saved.'));
    return outcome.ok;
  };

  const toggleVisibilitySetting = (key: keyof VisibilitySettings) =>
    void report(governance.saveSwitches({ ...governance.visibility, [key]: !governance.visibility[key] }, governance.allowApprovedProgress));
  const setAllowApprovedProgress = (value: boolean) => void report(governance.saveSwitches(governance.visibility, value));
  const setIsProjectWorkflowEnabled = (value: boolean) => void report(governance.setWorkflowEnabled('charter', value));
  /** Everything sent for approval as a new project goes to this person; the rest of the chain stays as it is. */
  const setDefaultProjectApproverId = (userId: string | null) => {
    const stages = charterStages.length ? charterStages : [{ id: 'charter_1', stageNumber: 1, stageTitle: language === 'fa' ? 'تایید نهایی' : 'Final approval', approverId: 'ROLE_PM' as const }];
    void report(governance.saveWorkflow({ ...governance.workflow, charter: stages.map((stage, i) => (i === 0 ? { ...stage, approverId: userId ?? 'ROLE_PM' } : stage)) }));
  };

  // The approval chains are edited as a draft and saved together.
  const [workflowDraft, setWorkflowDraft] = useState<DynamicWorkflowSettings>(governance.workflow);
  const [draftTouched, setDraftTouched] = useState(false);
  useEffect(() => { if (!draftTouched) setWorkflowDraft(governance.workflow); }, [governance.workflow, draftTouched]);
  const anyUnconfigured = Object.values(governance.configured).some(configured => !configured);

  const settingsOptions = useMemo(() => {
    const list = [
      { name: language === 'fa' ? 'کتابچه امکانات اپ مدیریت پروژه (PM)' : 'Project Management (PM) App Features Handbook', icon: 'menu_book', feature: 'features-handbook' },
      { name: t('colorAndFormat'), icon: 'palette', feature: 'color-format' }
    ];
    if (currentUser?.role === 'Admin') {
      list.unshift({ name: t('defineTables'), icon: 'schema', feature: 'define-tables' });
      list.push({ name: t('defineCalendar'), icon: 'calendar_month', feature: 'define-calendar' });
    }
    return list;
  }, [t, currentUser, language]);

  const handleSettingClick = (feature: string) => {
    if (feature === 'features-handbook') {
        setShowHandbook(true);
    } else if (feature === 'define-calendar') {
        onNavigate('calendar_management');
    } else if (feature === 'color-format') {
        onNavigate('color_format');
    } else if (feature === 'define-tables') {
        onNavigate('reference_tables');
    } else {
        alert(t('featureNotImplemented', { feature: t(feature as TranslationKey) }));
    }
  };

  if (showHandbook) {
    return React.createElement(FeaturesHandbook, { onBack: () => setShowHandbook(false) });
  }

  const isDark = theme === 'dark' || document.documentElement.getAttribute('data-theme') === 'dark' || document.body.classList.contains('dark-theme');

  return (
    React.createElement("div", { className: "content-container" },
      !only && React.createElement("div", { className: "page-header" },
        React.createElement("h2", null, t('softwareSettings'))
      ),

      // 1. Language Settings Section
      !only && React.createElement("div", {
        className: "card shadow-sm",
        style: {
          marginBottom: '1.5rem',
          borderRadius: '12px',
          border: '1px solid var(--border-color, #e2f0e8)',
          overflow: 'hidden',
          background: 'var(--card-bg-color, #ffffff)'
        }
      },
        React.createElement("div", {
          onClick: () => toggleSection('language'),
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
            cursor: 'pointer',
            borderBottom: expandedSections.language ? '1px solid var(--border-color, #e2f0e8)' : 'none',
            background: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fcfa'
          }
        },
          React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: '0.85rem' } },
            React.createElement("div", {
              style: {
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(37, 235, 119, 0.12)',
                color: '#25eb77',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }
            }, React.createElement("span", { className: "material-symbols-outlined", style: { fontSize: '1.4rem' } }, "translate")),
            React.createElement("div", null,
              React.createElement("h3", { style: { margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-color, #1e3b2a)' } }, language === 'fa' ? 'تنظیمات زبان سیستم' : 'System Language'),
              React.createElement("p", { style: { margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--inactive-color, #648b74)' } },
                language === 'fa' ? 'زبان نمایش رابط کاربری نرم‌افزار (فارسی / English)' : 'Interface display language'
              )
            )
          ),
          React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: '0.75rem' } },
            React.createElement("span", {
              style: {
                fontSize: '0.78rem',
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: '20px',
                background: 'var(--primary-color, #25eb77)',
                color: '#ffffff'
              }
            }, language === 'fa' ? 'فارسی' : 'English'),
            React.createElement("span", { className: "material-symbols-outlined", style: { fontSize: '1.3rem', color: 'var(--inactive-color, #648b74)', transform: expandedSections.language ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' } },
              'expand_more'
            )
          )
        ),

        expandedSections.language && React.createElement("div", { style: { padding: '1.25rem 1.5rem' } },
          React.createElement("div", { className: "theme-radio-group" },
            React.createElement("div", {
              className: `theme-card-option ${language === 'fa' ? 'active' : ''}`,
              onClick: () => setLanguage('fa'),
              style: { flex: 1, justifyContent: 'center' }
            },
              React.createElement("span", { className: "material-symbols-outlined" }, "language"),
              React.createElement("span", null, 'فارسی')
            ),
            React.createElement("div", {
              className: `theme-card-option ${language === 'en' ? 'active' : ''}`,
              onClick: () => setLanguage('en'),
              style: { flex: 1, justifyContent: 'center' }
            },
              React.createElement("span", { className: "material-symbols-outlined" }, "language"),
              React.createElement("span", null, 'English')
            )
          )
        )
      ),

      // 2. Process Settings Section (Admin Only)
      currentUser?.role === 'Admin' && (!only || only === 'workflow') && React.createElement("div", {
        className: "card shadow-sm",
        style: {
          marginBottom: '1.5rem',
          borderRadius: '12px',
          border: '1px solid var(--border-color, #e2f0e8)',
          overflow: 'hidden',
          background: 'var(--card-bg-color, #ffffff)'
        }
      },
        React.createElement("div", {
          onClick: () => toggleSection('process'),
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
            cursor: 'pointer',
            borderBottom: expandedSections.process ? '1px solid var(--border-color, #e2f0e8)' : 'none',
            background: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fcfa'
          }
        },
          React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: '0.85rem' } },
            React.createElement("div", {
              style: {
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(5, 150, 105, 0.12)',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }
            }, React.createElement("span", { className: "material-symbols-outlined", style: { fontSize: '1.4rem' } }, "account_tree")),
            React.createElement("div", null,
              React.createElement("h3", { style: { margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-color, #1e3b2a)' } }, language === 'fa' ? 'تنظیمات گردش کار' : 'Workflow Settings'),
              React.createElement("p", { style: { margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--inactive-color, #648b74)' } },
                language === 'fa' ? 'مدیریت و داینامیک‌سازی مراحل و فازهای تایید منشور، پیشرفت، ریسک‌ها، ذینفعان، آخرین وضعیت، دلایل تاخیر و اسناد' : 'Manage dynamic approval workflow stages across project aspects'
              )
            )
          ),
          React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: '0.75rem' } },
            React.createElement("span", { className: "material-symbols-outlined", style: { fontSize: '1.3rem', color: 'var(--inactive-color, #648b74)', transform: expandedSections.process ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' } },
              'expand_more'
            )
          )
        ),

        expandedSections.process && React.createElement("div", { style: { padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' } },
          // Checkbox 1: Workflow on project creation
          React.createElement("div", {
            style: { display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' },
            onClick: () => setIsProjectWorkflowEnabled(!isProjectWorkflowEnabled)
          },
            React.createElement("input", {
              type: "checkbox",
              id: "project-workflow-checkbox",
              checked: isProjectWorkflowEnabled,
              onChange: (e) => { e.stopPropagation(); setIsProjectWorkflowEnabled(e.target.checked); },
              style: { width: '1.2rem', height: '1.2rem', marginTop: '0.15rem', cursor: 'pointer' }
            }),
            React.createElement("div", null,
              React.createElement("label", {
                htmlFor: "project-workflow-checkbox",
                onClick: (e) => e.stopPropagation(),
                style: { fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', color: 'var(--text-color, #1e3b2a)' }
              }, language === 'fa' ? 'فعال سازی گردش کار زمان ایجاد پروژه جدید (ارسال به کارتابل تاییدات)' : 'Activate workflow on new project creation'),
              React.createElement("p", { style: { fontSize: '0.8rem', color: 'var(--inactive-color, #648b74)', margin: '0.15rem 0 0 0' } },
                language === 'fa' ? 'با فعال شدن این گزینه، پروژه‌های جدید قبل از ثبت نهایی باید به تایید مدیر سیستم برسند.' : 'When enabled, new projects require admin approval before final creation.'
              )
            )
          ),

          // Approver dropdown if workflow is enabled
          isProjectWorkflowEnabled && React.createElement("div", {
            style: {
              padding: '1rem',
              backgroundColor: isDark ? 'rgba(0, 0, 0, 0.25)' : '#f8fcfa',
              borderRadius: '8px',
              border: '1px solid var(--border-color, #e2f0e8)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              marginRight: language === 'fa' ? '1.9rem' : '0',
              marginLeft: language === 'fa' ? '0' : '1.9rem'
            }
          },
            React.createElement("label", {
              htmlFor: "default-project-approver-select",
              style: { fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-color, #1e3b2a)' }
            }, language === 'fa' ? 'مدیر سیستم تایید‌کننده پروژه‌های جدید:' : 'Default Admin Approver for New Projects:'),
            React.createElement("select", {
              id: "default-project-approver-select",
              value: defaultProjectApproverId || '',
              onChange: (e) => {
                setDefaultProjectApproverId(e.target.value || null);
              },
              className: "form-control",
              style: { maxWidth: '350px', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color, #cbe1d4)', backgroundColor: 'var(--card-bg-color, #ffffff)', color: 'var(--text-color, #1e3b2a)' }
            },
              adminUsers.length === 0 && React.createElement("option", { value: "" }, language === 'fa' ? 'هیچ کاربر مدیر سیستمی یافت نشد' : 'No Admin user found'),
              adminUsers.map(admin => (
                React.createElement("option", { key: admin.id, value: admin.id }, `${admin.username}${admin.name ? ` (${admin.name})` : ''}`)
              ))
            )
          ),

          // Checkbox 2: Confirmed progress upon rejection
          React.createElement("div", {
            style: { display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', borderTop: '1px solid var(--border-color, #e2f0e8)', paddingTop: '1rem' },
            onClick: () => setAllowApprovedProgress(!allowApprovedProgress)
          },
            React.createElement("input", {
              type: "checkbox",
              id: "allow-approved-progress-checkbox",
              checked: allowApprovedProgress,
              onChange: (e) => { e.stopPropagation(); setAllowApprovedProgress(e.target.checked); },
              style: { width: '1.2rem', height: '1.2rem', marginTop: '0.15rem', cursor: 'pointer' }
            }),
            React.createElement("div", null,
              React.createElement("label", {
                htmlFor: "allow-approved-progress-checkbox",
                onClick: (e) => e.stopPropagation(),
                style: { fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', color: 'var(--text-color, #1e3b2a)' }
              }, language === 'fa' ? 'امکان ثبت درصد پیشرفت تاییدی' : 'Enable recording confirmed progress upon rejection'),
              React.createElement("p", { style: { fontSize: '0.8rem', color: 'var(--inactive-color, #648b74)', margin: '0.15rem 0 0 0' } },
                language === 'fa'
                  ? 'در صورت فعال بودن، تاییدکننده در صورت رد درصد پیشرفت اعلامی، می‌تواند درصد پیشرفت تاییدی خود را ثبت کند که ملاک محاسبات قرار می‌گیرد.'
                  : 'When enabled, approvers can specify a confirmed progress percentage upon rejecting a submission, which will be used for project calculations.'
              )
            )
          ),

          // Dynamic Workflow Settings Grid for all project modules
          React.createElement("div", { style: { borderTop: '1px solid var(--border-color, #e2f0e8)', paddingTop: '1rem' } },
            React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' } },
              React.createElement("span", { className: "material-symbols-outlined", style: { color: '#059669', fontSize: '1.2rem' } }, "hub"),
              React.createElement("h4", { style: { margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-color, #1e3b2a)' } },
                language === 'fa' ? 'تعریف مراحل و فازهای گردش کار داینامیک' : 'Define Dynamic Workflow Approval Stages'
              )
            ),
            React.createElement("p", { style: { fontSize: '0.8rem', color: 'var(--inactive-color, #648b74)', margin: '0 0 0.75rem 0' } },
              language === 'fa'
                ? 'در این بخش می‌توانید برای هر یک از بخش‌های منشور، پیشرفت، ریسک‌ها، ذینفعان، آخرین وضعیت، دلایل تاخیر و اسناد پروژه، مراحل تایید چندسطحی تعریف نمایید. پیش‌فرض تایید کننده در تمامی مراحل مدیر پروژه مربوطه است.'
                : 'Configure multi-level approval stages for charter, progress, risks, stakeholders, status, delays, and documents. The default approver is the Project Manager.'
            ),
            anyUnconfigured && React.createElement("div", {
              id: "workflow-unconfigured-banner",
              style: { padding: '0.75rem 1rem', marginBottom: '0.75rem', borderRadius: '8px', background: isDark ? 'rgba(217,119,6,0.15)' : '#fffbeb', border: '1px solid #fcd34d', fontSize: '0.82rem', color: isDark ? '#fcd34d' : '#92400e', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }
            },
              React.createElement("span", null, language === 'fa'
                ? 'برای برخی بخش‌ها هنوز گردش کار تعریف نشده است؛ ثبت‌های آن بخش‌ها بدون تأیید پذیرفته می‌شوند.'
                : 'Some areas have no approval chain yet; their items are accepted without approval.'),
              React.createElement("button", {
                id: "apply-workflow-defaults-btn", type: "button", className: "btn btn-secondary",
                onClick: async () => { if (await report(governance.applyWorkflowDefaults())) setDraftTouched(false); }
              }, language === 'fa' ? 'اعمال تنظیمات پیش‌فرض' : 'Apply the standard chains')
            ),
            React.createElement(DynamicWorkflowSettingsEditor, {
              settings: workflowDraft,
              onUpdateSettings: (newSettings) => { setWorkflowDraft(newSettings); setDraftTouched(true); },
              users: users,
              isDark: isDark,
              language: language
            }),
            React.createElement("div", { style: { display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' } },
              React.createElement("button", {
                id: "save-workflow-btn", type: "button", className: "btn btn-primary", disabled: !draftTouched,
                onClick: async () => { if (await report(governance.saveWorkflow(workflowDraft))) setDraftTouched(false); }
              }, language === 'fa' ? 'ذخیره مراحل تایید' : 'Save approval stages')
            )
          )
        )
      ),

      // 3. Access & Visibility Settings Section (Admin Only)
      currentUser?.role === 'Admin' && (!only || only === 'visibility') && React.createElement("div", {
        className: "card shadow-sm",
        style: {
          marginBottom: '1.5rem',
          borderRadius: '12px',
          border: '1px solid var(--border-color, #e2f0e8)',
          overflow: 'hidden',
          background: 'var(--card-bg-color, #ffffff)'
        }
      },
        React.createElement("div", {
          onClick: () => toggleSection('visibility'),
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
            cursor: 'pointer',
            borderBottom: expandedSections.visibility ? '1px solid var(--border-color, #e2f0e8)' : 'none',
            background: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fcfa'
          }
        },
          React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: '0.85rem' } },
            React.createElement("div", {
              style: {
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(217, 119, 6, 0.12)',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }
            }, React.createElement("span", { className: "material-symbols-outlined", style: { fontSize: '1.4rem' } }, "admin_panel_settings")),
            React.createElement("div", null,
              React.createElement("h3", { style: { margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-color, #1e3b2a)' } }, language === 'fa' ? 'سطوح دسترسی و مشاهده در سبد پروژه / اقدام' : 'Portfolio Visibility & Access Control'),
              React.createElement("p", { style: { margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--inactive-color, #648b74)' } },
                language === 'fa' ? 'تنظیم قوانین مشاهده پروژه‌ها و اقدامات بر اساس نقش‌ها و ساختار سازمانی' : 'Visibility and access permissions for portfolio items'
              )
            )
          ),
          React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: '0.75rem' } },
            React.createElement("span", { className: "material-symbols-outlined", style: { fontSize: '1.3rem', color: 'var(--inactive-color, #648b74)', transform: expandedSections.visibility ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' } },
              'expand_more'
            )
          )
        ),

        expandedSections.visibility && React.createElement("div", { style: { padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' } },
          // 1. viewByOwner
          React.createElement("div", {
            style: { display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' },
            onClick: () => toggleVisibilitySetting('viewByOwner')
          },
            React.createElement("input", {
              type: "checkbox",
              id: "chk-viewByOwner",
              checked: visibilitySettings.viewByOwner,
              onChange: () => toggleVisibilitySetting('viewByOwner'),
              style: { width: '1.2rem', height: '1.2rem', marginTop: '0.15rem', cursor: 'pointer' }
            }),
            React.createElement("div", null,
              React.createElement("label", { htmlFor: "chk-viewByOwner", style: { fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', color: 'var(--text-color, #1e3b2a)' } },
                language === 'fa' ? 'مشاهده پروژه / اقدام توسط مالک مربوطه' : 'View project / action by owner'
              ),
              React.createElement("p", { style: { fontSize: '0.8rem', color: 'var(--inactive-color, #648b74)', margin: '0.15rem 0 0 0' } },
                language === 'fa' ? 'اگر تیک خورد، مالک در سبد پروژه / اقدام موارد خود را ببیند.' : 'If enabled, owner can see their projects / actions in the portfolio.'
              )
            )
          ),

          // 2. viewByManagerOrResponsible
          React.createElement("div", {
            style: { display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' },
            onClick: () => toggleVisibilitySetting('viewByManagerOrResponsible')
          },
            React.createElement("input", {
              type: "checkbox",
              id: "chk-viewByManagerOrResponsible",
              checked: visibilitySettings.viewByManagerOrResponsible,
              onChange: () => toggleVisibilitySetting('viewByManagerOrResponsible'),
              style: { width: '1.2rem', height: '1.2rem', marginTop: '0.15rem', cursor: 'pointer' }
            }),
            React.createElement("div", null,
              React.createElement("label", { htmlFor: "chk-viewByManagerOrResponsible", style: { fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', color: 'var(--text-color, #1e3b2a)' } },
                language === 'fa' ? 'مشاهده پروژه / اقدام توسط مدیر پروژه یا مسئول مربوطه' : 'View project / action by project manager or responsible person'
              ),
              React.createElement("p", { style: { fontSize: '0.8rem', color: 'var(--inactive-color, #648b74)', margin: '0.15rem 0 0 0' } },
                language === 'fa' ? 'اگر تیک خورد، مدیر پروژه یا مسئول اقدام در سبد پروژه / اقدام موارد را ببیند.' : 'If enabled, PM or Action Responsible can see items in the portfolio.'
              )
            )
          ),

          // 3. viewByApprovers
          React.createElement("div", {
            style: { display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' },
            onClick: () => toggleVisibilitySetting('viewByApprovers')
          },
            React.createElement("input", {
              type: "checkbox",
              id: "chk-viewByApprovers",
              checked: visibilitySettings.viewByApprovers,
              onChange: () => toggleVisibilitySetting('viewByApprovers'),
              style: { width: '1.2rem', height: '1.2rem', marginTop: '0.15rem', cursor: 'pointer' }
            }),
            React.createElement("div", null,
              React.createElement("label", { htmlFor: "chk-viewByApprovers", style: { fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', color: 'var(--text-color, #1e3b2a)' } },
                language === 'fa' ? 'مشاهده پروژه / اقدام توسط هریک از تاییدکنندگان' : 'View project / action by approvers'
              ),
              React.createElement("p", { style: { fontSize: '0.8rem', color: 'var(--inactive-color, #648b74)', margin: '0.15rem 0 0 0' } },
                language === 'fa' ? 'اگر تیک خورد، تاییدکنندگان پروژه (حتی یک فعالیت) یا اقدام در سبد پروژه / اقدام موارد را ببینند.' : 'If enabled, approvers (even for a single task) can view items in the portfolio.'
              )
            )
          ),

          // 4. viewByResources
          React.createElement("div", {
            style: { display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' },
            onClick: () => toggleVisibilitySetting('viewByResources')
          },
            React.createElement("input", {
              type: "checkbox",
              id: "chk-viewByResources",
              checked: visibilitySettings.viewByResources,
              onChange: () => toggleVisibilitySetting('viewByResources'),
              style: { width: '1.2rem', height: '1.2rem', marginTop: '0.15rem', cursor: 'pointer' }
            }),
            React.createElement("div", null,
              React.createElement("label", { htmlFor: "chk-viewByResources", style: { fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', color: 'var(--text-color, #1e3b2a)' } },
                language === 'fa' ? 'مشاهده پروژه توسط هریک از منابع' : 'View project by team resources'
              ),
              React.createElement("p", { style: { fontSize: '0.8rem', color: 'var(--inactive-color, #648b74)', margin: '0.15rem 0 0 0' } },
                language === 'fa' ? 'اگر تیک خورد، منابع (تیم پروژه یا تخصیص‌یافته به حداقل یک فعالیت) پروژه را در سبد پروژه ببیند.' : 'If enabled, assigned resources can view the project in the portfolio.'
              )
            )
          ),

          // 5. viewByOrgHeads
          React.createElement("div", {
            style: { display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' },
            onClick: () => toggleVisibilitySetting('viewByOrgHeads')
          },
            React.createElement("input", {
              type: "checkbox",
              id: "chk-viewByOrgHeads",
              checked: visibilitySettings.viewByOrgHeads,
              onChange: () => toggleVisibilitySetting('viewByOrgHeads'),
              style: { width: '1.2rem', height: '1.2rem', marginTop: '0.15rem', cursor: 'pointer' }
            }),
            React.createElement("div", null,
              React.createElement("label", { htmlFor: "chk-viewByOrgHeads", style: { fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', color: 'var(--text-color, #1e3b2a)' } },
                language === 'fa' ? 'مشاهده پروژه / اقدام توسط روسای سازمانی (بر اساس ساختار سازمانی)' : 'View project / action by organizational heads'
              ),
              React.createElement("p", { style: { fontSize: '0.8rem', color: 'var(--inactive-color, #648b74)', margin: '0.15rem 0 0 0' } },
                language === 'fa' ? 'اگر تیک خورد، چنانچه ساختار سازمانی کاربر از ساختار سازمانی مالک، مدیر، مسئول یا تاییدکنندگان بالاتر بود، آن پروژه و اقدام را ببیند.' : 'If enabled, users with higher unit in the org hierarchy can view projects / actions of subordinate units.'
              )
            )
          )
        )
      ),

      // 4. Other Settings Section
      !only && React.createElement("div", {
        className: "card shadow-sm",
        style: {
          marginBottom: '1.5rem',
          borderRadius: '12px',
          border: '1px solid var(--border-color, #e2f0e8)',
          overflow: 'hidden',
          background: 'var(--card-bg-color, #ffffff)'
        }
      },
        React.createElement("div", {
          onClick: () => toggleSection('other'),
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
            cursor: 'pointer',
            borderBottom: expandedSections.other ? '1px solid var(--border-color, #e2f0e8)' : 'none',
            background: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fcfa'
          }
        },
          React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: '0.85rem' } },
            React.createElement("div", {
              style: {
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(124, 58, 237, 0.12)',
                color: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }
            }, React.createElement("span", { className: "material-symbols-outlined", style: { fontSize: '1.4rem' } }, "tune")),
            React.createElement("div", null,
              React.createElement("h3", { style: { margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-color, #1e3b2a)' } }, language === 'fa' ? 'سایر تنظیمات و جداول مرجع' : 'Other Settings & Reference Tables'),
              React.createElement("p", { style: { margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--inactive-color, #648b74)' } },
                language === 'fa' ? 'تعریف جداول اطلاعاتی پایه، تقویم کاری، قالب رنگی و کتابچه امکانات' : 'Define basic reference tables, calendar, theme colors, and user handbook'
              )
            )
          ),
          React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: '0.75rem' } },
            React.createElement("span", { className: "material-symbols-outlined", style: { fontSize: '1.3rem', color: 'var(--inactive-color, #648b74)', transform: expandedSections.other ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' } },
              'expand_more'
            )
          )
        ),

        expandedSections.other && React.createElement("div", { style: { padding: '1.25rem 1.5rem' } },
          React.createElement("div", { className: "settings-grid" },
            settingsOptions.map((opt) => (
              React.createElement("a", {
                href: "#",
                className: "settings-item",
                key: opt.name,
                role: "button",
                "aria-label": opt.name,
                onClick: (e: MouseEvent) => {
                  e.preventDefault();
                  handleSettingClick(opt.feature);
                }
              },
                React.createElement("span", { className: "material-symbols-outlined", "aria-hidden": "true" }, opt.icon),
                React.createElement("span", { className: "settings-text" }, opt.name)
              )
            ))
          )
        )
      )
    )
  );
};