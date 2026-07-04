import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig(globalIgnores([
  ".next/**",
  ".next-e2e/**",
  "coverage/**",
  "node_modules/**",
  "playwright-report/**",
  "test-results/**",
]), {
    extends: [...nextCoreWebVitals, ...nextTypescript],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
});
