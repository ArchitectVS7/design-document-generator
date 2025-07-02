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
  // Frontend React/TypeScript files
  {
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    languageOptions: { 
      globals: globals.browser 
    },
    rules: {
      "react/react-in-jsx-scope": "off", // Not needed with new JSX transform
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-explicit-any": "warn", // Keep as warning
      "react/no-unescaped-entities": "warn", // Keep as warning  
      "prefer-const": "warn", // Keep as warning
      "no-undef": "warn", // Change from error to warning
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
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }], // Change to warning
      "prefer-const": "warn",
      "no-case-declarations": "warn", // Change to warning
      "no-undef": "warn", // Change from error to warning for missing globals
    }
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
];
