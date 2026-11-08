/** Fired (by the header's avatar menu) to bring the profile page to the front, optionally on one tab. */
export const OPEN_PROFILE_EVENT = 'nexuscore:open-profile';

/** Fired (by the header's book button) to bring a main tab of the settings page to the front. */
export const OPEN_SETTINGS_TAB_EVENT = 'nexuscore:open-settings-tab';
let pendingSettingsTab: string | null = null;
/** The settings page may not be mounted yet when the button is pressed: it reads this when it opens. */
export const requestSettingsTab = (tab: string) => {
  pendingSettingsTab = tab;
  window.setTimeout(() => window.dispatchEvent(new CustomEvent(OPEN_SETTINGS_TAB_EVENT, { detail: { tab } })), 0);
};
let pendingProfileTab: string | null = null;
/** Opens the profile page on one of its tabs (avatar, password, ...), also when it is not mounted yet. */
export const requestProfileTab = (tab: string) => {
  pendingProfileTab = tab;
  requestSettingsTab('profile');
  window.setTimeout(() => window.dispatchEvent(new CustomEvent(OPEN_PROFILE_EVENT, { detail: { tab } })), 0);
};
export const takePendingProfileTab = (): string | null => {
  const tab = pendingProfileTab;
  pendingProfileTab = null;
  return tab;
};
export const takePendingSettingsTab = (): string | null => {
  const tab = pendingSettingsTab;
  pendingSettingsTab = null;
  return tab;
};
