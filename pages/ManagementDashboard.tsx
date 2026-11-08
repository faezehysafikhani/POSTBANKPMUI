import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActionItem, Calendar, Project, User } from '../types';
import { PieDoughnutChart } from '../components/Charts';
import { getOfficialHolidayReason, toPersianDigits } from '../utils';
import { PersonalEvent, personalEvents } from '../services/backend/events';
import { gregorianDay, monthGrid, moveMonth, PERSIAN_MONTHS, persianDateKey, tehranDateTime, tehranDay } from '../components/managementCalendar';
import './management-dashboard.css';

const weekdays = ['ش','ی','د','س','چ','پ','ج'];

// «پروژه جدید» opens a small menu (waterfall / agile); «اقدام جدید» goes straight to the action form.
function CreateButtons({ onNavigate, compact = false }: { onNavigate:(page:string,context?:any)=>void; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement|null>(null);
  useEffect(()=>{
    if(!open)return;
    const close=(event:MouseEvent|KeyboardEvent)=>{if(event instanceof KeyboardEvent?event.key==='Escape':!box.current?.contains(event.target as Node))setOpen(false);};
    document.addEventListener('mousedown',close);document.addEventListener('keydown',close);
    return()=>{document.removeEventListener('mousedown',close);document.removeEventListener('keydown',close);};
  },[open]);
  const go=(page:string,type?:string)=>{setOpen(false);onNavigate(page,{...(type?{type}:{}),from:'dashboard'});};
  return <div className={`mg-create-buttons${compact?' compact':''}`} ref={box}>
    <div className="mg-create-menu">
      <button type="button" className="save-btn" aria-haspopup="menu" aria-expanded={open} onClick={()=>setOpen(value=>!value)}><span className="material-symbols-outlined" aria-hidden="true">create_new_folder</span>پروژه جدید<span className="material-symbols-outlined mg-caret" aria-hidden="true">expand_more</span></button>
      {open&&<div className="mg-create-popover" role="menu">
        <button type="button" role="menuitem" onClick={()=>go('create_waterfall_details','waterfall')}><span className="material-symbols-outlined" aria-hidden="true">account_tree</span><span><strong>پروژه آبشاری</strong><small>مرحله‌ای با ساختار شکست کار</small></span></button>
        <button type="button" role="menuitem" onClick={()=>go('create_agile_details','agile')}><span className="material-symbols-outlined" aria-hidden="true">sync_alt</span><span><strong>پروژه چابک</strong><small>اسپرینت‌ها و فعالیت‌های تیم</small></span></button>
      </div>}
    </div>
    <button type="button" className="save-btn" onClick={()=>go('define_action')}><span className="material-symbols-outlined" aria-hidden="true">add_task</span>اقدام جدید</button>
  </div>;
}
const statusLabels: Record<string,string> = {'In Progress':'در حال انجام','Planning':'برنامه‌ریزی','Completed':'تکمیل شده','On Hold':'متوقف شده','Not Started':'شروع نشده','Cancelled':'لغو شده'};
const isoDay = (date: Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
// An item belongs to a day while that day lies between its start and end dates (either may be missing).
const runsOn = (day: string, start?: string|null, end?: string|null) => !!(start||end) && (!start||start.slice(0,10)<=day) && (!end||end.slice(0,10)>=day);
export function ManagementDashboard({ projects, actions, calendars, user, onNavigate }: { projects:Project[]; actions:ActionItem[]; calendars:Calendar[]; user:User; onNavigate:(page:string,context?:any)=>void }) {
  const today = tehranDay();
  const [month, setMonth] = useState({year:today.jy,month:today.jm});
  const [selected, setSelected] = useState(persianDateKey(today.jy,today.jm,today.jd));
  const [events, setEvents] = useState<PersonalEvent[]>([]); const [loading,setLoading] = useState(false);
  const [error,setError] = useState('');
  const [revision,setRevision] = useState(0);
  const dayButtons = useRef<(HTMLButtonElement|null)[]>([]);
  const grid = monthGrid(month.year,month.month);
  const todayKey = persianDateKey(today.jy,today.jm,today.jd);
  const workCalendar = calendars.find(calendar=>calendar.isDefault) || calendars[0];
  const active = projects.filter(project=>project.status==='In Progress').length;
  const openActions = actions.filter(action=>action.status!=='Completed').length;
  const percentage = projects.length ? Math.round(active/projects.length*100) : 0;
  const stats = [
    {label:'تعداد کل پروژه‌ها',value:projects.length,hint:'سبد پروژه‌های پست بانک',icon:'folder_special',color:'aqua'},
    {label:'تعداد کل اقدامات',value:actions.length,hint:'اقدامات ثبت‌شده',icon:'assignment',color:'blue'},
    {label:'پروژه‌های فعال',value:active,hint:`${toPersianDigits(percentage)}٪ از کل پروژه‌ها`,icon:'track_changes',color:'green'},
    {label:'اقدامات باز',value:openActions,hint:'نیازمند پیگیری',icon:'inbox',color:'orange'},
  ];
  const chart = [
    {label:'در حال انجام',value:active,color:'var(--pb-chart-main, #35bb6d)'}, {label:'برنامه‌ریزی',value:projects.filter(p=>p.status==='Planning').length,color:'#e9b16b'},
    {label:'تکمیل شده',value:projects.filter(p=>p.status==='Completed').length,color:'#5fb89e'}, {label:'متوقف شده',value:projects.filter(p=>p.status==='On Hold').length,color:'#db8994'},
  ];
  useEffect(()=>{
    let live=true; setLoading(true);setError('');
    const next=moveMonth(month.year,month.month,1);
    personalEvents.list(tehranDateTime(persianDateKey(month.year,month.month,1),'00:00'),tehranDateTime(persianDateKey(next.year,next.month,1),'00:00'))
      .then(result=>{if(!live)return;if(result.ok&&Array.isArray(result.value))setEvents(result.value);else{setEvents([]);setError(result.error?.message||'دریافت رویدادها انجام نشد.');}})
      .catch(()=>{if(live){setEvents([]);setError('ارتباط با سرور رویدادها برقرار نشد.');}})
      .finally(()=>{if(live)setLoading(false);});
    return()=>{live=false;};
  },[month.year,month.month,revision]);
  const eventDays = useMemo(()=>{
    const grouped=new Map<string,PersonalEvent[]>();
    for(const event of events){const day=tehranDay(event.startAtUtc);const key=persianDateKey(day.jy,day.jm,day.jd);grouped.set(key,[...(grouped.get(key)||[]),event]);}
    return grouped;
  },[events]);
  function changeMonth(delta:number){const next=moveMonth(month.year,month.month,delta);setMonth(next);setSelected(persianDateKey(next.year,next.month,1));}
  const [selectedYear,selectedMonth,selectedDay]=selected.split('/').map(Number);
  const selectedEvents=eventDays.get(selected)||[];
  const selectedIso=isoDay(gregorianDay(selectedYear,selectedMonth,selectedDay));
  const dayProjects=projects.filter(project=>runsOn(selectedIso,project.startDate,project.endDate));
  const dayActions=actions.filter(action=>runsOn(selectedIso,action.startDate,action.endDate));
  const shortDate=(value?:string|null)=>{if(!value)return '—';const [y,m,d]=value.slice(0,10).split('-').map(Number);return y?new Intl.DateTimeFormat('fa-IR',{month:'short',day:'numeric'}).format(new Date(y,m-1,d,12)):'—';};
  const gregorianStart=gregorianDay(month.year,month.month,1),gregorianEnd=gregorianDay(month.year,month.month,grid.days);
  const rangeFormat=new Intl.DateTimeFormat('fa-IR',{calendar:'gregory',day:'numeric',month:'long',year:'numeric'});
  function dayKey(event:React.KeyboardEvent,day:number){
    let next=day;
    if(event.key==='ArrowLeft')next++;else if(event.key==='ArrowRight')next--;else if(event.key==='ArrowDown')next+=7;else if(event.key==='ArrowUp')next-=7;else if(event.key==='Home')next=1;else if(event.key==='End')next=grid.days;else return;
    event.preventDefault();next=Math.min(grid.days,Math.max(1,next));setSelected(persianDateKey(month.year,month.month,next));dayButtons.current[next]?.focus();
  }
  return <section className="management-dashboard" dir="rtl" aria-labelledby="management-dashboard-title">
    <h2 id="management-dashboard-title" className="mg-visually-hidden">داشبورد مدیریتی</h2>
    <div className="mg-stat-grid">{stats.map(stat=><div className="mg-stat-card" key={stat.label}><span className={`mg-stat-icon ${stat.color} material-symbols-outlined`} aria-hidden="true">{stat.icon}</span><div><div className="mg-stat-title"><strong>{toPersianDigits(stat.value)}</strong><span>{stat.label}</span></div><p>{stat.hint}</p></div></div>)}</div>
    <div className="mg-dashboard-columns">
      <section className="mg-calendar-card" aria-label="تقویم شمسی مدیریتی">
        <div className="mg-card-heading mg-toolbar"><CreateButtons onNavigate={onNavigate}/></div>
        {error&&<div className="mg-error" role="alert">{error}<button type="button" className="cancel-btn" onClick={()=>setRevision(value=>value+1)}>تلاش دوباره</button></div>}
        <div className="mg-month-nav"><button type="button" className="mg-icon-button" onClick={()=>changeMonth(-1)} aria-label="ماه قبل"><span className="material-symbols-outlined" aria-hidden="true">chevron_right</span></button><div aria-live="polite"><h4>{PERSIAN_MONTHS[month.month-1]} {toPersianDigits(month.year)}</h4><p>{rangeFormat.format(gregorianStart)} تا {rangeFormat.format(gregorianEnd)}</p></div><button type="button" className="mg-icon-button" onClick={()=>changeMonth(1)} aria-label="ماه بعد"><span className="material-symbols-outlined" aria-hidden="true">chevron_left</span></button></div>
        <div className="mg-weekdays" aria-hidden="true">{weekdays.map(day=><span key={day}>{day}</span>)}</div>
        <div className="mg-month-grid" role="group" aria-label={`روزهای ${PERSIAN_MONTHS[month.month-1]}`} aria-busy={loading}>
          {grid.cells.map((day,index)=>{
            if(day===null)return <span key={`empty-${index}`} className="mg-empty-day"/>;
            const key=persianDateKey(month.year,month.month,day);const date=gregorianDay(month.year,month.month,day);
            const reason=workCalendar?.specificHolidays?.find(holiday=>holiday.date===key)?.reason || (workCalendar?.applyOfficialHolidays===false?null:getOfficialHolidayReason(date));
            const weekend=workCalendar?!workCalendar.workingDays.includes(date.getDay()):date.getDay()===5;
            const dayEvents=eventDays.get(key)||[];
            return <button key={key} type="button" ref={element=>{dayButtons.current[day]=element;}} tabIndex={selected===key?0:-1} aria-pressed={selected===key} aria-current={key===todayKey?'date':undefined} aria-label={`${toPersianDigits(day)} ${PERSIAN_MONTHS[month.month-1]}${reason?`، ${reason}`:weekend?'، تعطیل هفتگی':''}${dayEvents.length?`، ${toPersianDigits(dayEvents.length)} رویداد`:''}`} className={`mg-day ${weekend||reason?'holiday':''} ${selected===key?'selected':''} ${key===todayKey?'today':''}`} onClick={()=>setSelected(key)} onKeyDown={event=>dayKey(event,day)}><span>{toPersianDigits(day)}</span>{reason?<small>{reason}</small>:weekend?<small>تعطیل</small>:null}{dayEvents.length>0&&<i className="mg-event-dot" aria-hidden="true"/>}</button>;
          })}
        </div>
        <div className="mg-calendar-legend"><span><i className="holiday"/>تعطیلات تقویم</span><span><i className="event"/>رویداد ثبت‌شده</span><button type="button" className="cancel-btn" onClick={()=>{setMonth({year:today.jy,month:today.jm});setSelected(todayKey);}}>امروز</button></div>
      </section>
      <section className="mg-agenda-card" aria-labelledby="mg-agenda-title">
        <div className="mg-card-heading"><div><h3 id="mg-agenda-title">برنامه {toPersianDigits(selectedDay)} {PERSIAN_MONTHS[selectedMonth-1]} {toPersianDigits(selectedYear)}</h3></div><div className="mg-agenda-actions"><CreateButtons onNavigate={onNavigate} compact/></div></div>
        <div className="mg-agenda-list" tabIndex={0} aria-label="فهرست کارهای روز">
          <h4><span className="material-symbols-outlined" aria-hidden="true">folder_special</span>پروژه‌ها<b>{toPersianDigits(dayProjects.length)}</b></h4>
          {dayProjects.length?dayProjects.map(project=><button type="button" className="mg-agenda-item project" key={project.id} onClick={()=>onNavigate('project_dashboard_details',{project,from:'dashboard'})}><span className="mg-agenda-mark" aria-hidden="true"/><span><strong>{project.name}</strong><small>{shortDate(project.startDate)} تا {shortDate(project.endDate)}</small></span><em>{statusLabels[project.status]||project.status}</em></button>):<p className="mg-muted">پروژه‌ای در این روز در جریان نیست.</p>}
          <h4><span className="material-symbols-outlined" aria-hidden="true">assignment</span>اقدامات<b>{toPersianDigits(dayActions.length)}</b></h4>
          {dayActions.length?dayActions.map(action=><button type="button" className="mg-agenda-item action" key={action.id} onClick={()=>onNavigate('define_action',{action,from:'dashboard'})}><span className="mg-agenda-mark" aria-hidden="true"/><span><strong>{action.title}</strong><small>{shortDate(action.startDate)} تا {shortDate(action.endDate)}</small></span><em>{statusLabels[action.status]||action.status}</em></button>):<p className="mg-muted">اقدامی در این روز در جریان نیست.</p>}
          <h4><span className="material-symbols-outlined" aria-hidden="true">event</span>رویدادها<b>{toPersianDigits(selectedEvents.length)}</b></h4>
          {loading?<p role="status">در حال دریافت رویدادها…</p>:selectedEvents.length?selectedEvents.map(event=><div className="mg-event-row" key={event.id}><span className="material-symbols-outlined" aria-hidden="true">event</span><div><strong>{event.title}</strong><span>{new Intl.DateTimeFormat('fa-IR',{timeZone:'Asia/Tehran',hour:'2-digit',minute:'2-digit'}).format(new Date(/(?:Z|[+-]\d{2}:\d{2})$/i.test(event.startAtUtc)?event.startAtUtc:`${event.startAtUtc}Z`))}{event.isCompleted?' · انجام شده':''}</span></div></div>):<p className="mg-muted">{error?'رویدادهای این روز در دسترس نیستند.':'برای این روز رویدادی ثبت نشده است.'}</p>}
        </div>
      </section>
    </div>
    <section className="mg-status-card" aria-labelledby="mg-status-title"><div className="mg-card-heading"><div><h3 id="mg-status-title">پروژه‌ها بر اساس وضعیت</h3><p>توزیع وضعیت سبد پروژه‌ها</p></div><span className="mg-small-badge">دایره‌ای</span></div><div className="mg-status-body"><div className="mg-status-chart">{projects.length?<PieDoughnutChart data={chart.filter(item=>item.value>0).map(item=>({name:item.label,value:item.value,color:item.color}))} type="doughnut"/>:<div className="mg-empty-chart"><span className="material-symbols-outlined">donut_large</span><strong>۰</strong><p>هنوز پروژه‌ای ثبت نشده است.</p></div>}</div><div className="mg-status-summary">{chart.map(item=><div key={item.label}><span><i style={{background:item.color}}/>{item.label}</span><strong>{toPersianDigits(item.value)}</strong></div>)}</div></div><button type="button" className="cancel-btn mg-portfolio-link" onClick={()=>onNavigate('portfolio')}>مشاهده سبد پروژه‌ها و اقدامات <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span></button></section>
  </section>;
}
