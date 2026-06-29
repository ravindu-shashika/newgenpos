import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    PageLayout,
    DataTable,
    ConfirmModal,
    Toast,
    useToast,
    SelectionBar,
} from '../../../components/ui';
import { api } from '../../../services';
import authStore from '../../../stores/authStore';

function isAdminRole() {
    const roleId = authStore.getUser()?.role_id;
    return roleId != null && Number(roleId) <= 2;
}

export default function PurchaseDeletedData() {
    const { toast, showToast } = useToast();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(new Set());
    const [forceDeleteOpen, setForceDeleteOpen] = useState(false);

    const fetchList = useCallback(async () => {
        if (!isAdminRole()) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const res = await api.get('purchases/deleted_data');
            setRows(res.data?.data || []);
        } catch (err) {
            showToast(err?.message || 'Failed to load deleted purchases.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

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
            setSelected(new Set(rows.map((r) => r.id)));
        }
    };

    const handleForceDelete = async () => {
        try {
            await api.delete('purchases/force-delete-selected', {
                data: { ids: Array.from(selected) },
            });
            showToast('Selected purchases permanently deleted.', 'success');
            setSelected(new Set());
            setForceDeleteOpen(false);
            fetchList();
        } catch (err) {
            showToast(err?.message || 'Failed to delete purchases.', 'error');
        }
    };

    const columns = useMemo(() => [
        { label: 'Date', key: 'date' },
        { label: 'Reference', key: 'reference_no' },
        { label: 'Created By', key: 'created_by_name' },
        { label: 'Supplier', key: 'supplier_name' },
        { label: 'Warehouse', key: 'warehouse_name' },
        { label: 'Payment', key: 'payment_status_label' },
        { label: 'Amount', key: 'grand_total', align: 'right' },
        { label: 'Due', key: 'due', align: 'right' },
        { label: 'Deleted By', key: 'deleted_by_name' },
        { label: 'Deleted At', key: 'deleted_at' },
    ], []);

    if (!isAdminRole()) {
        return (
            <PageLayout eyebrow="Purchase" title="Deleted Purchases">
                <p className="text-danger">You are not allowed to access this page.</p>
                <Link to="/purchases" className="ui-btn">Back to list</Link>
            </PageLayout>
        );
    }

    return (
        <PageLayout eyebrow="Purchase" title="Deleted Purchases">
            <Toast toast={toast} />

            <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
                <Link to="/purchases" className="ui-btn">
                    ← Back to purchase list
                </Link>
                {selected.size > 0 && (
                    <button
                        type="button"
                        className="ui-btn danger"
                        onClick={() => setForceDeleteOpen(true)}
                    >
                        Delete permanently ({selected.size})
                    </button>
                )}
            </div>

            {selected.size > 0 && (
                <SelectionBar
                    count={selected.size}
                    onClear={() => setSelected(new Set())}
                />
            )}

            <DataTable
                columns={columns}
                rows={rows}
                loading={loading}
                selected={selected}
                onToggleRow={toggleRow}
                onToggleAll={toggleAll}
                emptyText="No deleted purchases found."
            />

            {forceDeleteOpen && (
                <ConfirmModal
                    title="Permanently delete purchases?"
                    message="This action cannot be undone. Selected purchases will be removed permanently."
                    danger
                    onConfirm={handleForceDelete}
                    onClose={() => setForceDeleteOpen(false)}
                />
            )}
        </PageLayout>
    );
}
