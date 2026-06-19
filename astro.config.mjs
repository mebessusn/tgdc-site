import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// `site` is your real domain — used for canonical links, absolute Open Graph
// image URLs, and the generated sitemap. Change it if your domain changes.
export default defineConfig({
  site: 'https://topgamedevelopmentcompany.com',
  integrations: [sitemap()],
});
