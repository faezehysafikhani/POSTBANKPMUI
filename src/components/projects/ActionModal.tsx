import React, { useState } from 'react';
import { X, FilePlus2, CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Priority } from '../../types';

export const ActionModal: React.FC = () => {
  const {
    isCreateActionModalOpen,
    setIsCreateActionModalOpen,
    addAction,
    projects,
    teamMembers,
    currentUser
  } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [assigneeId, setAssigneeId] = useState(currentUser.id);
  const [priority, setPriority] = useState<Priority>('high');
  const [deadline, setDeadline] = useState('1403/07/15');
  const [requiresApproval, setRequiresApproval] = useState(true);

  if (!isCreateActionModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const selectedProj = projects.find(p => p.id === projectId);
    const assignee = teamMembers.find(m => m.id === assigneeId) || currentUser;

    try {
      await addAction({
        projectId: selectedProj?.id || '',
        projectCode: selectedProj?.code || '',
        projectTitle: selectedProj?.title || 'اقدام سازمانی',
        title: title.trim(),
        description: description.trim(),
        assignee,
        priority,
        status: 'todo',
        deadline,
        progress: 0,
        requiresApproval,
        approvalStatus: requiresApproval ? 'pending' : undefined
      });
      setIsCreateActionModalOpen(false);
      setTitle('');
      setDescription('');
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'ثبت اقدام ناموفق بود.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
              <FilePlus2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                ایجاد اقدام یا وظیفه جدید
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                ثبت اقدام اجرایی ذیل پروژه با قابلیت ارسال به کارتابل تاییدات
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCreateActionModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              عنوان اقدام اجرایی *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="مثال: پیاده‌سازی تست نفوذ و ممیزی امنیتی فاز ۱"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              پروژه مرتبط
            </label>
            {projects.length > 0 ? (
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    [{p.code}] {p.title}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 text-xs">
                ابتدا یک پروژه ثبت نمایید یا این اقدام به عنوان اقدام عمومی سازمانی ثبت خواهد شد.
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              توضیحات و نیازمندی‌ها
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="شرح جزئیات کاری، گام‌های اجرایی و فایل‌های ضمیمه..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-hidden resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                مسئول / مجری اقدام
              </label>
              <select
                value={assigneeId}
                onChange={e => setAssigneeId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden"
              >
                {teamMembers.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                اولویت انجام
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden"
              >
                <option value="critical">بسیار فوری</option>
                <option value="high">بالا</option>
                <option value="medium">متوسط</option>
                <option value="low">پایین</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              مهلت انجام (ددلاین)
            </label>
            <input
              type="text"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              placeholder="1403/07/15"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden font-mono"
            />
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <input
              type="checkbox"
              id="reqApproval"
              checked={requiresApproval}
              onChange={e => setRequiresApproval(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded-sm border-slate-300 focus:ring-teal-500"
            />
            <label htmlFor="reqApproval" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              نیاز به گردش کار و تایید در کارتابل مدیر پروژه دارد
            </label>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsCreateActionModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-all"
            >
              ثبت اقدام در سامانه
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
