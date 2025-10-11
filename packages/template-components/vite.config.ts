import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import dts from "vite-plugin-dts";
import { resolve } from "path";
import packageJson from "./package.json";

export default defineConfig({
  plugins: [react(), dts({ entryRoot: "src" })],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  build: {
    lib: {
      entry: "src/index.ts",
      name: "TemplateComponents",
      formats: ["es", "cjs"],
      fileName: (fmt) => `index.${fmt === "es" ? "mjs" : "cjs"}`,
    },
    rollupOptions: {
      // Externalize all peer dependencies
      external: [
        ...Object.keys(packageJson.peerDependencies || {}),
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
    },
    cssCodeSplit: false, // Bundle all CSS into a single file
  },
});
