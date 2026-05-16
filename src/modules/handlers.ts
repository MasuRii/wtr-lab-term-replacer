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
} from "./ui"
import { reprocessCurrentChapter } from "./observer"
import { computeDupGroups, updateDupModeAfterChange } from "./duplicates"
import { log } from "./utils"
import { performReplacements, revertAllReplacements } from "./engine"
import {
	DiscoveredTermCandidate,
	ReplacementSuggestion,
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

function getFieldSuggestionTokens(fieldId: string): Set<string> {
	const field = document.getElementById(fieldId) as HTMLInputElement | HTMLTextAreaElement | null
	return getExistingSuggestionTokens(field?.value || "")
}

function getSuggestionPresenceLabels(suggestion: string): string[] {
	const labels: string[] = []
	const originalTokens = getFieldSuggestionTokens("wtr-original")
	const replacementTokens = getFieldSuggestionTokens("wtr-replacement")
	if (originalTokens.has(suggestion)) {
		labels.push("Original")
	}
	if (replacementTokens.has(suggestion)) {
		labels.push("Replacement")
	}
	return labels
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
		const button = document.createElement("button")
		button.type = "button"
		button.className = `btn btn-secondary btn-sm wtr-replacement-suggestion-btn${presenceLabels.length ? " wtr-suggestion-existing" : ""}`
		button.dataset.replacement = suggestion.replacement

		const replacementLabel = document.createElement("span")
		replacementLabel.textContent = suggestion.replacement
		button.appendChild(replacementLabel)

		const metaParts = [suggestion.sourceLabel, suggestion.count > 0 ? String(suggestion.count) : "", ...presenceLabels].filter(Boolean)
		if (metaParts.length > 0) {
			const sourceLabel = document.createElement("small")
			sourceLabel.className = "wtr-replacement-suggestion-source"
			sourceLabel.textContent = metaParts.join(" • ")
			button.appendChild(sourceLabel)
		}
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

function stripRegexSyntax(fragment: string): string {
	return fragment
		.replace(/\\[bBAZzG]/g, " ")
		.replace(/\\s[+*?]?/g, " ")
		.replace(/\\[dDwW][+*?]?/g, " ")
		.replace(/\[([^\]\\]+)\][+*?]?/g, (_match, chars) => chars.match(/[\p{L}\p{M}\p{N}'-]/u)?.[0] || " ")
		.replace(/\(\?[:=!<][^)]*\)/g, " ")
		.replace(/[()]/g, " ")
		.replace(/[{}+*?^$]/g, " ")
		.replace(/\\(.)/g, "$1")
		.replace(/\s+/g, " ")
		.trim()
}

function splitTopLevelAlternatives(value: string): string[] {
	const parts: string[] = []
	let current = ""
	let isEscaped = false
	let characterClassDepth = 0
	let groupDepth = 0

	for (const char of value) {
		if (isEscaped) {
			current += char
			isEscaped = false
			continue
		}
		if (char === "\\") {
			current += char
			isEscaped = true
			continue
		}
		if (char === "[") {
			characterClassDepth++
			current += char
			continue
		}
		if (char === "]" && characterClassDepth > 0) {
			characterClassDepth--
			current += char
			continue
		}
		if (characterClassDepth === 0 && char === "(") {
			groupDepth++
			current += char
			continue
		}
		if (characterClassDepth === 0 && char === ")" && groupDepth > 0) {
			groupDepth--
			current += char
			continue
		}
		if (characterClassDepth === 0 && groupDepth === 0 && char === "|") {
			parts.push(current)
			current = ""
			continue
		}
		current += char
	}
	parts.push(current)
	return parts
}

function getSuggestionLookupTerms(original: string, isRegex: boolean): string[] {
	const terms = new Map<string, string>()
	const addTerm = (value: string) => {
		const term = value.replace(/\s+/g, " ").trim()
		if (term.length >= 2) {
			terms.set(term.toLocaleLowerCase(), term)
		}
	}

	addTerm(original)
	const splitPattern = isRegex ? /[\n,;]+/ : /[\n,;|/]+/
	original.split(splitPattern).forEach(addTerm)

	if (isRegex) {
		for (const fragment of splitTopLevelAlternatives(original)) {
			addTerm(stripRegexSyntax(fragment))
			stripRegexSyntax(fragment)
				.split(/[|,;\n]+/)
				.forEach(addTerm)
		}
		stripRegexSyntax(original)
			.split(/[|,;\n]+/)
			.forEach(addTerm)
	}

	return Array.from(terms.values())
}

function findNovelCandidatesByOriginalInput(
	original: string,
	isRegex: boolean,
	caseSensitive: boolean,
): DiscoveredTermCandidate[] {
	const discovery = ensureDiscoveryState()
	const novelTerms = discovery.novelTerms as DiscoveredTermCandidate[]
	const deduped = new Map<string, DiscoveredTermCandidate>()
	const lookupTerms = getSuggestionLookupTerms(original, isRegex)
	const lookupSet = new Set(lookupTerms.map((term) => (caseSensitive ? term : term.toLocaleLowerCase())))
	const addCandidate = (candidate: DiscoveredTermCandidate) => {
		deduped.set(candidate.term.toLocaleLowerCase(), candidate)
	}
	const getCandidateLookupValues = (candidate: DiscoveredTermCandidate): string[] => [
		candidate.term,
		...(candidate.replacement ? [candidate.replacement] : []),
		...(candidate.replacementSuggestions || []),
	]

	for (const candidate of novelTerms) {
		const candidateValues = getCandidateLookupValues(candidate).map((value) => (caseSensitive ? value : value.toLocaleLowerCase()))
		if (candidateValues.some((candidateValue) => lookupSet.has(candidateValue))) {
			addCandidate(candidate)
		}
	}

	if (isRegex) {
		try {
			const regex = new RegExp(original, caseSensitive ? "" : "i")
			for (const candidate of novelTerms) {
				if (getCandidateLookupValues(candidate).some((value) => regex.test(value))) {
					addCandidate(candidate)
				}
			}
		} catch (_error) {
			// Invalid in-progress regex input still gets literal/variant suggestions from extracted terms.
		}
	}

	return Array.from(deduped.values()).slice(0, 10)
}

function mergeReplacementSuggestions(
	candidates: DiscoveredTermCandidate[],
	suggestions: ReplacementSuggestion[],
): ReplacementSuggestion[] {
	const mergedSuggestions: ReplacementSuggestion[] = []
	for (const candidate of candidates) {
		mergedSuggestions.push({
			replacement: candidate.term,
			count: candidate.count || 0,
			sourceLabel: "Source",
			sourceRank: -10,
		})
		const candidateReplacements = candidate.replacementSuggestions?.length
			? candidate.replacementSuggestions
			: candidate.replacement
				? [candidate.replacement]
				: []
		candidateReplacements.forEach((replacement) => {
			mergedSuggestions.push({
				replacement,
				count: candidate.count || 0,
				sourceLabel: "WTR",
				sourceRank: 30,
			})
		})
	}
	mergedSuggestions.push(
		...suggestions.map((suggestion) => ({
			...suggestion,
			sourceLabel: suggestion.sourceLabel || "API",
			sourceRank: suggestion.sourceRank ?? 40,
		})),
	)
	return dedupeReplacementSuggestions(mergedSuggestions)
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

	const loadedSuggestions = await Promise.all(
		candidates.map(async (candidate) => {
			if (!hasPreferenceIdentifiers(candidate)) {
				return [] as ReplacementSuggestion[]
			}
			try {
				return await loadReplacementSuggestions(candidate)
			} catch (error) {
				log(state.globalSettings, "WTR Term Replacer: Replacement suggestions unavailable", error)
				return [] as ReplacementSuggestion[]
			}
		}),
	)

	if (!isActiveReplacementSuggestionRequest(requestId, inputValue)) {
		return
	}

	const mergedSuggestions = dedupeReplacementSuggestions([
		...existingSuggestions,
		...seedSuggestions,
		...mergeReplacementSuggestions(candidates, loadedSuggestions.flat()),
	])
	discovery.replacementSuggestions = mergedSuggestions
	renderReplacementSuggestions(
		mergedSuggestions,
		mergedSuggestions.length ? "" : "No replacement suggestions found for this original text.",
	)
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
			updateReplacementSuggestionsForCandidates([], query, mergeExisting, fieldSuggestions)
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
			.map((token) => token.trim())
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
	if (getExistingSuggestionTokens(trimmedValue).has(replacement)) {
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

function getWtrPopoverContextFromElement(element: Element): WtrPopoverTermContext | null {
	const sourceTerm = normalizePopoverText(element.querySelector(".text-underscore")?.textContent)
	const popoverSuggestions = Array.from(element.querySelectorAll(".user-term .badge, .badge.bg-success, .badge.bg-primary"))
		.map(getPopoverBadgeSuggestion)
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

function openWtrPopoverTermContext(context: WtrPopoverTermContext) {
	showUIPanel()
	suppressNextReplacementSuggestionInput = true
	showFormView()
	const originalInput = document.getElementById("wtr-original") as HTMLTextAreaElement | null
	const replacementInput = document.getElementById("wtr-replacement") as HTMLInputElement | null
	if (!originalInput || !replacementInput) {
		return
	}

	originalInput.value = context.original || context.suggestions[0]?.replacement || context.sourceTerm || ""
	originalInput.rows = Math.max(1, Math.ceil(originalInput.value.length / 40))
	replacementInput.value = ""
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
}

export function handleWtrPopoverAddTermClick(event) {
	const button = event.target?.closest?.(".wtr-replacer-popover-add-btn")
	if (!button) {
		return
	}
	event.preventDefault()
	event.stopPropagation()
	const context = decodePopoverContext(button.dataset.wtrContext) || getWtrPopoverContextFromElement(button.closest(".popover-body") || button)
	if (!context) {
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

export function handleTextSelection(e) {
	const CHAPTER_BODY_SELECTOR = ".chapter-body"
	if (!e.target.closest(CHAPTER_BODY_SELECTOR)) {
		return
	}
	const selection = window.getSelection().toString().trim()
	const floatBtn = document.querySelector(".wtr-add-term-float-btn")
	if (selection && selection.length > 0 && selection.length < 100) {
		floatBtn.style.display = "block"
	} else {
		floatBtn.style.display = "none"
	}
}

export function handleAddTermFromSelection() {
	const selection = window.getSelection().toString().trim()
	if (selection) {
		showUIPanel()
		showFormView()
		document.getElementById("wtr-original").value = selection
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
	const getChapterIdFromUrl = (url) => {
		const match = url.match(/(chapter-\d+)/)
		return match ? match[1] : null
	}
	const CHAPTER_BODY_SELECTOR = ".chapter-body"

	const chapterId = getChapterIdFromUrl(window.location.href)
	if (!chapterId) {
		return
	}
	const chapterSelector = `#${chapterId} ${CHAPTER_BODY_SELECTOR}`
	const chapterBody = document.querySelector(chapterSelector)
	if (chapterBody) {
		if (state.settings.isDisabled) {
			revertAllReplacements(chapterBody)
		} else {
			performReplacements(chapterBody)
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
