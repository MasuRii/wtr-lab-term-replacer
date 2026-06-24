// MutationObserver and content handling for WTR Lab Term Replacer
import { state } from "./state"
import { performReplacements } from "./engine"
import { addMenuButton } from "./ui"
import { CHAPTER_BODY_SELECTOR } from "./config"
import {
	findChapterBodyById,
	findChapterBodyForUrl,
	getChapterProcessingId,
	log,
} from "./utils"

export function waitForInitialContent() {
	log(state.globalSettings, "WTR Term Replacer: Starting robust content detection for slow-loading websites...")

	// Set up mutation observer for dynamic content loading
	log(state.globalSettings, "WTR Term Replacer: Setting up content change observer")
	setupContentObserver()
}

function setupContentObserver() {
	// Watch for dynamic content loading with enhanced coordination
	let observerTimeout
	let lastCheckTime = 0
	let isContentChangeInProgress = false
	let potentialMultiScriptConflicts = 0

	const observer = new MutationObserver((mutations) => {
		// Prevent excessive triggering with timing constraints
		const now = Date.now()
		if (now - lastCheckTime < 2000) {
			// Minimum 2 seconds between checks
			return
		}

		let shouldCheckForContent = false
		const detectedScriptChanges = []

		for (const mutation of mutations) {
			if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
				// Check if substantial content was added
				for (const node of mutation.addedNodes) {
					if (node.nodeType === Node.ELEMENT_NODE) {
						const element = node as Element
						const textContent = element.textContent?.trim() || ""
						const className = typeof element.className === "string" ? element.className : element.getAttribute("class") || ""

						// Detect multi-script data attributes being added
						if (element.hasAttribute?.("data-smart-quotes-processed")) {
							detectedScriptChanges.push("Smart Quotes")
							shouldCheckForContent = true
						}
						if (element.hasAttribute?.("data-uncensor-processed")) {
							detectedScriptChanges.push("Uncensor")
							shouldCheckForContent = true
						}
						if (element.hasAttribute?.("data-auto-scroll") || element.hasAttribute?.("data-reader-enhanced")) {
							detectedScriptChanges.push("Reader Enhancer")
							shouldCheckForContent = true
						}

						// More strict content validation to reduce false positives while supporting the new tracker DOM.
						if (
							textContent.length > 100 &&
							!textContent.includes("loading") &&
							!textContent.includes("...") &&
							(element.id?.includes("chapter") ||
								className.includes("chapter") ||
								element.matches?.(`.chapter-tracker, .chapter-container, ${CHAPTER_BODY_SELECTOR}, .wtr-line, [data-line]`) ||
								element.querySelector(`${CHAPTER_BODY_SELECTOR}, .chapter-tracker, .chapter-container, .wtr-line, [data-line]`))
						) {
							shouldCheckForContent = true
							break
						}
					}
				}
			}
		}

		if (shouldCheckForContent && !isContentChangeInProgress) {
			isContentChangeInProgress = true
			lastCheckTime = now

			if (detectedScriptChanges.length > 0) {
				potentialMultiScriptConflicts++
				log(
					`WTR Term Replacer: Multi-script activity detected from: ${detectedScriptChanges.join(
						", ",
					)} (conflict ${potentialMultiScriptConflicts})`,
				)

				// Update our detected scripts
				detectedScriptChanges.forEach((script) => state.otherWTRScripts.add(script))
			} else {
				log("WTR Term Replacer: Content changes detected, checking for chapter content...")
			}

			// Debounced check to avoid excessive processing with enhanced delay for multi-script
			const baseDelay = 1500
			const multiScriptDelay = state.otherWTRScripts.size > 0 ? 2500 : baseDelay

			clearTimeout(observerTimeout)
			observerTimeout = setTimeout(() => {
				const queuedForProcessing =
					document.querySelector("[data-wtr-processed]") || state.processingQueue.size > 0

				if (!queuedForProcessing) {
					log(
						`WTR Term Replacer: Initiating content processing (${state.otherWTRScripts.size} other scripts active, ${multiScriptDelay}ms coordination delay)`,
					)
					processVisibleChapter()
				} else {
					log(
						`WTR Term Replacer: Skipping content processing - already in progress or completed (queue: ${state.processingQueue.size})`,
					)
				}
				isContentChangeInProgress = false
			}, multiScriptDelay) // Increased delay to coordinate with other processes
		}
	})

	observer.observe(document.body, {
		childList: true,
		subtree: true,
		attributes: true,
		attributeFilter: ["style", "class", "id"],
	})

	log("WTR Term Replacer: Enhanced content observer activated with multi-script coordination")
}

