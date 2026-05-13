import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "40px 24px",
            background: "oklch(0.09 0.018 260)",
          }}
        >
          {/* Ambient glow */}
          <div
            style={{
              position: "fixed",
              top: "30%",
              left: "50%",
              transform: "translateX(-50%)",
              width: "600px",
              height: "400px",
              background: "radial-gradient(ellipse, rgba(245,166,35,0.04) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              maxWidth: "480px",
              width: "100%",
              textAlign: "center",
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* Amber rule at top */}
            <div
              style={{
                width: "60px",
                height: "2px",
                background: "linear-gradient(90deg, rgba(245,166,35,0.8), rgba(245,166,35,0.2))",
                boxShadow: "0 0 12px rgba(245,166,35,0.3)",
                marginBottom: "32px",
                borderRadius: "1px",
              }}
            />

            {/* Icon */}
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "14px",
                background: "rgba(245,166,35,0.08)",
                border: "1px solid rgba(245,166,35,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "24px",
                boxShadow: "0 0 24px rgba(245,166,35,0.1)",
              }}
            >
              <AlertTriangle
                style={{ width: "24px", height: "24px", color: "rgba(245,166,35,0.85)" }}
              />
            </div>

            {/* Eyebrow */}
            <span
              className="font-mono uppercase tracking-[0.22em]"
              style={{
                fontSize: "8px",
                fontWeight: 700,
                color: "rgba(245,166,35,0.6)",
                marginBottom: "12px",
                display: "block",
              }}
            >
              Signal Interrupted
            </span>

            {/* Heading */}
            <h1
              className="font-serif font-bold"
              style={{
                fontSize: "clamp(22px, 4vw, 28px)",
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
                color: "rgba(245,238,220,0.95)",
                marginBottom: "12px",
              }}
            >
              Something went wrong.
            </h1>

            {/* Body */}
            <p
              style={{
                fontSize: "13px",
                color: "rgba(245,238,220,0.4)",
                lineHeight: 1.7,
                marginBottom: "32px",
                maxWidth: "360px",
              }}
            >
              An unexpected error occurred in The Desk. Reloading the page usually resolves this.
              If the problem persists, the issue has been logged.
            </p>

            {/* Error code (non-technical, no stack trace) */}
            {this.state.error?.message && (
              <div
                style={{
                  padding: "10px 16px",
                  background: "oklch(0.135 0.018 260 / 0.8)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "8px",
                  marginBottom: "28px",
                  width: "100%",
                }}
              >
                <p
                  className="font-mono"
                  style={{
                    fontSize: "11px",
                    color: "rgba(245,238,220,0.3)",
                    wordBreak: "break-word",
                  }}
                >
                  {this.state.error.message.length > 120
                    ? this.state.error.message.slice(0, 120) + "..."
                    : this.state.error.message}
                </p>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  background: "rgba(245,166,35,0.12)",
                  border: "1px solid rgba(245,166,35,0.3)",
                  borderRadius: "8px",
                  color: "rgba(245,166,35,0.9)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background 0.15s, border-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(245,166,35,0.18)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(245,166,35,0.5)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(245,166,35,0.12)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(245,166,35,0.3)";
                }}
              >
                <RotateCcw style={{ width: "14px", height: "14px" }} />
                Reload Page
              </button>

              <button
                onClick={() => { window.location.href = "/"; }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  background: "oklch(0.135 0.018 260 / 0.9)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "8px",
                  color: "rgba(245,238,220,0.55)",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "background 0.15s, border-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.16 0.018 260 / 0.9)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(245,238,220,0.14)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.135 0.018 260 / 0.9)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(245,238,220,0.08)";
                }}
              >
                <Home style={{ width: "14px", height: "14px" }} />
                Go to Today
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
