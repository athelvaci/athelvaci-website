// The experience map: a thread that fills as you scroll, lighting up each stop on the way back in time.

export function initTimeline() {
  const map = document.querySelector<HTMLElement>('[data-map]');
  if (!map) return;

  const stops = [...map.querySelectorAll<HTMLElement>('[data-stop]')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduce) {
    map.style.setProperty('--progress', '100%');
    stops.forEach((stop) => stop.setAttribute('data-lit', ''));
    return;
  }

  let ticking = false;

  const update = () => {
    ticking = false;
    const line = window.innerHeight * 0.62;
    const rect = map.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, (line - rect.top) / rect.height));
    map.style.setProperty('--progress', `${(progress * 100).toFixed(2)}%`);
    stops.forEach((stop) => {
      stop.toggleAttribute('data-lit', stop.getBoundingClientRect().top < line);
    });
  };

  const request = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  update();
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
}
