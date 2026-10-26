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

## Licensing
This project is licensed under the MIT License (MIT). See also [`LICENSE`](LICENSE).
