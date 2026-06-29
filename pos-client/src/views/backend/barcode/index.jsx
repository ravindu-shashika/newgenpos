import { useState, useMemo, useRef, useEffect } from "react";

// ── Mock Data (replace with API fetch) ────────────────────────────────────────
const MOCK_DATA = [
    { id: 1, name: "Standard A4 Label Sheet", description: "Default setting for A4 label sheets with 3 columns." },
    { id: 2, name: "Continuous Roll 2in", description: "Continuous feed roll, 2 inch wide labels." },
    { id: 3, name: "Thermal Direct 4x6", description: "Thermal direct labels, 4x6 inches for shipping." },
    { id: 4, name: "Small Price Tag 1x1", description: "Tiny square price tags for retail shelving." },
    { id: 5, name: "Letter Sheet 2x4", description: "Standard US letter paper with 2x4 inch stickers." },
    { id: 6, name: "Custom Roll 3in", description: "" },
    { id: 7, name: "Avery 5160 Compatible", description: "Mimics Avery 5160 address label layout." },
    { id: 8, name: "CD/DVD Label Round", description: "Round labels sized for CD/DVD media." },
    { id: 9, name: "Jewelry Tag Narrow", description: "Narrow hang tags for jewelry and accessories." },
    { id: 10, name: "Warehouse Pallet 6x4", description: "Large pallet labels for warehouse use." },
    { id: 11, name: "Freezer Grade 2x3", description: "Cold-resistant labels for frozen storage." },
    { id: 12, name: "Blank Roll 1.5in", description: "Generic continuous blank roll, 1.5 inch." },
];

