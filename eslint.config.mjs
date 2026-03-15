import js from "@eslint/js"
import prettier from "eslint-config-prettier"
import ts from "typescript-eslint"

export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/triple-slash-reference": "off",
    },
  },
  {
    files: ["tests/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  prettier,
  {
    ignores: ["dist/**", "node_modules/**", "tests/e2e/fixtures/**/.astro/**"],
  },
]
