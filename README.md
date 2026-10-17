# AfyaCheck Prototype

## Public GitHub Pages preview

Preview: https://kebbydesigns.github.io/afyacheck-preview/

Source: https://github.com/kebbydesigns/afyacheck-preview

Pushing to `main` runs `.github/workflows/pages.yml`: install locked dependencies,
build, run all seven checks, prepare and verify `_pages`, then publish it.
The separate Pages artifact prefixes links, image sources, search results and
JavaScript imports with the repository path. Local `npm start` behaviour and
canonical content records remain unchanged. `PAGES_URL` controls the published
base URL; `SITE_URL` supplies its origin during the build.

To publish changes from this folder:

```powershell
git add .
git commit -m "Update prototype preview"
git push
```

The reference ZIP, review captures, generated folders and local environment files
are excluded from Git. Forms and statistics remain demos; Laravel is separate.

A multi-page website prototype built with Eleventy, Nunjucks, Alpine.js and Bootstrap (custom Sass theme).

## First time on this computer

1. Install Node.js (the LTS version) from https://nodejs.org
2. Open this folder in VS Code (File → Open Folder…)
3. Open a terminal (Terminal → New Terminal) and run:

```bash
npm install
```

## Preview while you work

```bash
npm start
```

Open http://localhost:8080 in your browser. The page refreshes every time you save a file.
Press Ctrl + C in the terminal to stop.

## Build the finished site

```bash
npm run build
```

The finished website is written to the `_site` folder.

## Where to change things

| To change…                        | Edit…                                                           |
| --------------------------------- | --------------------------------------------------------------- |
| Colours, fonts, corners           | `src/assets/css/_variables.scss`                                |
| Bootstrap theme mapping           | `src/assets/css/_maps.scss`                                     |
| Your own extra CSS                | `src/assets/css/_custom.scss`                                   |
| Site name, email                  | `src/_data/site.json`                                           |
| Menu links                        | `src/_data/header.json`                                         |
| About and demo reporting data     | `src/_data/about.json`                                          |
| Page wrapper (head, scripts)      | `src/_includes/layouts/base.njk`                                |
| Navbar / footer                   | `src/_includes/partials/`                                       |
| Alpine components                 | `src/assets/js/app.js`                                          |
| Homepage                          | `src/pages/index.njk` and `src/_data/home.json`                 |
| Service information               | `src/_data/services.json`                                       |
| Service directory/detail views    | `src/pages/services/index.njk` and `show.njk`                   |
| Media & Resources content         | `src/_data/mediaResources.json`                                 |
| Media directory/detail views      | `src/pages/media-and-resources/<type>/index.njk` and `show.njk` |
| Programmes, projects, focus areas | `src/_data/whatWeDo.json`                                       |
| Campaigns and registration        | `src/_data/campaigns.json`                                      |
| Participation pathways            | `src/_data/getInvolved.json`                                    |
| Contact content                   | `src/_data/contact.json`                                        |
| Draft policies                    | `src/_data/policies.json`                                       |
| Search, recovery and style guide  | `src/_data/supportingPages.json`                                |
| Shared page introduction          | `src/_includes/layouts/content.njk`                             |
| Content section styles            | `src/assets/css/sections/_content.scss`                         |

## Page editing workflow

Pages live under `src/pages/`. Existing section folders are
used as the authoring structure, while explicit `permalink` values preserve
the public URLs. For example:

```text
src/pages/
  index.njk
  about-us/
    index.njk
    our-story.njk
    team.njk
    partners.njk
    impact-and-governance/
      index.njk
      dashboard.njk
      stories.njk
  services/
    index.njk
    show.njk
  campaigns-and-events/
    index.njk
    show.njk
    past.njk
    register.njk
  contact-us/
  get-involved/
    index.njk
    show.njk
  media-and-resources/
  what-we-do/
    index.njk
    focus-areas.njk
    programs/
      index.njk
      show.njk
    projects/
      index.njk
      show.njk
  supporting-pages/
    show.njk
    search.njk
    style-guide.njk
    404.njk
```

Edit copy and records in the section's JSON file. Open its `.njk` view to change
section markup and order. Each view identifies its dataset through `dataSource`
(or `mediaSource`), and computes titles, descriptions, actions and form modes from
that content. Shared detail views paginate one record per public URL and include
every generated page in search. Dedicated views remain for distinct layouts,
including the homepage, About pages, contact, reporting, search and recovery.
Cards and enquiry forms remain shared partials. `layouts/content.njk` provides
the common introduction; `layouts/base.njk` provides the document, header and footer.

