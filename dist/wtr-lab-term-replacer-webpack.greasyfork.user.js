// ==UserScript==
// @name WTR Lab Term Replacer
// @description A modular, Webpack-powered TypeScript version of the WTR Lab Term Replacer userscript.
// @version 5.6.0
// @author MasuRii
// @homepage https://github.com/MasuRii/wtr-lab-term-replacer-webpack#readme
// @supportURL https://github.com/MasuRii/wtr-lab-term-replacer-webpack/issues
// @match https://wtr-lab.com/en/novel/*/*/*
// @connect fonts.googleapis.com
// @grant GM_setValue
// @grant GM_getValue
// @grant GM_listValues
// @grant GM_addStyle
// @grant GM_registerMenuCommand
// @icon https://www.google.com/s2/favicons?sz=64&domain=wtr-lab.com
// @license MIT
// @namespace https://github.com/MasuRii/wtr-lab-term-replacer-webpack
// @run-at document-idle
// ==/UserScript==

/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 387
(module, __unused_webpack_exports, __webpack_require__) {

// config/versions.js
// Centralized version management for WTR Lab Term Replacer

// Environment variable overrides with fallbacks
const envVersion = ({ env: {} }).env.WTR_VERSION || ({ env: {} }).env.APP_VERSION;
const buildEnv = ({ env: {} }).env.WTR_BUILD_ENV || ({ env: {} }).env.BUILD_ENV || "production";
const buildDate = ({ env: {} }).env.WTR_BUILD_DATE || ({ env: {} }).env.BUILD_DATE || new Date().toISOString().split("T")[0];

// Derive base version from package.json at runtime so only package.json is edited manually
const pkg = __webpack_require__(330);
const BASE_VERSION = pkg.version;

const VERSION_INFO = {
  SEMANTIC: envVersion || BASE_VERSION,           // Semantic version
  DISPLAY: `v${envVersion || BASE_VERSION}`,      // Display version
  BUILD_ENV: buildEnv || "production",            // Build environment
  BUILD_DATE: buildDate,                          // Build date
  GREASYFORK: envVersion || BASE_VERSION,         // GreasyFork version
  NPM: envVersion || BASE_VERSION,                // NPM version
  BADGE: envVersion || BASE_VERSION,              // Badge version
  CHANGELOG: envVersion || BASE_VERSION,          // Changelog version
};

// Export version info and utility functions
module.exports = {
  VERSION_INFO,
  
  // Utility functions
  getVersion: (type = "semantic") => {
    switch (type.toLowerCase()) {
      case "semantic":
      case "semver":
        return VERSION_INFO.SEMANTIC;
      case "display":
        return VERSION_INFO.DISPLAY;
      case "build":
        return `${VERSION_INFO.SEMANTIC}-${VERSION_INFO.BUILD_ENV}`;
      case "dev":
        return `${VERSION_INFO.SEMANTIC}-dev.${Date.now()}`;
      default:
        return VERSION_INFO.SEMANTIC;
    }
  },
  
  getBuildTime: () => new Date().toISOString(),
  getBuildDate: () => VERSION_INFO.BUILD_DATE,
  isProduction: () => VERSION_INFO.BUILD_ENV === "production",
  isDevelopment: () => VERSION_INFO.BUILD_ENV === "development",
  getDisplayVersion: () => VERSION_INFO.DISPLAY
};

/***/ },

/***/ 333
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Ft: () => (/* binding */ SETTINGS_STORAGE_KEY_PREFIX),
/* harmony export */   Qp: () => (/* binding */ CURRENT_LOCATION_KEY),
/* harmony export */   fW: () => (/* binding */ TERMS_STORAGE_KEY_PREFIX),
/* harmony export */   re: () => (/* binding */ ITEMS_PER_PAGE),
/* harmony export */   sI: () => (/* binding */ GLOBAL_SETTINGS_KEY),
/* harmony export */   tA: () => (/* binding */ CHAPTER_BODY_SELECTOR)
/* harmony export */ });
// Configuration constants and selectors
const CHAPTER_BODY_SELECTOR = ".chapter-body";
const TERMS_STORAGE_KEY_PREFIX = "wtr_lab_terms_";
const SETTINGS_STORAGE_KEY_PREFIX = "wtr_lab_settings_";
const GLOBAL_SETTINGS_KEY = "wtr_lab_global_settings";
const CURRENT_LOCATION_KEY = "wtr_lab_term_list_location";
const ITEMS_PER_PAGE = 100;


/***/ },

/***/ 201
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Cs: () => (/* binding */ updateDupModeAfterChange),
/* harmony export */   DP: () => (/* binding */ changeDupGroup),
/* harmony export */   bj: () => (/* binding */ exitDupMode),
/* harmony export */   r_: () => (/* binding */ computeDupGroups)
/* harmony export */ });
/* harmony import */ var _state__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(654);
/* harmony import */ var _ui__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(141);
// Duplicate detection logic for WTR Lab Term Replacer


/**
 * Normalizes a term's original text into an array of its core components.
 * @param {object} term - The term object.
 * @returns {string[]} An array of normalized string components.
 */
function getNormalizedTermComponents(term) {
    const components = [];
    const original = term.original;
    const isSimpleAlternation = term.isRegex && !/[\\^$.*+?()[\]{}()]/.test(original);
    if (isSimpleAlternation) {
        components.push(...original.split("|"));
    }
    else {
        components.push(original);
    }
    return components
        .map((comp) => {
        let normalized = comp.trim().replace(/\s+/g, " ");
        if (!term.caseSensitive) {
            normalized = normalized.toLowerCase();
        }
        return normalized;
    })
        .filter((comp) => comp.length > 0);
}
/**
 * Computes duplicate groups from a given array of terms.
 * @param {object[]} termsToScan - The array of terms to check for duplicates.
 */
function computeDupGroups(termsToScan) {
    const componentMap = new Map();
    const replacementDupGroups = new Map();
    const allDupGroups = new Map();
    termsToScan.forEach((term) => {
        const components = getNormalizedTermComponents(term);
        if (components.length > 1) {
            const uniqueComponents = new Set(components);
            if (uniqueComponents.size < components.length) {
                const originalTextSnippet = term.original.length > 50 ? term.original.substring(0, 47) + "..." : term.original;
                const key = `Internal duplicate in: "${originalTextSnippet}"`;
                allDupGroups.set(key, [term]);
            }
        }
        components.forEach((comp) => {
            if (!componentMap.has(comp)) {
                componentMap.set(comp, []);
            }
            const group = componentMap.get(comp);
            if (!group.some((t) => t.id === term.id)) {
                group.push(term);
            }
        });
        if (term.replacement) {
            const key = term.replacement;
            if (!replacementDupGroups.has(key)) {
                replacementDupGroups.set(key, []);
            }
            replacementDupGroups.get(key).push(term);
        }
    });
    for (const [component, group] of componentMap.entries()) {
        if (group.length > 1) {
            allDupGroups.set(`Original component: "${component}"`, group);
        }
    }
    for (const [key, group] of replacementDupGroups.entries()) {
        if (group.length > 1) {
            const displayKey = `Replacement: "${key}"`;
            if (allDupGroups.has(displayKey)) {
                const existingGroup = allDupGroups.get(displayKey);
                const newTerms = group.filter((t) => !existingGroup.some((et) => et.id === t.id));
                allDupGroups.set(displayKey, [...existingGroup, ...newTerms]);
            }
            else {
                allDupGroups.set(displayKey, group);
            }
        }
    }
    _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.dupGroups = allDupGroups;
    _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.dupKeys = Array.from(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.dupGroups.keys()).sort();
}
function exitDupMode() {
    _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.isDupMode = false;
    _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.currentDupIndex = 0;
    _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.dupGroups = new Map();
    _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.dupKeys = [];
    (0,_ui__WEBPACK_IMPORTED_MODULE_1__/* .renderTermList */ .FP)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.currentSearchValue);
}
function changeDupGroup(delta) {
    _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.currentDupIndex = Math.max(0, Math.min(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.dupKeys.length - 1, _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.currentDupIndex + delta));
    (0,_ui__WEBPACK_IMPORTED_MODULE_1__/* .renderTermList */ .FP)();
}
function updateDupModeAfterChange() {
    computeDupGroups(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.terms); // Use the current in-memory `state.terms` array which has just been updated
    if (_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.dupKeys.length === 0) {
        alert("All duplicates resolved.");
        exitDupMode();
        return;
    }
    const oldKey = _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.dupKeys[_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.currentDupIndex];
    const newIndex = _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.dupKeys.indexOf(oldKey);
    if (newIndex !== -1) {
        const group = _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.dupGroups.get(oldKey);
        if (group && (group.length > 1 || oldKey.startsWith("Internal duplicate"))) {
            _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.currentDupIndex = newIndex;
        }
        else {
            _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.currentDupIndex = Math.min(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.currentDupIndex, _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.dupKeys.length - 1);
        }
    }
    else {
        _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.currentDupIndex = Math.min(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.currentDupIndex, _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.dupKeys.length - 1);
    }
    (0,_ui__WEBPACK_IMPORTED_MODULE_1__/* .renderTermList */ .FP)();
}


/***/ },

/***/ 9
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   performReplacements: () => (/* binding */ performReplacements),
/* harmony export */   revertAllReplacements: () => (/* binding */ revertAllReplacements)
/* harmony export */ });
/* unused harmony exports executeReplacementLogic, traverseAndRevert */
/* harmony import */ var _state__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(654);
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(158);
/* harmony import */ var _ui__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(141);
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(333);
// Core replacement engine for WTR Lab Term Replacer




