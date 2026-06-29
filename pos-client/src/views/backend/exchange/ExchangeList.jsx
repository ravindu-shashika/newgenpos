import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    PageLayout,
    DataTable,
    TextInput,
    SelectInput,
    Toast,
    useToast,
    ActionMenu,
    Pagination,
    FormField,
    Modal,
} from '../../../components/ui';
import { api } from '../../../services';
import authStore from '../../../stores/authStore';
import usePermissions from '../../../stores/usePermissions';

const PAGE_SIZES = [10, 25, 50, -1];

const basePath =
    import.meta.env.VITE_APP_DEFAULT_PATH ||
    import.meta.env.VITE_API_URL ||
    'http://127.0.0.1:8000';

function hasExchangeAccess(permissions) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.some(
        (p) =>
            p === 'exchange-index' ||
            p === 'exchange-view' ||
            p.startsWith('exchange-')
    );
}

function ProductTable({ title, products, badgeClass }) {
    if (!products?.length) return null;

    return (
        <div className="mb-3">
            <h6 className="mb-2">
                {title}
                {' '}
                <span className={`badge ${badgeClass}`}>{products.length}</span>
            </h6>
            <div className="table-responsive">
                <table className="table table-bordered table-sm">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Product</th>
                            <th>Batch</th>
                            <th>Qty</th>
                            <th>Unit Price</th>
                            <th>Tax</th>
                            <th>Discount</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((p, i) => (
                            <tr key={`${title}-${i}`}>
                                <td>{i + 1}</td>
                                <td>{p.name_code || p.name}</td>
                                <td>{p.batch_no}</td>
                                <td>{p.qty} {p.unit_code}</td>
                                <td>{p.unit_price}</td>
                                <td>{p.tax} ({p.tax_rate}%)</td>
                                <td>{p.discount}</td>
                                <td>{p.subtotal}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default function ExchangeList({ controllerName }) {
    const { toast, showToast } = useToast();
    const perms = usePermissions(controllerName || 'exchange');
    const authPerms = authStore.getPermissions();
    const canView = perms.canView || hasExchangeAccess(authPerms);
    const canAdd = perms.canAdd || authPerms.includes('exchange-add');

    const [rows, setRows] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [showWarehouseFilter, setShowWarehouseFilter] = useState(true);
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [openMenu, setOpenMenu] = useState(null);
    const [refModalOpen, setRefModalOpen] = useState(false);
    const [saleRef, setSaleRef] = useState('');
    const [viewId, setViewId] = useState(null);
    const [viewData, setViewData] = useState(null);
    const [viewLoading, setViewLoading] = useState(false);

    const today = new Date().toISOString().slice(0, 10);
    const yearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const [startingDate, setStartingDate] = useState(yearAgo);
    const [endingDate, setEndingDate] = useState(today);
    const [warehouseId, setWarehouseId] = useState('0');

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const q = new URLSearchParams({
                starting_date: startingDate,
                ending_date: endingDate,
                warehouse_id: warehouseId,
                search,
            });
            const res = await api.get(`exchange?${q}`);
            setRows(res.data?.data || []);
            if (res.data?.warehouses?.length) {
                setWarehouses(res.data.warehouses);
            }
            if (typeof res.data?.show_warehouse_filter === 'boolean') {
                setShowWarehouseFilter(res.data.show_warehouse_filter);
            }
        } catch (err) {
            showToast(err?.message || 'Failed to load sale exchanges.', 'error');
        } finally {
            setLoading(false);
        }
    }, [startingDate, endingDate, warehouseId, search, showToast]);

    useEffect(() => {
        if (canView) fetchList();
        else setLoading(false);
    }, [canView, fetchList]);

    const paginated = useMemo(() => {
        if (pageSize === -1) return rows;
        const start = (page - 1) * pageSize;
        return rows.slice(start, start + pageSize);
    }, [rows, page, pageSize]);

    const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(rows.length / pageSize) || 1);

    const openView = async (id) => {
        setViewId(id);
        setViewLoading(true);
        setViewData(null);
        try {
            const res = await api.get(`exchange/${id}`);
            setViewData(res.data || {});
        } catch (err) {
            showToast(err?.message || 'Failed to load exchange details.', 'error');
            setViewId(null);
        } finally {
            setViewLoading(false);
        }
    };

    const startCreate = () => {
        const ref = saleRef.trim();
        if (!ref) {
            showToast('Sale reference is required.', 'error');
            return;
        }
        setRefModalOpen(false);
        window.open(
            `${basePath}/exchange/create?reference_no=${encodeURIComponent(ref)}`,
            '_blank',
            'noopener,noreferrer'
        );
    };

    const warehouseOptions = [
        { value: '0', label: 'All warehouses' },
        ...warehouses.map((w) => ({ value: String(w.id), label: w.name })),
    ];

    const columns = [
        { label: 'Date', key: 'date', sortable: true },
        { label: 'Reference', key: 'reference_no', sortable: true },
        { label: 'Sale reference', key: 'sale_reference' },
        { label: 'Warehouse', key: 'warehouse_name' },
        { label: 'Biller', key: 'biller_name' },
        { label: 'Customer', key: 'customer_name' },
        {
            label: 'Payment type',
            key: 'payment_type_label',
            render: (row) => (
                <span className={`badge ${row.payment_type === 'pay' ? 'badge-danger' : 'badge-success'}`}>
                    {row.payment_type_label}
                </span>
            ),
        },
        { label: 'Amount', key: 'amount', align: 'right' },
        {
            label: 'Action',
            key: 'action',
            render: (row) => {
                const items = [
                    canView && {
                        label: '👁 View',
                        onClick: () => openView(row.id),
                    },
                ].filter(Boolean);

                if (!items.length) return '—';

                return (
                    <ActionMenu
                        id={row.id}
                        openId={openMenu}
                        setOpenId={setOpenMenu}
                        items={items}
                    />
                );
            },
        },
    ];

    const ex = viewData?.exchange;
    const totals = viewData?.totals;

    if (!canView) {
        return (
            <PageLayout eyebrow="Sale" title="Sale Exchange List">
                <p className="text-muted">You do not have permission to view sale exchanges.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout eyebrow="Sale" title="Sale Exchange List">
            <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
                {canAdd && (
                    <button
                        type="button"
                        className="ui-btn primary"
                        onClick={() => setRefModalOpen(true)}
                    >
                        <i className="fa fa-plus" /> Add exchange
                    </button>
                )}
            </div>

            <div className="ui-form-grid two mb-3">
                <FormField label="From">
                    <input
                        type="date"
                        className="ui-input"
                        value={startingDate}
                        onChange={(e) => { setStartingDate(e.target.value); setPage(1); }}
                    />
                </FormField>
                <FormField label="To">
                    <input
                        type="date"
                        className="ui-input"
                        value={endingDate}
                        onChange={(e) => { setEndingDate(e.target.value); setPage(1); }}
                    />
                </FormField>
                {showWarehouseFilter && (
                    <FormField label="Warehouse">
                        <SelectInput
                            value={warehouseId}
                            onChange={(e) => { setWarehouseId(e.target.value); setPage(1); }}
                            options={warehouseOptions}
                        />
                    </FormField>
                )}
                <FormField label="Search">
                    <TextInput
                        placeholder="Reference, customer, biller, sale…"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </FormField>
            </div>

            <DataTable
                columns={columns}
                rows={paginated}
                loading={loading}
                emptyText="No sale exchanges found."
            />

            <Pagination
                page={page}
                totalPages={totalPages}
                pageSize={pageSize === -1 ? rows.length || 10 : pageSize}
                totalRows={rows.length}
                onChange={setPage}
                pageSizes={PAGE_SIZES}
                onPageSize={(s) => { setPageSize(s); setPage(1); }}
            />

            <Modal isOpen={refModalOpen} onClose={() => setRefModalOpen(false)} title="Add Sale Exchange">
                <FormField label="Sale reference *">
                    <TextInput
                        value={saleRef}
                        onChange={(e) => setSaleRef(e.target.value)}
                        placeholder="Enter original sale reference no"
                    />
                </FormField>
                <div className="d-flex gap-2 mt-3">
                    <button type="button" className="ui-btn primary" onClick={startCreate}>Continue</button>
                    <button type="button" className="ui-btn" onClick={() => setRefModalOpen(false)}>Cancel</button>
                </div>
            </Modal>

            <Modal
                isOpen={!!viewId}
                onClose={() => { setViewId(null); setViewData(null); }}
                title="Exchange Details"
                size="lg"
            >
                {viewLoading && <p>Loading…</p>}
                {!viewLoading && ex && (
                    <>
                        <p className="small mb-3">
                            <strong>Date:</strong> {ex.date}<br />
                            <strong>Reference:</strong> {ex.reference_no}<br />
                            <strong>Sale Reference:</strong> {ex.sale_reference}<br />
                            <strong>Payment Type:</strong> {ex.payment_type_label}
                            {ex.document && (
                                <>
                                    <br />
                                    <strong>Document:</strong>{' '}
                                    <a href={`${basePath}/documents/exchange/${ex.document}`} target="_blank" rel="noreferrer">Download</a>
                                </>
                            )}
                        </p>
                        <div className="row small mb-3">
                            <div className="col-md-6">
                                <strong>Biller</strong><br />
                                {ex.biller_name}<br />
                                {ex.biller_company}<br />
                                {ex.biller_email}<br />
                                {ex.biller_phone}<br />
                                {ex.biller_address}{ex.biller_city ? `, ${ex.biller_city}` : ''}
                            </div>
                            <div className="col-md-6">
                                <strong>Customer</strong><br />
                                {ex.customer_name}<br />
                                {ex.customer_phone}<br />
                                {ex.customer_address}{ex.customer_city ? `, ${ex.customer_city}` : ''}
                            </div>
                        </div>

                        <ProductTable title="Returned Products" products={viewData.returned} badgeClass="badge-danger" />
                        <ProductTable title="New Products" products={viewData.new} badgeClass="badge-success" />

                        {totals && (
                            <div className="table-responsive">
                                <table className="table table-bordered table-sm">
                                    <tbody>
                                        <tr>
                                            <td className="text-end"><strong>Returned total</strong></td>
                                            <td>{totals.returned}</td>
                                            <td className="text-end"><strong>New total</strong></td>
                                            <td>{totals.new}</td>
                                        </tr>
                                        <tr>
                                            <td className="text-end"><strong>Tax</strong></td>
                                            <td>{totals.tax}</td>
                                            <td className="text-end"><strong>Discount</strong></td>
                                            <td>{totals.discount}</td>
                                        </tr>
                                        <tr>
                                            <td className="text-end"><strong>Order tax</strong></td>
                                            <td>{totals.order_tax} ({totals.order_tax_rate}%)</td>
                                            <td className="text-end"><strong>Grand total</strong></td>
                                            <td>{totals.grand_total}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {ex.exchange_note && <p className="small"><strong>Exchange Note:</strong> {ex.exchange_note}</p>}
                        {ex.staff_note && <p className="small"><strong>Staff Note:</strong> {ex.staff_note}</p>}
                    </>
                )}
            </Modal>

            <Toast toast={toast} />
        </PageLayout>
    );
}
