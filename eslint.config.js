import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    ignores: [
      "dist/**",
      "build/**",
      "node_modules/**",
      "tailwind.config.js",
      "postcss.config.js",
      "vite.config.ts",
      "eslint.config.js",
      "scripts/**/*.js",
      "scripts/**/*.cjs",
      "scripts/**/*.mjs",
      "next-env.d.ts",
      "premises-notice-portal/**",
      "src/app/**",
      "src/lib/storage.ts",
    ],
  },
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ["./tsconfig.json"],
      },
      globals: globals.browser,
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      "react-refresh/only-export-components": "warn",
      "@typescript-eslint/no-unused-vars": "off",
      "no-unused-vars": "off",
      "no-undef": "off",
      "no-empty": "off",
    },
  },
];
