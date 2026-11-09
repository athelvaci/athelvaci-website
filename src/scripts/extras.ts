// Small touches: email assembly, copy-to-clipboard, local clock, and a hidden cheat code.

import { site } from '../data/site';

let toastTimer = 0;

export function toast(message: string) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    document.body.append(el);
  }
  el.textContent = message;
  // Restart the transition if a toast is already showing.
  el.removeAttribute('data-show');
  void el.offsetWidth;
  el.setAttribute('data-show', '');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el?.removeAttribute('data-show'), 2600);
}

function initEmail() {
  const address = `${site.email.user}@${site.email.domain}`;

  document.querySelectorAll<HTMLAnchorElement>('[data-email]').forEach((a) => {
    a.href = `mailto:${address}`;
    if (a.hasAttribute('data-email-text')) a.textContent = address;
  });

  document.querySelectorAll<HTMLButtonElement>('[data-copy-email]').forEach((button) => {
    button.hidden = false;
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(address);
        toast('Email address copied.');
      } catch {
        toast(address);
      }
    });
  });
}

function initClock() {
  const targets = document.querySelectorAll<HTMLElement>('[data-clock]');
  if (!targets.length) return;
  const format = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: site.timezone });
  const tick = () => targets.forEach((el) => (el.textContent = format.format(new Date())));
  tick();
  document.querySelectorAll<HTMLElement>('[data-clock-wrap]').forEach((el) => el.removeAttribute('hidden'));
  window.setInterval(tick, 30_000);
}

function portalStorm() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    toast('Cheat code accepted. The storm is skipped because you prefer reduced motion.');
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '80' });
  document.body.append(canvas);

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas.remove();
  ctx.scale(dpr, dpr);

  const cs = getComputedStyle(document.documentElement);
  const palette = ['--portal-1', '--portal-2', '--portal-3'].map((name) => cs.getPropertyValue(name).trim() || '#25e57a');

  const rings = Array.from({ length: 7 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    delay: Math.random() * 1.2,
    size: 90 + Math.random() * 140,
    color: palette[Math.floor(Math.random() * palette.length)],
  }));

  const total = 2.8;
  const started = performance.now();

  const frame = (now: number) => {
    const elapsed = (now - started) / 1000;
    ctx.clearRect(0, 0, w, h);
    for (const ring of rings) {
      const p = (elapsed - ring.delay) / 1.4;
      if (p <= 0 || p >= 1) continue;
      const eased = 1 - Math.pow(1 - p, 3);
      ctx.globalAlpha = 1 - p;
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = 6 * (1 - p) + 1;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.size * eased, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.size * eased * 0.7, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (elapsed < total) requestAnimationFrame(frame);
    else canvas.remove();
  };

  requestAnimationFrame(frame);
  toast('Cheat code accepted. Portal storm incoming.');
}

function initKonami() {
  const code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let index = 0;
  window.addEventListener('keydown', (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    index = key === code[index] ? index + 1 : key === code[0] ? 1 : 0;
    if (index === code.length) {
      index = 0;
      portalStorm();
    }
  });
}

export function initExtras() {
  initEmail();
  initClock();
  initKonami();

  document.querySelectorAll<HTMLElement>('[data-year]').forEach((el) => (el.textContent = String(new Date().getFullYear())));

  console.log(
    '%cHey, fellow dimension-hopper.%c\nThe source is plain Astro, TypeScript and CSS. Try the Konami code.',
    'font: 700 15px system-ui; color: #0a7a47',
    'font: 13px system-ui',
  );
}
