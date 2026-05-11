/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ["var(--font-heading)"],
        body: ["var(--font-body)"],
      },
      colors: {
        brand: {
          primary: "var(--color-primary)",
          strong: "var(--color-primary-strong)",
          secondary: "var(--color-secondary)",
        },
        shell: {
          base: "var(--color-surface-base)",
          elevated: "var(--color-surface-elevated)",
          muted: "var(--color-surface-muted)",
          border: "var(--color-border-subtle)",
          text: "var(--color-text-primary)",
          subtleText: "var(--color-text-secondary)",
        },
      },
      boxShadow: {
        shell: "0 10px 30px -14px rgba(15, 23, 42, 0.24)",
      },
    },
  },
  plugins: [],
}
