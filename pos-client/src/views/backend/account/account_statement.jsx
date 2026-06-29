import { useState, useMemo, useEffect, useCallback } from "react";
import { api } from "../../../services";
import authStore from "../../../stores/authStore";
import { permissionsBypassed } from "../../../config/permissions";
import { PageLayout } from "../../../components/ui";

function hasAccountStatementAccess(permissions) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.some(
        (p) => p === "account-statement" || p.startsWith("account-statement")
    );
}

const css = `
  .as-account-statement {
    --surface: #fffef9;
    --surface2: #f0ece0;
    --border: #ddd8c8;
    --ink: #1a1710;
    --muted: #7a7568;
    --credit: #1a6e3a;
    --debit: #c8401a;
    --balance: #1a3a6e;
    --mono: 'IBM Plex Mono', monospace;
    --display: 'Clash Display', Georgia, serif;
    --radius: 4px;
    width: 100%;
    font-family: var(--mono);
    color: var(--ink);
  }
  .as-account-statement .as-error {
    margin-bottom: 16px;
    color: var(--debit);
    font-size: 0.82rem;
  }
  .as-account-statement .as-filter {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
    margin-bottom: 24px;
    padding: 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }
  .as-account-statement .as-filter label {
    display: block;
    font-size: 0.62rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 6px;
  }
  .as-account-statement .as-filter input,
  .as-account-statement .as-filter select {
    width: 100%;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--ink);
    font-family: var(--mono);
    font-size: 0.8rem;
    padding: 8px 12px;
    outline: none;
  }
  .as-account-statement .as-filter-actions {
    display: flex;
    align-items: flex-end;
    gap: 8px;
  }
  .as-account-statement .as-account-tag {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 24px;
    background: var(--ink);
    color: #f5f2eb;
    font-size: 0.72rem;
    letter-spacing: 0.1em;
    padding: 6px 14px;
    border-radius: 2px;
  }
  .as-account-statement .as-account-tag span { opacity: 0.5; }
  .as-account-statement .as-summary {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 32px;
  }
  @media (max-width: 640px) { .as-account-statement .as-summary { grid-template-columns: 1fr; } }
  .as-account-statement .as-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 20px 22px;
    position: relative;
    overflow: hidden;
  }
  .as-account-statement .as-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
  }
  .as-account-statement .as-card.credit::before { background: var(--credit); }
  .as-account-statement .as-card.debit::before  { background: var(--debit); }
  .as-account-statement .as-card.balance::before { background: var(--balance); }
  .as-account-statement .as-card-label {
    font-size: 0.62rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 8px;
  }
  .as-account-statement .as-card-value {
    font-family: var(--display);
    font-size: 1.8rem;
    font-weight: 600;
    letter-spacing: -0.02em;
  }
  .as-account-statement .as-card.credit .as-card-value { color: var(--credit); }
  .as-account-statement .as-card.debit  .as-card-value { color: var(--debit); }
  .as-account-statement .as-card.balance .as-card-value { color: var(--balance); }
  .as-account-statement .as-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }
  .as-account-statement .as-search {
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
  }
  .as-account-statement .as-select {
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
  .as-account-statement .as-table-wrap {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow-x: auto;
    width: 100%;
  }
  .as-account-statement .as-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8rem;
  }
  .as-account-statement .as-table thead tr {
    background: var(--ink);
    color: #f5f2eb;
  }
  .as-account-statement .as-table th {
    padding: 12px 16px;
    text-align: left;
    font-size: 0.62rem;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    white-space: nowrap;
    cursor: pointer;
    user-select: none;
  }
  .as-account-statement .as-table th .sort-icon { margin-left: 4px; opacity: 0.4; font-style: normal; }
  .as-account-statement .as-table th.sorted .sort-icon { opacity: 1; }
  .as-account-statement .as-table td {
    padding: 11px 16px;
    border-bottom: 1px solid var(--surface2);
    vertical-align: middle;
    white-space: nowrap;
  }
  .as-account-statement .as-table tbody tr:hover { background: var(--surface2); }
  .as-account-statement .as-table tbody tr.initial-row {
    background: #faf7ee;
    font-style: italic;
  }
  .as-account-statement .cell-num { font-variant-numeric: tabular-nums; text-align: right; }
  .as-account-statement .cell-credit { color: var(--credit); font-weight: 500; }
  .as-account-statement .cell-debit  { color: var(--debit);  font-weight: 500; }
  .as-account-statement .cell-balance { color: var(--balance); font-weight: 600; }
  .as-account-statement .cell-ref {
    font-size: 0.72rem;
    background: var(--surface2);
    border-radius: 2px;
    padding: 2px 7px;
    display: inline-block;
  }
  .as-account-statement .cell-initial-badge {
    font-size: 0.65rem;
    background: var(--ink);
    color: #f5f2eb;
    border-radius: 2px;
    padding: 2px 7px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .as-account-statement .as-pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-top: 1px solid var(--border);
    font-size: 0.72rem;
    color: var(--muted);
    flex-wrap: wrap;
    gap: 10px;
  }
  .as-account-statement .as-page-btns { display: flex; gap: 4px; }
  .as-account-statement .as-page-btn {
    background: none;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--ink);
    cursor: pointer;
    font-family: var(--mono);
    font-size: 0.72rem;
    min-width: 30px;
    padding: 4px 8px;
  }
  .as-account-statement .as-page-btn:hover:not(:disabled) { background: var(--ink); color: #f5f2eb; border-color: var(--ink); }
  .as-account-statement .as-page-btn.cur { background: var(--ink); color: #f5f2eb; border-color: var(--ink); }
  .as-account-statement .as-page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
  .as-account-statement .as-empty {
    text-align: center;
    padding: 60px 20px;
    color: var(--muted);
    font-size: 0.8rem;
  }
  .as-account-statement .as-placeholder {
    text-align: center;
    padding: 48px 20px;
    color: var(--muted);
    font-size: 0.82rem;
    background: var(--surface);
    border: 1px dashed var(--border);
    border-radius: var(--radius);
  }
  @media print {
    .as-account-statement .as-toolbar,
    .as-account-statement .as-pagination,
    .as-account-statement .as-filter { display: none !important; }
  }
`;

