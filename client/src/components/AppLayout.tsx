import { AnimatedBackground } from "./AnimatedBackground";
import { PageTransitionCanvas } from "./PageTransition";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { motion, AnimatePresence } from "framer-motion";
import {
  Newspaper,
  BookOpen,
  Bookmark,
  Compass,
  BarChart3,
  PanelLeftClose,
  PanelLeftOpen,
  LogIn,
  Menu,
  X,
  Info,
  Sun,
  Moon,
  Radio,
  ChevronUp,
  ShieldAlert,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { AuthorPanel } from "./AuthorPanel";
import { useState, useEffect, useCallback, type ReactNode } from "react";
import { useLocation, Link } from "wouter";

interface NavItem {
  path: string;
  label: string;
  icon: typeof Newspaper;
  requiresAuth?: boolean;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: "/", label: "Today", icon: Newspaper },
  { path: "/editions", label: "Editions", icon: BookOpen },
  { path: "/trends", label: "Trends", icon: BarChart3 },
  { path: "/queue", label: "Reading Queue", icon: Bookmark },
  { path: "/explore", label: "Explore", icon: Compass },
  { path: "/about", label: "About", icon: Info },
  { path: "/admin", label: "Admin", icon: ShieldAlert, requiresAuth: true },
];

// Current Sydney date
function getSydneyDate() {
  return new Date().toLocaleDateString("en-AU", {
    timeZone: "Australia/Sydney",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(getSydneyDate);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setCurrentDate(getSydneyDate()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Scroll-to-top visibility
  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    const onScroll = () => setShowScrollTop(main.scrollTop > 400);
    main.addEventListener("scroll", onScroll, { passive: true });
    return () => main.removeEventListener("scroll", onScroll);
  }, []);

  // Keyboard shortcut: [ to toggle sidebar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === "[" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        setCollapsed((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const toggleCollapse = useCallback(() => setCollapsed((p) => !p), []);

  const { data: unreadCount } = trpc.readingQueue.unreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 60_000,
  });

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.requiresAuth || isAuthenticated
  );

  return (
    <div className="min-h-screen bg-background flex flex-col relative noise-overlay overflow-x-hidden">
      {/* Animated canvas background */}
      <AnimatedBackground />
      {/* Page transition burst canvas (z-index 100, above everything) */}
      <PageTransitionCanvas />

      {/* Ambient CSS orbs */}
      <div
        className="fixed pointer-events-none overflow-hidden"
        style={{ zIndex: 0, top: 0, left: 0, right: 0, bottom: 0, maxWidth: "100vw", clipPath: "inset(0)" }}
        aria-hidden="true"
      >
        <div className="ambient-orb-1 absolute top-[-15%] right-[5%] rounded-full bg-amber-500/[0.022] blur-[140px]" style={{ width: "min(700px, 70vw)", height: "min(700px, 70vw)" }} />
        <div className="ambient-orb-2 absolute bottom-[-20%] left-[-5%] rounded-full bg-blue-600/[0.018] blur-[120px]" style={{ width: "min(600px, 60vw)", height: "min(600px, 60vw)" }} />
        <div className="ambient-orb-3 absolute top-[40%] left-[30%] rounded-full bg-indigo-500/[0.012] blur-[100px]" style={{ width: "min(400px, 40vw)", height: "min(400px, 40vw)" }} />
      </div>

      {/* Top amber rule */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/80 to-transparent origin-left shrink-0 relative"
        style={{ zIndex: 20 }}
      />

      <div className="flex flex-1 overflow-hidden relative" style={{ zIndex: 10 }}>
        {/* ─── Desktop Sidebar ─────────────────────────────────── */}
        <motion.aside
          initial={false}
          animate={{ width: collapsed ? 60 : 228 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          className="hidden lg:flex flex-col shrink-0 overflow-hidden relative"
          style={{
            borderRight: "1px solid rgba(255,255,255,0.055)",
            background: "rgba(9, 11, 20, 0.82)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          {/* Sidebar inner glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 50% 0%, rgba(245,166,35,0.04) 0%, transparent 70%)",
            }}
            aria-hidden="true"
          />

          {/* Header */}
          <div className={`relative pt-7 pb-5 ${collapsed ? "px-0 flex flex-col items-center" : "px-5"}`}>
            {!collapsed ? (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    {/* Wordmark */}
                    <div
                      className="font-serif font-bold tracking-tight leading-none"
                      style={{
                        fontSize: "18px",
                        background:
                          "linear-gradient(135deg, #f5e6c8 0%, #f5a623 50%, #e8921a 100%)",
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      The Desk
                    </div>
                    {/* By-line credit */}
                    <a
                      href="https://www.linkedin.com/in/ruben-laubscher/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block font-mono uppercase tracking-widest mt-1.5 transition-colors"
                      style={{ fontSize: "7.5px", color: "rgba(245,238,220,0.3)", letterSpacing: "0.12em" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(245,166,35,0.65)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(245,238,220,0.3)")}
                    >
                      By Ruben Laubscher
                    </a>
                    {/* Live indicator */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400" />
                      </span>
                      <span
                        className="font-mono uppercase tracking-widest"
                        style={{ fontSize: "8px", color: "rgba(245,166,35,0.55)" }}
                      >
                        Live Intelligence
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={toggleCollapse}
                    aria-label="Collapse sidebar"
                    title="Collapse sidebar ( [ )"
                    className="mt-0.5 p-1.5 rounded-md transition-all"
                    style={{ color: "rgba(245,238,220,0.25)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(245,166,35,0.7)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(245,238,220,0.25)")}
                  >
                    <PanelLeftClose className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Publication anchor: date + edition marker */}
                <div
                  className="mt-4 pt-3"
                  style={{
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div
                    className="font-mono uppercase tracking-widest mb-1"
                    style={{
                      fontSize: "8px",
                      color: "rgba(245,238,220,0.28)",
                      letterSpacing: "0.14em",
                    }}
                  >
                    {currentDate}
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      style={{
                        width: "16px",
                        height: "1.5px",
                        background: "linear-gradient(90deg, rgba(245,166,35,0.7), rgba(245,166,35,0.2))",
                        borderRadius: "999px",
                      }}
                    />
                    <span
                      className="font-mono uppercase tracking-widest"
                      style={{ fontSize: "7.5px", color: "rgba(245,166,35,0.45)", letterSpacing: "0.16em" }}
                    >
                      Daily Intelligence
                    </span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.04 }}
                className="flex flex-col items-center gap-3"
              >
                <button
                  onClick={toggleCollapse}
                  aria-label="Expand sidebar"
                  title="Expand sidebar ( [ )"
                  className="p-1.5 rounded-md transition-colors"
                  style={{ color: "rgba(245,238,220,0.3)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(245,166,35,0.8)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(245,238,220,0.3)")}
                >
                  <PanelLeftOpen className="w-3.5 h-3.5" />
                </button>
                {/* Collapsed wordmark dot */}
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.2)" }}
                >
                  <Radio className="w-3 h-3" style={{ color: "rgba(245,166,35,0.8)" }} />
                </div>
              </motion.div>
            )}
          </div>

          {/* Nav items */}
          <nav className="flex-1 overflow-y-auto py-2 space-y-px">
            {visibleItems.map((item, idx) => {
              const isActive =
                location === item.path ||
                (item.path !== "/" && location.startsWith(item.path));
              const Icon = item.icon;
              return (
                <Link key={item.path} href={item.path}>
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="relative flex items-center gap-3 transition-all duration-150 cursor-pointer group"
                    style={{
                      margin: collapsed ? "0 6px" : "0 8px",
                      padding: collapsed ? "9px 0" : "9px 12px",
                      borderRadius: "8px",
                      justifyContent: collapsed ? "center" : undefined,
                      background: isActive
                        ? "rgba(245,166,35,0.07)"
                        : "transparent",
                      color: isActive
                        ? "rgba(245,166,35,0.9)"
                        : "rgba(245,238,220,0.58)",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "rgba(245,238,220,0.04)";
                        e.currentTarget.style.color = "rgba(245,238,220,0.88)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "rgba(245,238,220,0.58)";
                      }
                    }}
                    title={collapsed ? item.label : undefined}
                  >
                    {/* Active left indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-r-full"
                        style={{ background: "rgba(245,166,35,0.8)" }}
                      />
                    )}
                    <div className="relative shrink-0">
                      <Icon className="w-[14px] h-[14px]" />
                      {collapsed && item.path === "/queue" && unreadCount && unreadCount > 0 ? (
                        <span
                          className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full"
                          style={{ background: "#f5a623" }}
                        />
                      ) : null}
                    </div>
                    {!collapsed && (
                      <>
                        <span
                          className="flex-1 truncate"
                          style={{
                            fontSize: "13px",
                            fontWeight: isActive ? 600 : 400,
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {item.label}
                        </span>
                        {item.path === "/queue" && unreadCount && unreadCount > 0 ? (
                          <span
                            className="ml-auto font-mono text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{
                              background: "rgba(245,166,35,0.12)",
                              color: "rgba(245,166,35,0.9)",
                              border: "1px solid rgba(245,166,35,0.18)",
                            }}
                          >
                            {unreadCount}
                          </span>
                        ) : null}
                      </>
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </nav>

          {/* Footer: AuthorPanel + sign-in + shortcuts */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            {/* Author panel — always shown, adapts to collapsed state */}
            <AuthorPanel collapsed={collapsed} />

            {!collapsed && (
              <div className="px-5 pb-4">
                {/* Sign-in / user row */}
                {isAuthenticated ? (
                  <div className="flex items-center gap-2.5 mb-3">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: "rgba(245,166,35,0.12)",
                        border: "1px solid rgba(245,166,35,0.2)",
                      }}
                    >
                      <span
                        className="font-semibold"
                        style={{ fontSize: "9px", color: "rgba(245,166,35,0.9)" }}
                      >
                        {user?.name?.[0]?.toUpperCase() || "R"}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: "rgba(245,238,220,0.6)" }}>
                        {user?.name || "Ruben"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <a
                    href={getLoginUrl()}
                    className="flex items-center gap-2 mb-3 transition-colors"
                    style={{ color: "rgba(245,238,220,0.35)", fontSize: "12px" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(245,166,35,0.8)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(245,238,220,0.35)")}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Sign in
                  </a>
                )}
                {/* Keyboard shortcut hints */}
                <div className="flex items-center gap-2 mb-2">
                  {[["J", "next"], ["K", "prev"], ["S", "save"]].map(([key, label]) => (
                    <div key={key} className="flex items-center gap-1">
                      <kbd
                        className="font-mono inline-flex items-center justify-center rounded"
                        style={{ fontSize: "8px", padding: "1px 4px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(245,238,220,0.4)", lineHeight: 1.4 }}
                      >{key}</kbd>
                      <span style={{ fontSize: "7px", color: "rgba(245,238,220,0.2)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <p
                    className="font-mono uppercase tracking-widest"
                    style={{ fontSize: "7.5px", color: "rgba(245,238,220,0.2)" }}
                  >
                    7am AEST daily
                  </p>
                  {toggleTheme && (
                    <button
                      onClick={toggleTheme}
                      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                      className="p-1.5 rounded-md transition-all"
                      style={{ color: "rgba(245,238,220,0.3)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(245,238,220,0.7)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(245,238,220,0.3)")}
                    >
                      {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.aside>

        {/* ─── Mobile Sidebar ──────────────────────────────────── */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
                className="lg:hidden fixed inset-0 z-30"
                style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="lg:hidden fixed left-0 top-0 bottom-0 z-40 w-60 flex flex-col"
                style={{
                  background: "rgba(9, 11, 20, 0.96)",
                  backdropFilter: "blur(24px)",
                  borderRight: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="px-5 pt-7 pb-4">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <div
                        className="font-serif font-bold tracking-tight"
                        style={{
                          fontSize: "17px",
                          background: "linear-gradient(135deg, #f5e6c8 0%, #f5a623 60%, #e8921a 100%)",
                          WebkitBackgroundClip: "text",
                          backgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        The Desk
                      </div>
                      <a
                        href="https://www.linkedin.com/in/ruben-laubscher/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block font-mono uppercase tracking-widest mt-1 transition-colors"
                        style={{ fontSize: "7.5px", color: "rgba(245,238,220,0.3)" }}
                      >
                        By Ruben Laubscher
                      </a>
                    </div>
                    <button
                      onClick={() => setMobileOpen(false)}
                      aria-label="Close navigation menu"
                      className="p-1.5 rounded-md transition-colors"
                      style={{ color: "rgba(245,238,220,0.4)" }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <nav className="flex-1 overflow-y-auto py-1 space-y-px px-2">
                  {visibleItems.map((item) => {
                    const isActive = location === item.path ||
                      (item.path !== "/" && location.startsWith(item.path));
                    const Icon = item.icon;
                    return (
                      <Link key={item.path} href={item.path} onClick={() => setMobileOpen(false)}>
                        <motion.div
                          whileTap={{ scale: 0.97 }}
                          className="relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer"
                          style={{
                            background: isActive ? "rgba(245,166,35,0.08)" : "transparent",
                            color: isActive ? "rgba(245,166,35,0.9)" : "rgba(245,238,220,0.5)",
                          }}
                        >
                          {/* Active left indicator */}
                          {isActive && (
                            <motion.div
                              layoutId="mobile-nav-indicator"
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-r-full"
                              style={{ background: "rgba(245,166,35,0.8)" }}
                            />
                          )}
                          <Icon className="w-[14px] h-[14px] shrink-0" />
                          <span style={{ fontSize: "13px", fontWeight: isActive ? 500 : 400 }}>
                            {item.label}
                          </span>
                        </motion.div>
                      </Link>
                    );
                  })}
                </nav>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ─── Main Content ─────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
          {/* Mobile header */}
          <div
            className="lg:hidden sticky top-0 z-20 flex items-center gap-3 px-4 py-3"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(9,11,20,0.92)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
          >
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="p-2 rounded-lg transition-colors"
              style={{
                color: "rgba(245,238,220,0.6)",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <Menu className="w-4 h-4" />
            </button>
            <div
              className="font-serif font-bold tracking-tight"
              style={{
                fontSize: "16px",
                background: "linear-gradient(135deg, #f5e6c8 0%, #f5a623 60%, #e8921a 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              The Desk
            </div>
          </div>

          {/* Signature amber rule — brand's defining visual element */}
          <div
            aria-hidden="true"
            style={{
              height: "2px",
              background: "linear-gradient(90deg, transparent 0%, rgba(245,166,35,0.15) 5%, rgba(245,166,35,0.85) 25%, rgba(255,200,80,1) 50%, rgba(245,166,35,0.85) 75%, rgba(245,166,35,0.15) 95%, transparent 100%)",
              boxShadow: "0 0 20px 4px rgba(245,166,35,0.25), 0 0 60px 8px rgba(245,166,35,0.08)",
              flexShrink: 0,
            }}
          />

          {/* Page content */}
          <div className="p-2 sm:p-7 lg:p-8 pb-28 lg:pb-8 overflow-x-hidden min-w-0">{children}</div>
        </main>
      </div>

      {/* ─── Mobile Bottom Tab Bar ─────────────────────────── */}
      <motion.nav
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: "rgba(9, 11, 20, 0.95)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 -4px 32px rgba(0,0,0,0.4)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
        aria-label="Mobile navigation"
      >
        {/* Amber top rule */}
        <div
          style={{
            height: "1px",
            background: "linear-gradient(90deg, transparent 0%, rgba(245,166,35,0.4) 30%, rgba(245,166,35,0.7) 50%, rgba(245,166,35,0.4) 70%, transparent 100%)",
          }}
        />
        <div className="flex items-center justify-around px-1 py-1.5">
          {[
            { path: "/", label: "Today", icon: Newspaper },
            { path: "/editions", label: "Editions", icon: BookOpen },
            { path: "/queue", label: "Queue", icon: Bookmark },
            { path: "/explore", label: "Explore", icon: Compass },
          ].map((item) => {
            const isActive = location === item.path ||
              (item.path !== "/" && location.startsWith(item.path));
            const Icon = item.icon;
            return (
              <Link key={item.path} href={item.path}>
                <motion.div
                  whileTap={{ scale: 0.88 }}
                  className="relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl cursor-pointer transition-all"
                  style={{ minWidth: 52 }}
                >
                  {/* Active amber dot indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="bottom-tab-indicator"
                      className="absolute top-0.5 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full"
                      style={{ background: "rgba(245,166,35,0.9)" }}
                    />
                  )}
                  <Icon
                    className="w-5 h-5 transition-all duration-200"
                    style={{
                      color: isActive ? "rgba(245,166,35,0.95)" : "rgba(245,238,220,0.38)",
                      transform: isActive ? "scale(1.08)" : "scale(1)",
                    }}
                  />
                  <span
                    className="font-mono uppercase tracking-wider transition-all duration-200"
                    style={{
                      fontSize: "9px",
                      color: isActive ? "rgba(245,166,35,0.85)" : "rgba(245,238,220,0.3)",
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    {item.label}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </motion.nav>

      {/* ─── Scroll to Top ─────────────────────────────────── */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            key="scroll-top"
            initial={{ opacity: 0, scale: 0.7, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 12 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => {
              const main = document.querySelector("main");
              main?.scrollTo({ top: 0, behavior: "smooth" });
            }}
            aria-label="Scroll to top"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="fixed z-50 lg:bottom-6 lg:right-6 bottom-24 right-4"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "rgba(245,166,35,0.12)",
              border: "1px solid rgba(245,166,35,0.35)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.4), 0 0 12px rgba(245,166,35,0.15)",
              color: "rgba(245,166,35,0.9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <ChevronUp className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
