/**
 * SubscribeForm — compact email capture widget.
 * Used in the sidebar, homepage hero, and story pages.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";

interface SubscribeFormProps {
  source?: string;
  /** Compact = single-line email + button. Full = name + email stacked. */
  variant?: "compact" | "full";
  className?: string;
}

export function SubscribeForm({ source = "homepage", variant = "compact", className = "" }: SubscribeFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [done, setDone] = useState(false);
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);
  const [error, setError] = useState("");

  const subscribe = trpc.subscribers.subscribe.useMutation({
    onSuccess: (data) => {
      setDone(true);
      setAlreadySubscribed(data.alreadySubscribed ?? false);
      setError("");
    },
    onError: (e) => {
      setError(e.message || "Something went wrong. Please try again.");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setError("");
    subscribe.mutate({ email: email.trim(), name: name.trim() || undefined, source });
  }

  if (done) {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "rgba(52,211,153,0.9)" }} />
        <p className="text-sm" style={{ color: "rgba(245,238,220,0.75)" }}>
          {alreadySubscribed
            ? "You're already on the list."
            : "You're in. Briefings land at 7am AEST."}
        </p>
      </div>
    );
  }

  if (variant === "full") {
    return (
      <form onSubmit={handleSubmit} className={`space-y-3 ${className}`}>
        <input
          type="text"
          placeholder="First name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(245,238,220,0.9)",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(245,166,35,0.4)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
        />
        <input
          type="email"
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(245,238,220,0.9)",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(245,166,35,0.4)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
        />
        {error && (
          <p className="text-xs" style={{ color: "rgba(251,113,133,0.9)" }}>{error}</p>
        )}
        <button
          type="submit"
          disabled={subscribe.isPending || !email.trim()}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all"
          style={{
            background: subscribe.isPending || !email.trim() ? "rgba(245,166,35,0.15)" : "rgba(245,166,35,0.18)",
            border: "1px solid rgba(245,166,35,0.35)",
            color: "rgba(245,166,35,0.95)",
            cursor: subscribe.isPending || !email.trim() ? "not-allowed" : "pointer",
          }}
          onMouseEnter={(e) => { if (!subscribe.isPending && email.trim()) e.currentTarget.style.background = "rgba(245,166,35,0.28)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(245,166,35,0.18)"; }}
        >
          {subscribe.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Mail className="w-4 h-4" />
          )}
          {subscribe.isPending ? "Subscribing..." : "Get the daily briefing"}
        </button>
        <p className="text-center font-mono uppercase tracking-widest" style={{ fontSize: "8px", color: "rgba(245,238,220,0.2)" }}>
          Free. 7am AEST. No spam.
        </p>
      </form>
    );
  }

  // Compact: single-line
  return (
    <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
      <input
        type="email"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="flex-1 min-w-0 px-3 py-2 rounded-lg text-xs outline-none transition-all"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "rgba(245,238,220,0.9)",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(245,166,35,0.4)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
      />
      <button
        type="submit"
        disabled={subscribe.isPending || !email.trim()}
        className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
        style={{
          background: "rgba(245,166,35,0.15)",
          border: "1px solid rgba(245,166,35,0.3)",
          color: "rgba(245,166,35,0.9)",
          cursor: subscribe.isPending || !email.trim() ? "not-allowed" : "pointer",
        }}
        onMouseEnter={(e) => { if (!subscribe.isPending && email.trim()) e.currentTarget.style.background = "rgba(245,166,35,0.25)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(245,166,35,0.15)"; }}
      >
        {subscribe.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Subscribe"}
      </button>
      {error && (
        <p className="text-xs mt-1 w-full" style={{ color: "rgba(251,113,133,0.9)" }}>{error}</p>
      )}
    </form>
  );
}
