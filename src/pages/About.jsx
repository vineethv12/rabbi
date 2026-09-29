import { AppLayout } from "@/components/shared/AppLayout";
import { Seo } from "@/components/shared/Seo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Lightbulb, Trophy, ShieldCheck, Heart, ArrowUpRight, Sparkles, Users, GraduationCap, Star, BadgeCheck } from "lucide-react";
import { useEnrollModal } from "@/contexts/EnrollModalContext";

const stats = [
  { value: "17+", label: "Years Experience" },
  { value: "10k+", label: "Happy Students" },
  { value: "50+", label: "Franchise Centers" },
  { value: "100%", label: "Karnataka Presence" },
];

const values = [
  {
    icon: Trophy, title: "Excellence",
    desc: "Uncompromising quality in our curriculum, teaching methods, and student outcomes.",
    bg: "bg-amber-100", iconColor: "text-amber-700",
    cardBg: "from-amber-50 to-yellow-50", accent: "bg-amber-400",
    img: "/images/value-excellence-new.webp"
  },
  {
    icon: ShieldCheck, title: "Integrity",
    desc: "Honest and transparent relationships with parents, students, and our franchise partners.",
    bg: "bg-sky-100", iconColor: "text-sky-700",
    cardBg: "from-sky-50 to-blue-50", accent: "bg-sky-400",
    img: "/images/value-integrity-new.webp"
  },
  {
    icon: Heart, title: "Student-Centric",
    desc: "Every decision is made with the child's holistic growth and happiness in mind.",
    bg: "bg-rose-100", iconColor: "text-rose-600",
    cardBg: "from-rose-50 to-pink-50", accent: "bg-rose-400",
    img: "/images/value-student-centric-new.webp"
  },
];

