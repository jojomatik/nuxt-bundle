type LicenseDependency = {
  name: string;
  license?: string;
};

export function validateDependencyLicense(
  dependency: LicenseDependency,
  licenseOverrides: Record<string, string>,
  allowedLicenses: string[],
) {
  const license = Object.hasOwn(licenseOverrides, dependency.name)
    ? licenseOverrides[dependency.name]
    : dependency.license;

  return {
    license,
    isAllowed: Boolean(license && allowedLicenses.includes(license)),
  };
}
