import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import {
  Users, ClipboardList, Video, Bell, Send, KeyRound, RefreshCw, Calendar,
  Search, AlertCircle, CheckCircle, ChevronLeft, Building2, Plus,
  X, Pencil, Trash2, Upload, Eye, EyeOff, Activity, UserPlus, UserMinus,
  UserCog, LogIn, Lock, FileText, Film, MessageSquare, ChevronDown,
  ChevronUp, Filter, LayoutGrid, Download, AlertTriangle, GraduationCap,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip,
  Legend, ResponsiveContainer,
} from "recharts";
import { StudentMultiSelect } from "../components/portal/StudentMultiSelect.jsx";
import { StudentTemplate } from "../components/portal/StudentTemplate.jsx";
import { StudentLevelsManager } from "../components/portal/StudentLevelsManager.jsx";
import { useStudentLevels } from "../hooks/useStudentLevels.js";
import { BulkReportTable } from "../components/portal/BulkReportTable.jsx";
import { WhatsAppModal } from "../components/portal/WhatsAppModal.jsx";
import { StudentHistoryModal } from "../components/portal/StudentHistoryModal.jsx";
import { EventRegTable, EventRegFullscreen, FullscreenButton } from "../components/portal/EventRegDetails.jsx";
import { VideoLibrary } from "../components/portal/VideoLibrary.jsx";

const API_BASE = "/api";
const pw = () => sessionStorage.getItem("rga_admin") || "";

async function adminFetch(path, opts = {}) {
  const headers = { ...(opts.headers || {}), "X-Admin-Password": pw() };
  const res = await fetch(`${API_BASE}/${path}`, { ...opts, headers });
  const text = await res.text();
  let data = {};
  try { data = JSON.parse(text); } catch (_) {
    if (text.trimStart().startsWith("<")) throw new Error("API server not responding — please try refreshing the page.");
    throw new Error("Invalid server response");
  }
  if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
  return data;
}

function Alert({ type, msg }) {
  if (!msg) return null;
  const s = type === "success"
    ? "bg-green-500/10 border-green-400/40 text-green-300"
    : "bg-red-500/10 border-red-400/40 text-red-300";
  const Icon = type === "success" ? CheckCircle : AlertCircle;
  return (
    <div className={`flex items-start gap-2 p-3 rounded-xl border text-sm ${s}`}>
      <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <span>{msg}</span>
    </div>
  );
}

function PwCell({ value, onSet }) {
  const [show, setShow] = useState(false);
  if (!value) return (
    <button type="button" onClick={onSet}
      className="inline-flex items-center gap-1 text-[11px] font-medium text-secondary/70 hover:text-secondary transition-colors"
      title="This account's password was created before password viewing was added, so it can't be shown. Set a new one to make it viewable.">
      <KeyRound className="h-3 w-3" /> Set to view
    </button>
  );
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="font-mono text-xs text-white/70">{show ? value : "••••••"}</span>
      <button type="button" onClick={() => setShow(v => !v)}
        className="text-white/40 hover:text-secondary transition-colors" title={show ? "Hide password" : "Show password"}>
        {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
    </span>
  );
}

