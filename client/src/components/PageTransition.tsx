import { useEffect, useRef, useCallback } from "react";

// Headline fragments for the burst pages
const BURST_HEADLINES = [
  "BREAKING: MARKET SIGNAL",
  "RBA HOLDS RATE",
  "PROPERTY VALUES RISE",
  "INTELLIGENCE BRIEF",
  "DAILY SIGNAL",
  "MARKET UPDATE",
  "PARTNER INSIGHT",
  "DATA CONFIRMED",
  "ANALYSIS COMPLETE",
  "SIGNAL ACQUIRED",
];

interface BurstPage {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  va: number;
  flipPhase: number;
  flipSpeed: number;
  w: number;
  h: number;
  opacity: number;
  scale: number;
  headline: string;
  life: number;
  maxLife: number;
}

// Global event bus for triggering bursts
type BurstListener = (x: number, y: number) => void;
const listeners: Set<BurstListener> = new Set();

export function triggerPageBurst(x: number, y: number) {
  listeners.forEach((fn) => fn(x, y));
}

export function PageTransitionCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const pagesRef = useRef<BurstPage[]>([]);
  const activeRef = useRef(false);

  const spawnBurst = useCallback((originX: number, originY: number) => {
    const count = 12 + Math.floor(Math.random() * 6);
    const newPages: BurstPage[] = Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const speed = 4 + Math.random() * 8;
      const w = 80 + Math.random() * 100;
      const h = w * (1.2 + Math.random() * 0.4);
      return {
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3, // slight upward bias
        angle: Math.random() * Math.PI * 2,
        va: (Math.random() - 0.5) * 0.15,
        flipPhase: Math.random() * Math.PI * 2,
        flipSpeed: 0.06 + Math.random() * 0.08,
        w,
        h,
        opacity: 0,
        scale: 0.2 + Math.random() * 0.5,
        headline: BURST_HEADLINES[Math.floor(Math.random() * BURST_HEADLINES.length)],
        life: 0,
        maxLife: 45 + Math.floor(Math.random() * 25),
      };
    });

    pagesRef.current = [...pagesRef.current, ...newPages];
    activeRef.current = true;
  }, []);

  useEffect(() => {
    // Register listener
    listeners.add(spawnBurst);
    return () => { listeners.delete(spawnBurst); };
  }, [spawnBurst]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    const onResize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
    };
    window.addEventListener("resize", onResize);

    function drawPage(c: CanvasRenderingContext2D, p: BurstPage) {
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.angle);
      c.scale(Math.cos(p.flipPhase) * p.scale, p.scale);
      c.globalAlpha = p.opacity;

      // Page body
      c.fillStyle = "rgba(230, 220, 195, 0.12)";
      c.strokeStyle = "rgba(245, 166, 35, 0.4)";
      c.lineWidth = 1;
      c.beginPath();
      c.roundRect(-p.w / 2, -p.h / 2, p.w, p.h, 3);
      c.fill();
      c.stroke();

      // Top amber rule
      c.fillStyle = "rgba(245, 166, 35, 0.6)";
      c.fillRect(-p.w / 2 + 4, -p.h / 2 + 5, p.w - 8, 2);

      // Masthead text
      c.font = `bold ${Math.max(5, p.w * 0.065)}px 'Playfair Display', Georgia, serif`;
      c.fillStyle = "rgba(245, 200, 100, 0.7)";
      c.textAlign = "center";
      c.fillText("THE SIGNAL", 0, -p.h / 2 + 16);

      // Headline
      c.font = `bold ${Math.max(6, p.w * 0.08)}px 'Playfair Display', Georgia, serif`;
      c.fillStyle = "rgba(240, 230, 200, 0.65)";
      const maxW = p.w - 12;
      const words = p.headline.split(" ");
      let line = "";
      let lineY = -p.h / 2 + 28;
      const lh = p.w * 0.09;
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (c.measureText(test).width > maxW && line) {
          c.fillText(line, 0, lineY);
          line = word;
          lineY += lh;
          if (lineY > 0) break;
        } else {
          line = test;
        }
      }
      if (line && lineY <= 0) c.fillText(line, 0, lineY);

      // Body line stubs
      c.fillStyle = "rgba(200, 190, 160, 0.18)";
      for (let i = 0; i < 5; i++) {
        const lineW = (p.w - 16) * (0.6 + Math.random() * 0.4);
        c.fillRect(-p.w / 2 + 8, lineY + lh * 1.2 + i * (p.w * 0.07), lineW, 2);
      }

      c.restore();
    }

    function tick() {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);

      const pages = pagesRef.current;
      if (pages.length === 0) {
        activeRef.current = false;
        animRef.current = requestAnimationFrame(tick);
        return;
      }

      for (let i = pages.length - 1; i >= 0; i--) {
        const p = pages[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // gravity
        p.vx *= 0.96;
        p.angle += p.va;
        p.flipPhase += p.flipSpeed;

        const lr = p.life / p.maxLife;

        // Quick burst in, then fade out
        if (lr < 0.15) {
          p.opacity = (lr / 0.15) * 0.85;
          p.scale = 0.2 + (lr / 0.15) * 0.8;
        } else if (lr > 0.5) {
          p.opacity = Math.max(0, 0.85 - ((lr - 0.5) / 0.5) * 0.85);
        } else {
          p.opacity = 0.85;
        }

        if (p.life >= p.maxLife || p.opacity <= 0) {
          pages.splice(i, 1);
          continue;
        }

        if (ctx) drawPage(ctx, p);
      }

      pagesRef.current = pages;
      animRef.current = requestAnimationFrame(tick);
    }

    animRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 100 }}
      aria-hidden="true"
    />
  );
}
