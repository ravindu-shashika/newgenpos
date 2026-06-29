import { useState, useMemo, useRef, useEffect } from "react";

// ── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK_DATA = [
    { id: 1, date: "2024-03-15 09:22:11", reference_no: "ADJ-2024-0001", warehouse: "Main Warehouse", products: [{ name: "Widget A", qty: 5, unit_cost: 12.50 }, { name: "Gadget Pro", qty: 2, unit_cost: 89.99 }], note: "Monthly stock check." },
    { id: 2, date: "2024-03-18 14:05:30", reference_no: "ADJ-2024-0002", warehouse: "Secondary Store", products: [{ name: "Item Alpha", qty: 10, unit_cost: 15.00 }], note: "Damaged goods removed." },
    { id: 3, date: "2024-03-20 11:44:00", reference_no: "ADJ-2024-0003", warehouse: "Cold Storage", products: [{ name: "Frozen Good A", qty: 50, unit_cost: 8.00 }, { name: "Frozen Good B", qty: 20, unit_cost: 11.50 }], note: "Quarterly reconciliation — cold storage section updated after audit." },
    { id: 4, date: "2024-04-01 08:30:00", reference_no: "ADJ-2024-0004", warehouse: "Main Warehouse", products: [{ name: "Component X", qty: 100, unit_cost: 3.75 }], note: "Batch correction after supplier count." },
    { id: 5, date: "2024-04-05 16:20:45", reference_no: "ADJ-2024-0005", warehouse: "Secondary Store", products: [{ name: "Item Beta", qty: 15, unit_cost: 32.00 }, { name: "Device Z", qty: 3, unit_cost: 199.00 }], note: "" },
    { id: 6, date: "2024-04-10 10:00:00", reference_no: "ADJ-2024-0006", warehouse: "Main Warehouse", products: [{ name: "Widget B", qty: 8, unit_cost: 24.00 }], note: "Write-off — obsolete parts." },
    { id: 7, date: "2024-04-12 13:15:22", reference_no: "ADJ-2024-0007", warehouse: "Cold Storage", products: [{ name: "Frozen Good A", qty: 30, unit_cost: 8.00 }], note: "Temperature event — partial spoilage." },
    { id: 8, date: "2024-04-18 09:55:00", reference_no: "ADJ-2024-0008", warehouse: "Main Warehouse", products: [{ name: "Component Y", qty: 25, unit_cost: 5.20 }, { name: "Widget A", qty: 10, unit_cost: 12.50 }], note: "" },
    { id: 9, date: "2024-05-02 11:00:00", reference_no: "ADJ-2024-0009", warehouse: "Secondary Store", products: [{ name: "Item Alpha", qty: 5, unit_cost: 15.00 }], note: "Return from customer — restocked." },
    { id: 10, date: "2024-05-14 15:30:00", reference_no: "ADJ-2024-0010", warehouse: "Main Warehouse", products: [{ name: "Gadget Pro", qty: 1, unit_cost: 89.99 }], note: "Demo unit returned." },
    { id: 11, date: "2024-05-20 10:10:00", reference_no: "ADJ-2024-0011", warehouse: "Cold Storage", products: [{ name: "Frozen Good B", qty: 40, unit_cost: 11.50 }], note: "End-of-month freeze check." },
    { id: 12, date: "2024-06-01 08:00:00", reference_no: "ADJ-2024-0012", warehouse: "Main Warehouse", products: [{ name: "Component X", qty: 60, unit_cost: 3.75 }, { name: "Component Y", qty: 40, unit_cost: 5.20 }], note: "Mid-year stock audit completed." },
];