function PwInput({ value, onChange, placeholder = "Password", autoFocus }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full bg-white/5 border border-white/15 rounded-xl pl-3 pr-10 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-secondary/60 transition-colors"
      />
      <button type="button" onClick={() => setShow(v => !v)} tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-secondary transition-colors"
        title={show ? "Hide password" : "Show password"}>
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function StudentDetailModal({ student, onClose }) {
  if (!student) return null;
  const s = student;
  const rows = [
    ["Student ID", s.enrollment_no, true],
    ["Registration No.", s.reg_no, true],
    ["Name", s.name],
    ["Father's Name", s.father_name],
    ["Mother's Name", s.mother_contact],
    ["Date of Birth", s.dob],
    ["Gender", s.gender],
    ["Blood Group", s.blood_group],
    ["Level", s.level],
    ["Status", s.status],
    ["Mobile", s.mobile],
    ["Guardian Name", s.parent_name],
    ["Guardian Phone Number", s.parent_contact],
    ["Email", s.email],
    ["Anniversary", s.anniversary],
    ["Center", s.center_name || s.center_id],
    ["Joined", fmtDt(s.join_date || s.created_at)],
  ];
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75" onClick={onClose}>
      <div className="bg-gray-900 border border-white/15 rounded-2xl max-w-lg w-full min-w-0 max-h-[calc(100dvh-1.5rem)] sm:max-h-[85dvh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-gray-900 border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {s.photo ? (
              <img src={s.photo} alt={s.name} className="h-11 w-11 rounded-full object-cover border border-white/15" />
            ) : (
              <div className="h-11 w-11 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary font-bold">
                {(s.name || "?").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-white font-bold break-words">{s.name}</h3>
              <p className="text-white/40 text-xs font-mono break-all">{s.enrollment_no}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          {rows.map(([label, value, mono]) => (
            <div key={label}>
              <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-0.5">{label}</p>
              <p className={`text-sm ${value ? "text-white" : "text-white/25"}${mono ? " font-mono text-secondary" : ""}`}>{value || "—"}</p>
            </div>
          ))}
          <div className="sm:col-span-2">
            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-0.5">Address</p>
            <p className={`text-sm ${s.address ? "text-white" : "text-white/25"}`}>{s.address || "—"}</p>
          </div>
          {s.notes && (
            <div className="sm:col-span-2">
              <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-0.5">Notes</p>
              <p className="text-sm text-white whitespace-pre-wrap">{s.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function ResetPasswordModal({ target, value, onChange, saving, msg, onConfirm, onCancel }) {
  if (!target) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
      <div className="bg-gray-900 border border-white/15 rounded-2xl p-4 sm:p-6 max-w-sm w-full max-h-[calc(100dvh-2rem)] overflow-y-auto space-y-5 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
            <KeyRound className="h-6 w-6 text-secondary" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Reset Password</h3>
            <p className="text-white/50 text-sm">{target.name} · <span className="font-mono text-xs">{target.login_id}</span></p>
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest">New Password</label>
          <PwInput value={value} onChange={e => onChange(e.target.value)} placeholder="Min. 6 characters" autoFocus />
          {msg && (
            <p className="text-red-300 text-xs flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />{msg}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/15 text-white/70 hover:text-white hover:border-white/30 transition-colors text-sm font-medium disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={saving || !value}
            className="flex-1 px-4 py-2.5 rounded-xl bg-secondary text-primary font-bold text-sm hover:bg-secondary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <span className="h-4 w-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" /> : <KeyRound className="h-4 w-4" />}
            {saving ? "Saving…" : "Set Password"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ConfirmDeleteModal({ target, loading, onConfirm, onCancel }) {
  if (!target) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
      <div className="bg-gray-900 border border-red-500/30 rounded-2xl p-4 sm:p-6 max-w-sm w-full max-h-[calc(100dvh-2rem)] overflow-y-auto space-y-5 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0">
            <Trash2 className="h-6 w-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">{target.title}</h3>
            <p className="text-white/50 text-sm">{target.subtitle}</p>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 space-y-1.5">
          {target.rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between text-sm">
              <span className="text-white/40">{label}</span>
              <span className="text-white font-medium">{value}</span>
            </div>
          ))}
        </div>
        <p className="flex items-center gap-2 text-red-300/80 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          This action is permanent and cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/15 text-white/70 hover:text-white hover:border-white/30 transition-colors text-sm font-medium disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/20 border border-red-400/40 text-red-300 hover:bg-red-500/30 transition-all text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? <span className="h-4 w-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1.5">
        {label}{required && <span className="text-secondary"> *</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-secondary/60 transition-colors";
const selectCls = inputCls;
const SW_OPTS = Array.from({ length: 201 }, (_, i) => parseFloat((i * 0.1).toFixed(1)));
const PAGE_OPTS = Array.from({ length: 100 }, (_, i) => i + 1);

const AUDIT_ACTION_CONFIG = {
  login:                   { icon: LogIn,         color: "text-green-400",  bg: "bg-green-400/10",  badge: "bg-green-400/10 border-green-400/30 text-green-300",     label: "Login",              phrase: "logged in" },
  password_changed:        { icon: Lock,          color: "text-yellow-400", bg: "bg-yellow-400/10", badge: "bg-yellow-400/10 border-yellow-400/30 text-yellow-300",   label: "Password Changed",   phrase: "changed the password" },
  center_created:          { icon: Building2,     color: "text-blue-400",   bg: "bg-blue-400/10",   badge: "bg-blue-400/10 border-blue-400/30 text-blue-300",         label: "Center Created",     phrase: "created a center" },
  center_deleted:          { icon: Building2,     color: "text-red-400",    bg: "bg-red-400/10",    badge: "bg-red-400/10 border-red-400/30 text-red-300",           label: "Center Deleted",     phrase: "deleted a center" },
  center_pw_reset:         { icon: KeyRound,      color: "text-orange-400", bg: "bg-orange-400/10", badge: "bg-orange-400/10 border-orange-400/30 text-orange-300",   label: "Center PW Reset",    phrase: "reset a center password" },
  student_created:         { icon: UserPlus,      color: "text-emerald-400",bg: "bg-emerald-400/10",badge: "bg-emerald-400/10 border-emerald-400/30 text-emerald-300", label: "Student Added",      phrase: "added a student" },
  student_updated:         { icon: UserCog,       color: "text-sky-400",    bg: "bg-sky-400/10",    badge: "bg-sky-400/10 border-sky-400/30 text-sky-300",           label: "Student Updated",    phrase: "updated a student" },
  student_deleted:         { icon: UserMinus,     color: "text-red-400",    bg: "bg-red-400/10",    badge: "bg-red-400/10 border-red-400/30 text-red-300",           label: "Student Deleted",    phrase: "deleted a student" },
  student_profile_updated: { icon: UserCog,       color: "text-teal-400",   bg: "bg-teal-400/10",   badge: "bg-teal-400/10 border-teal-400/30 text-teal-300",         label: "Self-Edit",          phrase: "edited their profile" },
  bulk_upload:             { icon: Upload,        color: "text-violet-400", bg: "bg-violet-400/10", badge: "bg-violet-400/10 border-violet-400/30 text-violet-300",   label: "Bulk Upload",        phrase: "bulk-uploaded students" },
  report_created:          { icon: FileText,      color: "text-cyan-400",   bg: "bg-cyan-400/10",   badge: "bg-cyan-400/10 border-cyan-400/30 text-cyan-300",         label: "Report Created",     phrase: "created a report" },
  report_submitted:        { icon: FileText,      color: "text-cyan-400",   bg: "bg-cyan-400/10",   badge: "bg-cyan-400/10 border-cyan-400/30 text-cyan-300",         label: "Report Submitted",   phrase: "submitted a report" },
  report_updated:          { icon: FileText,      color: "text-cyan-300",   bg: "bg-cyan-300/10",   badge: "bg-cyan-300/10 border-cyan-300/30 text-cyan-200",         label: "Report Updated",     phrase: "edited report details" },
  report_deleted:          { icon: FileText,      color: "text-red-400",    bg: "bg-red-400/10",    badge: "bg-red-400/10 border-red-400/30 text-red-300",           label: "Report Deleted",     phrase: "deleted a report" },
  video_uploaded:          { icon: Film,          color: "text-pink-400",   bg: "bg-pink-400/10",   badge: "bg-pink-400/10 border-pink-400/30 text-pink-300",         label: "Video Uploaded",     phrase: "uploaded a video" },
  video_deleted:           { icon: Film,          color: "text-red-400",    bg: "bg-red-400/10",    badge: "bg-red-400/10 border-red-400/30 text-red-300",           label: "Video Deleted",      phrase: "deleted a video" },
  notification_sent:       { icon: MessageSquare, color: "text-amber-400",  bg: "bg-amber-400/10",  badge: "bg-amber-400/10 border-amber-400/30 text-amber-300",     label: "Notification Sent",  phrase: "sent a notification" },
};

function fmtDt(s) {
  if (!s) return "—";
  try { return new Date(s.replace(" ", "T")).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch { return s; }
}

// Build a plain "who did what" label for an audit event.
function auditActor(log) {
  const id = log.actor_id || log.actor_name || "";
  if (log.actor_role === "admin")     return "#admin";
  if (log.actor_role === "student")   return `student #${id}`;
  if (log.actor_role === "franchise") return `center #${id}`;
  return `#${id}`;
}

function auditPredicate(log) {
  const t = (log.target || "").trim();
  const withT = (verb, prep) => (t ? `${verb}${prep ? " " + prep : ""} ${t}` : verb);
  switch (log.action) {
    case "login":                   return "logged in";
    case "password_changed":        return "changed the password";
    case "center_created":          return withT("created a center");
    case "center_deleted":          return withT("deleted the center");
    case "center_pw_reset":         return withT("reset the center password", "of");
    case "student_created":         return withT("added a student");
    case "student_updated":         return withT("updated the student");
    case "student_deleted":         return withT("deleted the student");
    case "student_profile_updated": return "edited their profile";
    case "bulk_upload":             return "bulk-uploaded students";
    case "report_created":          return withT("created a report for");
    case "report_submitted":        return withT("submitted a report for");
    case "report_updated":          return withT("edited a report for");
    case "report_deleted":          return withT("deleted a report for");
    case "video_uploaded":          return withT("uploaded a video for");
    case "video_deleted":           return withT("deleted a video");
    case "notification_sent":       return withT("sent a notification to");
    default: {
      const cfg = AUDIT_ACTION_CONFIG[log.action];
      return withT(cfg?.phrase || (log.action || "").replace(/_/g, " "));
    }
  }
}

const BLOOD_GROUPS = ["A+","A-","B+","B-","O+","O-","AB+","AB-"];
const GENDERS = ["Male","Female","Other"];

const BLANK_STUDENT = {
  name: "", father_name: "", mother_contact: "", dob: "", mobile: "",
  anniversary: "", email: "", address: "", blood_group: "", gender: "",
  level: "", reg_no: "", parent_name: "", parent_contact: "", notes: "", status: "active",
  password: "",
};

const todayStr = () => new Date().toISOString().slice(0, 10);
const BLANK_REPORT = {
  enrollment_no: "", report_date: todayStr(), attendance: "present",
  sw_direct_view: 0, sw_indirect_view: 0, sw_hand_writing: 0,
  number_drop: 0, decimal_drop: 0,
  book_a_page: 0, book_b_page: 0, hw_book_a_page: 0, hw_book_b_page: 0, activity: "",
};

export default function AdminStudentPortal() {
  const { levels, levelsError, levelsLoading, reloadLevels } = useStudentLevels(() => ({ "X-Admin-Password": pw() }));
  const LEVELS = levels.map(level => level.name);
  // Sub-tab — synced to the URL so the browser back button works
  const [searchParams, setSearchParams] = useSearchParams();
  const VALID_SUBS = ["overview", "centers", "students", "reports", "videos", "notifications", "audit"];
  const rawSub = searchParams.get("ptab");
  const sub = VALID_SUBS.includes(rawSub) ? rawSub : "overview";
  const setSub = (val) => setSearchParams(prev => {
    const p = new URLSearchParams(prev);
    p.set("ptab", val);
    return p;
  });
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewErr, setOverviewErr] = useState("");
  const [historyStudent, setHistoryStudent] = useState(null);
  const [inactive, setInactive] = useState([]);
  const [inactiveDays, setInactiveDays] = useState(14);
  const [trends, setTrends] = useState(null);
  const [exporting, setExporting] = useState("");
  const [centers, setCenters] = useState([]);

  // ── Centers ──────────────────────────────────────────────────────────────
  const [centerForm, setCenterForm] = useState({ name: "", password: "", email: "", whatsapp: "" });
  const [centerPhoto, setCenterPhoto] = useState(null);
  const [centerSaving, setCenterSaving] = useState(false);
  const [centerMsg, setCenterMsg] = useState({ type: "", text: "" });
  const [editingCenter, setEditingCenter] = useState(null);
  const [editCenterForm, setEditCenterForm] = useState({ name: "", email: "", whatsapp: "" });
  const [editCenterSaving, setEditCenterSaving] = useState(false);
  const [editCenterMsg, setEditCenterMsg] = useState({ type: "", text: "" });
  const [deletingCenterId, setDeletingCenterId] = useState(null);
  const [deletingReportId, setDeletingReportId] = useState(null);
  const [loadingCenters, setLoadingCenters] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── Audit ──────────────────────────────────────────────────────────────────
  const [auditLogs, setAuditLogs]     = useState([]);
  const [auditTotal, setAuditTotal]   = useState(0);
  const [auditPage, setAuditPage]     = useState(1);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditAction, setAuditAction] = useState("");
  const [auditRole, setAuditRole]     = useState("");
  const [auditSearch, setAuditSearch] = useState("");
  const [auditFrom, setAuditFrom]     = useState("");
  const [auditTo, setAuditTo]         = useState("");

  // ── Students ──────────────────────────────────────────────────────────────
  const [students, setStudents] = useState([]);
  const [loadingS, setLoadingS] = useState(false);
  const [loadingMoreS, setLoadingMoreS] = useState(false);
  const [studPage, setStudPage] = useState(1);
  const [studTotal, setStudTotal] = useState(0);
  const [studHasMore, setStudHasMore] = useState(false);
  const [errS, setErrS] = useState("");
  const [search, setSearch] = useState("");
  const [centerFilter, setCenterFilter] = useState("");
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkMsg, setBulkMsg] = useState({ type: "", text: "" });
  const [bulkResult, setBulkResult] = useState(null);
  const bulkFileRef = useRef(null);
  const [studentForm, setStudentForm] = useState({ ...BLANK_STUDENT, center_id: "" });
  const [editEnroll, setEditEnroll] = useState("");
  const [studentSaving, setStudentSaving] = useState(false);
  const [studentMsg, setStudentMsg] = useState({ type: "", text: "" });
  const [deletingStudEnroll, setDeletingStudEnroll] = useState("");
  const [viewStudent, setViewStudent] = useState(null);
  const [promoteStudent, setPromoteStudent] = useState(null);
  const [promoteLevel, setPromoteLevel] = useState("");
  const [promoteSaving, setPromoteSaving] = useState(false);
  const [promoteErr, setPromoteErr] = useState("");

  async function handlePromote() {
    if (!promoteStudent || !promoteLevel) return;
    setPromoteSaving(true); setPromoteErr("");
    try {
      await adminFetch("portal_students.php", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollment_no: promoteStudent.enrollment_no,
          center_id: promoteStudent.center_id,
          level: promoteLevel,
        }),
      });
      setStudents(prev => prev.map(s =>
        s.enrollment_no === promoteStudent.enrollment_no ? { ...s, level: promoteLevel } : s));
      setPromoteStudent(null);
    } catch (err) { setPromoteErr(err.message); }
    finally { setPromoteSaving(false); }
  }
  const photoRef = useRef();

  // ── Reset Password Modal ───────────────────────────────────────────────────
  const [resetPwTarget, setResetPwTarget]   = useState(null);
  const [resetPwValue,  setResetPwValue]    = useState("");
  const [resetPwSaving, setResetPwSaving]   = useState(false);
  const [resetPwMsg,    setResetPwMsg]      = useState("");

  // ── WhatsApp Parent Message Modal ─────────────────────────────────────────
  const [waStudent, setWaStudent] = useState(null);

  function openWaModal(s) {
    setWaStudent(s);
  }

  function handleDeleteStudent(enrollment_no, name, center_id) {
    setDeleteTarget({
      type: "student",
      title: "Delete Student",
      subtitle: "Permanently remove this student and all their data.",
      rows: [["Name", name], ["Student ID", enrollment_no], ["Center", center_id || "—"]],
      enrollment_no,
    });
  }

  async function executeDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.type === "report") {
      const { report_id } = deleteTarget;
      setDeletingReportId(report_id);
      try {
        await adminFetch("portal_reports.php", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: report_id }),
        });
        setAllReports(prev => prev.filter(r => r.id !== report_id));
        if (viewReportId === report_id) setViewReportId(null);
        setDeleteTarget(null);
      } catch (err) { setReportMsg({ type: "error", text: "Delete failed: " + err.message }); setDeleteTarget(null); }
      finally { setDeletingReportId(null); }
      return;
    }
    if (deleteTarget.type === "video") {
      const { video_id } = deleteTarget;
      try {
        await adminFetch("portal_videos.php", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: video_id }),
        });
        setVideos(prev => prev.filter(v => v.id !== video_id));
        setDeleteTarget(null);
      } catch (err) { setVidMsg({ type: "error", text: "Delete failed: " + err.message }); setDeleteTarget(null); }
      return;
    }
    if (deleteTarget.type === "eventreg") {
      const { reg_id } = deleteTarget;
      try {
        await adminFetch("portal_event_regs.php", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: reg_id }),
        });
        setEvRegs(prev => prev.filter(r => r.id !== reg_id));
        setDeleteTarget(null);
      } catch (err) { setEvMsg({ type: "error", text: "Delete failed: " + err.message }); setDeleteTarget(null); }
      return;
    }
    if (deleteTarget.type === "student") {
      const { enrollment_no } = deleteTarget;
      setDeletingStudEnroll(enrollment_no);
      try {
        await adminFetch("portal_students.php", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enrollment_no }),
        });
        setStudents(prev => prev.filter(s => s.enrollment_no !== enrollment_no));
        setDeleteTarget(null);
      } catch (err) { setErrS("Delete failed: " + err.message); setDeleteTarget(null); }
      finally { setDeletingStudEnroll(""); }
    } else if (deleteTarget.type === "center") {
      const { center_id } = deleteTarget;
      setDeletingCenterId(center_id);
      try {
        await adminFetch("portal_admin.php", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ center_id }),
        });
        loadCenters();
        setDeleteTarget(null);
      } catch (err) { setCenterMsg({ type: "error", text: "Delete failed: " + err.message }); setDeleteTarget(null); }
      finally { setDeletingCenterId(null); }
    }
  }

  // ── Reports ───────────────────────────────────────────────────────────────
  const [rptCenterSel, setRptCenterSel] = useState("");
  const [rptStudentsByCtr, setRptStudentsByCtr] = useState([]);
  const [report, setReport] = useState({ ...BLANK_REPORT });
  const [editReportId, setEditReportId] = useState(null);
  const [reportSaving, setReportSaving] = useState(false);
  const [reportMsg, setReportMsg] = useState({ type: "", text: "" });
  const [allReports, setAllReports] = useState([]);
  const [loadingMoreRpt, setLoadingMoreRpt] = useState(false);
  const [rptPage, setRptPage] = useState(1);
  const [rptTotal, setRptTotal] = useState(0);
  const [rptHasMore, setRptHasMore] = useState(false);
  const [rptFilterCenter, setRptFilterCenter] = useState("");
  const [rptFilterEnroll, setRptFilterEnroll] = useState("");
  const [rptFilterFrom, setRptFilterFrom] = useState("");
  const [rptFilterTo, setRptFilterTo] = useState("");
  const [activeStudent, setActiveStudent] = useState(null);
  const [viewReportId, setViewReportId] = useState(null);
  const [rptSelectedStudents, setRptSelectedStudents] = useState([]);

  // ── Videos ────────────────────────────────────────────────────────────────
  const [videos, setVideos] = useState([]);
  const [vidCenterSel, setVidCenterSel] = useState("");
  const [vidStudentsByCtr, setVidStudentsByCtr] = useState([]);
  const [vidTitle, setVidTitle] = useState("");
  const [vidFile, setVidFile] = useState(null);
  const [vidStudents, setVidStudents] = useState([]);
  const [vidSaving, setVidSaving] = useState(false);
  const [vidProgress, setVidProgress] = useState(0);

  // Event bulk registration
  const [evTmpl, setEvTmpl] = useState(null);
  const [evRegs, setEvRegs] = useState([]);
  const [evName, setEvName] = useState("");
  const [evFile, setEvFile] = useState(null);
  const evFileRef = useRef(null);
  const [evSaving, setEvSaving] = useState(false);
  const [evMsg, setEvMsg] = useState({ type: "", text: "" });
  const [evExpanded, setEvExpanded] = useState(null);
  const [evCenterFilter, setEvCenterFilter] = useState("");
  const [evFullId, setEvFullId] = useState(null);
  const [evRowDeleting, setEvRowDeleting] = useState(null); // { regId, rowIndex }
  const [vidListCenter, setVidListCenter] = useState("");
  const [vidMsg, setVidMsg] = useState({ type: "", text: "" });
  const vidFileRef = useRef();

  // ── Notifications ──────────────────────────────────────────────────────────
  const [scope, setScope] = useState("all_centers");
  const [targetCenter, setTargetCenter] = useState("");
  const [nStudentsSel, setNStudentsSel] = useState([]); // empty = all students of the center
  const [nTitle, setNTitle] = useState("");
  const [nMsg, setNMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [nResult, setNResult] = useState({ type: "", text: "" });
  const [history, setHistory] = useState([]);

  useEffect(() => { loadCenters(); }, []);

  useEffect(() => {
    if (sub === "overview") loadOverview();
    if (sub === "students") loadStudents(centerFilter);
    if (sub === "reports") { loadAllReports(); }
    if (sub === "videos") loadVideos();
    if (sub === "notifications") { loadHistory(); if (students.length === 0) loadStudents(""); }
  }, [sub]);

  async function loadOverview() {
    setOverviewLoading(true); setOverviewErr("");
    try {
      const [ov, inact, tr] = await Promise.all([
        adminFetch("portal_admin_students.php?type=overview"),
        adminFetch("portal_admin_students.php?type=inactive&days=14"),
        adminFetch("portal_admin_students.php?type=trends"),
      ]);
      setOverview(ov);
      setInactive(Array.isArray(inact) ? inact : []);
      setTrends(tr);
    }
    catch (e) { setOverviewErr(e.message); }
    finally { setOverviewLoading(false); }
  }

  function downloadCsv(filename, header, rows) {
    const esc = v => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [header, ...rows].map(r => r.map(esc).join(",")).join("\r\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function exportStudentsCsv() {
    setExporting("students");
    try {
      const qs = centerFilter ? `?center_id=${encodeURIComponent(centerFilter)}` : "";
      const rows = await adminFetch(`portal_admin_students.php${qs}`);
      downloadCsv(
        `students_${new Date().toISOString().slice(0, 10)}.csv`,
        ["Student ID", "Name", "Center ID", "Center Name", "Level", "Status", "Father Name", "Mother Name", "Mobile", "Email", "DOB", "Gender", "Blood Group", "Address", "Joined"],
        (Array.isArray(rows) ? rows : []).map(s => [
          s.enrollment_no, s.name, s.center_id, s.center_name || "", s.level || "", s.status || "active",
          s.father_name || "", s.mother_contact || "", s.mobile || "", s.email || "", s.dob || "",
          s.gender || "", s.blood_group || "", s.address || "", s.created_at || "",
        ])
      );
    } catch (e) { alert("Export failed: " + e.message); }
    finally { setExporting(""); }
  }

  async function exportReportsCsv() {
    setExporting("reports");
    try {
      const qs = rptFilterCenter ? `&center_id=${encodeURIComponent(rptFilterCenter)}` : "";
      const rows = await adminFetch(`portal_admin_students.php?type=reports${qs}`);
      downloadCsv(
        `reports_${new Date().toISOString().slice(0, 10)}.csv`,
        ["Date", "Student ID", "Student", "Center", "Attendance", "Direct View", "Indirect View", "Hand Writing", "CW Book A", "CW Book B", "HW Book A", "HW Book B", "Page Type", "Activity"],
        (Array.isArray(rows) ? rows : []).map(r => [
          r.report_date, r.enrollment_no, r.student_name || "", r.center_id, r.attendance,
          r.sw_direct_view ?? 0, r.sw_indirect_view ?? 0, (r.sw_hand_writing ?? r.sw_right_hand_writing) ?? 0,
          r.book_a_page ?? 0, r.book_b_page ?? 0, r.hw_book_a_page ?? 0, r.hw_book_b_page ?? 0,
          r.pagework_type || "", r.activity || "",
        ])
      );
    } catch (e) { alert("Export failed: " + e.message); }
    finally { setExporting(""); }
  }

  // Load students by center for Reports / Videos helpers
  async function loadStudentsByCenter(centerId, setter) {
    if (!centerId) { setter([]); return; }
    try {
      const data = await adminFetch(`portal_students.php?center_id=${encodeURIComponent(centerId)}`, {
        headers: { "X-Admin-Password": pw() },
      });
      setter(Array.isArray(data) ? data : []);
    } catch { setter([]); }
  }

  async function loadCenters() {
    setLoadingCenters(true);
    try { setCenters(await adminFetch("portal_admin.php")); } catch { setCenters([]); }
    finally { setLoadingCenters(false); }
  }

  async function loadStudents(ctr = "", page = 1, append = false) {
    if (append) setLoadingMoreS(true); else { setLoadingS(true); setErrS(""); setStudents([]); }
    try {
      const q = new URLSearchParams({ page, per_page: 50 });
      if (ctr) q.set("center_id", ctr);
      const data = await adminFetch(`portal_students.php?${q}`);
      if (data && !Array.isArray(data) && data.data) {
        setStudents(prev => append ? [...prev, ...data.data] : data.data);
        setStudTotal(data.total);
        setStudHasMore(page * 50 < data.total);
        setStudPage(page);
      } else {
        setStudents(Array.isArray(data) ? data : []);
        setStudHasMore(false);
      }
    } catch (err) { if (!append) setErrS(err.message); }
    finally { if (append) setLoadingMoreS(false); else setLoadingS(false); }
  }

  async function loadAllReports(page = 1, append = false) {
    if (append) setLoadingMoreRpt(true);
    try {
      const q = new URLSearchParams({ type: "reports", page, per_page: 50 });
      const data = await adminFetch(`portal_admin_students.php?${q}`);
      if (data && !Array.isArray(data) && data.data) {
        setAllReports(prev => append ? [...prev, ...data.data] : data.data);
        setRptTotal(data.total);
        setRptHasMore(page * 50 < data.total);
        setRptPage(page);
      } else {
        setAllReports(Array.isArray(data) ? data : []);
        setRptHasMore(false);
      }
    } catch { if (!append) setAllReports([]); }
    finally { if (append) setLoadingMoreRpt(false); }
  }

  async function loadVideos() {
    try { setVideos(await adminFetch("portal_admin_students.php?type=videos")); } catch { setVideos([]); }
  }

  async function loadHistory() {
    try { setHistory(await adminFetch("portal_admin_students.php?type=notifications")); } catch { setHistory([]); }
  }

  function resetPassword(login_id, name) {
    setResetPwTarget({ login_id, name });
    setResetPwValue("");
    setResetPwMsg("");
  }

  async function executeResetPassword() {
    if (!resetPwTarget) return;
    if (resetPwValue.length < 6) { setResetPwMsg("Password must be at least 6 characters."); return; }
    setResetPwSaving(true);
    setResetPwMsg("");
    try {
      await adminFetch("portal_admin.php", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login_id: resetPwTarget.login_id, password: resetPwValue }),
      });
      setResetPwTarget(null);
      setResetPwValue("");
      loadCenters();
      if (sub === "students") loadStudents(centerFilter);
    } catch (err) { setResetPwMsg("Failed: " + err.message); }
    finally { setResetPwSaving(false); }
  }

  // ── Centers ───────────────────────────────────────────────────────────────
  async function handleCreateCenter(e) {
    e.preventDefault();
    setCenterMsg({ type: "", text: "" });
    if (!centerForm.name.trim() || !centerForm.password) {
      setCenterMsg({ type: "error", text: "Name and password are required." }); return;
    }
    setCenterSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", centerForm.name);
      fd.append("password", centerForm.password);
      fd.append("email", centerForm.email || "");
      fd.append("whatsapp", centerForm.whatsapp || "");
      if (centerPhoto) fd.append("photo", centerPhoto);
      const data = await adminFetch("portal_admin.php", { method: "POST", body: fd });
      setCenterMsg({ type: "success", text: `Created! Center ID: ${data.center_id}` });
      setCenterForm({ name: "", password: "", email: "", whatsapp: "" });
      setCenterPhoto(null);
      loadCenters();
    } catch (err) { setCenterMsg({ type: "error", text: err.message }); }
    finally { setCenterSaving(false); }
  }

  function startEditCenter(c) {
    setEditingCenter(c);
    setEditCenterForm({ name: c.name || "", email: c.email || "", whatsapp: c.whatsapp || "" });
    setEditCenterMsg({ type: "", text: "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleEditCenterSave(e) {
    e.preventDefault();
    if (!editCenterForm.name.trim()) { setEditCenterMsg({ type: "error", text: "Name is required." }); return; }
    setEditCenterSaving(true); setEditCenterMsg({ type: "", text: "" });
    try {
      await adminFetch("portal_admin.php", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login_id: editingCenter.login_id, ...editCenterForm }),
      });
      setEditCenterMsg({ type: "success", text: "Updated!" });
      setEditingCenter(null);
      loadCenters();
    } catch (err) { setEditCenterMsg({ type: "error", text: err.message }); }
    finally { setEditCenterSaving(false); }
  }

  function deleteReport(r) {
    setDeleteTarget({
      type: "report",
      title: "Delete Report",
      subtitle: "Permanently remove this student report.",
      rows: [
        ["Student", r.student_name || r.enrollment_no],
        ["Date", r.report_date],
      ],
      report_id: r.id,
    });
  }

  function deleteCenter(center_id, name) {
    setDeleteTarget({
      type: "center",
      title: "Delete Center",
      subtitle: "This also removes every student in this center and all of their reports.",
      rows: [["Center Name", name || center_id], ["Center ID", center_id]],
      center_id,
    });
  }

  // ── Students ───────────────────────────────────────────────────────────────
  function openAddStudent() {
    setEditEnroll(""); setStudentForm({ ...BLANK_STUDENT, center_id: "" });
    setStudentMsg({ type: "", text: "" }); setShowStudentForm(true);
    if (photoRef.current) photoRef.current.value = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function openEditStudent(s) {
    setEditEnroll(s.enrollment_no);
    setStudentForm({
      center_id: s.center_id,
      name: s.name || "", father_name: s.father_name || "", mother_contact: s.mother_contact || "",
      dob: s.dob || "", mobile: s.mobile || "", anniversary: s.anniversary || "",
      email: s.email || "", address: s.address || "", blood_group: s.blood_group || "",
      gender: s.gender || "", level: s.level || "", reg_no: s.reg_no || "", parent_name: s.parent_name || "",
      parent_contact: s.parent_contact || "", notes: s.notes || "", status: s.status || "active",
    });
    setStudentMsg({ type: "", text: "" }); setShowStudentForm(true);
    if (photoRef.current) photoRef.current.value = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleBulkUpload() {
    if (!studentForm.center_id) { setBulkMsg({ type: "error", text: "Select a center first." }); return; }
    if (!bulkFile) { setBulkMsg({ type: "error", text: "Please select a file." }); return; }
    setBulkUploading(true); setBulkMsg({ type: "", text: "" }); setBulkResult(null);
    const fd = new FormData();
    fd.append("file", bulkFile);
    fd.append("center_id", studentForm.center_id);
    try {
      const data = await adminFetch("portal_students_upload.php", { method: "POST", body: fd });
      setBulkResult(data);
      setBulkMsg({ type: "success", text: `Done — ${data.added_count} added, ${data.skipped_count} skipped.` });
      setBulkFile(null);
      if (bulkFileRef.current) bulkFileRef.current.value = "";
      await loadStudents(centerFilter);
    } catch (err) { setBulkMsg({ type: "error", text: err.message }); }
    finally { setBulkUploading(false); }
  }

  async function handleStudentSubmit(e) {
    e.preventDefault();
    setStudentMsg({ type: "", text: "" });
    if (!studentForm.center_id) { setStudentMsg({ type: "error", text: "Select a center." }); return; }
    const req = ["name","father_name","mother_contact","dob","mobile","gender","level"];
    const labels = { name:"Name", father_name:"Father Name", mother_contact:"Mother Name", dob:"DOB", mobile:"Mobile", address:"Address", blood_group:"Blood Group", gender:"Gender", level:"Level" };
    const missing = req.filter(k => !String(studentForm[k] || "").trim()).map(k => labels[k]);
    if (missing.length) { setStudentMsg({ type: "error", text: "Required: " + missing.join(", ") }); return; }
    if (!editEnroll && studentForm.password?.trim() && studentForm.password.trim().length < 6) { setStudentMsg({ type: "error", text: "Password must be at least 6 characters." }); return; }
    if (!/^\d{10}$/.test(String(studentForm.mobile).trim())) { setStudentMsg({ type: "error", text: "Mobile must be a 10-digit number." }); return; }
    if (studentForm.dob && studentForm.dob >= todayStr()) { setStudentMsg({ type: "error", text: "Date of birth must be in the past." }); return; }

    setStudentSaving(true);
    try {
      const fd = new FormData();
      Object.entries(studentForm).forEach(([k, v]) => fd.append(k, v ?? ""));
      if (editEnroll) fd.append("enrollment_no", editEnroll);
      if (photoRef.current?.files[0]) fd.append("photo", photoRef.current.files[0]);

      const data = await fetch(`${API_BASE}/portal_students.php`, {
        method: "POST",
        headers: { "X-Admin-Password": pw() },
        body: fd,
      }).then(r => r.json());

      if (data.error) throw new Error(data.error);

      if (editEnroll) {
        setStudents(prev => prev.map(s => s.enrollment_no === editEnroll ? data.student : s));
        setStudentMsg({ type: "success", text: "Student updated." });
      } else {
        setStudents(prev => [data.student, ...prev]);
        setStudTotal(t => t + 1);
        setStudentMsg({ type: "success", text: `Added! Student ID: ${data.enrollment_no} — Default password: ${data.default_password}` });
      }
      setStudentForm({ ...BLANK_STUDENT, center_id: studentForm.center_id });
      setEditEnroll("");
      if (photoRef.current) photoRef.current.value = "";
    } catch (err) { setStudentMsg({ type: "error", text: err.message }); }
    finally { setStudentSaving(false); }
  }

  // ── Reports ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (sub === "reports") loadStudentsByCenter(rptCenterSel, setRptStudentsByCtr);
  }, [rptCenterSel, sub]);

  async function handleReportSubmit(e) {
    e.preventDefault();
    setReportMsg({ type: "", text: "" });
    if (!rptCenterSel) { setReportMsg({ type: "error", text: "Select a center." }); return; }
    if (!report.report_date) { setReportMsg({ type: "error", text: "Pick a date." }); return; }
    setReportSaving(true);
    try {
      if (editReportId) {
        await adminFetch("portal_reports.php", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editReportId, ...report, center_id: rptCenterSel }),
        });
        setEditReportId(null);
        setReport({ ...BLANK_REPORT });
        setReportMsg({ type: "success", text: "Report updated." });
      } else {
        if (rptSelectedStudents.length === 0) { setReportSaving(false); setReportMsg({ type: "error", text: "Select at least one student." }); return; }
        let ok = 0; const errs = [];
        for (const enNo of rptSelectedStudents) {
          try {
            await adminFetch("portal_reports.php", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...report, enrollment_no: enNo, center_id: rptCenterSel }),
            });
            ok++;
          } catch (err) { errs.push(`${enNo}: ${err.message}`); }
        }
        setRptSelectedStudents([]);
        setReport({ ...BLANK_REPORT });
        setReportMsg({ type: errs.length ? "error" : "success", text: errs.length ? `${ok} submitted, ${errs.length} failed: ${errs.join("; ")}` : `${ok} report${ok !== 1 ? "s" : ""} submitted.` });
      }
      loadAllReports();
    } catch (err) { setReportMsg({ type: "error", text: err.message }); }
    finally { setReportSaving(false); }
  }

  async function handleBulkReportSubmit({ report_date, reports }) {
    setReportMsg({ type: "", text: "" });
    if (!rptCenterSel) { setReportMsg({ type: "error", text: "Select a center." }); return; }
    if (!report_date) { setReportMsg({ type: "error", text: "Pick a date." }); return; }
    if (reports.length === 0) { setReportMsg({ type: "error", text: "Select at least one student." }); return; }
    setReportSaving(true);
    try {
      const res = await adminFetch("portal_reports_bulk.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report_date, center_id: rptCenterSel, reports }),
      });
      const errs = res.errors || [];
      setReportMsg({
        type: errs.length ? "error" : "success",
        text: errs.length
          ? `${res.saved} submitted, ${errs.length} failed: ${errs.join("; ")}`
          : `${res.saved} report${res.saved !== 1 ? "s" : ""} submitted.`,
      });
      loadAllReports();
    } catch (err) { setReportMsg({ type: "error", text: err.message }); }
    finally { setReportSaving(false); }
  }

  // Filtered report list
  const filteredReports = allReports.filter(r =>
    (!rptFilterCenter || r.center_id === rptFilterCenter) &&
    (!rptFilterEnroll || r.enrollment_no === rptFilterEnroll || (r.student_name || "").toLowerCase().includes(rptFilterEnroll.toLowerCase())) &&
    (!rptFilterFrom || (r.report_date || "") >= rptFilterFrom) &&
    (!rptFilterTo || (r.report_date || "") <= rptFilterTo)
  );


  const viewedReport = viewReportId ? allReports.find(r => r.id === viewReportId) : null;

  // ── Videos ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (sub === "videos") loadStudentsByCenter(vidCenterSel, setVidStudentsByCtr);
  }, [vidCenterSel, sub]);

  async function handleVideoUpload(e) {
    e.preventDefault();
    setVidMsg({ type: "", text: "" });
    if (!vidCenterSel) { setVidMsg({ type: "error", text: "Select a center." }); return; }
    if (!vidFile) { setVidMsg({ type: "error", text: "Choose a video file." }); return; }
    if (vidStudents.length === 0) { setVidMsg({ type: "error", text: "Select at least one student." }); return; }
    setVidSaving(true);
    try {
      const fd = new FormData();
      fd.append("file", vidFile);
      fd.append("title", vidTitle);
      fd.append("center_id", vidCenterSel);
      fd.append("students", JSON.stringify(vidStudents));
      setVidProgress(0);
      const data = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${API_BASE}/portal_videos.php`);
        xhr.setRequestHeader("X-Admin-Password", pw());
        xhr.upload.onprogress = ev => { if (ev.lengthComputable) setVidProgress(Math.round((ev.loaded / ev.total) * 100)); };
        xhr.onload = () => {
          try {
            const d = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300 && !d.error) resolve(d);
            else reject(new Error(d.error || `Server error ${xhr.status}`));
          } catch { reject(new Error("Invalid server response")); }
        };
        xhr.onerror = () => reject(new Error("Upload failed — check your connection."));
        xhr.send(fd);
      });
      if (data.error) throw new Error(data.error);
      setVidMsg({ type: "success", text: "Video uploaded — it stays available for 7 days, then auto-deletes." });
      setVidTitle(""); setVidFile(null); setVidStudents([]);
      if (vidFileRef.current) vidFileRef.current.value = "";
      loadVideos();
    } catch (err) { setVidMsg({ type: "error", text: err.message }); }
    finally { setVidSaving(false); setVidProgress(0); }
  }

  // ── Event bulk registration ─────────────────────────────────────────────────
  async function loadEventData() {
    try {
      const [t, r] = await Promise.all([
        adminFetch("portal_event_template.php?meta=1"),
        adminFetch("portal_event_regs.php"),
      ]);
      setEvTmpl(t && t.filename ? t : null);
      setEvRegs(Array.isArray(r) ? r : []);
    } catch (_) { }
  }
  // Download template (no arg) or a submission file (pass the reg record)
  async function downloadEventFile(r) {
    try {
      const url = r && r.id
        ? `${API_BASE}/portal_event_regs_file.php?id=${r.id}`
        : `${API_BASE}/portal_event_template.php`;
      const res = await fetch(url, { headers: { "X-Admin-Password": pw() } });
      if (!res.ok) {
        let msg = "Download failed";
        try { msg = (await res.json()).error || msg; } catch { }
        throw new Error(msg);
      }
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = (r && r.original_name) || (evTmpl && evTmpl.original_name) || "event_file.xlsx";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(objUrl);
    } catch (err) { setEvMsg({ type: "error", text: err.message }); }
  }
  async function handleEventRowsDelete(regId, indexes) {
    setEvRowDeleting(regId);
    try {
      await adminFetch("portal_event_regs.php", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: regId, row_indexes: indexes }),
      });
      const drop = new Set(indexes);
      setEvRegs(prev => prev.map(r => r.id === regId
        ? { ...r, rows: r.rows.filter((_, i) => !drop.has(i)), count: r.count - indexes.length }
        : r));
    } catch (err) { setEvMsg({ type: "error", text: "Delete failed: " + err.message }); }
    finally { setEvRowDeleting(null); }
  }
  async function handleEventTemplateUpload(e) {
    e.preventDefault();
    setEvMsg({ type: "", text: "" });
    if (!evFile) { setEvMsg({ type: "error", text: "Choose the template Excel file." }); return; }
    setEvSaving(true);
    try {
      const fd = new FormData();
      fd.append("file", evFile);
      fd.append("event_name", evName);
      await adminFetch("portal_event_template.php", { method: "POST", body: fd });
      setEvMsg({ type: "success", text: "Template published — franchises can now download it from their portal." });
      setEvName(""); setEvFile(null);
      if (evFileRef.current) evFileRef.current.value = "";
      loadEventData();
    } catch (err) { setEvMsg({ type: "error", text: err.message }); }
    finally { setEvSaving(false); }
  }

  // ── Notifications ────────────────────────────────────────────────────────────
  async function sendNotification(e) {
    e.preventDefault();
    setNResult({ type: "", text: "" });
    if (!nMsg.trim()) { setNResult({ type: "error", text: "Enter a message." }); return; }
    if (scope === "center_students" && !targetCenter) { setNResult({ type: "error", text: "Select a center." }); return; }
    setSending(true);
    try {
      await adminFetch("portal_notifications.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope, target_center_id: targetCenter, title: nTitle, message: nMsg,
          ...(scope === "center_students" && nStudentsSel.length > 0 ? { target_enrollment_nos: nStudentsSel } : {}),
        }),
      });
      setNResult({ type: "success", text: "Notification sent." });
      setNTitle(""); setNMsg(""); setTargetCenter(""); setNStudentsSel([]);
      loadHistory();
    } catch (err) { setNResult({ type: "error", text: err.message }); }
    finally { setSending(false); }
  }

  const filteredStudents = students.filter(s =>
    (!centerFilter || s.center_id === centerFilter) &&
    (!search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.enrollment_no.toLowerCase().includes(search.toLowerCase()))
  );

  const SUBS = [
    { key: "overview",      icon: LayoutGrid,    label: "Overview" },
    { key: "centers",       icon: Building2,     label: "Centers" },
    { key: "students",      icon: Users,         label: "Students" },
    { key: "reports",       icon: ClipboardList, label: "Reports" },
    { key: "videos",        icon: Video,         label: "Videos" },
    { key: "notifications", icon: Bell,          label: "Notifications" },
    { key: "audit",         icon: Activity,      label: "Audit Log" },
  ];

  async function loadAudit(pg = auditPage) {
    setAuditLoading(true);
    try {
      const params = new URLSearchParams({ page: pg, per_page: 50 });
      if (auditAction) params.set("action", auditAction);
      if (auditRole)   params.set("role", auditRole);
      if (auditSearch) params.set("search", auditSearch);
      if (auditFrom)   params.set("date_from", auditFrom);
      if (auditTo)     params.set("date_to", auditTo);
      const data = await adminFetch(`portal_audit.php?${params}`);
      setAuditLogs(data.data || []);
      setAuditTotal(data.total || 0);
      setAuditPage(pg);
    } catch (_) { setAuditLogs([]); }
    finally { setAuditLoading(false); }
  }

  function switchSub(key) {
    setSub(key); setActiveStudent(null); setShowStudentForm(false);
    setEditReportId(null); setViewReportId(null);
    if (key === "audit") setTimeout(() => loadAudit(1), 0);
  }

  return (
    <div className="portal-responsive max-w-6xl mx-auto min-w-0 px-4 py-6 space-y-6">
      <nav className="flex overflow-x-auto scrollbar-none gap-2 pb-2 -mx-4 px-4" aria-label="Student portal sections">
        {SUBS.map(({ key, icon: Icon, label }) => (
          <button key={key} onClick={() => switchSub(key)}
            className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              sub === key ? "bg-secondary text-primary shadow" : "text-white/50 border border-white/10 hover:border-white/25 hover:text-white"
            }`}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </nav>

      {/* ── OVERVIEW ── */}
      {sub === "overview" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-lg flex items-center gap-2"><LayoutGrid className="h-5 w-5 text-secondary" /> Portal Overview</h2>
            <button onClick={loadOverview} disabled={overviewLoading}
              className="p-2 rounded-xl hover:bg-white/8 text-white/40 hover:text-white transition-colors">
              <RefreshCw className={`h-4 w-4 ${overviewLoading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {overviewErr && <Alert type="error" msg={overviewErr} />}

          {overviewLoading && !overview ? (
            <div className="flex items-center justify-center py-12"><span className="h-8 w-8 border-2 border-white/10 border-t-secondary rounded-full animate-spin" /></div>
          ) : overview && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { label: "Centers", val: overview.totals.centers, icon: Building2, cls: "text-secondary" },
                  { label: "Students", val: overview.totals.students, icon: Users, cls: "text-white" },
                  { label: "Active Students", val: overview.totals.active_students, icon: CheckCircle, cls: "text-emerald-400" },
                  { label: "Total Reports", val: overview.totals.reports, icon: ClipboardList, cls: "text-white" },
                  { label: "Reports This Month", val: overview.totals.reports_this_month, icon: Activity, cls: "text-sky-400" },
                ].map(({ label, val, icon: Icon, cls }) => (
                  <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`h-4 w-4 ${cls === "text-white" ? "text-white/40" : cls}`} />
                      <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold">{label}</p>
                    </div>
                    <p className={`text-3xl font-bold tabular-nums ${cls}`}>{val}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/8">
                  <h3 className="text-white font-bold flex items-center gap-2"><Building2 className="h-4 w-4 text-secondary" /> Center Activity</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-white/8 text-white/40 text-xs uppercase tracking-wide">
                      <th className="text-left px-5 py-3 font-medium">Center</th>
                      <th className="text-right px-4 py-3 font-medium">Students</th>
                      <th className="text-right px-4 py-3 font-medium">Active</th>
                      <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">Reports</th>
                      <th className="text-right px-4 py-3 font-medium">This Month</th>
                      <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Last Report</th>
                      <th className="px-4 py-3"></th>
                    </tr></thead>
                    <tbody className="divide-y divide-white/5">
                      {overview.centers.length === 0 && (
                        <tr><td colSpan="7" className="text-center py-10 text-white/30 text-sm">No centers yet.</td></tr>
                      )}
                      {overview.centers.map(c => (
                        <tr key={c.center_id} className="hover:bg-white/3 transition-colors">
                          <td className="px-5 py-3">
                            <div className="text-white font-medium">{c.name}</div>
                            <div className="text-xs text-white/30 font-mono">{c.center_id}</div>
                          </td>
                          <td className="px-4 py-3 text-right text-white tabular-nums font-medium">{c.students}</td>
                          <td className="px-4 py-3 text-right text-emerald-400 tabular-nums font-medium">{c.active_students}</td>
                          <td className="px-4 py-3 text-right text-white/70 tabular-nums hidden sm:table-cell">{c.reports}</td>
                          <td className="px-4 py-3 text-right tabular-nums font-medium">
                            <span className={c.reports_this_month > 0 ? "text-sky-400" : "text-white/30"}>{c.reports_this_month}</span>
                          </td>
                          <td className="px-4 py-3 text-white/50 text-xs hidden md:table-cell">{c.last_report_date ? fmtDt(c.last_report_date).split(",")[0] : "—"}</td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => { setCenterFilter(c.center_id); switchSub("students"); }}
                              className="text-secondary text-xs font-semibold hover:text-secondary/80 transition-colors whitespace-nowrap">
                              View students →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Monthly report trends ── */}
              {trends && trends.centers.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <h3 className="text-white font-bold flex items-center gap-2 mb-4"><Activity className="h-4 w-4 text-secondary" /> Reports per Month (last 6 months)</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trends.months.map((m, i) => {
                        const row = { month: new Date(m + "-01T00:00:00").toLocaleDateString("en-IN", { month: "short", year: "2-digit" }) };
                        trends.centers.forEach(c => { row[c.name] = c.counts[i]; });
                        return row;
                      })} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <ChartTooltip contentStyle={{ background: "#142338", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: 12 }}
                          labelStyle={{ color: "rgba(255,255,255,0.6)" }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        {trends.centers.map((c, i) => (
                          <Line key={c.center_id} type="monotone" dataKey={c.name} strokeWidth={2} dot={{ r: 3 }}
                            stroke={["#facc15", "#34d399", "#60a5fa", "#f472b6", "#fb923c", "#a78bfa", "#2dd4bf", "#f87171"][i % 8]} />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* ── Inactive student alerts ── */}
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/8 flex flex-wrap items-center gap-3">
                  <h3 className="text-white font-bold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-400" /> Inactive Students</h3>
                  <span className="text-white/30 text-xs">no report in the last</span>
                  <div className="flex rounded-lg overflow-hidden border border-white/10">
                    {[14, 30].map(d => (
                      <button key={d} onClick={() => setInactiveDays(d)}
                        className={`px-3 py-1 text-xs font-bold transition-colors ${inactiveDays === d ? "bg-secondary text-primary" : "bg-white/5 text-white/50 hover:text-white"}`}>
                        {d} days
                      </button>
                    ))}
                  </div>
                </div>
                {(() => {
                  const list = inactive.filter(r => r.days_since === null || r.days_since >= inactiveDays);
                  return list.length === 0 ? (
                    <div className="py-10 text-center text-white/30 text-sm flex items-center justify-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-400" /> All active students have recent reports.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-white/8 text-white/40 text-xs uppercase tracking-wide">
                          <th className="text-left px-5 py-3 font-medium">Student</th>
                          <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Center</th>
                          <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Level</th>
                          <th className="text-left px-4 py-3 font-medium">Last Report</th>
                          <th className="text-right px-5 py-3 font-medium">Days Silent</th>
                        </tr></thead>
                        <tbody className="divide-y divide-white/5">
                          {list.map(r => (
                            <tr key={r.enrollment_no} className="hover:bg-white/3 transition-colors">
                              <td className="px-5 py-3">
                                <div className="text-white font-medium">{r.name}</div>
                                <div className="text-xs text-white/30 font-mono">{r.enrollment_no}</div>
                              </td>
                              <td className="px-4 py-3 text-white/50 hidden sm:table-cell">{r.center_name || r.center_id}</td>
                              <td className="px-4 py-3 text-white/50 hidden md:table-cell">{r.level || "—"}</td>
                              <td className="px-4 py-3 text-white/60 text-xs">{r.last_report_date || <span className="text-rose-400 font-semibold">Never</span>}</td>
                              <td className="px-5 py-3 text-right">
                                <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-bold tabular-nums ${r.days_since === null ? "bg-rose-500/10 text-rose-400" : r.days_since >= 30 ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-400"}`}>
                                  {r.days_since === null ? "—" : `${r.days_since}d`}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── CENTERS ── */}
      {sub === "centers" && (
        <div className="space-y-6">
          {editingCenter ? (
            /* ── Edit Center Form ── */
            <div className="bg-white/5 border border-secondary/20 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-bold text-lg flex items-center gap-2"><Pencil className="h-5 w-5 text-secondary" /> Edit Franchise</h2>
                <button onClick={() => setEditingCenter(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"><X className="h-5 w-5" /></button>
              </div>
              <p className="text-white/30 text-xs font-mono">Center ID: {editingCenter.login_id}</p>
              <form onSubmit={handleEditCenterSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4" autoComplete="off">
                <Field label="Center Name" required>
                  <input type="text" value={editCenterForm.name} autoComplete="off" placeholder="e.g. Bangalore Center"
                    onChange={e => setEditCenterForm(p => ({ ...p, name: e.target.value }))} className={inputCls} />
                </Field>
                <Field label="Email (optional)">
                  <input type="email" value={editCenterForm.email} autoComplete="off" placeholder="center@example.com"
                    onChange={e => setEditCenterForm(p => ({ ...p, email: e.target.value }))} className={inputCls} />
                </Field>
                <Field label="WhatsApp (optional)">
                  <input type="tel" value={editCenterForm.whatsapp} autoComplete="off" placeholder="10-digit WhatsApp number"
                    onChange={e => setEditCenterForm(p => ({ ...p, whatsapp: e.target.value }))} className={inputCls} />
                </Field>
                <div className="sm:col-span-2 space-y-3">
                  <Alert type={editCenterMsg.type} msg={editCenterMsg.text} />
                  <div className="flex gap-3">
                    <button type="submit" disabled={editCenterSaving}
                      className="flex items-center gap-2 bg-secondary text-primary font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-secondary/90 transition-all disabled:opacity-60">
                      {editCenterSaving ? <span className="h-4 w-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                      {editCenterSaving ? "Saving…" : "Save Changes"}
                    </button>
                    <button type="button" onClick={() => setEditingCenter(null)}
                      className="px-4 py-2 rounded-xl border border-white/15 text-white/50 hover:text-white text-sm transition-colors">Cancel</button>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            /* ── Create Center Form ── */
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <h2 className="text-white font-bold text-lg flex items-center gap-2"><Plus className="h-5 w-5 text-secondary" /> Create Franchise Account</h2>
              <form onSubmit={handleCreateCenter} className="grid grid-cols-1 sm:grid-cols-2 gap-4" autoComplete="off">
                {[
                  { label: "Center Name", key: "name", placeholder: "e.g. Bangalore Center", type: "text", req: true },
                  { label: "Password", key: "password", placeholder: "Min. 6 characters", type: "password", req: true },
                  { label: "Email (optional)", key: "email", placeholder: "center@example.com", type: "email" },
                  { label: "WhatsApp (optional)", key: "whatsapp", placeholder: "10-digit WhatsApp number", type: "tel" },
                ].map(({ label, key, placeholder, type, req }) => (
                  <Field key={key} label={label} required={req}>
                    {type === "password" ? (
                      <PwInput value={centerForm[key]} onChange={e => setCenterForm(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} />
                    ) : (
                      <input type={type} value={centerForm[key]} placeholder={placeholder} autoComplete="off"
                        onChange={e => setCenterForm(p => ({ ...p, [key]: e.target.value }))} className={inputCls} />
                    )}
                  </Field>
                ))}
                <Field label="Profile Picture (optional)">
                  <div className="flex items-center gap-3">
                    {centerPhoto && (
                      <img src={URL.createObjectURL(centerPhoto)} alt="Preview" className="h-11 w-11 rounded-full object-cover border border-white/15" />
                    )}
                    <input type="file" accept="image/*" onChange={e => setCenterPhoto(e.target.files?.[0] || null)}
                      className="text-sm text-white/60 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-white/10 file:text-white file:text-xs file:font-semibold file:cursor-pointer hover:file:bg-white/15" />
                    {centerPhoto && (
                      <button type="button" onClick={() => setCenterPhoto(null)} className="text-white/40 hover:text-rose-400 text-xs font-semibold">Remove</button>
                    )}
                  </div>
                </Field>
                <div className="sm:col-span-2 space-y-3">
                  <Alert type={centerMsg.type} msg={centerMsg.text} />
                  <button type="submit" disabled={centerSaving}
                    className="flex items-center gap-2 bg-secondary text-primary font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-secondary/90 transition-all disabled:opacity-60">
                    {centerSaving ? <span className="h-4 w-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" /> : <Plus className="h-4 w-4" />}
                    {centerSaving ? "Creating…" : "Create Franchise Account"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg flex items-center gap-2"><Users className="h-5 w-5 text-secondary" /> Franchise Accounts</h2>
              <button onClick={loadCenters} className="p-2 rounded-xl hover:bg-white/8 text-white/40 hover:text-white transition-colors"><RefreshCw className="h-4 w-4" /></button>
            </div>
            {loadingCenters ? (
              <div className="flex items-center justify-center py-12"><span className="h-8 w-8 border-2 border-white/10 border-t-secondary rounded-full animate-spin" /></div>
            ) : centers.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-white/30">
                <Building2 className="h-10 w-10 mx-auto mb-3 opacity-50" /><p className="text-sm">No franchise accounts yet.</p>
              </div>
            ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead><tr className="border-b border-white/8 text-white/40 text-xs uppercase tracking-wide">
                    <th className="text-left px-5 py-3 font-medium">Center ID</th>
                    <th className="text-left px-4 py-3 font-medium">Name</th>
                    <th className="text-left px-4 py-3 font-medium">Password</th>
                    <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Email</th>
                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">WhatsApp</th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Created</th>
                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y divide-white/5">
                    {centers.map(c => (
                      <tr key={c.login_id} className={`hover:bg-white/3 transition-colors ${editingCenter?.login_id === c.login_id ? "bg-secondary/5" : ""}`}>
                        <td className="px-5 py-3 font-mono text-secondary text-xs font-bold">{c.login_id}</td>
                        <td className="px-4 py-3 text-white font-medium">
                          <div className="flex items-center gap-2.5">
                            {c.photo ? (
                              <img src={c.photo} alt={c.name} className="h-8 w-8 rounded-full object-cover border border-white/15 flex-shrink-0" />
                            ) : (
                              <span className="h-8 w-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0 text-white/40 text-xs font-bold">{(c.name || "?").charAt(0).toUpperCase()}</span>
                            )}
                            {c.name}
                          </div>
                        </td>
                        <td className="px-4 py-3"><PwCell value={c.password} onSet={() => resetPassword(c.login_id, c.name)} /></td>
                        <td className="px-4 py-3 text-white/50 hidden sm:table-cell">{c.email || "—"}</td>
                        <td className="px-4 py-3 text-white/50 hidden lg:table-cell">{c.whatsapp || "—"}</td>
                        <td className="px-4 py-3 text-white/30 text-xs hidden md:table-cell">{fmtDt(c.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => startEditCenter(c)} title="Edit center details"
                              className="flex items-center gap-1 text-white/40 text-xs hover:text-secondary transition-colors">
                              <Pencil className="h-3.5 w-3.5" /> Edit
                            </button>
                            <button onClick={() => resetPassword(c.login_id, c.name)}
                              className="flex items-center gap-1 text-white/40 text-xs hover:text-secondary transition-colors">
                              <KeyRound className="h-3.5 w-3.5" /> Reset
                            </button>
                            <button onClick={() => deleteCenter(c.login_id, c.name)} disabled={deletingCenterId === c.login_id}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors disabled:opacity-40">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── STUDENTS ── */}
      {sub === "students" && (
        <div className="space-y-5">
          {levelsError && <p role="alert" className="text-sm text-red-300">{levelsError} <button type="button" onClick={reloadLevels} className="underline">Retry</button></p>}
          {levelsLoading && <p className="text-xs text-white/50">Loading student levels…</p>}
          <StudentLevelsManager levels={levels} getHeaders={() => ({ "X-Admin-Password": pw() })} onChange={async () => { await reloadLevels(); await loadStudents(centerFilter); }} />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h2 className="text-white font-bold text-lg flex items-center gap-2"><Users className="h-5 w-5 text-secondary" /> Students</h2>
            <div className="flex w-full sm:w-auto flex-wrap items-center gap-2 min-w-0">
              <select value={centerFilter} onChange={e => { setCenterFilter(e.target.value); loadStudents(e.target.value, 1, false); }}
                className="bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-secondary/50">
                <option value="" className="bg-gray-900">All centers</option>
                {centers.map(c => <option key={c.login_id} value={c.login_id} className="bg-gray-900">{c.login_id}</option>)}
              </select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
                  className="bg-white/5 border border-white/15 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-secondary/50 w-40 max-w-full" />
              </div>
              <button onClick={exportStudentsCsv} disabled={exporting === "students"}
                className="flex items-center gap-2 bg-white/5 border border-white/15 text-white/70 hover:text-white font-semibold px-4 py-2 rounded-xl text-sm hover:border-white/30 transition-all disabled:opacity-50">
                {exporting === "students" ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download className="h-4 w-4" />}
                Export CSV
              </button>
              <button onClick={() => showStudentForm ? setShowStudentForm(false) : openAddStudent()}
                className="flex items-center gap-2 bg-secondary text-primary font-bold px-4 py-2 rounded-xl text-sm hover:bg-secondary/90 transition-all">
                {showStudentForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {showStudentForm ? "Close" : "Add Student"}
              </button>
              <button onClick={() => loadStudents(centerFilter)} className="p-2 rounded-xl hover:bg-white/8 text-white/40 hover:text-white transition-colors"><RefreshCw className="h-4 w-4" /></button>
            </div>
          </div>

          {showStudentForm && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-6 space-y-4 min-w-0">
              <h3 className="text-white font-bold">{editEnroll ? `Edit — ${editEnroll}` : "New Student"}</h3>
              {!editEnroll && (
                <div className="p-3 sm:p-5 bg-black/20 border border-white/10 rounded-xl space-y-4 min-w-0">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2"><Upload className="h-4 w-4 text-secondary" /> Bulk Upload via Excel</h4>
                  <StudentTemplate canUpload getHeaders={() => ({ "X-Admin-Password": pw() })} />
                  <Field label="Center" required>
                    <select value={studentForm.center_id} onChange={e => setStudentForm(p => ({ ...p, center_id: e.target.value }))} className={selectCls}>
                      <option value="" className="bg-gray-900">Select center…</option>
                      {centers.map(c => <option key={c.login_id} value={c.login_id} className="bg-gray-900">{c.login_id}</option>)}
                    </select>
                  </Field>
                  <div className="flex flex-wrap gap-4 items-center">
                    <input type="file" ref={bulkFileRef} accept=".xlsx,.csv" onChange={e => setBulkFile(e.target.files[0])}
                      className="w-full sm:w-auto max-w-full min-w-0 text-sm text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 transition-all cursor-pointer" />
                    <button type="button" onClick={handleBulkUpload} disabled={bulkUploading}
                      className="px-5 py-2 bg-secondary text-primary font-bold rounded-lg hover:bg-secondary/90 transition-all disabled:opacity-60 text-sm flex items-center gap-2">
                      {bulkUploading ? <span className="h-4 w-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" /> : <Upload className="h-4 w-4" />}
                      {bulkUploading ? "Uploading…" : "Upload"}
                    </button>
                  </div>
                  <Alert type={bulkMsg.type} msg={bulkMsg.text} />
                  {bulkResult && (
                    <div className="space-y-2 text-sm">
                      {bulkResult.added?.length > 0 && (
                        <div className="text-emerald-300/90">
                          {bulkResult.added.map(a => <p key={a.row}>Row {a.row}: {a.name} → <span className="font-mono">{a.enrollment_no}</span> (password: <span className="font-mono">{a.default_password}</span>)</p>)}
                        </div>
                      )}
                      {bulkResult.skipped?.length > 0 && (
                        <div className="text-amber-300/90">
                          {bulkResult.skipped.map(s => <p key={s.row}>Row {s.row}: {s.name} — {s.reason}</p>)}
                        </div>
                      )}
                    </div>
                  )}
                  <p className="text-white/30 text-xs">Columns: Name, Father Name, Mother Name, Date of Birth (DD/MM/YYYY), Mobile, Gender, Blood Group, Address, Level, Email (optional), Anniversary (optional). Default password is 123456.</p>
                </div>
              )}
              <form onSubmit={handleStudentSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4" autoComplete="off">
                <Field label="Center" required>
                  <select value={studentForm.center_id} onChange={e => setStudentForm(p => ({ ...p, center_id: e.target.value }))} className={selectCls}>
                    <option value="" className="bg-gray-900">Select center…</option>
                    {centers.map(c => <option key={c.login_id} value={c.login_id} className="bg-gray-900">{c.login_id}</option>)}
                  </select>
                </Field>
                {[
                  { label: "Student Name", key: "name", req: true },
                  { label: "Father Name", key: "father_name", req: true },
                  { label: "Mother Name", key: "mother_contact", type: "text", req: true },
                  { label: "Date of Birth", key: "dob", type: "date", req: true },
                  { label: "Mobile", key: "mobile", type: "tel", req: true },
                  { label: "Email", key: "email", type: "email" },
                  { label: "Anniversary", key: "anniversary", type: "date" },
                ].map(({ label, key, type = "text", req }) => (
                  <Field key={key} label={label} required={req}>
                    <input type={type} value={studentForm[key] || ""} onChange={e => setStudentForm(p => ({ ...p, [key]: e.target.value }))}
                      onClick={type === "date" ? e => { try { e.target.showPicker?.(); } catch(_) {} } : undefined}
                      className={`${inputCls}${type === "date" ? " cursor-pointer" : ""}`} />
                  </Field>
                ))}
                {!editEnroll && (
                  <Field label="Password (optional)">
                    <PwInput value={studentForm.password || ""} placeholder="Leave blank for 123456"
                      onChange={e => setStudentForm(p => ({ ...p, password: e.target.value }))} />
                  </Field>
                )}
                <Field label="Blood Group (optional)">
                  <select value={studentForm.blood_group} onChange={e => setStudentForm(p => ({ ...p, blood_group: e.target.value }))} className={selectCls}>
                    <option value="" className="bg-gray-900">Select…</option>
                    {BLOOD_GROUPS.map(b => <option key={b} value={b} className="bg-gray-900">{b}</option>)}
                  </select>
                </Field>
                <Field label="Gender" required>
                  <select value={studentForm.gender} onChange={e => setStudentForm(p => ({ ...p, gender: e.target.value }))} className={selectCls}>
                    <option value="" className="bg-gray-900">Select…</option>
                    {GENDERS.map(g => <option key={g} value={g} className="bg-gray-900">{g}</option>)}
                  </select>
                </Field>
                <Field label="Level" required>
                  <select value={studentForm.level} onChange={e => setStudentForm(p => ({ ...p, level: e.target.value }))} className={selectCls}>
                    <option value="" className="bg-gray-900">Select…</option>
                    {LEVELS.map(l => <option key={l} value={l} className="bg-gray-900">{l}</option>)}
                  </select>
                </Field>
                <Field label="Student Registration Number (optional)">
                  <input type="text" value={studentForm.reg_no || ""} placeholder="Registration number (optional)"
                    onChange={e => setStudentForm(p => ({ ...p, reg_no: e.target.value }))} className={inputCls} />
                </Field>
                {editEnroll && (
                  <Field label="Status">
                    <select value={studentForm.status} onChange={e => setStudentForm(p => ({ ...p, status: e.target.value }))} className={selectCls}>
                      {["active","inactive","completed"].map(s => <option key={s} value={s} className="bg-gray-900">{s}</option>)}
                    </select>
                  </Field>
                )}
                <div className="sm:col-span-2">
                  <Field label="Address (optional)">
                    <textarea value={studentForm.address || ""} onChange={e => setStudentForm(p => ({ ...p, address: e.target.value }))} rows={2}
                      className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-secondary/60 transition-colors" />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Photo (optional)">
                    <label className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white/70 text-sm px-4 py-2.5 rounded-xl border border-white/15 transition-colors cursor-pointer w-fit">
                      <Upload className="h-4 w-4" /> Choose photo
                      <input ref={photoRef} type="file" accept="image/*" className="hidden" />
                    </label>
                  </Field>
                </div>
                <div className="sm:col-span-2 space-y-3">
                  <Alert type={studentMsg.type} msg={studentMsg.text} />
                  <button type="submit" disabled={studentSaving}
                    className="flex items-center gap-2 bg-secondary text-primary font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-secondary/90 transition-all disabled:opacity-60">
                    {studentSaving ? <span className="h-4 w-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    {studentSaving ? "Saving…" : editEnroll ? "Save Changes" : "Add Student"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {errS && <Alert type="error" msg={errS} />}
          {loadingS ? (
            <div className="flex items-center justify-center py-12"><span className="h-8 w-8 border-2 border-white/10 border-t-secondary rounded-full animate-spin" /></div>
          ) : filteredStudents.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-white/30">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-50" /><p className="text-sm">No students found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-white/8 text-white/40 text-xs uppercase tracking-wide">
                      <th className="text-left px-5 py-3 font-medium">Student ID</th>
                      <th className="text-left px-4 py-3 font-medium">Name</th>
                      <th className="text-left px-4 py-3 font-medium">Password</th>
                      <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Center</th>
                      <th className="text-left px-4 py-3 font-medium">Level</th>
                      <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Joined</th>
                      <th className="text-left px-4 py-3 font-medium">Actions</th>
                    </tr></thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredStudents.map(s => (
                        <tr key={s.enrollment_no} className="hover:bg-white/3 transition-colors">
                          <td className="px-5 py-3 font-mono text-secondary text-xs">{s.enrollment_no}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {s.photo ? (
                                <img src={`/uploads/students/${s.photo}`} alt={s.name} className="h-9 w-9 rounded-full object-cover border border-white/10 flex-shrink-0" />
                              ) : (
                                <div className="h-9 w-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 font-bold flex-shrink-0">
                                  {(s.name || "?").charAt(0)}
                                </div>
                              )}
                              <span className="text-white font-medium">{s.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3"><PwCell value={s.password} onSet={() => resetPassword(s.enrollment_no, s.name)} /></td>
                          <td className="px-4 py-3 text-white/50 hidden md:table-cell">{s.center_name || s.center_id}</td>
                          <td className="px-4 py-3 text-white/70">{s.level}</td>
                          <td className="px-4 py-3 text-white/30 text-xs hidden lg:table-cell">{fmtDt(s.created_at)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-start gap-1">
                              <button onClick={() => setViewStudent(s)} className="flex flex-col items-center gap-0.5 px-1 py-1 rounded-lg text-white/40 hover:text-secondary hover:bg-white/5 transition-colors" title="View all details">
                                <Eye className="h-3.5 w-3.5" /><span className="text-[9px] font-semibold leading-none">View</span>
                              </button>
                              <button onClick={() => setHistoryStudent(s)} className="flex flex-col items-center gap-0.5 px-1 py-1 rounded-lg text-white/40 hover:text-secondary hover:bg-white/5 transition-colors" title="View report history">
                                <ClipboardList className="h-3.5 w-3.5" /><span className="text-[9px] font-semibold leading-none">History</span>
                              </button>
                              <button onClick={() => openEditStudent(s)} className="flex flex-col items-center gap-0.5 px-1 py-1 rounded-lg text-white/40 hover:text-secondary hover:bg-white/5 transition-colors" title="Edit">
                                <Pencil className="h-3.5 w-3.5" /><span className="text-[9px] font-semibold leading-none">Edit</span>
                              </button>
                              <button onClick={() => { setPromoteStudent(s); setPromoteLevel(s.level || ""); setPromoteErr(""); }}
                                className="flex flex-col items-center gap-0.5 px-1 py-1 rounded-lg text-white/40 hover:text-sky-400 hover:bg-sky-500/10 transition-colors" title="Change level">
                                <GraduationCap className="h-3.5 w-3.5" /><span className="text-[9px] font-semibold leading-none">Level</span>
                              </button>
                              <button onClick={() => openWaModal(s)} className="flex flex-col items-center gap-0.5 px-1 py-1 rounded-lg text-white/40 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors" title="Message parent on WhatsApp">
                                <MessageSquare className="h-3.5 w-3.5" /><span className="text-[9px] font-semibold leading-none">WhatsApp</span>
                              </button>
                              <button onClick={() => resetPassword(s.enrollment_no, s.name)} className="flex flex-col items-center gap-0.5 px-1 py-1 rounded-lg text-white/40 hover:text-secondary hover:bg-white/5 transition-colors" title="Reset password">
                                <KeyRound className="h-3.5 w-3.5" /><span className="text-[9px] font-semibold leading-none">Password</span>
                              </button>
                              <button onClick={() => handleDeleteStudent(s.enrollment_no, s.name, s.center_id)} disabled={deletingStudEnroll === s.enrollment_no}
                                className="flex flex-col items-center gap-0.5 px-1 py-1 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40" title="Delete student">
                                {deletingStudEnroll === s.enrollment_no ? <span className="h-3.5 w-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin inline-block" /> : <Trash2 className="h-3.5 w-3.5" />}
                                <span className="text-[9px] font-semibold leading-none">Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="flex items-center justify-between px-1">
                <p className="text-white/30 text-xs">{filteredStudents.length} of {studTotal || filteredStudents.length} students loaded</p>
                {studHasMore && (
                  <button onClick={() => loadStudents(centerFilter, studPage + 1, true)} disabled={loadingMoreS}
                    className="flex items-center gap-2 text-secondary text-sm font-medium hover:text-secondary/80 transition-colors disabled:opacity-50">
                    {loadingMoreS && <span className="h-3.5 w-3.5 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />}
                    {loadingMoreS ? "Loading…" : "Load more"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── REPORTS ── */}
      {sub === "reports" && (
        <div className="space-y-6">
          {viewedReport && createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70">
              <div className="bg-gray-900 border border-white/15 rounded-2xl p-4 sm:p-6 max-w-lg w-full min-w-0 space-y-3 max-h-[calc(100dvh-1.5rem)] overflow-y-auto">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-white text-lg">Report Details</h3>
                  <button onClick={() => setViewReportId(null)} className="text-white/40 hover:text-white"><X className="h-5 w-5" /></button>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div><span className="text-white/40">Student</span><p className="text-white font-medium">{viewedReport.student_name || viewedReport.enrollment_no}</p></div>
                  <div><span className="text-white/40">Center</span><p className="text-white font-medium">{viewedReport.center_id}</p></div>
                  <div><span className="text-white/40">Date</span><p className="text-white font-medium">{viewedReport.report_date}</p></div>
                  <div><span className="text-white/40">Attendance</span><p className={`capitalize font-medium ${viewedReport.attendance === "present" ? "text-green-400" : "text-red-400"}`}>{viewedReport.attendance}</p></div>
                  <div><span className="text-white/40">Direct View</span><p className="text-white font-medium">{viewedReport.sw_direct_view}</p></div>
                  <div><span className="text-white/40">Indirect View</span><p className="text-white font-medium">{viewedReport.sw_indirect_view}</p></div>
                  <div><span className="text-white/40">Right/Left Hand Writing</span><p className="text-white font-medium">{viewedReport.sw_hand_writing ?? viewedReport.sw_right_hand_writing ?? 0}</p></div>
                  <div className="col-span-2 grid grid-cols-2 gap-3 pt-1">
                    <div className="rounded-xl border border-sky-400/20 bg-sky-500/[0.06] px-3 py-2.5">
                      <p className="text-sky-300 text-[10px] font-bold uppercase tracking-widest mb-1">Class Work</p>
                      <p className="text-white text-sm">Book A <b className="tabular-nums">{viewedReport.book_a_page ?? 0}</b> · Book B <b className="tabular-nums">{viewedReport.book_b_page ?? 0}</b></p>
                    </div>
                    <div className="rounded-xl border border-amber-400/20 bg-amber-500/[0.06] px-3 py-2.5">
                      <p className="text-amber-300 text-[10px] font-bold uppercase tracking-widest mb-1">Home Work</p>
                      <p className="text-white text-sm">Book A <b className="tabular-nums">{viewedReport.hw_book_a_page ?? 0}</b> · Book B <b className="tabular-nums">{viewedReport.hw_book_b_page ?? 0}</b></p>
                    </div>
                  </div>
                  {viewedReport.activity && <div className="col-span-2"><span className="text-white/40">Activity</span><p className="text-white">{viewedReport.activity}</p></div>}
                  <div><span className="text-white/40 text-xs">Created</span><p className="text-white/60 text-xs">{fmtDt(viewedReport.created_at)}</p></div>
                  {viewedReport.updated_at && <div><span className="text-white/40 text-xs">Updated</span><p className="text-white/60 text-xs">{fmtDt(viewedReport.updated_at)}</p></div>}
                </div>
              </div>
            </div>,
            document.body
          )}

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-lg flex items-center gap-2"><ClipboardList className="h-5 w-5 text-secondary" />
                {editReportId ? "Edit Report" : "Create Report"}
              </h2>
              {editReportId && (
                <button onClick={() => { setEditReportId(null); setReport({ ...BLANK_REPORT }); setReportMsg({ type: "", text: "" }); }}
                  className="flex items-center gap-1 text-white/40 hover:text-white text-sm">
                  <X className="h-4 w-4" /> Cancel
                </button>
              )}
            </div>
            {!editReportId ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Center" required>
                    <select value={rptCenterSel} onChange={e => { setRptCenterSel(e.target.value); setRptSelectedStudents([]); setReport(p => ({ ...p, enrollment_no: "" })); }} className={selectCls}>
                      <option value="" className="bg-gray-900">Select center…</option>
                      {centers.map(c => <option key={c.login_id} value={c.login_id} className="bg-gray-900">{c.login_id}</option>)}
                    </select>
                  </Field>
                </div>
                {rptCenterSel ? (
                  <BulkReportTable
                    students={rptStudentsByCtr.filter(s => (s.status || "active") === "active")}
                    saving={reportSaving}
                    onSubmit={handleBulkReportSubmit}
                    alert={<Alert type={reportMsg.type} msg={reportMsg.text} />}
                  />
                ) : (
                  <p className="text-white/35 text-sm">Select a center to load its students and mark reports for all of them at once.</p>
                )}
              </div>
            ) : (
            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Center" required>
                  <select value={rptCenterSel} disabled className={`${selectCls} opacity-50`}>
                    <option value={rptCenterSel} className="bg-gray-900">{centers.find(c => c.login_id === rptCenterSel)?.name || rptCenterSel}</option>
                  </select>
                </Field>
                <Field label="Date" required>
                  <input type="date" max={todayStr()} value={report.report_date} onChange={e => setReport(p => ({ ...p, report_date: e.target.value }))}
                    onClick={e => { try { e.target.showPicker?.(); } catch(_) {} }}
                    className={`${inputCls} cursor-pointer`} />
                </Field>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1.5">Student</label>
                <p className="px-3 py-2.5 bg-white/5 border border-white/15 rounded-xl text-sm text-white/70">
                  {rptStudentsByCtr.find(s => s.enrollment_no === report.enrollment_no)?.name || report.enrollment_no}
                  <span className="text-white/40 ml-1 text-xs">({report.enrollment_no})</span>
                </p>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1.5">Attendance</label>
                <div className="flex gap-2">
                  {["present","absent"].map(a => (
                    <button type="button" key={a} onClick={() => setReport(p => ({
                      ...p, attendance: a,
                      ...(a === "absent" ? {
                        sw_direct_view: 0, sw_indirect_view: 0,
                        sw_hand_writing: 0,
                        number_drop: 0, decimal_drop: 0,
                        book_a_page: 0, book_b_page: 0,
                        hw_book_a_page: 0, hw_book_b_page: 0, activity: "",
                      } : {}),
                    }))}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border capitalize transition-colors ${report.attendance === a ? (a === "present" ? "bg-green-500/20 border-green-400/40 text-green-300" : "bg-red-500/20 border-red-400/40 text-red-300") : "border-white/15 text-white/50 hover:text-white"}`}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              {report.attendance === "present" && (<>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[["Direct View", "sw_direct_view"],["Indirect View","sw_indirect_view"],["Right/Left Hand Writing","sw_hand_writing"]].map(([label,key]) => (
                  <Field key={key} label={label}>
                    <select value={report[key]} onChange={e => setReport(p => ({ ...p, [key]: e.target.value }))} className={selectCls}>
                      {SW_OPTS.map(v => <option key={v} value={v} className="bg-gray-900">{v}</option>)}
                    </select>
                  </Field>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-sky-400/20 bg-sky-500/[0.06] p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-lg bg-sky-500/15 text-sky-300 text-[10px] font-bold">CW</span>
                    <p className="text-sky-200 text-xs font-bold uppercase tracking-widest">Class Work</p>
                  </div>
                  <p className="text-white/35 text-[11px] mb-3">Pages completed in class</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[["Book A Page","book_a_page"],["Book B Page","book_b_page"]].map(([label,key]) => (
                      <Field key={key} label={label}>
                        <select value={report[key]} onChange={e => setReport(p => ({ ...p, [key]: e.target.value }))} className={selectCls}>
                          <option value={0} className="bg-gray-900">—</option>
                          {PAGE_OPTS.map(v => <option key={v} value={v} className="bg-gray-900">{v}</option>)}
                        </select>
                      </Field>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-amber-400/20 bg-amber-500/[0.06] p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-lg bg-amber-500/15 text-amber-300 text-[10px] font-bold">HW</span>
                    <p className="text-amber-200 text-xs font-bold uppercase tracking-widest">Home Work</p>
                  </div>
                  <p className="text-white/35 text-[11px] mb-3">Pages assigned for home</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[["Book A Page","hw_book_a_page"],["Book B Page","hw_book_b_page"]].map(([label,key]) => (
                      <Field key={key} label={label}>
                        <select value={report[key]} onChange={e => setReport(p => ({ ...p, [key]: e.target.value }))} className={selectCls}>
                          <option value={0} className="bg-gray-900">—</option>
                          {PAGE_OPTS.map(v => <option key={v} value={v} className="bg-gray-900">{v}</option>)}
                        </select>
                      </Field>
                    ))}
                  </div>
                </div>
              </div>
              <Field label="Activity / Notes">
                <textarea value={report.activity} onChange={e => setReport(p => ({ ...p, activity: e.target.value }))} rows={4}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-secondary/60" />
              </Field>
              </>)}
              <Alert type={reportMsg.type} msg={reportMsg.text} />
              <button type="submit" disabled={reportSaving}
                className="flex items-center gap-2 bg-secondary text-primary font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-secondary/90 transition-all disabled:opacity-60">
                {reportSaving ? <span className="h-4 w-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                {reportSaving ? "Saving…" : "Update Report"}
              </button>
            </form>
            )}
          </div>

          {/* Reports list */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-white font-bold flex items-center gap-2"><ClipboardList className="h-4 w-4 text-secondary" /> Recent Reports</h3>
              <div className="flex flex-wrap gap-2">
                <select value={rptFilterCenter} onChange={e => setRptFilterCenter(e.target.value)}
                  className="bg-white/5 border border-white/15 rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none focus:border-secondary/50">
                  <option value="" className="bg-gray-900">All centers</option>
                  {centers.map(c => <option key={c.login_id} value={c.login_id} className="bg-gray-900">{c.name}</option>)}
                </select>
                <input value={rptFilterEnroll} onChange={e => setRptFilterEnroll(e.target.value)} placeholder="Search student…"
                  className="bg-white/5 border border-white/15 rounded-xl px-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-secondary/50 w-36" />
                <div className="flex items-center gap-1.5">
                  <input type="date" value={rptFilterFrom} max={rptFilterTo || undefined} onChange={e => setRptFilterFrom(e.target.value)}
                    onClick={e => { try { e.target.showPicker?.(); } catch(_) {} }}
                    title="Show reports from this date"
                    className="bg-white/5 border border-white/15 rounded-xl px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-secondary/50 [color-scheme:dark] cursor-pointer" />
                  <span className="text-white/30 text-xs">to</span>
                  <input type="date" value={rptFilterTo} min={rptFilterFrom || undefined} onChange={e => setRptFilterTo(e.target.value)}
                    onClick={e => { try { e.target.showPicker?.(); } catch(_) {} }}
                    title="Show reports up to this date"
                    className="bg-white/5 border border-white/15 rounded-xl px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-secondary/50 [color-scheme:dark] cursor-pointer" />
                </div>
                {(rptFilterFrom || rptFilterTo) && (
                  <button onClick={() => { setRptFilterFrom(""); setRptFilterTo(""); }}
                    className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/15 text-white/60 hover:text-white text-xs font-semibold transition-colors">
                    Clear dates
                  </button>
                )}
                <button onClick={exportReportsCsv} disabled={exporting === "reports"}
                  className="flex items-center gap-2 bg-white/5 border border-white/15 text-white/70 hover:text-white font-semibold px-3 py-2 rounded-xl text-xs hover:border-white/30 transition-all disabled:opacity-50">
                  {exporting === "reports" ? <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  Export CSV
                </button>
                <button onClick={loadAllReports} className="p-2 rounded-xl hover:bg-white/8 text-white/40 hover:text-white transition-colors"><RefreshCw className="h-4 w-4" /></button>
              </div>
            </div>
            {filteredReports.length === 0 ? (
              <p className="text-white/30 text-sm">No reports found.</p>
            ) : (
              <div className="space-y-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-white/8 text-white/40 text-xs uppercase tracking-wide">
                      <th className="text-left px-2 py-2">Date</th>
                      <th className="text-left px-2 py-2">Student</th>
                      <th className="text-left px-2 py-2 hidden sm:table-cell">Center</th>
                      <th className="text-left px-2 py-2">Attend.</th>
                      <th className="text-left px-2 py-2">SW D/I/H</th>
                      <th className="text-left px-2 py-2 hidden sm:table-cell">Pages</th>
                      <th className="text-left px-2 py-2 hidden md:table-cell">Submitted</th>
                      <th className="text-left px-2 py-2">Actions</th>
                    </tr></thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredReports.map(r => (
                        <tr key={r.id} className="hover:bg-white/3 transition-colors">
                          <td className="px-2 py-2 text-white/70 whitespace-nowrap">{r.report_date}</td>
                          <td className="px-2 py-2 text-white/80 whitespace-nowrap">{r.student_name || r.enrollment_no}</td>
                          <td className="px-2 py-2 text-white/50 hidden sm:table-cell">{r.center_id}</td>
                          <td className="px-2 py-2">
                            <span className={`px-1.5 py-0.5 rounded text-xs capitalize ${r.attendance === "present" ? "bg-green-500/15 text-green-300" : "bg-red-500/15 text-red-300"}`}>{r.attendance}</span>
                          </td>
                          <td className="px-2 py-2 text-white/60">{r.sw_direct_view}/{r.sw_indirect_view}/{r.sw_hand_writing ?? r.sw_right_hand_writing ?? 0}</td>
                          <td className="px-2 py-2 whitespace-nowrap hidden sm:table-cell">
                            <span className="inline-flex items-center gap-1 mr-1.5 px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 text-xs">
                              <b className="text-[9px] tracking-wide">CW</b> A{r.book_a_page ?? 0} · B{r.book_b_page ?? 0}
                            </span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 text-xs">
                              <b className="text-[9px] tracking-wide">HW</b> A{r.hw_book_a_page ?? 0} · B{r.hw_book_b_page ?? 0}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-white/30 text-xs whitespace-nowrap hidden md:table-cell">
                            {fmtDt(r.created_at)}
                            {r.updated_at && <span className="block text-secondary/60">↻ {fmtDt(r.updated_at)}</span>}
                          </td>
                          <td className="px-2 py-2">
                            <div className="flex items-center gap-1">
                              <button onClick={() => setViewReportId(r.id)} className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-secondary" title="View"><Eye className="h-3.5 w-3.5" /></button>
                              <button onClick={() => {
                                setEditReportId(r.id);
                                setRptCenterSel(r.center_id);
                                setReport({ enrollment_no: r.enrollment_no, report_date: r.report_date, attendance: r.attendance, sw_direct_view: r.sw_direct_view, sw_indirect_view: r.sw_indirect_view, sw_hand_writing: r.sw_hand_writing ?? r.sw_right_hand_writing ?? 0, number_drop: r.number_drop, decimal_drop: r.decimal_drop, book_a_page: r.book_a_page ?? 0, book_b_page: r.book_b_page ?? 0, hw_book_a_page: r.hw_book_a_page ?? 0, hw_book_b_page: r.hw_book_b_page ?? 0, activity: r.activity || "" });
                                setReportMsg({ type: "", text: "" });
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }} className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-secondary" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                              <button onClick={() => deleteReport(r)} disabled={deletingReportId === r.id}
                                className="p-1 rounded hover:bg-red-500/15 text-white/40 hover:text-red-400 disabled:opacity-50" title="Delete">
                                {deletingReportId === r.id ? <span className="h-3.5 w-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin inline-block" /> : <Trash2 className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between px-1">
                  <p className="text-white/30 text-xs">{filteredReports.length} of {rptTotal || filteredReports.length} reports loaded</p>
                  {rptHasMore && (
                    <button onClick={() => loadAllReports(rptPage + 1, true)} disabled={loadingMoreRpt}
                      className="flex items-center gap-2 text-secondary text-sm font-medium hover:text-secondary/80 transition-colors disabled:opacity-50">
                      {loadingMoreRpt && <span className="h-3.5 w-3.5 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />}
                      {loadingMoreRpt ? "Loading…" : "Load more"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── VIDEOS ── */}
      {sub === "videos" && (
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <h2 className="text-white font-bold text-lg flex items-center gap-2"><Upload className="h-5 w-5 text-secondary" /> Upload Learning Video</h2>
            <p className="text-white/50 text-sm">Videos auto-delete 7 days after upload.</p>
            <form onSubmit={handleVideoUpload} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Center" required>
                  <select value={vidCenterSel} onChange={e => { setVidCenterSel(e.target.value); setVidStudents([]); }} className={selectCls}>
                    <option value="" className="bg-gray-900">Select center…</option>
                    {centers.map(c => <option key={c.login_id} value={c.login_id} className="bg-gray-900">{c.login_id}</option>)}
                  </select>
                </Field>
                <Field label="Title">
                  <input value={vidTitle} onChange={e => setVidTitle(e.target.value)} placeholder="e.g. Abacus Level 1 – Lesson 3" className={inputCls} />
                </Field>
              </div>
              <Field label="Video File" required>
                <label className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white/70 text-sm px-4 py-2.5 rounded-xl border border-white/15 transition-colors cursor-pointer w-fit">
                  <Upload className="h-4 w-4" />
                  {vidFile ? vidFile.name : "Choose video (MP4, WEBM, MOV…)"}
                  <input ref={vidFileRef} type="file" accept="video/*" className="hidden" onChange={e => {
                    const f = e.target.files[0];
                    if (f && !f.type.startsWith("video/")) {
                      setVidMsg({ type: "error", text: "Only video files are allowed (MP4, WEBM, MOV…)" });
                      setVidFile(null); e.target.value = "";
                      return;
                    }
                    setVidMsg({ type: "", text: "" }); setVidFile(f);
                  }} />
                </label>
              </Field>
              {vidCenterSel && (
                <Field label="Select Students" required>
                  <StudentMultiSelect
                    students={vidStudentsByCtr}
                    selected={vidStudents}
                    onChange={setVidStudents}
                    placeholder="Select students…"
                    emptyText="No students in this center"
                  />
                </Field>
              )}
              <Alert type={vidMsg.type} msg={vidMsg.text} />
              {vidSaving && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-white/50">
                    <span>{vidProgress < 100 ? "Uploading video…" : "Processing…"}</span>
                    <span className="font-mono">{vidProgress}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-secondary rounded-full transition-all duration-300" style={{ width: `${vidProgress}%` }} />
                  </div>
                </div>
              )}
              <button type="submit" disabled={vidSaving}
                className="flex items-center gap-2 bg-secondary text-primary font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-secondary/90 transition-all disabled:opacity-60">
                {vidSaving ? <span className="h-4 w-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" /> : <Upload className="h-4 w-4" />}
                {vidSaving ? "Uploading…" : "Upload Video"}
              </button>
            </form>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-white font-bold flex items-center gap-2"><Video className="h-4 w-4 text-secondary" /> Uploaded Videos</h3>
              <div className="flex items-center gap-2">
                <select value={vidListCenter} onChange={e => setVidListCenter(e.target.value)} className={selectCls + " !w-auto"}>
                  <option value="" className="bg-gray-900">All centers</option>
                  {centers.map(c => <option key={c.login_id} value={c.login_id} className="bg-gray-900">{c.login_id}</option>)}
                </select>
                <button onClick={loadVideos} className="p-2 rounded-xl hover:bg-white/8 text-white/40 hover:text-white transition-colors"><RefreshCw className="h-4 w-4" /></button>
              </div>
            </div>
            <VideoLibrary
              videos={vidListCenter ? videos.filter(v => v.center_id === vidListCenter) : videos}
              showCenter
              onDelete={v => setDeleteTarget({
                type: "video", video_id: v.id, title: "Delete Video",
                subtitle: "Are you sure you want to permanently remove this video?",
                rows: [["Title", v.title], ["Center", v.center_id], ["Students", String((v.recipients || []).length)]],
              })} />
          </div>
        </div>
      )}

      {/* ── EVENTS ── */}
      {sub === "events" && (
        <div className="space-y-6">
          {/* Template upload */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-white font-bold text-lg mb-1 flex items-center gap-2"><Calendar className="h-5 w-5 text-secondary" /> Event Registration Template</h2>
            <p className="text-white/40 text-sm mb-4">Upload the registration Excel template. Franchises will download this file, fill it, and upload it back from their portal.</p>
            <form onSubmit={handleEventTemplateUpload} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Event Name" required>
                  <input value={evName} onChange={e => setEvName(e.target.value)} placeholder="e.g. NLC 2026 — National Level Competition" className={inputCls} required />
                </Field>
                <Field label="Template File (XLSX)" required>
                  <label className="flex items-center gap-2 bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 text-sm cursor-pointer hover:border-secondary/50 transition-colors">
                    <FileText className="h-4 w-4 text-white/40 flex-shrink-0" />
                    <span className="truncate text-white/70">{evFile ? evFile.name : "Choose template (.xlsx / .xls / .csv)"}</span>
                    <input ref={evFileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => setEvFile(e.target.files[0])} />
                  </label>
                </Field>
              </div>
              <Alert type={evMsg.type} msg={evMsg.text} />
              <button type="submit" disabled={evSaving}
                className="flex items-center gap-2 bg-secondary text-primary font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-secondary/90 transition-all disabled:opacity-60">
                {evSaving ? <span className="h-4 w-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" /> : <Upload className="h-4 w-4" />}
                {evSaving ? "Publishing…" : (evTmpl ? "Replace Template" : "Publish Template")}
              </button>
            </form>
            {evTmpl && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 bg-white/3 border border-white/10 rounded-xl px-4 py-3">
                <div className="min-w-0">
                  <p className="text-white font-medium truncate">{evTmpl.event_name}</p>
                  <p className="text-white/40 text-xs mt-0.5">Current template: {evTmpl.original_name} · Updated {fmtDt(evTmpl.uploaded_at)}</p>
                </div>
                <button onClick={downloadEventFile}
                  className="flex items-center gap-1.5 text-secondary text-sm font-semibold hover:underline flex-shrink-0">
                  <Download className="h-4 w-4" /> Download
                </button>
              </div>
            )}
          </div>

          {/* Franchise submissions */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-white font-bold flex items-center gap-2"><ClipboardList className="h-4 w-4 text-secondary" /> Franchise Submissions</h3>
              <div className="flex items-center gap-2">
                <select value={evCenterFilter} onChange={e => setEvCenterFilter(e.target.value)} className={selectCls + " !w-auto"}>
                  <option value="" className="bg-gray-900">All centers</option>
                  {centers.map(c => <option key={c.login_id} value={c.login_id} className="bg-gray-900">{c.login_id}</option>)}
                </select>
                <button onClick={loadEventData} className="p-2 rounded-xl hover:bg-white/8 text-white/40 hover:text-white transition-colors"><RefreshCw className="h-4 w-4" /></button>
              </div>
            </div>
            {(() => {
              const shown = evCenterFilter ? evRegs.filter(r => r.center_id === evCenterFilter) : evRegs;
              const totalRegs = shown.reduce((a, r) => a + (r.count || 0), 0);
              if (shown.length === 0) return (
                <div className="py-8 text-center text-white/30"><ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-40" /><p className="text-sm">No submissions yet.</p></div>
              );
              return (
                <>
                  <p className="text-white/40 text-xs">{shown.length} file(s) · {totalRegs} registration(s) total</p>
                  <div className="space-y-3">
                    {shown.map(r => (
                      <div key={r.id} className="bg-white/3 border border-white/10 rounded-xl overflow-hidden">
                        <div className="flex items-start justify-between px-4 py-3 gap-3">
                          <div className="min-w-0">
                            <p className="text-white font-medium truncate">{r.event_name} <span className="text-secondary font-mono text-xs ml-1">{r.center_id}</span></p>
                            <p className="text-white/40 text-xs mt-0.5">{r.original_name} · {r.count} registration(s) · Uploaded {fmtDt(r.uploaded_at)}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {r.count > 0 && (
                              <>
                                <button onClick={() => setEvExpanded(evExpanded === r.id ? null : r.id)}
                                  className="p-2 rounded-lg text-white/40 hover:text-secondary hover:bg-secondary/10 transition-colors" title="View details">
                                  {evExpanded === r.id ? <ChevronUp className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                                <FullscreenButton onClick={() => setEvFullId(r.id)} />
                              </>
                            )}
                            <button onClick={() => downloadEventFile(r)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors" title="Download file">
                              <Download className="h-4 w-4" />
                            </button>
                            <button onClick={() => setDeleteTarget({
                                type: "eventreg", reg_id: r.id, title: "Delete Submission",
                                subtitle: "Permanently remove this uploaded registration file?",
                                rows: [["Event", r.event_name], ["Center", r.center_id], ["Registrations", String(r.count)]],
                              })}
                              className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        {evExpanded === r.id && r.headers && (
                          <div className="border-t border-white/10 overflow-x-auto max-h-80 overflow-y-auto">
                            <EventRegTable reg={r}
                              onDeleteRows={idxs => handleEventRowsDelete(r.id, idxs)}
                              deleting={evRowDeleting === r.id} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>

          {evFullId && (() => {
            const reg = evRegs.find(r => r.id === evFullId);
            return (
              <EventRegFullscreen
                reg={reg}
                subtitle={reg ? `Center: ${reg.center_id}` : ""}
                onClose={() => setEvFullId(null)}
                onDeleteRows={idxs => handleEventRowsDelete(evFullId, idxs)}
                deleting={evRowDeleting === evFullId} />
            );
          })()}
        </div>
      )}

      {/* ── NOTIFICATIONS ── */}
      {sub === "notifications" && (
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2"><Send className="h-5 w-5 text-secondary" /> Send Notification</h2>
            <form onSubmit={sendNotification} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Audience">
                  <select value={scope} onChange={e => setScope(e.target.value)} className={selectCls}>
                    <option value="all_centers" className="bg-gray-900">All centers</option>
                    <option value="all_students" className="bg-gray-900">All students</option>
                    <option value="center_students" className="bg-gray-900">Students of one center</option>
                  </select>
                </Field>
                {scope === "center_students" && (
                  <Field label="Center">
                    <select value={targetCenter} onChange={e => { setTargetCenter(e.target.value); setNStudentsSel([]); }} className={selectCls}>
                      <option value="" className="bg-gray-900">Select center…</option>
                      {centers.map(c => <option key={c.login_id} value={c.login_id} className="bg-gray-900">{c.login_id}</option>)}
                    </select>
                  </Field>
                )}
              </div>
              {scope === "center_students" && targetCenter && (() => {
                const ctrStudents = students.filter(s => s.center_id === targetCenter);
                if (ctrStudents.length === 0) return <p className="text-white/30 text-sm">No students in this center.</p>;
                const allSelected = nStudentsSel.length === 0;
                return (
                  <div className="bg-black/20 border border-white/10 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-white/60 text-[11px] font-bold uppercase tracking-wider">Recipients</p>
                      <button type="button" onClick={() => setNStudentsSel([])}
                        className={`text-xs font-semibold ${allSelected ? "text-secondary" : "text-white/40 hover:text-white"}`}>
                        All students ({ctrStudents.length})
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                      {ctrStudents.map(s => {
                        const checked = nStudentsSel.includes(s.enrollment_no);
                        return (
                          <label key={s.enrollment_no} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors text-sm ${checked ? "border-secondary/50 bg-secondary/10 text-white" : "border-white/10 bg-white/5 text-white/70 hover:border-white/25"}`}>
                            <input type="checkbox" checked={checked} className="accent-[#22d3ee] h-3.5 w-3.5"
                              onChange={() => setNStudentsSel(prev => checked ? prev.filter(en => en !== s.enrollment_no) : [...prev, s.enrollment_no])} />
                            <span className="truncate">{s.name}</span>
                            <span className="ml-auto font-mono text-[10px] text-white/35">{s.enrollment_no}</span>
                          </label>
                        );
                      })}
                    </div>
                    <p className="text-white/30 text-xs">
                      {allSelected ? "Sending to all students of this center. Tick students to send only to specific ones." : `Sending to ${nStudentsSel.length} selected student(s).`}
                    </p>
                  </div>
                );
              })()}
              <Field label="Title (optional)">
                <input value={nTitle} onChange={e => setNTitle(e.target.value)} placeholder="Title" className={inputCls} />
              </Field>
              <Field label="Message" required>
                <textarea value={nMsg} onChange={e => setNMsg(e.target.value)} rows={3} placeholder="Write your message…"
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-secondary/60" />
              </Field>
              <Alert type={nResult.type} msg={nResult.text} />
              <button type="submit" disabled={sending}
                className="flex items-center gap-2 bg-secondary text-primary font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-secondary/90 transition-all disabled:opacity-60">
                {sending ? <span className="h-4 w-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" /> : <Send className="h-4 w-4" />}
                {sending ? "Sending…" : "Send"}
              </button>
            </form>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold flex items-center gap-2"><Bell className="h-4 w-4 text-secondary" /> Recent Notifications</h3>
              <button onClick={loadHistory} className="p-2 rounded-xl hover:bg-white/8 text-white/40 hover:text-white transition-colors"><RefreshCw className="h-4 w-4" /></button>
            </div>
            {history.length === 0 ? <p className="text-white/30 text-sm">No notifications sent yet.</p> : (
              <div className="space-y-3">
                {history.map(n => (
                  <div key={n.id} className="bg-white/3 border border-white/10 rounded-xl px-4 py-3">
                    {n.title && <p className="text-white font-medium">{n.title}</p>}
                    <p className="text-white/70 text-sm whitespace-pre-wrap">{n.message}</p>
                    <p className="text-white/30 text-xs mt-1">
                      {n.sender_role === "admin" ? "Admin" : `Center ${n.sender_id}`}
                      · {n.scope.replace(/_/g, " ")}
                      {n.target_center_id ? ` (${n.target_center_id})` : ""}
                      · {fmtDt(n.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── AUDIT LOG ── */}
      {sub === "audit" && (
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-secondary" />
                <h2 className="text-white font-bold text-lg">Audit Log</h2>
              </div>
              <span className="text-white/30 text-sm">{auditTotal} events</span>
              <button onClick={() => loadAudit(1)} disabled={auditLoading}
                className="ml-auto p-2 rounded-xl hover:bg-white/8 text-white/40 hover:text-white transition-colors">
                <RefreshCw className={`h-4 w-4 ${auditLoading ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
              <select value={auditAction} onChange={e => setAuditAction(e.target.value)}
                className={`${selectCls} text-xs`}>
                <option value="" className="bg-gray-900">All Actions</option>
                <option value="login" className="bg-gray-900">Login</option>
                <option value="password_changed" className="bg-gray-900">Password Changed</option>
                <option value="center_created" className="bg-gray-900">Center Created</option>
                <option value="center_deleted" className="bg-gray-900">Center Deleted</option>
                <option value="center_pw_reset" className="bg-gray-900">Center PW Reset</option>
                <option value="student_created" className="bg-gray-900">Student Created</option>
                <option value="student_updated" className="bg-gray-900">Student Updated</option>
                <option value="student_deleted" className="bg-gray-900">Student Deleted</option>
                <option value="bulk_upload" className="bg-gray-900">Bulk Upload</option>
                <option value="report_submitted" className="bg-gray-900">Report Submitted</option>
                <option value="report_updated" className="bg-gray-900">Report Updated</option>
                <option value="video_uploaded" className="bg-gray-900">Video Uploaded</option>
                <option value="video_deleted" className="bg-gray-900">Video Deleted</option>
                <option value="notification_sent" className="bg-gray-900">Notification Sent</option>
                <option value="student_profile_updated" className="bg-gray-900">Student Self-Edit</option>
              </select>
              <select value={auditRole} onChange={e => setAuditRole(e.target.value)}
                className={`${selectCls} text-xs`}>
                <option value="" className="bg-gray-900">All Roles</option>
                <option value="admin" className="bg-gray-900">Admin</option>
                <option value="franchise" className="bg-gray-900">Franchise</option>
                <option value="student" className="bg-gray-900">Student</option>
              </select>
              <input type="text" placeholder="Search actor / target…" value={auditSearch} onChange={e => setAuditSearch(e.target.value)}
                className={`${inputCls} text-xs`} />
              <input type="date" value={auditFrom} onChange={e => setAuditFrom(e.target.value)}
                onClick={e => { try { e.target.showPicker?.(); } catch(_) {} }}
                className={`${inputCls} text-xs cursor-pointer`} />
              <input type="date" value={auditTo} onChange={e => setAuditTo(e.target.value)}
                onClick={e => { try { e.target.showPicker?.(); } catch(_) {} }}
                className={`${inputCls} text-xs cursor-pointer`} />
            </div>
            <button onClick={() => loadAudit(1)} disabled={auditLoading}
              className="mb-5 px-4 py-2 rounded-xl bg-secondary text-primary text-sm font-bold flex items-center gap-2 hover:bg-secondary/90 transition-all disabled:opacity-60">
              <Filter className="h-3.5 w-3.5" /> Apply Filters
            </button>

            {/* Timeline */}
            {auditLoading && <div className="text-center py-12 text-white/30 text-sm"><RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" /> Loading…</div>}
            {!auditLoading && auditLogs.length === 0 && (
              <div className="text-center py-16 text-white/25">
                <Activity className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No audit events yet.</p>
                <p className="text-xs mt-1">Actions in the Franchise & Student portals will appear here.</p>
              </div>
            )}
            {!auditLoading && auditLogs.length > 0 && (
              <div className="space-y-2">
                {auditLogs.map(log => {
                  const cfg = AUDIT_ACTION_CONFIG[log.action] || { icon: Activity, color: "text-white/50", bg: "bg-white/5" };
                  const Icon = cfg.icon;
                  return (
                    <div key={log.id} className="flex items-center gap-3 border border-white/6 rounded-xl px-4 py-3 hover:bg-white/2 hover:border-white/12 transition-all">
                      <div className={`h-8 w-8 rounded-full ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`h-4 w-4 ${cfg.color}`} />
                      </div>
                      <p className="flex-1 min-w-0 text-white/80 text-sm leading-snug break-words">
                        <span className="font-semibold text-secondary">{auditActor(log)}</span>
                        <span className="text-white/70"> has {auditPredicate(log)}</span>
                      </p>
                      <span className="text-white/25 text-xs flex-shrink-0 whitespace-nowrap">{fmtDt(log.created_at)}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {auditTotal > 50 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/8">
                <p className="text-white/30 text-xs">Page {auditPage} of {Math.ceil(auditTotal / 50)} · {auditTotal} total</p>
                <div className="flex gap-2">
                  <button onClick={() => loadAudit(auditPage - 1)} disabled={auditPage <= 1 || auditLoading}
                    className="px-3 py-1.5 text-xs rounded-lg border border-white/15 text-white/50 hover:text-white hover:border-white/30 disabled:opacity-30 transition-colors">Prev</button>
                  <button onClick={() => loadAudit(auditPage + 1)} disabled={auditPage >= Math.ceil(auditTotal / 50) || auditLoading}
                    className="px-3 py-1.5 text-xs rounded-lg border border-white/15 text-white/50 hover:text-white hover:border-white/30 disabled:opacity-30 transition-colors">Next</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        target={deleteTarget}
        loading={deletingStudEnroll !== "" || deletingCenterId !== null || deletingReportId !== null}
        onConfirm={executeDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ResetPasswordModal
        target={resetPwTarget}
        value={resetPwValue}
        onChange={setResetPwValue}
        saving={resetPwSaving}
        msg={resetPwMsg}
        onConfirm={executeResetPassword}
        onCancel={() => { setResetPwTarget(null); setResetPwValue(""); setResetPwMsg(""); }}
      />

      <StudentDetailModal student={viewStudent} onClose={() => setViewStudent(null)} />

      {promoteStudent && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => !promoteSaving && setPromoteStudent(null)}>
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-white flex items-center gap-2"><GraduationCap className="h-5 w-5 text-secondary" /> Change Level</h3>
              <button onClick={() => setPromoteStudent(null)} className="p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-sm text-white/60 mb-1">{promoteStudent.name}</p>
            <p className="text-xs text-white/40 font-mono mb-4">{promoteStudent.enrollment_no} · current: <span className="text-white/70">{promoteStudent.level || "—"}</span></p>
            <label className="block text-white/60 text-[11px] font-bold uppercase tracking-wider mb-2">New Level</label>
            <select value={promoteLevel} onChange={e => setPromoteLevel(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-secondary/50 mb-4">
              <option value="" className="bg-gray-900">Select…</option>
              {LEVELS.map(l => <option key={l} value={l} className="bg-gray-900">{l}</option>)}
            </select>
            {promoteErr && <p className="text-rose-400 text-sm mb-3">{promoteErr}</p>}
            <div className="flex justify-end gap-3">
              <button onClick={() => setPromoteStudent(null)} className="px-4 py-2 rounded-xl border border-white/15 text-white/60 hover:text-white text-sm font-medium transition-colors">Cancel</button>
              <button onClick={handlePromote} disabled={promoteSaving || !promoteLevel || promoteLevel === promoteStudent.level}
                className="px-5 py-2 bg-secondary text-[#081b30] font-bold rounded-xl hover:bg-secondary/90 transition-all disabled:opacity-50 text-sm flex items-center gap-2">
                {promoteSaving && <span className="h-4 w-4 border-2 border-[#081b30]/40 border-t-[#081b30] rounded-full animate-spin" />}
                Save Level
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {historyStudent && <StudentHistoryModal student={historyStudent} onClose={() => setHistoryStudent(null)}
        fetchReports={en => adminFetch(`portal_reports.php?enrollment_no=${encodeURIComponent(en)}`)} />}

      <WhatsAppModal student={waStudent} onClose={() => setWaStudent(null)} />
    </div>
  );
}
