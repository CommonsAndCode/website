# Smart City Self-Assessment & Questionnaire Architecture

This document provides a comprehensive technical overview and reference for the Smart City Self-Assessment tool and question catalogue on the Commons & Code website.

---

## 1. Overview & Purpose

The Smart City Questionnaire is a digital maturity assessment for German municipalities. It covers **88 questions across 7 municipal departments** (Fachbereiche).

- **Primary Persona & Flow**: Conceived as an accessible **Self-Assessment** for municipal staff, elected officials (councillors), faction members, and engaged citizens.
- **Main Landing Page**: `/projekte/smart-city-fragebogen/` (`content/{de,en}/projekte/smart-city-fragebogen.md`) hosts the interactive stepper form (`smart-city-form`).
- **Static Catalogue & Downloads**: `/projekte/smart-city-fragebogen/fragenkatalog/` (`content/{de,en}/projekte/smart-city-fragebogen/fragenkatalog.md`) displays the full static list of questions with copy buttons and an `.xlsx` download link.

---

## 2. File Architecture

| File Path | Description |
|---|---|
| `data/smart-city-questions.json` | Master questionnaire data (7 categories, 88 questions). |
| `layouts/shortcodes/smart-city-form.html` | Interactive stepper form shortcode with in-page overview and autosave. |
| `layouts/shortcodes/smart-city-questionnaire.html` | Static reference list shortcode with search and copy functions. |
| `content/de/projekte/smart-city-fragebogen.md` | Primary German landing page embedding `{{< smart-city-form >}}`. |
| `content/de/projekte/smart-city-fragebogen/fragenkatalog.md` | German catalogue page embedding `{{< smart-city-questionnaire >}}`. |
| `i18n/de.toml` & `i18n/en.toml` | UI strings namespaced under `smart_city.*`. |
| `assets/css/custom.css` | Component styles (`.sc-stepper-*`, `.sc-overview-*`, `.sc-autosave-*`). |

---

## 3. Data Schema (`data/smart-city-questions.json`)

The questionnaire is defined hierarchically:

```json
{
  "categories": [
    {
      "name": "Verwaltung",
      "questions": [
        {
          "number": 1,
          "question": "Gibt es eine kommunale Digitalisierungsstrategie?",
          "type": "single",
          "levels": [
            { "level": 0, "description": "Keine Strategie vorhanden." },
            { "level": 1, "description": "Strategie in Planung..." },
            { "level": 2, "description": "Beschlossene Strategie..." },
            { "level": 3, "description": "Regelmäßige Überprüfung..." },
            { "level": 4, "description": "Vollständig umgesetzt und öffentlich..." }
          ],
          "examples": ["Beispiel: Digitalstrategie 2030"]
        }
      ]
    }
  ]
}
```

### Important Hugo JSON Gotcha:
When Hugo loads JSON via `$.Site.Data` or `getJSON`, integer numbers are deserialized as `float64`.
- **Always cast numbers to integer in templates**: `(printf (i18n "smart_city.overview_desc") (int $totalQuestions) (int $totalCategories))`
- Failing to do so causes Go template evaluation errors like `%!d(float64=88)`.

---

## 4. Shortcode Implementations

### A. `smart-city-form.html` (Interactive Stepper)

1. **Slide Structure**:
   - **Slide 0**: Municipality metadata (Name `*`, State `*`, Population, Role, Contact Email).
   - **Slides 1–88**: Individual question cards. Auto-advances to the next question when a radio button (levels 0–4) is selected.
   - **Slide 89**: Final review and submit slide. Displays municipality details, answered count, and a prominent optional notes textarea (`wom_anmerkungen`).

2. **Stepper Bar (`.sc-stepper-bar`)**:
   - Left: Department name + `.sc-stepper-dot` (symmetrically padded separator) + question counter (`Frage X von Y`).
   - Right: `[ ☰ Fragenübersicht ]`, `[ ↺ ]` (Reload button), `[ 💾 ]` (Autosave indicator).
   - Progress Bar: Thin progress bar below stepper (`#sc-wom-progressbar-fill`).

3. **In-Page Overview Panel (`#sc-wom-overview-details`)**:
   - Native `<details>` accordion panel.
   - Corner close button (`#sc-wom-btn-close-overview`) with SVG `✕`.
   - Real-time search/filter input (`#sc-overview-filter`).
   - Categories rendered as nested `<details class="sc-overview-category">` elements. Each displays a status badge (`X von Y beantwortet`), which highlights on progress (`.answered`) and turns green on completion (`.completed`).
   - Automatically expands the active question's category when opened, and expands matching categories upon typing in the search box.

4. **Skip to Submit**:
   - Subtle `.sc-wom-btn-skip-summary` buttons in the footer of question slides allow users to jump straight to the submission slide.
   - Validates required fields on Slide 0 using native `reportValidity()`.

5. **LocalStorage & Autosave**:
   - Key: `sc_survey_draft_v2`.
   - Stores current slide, input values, radio choices, and checkbox states.
   - Automatically restores state on page load.
   - Autosave indicator pulses with `.is-saving` (CSS scale/opacity transition) upon each change.

6. **Form Submission**:
   - Default POST action: `https://cc.janpeterkoenig.com/api/v1/smart-city-input` (overridable via shortcode parameter `action`).

---

## 5. Styling & Blowfish CSS Precompilation Caveat

> [!WARNING]
> **Blowfish Precompiled CSS**: The Blowfish theme uses a fixed, precompiled Tailwind CSS bundle (`themes/blowfish/assets/css/compiled/main.css`). Arbitrary Tailwind utility classes (e.g., `gap-1.5`, `w-3.5`, `h-3.5`, `opacity-50`) do **NOT** exist in this stylesheet and will silently fail.

- All component dimensions, SVG sizes, flex gaps, and component states must be explicitly declared in `assets/css/custom.css`.
- **Key classes in `assets/css/custom.css`**:
  - `.sc-stepper-dot`: Explicit `padding: 0 0.45rem` ensuring balanced horizontal whitespace around the separator dot.
  - `.sc-stepper-icon-btn svg`, `.sc-autosave-indicator svg`: Fixed `width: 15px !important; height: 15px !important; display: block;` to prevent inline SVGs from collapsing to 0×0.
  - `.sc-autosave-indicator`: Permanently styled with `color: rgb(var(--color-primary-600))` (dark: `var(--color-primary-400)`).
  - `.sc-overview-panel *`: Explicitly forces `font-family: var(--default-font-family) !important` (*Raleway*) to avoid inheriting the header font (*Share Tech*) from global `[class*="header"]` selectors.

---

## 6. Internationalization (i18n)

- All UI strings live under the `smart_city.*` namespace in `i18n/de.toml` and `i18n/en.toml`.
- Strings are passed to JavaScript through dataset attributes on `#sc-wom-app` (`data-text-*`).
- Helper function `formatString(template, ...args)` replaces `%d` and `%s` place-holders, and safely unescapes `%%` to `%`.

---

## 7. Development & Testing Checklist

When modifying the questionnaire:

1. **Verify Hugo compilation**:
   ```bash
   hugo --minify
   ```
2. **Check both languages**:
   - German: `http://localhost:1313/de/projekte/smart-city-fragebogen/`
   - English: `http://localhost:1313/en/projekte/smart-city-fragebogen/` (when published/translated)
3. **Commit conventions**:
   - Use English, imperative mood, without scope prefixes:
     - ✅ `Fix duplicate percent sign in survey summary`
     - ✅ `Make overview categories collapsible with status tracking`
     - ❌ `fix: smart city form`
