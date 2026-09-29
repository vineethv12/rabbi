import { useState, useEffect, useRef, Fragment } from "react";
import { createPortal } from "react-dom";
import { StudentTemplate } from "../components/portal/StudentTemplate.jsx";
import { useStudentLevels } from "../hooks/useStudentLevels.js";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  LogOut, Plus, Upload, Download, Users, CheckCircle, UserCheck,
  Pencil, X, AlertCircle, Building2, Search, RefreshCw, ClipboardList,
  Video, Bell, Trash2, Send, FileText, Image as ImageIcon, Eye, EyeOff, ChevronDown, ChevronUp,
  MoreVertical, Calendar, LayoutGrid, Activity, BookOpen, MessageSquare,
  GraduationCap, Cake, Heart, KeyRound, UserCircle, Save
} from "lucide-react";
import { StudentMultiSelect } from "../components/portal/StudentMultiSelect.jsx";
import { BulkReportTable } from "../components/portal/BulkReportTable.jsx";
import { VideoLibrary } from "../components/portal/VideoLibrary.jsx";
import { WhatsAppModal } from "../components/portal/WhatsAppModal.jsx";
import { StudentHistoryModal } from "../components/portal/StudentHistoryModal.jsx";
import { EventRegTable, EventRegFullscreen, FullscreenButton } from "../components/portal/EventRegDetails.jsx";

const API_BASE = "/api";

function getToken() { return sessionStorage.getItem("rga_portal_token") || ""; }
function getName()  { return sessionStorage.getItem("rga_portal_name")  || ""; }
function getCenterId() { return sessionStorage.getItem("rga_portal_center_id") || ""; }

async function apiFetch(path, opts = {}) {
  const headers = { ...(opts.headers || {}), Authorization: `Bearer ${getToken()}` };
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

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const GENDERS = ["Male", "Female", "Other"];
const STATUS_OPTIONS = ["active", "inactive", "completed"];
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
    ["Joined", fmtDt(s.join_date || s.created_at)],
  ];
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75" onClick={onClose}>
      <div className="bg-gray-900 border border-white/15 rounded-2xl max-w-lg w-full min-w-0 max-h-[calc(100dvh-1.5rem)] sm:max-h-[85dvh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-gray-900 border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {s.photo ? (
              <img src={`/uploads/students/${s.photo}`} alt={s.name} className="h-11 w-11 rounded-full object-cover border border-white/15" />
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
        </div>
      </div>
    </div>,
    document.body
  );
}

