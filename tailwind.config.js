/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // macOS System Colors (Approximations for Light/Dark modes)
        // We will use CSS variables for dynamic switching if needed,
        // but for now let's define a solid palette that looks native.
        macos: {
          window: "var(--macos-window-bg)",
          sidebar: "var(--macos-sidebar-bg)",
          active: "var(--macos-active)",
          activeHover: "var(--macos-active)", // Simplified for now, or use opacity
          text: "var(--macos-text)",
          textSecondary: "var(--macos-text-secondary)",
          border: "var(--macos-border)",
          divider: "var(--macos-divider)",
          input: "var(--macos-input-bg)",
          accent: "var(--macos-active)",
          accentSecondary: "var(--macos-active-secondary)",
        }
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "San Francisco",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
      fontSize: {
        xs: "11px",
        sm: "13px", // Standard macOS text size
        base: "14px",
        lg: "16px",
        xl: "18px",
      }
    },
  },
  plugins: [],
}