async function performReplacements(targetElement) {
    if (!targetElement) {
        (0,_utils__WEBPACK_IMPORTED_MODULE_1__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, "WTR Term Replacer: performReplacements called with null target element");
        return;
    }
    (0,_utils__WEBPACK_IMPORTED_MODULE_1__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, "WTR Term Replacer: Starting performReplacements");
    (0,_ui__WEBPACK_IMPORTED_MODULE_2__/* .showProcessingIndicator */ .gn)(true);
    await new Promise((resolve) => setTimeout(resolve, 10));
    if (_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.settings.isDisabled || _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.terms.length === 0) {
        (0,_utils__WEBPACK_IMPORTED_MODULE_1__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, `WTR Term Replacer: Skipping replacements - disabled: ${_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.settings.isDisabled}, terms: ${_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.terms.length}`);
        (0,_ui__WEBPACK_IMPORTED_MODULE_2__/* .showProcessingIndicator */ .gn)(false);
        return;
    }
    try {
        (0,_utils__WEBPACK_IMPORTED_MODULE_1__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, `WTR Term Replacer: Found ${_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.terms.length} terms to process, beginning replacement with retry mechanism`);
        // Enhanced replacement with error handling and retry
        await performReplacementsWithRetry(targetElement, 3);
    }
    catch (error) {
        (0,_utils__WEBPACK_IMPORTED_MODULE_1__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, `WTR Term Replacer: Failed to perform replacements after retries:`, error);
        console.error("WTR Term Replacer: Replacement failed, but original content preserved");
    }
    finally {
        (0,_ui__WEBPACK_IMPORTED_MODULE_2__/* .showProcessingIndicator */ .gn)(false);
        (0,_utils__WEBPACK_IMPORTED_MODULE_1__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, "WTR Term Replacer: performReplacements completed");
    }
}
async function performReplacementsWithRetry(targetElement, maxRetries) {
    let lastError = null;
    let elementStabilityCounter = 0;
    (0,_utils__WEBPACK_IMPORTED_MODULE_1__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, `WTR Term Replacer: Starting replacement process with ${maxRetries} retries`);
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            (0,_utils__WEBPACK_IMPORTED_MODULE_1__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, `WTR Term Replacer: Replacement attempt ${attempt}/${maxRetries}`);
            // Enhanced element stability validation
            if (!validateElementStability(targetElement, elementStabilityCounter)) {
                (0,_utils__WEBPACK_IMPORTED_MODULE_1__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, `WTR Term Replacer: Element stability check failed, attempt ${elementStabilityCounter}`);
                // Re-acquire element reference for better stability
                const chapterId = (0,_utils__WEBPACK_IMPORTED_MODULE_1__/* .getChapterIdFromUrl */ .Ug)(window.location.href);
                if (chapterId) {
                    const chapterSelector = `#${chapterId} ${_config__WEBPACK_IMPORTED_MODULE_3__/* .CHAPTER_BODY_SELECTOR */ .tA}`;
                    targetElement = document.querySelector(chapterSelector);
                    if (!targetElement) {
                        (0,_utils__WEBPACK_IMPORTED_MODULE_1__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, `WTR Term Replacer: Unable to re-acquire target element for chapter ${chapterId}`);
                        throw new Error("Unable to re-acquire target element");
                    }
                    (0,_utils__WEBPACK_IMPORTED_MODULE_1__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, `WTR Term Replacer: Re-acquired target element for chapter ${chapterId}`);
                    elementStabilityCounter++;
                }
                else {
                    (0,_utils__WEBPACK_IMPORTED_MODULE_1__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, "WTR Term Replacer: Cannot determine chapter ID for element recovery");
                    throw new Error("Cannot determine chapter ID for element recovery");
                }
            }
            // Additional DOM validation before proceeding
            if (!document.contains(targetElement) || !targetElement.parentNode) {
                (0,_utils__WEBPACK_IMPORTED_MODULE_1__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, "WTR Term Replacer: Target element validation failed - not in stable DOM");
                throw new Error("Target element not in stable DOM");
            }
            (0,_utils__WEBPACK_IMPORTED_MODULE_1__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, "WTR Term Replacer: Element validation passed, executing replacement logic");
            // Perform the actual replacement logic
            await executeReplacementLogic(targetElement);
            (0,_utils__WEBPACK_IMPORTED_MODULE_1__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, `WTR Term Replacer: Replacement attempt ${attempt} successful`);
            return; // Success, exit retry loop
        }
        catch (error) {
            lastError = error;
            (0,_utils__WEBPACK_IMPORTED_MODULE_1__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, `WTR Term Replacer: Replacement attempt ${attempt} failed:`, error.message);
            if (attempt < maxRetries) {
                // Progressive backoff with stability checks
                const delay = Math.min(100 * Math.pow(2, attempt - 1), 2000);
                (0,_utils__WEBPACK_IMPORTED_MODULE_1__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, `WTR Term Replacer: Retrying in ${delay}ms...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
                // Pre-retry stability check
                if (error.message && error.message.includes("DOM")) {
                    elementStabilityCounter++;
                }
            }
            else {
                (0,_utils__WEBPACK_IMPORTED_MODULE_1__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, `WTR Term Replacer: All ${maxRetries} attempts failed, giving up`);
            }
        }
    }
    // All retries failed
    (0,_utils__WEBPACK_IMPORTED_MODULE_1__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, `WTR Term Replacer: All replacement attempts failed, throwing error: ${lastError?.message || "Unknown error"}`);
    throw lastError || new Error("Unknown replacement error");
}
// Enhanced element stability validation
function validateElementStability(element, stabilityCounter) {
    if (!element || !document.contains(element)) {
        return false;
    }
    // Check if element is visible and attached to DOM
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
        return false;
    }
    // Check parent chain is stable
    let parent = element.parentNode;
    let stabilityCheckCount = 0;
    while (parent && stabilityCheckCount < 10) {
        if (!document.contains(parent)) {
            return false;
        }
        parent = parent.parentNode;
        stabilityCheckCount++;
    }
    // Allow limited DOM recreation (stabilityCounter < 3)
    return stabilityCounter < 3;
}
async function executeReplacementLogic(targetElement) {
    // Validate target element state before processing
    if (!targetElement || targetElement.nodeType !== Node.ELEMENT_NODE) {
        throw new Error("Invalid target element");
    }
    // Additional DOM stability validation
    if (!validateElementStability(targetElement, 0)) {
        throw new Error("Target element DOM stability check failed");
    }
    // Check if element has meaningful content to process
    const textContent = targetElement.textContent?.trim() || "";
    if (textContent.length === 0) {
        const chapterId = (0,_utils__WEBPACK_IMPORTED_MODULE_1__/* .getChapterIdFromUrl */ .Ug)(window.location.href) || "unknown";
        const contentLength = targetElement.textContent?.length || 0;
        (0,_utils__WEBPACK_IMPORTED_MODULE_1__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, `WTR Term Replacer: Target element has no text content in chapter ${chapterId} (${contentLength} chars), skipping`);
        return;
    }
    // Collect all text nodes and aggregate into a single string.
    const walker = document.createTreeWalker(targetElement, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
        if (!node.parentElement.closest(".wtr-replacer-ui, script, style")) {
            textNodes.push(node);
        }
    }
    const nodeValues = new Map();
    const nodeMap = [];
    let fullText = "";
    let currentPos = 0;
    textNodes.forEach((n) => {
        if (!_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.originalTextNodes.has(n)) {
            _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.originalTextNodes.set(n, n.nodeValue);
        }
        const originalValue = _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.originalTextNodes.get(n);
        nodeValues.set(n, originalValue);
        if (originalValue.length > 0) {
            nodeMap.push({ node: n, start: currentPos, end: currentPos + originalValue.length });
        }
        fullText += originalValue;
        currentPos += originalValue.length;
    });
    if (!fullText.trim()) {
        (0,_ui__WEBPACK_IMPORTED_MODULE_2__/* .showProcessingIndicator */ .gn)(false);
        return;
    }
    // Categorize terms
    const simple_cs_partial = new Map();
    const simple_cs_whole = new Map();
    const simple_ci_partial = new Map();
    const simple_ci_whole = new Map();
    const regex_terms = [];
    for (const term of _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.terms) {
        if (!term.original) {
            continue;
        }
        if (term.isRegex) {
            try {
                const flags = term.caseSensitive ? "g" : "gi";
                regex_terms.push({
                    pattern: new RegExp(term.original, flags),
                    replacement: term.replacement,
                });
            }
            catch (e) {
                console.error(`Skipping invalid regex for term "${term.original}":`, e);
            }
        }
        else {
            const key = term.caseSensitive ? term.original : term.original.toLowerCase();
            const value = term.replacement;
            if (term.caseSensitive) {
                if (term.wholeWord) {
                    simple_cs_whole.set(key, value);
                }
                else {
                    simple_cs_partial.set(key, value);
                }
            }
            else {
                if (term.wholeWord) {
                    simple_ci_whole.set(key, value);
                }
                else {
                    simple_ci_partial.set(key, value);
                }
            }
        }
    }
    // Compile categorized terms into combined patterns.
    const compiledTerms = [...regex_terms];
    const addSimpleGroup = (map, flags, wholeWord, caseSensitive) => {
        if (map.size > 0) {
            const sortedKeys = [...map.keys()].sort((a, b) => b.length - a.length);
            const patterns = sortedKeys.map((k) => {
                const escaped = (0,_utils__WEBPACK_IMPORTED_MODULE_1__/* .escapeRegExp */ .Nt)(k);
                return wholeWord ? `\\b${escaped}\\b` : escaped;
            });
            const combined = patterns.join("|");
            compiledTerms.push({
                pattern: new RegExp(combined, flags),
                replacement_map: map,
                is_simple: true,
                case_sensitive: caseSensitive,
            });
        }
    };
    addSimpleGroup(simple_cs_partial, "g", false, true);
    addSimpleGroup(simple_cs_whole, "g", true, true);
    addSimpleGroup(simple_ci_partial, "gi", false, false);
    addSimpleGroup(simple_ci_whole, "gi", true, false);
    // Find ALL possible matches from all compiled terms.
    const allMatches = [];
    for (const comp of compiledTerms) {
        for (const match of fullText.matchAll(comp.pattern)) {
            if (match.index === match.index + match[0].length) {
                continue;
            } // Skip zero-length matches
            let replacementText;
            if (comp.is_simple) {
                const key = comp.case_sensitive ? match[0] : match[0].toLowerCase();
                replacementText = comp.replacement_map.get(key);
            }
            else {
                replacementText = comp.replacement;
            }
            if (replacementText !== undefined) {
                allMatches.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    replacement: replacementText,
                });
            }
        }
    }
    // Resolve overlaps: Sort by start index, then by end index descending (longest match wins).
    allMatches.sort((a, b) => {
        if (a.start !== b.start) {
            return a.start - b.start;
        }
        return b.end - a.end;
    });
    // Select the non-overlapping "winning" matches.
    const winningMatches = [];
    let lastEnd = -1;
    for (const match of allMatches) {
        if (match.start >= lastEnd) {
            winningMatches.push(match);
            lastEnd = match.end;
        }
    }
    // Apply winning matches to the nodeValues map, from last to first.
    for (const match of winningMatches.reverse()) {
        const { start: matchStart, end: matchEnd, replacement: replacementString } = match;
        const affectedNodesInfo = [];
        for (const info of nodeMap) {
            if (info.start < matchEnd && info.end > matchStart) {
                affectedNodesInfo.push(info);
            }
        }
        if (affectedNodesInfo.length === 0) {
            continue;
        }
        const firstNodeInfo = affectedNodesInfo[0];
        const lastNodeInfo = affectedNodesInfo[affectedNodesInfo.length - 1];
        const startNode = firstNodeInfo.node;
        const lastNode = lastNodeInfo.node;
        const startOffset = matchStart - firstNodeInfo.start;
        const endOffset = matchEnd - lastNodeInfo.start;
        if (startNode === lastNode) {
            const currentVal = nodeValues.get(startNode);
            nodeValues.set(startNode, currentVal.substring(0, startOffset) + replacementString + currentVal.substring(endOffset));
        }
        else {
            const lastVal = nodeValues.get(lastNode);
            nodeValues.set(lastNode, lastVal.substring(endOffset));
            for (let i = 1; i < affectedNodesInfo.length - 1; i++) {
                nodeValues.set(affectedNodesInfo[i].node, "");
            }
            const firstVal = nodeValues.get(startNode);
            nodeValues.set(startNode, firstVal.substring(0, startOffset) + replacementString);
        }
    }
    // After all processing, apply the final values to the DOM.
    for (const n of textNodes) {
        const finalValue = nodeValues.get(n);
        if (n.nodeValue !== finalValue) {
            n.nodeValue = finalValue;
        }
    }
    (0,_ui__WEBPACK_IMPORTED_MODULE_2__/* .showProcessingIndicator */ .gn)(false);
}
function traverseAndRevert(node) {
    if (node.nodeType === Node.TEXT_NODE) {
        if (_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.originalTextNodes.has(node)) {
            node.nodeValue = _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.originalTextNodes.get(node);
        }
        return;
    }
    if (node.nodeType === Node.ELEMENT_NODE &&
        node.tagName.toLowerCase() !== "script" &&
        node.tagName.toLowerCase() !== "style") {
        if (node.classList.contains("wtr-replacer-ui")) {
            return;
        }
        for (const child of node.childNodes) {
            traverseAndRevert(child);
        }
    }
}
async function revertAllReplacements(targetElement) {
    if (!targetElement) {
        return;
    }
    (0,_ui__WEBPACK_IMPORTED_MODULE_2__/* .showProcessingIndicator */ .gn)(true);
    await new Promise((resolve) => setTimeout(resolve, 10));
    traverseAndRevert(targetElement);
    (0,_ui__WEBPACK_IMPORTED_MODULE_2__/* .showProcessingIndicator */ .gn)(false);
}


/***/ },

/***/ 359
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  IY: () => (/* binding */ addTermProgrammatically),
  nS: () => (/* binding */ clearDiscoveryFormState),
  Af: () => (/* binding */ handleAddTermAutocompleteClick),
  eC: () => (/* binding */ handleAddTermAutocompleteInput),
  az: () => (/* binding */ handleAddTermFromSelection),
  Jm: () => (/* binding */ handleDeleteSelected),
  ts: () => (/* binding */ handleDisableToggle),
  Si: () => (/* binding */ handleDiscoveryCandidateClick),
  DG: () => (/* binding */ handleDiscoveryRefreshChapter),
  gF: () => (/* binding */ handleDiscoveryRefreshNovel),
  Pq: () => (/* binding */ handleDiscoverySearch),
  ym: () => (/* binding */ handleExportAll),
  ow: () => (/* binding */ handleExportCombined),
  b7: () => (/* binding */ handleExportNovel),
  kF: () => (/* binding */ handleFileImport),
  y$: () => (/* binding */ handleFindDuplicates),
  VM: () => (/* binding */ handleListInteraction),
  JB: () => (/* binding */ handleReplacementSuggestionClick),
  s7: () => (/* binding */ handleSaveTerm),
  RX: () => (/* binding */ handleSearch),
  Qk: () => (/* binding */ handleTabSwitch),
  Me: () => (/* binding */ handleTextSelection),
  X: () => (/* binding */ hideUIPanel),
  s3: () => (/* binding */ restoreTermListLocation),
  R6: () => (/* reexport */ storage.saveTermListLocation),
  WF: () => (/* binding */ switchToDiscoveryAssistant),
  o6: () => (/* binding */ toggleLogging),
  fA: () => (/* binding */ validateRegexSilent)
});

// UNUSED EXPORTS: downloadJSON, initializeTermDiscovery, setSearchFieldValue, validateRegex

// EXTERNAL MODULE: ./src/modules/state.ts
var state = __webpack_require__(654);
// EXTERNAL MODULE: ./src/modules/storage.ts
var storage = __webpack_require__(694);
// EXTERNAL MODULE: ./src/modules/ui.ts
var ui = __webpack_require__(141);
// EXTERNAL MODULE: ./src/modules/observer.ts
var observer = __webpack_require__(405);
// EXTERNAL MODULE: ./src/modules/duplicates.ts
var duplicates = __webpack_require__(201);
// EXTERNAL MODULE: ./src/modules/utils.ts
var utils = __webpack_require__(158);
// EXTERNAL MODULE: ./src/modules/engine.ts
var engine = __webpack_require__(9);
;// ./src/modules/termDiscoveryHelpers.ts
const MAX_TERM_LENGTH = 80;
const MAX_REPLACEMENT_LENGTH = 120;
const MAX_RESULTS = 100;
const CONTROL_CHARS_PATTERN = /[\u0000-\u001f\u007f]/g;
const HTML_TAG_PATTERN = /<[^>]*>/g;
const HTML_ENTITY_PATTERN = /&(?:nbsp|amp|lt|gt|quot|#39);/gi;
const SAFE_IDENTIFIER_PATTERN = /^[A-Za-z0-9_.:-]{1,80}$/;
const WTR_SOURCE_ID_PREFIX = "id.";
const COMMON_WORDS = new Set([
    "A",
    "An",
    "And",
    "As",
    "At",
    "But",
    "By",
    "For",
    "From",
    "He",
    "Her",
    "His",
    "I",
    "In",
    "Into",
    "It",
    "Of",
    "On",
    "Or",
    "She",
    "The",
    "They",
    "This",
    "To",
    "Was",
    "With",
]);
function sanitizeApiText(value, maxLength = MAX_TERM_LENGTH) {
    if (typeof value !== "string" && typeof value !== "number") {
        return null;
    }
    const normalized = String(value)
        .replace(CONTROL_CHARS_PATTERN, " ")
        .replace(/\s+/g, " ")
        .trim();
    if (!normalized) {
        return null;
    }
    return normalized.slice(0, maxLength);
}
function stripHtml(value) {
    return value
        .replace(HTML_TAG_PATTERN, " ")
        .replace(HTML_ENTITY_PATTERN, (entity) => {
        const lower = entity.toLowerCase();
        if (lower === "&nbsp;") {
            return " ";
        }
        if (lower === "&amp;") {
            return "&";
        }
        if (lower === "&lt;") {
            return "<";
        }
        if (lower === "&gt;") {
            return ">";
        }
        if (lower === "&quot;") {
            return '"';
        }
        return "'";
    });
}
function sanitizeIdentifier(value) {
    const sanitized = sanitizeApiText(value, 80);
    if (!sanitized || !SAFE_IDENTIFIER_PATTERN.test(sanitized)) {
        return undefined;
    }
    return sanitized;
}
function sanitizePreferenceHash(value) {
    return sanitizeApiText(value, MAX_TERM_LENGTH) || undefined;
}
function sanitizeLang(value, fallback = "en") {
    const sanitized = sanitizeApiText(value, 12);
    if (sanitized && /^[a-z]{2}(?:-[A-Z]{2})?$/.test(sanitized)) {
        return sanitized;
    }
    return fallback;
}
function parsePositiveInteger(value, pattern = /^(\d+)$/) {
    const sanitized = sanitizeApiText(value, 80);
    const match = sanitized?.match(pattern);
    if (!match) {
        return null;
    }
    const parsed = Number(match[1]);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}
function sanitizeTranslateService(value) {
    const sanitized = sanitizeApiText(value, 20);
    return sanitized && /^[a-z][a-z0-9_-]{0,19}$/i.test(sanitized) ? sanitized : "ai";
}
function buildReaderGetPayload(context, translateService = "ai") {
    const rawId = parsePositiveInteger(context.rawId);
    const chapterNoSource = context.chapterNo ?? context.chapterSlug;
    const chapterNo = parsePositiveInteger(chapterNoSource, /^(?:chapter-)?(\d+)$/);
    if (!rawId || !chapterNo) {
        return null;
    }
    const payload = {
        translate: sanitizeTranslateService(translateService),
        language: sanitizeLang(context.lang),
        raw_id: rawId,
        chapter_no: chapterNo,
        retry: false,
        force_retry: false,
    };
    const chapterId = parsePositiveInteger(context.chapterId);
    if (chapterId) {
        payload.chapter_id = chapterId;
    }
    return payload;
}
function firstTextValue(entry, keys, maxLength = MAX_TERM_LENGTH) {
    for (const fieldName of keys) {
        const value = sanitizeApiText(entry[fieldName], maxLength);
        if (value) {
            return value;
        }
    }
    return null;
}
function firstNumberValue(entry, keys) {
    for (const fieldName of keys) {
        const value = entry[fieldName];
        if (typeof value === "number" && Number.isFinite(value)) {
            return Math.max(0, value);
        }
        if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
            return Math.max(0, Number(value));
        }
    }
    return 0;
}
function getArrayPayload(payload) {
    if (Array.isArray(payload)) {
        return payload;
    }
    if (!payload || typeof payload !== "object") {
        return [];
    }
    const objectPayload = payload;
    for (const fieldName of ["data", "terms", "items", "results", "preferences", "sources", "glossaries"]) {
        const value = objectPayload[fieldName];
        if (Array.isArray(value)) {
            return value;
        }
        if (value && typeof value === "object") {
            const nested = getArrayPayload(value);
            if (nested.length > 0) {
                return nested;
            }
        }
    }
    return [];
}
function isRecord(value) {
    return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
function isWtrTermTuple(value) {
    return Array.isArray(value) && Array.isArray(value[0]) && (typeof value[1] === "string" || typeof value[1] === "number");
}
function getGlossarySourceId(entry) {
    const explicitSourceId = sanitizeIdentifier(entry.source_id ?? entry.sourceId);
    if (explicitSourceId) {
        return explicitSourceId;
    }
    const data = isRecord(entry.data) ? entry.data : null;
    const sourceType = sanitizeIdentifier(data?.type ?? entry.type);
    const sourceId = sanitizeIdentifier(data?.id ?? entry.id ?? entry.raw_id ?? entry.rawId);
    if (!sourceType || !sourceId) {
        return undefined;
    }
    return `${WTR_SOURCE_ID_PREFIX}${sourceType}.${sourceId}`;
}
function collectNovelTermEntries(payload, fallbackLang, sourceId) {
    if (isWtrTermTuple(payload)) {
        return [{ item: payload, sourceId, lang: fallbackLang }];
    }
    if (Array.isArray(payload)) {
        return payload.flatMap((item) => collectNovelTermEntries(item, fallbackLang, sourceId));
    }
    if (!isRecord(payload)) {
        return [];
    }
    const localSourceId = getGlossarySourceId(payload) || sourceId;
    const localLang = sanitizeLang(payload.lang ?? payload.language, fallbackLang);
    const directTerm = firstTextValue(payload, ["source", "original", "source_text", "sourceText", "from", "term", "raw", "name"]);
    if (directTerm) {
        return [{ item: payload, sourceId: localSourceId, lang: localLang }];
    }
    const nestedEntries = [];
    for (const fieldName of ["glossaries", "data", "terms", "items", "results", "sources"]) {
        const value = payload[fieldName];
        if (value && (Array.isArray(value) || typeof value === "object")) {
            nestedEntries.push(...collectNovelTermEntries(value, localLang, localSourceId));
        }
    }
    return nestedEntries;
}
function firstTextFromArray(values, maxLength = MAX_TERM_LENGTH) {
    for (const value of values) {
        const text = sanitizeApiText(value, maxLength);
        if (text) {
            return text;
        }
    }
    return null;
}
function maxNumberValue(values) {
    return values.reduce((maxValue, value) => {
        if (typeof value === "number" && Number.isFinite(value)) {
            return Math.max(maxValue, value);
        }
        if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
            return Math.max(maxValue, Number(value));
        }
        return maxValue;
    }, 0);
}
function collectReaderText(payload, depth = 0) {
    if (depth > 6 || payload == null) {
        return [];
    }
    if (typeof payload === "string") {
        return payload.length > 40 ? [payload] : [];
    }
    if (Array.isArray(payload)) {
        return payload.flatMap((item) => collectReaderText(item, depth + 1));
    }
    if (typeof payload !== "object") {
        return [];
    }
    const objectPayload = payload;
    const textKeys = ["body", "content", "chapter", "chapter_body", "chapterBody", "html", "text"];
    const directText = textKeys.flatMap((fieldName) => collectReaderText(objectPayload[fieldName], depth + 1));
    if (directText.length > 0) {
        return directText;
    }
    return Object.values(objectPayload).flatMap((value) => collectReaderText(value, depth + 1));
}
function rankChapterTermCandidates(text, existingTerms = new Set(), limit = 50) {
    const strippedText = stripHtml(text);
    const counts = new Map();
    const addTerm = (rawTerm) => {
        const term = sanitizeApiText(rawTerm);
        if (!term || term.length < 2 || existingTerms.has(term) || COMMON_WORDS.has(term)) {
            return;
        }
        counts.set(term, (counts.get(term) || 0) + 1);
    };
    const latinMatches = strippedText.matchAll(/\b[A-Z][\p{L}\p{M}'-]*(?:\s+[A-Z][\p{L}\p{M}'-]*){0,3}\b/gu);
    for (const match of latinMatches) {
        addTerm(match[0]);
    }
    const cjkMatches = strippedText.matchAll(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\uAC00-\uD7AF]{2,12}/gu);
    for (const match of cjkMatches) {
        addTerm(match[0]);
    }
    return Array.from(counts.entries())
        .map(([term, count]) => ({ term, count, source: "chapter" }))
        .sort((a, b) => b.count - a.count || a.term.localeCompare(b.term))
        .slice(0, limit);
}
function extractCurrentChapterCandidates(readerPayload, existingTerms = new Set(), limit = 50) {
    const text = collectReaderText(readerPayload).join(" ");
    if (!text) {
        return [];
    }
    return rankChapterTermCandidates(text, existingTerms, limit);
}
function parseNovelTermEntries(payload, lang = "en", limit = MAX_RESULTS) {
    const deduped = new Map();
    const entries = collectNovelTermEntries(payload, sanitizeLang(lang));
    for (const { item, sourceId: inheritedSourceId, lang: entryLang } of entries) {
        let term = null;
        let replacement = null;
        let count = 0;
        let sourceId = inheritedSourceId;
        let hash;
        let candidateLang = entryLang;
        if (Array.isArray(item)) {
            const replacements = Array.isArray(item[0]) ? item[0] : [];
            term = sanitizeApiText(item[1]);
            replacement = firstTextFromArray(replacements, MAX_REPLACEMENT_LENGTH);
            count = maxNumberValue(item.slice(2));
            hash = sanitizePreferenceHash(item[1]);
        }
        else if (isRecord(item)) {
            term = firstTextValue(item, ["source", "original", "source_text", "sourceText", "from", "term", "raw", "name"]);
            replacement = firstTextValue(item, ["target", "replacement", "target_text", "targetText", "translation", "value", "to"], MAX_REPLACEMENT_LENGTH);
            count = firstNumberValue(item, [
                "popularity",
                "count",
                "uses",
                "usage",
                "frequency",
                "preference_count",
                "userCount",
                "user_count",
            ]);
            sourceId = sanitizeIdentifier(item.source_id ?? item.sourceId ?? item.id) || sourceId;
            hash = sanitizePreferenceHash(item.hash ?? item.source_hash ?? item.sourceHash ?? item.from ?? item.source ?? item.original ?? term);
            candidateLang = sanitizeLang(item.lang ?? item.language, candidateLang);
        }
        if (!term) {
            continue;
        }
        const candidate = {
            term,
            replacement: replacement || undefined,
            source: "novel",
            count,
            sourceId,
            hash,
            lang: candidateLang,
        };
        const mapKey = term.toLocaleLowerCase();
        const previous = deduped.get(mapKey);
        if (!previous || candidate.count > previous.count || (!previous.hash && candidate.hash)) {
            deduped.set(mapKey, candidate);
        }
    }
    return Array.from(deduped.values())
        .sort((a, b) => b.count - a.count || a.term.localeCompare(b.term))
        .slice(0, limit);
}
function getDiscoveryCandidateKey(candidate) {
    if (!candidate) {
        return "";
    }
    return [candidate.term, candidate.replacement || "", candidate.source, candidate.sourceId || "", candidate.hash || "", candidate.lang || ""].join("\u001f");
}
function isReplacementSuggestionRequestCurrent(requestId, latestRequestId, candidateKey, selectedCandidateKey, inputValue, currentInputValue) {
    return requestId === latestRequestId && candidateKey === selectedCandidateKey && inputValue === currentInputValue;
}
function parseReplacementPreferences(payload, limit = 20) {
    const deduped = new Map();
    const entries = getArrayPayload(payload);
    for (const item of entries) {
        if (!item || typeof item !== "object") {
            continue;
        }
        const entry = item;
        const replacement = firstTextValue(entry, ["target", "replacement", "target_text", "targetText", "translation", "value", "to"], MAX_REPLACEMENT_LENGTH);
        if (!replacement) {
            continue;
        }
        const count = firstNumberValue(entry, [
            "count",
            "score",
            "votes",
            "uses",
            "usage",
            "preference_count",
            "users_count",
            "userCount",
            "user_count",
        ]);
        const mapKey = replacement.toLocaleLowerCase();
        const previous = deduped.get(mapKey);
        if (!previous || count > previous.count) {
            deduped.set(mapKey, { replacement, count });
        }
    }
    return Array.from(deduped.values())
        .sort((a, b) => b.count - a.count || a.replacement.localeCompare(b.replacement))
        .slice(0, limit);
}

;// ./src/modules/termDiscovery.ts



const DISCOVERY_CACHE_PREFIX = "wtr_lab_term_discovery_cache_v2_";
const CHAPTER_CACHE_TTL_MS = 30 * 60 * 1000;
const NOVEL_TERMS_CACHE_TTL_MS = 60 * 60 * 1000;
const PREFERENCES_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
function getReaderContext() {
    return (0,utils/* getReaderContextFromPath */.o7)(window.location.pathname);
}
function getCurrentChapterElement(context) {
    if (context.chapterSlug) {
        const chapterRoot = document.getElementById(context.chapterSlug);
        const chapterBody = chapterRoot?.querySelector(".chapter-body");
        if (chapterBody) {
            return chapterBody;
        }
        if (chapterRoot) {
            return chapterRoot;
        }
    }
    return document.querySelector(".chapter-body");
}
function readDataValue(element, names) {
    if (!element) {
        return null;
    }
    for (const name of names) {
        const value = element.getAttribute(name);
        if (value) {
            return value;
        }
    }
    return null;
}
function getReaderPageMetadata(context) {
    const chapterElement = getCurrentChapterElement(context);
    const chapterRoot = context.chapterSlug ? document.getElementById(context.chapterSlug) : null;
    return {
        chapterNo: readDataValue(chapterElement, ["data-chapter-no", "data-order", "data-chapter-order"])
            || readDataValue(chapterRoot, ["data-chapter-no", "data-order", "data-chapter-order"]),
        chapterId: readDataValue(chapterElement, ["data-chapter-id"])
            || readDataValue(chapterRoot, ["data-chapter-id"]),
    };
}
function getCurrentChapterText(context) {
    return getCurrentChapterElement(context)?.textContent || "";
}
function getCsrfToken() {
    const meta = document.querySelector('meta[name="csrf-token"], meta[name="csrf_token"]');
    return meta?.getAttribute("content") || null;
}
function getExistingOriginalTerms() {
    return new Set((state/* state */.wk.terms || []).map((term) => term?.original).filter(Boolean));
}
function getCacheKey(type, identifiers) {
    return `${DISCOVERY_CACHE_PREFIX}${type}_${identifiers.filter(Boolean).join("_")}`;
}
async function readCache(key, ttlMs) {
    try {
        const entry = (await GM_getValue(key, null));
        if (!entry || typeof entry.fetchedAt !== "number" || Date.now() - entry.fetchedAt > ttlMs) {
            return null;
        }
        return entry.data;
    }
    catch (_error) {
        return null;
    }
}
async function writeCache(key, data) {
    try {
        await GM_setValue(key, { fetchedAt: Date.now(), data });
    }
    catch (_error) {
        // Discovery cache is optional and must never block the main term workflow.
    }
}
async function fetchJson(url, init = {}) {
    const headers = new Headers(init.headers || {});
    headers.set("Accept", "application/json");
    const csrfToken = getCsrfToken();
    if (csrfToken) {
        headers.set("X-CSRF-TOKEN", csrfToken);
    }
    const response = await fetch(url, {
        ...init,
        credentials: "same-origin",
        headers,
    });
    if (!response.ok) {
        throw new Error(`WTR API returned ${response.status}`);
    }
    return response.json();
}
function hasPreferenceIdentifiers(candidate) {
    return Boolean(candidate?.sourceId && candidate?.hash && candidate?.lang);
}
async function loadCurrentChapterCandidates(forceRefresh = false) {
    const context = getReaderContext();
    if (!context.rawId || !context.chapterSlug) {
        return [];
    }
    const cacheKey = getCacheKey("chapter", [context.lang, context.rawId, context.chapterSlug]);
    if (!forceRefresh) {
        const cached = await readCache(cacheKey, CHAPTER_CACHE_TTL_MS);
        if (cached) {
            return cached;
        }
    }
    const existingTerms = getExistingOriginalTerms();
    const visibleChapterText = getCurrentChapterText(context);
    const visibleCandidates = extractCurrentChapterCandidates(visibleChapterText, existingTerms, 75);
    if (visibleCandidates.length > 0) {
        await writeCache(cacheKey, visibleCandidates);
        return visibleCandidates;
    }
    const pageMetadata = getReaderPageMetadata(context);
    const payload = buildReaderGetPayload({ ...context, ...pageMetadata });
    if (!payload) {
        return [];
    }
    const headers = new Headers({ "Content-Type": "application/json" });
    const apiPayload = await fetchJson("/api/reader/get", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
    });
    const candidates = extractCurrentChapterCandidates(apiPayload, existingTerms, 75);
    await writeCache(cacheKey, candidates);
    return candidates;
}
async function loadNovelTermEntries(forceRefresh = false) {
    const context = getReaderContext();
    if (!context.rawId) {
        return [];
    }
    const cacheKey = getCacheKey("novel", [context.lang, context.rawId]);
    if (!forceRefresh) {
        const cached = await readCache(cacheKey, NOVEL_TERMS_CACHE_TTL_MS);
        if (cached) {
            return cached;
        }
    }
    const apiPayload = await fetchJson(`/api/v2/reader/terms/${encodeURIComponent(context.rawId)}.json`);
    const candidates = parseNovelTermEntries(apiPayload, context.lang, 200);
    await writeCache(cacheKey, candidates);
    return candidates;
}
async function loadReplacementSuggestions(candidate, forceRefresh = false) {
    if (!hasPreferenceIdentifiers(candidate)) {
        return [];
    }
    const sourceId = candidate.sourceId;
    const hash = candidate.hash;
    const lang = candidate.lang;
    const cacheKey = getCacheKey("preferences", [lang, sourceId, hash]);
    if (!forceRefresh) {
        const cached = await readCache(cacheKey, PREFERENCES_CACHE_TTL_MS);
        if (cached) {
            return cached;
        }
    }
    const params = new URLSearchParams({ source_id: sourceId, hash, lang });
    const apiPayload = await fetchJson(`/api/v2/term-preferences?${params.toString()}`);
    const suggestions = parseReplacementPreferences(apiPayload, 12);
    await writeCache(cacheKey, suggestions);
    return suggestions;
}

// EXTERNAL MODULE: ./config/versions.js
var versions = __webpack_require__(387);
;// ./src/modules/handlers.ts
// Event handler functions for WTR Lab Term Replacer


// Re-export saveTermListLocation for UI module









// Export hideUIPanel function that can be called from UI
function hideUIPanel() {
    (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, "WTR Term Replacer: UI panel hide requested");
    (0,ui/* hideUIPanel */.X)();
}
function switchToDiscoveryAssistant() {
    (0,ui/* switchTab */.OG)("discover");
    initializeTermDiscovery();
}
function validateRegex(pattern) {
    try {
        new RegExp(pattern);
        (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, `WTR Term Replacer: Valid regex pattern: ${pattern}`);
        return true;
    }
    catch (e) {
        (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, `WTR Term Replacer: Invalid regex pattern: ${pattern} - ${e.message}`);
        return false;
    }
}
// Silent validation for real-time visual feedback
function validateRegexSilent(pattern) {
    try {
        new RegExp(pattern);
        return { isValid: true, error: null };
    }
    catch (e) {
        return { isValid: false, error: e.message };
    }
}
function ensureDiscoveryState() {
    if (!state/* state */.wk.termDiscovery) {
        state/* state */.wk.termDiscovery = {
            chapterCandidates: [],
            novelTerms: [],
            replacementSuggestions: [],
            autocompleteCandidates: [],
            selectedCandidate: null,
            status: "Idle",
            lastSearch: "",
        };
    }
    return state/* state */.wk.termDiscovery;
}
function setDiscoveryStatus(message) {
    ensureDiscoveryState().status = message;
    const statusEl = document.getElementById("wtr-discovery-status");
    if (statusEl) {
        statusEl.textContent = message;
    }
}
function createTermCandidateItem(candidate, sourceType, index) {
    const li = document.createElement("li");
    li.className = "wtr-discovery-result-item";
    const details = document.createElement("div");
    details.className = "wtr-discovery-result-details";
    const termText = document.createElement("strong");
    termText.textContent = candidate.term;
    details.appendChild(termText);
    if (candidate.replacement) {
        const replacementText = document.createElement("span");
        replacementText.className = "wtr-discovery-replacement-preview";
        replacementText.textContent = ` → ${candidate.replacement}`;
        details.appendChild(replacementText);
    }
    const meta = document.createElement("small");
    const metaParts = [`${candidate.source === "chapter" ? "chapter" : "novel"} candidate`];
    if (candidate.count > 0) {
        metaParts.push(candidate.source === "chapter" ? `${candidate.count} matches` : `score ${candidate.count}`);
    }
    if (hasPreferenceIdentifiers(candidate)) {
        metaParts.push("popularity available");
    }
    meta.textContent = metaParts.join(" • ");
    details.appendChild(meta);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-primary btn-sm wtr-discovery-use-btn";
    button.dataset.sourceType = sourceType;
    button.dataset.index = String(index);
    button.textContent = "Use";
    li.appendChild(details);
    li.appendChild(button);
    return li;
}
function renderCandidateList(containerId, candidates, sourceType, emptyText) {
    const list = document.getElementById(containerId);
    if (!list) {
        return;
    }
    list.textContent = "";
    if (candidates.length === 0) {
        const empty = document.createElement("li");
        empty.className = "wtr-discovery-empty";
        empty.textContent = emptyText;
        list.appendChild(empty);
        return;
    }
    const fragment = document.createDocumentFragment();
    candidates.forEach((candidate, index) => {
        fragment.appendChild(createTermCandidateItem(candidate, sourceType, index));
    });
    list.appendChild(fragment);
}
function getFilteredNovelTerms(query) {
    const discovery = ensureDiscoveryState();
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const novelTerms = discovery.novelTerms;
    if (!normalizedQuery) {
        return novelTerms.slice(0, 20);
    }
    return novelTerms
        .filter((candidate) => candidate.term.toLocaleLowerCase().includes(normalizedQuery) ||
        (candidate.replacement || "").toLocaleLowerCase().includes(normalizedQuery))
        .slice(0, 30);
}
function renderDiscoveryResults() {
    const discovery = ensureDiscoveryState();
    renderCandidateList("wtr-current-chapter-candidates", discovery.chapterCandidates, "chapter", "No current-chapter candidates loaded yet.");
    renderCandidateList("wtr-novel-term-results", getFilteredNovelTerms(discovery.lastSearch || ""), "novel", "No novel-wide terms match this search.");
    setDiscoveryStatus(discovery.status || "Idle");
}
function renderAddTermAutocomplete(candidates) {
    const discovery = ensureDiscoveryState();
    const container = document.getElementById("wtr-add-term-autocomplete-results");
    if (!container) {
        discovery.autocompleteCandidates = [];
        return;
    }
    container.textContent = "";
    discovery.autocompleteCandidates = candidates.slice(0, 8);
    if (discovery.autocompleteCandidates.length === 0) {
        return;
    }
    const fragment = document.createDocumentFragment();
    discovery.autocompleteCandidates.forEach((candidate, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "wtr-autocomplete-option";
        button.dataset.index = String(index);
        button.textContent = candidate.replacement ? `${candidate.term} → ${candidate.replacement}` : candidate.term;
        fragment.appendChild(button);
    });
    container.appendChild(fragment);
}
function renderReplacementSuggestions(suggestions, message = "") {
    const container = document.getElementById("wtr-replacement-suggestions");
    if (!container) {
        return;
    }
    container.textContent = "";
    if (message) {
        const messageEl = document.createElement("small");
        messageEl.textContent = message;
        container.appendChild(messageEl);
        return;
    }
    if (suggestions.length === 0) {
        return;
    }
    const label = document.createElement("small");
    label.textContent = "Popular replacements:";
    container.appendChild(label);
    const buttonWrap = document.createElement("div");
    buttonWrap.className = "wtr-replacement-suggestion-buttons";
    suggestions.forEach((suggestion) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "btn btn-secondary btn-sm wtr-replacement-suggestion-btn";
        button.dataset.replacement = suggestion.replacement;
        button.textContent = suggestion.count > 0 ? `${suggestion.replacement} (${suggestion.count})` : suggestion.replacement;
        buttonWrap.appendChild(button);
    });
    container.appendChild(buttonWrap);
}
function findNovelCandidateByTerm(term) {
    const normalizedTerm = term.trim().toLocaleLowerCase();
    if (!normalizedTerm) {
        return null;
    }
    const discovery = ensureDiscoveryState();
    return (discovery.novelTerms.find((candidate) => candidate.term.toLocaleLowerCase() === normalizedTerm) || null);
}
let replacementSuggestionRequestId = 0;
function isActiveReplacementSuggestionRequest(requestId, candidate, inputValue) {
    const originalInput = document.getElementById("wtr-original");
    const currentInputValue = originalInput ? originalInput.value.trim() : "";
    const discovery = ensureDiscoveryState();
    return isReplacementSuggestionRequestCurrent(requestId, replacementSuggestionRequestId, getDiscoveryCandidateKey(candidate), getDiscoveryCandidateKey(discovery.selectedCandidate), inputValue, currentInputValue);
}
async function updateReplacementSuggestionsForCandidate(candidate) {
    const discovery = ensureDiscoveryState();
    discovery.selectedCandidate = candidate;
    const requestId = ++replacementSuggestionRequestId;
    const originalInput = document.getElementById("wtr-original");
    const inputValue = originalInput ? originalInput.value.trim() : "";
    if (!candidate) {
        discovery.replacementSuggestions = [];
        renderReplacementSuggestions([]);
        return;
    }
    if (!hasPreferenceIdentifiers(candidate)) {
        discovery.replacementSuggestions = [];
        renderReplacementSuggestions([], "No popularity data is available for this term.");
        return;
    }
    try {
        const suggestions = await loadReplacementSuggestions(candidate);
        if (!isActiveReplacementSuggestionRequest(requestId, candidate, inputValue)) {
            return;
        }
        ensureDiscoveryState().replacementSuggestions = suggestions;
        renderReplacementSuggestions(suggestions, suggestions.length ? "" : "No popular replacements found yet.");
    }
    catch (error) {
        if (!isActiveReplacementSuggestionRequest(requestId, candidate, inputValue)) {
            return;
        }
        (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, "WTR Term Replacer: Replacement suggestions unavailable", error);
        renderReplacementSuggestions([], "Popularity suggestions are unavailable right now.");
    }
}
function clearDiscoveryFormState() {
    if (autocompleteTimeout) {
        clearTimeout(autocompleteTimeout);
        autocompleteTimeout = null;
    }
    const discovery = ensureDiscoveryState();
    discovery.autocompleteCandidates = [];
    discovery.replacementSuggestions = [];
    discovery.selectedCandidate = null;
    replacementSuggestionRequestId++;
    const autocompleteContainer = document.getElementById("wtr-add-term-autocomplete-results");
    if (autocompleteContainer) {
        autocompleteContainer.textContent = "";
    }
    const suggestionsContainer = document.getElementById("wtr-replacement-suggestions");
    if (suggestionsContainer) {
        suggestionsContainer.textContent = "";
    }
}
async function chooseDiscoveryCandidate(candidate) {
    if (!candidate) {
        return;
    }
    (0,ui/* showUIPanel */.E1)();
    (0,ui/* showFormView */.BD)();
    const originalInput = document.getElementById("wtr-original");
    const replacementInput = document.getElementById("wtr-replacement");
    originalInput.value = candidate.term;
    if (candidate.replacement) {
        replacementInput.value = candidate.replacement;
    }
    originalInput.dispatchEvent(new Event("input", { bubbles: true }));
    replacementInput.dispatchEvent(new Event("input", { bubbles: true }));
    replacementInput.focus();
    await updateReplacementSuggestionsForCandidate(candidate);
}
let autocompleteTimeout = null;
async function handleDiscoveryRefreshChapter() {
    setDiscoveryStatus("Loading current-chapter candidates...");
    try {
        const candidates = await loadCurrentChapterCandidates(true);
        ensureDiscoveryState().chapterCandidates = candidates;
        setDiscoveryStatus(candidates.length ? `Loaded ${candidates.length} current-chapter candidates.` : "No chapter candidates found.");
    }
    catch (error) {
        (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, "WTR Term Replacer: Current-chapter discovery failed", error);
        setDiscoveryStatus("Current-chapter API data is unavailable right now.");
    }
    finally {
        renderDiscoveryResults();
    }
}
async function handleDiscoveryRefreshNovel() {
    setDiscoveryStatus("Loading novel-wide term data...");
    try {
        const candidates = await loadNovelTermEntries(true);
        ensureDiscoveryState().novelTerms = candidates;
        setDiscoveryStatus(candidates.length ? `Loaded ${candidates.length} novel-wide terms.` : "No novel-wide terms found.");
    }
    catch (error) {
        (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, "WTR Term Replacer: Novel-wide discovery failed", error);
        setDiscoveryStatus("Novel-wide term API data is unavailable right now.");
    }
    finally {
        renderDiscoveryResults();
    }
}
function handleDiscoverySearch(event) {
    ensureDiscoveryState().lastSearch = event.target.value || "";
    renderDiscoveryResults();
}
function handleDiscoveryCandidateClick(event) {
    const button = event.target.closest(".wtr-discovery-use-btn");
    if (!button) {
        return;
    }
    const discovery = ensureDiscoveryState();
    const sourceType = button.dataset.sourceType;
    const index = Number(button.dataset.index);
    const candidates = sourceType === "chapter" ? discovery.chapterCandidates : getFilteredNovelTerms(discovery.lastSearch || "");
    chooseDiscoveryCandidate(candidates[index] || null);
}
async function initializeTermDiscovery() {
    const discovery = ensureDiscoveryState();
    if (discovery.novelTerms.length === 0) {
        try {
            discovery.novelTerms = await loadNovelTermEntries(false);
        }
        catch (error) {
            (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, "WTR Term Replacer: Cached novel-wide discovery unavailable", error);
        }
    }
    renderDiscoveryResults();
}
function handleAddTermAutocompleteInput(event) {
    if (autocompleteTimeout) {
        clearTimeout(autocompleteTimeout);
    }
    autocompleteTimeout = setTimeout(async () => {
        const query = event.target.value || "";
        const discovery = ensureDiscoveryState();
        const selectedCandidate = discovery.selectedCandidate;
        if (selectedCandidate && selectedCandidate.term === query.trim()) {
            renderAddTermAutocomplete([]);
            return;
        }
        if (discovery.novelTerms.length === 0) {
            try {
                discovery.novelTerms = await loadNovelTermEntries(false);
            }
            catch (error) {
                (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, "WTR Term Replacer: Add-term autocomplete unavailable", error);
            }
        }
        const candidates = getFilteredNovelTerms(query);
        renderAddTermAutocomplete(query.trim() ? candidates : []);
        updateReplacementSuggestionsForCandidate(findNovelCandidateByTerm(query));
    }, 250);
}
function handleAddTermAutocompleteClick(event) {
    const button = event.target.closest(".wtr-autocomplete-option");
    if (!button) {
        return;
    }
    const container = document.getElementById("wtr-add-term-autocomplete-results");
    const discovery = ensureDiscoveryState();
    const candidates = discovery.autocompleteCandidates;
    const candidate = candidates[Number(button.dataset.index)] || null;
    chooseDiscoveryCandidate(candidate);
    discovery.autocompleteCandidates = [];
    if (container) {
        container.textContent = "";
    }
}
function handleReplacementSuggestionClick(event) {
    const button = event.target.closest(".wtr-replacement-suggestion-btn");
    if (!button) {
        return;
    }
    const replacementInput = document.getElementById("wtr-replacement");
    if (replacementInput) {
        replacementInput.value = button.dataset.replacement || "";
        replacementInput.dispatchEvent(new Event("input", { bubbles: true }));
        replacementInput.focus();
    }
}
async function handleSaveTerm() {
    (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, "WTR Term Replacer: Handle save term started");
    const id = document.getElementById("wtr-term-id").value;
    const originalInput = document.getElementById("wtr-original");
    const replacementInput = document.getElementById("wtr-replacement");
    const original = originalInput.value.trim();
    const isRegex = document.getElementById("wtr-is-regex").checked;
    const wholeWord = document.getElementById("wtr-whole-word").checked;
    (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, `WTR Term Replacer: Saving term - original: "${original}", replacement: "${replacementInput.value}", isRegex: ${isRegex}, wholeWord: ${wholeWord}, caseSensitive: ${document.getElementById("wtr-case-sensitive").checked}`);
    if (!original) {
        (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, "WTR Term Replacer: Save term failed - empty original text");
        return; // No error message shown, rely on disabled save button
    }
    if (isRegex && !validateRegex(original)) {
        (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, "WTR Term Replacer: Save term failed - invalid regex pattern");
        return; // No error message shown, rely on visual feedback
    }
    const newTerm = {
        id: id || `term_${Date.now()}`,
        original,
        replacement: replacementInput.value,
        caseSensitive: document.getElementById("wtr-case-sensitive").checked,
        isRegex,
        wholeWord: isRegex ? false : wholeWord,
    };
    const existingIndex = state/* state */.wk.terms.findIndex((t) => t.id === newTerm.id);
    if (existingIndex > -1) {
        (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, `WTR Term Replacer: Updating existing term ${newTerm.id}`);
        state/* state */.wk.terms[existingIndex] = newTerm;
    }
    else {
        (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, `WTR Term Replacer: Adding new term ${newTerm.id}`);
        state/* state */.wk.terms.push(newTerm);
    }
    await (0,storage.saveTerms)(state/* state */.wk.terms);
    (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, `WTR Term Replacer: Term saved successfully, total terms: ${state/* state */.wk.terms.length}`);
    (0,observer/* reprocessCurrentChapter */.J)();
    // Clear form fields
    originalInput.value = "";
    replacementInput.value = "";
    document.getElementById("wtr-term-id").value = "";
    document.getElementById("wtr-case-sensitive").checked = false;
    document.getElementById("wtr-is-regex").checked = false;
    document.getElementById("wtr-whole-word").checked = false;
    document.getElementById("wtr-save-btn").textContent = "Save Term";
    clearDiscoveryFormState();
    (0,ui/* renderTermList */.FP)(state/* state */.wk.currentSearchValue);
    if (id) {
        (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, "WTR Term Replacer: Switching to terms tab after update");
        (0,ui/* switchTab */.OG)("terms");
    }
    else {
        (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, "WTR Term Replacer: Focusing on original input for next term");
        originalInput.focus();
    }
    if (state/* state */.wk.isDupMode) {
        (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, "WTR Term Replacer: Updating duplicate mode after term change");
        (0,duplicates/* updateDupModeAfterChange */.Cs)();
    }
}
function handleListInteraction(e) {
    const termId = e.target.closest("li")?.dataset.id;
    if (!termId) {
        return;
    }
    if (e.target.classList.contains("wtr-edit-btn")) {
        const term = state/* state */.wk.terms.find((t) => t.id === termId);
        if (term) {
            (0,ui/* showFormView */.BD)(term);
        }
    }
}
async function handleDeleteSelected() {
    (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, "WTR Term Replacer: Delete selected terms started");
    (0,ui/* showUILoader */.Xt)();
    try {
        const selectedIds = [...document.querySelectorAll(".wtr-replacer-term-select:checked")].map((cb) => cb.dataset.id);
        (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, `WTR Term Replacer: Found ${selectedIds.length} terms selected for deletion: ${selectedIds.join(", ")}`);
        if (selectedIds.length === 0) {
            (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, "WTR Term Replacer: Delete cancelled - no terms selected");
            alert("No terms selected.");
            return;
        }
        if (confirm(`Delete ${selectedIds.length} term(s)?`)) {
            (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, "WTR Term Replacer: User confirmed deletion, proceeding...");
            const filteredTerms = state/* state */.wk.terms.filter((t) => !selectedIds.includes(t.id));
            (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, `WTR Term Replacer: Deleting ${state/* state */.wk.terms.length - filteredTerms.length} terms, ${filteredTerms.length} remaining`);
            await (0,storage.saveTerms)(filteredTerms);
            await (0,storage.loadData)();
            (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, "WTR Term Replacer: Terms deleted and data reloaded");
            (0,observer/* reprocessCurrentChapter */.J)();
            if (state/* state */.wk.isDupMode) {
                (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, "WTR Term Replacer: Updating duplicate mode after deletion");
                (0,duplicates/* updateDupModeAfterChange */.Cs)();
            }
            else {
                (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, "WTR Term Replacer: Refreshing term list display");
                (0,ui/* renderTermList */.FP)(state/* state */.wk.currentSearchValue);
            }
        }
        else {
            (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, "WTR Term Replacer: Delete cancelled by user");
        }
    }
    catch (error) {
        (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, `WTR Term Replacer: Error during term deletion: ${error.message}`);
        console.error("Error during term deletion:", error);
    }
    finally {
        (0,ui/* hideUILoader */.W4)();
    }
}
function handleTextSelection(e) {
    const CHAPTER_BODY_SELECTOR = ".chapter-body";
    if (!e.target.closest(CHAPTER_BODY_SELECTOR)) {
        return;
    }
    const selection = window.getSelection().toString().trim();
    const floatBtn = document.querySelector(".wtr-add-term-float-btn");
    if (selection && selection.length > 0 && selection.length < 100) {
        floatBtn.style.display = "block";
    }
    else {
        floatBtn.style.display = "none";
    }
}
function handleAddTermFromSelection() {
    const selection = window.getSelection().toString().trim();
    if (selection) {
        (0,ui/* showUIPanel */.E1)();
        (0,ui/* showFormView */.BD)();
        document.getElementById("wtr-original").value = selection;
        document.getElementById("wtr-replacement").focus();
    }
    document.querySelector(".wtr-add-term-float-btn").style.display = "none";
}
function handleSearch(e) {
    if (state/* state */.wk.isDupMode) {
        return;
    }
    state/* state */.wk.currentSearchValue = e.target.value;
    state/* state */.wk.currentPage = 1;
    (0,ui/* renderTermList */.FP)(state/* state */.wk.currentSearchValue);
    // Immediately save the search field value for reactive behavior
    (0,storage.saveSearchFieldValue)();
}
async function handleDisableToggle(e) {
    state/* state */.wk.settings.isDisabled = e.target.checked;
    await (0,storage.saveSettings)(state/* state */.wk.settings);
    const getChapterIdFromUrl = (url) => {
        const match = url.match(/(chapter-\d+)/);
        return match ? match[1] : null;
    };
    const CHAPTER_BODY_SELECTOR = ".chapter-body";
    const chapterId = getChapterIdFromUrl(window.location.href);
    if (!chapterId) {
        return;
    }
    const chapterSelector = `#${chapterId} ${CHAPTER_BODY_SELECTOR}`;
    const chapterBody = document.querySelector(chapterSelector);
    if (chapterBody) {
        if (state/* state */.wk.settings.isDisabled) {
            (0,engine.revertAllReplacements)(chapterBody);
        }
        else {
            (0,engine.performReplacements)(chapterBody);
        }
    }
}
function downloadJSON(data, filename) {
    return new Promise((resolve) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        resolve();
    });
}
// Enhanced Export Functions
async function handleExportNovel() {
    const exportData = {
        formatVersion: (0,versions.getVersion)(),
        settings: { [state/* state */.wk.novelSlug]: state/* state */.wk.settings },
        terms: { [state/* state */.wk.novelSlug]: state/* state */.wk.terms },
    };
    downloadJSON(exportData, `${state/* state */.wk.novelSlug}-terms.json`);
}
async function handleExportAll() {
    (0,ui/* showUILoader */.Xt)();
    try {
        const allKeys = await GM_listValues();
        const TERMS_STORAGE_KEY_PREFIX = "wtr_lab_terms_";
        const SETTINGS_STORAGE_KEY_PREFIX = "wtr_lab_settings_";
        const termKeys = allKeys.filter((k) => k.startsWith(TERMS_STORAGE_KEY_PREFIX));
        const settingKeys = allKeys.filter((k) => k.startsWith(SETTINGS_STORAGE_KEY_PREFIX));
        const exportData = { formatVersion: (0,versions.getVersion)(), settings: {}, terms: {} };
        for (const key of termKeys) {
            const slug = key.replace(TERMS_STORAGE_KEY_PREFIX, "");
            exportData.terms[slug] = await GM_getValue(key);
        }
        for (const key of settingKeys) {
            const slug = key.replace(SETTINGS_STORAGE_KEY_PREFIX, "");
            exportData.settings[slug] = await GM_getValue(key);
        }
        downloadJSON(exportData, "wtr-lab-all-terms-backup.json");
    }
    catch (e) {
        console.error("Error exporting all terms:", e);
        alert("Failed to export all terms.");
    }
    finally {
        (0,ui/* hideUILoader */.W4)();
    }
}
// Enhanced dual export functionality with sequential downloads
async function handleExportCombined() {
    (0,ui/* showUILoader */.Xt)();
    try {
        // Step 1: Export novel terms first
        const novelExportData = {
            formatVersion: (0,versions.getVersion)(),
            settings: { [state/* state */.wk.novelSlug]: state/* state */.wk.settings },
            terms: { [state/* state */.wk.novelSlug]: state/* state */.wk.terms },
        };
        await downloadJSON(novelExportData, `${state/* state */.wk.novelSlug}-terms.json`);
        // Step 2: Ask user for confirmation before proceeding to second download
        const userConfirmed = confirm('The first file (Novel Terms) has been downloaded. Please check if the download completed successfully. Click "OK" to proceed with the second download (All Terms backup), or "Cancel" to skip.');
        if (userConfirmed) {
            // Step 3: Export all terms only after user confirmation
            const allKeys = await GM_listValues();
            const TERMS_STORAGE_KEY_PREFIX = "wtr_lab_terms_";
            const SETTINGS_STORAGE_KEY_PREFIX = "wtr_lab_settings_";
            const termKeys = allKeys.filter((k) => k.startsWith(TERMS_STORAGE_KEY_PREFIX));
            const settingKeys = allKeys.filter((k) => k.startsWith(SETTINGS_STORAGE_KEY_PREFIX));
            const allExportData = { formatVersion: (0,versions.getVersion)(), settings: {}, terms: {} };
            for (const key of termKeys) {
                const slug = key.replace(TERMS_STORAGE_KEY_PREFIX, "");
                allExportData.terms[slug] = await GM_getValue(key);
            }
            for (const key of settingKeys) {
                const slug = key.replace(SETTINGS_STORAGE_KEY_PREFIX, "");
                allExportData.settings[slug] = await GM_getValue(key);
            }
            await downloadJSON(allExportData, "wtr-lab-all-terms-backup.json");
            alert("Both files have been successfully exported!");
        }
        else {
            alert("Second export cancelled. Only the novel terms file was downloaded.");
        }
    }
    catch (e) {
        console.error("Error exporting combined terms:", e);
        alert("Failed to export combined terms. Please try again.");
    }
    finally {
        (0,ui/* hideUILoader */.W4)();
    }
}
async function handleFileImport(event) {
    (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, `WTR Term Replacer: File import started, import type: ${state/* state */.wk.importType}`);
    (0,ui/* showUILoader */.Xt)();
    try {
        const file = event.target.files[0];
        if (!file) {
            (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, "WTR Term Replacer: No file selected for import");
            return;
        }
        (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, `WTR Term Replacer: Importing file: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);
        const reader = new FileReader();
        reader.onload = async (e) => {
            const content = String(e.target.result ?? "");
            (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, `WTR Term Replacer: File content loaded, length: ${content.length} characters`);
            let importedData;
            try {
                importedData = JSON.parse(content);
                (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, "WTR Term Replacer: JSON parsed successfully");
            }
            catch (err) {
                (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, `WTR Term Replacer: Import failed - invalid JSON: ${err.message}`);
                alert("Import failed. Invalid JSON data. Error: " + err.message);
                return;
            }
            const isNewFormat = Boolean(importedData.formatVersion);
            let termsData;
            let settingsData;
            const isArrayData = Array.isArray(importedData);
            const isOldGlobal = !isNewFormat && !isArrayData && typeof importedData === "object";
            (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, `WTR Term Replacer: Detected format - isNewFormat: ${isNewFormat}, isArrayData: ${isArrayData}, isOldGlobal: ${isOldGlobal}`);
            if (isArrayData) {
                termsData = { [state/* state */.wk.novelSlug]: importedData };
                (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, "WTR Term Replacer: Array format detected, mapping to current novel");
            }
            else if (isOldGlobal) {
                termsData = importedData;
                (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, "WTR Term Replacer: Old global format detected");
            }
            else if (isNewFormat) {
                termsData = importedData.terms || {};
                settingsData = importedData.settings || {};
                (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, `WTR Term Replacer: New format detected - terms: ${Object.keys(termsData).length} slugs, settings: ${Object.keys(settingsData).length} slugs`);
            }
            else {
                (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, "WTR Term Replacer: Import failed - unrecognized data format");
                alert("Import failed. Unrecognized data format.");
                return;
            }
            let slugs = Object.keys(termsData);
            (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, `WTR Term Replacer: Found data for ${slugs.length} slugs: ${slugs.join(", ")}`);
            if (state/* state */.wk.importType === "novel" && slugs.length > 1) {
                (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, "WTR Term Replacer: Novel import with multiple slugs - warning user");
                alert("Warning: File contains data for multiple novels, but importing to current novel only. Use Global Import for all.");
                termsData = { [state/* state */.wk.novelSlug]: termsData[Object.keys(termsData)[0]] || [] };
                if (settingsData) {
                    settingsData = { [state/* state */.wk.novelSlug]: settingsData[Object.keys(settingsData)[0]] || {} };
                }
                slugs = [state/* state */.wk.novelSlug];
            }
            let shouldImportSettings = false;
            if (settingsData && Object.keys(settingsData).length > 0) {
                (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, "WTR Term Replacer: Settings detected in import, asking user for confirmation");
                shouldImportSettings = confirm("This file contains settings. Would you like to import and overwrite your current settings?");
            }
            let totalAdded = 0, totalSkipped = 0, totalConflicts = 0, invalidCount = 0, validCount = 0;
            (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, "WTR Term Replacer: Starting term import process...");
            for (const slug of slugs) {
                (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, `WTR Term Replacer: Processing import for slug: ${slug}`);
                const existingTerms = await GM_getValue(`wtr_lab_terms_${slug}`, []);
                (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, `WTR Term Replacer: Existing terms for ${slug}: ${existingTerms.length}`);
                let overwrite = true;
                if (existingTerms.length > 0) {
                    (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, `WTR Term Replacer: Existing terms found for ${slug}, asking user about merge vs overwrite`);
                    overwrite = !confirm(`An existing term list was found for ${slug}. Would you like to merge? (OK = Merge, Cancel = Overwrite)`);
                    if (!overwrite) {
                        if (!confirm("Are you sure you want to overwrite?")) {
                            (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, `WTR Term Replacer: User cancelled overwrite for ${slug}`);
                            continue;
                        }
                        overwrite = true;
                    }
                }
                const rawTerms = termsData[slug] || [];
                (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, `WTR Term Replacer: Raw terms for ${slug}: ${rawTerms.length}`);
                if (!Array.isArray(rawTerms)) {
                    (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, `WTR Term Replacer: Skipping ${slug} - not an array`);
                    continue;
                }
                const validatedTerms = rawTerms.filter((term) => {
                    term.wholeWord = term.wholeWord ?? false;
                    if (term.isRegex) {
                        try {
                            new RegExp(term.original);
                            validCount++;
                            return true;
                        }
                        catch (err) {
                            invalidCount++;
                            (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, `WTR Term Replacer: Skipping invalid regex term: "${term.original}" - ${err.message}`);
                            console.warn(`Skipping invalid regex term on import: "${term.original}"`);
                            return false;
                        }
                    }
                    validCount++;
                    return true;
                });
                (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, `WTR Term Replacer: Validated terms for ${slug}: ${validatedTerms.length} valid, ${invalidCount} invalid`);
                const { added, skipped, conflicts } = await (0,storage.processAndSaveTerms)(slug, validatedTerms, overwrite);
                totalAdded += added;
                totalSkipped += skipped;
                totalConflicts += conflicts;
                (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, `WTR Term Replacer: Import results for ${slug} - added: ${added}, skipped: ${skipped}, conflicts: ${conflicts}`);
            }
            if (shouldImportSettings) {
                (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, "WTR Term Replacer: Importing settings data...");
                await (0,storage.processAndSaveSettings)(settingsData);
            }
            (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, "WTR Term Replacer: Reloading data and reprocessing chapters...");
            await (0,storage.loadData)();
            (0,observer/* reprocessCurrentChapter */.J)();
            (0,ui/* renderTermList */.FP)(state/* state */.wk.currentSearchValue);
            if (state/* state */.wk.isDupMode) {
                (0,duplicates/* updateDupModeAfterChange */.Cs)();
            }
            let summary = "Import successful!";
            (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, `WTR Term Replacer: Import completed - totalAdded: ${totalAdded}, totalSkipped: ${totalSkipped}, totalConflicts: ${totalConflicts}, invalidCount: ${invalidCount}, validCount: ${validCount}`);
            if (totalAdded > 0 || totalSkipped > 0 || totalConflicts > 0) {
                summary += `\n${totalAdded} new terms added. ${totalSkipped} duplicates skipped. ${totalConflicts} conflicts skipped.`;
            }
            if (invalidCount > 0) {
                summary += `\n${validCount} terms imported. ${invalidCount} terms skipped due to invalid regex.`;
            }
            alert(summary);
        };
        reader.readAsText(file);
        event.target.value = "";
        (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, "WTR Term Replacer: File import process initiated");
    }
    catch (e) {
        (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, `WTR Term Replacer: Import error: ${e.message}`);
        alert("An error occurred during import.");
        console.error(e);
    }
    finally {
        (0,ui/* hideUILoader */.W4)();
    }
}
function handleTabSwitch(e) {
    const targetTab = e.target.dataset.tab;
    // Save current state before switching (if on terms tab)
    const currentTab = document.querySelector(".wtr-replacer-tab-btn.active").dataset.tab;
    if (currentTab === "terms") {
        // Save the full scroll position when leaving terms tab
        (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, `WTR Term Replacer: Saving scroll position before switching from terms to ${targetTab}`);
        (0,storage.saveTermListLocation)();
    }
    document.querySelectorAll(".wtr-replacer-tab-btn").forEach((btn) => btn.classList.remove("active"));
    e.target.classList.add("active");
    document.querySelectorAll(".wtr-replacer-tab-content").forEach((content) => content.classList.remove("active"));
    document.getElementById(`wtr-tab-${targetTab}`).classList.add("active");
    if (targetTab === "terms") {
        (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, "WTR Term Replacer: Restoring scroll position after switching to terms tab");
        restoreTermListLocation();
    }
    else {
        (0,ui/* clearTermList */.kH)();
        if (targetTab === "discover") {
            initializeTermDiscovery();
        }
    }
}
async function handleFindDuplicates() {
    (0,ui/* showUILoader */.Xt)();
    try {
        const TERMS_KEY = `wtr_lab_terms_${state/* state */.wk.novelSlug}`;
        const currentNovelTerms = await GM_getValue(TERMS_KEY, []);
        (0,duplicates/* computeDupGroups */.r_)(currentNovelTerms);
        if (state/* state */.wk.dupKeys.length === 0) {
            alert("No duplicates found.");
            return;
        }
        state/* state */.wk.isDupMode = true;
        state/* state */.wk.currentDupIndex = 0;
        state/* state */.wk.currentSearchValue = "";
        setSearchFieldValue("");
    }
    finally {
        (0,ui/* hideUILoader */.W4)();
    }
}
// Use duplicate functions from duplicates module (imported above)
// Helper function to set search field value programmatically with reactive save
function setSearchFieldValue(value) {
    const searchBar = document.getElementById("wtr-search-bar");
    if (searchBar) {
        searchBar.value = value;
        state/* state */.wk.currentSearchValue = value;
        state/* state */.wk.currentPage = 1;
        (0,ui/* renderTermList */.FP)(state/* state */.wk.currentSearchValue);
        (0,storage.saveSearchFieldValue)();
    }
}
async function restoreTermListLocation() {
    try {
        const saved = await GM_getValue(`wtr_lab_term_list_location_${state/* state */.wk.novelSlug}`, null);
        if (saved) {
            state/* state */.wk.savedTermListLocation = saved;
            (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, `WTR Term Replacer: Restoring scroll position - top: ${saved.scrollTop}, page: ${saved.page}`);
        }
        state/* state */.wk.currentPage = state/* state */.wk.savedTermListLocation.page || 1;
        state/* state */.wk.currentSearchValue = state/* state */.wk.savedTermListLocation.searchValue || "";
        // Apply the saved state to the UI
        const searchBar = document.getElementById("wtr-search-bar");
        if (searchBar && state/* state */.wk.currentSearchValue) {
            searchBar.value = state/* state */.wk.currentSearchValue;
        }
        (0,ui/* renderTermList */.FP)(state/* state */.wk.currentSearchValue);
        // Restore scroll position after a short delay to ensure rendering is complete
        setTimeout(() => {
            const termListContainer = document.querySelector(".wtr-replacer-content");
            if (termListContainer && state/* state */.wk.savedTermListLocation.scrollTop) {
                termListContainer.scrollTop = state/* state */.wk.savedTermListLocation.scrollTop;
                (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, `WTR Term Replacer: Scroll position restored to ${state/* state */.wk.savedTermListLocation.scrollTop}`);
            }
        }, 100);
    }
    catch (e) {
        console.error("Error restoring term list location:", e);
    }
}
function toggleLogging() {
    state/* state */.wk.globalSettings.isLoggingEnabled = !state/* state */.wk.globalSettings.isLoggingEnabled;
    (0,storage.saveGlobalSettings)();
    alert(`Logging ${state/* state */.wk.globalSettings.isLoggingEnabled ? "enabled" : "disabled"}.`);
}
// Additional functions needed for index.js integration
async function addTermProgrammatically(original, replacement, isRegex = false) {
    if (!original) {
        return;
    }
    const newTerm = {
        id: `term_${Date.now()}`,
        original: original.trim(),
        replacement: replacement.trim(),
        caseSensitive: false,
        isRegex: isRegex,
        wholeWord: isRegex ? false : false,
    };
    const isDuplicate = state/* state */.wk.terms.some((t) => t.original === newTerm.original && t.replacement === newTerm.replacement && t.isRegex === newTerm.isRegex);
    if (!isDuplicate) {
        state/* state */.wk.terms.push(newTerm);
        await (0,storage.saveTerms)(state/* state */.wk.terms);
        (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, `WTR Term Replacer: Programmatically added term (Regex: ${isRegex}): ${newTerm.original} -> ${newTerm.replacement}`);
        if (document.querySelector(".wtr-replacer-ui").style.display === "flex") {
            (0,ui/* renderTermList */.FP)(state/* state */.wk.currentSearchValue);
        }
    }
    else {
        (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, `WTR Term Replacer: Skipped adding duplicate term: ${newTerm.original}`);
    }
}


/***/ },

/***/ 405
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   J: () => (/* binding */ reprocessCurrentChapter),
/* harmony export */   _: () => (/* binding */ waitForInitialContent),
/* harmony export */   processVisibleChapter: () => (/* binding */ processVisibleChapter)
/* harmony export */ });
/* unused harmony import specifier */ var state;
/* unused harmony import specifier */ var getChapterIdFromUrl;
/* unused harmony import specifier */ var log;
/* harmony import */ var _state__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(654);
/* harmony import */ var _engine__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(9);
/* harmony import */ var _ui__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(141);
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(158);
// MutationObserver and content handling for WTR Lab Term Replacer




function waitForInitialContent() {
    (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, "WTR Term Replacer: Starting robust content detection for slow-loading websites...");
    // Set up mutation observer for dynamic content loading
    (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, "WTR Term Replacer: Setting up content change observer");
    setupContentObserver();
    // Set up additional fallback mechanisms
    (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, "WTR Term Replacer: Setting up fallback detection mechanisms");
    setupFallbackDetection();
}
function _detectContentWithMultipleStrategies() {
    const detectionStrategies = [
        // Strategy 1: Standard chapter ID detection
        () => {
            const chapterId = getChapterIdFromUrl(window.location.href);
            const contentContainer = chapterId ? document.querySelector(`#${chapterId}`) : null;
            return contentContainer ? { container: contentContainer, strategy: "chapter-id" } : null;
        },
        // Strategy 2: Look for chapter body directly
        () => {
            const CHAPTER_BODY_SELECTOR = ".chapter-body";
            const chapterBody = document.querySelector(CHAPTER_BODY_SELECTOR);
            return chapterBody ? { container: chapterBody.closest('[id*="chapter"]'), strategy: "chapter-body" } : null;
        },
        // Strategy 3: Look for any container with substantial content
        () => {
            const contentAreas = document.querySelectorAll('main, article, .content, .chapter, [role="main"]');
            for (const area of contentAreas) {
                if (area.textContent?.trim().length > 200) {
                    return { container: area, strategy: "content-area" };
                }
            }
            return null;
        },
        // Strategy 4: Last resort - any substantial text content
        () => {
            const bodyText = document.body.textContent?.trim() || "";
            if (bodyText.length > 500 && !bodyText.includes("loading")) {
                return { container: document.body, strategy: "body-fallback" };
            }
            return null;
        },
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
                console.warn("WTR Term Replacer: All detection strategies exhausted. Will retry on content changes.");
                // Keep fallback detection active
            }
            else {
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
                log("WTR Term Replacer: Content ready for processing, proceeding...");
                processVisibleChapter();
                return true;
            }
            else if (currentDelayIndex < settlingDelays.length - 1) {
                currentDelayIndex++;
                log(`WTR Term Replacer: Content not ready, waiting ${settlingDelays[currentDelayIndex]}ms more...`);
                setTimeout(attemptProcessing, settlingDelays[currentDelayIndex]);
                return false;
            }
            else {
                log("WTR Term Replacer: Final attempt with current content state");
                processVisibleChapter(); // Force processing
                return true;
            }
        }
        catch (error) {
            log("WTR Term Replacer: Error during progressive processing:", error);
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
    const hasChapterContent = container.querySelector(CHAPTER_BODY_SELECTOR) || container.querySelector("p, h1, h2, h3, h4, h5, h6");
    return hasSubstantialContent && hasNoActiveLoaders && isVisible && hasChapterContent;
}
function setupContentObserver() {
    // Watch for dynamic content loading with enhanced coordination
    let observerTimeout;
    let lastCheckTime = 0;
    let isContentChangeInProgress = false;
    let potentialMultiScriptConflicts = 0;
    const observer = new MutationObserver((mutations) => {
        // Prevent excessive triggering with timing constraints
        const now = Date.now();
        if (now - lastCheckTime < 2000) {
            // Minimum 2 seconds between checks
            return;
        }
        let shouldCheckForContent = false;
        const detectedScriptChanges = [];
        for (const mutation of mutations) {
            if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
                // Check if substantial content was added
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const textContent = node.textContent?.trim() || "";
                        // Detect multi-script data attributes being added
                        if (node.hasAttribute?.("data-smart-quotes-processed")) {
                            detectedScriptChanges.push("Smart Quotes");
                            shouldCheckForContent = true;
                        }
                        if (node.hasAttribute?.("data-uncensor-processed")) {
                            detectedScriptChanges.push("Uncensor");
                            shouldCheckForContent = true;
                        }
                        if (node.hasAttribute?.("data-auto-scroll") || node.hasAttribute?.("data-reader-enhanced")) {
                            detectedScriptChanges.push("Reader Enhancer");
                            shouldCheckForContent = true;
                        }
                        // More strict content validation to reduce false positives
                        if (textContent.length > 100 &&
                            !textContent.includes("loading") &&
                            !textContent.includes("...") &&
                            (node.id?.includes("chapter") ||
                                node.className?.includes("chapter") ||
                                node.querySelector(".chapter-body"))) {
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
                (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .log */ .Rm)(`WTR Term Replacer: Multi-script activity detected from: ${detectedScriptChanges.join(", ")} (conflict ${potentialMultiScriptConflicts})`);
                // Update our detected scripts
                detectedScriptChanges.forEach((script) => _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.otherWTRScripts.add(script));
            }
            else {
                (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .log */ .Rm)("WTR Term Replacer: Content changes detected, checking for chapter content...");
            }
            // Debounced check to avoid excessive processing with enhanced delay for multi-script
            const baseDelay = 1500;
            const multiScriptDelay = _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.otherWTRScripts.size > 0 ? 2500 : baseDelay;
            clearTimeout(observerTimeout);
            observerTimeout = setTimeout(() => {
                const queuedForProcessing = document.querySelector("[data-wtr-processed]") || _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.processingQueue.size > 0;
                if (!queuedForProcessing) {
                    (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .log */ .Rm)(`WTR Term Replacer: Initiating content processing (${_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.otherWTRScripts.size} other scripts active, ${multiScriptDelay}ms coordination delay)`);
                    processVisibleChapter();
                }
                else {
                    (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .log */ .Rm)(`WTR Term Replacer: Skipping content processing - already in progress or completed (queue: ${_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.processingQueue.size})`);
                }
                isContentChangeInProgress = false;
            }, multiScriptDelay); // Increased delay to coordinate with other processes
        }
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style", "class", "id"],
    });
    (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .log */ .Rm)("WTR Term Replacer: Enhanced content observer activated with multi-script coordination");
}
function setupFallbackDetection() {
    // Periodic fallback check for stubborn slow-loading pages
    let fallbackAttempts = 0;
    const maxFallbackAttempts = 10;
    const fallbackInterval = setInterval(() => {
        if (document.querySelector("[data-wtr-processed]")) {
            clearInterval(fallbackInterval);
            return;
        }
        fallbackAttempts++;
        (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .log */ .Rm)(`WTR Term Replacer: Fallback attempt ${fallbackAttempts}/${maxFallbackAttempts}`);
        // Try processing if we have any chapter-like content
        const chapterId = (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .getChapterIdFromUrl */ .Ug)(window.location.href);
        if (chapterId) {
            const CHAPTER_BODY_SELECTOR = ".chapter-body";
            const chapterSelector = `#${chapterId} ${CHAPTER_BODY_SELECTOR}`;
            const chapterBody = document.querySelector(chapterSelector);
            if (chapterBody) {
                (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .log */ .Rm)("WTR Term Replacer: Fallback processing successful");
                processVisibleChapter();
                clearInterval(fallbackInterval);
                return;
            }
        }
        // Check for any substantial content that might be chapter content
        const potentialContent = document.querySelector("main, article, .content, .chapter");
        if (potentialContent && potentialContent.textContent?.trim().length > 200) {
            (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .log */ .Rm)("WTR Term Replacer: Fallback processing with detected content");
            processVisibleChapter();
            clearInterval(fallbackInterval);
        }
        if (fallbackAttempts >= maxFallbackAttempts) {
            clearInterval(fallbackInterval);
            (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .log */ .Rm)("WTR Term Replacer: Fallback detection exhausted");
        }
    }, 3000); // Check every 3 seconds
    // Clear fallback interval after 5 minutes to prevent infinite polling
    setTimeout(() => {
        clearInterval(fallbackInterval);
    }, 300000);
}
function processVisibleChapter() {
    const chapterId = (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .getChapterIdFromUrl */ .Ug)(window.location.href);
    if (!chapterId) {
        return;
    }
    const CHAPTER_BODY_SELECTOR = ".chapter-body";
    const chapterSelector = `#${chapterId} ${CHAPTER_BODY_SELECTOR}`;
    const chapterBody = document.querySelector(chapterSelector);
    if (!chapterBody) {
        return;
    }
    if (chapterBody.dataset.wtrProcessed === "true") {
        return;
    }
    // Use queue-based processing to avoid race conditions
    scheduleChapterProcessing(chapterId, chapterBody);
}
function scheduleChapterProcessing(chapterId, _chapterBody) {
    const processingKey = `${chapterId}_${Date.now()}`;
    // Enhanced queue management with proper synchronization
    if (_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.processingQueue.has(chapterId)) {
        (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .log */ .Rm)(`WTR Term Replacer: Chapter ${chapterId} already queued for processing ${_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.processingQueue.size} queued`);
        return;
    }
    // Add with unique identifier to prevent race conditions
    _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.processingQueue.add(processingKey);
    // Progressive retry with exponential backoff for slow-loading content
    const retryAttempts = [
        { delay: 100, maxContentLoad: 0.3 }, // Fast retry for quick loads
        { delay: 500, maxContentLoad: 0.5 }, // Medium retry for normal loads
        { delay: 1000, maxContentLoad: 0.7 }, // Slower retry for slow loads
        { delay: 2000, maxContentLoad: 0.9 }, // Very slow retry for very slow loads
        { delay: 5000, maxContentLoad: 1.0 }, // Final attempt with any content
    ];
    executeProcessingWithRetry(chapterId, retryAttempts, 0, processingKey);
}
async function executeProcessingWithRetry(chapterId, retryAttempts, attemptIndex, processingKey) {
    const attempt = retryAttempts[attemptIndex];
    try {
        // Wait for the specified delay
        await new Promise((resolve) => setTimeout(resolve, attempt.delay));
        // Verify queue entry still exists (prevent race conditions)
        if (!_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.processingQueue.has(processingKey)) {
            (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .log */ .Rm)(`WTR Term Replacer: Chapter ${chapterId} processing cancelled (no longer in queue)`);
            return;
        }
        // Re-acquire chapter body element dynamically to avoid stale references
        const CHAPTER_BODY_SELECTOR = ".chapter-body";
        const chapterSelector = `#${chapterId} ${CHAPTER_BODY_SELECTOR}`;
        const chapterBody = document.querySelector(chapterSelector);
        if (!chapterBody) {
            throw new Error("Chapter body element not found");
        }
        // Additional DOM stability validation
        if (!document.contains(chapterBody) || chapterBody.nodeType !== Node.ELEMENT_NODE) {
            throw new Error("Chapter body element no longer in DOM");
        }
        // Check if content is sufficiently loaded
        const contentLoadLevel = estimateContentLoadLevel(chapterBody);
        if (contentLoadLevel >= attempt.maxContentLoad) {
            // Proceed with processing
            await performRobustReplacements(chapterBody, chapterId);
            _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.processingQueue.delete(processingKey);
            (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .log */ .Rm)(`WTR Term Replacer: Successfully processed chapter ${chapterId} on attempt ${attemptIndex + 1}`);
        }
        else if (attemptIndex < retryAttempts.length - 1) {
            // Retry with next attempt
            (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .log */ .Rm)(`WTR Term Replacer: Chapter ${chapterId} content not ready (load level: ${contentLoadLevel.toFixed(2)}), retrying...`);
            executeProcessingWithRetry(chapterId, retryAttempts, attemptIndex + 1, processingKey);
        }
        else {
            // Final attempt with any available content
            (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .log */ .Rm)(`WTR Term Replacer: Final attempt for chapter ${chapterId} with available content`);
            await performRobustReplacements(chapterBody, chapterId, true); // force processing
            _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.processingQueue.delete(processingKey);
        }
    }
    catch (error) {
        (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .log */ .Rm)(`WTR Term Replacer: Error processing chapter ${chapterId} on attempt ${attemptIndex + 1}:`, error);
        if (attemptIndex < retryAttempts.length - 1) {
            executeProcessingWithRetry(chapterId, retryAttempts, attemptIndex + 1, processingKey);
        }
        else {
            _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.processingQueue.delete(processingKey);
            console.error(`WTR Term Replacer: Failed to process chapter ${chapterId} after all retries`);
        }
    }
}
function estimateContentLoadLevel(chapterBody) {
    // Estimate how much content is loaded based on text density and structure
    const textNodes = chapterBody.querySelectorAll("p, h1, h2, h3, h4, h5, h6, div, span");
    const totalTextLength = Array.from(textNodes).reduce((total, node) => total + (node.textContent?.trim().length || 0), 0);
    // Check for loading indicators or placeholder content
    const hasLoadingIndicators = chapterBody.querySelector('.loading, .spinner, [style*="loading"], [class*="loading"]');
    const hasPlaceholderContent = chapterBody.textContent?.includes("Loading...") ||
        chapterBody.textContent?.includes("loading") ||
        chapterBody.textContent?.includes("...");
    // Calculate load level based on content density and absence of loading indicators
    let loadLevel = Math.min(totalTextLength / 1000, 1.0); // Normalize to 0-1 based on 1000 chars
    if (hasLoadingIndicators || hasPlaceholderContent) {
        loadLevel *= 0.3; // Reduce load level if loading indicators present
    }
    // Ensure minimum threshold for processing
    return Math.max(loadLevel, totalTextLength > 100 ? 0.5 : 0.1);
}
function detectOtherWTRScripts() {
    (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, "WTR Term Replacer: Scanning for other WTR Lab scripts...");
    // Detect other WTR Lab scripts by their data attributes or specific patterns
    const scripts = document.querySelectorAll("[data-smart-quotes-processed], [data-uncensor-processed], [data-auto-scroll], [data-reader-enhanced]");
    (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, `WTR Term Replacer: Found ${scripts.length} elements with WTR script attributes`);
    scripts.forEach((el) => {
        if (el.hasAttribute("data-smart-quotes-processed")) {
            _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.otherWTRScripts.add("Smart Quotes");
            (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, "WTR Term Replacer: Detected Smart Quotes script");
        }
        if (el.hasAttribute("data-uncensor-processed")) {
            _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.otherWTRScripts.add("Uncensor");
            (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, "WTR Term Replacer: Detected Uncensor script");
        }
        if (el.hasAttribute("data-auto-scroll") || el.hasAttribute("data-reader-enhanced")) {
            _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.otherWTRScripts.add("Reader Enhancer");
            (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, "WTR Term Replacer: Detected Reader Enhancer script");
        }
    });
    if (_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.otherWTRScripts.size > 0) {
        (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, `WTR Term Replacer: Multi-script environment detected - Active scripts: ${Array.from(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.otherWTRScripts).join(", ")}`);
    }
    else {
        (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, "WTR Term Replacer: No other WTR scripts detected, running in single-script mode");
    }
}
function startProcessingTimer(operation) {
    (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, `WTR Term Replacer: Starting processing timer for ${operation}`);
    _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.processingStartTime.set(operation, Date.now());
}
function endProcessingTimer(operation, chapterId) {
    const startTime = _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.processingStartTime.get(operation);
    if (startTime) {
        const processingTime = Date.now() - startTime;
        const isMultiScript = _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.otherWTRScripts.size > 0;
        (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, `WTR Term Replacer: Processing timer ended for ${operation}, took ${processingTime}ms`);
        logProcessingWithMultiScriptContext(chapterId, processingTime, isMultiScript);
        _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.processingStartTime.delete(operation);
        return processingTime;
    }
    (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, `WTR Term Replacer: Warning - processing timer for ${operation} not found`);
    return 0;
}
function logProcessingWithMultiScriptContext(chapterId, processingTime, isMultiScript = false) {
    const context = {
        chapterId,
        processingTime: `${processingTime}ms`,
        multiScriptEnvironment: isMultiScript,
        activeScripts: _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.otherWTRScripts.size,
        queueSize: _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.processingQueue.size,
        timestamp: new Date().toISOString(),
    };
    if (isMultiScript && _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.otherWTRScripts.size > 0) {
        context.activeScripts = Array.from(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.otherWTRScripts);
        (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, `WTR Term Replacer: Multi-script enhanced processing completed`, context);
    }
    else {
        (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, `WTR Term Replacer: Standard processing completed`, context);
    }
}
async function performRobustReplacements(chapterBody, chapterId, forceProcess = false) {
    try {
        // Additional readiness checks before processing
        if (!forceProcess && !isElementReadyForProcessing(chapterBody)) {
            throw new Error("Element not ready for processing");
        }
        startProcessingTimer(`chapter_${chapterId}`);
        // Detect other WTR scripts if not already done
        if (_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.otherWTRScripts.size === 0) {
            detectOtherWTRScripts();
        }
        const isMultiScript = _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.otherWTRScripts.size > 0;
        if (isMultiScript) {
            (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .log */ .Rm)(`WTR Term Replacer: Multi-script processing starting for chapter ${chapterId} with active scripts: ${Array.from(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.otherWTRScripts).join(", ")}`);
        }
        else {
            (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .log */ .Rm)(`WTR Term Replacer: Processing chapter ${chapterId} with robust method`);
        }
        (0,_engine__WEBPACK_IMPORTED_MODULE_1__.performReplacements)(chapterBody);
        chapterBody.dataset.wtrProcessed = "true";
        (0,_ui__WEBPACK_IMPORTED_MODULE_2__/* .addMenuButton */ .L_)();
        const processingTime = endProcessingTimer(`chapter_${chapterId}`, chapterId);
        if (isMultiScript) {
            (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .log */ .Rm)(`WTR Term Replacer: Successfully completed multi-script processing for chapter ${chapterId} in ${processingTime}ms`);
        }
    }
    catch (error) {
        const processingTime = endProcessingTimer(`chapter_${chapterId}`, chapterId) || 0;
        (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .log */ .Rm)(`WTR Term Replacer: Robust processing failed for chapter ${chapterId} after ${processingTime}ms:`, error);
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
function reprocessCurrentChapter() {
    const chapterId = (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .getChapterIdFromUrl */ .Ug)(window.location.href);
    if (!chapterId) {
        return;
    }
    const CHAPTER_BODY_SELECTOR = ".chapter-body";
    const chapterSelector = `#${chapterId} ${CHAPTER_BODY_SELECTOR}`;
    const chapterBody = document.querySelector(chapterSelector);
    if (chapterBody) {
        // Reset processing state to allow reprocessing
        chapterBody.dataset.wtrProcessed = "false";
        // Clear any existing processing entries for this chapter
        const existingKeys = Array.from(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.processingQueue).filter((key) => key.startsWith(chapterId));
        existingKeys.forEach((key) => _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.processingQueue.delete(key));
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


/***/ },

/***/ 654
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   oP: () => (/* binding */ setNovelSlug),
/* harmony export */   wk: () => (/* binding */ state)
/* harmony export */ });
/* unused harmony export initializeState */
// State management for WTR Lab Term Replacer
const state = {
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
    termDiscovery: {
        chapterCandidates: [],
        novelTerms: [],
        replacementSuggestions: [],
        autocompleteCandidates: [],
        selectedCandidate: null,
        status: "Idle",
        lastSearch: "",
    },
};
// Function to initialize novel slug - should be called after utils is loaded
function initializeState() {
    if (!state.novelSlug) {
        // Import getNovelSlug function dynamically to avoid circular dependencies
        Promise.resolve(/* import() */).then(__webpack_require__.bind(__webpack_require__, 158)).then(({ getNovelSlug }) => {
            state.novelSlug = getNovelSlug();
        });
    }
    return state.novelSlug;
}
// Set novel slug (for synchronous initialization)
function setNovelSlug(slug) {
    state.novelSlug = slug;
}


/***/ },

/***/ 694
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getTermKey: () => (/* binding */ getTermKey),
/* harmony export */   getTermsForSlug: () => (/* binding */ getTermsForSlug),
/* harmony export */   loadData: () => (/* binding */ loadData),
/* harmony export */   loadGlobalSettings: () => (/* binding */ loadGlobalSettings),
/* harmony export */   loadTermListLocation: () => (/* binding */ loadTermListLocation),
/* harmony export */   processAndSaveSettings: () => (/* binding */ processAndSaveSettings),
/* harmony export */   processAndSaveTerms: () => (/* binding */ processAndSaveTerms),
/* harmony export */   saveGlobalSettings: () => (/* binding */ saveGlobalSettings),
/* harmony export */   saveSearchFieldValue: () => (/* binding */ saveSearchFieldValue),
/* harmony export */   saveSettings: () => (/* binding */ saveSettings),
/* harmony export */   saveTermListLocation: () => (/* binding */ saveTermListLocation),
/* harmony export */   saveTerms: () => (/* binding */ saveTerms)
/* harmony export */ });
/* harmony import */ var _state__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(654);
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(333);
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(158);
// Storage functions using GM_* API for WTR Lab Term Replacer



