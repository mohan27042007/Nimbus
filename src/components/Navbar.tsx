import { Link, useLocation } from "react-router-dom";
import { Sun, Moon, Menu, X, Cloud } from "lucide-react";
import { useTheme } from "@/theme/ThemeContext";
import { useState } from "react";

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

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="mx-auto max-w-6xl px-4 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <Cloud className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold tracking-widest text-primary">NIMBUS</span>
          <span className="hidden sm:inline text-xs text-muted-foreground ml-1">AI Parametric Insurance</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                location.pathname === link.to
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={toggleTheme}
            className="ml-2 p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2 rounded-md text-sm font-medium ${
                location.pathname === link.to
                  ? "text-primary bg-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground w-full"
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
