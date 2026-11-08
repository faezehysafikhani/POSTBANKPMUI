import React from 'react';
import { SettingsAndProfile } from '../components/TmpbSettings';
import './settings-profile.css';

/**
 * «تنظیمات و پروفایل»: the TMPB reference screens (profile, work team, appearance, help, SMS panel, user management,
 * organization structure) plus, for administrators, the product's own «تنظیمات مدیریت پروژه» tab.
 */
export function SettingsProfilePage({ userId, onLogout, projectSettings }: {
  userId: string;
  onLogout: () => void;
  projectSettings?: React.ReactNode;
}) {
  return <SettingsAndProfile userId={userId} onLogout={onLogout} projectSettings={projectSettings} />;
}
