/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        numindex: {
          "primary": "#133F1A",        /* Vert Forêt très profond - Logo */
          "primary-content": "#ffffff",
          "secondary": "#2D6A4F",      /* Vert émeraude sombre pour contraste */
          "secondary-content": "#ffffff",
          "accent": "#40916C",         /* Vert sauge soutenu */
          "accent-content": "#ffffff",
          "neutral": "#2d3e40",
          "base-100": "#fdfcfb",       /* Papier chaud */
          "base-200": "#f1f5f2",       /* Gris-vert très clair */
          "base-300": "#d8e2dc",
          "info": "#1b4332",
          "success": "#2d6a4f",
          "warning": "#ffb703",
          "error": "#d90429",
        },
      },
    ],
    logs: false,
  },
};
