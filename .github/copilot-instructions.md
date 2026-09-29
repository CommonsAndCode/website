# Commons & Code Website - AI Agent Instructions

## Project Overview

Hugo-based multilingual (German/English) website for Commons & Code e.V., a European think-and-do-tank for digitalization for the common good.
Built with the Blowfish theme.

## Language Conventions

- **English content**: Use British English spelling and conventions (e.g., "organisation" not "organization", "realise" not "realize", "colour" not "color")
- **German content**: Use German gender-neutral language with `*` (Genderstern) for inclusive forms (e.g., `Mitarbeiter*in`, `Antragsteller*in`), not `:`

## Markdown Conventions

- **Numbered lists**: Use `1.` for all items rather than incrementing numbers (e.g., `1., 1., 1.` not `1., 2., 3.`). This makes reordering and editing lists easier while Markdown automatically renders them with sequential numbers.

## Architecture & Structure

### Multi-language Setup

- **Languages**: English (default, `en/`) and German (`de/`) - see `config/_default/hugo.toml`
- Content structure: `content/{de,en}/` with mirrored page hierarchies
- Configuration: `config/_default/languages.{de,en}.toml` for language-specific settings
- Menus: `config/_default/menus.{de,en}.toml` - menu items must be duplicated per language
- Translations: `i18n/{de,en}.toml` for UI strings
- **Critical**: Use `translationKey` in frontmatter to link equivalent pages across languages

### Content Organization
```
content/{de,en}/
├── _index.md              # Homepage
├── blog/                  # Blog posts (currently empty, uses .keep)
├── {ueber-uns,about-us}/  # About pages (language-specific slugs)
├── {mitglied-werden,become-a-member}.md  # Membership form pages
└── projekte/
    └── smart-city-fragebogen/
        ├── _index.md / smart-city-fragebogen.md  # Main Self-Assessment landing page
        └── fragenkatalog.md                      # Static catalogue and downloads
```

### Configuration Layers

- `config/_default/hugo.toml` - Core Hugo settings, uses Blowfish theme
- `config/_default/params.toml` - Blowfish theme parameters (color scheme: `38c0c0`)
- `config/_default/languages.*.toml` - Per-language metadata
- Root `hugo.toml` is minimal; actual config is in `config/_default/`

### Custom Components

#### Shortcodes (`layouts/shortcodes/`)

- `smart-city-form.html` - Interactive 88-question municipal digital maturity self-assessment with step navigation, collapsible category overview, skip-to-submit, and localStorage autosave.
- `smart-city-questionnaire.html` - Full static catalogue displaying all 88 questions grouped by department with search and copy buttons.
- `membership-form.html` - Complex interactive membership application form with:
  - Dynamic field validation via `assets/js/membership-form.js`
  - Conditional field requirements (SEPA, underage guardian fields)
  - Posts to `https://cc.janpeterkoenig.com/api/v1/form-input`
  - Styled via `assets/css/custom.css` with `.membership-form` namespace
- `author.html` - Delegates to theme's author partial
- `download.html` - Styled download button using Blowfish color classes

Usage in content: `{{< smart-city-form >}}`, `{{< smart-city-questionnaire >}}`, `{{< membership-form >}}`

#### Partials (`layouts/partials/`)

Override theme defaults for specific customizations:

- `article-meta/basic.html` - Custom article metadata display
- `header/*.html` - Simplified header variants

### Author System

- Author data: `data/authors/*.json` with name/bio
- Frontmatter: `authors: ["authorkey"]` references JSON filename
- Used via `authors` taxonomy in `config/_default/hugo.toml`

## Development Workflows

### Local Development
```bash
hugo server -D                    # Start dev server with drafts
hugo server --disableFastRender  # Full rebuild on changes
```

### Build & Deploy
```bash
hugo                              # Build to public/
```
- Deployed to `beta.commons-and-code.eu` (see `CNAME`)
- Static output in `public/` directory

### Content Creation

#### New Page (Bilingual)
1. Create German: `content/de/path/page.md`
2. Create English: `content/en/path/page.md`
3. Add matching `translationKey: "unique-key"` to both frontmatter
4. Update both menu files if navigation entry needed

#### Menu Items
Add to both `menus.{de,en}.toml`:
```toml
[[main]]
name = "Display Name"
pageRef = "relative/path"     # Without language prefix
identifier = "unique-id"
parent = "parent-id"          # Optional for submenus
weight = 10                   # Order (lower = earlier)
```

For styled CTA buttons (like "Mitglied werden"):
```toml
[main.params]
class = "!rounded-md bg-primary-600 px-4 py-2 !text-neutral !no-underline hover:!bg-primary-500 dark:bg-primary-800 dark:hover:!bg-primary-700"
```

## Project-Specific Patterns

### CSS Conventions

