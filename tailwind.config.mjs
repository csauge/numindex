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
        salvia: {
          "primary": "#40916c",        /* Vert Sauge - Contraste RGAA OK */
          "primary-content": "#ffffff",
          "secondary": "#b7e4c7",      /* Vert Menthe douce */
          "accent": "#1b4332",         /* Vert Forêt profond */
          "neutral": "#2d3e40",
          "base-100": "#fdfcfb",       /* Papier chaud */
          "base-200": "#f1f5f2",       /* Gris-vert très clair */
          "base-300": "#d8e2dc",
          "info": "#40916c",
          "success": "#2d6a4f",
          "warning": "#ffb703",
          "error": "#d90429",
        },
      },
    ],
    logs: false,
  },
};
