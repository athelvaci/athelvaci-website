# athelvaci.com

Personal site of Ahmet Tufan Helvaci, built with [Astro](https://astro.build). A canvas portal, a periodic table of skills, a career map, a blog and a projects page. Static files only: no cookies, no trackers, no third-party requests.

## Run it

Needs Node 22.23 or newer.

```sh
npm install
npm run dev       # http://localhost:4321 (draft posts and projects are visible here)
npm run build     # static site in dist/
npm run preview   # serve the build locally
```

## Add a blog post

Copy `src/content/blog/_post-template.md` to `src/content/blog/my-post.md` (the file name becomes the URL: `/blog/my-post/`) and fill in the front matter. Files that start with `_` are ignored, and `draft: true` hides a post from production builds.

Posts from the old Gatsby site work as they are: copy a whole folder (for example `content/blog/hello-world/` with its `index.md` and images) into `src/content/blog/` and the URL stays `/blog/hello-world/`. The `title`, `date` and `description` front matter is the same.

## Add a project

Copy `src/content/projects/_project-template.md` to `src/content/projects/my-project.md`. Each project gets a generated cover picture, so no image is needed. To keep an old URL with capital letters, add `slug: NLP` to the front matter.

## The hero portrait

The hero stays pinned for a little over two screens of scrolling, and the scroll plays in acts:

1. The portrait is twisted into the vortex and swallowed.
2. The portal grows and drifts to the middle of the screen while it eats the rest of the hero: the headline letter by letter, the intro word by word, then the buttons. Dust streams in from the edges while it feeds.
3. A short pause, then the portal shrinks and closes while the About section comes up from below.

Scrolling back up reverses all of it. Phones show the portal above the headline. On very short windows nothing is pinned and only the portrait is swallowed; with reduced motion, or without JavaScript, the portrait simply stands in the portal.

- How long the pinned scroll is: `--pin` at the top of `.hero` in `src/components/Hero.astro` (`220vh` is 2.2 screens).
- When each act starts and ends: `ACTS` at the top of `src/scripts/figure.ts`, as shares of the pinned scroll.
- How the text is eaten (order, spiral, tremble, dust): `src/scripts/feast.ts`.

- The picture is `public/me-cutout.webp`: your photo with the background removed (transparent WebP, 1048 x 1180). To use another photo, remove its background with any tool that keeps soft edges around the hair and save it over this file. Crop from just above the hair down to the chest or belt. The sides and the bottom should reach past the portal's edge, because the portal's rim cuts the body off there; if the photo ends too early, stretch the shirt a little further.
- If the new cut-out has other proportions, update `--fig-h`, `--fig-aspect`, `--fig-x` and `--fig-y` at the top of `.hero-stage` in `src/components/Hero.astro` (sizes are in portal radii, y counts upwards from the middle of the portal), and the `width` and `height` of the `<img>` next to it.
- The previous portraits (the selfie and the dark suit) are kept in `backup/`, with the steps to switch back.
- `src/scripts/figure.ts` draws it with a small WebGL shader. Without WebGL the plain image is scrubbed with CSS instead, and without JavaScript it just stands there.

After changing the photo you may want a fresh social preview image: take a screenshot of the hero at 1200 x 630 and save it as `public/og.jpg`.

## Change the text

| What | Where |
| --- | --- |
| Name, email, links, menu | `src/data/site.ts` |
| About text, patch notes, books, series, films | `src/data/about.ts` |
| Jobs, schools, languages | `src/data/experience.ts` |
| Periodic table of skills | `src/data/skills.ts` |
| Hero headline and intro | `src/components/HeroCopy.astro` |
| Colors of the three dimensions | top of `src/styles/global.css` |

A resume PDF can be added at `public/resume.pdf`; the Resume page then shows a download button. The page itself prints cleanly to two A4 pages.

## Deploy to Netlify

1. Replace the old Gatsby files in the repository with this project (or push it to a new branch and deploy that branch).
2. Netlify reads `netlify.toml`: build command `npm run build`, publish folder `dist`, Node 22. These settings override the old Gatsby ones from the Netlify UI. If a build stops with a Node version error, set `NODE_VERSION` in `netlify.toml` (and `.nvmrc`) to `22.23.4` or newer.
3. If the old site used a Gatsby plugin such as `netlify-plugin-gatsby-cache`, remove it under Site configuration > Plugins, then run "Clear cache and deploy site" once.
4. The domain does not change.

## Old links

`/about/` redirects to `/#about`. `/blog/`, `/projects/` and `/resume/` all exist. `/blog/hello-world/` style URLs keep working when the post folders are copied over as described above.

## Notes

- The email address is assembled in the browser, so simple scrapers do not pick it up. A phone number is deliberately not on the site.
- The portal and the portrait pause when they are off screen. Visitors who prefer reduced motion get a still portal with the portrait standing in it and no pinned scrolling.
- Fonts (Mona Sans, JetBrains Mono, Reenie Beanie) are self-hosted through Fontsource under the SIL Open Font License.
- The Konami code does something. Not documented further.

## Company logos

Logos for the Experience section live in `public/logos/` and are referenced by the `logo` field in `src/data/experience.ts`. Jobs without a `logo` show an initials tile. To add one, drop an SVG into `public/logos/` and set `logo: '/logos/name.svg'`. Logos are trademarks of their owners and are used only to identify where I worked.
