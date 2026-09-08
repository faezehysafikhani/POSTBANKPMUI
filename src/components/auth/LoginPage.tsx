import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, LogIn, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PostBankLogo } from '../common/PostBankLogo';

export const LoginPage: React.FC = () => {
  const { login } = useApp();
  const [username, setUsername] = useState('admin@nexus.local');
  const [password, setPassword] = useState('Admin@12345');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await login(username, password);
      if (!result.success) {
        setErrorMessage(result.error || 'نام کاربری یا کلمه عبور نادرست است.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'خطا در برقراری ارتباط با سامانه ورود.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = () => {
    setUsername('admin@nexus.local');
    setPassword('Admin@12345');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-slate-100 to-emerald-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20 text-slate-900 dark:text-slate-100 select-none">
      {/* Background Decorative Accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-rose-500/10 dark:bg-rose-500/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md z-10">
        {/* Card Container */}
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-7 sm:p-9 space-y-6">
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center space-y-3">
            <PostBankLogo size="lg" layout="vertical" showText={true} />

            <div className="pt-2">
              <h1 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100">
                سامانه جامع مدیریت پروژه
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                ورود به کارتابل نظارت، پیشرفت و اقدامات اجرایی
              </p>
            </div>
          </div>

          {/* Quick Demo Info Pill */}
          <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>کاربر توسعه: <strong className="font-mono font-bold">admin@nexus.local</strong></span>
            </div>
            <button
              type="button"
              onClick={handleQuickFill}
              className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline shrink-0"
            >
              تکمیل
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <div className="space-y-1.5 text-right">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                ایمیل سازمانی
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="admin@nexus.local"
                  className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:focus:ring-emerald-500 transition-all font-mono"
                  dir="ltr"
                />
                <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5 text-right">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                کلمه عبور
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:focus:ring-emerald-500 transition-all font-mono"
                  dir="ltr"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
                />
                <span>مرا به خاطر بسپار</span>
              </label>
              <span className="text-[11px] text-slate-400 font-medium">پست بانک ایران</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>ورود به سامانه</span>
                </>
              )}
            </button>
          </form>

          {/* Backend Connection Guide (For user developer reference) */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[10px] text-slate-400 leading-relaxed">
              ورود امن از طریق API و توکن JWT انجام می‌شود
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-4 text-[11px] text-slate-400">
          <span>کلیه حقوق متعلق به پست بانک ایران می‌باشد</span>
        </div>
      </div>
    </div>
  );
};
