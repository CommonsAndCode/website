# Commons & Code Website - AI Agent Instructions

## Project Overview

Hugo-based multilingual (German/English) website for Commons & Code e.V., a European think-and-do-tank for digitalization for the common good.
Built with the Blowfish theme.

## Architecture & Structure

### Multi-language Setup

- **Languages**: German (default, `de/`) and English (`en/`)
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
└── {mitglied-werden,become-a-member}.md  # Membership form pages
```

### Configuration Layers

- `config/_default/hugo.toml` - Core Hugo settings, uses Blowfish theme
- `config/_default/params.toml` - Blowfish theme parameters (color scheme: `38c0c0`)
- `config/_default/languages.*.toml` - Per-language metadata
- Root `hugo.toml` is minimal; actual config is in `config/_default/`

### Custom Components

#### Shortcodes (`layouts/shortcodes/`)

- `membership-form.html` - Complex interactive membership application form with:
  - Dynamic field validation via `assets/js/membership-form.js`
  - Conditional field requirements (SEPA, underage guardian fields)
  - Posts to `https://cc.janpeterkoenig.com/api/v1/form-input`
  - Styled via `assets/css/custom.css` with `.membership-form` namespace
- `author.html` - Delegates to theme's author partial
- `download.html` - Styled download button using Blowfish color classes

Usage in content: `{{< membership-form >}}`

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
- ⚠️ **German gender-neutral language**: Use `*` (Genderstern) for gender-inclusive forms (e.g., `Mitarbeiter*in`, `Antragsteller*in`), not `:`
