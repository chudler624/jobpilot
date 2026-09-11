import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Server actions bound via .bind() sometimes don't need every
      // useActionState-shaped parameter (e.g. analyzeMatch takes no form
      // input) — underscore-prefixed args are the established convention
      // for "intentionally unused" throughout this codebase.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // The browser extension is its own package with its own toolchain
    // (see extension/package.json) — not part of the Next.js app.
    "extension/**",
  ]),
]);

export default eslintConfig;
