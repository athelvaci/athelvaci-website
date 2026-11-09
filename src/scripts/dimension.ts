// Dimension switcher: three colour palettes, remembered between visits.
// The first paint is handled by a tiny inline script in the layout (no flash of the wrong palette).

import { dimensions } from '../data/site';

export type DimensionId = (typeof dimensions)[number]['id'];

const KEY = 'dimension';
const ids: string[] = dimensions.map((d) => d.id);

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => {
    ready: Promise<void>;
    updateCallbackDone: Promise<void>;
    finished: Promise<void>;
  };
};

export function getDimension(): DimensionId {
  const current = document.documentElement.dataset.dimension ?? '';
  return (ids.includes(current) ? current : 'mint') as DimensionId;
}

function syncControls() {
  const current = getDimension();
  const label = dimensions.find((d) => d.id === current)?.label ?? '';

  document.querySelectorAll<HTMLButtonElement>('[data-dimension-set]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.dimensionSet === current));
  });
  document.querySelectorAll<HTMLElement>('[data-dimension-name]').forEach((el) => {
    el.textContent = label;
  });

  const meta = document.querySelector('meta[name="theme-color"]');
  const color = getComputedStyle(document.documentElement).getPropertyValue('--theme-color').trim();
  if (meta && color) meta.setAttribute('content', color);
}

function apply(id: DimensionId) {
  document.documentElement.dataset.dimension = id;
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* storage can be unavailable (private mode); the palette just won't persist */
  }
  syncControls();
  window.dispatchEvent(new CustomEvent('dimensionchange', { detail: id }));
}

export function setDimension(id: DimensionId, origin?: { x: number; y: number }) {
  if (id === getDimension()) return;

  const root = document.documentElement;
  const doc = document as ViewTransitionDocument;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!doc.startViewTransition || reduce) {
    apply(id);
    return;
  }

  const x = origin?.x ?? window.innerWidth / 2;
  const y = origin?.y ?? window.innerHeight / 2;
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

  root.style.setProperty('--hop-x', `${x}px`);
  root.style.setProperty('--hop-y', `${y}px`);
  root.style.setProperty('--hop-r', `${radius}px`);
  root.dataset.vt = 'hop';

  // A transition can be skipped (a second click, a hidden tab). That rejects its promises, which is not an error here.
  const transition = doc.startViewTransition(() => apply(id));
  const cleanup = () => {
    delete root.dataset.vt;
  };
  transition.ready.catch(() => {});
  transition.updateCallbackDone.catch(() => {});
  transition.finished.then(cleanup, cleanup);
}

export function nextDimension(origin?: { x: number; y: number }) {
  const index = ids.indexOf(getDimension());
  setDimension(ids[(index + 1) % ids.length] as DimensionId, origin);
}

export function initDimension() {
  syncControls();
  document.querySelectorAll<HTMLButtonElement>('[data-dimension-set]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const rect = btn.getBoundingClientRect();
      setDimension(btn.dataset.dimensionSet as DimensionId, {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    });
  });
}
