import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import {
  BarChart3,
  Calendar,
  DollarSign,
  Users,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Plus,
  ShieldCheck,
  Edit3
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { toPersianDigits, toPersianPercent } from '../../utils/persianDigits';

export const ProjectProgressDashboard: React.FC = () => {
  const {
    projects,
    actions,
    selectedProjectId,
    setSelectedProjectId,
    updateProject,
    updateAction,
    setIsCreateActionModalOpen,
    setActiveNav,
    settings
  } = useApp();

  const isDark = settings.theme === 'dark';

  // Active project for deep inspection
  const activeProject = useMemo(() => {
    if (selectedProjectId) {
      return projects.find(p => p.id === selectedProjectId) || projects[0];
    }
    return projects[0];
  }, [projects, selectedProjectId]);

  // Actions belonging to this project
  const projectActions = useMemo(() => {
    if (!activeProject) return [];
    return actions.filter(a => a.projectId === activeProject.id);
  }, [actions, activeProject]);

  // Chart 1: Actions Progress by Task (Horizontal Bar)
  const taskProgressChartData = useMemo(() => {
    if (projectActions.length === 0) {
      return {
        labels: ['تعریف اقدام جدید'],
        datasets: [
          {
            label: 'درصد پیشرفت',
            data: [0],
            backgroundColor: '#00873E'
          }
        ]
      };
    }

    return {
      labels: projectActions.map(a => a.title.slice(0, 24) + (a.title.length > 24 ? '...' : '')),
      datasets: [
        {
          label: 'درصد پیشرفت کار (%)',
          data: projectActions.map(a => a.progress),
          backgroundColor: projectActions.map(a =>
            a.progress === 100 ? '#00873E' : a.priority === 'critical' ? '#f43f5e' : '#10b981'
          ),
          borderRadius: 6
        }
      ]
    };
  }, [projectActions]);

  // Chart 2: Milestone Burnup / Cumulative Progress
  const milestoneChartData = useMemo(() => {
    return {
      labels: ['هفته ۱', 'هفته ۲', 'هفته ۳', 'هفته ۴', 'هفته ۵', 'هفته ۶'],
      datasets: [
        {
          type: 'line' as const,
          label: 'پیشرفت واقعی (%)',
          data: [0, 0, 0, 0, 0, activeProject ? activeProject.progress : 0],
          borderColor: '#00873E',
          backgroundColor: '#00873E',
          tension: 0.3
        },
        {
          type: 'line' as const,
          label: 'برنامه زمان‌بندی مبنا (Baseline)',
          data: [15, 30, 45, 60, 75, 90],
          borderColor: '#94a3b8',
          borderDash: [5, 5],
          tension: 0
        }
      ]
    };
  }, [activeProject]);

  const barOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        rtl: true,
        textDirection: 'rtl' as const,
        bodyFont: { family: 'Shabnam, Noto Sans Arabic, sans-serif' },
        titleFont: { family: 'Shabnam, Noto Sans Arabic, sans-serif' }
      }
    },
    scales: {
      x: {
        min: 0,
        max: 100,
        ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { family: 'Shabnam, Noto Sans Arabic, sans-serif', size: 10 } },
        grid: { color: isDark ? '#1e293b' : '#f1f5f9' }
      },
      y: {
        ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { family: 'Shabnam, Noto Sans Arabic, sans-serif', size: 10 } },
        grid: { display: false }
      }
    }
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        rtl: true,
        labels: {
          color: isDark ? '#94a3b8' : '#475569',
          font: { family: 'Shabnam, Noto Sans Arabic, sans-serif', size: 11 },
          usePointStyle: true
        }
      },
      tooltip: {
        rtl: true,
        textDirection: 'rtl' as const,
        bodyFont: { family: 'Shabnam, Noto Sans Arabic, sans-serif' },
        titleFont: { family: 'Shabnam, Noto Sans Arabic, sans-serif' }
      }
    },
    scales: {
      x: {
        ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { family: 'Shabnam, Noto Sans Arabic, sans-serif', size: 10 } },
        grid: { color: isDark ? '#1e293b' : '#f1f5f9' }
      },
      y: {
        min: 0,
        max: 100,
        ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { family: 'Shabnam, Noto Sans Arabic, sans-serif', size: 10 } },
        grid: { color: isDark ? '#1e293b' : '#f1f5f9' }
      }
    }
  };

  if (!activeProject) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
          پروژه‌ای برای نمایش پیشرفت وجود ندارد
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          ابتدا از منوی سایدبار گزینه «ایجاد پروژه» را انتخاب کنید.
        </p>
        <button
          onClick={() => setActiveNav('dashboards.overview')}
          className="mt-4 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl cursor-pointer"
        >
          بازگشت به داشبورد اصلی
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Project Selector & Header */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => setActiveNav('dashboards.overview')}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              title="بازگشت"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              داشبورد تخصصی نظارت بر پیشرفت فیزیکی و زمانی پروژه
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            تحلیل چارت‌های پیشرفت هفتگی، کنترل ددلاین و اقلام شکست کار (WBS)
          </p>
        </div>

        {/* Project Selector Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 shrink-0 font-medium">انتخاب پروژه:</span>
          <select
            value={activeProject.id}
            onChange={e => setSelectedProjectId(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                [{toPersianDigits(p.code)}] {p.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Project Meta Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">پیشرفت کل پروژه</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
              {toPersianPercent(activeProject.progress)}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {activeProject.status === 'in_progress' ? 'در حال اجرا' : activeProject.status}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${activeProject.progress}%` }}
            />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">بازه زمانی و ددلاین</span>
          <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span className="font-mono">{toPersianDigits(activeProject.startDate)} الی {toPersianDigits(activeProject.endDate)}</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            اولویت پروژه:{' '}
            <span className="font-bold text-rose-600">
              {activeProject.priority === 'critical' ? 'بسیار فوری' : activeProject.priority}
            </span>
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">بودجه مصوب و مصرفی</span>
          <div className="mt-1 text-sm font-black text-slate-800 dark:text-slate-200 font-mono">
            {activeProject.budget ? toPersianDigits((activeProject.budget / 10000000).toLocaleString('fa-IR')) + ' میلیون تومان' : 'تعیین نشده'}
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            هزینه‌کرد:{' '}
            <span className="font-mono text-emerald-600 font-bold">
              {activeProject.spent ? toPersianDigits((activeProject.spent / 10000000).toLocaleString('fa-IR')) + ' م.ت' : '۰'}
            </span>
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">تیم و مدیر پروژه</span>
          <div className="flex items-center gap-2 mt-1">
            <img
              src={activeProject.manager.avatar}
              alt={activeProject.manager.name}
              className="w-7 h-7 rounded-full object-cover"
            />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
              {activeProject.manager.name}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            اقدامات فعال پروژه: {toPersianDigits(projectActions.length)} اقدام
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Progress Comparison Bar */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">
              پیشرفت فیزیکی اقدامات شکست کار
            </h3>
            <span className="text-[10px] text-slate-400">افقی درصدی</span>
          </div>
          <div className="h-64 relative">
            <Bar data={taskProgressChartData} options={barOptions} />
          </div>
        </div>

        {/* Chart 2: Milestone Burnup vs Planned */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">
              منحنی پیشرفت واقعی در مقایسه با برنامه مبنا (S-Curve)
            </h3>
            <span className="text-[10px] text-slate-400">روند تجمعی</span>
          </div>
          <div className="h-64 relative">
            <Line data={milestoneChartData} options={lineOptions} />
          </div>
        </div>
      </div>

      {/* Interactive Actions & Tasks List */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">
              اقدامات اجرایی پروژه «{activeProject.title}»
            </h3>
            <p className="text-[11px] text-slate-500">
              می‌توانید درصد پیشرفت اقدامات را مستقیماً تغییر داده تا چارت‌ها بلادرنگ آپدیت شوند
            </p>
          </div>
          <button
            onClick={() => setIsCreateActionModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت اقدام جدید</span>
          </button>
        </div>

        {projectActions.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400">
            هنوز اقدامی برای این پروژه ثبت نشده است. با زدن دکمه «ثبت اقدام جدید» اولین وظیفه را اضافه فرمایید.
          </div>
        ) : (
          <div className="space-y-3">
            {projectActions.map(action => (
              <div
                key={action.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 mt-0.5">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {action.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {action.description || 'بدون توضیحات'}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-2">
                      <span>مجری: {action.assignee.name}</span>
                      <span>موعد: {toPersianDigits(action.deadline)}</span>
                      {action.requiresApproval && (
                        <span className="text-amber-600 font-semibold">نیاز به تایید کارتابل</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress Adjuster Slider */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-32">
                    <div className="flex justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      <span>پیشرفت:</span>
                      <span className="text-emerald-600 font-mono">{toPersianPercent(action.progress)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={action.progress}
                      onChange={e => {
                        const val = Number(e.target.value);
                        updateAction(action.id, { progress: val, status: val === 100 ? 'done' : 'in_progress' });
                        // recalculate project progress
                        const updatedActions = projectActions.map(a => a.id === action.id ? { ...a, progress: val } : a);
                        const newAvg = Math.round(updatedActions.reduce((acc, a) => acc + a.progress, 0) / updatedActions.length);
                        updateProject(activeProject.id, { progress: newAvg });
                      }}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
