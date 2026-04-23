/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        sidebar: {
          bg: "#0f172a",
          hover: "#1e293b",
          active: "#1e3a5f",
          text: "#94a3b8",
          textActive: "#f1f5f9",
          border: "#1e293b",
        },
        status: {
          wfo: "#3b82f6",
          wfoLight: "#dbeafe",
          wfh: "#10b981",
          wfhLight: "#d1fae5",
          wfc: "#8b5cf6",
          wfcLight: "#ede9fe",
          leave: "#f59e0b",
          leaveLight: "#fef3c7",
          holiday: "#ef4444",
          holidayLight: "#fee2e2",
          weekend: "#94a3b8",
          weekendLight: "#f1f5f9",
          unset: "#e2e8f0",
          unsetText: "#94a3b8",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)",
        "card-hover": "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
        "inner-sm": "inset 0 1px 2px 0 rgba(0,0,0,0.05)",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { transform: "translateY(10px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        scaleIn: { "0%": { transform: "scale(0.95)", opacity: "0" }, "100%": { transform: "scale(1)", opacity: "1" } },
      },
    },
  },
  plugins: [],
};
