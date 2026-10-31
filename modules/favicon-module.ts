import * as fs from "fs";
import * as path from "path";
import { defineNuxtModule, useLogger } from "nuxt/kit";
import sharp from "sharp";

const moduleKey = "@jojomatik/nuxt-bundle/favicon-module";

const logger = useLogger(moduleKey);

export interface FaviconModuleOptions {
  /** Path of the source SVG, relative to the project root. */
  source: string;
  /** Output directory, relative to the project root. */
  outputDir: string;
}

/** PNG files to generate: file name and edge length in pixels. */
export const pngTargets = [
  { name: "favicon-16x16.png", size: 16 },
  { name: "favicon-32x32.png", size: 32 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "android-chrome-192x192.png", size: 192 },
  { name: "android-chrome-512x512.png", size: 512 },
];

/** Wraps a PNG image in an ICO container. */
export function pngToIco(png: Buffer, size: number): Buffer {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // image count
  header.writeUInt8(size >= 256 ? 0 : size, 6);
  header.writeUInt8(size >= 256 ? 0 : size, 7);
  header.writeUInt16LE(1, 10); // color planes
  header.writeUInt16LE(32, 12); // bits per pixel
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(header.length, 18);
  return Buffer.concat([header, png]);
}

/**
 * Generates all favicon files from the single SVG source.
 * Returns the names of the generated files.
 */
export async function generateFavicons(
  source: string,
  outputDir: string,
): Promise<string[]> {
  fs.mkdirSync(outputDir, { recursive: true });
  const svg = fs.readFileSync(source);
  const generated: string[] = [];

  for (const { name, size } of pngTargets) {
    const png = await sharp(svg, { density: 384 })
      .resize(size, size, { fit: "contain", background: "#0000" })
      .png()
      .toBuffer();
    fs.writeFileSync(path.join(outputDir, name), png);
    generated.push(name);
  }

  const icoPng = await sharp(svg, { density: 384 })
    .resize(48, 48, { fit: "contain", background: "#0000" })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(outputDir, "favicon.ico"), pngToIco(icoPng, 48));
  generated.push("favicon.ico");

  fs.copyFileSync(source, path.join(outputDir, "safari-pinned-tab.svg"));
  generated.push("safari-pinned-tab.svg");

  return generated;
}

export default defineNuxtModule<FaviconModuleOptions>({
  meta: {
    name: moduleKey,
    configKey: "faviconModule",
  },
  defaults: {
    source: "public/favicon.svg",
    outputDir: "public/assets/favicon",
  },
  setup(options, nuxt) {
    nuxt.hook("nitro:build:before", async () => {
      const source = path.resolve(nuxt.options.rootDir, options.source);
      if (!fs.existsSync(source)) {
        logger.info(`No favicon source found at ${source}, skipping.`);
        return;
      }
      const outputDir = path.resolve(nuxt.options.rootDir, options.outputDir);
      const files = await generateFavicons(source, outputDir);
      logger.success(`Generated ${files.length} favicon files in ${outputDir}`);
    });
  },
});
