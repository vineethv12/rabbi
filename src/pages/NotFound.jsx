import { Link } from "react-router-dom";
import { AppLayout } from "@/components/shared/AppLayout";
import { Seo } from "@/components/shared/Seo";
import { Button } from "@/components/ui/button";
import { Home, MessageSquare } from "lucide-react";

export function NotFound() {
  return (
    <AppLayout>
      <Seo title="Page Not Found" path="" noindex />
      <section
        className="flex-1 relative overflow-hidden flex items-center justify-center py-32"
        style={{ background: "linear-gradient(135deg, #142d50 0%, #0f2745 55%, #173861 100%)" }}
      >
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="absolute -left-12 top-10 w-72 h-72 rounded-full bg-secondary/15 blur-3xl pointer-events-none" />
        <div className="absolute right-0 bottom-10 w-80 h-80 rounded-full bg-sky-300/10 blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-20 text-secondary/20 text-5xl font-black select-none animate-float">✦</div>
        <div className="absolute bottom-32 left-20 text-white/10 text-4xl font-black select-none animate-float-delayed">★</div>

        <div className="container px-4 relative z-10 text-center max-w-2xl mx-auto text-white">
          <div
            className="text-[9rem] md:text-[12rem] font-serif font-black leading-none mb-2 select-none"
            style={{ color: "rgba(201,162,75,0.25)" }}
          >
            404
          </div>
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-5 py-2 text-secondary text-xs font-bold uppercase tracking-[0.3em] backdrop-blur-sm mb-6">
            Page Not Found
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-5 leading-tight">
            Looks Like You Took a<br /><span className="text-secondary">Wrong Turn</span>
          </h1>
          <p className="text-lg text-white/70 mb-10 leading-relaxed max-w-lg mx-auto">
            This page doesn't exist. Let's get you back to learning — visit our home page or reach out to us directly.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full px-8 h-12 font-semibold text-base shadow-xl shadow-secondary/20">
              <Link to="/"><Home className="h-4 w-4 mr-2" /> Back to Home</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-full px-8 h-12 font-semibold text-base">
              <Link to="/contact"><MessageSquare className="h-4 w-4 mr-2" /> Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
