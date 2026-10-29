"use client";

import * as React from "react";

import { brand } from "@/lib/design/tokens";

/** Prefer CSS media query over Framer so this island stays motion-library-free. */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduced;
}

/**
 * The signature honeycomb - a faithful reimagining of the original's canvas
 * effect, rebuilt for React/TS and recolored on-brand.
 *
 * How it works (and why it glows, unlike a flat SVG grid):
 *  - A full hex grid is drawn to a <canvas> with additive ("lighter") blending
 *    over a dark warm-brown base, so overlapping light *adds up* into real glow.
 *  - Each frame paints a low-alpha wash over the whole canvas, leaving decaying
 *    comet-like afterimages - the trail.
 *  - "Igniting" a cell (pointer move / click / idle auto-spark) starts a
 *    selection that, after a few frames, RELATES to its neighbors - so a wave
 *    ripples outward hex-to-hex through the comb.
 *
 * Recoloring: the original cycled rainbow hues. Opening bloom is butter yellow
 * (honey ~48°); ongoing ripples sample brown (~33°) and sky (~200°) so the comb
 * starts warm and settles into brand brown + blue against the espresso field.
 *
 * Perf: pure canvas + a single rAF loop; no per-cell React. Accessibility: it's
 * decorative (aria-hidden). Reduced-motion renders a calm static comb.
 */

const RADIUS = 26;
const RATE = 0.98;

/** Butter yellow (#fff1b5) - opening bloom only. */
const BUTTER_HUE = 48;
/** Soft brown (#5a4326). */
const BROWN_HUE = 33;
/** Sky blue (#c1dbe8). */
const SKY_HUE = 200;

// Ongoing ripples: brown + blue (after the butter opening).
const BRAND_HUES = [BROWN_HUE, 30, SKY_HUE, 198];

type Selection = { count: number; hue: number };
type Source = { indices: number[]; hue: number; count: number; hops: number };

// How many cells outward a ripple travels before it stops seeding. Lower =
// smaller, more contained bursts; higher = waves that sweep the whole comb.
const RIPPLE_HOPS = 3;

class Hex {
  x: number;
  y: number;
  hue = BUTTER_HUE;
  neighbors: (Hex | null)[] = new Array(6).fill(null);
  selections: Selection[] = [];
  sources: Source[] = [];

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  select(hue: number) {
    this.hue = hue;
    this.selections.push({ count: 0, hue });
  }

  relate(source: Source) {
    this.sources.push(source);
  }
}

const COUNT_MIN = 5;
const COUNT_MAX = 50;
const LUM_MIN = 6;
const LUM_MAX = 32;

function fillLuminance(count: number) {
  if (count < COUNT_MIN) {
    return (
      LUM_MIN +
      (LUM_MAX - LUM_MIN) *
        Math.pow(Math.sin((Math.PI / 2) * (count / COUNT_MIN)), 3)
    );
  }
  if (count < COUNT_MAX) {
    return (
      LUM_MIN +
      (LUM_MAX - LUM_MIN) *
        Math.pow(
          Math.sin(
            (Math.PI / 2) * (1 + (count - COUNT_MIN) / (COUNT_MAX - COUNT_MIN)),
          ),
          3,
        )
    );
  }
  return 0;
}

function strokeLuminance(count: number) {
  if (count < COUNT_MIN * 2) {
    return (
      LUM_MIN +
      (LUM_MAX - LUM_MIN) * Math.sin((Math.PI / 2) * (count / (COUNT_MIN * 2)))
    );
  }
  if (count < COUNT_MAX * 2) {
    return (
      LUM_MIN +
      (LUM_MAX - LUM_MIN) *
        Math.sin(
          (Math.PI / 2) *
            (1 + (count - COUNT_MIN * 2) / ((COUNT_MAX - COUNT_MIN) * 2)),
        )
    );
  }
  return 0;
}

