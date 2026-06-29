/**
 * Design tokens & global CSS string for the POS admin UI system.
 * Usage:  import { UI_CSS } from '../../../components/ui';
 *         <style>{UI_CSS}</style>
 */

export const UI_VARS = {
  bg:       '#f5f2eb',
  surface:  '#fffef9',
  surface2: '#f0ece0',
  border:   '#ddd8c8',
  ink:      '#1a1710',
  muted:    '#7a7568',
  credit:   '#1a6e3a',
  debit:    '#c8401a',
  accent:   '#1a3a6e',
  radius:   '4px',
};

export const UI_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ui-bg:       #f5f2eb;
    --ui-surface:  #fffef9;
    --ui-surface2: #f0ece0;
    --ui-border:   #ddd8c8;
    --ui-ink:      #1a1710;
    --ui-muted:    #7a7568;
    --ui-credit:   #1a6e3a;
    --ui-debit:    #c8401a;
    --ui-accent:   #1a3a6e;
    --ui-radius:   4px;
    --ui-mono:     'IBM Plex Mono', monospace;
  }

  /* ── Page wrap — fills the component-container, no centering ── */
  .ui-wrap {
    width: 100%;
    min-height: 100%;
    padding: 16px 24px 48px;
    font-family: var(--ui-mono);
    font-size: 0.82rem;
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
    padding-bottom: 14px;
    border-bottom: 2px solid var(--ui-ink);
    gap: 12px;
    flex-wrap: wrap;
  }
  .ui-eyebrow {
    font-size: 0.62rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--ui-muted);
    margin-bottom: 4px;
  }
  .ui-title {
    font-size: 1.9rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1;
  }
  .ui-header-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }

  /* ── Buttons ── */
  .ui-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: none;
    border-radius: var(--ui-radius);
    cursor: pointer;
    font-family: var(--ui-mono);
    font-size: 0.78rem;
    letter-spacing: 0.04em;
    padding: 9px 18px;
    transition: opacity 0.15s, transform 0.12s;
    white-space: nowrap;
    text-decoration: none;
  }
  .ui-btn:hover { opacity: 0.85; transform: translateY(-1px); }
  .ui-btn:active { transform: translateY(0); }
  .ui-btn.primary  { background: var(--ui-ink);    color: var(--ui-bg);  }
  .ui-btn.danger   { background: var(--ui-debit);  color: #fff; }
  .ui-btn.ghost    { background: var(--ui-surface); border: 1px solid var(--ui-border); color: var(--ui-muted); }
  .ui-btn.ghost:hover { background: var(--ui-ink); color: var(--ui-bg); border-color: var(--ui-ink); opacity: 1; }
  .ui-btn.success  { background: var(--ui-credit); color: #fff; }
  .ui-btn.info     { background: var(--ui-accent); color: #fff; }
  .ui-btn.secondary { background: var(--ui-accent); color: #fff; }
  .ui-btn.sm       { padding: 5px 12px; font-size: 0.72rem; }

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
    font-family: var(--ui-mono);
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
    font-family: var(--ui-mono);
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
    font-family: var(--ui-mono);
    font-size: 0.7rem;
    padding: 3px 10px;
  }
  .ui-sel-bar .ui-sel-clear:hover { background: rgba(255,255,255,0.12); }

  /* ── Table ── */
  .ui-table-wrap {
    background: var(--ui-surface);
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius);
    overflow-x: auto;   /* horizontal scroll on small screens */
    -webkit-overflow-scrolling: touch;
  }
  .ui-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8rem;
  }
  .ui-table thead tr { background: var(--ui-ink); color: var(--ui-bg); }
  .ui-table th {
    padding: 11px 14px;
    text-align: left;
    font-size: 0.62rem;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    white-space: nowrap;
    user-select: none;
  }
  .ui-table th.sortable { cursor: pointer; transition: background 0.12s; }
  .ui-table th.sortable:hover { background: #2d2d2d; }
  .ui-table th.sorted { background: #252525; }
  .ui-table th .sort-icon { margin-left: 4px; opacity: 0.4; font-style: normal; font-size: 0.7rem; }
  .ui-table th.sorted .sort-icon { opacity: 1; }
  .ui-table td {
    padding: 10px 14px;
    border-bottom: 1px solid var(--ui-surface2);
    vertical-align: middle;
  }
  .ui-table tbody tr { transition: background 0.1s; }
  .ui-table tbody tr:hover { background: var(--ui-surface2); }
  .ui-table tbody tr:last-child td { border-bottom: none; }
  .ui-table tbody tr.sel-row { background: #eef5ff; }
  .ui-table tbody tr.sel-row:hover { background: #e0ecff; }
  .ui-table tfoot tr {
    background: var(--ui-surface2);
    border-top: 2px solid var(--ui-ink);
  }
  .ui-table tfoot td {
    padding: 10px 14px;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.06em;
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
    font-family: var(--ui-mono);
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
    background: rgba(26,23,16,0.55);
    backdrop-filter: blur(2px);
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
    border-radius: 6px;
    width: 100%;
    max-width: 540px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 24px 64px rgba(0,0,0,0.2);
    animation: ui-slideModal 0.2s ease;
  }
  .ui-modal-box.sm { max-width: 380px; }
  .ui-modal-box.lg { max-width: 960px; width: min(960px, calc(100vw - 32px)); }
  @keyframes ui-slideModal {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .ui-modal-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 22px 14px;
    border-bottom: 1px solid var(--ui-border);
    background: var(--ui-ink);
  }
  .ui-modal-head h5 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--ui-bg);
    letter-spacing: 0.02em;
  }
  .ui-modal-close {
    background: none;
    border: none;
    color: rgba(255,255,255,0.6);
    cursor: pointer;
    font-size: 1.1rem;
    line-height: 1;
    padding: 4px;
    transition: color 0.12s;
  }
  .ui-modal-close:hover { color: #fff; }
  .ui-modal-body   { padding: 22px; }
  .ui-modal-hint   { font-size: 0.7rem; color: var(--ui-muted); margin-bottom: 16px; font-style: italic; }
  .ui-modal-foot   {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 14px 22px;
    border-top: 1px solid var(--ui-border);
    background: var(--ui-surface2);
  }

  /* ── Form fields ── */
  .ui-form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 14px 16px;
  }
  .ui-form-grid.full { grid-template-columns: 1fr; }
  .ui-form-grid.two  { grid-template-columns: 1fr 1fr; }
  .ui-form-grid.three { grid-template-columns: repeat(3, 1fr); }
  .ui-form-grid.four  { grid-template-columns: repeat(4, 1fr); }
  .ui-field { display: flex; flex-direction: column; gap: 5px; }
  .ui-field.span2 { grid-column: span 2; }
  .ui-label {
    font-size: 0.65rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--ui-muted);
  }
  .ui-label .req { color: var(--ui-debit); margin-left: 2px; }
  .ui-input, .ui-textarea, .ui-select-field {
    background: var(--ui-surface2);
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius);
    color: var(--ui-ink);
    font-family: var(--ui-mono);
    font-size: 0.84rem;
    padding: 8px 11px;
    outline: none;
    width: 100%;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .ui-input:focus, .ui-textarea:focus, .ui-select-field:focus {
    border-color: var(--ui-accent);
    box-shadow: 0 0 0 3px rgba(26,58,110,0.1);
  }
  .ui-textarea { resize: vertical; min-height: 80px; }
  .ui-field-error { font-size: 0.67rem; color: var(--ui-debit); }
  .ui-section-divider {
    font-size: 0.65rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ui-muted);
    padding-bottom: 6px;
    border-bottom: 1px solid var(--ui-border);
    margin: 18px 0 10px;
    grid-column: 1 / -1;
  }
  .ui-checkbox-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.82rem;
    cursor: pointer;
    padding-top: 4px;
  }
  .ui-checkbox-row input { accent-color: var(--ui-ink); width: 15px; height: 15px; cursor: pointer; }

  /* ── Form layout helpers ── */
  .ui-form-shell {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .ui-form-card {
    background: var(--ui-surface);
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius);
    padding: 20px 22px;
  }
  .ui-form-card-title {
    font-size: 0.65rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ui-muted);
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--ui-border);
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
    align-items: stretch;
  }
  .ui-inline-field-main { flex: 1; min-width: 0; }
  .ui-inline-field-action { flex-shrink: 0; }
  .ui-inline-field-action .ui-btn { height: 100%; min-width: 42px; justify-content: center; padding: 0 12px; }
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
    gap: 10px;
    flex-wrap: wrap;
    padding-top: 20px;
    margin-top: 8px;
    border-top: 2px solid var(--ui-ink);
  }
  .ui-variant-row {
    display: grid;
    grid-template-columns: 1fr 2fr auto;
    gap: 10px;
    margin-bottom: 10px;
    align-items: center;
  }
  .ui-section { grid-column: 1 / -1; }
  .ui-input.sm { padding: 5px 8px; font-size: 0.78rem; }

  /* ── Action dropdown ── */
  .ui-action-wrap { position: relative; }
  .ui-action-btn {
    background: var(--ui-surface);
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius);
    color: var(--ui-ink);
    cursor: pointer;
    font-family: var(--ui-mono);
    font-size: 0.72rem;
    padding: 5px 12px;
    transition: all 0.12s;
    white-space: nowrap;
  }
  .ui-action-btn:hover { background: var(--ui-surface2); }
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
    font-family: var(--ui-mono);
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
