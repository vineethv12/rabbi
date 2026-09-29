import { useEffect, useState } from "react";

// Returns the pixel gap between the layout viewport bottom and the visual
// viewport bottom. On mobile this grows/shrinks as the browser toolbar
// collapses/expands, so fixed-bottom UI can be shifted up to stay visible.
export function useViewportBottomInset() {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    let raf = 0;
    const apply = () =>
      setInset(Math.max(0, window.innerHeight - vv.height - vv.offsetTop));
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
  }, []);

  return inset;
}
