# CHANGELOG

All notable changes to WTR Lab Term Replacer are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

No unreleased changes.

## [5.7.2] - 2026-06-08

### Added
- Added source badges on suggestion buttons that display where each suggestion originates (Source, WTR, AI Glossary, Generic, Raw, Community).
- Added progressive suggestion rendering so suggestions appear incrementally as each API batch completes instead of waiting for all batches.
- Added glossary source label detection that identifies AI Glossary entries, generic glossary titles, and raw glossary sources from WTR term payloads.
- Added purple highlight on suggestions already present in the Original Text field and a distinct darker purple highlight for the Replacement Text field.
- Added cache-busting refresh parameter to the terms API URL when `Refresh Suggestions` is triggered, bypassing stale browser cache.
- Added comprehensive tests for source label propagation, suggestion merging, progressive batch loading, presence label detection, and cache-busting URL generation.

### Changed
- Reworked suggestion deduplication and merging to combine source labels with `+` separators, merge counts, and prefer the best source rank when duplicates are found.
- Changed duplicate term candidate handling to merge replacement suggestions and take the maximum occurrence count instead of overwriting.
- Changed `API` source labels to display as `Community` in the suggestion UI.
- Changed suggestion presence detection to normalize whitespace and use locale-aware lowercase comparison, so `"Song Shuhang"` matches `"song shuhang"` or slash/pipe-separated entries.
- Changed the suggestion merge helper to use whitespace-normalized comparison before inserting, preventing near-duplicate entries.
- Moved suggestion deduplication, merging, presence detection, and count-display logic from `handlers.ts` into `termDiscoveryHelpers.ts` for improved testability and reuse.
- Refresh Suggestions no longer merges prior suggestions by default, giving a cleaner result set from the latest API data.

## [5.7.1] - 2026-06-02

### Added
- Added Original Text and Replacement Text character counters.
- Added WTR-inspired `Variation` and `Wild Char` helpers for building regex-friendly original text patterns.
- Added switch-style controls for Disable All, Case Sensitive, Use Regex, and Whole Word Only.
- Added an explicit “This term applies to this novel only” note to match current storage behavior.

### Fixed
- Restored term replacement on WTR Lab's new reader frontend by detecting the new `.chapter-tracker`, `#tracker-<chapter>`, `.wtr-line`, and `[data-line]` chapter structures.
- Fixed settings-button injection for the new reader controls by supporting the new `Edit Terms` grid layout while keeping the legacy `.term-edit-btn` path.
- Fixed WTR term popover integration for the new Base UI popover markup so `+ Replacer` suggestions still work from source/current/WTR/Google choices.
- Reworked the floating selected-text add button to sit above WTR Lab's own floating `Add Term` button with matching compact styling and a distinct Replacer color.
- Synced the Term Replacer modal theme with WTR Lab dark mode, dark website theme selection, and dark reader theme samples to prevent accidental light-mode panels.
- Removed the large popover spacing between WTR Lab's own `+ Term` action and the Term Replacer `+ Replacer` action.
- Fixed popover-launched suggestions disappearing after the Add/Edit form initialized or after refresh.
- Fixed WTR dictionary suggestions inheriting repeated glossary counts; only user/API/current preference suggestions display counts.
- Added an existing-term modal when `+ Replacer` is used on a term already saved in Term Replacer storage, with a one-click path to open that saved term.
- Fixed late-loading WTR Google Translate suggestions not appearing in the Term Replacer suggestion list.

### Changed
- Hardened chapter reprocessing, disable/enable toggles, and DOM re-acquisition so SPA navigation and delayed reader rendering no longer depend on one legacy selector.
- Restyled replacement suggestions as WTR-style compact badges with source/profile/dictionary/Google icons instead of Bootstrap text buttons.
- Tightened Add/Edit form density with WTR-inspired labels, helper buttons, compact inputs, and spacing.
- Added CSS variable fallbacks so the Term Replacer panel remains usable on the new non-Bootstrap WTR Lab frontend.

## [5.7.0] - 2026-05-16

### Added
- Added WTR popover integration with a `+ Replacer Term` action that opens the Add/Edit form with WTR source, current, dictionary, Google, API, and field-derived suggestions.
- Added field-aware suggestions that insert into whichever Add/Edit field was last focused, with source labels and existing-field indicators for Original Text and Replacement Text.
- Added a `Refresh Suggestions` action that force-refreshes WTR novel term data, merges new suggestions with existing suggestions, and deduplicates the result.
- Added regex usability warnings when regex-like original text is entered while `Use Regex` is disabled.

### Changed
- Reworked suggestions to use WTR reader term tuples as the primary source of alternatives when popularity preference APIs return no data.
- Improved regex-original handling by normalizing slash or spaced separators into `|`, deduplicating alternatives, and sorting longer alternatives first.
- Preserved suggestion lists across field edits, refreshes, and `Use Regex` toggles so existing choices remain visible.

### Removed
- Removed the Term Discovery Assistant tab, menu command, current-chapter candidate discovery, and related UI/state paths.
- Removed the popover Quick Save action and all related save logic.

