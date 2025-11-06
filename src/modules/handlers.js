// Event handler functions for WTR Lab Term Replacer
import { state } from "./state";
import { saveTerms, saveSettings, saveSearchFieldValue, loadData, processAndSaveTerms, processAndSaveSettings, getTermKey, saveGlobalSettings, saveTermListLocation, loadTermListLocation } from "./storage";

// Re-export saveTermListLocation for UI module
export { saveTermListLocation };
import { showFormView, renderTermList, showUIPanel, hideUIPanel as uiHideUIPanel, showUILoader, hideUILoader, switchTab, clearTermList } from "./ui";
import { reprocessCurrentChapter, processVisibleChapter } from "./observer";
import { computeDupGroups, exitDupMode, changeDupGroup, updateDupModeAfterChange } from "./duplicates";
import { log } from "./utils";
import { performReplacements, revertAllReplacements } from "./engine";

// Export hideUIPanel function that can be called from UI
export function hideUIPanel() {
  log(state.globalSettings, 'WTR Term Replacer: UI panel hide requested');
  uiHideUIPanel();
}

export function validateRegex(pattern) {
  try {
    new RegExp(pattern);
    log(state.globalSettings, `WTR Term Replacer: Valid regex pattern: ${pattern}`);
    return true;
  } catch (e) {
    log(state.globalSettings, `WTR Term Replacer: Invalid regex pattern: ${pattern} - ${e.message}`);
    alert(`Invalid Regular Expression:\n\n${e.message}`);
    return false;
  }
}

export async function handleSaveTerm() {
  log(state.globalSettings, 'WTR Term Replacer: Handle save term started');
  const id = document.getElementById('wtr-term-id').value;
  const originalInput = document.getElementById('wtr-original');
  const replacementInput = document.getElementById('wtr-replacement');
  const original = originalInput.value.trim();
  const isRegex = document.getElementById('wtr-is-regex').checked;
  const wholeWord = document.getElementById('wtr-whole-word').checked;
  
  log(state.globalSettings, `WTR Term Replacer: Saving term - original: "${original}", replacement: "${replacementInput.value}", isRegex: ${isRegex}, wholeWord: ${wholeWord}, caseSensitive: ${document.getElementById('wtr-case-sensitive').checked}`);
  
  if (!original) {
    log(state.globalSettings, 'WTR Term Replacer: Save term failed - empty original text');
    alert('Original text cannot be empty.');
    return;
  }
  if (isRegex && !validateRegex(original)) {
    log(state.globalSettings, 'WTR Term Replacer: Save term failed - invalid regex pattern');
    return;
  }
  
  const newTerm = {
    id: id || `term_${Date.now()}`,
    original,
    replacement: replacementInput.value,
    caseSensitive: document.getElementById('wtr-case-sensitive').checked,
    isRegex,
    wholeWord: isRegex ? false : wholeWord
  };
  
  const existingIndex = state.terms.findIndex(t => t.id === newTerm.id);
  if (existingIndex > -1) {
    log(state.globalSettings, `WTR Term Replacer: Updating existing term ${newTerm.id}`);
    state.terms[existingIndex] = newTerm;
  } else {
    log(state.globalSettings, `WTR Term Replacer: Adding new term ${newTerm.id}`);
    state.terms.push(newTerm);
  }
  
  await saveTerms(state.terms);
  log(state.globalSettings, `WTR Term Replacer: Term saved successfully, total terms: ${state.terms.length}`);
  reprocessCurrentChapter();
  
  originalInput.value = '';
  replacementInput.value = '';
  document.getElementById('wtr-term-id').value = '';
  document.getElementById('wtr-case-sensitive').checked = false;
  document.getElementById('wtr-is-regex').checked = false;
  document.getElementById('wtr-whole-word').checked = false;
  document.getElementById('wtr-save-btn').textContent = 'Save Term';
  
  renderTermList(state.currentSearchValue);
  
  if (id) {
    log(state.globalSettings, 'WTR Term Replacer: Switching to terms tab after update');
    switchTab('terms');
  } else {
    log(state.globalSettings, 'WTR Term Replacer: Focusing on original input for next term');
    originalInput.focus();
  }
  
  if (state.isDupMode) {
    log(state.globalSettings, 'WTR Term Replacer: Updating duplicate mode after term change');
    updateDupModeAfterChange();
  }
}

