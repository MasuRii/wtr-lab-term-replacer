# CHANGELOG

All notable changes to WTR Lab Term Replacer are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

No unreleased changes.

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
