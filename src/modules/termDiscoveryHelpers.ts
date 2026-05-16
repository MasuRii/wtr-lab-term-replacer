export type DiscoverySource = "chapter" | "novel"

export interface DiscoveredTermCandidate {
	term: string
	replacement?: string
	replacementSuggestions?: string[]
	source: DiscoverySource
	count: number
	sourceId?: string
	hash?: string
	lang?: string
}

export interface ReplacementSuggestion {
	replacement: string
	count: number
	sourceLabel?: string
	sourceRank?: number
}

export interface ReaderGetRequestContext {
	lang: string
	rawId: string | null
	chapterSlug: string | null
	chapterNo?: string | number | null
	chapterId?: string | number | null
}

export interface ReaderGetPayload {
	translate: string
	language: string
	raw_id: number
	chapter_no: number
	retry: false
	force_retry: false
	chapter_id?: number
}

const MAX_TERM_LENGTH = 80
const MAX_REPLACEMENT_LENGTH = 120
const MAX_RESULTS = 100
const CONTROL_CHARS_PATTERN = /[\u0000-\u001f\u007f]/g
const HTML_TAG_PATTERN = /<[^>]*>/g
const HTML_ENTITY_PATTERN = /&(?:nbsp|amp|lt|gt|quot|#39);/gi
const SAFE_IDENTIFIER_PATTERN = /^[A-Za-z0-9_.:-]{1,80}$/
const WTR_SOURCE_ID_PREFIX = "id."
const COMMON_WORDS = new Set([
	"A",
	"An",
	"And",
	"As",
	"At",
	"But",
	"By",
	"For",
	"From",
	"He",
	"Her",
	"His",
	"I",
	"In",
	"Into",
	"It",
	"Of",
	"On",
	"Or",
	"She",
	"The",
	"They",
	"This",
	"To",
	"Was",
	"With",
])

export function sanitizeApiText(value: unknown, maxLength = MAX_TERM_LENGTH): string | null {
	if (typeof value !== "string" && typeof value !== "number") {
		return null
	}

	const normalized = String(value)
		.replace(CONTROL_CHARS_PATTERN, " ")
		.replace(/\s+/g, " ")
		.trim()

	if (!normalized) {
		return null
	}

	return normalized.slice(0, maxLength)
}

function stripHtml(value: string): string {
	return value
		.replace(HTML_TAG_PATTERN, " ")
		.replace(HTML_ENTITY_PATTERN, (entity) => {
			const lower = entity.toLowerCase()
			if (lower === "&nbsp;") {
				return " "
			}
			if (lower === "&amp;") {
				return "&"
			}
			if (lower === "&lt;") {
				return "<"
			}
			if (lower === "&gt;") {
				return ">"
			}
			if (lower === "&quot;") {
				return '"'
			}
			return "'"
		})
}

function sanitizeIdentifier(value: unknown): string | undefined {
	const sanitized = sanitizeApiText(value, 80)
	if (!sanitized || !SAFE_IDENTIFIER_PATTERN.test(sanitized)) {
		return undefined
	}
	return sanitized
}

function sanitizePreferenceHash(value: unknown): string | undefined {
	return sanitizeApiText(value, MAX_TERM_LENGTH) || undefined
}

function sanitizeLang(value: unknown, fallback = "en"): string {
	const sanitized = sanitizeApiText(value, 12)
	if (sanitized && /^[a-z]{2}(?:-[A-Z]{2})?$/.test(sanitized)) {
		return sanitized
	}
	return fallback
}

function parsePositiveInteger(value: unknown, pattern = /^(\d+)$/): number | null {
	const sanitized = sanitizeApiText(value, 80)
	const match = sanitized?.match(pattern)
	if (!match) {
		return null
	}
	const parsed = Number(match[1])
	return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}

function sanitizeTranslateService(value: unknown): string {
	const sanitized = sanitizeApiText(value, 20)
	return sanitized && /^[a-z][a-z0-9_-]{0,19}$/i.test(sanitized) ? sanitized : "ai"
}

export function buildReaderGetPayload(
	context: ReaderGetRequestContext,
	translateService = "ai",
): ReaderGetPayload | null {
	const rawId = parsePositiveInteger(context.rawId)
	const chapterNoSource = context.chapterNo ?? context.chapterSlug
	const chapterNo = parsePositiveInteger(chapterNoSource, /^(?:chapter-)?(\d+)$/)
	if (!rawId || !chapterNo) {
		return null
	}

	const payload: ReaderGetPayload = {
		translate: sanitizeTranslateService(translateService),
		language: sanitizeLang(context.lang),
		raw_id: rawId,
		chapter_no: chapterNo,
		retry: false,
		force_retry: false,
	}
	const chapterId = parsePositiveInteger(context.chapterId)
	if (chapterId) {
		payload.chapter_id = chapterId
	}
	return payload
}

function firstTextValue(entry: Record<string, unknown>, keys: string[], maxLength = MAX_TERM_LENGTH): string | null {
	for (const fieldName of keys) {
		const value = sanitizeApiText(entry[fieldName], maxLength)
		if (value) {
			return value
		}
	}
	return null
}

function firstNumberValue(entry: Record<string, unknown>, keys: string[]): number {
	for (const fieldName of keys) {
		const value = entry[fieldName]
		if (typeof value === "number" && Number.isFinite(value)) {
			return Math.max(0, value)
		}
		if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
			return Math.max(0, Number(value))
		}
	}
	return 0
}