- Theme uses Tailwind utility classes with `!` prefix for important overrides
- Custom styles in `assets/css/custom.css` use BEM-like namespacing (`.membership-form fieldset`)
- Color scheme: Primary color `38c0c0` (teal/cyan) configured in `params.toml`
- **Avoid `!important`**: Only use `!important` when absolutely necessary to override existing styles that cannot be overridden through specificity or cascade order. Prefer more specific selectors or proper cascade ordering instead.

### JavaScript Patterns

- Vanilla JS, no framework (`membership-form.js`)
- Form validation: Manual `validateForm()` function, not HTML5 validation (`novalidate` on form)
- Dynamic field state management via event listeners (`change`, `input`)
- Field enabling/disabling based on user selections (e.g., SEPA fields only for direct debit)

### Form Integration

- Production endpoint: `https://cc.janpeterkoenig.com/api/v1/form-input`
- Local endpoint (commented): `http://localhost:3000/api/v1/form-input`
- Posts JSON payload from FormData
- Shows inline error messages, success banner on completion

### Frontmatter Conventions

Key fields for pages:

- `translationKey` - Link translations (required for multi-language)
- `authors` - Array of author keys from `data/authors/`
- `showAuthor`, `showDate`, `showReadingTime`, `showTableOfContents` - Control page display

## Smart City Self-Assessment & Questionnaire

For comprehensive architectural documentation, see [`docs/smart-city-questionnaire.md`](../docs/smart-city-questionnaire.md).

### Key Architecture & Files
- **Data Source**: `data/smart-city-questions.json` (7 municipal departments, 88 questions).
- **Interactive Stepper Shortcode**: `layouts/shortcodes/smart-city-form.html`
  - Slide 0: Metadata (`wom_kommune`, `wom_bundesland`, etc.) with native HTML5 validation.
  - Slides 1–88: Single-choice (levels 0–4 with auto-advance) and multi-choice questions.
  - Slide 89: Review summary and prominent optional notes field (`#wom_anmerkungen`).
  - Stepper Header: Department title, `.sc-stepper-dot` (symmetrically padded separator), question counter, `[ ☰ Fragenübersicht ]`, `[ ↺ ]` reload button, `[ 💾 ]` permanent autosave indicator with `.is-saving` pulse animation.
  - Collapsible Overview Panel: `<details id="sc-wom-overview-details">` containing nested `<details class="sc-overview-category">` accordions with dynamic per-category status badges (`X von Y beantwortet`), auto-expansion on filter match and active question, and a compact corner `✕` close button.
  - Skip Navigation: `.sc-wom-btn-skip-summary` allows skipping directly to the final submission slide.
- **Static Catalogue Shortcode**: `layouts/shortcodes/smart-city-questionnaire.html`
  - Read-only catalogue of all 88 questions with search, copy buttons, and Excel download.
- **Pages**:
  - Main landing page: `content/{de,en}/projekte/smart-city-fragebogen.md`
  - Catalogue page: `content/{de,en}/projekte/smart-city-fragebogen/fragenkatalog.md`
- **Submission Endpoint**: `https://cc.janpeterkoenig.com/api/v1/smart-city-input`
- **LocalStorage State**: Key `sc_survey_draft_v2` automatically restores draft responses on reload.

### Crucial Implementation Gotchas
- ⚠️ **Blowfish Precompiled CSS**: Blowfish uses a precompiled Tailwind stylesheet (`themes/blowfish/assets/css/compiled/main.css`). Dynamic utility classes (e.g. `gap-1.5`, `w-3.5`, `h-3.5`, `opacity-50`) do **NOT** exist in the bundle. Any custom dimensions, SVG sizes, and flex spacing must be explicitly declared in `assets/css/custom.css`.
- ⚠️ **Hugo JSON Numbers**: When loaded via `getJSON` or `$.Site.Data`, Hugo parses JSON numbers as `float64`. Always cast numbers with `(int ...)` in Go templates (e.g., `printf (i18n "...") (int $totalQuestions)`) to avoid `%!d(float64=...)` errors.
- ⚠️ **String Formatting in JS**: Client-side `formatString` must safely unescape `%%` to `%` to prevent double percent signs like `(9%%)` in formatted summary statistics.
- ⚠️ **Overview Panel Fonts**: The overview panel must enforce `font-family: var(--default-font-family) !important` (*Raleway*) to avoid inheriting the headline font (*Share Tech*) from global `[class*="header"]` rules.
- ⚠️ **Vanilla HTML & Accessibility**: Prefer native HTML `<details>`/`<summary>` and `reportValidity()` over heavy JS or alert dialogs.

## Theme Integration

- Using Blowfish theme from `themes/blowfish/`
- Override theme behavior by creating same-path files in `layouts/`
- Theme documentation: https://blowfish.page/
- Custom shortcodes added to project take precedence over theme defaults

## Critical Notes

- ⚠️ Always maintain German/English content parity
- ⚠️ Menu identifiers must match across language files for proper translation switching
- ⚠️ Assets in `assets/` are processed; static files go in `static/`
- ⚠️ The `public/` directory is generated; never edit directly
