---
title: athelvaci.com
description: This website. An Astro site with a canvas portal, a periodic table of skills and a dimension switcher.
date: 2026-11-04
status: live
url: https://athelvaci.com
tags: [Astro, TypeScript, Canvas]
featured: true
---

I rebuilt my old Gatsby site from scratch in November 2026. It is static, fast and has no tracking or third-party scripts.

## How it works

- **The portal** is a single `<canvas>`. Spiral ribbons, drifting particles and a wobbling rim are drawn every frame, and the colors come from CSS variables, so it re-tints when you hop to another dimension.
- **Dimensions** are three palettes (mint, sunset and night) swapped through CSS custom properties. The switch uses the View Transitions API for the circular reveal.
- **The portal swallows my portrait** as you scroll. A small WebGL shader twists the photo into the vortex, and scrolling back up brings it out again.
- **Blog posts and projects** are Markdown files with a little front matter. Adding one means adding a file.

## Built with

Astro, TypeScript and plain CSS. Fonts are self-hosted, and the whole thing deploys as static files.
