import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    PageLayout,
    DataTable,
    Modal,
    ConfirmModal,
    FormField,
    FormRow,
    TextInput,
    Toast,
    useToast,
    ActionMenu,
    Pagination,
    SelectionBar,
} from '../../../components/ui';
import { api, generateUniqueCode, assertCodeAvailable } from '../../../services';
import authStore from '../../../stores/authStore';
import usePermissions from '../../../stores/usePermissions';

const PAGE_SIZES = [10, 25, 50];

const EMPTY_FORM = {
    code: '',
    name: '',
    income_category_id: null,
};

function hasIncomeCategoryAccess(permissions) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.some(
        (p) => p === 'income-categories' || p === 'income_categories' || p.startsWith('income_categories-')
    );
}

export default function IncomeCategoryManager({ controllerName }) {
    const ctrl = controllerName === 'income-categories'
        ? 'income_categories'
        : (controllerName || 'income_categories');
    const perms = usePermissions(ctrl);
    const authPerms = authStore.getPermissions();
    const canView = perms.canView || hasIncomeCategoryAccess(authPerms);
    const canAdd = perms.canAdd || hasIncomeCategoryAccess(authPerms);
    const canEdit = perms.canEdit || hasIncomeCategoryAccess(authPerms);
    const canDelete = perms.canDelete || hasIncomeCategoryAccess(authPerms);

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(new Set());
    const [openMenu, setOpenMenu] = useState(null);

    const [addOpen, setAddOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

    const [form, setForm] = useState(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState({});

    const { toast, showToast } = useToast();

    const fetchRows = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('income_categories');
            setRows(res.data?.data || []);
        } catch (err) {
            showToast(err?.message || 'Failed to load income categories.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchRows();
    }, [fetchRows]);

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setFormErrors({});
    };

    const validate = (f) => {
        const e = {};
        if (!f.code?.trim()) e.code = 'Code is required.';
        if (!f.name?.trim()) e.name = 'Name is required.';
        return e;
    };

    const handleGenerateCode = async () => {
        try {
            const code = await generateUniqueCode('income_category', {
                exceptId: form.income_category_id || null,
            });
            setForm((f) => ({ ...f, code: String(code) }));
        } catch (err) {
            showToast(err?.message || 'Failed to generate code.', 'error');
        }
    };

    const handleAdd = async () => {
        const errs = validate(form);
        if (Object.keys(errs).length) {
            setFormErrors(errs);
            return;
        }
        try {
            await assertCodeAvailable('income_category', form.code);
        } catch (err) {
            setFormErrors({ code: err.message });
            showToast(err.message, 'error');
            return;
        }
        try {
            await api.post('income_categories', {
                code: form.code.trim(),
                name: form.name.trim(),
                is_active: 1,
            });
            setAddOpen(false);
            resetForm();
            fetchRows();
            showToast('Income category added.', 'success');
        } catch (err) {
            if (err?.errors) setFormErrors(err.errors);
            else showToast(err?.message || 'Failed to add income category.', 'error');
        }
    };

    const openEdit = (row) => {
        setForm({
            code: row.code || '',
            name: row.name || '',
            income_category_id: row.id,
        });
        setFormErrors({});
        setEditOpen(true);
    };

    const handleEdit = async () => {
        const errs = validate(form);
        if (Object.keys(errs).length) {
            setFormErrors(errs);
            return;
        }
        try {
            await assertCodeAvailable('income_category', form.code, form.income_category_id);
        } catch (err) {
            setFormErrors({ code: err.message });
            showToast(err.message, 'error');
            return;
        }
        try {
            await api.put(`income_categories/${form.income_category_id}`, {
                income_category_id: form.income_category_id,
                code: form.code.trim(),
                name: form.name.trim(),
            });
            setEditOpen(false);
            resetForm();
            fetchRows();
            showToast('Income category updated.', 'success');
        } catch (err) {
            if (err?.errors) setFormErrors(err.errors);
            else showToast(err?.message || 'Failed to update income category.', 'error');
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`income_categories/${deleteId}`);
            setDeleteId(null);
            fetchRows();
            showToast('Income category deleted.', 'success');
        } catch (err) {
            showToast(err?.message || 'Failed to delete income category.', 'error');
        }
    };

    const handleBulkDelete = async () => {
        try {
            await api.post('income_categories/deletebyselection', {
                income_categoryIdArray: [...selected],
            });
            setBulkDeleteOpen(false);
            setSelected(new Set());
            fetchRows();
            showToast('Selected income categories deleted.', 'success');
        } catch (err) {
            showToast(err?.message || 'Bulk delete failed.', 'error');
        }
    };

    const filtered = useMemo(() => {
        if (!search.trim()) return rows;
        const q = search.toLowerCase();
        return rows.filter(
            (r) =>
                (r.code || '').toLowerCase().includes(q) ||
                (r.name || '').toLowerCase().includes(q)
        );
    }, [rows, search]);

    const paginated = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page, pageSize]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize) || 1);

    const toggleRow = (id) =>
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const toggleAll = () => {
        const ids = paginated.map((r) => r.id);
        const allSel = ids.length > 0 && ids.every((id) => selected.has(id));
        setSelected((prev) => {
            const next = new Set(prev);
            ids.forEach((id) => (allSel ? next.delete(id) : next.add(id)));
            return next;
        });
    };

    const columns = [
        { label: 'Code', key: 'code', sortable: true },
        { label: 'Name', key: 'name', sortable: true },
        {
            label: 'Action',
            key: 'action',
            render: (row) => {
                const items = [
                    canEdit && { label: 'Edit', onClick: () => openEdit(row) },
                    canDelete && { label: 'Delete', danger: true, onClick: () => setDeleteId(row.id) },
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

    const renderFormFields = () => (
        <FormRow>
            <FormField label="Code" required error={formErrors.code}>
                <div className="d-flex gap-2">
                    <TextInput
                        required
                        value={form.code}
                        onChange={(e) => setForm({ ...form, code: e.target.value })}
                        placeholder="Type income category code"
                    />
                    {addOpen && canAdd && (
                        <button type="button" className="ui-btn" onClick={handleGenerateCode}>
                            Generate
                        </button>
                    )}
                </div>
            </FormField>
            <FormField label="Name" required error={formErrors.name}>
                <TextInput
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Type income category name"
                />
            </FormField>
        </FormRow>
    );

    if (!canView) {
        return (
            <PageLayout eyebrow="Income" title="Income Category">
                <p className="text-muted">You do not have permission to view income categories.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout eyebrow="Income" title="Income Category">
            <Toast toast={toast} />

            <div className="d-flex flex-wrap gap-2 mb-3">
                {canAdd && (
                    <button type="button" className="ui-btn primary" onClick={() => { resetForm(); setAddOpen(true); }}>
                        Add income category
                    </button>
                )}
            </div>

            {selected.size > 0 && canDelete && (
                <SelectionBar
                    count={selected.size}
                    onClear={() => setSelected(new Set())}
                    onDelete={() => setBulkDeleteOpen(true)}
                />
            )}

            <div className="mb-3">
                <TextInput
                    placeholder="Search code or name…"
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
                emptyText="No income categories found."
                selected={canDelete ? selected : undefined}
                onToggleRow={canDelete ? toggleRow : undefined}
                onToggleAll={canDelete ? toggleAll : undefined}
            />

            <Pagination
                className="mt-3"
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

            {addOpen && (
                <Modal title="Add Income Category" onClose={() => setAddOpen(false)}>
                    {renderFormFields()}
                    <div className="d-flex gap-2 mt-3">
                        <button type="button" className="ui-btn primary" onClick={handleAdd}>Submit</button>
                        <button type="button" className="ui-btn" onClick={() => setAddOpen(false)}>Cancel</button>
                    </div>
                </Modal>
            )}

            {editOpen && (
                <Modal title="Update Income Category" onClose={() => setEditOpen(false)}>
                    {renderFormFields()}
                    <div className="d-flex gap-2 mt-3">
                        <button type="button" className="ui-btn primary" onClick={handleEdit}>Update</button>
                        <button type="button" className="ui-btn" onClick={() => setEditOpen(false)}>Cancel</button>
                    </div>
                </Modal>
            )}

            {deleteId && (
                <ConfirmModal
                    title="Delete income category"
                    message="Are you sure you want to delete this income category?"
                    danger
                    onConfirm={handleDelete}
                    onClose={() => setDeleteId(null)}
                />
            )}

            {bulkDeleteOpen && (
                <ConfirmModal
                    title="Bulk delete"
                    message={`Delete ${selected.size} selected income categories?`}
                    danger
                    onConfirm={handleBulkDelete}
                    onClose={() => setBulkDeleteOpen(false)}
                />
            )}
        </PageLayout>
    );
}
