import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    PageLayout,
    FormField,
    FormRow,
    SelectInput,
    TextInput,
    DataTable,
    Pagination,
    Toast,
    useToast,
} from '../../../components/ui';
import { api } from '../../../services';
import authStore from '../../../stores/authStore';
import { permissionsBypassed } from '../../../config/permissions';
import { formatMoney, parseFormattedNumber, HtmlCell } from './reportHelpers.jsx';

function canViewDueReport() {
    if (permissionsBypassed()) return true;
    return authStore.getPermissions()?.includes('due-report') ?? false;
}

function SummaryCard({ label, value, color, icon }) {
    return (
        <div className="col-sm-6 col-lg-3 mb-3">
            <div className="ui-card" style={{ padding: '20px 16px', position: 'relative' }}>
                <div className="d-flex align-items-center gap-3">
                    <div style={{ fontSize: '1.75rem', color }}>{icon}</div>
                    <div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{value}</div>
                        <strong style={{ color, fontSize: '0.85rem' }}>{label}</strong>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function BackendReportDueReport() {
    const { toast, showToast } = useToast();
    const [canView, setCanView] = useState(canViewDueReport);

    const [customers, setCustomers] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [customerId, setCustomerId] = useState('0');
    const [decimal, setDecimal] = useState(2);

    const [rows, setRows] = useState([]);
    const [totalRows, setTotalRows] = useState(0);
    const [summary, setSummary] = useState({
        total_grand: '0.00',
        total_returned: '0.00',
        total_paid: '0.00',
        total_due: '0.00',
    });
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selected, setSelected] = useState(new Set());
    const [formLoading, setFormLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState('');

    useEffect(() => authStore.subscribe(() => setCanView(canViewDueReport())), []);

    const customerOptions = useMemo(() => [
        { value: '0', label: 'All Customer' },
        ...customers.map((c) => ({ value: String(c.id), label: c.label || c.name })),
    ], [customers]);

    useEffect(() => {
        if (!canView) { setFormLoading(false); return; }
        const load = async () => {
            setFormLoading(true);
            try {
                const res = await api.get('report/customer-due-report');
                const data = res.data ?? {};
                setCustomers(Array.isArray(data.customers) ? data.customers : []);
                setStartDate(data.start_date || '');
                setEndDate(data.end_date || '');
                setCustomerId(String(data.customer_id ?? '0'));
                setDecimal(Number(data.decimal ?? 2));
            } catch (err) {
                showToast(err?.message || 'Failed to load due report.', 'error');
            } finally {
                setFormLoading(false);
            }
        };
        load();
    }, [canView, showToast]);

    const fetchRows = useCallback(async () => {
        if (!startDate || !endDate || formLoading) return;
        setLoading(true);
        setLoadError('');
        try {
            const res = await api.post('report/customer-due-report-data', {
                draw: page,
                start: pageSize === -1 ? 0 : (page - 1) * pageSize,
                length: pageSize === -1 ? -1 : pageSize,
                search: { value: search },
                order: [{ column: 1, dir: 'desc' }],
                start_date: startDate,
                end_date: endDate,
                customer_id: customerId,
            });
            const data = res.data ?? {};
            setRows((data.data ?? []).map((row, index) => ({
                ...row,
                id: row.id ?? `due-${row.key ?? index}-${index}`,
            })));
            setTotalRows(Number(data.recordsFiltered ?? data.recordsTotal ?? 0));
            setSummary({
                total_grand: data.total_grand ?? '0.00',
                total_returned: data.total_returned ?? '0.00',
                total_paid: data.total_paid ?? '0.00',
                total_due: data.total_due ?? '0.00',
            });
            setSelected(new Set());
        } catch (err) {
            setRows([]);
            setTotalRows(0);
            setLoadError(err?.message || 'Failed to load due report data.');
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate, customerId, formLoading, page, pageSize, search]);

    useEffect(() => { setPage(1); }, [startDate, endDate, customerId]);
    useEffect(() => { fetchRows(); }, [fetchRows]);

    const totalsSource = useMemo(() => (
        selected.size ? rows.filter((row) => selected.has(row.id)) : rows
    ), [rows, selected]);

    const sumField = (key) => totalsSource.reduce((t, row) => t + parseFormattedNumber(row[key]), 0);

    const columns = useMemo(() => [
        { key: 'date', label: 'Date' },
        { key: 'reference_no', label: 'Reference' },
        { key: 'customer', label: 'Customer Details', render: (r) => <HtmlCell html={r.customer} /> },
        { key: 'grand_total', label: 'Grand Total', align: 'right' },
        { key: 'returned_amount', label: 'Returned Amount', align: 'right' },
        { key: 'paid', label: 'Paid', align: 'right' },
        { key: 'due', label: 'Due', align: 'right' },
    ], []);

    const handleExportCsv = () => {
        const headers = ['Date', 'Reference', 'Customer', 'Grand Total', 'Returned Amount', 'Paid', 'Due'];
        const exportRows = rows.map((row) => [
            row.date ?? '',
            row.reference_no ?? '',
            String(row.customer || '').replace(/<[^>]+>/g, ' '),
            parseFormattedNumber(row.grand_total),
            parseFormattedNumber(row.returned_amount),
            parseFormattedNumber(row.paid),
            parseFormattedNumber(row.due),
        ]);
        const csv = [headers, ...exportRows]
            .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');
        const link = document.createElement('a');
        link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
        link.download = 'customer-due-report.csv';
        link.click();
    };

    if (!canView) {
        return (
            <PageLayout title="Customer Due Report">
                <p className="text-muted">You do not have permission to view this report.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout
            title="Customer Due Report"
            actions={(
                <button type="button" className="ui-btn secondary" onClick={handleExportCsv} disabled={loading || rows.length === 0}>
                    Export CSV
                </button>
            )}
        >
            <Toast toast={toast} />
            <div className="ui-card mb-3" style={{ padding: '20px 24px' }}>
                {formLoading ? <p className="text-muted mb-0">Loading filters…</p> : (
                    <FormRow>
                        <FormField label="Start Date">
                            <TextInput type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </FormField>
                        <FormField label="End Date">
                            <TextInput type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </FormField>
                        <FormField label="Customer">
                            <SelectInput value={customerId} onChange={(e) => setCustomerId(e.target.value)} options={customerOptions} />
                        </FormField>
                    </FormRow>
                )}
            </div>

            <div className="row mb-3">
                <SummaryCard label="Grand Total" value={summary.total_grand} color="#733686" icon="📊" />
                <SummaryCard label="Returned Amount" value={summary.total_returned} color="#ff8952" icon="↩" />
                <SummaryCard label="Paid" value={summary.total_paid} color="#00c689" icon="✓" />
                <SummaryCard label="Due" value={summary.total_due} color="#0584a0" icon="📄" />
            </div>

            <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
                <div style={{ width: 280, marginLeft: 'auto' }}>
                    <TextInput placeholder="Search…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                </div>
            </div>

            {loadError && (
                <div className="ui-card mb-3" style={{ padding: '12px 16px' }}>
                    <p className="mb-0 text-warning" style={{ fontSize: '0.9rem' }}>{loadError}</p>
                </div>
            )}

            <DataTable
                columns={columns}
                rows={rows}
                rowKey="id"
                loading={loading}
                emptyText="No due sales found for the selected filters."
                selected={selected}
                onToggleRow={(id) => setSelected((prev) => {
                    const next = new Set(prev);
                    if (next.has(id)) next.delete(id); else next.add(id);
                    return next;
                })}
                onToggleAll={() => {
                    if (selected.size === rows.length && rows.length) setSelected(new Set());
                    else setSelected(new Set(rows.map((r) => r.id)));
                }}
                footer={(
                    <>
                        <td />
                        <td>Total:</td>
                        <td />
                        <td className="cell-num">{formatMoney(sumField('grand_total'), decimal)}</td>
                        <td className="cell-num">{formatMoney(sumField('returned_amount'), decimal)}</td>
                        <td className="cell-num">{formatMoney(sumField('paid'), decimal)}</td>
                        <td className="cell-num">{formatMoney(sumField('due'), decimal)}</td>
                    </>
                )}
            />

            {!loading && totalRows > 0 && (
                <Pagination
                    page={page}
                    totalPages={pageSize === -1 ? 1 : Math.max(1, Math.ceil(totalRows / pageSize))}
                    pageSize={pageSize === -1 ? totalRows || 10 : pageSize}
                    totalRows={totalRows}
                    onChange={setPage}
                    pageSizes={[10, 25, 50, -1]}
                    onPageSize={(s) => { setPageSize(s); setPage(1); }}
                />
            )}
        </PageLayout>
    );
}
