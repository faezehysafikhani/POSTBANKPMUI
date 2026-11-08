import React, { useEffect, useState } from 'react';
import { GitPullRequest, Eye, CalendarDays, Table2 } from 'lucide-react';
import { PillTabs, type TabItem } from '../tmpb/components/admin/AdminUi';
import { SettingsPage as ProjectSettingsPage } from '../pages/CorePages';
import { CalendarManagementPage, ReferenceTablesPage } from '../pages/AdvancedPages';
import type { Calendar } from '../types';

export type ProjectSettingsTab = 'workflow' | 'visibility' | 'calendar' | 'tables';

// The calendar editor is a page of its own; coming back from it must land on the calendar tab again.
let pendingTab: ProjectSettingsTab | null = null;
export const requestProjectSettingsTab = (tab: ProjectSettingsTab) => { pendingTab = tab; };

type WorkflowProps = React.ComponentProps<typeof ProjectSettingsPage>;

type Props = {
  workflow: WorkflowProps;
  calendars: Calendar[];
  onDeleteCalendar: React.ComponentProps<typeof CalendarManagementPage>["onDelete"];
  projectStatuses: string[];
  onNavigate: (page: string, context?: any) => void;
};

const TABS: TabItem<ProjectSettingsTab>[] = [
  { id: 'workflow', label: 'گردش کار و تاییدات', icon: GitPullRequest },
  { id: 'visibility', label: 'سطح مشاهده', icon: Eye },
  { id: 'calendar', label: 'تقویم کاری', icon: CalendarDays },
  { id: 'tables', label: 'جداول پایه', icon: Table2 },
];

/** The project-management product's own settings, as sub-tabs of the settings page's «تنظیمات مدیریت پروژه» tab. */
export function ProjectSettingsTabs({ workflow, calendars, onDeleteCalendar, projectStatuses, onNavigate }: Props) {
  const [tab, setTab] = useState<ProjectSettingsTab>(() => {
    const requested = pendingTab;
    pendingTab = null;
    return requested ?? 'workflow';
  });
  useEffect(() => { pendingTab = null; }, []);

  return (
    <div className="space-y-4" dir="rtl">
      <PillTabs tabs={TABS} active={tab} onChange={setTab} />
      {/* The old pages carry their own title and a back button; inside a tab only their content is wanted. */}
      <style>{`.pm-embedded .back-button{display:none}`}</style>
      <div className="pm-embedded">
        {tab === 'workflow' && <ProjectSettingsPage {...workflow} only="workflow" />}
        {tab === 'visibility' && <ProjectSettingsPage {...workflow} only="visibility" />}
        {tab === 'calendar' && <CalendarManagementPage calendars={calendars} onNavigate={onNavigate} onDelete={onDeleteCalendar} />}
        {tab === 'tables' && <ReferenceTablesPage projectStatuses={projectStatuses} onNavigate={onNavigate} />}
      </div>
    </div>
  );
}
