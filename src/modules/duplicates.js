// Duplicate detection logic for WTR Lab Term Replacer
import { state } from "./state"
import { renderTermList } from "./ui"

/**
 * Normalizes a term's original text into an array of its core components.
 * @param {object} term - The term object.
 * @returns {string[]} An array of normalized string components.
 */
function getNormalizedTermComponents(term) {
	const components = []
	const original = term.original
	const isSimpleAlternation = term.isRegex && !/[\\^$.*+?()[\]{}()]/.test(original)
	if (isSimpleAlternation) {
		components.push(...original.split("|"))
	} else {
		components.push(original)
	}
	return components
		.map((comp) => {
			let normalized = comp.trim().replace(/\s+/g, " ")
			if (!term.caseSensitive) {
				normalized = normalized.toLowerCase()
			}
			return normalized
		})
		.filter((comp) => comp.length > 0)
}

/**
 * Computes duplicate groups from a given array of terms.
 * @param {object[]} termsToScan - The array of terms to check for duplicates.
 */
export function computeDupGroups(termsToScan) {
	const componentMap = new Map()
	const replacementDupGroups = new Map()
	const allDupGroups = new Map()

	termsToScan.forEach((term) => {
		const components = getNormalizedTermComponents(term)
		if (components.length > 1) {
			const uniqueComponents = new Set(components)
			if (uniqueComponents.size < components.length) {
				const originalTextSnippet =
					term.original.length > 50 ? term.original.substring(0, 47) + "..." : term.original
				const key = `Internal duplicate in: "${originalTextSnippet}"`
				allDupGroups.set(key, [term])
			}
		}
		components.forEach((comp) => {
			if (!componentMap.has(comp)) {
				componentMap.set(comp, [])
			}
			const group = componentMap.get(comp)
			if (!group.some((t) => t.id === term.id)) {
				group.push(term)
			}
		})
		if (term.replacement) {
			const key = term.replacement
			if (!replacementDupGroups.has(key)) {
				replacementDupGroups.set(key, [])
			}
			replacementDupGroups.get(key).push(term)
		}
	})

	for (const [component, group] of componentMap.entries()) {
		if (group.length > 1) {
			allDupGroups.set(`Original component: "${component}"`, group)
		}
	}
	for (const [key, group] of replacementDupGroups.entries()) {
		if (group.length > 1) {
			const displayKey = `Replacement: "${key}"`
			if (allDupGroups.has(displayKey)) {
				const existingGroup = allDupGroups.get(displayKey)
				const newTerms = group.filter((t) => !existingGroup.some((et) => et.id === t.id))
				allDupGroups.set(displayKey, [...existingGroup, ...newTerms])
			} else {
				allDupGroups.set(displayKey, group)
			}
		}
	}

	state.dupGroups = allDupGroups
	state.dupKeys = Array.from(state.dupGroups.keys()).sort()
}

export function exitDupMode() {
	state.isDupMode = false
	state.currentDupIndex = 0
	state.dupGroups = new Map()
	state.dupKeys = []
	renderTermList(state.currentSearchValue)
}

export function changeDupGroup(delta) {
	state.currentDupIndex = Math.max(0, Math.min(state.dupKeys.length - 1, state.currentDupIndex + delta))
	renderTermList()
}

export function updateDupModeAfterChange() {
	computeDupGroups(state.terms) // Use the current in-memory `state.terms` array which has just been updated
	if (state.dupKeys.length === 0) {
		alert("All duplicates resolved.")
		exitDupMode()
		return
	}
	const oldKey = state.dupKeys[state.currentDupIndex]
	const newIndex = state.dupKeys.indexOf(oldKey)
	if (newIndex !== -1) {
		const group = state.dupGroups.get(oldKey)
		if (group && (group.length > 1 || oldKey.startsWith("Internal duplicate"))) {
			state.currentDupIndex = newIndex
		} else {
			state.currentDupIndex = Math.min(state.currentDupIndex, state.dupKeys.length - 1)
		}
	} else {
		state.currentDupIndex = Math.min(state.currentDupIndex, state.dupKeys.length - 1)
	}
	renderTermList()
}
