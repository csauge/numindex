import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://numindex.org',
  trailingSlash: 'never',
  build: {
    format: 'file'
  },
  integrations: [sitemap({
    filter: (page) => page !== 'https://numindex.org/',
    i18n: {
      defaultLocale: 'fr',
      locales: {
        fr: 'fr',
        en: 'en'
      }
    }
  })],
  output: 'server',
  adapter: cloudflare({
    imageService: 'compile', // Optimizes images at build time
    platformProxy: {
      enabled: true,
    },
  }),
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['browser-image-compression'],
    },
    ssr: {
      external: ['http', 'https', 'url', 'events', 'timers', 'stream'],
    },
  },
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en'],
    routing: {
      prefixDefaultLocale: true
    }
  },
  redirects: {
    '/admin': '/fr/admin',
    '/propose': '/fr/propose',
  }
});