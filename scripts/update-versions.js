#!/usr/bin/env node
// scripts/update-versions.js
// Automated version synchronization for WTR Lab Term Replacer

const fs = require("fs")
const path = require("path")
const { VERSION_INFO } = require("../config/versions.js")
const pkg = require("../package.json")

const FILES_TO_UPDATE = [
	{
		file: "package.json",
		patterns: [{ search: /"version":\s*"[^"]*"/g, replace: `"version": "${VERSION_INFO.NPM}"` }],
	},
	{
		file: "README.md",
		patterns: [
			{
				search: /!\[Version\]\(https:\/\/img\.shields\.io\/badge\/version-[^)]+\)/g,
				replace: `![Version](https://img.shields.io/badge/version-${VERSION_INFO.BADGE}-blue.svg)`,
			},
		],
	},
]

const command = process.argv[2] || "update"

/**
 * Safely update a file using explicit patterns.
 * Returns true when a change is written and false when no change is needed.
 */
function updateFile(filePath, patterns) {
	if (!fs.existsSync(filePath)) {
		console.log(`File not found: ${filePath}`)
		return false
	}

	try {
		const content = fs.readFileSync(filePath, "utf8")
		let updatedContent = content
		let hasChanges = false

		patterns.forEach(({ search, replace }) => {
			if (search.test(updatedContent)) {
				updatedContent = updatedContent.replace(search, replace)
				hasChanges = true
			}
		})

		if (hasChanges) {
			fs.writeFileSync(filePath, updatedContent, "utf8")
			console.log(`Updated ${filePath}`)
			return true
		}

		console.log(`No changes needed for ${filePath}`)
		return false
	} catch (error) {
		console.error(`Error updating ${filePath}:`, error.message)
		throw error
	}
}

function generateBanner() {
	const banner = `/**
 * WTR Lab Term Replacer v${VERSION_INFO.SEMANTIC}
 * Built: ${VERSION_INFO.BUILD_DATE} (${VERSION_INFO.BUILD_ENV})
 *
 * A modular, Webpack-powered TypeScript version of the WTR Lab Term Replacer userscript.
 *
 * @version ${VERSION_INFO.SEMANTIC}
 * @build ${VERSION_INFO.BUILD_ENV}
 * @date ${VERSION_INFO.BUILD_DATE}
 */`

	const bannerPath = path.join(__dirname, "../src/banner.ts")
	fs.writeFileSync(bannerPath, banner, "utf8")
	console.log(`Generated build banner: ${bannerPath}`)
	return bannerPath
}

function generateHeader() {
const header = `// ==UserScript==
// @name         WTR Lab Term Replacer
// @description  A modular, Webpack-powered TypeScript version of the WTR Lab Term Replacer userscript.
// @version      ${VERSION_INFO.SEMANTIC}
// @author       MasuRii
// @homepage     https://github.com/MasuRii/wtr-lab-term-replacer-webpack#readme
// @supportURL   https://github.com/MasuRii/wtr-lab-term-replacer-webpack/issues
// @match        https://wtr-lab.com/en/novel/*/*/*
// @downloadURL  https://github.com/MasuRii/wtr-lab-term-replacer-webpack#readme/raw/main/dist/${pkg.name}.${VERSION_INFO.SEMANTIC}.performance.user.js
// @connect      fonts.googleapis.com
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_listValues
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @icon         https://www.google.com/s2/favicons?sz=64&domain=wtr-lab.com
// @license      MIT
// @namespace    https://github.com/MasuRii/wtr-lab-term-replacer-webpack
// @run-at       document-idle
// @updateURL    https://github.com/MasuRii/wtr-lab-term-replacer-webpack#readme/raw/main/dist/${pkg.name}.${VERSION_INFO.SEMANTIC}.performance.meta.js
// ==/UserScript==

`

const headerPath = path.join(__dirname, "../src/header.ts")
fs.writeFileSync(headerPath, header, "utf8")
console.log(`Generated script header: ${headerPath}`)
return headerPath
}

function checkVersion() {
	console.log("Current Version Information:")
	console.log(`   Semantic Version: ${VERSION_INFO.SEMANTIC}`)
	console.log(`   Display Version: ${VERSION_INFO.DISPLAY}`)
	console.log(`   Build Environment: ${VERSION_INFO.BUILD_ENV}`)
	console.log(`   Build Date: ${VERSION_INFO.BUILD_DATE}`)
	console.log(`   GreasyFork Version: ${VERSION_INFO.GREASYFORK}`)
	console.log(`   NPM Version: ${VERSION_INFO.NPM}`)
	console.log(`   Badge Version: ${VERSION_INFO.BADGE}`)
	console.log(`   Changelog Version: ${VERSION_INFO.CHANGELOG}`)
}

console.log("WTR Lab Term Replacer - Version Management")
console.log("=".repeat(55))

switch (command) {
	case "update":
		console.log("Updating versioned files...")

		let updatedFiles = 0
		let hadHardFailure = false

		FILES_TO_UPDATE.forEach(({ file, patterns }) => {
			const filePath = path.join(__dirname, "..", file)
			try {
				if (updateFile(filePath, patterns)) {
					updatedFiles++
				}
			} catch (error) {
				hadHardFailure = true
			}
		})

		try {
			generateBanner()
			updatedFiles++
		} catch (error) {
			console.error("Failed to generate banner.ts:", error.message)
			hadHardFailure = true
		}

		try {
			generateHeader()
			updatedFiles++
		} catch (error) {
			console.error("Failed to generate header.ts:", error.message)
			hadHardFailure = true
		}

		if (hadHardFailure) {
			console.error("Version update failed. Build aborted due to version sync errors.")
			process.exit(1)
		}

		console.log(`Completed. Updated ${updatedFiles} items.`)
		break

	case "check":
		checkVersion()
		break

	case "banner":
		try {
			generateBanner()
		} catch (error) {
			console.error("Failed to generate banner.ts:", error.message)
			process.exit(1)
		}
		break

	case "header":
		try {
			generateHeader()
		} catch (error) {
			console.error("Failed to generate header.ts:", error.message)
			process.exit(1)
		}
		break

	default:
		console.log("Unknown command:", command)
		console.log("Available commands:")
		console.log("   update  - Update all versioned files (default)")
		console.log("   check   - Display current version information")
		console.log("   banner  - Generate build banner only")
		console.log("   header  - Generate script header only")
		process.exit(1)
}

process.exit(0)
