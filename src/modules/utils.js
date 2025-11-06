// Utility functions for WTR Lab Term Replacer

export function getNovelSlug() {
  let match = window.location.pathname.match(/novel\/\d+\/([^/]+)/);
  if (match) return match[1];
  match = window.location.pathname.match(/serie-\d+\/([^/]+)/);
  return match ? match[1] : null;
}

export function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
}

export function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

export function getChapterIdFromUrl(url) {
  const match = url.match(/(chapter-\d+)/);
  return match ? match[1] : null;
}

export function log(globalSettings, ...args) {
  if (globalSettings && globalSettings.isLoggingEnabled) {
    console.log(...args);
  }
}

// --- [ENHANCED v5.4] MULTI-SCRIPT COORDINATION FUNCTIONS ---

export function detectOtherWTRScripts() {
  // Detect other WTR Lab scripts by their data attributes or specific patterns
  const scripts = document.querySelectorAll(
    '[data-smart-quotes-processed], [data-uncensor-processed], [data-auto-scroll], [data-reader-enhanced]'
  );

  const otherWTRScripts = new Set();

  scripts.forEach(el => {
    if (el.hasAttribute('data-smart-quotes-processed')) {
      otherWTRScripts.add('Smart Quotes');
    }
    if (el.hasAttribute('data-uncensor-processed')) {
      otherWTRScripts.add('Uncensor');
    }
    if (el.hasAttribute('data-auto-scroll') || el.hasAttribute('data-reader-enhanced')) {
      otherWTRScripts.add('Reader Enhancer');
    }
  });

  if (otherWTRScripts.size > 0) {
    log(null, `WTR Term Replacer: Multi-script environment detected - Active scripts: ${Array.from(otherWTRScripts).join(', ')}`);
  }

  return otherWTRScripts;
}

export function logDOMConflict(sourceScript, element, processingQueue, chapterId) {
  const timestamp = new Date().toISOString();
  const conflictInfo = {
    timestamp,
    sourceScript,
    element: element.tagName,
    elementId: element.id || 'no-id',
    processingQueueSize: processingQueue ? processingQueue.size : 0,
    chapterId: chapterId
  };

  log(null, `WTR Term Replacer: DOM conflict detected with ${sourceScript} script`, conflictInfo);
}

export function logProcessingWithMultiScriptContext(chapterId, processingTime, isMultiScript = false, otherWTRScripts, processingQueue) {
  const context = {
    chapterId,
    processingTime: `${processingTime}ms`,
    multiScriptEnvironment: isMultiScript,
    activeScripts: otherWTRScripts ? otherWTRScripts.size : 0,
    queueSize: processingQueue ? processingQueue.size : 0,
    timestamp: new Date().toISOString()
  };

  if (isMultiScript && otherWTRScripts && otherWTRScripts.size > 0) {
    context.activeScripts = Array.from(otherWTRScripts);
    log(null, `WTR Term Replacer: Multi-script enhanced processing completed`, context);
  } else {
    log(null, `WTR Term Replacer: Standard processing completed`, context);
  }
}

export function startProcessingTimer(operation, processingStartTime) {
  processingStartTime.set(operation, Date.now());
}

export function endProcessingTimer(operation, chapterId, processingStartTime, otherWTRScripts, processingQueue) {
  const startTime = processingStartTime.get(operation);
  if (startTime) {
    const processingTime = Date.now() - startTime;
    const isMultiScript = otherWTRScripts && otherWTRScripts.size > 0;
    log(null, `WTR Term Replacer: Processing timer ended for ${operation}, took ${processingTime}ms`);
    logProcessingWithMultiScriptContext(chapterId, processingTime, isMultiScript, otherWTRScripts, processingQueue);
    processingStartTime.delete(operation);
    return processingTime;
  }
  log(null, `WTR Term Replacer: Warning - processing timer for ${operation} not found`);
  return 0;
}

// Content readiness check for enhanced content processing
export function isContentReadyForProcessing(container) {
  // Multiple readiness criteria for robust detection
  const hasSubstantialContent = container.textContent?.trim().length > 100;
  const hasNoActiveLoaders = !container.querySelector('.loading, .spinner, [style*="loading"], .skeleton');
  const isVisible = container.offsetWidth > 0 && container.offsetHeight > 0;
  const hasChapterContent =
    container.querySelector('.chapter-body') || container.querySelector('p, h1, h2, h3, h4, h5, h6');

  return hasSubstantialContent && hasNoActiveLoaders && isVisible && hasChapterContent;
}

// Element readiness check for robust processing
export function isElementReadyForProcessing(element) {
  // Check if element is visible and has substantial content
  const rect = element.getBoundingClientRect();
  const isVisible = rect.width > 0 && rect.height > 0;

  const hasSubstantialContent = element.textContent?.trim().length > 50;
  const hasNoLoadingStates = !element.querySelector('.loading, .spinner, [style*="display: none"]');

  return isVisible && hasSubstantialContent && hasNoLoadingStates;
}

// Enhanced content load level estimation for retry mechanisms
export function estimateContentLoadLevel(chapterBody) {
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