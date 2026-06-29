import React, { useState, useEffect, useMemo } from 'react';

import {
    PageLayout,
    DataTable,
    Modal,
    ConfirmModal,
    FormField,
    FormRow,
    TextInput,
    NumberInput,
    TextareaInput,
    CheckboxInput,
    Toast,
    useToast,
    ActionMenu,
    Pagination,
} from '../../../../components/ui';
import { api } from '../../../../services';
import authStore from '../../../../stores/authStore';
import usePermissions from '../../../../stores/usePermissions';

const PAGE_SIZES = [10, 25, 50];

const EMPTY_FORM = {
    name: '',
    description: '',
    width: '',
    height: '',
    top_margin: '0',
    left_margin: '0',
    paper_width: '',
    paper_height: '',
    stickers_in_one_row: '',
    stickers_in_one_sheet: '',
    row_distance: '0',
    col_distance: '0',
    is_continuous: false,
    is_default: false,
};

function hasBarcodeAccess(permissions) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.some(
        (p) =>
            p === 'barcode_setting' ||
            p === 'barcode-settings' ||
            p.startsWith('barcode-settings.') ||
            p.startsWith('barcodes.')
    );
}

const BarcodeSettingManager = ({ controllerName }) => {
    const ctrl =
        controllerName === 'barcode-settings' || controllerName === 'barcodes'
            ? 'barcode-settings'
            : (controllerName || 'barcode-settings');
    const perms = usePermissions(ctrl);
    const authPerms = authStore.getPermissions();
    const legacyAccess = hasBarcodeAccess(authPerms);
    const canView = perms.canView || legacyAccess;
    const canAdd = perms.canAdd || legacyAccess;
    const canEdit = perms.canEdit || legacyAccess;
    const canDelete = perms.canDelete || legacyAccess;

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [sortCol, setSortCol] = useState('name');
    const [sortDir, setSortDir] = useState('asc');
    const [search, setSearch] = useState('');
    const [openMenu, setOpenMenu] = useState(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const { toast, showToast } = useToast();

    const setField = (name) => (e) => {
        const { type, value, checked } = e.target;
        setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    };

    useEffect(() => {
        fetchRows();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchRows = async () => {
        try {
            setLoading(true);
            const res = await api.get('barcodes');
            const data = res.data?.data ?? res.data ?? [];
            setRows(Array.isArray(data) ? data : []);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to load barcode settings.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredAndSorted = useMemo(() => {
        let list = [...rows];
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                (r) =>
                    (r.name || '').toLowerCase().includes(q) ||
                    (r.description || '').toLowerCase().includes(q)
            );
        }
        list.sort((a, b) => {
            const va = String(a[sortCol] ?? '').toLowerCase();
            const vb = String(b[sortCol] ?? '').toLowerCase();
            if (va < vb) return sortDir === 'asc' ? -1 : 1;
            if (va > vb) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
        return list;
    }, [rows, search, sortCol, sortDir]);

    const paginated = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredAndSorted.slice(start, start + pageSize);
    }, [filteredAndSorted, page, pageSize]);

    const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize) || 1);

    const mapToForm = (item) => ({
        ...EMPTY_FORM,
        name: item.name ?? '',
        description: item.description ?? '',
        width: item.width ?? '',
        height: item.height ?? '',
        top_margin: item.top_margin ?? '0',
        left_margin: item.left_margin ?? '0',
        paper_width: item.paper_width ?? '',
        paper_height: item.paper_height ?? '',
        stickers_in_one_row: item.stickers_in_one_row ?? '',
        stickers_in_one_sheet: item.stickers_in_one_sheet ?? '',
        row_distance: item.row_distance ?? '0',
        col_distance: item.col_distance ?? '0',
        is_continuous: !!item.is_continuous,
        is_default: !!item.is_default,
    });

    const validate = () => {
        const errors = {};
        if (!form.name?.trim()) errors.name = 'Name is required.';
        if (!form.width) errors.width = 'Sticker width is required.';
        if (!form.height) errors.height = 'Sticker height is required.';
        if (!form.paper_width) errors.paper_width = 'Paper width is required.';
        if (!form.stickers_in_one_row) errors.stickers_in_one_row = 'Stickers per row is required.';
        if (!form.is_continuous && !form.stickers_in_one_sheet) {
            errors.stickers_in_one_sheet = 'Stickers per sheet is required.';
        }
        if (!form.is_continuous && !form.paper_height) {
            errors.paper_height = 'Paper height is required.';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const buildPayload = () => ({
        name: form.name.trim(),
        description: form.description?.trim() || '',
        width: Number(form.width),
        height: Number(form.height),
        top_margin: Number(form.top_margin || 0),
        left_margin: Number(form.left_margin || 0),
        paper_width: Number(form.paper_width),
        paper_height: form.is_continuous ? 0 : Number(form.paper_height || 0),
        stickers_in_one_row: Number(form.stickers_in_one_row),
        stickers_in_one_sheet: form.is_continuous ? 28 : Number(form.stickers_in_one_sheet || 1),
        row_distance: Number(form.row_distance || 0),
        col_distance: Number(form.col_distance || 0),
        is_continuous: form.is_continuous ? 1 : 0,
        is_default: form.is_default ? 1 : 0,
        is_custom: 1,
    });

    const handleOpenAdd = () => {
        setForm(EMPTY_FORM);
        setFormErrors({});
        setIsEditing(false);
        setEditId(null);
        setModalOpen(true);
    };

    const handleOpenEdit = async (row) => {
        try {
            const res = await api.get(`barcodes/${row.id}/edit`);
            const data = res.data?.data ?? row;
            setForm(mapToForm(data));
            setFormErrors({});
            setIsEditing(true);
            setEditId(row.id);
            setModalOpen(true);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to load setting.', 'error');
        }
    };

    const handleSave = async () => {
        if (!validate()) return;
        try {
            setSaving(true);
            const payload = buildPayload();
            const res = isEditing
                ? await api.put(`barcodes/${editId}`, payload)
                : await api.post('barcodes', payload);
            showToast(res.data?.message || 'Barcode setting saved.', 'success');
            setModalOpen(false);
            fetchRows();
        } catch (err) {
            if (err.response?.data?.errors) setFormErrors(err.response.data.errors);
            else showToast(err.response?.data?.message || 'Failed to save setting.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`barcodes/${id}`);
            showToast('Barcode setting deleted.', 'success');
            setDeleteId(null);
            fetchRows();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to delete setting.', 'error');
        }
    };

    const handleSetDefault = async (id) => {
        try {
            await api.post(`barcodes/${id}/set-default`);
            showToast('Default barcode setting updated.', 'success');
            fetchRows();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to set default.', 'error');
        }
    };

    const columns = [
        { label: 'Name', key: 'name', sortable: true },
        { label: 'Description', key: 'description', sortable: true },
        {
            label: 'Size (W × H)',
            key: 'size',
            render: (row) => `${row.width}" × ${row.height}"`,
        },
        {
            label: 'Type',
            key: 'is_continuous',
            render: (row) =>
                row.is_continuous ? (
                    <span className="ui-badge info">Continuous roll</span>
                ) : (
                    <span className="ui-badge ghost">Sheet</span>
                ),
        },
        {
            label: 'Default',
            key: 'is_default',
            render: (row) =>
                row.is_default ? (
                    <span className="ui-badge success">Default</span>
                ) : (
                    <span className="ui-badge ghost">—</span>
                ),
        },
        {
            label: 'Action',
            key: 'action',
            render: (row) => {
                const items = [
                    !row.is_default &&
                        canEdit && {
                            label: 'Set default',
                            onClick: () => handleSetDefault(row.id),
                        },
                    canEdit && {
                        label: '✎ Edit',
                        onClick: () => handleOpenEdit(row),
                    },
                    canDelete &&
                        !row.is_default && {
                            label: '🗑 Delete',
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
            <PageLayout title="Barcode Settings">
                <p>You do not have permission to view barcode settings.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout
            title="Barcode Settings"
            actions={
                canAdd ? (
                    <button type="button" className="ui-btn primary" onClick={handleOpenAdd}>
                        Add New Setting
                    </button>
                ) : null
            }
        >
            <Toast toast={toast} />

            <DataTable
                columns={columns}
                rows={paginated}
                loading={loading}
                search={search}
                onSearchChange={(v) => {
                    setSearch(v);
                    setPage(1);
                }}
                sortCol={sortCol}
                sortDir={sortDir}
                onSort={(col) => {
                    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
                    else {
                        setSortCol(col);
                        setSortDir('asc');
                    }
                }}
            />

            <Pagination
                page={page}
                totalPages={totalPages}
                pageSize={pageSize}
                pageSizes={PAGE_SIZES}
                totalItems={filteredAndSorted.length}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPage(1);
                }}
            />

            {modalOpen && (
            <Modal
                title={isEditing ? 'Edit Barcode Sticker Setting' : 'Add Barcode Sticker Setting'}
                onClose={() => setModalOpen(false)}
                footer={
                    <>
                        <button type="button" className="ui-btn ghost" onClick={() => setModalOpen(false)}>
                            Cancel
                        </button>
                        {(isEditing ? canEdit : canAdd) && (
                            <button type="button" className="ui-btn primary" disabled={saving} onClick={handleSave}>
                                {saving ? 'Saving…' : 'Submit'}
                            </button>
                        )}
                    </>
                }
            >
                <FormRow cols={1}>
                    <FormField label="Sticker Sheet Setting Name" required error={formErrors.name}>
                        <TextInput value={form.name} onChange={setField('name')} />
                    </FormField>
                </FormRow>
                <FormRow cols={1}>
                    <FormField label="Description" error={formErrors.description}>
                        <TextareaInput value={form.description} onChange={setField('description')} rows={3} />
                    </FormField>
                </FormRow>
                <FormRow cols={2}>
                    <FormField label="">
                        <CheckboxInput
                            label="Continuous feed or rolls"
                            checked={form.is_continuous}
                            onChange={setField('is_continuous')}
                        />
                    </FormField>
                    <FormField label="">
                        <CheckboxInput
                            label="Set as default"
                            checked={form.is_default}
                            onChange={setField('is_default')}
                        />
                    </FormField>
                </FormRow>

                <p className="ui-modal-hint" style={{ margin: '12px 0 8px' }}>
                    Sticker dimensions (in inches)
                </p>
                <FormRow cols={2}>
                    <FormField label="Width of sticker" required error={formErrors.width}>
                        <NumberInput value={form.width} onChange={setField('width')} min={0.1} step={0.00001} />
                    </FormField>
                    <FormField label="Height of sticker" required error={formErrors.height}>
                        <NumberInput value={form.height} onChange={setField('height')} min={0.1} step={0.00001} />
                    </FormField>
                </FormRow>

                <p className="ui-modal-hint" style={{ margin: '12px 0 8px' }}>
                    Margins (in inches) — 0.1&nbsp;cm ≈ 0.0394&nbsp;in
                </p>
                <FormRow cols={2}>
                    <FormField label="Additional top margin" required error={formErrors.top_margin}>
                        <NumberInput value={form.top_margin} onChange={setField('top_margin')} min={0} step={0.00001} />
                    </FormField>
                    <FormField label="Additional left margin" required error={formErrors.left_margin}>
                        <NumberInput value={form.left_margin} onChange={setField('left_margin')} min={0} step={0.00001} />
                    </FormField>
                </FormRow>

                <p className="ui-modal-hint" style={{ margin: '12px 0 8px' }}>
                    Paper settings (in inches) — for continuous roll, paper width is the roll width (e.g. 3.5&quot;)
                </p>
                <FormRow cols={2}>
                    <FormField label="Paper width" required error={formErrors.paper_width}>
                        <NumberInput value={form.paper_width} onChange={setField('paper_width')} min={0.1} step={0.00001} />
                    </FormField>
                    {!form.is_continuous && (
                        <FormField label="Paper height" required error={formErrors.paper_height}>
                            <NumberInput value={form.paper_height} onChange={setField('paper_height')} min={0.1} step={0.00001} />
                        </FormField>
                    )}
                </FormRow>

                <p className="ui-modal-hint" style={{ margin: '12px 0 8px' }}>
                    Layout settings — column gap &amp; row gap (0.1&nbsp;cm ≈ 0.0394&nbsp;in)
                </p>
                <FormRow cols={2}>
                    <FormField label="Stickers in one row" required error={formErrors.stickers_in_one_row}>
                        <NumberInput value={form.stickers_in_one_row} onChange={setField('stickers_in_one_row')} min={1} step={1} />
                    </FormField>
                    {!form.is_continuous && (
                        <FormField label="No of stickers per sheet" required error={formErrors.stickers_in_one_sheet}>
                            <NumberInput value={form.stickers_in_one_sheet} onChange={setField('stickers_in_one_sheet')} min={1} step={1} />
                        </FormField>
                    )}
                </FormRow>
                <FormRow cols={2}>
                    <FormField label="Distance between two rows" required error={formErrors.row_distance}>
                        <NumberInput value={form.row_distance} onChange={setField('row_distance')} min={0} step={0.00001} />
                    </FormField>
                    <FormField label="Distance between two columns" required error={formErrors.col_distance}>
                        <NumberInput value={form.col_distance} onChange={setField('col_distance')} min={0} step={0.00001} />
                    </FormField>
                </FormRow>
            </Modal>
            )}

            {deleteId && (
            <ConfirmModal
                title="Delete barcode setting?"
                message="This action cannot be undone."
                danger
                onConfirm={() => handleDelete(deleteId)}
                onClose={() => setDeleteId(null)}
            />
            )}
        </PageLayout>
    );
};

export default BarcodeSettingManager;
