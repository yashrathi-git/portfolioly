import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { resolve } from "path";

export default defineConfig({
  plugins: [dts({ entryRoot: "src" })],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  build: {
    lib: {
      entry: "src/index.ts",
      name: "PortfoliolySchema",
      formats: ["es", "cjs"],
      fileName: (fmt) => `index.${fmt === "es" ? "mjs" : "cjs"}`,
    },
    rollupOptions: {
      // Externalize zod to avoid bundling it
      external: ["zod"],
    },
  },
});
