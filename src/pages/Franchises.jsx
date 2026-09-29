import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AppLayout } from "@/components/shared/AppLayout";
import { Seo } from "@/components/shared/Seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ShieldCheck, BookOpen, TrendingUp, Users, Search, MapPin,
  Sparkles, BadgeCheck, ArrowRight, Star, Handshake, Rocket, FileSignature, PartyPopper,
  CheckCircle, Loader2, AlertCircle
} from "lucide-react";
import { useEnrollModal } from "@/contexts/EnrollModalContext";

const FALLBACK_CENTERS = [
  { head: "Mrs. Thanuja K J",      academy: "Thanuja Abacus Academy",  area: "HSR Layout",               city: "Bengaluru",  photo: "/images/franchises/f-04-stephen.webp" },
  { head: "Mrs. Dhanalakshmi",    academy: "Tattva Academy",                area: "Krishnarajapuram",           city: "Bengaluru",  photo: "/images/franchises/f-17-extra.webp" },
  { head: "Mrs. Monisha T",       academy: "Yana Academy",                  area: "Sahakar Nagar",              city: "Bengaluru",  photo: "/images/franchises/f-13-ganesh.webp" },
  { head: "Mr. Stephen",          academy: "Indian Abacus, Kalyan Nagar",   area: "HRBR Layout",                city: "Bengaluru",  photo: "/images/franchises/f-14-pavithra.webp" },
  { head: "Mrs. Varalakshmi",     academy: "V J Educare",                   area: "Nijalingappa Layout",        city: "Davangere",  photo: "/images/franchises/f-05-varalakshmi.webp" },
  { head: "Ms. Arshiya Kowser",   academy: "Indian Abacus Centre",          area: "Shivakumar Swamy Layout",    city: "Davangere",  photo: "/images/franchises/f-06-arshiya.webp" },
  { head: "Mrs. Vidhyaa Venkat",  academy: "Vidhyaa's Educational Academy", area: "Hoodi, Krishnarajapuram",    city: "Bengaluru",  photo: "/images/franchises/vidhyaa-venkat.webp" },
  { head: "Mr. V Chandrashekhar", academy: "Hems QA Learnings",             area: "Gayathri Nagar",             city: "Bengaluru",  photo: "/images/franchises/f-15-kishore.webp" },
  { head: "Mrs. Afshan Anjum",    academy: "S U Educational Academy",       area: "Kaveri Nagar",               city: "Bengaluru",  photo: "/images/franchises/f-02-dhanalakshmi.webp" },
  { head: "Mr. Srinivasa Gupta",  academy: "Indian Abacus Centre",          area: "New Town Yelahanka",         city: "Bengaluru",  photo: "/images/franchises/f-08-chandrashekhar.webp" },
  { head: "Mrs. Shruthi M",       academy: "Indian Abacus Centre",          area: "B T M Layout",               city: "Bengaluru",  photo: "/images/franchises/f-09-afshan.webp" },
  { head: "Ms. Priya Merline",    academy: "Maverick Academy",              area: "Bannerghatta",               city: "Bengaluru",  photo: "/images/franchises/f-03-monisha.webp" },
  { head: "Mr. Ganesh Rao J",     academy: "Shri Govardhan Academy",        area: "Dinnur Main Road",           city: "Bengaluru",  photo: "/images/franchises/f-10-srinivasa.webp" },
  { head: "Mrs. Pavithra K",      academy: "Purna Academy",                 area: "M S Palya",                  city: "Bengaluru",  photo: "/images/franchises/f-11-shruthi.webp" },
  { head: "Mr. Kishore A",        academy: "Sanskriti Academy",             area: "Thindlu",                    city: "Bengaluru",  photo: "/images/franchises/f-12-priya.webp" },
  { head: "Mrs. Kavitha R",       academy: "Akshar EHPS",                   area: "TC Layout",                  city: "Davangere",  photo: "/images/franchises/f-01-thanuja.webp" },
];

