// UI creation and manipulation for WTR Lab Term Replacer
// Hot reload test - development workflow verification
import { state } from "./state";
import * as Handlers from "./handlers";
import { log } from "./utils";
import { ITEMS_PER_PAGE } from "./config";
import { getDisplayVersion } from "../../config/versions";

const UI_HTML = `
    <div class="wtr-replacer-header">
        <h2>Term Replacer ${getDisplayVersion()}</h2>
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

export function createUI() {
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
    state.importType = 'novel';
    document.getElementById('wtr-file-input').click();
  });
  uiContainer.querySelector('#wtr-import-all-btn').addEventListener('click', () => {
    state.importType = 'all';
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
    if (state.currentPage > 1) {
      state.currentPage = 1;
      renderTermList(state.currentSearchValue);
    }
  });
  uiContainer.querySelector('#wtr-prev-page-btn').addEventListener('click', () => {
    if (state.currentPage > 1) {
      state.currentPage--;
      renderTermList(state.currentSearchValue);
    }
  });
  uiContainer.querySelector('#wtr-next-page-btn').addEventListener('click', () => {
    const filteredTerms = state.terms.filter(
      t =>
        t.original.toLowerCase().includes(state.currentSearchValue.toLowerCase()) ||
        t.replacement.toLowerCase().includes(state.currentSearchValue.toLowerCase())
    );
    const totalPages = Math.ceil(filteredTerms.length / ITEMS_PER_PAGE) || 1;
    if (state.currentPage < totalPages) {
      state.currentPage++;
      renderTermList(state.currentSearchValue);
    }
  });
  uiContainer.querySelector('#wtr-last-page-btn').addEventListener('click', () => {
    const filteredTerms = state.terms.filter(
      t =>
        t.original.toLowerCase().includes(state.currentSearchValue.toLowerCase()) ||
        t.replacement.toLowerCase().includes(state.currentSearchValue.toLowerCase())
    );
    const totalPages = Math.ceil(filteredTerms.length / ITEMS_PER_PAGE) || 1;
    if (state.currentPage < totalPages) {
      state.currentPage = totalPages;
      renderTermList(state.currentSearchValue);
    }
  });

  log(state.globalSettings, 'WTR Term Replacer: UI created successfully');
}

export function showProcessingIndicator(show) {
  const overlay = document.querySelector('.wtr-processing-overlay');
  if (overlay) overlay.style.display = show ? 'flex' : 'none';
}

export function showUILoader() {
  const loader = document.getElementById('wtr-ui-loader');
  if (loader) loader.style.display = 'flex';
  const content = document.querySelector('.wtr-replacer-content');
  if (content) content.style.pointerEvents = 'none';
}

export function hideUILoader() {
  const loader = document.getElementById('wtr-ui-loader');
  if (loader) loader.style.display = 'none';
  const content = document.querySelector('.wtr-replacer-content');
  if (content) content.style.pointerEvents = 'auto';
}

export function renderTermList(filter = '') {
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
  const shouldRestoreScroll = previousScrollTop > 0 && !state.isDupMode && filter === state.currentSearchValue;
  
  listEl.innerHTML = '';

  let filteredTerms;
  let termsToRender;

  if (state.isDupMode) {
    const currentKey = state.dupKeys[state.currentDupIndex];
    filteredTerms = state.dupGroups.get(currentKey) || [];
    document.getElementById('wtr-dup-message').textContent = `Duplicate group ${state.currentDupIndex + 1} of ${
      state.dupKeys.length
    } — ${currentKey}`;
    document.getElementById('wtr-dup-message').style.display = 'block';
    document.getElementById('wtr-dup-controls').style.display = 'flex';
    document.getElementById('wtr-prev-dup-btn').disabled = state.currentDupIndex === 0;
    document.getElementById('wtr-next-dup-btn').disabled = state.currentDupIndex === state.dupKeys.length - 1;
    document.getElementById('wtr-search-bar').disabled = true;
    paginationControls.style.display = 'none';
    termsToRender = filteredTerms;
  } else {
    const filterLower = filter.toLowerCase();
    filteredTerms = state.terms.filter(
      t => t.original.toLowerCase().includes(filterLower) || t.replacement.toLowerCase().includes(filterLower)
    );
    document.getElementById('wtr-dup-message').style.display = 'none';
    document.getElementById('wtr-dup-controls').style.display = 'none';
    document.getElementById('wtr-search-bar').disabled = false;

    const totalPages = Math.ceil(filteredTerms.length / ITEMS_PER_PAGE) || 1;
    state.currentPage = Math.max(1, Math.min(state.currentPage, totalPages));

    const start = (state.currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    termsToRender = filteredTerms.slice(start, end);

    if (totalPages > 1) {
      paginationControls.style.display = 'flex';
      pageIndicator.textContent = `Page ${state.currentPage} of ${totalPages}`;
      firstBtn.disabled = state.currentPage === 1;
      prevBtn.disabled = state.currentPage === 1;
      nextBtn.disabled = state.currentPage === totalPages;
      lastBtn.disabled = state.currentPage === totalPages;
    } else {
      paginationControls.style.display = 'none';
    }
  }

  if (termsToRender.length === 0) {
    listEl.innerHTML = state.terms.length === 0 ? '<li>No terms defined.</li>' : '<li>No terms match search.</li>';
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

export function showUIPanel() {
  const ui = document.querySelector('.wtr-replacer-ui');
  ui.style.display = 'flex';
  document.getElementById('wtr-disable-all').checked = state.settings.isDisabled;

  // Restore saved location when showing the terms tab
  if (document.querySelector('.wtr-replacer-tab-btn.active').dataset.tab === 'terms') {
    Handlers.restoreTermListLocation();
  } else {
    renderTermList();
  }
}

export function hideUIPanel() {
  // Save current location before hiding
  Handlers.saveTermListLocation();
  document.querySelector('.wtr-replacer-ui').style.display = 'none';
  clearTermList();
}

export function clearTermList() {
  const listEl = document.querySelector('.wtr-replacer-term-list');
  if (listEl) listEl.innerHTML = '';
}

export function showFormView(term = null) {
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
      const validationEvent = new Event('input', { bubbles: true });
      originalTextarea.dispatchEvent(validationEvent);
    }
  }, 10);
}

export function switchTab(tabName) {
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

export function addMenuButton() {
  const container = document.querySelector('div.col-6:has(button.term-edit-btn)');
  if (!container || state.observedMenuContainers.has(container)) {
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
        className: originalButton.className, // Copy classes for styling
        tooltip: 'Open WTR Term Settings'
      });
      
      container.appendChild(settingsButton);
      log(state.globalSettings, 'WTR Term Replacer: Settings button created with simple icon system.');
    }

    // 2. Enforce the correct order (our button should be last)
    if (container.lastChild !== settingsButton) {
      container.appendChild(settingsButton);
      log(state.globalSettings, 'WTR Term Replacer: Settings button order corrected.');
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
    log(state.globalSettings, 'WTR Term Replacer: Detected change in menu container, ensuring button state.');
    ensureButtonState();
  });
  observer.observe(container, { childList: true });

  // Mark this container as observed to prevent re-attaching observers
  state.observedMenuContainers.add(container);
}