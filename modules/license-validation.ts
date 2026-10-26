type LicenseDependency = {
  name: string;
  license?: string;
};

function resolveLicense(
  dependency: LicenseDependency,
  licenseOverrides: Record<string, string>,
) {
  return Object.hasOwn(licenseOverrides, dependency.name)
    ? licenseOverrides[dependency.name]
    : dependency.license;
}

export function validateDependencyLicense(
  dependency: LicenseDependency,
  licenseOverrides: Record<string, string>,
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
  licenseOverrides: Record<string, string>,
) {
  return dependencies.map((dependency) => ({
    ...dependency,
    license: resolveLicense(dependency, licenseOverrides),
  }));
}
