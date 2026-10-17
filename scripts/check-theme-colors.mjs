import assert from "node:assert/strict";
import fs from "node:fs";

// Check authored sources; generated Bootstrap CSS and image assets retain their own encoding.
const files = fs
  .readdirSync("src", { recursive: true })
  .filter((file) => /\.(scss|njk|json|js)$/.test(file))
  .map((file) => "src/" + file.replaceAll("\\", "/"));
const violations = [];
for (const file of files) {
  if (file === "src/assets/css/_variables.scss") continue;
  const source = fs.readFileSync(file, "utf8");
  for (const [index, line] of source.split(/\r?\n/).entries()) {
    if (
      /#[\da-f]{3,8}\b/i.test(line) ||
      /\b(?:rgba?|hsla?)\(\s*[\d.]/i.test(line) ||
      /(?:^|[;{])\s*(?:color|background(?:-color)?|border(?:-color)?|outline-color)\s*:\s*(?:white|black|gray|grey|red|green|blue|yellow|orange|purple|transparent)\s*(?:[;!]|$)/i.test(
        line,
      )
    )
      violations.push(`${file}:${index + 1}: ${line.trim()}`);
  }
}
assert.deepEqual(
  violations,
  [],
  "Use existing theme variables instead of hardcoded colours.",
);
console.log(
  "Authored colour values come from theme variables; no hardcoded colours outside _variables.scss.",
);
