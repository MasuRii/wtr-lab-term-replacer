<div align="center">

# WTR Lab Term Replacer

[![Version](https://img.shields.io/github/package-json/v/MasuRii/wtr-lab-term-replacer-webpack?label=version&style=for-the-badge)](https://github.com/MasuRii/wtr-lab-term-replacer-webpack/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178c6?logo=typescript&logoColor=white&style=for-the-badge)](https://www.typescriptlang.org/)
[![Built with Webpack](https://img.shields.io/badge/Built%20with-Webpack-8DD6F9?logo=webpack&logoColor=white&style=for-the-badge)](https://webpack.js.org/)
[![Greasy Fork](https://img.shields.io/badge/Install-Greasy%20Fork-green.svg?style=for-the-badge)](https://greasyfork.org/en/scripts/552945-wtr-lab-term-replacer)
[![GitHub Issues](https://img.shields.io/github/issues/MasuRii/wtr-lab-term-replacer-webpack?style=for-the-badge)](https://github.com/MasuRii/wtr-lab-term-replacer-webpack/issues)
[![GitHub Stars](https://img.shields.io/github/stars/MasuRii/wtr-lab-term-replacer-webpack?style=for-the-badge)](https://github.com/MasuRii/wtr-lab-term-replacer-webpack/stargazers)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/Y8Y01PSSVR)

A userscript that replaces terms on WTR-Lab.com chapters so you can read with the names and terminology you prefer.

<img width="650" height="796" alt="Term Replacer panel" src="https://github.com/user-attachments/assets/8e7811d2-67eb-46b7-b920-a43e90284580" />
<img width="650" height="518" alt="Term Replacer suggestions" src="https://github.com/user-attachments/assets/c3ae8c26-47d2-40fa-9c03-cdb83451f731" />
<img width="650" height="295" alt="Term Replacer settings" src="https://github.com/user-attachments/assets/0edb6ebb-d4ae-49a6-8512-b9f439685de8" />

</div>

## Features

- **Term replacement** — define original/replacement pairs and the script swaps them in chapter text as you read.
- **Deletion terms** — leave Replacement Text empty to remove the matched text entirely; empty-replacement terms show as `→ (remove)` in the list.
- **Per-novel lists** — each novel keeps its own set of terms, so settings for one book don't bleed into another.
- **Regex support** — use regular expressions for pattern-based replacements when plain text isn't enough.
- **Whole-word and case-sensitive modes** — toggle these per term for precision.
- **Import and export** — back up your term lists or share them as JSON.
- **Duplicate detection** — the script warns you when a new term conflicts with an existing one.
- **Finder bridge** — if WTR Lab Term Inconsistency Finder is also running, it can read your saved terms directly. No import/export step needed.
- **Smart suggestions** — click WTR's built-in term popovers or type an original value to get source/Community/WTR/AI Glossary/Google suggestion badges you can insert into Original Text or Replacement Text. Each suggestion shows its origin via a compact source badge.
- **Suggestion loading** — replacement suggestions load in parallel batches and render once results arrive, with field/regex alternatives shown immediately before network lookups finish.
- **Glossary-aware source labels** — AI Glossary, generic glossary titles, and raw glossary sources are detected and labeled on each suggestion for clearer provenance.
- **Field-aware presence highlights** — suggestions already present in the Original Text or Replacement Text field are highlighted with distinct purple shades, with whitespace-normalized, case-insensitive matching.
- **Regex-friendly term building** — suggestion clicks, refreshes, Variation, and Wild Char helpers can build `|`-based regex alternatives, normalize slash or spaced separators, warn when regex-like text is saved with Regex off, and sort longer alternatives first.
- **New WTR Lab reader support** — works with WTR Lab's current `.chapter-tracker` reader, new `Edit Terms` controls, Base UI term popovers, dark mode, and native floating `Add Term` controls while preserving legacy reader support.

## Installation

1. Install a userscript manager. Any of these work:
   - [Tampermonkey](https://www.tampermonkey.net/)
   - [Violentmonkey](https://violentmonkey.github.io/)
   - [ScriptCat](https://docs.scriptcat.org/en/)
   - [Stay](https://apps.apple.com/app/id1591620171) (iOS Safari)
2. Install the script from [Greasy Fork](https://greasyfork.org/en/scripts/552945-wtr-lab-term-replacer) or download the latest `.user.js` from the [Releases page](https://github.com/MasuRii/wtr-lab-term-replacer-webpack/releases).
3. Head to a WTR-Lab chapter page and you should see the controls.

## Usage

1. Open a WTR-Lab chapter page.
2. Use the term replacer panel to add original/replacement pairs.
3. Toggle whole-word, case-sensitive, or regex mode per term as needed.
4. Import or export term lists as JSON for backup or sharing.
5. If WTR Lab Term Inconsistency Finder is also installed, term sharing happens automatically via the Finder bridge.

### Finder Bridge (Advanced)

If you run both this script and WTR Lab Term Inconsistency Finder, they can talk to each other live. The term replacer exposes a bridge on the page that Finder connects to — it can request the current novel's terms or add new ones, all without you exporting and importing JSON.

This is handled automatically. Just have both scripts installed and active on the same page.

**Compatibility Note:** As of Finder v5.7.1, the bridge detects Term Replacer via the `.replacer-settings-btn` class, which works on both the legacy Bootstrap UI and the modern Shadcn/Tailwind UI.

## Building from Source

**Requirements:** Node.js 20+, npm 10+

```bash
git clone https://github.com/MasuRii/wtr-lab-term-replacer-webpack.git
cd wtr-lab-term-replacer-webpack
npm ci
npm run validate
```

### Validation Commands

```bash
npm run typecheck   # Type-check TypeScript without emitting
npm run lint        # Run ESLint against src/**/*.ts
npm run build       # Generate userscript artifacts under dist/
npm run validate    # Standard local gate: typecheck, lint, then build
```

The build produces JavaScript userscript files in `dist/`:

| File | Purpose |
|------|---------|
| `wtr-lab-term-replacer-webpack.user.js` | Main production bundle |
| `wtr-lab-term-replacer-webpack.meta.js` | Metadata-only (no script body) |
| `wtr-lab-term-replacer-webpack.greasyfork.user.js` | GreasyFork-compatible bundle |
| `wtr-lab-term-replacer-webpack.greasyfork.meta.js` | GreasyFork metadata |
| `wtr-lab-term-replacer-webpack.dev.user.js` | Development bundle |
| `wtr-lab-term-replacer-webpack.dev.meta.js` | Development metadata |
| `wtr-lab-term-replacer-webpack.dev.proxy.user.js` | Dev proxy bundle |

### Project Structure

| Module | What it handles |
|--------|----------------|
| `engine.ts` | Core term-matching and replacement logic |
| `ui.ts` | The in-page panel and injected styles |
| `storage.ts` | Saving and loading term lists via userscript manager APIs |
| `observer.ts` | Watching for new chapter content (SPA navigation) |
| `handlers.ts` | Import/export and event handling |
| `state.ts` | Shared runtime state |
| `config.ts` | Constants and configuration |
| `duplicates.ts` | Finding conflicting term entries |
| `utils.ts` | Small helper functions |
| `termDiscovery.ts` | Same-origin WTR term API fetching and sanitized suggestion caches |
| `termDiscoveryHelpers.ts` | Pure parsing, sanitization, ranking, source-label detection, suggestion merging, deduplication, presence detection, and progressive batch-loading helpers |

## Privacy

All saved term data stays in your browser through the userscript manager's storage. Suggestions use same-origin WTR-Lab term APIs only when needed, such as automatic lookups or Refresh Suggestions. The script stores sanitized term metadata with short TTLs, never raw chapter bodies, and never users arrays or personal identifiers from suggestion responses.

## Support

- [GitHub Issues](https://github.com/MasuRii/wtr-lab-term-replacer-webpack/issues)
- [Greasy Fork Feedback](https://greasyfork.org/en/scripts/552945-wtr-lab-term-replacer/feedback)

## License

MIT. See [LICENSE](LICENSE).

