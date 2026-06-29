import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';

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
} from '../../../../components/ui';
import { api } from '../../../../services';
import authStore from '../../../../stores/authStore';
import usePermissions from '../../../../stores/usePermissions';

const PAGE_SIZES = [10, 25, 50];

const EMPTY_FORM = {
    language: '',
    name: '',
};

function hasLanguageAccess(permissions) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.some(
        (p) =>
            p === 'language_setting' ||
            p === 'languages' ||
            p.startsWith('languages.')
    );
}

const LanguageManager = ({ controllerName }) => {
    const ctrl = controllerName || 'languages';
    const perms = usePermissions(ctrl);
    const authPerms = authStore.getPermissions();
    const legacyAccess = hasLanguageAccess(authPerms);
    const canView = perms.canView || legacyAccess;
    const canAdd = perms.canAdd || legacyAccess;
    const canEdit = perms.canEdit || legacyAccess;
    const canDelete = perms.canDelete || legacyAccess;

    const [rows, setRows] = useState([]);
    const [defaultLanguage, setDefaultLanguage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [sortCol, setSortCol] = useState('name');
    const [sortDir, setSortDir] = useState('asc');
    const [search, setSearch] = useState('');
    const [openMenu, setOpenMenu] = useState(null);

    const [addForm, setAddForm] = useState(EMPTY_FORM);
    const [addErrors, setAddErrors] = useState({});
    const [adding, setAdding] = useState(false);

    const [editOpen, setEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({ ...EMPTY_FORM, id: null });
    const [editErrors, setEditErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const [deleteId, setDeleteId] = useState(null);

    const { toast, showToast } = useToast();

    const setAddField = (name) => (e) =>
        setAddForm((f) => ({ ...f, [name]: e.target.value }));

    const setEditField = (name) => (e) =>
        setEditForm((f) => ({ ...f, [name]: e.target.value }));

    useEffect(() => {
        fetchLanguages();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchLanguages = async () => {
        try {
            setLoading(true);
            const res = await api.get('languages');
            const data = res.data?.data ?? res.data ?? [];
            setRows(Array.isArray(data) ? data : []);
            setDefaultLanguage(res.data?.default_language ?? null);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to load languages.', 'error');
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
                    (r.language || '').toLowerCase().includes(q) ||
                    (r.name || '').toLowerCase().includes(q)
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

    const validateAdd = () => {
        const errors = {};
        if (!addForm.language?.trim()) errors.language = 'Language code is required.';
        if (!addForm.name?.trim()) errors.name = 'Language name is required.';
        setAddErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateEdit = () => {
        const errors = {};
        if (!editForm.language?.trim()) errors.language = 'Language code is required.';
        if (!editForm.name?.trim()) errors.name = 'Language name is required.';
        setEditErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleAdd = async () => {
        if (!validateAdd()) return;
        try {
            setAdding(true);
            const res = await api.post('languages/create', {
                language: addForm.language.trim(),
                name: addForm.name.trim(),
            });
            showToast(res.data?.message || res.data?.success || 'Language added.', 'success');
            setAddForm(EMPTY_FORM);
            setAddErrors({});
            fetchLanguages();
        } catch (err) {
            if (err.response?.data?.errors) setAddErrors(err.response.data.errors);
            else showToast(err.response?.data?.message || err.response?.data?.error || 'Failed to add language.', 'error');
        } finally {
            setAdding(false);
        }
    };

    const openEdit = (row) => {
        setEditForm({
            id: row.id,
            language: row.language || '',
            name: row.name || '',
        });
        setEditErrors({});
        setEditOpen(true);
    };

    const handleUpdate = async () => {
        if (!validateEdit() || !editForm.id) return;
        try {
            setSaving(true);
            const res = await api.put(`languages/${editForm.id}`, {
                language: editForm.language.trim(),
                name: editForm.name.trim(),
            });
            showToast(res.data?.message || res.data?.success || 'Language updated.', 'success');
            setEditOpen(false);
            fetchLanguages();
        } catch (err) {
            if (err.response?.data?.errors) setEditErrors(err.response.data.errors);
            else showToast(err.response?.data?.message || err.response?.data?.error || 'Failed to update language.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await api.delete(`languages/${deleteId}`);
            showToast(res.data?.message || res.data?.success || 'Language deleted.', 'success');
            setDeleteId(null);
            fetchLanguages();
        } catch (err) {
            showToast(err.response?.data?.message || err.response?.data?.error || 'Failed to delete language.', 'error');
        }
    };

    const handleSetDefault = async (id) => {
        try {
            const res = await api.post(`languages/${id}/set-default`);
            showToast(res.data?.message || res.data?.success || 'Default language updated.', 'success');
            fetchLanguages();
        } catch (err) {
            showToast(err.response?.data?.message || err.response?.data?.error || 'Failed to set default.', 'error');
        }
    };

    const columns = [
        { label: 'Locale', key: 'language', sortable: true },
        { label: 'Name', key: 'name', sortable: true },
        {
            label: 'Default',
            key: 'is_default',
            render: (row) =>
                row.is_default ? (
                    <span className="ui-badge success">Default</span>
                ) : canEdit ? (
                    <button type="button" className="ui-btn ghost sm" onClick={() => handleSetDefault(row.id)}>
                        Set default
                    </button>
                ) : (
                    '—'
                ),
        },
        {
            label: 'Action',
            key: 'action',
            render: (row) => {
                const items = [
                    canEdit && { label: '✎ Edit', onClick: () => openEdit(row) },
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
            <PageLayout title="Languages">
                <p>You do not have permission to view languages.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout
            title="Languages"
            actions={
                rows.length > 0 ? (
                    <Link to="/translations" className="ui-btn primary">
                        Manage Translations
                    </Link>
                ) : null
            }
        >
            <Toast toast={toast} />

            {defaultLanguage && (
                <p className="ui-modal-hint" style={{ marginBottom: 16 }}>
                    Default language: <strong>{defaultLanguage.name}</strong> ({defaultLanguage.language})
                </p>
            )}

            {canAdd && (
                <div style={{ marginBottom: 20 }}>
                    <FormRow cols={3}>
                        <FormField label="Language code" required error={addErrors.language}>
                            <TextInput
                                value={addForm.language}
                                onChange={setAddField('language')}
                                placeholder="e.g. en"
                            />
                        </FormField>
                        <FormField label="Language name" required error={addErrors.name}>
                            <TextInput
                                value={addForm.name}
                                onChange={setAddField('name')}
                                placeholder="e.g. English"
                            />
                        </FormField>
                        <FormField label=" ">
                            <button
                                type="button"
                                className="ui-btn primary"
                                style={{ marginTop: 22 }}
                                disabled={adding}
                                onClick={handleAdd}
                            >
                                {adding ? 'Adding…' : 'Add Language'}
                            </button>
                        </FormField>
                    </FormRow>
                </div>
            )}

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

            {editOpen && (
                <Modal
                    title="Update Language"
                    onClose={() => setEditOpen(false)}
                    footer={
                        <>
                            <button type="button" className="ui-btn ghost" onClick={() => setEditOpen(false)}>
                                Cancel
                            </button>
                            {canEdit && (
                                <button type="button" className="ui-btn primary" disabled={saving} onClick={handleUpdate}>
                                    {saving ? 'Saving…' : 'Save changes'}
                                </button>
                            )}
                        </>
                    }
                >
                    <FormRow cols={1}>
                        <FormField label="Language code" required error={editErrors.language}>
                            <TextInput value={editForm.language} onChange={setEditField('language')} />
                        </FormField>
                    </FormRow>
                    <FormRow cols={1}>
                        <FormField label="Language name" required error={editErrors.name}>
                            <TextInput value={editForm.name} onChange={setEditField('name')} />
                        </FormField>
                    </FormRow>
                </Modal>
            )}

            {deleteId && (
                <ConfirmModal
                    title="Delete language?"
                    message="This will remove the language and its translations."
                    danger
                    onConfirm={handleDelete}
                    onClose={() => setDeleteId(null)}
                />
            )}
        </PageLayout>
    );
};

export default LanguageManager;
