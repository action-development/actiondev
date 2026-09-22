import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    // `NEXT_DIST_DIR` permite varios dev servers a la vez (.next-perf,
    // .next-e2e…). `.gitignore` ya los ignora; eslint no, y lintar un build
    // entero daba 15.000 avisos de código generado.
    ".next-*/**",
    "out/**",
    "build/**",
    "e2e/report/**",
    "e2e/test-results/**",
    "next-env.d.ts",
  ]),
  {
    // Los specs de Playwright no son React. `test.extend({ page: async ({}, use) => … })`
    // dispara `rules-of-hooks` porque la fixture se llama `use`.
    files: ["e2e/**"],
    rules: { "react-hooks/rules-of-hooks": "off" },
  },
  {
    files: ["src/components/canvas/**", "src/components/effects/**", "src/components/three/**"],
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
      "react-hooks/purity": "off",
    },
  },
]);

export default eslintConfig;
