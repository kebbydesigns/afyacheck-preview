import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { parseDocument } from "htmlparser2";
import { findAll, textContent } from "domutils";
import services from "../src/_data/services.json" with { type: "json" };
import campaigns from "../src/_data/campaigns.json" with { type: "json" };

const output = path.resolve("_site");
const html = fs.readFileSync(path.join(output, "index.html"), "utf8");
const document = parseDocument(html);
const all = findAll((node) => Boolean(node.attribs), document.children);
const main = all.find((node) => node.name === "main");
const elements = findAll((node) => Boolean(node.attribs), main.children);
const ids = all.map((node) => node.attribs.id).filter(Boolean);
assert.equal(elements.filter((node) => node.name === "h1").length, 1);
assert.equal(elements.filter((node) => node.name === "section").length, 7);
assert.equal(
  elements.filter((node) => node.name === "article").length,
  services.items.length,
);
assert.equal(new Set(ids).size, ids.length);
assert.ok(!html.includes("Brightside"));

for (const node of elements) {
  for (const attribute of ["aria-labelledby", "aria-describedby"]) {
    for (const id of (node.attribs[attribute] || "")
      .split(/\s+/)
      .filter(Boolean)) {
      assert.ok(ids.includes(id), `Missing ${attribute} target ${id}`);
    }
  }
  const href = node.attribs.href;
  if (href?.startsWith("#"))
    assert.ok(ids.includes(href.slice(1)), `Missing anchor ${href}`);
  else if (href?.startsWith("/")) {
    assert.ok(
      fs.existsSync(path.join(output, href, "index.html")),
      `Dead CTA: ${href}`,
    );
  }
}
const images = elements.filter((node) => node.name === "img");
assert.equal(images.length, 3);
for (const image of images) {
  assert.ok(image.attribs.alt.length > 20);
  assert.ok(
    Number(image.attribs.width) > 0 && Number(image.attribs.height) > 0,
  );
  for (const source of [
    image.attribs.src,
    ...image.attribs.srcset
      .split(",")
      .map((entry) => entry.trim().split(/\s+/)[0]),
  ]) {
    assert.ok(source.startsWith("/assets/images/home/"));
    assert.ok(
      fs.existsSync(path.join(output, source)),
      `Missing image ${source}`,
    );
  }
}
assert.equal(images[0].attribs.fetchpriority, "high");
assert.ok(images.slice(1).every((image) => image.attribs.loading === "lazy"));
const progress = elements.find((node) => node.name === "progress");
const featured = campaigns.items.find(
  (item) => item.slug === campaigns.featuredSlug,
);
assert.equal(Number(progress.attribs.value), featured.achievedScreenings);
assert.equal(Number(progress.attribs.max), featured.targetScreenings);
assert.ok(Number(progress.attribs.value) <= Number(progress.attribs.max));
assert.ok(
  elements.some(
    (node) => node.name === "label" && node.attribs.for === progress.attribs.id,
  ),
);
assert.ok(
  textContent(main).includes(
    "All figures shown are illustrative prototype data",
  ),
);
console.log(
  "Homepage sections, eight services, CTA destinations, local image variants and accessible progress checks pass.",
);
