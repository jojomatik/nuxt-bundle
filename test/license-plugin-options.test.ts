import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createLicensePluginOptions } from "../lib/license-plugin-options.ts";

const createLogger = () => ({ error: vi.fn(), info: vi.fn() });

describe("createLicensePluginOptions", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  test("applies license overrides in configured plugin callbacks", () => {
    const logger = createLogger();
    const pluginOptions = createLicensePluginOptions(
      {
        allowedLicenses: ["MIT"],
        licenseOverrides: {
          "socket.io-client": (license) => license ?? "MIT",
        },
      },
      logger,
    );
    const dependency = { name: "socket.io-client", license: null };

    expect(pluginOptions.thirdParty.allow.test(dependency)).toBe(true);
    expect(
      JSON.parse(pluginOptions.thirdParty.output.template([dependency])),
    ).toEqual([{ name: "socket.io-client", license: "MIT" }]);
    expect(logger.error).not.toHaveBeenCalled();
  });

  test("allows a license only for its configured dependencies", () => {
    const pluginOptions = createLicensePluginOptions(
      {
        allowedLicenses: [
          "MIT",
          { "SEE LICENSE IN LICENSE.md": ["apexcharts", "vue-apexcharts"] },
        ],
      },
      createLogger(),
    );
    const { test: isAllowed } = pluginOptions.thirdParty.allow;
    const license = "SEE LICENSE IN LICENSE.md";

    expect(isAllowed({ name: "apexcharts", license })).toBe(true);
    expect(isAllowed({ name: "vue-apexcharts", license })).toBe(true);
    expect(isAllowed({ name: "another-package", license })).toBe(false);
  });

  test("rejects dependencies without a license without logging", () => {
    const logger = createLogger();
    const pluginOptions = createLicensePluginOptions(
      { allowedLicenses: ["MIT"] },
      logger,
    );

    expect(pluginOptions.thirdParty.allow.test({ name: "no-license" })).toBe(
      false,
    );
    expect(logger.error).not.toHaveBeenCalled();
  });

  test("logs guidance when a license is not allowed", () => {
    const logger = createLogger();
    const pluginOptions = createLicensePluginOptions(
      { allowedLicenses: ["MIT"] },
      logger,
    );

    expect(
      pluginOptions.thirdParty.allow.test({ name: "pkg", license: "GPL-3.0" }),
    ).toBe(false);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('"pkg" has a license (GPL-3.0)'),
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("ALLOWED_LICENCES=MIT,GPL-3.0"),
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('"GPL-3.0"'),
    );
  });

  test("prefers the ALLOWED_LICENCES environment variable", () => {
    vi.stubEnv("ALLOWED_LICENCES", "Apache-2.0, ISC");
    const pluginOptions = createLicensePluginOptions(
      { allowedLicenses: ["MIT"] },
      createLogger(),
    );
    const { test: isAllowed } = pluginOptions.thirdParty.allow;

    expect(isAllowed({ name: "a", license: "ISC" })).toBe(true);
    expect(isAllowed({ name: "b", license: "MIT" })).toBe(false);
  });

  test("fails the build on unlicensed or violating dependencies", () => {
    const { allow } = createLicensePluginOptions(
      { allowedLicenses: [] },
      createLogger(),
    ).thirdParty;

    expect(allow.failOnUnlicensed).toBe(true);
    expect(allow.failOnViolation).toBe(true);
  });
});
