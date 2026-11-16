import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans Variable", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#0A1628", surface: "#11233F", line: "#1E3A5F",
        brand: "#1E4FA3", action: "#3B82F6", spark: "#38BDF8",
        paper: "#E6EEF8", muted: "#94A8C4",
      },
    },
  },
  plugins: [],
} satisfies Config;
