// MutationObserver and content handling for WTR Lab Term Replacer
import { state } from "./state";
import { performReplacements } from "./engine";
import { addMenuButton, showProcessingIndicator } from "./ui";
import { getChapterIdFromUrl, log } from "./utils";

export function waitForInitialContent() {
  log(state.globalSettings, 'WTR Term Replacer: Starting robust content detection for slow-loading websites...');


  // Set up mutation observer for dynamic content loading
  log(state.globalSettings, 'WTR Term Replacer: Setting up content change observer');
  setupContentObserver();

  // Set up additional fallback mechanisms
  log(state.globalSettings, 'WTR Term Replacer: Setting up fallback detection mechanisms');
  setupFallbackDetection();
}

function detectContentWithMultipleStrategies() {
  const detectionStrategies = [
    // Strategy 1: Standard chapter ID detection
    () => {
      const chapterId = getChapterIdFromUrl(window.location.href);
      const contentContainer = chapterId ? document.querySelector(`#${chapterId}`) : null;
      return contentContainer ? { container: contentContainer, strategy: 'chapter-id' } : null;
    },

    // Strategy 2: Look for chapter body directly
    () => {
      const CHAPTER_BODY_SELECTOR = ".chapter-body";
      const chapterBody = document.querySelector(CHAPTER_BODY_SELECTOR);
      return chapterBody ? { container: chapterBody.closest('[id*="chapter"]'), strategy: 'chapter-body' } : null;
    },

    // Strategy 3: Look for any container with substantial content
    () => {
      const contentAreas = document.querySelectorAll('main, article, .content, .chapter, [role="main"]');
      for (const area of contentAreas) {
        if (area.textContent?.trim().length > 200) {
          return { container: area, strategy: 'content-area' };
        }
      }
      return null;
    },

    // Strategy 4: Last resort - any substantial text content
    () => {
      const bodyText = document.body.textContent?.trim() || '';
      if (bodyText.length > 500 && !bodyText.includes('loading')) {
        return { container: document.body, strategy: 'body-fallback' };
      }
      return null;
    }
  ];

  let currentStrategy = 0;
  const maxRetriesPerStrategy = 20;
  let retries = 0;

  const enhancedPoll = setInterval(async () => {
    const result = detectionStrategies[currentStrategy]();

    if (result && result.container) {
      clearInterval(enhancedPoll);
      console.log(`WTR Term Replacer: Content detected using strategy: ${result.strategy}`);

      // Progressive processing based on content readiness
      await progressiveContentProcessing(result.container, result.strategy);
      monitorURLChanges();
      return;
    }

    retries++;
    if (retries >= maxRetriesPerStrategy) {
      currentStrategy++;
      retries = 0;
      if (currentStrategy >= detectionStrategies.length) {
        clearInterval(enhancedPoll);
        console.warn('WTR Term Replacer: All detection strategies exhausted. Will retry on content changes.');
        // Keep fallback detection active
      } else {
        log(`WTR Term Replacer: Strategy ${currentStrategy} failed, trying next strategy...`);
      }
    }
  }, 500); // Increased interval for slower polling
}

async function progressiveContentProcessing(container, strategy) {
  log(`WTR Term Replacer: Starting progressive processing with strategy: ${strategy}`);

  // Give the page more time to fully load, especially for slow connections
  const settlingDelays = [200, 500, 1000, 2000]; // Progressive delays
  let currentDelayIndex = 0;

  const attemptProcessing = async () => {
    try {
      // Check content readiness with multiple criteria
      if (isContentReadyForProcessing(container)) {
        log('WTR Term Replacer: Content ready for processing, proceeding...');
        processVisibleChapter();
        return true;
      } else if (currentDelayIndex < settlingDelays.length - 1) {
        currentDelayIndex++;
        log(`WTR Term Replacer: Content not ready, waiting ${settlingDelays[currentDelayIndex]}ms more...`);
        setTimeout(attemptProcessing, settlingDelays[currentDelayIndex]);
        return false;
      } else {
        log('WTR Term Replacer: Final attempt with current content state');
        processVisibleChapter(); // Force processing
        return true;
      }
    } catch (error) {
      log('WTR Term Replacer: Error during progressive processing:', error);
      return false;
    }
  };

  await attemptProcessing();
}

