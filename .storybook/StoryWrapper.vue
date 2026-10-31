<template>
  <v-app :theme="themeName">
    <v-main>
      <slot v-if="localeReady" name="story"></slot>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { VApp, VMain } from "vuetify/components";
import { useTheme } from "vuetify";
import { useI18n } from "vue-i18n";
import { ref, watch, watchEffect } from "vue";

// Vuetify hands its theme stylesheet to unhead, which Storybook never flushes
// to the DOM. Without this, all theme colors (--v-theme-*) would be missing.
const THEME_STYLE_ID = "vuetify-theme-stylesheet";
const vuetifyTheme = useTheme();
watchEffect(() => {
  let style = document.getElementById(THEME_STYLE_ID);
  if (!style) {
    style = document.createElement("style");
    style.id = THEME_STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = vuetifyTheme.styles.value;
});

const i18n = useI18n();
type AppLocale = typeof i18n.locale.value;

const props = defineProps<{ themeName: string; locale: AppLocale }>();

const localeReady = ref(false);

watch(
  () => props.locale,
  async (newLocale) => {
    localeReady.value = false;
    try {
      if (newLocale !== i18n.locale.value) {
        await i18n.setLocale(newLocale);
      }
    } finally {
      localeReady.value = true;
    }
  },
  { immediate: true },
);
</script>

<style>
.docs-story {
  .v-application__wrap {
    min-height: fit-content;
  }
}
</style>
