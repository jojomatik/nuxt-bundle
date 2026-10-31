import * as fs from "node:fs";
import * as path from "node:path";
import { defineNuxtModule, resolvePath, useLogger } from "nuxt/kit";
import sharp from "sharp";

const moduleKey = "@jojomatik/nuxt-bundle/favicon-module";

const logger = useLogger(moduleKey);

/** URL path (below the app root) the files are served from. */
export const publicPath = "assets/favicon";

export interface FaviconModuleOptions {
  /** Opt-in: favicons are only generated when set to `true`. */
  enabled: boolean;
  /** Path of the source SVG, relative to the project root. */
  source: string;
}

/** PNG files to generate: file name and edge length in pixels. */
export const pngTargets = [
  { name: "favicon-16x16.png", size: 16 },
  { name: "favicon-32x32.png", size: 32 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "android-chrome-192x192.png", size: 192 },
  { name: "android-chrome-512x512.png", size: 512 },
];

/** Removes leading and trailing slashes without regular expressions. */
export function trimSlashes(value: string): string {
  let start = 0;
  let end = value.length;
  while (start < end && value[start] === "/") start++;
  while (end > start && value[end - 1] === "/") end--;
  return value.slice(start, end);
}

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

export interface ManifestInput {
  name?: string;
  themeColor?: string;
  backgroundColor?: string;
  publicPath: string;
}

/** Builds the web manifest content (icon URLs are relative to the manifest), falling back to sensible defaults. */
export function createManifest({
  name,
  themeColor,
  backgroundColor,
}: ManifestInput) {
  const appName = name?.trim() || "App";
  // Icons are served next to the manifest, so resolve them relative to it.
  const base = ".";
  return {
    name: appName,
    short_name: appName,
    icons: [
      {
        src: `${base}/android-chrome-192x192.png`,
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: `${base}/android-chrome-512x512.png`,
        sizes: "512x512",
        type: "image/png",
      },
    ],
    theme_color: themeColor || "#ffffff",
    background_color: backgroundColor || "#ffffff",
    display: "standalone",
  };
}

interface ThemeLike {
  defaultTheme?: string;
  themes?: Record<string, { colors?: Record<string, unknown> } | undefined>;
}

/** Reads a theme color of the default (or first) vuetify theme. */
export function getThemeColor(
  theme: ThemeLike | undefined,
  color: string,
): string | undefined {
  const themes = theme?.themes ?? {};
  const selected =
    themes[theme?.defaultTheme ?? "light"] ?? Object.values(themes)[0];
  const value = selected?.colors?.[color];
  return typeof value === "string" ? value : undefined;
}

/**
 * Generates all favicon files from the single SVG source.
 * Returns the names of the generated files.
 */
export async function generateFavicons(
  source: string,
  outputDir: string,
  skip: (name: string) => boolean = () => false,
): Promise<string[]> {
  fs.mkdirSync(outputDir, { recursive: true });
  const svg = fs.readFileSync(source);
  const generated: string[] = [];

  const renderPng = (size: number) =>
    sharp(svg, { density: 384 })
      .resize(size, size, { fit: "contain", background: "#0000" })
      .png()
      .toBuffer();

  const targets = pngTargets.filter(({ name }) => !skip(name));
  const pngs = await Promise.all(targets.map(({ size }) => renderPng(size)));
  targets.forEach(({ name }, index) => {
    fs.writeFileSync(path.join(outputDir, name), pngs[index]);
    generated.push(name);
  });

  if (!skip("favicon.ico")) {
    const icoPng = await renderPng(48);
    fs.writeFileSync(path.join(outputDir, "favicon.ico"), pngToIco(icoPng, 48));
    generated.push("favicon.ico");
  }

  if (!skip("safari-pinned-tab.svg")) {
    fs.copyFileSync(source, path.join(outputDir, "safari-pinned-tab.svg"));
    generated.push("safari-pinned-tab.svg");
  }

  return generated;
}

export default defineNuxtModule<FaviconModuleOptions>({
  meta: {
    name: moduleKey,
    configKey: "faviconModule",
  },
  defaults: {
    enabled: false,
    source: "public/favicon.svg",
  },
  async setup(options, nuxt) {
    if (!options.enabled) {
      return;
    }

    const source = path.resolve(nuxt.options.rootDir, options.source);
    if (!fs.existsSync(source)) {
      logger.info(`No favicon source found at ${source}, skipping.`);
      return;
    }

    // Generated files live in a cache directory, never in the source tree.
    // Nuxt's build directory can't be used, as it is cleaned during the build.
    const outputDir = path.join(
      nuxt.options.rootDir,
      "node_modules/.cache/@jojomatik/nuxt-bundle/favicon",
    );
    const publicDir = await resolvePath(nuxt.options.dir.public);
    const existsInSource = (name: string) =>
      fs.existsSync(path.join(publicDir, publicPath, name));

    nuxt.hook("nitro:config", async (nitroConfig) => {
      const files = await generateFavicons(source, outputDir, existsInSource);

      if (!existsInSource("site.webmanifest")) {
        let name: string | undefined;
        try {
          name = JSON.parse(
            fs.readFileSync(
              path.join(nuxt.options.rootDir, "package.json"),
              "utf-8",
            ),
          ).name;
        } catch {
          // no readable package.json, use the default name
        }
        if (name?.startsWith("@")) {
          name = name.slice(name.indexOf("/") + 1);
        }
        const theme = (
          nuxt.options as {
            vuetify?: { vuetifyOptions?: { theme?: ThemeLike } };
          }
        ).vuetify?.vuetifyOptions?.theme;
        const manifest = createManifest({
          name,
          themeColor: getThemeColor(theme, "primary"),
          backgroundColor: getThemeColor(theme, "background"),
          publicPath,
        });
        fs.writeFileSync(
          path.join(outputDir, "site.webmanifest"),
          JSON.stringify(manifest, null, 2),
        );
        files.push("site.webmanifest");
      }

      nitroConfig.publicAssets ||= [];
      nitroConfig.publicAssets.push({
        dir: outputDir,
        baseURL: "/" + publicPath,
        // Fixed file names (not versioned): always revalidate instead of caching long-term.
        maxAge: 0,
      });
      logger.success(`Generated ${files.length} favicon files in ${outputDir}`);
    });
  },
});
