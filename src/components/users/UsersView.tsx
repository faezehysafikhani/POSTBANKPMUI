import React, { useState } from 'react';
import { Users, UserPlus, Mail, Shield, CheckCircle2, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TeamMember } from '../../types';
import { toPersianDigits } from '../../utils/persianDigits';

export const UsersView: React.FC = () => {
  const { teamMembers, actions } = useApp();
  const [search, setSearch] = useState('');

  const filteredMembers = teamMembers.filter(
    m =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.role.toLowerCase().includes(search.toLowerCase()) ||
      m.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>مدیریت کاربران و دسترسی‌های سازمانی</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            مشاهده اعضای تیم، نقش‌های سازمانی و بار کاری هر یک از کارشناسان
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="جستجوی نام یا نقش..."
            className="w-full pr-9 pl-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-hidden"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map(member => {
          const memberActiveTasks = actions.filter(
            a => a.assignee.id === member.id && a.status !== 'done'
          ).length;

          return (
            <div
              key={member.id}
              className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-100 dark:ring-slate-800"
                  />
                  <span
                    className={`absolute -bottom-1 -left-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
                      member.isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                  />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {member.name}
                  </h3>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    {member.role}
                  </p>
                  <p className="text-[10px] text-slate-400">{member.department}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between text-slate-500">
                  <span>پست الکترونیک:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{member.email}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>وظایف فعال جاری:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {toPersianDigits(memberActiveTasks)} اقدام
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
