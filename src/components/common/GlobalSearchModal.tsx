import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, FolderKanban, CheckSquare, Users, ShieldCheck, ArrowLeft, MessageSquare } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const GlobalSearchModal: React.FC = () => {
  const {
    isGlobalSearchOpen,
    setIsGlobalSearchOpen,
    projects,
    actions,
    teamMembers,
    approvals,
    setActiveNav,
    setSelectedProjectId
  } = useApp();

  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isGlobalSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isGlobalSearchOpen]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { projects: [], actions: [], members: [], approvals: [] };

    const matchedProjects = projects.filter(
      p =>
        p.title.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
    );

    const matchedActions = actions.filter(
      a =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.projectTitle.toLowerCase().includes(q) ||
        a.assignee.name.toLowerCase().includes(q)
    );

    const matchedMembers = teamMembers.filter(
      m =>
        m.name.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q) ||
        m.department.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
    );

    const matchedApprovals = approvals.filter(
      app =>
        app.actionTitle.toLowerCase().includes(q) ||
        app.projectTitle.toLowerCase().includes(q) ||
        app.requester.name.toLowerCase().includes(q)
    );

    return {
      projects: matchedProjects,
      actions: matchedActions,
      members: matchedMembers,
      approvals: matchedApprovals
    };
  }, [query, projects, actions, teamMembers, approvals]);

  const totalMatches =
    searchResults.projects.length +
    searchResults.actions.length +
    searchResults.members.length +
    searchResults.approvals.length;

  if (!isGlobalSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="global-search-container"
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        {/* Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <Search className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="جستجو در نام پروژه‌ها، کد اقدام، اعضای تیم، تاییدات و کارتابل..."
            className="w-full bg-transparent border-none text-slate-800 dark:text-slate-100 text-sm focus:outline-hidden placeholder:text-slate-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            id="close-global-search-modal-btn"
            onClick={() => setIsGlobalSearchOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="بستن جستجو"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-3 divide-y divide-slate-100 dark:divide-slate-800">
          {query && totalMatches === 0 && (
            <div className="p-8 text-center text-slate-400 text-sm">
              هیچ موردی مطابق با عبارت «{query}» در سامانه یافت نشد.
            </div>
          )}

          {!query && (
            <div className="p-6 text-center text-xs text-slate-400 space-y-2">
              <p>عبارت مورد نظر خود را برای جستجوی جامع در کل سامانه وارد نمایید.</p>
              <div className="flex justify-center gap-2 pt-2">
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-500">پروژه‌ها</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-500">اقدامات</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-500">کارتابل</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-500">اعضای تیم</span>
              </div>
            </div>
          )}

          {/* Matched Projects */}
          {searchResults.projects.length > 0 && (
            <div className="py-2">
              <div className="text-[11px] font-bold text-slate-400 px-3 mb-1 flex items-center gap-1.5">
                <FolderKanban className="w-3.5 h-3.5" />
                <span>پروژه‌ها ({searchResults.projects.length})</span>
              </div>
              {searchResults.projects.map(proj => (
                <div
                  key={proj.id}
                  onClick={() => {
                    setSelectedProjectId(proj.id);
                    setActiveNav('dashboards.project');
                    setIsGlobalSearchOpen(false);
                  }}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-teal-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                      {proj.title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      کد: {proj.code} | دسته: {proj.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                      {proj.progress}%
                    </span>
                    <ArrowLeft className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Matched Actions */}
          {searchResults.actions.length > 0 && (
            <div className="py-2">
              <div className="text-[11px] font-bold text-slate-400 px-3 mb-1 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5" />
                <span>اقدامات و وظایف ({searchResults.actions.length})</span>
              </div>
              {searchResults.actions.map(act => (
                <div
                  key={act.id}
                  onClick={() => {
                    setActiveNav('inbox.tasks');
                    setIsGlobalSearchOpen(false);
                  }}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-teal-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                      {act.title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      پروژه: {act.projectTitle} | مجری: {act.assignee.name}
                    </p>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              ))}
            </div>
          )}

          {/* Matched Members */}
          {searchResults.members.length > 0 && (
            <div className="py-2">
              <div className="text-[11px] font-bold text-slate-400 px-3 mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>اعضای تیم ({searchResults.members.length})</span>
              </div>
              {searchResults.members.map(m => (
                <div
                  key={m.id}
                  onClick={() => {
                    setActiveNav('users.list');
                    setIsGlobalSearchOpen(false);
                  }}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-teal-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <img src={m.avatar} alt={m.name} className="w-7 h-7 rounded-full object-cover" />
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {m.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {m.role} - {m.department}
                      </p>
                    </div>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              ))}
            </div>
          )}

          {/* Matched Approvals */}
          {searchResults.approvals.length > 0 && (
            <div className="py-2">
              <div className="text-[11px] font-bold text-slate-400 px-3 mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>تاییدات کارتابل ({searchResults.approvals.length})</span>
              </div>
              {searchResults.approvals.map(app => (
                <div
                  key={app.id}
                  onClick={() => {
                    setActiveNav('inbox.approvals');
                    setIsGlobalSearchOpen(false);
                  }}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-teal-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                      {app.actionTitle}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      درخواست‌دهنده: {app.requester.name} | پروژه: {app.projectTitle}
                    </p>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