function getArrayPayload(payload: unknown): unknown[] {
	if (Array.isArray(payload)) {
		return payload
	}
	if (!payload || typeof payload !== "object") {
		return []
	}

	const objectPayload = payload as Record<string, unknown>
	for (const fieldName of ["data", "terms", "items", "results", "preferences", "sources", "glossaries"]) {
		const value = objectPayload[fieldName]
		if (Array.isArray(value)) {
			return value
		}
		if (value && typeof value === "object") {
			const nested = getArrayPayload(value)
			if (nested.length > 0) {
				return nested
			}
		}
	}
	return []
}

interface NovelTermEntryContext {
	item: unknown
	sourceId?: string
	lang: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value && typeof value === "object" && !Array.isArray(value))
}

function isWtrTermTuple(value: unknown): value is unknown[] {
	return Array.isArray(value) && Array.isArray(value[0]) && (typeof value[1] === "string" || typeof value[1] === "number")
}

function getGlossarySourceId(entry: Record<string, unknown>): string | undefined {
	const explicitSourceId = sanitizeIdentifier(entry.source_id ?? entry.sourceId)
	if (explicitSourceId) {
		return explicitSourceId
	}

	const data = isRecord(entry.data) ? entry.data : null
	const sourceType = sanitizeIdentifier(data?.type ?? entry.type)
	const sourceId = sanitizeIdentifier(data?.id ?? entry.id ?? entry.raw_id ?? entry.rawId)
	if (!sourceType || !sourceId) {
		return undefined
	}
	return `${WTR_SOURCE_ID_PREFIX}${sourceType}.${sourceId}`
}

function collectNovelTermEntries(payload: unknown, fallbackLang: string, sourceId?: string): NovelTermEntryContext[] {
	if (isWtrTermTuple(payload)) {
		return [{ item: payload, sourceId, lang: fallbackLang }]
	}
	if (Array.isArray(payload)) {
		return payload.flatMap((item) => collectNovelTermEntries(item, fallbackLang, sourceId))
	}
	if (!isRecord(payload)) {
		return []
	}

	const localSourceId = getGlossarySourceId(payload) || sourceId
	const localLang = sanitizeLang(payload.lang ?? payload.language, fallbackLang)
	const directTerm = firstTextValue(payload, ["source", "original", "source_text", "sourceText", "from", "term", "raw", "name"])
	if (directTerm) {
		return [{ item: payload, sourceId: localSourceId, lang: localLang }]
	}

	const nestedEntries: NovelTermEntryContext[] = []
	for (const fieldName of ["glossaries", "data", "terms", "items", "results", "sources"]) {
		const value = payload[fieldName]
		if (value && (Array.isArray(value) || typeof value === "object")) {
			nestedEntries.push(...collectNovelTermEntries(value, localLang, localSourceId))
		}
	}
	return nestedEntries
}