function isContentReadyForProcessing(container) {
  // Multiple readiness criteria for robust detection
  const hasSubstantialContent = container.textContent?.trim().length > 100;
  const hasNoActiveLoaders = !container.querySelector('.loading, .spinner, [style*="loading"], .skeleton');
  const isVisible = container.offsetWidth > 0 && container.offsetHeight > 0;
  const CHAPTER_BODY_SELECTOR = ".chapter-body";
  const hasChapterContent =
    container.querySelector(CHAPTER_BODY_SELECTOR) || container.querySelector('p, h1, h2, h3, h4, h5, h6');

  return hasSubstantialContent && hasNoActiveLoaders && isVisible && hasChapterContent;
}

function setupContentObserver() {
  // Watch for dynamic content loading with enhanced coordination
  let observerTimeout;
  let lastCheckTime = 0;
  let isContentChangeInProgress = false;
  let potentialMultiScriptConflicts = 0;

  const observer = new MutationObserver(mutations => {
    // Prevent excessive triggering with timing constraints
    const now = Date.now();
    if (now - lastCheckTime < 2000) {
      // Minimum 2 seconds between checks
      return;
    }

    let shouldCheckForContent = false;
    let detectedScriptChanges = [];

    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Check if substantial content was added
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const textContent = node.textContent?.trim() || '';

            // Detect multi-script data attributes being added
            if (node.hasAttribute?.('data-smart-quotes-processed')) {
              detectedScriptChanges.push('Smart Quotes');
              shouldCheckForContent = true;
            }
            if (node.hasAttribute?.('data-uncensor-processed')) {
              detectedScriptChanges.push('Uncensor');
              shouldCheckForContent = true;
            }
            if (node.hasAttribute?.('data-auto-scroll') || node.hasAttribute?.('data-reader-enhanced')) {
              detectedScriptChanges.push('Reader Enhancer');
              shouldCheckForContent = true;
            }

            // More strict content validation to reduce false positives
            if (
              textContent.length > 100 &&
              !textContent.includes('loading') &&
              !textContent.includes('...') &&
              (node.id?.includes('chapter') || node.className?.includes('chapter') || node.querySelector('.chapter-body'))
            ) {
              shouldCheckForContent = true;
              break;
            }
          }
        }
      }
    }

    if (shouldCheckForContent && !isContentChangeInProgress) {
      isContentChangeInProgress = true;
      lastCheckTime = now;

      if (detectedScriptChanges.length > 0) {
        potentialMultiScriptConflicts++;
        log(
          `WTR Term Replacer: Multi-script activity detected from: ${detectedScriptChanges.join(
            ', '
          )} (conflict ${potentialMultiScriptConflicts})`
        );

        // Update our detected scripts
        detectedScriptChanges.forEach(script => state.otherWTRScripts.add(script));
      } else {
        log('WTR Term Replacer: Content changes detected, checking for chapter content...');
      }

      // Debounced check to avoid excessive processing with enhanced delay for multi-script
      const baseDelay = 1500;
      const multiScriptDelay = state.otherWTRScripts.size > 0 ? 2500 : baseDelay;

      clearTimeout(observerTimeout);
      observerTimeout = setTimeout(() => {
        const queuedForProcessing = document.querySelector('[data-wtr-processed]') || state.processingQueue.size > 0;

        if (!queuedForProcessing) {
          log(
            `WTR Term Replacer: Initiating content processing (${state.otherWTRScripts.size} other scripts active, ${multiScriptDelay}ms coordination delay)`
          );
          processVisibleChapter();
        } else {
          log(
            `WTR Term Replacer: Skipping content processing - already in progress or completed (queue: ${state.processingQueue.size})`
          );
        }
        isContentChangeInProgress = false;
      }, multiScriptDelay); // Increased delay to coordinate with other processes
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class', 'id']
  });

  log('WTR Term Replacer: Enhanced content observer activated with multi-script coordination');
}

