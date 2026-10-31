# @jojomatik/nuxt-bundle
[![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/jojomatik/nuxt-bundle?sort=semver)](https://github.com/jojomatik/nuxt-bundle/releases) [![GitHub](https://img.shields.io/github/license/jojomatik/nuxt-bundle)](LICENSE) [![Build and publish npm package](https://github.com/jojomatik/nuxt-bundle/actions/workflows/publish.yml/badge.svg)](https://github.com/jojomatik/nuxt-bundle/actions/workflows/publish.yml) [![npm](https://img.shields.io/npm/v/@jojomatik/nuxt-bundle)](https://www.npmjs.com/package/@jojomatik/nuxt-bundle) [![npm](https://img.shields.io/npm/dw/@jojomatik/nuxt-bundle)](https://www.npmjs.com/package/@jojomatik/nuxt-bundle)

A bundle of commonly used nuxt dependencies and configuration.

## Usage
Extend your Nuxt configuration with `@jojomatik/nuxt-bundle` to use its shared dependencies and configuration. Dependency licenses are validated during builds.

Use `licenseModule.licenseOverrides` to provide license metadata for dependencies whose manifests omit it. Overrides are still checked against `licenseModule.allowedLicenses`:

```ts
export default defineNuxtConfig({
  extends: "@jojomatik/nuxt-bundle",
  licenseModule: {
    licenseOverrides: {
      "socket.io-client": "MIT",
    },
  },
});
```

Dependencies without an override still fail validation when their license metadata is missing.
An override can also be a function that receives the license from the package metadata. For example, to supply MIT only when the license is missing:

```ts
licenseOverrides: {
  "socket.io-client": (license) => license || "MIT",
}
```

Use an object in `allowedLicenses` to allow a license only for specific dependencies:

```ts
licenseModule: {
  allowedLicenses: [
    "MIT",
    { "SEE LICENSE IN LICENSE.md": ["apexcharts", "vue-apexcharts"] },
  ],
}
```

## Favicons
The favicon module is opt-in. When enabled, it generates all favicon files from a single SVG during the build:

```ts
export default defineNuxtConfig({
  extends: "@jojomatik/nuxt-bundle",
  faviconModule: {
    enabled: true,
    // source: "public/favicon.svg",
  },
});
```

- `source` is the SVG to generate from (default `public/favicon.svg`). If it does not exist, nothing is generated.

Generated files: `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`, `android-chrome-192x192.png`, `android-chrome-512x512.png`, `safari-pinned-tab.svg` and `site.webmanifest`.

The files are written to a cache directory under `node_modules/.cache` (not your source tree) and served from `/assets/favicon/` with `max-age=0`, so clients revalidate them (the file names are not versioned). A file that already exists in `public/assets/favicon/` is never generated or overridden, so you can supply your own version of any of them.

The `site.webmanifest` uses the `name` from your `package.json` (without scope, default `App`) as `name` and `short_name`, and the `primary` and `background` colors of the default Vuetify theme (set via `vuetify.vuetifyOptions.theme`) as `theme_color` and `background_color` (default `#ffffff`).

## Licensing
This project is licensed under the MIT License (MIT). See also [`LICENSE`](LICENSE).
