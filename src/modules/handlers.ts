// Event handler functions for WTR Lab Term Replacer
import { state } from "./state"
import {
	saveTerms,
	saveSettings,
	saveSearchFieldValue,
	loadData,
	processAndSaveTerms,
	processAndSaveSettings,
	saveGlobalSettings,
	saveTermListLocation,
} from "./storage"

// Re-export saveTermListLocation for UI module
export { saveTermListLocation }
import {
	showFormView,
	renderTermList,
	showUIPanel,
	hideUIPanel as uiHideUIPanel,
	showUILoader,
	hideUILoader,
	switchTab,
	clearTermList,
	syncFloatingAddTermButtonPosition,
} from "./ui"
import { reprocessCurrentChapter } from "./observer"
import { computeDupGroups, updateDupModeAfterChange } from "./duplicates"
import { debounce, findChapterBodyForUrl, getReaderContextFromPath, log } from "./utils"
import { performReplacements, revertAllReplacements } from "./engine"
import {
	DiscoveredTermCandidate,
	ReplacementSuggestion,
	getReplacementSuggestionLookupTerms,
	getSuggestionPresenceLabelsFromValues,
	loadReplacementSuggestionBatches,
	mergeRefreshReplacementSuggestions,
	selectReplacementSuggestionCandidates,
	shouldDisplaySuggestionCount,
} from "./termDiscoveryHelpers"
import {
	hasPreferenceIdentifiers,
	loadNovelTermEntries,
	loadReplacementSuggestions,
} from "./termDiscovery"
import { getVersion } from "../../config/versions"

// Export hideUIPanel function that can be called from UI
export function hideUIPanel() {
	log(state.globalSettings, "WTR Term Replacer: UI panel hide requested")
	uiHideUIPanel()
}

export function validateRegex(pattern) {
	try {
		new RegExp(pattern)
		log(state.globalSettings, `WTR Term Replacer: Valid regex pattern: ${pattern}`)
		return true
	} catch (e) {
		log(state.globalSettings, `WTR Term Replacer: Invalid regex pattern: ${pattern} - ${e.message}`)
		return false
	}
}

// Silent validation for real-time visual feedback
export function validateRegexSilent(pattern) {
	try {
		new RegExp(pattern)
		return { isValid: true, error: null }
	} catch (e) {
		return { isValid: false, error: e.message }
	}
}

type SuggestionTargetField = "original" | "replacement"

interface WtrPopoverTermContext {
	original: string
	sourceTerm: string
	suggestions: ReplacementSuggestion[]
}

function ensureDiscoveryState() {
	if (!state.termDiscovery) {
		state.termDiscovery = {
			novelTerms: [],
			replacementSuggestions: [],
			selectedCandidate: null,
		}
	}
	return state.termDiscovery
}

function getSuggestionPresenceLabels(suggestion: string): string[] {
	const originalField = document.getElementById("wtr-original") as HTMLInputElement | HTMLTextAreaElement | null
	const replacementField = document.getElementById("wtr-replacement") as HTMLInputElement | HTMLTextAreaElement | null
	return getSuggestionPresenceLabelsFromValues(suggestion, originalField?.value || "", replacementField?.value || "")
}

function shouldShowSuggestionCount(suggestion: ReplacementSuggestion): boolean {
	return shouldDisplaySuggestionCount(suggestion)
}

function getDisplaySourceLabel(sourceLabel = "WTR"): string {
	return sourceLabel === "API" ? "Community" : sourceLabel
}

function getSuggestionVisualMeta(suggestion: ReplacementSuggestion) {
	const sourceLabel = getDisplaySourceLabel(suggestion.sourceLabel || "WTR")
	const normalizedSource = sourceLabel.toLowerCase()
	if (shouldShowSuggestionCount(suggestion)) {
		return { kind: "profile", icon: "profile", sourceLabel }
	}
	if (normalizedSource.includes("google")) {
		return { kind: "google", icon: "g_translate", sourceLabel }
	}
	if (normalizedSource.includes("source")) {
		return { kind: "source", icon: "text_fields", sourceLabel }
	}
	if (normalizedSource.includes("field")) {
		return { kind: "field", icon: "edit", sourceLabel }
	}
	return { kind: "wtr", icon: "dictionary", sourceLabel }
}

function createSuggestionIcon(iconName: string): SVGElement {
	const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
	svg.setAttribute("class", "icon inline-flex shrink-0 size-4")
	svg.setAttribute("aria-hidden", "true")
	const use = document.createElementNS("http://www.w3.org/2000/svg", "use")
	use.setAttribute("href", `#${iconName}`)
	svg.appendChild(use)
	return svg
}

function renderReplacementSuggestions(suggestions: ReplacementSuggestion[], message = "") {
	const container = document.getElementById("wtr-replacement-suggestions")
	if (!container) {
		return
	}
	container.textContent = ""
	if (message) {
		const messageEl = document.createElement("small")
		messageEl.textContent = message
		container.appendChild(messageEl)
		return
	}
	if (suggestions.length === 0) {
		return
	}
	const label = document.createElement("small")
	label.textContent = "Suggestions:"
	container.appendChild(label)
	const buttonWrap = document.createElement("div")
	buttonWrap.className = "wtr-replacement-suggestion-buttons"
	suggestions.forEach((suggestion) => {
		const presenceLabels = getSuggestionPresenceLabels(suggestion.replacement)
		const visualMeta = getSuggestionVisualMeta(suggestion)
		const displayCount = shouldShowSuggestionCount(suggestion) ? suggestion.count : 0
		const metaParts = [visualMeta.sourceLabel, displayCount > 0 ? String(displayCount) : "", ...presenceLabels].filter(Boolean)
		const presenceClasses = [
			presenceLabels.length ? "wtr-suggestion-existing" : "",
			presenceLabels.includes("Original") ? "wtr-suggestion-in-original" : "",
			presenceLabels.includes("Replacement") ? "wtr-suggestion-in-replacement" : "",
		]
			.filter(Boolean)
			.join(" ")
		const button = document.createElement("button")
		button.type = "button"
		button.className = `wtr-replacement-suggestion-btn wtr-suggestion-${visualMeta.kind}${presenceClasses ? ` ${presenceClasses}` : ""}`
		button.dataset.replacement = suggestion.replacement
		button.title = metaParts.join(" • ")

		const iconSegment = document.createElement("span")
		iconSegment.className = "wtr-suggestion-icon-segment"
		iconSegment.appendChild(createSuggestionIcon(visualMeta.icon))
		if (displayCount > 0) {
			const countLabel = document.createElement("span")
			countLabel.textContent = String(displayCount)
			iconSegment.appendChild(countLabel)
		}
		button.appendChild(iconSegment)

		const replacementLabel = document.createElement("span")
		replacementLabel.className = "wtr-suggestion-label"
		replacementLabel.textContent = suggestion.replacement
		button.appendChild(replacementLabel)

		const sourceBadge = document.createElement("span")
		sourceBadge.className = "wtr-suggestion-source-badge"
		sourceBadge.textContent = visualMeta.sourceLabel
		button.appendChild(sourceBadge)

		buttonWrap.appendChild(button)
	})
	container.appendChild(buttonWrap)
}

function normalizeReplacementSuggestion(
	replacement: string,
	count = 0,
	sourceLabel = "",
	sourceRank = 50,
): ReplacementSuggestion | null {
	const normalizedReplacement = replacement.replace(/\s+/g, " ").trim()
	if (!normalizedReplacement) {
		return null
	}
	return { replacement: normalizedReplacement, count, sourceLabel, sourceRank }
}

function mergeSuggestionLabels(existingLabel = "", newLabel = ""): string {
	const labels = new Set(
		[...existingLabel.split(" + "), ...newLabel.split(" + ")].map((label) => label.trim()).filter(Boolean),
	)
	return Array.from(labels).join(" + ")
}

function getSuggestionSourcePriority(suggestion: ReplacementSuggestion): number {
	const sourceLabel = (suggestion.sourceLabel || "").toLowerCase()
	return sourceLabel.includes("wtr") && sourceLabel.includes("api") ? -1 : 0
}

