/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fdf4ec",
          100: "#faE7d3",
          200: "#f3c99e",
          300: "#eba766",
          400: "#e08a3c",
          500: "#c96f22", // primary — warm gold, church brand accent
          600: "#a3571a",
          700: "#7d4216",
          800: "#5a3013",
          900: "#3b2110",
        },
        ink: {
          50: "#f6f7f8",
          100: "#e9ebee",
          200: "#cfd4db",
          300: "#a7b0bc",
          400: "#78849699",
          500: "#4d5865",
          600: "#37404b",
          700: "#262d35",
          800: "#171b21", // primary dark / headings
          900: "#0d0f13",
        },
        success: { 50: "#ecfdf3", 500: "#12b76a", 700: "#027a48" },
        warning: { 50: "#fffaeb", 500: "#f79009", 700: "#b54708" },
        danger: { 50: "#fef3f2", 500: "#f04438", 700: "#b42318" },
      },
      fontFamily: {
        display: ["'Fraunces'", "Georgia", "serif"],
        sans: ["'Inter'", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "10px",
        lg: "16px",
        xl: "24px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(13,15,19,0.06), 0 1px 8px rgba(13,15,19,0.06)",
        lifted: "0 8px 24px rgba(13,15,19,0.12)",
      },
      maxWidth: {
        content: "1200px",
      },
      keyframes: {
        fadeIn: { from: { opacity: 0, transform: "translateY(6px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
      },
      animation: {
        fadeIn: "fadeIn 0.4s ease-out",
        marquee: "marquee 30s linear infinite",
      },
    },
  },
  plugins: [],
};