For a new programme, project, campaign, participation pathway or policy, copy a
record in the corresponding `items` array, then give it a unique `slug` and `url`.
Keep the section structure expected by its shared view. Directory cards are
generated from records; optional `card` fields provide intentional shorter
marketing titles or descriptions. Campaign lists use `featuredSlug` and `status`
to select featured, remaining and past entries. Header/footer navigation remains
curated separately. For a genuinely different layout, add a dedicated view and
its JSON object. Keep SCSS nested to match its owning page block and compose
Bootstrap through `@extend`.

Services use two shared views:
`services/index.njk` renders the directory and `services/show.njk` renders every
detail URL. Edit `src/_data/services.json` for service titles, descriptions,
scope, audiences, equipment, timing, common section copy and homepage summaries.
Adding an item creates its detail page and includes it in the directory, related
cards, homepage and search. Header/footer menu entries are curated separately.
The detail view includes every generated service in Eleventy's content collection.
Retired studio service URLs live under `supporting-pages/legacy-services/`.

Media & Resources follows the same shared-view workflow. Edit
`src/_data/mediaResources.json`: `overview`, `healthLibrary`, `podcasts`,
`newsroom`, `publications` and `youthCorner` own the content. Each content type
has an `index` object and an `items` array. Add a record with a unique `slug`,
title, description, type-specific metadata and the existing section structure
to generate its detail URL, directory card, related cards and search entry.
The type's `index.njk` and `show.njk` own the section markup; keep their nested
styles in the existing content SCSS. `metadataTemplate` and `card` settings
format metadata from record fields rather than duplicating it in page copy.
Press Kit (`newsroom/press-kit.njk`) and Youth Corner (`youth-corner.njk`) retain
dedicated views backed by the same JSON. Existing public URLs are preserved.
Unavailable recordings and PDFs remain clearly labelled; this refactor supplies
no new media files. Header/footer links remain curated separately.

`about.json` owns About copy, team/partner cards and `impact.records`. The dashboard
table, filter options and CSV export all derive from those records. `whatWeDo.json`
owns the work overview, focus areas, programmes and projects. `campaigns.json` owns
campaign copy, counts, archive selection and the local registration page; homepage
campaign titles and progress use the same featured record. Homepage-specific
marketing copy and independent headline statistics remain in `home.json`.

`getInvolved.json` owns pathway content and `enquiryType`; `contact.json` owns
contact-page copy. All forms retain their local demo behaviour. Draft policies
share `supporting-pages/show.njk`, backed by `policies.items`. Utility page copy
lives in `supportingPages.json`; retired starter URLs use a shared view as well.

Sections use `headings`, `paragraphs`, `lists` and optional `attributes` fields in
the order used by their view. Named programme/campaign fields hold reusable facts.
Cross-section cards use `source` and optional `slug` references, resolved by
`partials/section-cards.njk`; supply title/text overrides only for intentional
marketing wording. The old duplicate `catalog.json` has been removed.

## Phase 1: shared styling

Review the foundation at `/style-guide/` while the preview server is running.
The homepage is implemented in Phase 4; remaining content routes are implemented in Phase 5.

- Colours retain reference cyan, lime, charcoal and pale grey. Text links use the configured base cyan; Bootstrap generates link hover colours and button variant states natively.
- Plus Jakarta Sans is the body font, Outfit is the heading font, and JetBrains Mono is available with `.font-mono`. Google Fonts requires a connection; system fallbacks are provided.
- Bootstrap variables define a 16px body, 1280px maximum container, rounded controls and bordered white cards. Bootstrap responsive utilities are composed in SCSS.
- Compose `.section-space` and `.content-width` through `@extend` in section SCSS for responsive 48–96px padding and a 65-character reading measure. Use `.eyebrow` for section labels.
- Use `.card-hover` for linked cards: hover and focus-within share a visible border treatment. Buttons size naturally from padding and line-height; single-line inputs have a minimum 44px height.
- Keyboard focus uses a visible outline. Reduced-motion preferences disable decorative transitions.

Authoring follows [AGENTS.md](AGENTS.md): use descriptive template classes and
nested section/component SCSS. Apply Bootstrap layout, spacing and typography
through `@extend`; use custom declarations for requirements Bootstrap does not
cover. Bootstrap component and JavaScript state classes remain in markup.
Run `node scripts/check-template-styles.mjs` after a build to guard this convention.

