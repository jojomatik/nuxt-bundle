import { describe, expect, test } from "vitest";
import vuetifyOptions from "../vuetify-options.ts";

describe("vuetifyOptions", () => {
  const themes = vuetifyOptions.theme?.themes;

  test("defaults to the light theme, which is not dark", () => {
    expect(vuetifyOptions.theme?.defaultTheme).toBe("light");
    expect(themes?.light?.dark).toBe(false);
    expect(themes?.dark?.dark).toBe(true);
  });

  test("defines only valid hex colors", () => {
    for (const theme of Object.values(themes ?? {})) {
      for (const color of Object.values(theme?.colors ?? {})) {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    }
  });

  test("defines the same core colors for both themes", () => {
    const core = ["background", "surface", "primary", "secondary", "error"];

    for (const theme of [themes?.light, themes?.dark]) {
      expect(Object.keys(theme?.colors ?? {})).toEqual(
        expect.arrayContaining(core),
      );
    }
  });

  test("uses the mdi svg icon set", () => {
    expect(vuetifyOptions.icons?.defaultSet).toBe("mdi-svg");
  });
});
