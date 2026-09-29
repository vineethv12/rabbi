import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, LogIn, GraduationCap, Building2 } from "lucide-react";
import { Seo } from "@/components/shared/Seo";

const API_BASE = "/api";

export function PortalLogin() {
  const navigate = useNavigate();
  const [role, setRole]       = useState("student");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const label = role === "franchise" ? "Center ID" : "Enrollment Number";
  const placeholder = role === "franchise" ? "e.g. MUMBAI" : "e.g. MUMBAI-RAHUL-01";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!loginId.trim() || !password) {
      setError(`Please enter your ${label} and password.`);
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/portal_auth.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login_id: loginId.trim(), password, role }),
      });
      const text = await res.text();
      let data = {};
      try { data = JSON.parse(text); } catch (_) {}
      if (!res.ok) throw new Error(data.error || "Login failed");

      sessionStorage.setItem("rga_portal_token",    data.token);
      sessionStorage.setItem("rga_portal_role",     data.role);
      sessionStorage.setItem("rga_portal_login_id", data.login_id);
      sessionStorage.setItem("rga_portal_name",     data.name);
      sessionStorage.setItem("rga_portal_center_id",data.center_id);

      if (data.role === "franchise") {
        navigate("/portal/franchise");
      } else {
        navigate("/portal/student");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-[#081b30] flex flex-col overflow-hidden">
      <Seo title="Portal Login" path="/portal/login" noindex />

      {/* Background decor */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d2b4d] via-[#081b30] to-[#050f1d]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(ellipse 90% 70% at 50% 40%, black 30%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse 90% 70% at 50% 40%, black 30%, transparent 75%)",
          }}
        />
        <div className="absolute -top-40 -left-32 w-[32rem] h-[32rem] rounded-full bg-secondary/15 blur-[130px] animate-pulse" style={{ animationDuration: "7s" }} />
        <div className="absolute -bottom-48 -right-32 w-[36rem] h-[36rem] rounded-full bg-[#2563eb]/20 blur-[140px] animate-pulse" style={{ animationDuration: "9s" }} />
        <div className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full bg-secondary/10 blur-[100px]" />
      </div>

      {/* Back link */}
      <div className="relative z-10 flex justify-end px-6 py-4">
        <Link to="/" className="text-white/50 hover:text-white text-sm transition-colors">
          ← Back to site
        </Link>
      </div>

      {/* Card */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 pb-14 pt-2">
        <div className="w-full max-w-md">
          {/* Brand */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-block group">
              <div className="mx-auto h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-white shadow-[0_0_60px_rgba(212,175,55,0.25)] ring-4 ring-secondary/30 overflow-hidden flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                <img
                  src="/images/rabbi-logo-transparent.webp"
                  alt="Rabbi Global Academy"
                  className="h-full w-full object-contain"
                  decoding="async"
                />
              </div>
            </Link>
            <h1 className="mt-5 text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">RABBI GLOBAL ACADEMY</h1>
            <p className="text-secondary font-script text-lg mt-1">Learn From Master</p>
            <p className="text-white/50 text-sm mt-3">Sign in to access your dashboard</p>
          </div>

          {/* Role Tabs */}
          <div className="flex rounded-2xl bg-white/10 p-1 mb-6 gap-1">
            <button
              type="button"
              onClick={() => { setRole("student"); setError(""); setLoginId(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                role === "student"
                  ? "bg-secondary text-primary shadow-md"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              Parent / Student
            </button>
            <button
              type="button"
              onClick={() => { setRole("franchise"); setError(""); setLoginId(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                role === "franchise"
                  ? "bg-secondary text-primary shadow-md"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <Building2 className="h-4 w-4" />
              Franchise / Center
            </button>
          </div>

          {/* Form card */}
          <div className="bg-white/[0.07] backdrop-blur-md border border-white/15 rounded-2xl p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">{label}</label>
                <input
                  type="text"
                  value={loginId}
                  onChange={e => setLoginId(e.target.value)}
                  placeholder={placeholder}
                  autoComplete="username"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-secondary/60 focus:bg-white/15 transition-colors"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Password"
                    autoComplete="current-password"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-12 text-white placeholder-white/30 text-sm focus:outline-none focus:border-secondary/60 focus:bg-white/15 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/15 border border-red-400/30 rounded-xl px-4 py-3 text-red-300 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-secondary text-primary font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-secondary/90 transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <span className="h-4 w-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>
          </div>

          <p className="text-center text-white/40 text-xs mt-6">
            Having trouble logging in? Contact your center administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