async function loadGlobalSettings() {
    try {
        _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings = await GM_getValue(_config__WEBPACK_IMPORTED_MODULE_1__/* .GLOBAL_SETTINGS_KEY */ .sI, { isLoggingEnabled: false });
        (0,_utils__WEBPACK_IMPORTED_MODULE_2__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, "WTR Term Replacer: Global settings loaded");
    }
    catch (e) {
        console.error("Error loading global settings:", e);
        _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings = { isLoggingEnabled: false };
    }
}
async function saveGlobalSettings() {
    try {
        await GM_setValue(_config__WEBPACK_IMPORTED_MODULE_1__/* .GLOBAL_SETTINGS_KEY */ .sI, _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings);
        (0,_utils__WEBPACK_IMPORTED_MODULE_2__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, "WTR Term Replacer: Global settings saved");
    }
    catch (e) {
        console.error("Error saving global settings:", e);
    }
}
async function loadTermListLocation() {
    try {
        const saved = await GM_getValue(`${_config__WEBPACK_IMPORTED_MODULE_1__/* .CURRENT_LOCATION_KEY */ .Qp}_${_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.novelSlug}`, null);
        if (saved) {
            _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.savedTermListLocation = saved;
        }
    }
    catch (e) {
        console.error("Error loading term list location:", e);
        _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.savedTermListLocation = { page: 1, scrollTop: 0, searchValue: "" };
    }
}
async function saveTermListLocation() {
    try {
        const termListContainer = document.querySelector(".wtr-replacer-content");
        if (termListContainer) {
            // Capture more detailed location information for better preservation
            const locationData = {
                page: _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.currentPage,
                scrollTop: termListContainer.scrollTop,
                scrollHeight: termListContainer.scrollHeight,
                clientHeight: termListContainer.clientHeight,
                searchValue: _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.currentSearchValue,
                timestamp: Date.now(), // Add timestamp for better tracking
            };
            await GM_setValue(`${_config__WEBPACK_IMPORTED_MODULE_1__/* .CURRENT_LOCATION_KEY */ .Qp}_${_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.novelSlug}`, locationData);
            _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.savedTermListLocation = locationData;
            (0,_utils__WEBPACK_IMPORTED_MODULE_2__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, `WTR Term Replacer: Saved scroll position - top: ${locationData.scrollTop}, page: ${locationData.page}`);
        }
    }
    catch (e) {
        console.error("Error saving term list location:", e);
    }
}
// Helper function to save search field value immediately
async function saveSearchFieldValue() {
    try {
        const locationData = {
            page: _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.currentPage,
            scrollTop: 0,
            searchValue: _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.currentSearchValue,
        };
        await GM_setValue(`${_config__WEBPACK_IMPORTED_MODULE_1__/* .CURRENT_LOCATION_KEY */ .Qp}_${_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.novelSlug}`, locationData);
        _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.savedTermListLocation = locationData;
    }
    catch (e) {
        console.error("Error saving search field value:", e);
    }
}
async function getTermsForSlug(slug) {
    if (!slug) {
        return [];
    }
    const terms = await GM_getValue(`${_config__WEBPACK_IMPORTED_MODULE_1__/* .TERMS_STORAGE_KEY_PREFIX */ .fW}${slug}`, []);
    if (!Array.isArray(terms)) {
        return [];
    }
    return terms.map((term) => ({
        ...term,
        wholeWord: term.wholeWord ?? false,
    }));
}
async function loadData() {
    try {
        const SETTINGS_KEY = `${_config__WEBPACK_IMPORTED_MODULE_1__/* .SETTINGS_STORAGE_KEY_PREFIX */ .Ft}${_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.novelSlug}`;
        _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.terms = await getTermsForSlug(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.novelSlug);
        const savedSettings = await GM_getValue(SETTINGS_KEY, {});
        _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.settings = { isDisabled: false, ...savedSettings };
    }
    catch (e) {
        console.error("Error loading data:", e);
        _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.terms = [];
        _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.settings = { isDisabled: false };
    }
}
async function saveTerms(termsToSave) {
    try {
        const TERMS_KEY = `${_config__WEBPACK_IMPORTED_MODULE_1__/* .TERMS_STORAGE_KEY_PREFIX */ .fW}${_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.novelSlug}`;
        await GM_setValue(TERMS_KEY, termsToSave);
        _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.terms = termsToSave;
        (0,_utils__WEBPACK_IMPORTED_MODULE_2__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, `WTR Term Replacer: Saved ${termsToSave.length} terms for novel ${_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.novelSlug}`);
    }
    catch (e) {
        console.error("Error saving terms:", e);
        (0,_utils__WEBPACK_IMPORTED_MODULE_2__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, `WTR Term Replacer: Failed to save terms: ${e.message}`);
        alert("Failed to save terms. Storage might be full.");
    }
}
async function saveSettings(settingsToSave) {
    try {
        const SETTINGS_KEY = `${_config__WEBPACK_IMPORTED_MODULE_1__/* .SETTINGS_STORAGE_KEY_PREFIX */ .Ft}${_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.novelSlug}`;
        await GM_setValue(SETTINGS_KEY, settingsToSave);
        _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.settings = settingsToSave;
        (0,_utils__WEBPACK_IMPORTED_MODULE_2__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, "WTR Term Replacer: Settings saved successfully");
    }
    catch (e) {
        console.error("Error saving settings:", e);
        (0,_utils__WEBPACK_IMPORTED_MODULE_2__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, `WTR Term Replacer: Failed to save settings: ${e.message}`);
        alert("Failed to save settings. Storage might be full.");
    }
}
function getTermKey(term) {
    return `${term.original}|${term.caseSensitive}|${term.isRegex}`;
}
async function processAndSaveTerms(slug, importedTerms, overwrite = true) {
    (0,_utils__WEBPACK_IMPORTED_MODULE_2__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, `WTR Term Replacer: Processing import for slug ${slug}, overwrite: ${overwrite}`);
    const TERMS_KEY = `${_config__WEBPACK_IMPORTED_MODULE_1__/* .TERMS_STORAGE_KEY_PREFIX */ .fW}${slug}`;
    const existingTerms = await GM_getValue(TERMS_KEY, []);
    existingTerms.forEach((t) => {
        t.wholeWord = t.wholeWord ?? false;
    });
    let newTerms = [];
    let added = 0;
    let skipped = 0;
    let conflicts = 0;
    if (overwrite) {
        (0,_utils__WEBPACK_IMPORTED_MODULE_2__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, `WTR Term Replacer: Overwrite mode - importing ${importedTerms.length} terms`);
        newTerms = importedTerms;
    }
    else {
        const existingMap = new Map();
        existingTerms.forEach((t) => existingMap.set(getTermKey(t), t));
        importedTerms.forEach((imp) => {
            const key = getTermKey(imp);
            if (!existingMap.has(key)) {
                newTerms.push(imp);
                added++;
            }
            else {
                const ext = existingMap.get(key);
                if (ext.replacement !== imp.replacement || ext.wholeWord !== imp.wholeWord) {
                    conflicts++;
                }
                else {
                    skipped++;
                }
            }
        });
        newTerms = [...existingTerms, ...newTerms];
        (0,_utils__WEBPACK_IMPORTED_MODULE_2__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, `WTR Term Replacer: Merge mode - added: ${added}, skipped: ${skipped}, conflicts: ${conflicts}`);
    }
    await GM_setValue(TERMS_KEY, newTerms);
    if (slug === _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.novelSlug) {
        _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.terms = newTerms;
    }
    (0,_utils__WEBPACK_IMPORTED_MODULE_2__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, `WTR Term Replacer: Import complete for ${slug} - total terms: ${newTerms.length}`);
    return { added, skipped, conflicts };
}
async function processAndSaveSettings(importedSettings) {
    (0,_utils__WEBPACK_IMPORTED_MODULE_2__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, `WTR Term Replacer: Processing settings import for ${Object.keys(importedSettings).length} slugs`);
    for (const slug in importedSettings) {
        const SETTINGS_KEY = `${_config__WEBPACK_IMPORTED_MODULE_1__/* .SETTINGS_STORAGE_KEY_PREFIX */ .Ft}${slug}`;
        const existing = await GM_getValue(SETTINGS_KEY, { isDisabled: false });
        const newSettings = { ...existing, ...importedSettings[slug] };
        await GM_setValue(SETTINGS_KEY, newSettings);
        if (slug === _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.novelSlug) {
            _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.settings = newSettings;
        }
        (0,_utils__WEBPACK_IMPORTED_MODULE_2__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, `WTR Term Replacer: Settings updated for slug ${slug}`);
    }
}


