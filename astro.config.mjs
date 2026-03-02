import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  integrations: [tailwind()],
  output: 'static',
  adapter: cloudflare({
    imageService: 'compile', // Optimizes images at build time, avoids sharp at runtime
    platformProxy: {
      enabled: true,
    },
  }),
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en'],
    routing: {
      prefixDefaultLocale: true
    }
  }
});
