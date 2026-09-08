import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import {
  FolderKanban,
  AlertTriangle,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  Plus,
  Filter,
  ShieldCheck,
  ArrowUpRight,
  Database,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Priority, ProjectStatus } from '../../types';
import { toPersianDigits, toPersianPercent } from '../../utils/persianDigits';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const OverviewDashboard: React.FC = () => {
  const {
    projects,
    actions,
    teamMembers,
    approvals,
    priorityFilter,
    setPriorityFilter,
    deadlineFilter,
    setDeadlineFilter,
    statusFilter,
    setStatusFilter,
    setIsCreateProjectModalOpen,
    setIsCreateActionModalOpen,
    loadSampleSeedData,
    setSelectedProjectId,
    setActiveNav,
    settings
  } = useApp();

  const isDark = settings.theme === 'dark';

  // Filtered projects based on priority, deadline, status
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      // Priority filter
      if (priorityFilter !== 'all' && project.priority !== priorityFilter) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'all' && project.status !== statusFilter) {
        return false;
      }
      // Deadline filter
      if (deadlineFilter === 'overdue') {
        return project.status === 'overdue';
      }
      return true;
    });
  }, [projects, priorityFilter, deadlineFilter, statusFilter]);

  // Overdue projects specifically
  const overdueProjects = useMemo(() => {
    return projects.filter(p => p.status === 'overdue' || p.progress < 50 && p.priority === 'critical');
  }, [projects]);

  // Statistics
  const totalProjects = projects.length;
  const inProgressProjects = projects.filter(p => p.status === 'in_progress').length;
  const completedProjects = projects.filter(p => p.status === 'completed' || p.progress === 100).length;
  const overdueCount = projects.filter(p => p.status === 'overdue').length;
  const avgProgress = totalProjects > 0 ? Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / totalProjects) : 0;

  // Chart 1: Project Status Doughnut
  const statusChartData = useMemo(() => {
    const counts = {
      in_progress: projects.filter(p => p.status === 'in_progress').length,
      completed: projects.filter(p => p.status === 'completed' || p.progress === 100).length,
      review: projects.filter(p => p.status === 'review').length,
      overdue: projects.filter(p => p.status === 'overdue').length,
      planning: projects.filter(p => p.status === 'planning').length
    };

    return {
      labels: ['در حال اجرا', 'تکمیل شده', 'در حال بازبینی', 'معوقه / تاخیر', 'برنامه‌ریزی اولیه'],
      datasets: [
        {
          data: [counts.in_progress, counts.completed, counts.review, counts.overdue, counts.planning],
          backgroundColor: [
            '#0d9488', // teal-600
            '#10b981', // emerald-500
            '#3b82f6', // blue-500
            '#f43f5e', // rose-500
            '#94a3b8'  // slate-400
          ],
          borderColor: isDark ? '#0f172a' : '#ffffff',
          borderWidth: 2,
          hoverOffset: 6
        }
      ]
    };
  }, [projects, isDark]);

  // Chart 2: Team Performance & Workload (Bar Chart)
  const teamPerformanceChartData = useMemo(() => {
    const memberLabels = teamMembers.map(m => m.name.split(' ')[0] || m.name);
    const completedTasks = teamMembers.map(m => m.completedTasksCount || 0);
    const activeTasks = teamMembers.map(m => m.activeTasksCount || 0);

    return {
      labels: memberLabels,
      datasets: [
        {
          label: 'وظایف تکمیل شده',
          data: completedTasks,
          backgroundColor: '#00873E',
          borderRadius: 6
        },
        {
          label: 'وظایف جاری',
          data: activeTasks,
          backgroundColor: isDark ? '#334155' : '#cbd5e1',
          borderRadius: 6
        }
      ]
    };
  }, [teamMembers, isDark]);

  // Chart 3: Progress Trajectory (Line Chart)
  const progressLineData = useMemo(() => {
    const hasData = projects.length > 0;
    return {
      labels: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور'],
      datasets: [
        {
          label: 'میانگین پیشرفت تجمعی پروژه‌ها (%)',
          data: hasData ? [0, 0, 0, 0, 0, avgProgress] : [0, 0, 0, 0, 0, 0],
          borderColor: '#00873E',
          backgroundColor: 'rgba(0, 135, 62, 0.12)',
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#00873E',
          pointRadius: 4
        }
      ]
    };
  }, [avgProgress, projects.length]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        rtl: true,
        labels: {
          color: isDark ? '#94a3b8' : '#475569',
          font: { family: 'Shabnam, Noto Sans Arabic, sans-serif', size: 11 },
          usePointStyle: true,
          padding: 12
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
        ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { family: 'Shabnam, Noto Sans Arabic, sans-serif', size: 10 } },
        grid: { color: isDark ? '#1e293b' : '#f1f5f9' }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        rtl: true,
        labels: {
          color: isDark ? '#cbd5e1' : '#475569',
          font: { family: 'Shabnam, Noto Sans Arabic, sans-serif', size: 11 },
          usePointStyle: true,
          padding: 12
        }
      },
      tooltip: {
        rtl: true,
        textDirection: 'rtl' as const,
        bodyFont: { family: 'Shabnam, Noto Sans Arabic, sans-serif' },
        titleFont: { family: 'Shabnam, Noto Sans Arabic, sans-serif' }
      }
    },
    cutout: '72%'
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Fast Status & Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span>سامانه پایش پروژه‌ها و اقدامات پست بانک ایران</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            مشاهده وضعیت لحظه‌ای پیشرفت، پروژه‌های معوقه، ارزیابی عملکرد تیم و فیلترهای راهبردی
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsCreateProjectModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>پروژه جدید</span>
          </button>

          <button
            onClick={() => setActiveNav('dashboards.project')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>داشبورد پیشرفت تفصیلی</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Total Projects */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">کل پروژه‌های فعال</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1 font-mono">
              {toPersianDigits(totalProjects)}
            </h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
              <span>{toPersianDigits(inProgressProjects)} پروژه در فاز اجرا</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <FolderKanban className="w-6 h-6" />
          </div>
        </div>

        {/* Overdue Projects - Explicit User Requirement */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">پروژه‌های معوقه و تاخیردار</p>
            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 font-mono">
              {toPersianDigits(overdueCount)}
            </h3>
            <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>نیاز به مداخله فوری مدیریتی</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Avg Progress */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">میانگین پیشرفت پروژه‌ها</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1 font-mono">
              {toPersianPercent(avgProgress)}
            </h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{toPersianDigits(completedProjects)} پروژه پایان یافته</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Team & Inbox Approvals */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">کارتابل و اعضای تیم</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1 font-mono">
              {toPersianDigits(actions.length)}
            </h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
              <span>{toPersianDigits(approvals.filter(a => a.status === 'pending').length)} درخواست در انتظار تایید</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Fast Filters Bar (اولویت و ددلاین) - Explicit User Requirement */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              فیلتر سریع پروژه‌ها بر اساس اولویت و ددلاین:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Priority Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 dark:text-slate-400">اولویت:</span>
              <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs">
                {(['all', 'critical', 'high', 'medium', 'low'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setPriorityFilter(p)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      priorityFilter === p
                        ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {p === 'all' && 'همه'}
                    {p === 'critical' && 'بسیار فوری'}
                    {p === 'high' && 'بالا'}
                    {p === 'medium' && 'متوسط'}
                    {p === 'low' && 'عادی'}
                  </button>
                ))}
              </div>
            </div>

            {/* Deadline / Overdue Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 dark:text-slate-400">موعد تحویل:</span>
              <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs">
                {(
                  [
                    { id: 'all', label: 'همه' },
                    { id: 'overdue', label: 'معوقه‌ها ⚠️' },
                    { id: 'this_week', label: 'این هفته' },
                    { id: 'this_month', label: 'ماه جاری' }
                  ] as const
                ).map(item => (
                  <button
                    key={item.id}
                    onClick={() => setDeadlineFilter(item.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      deadlineFilter === item.id
                        ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Status Distribution Doughnut */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">
              توزیع وضعیت پروژه‌ها
            </h3>
            <span className="text-[10px] text-slate-400">نمودار دایره‌ای</span>
          </div>
          <div className="h-64 relative flex items-center justify-center">
            {projects.length > 0 ? (
              <Doughnut data={statusChartData} options={doughnutOptions} />
            ) : (
              <div className="text-center text-xs text-slate-400">
                پروژه‌ای برای نمایش چارت ثبت نشده است
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Team Performance (Bar Chart) */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">
              ارزیابی عملکرد تیم
            </h3>
            <span className="text-[10px] text-slate-400">تکمیل شده vs جاری</span>
          </div>
          <div className="h-64 relative">
            <Bar data={teamPerformanceChartData} options={chartOptions} />
          </div>
        </div>

        {/* Chart 3: Progress Trajectory (Line Chart) */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">
              روند پیشرفت کلی پروژه‌ها (ماهانه)
            </h3>
            <span className="text-[10px] text-slate-400">نمودار خطی</span>
          </div>
          <div className="h-64 relative">
            <Line data={progressLineData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Overdue Projects Table & Priority Warnings */}
      {overdueProjects.length > 0 && (
        <div className="p-5 bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-xs font-bold">
                هشدار: پروژه‌های معوقه نیازمند پیگیری فوری ({toPersianDigits(overdueProjects.length)})
              </h3>
            </div>
            <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
              از موعد تحویل مقرر گذشته است
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400 border-b border-rose-200/60 dark:border-rose-900/40">
                  <th className="pb-2 font-semibold">کد و عنوان پروژه</th>
                  <th className="pb-2 font-semibold">مدیر پروژه</th>
                  <th className="pb-2 font-semibold">ددلاین اولیه</th>
                  <th className="pb-2 font-semibold">درصد پیشرفت</th>
                  <th className="pb-2 font-semibold">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-200/40 dark:divide-rose-900/30">
                {overdueProjects.map(proj => (
                  <tr key={proj.id} className="hover:bg-rose-100/40 dark:hover:bg-rose-900/20 transition-colors">
                    <td className="py-2.5">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{proj.title}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{toPersianDigits(proj.code)}</div>
                    </td>
                    <td className="py-2.5 text-slate-700 dark:text-slate-300">
                      {proj.manager.name}
                    </td>
                    <td className="py-2.5 text-rose-600 dark:text-rose-400 font-mono font-bold">
                      {toPersianDigits(proj.endDate)}
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-rose-200 dark:bg-rose-900 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-rose-600 h-full rounded-full"
                            style={{ width: `${proj.progress}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300">
                          {toPersianPercent(proj.progress)}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5">
                      <button
                        onClick={() => {
                          setSelectedProjectId(proj.id);
                          setActiveNav('dashboards.project');
                        }}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        بررسی و تمدید
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Projects Quick List */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">
              لیست پروژه‌های فیلتر شده ({toPersianDigits(filteredProjects.length)})
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              با کلیک روی هر پروژه وارد نمای تفصیلی و اقدامات آن شوید
            </p>
          </div>
          <button
            onClick={() => setActiveNav('projects.portfolio')}
            className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>مشاهده تمام پروژه‌ها و اقدامات</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <FolderKanban className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              هیچ پروژه‌ای در سامانه ثبت نشده است
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              جهت شروع مدیریت، از طریق دکمه زیر پروژه جدید تعریف فرمایید.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => setIsCreateProjectModalOpen(true)}
                className="px-3 py-1.5 text-xs bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold cursor-pointer"
              >
                + ثبت پروژه جدید
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map(proj => {
              const priorityColor =
                proj.priority === 'critical'
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                  : proj.priority === 'high'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

              const priorityLabel =
                proj.priority === 'critical'
                  ? 'بسیار فوری'
                  : proj.priority === 'high'
                  ? 'اولویت بالا'
                  : proj.priority === 'medium'
                  ? 'متوسط'
                  : 'عادی';

              return (
                <div
                  key={proj.id}
                  onClick={() => {
                    setSelectedProjectId(proj.id);
                    setActiveNav('dashboards.project');
                  }}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-xs transition-all cursor-pointer bg-slate-50/40 dark:bg-slate-800/30 group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${priorityColor}`}>
                      {priorityLabel}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 group-hover:text-emerald-600 transition-colors">
                      {toPersianDigits(proj.code)}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-1 mb-1">
                    {proj.title}
                  </h4>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                    {proj.description || 'بدون توضیحات تکمیلی'}
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400">پیشرفت کل:</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        {toPersianPercent(proj.progress)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all"
                        style={{ width: `${proj.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-3 pt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>مهلت: {toPersianDigits(proj.endDate)}</span>
                    </span>
                    <span>مدیر: {proj.manager.name.split(' ')[0]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
