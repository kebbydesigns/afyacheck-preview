import { parseDocument } from "htmlparser2";
import { textContent } from "domutils";
import translations from "../../_data/navigationTranslations.json" with { type: "json" };
import header from "../../_data/header.json" with { type: "json" };
import footer from "../../_data/footer.json" with { type: "json" };
import home from "../../_data/home.json" with { type: "json" };
import services from "../../_data/services.json" with { type: "json" };
import site from "../../_data/site.json" with { type: "json" };

// Match translated labels by destination, including labels that differ from page titles.
const navigation = [
  ...header.navigation.flatMap((item) => item.items || [item]),
  ...footer.columns.flatMap((column) => column.items),
  ...footer.legal,
];

// Build the local search index from the same page content used by Eleventy.
export default class SearchIndex {
  data() {
    return {
      permalink: "/search-index.json",
      eleventyExcludeFromCollections: true,
      eleventyImport: { collections: ["contentPage"] },
    };
  }
  render(data) {
    const content = data.collections.contentPage.map((page) => ({
      url: page.url,
      title: page.data.title,
      description: page.data.description,
      text: textContent(parseDocument(page.templateContent))
        .replace(/\s+/g, " ")
        .trim(),
      keywords: navigation
        .filter((item) => item.url === page.url)
        .map((item) => `${item.label} ${translations[item.label] || ""}`)
        .join(" "),
    }));
    return JSON.stringify([
      {
        url: "/",
        title: "AfyaCheck · Home",
        description: site.description,
        text: [
          home.campaign.title,
          ...services.items.map(
            (service) => `${service.title} ${service.description}`,
          ),
        ].join(" "),
        keywords: "Mwanzo community health Tanzania",
      },
      ...content,
    ]);
  }
}
