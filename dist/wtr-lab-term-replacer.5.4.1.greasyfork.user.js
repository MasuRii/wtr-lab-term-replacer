// ==UserScript==
// @name WTR Lab Term Replacer
// @description A modular, Webpack-powered version of the WTR Lab Term Replacer userscript.
// @version 5.4.1
// @author MasuRii
// @homepage https://github.com/MasuRii/wtr-lab-term-replacer-webpack#readme
// @supportURL https://github.com/MasuRii/wtr-lab-term-replacer-webpack/issues
// @match https://wtr-lab.com/en/novel/*/*/*
// @grant GM_setValue
// @grant GM_getValue
// @grant GM_listValues
// @grant GM_addStyle
// @grant GM_registerMenuCommand
// @icon https://www.google.com/s2/favicons?sz=64&domain=wtr-lab.com
// @license MIT
// @namespace http://tampermonkey.net/
// @run-at document-idle
// ==/UserScript==

/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/modules/config.js":
/***/ ((__unused_webpack_module, exports) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.TERMS_STORAGE_KEY_PREFIX = exports.SETTINGS_STORAGE_KEY_PREFIX = exports.ITEMS_PER_PAGE = exports.GLOBAL_SETTINGS_KEY = exports.CURRENT_LOCATION_KEY = exports.CHAPTER_BODY_SELECTOR = void 0;
// Configuration constants and selectors
const CHAPTER_BODY_SELECTOR = exports.CHAPTER_BODY_SELECTOR = ".chapter-body";
const TERMS_STORAGE_KEY_PREFIX = exports.TERMS_STORAGE_KEY_PREFIX = "wtr_lab_terms_";
const SETTINGS_STORAGE_KEY_PREFIX = exports.SETTINGS_STORAGE_KEY_PREFIX = "wtr_lab_settings_";
const GLOBAL_SETTINGS_KEY = exports.GLOBAL_SETTINGS_KEY = "wtr_lab_global_settings";
const CURRENT_LOCATION_KEY = exports.CURRENT_LOCATION_KEY = "wtr_lab_term_list_location";
const ITEMS_PER_PAGE = exports.ITEMS_PER_PAGE = 100;

/***/ }),

/***/ "./src/modules/duplicates.js":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.changeDupGroup = changeDupGroup;
exports.computeDupGroups = computeDupGroups;
exports.exitDupMode = exitDupMode;
exports.updateDupModeAfterChange = updateDupModeAfterChange;
var _state = __webpack_require__("./src/modules/state.js");
var _ui = __webpack_require__("./src/modules/ui.js");
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
    components.push(...original.split('|'));
  } else {
    components.push(original);
  }
  return components.map(comp => {
    let normalized = comp.trim().replace(/\s+/g, ' ');
    if (!term.caseSensitive) {
      normalized = normalized.toLowerCase();
    }
    return normalized;
  }).filter(comp => comp.length > 0);
}

/**
 * Computes duplicate groups from a given array of terms.
 * @param {object[]} termsToScan - The array of terms to check for duplicates.
 */
function computeDupGroups(termsToScan) {
  const componentMap = new Map();
  const replacementDupGroups = new Map();
  const allDupGroups = new Map();
  termsToScan.forEach(term => {
    const components = getNormalizedTermComponents(term);
    if (components.length > 1) {
      const uniqueComponents = new Set(components);
      if (uniqueComponents.size < components.length) {
        const originalTextSnippet = term.original.length > 50 ? term.original.substring(0, 47) + '...' : term.original;
        const key = `Internal duplicate in: "${originalTextSnippet}"`;
        allDupGroups.set(key, [term]);
      }
    }
    components.forEach(comp => {
      if (!componentMap.has(comp)) componentMap.set(comp, []);
      const group = componentMap.get(comp);
      if (!group.some(t => t.id === term.id)) group.push(term);
    });
    if (term.replacement) {
      const key = term.replacement;
      if (!replacementDupGroups.has(key)) replacementDupGroups.set(key, []);
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
        const newTerms = group.filter(t => !existingGroup.some(et => et.id === t.id));
        allDupGroups.set(displayKey, [...existingGroup, ...newTerms]);
      } else {
        allDupGroups.set(displayKey, group);
      }
    }
  }
  _state.state.dupGroups = allDupGroups;
  _state.state.dupKeys = Array.from(_state.state.dupGroups.keys()).sort();
}
function exitDupMode() {
  _state.state.isDupMode = false;
  _state.state.currentDupIndex = 0;
  _state.state.dupGroups = new Map();
  _state.state.dupKeys = [];
  (0, _ui.renderTermList)(_state.state.currentSearchValue);
}
function changeDupGroup(delta) {
  _state.state.currentDupIndex = Math.max(0, Math.min(_state.state.dupKeys.length - 1, _state.state.currentDupIndex + delta));
  (0, _ui.renderTermList)();
}
function updateDupModeAfterChange() {
  computeDupGroups(_state.state.terms); // Use the current in-memory `state.terms` array which has just been updated
  if (_state.state.dupKeys.length === 0) {
    alert('All duplicates resolved.');
    exitDupMode();
    return;
  }
  const oldKey = _state.state.dupKeys[_state.state.currentDupIndex];
  const newIndex = _state.state.dupKeys.indexOf(oldKey);
  if (newIndex !== -1) {
    const group = _state.state.dupGroups.get(oldKey);
    if (group && (group.length > 1 || oldKey.startsWith('Internal duplicate'))) {
      _state.state.currentDupIndex = newIndex;
    } else {
      _state.state.currentDupIndex = Math.min(_state.state.currentDupIndex, _state.state.dupKeys.length - 1);
    }
  } else {
    _state.state.currentDupIndex = Math.min(_state.state.currentDupIndex, _state.state.dupKeys.length - 1);
  }
  (0, _ui.renderTermList)();
}

/***/ }),

/***/ "./src/modules/engine.js":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.executeReplacementLogic = executeReplacementLogic;
exports.performReplacements = performReplacements;
exports.revertAllReplacements = revertAllReplacements;
exports.traverseAndRevert = traverseAndRevert;
var _state = __webpack_require__("./src/modules/state.js");
var _utils = __webpack_require__("./src/modules/utils.js");
var _ui = __webpack_require__("./src/modules/ui.js");
var _config = __webpack_require__("./src/modules/config.js");
// Core replacement engine for WTR Lab Term Replacer

