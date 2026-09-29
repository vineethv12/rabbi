import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { MessageSquare, Send, X, AlertCircle } from "lucide-react";

export function waPhone(s) {
  const raw = String(s?.mobile || s?.parent_contact || "").replace(/\D/g, "");
  if (!raw) return "";
  if (raw.length === 10) return "91" + raw;
  if (raw.length === 12 && raw.startsWith("91")) return raw;
  if (raw.length === 11 && raw.startsWith("0")) return "91" + raw.slice(1);
  return raw;
}

export const WA_TEMPLATES = [
  {
    key: "progress",
    label: "Progress Update",
    build: s => `Dear Parent,\n\nGreetings from Rabbi Global Academy.\n\nThis is an update regarding *${s.name}* (Student ID: ${s.enrollment_no}).\n\n`,
  },
  {
    key: "attendance",
    label: "Attendance Query",
    build: s => `Dear Parent,\n\nGreetings from Rabbi Global Academy.\n\nWe noticed *${s.name}* (Student ID: ${s.enrollment_no}) has been missing classes recently. Kindly let us know if there is any concern we can help with.\n\n`,
  },
  {
    key: "fee",
    label: "Fee Reminder",
    build: s => `Dear Parent,\n\nGreetings from Rabbi Global Academy.\n\nThis is a gentle reminder regarding the pending fee for *${s.name}* (Student ID: ${s.enrollment_no}). Kindly complete the payment at the earliest.\n\nThank you.`,
  },
  {
    key: "query",
    label: "General Query",
    build: s => `Dear Parent,\n\nGreetings from Rabbi Global Academy.\n\nRegarding *${s.name}* (Student ID: ${s.enrollment_no}):\n\n`,
  },
];

export function WhatsAppModal({ student, onClose }) {
  const [message, setMessage] = useState("");
  useEffect(() => { setMessage(student ? WA_TEMPLATES[0].build(student) : ""); }, [student?.enrollment_no]);
  if (!student) return null;
  const phone = waPhone(student);
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
      <div className="bg-gray-900 border border-white/15 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-white">Message Parent on WhatsApp</h3>
              <p className="text-white/40 text-xs mt-0.5">
                {student.name} · {student.enrollment_no}
                {phone ? ` · +${phone}` : ""}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X className="h-5 w-5" /></button>
        </div>

        {!phone ? (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-400/30 rounded-xl px-4 py-3 text-sm text-red-300">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>No mobile number recorded for this student. Add one via Edit first.</span>
          </div>
        ) : (
          <>
            <div>
              <p className="text-white/60 text-[11px] font-bold uppercase tracking-wider mb-2">Quick Templates</p>
              <div className="flex flex-wrap gap-2">
                {WA_TEMPLATES.map(t => (
                  <button key={t.key} type="button" onClick={() => setMessage(t.build(student))}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold border border-white/15 text-white/60 hover:text-white hover:border-emerald-400/50 hover:bg-emerald-500/10 transition-colors">
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-white/60 text-[11px] font-bold uppercase tracking-wider mb-2">Message</p>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={7}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-400/60 resize-y"
                placeholder="Type your message to the parent..." />
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 text-sm font-medium transition-colors">
                Cancel
              </button>
              <a
                href={message.trim() ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : undefined}
                target="_blank" rel="noopener noreferrer"
                onClick={e => { if (!message.trim()) e.preventDefault(); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${message.trim() ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-white/10 text-white/30 cursor-not-allowed"}`}>
                <Send className="h-4 w-4" /> Open in WhatsApp
              </a>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