Colour values are owned by `src/assets/css/_variables.scss`. Section and
component styles reference those existing values; do not introduce extra shades.
The style guide displays the Bootstrap variable names rather than duplicating
hex values. Run `node scripts/check-theme-colors.mjs` to check authored sources.

The style guide includes button, card and form states; its controls are visual samples.
The supplied logo is unchanged. This workspace contains only the Eleventy prototype.

## Phase 2: header

The header now has a dismissible demo campaign notice, email and utility controls,
dropdown navigation, a mobile menu and a single Get involved action. Only the
navigation tier stays pinned as the announcement and utilities scroll away.
The logo is preserved; the existing prototype email remains in use.

Navigation content lives in `src/_data/header.json`. Set a child entry's
`available` flag only after its route exists. Future sections display
“Coming soon” without dead links. Phase 5 enables the content destinations;
Get involved opens its hub and the announcement links to the demo campaign.
Phase 6 enables site search and English/Kiswahili navigation labels.

Bootstrap handles dropdowns and the mobile offcanvas panel. Below the existing
1200px expansion breakpoint, navigation slides in from the right with a backdrop,
close button, focus trap and page scroll lock. The same links and CTA remain in
the inline desktop navbar. Panel header/body styles follow the markup hierarchy
inside `_header.scss`; no presentation utilities are added to the template.
The first Escape closes an open submenu; the next closes the panel and returns
focus to its trigger. Backdrop clicks, destination links and breakpoint changes
also dismiss the panel. Theme switching uses the existing Alpine component.

After a build, run `node scripts/check-header.mjs` to check header destinations,
active states, disclosure references and the skip link in all generated pages.
Browser interaction and responsive visual checks are still required.

## Phase 3: footer

The shared footer includes the preserved logo, mission, newsletter demo, four
navigation groups, contact details, an inline medical notice and a legal strip.
Its grid scales from two navigation columns to five columns including Contact.
The fixed dark palette remains readable in both page themes.

Footer content and planned destinations live in `src/_data/footer.json`.
Only entries with `available: true` become links; other entries are labelled
“Coming soon”. The legal strip now links to the full medical disclaimer;
the inline medical notice remains an anchor destination for the homepage.
The email uses `site.email`, consistent with the current prototype contact page.
Reference phone numbers, office addresses and accreditation claims have not
been added while their reconciliation remains pending.

The newsletter uses native required/email validation and an Alpine local
demonstration. Its confirmation explicitly states that no subscription is
created; it clears the entered email and makes no network or storage calls.
Controls remain disabled without JavaScript. The user chose to keep local demos
in Phase 6; no subscription or enquiry service is connected.

Use `node scripts/check-footer.mjs` after building to verify footer routes,
anchors, labels, list markup and the newsletter demo's submission guard and state.
The explicit `$event.preventDefault()` handler avoids this project's Nunjucks
formatter splitting Alpine's dotted event modifiers.

Footer browser checks passed at 1440px, 390px and 320px without horizontal
overflow. Required and invalid email validation, local demo confirmation,
email clearing, unchanged submission URL, medical-notice anchor focus and
the fixed footer palette in both page themes were verified. Review captures
are saved in `artifacts/phase-3-footer-desktop.jpg` and
`artifacts/phase-3-footer-mobile.jpg`.

## Phase 4: homepage

The homepage adapts the reference sequence: split hero, four demo impact figures,
featured caravan with accessible progress, eight service cards, school/youth
spotlight, six illustrative partner tiles and a clinical-notice banner.
Content lives in `src/pages/index.njk` and `src/_data/home.json`; scoped styling lives
in `src/assets/css/sections/_home.scss`.

Reference images were resized and JPEG-compressed into local 640px and
1200/1280px variants in `src/assets/images/home/`. Responsive source sets,
explicit dimensions, a prioritised hero and lazy-loaded lower images keep
asset loading appropriate to each screen.

Impact figures, campaign dates/progress, programme figures and partner names
are explicitly illustrative demo content. Enquiry CTAs lead to Contact, the
service CTA jumps to the eight homepage cards, and the clinical notice links
to the footer notice. Phase 5 connects the dashboard, service profiles,
campaign and youth links to their dedicated routes.

Run `node scripts/check-home.mjs` after building to verify the homepage
structure, CTA destinations, local image variants and accessible progress.

