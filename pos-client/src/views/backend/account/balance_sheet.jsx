import { useState, useMemo, useEffect, useCallback } from "react";
import { api } from "../../../services";
import authStore from "../../../stores/authStore";
import { permissionsBypassed } from "../../../config/permissions";

import { PageLayout } from "../../../components/ui";

function hasBalanceSheetAccess(permissions) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.some(
        (p) => p === "balance-sheet" || p.startsWith("balance-sheet")
    );
}

const css = `
  .bs-balance-sheet {
    --bg: #f5f2eb;
    --surface: #fffef9;
    --surface2: #f0ece0;
    --border: #ddd8c8;
    --ink: #1a1710;
    --muted: #7a7568;
    --credit: #1a6e3a;
    --debit: #c8401a;
    --balance-pos: #1a3a6e;
    --balance-neg: #c8401a;
    --mono: 'IBM Plex Mono', monospace;
    --display: 'Clash Display', Georgia, serif;
    --radius: 4px;
    width: 100%;
    font-family: var(--mono);
    color: var(--ink);
  }
  .bs-balance-sheet .bs-error {
    margin-bottom: 16px;
    color: var(--debit);
    font-size: 0.82rem;
  }

  .bs-balance-sheet .bs-summary {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 32px;
  }
  @media (max-width: 640px) { .bs-balance-sheet .bs-summary { grid-template-columns: 1fr; } }
  .bs-balance-sheet .bs-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 20px 22px;
    position: relative;
    overflow: hidden;
  }
  .bs-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
  }
  .bs-card.credit::before  { background: var(--credit); }
  .bs-card.debit::before   { background: var(--debit); }
  .bs-card.balance::before { background: var(--balance-pos); }
  .bs-card-label {
    font-size: 0.62rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 8px;
  }
  .bs-card-value {
    font-family: var(--display);
    font-size: 1.8rem;
    font-weight: 600;
    letter-spacing: -0.02em;
  }
  .bs-card.credit  .bs-card-value { color: var(--credit); }
  .bs-card.debit   .bs-card-value { color: var(--debit); }
  .bs-card.balance .bs-card-value { color: var(--balance-pos); }

  /* ── Toolbar ── */
  .bs-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }
  .bs-search {
    flex: 1;
    min-width: 200px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--ink);
    font-family: var(--mono);
    font-size: 0.8rem;
    padding: 8px 14px;
    outline: none;
    transition: border-color 0.15s;
  }
  .bs-search:focus { border-color: var(--ink); }
  .bs-search::placeholder { color: var(--muted); }
  .bs-select {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--ink);
    font-family: var(--mono);
    font-size: 0.78rem;
    padding: 8px 12px;
    outline: none;
    cursor: pointer;
  }

  /* ── Table ── */
  .bs-balance-sheet .bs-table-wrap {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow-x: auto;
    width: 100%;
  }
  .bs-balance-sheet .bs-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8rem;
  }
  .bs-table thead tr {
    background: var(--ink);
    color: var(--bg);
  }
  .bs-table th {
    padding: 12px 16px;
    text-align: left;
    font-size: 0.62rem;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    white-space: nowrap;
    cursor: pointer;
    user-select: none;
    transition: background 0.12s;
  }
  .bs-table th:hover { background: #333; }
  .bs-table th .sort-icon { margin-left: 4px; opacity: 0.4; font-style: normal; }
  .bs-table th.sorted .sort-icon { opacity: 1; }
  .bs-table td {
    padding: 11px 16px;
    border-bottom: 1px solid var(--surface2);
    vertical-align: middle;
    white-space: nowrap;
  }
  .bs-table tbody tr { transition: background 0.1s; }
  .bs-table tbody tr:hover { background: var(--surface2); }
  .bs-table tbody tr.selected-row { background: #eef5ff; }
  .bs-table tbody tr.selected-row:hover { background: #e0ecff; }

  /* ── Checkbox ── */
  .bs-chk {
    width: 15px; height: 15px;
    accent-color: var(--ink);
    cursor: pointer;
  }

  /* ── Footer totals ── */
  .bs-table tfoot tr {
    background: var(--surface2);
    border-top: 2px solid var(--ink);
  }
  .bs-table tfoot td {
    padding: 12px 16px;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    border-bottom: none;
  }

  /* ── Number cells ── */
  .cell-num    { font-variant-numeric: tabular-nums; text-align: right; }
  .cell-credit { color: var(--credit); font-weight: 500; }
  .cell-debit  { color: var(--debit);  font-weight: 500; }
  .cell-bal-pos { color: var(--balance-pos); font-weight: 600; }
  .cell-bal-neg { color: var(--balance-neg); font-weight: 600; }
  .cell-acct {
    font-size: 0.72rem;
    background: var(--surface2);
    border-radius: 2px;
    padding: 2px 8px;
    display: inline-block;
    font-variant-numeric: tabular-nums;
  }

  /* ── Pagination ── */
  .bs-pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-top: 1px solid var(--border);
    font-size: 0.72rem;
    color: var(--muted);
    background: var(--surface);
    flex-wrap: wrap;
    gap: 10px;
  }
  .bs-page-btns { display: flex; gap: 4px; }
  .bs-page-btn {
    background: none;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--ink);
    cursor: pointer;
    font-family: var(--mono);
    font-size: 0.72rem;
    min-width: 30px;
    padding: 4px 8px;
    text-align: center;
    transition: all 0.12s;
  }
  .bs-page-btn:hover:not(:disabled) { background: var(--ink); color: var(--bg); border-color: var(--ink); }
  .bs-page-btn.cur { background: var(--ink); color: var(--bg); border-color: var(--ink); }
  .bs-page-btn:disabled { opacity: 0.3; cursor: not-allowed; }

  /* ── Selection info bar ── */
  .bs-sel-bar {
    background: var(--ink);
    color: var(--bg);
    font-size: 0.72rem;
    padding: 8px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .bs-sel-bar button {
    background: none;
    border: 1px solid rgba(255,255,255,0.3);
    border-radius: var(--radius);
    color: var(--bg);
    cursor: pointer;
    font-family: var(--mono);
    font-size: 0.7rem;
    padding: 3px 10px;
  }
  .bs-sel-bar button:hover { background: rgba(255,255,255,0.1); }

  /* ── Empty ── */
  .bs-empty {
    text-align: center;
    padding: 60px 20px;
    color: var(--muted);
    font-size: 0.8rem;
  }
  .bs-empty-icon { font-size: 2.5rem; margin-bottom: 12px; display: block; opacity: 0.3; }

  .fade-row {
    animation: rowIn 0.2s ease both;
  }
  @keyframes rowIn {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @media print {
    .bs-balance-sheet .bs-toolbar,
    .bs-balance-sheet .bs-pagination,
    .bs-balance-sheet .bs-sel-bar { display: none !important; }
    .bs-balance-sheet .bs-table-wrap { border: none; }
  }
`;

