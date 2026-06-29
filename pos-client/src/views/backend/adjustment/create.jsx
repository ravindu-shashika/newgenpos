import { useState, useMemo, useRef } from "react";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=Clash+Display:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:       #f5f2eb;
    --surface:  #fffef9;
    --surface2: #f0ece0;
    --border:   #ddd8c8;
    --ink:      #1a1710;
    --muted:    #7a7568;
    --danger:   #c8401a;
    --success:  #1a6e3a;
    --accent:   #1a3a6e;
    --warn:     #b8860b;
    --mono:     'IBM Plex Mono', monospace;
    --display:  'Clash Display', 'Georgia', serif;
    --radius:   4px;
  }

  body { background: var(--bg); color: var(--ink); font-family: var(--mono); }

  .adj-wrap {
    max-width: 1100px;
    margin: 0 auto;
    padding: 48px 32px 80px;
  }

  /* ── Card ── */
  .adj-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
  }
  .adj-card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 24px;
    border-bottom: 2px solid var(--ink);
    background: var(--ink);
  }
  .adj-card-title {
    font-family: var(--display);
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--bg);
  }
  .adj-hint {
    font-size: 0.7rem;
    color: var(--muted);
    font-style: italic;
    padding: 14px 24px 0;
  }
  .adj-card-body { padding: 24px; }

  /* ── Grid ── */
  .adj-grid { display: grid; gap: 20px; }
  .adj-grid-3 { grid-template-columns: repeat(3,1fr); }
  .adj-grid-2 { grid-template-columns: repeat(2,1fr); }
  @media (max-width: 720px) {
    .adj-grid-3, .adj-grid-2 { grid-template-columns: 1fr; }
  }

  /* ── Field ── */
  .adj-field { display: flex; flex-direction: column; gap: 6px; }
  .adj-label {
    font-size: 0.68rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .adj-label .req { color: var(--danger); margin-left: 2px; }
  .adj-input, .adj-select, .adj-textarea {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--ink);
    font-family: var(--mono);
    font-size: 0.84rem;
    padding: 9px 12px;
    width: 100%;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .adj-input:focus, .adj-select:focus, .adj-textarea:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(26,58,110,0.1);
  }
  .adj-select option { background: var(--surface); }
  .adj-textarea { resize: vertical; min-height: 100px; }
  .adj-error { font-size: 0.68rem; color: var(--danger); margin-top: 2px; }

  /* ── Section label ── */
  .adj-section-label {
    font-family: var(--display);
    font-size: 0.95rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .adj-section-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  /* ── Search box ── */
  .adj-search-wrap {
    display: flex;
    gap: 0;
    position: relative;
  }
  .adj-search-icon {
    background: var(--ink);
    border: 1px solid var(--ink);
    border-right: none;
    border-radius: var(--radius) 0 0 var(--radius);
    color: var(--bg);
    font-size: 1rem;
    padding: 0 16px;
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }
  .adj-search-input {
    flex: 1;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 0 var(--radius) var(--radius) 0;
    color: var(--ink);
    font-family: var(--mono);
    font-size: 0.84rem;
    padding: 10px 14px;
    outline: none;
    transition: border-color 0.15s;
  }
  .adj-search-input:focus { border-color: var(--accent); }
  .adj-search-input::placeholder { color: var(--muted); }
  .adj-autocomplete {
    position: absolute;
    top: calc(100% + 4px);
    left: 0; right: 0;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: 0 8px 24px rgba(0,0,0,0.1);
    z-index: 50;
    max-height: 220px;
    overflow-y: auto;
  }
  .adj-autocomplete-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    cursor: pointer;
    border-bottom: 1px solid var(--surface2);
    font-size: 0.8rem;
    transition: background 0.1s;
  }
  .adj-autocomplete-item:last-child { border-bottom: none; }
  .adj-autocomplete-item:hover { background: var(--surface2); }
  .adj-autocomplete-item .code { color: var(--muted); font-size: 0.72rem; }
  .adj-autocomplete-item .stock {
    font-size: 0.68rem;
    background: var(--surface2);
    border-radius: 2px;
    padding: 2px 7px;
    color: var(--muted);
  }

  /* ── Order table ── */
  .adj-table-wrap {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
  }
  .adj-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8rem;
  }
  .adj-table thead tr { background: var(--ink); color: var(--bg); }
  .adj-table th {
    padding: 11px 14px;
    text-align: left;
    font-size: 0.62rem;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .adj-table td {
    padding: 9px 14px;
    border-bottom: 1px solid var(--surface2);
    vertical-align: middle;
  }
  .adj-table tbody tr { transition: background 0.1s; }
  .adj-table tbody tr:hover { background: var(--surface2); }
  .adj-table tbody tr:last-child td { border-bottom: none; }

  /* ── tfoot ── */
  .adj-table tfoot tr {
    background: var(--surface2);
    border-top: 2px solid var(--ink);
  }
  .adj-table tfoot td {
    padding: 10px 14px;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    border-bottom: none;
  }

  /* ── Table inputs ── */
  .tbl-input {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--ink);
    font-family: var(--mono);
    font-size: 0.8rem;
    padding: 5px 8px;
    width: 100%;
    outline: none;
    transition: border-color 0.15s;
  }
  .tbl-input:focus { border-color: var(--accent); }
  .tbl-input.warn { border-color: var(--warn); background: #fffbf0; }
  .tbl-select {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--ink);
    font-family: var(--mono);
    font-size: 0.78rem;
    padding: 5px 8px;
    width: 100%;
    outline: none;
    cursor: pointer;
  }
  .tbl-select.addition { color: var(--success); font-weight: 500; }
  .tbl-select.subtraction { color: var(--danger); font-weight: 500; }

  /* ── Action badge ── */
  .action-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    padding: 3px 8px;
    border-radius: 2px;
  }
  .action-badge.add  { background: rgba(26,110,58,0.1); color: var(--success); }
  .action-badge.sub  { background: rgba(200,64,26,0.1); color: var(--danger); }

  /* ── Delete btn ── */
  .tbl-del {
    background: rgba(200,64,26,0.08);
    border: 1px solid var(--danger);
    border-radius: var(--radius);
    color: var(--danger);
    cursor: pointer;
    font-family: var(--mono);
    font-size: 0.72rem;
    padding: 4px 10px;
    transition: background 0.12s;
    white-space: nowrap;
  }
  .tbl-del:hover { background: rgba(200,64,26,0.18); }

  /* ── Empty table ── */
  .adj-empty {
    text-align: center;
    padding: 40px 20px;
    color: var(--muted);
    font-size: 0.78rem;
  }
  .adj-empty-icon { font-size: 2rem; margin-bottom: 8px; display: block; opacity: 0.3; }

  /* ── Submit row ── */
  .adj-submit-row {
    display: flex;
    justify-content: flex-end;
    padding-top: 8px;
  }
  .adj-submit-btn {
    background: var(--ink);
    border: none;
    border-radius: var(--radius);
    color: var(--bg);
    cursor: pointer;
    font-family: var(--display);
    font-size: 0.9rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    padding: 12px 36px;
    transition: opacity 0.15s, transform 0.12s;
  }
  .adj-submit-btn:hover { opacity: 0.85; transform: translateY(-1px); }
  .adj-submit-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  /* ── Toast ── */
  .adj-toast {
    position: fixed;
    bottom: 28px; right: 28px;
    background: var(--ink);
    color: var(--bg);
    font-size: 0.78rem;
    padding: 12px 20px;
    border-radius: var(--radius);
    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    z-index: 300;
    animation: toastIn 0.2s ease;
  }
  .adj-toast.error { background: var(--danger); }
  .adj-toast.success { background: var(--success); }
  @keyframes toastIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .fade-row { animation: rowIn 0.2s ease both; }
  @keyframes rowIn {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .divider { height: 1px; background: var(--border); margin: 24px 0; }
`;

// ── Mock warehouse + product data ────────────────────────────────────────────
const WAREHOUSES = [
    { id: 1, name: "Main Warehouse" },
    { id: 2, name: "Secondary Store" },
    { id: 3, name: "Cold Storage" },
];

const PRODUCTS_BY_WAREHOUSE = {
    1: [
        { id: 101, code: "PRD-001", name: "Widget A", qty: 150, unit_cost: 12.50 },
        { id: 102, code: "PRD-002", name: "Widget B", qty: 80, unit_cost: 24.00 },
        { id: 103, code: "PRD-003", name: "Gadget Pro", qty: 45, unit_cost: 89.99 },
        { id: 104, code: "PRD-004", name: "Component X", qty: 320, unit_cost: 3.75 },
        { id: 105, code: "PRD-005", name: "Component Y", qty: 200, unit_cost: 5.20 },
    ],
    2: [
        { id: 201, code: "PRD-101", name: "Item Alpha", qty: 60, unit_cost: 15.00 },
        { id: 202, code: "PRD-102", name: "Item Beta", qty: 90, unit_cost: 32.00 },
        { id: 203, code: "PRD-103", name: "Device Z", qty: 25, unit_cost: 199.00 },
    ],
    3: [
        { id: 301, code: "PRD-201", name: "Frozen Good A", qty: 500, unit_cost: 8.00 },
        { id: 302, code: "PRD-202", name: "Frozen Good B", qty: 180, unit_cost: 11.50 },
    ],
};

let nextRowId = 1;

export default function AddAdjustment() {
    const [warehouseId, setWarehouseId] = useState("");
    const [document, setDocument] = useState(null);
    const [note, setNote] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const [rows, setRows] = useState([]);
    const [errors, setErrors] = useState({});
    const [toast, setToast] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const searchRef = useRef(null);

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Products available for selected warehouse
    const warehouseProducts = useMemo(() =>
        warehouseId ? (PRODUCTS_BY_WAREHOUSE[Number(warehouseId)] || []) : [],
        [warehouseId]
    );

    // Autocomplete filter
    const filteredProducts = useMemo(() => {
        if (!searchTerm.trim() || searchTerm.length < 1) return [];
        const q = searchTerm.toLowerCase();
        return warehouseProducts.filter(p =>
            p.code.toLowerCase().includes(q) ||
            p.name.toLowerCase().includes(q)
        );
    }, [searchTerm, warehouseProducts]);

    // Select product from autocomplete — if already in table, increment qty
    const handleSelectProduct = (product) => {
        setSearchTerm("");
        setShowDropdown(false);

        const existing = rows.find(r => r.product_code === product.code);
        if (existing) {
            // Matches blade: increment qty if product already in table
            setRows(prev => prev.map(r => {
                if (r.product_code !== product.code) return r;
                const newQty = r.qty + 1;
                const overStock = newQty > product.qty && r.action === "-";
                if (overStock) {
                    showToast("Quantity exceeds stock quantity!", "error");
                    return r;
                }
                return { ...r, qty: newQty };
            }));
        } else {
            setRows(prev => [...prev, {
                _id: nextRowId++,
                product_id: product.id,
                product_code: product.code,
                name: product.name,
                unit_cost: product.unit_cost,
                stock_qty: product.qty,
                qty: 1,
                action: "-",   // default: Subtraction
            }]);
        }
    };

    // Update row field
    const updateRow = (id, field, value) => {
        setRows(prev => prev.map(r => {
            if (r._id !== id) return r;
            const updated = { ...r, [field]: value };
            // Check qty vs stock when action is subtraction
            if ((field === "qty" || field === "action") && updated.action === "-") {
                if (parseFloat(updated.qty) > updated.stock_qty) {
                    showToast("Quantity exceeds stock quantity!", "error");
                    if (field === "qty") return r; // revert
                }
            }
            return updated;
        }));
    };

    const removeRow = (id) => setRows(prev => prev.filter(r => r._id !== id));

    // Total qty (mirrors calculateTotal())
    const totalQty = useMemo(() =>
        rows.reduce((s, r) => s + (parseFloat(r.qty) || 0), 0),
        [rows]
    );

    // Validate + submit
    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = {};
        if (!warehouseId) errs.warehouseId = "Warehouse is required.";
        if (rows.length === 0) errs.rows = "Please insert at least one product to the order table.";
        setErrors(errs);
        if (Object.keys(errs).length) {
            if (errs.rows) showToast(errs.rows, "error");
            return;
        }
        setSubmitted(true);
        setTimeout(() => {
            setSubmitted(false);
            showToast("Adjustment submitted successfully!", "success");
            // reset
            setWarehouseId("");
            setDocument(null);
            setNote("");
            setRows([]);
            setErrors({});
        }, 1200);
    };

    return (
        <>
            <style>{css}</style>
            <div className="adj-wrap">
                <div className="adj-card">
                    <div className="adj-card-head">
                        <span className="adj-card-title">Add Adjustment</span>
                    </div>

                    <p className="adj-hint">Fields marked with <span style={{ color: "#f87171" }}>*</span> are required.</p>

                    <div className="adj-card-body">
                        <form onSubmit={handleSubmit} noValidate>

                            {/* ── Row 1: Warehouse + Document ── */}
                            <div className="adj-grid adj-grid-2" style={{ marginBottom: 24 }}>
                                <div className="adj-field">
                                    <label className="adj-label">Warehouse <span className="req">*</span></label>
                                    <select className="adj-select" value={warehouseId}
                                        onChange={e => { setWarehouseId(e.target.value); setRows([]); setErrors({}); }}>
                                        <option value="">Select warehouse…</option>
                                        {WAREHOUSES.map(w => (
                                            <option key={w.id} value={w.id}>{w.name}</option>
                                        ))}
                                    </select>
                                    {errors.warehouseId && <div className="adj-error">{errors.warehouseId}</div>}
                                </div>

                                <div className="adj-field">
                                    <label className="adj-label">Attach Document</label>
                                    <input type="file" className="adj-input"
                                        onChange={e => setDocument(e.target.files[0] || null)} />
                                    {document && (
                                        <div style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: 4 }}>
                                            📎 {document.name}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="divider" />

                            {/* ── Product search ── */}
                            <div style={{ marginBottom: 28 }}>
                                <div className="adj-section-label">Select Product</div>
                                <div style={{ position: "relative" }}>
                                    <div className="adj-search-wrap">
                                        <div className="adj-search-icon">⊞</div>
                                        <input
                                            ref={searchRef}
                                            className="adj-search-input"
                                            placeholder={warehouseId ? "Type product code or name to search…" : "Select a warehouse first"}
                                            value={searchTerm}
                                            disabled={!warehouseId}
                                            onChange={e => { setSearchTerm(e.target.value); setShowDropdown(true); }}
                                            onFocus={() => searchTerm && setShowDropdown(true)}
                                            onBlur={() => setTimeout(() => setShowDropdown(false), 180)}
                                            autoComplete="off"
                                        />
                                    </div>
                                    {showDropdown && filteredProducts.length > 0 && (
                                        <div className="adj-autocomplete">
                                            {filteredProducts.map(p => (
                                                <div key={p.id} className="adj-autocomplete-item"
                                                    onMouseDown={() => handleSelectProduct(p)}>
                                                    <div>
                                                        <span style={{ fontWeight: 500 }}>{p.name}</span>
                                                        <span className="code" style={{ marginLeft: 10 }}>{p.code}</span>
                                                    </div>
                                                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                                        <span className="stock">Stock: {p.qty}</span>
                                                        <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>${p.unit_cost.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {showDropdown && searchTerm.length >= 1 && filteredProducts.length === 0 && warehouseId && (
                                        <div className="adj-autocomplete">
                                            <div className="adj-autocomplete-item" style={{ color: "var(--muted)", justifyContent: "center" }}>
                                                No products found
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ── Order table ── */}
                            <div style={{ marginBottom: 28 }}>
                                <div className="adj-section-label">
                                    Order Table <span style={{ color: "var(--danger)", fontSize: "0.8rem" }}>*</span>
                                </div>
                                {errors.rows && <div className="adj-error" style={{ marginBottom: 10 }}>{errors.rows}</div>}

                                <div className="adj-table-wrap">
                                    <table className="adj-table">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Code</th>
                                                <th>Unit Cost</th>
                                                <th>Quantity</th>
                                                <th>Action</th>
                                                <th style={{ width: 80 }}>🗑</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rows.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6}>
                                                        <div className="adj-empty">
                                                            <span className="adj-empty-icon">📦</span>
                                                            No products added — search above to add items
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : rows.map((r, i) => (
                                                <tr key={r._id} className="fade-row" style={{ animationDelay: `${i * 0.04}s` }}>
                                                    <td style={{ fontWeight: 500 }}>{r.name}</td>
                                                    <td>
                                                        <span style={{
                                                            fontSize: "0.72rem",
                                                            background: "var(--surface2)",
                                                            borderRadius: 2,
                                                            padding: "2px 8px",
                                                            fontVariantNumeric: "tabular-nums",
                                                        }}>{r.product_code}</span>
                                                        {/* hidden fields mirror blade */}
                                                        <input type="hidden" name="product_code[]" value={r.product_code} />
                                                        <input type="hidden" name="product_id[]" value={r.product_id} />
                                                        <input type="hidden" name="unit_cost[]" value={r.unit_cost} />
                                                    </td>
                                                    <td style={{ fontVariantNumeric: "tabular-nums" }}>
                                                        {r.unit_cost.toFixed(2)}
                                                    </td>
                                                    <td style={{ width: 120 }}>
                                                        <input
                                                            type="number"
                                                            className={`tbl-input${r.qty > r.stock_qty && r.action === "-" ? " warn" : ""}`}
                                                            name="qty[]"
                                                            value={r.qty}
                                                            min="0.000001"
                                                            step="any"
                                                            required
                                                            onChange={e => updateRow(r._id, "qty", e.target.value === "" ? "" : parseFloat(e.target.value))}
                                                        />
                                                        <div style={{ fontSize: "0.62rem", color: "var(--muted)", marginTop: 3 }}>
                                                            Stock: {r.stock_qty}
                                                        </div>
                                                    </td>
                                                    <td style={{ width: 160 }}>
                                                        <select
                                                            className={`tbl-select${r.action === "+" ? " addition" : " subtraction"}`}
                                                            name="action[]"
                                                            value={r.action}
                                                            onChange={e => updateRow(r._id, "action", e.target.value)}>
                                                            <option value="-">− Subtraction</option>
                                                            <option value="+">+ Addition</option>
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <button type="button" className="tbl-del" onClick={() => removeRow(r._id)}>
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <td colSpan={3}>Total</td>
                                                <td colSpan={2} style={{ fontVariantNumeric: "tabular-nums" }}>
                                                    {totalQty % 1 === 0 ? totalQty : totalQty.toFixed(2)}
                                                </td>
                                                <td>🗑</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                {/* Hidden fields for form submission (mirrors blade) */}
                                <input type="hidden" name="total_qty" value={totalQty} />
                                <input type="hidden" name="item" value={rows.length} />
                            </div>

                            {/* ── Note ── */}
                            <div className="adj-field" style={{ marginBottom: 28 }}>
                                <label className="adj-label">Note</label>
                                <textarea className="adj-textarea" name="note" rows={5}
                                    value={note} onChange={e => setNote(e.target.value)} />
                            </div>

                            {/* ── Submit ── */}
                            <div className="adj-submit-row">
                                <button type="submit" className="adj-submit-btn" disabled={submitted}>
                                    {submitted ? "Submitting…" : "Submit"}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            </div>

            {/* Toast */}
            {toast && <div className={`adj-toast ${toast.type}`}>{toast.msg}</div>}
        </>
    );
}