import { defineNuxtModule } from "nuxt/kit";
import license from "rollup-plugin-license";
import { type PluginOption } from "vite";

const moduleKey = "@jojomatik/nuxt-bundle/license-module";

export default defineNuxtModule({
  meta: {
    name: moduleKey,
    configKey: "licenseModule"
  },
  setup(options, nuxt) {
    nuxt.hook("vite:extendConfig", (viteConfig) => {
      viteConfig.plugins = viteConfig.plugins || [];
      viteConfig.plugins.push(
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
              failOnViolation: true
            },
            output: {
              // Output file into public directory which is included in the build output.
              file: "public/dependencies.json",
              template(dependencies) {
                return JSON.stringify(dependencies);
              }
            }
          }
        }) as PluginOption);
    });
  }
});