const ALL_COLS = [
    { key: "date", label: "Date" },
    { key: "reference_no", label: "Reference" },
    { key: "warehouse", label: "Warehouse" },
    { key: "products", label: "Products" },
    { key: "note", label: "Note" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(dt) {
    const [d, t] = dt.split(" ");
    const [y, mo, day] = d.split("-");
    return `${day}-${mo}-${y} ${t}`;
}

// ── Icons (inline SVG helpers) ────────────────────────────────────────────────
const Icon = ({ d, size = 14, ...props }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d={d} />
    </svg>
);

const PlusIcon = () => <Icon d="M8 3v10M3 8h10" />;
const TrashIcon = () => <Icon d="M2 4h12M5 4V3h6v1M3 4h10l-.8 9H3.8L3 4ZM6 7v4M10 7v4" />;
const EditIcon = () => <Icon d="M11 2l3 3-8 8H3v-3L11 2Z" />;
const SearchIcon = () => (
    <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="7" cy="7" r="4.5" /><line x1="10.5" y1="10.5" x2="13.5" y2="13.5" />
    </svg>
);
const ChevronDown = () => (
    <svg width={10} height={10} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polyline points="4 6 8 10 12 6" />
    </svg>
);
const DownloadIcon = () => (
    <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 10v3h10v-3M8 2v8M5 7l3 3 3-3" />
    </svg>
);
const PrintIcon = () => (
    <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="10" height="7" rx="1" />
        <path d="M5 5V2h6v3" /><rect x="5" y="10" width="6" height="4" />
    </svg>
);
const ColumnsIcon = () => (
    <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M2 4h12M2 8h12M2 12h8" />
    </svg>
);
const SortAsc = () => <span style={{ fontSize: 10, marginLeft: 3 }}>↑</span>;
const SortDesc = () => <span style={{ fontSize: 10, marginLeft: 3 }}>↓</span>;

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
    return (
        <div style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 9999,
            padding: "11px 18px", borderRadius: 8, fontSize: 13, fontWeight: 500,
            boxShadow: "0 8px 24px rgba(0,0,0,.15)",
            background: type === "success" ? "#166534" : type === "danger" ? "#991b1b" : "#111",
            color: "#fff", animation: "toastIn .2s ease",
        }}>
            {msg}
            <style>{`@keyframes toastIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
    );
}

// ── Dropdown ──────────────────────────────────────────────────────────────────
function ActionDropdown({ row, onEdit, onDelete }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
            <button onClick={() => setOpen(o => !o)} style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "5px 10px", fontSize: 12, borderRadius: 6,
                border: "1px solid var(--border)", background: "var(--surface)",
                color: "var(--ink)", cursor: "pointer", fontFamily: "inherit",
            }}>
                Action <ChevronDown />
            </button>
            {open && (
                <div style={{
                    position: "absolute", right: 0, top: "calc(100% + 4px)",
                    background: "var(--surface)", border: "1px solid var(--border)",
                    borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,.12)",
                    zIndex: 100, minWidth: 140, overflow: "hidden",
                }}>
                    <div onClick={() => { setOpen(false); onEdit(row); }}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", fontSize: 13, cursor: "pointer", color: "var(--ink)" }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <EditIcon /> Edit
                    </div>
                    <div style={{ height: 1, background: "var(--border)", margin: "2px 0" }} />
                    <div onClick={() => { setOpen(false); onDelete(row.id); }}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", fontSize: 13, cursor: "pointer", color: "#dc2626" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#fff1f1"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <TrashIcon /> Delete
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Column Toggle Panel ────────────────────────────────────────────────────────
function ColTogglePanel({ visibleCols, onToggle, onClose }) {
    const ref = useRef(null);
    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [onClose]);

    return (
        <div ref={ref} style={{
            position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 200,
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,.12)",
            minWidth: 160, padding: "6px 0",
        }}>
            {ALL_COLS.map(c => (
                <label key={c.key} style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
                    fontSize: 13, cursor: "pointer", userSelect: "none",
                }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <input type="checkbox" checked={visibleCols.has(c.key)}
                        onChange={() => onToggle(c.key)}
                        style={{ cursor: "pointer", accentColor: "#2563eb" }} />
                    {c.label}
                </label>
            ))}
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdjustmentList() {
    const [data, setData] = useState(MOCK_DATA);
    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState("date");
    const [sortDir, setSortDir] = useState("desc");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selected, setSelected] = useState(new Set());
    const [visibleCols, setVisibleCols] = useState(new Set(ALL_COLS.map(c => c.key)));
    const [colOpen, setColOpen] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 2800);
    };

    // Filter + sort
    const filtered = useMemo(() => {
        let rows = data;
        if (search.trim()) {
            const q = search.toLowerCase();
            rows = rows.filter(r =>
                r.reference_no.toLowerCase().includes(q) ||
                r.warehouse.toLowerCase().includes(q) ||
                r.note.toLowerCase().includes(q) ||
                r.products.some(p => p.name.toLowerCase().includes(q))
            );
        }
        return [...rows].sort((a, b) => {
            let va = sortKey === "products" ? a.products.length : a[sortKey];
            let vb = sortKey === "products" ? b.products.length : b[sortKey];
            if (typeof va === "string") { va = va.toLowerCase(); vb = vb.toLowerCase(); }
            if (va < vb) return sortDir === "asc" ? -1 : 1;
            if (va > vb) return sortDir === "asc" ? 1 : -1;
            return 0;
        });
    }, [data, search, sortKey, sortDir]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

    const allSel = pageRows.length > 0 && pageRows.every(r => selected.has(r.id));
    const someSel = pageRows.some(r => selected.has(r.id));

    const toggleSort = (key) => {
        if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
        else { setSortKey(key); setSortDir("asc"); }
        setPage(1);
    };

    const toggleSelect = (id) => {
        setSelected(prev => {
            const s = new Set(prev);
            s.has(id) ? s.delete(id) : s.add(id);
            return s;
        });
    };

    const toggleAll = () => {
        setSelected(prev => {
            const s = new Set(prev);
            if (allSel) pageRows.forEach(r => s.delete(r.id));
            else pageRows.forEach(r => s.add(r.id));
            return s;
        });
    };

    const handleDelete = (id) => {
        if (!window.confirm("Are you sure you want to delete?")) return;
        setData(d => d.filter(r => r.id !== id));
        setSelected(prev => { const s = new Set(prev); s.delete(id); return s; });
        showToast("Adjustment deleted.");
    };

    const handleDeleteSelected = () => {
        if (!selected.size) { showToast("Nothing is selected!", "danger"); return; }
        if (!window.confirm("Are you sure you want to delete?")) return;
        const count = selected.size;
        setData(d => d.filter(r => !selected.has(r.id)));
        setSelected(new Set());
        showToast(`${count} adjustment${count > 1 ? "s" : ""} deleted.`);
    };

    const handleEdit = (row) => {
        alert(`Edit: ${row.reference_no}\n(Wire to your edit route here.)`);
    };

    const toggleCol = (key) => {
        setVisibleCols(prev => {
            const s = new Set(prev);
            s.has(key) ? s.delete(key) : s.add(key);
            return s;
        });
    };

    const exportCSV = () => {
        const cols = ALL_COLS.filter(c => visibleCols.has(c.key));
        const header = cols.map(c => c.label).join(",");
        const lines = filtered.map(r =>
            cols.map(c => {
                if (c.key === "products") return `"${r.products.map(p => `${p.name} x${p.qty}`).join("; ")}"`;
                if (c.key === "date") return fmtDate(r.date);
                return `"${String(r[c.key] || "").replace(/"/g, '""')}"`;
            }).join(",")
        );
        const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "adjustments.csv";
        a.click();
        showToast("CSV exported.");
    };

    // Pagination pages array
    const pageNums = useMemo(() => {
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || Math.abs(i - safePage) <= 1) pages.push(i);
        }
        return pages;
    }, [totalPages, safePage]);

    const visibleColDefs = ALL_COLS.filter(c => visibleCols.has(c.key));
    const start = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
    const end = Math.min(safePage * pageSize, filtered.length);

    // ── Styles ──
    const css = `
    :root {
      --bg: #f8f7f4;
      --surface: #ffffff;
      --surface2: #f3f2ef;
      --border: rgba(0,0,0,.1);
      --ink: #111;
      --muted: #6b7280;
      --r: 8px;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0f0f0f;
        --surface: #1a1a1a;
        --surface2: #242424;
        --border: rgba(255,255,255,.1);
        --ink: #f0ede6;
        --muted: #9ca3af;
      }
    }
    .adj-list-wrap * { box-sizing: border-box; margin: 0; padding: 0; }
    .adj-list-wrap {
      background: var(--bg);
      color: var(--ink);
      font-family: 'IBM Plex Mono', 'Fira Code', monospace;
      min-height: 100vh;
      padding: 32px 28px 64px;
    }
    .adj-list-wrap button { font-family: inherit; }
    .hd { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
    .hd-title { font-size: 20px; font-weight: 700; letter-spacing: -.03em; }
    .hd-sub { font-size: 12px; color: var(--muted); margin-top: 2px; }
    .toolbar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 14px; }
    .toolbar-left { display: flex; gap: 8px; align-items: center; flex: 1; flex-wrap: wrap; }
    .toolbar-right { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .btn-base {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 7px 14px; border-radius: var(--r); font-size: 13px;
      border: 1px solid var(--border); background: var(--surface);
      color: var(--ink); cursor: pointer; transition: background .12s, opacity .12s;
      white-space: nowrap;
    }
    .btn-base:hover { background: var(--surface2); }
    .btn-primary { background: var(--ink) !important; color: var(--bg) !important; border-color: var(--ink) !important; }
    .btn-primary:hover { opacity: .82; }
    .btn-danger { color: #dc2626 !important; border-color: #fca5a5 !important; background: #fff1f1 !important; }
    .btn-danger:hover { background: #fee2e2 !important; }
    .search-wrap { position: relative; display: flex; align-items: center; }
    .search-icon-pos { position: absolute; left: 10px; color: var(--muted); pointer-events: none; }
    .search-inp {
      background: var(--surface); border: 1px solid var(--border); border-radius: var(--r);
      color: var(--ink); font-family: inherit; font-size: 13px;
      padding: 7px 12px 7px 32px; outline: none; width: 220px; transition: border-color .15s;
    }
    .search-inp:focus { border-color: #3b82f6; }
    .search-inp::placeholder { color: var(--muted); }
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
    .tbl-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead tr { background: var(--surface2); border-bottom: 1px solid var(--border); }
    th {
      padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 600;
      letter-spacing: .08em; text-transform: uppercase; color: var(--muted);
      white-space: nowrap; cursor: pointer; user-select: none; transition: color .12s;
    }
    th:hover { color: var(--ink); }
    th.no-sort { cursor: default; }
    th.no-sort:hover { color: var(--muted); }
    td { padding: 10px 14px; border-bottom: 1px solid var(--border); vertical-align: top; }
    tbody tr:last-child td { border-bottom: none; }
    tbody tr { transition: background .1s; }
    tbody tr:hover { background: var(--surface2); }
    tbody tr.row-sel { background: rgba(59,130,246,.06); }
    .ref-badge {
      display: inline-block; font-size: 11px; font-weight: 700; padding: 3px 9px;
      border-radius: 4px; letter-spacing: .06em;
      background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe;
    }
    @media (prefers-color-scheme: dark) {
      .ref-badge { background: #1e3a5f; color: #93c5fd; border-color: #1d4ed8; }
    }
    .prod-name { font-size: 12px; font-weight: 600; color: var(--ink); }
    .prod-meta { font-size: 11px; color: var(--muted); }
    .note-cell { font-size: 12px; color: var(--muted); max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .footer {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 16px; border-top: 1px solid var(--border); flex-wrap: wrap; gap: 10px;
    }
    .footer-info { font-size: 12px; color: var(--muted); }
    .pagination { display: flex; gap: 4px; align-items: center; }
    .pg-btn {
      background: var(--surface); border: 1px solid var(--border); border-radius: 6px;
      color: var(--ink); font-size: 12px; padding: 5px 10px; cursor: pointer;
      transition: background .1s; min-width: 32px; text-align: center; font-family: inherit;
    }
    .pg-btn:hover:not(:disabled) { background: var(--surface2); }
    .pg-btn.active { background: var(--ink); color: var(--bg); border-color: var(--ink); }
    .pg-btn:disabled { opacity: .4; cursor: not-allowed; }
    .ps-wrap { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); }
    .ps-select {
      background: var(--surface); border: 1px solid var(--border); border-radius: 6px;
      color: var(--ink); font-family: inherit; font-size: 12px; padding: 5px 8px; cursor: pointer;
    }
    .cb { cursor: pointer; accent-color: #2563eb; width: 14px; height: 14px; }
    .empty { text-align: center; padding: 48px 20px; color: var(--muted); font-size: 13px; }
    .col-rel { position: relative; }
  `;

    return (
        <>
            <style>{css}</style>
            <div className="adj-list-wrap">
                {/* Header */}
                <div className="hd">
                    <div>
                        <div className="hd-title">Quantity Adjustments</div>
                        <div className="hd-sub">{data.length} total records</div>
                    </div>
                    <button className="btn-base btn-primary" onClick={() => alert("Navigate to create adjustment")}>
                        <PlusIcon /> Add Adjustment
                    </button>
                </div>

                {/* Toolbar */}
                <div className="toolbar">
                    <div className="toolbar-left">
                        <button className="btn-base btn-danger" onClick={handleDeleteSelected}>
                            <TrashIcon />
                            Delete Selected{selected.size > 0 ? ` (${selected.size})` : ""}
                        </button>
                    </div>
                    <div className="toolbar-right">
                        <div className="search-wrap">
                            <span className="search-icon-pos"><SearchIcon /></span>
                            <input className="search-inp" type="text" placeholder="Search…"
                                value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                                autoComplete="off" />
                        </div>
                        <button className="btn-base" onClick={exportCSV}><DownloadIcon /> CSV</button>
                        <button className="btn-base" onClick={() => window.print()}><PrintIcon /> Print</button>
                        <div className="col-rel">
                            <button className="btn-base" onClick={() => setColOpen(o => !o)}><ColumnsIcon /> Columns</button>
                            {colOpen && (
                                <ColTogglePanel visibleCols={visibleCols} onToggle={toggleCol} onClose={() => setColOpen(false)} />
                            )}
                        </div>
                    </div>
                </div>

                {/* Table Card */}
                <div className="card">
                    <div className="tbl-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th className="no-sort" style={{ width: 36 }}>
                                        <input type="checkbox" className="cb"
                                            checked={allSel}
                                            ref={el => { if (el) el.indeterminate = someSel && !allSel; }}
                                            onChange={toggleAll} />
                                    </th>
                                    <th className="no-sort" style={{ width: 36 }}>#</th>
                                    {visibleColDefs.map(c => (
                                        <th key={c.key} onClick={() => toggleSort(c.key)}>
                                            {c.label}
                                            {sortKey === c.key && (sortDir === "asc" ? <SortAsc /> : <SortDesc />)}
                                        </th>
                                    ))}
                                    <th className="no-sort" style={{ width: 100 }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={visibleColDefs.length + 3}>
                                            <div className="empty">No adjustments found.</div>
                                        </td>
                                    </tr>
                                ) : pageRows.map((row, i) => (
                                    <tr key={row.id} className={selected.has(row.id) ? "row-sel" : ""}>
                                        <td>
                                            <input type="checkbox" className="cb"
                                                checked={selected.has(row.id)}
                                                onChange={() => toggleSelect(row.id)} />
                                        </td>
                                        <td style={{ color: "var(--muted)", fontSize: 12 }}>
                                            {(safePage - 1) * pageSize + i + 1}
                                        </td>
                                        {visibleColDefs.map(c => {
                                            if (c.key === "date") return (
                                                <td key={c.key} style={{ whiteSpace: "nowrap", fontSize: 12 }}>
                                                    {fmtDate(row.date)}
                                                </td>
                                            );
                                            if (c.key === "reference_no") return (
                                                <td key={c.key}><span className="ref-badge">{row.reference_no}</span></td>
                                            );
                                            if (c.key === "warehouse") return (
                                                <td key={c.key} style={{ whiteSpace: "nowrap" }}>{row.warehouse}</td>
                                            );
                                            if (c.key === "products") return (
                                                <td key={c.key}>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                                        {row.products.map((p, pi) => (
                                                            <div key={pi}>
                                                                <div className="prod-name">{p.name}</div>
                                                                <div className="prod-meta">{p.qty} × {p.unit_cost.toFixed(2)}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            );
                                            if (c.key === "note") return (
                                                <td key={c.key}>
                                                    <div className="note-cell" title={row.note || ""}>{row.note || "—"}</div>
                                                </td>
                                            );
                                            return <td key={c.key}>{row[c.key] || ""}</td>;
                                        })}
                                        <td>
                                            <ActionDropdown row={row} onEdit={handleEdit} onDelete={handleDelete} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="footer">
                        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                            <div className="footer-info">
                                {filtered.length === 0 ? "No results" :
                                    filtered.length <= pageSize ? `Showing all ${filtered.length}` :
                                        `Showing ${start}–${end} of ${filtered.length}`}
                            </div>
                            <div className="ps-wrap">
                                <span>Rows:</span>
                                <select className="ps-select" value={pageSize}
                                    onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>
                                    {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                                    <option value={99999}>All</option>
                                </select>
                            </div>
                        </div>
                        <div className="pagination">
                            <button className="pg-btn" onClick={() => setPage(1)} disabled={safePage === 1}>«</button>
                            <button className="pg-btn" onClick={() => setPage(p => p - 1)} disabled={safePage === 1}>‹</button>
                            {pageNums.reduce((acc, p, i, arr) => {
                                if (i > 0 && p - arr[i - 1] > 1)
                                    acc.push(<span key={`e${p}`} style={{ padding: "0 4px", color: "var(--muted)", fontSize: 12 }}>…</span>);
                                acc.push(
                                    <button key={p} className={`pg-btn${safePage === p ? " active" : ""}`} onClick={() => setPage(p)}>{p}</button>
                                );
                                return acc;
                            }, [])}
                            <button className="pg-btn" onClick={() => setPage(p => p + 1)} disabled={safePage === totalPages}>›</button>
                            <button className="pg-btn" onClick={() => setPage(totalPages)} disabled={safePage === totalPages}>»</button>
                        </div>
                    </div>
                </div>

                {toast && <Toast msg={toast.msg} type={toast.type} />}
            </div>
        </>
    );
}