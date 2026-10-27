import { describe, expect, test } from "vitest";
import {
  applyLicenseOverrides,
  validateDependencyLicense,
} from "../../lib/license-validation.ts";

describe("validateDependencyLicense", () => {
  test("applies a package license override before validation", () => {
    expect(
      validateDependencyLicense(
        { name: "socket.io-client" },
        { "socket.io-client": "MIT" },
        ["MIT"],
      ),
    ).toEqual({ license: "MIT", isAllowed: true });
  });

  test("rejects missing license metadata without an override", () => {
    expect(
      validateDependencyLicense({ name: "unlicensed-package" }, {}, ["MIT"]),
    ).toEqual({ license: undefined, isAllowed: false });
  });

  test("still rejects an overridden license outside the allow-list", () => {
    expect(
      validateDependencyLicense(
        { name: "socket.io-client" },
        { "socket.io-client": "MIT" },
        ["Apache-2.0"],
      ),
    ).toEqual({ license: "MIT", isAllowed: false });
  });

  test("keeps the original license when no override matches", () => {
    expect(
      validateDependencyLicense(
        { name: "left-pad", license: "MIT" },
        { "socket.io-client": "Apache-2.0" },
        ["MIT"],
      ),
    ).toEqual({ license: "MIT", isAllowed: true });
  });

  test("does not treat inherited object properties as overrides", () => {
    expect(
      validateDependencyLicense({ name: "toString" }, {}, ["MIT"]),
    ).toEqual({ license: undefined, isAllowed: false });
  });

  test("allows an override callback to supply a license only when missing", () => {
    const licenseOverrides = {
      "socket.io-client": (license: string | undefined) => license || "MIT",
    };

    expect(
      validateDependencyLicense(
        { name: "socket.io-client" },
        licenseOverrides,
        ["MIT"],
      ),
    ).toEqual({ license: "MIT", isAllowed: true });
    expect(
      validateDependencyLicense(
        { name: "socket.io-client", license: "GPL-3.0" },
        licenseOverrides,
        ["MIT"],
      ),
    ).toEqual({ license: "GPL-3.0", isAllowed: false });
  });

  test("normalizes null license metadata before invoking an override callback", () => {
    let callbackLicense: string | undefined = "not called";
    const licenseOverrides = {
      "socket.io-client": (license: string | undefined) => {
        callbackLicense = license;
        return license || "MIT";
      },
    };

    expect(
      validateDependencyLicense(
        { name: "socket.io-client", license: null },
        licenseOverrides,
        ["MIT"],
      ),
    ).toEqual({ license: "MIT", isAllowed: true });
    expect(callbackLicense).toBeUndefined();
  });
});

describe("applyLicenseOverrides", () => {
  test("applies overrides to generated metadata without mutating dependencies", () => {
    const dependency: { name: string; license?: string } = {
      name: "socket.io-client",
    };

    expect(
      applyLicenseOverrides([dependency], { "socket.io-client": "MIT" }),
    ).toEqual([{ name: "socket.io-client", license: "MIT" }]);
    expect(dependency.license).toBeUndefined();
  });

  test("keeps licenses provided by an override callback", () => {
    expect(
      applyLicenseOverrides(
        [{ name: "socket.io-client", license: "GPL-3.0" }],
        { "socket.io-client": (license) => license || "MIT" },
      ),
    ).toEqual([{ name: "socket.io-client", license: "GPL-3.0" }]);
  });

  test("returns an empty list for no dependencies", () => {
    expect(applyLicenseOverrides([], {})).toEqual([]);
  });
});