/***/ },

/***/ 141
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   BD: () => (/* binding */ showFormView),
/* harmony export */   E1: () => (/* binding */ showUIPanel),
/* harmony export */   FP: () => (/* binding */ renderTermList),
/* harmony export */   L_: () => (/* binding */ addMenuButton),
/* harmony export */   OG: () => (/* binding */ switchTab),
/* harmony export */   RD: () => (/* binding */ createUI),
/* harmony export */   W4: () => (/* binding */ hideUILoader),
/* harmony export */   X: () => (/* binding */ hideUIPanel),
/* harmony export */   Xt: () => (/* binding */ showUILoader),
/* harmony export */   gn: () => (/* binding */ showProcessingIndicator),
/* harmony export */   kH: () => (/* binding */ clearTermList)
/* harmony export */ });
/* harmony import */ var _state__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(654);
/* harmony import */ var _handlers__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(359);
/* harmony import */ var _duplicates__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(201);
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(158);
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(333);
/* harmony import */ var _config_versions__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(387);
/* harmony import */ var _config_versions__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_config_versions__WEBPACK_IMPORTED_MODULE_5__);






const UI_HTML = `
    <div class="wtr-replacer-header">
        <h2>Term Replacer ${(0,_config_versions__WEBPACK_IMPORTED_MODULE_5__.getDisplayVersion)()}</h2>
        <div class="wtr-replacer-header-controls">
            <div class="wtr-replacer-disable-toggle">
                <label><input type="checkbox" id="wtr-disable-all"> Disable All</label>
            </div>
            <button class="wtr-replacer-close-btn">&times;</button>
        </div>
    </div>
    <div class="wtr-replacer-tabs">
        <button class="wtr-replacer-tab-btn active" data-tab="terms">Terms List</button>
        <button class="wtr-replacer-tab-btn" data-tab="add">Add/Edit Term</button>
        <button class="wtr-replacer-tab-btn" data-tab="discover">Discover Terms</button>
        <button class="wtr-replacer-tab-btn" data-tab="io">Import/Export</button>
    </div>
    <div class="wtr-replacer-content">
        <div class="wtr-ui-loader" id="wtr-ui-loader">Loading...</div>
        <div id="wtr-tab-terms" class="wtr-replacer-tab-content active">
            <div id="wtr-dup-message" class="wtr-dup-message" style="display:none;"></div>
            <div id="wtr-dup-controls" class="wtr-dup-controls" style="display:none;">
                <button id="wtr-prev-dup-btn" class="btn btn-secondary">Previous</button>
                <button id="wtr-next-dup-btn" class="btn btn-secondary">Next</button>
                <button id="wtr-exit-dup-btn" class="btn btn-secondary">Exit Duplicate Mode</button>
            </div>
            <div class="wtr-replacer-list-controls">
                <input type="text" id="wtr-search-bar" class="wtr-replacer-search-bar" placeholder="Search terms...">
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <button id="wtr-find-duplicates-btn" class="btn btn-secondary">Find Duplicates</button>
                    <button id="wtr-delete-selected-btn" class="btn btn-secondary">Delete Selected</button>
                </div>
            </div>
            <ul class="wtr-replacer-term-list"></ul>
            <div class="wtr-pagination-controls">
                <button id="wtr-first-page-btn" class="btn btn-secondary" title="First Page">&laquo;&laquo;</button>
                <button id="wtr-prev-page-btn" class="btn btn-secondary" title="Previous Page">&laquo;</button>
                <span id="wtr-page-indicator"></span>
                <button id="wtr-next-page-btn" class="btn btn-secondary" title="Next Page">&raquo;</button>
                <button id="wtr-last-page-btn" class="btn btn-secondary" title="Last Page">&raquo;&raquo;</button>
            </div>
        </div>
        <div id="wtr-tab-add" class="wtr-replacer-tab-content">
            <input type="hidden" id="wtr-term-id">
            <div class="wtr-replacer-form-group">
                <label for="wtr-original">Original Text</label>
                <textarea id="wtr-original" rows="1"></textarea>
                <div id="wtr-add-term-autocomplete-results" class="wtr-add-term-autocomplete-results" aria-live="polite"></div>
            </div>
            <div class="wtr-replacer-form-group">
                <label for="wtr-replacement">Replacement Text</label>
                <input type="text" id="wtr-replacement">
                <div id="wtr-replacement-suggestions" class="wtr-replacement-suggestions" aria-live="polite"></div>
            </div>
            <div class="wtr-replacer-form-group">
                <label><input type="checkbox" id="wtr-case-sensitive"> Case Sensitive</label>
                <label><input type="checkbox" id="wtr-is-regex"> Use Regex</label>
                <label><input type="checkbox" id="wtr-whole-word" disabled> Whole Word Only</label>
            </div>
            <button id="wtr-save-btn" class="btn btn-primary">Save Term</button>
        </div>
        <div id="wtr-tab-discover" class="wtr-replacer-tab-content">
            <div class="wtr-discovery-header">
                <h3>Term Discovery Assistant</h3>
                <p>Load WTR reader data, choose a candidate, then confirm it with Save Term. Nothing is saved automatically.</p>
                <div class="wtr-discovery-actions">
                    <button id="wtr-refresh-chapter-terms-btn" class="btn btn-secondary">Refresh Current Chapter</button>
                    <button id="wtr-refresh-novel-terms-btn" class="btn btn-secondary">Refresh Novel Terms</button>
                </div>
                <small id="wtr-discovery-status">Idle</small>
            </div>
            <div class="wtr-discovery-grid">
                <section class="wtr-discovery-section">
                    <h4>Current Chapter Candidates</h4>
                    <ul id="wtr-current-chapter-candidates" class="wtr-discovery-result-list"></ul>
                </section>
                <section class="wtr-discovery-section">
                    <h4>Novel-wide Search</h4>
                    <input type="text" id="wtr-discovery-search" class="wtr-replacer-search-bar" placeholder="Search WTR novel terms...">
                    <ul id="wtr-novel-term-results" class="wtr-discovery-result-list"></ul>
                </section>
            </div>
        </div>
        <div id="wtr-tab-io" class="wtr-replacer-tab-content">
            <input type="file" id="wtr-file-input" accept=".json" style="display: none;">
            <div class="wtr-replacer-io-section">
                <h3>Export</h3>
                <div class="wtr-replacer-io-actions" style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;">
                    <button id="wtr-export-novel-btn" class="btn btn-success">Export Novel Terms</button>
                    <button id="wtr-export-all-btn" class="btn btn-success">Export All Terms</button>
                    <button id="wtr-export-combined-btn" class="btn btn-info wtr-export-combined">Export Both (Novel + All)</button>
                </div>
            </div>
            <div class="wtr-replacer-io-section">
                <h3>Import</h3>
                <div class="wtr-replacer-io-actions" style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;">
                    <button id="wtr-import-novel-btn" class="btn btn-warning">Import to This Novel</button>
                    <button id="wtr-import-all-btn" class="btn btn-warning">Import All (Global)</button>
                </div>
            </div>
        </div>
    </div>
`;
const UI_CSS = `
    /* --- Google Material Symbols --- */
    @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,1,0');
    
    .material-symbols-outlined {
        font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        font-size: 16px;
        vertical-align: middle;
    }

    /* --- Main UI Container --- */
    .wtr-replacer-ui {
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        width: 90%; max-width: 650px; max-height: 80vh;
        background-color: var(--bs-body-bg); color: var(--bs-body-color);
        border: 1px solid var(--bs-border-color); border-radius: var(--bs-border-radius-lg);
        box-shadow: var(--bs-box-shadow-lg); z-index: 99999;
        display: none; flex-direction: column; font-family: var(--bs-body-font-family);
    }
    .wtr-replacer-ui * { box-sizing: border-box; }

    /* --- Header --- */
    .wtr-replacer-header {
        padding: 0.75rem 1rem; background-color: var(--bs-tertiary-bg);
        border-bottom: 1px solid var(--bs-border-color);
        display: flex; justify-content: space-between; align-items: center;
        border-radius: var(--bs-border-radius-lg) var(--bs-border-radius-lg) 0 0;
    }
    .wtr-replacer-header h2 { margin: 0; font-size: 1.25rem; }
    .wtr-replacer-header-controls { display: flex; align-items: center; gap: 1rem; }
    .wtr-replacer-disable-toggle label { display: flex; align-items: center; cursor: pointer; font-size: 0.9rem; }
    .wtr-replacer-disable-toggle input { margin-right: 0.5rem; }
    .wtr-replacer-close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; line-height: 1; color: inherit; padding: 0; }

    /* --- Tabs --- */
    .wtr-replacer-tabs { display: flex; padding: 0 0.5rem; border-bottom: 1px solid var(--bs-border-color); background-color: var(--bs-tertiary-bg); }
    .wtr-replacer-tab-btn {
        background: none; border: none; padding: 0.75rem 1rem; cursor: pointer;
        font-size: 0.9rem; color: var(--bs-secondary-color);
        border-bottom: 3px solid transparent; margin-bottom: -1px;
    }
    .wtr-replacer-tab-btn.active { color: var(--bs-primary); border-bottom-color: var(--bs-primary); font-weight: bold; }

    /* --- Content & Forms --- */
    .wtr-replacer-content { padding: 1rem; overflow-y: auto; flex-grow: 1; position: relative; }
    .wtr-replacer-tab-content { display: none; }
    .wtr-replacer-tab-content.active { display: block; }
    .wtr-replacer-form-group { margin-bottom: 1rem; }
    .wtr-replacer-form-group label { display: block; margin-bottom: 0.5rem; font-weight: bold; font-size: 0.9rem; }
    .wtr-replacer-form-group input[type="text"], .wtr-replacer-search-bar {
        width: 100%; padding: 0.5rem 0.75rem;
        background-color: var(--bs-body-bg); color: var(--bs-body-color);
        border: 1px solid var(--bs-border-color); border-radius: var(--bs-border-radius);
    }
    .wtr-replacer-form-group textarea {
        width: 100%; padding: 0.5rem 0.75rem;
        background-color: var(--bs-body-bg); color: var(--bs-body-color);
        border: 1px solid var(--bs-border-color); border-radius: var(--bs-border-radius);
        resize: none;
        min-height: 2.5rem; max-height: 10rem;
        line-height: 1.5; font-family: inherit;
        word-wrap: break-word; white-space: pre-wrap;
    }
    .wtr-replacer-form-group input[type="checkbox"] { margin-right: 0.5rem; }

    /* --- Visual Validation States --- */
    .wtr-replacer-form-group .wtr-field-invalid {
        border-color: var(--bs-danger) !important;
        background-color: rgba(var(--bs-danger-rgb), 0.1) !important;
        box-shadow: 0 0 0 0.2rem rgba(var(--bs-danger-rgb), 0.25);
    }
    
    .wtr-replacer-form-group .wtr-field-valid {
        border-color: var(--bs-success) !important;
        background-color: rgba(var(--bs-success-rgb), 0.1) !important;
    }
    
    .wtr-save-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        background-color: var(--bs-secondary);
        border-color: var(--bs-secondary);
    }

    /* --- Buttons (Scoped to UI) --- */
    .wtr-replacer-ui .btn {
        display: inline-block; font-weight: 400; line-height: 1.5; color: var(--bs-body-color);
        text-align: center; vertical-align: middle; cursor: pointer; user-select: none;
        background-color: transparent; border: 1px solid transparent;
        padding: 0.375rem 0.75rem; font-size: 1rem; border-radius: var(--bs-border-radius);
        transition: color .15s ease-in-out,background-color .15s ease-in-out,border-color .15s ease-in-out,box-shadow .15s ease-in-out;
    }
    .wtr-replacer-ui .btn:disabled { opacity: 0.65; cursor: not-allowed; }
    .wtr-replacer-ui .btn-primary { color: #fff; background-color: var(--bs-primary); border-color: var(--bs-primary); }
    .wtr-replacer-ui .btn-secondary { color: #fff; background-color: var(--bs-secondary); border-color: var(--bs-secondary); }
    .wtr-replacer-ui .btn-success { color: #fff; background-color: var(--bs-success); border-color: var(--bs-success); }
    .wtr-replacer-ui .btn-warning { color: #000; background-color: var(--bs-warning); border-color: var(--bs-warning); }
    .wtr-replacer-ui .btn-info { color: #fff; background-color: var(--bs-info); border-color: var(--bs-info); }
    .wtr-replacer-ui .btn-sm { padding: 0.25rem 0.5rem; font-size: 0.875rem; }

    /* --- Term Discovery Assistant --- */
    .wtr-discovery-header { margin-bottom: 1rem; }
    .wtr-discovery-header h3 { margin-top: 0; margin-bottom: 0.5rem; }
    .wtr-discovery-header p { margin: 0 0 0.75rem; font-size: 0.9rem; color: var(--bs-secondary-color); }
    .wtr-discovery-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.5rem; }
    .wtr-discovery-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .wtr-discovery-section h4 { margin: 0 0 0.5rem; }
    .wtr-discovery-result-list { list-style: none; padding: 0; margin: 0.75rem 0 0; display: flex; flex-direction: column; gap: 0.5rem; }
    .wtr-discovery-result-item {
        display: flex; justify-content: space-between; align-items: center; gap: 0.75rem;
        border: 1px solid var(--bs-border-color); border-radius: var(--bs-border-radius);
        background-color: var(--bs-secondary-bg-subtle); padding: 0.625rem;
    }
    .wtr-discovery-result-details { display: flex; flex-direction: column; gap: 0.25rem; min-width: 0; word-break: break-word; }
    .wtr-discovery-replacement-preview { color: var(--bs-success); }
    .wtr-discovery-empty { color: var(--bs-secondary-color); font-size: 0.9rem; }
    .wtr-add-term-autocomplete-results { display: flex; flex-direction: column; gap: 0.25rem; margin-top: 0.35rem; }
    .wtr-autocomplete-option {
        text-align: left; border: 1px solid var(--bs-border-color); border-radius: var(--bs-border-radius);
        background: var(--bs-secondary-bg-subtle); color: var(--bs-body-color); padding: 0.35rem 0.5rem; cursor: pointer;
    }
    .wtr-autocomplete-option:hover { border-color: var(--bs-primary); }
    .wtr-replacement-suggestions { margin-top: 0.35rem; }
    .wtr-replacement-suggestion-buttons { display: flex; gap: 0.35rem; flex-wrap: wrap; margin-top: 0.35rem; }

    /* --- Term List --- */
    .wtr-replacer-list-controls {
        display: flex; justify-content: space-between; align-items: center;
        gap: 0.75rem; position: sticky; top: -1rem;
        background-color: var(--bs-body-bg); padding: 0.75rem 0; z-index: 10;
        flex-wrap: wrap;
    }
    .wtr-replacer-term-list { list-style: none; padding: 0; margin: 0; }
    .wtr-replacer-term-item {
        padding: 0.75rem; border: 1px solid var(--bs-border-color);
        border-radius: var(--bs-border-radius); margin-bottom: 0.5rem;
        display: flex; align-items: center; gap: 0.75rem;
        background-color: var(--bs-secondary-bg-subtle);
    }
    .wtr-replacer-term-details { flex-grow: 1; overflow: hidden; }
    .wtr-replacer-term-text { font-family: var(--bs-font-monospace); font-size: 0.9rem; word-wrap: break-word; }
    .wtr-term-original { color: var(--bs-danger) !important; font-weight: bold; }
    .wtr-term-replacement { color: var(--bs-success) !important; font-weight: bold; }

    /* --- Floating Button --- */
    .wtr-add-term-float-btn {
        position: fixed; bottom: 20px; right: 20px;
        background-color: var(--bs-primary); color: white;
        padding: 0.75rem 1.25rem; border-radius: 50rem; border: none;
        box-shadow: var(--bs-box-shadow); cursor: pointer; font-size: 1rem; z-index: 99998; display: none;
    }

    /* --- Overlays & Loaders --- */
    .wtr-processing-overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); color: white;
        display: flex; justify-content: center; align-items: center;
        font-size: 1.5rem; z-index: 100000; display: none;
    }
    .wtr-ui-loader {
        display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(var(--bs-body-bg-rgb), 0.7); color: var(--bs-body-color);
        justify-content: center; align-items: center; z-index: 20;
    }

    /* --- Duplicate Mode & Pagination --- */
    .wtr-dup-message { margin-bottom: 0.75rem; font-weight: bold; }
    .wtr-dup-controls { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; flex-wrap: wrap; }
    .wtr-pagination-controls {
        display: flex; justify-content: center; align-items: center; margin-top: 1rem; gap: 0.25rem;
        flex-wrap: wrap; padding: 0.5rem 0;
    }
    .wtr-pagination-controls .btn {
        padding: 0.25rem 0.5rem; font-size: 0.875rem; min-width: 2.5rem;
    }
    #wtr-page-indicator {
        white-space: nowrap; margin: 0 0.5rem; font-size: 0.875rem;
        padding: 0.25rem 0.5rem; background-color: var(--bs-secondary-bg-subtle);
        border-radius: var(--bs-border-radius);
    }

    /* --- Enhanced Export Button Styling --- */
    .wtr-export-combined {
        background: linear-gradient(45deg, var(--bs-success), #28a745);
        border: none;
        color: white;
        font-weight: bold;
        position: relative;
        overflow: hidden;
    }

    .wtr-export-combined:hover {
        background: linear-gradient(45deg, #28a745, var(--bs-success));
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }

    .wtr-export-combined:active {
        transform: translateY(0);
    }

    /* --- Global Menu Button Alignment Fix --- */
    /* Fix menu button alignment - remove margin-right from Term Settings for all devices */
    .bottom-reader-nav .menu-button.small > span {
        margin-right: 0 !important;
    }

    /* --- Responsive Design (Mobile First) --- */
    #wtr-tab-terms.active {
        display: flex;
        flex-direction: column;
    }
    .wtr-replacer-list-controls { order: 1; }
    .wtr-pagination-controls { order: 2; margin-top: 0.5rem; margin-bottom: 0.5rem; }
    .wtr-replacer-term-list { order: 3; }

    /* --- Mobile Specific Improvements --- */
    @media (max-width: 768px) {

        .wtr-replacer-ui {
            width: 95%; max-height: 85vh;
            top: 2.5%; left: 2.5%; transform: none;
        }

        .wtr-replacer-content {
            padding: 0.5rem;
        }

        .wtr-replacer-list-controls {
            flex-direction: column; align-items: stretch; gap: 0.5rem;
        }

        .wtr-replacer-list-controls input[type="text"] {
            order: 1;
        }

        .wtr-replacer-list-controls .btn {
            order: 2; margin: 0;
        }

        .wtr-dup-controls {
            justify-content: center;
        }

        .wtr-discovery-grid {
            grid-template-columns: 1fr;
        }

        .wtr-pagination-controls {
            justify-content: center;
            gap: 0.125rem;
        }

        .wtr-pagination-controls .btn {
            padding: 0.375rem 0.5rem;
            font-size: 0.8rem;
            min-width: 2rem;
        }

        #wtr-page-indicator {
            font-size: 0.8rem;
            margin: 0 0.25rem;
            padding: 0.25rem;
        }

        .wtr-replacer-term-item {
            padding: 0.5rem;
            gap: 0.5rem;
        }

        .wtr-replacer-term-text {
            font-size: 0.8rem;
        }
    }

    @media (min-width: 769px) {
        .wtr-replacer-list-controls { order: 1; }
        .wtr-replacer-term-list { order: 2; }
        .wtr-pagination-controls { order: 3; margin-top: 1rem; margin-bottom: 0; }
    }
`;
function createUI() {
    if (document.querySelector(".wtr-replacer-ui")) {
        return;
    }
    GM_addStyle(UI_CSS);
    const uiContainer = document.createElement("div");
    uiContainer.className = "wtr-replacer-ui";
    uiContainer.innerHTML = UI_HTML;
    document.body.appendChild(uiContainer);
    const processingOverlay = document.createElement("div");
    processingOverlay.className = "wtr-processing-overlay";
    processingOverlay.textContent = "Processing...";
    document.body.appendChild(processingOverlay);
    // Event Listeners
    uiContainer.querySelector(".wtr-replacer-close-btn").addEventListener("click", _handlers__WEBPACK_IMPORTED_MODULE_1__/* .hideUIPanel */ .X);
    uiContainer.querySelector("#wtr-disable-all").addEventListener("change", _handlers__WEBPACK_IMPORTED_MODULE_1__/* .handleDisableToggle */ .ts);
    uiContainer.querySelector("#wtr-save-btn").addEventListener("click", _handlers__WEBPACK_IMPORTED_MODULE_1__/* .handleSaveTerm */ .s7);
    uiContainer.querySelector("#wtr-refresh-chapter-terms-btn").addEventListener("click", _handlers__WEBPACK_IMPORTED_MODULE_1__/* .handleDiscoveryRefreshChapter */ .DG);
    uiContainer.querySelector("#wtr-refresh-novel-terms-btn").addEventListener("click", _handlers__WEBPACK_IMPORTED_MODULE_1__/* .handleDiscoveryRefreshNovel */ .gF);
    uiContainer.querySelector("#wtr-discovery-search").addEventListener("input", _handlers__WEBPACK_IMPORTED_MODULE_1__/* .handleDiscoverySearch */ .Pq);
    uiContainer.querySelector("#wtr-current-chapter-candidates").addEventListener("click", _handlers__WEBPACK_IMPORTED_MODULE_1__/* .handleDiscoveryCandidateClick */ .Si);
    uiContainer.querySelector("#wtr-novel-term-results").addEventListener("click", _handlers__WEBPACK_IMPORTED_MODULE_1__/* .handleDiscoveryCandidateClick */ .Si);
    uiContainer.querySelector("#wtr-add-term-autocomplete-results").addEventListener("click", _handlers__WEBPACK_IMPORTED_MODULE_1__/* .handleAddTermAutocompleteClick */ .Af);
    uiContainer.querySelector("#wtr-replacement-suggestions").addEventListener("click", _handlers__WEBPACK_IMPORTED_MODULE_1__/* .handleReplacementSuggestionClick */ .JB);
    uiContainer.querySelector("#wtr-delete-selected-btn").addEventListener("click", _handlers__WEBPACK_IMPORTED_MODULE_1__/* .handleDeleteSelected */ .Jm);
    uiContainer.querySelector("#wtr-search-bar").addEventListener("input", _handlers__WEBPACK_IMPORTED_MODULE_1__/* .handleSearch */ .RX);
    uiContainer.querySelector(".wtr-replacer-term-list").addEventListener("click", _handlers__WEBPACK_IMPORTED_MODULE_1__/* .handleListInteraction */ .VM);
    uiContainer
        .querySelectorAll(".wtr-replacer-tab-btn")
        .forEach((btn) => btn.addEventListener("click", _handlers__WEBPACK_IMPORTED_MODULE_1__/* .handleTabSwitch */ .Qk));
    uiContainer.querySelector("#wtr-export-novel-btn").addEventListener("click", _handlers__WEBPACK_IMPORTED_MODULE_1__/* .handleExportNovel */ .b7);
    uiContainer.querySelector("#wtr-export-all-btn").addEventListener("click", _handlers__WEBPACK_IMPORTED_MODULE_1__/* .handleExportAll */ .ym);
    uiContainer.querySelector("#wtr-export-combined-btn").addEventListener("click", _handlers__WEBPACK_IMPORTED_MODULE_1__/* .handleExportCombined */ .ow);
    uiContainer.querySelector("#wtr-import-novel-btn").addEventListener("click", () => {
        _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.importType = "novel";
        document.getElementById("wtr-file-input").click();
    });
    uiContainer.querySelector("#wtr-import-all-btn").addEventListener("click", () => {
        _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.importType = "all";
        document.getElementById("wtr-file-input").click();
    });
    uiContainer.querySelector("#wtr-file-input").addEventListener("change", _handlers__WEBPACK_IMPORTED_MODULE_1__/* .handleFileImport */ .kF);
    uiContainer.querySelector("#wtr-find-duplicates-btn").addEventListener("click", _handlers__WEBPACK_IMPORTED_MODULE_1__/* .handleFindDuplicates */ .y$);
    uiContainer.querySelector("#wtr-prev-dup-btn").addEventListener("click", () => (0,_duplicates__WEBPACK_IMPORTED_MODULE_2__/* .changeDupGroup */ .DP)(-1));
    uiContainer.querySelector("#wtr-next-dup-btn").addEventListener("click", () => (0,_duplicates__WEBPACK_IMPORTED_MODULE_2__/* .changeDupGroup */ .DP)(1));
    uiContainer.querySelector("#wtr-exit-dup-btn").addEventListener("click", _duplicates__WEBPACK_IMPORTED_MODULE_2__/* .exitDupMode */ .bj);
    // Add scroll event listener to save term list location
    const contentArea = uiContainer.querySelector(".wtr-replacer-content");
    if (contentArea) {
        let scrollTimeout;
        contentArea.addEventListener("scroll", () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                if (document.querySelector(".wtr-replacer-tab-btn.active").dataset.tab === "terms") {
                    _handlers__WEBPACK_IMPORTED_MODULE_1__/* .saveTermListLocation */ .R6();
                }
            }, 1000); // Save after 1 second of inactivity
        });
    }
    // Character-based auto-resize for original text field
    const regexCheckbox = uiContainer.querySelector("#wtr-is-regex");
    const wholeWordCheckbox = uiContainer.querySelector("#wtr-whole-word");
    regexCheckbox.addEventListener("change", (e) => {
        wholeWordCheckbox.disabled = e.target.checked;
        if (e.target.checked) {
            wholeWordCheckbox.checked = false;
        }
    });
    const originalTextarea = uiContainer.querySelector("#wtr-original");
    function autoResizeTextarea() {
        if (!originalTextarea) {
            return;
        }
        const text = originalTextarea.value;
        const charCount = text.length;
        const lines = Math.ceil(charCount / 40);
        const maxLines = Infinity;
        const finalLines = Math.min(lines, maxLines);
        originalTextarea.rows = Math.max(1, finalLines);
    }
    originalTextarea.addEventListener("input", autoResizeTextarea);
    originalTextarea.addEventListener("input", _handlers__WEBPACK_IMPORTED_MODULE_1__/* .handleAddTermAutocompleteInput */ .eC);
    originalTextarea.addEventListener("focus", autoResizeTextarea);
    // Real-time regex validation system
    const saveButton = uiContainer.querySelector("#wtr-save-btn");
    const replacementInput = uiContainer.querySelector("#wtr-replacement");
    function updateValidationVisual(state) {
        // Remove all validation classes
        originalTextarea.classList.remove("wtr-field-invalid", "wtr-field-valid");
        if (state === "invalid") {
            originalTextarea.classList.add("wtr-field-invalid");
        }
        else if (state === "valid") {
            originalTextarea.classList.add("wtr-field-valid");
        }
    }
    function validateAndUpdateUI() {
        const isRegexEnabled = regexCheckbox.checked;
        const originalText = originalTextarea.value.trim();
        const replacementText = replacementInput.value.trim();
        const isValidInput = originalText.length > 0 && replacementText.length > 0;
        if (!isRegexEnabled || originalText.length === 0) {
            // Not a regex or empty field, clear validation state
            updateValidationVisual(null);
            saveButton.disabled = !isValidInput;
            return;
        }
        // Validate regex pattern
        const validation = _handlers__WEBPACK_IMPORTED_MODULE_1__/* .validateRegexSilent */ .fA(originalText);
        if (validation.isValid) {
            updateValidationVisual("valid");
            saveButton.disabled = !isValidInput;
        }
        else {
            updateValidationVisual("invalid");
            saveButton.disabled = true;
        }
    }
    // Add real-time validation listeners
    originalTextarea.addEventListener("input", validateAndUpdateUI);
    replacementInput.addEventListener("input", validateAndUpdateUI);
    regexCheckbox.addEventListener("change", validateAndUpdateUI);
    // Initial validation state
    validateAndUpdateUI();
    // Create floating action button
    const addTermFloatBtn = document.createElement("button");
    addTermFloatBtn.className = "wtr-add-term-float-btn";
    addTermFloatBtn.textContent = "Add Term";
    document.body.appendChild(addTermFloatBtn);
    addTermFloatBtn.addEventListener("click", _handlers__WEBPACK_IMPORTED_MODULE_1__/* .handleAddTermFromSelection */ .az);
    document.addEventListener("mouseup", _handlers__WEBPACK_IMPORTED_MODULE_1__/* .handleTextSelection */ .Me);
    document.addEventListener("touchend", _handlers__WEBPACK_IMPORTED_MODULE_1__/* .handleTextSelection */ .Me);
    // Pagination Listeners
    uiContainer.querySelector("#wtr-first-page-btn").addEventListener("click", () => {
        if (_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.currentPage > 1) {
            _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.currentPage = 1;
            renderTermList(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.currentSearchValue);
        }
    });
    uiContainer.querySelector("#wtr-prev-page-btn").addEventListener("click", () => {
        if (_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.currentPage > 1) {
            _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.currentPage--;
            renderTermList(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.currentSearchValue);
        }
    });
    uiContainer.querySelector("#wtr-next-page-btn").addEventListener("click", () => {
        const filteredTerms = _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.terms.filter((t) => t.original.toLowerCase().includes(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.currentSearchValue.toLowerCase()) ||
            t.replacement.toLowerCase().includes(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.currentSearchValue.toLowerCase()));
        const totalPages = Math.ceil(filteredTerms.length / _config__WEBPACK_IMPORTED_MODULE_4__/* .ITEMS_PER_PAGE */ .re) || 1;
        if (_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.currentPage < totalPages) {
            _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.currentPage++;
            renderTermList(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.currentSearchValue);
        }
    });
    uiContainer.querySelector("#wtr-last-page-btn").addEventListener("click", () => {
        const filteredTerms = _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.terms.filter((t) => t.original.toLowerCase().includes(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.currentSearchValue.toLowerCase()) ||
            t.replacement.toLowerCase().includes(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.currentSearchValue.toLowerCase()));
        const totalPages = Math.ceil(filteredTerms.length / _config__WEBPACK_IMPORTED_MODULE_4__/* .ITEMS_PER_PAGE */ .re) || 1;
        if (_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.currentPage < totalPages) {
            _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.currentPage = totalPages;
            renderTermList(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.currentSearchValue);
        }
    });
    (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, "WTR Term Replacer: UI created successfully");
}
function showProcessingIndicator(show) {
    const overlay = document.querySelector(".wtr-processing-overlay");
    if (overlay) {
        overlay.style.display = show ? "flex" : "none";
    }
}
function showUILoader() {
    const loader = document.getElementById("wtr-ui-loader");
    if (loader) {
        loader.style.display = "flex";
    }
    const content = document.querySelector(".wtr-replacer-content");
    if (content) {
        content.style.pointerEvents = "none";
    }
}
function hideUILoader() {
    const loader = document.getElementById("wtr-ui-loader");
    if (loader) {
        loader.style.display = "none";
    }
    const content = document.querySelector(".wtr-replacer-content");
    if (content) {
        content.style.pointerEvents = "auto";
    }
}
function renderTermList(filter = "") {
    const listEl = document.querySelector(".wtr-replacer-term-list");
    const paginationControls = document.querySelector(".wtr-pagination-controls");
    const pageIndicator = document.getElementById("wtr-page-indicator");
    const firstBtn = document.getElementById("wtr-first-page-btn");
    const prevBtn = document.getElementById("wtr-prev-page-btn");
    const nextBtn = document.getElementById("wtr-next-page-btn");
    const lastBtn = document.getElementById("wtr-last-page-btn");
    const contentArea = document.querySelector(".wtr-replacer-content");
    if (!listEl || !paginationControls || !pageIndicator || !prevBtn || !nextBtn || !firstBtn || !lastBtn) {
        return;
    }
    // Capture current scroll position before re-rendering
    const previousScrollTop = contentArea ? contentArea.scrollTop : 0;
    const shouldRestoreScroll = previousScrollTop > 0 && !_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.isDupMode && filter === _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.currentSearchValue;
    listEl.innerHTML = "";
    let filteredTerms;
    let termsToRender;
    if (_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.isDupMode) {
        const currentKey = _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.dupKeys[_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.currentDupIndex];
        filteredTerms = _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.dupGroups.get(currentKey) || [];
        document.getElementById("wtr-dup-message").textContent = `Duplicate group ${_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.currentDupIndex + 1} of ${_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.dupKeys.length} — ${currentKey}`;
        document.getElementById("wtr-dup-message").style.display = "block";
        document.getElementById("wtr-dup-controls").style.display = "flex";
        document.getElementById("wtr-prev-dup-btn").disabled = _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.currentDupIndex === 0;
        document.getElementById("wtr-next-dup-btn").disabled = _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.currentDupIndex === _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.dupKeys.length - 1;
        document.getElementById("wtr-search-bar").disabled = true;
        paginationControls.style.display = "none";
        termsToRender = filteredTerms;
    }
    else {
        const filterLower = filter.toLowerCase();
        filteredTerms = _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.terms.filter((t) => t.original.toLowerCase().includes(filterLower) || t.replacement.toLowerCase().includes(filterLower));
        document.getElementById("wtr-dup-message").style.display = "none";
        document.getElementById("wtr-dup-controls").style.display = "none";
        document.getElementById("wtr-search-bar").disabled = false;
        const totalPages = Math.ceil(filteredTerms.length / _config__WEBPACK_IMPORTED_MODULE_4__/* .ITEMS_PER_PAGE */ .re) || 1;
        _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.currentPage = Math.max(1, Math.min(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.currentPage, totalPages));
        const start = (_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.currentPage - 1) * _config__WEBPACK_IMPORTED_MODULE_4__/* .ITEMS_PER_PAGE */ .re;
        const end = start + _config__WEBPACK_IMPORTED_MODULE_4__/* .ITEMS_PER_PAGE */ .re;
        termsToRender = filteredTerms.slice(start, end);
        if (totalPages > 1) {
            paginationControls.style.display = "flex";
            pageIndicator.textContent = `Page ${_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.currentPage} of ${totalPages}`;
            firstBtn.disabled = _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.currentPage === 1;
            prevBtn.disabled = _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.currentPage === 1;
            nextBtn.disabled = _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.currentPage === totalPages;
            lastBtn.disabled = _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.currentPage === totalPages;
        }
        else {
            paginationControls.style.display = "none";
        }
    }
    if (termsToRender.length === 0) {
        listEl.innerHTML = _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.terms.length === 0 ? "<li>No terms defined.</li>" : "<li>No terms match search.</li>";
    }
    else {
        const fragment = document.createDocumentFragment();
        termsToRender.forEach((term) => {
            const li = document.createElement("li");
            li.className = "wtr-replacer-term-item";
            li.dataset.id = term.id;
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.className = "wtr-replacer-term-select";
            checkbox.dataset.id = term.id;
            li.appendChild(checkbox);
            const details = document.createElement("div");
            details.className = "wtr-replacer-term-details";
            const termText = document.createElement("div");
            termText.className = "wtr-replacer-term-text";
            const originalSpan = document.createElement("span");
            originalSpan.className = "wtr-term-original";
            originalSpan.textContent = term.original;
            const replacementSpan = document.createElement("span");
            replacementSpan.className = "wtr-term-replacement";
            replacementSpan.textContent = term.replacement;
            termText.appendChild(originalSpan);
            termText.appendChild(document.createTextNode(" → "));
            termText.appendChild(replacementSpan);
            details.appendChild(termText);
            const flags = document.createElement("div");
            if (term.caseSensitive) {
                const badge = document.createElement("small");
                badge.textContent = "CS";
                flags.appendChild(badge);
                flags.appendChild(document.createTextNode(" "));
            }
            if (term.isRegex) {
                const badge = document.createElement("small");
                badge.textContent = "RX";
                flags.appendChild(badge);
                flags.appendChild(document.createTextNode(" "));
            }
            if (term.wholeWord) {
                const badge = document.createElement("small");
                badge.textContent = "WW";
                flags.appendChild(badge);
            }
            details.appendChild(flags);
            li.appendChild(details);
            const actionWrap = document.createElement("div");
            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.className = "btn btn-secondary btn-sm wtr-edit-btn";
            editButton.dataset.id = term.id;
            editButton.textContent = "Edit";
            actionWrap.appendChild(editButton);
            li.appendChild(actionWrap);
            fragment.appendChild(li);
        });
        listEl.appendChild(fragment);
    }
    // Restore scroll position after DOM update if it was captured
    if (shouldRestoreScroll && contentArea) {
        // Use requestAnimationFrame to ensure DOM has been updated
        requestAnimationFrame(() => {
            contentArea.scrollTop = previousScrollTop;
        });
    }
}
function showUIPanel() {
    const ui = document.querySelector(".wtr-replacer-ui");
    ui.style.display = "flex";
    document.getElementById("wtr-disable-all").checked = _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.settings.isDisabled;
    // Restore saved location when showing the terms tab
    if (document.querySelector(".wtr-replacer-tab-btn.active").dataset.tab === "terms") {
        _handlers__WEBPACK_IMPORTED_MODULE_1__/* .restoreTermListLocation */ .s3();
    }
    else {
        renderTermList();
    }
}
function hideUIPanel() {
    // Save current location before hiding
    _handlers__WEBPACK_IMPORTED_MODULE_1__/* .saveTermListLocation */ .R6();
    document.querySelector(".wtr-replacer-ui").style.display = "none";
    clearTermList();
}
function clearTermList() {
    const listEl = document.querySelector(".wtr-replacer-term-list");
    if (listEl) {
        listEl.innerHTML = "";
    }
}
function showFormView(term = null) {
    if (!term) {
        _handlers__WEBPACK_IMPORTED_MODULE_1__/* .clearDiscoveryFormState */ .nS();
    }
    document.getElementById("wtr-term-id").value = term ? term.id : "";
    document.getElementById("wtr-original").value = term ? term.original : "";
    document.getElementById("wtr-replacement").value = term ? term.replacement : "";
    document.getElementById("wtr-case-sensitive").checked = term ? term.caseSensitive : false;
    document.getElementById("wtr-is-regex").checked = term ? term.isRegex : false;
    document.getElementById("wtr-whole-word").checked = term ? term.wholeWord : false;
    document.getElementById("wtr-whole-word").disabled = term ? term.isRegex : false;
    document.getElementById("wtr-save-btn").textContent = term ? "Update Term" : "Save Term";
    switchTab("add");
    // Initialize auto-resize after form is populated
    setTimeout(() => {
        const originalTextarea = document.getElementById("wtr-original");
        if (originalTextarea) {
            const text = originalTextarea.value;
            const charCount = text.length;
            const lines = Math.ceil(charCount / 40);
            originalTextarea.rows = Math.max(1, lines);
        }
        // Re-initialize validation state for the form
        const regexCheckbox = document.getElementById("wtr-is-regex");
        if (regexCheckbox) {
            const validationEvent = new Event("input", { bubbles: true });
            originalTextarea.dispatchEvent(validationEvent);
        }
    }, 10);
}
function switchTab(tabName) {
    document.querySelector(`.wtr-replacer-tab-btn[data-tab="${tabName}"]`).click();
}
// Simple function to create menu buttons with inline SVG icons
function createSimpleMenuButton(options) {
    const { text = "Settings", onClick = null, className = "", tooltip = "" } = options;
    const button = document.createElement("button");
    button.className = `replacer-settings-btn ${className}`;
    if (tooltip) {
        button.title = tooltip;
    }
    // Create settings icon using the specified SVG
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("height", "24px");
    svg.setAttribute("viewBox", "0 -960 960 960");
    svg.setAttribute("width", "24px");
    svg.setAttribute("fill", "#1f1f1f");
    svg.style.marginRight = "4px";
    svg.style.verticalAlign = "middle";
    svg.innerHTML =
        '<path d="M700-120h40v-100h100v-40H740v-100h-40v100H600v40h100v100Zm20 80q-83 0-141.5-58.5T520-240q0-83 58.5-141.5T720-440q83 0 141.5 58.5T920-240q0 83-58.5 141.5T720-40ZM280-600h400v-80H280v80Zm187 480H200q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v268q-29-14-58.5-21t-61.5-7q-11 0-20.5.5T680-517v-3H280v80h245q-18 17-32.5 37T467-360H280v80h163q-2 10-2.5 19.5T440-240q0 33 6 61.5t21 58.5Z"/>';
    button.appendChild(svg);
    // Add text
    const textSpan = document.createElement("span");
    textSpan.textContent = text;
    button.appendChild(textSpan);
    // Add click handler
    if (onClick) {
        button.addEventListener("click", onClick);
    }
    return button;
}
function addMenuButton() {
    const container = document.querySelector("div.col-6:has(button.term-edit-btn)");
    if (!container || _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.observedMenuContainers.has(container)) {
        return;
    }
    const ensureButtonState = () => {
        let settingsButton = container.querySelector(".replacer-settings-btn");
        const originalButton = container.querySelector(".term-edit-btn:not(.replacer-settings-btn)");
        // 1. Create the button if it doesn't exist
        if (!settingsButton) {
            if (!originalButton) {
                return;
            } // Can't create if the original doesn't exist yet
            // Create button with simple inline SVG icon
            settingsButton = createSimpleMenuButton({
                text: "Term Settings",
                onClick: showUIPanel,
                className: originalButton.className, // Copy classes for styling
                tooltip: "Open WTR Term Settings",
            });
            container.appendChild(settingsButton);
            (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, "WTR Term Replacer: Settings button created with simple icon system.");
        }
        // 2. Enforce the correct order (our button should be last)
        if (container.lastChild !== settingsButton) {
            container.appendChild(settingsButton);
            (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, "WTR Term Replacer: Settings button order corrected.");
        }
        // 3. Apply consistent styling
        if (originalButton && settingsButton) {
            const desiredFlexStyle = "1 1 0%";
            container.style.display = "flex";
            container.style.gap = "5px";
            originalButton.style.flex = desiredFlexStyle;
            settingsButton.style.flex = desiredFlexStyle;
        }
    };
    // Run once immediately
    ensureButtonState();
    // Observe for any changes and re-run to correct the state
    const observer = new MutationObserver(() => {
        (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, "WTR Term Replacer: Detected change in menu container, ensuring button state.");
        ensureButtonState();
    });
    observer.observe(container, { childList: true });
    // Mark this container as observed to prevent re-attaching observers
    _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.observedMenuContainers.add(container);
}


