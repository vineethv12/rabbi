import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/shared/AppLayout";
import { Seo } from "@/components/shared/Seo";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlayCircle, Clock, BarChart, Sparkles, Star, ArrowRight, BookOpen, Brain, Zap, GraduationCap } from "lucide-react";

const FALLBACK_VIDEOS = [
  { id: "B4ppDOLLSM0", title: "Abacus Foundation — Getting Started",          level: "Beginner" },
  { id: "4U7qjnY72gw", title: "Mental Arithmetic — Speed Addition Techniques", level: "Intermediate" },
  { id: "HaycltqYvYM", title: "Advanced Bead Calculation Mastery",             level: "Advanced" },
  { id: "CBi_ad7mAvo", title: "Vedic Mathematics Shortcuts for Kids",          level: "Vedic Math" },
  { id: "VzCiRwcAAvI", title: "Concentration & Visualization Exercises",       level: "Tips & Tricks" },
  { id: "AuWd3YNqSu8", title: "Speed Writing & Number Recognition Practice",   level: "Beginner" },
];

const levelBadgeColor = {
  "Beginner":     "bg-sky-100 text-sky-700",
  "Intermediate": "bg-amber-100 text-amber-700",
  "Advanced":     "bg-violet-100 text-violet-700",
  "Vedic Math":   "bg-rose-100 text-rose-700",
  "Tips & Tricks":"bg-lime-100 text-lime-700",
};

const featured = [
  { icon: BookOpen, label: "Abacus fundamentals" },
  { icon: Brain,    label: "Mental arithmetic shortcuts" },
  { icon: Zap,      label: "Speed-building practice" },
  { icon: GraduationCap, label: "Expert-led lessons" },
];

