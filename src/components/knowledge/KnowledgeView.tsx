import React, { useEffect, useState } from 'react';
import {
  Network,
  BookOpen,
  Target,
  FileText
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { toPersianDigits, toPersianPercent } from '../../utils/persianDigits';
import { api } from '../../services/api';
import { KnowledgeItem, StrategicGoal } from '../../types';

interface KnowledgeViewProps {
  initialTab?: 'knowledge' | 'strategy';
}

export const KnowledgeView: React.FC<KnowledgeViewProps> = ({ initialTab = 'knowledge' }) => {
  const { projects } = useApp();
  const [activeTab, setActiveTab] = useState<'knowledge' | 'strategy'>(initialTab);

  const [articles, setArticles] = useState<KnowledgeItem[]>([]);
  const [strategicGoals, setStrategicGoals] = useState<StrategicGoal[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.getKnowledgeItems(), api.getStrategicGoals()])
      .then(([knowledge, strategy]) => {
        if (!cancelled) {
          setArticles(knowledge);
          setStrategicGoals(strategy);
        }
      })
      .catch(error => console.error('Loading knowledge and strategy failed', error));
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Network className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>مدیریت دانش و استراتژی سازمانی</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            مستندسازی درس‌آموخته‌های پروژه‌های پست بانک و پیوند اقدامات عملیاتی با اهداف کلان راهبردی
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('knowledge')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'knowledge'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            مدیریت دانش ({toPersianDigits(articles.length)})
          </button>
          <button
            onClick={() => setActiveTab('strategy')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'strategy'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            اهداف استراتژیک ({toPersianDigits(strategicGoals.length)})
          </button>
        </div>
      </div>

      {activeTab === 'knowledge' ? (
        <div className="space-y-4">
          {articles.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
              <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                هیچ درس‌آموخته یا مستند دانشی ثبت نشده است
              </h4>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                سامانه آماده دریافت درس‌آموخته‌ها و مقالات تجربی از طریق API بک‌اند و دیتابیس می‌باشد.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {articles.map(article => (
                <div
                  key={article.id}
                  className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      {article.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {toPersianDigits(article.date)}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug">
                    {article.title}
                  </h3>

                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    {article.summary}
                  </p>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                    <span>نویسنده: {article.author}</span>
                    <div className="flex gap-1">
                      {article.tags.map((t: string) => (
                        <span key={t} className="text-[9px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {strategicGoals.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
              <Target className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                هیچ هدف راهبردی کلانی تعریف نشده است
              </h4>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                اهداف استراتژیک پس از اتصال به API سازمانی و همگام‌سازی بارگذاری خواهند شد.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {strategicGoals.map(goal => (
                <div
                  key={goal.id}
                  className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {goal.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-1">
                        متولی هدف: {goal.owner} | افق زمانی: سال {toPersianDigits(goal.targetYear)}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        goal.status === 'on_track'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {goal.status === 'on_track' ? 'در مسیر تحقق' : 'نیازمند پایش و ریسک'}
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-bold mb-1">
                      <span className="text-slate-500">پیشرفت کلان هدف:</span>
                      <span className="text-emerald-600">{toPersianPercent(goal.progress)}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
