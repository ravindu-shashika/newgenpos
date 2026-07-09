import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    PageLayout,
    DataTable,
    Modal,
    ConfirmModal,
    FormField,
    FormRow,
    TextInput,
    TextareaInput,
    Toast,
    useToast,
    ActionMenu,
    Pagination,
} from '../../../components/ui';
import { api } from '../../../services';
import usePermissions from '../../../stores/usePermissions';
import { parseValuesInput } from '../../../utils/productVariantHelpers';

const PAGE_SIZES = [10, 25, 50];

const EMPTY_FORM = {
    id: null,
    name: '',
    valuesText: '',
};

const VariantMasterManager = ({ controllerName }) => {
    const { canAdd, canEdit, canDelete } = usePermissions(controllerName || 'variant-masters');
    const { toast, showToast, showApiSuccess, showApiError } = useToast();

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [openMenu, setOpenMenu] = useState(null);
    const [addOpen, setAddOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [importing, setImporting] = useState(false);

    const fetchRows = async () => {
        try {
            setLoading(true);
            const res = await api.get('variant-masters');
            const data = res.data?.data ?? res.data ?? [];
            setRows(Array.isArray(data) ? data : []);
        } catch (err) {
            showApiError(err, 'Failed to load variant types.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRows();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filtered = useMemo(() => {
        if (!search.trim()) return rows;
        const low = search.toLowerCase();
        return rows.filter((row) => {
            const values = (row.values || []).map((v) => v.value).join(' ').toLowerCase();
            return (row.name || '').toLowerCase().includes(low) || values.includes(low);
        });
    }, [rows, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paginated = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page, pageSize]);

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setFormErrors({});
    };

    const openCreate = () => {
        resetForm();
        setAddOpen(true);
    };

    const openEdit = async (row) => {
        setEditOpen(true);
        setEditLoading(true);
        setFormErrors({});
        resetForm();
        try {
            const res = await api.get(`variant-masters/${row.id}/edit`);
            const data = res.data?.data ?? res.data ?? row;
            setForm({
                id: data.id ?? row.id,
                name: data.name || '',
                valuesText: (data.values || []).map((v) => v.value).join(', '),
            });
        } catch (err) {
            showApiError(err, 'Failed to load variant type.');
            setEditOpen(false);
        } finally {
            setEditLoading(false);
        }
    };

    const requestDelete = (row) => {
        setEditOpen(false);
        setAddOpen(false);
        setDeleteId(row.id);
    };

    const validate = () => {
        const errors = {};
        if (!form.name.trim()) errors.name = 'Name is required.';
        const values = parseValuesInput(form.valuesText);
        if (values.length === 0) errors.valuesText = 'Add at least one attribute value.';
        return errors;
    };

    const save = async (isEdit) => {
        const errors = validate();
        setFormErrors(errors);
        if (Object.keys(errors).length) return;

        const payload = {
            name: form.name.trim(),
            values: parseValuesInput(form.valuesText),
        };

        try {
            setSaving(true);
            const res = isEdit
                ? await api.put(`variant-masters/${form.id}`, payload)
                : await api.post('variant-masters', payload);
            showApiSuccess(res, isEdit ? 'Variant type updated.' : 'Variant type created.');
            if (isEdit) setEditOpen(false);
            else setAddOpen(false);
            resetForm();
            fetchRows();
        } catch (err) {
            showApiError(err, 'Failed to save variant type.');
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await api.delete(`variant-masters/${deleteId}`);
            showApiSuccess(res, 'Variant type deleted.');
            setDeleteId(null);
            fetchRows();
        } catch (err) {
            showApiError(err, 'Failed to delete variant type.');
        }
    };

    const migrateLinks = async () => {
        try {
            setImporting(true);
            const res = await api.post('variant-masters/migrate-links');
            const updated = res.data?.data?.updated_rows ?? 0;
            showApiSuccess(res, updated > 0 ? `Updated ${updated} product link row(s) to variant_master_values.` : 'Product links already use variant_master_values.');
            fetchRows();
        } catch (err) {
            showApiError(err, 'Failed to migrate product variant links.');
        } finally {
            setImporting(false);
        }
    };

    const importLegacy = async () => {
        try {
            setImporting(true);
            const res = await api.post('variant-masters/import-legacy');
            const added = res.data?.data?.added_values ?? 0;
            showApiSuccess(res, added > 0 ? `Imported ${added} attribute(s) from legacy variants.` : 'Legacy variants are already synced.');
            fetchRows();
        } catch (err) {
            showApiError(err, 'Failed to import legacy variants.');
        } finally {
            setImporting(false);
        }
    };

    const columns = [
        { key: 'name', label: 'Variant type', sortable: false },
        {
            key: 'values',
            label: 'Attributes',
            sortable: false,
            render: (row) => (
                <div className="d-flex flex-wrap gap-1">
                    {(row.values || []).map((v) => (
                        <span key={v.id || v.value} className="ui-badge">{v.value}</span>
                    ))}
                </div>
            ),
        },
        {
            key: 'actions',
            label: '',
            width: 48,
            render: (row) => (
                <ActionMenu
                    id={row.id}
                    openId={openMenu}
                    setOpenId={setOpenMenu}
                    items={[
                        canEdit && { label: 'Edit', onClick: () => openEdit(row) },
                        (canEdit && canDelete) && { divider: true },
                        canDelete && { label: 'Delete', danger: true, onClick: () => requestDelete(row) },
                    ].filter(Boolean)}
                />
            ),
        },
    ];

    const formBody = (
        <>
            <FormRow cols={1}>
                <FormField label="Variant type name *" error={formErrors.name}>
                    <TextInput
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="e.g. Size, Color"
                    />
                </FormField>
            </FormRow>
            <FormRow cols={1}>
                <FormField label="Attributes *" error={formErrors.valuesText}>
                    <TextareaInput
                        rows={4}
                        value={form.valuesText}
                        onChange={(e) => setForm((f) => ({ ...f, valuesText: e.target.value }))}
                        placeholder="S, M, L, XL, XXL"
                    />
                    <small className="text-muted d-block mt-1">Comma-separated values used on products.</small>
                </FormField>
            </FormRow>
        </>
    );

    return (
        <PageLayout
            eyebrow="Product"
            title="Variant Types"
            actions={canAdd ? (
                <button type="button" className="ui-btn primary" onClick={openCreate}>
                    + Add variant type
                </button>
            ) : null}
        >
            <Toast toast={toast} />
            <p className="text-muted mb-4" style={{ fontSize: '0.9rem' }}>
                Define reusable variant types and attributes. Product stock, sales, and barcodes link through <code>variant_master_values</code> (column <code>variant_id</code> on product tables).
            </p>

            <div className="d-flex flex-wrap gap-3 mb-4 align-items-center">
                <TextInput
                    placeholder="Search variant types..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    style={{ maxWidth: 280 }}
                />
                {canAdd && (
                    <>
                        <button type="button" className="ui-btn ghost sm" disabled={importing} onClick={importLegacy}>
                            {importing ? 'Importing...' : 'Import & link legacy'}
                        </button>
                        <button type="button" className="ui-btn ghost sm" disabled={importing} onClick={migrateLinks}>
                            Link products only
                        </button>
                    </>
                )}
                <Link to="/products/create" className="ui-btn ghost sm">Back to products</Link>
            </div>

            <DataTable
                columns={columns}
                rows={paginated}
                loading={loading}
                emptyText="No variant types yet. Add Size, Color, etc."
            />

            <Pagination
                page={page}
                totalPages={totalPages}
                pageSize={pageSize}
                pageSizes={PAGE_SIZES}
                onPageChange={setPage}
                onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
                totalItems={filtered.length}
            />

            <Modal isOpen={addOpen} title="Add variant type" onClose={() => setAddOpen(false)} hideHint>
                {formBody}
                <div className="d-flex gap-2 mt-4">
                    <button type="button" className="ui-btn primary" disabled={saving} onClick={() => save(false)}>
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button type="button" className="ui-btn ghost" onClick={() => setAddOpen(false)}>Cancel</button>
                </div>
            </Modal>

            <Modal isOpen={editOpen} title="Edit variant type" onClose={() => setEditOpen(false)} hideHint>
                {editLoading ? (
                    <div className="ui-loading py-4">Loading variant type…</div>
                ) : (
                    <>
                        {formBody}
                        <div className="d-flex gap-2 mt-4">
                            <button type="button" className="ui-btn primary" disabled={saving} onClick={() => save(true)}>
                                {saving ? 'Saving...' : 'Update'}
                            </button>
                            <button type="button" className="ui-btn ghost" onClick={() => setEditOpen(false)}>Cancel</button>
                        </div>
                    </>
                )}
            </Modal>

            {deleteId && (
                <ConfirmModal
                    title="Delete variant type?"
                    message="This removes the master type. Existing products keep their saved variant combinations."
                    onConfirm={confirmDelete}
                    onClose={() => setDeleteId(null)}
                    danger
                />
            )}
        </PageLayout>
    );
};

export default VariantMasterManager;
