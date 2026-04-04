import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/theme/ThemeContext";
import Navbar from "@/components/Navbar";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Onboard from "./pages/Onboard";
import Policy from "./pages/Policy";
import Claims from "./pages/Claims";
import Triggers from "./pages/Triggers";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import { SeedBootstrap } from "./components/SeedBootstrap";
import "./App.css";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SeedBootstrap>
          {/* ── Ambient background layer (dark mode only) ────────── */}
          <div
            className="pointer-events-none fixed inset-0 -z-10 overflow-hidden dark:block hidden"
            aria-hidden="true"
          >
            {/* Primary deep navy base */}
            <div className="absolute inset-0 bg-[#060d1f]" />
            {/* Blob 1 — blue-ish glow, top-left */}
            <div
              className="nimbus-blob-1 absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full opacity-[0.07]"
              style={{
                background:
                  "radial-gradient(circle, #63B3ED 0%, #1A365D 60%, transparent 100%)",
                filter: "blur(60px)",
              }}
            />
            {/* Blob 2 — indigo, bottom-right */}
            <div
              className="nimbus-blob-2 absolute -bottom-60 -right-40 h-[700px] w-[700px] rounded-full opacity-[0.06]"
              style={{
                background:
                  "radial-gradient(circle, #4C6EF5 0%, #0A0F1E 60%, transparent 100%)",
                filter: "blur(80px)",
              }}
            />
            {/* Blob 3 — cyan accent, center */}
            <div
              className="nimbus-blob-3 absolute left-1/3 top-1/3 h-[400px] w-[400px] rounded-full opacity-[0.04]"
              style={{
                background:
                  "radial-gradient(circle, #76E4F7 0%, transparent 70%)",
                filter: "blur(50px)",
              }}
            />
          </div>

          <BrowserRouter>
            <Navbar />
            <main className="relative z-0">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/onboard" element={<Onboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/policy" element={<Policy />} />
                <Route path="/claims" element={<Claims />} />
                <Route path="/triggers" element={<Triggers />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </BrowserRouter>
        </SeedBootstrap>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
