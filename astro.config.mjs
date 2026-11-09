import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://athelvaci.com',
  // The old Gatsby site used trailing slashes (/blog/hello-world/). Keep them so old links still work.
  trailingSlash: 'always',
  build: { format: 'directory' },
  // Astro 7 strips whitespace between inline elements by default (JSX rules).
  // `true` keeps normal HTML whitespace, which is what the templates here assume.
  compressHTML: true,
  integrations: [sitemap()],
  // Old Gatsby route, kept alive.
  redirects: { '/about': '/#about' },
  markdown: {
    shikiConfig: { theme: 'tokyo-night' },
  },
});
