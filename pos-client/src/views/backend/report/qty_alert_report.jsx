import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    PageLayout,
    FormField,
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

function canViewQtyAlertReport() {
    if (permissionsBypassed()) return true;
    return authStore.getPermissions()?.includes('product-qty-alert') ?? false;
}

function productImageUrl(image) {
    const serverBase = (api.defaultPath || '').replace(/\/api\/?$/, '') || 'http://127.0.0.1:8000';
    if (!image) return `${serverBase}/images/zummXD2dvAtI.png`;
    if (image === 'zummXD2dvAtI.png') return `${serverBase}/images/zummXD2dvAtI.png`;
    return `${serverBase}/images/product/${image}`;
}

export default function BackendReportQtyAlertReport() {
    const { toast, showToast } = useToast();
    const [canView, setCanView] = useState(canViewQtyAlertReport);

    const [warehouses, setWarehouses] = useState([]);
    const [warehouseId, setWarehouseId] = useState('0');
    const [allRows, setAllRows] = useState([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selected, setSelected] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    useEffect(() => authStore.subscribe(() => setCanView(canViewQtyAlertReport())), []);

    const fetchReport = useCallback(async (nextWarehouseId = '0') => {
        if (!canView) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setLoadError('');
        try {
            const res = await api.get('report/product_quantity_alert', {
                params: { warehouse_id: nextWarehouseId },
            });
            const data = res.data ?? {};
            setWarehouses(Array.isArray(data.warehouses) ? data.warehouses : []);
            setWarehouseId(String(data.warehouse_id ?? nextWarehouseId ?? 0));
            setAllRows(Array.isArray(data.rows) ? data.rows : []);
            setPage(1);
            setSelected(new Set());
        } catch (err) {
            setAllRows([]);
            const message = err?.message || 'Failed to load quantity alert report.';
            setLoadError(message);
            showToast(message, 'error');
        } finally {
            setLoading(false);
        }
    }, [canView, showToast]);

    useEffect(() => {
        if (canView) fetchReport('0');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canView]);

    const warehouseOptions = useMemo(() => [
        { value: '0', label: 'All Warehouse' },
        ...warehouses.map((w) => ({ value: String(w.id), label: w.name })),
    ], [warehouses]);

    const handleWarehouseChange = (e) => {
        const nextId = e.target.value;
        setWarehouseId(nextId);
        fetchReport(nextId);
    };

    const filteredRows = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return allRows;
        return allRows.filter((row) => [
            row.name,
            row.code,
            row.qty,
            row.alert_quantity,
        ].some((value) => String(value ?? '').toLowerCase().includes(term)));
    }, [allRows, search]);

    const pageRows = useMemo(() => {
        if (pageSize === -1) return filteredRows;
        const start = (page - 1) * pageSize;
        return filteredRows.slice(start, start + pageSize);
    }, [filteredRows, page, pageSize]);

    const columns = useMemo(() => [
        {
            key: 'image',
            label: 'Image',
            render: (row) => (
                <img
                    src={productImageUrl(row.image)}
                    alt={row.name || 'Product'}
                    height={80}
                    width={80}
                    style={{ objectFit: 'cover', borderRadius: 4 }}
                    onError={(e) => {
                        e.currentTarget.src = productImageUrl('');
                    }}
                />
            ),
        },
        { key: 'name', label: 'Product Name' },
        { key: 'code', label: 'Product Code' },
        { key: 'qty', label: 'Quantity', align: 'right' },
        { key: 'alert_quantity', label: 'Alert Quantity', align: 'right' },
    ], []);

    if (!canView) {
        return (
            <PageLayout title="Product Quantity Alert">
                <p className="text-muted">You do not have permission to view this report.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout title="Product Quantity Alert">
            <Toast toast={toast} />

            <div className="ui-card mb-3" style={{ padding: '20px 24px' }}>
                <FormField label="Warehouse">
                    <SelectInput
                        value={warehouseId}
                        onChange={handleWarehouseChange}
                        options={warehouseOptions}
                        disabled={loading}
                    />
                </FormField>
            </div>

            <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
                <div style={{ width: 280, marginLeft: 'auto' }}>
                    <TextInput
                        placeholder="Search…"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
            </div>

            {loadError && (
                <div className="ui-card mb-3" style={{ padding: '12px 16px' }}>
                    <p className="mb-0 text-warning" style={{ fontSize: '0.9rem' }}>{loadError}</p>
                </div>
            )}

            <DataTable
                columns={columns}
                rows={pageRows}
                rowKey="id"
                loading={loading}
                emptyText="No low-stock products found."
                selected={selected}
                onToggleRow={(id) => setSelected((prev) => {
                    const next = new Set(prev);
                    if (next.has(id)) next.delete(id); else next.add(id);
                    return next;
                })}
                onToggleAll={() => {
                    if (selected.size === pageRows.length && pageRows.length) setSelected(new Set());
                    else setSelected(new Set(pageRows.map((r) => r.id)));
                }}
            />

            {!loading && filteredRows.length > 0 && (
                <Pagination
                    page={page}
                    totalPages={pageSize === -1 ? 1 : Math.max(1, Math.ceil(filteredRows.length / pageSize))}
                    pageSize={pageSize === -1 ? filteredRows.length || 10 : pageSize}
                    totalRows={filteredRows.length}
                    onChange={setPage}
                    pageSizes={[10, 25, 50, -1]}
                    onPageSize={(s) => { setPageSize(s); setPage(1); }}
                />
            )}
        </PageLayout>
    );
}
