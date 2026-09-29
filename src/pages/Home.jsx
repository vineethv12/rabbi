import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/shared/AppLayout";
import { Seo } from "@/components/shared/Seo";
import { organizationJsonLd, websiteJsonLd } from "@/config/site";
import { VideoModal } from "@/components/shared/VideoModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  ArrowRight,
  PlayCircle,
  Star,
  Quote,
  Calendar,
  CalendarDays,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calculator,
  Timer,
  RotateCcw,
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";

const HERO_PARTICLES = [
  { left: "5%",  top: "75%", char: "7",  fontSize: "48px", dur: 5,   delay: 0,   tx: "18px",  glow: 1 },
  { left: "12%", top: "60%", char: "+",  fontSize: "48px", dur: 7,   delay: 1.2, tx: "-14px", glow: 0 },
  { left: "18%", top: "82%", char: "∑",  fontSize: "48px", dur: 6,   delay: 2.8, tx: "22px",  glow: 1 },
  { left: "27%", top: "65%", char: "3",  fontSize: "48px", dur: 8,   delay: 0.5, tx: "-16px", glow: 0 },
  { left: "38%", top: "85%", char: "×",  fontSize: "48px", dur: 5.5, delay: 3.5, tx: "12px",  glow: 0 },
  { left: "46%", top: "70%", char: "2",  fontSize: "48px", dur: 7,   delay: 1.8, tx: "-18px", glow: 1 },
  { left: "54%", top: "60%", char: "9",  fontSize: "48px", dur: 6.5, delay: 4.2, tx: "14px",  glow: 0 },
  { left: "63%", top: "80%", char: "÷",  fontSize: "48px", dur: 5,   delay: 0.9, tx: "-10px", glow: 1 },
  { left: "71%", top: "68%", char: "√",  fontSize: "30px", dur: 8,   delay: 3.0, tx: "16px",  glow: 0 },
  { left: "80%", top: "76%", char: "∞",  fontSize: "48px", dur: 6,   delay: 1.5, tx: "-20px", glow: 1 },
  { left: "88%", top: "55%", char: "5",  fontSize: "48px", dur: 7.5, delay: 2.5, tx: "18px",  glow: 0 },
  { left: "94%", top: "72%", char: "8",  fontSize: "30px", dur: 5.5, delay: 0.3, tx: "-12px", glow: 1 },
  { left: "9%",  top: "45%", char: "=",  fontSize: "48px", dur: 8,   delay: 4.8, tx: "10px",  glow: 0 },
  { left: "33%", top: "50%", char: "π",  fontSize: "48px", dur: 6,   delay: 2.1, tx: "-14px", glow: 1 },
  { left: "58%", top: "42%", char: "%",  fontSize: "48px", dur: 7,   delay: 3.8, tx: "16px",  glow: 0 },
  { left: "76%", top: "48%", char: "−",  fontSize: "48px", dur: 5.5, delay: 1.0, tx: "-18px", glow: 1 },
  { left: "22%", top: "35%", char: "0",  fontSize: "48px", dur: 6.5, delay: 5.2, tx: "12px",  glow: 0 },
  { left: "44%", top: "38%", char: "4",  fontSize: "48px", dur: 7.5, delay: 0.7, tx: "-16px", glow: 1 },
  { left: "67%", top: "32%", char: "5",  fontSize: "48px", dur: 5,   delay: 3.3, tx: "14px",  glow: 0 },
  { left: "85%", top: "40%", char: "∛",  fontSize: "48px", dur: 8,   delay: 1.9, tx: "-10px", glow: 1 },
];

