import { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";

// One metric shown at a time — much easier for students to read than
// several overlapping lines.
const METRICS = [
  { key: "sw_direct_view",   name: "Direct View",        color: "#facc15", group: "Speed Writing" },
  { key: "sw_indirect_view", name: "Indirect View",      color: "#34d399", group: "Speed Writing" },
  { key: "sw_hand_writing",  name: "Hand Writing",       color: "#60a5fa", group: "Speed Writing" },
  { key: "book_a_page",      name: "Class Work · Book A", color: "#38bdf8", group: "Books" },
  { key: "book_b_page",      name: "Class Work · Book B", color: "#818cf8", group: "Books" },
  { key: "hw_book_a_page",   name: "Home Work · Book A",  color: "#fbbf24", group: "Books" },
  { key: "hw_book_b_page",   name: "Home Work · Book B",  color: "#fb923c", group: "Books" },
];

function CustomTooltip({ active, payload, label, metric }) {
  if (!active || !payload || !payload.length) return null;
  let dateLabel = label;
  try { dateLabel = new Date(label + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); } catch { }
  return (
    <div className="bg-[#142338]/95 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 text-sm shadow-xl shadow-black/40">
      <p className="text-white/60 mb-1.5 font-semibold text-[11px] uppercase tracking-wider">{dateLabel}</p>
      <p className="font-bold text-lg" style={{ color: metric.color }}>{payload[0].value}</p>
      <p className="text-white/40 text-[11px]">{metric.name}</p>
    </div>
  );
}

export default function SwProgressChart({ reports, title }) {
  const [metricKey, setMetricKey] = useState("sw_direct_view");
  const metric = METRICS.find(m => m.key === metricKey) || METRICS[0];

  // Absent days carry no scores — only present sessions are plotted.
  const sorted = (reports || [])
    .filter(r => r.attendance !== "absent")
    .sort((a, b) => (a.report_date > b.report_date ? 1 : -1));

  const data = sorted.map(r => ({
    date: r.report_date,
    sw_direct_view:   Number(r.sw_direct_view)   || 0,
    sw_indirect_view: Number(r.sw_indirect_view) || 0,
    sw_hand_writing:  Number(r.sw_hand_writing ?? r.sw_right_hand_writing) || 0,
    book_a_page:      Number(r.book_a_page)      || 0,
    book_b_page:      Number(r.book_b_page)      || 0,
    hw_book_a_page:   Number(r.hw_book_a_page)   || 0,
    hw_book_b_page:   Number(r.hw_book_b_page)   || 0,
  }));

  if (data.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        <div className="h-12 w-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-5 h-5 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        </div>
        <p className="text-white/40 text-sm font-medium">No progress data available yet.</p>
        <p className="text-white/20 text-xs mt-1">Attend classes to see your progress here.</p>
      </div>
    );
  }

  const latest = data[data.length - 1][metric.key];

  return (
    <div className="px-5 py-6">
      <h3 className="font-bold text-white mb-4 tracking-wide flex items-center gap-2.5 text-base">
        <div className="h-6 w-6 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        {title || "Progress Chart"}
      </h3>

      {/* Metric picker chips */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {METRICS.map(m => (
          <button key={m.key} type="button" onClick={() => setMetricKey(m.key)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all ${
              m.key === metricKey
                ? "text-[#081b30] border-transparent"
                : "text-white/50 border-white/10 bg-white/[0.03] hover:text-white hover:border-white/25"
            }`}
            style={m.key === metricKey ? { backgroundColor: m.color } : undefined}>
            {m.name}
          </button>
        ))}
      </div>

      {/* Latest value summary */}
      <div className="flex items-end gap-4 mb-4">
        <div>
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-0.5">Latest — {metric.name}</p>
          <p className="text-3xl font-bold tabular-nums" style={{ color: metric.color }}>{latest}</p>
        </div>
      </div>

      <div className="pr-4">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${metric.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={metric.color} stopOpacity={0.35} />
                <stop offset="95%" stopColor={metric.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 600 }}
              tickLine={false}
              axisLine={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 2 }}
              tickMargin={12}
              tickFormatter={d => {
                try { return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }); }
                catch { return d; }
              }}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 600 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              domain={[0, "auto"]}
              tickMargin={12}
            />
            <Tooltip content={<CustomTooltip metric={metric} />} cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1, strokeDasharray: "4 4" }} />
            <Area
              type="monotone"
              dataKey={metric.key}
              name={metric.name}
              stroke={metric.color}
              strokeWidth={3}
              fill={`url(#grad-${metric.key})`}
              dot={{ r: 4, fill: "#0f1c2e", stroke: metric.color, strokeWidth: 2 }}
              activeDot={{ r: 6, fill: metric.color, stroke: "#0f1c2e", strokeWidth: 2 }}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
