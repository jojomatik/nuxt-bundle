module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    "@nuxtjs/eslint-config-typescript",
    "plugin:prettier/recommended",
    "plugin:storybook/recommended",
  ],
  ignorePatterns: "!pages/license-information.vue",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
  rules: {
    "no-console":
      process.env.NODE_ENV === "production"
        ? [
            "error",
            {
              allow: ["warn", "error"],
            },
          ]
        : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
  },
  overrides: [
    {
      files: [
        "**/__tests__/*.{j,t}s?(x)",
        "**/tests/unit/**/*.spec.{j,t}s?(x)",
      ],
      env: {
        jest: true,
      },
    },
  ],
};
