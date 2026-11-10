// The portal: an original swirling vortex drawn on a 2D canvas.
// Spiral ribbons and drifting motes sit inside a wobbling rim; sparks fly off the edge.
// Colours come from CSS variables, so the portal re-tints whenever the dimension changes.

import { nextDimension } from './dimension';

type RGB = [number, number, number];

interface Mote {
  a: number; // base angle
  u: number; // 0 = centre, 1 = rim
  v: number; // drift speed
  s: number; // size
  p: number; // twinkle phase
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  tint: number;
}

const TAU = Math.PI * 2;
const ARMS = 5;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rgba = (c: RGB, a: number) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;

function parseColor(value: string, fallback: RGB): RGB {
  const v = value.trim();
  if (v.startsWith('#')) {
    const hex = v.length === 4 ? [...v.slice(1)].map((c) => c + c).join('') : v.slice(1, 7);
    const n = parseInt(hex, 16);
    if (!Number.isNaN(n)) return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const m = v.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const parts = m[1].split(/[\s,/]+/).map(Number);
    if (parts.length >= 3 && parts.every((p) => !Number.isNaN(p))) return [parts[0], parts[1], parts[2]];
  }
  return fallback;
}

export function readColors() {
  const cs = getComputedStyle(document.documentElement);
  const get = (name: string, fallback: RGB) => parseColor(cs.getPropertyValue(name), fallback);
  return {
    c1: get('--portal-1', [37, 229, 122]),
    c2: get('--portal-2', [212, 245, 74]),
    c3: get('--portal-3', [56, 211, 230]),
    core: get('--portal-core', [3, 35, 26]),
    edge: get('--ink', [14, 59, 52]),
  };
}

// Hooks the hero uses to drive the portal from outside (see figure.ts). They stay no-ops until a hero portal exists.
export const heroPortal = {
  /** 0 = idle, 1 = fully swallowed. The swirl spins up as the figure gets pulled in. */
  setSwallow: (_w: number) => {},
  /** A burst of sparks and a shockwave ring. */
  pulse: () => {},
  /** Something was just swallowed: a few sparks and a kick of speed. Strength runs from 0 to 1. */
  gulp: (_strength: number) => {},
  /** The hero scales the portal up while it feeds (see feast.ts); this keeps the drawing sharp at that size. */
  setZoom: (_scale: number) => {},
  /** How heavy the rim is drawn. 1 is normal; more keeps it visible when the portal is shrunk to the size of the logo. */
  setWeight: (_weight: number) => {},
};

/** The rim of the small portal in the menu bar, drawn much heavier than the big one so it still reads at that size. */
export const LOGO_WEIGHT = 2.9;

const wobble = (a: number, t: number) =>
  1 + 0.015 * Math.sin(a * 5 + t * 1.6) + 0.01 * Math.sin(a * 8 - t * 2.2) + 0.006 * Math.sin(a * 13 + t * 3);

export function initPortals() {
  document.querySelectorAll<HTMLCanvasElement>('canvas[data-portal]').forEach((canvas) => {
    createPortal(canvas, canvas.dataset.portal === 'hero', canvas.dataset.portal === 'logo');
  });
}

