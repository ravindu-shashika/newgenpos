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

const STOCK_STATUS_OPTIONS = [
    { value: '', label: 'All' },
    { value: 'in_stock', label: 'In Stock' },
    { value: 'low_stock', label: 'Low Stock' },
    { value: 'out_stock', label: 'Out of Stock' },
];

function canViewStockReport() {
    if (permissionsBypassed()) return true;
    return authStore.getPermissions()?.includes('stock-report') ?? false;
}

function formatDateTime(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds} ${ampm}`;
}

export default function BackendReportStockReport() {
    const { toast, showToast } = useToast();
    const canView = canViewStockReport();

    const [warehouses, setWarehouses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [warehouseId, setWarehouseId] = useState('0');
    const [categoryId, setCategoryId] = useState('0');
    const [stockStatus, setStockStatus] = useState('');

    const [rows, setRows] = useState([]);
    const [footer, setFooter] = useState(null);
    const [totalRows, setTotalRows] = useState(0);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [formLoading, setFormLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState('');

    const warehouseOptions = useMemo(() => [
        { value: '0', label: 'All Warehouse' },
        ...warehouses.map((warehouse) => ({
            value: String(warehouse.id),
            label: warehouse.name,
        })),
    ], [warehouses]);

    const categoryOptions = useMemo(() => [
        { value: '0', label: 'Select Category' },
        ...categories.map((category) => ({
            value: String(category.id),
            label: category.name,
        })),
    ], [categories]);

    const fetchRows = useCallback(async (params) => {
        if (!params.start_date || !params.end_date) return;

        setLoading(true);
        setLoadError('');
        try {
            const res = await api.post('report/stock-data', {
                draw: params.page,
                start: params.page_size === -1 ? 0 : (params.page - 1) * params.page_size,
                length: params.page_size,
                search: { value: params.search },
                start_date: params.start_date,
                end_date: params.end_date,
                warehouse_id: Number(params.warehouse_id) || 0,
                category_id: Number(params.category_id) || 0,
                stock_status: params.stock_status || '',
            });

            const data = res.data ?? {};
            const nextRows = (data.data ?? []).map((row, index) => ({
                ...row,
                id: `${row.code ?? 'row'}-${row.warehouse ?? ''}-${index}`,
            }));
            setRows(nextRows);
            setFooter(data.footer ?? null);
            setTotalRows(Number(data.recordsFiltered ?? data.recordsTotal ?? nextRows.length));
        } catch (err) {
            setRows([]);
            setFooter(null);
            setTotalRows(0);
            const message = err?.message || 'Failed to load stock report.';
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
                const res = await api.get('report/stock');
                const data = res.data ?? {};
                setWarehouses(Array.isArray(data.warehouses) ? data.warehouses : []);
                setCategories(Array.isArray(data.categories) ? data.categories : []);
                setStartDate(data.start_date || '');
                setEndDate(data.end_date || '');
                setWarehouseId(String(data.warehouse_id ?? '0'));
                setCategoryId(String(data.category_id ?? '0'));
                setStockStatus(data.stock_status ?? '');
            } catch (err) {
                const message = err?.message || 'Failed to load stock report form.';
                setLoadError(message);
                showToast(message, 'error');
            } finally {
                setFormLoading(false);
            }
        };

        load();
    }, [canView, showToast]);

    useEffect(() => {
        if (formLoading || !startDate || !endDate) return;
        fetchRows({
            page,
            page_size: pageSize,
            search,
            start_date: startDate,
            end_date: endDate,
            warehouse_id: warehouseId,
            category_id: categoryId,
            stock_status: stockStatus,
        });
    }, [
        page,
        pageSize,
        search,
        startDate,
        endDate,
        warehouseId,
        categoryId,
        stockStatus,
        formLoading,
        fetchRows,
    ]);

    const totalPages = pageSize === -1
        ? 1
        : Math.max(1, Math.ceil(totalRows / pageSize) || 1);

    const handleExportCsv = () => {
        const headers = [
            'Date',
            'Code',
            'Product',
            'Variant',
            'Category',
            'Warehouse',
            'Cost',
            'Price',
            'Stock',
            'Stock Cost',
            'Stock Price',
            'Profit',
        ];

        const csvRows = rows.map((row) => [
            formatDateTime(row.date),
            row.code ?? '',
            row.name ?? '',
            row.variant ?? '',
            row.category ?? '',
            row.warehouse ?? '',
            row.cost ?? '',
            row.price ?? '',
            row.qty ?? '',
            row.stock_cost ?? '',
            row.stock_price ?? '',
            row.profit ?? '',
        ]);

        const csv = [headers, ...csvRows]
            .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const link = document.createElement('a');
        link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
        link.download = 'stock-report.csv';
        link.click();
    };

    const columns = useMemo(() => [
        {
            key: 'date',
            label: 'Date',
            render: (row) => formatDateTime(row.date),
        },
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Product' },
        { key: 'variant', label: 'Variant' },
        { key: 'category', label: 'Category' },
        { key: 'warehouse', label: 'Warehouse' },
        { key: 'cost', label: 'Cost', align: 'right' },
        { key: 'price', label: 'Price', align: 'right' },
        { key: 'qty', label: 'Stock', align: 'right' },
        { key: 'stock_cost', label: 'Cost', align: 'right' },
        { key: 'stock_price', label: 'Price', align: 'right' },
        { key: 'profit', label: 'Profit', align: 'right' },
    ], []);

    if (!canView) {
        return (
            <PageLayout title="Stock Report">
                <p className="text-muted">You do not have permission to view this report.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout
            title="Stock Report"
            actions={(
                <button
                    type="button"
                    className="ui-btn secondary"
                    onClick={handleExportCsv}
                    disabled={loading || rows.length === 0}
                >
                    Export CSV
                </button>
            )}
        >
            <Toast toast={toast} />

            <div className="ui-card mb-3" style={{ padding: '20px 24px' }}>
                {formLoading ? (
                    <p className="text-muted mb-0">Loading filters…</p>
                ) : (
                    <FormRow>
                        <FormField label="Start Date">
                            <TextInput
                                type="date"
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </FormField>
                        <FormField label="End Date">
                            <TextInput
                                type="date"
                                value={endDate}
                                onChange={(e) => {
                                    setEndDate(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </FormField>
                        <FormField label="Warehouse">
                            <SelectInput
                                value={warehouseId}
                                onChange={(e) => {
                                    setWarehouseId(e.target.value);
                                    setPage(1);
                                }}
                                options={warehouseOptions}
                            />
                        </FormField>
                        <FormField label="Category">
                            <SelectInput
                                value={categoryId}
                                onChange={(e) => {
                                    setCategoryId(e.target.value);
                                    setPage(1);
                                }}
                                options={categoryOptions}
                            />
                        </FormField>
                        <FormField label="Status">
                            <SelectInput
                                value={stockStatus}
                                onChange={(e) => {
                                    setStockStatus(e.target.value);
                                    setPage(1);
                                }}
                                options={STOCK_STATUS_OPTIONS}
                            />
                        </FormField>
                    </FormRow>
                )}
            </div>

            <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
                <div style={{ width: 280, marginLeft: 'auto' }}>
                    <TextInput
                        placeholder="Search product name or code…"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
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
                rows={rows}
                rowKey="id"
                loading={loading}
                emptyText="No stock records found for the selected filters."
                footer={footer ? (
                    <>
                        <td colSpan={8} style={{ textAlign: 'right', fontWeight: 600 }}>Total:</td>
                        <td className="cell-num">{footer.total_qty ?? '0.00'}</td>
                        <td className="cell-num">{footer.total_cost_value ?? '0.00'}</td>
                        <td className="cell-num">{footer.total_price_value ?? '0.00'}</td>
                        <td className="cell-num">{footer.total_profit ?? '0.00'}</td>
                    </>
                ) : null}
            />

            {!loading && totalRows > 0 && (
                <Pagination
                    page={page}
                    totalPages={totalPages}
                    pageSize={pageSize === -1 ? totalRows || 10 : pageSize}
                    totalRows={totalRows}
                    onChange={setPage}
                    pageSizes={[10, 25, 50, 100, -1]}
                    onPageSize={(nextSize) => {
                        setPageSize(nextSize);
                        setPage(1);
                    }}
                />
            )}
        </PageLayout>
    );
}
