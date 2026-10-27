import { beforeEach, describe, expect, test, vi } from "vitest";

const { addVitePlugin, license, logger } = vi.hoisted(() => ({
  addVitePlugin: vi.fn(),
  license: vi.fn(() => ({ name: "license-plugin" })),
  logger: { error: vi.fn(), info: vi.fn() },
}));

vi.mock("nuxt/kit", () => ({
  addVitePlugin,
  defineNuxtModule: (definition: unknown) => definition,
  useLogger: () => logger,
}));
vi.mock("rollup-plugin-license", () => ({ default: license }));

const licenseModule = (await import("../../modules/license-module.ts")).default;

describe("license module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("is configurable via the licenseModule key", () => {
    expect(licenseModule.meta).toMatchObject({
      name: "@jojomatik/nuxt-bundle/license-module",
      configKey: "licenseModule",
    });
  });

  test("registers the license plugin as vite plugin", () => {
    licenseModule.setup({ allowedLicenses: ["MIT"] });

    expect(license).toHaveBeenCalledOnce();
    expect(license).toHaveBeenCalledWith(
      expect.objectContaining({
        thirdParty: expect.objectContaining({ includePrivate: false }),
      }),
    );
    expect(addVitePlugin).toHaveBeenCalledWith({ name: "license-plugin" });
  });
});
