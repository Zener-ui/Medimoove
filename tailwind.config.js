/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: "#1a2596",
          dark: "#0a0f45",
          light: "#1a259618",
        },
        blue: {
          accent: "#ff5a2e",
        },
        navy: {
          DEFAULT: "#f7f6f1",
          mid: "#ecebf0",
          light: "#dfe3ff",
          border: "#0a0f45",
        },
        slate: {
          muted: "#3d4470",
          soft: "#68709a",
        },
        surface: {
          DEFAULT: "#ffffff",
          raised: "#ffffff",
          border: "#0a0f45",
        },
        ink: {
          DEFAULT: "#10143f",
        },
      },
      fontFamily: {
        sans: ["Geist", "sans-serif"],
        display: ["Newsreader", "serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        card: "0 2px 16px rgba(10,15,69,0.08)",
        glow: "0 0 24px rgba(26,37,150,0.14)",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        shimmer: "shimmer 1.5s infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: "translateY(12px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
    },
  },
  plugins: [],
};
