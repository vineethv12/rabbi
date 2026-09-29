import { useState } from "react";
import { Video, Calendar, Clock, Users, Trash2, ChevronDown, ChevronUp, PlayCircle, X } from "lucide-react";

const fmtTime = iso => {
  try { return new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }); }
  catch { return ""; }
};
const fmtFull = iso => {
  try { return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }); }
  catch { return iso || "—"; }
};
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
const timeLeft = iso => {
  const ms = new Date(iso) - new Date();
  if (isNaN(ms) || ms <= 0) return { text: "Expired", urgent: true };
  const h = Math.floor(ms / 3600000);
  const d = Math.floor(h / 24);
  return d >= 1 ? { text: `${d}d ${h % 24}h left`, urgent: false } : { text: `${h}h left`, urgent: true };
};

// Professional date-grouped video library used in /admin and the franchise portal.
// videos: [{ id, title, url, uploaded_at, expires_at, center_id?, recipients: [{enrollment_no,name}] }]
// onDelete(video): open the caller's delete flow. showCenter: display center badge (admin).
export function VideoLibrary({ videos, onDelete, showCenter }) {
  const [dateFilter, setDateFilter] = useState("");
  const [openRec, setOpenRec] = useState(null);   // video id with recipients expanded
  const [playing, setPlaying] = useState(null);   // video id with inline player open

  const shown = (videos || [])
    .filter(v => !dateFilter || (v.uploaded_at || "").slice(0, 10) === dateFilter)
    .sort((a, b) => (a.uploaded_at < b.uploaded_at ? 1 : -1));

  const groups = [];
  for (const v of shown) {
    const key = (v.uploaded_at || "").slice(0, 10);
    const g = groups[groups.length - 1];
    if (g && g.key === key) g.items.push(v);
    else groups.push({ key, label: dayLabel(v.uploaded_at), items: [v] });
  }

  return (
    <div className="space-y-6">
      {/* Date filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
          <Calendar className="h-4 w-4 text-white/40" />
          <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
            onClick={e => { try { e.target.showPicker?.(); } catch { } }}
            className="bg-transparent text-white/70 text-sm focus:outline-none appearance-none cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-50" />
        </div>
        {dateFilter && (
          <button onClick={() => setDateFilter("")}
            className="flex items-center gap-1.5 text-xs font-semibold text-white/50 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-xl transition-colors">
            <X className="h-3.5 w-3.5" /> Show all dates
          </button>
        )}
        <span className="text-white/30 text-xs font-semibold ml-auto">{shown.length} video{shown.length === 1 ? "" : "s"}</span>
      </div>

      {shown.length === 0 && (
        <div className="text-center py-14 text-white/30">
          <Video className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">{dateFilter ? "No videos uploaded on this date." : "No active videos."}</p>
        </div>
      )}

      {groups.map(g => (
        <div key={g.key}>
          {/* Big date header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-xl bg-secondary/10 border border-secondary/25 flex items-center justify-center flex-shrink-0">
              <Calendar className="h-4 w-4 text-secondary" />
            </div>
            <h3 className="text-white font-bold text-base sm:text-lg tracking-wide">{g.label}</h3>
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/30 text-xs font-semibold flex-shrink-0">{g.items.length} video{g.items.length > 1 ? "s" : ""}</span>
          </div>

          <div className="space-y-4">
            {g.items.map(v => {
              const tl = timeLeft(v.expires_at);
              const recs = v.recipients || [];
              return (
                <div key={v.id} className="bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-colors">
                  <div className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary flex-shrink-0">
                          <Video className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-white truncate" title={v.title}>{v.title}</h4>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-white/50">
                            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Uploaded at {fmtTime(v.uploaded_at)}</span>
                            <span className="flex items-center gap-1.5 text-amber-300/80"><Trash2 className="h-3.5 w-3.5" /> Auto-deletes {fmtFull(v.expires_at)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {showCenter && v.center_id && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-300 border border-sky-500/25">{v.center_id}</span>
                        )}
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${tl.urgent
                          ? "bg-rose-500/10 text-rose-300 border-rose-500/25"
                          : "bg-emerald-500/10 text-emerald-300 border-emerald-500/25"}`}>{tl.text}</span>
                        <button onClick={() => setPlaying(playing === v.id ? null : v.id)}
                          className="p-2 rounded-lg text-white/40 hover:text-secondary hover:bg-secondary/10 transition-colors" title={playing === v.id ? "Close player" : "Play video"}>
                          <PlayCircle className="h-4 w-4" />
                        </button>
                        {onDelete && (
                          <button onClick={() => onDelete(v)}
                            className="p-2 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors" title="Delete video">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Recipients */}
                    <button onClick={() => setOpenRec(openRec === v.id ? null : v.id)}
                      className="flex items-center gap-2 text-xs font-semibold text-white/50 hover:text-white transition-colors">
                      <Users className="h-3.5 w-3.5 text-secondary" />
                      Sent to {recs.length} student{recs.length === 1 ? "" : "s"}
                      {recs.length > 0 && (openRec === v.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />)}
                    </button>
                    {openRec === v.id && recs.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {recs.map(r => (
                          <span key={r.enrollment_no} className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/70">
                            {r.name} <span className="text-white/35 font-mono">({r.enrollment_no})</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {playing === v.id && (
                    <div className="border-t border-white/10 bg-black">
                      <video src={v.url} controls autoPlay className="w-full max-h-[420px]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
