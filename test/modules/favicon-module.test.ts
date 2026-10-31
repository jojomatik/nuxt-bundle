import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import sharp from "sharp";

const { logger } = vi.hoisted(() => ({
  logger: { info: vi.fn(), success: vi.fn() },
}));

vi.mock("nuxt/kit", () => ({
  defineNuxtModule: (definition: unknown) => definition,
  useLogger: () => logger,
}));

const faviconModule = (await import("../../modules/favicon-module.ts")).default;
const { generateFavicons, pngToIco } =
  await import("../../modules/favicon-module.ts");

const svg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="red"/></svg>';

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

  test("generates on nitro:build:before and skips without source", async () => {
    let hook: () => Promise<void> = async () => {};
    const nuxt = {
      options: { rootDir: dir },
      hook: (_: string, fn: () => Promise<void>) => (hook = fn),
    };
    const setup = faviconModule.setup as (o: unknown, n: unknown) => void;
    const options = { source: "icon.svg", outputDir: "out" };

    setup(options, nuxt);
    await hook();
    expect(logger.info).toHaveBeenCalled();
    expect(fs.existsSync(path.join(dir, "out"))).toBe(false);

    fs.writeFileSync(path.join(dir, "icon.svg"), svg);
    await hook();
    expect(fs.existsSync(path.join(dir, "out", "favicon.ico"))).toBe(true);
    expect(logger.success).toHaveBeenCalled();
  });
});
