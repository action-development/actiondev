import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    // El blob dibuja sobre canvas vía refs dentro de rAF — las reglas de
    // pureza/refs de react-hooks no aplican a un render loop imperativo.
    files: ["src/components/hero/**"],
    rules: { "react-hooks/refs": "off", "react-hooks/purity": "off" },
  },
]);
