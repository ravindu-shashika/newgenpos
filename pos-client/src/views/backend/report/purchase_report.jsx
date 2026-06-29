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
import { formatMoney, sumRows, HtmlCell } from './reportHelpers.jsx';

function canViewPurchaseReport() {
    if (permissionsBypassed()) return true;
    return authStore.getPermissions()?.includes('purchase-report') ?? false;
}

export default function BackendReportPurchaseReport() {
    const { toast, showToast } = useToast();
    const [canView, setCanView] = useState(canViewPurchaseReport);

    const [warehouses, setWarehouses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [warehouseId, setWarehouseId] = useState('0');
    const [categoryId, setCategoryId] = useState('0');
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

    useEffect(() => authStore.subscribe(() => setCanView(canViewPurchaseReport())), []);

    const warehouseOptions = useMemo(() => [
        { value: '0', label: 'All Warehouse' },
        ...warehouses.map((w) => ({ value: String(w.id), label: w.name })),
    ], [warehouses]);

    const categoryOptions = useMemo(() => [
        { value: '0', label: 'All Category' },
        ...categories.map((c) => ({ value: String(c.id), label: c.name })),
    ], [categories]);

    const fetchRows = useCallback(async (params) => {
        if (!params.start_date || !params.end_date) return;
        setLoading(true);
        setLoadError('');
        try {
            const res = await api.post('report/purchase_report_data', {
                draw: params.page,
                start: (params.page - 1) * params.page_size,
                length: params.page_size,
                search: { value: params.search },
                order: [{ column: 1, dir: 'desc' }],
                start_date: params.start_date,
                end_date: params.end_date,
                warehouse_id: params.warehouse_id,
                category_id: params.category_id,
            });
            const data = res.data ?? {};
            const nextRows = (data.data ?? []).map((row, index) => ({
                ...row,
                id: `${row.key ?? index}-${index}`,
            }));
            setRows(nextRows);
            setTotalRows(Number(data.recordsFiltered ?? data.recordsTotal ?? nextRows.length));
            setSelected(new Set());
        } catch (err) {
            setRows([]);
            setTotalRows(0);
            const message = err?.message || 'Failed to load purchase report.';
            setLoadError(message);
            showToast(message, 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        if (!canView) {
            setFormLoading(false);
            return;
        }
        const load = async () => {
            setFormLoading(true);
            try {
                const res = await api.get('report/purchase');
                const data = res.data ?? {};
                setWarehouses(Array.isArray(data.warehouses) ? data.warehouses : []);
                setCategories(Array.isArray(data.categories) ? data.categories : []);
                setStartDate(data.start_date || '');
                setEndDate(data.end_date || '');
                setWarehouseId(String(data.warehouse_id ?? '0'));
                setCategoryId(String(data.category_id ?? '0'));
                setDecimal(Number(data.decimal ?? 2));
            } catch (err) {
                showToast(err?.message || 'Failed to load purchase report form.', 'error');
            } finally {
                setFormLoading(false);
            }
        };
        load();
    }, [canView, showToast]);

    useEffect(() => {
        if (!startDate || !endDate || formLoading) return;
        fetchRows({
            page, page_size: pageSize, search,
            start_date: startDate, end_date: endDate,
            warehouse_id: warehouseId, category_id: categoryId,
        });
    }, [page, pageSize, search, startDate, endDate, warehouseId, categoryId, formLoading, fetchRows]);

    const totalsSource = useMemo(() => {
        if (selected.size === 0) return rows;
        return rows.filter((row) => selected.has(row.id));
    }, [rows, selected]);

    const totals = useMemo(() => ({
        purchased_amount: sumRows(totalsSource, 'purchased_amount'),
        purchased_qty: sumRows(totalsSource, 'purchased_qty'),
        in_stock: sumRows(totalsSource, 'in_stock'),
    }), [totalsSource]);

    const columns = useMemo(() => [
        { key: 'name', label: 'Product Name', render: (row) => <HtmlCell html={row.name} /> },
        { key: 'category', label: 'Category' },
        { key: 'purchased_amount', label: 'Purchased Amount', align: 'right', render: (r) => formatMoney(r.purchased_amount, decimal) },
        { key: 'purchased_qty', label: 'Purchased Qty', align: 'right', render: (r) => formatMoney(r.purchased_qty, decimal) },
        { key: 'in_stock', label: 'In Stock', align: 'right', render: (r) => formatMoney(r.in_stock, decimal) },
    ], [decimal]);

    const handleExportCsv = () => {
        const headers = ['Product Name', 'Category', 'Purchased Amount', 'Purchased Qty', 'In Stock'];
        const exportRows = (selected.size ? totalsSource : rows).map((row) => [
            String(row.name || '').replace(/<br\s*\/?>/gi, ' '),
            row.category ?? '', row.purchased_amount ?? 0, row.purchased_qty ?? 0, row.in_stock ?? 0,
        ]);
        const csv = [headers, ...exportRows]
            .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');
        const link = document.createElement('a');
        link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
        link.download = 'purchase-report.csv';
        link.click();
    };

    if (!canView) {
        return (
            <PageLayout title="Purchase Report">
                <p className="text-muted">You do not have permission to view this report.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout
            title="Purchase Report"
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
                            <TextInput type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} />
                        </FormField>
                        <FormField label="End Date">
                            <TextInput type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} />
                        </FormField>
                        <FormField label="Warehouse">
                            <SelectInput value={warehouseId} onChange={(e) => { setWarehouseId(e.target.value); setPage(1); }} options={warehouseOptions} />
                        </FormField>
                        <FormField label="Category">
                            <SelectInput value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }} options={categoryOptions} />
                        </FormField>
                    </FormRow>
                )}
            </div>
            <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
                <div style={{ width: 280, marginLeft: 'auto' }}>
                    <TextInput placeholder="Search products…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
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
                emptyText="No purchased products found for the selected filters."
                selected={selected}
                onToggleRow={(id) => setSelected((prev) => {
                    const next = new Set(prev);
                    if (next.has(id)) next.delete(id); else next.add(id);
                    return next;
                })}
                onToggleAll={() => {
                    if (selected.size === rows.length && rows.length > 0) setSelected(new Set());
                    else setSelected(new Set(rows.map((row) => row.id)));
                }}
                footer={(
                    <>
                        <td />
                        <td>Total</td>
                        <td />
                        <td className="cell-num">{formatMoney(totals.purchased_amount, decimal)}</td>
                        <td className="cell-num">{formatMoney(totals.purchased_qty, decimal)}</td>
                        <td className="cell-num">{formatMoney(totals.in_stock, decimal)}</td>
                    </>
                )}
            />
            {!loading && totalRows > 0 && (
                <Pagination
                    page={page}
                    totalPages={Math.max(1, Math.ceil(totalRows / pageSize) || 1)}
                    pageSize={pageSize}
                    totalRows={totalRows}
                    onChange={setPage}
                    pageSizes={[10, 25, 50, 100, 500]}
                    onPageSize={(s) => { setPageSize(s); setPage(1); }}
                />
            )}
        </PageLayout>
    );
}
