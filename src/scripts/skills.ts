// Periodic table of skills: inspect an element, filter by group.

export function initSkills() {
  const root = document.querySelector<HTMLElement>('[data-skills]');
  if (!root) return;

  const tiles = [...root.querySelectorAll<HTMLButtonElement>('[data-el]')];
  const filters = [...root.querySelectorAll<HTMLButtonElement>('[data-filter]')];
  const out = {
    sym: root.querySelector<HTMLElement>('[data-out-sym]'),
    name: root.querySelector<HTMLElement>('[data-out-name]'),
    group: root.querySelector<HTMLElement>('[data-out-group]'),
    note: root.querySelector<HTMLElement>('[data-out-note]'),
  };

  const show = (tile: HTMLButtonElement) => {
    if (out.sym) out.sym.textContent = tile.dataset.sym ?? '';
    if (out.name) out.name.textContent = tile.dataset.name ?? '';
    if (out.group) out.group.textContent = tile.dataset.groupLabel ?? '';
    if (out.note) out.note.textContent = tile.dataset.note ?? '';
    root.dataset.activeGroup = tile.dataset.group ?? '';
    tiles.forEach((t) => t.setAttribute('aria-pressed', String(t === tile)));
  };

  tiles.forEach((tile) => {
    tile.addEventListener('click', () => show(tile));
    tile.addEventListener('focus', () => show(tile));
    tile.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'mouse') show(tile);
    });
  });

  filters.forEach((filter) => {
    filter.addEventListener('click', () => {
      const value = filter.dataset.filter ?? 'all';
      filters.forEach((f) => f.setAttribute('aria-pressed', String(f === filter)));
      tiles.forEach((tile) => {
        tile.toggleAttribute('data-dim', value !== 'all' && tile.dataset.group !== value);
      });
    });
  });
}
