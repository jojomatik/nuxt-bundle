import { addVitePlugin, defineNuxtModule, useLogger } from "nuxt/kit";
import license from "rollup-plugin-license";
import {
  applyLicenseOverrides,
  validateDependencyLicense,
} from "../lib/license-validation";

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
              // Load allowed licenses from environment-variable
              const allowedLicensesFromEnv = process.env[envKey]
                ?.split(",")
                .map((license) => license.trim());

              // Load allowed licenses from module options
              // Allow MIT and Apache-2.0 licenses by default
              const allowedLicenses =
                allowedLicensesFromEnv ?? options.allowedLicenses;

              const validation = validateDependencyLicense(
                dependency,
                options.licenseOverrides ?? {},
                allowedLicenses,
              );

              // Return false for unlicensed dependencies.
              if (!validation.license) return false;

              if (!validation.isAllowed) {
                logger.error(
                  `Dependency "${dependency.name}" has a license (${validation.license}) that is not the list of allowed licenses (${allowedLicenses.join(", ")}).`,
                );

                const requiredLicenses = [
                  ...allowedLicenses,
                  validation.license,
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

              return validation.isAllowed;
            },
            failOnUnlicensed: true,
            failOnViolation: true,
          },
          output: {
            // Output file into public directory which is included in the build output.
            file: "public/dependencies.json",
            template(dependencies) {
              return JSON.stringify(
                applyLicenseOverrides(
                  dependencies,
                  options.licenseOverrides ?? {},
                ),
              );
            },
          },
        },
      }),
    );
  },
});