function textValuesFromArray(values: unknown[], maxLength = MAX_TERM_LENGTH): string[] {
	const deduped = new Map<string, string>()
	for (const value of values) {
		const text = sanitizeApiText(value, maxLength)
		if (text) {
			deduped.set(text, text)
		}
	}
	return Array.from(deduped.values())
}

function firstTextFromArray(values: unknown[], maxLength = MAX_TERM_LENGTH): string | null {
	return textValuesFromArray(values, maxLength)[0] || null
}

function maxNumberValue(values: unknown[]): number {
	return values.reduce<number>((maxValue, value) => {
		if (typeof value === "number" && Number.isFinite(value)) {
			return Math.max(maxValue, value)
		}
		if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
			return Math.max(maxValue, Number(value))
		}
		return maxValue
	}, 0)
}

function collectReaderText(payload: unknown, depth = 0): string[] {
	if (depth > 6 || payload == null) {
		return []
	}
	if (typeof payload === "string") {
		return payload.length > 40 ? [payload] : []
	}
	if (Array.isArray(payload)) {
		return payload.flatMap((item) => collectReaderText(item, depth + 1))
	}
	if (typeof payload !== "object") {
		return []
	}

	const objectPayload = payload as Record<string, unknown>
	const textKeys = ["body", "content", "chapter", "chapter_body", "chapterBody", "html", "text"]
	const directText = textKeys.flatMap((fieldName) => collectReaderText(objectPayload[fieldName], depth + 1))
	if (directText.length > 0) {
		return directText
	}
	return Object.values(objectPayload).flatMap((value) => collectReaderText(value, depth + 1))
}

export function rankChapterTermCandidates(
	text: string,
	existingTerms: Set<string> = new Set(),
	limit = 50,
): DiscoveredTermCandidate[] {
	const strippedText = stripHtml(text)
	const counts = new Map<string, number>()
	const addTerm = (rawTerm: string) => {
		const term = sanitizeApiText(rawTerm)
		if (!term || term.length < 2 || existingTerms.has(term) || COMMON_WORDS.has(term)) {
			return
		}
		counts.set(term, (counts.get(term) || 0) + 1)
	}

	const latinMatches = strippedText.matchAll(/\b[A-Z][\p{L}\p{M}'-]*(?:\s+[A-Z][\p{L}\p{M}'-]*){0,3}\b/gu)
	for (const match of latinMatches) {
		addTerm(match[0])
	}

	const cjkMatches = strippedText.matchAll(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\uAC00-\uD7AF]{2,12}/gu)
	for (const match of cjkMatches) {
		addTerm(match[0])
	}

	return Array.from(counts.entries())
		.map(([term, count]) => ({ term, count, source: "chapter" as const }))
		.sort((a, b) => b.count - a.count || a.term.localeCompare(b.term))
		.slice(0, limit)
}

export function extractCurrentChapterCandidates(
	readerPayload: unknown,
	existingTerms: Set<string> = new Set(),
	limit = 50,
): DiscoveredTermCandidate[] {
	const text = collectReaderText(readerPayload).join(" ")
	if (!text) {
		return []
	}
	return rankChapterTermCandidates(text, existingTerms, limit)
}

