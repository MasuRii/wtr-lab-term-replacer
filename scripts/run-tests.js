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
	const outputPath = path.join(tempDir, relativePath.replace(/\.ts$/, ".js"))
	fs.mkdirSync(path.dirname(outputPath), { recursive: true })
	fs.writeFileSync(outputPath, output.outputText, "utf8")
	return require(outputPath)
}

compileTsModule("src/modules/config.ts")
const helpers = compileTsModule("src/modules/termDiscoveryHelpers.ts")
const utils = compileTsModule("src/modules/utils.ts")
const {
	buildReaderGetPayload,
	buildTermsApiUrl,
	extractCurrentChapterCandidates,
	getDiscoveryCandidateKey,
	getSuggestionPresenceLabelsFromValues,
	isReplacementSuggestionRequestCurrent,
	loadReplacementSuggestionBatches,
	mergeRefreshReplacementSuggestions,
	mergeReplacementSuggestionsForCandidates,
	parseNovelTermEntries,
	parseReplacementPreferences,
	sanitizeApiText,
	shouldDisplaySuggestionCount,
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
				title: "Cultivation",
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
		sourceLabel: "Generic: Cultivation",
	},
	{
		term: "Alice Source",
		replacement: "Wonderland",
		source: "novel",
		count: 9,
		sourceId: "id.raw.31",
		hash: "Alice Source",
		lang: "en",
		sourceLabel: "Raw",
	},
])

const duplicateGlossaryTerms = parseNovelTermEntries(
	{
		glossaries: [
			{
				data: {
					type: "raw",
					id: 31,
					terms: [[['Song Shuhang'], "宋书航", 1, 1, 20]],
				},
			},
			{
				data: {
					type: "raw",
					id: 31,
					terms: [[['Sam', 'Song Shuhang'], "宋书航", 5, 1, 10]],
				},
			},
		],
	},
	"en",
)
assert.equal(duplicateGlossaryTerms.length, 1)
assert.deepEqual(duplicateGlossaryTerms[0].replacementSuggestions, ["Song Shuhang", "Sam"])
assert.equal(duplicateGlossaryTerms[0].count, 20)
assert.equal(duplicateGlossaryTerms[0].sourceLabel, "Raw")

const aiGlossaryTerms = parseNovelTermEntries(
	{
		glossaries: [
			{
				data: {
					type: "raw",
					id: 31,
					ai_run: { incorrect: [] },
					terms: [[['Corrected Name'], "修正名", 1, 1, 7]],
				},
			},
		],
	},
	"en",
)
assert.equal(aiGlossaryTerms[0].sourceLabel, "AI Glossary")

const sourceBadgedSuggestions = mergeReplacementSuggestionsForCandidates(
	[{ term: "前辈", replacement: "Senior", source: "novel", count: 100, sourceLabel: "Generic: Cultivation" }],
	[{ replacement: "Elder", count: 80 }],
)
assert.deepEqual(sourceBadgedSuggestions.map((suggestion) => suggestion.sourceLabel), [
	"Source",
	"Generic: Cultivation",
	"API",
])

assert.deepEqual(getSuggestionPresenceLabelsFromValues("Song Shuhang", "song shuhang|Senior White", ""), ["Original"])
assert.deepEqual(getSuggestionPresenceLabelsFromValues("Senior White", "Song Shuhang / Senior   White", ""), ["Original"])
assert.deepEqual(getSuggestionPresenceLabelsFromValues("Sam", "Song Shuhang", "sam"), ["Replacement"])

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

assert.equal(buildTermsApiUrl("31", false), "/api/v2/reader/terms/31.json")
const forcedTermsUrl = buildTermsApiUrl("31", true)
assert.match(forcedTermsUrl, /^\/api\/v2\/reader\/terms\/31\.json\?_wtr_refresh=\d+$/)
assert.notEqual(forcedTermsUrl, buildTermsApiUrl("31", true))

const mergedSuggestionCandidates = [
	{
		term: "宋书航",
		replacement: "Song Shuhang",
		replacementSuggestions: ["Song Shuhang", "Sam"],
		source: "novel",
		count: 20,
	},
]
const mergedSuggestions = mergeReplacementSuggestionsForCandidates(mergedSuggestionCandidates, [
	{ replacement: "Song Shuhang", count: 2 },
	{ replacement: "Alex", count: 1 },
])
assert.deepEqual(mergedSuggestions.slice(0, 4), [
	{ replacement: "宋书航", count: 20, sourceLabel: "Source", sourceRank: -10 },
	{ replacement: "Song Shuhang", count: 20, sourceLabel: "WTR + API", sourceRank: 30 },
	{ replacement: "Sam", count: 20, sourceLabel: "WTR", sourceRank: 30 },
	{ replacement: "Alex", count: 1, sourceLabel: "API", sourceRank: 40 },
])
assert.equal(shouldDisplaySuggestionCount({ replacement: "Sam", count: 20, sourceLabel: "WTR" }), true)
assert.equal(shouldDisplaySuggestionCount({ replacement: "Source", count: 20, sourceLabel: "Source" }), false)

const refreshedSuggestions = mergeRefreshReplacementSuggestions({
	existingSuggestions: [{ replacement: "Old Term Suggestion", count: 9, sourceLabel: "API", sourceRank: 40 }],
	seedSuggestions: [],
	candidates: [{ term: "New Term", replacement: "New Term Suggestion", source: "novel", count: 3 }],
	loadedSuggestions: [],
})
assert.deepEqual(
	refreshedSuggestions.map((suggestion) => suggestion.replacement),
	["New Term", "New Term Suggestion"],
)

async function testProgressiveSuggestionBatches() {
	let resolveFirst
	let resolveSecond
	const first = new Promise((resolve) => {
		resolveFirst = resolve
	})
	const second = new Promise((resolve) => {
		resolveSecond = resolve
	})
	const progress = []
	const batchPromise = loadReplacementSuggestionBatches(
		[
			{ term: "First", source: "novel", count: 1 },
			{ term: "Second", source: "novel", count: 1 },
		],
		(candidate) => (candidate.term === "First" ? first : second),
		(candidate, suggestions) => progress.push([candidate.term, suggestions.map((suggestion) => suggestion.replacement)]),
	)
	resolveSecond([{ replacement: "Second Suggestion", count: 2 }])
	await Promise.resolve()
	assert.deepEqual(progress, [["Second", ["Second Suggestion"]]])
	resolveFirst([{ replacement: "First Suggestion", count: 1 }])
	assert.deepEqual(await batchPromise, [
		{ replacement: "First Suggestion", count: 1 },
		{ replacement: "Second Suggestion", count: 2 },
	])
	assert.deepEqual(progress, [
		["Second", ["Second Suggestion"]],
		["First", ["First Suggestion"]],
	])
}

testProgressiveSuggestionBatches()
	.then(() => console.log("termDiscoveryHelpers tests passed"))
	.catch((error) => {
		console.error(error)
		process.exitCode = 1
	})
