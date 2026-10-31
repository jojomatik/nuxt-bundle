import type { StorybookConfig } from "@nuxtjs/storybook";

const config: StorybookConfig = {
  stories: ["../stories/**/*.mdx", "../app/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: ["@storybook/addon-docs"],
  framework: "@storybook-vue/nuxt",
};

export default config;
