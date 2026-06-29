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
    FileInput,
    Toast,
    useToast,
    ActionMenu,
    Pagination,
    SelectionBar,
} from '../../../components/ui';
import { api, brandImageUrl } from '../../../services';
import usePermissions from '../../../stores/usePermissions';

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZES = [10, 25, 50];

const EMPTY_FORM = {
    title: '',
    image: null,
    existingImage: null,
    brand_id: null,
};

// ─── Component ────────────────────────────────────────────────────────────────
const BrandManager = ({ controllerName }) => {

    // ── Data ──────────────────────────────────────────────────────────────────
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);

    // ── Pagination / sort / search ─────────────────────────────────────────────
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [sortCol, setSortCol] = useState('title');
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

    // -- Client-side Filtering/Sorting/Pagination -------------------------------
    const filteredAndSorted = useMemo(() => {
        let list = [...brands];

        // Search (on title)
        if (search) {
            const low = search.toLowerCase();
            list = list.filter(b =>
                (b.title || '').toLowerCase().includes(low)
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
    }, [brands, search, sortCol, sortDir]);

    const paginatedBrands = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredAndSorted.slice(start, start + pageSize);
    }, [filteredAndSorted, page, pageSize]);

    const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize));

    // ── Fetch ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        fetchBrands();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchBrands = async () => {
        try {
            setLoading(true);
            const res = await api.get('brand');
            const data = res.data?.data ?? res.data ?? [];
            setBrands(Array.isArray(data) ? data : []);
        } catch {
            showToast('Failed to load brands.', 'error');
        } finally {
            setLoading(false);
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
        if (!f.title.trim()) e.title = 'Title is required.';
        return e;
    };

    const buildFormData = (f, method = null) => {
        const fd = new FormData();
        fd.append('title', f.title);
        if (f.image) fd.append('image', f.image);
        if (f.brand_id) fd.append('brand_id', f.brand_id);
        if (method) fd.append('_method', method);
        return fd;
    };

    // ── CRUD ───────────────────────────────────────────────────────────────────
    const handleAdd = async () => {
        const errs = validate(form);
        if (Object.keys(errs).length) { setFormErrors(errs); return; }
        try {
            await api.post('brand', buildFormData(form), {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setAddOpen(false);
            resetForm();
            fetchBrands();
            showToast('Brand added successfully.');
        } catch {
            showToast('Failed to add brand.', 'error');
        }
    };

    const openEdit = useCallback((row) => {
        setForm({
            title: row.title || '',
            image: null,
            existingImage: row.image || null,
            brand_id: row.id,
        });
        setFormErrors({});
        if (fileInputRef.current) fileInputRef.current.value = '';
        setEditOpen(true);
    }, []);

    const handleEdit = async () => {
        const errs = validate(form);
        if (Object.keys(errs).length) { setFormErrors(errs); return; }
        try {
            // Laravel requires POST + _method: 'PUT' for multipart/form-data
            await api.post(`brand/${form.brand_id}`, buildFormData(form, 'PUT'), {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setEditOpen(false);
            resetForm();
            fetchBrands();
            showToast('Brand updated successfully.');
        } catch {
            showToast('Failed to update brand.', 'error');
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`brand/${deleteId}`);
            setDeleteId(null);
            fetchBrands();
            showToast('Brand deleted.');
        } catch {
            showToast('Failed to delete brand.', 'error');
        }
    };

    const handleBulkDelete = async () => {
        try {
            await api.post('brand/deletebyselection', {
                brandIdArray: [...selected],
            });
            setBulkDeleteOpen(false);
            setSelected(new Set());
            fetchBrands();
            showToast(`${selected.size} brand${selected.size > 1 ? 's' : ''} deleted.`);
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
            await api.post('brand/import', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setImportOpen(false);
            fetchBrands();
            showToast('Brands imported successfully.');
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
        const ids = paginatedBrands.map((r) => r.id);
        const allSel = ids.every((id) => selected.has(id));
        setSelected((prev) => {
            const next = new Set(prev);
            ids.forEach((id) => (allSel ? next.delete(id) : next.add(id)));
            return next;
        });
    };

    // ── Table columns ──────────────────────────────────────────────────────────
    const columns = [
        {
            key: 'image', label: 'Image',
            render: (r) => (
                <div style={{ width: 40, height: 40, overflow: 'hidden', borderRadius: 4, background: '#f5f5f5' }}>
                    {r.image ? (
                        <img
                            src={brandImageUrl(r.image)}
                            alt={r.title}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ccc' }}>
                            ∅
                        </div>
                    )}
                </div>
            )
        },
        { key: 'title', label: 'Brand', sortable: true },
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
                <FormField label="Title" required error={formErrors.title}>
                    <TextInput
                        name="title"
                        value={form.title}
                        onChange={setField('title')}
                    />
                </FormField>

                <FormField label="Image">
                    <FileInput
                        name="image"
                        accept="image/*"
                        onChange={setFile('image')}
                        inputRef={fileInputRef}
                    />
                    {(form.image || form.existingImage) && (
                        <div style={{ marginTop: 8, width: 80, height: 80, borderRadius: 4, overflow: 'hidden', background: '#f5f5f5' }}>
                            <img
                                src={form.image ? URL.createObjectURL(form.image) : brandImageUrl(form.existingImage)}
                                alt="Brand preview"
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                        </div>
                    )}
                </FormField>
            </FormRow>
        </>
    );

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <PageLayout
            eyebrow="Products"
            title="Brands"
            onClick={(e) => { if (!e.target.closest('.ui-action-wrap')) setOpenMenu(null); }}
            actions={
                <>
                    {canAdd && (
                        <button
                            className="ui-btn primary"
                            onClick={() => { resetForm(); setAddOpen(true); }}
                        >
                            + Add Brand
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
                            onClick={() => setBulkDeleteOpen(true)}
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
                    placeholder="Search by title…"
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
                rows={paginatedBrands}
                loading={loading}
                emptyText="No brands found"
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
                    title="Add Brand"
                    onClose={() => setAddOpen(false)}
                    footer={
                        <>
                            <button className="ui-btn ghost" onClick={() => setAddOpen(false)}>Cancel</button>
                            <button className="ui-btn primary" onClick={handleAdd}>Add Brand</button>
                        </>
                    }
                >
                    {renderFormFields()}
                </Modal>
            )}

            {/* ── Edit Modal ── */}
            {editOpen && (
                <Modal
                    title="Update Brand"
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
                    title="Import Brands"
                    onClose={() => setImportOpen(false)}
                    footer={
                        <>
                            <button className="ui-btn ghost" onClick={() => setImportOpen(false)}>Cancel</button>
                            <button className="ui-btn primary" onClick={handleImport}>Import</button>
                        </>
                    }
                >
                    <p style={{ fontSize: '0.8rem', marginBottom: 16, lineHeight: 1.6 }}>
                        CSV column order: <strong>title*</strong>, image
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
                                href="/sample_file/sample_brand.csv"
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
                    title="Delete Brand"
                    danger
                    message="Are you sure you want to delete this brand?"
                    onConfirm={handleDelete}
                    onClose={() => setDeleteId(null)}
                />
            )}

            {/* ── Bulk delete confirm ── */}
            {bulkDeleteOpen && (
                <ConfirmModal
                    title="Bulk Delete Brands"
                    danger
                    message={`Are you sure you want to delete ${selected.size} brands?`}
                    onConfirm={handleBulkDelete}
                    onClose={() => setBulkDeleteOpen(false)}
                />
            )}

            {/* Toast */}
            <Toast toast={toast} />
        </PageLayout>
    );
};

export default BrandManager;