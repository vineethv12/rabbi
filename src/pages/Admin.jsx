import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import {
  Upload, Trash2, LogOut, Image, Plus, AlertCircle, CheckCircle,
  Loader2, Eye, Calendar, CalendarDays, Tag, Video, Play, Film, Trophy, Edit2, X, ChevronDown, ChevronRight,
  Inbox, Phone, Mail, MapPin, MessageSquare, Filter, RefreshCw,
  LayoutGrid, Camera, Users, GraduationCap, Newspaper, Building2,
  Download, FileSpreadsheet, ClipboardList, ChevronUp,
} from "lucide-react";
import AdminStudentPortal from "./AdminStudentPortal";
import { Seo } from "@/components/shared/Seo";

const API_BASE = "/api";

async function safeJson(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch {
    if (text.trimStart().startsWith("<")) {
      throw new Error("API server not responding — please try refreshing the page.");
    }
    throw new Error("Server returned an invalid response.");
  }
}

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 2000 }, (_, i) => CURRENT_YEAR - i);
const MAX_GALLERY_FILES = 20;

const STATUS_OPTIONS = [
  { value: "open",   label: "Registrations Open" },
  { value: "soon",   label: "Coming Soon" },
  { value: "early",  label: "Early Bird Open" },
  { value: "closed", label: "Closed" },
];

const STATUS_COLORS = {
  open:   "bg-red-500/20 text-red-300 border-red-400/30",
  soon:   "bg-blue-500/20 text-blue-300 border-blue-400/30",
  early:  "bg-green-500/20 text-green-300 border-green-400/30",
  closed: "bg-white/10 text-white/40 border-white/20",
};

const MONTHS_LIST = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function formatDateDisplay(dateStr) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch { return dateStr; }
}