export function processVisibleChapter() {
	const chapterBody = findChapterBodyForUrl(document)
	const chapterId = getChapterProcessingId(window.location.href, chapterBody)
	if (!chapterId || !chapterBody) {
		return
	}
	if (chapterBody.dataset.wtrProcessed === "true") {
		return
	}

	// Use queue-based processing to avoid race conditions
	scheduleChapterProcessing(chapterId, chapterBody)
}

function scheduleChapterProcessing(chapterId, _chapterBody) {
	const processingKey = `${chapterId}_${Date.now()}`

	// Enhanced queue management with proper synchronization
	const alreadyQueued = Array.from(state.processingQueue as Set<string>).some(
		(key) => key === chapterId || key.startsWith(`${chapterId}_`),
	)
	if (alreadyQueued) {
		log(
			`WTR Term Replacer: Chapter ${chapterId} already queued for processing ${state.processingQueue.size} queued`,
		)
		return
	}

	// Add with unique identifier to prevent race conditions
	state.processingQueue.add(processingKey)

	// Progressive retry with exponential backoff for slow-loading content
	const retryAttempts = [
		{ delay: 100, maxContentLoad: 0.3 }, // Fast retry for quick loads
		{ delay: 500, maxContentLoad: 0.5 }, // Medium retry for normal loads
		{ delay: 1000, maxContentLoad: 0.7 }, // Slower retry for slow loads
		{ delay: 2000, maxContentLoad: 0.9 }, // Very slow retry for very slow loads
		{ delay: 5000, maxContentLoad: 1.0 }, // Final attempt with any content
	]

	executeProcessingWithRetry(chapterId, retryAttempts, 0, processingKey)
}

async function executeProcessingWithRetry(chapterId, retryAttempts, attemptIndex, processingKey) {
	const attempt = retryAttempts[attemptIndex]

	try {
		// Wait for the specified delay
		await new Promise((resolve) => setTimeout(resolve, attempt.delay))

		// Verify queue entry still exists (prevent race conditions)
		if (!state.processingQueue.has(processingKey)) {
			log(`WTR Term Replacer: Chapter ${chapterId} processing cancelled (no longer in queue)`)
			return
		}

		// Re-acquire chapter body element dynamically to avoid stale references.
		const chapterBody = findChapterBodyById(chapterId) || findChapterBodyForUrl(document)

		if (!chapterBody) {
			throw new Error("Chapter body element not found")
		}

		// Additional DOM stability validation
		if (!document.contains(chapterBody) || chapterBody.nodeType !== Node.ELEMENT_NODE) {
			throw new Error("Chapter body element no longer in DOM")
		}

		// Check if content is sufficiently loaded
		const contentLoadLevel = estimateContentLoadLevel(chapterBody)

		if (contentLoadLevel >= attempt.maxContentLoad) {
			// Proceed with processing
			await performRobustReplacements(chapterBody, chapterId)
			state.processingQueue.delete(processingKey)
			log(`WTR Term Replacer: Successfully processed chapter ${chapterId} on attempt ${attemptIndex + 1}`)
		} else if (attemptIndex < retryAttempts.length - 1) {
			// Retry with next attempt
			log(
				`WTR Term Replacer: Chapter ${chapterId} content not ready (load level: ${contentLoadLevel.toFixed(
					2,
				)}), retrying...`,
			)
			executeProcessingWithRetry(chapterId, retryAttempts, attemptIndex + 1, processingKey)
		} else {
			// Final attempt with any available content
			log(`WTR Term Replacer: Final attempt for chapter ${chapterId} with available content`)
			await performRobustReplacements(chapterBody, chapterId, true) // force processing
			state.processingQueue.delete(processingKey)
		}
	} catch (error) {
		log(`WTR Term Replacer: Error processing chapter ${chapterId} on attempt ${attemptIndex + 1}:`, error)
		if (attemptIndex < retryAttempts.length - 1) {
			executeProcessingWithRetry(chapterId, retryAttempts, attemptIndex + 1, processingKey)
		} else {
			state.processingQueue.delete(processingKey)
			console.error(`WTR Term Replacer: Failed to process chapter ${chapterId} after all retries`)
		}
	}
}