async function performReplacements(targetElement) {
  if (!targetElement) {
    (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: performReplacements called with null target element');
    return;
  }
  (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Starting performReplacements');
  (0, _ui.showProcessingIndicator)(true);
  await new Promise(resolve => setTimeout(resolve, 10));
  if (_state.state.settings.isDisabled || _state.state.terms.length === 0) {
    (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Skipping replacements - disabled: ${_state.state.settings.isDisabled}, terms: ${_state.state.terms.length}`);
    (0, _ui.showProcessingIndicator)(false);
    return;
  }
  try {
    (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Found ${_state.state.terms.length} terms to process, beginning replacement with retry mechanism`);
    // Enhanced replacement with error handling and retry
    await performReplacementsWithRetry(targetElement, 3);
  } catch (error) {
    (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Failed to perform replacements after retries:`, error);
    console.error('WTR Term Replacer: Replacement failed, but original content preserved');
  } finally {
    (0, _ui.showProcessingIndicator)(false);
    (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: performReplacements completed');
  }
}
async function performReplacementsWithRetry(targetElement, maxRetries) {
  var _lastError;
  let lastError = null;
  let elementStabilityCounter = 0;
  (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Starting replacement process with ${maxRetries} retries`);
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Replacement attempt ${attempt}/${maxRetries}`);

      // Enhanced element stability validation
      if (!validateElementStability(targetElement, elementStabilityCounter)) {
        (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Element stability check failed, attempt ${elementStabilityCounter}`);
        // Re-acquire element reference for better stability
        const chapterId = (0, _utils.getChapterIdFromUrl)(window.location.href);
        if (chapterId) {
          const chapterSelector = `#${chapterId} ${_config.CHAPTER_BODY_SELECTOR}`;
          targetElement = document.querySelector(chapterSelector);
          if (!targetElement) {
            (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Unable to re-acquire target element for chapter ${chapterId}`);
            throw new Error('Unable to re-acquire target element');
          }
          (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Re-acquired target element for chapter ${chapterId}`);
          elementStabilityCounter++;
        } else {
          (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Cannot determine chapter ID for element recovery');
          throw new Error('Cannot determine chapter ID for element recovery');
        }
      }

      // Additional DOM validation before proceeding
      if (!document.contains(targetElement) || !targetElement.parentNode) {
        (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Target element validation failed - not in stable DOM');
        throw new Error('Target element not in stable DOM');
      }
      (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Element validation passed, executing replacement logic');
      // Perform the actual replacement logic
      await executeReplacementLogic(targetElement);
      (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Replacement attempt ${attempt} successful`);
      return; // Success, exit retry loop
    } catch (error) {
      lastError = error;
      (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Replacement attempt ${attempt} failed:`, error.message);
      if (attempt < maxRetries) {
        // Progressive backoff with stability checks
        const delay = Math.min(100 * Math.pow(2, attempt - 1), 2000);
        (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));

        // Pre-retry stability check
        if (error.message && error.message.includes('DOM')) {
          elementStabilityCounter++;
        }
      } else {
        (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: All ${maxRetries} attempts failed, giving up`);
      }
    }
  }

  // All retries failed
  (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: All replacement attempts failed, throwing error: ${((_lastError = lastError) === null || _lastError === void 0 ? void 0 : _lastError.message) || 'Unknown error'}`);
  throw lastError || new Error('Unknown replacement error');
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
  var _targetElement$textCo;
  // Validate target element state before processing
  if (!targetElement || targetElement.nodeType !== Node.ELEMENT_NODE) {
    throw new Error('Invalid target element');
  }

  // Additional DOM stability validation
  if (!validateElementStability(targetElement, 0)) {
    throw new Error('Target element DOM stability check failed');
  }

  // Check if element has meaningful content to process
  const textContent = ((_targetElement$textCo = targetElement.textContent) === null || _targetElement$textCo === void 0 ? void 0 : _targetElement$textCo.trim()) || '';
  if (textContent.length === 0) {
    var _targetElement$textCo2;
    const chapterId = (0, _utils.getChapterIdFromUrl)(window.location.href) || 'unknown';
    const contentLength = ((_targetElement$textCo2 = targetElement.textContent) === null || _targetElement$textCo2 === void 0 ? void 0 : _targetElement$textCo2.length) || 0;
    (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Target element has no text content in chapter ${chapterId} (${contentLength} chars), skipping`);
    return;
  }

  // Collect all text nodes and aggregate into a single string.
  const walker = document.createTreeWalker(targetElement, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  let node;
  while (node = walker.nextNode()) {
    if (!node.parentElement.closest('.wtr-replacer-ui, script, style')) {
      textNodes.push(node);
    }
  }
  const nodeValues = new Map();
  const nodeMap = [];
  let fullText = '';
  let currentPos = 0;
  textNodes.forEach(n => {
    if (!_state.state.originalTextNodes.has(n)) {
      _state.state.originalTextNodes.set(n, n.nodeValue);
    }
    const originalValue = _state.state.originalTextNodes.get(n);
    nodeValues.set(n, originalValue);
    if (originalValue.length > 0) {
      nodeMap.push({
        node: n,
        start: currentPos,
        end: currentPos + originalValue.length
      });
    }
    fullText += originalValue;
    currentPos += originalValue.length;
  });
  if (!fullText.trim()) {
    (0, _ui.showProcessingIndicator)(false);
    return;
  }

  // Categorize terms
  const simple_cs_partial = new Map();
  const simple_cs_whole = new Map();
  const simple_ci_partial = new Map();
  const simple_ci_whole = new Map();
  const regex_terms = [];
  for (const term of _state.state.terms) {
    if (!term.original) continue;
    if (term.isRegex) {
      try {
        const flags = term.caseSensitive ? 'g' : 'gi';
        regex_terms.push({
          pattern: new RegExp(term.original, flags),
          replacement: term.replacement
        });
      } catch (e) {
        console.error(`Skipping invalid regex for term "${term.original}":`, e);
      }
    } else {
      const key = term.caseSensitive ? term.original : term.original.toLowerCase();
      const value = term.replacement;
      if (term.caseSensitive) {
        if (term.wholeWord) simple_cs_whole.set(key, value);else simple_cs_partial.set(key, value);
      } else {
        if (term.wholeWord) simple_ci_whole.set(key, value);else simple_ci_partial.set(key, value);
      }
    }
  }

  // Compile categorized terms into combined patterns.
  const compiledTerms = [...regex_terms];
  const addSimpleGroup = (map, flags, wholeWord, caseSensitive) => {
    if (map.size > 0) {
      const sortedKeys = [...map.keys()].sort((a, b) => b.length - a.length);
      const patterns = sortedKeys.map(k => {
        const escaped = (0, _utils.escapeRegExp)(k);
        return wholeWord ? `\\b${escaped}\\b` : escaped;
      });
      const combined = patterns.join('|');
      compiledTerms.push({
        pattern: new RegExp(combined, flags),
        replacement_map: map,
        is_simple: true,
        case_sensitive: caseSensitive
      });
    }
  };
  addSimpleGroup(simple_cs_partial, 'g', false, true);
  addSimpleGroup(simple_cs_whole, 'g', true, true);
  addSimpleGroup(simple_ci_partial, 'gi', false, false);
  addSimpleGroup(simple_ci_whole, 'gi', true, false);

  // Find ALL possible matches from all compiled terms.
  let allMatches = [];
  for (const comp of compiledTerms) {
    for (const match of fullText.matchAll(comp.pattern)) {
      if (match.index === match.index + match[0].length) continue; // Skip zero-length matches

      let replacementText;
      if (comp.is_simple) {
        const key = comp.case_sensitive ? match[0] : match[0].toLowerCase();
        replacementText = comp.replacement_map.get(key);
      } else {
        replacementText = comp.replacement;
      }
      if (replacementText !== undefined) {
        allMatches.push({
          start: match.index,
          end: match.index + match[0].length,
          replacement: replacementText
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
    const {
      start: matchStart,
      end: matchEnd,
      replacement: replacementString
    } = match;
    const affectedNodesInfo = [];
    for (const info of nodeMap) {
      if (info.start < matchEnd && info.end > matchStart) {
        affectedNodesInfo.push(info);
      }
    }
    if (affectedNodesInfo.length === 0) continue;
    const firstNodeInfo = affectedNodesInfo[0];
    const lastNodeInfo = affectedNodesInfo[affectedNodesInfo.length - 1];
    const startNode = firstNodeInfo.node;
    const lastNode = lastNodeInfo.node;
    const startOffset = matchStart - firstNodeInfo.start;
    const endOffset = matchEnd - lastNodeInfo.start;
    if (startNode === lastNode) {
      let currentVal = nodeValues.get(startNode);
      nodeValues.set(startNode, currentVal.substring(0, startOffset) + replacementString + currentVal.substring(endOffset));
    } else {
      let lastVal = nodeValues.get(lastNode);
      nodeValues.set(lastNode, lastVal.substring(endOffset));
      for (let i = 1; i < affectedNodesInfo.length - 1; i++) {
        nodeValues.set(affectedNodesInfo[i].node, '');
      }
      let firstVal = nodeValues.get(startNode);
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
  (0, _ui.showProcessingIndicator)(false);
}
function traverseAndRevert(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    if (_state.state.originalTextNodes.has(node)) {
      node.nodeValue = _state.state.originalTextNodes.get(node);
    }
    return;
  }
  if (node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() !== 'script' && node.tagName.toLowerCase() !== 'style') {
    if (node.classList.contains('wtr-replacer-ui')) return;
    for (const child of node.childNodes) {
      traverseAndRevert(child);
    }
  }
}
async function revertAllReplacements(targetElement) {
  if (!targetElement) return;
  (0, _ui.showProcessingIndicator)(true);
  await new Promise(resolve => setTimeout(resolve, 10));
  traverseAndRevert(targetElement);
  (0, _ui.showProcessingIndicator)(false);
}

/***/ }),

/***/ "./src/modules/handlers.js":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.addTermProgrammatically = addTermProgrammatically;
exports.downloadJSON = downloadJSON;
exports.handleAddTermFromSelection = handleAddTermFromSelection;
exports.handleDeleteSelected = handleDeleteSelected;
exports.handleDisableToggle = handleDisableToggle;
exports.handleExportAll = handleExportAll;
exports.handleExportCombined = handleExportCombined;
exports.handleExportNovel = handleExportNovel;
exports.handleFileImport = handleFileImport;
exports.handleFindDuplicates = handleFindDuplicates;
exports.handleListInteraction = handleListInteraction;
exports.handleSaveTerm = handleSaveTerm;
exports.handleSearch = handleSearch;
exports.handleTabSwitch = handleTabSwitch;
exports.handleTextSelection = handleTextSelection;
exports.hideUIPanel = hideUIPanel;
exports.restoreTermListLocation = restoreTermListLocation;
Object.defineProperty(exports, "saveTermListLocation", ({
  enumerable: true,
  get: function () {
    return _storage.saveTermListLocation;
  }
}));
exports.setSearchFieldValue = setSearchFieldValue;
exports.toggleLogging = toggleLogging;
exports.validateRegex = validateRegex;
exports.validateRegexSilent = validateRegexSilent;
var _state = __webpack_require__("./src/modules/state.js");
var _storage = __webpack_require__("./src/modules/storage.js");
var _ui = __webpack_require__("./src/modules/ui.js");
var _observer = __webpack_require__("./src/modules/observer.js");
var _duplicates = __webpack_require__("./src/modules/duplicates.js");
var _utils = __webpack_require__("./src/modules/utils.js");
var _engine = __webpack_require__("./src/modules/engine.js");
// Event handler functions for WTR Lab Term Replacer

// Re-export saveTermListLocation for UI module

// Export hideUIPanel function that can be called from UI
function hideUIPanel() {
  (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: UI panel hide requested');
  (0, _ui.hideUIPanel)();
}
function validateRegex(pattern) {
  try {
    new RegExp(pattern);
    (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Valid regex pattern: ${pattern}`);
    return true;
  } catch (e) {
    (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Invalid regex pattern: ${pattern} - ${e.message}`);
    return false;
  }
}

// Silent validation for real-time visual feedback
function validateRegexSilent(pattern) {
  try {
    new RegExp(pattern);
    return {
      isValid: true,
      error: null
    };
  } catch (e) {
    return {
      isValid: false,
      error: e.message
    };
  }
}
async function handleSaveTerm() {
  (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Handle save term started');
  const id = document.getElementById('wtr-term-id').value;
  const originalInput = document.getElementById('wtr-original');
  const replacementInput = document.getElementById('wtr-replacement');
  const original = originalInput.value.trim();
  const isRegex = document.getElementById('wtr-is-regex').checked;
  const wholeWord = document.getElementById('wtr-whole-word').checked;
  (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Saving term - original: "${original}", replacement: "${replacementInput.value}", isRegex: ${isRegex}, wholeWord: ${wholeWord}, caseSensitive: ${document.getElementById('wtr-case-sensitive').checked}`);
  if (!original) {
    (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Save term failed - empty original text');
    return; // No error message shown, rely on disabled save button
  }
  if (isRegex && !validateRegex(original)) {
    (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Save term failed - invalid regex pattern');
    return; // No error message shown, rely on visual feedback
  }
  const newTerm = {
    id: id || `term_${Date.now()}`,
    original,
    replacement: replacementInput.value,
    caseSensitive: document.getElementById('wtr-case-sensitive').checked,
    isRegex,
    wholeWord: isRegex ? false : wholeWord
  };
  const existingIndex = _state.state.terms.findIndex(t => t.id === newTerm.id);
  if (existingIndex > -1) {
    (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Updating existing term ${newTerm.id}`);
    _state.state.terms[existingIndex] = newTerm;
  } else {
    (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Adding new term ${newTerm.id}`);
    _state.state.terms.push(newTerm);
  }
  await (0, _storage.saveTerms)(_state.state.terms);
  (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Term saved successfully, total terms: ${_state.state.terms.length}`);
  (0, _observer.reprocessCurrentChapter)();
  originalInput.value = '';
  replacementInput.value = '';
  document.getElementById('wtr-term-id').value = '';
  document.getElementById('wtr-case-sensitive').checked = false;
  document.getElementById('wtr-is-regex').checked = false;
  document.getElementById('wtr-whole-word').checked = false;
  document.getElementById('wtr-save-btn').textContent = 'Save Term';
  (0, _ui.renderTermList)(_state.state.currentSearchValue);
  if (id) {
    (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Switching to terms tab after update');
    (0, _ui.switchTab)('terms');
  } else {
    (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Focusing on original input for next term');
    originalInput.focus();
  }
  if (_state.state.isDupMode) {
    (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Updating duplicate mode after term change');
    (0, _duplicates.updateDupModeAfterChange)();
  }
}
function handleListInteraction(e) {
  var _e$target$closest;
  const termId = (_e$target$closest = e.target.closest('li')) === null || _e$target$closest === void 0 ? void 0 : _e$target$closest.dataset.id;
  if (!termId) return;
  if (e.target.classList.contains('wtr-edit-btn')) {
    const term = _state.state.terms.find(t => t.id === termId);
    if (term) (0, _ui.showFormView)(term);
  }
}
async function handleDeleteSelected() {
  (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Delete selected terms started');
  (0, _ui.showUILoader)();
  try {
    const selectedIds = [...document.querySelectorAll('.wtr-replacer-term-select:checked')].map(cb => cb.dataset.id);
    (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Found ${selectedIds.length} terms selected for deletion: ${selectedIds.join(', ')}`);
    if (selectedIds.length === 0) {
      (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Delete cancelled - no terms selected');
      alert('No terms selected.');
      return;
    }
    if (confirm(`Delete ${selectedIds.length} term(s)?`)) {
      (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: User confirmed deletion, proceeding...');
      const filteredTerms = _state.state.terms.filter(t => !selectedIds.includes(t.id));
      (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Deleting ${_state.state.terms.length - filteredTerms.length} terms, ${filteredTerms.length} remaining`);
      await (0, _storage.saveTerms)(filteredTerms);
      await (0, _storage.loadData)();
      (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Terms deleted and data reloaded');
      (0, _observer.reprocessCurrentChapter)();
      if (_state.state.isDupMode) {
        (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Updating duplicate mode after deletion');
        (0, _duplicates.updateDupModeAfterChange)();
      } else {
        (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Refreshing term list display');
        (0, _ui.renderTermList)(_state.state.currentSearchValue);
      }
    } else {
      (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Delete cancelled by user');
    }
  } catch (error) {
    (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Error during term deletion: ${error.message}`);
    console.error('Error during term deletion:', error);
  } finally {
    (0, _ui.hideUILoader)();
  }
}
function handleTextSelection(e) {
  const CHAPTER_BODY_SELECTOR = ".chapter-body";
  if (!e.target.closest(CHAPTER_BODY_SELECTOR)) return;
  const selection = window.getSelection().toString().trim();
  const floatBtn = document.querySelector('.wtr-add-term-float-btn');
  if (selection && selection.length > 0 && selection.length < 100) {
    floatBtn.style.display = 'block';
  } else {
    floatBtn.style.display = 'none';
  }
}
function handleAddTermFromSelection() {
  const selection = window.getSelection().toString().trim();
  if (selection) {
    (0, _ui.showUIPanel)();
    (0, _ui.showFormView)();
    document.getElementById('wtr-original').value = selection;
    document.getElementById('wtr-replacement').focus();
  }
  document.querySelector('.wtr-add-term-float-btn').style.display = 'none';
}
function handleSearch(e) {
  if (_state.state.isDupMode) return;
  _state.state.currentSearchValue = e.target.value;
  _state.state.currentPage = 1;
  (0, _ui.renderTermList)(_state.state.currentSearchValue);

  // Immediately save the search field value for reactive behavior
  (0, _storage.saveSearchFieldValue)();
}
async function handleDisableToggle(e) {
  _state.state.settings.isDisabled = e.target.checked;
  await (0, _storage.saveSettings)(_state.state.settings);
  const getChapterIdFromUrl = url => {
    const match = url.match(/(chapter-\d+)/);
    return match ? match[1] : null;
  };
  const CHAPTER_BODY_SELECTOR = ".chapter-body";
  const chapterId = getChapterIdFromUrl(window.location.href);
  if (!chapterId) return;
  const chapterSelector = `#${chapterId} ${CHAPTER_BODY_SELECTOR}`;
  const chapterBody = document.querySelector(chapterSelector);
  if (chapterBody) {
    if (_state.state.settings.isDisabled) {
      (0, _engine.revertAllReplacements)(chapterBody);
    } else {
      (0, _engine.performReplacements)(chapterBody);
    }
  }
}
function downloadJSON(data, filename) {
  return new Promise(resolve => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
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
    formatVersion: '5.4',
    settings: {
      [_state.state.novelSlug]: _state.state.settings
    },
    terms: {
      [_state.state.novelSlug]: _state.state.terms
    }
  };
  downloadJSON(exportData, `${_state.state.novelSlug}-terms.json`);
}
async function handleExportAll() {
  (0, _ui.showUILoader)();
  try {
    const allKeys = await GM_listValues();
    const TERMS_STORAGE_KEY_PREFIX = "wtr_lab_terms_";
    const SETTINGS_STORAGE_KEY_PREFIX = "wtr_lab_settings_";
    const termKeys = allKeys.filter(k => k.startsWith(TERMS_STORAGE_KEY_PREFIX));
    const settingKeys = allKeys.filter(k => k.startsWith(SETTINGS_STORAGE_KEY_PREFIX));
    const exportData = {
      formatVersion: '5.4',
      settings: {},
      terms: {}
    };
    for (const key of termKeys) {
      const slug = key.replace(TERMS_STORAGE_KEY_PREFIX, '');
      exportData.terms[slug] = await GM_getValue(key);
    }
    for (const key of settingKeys) {
      const slug = key.replace(SETTINGS_STORAGE_KEY_PREFIX, '');
      exportData.settings[slug] = await GM_getValue(key);
    }
    downloadJSON(exportData, 'wtr-lab-all-terms-backup.json');
  } catch (e) {
    console.error('Error exporting all terms:', e);
    alert('Failed to export all terms.');
  } finally {
    (0, _ui.hideUILoader)();
  }
}

// Enhanced dual export functionality with sequential downloads
async function handleExportCombined() {
  (0, _ui.showUILoader)();
  try {
    // Step 1: Export novel terms first
    const novelExportData = {
      formatVersion: '5.4',
      settings: {
        [_state.state.novelSlug]: _state.state.settings
      },
      terms: {
        [_state.state.novelSlug]: _state.state.terms
      }
    };
    await downloadJSON(novelExportData, `${_state.state.novelSlug}-terms.json`);

    // Step 2: Ask user for confirmation before proceeding to second download
    const userConfirmed = confirm('The first file (Novel Terms) has been downloaded. Please check if the download completed successfully. Click "OK" to proceed with the second download (All Terms backup), or "Cancel" to skip.');
    if (userConfirmed) {
      // Step 3: Export all terms only after user confirmation
      const allKeys = await GM_listValues();
      const TERMS_STORAGE_KEY_PREFIX = "wtr_lab_terms_";
      const SETTINGS_STORAGE_KEY_PREFIX = "wtr_lab_settings_";
      const termKeys = allKeys.filter(k => k.startsWith(TERMS_STORAGE_KEY_PREFIX));
      const settingKeys = allKeys.filter(k => k.startsWith(SETTINGS_STORAGE_KEY_PREFIX));
      const allExportData = {
        formatVersion: '5.4',
        settings: {},
        terms: {}
      };
      for (const key of termKeys) {
        const slug = key.replace(TERMS_STORAGE_KEY_PREFIX, '');
        allExportData.terms[slug] = await GM_getValue(key);
      }
      for (const key of settingKeys) {
        const slug = key.replace(SETTINGS_STORAGE_KEY_PREFIX, '');
        allExportData.settings[slug] = await GM_getValue(key);
      }
      await downloadJSON(allExportData, 'wtr-lab-all-terms-backup.json');
      alert('Both files have been successfully exported!');
    } else {
      alert('Second export cancelled. Only the novel terms file was downloaded.');
    }
  } catch (e) {
    console.error('Error exporting combined terms:', e);
    alert('Failed to export combined terms. Please try again.');
  } finally {
    (0, _ui.hideUILoader)();
  }
}
async function handleFileImport(event) {
  (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: File import started, import type: ${_state.state.importType}`);
  (0, _ui.showUILoader)();
  try {
    const file = event.target.files[0];
    if (!file) {
      (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: No file selected for import');
      return;
    }
    (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Importing file: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);
    const reader = new FileReader();
    reader.onload = async e => {
      const content = e.target.result;
      (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: File content loaded, length: ${content.length} characters`);
      let importedData;
      try {
        importedData = JSON.parse(content);
        (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: JSON parsed successfully');
      } catch (err) {
        (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Import failed - invalid JSON: ${err.message}`);
        alert('Import failed. Invalid JSON data. Error: ' + err.message);
        return;
      }
      let isNewFormat = !!importedData.formatVersion;
      let termsData;
      let settingsData;
      let isArrayData = Array.isArray(importedData);
      let isOldGlobal = !isNewFormat && !isArrayData && typeof importedData === 'object';
      (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Detected format - isNewFormat: ${isNewFormat}, isArrayData: ${isArrayData}, isOldGlobal: ${isOldGlobal}`);
      if (isArrayData) {
        termsData = {
          [_state.state.novelSlug]: importedData
        };
        (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Array format detected, mapping to current novel');
      } else if (isOldGlobal) {
        termsData = importedData;
        (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Old global format detected');
      } else if (isNewFormat) {
        termsData = importedData.terms || {};
        settingsData = importedData.settings || {};
        (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: New format detected - terms: ${Object.keys(termsData).length} slugs, settings: ${Object.keys(settingsData).length} slugs`);
      } else {
        (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Import failed - unrecognized data format');
        alert('Import failed. Unrecognized data format.');
        return;
      }
      let slugs = Object.keys(termsData);
      (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Found data for ${slugs.length} slugs: ${slugs.join(', ')}`);
      if (_state.state.importType === 'novel' && slugs.length > 1) {
        (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Novel import with multiple slugs - warning user');
        alert('Warning: File contains data for multiple novels, but importing to current novel only. Use Global Import for all.');
        termsData = {
          [_state.state.novelSlug]: termsData[Object.keys(termsData)[0]] || []
        };
        if (settingsData) settingsData = {
          [_state.state.novelSlug]: settingsData[Object.keys(settingsData)[0]] || {}
        };
        slugs = [_state.state.novelSlug];
      }
      let shouldImportSettings = false;
      if (settingsData && Object.keys(settingsData).length > 0) {
        (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Settings detected in import, asking user for confirmation');
        shouldImportSettings = confirm('This file contains settings. Would you like to import and overwrite your current settings?');
      }
      let totalAdded = 0,
        totalSkipped = 0,
        totalConflicts = 0,
        invalidCount = 0,
        validCount = 0;
      (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Starting term import process...');
      for (const slug of slugs) {
        (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Processing import for slug: ${slug}`);
        let existingTerms = await GM_getValue(`wtr_lab_terms_${slug}`, []);
        (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Existing terms for ${slug}: ${existingTerms.length}`);
        let overwrite = true;
        if (existingTerms.length > 0) {
          (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Existing terms found for ${slug}, asking user about merge vs overwrite`);
          overwrite = !confirm(`An existing term list was found for ${slug}. Would you like to merge? (OK = Merge, Cancel = Overwrite)`);
          if (!overwrite) {
            if (!confirm('Are you sure you want to overwrite?')) {
              (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: User cancelled overwrite for ${slug}`);
              continue;
            }
            overwrite = true;
          }
        }
        let rawTerms = termsData[slug] || [];
        (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Raw terms for ${slug}: ${rawTerms.length}`);
        if (!Array.isArray(rawTerms)) {
          (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Skipping ${slug} - not an array`);
          continue;
        }
        let validatedTerms = rawTerms.filter(term => {
          var _term$wholeWord;
          term.wholeWord = (_term$wholeWord = term.wholeWord) !== null && _term$wholeWord !== void 0 ? _term$wholeWord : false;
          if (term.isRegex) {
            try {
              new RegExp(term.original);
              validCount++;
              return true;
            } catch (err) {
              invalidCount++;
              (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Skipping invalid regex term: "${term.original}" - ${err.message}`);
              console.warn(`Skipping invalid regex term on import: "${term.original}"`);
              return false;
            }
          }
          validCount++;
          return true;
        });
        (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Validated terms for ${slug}: ${validatedTerms.length} valid, ${invalidCount} invalid`);
        const {
          added,
          skipped,
          conflicts
        } = await (0, _storage.processAndSaveTerms)(slug, validatedTerms, overwrite);
        totalAdded += added;
        totalSkipped += skipped;
        totalConflicts += conflicts;
        (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Import results for ${slug} - added: ${added}, skipped: ${skipped}, conflicts: ${conflicts}`);
      }
      if (shouldImportSettings) {
        (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Importing settings data...');
        await (0, _storage.processAndSaveSettings)(settingsData);
      }
      (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Reloading data and reprocessing chapters...');
      await (0, _storage.loadData)();
      (0, _observer.reprocessCurrentChapter)();
      (0, _ui.renderTermList)(_state.state.currentSearchValue);
      if (_state.state.isDupMode) (0, _duplicates.updateDupModeAfterChange)();
      let summary = 'Import successful!';
      (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Import completed - totalAdded: ${totalAdded}, totalSkipped: ${totalSkipped}, totalConflicts: ${totalConflicts}, invalidCount: ${invalidCount}, validCount: ${validCount}`);
      if (totalAdded > 0 || totalSkipped > 0 || totalConflicts > 0) {
        summary += `\n${totalAdded} new terms added. ${totalSkipped} duplicates skipped. ${totalConflicts} conflicts skipped.`;
      }
      if (invalidCount > 0) {
        summary += `\n${validCount} terms imported. ${invalidCount} terms skipped due to invalid regex.`;
      }
      alert(summary);
    };
    reader.readAsText(file);
    event.target.value = '';
    (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: File import process initiated');
  } catch (e) {
    (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Import error: ${e.message}`);
    alert('An error occurred during import.');
    console.error(e);
  } finally {
    (0, _ui.hideUILoader)();
  }
}
function handleTabSwitch(e) {
  const targetTab = e.target.dataset.tab;

  // Save current state before switching (if on terms tab)
  const currentTab = document.querySelector('.wtr-replacer-tab-btn.active').dataset.tab;
  if (currentTab === 'terms') {
    (0, _storage.saveSearchFieldValue)();
  }
  document.querySelectorAll('.wtr-replacer-tab-btn').forEach(btn => btn.classList.remove('active'));
  e.target.classList.add('active');
  document.querySelectorAll('.wtr-replacer-tab-content').forEach(content => content.classList.remove('active'));
  document.getElementById(`wtr-tab-${targetTab}`).classList.add('active');
  if (targetTab === 'terms') {
    restoreTermListLocation();
  } else {
    (0, _ui.clearTermList)();
  }
}
async function handleFindDuplicates() {
  (0, _ui.showUILoader)();
  try {
    const TERMS_KEY = `wtr_lab_terms_${_state.state.novelSlug}`;
    const currentNovelTerms = await GM_getValue(TERMS_KEY, []);
    (0, _duplicates.computeDupGroups)(currentNovelTerms);
    if (_state.state.dupKeys.length === 0) {
      alert('No duplicates found.');
      return;
    }
    _state.state.isDupMode = true;
    _state.state.currentDupIndex = 0;
    _state.state.currentSearchValue = '';
    setSearchFieldValue('');
  } finally {
    (0, _ui.hideUILoader)();
  }
}
// Use duplicate functions from duplicates module (imported above)

// Helper function to set search field value programmatically with reactive save
function setSearchFieldValue(value) {
  const searchBar = document.getElementById('wtr-search-bar');
  if (searchBar) {
    searchBar.value = value;
    _state.state.currentSearchValue = value;
    _state.state.currentPage = 1;
    (0, _ui.renderTermList)(_state.state.currentSearchValue);
    (0, _storage.saveSearchFieldValue)();
  }
}
async function restoreTermListLocation() {
  try {
    const saved = await GM_getValue(`wtr_lab_term_list_location_${_state.state.novelSlug}`, null);
    if (saved) {
      _state.state.savedTermListLocation = saved;
    }
    _state.state.currentPage = _state.state.savedTermListLocation.page || 1;
    _state.state.currentSearchValue = _state.state.savedTermListLocation.searchValue || '';

    // Apply the saved state to the UI
    const searchBar = document.getElementById('wtr-search-bar');
    if (searchBar && _state.state.currentSearchValue) {
      searchBar.value = _state.state.currentSearchValue;
    }
    (0, _ui.renderTermList)(_state.state.currentSearchValue);

    // Restore scroll position after a short delay to ensure rendering is complete
    setTimeout(() => {
      const termListContainer = document.querySelector('.wtr-replacer-content');
      if (termListContainer && _state.state.savedTermListLocation.scrollTop) {
        termListContainer.scrollTop = _state.state.savedTermListLocation.scrollTop;
      }
    }, 100);
  } catch (e) {
    console.error('Error restoring term list location:', e);
  }
}
function toggleLogging() {
  _state.state.globalSettings.isLoggingEnabled = !_state.state.globalSettings.isLoggingEnabled;
  (0, _storage.saveGlobalSettings)();
  alert(`Logging ${_state.state.globalSettings.isLoggingEnabled ? 'enabled' : 'disabled'}.`);
}

// Additional functions needed for index.js integration
async function addTermProgrammatically(original, replacement, isRegex = false) {
  if (!original) return;
  const newTerm = {
    id: `term_${Date.now()}`,
    original: original.trim(),
    replacement: replacement.trim(),
    caseSensitive: false,
    isRegex: isRegex,
    wholeWord: isRegex ? false : false
  };
  const isDuplicate = _state.state.terms.some(t => t.original === newTerm.original && t.replacement === newTerm.replacement && t.isRegex === newTerm.isRegex);
  if (!isDuplicate) {
    _state.state.terms.push(newTerm);
    await (0, _storage.saveTerms)(_state.state.terms);
    (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Programmatically added term (Regex: ${isRegex}): ${newTerm.original} -> ${newTerm.replacement}`);
    if (document.querySelector('.wtr-replacer-ui').style.display === 'flex') {
      (0, _ui.renderTermList)(_state.state.currentSearchValue);
    }
  } else {
    (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Skipped adding duplicate term: ${newTerm.original}`);
  }
}

/***/ }),

/***/ "./src/modules/observer.js":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.processVisibleChapter = processVisibleChapter;
exports.reprocessCurrentChapter = reprocessCurrentChapter;
exports.waitForInitialContent = waitForInitialContent;
var _state = __webpack_require__("./src/modules/state.js");
var _engine = __webpack_require__("./src/modules/engine.js");
var _ui = __webpack_require__("./src/modules/ui.js");
var _utils = __webpack_require__("./src/modules/utils.js");
// MutationObserver and content handling for WTR Lab Term Replacer

function waitForInitialContent() {
  (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Starting robust content detection for slow-loading websites...');

  // Set up mutation observer for dynamic content loading
  (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Setting up content change observer');
  setupContentObserver();

  // Set up additional fallback mechanisms
  (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Setting up fallback detection mechanisms');
  setupFallbackDetection();
}
function detectContentWithMultipleStrategies() {
  const detectionStrategies = [
  // Strategy 1: Standard chapter ID detection
  () => {
    const chapterId = (0, _utils.getChapterIdFromUrl)(window.location.href);
    const contentContainer = chapterId ? document.querySelector(`#${chapterId}`) : null;
    return contentContainer ? {
      container: contentContainer,
      strategy: 'chapter-id'
    } : null;
  },
  // Strategy 2: Look for chapter body directly
  () => {
    const CHAPTER_BODY_SELECTOR = ".chapter-body";
    const chapterBody = document.querySelector(CHAPTER_BODY_SELECTOR);
    return chapterBody ? {
      container: chapterBody.closest('[id*="chapter"]'),
      strategy: 'chapter-body'
    } : null;
  },
  // Strategy 3: Look for any container with substantial content
  () => {
    const contentAreas = document.querySelectorAll('main, article, .content, .chapter, [role="main"]');
    for (const area of contentAreas) {
      var _area$textContent;
      if (((_area$textContent = area.textContent) === null || _area$textContent === void 0 ? void 0 : _area$textContent.trim().length) > 200) {
        return {
          container: area,
          strategy: 'content-area'
        };
      }
    }
    return null;
  },
  // Strategy 4: Last resort - any substantial text content
  () => {
    var _document$body$textCo;
    const bodyText = ((_document$body$textCo = document.body.textContent) === null || _document$body$textCo === void 0 ? void 0 : _document$body$textCo.trim()) || '';
    if (bodyText.length > 500 && !bodyText.includes('loading')) {
      return {
        container: document.body,
        strategy: 'body-fallback'
      };
    }
    return null;
  }];
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
        (0, _utils.log)(`WTR Term Replacer: Strategy ${currentStrategy} failed, trying next strategy...`);
      }
    }
  }, 500); // Increased interval for slower polling
}
async function progressiveContentProcessing(container, strategy) {
  (0, _utils.log)(`WTR Term Replacer: Starting progressive processing with strategy: ${strategy}`);

  // Give the page more time to fully load, especially for slow connections
  const settlingDelays = [200, 500, 1000, 2000]; // Progressive delays
  let currentDelayIndex = 0;
  const attemptProcessing = async () => {
    try {
      // Check content readiness with multiple criteria
      if (isContentReadyForProcessing(container)) {
        (0, _utils.log)('WTR Term Replacer: Content ready for processing, proceeding...');
        processVisibleChapter();
        return true;
      } else if (currentDelayIndex < settlingDelays.length - 1) {
        currentDelayIndex++;
        (0, _utils.log)(`WTR Term Replacer: Content not ready, waiting ${settlingDelays[currentDelayIndex]}ms more...`);
        setTimeout(attemptProcessing, settlingDelays[currentDelayIndex]);
        return false;
      } else {
        (0, _utils.log)('WTR Term Replacer: Final attempt with current content state');
        processVisibleChapter(); // Force processing
        return true;
      }
    } catch (error) {
      (0, _utils.log)('WTR Term Replacer: Error during progressive processing:', error);
      return false;
    }
  };
  await attemptProcessing();
}
function isContentReadyForProcessing(container) {
  var _container$textConten;
  // Multiple readiness criteria for robust detection
  const hasSubstantialContent = ((_container$textConten = container.textContent) === null || _container$textConten === void 0 ? void 0 : _container$textConten.trim().length) > 100;
  const hasNoActiveLoaders = !container.querySelector('.loading, .spinner, [style*="loading"], .skeleton');
  const isVisible = container.offsetWidth > 0 && container.offsetHeight > 0;
  const CHAPTER_BODY_SELECTOR = ".chapter-body";
  const hasChapterContent = container.querySelector(CHAPTER_BODY_SELECTOR) || container.querySelector('p, h1, h2, h3, h4, h5, h6');
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
            var _node$textContent, _node$hasAttribute, _node$hasAttribute2, _node$hasAttribute3, _node$hasAttribute4, _node$id, _node$className;
            const textContent = ((_node$textContent = node.textContent) === null || _node$textContent === void 0 ? void 0 : _node$textContent.trim()) || '';

            // Detect multi-script data attributes being added
            if ((_node$hasAttribute = node.hasAttribute) !== null && _node$hasAttribute !== void 0 && _node$hasAttribute.call(node, 'data-smart-quotes-processed')) {
              detectedScriptChanges.push('Smart Quotes');
              shouldCheckForContent = true;
            }
            if ((_node$hasAttribute2 = node.hasAttribute) !== null && _node$hasAttribute2 !== void 0 && _node$hasAttribute2.call(node, 'data-uncensor-processed')) {
              detectedScriptChanges.push('Uncensor');
              shouldCheckForContent = true;
            }
            if ((_node$hasAttribute3 = node.hasAttribute) !== null && _node$hasAttribute3 !== void 0 && _node$hasAttribute3.call(node, 'data-auto-scroll') || (_node$hasAttribute4 = node.hasAttribute) !== null && _node$hasAttribute4 !== void 0 && _node$hasAttribute4.call(node, 'data-reader-enhanced')) {
              detectedScriptChanges.push('Reader Enhancer');
              shouldCheckForContent = true;
            }

            // More strict content validation to reduce false positives
            if (textContent.length > 100 && !textContent.includes('loading') && !textContent.includes('...') && ((_node$id = node.id) !== null && _node$id !== void 0 && _node$id.includes('chapter') || (_node$className = node.className) !== null && _node$className !== void 0 && _node$className.includes('chapter') || node.querySelector('.chapter-body'))) {
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
        (0, _utils.log)(`WTR Term Replacer: Multi-script activity detected from: ${detectedScriptChanges.join(', ')} (conflict ${potentialMultiScriptConflicts})`);

        // Update our detected scripts
        detectedScriptChanges.forEach(script => _state.state.otherWTRScripts.add(script));
      } else {
        (0, _utils.log)('WTR Term Replacer: Content changes detected, checking for chapter content...');
      }

      // Debounced check to avoid excessive processing with enhanced delay for multi-script
      const baseDelay = 1500;
      const multiScriptDelay = _state.state.otherWTRScripts.size > 0 ? 2500 : baseDelay;
      clearTimeout(observerTimeout);
      observerTimeout = setTimeout(() => {
        const queuedForProcessing = document.querySelector('[data-wtr-processed]') || _state.state.processingQueue.size > 0;
        if (!queuedForProcessing) {
          (0, _utils.log)(`WTR Term Replacer: Initiating content processing (${_state.state.otherWTRScripts.size} other scripts active, ${multiScriptDelay}ms coordination delay)`);
          processVisibleChapter();
        } else {
          (0, _utils.log)(`WTR Term Replacer: Skipping content processing - already in progress or completed (queue: ${_state.state.processingQueue.size})`);
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
  (0, _utils.log)('WTR Term Replacer: Enhanced content observer activated with multi-script coordination');
}
function setupFallbackDetection() {
  // Periodic fallback check for stubborn slow-loading pages
  let fallbackAttempts = 0;
  const maxFallbackAttempts = 10;
  const fallbackInterval = setInterval(() => {
    var _potentialContent$tex;
    if (document.querySelector('[data-wtr-processed]')) {
      clearInterval(fallbackInterval);
      return;
    }
    fallbackAttempts++;
    (0, _utils.log)(`WTR Term Replacer: Fallback attempt ${fallbackAttempts}/${maxFallbackAttempts}`);

    // Try processing if we have any chapter-like content
    const chapterId = (0, _utils.getChapterIdFromUrl)(window.location.href);
    if (chapterId) {
      const CHAPTER_BODY_SELECTOR = ".chapter-body";
      const chapterSelector = `#${chapterId} ${CHAPTER_BODY_SELECTOR}`;
      const chapterBody = document.querySelector(chapterSelector);
      if (chapterBody) {
        (0, _utils.log)('WTR Term Replacer: Fallback processing successful');
        processVisibleChapter();
        clearInterval(fallbackInterval);
        return;
      }
    }

    // Check for any substantial content that might be chapter content
    const potentialContent = document.querySelector('main, article, .content, .chapter');
    if (potentialContent && ((_potentialContent$tex = potentialContent.textContent) === null || _potentialContent$tex === void 0 ? void 0 : _potentialContent$tex.trim().length) > 200) {
      (0, _utils.log)('WTR Term Replacer: Fallback processing with detected content');
      processVisibleChapter();
      clearInterval(fallbackInterval);
    }
    if (fallbackAttempts >= maxFallbackAttempts) {
      clearInterval(fallbackInterval);
      (0, _utils.log)('WTR Term Replacer: Fallback detection exhausted');
    }
  }, 3000); // Check every 3 seconds

  // Clear fallback interval after 5 minutes to prevent infinite polling
  setTimeout(() => {
    clearInterval(fallbackInterval);
  }, 300000);
}
function processVisibleChapter() {
  const chapterId = (0, _utils.getChapterIdFromUrl)(window.location.href);
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
  if (_state.state.processingQueue.has(chapterId)) {
    (0, _utils.log)(`WTR Term Replacer: Chapter ${chapterId} already queued for processing ${_state.state.processingQueue.size} queued`);
    return;
  }

  // Add with unique identifier to prevent race conditions
  _state.state.processingQueue.add(processingKey);

  // Progressive retry with exponential backoff for slow-loading content
  const retryAttempts = [{
    delay: 100,
    maxContentLoad: 0.3
  },
  // Fast retry for quick loads
  {
    delay: 500,
    maxContentLoad: 0.5
  },
  // Medium retry for normal loads
  {
    delay: 1000,
    maxContentLoad: 0.7
  },
  // Slower retry for slow loads
  {
    delay: 2000,
    maxContentLoad: 0.9
  },
  // Very slow retry for very slow loads
  {
    delay: 5000,
    maxContentLoad: 1.0
  } // Final attempt with any content
  ];
  executeProcessingWithRetry(chapterId, retryAttempts, 0, processingKey);
}
async function executeProcessingWithRetry(chapterId, retryAttempts, attemptIndex, processingKey) {
  const attempt = retryAttempts[attemptIndex];
  try {
    // Wait for the specified delay
    await new Promise(resolve => setTimeout(resolve, attempt.delay));

    // Verify queue entry still exists (prevent race conditions)
    if (!_state.state.processingQueue.has(processingKey)) {
      (0, _utils.log)(`WTR Term Replacer: Chapter ${chapterId} processing cancelled (no longer in queue)`);
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
      _state.state.processingQueue.delete(processingKey);
      (0, _utils.log)(`WTR Term Replacer: Successfully processed chapter ${chapterId} on attempt ${attemptIndex + 1}`);
    } else if (attemptIndex < retryAttempts.length - 1) {
      // Retry with next attempt
      (0, _utils.log)(`WTR Term Replacer: Chapter ${chapterId} content not ready (load level: ${contentLoadLevel.toFixed(2)}), retrying...`);
      executeProcessingWithRetry(chapterId, retryAttempts, attemptIndex + 1, processingKey);
    } else {
      // Final attempt with any available content
      (0, _utils.log)(`WTR Term Replacer: Final attempt for chapter ${chapterId} with available content`);
      await performRobustReplacements(chapterBody, chapterId, true); // force processing
      _state.state.processingQueue.delete(processingKey);
    }
  } catch (error) {
    (0, _utils.log)(`WTR Term Replacer: Error processing chapter ${chapterId} on attempt ${attemptIndex + 1}:`, error);
    if (attemptIndex < retryAttempts.length - 1) {
      executeProcessingWithRetry(chapterId, retryAttempts, attemptIndex + 1, processingKey);
    } else {
      _state.state.processingQueue.delete(processingKey);
      console.error(`WTR Term Replacer: Failed to process chapter ${chapterId} after all retries`);
    }
  }
}
function estimateContentLoadLevel(chapterBody) {
  var _chapterBody$textCont, _chapterBody$textCont2, _chapterBody$textCont3;
  // Estimate how much content is loaded based on text density and structure
  const textNodes = chapterBody.querySelectorAll('p, h1, h2, h3, h4, h5, h6, div, span');
  const totalTextLength = Array.from(textNodes).reduce((total, node) => {
    var _node$textContent2;
    return total + (((_node$textContent2 = node.textContent) === null || _node$textContent2 === void 0 ? void 0 : _node$textContent2.trim().length) || 0);
  }, 0);

  // Check for loading indicators or placeholder content
  const hasLoadingIndicators = chapterBody.querySelector('.loading, .spinner, [style*="loading"], [class*="loading"]');
  const hasPlaceholderContent = ((_chapterBody$textCont = chapterBody.textContent) === null || _chapterBody$textCont === void 0 ? void 0 : _chapterBody$textCont.includes('Loading...')) || ((_chapterBody$textCont2 = chapterBody.textContent) === null || _chapterBody$textCont2 === void 0 ? void 0 : _chapterBody$textCont2.includes('loading')) || ((_chapterBody$textCont3 = chapterBody.textContent) === null || _chapterBody$textCont3 === void 0 ? void 0 : _chapterBody$textCont3.includes('...'));

  // Calculate load level based on content density and absence of loading indicators
  let loadLevel = Math.min(totalTextLength / 1000, 1.0); // Normalize to 0-1 based on 1000 chars

  if (hasLoadingIndicators || hasPlaceholderContent) {
    loadLevel *= 0.3; // Reduce load level if loading indicators present
  }

  // Ensure minimum threshold for processing
  return Math.max(loadLevel, totalTextLength > 100 ? 0.5 : 0.1);
}
function detectOtherWTRScripts() {
  (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Scanning for other WTR Lab scripts...');

  // Detect other WTR Lab scripts by their data attributes or specific patterns
  const scripts = document.querySelectorAll('[data-smart-quotes-processed], [data-uncensor-processed], [data-auto-scroll], [data-reader-enhanced]');
  (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Found ${scripts.length} elements with WTR script attributes`);
  scripts.forEach(el => {
    if (el.hasAttribute('data-smart-quotes-processed')) {
      _state.state.otherWTRScripts.add('Smart Quotes');
      (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Detected Smart Quotes script');
    }
    if (el.hasAttribute('data-uncensor-processed')) {
      _state.state.otherWTRScripts.add('Uncensor');
      (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Detected Uncensor script');
    }
    if (el.hasAttribute('data-auto-scroll') || el.hasAttribute('data-reader-enhanced')) {
      _state.state.otherWTRScripts.add('Reader Enhancer');
      (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Detected Reader Enhancer script');
    }
  });
  if (_state.state.otherWTRScripts.size > 0) {
    (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Multi-script environment detected - Active scripts: ${Array.from(_state.state.otherWTRScripts).join(', ')}`);
  } else {
    (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: No other WTR scripts detected, running in single-script mode');
  }
}
function startProcessingTimer(operation) {
  (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Starting processing timer for ${operation}`);
  _state.state.processingStartTime.set(operation, Date.now());
}
function endProcessingTimer(operation, chapterId) {
  const startTime = _state.state.processingStartTime.get(operation);
  if (startTime) {
    const processingTime = Date.now() - startTime;
    const isMultiScript = _state.state.otherWTRScripts.size > 0;
    (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Processing timer ended for ${operation}, took ${processingTime}ms`);
    logProcessingWithMultiScriptContext(chapterId, processingTime, isMultiScript);
    _state.state.processingStartTime.delete(operation);
    return processingTime;
  }
  (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Warning - processing timer for ${operation} not found`);
  return 0;
}
function logProcessingWithMultiScriptContext(chapterId, processingTime, isMultiScript = false) {
  const context = {
    chapterId,
    processingTime: `${processingTime}ms`,
    multiScriptEnvironment: isMultiScript,
    activeScripts: _state.state.otherWTRScripts.size,
    queueSize: _state.state.processingQueue.size,
    timestamp: new Date().toISOString()
  };
  if (isMultiScript && _state.state.otherWTRScripts.size > 0) {
    context.activeScripts = Array.from(_state.state.otherWTRScripts);
    (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Multi-script enhanced processing completed`, context);
  } else {
    (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Standard processing completed`, context);
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
    if (_state.state.otherWTRScripts.size === 0) {
      detectOtherWTRScripts();
    }
    const isMultiScript = _state.state.otherWTRScripts.size > 0;
    if (isMultiScript) {
      (0, _utils.log)(`WTR Term Replacer: Multi-script processing starting for chapter ${chapterId} with active scripts: ${Array.from(_state.state.otherWTRScripts).join(', ')}`);
    } else {
      (0, _utils.log)(`WTR Term Replacer: Processing chapter ${chapterId} with robust method`);
    }
    (0, _engine.performReplacements)(chapterBody);
    chapterBody.dataset.wtrProcessed = 'true';
    (0, _ui.addMenuButton)();
    const processingTime = endProcessingTimer(`chapter_${chapterId}`, chapterId);
    if (isMultiScript) {
      (0, _utils.log)(`WTR Term Replacer: Successfully completed multi-script processing for chapter ${chapterId} in ${processingTime}ms`);
    }
  } catch (error) {
    const processingTime = endProcessingTimer(`chapter_${chapterId}`, chapterId) || 0;
    (0, _utils.log)(`WTR Term Replacer: Robust processing failed for chapter ${chapterId} after ${processingTime}ms:`, error);
    throw error;
  }
}
function isElementReadyForProcessing(element) {
  var _element$textContent;
  // Check if element is visible and has substantial content
  const rect = element.getBoundingClientRect();
  const isVisible = rect.width > 0 && rect.height > 0;
  const hasSubstantialContent = ((_element$textContent = element.textContent) === null || _element$textContent === void 0 ? void 0 : _element$textContent.trim().length) > 50;
  const hasNoLoadingStates = !element.querySelector('.loading, .spinner, [style*="display: none"]');
  return isVisible && hasSubstantialContent && hasNoLoadingStates;
}
function reprocessCurrentChapter() {
  const chapterId = (0, _utils.getChapterIdFromUrl)(window.location.href);
  if (!chapterId) return;
  const CHAPTER_BODY_SELECTOR = ".chapter-body";
  const chapterSelector = `#${chapterId} ${CHAPTER_BODY_SELECTOR}`;
  const chapterBody = document.querySelector(chapterSelector);
  if (chapterBody) {
    // Reset processing state to allow reprocessing
    chapterBody.dataset.wtrProcessed = 'false';

    // Clear any existing processing entries for this chapter
    const existingKeys = Array.from(_state.state.processingQueue).filter(key => key.startsWith(chapterId));
    existingKeys.forEach(key => _state.state.processingQueue.delete(key));

    // Use robust reprocessing with retry mechanism
    scheduleChapterProcessing(chapterId, chapterBody);
  }
}
function monitorURLChanges() {
  setInterval(() => {
    if (window.location.href !== _state.state.currentURL) {
      (0, _utils.log)(`WTR Term Replacer: URL changed to ${window.location.href}.`);
      _state.state.currentURL = window.location.href;
      setTimeout(processVisibleChapter, 250);
    }
  }, 500);
}

/***/ }),

/***/ "./src/modules/state.js":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.initializeState = initializeState;
exports.setNovelSlug = setNovelSlug;
exports.state = void 0;
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
// State management for WTR Lab Term Replacer

const state = exports.state = {
  novelSlug: null,
  terms: [],
  settings: {
    isDisabled: false
  },
  globalSettings: {
    isLoggingEnabled: false
  },
  importType: "novel",
  currentSearchValue: "",
  isDupMode: false,
  dupGroups: new Map(),
  dupKeys: [],
  currentDupIndex: 0,
  currentPage: 1,
  savedTermListLocation: {
    page: 1,
    scrollTop: 0,
    searchValue: ""
  },
  originalTextNodes: new WeakMap(),
  otherWTRScripts: new Set(),
  processingStartTime: new Map(),
  domConflictDetected: false,
  multiScriptPerformanceImpact: new Map(),
  currentURL: window.location.href,
  processingQueue: new Set(),
  isProcessingInProgress: false,
  observedMenuContainers: new WeakSet()
};

// Function to initialize novel slug - should be called after utils is loaded
function initializeState() {
  if (!state.novelSlug) {
    // Import getNovelSlug function dynamically to avoid circular dependencies
    Promise.resolve().then(() => _interopRequireWildcard(__webpack_require__("./src/modules/utils.js"))).then(({
      getNovelSlug
    }) => {
      state.novelSlug = getNovelSlug();
    });
  }
  return state.novelSlug;
}

// Set novel slug (for synchronous initialization)
function setNovelSlug(slug) {
  state.novelSlug = slug;
}

/***/ }),

/***/ "./src/modules/storage.js":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.getTermKey = getTermKey;
exports.loadData = loadData;
exports.loadGlobalSettings = loadGlobalSettings;
exports.loadTermListLocation = loadTermListLocation;
exports.processAndSaveSettings = processAndSaveSettings;
exports.processAndSaveTerms = processAndSaveTerms;
exports.saveGlobalSettings = saveGlobalSettings;
exports.saveSearchFieldValue = saveSearchFieldValue;
exports.saveSettings = saveSettings;
exports.saveTermListLocation = saveTermListLocation;
exports.saveTerms = saveTerms;
var _state = __webpack_require__("./src/modules/state.js");
var C = _interopRequireWildcard(__webpack_require__("./src/modules/config.js"));
var _utils = __webpack_require__("./src/modules/utils.js");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
// Storage functions using GM_* API for WTR Lab Term Replacer

async function loadGlobalSettings() {
  try {
    _state.state.globalSettings = await GM_getValue(C.GLOBAL_SETTINGS_KEY, {
      isLoggingEnabled: false
    });
    (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Global settings loaded');
  } catch (e) {
    console.error('Error loading global settings:', e);
    _state.state.globalSettings = {
      isLoggingEnabled: false
    };
  }
}
async function saveGlobalSettings() {
  try {
    await GM_setValue(C.GLOBAL_SETTINGS_KEY, _state.state.globalSettings);
    (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Global settings saved');
  } catch (e) {
    console.error('Error saving global settings:', e);
  }
}
async function loadTermListLocation() {
  try {
    const saved = await GM_getValue(`${C.CURRENT_LOCATION_KEY}_${_state.state.novelSlug}`, null);
    if (saved) {
      _state.state.savedTermListLocation = saved;
    }
  } catch (e) {
    console.error('Error loading term list location:', e);
    _state.state.savedTermListLocation = {
      page: 1,
      scrollTop: 0,
      searchValue: ""
    };
  }
}
async function saveTermListLocation() {
  try {
    const termListContainer = document.querySelector('.wtr-replacer-content');
    if (termListContainer) {
      // Capture more detailed location information for better preservation
      const locationData = {
        page: _state.state.currentPage,
        scrollTop: termListContainer.scrollTop,
        scrollHeight: termListContainer.scrollHeight,
        clientHeight: termListContainer.clientHeight,
        searchValue: _state.state.currentSearchValue,
        timestamp: Date.now() // Add timestamp for better tracking
      };
      await GM_setValue(`${C.CURRENT_LOCATION_KEY}_${_state.state.novelSlug}`, locationData);
      _state.state.savedTermListLocation = locationData;
      (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Saved scroll position - top: ${locationData.scrollTop}, page: ${locationData.page}`);
    }
  } catch (e) {
    console.error('Error saving term list location:', e);
  }
}

// Helper function to save search field value immediately
async function saveSearchFieldValue() {
  try {
    const locationData = {
      page: _state.state.currentPage,
      scrollTop: 0,
      searchValue: _state.state.currentSearchValue
    };
    await GM_setValue(`${C.CURRENT_LOCATION_KEY}_${_state.state.novelSlug}`, locationData);
    _state.state.savedTermListLocation = locationData;
  } catch (e) {
    console.error('Error saving search field value:', e);
  }
}
async function loadData() {
  try {
    const TERMS_KEY = `${C.TERMS_STORAGE_KEY_PREFIX}${_state.state.novelSlug}`;
    const SETTINGS_KEY = `${C.SETTINGS_STORAGE_KEY_PREFIX}${_state.state.novelSlug}`;
    _state.state.terms = await GM_getValue(TERMS_KEY, []);
    _state.state.terms.forEach(t => {
      var _t$wholeWord;
      t.wholeWord = (_t$wholeWord = t.wholeWord) !== null && _t$wholeWord !== void 0 ? _t$wholeWord : false;
    });
    const savedSettings = await GM_getValue(SETTINGS_KEY, {});
    _state.state.settings = {
      isDisabled: false,
      ...savedSettings
    };
  } catch (e) {
    console.error('Error loading data:', e);
    _state.state.terms = [];
    _state.state.settings = {
      isDisabled: false
    };
  }
}
async function saveTerms(termsToSave) {
  try {
    const TERMS_KEY = `${C.TERMS_STORAGE_KEY_PREFIX}${_state.state.novelSlug}`;
    await GM_setValue(TERMS_KEY, termsToSave);
    _state.state.terms = termsToSave;
    (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Saved ${termsToSave.length} terms for novel ${_state.state.novelSlug}`);
  } catch (e) {
    console.error('Error saving terms:', e);
    (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Failed to save terms: ${e.message}`);
    alert('Failed to save terms. Storage might be full.');
  }
}
async function saveSettings(settingsToSave) {
  try {
    const SETTINGS_KEY = `${C.SETTINGS_STORAGE_KEY_PREFIX}${_state.state.novelSlug}`;
    await GM_setValue(SETTINGS_KEY, settingsToSave);
    _state.state.settings = settingsToSave;
    (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Settings saved successfully');
  } catch (e) {
    console.error('Error saving settings:', e);
    (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Failed to save settings: ${e.message}`);
    alert('Failed to save settings. Storage might be full.');
  }
}
function getTermKey(term) {
  return `${term.original}|${term.caseSensitive}|${term.isRegex}`;
}
async function processAndSaveTerms(slug, importedTerms, overwrite = true) {
  (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Processing import for slug ${slug}, overwrite: ${overwrite}`);
  const TERMS_KEY = `${C.TERMS_STORAGE_KEY_PREFIX}${slug}`;
  let existingTerms = await GM_getValue(TERMS_KEY, []);
  existingTerms.forEach(t => {
    var _t$wholeWord2;
    t.wholeWord = (_t$wholeWord2 = t.wholeWord) !== null && _t$wholeWord2 !== void 0 ? _t$wholeWord2 : false;
  });
  let newTerms = [];
  let added = 0;
  let skipped = 0;
  let conflicts = 0;
  if (overwrite) {
    (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Overwrite mode - importing ${importedTerms.length} terms`);
    newTerms = importedTerms;
  } else {
    const existingMap = new Map();
    existingTerms.forEach(t => existingMap.set(getTermKey(t), t));
    importedTerms.forEach(imp => {
      const key = getTermKey(imp);
      if (!existingMap.has(key)) {
        newTerms.push(imp);
        added++;
      } else {
        const ext = existingMap.get(key);
        if (ext.replacement !== imp.replacement || ext.wholeWord !== imp.wholeWord) {
          conflicts++;
        } else {
          skipped++;
        }
      }
    });
    newTerms = [...existingTerms, ...newTerms];
    (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Merge mode - added: ${added}, skipped: ${skipped}, conflicts: ${conflicts}`);
  }
  await GM_setValue(TERMS_KEY, newTerms);
  if (slug === _state.state.novelSlug) {
    _state.state.terms = newTerms;
  }
  (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Import complete for ${slug} - total terms: ${newTerms.length}`);
  return {
    added,
    skipped,
    conflicts
  };
}
async function processAndSaveSettings(importedSettings) {
  (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Processing settings import for ${Object.keys(importedSettings).length} slugs`);
  for (const slug in importedSettings) {
    const SETTINGS_KEY = `${C.SETTINGS_STORAGE_KEY_PREFIX}${slug}`;
    const existing = await GM_getValue(SETTINGS_KEY, {
      isDisabled: false
    });
    const newSettings = {
      ...existing,
      ...importedSettings[slug]
    };
    await GM_setValue(SETTINGS_KEY, newSettings);
    if (slug === _state.state.novelSlug) {
      _state.state.settings = newSettings;
    }
    (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Settings updated for slug ${slug}`);
  }
}

/***/ }),

/***/ "./src/modules/ui.js":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.addMenuButton = addMenuButton;
exports.clearTermList = clearTermList;
exports.createUI = createUI;
exports.hideUILoader = hideUILoader;
exports.hideUIPanel = hideUIPanel;
exports.renderTermList = renderTermList;
exports.showFormView = showFormView;
exports.showProcessingIndicator = showProcessingIndicator;
exports.showUILoader = showUILoader;
exports.showUIPanel = showUIPanel;
exports.switchTab = switchTab;
var _state = __webpack_require__("./src/modules/state.js");
var Handlers = _interopRequireWildcard(__webpack_require__("./src/modules/handlers.js"));
var _utils = __webpack_require__("./src/modules/utils.js");
var _config = __webpack_require__("./src/modules/config.js");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
// UI creation and manipulation for WTR Lab Term Replacer
// Hot reload test - development workflow verification

const UI_HTML = `
    <div class="wtr-replacer-header">
        <h2>Term Replacer v5.4</h2>
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
            </div>
            <div class="wtr-replacer-form-group">
                <label for="wtr-replacement">Replacement Text</label>
                <input type="text" id="wtr-replacement">
            </div>
            <div class="wtr-replacer-form-group">
                <label><input type="checkbox" id="wtr-case-sensitive"> Case Sensitive</label>
                <label><input type="checkbox" id="wtr-is-regex"> Use Regex</label>
                <label><input type="checkbox" id="wtr-whole-word" disabled> Whole Word Only</label>
            </div>
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
function createUI() {
  if (document.querySelector('.wtr-replacer-ui')) return;
  GM_addStyle(UI_CSS);
  const uiContainer = document.createElement('div');
  uiContainer.className = 'wtr-replacer-ui';
  uiContainer.innerHTML = UI_HTML;
  document.body.appendChild(uiContainer);
  const processingOverlay = document.createElement('div');
  processingOverlay.className = 'wtr-processing-overlay';
  processingOverlay.textContent = 'Processing...';
  document.body.appendChild(processingOverlay);

  // Event Listeners
  uiContainer.querySelector('.wtr-replacer-close-btn').addEventListener('click', Handlers.hideUIPanel);
  uiContainer.querySelector('#wtr-disable-all').addEventListener('change', Handlers.handleDisableToggle);
  uiContainer.querySelector('#wtr-save-btn').addEventListener('click', Handlers.handleSaveTerm);
  uiContainer.querySelector('#wtr-delete-selected-btn').addEventListener('click', Handlers.handleDeleteSelected);
  uiContainer.querySelector('#wtr-search-bar').addEventListener('input', Handlers.handleSearch);
  uiContainer.querySelector('.wtr-replacer-term-list').addEventListener('click', Handlers.handleListInteraction);
  uiContainer.querySelectorAll('.wtr-replacer-tab-btn').forEach(btn => btn.addEventListener('click', Handlers.handleTabSwitch));
  uiContainer.querySelector('#wtr-export-novel-btn').addEventListener('click', Handlers.handleExportNovel);
  uiContainer.querySelector('#wtr-export-all-btn').addEventListener('click', Handlers.handleExportAll);
  uiContainer.querySelector('#wtr-export-combined-btn').addEventListener('click', Handlers.handleExportCombined);
  uiContainer.querySelector('#wtr-import-novel-btn').addEventListener('click', () => {
    _state.state.importType = 'novel';
    document.getElementById('wtr-file-input').click();
  });
  uiContainer.querySelector('#wtr-import-all-btn').addEventListener('click', () => {
    _state.state.importType = 'all';
    document.getElementById('wtr-file-input').click();
  });
  uiContainer.querySelector('#wtr-file-input').addEventListener('change', Handlers.handleFileImport);
  uiContainer.querySelector('#wtr-find-duplicates-btn').addEventListener('click', Handlers.handleFindDuplicates);
  uiContainer.querySelector('#wtr-prev-dup-btn').addEventListener('click', () => Handlers.changeDupGroup(-1));
  uiContainer.querySelector('#wtr-next-dup-btn').addEventListener('click', () => Handlers.changeDupGroup(1));
  uiContainer.querySelector('#wtr-exit-dup-btn').addEventListener('click', Handlers.exitDupMode);

  // Add scroll event listener to save term list location
  const contentArea = uiContainer.querySelector('.wtr-replacer-content');
  if (contentArea) {
    let scrollTimeout;
    contentArea.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (document.querySelector('.wtr-replacer-tab-btn.active').dataset.tab === 'terms') {
          Handlers.saveTermListLocation();
        }
      }, 1000); // Save after 1 second of inactivity
    });
  }

  // Character-based auto-resize for original text field
  const regexCheckbox = uiContainer.querySelector('#wtr-is-regex');
  const wholeWordCheckbox = uiContainer.querySelector('#wtr-whole-word');
  regexCheckbox.addEventListener('change', e => {
    wholeWordCheckbox.disabled = e.target.checked;
    if (e.target.checked) wholeWordCheckbox.checked = false;
  });
  const originalTextarea = uiContainer.querySelector('#wtr-original');
  function autoResizeTextarea() {
    if (!originalTextarea) return;
    const text = originalTextarea.value;
    const charCount = text.length;
    const lines = Math.ceil(charCount / 40);
    const maxLines = Infinity;
    const finalLines = Math.min(lines, maxLines);
    originalTextarea.rows = Math.max(1, finalLines);
  }
  originalTextarea.addEventListener('input', autoResizeTextarea);
  originalTextarea.addEventListener('focus', autoResizeTextarea);

  // Real-time regex validation system
  const saveButton = uiContainer.querySelector('#wtr-save-btn');
  const replacementInput = uiContainer.querySelector('#wtr-replacement');
  function updateValidationVisual(state) {
    // Remove all validation classes
    originalTextarea.classList.remove('wtr-field-invalid', 'wtr-field-valid');
    if (state === 'invalid') {
      originalTextarea.classList.add('wtr-field-invalid');
    } else if (state === 'valid') {
      originalTextarea.classList.add('wtr-field-valid');
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
    const validation = Handlers.validateRegexSilent(originalText);
    if (validation.isValid) {
      updateValidationVisual('valid');
      saveButton.disabled = !isValidInput;
    } else {
      updateValidationVisual('invalid');
      saveButton.disabled = true;
    }
  }

  // Add real-time validation listeners
  originalTextarea.addEventListener('input', validateAndUpdateUI);
  replacementInput.addEventListener('input', validateAndUpdateUI);
  regexCheckbox.addEventListener('change', validateAndUpdateUI);

  // Initial validation state
  validateAndUpdateUI();

  // Create floating action button
  const addTermFloatBtn = document.createElement('button');
  addTermFloatBtn.className = 'wtr-add-term-float-btn';
  addTermFloatBtn.textContent = 'Add Term';
  document.body.appendChild(addTermFloatBtn);
  addTermFloatBtn.addEventListener('click', Handlers.handleAddTermFromSelection);
  document.addEventListener('mouseup', Handlers.handleTextSelection);
  document.addEventListener('touchend', Handlers.handleTextSelection);

  // Pagination Listeners
  uiContainer.querySelector('#wtr-first-page-btn').addEventListener('click', () => {
    if (_state.state.currentPage > 1) {
      _state.state.currentPage = 1;
      renderTermList(_state.state.currentSearchValue);
    }
  });
  uiContainer.querySelector('#wtr-prev-page-btn').addEventListener('click', () => {
    if (_state.state.currentPage > 1) {
      _state.state.currentPage--;
      renderTermList(_state.state.currentSearchValue);
    }
  });
  uiContainer.querySelector('#wtr-next-page-btn').addEventListener('click', () => {
    const filteredTerms = _state.state.terms.filter(t => t.original.toLowerCase().includes(_state.state.currentSearchValue.toLowerCase()) || t.replacement.toLowerCase().includes(_state.state.currentSearchValue.toLowerCase()));
    const totalPages = Math.ceil(filteredTerms.length / _config.ITEMS_PER_PAGE) || 1;
    if (_state.state.currentPage < totalPages) {
      _state.state.currentPage++;
      renderTermList(_state.state.currentSearchValue);
    }
  });
  uiContainer.querySelector('#wtr-last-page-btn').addEventListener('click', () => {
    const filteredTerms = _state.state.terms.filter(t => t.original.toLowerCase().includes(_state.state.currentSearchValue.toLowerCase()) || t.replacement.toLowerCase().includes(_state.state.currentSearchValue.toLowerCase()));
    const totalPages = Math.ceil(filteredTerms.length / _config.ITEMS_PER_PAGE) || 1;
    if (_state.state.currentPage < totalPages) {
      _state.state.currentPage = totalPages;
      renderTermList(_state.state.currentSearchValue);
    }
  });
  (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: UI created successfully');
}
function showProcessingIndicator(show) {
  const overlay = document.querySelector('.wtr-processing-overlay');
  if (overlay) overlay.style.display = show ? 'flex' : 'none';
}
function showUILoader() {
  const loader = document.getElementById('wtr-ui-loader');
  if (loader) loader.style.display = 'flex';
  const content = document.querySelector('.wtr-replacer-content');
  if (content) content.style.pointerEvents = 'none';
}
function hideUILoader() {
  const loader = document.getElementById('wtr-ui-loader');
  if (loader) loader.style.display = 'none';
  const content = document.querySelector('.wtr-replacer-content');
  if (content) content.style.pointerEvents = 'auto';
}
function renderTermList(filter = '') {
  const listEl = document.querySelector('.wtr-replacer-term-list');
  const paginationControls = document.querySelector('.wtr-pagination-controls');
  const pageIndicator = document.getElementById('wtr-page-indicator');
  const firstBtn = document.getElementById('wtr-first-page-btn');
  const prevBtn = document.getElementById('wtr-prev-page-btn');
  const nextBtn = document.getElementById('wtr-next-page-btn');
  const lastBtn = document.getElementById('wtr-last-page-btn');
  const contentArea = document.querySelector('.wtr-replacer-content');
  if (!listEl || !paginationControls || !pageIndicator || !prevBtn || !nextBtn || !firstBtn || !lastBtn) return;

  // Capture current scroll position before re-rendering
  const previousScrollTop = contentArea ? contentArea.scrollTop : 0;
  const shouldRestoreScroll = previousScrollTop > 0 && !_state.state.isDupMode && filter === _state.state.currentSearchValue;
  listEl.innerHTML = '';
  let filteredTerms;
  let termsToRender;
  if (_state.state.isDupMode) {
    const currentKey = _state.state.dupKeys[_state.state.currentDupIndex];
    filteredTerms = _state.state.dupGroups.get(currentKey) || [];
    document.getElementById('wtr-dup-message').textContent = `Duplicate group ${_state.state.currentDupIndex + 1} of ${_state.state.dupKeys.length} — ${currentKey}`;
    document.getElementById('wtr-dup-message').style.display = 'block';
    document.getElementById('wtr-dup-controls').style.display = 'flex';
    document.getElementById('wtr-prev-dup-btn').disabled = _state.state.currentDupIndex === 0;
    document.getElementById('wtr-next-dup-btn').disabled = _state.state.currentDupIndex === _state.state.dupKeys.length - 1;
    document.getElementById('wtr-search-bar').disabled = true;
    paginationControls.style.display = 'none';
    termsToRender = filteredTerms;
  } else {
    const filterLower = filter.toLowerCase();
    filteredTerms = _state.state.terms.filter(t => t.original.toLowerCase().includes(filterLower) || t.replacement.toLowerCase().includes(filterLower));
    document.getElementById('wtr-dup-message').style.display = 'none';
    document.getElementById('wtr-dup-controls').style.display = 'none';
    document.getElementById('wtr-search-bar').disabled = false;
    const totalPages = Math.ceil(filteredTerms.length / _config.ITEMS_PER_PAGE) || 1;
    _state.state.currentPage = Math.max(1, Math.min(_state.state.currentPage, totalPages));
    const start = (_state.state.currentPage - 1) * _config.ITEMS_PER_PAGE;
    const end = start + _config.ITEMS_PER_PAGE;
    termsToRender = filteredTerms.slice(start, end);
    if (totalPages > 1) {
      paginationControls.style.display = 'flex';
      pageIndicator.textContent = `Page ${_state.state.currentPage} of ${totalPages}`;
      firstBtn.disabled = _state.state.currentPage === 1;
      prevBtn.disabled = _state.state.currentPage === 1;
      nextBtn.disabled = _state.state.currentPage === totalPages;
      lastBtn.disabled = _state.state.currentPage === totalPages;
    } else {
      paginationControls.style.display = 'none';
    }
  }
  if (termsToRender.length === 0) {
    listEl.innerHTML = _state.state.terms.length === 0 ? '<li>No terms defined.</li>' : '<li>No terms match search.</li>';
  } else {
    const fragment = document.createDocumentFragment();
    termsToRender.forEach(term => {
      const li = document.createElement('li');
      li.className = 'wtr-replacer-term-item';
      li.dataset.id = term.id;
      li.innerHTML = `
        <input type="checkbox" class="wtr-replacer-term-select" data-id="${term.id}">
        <div class="wtr-replacer-term-details">
          <div class="wtr-replacer-term-text">
            <span class="wtr-term-original">${term.original}</span> → <span class="wtr-term-replacement">${term.replacement}</span>
          </div>
          <div>${term.caseSensitive ? '<small>CS</small>' : ''} ${term.isRegex ? '<small>RX</small>' : ''} ${term.wholeWord ? '<small>WW</small>' : ''}</div>
        </div>
        <div><button class="btn btn-secondary btn-sm wtr-edit-btn" data-id="${term.id}">Edit</button></div>
      `;
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
  const ui = document.querySelector('.wtr-replacer-ui');
  ui.style.display = 'flex';
  document.getElementById('wtr-disable-all').checked = _state.state.settings.isDisabled;

  // Restore saved location when showing the terms tab
  if (document.querySelector('.wtr-replacer-tab-btn.active').dataset.tab === 'terms') {
    Handlers.restoreTermListLocation();
  } else {
    renderTermList();
  }
}
function hideUIPanel() {
  // Save current location before hiding
  Handlers.saveTermListLocation();
  document.querySelector('.wtr-replacer-ui').style.display = 'none';
  clearTermList();
}
function clearTermList() {
  const listEl = document.querySelector('.wtr-replacer-term-list');
  if (listEl) listEl.innerHTML = '';
}
function showFormView(term = null) {
  document.getElementById('wtr-term-id').value = term ? term.id : '';
  document.getElementById('wtr-original').value = term ? term.original : '';
  document.getElementById('wtr-replacement').value = term ? term.replacement : '';
  document.getElementById('wtr-case-sensitive').checked = term ? term.caseSensitive : false;
  document.getElementById('wtr-is-regex').checked = term ? term.isRegex : false;
  document.getElementById('wtr-whole-word').checked = term ? term.wholeWord : false;
  document.getElementById('wtr-whole-word').disabled = term ? term.isRegex : false;
  document.getElementById('wtr-save-btn').textContent = term ? 'Update Term' : 'Save Term';
  switchTab('add');

  // Initialize auto-resize after form is populated
  setTimeout(() => {
    const originalTextarea = document.getElementById('wtr-original');
    if (originalTextarea) {
      const text = originalTextarea.value;
      const charCount = text.length;
      const lines = Math.ceil(charCount / 40);
      originalTextarea.rows = Math.max(1, lines);
    }

    // Re-initialize validation state for the form
    const regexCheckbox = document.getElementById('wtr-is-regex');
    if (regexCheckbox) {
      const validationEvent = new Event('input', {
        bubbles: true
      });
      originalTextarea.dispatchEvent(validationEvent);
    }
  }, 10);
}
function switchTab(tabName) {
  document.querySelector(`.wtr-replacer-tab-btn[data-tab="${tabName}"]`).click();
}

// Simple function to create menu buttons with inline SVG icons
function createSimpleMenuButton(options) {
  const {
    text = 'Settings',
    onClick = null,
    className = '',
    tooltip = ''
  } = options;
  const button = document.createElement('button');
  button.className = `replacer-settings-btn ${className}`;
  if (tooltip) button.title = tooltip;

  // Create settings icon using the specified SVG
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('height', '24px');
  svg.setAttribute('viewBox', '0 -960 960 960');
  svg.setAttribute('width', '24px');
  svg.setAttribute('fill', '#1f1f1f');
  svg.style.marginRight = '4px';
  svg.style.verticalAlign = 'middle';
  svg.innerHTML = '<path d="M700-120h40v-100h100v-40H740v-100h-40v100H600v40h100v100Zm20 80q-83 0-141.5-58.5T520-240q0-83 58.5-141.5T720-440q83 0 141.5 58.5T920-240q0 83-58.5 141.5T720-40ZM280-600h400v-80H280v80Zm187 480H200q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v268q-29-14-58.5-21t-61.5-7q-11 0-20.5.5T680-517v-3H280v80h245q-18 17-32.5 37T467-360H280v80h163q-2 10-2.5 19.5T440-240q0 33 6 61.5t21 58.5Z"/>';
  button.appendChild(svg);

  // Add text
  const textSpan = document.createElement('span');
  textSpan.textContent = text;
  button.appendChild(textSpan);

  // Add click handler
  if (onClick) {
    button.addEventListener('click', onClick);
  }
  return button;
}
function addMenuButton() {
  const container = document.querySelector('div.col-6:has(button.term-edit-btn)');
  if (!container || _state.state.observedMenuContainers.has(container)) {
    return;
  }
  const ensureButtonState = () => {
    let settingsButton = container.querySelector('.replacer-settings-btn');
    const originalButton = container.querySelector('.term-edit-btn:not(.replacer-settings-btn)');

    // 1. Create the button if it doesn't exist
    if (!settingsButton) {
      if (!originalButton) return; // Can't create if the original doesn't exist yet

      // Create button with simple inline SVG icon
      settingsButton = createSimpleMenuButton({
        text: 'Term Settings',
        onClick: showUIPanel,
        className: originalButton.className,
        // Copy classes for styling
        tooltip: 'Open WTR Term Settings'
      });
      container.appendChild(settingsButton);
      (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Settings button created with simple icon system.');
    }

    // 2. Enforce the correct order (our button should be last)
    if (container.lastChild !== settingsButton) {
      container.appendChild(settingsButton);
      (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Settings button order corrected.');
    }

    // 3. Apply consistent styling
    if (originalButton && settingsButton) {
      const desiredFlexStyle = '1 1 0%';
      container.style.display = 'flex';
      container.style.gap = '5px';
      originalButton.style.flex = desiredFlexStyle;
      settingsButton.style.flex = desiredFlexStyle;
    }
  };

  // Run once immediately
  ensureButtonState();

  // Observe for any changes and re-run to correct the state
  const observer = new MutationObserver(() => {
    (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Detected change in menu container, ensuring button state.');
    ensureButtonState();
  });
  observer.observe(container, {
    childList: true
  });

  // Mark this container as observed to prevent re-attaching observers
  _state.state.observedMenuContainers.add(container);
}

/***/ }),

/***/ "./src/modules/utils.js":
/***/ ((__unused_webpack_module, exports) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.debounce = debounce;
exports.detectOtherWTRScripts = detectOtherWTRScripts;
exports.endProcessingTimer = endProcessingTimer;
exports.escapeRegExp = escapeRegExp;
exports.estimateContentLoadLevel = estimateContentLoadLevel;
exports.getChapterIdFromUrl = getChapterIdFromUrl;
exports.getNovelSlug = getNovelSlug;
exports.isContentReadyForProcessing = isContentReadyForProcessing;
exports.isElementReadyForProcessing = isElementReadyForProcessing;
exports.log = log;
exports.logDOMConflict = logDOMConflict;
exports.logProcessingWithMultiScriptContext = logProcessingWithMultiScriptContext;
exports.startProcessingTimer = startProcessingTimer;
// Utility functions for WTR Lab Term Replacer

function getNovelSlug() {
  let match = window.location.pathname.match(/novel\/\d+\/([^/]+)/);
  if (match) return match[1];
  match = window.location.pathname.match(/serie-\d+\/([^/]+)/);
  return match ? match[1] : null;
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

// --- [ENHANCED v5.4] MULTI-SCRIPT COORDINATION FUNCTIONS ---

function detectOtherWTRScripts() {
  // Detect other WTR Lab scripts by their data attributes or specific patterns
  const scripts = document.querySelectorAll('[data-smart-quotes-processed], [data-uncensor-processed], [data-auto-scroll], [data-reader-enhanced]');
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
function logDOMConflict(sourceScript, element, processingQueue, chapterId) {
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
function logProcessingWithMultiScriptContext(chapterId, processingTime, isMultiScript = false, otherWTRScripts, processingQueue) {
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
  var _container$textConten;
  // Multiple readiness criteria for robust detection
  const hasSubstantialContent = ((_container$textConten = container.textContent) === null || _container$textConten === void 0 ? void 0 : _container$textConten.trim().length) > 100;
  const hasNoActiveLoaders = !container.querySelector('.loading, .spinner, [style*="loading"], .skeleton');
  const isVisible = container.offsetWidth > 0 && container.offsetHeight > 0;
  const hasChapterContent = container.querySelector('.chapter-body') || container.querySelector('p, h1, h2, h3, h4, h5, h6');
  return hasSubstantialContent && hasNoActiveLoaders && isVisible && hasChapterContent;
}

// Element readiness check for robust processing
function isElementReadyForProcessing(element) {
  var _element$textContent;
  // Check if element is visible and has substantial content
  const rect = element.getBoundingClientRect();
  const isVisible = rect.width > 0 && rect.height > 0;
  const hasSubstantialContent = ((_element$textContent = element.textContent) === null || _element$textContent === void 0 ? void 0 : _element$textContent.trim().length) > 50;
  const hasNoLoadingStates = !element.querySelector('.loading, .spinner, [style*="display: none"]');
  return isVisible && hasSubstantialContent && hasNoLoadingStates;
}

// Enhanced content load level estimation for retry mechanisms
function estimateContentLoadLevel(chapterBody) {
  var _chapterBody$textCont, _chapterBody$textCont2, _chapterBody$textCont3;
  // Estimate how much content is loaded based on text density and structure
  const textNodes = chapterBody.querySelectorAll('p, h1, h2, h3, h4, h5, h6, div, span');
  const totalTextLength = Array.from(textNodes).reduce((total, node) => {
    var _node$textContent;
    return total + (((_node$textContent = node.textContent) === null || _node$textContent === void 0 ? void 0 : _node$textContent.trim().length) || 0);
  }, 0);

  // Check for loading indicators or placeholder content
  const hasLoadingIndicators = chapterBody.querySelector('.loading, .spinner, [style*="loading"], [class*="loading"]');
  const hasPlaceholderContent = ((_chapterBody$textCont = chapterBody.textContent) === null || _chapterBody$textCont === void 0 ? void 0 : _chapterBody$textCont.includes('Loading...')) || ((_chapterBody$textCont2 = chapterBody.textContent) === null || _chapterBody$textCont2 === void 0 ? void 0 : _chapterBody$textCont2.includes('loading')) || ((_chapterBody$textCont3 = chapterBody.textContent) === null || _chapterBody$textCont3 === void 0 ? void 0 : _chapterBody$textCont3.includes('...'));

  // Calculate load level based on content density and absence of loading indicators
  let loadLevel = Math.min(totalTextLength / 1000, 1.0); // Normalize to 0-1 based on 1000 chars

  if (hasLoadingIndicators || hasPlaceholderContent) {
    loadLevel *= 0.3; // Reduce load level if loading indicators present
  }

  // Ensure minimum threshold for processing
  return Math.max(loadLevel, totalTextLength > 100 ? 0.5 : 0.1);
}

/***/ })

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
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {


var _ui = __webpack_require__("./src/modules/ui.js");
var _storage = __webpack_require__("./src/modules/storage.js");
var _observer = __webpack_require__("./src/modules/observer.js");
var _state = __webpack_require__("./src/modules/state.js");
var Handlers = _interopRequireWildcard(__webpack_require__("./src/modules/handlers.js"));
var _utils = __webpack_require__("./src/modules/utils.js");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); } // Main entry point for WTR Lab Term Replacer
// Import all handlers
// Function to get chapter ID from URL (for module compatibility)
function getChapterIdFromUrl(url) {
  const match = url.match(/(chapter-\d+)/);
  return match ? match[1] : null;
}

// Enhanced error handling setup
function setupEnhancedErrorHandling() {
  // Global error handler to catch and log any issues
  window.addEventListener("error", event => {
    if (event.error && event.error.message && event.error.message.includes("WTR")) {
      (0, _utils.log)(_state.state.globalSettings, "WTR Term Replacer: Caught error:", event.error);
    }
  });

  // Handle unhandled promise rejections
  window.addEventListener("unhandledrejection", event => {
    if (event.reason && event.reason.message && event.reason.message.includes("WTR")) {
      (0, _utils.log)(_state.state.globalSettings, "WTR Term Replacer: Unhandled promise rejection:", event.reason);
    }
  });

  // Cleanup function for when page unloads
  window.addEventListener("beforeunload", () => {
    _state.state.processingQueue.clear();
    (0, _utils.log)(_state.state.globalSettings, "WTR Term Replacer: Cleanup on page unload");
  });
  (0, _utils.log)(_state.state.globalSettings, "WTR Term Replacer: Enhanced error handling activated");
}

// Enhanced navigation handling setup
function setupEnhancedNavigationHandling() {
  // Enhanced URL change detection with proper debouncing and coordination
  let isNavigationInProgress = false;
  const processNavigationSafely = () => {
    if (isNavigationInProgress) {
      (0, _utils.log)(_state.state.globalSettings, "WTR Term Replacer: Navigation already in progress, skipping");
      return;
    }
    isNavigationInProgress = true;

    // Clear processing queue for new chapter
    _state.state.processingQueue.clear();

    // Wait for content to load with enhanced detection
    setTimeout(() => {
      Promise.resolve().then(() => _interopRequireWildcard(__webpack_require__("./src/modules/observer.js"))).then(({
        processVisibleChapter
      }) => {
        processVisibleChapter();
      });
      isNavigationInProgress = false;
    }, 500); // Increased delay to allow DOM updates and prevent conflicts
  };

  // Set up navigation event listeners for SPA-style navigation
  window.addEventListener("popstate", () => {
    (0, _utils.log)(_state.state.globalSettings, "WTR Term Replacer: Popstate event detected");
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
  (0, _utils.log)(_state.state.globalSettings, "WTR Term Replacer: Enhanced navigation handling activated");
}

// Enhanced disable functionality that works reliably
function addDisableAllRobustness() {
  // Get the original handleDisableToggle from handlers and wrap it
  Handlers.handleDisableToggle = async function (e) {
    const wasDisabled = _state.state.settings.isDisabled;
    const shouldDisable = e.target.checked;

    // Update settings immediately
    _state.state.settings.isDisabled = shouldDisable;
    await (await Promise.resolve().then(() => _interopRequireWildcard(__webpack_require__("./src/modules/storage.js")))).saveSettings(_state.state.settings);

    // Perform robust disable/enable operation
    const chapterId = getChapterIdFromUrl(window.location.href);
    if (!chapterId) return;
    const chapterSelector = `#${chapterId} .chapter-body`;
    const chapterBody = document.querySelector(chapterSelector);
    if (chapterBody) {
      try {
        const {
          performReplacements,
          revertAllReplacements
        } = await Promise.resolve().then(() => _interopRequireWildcard(__webpack_require__("./src/modules/engine.js")));
        if (shouldDisable) {
          // Disable: revert all replacements
          (0, _utils.log)(_state.state.globalSettings, "WTR Term Replacer: Robust disable - reverting all replacements");
          await revertAllReplacements(chapterBody);
          chapterBody.dataset.wtrProcessed = "false";
        } else {
          // Enable: perform replacements with retry
          (0, _utils.log)(_state.state.globalSettings, "WTR Term Replacer: Robust enable - performing replacements");
          await performReplacements(chapterBody);
          chapterBody.dataset.wtrProcessed = "true";
        }
      } catch (error) {
        (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Error during ${shouldDisable ? "disable" : "enable"} operation:`, error);
        // Reset checkbox on error
        e.target.checked = wasDisabled;
        _state.state.settings.isDisabled = wasDisabled;
      }
    }
  };
  (0, _utils.log)(_state.state.globalSettings, "WTR Term Replacer: Enhanced disable functionality activated");
}
async function main() {
  (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Main function starting initialization...');

  // Initialize state and validate novel slug
  const novelSlug = (0, _utils.getNovelSlug)();
  if (!novelSlug) {
    (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Critical error - could not determine novel slug');
    console.error("WTR Term Replacer: Could not determine novel slug.");
    return;
  }
  (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Novel slug determined: ${novelSlug}`);
  (0, _state.setNovelSlug)(novelSlug);
  (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Loading global settings and data...');
  await (0, _storage.loadGlobalSettings)();
  await (0, _storage.loadData)();
  (0, _utils.log)(_state.state.globalSettings, `WTR Term Replacer: Data loaded - terms: ${_state.state.terms.length}, settings disabled: ${_state.state.settings.isDisabled}`);

  // Enhanced initialization with robustness features
  (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Setting up error handling...');
  setupEnhancedErrorHandling();
  (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Setting up disable functionality...');
  addDisableAllRobustness();
  (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Setting up navigation handling...');
  setupEnhancedNavigationHandling();
  (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Creating UI and menu commands...');
  (0, _ui.createUI)(); // This will also set up the initial event listeners

  (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Registering menu commands...');
  GM_registerMenuCommand("Term Replacer Settings", Handlers.showUIPanel);
  GM_registerMenuCommand("Toggle Logging", Handlers.toggleLogging);
  (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Starting initial content detection...');
  (0, _observer.waitForInitialContent)();
  (0, _utils.log)(_state.state.globalSettings, 'WTR Term Replacer: Initialization completed successfully');
}

// Start the script
main().catch(err => console.error("WTR Term Replacer failed to start:", err));

// Add custom event listener for programmatic term addition (equivalent to original lines 2444-2447)
window.addEventListener("wtr:addTerm", event => {
  const {
    original,
    replacement,
    isRegex
  } = event.detail;
  Handlers.addTermProgrammatically(original, replacement, isRegex);
});
})();

/******/ })()
;