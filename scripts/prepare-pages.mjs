// Prepare a separate Pages artifact; local preview and canonical records stay unchanged.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { parseDocument } from "htmlparser2";
import { findAll } from "domutils";

const site = new URL(
  process.env.PAGES_URL || "https://kebbydesigns.github.io/afyacheck-preview/",
);
assert.equal(site.protocol, "https:");
assert.ok(site.pathname.endsWith("/"), "PAGES_URL must end with a slash");
const prefix = site.pathname;
const source = path.resolve("_site");
const output = path.resolve("_pages");
assert.ok(
  fs.existsSync(path.join(source, "index.html")),
  "Run npm run build first",
);
fs.mkdirSync(output, { recursive: true });

// Only URL-bearing HTML attributes, search destinations and application imports need a base path.
const localUrl = (value) =>
  value.startsWith("/") && !value.startsWith("//")
    ? prefix + value.slice(1)
    : value;
const pageFiles = [];
for (const entry of fs.readdirSync(source, {
  recursive: true,
  withFileTypes: true,
})) {
  if (!entry.isFile()) continue;
  const input = path.join(entry.parentPath, entry.name);
  const relative = path.relative(source, input);
  const target = path.join(output, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (relative.endsWith(".html")) {
    let html = fs.readFileSync(input, "utf8");
    html = html.replace(
      /\b(href|src|action)=(['"])(\/[^'"<>]*)\2/g,
      (_, attr, quote, value) => `${attr}=${quote}${localUrl(value)}${quote}`,
    );
    // The normal build uses SITE_URL as an origin; Pages adds the repository path.
    html = html.replace(
      /\b(href|content)=(['"])(https?:\/\/[^'"<>]+)\2/g,
      (match, attr, quote, value) => {
        const url = new URL(value);
        return url.origin === site.origin
          ? `${attr}=${quote}${site.origin}${localUrl(url.pathname)}${url.search}${url.hash}${quote}`
          : match;
      },
    );
    fs.writeFileSync(target, html);
    pageFiles.push(target);
  } else if (relative === "search-index.json") {
    const records = JSON.parse(fs.readFileSync(input, "utf8"));
    fs.writeFileSync(
      target,
      JSON.stringify(
        records.map((record) => ({ ...record, url: localUrl(record.url) })),
      ),
    );
  } else if (relative.replaceAll(path.sep, "/") === "assets/js/app.js") {
    const js = fs
      .readFileSync(input, "utf8")
      .replace(
        /\b(import|fetch)\((['"])(\/[^'"]*)\2/g,
        (_, method, quote, value) =>
          `${method}(${quote}${localUrl(value)}${quote}`,
      );
    fs.writeFileSync(target, js);
  } else {
    fs.copyFileSync(input, target);
  }
}
fs.writeFileSync(path.join(output, ".nojekyll"), "");

// Check the actual publish artifact, including links that normal root-host checks cannot cover.
const verifyUrl = (value, file) => {
  const url = new URL(value, site);
  if (url.origin !== site.origin) return;
  assert.ok(
    url.pathname.startsWith(prefix),
    `${file}: URL escapes project path: ${value}`,
  );
  const relative = decodeURIComponent(url.pathname.slice(prefix.length));
  const target = path.resolve(
    output,
    relative,
    url.pathname.endsWith("/") ? "index.html" : "",
  );
  assert.ok(target.startsWith(output + path.sep), `${file}: invalid local URL`);
  assert.ok(
    fs.existsSync(target),
    `${file}: missing published target: ${value}`,
  );
};
for (const file of pageFiles) {
  const document = parseDocument(fs.readFileSync(file, "utf8"));
  const nodes = findAll((node) => Boolean(node.attribs), document.children);
  for (const node of nodes) {
    for (const attr of ["href", "src", "action"]) {
      const value = node.attribs[attr];
      if (value?.startsWith("/") || value?.startsWith(site.origin + "/"))
        verifyUrl(value, file);
    }
    if (["og:url", "og:image"].includes(node.attribs.property))
      verifyUrl(node.attribs.content, file);
  }
}
for (const record of JSON.parse(
  fs.readFileSync(path.join(output, "search-index.json"), "utf8"),
))
  verifyUrl(record.url, "search-index.json");
const app = fs.readFileSync(path.join(output, "assets/js/app.js"), "utf8");
for (const match of app.matchAll(/\b(?:import|fetch)\(['"]([^'"]+)['"]/g))
  verifyUrl(match[1], "app.js");
console.log(
  `Pages artifact verified: ${pageFiles.length} HTML pages at ${site.href}`,
);
