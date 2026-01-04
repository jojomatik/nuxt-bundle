import * as fs from "fs";
import chalk from "chalk";
import vuetify from "vite-plugin-vuetify";
import type { LocaleObject } from "@nuxtjs/i18n";
import type { GeneratedLocale } from "@intlify/core-base";

/**
 * Returns all locales with their corresponding file names from `./locales`.
 */
export function getLocales(): LocaleObject<GeneratedLocale>[] {
  const files = fs.readdirSync("./locales");

  return files.map((file) => {
    const code = file.split(".")[0] as GeneratedLocale;

    return {
      code,
      iso: code,
      file,
    };
  });
}

const isDevServer =
  process.argv.some((arg) => arg.endsWith("nuxi")) &&
  process.argv.includes("dev");

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
  css: ["vuetify/styles"],
  modules: [
    "@crystal-creations/crystal-components/nuxt",
    "@nuxt/image",
    "@nuxtjs/i18n",
    "@nuxtjs/seo",
    "@nuxt/eslint",
    "@nuxtjs/storybook",
  ],
  licenseModule: {
    allowedLicenses: ["MIT", "Apache-2.0"],
  },
  i18n: {
    locales: getLocales(),
    defaultLocale: "en",
    restructureDir: ".",
    langDir: "locales",
  },
  storybook: {
    enabled: !isDevServer,
  },
  hooks: {
    "nitro:build:before": () => {
      const fontsDir = "public/assets/fonts/";

      fs.cpSync("node_modules/@fontsource/", fontsDir, {
        recursive: true,
      });
      console.log(chalk.green("√"), "Copied fonts to " + fontsDir);
    },
  },
  vite: {
    define: {
      "process.env.DEBUG": "false",
    },
    ssr: {
      noExternal: ["vuetify"],
    },
    plugins: [vuetify()],
  },
  nitro: {
    compressPublicAssets: true,
  },
});