function setupFallbackDetection() {
  // Periodic fallback check for stubborn slow-loading pages
  let fallbackAttempts = 0;
  const maxFallbackAttempts = 10;

  const fallbackInterval = setInterval(() => {
    if (document.querySelector('[data-wtr-processed]')) {
      clearInterval(fallbackInterval);
      return;
    }

    fallbackAttempts++;
    log(`WTR Term Replacer: Fallback attempt ${fallbackAttempts}/${maxFallbackAttempts}`);

    // Try processing if we have any chapter-like content
    const chapterId = getChapterIdFromUrl(window.location.href);
    if (chapterId) {
      const CHAPTER_BODY_SELECTOR = ".chapter-body";
      const chapterSelector = `#${chapterId} ${CHAPTER_BODY_SELECTOR}`;
      const chapterBody = document.querySelector(chapterSelector);
      if (chapterBody) {
        log('WTR Term Replacer: Fallback processing successful');
        processVisibleChapter();
        clearInterval(fallbackInterval);
        return;
      }
    }

    // Check for any substantial content that might be chapter content
    const potentialContent = document.querySelector('main, article, .content, .chapter');
    if (potentialContent && potentialContent.textContent?.trim().length > 200) {
      log('WTR Term Replacer: Fallback processing with detected content');
      processVisibleChapter();
      clearInterval(fallbackInterval);
    }

    if (fallbackAttempts >= maxFallbackAttempts) {
      clearInterval(fallbackInterval);
      log('WTR Term Replacer: Fallback detection exhausted');
    }
  }, 3000); // Check every 3 seconds

  // Clear fallback interval after 5 minutes to prevent infinite polling
  setTimeout(() => {
    clearInterval(fallbackInterval);
  }, 300000);
}

export function processVisibleChapter() {
  const chapterId = getChapterIdFromUrl(window.location.href);
  if (!chapterId) return;
  const CHAPTER_BODY_SELECTOR = ".chapter-body";
  const chapterSelector = `#${chapterId} ${CHAPTER_BODY_SELECTOR}`;
  const chapterBody = document.querySelector(chapterSelector);
  if (!chapterBody) return;
  if (chapterBody.dataset.wtrProcessed === 'true') return;

  // Use queue-based processing to avoid race conditions
  scheduleChapterProcessing(chapterId, chapterBody);
}

function scheduleChapterProcessing(chapterId, chapterBody) {
  const processingKey = `${chapterId}_${Date.now()}`;

  // Enhanced queue management with proper synchronization
  if (state.processingQueue.has(chapterId)) {
    log(`WTR Term Replacer: Chapter ${chapterId} already queued for processing ${state.processingQueue.size} queued`);
    return;
  }

  // Add with unique identifier to prevent race conditions
  state.processingQueue.add(processingKey);

  // Progressive retry with exponential backoff for slow-loading content
  const retryAttempts = [
    { delay: 100, maxContentLoad: 0.3 }, // Fast retry for quick loads
    { delay: 500, maxContentLoad: 0.5 }, // Medium retry for normal loads
    { delay: 1000, maxContentLoad: 0.7 }, // Slower retry for slow loads
    { delay: 2000, maxContentLoad: 0.9 }, // Very slow retry for very slow loads
    { delay: 5000, maxContentLoad: 1.0 } // Final attempt with any content
  ];

  executeProcessingWithRetry(chapterId, retryAttempts, 0, processingKey);
}

async function executeProcessingWithRetry(chapterId, retryAttempts, attemptIndex, processingKey) {
  const attempt = retryAttempts[attemptIndex];

  try {
    // Wait for the specified delay
    await new Promise(resolve => setTimeout(resolve, attempt.delay));

    // Verify queue entry still exists (prevent race conditions)
    if (!state.processingQueue.has(processingKey)) {
      log(`WTR Term Replacer: Chapter ${chapterId} processing cancelled (no longer in queue)`);
      return;
    }

    // Re-acquire chapter body element dynamically to avoid stale references
    const CHAPTER_BODY_SELECTOR = ".chapter-body";
    const chapterSelector = `#${chapterId} ${CHAPTER_BODY_SELECTOR}`;
    const chapterBody = document.querySelector(chapterSelector);

    if (!chapterBody) {
      throw new Error('Chapter body element not found');
    }

    // Additional DOM stability validation
    if (!document.contains(chapterBody) || chapterBody.nodeType !== Node.ELEMENT_NODE) {
      throw new Error('Chapter body element no longer in DOM');
    }

    // Check if content is sufficiently loaded
    const contentLoadLevel = estimateContentLoadLevel(chapterBody);

    if (contentLoadLevel >= attempt.maxContentLoad) {
      // Proceed with processing
      await performRobustReplacements(chapterBody, chapterId);
      state.processingQueue.delete(processingKey);
      log(`WTR Term Replacer: Successfully processed chapter ${chapterId} on attempt ${attemptIndex + 1}`);
    } else if (attemptIndex < retryAttempts.length - 1) {
      // Retry with next attempt
      log(
        `WTR Term Replacer: Chapter ${chapterId} content not ready (load level: ${contentLoadLevel.toFixed(
          2
        )}), retrying...`
      );
      executeProcessingWithRetry(chapterId, retryAttempts, attemptIndex + 1, processingKey);
    } else {
      // Final attempt with any available content
      log(`WTR Term Replacer: Final attempt for chapter ${chapterId} with available content`);
      await performRobustReplacements(chapterBody, chapterId, true); // force processing
      state.processingQueue.delete(processingKey);
    }
  } catch (error) {
    log(`WTR Term Replacer: Error processing chapter ${chapterId} on attempt ${attemptIndex + 1}:`, error);
    if (attemptIndex < retryAttempts.length - 1) {
      executeProcessingWithRetry(chapterId, retryAttempts, attemptIndex + 1, processingKey);
    } else {
      state.processingQueue.delete(processingKey);
      console.error(`WTR Term Replacer: Failed to process chapter ${chapterId} after all retries`);
    }
  }
}

