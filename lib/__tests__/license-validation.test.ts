import assert from "node:assert/strict";
import { test } from "node:test";
import { createLicensePluginOptions } from "../license-plugin-options.ts";
import {
  applyLicenseOverrides,
  validateDependencyLicense,
} from "../license-validation.ts";

test("applies a package license override before validation", () => {
  assert.deepEqual(
    validateDependencyLicense(
      { name: "socket.io-client" },
      { "socket.io-client": "MIT" },
      ["MIT"],
    ),
    { license: "MIT", isAllowed: true },
  );
});

test("rejects missing license metadata without an override", () => {
  assert.deepEqual(
    validateDependencyLicense({ name: "unlicensed-package" }, {}, ["MIT"]),
    { license: undefined, isAllowed: false },
  );
});

test("still rejects an overridden license outside the allow-list", () => {
  assert.deepEqual(
    validateDependencyLicense(
      { name: "socket.io-client" },
      { "socket.io-client": "MIT" },
      ["Apache-2.0"],
    ),
    { license: "MIT", isAllowed: false },
  );
});

test("applies overrides to generated metadata without mutating dependencies", () => {
  const dependency = { name: "socket.io-client" };

  assert.deepEqual(
    applyLicenseOverrides([dependency], { "socket.io-client": "MIT" }),
    [{ name: "socket.io-client", license: "MIT" }],
  );
  assert.equal(dependency.license, undefined);
});

test("allows an override callback to supply a license only when missing", () => {
  const licenseOverrides = {
    "socket.io-client": (license: string | undefined) => license || "MIT",
  };

  assert.deepEqual(
    validateDependencyLicense(
      { name: "socket.io-client" },
      licenseOverrides,
      ["MIT"],
    ),
    { license: "MIT", isAllowed: true },
  );
  assert.deepEqual(
    validateDependencyLicense(
      { name: "socket.io-client", license: "GPL-3.0" },
      licenseOverrides,
      ["MIT"],
    ),
    { license: "GPL-3.0", isAllowed: false },
  );
  assert.deepEqual(
    applyLicenseOverrides(
      [{ name: "socket.io-client", license: "GPL-3.0" }],
      licenseOverrides,
    ),
    [{ name: "socket.io-client", license: "GPL-3.0" }],
  );
});

test("normalizes null license metadata before invoking an override callback", () => {
  let callbackLicense: string | undefined = "not called";
  const licenseOverrides = {
    "socket.io-client": (license: string | undefined) => {
      callbackLicense = license;
      return license || "MIT";
    },
  };

  assert.deepEqual(
    validateDependencyLicense(
      { name: "socket.io-client", license: null },
      licenseOverrides,
      ["MIT"],
    ),
    { license: "MIT", isAllowed: true },
  );
  assert.equal(callbackLicense, undefined);
});

test("applies license overrides in configured plugin callbacks", () => {
  const pluginOptions = createLicensePluginOptions(
    {
      allowedLicenses: ["MIT"],
      licenseOverrides: {
        "socket.io-client": (license) => license ?? "MIT",
      },
    },
    {
      error: assert.fail,
      info: assert.fail,
    },
  );
  const dependency = { name: "socket.io-client", license: null };

  assert.equal(pluginOptions.thirdParty.allow.test(dependency), true);
  assert.deepEqual(
    JSON.parse(pluginOptions.thirdParty.output.template([dependency])),
    [{ name: "socket.io-client", license: "MIT" }],
  );
});
