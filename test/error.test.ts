// @vitest-environment happy-dom
import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { onMounted } from "vue";
import ErrorPage from "../app/error.vue";

const translations: Record<string, string> = {
  "nuxt-bundle.error.404.title": "404 title",
  "nuxt-bundle.error.404.description": "404 description",
};
const t = vi.fn((key: string, params?: { error: number }) =>
  key in translations ? translations[key] : `${key}:${params?.error}`,
);
const useHead = vi.fn();

function render(error: { statusCode: number; message: string }) {
  return mount(ErrorPage, {
    props: { error },
    global: {
      stubs: {
        "v-app": { template: "<div><slot /></div>" },
        "v-sheet": { template: "<div><slot /></div>" },
        "v-card-title": { template: "<h1><slot /></h1>" },
        "v-card-text": { template: "<p><slot /></p>" },
      },
    },
  });
}

describe("error page", () => {
  beforeEach(() => {
    vi.stubGlobal("useI18n", () => ({
      t,
      te: (key: string) => key in translations,
    }));
    vi.stubGlobal("useHead", useHead);
    vi.stubGlobal("onMounted", onMounted);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    useHead.mockClear();
  });

  test("shows a status specific message when a translation exists", () => {
    const wrapper = render({ statusCode: 404, message: "not found" });

    expect(wrapper.find("h1").text()).toBe("404 title");
    expect(wrapper.find("p").text()).toBe("404 description");
    expect(useHead).toHaveBeenCalledWith({ title: "404 title" });
  });

  test("falls back to the generic message with the status code", () => {
    const wrapper = render({ statusCode: 500, message: "boom" });

    expect(wrapper.find("h1").text()).toBe("nuxt-bundle.error.title:500");
    expect(wrapper.find("p").text()).toBe("nuxt-bundle.error.description:500");
  });

  test("logs the error message once mounted", () => {
    render({ statusCode: 500, message: "boom" });

    expect(console.error).toHaveBeenCalledWith("boom");
  });
});
