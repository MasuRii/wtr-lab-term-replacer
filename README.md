# WTR Lab Term Replacer

[![Version](https://img.shields.io/badge/version-5.7.1-blue.svg)](https://github.com/MasuRii/wtr-lab-term-replacer-webpack/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/MasuRii/wtr-lab-term-replacer-webpack/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Built with Webpack](https://img.shields.io/badge/Built%20with-Webpack-8DD6F9?logo=webpack&logoColor=white)](https://webpack.js.org/)
[![GitHub Issues](https://img.shields.io/github/issues/MasuRii/wtr-lab-term-replacer-webpack)](https://github.com/MasuRii/wtr-lab-term-replacer-webpack/issues)
[![GitHub Stars](https://img.shields.io/github/stars/MasuRii/wtr-lab-term-replacer-webpack)](https://github.com/MasuRii/wtr-lab-term-replacer-webpack/stargazers)

A userscript that replaces terms on WTR-Lab.com chapters so you can read with the names and terminology you prefer.

You can manage term lists per novel, import and export your lists, catch duplicates automatically, and — if you also use [WTR Lab Term Inconsistency Finder](https://github.com/MasuRii/wtr-term-inconsistency-finder) — share saved terms between the two scripts at runtime without any manual file swapping.

<img width="650" height="796" alt="image" src="https://github.com/user-attachments/assets/8e7811d2-67eb-46b7-b920-a43e90284580" />
<img width="650" height="518" alt="image" src="https://github.com/user-attachments/assets/c3ae8c26-47d2-40fa-9c03-cdb83451f731" />
<img width="650" height="295" alt="image" src="https://github.com/user-attachments/assets/0edb6ebb-d4ae-49a6-8512-b9f439685de8" />

## Installing the Userscript

You need a userscript manager in your browser. Any of these work:

- **Tampermonkey**
- **Violentmonkey**
- **ScriptCat**
- **Stay**

Grab the latest `.user.js` file from the `dist/` folder (or from the [Releases page](https://github.com/MasuRii/wtr-lab-term-replacer-webpack/releases)) and your manager will prompt you to install it. That's it — head to a WTR-Lab chapter page and you should see the controls.

## What It Does

- **Term replacement** — define original/​replacement pairs and the script swaps them in chapter text as you read.
- **Per-novel lists** — each novel keeps its own set of terms, so settings for one book don't bleed into another.
- **Regex support** — use regular expressions for pattern-based replacements when plain text isn't enough.
- **Whole-word and case-sensitive modes** — toggle these per term for precision.
- **Import and export** — back up your term lists or share them as JSON.
- **Duplicate detection** — the script warns you when a new term conflicts with an existing one.
- **Finder bridge** — if WTR Lab Term Inconsistency Finder is also running, it can read your saved terms directly. No import/export step needed.
- **Smart suggestions** — click WTR's built-in term popovers or type an original value to get WTR-style source/current/WTR/API/Google suggestion badges you can insert into Original Text or Replacement Text.
- **Regex-friendly term building** — suggestion clicks, refreshes, Variation, and Wild Char helpers can build `|`-based regex alternatives, normalize slash or spaced separators, warn when regex-like text is saved with Regex off, and sort longer alternatives first.
- **New WTR Lab reader support** — works with WTR Lab's current `.chapter-tracker` reader, new `Edit Terms` controls, Base UI term popovers, dark mode, and native floating `Add Term` controls while preserving legacy reader support.

## Building from Source

If you want to build the userscript yourself or contribute:

**Requirements:** Node.js 20+, npm 10+

```bash
git clone https://github.com/MasuRii/wtr-lab-term-replacer-webpack.git
cd wtr-lab-term-replacer-webpack
npm install
npm run build
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

### Other Commands

```bash
npm run build:performance    # Performance-optimized bundle only
npm run build:greasyfork     # GreasyFork bundle only
npm run build:devbundle      # Development bundle only
npm run dev                  # Start dev server with hot reload
npm run typecheck            # Type-check the TypeScript source
npm run version:check        # Show current version info
```

## How It's Built

The source is TypeScript, bundled by Webpack into standard JavaScript userscript files. The code is split into focused modules:

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
| `termDiscoveryHelpers.ts` | Pure parsing, sanitization, and ranking helpers for WTR term suggestions |

## Finder Bridge (Advanced)

If you run both this script and WTR Lab Term Inconsistency Finder, they can talk to each other live. The term replacer exposes a bridge on the page that Finder connects to — it can request the current novel's terms or add new ones, all without you exporting and importing JSON.

This is handled automatically. Just have both scripts installed and active on the same page.

## Privacy

All saved term data stays in your browser through the userscript manager's storage. Suggestions use same-origin WTR-Lab term APIs only when needed, such as automatic lookups or Refresh Suggestions. The script stores sanitized term metadata with short TTLs, never raw chapter bodies, and never users arrays or personal identifiers from suggestion responses.

## Versioning

The current version is **v5.7.1**. Version info is kept in `config/versions.js`, and `npm run version:update` syncs it across the package metadata and generated source files.

See [CHANGELOG.md](CHANGELOG.md) for the full release history.

## License

MIT — see [LICENSE](LICENSE).

## Problems or Suggestions

Open an issue on [GitHub Issues](https://github.com/MasuRii/wtr-lab-term-replacer-webpack/issues).
