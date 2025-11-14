import type { Config } from "tailwindcss";
import { existsSync } from "fs";
import { resolve } from "path";

// Detect mode: env variable takes precedence, then file system check
const isStandalone =
  process.env.STANDALONE_MODE !== "false" &&
  !existsSync(resolve(__dirname, "../../packages/template-components"));

const componentSourcePath = isStandalone
  ? "./node_modules/portfolioly-template-components/src/**/*.{ts,tsx}"
  : "../../packages/template-components/src/**/*.{ts,tsx}";

export default {
  content: ["./src/**/*.{ts,tsx}", componentSourcePath],
  theme: { extend: {} },
  plugins: [],
} satisfies Config;
