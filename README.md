# WTR Lab Term Replacer

A userscript that replaces terms on WTR-Lab.com chapters so you can read with the names and terminology you prefer.

You can manage term lists per novel, import and export your lists, catch duplicates automatically, and — if you also use [WTR Lab Term Inconsistency Finder](https://github.com/MasuRii/wtr-term-inconsistency-finder) — share saved terms between the two scripts at runtime without any manual file swapping.

<img width="650" height="796" alt="image" src="https://github.com/user-attachments/assets/8e7811d2-67eb-46b7-b920-a43e90284580" />
<img width="650" height="443" alt="image" src="https://github.com/user-attachments/assets/da58cc63-94fe-4e41-9fe4-28268691f08c" />
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

## Finder Bridge (Advanced)

If you run both this script and WTR Lab Term Inconsistency Finder, they can talk to each other live. The term replacer exposes a bridge on the page that Finder connects to — it can request the current novel's terms or add new ones, all without you exporting and importing JSON.

This is handled automatically. Just have both scripts installed and active on the same page.

## Privacy

All term data stays in your browser through the userscript manager's storage. Nothing is sent to external servers. The only network request is a Google Fonts import used by the script's UI.

## Versioning

The current version is **v5.5.0**. Version info is kept in `config/versions.js`, and `npm run version:update` syncs it across the package metadata and generated source files.

See [CHANGELOG.md](CHANGELOG.md) for the full release history.

## License

MIT — see [LICENSE](LICENSE).

## Problems or Suggestions

Open an issue on [GitHub Issues](https://github.com/MasuRii/wtr-lab-term-replacer-webpack/issues).
