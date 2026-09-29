import { useState, useRef } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, ChevronDown, LogIn, Sparkles } from "lucide-react";
import { useEnrollModal } from "@/contexts/EnrollModalContext";

const courseMenu = [
  {
    title: "Abacus",
    emoji: "🔢",
    id: "abacus",
    levels: [
      { name: "Beginners", id: "beginners" },
      { name: "Starters — Level 1", id: "starters" },
      { name: "Movers — Level 2", id: "movers" },
      { name: "Riders — Level 3", id: "riders" },
      { name: "Racers — Level 4", id: "racers" },
      { name: "Flyers — Level 5", id: "flyers" },
      { name: "Endeavours — Level 6", id: "endeavours" },
      { name: "Achievers — Level 7", id: "achievers" },
      { name: "Star — Level 8", id: "stars" },
    ],
  },
  {
    title: "Vedic Maths",
    emoji: "🧮",
    id: "vedic-maths",
    levels: [
      { name: "Level 1", id: "vedic-starters" },
      { name: "Level 2", id: "vedic-movers" },
      { name: "Level 3", id: "vedic-riders" },
      { name: "Level 4", id: "vedic-racers" },
    ],
  },
  {
    title: "Abacus Tutor Training",
    emoji: "🎓",
    id: "abacus-tutor-training",
    levels: [
      { name: "Beginners", id: "beginners" },
      { name: "Starters — Level 1", id: "starters" },
      { name: "Movers — Level 2", id: "movers" },
      { name: "Riders — Level 3", id: "riders" },
      { name: "Racers — Level 4", id: "racers" },
      { name: "Flyers — Level 5", id: "flyers" },
      { name: "Endeavours — Level 6", id: "endeavours" },
      { name: "Achievers — Level 7", id: "achievers" },
      { name: "Star — Level 8", id: "stars" },
       { name: "Pregnant Mothers", id: "pregnant-mothers" }
    ],
  },
  {
    title: "Vedic Maths Tutor Training",
    emoji: "🧠",
    id: "vedic-maths-tutor-training",
    levels: [
     { name: "Level 1", id: "vedic-starters" },
      { name: "Level 2", id: "vedic-movers" },
      { name: "Level 3", id: "vedic-riders" },
      { name: "Level 4", id: "vedic-racers" },
      { name: "Pregnant Mothers", id: "pregnant-mothers" }
    ],
  },
  {
    title: "Corresponding Courses",
    emoji: "📚",
    id: "corresponding-courses",
    levels: [
      { name: "Upcoming", },
    ],
  },
  {
    title: "Career Counselling",
    emoji: "📚",
    id: "career-counselling",
    levels: [
      { name: "Upcoming", },
    ],
  },
];

const links = [
  { label: "About Us", href: "/about" },
  { label: "Our Franchises", href: "/franchises" },
  { label: "Learn Abacus", href: "/learn-abacus" },
  { label: "Gallery", href: "/gallery" },
  { label: "Contact", href: "/contact" },
];

const quizLinkClass = ({ isActive }) =>
  `inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors duration-200 ${
    isActive
      ? "bg-secondary text-secondary-foreground"
      : "bg-secondary/15 text-secondary hover:bg-secondary/25"
  }`;

const desktopLinkClass = ({ isActive }) =>
  `relative text-sm font-medium transition-colors duration-200 py-1 ${
    isActive
      ? "text-secondary font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-secondary"
      : "text-foreground hover:text-primary"
  }`;

const mobileLinkClass = ({ isActive }) =>
  `text-base font-medium transition-colors border-b border-border/50 pb-3 ${
    isActive ? "text-secondary font-semibold" : "text-foreground hover:text-secondary"
  }`;

