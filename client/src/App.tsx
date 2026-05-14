import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AppLayout from "./components/AppLayout";
import DailyFeed from "./pages/DailyFeed";
import Editions from "./pages/Editions";
import ReadingQueue from "./pages/ReadingQueue";
import ConversationTracker from "./pages/ConversationTracker";
import ExplorePage from "./pages/ExplorePage";
import WeeklyComparison from "./pages/WeeklyComparison";
import About from "./pages/About";
import StoryPage from "./pages/StoryPage";
import AdminDashboard from "./pages/AdminDashboard";
import { OnboardingModal } from "./components/OnboardingModal";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "./contexts/ThemeContext";

function ThemedToaster() {
  const { theme } = useTheme();
  return (
    <Toaster
      theme={theme}
      position="bottom-right"
      toastOptions={{
        style: theme === "dark"
          ? { background: "oklch(0.16 0.018 260)", color: "oklch(0.93 0.005 80)", border: "1px solid rgba(255,255,255,0.06)" }
          : { background: "oklch(1 0 0)", color: "oklch(0.18 0.02 260)", border: "1px solid rgba(0,0,0,0.08)" },
      }}
    />
  );
}

function KeyboardShortcuts() {
  const [, navigate] = useLocation();
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "/") {
        e.preventDefault();
        navigate("/explore");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);
  return null;
}

function RouteContent() {
  const [location] = useLocation();
  const prefersReduced = typeof window !== "undefined"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={location}
        initial={prefersReduced ? {} : { opacity: 0 }}
        animate={prefersReduced ? {} : { opacity: 1 }}
        exit={prefersReduced ? {} : { opacity: 0 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        style={{ minHeight: 0, position: "relative" }}
      >
        <Switch>
          <Route path={"/"} component={DailyFeed} />
          <Route path={"/editions"} component={Editions} />
          <Route path={"/queue"} component={ReadingQueue} />
          {/* /tracker is the canonical route; /conversations is an alias */}
          <Route path={"/tracker"} component={ConversationTracker} />
          <Route path={"/conversations"} component={ConversationTracker} />
          {/* Unified Explore page replaces /search and /topics */}
          <Route path={"/explore"} component={ExplorePage} />
          <Route path={"/explore/:category"} component={ExplorePage} />
          {/* Legacy redirects */}
          <Route path={"/search"}><Redirect to="/explore" /></Route>
          <Route path={"/topics"}><Redirect to="/explore" /></Route>
          <Route path={"/topics/:category"}>{(params) => <Redirect to={`/explore/${params.category}`} />}</Route>
          <Route path={"/notes"}><Redirect to="/" /></Route>
          <Route path={"/trends"} component={WeeklyComparison} />
          <Route path={"/about"} component={About} />
          <Route path={"/admin"} component={AdminDashboard} />
          <Route path={"/story/:id"} component={StoryPage} />
          <Route path={"/404"} component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </motion.div>
    </AnimatePresence>
  );
}

function Router() {
  return (
    <AppLayout>
      <KeyboardShortcuts />
      <RouteContent />
    </AppLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable={true}>
        <TooltipProvider>
          <ThemedToaster />
          <Router />
          <OnboardingModal />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
