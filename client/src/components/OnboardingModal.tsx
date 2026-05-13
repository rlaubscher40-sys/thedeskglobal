import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Users,
  Keyboard,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Radio,
  Zap,
} from "lucide-react";

const ONBOARDING_KEY = "signal_onboarding_v1";

interface Step {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  body: string;
  detail?: React.ReactNode;
}

const STEPS: Step[] = [
  {
    icon: <Radio className="w-5 h-5" />,
    eyebrow: "Welcome to The Desk",
    title: "Your daily intelligence briefing",
    body: "Every morning at 7am AEST, The Desk scans what's trending across property, macro, policy, and markets and filters it through the lens of what matters for your partner conversations.",
    detail: (
      <div
        className="mt-5"
        style={{
          padding: "16px 20px",
          background: "linear-gradient(135deg, rgba(245,166,35,0.07) 0%, rgba(245,166,35,0.03) 100%)",
          border: "1px solid rgba(245,166,35,0.2)",
          borderRadius: "10px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, rgba(245,166,35,0.4) 0%, transparent 70%)" }} />
        <p style={{ fontSize: "12px", color: "rgba(245,238,220,0.5)", lineHeight: 1.65 }}>
          Each story comes with a{" "}
          <span style={{ color: "rgba(245,166,35,0.9)", fontWeight: 600 }}>Say This</span>{" "}
          line -- a ready-to-use conversation opener you can drop into a partner meeting without sounding like you're reading from a script.
        </p>
      </div>
    ),
  },
  {
    icon: <Users className="w-5 h-5" />,
    eyebrow: "Persona switcher",
    title: "Filter by who you're talking to",
    body: "Use the persona pills at the top of the feed to switch between Institutional, Broker, Adviser, and Buyers Agent. The talking points update to match the audience you're preparing for.",
    detail: (
      <div className="mt-5 flex flex-wrap gap-2">
        {["Institutional", "Broker", "Adviser", "Buyers Agent"].map((p, i) => (
          <motion.span
            key={p}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            style={{
              padding: "5px 14px",
              fontSize: "9px",
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              borderRadius: "999px",
              border: i === 0 ? "1px solid rgba(245,166,35,0.4)" : "1px solid rgba(255,255,255,0.1)",
              background: i === 0 ? "rgba(245,166,35,0.12)" : "rgba(255,255,255,0.04)",
              color: i === 0 ? "rgba(245,166,35,0.95)" : "rgba(245,238,220,0.45)",
            }}
          >
            {p}
          </motion.span>
        ))}
      </div>
    ),
  },
  {
    icon: <Keyboard className="w-5 h-5" />,
    eyebrow: "Keyboard shortcuts",
    title: "Navigate without lifting your hands",
    body: "The Desk is built for speed. Use keyboard shortcuts to move through the feed, save stories, and jump to search so you can scan the whole feed in under 60 seconds.",
    detail: (
      <div className="mt-5 grid grid-cols-2 gap-2">
        {[
          { key: "j / k", desc: "Next / prev card" },
          { key: "s", desc: "Save to reading queue" },
          { key: "/", desc: "Jump to search" },
          { key: "[", desc: "Toggle sidebar" },
        ].map(({ key, desc }, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 12px",
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "8px",
            }}
          >
            <kbd
              style={{
                padding: "3px 8px",
                fontSize: "9px",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "5px",
                color: "rgba(245,238,220,0.85)",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {key}
            </kbd>
            <span style={{ fontSize: "11px", color: "rgba(245,238,220,0.42)" }}>{desc}</span>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    icon: <BookOpen className="w-5 h-5" />,
    eyebrow: "You're all set",
    title: "Start with today's feed",
    body: "Bookmark stories to your Reading Queue, take weekly notes on what stood out, and track which talking points you've used in conversations. The Desk gets more useful the more you use it.",
    detail: null,
  },
];

// Particle burst component
function ParticleBurst({ active }: { active: boolean }) {
  const particles = Array.from({ length: 16 }, (_, i) => ({
    angle: (i / 16) * 360,
    distance: 60 + Math.random() * 40,
    size: 2 + Math.random() * 3,
    delay: Math.random() * 0.1,
    color: i % 3 === 0 ? "rgba(245,166,35,0.9)" : i % 3 === 1 ? "rgba(245,200,80,0.7)" : "rgba(245,238,220,0.5)",
  }));

  return (
    <AnimatePresence>
      {active && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          {particles.map((p, i) => {
            const rad = (p.angle * Math.PI) / 180;
            const x = Math.cos(rad) * p.distance;
            const y = Math.sin(rad) * p.distance;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                animate={{ opacity: 0, x, y, scale: 0 }}
                exit={{}}
                transition={{ duration: 0.65, delay: p.delay, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  position: "absolute",
                  width: p.size,
                  height: p.size,
                  borderRadius: "50%",
                  background: p.color,
                  transform: "translate(-50%, -50%)",
                  boxShadow: `0 0 6px ${p.color}`,
                }}
              />
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
}

export function OnboardingModal() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [burstActive, setBurstActive] = useState(false);
  const completingRef = useRef(false);

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) {
      const t = setTimeout(() => setVisible(true), 700);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(ONBOARDING_KEY, "done");
    setVisible(false);
    setCompleting(false);
    completingRef.current = false;
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else if (!completingRef.current) {
      // Final step -- trigger burst then dismiss
      completingRef.current = true;
      setCompleting(true);
      setBurstActive(true);
      setTimeout(() => setBurstActive(false), 800);
      setTimeout(() => dismiss(), 1800);
    }
  };

  const prev = () => setStep((s) => Math.max(0, s - 1));
  const current = STEPS[step];
  const isFinalStep = step === STEPS.length - 1;

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.72)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              zIndex: 50,
            }}
            onClick={dismiss}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            style={{
              position: "fixed",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 51,
              padding: "16px",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                pointerEvents: "auto",
                width: "100%",
                maxWidth: "480px",
                background: completing
                  ? "oklch(0.15 0.025 78 / 0.97)"
                  : "oklch(0.13 0.018 260 / 0.97)",
                border: completing
                  ? "1px solid rgba(245,166,35,0.3)"
                  : "1px solid rgba(245,238,220,0.09)",
                borderRadius: "18px",
                boxShadow: completing
                  ? "0 24px 80px rgba(0,0,0,0.8), 0 0 60px rgba(245,166,35,0.15), 0 0 0 1px rgba(245,166,35,0.2), inset 0 1px 0 rgba(245,166,35,0.15)"
                  : "0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(245,166,35,0.06), inset 0 1px 0 rgba(255,255,255,0.06)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                overflow: "hidden",
                position: "relative",
                transition: "background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Amber top rule */}
              <motion.div
                animate={completing ? { scaleX: 1, opacity: 1 } : { scaleX: 0.5, opacity: 0.7 }}
                transition={{ duration: 0.5 }}
                style={{
                  height: "2px",
                  background: completing
                    ? "linear-gradient(90deg, rgba(245,166,35,1) 0%, rgba(245,200,80,0.8) 50%, rgba(245,166,35,0.4) 100%)"
                    : "linear-gradient(90deg, rgba(245,166,35,0.85) 0%, rgba(245,166,35,0.2) 50%, transparent 100%)",
                  transformOrigin: "left",
                  boxShadow: completing ? "0 0 12px rgba(245,166,35,0.5)" : "none",
                  transition: "box-shadow 0.4s ease",
                }}
              />

              {/* Radial pulse on completion */}
              <AnimatePresence>
                {completing && (
                  <>
                    <motion.div
                      initial={{ opacity: 0.6, scale: 0.3 }}
                      animate={{ opacity: 0, scale: 2.5 }}
                      exit={{}}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "200px",
                        height: "200px",
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(245,166,35,0.25) 0%, transparent 70%)",
                        pointerEvents: "none",
                        zIndex: 5,
                      }}
                    />
                    <motion.div
                      initial={{ opacity: 0.4, scale: 0.2 }}
                      animate={{ opacity: 0, scale: 3 }}
                      exit={{}}
                      transition={{ duration: 1.0, delay: 0.1, ease: "easeOut" }}
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "200px",
                        height: "200px",
                        borderRadius: "50%",
                        border: "1px solid rgba(245,166,35,0.4)",
                        pointerEvents: "none",
                        zIndex: 5,
                      }}
                    />
                  </>
                )}
              </AnimatePresence>

              {/* Ambient glow */}
              <div
                style={{
                  position: "absolute",
                  top: "-60px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "200px",
                  height: "120px",
                  background: completing
                    ? "radial-gradient(ellipse, rgba(245,166,35,0.18) 0%, transparent 70%)"
                    : "radial-gradient(ellipse, rgba(245,166,35,0.08) 0%, transparent 70%)",
                  pointerEvents: "none",
                  transition: "background 0.4s ease",
                }}
              />

              <div style={{ padding: "28px 32px 28px", position: "relative", zIndex: 6 }}>
                {/* Header row */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px" }}>
                  <motion.div
                    animate={completing ? { scale: [1, 1.15, 1], rotate: [0, 8, -8, 0] } : {}}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "11px",
                      background: completing ? "rgba(245,166,35,0.2)" : "rgba(245,166,35,0.1)",
                      border: completing ? "1px solid rgba(245,166,35,0.5)" : "1px solid rgba(245,166,35,0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "rgba(245,166,35,0.9)",
                      boxShadow: completing ? "0 0 32px rgba(245,166,35,0.3)" : "0 0 20px rgba(245,166,35,0.12)",
                      transition: "all 0.4s ease",
                      position: "relative",
                    }}
                  >
                    <AnimatePresence mode="wait">
                      {completing ? (
                        <motion.div
                          key="zap"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          transition={{ duration: 0.25 }}
                        >
                          <Zap className="w-5 h-5" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="step-icon"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          transition={{ duration: 0.2 }}
                        >
                          {current.icon}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {/* Particle burst origin */}
                    <ParticleBurst active={burstActive} />
                  </motion.div>
                  <button
                    onClick={dismiss}
                    aria-label="Close onboarding"
                    style={{
                      padding: "6px",
                      color: "rgba(245,238,220,0.3)",
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: "7px",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color = "rgba(245,238,220,0.7)";
                      e.currentTarget.style.borderColor = "rgba(245,238,220,0.15)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = "rgba(245,238,220,0.3)";
                      e.currentTarget.style.borderColor = "rgba(245,238,220,0.07)";
                    }}
                  >
                    <X style={{ width: "14px", height: "14px" }} />
                  </button>
                </div>

                {/* Step content */}
                <AnimatePresence mode="wait">
                  {completing ? (
                    <motion.div
                      key="completion"
                      initial={{ opacity: 0, scale: 0.95, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -8 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <p
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "8px",
                          fontWeight: 700,
                          letterSpacing: "0.22em",
                          textTransform: "uppercase",
                          color: "rgba(245,166,35,0.8)",
                          marginBottom: "10px",
                        }}
                      >
                        Signal Activated
                      </p>
                      <h2
                        style={{
                          fontFamily: "var(--font-serif)",
                          fontSize: "24px",
                          fontWeight: 700,
                          letterSpacing: "-0.02em",
                          lineHeight: 1.2,
                          color: "rgba(245,238,220,0.97)",
                          marginBottom: "12px",
                        }}
                      >
                        You're in. Let's get to work.
                      </h2>
                      <p style={{ fontSize: "13px", color: "rgba(245,238,220,0.5)", lineHeight: 1.7 }}>
                        Your first briefing is ready. The feed updates every morning at 7am AEST.
                      </p>
                      {/* Animated amber rule */}
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                          marginTop: "20px",
                          height: "1px",
                          background: "linear-gradient(90deg, rgba(245,166,35,0.7) 0%, rgba(245,166,35,0.2) 60%, transparent 100%)",
                          transformOrigin: "left",
                          boxShadow: "0 0 8px rgba(245,166,35,0.3)",
                        }}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, x: 14 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -14 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                    >
                      <p
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "8px",
                          fontWeight: 700,
                          letterSpacing: "0.22em",
                          textTransform: "uppercase",
                          color: "rgba(245,166,35,0.6)",
                          marginBottom: "10px",
                        }}
                      >
                        {current.eyebrow}
                      </p>
                      <h2
                        style={{
                          fontFamily: "var(--font-serif)",
                          fontSize: "22px",
                          fontWeight: 700,
                          letterSpacing: "-0.02em",
                          lineHeight: 1.2,
                          color: "rgba(245,238,220,0.97)",
                          marginBottom: "12px",
                        }}
                      >
                        {current.title}
                      </h2>
                      <p style={{ fontSize: "13px", color: "rgba(245,238,220,0.45)", lineHeight: 1.7 }}>
                        {current.body}
                      </p>
                      {current.detail}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Footer */}
                {!completing && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "28px" }}>
                    {/* Step dots */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {STEPS.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setStep(i)}
                          aria-label={`Go to step ${i + 1}`}
                          style={{
                            height: "5px",
                            width: i === step ? "20px" : "5px",
                            borderRadius: "999px",
                            background: i === step ? "rgba(245,166,35,0.85)" : "rgba(255,255,255,0.15)",
                            border: "none",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            padding: 0,
                          }}
                        />
                      ))}
                    </div>

                    {/* Nav buttons */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {step > 0 && (
                        <button
                          onClick={prev}
                          aria-label="Previous step"
                          style={{
                            padding: "8px",
                            color: "rgba(245,238,220,0.4)",
                            background: "transparent",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "8px",
                            cursor: "pointer",
                            transition: "all 0.15s",
                            display: "flex",
                            alignItems: "center",
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.color = "rgba(245,238,220,0.75)";
                            e.currentTarget.style.borderColor = "rgba(245,238,220,0.18)";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.color = "rgba(245,238,220,0.4)";
                            e.currentTarget.style.borderColor = "rgba(245,238,220,0.08)";
                          }}
                        >
                          <ChevronLeft style={{ width: "15px", height: "15px" }} />
                        </button>
                      )}
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={next}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: isFinalStep ? "9px 24px" : "9px 20px",
                          fontSize: "12px",
                          fontWeight: 600,
                          background: isFinalStep
                            ? "linear-gradient(135deg, rgba(245,166,35,0.28) 0%, rgba(245,166,35,0.16) 100%)"
                            : "linear-gradient(135deg, rgba(245,166,35,0.18) 0%, rgba(245,166,35,0.1) 100%)",
                          color: "rgba(245,166,35,0.95)",
                          border: isFinalStep
                            ? "1px solid rgba(245,166,35,0.5)"
                            : "1px solid rgba(245,166,35,0.35)",
                          borderRadius: "9px",
                          cursor: "pointer",
                          transition: "all 0.15s",
                          boxShadow: isFinalStep
                            ? "0 0 28px rgba(245,166,35,0.15)"
                            : "0 0 20px rgba(245,166,35,0.08)",
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = "linear-gradient(135deg, rgba(245,166,35,0.25) 0%, rgba(245,166,35,0.15) 100%)";
                          e.currentTarget.style.boxShadow = "0 0 28px rgba(245,166,35,0.15)";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = isFinalStep
                            ? "linear-gradient(135deg, rgba(245,166,35,0.28) 0%, rgba(245,166,35,0.16) 100%)"
                            : "linear-gradient(135deg, rgba(245,166,35,0.18) 0%, rgba(245,166,35,0.1) 100%)";
                          e.currentTarget.style.boxShadow = isFinalStep
                            ? "0 0 28px rgba(245,166,35,0.15)"
                            : "0 0 20px rgba(245,166,35,0.08)";
                        }}
                      >
                        {isFinalStep ? (
                          <>
                            <Zap style={{ width: "13px", height: "13px" }} />
                            Activate Signal
                          </>
                        ) : (
                          <>Next <ChevronRight style={{ width: "14px", height: "14px" }} /></>
                        )}
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
