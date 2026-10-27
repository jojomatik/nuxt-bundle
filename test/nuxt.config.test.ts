import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const { readdirSync, cpSync } = vi.hoisted(() => ({
  readdirSync: vi.fn(() => ["en.json"]),
  cpSync: vi.fn(),
}));

vi.mock("fs", () => ({ readdirSync, cpSync }));

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
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("includes the bundled modules", () => {
    expect(config.modules).toEqual(
      expect.arrayContaining([
        "@nuxtjs/i18n",
        "vuetify-nuxt-module",
        "@nuxt/image",
      ]),
    );
  });

  test("uses english as default locale and renders on the server", () => {
    expect(config.i18n?.defaultLocale).toBe("en");
    expect(config.ssr).toBe(true);
  });

  test("copies the fonts before the nitro build", () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const hook = config.hooks?.["nitro:build:before"] as () => void;

    hook();

    expect(cpSync).toHaveBeenCalledWith(
      "node_modules/@fontsource/",
      "public/assets/fonts/",
      { recursive: true },
    );
  });
});
