import { getCollection } from 'astro:content';

// Drafts show up in `npm run dev` and are hidden from production builds.
const visible = ({ data }: { data: { draft: boolean } }) => import.meta.env.DEV || !data.draft;

export async function getPosts() {
  const posts = await getCollection('blog', visible);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export async function getProjects() {
  const items = await getCollection('projects', visible);
  return items.sort(
    (a, b) => Number(b.data.featured) - Number(a.data.featured) || b.data.date.valueOf() - a.data.date.valueOf(),
  );
}
