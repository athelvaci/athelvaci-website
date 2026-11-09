// Navigation: scrolled state, mobile menu and "you are here" highlighting on the home page.

export function initNav() {
  const header = document.querySelector<HTMLElement>('[data-nav]');
  if (!header) return;

  const onScroll = () => header.toggleAttribute('data-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const button = header.querySelector<HTMLButtonElement>('[data-menu-btn]');
  const menu = header.querySelector<HTMLElement>('#site-menu');

  const close = () => {
    header.removeAttribute('data-open');
    button?.setAttribute('aria-expanded', 'false');
  };

  button?.addEventListener('click', () => {
    const open = header.toggleAttribute('data-open');
    button.setAttribute('aria-expanded', String(open));
  });
  menu?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a')) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  // Highlight the section in view (home page only).
  if (location.pathname !== '/') return;
  const links = new Map<string, HTMLAnchorElement>();
  header.querySelectorAll<HTMLAnchorElement>('[data-section]').forEach((a) => links.set(a.dataset.section ?? '', a));
  const sections = [...links.keys()].map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
  if (!sections.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        links.forEach((a) => a.removeAttribute('aria-current'));
        links.get(entry.target.id)?.setAttribute('aria-current', 'true');
      }
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  sections.forEach((section) => observer.observe(section));
}
