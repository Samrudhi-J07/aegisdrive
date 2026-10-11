/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base: "#0B1120",
        surface: {
          1: "#131A2B",
          2: "#1A2338"
        },
        brand: {
          DEFAULT: "#3B82F6",
          hover: "#60A5FA"
        },
        accent: {
          DEFAULT: "#22D3EE",
          cyan: "#22D3EE",
          violet: "#8B5CF6",
          rose: "#EF4444",
          emerald: "#10B981",
          amber: "#F59E0B"
        },
        severity: {
          fatal: "#EF4444",
          major: "#F59E0B",
          minor: "#10B981"
        }
      },
      boxShadow: {
        glow: "0 0 30px rgba(59, 130, 246, 0.15)",
        "glow-lg": "0 0 40px rgba(59, 130, 246, 0.3)",
        card: "0 4px 24px rgba(0, 0, 0, 0.4)",
        "glow-cyan": "0 0 20px rgba(34, 211, 238, 0.35)",
        "glow-rose": "0 0 20px rgba(239, 68, 68, 0.35)"
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #3B82F6, #22D3EE)",
        "card-gradient": "linear-gradient(160deg, #131A2B, #1A2338)"
      }
    },
  },
  plugins: [],
}
