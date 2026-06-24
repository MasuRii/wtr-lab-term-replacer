// State management for WTR Lab Term Replacer

export const state: any = {
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
	processingQueue: new Set(),
	observedMenuContainers: new WeakSet(),
	termDiscovery: {
		novelTerms: [],
		replacementSuggestions: [],
		selectedCandidate: null,
	},
}

// Set novel slug (for synchronous initialization)
export function setNovelSlug(slug) {
	state.novelSlug = slug
}
