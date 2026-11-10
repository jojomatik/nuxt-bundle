import { beforeEach, describe, expect, test, vi } from "vitest";

const { readdirSync } = vi.hoisted(() => ({
  readdirSync: vi.fn(() => ["en.json"]),
}));

vi.mock("fs", () => ({ readdirSync }));

vi.stubGlobal("defineNuxtConfig", (config: unknown) => config);

const { default: config, getLocales } = await import("../nuxt.config.ts");

describe("getLocales", () => {
  beforeEach(() => {
    readdirSync.mockReturnValue(["de.json", "en.json", "fr.json"]);
  });

  test("derives a locale for every file in ./locales", () => {
    expect(getLocales()).toEqual([
      { code: "de", iso: "de", file: "de.json" },
      { code: "en", iso: "en", file: "en.json" },
      { code: "fr", iso: "fr", file: "fr.json" },
    ]);
    expect(readdirSync).toHaveBeenCalledWith("./locales");
  });

  test("returns no locales for an empty directory", () => {
    readdirSync.mockReturnValue([]);

    expect(getLocales()).toEqual([]);
  });
});

describe("nuxt config", () => {
  test("includes the bundled modules", () => {
    expect(config.modules).toEqual(
      expect.arrayContaining([
        "@nuxtjs/i18n",
        "@nuxt/fonts",
        "vuetify-nuxt-module",
        "@nuxt/image",
      ]),
    );
  });

  test("uses english as default locale and renders on the server", () => {
    expect(config.i18n?.defaultLocale).toBe("en");
    expect(config.ssr).toBe(true);
  });

  test("uses the locally installed Roboto with an explicit Latin preload", () => {
    expect(config.fonts).toEqual({
      npm: { remote: false },
      experimental: { disableLocalFallbacks: true },
      families: [
        {
          name: "Roboto",
          provider: "npm",
          global: true,
          weights: [300, 400, 500, 700],
          styles: ["normal", "italic"],
          preload: true,
        },
      ],
    });
  });
});
