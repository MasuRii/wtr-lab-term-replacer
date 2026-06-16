// ==UserScript==
// @name WTR Lab Term Replacer
// @description A modular, Webpack-powered TypeScript version of the WTR Lab Term Replacer userscript.
// @version 5.7.3
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
                    targetElement = (0,_utils__WEBPACK_IMPORTED_MODULE_1__/* .findChapterBodyById */ .b4)(chapterId) || (0,_utils__WEBPACK_IMPORTED_MODULE_1__/* .findChapterBodyForUrl */ .dF)(document);
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
  mA: () => (/* binding */ enhanceWtrTermPopovers),
  az: () => (/* binding */ handleAddTermFromSelection),
  Jm: () => (/* binding */ handleDeleteSelected),
  ts: () => (/* binding */ handleDisableToggle),
  ym: () => (/* binding */ handleExportAll),
  ow: () => (/* binding */ handleExportCombined),
  b7: () => (/* binding */ handleExportNovel),
  kF: () => (/* binding */ handleFileImport),
  y$: () => (/* binding */ handleFindDuplicates),
  VM: () => (/* binding */ handleListInteraction),
  Zw: () => (/* binding */ handleRefreshSuggestionsClick),
  JB: () => (/* binding */ handleReplacementSuggestionClick),
  l9: () => (/* binding */ handleReplacementSuggestionInput),
  s7: () => (/* binding */ handleSaveTerm),
  RX: () => (/* binding */ handleSearch),
  U8: () => (/* binding */ handleSuggestionTargetFocus),
  Qk: () => (/* binding */ handleTabSwitch),
  Me: () => (/* binding */ handleTextSelection),
  cD: () => (/* binding */ handleWtrPopoverAddTermClick),
  Xq: () => (/* binding */ handleWtrTextPatchClick),
  X: () => (/* binding */ hideUIPanel),
  AO: () => (/* binding */ normalizeOriginalRegexField),
  s3: () => (/* binding */ restoreTermListLocation),
  R6: () => (/* reexport */ storage.saveTermListLocation),
  o6: () => (/* binding */ toggleLogging),
  fA: () => (/* binding */ validateRegexSilent)
});

