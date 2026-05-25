/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Sora'", "sans-serif"],
        body: ["'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        obsidian: {
          50: "#f0f0ff",
          100: "#e0e0ff",
          900: "#0a0a14",
          950: "#06060e",
        },
        frost: "rgba(255,255,255,0.06)",
        "frost-hover": "rgba(255,255,255,0.10)",
        aurora: {
          blue: "#4F8EF7",
          violet: "#8B5CF6",
          gold: "#F5C842",
          teal: "#2DD4BF",
        },
      },
      backgroundImage: {
        "glass-gradient":
          "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
        "aurora-gradient":
          "radial-gradient(ellipse at 20% 50%, rgba(79,142,247,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.12) 0%, transparent 60%), radial-gradient(ellipse at 60% 80%, rgba(45,212,191,0.08) 0%, transparent 60%)",
      },
      backdropBlur: {
        glass: "20px",
      },
      boxShadow: {
        glass: "0 0 0 1px rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.4)",
        "glass-hover":
          "0 0 0 1px rgba(255,255,255,0.14), 0 16px 48px rgba(0,0,0,0.5)",
        glow: "0 0 40px rgba(79,142,247,0.3)",
        "glow-gold": "0 0 40px rgba(245,200,66,0.2)",
      },
      animation: {
        "pulse-ring": "pulse-ring 2s ease-out infinite",
        "fade-up": "fade-up 0.6s ease-out forwards",
        "scale-in": "scale-in 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards",
        shimmer: "shimmer 2s linear infinite",
        float: "float 6s ease-in-out infinite",
        "aurora-shift": "aurora-shift 8s ease-in-out infinite alternate",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "scale(1)", opacity: "0.8" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.85)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "aurora-shift": {
          "0%": { opacity: "0.6" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
