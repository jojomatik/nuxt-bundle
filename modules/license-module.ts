import { addVitePlugin, defineNuxtModule, useLogger } from "nuxt/kit";
import license from "rollup-plugin-license";

const moduleKey = "@jojomatik/nuxt-bundle/license-module";
const envKey = "ALLOWED_LICENCES";

const logger = useLogger(moduleKey);

export default defineNuxtModule({
  meta: {
    name: moduleKey,
    configKey: "licenseModule",
  },
  setup(options) {
    addVitePlugin(
      license({
        thirdParty: {
          includePrivate: false,
          allow: {
            test: (dependency) => {
              // Return false for unlicensed dependencies.
              if (!dependency.license) return false;

              // Load allowed licenses from environment-variable
              const allowedLicensesFromEnv = process.env[envKey]
                ?.split(",")
                .map((license) => license.trim());

              // Load allowed licenses from module options
              // Allow MIT and Apache-2.0 licenses by default
              const allowedLicenses =
                allowedLicensesFromEnv ?? options.allowedLicenses;

              const isLicenseAllowed = allowedLicenses.includes(
                dependency.license,
              );

              if (!isLicenseAllowed) {
                logger.error(
                  `Dependency "${dependency.name}" has a license (${dependency.license}) that is not the list of allowed licenses (${allowedLicenses.join(", ")}).`,
                );

                const requiredLicenses = [
                  ...allowedLicenses,
                  dependency.license,
                ];

                const configContent = JSON.stringify(
                  {
                    extends: "@jojomatik/nuxt-bundle",
                    licenseModule: {
                      allowedLicenses: requiredLicenses,
                    },
                  },
                  undefined,
                  2,
                );

                const configExample =
                  "export default defineNuxtConfig(" + configContent + ");\n";

                logger.info(
                  `You can specify allowed licenses in "nuxt.config.ts" environment variable:`,
                );
                console.log(configExample);

                logger.info(
                  `You can also specify allowed licenses via "${envKey}" environment variable (ALLOWED_LICENCES=${requiredLicenses.join(",")}).`,
                );
              }

              return isLicenseAllowed;
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
    );
  },
});
