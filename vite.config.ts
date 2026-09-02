import { defineConfig } from "vite";

// Two entry points, one codebase:
//   /        — the Reveal (Milestone 1): scroll-driven 3D walkthrough with the Docent overlay
//   /plan/   — the stylized floor plan viewer (same renderer the CLI uses)
export default defineConfig({
  build: {
    target: "es2022",
    rollupOptions: {
      input: {
        main: new URL("./index.html", import.meta.url).pathname,
        plan: new URL("./plan/index.html", import.meta.url).pathname,
      },
    },
  },
  server: { port: 5173, open: false },
});
