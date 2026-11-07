import React, { useState } from 'react';
import { NavigationTab, SettingsAccordion, SettingsIcon, SettingsTabs } from '../components/SettingsNavigation';
import './settings-profile.css';

const mainTabs: NavigationTab[] = [
  { id: 'profile', label: 'پروفایل', icon: 'user' },
  { id: 'team', label: 'مدیریت تیم کاری', icon: 'users' },
  { id: 'appearance', label: 'ظاهر سامانه', icon: 'palette' },
  { id: 'help', label: 'راهنما', icon: 'document' },
  { id: 'sms', label: 'پنل پیامکی', icon: 'message' },
  { id: 'users', label: 'مدیریت کاربران', icon: 'admin' },
];
const userTabs: NavigationTab[] = [
  { id: 'users', label: 'مدیریت کاربران' }, { id: 'roles', label: 'نقش‌ها' },
  { id: 'titles', label: 'عنوان‌ها' }, { id: 'history', label: 'تاریخچه ورود' },
  { id: 'ldap', label: 'LDAP' }, { id: 'sso', label: 'ورود با SSO' },
];
function PlaceholderCard({ title, icon = 'document' }: { title: string; icon?: NavigationTab['icon'] }) {
  return <div className="sp-placeholder"><span className="sp-placeholder-icon"><SettingsIcon name={icon}/></span><h3>{title}</h3><p>محتوای این بخش در ادامه اضافه می‌شود</p></div>;
}
export function SettingsProfilePage() {
  const [selected, setSelected] = useState('profile');
  const [userTab, setUserTab] = useState('users');
  const active = mainTabs.find(tab => tab.id === selected)!;
  return <section className="settings-profile-page" dir="rtl" aria-labelledby="settings-profile-title">
    <div className="sp-heading"><span className="sp-heading-icon"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 3-1 3-3 1v4l-2 1 2 2v3l3 1 1 3h6l1-3 3-1v-3l2-2-2-1V7l-3-1-1-3Z"/><circle cx="12" cy="12" r="3"/></svg></span>
      <div><h2 id="settings-profile-title">تنظیمات و پروفایل</h2><p>مدیریت اطلاعات شخصی و تنظیمات سامانه</p></div></div>
    <div className="sp-workspace"><SettingsTabs tabs={mainTabs} selected={selected} onSelect={setSelected} label="بخش‌های تنظیمات و پروفایل">
      {selected === 'profile' ? <div className="sp-accordions">
        <SettingsAccordion title="پروفایل و آواتار کاربری" icon="user"><p>اطلاعات شخصی و آواتار کاربری در این بخش نمایش داده خواهد شد.</p></SettingsAccordion>
        <SettingsAccordion title="تغییر رمز عبور" icon="lock"><p>محتوای این بخش در ادامه اضافه می‌شود</p></SettingsAccordion>
        <SettingsAccordion title="همکاران زیر مجموعه" icon="users"><p>فهرست همکاران زیر مجموعه در این بخش نمایش داده خواهد شد.</p></SettingsAccordion>
      </div> : selected === 'users' ? <SettingsTabs tabs={userTabs} selected={userTab} onSelect={setUserTab} label="بخش‌های مدیریت کاربران" secondary>
        <PlaceholderCard title={userTabs.find(tab => tab.id === userTab)!.label} icon="admin"/>
      </SettingsTabs> : <PlaceholderCard title={active.label} icon={active.icon}/>}
    </SettingsTabs></div>
  </section>;
}
