import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts } from '../lib/content';
import { site } from '../data/site';

export async function GET(context: APIContext) {
  const posts = await getPosts();

  return rss({
    title: `${site.title} blog`,
    description: 'Notes on Java, Spring Boot, Vue.js and Azure.',
    site: context.site ?? site.url,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/blog/${post.id}/`,
    })),
    customData: '<language>en</language>',
  });
}
