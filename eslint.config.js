import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

/** @type {import('eslint').Linter.Config[]} */
export default [
  // Ignore patterns
  {
    ignores: ["dist/**", "dev-dist/**", "node_modules/**"],
  },
  // JavaScript/JSX files
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    plugins: {
      react: pluginReact,
    },
    ...pluginJs.configs.recommended,
    ...pluginReact.configs.flat.recommended,
  },
  // TypeScript files
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: globals.browser,
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      react: pluginReact,
    },
    rules: {
      ...pluginJs.configs.recommended.rules,
      ...pluginReact.configs.flat.recommended.rules,
      // TypeScript specific rules
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-var-requires": "off",
      // Add rules that were missing
      "@typescript-eslint/ban-types": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      // React JSX transform with tsconfig.json jsx: "react-jsx"
      "react/react-in-jsx-scope": "off",
      // Additional rules
      "no-unused-vars": "off",
      "react/prop-types": "off",
      "react/display-name": "off",
    },
  },
];