function estimateContentLoadLevel(chapterBody) {
  // Estimate how much content is loaded based on text density and structure
  const textNodes = chapterBody.querySelectorAll('p, h1, h2, h3, h4, h5, h6, div, span');
  const totalTextLength = Array.from(textNodes).reduce(
    (total, node) => total + (node.textContent?.trim().length || 0),
    0
  );

  // Check for loading indicators or placeholder content
  const hasLoadingIndicators = chapterBody.querySelector('.loading, .spinner, [style*="loading"], [class*="loading"]');
  const hasPlaceholderContent =
    chapterBody.textContent?.includes('Loading...') ||
    chapterBody.textContent?.includes('loading') ||
    chapterBody.textContent?.includes('...');

  // Calculate load level based on content density and absence of loading indicators
  let loadLevel = Math.min(totalTextLength / 1000, 1.0); // Normalize to 0-1 based on 1000 chars

  if (hasLoadingIndicators || hasPlaceholderContent) {
    loadLevel *= 0.3; // Reduce load level if loading indicators present
  }

  // Ensure minimum threshold for processing
  return Math.max(loadLevel, totalTextLength > 100 ? 0.5 : 0.1);
}

function detectOtherWTRScripts() {
  log(state.globalSettings, 'WTR Term Replacer: Scanning for other WTR Lab scripts...');
  
  // Detect other WTR Lab scripts by their data attributes or specific patterns
  const scripts = document.querySelectorAll(
    '[data-smart-quotes-processed], [data-uncensor-processed], [data-auto-scroll], [data-reader-enhanced]'
  );

  log(state.globalSettings, `WTR Term Replacer: Found ${scripts.length} elements with WTR script attributes`);

  scripts.forEach(el => {
    if (el.hasAttribute('data-smart-quotes-processed')) {
      state.otherWTRScripts.add('Smart Quotes');
      log(state.globalSettings, 'WTR Term Replacer: Detected Smart Quotes script');
    }
    if (el.hasAttribute('data-uncensor-processed')) {
      state.otherWTRScripts.add('Uncensor');
      log(state.globalSettings, 'WTR Term Replacer: Detected Uncensor script');
    }
    if (el.hasAttribute('data-auto-scroll') || el.hasAttribute('data-reader-enhanced')) {
      state.otherWTRScripts.add('Reader Enhancer');
      log(state.globalSettings, 'WTR Term Replacer: Detected Reader Enhancer script');
    }
  });

  if (state.otherWTRScripts.size > 0) {
    log(
      state.globalSettings,
      `WTR Term Replacer: Multi-script environment detected - Active scripts: ${Array.from(state.otherWTRScripts).join(', ')}`
    );
  } else {
    log(state.globalSettings, 'WTR Term Replacer: No other WTR scripts detected, running in single-script mode');
  }
}

function startProcessingTimer(operation) {
  log(state.globalSettings, `WTR Term Replacer: Starting processing timer for ${operation}`);
  state.processingStartTime.set(operation, Date.now());
}

