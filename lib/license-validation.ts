type LicenseDependency = {
  name: string;
  license?: string | null;
};

export type LicenseOverride =
  string | ((license: string | undefined) => string | undefined);

function resolveLicense(
  dependency: LicenseDependency,
  licenseOverrides: Record<string, LicenseOverride>,
) {
  const originalLicense = dependency.license ?? undefined;
  const override = licenseOverrides[dependency.name];

  if (!Object.hasOwn(licenseOverrides, dependency.name)) {
    return originalLicense;
  }

  return typeof override === "function" ? override(originalLicense) : override;
}

export function validateDependencyLicense(
  dependency: LicenseDependency,
  licenseOverrides: Record<string, LicenseOverride>,
  allowedLicenses: string[],
) {
  const license = resolveLicense(dependency, licenseOverrides);

  return {
    license,
    isAllowed: Boolean(license && allowedLicenses.includes(license)),
  };
}

export function applyLicenseOverrides(
  dependencies: LicenseDependency[],
  licenseOverrides: Record<string, LicenseOverride>,
) {
  return dependencies.map((dependency) => ({
    ...dependency,
    license: resolveLicense(dependency, licenseOverrides),
  }));
}
