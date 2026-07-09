/**
 * Design tokens & global CSS string for the POS admin UI system.
 * Usage:  import { UI_CSS } from '../../../components/ui';
 *         <style>{UI_CSS}</style>
 */

export const UI_VARS = {
  bg:       '#f4f6f8',
  surface:  '#ffffff',
  surface2: '#f1f4f8',
  border:   '#e2e8f0',
  ink:      '#0f172a',
  muted:    '#64748b',
  credit:   '#15803d',
  debit:    '#dc2626',
  accent:   '#2563eb',
  radius:   '10px',
};

export const UI_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Karla:wght@400;500;600;700&family=Open+Sans:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ui-bg:       #f4f6f8;
    --ui-surface:  #ffffff;
    --ui-surface2: #f1f4f8;
    --ui-border:   #e2e8f0;
    --ui-ink:      #0f172a;
    --ui-muted:    #64748b;
    --ui-credit:   #15803d;
    --ui-debit:    #dc2626;
    --ui-accent:   #2563eb;
    --ui-radius:   10px;
    --ui-radius-sm: 8px;
    --ui-shadow:   0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.06);
    --ui-shadow-lg: 0 20px 50px rgba(15, 23, 42, 0.18);
    --ui-font:     'Karla', 'Open Sans', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
    --ui-mono:     var(--ui-font);
  }

  /* ── Page wrap — fills the component-container, no centering ── */
  .ui-wrap {
    width: 100%;
    min-height: 100%;
    padding: 16px 24px 48px;
    font-family: var(--ui-font);
    font-size: 0.875rem;
    color: var(--ui-ink);
    background: var(--ui-bg);
    box-sizing: border-box;
  }

  /* ── Page header ── */
  .ui-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--ui-border);
    gap: 12px;
    flex-wrap: wrap;
  }
  .ui-eyebrow {
    font-size: 0.68rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ui-muted);
    margin-bottom: 6px;
    font-weight: 600;
  }
  .ui-title {
    font-size: 1.65rem;
    font-weight: 700;
    letter-spacing: -0.03em;
    line-height: 1.15;
    color: var(--ui-ink);
  }
  .ui-header-actions {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    align-items: center;
  }

  /* ── Buttons ── */
  .ui-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border: 1px solid transparent;
    border-radius: var(--ui-radius-sm);
    cursor: pointer;
    font-family: var(--ui-font);
    font-size: 0.8125rem;
    font-weight: 600;
    letter-spacing: 0.01em;
    padding: 10px 16px;
    transition: background 0.15s, border-color 0.15s, box-shadow 0.15s, transform 0.12s;
    white-space: nowrap;
    text-decoration: none;
  }
  .ui-btn:hover { transform: translateY(-1px); }
  .ui-btn:active { transform: translateY(0); }
  .ui-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }
  .ui-btn.primary  { background: var(--ui-ink); color: #fff; box-shadow: 0 1px 2px rgba(15,23,42,0.12); }
  .ui-btn.primary:hover { background: #1e293b; }
  .ui-btn.danger   { background: var(--ui-debit); color: #fff; }
  .ui-btn.ghost    { background: var(--ui-surface); border-color: var(--ui-border); color: var(--ui-muted); }
  .ui-btn.ghost:hover { background: var(--ui-surface2); color: var(--ui-ink); border-color: #cbd5e1; }
  .ui-btn.success  { background: var(--ui-credit); color: #fff; }
  .ui-btn.info     { background: var(--ui-accent); color: #fff; }
  .ui-btn.secondary { background: var(--ui-accent); color: #fff; }
  .ui-btn.sm       { padding: 5px 10px; font-size: 0.74rem; min-height: 30px; gap: 5px; }
  .ui-btn-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85em;
    line-height: 1;
    opacity: 0.95;
  }
  .ui-btn-group {
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
  }
  .ui-btn-group.sm { gap: 6px; }
  .ui-modal-foot,
  .ui-form-footer,
  .ui-header-actions {
    gap: 6px;
  }

  /* ── Toolbar ── */
  .ui-toolbar {
    display: flex;
    gap: 10px;
    margin-bottom: 14px;
    flex-wrap: wrap;
    align-items: center;
  }
  .ui-search {
    flex: 1;
    min-width: 200px;
    max-width: 320px;
    background: var(--ui-surface);
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius);
    color: var(--ui-ink);
    font-family: var(--ui-font);
    font-size: 0.8rem;
    padding: 8px 14px;
    outline: none;
    transition: border-color 0.15s;
  }
  .ui-search:focus { border-color: var(--ui-ink); }
  .ui-search::placeholder { color: var(--ui-muted); }
  .ui-select {
    background: var(--ui-surface);
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius);
    color: var(--ui-ink);
    font-family: var(--ui-font);
    font-size: 0.78rem;
    padding: 8px 12px;
    outline: none;
    cursor: pointer;
  }

  /* ── Selection bar ── */
  .ui-sel-bar {
    background: var(--ui-ink);
    color: var(--ui-bg);
    font-size: 0.72rem;
    padding: 8px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .ui-sel-bar .ui-sel-clear {
    background: none;
    border: 1px solid rgba(255,255,255,0.35);
    border-radius: var(--ui-radius);
    color: var(--ui-bg);
    cursor: pointer;
    font-family: var(--ui-font);
    font-size: 0.7rem;
    padding: 3px 10px;
  }
  .ui-sel-bar .ui-sel-clear:hover { background: rgba(255,255,255,0.12); }

  /* ── Table ── */
  .ui-table-wrap {
    background: var(--ui-surface);
    border: 1px solid var(--ui-border);
    border-radius: 14px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    box-shadow: var(--ui-shadow);
  }
  .ui-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8125rem;
  }
  .ui-table thead tr { background: #e8eef7; color: #1e3a5f; }
  .ui-table th {
    padding: 12px 14px;
    text-align: left;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    white-space: nowrap;
    user-select: none;
    border-bottom: 1px solid #c5d4e8;
  }
  .ui-table th.sortable { cursor: pointer; transition: background 0.12s; }
  .ui-table th.sortable:hover { background: #d7e3f4; color: var(--ui-ink); }
  .ui-table th.sorted { background: #d7e3f4; color: var(--ui-ink); }
  .ui-table th .sort-icon { margin-left: 4px; opacity: 0.4; font-style: normal; font-size: 0.7rem; }
  .ui-table th.sorted .sort-icon { opacity: 1; }
  .ui-table td {
    padding: 12px 14px;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: middle;
  }
  .ui-table tbody tr { transition: background 0.1s; }
  .ui-table tbody tr:hover { background: #f8fafc; }
  .ui-table tbody tr:last-child td { border-bottom: none; }
  .ui-table tbody tr.sel-row { background: #eff6ff; }
  .ui-table tbody tr.sel-row:hover { background: #dbeafe; }
  .ui-table tfoot tr {
    background: #f8fafc;
    border-top: 1px solid var(--ui-border);
  }
  .ui-table tfoot td {
    padding: 12px 14px;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    border-bottom: none;
  }

  /* ── Table cell helpers ── */
  .cell-num  { font-variant-numeric: tabular-nums; text-align: right; }
  .cell-pos  { color: var(--ui-credit); font-weight: 500; }
  .cell-neg  { color: var(--ui-debit);  font-weight: 500; }
  .cell-tag  {
    font-size: 0.7rem;
    background: var(--ui-surface2);
    border-radius: 2px;
    padding: 2px 8px;
    display: inline-block;
  }
  .cell-muted { color: var(--ui-muted); font-size: 0.75rem; }

  /* ── Checkbox ── */
  .ui-chk { width: 15px; height: 15px; accent-color: var(--ui-ink); cursor: pointer; }

  /* ── Loading / Empty ── */
  .ui-loading { text-align: center; padding: 48px 20px; color: var(--ui-muted); font-size: 0.8rem; }
  .ui-empty   { text-align: center; padding: 56px 20px; color: var(--ui-muted); font-size: 0.8rem; }
  .ui-empty-icon { font-size: 2.2rem; display: block; margin-bottom: 10px; opacity: 0.3; }

  .fade-row { animation: ui-rowIn 0.2s ease both; }
  @keyframes ui-rowIn {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Pagination ── */
  .ui-pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-top: 1px solid var(--ui-border);
    font-size: 0.72rem;
    color: var(--ui-muted);
    flex-wrap: wrap;
    gap: 8px;
  }
  .ui-page-btns { display: flex; gap: 4px; flex-wrap: wrap; }
  .ui-page-btn {
    background: none;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius);
    color: var(--ui-ink);
    cursor: pointer;
    font-family: var(--ui-font);
    font-size: 0.72rem;
    min-width: 30px;
    padding: 4px 8px;
    text-align: center;
    transition: all 0.12s;
  }
  .ui-page-btn:hover:not(:disabled) { background: var(--ui-ink); color: var(--ui-bg); border-color: var(--ui-ink); }
  .ui-page-btn.cur { background: var(--ui-ink); color: var(--ui-bg); border-color: var(--ui-ink); }
  .ui-page-btn:disabled { opacity: 0.3; cursor: not-allowed; }

  /* ── Modal ── */
  .ui-modal-overlay {
    position: fixed; inset: 0;
    background: rgba(15, 23, 42, 0.45);
    backdrop-filter: blur(6px);
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    animation: ui-fadeOverlay 0.18s ease;
  }
  @keyframes ui-fadeOverlay { from { opacity: 0; } to { opacity: 1; } }
  .ui-modal-box {
    background: var(--ui-surface);
    border: 1px solid var(--ui-border);
    border-radius: 16px;
    width: 100%;
    max-width: 560px;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: var(--ui-shadow-lg);
    animation: ui-slideModal 0.2s ease;
  }
  .ui-modal-box.sm { max-width: 400px; }
  .ui-modal-box.lg { max-width: 980px; width: min(980px, calc(100vw - 32px)); }
  @keyframes ui-slideModal {
    from { opacity: 0; transform: translateY(14px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .ui-modal-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 22px;
    border-bottom: 1px solid var(--ui-border);
    background: var(--ui-surface);
  }
  .ui-modal-head h5 {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--ui-ink);
    letter-spacing: -0.02em;
  }
  .ui-modal-close {
    background: var(--ui-surface2);
    border: 1px solid var(--ui-border);
    border-radius: 8px;
    color: var(--ui-muted);
    cursor: pointer;
    font-size: 0.95rem;
    line-height: 1;
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: background 0.12s, color 0.12s;
  }
  .ui-modal-close:hover { background: var(--ui-ink); color: #fff; border-color: var(--ui-ink); }
  .ui-modal-body   { padding: 22px; overflow-y: auto; }
  .ui-modal-hint   { font-size: 0.75rem; color: var(--ui-muted); margin-bottom: 16px; }
  .ui-modal-foot   {
    display: flex;
    justify-content: flex-end;
    gap: 6px;
    padding: 14px 22px;
    border-top: 1px solid var(--ui-border);
    background: #fafbfc;
  }

  /* ── Form fields ── */
  .ui-form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 16px 18px;
  }
  .ui-form-grid.full { grid-template-columns: 1fr; }
  .ui-form-grid.two  { grid-template-columns: 1fr 1fr; }
  .ui-form-grid.three { grid-template-columns: repeat(3, 1fr); }
  .ui-form-grid.four  { grid-template-columns: repeat(4, 1fr); }
  .ui-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
  .ui-field.span2 { grid-column: span 2; }
  .ui-field.span-full { grid-column: 1 / -1; }
  .ui-label {
    font-size: 0.78rem;
    letter-spacing: 0.01em;
    text-transform: none;
    color: #334155;
    font-weight: 600;
  }
  .ui-label .req { color: var(--ui-debit); margin-left: 2px; }
  .ui-input, .ui-textarea, .ui-select-field {
    background: var(--ui-surface);
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius-sm);
    color: var(--ui-ink);
    font-family: var(--ui-font);
    font-size: 0.875rem;
    padding: 10px 12px;
    outline: none;
    width: 100%;
    box-sizing: border-box;
    min-height: 42px;
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
  }
  .ui-input:hover, .ui-textarea:hover, .ui-select-field:hover {
    border-color: #cbd5e1;
  }
  .ui-input:focus, .ui-textarea:focus, .ui-select-field:focus {
    border-color: var(--ui-accent);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    background: #fff;
  }
  .ui-input:disabled, .ui-select-field:disabled, .ui-textarea:disabled {
    background: var(--ui-surface2);
    color: var(--ui-muted);
    cursor: not-allowed;
  }
  .ui-textarea { resize: vertical; min-height: 88px; }
  .ui-field-error { font-size: 0.72rem; color: var(--ui-debit); }
  .ui-section-divider {
    font-size: 0.8rem;
    letter-spacing: -0.01em;
    text-transform: none;
    color: var(--ui-ink);
    font-weight: 700;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--ui-border);
    margin: 4px 0 14px;
    grid-column: 1 / -1;
  }
  .ui-checkbox-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.84rem;
    cursor: pointer;
    padding-top: 4px;
  }
  .ui-checkbox-row input { accent-color: var(--ui-accent); width: 16px; height: 16px; cursor: pointer; }

  /* ── Form layout helpers ── */
  .ui-form-shell {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .ui-form-card,
  .ui-section {
    background: var(--ui-surface);
    border: 1px solid var(--ui-border);
    border-radius: 14px;
    padding: 20px 22px;
    box-shadow: var(--ui-shadow);
    grid-column: 1 / -1;
    margin-bottom: 4px;
  }
  .ui-section > .ui-section-divider { margin-top: 0; }
  .ui-form-card-title {
    font-size: 0.9rem;
    letter-spacing: -0.01em;
    text-transform: none;
    color: var(--ui-ink);
    font-weight: 700;
    margin-bottom: 16px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--ui-border);
  }
  .ui-form-card-body {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .ui-form-hint {
    font-size: 0.72rem;
    color: var(--ui-muted);
    font-style: italic;
    margin-bottom: 16px;
  }
  .ui-inline-field {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .ui-inline-field-main { flex: 1; min-width: 0; }
  .ui-inline-field-main .ui-input,
  .ui-inline-field-main .ui-select-field { width: 100%; }
  .ui-inline-field-action { flex-shrink: 0; display: flex; align-items: center; }
  .ui-inline-field-action .ui-btn {
    min-width: 42px;
    height: 38px;
    padding: 0 12px;
    justify-content: center;
    align-items: center;
    display: inline-flex;
    flex-shrink: 0;
  }
  .ui-inline-field-action .ui-select-field {
    width: auto;
    min-width: 88px;
    height: 38px;
    padding: 8px 10px;
  }
  .ui-search-wrap { position: relative; }
  .ui-search-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    z-index: 1000;
    background: var(--ui-surface);
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius);
    max-height: 220px;
    overflow-y: auto;
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  }
  .ui-search-dropdown-item {
    padding: 9px 14px;
    cursor: pointer;
    border-bottom: 1px solid var(--ui-surface2);
    font-size: 0.78rem;
    transition: background 0.1s;
  }
  .ui-search-dropdown-item:last-child { border-bottom: none; }
  .ui-search-dropdown-item:hover { background: var(--ui-surface2); }
  .ui-tag-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
  .ui-tag-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--ui-surface2);
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius);
    padding: 5px 10px;
    font-size: 0.74rem;
  }
  .ui-tag-chip-remove {
    background: none;
    border: none;
    color: var(--ui-muted);
    cursor: pointer;
    font-size: 0.9rem;
    line-height: 1;
    padding: 0;
  }
  .ui-tag-chip-remove:hover { color: var(--ui-debit); }
  .ui-image-dropzone {
    border: 2px dashed var(--ui-border);
    border-radius: var(--ui-radius);
    padding: 28px 20px;
    text-align: center;
    background: var(--ui-surface2);
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
  }
  .ui-image-dropzone:hover { border-color: var(--ui-accent); background: var(--ui-surface); }
  .ui-image-dropzone-icon { font-size: 2rem; color: var(--ui-muted); opacity: 0.5; margin-bottom: 8px; }
  .ui-image-preview-grid { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 16px; }
  .ui-image-preview {
    position: relative;
    width: 80px;
    height: 80px;
    border-radius: var(--ui-radius);
    overflow: hidden;
    border: 1px solid var(--ui-border);
  }
  .ui-image-preview img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .ui-image-preview .ui-btn {
    position: absolute;
    top: 2px;
    right: 2px;
    min-width: 20px;
    width: 20px;
    height: 20px;
    padding: 0;
    line-height: 18px;
    font-size: 0.85rem;
  }
  .ui-form-footer {
    display: flex;
    justify-content: flex-end;
    gap: 6px;
    flex-wrap: wrap;
    padding-top: 16px;
    margin-top: 4px;
    border-top: 1px solid var(--ui-border);
  }
  .ui-variant-row {
    display: grid;
    grid-template-columns: 1fr 2fr auto;
    gap: 10px;
    margin-bottom: 10px;
    align-items: center;
  }
  .ui-input.sm { padding: 6px 10px; font-size: 0.8rem; min-height: 34px; }

  /* ── Action dropdown ── */
  .ui-action-wrap { position: relative; }
  .ui-action-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--ui-surface);
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius);
    color: var(--ui-ink);
    cursor: pointer;
    font-family: var(--ui-font);
    font-size: 0.72rem;
    padding: 5px 10px;
    transition: all 0.12s;
    white-space: nowrap;
  }
  .ui-action-btn:hover { background: var(--ui-surface2); border-color: var(--ui-accent); }
  .ui-action-btn-icon { opacity: 0.72; font-size: 0.82rem; }
  .ui-action-btn-caret { opacity: 0.55; font-size: 0.62rem; margin-left: -2px; }
  .ui-action-menu-item:hover { background: var(--ui-surface2) !important; }
  .ui-action-item-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    flex-shrink: 0;
    opacity: 0.88;
  }
  .ui-action-item-icon.danger { color: var(--ui-debit); opacity: 1; }
  .ui-action-item-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--ui-muted);
    opacity: 0.45;
  }
  .ui-action-item-label { flex: 1; line-height: 1.25; }
  .ui-action-menu {
    position: absolute;
    right: 0;
    top: calc(100% + 4px);
    background: var(--ui-surface);
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius);
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    min-width: 150px;
    z-index: 500;
    overflow: hidden;
  }
  .ui-action-menu button, .ui-action-menu a {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    background: none;
    border: none;
    border-bottom: 1px solid var(--ui-surface2);
    color: var(--ui-ink);
    cursor: pointer;
    font-family: var(--ui-font);
    font-size: 0.78rem;
    padding: 9px 14px;
    text-align: left;
    text-decoration: none;
    transition: background 0.1s;
  }
  .ui-action-menu button:last-child, .ui-action-menu a:last-child { border-bottom: none; }
  .ui-action-menu button:hover, .ui-action-menu a:hover { background: var(--ui-surface2); }
  .ui-action-menu .ui-del { color: var(--ui-debit); }

  /* ── Toast ── */
  .ui-toast {
    position: fixed;
    bottom: 28px; right: 28px;
    background: var(--ui-ink);
    color: var(--ui-bg);
    font-size: 0.78rem;
    padding: 12px 20px;
    border-radius: var(--ui-radius);
    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    z-index: 3000;
    animation: ui-toastIn 0.2s ease;
    max-width: 320px;
  }
  .ui-toast.error   { background: var(--ui-debit); }
  .ui-toast.success { background: var(--ui-credit); }
  @keyframes ui-toastIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Toggle ── */
  .ui-toggle { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; }
  .ui-toggle-track {
    width: 36px; height: 20px;
    background: #ccc;
    border-radius: 10px;
    position: relative;
    transition: background 0.2s;
    flex-shrink: 0;
  }
  .ui-toggle-track.on { background: var(--ui-credit); }
  .ui-toggle-thumb {
    position: absolute;
    top: 3px; left: 3px;
    width: 14px; height: 14px;
    background: white;
    border-radius: 50%;
    transition: transform 0.2s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }
  .ui-toggle-track.on .ui-toggle-thumb { transform: translateX(16px); }
  .ui-toggle-label { font-size: 0.72rem; color: var(--ui-muted); }

  /* ── Responsive breakpoints ── */

  /* Medium — tablet landscape / small desktop */
  @media (max-width: 900px) {
    .ui-wrap { padding: 14px 16px 40px; }
    .ui-title { font-size: 1.5rem; }
  }

  /* Small — tablet portrait / large phone */
  @media (max-width: 640px) {
    .ui-wrap { padding: 16px 12px 40px; }
    .ui-title { font-size: 1.3rem; }
    .ui-header { flex-direction: column; align-items: flex-start; gap: 12px; }
    .ui-header-actions { width: 100%; }
    .ui-form-grid.two { grid-template-columns: 1fr; }
    .ui-form-grid.three { grid-template-columns: 1fr; }
    .ui-form-grid.four { grid-template-columns: 1fr 1fr; }
    .ui-field.span2   { grid-column: span 1; }
    .ui-variant-row { grid-template-columns: 1fr; }
    .ui-modal-body    { padding: 16px; }
    .ui-modal-foot    { padding: 12px 16px; }
    .ui-pagination    { flex-direction: column; align-items: flex-start; }
    .ui-search        { max-width: 100%; }
    .ui-sel-bar       { flex-direction: column; align-items: flex-start; gap: 8px; }
  }

  /* Extra small — phone */
  @media (max-width: 420px) {
    .ui-wrap { padding: 12px 10px 32px; }
    .ui-btn  { padding: 7px 12px; font-size: 0.74rem; }
    .ui-table th, .ui-table td { padding: 8px 10px; }
    .ui-modal-overlay { padding: 12px; }
  }
`;