export function parseNovelTermEntries(payload: unknown, lang = "en", limit = MAX_RESULTS): DiscoveredTermCandidate[] {
	const deduped = new Map<string, DiscoveredTermCandidate>()
	const entries = collectNovelTermEntries(payload, sanitizeLang(lang))

	for (const { item, sourceId: inheritedSourceId, lang: entryLang } of entries) {
		let term: string | null = null
		let replacement: string | null = null
		let replacementSuggestions: string[] = []
		let count = 0
		let sourceId = inheritedSourceId
		let hash: string | undefined
		let candidateLang = entryLang

		if (Array.isArray(item)) {
			const replacements = Array.isArray(item[0]) ? item[0] : []
			term = sanitizeApiText(item[1])
			replacementSuggestions = textValuesFromArray(replacements, MAX_REPLACEMENT_LENGTH)
			replacement = replacementSuggestions[0] || null
			count = maxNumberValue(item.slice(2))
			hash = sanitizePreferenceHash(item[1])
		} else if (isRecord(item)) {
			term = firstTextValue(item, ["source", "original", "source_text", "sourceText", "from", "term", "raw", "name"])
			replacement = firstTextValue(
				item,
				["target", "replacement", "target_text", "targetText", "translation", "value", "to"],
				MAX_REPLACEMENT_LENGTH,
			)
			count = firstNumberValue(item, [
				"popularity",
				"count",
				"uses",
				"usage",
				"frequency",
				"preference_count",
				"userCount",
				"user_count",
			])
			sourceId = sanitizeIdentifier(item.source_id ?? item.sourceId ?? item.id) || sourceId
			hash = sanitizePreferenceHash(item.hash ?? item.source_hash ?? item.sourceHash ?? item.from ?? item.source ?? item.original ?? term)
			candidateLang = sanitizeLang(item.lang ?? item.language, candidateLang)
		}

		if (!term) {
			continue
		}

		const candidate: DiscoveredTermCandidate = {
			term,
			replacement: replacement || undefined,
			...(replacementSuggestions.length > 1 ? { replacementSuggestions } : {}),
			source: "novel",
			count,
			sourceId,
			hash,
			lang: candidateLang,
		}
		const mapKey = term.toLocaleLowerCase()
		const previous = deduped.get(mapKey)
		if (!previous || candidate.count > previous.count || (!previous.hash && candidate.hash)) {
			deduped.set(mapKey, candidate)
		}
	}

	return Array.from(deduped.values())
		.sort((a, b) => b.count - a.count || a.term.localeCompare(b.term))
		.slice(0, limit)
}

export function getDiscoveryCandidateKey(candidate: DiscoveredTermCandidate | null | undefined): string {
	if (!candidate) {
		return ""
	}
	return [candidate.term, candidate.replacement || "", candidate.source, candidate.sourceId || "", candidate.hash || "", candidate.lang || ""].join("\u001f")
}

export function isReplacementSuggestionRequestCurrent(
	requestId: number,
	latestRequestId: number,
	candidateKey: string,
	selectedCandidateKey: string,
	inputValue: string,
	currentInputValue: string,
): boolean {
	return requestId === latestRequestId && candidateKey === selectedCandidateKey && inputValue === currentInputValue
}

export function parseReplacementPreferences(payload: unknown, limit = 20): ReplacementSuggestion[] {
	const deduped = new Map<string, ReplacementSuggestion>()
	const entries = getArrayPayload(payload)

	for (const item of entries) {
		if (!item || typeof item !== "object") {
			continue
		}
		const entry = item as Record<string, unknown>
		const replacement = firstTextValue(
			entry,
			["target", "replacement", "target_text", "targetText", "translation", "value", "to"],
			MAX_REPLACEMENT_LENGTH,
		)
		if (!replacement) {
			continue
		}
		const count = firstNumberValue(entry, [
			"count",
			"score",
			"votes",
			"uses",
			"usage",
			"preference_count",
			"users_count",
			"userCount",
			"user_count",
		])
		const mapKey = replacement.toLocaleLowerCase()
		const previous = deduped.get(mapKey)
		if (!previous || count > previous.count) {
			deduped.set(mapKey, { replacement, count })
		}
	}

	return Array.from(deduped.values())
		.sort((a, b) => b.count - a.count || a.replacement.localeCompare(b.replacement))
		.slice(0, limit)
}
