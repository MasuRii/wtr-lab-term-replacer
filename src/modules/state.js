// State management for WTR Lab Term Replacer

export const state = {
	novelSlug: null,
	terms: [],
	settings: { isDisabled: false },
	globalSettings: { isLoggingEnabled: false },
	importType: "novel",
	currentSearchValue: "",
	isDupMode: false,
	dupGroups: new Map(),
	dupKeys: [],
	currentDupIndex: 0,
	currentPage: 1,
	savedTermListLocation: { page: 1, scrollTop: 0, searchValue: "" },
	originalTextNodes: new WeakMap(),
	otherWTRScripts: new Set(),
	processingStartTime: new Map(),
	domConflictDetected: false,
	multiScriptPerformanceImpact: new Map(),
	currentURL: window.location.href,
	processingQueue: new Set(),
	isProcessingInProgress: false,
	observedMenuContainers: new WeakSet(),
}

// Function to initialize novel slug - should be called after utils is loaded
export function initializeState() {
	if (!state.novelSlug) {
		// Import getNovelSlug function dynamically to avoid circular dependencies
		import("./utils").then(({ getNovelSlug }) => {
			state.novelSlug = getNovelSlug()
		})
	}
	return state.novelSlug
}

// Set novel slug (for synchronous initialization)
export function setNovelSlug(slug) {
	state.novelSlug = slug
}
