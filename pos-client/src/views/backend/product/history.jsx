import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    PageLayout,
    DataTable,
    TextInput,
    SelectInput,
    FormField,
    Pagination,
    useToast,
} from '../../../components/ui';
import { api } from '../../../services';
import authStore from '../../../stores/authStore';
import { permissionsBypassed } from '../../../config/permissions';

const TABS = [
    {
        id: 'sale',
        label: 'Sale',
        endpoint: 'products/sale-history-data',
        serverSide: true,
        totalKey: 'sub_total',
        columns: [
            { key: 'date', label: 'Date' },
            { key: 'reference_no', label: 'Reference' },
            { key: 'warehouse', label: 'Warehouse' },
            { key: 'customer', label: 'Customer' },
            { key: 'qty', label: 'Qty', align: 'right' },
            { key: 'unit_price', label: 'Unit Price', align: 'right' },
            { key: 'sub_total', label: 'Subtotal', align: 'right' },
        ],
    },
    {
        id: 'purchase',
        label: 'Purchase',
        endpoint: 'products/purchase-history-data',
        serverSide: true,
        totalKey: 'sub_total',
        columns: [
            { key: 'date', label: 'Date' },
            { key: 'reference_no', label: 'Reference' },
            { key: 'warehouse', label: 'Warehouse' },
            { key: 'supplier', label: 'Supplier' },
            { key: 'qty', label: 'Qty', align: 'right' },
            { key: 'unit_cost', label: 'Unit Price', align: 'right' },
            { key: 'sub_total', label: 'Subtotal', align: 'right' },
        ],
    },
    {
        id: 'sale-return',
        label: 'Sale Return',
        endpoint: 'products/sale-return-history-data',
        serverSide: true,
        totalKey: 'sub_total',
        columns: [
            { key: 'date', label: 'Date' },
            { key: 'reference_no', label: 'Reference' },
            { key: 'warehouse', label: 'Warehouse' },
            { key: 'customer', label: 'Customer' },
            { key: 'qty', label: 'Qty', align: 'right' },
            { key: 'unit_price', label: 'Unit Price', align: 'right' },
            { key: 'sub_total', label: 'Subtotal', align: 'right' },
        ],
    },
    {
        id: 'purchase-return',
        label: 'Purchase Return',
        endpoint: 'products/purchase-return-history-data',
        serverSide: true,
        totalKey: 'sub_total',
        columns: [
            { key: 'date', label: 'Date' },
            { key: 'reference_no', label: 'Reference' },
            { key: 'warehouse', label: 'Warehouse' },
            { key: 'supplier', label: 'Supplier' },
            { key: 'qty', label: 'Qty', align: 'right' },
            { key: 'unit_cost', label: 'Unit Price', align: 'right' },
            { key: 'sub_total', label: 'Subtotal', align: 'right' },
        ],
    },
    {
        id: 'adjustment',
        label: 'Adjustment',
        endpoint: 'products/adjustment-history-data',
        serverSide: false,
        columns: [
            { key: 'date', label: 'Date' },
            { key: 'reference', label: 'Reference' },
            { key: 'warehouse', label: 'Warehouse' },
            { key: 'qty', label: 'Qty', align: 'right' },
            { key: 'note', label: 'Note' },
        ],
    },
    {
        id: 'transfer',
        label: 'Transfer',
        endpoint: 'products/transfer-history-data',
        serverSide: false,
        columns: [
            { key: 'date', label: 'Date' },
            { key: 'reference', label: 'Reference' },
            { key: 'from', label: 'From' },
            { key: 'to', label: 'To' },
            { key: 'qty', label: 'Qty', align: 'right' },
        ],
    },
];

function hasPermission(name) {
    if (permissionsBypassed()) return true;
    const perms = authStore.getPermissions();
    return Array.isArray(perms) && perms.includes(name);
}

function defaultYearAgo() {
    return new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function todayIso() {
    return new Date().toISOString().slice(0, 10);
}

function sumNumericColumn(rows, key) {
    return rows.reduce((acc, row) => {
        const n = parseFloat(String(row[key] ?? '0').replace(/,/g, ''));
        return acc + (Number.isFinite(n) ? n : 0);
    }, 0);
}

function formatTotal(value) {
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function postHistoryData(endpoint, payload) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            formData.append(key, value);
        }
    });
    const res = await api.post(endpoint, formData);
    return res.data ?? {};
}

