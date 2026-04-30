import { state } from "./state"
import { getReaderContextFromPath, type ReaderUrlContext } from "./utils"
import {
	DiscoveredTermCandidate,
	ReplacementSuggestion,
	buildReaderGetPayload,
	extractCurrentChapterCandidates,
	parseNovelTermEntries,
	parseReplacementPreferences,
} from "./termDiscoveryHelpers"

interface CacheEntry<T> {
	fetchedAt: number
	data: T
}

interface ReaderPageMetadata {
	chapterNo?: string | number | null
	chapterId?: string | number | null
}

const DISCOVERY_CACHE_PREFIX = "wtr_lab_term_discovery_cache_v2_"
const CHAPTER_CACHE_TTL_MS = 30 * 60 * 1000
const NOVEL_TERMS_CACHE_TTL_MS = 60 * 60 * 1000
const PREFERENCES_CACHE_TTL_MS = 6 * 60 * 60 * 1000

function getReaderContext(): ReaderUrlContext {
	return getReaderContextFromPath(window.location.pathname)
}

function getCurrentChapterElement(context: ReaderUrlContext): Element | null {
	if (context.chapterSlug) {
		const chapterRoot = document.getElementById(context.chapterSlug)
		const chapterBody = chapterRoot?.querySelector(".chapter-body")
		if (chapterBody) {
			return chapterBody
		}
		if (chapterRoot) {
			return chapterRoot
		}
	}
	return document.querySelector(".chapter-body")
}

function readDataValue(element: Element | null, names: string[]): string | null {
	if (!element) {
		return null
	}
	for (const name of names) {
		const value = element.getAttribute(name)
		if (value) {
			return value
		}
	}
	return null
}

function getReaderPageMetadata(context: ReaderUrlContext): ReaderPageMetadata {
	const chapterElement = getCurrentChapterElement(context)
	const chapterRoot = context.chapterSlug ? document.getElementById(context.chapterSlug) : null
	return {
		chapterNo: readDataValue(chapterElement, ["data-chapter-no", "data-order", "data-chapter-order"])
			|| readDataValue(chapterRoot, ["data-chapter-no", "data-order", "data-chapter-order"]),
		chapterId: readDataValue(chapterElement, ["data-chapter-id"])
			|| readDataValue(chapterRoot, ["data-chapter-id"]),
	}
}

function getCurrentChapterText(context: ReaderUrlContext): string {
	return getCurrentChapterElement(context)?.textContent || ""
}

function getCsrfToken(): string | null {
	const meta = document.querySelector('meta[name="csrf-token"], meta[name="csrf_token"]')
	return meta?.getAttribute("content") || null
}

function getExistingOriginalTerms(): Set<string> {
	return new Set((state.terms || []).map((term) => term?.original).filter(Boolean))
}

function getCacheKey(type: string, identifiers: string[]): string {
	return `${DISCOVERY_CACHE_PREFIX}${type}_${identifiers.filter(Boolean).join("_")}`
}

async function readCache<T>(key: string, ttlMs: number): Promise<T | null> {
	try {
		const entry = (await GM_getValue(key, null)) as CacheEntry<T> | null
		if (!entry || typeof entry.fetchedAt !== "number" || Date.now() - entry.fetchedAt > ttlMs) {
			return null
		}
		return entry.data
	} catch (_error) {
		return null
	}
}

async function writeCache<T>(key: string, data: T): Promise<void> {
	try {
		await GM_setValue(key, { fetchedAt: Date.now(), data })
	} catch (_error) {
		// Discovery cache is optional and must never block the main term workflow.
	}
}

async function fetchJson(url: string, init: RequestInit = {}): Promise<unknown> {
	const headers = new Headers(init.headers || {})
	headers.set("Accept", "application/json")
	const csrfToken = getCsrfToken()
	if (csrfToken) {
		headers.set("X-CSRF-TOKEN", csrfToken)
	}

	const response = await fetch(url, {
		...init,
		credentials: "same-origin",
		headers,
	})
	if (!response.ok) {
		throw new Error(`WTR API returned ${response.status}`)
	}
	return response.json()
}

export function hasPreferenceIdentifiers(candidate: DiscoveredTermCandidate | null | undefined): boolean {
	return Boolean(candidate?.sourceId && candidate?.hash && candidate?.lang)
}

export async function loadCurrentChapterCandidates(forceRefresh = false): Promise<DiscoveredTermCandidate[]> {
	const context = getReaderContext()
	if (!context.rawId || !context.chapterSlug) {
		return []
	}

	const cacheKey = getCacheKey("chapter", [context.lang, context.rawId, context.chapterSlug])
	if (!forceRefresh) {
		const cached = await readCache<DiscoveredTermCandidate[]>(cacheKey, CHAPTER_CACHE_TTL_MS)
		if (cached) {
			return cached
		}
	}

	const existingTerms = getExistingOriginalTerms()
	const visibleChapterText = getCurrentChapterText(context)
	const visibleCandidates = extractCurrentChapterCandidates(visibleChapterText, existingTerms, 75)
	if (visibleCandidates.length > 0) {
		await writeCache(cacheKey, visibleCandidates)
		return visibleCandidates
	}

	const pageMetadata = getReaderPageMetadata(context)
	const payload = buildReaderGetPayload({ ...context, ...pageMetadata })
	if (!payload) {
		return []
	}

	const headers = new Headers({ "Content-Type": "application/json" })
	const apiPayload = await fetchJson("/api/reader/get", {
		method: "POST",
		headers,
		body: JSON.stringify(payload),
	})
	const candidates = extractCurrentChapterCandidates(apiPayload, existingTerms, 75)
	await writeCache(cacheKey, candidates)
	return candidates
}

export async function loadNovelTermEntries(forceRefresh = false): Promise<DiscoveredTermCandidate[]> {
	const context = getReaderContext()
	if (!context.rawId) {
		return []
	}

	const cacheKey = getCacheKey("novel", [context.lang, context.rawId])
	if (!forceRefresh) {
		const cached = await readCache<DiscoveredTermCandidate[]>(cacheKey, NOVEL_TERMS_CACHE_TTL_MS)
		if (cached) {
			return cached
		}
	}

	const apiPayload = await fetchJson(`/api/v2/reader/terms/${encodeURIComponent(context.rawId)}.json`)
	const candidates = parseNovelTermEntries(apiPayload, context.lang, 200)
	await writeCache(cacheKey, candidates)
	return candidates
}

export async function loadReplacementSuggestions(
	candidate: DiscoveredTermCandidate | null | undefined,
	forceRefresh = false,
): Promise<ReplacementSuggestion[]> {
	if (!hasPreferenceIdentifiers(candidate)) {
		return []
	}

	const sourceId = candidate.sourceId as string
	const hash = candidate.hash as string
	const lang = candidate.lang as string
	const cacheKey = getCacheKey("preferences", [lang, sourceId, hash])
	if (!forceRefresh) {
		const cached = await readCache<ReplacementSuggestion[]>(cacheKey, PREFERENCES_CACHE_TTL_MS)
		if (cached) {
			return cached
		}
	}

	const params = new URLSearchParams({ source_id: sourceId, hash, lang })
	const apiPayload = await fetchJson(`/api/v2/term-preferences?${params.toString()}`)
	const suggestions = parseReplacementPreferences(apiPayload, 12)
	await writeCache(cacheKey, suggestions)
	return suggestions
}
