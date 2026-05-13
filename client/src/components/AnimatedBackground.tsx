import { useEffect, useRef, useMemo } from "react";

const GLOBE_IMG_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663548646152/aMLMcsgEHGdQSLTuiGseQe/signal-globe-v2-35bKaJLPocspHyQxiCEtbM.webp";

const MAP_BG_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663548646152/aMLMcsgEHGdQSLTuiGseQe/signal-bg-v2-66AymNgUuLzHMDviuCkDpA.webp";

// Newspaper headline fragments
const HEADLINES = [
  "RBA HOLDS RATE AT 4.10%",
  "SYDNEY PROPERTY +0.6% MOM",
  "NATIONAL VALUES RISE 0.4%",
  "MORTGAGE APPROVALS +12% QOQ",
  "OFF-MARKET DEALS REACH 69%",
  "RENTAL YIELDS AT DECADE HIGH",
  "INFRASTRUCTURE SPEND LIFTS GDP",
  "BROKER VOLUMES UP 18% YOY",
  "SUPERANNUATION HITS $3.9T",
  "AI RESHAPES FINANCIAL ADVICE",
  "REGIONAL MIGRATION ACCELERATES",
  "CPI EASES TO 3.2% ANNUALLY",
  "EQUITY MARKETS NEAR RECORD",
  "HOUSING SUPPLY GAP WIDENS",
  "UNEMPLOYMENT STEADY AT 4.1%",
  "APRA TIGHTENS LENDING RULES",
];

const STREAM_CHARS = "01アイウエオカキクケコ▲▼◆◇░▒▓";

function rnd(min: number, max: number) {
  return min + Math.random() * (max - min);
}
function randomChar() {
  return STREAM_CHARS[Math.floor(Math.random() * STREAM_CHARS.length)];
}

// ─── Types ───

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  opacity: number; maxOpacity: number;
  life: number; maxLife: number;
  color: string;
}

interface DataStream {
  x: number; y: number;
  chars: string[];
  speed: number;
  opacity: number;
  color: string;
}

interface FloatingHeadline {
  id: number;
  text: string;
  x: number; y: number;
  vy: number;
  opacity: number; maxOpacity: number;
  phase: "in" | "hold" | "out";
  timer: number;
  holdDuration: number;
  fontSize: number;
}

interface NewspaperPage {
  id: number;
  // Position
  x: number; y: number;
  // Velocity
  vx: number; vy: number;
  // Rotation
  angle: number;
  va: number; // angular velocity
  // Flip animation (0-1 cycle)
  flipPhase: number;
  flipSpeed: number;
  // Size
  w: number; h: number;
  // Opacity
  opacity: number; maxOpacity: number;
  phase: "in" | "drift" | "out";
  life: number; maxLife: number;
  // Lines of text to draw
  lines: string[];
  // Headline index
  headlineIdx: number;
}