const reasons = [
  { icon: BookOpen,   bg: "bg-sky-100",    iconColor: "text-sky-700",    title: "Proven Curriculum",     desc: "17+ years of refined, result-oriented syllabus that parents across Karnataka trust." },
  { icon: Users,      bg: "bg-emerald-100",iconColor: "text-emerald-700", title: "Extensive Training",    desc: "Complete teacher training, admin support, and a dedicated academic coordinator for your center." },
  { icon: ShieldCheck,bg: "bg-violet-100", iconColor: "text-violet-700", title: "Brand Strength",        desc: "Leverage an established brand with a network of 40+ successful centers and ISO certification." },
  { icon: TrendingUp, bg: "bg-amber-100",  iconColor: "text-amber-700",  title: "High ROI",              desc: "A low-risk model designed for quick breakeven, stable recurring revenue, and sustainable growth." },
];

const steps = [
  { step: 1, icon: Handshake,      title: "Inquire",  desc: "Submit the franchise inquiry form with your details." },
  { step: 2, icon: Users,          title: "Meet",     desc: "Discussion and Q&A with our expansion team." },
  { step: 3, icon: FileSignature,  title: "Sign",     desc: "Finalise location, territory, and agreement." },
  { step: 4, icon: PartyPopper,    title: "Launch",   desc: "Training, marketing support, and grand inauguration." },
];

const FRANCHISE_EMPTY = { name: "", phone: "", city: "", investment: "", message: "" };