function DatePickerButton({ value, onChange, placeholder, min, max }) {
  const inputRef = useRef(null);
  const open = () => {
    if (!inputRef.current) return;
    try {
      if (typeof inputRef.current.showPicker === "function") {
        inputRef.current.showPicker();
      } else {
        inputRef.current.click();
      }
    } catch {
      inputRef.current.click();
    }
  };
  const clear = (e) => {
    e.stopPropagation();
    onChange({ target: { type: "date", value: "" } });
  };
  return (
    <div className="relative">
      <button
        type="button"
        onClick={open}
        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm text-left transition-colors ${
          value
            ? "bg-secondary/10 border-secondary/40 text-white hover:border-secondary/60"
            : "bg-white/5 border-white/15 text-white/40 hover:border-white/30"
        }`}
      >
        <Calendar className="h-3.5 w-3.5 text-secondary flex-shrink-0" />
        <span className="flex-1">{value ? formatDateDisplay(value) : placeholder}</span>
        {value
          ? <X className="h-3.5 w-3.5 text-white/40 hover:text-white flex-shrink-0" onClick={clear} />
          : <ChevronDown className="h-3.5 w-3.5 text-white/30 flex-shrink-0" />
        }
      </button>
      <input
        ref={inputRef}
        type="date"
        value={value || ""}
        onChange={onChange}
        min={min}
        max={max}
        tabIndex={-1}
        style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 1, height: 1, top: 0, left: 0 }}
      />
    </div>
  );
}

function deriveRange(startStr, endStr) {
  if (!endStr) return "";
  const end   = new Date(endStr   + "T00:00:00");
  const start = startStr ? new Date(startStr + "T00:00:00") : null;
  const endDay  = end.getDate();
  const endYear = end.getFullYear();
  if (start && start.getFullYear() === endYear && start.getMonth() === end.getMonth()) {
    return `to ${endDay}, ${endYear}`;
  }
  return `to ${MONTHS_LIST[end.getMonth()]} ${endDay}, ${endYear}`;
}

// Shrink big photos in the browser before uploading (phone photos can be 10+ MB,
// which makes saves feel stuck on slow connections). Falls back to the original file.
async function compressImageFile(file, maxDim = 1600, quality = 0.85) {
  try {
    if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) return file;
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 700 * 1024) { bitmap.close?.(); return file; }
    const canvas = document.createElement("canvas");
    canvas.width  = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise(res => canvas.toBlob(res, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], (file.name.replace(/\.[^.]+$/, "") || "photo") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file; // any decode error — just send the original
  }
}

const BLANK_EVENT = {
  id: 0,
  event_date: "", event_end_date: "", image: "",
  month: "", day: "", date_range: "", badge: "",
  status_label: "Coming Soon", status_type: "soon",
  title: "Rabbi Global Academy", subtitle: "", description: "",
  venue: "", format: "", participants: "",
  register_url: "", register_label: "Register Now",
  brochure_url: "", model_question_paper_url: "",
  deadline: "", is_active: true,
};

const NEWS_CATEGORIES = ["News", "Update", "Story", "Announcement"];
const BLANK_NEWS = {
  id: 0,
  title: "",
  category: "News",
  date: "",
  summary: "",
  body: "",
  link_url: "",
  image: "",
  is_active: true,
};

const BLANK_FRANCHISE = {
  id: 0,
  academy: "",
  head: "",
  area: "",
  city: "",
  photo: "",
};

const VIDEO_LEVELS = ["Beginner", "Intermediate", "Advanced", "Vedic Math", "Tips & Tricks"];

function extractYtId(input) {
  const raw = String(input || "").trim();
  if (!raw) return "";
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([A-Za-z0-9_-]{11})/,
    /(?:youtu\.be\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = raw.match(re);
    if (m) return m[1];
  }
  if (/^[A-Za-z0-9_-]{11}$/.test(raw)) return raw;
  return "";
}

const BLANK_VIDEO = {
  id: 0,
  youtube_id: "",
  title: "",
  level: "Beginner",
  sort_order: 0,
};


function ConfirmModal({ modal, onOk, onCancel }) {
  if (!modal) return null;
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-4 bg-black/75">
      <div className="bg-gray-900 border border-red-500/30 rounded-2xl p-4 sm:p-6 max-w-sm w-full max-h-[calc(100dvh-1.5rem)] overflow-y-auto space-y-5 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0">
            <Trash2 className="h-6 w-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">{modal.title}</h3>
            {modal.message && <p className="text-white/50 text-sm mt-0.5">{modal.message}</p>}
          </div>
        </div>
        <p className="flex items-center gap-2 text-red-300/80 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          This action is permanent and cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/15 text-white/70 hover:text-white hover:border-white/30 transition-colors text-sm font-medium">
            Cancel
          </button>
          <button onClick={onOk}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/20 border border-red-400/40 text-red-300 hover:bg-red-500/30 transition-all text-sm font-bold flex items-center justify-center gap-2">
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function Alert({ type, message }) {
  if (!message) return null;
  const styles = {
    error:   "bg-red-500/10 border-red-400/40 text-red-300",
    success: "bg-green-500/10 border-green-400/40 text-green-300",
  };
  const Icon = type === "success" ? CheckCircle : AlertCircle;
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border text-sm ${styles[type]}`}>
      <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function Admin() {
  const [password, setPassword]         = useState("");
  const [authed, setAuthed]             = useState(() => !!sessionStorage.getItem("rga_admin"));
  const [loginError, setLoginError]     = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // login view: 'login' | 'forgot' | 'sent' | 'reset'
  const [loginView, setLoginView]       = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("token") ? "reset" : "login";
  });
  const [fpEmail, setFpEmail]           = useState("");
  const [fpLoading, setFpLoading]       = useState(false);
  const [fpError, setFpError]           = useState("");
  const [rpToken]                       = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("token") || "";
  });
  const [rpPassword, setRpPassword]     = useState("");
  const [rpConfirm, setRpConfirm]       = useState("");
  const [rpLoading, setRpLoading]       = useState(false);
  const [rpError, setRpError]           = useState("");
  const [rpSuccess, setRpSuccess]       = useState("");

  // top-level section — synced to the URL so the browser back button works
  const [searchParams, setSearchParams] = useSearchParams();
  const VALID_SECTIONS = ["gallery", "home_page", "events", "news", "franchises", "videos", "enquiries", "portal_users"];
  const rawSection = searchParams.get("section");
  const section = VALID_SECTIONS.includes(rawSection) ? rawSection : "gallery";
  const setSection = (val) => setSearchParams(prev => {
    const p = new URLSearchParams(prev);
    p.set("section", val);
    if (val !== "portal_users") p.delete("ptab");
    return p;
  });
  const [homeSubTab, setHomeSubTab]     = useState("hero");

  // ── Gallery state ─────────────────────────────────────────────────────────
  const [images, setImages]             = useState([]);
  const [loadingImgs, setLoadingImgs]   = useState(false);
  const [fetchError, setFetchError]     = useState("");
  const [uploadMode, setUploadMode]     = useState("year");
  const [year, setYear]                 = useState(CURRENT_YEAR);
  const [customCategory, setCustomCategory] = useState("");
  const [caption, setCaption]           = useState("");
  const [files, setFiles]               = useState([]);
  const [uploading, setUploading]       = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [uploadStats, setUploadStats]   = useState({ speedLabel: null, etaLabel: null });
  const [uploadMsg, setUploadMsg]       = useState({ type: "", text: "" });
  const [uploadResults, setUploadResults] = useState([]);
  const [deletingId, setDeletingId]     = useState(null);
  const [selectedIds, setSelectedIds]   = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [listTab, setListTab]           = useState("year");
  const fileRef = useRef();

  // ── Home Images state ─────────────────────────────────────────────────────
  const [homeData, setHomeData]     = useState({ hero: [], gallery: [], awards: [] });
  const [hLoadingImgs, setHLoadingImgs] = useState(false);
  const [hFetchError, setHFetchError]   = useState("");
  const [hCaption, setHCaption]         = useState("");
  const [hFile, setHFile]               = useState(null);
  const [hPreview, setHPreview]         = useState(null);
  const [hUploading, setHUploading]     = useState(false);
  const [hUploadMsg, setHUploadMsg]     = useState({ type: "", text: "" });
  const [hDeletingId, setHDeletingId]   = useState(null);
  const hFileRef = useRef();

  // ── Enquiries state ───────────────────────────────────────────────────────
  const [enquiries, setEnquiries]               = useState([]);
  const [loadingEnq, setLoadingEnq]             = useState(false);
  const [enqFetchError, setEnqFetchError]       = useState("");
  const [enqFilterProgram, setEnqFilterProgram] = useState("");
  const [enqFilterStatus, setEnqFilterStatus]   = useState("");
  const [enqFilterFrom, setEnqFilterFrom]       = useState("");
  const [enqFilterTo, setEnqFilterTo]           = useState("");
  const [enqUpdatingId, setEnqUpdatingId]       = useState(null);
  const [expandedEnq, setExpandedEnq]           = useState(null);

  // ── Events state ──────────────────────────────────────────────────────────
  const [events, setEvents]             = useState([]);
  const [loadingEvts, setLoadingEvts]   = useState(false);
  const [evtFetchError, setEvtFetchError] = useState("");
  const [evtForm, setEvtForm]           = useState(BLANK_EVENT);
  const [evtSaving, setEvtSaving]       = useState(false);
  const [evtMsg, setEvtMsg]             = useState({ type: "", text: "" });
  const [deletingEvtId, setDeletingEvtId] = useState(null);
  const [editingEvt, setEditingEvt]     = useState(false);
  const [brochureMode, setBrochureMode] = useState("url");
  const [brochureFile, setBrochureFile] = useState(null);
  const brochureFileRef = useRef();
  const [evtPhotoFile, setEvtPhotoFile] = useState(null);
  const evtPhotoFileRef = useRef();
  const [evtTemplateFile, setEvtTemplateFile] = useState(null);
  const [evtTemplateRemove, setEvtTemplateRemove] = useState(false);
  const evtTemplateFileRef = useRef();
  const [evtRegs, setEvtRegs] = useState([]);
  const [evtRegCounts, setEvtRegCounts] = useState({});
  const [evtRegsTotal, setEvtRegsTotal] = useState(0);
  const [evtRegSummary, setEvtRegSummary] = useState({ file_count: 0, row_count: 0, public_count: 0, franchise_count: 0 });
  const [evtRegCities, setEvtRegCities] = useState([]);
  const [evtRegsLoading, setEvtRegsLoading] = useState(false);
  const [evtRegExpanded, setEvtRegExpanded] = useState(null);
  const [evtRegEventId, setEvtRegEventId] = useState(null);
  const [evtRegSearch, setEvtRegSearch] = useState("");
  const [evtRegSource, setEvtRegSource] = useState("");
  const [evtRegCity, setEvtRegCity] = useState("");
  const [evtRegPage, setEvtRegPage] = useState(1);
  const [evtRegDeleting, setEvtRegDeleting] = useState(null);
  const evtFormRef = useRef();

  // ── News state ────────────────────────────────────────────────────────────
  const [news, setNews]                     = useState([]);
  const [loadingNews, setLoadingNews]       = useState(false);
  const [newsFetchError, setNewsFetchError] = useState("");
  const [newsForm, setNewsForm]             = useState(BLANK_NEWS);
  const [newsSaving, setNewsSaving]         = useState(false);
  const [newsMsg, setNewsMsg]               = useState({ type: "", text: "" });
  const [deletingNewsId, setDeletingNewsId] = useState(null);
  const [editingNews, setEditingNews]       = useState(false);
  const [newsFile, setNewsFile]             = useState(null);
  const [newsPreview, setNewsPreview]       = useState(null);
  const [newsPreviewIsVideo, setNewsPreviewIsVideo] = useState(false);
  const [newsRemoveImage, setNewsRemoveImage] = useState(false);
  const newsFormRef = useRef();
  const newsFileRef = useRef();

  // ── Franchises state ──────────────────────────────────────────────────────
  const [franchises, setFranchises]             = useState([]);
  const [loadingFranchises, setLoadingFranchises] = useState(false);
  const [franchiseFetchError, setFranchiseFetchError] = useState("");
  const [franchiseForm, setFranchiseForm]       = useState(BLANK_FRANCHISE);
  const [franchiseSaving, setFranchiseSaving]   = useState(false);
  const [franchiseMsg, setFranchiseMsg]         = useState({ type: "", text: "" });
  const [deletingFranchiseId, setDeletingFranchiseId] = useState(null);
  const [editingFranchise, setEditingFranchise] = useState(false);
  const [franchiseFile, setFranchiseFile]       = useState(null);
  const [franchisePreview, setFranchisePreview] = useState(null);
  const [franchiseRemovePhoto, setFranchiseRemovePhoto] = useState(false);
  const franchiseFormRef = useRef();
  const franchiseFileRef = useRef();

  // ── Portal Users state ────────────────────────────────────────────────────
  const [portalUsers, setPortalUsers]       = useState([]);
  const [loadingPU, setLoadingPU]           = useState(false);
  const [puFetchError, setPuFetchError]     = useState("");
  const [puForm, setPuForm]                 = useState({ center_id: "", name: "", password: "", email: "" });
  const [puSaving, setPuSaving]             = useState(false);
  const [puMsg, setPuMsg]                   = useState({ type: "", text: "" });
  const [deletingPuId, setDeletingPuId]     = useState(null);

  // ── Featured Lessons (videos) ──────────────────────────────────────────────
  const [videos, setVideos]                 = useState([]);
  const [loadingVids, setLoadingVids]       = useState(false);
  const [vidFetchError, setVidFetchError]   = useState("");
  const [vidForm, setVidForm]               = useState(BLANK_VIDEO);
  const [vidSaving, setVidSaving]           = useState(false);
  const [vidMsg, setVidMsg]                 = useState({ type: "", text: "" });
  const [editingVid, setEditingVid]         = useState(false);
  const [deletingVidId, setDeletingVidId]   = useState(null);
  const vidFormRef = useRef(null);


  const storedPw = () => sessionStorage.getItem("rga_admin") || "";

  // ── Confirm Modal (replaces all window.confirm calls) ─────────────────────
  const [confirmModal, setConfirmModal] = useState(null);
  const confirmResolveRef = useRef(null);
  function askConfirm(title, message) {
    return new Promise(resolve => {
      confirmResolveRef.current = resolve;
      setConfirmModal({ title, message });
    });
  }
  function handleConfirmOk()     { setConfirmModal(null); confirmResolveRef.current?.(true);  }
  function handleConfirmCancel() { setConfirmModal(null); confirmResolveRef.current?.(false); }

  // ── Auth ─────────────────────────────────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await fetch(`${API_BASE}/auth.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const raw = await res.text();
      let data = {}; try { data = JSON.parse(raw); } catch (_) {}
      if (res.status === 401) throw new Error("Wrong password");
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
      sessionStorage.setItem("rga_admin", password);
      setAuthed(true);
    } catch (err) { setLoginError(err.message); }
    finally { setLoginLoading(false); }
  }

  function handleLogout() {
    sessionStorage.removeItem("rga_admin");
    setAuthed(false);
    setPassword("");
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    setFpLoading(true);
    setFpError("");
    try {
      const res  = await fetch(`${API_BASE}/forgot_password.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fpEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Request failed");
      setLoginView("sent");
    } catch (err) {
      setFpError(err.message);
    } finally {
      setFpLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setRpError("");
    if (rpPassword !== rpConfirm) {
      setRpError("Passwords do not match.");
      return;
    }
    if (rpPassword.length < 6) {
      setRpError("Password must be at least 6 characters.");
      return;
    }
    setRpLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/reset_password.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: rpToken, newPassword: rpPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Reset failed");
      setRpSuccess("Password updated! You can now sign in with your new password.");
      window.history.replaceState({}, "", "/admin");
    } catch (err) {
      setRpError(err.message);
    } finally {
      setRpLoading(false);
    }
  }

  // ── Enquiries: load ───────────────────────────────────────────────────────
  async function loadEnquiries(filters = {}) {
    setLoadingEnq(true); setEnqFetchError("");
    try {
      const params = new URLSearchParams();
      if (filters.program)   params.set("program",   filters.program);
      if (filters.status)    params.set("status",    filters.status);
      if (filters.date_from) params.set("date_from", filters.date_from);
      if (filters.date_to)   params.set("date_to",   filters.date_to);
      const res = await fetch(`${API_BASE}/enquiries.php?${params}`, {
        headers: { "X-Admin-Password": storedPw() },
      });
      const data = await safeJson(res);
      if (!res.ok || data.error) throw new Error(data.error || "Failed to load enquiries");
      setEnquiries(Array.isArray(data) ? data : []);
    } catch (err) { setEnqFetchError(err.message); }
    finally { setLoadingEnq(false); }
  }

  async function handleEnquiryStatus(id, status) {
    setEnqUpdatingId(id);
    try {
      const res = await fetch(`${API_BASE}/enquiries.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Password": storedPw() },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Update failed");
      setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status } : e));
    } catch (err) { setEnqFetchError("Update failed: " + err.message); }
    finally { setEnqUpdatingId(null); }
  }

  function applyEnqFilters() {
    loadEnquiries({
      program:   enqFilterProgram,
      status:    enqFilterStatus,
      date_from: enqFilterFrom,
      date_to:   enqFilterTo,
    });
  }

  // ── Gallery: load images ──────────────────────────────────────────────────
  async function loadImages() {
    setLoadingImgs(true); setFetchError("");
    try {
      const res = await fetch(`${API_BASE}/gallery.php`);
      const data = await safeJson(res);
      if (!res.ok || data.error) throw new Error(data.error || "Failed to load images");
      let flat = [];
      if (Array.isArray(data)) {
        flat = data.flatMap(g => (g.items || g.images || []).map(img => ({ ...img, display_type: "year" })));
      } else {
        const yFlat = (data.year_groups || []).flatMap(g => (g.items || g.images || []).map(img => ({ ...img, display_type: "year" })));
        const cFlat = (data.category_groups || []).flatMap(g => (g.items || g.images || []).map(img => ({ ...img, display_type: "category" })));
        flat = [...yFlat, ...cFlat];
      }
      setImages(flat);
    } catch (err) { setFetchError(err.message); }
    finally { setLoadingImgs(false); }
  }

  // ── Events: load ─────────────────────────────────────────────────────────
  async function loadEvents() {
    setLoadingEvts(true); setEvtFetchError("");
    try {
      const res = await fetch(`${API_BASE}/events.php`, {
        headers: { "X-Admin-Password": storedPw() },
      });
      const data = await safeJson(res);
      if (!res.ok || data.error) throw new Error(data.error || "Failed to load events");
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) { setEvtFetchError(err.message); }
    finally { setLoadingEvts(false); }
  }

  async function loadEventRegistrationSummary() {
    try {
      const res = await fetch(`${API_BASE}/portal_event_regs.php?summary=1`, {
        headers: { "X-Admin-Password": storedPw() },
      });
      const data = await safeJson(res);
      if (!res.ok || data.error) throw new Error(data.error || "Failed to load registration totals");
      const counts = {};
      for (const row of Array.isArray(data) ? data : []) {
        counts[Number(row.event_id)] = {
          file_count: Number(row.file_count || 0),
          row_count: Number(row.row_count || 0),
        };
      }
      setEvtRegCounts(counts);
    } catch (err) {
      setEvtMsg({ type: "error", text: "Could not load event registration totals: " + err.message });
    }
  }

  async function loadEventRegistrations(eventId = evtRegEventId, page = evtRegPage, filters = {}) {
    if (!eventId) return;
    setEvtRegsLoading(true);
    try {
      const params = new URLSearchParams({
        event_id: String(eventId),
        page: String(page),
        per_page: "25",
      });
      const search = filters.search ?? evtRegSearch;
      const source = filters.source ?? evtRegSource;
      const city = filters.city ?? evtRegCity;
      if (search.trim()) params.set("search", search.trim());
      if (source) params.set("source", source);
      if (city) params.set("city", city);
      const res = await fetch(`${API_BASE}/portal_event_regs.php?${params}`, {
        headers: { "X-Admin-Password": storedPw() },
      });
      const data = await safeJson(res);
      if (!res.ok || data.error) throw new Error(data.error || "Failed to load registrations");
      setEvtRegs(Array.isArray(data.items) ? data.items : []);
      setEvtRegsTotal(Number(data.total || 0));
      setEvtRegSummary(data.summary || { file_count: 0, row_count: 0, public_count: 0, franchise_count: 0 });
      setEvtRegCities(Array.isArray(data.cities) ? data.cities : []);
    } catch (err) {
      setEvtMsg({ type: "error", text: "Could not load event registrations: " + err.message });
    } finally {
      setEvtRegsLoading(false);
    }
  }

  async function toggleEventRegistrationDetails(reg) {
    if (evtRegExpanded === reg.id) {
      setEvtRegExpanded(null);
      return;
    }
    if (Array.isArray(reg.rows)) {
      setEvtRegExpanded(reg.id);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/portal_event_regs.php?id=${reg.id}`, {
        headers: { "X-Admin-Password": storedPw() },
      });
      const data = await safeJson(res);
      if (!res.ok || data.error) throw new Error(data.error || "Could not load participant rows");
      setEvtRegs(prev => prev.map(item => item.id === reg.id ? data : item));
      setEvtRegExpanded(reg.id);
    } catch (err) {
      setEvtMsg({ type: "error", text: err.message });
    }
  }

  async function downloadProtectedEventFile(url, filename) {
    try {
      const res = await fetch(url, { headers: { "X-Admin-Password": storedPw() } });
      if (!res.ok) {
        const data = await safeJson(res);
        throw new Error(data.error || "Download failed");
      }
      const blobUrl = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename || "event-registration.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setEvtMsg({ type: "error", text: err.message });
    }
  }

  function downloadCombinedEventRegistrations() {
    if (!evtRegEventId) return;
    const params = new URLSearchParams({
      event_id: String(evtRegEventId),
      export: "combined",
    });
    const event = events.find(item => Number(item.id) === Number(evtRegEventId));
    const fileStem = (event?.title || "event").replace(/[^a-z0-9_-]+/gi, "_").replace(/^_+|_+$/g, "");
    downloadProtectedEventFile(
      `${API_BASE}/portal_event_regs.php?${params}`,
      `${fileStem || "event"}_combined_registrations.xlsx`
    );
  }

  async function handleEvtRegDelete(id) {
    if (!await askConfirm("Delete Registration Upload", "Permanently remove this uploaded registration file?")) return;
    setEvtRegDeleting(id);
    try {
      const res = await fetch(`${API_BASE}/portal_event_regs.php`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "X-Admin-Password": storedPw() },
        body: JSON.stringify({ id }),
      });
      const data = await safeJson(res);
      if (!res.ok || data.error) throw new Error(data.error || "Delete failed");
      if (evtRegExpanded === id) setEvtRegExpanded(null);
      await Promise.all([
        loadEventRegistrationSummary(),
        loadEventRegistrations(evtRegEventId, evtRegPage),
      ]);
    } catch (err) {
      setEvtMsg({ type: "error", text: "Delete failed: " + err.message });
    } finally {
      setEvtRegDeleting(null);
    }
  }

  async function loadVideos() {
    setLoadingVids(true); setVidFetchError("");
    try {
      const res = await fetch(`${API_BASE}/videos.php`);
      const data = await safeJson(res);
      if (!res.ok || data.error) throw new Error(data.error || "Failed to load videos");
      setVideos(Array.isArray(data) ? data : []);
    } catch (err) { setVidFetchError(err.message); }
    finally { setLoadingVids(false); }
  }

  const vidField = (key) => (e) => setVidForm(f => ({ ...f, [key]: e.target.value }));

  async function handleVidSave(e) {
    e.preventDefault();
    setVidSaving(true); setVidMsg({ type: "", text: "" });
    try {
      const res = await fetch(`${API_BASE}/video_save.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Password": storedPw() },
        body: JSON.stringify(vidForm),
      });
      const data = await safeJson(res);
      if (!res.ok || data.error) throw new Error(data.error || "Failed to save video");
      setVidForm(BLANK_VIDEO); setEditingVid(false);
      setVidMsg({ type: "success", text: editingVid ? "Lesson updated." : "Lesson added." });
      await loadVideos();
    } catch (err) { setVidMsg({ type: "error", text: err.message }); }
    finally { setVidSaving(false); }
  }

  async function handleVidDelete(id) {
    if (!await askConfirm("Delete Lesson", "Remove this featured lesson from the website?")) return;
    setDeletingVidId(id); setVidMsg({ type: "", text: "" });
    try {
      const res = await fetch(`${API_BASE}/video_delete.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Password": storedPw() },
        body: JSON.stringify({ id }),
      });
      const data = await safeJson(res);
      if (!res.ok || data.error) throw new Error(data.error || "Failed to delete video");
      if (vidForm.id === id) { setVidForm(BLANK_VIDEO); setEditingVid(false); }
      await loadVideos();
    } catch (err) { setVidMsg({ type: "error", text: err.message }); }
    finally { setDeletingVidId(null); }
  }

  function startEditVideo(v) {
    setVidForm({ id: v.id, youtube_id: v.youtube_id, title: v.title, level: v.level || "Beginner", sort_order: v.sort_order || 0 });
    setEditingVid(true); setVidMsg({ type: "", text: "" });
    vidFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cancelEditVideo() {
    setVidForm(BLANK_VIDEO); setEditingVid(false); setVidMsg({ type: "", text: "" });
  }

  // ── News CRUD ───────────────────────────────────────────────────────────────
  async function loadNews() {
    setLoadingNews(true); setNewsFetchError("");
    try {
      const res = await fetch(`${API_BASE}/news.php`, {
        headers: { "X-Admin-Password": storedPw() },
      });
      const data = await safeJson(res);
      if (!res.ok || data.error) throw new Error(data.error || "Failed to load news");
      setNews(Array.isArray(data) ? data : []);
    } catch (err) { setNewsFetchError(err.message); }
    finally { setLoadingNews(false); }
  }

  function newsField(key) {
    return (e) => setNewsForm(prev => ({
      ...prev,
      [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));
  }

  function handleNewsFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const isImage = f.type.startsWith("image/");
    const isVideo = ["video/mp4", "video/webm", "video/quicktime"].includes(f.type);
    if (!isImage && !isVideo) {
      setNewsMsg({ type: "error", text: "Please choose an image (JPG, PNG, WebP, GIF) or video (MP4, WebM, MOV) file." });
      return;
    }
    if (isImage && f.size > 10 * 1024 * 1024) {
      setNewsMsg({ type: "error", text: "Image must be under 10 MB." });
      return;
    }
    if (isVideo && f.size > 50 * 1024 * 1024) {
      setNewsMsg({ type: "error", text: "Video must be under 50 MB." });
      return;
    }
    setNewsFile(f);
    setNewsPreview(URL.createObjectURL(f));
    setNewsPreviewIsVideo(isVideo);
    setNewsRemoveImage(false);
    setNewsMsg({ type: "", text: "" });
  }

  function clearNewsImage() {
    setNewsFile(null);
    setNewsPreview(null);
    setNewsPreviewIsVideo(false);
    setNewsRemoveImage(true);
    if (newsFileRef.current) newsFileRef.current.value = "";
  }

  async function handleNewsSave(e) {
    e.preventDefault();
    if (!newsForm.title.trim()) {
      setNewsMsg({ type: "error", text: "Title is required." });
      return;
    }
    if (newsForm.link_url && !/^https?:\/\/.+/i.test(newsForm.link_url.trim())) {
      setNewsMsg({ type: "error", text: "Link URL must start with http:// or https://" });
      return;
    }
    setNewsSaving(true); setNewsMsg({ type: "", text: "" });
    try {
      const fd = new FormData();
      fd.append("id", newsForm.id || 0);
      fd.append("title", newsForm.title.trim());
      fd.append("category", newsForm.category || "News");
      fd.append("date", newsForm.date || "");
      fd.append("news_date", newsForm.date || "");
      fd.append("summary", newsForm.summary || "");
      fd.append("body", newsForm.body || "");
      fd.append("link_url", newsForm.link_url || "");
      fd.append("is_active", newsForm.is_active ? "1" : "0");
      if (newsRemoveImage) fd.append("remove_media", "1");
      if (newsFile) fd.append("media", newsFile);

      const res = await fetch(`${API_BASE}/news_save.php`, {
        method: "POST",
        headers: { "X-Admin-Password": storedPw() },
        body: fd,
      });
      let data = {};
      try { data = await res.json(); } catch (_) {}
      if (!res.ok || data.error) throw new Error(data.error || "Save failed");

      setNewsMsg({ type: "success", text: newsForm.id > 0 ? "News post updated!" : "News post published!" });
      setNewsForm(BLANK_NEWS); setEditingNews(false);
      setNewsFile(null); setNewsPreview(null); setNewsPreviewIsVideo(false); setNewsRemoveImage(false);
      if (newsFileRef.current) newsFileRef.current.value = "";
      await loadNews();
    } catch (err) {
      setNewsMsg({ type: "error", text: err.message });
    } finally { setNewsSaving(false); }
  }

  async function handleNewsDelete(id) {
    if (!(await askConfirm("Delete News Post", "This permanently removes the post and its image. Continue?"))) return;
    setDeletingNewsId(id);
    try {
      const res = await fetch(`${API_BASE}/news_delete.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Password": storedPw() },
        body: JSON.stringify({ id }),
      });
      const data = await safeJson(res);
      if (!res.ok || data.error) throw new Error(data.error || "Delete failed");
      setNews(prev => prev.filter(n => n.id !== id));
      if (newsForm.id === id) cancelEditNews();
    } catch (err) {
      setNewsMsg({ type: "error", text: "Delete failed: " + err.message });
    } finally { setDeletingNewsId(null); }
  }

  function startEditNews(n) {
    const v = (x) => (x === null || x === undefined) ? "" : x;
    setNewsForm({
      ...BLANK_NEWS,
      id: n.id,
      title: v(n.title),
      category: n.category || "News",
      date: v(n.date),
      summary: v(n.summary),
      body: v(n.body),
      link_url: v(n.link_url),
      image: v(n.image),
      is_active: Number(n.is_active) === 1,
    });
    setNewsFile(null);
    setNewsPreview(n.video || n.image || null);
    setNewsPreviewIsVideo(!!n.video);
    setNewsRemoveImage(false);
    setEditingNews(true);
    setNewsMsg({ type: "", text: "" });
    if (newsFileRef.current) newsFileRef.current.value = "";
    setTimeout(() => newsFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  function cancelEditNews() {
    setNewsForm(BLANK_NEWS); setEditingNews(false); setNewsMsg({ type: "", text: "" });
    setNewsFile(null); setNewsPreview(null); setNewsPreviewIsVideo(false); setNewsRemoveImage(false);
    if (newsFileRef.current) newsFileRef.current.value = "";
  }

  // ── Franchises CRUD ───────────────────────────────────────────────────────────
  async function loadFranchises() {
    setLoadingFranchises(true); setFranchiseFetchError("");
    try {
      const res = await fetch(`${API_BASE}/franchises.php`, { headers: { "X-Admin-Password": storedPw() } });
      const data = await safeJson(res);
      if (!res.ok || data.error) throw new Error(data.error || "Failed to load");
      setFranchises(Array.isArray(data) ? data : []);
    } catch (err) { setFranchiseFetchError(err.message); }
    finally { setLoadingFranchises(false); }
  }

  function franchiseField(key) {
    return (e) => setFranchiseForm(prev => ({ ...prev, [key]: e.target.value }));
  }

  function handleFranchiseFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setFranchiseMsg({ type: "error", text: "Please choose an image file." });
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setFranchiseMsg({ type: "error", text: "Image must be under 10 MB." });
      return;
    }
    setFranchiseFile(f);
    setFranchisePreview(URL.createObjectURL(f));
    setFranchiseRemovePhoto(false);
  }

  function clearFranchiseImage() {
    setFranchiseFile(null);
    setFranchisePreview(null);
    setFranchiseForm(prev => ({ ...prev, photo: "" }));
    setFranchiseRemovePhoto(true);
    if (franchiseFileRef.current) franchiseFileRef.current.value = "";
  }

  async function handleFranchiseSave(e) {
    e.preventDefault();
    if (!franchiseForm.academy.trim()) {
      setFranchiseMsg({ type: "error", text: "Academy name is required." });
      return;
    }
    if (!franchiseForm.head.trim()) {
      setFranchiseMsg({ type: "error", text: "Head name is required." });
      return;
    }
    setFranchiseSaving(true); setFranchiseMsg({ type: "", text: "" });
    try {
      const fd = new FormData();
      fd.append("id", franchiseForm.id || 0);
      fd.append("academy", franchiseForm.academy.trim());
      fd.append("head", franchiseForm.head.trim());
      fd.append("area", franchiseForm.area || "");
      fd.append("city", franchiseForm.city || "");
      fd.append("photo", franchiseForm.photo || "");
      if (franchiseRemovePhoto) fd.append("remove_photo", "1");
      if (franchiseFile) fd.append("photo", franchiseFile);

      const res = await fetch(`${API_BASE}/franchise_save.php`, {
        method: "POST",
        headers: { "X-Admin-Password": storedPw() },
        body: fd,
      });
      let data = {};
      try { data = await res.json(); } catch (_) {}
      if (!res.ok || data.error) throw new Error(data.error || "Save failed");

      setFranchiseMsg({ type: "success", text: franchiseForm.id > 0 ? "Franchise updated!" : "Franchise added!" });
      setFranchiseForm(BLANK_FRANCHISE); setEditingFranchise(false);
      setFranchiseFile(null); setFranchisePreview(null); setFranchiseRemovePhoto(false);
      if (franchiseFileRef.current) franchiseFileRef.current.value = "";
      await loadFranchises();
    } catch (err) {
      setFranchiseMsg({ type: "error", text: err.message });
    } finally { setFranchiseSaving(false); }
  }

  async function handleFranchiseDelete(id) {
    if (!(await askConfirm("Delete Franchise", "This permanently removes this franchise card. Continue?"))) return;
    setDeletingFranchiseId(id);
    try {
      const res = await fetch(`${API_BASE}/franchise_delete.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Password": storedPw() },
        body: JSON.stringify({ id }),
      });
      const data = await safeJson(res);
      if (!res.ok || data.error) throw new Error(data.error || "Delete failed");
      setFranchises(prev => prev.filter(f => f.id !== id));
      if (franchiseForm.id === id) cancelEditFranchise();
    } catch (err) {
      setFranchiseMsg({ type: "error", text: "Delete failed: " + err.message });
    } finally { setDeletingFranchiseId(null); }
  }

  function startEditFranchise(f) {
    const v = (x) => (x === null || x === undefined) ? "" : x;
    setFranchiseForm({
      ...BLANK_FRANCHISE,
      id: f.id,
      academy: v(f.academy),
      head: v(f.head),
      area: v(f.area),
      city: v(f.city),
      photo: v(f.photo),
    });
    setFranchiseFile(null);
    setFranchisePreview(f.photo || null);
    setFranchiseRemovePhoto(false);
    setEditingFranchise(true);
    setFranchiseMsg({ type: "", text: "" });
    if (franchiseFileRef.current) franchiseFileRef.current.value = "";
    setTimeout(() => franchiseFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  function cancelEditFranchise() {
    setFranchiseForm(BLANK_FRANCHISE); setEditingFranchise(false); setFranchiseMsg({ type: "", text: "" });
    setFranchiseFile(null); setFranchisePreview(null); setFranchiseRemovePhoto(false);
    if (franchiseFileRef.current) franchiseFileRef.current.value = "";
  }

  useEffect(() => {
    if (authed) { loadImages(); loadEvents(); loadEventRegistrationSummary(); loadEnquiries(); loadHomeImages(); loadVideos(); loadNews(); loadFranchises(); }
  }, [authed]);

  useEffect(() => {
    if (!authed || !evtRegEventId) return;
    const timer = setTimeout(() => {
      loadEventRegistrations(evtRegEventId, evtRegPage, {
        search: evtRegSearch,
        source: evtRegSource,
        city: evtRegCity,
      });
    }, evtRegSearch ? 300 : 0);
    return () => clearTimeout(timer);
  }, [authed, evtRegEventId, evtRegPage, evtRegSearch, evtRegSource, evtRegCity]);

  useEffect(() => {
    if (authed && section === "portal_users") loadPortalUsers();
  }, [authed, section]);

  // ── Portal Users: load ────────────────────────────────────────────────────
  async function loadPortalUsers() {
    setLoadingPU(true); setPuFetchError("");
    try {
      const res  = await fetch(`${API_BASE}/portal_admin.php`, {
        headers: { "X-Admin-Password": storedPw() },
      });
      const data = await safeJson(res);
      if (!res.ok || data.error) throw new Error(data.error || "Failed to load portal users");
      setPortalUsers(Array.isArray(data) ? data : []);
    } catch (err) { setPuFetchError(err.message); }
    finally { setLoadingPU(false); }
  }

  async function handlePuCreate(e) {
    e.preventDefault();
    setPuMsg({ type: "", text: "" });
    if (!puForm.name.trim() || !puForm.password) {
      setPuMsg({ type: "error", text: "Center name and password are required." }); return;
    }
    setPuSaving(true);
    try {
      const res  = await fetch(`${API_BASE}/portal_admin.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Password": storedPw() },
        body: JSON.stringify(puForm),
      });
      const data = await safeJson(res);
      if (!res.ok || data.error) throw new Error(data.error || "Failed to create franchise");
      setPuMsg({ type: "success", text: `Franchise "${puForm.name}" created! Center ID: ${data.center_id}` });
      setPuForm({ center_id: "", name: "", password: "", email: "" });
      await loadPortalUsers();
    } catch (err) { setPuMsg({ type: "error", text: err.message }); }
    finally { setPuSaving(false); }
  }

  async function handlePuDelete(center_id) {
    if (!await askConfirm("Delete Portal User", `Permanently remove franchise account "${center_id}"?`)) return;
    setDeletingPuId(center_id);
    try {
      const res  = await fetch(`${API_BASE}/portal_admin.php`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "X-Admin-Password": storedPw() },
        body: JSON.stringify({ center_id }),
      });
      const data = await safeJson(res);
      if (!res.ok || data.error) throw new Error(data.error || "Delete failed");
      setPortalUsers(prev => prev.filter(u => u.login_id !== center_id));
    } catch (err) { setPuMsg({ type: "error", text: "Delete failed: " + err.message }); }
    finally { setDeletingPuId(null); }
  }

  // ── Gallery: file picker (multi) ─────────────────────────────────────────
  function handleFileChange(e) {
    const selected = Array.from(e.target.files);
    if (!selected.length) return;
    const accepted = selected.slice(0, MAX_GALLERY_FILES);
    const enriched = accepted.map(f => ({
      file: f,
      preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
      isVideo: f.type.startsWith("video/"),
      id: Math.random().toString(36).slice(2),
    }));
    setFiles(enriched);
    setUploadMsg(selected.length > MAX_GALLERY_FILES
      ? { type: "error", text: `Only ${MAX_GALLERY_FILES} files allowed. ${selected.length - MAX_GALLERY_FILES} file(s) were ignored.` }
      : { type: "", text: "" });
    setUploadResults([]);
    if (fileRef.current) fileRef.current.value = "";
  }

  function removeGalleryFile(id) {
    setFiles(prev => {
      const removed = prev.find(f => f.id === id);
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter(f => f.id !== id);
    });
  }

  // ── Gallery: upload (sequential multi) ───────────────────────────────────
  async function handleUpload(e) {
    e.preventDefault();
    if (!files.length) { setUploadMsg({ type: "error", text: "Please select at least one photo or video" }); return; }
    if (uploadMode === "category" && !customCategory.trim()) {
      setUploadMsg({ type: "error", text: "Please enter a category name" }); return;
    }
    setUploading(true);
    setUploadMsg({ type: "", text: "" });
    setUploadResults([]);
    setUploadStats({ speedLabel: null, etaLabel: null });
    setUploadProgress({ current: 0, total: files.length });

    const results = [];
    const startTime = Date.now();
    let bytesUploaded = 0;

    for (let i = 0; i < files.length; i++) {
      const { file } = files[i];
      setUploadProgress({ current: i + 1, total: files.length });
      const fd = new FormData();
      fd.append("image", file);
      fd.append("display_type", uploadMode);
      fd.append("caption", caption || "Gallery Item");
      fd.append(uploadMode === "year" ? "year" : "category", uploadMode === "year" ? year : customCategory.trim());
      if (uploadMode === "year") fd.append("category", "General");
      try {
        const res = await fetch(`${API_BASE}/upload.php`, { method: "POST", headers: { "X-Admin-Password": storedPw() }, body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.error) throw new Error(data.error || "Upload failed");
        results.push({ name: file.name, ok: true });
      } catch (err) {
        results.push({ name: file.name, ok: false, error: err.message });
      }

      bytesUploaded += file.size;
      const elapsedSec = (Date.now() - startTime) / 1000;
      const completed  = i + 1;
      const remaining  = files.length - completed;

      if (elapsedSec > 0.5 && remaining > 0) {
        const mbps        = (bytesUploaded / (1024 * 1024)) / elapsedSec;
        const avgSec      = elapsedSec / completed;
        const etaSec      = Math.round(avgSec * remaining);
        const speedLabel  = mbps >= 0.1
          ? `${mbps.toFixed(1)} MB/s`
          : `${(mbps * 1024).toFixed(0)} KB/s`;
        const etaLabel    = etaSec < 60
          ? `~${etaSec}s remaining`
          : `~${Math.floor(etaSec / 60)}m ${etaSec % 60}s remaining`;
        setUploadStats({ speedLabel, etaLabel });
      } else if (remaining > 0) {
        setUploadStats({ speedLabel: null, etaLabel: "Calculating…" });
      }
    }

    const succeeded = results.filter(r => r.ok).length;
    const failed    = results.filter(r => !r.ok).length;
    setUploadResults(results);

    if (failed === 0) {
      setUploadMsg({ type: "success", text: `${succeeded} file${succeeded !== 1 ? "s" : ""} uploaded successfully!` });
      setFiles([]);
    } else if (succeeded === 0) {
      setUploadMsg({ type: "error", text: `All ${files.length} uploads failed. See details below.` });
    } else {
      setUploadMsg({ type: "error", text: `${succeeded} uploaded, ${failed} failed. See details below.` });
      setFiles(prev => prev.filter((_, i) => !results[i]?.ok));
    }

    if (succeeded > 0) await loadImages();
    setUploading(false);
  }

  // ── Gallery: delete ───────────────────────────────────────────────────────
  async function handleDelete(id) {
    if (!await askConfirm("Delete Image", "Remove this image from the gallery?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE}/delete.php`, { method: "POST", headers: { "Content-Type": "application/json", "X-Admin-Password": storedPw() }, body: JSON.stringify({ id }) });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Delete failed");
      setImages(prev => prev.filter(img => img.id !== id));
      setSelectedIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    } catch (err) { setUploadMsg({ type: "error", text: "Delete failed: " + err.message }); }
    finally { setDeletingId(null); }
  }

  function toggleSelect(id) {
    setSelectedIds(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }

  async function handleBulkDelete() {
    const ids = [...selectedIds];
    if (!ids.length) return;
    if (!await askConfirm("Delete Selected Images", `Permanently remove ${ids.length} selected image${ids.length !== 1 ? "s" : ""}?`)) return;
    setBulkDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/delete.php`, { method: "POST", headers: { "Content-Type": "application/json", "X-Admin-Password": storedPw() }, body: JSON.stringify({ ids }) });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Bulk delete failed");
      const deleted = new Set(data.deleted);
      setImages(prev => prev.filter(img => !deleted.has(img.id)));
      setSelectedIds(new Set());
    } catch (err) { setUploadMsg({ type: "error", text: "Delete failed: " + err.message }); }
    finally { setBulkDeleting(false); }
  }

  // ── Events: save (create or update) ──────────────────────────────────────
  async function handleEvtSave(e) {
    e.preventDefault();
    if (!evtForm.event_date) {
      setEvtMsg({ type: "error", text: "Start date is required." }); return;
    }
    if (!evtForm.title.trim()) {
      setEvtMsg({ type: "error", text: "Title is required." }); return;
    }
    if (!evtForm.venue.trim()) {
      setEvtMsg({ type: "error", text: "Venue is required." }); return;
    }
    if (!evtForm.format.trim()) {
      setEvtMsg({ type: "error", text: "Format is required." }); return;
    }
    if (!evtForm.event_end_date) {
      setEvtMsg({ type: "error", text: "End date is required." }); return;
    }
    if (evtForm.event_end_date && evtForm.event_end_date < evtForm.event_date) {
      setEvtMsg({ type: "error", text: "End date cannot be before the start date." }); return;
    }
    const evtLastDate = evtForm.event_end_date || evtForm.event_date;
    if (evtForm.deadline && (evtForm.deadline < evtForm.event_date || evtForm.deadline > evtLastDate)) {
      setEvtMsg({ type: "error", text: "Registration deadline must be between the start date and the end date." }); return;
    }
    const urlRx = /^https?:\/\/.+/;
    if (evtForm.register_url && !urlRx.test(evtForm.register_url.trim())) {
      setEvtMsg({ type: "error", text: "Register URL must start with http:// or https://" }); return;
    }
    if (brochureMode === "url" && evtForm.brochure_url &&
        !urlRx.test(evtForm.brochure_url.trim()) &&
        !evtForm.brochure_url.trim().startsWith("/uploads/")) {
      setEvtMsg({ type: "error", text: "Brochure URL must start with http:// or https://" }); return;
    }
    if (evtForm.model_question_paper_url && !/^https?:\/\/\S+$/i.test(evtForm.model_question_paper_url.trim())) {
      setEvtMsg({ type: "error", text: "Model question paper URL must start with http:// or https://" }); return;
    }
    setEvtSaving(true); setEvtMsg({ type: "", text: "" });
    let brochureUrlFinal = evtForm.brochure_url;
    if (brochureMode === "file" && brochureFile) {
      try {
        const fd = new FormData();
        fd.append("file", brochureFile);
        const bRes = await fetch(`${API_BASE}/brochure_upload.php`, {
          method: "POST",
          headers: { "X-Admin-Password": storedPw() },
          body: fd,
        });
        const bData = await bRes.json();
        if (!bRes.ok || bData.error) throw new Error(bData.error || "Brochure upload failed");
        brochureUrlFinal = bData.url;
      } catch (err) {
        setEvtMsg({ type: "error", text: "Brochure upload failed: " + err.message });
        setEvtSaving(false); return;
      }
    }
    let imageFinal = evtForm.image;
    if (evtPhotoFile) {
      try {
        const compressed = await compressImageFile(evtPhotoFile);
        const fd = new FormData();
        fd.append("file", compressed);
        const pRes = await fetch(`${API_BASE}/event_photo_upload.php`, {
          method: "POST",
          headers: { "X-Admin-Password": storedPw() },
          body: fd,
        });
        const pData = await pRes.json();
        if (!pRes.ok || pData.error) throw new Error(pData.error || "Photo upload failed");
        imageFinal = pData.url;
      } catch (err) {
        setEvtMsg({ type: "error", text: "Photo upload failed: " + err.message });
        setEvtSaving(false); return;
      }
    }
    const payload = { ...evtForm, image: imageFinal, model_question_paper_url: evtForm.model_question_paper_url.trim() };
    let persistedEventId = Number(evtForm.id || 0);
    try {
      const res = await fetch(`${API_BASE}/event_save.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Password": storedPw() },
        body: JSON.stringify({ ...payload, brochure_url: brochureUrlFinal, is_active: 1 }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Save failed");
      const savedEventId = Number(data.id || evtForm.id);
      persistedEventId = savedEventId;

      if (evtTemplateRemove && savedEventId > 0 && !evtTemplateFile) {
        const tRes = await fetch(`${API_BASE}/portal_event_template.php`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json", "X-Admin-Password": storedPw() },
          body: JSON.stringify({ event_id: savedEventId }),
        });
        const tData = await safeJson(tRes);
        if (!tRes.ok || tData.error) throw new Error(tData.error || "Could not remove registration template");
      }

      if (evtTemplateFile && savedEventId > 0) {
        const fd = new FormData();
        fd.append("event_id", String(savedEventId));
        fd.append("file", evtTemplateFile);
        const tRes = await fetch(`${API_BASE}/portal_event_template.php`, {
          method: "POST",
          headers: { "X-Admin-Password": storedPw() },
          body: fd,
        });
        const tData = await safeJson(tRes);
        if (!tRes.ok || tData.error) throw new Error(tData.error || "Registration template upload failed");
      }

      setEvtMsg({ type: "success", text: evtForm.id > 0 ? "Event updated!" : "Event created!" });
      setEvtForm(BLANK_EVENT); setEditingEvt(false);
      setBrochureMode("url"); setBrochureFile(null);
      setEvtPhotoFile(null);
      setEvtTemplateFile(null); setEvtTemplateRemove(false);
      if (evtTemplateFileRef.current) evtTemplateFileRef.current.value = "";
      await loadEvents();
    } catch (err) {
      if (!evtForm.id && persistedEventId > 0) {
        setEvtForm(prev => ({ ...prev, id: persistedEventId }));
        setEditingEvt(true);
      }
      setEvtMsg({
        type: "error",
        text: persistedEventId > 0
          ? `Event saved, but the registration template change failed: ${err.message}. You can try saving again.`
          : err.message,
      });
      await loadEvents();
    }
    finally { setEvtSaving(false); }
  }

  // ── Home Images: load ─────────────────────────────────────────────────────
  async function loadHomeImages() {
    setHLoadingImgs(true); setHFetchError("");
    try {
      const res = await fetch(`${API_BASE}/home_images.php`);
      const data = await safeJson(res);
      if (!res.ok || data.error) throw new Error(data.error || "Failed to load home images");
      setHomeData({ hero: data.hero || [], gallery: data.gallery || [], awards: data.awards || [] });
    } catch (err) { setHFetchError(err.message); }
    finally { setHLoadingImgs(false); }
  }

  function handleHFileChange(e) {
    const f = e.target.files[0]; if (!f) return;
    setHFile(f); setHPreview(URL.createObjectURL(f));
  }

  async function handleHomeUpload(e, sectionKey) {
    e.preventDefault();
    if (!hFile) { setHUploadMsg({ type: "error", text: "Please select an image" }); return; }
    setHUploading(true); setHUploadMsg({ type: "", text: "" });
    const fd = new FormData();
    fd.append("image", hFile);
    fd.append("section", sectionKey);
    fd.append("caption", hCaption || "");
    try {
      const res = await fetch(`${API_BASE}/home_images.php`, { method: "POST", headers: { "X-Admin-Password": storedPw() }, body: fd });
      let data = {}; try { data = await res.json(); } catch (_) {}
      if (!res.ok || data.error) throw new Error(data.error || "Upload failed");
      setHUploadMsg({ type: "success", text: "Image uploaded!" });
      setHFile(null); setHPreview(null); setHCaption("");
      if (hFileRef.current) hFileRef.current.value = "";
      await loadHomeImages();
    } catch (err) { setHUploadMsg({ type: "error", text: err.message }); }
    finally { setHUploading(false); }
  }

  async function handleHomeDelete(id) {
    if (!await askConfirm("Delete Home Image", "Remove this image from the homepage?")) return;
    setHDeletingId(id);
    try {
      const res = await fetch(`${API_BASE}/home_images.php?id=${id}`, { method: "DELETE", headers: { "X-Admin-Password": storedPw() } });
      let data = {}; try { data = await res.json(); } catch (_) {}
      if (!res.ok || data.error) throw new Error(data.error || "Delete failed");
      setHomeData(prev => ({
        hero:     prev.hero.filter(i => i.id !== id),
        gallery:  prev.gallery.filter(i => i.id !== id),
        awards:   prev.awards.filter(i => i.id !== id),
      }));
    } catch (err) { setHUploadMsg({ type: "error", text: "Delete failed: " + err.message }); }
    finally { setHDeletingId(null); }
  }

  // ── Events: delete ────────────────────────────────────────────────────────
  async function handleEvtDelete(id) {
    if (!await askConfirm("Delete Event", "Permanently remove this event?")) return;
    setDeletingEvtId(id);
    try {
      const res = await fetch(`${API_BASE}/event_delete.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Password": storedPw() },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Delete failed");
      setEvents(prev => prev.filter(ev => ev.id !== id));
      if (evtForm.id === id) { setEvtForm(BLANK_EVENT); setEditingEvt(false); }
    } catch (err) { setEvtMsg({ type: "error", text: "Delete failed: " + err.message }); }
    finally { setDeletingEvtId(null); }
  }

  function startEditEvent(ev) {
    const n = v => (v === null || v === undefined) ? "" : v;
    setEvtForm({
      ...BLANK_EVENT, ...ev,
      is_active:    Number(ev.is_active) === 1,
      event_end_date: n(ev.event_end_date),
      deadline:     n(ev.deadline),
      brochure_url: n(ev.brochure_url),
      model_question_paper_url: n(ev.model_question_paper_url),
      venue:        n(ev.venue),
      format:       n(ev.format),
      participants: n(ev.participants),
      register_url: n(ev.register_url),
      register_label: ev.register_label || "Register Now",
      description:  n(ev.description),
      badge:        n(ev.badge),
      image:        n(ev.image),
    });
    setBrochureMode("url");
    setBrochureFile(null);
    setEvtPhotoFile(null);
    setEvtTemplateFile(null);
    setEvtTemplateRemove(false);
    if (evtTemplateFileRef.current) evtTemplateFileRef.current.value = "";
    setEditingEvt(true);
    setEvtMsg({ type: "", text: "" });
    setTimeout(() => evtFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  function cancelEditEvent() {
    setEvtForm(BLANK_EVENT); setEditingEvt(false); setEvtMsg({ type: "", text: "" });
    setBrochureMode("url"); setBrochureFile(null);
    setEvtPhotoFile(null);
    setEvtTemplateFile(null); setEvtTemplateRemove(false);
    if (evtTemplateFileRef.current) evtTemplateFileRef.current.value = "";
  }

  function evtField(key) {
    return e => setEvtForm(prev => ({ ...prev, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  }

  function handleStatusType(e) {
    const val = e.target.value;
    const label = STATUS_OPTIONS.find(s => s.value === val)?.label || val;
    setEvtForm(prev => ({ ...prev, status_type: val, status_label: label }));
  }

  function handleStartDate(e) {
    const val = e.target.value;
    if (!val) { setEvtForm(prev => ({ ...prev, event_date: "", month: "", day: "", deadline: "" })); return; }
    const d = new Date(val + "T00:00:00");
    const month = MONTHS_LIST[d.getMonth()];
    const day   = String(d.getDate());
    setEvtForm(prev => ({
      ...prev, event_date: val, month, day,
      date_range: prev.event_end_date ? deriveRange(val, prev.event_end_date) : prev.date_range,
      deadline: prev.deadline && (prev.deadline < val || prev.deadline > (prev.event_end_date || val)) ? "" : prev.deadline,
    }));
  }

  function handleEndDate(e) {
    const val = e.target.value;
    if (!val) {
      setEvtForm(prev => ({
        ...prev, event_end_date: "", date_range: "",
        deadline: prev.deadline && prev.event_date && prev.deadline > prev.event_date ? "" : prev.deadline,
      }));
      return;
    }
    setEvtForm(prev => ({
      ...prev, event_end_date: val,
      date_range: deriveRange(prev.event_date || val, val),
      deadline: prev.deadline && prev.deadline > val ? "" : prev.deadline,
    }));
  }

  // ── Login screen ─────────────────────────────────────────────────────────
  if (!authed) {
    const bgStyle = { background: "linear-gradient(135deg, #0b1e38 0%, #142d50 55%, #0f2340 100%)" };
    const inputCls = "w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-secondary/60 transition-colors";
    const labelCls = "block text-xs font-semibold text-white/60 uppercase tracking-widest mb-2";

    const Header = ({ title, sub }) => (
      <div className="text-center mb-8">
        <img src="/images/rabbi-logo-badge.webp" alt="Rabbi Global Academy" className="inline-block h-28 w-28 object-contain drop-shadow-lg mb-4" />
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="text-white/50 text-sm mt-1">{sub}</p>
      </div>
    );

    // ── Step: set new password (token in URL) ────────────────────────────
    if (loginView === "reset") {
      return (
        <div className="min-h-screen flex items-center justify-center p-4" style={bgStyle}>
          <div className="w-full max-w-sm">
            <Header title="Set New Password" sub="Rabbi Global Academy" />
            {rpSuccess ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 backdrop-blur-sm text-center">
                <Alert type="success" message={rpSuccess} />
                <button onClick={() => setLoginView("login")}
                  className="w-full bg-secondary text-primary font-bold py-3 rounded-xl hover:bg-secondary/90 transition-colors mt-2">
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 backdrop-blur-sm">
                <div>
                  <label className={labelCls}>New Password</label>
                  <input type="password" value={rpPassword} onChange={e => setRpPassword(e.target.value)}
                    placeholder="At least 6 characters" required className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Confirm Password</label>
                  <input type="password" value={rpConfirm} onChange={e => setRpConfirm(e.target.value)}
                    placeholder="Repeat new password" required className={inputCls} />
                </div>
                {rpError && <Alert type="error" message={rpError} />}
                <button type="submit" disabled={rpLoading}
                  className="w-full flex items-center justify-center gap-2 bg-secondary text-primary font-bold py-3 rounded-xl hover:bg-secondary/90 transition-colors disabled:opacity-60">
                  {rpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {rpLoading ? "Saving..." : "Update Password"}
                </button>
                <button type="button" onClick={() => setLoginView("forgot")}
                  className="w-full text-white/40 hover:text-white/70 text-xs text-center transition-colors">
                  Request a new reset link
                </button>
              </form>
            )}
          </div>
        </div>
      );
    }

    // ── Step: check your inbox ───────────────────────────────────────────
    if (loginView === "sent") {
      return (
        <div className="min-h-screen flex items-center justify-center p-4" style={bgStyle}>
          <div className="w-full max-w-sm">
            <Header title="Check Your Inbox" sub="Rabbi Global Academy" />
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 backdrop-blur-sm text-center">
              <p className="text-white/70 text-sm leading-relaxed">
                If that email matches our records, a reset link has been sent.<br />
                The link expires in <span className="text-secondary font-semibold">15 minutes</span>.
              </p>
              <p className="text-white/40 text-xs">
                Didn&apos;t receive it? Check your spam folder or request a new link.
              </p>
              <button onClick={() => { setFpEmail(""); setFpError(""); setLoginView("forgot"); }}
                className="w-full border border-white/15 text-white/70 hover:text-white hover:border-white/30 font-semibold py-3 rounded-xl transition-colors text-sm">
                Request a New Link
              </button>
              <button onClick={() => setLoginView("login")}
                className="w-full text-white/40 hover:text-white/60 text-xs transition-colors">
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      );
    }

    // ── Step: forgot password (email entry) ──────────────────────────────
    if (loginView === "forgot") {
      return (
        <div className="min-h-screen flex items-center justify-center p-4" style={bgStyle}>
          <div className="w-full max-w-sm">
            <Header title="Reset Password" sub="Rabbi Global Academy" />
            <form onSubmit={handleForgotPassword} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 backdrop-blur-sm">
              <p className="text-white/50 text-sm">
                Enter your admin email address and we&apos;ll send you a reset link.
              </p>
              <div>
                <label className={labelCls}>Admin Email</label>
                <input type="email" value={fpEmail} onChange={e => setFpEmail(e.target.value)}
                  placeholder="admin@rabbiglobalacademy.com" required className={inputCls} />
              </div>
              {fpError && <Alert type="error" message={fpError} />}
              <button type="submit" disabled={fpLoading}
                className="w-full flex items-center justify-center gap-2 bg-secondary text-primary font-bold py-3 rounded-xl hover:bg-secondary/90 transition-colors disabled:opacity-60">
                {fpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {fpLoading ? "Sending..." : "Send Reset Link"}
              </button>
              <button type="button" onClick={() => { setFpError(""); setLoginView("login"); }}
                className="w-full text-white/40 hover:text-white/70 text-xs text-center transition-colors">
                ← Back to Sign In
              </button>
            </form>
          </div>
        </div>
      );
    }

    // ── Step: normal login ───────────────────────────────────────────────
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={bgStyle}>
        <Seo title="Admin" path="/admin" noindex />
        <div className="w-full max-w-sm">
          <Header title="Admin" sub="Rabbi Global Academy" />
          <form onSubmit={handleLogin} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 backdrop-blur-sm">
            <div>
              <label className={labelCls}>Admin Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Enter your admin password" required className={inputCls} />
            </div>
            {loginError && <Alert type="error" message={loginError} />}
            <button type="submit" disabled={loginLoading}
              className="w-full flex items-center justify-center gap-2 bg-secondary text-primary font-bold py-3 rounded-xl hover:bg-secondary/90 transition-colors disabled:opacity-60">
              {loginLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loginLoading ? "Checking..." : "Sign In"}
            </button>
            <button type="button" onClick={() => { setLoginError(""); setLoginView("forgot"); }}
              className="w-full text-white/40 hover:text-white/70 text-xs text-center transition-colors">
              Forgot password?
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  const yearImages   = images.filter(i => i.display_type === "year");
  const catImages    = images.filter(i => i.display_type === "category");
  const videoCount   = images.filter(i => i.media_type === "video").length;
  const yearKeys     = [...new Set(yearImages.map(i => i.year))].sort((a, b) => b - a);
  const categoryKeys = [...new Set(catImages.map(i => i.category))].sort();

  return (
    <div className="relative min-h-[100dvh] bg-[#050f1d] text-white font-sans selection:bg-secondary/30">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#1e40af]/10 blur-[120px]" />
      </div>

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-[#081b30]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 flex-shrink-0">
              <img src="/images/rabbi-logo-badge.webp" alt="Logo" className="h-full w-full object-contain drop-shadow-lg" />
            </div>
            <div>
              <h1 className="text-white font-bold text-base leading-tight tracking-tight">Rabbi Global Academy</h1>
              <p className="text-[10px] text-white/50 uppercase tracking-widest font-semibold mt-0.5">Admin Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex gap-4 items-center">
              <div className="text-center">
                <div className="text-secondary font-bold text-lg leading-none">{enquiries.filter(e => e.status === "new").length}</div>
                <div className="text-white/40 text-[10px] uppercase tracking-widest font-semibold mt-0.5">New Leads</div>
              </div>
              <div className="w-px h-8 bg-white/10 mx-2" />
              <div className="text-center">
                <div className="text-secondary font-bold text-lg leading-none">{images.length}</div>
                <div className="text-white/40 text-[10px] uppercase tracking-widest font-semibold mt-0.5">Media</div>
              </div>
              <div className="w-px h-8 bg-white/10 mx-2" />
              <div className="text-center">
                <div className="text-secondary font-bold text-lg leading-none">{events.length}</div>
                <div className="text-white/40 text-[10px] uppercase tracking-widest font-semibold mt-0.5">Events</div>
              </div>
            </div>
            <button onClick={handleLogout}
              className="flex items-center justify-center h-9 w-9 rounded-full text-white/50 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-2" title="Log out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Main tab bar: Website Content vs Student Portal */}
        <div className="max-w-7xl mx-auto px-4 pb-0 flex overflow-x-auto scrollbar-none gap-1" aria-label="Admin sections">
          {[
            { key: "website",      icon: LayoutGrid, label: "Website Content", active: section !== "portal_users", onClick: () => { if (section === "portal_users") setSection("gallery"); }, badge: enquiries.filter(e => e.status === "new").length },
            { key: "portal_users", icon: Users,      label: "Student/Franchise",  active: section === "portal_users", onClick: () => setSection("portal_users") },
          ].map(({ key, icon: Icon, label, active, onClick, badge }) => (
            <button key={key} onClick={onClick}
              className={`relative shrink-0 flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all duration-200 overflow-hidden group whitespace-nowrap ${
                active
                  ? "bg-[#0f1c2e] text-white shadow-sm border-t border-x border-white/5 rounded-t-xl"
                  : "text-white/50 hover:text-white hover:bg-white/5 border-t border-x border-transparent rounded-xl mb-1"
              }`}>
              <Icon className={`h-4 w-4 ${active ? "text-secondary" : "text-white/40 group-hover:text-white/70"}`} />
              {label}
              {badge > 0 && (
                <span className={`ml-1.5 flex h-5 min-w-5 items-center justify-center rounded-full text-[10px] font-bold px-1.5 ${
                  active ? "bg-secondary text-[#081b30]" : "bg-rose-500 text-white"
                }`}>{badge}</span>
              )}
              {active && <div className="absolute top-0 left-0 right-0 h-0.5 bg-secondary rounded-full" />}
            </button>
          ))}
        </div>
      </header>

      {/* Website sub-section pills */}
      {section !== "portal_users" && (
        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-5 flex overflow-x-auto scrollbar-none gap-2">
          {[
            { key: "gallery",    icon: Image,      label: "Gallery" },
            { key: "news",       icon: Newspaper,  label: "News" },
            { key: "franchises", icon: Building2,  label: "Franchises" },
            { key: "events",     icon: CalendarDays, label: "Events" },
            { key: "videos",     icon: Video,      label: "Featured Lessons" },
            { key: "enquiries",  icon: Inbox,      label: "Enquiries", badge: enquiries.filter(e => e.status === "new").length },
            { key: "home_page",  icon: LayoutGrid, label: "Home Page" },
          ].map(({ key, icon: Icon, label, badge }) => (
            <button key={key} onClick={() => setSection(key)}
              className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-all duration-200 ${
                section === key
                  ? "bg-secondary text-[#081b30] border-secondary"
                  : "bg-white/5 text-white/60 border-white/10 hover:text-white hover:border-white/25"
              }`}>
              <Icon className="h-3.5 w-3.5" />
              {label}
              {badge > 0 && (
                <span className={`flex h-4 min-w-4 items-center justify-center rounded-full text-[10px] font-bold px-1 ${
                  section === key ? "bg-[#081b30] text-secondary" : "bg-rose-500 text-white"
                }`}>{badge}</span>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto min-w-0">

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ── GALLERY SECTION ─────────────────────────────────────────────── */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {section === "gallery" && (
        <div className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-[380px_1fr] gap-8">

          {/* Upload form */}
          <div className="space-y-4">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <Plus className="h-5 w-5 text-secondary" /> Upload Photo or Video
            </h2>
            <form onSubmit={handleUpload} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 backdrop-blur-sm">

              {/* Upload mode toggle */}
              <div>
                <label className="block text-xs font-semibold text-white/60 uppercase tracking-widest mb-2">Upload Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {[{ key: "year", icon: Calendar, label: "Year-based" }, { key: "category", icon: Tag, label: "Custom Category" }].map(({ key, icon: Icon, label }) => (
                    <button key={key} type="button" onClick={() => setUploadMode(key)}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        uploadMode === key ? "bg-secondary text-primary shadow-md" : "bg-white/5 text-white/50 border border-white/10 hover:border-white/25"
                      }`}>
                      <Icon className="h-4 w-4" /> {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* File picker */}
              <div>
                <label className="block text-xs font-semibold text-white/60 uppercase tracking-widest mb-2">
                  Photos / Videos * <span className="text-white/30 normal-case font-normal">— up to {MAX_GALLERY_FILES} files</span>
                </label>
                <div className="relative border-2 border-dashed border-white/20 hover:border-secondary/50 rounded-xl p-4 text-center cursor-pointer transition-colors group"
                  onClick={() => fileRef.current?.click()}>
                  <div className="flex items-center justify-center gap-3 mb-1">
                    <Upload className="h-6 w-6 text-white/30 group-hover:text-secondary/60 transition-colors" />
                    <Video className="h-5 w-5 text-white/20 group-hover:text-secondary/40 transition-colors" />
                  </div>
                  <p className="text-white/50 text-sm">Click to choose photos or videos</p>
                  <p className="text-white/30 text-xs mt-0.5">Images max 10 MB · Videos max 200 MB</p>
                  <input ref={fileRef} type="file" multiple
                    accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,video/x-msvideo"
                    onChange={handleFileChange} className="hidden" />
                </div>

                {/* Thumbnail grid */}
                {files.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-white/50">{files.length} file{files.length !== 1 ? "s" : ""} selected</span>
                      <button type="button"
                        onClick={() => { setFiles([]); setUploadMsg({ type: "", text: "" }); setUploadResults([]); }}
                        className="text-xs text-white/40 hover:text-red-400 transition-colors">
                        Clear all
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2 max-h-52 overflow-y-auto pr-0.5">
                      {files.map(({ file: f, preview: prev, isVideo, id }) => {
                        const sizeLabel = f.size < 1024 * 1024
                          ? `${(f.size / 1024).toFixed(0)} KB`
                          : `${(f.size / (1024 * 1024)).toFixed(1)} MB`;
                        return (
                          <div key={id} className="relative group/thumb rounded-lg overflow-hidden bg-white/5 border border-white/10 flex flex-col">
                            <div className="relative aspect-square">
                              {prev ? (
                                <img src={prev} alt={f.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-white/5">
                                  <Film className="h-6 w-6 text-secondary/60" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/40 transition-colors" />
                              <button type="button"
                                onClick={(e) => { e.stopPropagation(); removeGalleryFile(id); }}
                                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity text-[10px] font-bold leading-none">
                                ✕
                              </button>
                            </div>
                            <div className="px-1.5 py-1 flex-1">
                              <p className="text-white/60 text-[9px] leading-tight truncate">{f.name}</p>
                              <p className="text-white/30 text-[9px] mt-0.5">{sizeLabel}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {uploadMode === "year" ? (
                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-widest mb-2">Year *</label>
                  <select value={year} onChange={e => setYear(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-secondary/60 transition-colors">
                    {YEAR_OPTIONS.map(y => <option key={y} value={y} className="bg-[#142d50]">{y}</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-widest mb-2">Category Name *</label>
                  <input type="text" value={customCategory} onChange={e => setCustomCategory(e.target.value)}
                    placeholder="e.g. Franchise Events, Awards" maxLength={100}
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-secondary/60 transition-colors" />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-white/60 uppercase tracking-widest mb-2">Caption</label>
                <input type="text" value={caption} onChange={e => setCaption(e.target.value)}
                  placeholder="e.g. Annual Day Celebration" maxLength={255}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-secondary/60 transition-colors" />
              </div>

              {/* Progress bar */}
              {uploading && uploadProgress.total > 0 && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-white/50">
                    <span>Uploading {uploadProgress.current} of {uploadProgress.total}…</span>
                    <span>{Math.round((uploadProgress.current / uploadProgress.total) * 100)}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5 mb-2">
                    <div className="bg-secondary h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }} />
                  </div>
                  {(uploadStats.etaLabel || uploadStats.speedLabel) && (
                    <div className="flex justify-between text-[11px] text-white/35">
                      <span>{uploadStats.etaLabel}</span>
                      {uploadStats.speedLabel && <span>{uploadStats.speedLabel}</span>}
                    </div>
                  )}
                </div>
              )}

              {uploadMsg.text && <Alert type={uploadMsg.type} message={uploadMsg.text} />}

              {/* Per-file failure details */}
              {uploadResults.filter(r => !r.ok).length > 0 && (
                <div className="space-y-1 max-h-28 overflow-y-auto">
                  {uploadResults.filter(r => !r.ok).map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
                      <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                      <span><span className="font-medium">{r.name}</span> — {r.error}</span>
                    </div>
                  ))}
                </div>
              )}

              <button type="submit" disabled={uploading || files.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-secondary text-primary font-bold py-3 rounded-xl hover:bg-secondary/90 transition-colors disabled:opacity-60">
                {uploading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading {uploadProgress.current} of {uploadProgress.total}…</>
                  : <><Upload className="h-4 w-4" /> {files.length > 0 ? `Upload ${files.length} File${files.length !== 1 ? "s" : ""}` : "Upload Files"}</>
                }
              </button>
            </form>
          </div>

          {/* Image list */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg flex items-center gap-2"><Eye className="h-5 w-5 text-secondary" /> All Gallery Media</h2>
              <div className="flex items-center gap-2">
                {selectedIds.size > 0 && (
                  <button onClick={handleBulkDelete} disabled={bulkDeleting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/25 transition-colors disabled:opacity-50">
                    {bulkDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    Delete {selectedIds.size} selected
                  </button>
                )}
                <button onClick={loadImages} className="text-white/40 hover:text-white text-xs transition-colors border border-white/10 hover:border-white/25 rounded-lg px-3 py-1.5">Refresh</button>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              {[{ key: "year", label: `By Year (${yearImages.length})`, Icon: Calendar }, { key: "category", label: `By Category (${catImages.length})`, Icon: Tag }].map(({ key, label, Icon }) => (
                <button key={key} onClick={() => { setListTab(key); setSelectedIds(new Set()); }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${listTab === key ? "bg-secondary text-primary shadow" : "bg-white/5 text-white/50 border border-white/10 hover:border-white/25"}`}>
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>

            {loadingImgs && <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 text-secondary animate-spin" /></div>}
            {fetchError && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
                <p className="text-white font-semibold mb-1">Could not load gallery</p>
                <p className="text-white/40 text-sm">{fetchError}</p>
              </div>
            )}

            {!loadingImgs && !fetchError && (
              <>
                {listTab === "year" && (
                  yearKeys.length === 0
                    ? <EmptyState icon={Calendar} message="No year-based media yet." />
                    : <div className="space-y-2">
                        {yearKeys.map(y => {
                          const imgs = yearImages.filter(i => i.year === y);
                          const vids = imgs.filter(i => i.media_type === "video").length;
                          const groupIds = imgs.map(i => i.id);
                          const allChecked = groupIds.length > 0 && groupIds.every(id => selectedIds.has(id));
                          const someChecked = groupIds.some(id => selectedIds.has(id));
                          return (
                            <div key={y}>
                              <div className="flex items-center gap-3 mb-2 mt-4">
                                <input type="checkbox" checked={allChecked} ref={el => el && (el.indeterminate = someChecked && !allChecked)}
                                  onChange={() => setSelectedIds(prev => {
                                    const s = new Set(prev);
                                    allChecked ? groupIds.forEach(id => s.delete(id)) : groupIds.forEach(id => s.add(id));
                                    return s;
                                  })}
                                  className="w-3.5 h-3.5 accent-secondary cursor-pointer" />
                                <span className="text-secondary font-bold text-sm">{y}</span>
                                <span className="text-white/30 text-xs">{imgs.length} item{imgs.length !== 1 ? "s" : ""}</span>
                                {vids > 0 && <span className="text-purple-400 text-xs flex items-center gap-0.5"><Video className="h-3 w-3" />{vids}</span>}
                                <div className="flex-1 h-px bg-white/10" />
                              </div>
                              <MediaListGrid images={imgs} onDelete={handleDelete} deletingId={deletingId} selectedIds={selectedIds} onToggle={toggleSelect} />
                            </div>
                          );
                        })}
                      </div>
                )}

                {listTab === "category" && (
                  categoryKeys.length === 0
                    ? <EmptyState icon={Tag} message="No custom category media yet." sub='Switch to "Custom Category" in the upload form.' />
                    : <div className="space-y-2">
                        {categoryKeys.map(cat => {
                          const imgs = catImages.filter(i => i.category === cat);
                          const vids = imgs.filter(i => i.media_type === "video").length;
                          const groupIds = imgs.map(i => i.id);
                          const allChecked = groupIds.length > 0 && groupIds.every(id => selectedIds.has(id));
                          const someChecked = groupIds.some(id => selectedIds.has(id));
                          return (
                            <div key={cat}>
                              <div className="flex items-center gap-3 mb-2 mt-4">
                                <input type="checkbox" checked={allChecked} ref={el => el && (el.indeterminate = someChecked && !allChecked)}
                                  onChange={() => setSelectedIds(prev => {
                                    const s = new Set(prev);
                                    allChecked ? groupIds.forEach(id => s.delete(id)) : groupIds.forEach(id => s.add(id));
                                    return s;
                                  })}
                                  className="w-3.5 h-3.5 accent-secondary cursor-pointer" />
                                <Tag className="h-3.5 w-3.5 text-secondary" />
                                <span className="text-secondary font-bold text-sm">{cat}</span>
                                <span className="text-white/30 text-xs">{imgs.length} item{imgs.length !== 1 ? "s" : ""}</span>
                                {vids > 0 && <span className="text-purple-400 text-xs flex items-center gap-0.5"><Video className="h-3 w-3" />{vids}</span>}
                                <div className="flex-1 h-px bg-white/10" />
                              </div>
                              <MediaListGrid images={imgs} onDelete={handleDelete} deletingId={deletingId} selectedIds={selectedIds} onToggle={toggleSelect} />
                            </div>
                          );
                        })}
                      </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ── EVENTS SECTION ──────────────────────────────────────────────── */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {section === "events" && (
        <div className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-[420px_1fr] gap-8">

          {/* Event form */}
          <div className="space-y-4" ref={evtFormRef}>
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                {editingEvt ? <Edit2 className="h-5 w-5 text-secondary" /> : <Plus className="h-5 w-5 text-secondary" />}
                {editingEvt ? "Edit Event" : "Add New Event"}
              </h2>
              {editingEvt && (
                <button type="button" onClick={cancelEditEvent}
                  className="flex items-center gap-1.5 text-sm font-semibold text-secondary hover:text-secondary/80 transition-colors">
                  <X className="h-4 w-4" /> Back to Add Event
                </button>
              )}
            </div>

            <form onSubmit={handleEvtSave} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 backdrop-blur-sm" autoComplete="off">

              {/* Date pickers */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1">Start Date *</label>
                  <DatePickerButton
                    value={evtForm.event_date}
                    onChange={handleStartDate}
                    placeholder="Select start date"
                  />
                  {evtForm.month && (
                    <p className="text-white/40 text-[10px] mt-0.5">{evtForm.month} {evtForm.day}</p>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1">End Date *</label>
                  <DatePickerButton
                    value={evtForm.event_end_date || ""}
                    onChange={handleEndDate}
                    placeholder="Select end date"
                    min={evtForm.event_date || undefined}
                  />
                  {evtForm.date_range && (
                    <p className="text-white/40 text-[10px] mt-0.5">{evtForm.date_range}</p>
                  )}
                </div>
              </div>

              {/* Badge + Status */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1">Badge</label>
                  <input type="text" value={evtForm.badge} onChange={evtField("badge")} placeholder="8th Edition"
                    className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white placeholder-white/25 text-sm focus:outline-none focus:border-secondary/60" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1">Status</label>
                  <select value={evtForm.status_type} onChange={handleStatusType}
                    className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-secondary/60">
                    {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value} className="bg-[#142d50]">{s.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1">Title *</label>
                <input type="text" value={evtForm.title} onChange={evtField("title")} required placeholder="Rabbi Global Academy"
                  className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white placeholder-white/25 text-sm focus:outline-none focus:border-secondary/60" />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1">Subtitle <span className="text-white/30 normal-case">(optional)</span></label>
                <input type="text" value={evtForm.subtitle} onChange={evtField("subtitle")} placeholder="National Abacus Championship 2026"
                  className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white placeholder-white/25 text-sm focus:outline-none focus:border-secondary/60" />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1">Description <span className="text-white/30 normal-case">(optional)</span></label>
                <textarea value={evtForm.description} onChange={evtField("description")} rows={3}
                  placeholder="Brief description of the event..."
                  className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white placeholder-white/25 text-sm focus:outline-none focus:border-secondary/60 resize-none" />
              </div>

              {/* Details row */}
              <div className="grid grid-cols-3 gap-2">
                {[["venue", "Venue *", "Bengaluru"], ["format", "Format *", "Onsite"]].map(([k, lbl, ph]) => (
                  <div key={k}>
                    <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1">{lbl}</label>
                    <input type="text" value={evtForm[k]} onChange={evtField(k)} placeholder={ph}
                      className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white placeholder-white/25 text-sm focus:outline-none focus:border-secondary/60" />
                  </div>
                ))}
                <div>
                  <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1">Participants</label>
                  <input type="text" value={evtForm.participants} onChange={evtField("participants")} placeholder="1,500+"
                    className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white placeholder-white/25 text-sm focus:outline-none focus:border-secondary/60" />
                  <p className="text-white/25 text-[10px] mt-0.5">Leave blank to hide.</p>
                </div>
              </div>

              {/* Buttons — Register + event resources */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1">Register Button Label</label>
                  <input type="text" value={evtForm.register_label} onChange={evtField("register_label")} placeholder="Register for Championship"
                    className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white placeholder-white/25 text-sm focus:outline-none focus:border-secondary/60" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1">Register URL (Google Form)</label>
                  <input type="url" value={evtForm.register_url} onChange={evtField("register_url")}
                    className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white placeholder-white/25 text-sm focus:outline-none focus:border-secondary/60" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1">Brochure</label>
                  <div className="flex gap-1 mb-2">
                    {[["url", "URL Link"], ["file", "File Upload"]].map(([m, lbl]) => (
                      <button key={m} type="button"
                        onClick={() => { setBrochureMode(m); setBrochureFile(null); setEvtForm(prev => ({ ...prev, brochure_url: "" })); }}
                        className={`flex-1 text-xs py-1.5 rounded-lg font-semibold transition-all ${brochureMode === m ? "bg-secondary text-primary" : "bg-white/5 text-white/50 border border-white/10 hover:border-white/25"}`}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                  {brochureMode === "url" ? (
                    <div>
                      <input type="url" value={evtForm.brochure_url} onChange={evtField("brochure_url")}
                        className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white placeholder-white/25 text-sm focus:outline-none focus:border-secondary/60" />
                    </div>
                  ) : (
                    <div>
                      <div className="relative border-2 border-dashed border-white/15 rounded-xl p-3 text-center cursor-pointer hover:border-secondary/40 transition-colors"
                        onClick={() => brochureFileRef.current?.click()}>
                        {brochureFile
                          ? <p className="text-white/70 text-xs py-1 truncate">{brochureFile.name}</p>
                          : <div className="py-2">
                              <Upload className="h-6 w-6 text-white/20 mx-auto mb-1" />
                              <p className="text-white/40 text-xs">Click to choose PDF or image</p>
                              <p className="text-white/25 text-[10px] mt-0.5">PDF, JPG, PNG, WebP — max 20 MB</p>
                            </div>
                        }
                      </div>
                      <input ref={brochureFileRef} type="file" accept=".pdf,image/*" className="hidden"
                        onChange={e => setBrochureFile(e.target.files[0] || null)} />
                      {evtForm.brochure_url && evtForm.brochure_url.startsWith("/uploads/") && (
                        <p className="text-white/30 text-[10px] mt-0.5">Current file: {evtForm.brochure_url.split("/").pop()}</p>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label htmlFor="model-question-paper-url" className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1">
                    Model Question Paper URL <span className="text-white/30 normal-case">(optional)</span>
                  </label>
                  <input id="model-question-paper-url" type="url" maxLength={2000}
                    value={evtForm.model_question_paper_url} onChange={evtField("model_question_paper_url")}
                    placeholder="https://example.com/model-paper.pdf"
                    className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white placeholder-white/25 text-sm focus:outline-none focus:border-secondary/60" />
                  <p className="text-white/30 text-[10px] mt-1">Link to a practice paper for students. Leave blank to hide the button.</p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1">
                  Bulk Registration Excel Template <span className="text-white/30 normal-case">(optional)</span>
                </label>
                <div
                  onClick={() => evtTemplateFileRef.current?.click()}
                  className="border-2 border-dashed border-white/15 rounded-lg p-3 text-center cursor-pointer hover:border-secondary/50 transition-colors"
                >
                  {evtTemplateFile ? (
                    <div className="py-1">
                      <FileSpreadsheet className="h-6 w-6 text-secondary mx-auto mb-1" />
                      <p className="text-white/70 text-xs truncate">{evtTemplateFile.name}</p>
                    </div>
                  ) : (
                    <div className="py-2">
                      <Upload className="h-6 w-6 text-white/20 mx-auto mb-1" />
                      <p className="text-white/40 text-xs">
                        {evtForm.has_registration_template && !evtTemplateRemove ? "Click to replace the current template" : "Click to choose an Excel template"}
                      </p>
                      <p className="text-white/25 text-[10px] mt-0.5">XLSX, XLS or CSV — max 10 MB</p>
                    </div>
                  )}
                </div>
                <input
                  ref={evtTemplateFileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={e => {
                    setEvtTemplateFile(e.target.files[0] || null);
                    if (e.target.files[0]) setEvtTemplateRemove(false);
                  }}
                />
                {evtForm.has_registration_template && !evtTemplateRemove && !evtTemplateFile && (
                  <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-emerald-500/10 border border-emerald-400/20 px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-emerald-300 text-xs font-semibold">Bulk registration enabled</p>
                      <p className="text-white/40 text-[10px] truncate">{evtForm.registration_template_name}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => downloadProtectedEventFile(
                          `${API_BASE}/portal_event_template.php?event_id=${evtForm.id}`,
                          evtForm.registration_template_name
                        )}
                        className="p-2 rounded-lg text-white/50 hover:text-secondary hover:bg-white/10"
                        title="Download current template"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEvtTemplateRemove(true)}
                        className="p-2 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-500/10"
                        title="Remove template"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
                {evtTemplateRemove && (
                  <div className="mt-2 flex items-center justify-between rounded-lg bg-red-500/10 border border-red-400/20 px-3 py-2">
                    <p className="text-red-300 text-xs">Template will be removed when you save.</p>
                    <button type="button" onClick={() => setEvtTemplateRemove(false)} className="text-white/60 text-xs hover:text-white">Undo</button>
                  </div>
                )}
                <p className="text-white/30 text-[10px] mt-1">
                  The public bulk-upload option appears only when this event has a template.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1">Event Photo <span className="text-white/30 normal-case">(optional)</span></label>
                <p className="text-white/45 text-xs leading-relaxed mb-2">Recommended: 3:2 landscape (1500 × 1000 pixels). Other ratios are supported: the homepage adjusts to the photo’s natural height to show the full image without cropping or added gaps.</p>
                <div onClick={() => evtPhotoFileRef.current?.click()}
                  className="border-2 border-dashed border-white/15 rounded-lg p-3 text-center cursor-pointer hover:border-secondary/50 transition-colors">
                  {evtPhotoFile
                    ? <p className="text-white/70 text-xs py-1 truncate">{evtPhotoFile.name}</p>
                    : evtForm.image
                      ? <img src={evtForm.image} alt="Event" className="max-h-28 mx-auto rounded-lg object-contain" />
                      : <div className="py-2">
                          <Upload className="h-6 w-6 text-white/20 mx-auto mb-1" />
                          <p className="text-white/40 text-xs">Click to choose a photo</p>
                          <p className="text-white/25 text-[10px] mt-0.5">JPG, PNG, WebP, GIF — max 20 MB</p>
                        </div>
                  }
                </div>
                <input ref={evtPhotoFileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => setEvtPhotoFile(e.target.files[0] || null)} />
                {(evtPhotoFile || evtForm.image) && (
                  <button type="button"
                    onClick={() => { setEvtPhotoFile(null); setEvtForm(prev => ({ ...prev, image: "" })); if (evtPhotoFileRef.current) evtPhotoFileRef.current.value = ""; }}
                    className="text-red-300/70 hover:text-red-300 text-[10px] font-semibold mt-1">
                    Remove photo
                  </button>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1">Registration Deadline</label>
                <DatePickerButton
                  value={evtForm.deadline}
                  onChange={evtField("deadline")}
                  placeholder="Select deadline date"
                  min={evtForm.event_date || undefined}
                  max={evtForm.event_end_date || evtForm.event_date || undefined}
                />
                <p className="text-white/30 text-[10px] mt-0.5">Must be between the start date and the end date.</p>
              </div>

              {evtMsg.text && <Alert type={evtMsg.type} message={evtMsg.text} />}

              <div className="flex gap-2">
                <button type="submit" disabled={evtSaving}
                  className="flex-1 flex items-center justify-center gap-2 bg-secondary text-primary font-bold py-3 rounded-xl hover:bg-secondary/90 transition-colors disabled:opacity-60">
                  {evtSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
                  {evtSaving ? "Saving..." : editingEvt ? "Save Changes" : "Add Event"}
                </button>
                {editingEvt && (
                  <button type="button" onClick={cancelEditEvent}
                    className="flex items-center justify-center gap-2 border border-white/15 text-white/60 hover:text-white px-4 rounded-xl transition-colors">
                    <X className="h-4 w-4" /> Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Events list */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg flex items-center gap-2"><Eye className="h-5 w-5 text-secondary" /> Upcoming Events</h2>
              <button onClick={() => { loadEvents(); loadEventRegistrationSummary(); }} className="text-white/40 hover:text-white text-xs transition-colors border border-white/10 hover:border-white/25 rounded-lg px-3 py-1.5">Refresh</button>
            </div>

            {loadingEvts && <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 text-secondary animate-spin" /></div>}

            {evtFetchError && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
                <p className="text-white font-semibold mb-1">Cannot load events</p>
                <p className="text-white/40 text-sm">{evtFetchError}</p>
              </div>
            )}

            {!loadingEvts && !evtFetchError && events.length === 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center">
                <CalendarDays className="h-12 w-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/50">No events yet. Add your first event using the form.</p>
              </div>
            )}

            {!loadingEvts && events.length > 0 && (
              <div className="space-y-3">
                {events.map(ev => {
                  const uploadCount = evtRegCounts[Number(ev.id)]?.file_count || 0;
                  return (
                  <div key={ev.id} className={`bg-white/5 border rounded-2xl p-4 transition-colors ${evtForm.id === ev.id ? "border-secondary/40 bg-secondary/5" : "border-white/10 hover:border-white/20"}`}>
                    <div className="flex items-start gap-4">
                      {/* Date box */}
                      <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-center">
                        <span className="text-secondary text-[10px] font-bold uppercase leading-none">{(ev.month || "").slice(0, 3)}</span>
                        <span className="text-white font-black text-xl leading-tight">{ev.day || "—"}</span>
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[ev.status_type] || STATUS_COLORS.soon}`}>
                            {ev.status_label}
                          </span>
                          {ev.badge && <span className="text-[10px] text-white/40">{ev.badge}</span>}
                          {Number(ev.has_registration_template) === 1 && (
                            <span className="text-[10px] text-emerald-300 bg-emerald-500/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
                              Bulk upload enabled
                            </span>
                          )}
                        </div>
                        <p className="text-white font-semibold text-sm leading-snug truncate">{ev.title}</p>
                        {ev.subtitle && <p className="text-white/50 text-xs mt-0.5 truncate">{ev.subtitle}</p>}
                        {ev.venue && <p className="text-white/40 text-xs mt-0.5 flex items-center gap-1"><MapPin className="h-3 w-3 shrink-0" />{ev.venue}</p>}
                        {ev.register_url && (
                          <p className="text-secondary/70 text-xs mt-0.5 truncate">{ev.register_url}</p>
                        )}
                      </div>
                      {/* Actions */}
                      <div className="flex-shrink-0 flex gap-1">
                        <button onClick={() => startEditEvent(ev)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-secondary hover:bg-secondary/10 transition-colors"
                          title="Edit event">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleEvtDelete(ev.id)} disabled={deletingEvtId === ev.id}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          title="Delete event">
                          {deletingEvtId === ev.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setEvtRegEventId(ev.id);
                        setEvtRegExpanded(null);
                        setEvtRegSearch("");
                        setEvtRegSource("");
                        setEvtRegCity("");
                        setEvtRegPage(1);
                      }}
                      className="mt-3 w-full flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/10 px-3 py-2.5 text-left hover:border-secondary/30 transition-colors"
                    >
                      <span className="flex items-center gap-2 text-xs text-white/60">
                        <ClipboardList className="h-4 w-4 text-secondary" />
                        <span className="font-semibold text-white/80">Registration uploads</span>
                        {uploadCount > 0
                          ? <span>{uploadCount} file{uploadCount === 1 ? "" : "s"} available</span>
                          : <span>No uploads yet</span>}
                      </span>
                      <ChevronRight className="h-4 w-4 text-white/40" />
                    </button>
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          {evtRegEventId && createPortal((() => {
            const selectedEvent = events.find(event => Number(event.id) === Number(evtRegEventId));
            const perPage = 25;
            const totalPages = Math.max(1, Math.ceil(evtRegsTotal / perPage));
            const page = Math.min(evtRegPage, totalPages);

            return (
              <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-6">
                <button type="button" onClick={() => setEvtRegEventId(null)} aria-label="Close registration uploads" className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
                <div className="relative z-10 w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-3xl border border-white/15 bg-[#10223c] shadow-2xl text-white">
                  <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-white/10 bg-[#10223c]/95 backdrop-blur px-4 py-4 sm:px-7 sm:py-5">
                    <div className="min-w-0">
                      <p className="text-secondary text-[10px] font-bold uppercase tracking-[0.2em]">Event registration details</p>
                      <h2 className="text-xl sm:text-2xl font-serif font-semibold mt-1 break-words">{selectedEvent?.title || "Event"}</h2>
                      {selectedEvent?.subtitle && <p className="text-white/50 text-sm mt-1">{selectedEvent.subtitle}</p>}
                    </div>
                    <button type="button" onClick={() => setEvtRegEventId(null)} className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 flex-shrink-0">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="p-4 sm:p-7">
                    <div className="grid grid-cols-1 min-[460px]:grid-cols-3 gap-3 mb-6">
                      {[
                        ["Files uploaded", evtRegSummary.file_count],
                        ["Public uploads", evtRegSummary.public_count],
                        ["Franchise uploads", evtRegSummary.franchise_count],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                          <p className="text-white/40 text-[10px] uppercase tracking-wider">{label}</p>
                          <p className="text-white text-xl font-bold mt-1">{value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-3 mb-4 md:grid-cols-[minmax(0,1fr)_10rem_9rem]">
                      <input
                        value={evtRegSearch}
                        onChange={e => { setEvtRegSearch(e.target.value); setEvtRegPage(1); }}
                        placeholder="Search uploader, academy, city or file name"
                        className="min-w-0 rounded-xl border border-white/15 bg-black/15 px-3 py-2.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-secondary/60"
                      />
                      <select value={evtRegSource} onChange={e => { setEvtRegSource(e.target.value); setEvtRegPage(1); }} className="rounded-xl border border-white/15 bg-[#10223c] px-3 py-2.5 text-sm text-white outline-none focus:border-secondary/60">
                        <option value="">All sources</option>
                        <option value="public">Public website</option>
                        <option value="franchise">Franchise</option>
                      </select>
                      <select value={evtRegCity} onChange={e => { setEvtRegCity(e.target.value); setEvtRegPage(1); }} className="rounded-xl border border-white/15 bg-[#10223c] px-3 py-2.5 text-sm text-white outline-none focus:border-secondary/60">
                        <option value="">All cities</option>
                        {evtRegCities.map(city => <option key={city} value={city}>{city}</option>)}
                      </select>
                    </div>

                    <div className="flex flex-col gap-2 mb-3 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
                      <span>{evtRegsTotal} matching file{evtRegsTotal === 1 ? "" : "s"}</span>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <button type="button" onClick={downloadCombinedEventRegistrations} disabled={Number(evtRegSummary.file_count) === 0} title="Combine every uploaded file for this event" className="inline-flex items-center gap-1.5 text-secondary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed">
                          <Download className="h-3.5 w-3.5" /> Download combined Excel
                        </button>
                        <button type="button" onClick={() => loadEventRegistrations(evtRegEventId, evtRegPage)} className="inline-flex items-center gap-1.5 hover:text-white">
                          <RefreshCw className={`h-3.5 w-3.5 ${evtRegsLoading ? "animate-spin" : ""}`} /> Refresh
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {!evtRegsLoading && evtRegs.length === 0 && (
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm text-white/40">No uploads match these filters.</div>
                      )}
                      {evtRegs.map(reg => (
                        <div key={reg.id} className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
                          <div className="p-4 sm:p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-white font-semibold break-words">{reg.original_name}</p>
                                <p className="text-white/45 text-xs mt-1">
                                  {reg.center_id === "PUBLIC" ? "Public website upload" : `Franchise ${reg.center_id}`}
                                  {reg.uploaded_at ? ` · ${new Date(reg.uploaded_at).toLocaleString("en-IN")}` : ""}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {Number(reg.count) > 0 && (
                                  <button type="button" onClick={() => toggleEventRegistrationDetails(reg)} className="p-2 rounded-lg text-white/40 hover:text-secondary hover:bg-secondary/10" title="View uploaded Excel details">
                                    {evtRegExpanded === reg.id ? <ChevronUp className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </button>
                                )}
                                <button type="button" onClick={() => downloadProtectedEventFile(`${API_BASE}/portal_event_regs_file.php?id=${reg.id}`, reg.original_name)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10" title="Download file">
                                  <Download className="h-4 w-4" />
                                </button>
                                <button type="button" onClick={() => handleEvtRegDelete(reg.id)} disabled={evtRegDeleting === reg.id} className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-50" title="Delete upload">
                                  {evtRegDeleting === reg.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </button>
                              </div>
                            </div>

                            {reg.center_id === "PUBLIC" && (
                              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                                <div className="rounded-lg bg-black/15 px-3 py-2"><p className="text-white/30 text-[9px] uppercase tracking-wider">Uploader</p><p className="text-white/80 text-xs mt-0.5 truncate">{reg.uploader_name || "—"}</p></div>
                                <div className="rounded-lg bg-black/15 px-3 py-2"><p className="text-white/30 text-[9px] uppercase tracking-wider">Academy</p><p className="text-white/80 text-xs mt-0.5 truncate">{reg.academy_name || "—"}</p></div>
                                <div className="rounded-lg bg-black/15 px-3 py-2"><p className="text-white/30 text-[9px] uppercase tracking-wider">City</p><p className="text-white/80 text-xs mt-0.5 truncate">{reg.city || "—"}</p></div>
                              </div>
                            )}
                          </div>

                          {evtRegExpanded === reg.id && reg.headers && (
                            <div className="border-t border-white/10 overflow-x-auto max-h-96">
                              <table className="w-full text-xs">
                                <thead className="bg-[#172b47] sticky top-0"><tr>{reg.headers.map((header, i) => <th key={i} className="text-left text-white/55 font-semibold px-3 py-2 whitespace-nowrap">{header || `Column ${i + 1}`}</th>)}</tr></thead>
                                <tbody className="divide-y divide-white/5">{reg.rows.map((row, ri) => <tr key={ri}>{reg.headers.map((_, ci) => <td key={ci} className="text-white/70 px-3 py-2 whitespace-nowrap">{row[ci] || "—"}</td>)}</tr>)}</tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {totalPages > 1 && (
                      <div className="mt-5 flex items-center justify-between">
                        <button type="button" disabled={page === 1} onClick={() => setEvtRegPage(page - 1)} className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/70 hover:bg-white/10 disabled:opacity-30">Previous</button>
                        <span className="text-xs text-white/45">Page {page} of {totalPages}</span>
                        <button type="button" disabled={page === totalPages} onClick={() => setEvtRegPage(page + 1)} className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/70 hover:bg-white/10 disabled:opacity-30">Next</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })(), document.body)}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ── NEWS / UPDATES / STORIES SECTION ────────────────────────────── */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {section === "news" && (
        <div className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-[420px_1fr] gap-8">

          {/* News form */}
          <div className="space-y-4" ref={newsFormRef}>
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              {editingNews ? <Edit2 className="h-5 w-5 text-secondary" /> : <Plus className="h-5 w-5 text-secondary" />}
              {editingNews ? "Edit News Post" : "Add News Post"}
            </h2>

            <form onSubmit={handleNewsSave} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 backdrop-blur-sm" autoComplete="off">

              {/* Category + Date */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1">Category</label>
                  <select value={newsForm.category} onChange={newsField("category")}
                    className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-secondary/60">
                    {NEWS_CATEGORIES.map(c => <option key={c} value={c} className="bg-[#142d50]">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1">Date</label>
                  <input type="date" value={newsForm.date} onChange={newsField("date")}
                    className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-secondary/60 [color-scheme:dark]" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1">Title *</label>
                <input type="text" value={newsForm.title} onChange={newsField("title")} required placeholder="Students shine at National Championship"
                  className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white placeholder-white/25 text-sm focus:outline-none focus:border-secondary/60" />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1">Summary</label>
                <textarea value={newsForm.summary} onChange={newsField("summary")} rows={2}
                  placeholder="Short teaser shown on the card..."
                  className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white placeholder-white/25 text-sm focus:outline-none focus:border-secondary/60 resize-none" />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1">Full Story</label>
                <textarea value={newsForm.body} onChange={newsField("body")} rows={5}
                  placeholder="The complete write-up shown in the Read More popup..."
                  className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white placeholder-white/25 text-sm focus:outline-none focus:border-secondary/60 resize-none" />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1">Link URL (optional)</label>
                <input type="url" value={newsForm.link_url} onChange={newsField("link_url")} placeholder="https://..."
                  className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white placeholder-white/25 text-sm focus:outline-none focus:border-secondary/60" />
                <p className="text-white/30 text-[10px] mt-0.5">Adds a "Learn More" button in the popup.</p>
              </div>

              {/* Media */}
              <div>
                <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1">Photo or Video (optional)</label>
                {newsPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-white/10">
                    {newsPreviewIsVideo ? (
                      <video src={newsPreview} controls playsInline preload="metadata"
                        className="w-full max-h-56 object-contain bg-black/40" />
                    ) : (
                      <img src={newsPreview} alt="preview" className="w-full max-h-56 object-contain bg-black/20" />
                    )}
                    <button type="button" onClick={clearNewsImage}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-red-500/80 text-white flex items-center justify-center transition-colors"
                      title="Remove media">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative border-2 border-dashed border-white/15 rounded-xl p-3 text-center cursor-pointer hover:border-secondary/40 transition-colors"
                    onClick={() => newsFileRef.current?.click()}>
                    <div className="py-2">
                      <Upload className="h-6 w-6 text-white/20 mx-auto mb-1" />
                      <p className="text-white/40 text-xs">Click to choose a photo or video</p>
                      <p className="text-white/25 text-[10px] mt-0.5">Images: JPG, PNG, WebP, GIF — max 10 MB · Videos: MP4, WebM, MOV — max 50 MB</p>
                    </div>
                  </div>
                )}
                <input ref={newsFileRef} type="file" accept="image/*,video/mp4,video/webm,video/quicktime" className="hidden" onChange={handleNewsFileChange} />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!newsForm.is_active} onChange={newsField("is_active")}
                  className="w-4 h-4 accent-secondary" />
                <span className="text-white/60 text-sm">Show on website</span>
              </label>

              {newsMsg.text && <Alert type={newsMsg.type} message={newsMsg.text} />}

              <div className="flex gap-2">
                <button type="submit" disabled={newsSaving}
                  className="flex-1 flex items-center justify-center gap-2 bg-secondary text-primary font-bold py-3 rounded-xl hover:bg-secondary/90 transition-colors disabled:opacity-60">
                  {newsSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Newspaper className="h-4 w-4" />}
                  {newsSaving ? "Saving..." : editingNews ? "Save Changes" : "Publish Post"}
                </button>
                {editingNews && (
                  <button type="button" onClick={cancelEditNews}
                    className="flex items-center justify-center gap-2 border border-white/15 text-white/60 hover:text-white px-4 rounded-xl transition-colors">
                    <X className="h-4 w-4" /> Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* News list */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg flex items-center gap-2"><Eye className="h-5 w-5 text-secondary" /> Published Posts</h2>
              <button onClick={loadNews} className="text-white/40 hover:text-white text-xs transition-colors border border-white/10 hover:border-white/25 rounded-lg px-3 py-1.5">Refresh</button>
            </div>

            {loadingNews && <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 text-secondary animate-spin" /></div>}

            {newsFetchError && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
                <p className="text-white font-semibold mb-1">Cannot load news</p>
                <p className="text-white/40 text-sm">{newsFetchError}</p>
              </div>
            )}

            {!loadingNews && !newsFetchError && news.length === 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center">
                <Newspaper className="h-12 w-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/50">No news posts yet. Add your first post using the form.</p>
              </div>
            )}

            {!loadingNews && news.length > 0 && (
              <div className="space-y-3">
                {news.map(n => (
                  <div key={n.id} className={`bg-white/5 border rounded-2xl p-4 transition-colors ${newsForm.id === n.id ? "border-secondary/40 bg-secondary/5" : "border-white/10 hover:border-white/20"}`}>
                    <div className="flex items-start gap-4">
                      {/* Thumb */}
                      <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                        {n.video ? (
                          <div className="relative w-full h-full">
                            <video src={n.video} muted playsInline preload="metadata" className="w-full h-full object-cover" />
                            <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21" /></svg>
                            </span>
                          </div>
                        ) : n.image
                          ? <img src={n.image} alt={n.title} className="w-full h-full object-cover" />
                          : <Newspaper className="h-6 w-6 text-white/20" />}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-secondary/40 text-secondary bg-secondary/10 uppercase tracking-wider">
                            {n.category}
                          </span>
                          {Number(n.is_active) !== 1 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/15 text-white/40">Hidden</span>
                          )}
                          {n.date && <span className="text-[10px] text-white/40">{n.date}</span>}
                        </div>
                        <p className="text-white font-semibold text-sm leading-snug truncate">{n.title}</p>
                        {n.summary && <p className="text-white/40 text-xs mt-0.5 line-clamp-2">{n.summary}</p>}
                      </div>
                      {/* Actions */}
                      <div className="flex-shrink-0 flex gap-1">
                        <button onClick={() => startEditNews(n)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-secondary hover:bg-secondary/10 transition-colors"
                          title="Edit post">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleNewsDelete(n.id)} disabled={deletingNewsId === n.id}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          title="Delete post">
                          {deletingNewsId === n.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ── FRANCHISES (OUR NETWORK) SECTION ────────────────────────────── */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {section === "franchises" && (
        <div className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-[420px_1fr] gap-8">

          {/* Franchise form */}
          <div className="space-y-4" ref={franchiseFormRef}>
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              {editingFranchise ? <Edit2 className="h-5 w-5 text-secondary" /> : <Plus className="h-5 w-5 text-secondary" />}
              {editingFranchise ? "Edit Franchise" : "Add Franchise"}
            </h2>

            <form onSubmit={handleFranchiseSave} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 backdrop-blur-sm" autoComplete="off">

              <div>
                <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1">Academy Name *</label>
                <input type="text" value={franchiseForm.academy} onChange={franchiseField("academy")} required placeholder="Thanuja Abacus Academy"
                  className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white placeholder-white/25 text-sm focus:outline-none focus:border-secondary/60" />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1">Head / Franchise Owner *</label>
                <input type="text" value={franchiseForm.head} onChange={franchiseField("head")} required placeholder="Mrs. Thanuja K J"
                  className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white placeholder-white/25 text-sm focus:outline-none focus:border-secondary/60" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1">Area</label>
                  <input type="text" value={franchiseForm.area} onChange={franchiseField("area")} placeholder="HSR Layout"
                    className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white placeholder-white/25 text-sm focus:outline-none focus:border-secondary/60" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1">City</label>
                  <input type="text" value={franchiseForm.city} onChange={franchiseField("city")} placeholder="Bengaluru"
                    className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white placeholder-white/25 text-sm focus:outline-none focus:border-secondary/60" />
                </div>
              </div>

              {/* Photo */}
              <div>
                <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1">Photo</label>
                <p className="text-xs text-white/50 mb-2">Recommended ratio: 1:1 (square), ideally 800 × 800 px. Photos fill a circular frame, so keep the face centered with space around the head. Corners and edges may be cropped; avoid text near the edges.</p>
                {franchisePreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-white/10">
                    <img src={franchisePreview} alt="preview" className="w-full max-h-56 object-contain bg-black/20" />
                    <button type="button" onClick={clearFranchiseImage}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-red-500/80 text-white flex items-center justify-center transition-colors"
                      title="Remove image">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative border-2 border-dashed border-white/15 rounded-xl p-3 text-center cursor-pointer hover:border-secondary/40 transition-colors"
                    onClick={() => franchiseFileRef.current?.click()}>
                    <div className="py-2">
                      <Upload className="h-6 w-6 text-white/20 mx-auto mb-1" />
                      <p className="text-white/40 text-xs">Click to choose a photo</p>
                      <p className="text-white/25 text-[10px] mt-0.5">JPG, PNG, WebP, GIF — max 10 MB</p>
                    </div>
                  </div>
                )}
                <input ref={franchiseFileRef} type="file" accept="image/*" className="hidden" onChange={handleFranchiseFileChange} />
              </div>

              {franchiseMsg.text && <Alert type={franchiseMsg.type} message={franchiseMsg.text} />}

              <div className="flex gap-2">
                <button type="submit" disabled={franchiseSaving}
                  className="flex-1 flex items-center justify-center gap-2 bg-secondary text-primary font-bold py-3 rounded-xl hover:bg-secondary/90 transition-colors disabled:opacity-60">
                  {franchiseSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
                  {franchiseSaving ? "Saving..." : editingFranchise ? "Save Changes" : "Add Franchise"}
                </button>
                {editingFranchise && (
                  <button type="button" onClick={cancelEditFranchise}
                    className="flex items-center justify-center gap-2 border border-white/15 text-white/60 hover:text-white px-4 rounded-xl transition-colors">
                    <X className="h-4 w-4" /> Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Franchise list */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg flex items-center gap-2"><Eye className="h-5 w-5 text-secondary" /> Existing Franchises</h2>
              <button onClick={loadFranchises} className="text-white/40 hover:text-white text-xs transition-colors border border-white/10 hover:border-white/25 rounded-lg px-3 py-1.5">Refresh</button>
            </div>

            {loadingFranchises && <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 text-secondary animate-spin" /></div>}

            {franchiseFetchError && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
                <p className="text-white font-semibold mb-1">Cannot load franchises</p>
                <p className="text-white/40 text-sm">{franchiseFetchError}</p>
              </div>
            )}

            {!loadingFranchises && !franchiseFetchError && franchises.length === 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center">
                <Building2 className="h-12 w-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/50">No franchises yet. Add your first one using the form.</p>
              </div>
            )}

            {!loadingFranchises && franchises.length > 0 && (
              <div className="space-y-3">
                {franchises.map(f => (
                  <div key={f.id} className={`bg-white/5 border rounded-2xl p-4 transition-colors ${franchiseForm.id === f.id ? "border-secondary/40 bg-secondary/5" : "border-white/10 hover:border-white/20"}`}>
                    <div className="flex items-start gap-4">
                      {/* Thumb */}
                      <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                        {f.photo
                          ? <img src={f.photo} alt={f.head} className="w-full h-full object-cover" />
                          : <Building2 className="h-6 w-6 text-white/20" />}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm leading-snug truncate">{f.academy}</p>
                        {f.head && <p className="text-secondary text-xs mt-0.5 truncate">{f.head}</p>}
                        {(f.area || f.city) && (
                          <p className="text-white/40 text-xs mt-0.5 flex items-center gap-1 truncate">
                            <MapPin className="h-3 w-3 flex-shrink-0" /> {[f.area, f.city].filter(Boolean).join(", ")}
                          </p>
                        )}
                      </div>
                      {/* Actions */}
                      <div className="flex-shrink-0 flex gap-1">
                        <button onClick={() => startEditFranchise(f)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-secondary hover:bg-secondary/10 transition-colors"
                          title="Edit franchise">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleFranchiseDelete(f.id)} disabled={deletingFranchiseId === f.id}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          title="Delete franchise">
                          {deletingFranchiseId === f.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ── FEATURED LESSONS (VIDEOS) SECTION ───────────────────────────── */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {section === "videos" && (
        <div className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-[420px_1fr] gap-8">

          {/* Video form */}
          <div className="space-y-4" ref={vidFormRef}>
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              {editingVid ? <Edit2 className="h-5 w-5 text-secondary" /> : <Plus className="h-5 w-5 text-secondary" />}
              {editingVid ? "Edit Lesson" : "Add New Lesson"}
            </h2>

            <form onSubmit={handleVidSave} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 backdrop-blur-sm" autoComplete="off">
              <Alert type={vidMsg.type} message={vidMsg.text} />

              <div>
                <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1">YouTube Link or Video ID *</label>
                <input type="text" value={vidForm.youtube_id} onChange={vidField("youtube_id")} required
                  placeholder="https://youtu.be/B4ppDOLLSM0"
                  className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white placeholder-white/25 text-sm focus:outline-none focus:border-secondary/60" />
                <p className="text-white/40 text-[10px] mt-1">Paste a full YouTube URL (watch, youtu.be, embed, or shorts) or just the 11-character video ID.</p>
              </div>

              {/* Live preview */}
              {extractYtId(vidForm.youtube_id) && (
                <div className="aspect-video rounded-xl overflow-hidden border border-white/10 bg-black">
                  <img
                    src={`https://img.youtube.com/vi/${extractYtId(vidForm.youtube_id)}/hqdefault.jpg`}
                    alt="Video thumbnail preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1">Title *</label>
                <input type="text" value={vidForm.title} onChange={vidField("title")} required
                  placeholder="Abacus Foundation — Getting Started"
                  className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white placeholder-white/25 text-sm focus:outline-none focus:border-secondary/60" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1">Level</label>
                  <select value={vidForm.level} onChange={vidField("level")}
                    className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-secondary/60">
                    {VIDEO_LEVELS.map(l => <option key={l} value={l} className="bg-[#142d50]">{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1">Sort Order</label>
                  <input type="number" value={vidForm.sort_order} onChange={vidField("sort_order")} min="0"
                    placeholder="0"
                    className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white placeholder-white/25 text-sm focus:outline-none focus:border-secondary/60" />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={vidSaving}
                  className="flex-1 flex items-center justify-center gap-2 bg-secondary text-primary font-bold py-3 rounded-xl hover:bg-secondary/90 transition-colors disabled:opacity-60">
                  {vidSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
                  {vidSaving ? "Saving..." : editingVid ? "Save Changes" : "Add Lesson"}
                </button>
                {editingVid && (
                  <button type="button" onClick={cancelEditVideo}
                    className="flex items-center justify-center gap-2 border border-white/15 text-white/60 hover:text-white px-4 rounded-xl transition-colors">
                    <X className="h-4 w-4" /> Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Video list */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg flex items-center gap-2"><Eye className="h-5 w-5 text-secondary" /> Featured Lessons</h2>
              <button onClick={loadVideos} className="text-white/40 hover:text-white text-xs transition-colors border border-white/10 hover:border-white/25 rounded-lg px-3 py-1.5">Refresh</button>
            </div>

            {loadingVids && <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 text-secondary animate-spin" /></div>}

            {vidFetchError && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
                <p className="text-white font-semibold mb-1">Cannot load lessons</p>
                <p className="text-white/40 text-sm">{vidFetchError}</p>
              </div>
            )}

            {!loadingVids && !vidFetchError && videos.length === 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center">
                <Video className="h-12 w-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/50">No lessons yet. Add your first lesson using the form.</p>
              </div>
            )}

            {!loadingVids && videos.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-3">
                {videos.map(v => (
                  <div key={v.id} className={`bg-white/5 border rounded-2xl overflow-hidden transition-colors ${vidForm.id === v.id ? "border-secondary/40 bg-secondary/5" : "border-white/10 hover:border-white/20"}`}>
                    <div className="aspect-video relative bg-black">
                      <img
                        src={`https://img.youtube.com/vi/${v.youtube_id}/hqdefault.jpg`}
                        alt={v.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 text-white border border-white/20">{v.level}</span>
                    </div>
                    <div className="p-3">
                      <p className="text-white font-semibold text-sm leading-snug line-clamp-2 mb-2">{v.title}</p>
                      <div className="flex items-center justify-between">
                        <a href={`https://www.youtube.com/watch?v=${v.youtube_id}`} target="_blank" rel="noopener noreferrer"
                          className="text-secondary/70 hover:text-secondary text-[11px] truncate">{v.youtube_id}</a>
                        <div className="flex-shrink-0 flex gap-1">
                          <button onClick={() => startEditVideo(v)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-secondary hover:bg-secondary/10 transition-colors"
                            title="Edit lesson">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleVidDelete(v.id)} disabled={deletingVidId === v.id}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                            title="Delete lesson">
                            {deletingVidId === v.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ENQUIRIES SECTION ───────────────────────────────────────────── */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {section === "enquiries" && (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

          {/* Filters bar */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm space-y-3">
            <h2 className="text-white font-bold text-base flex items-center gap-2">
              <Filter className="h-4 w-4 text-secondary" /> Filter Enquiries
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Program */}
              <div>
                <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1">Program</label>
                <select value={enqFilterProgram} onChange={e => setEnqFilterProgram(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-secondary/60 transition-colors">
                  <option value="" className="bg-[#142d50]">All Programs</option>
                  <option value="abacus"    className="bg-[#142d50]">Abacus Program</option>
                  <option value="vedic"     className="bg-[#142d50]">Vedic Mathematics</option>
                  <option value="brain"     className="bg-[#142d50]">Brain Development</option>
                  <option value="franchise" className="bg-[#142d50]">Franchise Opportunity</option>
                  <option value="teacher"   className="bg-[#142d50]">Teacher Training</option>
                  <option value="other"     className="bg-[#142d50]">Other</option>
                </select>
              </div>
              {/* Status */}
              <div>
                <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1">Status</label>
                <select value={enqFilterStatus} onChange={e => setEnqFilterStatus(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-secondary/60 transition-colors">
                  <option value=""          className="bg-[#142d50]">All Statuses</option>
                  <option value="new"       className="bg-[#142d50]">New</option>
                  <option value="contacted" className="bg-[#142d50]">Contacted</option>
                  <option value="resolved"  className="bg-[#142d50]">Resolved</option>
                </select>
              </div>
              {/* Date from */}
              <div>
                <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1">From Date</label>
                <input type="date" value={enqFilterFrom} onChange={e => setEnqFilterFrom(e.target.value)}
                  onClick={e => { try { e.target.showPicker?.(); } catch(_) {} }}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-secondary/60 transition-colors cursor-pointer [color-scheme:dark]" />
              </div>
              {/* Date to */}
              <div>
                <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1">To Date</label>
                <input type="date" value={enqFilterTo} onChange={e => setEnqFilterTo(e.target.value)}
                  onClick={e => { try { e.target.showPicker?.(); } catch(_) {} }}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-secondary/60 transition-colors cursor-pointer [color-scheme:dark]" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={applyEnqFilters} disabled={loadingEnq}
                className="flex items-center gap-2 bg-secondary text-primary font-bold px-5 py-2 rounded-xl text-sm hover:bg-secondary/90 transition-colors disabled:opacity-60">
                {loadingEnq ? <Loader2 className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />}
                Apply Filters
              </button>
              <button onClick={() => {
                setEnqFilterProgram(""); setEnqFilterStatus(""); setEnqFilterFrom(""); setEnqFilterTo("");
                loadEnquiries();
              }} disabled={loadingEnq}
                className="flex items-center gap-2 text-white/50 hover:text-white border border-white/10 hover:border-white/25 px-4 py-2 rounded-xl text-sm transition-colors">
                <RefreshCw className="h-4 w-4" /> Reset
              </button>
            </div>
          </div>

          {/* Summary row */}
          <div className="flex items-center gap-3 text-sm text-white/40">
            <Inbox className="h-4 w-4" />
            <span>{enquiries.length} enquir{enquiries.length === 1 ? "y" : "ies"} shown</span>
            {enquiries.filter(e => e.status === "new").length > 0 && (
              <span className="bg-red-500/20 text-red-300 border border-red-400/30 text-xs font-bold px-2 py-0.5 rounded-full">
                {enquiries.filter(e => e.status === "new").length} new
              </span>
            )}
          </div>

          {/* Error */}
          {enqFetchError && <Alert type="error" message={enqFetchError} />}

          {/* Loading */}
          {loadingEnq && (
            <div className="flex items-center justify-center py-16 text-white/40 gap-3">
              <Loader2 className="h-6 w-6 animate-spin" /> Loading enquiries…
            </div>
          )}

          {/* Empty */}
          {!loadingEnq && !enqFetchError && enquiries.length === 0 && (
            <EmptyState icon={Inbox} message="No enquiries found" sub="Submissions from the contact form will appear here." />
          )}

          {/* List */}
          {!loadingEnq && enquiries.length > 0 && (
            <div className="space-y-3">
              {enquiries.map(enq => {
                const isExpanded = expandedEnq === enq.id;
                const statusColors = {
                  new:       "bg-red-500/20 text-red-300 border-red-400/30",
                  contacted: "bg-yellow-500/20 text-yellow-300 border-yellow-400/30",
                  resolved:  "bg-green-500/20 text-green-300 border-green-400/30",
                };
                const programLabels = {
                  abacus: "Abacus", vedic: "Vedic Maths", brain: "Brain Dev",
                  franchise: "Franchise", teacher: "Teacher Training", other: "Other",
                };
                const submittedDate = enq.submitted_at
                  ? new Date(enq.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                  : "—";
                return (
                  <div key={enq.id}
                    className={`bg-white/5 border rounded-2xl transition-colors overflow-hidden ${
                      enq.status === "new" ? "border-red-400/25 hover:border-red-400/40" : "border-white/10 hover:border-white/20"
                    }`}>
                    {/* Header row */}
                    <div className="flex items-center gap-3 p-4 cursor-pointer select-none"
                      onClick={() => setExpandedEnq(isExpanded ? null : enq.id)}>
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl bg-secondary/15 border border-secondary/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-secondary font-bold text-sm">{enq.name.charAt(0).toUpperCase()}</span>
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-semibold text-sm">{enq.name}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColors[enq.status] || statusColors.new}`}>
                            {enq.status.charAt(0).toUpperCase() + enq.status.slice(1)}
                          </span>
                          {enq.program && (
                            <span className="text-[10px] text-white/40 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                              {programLabels[enq.program] || enq.program}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          <span className="text-white/50 text-xs flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {enq.phone}
                          </span>
                          {enq.city && (
                            <span className="text-white/40 text-xs flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {enq.city}
                            </span>
                          )}
                          <span className="text-white/30 text-xs">{submittedDate}</span>
                        </div>
                      </div>
                      {/* Chevron */}
                      <ChevronDown className={`h-4 w-4 text-white/30 flex-shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="border-t border-white/10 p-4 space-y-4">
                        <div className="grid sm:grid-cols-2 gap-3 text-sm">
                          {enq.email && (
                            <div className="flex items-center gap-2 text-white/70">
                              <Mail className="h-3.5 w-3.5 text-secondary flex-shrink-0" />
                              <a href={`mailto:${enq.email}`} className="hover:text-secondary transition-colors truncate">{enq.email}</a>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-white/70">
                            <Phone className="h-3.5 w-3.5 text-secondary flex-shrink-0" />
                            <a href={`tel:${enq.phone}`} className="hover:text-secondary transition-colors">{enq.phone}</a>
                          </div>
                          {enq.city && (
                            <div className="flex items-center gap-2 text-white/70">
                              <MapPin className="h-3.5 w-3.5 text-secondary flex-shrink-0" />
                              <span>{enq.city}</span>
                            </div>
                          )}
                        </div>
                        {enq.message && (
                          <div className="bg-white/5 rounded-xl p-3">
                            <div className="flex items-center gap-1.5 text-white/40 text-[10px] font-semibold uppercase tracking-widest mb-2">
                              <MessageSquare className="h-3 w-3" /> Message
                            </div>
                            <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{enq.message}</p>
                          </div>
                        )}
                        {/* Status actions */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white/40 text-xs font-semibold">Mark as:</span>
                          {[
                            { value: "new",       label: "New",       cls: "border-red-400/30 text-red-300 hover:bg-red-500/20" },
                            { value: "contacted", label: "Contacted", cls: "border-yellow-400/30 text-yellow-300 hover:bg-yellow-500/20" },
                            { value: "resolved",  label: "Resolved",  cls: "border-green-400/30 text-green-300 hover:bg-green-500/20" },
                          ].map(opt => (
                            <button key={opt.value}
                              disabled={enq.status === opt.value || enqUpdatingId === enq.id}
                              onClick={() => handleEnquiryStatus(enq.id, opt.value)}
                              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-40 ${
                                enq.status === opt.value ? "opacity-40 cursor-default bg-white/5 " + opt.cls : opt.cls + " bg-white/5"
                              }`}>
                              {enqUpdatingId === enq.id ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ── HOME PAGE SECTION ───────────────────────────────────────────── */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {section === "home_page" && (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

          {/* Sub-tab switcher */}
          <div className="flex gap-2">
            {[
              { key: "hero",     icon: LayoutGrid, label: "Hero Cards",   count: homeData.hero.length,     max: 5  },
              // { key: "awards",   icon: Trophy,     label: "Awards",       count: homeData.awards.length,   max: 9  },
            ].map(({ key, icon: Icon, label, count, max }) => (
              <button key={key} onClick={() => setHomeSubTab(key)}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  homeSubTab === key
                    ? "bg-secondary text-primary shadow"
                    : "text-white/50 border border-white/10 hover:border-white/25 hover:text-white"
                }`}>
                <Icon className="h-4 w-4" /> {label}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                  homeSubTab === key ? "bg-primary/20 text-primary" : "bg-white/10 text-white/50"
                }`}>{count}/{max}</span>
              </button>
            ))}
          </div>

          {/* ── Hero Cards sub-tab ── */}
          {homeSubTab === "hero" && (
            <div className="grid lg:grid-cols-[360px_1fr] gap-8">
              {/* Upload form */}
              <div className="space-y-4">
                <h2 className="text-white font-bold text-lg flex items-center gap-2">
                  <Plus className="h-5 w-5 text-secondary" /> Upload Hero Card
                </h2>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-secondary rounded-full transition-all" style={{ width: `${(homeData.hero.length / 5) * 100}%` }} />
                  </div>
                  <span className="text-white/60 text-xs font-bold whitespace-nowrap">{homeData.hero.length} / 5 slots used</span>
                </div>
                <form onSubmit={e => handleHomeUpload(e, "hero")} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 backdrop-blur-sm">
                  <div>
                    <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1.5">Caption / Title</label>
                    <input type="text" value={hCaption} onChange={e => setHCaption(e.target.value)}
                      placeholder="e.g. Less Stress at Home"
                      className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-secondary/60 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1.5">Image File</label>
                    <div className="relative border-2 border-dashed border-white/15 rounded-xl p-4 text-center cursor-pointer hover:border-secondary/40 transition-colors"
                      onClick={() => hFileRef.current?.click()}>
                      {hPreview
                        ? <img src={hPreview} alt="preview" className="w-full h-32 object-cover rounded-lg" loading="lazy" decoding="async" />
                        : <div className="py-4">
                            <Upload className="h-8 w-8 text-white/20 mx-auto mb-2" />
                            <p className="text-white/40 text-sm">Click to choose image</p>
                            <p className="text-white/25 text-xs mt-1">JPG, PNG, WebP, GIF — max 10 MB</p>
                            <p className="text-white/20 text-[10px] mt-0.5">Best quality: portrait 4:5 ratio, min 900 × 1125 px</p>
                          </div>
                      }
                    </div>
                    <input ref={hFileRef} type="file" accept="image/*" className="hidden" onChange={handleHFileChange} />
                  </div>
                  {hUploadMsg.text && <Alert type={hUploadMsg.type} message={hUploadMsg.text} />}
                  <button type="submit" disabled={hUploading || homeData.hero.length >= 5}
                    className="w-full flex items-center justify-center gap-2 bg-secondary text-primary font-bold py-3 rounded-xl hover:bg-secondary/90 transition-colors disabled:opacity-60">
                    {hUploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</> : <><Upload className="h-4 w-4" /> Upload Hero Card</>}
                  </button>
                  {homeData.hero.length >= 5 && <p className="text-yellow-400/70 text-xs text-center">Limit reached — delete a card to add more.</p>}
                </form>
              </div>
              {/* Current hero images */}
              <div className="space-y-4">
                <h2 className="text-white font-bold text-lg flex items-center gap-2">
                  <LayoutGrid className="h-5 w-5 text-secondary" /> Current Hero Cards
                </h2>
                {hLoadingImgs && <div className="flex items-center justify-center py-16 text-white/40 gap-3"><Loader2 className="h-6 w-6 animate-spin" /> Loading…</div>}
                {hFetchError && <Alert type="error" message={hFetchError} />}
                {!hLoadingImgs && homeData.hero.length === 0 && (
                  <EmptyState icon={LayoutGrid} message="No hero cards uploaded yet" sub="Upload up to 5 images — they replace the default promo carousel on the home page." />
                )}
                {homeData.hero.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {homeData.hero.map(img => (
                      <div key={img.id} className="relative group rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                        <div className="aspect-[4/5] overflow-hidden">
                          <img src={img.src} alt={img.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                        </div>
                        <div className="p-2.5">
                          <p className="text-white text-xs font-medium truncate">{img.caption || "—"}</p>
                        </div>
                        <button onClick={() => handleHomeDelete(img.id)} disabled={hDeletingId === img.id}
                          className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-red-500/80 hover:bg-red-500 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50">
                          {hDeletingId === img.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Home Gallery sub-tab ── */}
          /* {homeSubTab === "awards" && (
            <div className="grid lg:grid-cols-[360px_1fr] gap-8">
              <div className="space-y-4">
                <h2 className="text-white font-bold text-lg flex items-center gap-2">
                  <Plus className="h-5 w-5 text-secondary" /> Upload Award Photo
                </h2>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-secondary rounded-full transition-all" style={{ width: `${(homeData.awards.length / 9) * 100}%` }} />
                  </div>
                  <span className="text-white/60 text-xs font-bold whitespace-nowrap">{homeData.awards.length} / 9 slots used</span>
                </div>
                <form onSubmit={e => handleHomeUpload(e, "awards")} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 backdrop-blur-sm">
                  <div>
                    <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1.5">Caption</label>
                    <input type="text" value={hCaption} onChange={e => setHCaption(e.target.value)}
                      placeholder="e.g. National Championship 2025"
                      className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-secondary/60 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1.5">Image File</label>
                    <div className="relative border-2 border-dashed border-white/15 rounded-xl p-4 text-center cursor-pointer hover:border-secondary/40 transition-colors"
                      onClick={() => hFileRef.current?.click()}>
                      {hPreview
                        ? <img src={hPreview} alt="preview" className="w-full h-32 object-cover rounded-lg" loading="lazy" decoding="async" />
                        : <div className="py-4">
                            <Upload className="h-8 w-8 text-white/20 mx-auto mb-2" />
                            <p className="text-white/40 text-sm">Click to choose image</p>
                            <p className="text-white/25 text-xs mt-1">JPG, PNG, WebP — max 10 MB</p>
                            <p className="text-white/20 text-[10px] mt-0.5">Landscape 4:3 ratio recommended, min 1200 × 900 px</p>
                          </div>
                      }
                    </div>
                    <input ref={hFileRef} type="file" accept="image/*" className="hidden" onChange={handleHFileChange} />
                  </div>
                  {hUploadMsg.text && <Alert type={hUploadMsg.type} message={hUploadMsg.text} />}
                  <button type="submit" disabled={hUploading || homeData.awards.length >= 9}
                    className="w-full flex items-center justify-center gap-2 bg-secondary text-primary font-bold py-3 rounded-xl hover:bg-secondary/90 transition-colors disabled:opacity-60">
                    {hUploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</> : <><Upload className="h-4 w-4" /> Upload Award Photo</>}
                  </button>
                  {homeData.awards.length >= 9 && <p className="text-yellow-400/70 text-xs text-center">Limit reached — delete a photo to add more.</p>}
                </form>
              </div>
              <div className="space-y-4">
                <h2 className="text-white font-bold text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-secondary" /> Awards &amp; Recognition Photos
                </h2>
                <p className="text-white/35 text-xs leading-relaxed">These photos appear in the "Honoured on National Stages" section on the home page. Upload your own to replace the built-in gallery.</p>
                {hLoadingImgs && <div className="flex items-center justify-center py-16 text-white/40 gap-3"><Loader2 className="h-6 w-6 animate-spin" /> Loading…</div>}
                {hFetchError && <Alert type="error" message={hFetchError} />}
                {!hLoadingImgs && homeData.awards.length === 0 && (
                  <EmptyState icon={Trophy} message="No award photos uploaded yet" sub="Upload up to 9 photos — they appear in the awards section on the home page." />
                )}
                {homeData.awards.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {homeData.awards.map(img => (
                      <div key={img.id} className="relative group rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                        <div className="aspect-video overflow-hidden">
                          <img src={img.src} alt={img.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                        </div>
                        <div className="p-2.5">
                          <p className="text-white text-xs font-medium truncate">{img.caption || "—"}</p>
                        </div>
                        <button onClick={() => handleHomeDelete(img.id)} disabled={hDeletingId === img.id}
                          className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-red-500/80 hover:bg-red-500 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50">
                          {hDeletingId === img.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )} */

        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ── PORTAL USERS SECTION ────────────────────────────────────────── */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {section === "portal_users" && <AdminStudentPortal />}

      </div>

      <ConfirmModal modal={confirmModal} onOk={handleConfirmOk} onCancel={handleConfirmCancel} />
    </div>
  );
}

function EmptyState({ icon: Icon, message, sub }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center">
      <Icon className="h-12 w-12 text-white/20 mx-auto mb-3" />
      <p className="text-white/50">{message}</p>
      {sub && <p className="text-white/30 text-xs mt-1">{sub}</p>}
    </div>
  );
}

function MediaListGrid({ images, onDelete, deletingId, selectedIds = new Set(), onToggle }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {images.map(img => {
        const isVideo = img.media_type === "video";
        const checked = selectedIds.has(img.id);
        return (
          <div key={img.id}
            onClick={() => onToggle && onToggle(img.id)}
            className={`flex items-center gap-3 border rounded-xl p-3 group cursor-pointer transition-colors ${checked ? "bg-secondary/10 border-secondary/40" : "bg-white/5 border-white/10 hover:border-white/20"}`}>
            <input type="checkbox" checked={checked} onChange={() => onToggle && onToggle(img.id)}
              onClick={e => e.stopPropagation()}
              className="w-4 h-4 flex-shrink-0 accent-secondary cursor-pointer" />
            <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-white/5 relative">
              {isVideo ? (
                <>
                  <video src={img.src} preload="metadata" muted className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play className="h-4 w-4 text-white" fill="white" />
                  </div>
                </>
              ) : (
                <img src={img.src} alt={img.caption} className="w-full h-full object-cover" loading="lazy" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{img.caption || "—"}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {isVideo
                  ? <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full"><Video className="h-2.5 w-2.5" /> Video</span>
                  : <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded-full"><Image className="h-2.5 w-2.5" /> Photo</span>}
                <span className="text-white/30 text-xs">{img.display_type === "year" ? img.year : img.category}</span>
              </div>
            </div>
            <button onClick={e => { e.stopPropagation(); onDelete(img.id); }} disabled={deletingId === img.id}
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50">
              {deletingId === img.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </button>
          </div>
        );
      })}
    </div>
  );
}
