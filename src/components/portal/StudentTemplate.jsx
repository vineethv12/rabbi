import { useEffect, useRef, useState } from "react";
import { Download, Upload, FileText, RefreshCw } from "lucide-react";

const endpoint = "/api/portal_student_template.php";

export function StudentTemplate({ canUpload = false, getHeaders }) {
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const input = useRef(null);
  const headers = useRef(getHeaders);
  headers.current = getHeaders;

  async function checked(response) {
    if (!response.ok) {
      const result = await response.json().catch(() => null);
      throw new Error(result?.error || `Request failed (HTTP ${response.status})`);
    }
    return response;
  }
  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await checked(await fetch(`${endpoint}?meta=1`, { headers: headers.current() }));
      setTemplate((await response.json()).template);
    } catch (error) { setError(error.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function upload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setMessage("");
    if (!/\.(xlsx|csv)$/i.test(file.name) || file.size > 5 * 1024 * 1024 || !file.size) {
      setError("Choose an Excel (.xlsx) or CSV (.csv) file between 1 byte and 5 MB.");
      event.target.value = "";
      return;
    }
    setBusy(true);
    try {
      const data = new FormData();
      data.append("file", file);
      const response = await checked(await fetch(endpoint, { method: "POST", headers: headers.current(), body: data }));
      setTemplate((await response.json()).template);
      setMessage("Template uploaded. It is now available for download.");
    } catch (error) { setError(error.message); }
    finally { setBusy(false); if (input.current) input.current.value = ""; }
  }
  async function download() {
    setBusy(true);
    setError("");
    try {
      const response = await checked(await fetch(endpoint, { headers: headers.current() }));
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = template.original_name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }

  return (
    <section className="min-w-0 rounded-xl border border-white/15 bg-white/5 p-3 sm:p-4 space-y-3" aria-label="Student upload template">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h5 className="text-sm font-semibold text-white flex items-center gap-2"><FileText className="h-4 w-4 text-secondary" /> Student template</h5>
          {loading ? <p className="text-xs text-white/60 mt-1">Loading template…</p> : template ? (
            <div className="mt-1">
              <p className="text-sm text-white/90 break-all">{template.original_name}</p>
              <p className="text-xs text-white/50">{Math.ceil(Number(template.size) / 1024)} KB · Uploaded {template.uploaded_at}</p>
            </div>
          ) : <p className="text-sm text-white/60 mt-1">{error ? "Template could not be loaded." : canUpload ? "No template uploaded yet. Upload one to share with franchises." : "No template uploaded yet. Ask your admin to upload one."}</p>}
        </div>
        <div className="flex w-full sm:w-auto flex-wrap items-center gap-2">
          {template && <button type="button" onClick={download} disabled={busy || loading} className="flex items-center justify-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm text-white disabled:opacity-50"><Download className="h-4 w-4 shrink-0" /> Download template</button>}
          {canUpload && <>
            <input ref={input} type="file" accept=".xlsx,.csv" onChange={upload} className="hidden" aria-label="Choose student template" />
            <button type="button" onClick={() => input.current?.click()} disabled={busy || loading} className="flex items-center justify-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm font-bold text-primary disabled:opacity-50"><Upload className="h-4 w-4 shrink-0" />{busy ? "Please wait…" : template ? "Replace template" : "Upload template"}</button>
          </>}
          <button type="button" onClick={load} disabled={busy || loading} aria-label="Refresh student template" className="p-2 text-white/60 disabled:opacity-50"><RefreshCw className="h-4 w-4" /></button>
        </div>
      </div>
      {canUpload && <p className="text-xs text-white/50">XLSX or CSV, up to 5 MB. Keep columns in this order: Name, Father Name, Mother Name, DOB, Mobile, Gender, Blood Group, Address, Level, Email, Anniversary.</p>}
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      {message && !error && <p role="status" className="text-sm text-emerald-300">{message}</p>}
    </section>
  );
}