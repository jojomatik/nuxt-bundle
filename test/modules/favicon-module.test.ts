import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import sharp from "sharp";

const { logger } = vi.hoisted(() => ({
  logger: { info: vi.fn(), success: vi.fn() },
}));

vi.mock("nuxt/kit", () => ({
  defineNuxtModule: (definition: unknown) => definition,
  resolvePath: (p: string) => Promise.resolve(p),
  useLogger: () => logger,
}));

const faviconModule = (await import("../../modules/favicon-module.ts")).default;
const {
  generateFavicons,
  pngToIco,
  createManifest,
  getThemeColor,
  trimSlashes,
} = await import("../../modules/favicon-module.ts");

const svg = fs.readFileSync(
  path.resolve(import.meta.dirname, "../../public/favicon.svg"),
);

describe("favicon module", () => {
  let dir: string;

  beforeEach(() => {
    vi.clearAllMocks();
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "favicon-"));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  test("is configurable via the faviconModule key", () => {
    expect(faviconModule.meta).toMatchObject({ configKey: "faviconModule" });
  });

  test("generates all files from a single svg", async () => {
    fs.writeFileSync(path.join(dir, "favicon.svg"), svg);
    const out = path.join(dir, "out");

    const files = await generateFavicons(path.join(dir, "favicon.svg"), out);

    expect(files.sort()).toEqual(fs.readdirSync(out).sort());
    expect(fs.readdirSync(out)).toEqual(
      expect.arrayContaining([
        "favicon.ico",
        "favicon-16x16.png",
        "favicon-32x32.png",
        "apple-touch-icon.png",
        "safari-pinned-tab.svg",
      ]),
    );
    const meta = await sharp(path.join(out, "apple-touch-icon.png")).metadata();
    expect([meta.width, meta.height]).toEqual([180, 180]);
    const small = await sharp(path.join(out, "favicon-16x16.png")).metadata();
    expect(small.width).toBe(16);
  });

  test("wraps png in a valid ico container", () => {
    const ico = pngToIco(Buffer.from("png"), 48);
    expect(ico.readUInt16LE(2)).toBe(1);
    expect(ico.readUInt16LE(4)).toBe(1);
    expect(ico.readUInt8(6)).toBe(48);
    expect(ico.readUInt32LE(14)).toBe(3);
    expect(ico.subarray(22).toString()).toBe("png");
  });

  test("skips files present in the source directory", async () => {
    fs.writeFileSync(path.join(dir, "favicon.svg"), svg);
    const out = path.join(dir, "out");
    const files = await generateFavicons(
      path.join(dir, "favicon.svg"),
      out,
      (name) => name === "favicon.ico",
    );
    expect(files).not.toContain("favicon.ico");
    expect(fs.existsSync(path.join(out, "favicon.ico"))).toBe(false);
  });

  test("creates a manifest with defaults", () => {
    expect(createManifest({ publicPath: "assets/favicon" })).toMatchObject({
      name: "App",
      theme_color: "#ffffff",
      background_color: "#ffffff",
      display: "standalone",
    });
    const m = createManifest({
      name: "pkg",
      themeColor: "#111111",
      backgroundColor: "#222222",
      publicPath: "/x/",
    });
    expect(m).toMatchObject({ name: "pkg", short_name: "pkg" });
    expect(m.icons[0].src).toBe("/x/android-chrome-192x192.png");
    expect(m.theme_color).toBe("#111111");
  });

  test("trims slashes", () => {
    expect(trimSlashes("//a/b//")).toBe("a/b");
    expect(trimSlashes("///")).toBe("");
    expect(trimSlashes("a")).toBe("a");
  });

  test("reads theme colors", () => {
    const theme = {
      defaultTheme: "dark",
      themes: { dark: { colors: { primary: "#abc" } } },
    };
    expect(getThemeColor(theme, "primary")).toBe("#abc");
    expect(getThemeColor(theme, "background")).toBeUndefined();
    expect(getThemeColor(undefined, "primary")).toBeUndefined();
  });

  test("generates into a cache dir without touching the source", async () => {
    fs.writeFileSync(path.join(dir, "icon.svg"), svg);
    fs.writeFileSync(path.join(dir, "package.json"), '{"name":"@s/pkg"}');
    const pub = path.join(dir, "public", "assets", "favicon");
    fs.mkdirSync(pub, { recursive: true });
    fs.writeFileSync(path.join(pub, "favicon.ico"), "custom");
    const hooks: Record<
      string,
      (c: Record<string, unknown>) => void | Promise<void>
    > = {};
    const nuxt = {
      options: {
        rootDir: dir,
        dir: { public: path.join(dir, "public") },
        vuetify: {
          vuetifyOptions: {
            theme: { themes: { light: { colors: { primary: "#123456" } } } },
          },
        },
      },
      hook: (
        n: string,
        fn: (c: Record<string, unknown>) => void | Promise<void>,
      ) => (hooks[n] = fn),
    };
    const setup = faviconModule.setup as (
      o: unknown,
      n: unknown,
    ) => Promise<void>;
    await setup(
      { enabled: true, source: "icon.svg", publicPath: "assets/favicon" },
      nuxt,
    );

    const nitro: { publicAssets?: unknown[] } = {};
    await hooks["nitro:config"](nitro);

    const out = path.join(
      dir,
      "node_modules/.cache/@jojomatik/nuxt-bundle/favicon",
    );
    expect(fs.existsSync(path.join(out, "favicon.ico"))).toBe(false);
    expect(fs.readFileSync(path.join(pub, "favicon.ico"), "utf-8")).toBe(
      "custom",
    );
    expect(fs.readdirSync(pub)).toEqual(["favicon.ico"]);
    const manifest = JSON.parse(
      fs.readFileSync(path.join(out, "site.webmanifest"), "utf-8"),
    );
    expect(manifest).toMatchObject({ name: "pkg", theme_color: "#123456" });

    expect(nitro.publicAssets?.[0]).toMatchObject({
      dir: out,
      baseURL: "/assets/favicon",
    });
  });

  test("is opt-in and does nothing unless enabled", async () => {
    expect(faviconModule.defaults).toMatchObject({ enabled: false });
    fs.writeFileSync(path.join(dir, "icon.svg"), svg);
    const nuxt = { options: { rootDir: dir }, hook: vi.fn() };
    const setup = faviconModule.setup as (
      o: unknown,
      n: unknown,
    ) => Promise<void>;
    await setup({ enabled: false, source: "icon.svg", publicPath: "a" }, nuxt);
    expect(nuxt.hook).not.toHaveBeenCalled();
    expect(logger.success).not.toHaveBeenCalled();
  });

  test("skips without source", async () => {
    const nuxt = { options: { rootDir: dir }, hook: vi.fn() };
    const setup = faviconModule.setup as (
      o: unknown,
      n: unknown,
    ) => Promise<void>;
    await setup({ enabled: true, source: "none.svg", publicPath: "a" }, nuxt);
    expect(logger.info).toHaveBeenCalled();
    expect(nuxt.hook).not.toHaveBeenCalled();
  });
});
