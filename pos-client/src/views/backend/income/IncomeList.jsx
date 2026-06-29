import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    PageLayout,
    DataTable,
    ConfirmModal,
    Modal,
    TextInput,
    NumberInput,
    SelectInput,
    TextareaInput,
    Toast,
    useToast,
    ActionMenu,
    Pagination,
    FormField,
    FormRow,
    FormSection,
} from '../../../components/ui';
import { api } from '../../../services';
import authStore from '../../../stores/authStore';
import usePermissions from '../../../stores/usePermissions';

const PAGE_SIZES = [10, 25, 50, -1];

function toLocalDateString(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function hasIncomeAccess(permissions) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.some(
        (p) => p === 'incomes-index' || p === 'incomes-view' || p.startsWith('incomes-')
    );
}

function hasIncomePermission(permissions, name) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.includes(name);
}

function defaultAccountId(accounts) {
    const def = (accounts || []).find((a) => a.is_default);
    return def ? String(def.id) : (accounts?.[0]?.id ? String(accounts[0].id) : '');
}

function emptyForm(meta) {
    return {
        income_id: '',
        reference_no: '',
        created_at: meta?.default_created_at || '',
        income_category_id: '',
        warehouse_id: meta?.warehouses?.[0]?.id ? String(meta.warehouses[0].id) : '',
        amount: '',
        account_id: defaultAccountId(meta?.accounts),
        note: '',
    };
}

function formatValidationError(err) {
    if (err?.errors && typeof err.errors === 'object') {
        const first = Object.values(err.errors).flat()[0];
        if (first) return first;
    }
    return err?.message || 'Request failed';
}

