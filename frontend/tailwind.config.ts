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
        // Base surfaces
        background: "#f9faf5",
        surface: "#f9faf5",
        "surface-dim": "#dcdbc9",
        "surface-bright": "#f9faf5",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f6f4e2",
        "surface-container": "#edeee9",
        "surface-container-high": "#eae9d7",
        "surface-container-highest": "#e4e3d1",

        // Text on surface
        "on-surface": "#1b1c11",
        "on-surface-variant": "#474834",
        "on-background": "#1b1c11",

        // Primary — Lime Green: pertumbuhan, sukses, aksi positif
        primary: "#5b6400",
        "on-primary": "#ffffff",
        "primary-container": "#d1e231",
        "on-primary-container": "#5a6300",
        "inverse-primary": "#c0d11b",

        // Secondary
        secondary: "#5b6400",
        "on-secondary": "#ffffff",
        "secondary-container": "#dce87d",
        "on-secondary-container": "#5f6805",

        // Tertiary — Soft Blue (adapted from coral per Stitch)
        tertiary: "#3e6280",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#b7dbff",
        "on-tertiary-container": "#3d617f",

        // Error
        error: "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",

        // Outline
        outline: "#777962",
        "outline-variant": "#c8c8ae",

        // Inverse
        "inverse-surface": "#303125",
        "inverse-on-surface": "#f3f2df",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "sans-serif"],
      },
      fontSize: {
        "display-lg": ["40px", { lineHeight: "48px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-lg-mobile": ["32px", { lineHeight: "40px", fontWeight: "700" }],
        "headline-md": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "headline-sm": ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "label-lg": ["14px", { lineHeight: "20px", letterSpacing: "0.01em", fontWeight: "600" }],
        "label-md": ["14px", { lineHeight: "20px", letterSpacing: "0.01em", fontWeight: "600" }],
        "label-sm": ["12px", { lineHeight: "16px", fontWeight: "500" }],
        "mono-address": ["14px", { lineHeight: "20px", letterSpacing: "0.05em", fontWeight: "500" }],
      },
      borderRadius: {
        sm: "0.25rem",
        DEFAULT: "0.5rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.5rem",
        "2xl": "1rem",
        full: "9999px",
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "container-padding": "20px",
        "stack-gap-sm": "8px",
        "stack-gap-md": "16px",
        "stack-gap-lg": "24px",
        "section-margin": "40px",
        "touch-target-min": "56px",
      },
      boxShadow: {
        sm: "0px 4px 20px rgba(91, 100, 0, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
