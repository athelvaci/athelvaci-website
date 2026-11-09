# Previous portrait (backup)

`me-cutout-suit.webp` is the portrait that was on the site before the selfie: the photo in the dark suit, cut out of its background. Nothing here is published; only `public/` is.

To switch back:

1. Copy `backup/me-cutout-suit.webp` over `public/me-cutout.webp`.
2. In `src/components/Hero.astro`, at the top of `.hero-stage`, set `--fig-h: 2.25; --fig-x: 0; --fig-y: 0.025; --fig-aspect: 0.6627;` and give the `<img>` `width="564" height="851"`.
3. Run `npm run build`. Retake `public/og.jpg` if you want the social preview to match.
