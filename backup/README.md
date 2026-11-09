# Previous portraits (backup)

Earlier hero portraits, each cut out of its background. Nothing here is published; only `public/` is.

| File | What it is | Settings in `Hero.astro` |
| --- | --- | --- |
| `me-cutout-selfie.webp` | The selfie in the white shirt, with the teeth and lip retouch | `--fig-h: 2.329; --fig-x: -0.08; --fig-y: -0.03; --fig-aspect: 0.9521;` and `width="914" height="960"` |
| `me-cutout-selfie-original.webp` | The same selfie, untouched | Same as above |
| `me-cutout-suit.webp` | The photo in the dark suit | `--fig-h: 2.25; --fig-x: 0; --fig-y: 0.025; --fig-aspect: 0.6627;` and `width="564" height="851"` |

To switch back to one of them:

1. Copy the file over `public/me-cutout.webp`.
2. In `src/components/Hero.astro`, set the four `--fig-*` values at the top of `.hero-stage` and the `width` and `height` of the `<img>` to the ones in the table.
3. Run `npm run build`. Retake `public/og.jpg` if you want the social preview to match.
