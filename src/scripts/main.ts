import { initDimension } from './dimension';
import { initNav } from './nav';
import { initPortals } from './portal';
import { initFigure } from './figure';
import { initTimeline } from './timeline';
import { initSkills } from './skills';
import { initExtras } from './extras';

function boot() {
  initDimension();
  initNav();
  initPortals();
  initFigure();
  initTimeline();
  initSkills();
  initExtras();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
