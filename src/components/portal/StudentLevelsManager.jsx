import { useState } from "react";
import { Pencil, Plus, Trash2, X, Check } from "lucide-react";

export function StudentLevelsManager({ levels, getHeaders, onChange }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function save(method, body) {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/student_levels.php", {
        method, headers: { ...getHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save levels");
      setEditing(null); setName("");
      setMessage(method === "DELETE" ? "Level deleted." : method === "PUT" ? "Level updated, including assigned students." : "Level added.");
      await onChange();
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  return <div className="min-w-0 rounded-xl border border-white/10 bg-white/5 p-3 sm:p-4 space-y-3">
    <button type="button" onClick={() => setOpen(!open)} className="text-sm font-semibold text-secondary" aria-expanded={open}>{open ? "Close level settings" : "Manage levels"}</button>
    {open && <>
      <p className="text-xs text-white/60">Changes apply to all centers. Renaming updates assigned students. To delete an assigned level, move its students to another level first.</p>
      <div className="flex flex-wrap gap-2">
        <input value={name} onChange={e => setName(e.target.value)} maxLength={100} placeholder="New level name" aria-label="New level name" className="min-w-0 w-full sm:w-auto rounded-lg bg-black/20 border border-white/20 p-2 text-sm text-white" />
        <button type="button" disabled={busy || !name.trim()} onClick={() => save("POST", { name })} className="flex items-center gap-1 bg-secondary text-primary rounded-lg px-3 py-2 text-sm font-bold disabled:opacity-40"><Plus className="h-4 w-4" /> Add level</button>
      </div>
      <ul className="space-y-2">
        {levels.map(level => <li key={level.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-black/15 p-2 min-w-0">
          {editing === level.id ? <>
            <input value={draft} onChange={e => setDraft(e.target.value)} maxLength={100} aria-label={`Rename ${level.name}`} className="min-w-0 flex-1 bg-black/20 border border-white/20 rounded p-2 text-sm text-white" />
            <button type="button" disabled={busy || !draft.trim()} onClick={() => save("PUT", { id: level.id, name: draft })} aria-label="Save level name" className="p-2 text-emerald-300 disabled:opacity-40"><Check className="h-4 w-4" /></button>
            <button type="button" disabled={busy} onClick={() => setEditing(null)} aria-label="Cancel level edit" className="p-2 text-white/70"><X className="h-4 w-4" /></button>
          </> : <>
            <span className="flex-1 min-w-0 text-sm text-white break-all">{level.name} <span className="text-white/40">({level.student_count} students)</span></span>
            <button type="button" disabled={busy} onClick={() => { setEditing(level.id); setDraft(level.name); }} aria-label={`Edit ${level.name}`} className="p-2 text-white/70"><Pencil className="h-4 w-4" /></button>
            <button type="button" disabled={busy} onClick={() => {
              if (window.confirm(`Delete "${level.name}" from available student levels?`)) save("DELETE", { id: level.id });
            }} aria-label={`Delete ${level.name}`} className="p-2 text-red-300"><Trash2 className="h-4 w-4" /></button>
          </>}
        </li>)}
      </ul>
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      {message && !error && <p role="status" className="text-sm text-emerald-300">{message}</p>}
    </>}
  </div>;
}