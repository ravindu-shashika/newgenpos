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
import { formatMoney, parseFormattedNumber } from './reportHelpers.jsx';

function canViewSupplierDueReport() {
    if (permissionsBypassed()) return true;
    return authStore.getPermissions()?.includes('supplier-due-report') ?? false;
}

export default function BackendReportSupplierDueReport() {
    const { toast, showToast } = useToast();
    const [canView, setCanView] = useState(canViewSupplierDueReport);

    const [suppliers, setSuppliers] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [supplierId, setSupplierId] = useState('');
    const [decimal, setDecimal] = useState(2);

    const [rows, setRows] = useState([]);
    const [totalRows, setTotalRows] = useState(0);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selected, setSelected] = useState(new Set());
    const [formLoading, setFormLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState('');

    useEffect(() => authStore.subscribe(() => setCanView(canViewSupplierDueReport())), []);

    const supplierOptions = useMemo(() => [
        { value: '', label: 'All Suppliers' },
        ...suppliers.map((s) => ({ value: String(s.id), label: s.label || s.name })),
    ], [suppliers]);

    useEffect(() => {
        if (!canView) { setFormLoading(false); return; }
        const load = async () => {
            setFormLoading(true);
            try {
                const res = await api.get('report/supplier-due-report');
                const data = res.data ?? {};
                setSuppliers(Array.isArray(data.suppliers) ? data.suppliers : []);
                setStartDate(data.start_date || '');
                setEndDate(data.end_date || '');
                setSupplierId(data.supplier_id !== '' && data.supplier_id != null ? String(data.supplier_id) : '');
                setDecimal(Number(data.decimal ?? 2));
            } catch (err) {
                showToast(err?.message || 'Failed to load supplier due report.', 'error');
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
            const payload = {
                draw: page,
                start: pageSize === -1 ? 0 : (page - 1) * pageSize,
                length: pageSize === -1 ? -1 : pageSize,
                search: { value: search },
                order: [{ column: 1, dir: 'desc' }],
                start_date: startDate,
                end_date: endDate,
            };
            if (supplierId) payload.supplier_id = supplierId;

            const res = await api.post('report/supplier-due-report-data', payload);
            const data = res.data ?? {};
            setRows((data.data ?? []).map((row, index) => ({
                ...row,
                id: row.id ?? `due-${row.key ?? index}-${index}`,
            })));
            setTotalRows(Number(data.recordsFiltered ?? data.recordsTotal ?? 0));
            setSelected(new Set());
        } catch (err) {
            setRows([]);
            setTotalRows(0);
            setLoadError(err?.message || 'Failed to load supplier due report data.');
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate, supplierId, formLoading, page, pageSize, search]);

    useEffect(() => { setPage(1); }, [startDate, endDate, supplierId]);
    useEffect(() => { fetchRows(); }, [fetchRows]);

    const totalsSource = useMemo(() => (
        selected.size ? rows.filter((row) => selected.has(row.id)) : rows
    ), [rows, selected]);

    const sumField = (key) => totalsSource.reduce((t, row) => t + parseFormattedNumber(row[key]), 0);

    const columns = useMemo(() => [
        { key: 'date', label: 'Date' },
        { key: 'reference_no', label: 'Reference' },
        { key: 'supplier', label: 'Supplier Details' },
        { key: 'grand_total', label: 'Grand Total', align: 'right' },
        { key: 'returned_amount', label: 'Returned Amount', align: 'right' },
        { key: 'paid', label: 'Paid', align: 'right' },
        { key: 'due', label: 'Due', align: 'right' },
    ], []);

    const handleExportCsv = () => {
        const headers = ['Date', 'Reference', 'Supplier', 'Grand Total', 'Returned Amount', 'Paid', 'Due'];
        const exportRows = rows.map((row) => [
            row.date ?? '',
            row.reference_no ?? '',
            row.supplier ?? '',
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
        link.download = 'supplier-due-report.csv';
        link.click();
    };

    if (!canView) {
        return (
            <PageLayout title="Supplier Due Report">
                <p className="text-muted">You do not have permission to view this report.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout
            title="Supplier Due Report"
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
                        <FormField label="Supplier">
                            <SelectInput value={supplierId} onChange={(e) => setSupplierId(e.target.value)} options={supplierOptions} />
                        </FormField>
                    </FormRow>
                )}
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
                emptyText="No due purchases found for the selected filters."
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
