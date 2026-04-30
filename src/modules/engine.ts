// Core replacement engine for WTR Lab Term Replacer
import { state } from "./state"
import { escapeRegExp, getChapterIdFromUrl, log } from "./utils"
import { showProcessingIndicator } from "./ui"
import { CHAPTER_BODY_SELECTOR } from "./config"

export async function performReplacements(targetElement) {
	if (!targetElement) {
		log(state.globalSettings, "WTR Term Replacer: performReplacements called with null target element")
		return
	}

	log(state.globalSettings, "WTR Term Replacer: Starting performReplacements")
	showProcessingIndicator(true)
	await new Promise((resolve) => setTimeout(resolve, 10))

	if (state.settings.isDisabled || state.terms.length === 0) {
		log(
			state.globalSettings,
			`WTR Term Replacer: Skipping replacements - disabled: ${state.settings.isDisabled}, terms: ${state.terms.length}`,
		)
		showProcessingIndicator(false)
		return
	}

	try {
		log(
			state.globalSettings,
			`WTR Term Replacer: Found ${state.terms.length} terms to process, beginning replacement with retry mechanism`,
		)
		// Enhanced replacement with error handling and retry
		await performReplacementsWithRetry(targetElement, 3)
	} catch (error) {
		log(state.globalSettings, `WTR Term Replacer: Failed to perform replacements after retries:`, error)
		console.error("WTR Term Replacer: Replacement failed, but original content preserved")
	} finally {
		showProcessingIndicator(false)
		log(state.globalSettings, "WTR Term Replacer: performReplacements completed")
	}
}

async function performReplacementsWithRetry(targetElement, maxRetries) {
	let lastError = null
	let elementStabilityCounter = 0

	log(state.globalSettings, `WTR Term Replacer: Starting replacement process with ${maxRetries} retries`)

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			log(state.globalSettings, `WTR Term Replacer: Replacement attempt ${attempt}/${maxRetries}`)

			// Enhanced element stability validation
			if (!validateElementStability(targetElement, elementStabilityCounter)) {
				log(
					state.globalSettings,
					`WTR Term Replacer: Element stability check failed, attempt ${elementStabilityCounter}`,
				)
				// Re-acquire element reference for better stability
				const chapterId = getChapterIdFromUrl(window.location.href)
				if (chapterId) {
					const chapterSelector = `#${chapterId} ${CHAPTER_BODY_SELECTOR}`
					targetElement = document.querySelector(chapterSelector)
					if (!targetElement) {
						log(
							state.globalSettings,
							`WTR Term Replacer: Unable to re-acquire target element for chapter ${chapterId}`,
						)
						throw new Error("Unable to re-acquire target element")
					}
					log(state.globalSettings, `WTR Term Replacer: Re-acquired target element for chapter ${chapterId}`)
					elementStabilityCounter++
				} else {
					log(state.globalSettings, "WTR Term Replacer: Cannot determine chapter ID for element recovery")
					throw new Error("Cannot determine chapter ID for element recovery")
				}
			}

			// Additional DOM validation before proceeding
			if (!document.contains(targetElement) || !targetElement.parentNode) {
				log(state.globalSettings, "WTR Term Replacer: Target element validation failed - not in stable DOM")
				throw new Error("Target element not in stable DOM")
			}

			log(state.globalSettings, "WTR Term Replacer: Element validation passed, executing replacement logic")
			// Perform the actual replacement logic
			await executeReplacementLogic(targetElement)
			log(state.globalSettings, `WTR Term Replacer: Replacement attempt ${attempt} successful`)
			return // Success, exit retry loop
		} catch (error) {
			lastError = error
			log(state.globalSettings, `WTR Term Replacer: Replacement attempt ${attempt} failed:`, error.message)

			if (attempt < maxRetries) {
				// Progressive backoff with stability checks
				const delay = Math.min(100 * Math.pow(2, attempt - 1), 2000)
				log(state.globalSettings, `WTR Term Replacer: Retrying in ${delay}ms...`)
				await new Promise((resolve) => setTimeout(resolve, delay))

				// Pre-retry stability check
				if (error.message && error.message.includes("DOM")) {
					elementStabilityCounter++
				}
			} else {
				log(state.globalSettings, `WTR Term Replacer: All ${maxRetries} attempts failed, giving up`)
			}
		}
	}

	// All retries failed
	log(
		state.globalSettings,
		`WTR Term Replacer: All replacement attempts failed, throwing error: ${lastError?.message || "Unknown error"}`,
	)
	throw lastError || new Error("Unknown replacement error")
}

