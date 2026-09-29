import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, Link } from "react-router-dom";
import SwProgressChart from "../components/shared/SwProgressChart";
import {
  LogOut, GraduationCap, Phone, Mail, MapPin, 
  CheckCircle, AlertCircle, Eye, EyeOff, KeyRound,
  ClipboardList, Video, Bell, UserCircle, ChevronDown, ChevronUp,
  Pencil, Camera, X, Calendar as CalendarIcon, Filter, 
  ChevronLeft, ChevronRight, MessageCircle, Send,
  FileText, PlayCircle, Info, Target, BookOpen, PenLine
} from "lucide-react";

const API_BASE = "/api";

function getToken() { return sessionStorage.getItem("rga_portal_token") || ""; }
function getName()  { return sessionStorage.getItem("rga_portal_name")  || ""; }
function getCenter() { return sessionStorage.getItem("rga_portal_center_id") || ""; }

async function apiFetch(path, opts = {}) {
  const headers = { ...(opts.headers || {}), Authorization: `Bearer ${getToken()}` };
  const res = await fetch(`${API_BASE}/${path}`, { ...opts, headers });
  if (res.status === 401) {
    ["rga_portal_token", "rga_portal_name", "rga_portal_role", "rga_portal_center_id"].forEach(k => sessionStorage.removeItem(k));
    window.location.href = "/portal/login";
    throw new Error("Session expired. Please log in again.");
  }
  const text = await res.text();
  let data = {};
  try { data = JSON.parse(text); } catch (_) {
    if (text.trimStart().startsWith("<")) throw new Error("API server not responding. Please try refreshing the page.");
    throw new Error("Invalid server response");
  }
  if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
  return data;
}