export default function IncomeList({ controllerName }) {
    const { toast, showToast } = useToast();
    const perms = usePermissions(controllerName || 'incomes');
    const authPerms = authStore.getPermissions();
    const canView = perms.canView || hasIncomeAccess(authPerms);
    const canAdd = perms.canAdd || hasIncomePermission(authPerms, 'incomes-add');
    const canEdit = perms.canEdit || hasIncomePermission(authPerms, 'incomes-edit');
    const canDelete = perms.canDelete || hasIncomePermission(authPerms, 'incomes-delete');

    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [openMenu, setOpenMenu] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [addOpen, setAddOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [form, setForm] = useState(emptyForm(null));
    const [saving, setSaving] = useState(false);

    const yearAgoStart = useMemo(() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 1);
        d.setDate(1);
        return toLocalDateString(d);
    }, []);

    const [startingDate, setStartingDate] = useState(yearAgoStart);
    const [endingDate, setEndingDate] = useState(toLocalDateString());
    const [warehouseId, setWarehouseId] = useState('0');
    const [categoryId, setCategoryId] = useState('0');

    const decimal = meta?.decimal ?? 2;
    const showWarehouseFilter = meta?.show_warehouse_filter !== false;
    const showCategoryFilter = meta?.show_category_filter !== false;

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const q = new URLSearchParams({
                starting_date: startingDate,
                ending_date: endingDate,
                warehouse_id: warehouseId,
                income_category_id: categoryId,
                search,
            });
            const res = await api.get(`incomes?${q}`);
            setRows(res.data?.data || []);
            setMeta((prev) => ({ ...prev, ...res.data }));
        } catch (err) {
            showToast(err?.message || 'Failed to load incomes.', 'error');
        } finally {
            setLoading(false);
        }
    }, [startingDate, endingDate, warehouseId, categoryId, search, showToast]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    const paginated = useMemo(() => {
        if (pageSize === -1) return rows;
        const start = (page - 1) * pageSize;
        return rows.slice(start, start + pageSize);
    }, [rows, page, pageSize]);

    const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(rows.length / pageSize) || 1);

    const totalAmount = useMemo(
        () => rows.reduce((sum, row) => sum + (parseFloat(row.amount_raw) || 0), 0),
        [rows]
    );

    const warehouseOptions = useMemo(
        () => [
            { value: '0', label: 'All warehouse' },
            ...(meta?.warehouses || []).map((w) => ({ value: String(w.id), label: w.name })),
        ],
        [meta]
    );

    const categoryFilterOptions = useMemo(
        () => [
            { value: '0', label: 'All categories' },
            ...(meta?.income_categories || []).map((c) => ({
                value: String(c.id),
                label: c.label || c.name,
            })),
        ],
        [meta]
    );

    const categoryFormOptions = useMemo(
        () => [
            { value: '', label: 'Select income category…' },
            ...(meta?.income_categories || []).map((c) => ({
                value: String(c.id),
                label: c.label || c.name,
            })),
        ],
        [meta]
    );

    const warehouseFormOptions = useMemo(
        () => [
            { value: '', label: 'Select warehouse…' },
            ...(meta?.warehouses || []).map((w) => ({ value: String(w.id), label: w.name })),
        ],
        [meta]
    );

    const accountOptions = useMemo(
        () => (meta?.accounts || []).map((a) => ({ value: String(a.id), label: a.label || a.name })),
        [meta]
    );

    const openAdd = () => {
        setForm(emptyForm(meta));
        setAddOpen(true);
    };

    const openEdit = async (row) => {
        try {
            const res = await api.get(`incomes/${row.id}/edit`);
            const income = res.data?.income || {};
            setForm({
                income_id: String(income.id || row.id),
                reference_no: income.reference_no || row.reference_no || '',
                created_at: income.date || row.date || '',
                income_category_id: income.income_category_id != null
                    ? String(income.income_category_id)
                    : '',
                warehouse_id: income.warehouse_id ? String(income.warehouse_id) : '',
                amount: income.amount ?? row.amount_raw ?? '',
                account_id: income.account_id ? String(income.account_id) : defaultAccountId(meta?.accounts),
                note: income.note ?? '',
            });
            setEditOpen(true);
        } catch (err) {
            showToast(formatValidationError(err), 'error');
        }
    };

    const validateForm = () => {
        if (!form.income_category_id || !form.warehouse_id || form.amount === '' || !form.account_id) {
            showToast('Category, warehouse, account and amount are required.', 'error');
            return false;
        }
        return true;
    };

    const handleAdd = async () => {
        if (!validateForm()) return;
        setSaving(true);
        try {
            await api.post('incomes', {
                created_at: form.created_at || '',
                income_category_id: form.income_category_id,
                warehouse_id: form.warehouse_id,
                amount: form.amount,
                account_id: form.account_id,
                note: form.note || '',
            });
            showToast('Income created.', 'success');
            setAddOpen(false);
            fetchList();
        } catch (err) {
            showToast(formatValidationError(err), 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = async () => {
        if (!validateForm()) return;
        setSaving(true);
        try {
            await api.put(`incomes/${form.income_id}`, {
                income_id: form.income_id,
                created_at: form.created_at || '',
                income_category_id: form.income_category_id,
                warehouse_id: form.warehouse_id,
                amount: form.amount,
                account_id: form.account_id,
                note: form.note || '',
            });
            showToast('Income updated.', 'success');
            setEditOpen(false);
            fetchList();
        } catch (err) {
            showToast(formatValidationError(err), 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`incomes/${id}`);
            showToast('Income deleted.', 'success');
            setDeleteId(null);
            fetchList();
        } catch (err) {
            showToast(formatValidationError(err), 'error');
        }
    };

    const renderFormFields = () => (
        <>
            {form.reference_no && (
                <FormField label="Reference">
                    <p className="mb-0"><strong>{form.reference_no}</strong></p>
                </FormField>
            )}
            <FormRow>
                <FormField label="Date">
                    <TextInput
                        value={form.created_at}
                        onChange={(e) => setForm({ ...form, created_at: e.target.value })}
                        placeholder="dd-mm-yyyy"
                    />
                </FormField>
                <FormField label="Income category" required>
                    <SelectInput
                        required
                        value={form.income_category_id}
                        onChange={(e) => setForm({ ...form, income_category_id: e.target.value })}
                        options={categoryFormOptions}
                    />
                </FormField>
                <FormField label="Warehouse" required>
                    <SelectInput
                        required
                        value={form.warehouse_id}
                        onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}
                        options={warehouseFormOptions}
                    />
                </FormField>
                <FormField label="Amount" required>
                    <NumberInput
                        step="any"
                        min="0"
                        required
                        value={form.amount}
                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    />
                </FormField>
            </FormRow>
            <FormRow>
                <FormField label="Account" required>
                    <SelectInput
                        required
                        value={form.account_id}
                        onChange={(e) => setForm({ ...form, account_id: e.target.value })}
                        options={accountOptions}
                    />
                </FormField>
            </FormRow>
            <FormField label="Note">
                <TextareaInput
                    rows={3}
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                />
            </FormField>
        </>
    );

    const columns = [
        { label: 'Date', key: 'date', sortable: true },
        { label: 'Reference', key: 'reference_no', sortable: true },
        { label: 'Warehouse', key: 'warehouse' },
        { label: 'Category', key: 'income_category' },
        { label: 'Amount', key: 'amount', align: 'right' },
        {
            label: 'Note',
            key: 'note',
            render: (row) => (
                <span className="text-truncate d-inline-block" style={{ maxWidth: 180 }} title={row.note}>
                    {row.note || '—'}
                </span>
            ),
        },
        {
            label: 'Action',
            key: 'action',
            render: (row) => {
                const items = [
                    canEdit && {
                        label: 'Edit',
                        onClick: () => openEdit(row),
                    },
                    canDelete && {
                        label: 'Delete',
                        danger: true,
                        onClick: () => setDeleteId(row.id),
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

    if (!canView) {
        return (
            <PageLayout eyebrow="Income" title="Income List">
                <p className="text-muted">You do not have permission to view incomes.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout eyebrow="Income" title="Income List">
            <Toast toast={toast} />

            <div className="d-flex flex-wrap gap-2 mb-3">
                {canAdd && (
                    <button type="button" className="ui-btn primary" onClick={openAdd}>
                        Add income
                    </button>
                )}
                <button type="button" className="ui-btn" onClick={() => setShowFilters((v) => !v)}>
                    {showFilters ? 'Hide filters' : 'Filter'}
                </button>
            </div>

            {showFilters && (
                <FormSection title="Filters">
                    <FormRow>
                        <FormField label="From date">
                            <TextInput
                                type="date"
                                value={startingDate}
                                onChange={(e) => setStartingDate(e.target.value)}
                            />
                        </FormField>
                        <FormField label="To date">
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
                        {showCategoryFilter && (
                            <FormField label="Income category">
                                <SelectInput
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    options={categoryFilterOptions}
                                />
                            </FormField>
                        )}
                    </FormRow>
                </FormSection>
            )}

            <div className="mb-3">
                <TextInput
                    placeholder="Search reference, note, warehouse, category…"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                />
            </div>

            <DataTable
                columns={columns}
                rows={paginated}
                loading={loading}
                emptyMessage="No incomes found."
            />

            <div className="d-flex justify-content-between align-items-center mt-2 flex-wrap gap-2">
                <strong>
                    Total: {totalAmount.toFixed(decimal)}
                </strong>
                <Pagination
                    page={page}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    pageSizes={PAGE_SIZES}
                    onPageChange={setPage}
                    onPageSizeChange={(size) => {
                        setPageSize(size);
                        setPage(1);
                    }}
                />
            </div>

            {addOpen && (
                <Modal title="Add Income" onClose={() => setAddOpen(false)}>
                    {renderFormFields()}
                    <div className="d-flex gap-2 mt-3">
                        <button type="button" className="ui-btn primary" disabled={saving} onClick={handleAdd}>
                            {saving ? 'Saving…' : 'Submit'}
                        </button>
                        <button type="button" className="ui-btn" onClick={() => setAddOpen(false)}>
                            Cancel
                        </button>
                    </div>
                </Modal>
            )}

            {editOpen && (
                <Modal title="Update Income" onClose={() => setEditOpen(false)}>
                    {renderFormFields()}
                    <div className="d-flex gap-2 mt-3">
                        <button type="button" className="ui-btn primary" disabled={saving} onClick={handleEdit}>
                            {saving ? 'Saving…' : 'Update'}
                        </button>
                        <button type="button" className="ui-btn" onClick={() => setEditOpen(false)}>
                            Cancel
                        </button>
                    </div>
                </Modal>
            )}

            {deleteId && (
                <ConfirmModal
                    title="Delete income"
                    message="Are you sure you want to delete this income?"
                    danger
                    onConfirm={() => handleDelete(deleteId)}
                    onClose={() => setDeleteId(null)}
                />
            )}
        </PageLayout>
    );
}
