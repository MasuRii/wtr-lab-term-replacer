// Main entry point for WTR Lab Term Replacer
import { createUI, showUIPanel } from "./modules/ui"
import { loadData, loadGlobalSettings } from "./modules/storage"
import { waitForInitialContent } from "./modules/observer"
import { setNovelSlug, state } from "./modules/state"
import * as Handlers from "./modules/handlers" // Import all handlers
import { getNovelSlug, log } from "./modules/utils"

// Function to get chapter ID from URL (for module compatibility)
function getChapterIdFromUrl(url) {
	const match = url.match(/(chapter-\d+)/)
	return match ? match[1] : null
}

// Enhanced error handling setup
function setupEnhancedErrorHandling() {
	// Global error handler to catch and log any issues
	window.addEventListener("error", (event) => {
		if (event.error && event.error.message && event.error.message.includes("WTR")) {
			log(state.globalSettings, "WTR Term Replacer: Caught error:", event.error)
		}
	})

	// Handle unhandled promise rejections
	window.addEventListener("unhandledrejection", (event) => {
		if (event.reason && event.reason.message && event.reason.message.includes("WTR")) {
			log(state.globalSettings, "WTR Term Replacer: Unhandled promise rejection:", event.reason)
		}
	})

	// Cleanup function for when page unloads
	window.addEventListener("beforeunload", () => {
		state.processingQueue.clear()
		log(state.globalSettings, "WTR Term Replacer: Cleanup on page unload")
	})

	log(state.globalSettings, "WTR Term Replacer: Enhanced error handling activated")
}

// Enhanced navigation handling setup
function setupEnhancedNavigationHandling() {
	// Enhanced URL change detection with proper debouncing and coordination
	let isNavigationInProgress = false

	const processNavigationSafely = () => {
		if (isNavigationInProgress) {
			log(state.globalSettings, "WTR Term Replacer: Navigation already in progress, skipping")
			return
		}

		isNavigationInProgress = true

		// Clear processing queue for new chapter
		state.processingQueue.clear()

		// Wait for content to load with enhanced detection
		setTimeout(() => {
			import("./modules/observer").then(({ processVisibleChapter }) => {
				processVisibleChapter()
			})
			isNavigationInProgress = false
		}, 500) // Increased delay to allow DOM updates and prevent conflicts
	}

	// Set up navigation event listeners for SPA-style navigation
	window.addEventListener("popstate", () => {
		log(state.globalSettings, "WTR Term Replacer: Popstate event detected")
		processNavigationSafely()
	})

	// Handle pushState/replaceState (SPA navigation)
	const originalPushState = history.pushState
	const originalReplaceState = history.replaceState

	history.pushState = function (...args) {
		const result = originalPushState.apply(this, args)
		processNavigationSafely()
		return result
	}

	history.replaceState = function (...args) {
		const result = originalReplaceState.apply(this, args)
		processNavigationSafely()
		return result
	}

	log(state.globalSettings, "WTR Term Replacer: Enhanced navigation handling activated")
}

// Enhanced disable functionality that works reliably
function addDisableAllRobustness() {
	// Enhanced disable functionality with proper error handling
	const handleDisableToggleRobust = async function (e) {
		const wasDisabled = state.settings.isDisabled
		const shouldDisable = e.target.checked

		// Update settings immediately
		state.settings.isDisabled = shouldDisable
		await (await import("./modules/storage")).saveSettings(state.settings)

		// Perform robust disable/enable operation
		const chapterId = getChapterIdFromUrl(window.location.href)
		if (!chapterId) {
			return
		}

		const chapterSelector = `#${chapterId} .chapter-body`
		const chapterBody = document.querySelector(chapterSelector)

		if (chapterBody) {
			try {
				const { performReplacements, revertAllReplacements } = await import("./modules/engine")
				if (shouldDisable) {
					// Disable: revert all replacements
					log(state.globalSettings, "WTR Term Replacer: Robust disable - reverting all replacements")
					await revertAllReplacements(chapterBody)
					chapterBody.dataset.wtrProcessed = "false"
				} else {
					// Enable: perform replacements with retry
					log(state.globalSettings, "WTR Term Replacer: Robust enable - performing replacements")
					await performReplacements(chapterBody)
					chapterBody.dataset.wtrProcessed = "true"
				}
			} catch (error) {
				log(
					state.globalSettings,
					`WTR Term Replacer: Error during ${shouldDisable ? "disable" : "enable"} operation:`,
					error,
				)
				// Reset checkbox on error
				e.target.checked = wasDisabled
				state.settings.isDisabled = wasDisabled
			}
		}
	}

	// Replace the existing event listener with our robust version
	const uiContainer = document.querySelector(".wtr-replacer-ui")
	if (uiContainer) {
		const disableCheckbox = uiContainer.querySelector("#wtr-disable-all")
		if (disableCheckbox) {
			// Remove existing listener and add our enhanced one
			const newDisableCheckbox = disableCheckbox.cloneNode(true)
			disableCheckbox.parentNode.replaceChild(newDisableCheckbox, disableCheckbox)
			newDisableCheckbox.addEventListener("change", handleDisableToggleRobust)
		}
	}

	log(state.globalSettings, "WTR Term Replacer: Enhanced disable functionality activated")
}

async function main() {
	log(state.globalSettings, "WTR Term Replacer: Main function starting initialization...")

	// Initialize state and validate novel slug
	const novelSlug = getNovelSlug()
	if (!novelSlug) {
		log(state.globalSettings, "WTR Term Replacer: Critical error - could not determine novel slug")
		console.error("WTR Term Replacer: Could not determine novel slug.")
		return
	}

	log(state.globalSettings, `WTR Term Replacer: Novel slug determined: ${novelSlug}`)
	setNovelSlug(novelSlug)

	log(state.globalSettings, "WTR Term Replacer: Loading global settings and data...")
	await loadGlobalSettings()
	await loadData()

	log(
		state.globalSettings,
		`WTR Term Replacer: Data loaded - terms: ${state.terms.length}, settings disabled: ${state.settings.isDisabled}`,
	)

	// Enhanced initialization with robustness features
	log(state.globalSettings, "WTR Term Replacer: Setting up error handling...")
	setupEnhancedErrorHandling()

	log(state.globalSettings, "WTR Term Replacer: Setting up disable functionality...")
	addDisableAllRobustness()

	log(state.globalSettings, "WTR Term Replacer: Setting up navigation handling...")
	setupEnhancedNavigationHandling()

	log(state.globalSettings, "WTR Term Replacer: Creating UI and menu commands...")
	createUI() // This will also set up the initial event listeners

	log(state.globalSettings, "WTR Term Replacer: Registering menu commands...")
	GM_registerMenuCommand("Term Replacer Settings", showUIPanel)
	GM_registerMenuCommand("Toggle Logging", Handlers.toggleLogging)

	log(state.globalSettings, "WTR Term Replacer: Starting initial content detection...")
	waitForInitialContent()

	log(state.globalSettings, "WTR Term Replacer: Initialization completed successfully")
}

// Start the script
main().catch((err) => console.error("WTR Term Replacer failed to start:", err))

// Add custom event listener for programmatic term addition (equivalent to original lines 2444-2447)
window.addEventListener("wtr:addTerm", (event) => {
	const { original, replacement, isRegex } = event.detail
	Handlers.addTermProgrammatically(original, replacement, isRegex)
})
