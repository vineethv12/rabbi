import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { CalendarCheck, Rocket } from "lucide-react";
import { useEnrollModal } from "@/contexts/EnrollModalContext";

export function MobileActionBar() {
  const { openEnrollModal } = useEnrollModal();
  const { pathname } = useLocation();
  const ref = useRef(null);

  const hidden = pathname.startsWith("/portal") || pathname.startsWith("/admin");

  useEffect(() => {
    if (hidden) return;
    const vv = window.visualViewport;
    if (!vv) return;

    let raf = 0;
    const apply = () => {
      const el = ref.current;
      if (!el) return;
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      el.style.bottom = `${inset}px`;
    };
    const onChange = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(apply);
    };

    apply();
    vv.addEventListener("resize", onChange);
    vv.addEventListener("scroll", onChange);
    window.addEventListener("orientationchange", onChange);
    return () => {
      cancelAnimationFrame(raf);
      vv.removeEventListener("resize", onChange);
      vv.removeEventListener("scroll", onChange);
      window.removeEventListener("orientationchange", onChange);
    };
  }, [hidden, pathname]);

  if (hidden) return null;

  return (
    <div ref={ref} className="lg:hidden fixed bottom-0 inset-x-0 z-40 mobile-action-bar">
      <div className="border-t border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-[0_-6px_24px_-8px_rgba(0,0,0,0.25)]">
        <div className="grid grid-cols-2 gap-2 p-2">
          <button
            type="button"
            onClick={() => openEnrollModal("demo")}
            className="group flex items-center justify-center gap-2 rounded-xl bg-secondary px-3 py-3 text-secondary-foreground font-semibold text-sm shadow-md active:scale-[0.98] transition-transform"
          >
            <CalendarCheck className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">Book Demo Class</span>
          </button>

          <Link
            to="/franchises"
            className="group flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-3 text-primary-foreground font-semibold text-sm shadow-md active:scale-[0.98] transition-transform"
          >
            <Rocket className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">Become Franchise</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
