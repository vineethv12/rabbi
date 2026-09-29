import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ClipboardList, Maximize2, Search, X } from "lucide-react";

const todayStr = () => new Date().toISOString().slice(0, 10);

// Same options as the original report form.
const SW_OPTS = Array.from({ length: 201 }, (_, i) => parseFloat((i * 0.1).toFixed(1)));
const PAGE_OPTS = Array.from({ length: 100 }, (_, i) => i + 1);

const BLANK_ROW = {
  included: true, attendance: "present",
  sw_direct_view: "0", sw_indirect_view: "0", sw_hand_writing: "0",
  book_a_page: "0", book_b_page: "0", hw_book_a_page: "0", hw_book_b_page: "0",
  activity: "",
};

const selCls =
  "w-20 px-2 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white text-center focus:outline-none focus:border-secondary/60 transition-colors cursor-pointer";
const txtCls =
  "w-full min-w-[150px] px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-secondary/60 transition-colors";

function SelCell({ value, onChange, opts, none, disabled }) {
  return (
    <select value={value} disabled={disabled} onChange={e => onChange(e.target.value)}
      className={`${selCls} ${disabled ? "opacity-25 cursor-not-allowed" : ""}`}>
      {none && <option value="0" className="bg-[#0f1c2e]">None</option>}
      {opts.map(o => <option key={o} value={o} className="bg-[#0f1c2e]">{o}</option>)}
    </select>
  );
}

function AttendanceToggle({ value, onChange, disabled }) {
  const present = value === "present";
  return (
    <div className={`inline-flex rounded-lg border border-white/10 overflow-hidden ${disabled ? "opacity-25" : ""}`}>
      <button type="button" disabled={disabled} onClick={() => onChange("present")}
        className={`px-3 py-2 text-xs font-bold transition-colors ${present ? "bg-emerald-500/25 text-emerald-300" : "bg-transparent text-white/35 hover:text-white/70"}`}>
        Present
      </button>
      <button type="button" disabled={disabled} onClick={() => onChange("absent")}
        className={`px-3 py-2 text-xs font-bold transition-colors ${!present ? "bg-rose-500/25 text-rose-300" : "bg-transparent text-white/35 hover:text-white/70"}`}>
        Absent
      </button>
    </div>
  );
}

/**
 * Batch report-marking table: one row per student, one submit for all.
 * Supports an expanded fullscreen mode for comfortable marking.
 */
