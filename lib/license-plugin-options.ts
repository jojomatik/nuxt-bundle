import {
  applyLicenseOverrides,
  validateDependencyLicense,
  type LicenseOverride,
} from "./license-validation.ts";

type AllowedLicense = string | Record<string, string[]>;

type LicenseModuleOptions = {
  allowedLicenses: AllowedLicense[];
  licenseOverrides?: Record<string, LicenseOverride>;
};

type LicenseLogger = {
  error(message: string): void;
  info(message: string): void;
};

type LicenseDependency = {
  name: string;
  license?: string | null;
};

const envKey = "ALLOWED_LICENCES";

export function createLicensePluginOptions(
  options: LicenseModuleOptions,
  logger: LicenseLogger,
) {
  return {
    thirdParty: {
      includePrivate: false,
      allow: {
        test: (dependency: LicenseDependency) => {
          const allowedLicensesFromEnv = process.env[envKey]
            ?.split(",")
            .map((license) => license.trim());
          const allowedLicenses =
            allowedLicensesFromEnv ?? options.allowedLicenses;
          const dependencyAllowedLicenses = allowedLicenses.flatMap(
            (allowedLicense) => {
              if (typeof allowedLicense === "string") return [allowedLicense];

              return Object.entries(allowedLicense)
                .filter(([, dependencies]) =>
                  dependencies.includes(dependency.name),
                )
                .map(([license]) => license);
            },
          );
          const overrides = options.licenseOverrides ?? {};
          const validation = validateDependencyLicense(
            dependency,
            overrides,
            dependencyAllowedLicenses,
          );

          if (!validation.license) return false;

          if (!validation.isAllowed) {
            logger.error(
              `Dependency "${dependency.name}" has a license (${validation.license}) that is not in the dependency-specific list of allowed licenses (${dependencyAllowedLicenses.join(", ")}).`,
            );

            const requiredLicenses = [...allowedLicenses, validation.license];
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
        file: "public/dependencies.json",
        template(dependencies: LicenseDependency[]) {
          return JSON.stringify(
            applyLicenseOverrides(dependencies, options.licenseOverrides ?? {}),
          );
        },
      },
    },
  };
}
