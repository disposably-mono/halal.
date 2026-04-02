import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── shadcn/ui tokens — do not remove ──────────────────────
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        // ── COMELEC brand tokens ───────────────────────────────────
        navy: "#1B1F5E",
        "navy-deep": "#0f1235",
        gold: "#F5C000",
        maroon: "#6B1A1A",
        light: "#F4F4F8",
        dark: "#2A2A2A",
        mid: "#5A5A7A",

        // ── Ballot surface tokens ──────────────────────────────────
        "ballot-bg": "#E8E4DB", // aged paper page background
        "ballot-paper": "#F7F4EE", // card/section surface
        "ballot-inst": "#ECEFFE", // instruction strip (navy-tinted)
        "ballot-rule": "#C8CEEE", // inner divider lines
        "ballot-hover": "#FFF9D6", // candidate row hover (light yellow)
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      fontFamily: {
        // ── Existing app fonts ─────────────────────────────────────
        display: ["var(--font-bebas)", "sans-serif"],
        heading: ["var(--font-barlow)", "sans-serif"],
        body: ["var(--font-dm-sans)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
        tagline: ["var(--font-playfair)", "serif"],

        // ── Ballot-specific fonts ──────────────────────────────────
        // ballot-serif reuses your existing --font-playfair variable.
        // ballot-display and ballot-mono need the two new variables
        // added in layout.tsx (see globals.css notes).
        "ballot-serif": ["var(--font-playfair)", "Georgia", "serif"],
        "ballot-display": ["var(--font-playfair-sc)", "Georgia", "serif"],
        "ballot-mono": ["var(--font-courier-prime)", "'Courier New'", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