function endProcessingTimer(operation, chapterId) {
  const startTime = state.processingStartTime.get(operation);
  if (startTime) {
    const processingTime = Date.now() - startTime;
    const isMultiScript = state.otherWTRScripts.size > 0;
    log(state.globalSettings, `WTR Term Replacer: Processing timer ended for ${operation}, took ${processingTime}ms`);
    logProcessingWithMultiScriptContext(chapterId, processingTime, isMultiScript);
    state.processingStartTime.delete(operation);
    return processingTime;
  }
  log(state.globalSettings, `WTR Term Replacer: Warning - processing timer for ${operation} not found`);
  return 0;
}

function logProcessingWithMultiScriptContext(chapterId, processingTime, isMultiScript = false) {
  const context = {
    chapterId,
    processingTime: `${processingTime}ms`,
    multiScriptEnvironment: isMultiScript,
    activeScripts: state.otherWTRScripts.size,
    queueSize: state.processingQueue.size,
    timestamp: new Date().toISOString()
  };

  if (isMultiScript && state.otherWTRScripts.size > 0) {
    context.activeScripts = Array.from(state.otherWTRScripts);
    log(state.globalSettings, `WTR Term Replacer: Multi-script enhanced processing completed`, context);
  } else {
    log(state.globalSettings, `WTR Term Replacer: Standard processing completed`, context);
  }
}

async function performRobustReplacements(chapterBody, chapterId, forceProcess = false) {
  try {
    // Additional readiness checks before processing
    if (!forceProcess && !isElementReadyForProcessing(chapterBody)) {
      throw new Error('Element not ready for processing');
    }

    startProcessingTimer(`chapter_${chapterId}`);

    // Detect other WTR scripts if not already done
    if (state.otherWTRScripts.size === 0) {
      detectOtherWTRScripts();
    }

    const isMultiScript = state.otherWTRScripts.size > 0;
    if (isMultiScript) {
      log(
        `WTR Term Replacer: Multi-script processing starting for chapter ${chapterId} with active scripts: ${Array.from(
          state.otherWTRScripts
        ).join(', ')}`
      );
    } else {
      log(`WTR Term Replacer: Processing chapter ${chapterId} with robust method`);
    }

    performReplacements(chapterBody);
    chapterBody.dataset.wtrProcessed = 'true';
    addMenuButton();

    const processingTime = endProcessingTimer(`chapter_${chapterId}`, chapterId);

    if (isMultiScript) {
      log(
        `WTR Term Replacer: Successfully completed multi-script processing for chapter ${chapterId} in ${processingTime}ms`
      );
    }
  } catch (error) {
    const processingTime = endProcessingTimer(`chapter_${chapterId}`, chapterId) || 0;
    log(`WTR Term Replacer: Robust processing failed for chapter ${chapterId} after ${processingTime}ms:`, error);
    throw error;
  }
}

function isElementReadyForProcessing(element) {
  // Check if element is visible and has substantial content
  const rect = element.getBoundingClientRect();
  const isVisible = rect.width > 0 && rect.height > 0;

  const hasSubstantialContent = element.textContent?.trim().length > 50;
  const hasNoLoadingStates = !element.querySelector('.loading, .spinner, [style*="display: none"]');

  return isVisible && hasSubstantialContent && hasNoLoadingStates;
}

export function reprocessCurrentChapter() {
  const chapterId = getChapterIdFromUrl(window.location.href);
  if (!chapterId) return;
  const CHAPTER_BODY_SELECTOR = ".chapter-body";
  const chapterSelector = `#${chapterId} ${CHAPTER_BODY_SELECTOR}`;
  const chapterBody = document.querySelector(chapterSelector);
  if (chapterBody) {
    // Reset processing state to allow reprocessing
    chapterBody.dataset.wtrProcessed = 'false';

    // Clear any existing processing entries for this chapter
    const existingKeys = Array.from(state.processingQueue).filter(key => key.startsWith(chapterId));
    existingKeys.forEach(key => state.processingQueue.delete(key));

    // Use robust reprocessing with retry mechanism
    scheduleChapterProcessing(chapterId, chapterBody);
  }
}

function monitorURLChanges() {
  setInterval(() => {
    if (window.location.href !== state.currentURL) {
      log(`WTR Term Replacer: URL changed to ${window.location.href}.`);
      state.currentURL = window.location.href;
      setTimeout(processVisibleChapter, 250);
    }
  }, 500);
}