export function handleListInteraction(e) {
  const termId = e.target.closest('li')?.dataset.id;
  if (!termId) return;
  if (e.target.classList.contains('wtr-edit-btn')) {
    const term = state.terms.find(t => t.id === termId);
    if (term) showFormView(term);
  }
}

export async function handleDeleteSelected() {
  log(state.globalSettings, 'WTR Term Replacer: Delete selected terms started');
  showUILoader();
  try {
    const selectedIds = [...document.querySelectorAll('.wtr-replacer-term-select:checked')].map(cb => cb.dataset.id);
    log(state.globalSettings, `WTR Term Replacer: Found ${selectedIds.length} terms selected for deletion: ${selectedIds.join(', ')}`);
    
    if (selectedIds.length === 0) {
      log(state.globalSettings, 'WTR Term Replacer: Delete cancelled - no terms selected');
      alert('No terms selected.');
      return;
    }
    
    if (confirm(`Delete ${selectedIds.length} term(s)?`)) {
      log(state.globalSettings, 'WTR Term Replacer: User confirmed deletion, proceeding...');
      const filteredTerms = state.terms.filter(t => !selectedIds.includes(t.id));
      log(state.globalSettings, `WTR Term Replacer: Deleting ${state.terms.length - filteredTerms.length} terms, ${filteredTerms.length} remaining`);
      
      await saveTerms(filteredTerms);
      await loadData();
      log(state.globalSettings, 'WTR Term Replacer: Terms deleted and data reloaded');
      reprocessCurrentChapter();
      
      if (state.isDupMode) {
        log(state.globalSettings, 'WTR Term Replacer: Updating duplicate mode after deletion');
        updateDupModeAfterChange();
      } else {
        log(state.globalSettings, 'WTR Term Replacer: Refreshing term list display');
        renderTermList(state.currentSearchValue);
      }
    } else {
      log(state.globalSettings, 'WTR Term Replacer: Delete cancelled by user');
    }
  } catch (error) {
    log(state.globalSettings, `WTR Term Replacer: Error during term deletion: ${error.message}`);
    console.error('Error during term deletion:', error);
  } finally {
    hideUILoader();
  }
}

