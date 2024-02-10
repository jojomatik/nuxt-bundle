<template>
  <v-container class="full-width">
    <p class="text-h4">
      {{ i18n.t("nuxt-bundle.license-information.title") }}
    </p>
    <p class="text-body-1">
      {{
        i18n.t("nuxt-bundle.license-information.description", {
          title: i18n.t("title"),
        })
      }}
    </p>
    <v-row v-if="pending">
      <v-col v-for="index in 12" :key="index" cols="12" md="6" lg="4" xl="3">
        <v-skeleton-loader type="article"></v-skeleton-loader>
      </v-col>
    </v-row>
    <v-row v-else>
      <client-only>
        <v-col
          v-for="license of softwareInfo()"
          :key="license.name"
          cols="12"
          md="6"
          lg="4"
          xl="3"
        >
          <c-license-card :software-info="license"></c-license-card>
        </v-col>
      </client-only>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { type Composer } from "vue-i18n";
const i18n: Composer = useI18n();

// As nuxt can't fetch data from the public dir during SSR, the request can only be made on client side (see also nuxt/nuxt#13857).
const { pending, data: licenses } = await useFetch<
  {
    name: string;
    version: string;
    author: { name: string } | null;
    license: string;
    licenseText: string | null;
    repository: { url: string } | string | null;
  }[]
>("/dependencies.json", {
  lazy: true,
  server: false,
});

function softwareInfo() {
  if (!licenses.value) return null;

  return licenses.value
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((license) => {
      let repositoryLink: string | undefined =
        typeof license.repository === "string"
          ? license.repository
          : license.repository?.url;
      let repositoryOwner: string | undefined;

      if (repositoryLink) {
        // Normalize github URL:
        // 1. Remove `[...]github.com` prefix with protocol etc., if present.
        // 2. Remove `.git` suffix, if present.
        const repositoryCoordinates = repositoryLink
          .replace(/.+?(github.com\/)/, "")
          .replace(".git", "");

        // 3. Prepend `https://github.com/`.
        repositoryLink = "https://github.com/" + repositoryCoordinates;

        // If author is not set, retrieve author from repository coordinates.
        if (!license.author)
          repositoryOwner = repositoryCoordinates.split("/")[0];
      }

      return {
        name: license.name,
        version: license.version,
        author: license.author?.name ?? repositoryOwner,
        notice: license.licenseText ?? license.license,
        repositoryLink,
      };
    });
}

useHead({
  title: i18n.t("nuxt-bundle.license-information.title"),
});

useSeoMeta({
  title: i18n.t("nuxt-bundle.license-information.title"),
  ogTitle: i18n.t("nuxt-bundle.license-information.title"),
  description: i18n.t("nuxt-bundle.license-information.description", {
    title: i18n.t("title"),
  }),
  ogDescription: i18n.t("nuxt-bundle.license-information.description", {
    title: i18n.t("title"),
  }),
});
</script>

<style lang="scss"></style>