function HeroPromoShowcase({ promos }) {
  const [active, setActive] = useState(0);
  const total = promos ? promos.length : 0;

  useEffect(() => {
    const id = setInterval(() => setActive((i) => (i + 1) % total), 4500);
    return () => clearInterval(id);
  }, [total]);

  const go = (dir) => setActive((i) => (i + dir + total) % total);
  const prevIdx = (active - 1 + total) % total;
  const nextIdx = (active + 1) % total;

  if (promos === null) {
    return (
      <div className="relative w-full max-w-[460px] mx-auto">
        <div className="relative h-[560px] sm:h-[600px] flex items-center justify-center">
          <div className="w-[78%] aspect-[4/5] rounded-[1.5rem] bg-white/10 animate-pulse" />
        </div>
      </div>
    );
  }
  if (!promos.length) return null;

  return (
    <div className="relative w-full max-w-[460px] mx-auto">
      {/* Soft glow behind stack */}
      <div className="absolute -inset-10 bg-secondary/15 blur-3xl rounded-full pointer-events-none" />

      {/* Stage */}
      <div className="relative h-[560px] sm:h-[600px]">
        {promos.map((p, i) => {
          let pos = "opacity-0 scale-90 translate-x-0 z-0";
          if (i === active) {
            pos = "opacity-100 scale-100 translate-x-0 z-30";
          } else if (i === prevIdx) {
            pos = "opacity-40 scale-[0.82] -translate-x-[58%] -rotate-6 z-10";
          } else if (i === nextIdx) {
            pos = "opacity-40 scale-[0.82] translate-x-[58%] rotate-6 z-10";
          }
          return (
            <div
              key={p.src}
              className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-out ${pos}`}
            >
              <div className="relative w-[78%] aspect-[4/5]">
                <div className="absolute -inset-1.5 rounded-[1.75rem] bg-gradient-to-br from-secondary/80 via-secondary/30 to-transparent" />
                <div className="relative w-full h-full rounded-[1.5rem] overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-white/10 bg-white">
                  <img
                    src={p.src}
                    alt={p.title}
                    className="w-full h-full object-cover"
                    loading={i === 0 ? "eager" : "lazy"}
                    fetchpriority={i === 0 ? "high" : undefined}
                    decoding="async"
                  />
                </div>
              </div>
            </div>
          );
        })}

        {/* Nav arrows */}
        <button
          aria-label="Previous"
          onClick={() => go(-1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full bg-white/95 hover:bg-white text-primary shadow-xl flex items-center justify-center transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          aria-label="Next"
          onClick={() => go(1)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full bg-white/95 hover:bg-white text-primary shadow-xl flex items-center justify-center transition"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Indicator dots */}
      <div className="flex items-center justify-center gap-2 mt-6">
        {promos.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => setActive(i)}
            className={`h-1.5 rounded-full transition-all ${i === active ? "w-8 bg-secondary" : "w-1.5 bg-white/30 hover:bg-white/50"}`}
          />
        ))}
      </div>
    </div>
  );
}

const NEWS_CAT_STYLES = {
  News:         "bg-secondary/15 text-secondary border-secondary/40",
  Update:       "bg-blue-500/10 text-blue-600 border-blue-500/30",
  Story:        "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  Announcement: "bg-rose-500/10 text-rose-600 border-rose-500/30",
};

function formatNewsDate(d) {
  if (!d) return "";
  const dt = new Date(d + (d.length === 10 ? "T00:00:00" : ""));
  if (isNaN(dt)) return "";
  return dt.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function NewsCalendarIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function NewsSection({ posts }) {
  const [selected, setSelected] = useState(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = posts ? posts.length : 0;

  useEffect(() => { setActive(0); }, [total]);

  useEffect(() => {
    if (total <= 1 || paused || selected) return;
    const id = setInterval(() => setActive(i => (i + 1) % total), 6000);
    return () => clearInterval(id);
  }, [total, paused, selected]);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e) => { if (e.key === "Escape") setSelected(null); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [selected]);

  if (!posts || !posts.length) return null;

  const canSlide = total > 1;
  const go = (dir) => setActive(i => (i + dir + total) % total);

  const featured = posts[active] || posts[0];

  return (
    <section className="py-16 lg:py-24 bg-[#FAF9F6]">
      <div className="container px-4">
        {/* Header */}
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-10 lg:mb-12">
          <div>
            <span className="inline-flex items-center gap-2.5 text-[11px] font-bold tracking-[0.22em] uppercase text-secondary mb-3">
              <span className="w-8 h-px bg-secondary" /> Latest News
            </span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary leading-tight">
              News, Updates &amp; Stories
            </h2>
            <p className="text-primary/55 mt-2 text-sm md:text-base max-w-xl">
              The latest happenings, achievements and announcements from Rabbi Global Academy.
            </p>
          </div>
          {canSlide && (
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => go(-1)} aria-label="Previous"
                className="w-10 h-10 rounded-full border border-primary/15 bg-white text-primary hover:bg-secondary hover:border-secondary transition-colors flex items-center justify-center">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => go(1)} aria-label="Next"
                className="w-10 h-10 rounded-full border border-primary/15 bg-white text-primary hover:bg-secondary hover:border-secondary transition-colors flex items-center justify-center">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Featured story + story list */}
        <div
          className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 items-start"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Featured card */}
          <div className={canSlide ? "lg:col-span-3" : "lg:col-span-5 max-w-3xl mx-auto w-full"}>
            <div className="bg-white rounded-2xl border border-primary/10 shadow-sm overflow-hidden">
              <div className="relative aspect-[16/9] bg-primary overflow-hidden">
                {posts.map((post, i) => (
                  <div key={post.id}
                    className={`absolute inset-0 transition-opacity duration-500 ${i === active ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                    {post.video ? (
                      i === active ? (
                        <video src={post.video} controls playsInline preload="metadata"
                          onPlay={() => setPaused(true)} onPause={() => setPaused(false)} onEnded={() => setPaused(false)}
                          className="absolute inset-0 w-full h-full object-contain bg-black" />
                      ) : null
                    ) : post.image ? (
                      <img src={post.image} alt={post.title} loading="lazy" decoding="async"
                        className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#16375c] via-primary to-[#0a1f38] flex items-center justify-center">
                        <svg className="w-20 h-20 text-secondary/30" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                      </div>
                    )}
                  </div>
                ))}
                {/* Autoplay progress */}
                {canSlide && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/15 z-10 overflow-hidden">
                    <span key={active} className="block h-full bg-secondary"
                      style={{ animation: "newsbar 6s linear forwards", animationPlayState: paused || selected ? "paused" : "running" }} />
                  </div>
                )}
              </div>
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-3 flex-wrap mb-3">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${NEWS_CAT_STYLES[featured.category] || NEWS_CAT_STYLES.News}`}>
                    {featured.category}
                  </span>
                  {featured.date && (
                    <span className="flex items-center gap-1.5 text-primary/45 text-xs font-medium">
                      <NewsCalendarIcon /> {formatNewsDate(featured.date)}
                    </span>
                  )}
                </div>
                <h3 className="font-serif font-bold text-primary text-2xl md:text-3xl leading-snug line-clamp-2">
                  {featured.title}
                </h3>
                {featured.summary && (
                  <p className="text-primary/60 text-sm md:text-base mt-3 leading-relaxed line-clamp-2">{featured.summary}</p>
                )}
                <button
                  onClick={() => setSelected(featured)}
                  className="group inline-flex items-center gap-2 mt-5 text-sm font-bold text-primary border-b-2 border-secondary pb-0.5 hover:text-secondary transition-colors">
                  Read Full Story
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                </button>
              </div>
            </div>
          </div>

          {/* Story list */}
          {canSlide && (
            <div className="lg:col-span-2 flex flex-col">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/40 mb-3 px-1">More Stories</p>
              <div className="flex flex-col divide-y divide-primary/[0.08] bg-white rounded-2xl border border-primary/10 shadow-sm overflow-hidden">
                {posts.map((post, i) => (
                  <button
                    key={post.id}
                    onClick={() => setActive(i)}
                    aria-label={`Go to ${post.title}`}
                    aria-current={i === active}
                    className={`group text-left flex gap-4 sm:gap-5 items-center p-4 sm:p-5 transition-colors duration-200 ${i === active ? "bg-secondary/[0.08]" : "hover:bg-primary/[0.03]"}`}
                  >
                    <div className="relative w-28 h-20 sm:w-32 sm:h-24 rounded-xl overflow-hidden shrink-0 bg-primary/5 ring-1 ring-primary/10">
                      {post.video ? (
                        <>
                          <video src={post.video} muted playsInline preload="metadata"
                            className="absolute inset-0 w-full h-full object-cover" />
                          <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                            <span className="w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center">
                              <svg className="w-4 h-4 text-primary translate-x-[1px]" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21" /></svg>
                            </span>
                          </span>
                        </>
                      ) : post.image ? (
                        <img src={post.image} alt="" loading="lazy" decoding="async"
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#16375c] to-[#0a1f38] flex items-center justify-center">
                          <svg className="w-8 h-8 text-secondary/50" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">{post.category}</span>
                        {post.date && (
                          <span className="text-xs text-primary/40">{formatNewsDate(post.date)}</span>
                        )}
                      </div>
                      <p className={`font-serif text-base sm:text-[17px] font-bold leading-snug line-clamp-2 transition-colors ${i === active ? "text-primary" : "text-primary/75 group-hover:text-primary"}`}>
                        {post.title}
                      </p>
                      {post.summary && (
                        <p className="hidden sm:line-clamp-1 text-[13px] text-primary/45 mt-1">{post.summary}</p>
                      )}
                    </div>
                    <span className={`w-2 h-2 rounded-full shrink-0 transition-colors ${i === active ? "bg-secondary" : "bg-transparent"}`} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Read-more modal */}
      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary/70 backdrop-blur-sm"
          onClick={() => setSelected(null)}>
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelected(null)}
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-primary shadow-lg flex items-center justify-center transition">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
            {selected.video ? (
              <div className="w-full rounded-t-3xl overflow-hidden bg-black">
                <video src={selected.video} controls playsInline preload="metadata"
                  className="w-full h-auto max-h-[70vh] mx-auto" />
              </div>
            ) : selected.image ? (
              <div className="w-full rounded-t-3xl overflow-hidden bg-[#F5F3EC]">
                <img src={selected.image} alt={selected.title} decoding="async"
                  className="w-full h-auto max-h-[70vh] object-contain mx-auto" />
              </div>
            ) : null}
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-3 flex-wrap mb-3">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${NEWS_CAT_STYLES[selected.category] || NEWS_CAT_STYLES.News}`}>
                  {selected.category}
                </span>
                {selected.date && (
                  <span className="flex items-center gap-1.5 text-primary/40 text-xs">
                    <NewsCalendarIcon /> {formatNewsDate(selected.date)}
                  </span>
                )}
              </div>
              <h3 className="font-serif font-bold text-primary text-2xl leading-tight mb-3">{selected.title}</h3>
              {selected.summary && <p className="text-primary/70 font-medium mb-3">{selected.summary}</p>}
              {selected.body && (
                <p className="text-primary/60 text-[15px] leading-relaxed whitespace-pre-line">{selected.body}</p>
              )}
              {selected.link_url && (
                <a href={selected.link_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-6 bg-secondary text-primary font-bold px-5 py-2.5 rounded-xl hover:bg-secondary/90 transition-colors">
                  Learn More
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}


const STATUS_STYLES = {
  open:   { color: "text-red-300",   dot: "bg-red-400" },
  soon:   { color: "text-blue-300",  dot: "bg-blue-400" },
  early:  { color: "text-green-300", dot: "bg-green-400" },
  closed: { color: "text-white/40",  dot: "bg-white/30" },
};

function mapApiEvent(e) {
  const sc = STATUS_STYLES[e.status_type] || STATUS_STYLES.soon;
  return {
    ...e,
    statusColor:  sc.color,
    statusDot:    sc.dot,
    status:       e.status_label,
    primaryCTA:   e.register_label || "Register Now",
    register_url: e.register_url  || "",
    brochure_url: e.brochure_url  || "",
    model_question_paper_url: e.model_question_paper_url || "",
    event_date:   e.event_date    || "",
    badgeIcon:    CalendarDays,
    details: [
      { icon: MapPin,   label: "Venue",    value: e.venue },
      { icon: Calendar, label: "Format",   value: e.format },
      { icon: Users,    label: "Participants", value: e.participants },
    ],
  };
}

function calcCountdown(dateStr, endStr) {
  if (!dateStr) return null;
  let diff = new Date(dateStr + "T00:00:00") - new Date();
  let started = false;
  if (diff <= 0 && endStr) {
    // Event already started — count down to the end of the last day instead
    started = true;
    diff = new Date(endStr + "T23:59:59") - new Date();
  }
  if (diff <= 0) return { expired: true, started, days: 0, hours: 0, mins: 0, secs: 0 };
  return {
    expired: false,
    started,
    days:  Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    mins:  Math.floor((diff % 3600000)  / 60000),
    secs:  Math.floor((diff % 60000)    / 1000),
  };
}

function CountdownTimer({ dateStr, endStr }) {
  const [tick, setTick] = useState(() => calcCountdown(dateStr, endStr));
  useEffect(() => {
    if (!dateStr) return;
    setTick(calcCountdown(dateStr, endStr));
    const id = setInterval(() => setTick(calcCountdown(dateStr, endStr)), 1000);
    return () => clearInterval(id);
  }, [dateStr, endStr]);
  if (!tick) return null;
  if (tick.expired) return (
    <div className="mt-5 pt-4 border-t border-white/10 text-center">
      <span className="inline-flex items-center gap-1.5 text-secondary text-[10px] font-bold uppercase tracking-[0.25em]">
        <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
        Event in progress
      </span>
    </div>
  );
  return (
    <div className="mt-5 pt-4 border-t border-white/10">
      <p className="text-white/35 text-[8px] font-bold uppercase tracking-[0.3em] text-center mb-3">
        {tick.started ? "Event Ends In" : "Time Remaining"}
      </p>
      {tick.started && (
        <p className="text-secondary text-[9px] font-bold uppercase tracking-[0.25em] text-center mb-2 -mt-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-secondary animate-pulse mr-1.5 align-middle" />
          Event in progress
        </p>
      )}
      <div className="flex items-center justify-center gap-1">
        {[["Days", tick.days], ["Hrs", tick.hours], ["Min", tick.mins], ["Sec", tick.secs]].map(([lbl, val], idx) => (
          <span key={lbl} className="contents">
            {idx > 0 && (
              <span className="text-secondary/50 font-black text-lg self-start mt-1 leading-none mx-px">:</span>
            )}
            <div className="flex flex-col items-center gap-1.5">
              <div className="relative w-[46px] h-[46px] rounded-xl overflow-hidden border border-white/15 shadow-lg shadow-black/50">
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/5 to-black/30" />
                <div className="absolute inset-x-0 top-0 h-px bg-white/50" />
                <div className="absolute inset-x-0 top-1/2 h-px bg-black/40" />
                <div className="relative h-full flex items-center justify-center">
                  <span className="text-white font-black text-2xl leading-none tabular-nums"
                    style={{ textShadow: "0 0 16px rgba(201,162,75,0.85)" }}>
                    {String(val).padStart(2, "0")}
                  </span>
                </div>
              </div>
              <span className="text-white/40 text-[7px] uppercase tracking-[0.18em] font-bold">{lbl}</span>
            </div>
          </span>
        ))}
      </div>
    </div>
  );
}

function UpcomingEventsSection() {
  const [events, setEvents] = useState([]);
  const [active, setActive] = useState(0);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkMsg, setBulkMsg] = useState({ type: "", text: "" });
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [bulkDetails, setBulkDetails] = useState({ uploader_name: "", academy_name: "", city: "" });
  const bulkFileRef = useRef(null);

  useEffect(() => {
    fetch("/api/events.php")
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map(mapApiEvent);
          mapped.sort((a, b) => {
            if (!a.event_date && !b.event_date) return 0;
            if (!a.event_date) return 1;
            if (!b.event_date) return -1;
            return a.event_date.localeCompare(b.event_date);
          });
          setEvents(mapped);
        }
      })
      .catch(() => {})
      .finally(() => setEventsLoading(false));
  }, []);

  const total = events.length;
  const ev = total > 0 ? (events[Math.min(active, total - 1)] || events[0]) : null;
  const BadgeIcon = ev?.badgeIcon || CalendarDays;
  const evYear = ev?.event_date ? ev.event_date.slice(0, 4) : "";
  const evRange = ev ? (ev.dateRange || ev.date_range || "") : "";
  const showRange = evRange.toLowerCase().includes("to");
  const hasBulkTemplate = Number(ev?.has_registration_template) === 1;
  const registrationClosed = Boolean(
    ev?.deadline &&
    /^\d{4}-\d{2}-\d{2}$/.test(ev.deadline) &&
    new Date(ev.deadline + "T23:59:59").getTime() < Date.now()
  );

  useEffect(() => {
    setBulkFile(null);
    setBulkMsg({ type: "", text: "" });
    setBulkDetails({ uploader_name: "", academy_name: "", city: "" });
    setRegistrationOpen(false);
    if (bulkFileRef.current) bulkFileRef.current.value = "";
  }, [ev?.id]);

  async function uploadBulkRegistration(e) {
    e.preventDefault();
    if (!bulkFile || !ev?.id || !bulkDetails.uploader_name.trim() || !bulkDetails.academy_name.trim() || !bulkDetails.city) {
      setBulkMsg({ type: "error", text: "Please enter your details and choose the completed Excel file." });
      return;
    }
    setBulkUploading(true);
    setBulkMsg({ type: "", text: "" });
    try {
      const fd = new FormData();
      fd.append("event_id", String(ev.id));
      fd.append("file", bulkFile);
      fd.append("uploader_name", bulkDetails.uploader_name.trim());
      fd.append("academy_name", bulkDetails.academy_name.trim());
      fd.append("city", bulkDetails.city);
      const res = await fetch("/api/public_event_registration.php", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) throw new Error(data.error || "Upload failed");
      setBulkMsg({
        type: "success",
        text: data.parsed
          ? `Uploaded successfully — ${data.count} registration(s) received.`
          : "Uploaded successfully. The admin can now review your file.",
      });
      setBulkFile(null);
      if (bulkFileRef.current) bulkFileRef.current.value = "";
    } catch (err) {
      setBulkMsg({ type: "error", text: err.message });
    } finally {
      setBulkUploading(false);
    }
  }

  if (eventsLoading || !ev) return (
    <section className="relative py-20 overflow-hidden">
      <div className="absolute inset-0">
        <img src="/images/championship-bg.webp" alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/85 to-[#0A2240]/95" />
      </div>
      <div className="container relative z-10 px-4 flex flex-col items-center justify-center min-h-[220px] text-center gap-4">
        {eventsLoading
          ? <Loader2 className="h-8 w-8 text-secondary/60 animate-spin" />
          : <>
              <Calendar className="h-10 w-10 text-secondary/25" />
              <p className="text-white/50 font-semibold text-lg">No upcoming events scheduled</p>
              <p className="text-white/30 text-sm">Check back soon — new events will appear here.</p>
            </>
        }
      </div>
    </section>
  );

  return (
    <section className="relative py-24 lg:py-28 overflow-hidden">
      <div className="absolute inset-0">
        <img src="/images/championship-bg.webp" alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/85 to-[#0A2240]/95" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-transparent to-primary/40" />
      </div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-secondary/10 blur-3xl rounded-full pointer-events-none" />

      <div className="container relative z-10 px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/15 border border-secondary/30 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
              <span className="text-secondary text-[11px] font-semibold tracking-[0.22em] uppercase">
                Upcoming Events
              </span>
            </div>
            <p className="text-white/70 text-sm font-light">
              Mark your calendars — registrations now open
            </p>
          </div>

          {/* Event tabs */}
          <div className="flex items-center gap-2 bg-white/[0.06] border border-white/10 rounded-full p-1">
            {events.map((e, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  i === active
                    ? "bg-secondary text-secondary-foreground shadow"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {(e.month || "").slice(0, 3)} {e.day}{e.event_date ? `, ${e.event_date.slice(0, 4)}` : ""}
              </button>
            ))}
          </div>
        </div>

        {/* Event card */}
        <Card className="overflow-hidden rounded-[1.75rem] border border-white/10 shadow-2xl shadow-black/50 bg-white/[0.04] backdrop-blur-xl">
          <div className="grid lg:grid-cols-12">
            {/* Date column */}
            <div className="lg:col-span-3 px-6 py-8 sm:px-10 sm:py-10 lg:px-7 lg:py-12 flex flex-col items-center justify-center text-center text-white relative border-b lg:border-b-0 lg:border-r border-white/10">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/15 via-transparent to-transparent pointer-events-none" />
              <div className="relative w-full max-w-[280px]">
                <div className="text-sm sm:text-base font-semibold tracking-[0.26em] uppercase text-secondary mb-2">
                  {ev.month}
                </div>
                <div className="text-[6rem] sm:text-[7rem] lg:text-[7.5rem] font-serif font-semibold leading-[0.95] tracking-tight text-white tabular-nums">
                  {ev.day}
                </div>
                {evYear && (
                  <div className="text-lg sm:text-xl font-light text-white/65 mt-2 tracking-[0.2em]">
                    {evYear}
                  </div>
                )}
                {showRange && (
                  <div className="text-xs font-medium tracking-wider text-white/60 mt-1">
                    {evRange}
                  </div>
                )}
                {ev.badge && (
                  <div className="mt-6 pt-5 border-t border-white/15">
                    <BadgeIcon className="w-5 h-5 mx-auto mb-2 text-secondary" />
                    <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/80">
                      {ev.badge}
                    </div>
                  </div>
                )}
                <CountdownTimer dateStr={ev.event_date} endStr={ev.event_end_date} />
              </div>
            </div>

            {/* Content column */}
            <div className="lg:col-span-9 p-8 lg:p-12 text-white">
              <div className="flex items-center gap-2 mb-5">
                <span className={`w-1.5 h-1.5 rounded-full ${ev.statusDot} animate-pulse`} />
                <span className={`text-[11px] font-semibold tracking-[0.22em] uppercase ${ev.statusColor}`}>
                  {ev.status}
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-[2.5rem] font-serif font-semibold text-white leading-[1.1] mb-4 tracking-tight">
                {ev.title}
                <span className="block text-secondary font-medium mt-1">{ev.subtitle}</span>
              </h2>
              <p className="text-white/80 text-base md:text-lg mb-9 max-w-2xl leading-relaxed font-light">
                {ev.description}
              </p>

              {ev.image && (
                <div className="mb-9 rounded-2xl overflow-hidden border border-white/10 shadow-xl shadow-black/40 max-w-2xl">
                  <img src={ev.image} alt={ev.title} className="block w-full h-auto" loading="lazy" decoding="async" />
                </div>
              )}

              <div className="grid sm:grid-cols-3 gap-3 mb-8">
                {ev.details.map((info, i) => (
                  <div key={i} className="flex flex-col items-center text-center gap-1 p-4 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-sm">
                    <div className="w-8 h-8 rounded-lg bg-secondary/15 border border-secondary/25 flex items-center justify-center shrink-0">
                      <info.icon className="w-4 h-4 text-secondary" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-[0.2em] font-semibold text-white/60 mb-1">{info.label}</div>
                      <div className="text-sm font-semibold text-white leading-tight">{info.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-6 border-t border-white/10">
                {(ev.register_url || hasBulkTemplate) && !registrationClosed ? (
                  <button
                    type="button"
                    onClick={() => setRegistrationOpen(true)}
                    className="inline-flex items-center justify-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full px-8 h-12 font-semibold flex-1 sm:flex-initial shadow-lg shadow-secondary/30 tracking-wide transition-colors"
                  >
                    {ev.primaryCTA || ev.register_label || "Register Now"} <ArrowRight className="ml-1 w-4 h-4" />
                  </button>
                ) : (
                  <button
                    disabled
                    className="inline-flex items-center justify-center gap-2 bg-white/10 text-white/40 rounded-full px-8 h-12 font-semibold flex-1 sm:flex-initial cursor-not-allowed tracking-wide"
                  >
                    {registrationClosed ? "Registration Closed" : (ev.primaryCTA || "Coming Soon")}
                  </button>
                )}
                {ev.brochure_url && (
                  <a
                    href={ev.brochure_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full px-8 h-12 border border-white/25 bg-transparent text-white hover:bg-white/10 font-medium flex-1 sm:flex-initial tracking-wide transition-colors"
                  >
                    Download Brochure
                  </a>
                )}
                {ev.model_question_paper_url && (
                  <a
                    href={ev.model_question_paper_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full px-6 h-12 border border-secondary/50 bg-secondary/[0.08] text-secondary hover:bg-secondary/[0.16] font-medium flex-1 sm:flex-initial tracking-wide transition-colors"
                  >
                    Model Question Paper <ArrowRight className="w-4 h-4" />
                  </a>
                )}
                {ev.deadline && (
                  <span className="text-xs text-white/60 sm:ml-auto font-light">
                    Deadline:{" "}
                    <span className="font-semibold text-white">
                      {/^\d{4}-\d{2}-\d{2}$/.test(ev.deadline)
                        ? new Date(ev.deadline + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                        : ev.deadline}
                    </span>
                  </span>
                )}
              </div>

            </div>
          </div>
        </Card>

        {registrationOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <button type="button" aria-label="Close registration" onClick={() => setRegistrationOpen(false)} className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
            <div className="relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/15 bg-[#10223c] shadow-2xl p-6 sm:p-8 text-white">
              <button type="button" onClick={() => setRegistrationOpen(false)} className="absolute top-4 right-4 p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
              <p className="text-secondary text-[11px] font-bold uppercase tracking-[0.2em] mb-2">Event Registration</p>
              <h3 className="text-2xl font-serif font-semibold pr-8">{ev.title}</h3>
              <p className="text-white/55 text-sm mt-2">Choose an individual registration or submit multiple registrations using the Excel template.</p>

              {ev.register_url && (
                <a href={ev.register_url} target="_blank" rel="noopener noreferrer"
                  className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/[0.06] p-4 hover:bg-white/10 transition-colors">
                  <span>
                    <span className="block text-white font-semibold">Individual Registration</span>
                    <span className="block text-white/50 text-xs mt-1">Open the online registration form.</span>
                  </span>
                  <ArrowRight className="h-5 w-5 text-secondary flex-shrink-0" />
                </a>
              )}

              {hasBulkTemplate && (
                <form onSubmit={uploadBulkRegistration} className="mt-4 rounded-2xl border border-secondary/30 bg-secondary/[0.08] p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-secondary" />
                        <h4 className="font-semibold">Bulk Registration</h4>
                      </div>
                      <p className="text-white/55 text-xs mt-1">Download the Excel sheet, complete it, and upload it here.</p>
                    </div>
                    <a href={`/api/public_event_registration.php?event_id=${ev.id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.08] px-4 py-2.5 text-sm font-semibold hover:bg-white/15">
                      <Download className="h-4 w-4" /> Template
                    </a>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 mt-4">
                    <input value={bulkDetails.uploader_name} onChange={e => setBulkDetails(d => ({ ...d, uploader_name: e.target.value }))}
                      placeholder="Your name *" className="rounded-xl border border-white/15 bg-black/15 px-3 py-2.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-secondary/60" />
                    <input value={bulkDetails.academy_name} onChange={e => setBulkDetails(d => ({ ...d, academy_name: e.target.value }))}
                      placeholder="Academy name *" className="rounded-xl border border-white/15 bg-black/15 px-3 py-2.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-secondary/60" />
                    <select value={bulkDetails.city} onChange={e => setBulkDetails(d => ({ ...d, city: e.target.value }))}
                      className="rounded-xl border border-white/15 bg-[#10223c] px-3 py-2.5 text-sm text-white outline-none focus:border-secondary/60">
                      <option value="">Select city *</option>
                      {["Bengaluru", "Mysuru", "Mangaluru", "Hubballi", "Belagavi", "Shivamogga", "Davanagere", "Ballari", "Tumakuru", "Udupi", "Other"].map(city => <option key={city} value={city}>{city}</option>)}
                    </select>
                    <label className="flex items-center gap-2 rounded-xl border border-dashed border-white/20 bg-black/10 px-3 py-2.5 cursor-pointer hover:border-secondary/50 min-w-0">
                      <Upload className="h-4 w-4 text-secondary flex-shrink-0" />
                      <span className="text-xs text-white/65 truncate">{bulkFile ? bulkFile.name : "Completed Excel file *"}</span>
                      <input ref={bulkFileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                        onChange={e => { setBulkFile(e.target.files[0] || null); setBulkMsg({ type: "", text: "" }); }} />
                    </label>
                  </div>

                  <button type="submit" disabled={!bulkFile || bulkUploading}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-secondary px-5 py-3 text-sm font-bold text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed">
                    {bulkUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {bulkUploading ? "Uploading…" : "Upload Bulk Registrations"}
                  </button>

                  {bulkMsg.text && (
                    <div className={`mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-xs ${bulkMsg.type === "success" ? "bg-emerald-500/10 text-emerald-200 border border-emerald-400/20" : "bg-red-500/10 text-red-200 border border-red-400/20"}`}>
                      {bulkMsg.type === "success" ? <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                      <span>{bulkMsg.text}</span>
                    </div>
                  )}
                </form>
              )}

              {!hasBulkTemplate && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/60">
                  <div className="flex items-center gap-2 text-white/80 font-semibold">
                    <FileSpreadsheet className="h-5 w-5 text-secondary" />
                    Bulk Registration
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed">
                    Bulk registration will be available after the event organizer uploads this event’s Excel template.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dot navigation */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => setActive(i => (i - 1 + total) % total)}
            className="w-8 h-8 rounded-full border border-white/20 bg-white/[0.06] hover:bg-white/15 flex items-center justify-center transition-all"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          {events.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`rounded-full transition-all ${i === active ? "w-8 h-2 bg-secondary" : "w-2 h-2 bg-white/25 hover:bg-white/50"}`}
            />
          ))}
          <button
            onClick={() => setActive(i => (i + 1) % total)}
            className="w-8 h-8 rounded-full border border-white/20 bg-white/[0.06] hover:bg-white/15 flex items-center justify-center transition-all"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Animated count-up stats band                                        */
/* ------------------------------------------------------------------ */

function useInView(threshold = 0.35) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

/* ------------------------------------------------------------------ */
/* "Beat the Calculator" inline mini-challenge                         */
/* ------------------------------------------------------------------ */

const BTC_DURATION = 5000;

function btcRandInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function btcGenProblem() {
  const roll = Math.random();
  if (roll < 0.5) {
    const a = btcRandInt(12, 89);
    const b = btcRandInt(12, 89);
    const c = btcRandInt(5, 40);
    return { text: `${a} + ${b} + ${c}`, answer: a + b + c };
  }
  if (roll < 0.8) {
    const a = btcRandInt(180, 540);
    const b = btcRandInt(60, 170);
    return { text: `${a} − ${b}`, answer: a - b };
  }
  const a = btcRandInt(6, 19);
  const b = btcRandInt(3, 9);
  return { text: `${a} × ${b}`, answer: a * b };
}

function BeatTheCalculator() {
  const [wrapRef, inView] = useInView(0.4);
  const [problem, setProblem] = useState(() => btcGenProblem());
  const [phase, setPhase] = useState("ready"); // ready | counting | revealed
  const [progress, setProgress] = useState(1); // 1 -> 0
  const rafRef = useRef(null);
  const startedRef = useRef(false);

  const run = (p) => {
    cancelAnimationFrame(rafRef.current);
    setProblem(p);
    setPhase("counting");
    setProgress(1);
    const startT = performance.now();
    const loop = (now) => {
      const left = Math.max(1 - (now - startT) / BTC_DURATION, 0);
      setProgress(left);
      if (left > 0) {
        rafRef.current = requestAnimationFrame(loop);
      } else {
        setPhase("revealed");
      }
    };
    rafRef.current = requestAnimationFrame(loop);
  };

  // Auto-start the first flash when the widget scrolls into view.
  useEffect(() => {
    if (inView && !startedRef.current) {
      startedRef.current = true;
      run(problem);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const seconds = Math.ceil(progress * (BTC_DURATION / 1000));
  const revealed = phase === "revealed";

  return (
    <section className="bg-white py-8 lg:py-10">
      <div className="container px-4">
        <div
          ref={wrapRef}
          className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl bg-gradient-to-r from-[#0A2240] via-primary to-[#0A2240] shadow-xl shadow-primary/25 ring-1 ring-secondary/20"
        >
          {/* decorative */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: "radial-gradient(circle, #C9A24B 1.5px, transparent 1.5px)",
              backgroundSize: "22px 22px",
            }}
          />
          <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-secondary/20 blur-3xl" />

          <div className="relative flex flex-col items-center gap-4 px-5 py-4 sm:flex-row sm:justify-between sm:gap-6 sm:px-7 sm:py-5">
            {/* Left: label + equation */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-secondary/15 ring-1 ring-secondary/30">
                <Calculator className="h-5 w-5 text-secondary" />
              </div>
              <div className="text-center sm:text-left">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
                  Beat the Calculator
                </div>
                <div className="flex items-center justify-center gap-2 font-serif text-2xl font-bold leading-tight text-white tabular-nums sm:justify-start sm:text-3xl">
                  <span>{problem.text}</span>
                  <span className="text-secondary">=</span>
                  <span className={`transition-all duration-500 ${revealed ? "text-secondary" : "text-white/30"}`}>
                    {revealed ? problem.answer.toLocaleString("en-IN") : "?"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: timer OR CTA */}
            <div className="w-full sm:w-auto sm:min-w-[230px]">
              {!revealed ? (
                <div>
                  <div className="mb-1.5 flex items-center justify-center gap-1.5 text-secondary sm:justify-end">
                    <Timer className="h-3.5 w-3.5" />
                    <span className="text-xs font-bold tabular-nums">Solve it in {seconds}s…</span>
                  </div>
                  <div className="mx-auto h-2 w-full max-w-xs overflow-hidden rounded-full bg-white/10 sm:mx-0 sm:ml-auto sm:w-52">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-secondary to-[#e0c274]"
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 sm:justify-end">
                  <Link
                    to="/quiz"
                    className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-5 py-2.5 text-sm font-bold text-primary shadow-lg shadow-secondary/30 transition-all hover:scale-105 hover:bg-[#d8b258] active:scale-95"
                  >
                    Take the Free Quiz
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => run(btcGenProblem())}
                    aria-label="Try another problem"
                    className="inline-flex items-center justify-center rounded-full border border-white/25 p-2.5 text-white transition-all hover:bg-white/10 active:scale-95"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Home() {
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [videoOpen, setVideoOpen] = useState(false);
  const [homeImgs, setHomeImgs] = useState({ hero: null, gallery: null, awards: [], founders: [] });
  const [homeNews, setHomeNews] = useState([]);
  const heroRef = useRef(null);

  useEffect(() => {
    fetch("/api/news.php")
      .then(r => r.json())
      .then(data => setHomeNews(Array.isArray(data) ? data.slice(0, 6) : []))
      .catch(() => setHomeNews([]));
  }, []);

  useEffect(() => {
    fetch("/api/home_images.php")
      .then(r => r.json())
      .then(data => {
        setHomeImgs({
          hero:     (data.hero     || []).slice(0, 5).map(img => ({ src: img.src, title: img.caption })),
          gallery:  (data.gallery  || []).slice(0, 10),
          awards:   data.awards   || [],
          founders: data.founders || [],
        });
      })
      .catch(() => {
        setHomeImgs({ hero: [], gallery: [], awards: [], founders: [] });
      });
  }, []);
  const canHover = useRef(
    typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches
  );

  function handleHeroMouseMove(e) {
    if (!canHover.current) return;
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setParallax({ x: nx * 12, y: ny * 12 });
  }

  return (
    <AppLayout>
      <Seo
        title="Abacus & Vedic Maths Classes for Kids in Bangalore"
        description="Rabbi Global Academy — Karnataka's premier institution for Abacus, Vedic Mathematics, and cognitive development. 17+ years of excellence across 40+ centers. Book a free demo class today."
        path="/"
        jsonLd={[organizationJsonLd, websiteJsonLd]}
      />
      {/* 1. Hero */}
      <section className="relative bg-primary overflow-hidden">
        {/* Decorative background pattern */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* ── Animated drifting orbs ────────────────────────────────── */}
        <div className="absolute -top-40 -right-40 w-[650px] h-[650px] rounded-full blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(201,168,76,0.55) 0%, transparent 70%)", animation: "hero-orb-drift-1 11s ease-in-out infinite" }} />
        <div className="absolute -bottom-40 -left-40 w-[560px] h-[560px] rounded-full blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(201,168,76,0.38) 0%, transparent 70%)", animation: "hero-orb-drift-2 14s ease-in-out infinite" }} />
        <div className="absolute top-[25%] right-[22%] w-[380px] h-[380px] rounded-full blur-[60px] pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(56,139,253,0.30) 0%, transparent 70%)", animation: "hero-orb-drift-3 16s ease-in-out infinite" }} />
        <div className="absolute top-[5%] left-[15%] w-[300px] h-[300px] rounded-full blur-[55px] pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(201,168,76,0.28) 0%, transparent 70%)", animation: "hero-orb-drift-2 12s ease-in-out infinite", animationDelay: "4s" }} />

        {/* ── Slow breathing sweep across entire hero ───────────────── */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 120% 80% at 60% 50%, rgba(201,168,76,0.10) 0%, transparent 65%)", animation: "hero-sweep 6s ease-in-out infinite" }} />

        {/* ── Floating maths & abacus symbols ──────────────────────── */}
        {HERO_PARTICLES.map((p, i) => (
          <span key={i}
            className="absolute pointer-events-none select-none font-bold leading-none"
            style={{
              left: p.left, top: p.top,
              fontSize: p.fontSize,
              color: "#C9A84C",
              opacity: 0.85,
              "--ptx": p.tx,
              textShadow: p.glow
                ? "0 0 10px rgba(201,168,76,0.9), 0 0 22px rgba(201,168,76,0.5)"
                : "0 0 6px rgba(201,168,76,0.4)",
              animation: `hero-particle ${p.dur}s ease-out infinite`,
              animationDelay: `${p.delay}s`,
              animationFillMode: "backwards",
            }}
          >
            {p.char}
          </span>
        ))}

        {/* ── Diagonal shimmer streaks ──────────────────────────────── */}
        <div className="absolute inset-y-0 left-0 w-52 pointer-events-none"
          style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.14) 50%, transparent 100%)", transform: "skewX(-22deg)", animation: "hero-shimmer 8s ease-in-out infinite" }} />
        <div className="absolute inset-y-0 left-0 w-36 pointer-events-none"
          style={{ background: "linear-gradient(90deg, transparent 0%, rgba(201,168,76,0.18) 50%, transparent 100%)", transform: "skewX(-22deg)", animation: "hero-shimmer 8s ease-in-out infinite", animationDelay: "4s" }} />

        {/* ── Pulse rings (right side, behind promo cards) ──────────── */}
        <div className="absolute top-1/2 right-[18%] -translate-y-1/2 pointer-events-none">
          {[0, 1.4, 2.8].map((delay, i) => (
            <div key={i}
              className="absolute top-0 left-0 w-96 h-96 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ border: "1.5px solid rgba(201,168,76,0.45)", animation: `hero-ring 4.2s ease-out infinite`, animationDelay: `${delay}s` }} />
          ))}
        </div>

        <div className="container relative z-10 px-4 pt-14 pb-16 sm:pt-16 sm:pb-20 lg:pt-24 lg:pb-28">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            {/* Left: Content */}
            <div className="lg:col-span-6">
              {/* Brand lockup: Logo + Title side by side */}
              <div className="flex items-center gap-5 mb-5">
                <div className="h-40 w-40 rounded-full bg-white flex items-center justify-center shadow-xl flex-shrink-0 overflow-hidden border-2 border-secondary/40">
                  <img
                    src="/images/rabbi-logo-transparent.webp"
                    alt="Rabbi Global Academy"
                    className="h-full w-full object-contain"
                    loading="eager"
                    fetchpriority="high"
                    decoding="async"
                  />
                </div>
                <h1 className="font-serif font-semibold text-white leading-[1.1] tracking-tight">
                  <span className="block text-3xl sm:text-4xl md:text-5xl">Rabbi Global</span>
                  <span className="block text-3xl sm:text-4xl md:text-5xl text-secondary font-medium text-center">Academy</span>
                </h1>
              </div>

              {/* Badge */}
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-secondary/15 border border-secondary/30 mb-6">
                <span className="w-3 h-3 rounded-full animate-pulse bg-secondary" />
                <span
                  className="text-sm font-bold tracking-[0.15em] text-secondary uppercase"
                  style={{ textShadow: "0 1px 1px rgba(255,255,255,0.35), 0 -1px 2px rgba(0,0,0,0.7), 0 2px 4px rgba(0,0,0,0.45)" }}
                >
                  Indian Abacus - Srf
                </span>
              </div>

              <p className="text-base md:text-lg text-white mb-8 sm:mb-10 max-w-lg leading-relaxed font-light">
                Karnataka's premier institution for Abacus, Vedic Mathematics,
                and cognitive development — shaping young minds for a lifetime
                of confidence, speed, and accuracy.
              </p>

              {/* CTA buttons */}
              <div
                className="flex flex-col sm:flex-row gap-3 mb-10 sm:mb-12 items-stretch sm:items-center"
                style={{ animation: "heroFadeUp 0.65s ease-out both", animationDelay: "360ms" }}
              >
                <button
                  onClick={() => window.open("https://www.youtube.com/@RabbiGlobalAcademy", "_blank", "noopener,noreferrer")}
                  className="group relative flex items-center justify-center sm:justify-start h-14 rounded-full shadow-xl shadow-secondary/30 hover:shadow-secondary/50 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden w-full sm:w-auto cursor-pointer"
                  style={{
                    background:
                      "linear-gradient(135deg, #D4A843 0%, #C9A84C 50%, #B8922A 100%)",
                  }}
                >
                  {/* Cartoon boy - absolutely pinned to bottom-left, clipped by overflow-hidden */}
                  <picture>
                    <source srcSet="/images/hero/hero-mascot-boy.webp" type="image/webp" />
                    <img
                      src="/images/hero/hero-mascot-boy.png"
                      alt=""
                      className="absolute bottom-0 left-1 h-[92%] w-auto object-contain object-bottom pointer-events-none group-hover:scale-105 transition-transform duration-300"
                      style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.3))", transformOrigin: "bottom center" }}
                      loading="eager"
                      fetchpriority="high"
                      decoding="async"
                    />
                  </picture>
                  {/* Button text */}
                  <span className="pl-14 pr-5 sm:pr-6 text-[14px] sm:text-[15px] font-bold text-white tracking-wide whitespace-nowrap flex items-center gap-2">
                    Watch Our Story
                    <PlayCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  </span>
                </button>
              </div>

              {/* Inline trust stats with cartoon icons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl pt-8 border-t border-white/10">
                {[
                  {
                    img: "/images/hero/students-group.webp",
                    num: "50K+",
                    label: "Students Trained",
                  },
                  {
                    img: "/images/hero/hero-stat-school.webp",
                    num: "50+",
                    label: "Franchises\nPartners\nCenters in Karnataka",
                  },
                  {
                    img: "/images/hero/hero-stat-trophy.webp",
                    num: "10+",
                    label: "Years of Trust",
                  },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center text-center"
                  >
                    <img
                      src={s.img}
                      alt={s.label}
                      className="w-14 h-14 object-contain mb-1.5"
                      style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.4))" }}
                      loading="eager"
                      decoding="async"
                    />
                    <div className="text-2xl md:text-3xl font-serif font-semibold text-secondary leading-tight tracking-tight">
                      {s.num}
                    </div>
                    <div className="text-[10px] md:text-[11px] text-white font-medium tracking-wider mt-0.5 whitespace-pre-line">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Promo showcase */}
            <div className="lg:col-span-6 relative mt-4 lg:mt-0 flex flex-col items-center justify-center">
              <HeroPromoShowcase promos={homeImgs.hero} />
            </div>
          </div>
        </div>

      </section>

      {/* Latest News & Updates */}
      <NewsSection posts={homeNews} />

      {/* 2. About Snapshot + Stats */}
      <section
        className="py-12 lg:py-14 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(160deg, #FEFCF5 0%, #F8F4E8 40%, #FDFBF4 100%)",
        }}
      >
        <div
          className="absolute top-8 right-8 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, #C9A84C 1px, transparent 1px)",
            backgroundSize: "18px 18px",
            width: 180,
            height: 180,
          }}
        />
        <div
          className="absolute bottom-8 left-8 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, #0A2240 1px, transparent 1px)",
            backgroundSize: "18px 18px",
            width: 140,
            height: 140,
          }}
        />

        <div className="container px-4 relative z-10">
          {/* ── Top: text left | founder photos right ── */}
          <div className="grid lg:grid-cols-2 gap-8 xl:gap-10 items-center mb-8">
            {/* LEFT: badge + heading + text + CTA */}
            <div className="flex flex-col justify-center text-center lg:text-left items-center lg:items-start">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-secondary/40 bg-secondary/8 mb-3 self-center lg:self-start">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-secondary"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-secondary">
                  Legacy of Excellence
                </span>
              </div>

              <h3 className="text-3xl sm:text-4xl md:text-[2.75rem] font-serif font-bold leading-[1.1] mb-2 tracking-tight">
                <span className="text-primary">About Rabbi </span>
                <span className="text-secondary">Global Academy</span>
              </h3>

              <div className="flex items-center gap-2 mb-4 justify-center lg:justify-start">
                <span className="h-px w-10 bg-secondary/40 rounded-full" />
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="#C9A84C"
                  className="opacity-70"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span className="h-px w-10 bg-secondary/40 rounded-full" />
              </div>

              <div className="space-y-3 mb-4">
                <p className="text-[15px] text-black leading-relaxed">
                  With over 17 years of proven excellence, we deliver impactful,
                  skill-oriented learning solutions built on a strong foundation
                  of academic expertise and innovation.
                </p>
                <p className="text-[15px] text-black leading-relaxed">
                  Focusing on Abacus, Vedic Mathematics, and cognitive skill
                  development, our curriculum is meticulously tailored for
                  children aged 4 to 18, emphasizing conceptual clarity and
                  mental agility.
                </p>
                <p className="text-[15px] text-black leading-relaxed">
                  Our holistic approach transforms learning into an engaging
                  experience, enabling students to achieve speed, accuracy, and
                  confidence while strengthening concentration and analytical
                  thinking.
                </p>
              </div>

              <Link to="/about">
                <Button
                  variant="link"
                  className="text-secondary font-semibold px-0 hover:no-underline group text-[15px] self-center lg:self-start"
                >
                  Read our full story{" "}
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            {/* RIGHT: founder photos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
              {(homeImgs.founders.length > 0
                ? homeImgs.founders.map(f => ({ img: f.src, name: f.caption, title: "" }))
                : [
                    { img: "/images/founders/founder-basha.webp",  name: "Grace",  title: "Founder & Director" },
                    { img: "/images/founders/founder-parveen.webp", name: "Mathew", title: "Founder & Director" },
                  ]
              ).map((f, i) => (
                <div
                  key={i}
                  className="rounded-2xl overflow-hidden shadow-md border border-secondary/12 bg-white group"
                >
                  <div
                    className="aspect-square overflow-hidden"
                    style={{
                      background:
                        "linear-gradient(170deg, #FDF3C8 0%, #F5E090 60%, #EDD060 100%)",
                    }}
                  >
                    <img
                      src={f.img}
                      alt={f.name}
                      className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="px-3 py-2 text-center border-t border-secondary/10 bg-white">
                    <div className="text-[12px] font-bold text-primary">
                      {f.name}
                    </div>
                    {f.title && <div className="text-[11px] text-secondary font-semibold mt-0.5">
                      {f.title}
                    </div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Beat the Calculator — inline quiz teaser */}
      <BeatTheCalculator />

      {/* 4. Why Choose / Benefits Grid */}
      <section
        className="py-20 lg:py-28 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(150deg, #EEF4FF 0%, #F5F0FF 35%, #FFF8EE 70%, #F0FFF8 100%)",
        }}
      >
        {/* Subtle decorative stars */}
        <div className="absolute top-10 left-10 text-secondary/20 text-4xl pointer-events-none select-none">
          ✦
        </div>
        <div className="absolute top-16 right-16 text-blue-300/30 text-3xl pointer-events-none select-none">
          ✦
        </div>
        <div className="absolute bottom-10 left-1/3 text-purple-300/25 text-2xl pointer-events-none select-none">
          ✦
        </div>
        <div className="absolute bottom-16 right-10 text-secondary/15 text-4xl pointer-events-none select-none">
          ✦
        </div>

        <div className="container px-4 relative">
          {/* Section header */}
          <div className="text-center max-w-3xl mx-auto mb-14">
            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-secondary/35 bg-white shadow-sm mb-6">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#C9A84C">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span className="text-[11px] font-bold tracking-[0.22em] uppercase text-primary/70">
                Why Choose Us
              </span>
            </div>

            {/* Two-tone heading */}
            <h2 className="text-4xl md:text-5xl font-serif font-bold leading-[1.1] mb-3 tracking-tight">
              <span className="text-primary">Why Choose </span>
              <span className="text-secondary">Rabbi Global Academy</span>
            </h2>

            {/* Decorative underline with star */}
            <div className="flex items-center justify-center gap-3 mb-5">
              <span className="h-px w-12 bg-secondary/40 rounded-full" />
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="#C9A84C"
                className="opacity-80"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span className="h-px w-12 bg-secondary/40 rounded-full" />
            </div>

            <p className="text-black text-base md:text-lg leading-relaxed">
              Beyond mathematics, we develop essential life skills that prepare
              your child for future academic challenges.
            </p>
          </div>

          {/* 3×2 benefit cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {[
              {
                img: "/images/benefits/concentration.webp",
                overlayImg: "/images/benefits/abacus-indian.webp",
                circleBg: "#DBEAFE",
                title: "Concentration",
                titleColor: "#1D4ED8",
                desc: "Deepens focus and attention span through visualized mental math techniques.",
                icon: (
                  <svg
                    viewBox="0 0 36 36"
                    fill="none"
                    className="w-full h-full"
                  >
                    <circle
                      cx="18"
                      cy="18"
                      r="17"
                      stroke="#3B82F6"
                      strokeWidth="2.2"
                      fill="none"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="11"
                      stroke="#3B82F6"
                      strokeWidth="1.8"
                      fill="none"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="5"
                      stroke="#3B82F6"
                      strokeWidth="1.8"
                      fill="none"
                    />
                    <circle cx="18" cy="18" r="2" fill="#3B82F6" />
                  </svg>
                ),
                iconBg: "#DBEAFE",
              },
              {
                img: "/images/benefits/memory.webp",
                circleBg: "#FEF3C7",
                title: "Memory Retention",
                titleColor: "#D97706",
                desc: "Strengthens visual memory and the ability to recall information instantly.",
                icon: (
                  <svg
                    viewBox="0 0 36 36"
                    fill="none"
                    className="w-full h-full"
                  >
                    <path
                      d="M18 6C13 6 9 10 9 15C9 18 10.5 20.5 13 22V26H23V22C25.5 20.5 27 18 27 15C27 10 23 6 18 6Z"
                      stroke="#F97316"
                      strokeWidth="2"
                      strokeLinejoin="round"
                      fill="#FED7AA"
                      fillOpacity="0.5"
                    />
                    <path
                      d="M18 6C18 6 18 11 14 13"
                      stroke="#F97316"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M18 6C18 6 18 11 22 13"
                      stroke="#F97316"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <line
                      x1="13"
                      y1="26"
                      x2="23"
                      y2="26"
                      stroke="#F97316"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    <line
                      x1="14"
                      y1="29"
                      x2="22"
                      y2="29"
                      stroke="#F97316"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                ),
                iconBg: "#FEF3C7",
              },
              {
                img: "/images/benefits/speed.webp",
                circleBg: "#D1FAE5",
                title: "Speed & Accuracy",
                titleColor: "#059669",
                desc: "Calculations performed mentally faster than relying on a calculator.",
                icon: (
                  <svg
                    viewBox="0 0 36 36"
                    fill="none"
                    className="w-full h-full"
                  >
                    <circle
                      cx="18"
                      cy="19"
                      r="13"
                      stroke="#10B981"
                      strokeWidth="2.2"
                      fill="none"
                    />
                    <path
                      d="M18 6V4"
                      stroke="#10B981"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M14 7L13 5.3"
                      stroke="#10B981"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M22 7L23 5.3"
                      stroke="#10B981"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M18 19L18 12"
                      stroke="#10B981"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M18 19L23 14"
                      stroke="#10B981"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    <circle cx="18" cy="19" r="2" fill="#10B981" />
                    <path
                      d="M18 28V30"
                      stroke="#10B981"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                ),
                iconBg: "#D1FAE5",
              },
              {
                img: "/images/benefits/wholebrain.webp",
                circleBg: "#EDE9FE",
                title: "Whole-Brain Development",
                titleColor: "#7C3AED",
                desc: "Stimulates both left and right hemispheres simultaneously.",
                icon: (
                  <svg
                    viewBox="0 0 36 36"
                    fill="none"
                    className="w-full h-full"
                  >
                    <path
                      d="M18 8C14 8 10 11 10 16C10 18 11 20 12 21C11 22 10 23.5 10 25C10 27 12 29 14 29H18"
                      stroke="#A855F7"
                      strokeWidth="2"
                      strokeLinecap="round"
                      fill="#DDD6FE"
                      fillOpacity="0.4"
                    />
                    <path
                      d="M18 8C22 8 26 11 26 16C26 18 25 20 24 21C25 22 26 23.5 26 25C26 27 24 29 22 29H18"
                      stroke="#A855F7"
                      strokeWidth="2"
                      strokeLinecap="round"
                      fill="#DDD6FE"
                      fillOpacity="0.4"
                    />
                    <line
                      x1="18"
                      y1="8"
                      x2="18"
                      y2="29"
                      stroke="#A855F7"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                    />
                    <circle cx="13" cy="16" r="1.5" fill="#A855F7" />
                    <circle cx="23" cy="16" r="1.5" fill="#A855F7" />
                    <circle cx="13" cy="22" r="1.5" fill="#A855F7" />
                    <circle cx="23" cy="22" r="1.5" fill="#A855F7" />
                  </svg>
                ),
                iconBg: "#EDE9FE",
              },
              {
                img: "/images/benefits/confidence.webp",
                circleBg: "#BFDBFE",
                title: "Confidence",
                titleColor: "#2563EB",
                desc: "Builds self-esteem by completely removing the fear of numbers.",
                icon: (
                  <svg
                    viewBox="0 0 36 36"
                    fill="none"
                    className="w-full h-full"
                  >
                    <circle
                      cx="18"
                      cy="10"
                      r="5"
                      stroke="#3B82F6"
                      strokeWidth="2"
                      fill="#BFDBFE"
                      fillOpacity="0.6"
                    />
                    <path
                      d="M10 30C10 24.5 13.5 21 18 21C22.5 21 26 24.5 26 30"
                      stroke="#3B82F6"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M18 21V16"
                      stroke="#3B82F6"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M18 22L13 26"
                      stroke="#3B82F6"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M18 22L23 26"
                      stroke="#3B82F6"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                ),
                iconBg: "#BFDBFE",
              },
              {
                img: "/images/benefits/creativity.webp",
                circleBg: "#FCE7F3",
                title: "Visualization & Creativity",
                titleColor: "#BE185D",
                desc: "Enhances imaginative thinking through mental bead visualization.",
                icon: (
                  <svg
                    viewBox="0 0 36 36"
                    fill="none"
                    className="w-full h-full"
                  >
                    <path
                      d="M18 6C14 6 11 9 11 13C11 16 13 18.5 16 19.5V23H20V19.5C23 18.5 25 16 25 13C25 9 22 6 18 6Z"
                      stroke="#EC4899"
                      strokeWidth="2"
                      strokeLinejoin="round"
                      fill="#FBCFE8"
                      fillOpacity="0.5"
                    />
                    <line
                      x1="16"
                      y1="23"
                      x2="20"
                      y2="23"
                      stroke="#EC4899"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    <line
                      x1="15"
                      y1="26"
                      x2="21"
                      y2="26"
                      stroke="#EC4899"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="8"
                      cy="11"
                      r="1.5"
                      fill="#EC4899"
                      fillOpacity="0.5"
                    />
                    <circle
                      cx="28"
                      cy="11"
                      r="1.5"
                      fill="#EC4899"
                      fillOpacity="0.5"
                    />
                    <circle
                      cx="10"
                      cy="19"
                      r="1"
                      fill="#EC4899"
                      fillOpacity="0.4"
                    />
                    <circle
                      cx="26"
                      cy="19"
                      r="1"
                      fill="#EC4899"
                      fillOpacity="0.4"
                    />
                    <path
                      d="M18 3V5"
                      stroke="#EC4899"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                ),
                iconBg: "#FCE7F3",
              },
            ].map((b, i) => (
              <div
                key={i}
                className="group bg-white rounded-3xl p-6 shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 border border-gray-100"
              >
                {/* Top row: illustration circle + icon badge + title */}
                <div className="flex items-start gap-4 mb-4">
                  {/* Circular illustration */}
                  <div
                    className="shrink-0 w-28 h-28 rounded-full overflow-hidden flex items-center justify-center"
                    style={{ background: b.circleBg }}
                  >
                    <img
                      src={b.img}
                      alt={b.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>

                  {/* Right: icon + title */}
                  <div className="flex-1 pt-1">
                    {/* Small icon badge */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-2 p-2"
                      style={{ background: b.iconBg }}
                    >
                      {b.icon}
                    </div>

                    {/* Title */}
                    <h4
                      className="text-lg font-bold leading-snug mb-1.5"
                      style={{ color: "#0A2240" }}
                    >
                      {b.title}
                    </h4>

                    {/* Colored underline */}
                    <div
                      className="w-8 h-[3px] rounded-full"
                      style={{ background: b.titleColor }}
                    />
                  </div>
                </div>

                {/* Description */}
                <p className="text-[14px] text-black leading-relaxed">
                  {b.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Featured Upcoming Events */}
      <UpcomingEventsSection />

      {/* 9. Awards & Recognition Gallery */}
      <section className="py-24 bg-[#FCFBF8] border-y border-border/40">
        <div className="container px-4">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-sm font-bold tracking-widest text-secondary uppercase mb-4 block">
              Awards &amp; Recognition
            </span>
            <h2 className="text-4xl font-serif font-bold text-primary mb-4 relative inline-block">
              Honoured on National / Inernational Stages
              <span className="absolute -bottom-2 left-1/4 right-1/4 h-1 bg-secondary rounded-full" />
            </h2>
            <p className="text-foreground text-lg mt-6">
              Our founders and master trainers have been felicitated by leading
              national and international abacus federations for excellence in
              education.
            </p>
          </div>

          {homeImgs.awards.length > 0 ? (
            <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {homeImgs.awards.map((img, i) => (
                <div key={i} className="group relative rounded-2xl overflow-hidden shadow-lg shadow-primary/10 aspect-[4/3]">
                  <img src={img.src} alt={img.caption} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" decoding="async" />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-xs font-serif font-bold text-white leading-snug">{img.caption}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
          <div className="max-w-6xl mx-auto space-y-3">

            {/* Row 1: hero (60%) + 2 stacked (40%) */}
            <div className="flex flex-col lg:flex-row gap-3 lg:h-[420px]">
              <div className="lg:w-[60%] group relative rounded-2xl overflow-hidden shadow-xl shadow-primary/10 aspect-[4/3] lg:aspect-auto">
                <img
                  src="/images/founders/awards/stage-9.webp"
                  alt="6th State Level Abacus Olympiad 2025 — Championship Trophy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 lg:p-7">
                  <Badge className="bg-secondary text-secondary-foreground hover:bg-secondary mb-2 text-[10px] uppercase tracking-widest">
                    2025 · State Olympiad
                  </Badge>
                  <h3 className="text-lg md:text-2xl font-serif font-bold text-white leading-tight">
                    6th State Level Abacus Olympiad — Championship Trophy
                  </h3>
                </div>
              </div>
              <div className="lg:w-[40%] flex flex-col gap-3 lg:h-full">
                <div className="flex-1 group relative rounded-2xl overflow-hidden shadow-xl shadow-primary/10 aspect-[4/3] lg:aspect-auto min-h-0">
                  <img
                    src="/images/founders/awards/stage-6.webp"
                    alt="5th Indian Abacus State Level — Plaque Presentation"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <Badge className="bg-white/15 text-white hover:bg-white/20 mb-1.5 text-[9px] uppercase tracking-widest border-white/20">
                      State Level
                    </Badge>
                    <h4 className="text-sm font-serif font-bold text-white leading-tight">
                      5th Indian Abacus State Level
                    </h4>
                  </div>
                </div>
                <div className="flex-1 group relative rounded-2xl overflow-hidden shadow-xl shadow-primary/10 aspect-[4/3] lg:aspect-auto min-h-0">
                  <img
                    src="/images/founders/awards/stage-7.webp"
                    alt="Indian Abacus National Abacus Olympiad 2023 — Certificate"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <Badge className="bg-white/15 text-white hover:bg-white/20 mb-1.5 text-[9px] uppercase tracking-widest border-white/20">
                      National 2023
                    </Badge>
                    <h4 className="text-sm font-serif font-bold text-white leading-tight">
                      National Abacus Olympiad Certificate
                    </h4>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: 3 equal */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:h-[230px]">
              {[
                { src: "/images/founders/awards/stage-1.webp", badge: "KSRP",          title: "State Recognition — KSRP Award Ceremony" },
                { src: "/images/founders/awards/stage-2.webp", badge: "National 2019", title: "Indian Abacus National Level — Certificate" },
                { src: "/images/founders/awards/stage-8.webp", badge: "Chennai",       title: "National Championship Trophy Presentation" },
              ].map((p, i) => (
                <div key={i} className="group relative rounded-2xl overflow-hidden shadow-lg shadow-primary/10 aspect-[4/3] md:aspect-auto md:h-full">
                  <img src={p.src} alt={p.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" decoding="async" />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <Badge className="bg-white/15 text-white hover:bg-white/20 mb-1 text-[8px] uppercase tracking-widest border-white/20">{p.badge}</Badge>
                    <h4 className="text-xs font-serif font-bold text-white leading-snug">{p.title}</h4>
                  </div>
                </div>
              ))}
            </div>

            {/* Row 3: 3 equal */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:h-[230px]">
              {[
                { src: "/images/founders/awards/stage-3.webp", badge: "National 2019", title: "National Level Competition — Team at Stage" },
                { src: "/images/founders/awards/stage-4.webp", badge: "National",      title: "Students Celebrating at National Olympiad" },
                { src: "/images/founders/awards/stage-5.webp", badge: "Chennai 2025",  title: "Indian Abacus Graduation Ceremony 2025" },
              ].map((p, i) => (
                <div key={i} className="group relative rounded-2xl overflow-hidden shadow-lg shadow-primary/10 aspect-[4/3] md:aspect-auto md:h-full">
                  <img src={p.src} alt={p.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" decoding="async" />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <Badge className="bg-white/15 text-white hover:bg-white/20 mb-1 text-[8px] uppercase tracking-widest border-white/20">{p.badge}</Badge>
                    <h4 className="text-xs font-serif font-bold text-white leading-snug">{p.title}</h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* Recognition stat strip */}
          <div className="mt-12 max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { num: "27", label: "National / International Awards", link: "https://www.indianabacus.com/awards-honours" },
              { num: "12", label: "International Felicitations" },
              { num: "150+", label: "Trophies Won by Students" },
              { num: "8", label: "Federation Memberships" },
            ].map((s, i) => {
              const card = (
                <div
                  key={i}
                  className={`bg-white border border-border rounded-2xl p-6 shadow-sm${s.link ? " hover:shadow-md hover:border-secondary/40 transition-all cursor-pointer" : ""}`}
                >
                  <div className="text-3xl md:text-4xl font-serif font-bold text-secondary mb-1">
                    {s.num}
                  </div>
                  <div className="text-xs md:text-sm text-foreground font-medium">
                    {s.label}
                  </div>
                </div>
              );
              return s.link ? (
                <a key={i} href={s.link} target="_blank" rel="noopener noreferrer">
                  {card}
                </a>
              ) : card;
            })}
          </div>
        </div>
      </section>

      {/* 9. Curriculum Model Stepper */}
      {/* <section className="py-24 bg-background">
        <div className="container px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-serif font-bold text-primary mb-4">Our Proven Learning Model</h2>
            <p className="text-foreground max-w-2xl mx-auto">A systematic approach to mastering mental arithmetic.</p>
          </div>

          <div className="max-w-5xl mx-auto relative">
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-border -translate-y-1/2 z-0" />
            <div className="grid md:grid-cols-4 gap-8 md:gap-4 relative z-10">
              {[
    { step: "01", name: "Concept", desc: "Understanding the abacus instrument and bead values." },
    { step: "02", name: "Practice", desc: "Repetitive physical manipulation to build muscle memory." },
    { step: "03", name: "Mastery", desc: "Transitioning from physical beads to mental visualization." },
    { step: "04", name: "Application", desc: "Solving complex arithmetic problems entirely mentally." }
  ].map((item, i) => <div key={i} className="flex flex-col items-center text-center bg-background p-4">
                  <div className="w-20 h-20 rounded-full bg-white border-4 border-secondary flex items-center justify-center text-2xl font-serif font-bold text-primary mb-6 shadow-xl relative">
                    {item.step}
                  </div>
                  <h4 className="text-xl font-bold text-primary mb-2">{item.name}</h4>
                  <p className="text-sm text-foreground">{item.desc}</p>
                </div>)}
            </div>
          </div>
        </div>
      </section> */}

      {/* 11. Partnered With */}
      {/* <section className="py-24 bg-background border-y border-border/50">
        <div className="container px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative p-4">
              <div className="absolute inset-0 bg-secondary/10 rounded-3xl transform rotate-3" />
              <img src="/images/franchise-hero-new.webp" alt="Partnership signing" className="relative z-10 rounded-2xl shadow-xl w-full object-cover border border-white" loading="lazy" decoding="async" />
            </div>

            <div>
              <span className="text-sm font-bold tracking-widest text-secondary uppercase mb-4 block">
                Partnered With
              </span>
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-primary mb-6">
                India Skill Development Initiative
              </h2>
              <p className="text-lg text-foreground mb-8 leading-relaxed">
                Rabbi Global Academy actively collaborates with India skill development bodies and educational boards to bring abacus-based cognitive learning to government and private schools across the state. Together, we are building a foundation of strong mathematical literacy for the next generation.
              </p>
              <Button variant="outline" className="border-secondary text-secondary hover:bg-secondary hover:text-white rounded-full px-8 font-semibold">
                Know More
              </Button>
            </div>
          </div>
        </div>
      </section> */}

      {/* 11b. Hear From Our Founders — Video Section */}
      {/* <section className="py-24 bg-gradient-to-br from-primary via-[#0F2D52] to-primary relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute -top-40 right-0 w-[500px] h-[500px] bg-secondary/15 blur-3xl rounded-full" />

        <div className="container relative z-10 px-4">
          <div className="grid lg:grid-cols-12 gap-10 items-end mb-14">
            <div className="lg:col-span-7 text-center lg:text-left">
              <span className="text-sm font-bold tracking-widest text-secondary uppercase mb-4 block">
                Voices of the Academy
              </span>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-white leading-tight">
                Hear From Our
                <br />
                <span className="text-secondary italic">
                  Founders &amp; Master Trainers
                </span>
              </h2>
            </div>
            <div className="lg:col-span-5 text-center lg:text-left">
              <p className="text-white text-lg leading-relaxed">
                Meet the people behind Rabbi Global Academy — their journey,
                their philosophy, and the vision that has shaped 10,000+ young
                minds across India.
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 group relative rounded-3xl overflow-hidden aspect-video shadow-2xl shadow-black/40 cursor-pointer w-full">
              <img
                src="/images/founders/award-trophy-couple.webp"
                alt="Founder interview"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/40 to-primary/10" />

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <span className="absolute inset-0 rounded-full bg-secondary/40 animate-ping" />
                  <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                    <PlayCircle
                      className="w-10 h-10 md:w-12 md:h-12"
                      strokeWidth={1.5}
                    />
                  </div>
                </div>
              </div>

              <div className="absolute top-5 right-5 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span>HD · 4:32</span>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-8">
                <Badge className="bg-secondary text-secondary-foreground hover:bg-secondary mb-3 text-[10px] uppercase tracking-widest">
                  Founders' Story
                </Badge>
                <h3 className="text-2xl md:text-3xl font-serif font-bold text-white leading-tight mb-2">
                  "Why we built Rabbi Global Academy"
                </h3>
                <p className="text-white text-sm">
                  A 17-year journey, told by our founders.
                </p>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-6">
              {[
                {
                  img: "/images/founders/award-plaque-couple.webp",
                  badge: "Co-Founder",
                  title: "The Vision Behind Our Curriculum",
                  duration: "3:18",
                  meta: "Mrs. Lakshmi B. \u2014 Co-Founder &amp; Head of Curriculum",
                },
                {
                  img: "/images/founders/award-cup-trio.webp",
                  badge: "Master Trainer",
                  title: "Coaching Champions on the National Stage",
                  duration: "2:54",
                  meta: "Mr. Ravi K. \u2014 Senior Master Trainer",
                },
              ].map((v, i) => (
                <div
                  key={i}
                  className="group relative rounded-3xl overflow-hidden bg-white/5 backdrop-blur border border-white/10 hover:border-secondary/40 transition-all cursor-pointer flex flex-col sm:flex-row"
                >
                  <div className="relative w-full sm:w-2/5 shrink-0 aspect-[4/3] sm:aspect-square overflow-hidden">
                    <img
                      src={v.img}
                      alt={v.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-primary/40 group-hover:bg-primary/20 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <PlayCircle className="w-6 h-6" strokeWidth={1.5} />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded">
                      {v.duration}
                    </div>
                  </div>
                  <div className="flex-1 p-5 flex flex-col justify-center text-center sm:text-left">
                    <Badge className="bg-secondary/15 text-secondary hover:bg-secondary/20 border border-secondary/30 mb-2 text-[10px] uppercase tracking-widest w-fit">
                      {v.badge}
                    </Badge>
                    <h4 className="text-base md:text-lg font-serif font-bold text-white leading-snug mb-1.5">
                      {v.title}
                    </h4>
                    <p
                      className="text-xs text-white"
                      dangerouslySetInnerHTML={{ __html: v.meta }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-12">
            <Button
              variant="outline"
              className="rounded-full px-8 h-12 border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white font-semibold"
            >
              <PlayCircle className="mr-2 w-5 h-5 text-secondary" />
              Watch All Founder Stories
            </Button>
          </div>
        </div>
      </section> */}

      {/* 12. Testimonials */}
      <section className="py-14 bg-[#FCFBF8]">
        <div className="container px-4 text-center">
          <h2 className="text-4xl font-serif font-bold text-primary mb-4 relative inline-block">
            What Our Students Say
            <span className="absolute -bottom-2 left-1/4 right-1/4 h-1 bg-secondary rounded-full" />
          </h2>
          <p className="text-foreground mt-6 mb-10 max-w-2xl mx-auto">
            Hear from parents and students who have experienced the Rabbi Global
            Academy transformation firsthand.
          </p>

          <Carousel
            className="max-w-6xl mx-auto mb-6"
            opts={{ align: "start", loop: true }}
          >
            <CarouselContent className="-ml-4">
              {[
                {
                  name: "Priya Sharma",
                  role: "Parent of Arjun, Class 4",
                  quote:
                    "Since joining the foundation level, Arjun's concentration has improved drastically. He no longer fears math; he treats calculations like a fun game. The teachers are incredibly supportive.",
                },
                {
                  name: "Rahul Desai",
                  role: "Student, Level 6",
                  quote:
                    "I can now calculate large numbers faster than my friends can type them into a calculator. The Image Flash exercises are my favorite part of the class. It feels like magic.",
                },
                {
                  name: "Dr. Ananya Reddy",
                  role: "Parent of Diya, Class 7",
                  quote:
                    "The structured approach and the 1:12 ratio ensure that every child gets attention. Diya's overall academic performance has improved because her memory retention is so much better now.",
                },
              ].map((test, i) => (
                <CarouselItem
                  key={i}
                  className="pl-4 md:basis-1/2 lg:basis-1/3"
                >
                  <Card className="bg-white border-none shadow-lg h-full rounded-3xl p-8 text-left">
                    <div className="flex gap-1 text-secondary mb-6">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="w-5 h-5 fill-secondary" />
                      ))}
                    </div>
                    <p className="text-primary/80 italic mb-8 leading-relaxed">
                      "{test.quote}"
                    </p>
                    <div className="flex items-center gap-4 mt-auto">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-lg">
                        {test.name.charAt(0)}
                      </div>
                      <div>
                        <h5 className="font-bold text-primary">{test.name}</h5>
                        <p className="text-sm text-foreground">
                          {test.role}
                        </p>
                      </div>
                    </div>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex justify-center gap-4 mt-8">
              <CarouselPrevious className="position-static transform-none" />
              <CarouselNext className="position-static transform-none" />
            </div>
          </Carousel>

        </div>
      </section>

      {/* 13. Franchise Opportunity */}
      {/* <section className="py-24 bg-background">
        <div className="container px-4">
          <Card className="bg-primary overflow-hidden rounded-[3rem] border-none shadow-2xl">
            <div className="grid lg:grid-cols-2">
              <div className="p-12 md:p-16 flex flex-col justify-center">
                <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-6">
                  Rabbi Global Academy Franchise Opportunity
                </h2>
                <p className="text-white text-lg mb-8 leading-relaxed">
                  Join our growing network of 40+ successful centers across India. Benefit from our proven curriculum, comprehensive training systems, strong brand presence, and continuous operational support to build a profitable educational enterprise.
                </p>
                <Link to="/franchises" className="inline-flex items-center text-secondary font-bold text-lg hover:text-white transition-colors w-fit">
                  Become a Partner <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </div>
              <div className="bg-white/5 relative min-h-[300px]">
                <img src="/images/franchise-hero-new.webp" alt="Franchise growth" className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" />
              </div>
            </div>
          </Card>
        </div>
      </section> */}

      {/* 14. FAQ */}
      <section className="py-24 bg-background border-t border-border/50">
        <div className="container px-4 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-4 relative inline-block">
              Common Questions from Parents
              <span className="absolute -bottom-2 left-1/4 right-1/4 h-1 bg-secondary rounded-full" />
            </h2>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {[
              {
                q: "What age is best to start the Abacus program?",
                a: "The ideal age to begin abacus learning is between 4 and 7 years old, which is covered by our Foundation level. During these formative years, the brain rapidly develops neural pathways, making it the perfect time to introduce visual and motor-skill based learning.",
              },
              {
                q: "How long is each level and the full program?",
                a: "Our structured program consists of 8 levels. Each level is designed to take exactly 20 weeks to complete, with 2 hours of class time per week. The entire journey typically spans about 2 to 2.5 years.",
              },
              {
                q: "Are classes online, offline, or both?",
                a: "We offer a hybrid delivery model. You can choose to enroll your child in traditional classroom sessions at any of our 50+ centers, or opt for interactive online classes, both maintaining the same high standards and curriculum.",
              },
              {
                q: "How is Rabbi Global Academy different from other abacus institutes?",
                a: "With 17+ years of excellence, our curriculum goes beyond rote learning. We focus on whole-brain development integrating activities like Image Flash, speed writing, and listening exercises, maintaining a strict 1:12 teacher-to-student ratio.",
              },
              {
                q: "Will my child receive certificates?",
                a: "Yes, students are awarded level-wise certificates upon successfully passing the assessment at the end of each 20-week level. These certificates are globally recognized and can be verified online.",
              },
              {
                q: "What is the teacher-to-student ratio?",
                a: "We maintain a strict teacher-to-student ratio of 1:12 in all our classes. This ensures that every child receives personalized attention, guidance, and support from our certified trainers.",
              },
              {
                q: "Do you offer franchise opportunities?",
                a: "Yes! We are actively expanding across India and beyond. We offer a comprehensive franchise model with training, curriculum access, and operational support. Visit our 'Our Franchises' page to learn more.",
              },
            ].map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="bg-white px-6 rounded-2xl mb-4 border border-border shadow-sm"
              >
                <AccordionTrigger className="text-left font-bold text-primary text-lg hover:no-underline py-6">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-foreground text-base leading-relaxed pb-6">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <VideoModal isOpen={videoOpen} onClose={() => setVideoOpen(false)} />
    </AppLayout>
  );
}
