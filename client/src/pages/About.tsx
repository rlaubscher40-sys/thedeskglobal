import { motion } from "framer-motion";
import { Newspaper, Target, Users, Zap, ExternalLink, ArrowRight } from "lucide-react";
import { Link } from "wouter";

const HERO_IMAGE = "/manus-storage/the-signal-archive/static/Generatedimage1_b6b17d2e.png";

export default function About() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="max-w-2xl"
    >
      {/* Hero image header */}
      <div
        style={{
          position: "relative",
          borderRadius: "16px",
          overflow: "hidden",
          marginBottom: "40px",
          minHeight: "240px",
        }}
      >
        {/* Background image */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${HERO_IMAGE})`,
            backgroundSize: "cover",
            backgroundPosition: "center 30%",
            filter: "brightness(0.55)",
          }}
        />
        {/* Gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(8,9,14,0.85) 0%, rgba(8,9,14,0.4) 60%, rgba(8,9,14,0.7) 100%)",
          }}
        />
        {/* Amber top rule */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "2px",
            background: "linear-gradient(90deg, rgba(245,166,35,0.8) 0%, rgba(245,166,35,0.2) 50%, transparent 100%)",
          }}
        />
        {/* Content */}
        <div style={{ position: "relative", padding: "36px 36px 32px" }}>
          <p
            className="font-mono uppercase tracking-[0.22em]"
            style={{ fontSize: "8px", fontWeight: 700, color: "rgba(245,166,35,0.7)", marginBottom: "12px" }}
          >
            About The Desk
          </p>
          <h1
            className="font-serif font-bold"
            style={{
              fontSize: "clamp(28px, 5vw, 40px)",
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              color: "rgba(245,238,220,0.97)",
              marginBottom: "14px",
            }}
          >
            Intelligence built for<br />
            <span style={{ color: "rgba(245,166,35,0.95)" }}>partner conversations.</span>
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "rgba(245,238,220,0.55)",
              lineHeight: 1.65,
              maxWidth: "460px",
            }}
          >
            A daily briefing that gives you something worth saying before every meeting.
          </p>
        </div>
      </div>

      {/* What it is */}
      <section style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "8px",
              background: "rgba(245,166,35,0.1)",
              border: "1px solid rgba(245,166,35,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Target style={{ width: "13px", height: "13px", color: "rgba(245,166,35,0.8)" }} />
          </div>
          <h2
            className="font-mono uppercase tracking-[0.18em]"
            style={{ fontSize: "9px", fontWeight: 700, color: "rgba(245,238,220,0.5)" }}
          >
            What it is
          </h2>
        </div>
        <div
          style={{
            padding: "24px 28px",
            background: "oklch(0.135 0.018 260 / 0.9)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderLeft: "3px solid rgba(245,166,35,0.5)",
            borderRadius: "12px",
            boxShadow: "0 2px 24px rgba(0,0,0,0.45)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <p style={{ fontSize: "14px", color: "rgba(245,238,220,0.62)", lineHeight: 1.75, maxWidth: "65ch" }}>
              The Desk scans property, macro, policy, markets, tech, and economic news every morning
              and filters it through a single lens: what matters to the people who refer clients to{" "}
              <a
                href="https://investorkit.com.au"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "rgba(245,166,35,0.8)", textDecoration: "none", borderBottom: "1px solid rgba(245,166,35,0.3)" }}
              >
                InvestorKit
              </a>
              .
            </p>
            <p style={{ fontSize: "14px", color: "rgba(245,238,220,0.62)", lineHeight: 1.75, maxWidth: "65ch" }}>
              Each story comes with a "Say This" line -- a natural, one-sentence conversation opener
              grounded in a specific fact. Not talking points. Not marketing copy. Something you'd
              actually say to a broker, financial adviser, or corporate HR manager at 8:30am.
            </p>
            <p style={{ fontSize: "14px", color: "rgba(245,238,220,0.62)", lineHeight: 1.75, maxWidth: "65ch" }}>
              The weekly edition goes deeper: key metrics, market comparisons, partner-specific
              talking points, and a full PDF briefing you can read in under ten minutes.
            </p>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "8px",
              background: "rgba(245,166,35,0.1)",
              border: "1px solid rgba(245,166,35,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Users style={{ width: "13px", height: "13px", color: "rgba(245,166,35,0.8)" }} />
          </div>
          <h2
            className="font-mono uppercase tracking-[0.18em]"
            style={{ fontSize: "9px", fontWeight: 700, color: "rgba(245,238,220,0.5)" }}
          >
            Who it's for
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
          {[
            { label: "Mortgage Brokers", desc: "Open conversations about what clients should be buying, not just borrowing for.", accent: "rgba(245,166,35,0.6)" },
            { label: "Financial Advisers", desc: "Connect portfolio strategy to real market data without displacing your advice.", accent: "rgba(52,211,153,0.6)" },
            { label: "Institutional Partners", desc: "Give employees a credible property framework, not a sales pitch.", accent: "rgba(96,165,250,0.6)" },
            { label: "SMSF Specialists", desc: "Stay across the commercial and residential data that moves SMSF decisions.", accent: "rgba(167,139,250,0.6)" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: "18px 20px",
                background: "oklch(0.135 0.018 260 / 0.9)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderTop: `2px solid ${item.accent}`,
                borderRadius: "10px",
                boxShadow: "0 2px 16px rgba(0,0,0,0.35)",
              }}
            >
              <p style={{ fontSize: "12px", fontWeight: 600, color: item.accent, marginBottom: "6px" }}>
                {item.label}
              </p>
              <p style={{ fontSize: "12px", color: "rgba(245,238,220,0.42)", lineHeight: 1.6 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ marginBottom: "36px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "8px",
              background: "rgba(245,166,35,0.1)",
              border: "1px solid rgba(245,166,35,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Zap style={{ width: "13px", height: "13px", color: "rgba(245,166,35,0.8)" }} />
          </div>
          <h2
            className="font-mono uppercase tracking-[0.18em]"
            style={{ fontSize: "9px", fontWeight: 700, color: "rgba(245,238,220,0.5)" }}
          >
            How it works
          </h2>
        </div>
        <div
          style={{
            padding: "24px 28px",
            background: "oklch(0.135 0.018 260 / 0.9)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "12px",
            boxShadow: "0 2px 24px rgba(0,0,0,0.45)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {[
              { step: "01", title: "Daily scan", desc: "Every morning at 7am AEST, The Desk pulls the top stories across property, macro, policy, markets, tech, and economics." },
              { step: "02", title: "Signal filter", desc: "Each story is scored for partner relevance, assigned a category, and paired with a concrete talking point." },
              { step: "03", title: "Weekly edition", desc: "Every Wednesday, a deeper briefing is compiled with key metrics, market comparisons, and a full PDF." },
              { step: "04", title: "Your archive", desc: "Save stories to your reading queue, track which talking points you've used, and search across all past editions." },
            ].map((item, i) => (
              <div key={item.step} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                <span
                  className="font-mono"
                  style={{
                    fontSize: "9px",
                    fontWeight: 700,
                    color: "rgba(245,166,35,0.5)",
                    letterSpacing: "0.1em",
                    marginTop: "2px",
                    flexShrink: 0,
                    width: "20px",
                  }}
                >
                  {item.step}
                </span>
                {i < 3 && (
                  <div
                    style={{
                      width: "1px",
                      background: "rgba(245,166,35,0.15)",
                      alignSelf: "stretch",
                      flexShrink: 0,
                    }}
                  />
                )}
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "rgba(245,238,220,0.85)", marginBottom: "4px" }}>
                    {item.title}
                  </p>
                  <p style={{ fontSize: "12px", color: "rgba(245,238,220,0.42)", lineHeight: 1.65 }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Amber rule */}
      <div style={{ height: "1px", background: "linear-gradient(90deg, rgba(245,166,35,0.3) 0%, rgba(245,166,35,0.06) 40%, transparent 80%)", marginBottom: "28px" }} />

      {/* Connect CTA section */}
      <section style={{ marginBottom: "36px" }}>
        <p className="font-mono uppercase tracking-[0.18em] mb-4" style={{ fontSize: "8px", fontWeight: 700, color: "rgba(245,166,35,0.5)" }}>
          Connect
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "12px" }}>
          {/* Substack card */}
          <a
            href="https://rubenlaubscher.substack.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "20px 22px", background: "oklch(0.135 0.018 260 / 0.9)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", textDecoration: "none", transition: "border-color 0.15s, box-shadow 0.15s", boxShadow: "0 2px 16px rgba(0,0,0,0.35)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(245,166,35,0.25)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.5)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 2px 16px rgba(0,0,0,0.35)"; }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="font-mono uppercase tracking-[0.15em]" style={{ fontSize: "8px", fontWeight: 700, color: "rgba(245,166,35,0.6)" }}>Substack</span>
              <ExternalLink style={{ width: "11px", height: "11px", color: "rgba(245,238,220,0.2)" }} />
            </div>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "rgba(245,238,220,0.88)", lineHeight: 1.3 }}>Ruben Laubscher</p>
            <p style={{ fontSize: "11px", color: "rgba(245,238,220,0.38)", lineHeight: 1.55 }}>Longer-form thinking on property partnerships, market cycles, and building a referral engine from scratch.</p>
            <span style={{ fontSize: "11px", color: "rgba(245,166,35,0.7)", fontWeight: 600 }}>Subscribe</span>
          </a>
          {/* LinkedIn card */}
          <a
            href="https://www.linkedin.com/in/ruben-laubscher"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "20px 22px", background: "oklch(0.135 0.018 260 / 0.9)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", textDecoration: "none", transition: "border-color 0.15s, box-shadow 0.15s", boxShadow: "0 2px 16px rgba(0,0,0,0.35)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(96,165,250,0.25)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.5)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 2px 16px rgba(0,0,0,0.35)"; }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="font-mono uppercase tracking-[0.15em]" style={{ fontSize: "8px", fontWeight: 700, color: "rgba(96,165,250,0.6)" }}>LinkedIn</span>
              <ExternalLink style={{ width: "11px", height: "11px", color: "rgba(245,238,220,0.2)" }} />
            </div>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "rgba(245,238,220,0.88)", lineHeight: 1.3 }}>Ruben Laubscher</p>
            <p style={{ fontSize: "11px", color: "rgba(245,238,220,0.38)", lineHeight: 1.55 }}>Head of Partnerships at InvestorKit. Building Australia's most systematic property partnership engine.</p>
            <span style={{ fontSize: "11px", color: "rgba(96,165,250,0.7)", fontWeight: 600 }}>Connect</span>
          </a>
          {/* Start reading card */}
          <Link href="/">
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "20px 22px", background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: "12px", cursor: "pointer", transition: "border-color 0.15s, box-shadow 0.15s", boxShadow: "0 2px 16px rgba(0,0,0,0.35)", height: "100%" }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(245,166,35,0.4)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.5)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(245,166,35,0.2)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 16px rgba(0,0,0,0.35)"; }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="font-mono uppercase tracking-[0.15em]" style={{ fontSize: "8px", fontWeight: 700, color: "rgba(245,166,35,0.6)" }}>The Desk</span>
                <ArrowRight style={{ width: "11px", height: "11px", color: "rgba(245,166,35,0.4)" }} />
              </div>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "rgba(245,238,220,0.88)", lineHeight: 1.3 }}>Start reading</p>
              <p style={{ fontSize: "11px", color: "rgba(245,238,220,0.38)", lineHeight: 1.55 }}>Open today's daily feed and see what's worth saying before your next partner meeting.</p>
              <span style={{ fontSize: "11px", color: "rgba(245,166,35,0.8)", fontWeight: 600 }}>Today's feed</span>
            </div>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          <p className="font-mono" style={{ fontSize: "10px", color: "rgba(245,238,220,0.25)" }}>
            &copy; {new Date().getFullYear()} The Desk &middot; by{" "}
            <a
              href="https://www.linkedin.com/in/ruben-laubscher"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "rgba(245,238,220,0.35)", textDecoration: "none" }}
            >
              Ruben Laubscher
            </a>
            {" "}&middot; Head of Partnerships,{" "}
            <a
              href="https://investorkit.com.au"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "rgba(245,238,220,0.35)", textDecoration: "none" }}
            >
              InvestorKit
            </a>
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <a
              href="https://rubenlaubscher.substack.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono"
              style={{ fontSize: "10px", color: "rgba(245,238,220,0.25)", textDecoration: "none" }}
            >
              Substack
            </a>
            <a
              href="https://investorkit.com.au"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono"
              style={{ fontSize: "10px", color: "rgba(245,238,220,0.25)", textDecoration: "none" }}
            >
              InvestorKit
            </a>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}