/***/ },

/***/ 158
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Nt: () => (/* binding */ escapeRegExp),
/* harmony export */   Rm: () => (/* binding */ log),
/* harmony export */   Ug: () => (/* binding */ getChapterIdFromUrl),
/* harmony export */   getNovelSlug: () => (/* binding */ getNovelSlug),
/* harmony export */   o7: () => (/* binding */ getReaderContextFromPath)
/* harmony export */ });
/* unused harmony exports debounce, detectOtherWTRScripts, logDOMConflict, logProcessingWithMultiScriptContext, startProcessingTimer, endProcessingTimer, isContentReadyForProcessing, isElementReadyForProcessing, estimateContentLoadLevel */
/* harmony import */ var _config_versions__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(387);
/* harmony import */ var _config_versions__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_config_versions__WEBPACK_IMPORTED_MODULE_0__);
// Utility functions for WTR Lab Term Replacer

function getReaderContextFromPath(pathname = window.location.pathname) {
    const parts = pathname.split("/").filter(Boolean);
    const novelIndex = parts.indexOf("novel");
    if (novelIndex >= 0) {
        return {
            lang: novelIndex > 0 ? parts[0] || "en" : "en",
            rawId: parts[novelIndex + 1] || null,
            novelSlug: parts[novelIndex + 2] || null,
            chapterSlug: parts[novelIndex + 3] || null,
        };
    }
    const serieIndex = parts.findIndex((part) => /^serie-\d+$/.test(part));
    if (serieIndex >= 0) {
        const rawId = parts[serieIndex].replace(/^serie-/, "") || null;
        return {
            lang: serieIndex > 0 ? parts[0] || "en" : "en",
            rawId,
            novelSlug: parts[serieIndex + 1] || null,
            chapterSlug: parts[serieIndex + 2] || null,
        };
    }
    return {
        lang: parts[0] || "en",
        rawId: null,
        novelSlug: null,
        chapterSlug: null,
    };
}
function getNovelSlug() {
    return getReaderContextFromPath().novelSlug;
}
function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
}
function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}
function getChapterIdFromUrl(url) {
    const match = url.match(/(chapter-\d+)/);
    return match ? match[1] : null;
}
function log(globalSettings, ...args) {
    if (globalSettings && globalSettings.isLoggingEnabled) {
        console.log(...args);
    }
}
const _CURRENT_VERSION = (0,_config_versions__WEBPACK_IMPORTED_MODULE_0__.getVersion)();
// --- [ENHANCED ${CURRENT_VERSION}] MULTI-SCRIPT COORDINATION FUNCTIONS ---
function detectOtherWTRScripts() {
    // Detect other WTR Lab scripts by their data attributes or specific patterns
    const scripts = document.querySelectorAll("[data-smart-quotes-processed], [data-uncensor-processed], [data-auto-scroll], [data-reader-enhanced]");
    const otherWTRScripts = new Set();
    scripts.forEach((el) => {
        if (el.hasAttribute("data-smart-quotes-processed")) {
            otherWTRScripts.add("Smart Quotes");
        }
        if (el.hasAttribute("data-uncensor-processed")) {
            otherWTRScripts.add("Uncensor");
        }
        if (el.hasAttribute("data-auto-scroll") || el.hasAttribute("data-reader-enhanced")) {
            otherWTRScripts.add("Reader Enhancer");
        }
    });
    if (otherWTRScripts.size > 0) {
        log(null, `WTR Term Replacer: Multi-script environment detected - Active scripts: ${Array.from(otherWTRScripts).join(", ")}`);
    }
    return otherWTRScripts;
}
function logDOMConflict(sourceScript, element, processingQueue, chapterId) {
    const timestamp = new Date().toISOString();
    const conflictInfo = {
        timestamp,
        sourceScript,
        element: element.tagName,
        elementId: element.id || "no-id",
        processingQueueSize: processingQueue ? processingQueue.size : 0,
        chapterId: chapterId,
    };
    log(null, `WTR Term Replacer: DOM conflict detected with ${sourceScript} script`, conflictInfo);
}
function logProcessingWithMultiScriptContext(chapterId, processingTime, isMultiScript = false, otherWTRScripts, processingQueue) {
    const context = {
        chapterId,
        processingTime: `${processingTime}ms`,
        multiScriptEnvironment: isMultiScript,
        activeScripts: otherWTRScripts ? otherWTRScripts.size : 0,
        queueSize: processingQueue ? processingQueue.size : 0,
        timestamp: new Date().toISOString(),
    };
    if (isMultiScript && otherWTRScripts && otherWTRScripts.size > 0) {
        context.activeScripts = Array.from(otherWTRScripts);
        log(null, `WTR Term Replacer: Multi-script enhanced processing completed`, context);
    }
    else {
        log(null, `WTR Term Replacer: Standard processing completed`, context);
    }
}
function startProcessingTimer(operation, processingStartTime) {
    processingStartTime.set(operation, Date.now());
}
function endProcessingTimer(operation, chapterId, processingStartTime, otherWTRScripts, processingQueue) {
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
function isContentReadyForProcessing(container) {
    // Multiple readiness criteria for robust detection
    const hasSubstantialContent = container.textContent?.trim().length > 100;
    const hasNoActiveLoaders = !container.querySelector('.loading, .spinner, [style*="loading"], .skeleton');
    const isVisible = container.offsetWidth > 0 && container.offsetHeight > 0;
    const hasChapterContent = container.querySelector(".chapter-body") || container.querySelector("p, h1, h2, h3, h4, h5, h6");
    return hasSubstantialContent && hasNoActiveLoaders && isVisible && hasChapterContent;
}
// Element readiness check for robust processing
function isElementReadyForProcessing(element) {
    // Check if element is visible and has substantial content
    const rect = element.getBoundingClientRect();
    const isVisible = rect.width > 0 && rect.height > 0;
    const hasSubstantialContent = element.textContent?.trim().length > 50;
    const hasNoLoadingStates = !element.querySelector('.loading, .spinner, [style*="display: none"]');
    return isVisible && hasSubstantialContent && hasNoLoadingStates;
}
// Enhanced content load level estimation for retry mechanisms
function estimateContentLoadLevel(chapterBody) {
    // Estimate how much content is loaded based on text density and structure
    const textNodes = chapterBody.querySelectorAll("p, h1, h2, h3, h4, h5, h6, div, span");
    const totalTextLength = Array.from(textNodes).reduce((total, node) => total + (node.textContent?.trim().length || 0), 0);
    // Check for loading indicators or placeholder content
    const hasLoadingIndicators = chapterBody.querySelector('.loading, .spinner, [style*="loading"], [class*="loading"]');
    const hasPlaceholderContent = chapterBody.textContent?.includes("Loading...") ||
        chapterBody.textContent?.includes("loading") ||
        chapterBody.textContent?.includes("...");
    // Calculate load level based on content density and absence of loading indicators
    let loadLevel = Math.min(totalTextLength / 1000, 1.0); // Normalize to 0-1 based on 1000 chars
    if (hasLoadingIndicators || hasPlaceholderContent) {
        loadLevel *= 0.3; // Reduce load level if loading indicators present
    }
    // Ensure minimum threshold for processing
    return Math.max(loadLevel, totalTextLength > 100 ? 0.5 : 0.1);
}


/***/ },

