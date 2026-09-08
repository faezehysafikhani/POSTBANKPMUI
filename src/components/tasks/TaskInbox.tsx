import React, { useState } from 'react';
import {
  Inbox,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  AlertCircle,
  Check,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Priority } from '../../types';
import { toPersianDigits, toPersianPercent } from '../../utils/persianDigits';

interface TaskInboxProps {
  initialTab?: 'tasks' | 'approvals';
}

export const TaskInbox: React.FC<TaskInboxProps> = ({ initialTab = 'tasks' }) => {
  const {
    actions,
    approvals,
    handleApproval,
    updateAction,
    currentUser
  } = useApp();

  const [activeTab, setActiveTab] = useState<'tasks' | 'approvals'>(initialTab);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const pendingApprovals = approvals.filter(a => a.status === 'pending');
  const pastApprovals = approvals.filter(a => a.status !== 'pending');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Inbox className="w-5 h-5 text-emerald-600" />
            <span>کارتابل وظایف و تاییدات سازمانی</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            گردش کار احکام، بررسی و تایید صورت‌وضعیت‌ها و وظایف محوله به کارکنان
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'tasks'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            کارتابل وظایف من ({toPersianDigits(actions.length)})
          </button>
          <button
            onClick={() => setActiveTab('approvals')}
            className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'approvals'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>درخواست‌های تایید</span>
            {pendingApprovals.length > 0 && (
              <span className="mr-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-mono">
                {toPersianDigits(pendingApprovals.length)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab: Tasks Kanban / List */}
      {activeTab === 'tasks' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Column 1: در انتظار اقدام / To Do */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>در نوبت اقدام</span>
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                {toPersianDigits(actions.filter(a => a.status === 'todo').length)}
              </span>
            </div>

            <div className="space-y-3">
              {actions.filter(a => a.status === 'todo').map(act => (
                <div
                  key={act.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
                >
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">{act.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{act.description}</p>
                  <div className="mt-3 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-[11px]">
                    <span className="font-mono text-slate-400">موعد: {toPersianDigits(act.deadline)}</span>
                    <button
                      onClick={() => updateAction(act.id, { status: 'in_progress' })}
                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      شروع انجام
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: در حال اجرا / In Progress */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>در حال اجرا</span>
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono">
                {toPersianDigits(actions.filter(a => a.status === 'in_progress').length)}
              </span>
            </div>

            <div className="space-y-3">
              {actions.filter(a => a.status === 'in_progress').map(act => (
                <div
                  key={act.id}
                  className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/20"
                >
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">{act.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{act.description}</p>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">پیشرفت:</span>
                      <span className="font-bold text-emerald-600 font-mono">{toPersianPercent(act.progress)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateAction(act.id, { progress: Math.min(100, act.progress + 25), status: act.progress + 25 >= 100 ? 'done' : 'in_progress' })}
                        className="flex-1 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                      >
                        +۲۵٪ پیشرفت
                      </button>
                      <button
                        onClick={() => updateAction(act.id, { progress: 100, status: 'done' })}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                      >
                        تکمیل شد
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: پایان یافته / Done */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>تکمیل شده</span>
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono">
                {toPersianDigits(actions.filter(a => a.status === 'done').length)}
              </span>
            </div>

            <div className="space-y-3">
              {actions.filter(a => a.status === 'done').map(act => (
                <div
                  key={act.id}
                  className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/20 opacity-90"
                >
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 line-through decoration-slate-400">
                    {act.title}
                  </h4>
                  <span className="inline-block mt-2 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-md">
                    ۱۰۰٪ انجام شد
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Approvals */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/40 flex items-center gap-3 text-xs text-amber-800 dark:text-amber-200">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <span>
              درخواست‌های تایید به عنوان احکام سازمانی در کارتابل شما قرار دارند. با تایید یا رد هر مورد، نوتیفیکیشن لحظه‌ای به مجری ارسال می‌شود.
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-xs text-slate-800 dark:text-slate-200">
              درخواست‌های در انتظار تایید ({toPersianDigits(pendingApprovals.length)})
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-400">
                در حال حاضر هیچ درخواست تاییدی در نوبت بررسی وجود ندارد
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {pendingApprovals.map(item => (
                  <div key={item.id} className="p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {item.actionTitle}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          پروژه: {item.projectTitle} | ارسال شده توسط: {item.requester.name}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        تاریخ ارسال: {toPersianDigits(item.dateSubmitted)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="توضیح یا دستور مدیریتی (اختیاری)..."
                        value={commentInputs[item.id] || ''}
                        onChange={e =>
                          setCommentInputs({ ...commentInputs, [item.id]: e.target.value })
                        }
                        className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden"
                      />
                      <button
                        onClick={() => handleApproval(item.id, 'approved', commentInputs[item.id])}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>تایید نهایی</span>
                      </button>
                      <button
                        onClick={() => handleApproval(item.id, 'rejected', commentInputs[item.id])}
                        className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>رد درخواست</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
