/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // This makes Manrope the default for your whole site
        sans: ["var(--font-manrope)", "sans-serif"],
      },
    },
  },
  plugins: [],
}