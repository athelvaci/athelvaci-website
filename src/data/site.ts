// Everything personal that appears in more than one place lives here.
// Change a value once and the whole site follows.

export const site = {
  name: 'Ahmet Tufan Helvaci',
  shortName: 'Tufan',
  title: 'Ahmet Tufan Helvaci',
  tagline: 'Senior full-stack Java engineer in Amsterdam',
  description:
    'Personal site of Ahmet Tufan Helvaci, a senior full-stack Java engineer in Amsterdam. Experience, projects, and a blog.',
  url: 'https://athelvaci.com',
  location: 'Amsterdam, Netherlands',
  timezone: 'Europe/Amsterdam',

  // The address is assembled in the browser so basic scrapers do not collect it.
  email: { user: 'athelvaci', domain: 'gmail.com' },

  social: {
    github: 'https://github.com/athelvaci',
    linkedin: 'https://www.linkedin.com/in/athelvaci/',
  },

  nav: [
    { label: 'About', href: '/#about', section: 'about' },
    { label: 'Experience', href: '/#experience', section: 'experience' },
    { label: 'Skills', href: '/#skills', section: 'skills' },
    { label: 'Projects', href: '/projects/', section: 'projects' },
    { label: 'Blog', href: '/blog/', section: 'blog' },
    { label: 'Contact', href: '/#contact', section: 'contact' },
  ],
} as const;

export const dimensions = [
  { id: 'mint', label: 'Mint', swatch: 'linear-gradient(135deg, #f1f7e8 50%, #25e57a 50%)' },
  { id: 'sunset', label: 'Sunset', swatch: 'linear-gradient(135deg, #ffebe0 50%, #ff4d8d 50%)' },
  { id: 'night', label: 'Night', swatch: 'linear-gradient(135deg, #0e2a2e 50%, #3cf592 50%)' },
] as const;
