/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d"
        },
        surface: {
          900: "#0a0a0a",
          800: "#111111",
          700: "#1a1a1a",
          600: "#242424",
          500: "#2e2e2e"
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Oswald", "system-ui", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 20px rgba(34, 197, 94, 0.15)",
        card: "0 4px 24px rgba(0, 0, 0, 0.4)"
      }
    }
  },
  plugins: []
};