// ─── Component ───

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const globeImgRef = useRef<HTMLImageElement | null>(null);
  const mapBgRef = useRef<HTMLImageElement | null>(null);

  const prefersReduced = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (prefersReduced) return;

    // Preload images
    const globeImg = new Image();
    globeImg.crossOrigin = "anonymous";
    globeImg.src = GLOBE_IMG_URL;
    globeImgRef.current = globeImg;

    const mapBg = new Image();
    mapBg.crossOrigin = "anonymous";
    mapBg.src = MAP_BG_URL;
    mapBgRef.current = mapBg;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = canvas.offsetWidth;
    let H = canvas.offsetHeight;
    canvas.width = W;
    canvas.height = H;

    let time = 0;
    let globeOpacity = 0;

    // ─── Particles ───
    const particles: Particle[] = Array.from({ length: 120 }, () => ({
      x: rnd(0, W), y: rnd(0, H),
      vx: rnd(-0.3, 0.3), vy: rnd(-0.22, 0.22),
      size: rnd(0.8, 2.8),
      opacity: 0, maxOpacity: rnd(0.35, 0.75),
      life: rnd(0, 200), maxLife: rnd(150, 350),
      color: Math.random() > 0.72 ? "#f5a623" : "#8899cc",
    }));

    // ─── Data streams ───
    const streams: DataStream[] = Array.from({ length: 14 }, () => ({
      x: rnd(0, W), y: rnd(-200, H),
      chars: Array.from({ length: 8 + Math.floor(rnd(0, 14)) }, randomChar),
      speed: rnd(0.4, 1.0),
      opacity: rnd(0.12, 0.22),
      color: Math.random() > 0.5 ? "#f5a623" : "#4a6fa5",
    }));

    // ─── Floating headlines ───
    const headlines: FloatingHeadline[] = [];
    let headlineTimer = 80;
    let headlineId = 0;

    // ─── Newspaper pages ───
    const pages: NewspaperPage[] = [];
    let pageTimer = 160;
    let pageId = 0;

    function spawnPage() {
      const side = Math.floor(rnd(0, 4)); // 0=bottom, 1=left, 2=right, 3=bottom-center
      let sx = rnd(W * 0.1, W * 0.7);
      let sy = H + 40;
      let svx = rnd(-0.3, 0.3);
      let svy = rnd(-0.6, -0.25);
      if (side === 1) { sx = -80; sy = rnd(H * 0.2, H * 0.8); svx = rnd(0.2, 0.5); svy = rnd(-0.4, 0.1); }
      if (side === 2) { sx = W + 80; sy = rnd(H * 0.2, H * 0.8); svx = rnd(-0.5, -0.2); svy = rnd(-0.4, 0.1); }

      const w = rnd(90, 160);
      const h = w * rnd(1.2, 1.5);
      const hlIdx = Math.floor(rnd(0, HEADLINES.length));

      // Generate random "newspaper" lines
      const lineCount = 4 + Math.floor(rnd(0, 5));
      const lines: string[] = [HEADLINES[hlIdx]];
      for (let i = 1; i < lineCount; i++) {
        const len = 6 + Math.floor(rnd(0, 14));
        lines.push("█".repeat(Math.floor(len * 0.3)) + " " + "▬".repeat(Math.floor(len * 0.7)));
      }

      pages.push({
        id: pageId++,
        x: sx, y: sy,
        vx: svx, vy: svy,
        angle: rnd(-0.3, 0.3),
        va: rnd(-0.008, 0.008),
        flipPhase: rnd(0, Math.PI * 2),
        flipSpeed: rnd(0.012, 0.028),
        w, h,
        opacity: 0, maxOpacity: rnd(0.38, 0.62),
        phase: "in",
        life: 0, maxLife: rnd(380, 600),
        lines,
        headlineIdx: hlIdx,
      });
    }

    // ─── Resize ───
    const onResize = () => {
      if (!canvas) return;
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = W;
      canvas.height = H;
    };
    window.addEventListener("resize", onResize);

    // ─── Draw newspaper page ───
    function drawPage(p: NewspaperPage) {
      if (!ctx) return;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      // Flip effect: scale X by cosine of flip phase
      const flipScale = Math.cos(p.flipPhase);
      ctx.scale(flipScale, 1);

      ctx.globalAlpha = p.opacity;

      // Page background
      ctx.fillStyle = "rgba(220, 210, 185, 0.14)";
      ctx.strokeStyle = "rgba(245, 166, 35, 0.35)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.roundRect(-p.w / 2, -p.h / 2, p.w, p.h, 2);
      ctx.fill();
      ctx.stroke();

      // Masthead rule
      ctx.fillStyle = "rgba(245, 166, 35, 0.65)";
      ctx.fillRect(-p.w / 2 + 4, -p.h / 2 + 4, p.w - 8, 2);

      // Headline text
      ctx.font = `bold ${Math.max(6, p.w * 0.075)}px 'Playfair Display', Georgia, serif`;
      ctx.fillStyle = "rgba(240, 230, 200, 0.85)";
      ctx.textAlign = "center";
      const maxW = p.w - 10;
      const words = p.lines[0].split(" ");
      let line = "";
      let lineY = -p.h / 2 + 14;
      const lineH = p.w * 0.085;
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > maxW && line) {
          ctx.fillText(line, 0, lineY);
          line = word;
          lineY += lineH;
          if (lineY > -p.h / 2 + 14 + lineH * 2.5) break;
        } else {
          line = test;
        }
      }
      if (line) ctx.fillText(line, 0, lineY);

      // Body lines
      ctx.font = `${Math.max(4, p.w * 0.045)}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = "rgba(200, 190, 160, 0.4)";
      ctx.textAlign = "left";
      const bodyStartY = -p.h / 2 + 14 + lineH * 3.5;
      for (let i = 1; i < p.lines.length && i < 6; i++) {
        ctx.fillText(p.lines[i], -p.w / 2 + 5, bodyStartY + (i - 1) * (p.w * 0.055));
      }

      // Column divider
      ctx.strokeStyle = "rgba(200, 190, 160, 0.1)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, -p.h / 2 + 14 + lineH * 3);
      ctx.lineTo(0, p.h / 2 - 6);
      ctx.stroke();

      ctx.restore();
    }

    // ─── Tick ───
    function tick() {
      if (!ctx || !canvas) return;
      time++;

      ctx.clearRect(0, 0, W, H);

      // 1. World map background
      if (mapBgRef.current?.complete && mapBgRef.current.naturalWidth > 0) {
        ctx.globalAlpha = 0.38;
        ctx.drawImage(mapBgRef.current, 0, 0, W, H);
        ctx.globalAlpha = 1;
      }

      // 2. Deep gradient overlay (lighter so background elements show through)
      const bgGrad = ctx.createLinearGradient(0, 0, W, H);
      bgGrad.addColorStop(0, "rgba(5, 7, 15, 0.55)");
      bgGrad.addColorStop(0.5, "rgba(8, 10, 20, 0.42)");
      bgGrad.addColorStop(1, "rgba(5, 7, 15, 0.58)");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // 3. Ambient glows
      const glow1 = ctx.createRadialGradient(W * 0.05, H * 0.08, 0, W * 0.05, H * 0.08, W * 0.5);
      glow1.addColorStop(0, "rgba(55, 75, 160, 0.09)");
      glow1.addColorStop(1, "rgba(55, 75, 160, 0)");
      ctx.fillStyle = glow1;
      ctx.fillRect(0, 0, W, H);

      const glow2 = ctx.createRadialGradient(W * 0.88, H * 0.82, 0, W * 0.88, H * 0.82, W * 0.55);
      glow2.addColorStop(0, "rgba(245, 166, 35, 0.07)");
      glow2.addColorStop(1, "rgba(245, 166, 35, 0)");
      ctx.fillStyle = glow2;
      ctx.fillRect(0, 0, W, H);

      // 4. Data streams
      streams.forEach((s) => {
        s.y += s.speed;
        if (s.y > H + 200) {
          s.y = -200;
          s.x = rnd(0, W);
          s.chars = Array.from({ length: 8 + Math.floor(rnd(0, 14)) }, randomChar);
        }
        if (Math.random() < 0.04) {
          s.chars[Math.floor(Math.random() * s.chars.length)] = randomChar();
        }
        ctx.save();
        ctx.font = "9px 'JetBrains Mono', monospace";
        s.chars.forEach((ch, i) => {
          ctx.globalAlpha = s.opacity * (1 - i / s.chars.length);
          ctx.fillStyle = i === 0 ? "rgba(245,238,220,0.8)" : s.color;
          ctx.fillText(ch, s.x, s.y - i * 13);
        });
        ctx.restore();
      });

      // 5. Particles + connections
      particles.forEach((p) => {
        p.life++;
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;

        const lr = p.life / p.maxLife;
        if (lr < 0.2) p.opacity = (lr / 0.2) * p.maxOpacity;
        else if (lr > 0.8) p.opacity = ((1 - lr) / 0.2) * p.maxOpacity;
        else p.opacity = p.maxOpacity;

        if (p.life >= p.maxLife) {
          p.life = 0;
          p.x = rnd(0, W); p.y = rnd(0, H);
          p.vx = rnd(-0.25, 0.25); p.vy = rnd(-0.18, 0.18);
          p.maxOpacity = rnd(0.35, 0.70);
          p.maxLife = rnd(150, 350);
          p.color = Math.random() > 0.72 ? "#f5a623" : "#8899cc";
        }

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.restore();
      });

      // Particle connections (nearby particles get a faint line)
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            const alpha = (1 - dist / 110) * 0.18;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = "#8899cc";
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      // 6. Globe -- positioned at far right edge, partially clipped, subtle background element
      if (globeImgRef.current?.complete && globeImgRef.current.naturalWidth > 0) {
        globeOpacity = Math.min(globeOpacity + 0.004, 0.38);
        const gSize = Math.min(W * 0.32, H * 0.60, 400);
        const gX = W * 0.97;
        const gY = H * 0.50;

        // Outer ambient glow
        ctx.save();
        ctx.globalAlpha = globeOpacity * 0.4;
        const outerGlow = ctx.createRadialGradient(gX, gY, gSize * 0.3, gX, gY, gSize * 1.1);
        outerGlow.addColorStop(0, "rgba(60, 100, 220, 0.28)");
        outerGlow.addColorStop(0.5, "rgba(245, 166, 35, 0.12)");
        outerGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = outerGlow;
        ctx.beginPath();
        ctx.arc(gX, gY, gSize * 1.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Globe image clipped to circle
        ctx.save();
        ctx.globalAlpha = globeOpacity * 0.85;
        ctx.beginPath();
        ctx.arc(gX, gY, gSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(globeImgRef.current, gX - gSize / 2, gY - gSize / 2, gSize, gSize);

        // Scan line across globe
        const scanY = ((time * 0.7) % (gSize * 1.3)) - gSize * 0.15;
        const scanGrad = ctx.createLinearGradient(0, gY - gSize / 2 + scanY - 25, 0, gY - gSize / 2 + scanY + 25);
        scanGrad.addColorStop(0, "rgba(245, 166, 35, 0)");
        scanGrad.addColorStop(0.5, "rgba(245, 166, 35, 0.10)");
        scanGrad.addColorStop(1, "rgba(245, 166, 35, 0)");
        ctx.fillStyle = scanGrad;
        ctx.fillRect(gX - gSize / 2, gY - gSize / 2 + scanY - 25, gSize, 50);
        ctx.restore();

        // Pulsing rings
        const pulse = Math.sin(time * 0.025);
        for (let ring = 0; ring < 3; ring++) {
          const ringScale = 1 + ring * 0.06 + pulse * 0.02;
          ctx.save();
          ctx.globalAlpha = (0.07 - ring * 0.02) * (0.7 + pulse * 0.3);
          ctx.strokeStyle = ring === 0 ? "#f5a623" : "#4a6fa5";
          ctx.lineWidth = ring === 0 ? 1.5 : 0.8;
          ctx.beginPath();
          ctx.arc(gX, gY, (gSize / 2 + 6 + ring * 14) * ringScale, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Signal arcs from globe to random points
        if (time % 90 === 0) {
          // Occasionally draw a signal arc
        }
        const arcCount = 4;
        for (let a = 0; a < arcCount; a++) {
          const arcAngle = (time * 0.006 + a * (Math.PI * 2 / arcCount));
          const arcR = gSize / 2 + 30 + a * 15;
          const arcX = gX + Math.cos(arcAngle) * arcR;
          const arcY = gY + Math.sin(arcAngle) * arcR;
          const arcAlpha = 0.06 + Math.sin(time * 0.04 + a * 1.5) * 0.04;
          ctx.save();
          ctx.globalAlpha = arcAlpha;
          ctx.beginPath();
          ctx.arc(arcX, arcY, 2, 0, Math.PI * 2);
          ctx.fillStyle = "#f5a623";
          ctx.fill();
          // Line back to globe edge
          const edgeX = gX + Math.cos(arcAngle) * (gSize / 2);
          const edgeY = gY + Math.sin(arcAngle) * (gSize / 2);
          ctx.strokeStyle = "#f5a623";
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(edgeX, edgeY);
          ctx.lineTo(arcX, arcY);
          ctx.stroke();
          ctx.restore();
        }
      }

      // 7. Newspaper pages
      pageTimer--;
      if (pageTimer <= 0 && pages.length < 8) {
        pageTimer = 100 + Math.floor(rnd(0, 120));
        spawnPage();
      }

      for (let i = pages.length - 1; i >= 0; i--) {
        const p = pages[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.va;
        p.flipPhase += p.flipSpeed;

        // Slight gravity / air resistance
        p.vy += 0.002;
        p.vx *= 0.9995;

        const lr = p.life / p.maxLife;
        if (p.phase === "in") {
          // Fade in faster
          p.opacity = Math.min(p.maxOpacity, p.opacity + 0.008);
          if (p.opacity >= p.maxOpacity * 0.9) p.phase = "drift";
        } else if (p.phase === "drift") {
          if (lr > 0.75) p.phase = "out";
        } else {
          p.opacity = Math.max(0, p.opacity - 0.002);
          if (p.opacity <= 0) { pages.splice(i, 1); continue; }
        }

        // Remove if off screen
        if (p.y < -H * 0.3 || p.x < -300 || p.x > W + 300) {
          pages.splice(i, 1);
          continue;
        }

        drawPage(p);
      }

      // 8. Floating headlines
      headlineTimer--;
      if (headlineTimer <= 0) {
        headlineTimer = 90 + Math.floor(rnd(0, 130));
        headlines.push({
          id: headlineId++,
          text: HEADLINES[Math.floor(rnd(0, HEADLINES.length))],
          x: rnd(20, W * 0.52),
          y: H + 16,
          vy: -(rnd(0.2, 0.4)),
          opacity: 0, maxOpacity: rnd(0.40, 0.65),
          phase: "in",
          timer: 0,
          holdDuration: 180 + Math.floor(rnd(0, 220)),
          fontSize: rnd(8, 13),
        });
      }

      for (let i = headlines.length - 1; i >= 0; i--) {
        const h = headlines[i];
        h.y += h.vy;
        h.timer++;
        if (h.phase === "in") {
          h.opacity = Math.min(h.maxOpacity, h.opacity + 0.003);
          if (h.opacity >= h.maxOpacity) h.phase = "hold";
        } else if (h.phase === "hold") {
          if (h.timer > h.holdDuration) h.phase = "out";
        } else {
          h.opacity = Math.max(0, h.opacity - 0.002);
          if (h.opacity <= 0) { headlines.splice(i, 1); continue; }
        }
        if (h.y < -20) { headlines.splice(i, 1); continue; }

        ctx.save();
        ctx.globalAlpha = h.opacity;
        ctx.font = `${h.fontSize}px 'Playfair Display', Georgia, serif`;
        ctx.fillStyle = "#e8d5a0";
        ctx.letterSpacing = "0.06em";
        ctx.fillText(h.text, h.x, h.y);
        ctx.restore();
      }

      // 9. Full-width scan line
      const scanPos = ((time * 0.45) % (H * 1.4)) - H * 0.2;
      const fullScan = ctx.createLinearGradient(0, scanPos - 35, 0, scanPos + 35);
      fullScan.addColorStop(0, "rgba(245, 166, 35, 0)");
      fullScan.addColorStop(0.5, "rgba(245, 166, 35, 0.04)");
      fullScan.addColorStop(1, "rgba(245, 166, 35, 0)");
      ctx.fillStyle = fullScan;
      ctx.fillRect(0, scanPos - 35, W, 70);

      // 10. Vignette (lighter so content is still visible)
      const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, H * 0.9);
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, "rgba(0,0,0,0.35)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      animRef.current = requestAnimationFrame(tick);
    }

    animRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, [prefersReduced]);

  if (prefersReduced) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
