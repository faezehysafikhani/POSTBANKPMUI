import React from 'react';
import './portfolio-actions.css';

export function PortfolioCreateActions({ onNavigate }: { onNavigate: (page: string, context?: any) => void }) {
  const actions = [
    { label: 'پروژه آبشاری جدید', detail: 'برنامه‌ریزی مرحله‌ای و ساختار شکست کار', icon: 'account_tree', page: 'create_waterfall_details', type: 'waterfall' },
    { label: 'پروژه چابک جدید', detail: 'مدیریت اسپرینت‌ها و فعالیت‌های تیم', icon: 'sync_alt', page: 'create_agile_details', type: 'agile' },
    { label: 'اقدام جدید', detail: 'تعریف و پیگیری یک اقدام اجرایی', icon: 'add_task', page: 'define_action' },
  ];
  return <nav className="portfolio-create-actions no-print" aria-label="ایجاد پروژه و اقدام" dir="rtl">
    {actions.map(action => <button key={action.page} type="button" data-create-kind={action.type || 'action'} className="portfolio-create-button" onClick={() => onNavigate(action.page, { ...(action.type ? { type: action.type } : {}), from: 'portfolio' })}>
      <span className="portfolio-create-icon material-symbols-outlined" aria-hidden="true">{action.icon}</span>
      <span className="portfolio-create-copy"><strong>{action.label}</strong><span>{action.detail}</span></span>
      <span className="portfolio-create-plus material-symbols-outlined" aria-hidden="true">add</span>
    </button>)}
  </nav>;
}
