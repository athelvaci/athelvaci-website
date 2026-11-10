// The feast. Once the portal has swallowed the portrait it keeps going: it grows, drifts to the middle of the screen
// and pulls in everything else on the hero. The headline goes letter by letter, the intro word by word, then the
// buttons. Each piece trembles, leans towards the portal, lets go and spirals in. Loose specks of dust stream in
// from the edges of the screen while it feeds. Everything follows the scroll position, so scrolling back up
// spits it all out again.

import { heroPortal, readColors } from './portal';

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** The part of the pinned scroll during which the hero is eaten (see the acts in figure.ts). */
export interface FeastActs {
  eatFrom: number;
  eatTo: number;
  closeFrom: number;
  closeTo: number;
}

interface Piece {
  el: HTMLElement;
  /** Centre of the piece at rest, relative to the stage, in pixels. */
  x: number;
  y: number;
  /** Its height, which sets how much it trembles and leans. */
  size: number;
  /** Split letters lose their kerning; this many pixels put each one back where the browser had it. */
  fix: number;
  /** A stable random number per piece, so every visit plays the same. */
  seed: number;
  /** The scroll progress at which it lets go. */
  start: number;
  big: boolean;
  eaten: boolean;
  written: string;
}

interface Speck {
  a: number; // angle around the portal
  r: number; // distance from it, in pixels
  v: number; // speed factor
  size: number;
  tint: number;
}

/** How long one piece takes from letting go to being gone, as a share of the pinned scroll. */
const FLIGHT = 0.15;

