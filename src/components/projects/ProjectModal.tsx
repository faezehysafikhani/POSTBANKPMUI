import React, { useState } from 'react';
import { X, FolderPlus, Calendar, DollarSign, Tag, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Priority, ProjectStatus } from '../../types';

export const ProjectModal: React.FC = () => {
  const {
    isCreateProjectModalOpen,
    setIsCreateProjectModalOpen,
    addProject,
    teamMembers,
    currentUser
  } = useApp();

  const [title, setTitle] = useState('');
  const [code, setCode] = useState(`PRJ-1403-${Math.floor(10 + Math.random() * 90)}`);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('فناوری و زیرساخت');
  const [priority, setPriority] = useState<Priority>('high');
  const [startDate, setStartDate] = useState('1403/06/01');
  const [endDate, setEndDate] = useState('1403/11/30');
  const [budget, setBudget] = useState('3500000000');
  const [tags, setTags] = useState('فاز اول, استراتژیک, زیرساخت');
  const [managerId, setManagerId] = useState(currentUser.id);

  if (!isCreateProjectModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const manager = teamMembers.find(m => m.id === managerId) || currentUser;

    try {
      await addProject({
        code,
        title: title.trim(),
        description: description.trim(),
        category,
        manager,
        members: teamMembers,
        startDate,
        endDate,
        progress: 0,
        status: 'planning',
        priority,
        budget: Number(budget) || 0,
        spent: 0,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean)
      });
      setIsCreateProjectModalOpen(false);
      setTitle('');
      setDescription('');
      setCode(`PRJ-1403-${Math.floor(10 + Math.random() * 90)}`);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'ثبت پروژه ناموفق بود.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                تعریف و ثبت پروژه جدید
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                اطلاعات و پارامترهای اجرایی پروژه را وارد کنید
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCreateProjectModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                عنوان رسمی پروژه *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="مثال: پیاده‌سازی سامانه نظارت و مدیریت داده"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                کد پروژه
              </label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs text-slate-700 dark:text-slate-200 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              شرح اهداف و محدوده پروژه
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="اهداف کلیدی، خروجی‌های مورد انتظار و دامنه‌ی شمول پروژه..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-hidden resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                حوزه و دسته‌بندی
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden"
              >
                <option value="فناوری و زیرساخت">فناوری و زیرساخت</option>
                <option value="امنیت سایبری">امنیت سایبری</option>
                <option value="توسعه هوش مصنوعی">توسعه هوش مصنوعی</option>
                <option value="اتوماسیون فرآیندها">اتوماسیون فرآیندها</option>
                <option value="استراتژی سازمانی">استراتژی سازمانی</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                درجه اولویت
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden"
              >
                <option value="critical">بسیار فوری (بحرانی)</option>
                <option value="high">اولویت بالا</option>
                <option value="medium">متوسط</option>
                <option value="low">عادی / پایین</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                تاریخ شروع (شمسی)
              </label>
              <input
                type="text"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                placeholder="1403/06/01"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ددلاین نهایی تحویل (شمسی) *
              </label>
              <input
                type="text"
                required
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                placeholder="1403/11/30"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                بودجه مصوب (ریال)
              </label>
              <input
                type="number"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                مدیر پروژه
              </label>
              <select
                value={managerId}
                onChange={e => setManagerId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden"
              >
                {teamMembers.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              برچسب‌ها (با کاما جدا کنید)
            </label>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="مثال: اولویت یک, زیرساخت, ابری"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsCreateProjectModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-all"
            >
              ثبت نهایی پروژه
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
