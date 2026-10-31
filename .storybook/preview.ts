import "@fontsource/roboto/400.css";

import { setup } from "@storybook/vue3";
import * as vuetifyComponents from "vuetify/components";

import themeLocaleDecorator, {
  DEFAULT_THEME,
} from "./theme-locale-decorator.decorator";
import type { Preview } from "@nuxtjs/storybook";
import { themeLocaleModes } from "./modes";

// Prebuilt library components (e.g. from @crystal-creations/crystal-components)
// resolve Vuetify tags by name at runtime, which the template auto-import
// cannot handle. Register all Vuetify components globally for Storybook only.
setup((app) => {
  for (const [name, component] of Object.entries(vuetifyComponents)) {
    app.component(name, component);
  }
});

const preview: Preview = {
  initialGlobals: {
    locale: "en",
    theme: DEFAULT_THEME,
  },
  globalTypes: {
    locale: {
      name: "Locale",
      description: "Internationalization locale",
      toolbar: {
        icon: "globe",
        items: [
          { value: "en", title: "English" },
          { value: "de", title: "Deutsch" },
          { value: "fr", title: "Français" },
        ],
      },
    },
    theme: {
      name: "Theme",
      description: "Global theme for components",
      toolbar: {
        icon: "circlehollow",
        // Array of plain string values or MenuItem shape (see below)
        items: [
          { value: "light", title: "Light", icon: "circlehollow" },
          { value: "dark", title: "Dark", icon: "circle" },
        ],
        // Change title based on selected value
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    chromatic: {
      modes: themeLocaleModes,
    },
    options: {
      storySort: { order: ["Blockcluster", "Atoms", "Molecules", "Organisms"] },
    },
    actions: { argTypesRegex: "^on[A-Z].*" },
  },
  decorators: [themeLocaleDecorator],
  tags: ["autodocs"],
};

export default preview;
