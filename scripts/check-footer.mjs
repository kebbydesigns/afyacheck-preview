import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { parseDocument } from "htmlparser2";
import { findAll, textContent } from "domutils";

const output = path.resolve("_site");
const pages = fs
  .readdirSync(output, { recursive: true })
  .filter((file) => file.endsWith("index.html"));
assert.ok(pages.length, "Build the prototype before checking the footer.");
for (const file of pages) {
  const document = parseDocument(
    fs.readFileSync(path.join(output, file), "utf8"),
  );
  const all = findAll((node) => Boolean(node.attribs), document.children);
  const footer = all.find((node) => node.name === "footer");
  assert.ok(footer, `${file}: missing footer`);
  const elements = findAll((node) => Boolean(node.attribs), footer.children);
  const ids = all.map((node) => node.attribs.id).filter(Boolean);
  for (const node of elements) {
    for (const attribute of ["aria-labelledby", "aria-describedby"]) {
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
    assert.notEqual(href, "#", `${file}: placeholder link`);
    if (href?.startsWith("/")) {
      assert.ok(
        fs.existsSync(path.join(output, href, "index.html")),
        `${file}: dead link ${href}`,
      );
    } else if (href?.startsWith("#")) {
      assert.ok(ids.includes(href.slice(1)), `${file}: missing anchor ${href}`);
    }
    if (node.attribs["aria-disabled"] === "true") {
      assert.ok(!href, `${file}: unavailable route is linked`);
      assert.ok(textContent(node).includes("Coming soon"));
    }
    assert.notEqual(
      node.attribs.role,
      "alert",
      "Static notice must not be a live alert.",
    );
    if (node.name === "ul") {
      assert.ok(
        node.children
          .filter((child) => child.type === "tag")
          .every((child) => child.name === "li"),
      );
    }
  }
  const form = elements.find((node) => node.name === "form");
  assert.ok(
    form.attribs["x-on:submit"].includes("$event.preventDefault()"),
    "Formatter must preserve the submit handler.",
  );
  assert.ok(!("prevent" in form.attribs), "Split Alpine modifier found.");
  const email = elements.find(
    (node) => node.attribs.id === "footer-newsletter-email",
  );
  assert.equal(email.attribs.type, "email");
  assert.ok("required" in email.attribs);
  assert.ok("disabled" in email.attribs);
  assert.equal(email.attribs["x-bind:disabled"], "!ready");
  assert.ok(
    !("name" in email.attribs),
    "Demo email must not enter a native form request.",
  );
  assert.ok(
    elements.some(
      (node) => node.name === "label" && node.attribs.for === email.attribs.id,
    ),
  );
  assert.ok(elements.some((node) => node.attribs.role === "status"));
}

// Exercise the actual component with no network or storage available.
const listeners = new Map();
const components = new Map();
vm.runInNewContext(fs.readFileSync("src/assets/js/app.js", "utf8"), {
  document: {
    addEventListener: (event, handler) => listeners.set(event, handler),
  },
  Alpine: { data: (name, factory) => components.set(name, factory) },
});
listeners.get("alpine:init")();
const newsletter = components.get("newsletterForm")();
assert.equal(newsletter.ready, false);
newsletter.init();
assert.equal(newsletter.ready, true);
assert.equal(newsletter.submitted, false);
newsletter.email = "footer-demo@example.com";
newsletter.submit();
assert.equal(newsletter.submitted, true);
assert.equal(newsletter.email, "");
console.log(
  `Footer links, markup and newsletter guard checks pass on ${pages.length} pages; local demo state passes without network or storage.`,
);
