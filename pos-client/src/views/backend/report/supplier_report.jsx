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

const TABS = [
    { id: 'purchase', label: 'Purchase', endpoint: 'report/supplier-purchase-data' },
    { id: 'payment', label: 'Payment', endpoint: 'report/supplier-payment-data' },
    { id: 'return', label: 'Return', endpoint: 'report/supplier-return-data' },
    { id: 'quotation', label: 'Quotation', endpoint: 'report/supplier-quotation-data' },
];

function canViewSupplierReport() {
    if (permissionsBypassed()) return true;
    return authStore.getPermissions()?.includes('supplier-report') ?? false;
}

function TabTable({ tab, filters, decimal }) {
    const [rows, setRows] = useState([]);
    const [totalRows, setTotalRows] = useState(0);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selected, setSelected] = useState(new Set());
    const [loading, setLoading] = useState(false);

    const fetchRows = useCallback(async () => {
        if (!filters.ready) return;
        setLoading(true);
        try {
            const res = await api.post(tab.endpoint, {
                draw: page,
                start: pageSize === -1 ? 0 : (page - 1) * pageSize,
                length: pageSize === -1 ? -1 : pageSize,
                search: { value: search },
                order: [{ column: 1, dir: 'desc' }],
                start_date: filters.start_date,
                end_date: filters.end_date,
                supplier_id: filters.supplier_id,
            });
            const data = res.data ?? {};
            setRows((data.data ?? []).map((row, index) => ({
                ...row,
                id: row.id ?? `${tab.id}-${row.key ?? index}-${index}`,
            })));
            setTotalRows(Number(data.recordsFiltered ?? data.recordsTotal ?? 0));
            setSelected(new Set());
        } catch {
            setRows([]);
            setTotalRows(0);
        } finally {
            setLoading(false);
        }
    }, [tab.endpoint, tab.id, filters, page, pageSize, search]);

    useEffect(() => { setPage(1); }, [filters.start_date, filters.end_date, filters.supplier_id]);
    useEffect(() => { fetchRows(); }, [fetchRows]);

    const totalsSource = useMemo(() => (
        selected.size ? rows.filter((row) => selected.has(row.id)) : rows
    ), [rows, selected]);

    const sumField = (key) => totalsSource.reduce((t, row) => t + parseFormattedNumber(row[key]), 0);

    const columns = useMemo(() => {
        if (tab.id === 'purchase') {
            return [
                { key: 'date', label: 'Date' },
                { key: 'reference_no', label: 'Reference' },
                { key: 'warehouse', label: 'Warehouse' },
                { key: 'product', label: 'Product (Qty)', render: (r) => <HtmlCell html={r.product} /> },
                { key: 'grand_total', label: 'Grand Total', align: 'right' },
                { key: 'paid', label: 'Paid', align: 'right' },
                { key: 'balance', label: 'Balance', align: 'right' },
                { key: 'status', label: 'Status', render: (r) => <HtmlCell html={r.status} /> },
            ];
        }
        if (tab.id === 'payment') {
            return [
                { key: 'date', label: 'Date' },
                { key: 'reference_no', label: 'Payment Reference' },
                { key: 'purchase_reference', label: 'Purchase Reference' },
                { key: 'amount', label: 'Amount', align: 'right' },
                { key: 'paying_method', label: 'Paid Method' },
            ];
        }
        if (tab.id === 'quotation') {
            return [
                { key: 'date', label: 'Date' },
                { key: 'reference_no', label: 'Reference' },
                { key: 'warehouse', label: 'Warehouse' },
                { key: 'customer', label: 'Customer' },
                { key: 'product', label: 'Product (Qty)', render: (r) => <HtmlCell html={r.product} /> },
                { key: 'grand_total', label: 'Grand Total', align: 'right' },
                { key: 'status', label: 'Status', render: (r) => <HtmlCell html={r.status} /> },
            ];
        }
        return [
            { key: 'date', label: 'Date' },
            { key: 'reference_no', label: 'Reference' },
            { key: 'warehouse', label: 'Warehouse' },
            { key: 'product', label: 'Product (Qty)', render: (r) => <HtmlCell html={r.product} /> },
            { key: 'grand_total', label: 'Grand Total', align: 'right' },
        ];
    }, [tab.id]);

    const footer = useMemo(() => {
        if (tab.id === 'purchase') {
            return (
                <>
                    <td /><td>Total</td><td /><td />
                    <td className="cell-num">{formatMoney(sumField('grand_total'), decimal)}</td>
                    <td className="cell-num">{formatMoney(sumField('paid'), decimal)}</td>
                    <td className="cell-num">{formatMoney(sumField('balance'), decimal)}</td>
                    <td />
                </>
            );
        }
        if (tab.id === 'payment') {
            return (
                <>
                    <td /><td>Total</td><td /><td />
                    <td className="cell-num">{formatMoney(sumField('amount'), decimal)}</td>
                    <td />
                </>
            );
        }
        if (tab.id === 'quotation') {
            return (
                <>
                    <td /><td>Total</td><td /><td /><td /><td />
                    <td className="cell-num">{formatMoney(sumField('grand_total'), decimal)}</td>
                    <td />
                </>
            );
        }
        if (tab.id === 'return') {
            return (
                <>
                    <td /><td>Total</td><td /><td /><td />
                    <td className="cell-num">{formatMoney(sumField('grand_total'), decimal)}</td>
                </>
            );
        }
        return null;
    }, [tab.id, totalsSource, decimal]);

    return (
        <div>
            <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
                <div style={{ width: 280, marginLeft: 'auto' }}>
                    <TextInput placeholder="Search…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                </div>
            </div>
            <DataTable
                columns={columns}
                rows={rows}
                rowKey="id"
                loading={loading}
                emptyText="No records found."
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
                footer={<><td />{footer}</>}
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
        </div>
    );
}

