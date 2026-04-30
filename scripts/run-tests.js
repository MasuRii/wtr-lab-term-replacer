#!/usr/bin/env node
const assert = require("node:assert/strict")
const fs = require("node:fs")
const os = require("node:os")
const path = require("node:path")
const ts = require("typescript")

const root = path.resolve(__dirname, "..")
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "wtr-tests-"))
const tempConfigDir = path.join(tempDir, "config")
fs.mkdirSync(tempConfigDir, { recursive: true })
fs.writeFileSync(
	path.join(tempConfigDir, "versions.js"),
	'exports.getVersion = () => "0.0.0"; exports.getDisplayVersion = () => "v0.0.0";\n',
	"utf8",
)

function compileTsModule(relativePath) {
	const sourcePath = path.join(root, relativePath)
	const source = fs.readFileSync(sourcePath, "utf8")
	const output = ts.transpileModule(source, {
		compilerOptions: {
			module: ts.ModuleKind.CommonJS,
			target: ts.ScriptTarget.ES2020,
			esModuleInterop: true,
		},
		fileName: sourcePath,
	})
	const outputPath = path.join(tempDir, relativePath.replace(/\.ts$/, ".cjs"))
	fs.mkdirSync(path.dirname(outputPath), { recursive: true })
	fs.writeFileSync(outputPath, output.outputText, "utf8")
	return require(outputPath)
}

const helpers = compileTsModule("src/modules/termDiscoveryHelpers.ts")
const utils = compileTsModule("src/modules/utils.ts")
const {
	buildReaderGetPayload,
	extractCurrentChapterCandidates,
	getDiscoveryCandidateKey,
	isReplacementSuggestionRequestCurrent,
	parseNovelTermEntries,
	parseReplacementPreferences,
	sanitizeApiText,
} = helpers
const { getReaderContextFromPath } = utils

assert.equal(sanitizeApiText("  Alice\n\t  Liddell  "), "Alice Liddell")
assert.equal(sanitizeApiText(""), null)
assert.equal(sanitizeApiText("x".repeat(200), 80), "x".repeat(80))

assert.deepEqual(getReaderContextFromPath("/en/novel/123/alice-in-wonderland/chapter-4"), {
	lang: "en",
	rawId: "123",
	novelSlug: "alice-in-wonderland",
	chapterSlug: "chapter-4",
})
assert.deepEqual(getReaderContextFromPath("/en/serie-456/white-rabbit/chapter-7"), {
	lang: "en",
	rawId: "456",
	novelSlug: "white-rabbit",
	chapterSlug: "chapter-7",
})
assert.deepEqual(getReaderContextFromPath("/serie-789/wonderland/chapter-2"), {
	lang: "en",
	rawId: "789",
	novelSlug: "wonderland",
	chapterSlug: "chapter-2",
})
assert.deepEqual(
	buildReaderGetPayload({ lang: "en", rawId: "123", chapterSlug: "chapter-401", chapterNo: 398, chapterId: "60250" }),
	{
		translate: "ai",
		language: "en",
		raw_id: 123,
		chapter_no: 398,
		retry: false,
		force_retry: false,
		chapter_id: 60250,
	},
)

const chapterPayload = {
	data: {
		body: "<p>Alice met the White Rabbit. Alice followed the White Rabbit into Wonderland.</p>",
	},
}
const chapterCandidates = extractCurrentChapterCandidates(chapterPayload, new Set(["Wonderland"]), 5)
assert.deepEqual(
	chapterCandidates.map((candidate) => [candidate.term, candidate.count]),
	[
		["Alice", 2],
		["White Rabbit", 2],
	],
)

const novelTerms = parseNovelTermEntries(
	{
		terms: [
			{ source: " 白兎 ", target: "White Rabbit", source_id: 42, hash: "abc-123", users: ["private"] },
			{ original: "Alice", replacement: "Alicia", sourceId: "src_7", sourceHash: "hash_7", popularity: 5 },
			{ source: "", target: "skip me" },
		],
	},
	"en",
)
assert.equal(novelTerms.length, 2)
assert.deepEqual(Object.keys(novelTerms[0]).includes("users"), false)
assert.deepEqual(novelTerms[0], {
	term: "Alice",
	replacement: "Alicia",
	source: "novel",
	count: 5,
	sourceId: "src_7",
	hash: "hash_7",
	lang: "en",
})
assert.deepEqual(novelTerms[1], {
	term: "白兎",
	replacement: "White Rabbit",
	source: "novel",
	count: 0,
	sourceId: "42",
	hash: "abc-123",
	lang: "en",
})

const glossaryTerms = parseNovelTermEntries(
	{
		success: true,
		raw_id: 31,
		glossaries: [
			{
				raw_id: 31,
				data: {
					type: "raw",
					id: 31,
					terms: [[['Wonderland'], "Alice Source", 2, 1, 9]],
				},
			},
			{
				id: 17,
				data: {
					type: "generic",
					id: 17,
					terms: [[['White Rabbit'], "Rabbit Source", 12, 3]],
				},
			},
		],
	},
	"en",
)
assert.deepEqual(glossaryTerms, [
	{
		term: "Rabbit Source",
		replacement: "White Rabbit",
		source: "novel",
		count: 12,
		sourceId: "id.generic.17",
		hash: "Rabbit Source",
		lang: "en",
	},
	{
		term: "Alice Source",
		replacement: "Wonderland",
		source: "novel",
		count: 9,
		sourceId: "id.raw.31",
		hash: "Alice Source",
		lang: "en",
	},
])

const selectedCandidateKey = getDiscoveryCandidateKey(novelTerms[0])
const staleCandidateKey = getDiscoveryCandidateKey(novelTerms[1])
assert.equal(isReplacementSuggestionRequestCurrent(3, 3, selectedCandidateKey, selectedCandidateKey, "Alice", "Alice"), true)
assert.equal(isReplacementSuggestionRequestCurrent(2, 3, selectedCandidateKey, selectedCandidateKey, "Alice", "Alice"), false)
assert.equal(isReplacementSuggestionRequestCurrent(3, 3, staleCandidateKey, selectedCandidateKey, "Alice", "Alice"), false)
assert.equal(isReplacementSuggestionRequestCurrent(3, 3, selectedCandidateKey, selectedCandidateKey, "Alice", "Alicia"), false)

const preferences = parseReplacementPreferences({
	data: [
		{ target: "White Rabbit", users: [1, 2, 3] },
		{ replacement: "Sir Rabbit", count: 4 },
		{ to: "March Hare", userCount: 30, users: ["private-user-id"] },
	],
})
assert.deepEqual(preferences, [
	{ replacement: "March Hare", count: 30 },
	{ replacement: "Sir Rabbit", count: 4 },
	{ replacement: "White Rabbit", count: 0 },
])
assert.equal(Object.keys(preferences[0]).includes("users"), false)

console.log("termDiscoveryHelpers tests passed")