const STATUS_COLORS = {
  active:    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  inactive:  "bg-amber-500/10 text-amber-400 border-amber-500/20",
  completed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

const BLANK_STUDENT = {
  name: "", father_name: "", mother_contact: "", dob: "", mobile: "",
  anniversary: "", email: "", address: "", blood_group: "", gender: "",
  level: "", reg_no: "", parent_name: "", parent_contact: "", notes: "", status: "active",
  password: "",
};

const todayStr = () => new Date().toISOString().slice(0, 10);
const SW_OPTS = Array.from({ length: 201 }, (_, i) => parseFloat((i * 0.1).toFixed(1)));
const PAGE_OPTS = Array.from({ length: 100 }, (_, i) => i + 1);

const BLANK_REPORT = {
  enrollment_no: "", report_date: todayStr(), attendance: "present",
  sw_direct_view: 0, sw_indirect_view: 0, sw_hand_writing: 0,
  number_drop: 0, decimal_drop: 0,
  book_a_page: 0, book_b_page: 0, hw_book_a_page: 0, hw_book_b_page: 0, activity: "",
};

function fmtDt(s) {
  if (!s) return "—";
  try { return new Date(s.replace(" ", "T")).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch { return s; }
}

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

function ConfirmDeleteModal({ target, loading, onConfirm, onCancel }) {
  if (!target) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050f1d]/80 backdrop-blur-sm">
      <div className="bg-[#0f1c2e] border border-rose-500/20 rounded-2xl p-4 sm:p-6 max-w-sm w-full max-h-[calc(100dvh-2rem)] overflow-y-auto space-y-6 shadow-2xl shadow-rose-900/20">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="h-14 w-14 rounded-full bg-rose-500/10 flex items-center justify-center flex-shrink-0 border border-rose-500/20">
            <Trash2 className="h-7 w-7 text-rose-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-xl tracking-tight">{target.title}</h3>
            <p className="text-white/50 text-sm mt-1">{target.subtitle}</p>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 space-y-2">
          {target.rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between text-sm">
              <span className="text-white/40">{label}</span>
              <span className="text-white font-medium text-right max-w-[60%] truncate" title={value}>{value}</span>
            </div>
          ))}
        </div>
        <p className="flex items-start gap-2 text-rose-400/80 text-[13px] leading-snug bg-rose-500/5 border border-rose-500/10 rounded-xl px-3 py-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          This action is permanent and cannot be undone.
        </p>
        <div className="flex gap-3 pt-2">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-rose-500 border border-rose-400 text-white hover:bg-rose-600 transition-all text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 disabled:opacity-60">
            {loading ? <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function TextField({ label, value, onChange, type = "text", placeholder = "", required, max }) {
  return (
    <div>
      <label className="block text-white/60 text-[11px] font-bold uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-secondary ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        max={max}
        onClick={type === "date" ? e => { try { e.target.showPicker?.(); } catch(_) {} } : undefined}
        className="w-full bg-[#081b30]/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/50 transition-all cursor-pointer hover:border-white/20"
      />
    </div>
  );
}

function PasswordField({ label, value, onChange, required, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-white/60 text-[11px] font-bold uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-secondary ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-[#081b30]/50 border border-white/10 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/50 transition-all hover:border-white/20"
        />
        <button type="button" onClick={() => setShow(v => !v)} tabIndex={-1}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-secondary transition-colors"
          title={show ? "Hide password" : "Show password"}>
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options, required }) {
  return (
    <div>
      <label className="block text-white/60 text-[11px] font-bold uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-secondary ml-1">*</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          className="w-full bg-[#081b30]/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/50 transition-all appearance-none hover:border-white/20"
        >
          {options}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
      </div>
    </div>
  );
}

function PwCell({ value, onSet }) {
  const [show, setShow] = useState(false);
  if (!value) return (
    <button type="button" onClick={onSet}
      className="inline-flex items-center gap-1 text-[11px] font-medium text-secondary/70 hover:text-secondary transition-colors"
      title="Password was created before viewing was added. Set a new one to make it viewable.">
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

export function FranchiseDashboard() {
  const { levels, levelsError, levelsLoading, reloadLevels } = useStudentLevels(() => ({ Authorization: `Bearer ${getToken()}` }));
  const LEVELS = levels.map(level => level.name);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "students";
  function setTab(newTab) { setSearchParams({ tab: newTab }, { replace: false }); }
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [fetchErr, setFetchErr] = useState("");
  const [search, setSearch]     = useState("");

  // Add / edit student
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(BLANK_STUDENT);
  const [editEnroll, setEditEnroll] = useState("");
  const [photoFile, setPhotoFile]   = useState(null);
  const [waStudent, setWaStudent]   = useState(null);
  const [historyStudent, setHistoryStudent] = useState(null);
  const [viewStudent, setViewStudent] = useState(null);

  // ── Level promotion ──
  const [promoteStudent, setPromoteStudent] = useState(null);
  const [promoteLevel, setPromoteLevel] = useState("");
  const [promoteSaving, setPromoteSaving] = useState(false);
  const [promoteErr, setPromoteErr] = useState("");

  const [studVisible, setStudVisible] = useState(20);
  const [rptVisible, setRptVisible]   = useState(20);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [editingStudentPhoto, setEditingStudentPhoto] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formMsg, setFormMsg]   = useState({ type: "", text: "" });
  const photoRef = useRef();

  // Upload
  const [uploadFile, setUploadFile]     = useState(null);
  const [uploading, setUploading]       = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadMsg, setUploadMsg]       = useState({ type: "", text: "" });
  const fileRef = useRef();
  const [deletingEnroll, setDeletingEnroll] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [videoDeleteTarget, setVideoDeleteTarget] = useState(null);
  const [deletingVideoId, setDeletingVideoId] = useState(null);
  const [localReadIds, setLocalReadIds] = useState(new Set());

  // Reports
  const [report, setReport]             = useState(BLANK_REPORT);
  const [editReportId, setEditReportId] = useState(null);
  const [reportSaving, setReportSaving] = useState(false);
  const [reportMsg, setReportMsg]       = useState({ type: "", text: "" });
  const [recentReports, setRecentReports] = useState([]);
  const [viewReportId, setViewReportId] = useState(null);
  const [deletingReportId, setDeletingReportId] = useState(null);
  const [rptStudentFilter, setRptStudentFilter] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileFile, setProfileFile] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  // Profile tab (details editing)
  const [profDetails, setProfDetails] = useState({ name: "", email: "", whatsapp: "" });
  const [profDetSaving, setProfDetSaving] = useState(false);
  const [profDetMsg, setProfDetMsg] = useState({ type: "", text: "" });
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwFormMsg, setPwFormMsg] = useState({ type: "", text: "" });
  const [rptDateFrom, setRptDateFrom] = useState("");
  const [rptDateTo, setRptDateTo] = useState("");
  const [rptSelectedStudents, setRptSelectedStudents] = useState([]);

  // Videos
  const [videos, setVideos]       = useState([]);
  const [vidTitle, setVidTitle]   = useState("");
  const [vidFile, setVidFile]     = useState(null);
  const [vidStudents, setVidStudents] = useState([]);
  const [vidSaving, setVidSaving] = useState(false);
  const [vidProgress, setVidProgress] = useState(0);

  // Event bulk registration
  const [evTemplates, setEvTemplates] = useState([]);
  const [evSelectedId, setEvSelectedId] = useState("");
  const [evRegs, setEvRegs] = useState([]);
  const [evFile, setEvFile] = useState(null);
  const evFileRef = useRef(null);
  const [evUploading, setEvUploading] = useState(false);
  const [evMsg, setEvMsg] = useState({ type: "", text: "" });
  const [evExpanded, setEvExpanded] = useState(null);
  const [evDeleting, setEvDeleting] = useState(null);
  const [evFullId, setEvFullId] = useState(null);
  const [evRowDeleting, setEvRowDeleting] = useState(null); // { regId, rowIndex }
  const evTmpl = evTemplates.find(t => String(t.event_id) === String(evSelectedId)) || null;
  const [vidMsg, setVidMsg]       = useState({ type: "", text: "" });
  const vidFileRef = useRef();

  // Notifications
  const [notifScope, setNotifScope] = useState("center_students");
  const [notifStudentsSel, setNotifStudentsSel] = useState([]);
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMsg, setNotifMsg]   = useState("");
  const [notifSending, setNotifSending] = useState(false);
  const [notifResult, setNotifResult] = useState({ type: "", text: "" });
  const [inbox, setInbox] = useState([]);
  const [expandedNotifId, setExpandedNotifId] = useState(null);

  useEffect(() => {
    const role = sessionStorage.getItem("rga_portal_role");
    if (!getToken() || role !== "franchise") { navigate("/portal/login"); return; }
    loadStudents();
    loadInbox();
  }, []);

  useEffect(() => {
    if (tab === "reports") loadRecentReports();
    if (tab === "videos") loadVideos();
    if (tab === "events") loadEventData();
    if (tab === "notifications") loadInbox();
  }, [tab]);

  useEffect(() => { setStudVisible(20); }, [search]);
  useEffect(() => { setRptVisible(20); }, [rptStudentFilter, rptDateFrom, rptDateTo]);

  async function loadStudents() {
    setLoading(true); setFetchErr("");
    try {
      const data = await apiFetch("portal_students.php");
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) { setFetchErr(err.message); }
    finally { setLoading(false); }
  }

  async function loadRecentReports() {
    try { setRecentReports(await apiFetch("portal_reports.php")); }
    catch (_) { setRecentReports([]); }
  }

  async function loadVideos() {
    try { setVideos(await apiFetch("portal_videos.php")); }
    catch (_) { setVideos([]); }
  }

  async function loadInbox() {
    try { setInbox(await apiFetch("portal_notifications.php")); }
    catch (_) { setInbox([]); }
  }

  async function loadProfile() {
    try {
      const p = await apiFetch("portal_profile.php");
      setProfilePhoto(p.photo || "");
      setProfDetails({ name: p.name || "", email: p.email || "", whatsapp: p.whatsapp || "" });
    } catch (_) { /* non-blocking */ }
  }
  useEffect(() => { loadProfile(); }, []);

  async function handleProfileSave(remove = false) {
    setProfileSaving(true); setProfileMsg("");
    try {
      const fd = new FormData();
      if (remove) fd.append("remove_photo", "1");
      else if (profileFile) fd.append("photo", profileFile);
      else { setProfileMsg("Choose an image first."); setProfileSaving(false); return; }
      const data = await apiFetch("portal_profile.php", { method: "POST", body: fd });
      setProfilePhoto(data.photo || "");
      setProfileFile(null);
      setProfileOpen(false);
    } catch (err) { setProfileMsg("Failed: " + err.message); }
    finally { setProfileSaving(false); }
  }

  async function handleProfDetailsSave(e) {
    e.preventDefault();
    setProfDetMsg({ type: "", text: "" });
    if (!profDetails.name.trim()) { setProfDetMsg({ type: "error", text: "Name is required." }); return; }
    setProfDetSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", profDetails.name);
      fd.append("email", profDetails.email);
      fd.append("whatsapp", profDetails.whatsapp);
      await apiFetch("portal_profile.php", { method: "POST", body: fd });
      setProfDetMsg({ type: "success", text: "Profile updated." });
      sessionStorage.setItem("rga_portal_name", profDetails.name.trim());
    } catch (err) { setProfDetMsg({ type: "error", text: err.message }); }
    finally { setProfDetSaving(false); }
  }

  async function handlePwChange(e) {
    e.preventDefault();
    setPwFormMsg({ type: "", text: "" });
    if (!pwForm.current || !pwForm.next) { setPwFormMsg({ type: "error", text: "Fill in all fields." }); return; }
    if (pwForm.next.length < 6) { setPwFormMsg({ type: "error", text: "New password must be at least 6 characters." }); return; }
    if (pwForm.next !== pwForm.confirm) { setPwFormMsg({ type: "error", text: "Passwords do not match." }); return; }
    setPwSaving(true);
    try {
      await apiFetch("portal_change_password.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: pwForm.current, new_password: pwForm.next }),
      });
      setPwFormMsg({ type: "success", text: "Password changed." });
      setPwForm({ current: "", next: "", confirm: "" });
    } catch (err) { setPwFormMsg({ type: "error", text: err.message }); }
    finally { setPwSaving(false); }
  }

  function logout() {
    ["rga_portal_token","rga_portal_role","rga_portal_login_id","rga_portal_name","rga_portal_center_id"]
      .forEach(k => sessionStorage.removeItem(k));
    navigate("/portal/login");
  }

  // ── Add / Edit student ───────────────────────────────────────────────────
  function openAdd() {
    setEditEnroll(""); setForm(BLANK_STUDENT); setPhotoFile(null); setPhotoPreview(null); setEditingStudentPhoto(null);
    setFormMsg({ type: "", text: "" }); setShowForm(true);
    if (photoRef.current) photoRef.current.value = "";
  }
  function openEdit(s) {
    setEditEnroll(s.enrollment_no);
    setForm({
      name: s.name || "", father_name: s.father_name || "", mother_contact: s.mother_contact || "",
      dob: s.dob || "", mobile: s.mobile || "", anniversary: s.anniversary || "",
      email: s.email || "", address: s.address || "", blood_group: s.blood_group || "",
      gender: s.gender || "", level: s.level || "", reg_no: s.reg_no || "", parent_name: s.parent_name || "",
      parent_contact: s.parent_contact || "", notes: s.notes || "", status: s.status || "active",
    });
    setPhotoFile(null); setPhotoPreview(null); setEditingStudentPhoto(s.photo || null);
    setFormMsg({ type: "", text: "" }); setShowForm(true);
    if (photoRef.current) photoRef.current.value = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    setFormMsg({ type: "", text: "" });
    const req = ["name","father_name","mother_contact","dob","mobile","gender","level"];
    const labels = { name:"Name", father_name:"Father Name", mother_contact:"Mother Name", dob:"DOB", mobile:"Mobile", address:"Address", blood_group:"Blood Group", gender:"Gender", level:"Level" };
    const missing = req.filter(k => !String(form[k] || "").trim()).map(k => labels[k]);
    if (missing.length) { setFormMsg({ type: "error", text: "Required: " + missing.join(", ") }); return; }
    if (!editEnroll && form.password?.trim() && form.password.trim().length < 6) { setFormMsg({ type: "error", text: "Password must be at least 6 characters." }); return; }
    if (!/^\d{10}$/.test(form.mobile.trim())) { setFormMsg({ type: "error", text: "Mobile must be a 10-digit number." }); return; }
    if (form.dob && form.dob >= todayStr()) { setFormMsg({ type: "error", text: "Date of birth must be in the past." }); return; }

    setFormLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ""));
      if (editEnroll) fd.append("enrollment_no", editEnroll);
      if (photoFile) fd.append("photo", photoFile);

      const data = await apiFetch("portal_students.php", { method: "POST", body: fd });
      if (editEnroll) {
        setStudents(prev => prev.map(s => s.enrollment_no === editEnroll ? data.student : s));
        setFormMsg({ type: "success", text: "Student updated." });
      } else {
        setStudents(prev => [data.student, ...prev]);
        setFormMsg({ type: "success", text: `Added! Student ID: ${data.enrollment_no}` });
      }
      setForm(BLANK_STUDENT); setPhotoFile(null); setEditEnroll("");
      if (photoRef.current) photoRef.current.value = "";
    } catch (err) { setFormMsg({ type: "error", text: err.message }); }
    finally { setFormLoading(false); }
  }

  function handleDeleteStudent(enrollment_no, name, level) {
    setDeleteTarget({
      type: "student",
      title: "Delete Student",
      subtitle: "Are you sure you want to permanently remove this student?",
      rows: [["Name", name], ["Student ID", enrollment_no], ["Level", level || "—"]],
      enrollment_no,
    });
  }

  function askDeleteReport(r) {
    setDeleteTarget({
      type: "report",
      title: "Delete Report",
      subtitle: "Permanently remove this student report.",
      rows: [["Student", r.student_name || r.enrollment_no], ["Date", r.report_date]],
      report_id: r.id,
    });
  }

  async function executeDeleteReport() {
    if (!deleteTarget?.report_id) return;
    const id = deleteTarget.report_id;
    setDeletingReportId(id);
    try {
      await apiFetch("portal_reports.php", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setRecentReports(prev => prev.filter(r => r.id !== id));
      if (viewReportId === id) setViewReportId(null);
      setDeleteTarget(null);
    } catch (err) { setDeleteTarget(null); setReportMsg({ type: "error", text: "Delete failed: " + err.message }); }
    finally { setDeletingReportId(null); }
  }

  async function executeDeleteStudent() {
    if (!deleteTarget) return;
    const { enrollment_no } = deleteTarget;
    setDeletingEnroll(enrollment_no);
    try {
      await apiFetch("portal_students.php", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollment_no }),
      });
      setStudents(prev => prev.filter(s => s.enrollment_no !== enrollment_no));
      setDeleteTarget(null);
    } catch (err) { setDeleteTarget(null); setFormMsg({ type: "error", text: "Delete failed: " + err.message }); }
    finally { setDeletingEnroll(""); }
  }

  async function handlePromote() {
    if (!promoteStudent || !promoteLevel) return;
    setPromoteSaving(true); setPromoteErr("");
    try {
      await apiFetch("portal_students.php", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollment_no: promoteStudent.enrollment_no, level: promoteLevel }),
      });
      setStudents(prev => prev.map(s =>
        s.enrollment_no === promoteStudent.enrollment_no ? { ...s, level: promoteLevel } : s));
      setPromoteStudent(null);
    } catch (err) { setPromoteErr(err.message); }
    finally { setPromoteSaving(false); }
  }

  function upcomingCelebrations() {
    const events = [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (const s of students) {
      if ((s.status || "active") !== "active") continue;
      for (const [field, type] of [["dob", "Birthday"], ["anniversary", "Anniversary"]]) {
        const raw = s[field];
        if (!raw) continue;
        const d = new Date(raw + "T00:00:00");
        if (isNaN(d)) continue;
        let next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
        if (next < today) next = new Date(today.getFullYear() + 1, d.getMonth(), d.getDate());
        const diff = Math.round((next - today) / 86400000);
        if (diff <= 7) events.push({ student: s, type, date: next, days: diff });
      }
    }
    return events.sort((a, b) => a.days - b.days);
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

  // ── Bulk upload ─────────────────────────────────────────────────────────
  async function handleUpload() {
    if (!uploadFile) { setUploadMsg({ type: "error", text: "Please select a file." }); return; }
    setUploading(true); setUploadMsg({ type: "", text: "" }); setUploadResult(null);
    const fd = new FormData();
    fd.append("file", uploadFile);
    try {
      const data = await apiFetch("portal_students_upload.php", { method: "POST", body: fd });
      setUploadResult(data);
      setUploadMsg({ type: "success", text: `Done — ${data.added_count} added, ${data.skipped_count} skipped.` });
      setUploadFile(null);
      if (fileRef.current) fileRef.current.value = "";
      await loadStudents();
    } catch (err) { setUploadMsg({ type: "error", text: err.message }); }
    finally { setUploading(false); }
  }

  async function loadEventData() {
    try {
      const [t, r] = await Promise.all([
        apiFetch("portal_event_template.php?list=1"),
        apiFetch("portal_event_regs.php"),
      ]);
      const templates = Array.isArray(t) ? t : [];
      setEvTemplates(templates);
      setEvSelectedId(prev => (
        templates.some(item => String(item.event_id) === String(prev))
          ? prev
          : (templates[0] ? String(templates[0].event_id) : "")
      ));
      setEvRegs(Array.isArray(r) ? r : []);
    } catch (_) { }
  }
  async function downloadEventTemplate() {
    setEvMsg({ type: "", text: "" });
    try {
      if (!evTmpl) throw new Error("Select an event first");
      const res = await fetch(`${API_BASE}/portal_event_template.php?event_id=${evTmpl.event_id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        let msg = "Download failed";
        try { msg = (await res.json()).error || msg; } catch { }
        throw new Error(msg);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = (evTmpl && evTmpl.original_name) || "event_registration_template.xlsx";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) { setEvMsg({ type: "error", text: err.message }); }
  }
  async function handleEventUpload(e) {
    e.preventDefault();
    setEvMsg({ type: "", text: "" });
    if (!evFile) { setEvMsg({ type: "error", text: "Choose the filled Excel file." }); return; }
    if (!evTmpl) { setEvMsg({ type: "error", text: "Select an event with a published template." }); return; }
    setEvUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", evFile);
      fd.append("event_id", String(evTmpl.event_id));
      const data = await apiFetch("portal_event_regs.php", { method: "POST", body: fd });
      setEvMsg({
        type: "success",
        text: data.parsed
          ? `Uploaded — ${data.count} registration(s) detected.`
          : "Uploaded. (Could not auto-read rows from the file, but the file was saved and the admin can view it.)",
      });
      setEvFile(null);
      if (evFileRef.current) evFileRef.current.value = "";
      loadEventData();
    } catch (err) { setEvMsg({ type: "error", text: err.message }); }
    finally { setEvUploading(false); }
  }
  async function downloadEventRegFile(r) {
    try {
      const res = await fetch(`${API_BASE}/portal_event_regs_file.php?id=${r.id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = r.original_name || "registrations.xlsx";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) { setEvMsg({ type: "error", text: err.message }); }
  }
  async function handleEventRowsDelete(regId, indexes) {
    setEvRowDeleting(regId);
    try {
      await apiFetch("portal_event_regs.php", {
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
  async function handleEventRegDelete(id) {
    if (!window.confirm("Delete this uploaded registration file?")) return;
    setEvDeleting(id);
    try {
      await apiFetch("portal_event_regs.php", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setEvRegs(prev => prev.filter(r => r.id !== id));
    } catch (err) { setEvMsg({ type: "error", text: "Delete failed: " + err.message }); }
    finally { setEvDeleting(null); }
  }

  // ── Reports ───────────────────────────────────────────────────────────────
  function openEditReport(r) {
    setEditReportId(r.id);
    setReport({
      enrollment_no: r.enrollment_no,
      report_date: r.report_date,
      attendance: r.attendance,
      sw_direct_view: r.sw_direct_view,
      sw_indirect_view: r.sw_indirect_view,
      sw_hand_writing: r.sw_hand_writing ?? r.sw_right_hand_writing ?? 0,
      number_drop: r.number_drop,
      decimal_drop: r.decimal_drop,
      book_a_page: r.book_a_page ?? 0,
      book_b_page: r.book_b_page ?? 0,
      hw_book_a_page: r.hw_book_a_page ?? 0,
      hw_book_b_page: r.hw_book_b_page ?? 0,
      activity: r.activity || "",
    });
    setReportMsg({ type: "", text: "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEditReport() {
    setEditReportId(null);
    setReport({ ...BLANK_REPORT });
    setRptSelectedStudents([]);
    setReportMsg({ type: "", text: "" });
  }

  async function handleReportSubmit(e) {
    e.preventDefault();
    setReportMsg({ type: "", text: "" });
    if (!report.report_date) { setReportMsg({ type: "error", text: "Pick a date." }); return; }
    setReportSaving(true);
    try {
      if (editReportId) {
        const updated = await apiFetch("portal_reports.php", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editReportId, ...report }),
        });
        setRecentReports(prev => prev.map(r => r.id === editReportId ? (updated.report || r) : r));
        setReportMsg({ type: "success", text: "Report updated." });
        setEditReportId(null);
        setReport({ ...BLANK_REPORT });
      } else {
        if (rptSelectedStudents.length === 0) { setReportSaving(false); setReportMsg({ type: "error", text: "Select at least one student." }); return; }
        let ok = 0; const errs = [];
        for (const enNo of rptSelectedStudents) {
          try {
            await apiFetch("portal_reports.php", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...report, enrollment_no: enNo }),
            });
            ok++;
          } catch (err) { errs.push(`${enNo}: ${err.message}`); }
        }
        setRptSelectedStudents([]);
        setReport({ ...BLANK_REPORT });
        setReportMsg({ type: errs.length ? "error" : "success", text: errs.length ? `${ok} submitted, ${errs.length} failed: ${errs.join("; ")}` : `${ok} report${ok !== 1 ? "s" : ""} submitted.` });
      }
      loadRecentReports();
    } catch (err) { setReportMsg({ type: "error", text: err.message }); }
    finally { setReportSaving(false); }
  }

  async function handleBulkReportSubmit({ report_date, reports }) {
    setReportMsg({ type: "", text: "" });
    if (!report_date) { setReportMsg({ type: "error", text: "Pick a date." }); return; }
    if (reports.length === 0) { setReportMsg({ type: "error", text: "Select at least one student." }); return; }
    setReportSaving(true);
    try {
      const res = await apiFetch("portal_reports_bulk.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report_date, reports }),
      });
      const errs = res.errors || [];
      setReportMsg({
        type: errs.length ? "error" : "success",
        text: errs.length
          ? `${res.saved} submitted, ${errs.length} failed: ${errs.join("; ")}`
          : `${res.saved} report${res.saved !== 1 ? "s" : ""} submitted.`,
      });
      loadRecentReports();
    } catch (err) { setReportMsg({ type: "error", text: err.message }); }
    finally { setReportSaving(false); }
  }

  // ── Videos ────────────────────────────────────────────────────────────────
  async function handleVideoUpload(e) {
    e.preventDefault();
    setVidMsg({ type: "", text: "" });
    if (!vidFile) { setVidMsg({ type: "error", text: "Choose a video file." }); return; }
    if (vidStudents.length === 0) { setVidMsg({ type: "error", text: "Select at least one student." }); return; }
    setVidSaving(true);
    try {
      const fd = new FormData();
      fd.append("file", vidFile);
      fd.append("title", vidTitle);
      fd.append("students", JSON.stringify(vidStudents));
      setVidProgress(0);
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${API_BASE}/portal_videos.php`);
        xhr.setRequestHeader("Authorization", `Bearer ${getToken()}`);
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
      setVidMsg({ type: "success", text: "Video uploaded — it stays available for 7 days, then auto-deletes." });
      setVidTitle(""); setVidFile(null); setVidStudents([]);
      if (vidFileRef.current) vidFileRef.current.value = "";
      loadVideos();
    } catch (err) { setVidMsg({ type: "error", text: err.message }); }
    finally { setVidSaving(false); setVidProgress(0); }
  }
  function handleDeleteVideo(id, title) {
    setVideoDeleteTarget({
      title: "Delete Video",
      subtitle: "Are you sure you want to permanently remove this video?",
      rows: [["Title", title || "Untitled"], ["ID", id]],
      id,
    });
  }

  async function executeDeleteVideo() {
    if (!videoDeleteTarget) return;
    const { id } = videoDeleteTarget;
    setDeletingVideoId(id);
    try {
      await apiFetch("portal_videos.php", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setVideos(prev => prev.filter(v => v.id !== id));
      setVideoDeleteTarget(null);
    } catch (err) { setVideoDeleteTarget(null); setVidMsg({ type: "error", text: "Delete failed: " + err.message }); }
    finally { setDeletingVideoId(null); }
  }

  // ── Notifications ───────────────────────────────────────────────────────────
  async function handleNotifSend(e) {
    e.preventDefault();
    setNotifResult({ type: "", text: "" });
    if (!notifMsg.trim()) { setNotifResult({ type: "error", text: "Enter a message." }); return; }
    if (notifScope === "student" && notifStudentsSel.length === 0) { setNotifResult({ type: "error", text: "Select at least one student." }); return; }
    setNotifSending(true);
    try {
      await apiFetch("portal_notifications.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: notifScope, target_enrollment_nos: notifStudentsSel,
          title: notifTitle, message: notifMsg,
        }),
      });
      setNotifResult({ type: "success", text: notifScope === "student" ? `Notification sent to ${notifStudentsSel.length} student(s).` : "Notification sent." });
      setNotifTitle(""); setNotifMsg(""); setNotifStudentsSel([]);
    } catch (err) { setNotifResult({ type: "error", text: err.message }); }
    finally { setNotifSending(false); }
  }

  const filtered = students.filter(s =>
    !search ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.enrollment_no.toLowerCase().includes(search.toLowerCase()) ||
    s.mobile?.includes(search)
  );

  const filteredRpts = recentReports.filter(r =>
    (!rptStudentFilter ||
      r.student_name?.toLowerCase().includes(rptStudentFilter.toLowerCase()) ||
      r.enrollment_no.toLowerCase().includes(rptStudentFilter.toLowerCase())) &&
    (!rptDateFrom || (r.report_date || "") >= rptDateFrom) &&
    (!rptDateTo || (r.report_date || "") <= rptDateTo)
  );

  const TABS = [
    { key: "students",      icon: Users,          label: "Students" },
    { key: "reports",       icon: ClipboardList,  label: "Reports" },
    { key: "videos",        icon: Video,          label: "Videos" },
    { key: "events",        icon: Calendar,       label: "Events" },
    { key: "notifications", icon: Bell,           label: "Notifications" },
    { key: "profile",       icon: UserCircle,     label: "Profile" },
  ];

  const unreadCount = inbox.filter(n => !n.is_read && !localReadIds.has(n.id)).length;

  return (
    <div className="min-h-[100dvh] bg-[#050f1d] text-white font-sans selection:bg-secondary/30 relative">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#1e40af]/10 blur-[120px]" />
      </div>

      <header className="sticky top-0 z-40 bg-[#081b30]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/" className="h-14 w-14 flex-shrink-0">
                <img src="/images/rabbi-logo-badge.webp" alt="Logo" className="h-full w-full object-contain drop-shadow-lg" />
              </Link>
              <div className="hidden sm:block">
                <h1 className="font-bold text-white text-base leading-tight tracking-tight">Rabbi Global Academy</h1>
                <p className="text-[10px] text-white/50 uppercase tracking-widest font-semibold mt-0.5">Franchise Portal</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end mr-2">
                <span className="text-sm font-semibold text-white truncate max-w-[8rem] sm:max-w-none">{getName()}</span>
              </div>
              <button onClick={() => { setProfileOpen(true); setProfileFile(null); setProfileMsg(""); }}
                className="relative h-10 w-10 rounded-full bg-white/10 border border-white/20 hidden sm:flex items-center justify-center overflow-hidden group"
                title="Edit profile picture">
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <Building2 className="h-5 w-5 text-white/50" />
                )}
                <span className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Pencil className="h-3.5 w-3.5 text-white" />
                </span>
              </button>
              <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />
              <button onClick={logout} className="flex items-center justify-center h-9 w-9 rounded-full text-white/50 hover:text-rose-400 hover:bg-rose-500/10 transition-colors" title="Log out">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>

          <nav className="flex gap-2 pb-4 overflow-x-auto scrollbar-none">
            {TABS.map(({ key, icon: Icon, label }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`relative shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap group ${
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

      <main className="portal-responsive relative z-10 max-w-7xl mx-auto min-w-0 px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {fetchErr && <Alert type="error" msg={fetchErr} />}

        {/* ── STUDENTS ── */}
        {tab === "students" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {levelsError && <p role="alert" className="text-sm text-red-300">{levelsError} <button type="button" onClick={reloadLevels} className="underline">Retry</button></p>}
            {levelsLoading && <p className="text-xs text-white/50">Loading student levels…</p>}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight">Center Students</h2>
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <button onClick={() => setShowForm(!showForm)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-2 text-white">
                  <Plus className="h-4 w-4 text-secondary" /> Add / Upload
                </button>
              </div>
            </div>

            {(() => {
              const events = upcomingCelebrations();
              return events.length > 0 && (
                <div className="bg-gradient-to-r from-secondary/10 to-transparent border border-secondary/20 rounded-2xl p-5">
                  <h3 className="font-bold text-white flex items-center gap-2 mb-3">
                    <Cake className="h-4 w-4 text-secondary" /> Upcoming Celebrations (next 7 days)
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {events.map((ev, i) => (
                      <div key={i} className="flex items-center gap-3 bg-[#0f1c2e]/80 border border-white/10 rounded-xl px-4 py-2.5">
                        {ev.type === "Birthday"
                          ? <Cake className="h-4 w-4 text-secondary flex-shrink-0" />
                          : <Heart className="h-4 w-4 text-rose-400 flex-shrink-0" />}
                        <div>
                          <div className="text-sm font-semibold text-white">{ev.student.name}</div>
                          <div className="text-xs text-white/50">
                            {ev.type} · {ev.days === 0 ? "Today!" : ev.days === 1 ? "Tomorrow" : ev.date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </div>
                        </div>
                        {ev.student.mobile && (
                          <a href={`https://wa.me/91${String(ev.student.mobile).replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(
                              ev.type === "Birthday"
                                ? `Dear parent, Rabbi Global Academy wishes ${ev.student.name} a very Happy Birthday!`
                                : `Dear parent, Rabbi Global Academy sends warm wishes to your family on your Anniversary!`)}`}
                            target="_blank" rel="noopener noreferrer"
                            className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-white/50 hover:text-emerald-400 transition-colors" title="Send wishes on WhatsApp">
                            <MessageSquare className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {showForm && (
              <div className="bg-[#0f1c2e]/90 border border-white/10 rounded-2xl p-3 sm:p-6 backdrop-blur-xl shadow-2xl min-w-0">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    {editEnroll ? <><Pencil className="h-5 w-5 text-secondary" /> Edit Student</> : <><Plus className="h-5 w-5 text-secondary" /> Add New Student</>}
                  </h3>
                  <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {!editEnroll && (
                  <div className="mb-8 p-3 sm:p-5 bg-[#081b30]/50 border border-white/10 rounded-xl space-y-4 min-w-0">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2"><Upload className="h-4 w-4 text-secondary" /> Bulk Upload via Excel</h4>
                    <StudentTemplate getHeaders={() => ({ Authorization: `Bearer ${getToken()}` })} />
                    <p className="text-xs text-white/50">New students uploaded via Excel or CSV have the default password 123456 (not their DOB).</p>
                    <div className="flex flex-wrap gap-4 items-center">
                      <input type="file" ref={fileRef} accept=".xlsx,.csv" onChange={e => setUploadFile(e.target.files[0])}
                        className="w-full sm:w-auto max-w-full min-w-0 text-sm text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 transition-all cursor-pointer" />
                      <button onClick={handleUpload} disabled={uploading}
                        className="px-5 py-2 bg-secondary text-[#081b30] font-bold rounded-lg hover:bg-secondary/90 transition-all disabled:opacity-60 text-sm flex items-center gap-2">
                        {uploading ? <span className="h-4 w-4 border-2 border-[#081b30]/40 border-t-[#081b30] rounded-full animate-spin" /> : <Upload className="h-4 w-4" />} Upload
                      </button>
                    </div>
                    {uploadResult && (
                      <div className="text-sm bg-[#081b30] border border-white/5 rounded-lg p-4 space-y-1">
                        <p className="text-emerald-400 font-medium">Added: {uploadResult.added_count}</p>
                        <p className="text-rose-400 font-medium">Skipped: {uploadResult.skipped_count}</p>
                        {uploadResult.skipped_details?.length > 0 && (
                          <div className="mt-2 text-xs text-white/50 max-h-32 overflow-y-auto pr-2 space-y-1">
                            {uploadResult.skipped_details.map((s, i) => <p key={i}>• {s}</p>)}
                          </div>
                        )}
                      </div>
                    )}
                    <Alert type={uploadMsg.type} msg={uploadMsg.text} />
                  </div>
                )}

                <form onSubmit={handleFormSubmit} className="space-y-6" autoComplete="off">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <TextField label="Student Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                    <TextField label="Father Name" value={form.father_name} onChange={e => setForm({ ...form, father_name: e.target.value })} required />
                    <TextField label="Mother Name" value={form.mother_contact} onChange={e => setForm({ ...form, mother_contact: e.target.value })} required />
                    <TextField label="Date of Birth" type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} max={todayStr()} required />
                    <TextField label="Mobile" type="tel" value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} required />
                    <TextField label="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                    <TextField label="Anniversary" type="date" value={form.anniversary} onChange={e => setForm({ ...form, anniversary: e.target.value })} />
                    {!editEnroll && <PasswordField label="Password (optional)" placeholder="Leave blank for 123456" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />}
                    <SelectField label="Blood Group (optional)" value={form.blood_group} onChange={e => setForm({ ...form, blood_group: e.target.value })} options={<><option value="" className="bg-[#0f1c2e]">Select…</option>{BLOOD_GROUPS.map(g => <option key={g} value={g} className="bg-[#0f1c2e]">{g}</option>)}</>} />
                    <SelectField label="Gender" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} options={<><option value="" className="bg-[#0f1c2e]">Select…</option>{GENDERS.map(g => <option key={g} value={g} className="bg-[#0f1c2e]">{g}</option>)}</>} required />
                    <SelectField label="Level" value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} options={<><option value="" className="bg-[#0f1c2e]">Select…</option>{LEVELS.map(l => <option key={l} value={l} className="bg-[#0f1c2e]">{l}</option>)}</>} required />
                    <TextField label="Student Registration Number (optional)" value={form.reg_no} onChange={e => setForm({ ...form, reg_no: e.target.value })} />
                    {editEnroll && <SelectField label="Status" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} options={STATUS_OPTIONS.map(s => <option key={s} value={s} className="bg-[#0f1c2e] capitalize">{s}</option>)} required />}
                    
                    <div className="md:col-span-2 lg:col-span-3">
                      <TextField label="Address (optional)" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/60 text-[11px] font-bold uppercase tracking-wider mb-2">Student Photo</label>
                    <div className="flex items-center gap-4">
                      {(photoPreview || editingStudentPhoto) ? (
                        <img src={photoPreview || `/uploads/students/${editingStudentPhoto}`} alt="Preview" className="h-16 w-16 rounded-xl object-cover border border-white/10" />
                      ) : (
                        <div className="h-16 w-16 rounded-xl bg-[#081b30]/50 border border-white/10 flex items-center justify-center text-white/30">
                          <ImageIcon className="h-6 w-6" />
                        </div>
                      )}
                      <label className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm cursor-pointer transition-colors font-medium">
                        Select Photo
                        <input type="file" className="hidden" accept="image/*" ref={photoRef} onChange={e => {
                          const f = e.target.files[0];
                          if (f) { setPhotoFile(f); setPhotoPreview(URL.createObjectURL(f)); }
                        }} />
                      </label>
                    </div>
                  </div>

                  <Alert type={formMsg.type} msg={formMsg.text} />
                  
                  <div className="flex justify-end pt-4 border-t border-white/10">
                    <button type="submit" disabled={formLoading}
                      className="px-8 py-3 bg-secondary text-[#081b30] font-bold rounded-xl hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/20 disabled:opacity-60 flex items-center gap-2">
                      {formLoading ? <span className="h-5 w-5 border-2 border-[#081b30]/40 border-t-[#081b30] rounded-full animate-spin" /> : <UserCheck className="h-5 w-5" />}
                      {editEnroll ? "Save Changes" : "Create Student"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-[#0f1c2e]/80 border border-white/10 rounded-2xl backdrop-blur-sm overflow-hidden">
              <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <input
                    type="text"
                    placeholder="Search by name, reg no, mobile…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/50 transition-all hover:border-white/20"
                  />
                </div>
                <div className="text-sm text-white/50 font-medium">
                  {filtered.length} student{filtered.length !== 1 ? 's' : ''}
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-white/5 text-white/60 text-[11px] uppercase tracking-wider font-bold">
                    <tr>
                      <th className="px-5 py-4 first:rounded-tl-xl">Student ID</th>
                      <th className="px-5 py-4">Name</th>
                      <th className="px-5 py-4">Password</th>
                      <th className="px-5 py-4">Level</th>
                      <th className="px-5 py-4 hidden md:table-cell">Status</th>
                      <th className="px-5 py-4 hidden lg:table-cell">Joined</th>
                      <th className="px-5 py-4 last:rounded-tr-xl">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {loading ? (
                      <tr><td colSpan="7" className="text-center py-12 text-white/40 font-medium"><span className="inline-block h-6 w-6 border-2 border-white/20 border-t-white rounded-full animate-spin mb-3"></span><br/>Loading students...</td></tr>
                    ) : filtered.length === 0 ? (
                      <tr><td colSpan="7" className="text-center py-12 text-white/40 font-medium">No students found.</td></tr>
                    ) : (
                      filtered.slice(0, studVisible).map(s => (
                        <tr key={s.enrollment_no} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-5 py-4 font-mono text-secondary text-xs">{s.enrollment_no}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              {s.photo ? (
                                <img src={`/uploads/students/${s.photo}`} alt={s.name} className="h-10 w-10 rounded-full object-cover border border-white/10" />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 font-bold">
                                  {s.name.charAt(0)}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-white group-hover:text-secondary transition-colors">{s.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <PwCell value={s.password} onSet={() => openEdit(s)} />
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-medium text-white/80">
                              {s.level || "—"}
                            </span>
                          </td>
                          <td className="px-5 py-4 hidden md:table-cell">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border ${STATUS_COLORS[s.status || "active"]}`}>
                              {s.status || "active"}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-white/30 text-xs hidden lg:table-cell">{fmtDt(s.created_at).split(",")[0]}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-start gap-1.5">
                              <button onClick={() => setViewStudent(s)} className="flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg hover:bg-secondary/10 text-white/60 hover:text-secondary transition-colors" title="View all details">
                                <Eye className="h-4 w-4" />
                                <span className="text-[9px] font-semibold leading-none">View</span>
                              </button>
                              <button onClick={() => setHistoryStudent(s)} className="flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg hover:bg-secondary/10 text-white/60 hover:text-secondary transition-colors" title="View report history">
                                <ClipboardList className="h-4 w-4" />
                                <span className="text-[9px] font-semibold leading-none">History</span>
                              </button>
                              <button onClick={() => { setPromoteStudent(s); setPromoteLevel(s.level || ""); setPromoteErr(""); }}
                                className="flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg hover:bg-sky-500/10 text-white/60 hover:text-sky-400 transition-colors" title="Change level">
                                <GraduationCap className="h-4 w-4" />
                                <span className="text-[9px] font-semibold leading-none">Level</span>
                              </button>
                              <button onClick={() => openEdit(s)} className="flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors" title="Edit student">
                                <Pencil className="h-4 w-4" />
                                <span className="text-[9px] font-semibold leading-none">Edit</span>
                              </button>
                              <button onClick={() => setWaStudent(s)} className="flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg hover:bg-emerald-500/10 text-white/60 hover:text-emerald-400 transition-colors" title="Message parent on WhatsApp">
                                <MessageSquare className="h-4 w-4" />
                                <span className="text-[9px] font-semibold leading-none">WhatsApp</span>
                              </button>
                              <button onClick={() => handleDeleteStudent(s.enrollment_no, s.name, s.level)} className="flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg hover:bg-rose-500/10 text-white/60 hover:text-rose-400 transition-colors" title="Delete">
                                <Trash2 className="h-4 w-4" />
                                <span className="text-[9px] font-semibold leading-none">Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {filtered.length > studVisible && (
                <div className="flex justify-center py-4 border-t border-white/5">
                  <button onClick={() => setStudVisible(v => v + 20)}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:border-white/25 text-sm font-semibold transition-all">
                    <ChevronDown className="h-4 w-4" /> Load more ({filtered.length - studVisible} remaining)
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── REPORTS ── */}
        {tab === "reports" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-[#0f1c2e]/90 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
              <h2 className="text-xl font-bold tracking-tight mb-6 flex items-center gap-2">
                {editReportId ? <><Pencil className="h-5 w-5 text-secondary" /> Edit Report</> : <><Plus className="h-5 w-5 text-secondary" /> Daily Class Report</>}
              </h2>

              {!editReportId ? (
                <BulkReportTable
                  students={students.filter(s => s.status === "active")}
                  saving={reportSaving}
                  onSubmit={handleBulkReportSubmit}
                  alert={<Alert type={reportMsg.type} msg={reportMsg.text} />}
                />
              ) : (
              <form onSubmit={handleReportSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div className="lg:col-span-2">
                    <TextField label="Student (Editing)" value={report.enrollment_no} disabled className="opacity-50" />
                  </div>
                  <TextField label="Date" type="date" value={report.report_date} onChange={e => setReport({ ...report, report_date: e.target.value })} required max={todayStr()} />
                  <SelectField label="Attendance" value={report.attendance} onChange={e => setReport({ ...report, attendance: e.target.value })} options={<><option value="present" className="bg-[#0f1c2e]">Present</option><option value="absent" className="bg-[#0f1c2e]">Absent</option></>} />
                </div>

                {report.attendance === "present" && (
                  <>
                    <div className="p-5 bg-white/5 border border-white/10 rounded-xl space-y-5">
                      <h3 className="font-bold text-sm flex items-center gap-2 text-white/80"><Activity className="h-4 w-4 text-secondary" /> Speed Writing</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <SelectField label="Direct View" value={report.sw_direct_view} onChange={e => setReport({ ...report, sw_direct_view: e.target.value })} options={SW_OPTS.map(o => <option key={o} value={o} className="bg-[#0f1c2e]">{o}</option>)} />
                        <SelectField label="Indirect View" value={report.sw_indirect_view} onChange={e => setReport({ ...report, sw_indirect_view: e.target.value })} options={SW_OPTS.map(o => <option key={o} value={o} className="bg-[#0f1c2e]">{o}</option>)} />
                        <SelectField label="Hand Writing" value={report.sw_hand_writing} onChange={e => setReport({ ...report, sw_hand_writing: e.target.value })} options={SW_OPTS.map(o => <option key={o} value={o} className="bg-[#0f1c2e]">{o}</option>)} />
                      </div>
                    </div>

                    <div className="p-5 bg-white/5 border border-white/10 rounded-xl space-y-5">
                      <h3 className="font-bold text-sm flex items-center gap-2 text-white/80"><BookOpen className="h-4 w-4 text-secondary" /> Book Pages</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <SelectField label="Classwork A" value={report.book_a_page} onChange={e => setReport({ ...report, book_a_page: e.target.value })} options={<><option value="0" className="bg-[#0f1c2e]">None</option>{PAGE_OPTS.map(o => <option key={o} value={o} className="bg-[#0f1c2e]">{o}</option>)}</>} />
                        <SelectField label="Classwork B" value={report.book_b_page} onChange={e => setReport({ ...report, book_b_page: e.target.value })} options={<><option value="0" className="bg-[#0f1c2e]">None</option>{PAGE_OPTS.map(o => <option key={o} value={o} className="bg-[#0f1c2e]">{o}</option>)}</>} />
                        <SelectField label="Homework A" value={report.hw_book_a_page} onChange={e => setReport({ ...report, hw_book_a_page: e.target.value })} options={<><option value="0" className="bg-[#0f1c2e]">None</option>{PAGE_OPTS.map(o => <option key={o} value={o} className="bg-[#0f1c2e]">{o}</option>)}</>} />
                        <SelectField label="Homework B" value={report.hw_book_b_page} onChange={e => setReport({ ...report, hw_book_b_page: e.target.value })} options={<><option value="0" className="bg-[#0f1c2e]">None</option>{PAGE_OPTS.map(o => <option key={o} value={o} className="bg-[#0f1c2e]">{o}</option>)}</>} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-white/60 text-[11px] font-bold uppercase tracking-wider mb-1.5">Activity / Notes</label>
                      <textarea
                        value={report.activity}
                        onChange={e => setReport({ ...report, activity: e.target.value })}
                        placeholder="Any specific activities done today, observations, notes for the student..."
                        rows={4}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-secondary/50 transition-all resize-y"
                      />
                    </div>
                  </>
                )}

                <Alert type={reportMsg.type} msg={reportMsg.text} />
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={cancelEditReport} className="px-6 py-3 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 font-medium transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={reportSaving} className="flex-1 px-8 py-3 rounded-xl bg-secondary text-[#081b30] font-bold hover:bg-secondary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-secondary/20 disabled:opacity-60">
                    {reportSaving ? <span className="h-5 w-5 border-2 border-[#081b30]/40 border-t-[#081b30] rounded-full animate-spin" /> : <ClipboardList className="h-5 w-5" />}
                    Update Report
                  </button>
                </div>
              </form>
              )}
            </div>

            <div className="bg-[#0f1c2e]/80 border border-white/10 rounded-2xl backdrop-blur-sm overflow-hidden">
              <div className="p-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-bold text-lg">Recent Reports</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-full sm:w-56">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <input
                      type="text"
                      placeholder="Filter by student..."
                      value={rptStudentFilter}
                      onChange={e => setRptStudentFilter(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-secondary/50 transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input type="date" value={rptDateFrom} max={rptDateTo || undefined} onChange={e => setRptDateFrom(e.target.value)}
                      onClick={e => { try { e.target.showPicker?.(); } catch(_) {} }}
                      title="Show reports from this date"
                      className="px-2.5 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-secondary/50 [color-scheme:dark] cursor-pointer" />
                    <span className="text-white/30 text-xs">to</span>
                    <input type="date" value={rptDateTo} min={rptDateFrom || undefined} onChange={e => setRptDateTo(e.target.value)}
                      onClick={e => { try { e.target.showPicker?.(); } catch(_) {} }}
                      title="Show reports up to this date"
                      className="px-2.5 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-secondary/50 [color-scheme:dark] cursor-pointer" />
                  </div>
                  {(rptDateFrom || rptDateTo || rptStudentFilter) && (
                    <button onClick={() => { setRptDateFrom(""); setRptDateTo(""); setRptStudentFilter(""); }}
                      className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white text-xs font-semibold transition-colors">
                      Clear
                    </button>
                  )}
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-white/5 text-white/60 text-[11px] uppercase tracking-wider font-bold">
                    <tr>
                      <th className="px-5 py-3">Student</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Speed (D/I/H)</th>
                      <th className="px-5 py-3">Pages (CW/HW)</th>
                      <th className="px-5 py-3 hidden md:table-cell">Submitted</th>
                      <th className="px-5 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredRpts.slice(0, rptVisible).map(r => (
                      <Fragment key={r.id}>
                      <tr className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-5 py-4">
                          <div className="font-medium text-white">{r.student_name || r.enrollment_no}</div>
                          <div className="text-xs text-white/40 font-mono mt-0.5">{r.enrollment_no}</div>
                        </td>
                        <td className="px-5 py-4 text-white/70">{fmtDt(r.report_date).split(',')[0]}</td>
                        <td className="px-5 py-4 capitalize">
                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border ${r.attendance === "present" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"}`}>{r.attendance}</span>
                        </td>
                        <td className="px-5 py-4 text-white/60 font-medium">
                          {r.sw_direct_view} / {r.sw_indirect_view} / {r.sw_hand_writing ?? r.sw_right_hand_writing ?? 0}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1 text-xs">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 w-fit">
                              <b className="text-[10px] tracking-wider opacity-70">CW</b> A{r.book_a_page ?? 0} B{r.book_b_page ?? 0}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 w-fit">
                              <b className="text-[10px] tracking-wider opacity-70">HW</b> A{r.hw_book_a_page ?? 0} B{r.hw_book_b_page ?? 0}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-white/30 text-xs whitespace-nowrap hidden md:table-cell">
                          {fmtDt(r.created_at)}
                          {r.updated_at && <span className="block text-secondary/60">↻ {fmtDt(r.updated_at)}</span>}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button onClick={() => setViewReportId(viewReportId === r.id ? null : r.id)} className={`p-2 rounded-lg hover:bg-white/10 transition-colors ${viewReportId === r.id ? "text-secondary bg-white/10" : "text-white/60 hover:text-white"}`} title="View">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button onClick={() => openEditReport(r)} className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors" title="Edit">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => askDeleteReport(r)} disabled={deletingReportId === r.id}
                              className="p-2 rounded-lg hover:bg-rose-500/15 text-white/60 hover:text-rose-400 transition-colors disabled:opacity-50" title="Delete">
                              {deletingReportId === r.id ? <span className="h-4 w-4 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin inline-block" /> : <Trash2 className="h-4 w-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {viewReportId === r.id && (
                        <tr className="bg-white/[0.03]">
                          <td colSpan="7" className="px-5 py-4">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                              {[
                                { label: "Pagework Type", val: r.pagework_type || "—" },
                                { label: "Direct View", val: r.sw_direct_view ?? 0 },
                                { label: "Indirect View", val: r.sw_indirect_view ?? 0 },
                                { label: "Right/Left Hand Writing", val: (r.sw_hand_writing ?? r.sw_right_hand_writing) ?? 0 },
                              ].map(item => (
                                <div key={item.label} className="bg-white/5 border border-white/10 rounded-lg p-3">
                                  <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold mb-1">{item.label}</p>
                                  <p className="text-white font-medium">{item.val}</p>
                                </div>
                              ))}
                            </div>
                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="rounded-xl border border-sky-400/20 bg-sky-500/[0.06] px-3 py-2.5">
                                <p className="text-sky-300 text-[10px] font-bold uppercase tracking-widest mb-1">Class Work</p>
                                <p className="text-white text-sm">Book A <b className="tabular-nums">{r.book_a_page ?? 0}</b> · Book B <b className="tabular-nums">{r.book_b_page ?? 0}</b></p>
                              </div>
                              <div className="rounded-xl border border-amber-400/20 bg-amber-500/[0.06] px-3 py-2.5">
                                <p className="text-amber-300 text-[10px] font-bold uppercase tracking-widest mb-1">Home Work</p>
                                <p className="text-white text-sm">Book A <b className="tabular-nums">{r.hw_book_a_page ?? 0}</b> · Book B <b className="tabular-nums">{r.hw_book_b_page ?? 0}</b></p>
                              </div>
                            </div>
                            {r.activity && (
                              <div className="mt-3 bg-white/5 border border-white/10 rounded-lg p-3">
                                <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold mb-1">Activity</p>
                                <p className="text-white/80 text-sm whitespace-pre-wrap">{r.activity}</p>
                              </div>
                            )}
                            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-white/40">
                              <span>Submitted: <span className="text-white/60">{fmtDt(r.created_at)}</span></span>
                              {r.updated_at && <span>Last updated: <span className="text-secondary/70">{fmtDt(r.updated_at)}</span></span>}
                            </div>
                          </td>
                        </tr>
                      )}
                      </Fragment>
                    ))}
                    {filteredRpts.length === 0 && (
                      <tr><td colSpan="7" className="text-center py-12 text-white/40">No reports found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {filteredRpts.length > rptVisible && (
                <div className="flex justify-center py-4 border-t border-white/5">
                  <button onClick={() => setRptVisible(v => v + 20)}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:border-white/25 text-sm font-semibold transition-all">
                    <ChevronDown className="h-4 w-4" /> Load more ({filteredRpts.length - rptVisible} remaining)
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── VIDEOS ── */}
        {tab === "videos" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-[#0f1c2e]/90 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
              <h2 className="text-xl font-bold tracking-tight mb-2 flex items-center gap-2"><Video className="h-5 w-5 text-secondary" /> Upload Learning Video</h2>
              <p className="text-white/50 text-sm mb-6">Videos are automatically deleted 7 days after upload.</p>
              <form onSubmit={handleVideoUpload} className="space-y-6">
                <TextField label="Video Title" value={vidTitle} onChange={e => setVidTitle(e.target.value)} placeholder="e.g. Abacus Level 1 — Lesson 3" required />
                <div>
                  <label className="block text-white/60 text-[11px] font-bold uppercase tracking-wider mb-2">Video File <span className="text-secondary">*</span></label>
                  <label className="flex flex-col items-center justify-center p-8 bg-white/5 hover:bg-white/10 border-2 border-dashed border-white/10 hover:border-secondary/50 rounded-xl transition-all cursor-pointer group">
                    <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:bg-secondary/10 transition-colors">
                      <Upload className="h-6 w-6 text-white/40 group-hover:text-secondary transition-colors" />
                    </div>
                    <span className="text-white font-medium mb-1">{vidFile ? vidFile.name : "Click to browse files"}</span>
                    <span className="text-white/40 text-xs">MP4, WEBM, MOV (Max 50MB)</span>
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
                </div>
                <div>
                  <label className="block text-white/60 text-[11px] font-bold uppercase tracking-wider mb-2">Select Students <span className="text-secondary">*</span></label>
                  <StudentMultiSelect students={students} selected={vidStudents} onChange={setVidStudents} placeholder="Search and select students..." />
                </div>
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
                <button type="submit" disabled={vidSaving} className="px-8 py-3 rounded-xl bg-secondary text-[#081b30] font-bold hover:bg-secondary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-secondary/20 disabled:opacity-60 w-full sm:w-auto">
                  {vidSaving ? <span className="h-5 w-5 border-2 border-[#081b30]/40 border-t-[#081b30] rounded-full animate-spin" /> : <Upload className="h-5 w-5" />}
                  {vidSaving ? "Uploading..." : "Upload Video"}
                </button>
              </form>
            </div>

            <div className="bg-[#0f1c2e]/80 border border-white/10 rounded-2xl backdrop-blur-sm p-6">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><Video className="h-5 w-5 text-secondary" /> Uploaded Videos</h3>
              <VideoLibrary videos={videos} onDelete={v => handleDeleteVideo(v.id, v.title)} />
            </div>
          </div>
        )}

        {/* ── NOTIFICATIONS ── */}
        {tab === "events" && (
          <div className="space-y-8">
            {/* Template download */}
            <div className="bg-[#0a1628]/80 border border-white/8 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
              <h2 className="text-lg font-bold mb-1 flex items-center gap-2"><Calendar className="h-5 w-5 text-secondary" /> Event Registration</h2>
              <p className="text-white/40 text-sm mb-5">Download the registration template, fill in your students' details, then upload the completed file below.</p>
              {evTemplates.length > 0 ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1.5">Select Event</label>
                    <select
                      value={evSelectedId}
                      onChange={e => {
                        setEvSelectedId(e.target.value);
                        setEvFile(null);
                        setEvMsg({ type: "", text: "" });
                        if (evFileRef.current) evFileRef.current.value = "";
                      }}
                      className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-secondary/60"
                    >
                      {evTemplates.map(t => (
                        <option key={t.event_id} value={t.event_id} className="bg-[#0a1628]">{t.event_name}</option>
                      ))}
                    </select>
                  </div>
                  {evTmpl && (
                <div className="flex flex-wrap items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-xl px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate">{evTmpl.event_name}</p>
                    <p className="text-white/40 text-xs mt-0.5">Template: {evTmpl.original_name} · Updated {fmtDt(evTmpl.uploaded_at)}</p>
                  </div>
                  <button onClick={downloadEventTemplate}
                    className="flex items-center gap-2 bg-secondary text-[#081b30] font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-secondary/90 transition-all flex-shrink-0">
                    <Download className="h-4 w-4" /> Download Template
                  </button>
                </div>
                  )}
                </div>
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-6 text-center text-white/40 text-sm">
                  No event registration template has been published yet. Please check back later.
                </div>
              )}
            </div>

            {/* Upload filled sheet */}
            <div className="bg-[#0a1628]/80 border border-white/8 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Upload className="h-4 w-4 text-secondary" /> Upload Filled Registration Sheet</h3>
              <form onSubmit={handleEventUpload} className="space-y-4">
                <label className="flex flex-col items-center justify-center p-8 bg-white/5 hover:bg-white/10 border-2 border-dashed border-white/10 hover:border-secondary/50 rounded-xl transition-all cursor-pointer group">
                  <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:bg-secondary/10 transition-colors">
                    <FileText className="h-6 w-6 text-white/40 group-hover:text-secondary transition-colors" />
                  </div>
                  <span className="text-white font-medium mb-1">{evFile ? evFile.name : "Click to choose the filled Excel file"}</span>
                  <span className="text-white/40 text-xs">XLSX, XLS or CSV (Max 10MB)</span>
                  <input ref={evFileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => setEvFile(e.target.files[0])} />
                </label>
                <Alert type={evMsg.type} msg={evMsg.text} />
                <button type="submit" disabled={evUploading || !evTmpl}
                  className="px-8 py-3 rounded-xl bg-secondary text-[#081b30] font-bold hover:bg-secondary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-secondary/20 disabled:opacity-60 w-full sm:w-auto">
                  {evUploading ? <span className="h-5 w-5 border-2 border-[#081b30]/40 border-t-[#081b30] rounded-full animate-spin" /> : <Upload className="h-5 w-5" />}
                  {evUploading ? "Uploading…" : "Upload Registrations"}
                </button>
              </form>
            </div>

            {/* My submissions */}
            <div className="bg-[#0a1628]/80 border border-white/8 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold flex items-center gap-2"><ClipboardList className="h-4 w-4 text-secondary" /> My Uploaded Registrations</h3>
                <button onClick={loadEventData} className="p-2 rounded-xl hover:bg-white/8 text-white/40 hover:text-white transition-colors"><RefreshCw className="h-4 w-4" /></button>
              </div>
              {evRegs.length === 0 ? (
                <div className="py-8 text-center text-white/30"><ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-40" /><p className="text-sm">No registration files uploaded yet.</p></div>
              ) : (
                <div className="space-y-3">
                  {evRegs.map(r => (
                    <div key={r.id} className="bg-white/3 border border-white/10 rounded-xl overflow-hidden">
                      <div className="flex items-start justify-between px-4 py-3 gap-3">
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate">{r.event_name}</p>
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
                          <button onClick={() => downloadEventRegFile(r)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors" title="Download file">
                            <Download className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleEventRegDelete(r.id)} disabled={evDeleting === r.id}
                            className="p-2 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50" title="Delete">
                            {evDeleting === r.id ? <span className="h-4 w-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin inline-block" /> : <Trash2 className="h-4 w-4" />}
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
              )}
            </div>

            {evFullId && (
              <EventRegFullscreen
                reg={evRegs.find(r => r.id === evFullId)}
                onClose={() => setEvFullId(null)}
                onDeleteRows={idxs => handleEventRowsDelete(evFullId, idxs)}
                deleting={evRowDeleting === evFullId} />
            )}
          </div>
        )}

        {tab === "notifications" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#0f1c2e]/90 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-2xl h-fit sticky top-24">
                <h2 className="text-xl font-bold tracking-tight mb-6 flex items-center gap-2"><Send className="h-5 w-5 text-secondary" /> Send Notification</h2>
                <form onSubmit={handleNotifSend} className="space-y-5">
                  <SelectField label="Send To" value={notifScope} onChange={e => setNotifScope(e.target.value)}
                    options={<><option value="center_students" className="bg-[#0f1c2e]">All my students</option><option value="student" className="bg-[#0f1c2e]">A specific student</option></>} />
                  {notifScope === "student" && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-white/60 text-[11px] font-bold uppercase tracking-wider">Students <span className="text-secondary">*</span></label>
                        <button type="button"
                          onClick={() => setNotifStudentsSel(notifStudentsSel.length === students.length ? [] : students.map(s => s.enrollment_no))}
                          className="text-[11px] font-semibold text-secondary/80 hover:text-secondary transition-colors">
                          {notifStudentsSel.length === students.length && students.length > 0 ? "Clear all" : "Select all"}
                        </button>
                      </div>
                      <div className="max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-[#081b30]/50 divide-y divide-white/5">
                        {students.length === 0 && <p className="text-white/30 text-sm p-3">No students in your center.</p>}
                        {students.map(s => (
                          <label key={s.enrollment_no} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-white/5 transition-colors">
                            <input type="checkbox" className="accent-[#22d3ee] h-4 w-4 flex-shrink-0"
                              checked={notifStudentsSel.includes(s.enrollment_no)}
                              onChange={() => setNotifStudentsSel(prev => prev.includes(s.enrollment_no) ? prev.filter(x => x !== s.enrollment_no) : [...prev, s.enrollment_no])} />
                            <span className="text-sm text-white/80">{s.name} <span className="text-white/40 font-mono text-xs">({s.enrollment_no})</span></span>
                          </label>
                        ))}
                      </div>
                      {notifStudentsSel.length > 0 && <p className="text-secondary/80 text-xs font-semibold mt-2">{notifStudentsSel.length} student(s) selected</p>}
                    </div>
                  )}
                  <TextField label="Title (Optional)" value={notifTitle} onChange={e => setNotifTitle(e.target.value)} placeholder="e.g. Important Announcement" />
                  <div>
                    <label className="block text-white/60 text-[11px] font-bold uppercase tracking-wider mb-2">Message <span className="text-secondary">*</span></label>
                    <textarea value={notifMsg} onChange={e => setNotifMsg(e.target.value)} rows={4} placeholder="Type your message here..." required
                      className="w-full bg-[#081b30]/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/50 transition-all hover:border-white/20 resize-none" />
                  </div>
                  <Alert type={notifResult.type} msg={notifResult.text} />
                  <button type="submit" disabled={notifSending} className="w-full px-6 py-3 rounded-xl bg-secondary text-[#081b30] font-bold hover:bg-secondary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-secondary/20 disabled:opacity-60">
                    {notifSending ? <span className="h-5 w-5 border-2 border-[#081b30]/40 border-t-[#081b30] rounded-full animate-spin" /> : <Send className="h-5 w-5" />}
                    {notifSending ? "Sending..." : "Send Notification"}
                  </button>
                </form>
              </div>

              <div className="bg-[#0f1c2e]/80 border border-white/10 rounded-2xl backdrop-blur-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Bell className="h-5 w-5 text-secondary" /> Notifications
                    {unreadCount > 0 && <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">{unreadCount} New</span>}
                  </h3>
                  <button onClick={loadInbox} className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"><RefreshCw className="h-4 w-4" /></button>
                </div>
                <div className="p-4 flex-1 overflow-y-auto max-h-[600px] space-y-3">
                  {inbox.length === 0 ? (
                    <div className="text-center py-20 text-white/30">
                      <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p className="font-medium">No messages yet.</p>
                    </div>
                  ) : (
                    inbox.map(n => {
                      const isUnread = !n.is_read && !localReadIds.has(n.id);
                      const isExpanded = expandedNotifId === n.id;
                      return (
                        <div key={n.id} className={`border rounded-xl transition-all duration-200 overflow-hidden ${isUnread ? "bg-white/[0.05] border-secondary/30 shadow-lg shadow-secondary/5" : "bg-white/[0.02] border-white/5 hover:border-white/10"}`}>
                          <button onClick={() => handleExpandNotif(n.id)} className="w-full flex items-start gap-4 p-4 text-left">
                            <div className="mt-1">
                              {isUnread ? (
                                <div className="h-2.5 w-2.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(201,162,75,0.8)] animate-pulse" />
                              ) : (
                                <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-4 mb-1">
                                <h4 className={`font-bold truncate pr-4 ${isUnread ? "text-white" : "text-white/80"}`}>{n.title || "Message"}</h4>
                                <span className="text-[10px] text-white/40 whitespace-nowrap font-medium flex-shrink-0">{fmtDt(n.created_at).split(',')[0]}</span>
                              </div>
                              <p className={`text-sm line-clamp-1 ${isUnread ? "text-white/70" : "text-white/50"}`}>{n.message}</p>
                            </div>
                            <div className="mt-1 flex-shrink-0 text-white/30">
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </div>
                          </button>
                          {isExpanded && (
                            <div className="px-4 pb-4 pt-1 ml-10">
                              <div className="h-px w-full bg-white/5 mb-4" />
                              <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">{n.message}</p>
                              <div className="mt-4 flex justify-between items-center text-[10px] text-white/30 font-medium">
                                <span>Sent: {fmtDt(n.created_at)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "profile" && (
          <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Franchise details */}
              <div className="bg-[#0f1c2e]/90 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
                <h2 className="text-xl font-bold tracking-tight mb-6 flex items-center gap-2"><UserCircle className="h-5 w-5 text-secondary" /> Franchise Details</h2>
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-secondary/40 bg-[#081b30] flex items-center justify-center flex-shrink-0">
                    {profilePhoto ? <img src={profilePhoto} alt="Profile" className="h-full w-full object-cover" /> : <Building2 className="h-7 w-7 text-white/30" />}
                  </div>
                  <div>
                    <p className="font-mono text-white/50 text-sm">{sessionStorage.getItem("rga_portal_center_id") || sessionStorage.getItem("rga_portal_login_id") || ""}</p>
                    <button onClick={() => setProfileOpen(true)} className="text-xs font-semibold text-secondary/80 hover:text-secondary transition-colors mt-1">Change photo</button>
                  </div>
                </div>
                <form onSubmit={handleProfDetailsSave} className="space-y-5">
                  <TextField label="Franchise / Center Name" value={profDetails.name} onChange={e => setProfDetails({ ...profDetails, name: e.target.value })} required />
                  <TextField label="Email" type="email" value={profDetails.email} onChange={e => setProfDetails({ ...profDetails, email: e.target.value })} placeholder="name@example.com" />
                  <TextField label="WhatsApp Number" value={profDetails.whatsapp} onChange={e => setProfDetails({ ...profDetails, whatsapp: e.target.value })} placeholder="e.g. 9876543210" />
                  <Alert type={profDetMsg.type} msg={profDetMsg.text} />
                  <button type="submit" disabled={profDetSaving} className="w-full px-6 py-3 rounded-xl bg-secondary text-[#081b30] font-bold hover:bg-secondary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-secondary/20 disabled:opacity-60">
                    {profDetSaving ? <span className="h-5 w-5 border-2 border-[#081b30]/40 border-t-[#081b30] rounded-full animate-spin" /> : <Save className="h-5 w-5" />}
                    {profDetSaving ? "Saving..." : "Save Changes"}
                  </button>
                </form>
              </div>

              {/* Change password */}
              <div className="bg-[#0f1c2e]/90 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
                <h2 className="text-xl font-bold tracking-tight mb-6 flex items-center gap-2"><KeyRound className="h-5 w-5 text-secondary" /> Change Password</h2>
                <form onSubmit={handlePwChange} className="space-y-5">
                  <TextField label="Current Password" type="password" value={pwForm.current} onChange={e => setPwForm({ ...pwForm, current: e.target.value })} required />
                  <TextField label="New Password" type="password" value={pwForm.next} onChange={e => setPwForm({ ...pwForm, next: e.target.value })} required />
                  <TextField label="Confirm New Password" type="password" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} required />
                  <Alert type={pwFormMsg.type} msg={pwFormMsg.text} />
                  <button type="submit" disabled={pwSaving} className="w-full px-6 py-3 rounded-xl bg-white/10 border border-white/10 text-white font-bold hover:bg-white/15 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                    {pwSaving ? <span className="h-5 w-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <KeyRound className="h-5 w-5" />}
                    {pwSaving ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>

      {profileOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050f1d]/80 backdrop-blur-sm" onClick={() => !profileSaving && setProfileOpen(false)}>
          <div className="bg-[#0f1c2e] border border-white/10 rounded-2xl p-6 max-w-sm w-full space-y-5 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">Profile Picture</h3>
              <button onClick={() => setProfileOpen(false)} disabled={profileSaving} className="text-white/40 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="h-28 w-28 rounded-full bg-white/10 border border-white/15 overflow-hidden flex items-center justify-center">
                {profileFile ? (
                  <img src={URL.createObjectURL(profileFile)} alt="Preview" className="h-full w-full object-cover" />
                ) : profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <Building2 className="h-10 w-10 text-white/30" />
                )}
              </div>
              <input type="file" accept="image/*" onChange={e => setProfileFile(e.target.files?.[0] || null)}
                className="text-sm text-white/60 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-white/10 file:text-white file:text-xs file:font-semibold file:cursor-pointer hover:file:bg-white/15" />
            </div>
            {profileMsg && <p className="text-rose-400 text-sm">{profileMsg}</p>}
            <div className="flex gap-3">
              {profilePhoto && (
                <button onClick={() => handleProfileSave(true)} disabled={profileSaving}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-colors text-sm font-semibold disabled:opacity-50">
                  Remove Photo
                </button>
              )}
              <button onClick={() => handleProfileSave(false)} disabled={profileSaving || !profileFile}
                className="flex-1 px-4 py-2.5 rounded-xl bg-secondary text-[#081b30] font-bold hover:bg-secondary/90 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {profileSaving ? <span className="h-4 w-4 border-2 border-[#081b30]/40 border-t-[#081b30] rounded-full animate-spin" /> : <Upload className="h-4 w-4" />}
                Save
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <ConfirmDeleteModal target={deleteTarget} loading={deletingEnroll !== "" || deletingReportId !== null}
        onConfirm={deleteTarget?.type === "report" ? executeDeleteReport : executeDeleteStudent}
        onCancel={() => setDeleteTarget(null)} />
      <ConfirmDeleteModal target={videoDeleteTarget} loading={deletingVideoId !== null} onConfirm={executeDeleteVideo} onCancel={() => setVideoDeleteTarget(null)} />
      <WhatsAppModal student={waStudent} onClose={() => setWaStudent(null)} />
      {promoteStudent && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => !promoteSaving && setPromoteStudent(null)}>
          <div className="bg-[#0f1c2e] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2"><GraduationCap className="h-5 w-5 text-secondary" /> Change Level</h3>
              <button onClick={() => setPromoteStudent(null)} className="p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-sm text-white/60 mb-1">{promoteStudent.name}</p>
            <p className="text-xs text-white/40 font-mono mb-4">{promoteStudent.enrollment_no} · current: <span className="text-white/70">{promoteStudent.level || "—"}</span></p>
            <label className="block text-white/60 text-[11px] font-bold uppercase tracking-wider mb-2">New Level</label>
            <select value={promoteLevel} onChange={e => setPromoteLevel(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-secondary/50 mb-4">
              <option value="" className="bg-[#0f1c2e]">Select…</option>
              {LEVELS.map(l => <option key={l} value={l} className="bg-[#0f1c2e]">{l}</option>)}
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

      {viewStudent && <StudentDetailModal student={viewStudent} onClose={() => setViewStudent(null)} />}
      {historyStudent && <StudentHistoryModal student={historyStudent} onClose={() => setHistoryStudent(null)}
        fetchReports={en => apiFetch(`portal_reports.php?enrollment_no=${encodeURIComponent(en)}`)} />}
    </div>
  );
}