function dedupeReplacementSuggestions(suggestions: ReplacementSuggestion[]): ReplacementSuggestion[] {
	const deduped = new Map<string, ReplacementSuggestion>()
	suggestions.forEach((suggestion) => {
		const normalized = normalizeReplacementSuggestion(
			suggestion.replacement,
			suggestion.count,
			suggestion.sourceLabel,
			suggestion.sourceRank,
		)
		if (!normalized) {
			return
		}
		const key = normalized.replacement
		const existing = deduped.get(key)
		if (!existing) {
			deduped.set(key, normalized)
			return
		}
		existing.count = Math.max(existing.count, normalized.count)
		existing.sourceRank = Math.min(existing.sourceRank ?? 50, normalized.sourceRank ?? 50)
		existing.sourceLabel = mergeSuggestionLabels(existing.sourceLabel, normalized.sourceLabel)
	})
	return Array.from(deduped.values()).sort(
		(a, b) =>
			(a.sourceRank ?? 50) - (b.sourceRank ?? 50) ||
			getSuggestionSourcePriority(a) - getSuggestionSourcePriority(b) ||
			b.count - a.count ||
			a.replacement.localeCompare(b.replacement),
	)
}

function replacementSuggestionsFromValues(
	values: string[],
	sourceLabel = "WTR",
	sourceRank = 50,
): ReplacementSuggestion[] {
	return dedupeReplacementSuggestions(
		values
			.map((value) => normalizeReplacementSuggestion(value, 0, sourceLabel, sourceRank))
			.filter((suggestion): suggestion is ReplacementSuggestion => Boolean(suggestion)),
	)
}

function getOriginalInputOptions() {
	const originalInput = document.getElementById("wtr-original")
	const regexCheckbox = document.getElementById("wtr-is-regex")
	const caseSensitiveCheckbox = document.getElementById("wtr-case-sensitive")
	return {
		value: originalInput ? originalInput.value.trim() : "",
		isRegex: Boolean(regexCheckbox?.checked),
		caseSensitive: Boolean(caseSensitiveCheckbox?.checked),
	}
}

function findNovelCandidatesByOriginalInput(
	original: string,
	isRegex: boolean,
	caseSensitive: boolean,
): DiscoveredTermCandidate[] {
	const discovery = ensureDiscoveryState()
	const novelTerms = discovery.novelTerms as DiscoveredTermCandidate[]
	const lookupTerms = getReplacementSuggestionLookupTerms(original, isRegex)
	const readerContext = getReaderContextFromPath(window.location.pathname)
	return selectReplacementSuggestionCandidates(novelTerms, lookupTerms, isRegex, caseSensitive, 20, readerContext)
}

let replacementSuggestionRequestId = 0
let replacementSuggestionTimeout: ReturnType<typeof setTimeout> | null = null
let suppressNextReplacementSuggestionInput = false
let activeSuggestionTarget: SuggestionTargetField = "replacement"

function isActiveReplacementSuggestionRequest(requestId: number, inputValue: string): boolean {
	return requestId === replacementSuggestionRequestId && getOriginalInputOptions().value === inputValue
}

function getOriginalInputFieldSuggestions(value: string, isRegex: boolean): ReplacementSuggestion[] {
	if (!isRegex) {
		return []
	}
	return normalizeOriginalRegexPattern(value)
		.split("|")
		.map((part) => normalizeReplacementSuggestion(part, 0, "Field", 5))
		.filter((suggestion): suggestion is ReplacementSuggestion => Boolean(suggestion))
}

async function updateReplacementSuggestionsForCandidates(
	candidates: DiscoveredTermCandidate[],
	inputValue: string,
	mergeExisting = false,
	forceRefreshSuggestions = false,
	seedSuggestions: ReplacementSuggestion[] = [],
) {
	const discovery = ensureDiscoveryState()
	const existingSuggestions = mergeExisting ? ([...(discovery.replacementSuggestions || [])] as ReplacementSuggestion[]) : []
	discovery.selectedCandidate = candidates[0] || null
	const requestId = ++replacementSuggestionRequestId
	if (candidates.length === 0) {
		const mergedExistingSuggestions = dedupeReplacementSuggestions([...existingSuggestions, ...seedSuggestions])
		discovery.replacementSuggestions = mergedExistingSuggestions
		renderReplacementSuggestions(mergedExistingSuggestions)
		return
	}

	const loadedSuggestions: ReplacementSuggestion[] = []
	const renderMergedSuggestions = (isFinalRender = false) => {
		if (!isActiveReplacementSuggestionRequest(requestId, inputValue)) {
			return
		}
		const mergedSuggestions = mergeRefreshReplacementSuggestions({
			existingSuggestions,
			seedSuggestions,
			candidates,
			loadedSuggestions,
			mergeExisting,
		})
		discovery.replacementSuggestions = mergedSuggestions
		renderReplacementSuggestions(
			mergedSuggestions,
			isFinalRender && !mergedSuggestions.length ? "No replacement suggestions found for this original text." : "",
		)
	}

	renderMergedSuggestions()

	await loadReplacementSuggestionBatches(
		candidates,
		async (candidate) => {
			if (!hasPreferenceIdentifiers(candidate)) {
				return [] as ReplacementSuggestion[]
			}
			try {
				return await loadReplacementSuggestions(candidate, forceRefreshSuggestions)
			} catch (error) {
				log(state.globalSettings, "WTR Term Replacer: Replacement suggestions unavailable", error)
				return [] as ReplacementSuggestion[]
			}
		},
		(_candidate, suggestions) => {
			loadedSuggestions.push(...suggestions)
			renderMergedSuggestions()
		},
	)

	renderMergedSuggestions(true)
}

export function clearDiscoveryFormState() {
	if (replacementSuggestionTimeout) {
		clearTimeout(replacementSuggestionTimeout)
		replacementSuggestionTimeout = null
	}
	const discovery = ensureDiscoveryState()
	discovery.replacementSuggestions = []
	discovery.selectedCandidate = null
	replacementSuggestionRequestId++
	const suggestionsContainer = document.getElementById("wtr-replacement-suggestions")
	if (suggestionsContainer) {
		suggestionsContainer.textContent = ""
	}
}

export function handleReplacementSuggestionInput(event) {
	if (event?.wtrSkipSuggestions) {
		return
	}
	if (suppressNextReplacementSuggestionInput) {
		suppressNextReplacementSuggestionInput = false
		return
	}
	if (replacementSuggestionTimeout) {
		clearTimeout(replacementSuggestionTimeout)
	}
	const mergeExisting = Boolean(event?.mergeExisting)
	replacementSuggestionTimeout = setTimeout(async () => {
		const sourceValue = event?.target?.value
		const options = getOriginalInputOptions()
		const query = typeof sourceValue === "string" ? sourceValue.trim() : options.value
		const discovery = ensureDiscoveryState()
		const fieldSuggestions = getOriginalInputFieldSuggestions(query, options.isRegex)
		if (!query) {
			updateReplacementSuggestionsForCandidates([], query, mergeExisting, false, fieldSuggestions)
			return
		}
		if ((discovery.novelTerms as DiscoveredTermCandidate[]).length === 0) {
			try {
				discovery.novelTerms = await loadNovelTermEntries(false)
			} catch (error) {
				log(state.globalSettings, "WTR Term Replacer: Replacement suggestions unavailable", error)
			}
		}
		updateReplacementSuggestionsForCandidates(
			findNovelCandidatesByOriginalInput(query, options.isRegex, options.caseSensitive),
			query,
			mergeExisting,
			false,
			fieldSuggestions,
		)
	}, 250)
}

