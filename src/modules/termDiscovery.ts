import { getReaderContextFromPath, type ReaderUrlContext } from "./utils"
import {
	DiscoveredTermCandidate,
	ReplacementSuggestion,
	buildTermsApiUrl,
	parseNovelTermEntries,
	parseReplacementPreferences,
} from "./termDiscoveryHelpers"

interface CacheEntry<T> {
	fetchedAt: number
	data: T
}

const TERM_SUGGESTION_CACHE_PREFIX = "wtr_lab_term_suggestion_cache_v1_"
const NOVEL_TERMS_CACHE_TTL_MS = 60 * 60 * 1000
const PREFERENCES_CACHE_TTL_MS = 6 * 60 * 60 * 1000

function getReaderContext(): ReaderUrlContext {
	return getReaderContextFromPath(window.location.pathname)
}

function getCsrfToken(): string | null {
	const meta = document.querySelector('meta[name="csrf-token"], meta[name="csrf_token"]')
	return meta?.getAttribute("content") || null
}

function getCacheKey(type: string, identifiers: string[]): string {
	return `${TERM_SUGGESTION_CACHE_PREFIX}${type}_${identifiers.filter(Boolean).join("_")}`
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
		// Suggestion cache is optional and must never block the main term workflow.
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

	const apiPayload = await fetchJson(buildTermsApiUrl(context.rawId, forceRefresh))
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
