import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: "#f4f1ea",
        ink: "#151817",
        muted: "#69716d",
        line: "#d8d4ca",
        sage: "#6f9c82",
        teal: "#2f6f6a",
        amber: "#c6a03f",
        graphite: "#202522",
      },
      boxShadow: {
        surface: "0 22px 60px rgba(29, 32, 30, 0.09)",
        tight: "0 10px 26px rgba(29, 32, 30, 0.08)",
      },
      borderRadius: {
        surface: "8px",
      },
    },
  },
  plugins: [],
};

export default config;