export default function BackendReportSupplierReport() {
    const { toast, showToast } = useToast();
    const [canView, setCanView] = useState(canViewSupplierReport);
    const [activeTab, setActiveTab] = useState('purchase');
    const [suppliers, setSuppliers] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [supplierId, setSupplierId] = useState('');
    const [decimal, setDecimal] = useState(2);
    const [formLoading, setFormLoading] = useState(true);

    useEffect(() => authStore.subscribe(() => setCanView(canViewSupplierReport())), []);

    useEffect(() => {
        if (!canView) { setFormLoading(false); return; }
        const load = async () => {
            setFormLoading(true);
            try {
                const res = await api.get('report/supplier');
                const data = res.data ?? {};
                setSuppliers(Array.isArray(data.suppliers) ? data.suppliers : []);
                setStartDate(data.start_date || '');
                setEndDate(data.end_date || '');
                setSupplierId(String(data.supplier_id ?? ''));
                setDecimal(Number(data.decimal ?? 2));
            } catch (err) {
                showToast(err?.message || 'Failed to load supplier report.', 'error');
            } finally {
                setFormLoading(false);
            }
        };
        load();
    }, [canView, showToast]);

    const supplierOptions = useMemo(() => suppliers.map((s) => ({
        value: String(s.id),
        label: s.label || s.name,
    })), [suppliers]);

    const filters = useMemo(() => ({
        ready: !formLoading && startDate && endDate && supplierId,
        start_date: startDate,
        end_date: endDate,
        supplier_id: supplierId,
    }), [formLoading, startDate, endDate, supplierId]);

    if (!canView) {
        return (
            <PageLayout title="Supplier Report">
                <p className="text-muted">You do not have permission to view this report.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout title="Supplier Report">
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
            <ul className="nav nav-tabs mb-3">
                {TABS.map((tab) => (
                    <li className="nav-item" key={tab.id}>
                        <button
                            type="button"
                            className={`nav-link${activeTab === tab.id ? ' active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    </li>
                ))}
            </ul>
            {TABS.filter((tab) => tab.id === activeTab).map((tab) => (
                <TabTable key={tab.id} tab={tab} filters={filters} decimal={decimal} />
            ))}
        </PageLayout>
    );
}