export function HoneycombCanvas({ className }: { className?: string }) {
  const reduceMotion = usePrefersReducedMotion();
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let hexes: Hex[] = [];
    let vertices: { x: number; y: number }[] = [];
    let hexWidth = 0;
    let hexHeight = 0;
    let radius = RADIUS * RATE;
    let raf = 0;
    let idleTimer = 0;

    const rand = (min: number, max: number) =>
      (min + (max - min) * Math.random()) | 0;
    const brandHue = () => BRAND_HUES[rand(0, BRAND_HUES.length)];

    const build = () => {
      width = container.clientWidth;
      height = container.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      radius = RADIUS * RATE;
      vertices = [];
      for (let i = 0; i < 6; i++) {
        vertices.push({
          x: radius * Math.sin((Math.PI / 3) * i),
          y: -radius * Math.cos((Math.PI / 3) * i),
        });
      }
      hexWidth = RADIUS * Math.cos(Math.PI / 6) * 2;
      hexHeight = RADIUS * (2 - Math.sin(Math.PI / 6));

      let countX = Math.ceil(width / hexWidth) + 1;
      const countY = Math.ceil(height / hexHeight) + 1;
      const offsetX = -(countX * hexWidth - width) / 2;
      const offsetY = -(countY * hexHeight - height) / 2;
      countX++;

      hexes = [];
      for (let y = 0; y < countY; y++) {
        for (let x = 0; x < countX; x++) {
          hexes.push(
            new Hex(
              offsetX +
                (x + 0.5) * hexWidth -
                (y % 2 === 1 ? 0 : hexWidth / 2),
              offsetY + (y + 0.5) * hexHeight,
            ),
          );
        }
      }
      // Wire up the 6 neighbors of each hex (odd-r offset adjacency).
      for (let y = 0; y < countY; y++) {
        for (let x = 0; x < countX; x++) {
          const hex = hexes[y * countX + x];
          const odd = y % 2 === 1;
          if (x < countX - 1) hex.neighbors[0] = hexes[y * countX + x + 1];
          if ((x < countX - 1 || !odd) && y < countY - 1)
            hex.neighbors[1] = hexes[(y + 1) * countX + x + (odd ? 1 : 0)];
          if ((x > 0 || odd) && y < countY - 1)
            hex.neighbors[2] = hexes[(y + 1) * countX + x + (odd ? 0 : -1)];
          if (x > 0) hex.neighbors[3] = hexes[y * countX + x - 1];
          if ((x > 0 || odd) && y > 0)
            hex.neighbors[4] = hexes[(y - 1) * countX + x + (odd ? 0 : -1)];
          if ((x < countX - 1 || !odd) && y > 0)
            hex.neighbors[5] = hexes[(y - 1) * countX + x + (odd ? 1 : 0)];
        }
      }
    };

    const drawHexPath = () => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const v = vertices[i];
        if (i === 0) ctx.moveTo(v.x, v.y);
        else ctx.lineTo(v.x, v.y);
      }
      ctx.closePath();
    };

    const drawSelections = (targets: { count: number; hue: number }[]) => {
      for (const t of targets) {
        // Additive blending sums overlapping glows, so keep per-layer alpha low
        // and luminance modest - otherwise stacked cells blow out to white.
        const fl = fillLuminance(t.count);
        ctx.fillStyle = `hsla(${t.hue}, 60%, ${fl}%, 0.2)`;
        ctx.fill();
        const sl = strokeLuminance(t.count);
        ctx.strokeStyle = `hsla(${t.hue}, 65%, ${sl}%, 0.26)`;
        ctx.stroke();
      }
    };

    const renderHex = (hex: Hex) => {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.translate(hex.x, hex.y);
      drawHexPath();
      // Base comb defaults to butter yellow; ripples shift to brown + blue.
      ctx.fillStyle = `hsla(${BUTTER_HUE}, 70%, ${LUM_MIN + 8}%, 0.2)`;
      ctx.fill();
      ctx.strokeStyle = `hsla(${BUTTER_HUE}, 55%, 32%, 0.18)`;
      ctx.stroke();

      drawSelections(hex.selections);
      drawSelections(hex.sources);
      ctx.restore();

      // Propagate: a selection that reaches COUNT_MIN seeds all 6 neighbors.
      for (let i = hex.selections.length - 1; i >= 0; i--) {
        const sel = hex.selections[i];
        if (sel.count === COUNT_MIN) {
          for (let j = 0; j < 6; j++) {
            const nb = hex.neighbors[j];
            if (nb) {
              const indices: number[] = [];
              for (let k = 0; k < 3; k++) indices.push((j - 1 + k + 6) % 6);
              nb.relate({ indices, hue: hex.hue, count: 0, hops: RIPPLE_HOPS });
            }
          }
        }
        if (++sel.count === COUNT_MAX * 2) hex.selections.splice(i, 1);
      }
      // Sources propagate directionally, so the wave keeps moving outward. Pick
      // ONLY from the 3 forward directions (indices has exactly 3 entries) -
      // indexing past that hits undefined and kills the wave prematurely.
      for (let i = hex.sources.length - 1; i >= 0; i--) {
        const src = hex.sources[i];
        const index = src.indices[rand(0, 3)];
        // Only keep seeding forward while the ripple has hops left, so each
        // burst stays a small local bloom instead of sweeping to the edge.
        if (hex.neighbors[index] && src.count === COUNT_MIN && src.hops > 0) {
          hex.neighbors[index]!.relate({
            indices: src.indices,
            hue: src.hue,
            count: 0,
            hops: src.hops - 1,
          });
        }
        if (++src.count === COUNT_MAX) hex.sources.splice(i, 1);
      }
    };

    const paintStatic = () => {
      // Reduced motion: draw the comb once with a soft central bloom, no loop.
      ctx.fillStyle = brand.espresso;
      ctx.fillRect(0, 0, width, height);
      const cxp = width / 2;
      const cyp = height * 0.5;
      for (const hex of hexes) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.translate(hex.x, hex.y);
        drawHexPath();
        const d = Math.hypot(hex.x - cxp, hex.y - cyp);
        const bloom = Math.max(0, 1 - d / (Math.max(width, height) * 0.5));
        // Default butter field with a soft brown→sky bloom across the comb.
        const hue =
          bloom > 0.55
            ? BUTTER_HUE
            : hex.x < width / 2
              ? BROWN_HUE
              : SKY_HUE;
        ctx.fillStyle = `hsla(${hue}, 85%, ${LUM_MIN + bloom * 30}%, 0.28)`;
        ctx.fill();
        ctx.strokeStyle = `hsla(${BUTTER_HUE}, 50%, ${LUM_MIN + bloom * 20}%, 0.32)`;
        ctx.stroke();
        ctx.restore();
      }
    };

    const igniteAt = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      // Find nearest hex; ignite it.
      let best: Hex | null = null;
      let bestD = Infinity;
      for (const hex of hexes) {
        const d = Math.hypot(hex.x - px, hex.y - py);
        if (d < bestD) {
          bestD = d;
          best = hex;
        }
      }
      // Don't re-ignite an already-lit cell - stacking selections on one hex is
      // what causes the additive blow-out to white.
      if (best && bestD < RADIUS * 1.2 && best.selections.length === 0) {
        best.select(brandHue());
      }
    };

    const loop = () => {
      raf = requestAnimationFrame(loop);
      // Translucent wash → decaying afterimage trail (espresso tint). A higher
      // alpha fades glows faster, keeping trails short and calm.
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "hsla(18, 45%, 5%, 0.42)";
      ctx.fillRect(0, 0, width, height);
      for (const hex of hexes) renderHex(hex);
    };

    let lastMove = 0;
    const onPointerMove = (e: PointerEvent) => {
      const now = e.timeStamp;
      // Cursor ignitions propagate (loud, like the idle bursts) so the trail
      // disperses outward instead of feeling flat. The heavier throttle is what
      // keeps that from stacking back into the old wall-to-wall flood: bursts
      // fire at a burst-like cadence as the pointer moves, not every frame.
      if (now - lastMove < 200) return;
      lastMove = now;
      igniteAt(e.clientX, e.clientY);
    };
    const onClick = (e: MouseEvent) => {
      // A click sends a full ripple outward through the comb.
      igniteAt(e.clientX, e.clientY);
    };

    build();

    if (reduceMotion) {
      paintStatic();
      const onResize = () => {
        build();
        paintStatic();
      };
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }

    // Prefer the open right half so idle life shows where copy isn't.
    const sparkPool = () => {
      const right = hexes.filter((h) => h.x > width * 0.38);
      return right.length ? right : hexes;
    };

    // Open on butter yellow, then idle/pointer ripples shift to brown + blue.
    const pool = sparkPool();
    if (pool.length) {
      pool[rand(0, pool.length)].select(BUTTER_HUE);
      if (pool.length > 1) pool[rand(0, pool.length)].select(BUTTER_HUE);
    }

    // Run the rAF loop and idle sparks only while the hero is on screen. Once
    // scrolled past, both stop - the canvas does zero work behind the rest of
    // the page - and resume seamlessly when the hero scrolls back into view.
    let running = false;
    const start = () => {
      if (running) return;
      running = true;
      idleTimer = window.setInterval(() => {
        const targets = sparkPool();
        if (targets.length) targets[rand(0, targets.length)].select(brandHue());
      }, 2200);
      loop();
    };
    const stop = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
      clearInterval(idleTimer);
      idleTimer = 0;
    };

    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("click", onClick);

    let resizeRaf = 0;
    const onResize = () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(build);
    };
    window.addEventListener("resize", onResize);

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) start();
        else stop();
      },
      { threshold: 0 },
    );
    io.observe(container);

    return () => {
      stop();
      cancelAnimationFrame(resizeRaf);
      io.disconnect();
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("click", onClick);
      window.removeEventListener("resize", onResize);
    };
  }, [reduceMotion]);

  return (
    <div
      ref={containerRef}
      className={className}
      aria-hidden="true"
      style={{ background: brand.espresso }}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