export function BulkReportTable({ students = [], saving = false, onSubmit, alert = null }) {
  const [date, setDate] = useState(todayStr());
  const [rows, setRows] = useState({});
  const [search, setSearch] = useState("");
  const [fullscreen, setFullscreen] = useState(false);

  // (Re)seed rows when the student list changes, preserving entered data.
  useEffect(() => {
    setRows(prev => {
      const next = {};
      for (const s of students) next[s.enrollment_no] = prev[s.enrollment_no] || { ...BLANK_ROW };
      return next;
    });
  }, [students]);

  // Lock page scroll + allow Esc to exit while in fullscreen.
  useEffect(() => {
    if (!fullscreen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = e => { if (e.key === "Escape") setFullscreen(false); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prevOverflow; window.removeEventListener("keydown", onKey); };
  }, [fullscreen]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(s => s.name.toLowerCase().includes(q) || s.enrollment_no.toLowerCase().includes(q));
  }, [students, search]);

  const setRow = (en, patch) => setRows(prev => ({ ...prev, [en]: { ...prev[en], ...patch } }));

  const includedCount = students.filter(s => rows[s.enrollment_no]?.included).length;
  const allIncluded = includedCount === students.length && students.length > 0;

  function toggleAll() {
    const val = !allIncluded;
    setRows(prev => {
      const next = { ...prev };
      for (const s of students) next[s.enrollment_no] = { ...next[s.enrollment_no], included: val };
      return next;
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    const reports = students
      .filter(s => rows[s.enrollment_no]?.included)
      .map(s => {
        const r = rows[s.enrollment_no];
        const present = r.attendance === "present";
        return {
          enrollment_no: s.enrollment_no,
          attendance: r.attendance,
          sw_direct_view: present ? (r.sw_direct_view || 0) : 0,
          sw_indirect_view: present ? (r.sw_indirect_view || 0) : 0,
          sw_hand_writing: present ? (r.sw_hand_writing || 0) : 0,
          book_a_page: present ? (r.book_a_page || 0) : 0,
          book_b_page: present ? (r.book_b_page || 0) : 0,
          hw_book_a_page: present ? (r.hw_book_a_page || 0) : 0,
          hw_book_b_page: present ? (r.hw_book_b_page || 0) : 0,
          activity: present ? (r.activity || "") : "",
        };
      });
    onSubmit({ report_date: date, reports });
  }

  const toolbar = (
    <div className="flex flex-wrap items-end gap-4">
      <div>
        <label className="block text-white/60 text-[11px] font-bold uppercase tracking-wider mb-1.5">Class Date</label>
        <input type="date" value={date} max={todayStr()} onChange={e => setDate(e.target.value)} required
          onClick={e => { try { e.target.showPicker?.(); } catch(_) {} }}
          className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-secondary/60 [color-scheme:dark] cursor-pointer" />
      </div>
      <div className="flex-1 min-w-0 w-full sm:w-auto sm:min-w-[200px]">
        <label className="block text-white/60 text-[11px] font-bold uppercase tracking-wider mb-1.5">Find a Student</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Type a name to search…"
            className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-secondary/60" />
        </div>
      </div>
      {!fullscreen && (
        <button type="button" onClick={() => setFullscreen(true)}
          title="Open in fullscreen"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:border-white/25 text-sm font-semibold transition-all">
          <Maximize2 className="h-4 w-4" /> Fullscreen
        </button>
      )}
    </div>
  );

  const tableBlock = (
    <div className="overflow-auto rounded-xl border border-white/10 flex-1 min-h-0">
      <table className="w-full text-left border-collapse min-w-[1080px]">
        <thead className="sticky top-0 z-10 bg-[#0f1c2e]">
          {/* Group header */}
          <tr className="bg-white/[0.07] text-white/60 text-[10px] uppercase tracking-wider border-b border-white/10">
            <th className="p-2" colSpan={3}></th>
            <th className="p-2 text-center font-bold text-sky-300" colSpan={3}>Speed Writing (0–20)</th>
            <th className="p-2 text-center font-bold text-emerald-300" colSpan={2}>Class Work (page no.)</th>
            <th className="p-2 text-center font-bold text-amber-300" colSpan={2}>Home Work (page no.)</th>
            <th className="p-2"></th>
          </tr>
          <tr className="bg-white/5 text-white/50 text-[11px] uppercase tracking-wider">
            <th className="p-3 w-10">
              <button type="button" onClick={toggleAll} title={allIncluded ? "Untick all students" : "Tick all students"}
                className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors ${allIncluded ? "bg-secondary border-secondary text-[#081b30]" : "border-white/25 text-transparent hover:border-white/50"}`}>
                <Check className="h-3.5 w-3.5" />
              </button>
            </th>
            <th className="p-3 font-bold">Student</th>
            <th className="p-3 font-bold">Attendance</th>
            <th className="p-3 font-bold text-center">Direct<br />View</th>
            <th className="p-3 font-bold text-center">Indirect<br />View</th>
            <th className="p-3 font-bold text-center">Hand<br />Writing</th>
            <th className="p-3 font-bold text-center">Book A</th>
            <th className="p-3 font-bold text-center">Book B</th>
            <th className="p-3 font-bold text-center">Book A</th>
            <th className="p-3 font-bold text-center">Book B</th>
            <th className="p-3 font-bold">Activity / Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {filtered.length === 0 && (
            <tr><td colSpan={11} className="p-6 text-center text-white/35 text-sm">No students found.</td></tr>
          )}
          {filtered.map(s => {
            const r = rows[s.enrollment_no] || BLANK_ROW;
            const off = !r.included;
            const absent = r.attendance === "absent";
            return (
              <tr key={s.enrollment_no} className={`${off ? "opacity-40" : ""} ${absent && !off ? "bg-rose-500/[0.04]" : ""} hover:bg-white/[0.03] transition-colors`}>
                <td className="p-3">
                  <button type="button" onClick={() => setRow(s.enrollment_no, { included: !r.included })}
                    title={r.included ? "Untick to skip this student" : "Tick to include this student"}
                    className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors ${r.included ? "bg-secondary border-secondary text-[#081b30]" : "border-white/25 text-transparent hover:border-white/50"}`}>
                    <Check className="h-3.5 w-3.5" />
                  </button>
                </td>
                <td className="p-3">
                  <div className="text-sm font-semibold text-white leading-tight">{s.name}</div>
                  <div className="text-[10px] text-white/40">{s.enrollment_no}{s.level ? ` · Level ${s.level}` : ""}</div>
                </td>
                <td className="p-3">
                  <AttendanceToggle value={r.attendance} disabled={off} onChange={v => setRow(s.enrollment_no, { attendance: v })} />
                </td>
                <td className="p-2 text-center"><SelCell value={r.sw_direct_view} onChange={v => setRow(s.enrollment_no, { sw_direct_view: v })} opts={SW_OPTS} disabled={off || absent} /></td>
                <td className="p-2 text-center"><SelCell value={r.sw_indirect_view} onChange={v => setRow(s.enrollment_no, { sw_indirect_view: v })} opts={SW_OPTS} disabled={off || absent} /></td>
                <td className="p-2 text-center"><SelCell value={r.sw_hand_writing} onChange={v => setRow(s.enrollment_no, { sw_hand_writing: v })} opts={SW_OPTS} disabled={off || absent} /></td>
                <td className="p-2 text-center"><SelCell value={r.book_a_page} onChange={v => setRow(s.enrollment_no, { book_a_page: v })} opts={PAGE_OPTS} none disabled={off || absent} /></td>
                <td className="p-2 text-center"><SelCell value={r.book_b_page} onChange={v => setRow(s.enrollment_no, { book_b_page: v })} opts={PAGE_OPTS} none disabled={off || absent} /></td>
                <td className="p-2 text-center"><SelCell value={r.hw_book_a_page} onChange={v => setRow(s.enrollment_no, { hw_book_a_page: v })} opts={PAGE_OPTS} none disabled={off || absent} /></td>
                <td className="p-2 text-center"><SelCell value={r.hw_book_b_page} onChange={v => setRow(s.enrollment_no, { hw_book_b_page: v })} opts={PAGE_OPTS} none disabled={off || absent} /></td>
                <td className="p-2">
                  <input type="text" value={r.activity} disabled={off || absent}
                    onChange={e => setRow(s.enrollment_no, { activity: e.target.value })}
                    placeholder={absent ? "Absent" : "Optional notes…"}
                    className={`${txtCls} ${off || absent ? "opacity-25 cursor-not-allowed" : ""}`} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const footer = (
    <div className="flex flex-wrap items-center gap-4">
      <button type="submit" disabled={saving || includedCount === 0}
        className="w-full sm:w-auto px-8 py-3 rounded-xl bg-secondary text-[#081b30] font-bold hover:bg-secondary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-secondary/20 disabled:opacity-50">
        {saving
          ? <span className="h-5 w-5 border-2 border-[#081b30]/40 border-t-[#081b30] rounded-full animate-spin" />
          : <ClipboardList className="h-5 w-5" />}
        Submit {includedCount} Report{includedCount !== 1 ? "s" : ""}
      </button>
      <span className="text-white/40 text-sm">{includedCount} of {students.length} students ticked</span>
      {!fullscreen && (
        <button type="button" onClick={() => setFullscreen(true)}
          title="Open in fullscreen"
          className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:border-white/25 text-sm font-semibold transition-all">
          <Maximize2 className="h-4 w-4" /> Fullscreen
        </button>
      )}
    </div>
  );

  const body = (
    <>
      {toolbar}
      <p className="text-white/45 text-sm">
        Fill in each student's row below, then press the submit button at the bottom — all reports are saved together.
        Mark a student <span className="text-rose-300 font-semibold">Absent</span> and their scores are skipped automatically.
      </p>
      {tableBlock}
      {alert}
      {footer}
    </>
  );

  if (fullscreen) {
    // Rendered through a portal so no ancestor transform/filter/backdrop-blur
    // can trap the fixed overlay inside the page layout.
    return createPortal(
      <div className="fixed inset-0 z-[9999] bg-[#081426] flex flex-col">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 bg-[#0f1c2e]">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-secondary" /> Daily Class Report
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-white/35 text-xs hidden sm:block">Press Esc to exit fullscreen</span>
            <button type="button" onClick={() => setFullscreen(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/70 hover:text-white text-xs font-semibold transition-colors">
              <X className="h-3.5 w-3.5" /> Exit
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col gap-4 px-4 sm:px-6 py-4">
          {toolbar}
          {tableBlock}
          {alert}
          {footer}
        </form>
      </div>,
      document.body
    );
  }

  return <form onSubmit={handleSubmit} className="space-y-5">{body}</form>;
}
