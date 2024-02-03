import * as fs from "fs";
import chalk from "chalk";
import vuetify, { transformAssetUrls } from "vite-plugin-vuetify";
import license from "rollup-plugin-license";

export default defineNuxtConfig({
  app: {
    pageTransition: { name: "page", mode: "out-in" },
    head: {
      link: [
        {
          as: "font",
          rel: "preload",
          href: "/assets/fonts/roboto/files/roboto-latin-400-normal.woff2",
          crossorigin: "anonymous",
        },
        {
          rel: "stylesheet",
          href: "/assets/fonts/roboto/index.css",
        },
        // Favicon generated with https://realfavicongenerator.net/
        {
          rel: "icon",
          type: "image/png",
          sizes: "32x32",
          href: "/assets/favicon/favicon-32x32.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "16x16",
          href: "/assets/favicon/favicon-16x16.png",
        },
        {
          rel: "apple-touch-icon",
          sizes: "180x180",
          href: "/assets/favicon/apple-touch-icon.png",
        },
        {
          rel: "manifest",
          href: "/assets/favicon/site.webmanifest",
          crossorigin: "use-credentials",
        },
        {
          rel: "mask-icon",
          href: "/assets/favicon/safari-pinned-tab.svg",
          color: "#5bbad5",
        },
      ],
    },
  },
  build: { transpile: ["vuetify"] },
  css: ["vuetify/styles"],
  modules: [
    "@nuxt/image",
    "@nuxtjs/i18n",
    "@nuxtjs/robots",
    (_options, nuxt) => {
      nuxt.hooks.hook("vite:extendConfig", (config) => {
        config.plugins.push(vuetify({ autoImport: true }));
      });
    },
  ],
  hooks: {
    "nitro:build:before": () => {
      const fontsDir = "public/assets/fonts/";

      fs.cpSync("node_modules/@fontsource/", fontsDir, {
        recursive: true,
      });
      console.log(chalk.green("√"), "Copied fonts to " + fontsDir);
    },
  },
  i18n: {},
  vite: {
    define: {
      "process.env.DEBUG": "false",
    },
    ssr: {
      noExternal: ["vuetify"],
    },
    vue: { template: { transformAssetUrls } },
    plugins: [
      license({
        thirdParty: {
          includePrivate: false,
          allow: {
            test: (dependency) => {
              // Return false for unlicensed dependencies.
              if (!dependency.license) return false;

              // Allow MIT and Apache-2.0 licenses.
              return ["MIT", "Apache-2.0"].includes(dependency.license);
            },
            failOnUnlicensed: true,
            failOnViolation: true,
          },
          output: {
            // Output file into public directory which is included in the build output.
            file: "public/dependencies.json",
            template(dependencies) {
              return JSON.stringify(dependencies);
            },
          },
        },
      }),
    ],
  },
  nitro: {
    compressPublicAssets: true,
  },
});
