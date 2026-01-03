const {
  defineConfig
} = require("eslint/config");

const globals = require("globals");
const js = require("@eslint/js");

const {
  FlatCompat
} = require("@eslint/eslintrc");

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

module.exports = defineConfig([{
  languageOptions: {
    globals: {
      ...globals.node
    },

    ecmaVersion: 2020,
    sourceType: "module",
    parserOptions: {}
  },

  extends: compat.extends(
    "@nuxtjs/eslint-config-typescript",
    "plugin:prettier/recommended",
    "plugin:storybook/recommended"
  ),

  rules: {
    "no-console": process.env.NODE_ENV === "production" ? ["error", {
      allow: ["warn", "error"]
    }] : "off",

    "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off"
  }
}, {
  files: ["**/__tests__/*.{j,t}s?(x)", "**/tests/unit/**/*.spec.{j,t}s?(x)"],

  languageOptions: {
    globals: {
      ...globals.jest
    }
  }
}]);
