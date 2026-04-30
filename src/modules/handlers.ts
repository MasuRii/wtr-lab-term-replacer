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
	getDiscoveryCandidateKey,
	isReplacementSuggestionRequestCurrent,
} from "./termDiscoveryHelpers"
import {
	hasPreferenceIdentifiers,
	loadCurrentChapterCandidates,
	loadNovelTermEntries,
	loadReplacementSuggestions,
} from "./termDiscovery"
import { getVersion } from "../../config/versions"

// Export hideUIPanel function that can be called from UI
export function hideUIPanel() {
	log(state.globalSettings, "WTR Term Replacer: UI panel hide requested")
	uiHideUIPanel()
}

export function switchToDiscoveryAssistant() {
	switchTab("discover")
	initializeTermDiscovery()
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

function ensureDiscoveryState() {
	if (!state.termDiscovery) {
		state.termDiscovery = {
			chapterCandidates: [],
			novelTerms: [],
			replacementSuggestions: [],
			autocompleteCandidates: [],
			selectedCandidate: null,
			status: "Idle",
			lastSearch: "",
		}
	}
	return state.termDiscovery
}

function setDiscoveryStatus(message: string) {
	ensureDiscoveryState().status = message
	const statusEl = document.getElementById("wtr-discovery-status")
	if (statusEl) {
		statusEl.textContent = message
	}
}

function createTermCandidateItem(candidate: DiscoveredTermCandidate, sourceType: string, index: number): HTMLLIElement {
	const li = document.createElement("li")
	li.className = "wtr-discovery-result-item"

	const details = document.createElement("div")
	details.className = "wtr-discovery-result-details"

	const termText = document.createElement("strong")
	termText.textContent = candidate.term
	details.appendChild(termText)

	if (candidate.replacement) {
		const replacementText = document.createElement("span")
		replacementText.className = "wtr-discovery-replacement-preview"
		replacementText.textContent = ` → ${candidate.replacement}`
		details.appendChild(replacementText)
	}

	const meta = document.createElement("small")
	const metaParts = [`${candidate.source === "chapter" ? "chapter" : "novel"} candidate`]
	if (candidate.count > 0) {
		metaParts.push(candidate.source === "chapter" ? `${candidate.count} matches` : `score ${candidate.count}`)
	}
	if (hasPreferenceIdentifiers(candidate)) {
		metaParts.push("popularity available")
	}
	meta.textContent = metaParts.join(" • ")
	details.appendChild(meta)

	const button = document.createElement("button")
	button.type = "button"
	button.className = "btn btn-primary btn-sm wtr-discovery-use-btn"
	button.dataset.sourceType = sourceType
	button.dataset.index = String(index)
	button.textContent = "Use"

	li.appendChild(details)
	li.appendChild(button)
	return li
}

function renderCandidateList(containerId: string, candidates: DiscoveredTermCandidate[], sourceType: string, emptyText: string) {
	const list = document.getElementById(containerId)
	if (!list) {
		return
	}
	list.textContent = ""
	if (candidates.length === 0) {
		const empty = document.createElement("li")
		empty.className = "wtr-discovery-empty"
		empty.textContent = emptyText
		list.appendChild(empty)
		return
	}
	const fragment = document.createDocumentFragment()
	candidates.forEach((candidate, index) => {
		fragment.appendChild(createTermCandidateItem(candidate, sourceType, index))
	})
	list.appendChild(fragment)
}

function getFilteredNovelTerms(query: string): DiscoveredTermCandidate[] {
	const discovery = ensureDiscoveryState()
	const normalizedQuery = query.trim().toLocaleLowerCase()
	const novelTerms = discovery.novelTerms as DiscoveredTermCandidate[]
	if (!normalizedQuery) {
		return novelTerms.slice(0, 20)
	}
	return novelTerms
		.filter(
			(candidate) =>
				candidate.term.toLocaleLowerCase().includes(normalizedQuery) ||
				(candidate.replacement || "").toLocaleLowerCase().includes(normalizedQuery),
		)
		.slice(0, 30)
}

function renderDiscoveryResults() {
	const discovery = ensureDiscoveryState()
	renderCandidateList(
		"wtr-current-chapter-candidates",
		discovery.chapterCandidates as DiscoveredTermCandidate[],
		"chapter",
		"No current-chapter candidates loaded yet.",
	)
	renderCandidateList(
		"wtr-novel-term-results",
		getFilteredNovelTerms(discovery.lastSearch || ""),
		"novel",
		"No novel-wide terms match this search.",
	)
	setDiscoveryStatus(discovery.status || "Idle")
}

function renderAddTermAutocomplete(candidates: DiscoveredTermCandidate[]) {
	const discovery = ensureDiscoveryState()
	const container = document.getElementById("wtr-add-term-autocomplete-results")
	if (!container) {
		discovery.autocompleteCandidates = []
		return
	}
	container.textContent = ""
	discovery.autocompleteCandidates = candidates.slice(0, 8)
	if (discovery.autocompleteCandidates.length === 0) {
		return
	}
	const fragment = document.createDocumentFragment()
	;(discovery.autocompleteCandidates as DiscoveredTermCandidate[]).forEach((candidate, index) => {
		const button = document.createElement("button")
		button.type = "button"
		button.className = "wtr-autocomplete-option"
		button.dataset.index = String(index)
		button.textContent = candidate.replacement ? `${candidate.term} → ${candidate.replacement}` : candidate.term
		fragment.appendChild(button)
	})
	container.appendChild(fragment)
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
	label.textContent = "Popular replacements:"
	container.appendChild(label)
	const buttonWrap = document.createElement("div")
	buttonWrap.className = "wtr-replacement-suggestion-buttons"
	suggestions.forEach((suggestion) => {
		const button = document.createElement("button")
		button.type = "button"
		button.className = "btn btn-secondary btn-sm wtr-replacement-suggestion-btn"
		button.dataset.replacement = suggestion.replacement
		button.textContent = suggestion.count > 0 ? `${suggestion.replacement} (${suggestion.count})` : suggestion.replacement
		buttonWrap.appendChild(button)
	})
	container.appendChild(buttonWrap)
}

function findNovelCandidateByTerm(term: string): DiscoveredTermCandidate | null {
	const normalizedTerm = term.trim().toLocaleLowerCase()
	if (!normalizedTerm) {
		return null
	}
	const discovery = ensureDiscoveryState()
	return (
		(discovery.novelTerms as DiscoveredTermCandidate[]).find(
			(candidate) => candidate.term.toLocaleLowerCase() === normalizedTerm,
		) || null
	)
}

let replacementSuggestionRequestId = 0

function isActiveReplacementSuggestionRequest(
	requestId: number,
	candidate: DiscoveredTermCandidate | null,
	inputValue: string,
): boolean {
	const originalInput = document.getElementById("wtr-original")
	const currentInputValue = originalInput ? originalInput.value.trim() : ""
	const discovery = ensureDiscoveryState()
	return isReplacementSuggestionRequestCurrent(
		requestId,
		replacementSuggestionRequestId,
		getDiscoveryCandidateKey(candidate),
		getDiscoveryCandidateKey(discovery.selectedCandidate as DiscoveredTermCandidate | null),
		inputValue,
		currentInputValue,
	)
}

async function updateReplacementSuggestionsForCandidate(candidate: DiscoveredTermCandidate | null) {
	const discovery = ensureDiscoveryState()
	discovery.selectedCandidate = candidate
	const requestId = ++replacementSuggestionRequestId
	const originalInput = document.getElementById("wtr-original")
	const inputValue = originalInput ? originalInput.value.trim() : ""
	if (!candidate) {
		discovery.replacementSuggestions = []
		renderReplacementSuggestions([])
		return
	}
	if (!hasPreferenceIdentifiers(candidate)) {
		discovery.replacementSuggestions = []
		renderReplacementSuggestions([], "No popularity data is available for this term.")
		return
	}
	try {
		const suggestions = await loadReplacementSuggestions(candidate)
		if (!isActiveReplacementSuggestionRequest(requestId, candidate, inputValue)) {
			return
		}
		ensureDiscoveryState().replacementSuggestions = suggestions
		renderReplacementSuggestions(suggestions, suggestions.length ? "" : "No popular replacements found yet.")
	} catch (error) {
		if (!isActiveReplacementSuggestionRequest(requestId, candidate, inputValue)) {
			return
		}
		log(state.globalSettings, "WTR Term Replacer: Replacement suggestions unavailable", error)
		renderReplacementSuggestions([], "Popularity suggestions are unavailable right now.")
	}
}

export function clearDiscoveryFormState() {
	if (autocompleteTimeout) {
		clearTimeout(autocompleteTimeout)
		autocompleteTimeout = null
	}
	const discovery = ensureDiscoveryState()
	discovery.autocompleteCandidates = []
	discovery.replacementSuggestions = []
	discovery.selectedCandidate = null
	replacementSuggestionRequestId++
	const autocompleteContainer = document.getElementById("wtr-add-term-autocomplete-results")
	if (autocompleteContainer) {
		autocompleteContainer.textContent = ""
	}
	const suggestionsContainer = document.getElementById("wtr-replacement-suggestions")
	if (suggestionsContainer) {
		suggestionsContainer.textContent = ""
	}
}

async function chooseDiscoveryCandidate(candidate: DiscoveredTermCandidate | null) {
	if (!candidate) {
		return
	}
	showUIPanel()
	showFormView()
	const originalInput = document.getElementById("wtr-original")
	const replacementInput = document.getElementById("wtr-replacement")
	originalInput.value = candidate.term
	if (candidate.replacement) {
		replacementInput.value = candidate.replacement
	}
	originalInput.dispatchEvent(new Event("input", { bubbles: true }))
	replacementInput.dispatchEvent(new Event("input", { bubbles: true }))
	replacementInput.focus()
	await updateReplacementSuggestionsForCandidate(candidate)
}

let autocompleteTimeout: ReturnType<typeof setTimeout> | null = null

export async function handleDiscoveryRefreshChapter() {
	setDiscoveryStatus("Loading current-chapter candidates...")
	try {
		const candidates = await loadCurrentChapterCandidates(true)
		ensureDiscoveryState().chapterCandidates = candidates
		setDiscoveryStatus(candidates.length ? `Loaded ${candidates.length} current-chapter candidates.` : "No chapter candidates found.")
	} catch (error) {
		log(state.globalSettings, "WTR Term Replacer: Current-chapter discovery failed", error)
		setDiscoveryStatus("Current-chapter API data is unavailable right now.")
	} finally {
		renderDiscoveryResults()
	}
}

export async function handleDiscoveryRefreshNovel() {
	setDiscoveryStatus("Loading novel-wide term data...")
	try {
		const candidates = await loadNovelTermEntries(true)
		ensureDiscoveryState().novelTerms = candidates
		setDiscoveryStatus(candidates.length ? `Loaded ${candidates.length} novel-wide terms.` : "No novel-wide terms found.")
	} catch (error) {
		log(state.globalSettings, "WTR Term Replacer: Novel-wide discovery failed", error)
		setDiscoveryStatus("Novel-wide term API data is unavailable right now.")
	} finally {
		renderDiscoveryResults()
	}
}

export function handleDiscoverySearch(event) {
	ensureDiscoveryState().lastSearch = event.target.value || ""
	renderDiscoveryResults()
}

export function handleDiscoveryCandidateClick(event) {
	const button = event.target.closest(".wtr-discovery-use-btn")
	if (!button) {
		return
	}
	const discovery = ensureDiscoveryState()
	const sourceType = button.dataset.sourceType
	const index = Number(button.dataset.index)
	const candidates = sourceType === "chapter" ? discovery.chapterCandidates : getFilteredNovelTerms(discovery.lastSearch || "")
	chooseDiscoveryCandidate(candidates[index] || null)
}

export async function initializeTermDiscovery() {
	const discovery = ensureDiscoveryState()
	if ((discovery.novelTerms as DiscoveredTermCandidate[]).length === 0) {
		try {
			discovery.novelTerms = await loadNovelTermEntries(false)
		} catch (error) {
			log(state.globalSettings, "WTR Term Replacer: Cached novel-wide discovery unavailable", error)
		}
	}
	renderDiscoveryResults()
}

export function handleAddTermAutocompleteInput(event) {
	if (autocompleteTimeout) {
		clearTimeout(autocompleteTimeout)
	}
	autocompleteTimeout = setTimeout(async () => {
		const query = event.target.value || ""
		const discovery = ensureDiscoveryState()
		const selectedCandidate = discovery.selectedCandidate as DiscoveredTermCandidate | null
		if (selectedCandidate && selectedCandidate.term === query.trim()) {
			renderAddTermAutocomplete([])
			return
		}
		if ((discovery.novelTerms as DiscoveredTermCandidate[]).length === 0) {
			try {
				discovery.novelTerms = await loadNovelTermEntries(false)
			} catch (error) {
				log(state.globalSettings, "WTR Term Replacer: Add-term autocomplete unavailable", error)
			}
		}
		const candidates = getFilteredNovelTerms(query)
		renderAddTermAutocomplete(query.trim() ? candidates : [])
		updateReplacementSuggestionsForCandidate(findNovelCandidateByTerm(query))
	}, 250)
}

export function handleAddTermAutocompleteClick(event) {
	const button = event.target.closest(".wtr-autocomplete-option")
	if (!button) {
		return
	}
	const container = document.getElementById("wtr-add-term-autocomplete-results")
	const discovery = ensureDiscoveryState()
	const candidates = discovery.autocompleteCandidates as DiscoveredTermCandidate[]
	const candidate = candidates[Number(button.dataset.index)] || null
	chooseDiscoveryCandidate(candidate)
	discovery.autocompleteCandidates = []
	if (container) {
		container.textContent = ""
	}
}

export function handleReplacementSuggestionClick(event) {
	const button = event.target.closest(".wtr-replacement-suggestion-btn")
	if (!button) {
		return
	}
	const replacementInput = document.getElementById("wtr-replacement")
	if (replacementInput) {
		replacementInput.value = button.dataset.replacement || ""
		replacementInput.dispatchEvent(new Event("input", { bubbles: true }))
		replacementInput.focus()
	}
}

export async function handleSaveTerm() {
	log(state.globalSettings, "WTR Term Replacer: Handle save term started")
	const id = document.getElementById("wtr-term-id").value
	const originalInput = document.getElementById("wtr-original")
	const replacementInput = document.getElementById("wtr-replacement")
	const original = originalInput.value.trim()
	const isRegex = document.getElementById("wtr-is-regex").checked
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
		if (targetTab === "discover") {
			initializeTermDiscovery()
		}
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
