import React, { useEffect, useRef, useState } from 'react';
import { ActionItem, Calendar, Project, User } from '../types';
import { PieDoughnutChart } from '../components/Charts';
import { getOfficialHolidayReason, toPersianDigits } from '../utils';
import { gregorianDay, monthGrid, moveMonth, PERSIAN_MONTHS, persianDateKey, tehranDay } from '../components/managementCalendar';
import './management-dashboard.css';

// Gregorian and lunar (Hijri) dates come from the browser's built-in calendars (Intl), so nothing is fetched.
// The lunar dates follow the Umm al-Qura calendar and can differ by a day from Iran's official lunar calendar.
const gregorianDayFormat = new Intl.DateTimeFormat('en-US', { day: 'numeric' });
const hijriDayFormat = new Intl.DateTimeFormat('fa-IR-u-ca-islamic-umalqura', { day: 'numeric' });
const hijriMonth = new Intl.DateTimeFormat('fa-IR-u-ca-islamic-umalqura', { month: 'long' });
const hijriYear = new Intl.DateTimeFormat('fa-IR-u-ca-islamic-umalqura', { year: 'numeric' });
const gregorianMonth = new Intl.DateTimeFormat('fa-IR-u-ca-gregory', { month: 'long' });
const gregorianYear = new Intl.DateTimeFormat('fa-IR-u-ca-gregory', { year: 'numeric' });
/** "آبان" style span of two calendars' months: «اکتبر – نوامبر ۲۰۲۶», or with both years when they differ. */
function monthSpan(start: Date, end: Date, month: Intl.DateTimeFormat, year: Intl.DateTimeFormat) {
  const clean = (text: string) => text.replace(/s*(ه‍.ق.|ق.|م.)s*$/u, '');
  const [m1, m2, y1, y2] = [month.format(start), month.format(end), clean(year.format(start)), clean(year.format(end))];
  if (m1 === m2) return `${m1} ${y1}`;
  return y1 === y2 ? `${m1} – ${m2} ${y1}` : `${m1} ${y1} – ${m2} ${y2}`;
}

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
  const [dayMenu,setDayMenu] = useState<{key:string;top:number;left:number}|null>(null);
  const gridBox = useRef<HTMLDivElement|null>(null); const menuBox = useRef<HTMLDivElement|null>(null);

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
    if(!dayMenu)return;
    const close=(event:MouseEvent|KeyboardEvent)=>{
      if(event instanceof KeyboardEvent){if(event.key==='Escape'){setDayMenu(null);dayButtons.current[Number(dayMenu.key.split('/')[2])]?.focus();}return;}
      const target=event.target as Node;if(!menuBox.current?.contains(target)&&!(target instanceof Element&&target.closest('.mg-day')))setDayMenu(null);
    };
    document.addEventListener('mousedown',close);document.addEventListener('keydown',close);
    return()=>{document.removeEventListener('mousedown',close);document.removeEventListener('keydown',close);};
  },[dayMenu]);
  function openDay(key:string,button:HTMLButtonElement){
    setSelected(key);
    const grid=gridBox.current;if(!grid)return;
    const g=grid.getBoundingClientRect(),b=button.getBoundingClientRect();
    setDayMenu(current=>current?.key===key?null:{key,top:b.bottom-g.top+6,left:Math.min(Math.max(b.left-g.left+b.width/2,110),g.width-110)});
  }
  function createFromDay(kind:'waterfall'|'agile'|'action'){
    const key=dayMenu?.key||selected;setDayMenu(null);
    if(kind==='action')onNavigate('define_action',{from:'dashboard',date:key});
    else onNavigate(kind==='waterfall'?'create_waterfall_details':'create_agile_details',{type:kind,from:'dashboard',date:key});
  }
  function changeMonth(delta:number){const next=moveMonth(month.year,month.month,delta);setMonth(next);setSelected(persianDateKey(next.year,next.month,1));}
  const [selectedYear,selectedMonth,selectedDay]=selected.split('/').map(Number);
  const selectedIso=isoDay(gregorianDay(selectedYear,selectedMonth,selectedDay));
  const dayProjects=projects.filter(project=>runsOn(selectedIso,project.startDate,project.endDate));
  const dayActions=actions.filter(action=>runsOn(selectedIso,action.startDate,action.endDate));
  const shortDate=(value?:string|null)=>{if(!value)return '—';const [y,m,d]=value.slice(0,10).split('-').map(Number);return y?new Intl.DateTimeFormat('fa-IR',{month:'short',day:'numeric'}).format(new Date(y,m-1,d,12)):'—';};
  const gregorianStart=gregorianDay(month.year,month.month,1),gregorianEnd=gregorianDay(month.year,month.month,grid.days);
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
        <div className="mg-month-nav"><button type="button" className="mg-icon-button" onClick={()=>changeMonth(-1)} aria-label="ماه قبل"><span className="material-symbols-outlined" aria-hidden="true">chevron_right</span></button><div aria-live="polite"><h4>{PERSIAN_MONTHS[month.month-1]} {toPersianDigits(month.year)}</h4><p className="mg-month-alt"><span>{monthSpan(gregorianStart,gregorianEnd,gregorianMonth,gregorianYear)}</span><span>{monthSpan(gregorianStart,gregorianEnd,hijriMonth,hijriYear)}</span></p></div><button type="button" className="mg-icon-button" onClick={()=>changeMonth(1)} aria-label="ماه بعد"><span className="material-symbols-outlined" aria-hidden="true">chevron_left</span></button></div>
        <div className="mg-weekdays" aria-hidden="true">{weekdays.map(day=><span key={day}>{day}</span>)}</div>
        <div className="mg-month-grid" ref={gridBox} role="group" aria-label={`روزهای ${PERSIAN_MONTHS[month.month-1]}`}>
          {grid.cells.map((day,index)=>{
            if(day===null)return <span key={`empty-${index}`} className="mg-empty-day"/>;
            const key=persianDateKey(month.year,month.month,day);const date=gregorianDay(month.year,month.month,day);
            const reason=workCalendar?.specificHolidays?.find(holiday=>holiday.date===key)?.reason || (workCalendar?.applyOfficialHolidays===false?null:getOfficialHolidayReason(date));
            const weekend=workCalendar?!workCalendar.workingDays.includes(date.getDay()):date.getDay()===5;
            return <button key={key} type="button" ref={element=>{dayButtons.current[day]=element;}} tabIndex={selected===key?0:-1} aria-pressed={selected===key} aria-current={key===todayKey?'date':undefined} aria-label={`${toPersianDigits(day)} ${PERSIAN_MONTHS[month.month-1]}${reason?`، ${reason}`:weekend?'، تعطیل هفتگی':''}`} className={`mg-day ${weekend||reason?'holiday':''} ${selected===key?'selected':''} ${key===todayKey?'today':''}`} aria-haspopup="menu" aria-expanded={dayMenu?.key===key} onClick={event=>openDay(key,event.currentTarget)} onKeyDown={event=>dayKey(event,day)}><span>{toPersianDigits(day)}</span><span className="mg-alt-dates" aria-hidden="true"><b title="میلادی">{gregorianDayFormat.format(date)}</b><b title="قمری">{hijriDayFormat.format(date)}</b></span>{reason?<small>{reason}</small>:weekend?<small>تعطیل</small>:null}</button>;
          })}
          {dayMenu&&<div className="mg-day-menu" ref={menuBox} role="menu" aria-label={`ایجاد برای ${toPersianDigits(Number(dayMenu.key.split('/')[2]))} ${PERSIAN_MONTHS[Number(dayMenu.key.split('/')[1])-1]}`} style={{top:dayMenu.top,left:dayMenu.left}}>
            <button type="button" role="menuitem" autoFocus onClick={()=>createFromDay('waterfall')}><span className="material-symbols-outlined" aria-hidden="true">account_tree</span>پروژه آبشاری</button>
            <button type="button" role="menuitem" onClick={()=>createFromDay('agile')}><span className="material-symbols-outlined" aria-hidden="true">sync_alt</span>پروژه چابک</button>
            <button type="button" role="menuitem" onClick={()=>createFromDay('action')}><span className="material-symbols-outlined" aria-hidden="true">add_task</span>اقدام جدید</button>
          </div>}
        </div>
        <div className="mg-calendar-legend"><span><i className="holiday"/>تعطیلات تقویم</span><button type="button" className="cancel-btn" onClick={()=>{setMonth({year:today.jy,month:today.jm});setSelected(todayKey);}}>امروز</button></div>
      </section>
      <section className="mg-agenda-card" aria-labelledby="mg-agenda-title">
        <div className="mg-card-heading"><div><h3 id="mg-agenda-title">برنامه {toPersianDigits(selectedDay)} {PERSIAN_MONTHS[selectedMonth-1]} {toPersianDigits(selectedYear)}</h3></div></div>
        <div className="mg-agenda-list" tabIndex={0} aria-label="فهرست کارهای روز">
          <h4><span className="material-symbols-outlined" aria-hidden="true">folder_special</span>پروژه‌ها<b>{toPersianDigits(dayProjects.length)}</b></h4>
          {dayProjects.length?dayProjects.map(project=><button type="button" className="mg-agenda-item project" key={project.id} onClick={()=>onNavigate('project_dashboard_details',{project,from:'dashboard'})}><span className="mg-agenda-mark" aria-hidden="true"/><span><strong>{project.name}</strong><small>{shortDate(project.startDate)} تا {shortDate(project.endDate)}</small></span><em>{statusLabels[project.status]||project.status}</em></button>):<p className="mg-muted">پروژه‌ای در این روز در جریان نیست.</p>}
          <h4><span className="material-symbols-outlined" aria-hidden="true">assignment</span>اقدامات<b>{toPersianDigits(dayActions.length)}</b></h4>
          {dayActions.length?dayActions.map(action=><button type="button" className="mg-agenda-item action" key={action.id} onClick={()=>onNavigate('define_action',{action,from:'dashboard'})}><span className="mg-agenda-mark" aria-hidden="true"/><span><strong>{action.title}</strong><small>{shortDate(action.startDate)} تا {shortDate(action.endDate)}</small></span><em>{statusLabels[action.status]||action.status}</em></button>):<p className="mg-muted">اقدامی در این روز در جریان نیست.</p>}
        </div>
      </section>
    </div>
    <section className="mg-status-card" aria-labelledby="mg-status-title"><div className="mg-card-heading"><div><h3 id="mg-status-title">پروژه‌ها بر اساس وضعیت</h3><p>توزیع وضعیت سبد پروژه‌ها</p></div><span className="mg-small-badge">دایره‌ای</span></div><div className="mg-status-body"><div className="mg-status-chart">{projects.length?<PieDoughnutChart data={chart.filter(item=>item.value>0).map(item=>({name:item.label,value:item.value,color:item.color}))} type="doughnut"/>:<div className="mg-empty-chart"><span className="material-symbols-outlined">donut_large</span><strong>۰</strong><p>هنوز پروژه‌ای ثبت نشده است.</p></div>}</div><div className="mg-status-summary">{chart.map(item=><div key={item.label}><span><i style={{background:item.color}}/>{item.label}</span><strong>{toPersianDigits(item.value)}</strong></div>)}</div></div><button type="button" className="cancel-btn mg-portfolio-link" onClick={()=>onNavigate('portfolio')}>مشاهده سبد پروژه‌ها و اقدامات <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span></button></section>
  </section>;
}
