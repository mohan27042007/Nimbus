import { Link, useLocation } from "react-router-dom";
import { Sun, Moon, Menu, X, Cloud } from "lucide-react";
import { useTheme } from "@/theme/ThemeContext";
import { useMLStatus } from "@/hooks/useMLApi";
import { useState, useEffect } from "react";

const navLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/policy", label: "Policy" },
  { to: "/claims", label: "Claims" },
  { to: "/triggers", label: "Triggers" },
  { to: "/admin", label: "Admin" },
];

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { mlOnline, checkStatus } = useMLStatus();

  // Check ML status once on mount
  useEffect(() => {
    checkStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl dark:border-white/[0.06] dark:bg-[#060d1f]/80">
      <div className="mx-auto max-w-6xl px-4 flex items-center justify-between h-16">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <Cloud className="h-5 w-5 text-primary transition-transform group-hover:scale-110" />
          <span className="text-base font-bold tracking-widest text-primary">
            NIMBUS
          </span>
          <span className="hidden sm:inline text-[11px] text-muted-foreground ml-0.5 font-medium tracking-wide">
            AI Parametric Insurance
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-0.5">
          {navLinks.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={[
                  "relative px-3.5 py-1.5 text-sm font-medium rounded-lg transition-all duration-200",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5",
                ].join(" ")}
              >
                {link.label}
                {active && (
                  <span className="absolute inset-x-3 -bottom-px h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
                )}
              </Link>
            );
          })}

          {/* AI Online badge */}
          {mlOnline !== null && (
            <div
              className={[
                "ml-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide",
                mlOnline
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-red-500/10 text-red-400 border border-red-500/20",
              ].join(" ")}
            >
              <span
                className={[
                  "h-1.5 w-1.5 rounded-full",
                  mlOnline ? "bg-emerald-400 ai-pulse-dot" : "bg-red-400",
                ].join(" ")}
              />
              {mlOnline ? "AI Online" : "AI Offline"}
            </div>
          )}

          <button
            onClick={toggleTheme}
            className="ml-1 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all duration-200"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card/95 backdrop-blur-xl dark:border-white/[0.06] dark:bg-[#060d1f]/95 px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={[
                "block px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                location.pathname === link.to
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5",
              ].join(" ")}
            >
              {link.label}
            </Link>
          ))}

          {/* Mobile AI badge */}
          {mlOnline !== null && (
            <div className="px-3 py-2">
              <div
                className={[
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold",
                  mlOnline
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20",
                ].join(" ")}
              >
                <span
                  className={[
                    "h-1.5 w-1.5 rounded-full",
                    mlOnline ? "bg-emerald-400 ai-pulse-dot" : "bg-red-400",
                  ].join(" ")}
                />
                {mlOnline ? "AI Online" : "AI Offline"}
              </div>
            </div>
          )}

          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground w-full rounded-lg hover:bg-white/5 transition-colors"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
