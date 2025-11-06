// Storage functions using GM_* API for WTR Lab Term Replacer
import { state } from "./state";
import * as C from "./config";
import { log } from "./utils";

export async function loadGlobalSettings() {
  try {
    state.globalSettings = await GM_getValue(C.GLOBAL_SETTINGS_KEY, { isLoggingEnabled: false });
    log(state.globalSettings, 'WTR Term Replacer: Global settings loaded');
  } catch (e) {
    console.error('Error loading global settings:', e);
    state.globalSettings = { isLoggingEnabled: false };
  }
}

export async function saveGlobalSettings() {
  try {
    await GM_setValue(C.GLOBAL_SETTINGS_KEY, state.globalSettings);
    log(state.globalSettings, 'WTR Term Replacer: Global settings saved');
  } catch (e) {
    console.error('Error saving global settings:', e);
  }
}

export async function loadTermListLocation() {
  try {
    const saved = await GM_getValue(`${C.CURRENT_LOCATION_KEY}_${state.novelSlug}`, null);
    if (saved) {
      state.savedTermListLocation = saved;
    }
  } catch (e) {
    console.error('Error loading term list location:', e);
    state.savedTermListLocation = { page: 1, scrollTop: 0, searchValue: "" };
  }
}

export async function saveTermListLocation() {
  try {
    const termListContainer = document.querySelector('.wtr-replacer-content');
    if (termListContainer) {
      const locationData = {
        page: state.currentPage,
        scrollTop: termListContainer.scrollTop,
        searchValue: state.currentSearchValue
      };
      await GM_setValue(`${C.CURRENT_LOCATION_KEY}_${state.novelSlug}`, locationData);
      state.savedTermListLocation = locationData;
    }
  } catch (e) {
    console.error('Error saving term list location:', e);
  }
}

// Helper function to save search field value immediately
export async function saveSearchFieldValue() {
  try {
    const locationData = {
      page: state.currentPage,
      scrollTop: 0,
      searchValue: state.currentSearchValue
    };
    await GM_setValue(`${C.CURRENT_LOCATION_KEY}_${state.novelSlug}`, locationData);
    state.savedTermListLocation = locationData;
  } catch (e) {
    console.error('Error saving search field value:', e);
  }
}

export async function loadData() {
  try {
    const TERMS_KEY = `${C.TERMS_STORAGE_KEY_PREFIX}${state.novelSlug}`;
    const SETTINGS_KEY = `${C.SETTINGS_STORAGE_KEY_PREFIX}${state.novelSlug}`;
    
    state.terms = await GM_getValue(TERMS_KEY, []);
    state.terms.forEach(t => {
      t.wholeWord = t.wholeWord ?? false;
    });
    const savedSettings = await GM_getValue(SETTINGS_KEY, {});
    state.settings = { isDisabled: false, ...savedSettings };
  } catch (e) {
    console.error('Error loading data:', e);
    state.terms = [];
    state.settings = { isDisabled: false };
  }
}

export async function saveTerms(termsToSave) {
  try {
    const TERMS_KEY = `${C.TERMS_STORAGE_KEY_PREFIX}${state.novelSlug}`;
    await GM_setValue(TERMS_KEY, termsToSave);
    state.terms = termsToSave;
    log(state.globalSettings, `WTR Term Replacer: Saved ${termsToSave.length} terms for novel ${state.novelSlug}`);
  } catch (e) {
    console.error('Error saving terms:', e);
    log(state.globalSettings, `WTR Term Replacer: Failed to save terms: ${e.message}`);
    alert('Failed to save terms. Storage might be full.');
  }
}

export async function saveSettings(settingsToSave) {
  try {
    const SETTINGS_KEY = `${C.SETTINGS_STORAGE_KEY_PREFIX}${state.novelSlug}`;
    await GM_setValue(SETTINGS_KEY, settingsToSave);
    state.settings = settingsToSave;
    log(state.globalSettings, 'WTR Term Replacer: Settings saved successfully');
  } catch (e) {
    console.error('Error saving settings:', e);
    log(state.globalSettings, `WTR Term Replacer: Failed to save settings: ${e.message}`);
    alert('Failed to save settings. Storage might be full.');
  }
}

export function getTermKey(term) {
  return `${term.original}|${term.caseSensitive}|${term.isRegex}`;
}

export async function processAndSaveTerms(slug, importedTerms, overwrite = true) {
  log(state.globalSettings, `WTR Term Replacer: Processing import for slug ${slug}, overwrite: ${overwrite}`);
  const TERMS_KEY = `${C.TERMS_STORAGE_KEY_PREFIX}${slug}`;
  let existingTerms = await GM_getValue(TERMS_KEY, []);
  existingTerms.forEach(t => {
    t.wholeWord = t.wholeWord ?? false;
  });
  let newTerms = [];
  let added = 0;
  let skipped = 0;
  let conflicts = 0;
  if (overwrite) {
    log(state.globalSettings, `WTR Term Replacer: Overwrite mode - importing ${importedTerms.length} terms`);
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
    log(state.globalSettings, `WTR Term Replacer: Merge mode - added: ${added}, skipped: ${skipped}, conflicts: ${conflicts}`);
  }
  await GM_setValue(TERMS_KEY, newTerms);
  if (slug === state.novelSlug) {
    state.terms = newTerms;
  }
  log(state.globalSettings, `WTR Term Replacer: Import complete for ${slug} - total terms: ${newTerms.length}`);
  return { added, skipped, conflicts };
}

export async function processAndSaveSettings(importedSettings) {
  log(state.globalSettings, `WTR Term Replacer: Processing settings import for ${Object.keys(importedSettings).length} slugs`);
  for (const slug in importedSettings) {
    const SETTINGS_KEY = `${C.SETTINGS_STORAGE_KEY_PREFIX}${slug}`;
    const existing = await GM_getValue(SETTINGS_KEY, { isDisabled: false });
    const newSettings = { ...existing, ...importedSettings[slug] };
    await GM_setValue(SETTINGS_KEY, newSettings);
    if (slug === state.novelSlug) {
      state.settings = newSettings;
    }
    log(state.globalSettings, `WTR Term Replacer: Settings updated for slug ${slug}`);
  }
}