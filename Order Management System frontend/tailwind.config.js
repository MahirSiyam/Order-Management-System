import daisyui from 'daisyui'

/** @type {import('tailwindcss').Config} */
export default {
  // Class is never added to `<html>` — disables `dark:` utilities so OS dark mode can't flip them.
  darkMode: ['class', '.never-dark'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  daisyui: {
    themes: ['winter'],
    darkTheme: false,
  },
}