export async function handleRefreshSuggestionsClick() {
	if (replacementSuggestionTimeout) {
		clearTimeout(replacementSuggestionTimeout)
		replacementSuggestionTimeout = null
	}
	const options = getOriginalInputOptions()
	if (!options.value) {
		renderReplacementSuggestions([], "Enter Original Text first, then refresh suggestions.")
		return
	}

	renderReplacementSuggestions([], "Refreshing suggestions...")
	try {
		const discovery = ensureDiscoveryState()
		discovery.novelTerms = await loadNovelTermEntries(true)
		await updateReplacementSuggestionsForCandidates(
			findNovelCandidatesByOriginalInput(options.value, options.isRegex, options.caseSensitive),
			options.value,
			false,
			true,
			getOriginalInputFieldSuggestions(options.value, options.isRegex),
		)
	} catch (error) {
		log(state.globalSettings, "WTR Term Replacer: Replacement suggestion refresh failed", error)
		renderReplacementSuggestions([], "Suggestions are unavailable right now.")
	}
}

export function handleSuggestionTargetFocus(event) {
	const fieldId = event?.target?.id
	if (fieldId === "wtr-original") {
		activeSuggestionTarget = "original"
	} else if (fieldId === "wtr-replacement") {
		activeSuggestionTarget = "replacement"
	}
}

function getExistingSuggestionTokens(value: string): Set<string> {
	return new Set(
		value
			.split(/\s*(?:\||\/|,|;|\n)\s*/)
			.map((token) => token.replace(/\s+/g, " ").trim().toLocaleLowerCase())
			.filter(Boolean),
	)
}

function getReplacementAppendSeparator(value: string, isRegex: boolean): string {
	if (value.includes("\n")) {
		return "\n"
	}
	if (value.includes(" | ")) {
		return " | "
	}
	if (value.includes("|")) {
		return "|"
	}
	if (value.includes(" / ") || value.includes("/")) {
		return " / "
	}
	if (value.includes(";")) {
		return "; "
	}
	if (value.includes(",")) {
		return ", "
	}
	return "|"
}

function normalizeOriginalRegexPattern(value: string): string {
	const deduped = new Map<string, string>()
	value
		.trim()
		.replace(/\s*\|\s*/g, "|")
		.replace(/\s*\/\s*/g, "|")
		.split("|")
		.map((part) => part.trim())
		.filter(Boolean)
		.forEach((part) => deduped.set(part, part))
	return Array.from(deduped.values())
		.sort((a, b) => b.length - a.length || a.localeCompare(b))
		.join("|")
}

export function normalizeOriginalRegexField() {
	const regexCheckbox = document.getElementById("wtr-is-regex") as HTMLInputElement | null
	const originalInput = document.getElementById("wtr-original") as HTMLTextAreaElement | null
	if (!regexCheckbox?.checked || !originalInput) {
		return
	}
	const normalized = normalizeOriginalRegexPattern(originalInput.value)
	if (normalized && normalized !== originalInput.value) {
		originalInput.value = normalized
		suppressNextReplacementSuggestionInput = true
		originalInput.dispatchEvent(new Event("input", { bubbles: true }))
	}
}

function getSuggestionAppendSeparator(value: string, isRegex: boolean, targetField: SuggestionTargetField): string {
	if (targetField === "original") {
		return "|"
	}
	return getReplacementAppendSeparator(value, isRegex)
}

function mergeSuggestionInputValue(
	currentValue: string,
	suggestion: string,
	isRegex: boolean,
	selectionStart: number | null,
	selectionEnd: number | null,
	targetField: SuggestionTargetField,
): string {
	const replacement = suggestion.trim()
	if (!replacement) {
		return currentValue
	}
	if (selectionStart !== null && selectionEnd !== null && selectionEnd > selectionStart) {
		return `${currentValue.slice(0, selectionStart)}${replacement}${currentValue.slice(selectionEnd)}`
	}
	const trimmedValue = currentValue.trim()
	if (!trimmedValue) {
		return replacement
	}
	if (getExistingSuggestionTokens(trimmedValue).has(replacement.replace(/\s+/g, " ").trim().toLocaleLowerCase())) {
		return currentValue
	}
	return `${currentValue.trimEnd()}${getSuggestionAppendSeparator(trimmedValue, isRegex, targetField)}${replacement}`
}

function normalizePopoverText(value: string | null | undefined): string {
	return (value || "").replace(/\s+/g, " ").trim()
}

function getElementClassText(element: Element | null): string {
	if (!element) {
		return ""
	}
	return typeof element.className === "string" ? element.className : element.getAttribute("class") || ""
}

function getPopoverBadgeCount(badge: Element): number {
	const countText = normalizePopoverText(badge.closest(".user-term")?.querySelector(".badge-segment span:last-child")?.textContent)
	if (!countText) {
		return 0
	}
	if (countText.endsWith("+")) {
		return Number.parseInt(countText, 10) || 0
	}
	return Number(countText) || 0
}

function getPopoverBadgeSuggestion(badge: Element): ReplacementSuggestion | null {
	const label = badge.querySelector("span:last-child") || badge
	const replacement = normalizePopoverText(label.textContent)
	if (!replacement) {
		return null
	}
	const userTerm = badge.closest(".user-term")
	const iconHref = badge.querySelector("use")?.getAttribute("href") || ""
	const classSource = `${getElementClassText(badge)} ${getElementClassText(userTerm)} ${iconHref}`
	if (/google|g_translate|bg-primary/i.test(classSource)) {
		return normalizeReplacementSuggestion(replacement, getPopoverBadgeCount(badge), "Google", 90)
	}
	if (/dictionary|bg-success/i.test(classSource)) {
		return normalizeReplacementSuggestion(replacement, getPopoverBadgeCount(badge), "WTR", 30)
	}
	if (userTerm) {
		return normalizeReplacementSuggestion(replacement, getPopoverBadgeCount(badge), "WTR", 40)
	}
	return normalizeReplacementSuggestion(replacement, getPopoverBadgeCount(badge), "WTR", 50)
}

function getNewPopoverSuggestion(candidate: Element): ReplacementSuggestion | null {
	const spans = Array.from(candidate.querySelectorAll("span"))
	const labelSpan = spans
		.slice()
		.reverse()
		.find((span) => {
			const text = normalizePopoverText(span.textContent)
			return text && !/^\d+\+?$/.test(text) && text !== "From" && text !== "To"
		})
	const replacement = normalizePopoverText(labelSpan?.textContent || candidate.textContent)
	if (!replacement || replacement === "From" || replacement === "To") {
		return null
	}

	const countText = spans.map((span) => normalizePopoverText(span.textContent)).find((text) => /^\d+\+?$/.test(text)) || ""
	const count = countText ? Number.parseInt(countText, 10) || 0 : 0
	const iconHref = candidate.querySelector("use")?.getAttribute("href") || ""
	const classSource = `${getElementClassText(candidate)} ${iconHref}`

	if (/g_translate|bg-google|google/i.test(classSource)) {
		return normalizeReplacementSuggestion(replacement, count, "Google", 90)
	}
	if (/dictionary|profile|green|success/i.test(classSource)) {
		return normalizeReplacementSuggestion(replacement, count, "WTR", 30)
	}
	return normalizeReplacementSuggestion(replacement, count, "WTR", 50)
}

