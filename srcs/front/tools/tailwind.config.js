/** @type {import('tailwindcss').Config} */
/* here where all custom themes goes */
const customTheme = require("./src/theme.ts"); // Import your theme

module.exports = {
  content: [
    "./src/**/*.{tsx,ts,jsx,js}", // which files to scan to find tailwind class names.
  ],
  safelist: [
    // Ensure custom colors are always included
    "bg-primary-bg",
    "bg-primary-elements",
    "bg-primary-btn",
    "text-primary-text",
    "bg-secondary-btn",
    "text-secondary-text",
    "font-primary",
    "font-secondary",
  ],
  theme: {
    extend: {
      colors: {
        ...customTheme.colors,
      },
      fontFamily: {
        ...customTheme.fontFamily,
      },
    },
  },
  plugins: [],
};
