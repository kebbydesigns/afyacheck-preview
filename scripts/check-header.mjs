// Check the generated header contract without requiring a browser.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { parseDocument } from "htmlparser2";
import { findAll, textContent } from "domutils";

const output = path.resolve("_site");
const navigation = JSON.parse(
  fs.readFileSync("src/_data/header.json", "utf8"),
).navigation;
const pages = fs
  .readdirSync(output, { recursive: true })
  .filter((file) => file.endsWith("index.html"));
assert.ok(pages.length > 0, "Build the prototype before checking the header.");

for (const file of pages) {
  const document = parseDocument(
    fs.readFileSync(path.join(output, file), "utf8"),
  );
  const elements = findAll((node) => Boolean(node.attribs), document.children);
  const header = elements.find((node) => node.name === "header");
  assert.ok(header, `${file}: missing header`);
  // The same destination tree serves the modal mobile menu and inline desktop navbar.
  const panel = elements.find((node) => node.attribs.id === "mainNav");
  assert.ok(panel.attribs.class.split(/\s+/).includes("offcanvas"));
  assert.ok(!panel.attribs.class.split(/\s+/).includes("collapse"));
  assert.equal(panel.attribs.tabindex, "-1");
  assert.equal(panel.attribs["aria-labelledby"], "mainNavLabel");
  assert.ok(
    findAll(
      (node) => node.attribs?.["data-bs-dismiss"] === "offcanvas",
      panel.children,
    ).length === 1,
  );
  const trigger = elements.find(
    (node) => node.attribs["data-bs-target"] === "#mainNav",
  );
  assert.equal(trigger.attribs["data-bs-toggle"], "offcanvas");
  const headerElements = findAll(
    (node) => Boolean(node.attribs),
    header.children,
  );
  const currentUrl =
    "/" + file.replaceAll("\\", "/").replace(/index\.html$/, "");
  const ids = elements.map((node) => node.attribs.id).filter(Boolean);
  assert.equal(new Set(ids).size, ids.length, `${file}: duplicate IDs`);

  for (const node of headerElements) {
    for (const attribute of [
      "aria-controls",
      "aria-labelledby",
      "aria-describedby",
    ]) {
      for (const id of (node.attribs[attribute] || "")
        .split(/\s+/)
        .filter(Boolean)) {
        assert.ok(
          ids.includes(id),
          `${file}: missing ${attribute} target ${id}`,
        );
      }
    }
    const href = node.attribs.href;
    if (href?.startsWith("/")) {
      assert.ok(
        fs.existsSync(path.join(output, href, "index.html")),
        `${file}: header destination does not exist: ${href}`,
      );
    }
    if (node.attribs["aria-current"] === "page") {
      assert.equal(href, currentUrl, `${file}: incorrect current page`);
    }
    if (node.attribs["aria-disabled"] === "true") {
      assert.ok(!href, `${file}: future route must not be linked`);
      assert.ok(
        textContent(node).includes("Coming soon"),
        `${file}: future route needs a visible label`,
      );
    }
    if (node.attribs["data-bs-toggle"] === "dropdown") {
      assert.equal(node.name, "button", `${file}: disclosure must be a button`);
      assert.equal(node.attribs["aria-expanded"], "false");
    }
  }
  const activeSection = navigation.find(
    (item) => item.items && currentUrl.startsWith(item.url),
  );
  const expectedSection = activeSection ? `nav-${activeSection.id}` : null;
  const activeDisclosures = headerElements.filter(
    (node) =>
      node.attribs["data-bs-toggle"] === "dropdown" &&
      node.attribs.class?.split(/\s+/).includes("active"),
  );
  assert.deepEqual(
    activeDisclosures.map((node) => node.attribs.id),
    expectedSection ? [expectedSection] : [],
    `${file}: incorrect active section`,
  );
  const currentLinks = headerElements.filter(
    (node) => node.attribs["aria-current"] === "page",
  );
  const currentDestinations = [
    "/",
    "/search/",
    ...navigation.flatMap((item) =>
      item.items
        ? item.items
            .filter((child) => child.available)
            .map((child) => child.url)
        : [item.url],
    ),
  ];
  const expectCurrent = currentDestinations.includes(currentUrl);
  assert.equal(
    currentLinks.length,
    expectCurrent ? 1 : 0,
    `${file}: current-page link count`,
  );
  const main = elements.find((node) => node.attribs.id === "main-content");
  assert.equal(main?.name, "main");
  assert.equal(main.attribs.tabindex, "-1");
  assert.ok(
    elements.some(
      (node) => node.name === "a" && node.attribs.href === "#main-content",
    ),
  );
}
console.log(
  `Header destinations, active states, disclosure references and skip links pass on ${pages.length} pages.`,
);