export default function BackendProductHistory() {
    const location = useLocation();
    const { showToast } = useToast();
    const productIdFromUrl = new URLSearchParams(location.search).get('product_id');
    const canView = hasPermission('product_history');

    const [metaLoading, setMetaLoading] = useState(true);
    const [metaError, setMetaError] = useState('');
    const [productId, setProductId] = useState(productIdFromUrl || '');
    const [product, setProduct] = useState(null);
    const [warehouses, setWarehouses] = useState([]);
    const [showWarehouseFilter, setShowWarehouseFilter] = useState(false);

    const [startingDate, setStartingDate] = useState(defaultYearAgo());
    const [endingDate, setEndingDate] = useState(todayIso());
    const [warehouseId, setWarehouseId] = useState('0');

    const [activeTab, setActiveTab] = useState('sale');
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [search, setSearch] = useState('');

    const activeConfig = useMemo(
        () => TABS.find((tab) => tab.id === activeTab) || TABS[0],
        [activeTab]
    );

    useEffect(() => {
        if (!canView) {
            setMetaLoading(false);
            return;
        }

        const loadMeta = async () => {
            setMetaLoading(true);
            setMetaError('');
            try {
                const q = new URLSearchParams();
                if (productIdFromUrl) q.set('product_id', productIdFromUrl);
                const res = await api.get(`products/history?${q}`);
                const data = res.data ?? {};

                setProductId(String(data.product_id ?? productIdFromUrl ?? ''));
                setProduct(data.product ?? null);
                setWarehouses(Array.isArray(data.warehouses) ? data.warehouses : []);
                setShowWarehouseFilter(Boolean(data.show_warehouse_filter));
                setStartingDate(data.starting_date || defaultYearAgo());
                setEndingDate(data.ending_date || todayIso());
                setWarehouseId(String(data.warehouse_id ?? '0'));
            } catch (err) {
                setMetaError(err?.message || 'Failed to load product history.');
                showToast(err?.message || 'Failed to load product history.', 'error');
            } finally {
                setMetaLoading(false);
            }
        };

        loadMeta();
    }, [canView, productIdFromUrl, showToast]);

    const fetchRows = useCallback(async () => {
        if (!canView || !productId) return;

        setLoading(true);
        try {
            const payload = {
                product_id: productId,
                starting_date: startingDate,
                ending_date: endingDate,
                warehouse_id: warehouseId,
                draw: 1,
            };

            if (activeConfig.serverSide) {
                payload.start = page * pageSize;
                payload.length = pageSize;
                payload['order[0][column]'] = 1;
                payload['order[0][dir]'] = 'desc';
                payload['search[value]'] = search;
            }

            const data = await postHistoryData(activeConfig.endpoint, payload);
            setRows(Array.isArray(data.data) ? data.data : []);
            setTotalRecords(Number(data.recordsFiltered ?? data.recordsTotal ?? data.data?.length ?? 0));
        } catch (err) {
            showToast(err?.message || 'Failed to load history data.', 'error');
            setRows([]);
            setTotalRecords(0);
        } finally {
            setLoading(false);
        }
    }, [
        canView,
        productId,
        startingDate,
        endingDate,
        warehouseId,
        activeConfig,
        page,
        pageSize,
        search,
        showToast,
    ]);

    useEffect(() => {
        const timeoutId = setTimeout(fetchRows, 300);
        return () => clearTimeout(timeoutId);
    }, [fetchRows]);

    useEffect(() => {
        setPage(0);
    }, [activeTab, startingDate, endingDate, warehouseId, search, pageSize]);

    const warehouseOptions = useMemo(
        () => [
            { value: '0', label: 'All Warehouse' },
            ...warehouses.map((w) => ({ value: String(w.id), label: w.name })),
        ],
        [warehouses]
    );

    const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize) || 1);
    const pageTotal = activeConfig.totalKey
        ? formatTotal(sumNumericColumn(rows, activeConfig.totalKey))
        : null;

    if (!canView) {
        return (
            <PageLayout title="Product History">
                <p className="text-muted">You do not have permission to view product history.</p>
                <Link to="/products" className="ui-btn secondary mt-3">
                    Back to Product List
                </Link>
            </PageLayout>
        );
    }

    if (metaLoading) {
        return (
            <PageLayout title="Product History">
                <p className="text-muted">Loading…</p>
            </PageLayout>
        );
    }

    if (metaError && !productId) {
        return (
            <PageLayout title="Product History">
                <p className="text-warning">{metaError}</p>
                <Link to="/products" className="ui-btn secondary mt-3">
                    Back to Product List
                </Link>
            </PageLayout>
        );
    }

    return (
        <PageLayout title="Product History">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <Link to="/products" className="ui-btn secondary sm">
                    ← Back to Product List
                </Link>
            </div>

            {product ? (
                <div className="ui-card mb-3" style={{ padding: '16px 20px' }}>
                    <h5 className="mb-0 text-center">
                        {product.name} [{product.code}]
                    </h5>
                </div>
            ) : (
                <p className="text-warning mb-3">
                    No product selected. Open history from the product list action menu.
                </p>
            )}

            {productId && (
                <>
                    <div className="ui-form-grid two mb-3">
                        <FormField label="From">
                            <TextInput
                                type="date"
                                value={startingDate}
                                onChange={(e) => setStartingDate(e.target.value)}
                            />
                        </FormField>
                        <FormField label="To">
                            <TextInput
                                type="date"
                                value={endingDate}
                                onChange={(e) => setEndingDate(e.target.value)}
                            />
                        </FormField>
                        {showWarehouseFilter && (
                            <FormField label="Warehouse">
                                <SelectInput
                                    value={warehouseId}
                                    onChange={(e) => setWarehouseId(e.target.value)}
                                    options={warehouseOptions}
                                />
                            </FormField>
                        )}
                        {activeConfig.serverSide && (
                            <FormField label="Search">
                                <TextInput
                                    placeholder="Reference or date…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </FormField>
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

                    <DataTable
                        columns={activeConfig.columns}
                        rows={rows}
                        rowKey="key"
                        loading={loading}
                        emptyText="No records found for this period."
                        footer={
                            pageTotal != null ? (
                                <>
                                    <td colSpan={activeConfig.columns.length - 1} style={{ fontWeight: 600 }}>
                                        Total (this page)
                                    </td>
                                    <td className="cell-num" style={{ fontWeight: 600 }}>
                                        {pageTotal}
                                    </td>
                                </>
                            ) : null
                        }
                    />

                    {activeConfig.serverSide && (
                        <Pagination
                            page={page + 1}
                            totalPages={totalPages}
                            pageSize={pageSize}
                            totalRows={totalRecords}
                            onChange={(nextPage) => setPage(nextPage - 1)}
                            pageSizes={[10, 25, 50, 100]}
                            onPageSize={(nextSize) => {
                                setPageSize(nextSize);
                                setPage(0);
                            }}
                        />
                    )}
                </>
            )}
        </PageLayout>
    );
}