// ── Icons ─────────────────────────────────────────────────────────────────────
const PlusIcon = () => (
    <svg width={13} height={13} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="8" y1="3" x2="8" y2="13" /><line x1="3" y1="8" x2="13" y2="8" />
    </svg>
);
const TrashIcon = () => (
    <svg width={13} height={13} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="2 4 14 4" /><path d="M5 4V3h6v1" /><rect x="3" y="4" width="10" height="9" rx="1" />
        <line x1="6" y1="7" x2="6" y2="11" /><line x1="10" y1="7" x2="10" y2="11" />
    </svg>
);
const EditIcon = () => (
    <svg width={13} height={13} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 2l3 3-8 8H3v-3L11 2Z" />
    </svg>
);
const SearchIcon = () => (
    <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="7" cy="7" r="4.5" /><line x1="10.5" y1="10.5" x2="13.5" y2="13.5" />
    </svg>
);
const DownloadIcon = () => (
    <svg width={13} height={13} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 10v3h10v-3M8 2v8M5 7l3 3 3-3" />
    </svg>
);
const PrintIcon = () => (
    <svg width={13} height={13} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="10" height="7" rx="1" /><path d="M5 5V2h6v3" /><rect x="5" y="10" width="6" height="4" />
    </svg>
);
const ColumnsIcon = () => (
    <svg width={13} height={13} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M2 4h12M2 8h12M2 12h8" />
    </svg>
);
const ChevronDown = () => (
    <svg width={10} height={10} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polyline points="4 6 8 10 12 6" />
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
            boxShadow: "0 8px 24px rgba(0,0,0,.15)", animation: "toastIn .2s ease",
            background: type === "success" ? "#166534" : "#991b1b", color: "#fff",
        }}>
            {msg}
            <style>{`@keyframes toastIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
    );
}

// ── Action Dropdown ───────────────────────────────────────────────────────────
function ActionDropdown({ row, onEdit, onDelete }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    return (
        <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
            <button onClick={() => setOpen(o => !o)} style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "5px 10px", fontSize: 12, borderRadius: 6,
                border: "1px solid var(--border)", background: "var(--surface)",
                color: "var(--ink)", cursor: "pointer", fontFamily: "inherit",
                transition: "background .1s",
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
                    {[
                        { label: "Edit", icon: <EditIcon />, color: "var(--ink)", onClick: () => { setOpen(false); onEdit(row); } },
                    ].map(item => (
                        <div key={item.label} onClick={item.onClick}
                            style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", fontSize: 13, cursor: "pointer", color: item.color }}
                            onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                            {item.icon} {item.label}
                        </div>
                    ))}
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

// ── Column Toggle Panel ───────────────────────────────────────────────────────
const ALL_COLS = [
    { key: "name", label: "Sticker Sheet Setting Name" },
    { key: "description", label: "Description" },
];

function ColTogglePanel({ visibleCols, onToggle, onClose }) {
    const ref = useRef(null);
    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, [onClose]);

    return (
        <div ref={ref} style={{
            position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 200,
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,.12)",
            minWidth: 200, padding: "6px 0",
        }}>
            {ALL_COLS.map(c => (
                <label key={c.key} style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
                    fontSize: 13, cursor: "pointer", userSelect: "none",
                }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <input type="checkbox" checked={visibleCols.has(c.key)} onChange={() => onToggle(c.key)}
                        style={{ cursor: "pointer", accentColor: "#2563eb" }} />
                    {c.label}
                </label>
            ))}
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function BarcodeList() {
    const [data, setData] = useState(MOCK_DATA);
    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState("name");
    const [sortDir, setSortDir] = useState("asc");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selected, setSelected] = useState(new Set());
    const [visibleCols, setVisibleCols] = useState(new Set(["name", "description"]));
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
                r.name.toLowerCase().includes(q) ||
                (r.description || "").toLowerCase().includes(q)
            );
        }
        return [...rows].sort((a, b) => {
            const va = (a[sortKey] || "").toLowerCase();
            const vb = (b[sortKey] || "").toLowerCase();
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

    const toggleSelect = (id) => setSelected(prev => {
        const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s;
    });

    const toggleAll = () => setSelected(prev => {
        const s = new Set(prev);
        if (allSel) pageRows.forEach(r => s.delete(r.id));
        else pageRows.forEach(r => s.add(r.id));
        return s;
    });

    const handleDelete = (id) => {
        if (!window.confirm("Are you sure you want to delete this setting?")) return;
        setData(d => d.filter(r => r.id !== id));
        setSelected(prev => { const s = new Set(prev); s.delete(id); return s; });
        showToast("Setting deleted.");
    };

    const handleDeleteSelected = () => {
        if (!selected.size) { showToast("No setting is selected!", "danger"); return; }
        if (!window.confirm("Are you sure you want to delete the selected settings?")) return;
        const count = selected.size;
        setData(d => d.filter(r => !selected.has(r.id)));
        setSelected(new Set());
        showToast(`${count} setting${count > 1 ? "s" : ""} deleted.`);
    };

    const handleEdit = (row) => {
        alert(`Edit setting: ${row.name}\n(Wire to your edit route here.)`);
    };

    const exportCSV = () => {
        const cols = ALL_COLS.filter(c => visibleCols.has(c.key));
        const header = cols.map(c => c.label).join(",");
        const lines = filtered.map(r =>
            cols.map(c => `"${String(r[c.key] || "").replace(/"/g, '""')}"`).join(",")
        );
        const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "barcode_settings.csv";
        a.click();
        showToast("CSV exported.");
    };

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

    const css = `
    :root {
      --bg: #f8f7f4; --surface: #ffffff; --surface2: #f3f2ef;
      --border: rgba(0,0,0,.1); --ink: #111; --muted: #6b7280;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0f0f0f; --surface: #1a1a1a; --surface2: #242424;
        --border: rgba(255,255,255,.1); --ink: #f0ede6; --muted: #9ca3af;
      }
    }
    .bc-list * { box-sizing: border-box; margin: 0; padding: 0; }
    .bc-list {
      background: var(--bg); color: var(--ink);
      font-family: 'IBM Plex Mono','Fira Code',monospace;
      min-height: 100vh; padding: 32px 28px 64px;
    }
    .bc-list button { font-family: inherit; }
    .page-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
    .page-title { font-size: 20px; font-weight: 700; letter-spacing: -.03em; }
    .page-sub { font-size: 12px; color: var(--muted); margin-top: 2px; }
    .toolbar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 14px; }
    .tb-left { display: flex; gap: 8px; align-items: center; flex: 1; flex-wrap: wrap; }
    .tb-right { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 7px 14px; border-radius: 8px; font-size: 13px;
      border: 1px solid var(--border); background: var(--surface);
      color: var(--ink); cursor: pointer; white-space: nowrap;
      transition: background .12s, opacity .12s; font-family: inherit;
    }
    .btn:hover { background: var(--surface2); }
    .btn-primary { background: var(--ink) !important; color: var(--bg) !important; border-color: var(--ink) !important; }
    .btn-primary:hover { opacity: .82 !important; }
    .btn-danger { color: #dc2626 !important; border-color: #fca5a5 !important; background: #fff1f1 !important; }
    .btn-danger:hover { background: #fee2e2 !important; }
    .search-wrap { position: relative; display: flex; align-items: center; }
    .search-icon { position: absolute; left: 10px; color: var(--muted); pointer-events: none; }
    .search-inp {
      background: var(--surface); border: 1px solid var(--border); border-radius: 8px;
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
    td { padding: 10px 14px; border-bottom: 1px solid var(--border); vertical-align: middle; }
    tbody tr:last-child td { border-bottom: none; }
    tbody tr { transition: background .1s; }
    tbody tr:hover { background: var(--surface2); }
    tbody tr.row-sel { background: rgba(59,130,246,.06); }
    .desc-cell { font-size: 12px; color: var(--muted); max-width: 320px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .name-cell { font-weight: 600; font-size: 13px; }
    .empty-cell { text-align: center; padding: 48px 20px; color: var(--muted); font-size: 13px; }
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
    .col-rel { position: relative; }
    .row-num { color: var(--muted); font-size: 12px; }
  `;

    return (
        <>
            <style>{css}</style>
            <div className="bc-list">

                {/* Page header */}
                <div className="page-head">
                    <div>
                        <div className="page-title">Barcode Sticker Settings</div>
                        <div className="page-sub">{data.length} total settings</div>
                    </div>
                    <button className="btn btn-primary" onClick={() => alert("Navigate to create new setting")}>
                        <PlusIcon /> Add New Setting
                    </button>
                </div>

                {/* Toolbar */}
                <div className="toolbar">
                    <div className="tb-left">
                        <button className="btn btn-danger" onClick={handleDeleteSelected}>
                            <TrashIcon />
                            Delete Selected{selected.size > 0 ? ` (${selected.size})` : ""}
                        </button>
                    </div>
                    <div className="tb-right">
                        <div className="search-wrap">
                            <span className="search-icon"><SearchIcon /></span>
                            <input className="search-inp" type="text" placeholder="Search…"
                                value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                                autoComplete="off" />
                        </div>
                        <button className="btn" onClick={exportCSV}><DownloadIcon /> CSV</button>
                        <button className="btn" onClick={() => window.print()}><PrintIcon /> Print</button>
                        <div className="col-rel">
                            <button className="btn" onClick={() => setColOpen(o => !o)}><ColumnsIcon /> Columns</button>
                            {colOpen && (
                                <ColTogglePanel
                                    visibleCols={visibleCols}
                                    onToggle={key => setVisibleCols(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s; })}
                                    onClose={() => setColOpen(false)}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Table card */}
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
                                            {sortKey === c.key ? (sortDir === "asc" ? <SortAsc /> : <SortDesc />) : null}
                                        </th>
                                    ))}
                                    <th className="no-sort" style={{ width: 100 }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={visibleColDefs.length + 3}>
                                            <div className="empty-cell">No settings found.</div>
                                        </td>
                                    </tr>
                                ) : pageRows.map((row, i) => (
                                    <tr key={row.id} className={selected.has(row.id) ? "row-sel" : ""}>
                                        <td>
                                            <input type="checkbox" className="cb"
                                                checked={selected.has(row.id)}
                                                onChange={() => toggleSelect(row.id)} />
                                        </td>
                                        <td className="row-num">{(safePage - 1) * pageSize + i + 1}</td>

                                        {visibleColDefs.map(c => {
                                            if (c.key === "name") return (
                                                <td key={c.key} className="name-cell">{row.name}</td>
                                            );
                                            if (c.key === "description") return (
                                                <td key={c.key}>
                                                    <div className="desc-cell" title={row.description || ""}>
                                                        {row.description || <span style={{ color: "var(--muted)", fontStyle: "italic" }}>—</span>}
                                                    </div>
                                                </td>
                                            );
                                            return <td key={c.key}>{row[c.key] || "—"}</td>;
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
                                    <button key={p} className={`pg-btn${safePage === p ? " active" : ""}`}
                                        onClick={() => setPage(p)}>{p}</button>
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