import React, { useState } from 'react';
import {
  FolderKanban,
  FileText,
  Plus,
  Search,
  Filter,
  Trash2,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Priority, ProjectStatus } from '../../types';
import { toPersianDigits, toPersianPercent } from '../../utils/persianDigits';

export const PortfolioView: React.FC = () => {
  const {
    projects,
    actions,
    deleteProject,
    deleteAction,
    setIsCreateProjectModalOpen,
    setIsCreateActionModalOpen,
    setSelectedProjectId,
    setActiveNav
  } = useApp();

  const [activeTab, setActiveTab] = useState<'projects' | 'actions'>('projects');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<Priority | 'all'>('all');

  const filteredProjects = projects.filter(p => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = selectedPriority === 'all' || p.priority === selectedPriority;
    return matchesSearch && matchesPriority;
  });

  const filteredActions = actions.filter(a => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.assignee.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = selectedPriority === 'all' || a.priority === selectedPriority;
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-emerald-600" />
            <span>پروژه‌ها و اقدامات اجرایی</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            مدیریت یکپارچه پروژه‌ها، کنترل اسناد و تخصیص اقدامات به اعضای تیم
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateProjectModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ایجاد پروژه</span>
          </button>
          <button
            onClick={() => setIsCreateActionModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>ایجاد اقدام</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'projects'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            پروژه‌ها ({toPersianDigits(projects.length)})
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'actions'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            اقدامات و کارها ({toPersianDigits(actions.length)})
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="جستجو در نام، کد یا مجری..."
              className="w-full pr-9 pl-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-hidden"
            />
          </div>

          <select
            value={selectedPriority}
            onChange={e => setSelectedPriority(e.target.value as Priority | 'all')}
            className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-hidden"
          >
            <option value="all">همه اولویت‌ها</option>
            <option value="critical">بسیار فوری</option>
            <option value="high">اولویت بالا</option>
            <option value="medium">متوسط</option>
            <option value="low">عادی</option>
          </select>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'projects' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
          {filteredProjects.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              هیچ پروژه‌ای برای نمایش وجود ندارد
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3.5 font-bold">کد پروژه</th>
                    <th className="p-3.5 font-bold">عنوان پروژه</th>
                    <th className="p-3.5 font-bold">مدیر</th>
                    <th className="p-3.5 font-bold">اولویت</th>
                    <th className="p-3.5 font-bold">پیشرفت</th>
                    <th className="p-3.5 font-bold">ددلاین</th>
                    <th className="p-3.5 font-bold text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredProjects.map(proj => (
                    <tr key={proj.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-mono text-slate-500 font-bold">{toPersianDigits(proj.code)}</td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-800 dark:text-slate-100">{proj.title}</div>
                        <div className="text-[11px] text-slate-400">{proj.category}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <img src={proj.manager.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                          <span className="text-slate-700 dark:text-slate-300">{proj.manager.name}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            proj.priority === 'critical'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                              : proj.priority === 'high'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800'
                          }`}
                        >
                          {proj.priority === 'critical' ? 'بسیار فوری' : proj.priority === 'high' ? 'بالا' : 'متوسط'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${proj.progress}%` }} />
                          </div>
                          <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">{toPersianPercent(proj.progress)}</span>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300">{toPersianDigits(proj.endDate)}</td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedProjectId(proj.id);
                              setActiveNav('dashboards.project');
                            }}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                            title="مشاهده داشبورد"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteProject(proj.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                            title="بایگانی پروژه"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
          {filteredActions.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              هیچ اقدامی برای نمایش وجود ندارد
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3.5 font-bold">عنوان اقدام</th>
                    <th className="p-3.5 font-bold">پروژه مرتبط</th>
                    <th className="p-3.5 font-bold">مسئول اجرا</th>
                    <th className="p-3.5 font-bold">پیشرفت</th>
                    <th className="p-3.5 font-bold">موعد (ددلاین)</th>
                    <th className="p-3.5 font-bold text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredActions.map(action => (
                    <tr key={action.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-bold text-slate-800 dark:text-slate-100">
                        {action.title}
                      </td>
                      <td className="p-3.5 text-slate-500 dark:text-slate-400">
                        {action.projectTitle}
                      </td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300">
                        {action.assignee.name}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-emerald-600 font-mono">{toPersianPercent(action.progress)}</span>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300">{toPersianDigits(action.deadline)}</td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => deleteAction(action.id)}
                          className="p-1.5 text-slate-300 dark:text-slate-700 rounded-lg cursor-not-allowed"
                          title="Core فعلاً endpoint حذف اقدام ندارد"
                          disabled
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