Homepage browser checks passed at 1440px, 768px, 390px and 320px with no
horizontal overflow. Local image loading, service/medical anchor focus,
the primary Contact CTA and light/dark rendering were verified.
Review captures are saved as `artifacts/phase-4-home-desktop.jpg`,
`artifacts/phase-4-home-mobile.jpg` and `artifacts/phase-4-home-full.jpg`.

## Phase 5: remaining content pages

The prototype builds 62 content routes covering About, eight clinical services,
focus areas, programmes, projects, campaigns, resources, involvement, Contact
and five draft policies. Three retired studio URLs point visitors to the clinical
directory. The homepage and style guide remain separate, for 67 pages in total.

Edit page copy and section order in each page's `.njk` file under `src/pages/`.
The original central page factory has been removed. The shared introduction lives
in `src/_includes/layouts/content.njk`; cards and enquiries have their own partials.
`src/assets/css/sections/_content.scss` mirrors their HTML hierarchy and composes
Bootstrap with `@extend`. All colours continue to come from the existing theme.

Reference figures, names, affiliations and schedules are labelled as illustrative.
Resource pages present the supplied summaries; unavailable audio and report PDFs
are stated explicitly. Policy pages are draft templates for review.

Enquiry and registration forms use native validation and a local Alpine demo.
Controls stay disabled until Alpine starts. Valid completion clears the fields;
no requests, persistent records, appointments, reminders or payments are created.
Do not use personal or patient information while testing.

After `npm run build`, run all six checks in `scripts/check-*.mjs`. The content
check verifies the route graph, headings, local assets and actual demo form guard.
Phase 6 adds search, language navigation, reporting interactions, metadata and
broader accessibility/performance checks. External services remain disconnected
at the user's request.

Phase 5 browser checks covered desktop and 390/320px layouts, contained table
scrolling, required-field validation, local contact/registration completion and
cleared entries, unchanged submission URLs and light/dark presentation. A review
capture is saved at `artifacts/phase-5-about-desktop.jpg`.

## Phase 6: supporting functionality and QA

Search lives at `/search/`. Its local JSON index is generated from the same
rendered content as the pages by `src/pages/supporting-pages/search-index.11ty.js`.
It supports multiple terms,
title-based ranking, Kiswahili navigation keywords, query-string links, empty
results and loading recovery. Results use text bindings rather than HTML
insertion. With JavaScript disabled, directory links remain available.

The header and footer navigation can switch between English and Kiswahili.
Edit labels in `src/_data/navigationTranslations.json`; the shared navigation
macro preserves English fallback text. `src/assets/js/navigation.js` stores only
the navigation-language preference. Page content remains English, and
translated spans carry the appropriate language.
Full editorial translations are outside this navigation implementation.

The impact dashboard filters reference records by year, region and focus area.
It shows matching totals, an empty state, reset and filtered CSV download.
`src/_includes/partials/impact-controls.njk` owns the control markup; its nested
styles live inside the content container in `_content.scss`. Search has its own
`_search.scss`, following the same container/block/element hierarchy. Both use
Bootstrap through `@extend` and existing colour variables.

Search and reporting helpers are in `src/assets/js/features-core.js`; Alpine
components are in `app.js`. The static table remains available without
JavaScript. CSV fields are quoted and formula-like values are neutralised.
All exports remain explicitly illustrative demo data.

Every page has canonical and share metadata. `SITE_URL` can override the preview
origin used by `src/_data/deployment.js`; the default is localhost:8080. Robots
directives prevent prototype indexing. `/404.html` offers recovery links; the
hosting server must use it for unknown paths. Logo dimensions reserve the correct
aspect ratio, and the unused external icon stylesheet has been removed.

Enquiries, registration and newsletter remain local demos as requested. They do
not send or persist entries, make bookings, send reminders or process payments.
Theme and navigation preferences are the only stored application settings.

Run `npm run build` followed by `npm run check`. Seven checks cover routes,
semantic templates, colour ownership, form guards, search ranking, filtering,
CSV escaping, labels, image dimensions, metadata and ARIA references. These
checks do not constitute a full WCAG audit or verification of clinical content.

Browser checks covered ranked and empty searches, query URLs, keyboard skip
navigation, persistent language choices, combined dashboard filters, empty-state
recovery and a downloaded CSV containing exactly the selected record. Search and
reporting layouts were checked at desktop and 390/320px widths, with table scroll
contained on mobile. Shared form controls now pair their text and surface colours
in dark mode. Review images are saved as `artifacts/phase-6-dashboard-desktop.jpg`
and `artifacts/phase-6-search-mobile.jpg`.
