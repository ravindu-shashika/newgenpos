import React, { useState, useEffect, useMemo } from 'react';

import {
    PageLayout,
    DataTable,
    Modal,
    ConfirmModal,
    FormField,
    TextInput,
    TextareaInput,
    CheckboxInput,
    Toast,
    useToast,
    ActionMenu,
    Pagination,
} from '../../../components/ui';
import { api } from '../../../services';
import usePermissions from '../../../stores/usePermissions';

const PAGE_SIZES = [10, 25, 50];

const CONTENT_HINT = `You can set following dynamic tags for a template:
[reference], [customer], [sale_status], [payment_status], [sale_total]

Example:
Hi [customer],
Thanks for the order. Order reference: [reference]. Order status: [sale_status] Sale Total: [sale_total]. Payment status: [payment_status].`;

const EMPTY_FORM = {
    id: null,
    name: '',
    content: '',
    is_default: false,
    is_default_ecommerce: false,
};

const SmsTemplateManager = ({ controllerName }) => {
    const ctrl = controllerName === 'sms-templates' ? 'smstemplates' : (controllerName || 'smstemplates');
    const { canAdd, canEdit, canDelete } = usePermissions(ctrl);

    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [sortCol, setSortCol] = useState('name');
    const [sortDir, setSortDir] = useState('asc');
    const [search, setSearch] = useState('');
    const [openMenu, setOpenMenu] = useState(null);

    const [addOpen, setAddOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const { toast, showToast } = useToast();

    const setField = (name) => (e) =>
        setForm((f) => ({
            ...f,
            [name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
        }));

    const filteredTemplates = useMemo(() => {
        let list = [...templates];
        if (search) {
            const low = search.toLowerCase();
            list = list.filter(
                (t) =>
                    (t.name || '').toLowerCase().includes(low) ||
                    (t.content || '').toLowerCase().includes(low)
            );
        }
        list.sort((a, b) => {
            const valA = (a[sortCol] ?? '').toString().toLowerCase();
            const valB = (b[sortCol] ?? '').toString().toLowerCase();
            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
        return list;
    }, [templates, search, sortCol, sortDir]);

    const paginatedTemplates = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredTemplates.slice(start, start + pageSize);
    }, [filteredTemplates, page, pageSize]);

    const totalPages = Math.max(1, Math.ceil(filteredTemplates.length / pageSize));

    useEffect(() => {
        fetchTemplates();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const res = await api.get('smstemplates');
            const data = res.data?.data ?? res.data ?? [];
            setTemplates(Array.isArray(data) ? data : []);
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to load SMS templates.';
            showToast(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setFormErrors({});
    };

    const validateForm = () => {
        const errors = {};
        if (!form.name?.trim()) errors.name = 'Name is required';
        if (!form.content?.trim()) errors.content = 'Content is required';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCreate = async () => {
        if (!validateForm()) return;
        try {
            setSaving(true);
            const res = await api.post('smstemplates', {
                name: form.name.trim(),
                content: form.content.trim(),
                is_default: form.is_default,
                is_default_ecommerce: form.is_default_ecommerce,
            });
            showToast(res.data?.message || 'Template created.', 'success');
            setAddOpen(false);
            resetForm();
            fetchTemplates();
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                err.response?.data?.errors?.name?.[0] ||
                'Failed to create template.';
            showToast(msg, 'error');
        } finally {
            setSaving(false);
        }
    };

    const openEdit = (row) => {
        setForm({
            id: row.id,
            name: row.name || '',
            content: row.content || '',
            is_default: !!row.is_default,
            is_default_ecommerce: !!row.is_default_ecommerce,
        });
        setFormErrors({});
        setEditOpen(true);
    };

    const handleUpdate = async () => {
        if (!validateForm() || !form.id) return;
        try {
            setSaving(true);
            const res = await api.put(`smstemplates/${form.id}`, {
                smstemplate_id: form.id,
                name: form.name.trim(),
                content: form.content.trim(),
                is_default: form.is_default,
                is_default_ecommerce: form.is_default_ecommerce,
            });
            showToast(res.data?.message || 'Template updated.', 'success');
            setEditOpen(false);
            resetForm();
            fetchTemplates();
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                err.response?.data?.errors?.name?.[0] ||
                'Failed to update template.';
            showToast(msg, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await api.delete(`smstemplates/${deleteId}`);
            showToast(res.data?.message || 'Template deleted.', 'success');
            setDeleteId(null);
            fetchTemplates();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to delete template.';
            showToast(msg, 'error');
        }
    };

    const renderFormFields = () => (
        <>
            <FormField label="Name *" error={formErrors.name}>
                <TextInput
                    value={form.name}
                    onChange={setField('name')}
                    placeholder="Template Name"
                />
            </FormField>
            <FormField label="Content *" error={formErrors.content}>
                <TextareaInput
                    rows={7}
                    value={form.content}
                    onChange={setField('content')}
                    placeholder={CONTENT_HINT}
                />
            </FormField>
            <FormField>
                <CheckboxInput
                    label="Default SMS Sale"
                    checked={form.is_default}
                    onChange={setField('is_default')}
                />
            </FormField>
            <FormField>
                <CheckboxInput
                    label="Default SMS E-Commerce"
                    checked={form.is_default_ecommerce}
                    onChange={setField('is_default_ecommerce')}
                />
            </FormField>
        </>
    );

    const columns = [
        { key: 'name', label: 'Name', sortable: true },
        {
            key: 'content',
            label: 'Content',
            sortable: true,
            render: (row) => (
                <span
                    style={{
                        display: 'inline-block',
                        maxWidth: 360,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                    title={row.content}
                >
                    {row.content || '—'}
                </span>
            ),
        },
        {
            key: 'is_default',
            label: 'Default',
            render: (row) =>
                row.is_default ? (
                    <span className="ui-badge success">Default</span>
                ) : (
                    '—'
                ),
        },
        {
            key: 'is_default_ecommerce',
            label: 'Default Online',
            render: (row) =>
                row.is_default_ecommerce ? (
                    <span className="ui-badge success">Default</span>
                ) : (
                    '—'
                ),
        },
        {
            key: 'actions',
            label: 'Action',
            align: 'right',
            render: (row) => (
                <ActionMenu
                    id={row.id}
                    openId={openMenu}
                    setOpenId={setOpenMenu}
                    items={[
                        canEdit && {
                            label: '✎ Edit',
                            onClick: () => openEdit(row),
                        },
                        canDelete && {
                            label: '🗑 Delete',
                            danger: true,
                            onClick: () => setDeleteId(row.id),
                        },
                    ].filter(Boolean)}
                />
            ),
        },
    ];

    return (
        <PageLayout
            title="SMS Template"
            onClick={(e) => { if (!e.target.closest('.ui-action-wrap')) setOpenMenu(null); }}
            actions={
                canAdd ? (
                    <button
                        type="button"
                        className="ui-btn primary"
                        onClick={() => {
                            resetForm();
                            setAddOpen(true);
                        }}
                    >
                        + Add Template
                    </button>
                ) : null
            }
        >
            <Toast toast={toast} />

            <div className="ui-toolbar">
                <input
                    className="ui-search"
                    placeholder="Search by name or content…"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                />
            </div>

            <DataTable
                columns={columns}
                rows={paginatedTemplates}
                loading={loading}
                emptyText="No SMS templates found"
                emptyIcon="💬"
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
                totalRows={filteredTemplates.length}
                onChange={setPage}
                onPageSize={(size) => {
                    setPageSize(size);
                    setPage(1);
                }}
            />

            {addOpen && (
                <Modal
                    title="Add Template"
                    onClose={() => {
                        setAddOpen(false);
                        resetForm();
                    }}
                    footer={
                        <>
                            <button type="button" className="ui-btn ghost" onClick={() => setAddOpen(false)}>
                                Cancel
                            </button>
                            <button type="button" className="ui-btn primary" disabled={saving} onClick={handleCreate}>
                                {saving ? 'Saving…' : 'Save'}
                            </button>
                        </>
                    }
                >
                    {renderFormFields()}
                </Modal>
            )}

            {editOpen && (
                <Modal
                    title="Update Template"
                    onClose={() => {
                        setEditOpen(false);
                        resetForm();
                    }}
                    footer={
                        <>
                            <button type="button" className="ui-btn ghost" onClick={() => setEditOpen(false)}>
                                Cancel
                            </button>
                            <button type="button" className="ui-btn primary" disabled={saving} onClick={handleUpdate}>
                                {saving ? 'Saving…' : 'Update'}
                            </button>
                        </>
                    }
                >
                    {renderFormFields()}
                </Modal>
            )}

            {deleteId && (
                <ConfirmModal
                    title="Delete Template"
                    message="Are you sure you want to delete this SMS template?"
                    danger
                    onConfirm={handleDelete}
                    onClose={() => setDeleteId(null)}
                />
            )}
        </PageLayout>
    );
};

export default SmsTemplateManager;
