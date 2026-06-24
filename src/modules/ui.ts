import { state } from "./state"
import * as Handlers from "./handlers"
import { exitDupMode, changeDupGroup } from "./duplicates"
import { escapeRegExp, log } from "./utils"
import { ITEMS_PER_PAGE } from "./config"
import { getDisplayVersion } from "../../config/versions"

const UI_HTML = `
    <div class="wtr-replacer-header">
        <h2>Term Replacer ${getDisplayVersion()}</h2>
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
`

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
`

function parseRgbColor(value: string | null | undefined): number[] | null {
	const match = value?.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
	return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null
}

function isDarkRgb(value: string | null | undefined): boolean {
	const rgb = parseRgbColor(value)
	if (!rgb) {
		return false
	}
	const [r, g, b] = rgb
	return (0.2126 * r + 0.7152 * g + 0.0722 * b) < 128
}

function hasPressedDarkThemeControl(): boolean {
	const pressedControls = Array.from(document.querySelectorAll('[aria-pressed="true"], [data-pressed]'))
	const hasDarkPressed = pressedControls.some((control) => normalizeMenuText(control) === "Dark")
	const hasLightPressed = pressedControls.some((control) => normalizeMenuText(control) === "Light")
	if (hasDarkPressed) {
		return true
	}
	if (hasLightPressed) {
		return false
	}
	return false
}

function hasDarkReaderThemeSample(): boolean {
	const selectedSamples = Array.from(document.querySelectorAll('button[style*="background-color"]')).filter((button) => {
		const text = normalizeMenuText(button)
		const className = typeof button.className === "string" ? button.className : button.getAttribute("class") || ""
		return text.includes('"Aa"') && /ring-primary|data-\[state=on\]|aria-pressed/.test(className)
	}) as HTMLElement[]
	return selectedSamples.some((button) => isDarkRgb(button.style.backgroundColor || getComputedStyle(button).backgroundColor))
}

function isWtrDarkModeActive(): boolean {
	if (document.documentElement.classList.contains("dark") || document.body.classList.contains("dark")) {
		return true
	}
	if (hasPressedDarkThemeControl() || hasDarkReaderThemeSample()) {
		return true
	}
	const pageBg = getComputedStyle(document.body).backgroundColor || getComputedStyle(document.documentElement).backgroundColor
	return isDarkRgb(pageBg) || window.matchMedia?.("(prefers-color-scheme: dark)")?.matches === true
}

export function syncUITheme() {
	const uiContainer = document.querySelector(".wtr-replacer-ui") as HTMLElement | null
	if (!uiContainer) {
		return
	}
	uiContainer.dataset.theme = isWtrDarkModeActive() ? "dark" : "light"
}

// Cache for the native floating "Add Term" button to avoid scanning every button on every mutation.
let nativeAddTermButtonCache: { button: HTMLButtonElement | null; expiresAt: number } = {
	button: null,
	expiresAt: 0,
}
const NATIVE_ADD_TERM_CACHE_TTL = 1000

function findNativeFloatingAddTermButton(): HTMLButtonElement | null {
	const now = Date.now()
	if (now < nativeAddTermButtonCache.expiresAt) {
		// Verify the cached button is still in the DOM before reusing it.
		const cached = nativeAddTermButtonCache.button
		if (!cached || document.contains(cached)) {
			return cached
		}
	}

	// Prefer scoped selectors over scanning every button on the page.
	// The native control lives inside fixed/reader chrome, so check those containers first.
	const scopedRoots = document.querySelectorAll<HTMLElement>(".fixed, [role='toolbar'], .chapter-wrap, .chapter-tracker")
	let match: HTMLButtonElement | null = null
	for (const root of scopedRoots) {
		match =
			(Array.from(root.querySelectorAll<HTMLButtonElement>("button")).find(
				(button) =>
					normalizeMenuText(button) === "Add Term" &&
					!button.classList.contains("wtr-add-term-float-btn"),
			) as HTMLButtonElement | undefined) || null
		if (match) {
			break
		}
	}

	// Fall back to a full scan only if scoped lookup missed (e.g. custom layouts).
	if (!match) {
		match =
			(Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
				(button) =>
					normalizeMenuText(button) === "Add Term" &&
					!button.classList.contains("wtr-add-term-float-btn"),
			) as HTMLButtonElement | undefined) || null
	}

	nativeAddTermButtonCache = { button: match, expiresAt: now + NATIVE_ADD_TERM_CACHE_TTL }
	return match
}

export function syncFloatingAddTermButtonPosition() {
	const floatBtn = document.querySelector(".wtr-add-term-float-btn") as HTMLElement | null
	if (!floatBtn) {
		return
	}
	const nativeButton = findNativeFloatingAddTermButton()
	const nativeContainer = nativeButton?.closest(".fixed") as HTMLElement | null
	const anchor = nativeContainer || nativeButton
	const rect = anchor?.getBoundingClientRect()
	if (rect && rect.width > 0 && rect.height > 0) {
		const gap = 8
		floatBtn.style.right = `${Math.max(12, Math.round(window.innerWidth - rect.right))}px`
		floatBtn.style.bottom = `${Math.max(20, Math.round(window.innerHeight - rect.top + gap))}px`
		return
	}
	floatBtn.style.right = "1rem"
	floatBtn.style.bottom = window.innerWidth <= 640 ? "11rem" : "7.25rem"
}

function getTextInputSoftMax(input: HTMLInputElement | HTMLTextAreaElement | null): number {
	return Number(input?.dataset?.softMax) || 512
}

function updateCharacterCounter(input: HTMLInputElement | HTMLTextAreaElement | null, counter: Element | null) {
	if (!input || !counter) {
		return
	}
	const max = getTextInputSoftMax(input)
	const length = input.value.length
	counter.textContent = `${length}/${max}`
	counter.classList.toggle("wtr-counter-warning", length > max * 0.8 && length <= max)
	counter.classList.toggle("wtr-counter-danger", length > max)
}

function splitVariationParts(value: string): string[] {
	const parts = value
		.split(/\s*(?:\||\/|,|;|\n)\s*/)
		.map((part) => part.trim())
		.filter(Boolean)
	const deduped = new Map<string, string>()
	parts.forEach((part) => deduped.set(part.toLocaleLowerCase(), part))
	return Array.from(deduped.values()).sort((a, b) => b.length - a.length || a.localeCompare(b))
}

function replaceInputRange(input: HTMLInputElement | HTMLTextAreaElement, replacement: string) {
	const start = input.selectionStart ?? input.value.length
	const end = input.selectionEnd ?? start
	input.value = `${input.value.slice(0, start)}${replacement}${input.value.slice(end)}`
	const cursor = start + replacement.length
	input.setSelectionRange(cursor, cursor)
	input.dispatchEvent(new Event("input", { bubbles: true }))
	input.focus()
}

function normalizeOriginalAsVariations(originalInput: HTMLTextAreaElement, regexCheckbox: HTMLInputElement) {
	const selectedText = originalInput.selectionStart !== null && originalInput.selectionEnd !== null && originalInput.selectionEnd > originalInput.selectionStart
		? originalInput.value.slice(originalInput.selectionStart, originalInput.selectionEnd)
		: ""
	const sourceText = selectedText || originalInput.value
	const parts = splitVariationParts(sourceText)
	if (parts.length === 0) {
		return
	}
	const normalized = parts.map((part) => escapeRegExp(part)).join("|")
	regexCheckbox.checked = true
	if (selectedText) {
		replaceInputRange(originalInput, normalized)
	} else {
		originalInput.value = normalized
		originalInput.dispatchEvent(new Event("input", { bubbles: true }))
		originalInput.focus()
	}
	disableWholeWordForRegex()
}

function insertWildChar(originalInput: HTMLTextAreaElement, regexCheckbox: HTMLInputElement) {
	const start = originalInput.selectionStart ?? originalInput.value.length
	const end = originalInput.selectionEnd ?? start
	const selectedText = end > start ? originalInput.value.slice(start, end) : ""
	const wildcard = selectedText
		? escapeRegExp(selectedText.trim()).replace(/\\\s\+/g, "\\s+").replace(/\s+/g, "\\s+")
		: ".*?"
	regexCheckbox.checked = true
	replaceInputRange(originalInput, wildcard)
	disableWholeWordForRegex()
}

function disableWholeWordForRegex() {
	const wholeWordCheckbox = document.getElementById("wtr-whole-word") as HTMLInputElement | null
	if (wholeWordCheckbox) {
		wholeWordCheckbox.checked = false
		wholeWordCheckbox.disabled = true
	}
}

// Single consolidated, debounced MutationObserver for all UI hardening concerns:
// theme syncing, menu button injection, floating button positioning, and term popover
// enhancement. Replaces the previous separate observers that each watched document.body.
function setupUIObserver() {
	let syncTimeout: ReturnType<typeof setTimeout> | null = null
	let pendingNodes: Element[] = []

	const flush = () => {
		syncTimeout = null
		syncUITheme()
		addMenuButton()
		syncFloatingAddTermButtonPosition()
		if (pendingNodes.length > 0) {
			for (const node of pendingNodes) {
				Handlers.enhanceWtrTermPopovers(node)
			}
			pendingNodes = []
		}
	}

	const scheduleSync = () => {
		if (syncTimeout) {
			clearTimeout(syncTimeout)
		}
		syncTimeout = setTimeout(flush, 150)
	}

	const observer = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
				mutation.addedNodes.forEach((node) => {
					if (node instanceof Element) {
						pendingNodes.push(node)
					}
				})
			}
		}
		scheduleSync()
	})
	observer.observe(document.body, {
		childList: true,
		subtree: true,
		attributes: true,
		attributeFilter: ["class", "style", "aria-pressed", "data-pressed"],
	})
	document.addEventListener("click", scheduleSync, true)
	window.addEventListener("resize", scheduleSync)
	scheduleSync()
}

export function createUI() {
	if (document.querySelector(".wtr-replacer-ui")) {
		return
	}
	GM_addStyle(UI_CSS)

	const uiContainer = document.createElement("div")
	uiContainer.className = "wtr-replacer-ui"
	uiContainer.innerHTML = UI_HTML
	document.body.appendChild(uiContainer)
	syncUITheme()

	const processingOverlay = document.createElement("div")
	processingOverlay.className = "wtr-processing-overlay"
	processingOverlay.textContent = "Processing..."
	document.body.appendChild(processingOverlay)

	// Event Listeners
	uiContainer.querySelector(".wtr-replacer-close-btn").addEventListener("click", Handlers.hideUIPanel)
	uiContainer.querySelector("#wtr-disable-all").addEventListener("change", Handlers.handleDisableToggle)
	uiContainer.querySelector("#wtr-save-btn").addEventListener("click", Handlers.handleSaveTerm)
	uiContainer.querySelector("#wtr-refresh-suggestions-btn").addEventListener("click", Handlers.handleRefreshSuggestionsClick)
	uiContainer.querySelector("#wtr-replacement-suggestions").addEventListener("click", Handlers.handleReplacementSuggestionClick)
	uiContainer.querySelector("#wtr-delete-selected-btn").addEventListener("click", Handlers.handleDeleteSelected)
	uiContainer.querySelector("#wtr-search-bar").addEventListener("input", Handlers.handleSearch)
	uiContainer.querySelector(".wtr-replacer-term-list").addEventListener("click", Handlers.handleListInteraction)
	uiContainer
		.querySelectorAll(".wtr-replacer-tab-btn")
		.forEach((btn) => btn.addEventListener("click", Handlers.handleTabSwitch))
	uiContainer.querySelector("#wtr-export-novel-btn").addEventListener("click", Handlers.handleExportNovel)
	uiContainer.querySelector("#wtr-export-all-btn").addEventListener("click", Handlers.handleExportAll)
	uiContainer.querySelector("#wtr-export-combined-btn").addEventListener("click", Handlers.handleExportCombined)
	uiContainer.querySelector("#wtr-import-novel-btn").addEventListener("click", () => {
		state.importType = "novel"
		document.getElementById("wtr-file-input").click()
	})
	uiContainer.querySelector("#wtr-import-all-btn").addEventListener("click", () => {
		state.importType = "all"
		document.getElementById("wtr-file-input").click()
	})
	uiContainer.querySelector("#wtr-file-input").addEventListener("change", Handlers.handleFileImport)
	uiContainer.querySelector("#wtr-find-duplicates-btn").addEventListener("click", Handlers.handleFindDuplicates)
	uiContainer.querySelector("#wtr-prev-dup-btn").addEventListener("click", () => changeDupGroup(-1))
	uiContainer.querySelector("#wtr-next-dup-btn").addEventListener("click", () => changeDupGroup(1))
	uiContainer.querySelector("#wtr-exit-dup-btn").addEventListener("click", exitDupMode)
	document.addEventListener("click", Handlers.handleWtrTextPatchClick, true)
	document.addEventListener("click", Handlers.handleWtrPopoverAddTermClick)
	Handlers.enhanceWtrTermPopovers(document)
	setupUIObserver()

	// Add scroll event listener to save term list location
	const contentArea = uiContainer.querySelector(".wtr-replacer-content")
	if (contentArea) {
		let scrollTimeout
		contentArea.addEventListener("scroll", () => {
			clearTimeout(scrollTimeout)
			scrollTimeout = setTimeout(() => {
				if (document.querySelector(".wtr-replacer-tab-btn.active").dataset.tab === "terms") {
					Handlers.saveTermListLocation()
				}
			}, 1000) // Save after 1 second of inactivity
		})
	}

	// Character-based auto-resize for original text field
	const regexCheckbox = uiContainer.querySelector("#wtr-is-regex") as HTMLInputElement
	const caseSensitiveCheckbox = uiContainer.querySelector("#wtr-case-sensitive") as HTMLInputElement
	const wholeWordCheckbox = uiContainer.querySelector("#wtr-whole-word") as HTMLInputElement
	regexCheckbox.addEventListener("change", (e) => {
		wholeWordCheckbox.disabled = e.target.checked
		if (e.target.checked) {
			wholeWordCheckbox.checked = false
			Handlers.normalizeOriginalRegexField()
		}
	})

	const originalTextarea = uiContainer.querySelector("#wtr-original") as HTMLTextAreaElement
	function autoResizeTextarea() {
		if (!originalTextarea) {
			return
		}

		const text = originalTextarea.value
		const charCount = text.length
		const lines = Math.ceil(charCount / 40)
		const maxLines = Infinity
		const finalLines = Math.min(lines, maxLines)
		originalTextarea.rows = Math.max(1, finalLines)
	}

	originalTextarea.addEventListener("input", autoResizeTextarea)
	originalTextarea.addEventListener("input", Handlers.handleReplacementSuggestionInput)
	originalTextarea.addEventListener("focus", autoResizeTextarea)
	originalTextarea.addEventListener("focus", Handlers.handleSuggestionTargetFocus)
	regexCheckbox.addEventListener("change", () => Handlers.handleReplacementSuggestionInput({ target: originalTextarea, mergeExisting: true }))
	caseSensitiveCheckbox.addEventListener("change", () => Handlers.handleReplacementSuggestionInput({ target: originalTextarea, mergeExisting: true }))

	// Real-time regex validation system
	const saveButton = uiContainer.querySelector("#wtr-save-btn")
	const replacementInput = uiContainer.querySelector("#wtr-replacement") as HTMLInputElement
	const originalCounter = uiContainer.querySelector("#wtr-original-counter")
	const replacementCounter = uiContainer.querySelector("#wtr-replacement-counter")
	const updateAllCharacterCounters = () => {
		updateCharacterCounter(originalTextarea, originalCounter)
		updateCharacterCounter(replacementInput, replacementCounter)
	}
	replacementInput.addEventListener("focus", Handlers.handleSuggestionTargetFocus)
	replacementInput.addEventListener("input", updateAllCharacterCounters)
	originalTextarea.addEventListener("input", updateAllCharacterCounters)
	uiContainer.querySelector("#wtr-variation-btn").addEventListener("click", () => normalizeOriginalAsVariations(originalTextarea, regexCheckbox))
	uiContainer.querySelector("#wtr-wildchar-btn").addEventListener("click", () => insertWildChar(originalTextarea, regexCheckbox))

	function updateValidationVisual(state) {
		// Remove all validation classes
		originalTextarea.classList.remove("wtr-field-invalid", "wtr-field-valid", "wtr-field-warning")

		if (state === "invalid") {
			originalTextarea.classList.add("wtr-field-invalid")
		} else if (state === "valid") {
			originalTextarea.classList.add("wtr-field-valid")
		} else if (state === "warning") {
			originalTextarea.classList.add("wtr-field-warning")
		}
	}

	function looksLikeRegexSyntax(value) {
		return /(^|[^\\])\|/.test(value) || /\\[bBdDsSwW]/.test(value) || /\[[^\]]+\]/.test(value) || /\([^)]*\|[^)]*\)/.test(value) || /\.\*/.test(value) || /[+*?{}^$]/.test(value)
	}

	function validateAndUpdateUI() {
		const isRegexEnabled = regexCheckbox.checked
		const originalText = originalTextarea.value.trim()
		const replacementText = replacementInput.value.trim()
		const isValidInput = originalText.length > 0 && replacementText.length > 0
		const regexWarning = document.getElementById("wtr-regex-disabled-warning")
		const shouldWarnRegexDisabled = !isRegexEnabled && originalText.length > 0 && looksLikeRegexSyntax(originalText)

		if (regexWarning) {
			regexWarning.style.display = shouldWarnRegexDisabled ? "block" : "none"
		}

		if (!isRegexEnabled || originalText.length === 0) {
			// Not a regex or empty field, clear validation state unless the text looks like regex syntax.
			updateValidationVisual(shouldWarnRegexDisabled ? "warning" : null)
			saveButton.disabled = !isValidInput
			return
		}

		// Validate regex pattern
		const validation = Handlers.validateRegexSilent(originalText)

		if (validation.isValid) {
			updateValidationVisual("valid")
			saveButton.disabled = !isValidInput
		} else {
			updateValidationVisual("invalid")
			saveButton.disabled = true
		}
	}

	// Add real-time validation listeners
	originalTextarea.addEventListener("input", validateAndUpdateUI)
	replacementInput.addEventListener("input", validateAndUpdateUI)
	regexCheckbox.addEventListener("change", validateAndUpdateUI)

	// Initial validation state
	validateAndUpdateUI()
	updateAllCharacterCounters()

	// Create floating action button
	const addTermFloatBtn = document.createElement("button")
	addTermFloatBtn.type = "button"
	addTermFloatBtn.className = "wtr-add-term-float-btn"
	addTermFloatBtn.title = "Add selected text to WTR Term Replacer"
	addTermFloatBtn.innerHTML = '<svg class="icon inline-flex shrink-0 size-4"><use href="#edit"></use></svg><span>Replacer Term</span>'
	document.body.appendChild(addTermFloatBtn)
	syncFloatingAddTermButtonPosition()
	addTermFloatBtn.addEventListener("click", Handlers.handleAddTermFromSelection)
	document.addEventListener("mouseup", Handlers.handleTextSelection)
	document.addEventListener("touchend", Handlers.handleTextSelection)

	// Pagination Listeners
	uiContainer.querySelector("#wtr-first-page-btn").addEventListener("click", () => {
		if (state.currentPage > 1) {
			state.currentPage = 1
			renderTermList(state.currentSearchValue)
		}
	})
	uiContainer.querySelector("#wtr-prev-page-btn").addEventListener("click", () => {
		if (state.currentPage > 1) {
			state.currentPage--
			renderTermList(state.currentSearchValue)
		}
	})
	uiContainer.querySelector("#wtr-next-page-btn").addEventListener("click", () => {
		const filteredTerms = state.terms.filter(
			(t) =>
				t.original.toLowerCase().includes(state.currentSearchValue.toLowerCase()) ||
				t.replacement.toLowerCase().includes(state.currentSearchValue.toLowerCase()),
		)
		const totalPages = Math.ceil(filteredTerms.length / ITEMS_PER_PAGE) || 1
		if (state.currentPage < totalPages) {
			state.currentPage++
			renderTermList(state.currentSearchValue)
		}
	})
	uiContainer.querySelector("#wtr-last-page-btn").addEventListener("click", () => {
		const filteredTerms = state.terms.filter(
			(t) =>
				t.original.toLowerCase().includes(state.currentSearchValue.toLowerCase()) ||
				t.replacement.toLowerCase().includes(state.currentSearchValue.toLowerCase()),
		)
		const totalPages = Math.ceil(filteredTerms.length / ITEMS_PER_PAGE) || 1
		if (state.currentPage < totalPages) {
			state.currentPage = totalPages
			renderTermList(state.currentSearchValue)
		}
	})

	log(state.globalSettings, "WTR Term Replacer: UI created successfully")
}

export function showProcessingIndicator(show) {
	const overlay = document.querySelector(".wtr-processing-overlay")
	if (overlay) {
		overlay.style.display = show ? "flex" : "none"
	}
}

export function showUILoader() {
	const loader = document.getElementById("wtr-ui-loader")
	if (loader) {
		loader.style.display = "flex"
	}
	const content = document.querySelector(".wtr-replacer-content")
	if (content) {
		content.style.pointerEvents = "none"
	}
}

export function hideUILoader() {
	const loader = document.getElementById("wtr-ui-loader")
	if (loader) {
		loader.style.display = "none"
	}
	const content = document.querySelector(".wtr-replacer-content")
	if (content) {
		content.style.pointerEvents = "auto"
	}
}

export function renderTermList(filter = "") {
	const listEl = document.querySelector(".wtr-replacer-term-list")
	const paginationControls = document.querySelector(".wtr-pagination-controls")
	const pageIndicator = document.getElementById("wtr-page-indicator")
	const firstBtn = document.getElementById("wtr-first-page-btn")
	const prevBtn = document.getElementById("wtr-prev-page-btn")
	const nextBtn = document.getElementById("wtr-next-page-btn")
	const lastBtn = document.getElementById("wtr-last-page-btn")
	const contentArea = document.querySelector(".wtr-replacer-content")

	if (!listEl || !paginationControls || !pageIndicator || !prevBtn || !nextBtn || !firstBtn || !lastBtn) {
		return
	}

	// Capture current scroll position before re-rendering
	const previousScrollTop = contentArea ? contentArea.scrollTop : 0
	const shouldRestoreScroll = previousScrollTop > 0 && !state.isDupMode && filter === state.currentSearchValue

	listEl.innerHTML = ""

	let filteredTerms
	let termsToRender

	if (state.isDupMode) {
		const currentKey = state.dupKeys[state.currentDupIndex]
		filteredTerms = state.dupGroups.get(currentKey) || []
		document.getElementById("wtr-dup-message").textContent = `Duplicate group ${state.currentDupIndex + 1} of ${
			state.dupKeys.length
		} — ${currentKey}`
		document.getElementById("wtr-dup-message").style.display = "block"
		document.getElementById("wtr-dup-controls").style.display = "flex"
		document.getElementById("wtr-prev-dup-btn").disabled = state.currentDupIndex === 0
		document.getElementById("wtr-next-dup-btn").disabled = state.currentDupIndex === state.dupKeys.length - 1
		document.getElementById("wtr-search-bar").disabled = true
		paginationControls.style.display = "none"
		termsToRender = filteredTerms
	} else {
		const filterLower = filter.toLowerCase()
		filteredTerms = state.terms.filter(
			(t) => t.original.toLowerCase().includes(filterLower) || t.replacement.toLowerCase().includes(filterLower),
		)
		document.getElementById("wtr-dup-message").style.display = "none"
		document.getElementById("wtr-dup-controls").style.display = "none"
		document.getElementById("wtr-search-bar").disabled = false

		const totalPages = Math.ceil(filteredTerms.length / ITEMS_PER_PAGE) || 1
		state.currentPage = Math.max(1, Math.min(state.currentPage, totalPages))

		const start = (state.currentPage - 1) * ITEMS_PER_PAGE
		const end = start + ITEMS_PER_PAGE
		termsToRender = filteredTerms.slice(start, end)

		if (totalPages > 1) {
			paginationControls.style.display = "flex"
			pageIndicator.textContent = `Page ${state.currentPage} of ${totalPages}`
			firstBtn.disabled = state.currentPage === 1
			prevBtn.disabled = state.currentPage === 1
			nextBtn.disabled = state.currentPage === totalPages
			lastBtn.disabled = state.currentPage === totalPages
		} else {
			paginationControls.style.display = "none"
		}
	}

	if (termsToRender.length === 0) {
		listEl.innerHTML = state.terms.length === 0 ? "<li>No terms defined.</li>" : "<li>No terms match search.</li>"
	} else {
		const fragment = document.createDocumentFragment()
		termsToRender.forEach((term) => {
			const li = document.createElement("li")
			li.className = "wtr-replacer-term-item"
			li.dataset.id = term.id

			const checkbox = document.createElement("input")
			checkbox.type = "checkbox"
			checkbox.className = "wtr-replacer-term-select"
			checkbox.dataset.id = term.id
			li.appendChild(checkbox)

			const details = document.createElement("div")
			details.className = "wtr-replacer-term-details"

			const termText = document.createElement("div")
			termText.className = "wtr-replacer-term-text"
			const originalSpan = document.createElement("span")
			originalSpan.className = "wtr-term-original"
			originalSpan.textContent = term.original
			const replacementSpan = document.createElement("span")
			replacementSpan.className = "wtr-term-replacement"
			replacementSpan.textContent = term.replacement
			termText.appendChild(originalSpan)
			termText.appendChild(document.createTextNode(" → "))
			termText.appendChild(replacementSpan)
			details.appendChild(termText)

			const flags = document.createElement("div")
			if (term.caseSensitive) {
				const badge = document.createElement("small")
				badge.textContent = "CS"
				flags.appendChild(badge)
				flags.appendChild(document.createTextNode(" "))
			}
			if (term.isRegex) {
				const badge = document.createElement("small")
				badge.textContent = "RX"
				flags.appendChild(badge)
				flags.appendChild(document.createTextNode(" "))
			}
			if (term.wholeWord) {
				const badge = document.createElement("small")
				badge.textContent = "WW"
				flags.appendChild(badge)
			}
			details.appendChild(flags)
			li.appendChild(details)

			const actionWrap = document.createElement("div")
			const editButton = document.createElement("button")
			editButton.type = "button"
			editButton.className = "btn btn-secondary btn-sm wtr-edit-btn"
			editButton.dataset.id = term.id
			editButton.textContent = "Edit"
			actionWrap.appendChild(editButton)
			li.appendChild(actionWrap)

			fragment.appendChild(li)
		})
		listEl.appendChild(fragment)
	}

	// Restore scroll position after DOM update if it was captured
	if (shouldRestoreScroll && contentArea) {
		// Use requestAnimationFrame to ensure DOM has been updated
		requestAnimationFrame(() => {
			contentArea.scrollTop = previousScrollTop
		})
	}
}

export function showUIPanel() {
	syncUITheme()
	const ui = document.querySelector(".wtr-replacer-ui")
	ui.style.display = "flex"
	document.getElementById("wtr-disable-all").checked = state.settings.isDisabled

	// Restore saved location when showing the terms tab
	if (document.querySelector(".wtr-replacer-tab-btn.active").dataset.tab === "terms") {
		Handlers.restoreTermListLocation()
	} else {
		renderTermList()
	}
}

export function hideUIPanel() {
	// Save current location before hiding
	Handlers.saveTermListLocation()
	document.querySelector(".wtr-replacer-ui").style.display = "none"
	clearTermList()
}

export function clearTermList() {
	const listEl = document.querySelector(".wtr-replacer-term-list")
	if (listEl) {
		listEl.innerHTML = ""
	}
}

function dispatchUiOnlyInput(element: Element | null) {
	if (!element) {
		return
	}
	const event = new Event("input", { bubbles: true })
	;(event as any).wtrSkipSuggestions = true
	element.dispatchEvent(event)
}

export function showFormView(term = null) {
	if (!term) {
		Handlers.clearDiscoveryFormState()
	}
	document.getElementById("wtr-term-id").value = term ? term.id : ""
	document.getElementById("wtr-original").value = term ? term.original : ""
	document.getElementById("wtr-replacement").value = term ? term.replacement : ""
	document.getElementById("wtr-case-sensitive").checked = term ? term.caseSensitive : false
	document.getElementById("wtr-is-regex").checked = term ? term.isRegex : false
	document.getElementById("wtr-whole-word").checked = term ? term.wholeWord : false
	document.getElementById("wtr-whole-word").disabled = term ? term.isRegex : false
	document.getElementById("wtr-save-btn").textContent = term ? "Update Term" : "Save Term"
	dispatchUiOnlyInput(document.getElementById("wtr-original"))
	dispatchUiOnlyInput(document.getElementById("wtr-replacement"))
	switchTab("add")

	// Initialize auto-resize after form is populated
	setTimeout(() => {
		const originalTextarea = document.getElementById("wtr-original")
		if (originalTextarea) {
			const text = originalTextarea.value
			const charCount = text.length
			const lines = Math.ceil(charCount / 40)
			originalTextarea.rows = Math.max(1, lines)
		}

		// Re-initialize validation state for the form
		const regexCheckbox = document.getElementById("wtr-is-regex")
		if (regexCheckbox) {
			dispatchUiOnlyInput(originalTextarea)
		}
	}, 10)
}

export function switchTab(tabName) {
	document.querySelector(`.wtr-replacer-tab-btn[data-tab="${tabName}"]`).click()
}

// Simple function to create menu buttons with inline SVG icons
function createSimpleMenuButton(options) {
	const { text = "Settings", onClick = null, className = "", tooltip = "" } = options

	const button = document.createElement("button")
	button.type = "button"
	button.className = `replacer-settings-btn ${className}`.trim()
	if (tooltip) {
		button.title = tooltip
	}

	// Create settings icon using the specified SVG
	const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
	svg.setAttribute("xmlns", "http://www.w3.org/2000/svg")
	svg.setAttribute("height", "24px")
	svg.setAttribute("viewBox", "0 -960 960 960")
	svg.setAttribute("width", "24px")
	svg.setAttribute("fill", "currentColor")
	svg.style.marginRight = "4px"
	svg.style.verticalAlign = "middle"
	svg.innerHTML =
		'<path d="M700-120h40v-100h100v-40H740v-100h-40v100H600v40h100v100Zm20 80q-83 0-141.5-58.5T520-240q0-83 58.5-141.5T720-440q83 0 141.5 58.5T920-240q0 83-58.5 141.5T720-40ZM280-600h400v-80H280v80Zm187 480H200q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v268q-29-14-58.5-21t-61.5-7q-11 0-20.5.5T680-517v-3H280v80h245q-18 17-32.5 37T467-360H280v80h163q-2 10-2.5 19.5T440-240q0 33 6 61.5t21 58.5Z"/>'

	button.appendChild(svg)

	// Add text
	const textSpan = document.createElement("span")
	textSpan.textContent = text
	button.appendChild(textSpan)

	// Add click handler
	if (onClick) {
		button.addEventListener("click", onClick)
	}

	return button
}

function normalizeMenuText(element) {
	return (element?.textContent || "").replace(/\s+/g, " ").trim()
}

// Cache for menu button targets to avoid scanning every button on every mutation.
let menuButtonTargetsCache: { targets: ReturnType<typeof computeMenuButtonTargets>; expiresAt: number } = {
	targets: [],
	expiresAt: 0,
}
const MENU_BUTTON_TARGETS_CACHE_TTL = 1000

type MenuButtonTarget = {
	container: Element
	originalButton: HTMLButtonElement
	layout: "legacy" | "new-grid"
}

function computeMenuButtonTargets(): MenuButtonTarget[] {
	const targets: MenuButtonTarget[] = []
	const legacyButton = document.querySelector("button.term-edit-btn:not(.replacer-settings-btn)") as HTMLButtonElement | null
	const legacyContainer = legacyButton?.closest("div.col-6, [role='group'], .btn-group")
	if (legacyButton && legacyContainer) {
		targets.push({ container: legacyContainer, originalButton: legacyButton, layout: "legacy" })
	}

	// Scope the "Edit Terms" button scan to likely containers before falling back to a full scan.
	const scopedRoots = document.querySelectorAll<HTMLElement>(
		".grid, [data-slot='tabs-content'], .chapter-wrap, .chapter-tracker",
	)
	const seenContainers = new Set<Element>()
	for (const root of scopedRoots) {
		const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>("button")).filter(
			(button) => normalizeMenuText(button) === "Edit Terms" && !button.classList.contains("replacer-settings-btn"),
		)
		for (const button of buttons) {
			const container = button.closest(".grid, [data-slot='tabs-content'], .chapter-wrap, .chapter-tracker")
			if (container && !seenContainers.has(container)) {
				seenContainers.add(container)
				if (!targets.some((target) => target.container === container)) {
					targets.push({ container, originalButton: button, layout: "new-grid" })
				}
			}
		}
	}

	return targets
}

function findMenuButtonTargets(): MenuButtonTarget[] {
	const now = Date.now()
	if (now < menuButtonTargetsCache.expiresAt) {
		return menuButtonTargetsCache.targets
	}
	const targets = computeMenuButtonTargets()
	menuButtonTargetsCache = { targets, expiresAt: now + MENU_BUTTON_TARGETS_CACHE_TTL }
	return targets
}

export function addMenuButton() {
	const targets = findMenuButtonTargets()
	if (targets.length === 0) {
		return
	}

	targets.forEach(({ container, originalButton, layout }) => {
		if (!container || state.observedMenuContainers.has(container)) {
			return
		}

		const findOriginalButton = () => {
			if (layout === "legacy") {
				return container.querySelector(".term-edit-btn:not(.replacer-settings-btn)") || originalButton
			}
			return (
				Array.from(container.querySelectorAll("button")).find(
					(button) => normalizeMenuText(button) === "Edit Terms" && !button.classList.contains("replacer-settings-btn"),
				) || originalButton
			)
		}

		const ensureButtonState = () => {
			let settingsButton = container.querySelector(".replacer-settings-btn")
			const currentOriginalButton = findOriginalButton()

			// 1. Create the button if it doesn't exist
			if (!settingsButton) {
				if (!currentOriginalButton) {
					return
				} // Can't create if the original doesn't exist yet

				// Create button with simple inline SVG icon
				settingsButton = createSimpleMenuButton({
					text: "Term Settings",
					onClick: showUIPanel,
					className: currentOriginalButton.className, // Copy classes for styling
					tooltip: "Open WTR Term Settings",
				})
				settingsButton.setAttribute("data-wtr-replacer-menu", layout)

				container.appendChild(settingsButton)
				log(state.globalSettings, "WTR Term Replacer: Settings button created with simple icon system.")
			}

			// 2. Enforce the correct order (our button should be last)
			if (container.lastChild !== settingsButton) {
				container.appendChild(settingsButton)
				log(state.globalSettings, "WTR Term Replacer: Settings button order corrected.")
			}

			// 3. Apply consistent styling without overriding the new grid layout.
			if (currentOriginalButton && settingsButton) {
				if (layout === "legacy") {
					const desiredFlexStyle = "1 1 0%"
					container.style.display = "flex"
					container.style.gap = "5px"
					currentOriginalButton.style.flex = desiredFlexStyle
					settingsButton.style.flex = desiredFlexStyle
				} else {
					settingsButton.style.width = "100%"
					if (container.classList.contains("grid")) {
						settingsButton.style.gridColumn = "span 2 / span 2"
					}
				}
			}
		}

		// Run once immediately
		ensureButtonState()

		// Observe for any changes and re-run to correct the state
		const observer = new MutationObserver(() => {
			log(state.globalSettings, "WTR Term Replacer: Detected change in menu container, ensuring button state.")
			ensureButtonState()
		})
		observer.observe(container, { childList: true })

		// Mark this container as observed to prevent re-attaching observers
		state.observedMenuContainers.add(container)
	})
}