/***/ 330
(module) {

"use strict";
module.exports = /*#__PURE__*/JSON.parse('{"name":"wtr-lab-term-replacer-webpack","version":"5.6.0","description":"A modular, Webpack-powered TypeScript version of the WTR Lab Term Replacer userscript.","author":"MasuRii","license":"MIT","private":true,"main":"dist/wtr-lab-term-replacer-webpack.user.js","repository":{"type":"git","url":"https://github.com/MasuRii/wtr-lab-term-replacer-webpack.git"},"bugs":{"url":"https://github.com/MasuRii/wtr-lab-term-replacer-webpack/issues"},"keywords":["term","replacement","wtr-lab","userscript","modular","webpack"],"files":["dist/","src/"],"scripts":{"build":"npm run version:update && npm run typecheck && webpack --mode=production","build:performance":"npm run typecheck && webpack --config webpack.config.js --config-name performance --mode=production","build:greasyfork":"npm run typecheck && webpack --config webpack.config.js --config-name greasyfork --mode=production","build:devbundle":"npm run typecheck && webpack --config webpack.config.js --config-name dev --mode=development","dev":"webpack serve --config webpack.config.js --config-name dev --mode=development","typecheck":"tsc --noEmit","test":"node scripts/run-tests.js","version:update":"node scripts/update-versions.js update","version:check":"node scripts/update-versions.js check"},"devDependencies":{"@types/tampermonkey":"^5.0.5","ts-loader":"^9.5.7","typescript":"^6.0.3","webpack":"^5.106.2","webpack-cli":"^7.0.2","webpack-dev-server":"^5.2.3","webpack-userscript":"^3.2.3"}}');

/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be in strict mode.
(() => {
"use strict";
/* harmony import */ var _modules_ui__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(141);
/* harmony import */ var _modules_storage__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(694);
/* harmony import */ var _modules_observer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(405);
/* harmony import */ var _modules_state__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(654);
/* harmony import */ var _modules_handlers__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(359);
/* harmony import */ var _modules_utils__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(158);
// Main entry point for WTR Lab Term Replacer




 // Import all handlers

// Function to get chapter ID from URL (for module compatibility)
function getChapterIdFromUrl(url) {
    const match = url.match(/(chapter-\d+)/);
    return match ? match[1] : null;
}
// Enhanced error handling setup
function setupEnhancedErrorHandling() {
    // Global error handler to catch and log any issues
    window.addEventListener("error", (event) => {
        if (event.error && event.error.message && event.error.message.includes("WTR")) {
            (0,_modules_utils__WEBPACK_IMPORTED_MODULE_5__/* .log */ .Rm)(_modules_state__WEBPACK_IMPORTED_MODULE_3__/* .state */ .wk.globalSettings, "WTR Term Replacer: Caught error:", event.error);
        }
    });
    // Handle unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
        if (event.reason && event.reason.message && event.reason.message.includes("WTR")) {
            (0,_modules_utils__WEBPACK_IMPORTED_MODULE_5__/* .log */ .Rm)(_modules_state__WEBPACK_IMPORTED_MODULE_3__/* .state */ .wk.globalSettings, "WTR Term Replacer: Unhandled promise rejection:", event.reason);
        }
    });
    // Cleanup function for when page unloads
    window.addEventListener("beforeunload", () => {
        _modules_state__WEBPACK_IMPORTED_MODULE_3__/* .state */ .wk.processingQueue.clear();
        (0,_modules_utils__WEBPACK_IMPORTED_MODULE_5__/* .log */ .Rm)(_modules_state__WEBPACK_IMPORTED_MODULE_3__/* .state */ .wk.globalSettings, "WTR Term Replacer: Cleanup on page unload");
    });
    (0,_modules_utils__WEBPACK_IMPORTED_MODULE_5__/* .log */ .Rm)(_modules_state__WEBPACK_IMPORTED_MODULE_3__/* .state */ .wk.globalSettings, "WTR Term Replacer: Enhanced error handling activated");
}
// Enhanced navigation handling setup
function setupEnhancedNavigationHandling() {
    // Enhanced URL change detection with proper debouncing and coordination
    let isNavigationInProgress = false;
    const processNavigationSafely = () => {
        if (isNavigationInProgress) {
            (0,_modules_utils__WEBPACK_IMPORTED_MODULE_5__/* .log */ .Rm)(_modules_state__WEBPACK_IMPORTED_MODULE_3__/* .state */ .wk.globalSettings, "WTR Term Replacer: Navigation already in progress, skipping");
            return;
        }
        isNavigationInProgress = true;
        // Clear processing queue for new chapter
        _modules_state__WEBPACK_IMPORTED_MODULE_3__/* .state */ .wk.processingQueue.clear();
        // Wait for content to load with enhanced detection
        setTimeout(() => {
            Promise.resolve(/* import() */).then(__webpack_require__.bind(__webpack_require__, 405)).then(({ processVisibleChapter }) => {
                processVisibleChapter();
            });
            isNavigationInProgress = false;
        }, 500); // Increased delay to allow DOM updates and prevent conflicts
    };
    // Set up navigation event listeners for SPA-style navigation
    window.addEventListener("popstate", () => {
        (0,_modules_utils__WEBPACK_IMPORTED_MODULE_5__/* .log */ .Rm)(_modules_state__WEBPACK_IMPORTED_MODULE_3__/* .state */ .wk.globalSettings, "WTR Term Replacer: Popstate event detected");
        processNavigationSafely();
    });
    // Handle pushState/replaceState (SPA navigation)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    history.pushState = function (...args) {
        const result = originalPushState.apply(this, args);
        processNavigationSafely();
        return result;
    };
    history.replaceState = function (...args) {
        const result = originalReplaceState.apply(this, args);
        processNavigationSafely();
        return result;
    };
    (0,_modules_utils__WEBPACK_IMPORTED_MODULE_5__/* .log */ .Rm)(_modules_state__WEBPACK_IMPORTED_MODULE_3__/* .state */ .wk.globalSettings, "WTR Term Replacer: Enhanced navigation handling activated");
}
// Enhanced disable functionality that works reliably
function addDisableAllRobustness() {
    // Enhanced disable functionality with proper error handling
    const handleDisableToggleRobust = async function (e) {
        const wasDisabled = _modules_state__WEBPACK_IMPORTED_MODULE_3__/* .state */ .wk.settings.isDisabled;
        const shouldDisable = e.target.checked;
        // Update settings immediately
        _modules_state__WEBPACK_IMPORTED_MODULE_3__/* .state */ .wk.settings.isDisabled = shouldDisable;
        await (await Promise.resolve(/* import() */).then(__webpack_require__.bind(__webpack_require__, 694))).saveSettings(_modules_state__WEBPACK_IMPORTED_MODULE_3__/* .state */ .wk.settings);
        // Perform robust disable/enable operation
        const chapterId = getChapterIdFromUrl(window.location.href);
        if (!chapterId) {
            return;
        }
        const chapterSelector = `#${chapterId} .chapter-body`;
        const chapterBody = document.querySelector(chapterSelector);
        if (chapterBody) {
            try {
                const { performReplacements, revertAllReplacements } = await Promise.resolve(/* import() */).then(__webpack_require__.bind(__webpack_require__, 9));
                if (shouldDisable) {
                    // Disable: revert all replacements
                    (0,_modules_utils__WEBPACK_IMPORTED_MODULE_5__/* .log */ .Rm)(_modules_state__WEBPACK_IMPORTED_MODULE_3__/* .state */ .wk.globalSettings, "WTR Term Replacer: Robust disable - reverting all replacements");
                    await revertAllReplacements(chapterBody);
                    chapterBody.dataset.wtrProcessed = "false";
                }
                else {
                    // Enable: perform replacements with retry
                    (0,_modules_utils__WEBPACK_IMPORTED_MODULE_5__/* .log */ .Rm)(_modules_state__WEBPACK_IMPORTED_MODULE_3__/* .state */ .wk.globalSettings, "WTR Term Replacer: Robust enable - performing replacements");
                    await performReplacements(chapterBody);
                    chapterBody.dataset.wtrProcessed = "true";
                }
            }
            catch (error) {
                (0,_modules_utils__WEBPACK_IMPORTED_MODULE_5__/* .log */ .Rm)(_modules_state__WEBPACK_IMPORTED_MODULE_3__/* .state */ .wk.globalSettings, `WTR Term Replacer: Error during ${shouldDisable ? "disable" : "enable"} operation:`, error);
                // Reset checkbox on error
                e.target.checked = wasDisabled;
                _modules_state__WEBPACK_IMPORTED_MODULE_3__/* .state */ .wk.settings.isDisabled = wasDisabled;
            }
        }
    };
    // Replace the existing event listener with our robust version
    const uiContainer = document.querySelector(".wtr-replacer-ui");
    if (uiContainer) {
        const disableCheckbox = uiContainer.querySelector("#wtr-disable-all");
        if (disableCheckbox) {
            // Remove existing listener and add our enhanced one
            const newDisableCheckbox = disableCheckbox.cloneNode(true);
            disableCheckbox.parentNode.replaceChild(newDisableCheckbox, disableCheckbox);
            newDisableCheckbox.addEventListener("change", handleDisableToggleRobust);
        }
    }
    (0,_modules_utils__WEBPACK_IMPORTED_MODULE_5__/* .log */ .Rm)(_modules_state__WEBPACK_IMPORTED_MODULE_3__/* .state */ .wk.globalSettings, "WTR Term Replacer: Enhanced disable functionality activated");
}
function registerExternalIntegrationBridge() {
    if (window.__WTR_TERM_REPLACER_BRIDGE_REGISTERED__) {
        const existingApi = window.WTR_LAB_TERM_REPLACER || {};
        window.WTR_LAB_TERM_REPLACER = {
            ...existingApi,
            ready: true,
            bridgeVersion: 1,
        };
        return;
    }
    window.__WTR_TERM_REPLACER_BRIDGE_REGISTERED__ = true;
    const existingApi = window.WTR_LAB_TERM_REPLACER || {};
    window.WTR_LAB_TERM_REPLACER = {
        ...existingApi,
        ready: true,
        bridgeVersion: 1,
    };
    window.addEventListener("wtr:addTerm", (event) => {
        const { original, replacement, isRegex } = event?.detail || {};
        _modules_handlers__WEBPACK_IMPORTED_MODULE_4__/* .addTermProgrammatically */ .IY(original, replacement, isRegex);
    });
    window.addEventListener("wtr:requestTerms", async (event) => {
        const requestId = event?.detail?.requestId;
        const requestedSlug = event?.detail?.novelSlug || _modules_state__WEBPACK_IMPORTED_MODULE_3__/* .state */ .wk.novelSlug || (0,_modules_utils__WEBPACK_IMPORTED_MODULE_5__.getNovelSlug)();
        if (!requestId) {
            return;
        }
        try {
            const terms = requestedSlug === _modules_state__WEBPACK_IMPORTED_MODULE_3__/* .state */ .wk.novelSlug ? [..._modules_state__WEBPACK_IMPORTED_MODULE_3__/* .state */ .wk.terms] : await (0,_modules_storage__WEBPACK_IMPORTED_MODULE_1__.getTermsForSlug)(requestedSlug);
            window.dispatchEvent(new CustomEvent("wtr:termsResponse", {
                detail: {
                    requestId,
                    novelSlug: requestedSlug,
                    terms,
                    source: "wtr-term-replacer",
                    success: true,
                },
            }));
        }
        catch (error) {
            (0,_modules_utils__WEBPACK_IMPORTED_MODULE_5__/* .log */ .Rm)(_modules_state__WEBPACK_IMPORTED_MODULE_3__/* .state */ .wk.globalSettings, "WTR Term Replacer: Failed to provide terms to external requester", error);
            window.dispatchEvent(new CustomEvent("wtr:termsResponse", {
                detail: {
                    requestId,
                    novelSlug: requestedSlug,
                    terms: [],
                    source: "wtr-term-replacer",
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                },
            }));
        }
    });
    (0,_modules_utils__WEBPACK_IMPORTED_MODULE_5__/* .log */ .Rm)(_modules_state__WEBPACK_IMPORTED_MODULE_3__/* .state */ .wk.globalSettings, "WTR Term Replacer: External integration bridge registered");
}
async function main() {
    (0,_modules_utils__WEBPACK_IMPORTED_MODULE_5__/* .log */ .Rm)(_modules_state__WEBPACK_IMPORTED_MODULE_3__/* .state */ .wk.globalSettings, "WTR Term Replacer: Main function starting initialization...");
    // Initialize state and validate novel slug
    const novelSlug = (0,_modules_utils__WEBPACK_IMPORTED_MODULE_5__.getNovelSlug)();
    if (!novelSlug) {
        (0,_modules_utils__WEBPACK_IMPORTED_MODULE_5__/* .log */ .Rm)(_modules_state__WEBPACK_IMPORTED_MODULE_3__/* .state */ .wk.globalSettings, "WTR Term Replacer: Critical error - could not determine novel slug");
        console.error("WTR Term Replacer: Could not determine novel slug.");
        return;
    }
    (0,_modules_utils__WEBPACK_IMPORTED_MODULE_5__/* .log */ .Rm)(_modules_state__WEBPACK_IMPORTED_MODULE_3__/* .state */ .wk.globalSettings, `WTR Term Replacer: Novel slug determined: ${novelSlug}`);
    (0,_modules_state__WEBPACK_IMPORTED_MODULE_3__/* .setNovelSlug */ .oP)(novelSlug);
    (0,_modules_utils__WEBPACK_IMPORTED_MODULE_5__/* .log */ .Rm)(_modules_state__WEBPACK_IMPORTED_MODULE_3__/* .state */ .wk.globalSettings, "WTR Term Replacer: Loading global settings and data...");
    await (0,_modules_storage__WEBPACK_IMPORTED_MODULE_1__.loadGlobalSettings)();
    await (0,_modules_storage__WEBPACK_IMPORTED_MODULE_1__.loadData)();
    (0,_modules_utils__WEBPACK_IMPORTED_MODULE_5__/* .log */ .Rm)(_modules_state__WEBPACK_IMPORTED_MODULE_3__/* .state */ .wk.globalSettings, `WTR Term Replacer: Data loaded - terms: ${_modules_state__WEBPACK_IMPORTED_MODULE_3__/* .state */ .wk.terms.length}, settings disabled: ${_modules_state__WEBPACK_IMPORTED_MODULE_3__/* .state */ .wk.settings.isDisabled}`);
    // Enhanced initialization with robustness features
    (0,_modules_utils__WEBPACK_IMPORTED_MODULE_5__/* .log */ .Rm)(_modules_state__WEBPACK_IMPORTED_MODULE_3__/* .state */ .wk.globalSettings, "WTR Term Replacer: Setting up error handling...");
    setupEnhancedErrorHandling();
    (0,_modules_utils__WEBPACK_IMPORTED_MODULE_5__/* .log */ .Rm)(_modules_state__WEBPACK_IMPORTED_MODULE_3__/* .state */ .wk.globalSettings, "WTR Term Replacer: Setting up disable functionality...");
    addDisableAllRobustness();
    (0,_modules_utils__WEBPACK_IMPORTED_MODULE_5__/* .log */ .Rm)(_modules_state__WEBPACK_IMPORTED_MODULE_3__/* .state */ .wk.globalSettings, "WTR Term Replacer: Setting up navigation handling...");
    setupEnhancedNavigationHandling();
    (0,_modules_utils__WEBPACK_IMPORTED_MODULE_5__/* .log */ .Rm)(_modules_state__WEBPACK_IMPORTED_MODULE_3__/* .state */ .wk.globalSettings, "WTR Term Replacer: Creating UI and menu commands...");
    (0,_modules_ui__WEBPACK_IMPORTED_MODULE_0__/* .createUI */ .RD)(); // This will also set up the initial event listeners
    (0,_modules_utils__WEBPACK_IMPORTED_MODULE_5__/* .log */ .Rm)(_modules_state__WEBPACK_IMPORTED_MODULE_3__/* .state */ .wk.globalSettings, "WTR Term Replacer: Registering menu commands...");
    GM_registerMenuCommand("Term Replacer Settings", _modules_ui__WEBPACK_IMPORTED_MODULE_0__/* .showUIPanel */ .E1);
    GM_registerMenuCommand("Term Discovery Assistant", () => {
        (0,_modules_ui__WEBPACK_IMPORTED_MODULE_0__/* .showUIPanel */ .E1)();
        _modules_handlers__WEBPACK_IMPORTED_MODULE_4__/* .switchToDiscoveryAssistant */ .WF();
    });
    GM_registerMenuCommand("Toggle Logging", _modules_handlers__WEBPACK_IMPORTED_MODULE_4__/* .toggleLogging */ .o6);
    (0,_modules_utils__WEBPACK_IMPORTED_MODULE_5__/* .log */ .Rm)(_modules_state__WEBPACK_IMPORTED_MODULE_3__/* .state */ .wk.globalSettings, "WTR Term Replacer: Starting initial content detection...");
    (0,_modules_observer__WEBPACK_IMPORTED_MODULE_2__/* .waitForInitialContent */ ._)();
    (0,_modules_utils__WEBPACK_IMPORTED_MODULE_5__/* .log */ .Rm)(_modules_state__WEBPACK_IMPORTED_MODULE_3__/* .state */ .wk.globalSettings, "WTR Term Replacer: Initialization completed successfully");
}
registerExternalIntegrationBridge();
// Start the script
main().catch((err) => console.error("WTR Term Replacer failed to start:", err));

})();

/******/ })()
;