function getNewWtrPopoverRoot(element: Element): Element | null {
	const candidate = element.matches('[data-slot="popover-content"], [role="dialog"]')
		? element
		: element.querySelector('[data-slot="popover-content"], [role="dialog"]') ||
			element.closest('[data-slot="popover-content"], [role="dialog"]')
	if (!candidate) {
		return null
	}

	const text = normalizePopoverText(candidate.textContent)
	const iconHrefs = Array.from(candidate.querySelectorAll("use")).map(
		(use) => use.getAttribute("href") || use.getAttribute("xlink:href") || "",
	)
	const hasTermChoices = iconHrefs.some((href) => /#(?:dictionary|g_translate|profile)/.test(href))
	return text.includes("From") && text.includes("To") && hasTermChoices ? candidate : null
}

function getNewPopoverSuggestionElements(popoverRoot: Element): Element[] {
	const byIcon = Array.from(popoverRoot.querySelectorAll("use"))
		.filter((use) => /#(?:dictionary|g_translate|profile)/.test(use.getAttribute("href") || use.getAttribute("xlink:href") || ""))
		.map((use) => use.closest('div[class*="inline-flex"][class*="cursor-pointer"]'))
		.filter((candidate): candidate is Element => Boolean(candidate))
	const byClass = Array.from(
		popoverRoot.querySelectorAll('div.inline-flex.cursor-pointer, div[class*="cursor-pointer"][class*="rounded"][class*="text-xs"]'),
	)
	return [...byIcon, ...byClass].filter(
		(candidate, index, list) =>
			!candidate.closest(".wtr-replacer-popover-actions") &&
			!candidate.closest("button") &&
			list.indexOf(candidate) === index,
	)
}

function getNewWtrPopoverContextFromElement(element: Element): WtrPopoverTermContext | null {
	const popoverRoot = getNewWtrPopoverRoot(element)
	if (!popoverRoot) {
		return null
	}

	const sourceTerm = normalizePopoverText(popoverRoot.querySelector(".text-muted-foreground")?.textContent)
	const suggestionElements = getNewPopoverSuggestionElements(popoverRoot)
	const popoverSuggestions = suggestionElements
		.map(getNewPopoverSuggestion)
		.filter((suggestion): suggestion is ReplacementSuggestion => Boolean(suggestion))
	const recentContext = state.wtrPopoverTermContext || {}
	const recentSuggestions = Array.isArray(recentContext.suggestions) ? recentContext.suggestions : []
	const original = normalizePopoverText(recentContext.original) || popoverSuggestions[0]?.replacement || sourceTerm
	const resolvedSourceTerm = sourceTerm || normalizePopoverText(recentContext.sourceTerm)
	const sourceSuggestion = normalizeReplacementSuggestion(resolvedSourceTerm, 0, "Source", -10)
	const currentSuggestion = normalizeReplacementSuggestion(original, 0, "Current", 0)
	const resolvedSuggestions = dedupeReplacementSuggestions([
		...(sourceSuggestion ? [sourceSuggestion] : []),
		...(currentSuggestion ? [currentSuggestion] : []),
		...popoverSuggestions,
		...recentSuggestions,
	])

	if (!original && !resolvedSourceTerm && resolvedSuggestions.length === 0) {
		return null
	}
	return {
		original,
		sourceTerm: resolvedSourceTerm,
		suggestions: resolvedSuggestions,
	}
}

function getWtrPopoverContextFromElement(element: Element): WtrPopoverTermContext | null {
	const sourceTerm = normalizePopoverText(element.querySelector(".text-underscore")?.textContent)
	const popoverSuggestions = Array.from(element.querySelectorAll(".user-term .badge, .badge.bg-success, .badge.bg-primary"))
		.map(getPopoverBadgeSuggestion)
		.filter((suggestion): suggestion is ReplacementSuggestion => Boolean(suggestion))

	if (!sourceTerm && popoverSuggestions.length === 0) {
		return getNewWtrPopoverContextFromElement(element)
	}

	const recentContext = state.wtrPopoverTermContext || {}
	const recentSuggestions = Array.isArray(recentContext.suggestions) ? recentContext.suggestions : []
	const original = normalizePopoverText(recentContext.original) || popoverSuggestions[0]?.replacement || sourceTerm
	const resolvedSourceTerm = sourceTerm || normalizePopoverText(recentContext.sourceTerm)
	const sourceSuggestion = normalizeReplacementSuggestion(resolvedSourceTerm, 0, "Source", -10)
	const currentSuggestion = normalizeReplacementSuggestion(original, 0, "Current", 0)
	const resolvedSuggestions = dedupeReplacementSuggestions([
		...(sourceSuggestion ? [sourceSuggestion] : []),
		...(currentSuggestion ? [currentSuggestion] : []),
		...popoverSuggestions,
		...recentSuggestions,
	])

	if (!original && !resolvedSourceTerm && resolvedSuggestions.length === 0) {
		return null
	}
	return {
		original,
		sourceTerm: resolvedSourceTerm,
		suggestions: resolvedSuggestions,
	}
}

function mergePopoverContexts(
	primary: WtrPopoverTermContext | null,
	secondary: WtrPopoverTermContext | null,
): WtrPopoverTermContext | null {
	if (!primary) {
		return secondary
	}
	if (!secondary) {
		return primary
	}
	return {
		original: normalizePopoverText(primary.original) || normalizePopoverText(secondary.original),
		sourceTerm: normalizePopoverText(primary.sourceTerm) || normalizePopoverText(secondary.sourceTerm),
		suggestions: dedupeReplacementSuggestions([...(primary.suggestions || []), ...(secondary.suggestions || [])]),
	}
}

function encodePopoverContext(context: WtrPopoverTermContext): string {
	return JSON.stringify(context)
}

function decodePopoverContext(value: string | undefined): WtrPopoverTermContext | null {
	if (!value) {
		return null
	}
	try {
		return JSON.parse(value) as WtrPopoverTermContext
	} catch (_error) {
		return null
	}
}

function dispatchUiOnlyInput(element: Element | null) {
	if (!element) {
		return
	}
	const event = new Event("input", { bubbles: true })
	;(event as any).wtrSkipSuggestions = true
	element.dispatchEvent(event)
}

function openWtrPopoverTermContext(context: WtrPopoverTermContext) {
	showUIPanel()
	suppressNextReplacementSuggestionInput = true
	showFormView()
	if (replacementSuggestionTimeout) {
		clearTimeout(replacementSuggestionTimeout)
		replacementSuggestionTimeout = null
	}
	const originalInput = document.getElementById("wtr-original") as HTMLTextAreaElement | null
	const replacementInput = document.getElementById("wtr-replacement") as HTMLInputElement | null
	if (!originalInput || !replacementInput) {
		return
	}

	originalInput.value = context.original || context.suggestions[0]?.replacement || context.sourceTerm || ""
	originalInput.rows = Math.max(1, Math.ceil(originalInput.value.length / 40))
	replacementInput.value = ""
	dispatchUiOnlyInput(originalInput)
	dispatchUiOnlyInput(replacementInput)
	if (replacementSuggestionTimeout) {
		clearTimeout(replacementSuggestionTimeout)
		replacementSuggestionTimeout = null
	}
	suppressNextReplacementSuggestionInput = false
	ensureDiscoveryState().replacementSuggestions = dedupeReplacementSuggestions(context.suggestions)
	renderReplacementSuggestions(ensureDiscoveryState().replacementSuggestions as ReplacementSuggestion[])
	activeSuggestionTarget = "replacement"
	replacementInput.focus()
}

export function handleWtrTextPatchClick(event) {
	const patch = event.target?.closest?.(".text-patch[data-hash]")
	if (!patch) {
		return
	}
	const visibleText = normalizePopoverText(patch.textContent)
	const sourceTerm = normalizePopoverText(patch.getAttribute("data-hash"))
	const sourceSuggestion = normalizeReplacementSuggestion(sourceTerm, 0, "Source", -10)
	const currentSuggestion = normalizeReplacementSuggestion(visibleText, 0, "Current", 0)
	state.wtrPopoverTermContext = {
		original: visibleText,
		sourceTerm,
		suggestions: [sourceSuggestion, currentSuggestion].filter(
			(suggestion): suggestion is ReplacementSuggestion => Boolean(suggestion),
		),
	}
}

export function enhanceWtrTermPopovers(root: Document | Element = document) {
	const editors = [
		...(root instanceof Element && root.matches(".mini-term-editor") ? [root] : []),
		...Array.from(root.querySelectorAll(".mini-term-editor")),
	]
	editors.forEach((editor) => {
		if (editor.querySelector(".wtr-replacer-popover-actions")) {
			return
		}
		const popoverRoot = editor.closest(".popover-body") || editor
		const context = getWtrPopoverContextFromElement(popoverRoot)
		if (!context) {
			return
		}
		const encodedContext = encodePopoverContext(context)
		const actionColumn = editor.querySelector(".d-flex.flex-column.ms-2") || editor
		const buttonGroup = document.createElement("div")
		buttonGroup.className = "wtr-replacer-popover-actions"

		const openButton = document.createElement("button")
		openButton.type = "button"
		openButton.className = "mt-1 btn btn-outline-primary btn-sm wtr-replacer-popover-add-btn"
		openButton.textContent = "+ Replacer Term"
		openButton.dataset.wtrContext = encodedContext
		buttonGroup.appendChild(openButton)

		actionColumn.appendChild(buttonGroup)
	})

	const newPopoverRoots = [
		...(root instanceof Element && getNewWtrPopoverRoot(root) ? [getNewWtrPopoverRoot(root)] : []),
		...Array.from(root.querySelectorAll('[data-slot="popover-content"], [role="dialog"]')).map(getNewWtrPopoverRoot),
	].filter((popoverRoot, index, list): popoverRoot is Element => Boolean(popoverRoot) && list.indexOf(popoverRoot) === index)

	newPopoverRoots.forEach((popoverRoot) => {
		const context = getNewWtrPopoverContextFromElement(popoverRoot)
		if (!context) {
			return
		}
		const existingButton = popoverRoot.querySelector(".wtr-replacer-popover-add-btn") as HTMLButtonElement | null
		if (existingButton) {
			const mergedContext = mergePopoverContexts(decodePopoverContext(existingButton.dataset.wtrContext), context)
			if (mergedContext) {
				existingButton.dataset.wtrContext = encodePopoverContext(mergedContext)
			}
			return
		}
		const actionColumn =
			Array.from(popoverRoot.querySelectorAll("button")).find(
				(button) => normalizePopoverText(button.textContent) === "Term",
			)?.parentElement || popoverRoot.querySelector(".flex.flex-col.ms-2") || popoverRoot
		const sourceButton = Array.from(actionColumn.querySelectorAll("button")).find(
			(button) => normalizePopoverText(button.textContent) === "Term",
		)
		const openButton = document.createElement("button")
		openButton.type = "button"
		const sourceClassName = sourceButton?.className?.replace(/\bmt-auto\b/g, "").replace(/\s+/g, " ").trim()
		openButton.className = sourceClassName
			? `${sourceClassName} wtr-replacer-popover-add-btn`
			: "btn btn-outline-primary btn-sm wtr-replacer-popover-add-btn"
		openButton.style.marginTop = "0.25rem"
		openButton.textContent = "+ Replacer"
		openButton.dataset.wtrContext = encodePopoverContext(context)
		if (actionColumn instanceof HTMLElement) {
			actionColumn.style.gap = "0.25rem"
		}
		actionColumn.appendChild(openButton)
	})
}

function getNormalizedTermValue(value: string | null | undefined): string {
	return normalizePopoverText(value).toLocaleLowerCase()
}

function getContextLookupValues(context: WtrPopoverTermContext): string[] {
	const values = new Map<string, string>()
	const addValue = (value: string | null | undefined) => {
		const normalized = normalizePopoverText(value)
		if (normalized) {
			values.set(normalized.toLocaleLowerCase(), normalized)
		}
	}
	addValue(context.original)
	addValue(context.sourceTerm)
	context.suggestions.forEach((suggestion) => addValue(suggestion.replacement))
	return Array.from(values.values())
}

function termMatchesLookupValue(term, lookupValues: string[]): boolean {
	const normalizedLookupValues = lookupValues.map(getNormalizedTermValue).filter(Boolean)
	const directValues = [term.original, term.replacement, ...Array.from(getExistingSuggestionTokens(term.original || ""))]
	if (directValues.some((value) => normalizedLookupValues.includes(getNormalizedTermValue(value)))) {
		return true
	}
	if (term.isRegex && term.original) {
		try {
			const regex = new RegExp(term.original, term.caseSensitive ? "" : "i")
			return lookupValues.some((value) => regex.test(value))
		} catch (_error) {
			return false
		}
	}
	return false
}

function findExistingTermsForContext(context: WtrPopoverTermContext) {
	const lookupValues = getContextLookupValues(context)
	if (lookupValues.length === 0) {
		return []
	}
	return state.terms.filter((term) => termMatchesLookupValue(term, lookupValues))
}

function removeExistingTermModal() {
	document.querySelector(".wtr-existing-term-modal")?.remove()
}

function showExistingTermModal(context: WtrPopoverTermContext, existingTerms) {
	removeExistingTermModal()
	showUIPanel()
	const overlay = document.createElement("div")
	overlay.className = "wtr-existing-term-modal"

	const card = document.createElement("div")
	card.className = "wtr-existing-term-card"
	overlay.appendChild(card)

	const header = document.createElement("div")
	header.className = "wtr-existing-term-header"
	header.textContent = "Existing Term Found"
	card.appendChild(header)

	const body = document.createElement("div")
	body.className = "wtr-existing-term-body"
	const message = document.createElement("p")
	message.textContent = "This WTR term already appears in your Term Replacer storage. Open the saved term instead of creating a duplicate."
	body.appendChild(message)

	const list = document.createElement("div")
	list.className = "wtr-existing-term-list"
	existingTerms.slice(0, 5).forEach((term) => {
		const openButton = document.createElement("button")
		openButton.type = "button"
		openButton.className = "wtr-existing-term-open-btn"
		openButton.textContent = `${term.original} → ${term.replacement}`
		openButton.addEventListener("click", () => {
			removeExistingTermModal()
			showUIPanel()
			showFormView(term)
		})
		list.appendChild(openButton)
	})
	body.appendChild(list)
	card.appendChild(body)

	const actions = document.createElement("div")
	actions.className = "wtr-existing-term-actions"
	const closeButton = document.createElement("button")
	closeButton.type = "button"
	closeButton.className = "btn btn-secondary btn-sm"
	closeButton.textContent = "Close"
	closeButton.addEventListener("click", removeExistingTermModal)
	const addAnywayButton = document.createElement("button")
	addAnywayButton.type = "button"
	addAnywayButton.className = "btn btn-primary btn-sm"
	addAnywayButton.textContent = "Add Anyway"
	addAnywayButton.addEventListener("click", () => {
		removeExistingTermModal()
		openWtrPopoverTermContext(context)
	})
	actions.appendChild(closeButton)
	actions.appendChild(addAnywayButton)
	card.appendChild(actions)

	overlay.addEventListener("click", (modalEvent) => {
		if (modalEvent.target === overlay) {
			removeExistingTermModal()
		}
	})
	document.body.appendChild(overlay)
}

export function handleWtrPopoverAddTermClick(event) {
	const button = event.target?.closest?.(".wtr-replacer-popover-add-btn")
	if (!button) {
		return
	}
	event.preventDefault()
	event.stopPropagation()
	const popoverRoot =
		button.closest('[data-slot="popover-content"], [role="dialog"], .popover-body') || button.closest(".popover-body") || button
	const context = mergePopoverContexts(decodePopoverContext(button.dataset.wtrContext), getWtrPopoverContextFromElement(popoverRoot))
	if (!context) {
		return
	}
	button.dataset.wtrContext = encodePopoverContext(context)
	const existingTerms = findExistingTermsForContext(context)
	if (existingTerms.length > 0) {
		showExistingTermModal(context, existingTerms)
		return
	}
	openWtrPopoverTermContext(context)
}

export function handleReplacementSuggestionClick(event) {
	const button = event.target.closest(".wtr-replacement-suggestion-btn")
	if (!button) {
		return
	}
	const originalInput = document.getElementById("wtr-original") as HTMLTextAreaElement | null
	const replacementInput = document.getElementById("wtr-replacement") as HTMLInputElement | null
	const regexCheckbox = document.getElementById("wtr-is-regex")
	const targetField = activeSuggestionTarget
	const targetInput = targetField === "original" ? originalInput : replacementInput
	if (targetInput) {
		targetInput.value = mergeSuggestionInputValue(
			targetInput.value,
			button.dataset.replacement || "",
			Boolean(regexCheckbox?.checked),
			targetInput.selectionStart,
			targetInput.selectionEnd,
			targetField,
		)
		if (targetField === "original") {
			suppressNextReplacementSuggestionInput = true
		}
		targetInput.dispatchEvent(new Event("input", { bubbles: true }))
		targetInput.focus()
	}
}

export async function handleSaveTerm() {
	log(state.globalSettings, "WTR Term Replacer: Handle save term started")
	const id = document.getElementById("wtr-term-id").value
	const originalInput = document.getElementById("wtr-original")
	const replacementInput = document.getElementById("wtr-replacement")
	const isRegex = document.getElementById("wtr-is-regex").checked
	let original = originalInput.value.trim()
	if (isRegex) {
		original = normalizeOriginalRegexPattern(original)
		originalInput.value = original
	}
	const wholeWord = document.getElementById("wtr-whole-word").checked

	log(
		state.globalSettings,
		`WTR Term Replacer: Saving term - original: "${original}", replacement: "${replacementInput.value}", isRegex: ${isRegex}, wholeWord: ${wholeWord}, caseSensitive: ${document.getElementById("wtr-case-sensitive").checked}`,
	)

	if (!original) {
		log(state.globalSettings, "WTR Term Replacer: Save term failed - empty original text")
		return // No error message shown, rely on disabled save button
	}
	if (isRegex && !validateRegex(original)) {
		log(state.globalSettings, "WTR Term Replacer: Save term failed - invalid regex pattern")
		return // No error message shown, rely on visual feedback
	}

	const newTerm = {
		id: id || `term_${Date.now()}`,
		original,
		replacement: replacementInput.value,
		caseSensitive: document.getElementById("wtr-case-sensitive").checked,
		isRegex,
		wholeWord: isRegex ? false : wholeWord,
	}

	const existingIndex = state.terms.findIndex((t) => t.id === newTerm.id)
	if (existingIndex > -1) {
		log(state.globalSettings, `WTR Term Replacer: Updating existing term ${newTerm.id}`)
		state.terms[existingIndex] = newTerm
	} else {
		log(state.globalSettings, `WTR Term Replacer: Adding new term ${newTerm.id}`)
		state.terms.push(newTerm)
	}

	await saveTerms(state.terms)
	log(state.globalSettings, `WTR Term Replacer: Term saved successfully, total terms: ${state.terms.length}`)
	reprocessCurrentChapter()

	// Clear form fields
	originalInput.value = ""
	replacementInput.value = ""
	originalInput.dispatchEvent(new Event("input", { bubbles: true }))
	replacementInput.dispatchEvent(new Event("input", { bubbles: true }))
	document.getElementById("wtr-term-id").value = ""
	document.getElementById("wtr-case-sensitive").checked = false
	document.getElementById("wtr-is-regex").checked = false
	document.getElementById("wtr-whole-word").checked = false
	document.getElementById("wtr-save-btn").textContent = "Save Term"
	clearDiscoveryFormState()

	renderTermList(state.currentSearchValue)

	if (id) {
		log(state.globalSettings, "WTR Term Replacer: Switching to terms tab after update")
		switchTab("terms")
	} else {
		log(state.globalSettings, "WTR Term Replacer: Focusing on original input for next term")
		originalInput.focus()
	}

	if (state.isDupMode) {
		log(state.globalSettings, "WTR Term Replacer: Updating duplicate mode after term change")
		updateDupModeAfterChange()
	}
}

export function handleListInteraction(e) {
	const termId = e.target.closest("li")?.dataset.id
	if (!termId) {
		return
	}
	if (e.target.classList.contains("wtr-edit-btn")) {
		const term = state.terms.find((t) => t.id === termId)
		if (term) {
			showFormView(term)
		}
	}
}

export async function handleDeleteSelected() {
	log(state.globalSettings, "WTR Term Replacer: Delete selected terms started")
	showUILoader()
	try {
		const selectedIds = [...document.querySelectorAll(".wtr-replacer-term-select:checked")].map(
			(cb) => cb.dataset.id,
		)
		log(
			state.globalSettings,
			`WTR Term Replacer: Found ${selectedIds.length} terms selected for deletion: ${selectedIds.join(", ")}`,
		)

		if (selectedIds.length === 0) {
			log(state.globalSettings, "WTR Term Replacer: Delete cancelled - no terms selected")
			alert("No terms selected.")
			return
		}

		if (confirm(`Delete ${selectedIds.length} term(s)?`)) {
			log(state.globalSettings, "WTR Term Replacer: User confirmed deletion, proceeding...")
			const filteredTerms = state.terms.filter((t) => !selectedIds.includes(t.id))
			log(
				state.globalSettings,
				`WTR Term Replacer: Deleting ${state.terms.length - filteredTerms.length} terms, ${filteredTerms.length} remaining`,
			)

			await saveTerms(filteredTerms)
			await loadData()
			log(state.globalSettings, "WTR Term Replacer: Terms deleted and data reloaded")
			reprocessCurrentChapter()

			if (state.isDupMode) {
				log(state.globalSettings, "WTR Term Replacer: Updating duplicate mode after deletion")
				updateDupModeAfterChange()
			} else {
				log(state.globalSettings, "WTR Term Replacer: Refreshing term list display")
				renderTermList(state.currentSearchValue)
			}
		} else {
			log(state.globalSettings, "WTR Term Replacer: Delete cancelled by user")
		}
	} catch (error) {
		log(state.globalSettings, `WTR Term Replacer: Error during term deletion: ${error.message}`)
		console.error("Error during term deletion:", error)
	} finally {
		hideUILoader()
	}
}

function getSelectionAnchorElement(selection: Selection | null): Element | null {
	const anchorNode = selection?.anchorNode || null
	if (!anchorNode) {
		return null
	}
	return anchorNode.nodeType === Node.ELEMENT_NODE ? (anchorNode as Element) : anchorNode.parentElement
}

export const handleTextSelection = debounce((e) => {
	const CHAPTER_BODY_SELECTOR = ".chapter-body"
	const selection = window.getSelection()
	const selectedText = selection?.toString().trim() || ""

	const floatBtn = document.querySelector(".wtr-add-term-float-btn") as HTMLElement | null
	if (!floatBtn) {
		return
	}

	// Skip the expensive DOM queries when there is no active selection.
	if (!selectedText) {
		floatBtn.style.display = "none"
		return
	}

	const eventTarget = e.target instanceof Element ? e.target : null
	const anchorElement = getSelectionAnchorElement(selection)
	const isChapterSelection = Boolean(
		eventTarget?.closest(CHAPTER_BODY_SELECTOR) || anchorElement?.closest(CHAPTER_BODY_SELECTOR),
	)
	if (!isChapterSelection) {
		floatBtn.style.display = "none"
		return
	}
	if (selectedText.length > 0 && selectedText.length < 100) {
		syncFloatingAddTermButtonPosition()
		floatBtn.style.display = "flex"
	} else {
		floatBtn.style.display = "none"
	}
}, 150)

export function handleAddTermFromSelection() {
	const selection = window.getSelection().toString().trim()
	if (selection) {
		showUIPanel()
		showFormView()
		const originalInput = document.getElementById("wtr-original") as HTMLTextAreaElement | null
		if (originalInput) {
			originalInput.value = selection
			originalInput.dispatchEvent(new Event("input", { bubbles: true }))
		}
		document.getElementById("wtr-replacement").focus()
	}
	document.querySelector(".wtr-add-term-float-btn").style.display = "none"
}

export function handleSearch(e) {
	if (state.isDupMode) {
		return
	}
	state.currentSearchValue = e.target.value
	state.currentPage = 1
	renderTermList(state.currentSearchValue)

	// Immediately save the search field value for reactive behavior
	saveSearchFieldValue()
}

export async function handleDisableToggle(e) {
	state.settings.isDisabled = e.target.checked
	await saveSettings(state.settings)

	const chapterBody = findChapterBodyForUrl(document)
	if (chapterBody) {
		if (state.settings.isDisabled) {
			await revertAllReplacements(chapterBody)
		} else {
			await performReplacements(chapterBody)
		}
	}
}

export function downloadJSON(data, filename) {
	return new Promise<void>((resolve) => {
		const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
		const url = URL.createObjectURL(blob)
		const a = document.createElement("a")
		a.href = url
		a.download = filename
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
		URL.revokeObjectURL(url)
		resolve()
	})
}

// Enhanced Export Functions
export async function handleExportNovel() {
	const exportData = {
		formatVersion: getVersion(),
		settings: { [state.novelSlug]: state.settings },
		terms: { [state.novelSlug]: state.terms },
	}
	downloadJSON(exportData, `${state.novelSlug}-terms.json`)
}

export async function handleExportAll() {
	showUILoader()
	try {
		const allKeys = await GM_listValues()
		const TERMS_STORAGE_KEY_PREFIX = "wtr_lab_terms_"
		const SETTINGS_STORAGE_KEY_PREFIX = "wtr_lab_settings_"

		const termKeys = allKeys.filter((k) => k.startsWith(TERMS_STORAGE_KEY_PREFIX))
		const settingKeys = allKeys.filter((k) => k.startsWith(SETTINGS_STORAGE_KEY_PREFIX))
		const exportData = { formatVersion: getVersion(), settings: {}, terms: {} }

		for (const key of termKeys) {
			const slug = key.replace(TERMS_STORAGE_KEY_PREFIX, "")
			exportData.terms[slug] = await GM_getValue(key)
		}
		for (const key of settingKeys) {
			const slug = key.replace(SETTINGS_STORAGE_KEY_PREFIX, "")
			exportData.settings[slug] = await GM_getValue(key)
		}
		downloadJSON(exportData, "wtr-lab-all-terms-backup.json")
	} catch (e) {
		console.error("Error exporting all terms:", e)
		alert("Failed to export all terms.")
	} finally {
		hideUILoader()
	}
}

// Enhanced dual export functionality with sequential downloads
export async function handleExportCombined() {
	showUILoader()
	try {
		// Step 1: Export novel terms first
		const novelExportData = {
			formatVersion: getVersion(),
			settings: { [state.novelSlug]: state.settings },
			terms: { [state.novelSlug]: state.terms },
		}

		await downloadJSON(novelExportData, `${state.novelSlug}-terms.json`)

		// Step 2: Ask user for confirmation before proceeding to second download
		const userConfirmed = confirm(
			'The first file (Novel Terms) has been downloaded. Please check if the download completed successfully. Click "OK" to proceed with the second download (All Terms backup), or "Cancel" to skip.',
		)

		if (userConfirmed) {
			// Step 3: Export all terms only after user confirmation
			const allKeys = await GM_listValues()
			const TERMS_STORAGE_KEY_PREFIX = "wtr_lab_terms_"
			const SETTINGS_STORAGE_KEY_PREFIX = "wtr_lab_settings_"

			const termKeys = allKeys.filter((k) => k.startsWith(TERMS_STORAGE_KEY_PREFIX))
			const settingKeys = allKeys.filter((k) => k.startsWith(SETTINGS_STORAGE_KEY_PREFIX))
			const allExportData = { formatVersion: getVersion(), settings: {}, terms: {} }

			for (const key of termKeys) {
				const slug = key.replace(TERMS_STORAGE_KEY_PREFIX, "")
				allExportData.terms[slug] = await GM_getValue(key)
			}
			for (const key of settingKeys) {
				const slug = key.replace(SETTINGS_STORAGE_KEY_PREFIX, "")
				allExportData.settings[slug] = await GM_getValue(key)
			}

			await downloadJSON(allExportData, "wtr-lab-all-terms-backup.json")
			alert("Both files have been successfully exported!")
		} else {
			alert("Second export cancelled. Only the novel terms file was downloaded.")
		}
	} catch (e) {
		console.error("Error exporting combined terms:", e)
		alert("Failed to export combined terms. Please try again.")
	} finally {
		hideUILoader()
	}
}

export async function handleFileImport(event) {
	log(state.globalSettings, `WTR Term Replacer: File import started, import type: ${state.importType}`)
	showUILoader()
	try {
		const file = event.target.files[0]
		if (!file) {
			log(state.globalSettings, "WTR Term Replacer: No file selected for import")
			return
		}

		log(
			state.globalSettings,
			`WTR Term Replacer: Importing file: ${file.name}, size: ${file.size} bytes, type: ${file.type}`,
		)
		const reader = new FileReader()
		reader.onload = async (e) => {
			const content = String(e.target.result ?? "")
			log(state.globalSettings, `WTR Term Replacer: File content loaded, length: ${content.length} characters`)
			let importedData
			try {
				importedData = JSON.parse(content)
				log(state.globalSettings, "WTR Term Replacer: JSON parsed successfully")
			} catch (err) {
				log(state.globalSettings, `WTR Term Replacer: Import failed - invalid JSON: ${err.message}`)
				alert("Import failed. Invalid JSON data. Error: " + err.message)
				return
			}

			const isNewFormat = Boolean(importedData.formatVersion)
			let termsData
			let settingsData
			const isArrayData = Array.isArray(importedData)
			const isOldGlobal = !isNewFormat && !isArrayData && typeof importedData === "object"

			log(
				state.globalSettings,
				`WTR Term Replacer: Detected format - isNewFormat: ${isNewFormat}, isArrayData: ${isArrayData}, isOldGlobal: ${isOldGlobal}`,
			)

			if (isArrayData) {
				termsData = { [state.novelSlug]: importedData }
				log(state.globalSettings, "WTR Term Replacer: Array format detected, mapping to current novel")
			} else if (isOldGlobal) {
				termsData = importedData
				log(state.globalSettings, "WTR Term Replacer: Old global format detected")
			} else if (isNewFormat) {
				termsData = importedData.terms || {}
				settingsData = importedData.settings || {}
				log(
					state.globalSettings,
					`WTR Term Replacer: New format detected - terms: ${Object.keys(termsData).length} slugs, settings: ${Object.keys(settingsData).length} slugs`,
				)
			} else {
				log(state.globalSettings, "WTR Term Replacer: Import failed - unrecognized data format")
				alert("Import failed. Unrecognized data format.")
				return
			}

			let slugs = Object.keys(termsData)
			log(state.globalSettings, `WTR Term Replacer: Found data for ${slugs.length} slugs: ${slugs.join(", ")}`)

			if (state.importType === "novel" && slugs.length > 1) {
				log(state.globalSettings, "WTR Term Replacer: Novel import with multiple slugs - warning user")
				alert(
					"Warning: File contains data for multiple novels, but importing to current novel only. Use Global Import for all.",
				)
				termsData = { [state.novelSlug]: termsData[Object.keys(termsData)[0]] || [] }
				if (settingsData) {
					settingsData = { [state.novelSlug]: settingsData[Object.keys(settingsData)[0]] || {} }
				}
				slugs = [state.novelSlug]
			}

			let shouldImportSettings = false
			if (settingsData && Object.keys(settingsData).length > 0) {
				log(
					state.globalSettings,
					"WTR Term Replacer: Settings detected in import, asking user for confirmation",
				)
				shouldImportSettings = confirm(
					"This file contains settings. Would you like to import and overwrite your current settings?",
				)
			}
			let totalAdded = 0,
				totalSkipped = 0,
				totalConflicts = 0,
				invalidCount = 0,
				validCount = 0

			log(state.globalSettings, "WTR Term Replacer: Starting term import process...")

			for (const slug of slugs) {
				log(state.globalSettings, `WTR Term Replacer: Processing import for slug: ${slug}`)
				const existingTerms = await GM_getValue(`wtr_lab_terms_${slug}`, [])
				log(state.globalSettings, `WTR Term Replacer: Existing terms for ${slug}: ${existingTerms.length}`)

				let overwrite = true
				if (existingTerms.length > 0) {
					log(
						state.globalSettings,
						`WTR Term Replacer: Existing terms found for ${slug}, asking user about merge vs overwrite`,
					)
					overwrite = !confirm(
						`An existing term list was found for ${slug}. Would you like to merge? (OK = Merge, Cancel = Overwrite)`,
					)
					if (!overwrite) {
						if (!confirm("Are you sure you want to overwrite?")) {
							log(state.globalSettings, `WTR Term Replacer: User cancelled overwrite for ${slug}`)
							continue
						}
						overwrite = true
					}
				}

				const rawTerms = termsData[slug] || []
				log(state.globalSettings, `WTR Term Replacer: Raw terms for ${slug}: ${rawTerms.length}`)

				if (!Array.isArray(rawTerms)) {
					log(state.globalSettings, `WTR Term Replacer: Skipping ${slug} - not an array`)
					continue
				}

				const validatedTerms = rawTerms.filter((term) => {
					term.wholeWord = term.wholeWord ?? false
					if (term.isRegex) {
						try {
							new RegExp(term.original)
							validCount++
							return true
						} catch (err) {
							invalidCount++
							log(
								state.globalSettings,
								`WTR Term Replacer: Skipping invalid regex term: "${term.original}" - ${err.message}`,
							)
							console.warn(`Skipping invalid regex term on import: "${term.original}"`)
							return false
						}
					}
					validCount++
					return true
				})

				log(
					state.globalSettings,
					`WTR Term Replacer: Validated terms for ${slug}: ${validatedTerms.length} valid, ${invalidCount} invalid`,
				)

				const { added, skipped, conflicts } = await processAndSaveTerms(slug, validatedTerms, overwrite)
				totalAdded += added
				totalSkipped += skipped
				totalConflicts += conflicts

				log(
					state.globalSettings,
					`WTR Term Replacer: Import results for ${slug} - added: ${added}, skipped: ${skipped}, conflicts: ${conflicts}`,
				)
			}

			if (shouldImportSettings) {
				log(state.globalSettings, "WTR Term Replacer: Importing settings data...")
				await processAndSaveSettings(settingsData)
			}

			log(state.globalSettings, "WTR Term Replacer: Reloading data and reprocessing chapters...")
			await loadData()
			reprocessCurrentChapter()
			renderTermList(state.currentSearchValue)
			if (state.isDupMode) {
				updateDupModeAfterChange()
			}

			let summary = "Import successful!"
			log(
				state.globalSettings,
				`WTR Term Replacer: Import completed - totalAdded: ${totalAdded}, totalSkipped: ${totalSkipped}, totalConflicts: ${totalConflicts}, invalidCount: ${invalidCount}, validCount: ${validCount}`,
			)

			if (totalAdded > 0 || totalSkipped > 0 || totalConflicts > 0) {
				summary += `\n${totalAdded} new terms added. ${totalSkipped} duplicates skipped. ${totalConflicts} conflicts skipped.`
			}
			if (invalidCount > 0) {
				summary += `\n${validCount} terms imported. ${invalidCount} terms skipped due to invalid regex.`
			}

			alert(summary)
		}
		reader.readAsText(file)
		event.target.value = ""
		log(state.globalSettings, "WTR Term Replacer: File import process initiated")
	} catch (e) {
		log(state.globalSettings, `WTR Term Replacer: Import error: ${e.message}`)
		alert("An error occurred during import.")
		console.error(e)
	} finally {
		hideUILoader()
	}
}

export function handleTabSwitch(e) {
	const targetTab = e.target.dataset.tab

	// Save current state before switching (if on terms tab)
	const currentTab = document.querySelector(".wtr-replacer-tab-btn.active").dataset.tab
	if (currentTab === "terms") {
		// Save the full scroll position when leaving terms tab
		log(
			state.globalSettings,
			`WTR Term Replacer: Saving scroll position before switching from terms to ${targetTab}`,
		)
		saveTermListLocation()
	}

	document.querySelectorAll(".wtr-replacer-tab-btn").forEach((btn) => btn.classList.remove("active"))
	e.target.classList.add("active")
	document.querySelectorAll(".wtr-replacer-tab-content").forEach((content) => content.classList.remove("active"))
	document.getElementById(`wtr-tab-${targetTab}`).classList.add("active")

	if (targetTab === "terms") {
		log(state.globalSettings, "WTR Term Replacer: Restoring scroll position after switching to terms tab")
		restoreTermListLocation()
	} else {
		clearTermList()
	}
}

export async function handleFindDuplicates() {
	showUILoader()
	try {
		const TERMS_KEY = `wtr_lab_terms_${state.novelSlug}`
		const currentNovelTerms = await GM_getValue(TERMS_KEY, [])
		computeDupGroups(currentNovelTerms)
		if (state.dupKeys.length === 0) {
			alert("No duplicates found.")
			return
		}
		state.isDupMode = true
		state.currentDupIndex = 0
		state.currentSearchValue = ""
		setSearchFieldValue("")
	} finally {
		hideUILoader()
	}
}
// Use duplicate functions from duplicates module (imported above)

// Helper function to set search field value programmatically with reactive save
export function setSearchFieldValue(value) {
	const searchBar = document.getElementById("wtr-search-bar")
	if (searchBar) {
		searchBar.value = value
		state.currentSearchValue = value
		state.currentPage = 1
		renderTermList(state.currentSearchValue)
		saveSearchFieldValue()
	}
}

export async function restoreTermListLocation() {
	try {
		const saved = await GM_getValue(`wtr_lab_term_list_location_${state.novelSlug}`, null)
		if (saved) {
			state.savedTermListLocation = saved
			log(
				state.globalSettings,
				`WTR Term Replacer: Restoring scroll position - top: ${saved.scrollTop}, page: ${saved.page}`,
			)
		}
		state.currentPage = state.savedTermListLocation.page || 1
		state.currentSearchValue = state.savedTermListLocation.searchValue || ""

		// Apply the saved state to the UI
		const searchBar = document.getElementById("wtr-search-bar")
		if (searchBar && state.currentSearchValue) {
			searchBar.value = state.currentSearchValue
		}

		renderTermList(state.currentSearchValue)

		// Restore scroll position after a short delay to ensure rendering is complete
		setTimeout(() => {
			const termListContainer = document.querySelector(".wtr-replacer-content")
			if (termListContainer && state.savedTermListLocation.scrollTop) {
				termListContainer.scrollTop = state.savedTermListLocation.scrollTop
				log(
					state.globalSettings,
					`WTR Term Replacer: Scroll position restored to ${state.savedTermListLocation.scrollTop}`,
				)
			}
		}, 100)
	} catch (e) {
		console.error("Error restoring term list location:", e)
	}
}

export function toggleLogging() {
	state.globalSettings.isLoggingEnabled = !state.globalSettings.isLoggingEnabled
	saveGlobalSettings()
	alert(`Logging ${state.globalSettings.isLoggingEnabled ? "enabled" : "disabled"}.`)
}

// Additional functions needed for index.js integration
export async function addTermProgrammatically(original, replacement, isRegex = false) {
	if (!original) {
		return
	}
	const newTerm = {
		id: `term_${Date.now()}`,
		original: original.trim(),
		replacement: replacement.trim(),
		caseSensitive: false,
		isRegex: isRegex,
		wholeWord: isRegex ? false : false,
	}
	const isDuplicate = state.terms.some(
		(t) =>
			t.original === newTerm.original && t.replacement === newTerm.replacement && t.isRegex === newTerm.isRegex,
	)
	if (!isDuplicate) {
		state.terms.push(newTerm)
		await saveTerms(state.terms)
		log(
			state.globalSettings,
			`WTR Term Replacer: Programmatically added term (Regex: ${isRegex}): ${newTerm.original} -> ${newTerm.replacement}`,
		)
		if (document.querySelector(".wtr-replacer-ui").style.display === "flex") {
			renderTermList(state.currentSearchValue)
		}
	} else {
		log(state.globalSettings, `WTR Term Replacer: Skipped adding duplicate term: ${newTerm.original}`)
	}
}
