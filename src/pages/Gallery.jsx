import { useState, useEffect } from "react";
import { AppLayout } from "@/components/shared/AppLayout";
import { Seo } from "@/components/shared/Seo";
import { Images, ChevronLeft, ChevronRight, X, Sparkles, Camera, Loader2, Calendar, Tag, Play, Video, ChevronDown } from "lucide-react";

const ITEMS_PER_PAGE = 12;


const PALETTES = [
  { accent: "from-violet-500 to-purple-600", accentText: "text-violet-700", pill: "bg-violet-100 text-violet-700" },
  { accent: "from-sky-500 to-blue-600",      accentText: "text-sky-700",    pill: "bg-sky-100 text-sky-700" },
  { accent: "from-emerald-500 to-teal-600",  accentText: "text-emerald-700",pill: "bg-emerald-100 text-emerald-700" },
  { accent: "from-amber-500 to-orange-600",  accentText: "text-amber-700",  pill: "bg-amber-100 text-amber-700" },
  { accent: "from-rose-500 to-pink-600",     accentText: "text-rose-700",   pill: "bg-rose-100 text-rose-700" },
  { accent: "from-cyan-500 to-blue-500",     accentText: "text-cyan-700",   pill: "bg-cyan-100 text-cyan-700" },
  { accent: "from-indigo-500 to-violet-600", accentText: "text-indigo-700", pill: "bg-indigo-100 text-indigo-700" },
  { accent: "from-fuchsia-500 to-pink-500",  accentText: "text-fuchsia-700",pill: "bg-fuchsia-100 text-fuchsia-700" },
];

const YEAR_THEMES = {
  2025: "Champions of Tomorrow",
  2024: "Growing Together",
  2023: "Excellence in Action",
  2022: "Building Bright Futures",
  2021: "Where It All Begins",
};

function palette(i) { return PALETTES[i % PALETTES.length]; }

function normalizeItems(g) {
  return g.items || g.images || [];
}

function mergeYearStyles(rawYears) {
  return rawYears.map((y, i) => ({
    ...y,
    items: normalizeItems(y).map(it => ({ ...it, media_type: it.media_type || "image" })),
    theme: YEAR_THEMES[y.year] || `Memories of ${y.year}`,
    ...palette(i),
  }));
}

function mergeCategoryStyles(rawCats) {
  return rawCats.map((c, i) => ({
    ...c,
    items: normalizeItems(c).map(it => ({ ...it, media_type: it.media_type || "image" })),
    ...palette(i + 2),
  }));
}

