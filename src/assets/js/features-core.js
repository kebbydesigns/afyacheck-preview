// Normalise local search terms without interpreting user input as markup or patterns.
export const normalise = (value) =>
  String(value)
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

// Require every term, then rank title matches ahead of body-only matches.
export function searchPages(pages, query) {
  const terms = [...new Set(normalise(query).split(" ").filter(Boolean))];
  if (!terms.length) return [];
  return pages
    .map((page) => {
      const title = normalise(page.title);
      const description = normalise(page.description);
      const keywords = normalise(page.keywords || "");
      const text = `${title} ${description} ${keywords} ${normalise(page.text)}`;
      if (!terms.every((term) => text.includes(term))) return null;
      return {
        page,
        score: terms.reduce(
          (score, term) =>
            score +
            (title.includes(term) ? 10 : 0) +
            (description.includes(term) ? 3 : 0) +
            (keywords.includes(term) ? 5 : 0),
          0,
        ),
      };
    })
    .filter(Boolean)
    .sort(
      (a, b) => b.score - a.score || a.page.title.localeCompare(b.page.title),
    )
    .map(({ page }) => page);
}

// Apply independent dashboard filters without changing the source demo records.
export function filterImpact(records, filters) {
  return records.filter((record) =>
    ["year", "region", "topic"].every(
      (key) => !filters[key] || String(record[key]) === String(filters[key]),
    ),
  );
}

// Quote CSV fields and neutralise values that spreadsheet apps could treat as formulas.
export function impactCSV(records) {
  const keys = [
    "year",
    "region",
    "topic",
    "screened",
    "referrals",
    "workshops",
    "councilsReached",
  ];
  const cell = (value) => {
    const text = String(value);
    return `"${(/^[=+@\-\t\r]/.test(text) ? "'" + text : text).replaceAll('"', '""')}"`;
  };
  return (
    "\uFEFF" +
    [
      keys.join(","),
      ...records.map((record) =>
        keys.map((key) => cell(record[key])).join(","),
      ),
    ].join("\r\n")
  );
}
