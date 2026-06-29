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

function canViewProductReport() {
    if (permissionsBypassed()) return true;
    return authStore.getPermissions()?.includes('product-report') ?? false;
}

function formatMoney(value, decimal = 2) {
    const n = Number(value);
    if (Number.isNaN(n)) return Number(0).toFixed(decimal);
    return n.toFixed(decimal);
}

function sumRows(rows, key) {
    return rows.reduce((total, row) => total + (Number(row[key]) || 0), 0);
}

function stockWorthTotals(rows) {
    let price = 0;
    let cost = 0;

    rows.forEach((row) => {
        const raw = String(row.stock_worth || '');
        const [pricePart, costPart] = raw.split('/').map((part) => part.trim());
        price += parseFloat(String(pricePart).replace(/[^\d.-]/g, '')) || 0;
        cost += parseFloat(String(costPart).replace(/[^\d.-]/g, '')) || 0;
    });

    return { price, cost };
}

function HtmlCell({ html }) {
    if (!html) return '—';
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

function ImeiCell({ value }) {
    if (!value || value === 'N/A') return 'N/A';
    return (
        <div
            style={{
                maxHeight: 100,
                overflowY: 'auto',
                wordBreak: 'break-word',
                whiteSpace: 'normal',
                width: 130,
            }}
        >
            <HtmlCell html={value} />
        </div>
    );
}

export default function BackendReportProductReport() {
    const { toast, showToast } = useToast();
    const canView = canViewProductReport();

    const [warehouses, setWarehouses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [warehouseId, setWarehouseId] = useState('0');
    const [categoryId, setCategoryId] = useState('0');
    const [decimal, setDecimal] = useState(2);
    const [showAdminColumns, setShowAdminColumns] = useState(false);

    const [rows, setRows] = useState([]);
    const [totalRows, setTotalRows] = useState(0);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selected, setSelected] = useState(new Set());
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
        { value: '0', label: 'All Category' },
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
            const res = await api.post('report/product_report_data', {
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
            const message = err?.message || 'Failed to load product report.';
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
                const res = await api.get('report/product_report');
                const data = res.data ?? {};
                setWarehouses(Array.isArray(data.warehouses) ? data.warehouses : []);
                setCategories(Array.isArray(data.categories) ? data.categories : []);
                setStartDate(data.start_date || '');
                setEndDate(data.end_date || '');
                setWarehouseId(String(data.warehouse_id ?? '0'));
                setCategoryId(String(data.category_id ?? '0'));
                setDecimal(Number(data.decimal ?? 2));
                setShowAdminColumns(Number(data.role_id ?? 99) < 3);
            } catch (err) {
                const message = err?.message || 'Failed to load product report form.';
                setLoadError(message);
                showToast(message, 'error');
            } finally {
                setFormLoading(false);
            }
        };

        load();
    }, [canView, showToast]);

    useEffect(() => {
        if (!startDate || !endDate || formLoading) return;
        fetchRows({
            page,
            page_size: pageSize,
            search,
            start_date: startDate,
            end_date: endDate,
            warehouse_id: warehouseId,
            category_id: categoryId,
        });
    }, [
        page,
        pageSize,
        search,
        startDate,
        endDate,
        warehouseId,
        categoryId,
        formLoading,
        fetchRows,
    ]);

    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize) || 1);

    const toggleRow = (id) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (selected.size === rows.length && rows.length > 0) {
            setSelected(new Set());
        } else {
            setSelected(new Set(rows.map((row) => row.id)));
        }
    };

    const totalsSource = useMemo(() => {
        if (selected.size === 0) return rows;
        return rows.filter((row) => selected.has(row.id));
    }, [rows, selected]);

    const totals = useMemo(() => {
        const stockTotals = stockWorthTotals(totalsSource);
        return {
            purchased_amount: sumRows(totalsSource, 'purchased_amount'),
            purchased_qty: sumRows(totalsSource, 'purchased_qty'),
            sold_amount: sumRows(totalsSource, 'sold_amount'),
            sold_qty: sumRows(totalsSource, 'sold_qty'),
            returned_amount: sumRows(totalsSource, 'returned_amount'),
            returned_qty: sumRows(totalsSource, 'returned_qty'),
            purchase_returned_amount: sumRows(totalsSource, 'purchase_returned_amount'),
            purchase_returned_qty: sumRows(totalsSource, 'purchase_returned_qty'),
            profit: sumRows(totalsSource, 'profit'),
            in_stock: sumRows(totalsSource, 'in_stock'),
            stock_worth: `${formatMoney(stockTotals.price, decimal)} / ${formatMoney(stockTotals.cost, decimal)}`,
        };
    }, [totalsSource, decimal]);

    const handleExportCsv = () => {
        const headers = ['Product', 'Category', 'IMEI Numbers'];
        if (showAdminColumns) {
            headers.push('Purchased Amount', 'Purchased Qty');
        }
        headers.push(
            'Sold Amount',
            'Sold Qty',
            'Returned Amount',
            'Returned Qty',
        );
        if (showAdminColumns) {
            headers.push('Purchase Returned Amount', 'Purchase Returned Qty');
        }
        headers.push('Profit', 'In Stock');
        if (showAdminColumns) {
            headers.push('Stock Worth (Price/Cost)');
        }

        const exportRows = (selected.size ? totalsSource : rows).map((row) => {
            const base = [
                String(row.name || '').replace(/<br\s*\/?>/gi, ' '),
                row.category ?? '',
                String(row.imei_numbers || '').replace(/<br\s*\/?>/gi, ' '),
            ];
            if (showAdminColumns) {
                base.push(row.purchased_amount ?? 0, row.purchased_qty ?? 0);
            }
            base.push(
                row.sold_amount ?? 0,
                row.sold_qty ?? 0,
                row.returned_amount ?? 0,
                row.returned_qty ?? 0,
            );
            if (showAdminColumns) {
                base.push(row.purchase_returned_amount ?? 0, row.purchase_returned_qty ?? 0);
            }
            base.push(row.profit ?? 0, row.in_stock ?? 0);
            if (showAdminColumns) {
                base.push(row.stock_worth ?? '');
            }
            return base;
        });

        const csv = [headers, ...exportRows]
            .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const link = document.createElement('a');
        link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
        link.download = 'product-report.csv';
        link.click();
    };

    const columns = useMemo(() => {
        const cols = [
            {
                key: 'name',
                label: 'Product',
                render: (row) => <HtmlCell html={row.name} />,
            },
            { key: 'category', label: 'Category' },
            {
                key: 'imei_numbers',
                label: 'IMEI Numbers',
                render: (row) => <ImeiCell value={row.imei_numbers} />,
            },
        ];

        if (showAdminColumns) {
            cols.push(
                {
                    key: 'purchased_amount',
                    label: 'Purchased Amount',
                    align: 'right',
                    render: (row) => formatMoney(row.purchased_amount, decimal),
                },
                {
                    key: 'purchased_qty',
                    label: 'Purchased Qty',
                    align: 'right',
                    render: (row) => formatMoney(row.purchased_qty, decimal),
                },
            );
        }

        cols.push(
            {
                key: 'sold_amount',
                label: 'Sold Amount',
                align: 'right',
                render: (row) => formatMoney(row.sold_amount, decimal),
            },
            {
                key: 'sold_qty',
                label: 'Sold Qty',
                align: 'right',
                render: (row) => formatMoney(row.sold_qty, decimal),
            },
            {
                key: 'returned_amount',
                label: 'Returned Amount',
                align: 'right',
                render: (row) => formatMoney(row.returned_amount, decimal),
            },
            {
                key: 'returned_qty',
                label: 'Returned Qty',
                align: 'right',
                render: (row) => formatMoney(row.returned_qty, decimal),
            },
        );

        if (showAdminColumns) {
            cols.push(
                {
                    key: 'purchase_returned_amount',
                    label: 'Purchase Returned Amount',
                    align: 'right',
                    render: (row) => formatMoney(row.purchase_returned_amount, decimal),
                },
                {
                    key: 'purchase_returned_qty',
                    label: 'Purchase Returned Qty',
                    align: 'right',
                    render: (row) => formatMoney(row.purchase_returned_qty, decimal),
                },
            );
        }

        cols.push(
            {
                key: 'profit',
                label: 'Profit',
                align: 'right',
                render: (row) => formatMoney(row.profit, decimal),
            },
            {
                key: 'in_stock',
                label: 'In Stock',
                align: 'right',
                render: (row) => formatMoney(row.in_stock, decimal),
            },
        );

        if (showAdminColumns) {
            cols.push({
                key: 'stock_worth',
                label: 'Stock Worth (Price/Cost)',
                render: (row) => row.stock_worth ?? '—',
            });
        }

        return cols;
    }, [showAdminColumns, decimal]);

    const footerCells = useMemo(() => {
        const cells = [
            <td key="f-product" />,
            <td key="f-category">Total</td>,
            <td key="f-imei" />,
        ];

        if (showAdminColumns) {
            cells.push(
                <td key="f-purch-amt" className="cell-num">{formatMoney(totals.purchased_amount, decimal)}</td>,
                <td key="f-purch-qty" className="cell-num">{formatMoney(totals.purchased_qty, decimal)}</td>,
            );
        }

        cells.push(
            <td key="f-sold-amt" className="cell-num">{formatMoney(totals.sold_amount, decimal)}</td>,
            <td key="f-sold-qty" className="cell-num">{formatMoney(totals.sold_qty, decimal)}</td>,
            <td key="f-ret-amt" className="cell-num">{formatMoney(totals.returned_amount, decimal)}</td>,
            <td key="f-ret-qty" className="cell-num">{formatMoney(totals.returned_qty, decimal)}</td>,
        );

        if (showAdminColumns) {
            cells.push(
                <td key="f-pr-amt" className="cell-num">{formatMoney(totals.purchase_returned_amount, decimal)}</td>,
                <td key="f-pr-qty" className="cell-num">{formatMoney(totals.purchase_returned_qty, decimal)}</td>,
            );
        }

        cells.push(
            <td key="f-profit" className="cell-num">{formatMoney(totals.profit, decimal)}</td>,
            <td key="f-stock" className="cell-num">{formatMoney(totals.in_stock, decimal)}</td>,
        );

        if (showAdminColumns) {
            cells.push(<td key="f-worth">{totals.stock_worth}</td>);
        }

        return cells;
    }, [showAdminColumns, totals, decimal]);

    if (!canView) {
        return (
            <PageLayout title="Product Report">
                <p className="text-muted">You do not have permission to view this report.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout
            title="Product Report"
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
                    </FormRow>
                )}
            </div>

            <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
                <div style={{ width: 280, marginLeft: 'auto' }}>
                    <TextInput
                        placeholder="Search products…"
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
                emptyText="No products found for the selected filters."
                selected={selected}
                onToggleRow={toggleRow}
                onToggleAll={toggleAll}
                footer={(
                    <>
                        <td />
                        {footerCells}
                    </>
                )}
            />

            {!loading && totalRows > 0 && (
                <Pagination
                    page={page}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    totalRows={totalRows}
                    onChange={setPage}
                    pageSizes={[10, 25, 50, 100, 500]}
                    onPageSize={(nextSize) => {
                        setPageSize(nextSize);
                        setPage(1);
                    }}
                />
            )}
        </PageLayout>
    );
}
