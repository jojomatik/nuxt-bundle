import { h, reactive } from "vue";
import StoryWrapper from "./StoryWrapper.vue";
import type { PartialStoryFn, StoryContext } from "storybook/internal/csf";

export const DEFAULT_LOCALE = "en";
export const DEFAULT_THEME = "light";

type AppLocale = "de" | "en" | "fr";

const state = reactive<{ locale: AppLocale; theme: string }>({
  locale: DEFAULT_LOCALE as AppLocale,
  theme: DEFAULT_THEME,
});

export default function themeLocaleDecorator(
  story: PartialStoryFn,
  context: StoryContext,
) {
  state.locale = context.globals.locale as AppLocale;
  state.theme = context.globals.theme;

  // Resolve the story component once; calling story() on every render creates a
  // new component each time and remounts the story, discarding its state.
  const storyComponent = story();

  return () => {
    return h(
      StoryWrapper,
      {
        themeName: state.theme,
        locale: state.locale,
      },
      {
        story: () => h(storyComponent, { ...context.args }),
      },
    );
  };
}