export function About() {
  const { openEnrollModal } = useEnrollModal();
  return (
    <AppLayout>
      <Seo
        title="About Us"
        description="With 17+ years of excellence and 40+ centers, Rabbi Global Academy is Karnataka's trusted name in Abacus, Vedic Maths, and cognitive development for children."
        path="/about"
      />
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
          <div className="grid lg:grid-cols-[42%_58%] gap-8 lg:gap-10 items-center">

            {/* Left — text */}
            <div className="py-12 sm:py-16 lg:py-20">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-2 text-secondary text-xs font-semibold uppercase tracking-widest backdrop-blur-sm mb-5">
                <Sparkles className="h-3.5 w-3.5" /> About Our Academy
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold mb-5 leading-tight">About Rabbi<br />Global Academy</h1>
              <p className="text-base sm:text-lg text-white leading-relaxed max-w-lg mb-8">
                Shaping young minds through structured programs that go beyond conventional education for over 17 years.
              </p>
              <div className="flex flex-wrap gap-4 items-center">
            <Link to="/contact#send-message" className="w-full sm:w-auto">
                  <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full px-8 h-12 font-semibold w-full">Enroll Your Child</Button>
                </Link>
                <Link to="/franchises" className="w-full sm:w-auto">
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-full px-8 h-12 font-semibold w-full">Partner With Us</Button>
                </Link>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3 text-white shadow-xl mt-6 w-fit">
                <GraduationCap className="h-5 w-5 text-secondary flex-shrink-0" />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-secondary font-bold">About RGA</p>
                  <p className="text-sm font-semibold">Trusted learning for every child</p>
                </div>
              </div>
            </div>

            {/* Right — hero photo */}
            <div className="relative block py-6 lg:py-8">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[90%] h-[80%] rounded-3xl"
                  style={{ background: "radial-gradient(circle, rgba(201,162,75,0.15) 0%, rgba(100,160,255,0.06) 55%, transparent 80%)" }} />
              </div>
              <div className="absolute top-4 right-4 text-secondary/35 text-3xl font-black select-none animate-float">✦</div>
              <div className="absolute bottom-4 left-4 text-white/20 text-2xl font-black select-none animate-float-delayed">★</div>
              <div className="relative aspect-[3/2] w-full rounded-3xl overflow-hidden shadow-2xl border-2 border-white/10">
                <img
                  src="/images/aout-hero.webp"
                  alt="Rabbi Global Academy founders receiving award"
                  className="w-full h-full object-cover object-center"
                  style={{ filter: "brightness(1.12) contrast(1.08) saturate(1.18)" }}
                  loading="eager"
                  fetchpriority="high"
                  decoding="async"
                />
              </div>
            </div>
    
          </div>
        </div>
      </section>

      <section className="relative py-14 overflow-hidden border-b border-border/60" style={{ background: "linear-gradient(160deg, #fffdf8 0%, #f7f8ff 100%)" }}>
        <div className="absolute -right-10 top-0 w-64 h-64 rounded-full bg-amber-200/20 blur-3xl pointer-events-none" />
        <div className="absolute left-0 bottom-0 w-56 h-56 rounded-full bg-sky-200/15 blur-3xl pointer-events-none" />
        <div className="container px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 text-center max-w-4xl mx-auto">
            {stats.map((stat, i) => (
              <div key={stat.label} className="group rounded-[1.75rem] bg-white border border-border/60 p-7 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <p className="text-4xl md:text-5xl font-serif font-bold text-secondary mb-2">{stat.value}</p>
                <p className="text-primary uppercase text-xs font-bold tracking-[0.2em]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-24 overflow-hidden bg-gradient-to-b from-white via-[#fbf8ef] to-[#f7f8ff]">
        <div className="absolute -right-20 top-0 w-80 h-80 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="absolute left-0 bottom-0 w-72 h-72 rounded-full bg-sky-200/30 blur-3xl" />
        <div className="container px-4 relative z-10 max-w-7xl">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-10 items-start">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-white border border-amber-200 rounded-full px-5 py-2 text-amber-700 text-xs font-bold uppercase tracking-[0.3em] shadow-sm mb-5">
                <Sparkles className="h-3.5 w-3.5" /> About The Company
              </div>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary leading-tight mb-5">
                Premium learning.
                <span className="text-secondary block">Proven excellence.</span>
              </h2>
              <p className="text-lg text-foreground leading-relaxed mb-8">
                Rabbi Global Academy is a distinguished name in the field of education, with over 17 years of proven excellence in delivering impactful, skill-oriented learning solutions. Built on a strong foundation of academic expertise and innovation, the Academy is committed to shaping young minds through structured programs that go beyond conventional education.
              </p>
              {/* <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { value: "17+", label: "Years Excellence" },
                  { value: "10k+", label: "Students Empowered" },
                  { value: "40+", label: "Franchise Centers" },
                  { value: "4–18", label: "Age Group" },
                ].map((item) => (
                  <div key={item.label} className="rounded-[1.5rem] bg-white border border-border/60 p-5 shadow-sm">
                    <p className="text-3xl font-serif font-bold text-primary mb-1">{item.value}</p>
                    <p className="text-sm uppercase tracking-[0.2em] text-foreground">{item.label}</p>
                  </div>
                ))}
              </div> */}
            </div>

            <div className="rounded-[2rem] bg-white shadow-xl border border-border/60 p-6 lg:p-8">
              <div className="grid gap-4">
                <div className="rounded-[1.5rem] bg-gradient-to-br from-[#fff8e8] to-[#f6fbff] p-5 border border-amber-100">
                  <h3 className="text-xl font-serif font-bold text-primary mb-2">Structured Curriculum</h3>
                  <p className="text-foreground leading-relaxed">
                    With a specialized focus on Abacus, Vedic Mathematics, and cognitive skill development, Rabbi Global Academy offers a meticulously designed curriculum tailored for children in the 4 to 18 years age group.
                  </p>
                </div>
                <div className="rounded-[1.5rem] bg-gradient-to-br from-[#f7fbff] to-[#fff8fb] p-5 border border-sky-100">
                  <h3 className="text-xl font-serif font-bold text-primary mb-2">Holistic Growth</h3>
                  <p className="text-foreground leading-relaxed">
                    Our student-centric approach builds speed, accuracy, confidence, concentration, visualization, analytical thinking, and memory retention through engaging, outcome-driven learning.
                  </p>
                </div>
                <div className="rounded-[1.5rem] bg-gradient-to-br from-[#fffdf4] to-[#f8fbff] p-5 border border-violet-100">
                  <h3 className="text-xl font-serif font-bold text-primary mb-2">Trusted Legacy</h3>
                  <p className="text-foreground leading-relaxed">
                    Our legacy of excellence is reflected in the success of 10,000+ students, a growing network of 40+, and our expanding presence across Karnataka.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-10 max-w-5xl">
            <div className="rounded-[2rem] bg-white border border-border/60 shadow-md p-8 lg:p-10">
              <p className="text-lg text-foreground leading-relaxed">
                At Rabbi Global Academy, we adopt a holistic and student-centric approach that transforms learning into an engaging and enriching experience. Our methodology enables students to achieve speed, accuracy, and confidence in mental arithmetic, while simultaneously strengthening essential cognitive abilities such as concentration, visualization, analytical thinking, and memory retention.
              </p>
              <p className="text-lg text-foreground leading-relaxed mt-5">
                Driven by a vision to create a global impact in the education sector, Rabbi Global Academy is dedicated to delivering world-class learning solutions that empower students, support educators, and create sustainable growth opportunities for our franchise partners.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24" style={{ background: "linear-gradient(160deg, #fffdf8 0%, #f7f8ff 100%)" }}>
        <div className="container px-4 max-w-6xl">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-white border border-amber-200 rounded-full px-5 py-2 text-amber-700 text-xs font-bold uppercase tracking-[0.3em] shadow-sm mb-5">
              <Star className="h-3.5 w-3.5 text-secondary fill-secondary" /> Our Core Values
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-primary mb-4">Built on Trust, Quality, and Care</h2>
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="h-px w-12 bg-secondary/40" />
              <Star className="h-4 w-4 text-secondary fill-secondary" />
              <span className="h-px w-12 bg-secondary/40" />
            </div>
            <p className="text-foreground max-w-2xl mx-auto">A learning culture designed to nurture academic confidence and long-term growth.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-7">
            {values.map((value) => (
              <Card key={value.title} className="rounded-[2rem] border-border/60 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden bg-white">
                <CardContent className="p-0 text-center relative flex flex-col">
                  {/* Cartoon illustration area */}
                  <div className={`bg-gradient-to-br ${value.cardBg} relative flex items-center justify-center pt-8 pb-4 px-6`}>
                    <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, #00000008 1px, transparent 0)", backgroundSize: "18px 18px" }} />
                    <img
                      src={value.img}
                      alt={`${value.title} illustration`}
                      className="relative z-10 h-52 w-full object-contain drop-shadow-md"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  {/* Icon badge overlapping */}
                  <div className="flex justify-center -mt-6 mb-4 relative z-10">
                    <div className={`w-12 h-12 rounded-full ${value.bg} border-4 border-white shadow-md flex items-center justify-center`}>
                      <value.icon className={`w-5 h-5 ${value.iconColor}`} />
                    </div>
                  </div>
                  {/* Text content */}
                  <div className="px-7 pb-8">
                    <h3 className="text-2xl font-serif font-bold text-primary mb-3">{value.title}</h3>
                    <p className="text-foreground leading-relaxed text-sm">{value.desc}</p>
                    <div className={`mt-5 mx-auto h-1 w-10 rounded-full ${value.accent}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-primary text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <div className="container px-4 relative z-10 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-5 py-2 text-secondary text-xs font-bold uppercase tracking-[0.3em] backdrop-blur-sm mb-6">
            <BadgeCheck className="h-3.5 w-3.5" /> Join Our Legacy
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold mb-6">Ready to Join Our Legacy?</h2>
          <p className="text-white text-lg mb-10">Enroll your child or partner with us to bring proven brain-development education to your city.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
<Link to="/contact#send-message" className="w-full sm:w-auto">
              <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-8 h-12 rounded-full text-lg font-semibold w-full">Enroll Your Child</Button>
            </Link>            <Link to="/franchises" className="w-full sm:w-auto">
              <Button variant="outline" className="px-8 h-12 rounded-full text-lg font-semibold border-white/20 text-white hover:bg-white/10 w-full">Partner With Us</Button>
            </Link>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
