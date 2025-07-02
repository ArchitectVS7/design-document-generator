import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";

export default [
  { 
    ignores: [
      "dist/**",
      "build/**", 
      "node_modules/**",
      "coverage/**",
      "*.min.js",
      "public/**"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  // Frontend React/TypeScript files
  {
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    languageOptions: { 
      globals: globals.browser 
    },
    rules: {
      "react/react-in-jsx-scope": "off", // Not needed with new JSX transform
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-explicit-any": "off", // Disable for technical debt cleanup
      "react/no-unescaped-entities": "warn", // Keep as warning
      "prefer-const": "warn", // Keep as warning
    },
    settings: {
      react: {
        version: "detect"
      }
    }
  },
  // Backend Node.js files
  {
    files: ["backend/**/*.{js,mjs,cjs}"],
    languageOptions: { 
      globals: {
        ...globals.node,
        ...globals.es2021
      }
    },
    rules: {
      "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "prefer-const": "warn",
      "no-case-declarations": "error"
    }
  }
];
