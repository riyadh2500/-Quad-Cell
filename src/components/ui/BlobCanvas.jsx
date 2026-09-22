import { useEffect, useRef } from 'react';

const LINE_COLOR = 'rgba(255,255,255,0.18)';
const BG_COLOR   = '#000000';
const R          = 28;   // corner radius on path segments
const SEG        = 90;   // grid cell size
const SPEED      = 0.18; // animation speed

export default function BlobCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, animId, paths, offset = 0;

    /* ─────────────────────────────────────────
       Build a set of closed rounded-rectangle
       "pipe" paths that tile across the screen,
       matching the Rialo circuit-board look.
    ───────────────────────────────────────── */
    function buildPaths() {
      paths = [];
      const cols = Math.ceil(W / SEG) + 2;
      const rows = Math.ceil(H / SEG) + 2;

      // Seed with a deterministic-looking but varied layout
      const rng = (x, y) => Math.abs(Math.sin(x * 127.1 + y * 311.7) * 43758.5453) % 1;

      for (let gy = -1; gy < rows; gy++) {
        for (let gx = -1; gx < cols; gx++) {
          const seed = rng(gx, gy);
          if (seed < 0.55) continue; // skip ~45% of cells for spacing

          const x = gx * SEG;
          const y = gy * SEG;

          // Random width/height in multiples of SEG for variety
          const wMult = seed < 0.7 ? 1 : seed < 0.85 ? 2 : 3;
          const hMult = rng(gx + 7, gy + 3) < 0.6 ? 1 : 2;
          const pw = SEG * wMult - 12;
          const ph = SEG * hMult - 12;

          paths.push({ x: x + 6, y: y + 6, w: pw, h: ph, seed });
        }
      }
    }

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
      buildPaths();
    }

    /* Draw a single rounded-rect outline */
    function roundRect(x, y, w, h, r) {
      const rr = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + rr, y);
      ctx.lineTo(x + w - rr, y);
      ctx.arcTo(x + w, y,     x + w, y + rr,     rr);
      ctx.lineTo(x + w, y + h - rr);
      ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
      ctx.lineTo(x + rr, y + h);
      ctx.arcTo(x,     y + h, x,     y + h - rr, rr);
      ctx.lineTo(x,     y + rr);
      ctx.arcTo(x,     y,     x + rr, y,          rr);
      ctx.closePath();
      ctx.stroke();
    }

    /* Draw small "connector nub" — the short stub lines between rects */
    function drawNub(x, y, dir) {
      const len = 18;
      ctx.beginPath();
      if (dir === 'h') { ctx.moveTo(x, y); ctx.lineTo(x + len, y); }
      else             { ctx.moveTo(x, y); ctx.lineTo(x, y + len); }
      ctx.stroke();
    }

    function draw() {
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = LINE_COLOR;
      ctx.lineWidth   = 1.5;
      ctx.lineCap     = 'round';
      ctx.lineJoin    = 'round';

      // Slow vertical drift
      offset = (offset + SPEED) % SEG;

      paths.forEach(p => {
        const dy = (offset * (p.seed > 0.8 ? 1 : -1)) % SEG;
        const px = p.x;
        const py = p.y + dy;

        // Skip if fully off-screen
        if (px > W + SEG * 3 || py > H + SEG * 3) return;
        if (px + p.w < -SEG || py + p.h < -SEG * 3) return;

        roundRect(px, py, p.w, p.h, R);

        // Occasionally add a connector nub on edges
        if (p.seed > 0.78) drawNub(px + p.w * 0.5 - 9, py - 18, 'h');
        if (p.seed > 0.82) drawNub(px + p.w, py + p.h * 0.5, 'v');
        if (p.seed > 0.88) drawNub(px + p.w * 0.25 - 9, py + p.h, 'h');
      });

      animId = requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    resize();
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      aria-hidden="true"
    />
  );
}
