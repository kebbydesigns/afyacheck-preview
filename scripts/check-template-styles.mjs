import assert from "node:assert/strict";
import fs from "node:fs";
import { parseDocument } from "htmlparser2";
import { findAll } from "domutils";

// Component and state classes remain valid; presentation utilities belong in Sass.
const utility =
  /^(?:container(?:-fluid|-(?:sm|md|lg|xl|xxl))?|row(?:-cols-.+)?|col(?:-.+)?|g[xy]?-.+|[mp][trblxyse]?-(?:n?[0-5]|auto)|d-(?:none|block|inline|inline-block|flex|inline-flex|grid|table)(?:-.+)?|d-(?:sm|md|lg|xl|xxl)-.+|flex-.+|align-(?:items|self|content)-.+|justify-content-.+|gap-.+|text-.+|fw-.+|fs-.+|font-monospace|display-[1-6]|h[1-6]|small|lead|(?:min-|max-)?[wh]-.+|overflow-.+|position-.+|rounded(?:-.+)?|border(?:-.+)?|bg-.+|visually-hidden(?:-.+)?|stretched-link)$/;
const pages = fs
  .readdirSync("_site", { recursive: true })
  .filter((file) => file.endsWith(".html"));
assert.ok(
  pages.length,
  "Build the prototype before checking template classes.",
);
const violations = [];
// Recognise Bootstrap utilities without rejecting semantic names such as text-copyright.
const textUtility =
  /^text-(?:(?:(?:sm|md|lg|xl|xxl)-)?(?:start|end|center)|wrap|nowrap|break|reset|muted|lowercase|uppercase|capitalize|decoration-(?:none|underline|line-through)|opacity-(?:25|50|75|100)|(?:primary|secondary|success|danger|warning|info|light|dark)(?:-emphasis)?|body(?:-secondary|-tertiary|-emphasis)?|black|white|black-50|white-50)$/;
for (const page of pages) {
  const document = parseDocument(fs.readFileSync("_site/" + page, "utf8"));
  const elements = findAll((node) => Boolean(node.attribs), document.children);
  for (const element of elements) {
    for (const name of (element.attribs.class || "")
      .split(/\s+/)
      .filter(Boolean)) {
      if (name.startsWith("text-") && !textUtility.test(name)) continue;
      if (utility.test(name)) violations.push(`${page}: ${name}`);
    }
    if ("style" in element.attribs) violations.push(`${page}: inline style`);
  }
}
assert.deepEqual(
  violations,
  [],
  "Move template presentation utilities into the owning SCSS block.",
);
console.log(
  `Semantic template classes pass on ${pages.length} pages; Bootstrap presentation utilities stay in SCSS.`,
);