function fmt(n, decimals = 2) {
    return Number(n).toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}

function fmtDate(d) {
    if (!d) return "";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const PAGE_SIZE_OPTIONS = [10, 25, 50];
const TYPE_OPTIONS = [
    { value: "0", label: "All" },
    { value: "1", label: "Debit" },
    { value: "2", label: "Credit" },
];

export default function AccountStatement() {
    const canView = permissionsBypassed() || hasAccountStatementAccess(authStore.getPermissions());

    const [accounts, setAccounts] = useState([]);
    const [accountId, setAccountId] = useState("");
    const [type, setType] = useState("0");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [decimal, setDecimal] = useState(2);

    const [statement, setStatement] = useState(null);
    const [formLoading, setFormLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const [search, setSearch] = useState("");
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [sortCol, setSortCol] = useState(0);
    const [sortDir, setSortDir] = useState("desc");

    const loadForm = useCallback(async () => {
        setFormLoading(true);
        setLoadError("");
        try {
            const res = await api.get("account-statement");
            const data = res.data || {};
            const list = data.accounts || [];
            setAccounts(list);
            setStartDate(data.default_start_date || "");
            setEndDate(data.default_end_date || "");
            if (data.decimal != null) setDecimal(data.decimal);
            if (list.length > 0) {
                setAccountId(String(list[0].id));
            }
        } catch (err) {
            setLoadError(err?.message || "Failed to load account statement form.");
        } finally {
            setFormLoading(false);
        }
    }, []);

    const generateStatement = useCallback(async (override = {}) => {
        const payload = {
            account_id: override.account_id ?? accountId,
            type: override.type ?? type,
            start_date: override.start_date ?? startDate,
            end_date: override.end_date ?? endDate,
        };
        if (!payload.account_id || !payload.start_date || !payload.end_date) return;

        setLoading(true);
        setLoadError("");
        setSubmitted(true);
        setPage(1);
        try {
            const res = await api.post("account-statement", payload);
            setStatement(res.data || null);
            if (res.data?.decimal != null) setDecimal(res.data.decimal);
        } catch (err) {
            setStatement(null);
            setLoadError(err?.message || "Failed to generate account statement.");
        } finally {
            setLoading(false);
        }
    }, [accountId, type, startDate, endDate]);

    useEffect(() => {
        if (canView) loadForm();
        else setFormLoading(false);
    }, [canView, loadForm]);

    const account = statement?.account;
    const rawRows = statement?.data || [];

    const allRows = useMemo(() => rawRows.map((r, i) => ({
        idx: i + 1,
        date: r.date_raw || r.date,
        ref: r.reference_no,
        related: r.related_transaction,
        credit: r.credit_raw ?? 0,
        debit: r.debit_raw ?? 0,
        balance: r.balance_raw ?? 0,
        isInitial: Boolean(r.is_initial),
    })), [rawRows]);

    const totalCredit = statement?.total_credit ?? allRows.filter((r) => !r.isInitial).reduce((s, r) => s + r.credit, 0);
    const totalDebit = statement?.total_debit ?? allRows.filter((r) => !r.isInitial).reduce((s, r) => s + r.debit, 0);
    const finalBalance = statement?.balance_tracker
        ?? allRows.filter((r) => !r.isInitial).at(0)?.balance
        ?? statement?.initial_balance
        ?? 0;

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        if (!q) return allRows;
        return allRows.filter((r) =>
            String(r.date).includes(q)
            || String(r.ref).toLowerCase().includes(q)
            || String(r.related).toLowerCase().includes(q)
        );
    }, [allRows, search]);

    const sorted = useMemo(() => [...filtered].sort((a, b) => {
        let av;
        let bv;
        if (sortCol === 0) { av = a.date; bv = b.date; }
        else if (sortCol === 1) { av = a.ref; bv = b.ref; }
        else if (sortCol === 2) { av = a.related; bv = b.related; }
        else if (sortCol === 3) { av = a.credit; bv = b.credit; }
        else if (sortCol === 4) { av = a.debit; bv = b.debit; }
        else { av = a.balance; bv = b.balance; }
        if (av < bv) return sortDir === "asc" ? -1 : 1;
        if (av > bv) return sortDir === "asc" ? 1 : -1;
        return 0;
    }), [filtered, sortCol, sortDir]);

    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const pageRows = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

    const handleSort = (col) => {
        if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        else { setSortCol(col); setSortDir("asc"); }
        setPage(1);
    };

    const handleExportCSV = () => {
        const headers = ["#", "Date", "Reference No", "Related Transaction", "Credit", "Debit", "Balance"];
        const rows = sorted.map((r) => [
            r.idx, r.date, r.ref, r.related,
            r.credit.toFixed(decimal), r.debit.toFixed(decimal), r.balance.toFixed(decimal),
        ]);
        const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
        const a = document.createElement("a");
        a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
        a.download = `account-statement-${account?.account_no || "export"}.csv`;
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
            if (i === 1 || i === totalPages || (i >= safePage - delta && i <= safePage + delta)) {
                nums.push(i);
            } else if (nums[nums.length - 1] !== "...") {
                nums.push("...");
            }
        }
        return nums;
    };

    if (!canView) {
        return (
            <PageLayout eyebrow="Accounting" title="Account Statement">
                <p className="text-muted">You do not have permission to view account statements.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout
            eyebrow="Accounting"
            title="Account Statement"
            actions={statement ? (
                <>
                    <button type="button" className="ui-btn" onClick={handleExportCSV}>Export CSV</button>
                    <button type="button" className="ui-btn" onClick={() => window.print()}>Print</button>
                </>
            ) : null}
        >
            <style>{css}</style>
            <div className="as-account-statement">

                {loadError && <div className="as-error">{loadError}</div>}

                <form
                    className="as-filter"
                    onSubmit={(e) => {
                        e.preventDefault();
                        generateStatement();
                    }}
                >
                    <div>
                        <label htmlFor="as-account">Account *</label>
                        <select
                            id="as-account"
                            value={accountId}
                            onChange={(e) => setAccountId(e.target.value)}
                            disabled={formLoading}
                            required
                        >
                            <option value="">Select account</option>
                            {accounts.map((a) => (
                                <option key={a.id} value={a.id}>{a.label || a.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="as-type">Type</label>
                        <select
                            id="as-type"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            disabled={formLoading}
                        >
                            {TYPE_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="as-start">Start date *</label>
                        <input
                            id="as-start"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            disabled={formLoading}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="as-end">End date *</label>
                        <input
                            id="as-end"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            disabled={formLoading}
                            required
                        />
                    </div>
                    <div className="as-filter-actions">
                        <button type="submit" className="ui-btn ui-btn-primary" disabled={formLoading || loading}>
                            {loading ? "Generating…" : "Generate"}
                        </button>
                    </div>
                </form>

                {loading && !statement && (
                    <div className="as-placeholder">Loading statement…</div>
                )}

                {!loading && submitted && statement && (
                    <>
                        {account && (
                            <div className="as-account-tag">
                                {account.name} <span>|</span> {account.account_no}
                            </div>
                        )}

                        <div className="as-summary">
                            <div className="as-card credit">
                                <div className="as-card-label">Total Credit</div>
                                <div className="as-card-value">{fmt(totalCredit, decimal)}</div>
                            </div>
                            <div className="as-card debit">
                                <div className="as-card-label">Total Debit</div>
                                <div className="as-card-value">{fmt(totalDebit, decimal)}</div>
                            </div>
                            <div className="as-card balance">
                                <div className="as-card-label">Current Balance</div>
                                <div className="as-card-value">{fmt(finalBalance, decimal)}</div>
                            </div>
                        </div>

                        <div className="as-toolbar">
                            <input
                                className="as-search"
                                placeholder="Search by date, reference, transaction…"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            />
                            <select
                                className="as-select"
                                value={pageSize}
                                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                            >
                                {PAGE_SIZE_OPTIONS.map((n) => (
                                    <option key={n} value={n}>{n} per page</option>
                                ))}
                                <option value={9999}>All</option>
                            </select>
                        </div>

                        <div className="as-table-wrap">
                            <table className="as-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: 48 }}>#</th>
                                        {[["Date", 0], ["Reference No", 1], ["Related Transaction", 2], ["Credit", 3], ["Debit", 4], ["Balance", 5]].map(([label, col]) => (
                                            <th
                                                key={col}
                                                className={sortCol === col ? "sorted" : ""}
                                                onClick={() => handleSort(col)}
                                            >
                                                {label}{sortIcon(col)}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {pageRows.length === 0 ? (
                                        <tr>
                                            <td colSpan={7}>
                                                <div className="as-empty">No records found for this period</div>
                                            </td>
                                        </tr>
                                    ) : pageRows.map((r, i) => (
                                        <tr key={`${r.idx}-${i}`} className={r.isInitial ? "initial-row" : ""}>
                                            <td className="cell-num" style={{ color: "var(--muted)", fontSize: "0.7rem" }}>{r.idx}</td>
                                            <td>{fmtDate(r.date)}</td>
                                            <td>
                                                {r.isInitial
                                                    ? <span className="cell-initial-badge">Initial Balance</span>
                                                    : <span className="cell-ref">{r.ref}</span>}
                                            </td>
                                            <td style={{ color: r.isInitial ? "var(--muted)" : "var(--ink)" }}>{r.related}</td>
                                            <td className="cell-num cell-credit">
                                                {r.credit > 0 ? fmt(r.credit, decimal) : <span style={{ color: "var(--muted)" }}>—</span>}
                                            </td>
                                            <td className="cell-num cell-debit">
                                                {r.debit > 0 ? fmt(r.debit, decimal) : <span style={{ color: "var(--muted)" }}>—</span>}
                                            </td>
                                            <td className="cell-num cell-balance">{fmt(r.balance, decimal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="as-pagination">
                                <span>
                                    Showing {sorted.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, sorted.length)} of {sorted.length} records
                                </span>
                                <div className="as-page-btns">
                                    <button type="button" className="as-page-btn" disabled={safePage === 1} onClick={() => setPage((p) => p - 1)}>‹</button>
                                    {pageNums().map((n, i) => (
                                        n === "..." ? (
                                            <span key={i} style={{ padding: "4px 4px", fontSize: "0.72rem", color: "var(--muted)" }}>…</span>
                                        ) : (
                                            <button
                                                key={i}
                                                type="button"
                                                className={`as-page-btn${n === safePage ? " cur" : ""}`}
                                                onClick={() => setPage(n)}
                                            >
                                                {n}
                                            </button>
                                        )
                                    ))}
                                    <button type="button" className="as-page-btn" disabled={safePage === totalPages} onClick={() => setPage((p) => p + 1)}>›</button>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {!loading && !submitted && !formLoading && (
                    <div className="as-placeholder">Select filters and click Generate to view the statement.</div>
                )}
            </div>
        </PageLayout>
    );
}
