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
        cream: {
          50: "#FDFBF7",
          100: "#F9F6F0",
          200: "#F2ECE1",
          300: "#E6DDCF",
          400: "#D4C7B3",
          500: "#B8A68F",
        },
        sand: {
          50: "#FAF7F2",
          100: "#F3EFE6",
          200: "#E5DDD0",
          300: "#CFC1AF",
          400: "#B5A38E",
          500: "#9C8770",
        },
        studio: {
          50: "#F7F5F0",
          100: "#EFEBE3",
          200: "#DFD7C9",
          300: "#C8BCA9",
          400: "#AB9A82",
          500: "#8C7355", // Main studio accent brown
          600: "#745E44", // Deep studio brown
          700: "#5B4A35",
          800: "#443626",
          900: "#2D2319",
        },
        charcoal: {
          50: "#F5F5F4",
          100: "#E7E5E4",
          200: "#D6D3D1",
          300: "#A8A29E",
          400: "#78716C",
          500: "#57534E",
          600: "#44403C",
          700: "#33302E",
          800: "#252321",
          900: "#1A1817",
        },
        status: {
          pending: "#B45309",
          confirmed: "#2563EB",
          completed: "#15803D",
          cancelled: "#B91C1C",
          rescheduled: "#7C3AED",
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(44, 41, 39, 0.04), 0 1px 2px -1px rgba(44, 41, 39, 0.04)",
        card: "0 2px 6px -1px rgba(44, 41, 39, 0.05), 0 1px 4px -2px rgba(44, 41, 39, 0.05)",
        float: "0 10px 25px -5px rgba(44, 41, 39, 0.08), 0 8px 10px -6px rgba(44, 41, 39, 0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