function estimateContentLoadLevel(chapterBody) {
	// Estimate how much content is loaded using the container's text length directly,
	// avoiding the cost of querying all child elements and iterating over them.
	const totalTextLength = chapterBody.textContent?.trim().length || 0

	// Check for loading indicators or placeholder content
	const hasLoadingIndicators = chapterBody.querySelector('.loading, .spinner, [style*="loading"], [class*="loading"]')
	const rawText = chapterBody.textContent || ""
	const hasPlaceholderContent =
		rawText.includes("Loading...") || rawText.includes("loading") || rawText.includes("...")

	// Calculate load level based on content density and absence of loading indicators
	let loadLevel = Math.min(totalTextLength / 1000, 1.0) // Normalize to 0-1 based on 1000 chars

	if (hasLoadingIndicators || hasPlaceholderContent) {
		loadLevel *= 0.3 // Reduce load level if loading indicators present
	}

	// Ensure minimum threshold for processing
	return Math.max(loadLevel, totalTextLength > 100 ? 0.5 : 0.1)
}

function detectOtherWTRScripts() {
	log(state.globalSettings, "WTR Term Replacer: Scanning for other WTR Lab scripts...")

	// Detect other WTR Lab scripts by their data attributes or specific patterns
	const scripts = document.querySelectorAll(
		"[data-smart-quotes-processed], [data-uncensor-processed], [data-auto-scroll], [data-reader-enhanced]",
	)

	log(state.globalSettings, `WTR Term Replacer: Found ${scripts.length} elements with WTR script attributes`)

	scripts.forEach((el) => {
		if (el.hasAttribute("data-smart-quotes-processed")) {
			state.otherWTRScripts.add("Smart Quotes")
			log(state.globalSettings, "WTR Term Replacer: Detected Smart Quotes script")
		}
		if (el.hasAttribute("data-uncensor-processed")) {
			state.otherWTRScripts.add("Uncensor")
			log(state.globalSettings, "WTR Term Replacer: Detected Uncensor script")
		}
		if (el.hasAttribute("data-auto-scroll") || el.hasAttribute("data-reader-enhanced")) {
			state.otherWTRScripts.add("Reader Enhancer")
			log(state.globalSettings, "WTR Term Replacer: Detected Reader Enhancer script")
		}
	})

	if (state.otherWTRScripts.size > 0) {
		log(
			state.globalSettings,
			`WTR Term Replacer: Multi-script environment detected - Active scripts: ${Array.from(state.otherWTRScripts).join(", ")}`,
		)
	} else {
		log(state.globalSettings, "WTR Term Replacer: No other WTR scripts detected, running in single-script mode")
	}
}

function startProcessingTimer(operation) {
	log(state.globalSettings, `WTR Term Replacer: Starting processing timer for ${operation}`)
	state.processingStartTime.set(operation, Date.now())
}

