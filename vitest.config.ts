import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [vue()],
  test: {
    include: ["test/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "lcov"],
      include: [
        "lib/**",
        "modules/**",
        "app/**/*.{ts,vue}",
        "{nuxt.config.ts,vuetify-options.ts}",
      ],
    },
  },
});
