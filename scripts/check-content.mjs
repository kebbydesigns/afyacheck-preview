// Verify the expanded route graph, local forms and page semantics after building.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { parseDocument } from "htmlparser2";
import { findAll, textContent } from "domutils";
import matter from "gray-matter";
import services from "../src/_data/services.json" with { type: "json" };
import mediaResources from "../src/_data/mediaResources.json" with { type: "json" };
import about from "../src/_data/about.json" with { type: "json" };
import whatWeDo from "../src/_data/whatWeDo.json" with { type: "json" };
import campaigns from "../src/_data/campaigns.json" with { type: "json" };
import getInvolved from "../src/_data/getInvolved.json" with { type: "json" };
import contact from "../src/_data/contact.json" with { type: "json" };
import policies from "../src/_data/policies.json" with { type: "json" };
import supportingPages from "../src/_data/supportingPages.json" with { type: "json" };

const sources = {
  about,
  whatWeDo,
  campaigns,
  getInvolved,
  contact,
  policies,
  supportingPages,
};
const resolveSource = (source) =>
  source.split(".").reduce((data, key) => data[key], sources);
const sharedSources = [
  "whatWeDo.programs",
  "whatWeDo.projects",
  "campaigns",
  "getInvolved",
  "policies",
];
for (const source of sharedSources) {
  const group = resolveSource(source);
  assert.ok(group.items.length);
  assert.equal(
    new Set(group.items.map((item) => item.slug)).size,
    group.items.length,
  );
  for (const item of group.items) {
    assert.match(item.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(
      item.title && item.description && item.url && item.sections.length,
    );
  }
}
for (const folder of [
  "what-we-do/programs",
  "what-we-do/projects",
  "get-involved",
])
  assert.deepEqual(fs.readdirSync(`src/pages/${folder}`).sort(), [
    "index.njk",
    "show.njk",
  ]);
assert.deepEqual(fs.readdirSync("src/pages/campaigns-and-events").sort(), [
  "index.njk",
  "past.njk",
  "register.njk",
  "show.njk",
]);
for (const item of whatWeDo.programs.items)
  assert.ok(item.focus && item.outcomes.length && item.regions.length);
for (const item of whatWeDo.projects.items)
  assert.ok(item.locationAndDates && item.partners.length);
assert.ok(campaigns.items.some((item) => item.slug === campaigns.featuredSlug));
for (const item of campaigns.items) {
  assert.ok(item.dateRange && item.location && item.region);
  assert.ok(Number.isFinite(item.targetScreenings));
  assert.ok(
    item.achievedScreenings === null ||
      Number.isFinite(item.achievedScreenings),
  );
}
for (const item of getInvolved.items)
  assert.ok(
    ["support", "partnership", "volunteer", "research"].includes(
      item.enquiryType,
    ),
  );

// Media content uses one index/show pair per type; static editorial views stay separate.
const mediaGroups = ["healthLibrary", "podcasts", "newsroom", "publications"];
for (const key of mediaGroups) {
  const group = mediaResources[key];
  assert.equal(
    new Set(group.items.map((item) => item.slug)).size,
    group.items.length,
  );
  assert.ok(group.items.length > 0);
  for (const item of group.items) {
    assert.match(item.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(item.title && item.description && item.sections.length);
    for (const match of group.metadataTemplate.matchAll(/\{(\w+)\}/g))
      assert.ok(item[match[1]] !== undefined, `${key}: missing ${match[1]}`);
  }
  const folder = group.index.url.split("/").filter(Boolean).at(-1);
  assert.deepEqual(
    fs.readdirSync(`src/pages/media-and-resources/${folder}`).sort(),
    key === "newsroom"
      ? ["index.njk", "press-kit.njk", "show.njk"]
      : ["index.njk", "show.njk"],
  );
}
assert.ok(
  !fs.existsSync("src/_data/catalog.json"),
  "Section JSON files must replace the duplicate reference catalogue.",
);

// Services deliberately use two shared views and one canonical dataset.
assert.equal(
  new Set(services.items.map((service) => service.slug)).size,
  services.items.length,
);
for (const service of services.items) {
  assert.match(service.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  for (const field of ["title", "description", "audience", "turnaround"])
    assert.ok(service[field]?.trim());
  assert.ok(service.scope.length && service.equipment.length);
}
assert.deepEqual(fs.readdirSync("src/pages/services").sort(), [
  "index.njk",
  "show.njk",
]);
assert.ok(!JSON.parse(fs.readFileSync("src/_data/home.json", "utf8")).services);

// Read page metadata from the authored files instead of a central page factory.
const sourceRoot = path.resolve("src/pages");
const pages = fs
  .readdirSync(sourceRoot, { recursive: true })
  .filter((file) => file.endsWith(".njk"))
  .map((file) => ({
    file,
    ...matter(fs.readFileSync(path.join(sourceRoot, file), "utf8")).data,
  }))
  .filter((page) => page.tags?.includes("contentPage"))
  .flatMap((page) => {
    const file = page.file.replaceAll("\\", "/");
    if (page.dataSource) {
      const source = resolveSource(page.dataSource);
      return (page.dataView === "show" ? source.items : [source]).map(
        (item) => ({
          ...page,
          title: item.title,
          url: item.url,
          form: item.enquiryType,
          generatedContent: page.dataView === "show",
        }),
      );
    }
    if (page.mediaSource) {
      const source = page.mediaSource
        .split(".")
        .reduce((data, key) => data[key], mediaResources);
      if (page.mediaView === "show")
        return source.items.map((item) => ({
          ...page,
          title: item.title,
          url: `${source.index.url}${item.slug}/`,
          generatedMedia: true,
          mediaGroup: source,
        }));
      return [{ ...page, title: source.title, url: source.url }];
    }
    if (file === "services/show.njk")
      return services.items.map((service) => ({
        ...page,
        title: service.title,
        url: `/services/${service.slug}/`,
        generatedService: true,
      }));
    if (file === "services/index.njk")
      return [{ ...page, title: services.index.title, url: "/services/" }];
    return [{ ...page, url: page.permalink, form: page.enquiryType }];
  });
assert.ok(pages.length > 0, "Individual content pages must live in src/pages.");
assert.ok(
  !fs.existsSync("src/_data/contentPages.js"),
  "Page content must not return to a central generator.",
);

const root = path.resolve("_site");
assert.equal(
  new Set(pages.map((p) => p.url)).size,
  pages.length,
  "Duplicate authored routes",
);
for (const page of pages) {
  assert.ok(
    !page.pagination ||
      page.generatedService ||
      page.generatedMedia ||
      page.generatedContent,
    `${page.file}: pagination must use an approved shared content source`,
  );
  assert.ok(
    matter(
      fs.readFileSync(path.join(sourceRoot, page.file), "utf8"),
    ).content.includes('class="content-section"'),
    `${page.file}: page section markup belongs in its own file`,
  );
  const file = path.join(root, page.url, "index.html");
  assert.ok(fs.existsSync(file), `Missing ${page.url}`);
  const html = fs.readFileSync(file, "utf8");
  const dom = parseDocument(html);
  const nodes = findAll((n) => Boolean(n.attribs), dom.children);
  const headings = nodes.filter((n) => n.name === "h1");
  assert.equal(headings.length, 1, `${page.url}: expected one h1`);
  assert.equal(textContent(headings[0]).trim(), page.title);
  if (page.generatedContent) {
    const index = JSON.parse(
      fs.readFileSync("_site/search-index.json", "utf8"),
    );
    assert.ok(
      index.some(
        (entry) => entry.url === page.url && entry.title === page.title,
      ),
      `${page.url}: missing from search`,
    );
  }
  if (page.generatedMedia) {
    const index = JSON.parse(
      fs.readFileSync("_site/search-index.json", "utf8"),
    );
    assert.ok(
      index.some(
        (entry) => entry.url === page.url && entry.title === page.title,
      ),
      `${page.url}: missing from search`,
    );
    if (page.mediaGroup.relatedHeading) {
      const related = nodes.find((cls) =>
        cls.attribs.class?.includes("related-section"),
      );
      assert.ok(related);
      const links = findAll((node) => node.name === "a", related.children);
      assert.equal(links.length, page.mediaGroup.items.length - 1);
      assert.ok(links.every((node) => node.attribs.href !== page.url));
    }
  }
  if (page.generatedService) {
    const related = nodes.find((node) =>
      node.attribs.class?.includes("related-section"),
    );
    const links = findAll((node) => node.name === "a", related.children);
    assert.equal(links.length, services.items.length - 1);
    assert.ok(links.every((node) => node.attribs.href !== page.url));
    const index = JSON.parse(
      fs.readFileSync("_site/search-index.json", "utf8"),
    );
    assert.ok(
      index.some(
        (entry) => entry.url === page.url && entry.title === page.title,
      ),
      `${page.url}: missing from search`,
    );
  }
  const title = nodes.find((n) => n.name === "title");
  assert.equal(
    textContent(title).replace(/\s+/g, " ").trim(),
    `${page.title} | AfyaCheck`,
    `${page.url}: escaped or incorrect document title`,
  );
  assert.ok(
    !/undefined|\[object Object\]/.test(html),
    `${page.url}: unresolved content`,
  );
  for (const node of nodes) {
    const href = node.attribs.href;
    if (href?.startsWith("/") || href?.startsWith("#")) {
      const target = new URL(href, `http://prototype.local${page.url}`);
      const targetFile = target.pathname.endsWith("/")
        ? path.join(root, target.pathname, "index.html")
        : path.join(root, target.pathname);
      assert.ok(fs.existsSync(targetFile), `${page.url}: missing ${href}`);
      if (target.hash)
        assert.ok(
          fs
            .readFileSync(targetFile, "utf8")
            .includes(`id="${target.hash.slice(1)}"`),
          `${page.url}: missing anchor ${href}`,
        );
    }
    if (node.name === "img")
      assert.ok(
        fs.existsSync(path.join(root, node.attribs.src)),
        `${page.url}: missing image`,
      );
    if (node.name === "label")
      assert.ok(
        nodes.some((n) => n.attribs.id === node.attribs.for),
        `${page.url}: orphan label`,
      );
  }
  const form = nodes.find((n) => n.attribs.class === "enquiry-form");
  if (page.form) {
    assert.ok(
      form?.attribs["x-on:submit"]?.includes("$event.preventDefault()"),
    );
    const controls = findAll(
      (n) => ["input", "select", "textarea"].includes(n.name),
      form.children,
    );
    assert.ok(
      controls.every((n) => !n.attribs.name),
      `${page.url}: native form must not serialize personal data`,
    );
    const guard = findAll((n) => n.name === "fieldset", form.children)[0];
    assert.ok(Object.hasOwn(guard.attribs, "disabled"));
    assert.equal(guard.attribs["x-bind:disabled"], "!ready");
  }
}

// Directory projections must expose every canonical record in its authored order.
for (const [url, records] of [
  [whatWeDo.programs.index.url, whatWeDo.programs.items],
  [whatWeDo.projects.index.url, whatWeDo.projects.items],
  [getInvolved.index.url, getInvolved.items],
  [
    campaigns.past.url,
    campaigns.items.filter((item) => item.status === "Past"),
  ],
  [
    campaigns.index.url,
    [
      ...campaigns.items.filter((item) => item.slug === campaigns.featuredSlug),
      ...campaigns.items.filter((item) => item.slug !== campaigns.featuredSlug),
    ],
  ],
]) {
  const dom = parseDocument(
    fs.readFileSync(path.join(root, url, "index.html"), "utf8"),
  );
  const cards = findAll(
    (node) => node.attribs?.class?.split(" ").includes("content-card"),
    dom.children,
  );
  const links = cards.flatMap((card) =>
    findAll((node) => node.name === "a", card.children),
  );
  assert.deepEqual(
    links.map((node) => node.attribs.href),
    records.map((item) => item.url),
    `${url}: directory differs from canonical records`,
  );
}

// Exercise the real local form component: invalid entries stay, valid entries clear.
const components = {};
vm.runInNewContext(fs.readFileSync("src/assets/js/app.js", "utf8"), {
  document: {
    addEventListener(name, callback) {
      if (name === "alpine:init") callback();
    },
  },
  Alpine: {
    data(name, factory) {
      components[name] = factory;
    },
  },
});
const form = components.demoEnquiry();
assert.equal(form.ready, false);
form.init();
assert.equal(form.ready, true);
let resets = 0;
form.complete({ reportValidity: () => false, reset: () => resets++ });
assert.equal(form.submitted, false);
assert.equal(resets, 0);
form.complete({ reportValidity: () => true, reset: () => resets++ });
assert.equal(form.submitted, true);
assert.equal(resets, 1);
console.log(
  `${pages.length} content routes: headings, internal links, assets and local form guards pass.`,
);
