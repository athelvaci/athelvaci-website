// The feast. Once the portal has swallowed the portrait it keeps going: it grows, drifts to the middle of the screen
// and pulls in everything else. The headline goes letter by letter, the intro word by word, then the buttons, and
// the menu bar is eaten alongside, piece by piece, over the same stretch. Each piece trembles, leans towards the
// portal, lets go and spirals in, while specks of dust stream in from the edges of the screen.
//
// Then the portal closes, and on its way out it gives things back: the menu bar flies up to its place again, and the
// About section comes out of the closing point, its heading letter by letter.
//
// Everything follows the scroll position, so scrolling back up plays it all in reverse.

import { heroPortal, readColors } from './portal';

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** When things happen, as shares of the pinned scroll (see the acts in figure.ts). */
export interface FeastActs {
  eatFrom: number;
  eatTo: number;
  closeFrom: number;
  closeTo: number;
  emergeFrom: number;
  emergeTo: number;
}

/** hero: eaten for good. nav: eaten, then given back. about: comes out of the closing portal. */
type Kind = 'hero' | 'nav' | 'about';

interface Piece {
  el: HTMLElement;
  kind: Kind;
  /** A box that this script never moves, and where the centre of the piece sits inside it at rest. */
  anchor: HTMLElement;
  ax: number;
  ay: number;
  /** Its height, which sets how much it trembles and leans. */
  size: number;
  /** Split letters lose their kerning; this many pixels put each one back where the browser had it. */
  fix: number;
  /** A stable random number per piece, so every visit plays the same. */
  seed: number;
  /** The scroll progress at which it lets go (hero, nav) or comes out (about). */
  start: number;
  /** For the menu bar: the scroll progress at which the piece starts its way back. */
  back: number;
  big: boolean;
  /** A link or a button (or something holding one). While it is inside the portal it cannot be tabbed to. */
  focusable: boolean;
  /** Letters and small things tumble on the way; blocks of text travel straight. */
  tumble: boolean;
  /** False while the piece is not on the page at all, like the menu links on a phone. */
  shown: boolean;
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
const NAV_FLIGHT = 0.1;
/** How long a piece takes to come out of the closing portal. The menu bar and the About section share it. */
const OUT_FLIGHT = 0.1;

export function createFeast(stage: HTMLElement, frame: HTMLElement, acts: FeastActs) {
  const scene = stage.querySelector<HTMLElement>('.hero-scene');
  const portal = stage.querySelector<HTMLElement>('.hero-portal');
  const layer = stage.querySelector<HTMLElement>('.hero-layer');
  const header = document.querySelector<HTMLElement>('[data-nav]');
  const about = document.querySelector<HTMLElement>('#about');
  const debris = frame.querySelector<HTMLCanvasElement>('[data-hero-debris]');
  const ctx = debris?.getContext('2d') ?? null;

  const pieces: Piece[] = [];
  /** Text that was cut into letters: the element, its text, and which letter is which piece. */
  const lettered: { el: HTMLElement; text: string; letters: { piece: Piece; index: number }[] }[] = [];
  let quiet = true; // the first pass after loading or resizing makes no fuss about what is already eaten

  // Geometry, relative to the stage and in pixels (see measure()).
  const home = { x: 0, y: 0 }; // where the portal sits at rest
  const mid = { x: 0, y: 0 }; // the middle of the screen, where it ends up
  let navHomeX = 0; // the portal's resting place, measured along the menu bar
  let radius = 1;
  let maxScale = 1.6;

  let bump = 0;
  let colors = readColors();
  window.addEventListener('dimensionchange', () => {
    colors = readColors();
  });

  // ---------- Cutting things into pieces ----------

  function add(el: HTMLElement, kind: Kind, anchor: HTMLElement, options: { big?: boolean; tumble?: boolean } = {}) {
    const seed = Math.abs(Math.sin((pieces.length + 1) * 12.9898) * 43758.5453) % 1;
    const piece: Piece = {
      el,
      kind,
      anchor,
      ax: 0,
      ay: 0,
      size: 16,
      fix: 0,
      seed,
      start: 1,
      back: 2,
      big: options.big ?? false,
      focusable: el.matches('a, button') || !!el.querySelector('a, button'),
      tumble: options.tumble ?? true,
      shown: true,
      eaten: false,
      written: '',
    };
    if (kind === 'about') el.classList.add('fx-out');
    pieces.push(piece);
    return piece;
  }

  /** Turns the text of an element into one box per letter. Spaces stay ordinary spaces. */
  function splitLetters(el: HTMLElement, kind: Kind, anchor: HTMLElement) {
    const node = el.firstChild;
    if (!(node instanceof Text) || el.childNodes.length !== 1) return void add(el, kind, anchor, { big: true });
    const text = node.data;
    const entry: (typeof lettered)[number] = { el, text, letters: [] };
    const parts: (Node | string)[] = [];
    for (let i = 0; i < text.length; i++) {
      if (/\s/.test(text[i])) {
        parts.push(text[i]);
        continue;
      }
      const span = document.createElement('span');
      span.className = 'fx-ch';
      span.textContent = text[i];
      span.setAttribute('aria-hidden', 'true');
      parts.push(span);
      entry.letters.push({ piece: add(span, kind, anchor, { big: true }), index: i });
    }
    el.replaceChildren(...parts);
    lettered.push(entry);
  }

  function splitWords(paragraph: HTMLElement, kind: Kind, anchor: HTMLElement) {
    if (paragraph.children.length) return void add(paragraph, kind, anchor, { tumble: false });
    const words = (paragraph.textContent ?? '').trim().split(/\s+/);
    paragraph.replaceChildren();
    words.forEach((word, i) => {
      if (i) paragraph.append(' ');
      const span = document.createElement('span');
      span.className = 'fx-wd';
      span.textContent = word;
      paragraph.append(span);
      add(span, kind, anchor);
    });
  }

  /** Screen readers get a headline as one name instead of a row of loose letters. */
  const nameIt = (el: HTMLElement | null | undefined) => {
    if (el) el.setAttribute('aria-label', (el.textContent ?? '').replace(/\s+/g, ' ').trim());
  };

  function split() {
    // The hero: headline, intro, buttons.
    nameIt(stage.querySelector<HTMLElement>('.hero-title'));
    stage.querySelectorAll<HTMLElement>('.hero-title .line-in').forEach((line) => splitLetters(line, 'hero', stage));
    const lead = stage.querySelector<HTMLElement>('.hero-lead');
    if (lead) splitWords(lead, 'hero', stage);
    stage.querySelectorAll<HTMLElement>('.hero-actions .btn').forEach((button) => add(button, 'hero', stage, { big: true }));

    // The menu bar: the name, each link, the dimension switcher, and the menu button on phones.
    if (header) {
      header
        .querySelectorAll<HTMLElement>('.brand, .menu-list > li, .menu > .dim, .menu-btn')
        .forEach((el) => add(el, 'nav', header, { big: true }));
    }

    // The About section: the heading in letters, then the quote and the paragraphs as whole blocks.
    const head = about?.querySelector<HTMLElement>('.about-head');
    const copy = about?.querySelector<HTMLElement>('.about-copy');
    if (head) {
      const heading = head.querySelector<HTMLElement>('h2');
      nameIt(heading);
      if (heading) splitLetters(heading, 'about', head);
      head.querySelectorAll<HTMLElement>(':scope > blockquote').forEach((el) => add(el, 'about', head, { tumble: false }));
    }
    copy?.querySelectorAll<HTMLElement>(':scope > p').forEach((el) => add(el, 'about', copy, { tumble: false }));
  }

  /**
   * Letters in separate boxes are no longer kerned against each other, which would shift a headline by a few pixels.
   * So the text is set once more as plain text, out of sight, and every letter is nudged to where it sits in that.
   * Call this with the letters' own transforms cleared.
   */
  function measureKerning() {
    const range = document.createRange();
    for (const entry of lettered) {
      if (!entry.letters.length) continue;
      const probe = document.createElement('span');
      probe.textContent = entry.text;
      probe.setAttribute('aria-hidden', 'true');
      probe.style.cssText = 'position:absolute;left:0;top:0;visibility:hidden;white-space:pre;pointer-events:none';
      entry.el.append(probe);
      const node = probe.firstChild!;
      const charLeft = (i: number) => {
        range.setStart(node, i);
        range.setEnd(node, i + 1);
        return range.getBoundingClientRect().left;
      };
      const first = entry.letters[0];
      const probeFrom = charLeft(first.index);
      const boxFrom = first.piece.el.getBoundingClientRect().left;
      for (const { piece, index } of entry.letters) {
        piece.fix = charLeft(index) - probeFrom - (piece.el.getBoundingClientRect().left - boxFrom);
      }
      probe.remove();
    }
  }

  const restTransform = (piece: Piece) => (Math.abs(piece.fix) > 0.005 ? `translate(${piece.fix.toFixed(2)}px, 0)` : '');

  // ---------- Measuring ----------

  function measure() {
    if (!scene || !portal) return;

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
    radius = Math.max(1, portal.offsetWidth / 2 / 1.35);
    // It grows until it nearly fills the screen: a bit taller than the frame, but never wider than the window.
    maxScale = clamp(Math.min(f.height * 0.58, f.width * 0.52) / radius, 1.15, 2.2);
    navHomeX = header ? p.left + p.width / 2 - header.getBoundingClientRect().left : 0;

    measureKerning();
    for (const piece of pieces) {
      piece.shown = piece.el.getClientRects().length > 0;
      const r = piece.el.getBoundingClientRect();
      const a = piece.anchor.getBoundingClientRect();
      piece.size = r.height;
      piece.ax = r.left + r.width / 2 - a.left + piece.fix;
      piece.ay = r.top + r.height / 2 - a.top;
      piece.written = '';
    }
    scene.style.transform = '';
    for (const piece of pieces) piece.el.style.transform = restTransform(piece);

    schedule();

    if (debris && ctx) {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      debris.width = Math.round(debris.clientWidth * dpr);
      debris.height = Math.round(debris.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      specks.length = 0;
    }
    quiet = true;
  }

  /** Decides when each piece has its turn. */
  function schedule() {
    const { eatFrom, eatTo, emergeFrom, emergeTo } = acts;
    const spread = (list: Piece[], from: number, to: number, power = 1) =>
      list.forEach((piece, i) => {
        const rank = list.length > 1 ? i / (list.length - 1) : 0;
        piece.start = from + (to - from) * clamp(Math.pow(rank, power) + (list.length > 12 ? (piece.seed - 0.5) * 0.035 : 0));
      });
    const nearest = (point: { x: number; y: number }) => (a: Piece, b: Piece) =>
      Math.hypot(a.ax - point.x, a.ay - point.y) - Math.hypot(b.ax - point.x, b.ay - point.y);
    const of = (kind: Kind) => pieces.filter((piece) => piece.kind === kind && piece.shown);

    // The hero and the menu bar are eaten side by side: both start at the same moment, and both are gone at the end.
    // Within each, what is nearest to the portal goes first.
    spread(of('hero').sort(nearest(home)), eatFrom, eatTo - FLIGHT, 0.92);
    const nav = of('nav').sort((a, b) => Math.abs(a.ax - navHomeX) - Math.abs(b.ax - navHomeX));
    spread(nav, eatFrom, eatTo - NAV_FLIGHT);

    // What the portal gives back comes out over one and the same stretch of the scroll: the menu bar and the About
    // section start together and land together, so on the way back up they are also pulled in together.
    const span = emergeTo - OUT_FLIGHT - emergeFrom;
    nav.forEach((piece, i) => {
      piece.back = emergeFrom + span * (nav.length > 1 ? i / (nav.length - 1) : 0);
    });

    // About: the heading first, in reading order, then the quote and the paragraphs.
    const out = of('about');
    spread(out.filter((piece) => piece.tumble), emergeFrom, emergeFrom + span * 0.45);
    spread(out.filter((piece) => !piece.tumble), emergeFrom + span * 0.5, emergeFrom + span);
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

  function setEaten(piece: Piece, eaten: boolean) {
    if (piece.eaten === eaten) return;
    piece.eaten = eaten;
    if (piece.focusable) piece.el.inert = eaten;
  }

  // What lies below the opening of the About section waits until the opening has arrived.
  let restWritten = '';
  function setAboutRest(value: number) {
    const text = value >= 0.999 ? '' : value.toFixed(3);
    if (text === restWritten || !about) return;
    restWritten = text;
    if (text) about.style.setProperty('--emerge', text);
    else about.style.removeProperty('--emerge');
  }

  // The bar behind the menu fades with its contents, and while they are away it cannot be clicked or tabbed into.
  let navWritten = '';
  function setNav(gone: number, away: boolean) {
    if (!header) return;
    const text = `${gone.toFixed(3)}|${away}`;
    if (text === navWritten) return;
    navWritten = text;
    if (gone > 0.001) header.style.setProperty('--eaten', gone.toFixed(3));
    else header.style.removeProperty('--eaten');
    header.toggleAttribute('data-eaten', gone > 0.5);
    if (header.inert !== away) header.inert = away;
  }

  /** Puts everything back as if the page had just loaded (used when the hero is not pinned). */
  function rest() {
    setVar('--sx', '0px');
    setVar('--sy', '0px');
    setVar('--ss', '1');
    stage.removeAttribute('data-eating');
    stage.removeAttribute('data-full');
    frame.removeAttribute('data-gone');
    if (layer?.inert) layer.inert = false;
    setNav(0, false);
    header?.removeAttribute('data-feast');
    setAboutRest(1);
    for (const piece of pieces) {
      setEaten(piece, false);
      write(piece, restTransform(piece), 1, 0);
    }
    drawDust(0, 0, 0, 0, 0);
  }

  /**
   * Moves everything to where it belongs at scroll progress `p`. `closed` is how far the portal has shrunk on its
   * way out (1 = full size, 0 = gone). Returns how hard the portal is pulling (0 to 1), which spins it up.
   */
  function update(p: number, time: number, dt: number, pinned: boolean, closed: number): number {
    if (!pinned) {
      rest();
      return 0;
    }

    const { eatFrom, eatTo, closeFrom, closeTo, emergeTo } = acts;
    const pull = smooth(eatFrom - 0.06, eatFrom + 0.1, p) * (1 - smooth(closeFrom + 0.02, closeTo - 0.03, p));
    const drift = smooth(eatFrom, eatFrom + (eatTo - eatFrom) * 0.62, p);
    const growth = smooth(eatFrom, eatTo + 0.01, p);

    bump *= Math.exp(-dt * 5);
    const cx = home.x + (mid.x - home.x) * drift;
    const cy = home.y + (mid.y - home.y) * drift;
    const scale = (1 + (maxScale - 1) * growth) * (1 + bump);
    const hole = radius * scale * Math.max(closed, 0.04);
    setVar('--sx', `${(cx - home.x).toFixed(1)}px`);
    setVar('--sy', `${(cy - home.y).toFixed(1)}px`);
    setVar('--ss', scale.toFixed(4));
    heroPortal.setZoom(scale);

    // Where things are on screen right now. The portal's centre is the one point everything flies to or from.
    const rects = new Map<HTMLElement, DOMRect>();
    const rectOf = (el: HTMLElement) => {
      let rect = rects.get(el);
      if (!rect) rects.set(el, (rect = el.getBoundingClientRect()));
      return rect;
    };
    const s = rectOf(stage);
    const px = s.left + cx;
    const py = s.top + cy;
    const menuOpen = !!header?.hasAttribute('data-open');

    let eaten = 0;
    let edible = 0;
    let heroLeft = 0;
    let navGone = 0;
    let navCount = 0;
    let navWay = 0;
    for (const piece of pieces) {
      if (!piece.shown) continue;
      const a = rectOf(piece.anchor);
      const hx = a.left + piece.ax; // home, on screen
      const hy = a.top + piece.ay;
      const vx = hx - px;
      const vy = hy - py;
      const dist = Math.hypot(vx, vy) || 1;

      // ----- About: out of the closing portal -----
      if (piece.kind === 'about') {
        const t = clamp((p - piece.start) / OUT_FLIGHT);
        if (t >= 1) {
          write(piece, restTransform(piece), 1, 0);
          continue;
        }
        const e = 1 - Math.pow(1 - t, 2.4); // shot out fast, settling gently
        const f = 1 - e;
        const angle = piece.tumble ? -(0.9 + piece.seed * 0.8) * (0.35 * f + 0.65 * f * f * f) : 0;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const dx = px + (vx * cos - vy * sin) * e - hx + piece.fix;
        const dy = py + (vx * sin + vy * cos) * e - hy;
        const size = piece.tumble ? Math.pow(e, 0.75) : 0.06 + 0.94 * Math.pow(e, 0.9);
        const turn = piece.tumble ? -(140 + 220 * piece.seed) * f * f : 0;
        write(
          piece,
          `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) rotate(${turn.toFixed(1)}deg) scale(${size.toFixed(3)})`,
          t <= 0 ? 0 : clamp(e / 0.22),
          piece.tumble ? 1 - smooth(0.25, 0.8, e) : 0,
        );
        continue;
      }

      // ----- Hero and menu bar: into the portal (and, for the menu bar, back out) -----
      const isNav = piece.kind === 'nav';
      let t = clamp((p - piece.start) / (isNav ? NAV_FLIGHT : FLIGHT));
      if (isNav) t = menuOpen ? 0 : clamp(t - clamp((p - piece.back) / OUT_FLIGHT));
      const f = Math.pow(t, 2.3); // reluctant at first, then it cannot hold on
      edible++;
      if (isNav) {
        navCount++;
        navWay += t;
      }

      if (t >= 1) {
        eaten++;
        if (isNav) navGone++;
        if (!piece.eaten && !quiet) {
          heroPortal.gulp(piece.big ? 1 : 0.45);
          bump = Math.min(0.09, bump + (piece.big ? 0.022 : 0.009));
        }
        setEaten(piece, true);
        write(piece, `translate(${(px - hx + piece.fix).toFixed(1)}px, ${(py - hy).toFixed(1)}px) scale(0)`, 0, 0);
        continue;
      }
      setEaten(piece, false);
      if (!isNav) heroLeft++;

      // At rest: nothing is pulling yet, or (for the menu bar) it is back in its place.
      const returned = isNav && p > piece.back;
      if (t <= 0 && (pull < 0.002 || returned)) {
        write(piece, restTransform(piece), 1, 0);
        continue;
      }

      // Before it lets go: a tremble, and a lean towards the portal that grows as its turn comes.
      const soon = returned ? 0 : smooth(piece.start - 0.13, piece.start, p);
      const hold = (1 - f) * pull;
      const lean = Math.min(20, piece.size * 0.28) * soon * hold;
      const shake = returned ? 0 : Math.min(2.4, piece.size * 0.035) * (0.3 + 0.7 * soon) * hold;
      const jx = Math.sin(time * (17 + piece.seed * 9) + piece.seed * 40) * shake;
      const jy = Math.cos(time * (21 + piece.seed * 7) + piece.seed * 17) * shake;

      // The fall: a spiral that tightens, clockwise like the vortex itself.
      const angle = (1.3 + piece.seed * 0.9) * (0.4 * f + 0.6 * f * f * f);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const reach = 1 - f;
      const tx = px + (vx * cos - vy * sin) * reach;
      const ty = py + (vx * sin + vy * cos) * reach;

      // Inside the rim it shrinks with depth, takes on the portal's light and fades out. Only once it has let go:
      // by then the portal may well have grown past a piece that is still holding on.
      const depth = (dist * reach) / hole;
      const loose = smooth(0, 0.2, t);
      const size = (1 - loose * (1 - Math.min(1, Math.pow(clamp(depth, 0.02, 1), 0.85)))) * (1 - 0.12 * f);
      const turn = (150 + 260 * piece.seed) * f * f + (piece.seed - 0.5) * 5 * soon * hold;
      const dx = tx - hx + piece.fix - (vx / dist) * lean + jx;
      const dy = ty - hy - (vy / dist) * lean + jy;
      write(
        piece,
        `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) rotate(${turn.toFixed(1)}deg) scale(${size.toFixed(3)})`,
        1 - loose * (1 - clamp(depth / 0.5)),
        loose * (1 - smooth(0.45, 1.2, depth)),
      );
    }

    // The last bite: one big gulp and a shockwave.
    const full = edible > 0 && eaten === edible;
    if (full && !stage.hasAttribute('data-full') && !quiet) {
      heroPortal.pulse();
      bump = Math.min(0.14, bump + 0.08);
    }
    stage.toggleAttribute('data-full', full);
    stage.toggleAttribute('data-eating', p > eatFrom - 0.08);
    frame.toggleAttribute('data-gone', p > eatTo);
    const heroGone = heroLeft === 0;
    if (layer && layer.inert !== heroGone) layer.inert = heroGone;
    setNav(navCount ? navWay / navCount : 0, navCount > 0 && navGone === navCount);
    // The thin line under the menu bar stays away for the whole show, until the menu is on its way back.
    header?.toggleAttribute('data-feast', p < acts.emergeFrom);
    setAboutRest(smooth(emergeTo - 0.07, emergeTo, p));

    const f = rectOf(frame);
    drawDust(pull, px - f.left, py - f.top, hole, dt);
    quiet = false;
    return pull;
  }

  split();
  measure();
  // Again when the entrance animation is over (the text was still sliding into place just now), and whenever a font
  // arrives, because the letters sit differently in the real font than in the fallback.
  window.setTimeout(measure, 2000);
  document.fonts?.addEventListener?.('loadingdone', measure);

  return { update, measure };
}
