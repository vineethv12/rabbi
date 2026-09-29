import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, AlertCircle, FileText, Activity, ChevronDown } from "lucide-react";
import SwProgressChart from "../shared/SwProgressChart.jsx";

const STATUS_COLORS = {
  active:    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  inactive:  "bg-amber-500/10 text-amber-400 border-amber-500/20",
  completed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

const todayStr = () => new Date().toISOString().slice(0, 10);

function fmtDate(s) {
  if (!s) return "—";
  try {
    return new Date(s + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch (_) { return s; }
}

export function StudentHistoryModal({ student, onClose, fetchReports }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState("");
  const [from, setFrom]       = useState("");
  const [to, setTo]           = useState("");
  const [visible, setVisible] = useState(15);
  const [showChart, setShowChart] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setErr("");
      try {
        const data = await fetchReports(student.enrollment_no);
        if (alive) setReports(Array.isArray(data) ? data : []);
      } catch (e) { if (alive) setErr(e.message); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [student.enrollment_no]);

  useEffect(() => { setVisible(15); }, [from, to]);

  const filtered = reports.filter(r => {
    if (from && r.report_date < from) return false;
    if (to   && r.report_date > to)   return false;
    return true;
  });

  const present = filtered.filter(r => r.attendance === "present").length;
  const absent  = filtered.filter(r => r.attendance === "absent").length;
  const pct = filtered.length ? Math.round((present / filtered.length) * 100) : 0;
  const latest = filtered.find(r => r.attendance === "present");

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
      <div onClick={e => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-[#0f1c2e] border border-white/10 rounded-2xl shadow-2xl my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            {student.photo ? (
              <img src={student.photo} alt={student.name} className="h-14 w-14 rounded-xl object-cover border border-white/10" />
            ) : (
              <div className="h-14 w-14 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary font-bold text-xl">
                {student.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold text-white">{student.name}</h3>
              <p className="text-xs text-white/40 font-mono mt-0.5">
                {student.enrollment_no}
                {student.center_name ? <span className="ml-2 text-white/30">· {student.center_name}</span> : null}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                {student.level && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] font-medium text-white/80">{student.level}</span>
                )}
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${STATUS_COLORS[student.status || "active"]}`}>
                  {student.status || "active"}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-5">
          {loading ? (
            <div className="py-16 text-center text-white/40">
              <span className="inline-block h-6 w-6 border-2 border-white/20 border-t-white rounded-full animate-spin mb-3"></span>
              <p className="text-sm font-medium">Loading reports…</p>
            </div>
          ) : err ? (
            <div className="py-12 text-center text-rose-400 text-sm font-medium flex items-center justify-center gap-2">
              <AlertCircle className="h-4 w-4" /> {err}
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Total Classes", val: filtered.length, cls: "text-white" },
                  { label: "Present", val: present, cls: "text-emerald-400" },
                  { label: "Absent", val: absent, cls: "text-rose-400" },
                  { label: "Attendance", val: `${pct}%`, cls: pct >= 75 ? "text-emerald-400" : pct >= 50 ? "text-amber-400" : "text-rose-400" },
                ].map(c => (
                  <div key={c.label} className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold mb-1">{c.label}</p>
                    <p className={`text-2xl font-bold tabular-nums ${c.cls}`}>{c.val}</p>
                  </div>
                ))}
              </div>

              {/* Latest speed writing */}
              {latest && (
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold mb-2">Latest Speed Writing ({fmtDate(latest.report_date)})</p>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    <span className="text-white/50">Direct <b className="text-white ml-1 tabular-nums">{latest.sw_direct_view ?? 0}</b></span>
                    <span className="text-white/50">Indirect <b className="text-white ml-1 tabular-nums">{latest.sw_indirect_view ?? 0}</b></span>
                    <span className="text-white/50">Hand Writing <b className="text-white ml-1 tabular-nums">{(latest.sw_hand_writing ?? latest.sw_right_hand_writing) ?? 0}</b></span>
                  </div>
                </div>
              )}

              {/* Filters + chart toggle */}
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-white/60 text-[11px] font-bold uppercase tracking-wider mb-1.5">From</label>
                  <input type="date" value={from} max={todayStr()} onChange={e => setFrom(e.target.value)}
                    onClick={e => { try { e.target.showPicker?.(); } catch(_) {} }}
                    className="bg-[#081b30]/50 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-secondary/50 cursor-pointer" />
                </div>
                <div>
                  <label className="block text-white/60 text-[11px] font-bold uppercase tracking-wider mb-1.5">To</label>
                  <input type="date" value={to} max={todayStr()} onChange={e => setTo(e.target.value)}
                    onClick={e => { try { e.target.showPicker?.(); } catch(_) {} }}
                    className="bg-[#081b30]/50 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-secondary/50 cursor-pointer" />
                </div>
                {(from || to) && (
                  <button onClick={() => { setFrom(""); setTo(""); }}
                    className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white text-sm font-medium transition-colors">
                    Clear
                  </button>
                )}
                <button onClick={() => setShowChart(v => !v)}
                  className={`ml-auto flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${showChart ? "bg-secondary/10 border-secondary/30 text-secondary" : "bg-white/5 border-white/10 text-white/70 hover:text-white"}`}>
                  <Activity className="h-4 w-4" /> {showChart ? "Hide Chart" : "Progress Chart"}
                </button>
              </div>

              {showChart && (
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                  <SwProgressChart reports={filtered} title="Speed Writing Progress" />
                </div>
              )}

              {/* Report list */}
              <div className="divide-y divide-white/5 border border-white/10 rounded-xl overflow-hidden">
                {filtered.length === 0 ? (
                  <div className="py-14 text-center">
                    <FileText className="h-6 w-6 text-white/20 mx-auto mb-2" />
                    <p className="text-white/40 text-sm font-medium">No reports found for this period.</p>
                  </div>
                ) : (
                  filtered.slice(0, visible).map(r => (
                    <div key={r.id} className="p-4 bg-white/[0.015] hover:bg-white/[0.03] transition-colors">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-white text-sm">{fmtDate(r.report_date)}</span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${r.attendance === "present" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"}`}>{r.attendance}</span>
                        </div>
                      </div>
                      {r.attendance === "present" && (
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/70">
                            SW <b className="text-white">{r.sw_direct_view ?? 0} / {r.sw_indirect_view ?? 0} / {(r.sw_hand_writing ?? r.sw_right_hand_writing) ?? 0}</b>
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-300">
                            <b className="text-[9px] tracking-wider opacity-70">CW</b> A{r.book_a_page ?? 0} · B{r.book_b_page ?? 0}
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300">
                            <b className="text-[9px] tracking-wider opacity-70">HW</b> A{r.hw_book_a_page ?? 0} · B{r.hw_book_b_page ?? 0}
                          </span>
                          {r.pagework_type && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/60">{r.pagework_type}</span>
                          )}
                        </div>
                      )}
                      {r.activity && (
                        <p className="mt-2 text-xs text-white/60 leading-relaxed"><span className="text-secondary/80 font-semibold mr-1">Activity:</span>{r.activity}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
              {filtered.length > visible && (
                <div className="flex justify-center">
                  <button onClick={() => setVisible(v => v + 15)}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:border-white/25 text-sm font-semibold transition-all">
                    <ChevronDown className="h-4 w-4" /> Load more ({filtered.length - visible} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