function createPortal(canvas: HTMLCanvasElement, interactive: boolean, mini = false) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const stage = canvas.closest<HTMLElement>('[data-hero]');
  // A second canvas that repaints the lower half of the rim in front of the figure, so it looks like the lip of a doorway.
  const front = interactive ? stage?.querySelector<HTMLCanvasElement>('canvas[data-portal-front]') ?? null : null;
  const fctx = front?.getContext('2d') ?? null;
  const hit = stage?.querySelector<HTMLButtonElement>('[data-portal-hit]') ?? null;
  const reduceQuery = matchMedia('(prefers-reduced-motion: reduce)');

  let colors = readColors();
  let W = 0;
  let H = 0;
  let dpr = 1;
  let R = 0;
  let cx = 0;
  let cy = 0;
  let motes: Mote[] = [];
  const sparks: Spark[] = [];
  const rings: number[] = [];

  let t = 3.2; // animation clock in seconds
  let speed = 1;
  let hoverSpeed = 1;
  let swallowSpeed = 1;
  let speedTarget = 1;
  let boost = 0;
  let emitAcc = 0;
  const lean = { x: 0, y: 0, tx: 0, ty: 0 };

  let raf = 0;
  let running = false;
  let onScreen = true;
  let last = 0;

  const newMote = (initial = false): Mote => ({
    a: Math.random() * TAU,
    u: initial ? Math.pow(Math.random(), 0.85) : 0.95 + Math.random() * 0.05,
    v: 0.6 + Math.random() * 0.9,
    s: 0.8 + Math.random() * 1.8,
    p: Math.random() * TAU,
  });

  let zoom = 1;
  let weight = mini ? LOGO_WEIGHT : 1;

  function resize() {
    const sameBox = canvas.clientWidth === W && canvas.clientHeight === H;
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    if (!W || !H) return;
    // More pixels while the portal is scaled up, within reason: a huge canvas would cost more than it shows.
    const base = Math.min(window.devicePixelRatio || 1, 2);
    dpr = Math.min(base * zoom, Math.max(base, 1700 / W));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    if (front) {
      front.width = canvas.width;
      front.height = canvas.height;
    }
    cx = W / 2;
    cy = H / 2;
    R = Math.min(W, H) / 2 / 1.35;
    if (!sameBox || !motes.length) {
      const count = mini ? 36 : Math.round(clamp(R * 2.6, 240, 820));
      motes = Array.from({ length: count }, () => newMote(true));
    }
    draw();
    // Only now does the hero show its portal-dependent parts (the click target), and the logo drop its plain stand-in.
    stage?.setAttribute('data-portal-ready', '');
    if (mini) canvas.parentElement?.setAttribute('data-portal-ready', '');
  }

  function rimPath(g2: CanvasRenderingContext2D, scale: number, phase = 0) {
    g2.beginPath();
    const n = 140;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * TAU;
      const r = R * scale * wobble(a + phase, t);
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) g2.moveTo(x, y);
      else g2.lineTo(x, y);
    }
    g2.closePath();
  }

  function emit(count: number, burst = false) {
    const k = R / 300;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * TAU;
      const r = R * (0.98 + Math.random() * 0.05);
      const sp = ((burst ? 110 : 34) + Math.random() * (burst ? 190 : 70)) * Math.max(k, 0.55);
      const swirl = (Math.random() - 0.5) * 0.9;
      sparks.push({
        x: cx + Math.cos(a) * r,
        y: cy + Math.sin(a) * r,
        vx: Math.cos(a + swirl) * sp,
        vy: Math.sin(a + swirl) * sp,
        life: 0,
        max: 0.55 + Math.random() * (burst ? 0.9 : 0.7),
        size: 0.9 + Math.random() * 1.8,
        tint: Math.random(),
      });
    }
  }

  function burst() {
    emit(70, true);
    rings.push(0);
    boost = 5;
  }

  function step(dt: number) {
    boost = Math.max(0, boost - dt * 3);
    speed += (speedTarget + boost - speed) * Math.min(1, dt * 4);
    t += dt * speed;

    lean.x += (lean.tx - lean.x) * Math.min(1, dt * 6);
    lean.y += (lean.ty - lean.y) * Math.min(1, dt * 6);

    for (const m of motes) {
      m.u -= dt * 0.05 * m.v * speed;
      if (m.u < 0.03) Object.assign(m, newMote());
    }

    if (interactive) {
      emitAcc += dt * 14 * Math.min(speed, 2.5);
      while (emitAcc >= 1) {
        emitAcc -= 1;
        emit(1);
      }
    }

    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.life += dt;
      if (s.life >= s.max) {
        sparks.splice(i, 1);
        continue;
      }
      const drag = 1 - dt * 2;
      s.vx *= drag;
      s.vy *= drag;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
    }

    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i] += dt * 1.1;
      if (rings[i] >= 1) rings.splice(i, 1);
    }
  }

  // The rim: an ink outline, a coloured band and a bright inner edge.
  function drawRim(g2: CanvasRenderingContext2D, front = false) {
    const { c1, c2, c3, edge } = colors;
    rimPath(g2, 1 + 0.035 * weight);
    g2.lineWidth = mini ? 1.4 : Math.max(2, R * 0.014 * weight);
    g2.strokeStyle = rgba(edge, 0.9);
    g2.stroke();

    if (!front) {
      // A soft glow around the rim. On the front lip it would only tint the figure, so it is skipped there.
      rimPath(g2, 1);
      g2.lineWidth = R * 0.11 * weight;
      g2.strokeStyle = rgba(c2, 0.22);
      g2.stroke();
    }

    rimPath(g2, 1);
    g2.lineWidth = R * 0.05 * weight;
    const conic = (g2 as CanvasRenderingContext2D & { createConicGradient?: (a: number, x: number, y: number) => CanvasGradient }).createConicGradient;
    if (conic) {
      const cg = conic.call(g2, t * 0.8, cx, cy);
      cg.addColorStop(0, rgba(c2, 1));
      cg.addColorStop(0.25, rgba(c1, 1));
      cg.addColorStop(0.5, rgba(c3, 1));
      cg.addColorStop(0.75, rgba(c1, 1));
      cg.addColorStop(1, rgba(c2, 1));
      g2.strokeStyle = cg;
    } else {
      g2.strokeStyle = rgba(c2, 1);
    }
    g2.stroke();

    rimPath(g2, 1 - 0.028 * weight, 0.6);
    g2.lineWidth = Math.max(1, R * 0.014 * weight);
    g2.strokeStyle = 'rgba(255,255,255,0.8)';
    g2.stroke();
  }

  // Lower half of the rim only, painted over the figure.
  function drawFront() {
    if (!fctx || !front) return;
    fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fctx.clearRect(0, 0, W, H);
    fctx.save();
    const edgeY = Math.round(cy * dpr) / dpr;
    fctx.beginPath();
    fctx.rect(0, edgeY, W, H - edgeY);
    fctx.clip();
    drawRim(fctx, true);
    fctx.restore();
  }

  function draw() {
    if (!R) return;
    const g2 = ctx!;
    g2.setTransform(dpr, 0, 0, dpr, 0, 0);
    g2.clearRect(0, 0, W, H);

    const { c1, c2, c3, core } = colors;
    const ox = lean.x * R * 0.07;
    const oy = lean.y * R * 0.07;

    // 1. Soft glow outside the rim.
    let g = g2.createRadialGradient(cx, cy, R * 0.8, cx, cy, R * 1.34);
    g.addColorStop(0, rgba(c1, 0.4));
    g.addColorStop(0.45, rgba(c1, 0.13));
    g.addColorStop(1, rgba(c1, 0));
    g2.fillStyle = g;
    g2.fillRect(0, 0, W, H);

    // 2. Inside the rim.
    g2.save();
    rimPath(g2, 0.985);
    g2.clip();

    g = g2.createRadialGradient(cx + ox, cy + oy, 0, cx + ox * 0.5, cy + oy * 0.5, R);
    g.addColorStop(0, rgba(core, 1));
    g.addColorStop(0.22, rgba(mix(core, c1, 0.26), 1));
    g.addColorStop(0.62, rgba(mix(core, c1, 0.66), 1));
    g.addColorStop(1, rgba(mix(c1, c2, 0.2), 1));
    g2.fillStyle = g;
    g2.fillRect(cx - R * 1.1, cy - R * 1.1, R * 2.2, R * 2.2);

    g2.globalCompositeOperation = 'lighter';
    g2.lineCap = 'round';
    g2.lineJoin = 'round';

    // Spiral ribbons.
    for (let k = 0; k < ARMS; k++) {
      const base = (k / ARMS) * TAU + t * 0.55;
      g2.beginPath();
      for (let i = 0; i <= 56; i++) {
        const s = i / 56;
        const r = R * (0.05 + 0.95 * s);
        const a = base + Math.pow(1 - s, 1.25) * 6 + Math.sin(t * 0.9 + k * 1.7) * 0.07;
        const x = cx + ox * (1 - s) + Math.cos(a) * r;
        const y = cy + oy * (1 - s) + Math.sin(a) * r;
        if (i === 0) g2.moveTo(x, y);
        else g2.lineTo(x, y);
      }
      g2.lineWidth = R * 0.13;
      g2.strokeStyle = rgba(c1, 0.09);
      g2.stroke();
      g2.lineWidth = R * 0.055;
      g2.strokeStyle = rgba(mix(c1, c2, 0.5), 0.2);
      g2.stroke();
      g2.lineWidth = Math.max(1, R * 0.012);
      g2.strokeStyle = rgba(c3, 0.4);
      g2.stroke();
    }

    // Drifting motes, pulled towards the centre.
    for (const m of motes) {
      const ang = m.a + Math.pow(1 - m.u, 1.35) * 5.4 + t * (0.28 + 1.5 * (1 - m.u));
      const r = R * m.u;
      const x = cx + ox * (1 - m.u) + Math.cos(ang) * r;
      const y = cy + oy * (1 - m.u) + Math.sin(ang) * r;
      const twinkle = 0.55 + 0.45 * Math.sin(t * 3 + m.p);
      const alpha = clamp(Math.sin(m.u * Math.PI) * 1.25, 0, 1) * twinkle;
      const col = m.u < 0.5 ? mix(c3, c1, m.u * 2) : mix(c1, c2, (m.u - 0.5) * 2);
      const size = m.s * (0.6 + (1 - m.u) * 0.9) * Math.max(R / 260, 0.6);
      g2.fillStyle = rgba(col, 0.8 * alpha);
      g2.fillRect(x - size / 2, y - size / 2, size, size);
    }

    g2.globalCompositeOperation = 'source-over';

    // Dark eye in the middle gives the swirl some depth.
    g = g2.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, R * 0.34);
    g.addColorStop(0, rgba(core, 0.92));
    g.addColorStop(1, rgba(core, 0));
    g2.fillStyle = g;
    g2.fillRect(cx - R, cy - R, R * 2, R * 2);
    g2.restore();

    // 3. The rim.
    drawRim(g2);

    // 4. Shockwaves and sparks.
    for (const p of rings) {
      g2.beginPath();
      g2.arc(cx, cy, R * (1.02 + p * 0.28), 0, TAU);
      g2.lineWidth = Math.max(1, R * 0.03 * (1 - p));
      g2.strokeStyle = rgba(c2, 0.75 * (1 - p));
      g2.stroke();
    }

    g2.lineCap = 'round';
    for (const s of sparks) {
      const fade = 1 - s.life / s.max;
      const col = s.tint < 0.5 ? mix(c2, c1, s.tint * 2) : mix(c1, [255, 255, 255], (s.tint - 0.5) * 1.2);
      g2.strokeStyle = rgba(col, fade * fade);
      g2.lineWidth = s.size;
      g2.beginPath();
      g2.moveTo(s.x, s.y);
      g2.lineTo(s.x - s.vx * 0.035, s.y - s.vy * 0.035);
      g2.stroke();
    }

    drawFront();
  }

  function frame(now: number) {
    raf = 0;
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    step(dt);
    draw();
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running || reduceQuery.matches || !onScreen || document.hidden) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  // Keep the canvas crisp and sized to its CSS box.
  new ResizeObserver(() => resize()).observe(canvas);
  resize();

  new IntersectionObserver(
    ([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) start();
      else stop();
    },
    { rootMargin: '80px' },
  ).observe(canvas);

  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  reduceQuery.addEventListener('change', () => {
    if (reduceQuery.matches) {
      stop();
      draw();
    } else {
      start();
    }
  });

  // Re-tint straight away so view-transition snapshots catch the new colours.
  window.addEventListener('dimensionchange', () => {
    colors = readColors();
    rings.push(0.05);
    draw();
  });

  if (interactive && stage) {
    stage.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      const rect = canvas.getBoundingClientRect();
      lean.tx = clamp((e.clientX - (rect.left + rect.width / 2)) / (rect.width * 0.7), -1, 1);
      lean.ty = clamp((e.clientY - (rect.top + rect.height / 2)) / (rect.height * 0.7), -1, 1);
    });
    stage.addEventListener('pointerleave', () => {
      lean.tx = 0;
      lean.ty = 0;
    });

    if (hit) {
      hit.addEventListener('pointerenter', () => {
        hoverSpeed = 2;
        speedTarget = Math.max(hoverSpeed, swallowSpeed);
      });
      hit.addEventListener('pointerleave', () => {
        hoverSpeed = 1;
        speedTarget = Math.max(hoverSpeed, swallowSpeed);
      });
      hit.addEventListener('click', () => {
        burst();
        const rect = canvas.getBoundingClientRect();
        nextDimension({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
        if (reduceQuery.matches) draw();
      });
    }
  }

  if (interactive) {
    heroPortal.setSwallow = (w: number) => {
      swallowSpeed = 1 + 2.6 * w;
      speedTarget = Math.max(hoverSpeed, swallowSpeed);
    };
    heroPortal.pulse = burst;
    heroPortal.gulp = (strength: number) => {
      emit(Math.round(5 + 13 * strength), true);
      boost = Math.min(5, boost + 1.1 * strength);
    };
    heroPortal.setWeight = (value: number) => {
      weight = value;
    };
    heroPortal.setZoom = (scale: number) => {
      const next = Math.max(1, Math.round(scale * 4) / 4);
      if (next === zoom) return;
      zoom = next;
      resize();
    };
  }

  start();
}
