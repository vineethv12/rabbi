import { useEffect, useCallback } from "react";
import { X } from "lucide-react";

const YOUTUBE_VIDEO_ID = "dQw4w9WgXcQ";

export function VideoModal({ isOpen, onClose }) {
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8"
      aria-modal="true"
      role="dialog"
      aria-label="Watch Our Story"
    >
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-4xl z-10">
        <button
          onClick={handleClose}
          className="absolute -top-10 right-0 text-white/80 hover:text-white transition-colors p-1"
          aria-label="Close video"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="relative w-full rounded-xl overflow-hidden shadow-2xl"
          style={{ paddingBottom: "56.25%" }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&rel=0&modestbranding=1`}
            title="Watch Our Story"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