export function createFeast(stage: HTMLElement, frame: HTMLElement, acts: FeastActs) {
  const scene = stage.querySelector<HTMLElement>('.hero-scene');
  const portal = stage.querySelector<HTMLElement>('.hero-portal');
  const layer = stage.querySelector<HTMLElement>('.hero-layer');
  const title = stage.querySelector<HTMLElement>('.hero-title');
  const lead = stage.querySelector<HTMLElement>('.hero-lead');
  const debris = frame.querySelector<HTMLCanvasElement>('[data-hero-debris]');
  const ctx = debris?.getContext('2d') ?? null;

  const pieces: Piece[] = [];
  /** The lines of the headline: their text, and the letter pieces it was cut into. */
  const lines: { el: HTMLElement; text: string; letters: Piece[] }[] = [];
  let ready = false;
  let quiet = true; // the first pass after loading or resizing makes no fuss about what is already eaten

  // Geometry, all relative to the stage and in pixels (see measure()).
  const home = { x: 0, y: 0 }; // where the portal sits at rest
  const mid = { x: 0, y: 0 }; // the middle of the screen, where it ends up
  const origin = { x: 0, y: 0 }; // the stage's corner inside the frame, for the dust canvas
  let radius = 1;
  let maxScale = 1.6;

  let bump = 0;
  let colors = readColors();
  window.addEventListener('dimensionchange', () => {
    colors = readColors();
  });

  // ---------- Splitting the text into pieces ----------

  const add = (el: HTMLElement, big = false) => {
    const seed = Math.abs(Math.sin((pieces.length + 1) * 12.9898) * 43758.5453) % 1;
    const piece: Piece = { el, x: 0, y: 0, size: 16, fix: 0, seed, start: 1, big, eaten: false, written: '' };
    pieces.push(piece);
    return piece;
  };

  function splitLetters(line: HTMLElement) {
    const node = line.firstChild;
    if (!(node instanceof Text) || line.childNodes.length !== 1) return void add(line, true);
    const text = node.data;
    const spans = Array.from({ length: text.length }, (_, i) => {
      const span = document.createElement('span');
      span.className = 'ch';
      span.textContent = text[i];
      span.setAttribute('aria-hidden', 'true');
      return span;
    });
    line.replaceChildren(...spans);
    lines.push({ el: line, text, letters: spans.map((span) => add(span, true)) });
  }

  /**
   * Letters in separate boxes are no longer kerned against each other, which would shift the headline by a few pixels.
   * So the line is set once more as plain text, out of sight, and every letter is nudged to where it sits in that.
   * Call this with the letters' own transforms cleared.
   */
  function measureKerning() {
    const range = document.createRange();
    for (const line of lines) {
      const probe = document.createElement('span');
      probe.textContent = line.text;
      probe.setAttribute('aria-hidden', 'true');
      probe.style.cssText = 'position:absolute;left:0;top:0;visibility:hidden;white-space:pre;pointer-events:none';
      line.el.append(probe);
      const node = probe.firstChild!;
      const from = probe.getBoundingClientRect().left;
      const first = line.letters[0].el.getBoundingClientRect().left;
      line.letters.forEach((piece, i) => {
        range.setStart(node, i);
        range.setEnd(node, i + 1);
        piece.fix = range.getBoundingClientRect().left - from - (piece.el.getBoundingClientRect().left - first);
      });
      probe.remove();
    }
  }

  function splitWords(paragraph: HTMLElement) {
    if (paragraph.children.length) return void add(paragraph);
    const words = (paragraph.textContent ?? '').trim().split(/\s+/);
    paragraph.replaceChildren();
    words.forEach((word, i) => {
      if (i) paragraph.append(' ');
      const span = document.createElement('span');
      span.className = 'wd';
      span.textContent = word;
      paragraph.append(span);
      add(span);
    });
  }

  function split() {
    if (title) {
      // Screen readers get the headline as one name instead of eighteen loose letters.
      title.setAttribute('aria-label', (title.textContent ?? '').replace(/\s+/g, ' ').trim());
      title.querySelectorAll<HTMLElement>('.line-in').forEach(splitLetters);
    }
    if (lead) splitWords(lead);
    stage.querySelectorAll<HTMLElement>('.hero-actions .btn').forEach((button) => add(button, true));
  }

  // ---------- Measuring ----------

  function measure() {
    if (!ready || !scene || !portal) return;

    // Take away everything this script wrote, so the numbers are the resting ones.
    scene.style.transform = 'none';
    for (const piece of pieces) piece.el.style.transform = 'none';

    const s = stage.getBoundingClientRect();
    const f = frame.getBoundingClientRect();
    const p = portal.getBoundingClientRect();
    home.x = p.left + p.width / 2 - s.left;
    home.y = p.top + p.height / 2 - s.top;
    mid.x = f.left + f.width / 2 - s.left;
    mid.y = f.top + f.height / 2 - s.top;
    origin.x = s.left - f.left;
    origin.y = s.top - f.top;
    radius = Math.max(1, portal.offsetWidth / 2 / 1.35);
    // It grows until it nearly fills the screen: a bit taller than the frame, but never wider than the window.
    maxScale = clamp(Math.min(f.height * 0.58, f.width * 0.52) / radius, 1.15, 2.2);

    measureKerning();
    for (const piece of pieces) {
      const r = piece.el.getBoundingClientRect();
      piece.size = r.height;
      piece.x = r.left + r.width / 2 - s.left + piece.fix;
      piece.y = r.top + r.height / 2 - s.top;
      piece.written = '';
    }
    scene.style.transform = '';
    for (const piece of pieces) piece.el.style.transform = piece.fix ? `translate(${piece.fix.toFixed(2)}px, 0)` : '';

    // What is nearest to the portal goes first.
    const order = [...pieces].sort((a, b) => Math.hypot(a.x - home.x, a.y - home.y) - Math.hypot(b.x - home.x, b.y - home.y));
    const span = acts.eatTo - acts.eatFrom - FLIGHT;
    order.forEach((piece, i) => {
      const rank = order.length > 1 ? i / (order.length - 1) : 0;
      piece.start = acts.eatFrom + span * clamp(Math.pow(rank, 0.92) + (piece.seed - 0.5) * 0.035);
    });

    if (debris && ctx) {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      debris.width = Math.round(debris.clientWidth * dpr);
      debris.height = Math.round(debris.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      specks.length = 0;
    }
    quiet = true;
  }

  // ---------- Dust ----------

  const specks: Speck[] = [];
  let dusty = false;

  function drawDust(pull: number, cx: number, cy: number, hole: number, dt: number) {
    if (!debris || !ctx) return;
    const W = debris.clientWidth;
    const H = debris.clientHeight;
    if (pull < 0.01) {
      if (dusty) ctx.clearRect(0, 0, W, H);
      dusty = false;
      return;
    }
    dusty = true;

    const reach = Math.hypot(W, H) * 0.72;
    const count = Math.round(clamp((W * H) / 13000, 36, 96));
    const spawn = (anywhere: boolean): Speck => ({
      a: Math.random() * Math.PI * 2,
      r: hole + (reach - hole) * (anywhere ? Math.random() : 0.8 + Math.random() * 0.2),
      v: 0.6 + Math.random() * 0.9,
      size: 0.8 + Math.random() * 1.6,
      tint: Math.random(),
    });
    while (specks.length < count) specks.push(spawn(true));

    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round';
    const { c1, c3, edge } = colors;
    for (let i = 0; i < specks.length; i++) {
      const speck = specks[i];
      const near = 1 - clamp(speck.r / reach);
      const fall = (70 + 560 * pull) * speck.v * (0.35 + 1.5 * near);
      const turn = pull * (0.22 + 2.1 * Math.pow(near, 1.5));
      speck.r -= fall * dt;
      speck.a += turn * dt;
      if (speck.r < hole * 0.92) {
        specks[i] = spawn(false);
        continue;
      }
      // A short streak pointing back along the way it came.
      const x = cx + Math.cos(speck.a) * speck.r;
      const y = cy + Math.sin(speck.a) * speck.r;
      const tr = speck.r + fall * 0.045;
      const ta = speck.a - turn * 0.045;
      const mixTo = speck.tint < 0.5 ? c1 : c3;
      const k = speck.tint < 0.5 ? speck.tint * 1.3 : (speck.tint - 0.5) * 1.1;
      const color = [0, 1, 2].map((c) => Math.round(edge[c] + (mixTo[c] - edge[c]) * clamp(k + 0.25)));
      const alpha = pull * 0.6 * smooth(reach, reach * 0.82, speck.r) * (0.45 + 0.55 * near);
      ctx.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},${alpha.toFixed(3)})`;
      ctx.lineWidth = speck.size * (0.7 + near);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(cx + Math.cos(ta) * tr, cy + Math.sin(ta) * tr);
      ctx.stroke();
    }
  }

  // ---------- Applying progress ----------

  const vars = new Map<string, string>();
  const setVar = (name: string, value: string) => {
    if (vars.get(name) === value) return;
    vars.set(name, value);
    stage.style.setProperty(name, value);
  };

  /** Puts everything back as if the page had just loaded (used when the hero is not pinned). */
  function rest() {
    setVar('--sx', '0px');
    setVar('--sy', '0px');
    setVar('--ss', '1');
    stage.removeAttribute('data-eating');
    frame.removeAttribute('data-gone');
    if (layer) layer.inert = false;
    for (const piece of pieces) write(piece, piece.fix ? `translate(${piece.fix.toFixed(2)}px, 0)` : '', 1, 0);
    drawDust(0, 0, 0, 0, 0);
  }

  function write(piece: Piece, transform: string, opacity: number, glow: number) {
    const key = `${transform}|${opacity.toFixed(2)}|${glow.toFixed(2)}`;
    if (piece.written === key) return;
    piece.written = key;
    const style = piece.el.style;
    style.transform = transform;
    style.opacity = opacity >= 0.995 ? '' : opacity.toFixed(3);
    if (glow > 0.005) style.setProperty('--k', glow.toFixed(3));
    else style.removeProperty('--k');
  }

  /**
   * Moves everything to where it belongs at scroll progress `p`. Returns how hard the portal is pulling (0 to 1),
   * which the caller uses to spin it up.
   */
  function update(p: number, time: number, dt: number, pinned: boolean): number {
    if (!ready) return 0;
    if (!pinned) {
      rest();
      return 0;
    }

    const { eatFrom, eatTo, closeFrom, closeTo } = acts;
    const pull = smooth(eatFrom - 0.06, eatFrom + 0.1, p) * (1 - smooth(closeFrom + 0.04, closeTo, p));
    const drift = smooth(eatFrom, eatFrom + (eatTo - eatFrom) * 0.62, p);
    const growth = smooth(eatFrom, eatTo + 0.01, p);

    bump *= Math.exp(-dt * 5);
    const cx = home.x + (mid.x - home.x) * drift;
    const cy = home.y + (mid.y - home.y) * drift;
    const scale = (1 + (maxScale - 1) * growth) * (1 + bump);
    const hole = radius * scale;
    setVar('--sx', `${(cx - home.x).toFixed(1)}px`);
    setVar('--sy', `${(cy - home.y).toFixed(1)}px`);
    setVar('--ss', scale.toFixed(4));
    heroPortal.setZoom(scale);

    let eaten = 0;
    for (const piece of pieces) {
      const t = clamp((p - piece.start) / FLIGHT);
      const f = Math.pow(t, 2.3); // reluctant at first, then it cannot hold on
      const vx = piece.x - cx;
      const vy = piece.y - cy;
      const dist = Math.hypot(vx, vy) || 1;

      if (t >= 1) {
        eaten++;
        if (!piece.eaten && !quiet) {
          heroPortal.gulp(piece.big ? 1 : 0.45);
          bump = Math.min(0.09, bump + (piece.big ? 0.022 : 0.009));
        }
        piece.eaten = true;
        write(piece, `translate(${(cx - piece.x + piece.fix).toFixed(1)}px, ${(cy - piece.y).toFixed(1)}px) scale(0)`, 0, 0);
        continue;
      }
      piece.eaten = false;

      if (pull < 0.002 && t <= 0) {
        write(piece, piece.fix ? `translate(${piece.fix.toFixed(2)}px, 0)` : '', 1, 0);
        continue;
      }

      // Before it lets go: a tremble, and a lean towards the portal that grows as its turn comes.
      const soon = smooth(piece.start - 0.13, piece.start, p);
      const hold = (1 - f) * pull;
      const lean = Math.min(20, piece.size * 0.28) * soon * hold;
      const shake = Math.min(2.4, piece.size * 0.035) * (0.3 + 0.7 * soon) * hold;
      const jx = Math.sin(time * (17 + piece.seed * 9) + piece.seed * 40) * shake;
      const jy = Math.cos(time * (21 + piece.seed * 7) + piece.seed * 17) * shake;

      // The fall: a spiral that tightens, clockwise like the vortex itself.
      const angle = (1.3 + piece.seed * 0.9) * (0.4 * f + 0.6 * f * f * f);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const reach = 1 - f;
      const px = cx + (vx * cos - vy * sin) * reach;
      const py = cy + (vx * sin + vy * cos) * reach;

      // Inside the rim it shrinks with depth, takes on the portal's light and fades out.
      const depth = (dist * reach) / hole;
      const size = Math.min(1, Math.pow(clamp(depth, 0.02, 1), 0.85)) * (1 - 0.12 * f);
      const turn = (150 + 260 * piece.seed) * f * f + (piece.seed - 0.5) * 5 * soon * hold;
      const dx = px - piece.x + piece.fix - (vx / dist) * lean + jx;
      const dy = py - piece.y - (vy / dist) * lean + jy;
      write(
        piece,
        `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) rotate(${turn.toFixed(1)}deg) scale(${size.toFixed(3)})`,
        clamp(depth / 0.5),
        t > 0 ? 1 - smooth(0.45, 1.2, depth) : 0,
      );
    }

    // The last bite: one big gulp and a shockwave.
    const full = pieces.length > 0 && eaten === pieces.length;
    if (full && !stage.hasAttribute('data-full') && !quiet) {
      heroPortal.pulse();
      bump = Math.min(0.14, bump + 0.08);
    }
    stage.toggleAttribute('data-full', full);
    stage.toggleAttribute('data-eating', p > eatFrom - 0.08);
    frame.toggleAttribute('data-gone', p > eatTo);
    if (layer && layer.inert !== full) layer.inert = full;

    drawDust(pull, cx + origin.x, cy + origin.y, hole, dt);
    quiet = false;
    return pull;
  }

  split();
  ready = true;
  measure();
  // Again when the entrance animation is over (the text was still sliding into place just now), and whenever a font
  // arrives, because the letters sit differently in the real font than in the fallback.
  window.setTimeout(measure, 2000);
  document.fonts?.addEventListener?.('loadingdone', measure);

  return { update, measure };
}
