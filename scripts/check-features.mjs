// Exercise real search/filter/export helpers and audit generated page contracts.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { parseDocument } from "htmlparser2";
import { findAll, textContent } from "domutils";
import {
  searchPages,
  filterImpact,
  impactCSV,
} from "../src/assets/js/features-core.js";
import about from "../src/_data/about.json" with { type: "json" };
import translations from "../src/_data/navigationTranslations.json" with { type: "json" };

const index = JSON.parse(fs.readFileSync("_site/search-index.json", "utf8"));
assert.ok(
  index.some((page) => page.url === "/"),
  "The public homepage must be searchable",
);
assert.equal(new Set(index.map((page) => page.url)).size, index.length);
assert.equal(
  searchPages(index, "mobile screening")[0].url,
  "/services/mobile-health-screening/",
);
assert.equal(searchPages(index, "   ").length, 0);
assert.equal(searchPages(index, "zzznomatchingword").length, 0);
assert.equal(searchPages(index, "<script>alert('test')</script>").length, 0);
assert.ok(
  searchPages(index, "uchunguzi magari").some(
    (page) => page.url === "/services/mobile-health-screening/",
  ),
);
assert.ok(searchPages(index, "KIGOMA").length > 0);
assert.equal(
  searchPages(
    [{ title: "Afya", description: "Café health", text: "", url: "/test/" }],
    "cafe",
  ).length,
  1,
);

const records = about.impact.records;
assert.equal(filterImpact(records, {}).length, records.length);
const selected = filterImpact(records, {
  year: "2026",
  region: "Kigoma",
  topic: "Maternal & Child",
});
assert.equal(selected.length, 1);
assert.equal(selected[0].screened, 18240);
assert.equal(
  filterImpact(records, { year: "2024", region: "Kigoma" }).length,
  0,
);
assert.equal(impactCSV(selected).split("\r\n").length, 2);
const hostile = impactCSV([
  {
    ...records[0],
    region: '=HYPERLINK("example")',
    topic: 'Comma, quote " and\nnewline',
  },
]);
assert.ok(hostile.includes('"\'=HYPERLINK(""example"")"'));
assert.ok(hostile.includes('"Comma, quote "" and\nnewline"'));
assert.equal(records.length, 8, "Filtering must not mutate source records");

const output = path.resolve("_site");
const files = fs
  .readdirSync(output, { recursive: true })
  .filter((file) => file.endsWith(".html"));
const labelCoverage = new Set();
for (const file of files) {
  const document = parseDocument(
    fs.readFileSync(path.join(output, file), "utf8"),
  );
  const nodes = findAll((node) => Boolean(node.attribs), document.children);
  const ids = nodes.map((node) => node.attribs.id).filter(Boolean);
  assert.equal(new Set(ids).size, ids.length, `${file}: duplicate IDs`);
  assert.equal(
    nodes.filter((node) => node.name === "h1").length,
    1,
    `${file}: missing or duplicate h1`,
  );
  assert.equal(nodes.find((node) => node.name === "html").attribs.lang, "en");
  const canonical = nodes.find((node) => node.attribs.rel === "canonical");
  assert.ok(
    new URL(canonical.attribs.href).pathname,
    `${file}: invalid canonical URL`,
  );
  assert.equal(
    nodes.find((node) => node.attribs.name === "robots").attribs.content,
    "noindex, nofollow",
  );
  for (const property of ["og:title", "og:description", "og:url", "og:image"])
    assert.ok(
      nodes.some(
        (node) => node.attribs.property === property && node.attribs.content,
      ),
      `${file}: missing ${property}`,
    );
  for (const node of nodes) {
    for (const attr of [
      "aria-labelledby",
      "aria-describedby",
      "aria-controls",
    ]) {
      for (const id of (node.attribs[attr] || "").split(/\s+/).filter(Boolean))
        assert.ok(ids.includes(id), `${file}: missing ${attr} target ${id}`);
    }
    if (node.attribs["data-nav-text"])
      labelCoverage.add(node.attribs["data-nav-text"]);
    if (node.name === "img") {
      assert.ok(
        node.attribs.alt !== undefined,
        `${file}: image has no alternative text`,
      );
      assert.ok(
        Number(node.attribs.width) > 0 && Number(node.attribs.height) > 0,
        `${file}: missing image dimensions`,
      );
    }
    for (const attr of ["href", "src"]) {
      const target = node.attribs[attr];
      if (!target?.startsWith("/") || target.startsWith("//")) continue;
      const url = new URL(target, "http://prototype.local");
      const targetFile = path.join(
        output,
        url.pathname,
        url.pathname.endsWith("/") ? "index.html" : "",
      );
      assert.ok(fs.existsSync(targetFile), `${file}: broken ${attr} ${target}`);
      if (url.hash)
        assert.ok(
          fs
            .readFileSync(targetFile, "utf8")
            .includes(`id="${url.hash.slice(1)}"`),
          `${file}: missing anchor ${target}`,
        );
    }
    if (
      ["input", "select", "textarea"].includes(node.name) &&
      node.attribs.type !== "hidden"
    ) {
      assert.ok(
        node.attribs["aria-label"] ||
          nodes.some(
            (label) =>
              label.name === "label" && label.attribs.for === node.attribs.id,
          ),
        `${file}: unlabelled control`,
      );
    }
  }
  const main = nodes.find((node) => node.name === "main");
  assert.ok(textContent(main).trim(), `${file}: empty main content`);
}
for (const label of labelCoverage)
  assert.ok(
    translations[label],
    `Missing Kiswahili navigation label: ${label}`,
  );
assert.ok(fs.readFileSync("_site/robots.txt", "utf8").includes("Disallow: /"));
console.log(
  `Search ranking, Kiswahili keywords, filters and safe CSV export pass; ${files.length} pages pass metadata, labels, assets, ARIA and link checks.`,
);
