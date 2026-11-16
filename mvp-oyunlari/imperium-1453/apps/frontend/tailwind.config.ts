import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1f2933",
        parchment: "#f6f0e6",
        brass: "#a9792b",
        sea: "#2f6f73",
        cypress: "#315443",
        wine: "#7b2e3f",
      },
    },
  },
  plugins: [],
};

export default config;
