// eleventy.config.js
import fs from "node:fs";

export default function (eleventyConfig) {
  // Render only named SVGs from the installed Bootstrap Icons package.
  const navigationIcons = new Map();
  eleventyConfig.addFilter("bootstrapIcon", (name) => {
    if (!/^[a-z0-9-]+$/.test(name || ""))
      throw new Error(`Invalid Bootstrap icon name: ${name}`);
    if (!navigationIcons.has(name))
      navigationIcons.set(
        name,
        fs.readFileSync(
          new URL(
            `./node_modules/bootstrap-icons/icons/${name}.svg`,
            import.meta.url,
          ),
          "utf8",
        ),
      );
    return navigationIcons.get(name);
  });
  // Derive dashboard choices during rendering so saved JSON edits update every output together.
  eleventyConfig.addFilter("impactChoices", (records) => {
    const values = (key) =>
      [...new Set(records.map((record) => record[key]))].sort();
    return {
      years: values("year").reverse(),
      regions: values("region"),
      topics: values("topic"),
    };
  });
  // Section directories and cross-links project the same records used by shared views.
  const pageCard = (item) => ({
    title: item.title,
    text: item.description,
    url: item.url,
    label: "Explore",
    ...(item.dateRange && item.region
      ? { kicker: `${item.dateRange} · ${item.region}` }
      : {}),
    ...item.card,
  });
  eleventyConfig.addFilter("pageCards", (items) => items.map(pageCard));
  eleventyConfig.addFilter("recordBySlug", (group, slug) => {
    const record = group.find((item) => item.slug === slug);
    if (!record) throw new Error(`Unknown content record: ${slug}`);
    return record;
  });
  eleventyConfig.addFilter("campaignCards", (group, mode) =>
    group.items
      .filter((item) =>
        mode === "past"
          ? item.status === "Past"
          : mode === "featured"
            ? item.slug === group.featuredSlug
            : item.slug !== group.featuredSlug,
      )
      .map(pageCard),
  );
  eleventyConfig.addFilter("resolveContentCards", (cards, sources) =>
    cards.map((card) => {
      if (!card.source) return card;
      const target = card.source
        .split(".")
        .reduce((data, key) => data?.[key], sources);
      const record = card.slug
        ? target?.items?.find((item) => item.slug === card.slug)
        : target;
      if (!record)
        throw new Error(
          `Unknown card reference: ${card.source}/${card.slug || ""}`,
        );
      const { source, slug, ...overrides } = card;
      const url =
        record.url ||
        (card.source === "services"
          ? `/services/${record.slug}/`
          : `${target.index.url}${record.slug}/`);
      return { ...pageCard(record), url, ...overrides };
    }),
  );
  eleventyConfig.addFilter("formatNumber", (value) =>
    Number(value).toLocaleString("en-US"),
  );
  // Media cards and detail metadata share the same canonical record fields.
  const interpolate = (template, record) =>
    template.replace(/\{(\w+)\}/g, (_, field) => record[field] ?? "");
  eleventyConfig.addFilter("resourceCards", (group, excludeSlug) =>
    group.items
      .filter((item) => item.slug !== excludeSlug)
      .map((item) => ({
        title: item.title,
        text: item.description,
        url: `${group.index.url}${item.slug}/`,
        label: group.card.label,
        kicker: interpolate(group.card.kicker, item),
      })),
  );
  eleventyConfig.addFilter("resourceMetadata", (item, group) =>
    interpolate(group.metadataTemplate, item),
  );
  // Directory and related cards are projections of the canonical service records.
  eleventyConfig.addFilter("serviceCards", (items, excludeSlug, label) =>
    items
      .filter((service) => service.slug !== excludeSlug)
      .map((service) => ({
        title: service.title,
        text: service.description,
        url: `/services/${service.slug}/`,
        label,
      })),
  );
  // ---------------------------------------------------------
  // 1. COPY files that need no processing into _site
  // ---------------------------------------------------------
  eleventyConfig.addPassthroughCopy("src/assets/images");
  eleventyConfig.addPassthroughCopy("src/assets/js");

  // Copy Bootstrap's and Alpine's JavaScript out of node_modules
  // "from": "to (inside _site)"
  eleventyConfig.addPassthroughCopy({
    "node_modules/bootstrap/dist/js/bootstrap.bundle.min.js":
      "assets/vendor/bootstrap.bundle.min.js",
    "node_modules/alpinejs/dist/cdn.min.js": "assets/vendor/alpine.min.js",
  });

  // ---------------------------------------------------------
  // 3. SHORTCODES: little helpers you can use in templates
  // ---------------------------------------------------------
  eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);
  // Encode embedded data safely and keep preview metadata on its configured origin.
  eleventyConfig.addFilter("jsonScript", (value) =>
    JSON.stringify(value).replaceAll("<", "\\u003c"),
  );
  eleventyConfig.addFilter(
    "absoluteUrl",
    (value, origin) => new URL(value, origin).href,
  );

  // ---------------------------------------------------------
  // 4. COLLECTIONS: groups of pages (Step 11b)
  // ---------------------------------------------------------
  // Individual page files tagged contentPage also supply the local search index.

  // ---------------------------------------------------------
  // 5. DEV SERVER: also print a network address so you can
  //    preview on a phone on the same Wi-Fi
  // ---------------------------------------------------------
  eleventyConfig.setServerOptions({
    showAllHosts: true,
    watch: ["_site/assets/css/**/*.css"], // reload when Sass writes new CSS
  });
}

// ---------------------------------------------------------
// 6. FOLDERS and template language
// ---------------------------------------------------------
export const config = {
  dir: {
    input: "src", // where you write
    includes: "_includes", // layouts, partials, components (inside src)
    data: "_data", // global data files (inside src)
    output: "_site", // where Eleventy writes the finished site
  },
  htmlTemplateEngine: "njk", // .html files may use Nunjucks too
  markdownTemplateEngine: "njk", // .md files may use Nunjucks too
};
