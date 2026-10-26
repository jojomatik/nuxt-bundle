import { addVitePlugin, defineNuxtModule, useLogger } from "nuxt/kit";
import license from "rollup-plugin-license";
import { createLicensePluginOptions } from "../lib/license-plugin-options";

const moduleKey = "@jojomatik/nuxt-bundle/license-module";

const logger = useLogger(moduleKey);

export default defineNuxtModule({
  meta: {
    name: moduleKey,
    configKey: "licenseModule",
  },
  setup(options) {
    addVitePlugin(license(createLicensePluginOptions(options, logger)));
  },
});