export function Franchises() {
  const { openEnrollModal } = useEnrollModal();
  const location = useLocation();
  const [fForm, setFForm] = useState(FRANCHISE_EMPTY);
  const [fStatus, setFStatus] = useState("idle");
  const [fErrorMsg, setFErrorMsg] = useState("");
  const [centers, setCenters] = useState(FALLBACK_CENTERS);

  const fSet = (field) => (e) => setFForm((f) => ({ ...f, [field]: e.target.value }));

  const handleFranchiseSubmit = async (e) => {
    e.preventDefault();
    if (!fForm.name.trim() || !fForm.phone.trim()) {
      setFErrorMsg("Please fill in your name and phone number.");
      setFStatus("error");
      return;
    }
    setFStatus("loading");
    setFErrorMsg("");
    try {
      const res = await fetch("/api/contact.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fForm.name,
          phone: fForm.phone,
          city: fForm.city,
          program: "franchise",
          message: fForm.investment ? `Investment Capacity: ${fForm.investment}\n\n${fForm.message}` : fForm.message,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFStatus("success");
        setFForm(FRANCHISE_EMPTY);
      } else {
        setFErrorMsg(data.error || "Something went wrong. Please try again.");
        setFStatus("error");
      }
    } catch {
      setFErrorMsg("Network error. Please try again.");
      setFStatus("error");
    }
  };

  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.replace('#', ''));
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [location.hash]);

  useEffect(() => {
    let active = true;
    fetch("/api/franchises.php")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        if (active && Array.isArray(data)) setCenters(data);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  return (
    <AppLayout>
      <Seo
        title="Franchise Opportunity"
        description="Start your own Abacus and Vedic Maths center with Rabbi Global Academy. Proven business model, full training and support, and a network of 40+ centers."
        path="/franchises"
      />
      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden text-white"
        style={{ background: "linear-gradient(135deg, #142d50 0%, #0f2745 55%, #173861 100%)" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.08),_transparent_40%)]" />
        <div className="absolute -left-16 top-10 w-72 h-72 rounded-full bg-secondary/15 blur-3xl pointer-events-none" />
        <div className="absolute right-0 bottom-0 w-80 h-80 rounded-full bg-sky-300/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-1 left-0 w-full overflow-hidden leading-none pointer-events-none">
          <svg viewBox="0 0 1200 80" preserveAspectRatio="none" className="w-full h-16 fill-background">
            <path d="M0,80 C300,0 900,80 1200,0 L1200,80 Z" />
          </svg>
        </div>

        <div className="container px-4 relative z-10 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

            {/* Left — text content, padded top/bottom */}
            <div className="py-12 sm:py-16 lg:py-20">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-2 text-secondary text-xs font-semibold uppercase tracking-widest backdrop-blur-sm mb-5">
                <Rocket className="h-3.5 w-3.5" /> Franchise Opportunity
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold mb-5 leading-tight">
                Build a Legacy<br />
                <span className="text-secondary">in Education</span>
              </h1>
              <p className="text-base sm:text-lg text-white leading-relaxed max-w-lg mb-7">
                Partner with Rabbi Global Academy to start a profitable, respected, and impact-driven education business in your city with our proven franchise model.
              </p>
              <div className="flex flex-col gap-3 mb-8">
                <div className="flex flex-wrap gap-3">
                  {["Low Investment", "High ROI", "50+ Centers"].map(f => (
                    <div key={f} className="flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-5 py-2.5 text-white text-base font-semibold backdrop-blur-sm">
                      <BadgeCheck className="h-5 w-5 text-secondary flex-shrink-0" /> {f}
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  {["Full Training", "ISO Certified"].map(f => (
                    <div key={f} className="flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-5 py-2.5 text-white text-base font-semibold backdrop-blur-sm">
                      <BadgeCheck className="h-5 w-5 text-secondary flex-shrink-0" /> {f}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-4 items-center">
                <Button
                   onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full px-8 h-12 text-base font-semibold shadow-xl shadow-secondary/20 w-full sm:w-auto"
                >
                  Apply for Franchise <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3 text-white shadow-xl">
                  <Star className="h-5 w-5 text-secondary flex-shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-secondary font-bold">Join Our Network</p>
                    <p className="text-sm font-semibold">40+ Centers Across Karnataka</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — illustration, fully contained & centered */}
            <div className="relative flex items-end justify-center overflow-hidden h-[280px] lg:h-[520px]">
              {/* Radial glow */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[480px] h-[480px] rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(201,162,75,0.22) 0%, rgba(100,160,255,0.10) 50%, transparent 72%)" }} />
              {/* Decorative floaters */}
              <div className="absolute top-8 right-4 text-secondary/35 text-4xl font-black select-none animate-float">✦</div>
              <div className="absolute top-16 left-6 text-white/15 text-3xl font-black select-none animate-float-delayed">🎓</div>
              <div className="absolute bottom-32 right-2 text-sky-300/25 text-3xl font-black select-none animate-float-slow">✦</div>
              <div className="absolute bottom-20 left-4 text-secondary/20 text-2xl font-black select-none animate-float">★</div>
              {/* Illustration — 3:4 portrait, fills full container height */}
              <img
                src="/images/franchise-hero-new.png"
                alt="Franchise partnership illustration"
                className="relative z-10 h-full w-auto max-w-full object-contain object-bottom drop-shadow-[0_24px_70px_rgba(0,0,0,0.45)]"
                loading="eager"
                fetchpriority="high"
                decoding="async"
              />
            </div>

          </div>
        </div>
      </section>

      {/* ── Inquiry Form + Steps ── */}
      <section
        id="how-it-works"
        className="relative py-24 overflow-hidden"
        style={{ background: "linear-gradient(180deg, #f0f4ff 0%, #fff8f0 100%)" }}
      >
        <div className="container px-4 max-w-6xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-[1fr_0.85fr] gap-10 lg:gap-12 items-start">
            {/* Steps */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white border border-violet-200 rounded-full px-5 py-2.5 text-violet-600 text-xs font-bold uppercase tracking-[0.3em] shadow-sm mb-6">
                <Rocket className="h-3.5 w-3.5 text-secondary" /> How It Works
              </div>
              <h2 className="text-4xl font-serif font-bold text-primary mb-3 leading-tight">
                Four Steps to<br /><span className="text-secondary">Launch Your Center</span>
              </h2>
              <p className="text-foreground mb-10 leading-relaxed">From first inquiry to grand opening, our team guides you every step of the way.</p>

              <div className="space-y-5">
                {steps.map((s, idx) => (
                  <div key={s.step} className="flex items-start gap-5 group">
                    <div className="relative flex-shrink-0">
                      <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                        <s.icon className="h-6 w-6 text-secondary" />
                      </div>
                      {idx < steps.length - 1 && (
                        <div className="absolute left-1/2 top-14 bottom-0 w-0.5 h-5 bg-border -translate-x-1/2 mt-0.5" />
                      )}
                    </div>
                    <div className="pt-1">
                      <div className="text-[11px] font-black text-secondary uppercase tracking-widest mb-0.5">Step {s.step}</div>
                      <h4 className="font-serif font-bold text-xl text-primary mb-1">{s.title}</h4>
                      <p className="text-sm text-foreground">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inquiry Form */}
            <div className="rounded-[2rem] border border-border/60 bg-white shadow-xl overflow-hidden">
              <div className="bg-primary px-8 py-6">
                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-3 py-1.5 text-secondary text-xs font-semibold mb-3">
                  <Handshake className="h-3.5 w-3.5" /> Franchise Inquiry
                </div>
                <h3 className="text-2xl font-serif font-bold text-white">Apply for Franchise</h3>
                <p className="text-white text-sm mt-1">We'll get back to you within 24 hours.</p>
              </div>
              {fStatus === "success" ? (
                <div className="p-8 flex flex-col items-center justify-center py-14 text-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                  <h3 className="text-xl font-serif font-bold text-primary">Inquiry Received!</h3>
                  <p className="text-muted-foreground text-sm max-w-xs">
                    Our franchise team will reach out to you within 24 hours.
                  </p>
                  <Button onClick={() => setFStatus("idle")} variant="outline" className="mt-2 rounded-full px-8">
                    Submit Another
                  </Button>
                </div>
              ) : (
                <form className="p-8 space-y-5" onSubmit={handleFranchiseSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="fname">Full Name <span className="text-red-500">*</span></Label>
                    <Input id="fname" className="h-11 bg-muted/40" placeholder="Enter your name" value={fForm.name} onChange={fSet("name")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fphone">Phone Number <span className="text-red-500">*</span></Label>
                    <Input id="fphone" className="h-11 bg-muted/40" placeholder="+91 98765 43210" value={fForm.phone} onChange={fSet("phone")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fcity">Target City / Area</Label>
                    <Input id="fcity" className="h-11 bg-muted/40" placeholder="Where do you want to open?" value={fForm.city} onChange={fSet("city")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="finvestment">Investment Capacity</Label>
                    <Select value={fForm.investment} onValueChange={(val) => setFForm((f) => ({ ...f, investment: val }))}>
                      <SelectTrigger className="h-11 bg-muted/40">
                        <SelectValue placeholder="Select range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="60k-75k">₹60,000 – ₹75,000</SelectItem>
                        <SelectItem value="75k-1l">₹75,000 – ₹1 Lakh</SelectItem>
                        <SelectItem value="1l+">Above ₹1 Lakh</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {fStatus === "error" && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      {fErrorMsg}
                    </div>
                  )}
                  <Button type="submit" disabled={fStatus === "loading"} className="w-full bg-primary hover:bg-primary/90 text-white h-12 font-semibold rounded-xl text-base mt-2 disabled:opacity-70">
                    {fStatus === "loading" ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending…</>
                    ) : (
                      <>Submit Inquiry <ArrowRight className="h-4 w-4 ml-2" /></>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Centers Directory ── */}
      <section className="relative py-24 overflow-hidden" style={{ background: "linear-gradient(160deg, #fdf8ee 0%, #faf4e8 50%, #fdf9f0 100%)" }}>
        {/* Subtle gold dot texture */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.15]" style={{ backgroundImage: "radial-gradient(circle at 1.5px 1.5px, #c9a84c 1px, transparent 0)", backgroundSize: "36px 36px" }} />

        <div className="container px-4 max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-white border border-secondary/40 rounded-full px-5 py-2.5 text-secondary text-xs font-bold uppercase tracking-[0.3em] shadow-sm mb-5">
              <MapPin className="h-3.5 w-3.5" /> Our Network
            </div>
            <h2 className="text-4xl font-serif font-bold text-primary mb-3">Our Existing Franchises</h2>
            <p className="text-gray-600 max-w-xl mx-auto text-sm leading-relaxed">Meet the passionate educators behind each Rabbi Global Academy center across Karnataka.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 lg:gap-7">
            {[...centers].sort((a, b) => a.academy.localeCompare(b.academy)).map((center, i) => (
              <div
                key={i}
                className="group relative flex flex-col items-center text-center rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2"
                style={{
                  background: "linear-gradient(160deg, #0f1e45 0%, #132448 60%, #0d1a3a 100%)",
                  border: "1.5px solid #d4a843",
                  boxShadow: "0 4px 22px rgba(0,0,0,0.35), 0 1px 6px rgba(0,0,0,0.25)",
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 18px 50px rgba(0,0,0,0.5), 0 4px 14px rgba(212,168,67,0.25)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "0 4px 22px rgba(0,0,0,0.35), 0 1px 6px rgba(0,0,0,0.25)"}
              >
                {/* Corner stars */}
                <span className="absolute top-3 right-3 text-secondary text-xs select-none">★</span>
                <span className="absolute top-8 right-7 text-secondary/60 select-none" style={{ fontSize: "7px" }}>★</span>
                <span className="absolute top-3 left-3 text-secondary/60 select-none" style={{ fontSize: "7px" }}>★</span>

                {/* Circular photo with shining gold ring */}
                <div className="mt-6 mb-4 shrink-0">
                  <div
                    className="rounded-full transition-transform duration-500 group-hover:scale-[1.05]"
                    style={{
                      width: "148px",
                      height: "148px",
                      padding: "3px",
                      background: "conic-gradient(#b8860b 0deg, #f5d87a 60deg, #d4a843 120deg, #fffbe6 180deg, #d4a843 240deg, #f5d87a 300deg, #b8860b 360deg)",
                      borderRadius: "50%",
                    }}
                  >
                    <div style={{ background: "#fdf8ec", borderRadius: "50%", padding: "3px", width: "100%", height: "100%" }}>
                      <div style={{ borderRadius: "50%", overflow: "hidden", width: "100%", height: "100%", background: "#fdf8ec" }}>
                        <img
                          src={center.photo}
                          alt={center.head}
                          className="w-full h-full object-cover object-center"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info — clean fixed-height layout */}
                <div className="w-full px-5 pb-5 flex flex-col items-center">

                  {/* Academy name: 2-line max, fixed 72px */}
                  <div className="w-full flex items-center justify-center" style={{ height: "72px" }}>
                    <h3 className="font-serif font-bold text-[23px] leading-[1.55] text-white line-clamp-2 text-center">{center.academy}</h3>
                  </div>

                  {/* Head name: 1-line, fixed 34px */}
                  <div className="w-full flex items-center justify-center" style={{ height: "34px" }}>
                    <p className="text-[21px] font-bold text-secondary line-clamp-1 text-center">{center.head}</p>
                  </div>

                  {/* Gold divider */}
                  <div className="w-14 rounded-full my-4 shrink-0" style={{ height: "2px", background: "linear-gradient(90deg, transparent, #d4a843, transparent)" }} />

                  {/* Location */}
                  <div className="w-full flex items-center justify-center pb-1" style={{ height: "56px" }}>
                    <p className="text-[17px] text-white/80 font-semibold leading-[1.55] line-clamp-2 text-center">
                      <MapPin className="inline-block h-[15px] w-[15px] text-secondary/80 mr-[3px] relative" style={{ top: "-1px" }} />
                      {center.area}, {center.city}
                    </p>
                  </div>

                </div>

                {/* Bottom gold bar */}
                <div className="h-[3px] w-full shrink-0" style={{ background: "linear-gradient(90deg, #b8860b, #f5d87a, #d4a843, #f5d87a, #b8860b)" }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        className="relative py-20 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #142d50 0%, #0f2745 55%, #173861 100%)" }}
      >
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <div className="absolute -left-16 top-0 w-80 h-80 rounded-full bg-secondary/20 blur-3xl" />
        <div className="absolute right-0 bottom-0 w-80 h-80 rounded-full bg-sky-300/10 blur-3xl" />
        <div className="container px-4 relative z-10 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-5 py-2 text-secondary text-xs font-bold uppercase tracking-widest backdrop-blur-sm mb-6">
            <PartyPopper className="h-3.5 w-3.5" /> Start Your Journey
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white mb-5 leading-tight">
            Ready to Own a<br />
            <span className="text-secondary">Rabbi Global Academy?</span>
          </h2>
          <p className="text-white text-lg mb-10 max-w-2xl mx-auto">
            Join 40+ franchise partners who are running successful, impact-driven education centers across Karnataka.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
               onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full px-8 h-12 text-base font-semibold shadow-xl shadow-secondary/20 w-full sm:w-auto"
            >
              Apply for Franchise <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Link to="/contact" className="w-full sm:w-auto">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-full px-8 h-12 text-base w-full">
                Contact Us First
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
