import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

import {
    PageLayout,
    DataTable,
    Modal,
    ConfirmModal,
    FormField,
    FormRow,
    FormSection,
    TextInput,
    SelectInput,
    TextareaInput,
    FileInput,
    CheckboxInput,
    Toast,
    useToast,
    ActionMenu,
    Pagination,
    SelectionBar,
} from '../../../components/ui';
import { api } from '../../../services';
import usePermissions, { useGeneralSetting } from '../../../stores/usePermissions';

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZES = [10, 25, 50];

const EMPTY_FORM = {
    name: '',
    image: null,
    icon: null,
    parent_id: '',
    category_id: null,
};

// ─── Component ────────────────────────────────────────────────────────────────
// controllerName is injected by ComponentContainer from routes.js
const CategoryManager = ({ controllerName }) => {

    // console.log(controllerName);
    // ── Data ──────────────────────────────────────────────────────────────────
    const [categories, setCategories] = useState([]);
    const [categoriesList, setCategoriesList] = useState([]);
    const [loading, setLoading] = useState(true);

    // ── Pagination / sort / search ─────────────────────────────────────────────
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [sortCol, setSortCol] = useState('parent_id');
    const [sortDir, setSortDir] = useState('asc');
    const [search, setSearch] = useState('');

    // ── Selection ──────────────────────────────────────────────────────────────
    const [selected, setSelected] = useState(new Set());
    const [openMenu, setOpenMenu] = useState(null);

    // ── Modals ─────────────────────────────────────────────────────────────────
    const [addOpen, setAddOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

    // ── Form ───────────────────────────────────────────────────────────────────
    const [form, setForm] = useState(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState({});
    const fileInputRef = useRef(null);
    const importFileRef = useRef(null);

    // ── Toast ──────────────────────────────────────────────────────────────────
    const { toast, showToast } = useToast();

    // -- Permissions (resolved against the controllerName passed from the router) --
    const { canAdd, canEdit, canDelete, canImport } = usePermissions(controllerName);

    // -- General settings (from generalSettingStore via hook) --------------------
    const setting = useGeneralSetting();
    const userVerified = import.meta.env.VITE_USER_VERIFIED === '1';
    const modules = (setting?.modules ?? '').split(',').map(m => m.trim());
    // const hasEcommerce = modules.includes('ecommerce');
    // const hasRestaurant = modules.includes('restaurant');
    // -- Client-side Filtering/Sorting/Pagination -------------------------------
    const filteredAndSorted = useMemo(() => {
        let list = [...categories];

        // Search (on name or parent name)
        if (search) {
            const low = search.toLowerCase();
            list = list.filter(c =>
                (c.name || '').toLowerCase().includes(low) ||
                (c.parent_name || '').toLowerCase().includes(low) ||
                (c.short_description || '').toLowerCase().includes(low)
            );
        }

        // Sort
        list.sort((a, b) => {
            const valA = (a[sortCol] ?? '').toString().toLowerCase();
            const valB = (b[sortCol] ?? '').toString().toLowerCase();
            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

        return list;
    }, [categories, search, sortCol, sortDir]);

    const paginatedCategories = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredAndSorted.slice(start, start + pageSize);
    }, [filteredAndSorted, page, pageSize]);

    const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize));

    // ── Fetch ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        fetchCategories();
        fetchCategoriesList();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const res = await api.get('category');
            // If the API returns metadata (from paginate in previous refactors), unwrap the items
            const data = res.data?.data ?? res.data ?? [];
            setCategories(Array.isArray(data) ? data : []);
        } catch {
            showToast('Failed to load categories.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategoriesList = async () => {
        try {
            const res = await api.get('categories/list');
            const data = res.data?.data ?? res.data ?? [];
            setCategoriesList(Array.isArray(data) ? data : []);
        } catch {
            /* silent */
        }
    };

    // ── Form helpers ───────────────────────────────────────────────────────────
    const setField = (name) => (e) =>
        setForm((f) => ({
            ...f,
            [name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
        }));

    const setFile = (name) => (e) =>
        setForm((f) => ({ ...f, [name]: e.target.files[0] }));

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setFormErrors({});
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const validate = (f) => {
        const e = {};
        if (!f.name.trim()) e.name = 'Name is required.';
        return e;
    };

    const buildFormData = (f, method = null) => {
        const fd = new FormData();
        fd.append('name', f.name);
        fd.append('parent_id', f.parent_id ?? '');
        if (f.image) fd.append('image', f.image);
        if (f.icon) fd.append('icon', f.icon);
        if (f.category_id) fd.append('category_id', f.category_id);
        if (method) fd.append('_method', method);
        return fd;
    };

    // ── CRUD ───────────────────────────────────────────────────────────────────
    const handleAdd = async () => {
        const errs = validate(form);
        if (Object.keys(errs).length) { setFormErrors(errs); return; }
        try {
            await api.post('category', buildFormData(form), {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setAddOpen(false);
            resetForm();
            fetchCategories();
            fetchCategoriesList();
            showToast('Category added successfully.');
        } catch {
            showToast('Failed to add category.', 'error');
        }
    };

    // Takes the already-loaded row object — no extra API call needed
    const openEdit = useCallback((row) => {
        setForm({
            name: row.name || '',
            image: null,
            icon: null,
            parent_id: row.parent_id || '',
            category_id: row.id,
        });
        setFormErrors({});
        setEditOpen(true);
    }, []);

    const handleEdit = async () => {
        const errs = validate(form);
        if (Object.keys(errs).length) { setFormErrors(errs); return; }
        try {
            // Laravel requires POST + _method: 'PUT' for multipart/form-data
            await api.post(`category/${form.category_id}`, buildFormData(form, 'PUT'), {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setEditOpen(false);
            resetForm();
            fetchCategories();
            showToast('Category updated successfully.');
        } catch {
            showToast('Failed to update category.', 'error');
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`category/${deleteId}`);
            setDeleteId(null);
            fetchCategories();
            fetchCategoriesList();
            showToast('Category deleted.');
        } catch {
            showToast('Failed to delete category.', 'error');
        }
    };

    const handleBulkDelete = async () => {
        if (!userVerified) { setBulkDeleteOpen(false); return; }
        try {
            await api.post('category/deletebyselection', {
                categoryIdArray: [...selected],
            });
            setBulkDeleteOpen(false);
            setSelected(new Set());
            fetchCategories();
            fetchCategoriesList();
            showToast(`${selected.size} categor${selected.size > 1 ? 'ies' : 'y'} deleted.`);
        } catch {
            showToast('Bulk delete failed.', 'error');
        }
    };

    const handleImport = async (e) => {
        e.preventDefault();
        const file = importFileRef.current?.files[0];
        if (!file) return;
        const fd = new FormData();
        fd.append('file', file);
        try {
            await api.post('category/import', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setImportOpen(false);
            fetchCategories();
            fetchCategoriesList();
            showToast('Categories imported successfully.');
        } catch {
            showToast('Import failed.', 'error');
        }
    };

    // ── Sort ───────────────────────────────────────────────────────────────────
    const handleSort = (key) => {
        if (sortCol === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        else { setSortCol(key); setSortDir('asc'); }
        setPage(1);
    };

    // ── Selection ──────────────────────────────────────────────────────────────
    const toggleRow = (id) =>
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    const toggleAll = () => {
        const ids = paginatedCategories.map((r) => r.id);
        const allSel = ids.every((id) => selected.has(id));
        setSelected((prev) => {
            const next = new Set(prev);
            ids.forEach((id) => (allSel ? next.delete(id) : next.add(id)));
            return next;
        });
    };

    // ── Table columns ──────────────────────────────────────────────────────────
    const columns = [
        { key: 'name', label: 'Category', sortable: true },
        {
            key: 'parent_name', label: 'Parent Category', sortable: true,
            render: (r) => r.parent_name || <span className="cell-muted">—</span>
        },
        {
            key: 'number_of_product', label: 'Products',
            render: (r) => r.number_of_product ?? 0
        },
        {
            key: 'stock_qty', label: 'Stock Qty',
            render: (r) => r.stock_qty ?? 0
        },
        {
            key: 'stock_worth', label: 'Stock Worth (Price/Cost)',
            render: (r) => r.stock_worth || '0.00 / 0.00'
        },
        {
            key: 'action',
            label: 'Action',
            render: (r) => (
                <ActionMenu
                    id={r.id}
                    openId={openMenu}
                    setOpenId={setOpenMenu}
                    items={[
                        canEdit && { label: '✎ Edit', onClick: () => openEdit(r) },
                        (canEdit && canDelete) && { divider: true },
                        canDelete && { label: '🗑 Delete', danger: true, onClick: () => setDeleteId(r.id) },
                    ].filter(Boolean)}
                />
            ),
        },
    ];

    // ── Shared form fields ─────────────────────────────────────────────────────
    const renderFormFields = () => (
        <>
            <FormRow cols={2}>
                <FormField label="Name" required error={formErrors.name}>
                    <TextInput
                        name="name"
                        value={form.name}
                        onChange={setField('name')}
                    />
                </FormField>

                <FormField label="Image">
                    <FileInput
                        name="image"
                        accept="image/*"
                        onChange={setFile('image')}
                        inputRef={fileInputRef}
                    />
                </FormField>

                <FormField label="Parent Category">
                    <SelectInput
                        name="parent_id"
                        value={form.parent_id}
                        onChange={setField('parent_id')}
                    >
                        <option value="">No parent</option>
                        {categoriesList.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </SelectInput>
                </FormField>


            </FormRow>

            {/* {(hasRestaurant || hasEcommerce) && (
                <>
                    <FormSection label="Website" />
                    <FormRow cols={2}>
                        {hasEcommerce && (
                            <FormField label="Icon">
                                <FileInput
                                    name="icon"
                                    accept="image/*"
                                    onChange={setFile('icon')}
                                />
                            </FormField>
                        )}
                    </FormRow>
                </>
            )} */}
        </>
    );

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <PageLayout
            eyebrow="Products"
            title="Categories"
            onClick={(e) => { if (!e.target.closest('.ui-action-wrap')) setOpenMenu(null); }}
            actions={
                <>
                    {canAdd && (
                        <button
                            className="ui-btn primary"
                            onClick={() => { resetForm(); setAddOpen(true); }}
                        >
                            + Add Category
                        </button>
                    )}
                    {canImport && (
                        <button
                            className="ui-btn ghost"
                            onClick={() => setImportOpen(true)}
                        >
                            ↑ Import
                        </button>
                    )}
                    {selected.size > 0 && (
                        <button
                            className="ui-btn danger"
                            onClick={() => { if (userVerified) setBulkDeleteOpen(true); }}
                        >
                            🗑 Delete Selected ({selected.size})
                        </button>
                    )}
                </>
            }
        >
            {/* Toolbar */}
            <div className="ui-toolbar">
                <input
                    className="ui-search"
                    placeholder="Search by name…"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
            </div>

            {/* Selection bar */}
            <SelectionBar
                count={selected.size}
                onClear={() => setSelected(new Set())}
            />

            {/* Table */}
            <DataTable
                columns={columns}
                rows={paginatedCategories}
                loading={loading}
                emptyText="No categories found"
                emptyIcon="🏷️"
                sortCol={sortCol}
                sortDir={sortDir}
                onSort={handleSort}
                selected={selected}
                onToggleRow={toggleRow}
                onToggleAll={toggleAll}
            />

            {/* Pagination */}
            <Pagination
                page={page}
                totalPages={totalPages}
                pageSize={pageSize}
                totalRows={filteredAndSorted.length}
                onChange={setPage}
                pageSizes={PAGE_SIZES}
                onPageSize={(s) => { setPageSize(s); setPage(1); }}
            />

            {/* ── Add Modal ── */}
            {addOpen && (
                <Modal
                    title="Add Category"
                    onClose={() => setAddOpen(false)}
                    footer={
                        <>
                            <button className="ui-btn ghost" onClick={() => setAddOpen(false)}>Cancel</button>
                            <button className="ui-btn primary" onClick={handleAdd}>Add Category</button>
                        </>
                    }
                >
                    {renderFormFields()}
                </Modal>
            )}

            {/* ── Edit Modal ── */}
            {editOpen && (
                <Modal
                    title="Update Category"
                    onClose={() => setEditOpen(false)}
                    footer={
                        <>
                            <button className="ui-btn ghost" onClick={() => setEditOpen(false)}>Cancel</button>
                            <button className="ui-btn primary" onClick={handleEdit}>Update</button>
                        </>
                    }
                >
                    {renderFormFields()}
                </Modal>
            )}

            {/* ── Import Modal ── */}
            {importOpen && (
                <Modal
                    title="Import Categories"
                    onClose={() => setImportOpen(false)}
                    footer={
                        <>
                            <button className="ui-btn ghost" onClick={() => setImportOpen(false)}>Cancel</button>
                            <button className="ui-btn primary" onClick={handleImport}>Import</button>
                        </>
                    }
                >
                    <p style={{ fontSize: '0.8rem', marginBottom: 16, lineHeight: 1.6 }}>
                        CSV column order: <strong>name*</strong>, parent_category
                    </p>
                    <FormRow cols={2}>
                        <FormField label="Upload CSV File" required>
                            <FileInput
                                name="file"
                                accept=".csv"
                                inputRef={importFileRef}
                            />
                        </FormField>
                        <FormField label="Sample File">
                            <a
                                href="/sample_file/sample_category.csv"
                                download
                                className="ui-btn ghost"
                                style={{ justifyContent: 'center' }}
                            >
                                ↓ Download Sample
                            </a>
                        </FormField>
                    </FormRow>
                </Modal>
            )}

            {/* ── Single delete confirm ── */}
            {deleteId && (
                <ConfirmModal
                    title="Delete Category"
                    danger
                    message={
                        <p style={{ fontSize: '0.84rem', lineHeight: 1.7 }}>
                            <strong style={{ color: 'var(--ui-debit)' }}>Warning:</strong> Deleting this
                            category will also remove all products under it. This cannot be undone.
                        </p>
                    }
                    onConfirm={handleDelete}
                    onClose={() => setDeleteId(null)}
                />
            )}

            {/* ── Bulk delete confirm ── */}
            {bulkDeleteOpen && (
                <ConfirmModal
                    title="Bulk Delete Categories"
                    danger
                    message={
                        <p style={{ fontSize: '0.84rem', lineHeight: 1.7 }}>
                            <strong style={{ color: 'var(--ui-debit)' }}>Warning:</strong> You are about to
                            delete <strong>{selected.size}</strong> categor
                            {selected.size === 1 ? 'y' : 'ies'} and all products under them.
                        </p>
                    }
                    onConfirm={handleBulkDelete}
                    onClose={() => setBulkDeleteOpen(false)}
                />
            )}

            {/* Toast */}
            <Toast toast={toast} />
        </PageLayout>
    );
};

export default CategoryManager;