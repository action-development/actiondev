import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", ".next-*/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    // El Easter egg del logo pasa `ref.current.getBoundingClientRect()` como
    // prop durante el render (app/page.tsx). Cambiarlo altera la animación:
    // se deja como está y la regla solo se apaga en ese archivo.
    files: ["src/app/page.tsx"],
    rules: { "react-hooks/refs": "off" },
  },
]);

export default eslintConfig;
