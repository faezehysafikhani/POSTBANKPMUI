import React, { useState } from 'react';
import {
  Settings,
  Sun,
  Moon,
  Palette,
  Bell,
  Lock,
  Server,
  Database,
  ShieldCheck,
  Check,
  Send,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { sendBrowserPushNotification } from '../../utils/notifications';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    toggleTheme,
    pushPermission,
    enablePushNotifications,
    addNotification,
    securityStatus,
    clearAllData
  } = useApp();

  const [testNotifSent, setTestNotifSent] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleTestPush = () => {
    sendBrowserPushNotification('تست سامانه اعلان‌های هوشمند', {
      body: 'سیستم نوتیفیکیشن پوش با موفقیت فعال و آماده ارسال تغییرات پروژه‌هاست.'
    });
    addNotification({
      title: 'تست موفق اعلان پوش',
      message: 'پیام آزمایشی به مرکز اعلان‌های مرورگر ارسال شد.',
      type: 'security',
      priority: 'low'
    });
    setTestNotifSent(true);
    setTimeout(() => setTestNotifSent(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-teal-600" />
          <span>تنظیمات سامانه و شخصی‌سازی</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          شخصی‌سازی ظاهر کاربری، تنظیمات نوتفیکیشن‌های پوش، پروتکل‌های رمزنگاری و اتصال به سرور بک‌اند
        </p>
      </div>

      {/* Theme Customization Section - Explicit Requirement */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Palette className="w-4 h-4 text-teal-600" />
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">
            شخصی‌سازی تم‌های روشن و تاریک
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Light Theme Option */}
          <div
            onClick={() => updateSettings({ theme: 'light' })}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              settings.theme === 'light'
                ? 'border-teal-600 bg-teal-50/30 dark:bg-teal-950/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <Sun className="w-4 h-4 text-amber-500" />
                <span>تم روشن مینیمال (Light Mode)</span>
              </span>
              {settings.theme === 'light' && (
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px]">
                  <Check className="w-3 h-3" />
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              طراحی با کنتراست متعادل و پس‌زمینه روشن، مناسب محیط‌های اداری و روز
            </p>
          </div>

          {/* Dark Theme Option */}
          <div
            onClick={() => updateSettings({ theme: 'dark' })}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              settings.theme === 'dark'
                ? 'border-teal-600 bg-teal-50/30 dark:bg-teal-950/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <Moon className="w-4 h-4 text-indigo-400" />
                <span>تم تاریک حرفه‌ای (Dark Mode)</span>
              </span>
              {settings.theme === 'dark' && (
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px]">
                  <Check className="w-3 h-3" />
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              طراحی شیک تیره با رنگ‌های اشباع‌شده کنترل‌شده جهت کاهش خستگی چشم
            </p>
          </div>
        </div>
      </div>

      {/* Push Notifications System Section - Explicit Requirement */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Bell className="w-4 h-4 text-teal-600" />
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">
            سیستم اعلان‌های لحظه‌ای و نوتفیکیشن‌های پوش مرورگر
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                وضعیت دریافت نوتیفیکیشن پوش:
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  pushPermission === 'granted'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {pushPermission === 'granted' ? 'فعال و مجاز' : 'در انتظار تایید مجوز'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              اطلاع‌رسانی فوری هنگام تغییر درصد پیشرفت پروژه‌ها، عبور از ددلاین و احکام کارتابل
            </p>
          </div>

          <div className="flex items-center gap-2">
            {pushPermission !== 'granted' ? (
              <button
                onClick={enablePushNotifications}
                className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                فعال‌سازی مجوز پوش
              </button>
            ) : (
              <button
                onClick={handleTestPush}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors"
              >
                <Send className="w-3.5 h-3.5 text-teal-600" />
                <span>{testNotifSent ? 'ارسال شد!' : 'ارسال تست پوش'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Security & Encrypted Protocols Section - Explicit Requirement */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Lock className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">
            پروتکل‌های امنیتی و رمزنگاری داده‌ها
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 font-medium">پروتکل ارتباطی</span>
            <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              {securityStatus.channelProtocol}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 font-medium">الگوریتم رمزنگاری کلید</span>
            <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              {securityStatus.cipherSuite}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 font-medium">امضای یکپارچگی بسته</span>
            <p className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {securityStatus.integrityCheck}
            </p>
          </div>
        </div>
      </div>

      {/* Backend API Sync Ready Config - Explicit Requirement */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Server className="w-4 h-4 text-teal-600" />
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">
            پیکربندی اتصال به Backend
          </h3>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              آدرس سرویس بک‌اند (Base API Endpoint)
            </label>
            <input
              type="text"
              value={settings.backendApiUrl}
              onChange={e => updateSettings({ backendApiUrl: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-xs focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              توکن نشست (Bearer Token)
            </label>
            <input
              type="password"
              value="توکن پس از ورود امن مدیریت می‌شود"
              readOnly
              disabled
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono text-xs cursor-not-allowed"
            />
          </div>

          <p className="text-[11px] text-slate-400">
            داده‌های سامانه از REST API پروژه PostbankPM دریافت می‌شوند. برای محیط محلی آدرس را خالی بگذارید تا Vite proxy استفاده شود.
          </p>
        </div>
      </div>

      {/* Reset & Storage Clear */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
            پاک‌سازی نمای فعلی (بدون حذف اطلاعات سرور)
          </h4>
          <p className="text-[11px] text-slate-500">
            فقط داده‌های نمایش‌داده‌شده در این نشست پاک می‌شوند و با بارگذاری مجدد از سرور بازمی‌گردند.
          </p>
        </div>
        <button
          onClick={() => {
            if (window.confirm('نمای فعلی پاک شود؟ هیچ داده‌ای از سرور حذف نخواهد شد.')) {
              clearAllData();
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-800 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>پاک‌سازی نما</span>
        </button>
      </div>
    </div>
  );
};
