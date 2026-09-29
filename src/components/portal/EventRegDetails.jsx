import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Trash2, Maximize2, AlertTriangle } from "lucide-react";

// Styled confirmation popup (replaces window.confirm)
function ConfirmPopup({ open, title, message, confirmLabel = "Delete", loading, onConfirm, onCancel }) {
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-[#0c1a2c] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-rose-400" />
          </div>
          <h3 className="text-white font-bold">{title}</h3>
        </div>
        <p className="text-white/60 text-sm leading-relaxed mb-5">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} disabled={loading}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-semibold hover:bg-white/10 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-bold hover:bg-rose-600 transition-colors flex items-center gap-2 disabled:opacity-60">
            {loading ? <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Renders the parsed registration rows of an event submission.
// - S.NO column (if present) is renumbered from 1 for display.
// - onDeleteRows(indexes[]) enables row checkboxes, per-row delete and
//   bulk "Delete selected" with a styled confirmation popup.
export function EventRegTable({ reg, onDeleteRows, deleting }) {
  const [selected, setSelected] = useState(new Set());
  const [confirm, setConfirm] = useState(null); // array of row indexes pending confirmation
  useEffect(() => { setSelected(new Set()); setConfirm(null); }, [reg && reg.id, reg && reg.rows && reg.rows.length]);
  if (!reg || !reg.headers) return null;
  const rows = reg.rows || [];
  const snoIdx = reg.headers.findIndex(h => /^s\.?\s*no/i.test(String(h || "").trim()));
  const canDelete = !!onDeleteRows;
  const allChecked = rows.length > 0 && selected.size === rows.length;

  const toggleRow = ri => setSelected(prev => {
    const n = new Set(prev);
    n.has(ri) ? n.delete(ri) : n.add(ri);
    return n;
  });
  const doConfirm = async () => {
    await onDeleteRows(confirm);
    setConfirm(null);
    setSelected(new Set());
  };

  return (
    <>
      {canDelete && selected.size > 0 && (
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-rose-500/10 border-b border-rose-500/25 px-4 py-2.5">
          <span className="text-rose-300 text-xs font-bold">{selected.size} selected</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setSelected(new Set())}
              className="text-white/50 hover:text-white text-xs font-semibold transition-colors">Clear</button>
            <button onClick={() => setConfirm([...selected])}
              className="flex items-center gap-1.5 bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-rose-600 transition-colors">
              <Trash2 className="h-3.5 w-3.5" /> Delete selected
            </button>
          </div>
        </div>
      )}
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-[#0c1a2c]">
          <tr className="text-white/40 uppercase tracking-wider">
            {canDelete && (
              <th className="px-3 py-2 w-8">
                <input type="checkbox" checked={allChecked} className="accent-[#22d3ee] h-3.5 w-3.5 cursor-pointer"
                  onChange={() => setSelected(allChecked ? new Set() : new Set(rows.map((_, i) => i)))} />
              </th>
            )}
            {reg.headers.map((h, i) => (
              <th key={i} className="text-left px-3 py-2 font-bold whitespace-nowrap">{h || "—"}</th>
            ))}
            {canDelete && <th className="px-3 py-2" />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={`border-t border-white/5 text-white/70 hover:bg-white/[0.03] ${selected.has(ri) ? "bg-rose-500/5" : ""}`}>
              {canDelete && (
                <td className="px-3 py-2">
                  <input type="checkbox" checked={selected.has(ri)} onChange={() => toggleRow(ri)}
                    className="accent-[#22d3ee] h-3.5 w-3.5 cursor-pointer" />
                </td>
              )}
              {reg.headers.map((_, ci) => (
                <td key={ci} className="px-3 py-2 whitespace-nowrap">
                  {ci === snoIdx ? ri + 1 : (row[ci] || "—")}
                </td>
              ))}
              {canDelete && (
                <td className="px-3 py-2 text-right">
                  <button onClick={() => setConfirm([ri])}
                    className="p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-colors" title="Delete this registration">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              )}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={reg.headers.length + (canDelete ? 2 : 0)} className="px-3 py-6 text-center text-white/30">No registrations.</td></tr>
          )}
        </tbody>
      </table>
      <ConfirmPopup
        open={!!confirm}
        title={confirm && confirm.length > 1 ? `Delete ${confirm.length} registrations?` : "Delete registration?"}
        message={confirm && confirm.length > 1
          ? `${confirm.length} selected registration entries will be permanently removed from this submission. This cannot be undone.`
          : "This registration entry will be permanently removed from this submission. This cannot be undone."}
        loading={deleting}
        onConfirm={doConfirm}
        onCancel={() => setConfirm(null)} />
    </>
  );
}

export function FullscreenButton({ onClick }) {
  return (
    <button onClick={onClick} className="p-2 rounded-lg text-white/40 hover:text-secondary hover:bg-secondary/10 transition-colors" title="View full screen">
      <Maximize2 className="h-4 w-4" />
    </button>
  );
}

// Fullscreen modal for viewing all details comfortably.
export function EventRegFullscreen({ reg, subtitle, onClose, onDeleteRows, deleting }) {
  if (!reg) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col p-3 sm:p-6" onClick={onClose}>
      <div className="bg-[#0c1a2c] border border-white/10 rounded-2xl flex flex-col flex-1 min-h-0 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-white/10 flex-shrink-0">
          <div className="min-w-0">
            <h3 className="text-white font-bold truncate">{reg.event_name}</h3>
            <p className="text-white/40 text-xs mt-0.5 truncate">
              {subtitle ? subtitle + " · " : ""}{reg.original_name} · {(reg.rows || []).length} registration(s)
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-colors flex-shrink-0" title="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-auto">
          <EventRegTable reg={reg} onDeleteRows={onDeleteRows} deleting={deleting} />
        </div>
      </div>
    </div>,
    document.body
  );
}
