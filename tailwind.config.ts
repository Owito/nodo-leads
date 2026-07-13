import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0a0a0f",
        panel: "#13131c",
        panel2: "#1b1b28",
        edge: "#2a2a3d",
        lime: "#c6f24e",
        violet: "#7c5cff",
        hot: "#ff5c8a",
        mute: "#8c8ca6",
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        brut: "6px 6px 0 0 #000",
        brutlime: "6px 6px 0 0 #c6f24e",
      },
    },
  },
  plugins: [],
} satisfies Config;