function CoursesDropdown() {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("abacus");
  const timeoutRef = useRef(null);
  const navigate = useNavigate();

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  };

  const active = courseMenu.find((c) => c.id === activeSection) || courseMenu[0];

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <NavLink
        to="/courses"
        className={({ isActive }) =>
          `relative text-sm font-medium transition-colors duration-200 py-1 flex items-center gap-1 ${
            isActive
              ? "text-secondary font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-secondary"
              : "text-foreground hover:text-primary"
          }`
        }
      >
        Courses Offered
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </NavLink>

      {open && (
        <div className="fixed left-0 right-0 mt-2 mx-auto max-w-3xl px-6 z-50"
          style={{ top: "96px" }}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-border/20 overflow-hidden flex">
            {/* Left: category list */}
            <div className="w-60 bg-slate-50 border-r border-border/15 py-2 flex-shrink-0">
              <p className="px-4 pt-1 pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Categories
              </p>
              {courseMenu.map((cat) => (
                <button
                  key={cat.id}
                  onMouseEnter={() => setActiveSection(cat.id)}
                  onClick={() => { setOpen(false); navigate(`/courses#${cat.id}`); }}
                  className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-all duration-150 flex items-center gap-2.5 ${
                    activeSection === cat.id
                      ? "bg-primary text-white"
                      : "text-foreground hover:bg-primary/8 hover:text-primary"
                  }`}
                >
                  <span className="flex-1">{cat.title}</span>
                  <ChevronDown className={`w-3 h-3 -rotate-90 transition-opacity ${activeSection === cat.id ? "opacity-70" : "opacity-30"}`} />
                </button>
              ))}
            </div>

            {/* Right: levels panel */}
            <div className="flex-1 py-2 px-1 min-h-[180px]">
              <p className="px-4 pt-1 pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {active.title}
              </p>
              {active.levels.map((lvl) => (
                <Link
                  key={lvl.id}
                  to={`/courses#${lvl.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:text-primary hover:bg-primary/6 rounded-lg transition-all duration-150 group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary/60 group-hover:bg-secondary shrink-0 transition-colors" />
                  {lvl.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const { openEnrollModal } = useEnrollModal();
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-24 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform flex-shrink-0 overflow-hidden">
            <img
              src="/images/rabbi-logo-transparent.webp"
              alt="Rabbi Global Academy"
              className="h-full w-full object-contain"
              fetchpriority="high"
              decoding="async"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-bold text-lg leading-none tracking-tight text-primary">
              RABBI GLOBAL ACADEMY
            </span>
            <span className="text-base text-secondary mt-0.5 font-script">
              Learn From Master
            </span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-6">
          <NavLink to="/" end className={desktopLinkClass}>Home</NavLink>
          <CoursesDropdown />
          {links.map((link) => (
            <NavLink
              key={link.label}
              to={link.href}
              end={link.href === "/"}
              className={desktopLinkClass}
            >
              {link.label}
            </NavLink>
          ))}
          <NavLink to="/quiz" className={quizLinkClass}>
            <Sparkles className="h-3.5 w-3.5" />Free Quiz
          </NavLink>
          <Button asChild variant="outline" className="border-primary/30 text-primary hover:bg-primary/5 rounded-full px-4 font-semibold flex items-center gap-1.5">
            <Link to="/portal/login"><LogIn className="h-3.5 w-3.5" />Login</Link>
          </Button>
        </nav>

        <Sheet>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-background w-[88vw] max-w-[340px] border-l-border">
            <div className="flex flex-col gap-1 pt-10">
              <Link to="/" className="flex items-center gap-2 mb-6">
                <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow flex-shrink-0 overflow-hidden">
                  <img src="/images/rabbi-logo-transparent.webp" alt="Logo" className="h-full w-full object-contain" loading="lazy" decoding="async" />
                </div>
                <span className="font-serif font-bold text-primary text-sm leading-tight">
                  RABBI GLOBAL ACADEMY
                </span>
              </Link>
              <NavLink to="/" end className={mobileLinkClass}>Home</NavLink>
              <NavLink to="/courses" className={mobileLinkClass}>Courses Offered</NavLink>
              {links.map((link) => (
                <NavLink
                  key={link.label}
                  to={link.href}
                  end={link.href === "/"}
                  className={mobileLinkClass}
                >
                  {link.label}
                </NavLink>
              ))}
              <NavLink to="/quiz" className={mobileLinkClass}>Free Maths Quiz ✨</NavLink>
              <Button asChild variant="outline" className="mt-4 w-full border-primary/30 text-primary rounded-full font-semibold flex items-center gap-2">
                <Link to="/portal/login"><LogIn className="h-4 w-4" />Login</Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