export function handleTextSelection(e) {
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

export function handleAddTermFromSelection() {
  const selection = window.getSelection().toString().trim();
  if (selection) {
    showUIPanel();
    showFormView();
    document.getElementById('wtr-original').value = selection;
    document.getElementById('wtr-replacement').focus();
  }
  document.querySelector('.wtr-add-term-float-btn').style.display = 'none';
}

export function handleSearch(e) {
  if (state.isDupMode) return;
  state.currentSearchValue = e.target.value;
  state.currentPage = 1;
  renderTermList(state.currentSearchValue);

  // Immediately save the search field value for reactive behavior
  saveSearchFieldValue();
}

export async function handleDisableToggle(e) {
  state.settings.isDisabled = e.target.checked;
  await saveSettings(state.settings);
  const getChapterIdFromUrl = (url) => {
    const match = url.match(/(chapter-\d+)/);
    return match ? match[1] : null;
  };
  const CHAPTER_BODY_SELECTOR = ".chapter-body";
  
  const chapterId = getChapterIdFromUrl(window.location.href);
  if (!chapterId) return;
  const chapterSelector = `#${chapterId} ${CHAPTER_BODY_SELECTOR}`;
  const chapterBody = document.querySelector(chapterSelector);
  if (chapterBody) {
    if (state.settings.isDisabled) {
      revertAllReplacements(chapterBody);
    } else {
      performReplacements(chapterBody);
    }
  }
}

export function downloadJSON(data, filename) {
  return new Promise(resolve => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
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
export async function handleExportNovel() {
  const exportData = { formatVersion: '5.4', settings: { [state.novelSlug]: state.settings }, terms: { [state.novelSlug]: state.terms } };
  downloadJSON(exportData, `${state.novelSlug}-terms.json`);
}

export async function handleExportAll() {
  showUILoader();
  try {
    const allKeys = await GM_listValues();
    const TERMS_STORAGE_KEY_PREFIX = "wtr_lab_terms_";
    const SETTINGS_STORAGE_KEY_PREFIX = "wtr_lab_settings_";
    
    const termKeys = allKeys.filter(k => k.startsWith(TERMS_STORAGE_KEY_PREFIX));
    const settingKeys = allKeys.filter(k => k.startsWith(SETTINGS_STORAGE_KEY_PREFIX));
    const exportData = { formatVersion: '5.4', settings: {}, terms: {} };
    
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
    hideUILoader();
  }
}

// Enhanced dual export functionality with sequential downloads
export async function handleExportCombined() {
  showUILoader();
  try {
    // Step 1: Export novel terms first
    const novelExportData = {
      formatVersion: '5.4',
      settings: { [state.novelSlug]: state.settings },
      terms: { [state.novelSlug]: state.terms }
    };

    await downloadJSON(novelExportData, `${state.novelSlug}-terms.json`);

    // Step 2: Ask user for confirmation before proceeding to second download
    const userConfirmed = confirm(
      'The first file (Novel Terms) has been downloaded. Please check if the download completed successfully. Click "OK" to proceed with the second download (All Terms backup), or "Cancel" to skip.'
    );

    if (userConfirmed) {
      // Step 3: Export all terms only after user confirmation
      const allKeys = await GM_listValues();
      const TERMS_STORAGE_KEY_PREFIX = "wtr_lab_terms_";
      const SETTINGS_STORAGE_KEY_PREFIX = "wtr_lab_settings_";
      
      const termKeys = allKeys.filter(k => k.startsWith(TERMS_STORAGE_KEY_PREFIX));
      const settingKeys = allKeys.filter(k => k.startsWith(SETTINGS_STORAGE_KEY_PREFIX));
      const allExportData = { formatVersion: '5.4', settings: {}, terms: {} };
      
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
    hideUILoader();
  }
}

export async function handleFileImport(event) {
  log(state.globalSettings, `WTR Term Replacer: File import started, import type: ${state.importType}`);
  showUILoader();
  try {
    const file = event.target.files[0];
    if (!file) {
      log(state.globalSettings, 'WTR Term Replacer: No file selected for import');
      return;
    }
    
    log(state.globalSettings, `WTR Term Replacer: Importing file: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);
    const reader = new FileReader();
    reader.onload = async e => {
      const content = e.target.result;
      log(state.globalSettings, `WTR Term Replacer: File content loaded, length: ${content.length} characters`);
      let importedData;
      try {
        importedData = JSON.parse(content);
        log(state.globalSettings, 'WTR Term Replacer: JSON parsed successfully');
      } catch (err) {
        log(state.globalSettings, `WTR Term Replacer: Import failed - invalid JSON: ${err.message}`);
        alert('Import failed. Invalid JSON data. Error: ' + err.message);
        return;
      }
      
      let isNewFormat = !!importedData.formatVersion;
      let termsData;
      let settingsData;
      let isArrayData = Array.isArray(importedData);
      let isOldGlobal = !isNewFormat && !isArrayData && typeof importedData === 'object';
      
      log(state.globalSettings, `WTR Term Replacer: Detected format - isNewFormat: ${isNewFormat}, isArrayData: ${isArrayData}, isOldGlobal: ${isOldGlobal}`);
      
      if (isArrayData) {
        termsData = { [state.novelSlug]: importedData };
        log(state.globalSettings, 'WTR Term Replacer: Array format detected, mapping to current novel');
      } else if (isOldGlobal) {
        termsData = importedData;
        log(state.globalSettings, 'WTR Term Replacer: Old global format detected');
      } else if (isNewFormat) {
        termsData = importedData.terms || {};
        settingsData = importedData.settings || {};
        log(state.globalSettings, `WTR Term Replacer: New format detected - terms: ${Object.keys(termsData).length} slugs, settings: ${Object.keys(settingsData).length} slugs`);
      } else {
        log(state.globalSettings, 'WTR Term Replacer: Import failed - unrecognized data format');
        alert('Import failed. Unrecognized data format.');
        return;
      }
      
      let slugs = Object.keys(termsData);
      log(state.globalSettings, `WTR Term Replacer: Found data for ${slugs.length} slugs: ${slugs.join(', ')}`);
      
      if (state.importType === 'novel' && slugs.length > 1) {
        log(state.globalSettings, 'WTR Term Replacer: Novel import with multiple slugs - warning user');
        alert(
          'Warning: File contains data for multiple novels, but importing to current novel only. Use Global Import for all.'
        );
        termsData = { [state.novelSlug]: termsData[Object.keys(termsData)[0]] || [] };
        if (settingsData) settingsData = { [state.novelSlug]: settingsData[Object.keys(settingsData)[0]] || {} };
        slugs = [state.novelSlug];
      }
      
      let shouldImportSettings = false;
      if (settingsData && Object.keys(settingsData).length > 0) {
        log(state.globalSettings, 'WTR Term Replacer: Settings detected in import, asking user for confirmation');
        shouldImportSettings = confirm(
          'This file contains settings. Would you like to import and overwrite your current settings?'
        );
      }
      
      let totalAdded = 0,
        totalSkipped = 0,
        totalConflicts = 0,
        invalidCount = 0,
        validCount = 0;
        
      log(state.globalSettings, 'WTR Term Replacer: Starting term import process...');
      
      for (const slug of slugs) {
        log(state.globalSettings, `WTR Term Replacer: Processing import for slug: ${slug}`);
        let existingTerms = await GM_getValue(`wtr_lab_terms_${slug}`, []);
        log(state.globalSettings, `WTR Term Replacer: Existing terms for ${slug}: ${existingTerms.length}`);
        
        let overwrite = true;
        if (existingTerms.length > 0) {
          log(state.globalSettings, `WTR Term Replacer: Existing terms found for ${slug}, asking user about merge vs overwrite`);
          overwrite = !confirm(
            `An existing term list was found for ${slug}. Would you like to merge? (OK = Merge, Cancel = Overwrite)`
          );
          if (!overwrite) {
            if (!confirm('Are you sure you want to overwrite?')) {
              log(state.globalSettings, `WTR Term Replacer: User cancelled overwrite for ${slug}`);
              continue;
            }
            overwrite = true;
          }
        }
        
        let rawTerms = termsData[slug] || [];
        log(state.globalSettings, `WTR Term Replacer: Raw terms for ${slug}: ${rawTerms.length}`);
        
        if (!Array.isArray(rawTerms)) {
          log(state.globalSettings, `WTR Term Replacer: Skipping ${slug} - not an array`);
          continue;
        }
        
        let validatedTerms = rawTerms.filter(term => {
          term.wholeWord = term.wholeWord ?? false;
          if (term.isRegex) {
            try {
              new RegExp(term.original);
              validCount++;
              return true;
            } catch (err) {
              invalidCount++;
              log(state.globalSettings, `WTR Term Replacer: Skipping invalid regex term: "${term.original}" - ${err.message}`);
              console.warn(`Skipping invalid regex term on import: "${term.original}"`);
              return false;
            }
          }
          validCount++;
          return true;
        });
        
        log(state.globalSettings, `WTR Term Replacer: Validated terms for ${slug}: ${validatedTerms.length} valid, ${invalidCount} invalid`);
        
        const { added, skipped, conflicts } = await processAndSaveTerms(slug, validatedTerms, overwrite);
        totalAdded += added;
        totalSkipped += skipped;
        totalConflicts += conflicts;
        
        log(state.globalSettings, `WTR Term Replacer: Import results for ${slug} - added: ${added}, skipped: ${skipped}, conflicts: ${conflicts}`);
      }
      
      if (shouldImportSettings) {
        log(state.globalSettings, 'WTR Term Replacer: Importing settings data...');
        await processAndSaveSettings(settingsData);
      }
      
      log(state.globalSettings, 'WTR Term Replacer: Reloading data and reprocessing chapters...');
      await loadData();
      reprocessCurrentChapter();
      renderTermList(state.currentSearchValue);
      if (state.isDupMode) updateDupModeAfterChange();
      
      let summary = 'Import successful!';
      log(state.globalSettings, `WTR Term Replacer: Import completed - totalAdded: ${totalAdded}, totalSkipped: ${totalSkipped}, totalConflicts: ${totalConflicts}, invalidCount: ${invalidCount}, validCount: ${validCount}`);
      
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
    log(state.globalSettings, 'WTR Term Replacer: File import process initiated');
  } catch (e) {
    log(state.globalSettings, `WTR Term Replacer: Import error: ${e.message}`);
    alert('An error occurred during import.');
    console.error(e);
  } finally {
    hideUILoader();
  }
}

export function handleTabSwitch(e) {
  const targetTab = e.target.dataset.tab;

  // Save current state before switching (if on terms tab)
  const currentTab = document.querySelector('.wtr-replacer-tab-btn.active').dataset.tab;
  if (currentTab === 'terms') {
    saveSearchFieldValue();
  }

  document.querySelectorAll('.wtr-replacer-tab-btn').forEach(btn => btn.classList.remove('active'));
  e.target.classList.add('active');
  document.querySelectorAll('.wtr-replacer-tab-content').forEach(content => content.classList.remove('active'));
  document.getElementById(`wtr-tab-${targetTab}`).classList.add('active');

  if (targetTab === 'terms') {
    restoreTermListLocation();
  } else {
    clearTermList();
  }
}

export async function handleFindDuplicates() {
  showUILoader();
  try {
    const TERMS_KEY = `wtr_lab_terms_${state.novelSlug}`;
    const currentNovelTerms = await GM_getValue(TERMS_KEY, []);
    computeDupGroups(currentNovelTerms);
    if (state.dupKeys.length === 0) {
      alert('No duplicates found.');
      return;
    }
    state.isDupMode = true;
    state.currentDupIndex = 0;
    state.currentSearchValue = '';
    setSearchFieldValue('');
  } finally {
    hideUILoader();
  }
}
// Use duplicate functions from duplicates module (imported above)

// Helper function to set search field value programmatically with reactive save
export function setSearchFieldValue(value) {
  const searchBar = document.getElementById('wtr-search-bar');
  if (searchBar) {
    searchBar.value = value;
    state.currentSearchValue = value;
    state.currentPage = 1;
    renderTermList(state.currentSearchValue);
    saveSearchFieldValue();
  }
}

export async function restoreTermListLocation() {
  try {
    const saved = await GM_getValue(`wtr_lab_term_list_location_${state.novelSlug}`, null);
    if (saved) {
      state.savedTermListLocation = saved;
    }
    state.currentPage = state.savedTermListLocation.page || 1;
    state.currentSearchValue = state.savedTermListLocation.searchValue || '';

    // Apply the saved state to the UI
    const searchBar = document.getElementById('wtr-search-bar');
    if (searchBar && state.currentSearchValue) {
      searchBar.value = state.currentSearchValue;
    }

    renderTermList(state.currentSearchValue);

    // Restore scroll position after a short delay to ensure rendering is complete
    setTimeout(() => {
      const termListContainer = document.querySelector('.wtr-replacer-content');
      if (termListContainer && state.savedTermListLocation.scrollTop) {
        termListContainer.scrollTop = state.savedTermListLocation.scrollTop;
      }
    }, 100);
  } catch (e) {
    console.error('Error restoring term list location:', e);
  }
}

export function toggleLogging() {
  state.globalSettings.isLoggingEnabled = !state.globalSettings.isLoggingEnabled;
  saveGlobalSettings();
  alert(`Logging ${state.globalSettings.isLoggingEnabled ? 'enabled' : 'disabled'}.`);
}

// Additional functions needed for index.js integration
export async function addTermProgrammatically(original, replacement, isRegex = false) {
  if (!original) return;
  const newTerm = {
    id: `term_${Date.now()}`,
    original: original.trim(),
    replacement: replacement.trim(),
    caseSensitive: false,
    isRegex: isRegex,
    wholeWord: isRegex ? false : false
  };
  const isDuplicate = state.terms.some(
    t => t.original === newTerm.original && t.replacement === newTerm.replacement && t.isRegex === newTerm.isRegex
  );
  if (!isDuplicate) {
    state.terms.push(newTerm);
    await saveTerms(state.terms);
    log(state.globalSettings, `WTR Term Replacer: Programmatically added term (Regex: ${isRegex}): ${newTerm.original} -> ${newTerm.replacement}`);
    if (document.querySelector('.wtr-replacer-ui').style.display === 'flex') {
      renderTermList(state.currentSearchValue);
    }
  } else {
    log(state.globalSettings, `WTR Term Replacer: Skipped adding duplicate term: ${newTerm.original}`);
  }
}

