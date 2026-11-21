import { defineConfig } from "eslint/config";
import next from "eslint-config-next";
import firebaseRulesPlugin from "@firebase/eslint-plugin-security-rules";

export default defineConfig([
  {
    ignores: [
      ".next/**",
      ".next-dev/**",
      "out/**",
      "build/**",
      "dist/**",
      "next-env.d.ts",
    ],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx,mjs}"],
    extends: [...next],
    rules: {
      "@next/next/no-page-custom-font": "off",
    },
  },
  firebaseRulesPlugin.configs["flat/recommended"],
]);
