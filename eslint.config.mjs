import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // These views intentionally hydrate browser-only localStorage/IndexedDB state after mount.
  {
    files: ["src/app/streaming/streaming-app.tsx", "src/app/studio/assets/page.tsx", "src/app/studio/local-workspace.tsx", "src/app/studio/post-production/page.tsx"],
    rules: { "react-hooks/set-state-in-effect": "off" },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "node_modules/**"]),
]);

export default eslintConfig;