## [5.6.0] - 2026-05-01

### Added
- Added the Term Discovery Assistant for current-chapter candidate picking, novel-wide WTR term search/autocomplete, and explicit user-confirmed term saving.
- Added popularity-based replacement suggestions when WTR term identifiers are available, with graceful fallback when APIs or identifiers are unavailable.
- Added pure parsing, sanitization, and ranking tests for discovered term metadata and popularity responses.

### Changed
- Cached only sanitized discovery metadata with short TTLs and refresh controls; raw chapter bodies and users arrays are not stored or displayed.

## [5.5.1] - 2026-05-01

### Changed
- Added standard Shields.io badges to the README: version, license, TypeScript, Webpack, GitHub issues, and GitHub stars.
- Updated versioning references in the README to reflect the new patch release.

## [5.5.0] - 2026-05-01

### Changed
- Migrated project source from JavaScript modules to TypeScript modules while keeping generated userscript output as JavaScript.
- Updated build documentation for the TypeScript/Webpack workflow and release-ready JavaScript userscript bundles.
- Updated userscript manager support documentation for ScriptCat, Tampermonkey, Stay, and Violentmonkey.
- Standardized Markdown release documentation by using `CHANGELOG.md` and cleaning up release-facing wording.

### Removed
- Removed ESLint, Prettier, Stylelint, and unused CSS loader tooling from the active build workflow.

### Verified
- Verified the live runtime bridge remains compatible with WTR Lab Term Inconsistency Finder, including `window.WTR_LAB_TERM_REPLACER`, `wtr:requestTerms`, `wtr:termsResponse`, and `wtr:addTerm` behavior.
- Confirmed no companion Finder repository changes were required for this release.

## [5.4.5] - 2026-04-04

### Added
- Live integration bridge for WTR Lab Term Inconsistency Finder so Finder can request the current novel's stored terms directly at runtime.
- Global readiness marker for safe cross-userscript detection without relying only on DOM heuristics.

### Changed
- Centralized term loading through a reusable `getTermsForSlug()` storage helper for normal script initialization and external bridge requests.

### Improved
- Finder and Term Replacer interoperability no longer requires exporting and re-importing JSON for the standard dual-script workflow.

## [5.4.4] - 2025-11-19

### Fixed
- Fixed `ReferenceError: process is not defined` by configuring Webpack to target the web environment and mock Node.js globals.
- Fixed `TypeError: getDisplayVersion is not a function` by adding the missing export in `config/versions.js`.
- Fixed module export/import compatibility issues between CommonJS and ES modules.

### Technical
- Updated `webpack.config.js` to set `target: "web"` for all build configurations.
- Added `webpack.DefinePlugin` to mock the `process` global for browser compatibility.
- Fixed `module.exports` in `config/versions.js` to export `getDisplayVersion`.

### Verification
- Confirmed the build process completed successfully with exit code 0.
- Verified generated distribution files contained the required runtime fixes.

## [5.4.3] - 2025-11-19

### Added
- Completed project rebranding from "WTR-Lab Novel Reviewer" to "WTR Lab Term Replacer".
- Updated project name to `wtr-lab-term-replacer-webpack` across configuration files.
- Added automated build banner and header generation with correct versioning.

### Changed
- Updated Webpack configuration, metadata, URL patterns, and grant permissions for the renamed project.
- Improved versioning coverage for README badges and generated userscript metadata.

### Fixed
- Fixed version consistency across project files and documentation.

## [5.4.2] - 2025-11-07

### Fixed
- Fixed menu button alignment on mobile devices.
- Fixed scroll position preservation when editing terms.
- Fixed tab switching behavior that could reset term-list position after saving edits.
- Fixed race conditions in tab switching and navigation state restoration.

### Improved
- Improved mobile navigation responsiveness and term-list location persistence.

## [5.4.1] - 2025-11-06

### Added
- Added centralized versioning with a single source of truth.
- Added environment variable support for version overrides.
- Added scroll position preservation and regex validation feedback.

### Changed
- Simplified the version update workflow.
- Improved error messaging and user guidance.

### Fixed
- Fixed version consistency across generated and documented artifacts.

## [5.4.0] - 2025-11-06

### Added
- Added modular architecture and Webpack 5 build system.
- Added performance-optimized, GreasyFork-compatible, and development builds.
- Added robust replacement engine, responsive UI, import/export support, duplicate detection, and novel-specific data isolation.
- Added SPA navigation handling and webpack-dev-server development workflow.

### Changed
- Changed storage keys to use novel slug-based isolation.
- Refactored internal APIs for better performance.

### Removed
- Removed the legacy monolithic userscript structure.
- Replaced inefficient DOM manipulation methods with the modular engine.

### Fixed
- Fixed responsive design, close button behavior, pagination persistence, search behavior, import/export validation, DOM timing issues, and memory leaks.

### Security
- Improved CSP compatibility and cross-browser security testing.

### Performance
- Reduced memory usage, improved processing speed, reduced initial load time, optimized bundle size, and improved mobile performance.

## Contributing

See [README.md](README.md) for development setup, support, and contribution guidance.
