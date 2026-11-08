import React, { useEffect, useState } from 'react';

// All three values use Tehran time, so dates and clock agree at midnight.
const zone = { timeZone: 'Asia/Tehran' };
const persianDate = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { ...zone, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
const gregorianDate = new Intl.DateTimeFormat('en-GB-u-ca-gregory', { ...zone, year: 'numeric', month: 'long', day: 'numeric' });
const clock = new Intl.DateTimeFormat('fa-IR', { ...zone, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });

// The login page shows both calendars; the signed-in header keeps only the Persian date.
export const LoginPortalClock = ({ showGregorian = true }: { showGregorian?: boolean }) => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return <aside className="pb-portal-clock" aria-label="ساعت و تقویم به وقت تهران">
    <div className="pb-portal-time"><span className="material-symbols-outlined" aria-hidden="true">schedule</span><time dateTime={now.toISOString()} dir="ltr">{clock.format(now)}</time><small>به وقت تهران</small></div>
    <div className="pb-portal-date"><span className="material-symbols-outlined" aria-hidden="true">calendar_month</span><span><small>تاریخ شمسی</small><time dateTime={now.toISOString()}>{persianDate.format(now)}</time></span></div>
    {showGregorian && <div className="pb-portal-date"><span className="material-symbols-outlined" aria-hidden="true">calendar_today</span><span><small>تاریخ میلادی</small><time dateTime={now.toISOString()} dir="ltr" lang="en">{gregorianDate.format(now)}</time></span></div>}
  </aside>;
};