// ── Component ────────────────────────────────────────────────────────────────
function fmt(n, decimals = 2, forceSign = false) {
    const abs = Math.abs(n).toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
    if (forceSign && n < 0) return `(${abs})`;
    return abs;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export default function BalanceSheet() {
    const [rows, setRows] = useState([]);
    const [decimal, setDecimal] = useState(2);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const canView = permissionsBypassed() || hasBalanceSheetAccess(authStore.getPermissions());
    const [search, setSearch] = useState("");
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [sortCol, setSortCol] = useState(null);
    const [sortDir, setSortDir] = useState("asc");
    const [selected, setSelected] = useState(new Set());

    const fetchRows = useCallback(async () => {
        setLoading(true);
        setLoadError("");
        try {
            const res = await api.get("balancesheet");
            const data = res.data?.data || [];
            setRows(data);
            if (res.data?.decimal != null) setDecimal(res.data.decimal);
        } catch (err) {
            setLoadError(err?.message || "Failed to load balance sheet.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (canView) fetchRows();
        else setLoading(false);
    }, [canView, fetchRows]);

    // Enrich rows with computed display fields
    const allRows = useMemo(() => rows.map((a) => ({
        key: a.id ?? a.key,
        name: a.name,
        account_no: a.account_no,
        credit: a.credit_raw ?? 0,
        debit: -(a.debit_raw ?? 0),
        debitDisplay: a.debit_raw ?? 0,
        balance: a.balance_raw ?? ((a.credit_raw ?? 0) - (a.debit_raw ?? 0)),
    })), [rows]);

    // Filtered
    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        if (!q) return allRows;
        return allRows.filter(r =>
            r.name.toLowerCase().includes(q) ||
            r.account_no.toLowerCase().includes(q)
        );
    }, [allRows, search]);

    // Sorted
    const sorted = useMemo(() => {
        if (sortCol === null) return filtered;
        return [...filtered].sort((a, b) => {
            let av, bv;
            if (sortCol === 0) { av = a.name; bv = b.name; }
            else if (sortCol === 1) { av = a.account_no; bv = b.account_no; }
            else if (sortCol === 2) { av = a.credit; bv = b.credit; }
            else if (sortCol === 3) { av = a.debitDisplay; bv = b.debitDisplay; }
            else { av = a.balance; bv = b.balance; }
            if (av < bv) return sortDir === "asc" ? -1 : 1;
            if (av > bv) return sortDir === "asc" ? 1 : -1;
            return 0;
        });
    }, [filtered, sortCol, sortDir]);

    // Paginate
    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const pageRows = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

    // Footer totals — if rows selected use selected, else use current page
    const activeRows = selected.size > 0
        ? sorted.filter(r => selected.has(r.key))
        : pageRows;

    const footCredit = activeRows.reduce((s, r) => s + r.credit, 0);
    const footDebit = activeRows.reduce((s, r) => s + r.debitDisplay, 0);
    const footBalance = activeRows.reduce((s, r) => s + r.balance, 0);

    // Summary (always all rows)
    const totalCredit = allRows.reduce((s, r) => s + r.credit, 0);
    const totalDebit = allRows.reduce((s, r) => s + r.debitDisplay, 0);
    const totalBalance = allRows.reduce((s, r) => s + r.balance, 0);

    const handleSort = (col) => {
        if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
        else { setSortCol(col); setSortDir("asc"); }
        setPage(1);
    };

    const toggleRow = (key) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    const toggleAll = () => {
        const pageKeys = pageRows.map(r => r.key);
        const allSelected = pageKeys.every(k => selected.has(k));
        setSelected(prev => {
            const next = new Set(prev);
            pageKeys.forEach(k => allSelected ? next.delete(k) : next.add(k));
            return next;
        });
    };

    const clearSelection = () => setSelected(new Set());

    const handleExportCSV = () => {
        const rows = (selected.size > 0 ? sorted.filter(r => selected.has(r.key)) : sorted);
        const headers = ["#", "Name", "Account No", "Credit", "Debit", "Balance"];
        const data = rows.map((r, i) => [i + 1, r.name, r.account_no,
        r.credit.toFixed(2), r.debitDisplay.toFixed(2), r.balance.toFixed(2)]);
        const csv = [headers, ...data, ["", "Total", "", footCredit.toFixed(2), footDebit.toFixed(2), footBalance.toFixed(2)]]
            .map(r => r.join(",")).join("\n");
        const a = document.createElement("a");
        a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
        a.download = "balance-sheet.csv";
        a.click();
    };

    const sortIcon = (col) => {
        if (sortCol !== col) return <i className="sort-icon">↕</i>;
        return <i className="sort-icon">{sortDir === "asc" ? "↑" : "↓"}</i>;
    };

    const pageNums = () => {
        const nums = [];
        const delta = 2;
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= safePage - delta && i <= safePage + delta))
                nums.push(i);
            else if (nums[nums.length - 1] !== "...")
                nums.push("...");
        }
        return nums;
    };

    const pageAllChecked = pageRows.length > 0 && pageRows.every(r => selected.has(r.key));

    if (!canView) {
        return (
            <PageLayout eyebrow="Accounting" title="Balance Sheet">
                <p className="text-muted">You do not have permission to view the balance sheet.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout
            eyebrow="Accounting"
            title="Balance Sheet"
            actions={(
                <>
                    <button type="button" className="ui-btn" onClick={handleExportCSV}>Export CSV</button>
                    <button type="button" className="ui-btn" onClick={() => window.print()}>Print</button>
                </>
            )}
        >
            <style>{css}</style>
            <div className="bs-balance-sheet">

                {loadError && (
                    <div className="bs-error">{loadError}</div>
                )}

                {/* Summary cards */}
                <div className="bs-summary">
                    <div className="bs-card credit">
                        <div className="bs-card-label">Total Credit</div>
                        <div className="bs-card-value">{fmt(totalCredit, decimal)}</div>
                    </div>
                    <div className="bs-card debit">
                        <div className="bs-card-label">Total Debit</div>
                        <div className="bs-card-value">{fmt(totalDebit, decimal)}</div>
                    </div>
                    <div className="bs-card balance">
                        <div className="bs-card-label">Net Balance</div>
                        <div className="bs-card-value" style={{ color: totalBalance >= 0 ? "var(--balance-pos)" : "var(--balance-neg)" }}>
                            {fmt(totalBalance, decimal)}
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="bs-toolbar">
                    <input
                        className="bs-search"
                        placeholder="Search by name or account number…"
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                    />
                    <select className="bs-select" value={pageSize}
                        onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>
                        {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n} per page</option>)}
                        <option value={9999}>All</option>
                    </select>
                </div>

                {/* Selection bar */}
                {selected.size > 0 && (
                    <div className="bs-sel-bar">
                        <span>{selected.size} row{selected.size > 1 ? "s" : ""} selected — totals shown in footer</span>
                        <button onClick={clearSelection}>✕ Clear selection</button>
                    </div>
                )}

                {/* Table */}
                <div className="bs-table-wrap">
                    <table className="bs-table">
                        <thead>
                            <tr>
                                <th style={{ width: 40 }} onClick={toggleAll}>
                                    <input type="checkbox" className="bs-chk" readOnly
                                        checked={pageAllChecked} onChange={toggleAll} />
                                </th>
                                {[["Name", 0], ["Account No", 1], ["Credit", 2], ["Debit", 3], ["Balance", 4]].map(([label, col]) => (
                                    <th key={col} className={sortCol === col ? "sorted" : ""}
                                        style={{ textAlign: col >= 2 ? "right" : "left" }}
                                        onClick={() => handleSort(col)}>
                                        {label}{sortIcon(col)}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6}>
                                        <div className="bs-empty">Loading balance sheet…</div>
                                    </td>
                                </tr>
                            ) : pageRows.length === 0 ? (
                                <tr>
                                    <td colSpan={6}>
                                        <div className="bs-empty">
                                            <span className="bs-empty-icon">📊</span>
                                            No accounts found
                                        </div>
                                    </td>
                                </tr>
                            ) : pageRows.map((r, i) => (
                                <tr key={r.key}
                                    className={`fade-row${selected.has(r.key) ? " selected-row" : ""}`}
                                    style={{ animationDelay: `${i * 0.03}s` }}
                                    onClick={() => toggleRow(r.key)}>
                                    <td>
                                        <input type="checkbox" className="bs-chk" readOnly
                                            checked={selected.has(r.key)}
                                            onChange={() => toggleRow(r.key)}
                                            onClick={e => e.stopPropagation()} />
                                    </td>
                                    <td style={{ fontWeight: 500 }}>{r.name}</td>
                                    <td><span className="cell-acct">{r.account_no}</span></td>
                                    <td className="cell-num cell-credit">{fmt(r.credit, decimal)}</td>
                                    <td className="cell-num cell-debit">{fmt(r.debitDisplay, decimal)}</td>
                                    <td className={`cell-num ${r.balance >= 0 ? "cell-bal-pos" : "cell-bal-neg"}`}>
                                        {r.balance < 0 && <span style={{ opacity: 0.6, marginRight: 2 }}>−</span>}
                                        {fmt(Math.abs(r.balance), decimal)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>

                        {/* Footer totals — mirrors blade's tfoot with datatable_sum logic */}
                        <tfoot>
                            <tr>
                                <td></td>
                                <td style={{ fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                                    {selected.size > 0 ? `${selected.size} selected` : "Page Total"}
                                </td>
                                <td></td>
                                <td className="cell-num cell-credit" style={{ fontWeight: 600 }}>{fmt(footCredit, decimal)}</td>
                                <td className="cell-num cell-debit" style={{ fontWeight: 600 }}>{fmt(footDebit, decimal)}</td>
                                <td className={`cell-num ${footBalance >= 0 ? "cell-bal-pos" : "cell-bal-neg"}`} style={{ fontWeight: 600 }}>
                                    {footBalance < 0 && <span style={{ opacity: 0.6, marginRight: 2 }}>−</span>}
                                    {fmt(Math.abs(footBalance), decimal)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>

                    {/* Pagination */}
                    <div className="bs-pagination">
                        <span>
                            Showing {sorted.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, sorted.length)} of {sorted.length} accounts
                        </span>
                        <div className="bs-page-btns">
                            <button className="bs-page-btn" disabled={safePage === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                            {pageNums().map((n, i) =>
                                n === "..." ? (
                                    <span key={i} style={{ padding: "4px", fontSize: "0.72rem", color: "var(--muted)" }}>…</span>
                                ) : (
                                    <button key={i} className={`bs-page-btn${n === safePage ? " cur" : ""}`} onClick={() => setPage(n)}>{n}</button>
                                )
                            )}
                            <button className="bs-page-btn" disabled={safePage === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
                        </div>
                    </div>
                </div>

            </div>
        </PageLayout>
    );
}