function endProcessingTimer(operation, chapterId) {
	const startTime = state.processingStartTime.get(operation)
	if (startTime) {
		const processingTime = Date.now() - startTime
		const isMultiScript = state.otherWTRScripts.size > 0
		log(
			state.globalSettings,
			`WTR Term Replacer: Processing timer ended for ${operation}, took ${processingTime}ms`,
		)
		logProcessingWithMultiScriptContext(chapterId, processingTime, isMultiScript)
		state.processingStartTime.delete(operation)
		return processingTime
	}
	log(state.globalSettings, `WTR Term Replacer: Warning - processing timer for ${operation} not found`)
	return 0
}

function logProcessingWithMultiScriptContext(chapterId, processingTime, isMultiScript = false) {
	const context = {
		chapterId,
		processingTime: `${processingTime}ms`,
		multiScriptEnvironment: isMultiScript,
		activeScripts: state.otherWTRScripts.size,
		queueSize: state.processingQueue.size,
		timestamp: new Date().toISOString(),
	}

	if (isMultiScript && state.otherWTRScripts.size > 0) {
		context.activeScripts = Array.from(state.otherWTRScripts)
		log(state.globalSettings, `WTR Term Replacer: Multi-script enhanced processing completed`, context)
	} else {
		log(state.globalSettings, `WTR Term Replacer: Standard processing completed`, context)
	}
}

async function performRobustReplacements(chapterBody, chapterId, forceProcess = false) {
	try {
		// Additional readiness checks before processing
		if (!forceProcess && !isElementReadyForProcessing(chapterBody)) {
			throw new Error("Element not ready for processing")
		}

		startProcessingTimer(`chapter_${chapterId}`)

		// Detect other WTR scripts if not already done
		if (state.otherWTRScripts.size === 0) {
			detectOtherWTRScripts()
		}

		const isMultiScript = state.otherWTRScripts.size > 0
		if (isMultiScript) {
			log(
				`WTR Term Replacer: Multi-script processing starting for chapter ${chapterId} with active scripts: ${Array.from(
					state.otherWTRScripts,
				).join(", ")}`,
			)
		} else {
			log(`WTR Term Replacer: Processing chapter ${chapterId} with robust method`)
		}

		await performReplacements(chapterBody)
		chapterBody.dataset.wtrProcessed = "true"
		addMenuButton()

		const processingTime = endProcessingTimer(`chapter_${chapterId}`, chapterId)

		if (isMultiScript) {
			log(
				`WTR Term Replacer: Successfully completed multi-script processing for chapter ${chapterId} in ${processingTime}ms`,
			)
		}
	} catch (error) {
		const processingTime = endProcessingTimer(`chapter_${chapterId}`, chapterId) || 0
		log(`WTR Term Replacer: Robust processing failed for chapter ${chapterId} after ${processingTime}ms:`, error)
		throw error
	}
}

function isElementReadyForProcessing(element) {
	// Check if element is visible and has substantial content
	const rect = element.getBoundingClientRect()
	const isVisible = rect.width > 0 && rect.height > 0

	const hasSubstantialContent = element.textContent?.trim().length > 50
	const hasNoLoadingStates = !element.querySelector('.loading, .spinner, [style*="display: none"]')

	return isVisible && hasSubstantialContent && hasNoLoadingStates
}

export function reprocessCurrentChapter() {
	const chapterBody = findChapterBodyForUrl(document)
	const chapterId = getChapterProcessingId(window.location.href, chapterBody)
	if (!chapterId || !chapterBody) {
		return
	}

	// Reset processing state to allow reprocessing
	chapterBody.dataset.wtrProcessed = "false"

	// Clear any existing processing entries for this chapter
	const existingKeys = Array.from(state.processingQueue as Set<string>).filter((key) => key.startsWith(chapterId))
	existingKeys.forEach((key) => state.processingQueue.delete(key))

	// Use robust reprocessing with retry mechanism
	scheduleChapterProcessing(chapterId, chapterBody)
}
