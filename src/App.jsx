import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard, BookOpen, CheckSquare, CalendarDays, ChartNoAxesCombined,
  Settings, Plus, Search, Bell, Moon, Sun, Menu, X, Clock3, Target,
  Flame, TrendingUp, Trash2, Check, Sparkles, ChevronLeft, GraduationCap,
  CircleHelp, LogOut, MoreHorizontal
} from "lucide-react";

const initialSubjects = [
  { id: 1, name: "الرياضيات", color: "#8b7cff", progress: 68, hours: 12 },
  { id: 2, name: "اللغة العربية", color: "#34c9a4", progress: 82, hours: 8 },
  { id: 3, name: "الفيزياء", color: "#f5ad55", progress: 45, hours: 6 },
  { id: 4, name: "اللغة الإنجليزية", color: "#5da9ff", progress: 56, hours: 7 }
];

const initialTasks = [
  { id: 101, title: "مراجعة درس التفاضل", subject: "الرياضيات", date: todayISO(), duration: 45, priority: "عالية", done: false },
  { id: 102, title: "حل تدريبات النحو", subject: "اللغة العربية", date: todayISO(), duration: 30, priority: "متوسطة", done: false },
  { id: 103, title: "قراءة الفصل الثالث", subject: "الفيزياء", date: todayISO(), duration: 60, priority: "عالية", done: true },
  { id: 104, title: "مراجعة كلمات الوحدة 4", subject: "اللغة الإنجليزية", date: tomorrowISO(), duration: 25, priority: "منخفضة", done: false }
];

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function tomorrowISO() {
  const d = new Date(); d.setDate(d.getDate()+1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function readStore(key, fallback) {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; }
  catch { return fallback; }
}
function saveStore(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

const navItems = [
  ["dashboard", "الرئيسية", LayoutDashboard],
  ["subjects", "المواد الدراسية", BookOpen],
  ["tasks", "المهام", CheckSquare],
  ["planner", "مخطط المذاكرة", CalendarDays],
  ["analytics", "تحليل الأداء", ChartNoAxesCombined]
];

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [subjects, setSubjects] = useState(() => readStore("ff-subjects", initialSubjects));
  const [tasks, setTasks] = useState(() => readStore("ff-tasks", initialTasks));
  const [dark, setDark] = useState(() => readStore("ff-dark", true));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState("");
  const [toast, setToast] = useState("");
  const [newTask, setNewTask] = useState({ title:"", subject:"", date:todayISO(), duration:30, priority:"متوسطة" });
  const [newSubject, setNewSubject] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState(3);
  const [plan, setPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);

  useEffect(() => saveStore("ff-subjects", subjects), [subjects]);
  useEffect(() => saveStore("ff-tasks", tasks), [tasks]);
  useEffect(() => saveStore("ff-dark", dark), [dark]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  const completed = tasks.filter(t => t.done).length;
  const completion = tasks.length ? Math.round(completed / tasks.length * 100) : 0;
  const todayTasks = tasks.filter(t => t.date === todayISO());
  const filteredTasks = tasks.filter(t =>
    `${t.title} ${t.subject}`.toLowerCase().includes(search.toLowerCase())
  );

  function toggleTask(id) {
    setTasks(old => old.map(t => t.id === id ? { ...t, done: !t.done } : t));
  }
  function addTask(e) {
    e.preventDefault();
    if (!newTask.title.trim() || !newTask.subject) {
      setToast("اكتب اسم المهمة واختر المادة."); return;
    }
    setTasks(old => [{ ...newTask, id: Date.now(), duration: Number(newTask.duration), done:false }, ...old]);
    setNewTask({ title:"", subject:subjects[0]?.name || "", date:todayISO(), duration:30, priority:"متوسطة" });
    setModal(""); setToast("تمت إضافة المهمة بنجاح.");
  }
  function addSubject(e) {
    e.preventDefault();
    if (!newSubject.trim()) return;
    setSubjects(old => [...old, { id:Date.now(), name:newSubject.trim(), color:["#8b7cff","#34c9a4","#f5ad55","#5da9ff"][old.length%4], progress:0, hours:0 }]);
    setNewSubject(""); setModal(""); setToast("تمت إضافة المادة.");
  }
  async function generatePlan() {
    if (!subjects.length) { setToast("أضف مادة دراسية أولاً."); return; }
    setLoadingPlan(true);
    try {
      const response = await fetch("/api/plan", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ subjects:subjects.map(s=>({name:s.name})), hoursPerDay })
      });
      if (!response.ok) throw new Error("API unavailable");
      setPlan(await response.json());
    } catch {
      const each = Math.max(25, Math.round(hoursPerDay*60/subjects.length));
      setPlan({ title:"خطة مذاكرة مقترحة", totalHours:hoursPerDay, slots:subjects.map((s,i)=>({id:i,subject:s.name,duration:each,type:i%2?"حل وتطبيق":"مذاكرة وفهم",tip:"قسّم وقتك إلى جلسة تركيز ثم استراحة قصيرة."})), note:"تم إنشاء الخطة محلياً. شغّل الخادم للحصول على الخطة من API." });
    } finally { setLoadingPlan(false); }
  }

  const title = ({dashboard:"الرئيسية",subjects:"المواد الدراسية",tasks:"المهام",planner:"مخطط المذاكرة",analytics:"تحليل الأداء",settings:"الإعدادات"})[page];
  return (
    <div className={dark ? "app dark" : "app light"} dir="rtl">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><GraduationCap size={23}/></div>
          <div><b>FocusFlow</b><small>ذاكر بذكاء، مش أكتر</small></div>
          <button className="icon-btn mobile-close" onClick={()=>setSidebarOpen(false)}><X/></button>
        </div>
        <div className="workspace-label">مساحة العمل</div>
        <nav>
          {navItems.map(([id,label,Icon])=>(
            <button key={id} className={`nav-link ${page===id?"active":""}`} onClick={()=>{setPage(id);setSidebarOpen(false);}}>
              <Icon size={19}/><span>{label}</span>{id==="tasks" && <em>{tasks.filter(t=>!t.done).length}</em>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-icon"><Sparkles size={18}/></div>
            <b>خلّي مذاكرتك أذكى</b>
            <p>نظّم وقتك وحقق أهدافك خطوة بخطوة.</p>
            <button onClick={()=>setPage("planner")}>جرّب المخطط <ChevronLeft size={15}/></button>
          </div>
          <button className={`nav-link ${page==="settings"?"active":""}`} onClick={()=>setPage("settings")}><Settings size={19}/><span>الإعدادات</span></button>
          <div className="profile">
            <div className="avatar">ي</div><div className="profile-info"><b>طالب FocusFlow</b><small>حساب تجريبي</small></div>
            <button className="icon-btn tiny" title="خيارات"><MoreHorizontal size={18}/></button>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="scrim" onClick={()=>setSidebarOpen(false)} />}
      <main className="main">
        <header className="topbar">
          <div className="topbar-start">
            <button className="icon-btn menu-btn" onClick={()=>setSidebarOpen(true)}><Menu/></button>
            <div><div className="breadcrumb">FocusFlow <span>/</span> {title}</div><h1>{title}</h1></div>
          </div>
          <div className="top-actions">
            <label className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث عن مهمة أو مادة..."/></label>
            <button className="icon-btn" onClick={()=>setDark(!dark)} title="تغيير المظهر">{dark?<Sun size={19}/>:<Moon size={19}/>}</button>
            <button className="icon-btn notification" onClick={()=>setToast("ليس لديك إشعارات جديدة.")} title="الإشعارات"><Bell size={19}/><i/></button>
            <div className="top-avatar">ي</div>
          </div>
        </header>

        <div className="content">
          {page==="dashboard" && <Dashboard subjects={subjects} tasks={todayTasks} allTasks={tasks} completion={completion} completed={completed} onToggle={toggleTask} onAdd={()=>{setNewTask(v=>({...v,subject:subjects[0]?.name||""}));setModal("task");}} onNavigate={setPage}/>}
          {page==="subjects" && <Subjects subjects={subjects} onAdd={()=>setModal("subject")} onDelete={id=>setSubjects(old=>old.filter(s=>s.id!==id))}/>}
          {page==="tasks" && <Tasks tasks={filteredTasks} subjects={subjects} onToggle={toggleTask} onAdd={()=>{setNewTask(v=>({...v,subject:subjects[0]?.name||""}));setModal("task");}} onDelete={id=>setTasks(old=>old.filter(t=>t.id!==id))}/>}
          {page==="planner" && <Planner subjects={subjects} hoursPerDay={hoursPerDay} setHoursPerDay={setHoursPerDay} plan={plan} loading={loadingPlan} onGenerate={generatePlan}/>}
          {page==="analytics" && <Analytics tasks={tasks} subjects={subjects} completion={completion} completed={completed}/>}
          {page==="settings" && <SettingsPage dark={dark} setDark={setDark} onReset={()=>{setTasks(initialTasks);setSubjects(initialSubjects);setToast("تمت إعادة البيانات التجريبية.");}}/>}
        </div>
        <footer>صُنع بـ <span>♥</span> لتنظيم مذاكرتك <b>FocusFlow</b> <small>نسخة تجريبية 1.0</small></footer>
      </main>

      {modal==="task" && <Modal title="إضافة مهمة جديدة" onClose={()=>setModal("")}>
        <form onSubmit={addTask} className="form">
          <label>اسم المهمة<input autoFocus value={newTask.title} onChange={e=>setNewTask({...newTask,title:e.target.value})} placeholder="مثال: حل امتحان الفيزياء"/></label>
          <div className="form-grid">
            <label>المادة<select value={newTask.subject} onChange={e=>setNewTask({...newTask,subject:e.target.value})}><option value="">اختر المادة</option>{subjects.map(s=><option key={s.id}>{s.name}</option>)}</select></label>
            <label>تاريخ التسليم<input type="date" value={newTask.date} onChange={e=>setNewTask({...newTask,date:e.target.value})}/></label>
            <label>المدة بالدقائق<input type="number" min="5" max="300" value={newTask.duration} onChange={e=>setNewTask({...newTask,duration:e.target.value})}/></label>
            <label>الأولوية<select value={newTask.priority} onChange={e=>setNewTask({...newTask,priority:e.target.value})}><option>عالية</option><option>متوسطة</option><option>منخفضة</option></select></label>
          </div>
          <button className="primary-btn full" type="submit"><Plus size={17}/> إضافة المهمة</button>
        </form>
      </Modal>}
      {modal==="subject" && <Modal title="إضافة مادة دراسية" onClose={()=>setModal("")}>
        <form onSubmit={addSubject} className="form">
          <label>اسم المادة<input autoFocus value={newSubject} onChange={e=>setNewSubject(e.target.value)} placeholder="مثال: الكيمياء"/></label>
          <button className="primary-btn full" type="submit"><Plus size={17}/> إضافة المادة</button>
        </form>
      </Modal>}
      {toast && <div className="toast"><Check size={17}/>{toast}</div>}
    </div>
  );
}

function Dashboard({subjects,tasks,allTasks,completion,completed,onToggle,onAdd,onNavigate}) {
  const pending = tasks.filter(t=>!t.done);
  const totalMinutes = tasks.reduce((n,t)=>n+Number(t.duration),0);
  return <>
    <section className="welcome-row">
      <div><div className="eyebrow"><span className="pulse"/> يوم جديد، فرصة جديدة</div><h2>أهلاً بيك! <span>👋</span></h2><p>جاهز تحقق تقدم جديد في مذاكرتك النهارده؟</p></div>
      <button className="primary-btn" onClick={onAdd}><Plus size={18}/> مهمة جديدة</button>
    </section>
    <section className="stats-grid">
      <Stat icon={Target} label="إنجاز المهام" value={`${completion}%`} detail={`${completed} من ${allTasks.length} مهمة`} color="purple" />
      <Stat icon={Clock3} label="وقت مذاكرة اليوم" value={`${Math.floor(totalMinutes/60)}س ${totalMinutes%60}د`} detail="حسب مهام اليوم" color="blue"/>
      <Stat icon={Flame} label="مهام متبقية اليوم" value={pending.length} detail="خطوة بخطوة هتوصل" color="orange"/>
      <Stat icon={TrendingUp} label="المواد الدراسية" value={subjects.length} detail="مواد في خطتك" color="green"/>
    </section>
    <div className="section-grid">
      <section className="panel tasks-panel">
        <div className="panel-head"><div><h3>مهام النهارده</h3><p>خليك مركز على الخطوة الجاية</p></div><button className="text-btn" onClick={()=>onNavigate("tasks")}>كل المهام <ChevronLeft size={15}/></button></div>
        {tasks.length ? <div className="task-list">{tasks.slice(0,5).map(task=><TaskRow key={task.id} task={task} onToggle={onToggle}/>)}</div> : <Empty icon={CheckSquare} title="مفيش مهام لليوم" text="أضف أول مهمة وابدأ إنجازك."/>}
      </section>
      <section className="panel focus-panel">
        <div className="panel-head"><div><h3>هدفك اليومي</h3><p>كل إنجاز صغير بيفرق</p></div><div className="mini-icon"><Target size={18}/></div></div>
        <div className="progress-ring" style={{"--progress":`${completion*3.6}deg`}}><div><b>{completion}%</b><small>مكتمل</small></div></div>
        <div className="goal-caption"><b>{completed} مهام مكتملة</b><span>من إجمالي {allTasks.length} مهام</span></div>
        <button className="secondary-btn full" onClick={()=>onNavigate("analytics")}>عرض تقرير التقدم <ChevronLeft size={16}/></button>
      </section>
    </div>
    <section className="panel subjects-panel">
      <div className="panel-head"><div><h3>المواد الدراسية</h3><p>تابع تقدمك في كل مادة</p></div><button className="text-btn" onClick={()=>onNavigate("subjects")}>عرض الكل <ChevronLeft size={15}/></button></div>
      <div className="subject-progress-grid">{subjects.slice(0,4).map(s=><div className="subject-progress" key={s.id}><div className="subject-title"><span className="subject-dot" style={{background:s.color}}/><b>{s.name}</b><strong>{s.progress}%</strong></div><div className="bar"><i style={{width:`${s.progress}%`,background:s.color}}/></div><small>{s.hours} ساعات مذاكرة مسجلة</small></div>)}</div>
    </section>
  </>;
}

function Stat({icon:Icon,label,value,detail,color}) {
  return <div className="stat-card"><div className={`stat-icon ${color}`}><Icon size={20}/></div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-detail">{detail}</div></div>;
}
function TaskRow({task,onToggle}) {
  return <div className={`task-row ${task.done?"is-done":""}`}><button className={`check-circle ${task.done?"checked":""}`} onClick={()=>onToggle(task.id)} aria-label="تغيير حالة المهمة">{task.done&&<Check size={14}/>}</button><div className="task-main"><b>{task.title}</b><small>{task.subject} <span>•</span> {task.duration} دقيقة</small></div><span className={`priority ${task.priority==="عالية"?"high":task.priority==="متوسطة"?"medium":"low"}`}>{task.priority}</span></div>;
}
function Subjects({subjects,onAdd,onDelete}) {
  return <><div className="page-intro"><div><h2>موادك الدراسية</h2><p>نظّم المواد وتابع مستوى تقدمك في كل واحدة.</p></div><button className="primary-btn" onClick={onAdd}><Plus size={18}/> إضافة مادة</button></div>
    <div className="cards-grid">{subjects.map(s=><article className="subject-card" key={s.id}><div className="subject-card-top"><div className="large-subject-icon" style={{background:`${s.color}20`,color:s.color}}><BookOpen/></div><button className="icon-btn" onClick={()=>onDelete(s.id)} title="حذف المادة"><Trash2 size={17}/></button></div><h3>{s.name}</h3><p>تقدمك في المادة</p><div className="subject-big-progress"><b>{s.progress}%</b><span>{s.hours} ساعات مذاكرة</span></div><div className="bar"><i style={{width:`${s.progress}%`,background:s.color}}/></div></article>)}
      {!subjects.length&&<Empty icon={BookOpen} title="لسه مفيش مواد" text="أضف المواد اللي بتدرسها عشان تبدأ."/>}
    </div>
  </>;
}
function Tasks({tasks,subjects,onToggle,onAdd,onDelete}) {
  const [filter,setFilter]=useState("الكل");
  const visible=tasks.filter(t=>filter==="الكل"||(filter==="مكتملة"?t.done:!t.done));
  return <><div className="page-intro"><div><h2>قائمة المهام</h2><p>كل اللي محتاج تعمله في مكان واحد.</p></div><button className="primary-btn" onClick={onAdd}><Plus size={18}/> إضافة مهمة</button></div>
    <div className="panel"><div className="filter-row"><div className="tabs">{["الكل","قيد التنفيذ","مكتملة"].map(x=><button className={filter===x?"selected":""} onClick={()=>setFilter(x)} key={x}>{x}</button>)}</div><span className="muted">{visible.length} مهمة</span></div>
      {visible.length?<div className="task-list">{visible.map(t=><div className="task-with-delete" key={t.id}><TaskRow task={t} onToggle={onToggle}/><button className="icon-btn delete-btn" onClick={()=>onDelete(t.id)} title="حذف"><Trash2 size={16}/></button></div>)}</div>:<Empty icon={CheckSquare} title="مفيش مهام هنا" text="جرّب تغيير الفلتر أو أضف مهمة جديدة."/>}
    </div>
  </>;
}
function Planner({subjects,hoursPerDay,setHoursPerDay,plan,loading,onGenerate}) {
  return <><div className="page-intro"><div><h2>مخطط المذاكرة الذكي <Sparkles className="inline-spark"/></h2><p>أنشئ توزيعًا مبدئيًا لوقت المذاكرة حسب موادك.</p></div></div>
    <div className="planner-layout"><section className="panel planner-config"><div className="planner-hero"><div className="ai-orb"><Sparkles size={26}/></div><div><h3>خلّي FocusFlow يرتب يومك</h3><p>حدد وقتك المتاح، واحصل على خطة مقترحة قابلة للتعديل.</p></div></div>
      <label className="range-label"><span>عدد ساعات المذاكرة يوميًا</span><b>{hoursPerDay} ساعات</b></label><input className="range" type="range" min="1" max="8" value={hoursPerDay} onChange={e=>setHoursPerDay(Number(e.target.value))}/>
      <div className="range-ends"><span>ساعة واحدة</span><span>8 ساعات</span></div>
      <div className="included-subjects"><b>المواد المشمولة ({subjects.length})</b>{subjects.map(s=><span key={s.id}><i style={{background:s.color}}/>{s.name}</span>)}</div>
      <button className="primary-btn full" onClick={onGenerate} disabled={loading||!subjects.length}>{loading?"جاري تجهيز الخطة...":<><Sparkles size={17}/> أنشئ خطتي</>}</button>
      <small className="disclaimer">الخطة اقتراح تنظيمي وليست بديلاً عن تقديرك لصعوبة كل مادة أو مواعيدك الفعلية.</small>
    </section>
    <section className="panel plan-result"><div className="panel-head"><div><h3>خطتك المقترحة</h3><p>هنا هتظهر جلسات المذاكرة</p></div><div className="mini-icon"><CalendarDays size={18}/></div></div>
      {plan?<><div className="plan-summary"><b>{plan.title}</b><span>{plan.totalHours} ساعات إجمالي</span></div><div className="plan-slots">{plan.slots.map((s,i)=><div className="plan-slot" key={s.id}><div className="slot-number">{i+1}</div><div className="slot-info"><b>{s.subject}</b><small>{s.type} · {s.tip}</small></div><strong>{s.duration} د</strong></div>)}</div><p className="plan-note">{plan.note}</p></>:<Empty icon={Sparkles} title="خطتك لسه مستنياك" text="حدد عدد الساعات واضغط على إنشاء خطتي."/>}
    </section></div>
  </>;
}
function Analytics({tasks,subjects,completion,completed}) {
  const total=tasks.length;
  const minutes=tasks.filter(t=>t.done).reduce((n,t)=>n+Number(t.duration),0);
  return <><div className="page-intro"><div><h2>تحليل الأداء</h2><p>نظرة عامة على تقدمك في المذاكرة والمهام.</p></div></div>
    <div className="stats-grid analytics-stats"><Stat icon={Target} label="نسبة الإنجاز" value={`${completion}%`} detail="من كل المهام المسجلة" color="purple"/><Stat icon={CheckSquare} label="مهام مكتملة" value={completed} detail={`من ${total} مهمة`} color="green"/><Stat icon={Clock3} label="وقت المهام المكتملة" value={`${Math.floor(minutes/60)}س ${minutes%60}د`} detail="وقت مخطط للمهام المنجزة" color="blue"/><Stat icon={BookOpen} label="عدد المواد" value={subjects.length} detail="موادك الدراسية" color="orange"/></div>
    <div className="section-grid"><section className="panel"><div className="panel-head"><div><h3>تقدم المواد</h3><p>نسبة التقدم المسجلة لكل مادة</p></div></div>{subjects.map(s=><div className="analytics-subject" key={s.id}><div><b>{s.name}</b><strong>{s.progress}%</strong></div><div className="bar"><i style={{width:`${s.progress}%`,background:s.color}}/></div></div>)}</section>
    <section className="panel insight-panel"><div className="mini-icon"><TrendingUp size={19}/></div><h3>استمر على نفس الوتيرة</h3><p>{completion>=70?"أداء ممتاز! حافظ على الاستمرارية وراجع النقاط الصعبة.": "ابدأ بمهام صغيرة وواضحة، وحاول إنهاء مهمة واحدة قبل الانتقال للتالية."}</p><div className="insight-tip"><Sparkles size={17}/> نصيحة: جرّب جلسة تركيز لمدة 25 دقيقة ثم خذ استراحة قصيرة.</div></section></div>
  </>;
}
function SettingsPage({dark,setDark,onReset}) {
  return <><div className="page-intro"><div><h2>الإعدادات</h2><p>تحكم في شكل التطبيق وبيانات النسخة التجريبية.</p></div></div>
    <section className="panel settings-panel"><div className="setting-row"><div className="setting-icon"><Moon/></div><div><b>المظهر</b><small>التبديل بين الوضع الداكن والفاتح</small></div><button className={`toggle ${dark?"on":""}`} onClick={()=>setDark(!dark)}><i/></button></div>
    <div className="setting-row"><div className="setting-icon"><CircleHelp/></div><div><b>معلومات النسخة</b><small>FocusFlow Demo · الإصدار 1.0.0</small></div><span className="muted">تجريبية</span></div>
    <div className="setting-row"><div className="setting-icon"><Trash2/></div><div><b>إعادة البيانات التجريبية</b><small>استرجاع المواد والمهام الافتراضية</small></div><button className="danger-outline" onClick={onReset}>إعادة التعيين</button></div></section>
  </>;
}
function Modal({title,onClose,children}) {
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal" onMouseDown={e=>e.stopPropagation()}><div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose}><X/></button></div>{children}</div></div>;
}
function Empty({icon:Icon,title,text}) {
  return <div className="empty"><div><Icon size={24}/></div><b>{title}</b><p>{text}</p></div>;
}