const STATUS_COLORS = {
  active:    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  inactive:  "bg-amber-500/10 text-amber-400 border-amber-500/20",
  completed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

function Alert({ type, msg }) {
  if (!msg) return null;
  const isSuccess = type === "success";
  const s = isSuccess
    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
    : "bg-rose-500/10 border-rose-500/20 text-rose-400";
  const Icon = isSuccess ? CheckCircle : AlertCircle;
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border text-sm backdrop-blur-sm ${s}`}>
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <span className="leading-relaxed">{msg}</span>
    </div>
  );
}

function formatDate(d) {
  if (!d) return null;
  try { return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }); }
  catch { return d; }
}

function fmtDt(s) {
  if (!s) return "—";
  try { return new Date(s.replace(" ", "T")).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch { return s; }
}

// ── Attendance calendar ───────────────────────────────────────────────────────
function AttendanceCalendar({ reports }) {
  const today = new Date();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const byDate = {};
  for (const r of reports) {
    if (!r.report_date) continue;
    const prev = byDate[r.report_date];
    const cur = r.attendance === "present" ? "present" : r.attendance === "absent" ? "absent" : "session";
    byDate[r.report_date] = prev === "present" ? "present" : (cur === "present" ? "present" : (prev === "absent" ? "absent" : cur));
  }

  const y = month.getFullYear(), m = month.getMonth();
  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthLabel = month.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const CELL_STYLES = {
    present: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold",
    absent:  "bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold",
    session: "bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold",
  };

  return (
    <div className="bg-[#0f1c2e]/80 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl transition-all duration-300">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors focus:outline-none">
        <div className="flex items-center gap-3 text-white">
          <div className="h-8 w-8 rounded-lg bg-secondary/10 flex items-center justify-center border border-secondary/20 text-secondary">
            <CalendarIcon className="h-4 w-4" />
          </div>
          <span className="font-semibold text-sm tracking-wide">Attendance Calendar</span>
          <div className="hidden sm:flex items-center gap-2 ml-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
          </div>
        </div>
        <div className="h-8 w-8 rounded-full flex items-center justify-center bg-white/5 text-white/50">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>
      
      {open && (
        <div className="border-t border-white/5 px-5 py-5 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4 bg-white/5 p-1 rounded-xl border border-white/5">
              <button onClick={() => setMonth(new Date(y, m - 1, 1))} aria-label="Previous month"
                className="h-8 w-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-white/90 text-xs font-semibold min-w-[100px] text-center uppercase tracking-wider">{monthLabel}</span>
              <button onClick={() => setMonth(new Date(y, m + 1, 1))} aria-label="Next month"
                className="h-8 w-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
              <div key={i} className="text-white/30 text-[10px] font-semibold uppercase tracking-wider py-1">{d}</div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {cells.map((d, i) => {
              if (d === null) return <div key={`e${i}`} className="aspect-square" />;
              const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
              const status = byDate[dateStr];
              const isToday = dateStr === todayStr;
              return (
                <div key={dateStr}
                  title={status ? `${dateStr} — ${status === "session" ? "class day" : status}` : dateStr}
                  className={`aspect-square rounded-xl flex items-center justify-center text-xs transition-all duration-200 ${
                    status ? CELL_STYLES[status] : "bg-white/[0.02] text-white/40 border border-transparent hover:border-white/10 hover:bg-white/[0.04]"
                  } ${isToday ? "ring-2 ring-secondary ring-offset-2 ring-offset-[#0f1c2e] font-bold" : ""}`}>
                  {d}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 mt-6 pt-5 border-t border-white/5">
            {[
              { color: "bg-emerald-400", label: "Present" },
              { color: "bg-rose-400", label: "Absent" },
              { color: "bg-blue-400", label: "Class day" },
              { color: "bg-transparent border-2 border-secondary", label: "Today" },
            ].map(({ color, label }) => (
              <span key={label} className="flex items-center gap-2 text-[11px] text-white/50 font-medium uppercase tracking-wider">
                <span className={`h-2.5 w-2.5 rounded-full ${color}`} /> {label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const WHATSAPP_NUMBER = "919686801874";
const HELP_TOPICS = ["Fees / Payment", "Attendance", "Progress / Reports", "Class Timing", "Books / Material", "Other"];

export function StudentDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("reports");
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchErr, setFetchErr] = useState("");

  const [reports, setReports] = useState([]);
  const [videos, setVideos]   = useState([]);
  const [videoDateFilter, setVideoDateFilter] = useState("");
  const [notifs, setNotifs]         = useState([]);
  const [expandedNotifId, setExpandedNotifId] = useState(null);
  const [localReadIds, setLocalReadIds] = useState(new Set());

  // Report filters
  const [reportFrom, setReportFrom] = useState("");
  const [reportTo, setReportTo]     = useState("");
  const [rptVisible, setRptVisible] = useState(15);
  const [showChart, setShowChart]   = useState(false);

  // Help / WhatsApp enquiry
  const [helpTopic, setHelpTopic] = useState(HELP_TOPICS[0]);
  const [helpMessage, setHelpMessage] = useState("");
  const [showFloatingHelp, setShowFloatingHelp] = useState(true);

  // Change password
  const [pwForm, setPwForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState({ type: "", text: "" });

  // Self-edit profile
  const [showEditSection, setShowEditSection] = useState(false);
  const [editForm, setEditForm] = useState({ mobile: "", email: "", address: "", parent_name: "", parent_contact: "", father_name: "", mother_contact: "" });
  const [editPhoto, setEditPhoto] = useState(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editMsg, setEditMsg] = useState({ type: "", text: "" });
  const editPhotoRef = useRef();

  useEffect(() => {
    const role = sessionStorage.getItem("rga_portal_role");
    if (!getToken() || role !== "student") { navigate("/portal/login"); return; }
    loadProfile();
    loadNotifs();
  }, []);

  useEffect(() => { setRptVisible(15); }, [reportFrom, reportTo]);

  useEffect(() => {
    if (tab === "reports") loadReports();
    if (tab === "videos") loadVideos();
    if (tab === "notifications") loadNotifs();
    
    // Hide floating help button when on the help tab
    setShowFloatingHelp(tab !== "help");
  }, [tab]);

  async function loadProfile() {
    setLoading(true); setFetchErr("");
    try { setStudent(await apiFetch("portal_me.php")); }
    catch (err) { setFetchErr(err.message); }
    finally { setLoading(false); }
  }
  async function loadReports() { try { setReports(await apiFetch("portal_reports.php")); } catch (_) { setReports([]); } }
  async function loadVideos()  { try { setVideos(await apiFetch("portal_videos.php")); } catch (_) { setVideos([]); } }
  async function loadNotifs()  {
    try {
      const data = await apiFetch("portal_notifications.php");
      setNotifs(data);
    } catch (_) { setNotifs([]); }
  }

  function handleExpandNotif(id) {
    const opening = expandedNotifId !== id;
    setExpandedNotifId(opening ? id : null);
    if (opening && !localReadIds.has(id)) {
      setLocalReadIds(prev => new Set([...prev, id]));
      apiFetch("portal_notifications.php", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read", id }),
      }).catch(() => {});
    }
  }

  function logout() {
    ["rga_portal_token","rga_portal_role","rga_portal_login_id","rga_portal_name","rga_portal_center_id"]
      .forEach(k => sessionStorage.removeItem(k));
    navigate("/portal/login");
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwMsg({ type: "", text: "" });
    if (!pwForm.current_password || !pwForm.new_password || !pwForm.confirm_password) {
      setPwMsg({ type: "error", text: "All fields are required." }); return;
    }
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwMsg({ type: "error", text: "New passwords do not match." }); return;
    }
    if (pwForm.new_password.length < 6) {
      setPwMsg({ type: "error", text: "New password must be at least 6 characters." }); return;
    }
    setPwLoading(true);
    try {
      await apiFetch("portal_change_password.php", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pwForm),
      });
      setPwMsg({ type: "success", text: "Password updated successfully!" });
      setPwForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err) { setPwMsg({ type: "error", text: err.message }); }
    finally { setPwLoading(false); }
  }

  function openEditSection() {
    if (!student) return;
    setEditForm({
      mobile:         student.mobile         || "",
      email:          student.email          || "",
      address:        student.address        || "",
      parent_name:    student.parent_name    || "",
      parent_contact: student.parent_contact || "",
      father_name:    student.father_name    || "",
      mother_contact: student.mother_contact || "",
    });
    setEditPhoto(null); setEditPhotoPreview(null); setEditMsg({ type: "", text: "" });
    if (editPhotoRef.current) editPhotoRef.current.value = "";
    setShowEditSection(true);
  }

  async function handleSelfUpdate(e) {
    e.preventDefault();
    setEditMsg({ type: "", text: "" });
    setEditLoading(true);
    try {
      const fd = new FormData();
      Object.entries(editForm).forEach(([k, v]) => fd.append(k, v ?? ""));
      if (editPhoto) fd.append("photo", editPhoto);
      const data = await apiFetch("portal_me.php", { method: "POST", body: fd });
      setStudent(data.student);
      setEditMsg({ type: "success", text: "Profile updated successfully!" });
      setEditPhoto(null); setEditPhotoPreview(null);
      if (editPhotoRef.current) editPhotoRef.current.value = "";
      setTimeout(() => setShowEditSection(false), 2000);
    } catch (err) { setEditMsg({ type: "error", text: err.message }); }
    finally { setEditLoading(false); }
  }

  // Filtered reports
  const filteredReports = reports.filter(r => {
    if (reportFrom && r.report_date < reportFrom) return false;
    if (reportTo   && r.report_date > reportTo)   return false;
    return true;
  });

  const attendanceStats = {
    present: filteredReports.filter(r => r.attendance === "present").length,
    absent:  filteredReports.filter(r => r.attendance === "absent").length,
    total: filteredReports.length
  };

  const TABS = [
    { key: "reports",       icon: ClipboardList, label: "Progress" },
    { key: "videos",        icon: Video,         label: "Videos" },
    { key: "notifications", icon: Bell,          label: "Inbox" },
    { key: "profile",       icon: UserCircle,    label: "Profile" },
    { key: "help",          icon: MessageCircle, label: "Help" },
  ];

  const unreadCount = notifs.filter(n => !n.is_read && !localReadIds.has(n.id)).length;

  return (
    <div className="relative min-h-[100dvh] bg-[#050f1d] text-white font-sans selection:bg-secondary/30">
      {/* Decorative Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#1e40af]/10 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#081b30]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/" className="h-14 w-14 flex-shrink-0">
                <img src="/images/rabbi-logo-badge.webp" alt="Logo" className="h-full w-full object-contain drop-shadow-lg" />
              </Link>
              <div className="hidden sm:block">
                <h1 className="font-bold text-white text-base leading-tight tracking-tight">Rabbi Global Academy</h1>
                <p className="text-[10px] text-white/50 uppercase tracking-widest font-semibold mt-0.5">Student Portal</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end mr-2">
                <span className="text-sm font-semibold text-white truncate max-w-[8rem] sm:max-w-none">{getName()}</span>
                <span className="text-[10px] text-secondary uppercase tracking-wider">{student?.level || "Student"}</span>
              </div>
              {student?.photo ? (
                <img src={`/uploads/students/${student.photo}`} alt="Profile" className="h-9 w-9 rounded-full object-cover border border-white/20 hidden sm:block" />
              ) : (
                <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center border border-white/20 hidden sm:block">
                  <UserCircle className="h-5 w-5 text-white/50" />
                </div>
              )}
              <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />
              <button onClick={logout} className="flex items-center justify-center h-9 w-9 rounded-full text-white/50 hover:text-rose-400 hover:bg-rose-500/10 transition-colors" title="Log out">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-1 pb-4">
            {TABS.map(({ key, icon: Icon, label }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 overflow-hidden group ${
                  tab === key ? "bg-white/10 text-white shadow-sm" : "text-white/50 hover:text-white hover:bg-white/5"
                }`}>
                <Icon className={`h-4 w-4 ${tab === key ? "text-secondary" : "text-white/40 group-hover:text-white/70"}`} />
                {label}
                {key === "notifications" && unreadCount > 0 && (
                  <span className={`ml-1.5 flex h-5 min-w-5 items-center justify-center rounded-full text-[10px] font-bold px-1.5 ${
                    tab === key ? "bg-secondary text-[#081b30]" : "bg-rose-500 text-white"
                  }`}>
                    {unreadCount}
                  </span>
                )}
                {tab === key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary rounded-full" />}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="portal-responsive relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 md:pb-12">
        {fetchErr && <div className="mb-6"><Alert type="error" msg={fetchErr} /></div>}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="relative h-12 w-12">
              <div className="absolute inset-0 border-2 border-white/10 rounded-full"></div>
              <div className="absolute inset-0 border-2 border-secondary rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-white/40 text-sm font-medium tracking-widest uppercase">Loading your dashboard</p>
          </div>
        ) : student ? (
          <div className="animate-in fade-in duration-500">
            
            {/* ── REPORTS TAB ── */}
            {tab === "reports" && (
              <div className="space-y-6">
                
                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#0f1c2e]/80 border border-white/5 rounded-2xl p-5 backdrop-blur-sm">
                    <p className="text-white/40 text-[10px] uppercase tracking-wider font-bold mb-1">Total Classes</p>
                    <div className="text-2xl font-light text-white">{attendanceStats.total}</div>
                  </div>
                  <div className="bg-[#0f1c2e]/80 border border-emerald-500/10 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10"><CheckCircle className="h-10 w-10 text-emerald-400" /></div>
                    <p className="text-emerald-400/60 text-[10px] uppercase tracking-wider font-bold mb-1">Present</p>
                    <div className="text-2xl font-light text-emerald-400">{attendanceStats.present}</div>
                  </div>
                  <div className="bg-[#0f1c2e]/80 border border-rose-500/10 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10"><AlertCircle className="h-10 w-10 text-rose-400" /></div>
                    <p className="text-rose-400/60 text-[10px] uppercase tracking-wider font-bold mb-1">Absent</p>
                    <div className="text-2xl font-light text-rose-400">{attendanceStats.absent}</div>
                  </div>
                  <div className="bg-[#0f1c2e]/80 border border-secondary/10 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10"><Target className="h-10 w-10 text-secondary" /></div>
                    <p className="text-secondary/60 text-[10px] uppercase tracking-wider font-bold mb-1">Current Level</p>
                    <div className="text-xl font-medium text-secondary truncate">{student.level || "N/A"}</div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {/* Left Column: Chart & Calendar */}
                  <div className="md:col-span-2 space-y-6">
                    <div className="bg-[#0f1c2e]/80 border border-white/5 rounded-2xl backdrop-blur-sm shadow-xl overflow-hidden">
                      <button onClick={() => setShowChart(v => !v)}
                        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/5 transition-colors">
                        <span className="flex items-center gap-2.5">
                          <span className="h-8 w-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/20">
                            <PenLine className="h-4 w-4" />
                          </span>
                          <span className="font-semibold text-sm text-white">Progress Chart</span>
                        </span>
                        {showChart ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />}
                      </button>
                      {showChart && (
                        <div className="border-t border-white/5 p-1">
                          <SwProgressChart reports={filteredReports} title="Progress Chart" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Right Column: Calendar */}
                  <div className="space-y-6">
                    <AttendanceCalendar reports={reports} />
                  </div>
                </div>

                {/* Reports List */}
                <div className="bg-[#0f1c2e]/80 border border-white/5 rounded-2xl backdrop-blur-sm overflow-hidden">
                  <div className="p-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/20">
                        <ClipboardList className="h-4 w-4" />
                      </div>
                      <h3 className="font-semibold text-white tracking-wide">My Reports</h3>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm bg-white/5 p-1 rounded-xl border border-white/5">
                      <div className="flex items-center pl-3 pr-1 py-1 gap-2">
                        <Filter className="h-3 w-3 text-white/40" />
                        <input type="date" value={reportFrom} onChange={e => setReportFrom(e.target.value)}
                          onClick={e => { try { e.target.showPicker?.(); } catch(_) {} }}
                          className="bg-transparent text-white/70 text-xs focus:outline-none appearance-none cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-50" />
                      </div>
                      <span className="text-white/20">—</span>
                      <div className="flex items-center pr-3 pl-1 py-1">
                        <input type="date" value={reportTo} onChange={e => setReportTo(e.target.value)}
                          onClick={e => { try { e.target.showPicker?.(); } catch(_) {} }}
                          className="bg-transparent text-white/70 text-xs focus:outline-none appearance-none cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-50" />
                      </div>
                      {(reportFrom || reportTo) && (
                        <button onClick={() => { setReportFrom(""); setReportTo(""); }} className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors">
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="divide-y divide-white/5">
                    {filteredReports.length === 0 ? (
                      <div className="py-16 text-center">
                        <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                          <FileText className="h-5 w-5 text-white/20" />
                        </div>
                        <p className="text-white/40 text-sm font-medium">No reports found for this period.</p>
                      </div>
                    ) : (
                      filteredReports.slice(0, rptVisible).map((r) => (
                        <div key={r.id} className="p-5 hover:bg-white/[0.02] transition-colors group">
                          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <span className="font-semibold text-white">{formatDate(r.report_date)}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                                  r.attendance === "present" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                  r.attendance === "absent" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                                  "bg-white/5 text-white/50 border-white/10"
                                }`}>{r.attendance}</span>
                              </div>
                              <p className="text-xs text-white/40 font-medium tracking-wide">
                                Level: <span className="text-white/70">{r.level}</span>
                                {r.stage && <span className="ml-2">Stage: <span className="text-white/70">{r.stage}</span></span>}
                              </p>
                            </div>
                          </div>
                          
                          {r.attendance === "present" && (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {[
                                  { label: "Direct View", val: r.sw_direct_view ?? 0, always: true },
                                  { label: "Indirect View", val: r.sw_indirect_view ?? 0, always: true },
                                  { label: "Right/Left Hand Writing", val: (r.sw_hand_writing ?? r.sw_right_hand_writing) ?? 0, always: true },
                                  { label: "Number Drop", val: r.number_drop ?? 0, always: true },
                                  { label: "Decimal Drop", val: r.decimal_drop ?? 0, always: true },
                                  { label: "Listening", val: r.listening },
                                ].filter(i => i.always || i.val).map(item => (
                                  <div key={item.label} className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
                                    <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1">{item.label}</p>
                                    <p className="text-white font-medium">{item.val}</p>
                                  </div>
                                ))}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="rounded-xl border border-sky-400/20 bg-sky-500/[0.06] px-4 py-3">
                                  <div className="flex items-center gap-1.5 mb-1.5">
                                    <BookOpen className="h-3.5 w-3.5 text-sky-300" />
                                    <p className="text-sky-300 text-[10px] font-bold uppercase tracking-widest">Class Work</p>
                                  </div>
                                  <div className="flex items-center gap-5 text-sm">
                                    <span className="text-white/50 text-xs">Book A <b className="text-white text-base tabular-nums ml-0.5">{r.book_a_page ?? 0}</b></span>
                                    <span className="text-white/50 text-xs">Book B <b className="text-white text-base tabular-nums ml-0.5">{r.book_b_page ?? 0}</b></span>
                                  </div>
                                </div>
                                <div className="rounded-xl border border-amber-400/20 bg-amber-500/[0.06] px-4 py-3">
                                  <div className="flex items-center gap-1.5 mb-1.5">
                                    <BookOpen className="h-3.5 w-3.5 text-amber-300" />
                                    <p className="text-amber-300 text-[10px] font-bold uppercase tracking-widest">Home Work</p>
                                  </div>
                                  <div className="flex items-center gap-5 text-sm">
                                    <span className="text-white/50 text-xs">Book A <b className="text-white text-base tabular-nums ml-0.5">{r.hw_book_a_page ?? 0}</b></span>
                                    <span className="text-white/50 text-xs">Book B <b className="text-white text-base tabular-nums ml-0.5">{r.hw_book_b_page ?? 0}</b></span>
                                  </div>
                                </div>
                              </div>

                              {r.activity && (
                                <div className="rounded-xl bg-secondary/[0.06] border border-secondary/20 px-4 py-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Target className="h-3.5 w-3.5 text-secondary" />
                                    <p className="text-secondary/90 text-[10px] font-semibold uppercase tracking-widest">Activity</p>
                                  </div>
                                  <p className="text-white/75 text-sm leading-relaxed">{r.activity}</p>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {r.teacher_remarks && (
                            <div className="mt-4 bg-secondary/5 border border-secondary/10 rounded-xl p-4 text-sm">
                              <div className="flex items-start gap-2">
                                <Info className="h-4 w-4 text-secondary/60 mt-0.5 flex-shrink-0" />
                                <p className="text-white/80 leading-relaxed"><span className="text-secondary font-medium mr-1">Remarks:</span> {r.teacher_remarks}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  {filteredReports.length > rptVisible && (
                    <div className="flex justify-center py-4 border-t border-white/5">
                      <button onClick={() => setRptVisible(v => v + 15)}
                        className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:border-white/25 text-sm font-semibold transition-all">
                        <ChevronDown className="h-4 w-4" /> Load more ({filteredReports.length - rptVisible} remaining)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── VIDEOS TAB ── */}
            {tab === "videos" && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                    <PlayCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-wide">Class Videos</h2>
                    <p className="text-xs text-white/50 font-medium">Watch your recorded sessions</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-3 text-amber-300/80 text-xs leading-relaxed">
                  <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>Videos shared by your center are available for <b>7 days</b> from the upload date, after which they are automatically deleted. Watch them before they expire!</span>
                </div>

                {videos.length > 0 && (
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-[#0f1c2e]/80 border border-white/10 rounded-xl px-3 py-2">
                      <CalendarIcon className="h-4 w-4 text-white/40" />
                      <span className="text-white/50 text-xs font-semibold uppercase tracking-wider">Uploaded on</span>
                      <input type="date" value={videoDateFilter} onChange={e => setVideoDateFilter(e.target.value)}
                        onClick={e => { try { e.target.showPicker?.(); } catch (_) {} }}
                        className="bg-transparent text-white text-sm focus:outline-none cursor-pointer [color-scheme:dark]" />
                    </div>
                    {videoDateFilter && (
                      <button onClick={() => setVideoDateFilter("")}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-secondary hover:text-secondary/80 transition-colors">
                        <X className="h-3.5 w-3.5" /> Show all
                      </button>
                    )}
                  </div>
                )}

                {(() => {
                  const sorted = [...videos].sort((a, b) => (a.uploaded_at || "") < (b.uploaded_at || "") ? 1 : -1);
                  const shown = videoDateFilter
                    ? sorted.filter(v => (v.uploaded_at || "").slice(0, 10) === videoDateFilter)
                    : sorted;
                  const fmtDT = iso => iso ? new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }) : "—";
                  if (videos.length === 0) return (
                    <div className="bg-[#0f1c2e]/80 border border-white/5 rounded-2xl p-16 text-center backdrop-blur-sm">
                      <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
                        <Video className="h-6 w-6 text-white/20" />
                      </div>
                      <p className="text-white/60 font-medium">No videos available at the moment.</p>
                      <p className="text-white/30 text-sm mt-1">Videos your center shares with you will appear here.</p>
                    </div>
                  );
                  if (shown.length === 0) return (
                    <div className="bg-[#0f1c2e]/80 border border-white/5 rounded-2xl p-10 text-center backdrop-blur-sm">
                      <p className="text-white/50 font-medium">No videos uploaded on this date.</p>
                      <button onClick={() => setVideoDateFilter("")} className="text-secondary text-sm font-semibold mt-2 hover:underline">Show all videos</button>
                    </div>
                  );
                  const dayLabel = iso => {
                    if (!iso) return "Unknown date";
                    const d = new Date(iso);
                    const today = new Date(); today.setHours(0, 0, 0, 0);
                    const that = new Date(d); that.setHours(0, 0, 0, 0);
                    const diff = Math.round((today - that) / 86400000);
                    const full = d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
                    if (diff === 0) return `Today — ${full}`;
                    if (diff === 1) return `Yesterday — ${full}`;
                    return full;
                  };
                  const groups = [];
                  for (const v of shown) {
                    const key = (v.uploaded_at || "").slice(0, 10);
                    const g = groups[groups.length - 1];
                    if (g && g.key === key) g.items.push(v);
                    else groups.push({ key, label: dayLabel(v.uploaded_at), items: [v] });
                  }
                  return (
                    <div className="space-y-10 max-w-3xl">
                      {groups.map(g => (
                        <div key={g.key}>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="h-9 w-9 rounded-xl bg-secondary/10 border border-secondary/25 flex items-center justify-center flex-shrink-0">
                              <CalendarIcon className="h-4 w-4 text-secondary" />
                            </div>
                            <h3 className="text-white font-bold text-lg sm:text-xl tracking-wide">{g.label}</h3>
                            <div className="flex-1 h-px bg-white/10" />
                            <span className="text-white/30 text-xs font-semibold flex-shrink-0">{g.items.length} video{g.items.length > 1 ? "s" : ""}</span>
                          </div>
                          <div className="space-y-6">
                      {g.items.map(v => {
                        const msLeft = v.expires_at ? (new Date(v.expires_at) - Date.now()) : 0;
                        const daysLeft = Math.max(0, Math.floor(msLeft / 86400000));
                        const hoursLeft = Math.max(0, Math.floor((msLeft % 86400000) / 3600000));
                        const expiringSoon = msLeft < 86400000;
                        const leftLabel = msLeft <= 0 ? "Expired" : daysLeft > 0 ? `${daysLeft}d ${hoursLeft}h left` : `${hoursLeft}h left`;
                        return (
                          <div key={v.id} className="bg-[#0f1c2e]/80 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm hover:border-white/10 transition-all duration-300 shadow-lg">
                            <div className="aspect-video relative bg-black">
                              <video controls preload="metadata" playsInline className="w-full h-full" src={v.url}>
                                Your browser does not support video playback.
                              </video>
                            </div>
                            <div className="p-5 space-y-3">
                              <div className="flex items-start justify-between gap-3">
                                <h3 className="font-semibold text-white text-lg leading-snug" title={v.title}>{v.title}</h3>
                                <span className={`flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md border ${expiringSoon ? "bg-rose-500/10 border-rose-500/25 text-rose-300" : "bg-amber-500/10 border-amber-500/25 text-amber-300"}`}>
                                  <AlertCircle className="h-3 w-3" /> {leftLabel}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/40 font-medium">
                                <span className="flex items-center gap-1.5"><CalendarIcon className="h-3 w-3" /> Uploaded at {v.uploaded_at ? new Date(v.uploaded_at).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }) : "—"}</span>
                                <span className="flex items-center gap-1.5"><X className="h-3 w-3" /> Deletes {fmtDT(v.expires_at)}</span>
                              </div>
                              <a href={v.url} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary hover:text-secondary/80 transition-colors">
                                <PlayCircle className="h-3.5 w-3.5" /> Open full screen
                              </a>
                            </div>
                          </div>
                        );
                      })}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ── NOTIFICATIONS TAB ── */}
            {tab === "notifications" && (
              <div className="space-y-6 max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                      <Bell className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white tracking-wide">Inbox</h2>
                      <p className="text-xs text-white/50 font-medium">Messages from the academy</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {notifs.length === 0 ? (
                    <div className="bg-[#0f1c2e]/80 border border-white/5 rounded-2xl p-16 text-center backdrop-blur-sm">
                      <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
                        <Bell className="h-6 w-6 text-white/20" />
                      </div>
                      <p className="text-white/60 font-medium">No messages to show.</p>
                    </div>
                  ) : (
                    notifs.map(n => {
                      const isUnread = !n.is_read && !localReadIds.has(n.id);
                      const isExpanded = expandedNotifId === n.id;
                      return (
                        <div key={n.id} className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                          isUnread ? "bg-[#142338]/90 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]" : "bg-[#0f1c2e]/80 border-white/5 backdrop-blur-sm hover:bg-white/[0.02]"
                        }`}>
                          <button onClick={() => handleExpandNotif(n.id)} className="w-full text-left p-5 flex items-start gap-4 focus:outline-none">
                            <div className="mt-1 flex-shrink-0 relative">
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center border ${
                                isUnread ? "bg-blue-500/20 border-blue-500/30 text-blue-400" : "bg-white/5 border-white/10 text-white/40"
                              }`}>
                                <Mail className="h-4 w-4" />
                              </div>
                              {isUnread && <div className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-rose-500 border-2 border-[#142338]" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                                <h3 className={`font-semibold truncate ${isUnread ? "text-white" : "text-white/80"}`}>{n.title}</h3>
                                <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">{fmtDt(n.created_at)}</span>
                              </div>
                              <p className={`text-sm line-clamp-1 ${isUnread ? "text-white/70" : "text-white/50"}`}>{n.message}</p>
                            </div>
                          </button>
                          {isExpanded && (
                            <div className="px-5 pb-5 pt-0 pl-[4.5rem] animate-in slide-in-from-top-2 duration-200">
                              <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                                <p className="text-white/80 text-sm whitespace-pre-wrap leading-relaxed">{n.message}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* ── PROFILE TAB ── */}
            {tab === "profile" && (
              <div className="max-w-3xl mx-auto space-y-6">
                
                {/* ID Card */}
                <div className="relative overflow-hidden bg-gradient-to-br from-[#0f2342] to-[#08121f] border border-white/10 rounded-3xl p-8 shadow-2xl">
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-[80px] pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-[60px] pointer-events-none" />
                  <div className="absolute top-8 right-8 pointer-events-none hidden sm:block">
                    <div className="h-24 w-24 rounded-full bg-white shadow-lg flex items-center justify-center p-2">
                      <img src="/images/rabbi-logo-transparent.webp" alt="Rabbi Global Academy" className="h-full w-full object-contain" />
                    </div>
                  </div>
                  
                  <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    <div className="relative group">
                      <div className="h-28 w-28 rounded-full overflow-hidden border-4 border-[#0f2342] shadow-[0_0_0_2px_rgba(201,162,75,0.4)]">
                        {student.photo ? (
                          <img src={`/uploads/students/${student.photo}`} alt={student.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full bg-[#142338] flex items-center justify-center">
                            <UserCircle className="h-12 w-12 text-white/30" />
                          </div>
                        )}
                      </div>
                      <button onClick={openEditSection} className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-secondary text-[#0f2342] flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
                        <Camera className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="flex-1 text-center sm:text-left mt-2 sm:mt-0">
                      <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-2">{student.name}</h2>
                      <p className="text-white/60 mb-4 tracking-wide">
                        <span className="text-white/40 text-xs font-semibold uppercase tracking-wider mr-2">Student ID:</span>
                        <span className="font-mono text-white/70 text-sm">{student.enrollment_no}</span>
                      </p>
                      
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${STATUS_COLORS[student.status] || ""}`}>{student.status}</span>
                        <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-white/70 text-xs font-semibold tracking-wide">Level: {student.level}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Contact Details */}
                  <div className="bg-[#0f1c2e]/80 border border-white/5 rounded-3xl p-6 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-semibold text-white tracking-wide flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-secondary" /> Contact Info
                      </h3>
                      <button onClick={openEditSection} className="text-xs font-semibold text-white/40 hover:text-white flex items-center gap-1.5 transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg">
                        <Pencil className="h-3 w-3" /> Edit
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {[
                        { icon: Phone, label: "Phone", val: student.mobile },
                        { icon: Mail, label: "Email", val: student.email },
                        { icon: MapPin, label: "Address", val: student.address },
                        { icon: UserCircle, label: "Father's Name", val: student.father_name },
                        { icon: UserCircle, label: "Mother's Name", val: student.mother_contact },
                        { icon: UserCircle, label: "Guardian", val: student.parent_name },
                        { icon: Phone, label: "Guardian Phone", val: student.parent_contact },
                      ].map((item, i) => item.val && (
                        <div key={i} className="flex items-start gap-4">
                          <div className="mt-1 bg-white/5 p-2 rounded-lg text-white/40"><item.icon className="h-4 w-4" /></div>
                          <div>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest font-semibold mb-0.5">{item.label}</p>
                            <p className="text-white/90 text-sm font-medium leading-relaxed">{item.val}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Password Change */}
                  <div className="bg-[#0f1c2e]/80 border border-white/5 rounded-3xl p-6 backdrop-blur-sm h-fit">
                    <h3 className="font-semibold text-white tracking-wide flex items-center gap-2 mb-6">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-400" /> Security
                    </h3>
                    
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      {pwMsg.text && <Alert type={pwMsg.type} msg={pwMsg.text} />}
                      
                      {[
                        { key: "current_password", label: "Current Password" },
                        { key: "new_password", label: "New Password" },
                        { key: "confirm_password", label: "Confirm Password" }
                      ].map((field) => (
                        <div key={field.key}>
                          <label className="block text-[10px] text-white/50 uppercase tracking-widest font-semibold mb-1.5">{field.label}</label>
                          <div className="relative">
                            <input type={showPw[field.key] ? "text" : "password"} 
                              value={pwForm[field.key]} 
                              onChange={e => setPwForm(p => ({...p, [field.key]: e.target.value}))}
                              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-secondary/50 transition-colors pr-10" />
                            <button type="button" onClick={() => setShowPw(p => ({...p, [field.key]: !p[field.key]}))} 
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70">
                              {showPw[field.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      <button type="submit" disabled={pwLoading} className="w-full mt-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                        {pwLoading ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <KeyRound className="h-4 w-4" />}
                        {pwLoading ? "Updating..." : "Update Password"}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Edit Modal */}
                {showEditSection && createPortal(
                  <div className="fixed inset-0 z-[100] flex items-stretch sm:items-center justify-center sm:p-4 bg-[#050f1d]/90 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowEditSection(false)}>
                    <div className="bg-[#0f1c2e] sm:border sm:border-white/10 sm:rounded-3xl w-full sm:max-w-lg overflow-hidden shadow-2xl h-full sm:h-auto sm:max-h-[85dvh] flex flex-col" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-white/10 flex-shrink-0 bg-[#0f1c2e]">
                        <h3 className="font-bold text-white text-base sm:text-lg tracking-wide">Edit Profile</h3>
                        <button type="button" onClick={() => setShowEditSection(false)} aria-label="Close"
                          className="h-10 w-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-rose-500/20 hover:border-rose-400/40 hover:text-rose-400 transition-colors flex-shrink-0">
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                      
                      <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                        {editMsg.text && <div className="mb-6"><Alert type={editMsg.type} msg={editMsg.text} /></div>}
                        
                        <form id="editForm" onSubmit={handleSelfUpdate} className="space-y-5">
                          <div className="flex flex-col items-center justify-center mb-6">
                            <div className="relative group cursor-pointer mb-3">
                              <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-white/10 bg-black/30">
                                <img src={editPhotoPreview || (student.photo ? `/uploads/students/${student.photo}` : "")} alt="" className="h-full w-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Camera className="h-6 w-6 text-white" />
                                </div>
                              </div>
                              <input ref={editPhotoRef} type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" 
                                onChange={e => {
                                  const file = e.target.files[0];
                                  if (!file) return;
                                  setEditPhoto(file);
                                  const r = new FileReader();
                                  r.onload = e => setEditPhotoPreview(e.target.result);
                                  r.readAsDataURL(file);
                                }} />
                            </div>
                            <p className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">Profile Photo</p>
                          </div>

                          <div className="grid sm:grid-cols-2 gap-4">
                            {[
                              { label: "Mobile Number", key: "mobile", type: "tel" },
                              { label: "Email Address", key: "email", type: "email" },
                              { label: "Father's Name", key: "father_name", type: "text" },
                              { label: "Mother's Name", key: "mother_contact", type: "text" },
                              { label: "Guardian Name", key: "parent_name", type: "text" },
                              { label: "Guardian Phone", key: "parent_contact", type: "tel" },
                            ].map((f) => (
                              <div key={f.key}>
                                <label className="block text-[10px] text-white/50 uppercase tracking-widest font-semibold mb-1.5">{f.label}</label>
                                <input type={f.type} value={editForm[f.key]} onChange={e => setEditForm(p => ({...p, [f.key]: e.target.value}))}
                                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-secondary/50 transition-colors" />
                              </div>
                            ))}
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] text-white/50 uppercase tracking-widest font-semibold mb-1.5">Home Address</label>
                              <textarea rows={2} value={editForm.address} onChange={e => setEditForm(p => ({...p, address: e.target.value}))}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-secondary/50 transition-colors resize-none" />
                            </div>
                          </div>
                        </form>
                      </div>
                      
                      <div className="p-4 sm:p-6 border-t border-white/10 bg-[#0c1727] flex-shrink-0" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
                        <button form="editForm" type="submit" disabled={editLoading} className="w-full bg-secondary text-[#0f2342] font-bold py-3 rounded-xl transition-transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-secondary/20 disabled:opacity-70 disabled:hover:scale-100">
                          {editLoading ? <span className="h-5 w-5 border-2 border-[#0f2342]/30 border-t-[#0f2342] rounded-full animate-spin" /> : "Save Changes"}
                        </button>
                      </div>
                    </div>
                  </div>,
                  document.body
                )}
              </div>
            )}

            {/* ── HELP TAB ── */}
            {tab === "help" && (
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-[#0f1c2e]/80 border border-white/5 rounded-3xl p-8 backdrop-blur-sm text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />
                  
                  <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mx-auto mb-6 border border-emerald-500/20">
                    <MessageCircle className="h-8 w-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Need Assistance?</h2>
                  <p className="text-white/60 mb-8 max-w-sm mx-auto">Send a direct message to our support team via WhatsApp. We usually reply within a few hours.</p>

                  <div className="bg-black/20 rounded-2xl p-6 border border-white/5 text-left max-w-md mx-auto relative z-10">
                    <label className="block text-[10px] text-white/50 uppercase tracking-widest font-semibold mb-3 text-center">Select Topic</label>
                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                      {HELP_TOPICS.map(t => (
                        <button key={t} onClick={() => setHelpTopic(t)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            helpTopic === t ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" : "bg-white/5 text-white/60 hover:bg-white/10"
                          }`}>
                          {t}
                        </button>
                      ))}
                    </div>
                    
                    <label className="block text-[10px] text-white/50 uppercase tracking-widest font-semibold mb-2">Your Message</label>
                    <textarea 
                      value={helpMessage} 
                      onChange={e => setHelpMessage(e.target.value)}
                      placeholder="How can we help you?"
                      rows={4}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none mb-4"
                    />
                    
                    <a 
                      href={helpMessage.trim() ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi Rabbi Global Academy,\n\nI need help regarding *${helpTopic}*.\n\n*Student:* ${student.name}\n*Enrollment No:* ${student.enrollment_no}\n*Center ID:* ${getCenter() || "N/A"}\n\n*Message:*\n${helpMessage}`)}` : "#"}
                      target="_blank" rel="noopener noreferrer"
                      className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                        helpMessage.trim() ? "bg-emerald-500 text-white hover:bg-emerald-400 shadow-lg shadow-emerald-500/20" : "bg-white/5 text-white/30 cursor-not-allowed"
                      }`}
                      onClick={e => !helpMessage.trim() && e.preventDefault()}
                    >
                      <Send className="h-4 w-4" /> Send on WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </main>

      {/* Floating Action Button for Help (visible when not on help tab) */}
      {showFloatingHelp && student && (
        <button
          onClick={() => setTab("help")}
          className="fixed bottom-24 md:bottom-8 right-4 md:right-8 rounded-full bg-emerald-500 text-white flex items-center gap-2 px-5 py-3.5 shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all z-50 group"
          aria-label="Need Help?"
        >
          <MessageCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-bold whitespace-nowrap">Need Help?</span>
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-rose-500 rounded-full border-2 border-[#050f1d] animate-pulse" />
        </button>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#081b30]/90 backdrop-blur-xl border-t border-white/10 z-50 pb-safe">
        <div className="flex items-center justify-around px-1 py-2">
          {TABS.map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex flex-col items-center justify-center min-w-0 flex-1 py-1 gap-1 relative ${
                tab === key ? "text-secondary" : "text-white/40"
              }`}>
              <div className="relative">
                <Icon className={`h-5 w-5 ${tab === key ? "fill-secondary/10" : ""}`} />
                {key === "notifications" && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 h-3.5 w-3.5 flex items-center justify-center rounded-full bg-rose-500 border-2 border-[#081b30] text-[8px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <span className={`text-[9px] leading-tight text-center font-semibold tracking-wide ${tab === key ? "opacity-100" : "opacity-70"}`}>{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Helper class for safe area padding on mobile */}
      <style dangerouslySetInnerHTML={{__html: `
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 12px); }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}} />
    </div>
  );
}
