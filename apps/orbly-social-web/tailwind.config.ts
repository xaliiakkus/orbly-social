import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "var(--color-bg-primary)",
          secondary: "var(--color-bg-secondary)",
          tertiary: "var(--color-bg-tertiary)",
          hover: "var(--color-bg-hover)",
        },
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          tertiary: "var(--color-text-tertiary)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          hover: "var(--color-accent-hover)",
        },
        border: "var(--color-border)",
        like: "var(--color-like)",
        repost: "var(--color-repost)",
        orbit: "var(--color-orbit)",
      },
      fontSize: {
        xs: ["13px", { lineHeight: "1.4" }],
        sm: ["14px", { lineHeight: "1.4" }],
        base: ["15px", { lineHeight: "1.5" }],
        lg: ["17px", { lineHeight: "1.4" }],
        xl: ["20px", { lineHeight: "1.3" }],
        "2xl": ["23px", { lineHeight: "1.25" }],
      },
      maxWidth: {
        feed: "600px",
        sidebar: "275px",
        "sidebar-right": "350px",
      },
    },
  },
  plugins: [],
};

export default config;
