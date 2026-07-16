import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    PageLayout,
    DataTable,
    TextInput,
    TextareaInput,
    Toast,
    useToast,
    Modal,
    FormField,
    FormRow,
    SelectInput,
    Pagination,
} from '../../../components/ui';
import { api } from '../../../services';
import usePermissions from '../../../stores/usePermissions';

const PAGE_SIZES = [10, 25, 50, -1];

export default function StockCountList({ controllerName }) {
    const [rows, setRows] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [decimal, setDecimal] = useState(2);
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const { toast, showToast } = useToast();

    const [createOpen, setCreateOpen] = useState(false);
    const [finalizeOpen, setFinalizeOpen] = useState(null);
    const [reportOpen, setReportOpen] = useState(null);
    const [reportDiff, setReportDiff] = useState(null);
    const [reportLoading, setReportLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [createForm, setCreateForm] = useState({
        warehouse_id: '',
        count_scope: 'all',
    });
    const [finalizeForm, setFinalizeForm] = useState({ file: null, note: '' });

    const perms = usePermissions(controllerName || 'stock_count');
    const canAdd = perms.canAdd || perms.canView;

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('stock-count');
            setRows(res.data?.data || []);
            setWarehouses(res.data?.warehouses || []);
            setDecimal(res.data?.decimal ?? 2);
        } catch (err) {
            showToast(err?.message || 'Failed to load stock counts.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    const filtered = useMemo(() => {
        if (!search.trim()) return rows;
        const q = search.toLowerCase();
        return rows.filter((r) =>
            (r.reference_no || '').toLowerCase().includes(q) ||
            (r.warehouse_name || '').toLowerCase().includes(q) ||
            (r.count_scope_label || '').toLowerCase().includes(q)
        );
    }, [rows, search]);

    const paginated = useMemo(() => {
        if (pageSize === -1) return filtered;
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page, pageSize]);

    const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(filtered.length / pageSize) || 1);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!createForm.warehouse_id) {
            showToast('Warehouse is required.', 'error');
            return;
        }
        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append('warehouse_id', createForm.warehouse_id);
            fd.append('count_scope', createForm.count_scope || 'all');
            const res = await api.post('stock-count', fd);
            showToast(res.data?.message || 'Stock count created.', 'success');
            setCreateOpen(false);
            setCreateForm({ warehouse_id: '', count_scope: 'all' });
            fetchList();
            if (res.data?.initial_file_url) {
                window.open(res.data.initial_file_url, '_blank');
            }
        } catch (err) {
            showToast(err?.message || 'Failed to create stock count.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleFinalize = async (e) => {
        e.preventDefault();
        if (!finalizeForm.file) {
            showToast('Please upload a CSV file.', 'error');
            return;
        }
        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append('stock_count_id', String(finalizeOpen.id));
            fd.append('final_file', finalizeForm.file);
            fd.append('note', finalizeForm.note || '');
            await api.post('stock-count/finalize', fd);
            showToast('Stock count finalized successfully.', 'success');
            setFinalizeOpen(null);
            setFinalizeForm({ file: null, note: '' });
            fetchList();
        } catch (err) {
            showToast(err?.message || 'Failed to finalize stock count.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const openReport = async (row) => {
        setReportOpen(row);
        setReportDiff(null);
        setReportLoading(true);
        try {
            const res = await api.get(`stock-count/stockdif/${row.id}`);
            setReportDiff(res.data || {});
        } catch (err) {
            showToast(err?.message || 'Failed to load report.', 'error');
            setReportOpen(null);
        } finally {
            setReportLoading(false);
        }
    };

    const columns = [
        { label: 'Date', key: 'date' },
        { label: 'Reference', key: 'reference_no' },
        { label: 'Warehouse', key: 'warehouse_name' },
        {
            label: 'Scope',
            key: 'count_scope_label',
            render: (row) => row.count_scope_label || 'All products',
        },
        {
            label: 'Type',
            key: 'type_label',
            render: (row) => (
                <span className={`badge ${row.type === 'full' ? 'bg-primary' : 'bg-info'}`}>
                    {row.type_label}
                </span>
            ),
        },
        {
            label: 'Initial',
            key: 'initial_file',
            render: (row) =>
                row.initial_file_url ? (
                    <a href={row.initial_file_url} download title="Download initial file">⬇</a>
                ) : null,
        },
        {
            label: 'Final',
            key: 'final_file',
            render: (row) =>
                row.final_file_url ? (
                    <a href={row.final_file_url} download title="Download final file">⬇</a>
                ) : null,
        },
        {
            label: 'Action',
            key: 'action',
            render: (row) =>
                row.has_final_file ? (
                    <button
                        type="button"
                        className="ui-btn btn-sm"
                        style={{ background: '#28a745', color: '#fff' }}
                        onClick={() => openReport(row)}
                    >
                        Final Report
                    </button>
                ) : (
                    <button
                        type="button"
                        className="ui-btn primary btn-sm"
                        onClick={() => {
                            setFinalizeOpen(row);
                            setFinalizeForm({ file: null, note: '' });
                        }}
                    >
                        Finalize
                    </button>
                ),
        },
    ];

    return (
        <PageLayout eyebrow="Product" title="Stock Count">
            <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
                {canAdd && (
                    <button type="button" className="ui-btn primary" onClick={() => setCreateOpen(true)}>
                        Count Stock
                    </button>
                )}
                <div style={{ marginLeft: 'auto', width: 260 }}>
                    <TextInput
                        placeholder="Search reference, warehouse..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
            </div>

            <DataTable
                columns={columns}
                rows={paginated}
                loading={loading}
                emptyText="No stock counts found."
            />

            <Pagination
                page={page}
                totalPages={totalPages}
                pageSize={pageSize === -1 ? filtered.length || 10 : pageSize}
                totalRows={filtered.length}
                onChange={setPage}
                pageSizes={PAGE_SIZES}
                onPageSize={(s) => { setPageSize(s); setPage(1); }}
            />

            {createOpen && (
                <Modal title="Count Stock" onClose={() => setCreateOpen(false)}>
                    <form onSubmit={handleCreate}>
                        <p className="text-muted small">
                            Choose how products are collected into the count CSV.
                        </p>
                        <FormRow>
                            <FormField label="Warehouse" required>
                                <SelectInput
                                    required
                                    value={createForm.warehouse_id}
                                    onChange={(e) => setCreateForm({ ...createForm, warehouse_id: e.target.value })}
                                    options={[
                                        { value: '', label: 'Select warehouse...' },
                                        ...warehouses.map((w) => ({ value: String(w.id), label: w.name })),
                                    ]}
                                />
                            </FormField>
                            <FormField label="Count method" required>
                                <SelectInput
                                    required
                                    value={createForm.count_scope}
                                    onChange={(e) => setCreateForm({ ...createForm, count_scope: e.target.value })}
                                    options={[
                                        { value: 'all', label: 'All products (variants + batches + simple)' },
                                        { value: 'with_variants', label: 'Products with variants only' },
                                        { value: 'without_variants', label: 'Products without variants' },
                                        { value: 'batch', label: 'Batch-wise count only' },
                                    ]}
                                />
                            </FormField>
                        </FormRow>
                        <div className="border rounded p-2 mb-2 small text-muted">
                            {createForm.count_scope === 'with_variants' && (
                                <span>CSV includes one row per variant (item code).</span>
                            )}
                            {createForm.count_scope === 'without_variants' && (
                                <span>CSV includes simple products only (no variant / no batch lines).</span>
                            )}
                            {createForm.count_scope === 'batch' && (
                                <span>CSV includes one row per batch (batch no + expiry).</span>
                            )}
                            {createForm.count_scope === 'all' && (
                                <span>CSV includes every warehouse stock line: variants, batches, and simple products.</span>
                            )}
                        </div>
                        <div className="d-flex gap-2 mt-3">
                            <button type="submit" className="ui-btn primary" disabled={submitting}>
                                {submitting ? 'Saving...' : 'Submit'}
                            </button>
                            <button type="button" className="ui-btn" onClick={() => setCreateOpen(false)}>Cancel</button>
                        </div>
                    </form>
                </Modal>
            )}

            {finalizeOpen && (
                <Modal title="Finalize Stock Count" onClose={() => setFinalizeOpen(null)}>
                    <form onSubmit={handleFinalize}>
                        <p className="text-muted small">
                            Upload the initial CSV after filling the Counted column.
                        </p>
                        <FormField label="Upload CSV file" required>
                            <input
                                type="file"
                                accept=".csv"
                                className="ui-input"
                                required
                                onChange={(e) => setFinalizeForm({ ...finalizeForm, file: e.target.files?.[0] || null })}
                            />
                        </FormField>
                        <FormField label="Note">
                            <TextareaInput
                                rows={3}
                                value={finalizeForm.note}
                                onChange={(e) => setFinalizeForm({ ...finalizeForm, note: e.target.value })}
                            />
                        </FormField>
                        <div className="d-flex gap-2 mt-3">
                            <button type="submit" className="ui-btn primary" disabled={submitting}>
                                {submitting ? 'Saving...' : 'Submit'}
                            </button>
                            <button type="button" className="ui-btn" onClick={() => setFinalizeOpen(null)}>Cancel</button>
                        </div>
                    </form>
                </Modal>
            )}

            {reportOpen && (
                <Modal title="Stock Count Report" onClose={() => setReportOpen(null)}>
                    <div className="mb-3 small">
                        <div><strong>Date:</strong> {reportOpen.date}</div>
                        <div><strong>Reference:</strong> {reportOpen.reference_no}</div>
                        <div><strong>Warehouse:</strong> {reportOpen.warehouse_name}</div>
                        <div><strong>Type:</strong> {reportOpen.type_label}</div>
                        <div><strong>Scope:</strong> {reportOpen.count_scope_label || 'All products'}</div>
                        <div className="mt-2 d-flex gap-2">
                            {reportOpen.initial_file_url && (
                                <a href={reportOpen.initial_file_url} className="ui-btn btn-sm" download>Initial file</a>
                            )}
                            {reportOpen.final_file_url && (
                                <a href={reportOpen.final_file_url} className="ui-btn btn-sm" download>Final file</a>
                            )}
                        </div>
                    </div>

                    {reportLoading && <p>Loading differences…</p>}

                    {!reportLoading && reportDiff?.products?.length > 0 && (
                        <>
                            <div className="table-responsive">
                                <table className="table table-bordered table-sm">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Product</th>
                                            <th>Expected</th>
                                            <th>Counted</th>
                                            <th>Difference</th>
                                            <th>Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportDiff.products.map((name, i) => (
                                            <tr key={i}>
                                                <td>{i + 1}</td>
                                                <td>{name}</td>
                                                <td>{Number(reportDiff.expected[i]).toFixed(decimal)}</td>
                                                <td>{Number(reportDiff.counted[i]).toFixed(decimal)}</td>
                                                <td>{Number(reportDiff.difference[i]).toFixed(decimal)}</td>
                                                <td>{Number(reportDiff.cost[i]).toFixed(decimal)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {!reportDiff.is_adjusted && (
                                <Link
                                    to={`/stock-count/${reportOpen.id}/qty_adjustment`}
                                    className="ui-btn primary"
                                    onClick={() => setReportOpen(null)}
                                >
                                    Add Adjustment
                                </Link>
                            )}
                        </>
                    )}

                    {!reportLoading && (!reportDiff?.products || reportDiff.products.length === 0) && (
                        <p className="text-muted">No differences found — stock matches counted quantities.</p>
                    )}
                </Modal>
            )}

            <Toast toast={toast} />
        </PageLayout>
    );
}
