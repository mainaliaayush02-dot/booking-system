import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Official Brand Color System - Newborn Photography Nepal
        brand: {
          primary: "#3D084B", // Deep Plum
          muted: "#68456E", // Muted Plum
          bg: "#F5E5EB", // Blush Pink main background
          secondaryBg: "#EAD1DC", // Dusty Rose
          card: "#FFFAFC", // Soft White card
          border: "#EBD8E1", // Soft Pink Border
          text: "#332A34", // Charcoal typography
          mutedText: "#846F7F", // Muted Rose Grey
        },
        plum: {
          50: "#FAF2F7",
          100: "#F3E2EE",
          200: "#E8C7DE",
          300: "#D6A3C7",
          400: "#BA73A6",
          500: "#984784",
          600: "#68456E", // Secondary brand: Muted Plum
          700: "#541B5C",
          800: "#460E50",
          900: "#3D084B", // Primary brand: Deep Plum
          950: "#260430",
        },
        blush: {
          50: "#FFFAFC", // Soft white
          100: "#FBF2F6",
          200: "#F5E5EB", // Main background: Blush Pink
          300: "#EBD8E1", // Soft pink border
          400: "#EAD1DC", // Dusty rose
          500: "#D4B3C4",
          600: "#BA8FA6",
        },
        charcoal: {
          50: "#FAF7F9",
          100: "#F2EDF0",
          200: "#E2D9E0",
          300: "#B8A9B5",
          400: "#846F7F", // Muted rose grey
          500: "#645561",
          600: "#4E3F4B",
          700: "#3D323C",
          800: "#332A34", // Charcoal main typography
          900: "#221A23",
        },
        // Mapped aliases for studio components
        studio: {
          50: "#FAF2F7",
          100: "#F3E2EE",
          200: "#EBD8E1",
          300: "#D6A3C7",
          400: "#BA73A6",
          500: "#68456E",
          600: "#4D1458",
          700: "#3D084B", // Deep plum
          800: "#32063E",
          900: "#260430",
        },
        cream: {
          50: "#F5E5EB", // Blush Pink
          100: "#FFFAFC", // Soft White
          200: "#EBD8E1", // Soft Pink Border
          300: "#EAD1DC", // Dusty Rose
          400: "#D4B3C4",
          500: "#BA8FA6",
        },
        status: {
          pending: "#874020",
          confirmed: "#3D084B",
          completed: "#1E6838",
          cancelled: "#9B1C28",
          rescheduled: "#5C2684",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(61, 8, 75, 0.04), 0 1px 2px -1px rgba(61, 8, 75, 0.03)",
        card: "0 2px 6px -1px rgba(61, 8, 75, 0.05), 0 1px 4px -2px rgba(61, 8, 75, 0.04)",
        float: "0 10px 25px -5px rgba(61, 8, 75, 0.08), 0 8px 10px -6px rgba(61, 8, 75, 0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
