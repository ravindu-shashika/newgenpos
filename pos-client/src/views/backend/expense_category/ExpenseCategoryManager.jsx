import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    PageLayout,
    DataTable,
    Modal,
    ConfirmModal,
    FormField,
    FormRow,
    TextInput,
    FileInput,
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
    expense_category_id: null,
};

function hasExpenseCategoryAccess(permissions) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.some(
        (p) => p === 'expense-categories' || p === 'expense_categories' || p.startsWith('expense_categories-')
    );
}

export default function ExpenseCategoryManager({ controllerName }) {
    const ctrl = controllerName === 'expense-categories'
        ? 'expense_categories'
        : (controllerName || 'expense_categories');
    const perms = usePermissions(ctrl);
    const authPerms = authStore.getPermissions();
    const canView = perms.canView || hasExpenseCategoryAccess(authPerms);
    const canAdd = perms.canAdd || hasExpenseCategoryAccess(authPerms);
    const canEdit = perms.canEdit || hasExpenseCategoryAccess(authPerms);
    const canDelete = perms.canDelete || hasExpenseCategoryAccess(authPerms);
    const canImport = perms.canImport || canAdd;

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(new Set());
    const [openMenu, setOpenMenu] = useState(null);

    const [addOpen, setAddOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

    const [form, setForm] = useState(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState({});
    const importFileRef = useRef(null);

    const { toast, showToast } = useToast();

    const fetchRows = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('expense_categories');
            setRows(res.data?.data || []);
        } catch (err) {
            showToast(err?.message || 'Failed to load expense categories.', 'error');
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
            const code = await generateUniqueCode('expense_category', {
                exceptId: form.expense_category_id || null,
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
            await assertCodeAvailable('expense_category', form.code);
        } catch (err) {
            setFormErrors({ code: err.message });
            showToast(err.message, 'error');
            return;
        }
        try {
            await api.post('expense_categories', {
                code: form.code.trim(),
                name: form.name.trim(),
                is_active: 1,
            });
            setAddOpen(false);
            resetForm();
            fetchRows();
            showToast('Expense category added.', 'success');
        } catch (err) {
            if (err?.errors) setFormErrors(err.errors);
            else showToast(err?.message || 'Failed to add expense category.', 'error');
        }
    };

    const openEdit = (row) => {
        setForm({
            code: row.code || '',
            name: row.name || '',
            expense_category_id: row.id,
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
            await assertCodeAvailable('expense_category', form.code, form.expense_category_id);
        } catch (err) {
            setFormErrors({ code: err.message });
            showToast(err.message, 'error');
            return;
        }
        try {
            await api.put(`expense_categories/${form.expense_category_id}`, {
                expense_category_id: form.expense_category_id,
                code: form.code.trim(),
                name: form.name.trim(),
            });
            setEditOpen(false);
            resetForm();
            fetchRows();
            showToast('Expense category updated.', 'success');
        } catch (err) {
            if (err?.errors) setFormErrors(err.errors);
            else showToast(err?.message || 'Failed to update expense category.', 'error');
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`expense_categories/${deleteId}`);
            setDeleteId(null);
            fetchRows();
            showToast('Expense category deleted.', 'success');
        } catch (err) {
            showToast(err?.message || 'Failed to delete expense category.', 'error');
        }
    };

    const handleBulkDelete = async () => {
        try {
            await api.post('expense_categories/deletebyselection', {
                expense_categoryIdArray: [...selected],
            });
            setBulkDeleteOpen(false);
            setSelected(new Set());
            fetchRows();
            showToast('Selected expense categories deleted.', 'success');
        } catch (err) {
            showToast(err?.message || 'Bulk delete failed.', 'error');
        }
    };

    const handleImport = async (e) => {
        e.preventDefault();
        const file = importFileRef.current?.files?.[0];
        if (!file) {
            showToast('Please choose a CSV file.', 'error');
            return;
        }
        const fd = new FormData();
        fd.append('file', file);
        try {
            await api.post('expense_categories/import', fd);
            setImportOpen(false);
            if (importFileRef.current) importFileRef.current.value = '';
            fetchRows();
            showToast('Expense categories imported.', 'success');
        } catch (err) {
            showToast(err?.message || 'Import failed.', 'error');
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
        <>
            <FormRow>
                <FormField label="Code" required error={formErrors.code}>
                    <div className="d-flex gap-2">
                        <TextInput
                            required
                            value={form.code}
                            onChange={(e) => setForm({ ...form, code: e.target.value })}
                            placeholder="Type expense category code"
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
                        placeholder="Type expense category name"
                    />
                </FormField>
            </FormRow>
        </>
    );

    if (!canView) {
        return (
            <PageLayout eyebrow="Expense" title="Expense Category">
                <p className="text-muted">You do not have permission to view expense categories.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout eyebrow="Expense" title="Expense Category">
            <Toast toast={toast} />

            <div className="d-flex flex-wrap gap-2 mb-3">
                {canAdd && (
                    <button type="button" className="ui-btn primary" onClick={() => { resetForm(); setAddOpen(true); }}>
                        Add expense category
                    </button>
                )}
                {canImport && (
                    <button type="button" className="ui-btn" onClick={() => setImportOpen(true)}>
                        Import expense category
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
                emptyText="No expense categories found."
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
                <Modal title="Add Expense Category" onClose={() => setAddOpen(false)}>
                    {renderFormFields()}
                    <div className="d-flex gap-2 mt-3">
                        <button type="button" className="ui-btn primary" onClick={handleAdd}>Submit</button>
                        <button type="button" className="ui-btn" onClick={() => setAddOpen(false)}>Cancel</button>
                    </div>
                </Modal>
            )}

            {editOpen && (
                <Modal title="Update Expense Category" onClose={() => setEditOpen(false)}>
                    {renderFormFields()}
                    <div className="d-flex gap-2 mt-3">
                        <button type="button" className="ui-btn primary" onClick={handleEdit}>Update</button>
                        <button type="button" className="ui-btn" onClick={() => setEditOpen(false)}>Cancel</button>
                    </div>
                </Modal>
            )}

            {importOpen && (
                <Modal title="Import Expense Category" onClose={() => setImportOpen(false)}>
                    <p className="text-muted small">Column order: code*, name*</p>
                    <FormRow>
                        <FormField label="Upload CSV file" required>
                            <FileInput ref={importFileRef} accept=".csv" required />
                        </FormField>
                        <FormField label="Sample file">
                            <a href="/sample_file/sample_expense_category.csv" className="ui-btn ghost" download>
                                Download sample
                            </a>
                        </FormField>
                    </FormRow>
                    <div className="d-flex gap-2 mt-3">
                        <button type="button" className="ui-btn primary" onClick={handleImport}>Import</button>
                        <button type="button" className="ui-btn" onClick={() => setImportOpen(false)}>Cancel</button>
                    </div>
                </Modal>
            )}

            {deleteId && (
                <ConfirmModal
                    title="Delete expense category"
                    message="Are you sure you want to delete this expense category?"
                    danger
                    onConfirm={handleDelete}
                    onClose={() => setDeleteId(null)}
                />
            )}

            {bulkDeleteOpen && (
                <ConfirmModal
                    title="Bulk delete"
                    message={`Delete ${selected.size} selected expense categories?`}
                    danger
                    onConfirm={handleBulkDelete}
                    onClose={() => setBulkDeleteOpen(false)}
                />
            )}
        </PageLayout>
    );
}
