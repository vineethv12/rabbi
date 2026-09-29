import { useEffect, useState } from "react";

export function SplashScreen() {
  const [hidden, setHidden] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    const startLeave = () => setLeaving(true);
    const minDelay = setTimeout(startLeave, 1400);

    return () => {
      clearTimeout(minDelay);
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (!leaving) return;
    const t = setTimeout(() => {
      setHidden(true);
      document.body.style.overflow = "";
    }, 650);
    return () => clearTimeout(t);
  }, [leaving]);

  if (hidden) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-700 ease-out ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
      aria-hidden="true"
    >
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <span className="absolute inset-0 rounded-full bg-secondary/30 blur-2xl animate-pulse" />
          <div className="relative h-28 w-28 rounded-full bg-white flex items-center justify-center shadow-2xl ring-2 ring-secondary/40 splash-logo-pop overflow-hidden">
            <img
              src="/images/rabbi-logo-transparent.webp"
              alt="Rabbi Global Academy"
              className="h-full w-full object-contain"
              fetchpriority="high"
              decoding="async"
            />
          </div>
        </div>

        <div className="flex flex-col items-center text-center splash-text-rise">
          <span className="font-serif font-bold text-2xl sm:text-3xl tracking-tight text-primary">
            RABBI GLOBAL ACADEMY
          </span>
          <span className="text-xl sm:text-2xl text-secondary mt-1 font-script">
            Learn From Master
          </span>
        </div>

        <div className="mt-2 h-1 w-40 overflow-hidden rounded-full bg-primary/10">
          <span className="block h-full w-1/3 rounded-full bg-secondary splash-bar" />
        </div>
      </div>
    </div>
  );
}