// UNUSED EXPORTS: downloadJSON, setSearchFieldValue, validateRegex

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
const CJK_PATTERN = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\uAC00-\uD7AF]/u;
const CONTROL_CHARS_PATTERN = /[\u0000-\u001f\u007f]/g;
const HTML_TAG_PATTERN = /<[^>]*>/g;
const HTML_ENTITY_PATTERN = /&(?:nbsp|amp|lt|gt|quot|#39);/gi;
const SAFE_IDENTIFIER_PATTERN = /^[A-Za-z0-9_.:-]{1,80}$/;
const WTR_SOURCE_ID_PREFIX = "id.";
const TERMS_REFRESH_PARAM = "_wtr_refresh";
let termsRefreshCounter = 0;
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
function buildTermsApiUrl(rawId, forceRefresh = false) {
    const baseUrl = `/api/v2/reader/terms/${encodeURIComponent(String(rawId))}.json`;
    if (!forceRefresh) {
        return baseUrl;
    }
    termsRefreshCounter = (termsRefreshCounter + 1) % 1000;
    return `${baseUrl}?${TERMS_REFRESH_PARAM}=${Date.now() * 1000 + termsRefreshCounter}`;
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
function getGlossarySourceLabel(entry, inheritedSourceLabel) {
    const data = isRecord(entry.data) ? entry.data : null;
    const explicitSourceLabel = sanitizeApiText(entry.source_label ?? entry.sourceLabel, 40);
    if (explicitSourceLabel) {
        return explicitSourceLabel;
    }
    if (isRecord(data?.ai_run) || data?.build != null) {
        return "AI Glossary";
    }
    const sourceType = sanitizeIdentifier(data?.type ?? entry.type);
    if (sourceType === "generic") {
        const title = sanitizeApiText(entry.title ?? data?.title, 40);
        return title ? `Generic: ${title}` : inheritedSourceLabel || "Generic";
    }
    if (sourceType === "raw") {
        return inheritedSourceLabel || "Raw";
    }
    return inheritedSourceLabel;
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
function collectNovelTermEntries(payload, fallbackLang, sourceId, sourceLabel) {
    if (isWtrTermTuple(payload)) {
        return [{ item: payload, sourceId, sourceLabel, lang: fallbackLang }];
    }
    if (Array.isArray(payload)) {
        return payload.flatMap((item) => collectNovelTermEntries(item, fallbackLang, sourceId, sourceLabel));
    }
    if (!isRecord(payload)) {
        return [];
    }
    const localSourceId = getGlossarySourceId(payload) || sourceId;
    const localSourceLabel = getGlossarySourceLabel(payload, sourceLabel);
    const localLang = sanitizeLang(payload.lang ?? payload.language, fallbackLang);
    const directTerm = firstTextValue(payload, ["source", "original", "source_text", "sourceText", "from", "term", "raw", "name"]);
    if (directTerm) {
        return [{ item: payload, sourceId: localSourceId, sourceLabel: localSourceLabel, lang: localLang }];
    }
    const nestedEntries = [];
    for (const fieldName of ["glossaries", "data", "terms", "replacements", "items", "results", "sources"]) {
        const value = payload[fieldName];
        if (value && (Array.isArray(value) || typeof value === "object")) {
            nestedEntries.push(...collectNovelTermEntries(value, localLang, localSourceId, localSourceLabel));
        }
    }
    return nestedEntries;
}
function textValuesFromArray(values, maxLength = MAX_TERM_LENGTH) {
    const deduped = new Map();
    for (const value of values) {
        const text = sanitizeApiText(value, maxLength);
        if (text) {
            deduped.set(text, text);
        }
    }
    return Array.from(deduped.values());
}
function firstTextFromArray(values, maxLength = MAX_TERM_LENGTH) {
    return textValuesFromArray(values, maxLength)[0] || null;
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
function getReplacementValues(candidate) {
    return textValuesFromArray([candidate.replacement, ...(candidate.replacementSuggestions || [])], MAX_REPLACEMENT_LENGTH);
}
function mergeNovelTermCandidate(previous, candidate) {
    const preferred = candidate.count > previous.count || (!previous.hash && candidate.hash) ? candidate : previous;
    const replacementValues = textValuesFromArray([...getReplacementValues(previous), ...getReplacementValues(candidate)], MAX_REPLACEMENT_LENGTH);
    const merged = {
        ...preferred,
        count: Math.max(previous.count, candidate.count),
    };
    if (replacementValues.length > 0) {
        merged.replacement = replacementValues[0];
    }
    else {
        delete merged.replacement;
    }
    if (replacementValues.length > 1) {
        merged.replacementSuggestions = replacementValues;
    }
    else {
        delete merged.replacementSuggestions;
    }
    return merged;
}
function parseNovelTermEntries(payload, lang = "en", limit = MAX_RESULTS) {
    const deduped = new Map();
    const entries = collectNovelTermEntries(payload, sanitizeLang(lang));
    for (const { item, sourceId: inheritedSourceId, sourceLabel, lang: entryLang } of entries) {
        let term = null;
        let replacement = null;
        let replacementSuggestions = [];
        let count = 0;
        let sourceId = inheritedSourceId;
        let hash;
        let candidateLang = entryLang;
        if (Array.isArray(item)) {
            const replacements = Array.isArray(item[0]) ? item[0] : [];
            term = sanitizeApiText(item[1]);
            replacementSuggestions = textValuesFromArray(replacements, MAX_REPLACEMENT_LENGTH);
            replacement = replacementSuggestions[0] || null;
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
            ...(replacementSuggestions.length > 1 ? { replacementSuggestions } : {}),
            source: "novel",
            count,
            sourceId,
            hash,
            lang: candidateLang,
            ...(sourceLabel ? { sourceLabel } : {}),
        };
        const mapKey = term.toLocaleLowerCase();
        const previous = deduped.get(mapKey);
        if (!previous) {
            deduped.set(mapKey, candidate);
        }
        else {
            deduped.set(mapKey, mergeNovelTermCandidate(previous, candidate));
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
function stripSuggestionRegexSyntax(fragment) {
    return fragment
        .replace(/\\[bBAZzG]/g, " ")
        .replace(/\\s[+*?]?/g, " ")
        .replace(/\\[dDwW][+*?]?/g, " ")
        .replace(/\((?:\?[:=!<])?([^)]*)\)/g, "$1")
        .replace(/\[([^\]\\]+)\][+*?]?/g, (_match, chars) => chars.match(/[\p{L}\p{M}\p{N}'-]/u)?.[0] || " ")
        .replace(/[{}+*?^$]/g, " ")
        .replace(/\\(.)/g, "$1")
        .replace(/\s+/g, " ")
        .trim();
}
function splitTopLevelSuggestionAlternatives(value) {
    const parts = [];
    let current = "";
    let isEscaped = false;
    let characterClassDepth = 0;
    let groupDepth = 0;
    for (const char of value) {
        if (isEscaped) {
            current += char;
            isEscaped = false;
            continue;
        }
        if (char === "\\") {
            current += char;
            isEscaped = true;
            continue;
        }
        if (char === "[") {
            characterClassDepth++;
            current += char;
            continue;
        }
        if (char === "]" && characterClassDepth > 0) {
            characterClassDepth--;
            current += char;
            continue;
        }
        if (characterClassDepth === 0 && char === "(") {
            groupDepth++;
            current += char;
            continue;
        }
        if (characterClassDepth === 0 && char === ")" && groupDepth > 0) {
            groupDepth--;
            current += char;
            continue;
        }
        if (characterClassDepth === 0 && groupDepth === 0 && char === "|") {
            parts.push(current);
            current = "";
            continue;
        }
        current += char;
    }
    parts.push(current);
    return parts;
}
function getReplacementSuggestionLookupTerms(original, isRegex) {
    const terms = new Map();
    const addTerm = (value) => {
        const term = value.replace(/\s+/g, " ").trim();
        if (term.length >= 2) {
            terms.set(term.toLocaleLowerCase(), term);
        }
    };
    if (!isRegex) {
        addTerm(original);
        original.split(/[\n,;|/]+/).forEach(addTerm);
        return Array.from(terms.values());
    }
    for (const fragment of splitTopLevelSuggestionAlternatives(original)) {
        const strippedFragment = stripSuggestionRegexSyntax(fragment);
        addTerm(strippedFragment);
        strippedFragment.split(/[,;\n]+/).forEach(addTerm);
    }
    stripSuggestionRegexSyntax(original)
        .split(/[|,;\n]+/)
        .forEach(addTerm);
    addTerm(original);
    return Array.from(terms.values());
}
function getCandidateLookupValues(candidate) {
    return textValuesFromArray([candidate.term, candidate.replacement, ...(candidate.replacementSuggestions || [])], MAX_REPLACEMENT_LENGTH);
}
function normalizeSuggestionComparable(value, caseSensitive) {
    const normalized = value
        .replace(/[\p{Pd}_/]+/gu, " ")
        .replace(/[^\p{L}\p{M}\p{N}]+/gu, " ")
        .replace(/\s+/g, " ")
        .trim();
    return caseSensitive ? normalized : normalized.toLocaleLowerCase();
}
function suggestionValuesMatch(lookupTerm, candidateValue, caseSensitive) {
    const normalizedLookupTerm = caseSensitive ? lookupTerm : lookupTerm.toLocaleLowerCase();
    const normalizedCandidateValue = caseSensitive ? candidateValue : candidateValue.toLocaleLowerCase();
    if (normalizedCandidateValue === normalizedLookupTerm) {
        return true;
    }
    const comparableLookupTerm = normalizeSuggestionComparable(lookupTerm, caseSensitive);
    const comparableCandidateValue = normalizeSuggestionComparable(candidateValue, caseSensitive);
    if (!comparableLookupTerm || !comparableCandidateValue) {
        return false;
    }
    if (comparableCandidateValue === comparableLookupTerm) {
        return true;
    }
    return comparableLookupTerm.length >= 5 && comparableCandidateValue.includes(comparableLookupTerm);
}
function buildRawLookupFallbackCandidate(lookupTerm, fallbackContext) {
    const rawId = sanitizeIdentifier(fallbackContext?.rawId);
    const lang = sanitizeLang(fallbackContext?.lang, "en");
    const term = sanitizeApiText(lookupTerm);
    if (!rawId || !term || !CJK_PATTERN.test(term)) {
        return null;
    }
    return {
        term,
        source: "novel",
        count: 0,
        sourceId: `${WTR_SOURCE_ID_PREFIX}raw.${rawId}`,
        hash: term,
        lang,
        sourceLabel: "Raw Lookup",
    };
}
function selectReplacementSuggestionCandidates(candidates, lookupTerms, isRegex, caseSensitive, limit = 20, fallbackContext) {
    const selected = new Map();
    const addCandidate = (candidate) => {
        if (selected.size >= limit) {
            return false;
        }
        const key = candidate.term.toLocaleLowerCase();
        const wasMissing = !selected.has(key);
        selected.set(key, candidate);
        return wasMissing;
    };
    const dedupedLookupTerms = Array.from(new Map(lookupTerms
        .map((term) => term.replace(/\s+/g, " ").trim())
        .filter(Boolean)
        .map((term) => [term.toLocaleLowerCase(), term])).values());
    for (const lookupTerm of dedupedLookupTerms) {
        let matchedCurrentLookupTerm = false;
        for (const candidate of candidates) {
            if (getCandidateLookupValues(candidate).some((value) => suggestionValuesMatch(lookupTerm, value, caseSensitive))) {
                matchedCurrentLookupTerm = addCandidate(candidate) || matchedCurrentLookupTerm;
            }
        }
        if (isRegex) {
            try {
                const regex = new RegExp(lookupTerm, caseSensitive ? "" : "i");
                for (const candidate of candidates) {
                    if (getCandidateLookupValues(candidate).some((value) => regex.test(value))) {
                        matchedCurrentLookupTerm = addCandidate(candidate) || matchedCurrentLookupTerm;
                    }
                }
            }
            catch (_error) {
                // Invalid in-progress regex input still gets literal/variant suggestions from extracted terms.
            }
        }
        if (!matchedCurrentLookupTerm) {
            const fallbackCandidate = buildRawLookupFallbackCandidate(lookupTerm, fallbackContext);
            if (fallbackCandidate) {
                addCandidate(fallbackCandidate);
            }
        }
    }
    return Array.from(selected.values()).slice(0, limit);
}
function isReplacementSuggestionRequestCurrent(requestId, latestRequestId, candidateKey, selectedCandidateKey, inputValue, currentInputValue) {
    return requestId === latestRequestId && candidateKey === selectedCandidateKey && inputValue === currentInputValue;
}
function normalizeReplacementSuggestion(replacement, count = 0, sourceLabel = "", sourceRank = 50) {
    const normalizedReplacement = replacement.replace(/\s+/g, " ").trim();
    if (!normalizedReplacement) {
        return null;
    }
    return { replacement: normalizedReplacement, count, sourceLabel, sourceRank };
}
function mergeSuggestionLabels(existingLabel = "", newLabel = "") {
    const labels = new Set([...existingLabel.split(" + "), ...newLabel.split(" + ")].map((label) => label.trim()).filter(Boolean));
    return Array.from(labels).join(" + ");
}
function getSuggestionSourcePriority(suggestion) {
    const sourceLabel = (suggestion.sourceLabel || "").toLowerCase();
    return sourceLabel.includes("wtr") && sourceLabel.includes("api") ? -1 : 0;
}
function dedupeReplacementSuggestions(suggestions) {
    const deduped = new Map();
    suggestions.forEach((suggestion) => {
        const normalized = normalizeReplacementSuggestion(suggestion.replacement, suggestion.count, suggestion.sourceLabel, suggestion.sourceRank);
        if (!normalized) {
            return;
        }
        const key = normalized.replacement;
        const existing = deduped.get(key);
        if (!existing) {
            deduped.set(key, normalized);
            return;
        }
        existing.count = Math.max(existing.count, normalized.count);
        existing.sourceRank = Math.min(existing.sourceRank ?? 50, normalized.sourceRank ?? 50);
        existing.sourceLabel = mergeSuggestionLabels(existing.sourceLabel, normalized.sourceLabel);
    });
    return Array.from(deduped.values()).sort((a, b) => (a.sourceRank ?? 50) - (b.sourceRank ?? 50) ||
        getSuggestionSourcePriority(a) - getSuggestionSourcePriority(b) ||
        b.count - a.count ||
        a.replacement.localeCompare(b.replacement));
}
function mergeReplacementSuggestionsForCandidates(candidates, suggestions) {
    const mergedSuggestions = [];
    for (const candidate of candidates) {
        mergedSuggestions.push({
            replacement: candidate.term,
            count: candidate.count,
            sourceLabel: "Source",
            sourceRank: -10,
        });
        const candidateReplacements = candidate.replacementSuggestions?.length
            ? candidate.replacementSuggestions
            : candidate.replacement
                ? [candidate.replacement]
                : [];
        candidateReplacements.forEach((replacement) => {
            mergedSuggestions.push({
                replacement,
                count: candidate.count,
                sourceLabel: candidate.sourceLabel || "WTR",
                sourceRank: 30,
            });
        });
    }
    mergedSuggestions.push(...suggestions.map((suggestion) => ({
        ...suggestion,
        sourceLabel: suggestion.sourceLabel || "API",
        sourceRank: suggestion.sourceRank ?? 40,
    })));
    return dedupeReplacementSuggestions(mergedSuggestions);
}
function normalizeSuggestionPresenceToken(value) {
    return value.replace(/\s+/g, " ").trim().toLocaleLowerCase();
}
function getSuggestionPresenceTokens(value) {
    return new Set(value
        .split(/\s*(?:\||\/|,|;|\n)\s*/)
        .map(normalizeSuggestionPresenceToken)
        .filter(Boolean));
}
function getSuggestionPresenceLabelsFromValues(suggestion, originalValue, replacementValue) {
    const labels = [];
    const normalizedSuggestion = normalizeSuggestionPresenceToken(suggestion);
    if (!normalizedSuggestion) {
        return labels;
    }
    if (getSuggestionPresenceTokens(originalValue).has(normalizedSuggestion)) {
        labels.push("Original");
    }
    if (getSuggestionPresenceTokens(replacementValue).has(normalizedSuggestion)) {
        labels.push("Replacement");
    }
    return labels;
}
function shouldDisplaySuggestionCount(suggestion) {
    const sourceLabel = (suggestion.sourceLabel || "").toLowerCase();
    return suggestion.count > 0 && /wtr|raw|generic|glossary|current|api|user|profile|preference|community/.test(sourceLabel);
}
function mergeRefreshReplacementSuggestions({ existingSuggestions, seedSuggestions, candidates, loadedSuggestions, mergeExisting = false, }) {
    return dedupeReplacementSuggestions([
        ...(mergeExisting ? existingSuggestions : []),
        ...seedSuggestions,
        ...mergeReplacementSuggestionsForCandidates(candidates, loadedSuggestions),
    ]);
}
async function loadReplacementSuggestionBatches(candidates, loadSuggestions, onBatch) {
    const batches = await Promise.all(candidates.map(async (candidate) => {
        const suggestions = await loadSuggestions(candidate);
        onBatch(candidate, suggestions);
        return suggestions;
    }));
    return batches.flat();
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


const TERM_SUGGESTION_CACHE_PREFIX = "wtr_lab_term_suggestion_cache_v1_";
const NOVEL_TERMS_CACHE_TTL_MS = 60 * 60 * 1000;
const PREFERENCES_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const NOVEL_TERMS_DISCOVERY_LIMIT = 2000;
function getReaderContext() {
    return (0,utils/* getReaderContextFromPath */.o7)(window.location.pathname);
}
function getCsrfToken() {
    const meta = document.querySelector('meta[name="csrf-token"], meta[name="csrf_token"]');
    return meta?.getAttribute("content") || null;
}
function getCacheKey(type, identifiers) {
    return `${TERM_SUGGESTION_CACHE_PREFIX}${type}_${identifiers.filter(Boolean).join("_")}`;
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
        // Suggestion cache is optional and must never block the main term workflow.
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
    const apiPayload = await fetchJson(buildTermsApiUrl(context.rawId, forceRefresh));
    const candidates = parseNovelTermEntries(apiPayload, context.lang, NOVEL_TERMS_DISCOVERY_LIMIT);
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
            novelTerms: [],
            replacementSuggestions: [],
            selectedCandidate: null,
        };
    }
    return state/* state */.wk.termDiscovery;
}
function getSuggestionPresenceLabels(suggestion) {
    const originalField = document.getElementById("wtr-original");
    const replacementField = document.getElementById("wtr-replacement");
    return getSuggestionPresenceLabelsFromValues(suggestion, originalField?.value || "", replacementField?.value || "");
}
function shouldShowSuggestionCount(suggestion) {
    return shouldDisplaySuggestionCount(suggestion);
}
function getDisplaySourceLabel(sourceLabel = "WTR") {
    return sourceLabel === "API" ? "Community" : sourceLabel;
}
function getSuggestionVisualMeta(suggestion) {
    const sourceLabel = getDisplaySourceLabel(suggestion.sourceLabel || "WTR");
    const normalizedSource = sourceLabel.toLowerCase();
    if (shouldShowSuggestionCount(suggestion)) {
        return { kind: "profile", icon: "profile", sourceLabel };
    }
    if (normalizedSource.includes("google")) {
        return { kind: "google", icon: "g_translate", sourceLabel };
    }
    if (normalizedSource.includes("source")) {
        return { kind: "source", icon: "text_fields", sourceLabel };
    }
    if (normalizedSource.includes("field")) {
        return { kind: "field", icon: "edit", sourceLabel };
    }
    return { kind: "wtr", icon: "dictionary", sourceLabel };
}
function createSuggestionIcon(iconName) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "icon inline-flex shrink-0 size-4");
    svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", `#${iconName}`);
    svg.appendChild(use);
    return svg;
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
    label.textContent = "Suggestions:";
    container.appendChild(label);
    const buttonWrap = document.createElement("div");
    buttonWrap.className = "wtr-replacement-suggestion-buttons";
    suggestions.forEach((suggestion) => {
        const presenceLabels = getSuggestionPresenceLabels(suggestion.replacement);
        const visualMeta = getSuggestionVisualMeta(suggestion);
        const displayCount = shouldShowSuggestionCount(suggestion) ? suggestion.count : 0;
        const metaParts = [visualMeta.sourceLabel, displayCount > 0 ? String(displayCount) : "", ...presenceLabels].filter(Boolean);
        const presenceClasses = [
            presenceLabels.length ? "wtr-suggestion-existing" : "",
            presenceLabels.includes("Original") ? "wtr-suggestion-in-original" : "",
            presenceLabels.includes("Replacement") ? "wtr-suggestion-in-replacement" : "",
        ]
            .filter(Boolean)
            .join(" ");
        const button = document.createElement("button");
        button.type = "button";
        button.className = `wtr-replacement-suggestion-btn wtr-suggestion-${visualMeta.kind}${presenceClasses ? ` ${presenceClasses}` : ""}`;
        button.dataset.replacement = suggestion.replacement;
        button.title = metaParts.join(" • ");
        const iconSegment = document.createElement("span");
        iconSegment.className = "wtr-suggestion-icon-segment";
        iconSegment.appendChild(createSuggestionIcon(visualMeta.icon));
        if (displayCount > 0) {
            const countLabel = document.createElement("span");
            countLabel.textContent = String(displayCount);
            iconSegment.appendChild(countLabel);
        }
        button.appendChild(iconSegment);
        const replacementLabel = document.createElement("span");
        replacementLabel.className = "wtr-suggestion-label";
        replacementLabel.textContent = suggestion.replacement;
        button.appendChild(replacementLabel);
        const sourceBadge = document.createElement("span");
        sourceBadge.className = "wtr-suggestion-source-badge";
        sourceBadge.textContent = visualMeta.sourceLabel;
        button.appendChild(sourceBadge);
        buttonWrap.appendChild(button);
    });
    container.appendChild(buttonWrap);
}
function handlers_normalizeReplacementSuggestion(replacement, count = 0, sourceLabel = "", sourceRank = 50) {
    const normalizedReplacement = replacement.replace(/\s+/g, " ").trim();
    if (!normalizedReplacement) {
        return null;
    }
    return { replacement: normalizedReplacement, count, sourceLabel, sourceRank };
}
function handlers_mergeSuggestionLabels(existingLabel = "", newLabel = "") {
    const labels = new Set([...existingLabel.split(" + "), ...newLabel.split(" + ")].map((label) => label.trim()).filter(Boolean));
    return Array.from(labels).join(" + ");
}
function handlers_getSuggestionSourcePriority(suggestion) {
    const sourceLabel = (suggestion.sourceLabel || "").toLowerCase();
    return sourceLabel.includes("wtr") && sourceLabel.includes("api") ? -1 : 0;
}
function handlers_dedupeReplacementSuggestions(suggestions) {
    const deduped = new Map();
    suggestions.forEach((suggestion) => {
        const normalized = handlers_normalizeReplacementSuggestion(suggestion.replacement, suggestion.count, suggestion.sourceLabel, suggestion.sourceRank);
        if (!normalized) {
            return;
        }
        const key = normalized.replacement;
        const existing = deduped.get(key);
        if (!existing) {
            deduped.set(key, normalized);
            return;
        }
        existing.count = Math.max(existing.count, normalized.count);
        existing.sourceRank = Math.min(existing.sourceRank ?? 50, normalized.sourceRank ?? 50);
        existing.sourceLabel = handlers_mergeSuggestionLabels(existing.sourceLabel, normalized.sourceLabel);
    });
    return Array.from(deduped.values()).sort((a, b) => (a.sourceRank ?? 50) - (b.sourceRank ?? 50) ||
        handlers_getSuggestionSourcePriority(a) - handlers_getSuggestionSourcePriority(b) ||
        b.count - a.count ||
        a.replacement.localeCompare(b.replacement));
}
function replacementSuggestionsFromValues(values, sourceLabel = "WTR", sourceRank = 50) {
    return handlers_dedupeReplacementSuggestions(values
        .map((value) => handlers_normalizeReplacementSuggestion(value, 0, sourceLabel, sourceRank))
        .filter((suggestion) => Boolean(suggestion)));
}
function getOriginalInputOptions() {
    const originalInput = document.getElementById("wtr-original");
    const regexCheckbox = document.getElementById("wtr-is-regex");
    const caseSensitiveCheckbox = document.getElementById("wtr-case-sensitive");
    return {
        value: originalInput ? originalInput.value.trim() : "",
        isRegex: Boolean(regexCheckbox?.checked),
        caseSensitive: Boolean(caseSensitiveCheckbox?.checked),
    };
}
function findNovelCandidatesByOriginalInput(original, isRegex, caseSensitive) {
    const discovery = ensureDiscoveryState();
    const novelTerms = discovery.novelTerms;
    const lookupTerms = getReplacementSuggestionLookupTerms(original, isRegex);
    const readerContext = (0,utils/* getReaderContextFromPath */.o7)(window.location.pathname);
    return selectReplacementSuggestionCandidates(novelTerms, lookupTerms, isRegex, caseSensitive, 20, readerContext);
}
let replacementSuggestionRequestId = 0;
let replacementSuggestionTimeout = null;
let suppressNextReplacementSuggestionInput = false;
let activeSuggestionTarget = "replacement";
function isActiveReplacementSuggestionRequest(requestId, inputValue) {
    return requestId === replacementSuggestionRequestId && getOriginalInputOptions().value === inputValue;
}
function getOriginalInputFieldSuggestions(value, isRegex) {
    if (!isRegex) {
        return [];
    }
    return normalizeOriginalRegexPattern(value)
        .split("|")
        .map((part) => handlers_normalizeReplacementSuggestion(part, 0, "Field", 5))
        .filter((suggestion) => Boolean(suggestion));
}
async function updateReplacementSuggestionsForCandidates(candidates, inputValue, mergeExisting = false, forceRefreshSuggestions = false, seedSuggestions = []) {
    const discovery = ensureDiscoveryState();
    const existingSuggestions = mergeExisting ? [...(discovery.replacementSuggestions || [])] : [];
    discovery.selectedCandidate = candidates[0] || null;
    const requestId = ++replacementSuggestionRequestId;
    if (candidates.length === 0) {
        const mergedExistingSuggestions = handlers_dedupeReplacementSuggestions([...existingSuggestions, ...seedSuggestions]);
        discovery.replacementSuggestions = mergedExistingSuggestions;
        renderReplacementSuggestions(mergedExistingSuggestions);
        return;
    }
    const loadedSuggestions = [];
    const renderMergedSuggestions = (isFinalRender = false) => {
        if (!isActiveReplacementSuggestionRequest(requestId, inputValue)) {
            return;
        }
        const mergedSuggestions = mergeRefreshReplacementSuggestions({
            existingSuggestions,
            seedSuggestions,
            candidates,
            loadedSuggestions,
            mergeExisting,
        });
        discovery.replacementSuggestions = mergedSuggestions;
        renderReplacementSuggestions(mergedSuggestions, isFinalRender && !mergedSuggestions.length ? "No replacement suggestions found for this original text." : "");
    };
    renderMergedSuggestions();
    await loadReplacementSuggestionBatches(candidates, async (candidate) => {
        if (!hasPreferenceIdentifiers(candidate)) {
            return [];
        }
        try {
            return await loadReplacementSuggestions(candidate, forceRefreshSuggestions);
        }
        catch (error) {
            (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, "WTR Term Replacer: Replacement suggestions unavailable", error);
            return [];
        }
    }, (_candidate, suggestions) => {
        loadedSuggestions.push(...suggestions);
        renderMergedSuggestions();
    });
    renderMergedSuggestions(true);
}
function clearDiscoveryFormState() {
    if (replacementSuggestionTimeout) {
        clearTimeout(replacementSuggestionTimeout);
        replacementSuggestionTimeout = null;
    }
    const discovery = ensureDiscoveryState();
    discovery.replacementSuggestions = [];
    discovery.selectedCandidate = null;
    replacementSuggestionRequestId++;
    const suggestionsContainer = document.getElementById("wtr-replacement-suggestions");
    if (suggestionsContainer) {
        suggestionsContainer.textContent = "";
    }
}
function handleReplacementSuggestionInput(event) {
    if (event?.wtrSkipSuggestions) {
        return;
    }
    if (suppressNextReplacementSuggestionInput) {
        suppressNextReplacementSuggestionInput = false;
        return;
    }
    if (replacementSuggestionTimeout) {
        clearTimeout(replacementSuggestionTimeout);
    }
    const mergeExisting = Boolean(event?.mergeExisting);
    replacementSuggestionTimeout = setTimeout(async () => {
        const sourceValue = event?.target?.value;
        const options = getOriginalInputOptions();
        const query = typeof sourceValue === "string" ? sourceValue.trim() : options.value;
        const discovery = ensureDiscoveryState();
        const fieldSuggestions = getOriginalInputFieldSuggestions(query, options.isRegex);
        if (!query) {
            updateReplacementSuggestionsForCandidates([], query, mergeExisting, false, fieldSuggestions);
            return;
        }
        if (discovery.novelTerms.length === 0) {
            try {
                discovery.novelTerms = await loadNovelTermEntries(false);
            }
            catch (error) {
                (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, "WTR Term Replacer: Replacement suggestions unavailable", error);
            }
        }
        updateReplacementSuggestionsForCandidates(findNovelCandidatesByOriginalInput(query, options.isRegex, options.caseSensitive), query, mergeExisting, false, fieldSuggestions);
    }, 250);
}
async function handleRefreshSuggestionsClick() {
    if (replacementSuggestionTimeout) {
        clearTimeout(replacementSuggestionTimeout);
        replacementSuggestionTimeout = null;
    }
    const options = getOriginalInputOptions();
    if (!options.value) {
        renderReplacementSuggestions([], "Enter Original Text first, then refresh suggestions.");
        return;
    }
    renderReplacementSuggestions([], "Refreshing suggestions...");
    try {
        const discovery = ensureDiscoveryState();
        discovery.novelTerms = await loadNovelTermEntries(true);
        await updateReplacementSuggestionsForCandidates(findNovelCandidatesByOriginalInput(options.value, options.isRegex, options.caseSensitive), options.value, false, true, getOriginalInputFieldSuggestions(options.value, options.isRegex));
    }
    catch (error) {
        (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, "WTR Term Replacer: Replacement suggestion refresh failed", error);
        renderReplacementSuggestions([], "Suggestions are unavailable right now.");
    }
}
function handleSuggestionTargetFocus(event) {
    const fieldId = event?.target?.id;
    if (fieldId === "wtr-original") {
        activeSuggestionTarget = "original";
    }
    else if (fieldId === "wtr-replacement") {
        activeSuggestionTarget = "replacement";
    }
}
function getExistingSuggestionTokens(value) {
    return new Set(value
        .split(/\s*(?:\||\/|,|;|\n)\s*/)
        .map((token) => token.replace(/\s+/g, " ").trim().toLocaleLowerCase())
        .filter(Boolean));
}
function getReplacementAppendSeparator(value, isRegex) {
    if (value.includes("\n")) {
        return "\n";
    }
    if (value.includes(" | ")) {
        return " | ";
    }
    if (value.includes("|")) {
        return "|";
    }
    if (value.includes(" / ") || value.includes("/")) {
        return " / ";
    }
    if (value.includes(";")) {
        return "; ";
    }
    if (value.includes(",")) {
        return ", ";
    }
    return "|";
}
function normalizeOriginalRegexPattern(value) {
    const deduped = new Map();
    value
        .trim()
        .replace(/\s*\|\s*/g, "|")
        .replace(/\s*\/\s*/g, "|")
        .split("|")
        .map((part) => part.trim())
        .filter(Boolean)
        .forEach((part) => deduped.set(part, part));
    return Array.from(deduped.values())
        .sort((a, b) => b.length - a.length || a.localeCompare(b))
        .join("|");
}
function normalizeOriginalRegexField() {
    const regexCheckbox = document.getElementById("wtr-is-regex");
    const originalInput = document.getElementById("wtr-original");
    if (!regexCheckbox?.checked || !originalInput) {
        return;
    }
    const normalized = normalizeOriginalRegexPattern(originalInput.value);
    if (normalized && normalized !== originalInput.value) {
        originalInput.value = normalized;
        suppressNextReplacementSuggestionInput = true;
        originalInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
}
function getSuggestionAppendSeparator(value, isRegex, targetField) {
    if (targetField === "original") {
        return "|";
    }
    return getReplacementAppendSeparator(value, isRegex);
}
function mergeSuggestionInputValue(currentValue, suggestion, isRegex, selectionStart, selectionEnd, targetField) {
    const replacement = suggestion.trim();
    if (!replacement) {
        return currentValue;
    }
    if (selectionStart !== null && selectionEnd !== null && selectionEnd > selectionStart) {
        return `${currentValue.slice(0, selectionStart)}${replacement}${currentValue.slice(selectionEnd)}`;
    }
    const trimmedValue = currentValue.trim();
    if (!trimmedValue) {
        return replacement;
    }
    if (getExistingSuggestionTokens(trimmedValue).has(replacement.replace(/\s+/g, " ").trim().toLocaleLowerCase())) {
        return currentValue;
    }
    return `${currentValue.trimEnd()}${getSuggestionAppendSeparator(trimmedValue, isRegex, targetField)}${replacement}`;
}
function normalizePopoverText(value) {
    return (value || "").replace(/\s+/g, " ").trim();
}
function getElementClassText(element) {
    if (!element) {
        return "";
    }
    return typeof element.className === "string" ? element.className : element.getAttribute("class") || "";
}
function getPopoverBadgeCount(badge) {
    const countText = normalizePopoverText(badge.closest(".user-term")?.querySelector(".badge-segment span:last-child")?.textContent);
    if (!countText) {
        return 0;
    }
    if (countText.endsWith("+")) {
        return Number.parseInt(countText, 10) || 0;
    }
    return Number(countText) || 0;
}
function getPopoverBadgeSuggestion(badge) {
    const label = badge.querySelector("span:last-child") || badge;
    const replacement = normalizePopoverText(label.textContent);
    if (!replacement) {
        return null;
    }
    const userTerm = badge.closest(".user-term");
    const iconHref = badge.querySelector("use")?.getAttribute("href") || "";
    const classSource = `${getElementClassText(badge)} ${getElementClassText(userTerm)} ${iconHref}`;
    if (/google|g_translate|bg-primary/i.test(classSource)) {
        return handlers_normalizeReplacementSuggestion(replacement, getPopoverBadgeCount(badge), "Google", 90);
    }
    if (/dictionary|bg-success/i.test(classSource)) {
        return handlers_normalizeReplacementSuggestion(replacement, getPopoverBadgeCount(badge), "WTR", 30);
    }
    if (userTerm) {
        return handlers_normalizeReplacementSuggestion(replacement, getPopoverBadgeCount(badge), "WTR", 40);
    }
    return handlers_normalizeReplacementSuggestion(replacement, getPopoverBadgeCount(badge), "WTR", 50);
}
function getNewPopoverSuggestion(candidate) {
    const spans = Array.from(candidate.querySelectorAll("span"));
    const labelSpan = spans
        .slice()
        .reverse()
        .find((span) => {
        const text = normalizePopoverText(span.textContent);
        return text && !/^\d+\+?$/.test(text) && text !== "From" && text !== "To";
    });
    const replacement = normalizePopoverText(labelSpan?.textContent || candidate.textContent);
    if (!replacement || replacement === "From" || replacement === "To") {
        return null;
    }
    const countText = spans.map((span) => normalizePopoverText(span.textContent)).find((text) => /^\d+\+?$/.test(text)) || "";
    const count = countText ? Number.parseInt(countText, 10) || 0 : 0;
    const iconHref = candidate.querySelector("use")?.getAttribute("href") || "";
    const classSource = `${getElementClassText(candidate)} ${iconHref}`;
    if (/g_translate|bg-google|google/i.test(classSource)) {
        return handlers_normalizeReplacementSuggestion(replacement, count, "Google", 90);
    }
    if (/dictionary|profile|green|success/i.test(classSource)) {
        return handlers_normalizeReplacementSuggestion(replacement, count, "WTR", 30);
    }
    return handlers_normalizeReplacementSuggestion(replacement, count, "WTR", 50);
}
function getNewWtrPopoverRoot(element) {
    const candidate = element.matches('[data-slot="popover-content"], [role="dialog"]')
        ? element
        : element.querySelector('[data-slot="popover-content"], [role="dialog"]') ||
            element.closest('[data-slot="popover-content"], [role="dialog"]');
    if (!candidate) {
        return null;
    }
    const text = normalizePopoverText(candidate.textContent);
    const iconHrefs = Array.from(candidate.querySelectorAll("use")).map((use) => use.getAttribute("href") || use.getAttribute("xlink:href") || "");
    const hasTermChoices = iconHrefs.some((href) => /#(?:dictionary|g_translate|profile)/.test(href));
    return text.includes("From") && text.includes("To") && hasTermChoices ? candidate : null;
}
function getNewPopoverSuggestionElements(popoverRoot) {
    const byIcon = Array.from(popoverRoot.querySelectorAll("use"))
        .filter((use) => /#(?:dictionary|g_translate|profile)/.test(use.getAttribute("href") || use.getAttribute("xlink:href") || ""))
        .map((use) => use.closest('div[class*="inline-flex"][class*="cursor-pointer"]'))
        .filter((candidate) => Boolean(candidate));
    const byClass = Array.from(popoverRoot.querySelectorAll('div.inline-flex.cursor-pointer, div[class*="cursor-pointer"][class*="rounded"][class*="text-xs"]'));
    return [...byIcon, ...byClass].filter((candidate, index, list) => !candidate.closest(".wtr-replacer-popover-actions") &&
        !candidate.closest("button") &&
        list.indexOf(candidate) === index);
}
function getNewWtrPopoverContextFromElement(element) {
    const popoverRoot = getNewWtrPopoverRoot(element);
    if (!popoverRoot) {
        return null;
    }
    const sourceTerm = normalizePopoverText(popoverRoot.querySelector(".text-muted-foreground")?.textContent);
    const suggestionElements = getNewPopoverSuggestionElements(popoverRoot);
    const popoverSuggestions = suggestionElements
        .map(getNewPopoverSuggestion)
        .filter((suggestion) => Boolean(suggestion));
    const recentContext = state/* state */.wk.wtrPopoverTermContext || {};
    const recentSuggestions = Array.isArray(recentContext.suggestions) ? recentContext.suggestions : [];
    const original = normalizePopoverText(recentContext.original) || popoverSuggestions[0]?.replacement || sourceTerm;
    const resolvedSourceTerm = sourceTerm || normalizePopoverText(recentContext.sourceTerm);
    const sourceSuggestion = handlers_normalizeReplacementSuggestion(resolvedSourceTerm, 0, "Source", -10);
    const currentSuggestion = handlers_normalizeReplacementSuggestion(original, 0, "Current", 0);
    const resolvedSuggestions = handlers_dedupeReplacementSuggestions([
        ...(sourceSuggestion ? [sourceSuggestion] : []),
        ...(currentSuggestion ? [currentSuggestion] : []),
        ...popoverSuggestions,
        ...recentSuggestions,
    ]);
    if (!original && !resolvedSourceTerm && resolvedSuggestions.length === 0) {
        return null;
    }
    return {
        original,
        sourceTerm: resolvedSourceTerm,
        suggestions: resolvedSuggestions,
    };
}
function getWtrPopoverContextFromElement(element) {
    const sourceTerm = normalizePopoverText(element.querySelector(".text-underscore")?.textContent);
    const popoverSuggestions = Array.from(element.querySelectorAll(".user-term .badge, .badge.bg-success, .badge.bg-primary"))
        .map(getPopoverBadgeSuggestion)
        .filter((suggestion) => Boolean(suggestion));
    if (!sourceTerm && popoverSuggestions.length === 0) {
        return getNewWtrPopoverContextFromElement(element);
    }
    const recentContext = state/* state */.wk.wtrPopoverTermContext || {};
    const recentSuggestions = Array.isArray(recentContext.suggestions) ? recentContext.suggestions : [];
    const original = normalizePopoverText(recentContext.original) || popoverSuggestions[0]?.replacement || sourceTerm;
    const resolvedSourceTerm = sourceTerm || normalizePopoverText(recentContext.sourceTerm);
    const sourceSuggestion = handlers_normalizeReplacementSuggestion(resolvedSourceTerm, 0, "Source", -10);
    const currentSuggestion = handlers_normalizeReplacementSuggestion(original, 0, "Current", 0);
    const resolvedSuggestions = handlers_dedupeReplacementSuggestions([
        ...(sourceSuggestion ? [sourceSuggestion] : []),
        ...(currentSuggestion ? [currentSuggestion] : []),
        ...popoverSuggestions,
        ...recentSuggestions,
    ]);
    if (!original && !resolvedSourceTerm && resolvedSuggestions.length === 0) {
        return null;
    }
    return {
        original,
        sourceTerm: resolvedSourceTerm,
        suggestions: resolvedSuggestions,
    };
}
function mergePopoverContexts(primary, secondary) {
    if (!primary) {
        return secondary;
    }
    if (!secondary) {
        return primary;
    }
    return {
        original: normalizePopoverText(primary.original) || normalizePopoverText(secondary.original),
        sourceTerm: normalizePopoverText(primary.sourceTerm) || normalizePopoverText(secondary.sourceTerm),
        suggestions: handlers_dedupeReplacementSuggestions([...(primary.suggestions || []), ...(secondary.suggestions || [])]),
    };
}
function encodePopoverContext(context) {
    return JSON.stringify(context);
}
function decodePopoverContext(value) {
    if (!value) {
        return null;
    }
    try {
        return JSON.parse(value);
    }
    catch (_error) {
        return null;
    }
}
function dispatchUiOnlyInput(element) {
    if (!element) {
        return;
    }
    const event = new Event("input", { bubbles: true });
    event.wtrSkipSuggestions = true;
    element.dispatchEvent(event);
}
function openWtrPopoverTermContext(context) {
    (0,ui/* showUIPanel */.E1)();
    suppressNextReplacementSuggestionInput = true;
    (0,ui/* showFormView */.BD)();
    if (replacementSuggestionTimeout) {
        clearTimeout(replacementSuggestionTimeout);
        replacementSuggestionTimeout = null;
    }
    const originalInput = document.getElementById("wtr-original");
    const replacementInput = document.getElementById("wtr-replacement");
    if (!originalInput || !replacementInput) {
        return;
    }
    originalInput.value = context.original || context.suggestions[0]?.replacement || context.sourceTerm || "";
    originalInput.rows = Math.max(1, Math.ceil(originalInput.value.length / 40));
    replacementInput.value = "";
    dispatchUiOnlyInput(originalInput);
    dispatchUiOnlyInput(replacementInput);
    if (replacementSuggestionTimeout) {
        clearTimeout(replacementSuggestionTimeout);
        replacementSuggestionTimeout = null;
    }
    suppressNextReplacementSuggestionInput = false;
    ensureDiscoveryState().replacementSuggestions = handlers_dedupeReplacementSuggestions(context.suggestions);
    renderReplacementSuggestions(ensureDiscoveryState().replacementSuggestions);
    activeSuggestionTarget = "replacement";
    replacementInput.focus();
}
function handleWtrTextPatchClick(event) {
    const patch = event.target?.closest?.(".text-patch[data-hash]");
    if (!patch) {
        return;
    }
    const visibleText = normalizePopoverText(patch.textContent);
    const sourceTerm = normalizePopoverText(patch.getAttribute("data-hash"));
    const sourceSuggestion = handlers_normalizeReplacementSuggestion(sourceTerm, 0, "Source", -10);
    const currentSuggestion = handlers_normalizeReplacementSuggestion(visibleText, 0, "Current", 0);
    state/* state */.wk.wtrPopoverTermContext = {
        original: visibleText,
        sourceTerm,
        suggestions: [sourceSuggestion, currentSuggestion].filter((suggestion) => Boolean(suggestion)),
    };
}
function enhanceWtrTermPopovers(root = document) {
    const editors = [
        ...(root instanceof Element && root.matches(".mini-term-editor") ? [root] : []),
        ...Array.from(root.querySelectorAll(".mini-term-editor")),
    ];
    editors.forEach((editor) => {
        if (editor.querySelector(".wtr-replacer-popover-actions")) {
            return;
        }
        const popoverRoot = editor.closest(".popover-body") || editor;
        const context = getWtrPopoverContextFromElement(popoverRoot);
        if (!context) {
            return;
        }
        const encodedContext = encodePopoverContext(context);
        const actionColumn = editor.querySelector(".d-flex.flex-column.ms-2") || editor;
        const buttonGroup = document.createElement("div");
        buttonGroup.className = "wtr-replacer-popover-actions";
        const openButton = document.createElement("button");
        openButton.type = "button";
        openButton.className = "mt-1 btn btn-outline-primary btn-sm wtr-replacer-popover-add-btn";
        openButton.textContent = "+ Replacer Term";
        openButton.dataset.wtrContext = encodedContext;
        buttonGroup.appendChild(openButton);
        actionColumn.appendChild(buttonGroup);
    });
    const newPopoverRoots = [
        ...(root instanceof Element && getNewWtrPopoverRoot(root) ? [getNewWtrPopoverRoot(root)] : []),
        ...Array.from(root.querySelectorAll('[data-slot="popover-content"], [role="dialog"]')).map(getNewWtrPopoverRoot),
    ].filter((popoverRoot, index, list) => Boolean(popoverRoot) && list.indexOf(popoverRoot) === index);
    newPopoverRoots.forEach((popoverRoot) => {
        const context = getNewWtrPopoverContextFromElement(popoverRoot);
        if (!context) {
            return;
        }
        const existingButton = popoverRoot.querySelector(".wtr-replacer-popover-add-btn");
        if (existingButton) {
            const mergedContext = mergePopoverContexts(decodePopoverContext(existingButton.dataset.wtrContext), context);
            if (mergedContext) {
                existingButton.dataset.wtrContext = encodePopoverContext(mergedContext);
            }
            return;
        }
        const actionColumn = Array.from(popoverRoot.querySelectorAll("button")).find((button) => normalizePopoverText(button.textContent) === "Term")?.parentElement || popoverRoot.querySelector(".flex.flex-col.ms-2") || popoverRoot;
        const sourceButton = Array.from(actionColumn.querySelectorAll("button")).find((button) => normalizePopoverText(button.textContent) === "Term");
        const openButton = document.createElement("button");
        openButton.type = "button";
        const sourceClassName = sourceButton?.className?.replace(/\bmt-auto\b/g, "").replace(/\s+/g, " ").trim();
        openButton.className = sourceClassName
            ? `${sourceClassName} wtr-replacer-popover-add-btn`
            : "btn btn-outline-primary btn-sm wtr-replacer-popover-add-btn";
        openButton.style.marginTop = "0.25rem";
        openButton.textContent = "+ Replacer";
        openButton.dataset.wtrContext = encodePopoverContext(context);
        if (actionColumn instanceof HTMLElement) {
            actionColumn.style.gap = "0.25rem";
        }
        actionColumn.appendChild(openButton);
    });
}
function getNormalizedTermValue(value) {
    return normalizePopoverText(value).toLocaleLowerCase();
}
function getContextLookupValues(context) {
    const values = new Map();
    const addValue = (value) => {
        const normalized = normalizePopoverText(value);
        if (normalized) {
            values.set(normalized.toLocaleLowerCase(), normalized);
        }
    };
    addValue(context.original);
    addValue(context.sourceTerm);
    context.suggestions.forEach((suggestion) => addValue(suggestion.replacement));
    return Array.from(values.values());
}
function termMatchesLookupValue(term, lookupValues) {
    const normalizedLookupValues = lookupValues.map(getNormalizedTermValue).filter(Boolean);
    const directValues = [term.original, term.replacement, ...Array.from(getExistingSuggestionTokens(term.original || ""))];
    if (directValues.some((value) => normalizedLookupValues.includes(getNormalizedTermValue(value)))) {
        return true;
    }
    if (term.isRegex && term.original) {
        try {
            const regex = new RegExp(term.original, term.caseSensitive ? "" : "i");
            return lookupValues.some((value) => regex.test(value));
        }
        catch (_error) {
            return false;
        }
    }
    return false;
}
function findExistingTermsForContext(context) {
    const lookupValues = getContextLookupValues(context);
    if (lookupValues.length === 0) {
        return [];
    }
    return state/* state */.wk.terms.filter((term) => termMatchesLookupValue(term, lookupValues));
}
function removeExistingTermModal() {
    document.querySelector(".wtr-existing-term-modal")?.remove();
}
function showExistingTermModal(context, existingTerms) {
    removeExistingTermModal();
    (0,ui/* showUIPanel */.E1)();
    const overlay = document.createElement("div");
    overlay.className = "wtr-existing-term-modal";
    const card = document.createElement("div");
    card.className = "wtr-existing-term-card";
    overlay.appendChild(card);
    const header = document.createElement("div");
    header.className = "wtr-existing-term-header";
    header.textContent = "Existing Term Found";
    card.appendChild(header);
    const body = document.createElement("div");
    body.className = "wtr-existing-term-body";
    const message = document.createElement("p");
    message.textContent = "This WTR term already appears in your Term Replacer storage. Open the saved term instead of creating a duplicate.";
    body.appendChild(message);
    const list = document.createElement("div");
    list.className = "wtr-existing-term-list";
    existingTerms.slice(0, 5).forEach((term) => {
        const openButton = document.createElement("button");
        openButton.type = "button";
        openButton.className = "wtr-existing-term-open-btn";
        openButton.textContent = `${term.original} → ${term.replacement}`;
        openButton.addEventListener("click", () => {
            removeExistingTermModal();
            (0,ui/* showUIPanel */.E1)();
            (0,ui/* showFormView */.BD)(term);
        });
        list.appendChild(openButton);
    });
    body.appendChild(list);
    card.appendChild(body);
    const actions = document.createElement("div");
    actions.className = "wtr-existing-term-actions";
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "btn btn-secondary btn-sm";
    closeButton.textContent = "Close";
    closeButton.addEventListener("click", removeExistingTermModal);
    const addAnywayButton = document.createElement("button");
    addAnywayButton.type = "button";
    addAnywayButton.className = "btn btn-primary btn-sm";
    addAnywayButton.textContent = "Add Anyway";
    addAnywayButton.addEventListener("click", () => {
        removeExistingTermModal();
        openWtrPopoverTermContext(context);
    });
    actions.appendChild(closeButton);
    actions.appendChild(addAnywayButton);
    card.appendChild(actions);
    overlay.addEventListener("click", (modalEvent) => {
        if (modalEvent.target === overlay) {
            removeExistingTermModal();
        }
    });
    document.body.appendChild(overlay);
}
function handleWtrPopoverAddTermClick(event) {
    const button = event.target?.closest?.(".wtr-replacer-popover-add-btn");
    if (!button) {
        return;
    }
    event.preventDefault();
    event.stopPropagation();
    const popoverRoot = button.closest('[data-slot="popover-content"], [role="dialog"], .popover-body') || button.closest(".popover-body") || button;
    const context = mergePopoverContexts(decodePopoverContext(button.dataset.wtrContext), getWtrPopoverContextFromElement(popoverRoot));
    if (!context) {
        return;
    }
    button.dataset.wtrContext = encodePopoverContext(context);
    const existingTerms = findExistingTermsForContext(context);
    if (existingTerms.length > 0) {
        showExistingTermModal(context, existingTerms);
        return;
    }
    openWtrPopoverTermContext(context);
}
function handleReplacementSuggestionClick(event) {
    const button = event.target.closest(".wtr-replacement-suggestion-btn");
    if (!button) {
        return;
    }
    const originalInput = document.getElementById("wtr-original");
    const replacementInput = document.getElementById("wtr-replacement");
    const regexCheckbox = document.getElementById("wtr-is-regex");
    const targetField = activeSuggestionTarget;
    const targetInput = targetField === "original" ? originalInput : replacementInput;
    if (targetInput) {
        targetInput.value = mergeSuggestionInputValue(targetInput.value, button.dataset.replacement || "", Boolean(regexCheckbox?.checked), targetInput.selectionStart, targetInput.selectionEnd, targetField);
        if (targetField === "original") {
            suppressNextReplacementSuggestionInput = true;
        }
        targetInput.dispatchEvent(new Event("input", { bubbles: true }));
        targetInput.focus();
    }
}
async function handleSaveTerm() {
    (0,utils/* log */.Rm)(state/* state */.wk.globalSettings, "WTR Term Replacer: Handle save term started");
    const id = document.getElementById("wtr-term-id").value;
    const originalInput = document.getElementById("wtr-original");
    const replacementInput = document.getElementById("wtr-replacement");
    const isRegex = document.getElementById("wtr-is-regex").checked;
    let original = originalInput.value.trim();
    if (isRegex) {
        original = normalizeOriginalRegexPattern(original);
        originalInput.value = original;
    }
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
    originalInput.dispatchEvent(new Event("input", { bubbles: true }));
    replacementInput.dispatchEvent(new Event("input", { bubbles: true }));
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
function getSelectionAnchorElement(selection) {
    const anchorNode = selection?.anchorNode || null;
    if (!anchorNode) {
        return null;
    }
    return anchorNode.nodeType === Node.ELEMENT_NODE ? anchorNode : anchorNode.parentElement;
}
function handleTextSelection(e) {
    const CHAPTER_BODY_SELECTOR = ".chapter-body";
    const selection = window.getSelection();
    const eventTarget = e.target instanceof Element ? e.target : null;
    const anchorElement = getSelectionAnchorElement(selection);
    const isChapterSelection = Boolean(eventTarget?.closest(CHAPTER_BODY_SELECTOR) || anchorElement?.closest(CHAPTER_BODY_SELECTOR));
    const floatBtn = document.querySelector(".wtr-add-term-float-btn");
    if (!floatBtn) {
        return;
    }
    if (!isChapterSelection) {
        floatBtn.style.display = "none";
        return;
    }
    const selectedText = selection?.toString().trim() || "";
    if (selectedText && selectedText.length > 0 && selectedText.length < 100) {
        (0,ui/* syncFloatingAddTermButtonPosition */.SJ)();
        floatBtn.style.display = "flex";
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
        const originalInput = document.getElementById("wtr-original");
        if (originalInput) {
            originalInput.value = selection;
            originalInput.dispatchEvent(new Event("input", { bubbles: true }));
        }
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
    const chapterBody = (0,utils/* findChapterBodyForUrl */.dF)(document);
    if (chapterBody) {
        if (state/* state */.wk.settings.isDisabled) {
            await (0,engine.revertAllReplacements)(chapterBody);
        }
        else {
            await (0,engine.performReplacements)(chapterBody);
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
/* unused harmony import specifier */ var CHAPTER_BODY_SELECTOR;
/* unused harmony import specifier */ var findChapterContainerForUrl;
/* unused harmony import specifier */ var findChapterBodyForUrl;
/* unused harmony import specifier */ var log;
/* harmony import */ var _state__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(654);
/* harmony import */ var _engine__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(9);
/* harmony import */ var _ui__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(141);
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(333);
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(158);
// MutationObserver and content handling for WTR Lab Term Replacer





function waitForInitialContent() {
    (0,_utils__WEBPACK_IMPORTED_MODULE_4__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, "WTR Term Replacer: Starting robust content detection for slow-loading websites...");
    // Set up mutation observer for dynamic content loading
    (0,_utils__WEBPACK_IMPORTED_MODULE_4__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, "WTR Term Replacer: Setting up content change observer");
    setupContentObserver();
    // Set up additional fallback mechanisms
    (0,_utils__WEBPACK_IMPORTED_MODULE_4__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, "WTR Term Replacer: Setting up fallback detection mechanisms");
    setupFallbackDetection();
}
function _detectContentWithMultipleStrategies() {
    const detectionStrategies = [
        // Strategy 1: Standard chapter ID/tracker detection
        () => {
            const contentContainer = findChapterContainerForUrl(document);
            return contentContainer ? { container: contentContainer, strategy: "chapter-container" } : null;
        },
        // Strategy 2: Look for chapter body directly
        () => {
            const chapterBody = findChapterBodyForUrl(document);
            return chapterBody
                ? {
                    container: chapterBody.closest(".chapter-container, .chapter-tracker, [id*=\"chapter\"]") || chapterBody,
                    strategy: "chapter-body",
                }
                : null;
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
    const hasChapterContent = container.querySelector(`${CHAPTER_BODY_SELECTOR}, .wtr-line, [data-line]`) ||
        container.querySelector("p, h1, h2, h3, h4, h5, h6");
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
                        const element = node;
                        const textContent = element.textContent?.trim() || "";
                        const className = typeof element.className === "string" ? element.className : element.getAttribute("class") || "";
                        // Detect multi-script data attributes being added
                        if (element.hasAttribute?.("data-smart-quotes-processed")) {
                            detectedScriptChanges.push("Smart Quotes");
                            shouldCheckForContent = true;
                        }
                        if (element.hasAttribute?.("data-uncensor-processed")) {
                            detectedScriptChanges.push("Uncensor");
                            shouldCheckForContent = true;
                        }
                        if (element.hasAttribute?.("data-auto-scroll") || element.hasAttribute?.("data-reader-enhanced")) {
                            detectedScriptChanges.push("Reader Enhancer");
                            shouldCheckForContent = true;
                        }
                        // More strict content validation to reduce false positives while supporting the new tracker DOM.
                        if (textContent.length > 100 &&
                            !textContent.includes("loading") &&
                            !textContent.includes("...") &&
                            (element.id?.includes("chapter") ||
                                className.includes("chapter") ||
                                element.matches?.(`.chapter-tracker, .chapter-container, ${_config__WEBPACK_IMPORTED_MODULE_3__/* .CHAPTER_BODY_SELECTOR */ .tA}, .wtr-line, [data-line]`) ||
                                element.querySelector(`${_config__WEBPACK_IMPORTED_MODULE_3__/* .CHAPTER_BODY_SELECTOR */ .tA}, .chapter-tracker, .chapter-container, .wtr-line, [data-line]`))) {
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
                (0,_utils__WEBPACK_IMPORTED_MODULE_4__/* .log */ .Rm)(`WTR Term Replacer: Multi-script activity detected from: ${detectedScriptChanges.join(", ")} (conflict ${potentialMultiScriptConflicts})`);
                // Update our detected scripts
                detectedScriptChanges.forEach((script) => _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.otherWTRScripts.add(script));
            }
            else {
                (0,_utils__WEBPACK_IMPORTED_MODULE_4__/* .log */ .Rm)("WTR Term Replacer: Content changes detected, checking for chapter content...");
            }
            // Debounced check to avoid excessive processing with enhanced delay for multi-script
            const baseDelay = 1500;
            const multiScriptDelay = _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.otherWTRScripts.size > 0 ? 2500 : baseDelay;
            clearTimeout(observerTimeout);
            observerTimeout = setTimeout(() => {
                const queuedForProcessing = document.querySelector("[data-wtr-processed]") || _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.processingQueue.size > 0;
                if (!queuedForProcessing) {
                    (0,_utils__WEBPACK_IMPORTED_MODULE_4__/* .log */ .Rm)(`WTR Term Replacer: Initiating content processing (${_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.otherWTRScripts.size} other scripts active, ${multiScriptDelay}ms coordination delay)`);
                    processVisibleChapter();
                }
                else {
                    (0,_utils__WEBPACK_IMPORTED_MODULE_4__/* .log */ .Rm)(`WTR Term Replacer: Skipping content processing - already in progress or completed (queue: ${_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.processingQueue.size})`);
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
    (0,_utils__WEBPACK_IMPORTED_MODULE_4__/* .log */ .Rm)("WTR Term Replacer: Enhanced content observer activated with multi-script coordination");
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
        (0,_utils__WEBPACK_IMPORTED_MODULE_4__/* .log */ .Rm)(`WTR Term Replacer: Fallback attempt ${fallbackAttempts}/${maxFallbackAttempts}`);
        // Try processing if we have any chapter-like content
        const chapterBody = (0,_utils__WEBPACK_IMPORTED_MODULE_4__/* .findChapterBodyForUrl */ .dF)(document);
        if (chapterBody) {
            (0,_utils__WEBPACK_IMPORTED_MODULE_4__/* .log */ .Rm)("WTR Term Replacer: Fallback processing successful");
            processVisibleChapter();
            clearInterval(fallbackInterval);
            return;
        }
        // Check for any substantial content that might be chapter content
        const potentialContent = document.querySelector("main, article, .content, .chapter");
        if (potentialContent && potentialContent.textContent?.trim().length > 200) {
            (0,_utils__WEBPACK_IMPORTED_MODULE_4__/* .log */ .Rm)("WTR Term Replacer: Fallback processing with detected content");
            processVisibleChapter();
            clearInterval(fallbackInterval);
        }
        if (fallbackAttempts >= maxFallbackAttempts) {
            clearInterval(fallbackInterval);
            (0,_utils__WEBPACK_IMPORTED_MODULE_4__/* .log */ .Rm)("WTR Term Replacer: Fallback detection exhausted");
        }
    }, 3000); // Check every 3 seconds
    // Clear fallback interval after 5 minutes to prevent infinite polling
    setTimeout(() => {
        clearInterval(fallbackInterval);
    }, 300000);
}
function processVisibleChapter() {
    const chapterBody = (0,_utils__WEBPACK_IMPORTED_MODULE_4__/* .findChapterBodyForUrl */ .dF)(document);
    const chapterId = (0,_utils__WEBPACK_IMPORTED_MODULE_4__/* .getChapterProcessingId */ .aV)(window.location.href, chapterBody);
    if (!chapterId || !chapterBody) {
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
    const alreadyQueued = Array.from(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.processingQueue).some((key) => key === chapterId || key.startsWith(`${chapterId}_`));
    if (alreadyQueued) {
        (0,_utils__WEBPACK_IMPORTED_MODULE_4__/* .log */ .Rm)(`WTR Term Replacer: Chapter ${chapterId} already queued for processing ${_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.processingQueue.size} queued`);
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
            (0,_utils__WEBPACK_IMPORTED_MODULE_4__/* .log */ .Rm)(`WTR Term Replacer: Chapter ${chapterId} processing cancelled (no longer in queue)`);
            return;
        }
        // Re-acquire chapter body element dynamically to avoid stale references.
        const chapterBody = (0,_utils__WEBPACK_IMPORTED_MODULE_4__/* .findChapterBodyById */ .b4)(chapterId) || (0,_utils__WEBPACK_IMPORTED_MODULE_4__/* .findChapterBodyForUrl */ .dF)(document);
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
            (0,_utils__WEBPACK_IMPORTED_MODULE_4__/* .log */ .Rm)(`WTR Term Replacer: Successfully processed chapter ${chapterId} on attempt ${attemptIndex + 1}`);
        }
        else if (attemptIndex < retryAttempts.length - 1) {
            // Retry with next attempt
            (0,_utils__WEBPACK_IMPORTED_MODULE_4__/* .log */ .Rm)(`WTR Term Replacer: Chapter ${chapterId} content not ready (load level: ${contentLoadLevel.toFixed(2)}), retrying...`);
            executeProcessingWithRetry(chapterId, retryAttempts, attemptIndex + 1, processingKey);
        }
        else {
            // Final attempt with any available content
            (0,_utils__WEBPACK_IMPORTED_MODULE_4__/* .log */ .Rm)(`WTR Term Replacer: Final attempt for chapter ${chapterId} with available content`);
            await performRobustReplacements(chapterBody, chapterId, true); // force processing
            _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.processingQueue.delete(processingKey);
        }
    }
    catch (error) {
        (0,_utils__WEBPACK_IMPORTED_MODULE_4__/* .log */ .Rm)(`WTR Term Replacer: Error processing chapter ${chapterId} on attempt ${attemptIndex + 1}:`, error);
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
    (0,_utils__WEBPACK_IMPORTED_MODULE_4__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, "WTR Term Replacer: Scanning for other WTR Lab scripts...");
    // Detect other WTR Lab scripts by their data attributes or specific patterns
    const scripts = document.querySelectorAll("[data-smart-quotes-processed], [data-uncensor-processed], [data-auto-scroll], [data-reader-enhanced]");
    (0,_utils__WEBPACK_IMPORTED_MODULE_4__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, `WTR Term Replacer: Found ${scripts.length} elements with WTR script attributes`);
    scripts.forEach((el) => {
        if (el.hasAttribute("data-smart-quotes-processed")) {
            _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.otherWTRScripts.add("Smart Quotes");
            (0,_utils__WEBPACK_IMPORTED_MODULE_4__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, "WTR Term Replacer: Detected Smart Quotes script");
        }
        if (el.hasAttribute("data-uncensor-processed")) {
            _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.otherWTRScripts.add("Uncensor");
            (0,_utils__WEBPACK_IMPORTED_MODULE_4__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, "WTR Term Replacer: Detected Uncensor script");
        }
        if (el.hasAttribute("data-auto-scroll") || el.hasAttribute("data-reader-enhanced")) {
            _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.otherWTRScripts.add("Reader Enhancer");
            (0,_utils__WEBPACK_IMPORTED_MODULE_4__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, "WTR Term Replacer: Detected Reader Enhancer script");
        }
    });
    if (_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.otherWTRScripts.size > 0) {
        (0,_utils__WEBPACK_IMPORTED_MODULE_4__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, `WTR Term Replacer: Multi-script environment detected - Active scripts: ${Array.from(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.otherWTRScripts).join(", ")}`);
    }
    else {
        (0,_utils__WEBPACK_IMPORTED_MODULE_4__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, "WTR Term Replacer: No other WTR scripts detected, running in single-script mode");
    }
}
function startProcessingTimer(operation) {
    (0,_utils__WEBPACK_IMPORTED_MODULE_4__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, `WTR Term Replacer: Starting processing timer for ${operation}`);
    _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.processingStartTime.set(operation, Date.now());
}
function endProcessingTimer(operation, chapterId) {
    const startTime = _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.processingStartTime.get(operation);
    if (startTime) {
        const processingTime = Date.now() - startTime;
        const isMultiScript = _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.otherWTRScripts.size > 0;
        (0,_utils__WEBPACK_IMPORTED_MODULE_4__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, `WTR Term Replacer: Processing timer ended for ${operation}, took ${processingTime}ms`);
        logProcessingWithMultiScriptContext(chapterId, processingTime, isMultiScript);
        _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.processingStartTime.delete(operation);
        return processingTime;
    }
    (0,_utils__WEBPACK_IMPORTED_MODULE_4__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, `WTR Term Replacer: Warning - processing timer for ${operation} not found`);
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
        (0,_utils__WEBPACK_IMPORTED_MODULE_4__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, `WTR Term Replacer: Multi-script enhanced processing completed`, context);
    }
    else {
        (0,_utils__WEBPACK_IMPORTED_MODULE_4__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, `WTR Term Replacer: Standard processing completed`, context);
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
            (0,_utils__WEBPACK_IMPORTED_MODULE_4__/* .log */ .Rm)(`WTR Term Replacer: Multi-script processing starting for chapter ${chapterId} with active scripts: ${Array.from(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.otherWTRScripts).join(", ")}`);
        }
        else {
            (0,_utils__WEBPACK_IMPORTED_MODULE_4__/* .log */ .Rm)(`WTR Term Replacer: Processing chapter ${chapterId} with robust method`);
        }
        await (0,_engine__WEBPACK_IMPORTED_MODULE_1__.performReplacements)(chapterBody);
        chapterBody.dataset.wtrProcessed = "true";
        (0,_ui__WEBPACK_IMPORTED_MODULE_2__/* .addMenuButton */ .L_)();
        const processingTime = endProcessingTimer(`chapter_${chapterId}`, chapterId);
        if (isMultiScript) {
            (0,_utils__WEBPACK_IMPORTED_MODULE_4__/* .log */ .Rm)(`WTR Term Replacer: Successfully completed multi-script processing for chapter ${chapterId} in ${processingTime}ms`);
        }
    }
    catch (error) {
        const processingTime = endProcessingTimer(`chapter_${chapterId}`, chapterId) || 0;
        (0,_utils__WEBPACK_IMPORTED_MODULE_4__/* .log */ .Rm)(`WTR Term Replacer: Robust processing failed for chapter ${chapterId} after ${processingTime}ms:`, error);
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
    const chapterBody = (0,_utils__WEBPACK_IMPORTED_MODULE_4__/* .findChapterBodyForUrl */ .dF)(document);
    const chapterId = (0,_utils__WEBPACK_IMPORTED_MODULE_4__/* .getChapterProcessingId */ .aV)(window.location.href, chapterBody);
    if (!chapterId || !chapterBody) {
        return;
    }
    // Reset processing state to allow reprocessing
    chapterBody.dataset.wtrProcessed = "false";
    // Clear any existing processing entries for this chapter
    const existingKeys = Array.from(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.processingQueue).filter((key) => key.startsWith(chapterId));
    existingKeys.forEach((key) => _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.processingQueue.delete(key));
    // Use robust reprocessing with retry mechanism
    scheduleChapterProcessing(chapterId, chapterBody);
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
        novelTerms: [],
        replacementSuggestions: [],
        selectedCandidate: null,
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
/* harmony export */   SJ: () => (/* binding */ syncFloatingAddTermButtonPosition),
/* harmony export */   W4: () => (/* binding */ hideUILoader),
/* harmony export */   X: () => (/* binding */ hideUIPanel),
/* harmony export */   Xt: () => (/* binding */ showUILoader),
/* harmony export */   gn: () => (/* binding */ showProcessingIndicator),
/* harmony export */   kH: () => (/* binding */ clearTermList)
/* harmony export */ });
/* unused harmony export syncUITheme */
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
                <label class="wtr-switch-label wtr-switch-compact"><input type="checkbox" id="wtr-disable-all"><span class="wtr-switch-track"><span></span></span><span>Disable All</span></label>
            </div>
            <button class="wtr-replacer-close-btn">&times;</button>
        </div>
    </div>
    <div class="wtr-replacer-tabs">
        <button class="wtr-replacer-tab-btn active" data-tab="terms">Terms List</button>
        <button class="wtr-replacer-tab-btn" data-tab="add">Add/Edit Term</button>
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
                <div class="wtr-field-label-row">
                    <label for="wtr-original">Original Text <span id="wtr-original-counter" class="wtr-character-counter">0/512</span></label>
                    <div class="wtr-field-helper-actions">
                        <button type="button" id="wtr-variation-btn" class="wtr-inline-helper-btn" title="Turn separated text into regex variations"><svg class="icon inline-flex shrink-0 size-4"><use href="#add"></use></svg><span>Variation</span></button>
                        <button type="button" id="wtr-wildchar-btn" class="wtr-inline-helper-btn" title="Insert a regex wildcard or make selected spaces flexible"><svg class="icon inline-flex shrink-0 size-4"><use href="#add"></use></svg><span>Wild Char</span></button>
                    </div>
                </div>
                <textarea id="wtr-original" rows="1" data-soft-max="512"></textarea>
                <small id="wtr-regex-disabled-warning" class="wtr-regex-disabled-warning" style="display:none;">This looks like regex syntax, but Use Regex is off. It will be saved as plain text unless you enable Use Regex.</small>
                <div class="wtr-original-helper-row">
                    <small class="wtr-field-hint">Example: from_1|from_2|from_3...</small>
                    <button type="button" id="wtr-refresh-suggestions-btn" class="wtr-inline-helper-btn">Refresh Suggestions</button>
                </div>
            </div>
            <div class="wtr-replacer-form-group">
                <div class="wtr-field-label-row">
                    <label for="wtr-replacement">Replacement Text <span id="wtr-replacement-counter" class="wtr-character-counter">0/512</span></label>
                </div>
                <input type="text" id="wtr-replacement" data-soft-max="512">
                <div id="wtr-replacement-suggestions" class="wtr-replacement-suggestions" aria-live="polite"></div>
            </div>
            <div class="wtr-replacer-form-group wtr-switch-group">
                <label class="wtr-switch-label"><input type="checkbox" id="wtr-case-sensitive"><span class="wtr-switch-track"><span></span></span><span>Case Sensitive</span></label>
                <label class="wtr-switch-label"><input type="checkbox" id="wtr-is-regex"><span class="wtr-switch-track"><span></span></span><span>Use Regex</span></label>
                <label class="wtr-switch-label"><input type="checkbox" id="wtr-whole-word" disabled><span class="wtr-switch-track"><span></span></span><span>Whole Word Only</span></label>
            </div>
            <small class="wtr-novel-only-note">This term applies to this novel only.</small>
            <button id="wtr-save-btn" class="btn btn-primary">Save Term</button>
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
        background-color: var(--bs-body-bg, #ffffff); color: var(--bs-body-color, #111827);
        border: 1px solid var(--bs-border-color, rgba(17, 24, 39, 0.15)); border-radius: var(--bs-border-radius-lg, 0.75rem);
        box-shadow: var(--bs-box-shadow-lg, 0 24px 70px rgba(15, 23, 42, 0.24)); z-index: 99999;
        display: none; flex-direction: column; font-family: var(--bs-body-font-family, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
    }
    .wtr-replacer-ui * { box-sizing: border-box; }
    .wtr-replacer-ui[data-theme="dark"] {
        background-color: var(--bs-body-bg, #1f2129);
        color: var(--bs-body-color, #f8fafc);
        border-color: var(--bs-border-color, rgba(248, 250, 252, 0.16));
        box-shadow: var(--bs-box-shadow-lg, 0 24px 70px rgba(0, 0, 0, 0.55));
    }
    .wtr-replacer-ui[data-theme="dark"] .wtr-replacer-header,
    .wtr-replacer-ui[data-theme="dark"] .wtr-replacer-tabs,
    .wtr-replacer-ui[data-theme="dark"] .wtr-replacer-list-controls {
        background-color: var(--bs-tertiary-bg, #181a22);
        border-color: var(--bs-border-color, rgba(248, 250, 252, 0.14));
    }
    .wtr-replacer-ui[data-theme="dark"] .wtr-replacer-form-group input[type="text"],
    .wtr-replacer-ui[data-theme="dark"] .wtr-replacer-form-group textarea,
    .wtr-replacer-ui[data-theme="dark"] .wtr-replacer-search-bar {
        background-color: var(--bs-body-bg, #111827);
        color: var(--bs-body-color, #f8fafc);
        border-color: var(--bs-border-color, rgba(248, 250, 252, 0.18));
    }
    .wtr-replacer-ui[data-theme="dark"] .wtr-replacer-term-item,
    .wtr-replacer-ui[data-theme="dark"] #wtr-page-indicator {
        background-color: var(--bs-secondary-bg-subtle, #171923);
        border-color: var(--bs-border-color, rgba(248, 250, 252, 0.14));
    }
    .wtr-replacer-ui[data-theme="dark"] .wtr-inline-helper-btn {
        background-color: var(--bs-body-bg, #111827);
        color: var(--bs-body-color, #f8fafc);
        border-color: var(--bs-border-color, rgba(248, 250, 252, 0.18));
    }
    .wtr-replacer-ui[data-theme="dark"] .wtr-inline-helper-btn:hover { background-color: var(--bs-secondary-bg-subtle, #1f2937); }
    .wtr-replacer-ui[data-theme="dark"] .wtr-switch-track { background: var(--bs-secondary-bg-subtle, #374151); }
    .wtr-replacer-ui[data-theme="dark"] .wtr-switch-track > span { background: var(--bs-body-bg, #f8fafc); }
    .wtr-replacer-ui[data-theme="dark"] .wtr-replacer-tab-btn { color: var(--bs-secondary-color, #a7b0c0); }
    .wtr-replacer-ui[data-theme="dark"] .wtr-replacer-tab-btn.active { color: var(--bs-primary, #8ab4ff); border-bottom-color: var(--bs-primary, #8ab4ff); }
    .wtr-replacer-ui[data-theme="dark"] .btn { color: var(--bs-body-color, #f8fafc); }

    /* --- Header --- */
    .wtr-replacer-header {
        padding: 0.75rem 1rem; background-color: var(--bs-tertiary-bg, #f3f4f6);
        border-bottom: 1px solid var(--bs-border-color, rgba(17, 24, 39, 0.15));
        display: flex; justify-content: space-between; align-items: center;
        border-radius: var(--bs-border-radius-lg, 0.75rem) var(--bs-border-radius-lg, 0.75rem) 0 0;
    }
    .wtr-replacer-header h2 { margin: 0; font-size: 1.25rem; }
    .wtr-replacer-header-controls { display: flex; align-items: center; gap: 1rem; }
    .wtr-replacer-disable-toggle label { display: flex; align-items: center; cursor: pointer; font-size: 0.9rem; }
    .wtr-replacer-disable-toggle input { margin-right: 0.5rem; }
    .wtr-replacer-close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; line-height: 1; color: inherit; padding: 0; }

    /* --- Tabs --- */
    .wtr-replacer-tabs { display: flex; padding: 0 0.5rem; border-bottom: 1px solid var(--bs-border-color, rgba(17, 24, 39, 0.15)); background-color: var(--bs-tertiary-bg, #f3f4f6); }
    .wtr-replacer-tab-btn {
        background: none; border: none; padding: 0.75rem 1rem; cursor: pointer;
        font-size: 0.9rem; color: var(--bs-secondary-color, #6b7280);
        border-bottom: 3px solid transparent; margin-bottom: -1px;
    }
    .wtr-replacer-tab-btn.active { color: var(--bs-primary, #2563eb); border-bottom-color: var(--bs-primary, #2563eb); font-weight: bold; }

    /* --- Content & Forms --- */
    .wtr-replacer-content { padding: 0.75rem; overflow-y: auto; flex-grow: 1; position: relative; }
    .wtr-replacer-tab-content { display: none; }
    .wtr-replacer-tab-content.active { display: block; }
    .wtr-replacer-form-group { margin-bottom: 0.875rem; }
    .wtr-replacer-form-group label { display: block; margin-bottom: 0; font-weight: 700; font-size: 0.78rem; }
    .wtr-field-label-row { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.45rem; }
    .wtr-field-label-row label { display: inline-flex; align-items: center; gap: 0.35rem; }
    .wtr-character-counter { color: var(--bs-secondary-color, #6b7280); font-weight: 600; }
    .wtr-character-counter.wtr-counter-warning { color: var(--bs-warning, #b45309); }
    .wtr-character-counter.wtr-counter-danger { color: var(--bs-danger, #dc3545); }
    .wtr-field-helper-actions, .wtr-original-helper-row { display: flex; align-items: center; gap: 0.375rem; flex-wrap: wrap; }
    .wtr-original-helper-row { justify-content: space-between; margin-top: 0.35rem; }
    .wtr-field-hint { color: var(--bs-secondary-color, #6b7280); font-size: 0.72rem; }
    .wtr-inline-helper-btn {
        display: inline-flex; align-items: center; justify-content: center; gap: 0.25rem;
        min-height: 1.5rem; padding: 0 0.5rem; border: 1px solid var(--bs-border-color, rgba(17,24,39,0.15));
        border-radius: 0.5rem; background: var(--bs-body-bg, #fff); color: var(--bs-body-color, #111827);
        cursor: pointer; font-size: 0.75rem; font-weight: 700; line-height: 1; transition: background-color .15s ease, color .15s ease, border-color .15s ease;
    }
    .wtr-inline-helper-btn:hover { background: var(--bs-secondary-bg-subtle, #f3f4f6); color: var(--bs-body-color, #111827); }
    .wtr-inline-helper-btn svg { width: 1rem; height: 1rem; }
    .wtr-replacer-form-group input[type="text"], .wtr-replacer-search-bar {
        width: 100%; height: 2rem; padding: 0.25rem 0.625rem;
        background-color: var(--bs-body-bg, #ffffff); color: var(--bs-body-color, #111827);
        border: 1px solid var(--bs-border-color, rgba(17, 24, 39, 0.15)); border-radius: var(--bs-border-radius, 0.5rem);
    }
    .wtr-replacer-form-group textarea {
        width: 100%; padding: 0.375rem 0.625rem;
        background-color: var(--bs-body-bg, #ffffff); color: var(--bs-body-color, #111827);
        border: 1px solid var(--bs-border-color, rgba(17, 24, 39, 0.15)); border-radius: var(--bs-border-radius, 0.5rem);
        resize: none;
        min-height: 2rem; max-height: 10rem;
        line-height: 1.4; font-family: inherit;
        word-wrap: break-word; white-space: pre-wrap;
    }
    .wtr-replacer-form-group input[type="checkbox"] { margin-right: 0.5rem; }
    .wtr-switch-group { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.5rem; }
    .wtr-switch-label { display: inline-flex !important; align-items: center; gap: 0.5rem; width: fit-content; cursor: pointer; font-size: 0.82rem !important; font-weight: 650 !important; }
    .wtr-switch-label input { position: absolute; opacity: 0; pointer-events: none; }
    .wtr-switch-track { position: relative; display: inline-flex; align-items: center; width: 2rem; height: 1.15rem; border-radius: 999px; background: var(--bs-secondary-bg-subtle, #d1d5db); transition: background-color .16s ease, opacity .16s ease; }
    .wtr-switch-track > span { width: 0.95rem; height: 0.95rem; margin-left: 0.1rem; border-radius: 999px; background: var(--bs-body-bg, #fff); box-shadow: 0 1px 3px rgba(15,23,42,0.3); transition: transform .16s ease; }
    .wtr-switch-label input:checked + .wtr-switch-track { background: var(--bs-primary, #2563eb); }
    .wtr-switch-label input:checked + .wtr-switch-track > span { transform: translateX(0.84rem); }
    .wtr-switch-label input:disabled + .wtr-switch-track { opacity: 0.45; }
    .wtr-switch-compact { margin: 0; }
    .wtr-novel-only-note { display: block; margin: -0.15rem 0 0.7rem; color: var(--bs-secondary-color, #6b7280); font-size: 0.76rem; }

    /* --- Visual Validation States --- */
    .wtr-replacer-form-group .wtr-field-invalid {
        border-color: var(--bs-danger, #dc3545) !important;
        background-color: rgba(var(--bs-danger-rgb, 220, 53, 69), 0.1) !important;
        box-shadow: 0 0 0 0.2rem rgba(var(--bs-danger-rgb, 220, 53, 69), 0.25);
    }
    
    .wtr-replacer-form-group .wtr-field-valid {
        border-color: var(--bs-success, #198754) !important;
        background-color: rgba(var(--bs-success-rgb, 25, 135, 84), 0.1) !important;
    }

    .wtr-replacer-form-group .wtr-field-warning {
        border-color: var(--bs-warning, #ffc107) !important;
        background-color: rgba(var(--bs-warning-rgb, 255, 193, 7), 0.12) !important;
        box-shadow: 0 0 0 0.2rem rgba(var(--bs-warning-rgb, 255, 193, 7), 0.2);
    }

    .wtr-regex-disabled-warning {
        display: block;
        margin-top: 0.35rem;
        color: var(--bs-warning-text-emphasis, var(--bs-warning, #b45309));
    }
    
    .wtr-save-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        background-color: var(--bs-secondary, #6c757d);
        border-color: var(--bs-secondary, #6c757d);
    }

    /* --- Buttons (Scoped to UI) --- */
    .wtr-replacer-ui .btn {
        display: inline-block; font-weight: 400; line-height: 1.5; color: var(--bs-body-color, #111827);
        text-align: center; vertical-align: middle; cursor: pointer; user-select: none;
        background-color: transparent; border: 1px solid transparent;
        padding: 0.375rem 0.75rem; font-size: 1rem; border-radius: var(--bs-border-radius, 0.5rem);
        transition: color .15s ease-in-out,background-color .15s ease-in-out,border-color .15s ease-in-out,box-shadow .15s ease-in-out;
    }
    .wtr-replacer-ui .btn:disabled { opacity: 0.65; cursor: not-allowed; }
    .wtr-replacer-ui .btn-primary { color: #fff; background-color: var(--bs-primary, #2563eb); border-color: var(--bs-primary, #2563eb); }
    .wtr-replacer-ui .btn-secondary { color: #fff; background-color: var(--bs-secondary, #6c757d); border-color: var(--bs-secondary, #6c757d); }
    .wtr-replacer-ui .btn-success { color: #fff; background-color: var(--bs-success, #198754); border-color: var(--bs-success, #198754); }
    .wtr-replacer-ui .btn-warning { color: #000; background-color: var(--bs-warning, #ffc107); border-color: var(--bs-warning, #ffc107); }
    .wtr-replacer-ui .btn-info { color: #fff; background-color: var(--bs-info, #0dcaf0); border-color: var(--bs-info, #0dcaf0); }
    .wtr-replacer-ui .btn-sm { padding: 0.25rem 0.5rem; font-size: 0.875rem; }

    .wtr-refresh-suggestions-btn { margin-top: 0.35rem; }
    .wtr-replacement-suggestions { margin-top: 0.35rem; }
    .wtr-replacement-suggestion-buttons { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.35rem; }
    .wtr-replacement-suggestion-btn {
        display: inline-flex !important; align-items: center; min-height: 1.25rem;
        padding: 0; border-radius: 0.25rem; border: 1px solid rgba(21, 128, 61, 0.5);
        overflow: hidden; cursor: pointer; font-size: 0.75rem; font-weight: 600; line-height: 1;
        background-color: #16a34a; color: #fff; transition: background-color .15s ease, border-color .15s ease, transform .15s ease;
    }
    .wtr-replacement-suggestion-btn:hover { background-color: #22c55e; transform: translateY(-1px); }
    .wtr-suggestion-icon-segment {
        display: inline-flex; align-items: center; align-self: stretch; gap: 0.125rem;
        padding: 0 0.25rem; border-right: 1px solid rgba(255,255,255,0.25);
        background-color: #111827; color: #fff;
    }
    .wtr-suggestion-icon-segment svg { width: 1rem; height: 1rem; }
    .wtr-suggestion-label { padding: 0 0.375rem; }
    .wtr-suggestion-source-badge {
        align-self: stretch; display: inline-flex; align-items: center; padding: 0 0.35rem;
        border-left: 1px solid rgba(255,255,255,0.24); background: rgba(15,23,42,0.22);
        font-size: 0.65rem; font-weight: 800; letter-spacing: 0.015em; text-transform: uppercase;
    }
    .wtr-suggestion-google { background-color: #4285f4; border-color: transparent; }
    .wtr-suggestion-google:hover { background-color: #5b9bff; }
    .wtr-suggestion-source { background-color: #374151; border-color: rgba(0,0,0,0.25); }
    .wtr-suggestion-source:hover { background-color: #4b5563; }
    .wtr-suggestion-field { background-color: #4f46e5; border-color: rgba(79,70,229,0.65); }
    .wtr-suggestion-field:hover { background-color: #6366f1; }
    .wtr-replacement-suggestion-btn.wtr-suggestion-existing { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.38); }
    .wtr-replacement-suggestion-btn.wtr-suggestion-in-original {
        background-color: #7c3aed; border-color: rgba(124,58,237,0.78);
    }
    .wtr-replacement-suggestion-btn.wtr-suggestion-in-original:hover { background-color: #8b5cf6; }
    .wtr-replacement-suggestion-btn.wtr-suggestion-in-replacement:not(.wtr-suggestion-in-original) {
        background-color: #6d28d9; border-color: rgba(109,40,217,0.72);
    }
    .wtr-replacement-suggestion-btn.wtr-suggestion-in-replacement:not(.wtr-suggestion-in-original):hover { background-color: #7c3aed; }
    .wtr-replacer-popover-actions { display: flex; flex-direction: column; gap: 0.25rem; }
    .wtr-replacer-popover-add-btn { white-space: nowrap; margin-top: 0.25rem !important; }

    /* --- Existing Term Modal --- */
    .wtr-existing-term-modal {
        position: fixed; inset: 0; z-index: 100002; display: flex; align-items: center; justify-content: center;
        background: rgba(15, 23, 42, 0.45); padding: 1rem;
    }
    .wtr-existing-term-card {
        width: min(92vw, 460px); background: var(--bs-body-bg, #fff); color: var(--bs-body-color, #111827);
        border: 1px solid var(--bs-border-color, rgba(17,24,39,0.16)); border-radius: 0.75rem;
        box-shadow: 0 24px 70px rgba(0,0,0,0.32); overflow: hidden;
    }
    .wtr-existing-term-header { padding: 0.8rem 1rem; border-bottom: 1px solid var(--bs-border-color, rgba(17,24,39,0.12)); font-weight: 800; }
    .wtr-existing-term-body { padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
    .wtr-existing-term-body p { margin: 0; font-size: 0.9rem; }
    .wtr-existing-term-list { display: flex; flex-direction: column; gap: 0.45rem; }
    .wtr-existing-term-open-btn {
        width: 100%; text-align: left; padding: 0.6rem 0.7rem; border: 1px solid var(--bs-border-color, rgba(17,24,39,0.14));
        border-radius: 0.5rem; background: var(--bs-secondary-bg-subtle, #f3f4f6); color: inherit; cursor: pointer;
    }
    .wtr-existing-term-open-btn:hover { background: var(--bs-tertiary-bg, #e5e7eb); }
    .wtr-existing-term-actions { display: flex; justify-content: flex-end; gap: 0.5rem; padding: 0.75rem 1rem; border-top: 1px solid var(--bs-border-color, rgba(17,24,39,0.12)); }
    .wtr-existing-term-actions button {
        display: inline-flex; align-items: center; justify-content: center; min-height: 1.75rem; padding: 0 0.65rem;
        border-radius: 0.5rem; border: 1px solid transparent; cursor: pointer; font-size: 0.8rem; font-weight: 700;
    }
    .wtr-existing-term-actions .btn-secondary { background: var(--bs-secondary, #6b7280); color: #fff; }
    .wtr-existing-term-actions .btn-primary { background: var(--bs-primary, #2563eb); color: #fff; }
    .wtr-replacer-ui[data-theme="dark"] ~ .wtr-existing-term-modal .wtr-existing-term-card,
    html.dark .wtr-existing-term-card,
    body.dark .wtr-existing-term-card { background: #1f2129; color: #f8fafc; border-color: rgba(248,250,252,0.16); }
    .wtr-replacer-ui[data-theme="dark"] ~ .wtr-existing-term-modal .wtr-existing-term-open-btn,
    html.dark .wtr-existing-term-open-btn,
    body.dark .wtr-existing-term-open-btn { background: #111827; border-color: rgba(248,250,252,0.16); }

    /* --- Term List --- */
    .wtr-replacer-list-controls {
        display: flex; justify-content: space-between; align-items: center;
        gap: 0.75rem; position: sticky; top: -1rem;
        background-color: var(--bs-body-bg, #ffffff); padding: 0.75rem 0; z-index: 10;
        flex-wrap: wrap;
    }
    .wtr-replacer-term-list { list-style: none; padding: 0; margin: 0; }
    .wtr-replacer-term-item {
        padding: 0.75rem; border: 1px solid var(--bs-border-color, rgba(17, 24, 39, 0.15));
        border-radius: var(--bs-border-radius, 0.5rem); margin-bottom: 0.5rem;
        display: flex; align-items: center; gap: 0.75rem;
        background-color: var(--bs-secondary-bg-subtle, #f3f4f6);
    }
    .wtr-replacer-term-details { flex-grow: 1; overflow: hidden; }
    .wtr-replacer-term-text { font-family: var(--bs-font-monospace, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace); font-size: 0.9rem; word-wrap: break-word; }
    .wtr-term-original { color: var(--bs-danger, #dc3545) !important; font-weight: bold; }
    .wtr-term-replacement { color: var(--bs-success, #198754) !important; font-weight: bold; }

    /* --- Floating Button --- */
    .wtr-add-term-float-btn {
        position: fixed; bottom: 7.25rem; right: 1rem;
        display: none; align-items: center; justify-content: center; gap: 0.5rem;
        min-height: 2rem; padding: 0.625rem 1.25rem;
        background-color: var(--bs-body-bg, #ffffff); color: #d97706;
        border: 1px solid #d97706; border-radius: 0.375rem;
        box-shadow: var(--bs-box-shadow, 0 10px 25px rgba(15, 23, 42, 0.18));
        cursor: pointer; font-size: 0.875rem; font-weight: 600; line-height: 1;
        z-index: 99998; transition: box-shadow .2s ease, transform .2s ease, background-color .2s ease;
    }
    .wtr-add-term-float-btn:hover { background-color: rgba(217, 119, 6, 0.1); box-shadow: 0 12px 30px rgba(15, 23, 42, 0.24); }
    .wtr-add-term-float-btn svg { width: 1rem; height: 1rem; flex-shrink: 0; }
    .wtr-replacer-ui[data-theme="dark"] ~ .wtr-add-term-float-btn,
    html.dark .wtr-add-term-float-btn,
    body.dark .wtr-add-term-float-btn {
        background-color: #1f2129; color: #f59e0b; border-color: #f59e0b;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
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
        background: rgba(var(--bs-body-bg-rgb, 255, 255, 255), 0.7); color: var(--bs-body-color, #111827);
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
        padding: 0.25rem 0.5rem; background-color: var(--bs-secondary-bg-subtle, #f3f4f6);
        border-radius: var(--bs-border-radius, 0.5rem);
    }

    /* --- Enhanced Export Button Styling --- */
    .wtr-export-combined {
        background: linear-gradient(45deg, var(--bs-success, #198754), #28a745);
        border: none;
        color: white;
        font-weight: bold;
        position: relative;
        overflow: hidden;
    }

    .wtr-export-combined:hover {
        background: linear-gradient(45deg, #28a745, var(--bs-success, #198754));
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
function parseRgbColor(value) {
    const match = value?.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
}
function isDarkRgb(value) {
    const rgb = parseRgbColor(value);
    if (!rgb) {
        return false;
    }
    const [r, g, b] = rgb;
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) < 128;
}
function hasPressedDarkThemeControl() {
    const pressedControls = Array.from(document.querySelectorAll('[aria-pressed="true"], [data-pressed]'));
    const hasDarkPressed = pressedControls.some((control) => normalizeMenuText(control) === "Dark");
    const hasLightPressed = pressedControls.some((control) => normalizeMenuText(control) === "Light");
    if (hasDarkPressed) {
        return true;
    }
    if (hasLightPressed) {
        return false;
    }
    return false;
}
function hasDarkReaderThemeSample() {
    const selectedSamples = Array.from(document.querySelectorAll('button[style*="background-color"]')).filter((button) => {
        const text = normalizeMenuText(button);
        const className = typeof button.className === "string" ? button.className : button.getAttribute("class") || "";
        return text.includes('"Aa"') && /ring-primary|data-\[state=on\]|aria-pressed/.test(className);
    });
    return selectedSamples.some((button) => isDarkRgb(button.style.backgroundColor || getComputedStyle(button).backgroundColor));
}
function isWtrDarkModeActive() {
    if (document.documentElement.classList.contains("dark") || document.body.classList.contains("dark")) {
        return true;
    }
    if (hasPressedDarkThemeControl() || hasDarkReaderThemeSample()) {
        return true;
    }
    const pageBg = getComputedStyle(document.body).backgroundColor || getComputedStyle(document.documentElement).backgroundColor;
    return isDarkRgb(pageBg) || window.matchMedia?.("(prefers-color-scheme: dark)")?.matches === true;
}
function syncUITheme() {
    const uiContainer = document.querySelector(".wtr-replacer-ui");
    if (!uiContainer) {
        return;
    }
    uiContainer.dataset.theme = isWtrDarkModeActive() ? "dark" : "light";
}
function findNativeFloatingAddTermButton() {
    return (Array.from(document.querySelectorAll("button")).find((button) => normalizeMenuText(button) === "Add Term" && !button.classList.contains("wtr-add-term-float-btn")) || null);
}
function syncFloatingAddTermButtonPosition() {
    const floatBtn = document.querySelector(".wtr-add-term-float-btn");
    if (!floatBtn) {
        return;
    }
    const nativeButton = findNativeFloatingAddTermButton();
    const nativeContainer = nativeButton?.closest(".fixed");
    const anchor = nativeContainer || nativeButton;
    const rect = anchor?.getBoundingClientRect();
    if (rect && rect.width > 0 && rect.height > 0) {
        const gap = 8;
        floatBtn.style.right = `${Math.max(12, Math.round(window.innerWidth - rect.right))}px`;
        floatBtn.style.bottom = `${Math.max(20, Math.round(window.innerHeight - rect.top + gap))}px`;
        return;
    }
    floatBtn.style.right = "1rem";
    floatBtn.style.bottom = window.innerWidth <= 640 ? "11rem" : "7.25rem";
}
function getTextInputSoftMax(input) {
    return Number(input?.dataset?.softMax) || 512;
}
function updateCharacterCounter(input, counter) {
    if (!input || !counter) {
        return;
    }
    const max = getTextInputSoftMax(input);
    const length = input.value.length;
    counter.textContent = `${length}/${max}`;
    counter.classList.toggle("wtr-counter-warning", length > max * 0.8 && length <= max);
    counter.classList.toggle("wtr-counter-danger", length > max);
}
function splitVariationParts(value) {
    const parts = value
        .split(/\s*(?:\||\/|,|;|\n)\s*/)
        .map((part) => part.trim())
        .filter(Boolean);
    const deduped = new Map();
    parts.forEach((part) => deduped.set(part.toLocaleLowerCase(), part));
    return Array.from(deduped.values()).sort((a, b) => b.length - a.length || a.localeCompare(b));
}
function replaceInputRange(input, replacement) {
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    input.value = `${input.value.slice(0, start)}${replacement}${input.value.slice(end)}`;
    const cursor = start + replacement.length;
    input.setSelectionRange(cursor, cursor);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
}
function normalizeOriginalAsVariations(originalInput, regexCheckbox) {
    const selectedText = originalInput.selectionStart !== null && originalInput.selectionEnd !== null && originalInput.selectionEnd > originalInput.selectionStart
        ? originalInput.value.slice(originalInput.selectionStart, originalInput.selectionEnd)
        : "";
    const sourceText = selectedText || originalInput.value;
    const parts = splitVariationParts(sourceText);
    if (parts.length === 0) {
        return;
    }
    const normalized = parts.map((part) => (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .escapeRegExp */ .Nt)(part)).join("|");
    regexCheckbox.checked = true;
    if (selectedText) {
        replaceInputRange(originalInput, normalized);
    }
    else {
        originalInput.value = normalized;
        originalInput.dispatchEvent(new Event("input", { bubbles: true }));
        originalInput.focus();
    }
    disableWholeWordForRegex();
}
function insertWildChar(originalInput, regexCheckbox) {
    const start = originalInput.selectionStart ?? originalInput.value.length;
    const end = originalInput.selectionEnd ?? start;
    const selectedText = end > start ? originalInput.value.slice(start, end) : "";
    const wildcard = selectedText
        ? (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .escapeRegExp */ .Nt)(selectedText.trim()).replace(/\\\s\+/g, "\\s+").replace(/\s+/g, "\\s+")
        : ".*?";
    regexCheckbox.checked = true;
    replaceInputRange(originalInput, wildcard);
    disableWholeWordForRegex();
}
function disableWholeWordForRegex() {
    const wholeWordCheckbox = document.getElementById("wtr-whole-word");
    if (wholeWordCheckbox) {
        wholeWordCheckbox.checked = false;
        wholeWordCheckbox.disabled = true;
    }
}
function setupReaderControlHardening() {
    let syncTimeout = null;
    const scheduleSync = () => {
        if (syncTimeout) {
            clearTimeout(syncTimeout);
        }
        syncTimeout = setTimeout(() => {
            syncUITheme();
            addMenuButton();
            syncFloatingAddTermButtonPosition();
        }, 100);
    };
    const observer = new MutationObserver(scheduleSync);
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "style", "aria-pressed", "data-pressed"],
    });
    document.addEventListener("click", scheduleSync, true);
    window.addEventListener("resize", scheduleSync);
    scheduleSync();
}
function createUI() {
    if (document.querySelector(".wtr-replacer-ui")) {
        return;
    }
    GM_addStyle(UI_CSS);
    const uiContainer = document.createElement("div");
    uiContainer.className = "wtr-replacer-ui";
    uiContainer.innerHTML = UI_HTML;
    document.body.appendChild(uiContainer);
    syncUITheme();
    const processingOverlay = document.createElement("div");
    processingOverlay.className = "wtr-processing-overlay";
    processingOverlay.textContent = "Processing...";
    document.body.appendChild(processingOverlay);
    // Event Listeners
    uiContainer.querySelector(".wtr-replacer-close-btn").addEventListener("click", _handlers__WEBPACK_IMPORTED_MODULE_1__/* .hideUIPanel */ .X);
    uiContainer.querySelector("#wtr-disable-all").addEventListener("change", _handlers__WEBPACK_IMPORTED_MODULE_1__/* .handleDisableToggle */ .ts);
    uiContainer.querySelector("#wtr-save-btn").addEventListener("click", _handlers__WEBPACK_IMPORTED_MODULE_1__/* .handleSaveTerm */ .s7);
    uiContainer.querySelector("#wtr-refresh-suggestions-btn").addEventListener("click", _handlers__WEBPACK_IMPORTED_MODULE_1__/* .handleRefreshSuggestionsClick */ .Zw);
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
    document.addEventListener("click", _handlers__WEBPACK_IMPORTED_MODULE_1__/* .handleWtrTextPatchClick */ .Xq, true);
    document.addEventListener("click", _handlers__WEBPACK_IMPORTED_MODULE_1__/* .handleWtrPopoverAddTermClick */ .cD);
    const wtrPopoverObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node instanceof Element) {
                    _handlers__WEBPACK_IMPORTED_MODULE_1__/* .enhanceWtrTermPopovers */ .mA(node);
                }
            });
        });
    });
    wtrPopoverObserver.observe(document.body, { childList: true, subtree: true });
    _handlers__WEBPACK_IMPORTED_MODULE_1__/* .enhanceWtrTermPopovers */ .mA(document);
    setupReaderControlHardening();
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
    const caseSensitiveCheckbox = uiContainer.querySelector("#wtr-case-sensitive");
    const wholeWordCheckbox = uiContainer.querySelector("#wtr-whole-word");
    regexCheckbox.addEventListener("change", (e) => {
        wholeWordCheckbox.disabled = e.target.checked;
        if (e.target.checked) {
            wholeWordCheckbox.checked = false;
            _handlers__WEBPACK_IMPORTED_MODULE_1__/* .normalizeOriginalRegexField */ .AO();
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
    originalTextarea.addEventListener("input", _handlers__WEBPACK_IMPORTED_MODULE_1__/* .handleReplacementSuggestionInput */ .l9);
    originalTextarea.addEventListener("focus", autoResizeTextarea);
    originalTextarea.addEventListener("focus", _handlers__WEBPACK_IMPORTED_MODULE_1__/* .handleSuggestionTargetFocus */ .U8);
    regexCheckbox.addEventListener("change", () => _handlers__WEBPACK_IMPORTED_MODULE_1__/* .handleReplacementSuggestionInput */ .l9({ target: originalTextarea, mergeExisting: true }));
    caseSensitiveCheckbox.addEventListener("change", () => _handlers__WEBPACK_IMPORTED_MODULE_1__/* .handleReplacementSuggestionInput */ .l9({ target: originalTextarea, mergeExisting: true }));
    // Real-time regex validation system
    const saveButton = uiContainer.querySelector("#wtr-save-btn");
    const replacementInput = uiContainer.querySelector("#wtr-replacement");
    const originalCounter = uiContainer.querySelector("#wtr-original-counter");
    const replacementCounter = uiContainer.querySelector("#wtr-replacement-counter");
    const updateAllCharacterCounters = () => {
        updateCharacterCounter(originalTextarea, originalCounter);
        updateCharacterCounter(replacementInput, replacementCounter);
    };
    replacementInput.addEventListener("focus", _handlers__WEBPACK_IMPORTED_MODULE_1__/* .handleSuggestionTargetFocus */ .U8);
    replacementInput.addEventListener("input", updateAllCharacterCounters);
    originalTextarea.addEventListener("input", updateAllCharacterCounters);
    uiContainer.querySelector("#wtr-variation-btn").addEventListener("click", () => normalizeOriginalAsVariations(originalTextarea, regexCheckbox));
    uiContainer.querySelector("#wtr-wildchar-btn").addEventListener("click", () => insertWildChar(originalTextarea, regexCheckbox));
    function updateValidationVisual(state) {
        // Remove all validation classes
        originalTextarea.classList.remove("wtr-field-invalid", "wtr-field-valid", "wtr-field-warning");
        if (state === "invalid") {
            originalTextarea.classList.add("wtr-field-invalid");
        }
        else if (state === "valid") {
            originalTextarea.classList.add("wtr-field-valid");
        }
        else if (state === "warning") {
            originalTextarea.classList.add("wtr-field-warning");
        }
    }
    function looksLikeRegexSyntax(value) {
        return /(^|[^\\])\|/.test(value) || /\\[bBdDsSwW]/.test(value) || /\[[^\]]+\]/.test(value) || /\([^)]*\|[^)]*\)/.test(value) || /\.\*/.test(value) || /[+*?{}^$]/.test(value);
    }
    function validateAndUpdateUI() {
        const isRegexEnabled = regexCheckbox.checked;
        const originalText = originalTextarea.value.trim();
        const replacementText = replacementInput.value.trim();
        const isValidInput = originalText.length > 0 && replacementText.length > 0;
        const regexWarning = document.getElementById("wtr-regex-disabled-warning");
        const shouldWarnRegexDisabled = !isRegexEnabled && originalText.length > 0 && looksLikeRegexSyntax(originalText);
        if (regexWarning) {
            regexWarning.style.display = shouldWarnRegexDisabled ? "block" : "none";
        }
        if (!isRegexEnabled || originalText.length === 0) {
            // Not a regex or empty field, clear validation state unless the text looks like regex syntax.
            updateValidationVisual(shouldWarnRegexDisabled ? "warning" : null);
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
    updateAllCharacterCounters();
    // Create floating action button
    const addTermFloatBtn = document.createElement("button");
    addTermFloatBtn.type = "button";
    addTermFloatBtn.className = "wtr-add-term-float-btn";
    addTermFloatBtn.title = "Add selected text to WTR Term Replacer";
    addTermFloatBtn.innerHTML = '<svg class="icon inline-flex shrink-0 size-4"><use href="#edit"></use></svg><span>Replacer Term</span>';
    document.body.appendChild(addTermFloatBtn);
    syncFloatingAddTermButtonPosition();
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
    syncUITheme();
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
function dispatchUiOnlyInput(element) {
    if (!element) {
        return;
    }
    const event = new Event("input", { bubbles: true });
    event.wtrSkipSuggestions = true;
    element.dispatchEvent(event);
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
    dispatchUiOnlyInput(document.getElementById("wtr-original"));
    dispatchUiOnlyInput(document.getElementById("wtr-replacement"));
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
            dispatchUiOnlyInput(originalTextarea);
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
    button.type = "button";
    button.className = `replacer-settings-btn ${className}`.trim();
    if (tooltip) {
        button.title = tooltip;
    }
    // Create settings icon using the specified SVG
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("height", "24px");
    svg.setAttribute("viewBox", "0 -960 960 960");
    svg.setAttribute("width", "24px");
    svg.setAttribute("fill", "currentColor");
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
function normalizeMenuText(element) {
    return (element?.textContent || "").replace(/\s+/g, " ").trim();
}
function findMenuButtonTargets() {
    const targets = [];
    const legacyButton = document.querySelector("button.term-edit-btn:not(.replacer-settings-btn)");
    const legacyContainer = legacyButton?.closest("div.col-6, [role='group'], .btn-group");
    if (legacyButton && legacyContainer) {
        targets.push({ container: legacyContainer, originalButton: legacyButton, layout: "legacy" });
    }
    const newEditButtons = Array.from(document.querySelectorAll("button")).filter((button) => normalizeMenuText(button) === "Edit Terms" && !button.classList.contains("replacer-settings-btn"));
    newEditButtons.forEach((button) => {
        const container = button.closest(".grid, [data-slot='tabs-content'], .chapter-wrap, .chapter-tracker");
        if (container && !targets.some((target) => target.container === container)) {
            targets.push({ container, originalButton: button, layout: "new-grid" });
        }
    });
    return targets;
}
function addMenuButton() {
    const targets = findMenuButtonTargets();
    if (targets.length === 0) {
        return;
    }
    targets.forEach(({ container, originalButton, layout }) => {
        if (!container || _state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.observedMenuContainers.has(container)) {
            return;
        }
        const findOriginalButton = () => {
            if (layout === "legacy") {
                return container.querySelector(".term-edit-btn:not(.replacer-settings-btn)") || originalButton;
            }
            return (Array.from(container.querySelectorAll("button")).find((button) => normalizeMenuText(button) === "Edit Terms" && !button.classList.contains("replacer-settings-btn")) || originalButton);
        };
        const ensureButtonState = () => {
            let settingsButton = container.querySelector(".replacer-settings-btn");
            const currentOriginalButton = findOriginalButton();
            // 1. Create the button if it doesn't exist
            if (!settingsButton) {
                if (!currentOriginalButton) {
                    return;
                } // Can't create if the original doesn't exist yet
                // Create button with simple inline SVG icon
                settingsButton = createSimpleMenuButton({
                    text: "Term Settings",
                    onClick: showUIPanel,
                    className: currentOriginalButton.className, // Copy classes for styling
                    tooltip: "Open WTR Term Settings",
                });
                settingsButton.setAttribute("data-wtr-replacer-menu", layout);
                container.appendChild(settingsButton);
                (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, "WTR Term Replacer: Settings button created with simple icon system.");
            }
            // 2. Enforce the correct order (our button should be last)
            if (container.lastChild !== settingsButton) {
                container.appendChild(settingsButton);
                (0,_utils__WEBPACK_IMPORTED_MODULE_3__/* .log */ .Rm)(_state__WEBPACK_IMPORTED_MODULE_0__/* .state */ .wk.globalSettings, "WTR Term Replacer: Settings button order corrected.");
            }
            // 3. Apply consistent styling without overriding the new grid layout.
            if (currentOriginalButton && settingsButton) {
                if (layout === "legacy") {
                    const desiredFlexStyle = "1 1 0%";
                    container.style.display = "flex";
                    container.style.gap = "5px";
                    currentOriginalButton.style.flex = desiredFlexStyle;
                    settingsButton.style.flex = desiredFlexStyle;
                }
                else {
                    settingsButton.style.width = "100%";
                    if (container.classList.contains("grid")) {
                        settingsButton.style.gridColumn = "span 2 / span 2";
                    }
                }
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
    });
}


/***/ },

/***/ 158
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Nt: () => (/* binding */ escapeRegExp),
/* harmony export */   Rm: () => (/* binding */ log),
/* harmony export */   Ug: () => (/* binding */ getChapterIdFromUrl),
/* harmony export */   aV: () => (/* binding */ getChapterProcessingId),
/* harmony export */   b4: () => (/* binding */ findChapterBodyById),
/* harmony export */   dF: () => (/* binding */ findChapterBodyForUrl),
/* harmony export */   getNovelSlug: () => (/* binding */ getNovelSlug),
/* harmony export */   o7: () => (/* binding */ getReaderContextFromPath)
/* harmony export */ });
/* unused harmony exports debounce, getChapterNoFromUrl, findChapterContainerForUrl, detectOtherWTRScripts, logDOMConflict, logProcessingWithMultiScriptContext, startProcessingTimer, endProcessingTimer, isContentReadyForProcessing, isElementReadyForProcessing, estimateContentLoadLevel */
/* unused harmony import specifier */ var CHAPTER_BODY_SELECTOR;
/* harmony import */ var _config_versions__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(387);
/* harmony import */ var _config_versions__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_config_versions__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(333);
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
function getChapterNoFromUrl(url = window.location.href) {
    const match = url.match(/chapter-(\d+)/);
    return match ? match[1] : null;
}
function queryFirst(root = document, selectors) {
    for (const selector of selectors.filter(Boolean)) {
        const match = root.querySelector(selector);
        if (match) {
            return match;
        }
    }
    return null;
}
function findChapterBodyById(chapterIdOrNo, root = document) {
    if (!chapterIdOrNo) {
        return null;
    }
    const rawValue = String(chapterIdOrNo);
    const chapterNo = rawValue.match(/\d+/)?.[0];
    const chapterId = rawValue.startsWith("chapter-") ? rawValue : chapterNo ? `chapter-${chapterNo}` : rawValue;
    const selectors = [
        `#${chapterId} ${_config__WEBPACK_IMPORTED_MODULE_1__/* .CHAPTER_BODY_SELECTOR */ .tA}`,
        chapterNo ? `#tracker-${chapterNo} ${_config__WEBPACK_IMPORTED_MODULE_1__/* .CHAPTER_BODY_SELECTOR */ .tA}` : "",
        chapterNo ? `.chapter-tracker[data-chapter-no="${chapterNo}"] ${_config__WEBPACK_IMPORTED_MODULE_1__/* .CHAPTER_BODY_SELECTOR */ .tA}` : "",
        chapterNo ? `[data-chapter-no="${chapterNo}"] ${_config__WEBPACK_IMPORTED_MODULE_1__/* .CHAPTER_BODY_SELECTOR */ .tA}` : "",
    ];
    return queryFirst(root, selectors);
}
function findChapterBodyForUrl(root = document, url = window.location.href) {
    const chapterId = getChapterIdFromUrl(url);
    const chapterNo = getChapterNoFromUrl(url);
    const selectors = [
        chapterId ? `#${chapterId} ${_config__WEBPACK_IMPORTED_MODULE_1__/* .CHAPTER_BODY_SELECTOR */ .tA}` : "",
        chapterNo ? `#tracker-${chapterNo} ${_config__WEBPACK_IMPORTED_MODULE_1__/* .CHAPTER_BODY_SELECTOR */ .tA}` : "",
        chapterNo ? `.chapter-tracker.active[data-chapter-no="${chapterNo}"] ${_config__WEBPACK_IMPORTED_MODULE_1__/* .CHAPTER_BODY_SELECTOR */ .tA}` : "",
        chapterNo ? `.chapter-tracker[data-chapter-no="${chapterNo}"] ${_config__WEBPACK_IMPORTED_MODULE_1__/* .CHAPTER_BODY_SELECTOR */ .tA}` : "",
        chapterNo ? `[data-chapter-no="${chapterNo}"] ${_config__WEBPACK_IMPORTED_MODULE_1__/* .CHAPTER_BODY_SELECTOR */ .tA}` : "",
        `.chapter-tracker.active ${_config__WEBPACK_IMPORTED_MODULE_1__/* .CHAPTER_BODY_SELECTOR */ .tA}`,
        `.chapter-container[id^="chapter-"] ${_config__WEBPACK_IMPORTED_MODULE_1__/* .CHAPTER_BODY_SELECTOR */ .tA}`,
        _config__WEBPACK_IMPORTED_MODULE_1__/* .CHAPTER_BODY_SELECTOR */ .tA,
    ];
    return queryFirst(root, selectors);
}
function findChapterContainerForUrl(root = document, url = window.location.href) {
    const chapterBody = findChapterBodyForUrl(root, url);
    if (chapterBody) {
        return chapterBody.closest(".chapter-container, .chapter-tracker, article, main") || chapterBody;
    }
    const chapterId = getChapterIdFromUrl(url);
    const chapterNo = getChapterNoFromUrl(url);
    const selectors = [
        chapterId ? `#${chapterId}` : "",
        chapterNo ? `#tracker-${chapterNo}` : "",
        chapterNo ? `.chapter-tracker.active[data-chapter-no="${chapterNo}"]` : "",
        chapterNo ? `.chapter-tracker[data-chapter-no="${chapterNo}"]` : "",
        ".chapter-tracker.active",
        '.chapter-container[id^="chapter-"]',
    ];
    return queryFirst(root, selectors);
}
function getChapterProcessingId(url = window.location.href, chapterBody = null) {
    const urlChapterId = getChapterIdFromUrl(url);
    if (urlChapterId) {
        return urlChapterId;
    }
    const trackerChapterNo = chapterBody?.closest?.(".chapter-tracker")?.getAttribute("data-chapter-no");
    if (trackerChapterNo) {
        return `chapter-${trackerChapterNo}`;
    }
    const containerId = chapterBody?.closest?.('.chapter-container[id^="chapter-"]')?.id;
    if (containerId) {
        return containerId;
    }
    const apiChapterId = chapterBody?.getAttribute?.("data-chapter-id");
    return apiChapterId ? `api-chapter-${apiChapterId}` : null;
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
    const hasChapterContent = container.querySelector(`${CHAPTER_BODY_SELECTOR}, .wtr-line, [data-line]`) ||
        container.querySelector("p, h1, h2, h3, h4, h5, h6");
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
module.exports = {"version":"5.7.3"};

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
        const chapterId = (0,_modules_utils__WEBPACK_IMPORTED_MODULE_5__/* .getChapterIdFromUrl */ .Ug)(window.location.href);
        if (!chapterId) {
            return;
        }
        const chapterBody = (0,_modules_utils__WEBPACK_IMPORTED_MODULE_5__/* .findChapterBodyForUrl */ .dF)(document);
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
    (0,_modules_utils__WEBPACK_IMPORTED_MODULE_5__/* .log */ .Rm)(_modules_state__WEBPACK_IMPORTED_MODULE_3__/* .state */ .wk.globalSettings, "WTR Term Replacer: Setting up navigation handling...");
    setupEnhancedNavigationHandling();
    (0,_modules_utils__WEBPACK_IMPORTED_MODULE_5__/* .log */ .Rm)(_modules_state__WEBPACK_IMPORTED_MODULE_3__/* .state */ .wk.globalSettings, "WTR Term Replacer: Creating UI and menu commands...");
    (0,_modules_ui__WEBPACK_IMPORTED_MODULE_0__/* .createUI */ .RD)(); // This will also set up the initial event listeners
    (0,_modules_utils__WEBPACK_IMPORTED_MODULE_5__/* .log */ .Rm)(_modules_state__WEBPACK_IMPORTED_MODULE_3__/* .state */ .wk.globalSettings, "WTR Term Replacer: Setting up disable functionality...");
    addDisableAllRobustness();
    (0,_modules_utils__WEBPACK_IMPORTED_MODULE_5__/* .log */ .Rm)(_modules_state__WEBPACK_IMPORTED_MODULE_3__/* .state */ .wk.globalSettings, "WTR Term Replacer: Registering menu commands...");
    GM_registerMenuCommand("Term Replacer Settings", _modules_ui__WEBPACK_IMPORTED_MODULE_0__/* .showUIPanel */ .E1);
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