export function Gallery() {
  const [activeTab, setActiveTab]           = useState("year");
  const [yearGroups, setYearGroups]         = useState([]);
  const [categoryGroups, setCategoryGroups] = useState([]);
  const [loading, setLoading]               = useState(true);
  const [activeYear, setActiveYear]         = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);

  // pagination: key → visible count
  const [visibleCounts, setVisibleCounts]   = useState({});

  // Lightbox
  const [lightbox, setLightbox] = useState(null); // { source, groupIdx, itemIdx }

  useEffect(() => {
    fetch("/api/gallery.php")
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => {
        if (Array.isArray(data)) {
          if (data.length > 0) setYearGroups(mergeYearStyles(data));
        } else {
          if (Array.isArray(data.year_groups)     && data.year_groups.length     > 0) setYearGroups(mergeYearStyles(data.year_groups));
          if (Array.isArray(data.category_groups) && data.category_groups.length > 0) setCategoryGroups(mergeCategoryStyles(data.category_groups));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Pagination helpers ────────────────────────────────────────────────────────
  function groupKey(tab, id) { return `${tab}_${id}`; }

  function getVisible(tab, id) {
    return visibleCounts[groupKey(tab, id)] || ITEMS_PER_PAGE;
  }

  function loadMore(tab, id, total) {
    const k = groupKey(tab, id);
    setVisibleCounts(prev => ({
      ...prev,
      [k]: Math.min((prev[k] || ITEMS_PER_PAGE) + ITEMS_PER_PAGE, total),
    }));
  }

  // ── Lightbox helpers ──────────────────────────────────────────────────────────
  function currentGroups() {
    return lightbox?.source === "category" ? categoryGroups : yearGroups;
  }

  const currentItem = lightbox
    ? currentGroups()[lightbox.groupIdx]?.items[lightbox.itemIdx]
    : null;

  function openLightbox(source, groupIdx, itemIdx) { setLightbox({ source, groupIdx, itemIdx }); }
  function closeLightbox() { setLightbox(null); }

  function prevItem() {
    if (!lightbox) return;
    const { source, groupIdx, itemIdx } = lightbox;
    const groups = source === "category" ? categoryGroups : yearGroups;
    if (itemIdx > 0) { setLightbox({ source, groupIdx, itemIdx: itemIdx - 1 }); }
    else if (groupIdx > 0) {
      setLightbox({ source, groupIdx: groupIdx - 1, itemIdx: groups[groupIdx - 1].items.length - 1 });
    }
  }

  function nextItem() {
    if (!lightbox) return;
    const { source, groupIdx, itemIdx } = lightbox;
    const groups = source === "category" ? categoryGroups : yearGroups;
    if (itemIdx < groups[groupIdx].items.length - 1) { setLightbox({ source, groupIdx, itemIdx: itemIdx + 1 }); }
    else if (groupIdx < groups.length - 1)           { setLightbox({ source, groupIdx: groupIdx + 1, itemIdx: 0 }); }
  }

  // keyboard navigation
  useEffect(() => {
    if (!lightbox) return;
    function onKey(e) {
      if (e.key === "ArrowLeft")  prevItem();
      if (e.key === "ArrowRight") nextItem();
      if (e.key === "Escape")     closeLightbox();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  // ── Filtered groups ───────────────────────────────────────────────────────────
  const displayedYears      = activeYear     ? yearGroups.filter(y => y.year === activeYear)         : yearGroups;
  const displayedCategories = activeCategory ? categoryGroups.filter(c => c.category === activeCategory) : categoryGroups;

  return (
    <AppLayout>
      <Seo
        title="Gallery"
        description="Moments from Rabbi Global Academy — competitions, events, award ceremonies, and classroom highlights from 2021 to 2025."
        path="/gallery"
      />
      {/* ── Hero ── */}
      <section className="relative flex flex-col justify-center overflow-hidden" style={{ minHeight: "480px" }}>

        {/* ── Mosaic photo background ── */}
        <div className="absolute inset-0 flex gap-2 pointer-events-none" aria-hidden="true">
          {[
            {
              imgs: [
                "/images/founders/awards/award-13.webp",
                "/images/founders/awards/stage-3.webp",
                "/images/founders/awards/award-9.webp",
                "/images/founders/awards/stage-4.webp",
                "/images/founders/awards/award-11.webp",
              ],
              dur: "28s", delay: "0s",
            },
            {
              imgs: [
                "/images/founders/awards/stage-5.webp",
                "/images/founders/awards/award-10.webp",
                "/images/founders/founder-basha.webp",
                "/images/founders/awards/award-14.webp",
                "/images/founders/awards/award-8.webp",
              ],
              dur: "22s", delay: "-8s",
            },
            {
              imgs: [
                "/images/founders/awards/award-12.webp",
                "/images/founders/awards/stage-3.webp",
                "/images/founders/awards/award-13.webp",
                "/images/founders/founder-parveen.webp",
                "/images/founders/awards/award-9.webp",
              ],
              dur: "32s", delay: "-14s",
            },
            {
              imgs: [
                "/images/founders/awards/award-10.webp",
                "/images/founders/awards/stage-4.webp",
                "/images/founders/awards/award-11.webp",
                "/images/founders/awards/award-8.webp",
                "/images/founders/awards/stage-5.webp",
              ],
              dur: "26s", delay: "-4s",
            },
            {
              imgs: [
                "/images/founders/awards/award-14.webp",
                "/images/founders/awards/award-12.webp",
                "/images/founders/awards/stage-3.webp",
                "/images/founders/awards/award-10.webp",
                "/images/founders/awards/award-13.webp",
              ],
              dur: "20s", delay: "-10s",
            },
          ].map((col, ci) => (
            <div key={ci} className="flex-1 flex flex-col gap-2 min-w-0" style={{ animation: `galleryScroll ${col.dur} linear ${col.delay} infinite` }}>
              {[...col.imgs, ...col.imgs].map((src, ii) => (
                <div key={ii} className="relative rounded-xl overflow-hidden flex-shrink-0" style={{ aspectRatio: ci % 2 === 0 ? "3/4" : "4/3" }}>
                  <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* ── Layered overlay: dark gradient + subtle vignette ── */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(135deg, rgba(9,17,34,0.93) 0%, rgba(15,28,56,0.85) 45%, rgba(9,17,34,0.93) 100%)" }} />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 80% at 50% 50%, transparent 20%, rgba(5,10,22,0.6) 100%)" }} />

        {/* ── Gold accent glows ── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
            style={{ background: "radial-gradient(circle, #c9a24b, transparent 70%)" }} />
          <div className="absolute -bottom-20 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-15"
            style={{ background: "radial-gradient(circle, #4f8ef7, transparent 70%)" }} />
        </div>

        {/* ── Fine dot grid ── */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 1.5px 1.5px, white 1.5px, transparent 0)", backgroundSize: "28px 28px" }} />

        {/* ── Content ── */}
        <div className="container px-4 relative z-10 flex flex-col items-center text-center py-16 sm:py-24">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/8 border border-secondary/50 rounded-full px-5 py-2 text-secondary text-[11px] font-bold uppercase tracking-[0.35em] backdrop-blur-md mb-7 shadow-lg shadow-black/30">
            <Camera className="h-3.5 w-3.5" />
            Memories &amp; Milestones
            <Sparkles className="h-3 w-3" />
          </div>

          {/* Title */}
          <h1 className="font-serif font-black text-white leading-[1.06] mb-5 drop-shadow-2xl">
            <span className="block text-4xl sm:text-5xl md:text-6xl tracking-tight">Every Moment,</span>
            <span className="block text-5xl sm:text-6xl md:text-[5rem] mt-1"
              style={{ background: "linear-gradient(90deg, #b8892a 0%, #f5d87a 35%, #e8c056 60%, #c9a24b 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", filter: "drop-shadow(0 2px 24px rgba(201,162,75,0.45))" }}>
              Captured
            </span>
          </h1>

          {/* Sub-text */}
          <p className="text-white/65 text-sm sm:text-base leading-relaxed max-w-lg mb-8">
            Championships, ceremonies, classroom sparks, and celebrations — every memory from Rabbi Global Academy's journey, beautifully preserved.
          </p>

        </div>

        {/* ── Marquee strip ── */}
        <div className="relative z-10 border-t border-white/10 bg-black/30 backdrop-blur-sm overflow-hidden">
          <div className="flex items-center gap-10 py-3 animate-marquee whitespace-nowrap" style={{ width: "max-content" }}>
            {[...Array(4)].map((_, rep) =>
              ["🏆 Championships", "📚 Classroom Sessions", "🎓 Graduations", "🌟 Competitions", "🎉 Annual Days", "🤝 Franchise Events", "📸 Moments", "🎬 Videos"].map(item => (
                <span key={`${rep}-${item}`} className="text-white/45 text-xs font-semibold uppercase tracking-widest flex-shrink-0">
                  {item}<span className="ml-10 text-secondary/50">✦</span>
                </span>
              ))
            )}
          </div>
        </div>

        <style>{`
          @keyframes galleryScroll {
            0%   { transform: translateY(0); }
            100% { transform: translateY(-50%); }
          }
        `}</style>
      </section>

      {/* ── Tab bar ── */}
      <section className="sticky top-20 z-30 bg-white/95 backdrop-blur-xl border-b border-border/60 shadow-sm">
        <div className="container px-4">
          <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-none">
            <button onClick={() => { setActiveTab("year"); setActiveYear(null); setActiveCategory(null); }}
              className={`flex-shrink-0 flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                activeTab === "year" ? "bg-primary text-white shadow-md scale-105" : "text-foreground hover:text-primary hover:bg-muted/60"
              }`}>
              <Calendar className="h-3.5 w-3.5" /> By Year
            </button>
            <button onClick={() => { setActiveTab("category"); setActiveYear(null); setActiveCategory(null); }}
              className={`flex-shrink-0 flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                activeTab === "category" ? "bg-primary text-white shadow-md scale-105" : "text-foreground hover:text-primary hover:bg-muted/60"
              }`}>
              <Tag className="h-3.5 w-3.5" /> By Category
            </button>

            <div className="h-6 w-px bg-border/60 mx-1 flex-shrink-0" />

            {activeTab === "year" && (
              <>
                <button onClick={() => setActiveYear(null)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    activeYear === null ? "bg-primary/10 text-primary border border-primary/25" : "text-foreground/60 hover:text-primary hover:bg-muted/60"
                  }`}>All</button>
                {yearGroups.map(y => (
                  <button key={y.year} onClick={() => setActiveYear(y.year)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                      activeYear === y.year ? "bg-primary/10 text-primary border border-primary/25" : "text-foreground/60 hover:text-primary hover:bg-muted/60"
                    }`}>{y.year}</button>
                ))}
              </>
            )}

            {activeTab === "category" && (
              <>
                <button onClick={() => setActiveCategory(null)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    activeCategory === null ? "bg-primary/10 text-primary border border-primary/25" : "text-foreground/60 hover:text-primary hover:bg-muted/60"
                  }`}>All</button>
                {categoryGroups.map(c => (
                  <button key={c.category} onClick={() => setActiveCategory(c.category)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                      activeCategory === c.category ? "bg-primary/10 text-primary border border-primary/25" : "text-foreground/60 hover:text-primary hover:bg-muted/60"
                    }`}>{c.category}</button>
                ))}
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Content ── */}
      <section className="relative py-16 overflow-hidden"
        style={{ background: "linear-gradient(180deg, #fafafa 0%, #f5f3ff 50%, #fafafa 100%)" }}>
        <div className="container px-4 space-y-20">

          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          )}

          {/* ── Year tab ── */}
          {!loading && activeTab === "year" && displayedYears.length === 0 && (
            <div className="text-center py-20">
              <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-semibold">No gallery photos yet</p>
              <p className="text-muted-foreground/60 text-sm mt-1">
                Use the admin panel to upload photos or videos to the gallery.
              </p>
            </div>
          )}
          {!loading && activeTab === "year" && displayedYears.length > 0 && displayedYears.map((grp, yi) => {
            const realIdx   = yearGroups.findIndex(y => y.year === grp.year);
            const visible   = getVisible("year", grp.year);
            const sliced    = grp.items.slice(0, visible);
            const remaining = grp.items.length - visible;
            const videoCount = grp.items.filter(i => i.media_type === "video").length;

            return (
              <div key={grp.year}>
                <div className="flex items-center gap-4 mb-8">
                  <div className={`flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br ${grp.accent} flex items-center justify-center shadow-lg`}>
                    <span className="text-white font-black text-lg">{String(grp.year).slice(2)}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h2 className="text-2xl sm:text-3xl font-serif font-bold text-primary">{grp.year}</h2>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${grp.pill}`}>
                        {grp.items.length} items
                      </span>
                      {videoCount > 0 && (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 flex items-center gap-1">
                          <Video className="h-3 w-3" /> {videoCount} video{videoCount !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm font-semibold ${grp.accentText}`}>{grp.theme}</p>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent ml-2" />
                </div>

                <MediaGrid
                  items={sliced}
                  accent={grp.accent}
                  label={grp.year}
                  onOpen={ii => openLightbox("year", realIdx, ii)}
                />

                {remaining > 0 && (
                  <div className="text-center mt-8">
                    <button onClick={() => loadMore("year", grp.year, grp.items.length)}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-primary/20 text-primary font-semibold text-sm hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 shadow-sm hover:shadow-md">
                      <ChevronDown className="h-4 w-4" />
                      Load {Math.min(ITEMS_PER_PAGE, remaining)} more
                      <span className="text-xs opacity-60">({remaining} remaining)</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* ── Category tab ── */}
          {!loading && activeTab === "category" && (
            displayedCategories.length === 0 ? (
              <div className="text-center py-20">
                <Tag className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground font-semibold">No category photos yet</p>
                <p className="text-muted-foreground/60 text-sm mt-1">
                  Use the admin panel to upload photos or videos under any custom category.
                </p>
              </div>
            ) : (
              displayedCategories.map((grp, ci) => {
                const realIdx   = categoryGroups.findIndex(c => c.category === grp.category);
                const visible   = getVisible("category", grp.category);
                const sliced    = grp.items.slice(0, visible);
                const remaining = grp.items.length - visible;
                const videoCount = grp.items.filter(i => i.media_type === "video").length;

                return (
                  <div key={grp.category}>
                    <div className="flex items-center gap-4 mb-8">
                      <div className={`flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br ${grp.accent} flex items-center justify-center shadow-lg`}>
                        <Tag className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-primary">{grp.category}</h2>
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${grp.pill}`}>
                            {grp.items.length} items
                          </span>
                          {videoCount > 0 && (
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 flex items-center gap-1">
                              <Video className="h-3 w-3" /> {videoCount} video{videoCount !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent ml-2" />
                    </div>

                    <MediaGrid
                      items={sliced}
                      accent={grp.accent}
                      label={grp.category}
                      onOpen={ii => openLightbox("category", realIdx, ii)}
                    />

                    {remaining > 0 && (
                      <div className="text-center mt-8">
                        <button onClick={() => loadMore("category", grp.category, grp.items.length)}
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-primary/20 text-primary font-semibold text-sm hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 shadow-sm hover:shadow-md">
                          <ChevronDown className="h-4 w-4" />
                          Load {Math.min(ITEMS_PER_PAGE, remaining)} more
                          <span className="text-xs opacity-60">({remaining} remaining)</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )
          )}
        </div>
      </section>

      {/* ── Lightbox ── */}
      {lightbox && currentItem && (() => {
        const groups = currentGroups();
        const grp    = groups[lightbox.groupIdx];
        const isVideo = currentItem.media_type === "video";
        return (
          <div className="fixed inset-0 z-[100] bg-black/92 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeLightbox}>
            <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
              onClick={closeLightbox}><X className="h-5 w-5" /></button>

            <button className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
              onClick={e => { e.stopPropagation(); prevItem(); }}><ChevronLeft className="h-5 w-5" /></button>

            <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
              {isVideo ? (
                <video
                  key={currentItem.src}
                  src={currentItem.src}
                  controls
                  autoPlay
                  className="w-full max-h-[80vh] rounded-2xl shadow-2xl bg-black"
                />
              ) : (
                <img src={currentItem.src} alt={currentItem.caption}
                  className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
                  loading="lazy" decoding="async" />
              )}
              <div className="mt-3 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  {isVideo && <Video className="h-4 w-4 text-purple-400" />}
                  <p className="text-white font-semibold text-base">{currentItem.caption}</p>
                </div>
                <p className="text-white/50 text-xs">
                  {lightbox.source === "year" ? grp?.year : grp?.category} · {lightbox.itemIdx + 1} / {grp?.items.length}
                </p>
              </div>
            </div>

            <button className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
              onClick={e => { e.stopPropagation(); nextItem(); }}><ChevronRight className="h-5 w-5" /></button>
          </div>
        );
      })()}
    </AppLayout>
  );
}

// ── Media Grid ────────────────────────────────────────────────────────────────
function MediaGrid({ items, accent, label, onOpen }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {items.map((item, ii) => {
        const isVideo = item.media_type === "video";
        return (
          <div key={item.id ?? ii}
            className="group relative rounded-[1.25rem] overflow-hidden cursor-pointer shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 bg-black"
            onClick={() => onOpen(ii)}>

            <div className="aspect-[4/3] overflow-hidden">
              {isVideo ? (
                <video
                  src={item.src}
                  preload="metadata"
                  muted
                  playsInline
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <img src={item.src} alt={item.caption}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy" decoding="async" />
              )}
            </div>

            {/* Play button overlay for videos */}
            {isVideo && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-black/55 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                  <Play className="h-6 w-6 text-white ml-1" fill="white" />
                </div>
              </div>
            )}

            {/* Caption hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
              <p className="text-white text-sm font-semibold line-clamp-2">{item.caption}</p>
            </div>

            {/* Year/Category pill */}
            <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold bg-gradient-to-r ${accent} text-white shadow`}>
              {label}
            </div>

            {/* Media type icon */}
            <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {isVideo
                ? <Video className="h-3.5 w-3.5 text-white" />
                : <Images className="h-3.5 w-3.5 text-white" />}
            </div>
          </div>
        );
      })}
    </div>
  );
}