// Enhanced element stability validation
function validateElementStability(element, stabilityCounter) {
	if (!element || !document.contains(element)) {
		return false
	}

	// Check if element is visible and attached to DOM
	const rect = element.getBoundingClientRect()
	if (rect.width === 0 || rect.height === 0) {
		return false
	}

	// Check parent chain is stable
	let parent = element.parentNode
	let stabilityCheckCount = 0
	while (parent && stabilityCheckCount < 10) {
		if (!document.contains(parent)) {
			return false
		}
		parent = parent.parentNode
		stabilityCheckCount++
	}

	// Allow limited DOM recreation (stabilityCounter < 3)
	return stabilityCounter < 3
}

export async function executeReplacementLogic(targetElement) {
	// Validate target element state before processing
	if (!targetElement || targetElement.nodeType !== Node.ELEMENT_NODE) {
		throw new Error("Invalid target element")
	}

	// Additional DOM stability validation
	if (!validateElementStability(targetElement, 0)) {
		throw new Error("Target element DOM stability check failed")
	}

	// Check if element has meaningful content to process
	const textContent = targetElement.textContent?.trim() || ""
	if (textContent.length === 0) {
		const chapterId = getChapterIdFromUrl(window.location.href) || "unknown"
		const contentLength = targetElement.textContent?.length || 0
		log(
			state.globalSettings,
			`WTR Term Replacer: Target element has no text content in chapter ${chapterId} (${contentLength} chars), skipping`,
		)
		return
	}

	// Collect all text nodes and aggregate into a single string.
	const walker = document.createTreeWalker(targetElement, NodeFilter.SHOW_TEXT)
	const textNodes = []
	let node
	while ((node = walker.nextNode())) {
		if (!node.parentElement.closest(".wtr-replacer-ui, script, style")) {
			textNodes.push(node)
		}
	}

	const nodeValues = new Map()
	const nodeMap = []
	let fullText = ""
	let currentPos = 0

	textNodes.forEach((n) => {
		if (!state.originalTextNodes.has(n)) {
			state.originalTextNodes.set(n, n.nodeValue)
		}
		const originalValue = state.originalTextNodes.get(n)
		nodeValues.set(n, originalValue)

		if (originalValue.length > 0) {
			nodeMap.push({ node: n, start: currentPos, end: currentPos + originalValue.length })
		}
		fullText += originalValue
		currentPos += originalValue.length
	})

	if (!fullText.trim()) {
		showProcessingIndicator(false)
		return
	}

	// Categorize terms
	const simple_cs_partial = new Map()
	const simple_cs_whole = new Map()
	const simple_ci_partial = new Map()
	const simple_ci_whole = new Map()
	const regex_terms = []

	for (const term of state.terms) {
		if (!term.original) {
			continue
		}
		if (term.isRegex) {
			try {
				const flags = term.caseSensitive ? "g" : "gi"
				regex_terms.push({
					pattern: new RegExp(term.original, flags),
					replacement: term.replacement,
				})
			} catch (e) {
				console.error(`Skipping invalid regex for term "${term.original}":`, e)
			}
		} else {
			const key = term.caseSensitive ? term.original : term.original.toLowerCase()
			const value = term.replacement
			if (term.caseSensitive) {
				if (term.wholeWord) {
					simple_cs_whole.set(key, value)
				} else {
					simple_cs_partial.set(key, value)
				}
			} else {
				if (term.wholeWord) {
					simple_ci_whole.set(key, value)
				} else {
					simple_ci_partial.set(key, value)
				}
			}
		}
	}

	// Compile categorized terms into combined patterns.
	const compiledTerms = [...regex_terms]
	const addSimpleGroup = (map, flags, wholeWord, caseSensitive) => {
		if (map.size > 0) {
			const sortedKeys = [...map.keys()].sort((a, b) => b.length - a.length)
			const patterns = sortedKeys.map((k) => {
				const escaped = escapeRegExp(k)
				return wholeWord ? `\\b${escaped}\\b` : escaped
			})
			const combined = patterns.join("|")
			compiledTerms.push({
				pattern: new RegExp(combined, flags),
				replacement_map: map,
				is_simple: true,
				case_sensitive: caseSensitive,
			})
		}
	}

	addSimpleGroup(simple_cs_partial, "g", false, true)
	addSimpleGroup(simple_cs_whole, "g", true, true)
	addSimpleGroup(simple_ci_partial, "gi", false, false)
	addSimpleGroup(simple_ci_whole, "gi", true, false)

	// Find ALL possible matches from all compiled terms.
	const allMatches = []
	for (const comp of compiledTerms) {
		for (const match of fullText.matchAll(comp.pattern)) {
			if (match.index === match.index + match[0].length) {
				continue
			} // Skip zero-length matches

			let replacementText
			if (comp.is_simple) {
				const key = comp.case_sensitive ? match[0] : match[0].toLowerCase()
				replacementText = comp.replacement_map.get(key)
			} else {
				replacementText = comp.replacement
			}

			if (replacementText !== undefined) {
				allMatches.push({
					start: match.index,
					end: match.index + match[0].length,
					replacement: replacementText,
				})
			}
		}
	}

	// Resolve overlaps: Sort by start index, then by end index descending (longest match wins).
	allMatches.sort((a, b) => {
		if (a.start !== b.start) {
			return a.start - b.start
		}
		return b.end - a.end
	})

	// Select the non-overlapping "winning" matches.
	const winningMatches = []
	let lastEnd = -1
	for (const match of allMatches) {
		if (match.start >= lastEnd) {
			winningMatches.push(match)
			lastEnd = match.end
		}
	}

	// Apply winning matches to the nodeValues map, from last to first.
	for (const match of winningMatches.reverse()) {
		const { start: matchStart, end: matchEnd, replacement: replacementString } = match

		const affectedNodesInfo = []
		for (const info of nodeMap) {
			if (info.start < matchEnd && info.end > matchStart) {
				affectedNodesInfo.push(info)
			}
		}

		if (affectedNodesInfo.length === 0) {
			continue
		}

		const firstNodeInfo = affectedNodesInfo[0]
		const lastNodeInfo = affectedNodesInfo[affectedNodesInfo.length - 1]
		const startNode = firstNodeInfo.node
		const lastNode = lastNodeInfo.node

		const startOffset = matchStart - firstNodeInfo.start
		const endOffset = matchEnd - lastNodeInfo.start

		if (startNode === lastNode) {
			const currentVal = nodeValues.get(startNode)
			nodeValues.set(
				startNode,
				currentVal.substring(0, startOffset) + replacementString + currentVal.substring(endOffset),
			)
		} else {
			const lastVal = nodeValues.get(lastNode)
			nodeValues.set(lastNode, lastVal.substring(endOffset))

			for (let i = 1; i < affectedNodesInfo.length - 1; i++) {
				nodeValues.set(affectedNodesInfo[i].node, "")
			}

			const firstVal = nodeValues.get(startNode)
			nodeValues.set(startNode, firstVal.substring(0, startOffset) + replacementString)
		}
	}

	// After all processing, apply the final values to the DOM.
	for (const n of textNodes) {
		const finalValue = nodeValues.get(n)
		if (n.nodeValue !== finalValue) {
			n.nodeValue = finalValue
		}
	}

	showProcessingIndicator(false)
}

export function traverseAndRevert(node) {
	if (node.nodeType === Node.TEXT_NODE) {
		if (state.originalTextNodes.has(node)) {
			node.nodeValue = state.originalTextNodes.get(node)
		}
		return
	}
	if (
		node.nodeType === Node.ELEMENT_NODE &&
		node.tagName.toLowerCase() !== "script" &&
		node.tagName.toLowerCase() !== "style"
	) {
		if (node.classList.contains("wtr-replacer-ui")) {
			return
		}
		for (const child of node.childNodes) {
			traverseAndRevert(child)
		}
	}
}

export async function revertAllReplacements(targetElement) {
	if (!targetElement) {
		return
	}
	showProcessingIndicator(true)
	await new Promise((resolve) => setTimeout(resolve, 10))
	traverseAndRevert(targetElement)
	showProcessingIndicator(false)
}
