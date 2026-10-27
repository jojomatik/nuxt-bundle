// @vitest-environment happy-dom
import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { defineComponent, h, ref, Suspense } from "vue";
import LicenseInformation from "../app/pages/license-information.vue";

type Dependency = {
  name: string;
  version: string;
  author: { name: string } | null;
  license: string;
  licenseText: string | null;
  repository: { url: string } | string | null;
};

const useHead = vi.fn();
const useSeoMeta = vi.fn();
const useFetch = vi.fn();

const LicenseCard = defineComponent({
  name: "CLicenseCard",
  props: { softwareInfo: { type: Object, required: true } },
  render() {
    return h("div", { class: "card" });
  },
});

async function render(data: Dependency[] | null, pending = false) {
  useFetch.mockResolvedValue({ pending: ref(pending), data: ref(data) });

  const wrapper = mount(
    defineComponent({
      render: () => h(Suspense, null, { default: () => h(LicenseInformation) }),
    }),
    {
      global: {
        stubs: {
          "v-container": { template: "<div><slot /></div>" },
          "v-row": { template: "<div><slot /></div>" },
          "v-col": { template: "<div><slot /></div>" },
          "v-skeleton-loader": { template: "<i class='skeleton' />" },
          "client-only": { template: "<div><slot /></div>" },
          "c-license-card": LicenseCard,
        },
      },
    },
  );
  await flushPromises();

  return wrapper;
}

const cards = (wrapper: Awaited<ReturnType<typeof render>>) =>
  wrapper
    .findAllComponents(LicenseCard)
    .map((card) => card.props("softwareInfo"));

const dependency = (overrides: Partial<Dependency>): Dependency => ({
  name: "pkg",
  version: "1.0.0",
  author: { name: "Author" },
  license: "MIT",
  licenseText: null,
  repository: null,
  ...overrides,
});

describe("license information page", () => {
  beforeEach(() => {
    vi.stubGlobal("useI18n", () => ({
      t: (key: string, params?: { title: string }) =>
        params ? `${key}:${params.title}` : key,
    }));
    vi.stubGlobal("useHead", useHead);
    vi.stubGlobal("useSeoMeta", useSeoMeta);
    vi.stubGlobal("useFetch", useFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  test("loads the generated dependency list on the client only", async () => {
    await render([]);

    expect(useFetch).toHaveBeenCalledWith("/dependencies.json", {
      lazy: true,
      server: false,
    });
  });

  test("sets the page title and seo metadata", async () => {
    await render([]);

    expect(useHead).toHaveBeenCalledWith({
      title: "nuxt-bundle.license-information.title",
    });
    expect(useSeoMeta).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "nuxt-bundle.license-information.title",
        description: "nuxt-bundle.license-information.description:title",
      }),
    );
  });

  test("shows skeleton loaders while pending", async () => {
    const wrapper = await render(null, true);

    expect(wrapper.findAll(".skeleton")).toHaveLength(12);
    expect(cards(wrapper)).toEqual([]);
  });

  test("renders no cards when no data is available", async () => {
    const wrapper = await render(null);

    expect(cards(wrapper)).toEqual([]);
  });

  test("renders cards sorted by name", async () => {
    const wrapper = await render([
      dependency({ name: "zebra" }),
      dependency({ name: "alpha" }),
    ]);

    expect(cards(wrapper).map((card) => card.name)).toEqual(["alpha", "zebra"]);
  });

  test("normalizes github repository urls", async () => {
    const urls = [
      "git+https://github.com/owner/repo.git",
      "https://github.com/owner/repo",
      "git://github.com/owner/repo.git",
    ];
    const wrapper = await render(
      urls.map((url, index) =>
        dependency({ name: `pkg${index}`, repository: { url } }),
      ),
    );

    expect(cards(wrapper).map((card) => card.repositoryLink)).toEqual(
      urls.map(() => "https://github.com/owner/repo"),
    );
  });

  test("supports repositories given as plain string", async () => {
    const wrapper = await render([
      dependency({ repository: "https://github.com/owner/repo" }),
    ]);

    expect(cards(wrapper)[0].repositoryLink).toBe(
      "https://github.com/owner/repo",
    );
  });

  test("falls back to the repository owner when the author is missing", async () => {
    const wrapper = await render([
      dependency({
        author: null,
        repository: { url: "https://github.com/owner/repo.git" },
      }),
    ]);

    expect(cards(wrapper)[0].author).toBe("owner");
  });

  test("has no author or link without author and repository", async () => {
    const wrapper = await render([dependency({ author: null })]);

    expect(cards(wrapper)[0]).toMatchObject({
      author: undefined,
      repositoryLink: undefined,
    });
  });

  test("prefers the license text as notice over the license name", async () => {
    const wrapper = await render([
      dependency({ name: "a", licenseText: "Full text" }),
      dependency({ name: "b", licenseText: null }),
    ]);

    expect(cards(wrapper).map((card) => card.notice)).toEqual([
      "Full text",
      "MIT",
    ]);
  });
});