export function LearnAbacus() {
  const [playingId, setPlayingId] = useState(null);
  const [videos, setVideos] = useState(FALLBACK_VIDEOS);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/videos.php")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (cancelled || !Array.isArray(data)) return;
        const mapped = data
          .filter((v) => v.youtube_id)
          .map((v) => ({ id: v.youtube_id, title: v.title, level: v.level }));
        if (mapped.length > 0) setVideos(mapped);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return (
    <AppLayout>
      <Seo
        title="Learn Abacus — Free Video Masterclasses"
        description="Watch free Abacus masterclasses and level-wise video tutorials from Rabbi Global Academy. Learn mental arithmetic step by step, from beginner to advanced."
        path="/learn-abacus"
      />
      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden text-white"
        style={{ background: "linear-gradient(135deg, #142d50 0%, #0f2745 55%, #173861 100%)" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.08),_transparent_40%)]" />
        <div className="absolute -left-12 top-10 w-72 h-72 rounded-full bg-secondary/15 blur-3xl pointer-events-none" />
        <div className="absolute right-0 bottom-0 w-80 h-80 rounded-full bg-sky-300/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-1 left-0 w-full overflow-hidden leading-none pointer-events-none">
          <svg viewBox="0 0 1200 80" preserveAspectRatio="none" className="w-full h-16 fill-background">
            <path d="M0,80 C300,0 900,80 1200,0 L1200,80 Z" />
          </svg>
        </div>

        <div className="container px-4 relative z-10 max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

            {/* Left — text */}
            <div className="py-12 sm:py-16 lg:py-20">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-5 py-2 text-secondary text-xs font-bold uppercase tracking-[0.3em] backdrop-blur-sm mb-6">
                <Sparkles className="h-3.5 w-3.5" /> Video Learning Hub
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold mb-5 leading-tight">
                Learn Abacus from<br />
                <span className="text-secondary">the Masters</span>
              </h1>
              <p className="text-base sm:text-lg text-white leading-relaxed max-w-lg mb-7">
                Free tutorials, tips, and techniques directly from our expert instructors — from bead basics to competition-level mental math.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-7">
                {featured.map((f) => (
                  <div key={f.label} className="flex items-center gap-2.5 bg-white/10 border border-white/10 rounded-2xl px-4 py-3 backdrop-blur-sm">
                    <f.icon className="h-4 w-4 text-secondary flex-shrink-0" />
                    <span className="text-sm text-white">{f.label}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3 text-white shadow-xl w-fit">
                <Star className="h-5 w-5 text-secondary flex-shrink-0" />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-secondary font-bold">Featured Masterclass</p>
                  <p className="text-sm font-semibold">10× Faster Mental Calculation</p>
                </div>
              </div>
            </div>

            {/* Right — illustration */}
            <div className="relative flex items-center justify-center h-[300px] lg:h-[560px]">
              <div className="absolute inset-0 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(ellipse at center, rgba(201,162,75,0.12) 0%, rgba(100,160,255,0.07) 50%, transparent 72%)" }} />
              <picture>
                <source srcSet="/images/learn-abacus-hero.webp" type="image/webp" />
                <img
                  src="/images/learn-abacus-hero.png"
                  alt="Child learning abacus with mental math visualization"
                  className="relative z-10 object-contain"
                  style={{
                    width: "110%",
                    maxWidth: "none",
                    height: "100%",
                    filter: "drop-shadow(0 0 40px rgba(201,162,75,0.2))",
                  }}
                  loading="eager"
                  fetchpriority="high"
                  decoding="async"
                />
              </picture>
            </div>

          </div>
        </div>
      </section>

      {/* ── Our Methodology ── */}
      <section
        className="py-16 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #FEFCF5 0%, #FAF6EA 50%, #FEFCF5 100%)" }}
      >
        <div className="absolute top-6 right-6 opacity-15 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, #C9A84C 1px, transparent 1px)", backgroundSize: "20px 20px", width: 200, height: 200 }} />
        <div className="absolute bottom-6 left-6 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, #C9A84C 1px, transparent 1px)", backgroundSize: "20px 20px", width: 160, height: 160 }} />

        <div className="container px-4 relative z-10">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="h-px w-12 bg-secondary/50 rounded-full" />
              <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-secondary">Our Methodology</span>
              <span className="h-px w-12 bg-secondary/50 rounded-full" />
            </div>
            <h3 className="text-4xl md:text-[2.75rem] font-serif font-bold text-primary mb-4 leading-tight">A Structured 8-Level Journey</h3>
            <div className="flex items-center justify-center gap-2">
              <span className="h-px w-16 bg-secondary/40 rounded-full" />
              <svg width="10" height="10" viewBox="0 0 10 10" fill="#C9A84C"><polygon points="5,0 10,5 5,10 0,5" /></svg>
              <span className="h-px w-16 bg-secondary/40 rounded-full" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { img: "/images/foundation.webp", title: "Foundation", levels: "Levels 0, 1 & 2", duration: "24 Weeks", desc: "Introduction to numbers, basic bead movement, and developing finger dexterity." },
              { img: "/images/Intermediate.webp", title: "Intermediate", levels: "Levels 3, 4 & 5", duration: "24 Weeks", desc: "Mental arithmetic visualization, speed building, and complex addition/subtraction." },
              { img: "/images/Advanced.webp", title: "Advanced", levels: "Levels 6, 7 & 8", duration: "24 Weeks", desc: "Mastery over multiplication, division, decimals, and rapid mental calculations." },
            ].map((level, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 border-2 border-secondary/50 hover:border-secondary flex flex-col items-center text-center overflow-hidden">
                <div className="w-full aspect-[3/4] overflow-hidden">
                  <img src={level.img} alt={level.title} className="w-full h-full object-cover object-center" loading="lazy" decoding="async" />
                </div>
                <div className="px-7 py-6 flex flex-col items-center w-full">
                <h4 className="text-[1.5rem] font-serif font-bold text-primary mb-1">{level.title}</h4>
                <p className="text-secondary font-semibold text-[15px] mb-1">{level.levels}</p>
                <div className="flex items-center justify-center gap-1.5 mb-5">
                  <span className="h-px w-8 bg-secondary/30 rounded-full" />
                  <span className="w-1 h-1 rounded-full bg-secondary/60" />
                  <span className="h-px w-8 bg-secondary/30 rounded-full" />
                </div>
                <div className="flex justify-center gap-3 mb-5">
                  <span className="inline-flex items-center gap-1.5 bg-gray-100 text-primary/60 text-[12px] font-medium px-3 py-1 rounded-full">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    {level.duration}
                  </span>
                </div>
                <p className="text-primary/50 text-[14px] leading-relaxed mb-6 flex-1">{level.desc}</p>
                <Link to="/courses" className="inline-flex items-center text-primary font-semibold text-[14px] hover:text-secondary transition-colors group border-b-2 border-secondary pb-0.5">
                  View Curriculum <ArrowRight className="ml-1.5 w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Course Structure ── */}
      <section
        className="py-14 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #FEFCF5 0%, #FAF6EA 50%, #FEFCF5 100%)" }}
      >
        <div className="absolute top-6 right-6 opacity-15 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, #C9A84C 1px, transparent 1px)", backgroundSize: "20px 20px", width: 180, height: 180 }} />
        <div className="container px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 xl:gap-16 items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
                  <rect x="4" y="16" width="40" height="26" rx="3" fill="#C9A84C" fillOpacity="0.18" stroke="#C9A84C" strokeWidth="2" />
                  <line x1="4" y1="24" x2="44" y2="24" stroke="#C9A84C" strokeWidth="1.5" />
                  <circle cx="12" cy="20" r="2" fill="#C9A84C" />
                  <circle cx="24" cy="20" r="2" fill="#C9A84C" />
                  <circle cx="36" cy="20" r="2" fill="#C9A84C" />
                  <circle cx="12" cy="30" r="2" fill="#0A2240" fillOpacity="0.5" />
                  <circle cx="24" cy="30" r="2" fill="#0A2240" fillOpacity="0.5" />
                  <circle cx="36" cy="30" r="2" fill="#0A2240" fillOpacity="0.5" />
                  <circle cx="12" cy="36" r="2" fill="#0A2240" fillOpacity="0.5" />
                  <circle cx="24" cy="36" r="2" fill="#0A2240" fillOpacity="0.5" />
                </svg>
              </div>
              <h2 className="text-4xl md:text-[2.6rem] font-serif font-bold text-primary mb-3 leading-tight">Course Structure</h2>
              <div className="w-14 h-1 bg-secondary rounded-full mb-8" />
              <ul className="space-y-5">
                {[
                  { img: "/images/course/thumb-weeks.webp", text: <>Designed for exactly <span className="text-secondary font-bold">20 weeks</span> per level</> },
                  { img: "/images/course/thumb-hours.webp", text: <>Weekly <span className="text-secondary font-bold">2 hours</span> per session for optimal retention</> },
                  { img: "/images/course/thumb-ratio.webp", text: <>Strict teacher-to-student ratio of <span className="text-secondary font-bold">1:12</span></> },
                  { img: "/images/course/thumb-cert.webp", text: <>Awarded level-wise <span className="text-secondary font-bold">certificates</span> upon completion</> },
                  { img: "/images/course/thumb-verify.webp", text: <>Certificates globally <span className="text-secondary font-bold">verifiable</span> online</> },
                  { img: "/images/course/thumb-hybrid.webp", text: <><span className="text-secondary font-bold">Hybrid delivery</span> combining online and classroom modes</> },
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl shrink-0 overflow-hidden shadow-sm border border-secondary/15" style={{ background: "linear-gradient(135deg, #FDF6DC 0%, #F5E8AA 80%)" }}>
                      <img src={item.img} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <span className="text-[19px] text-primary/90 font-semibold leading-snug">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { img: "/images/12weeks_level.webp", label: "20 Weeks / Level", pos: "object-top" },
                { img: "/images/15ratio.webp", label: "1:12 Ratio", pos: "object-top" },
                { img: "/images/levels_certificates.webp", label: "Level Certificates", pos: "object-center" },
                { img: "/images/online+offline.webp", label: "Online + Offline", pos: "object-center" },
              ].map((tile, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-2 border-secondary/25 hover:border-secondary/50 overflow-hidden flex flex-col items-center text-center pb-5">
                  <div className="w-full aspect-[4/3] overflow-hidden">
                    <img src={tile.img} alt={tile.label} className={`w-full h-full object-cover ${tile.pos}`} loading="lazy" decoding="async" />
                  </div>
                  <div className="flex items-center justify-center gap-1.5 mt-4 mb-2">
                    <span className="h-px w-6 bg-secondary/30 rounded-full" />
                    <svg width="8" height="8" viewBox="0 0 10 10" fill="#C9A84C"><polygon points="5,0 10,5 5,10 0,5" /></svg>
                    <span className="h-px w-6 bg-secondary/30 rounded-full" />
                  </div>
                  <p className="text-[15px] font-bold text-primary px-3">{tile.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Activities in Class ── */}
      <section
        className="py-14 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #FEFCF5 0%, #FAF6EA 50%, #FEFCF5 100%)" }}
      >
        <div className="absolute bottom-6 left-6 opacity-15 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, #C9A84C 1px, transparent 1px)", backgroundSize: "20px 20px", width: 160, height: 160 }} />
        <div className="container px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 xl:gap-16 items-start">
            <div className="order-2 lg:order-1 grid grid-cols-2 gap-4">
              {[
                { img: "/images/image_flash.webp", label: "Image Flash", pos: "object-top" },
                { img: "/images/speed_writing.webp", label: "Speed Writing", pos: "object-center" },
                { img: "/images/speed_math.webp", label: "Speed Math", pos: "object-center" },
                { img: "/images/listening_exercises.webp", label: "Listening Exercises", pos: "object-top" },
              ].map((tile, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col border-2 border-secondary/25 hover:border-secondary/50">
                  <div className="w-full aspect-[4/3] overflow-hidden">
                    <img src={tile.img} alt={tile.label} className={`w-full h-full object-cover ${tile.pos}`} loading="lazy" decoding="async" />
                  </div>
                  <div className="py-4 px-3 text-center">
                    <p className="font-bold text-primary text-[15px] leading-tight">{tile.label}</p>
                    <div className="flex items-center justify-center gap-1.5 mt-2">
                      <span className="h-px w-6 bg-secondary/40 rounded-full" />
                      <svg width="7" height="7" viewBox="0 0 10 10" fill="#C9A84C"><polygon points="5,0 10,5 5,10 0,5" /></svg>
                      <span className="h-px w-6 bg-secondary/40 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-4xl md:text-[2.6rem] font-serif font-bold text-primary mb-3 leading-tight">Activities in Class</h2>
              <div className="w-14 h-1 bg-secondary rounded-full mb-3" />
              <div className="flex items-center gap-1.5 mb-8">
                <svg width="8" height="8" viewBox="0 0 10 10" fill="#C9A84C"><polygon points="5,0 10,5 5,10 0,5" /></svg>
                <svg width="8" height="8" viewBox="0 0 10 10" fill="#C9A84C" opacity="0.5"><polygon points="5,0 10,5 5,10 0,5" /></svg>
              </div>
              <ol className="space-y-5">
                {[
                  { text: "100% practical, hands-on sessions", img: "/images/activity_hands_on.webp" },
                  { text: "Timed speed-writing exercises to boost motor skills", img: "/images/activity_speed_writing.webp" },
                  { text: "Image Flash — identifying and calling out visualized numbers", img: "/images/activity_image_flash.webp" },
                  { text: "Timed exercises using the physical student abacus", img: "/images/activity_timed_abacus.webp" },
                  { text: "Oral Sums — rapid verbal arithmetic with the tutor", img: "/images/activity_oral_sums.webp" },
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0 text-white font-bold text-sm shadow-md">{i + 1}</div>
                    <span className="flex-1 text-[17px] text-primary/85 font-semibold leading-snug">{item.text}</span>
                    <div className="shrink-0 w-16 h-16 rounded-xl overflow-hidden shadow-sm border-2 border-secondary/25">
                      <img src={item.img} alt="" className="w-full h-full object-cover object-center" loading="lazy" />
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      {/* ── Video Library ── */}
      <section
        className="relative py-24 overflow-hidden"
        style={{ background: "linear-gradient(160deg, #fffdf8 0%, #f7f8ff 100%)" }}
      >
        <div className="absolute -right-20 top-0 w-80 h-80 rounded-full bg-amber-200/25 blur-3xl pointer-events-none" />
        <div className="absolute left-0 bottom-0 w-72 h-72 rounded-full bg-sky-200/25 blur-3xl pointer-events-none" />

        <div className="container px-4 max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-white border border-amber-200 rounded-full px-5 py-2.5 text-amber-700 text-xs font-bold uppercase tracking-[0.3em] shadow-sm mb-5">
              <PlayCircle className="h-3.5 w-3.5" /> Featured Lessons
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-primary mb-4 leading-tight">
              Watch, Practice, <span className="text-secondary">Improve</span>
            </h2>
            <p className="text-foreground max-w-2xl mx-auto leading-relaxed">
              Browse bite-sized lessons for every level, from beginner bead handling to advanced mental math competition prep.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {videos.map((vid, i) => {
              const isPlaying = playingId === vid.id;
              return (
                <div
                  key={i}
                  className="group rounded-[1.75rem] border border-border/60 bg-white shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden"
                >
                  {/* Thumbnail or Embed */}
                  <div className="aspect-video relative overflow-hidden bg-black">
                    {isPlaying ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${vid.id}?autoplay=1&rel=0`}
                        title={vid.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                      />
                    ) : (
                      <>
                        <img
                          src={`https://img.youtube.com/vi/${vid.id}/hqdefault.jpg`}
                          alt={vid.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors duration-300" />
                        <button
                          onClick={() => setPlayingId(vid.id)}
                          className="absolute inset-0 flex items-center justify-center"
                          aria-label={`Play ${vid.title}`}
                        >
                          <div className="w-16 h-16 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:bg-white transition-all duration-300 border border-white/60">
                            <svg viewBox="0 0 24 24" className="w-7 h-7 text-primary fill-primary ml-1" xmlns="http://www.w3.org/2000/svg">
                              <polygon points="5,3 19,12 5,21" />
                            </svg>
                          </div>
                        </button>
                      </>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="mb-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${levelBadgeColor[vid.level] ?? "bg-muted text-foreground"}`}>
                        {vid.level}
                      </span>
                    </div>
                    <h4 className="font-bold text-primary mb-1.5 line-clamp-2 leading-snug group-hover:text-secondary transition-colors duration-200">{vid.title}</h4>
                    <p className="text-xs text-secondary font-semibold flex items-center gap-1 mt-2">
                      Rabbi Global Academy <ArrowRight className="w-3 h-3" />
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-14 text-center">
            <a href="https://www.youtube.com/@RabbiGlobalAcademy" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="rounded-full px-8 h-12 font-semibold hover:bg-primary hover:text-white transition-colors">
                Load More Lessons <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      </section>

    </AppLayout>
  );
}
