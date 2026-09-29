import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, Search, Users } from "lucide-react";

export function StudentMultiSelect({
  students = [],
  selected = [],
  onChange,
  disabled = false,
  placeholder = "Select students…",
  emptyText = "No students",
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const wrapRef = useRef(null);
  const panelRef = useRef(null);

  const updatePos = () => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ top: r.bottom + 6, left: r.left, width: r.width });
  };

  useEffect(() => {
    if (!open) return;
    updatePos();
    function onDocClick(e) {
      if (
        wrapRef.current && !wrapRef.current.contains(e.target) &&
        panelRef.current && !panelRef.current.contains(e.target)
      ) setOpen(false);
    }
    function onMove() { updatePos(); }
    document.addEventListener("mousedown", onDocClick);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open]);

  const filtered = students.filter(
    s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.enrollment_no.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = en =>
    onChange(selected.includes(en) ? selected.filter(x => x !== en) : [...selected, en]);

  const allSelected = students.length > 0 && selected.length === students.length;

  const summary =
    selected.length === 0
      ? placeholder
      : selected.length === 1
      ? students.find(s => s.enrollment_no === selected[0])?.name || `${selected.length} selected`
      : `${selected.length} students selected`;

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-left transition-colors focus:outline-none focus:border-secondary/50 disabled:opacity-50 disabled:cursor-not-allowed hover:border-white/25"
      >
        <Users className="h-4 w-4 text-secondary/70 flex-shrink-0" />
        <span className={`flex-1 truncate ${selected.length ? "text-white" : "text-white/40"}`}>
          {summary}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-white/40 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && !disabled && createPortal(
        <div
          ref={panelRef}
          className="fixed z-[200] rounded-xl border border-white/20 shadow-2xl shadow-black/70 overflow-hidden"
          style={{ backgroundColor: "#0b1626", top: pos.top, left: pos.left, width: pos.width }}
        >
          <div className="p-2 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search students…"
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-2 py-1.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-secondary/50"
              />
            </div>
          </div>

          <div className="max-h-52 overflow-y-auto divide-y divide-white/5">
            {filtered.map(s => {
              const on = selected.includes(s.enrollment_no);
              return (
                <button
                  type="button"
                  key={s.enrollment_no}
                  onClick={() => toggle(s.enrollment_no)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/10 transition-colors text-left"
                >
                  <span
                    className={`h-4 w-4 rounded flex items-center justify-center flex-shrink-0 border ${
                      on ? "bg-secondary border-secondary" : "border-white/25"
                    }`}
                  >
                    {on && <Check className="h-3 w-3 text-primary" />}
                  </span>
                  <span className="text-sm text-white/85 flex-1 truncate">{s.name}</span>
                  <span className="text-white/35 text-xs">{s.enrollment_no}</span>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-white/30 text-xs text-center py-4">
                {students.length === 0 ? emptyText : "No matches"}
              </p>
            )}
          </div>

          {students.length > 0 && (
            <div className="flex items-center gap-3 px-3 py-2 border-t border-white/10 bg-white/2">
              <button
                type="button"
                onClick={() => onChange(allSelected ? [] : students.map(s => s.enrollment_no))}
                className="text-xs text-secondary/80 hover:text-secondary transition-colors"
              >
                {allSelected ? "Deselect all" : "Select all"}
              </button>
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-white/40 hover:text-white transition-colors"
              >
                Clear
              </button>
              <span className="text-white/30 text-xs ml-auto">{selected.length} selected</span>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
