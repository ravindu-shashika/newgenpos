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
    SelectInput,
    Toast,
    useToast,
    ActionMenu,
    Pagination,
} from '../../../components/ui';
import { api } from '../../../services';
import usePermissions from '../../../stores/usePermissions';

const PAGE_SIZES = [10, 25, 50];

const EMPTY_FORM = {
    id: null,
    name: '',
    number_of_person: '',
    description: '',
    floor_id: '',
};

const TableManager = ({ controllerName }) => {
    const ctrl = controllerName || 'tables';
    const { canAdd, canEdit, canDelete } = usePermissions(ctrl);

    const [tables, setTables] = useState([]);
    const [metadata, setMetadata] = useState({ restaurant_enabled: false, floors: [] });
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
        setForm((f) => ({ ...f, [name]: e.target.value }));

    const floorOptions = useMemo(
        () => metadata.floors.map((f) => ({ value: String(f.id), label: f.name })),
        [metadata.floors]
    );

    useEffect(() => {
        fetchTables();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchTables = async () => {
        try {
            setLoading(true);
            const res = await api.get('tables');
            const data = res.data?.data ?? res.data ?? [];
            setTables(Array.isArray(data) ? data : []);
            if (res.data?.metadata) {
                setMetadata(res.data.metadata);
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to load tables.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setForm({
            ...EMPTY_FORM,
            floor_id: floorOptions[0]?.value || '',
        });
        setFormErrors({});
    };

    const validateForm = () => {
        const errors = {};
        if (!form.name?.trim()) errors.name = 'Name is required';
        if (!form.number_of_person && form.number_of_person !== 0) {
            errors.number_of_person = 'Number of person is required';
        }
        if (metadata.restaurant_enabled && !form.floor_id) {
            errors.floor_id = 'Floor is required';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCreate = async () => {
        if (!validateForm()) return;
        try {
            setSaving(true);
            const payload = {
                name: form.name.trim(),
                number_of_person: Number(form.number_of_person),
                description: form.description?.trim() || '',
            };
            if (metadata.restaurant_enabled) {
                payload.floor_id = Number(form.floor_id);
            }
            const res = await api.post('tables', payload);
            showToast(res.data?.message || 'Table created.', 'success');
            setAddOpen(false);
            resetForm();
            fetchTables();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to create table.';
            showToast(msg, 'error');
        } finally {
            setSaving(false);
        }
    };

    const openEdit = (row) => {
        setForm({
            id: row.id,
            name: row.name || '',
            number_of_person: row.number_of_person ?? '',
            description: row.description || '',
            floor_id: row.floor_id ? String(row.floor_id) : (floorOptions[0]?.value || ''),
        });
        setFormErrors({});
        setEditOpen(true);
    };

    const handleUpdate = async () => {
        if (!validateForm() || !form.id) return;
        try {
            setSaving(true);
            const payload = {
                table_id: form.id,
                name: form.name.trim(),
                number_of_person: Number(form.number_of_person),
                description: form.description?.trim() || '',
            };
            if (metadata.restaurant_enabled) {
                payload.floor_id = Number(form.floor_id);
            }
            const res = await api.put(`tables/${form.id}`, payload);
            showToast(res.data?.message || 'Table updated.', 'success');
            setEditOpen(false);
            resetForm();
            fetchTables();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to update table.';
            showToast(msg, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await api.delete(`tables/${deleteId}`);
            showToast(res.data?.message || 'Table deleted.', 'success');
            setDeleteId(null);
            fetchTables();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to delete table.', 'error');
        }
    };

    const filteredTables = useMemo(() => {
        let list = [...tables];
        if (search) {
            const low = search.toLowerCase();
            list = list.filter(
                (t) =>
                    (t.name || '').toLowerCase().includes(low) ||
                    (t.description || '').toLowerCase().includes(low) ||
                    (t.floor_name || '').toLowerCase().includes(low)
            );
        }
        list.sort((a, b) => {
            let valA = a[sortCol];
            let valB = b[sortCol];
            if (sortCol === 'floor_name') {
                valA = a.floor_name || '';
                valB = b.floor_name || '';
            }
            valA = (valA ?? '').toString().toLowerCase();
            valB = (valB ?? '').toString().toLowerCase();
            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
        return list;
    }, [tables, search, sortCol, sortDir]);

    const paginatedTables = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredTables.slice(start, start + pageSize);
    }, [filteredTables, page, pageSize]);

    const totalPages = Math.max(1, Math.ceil(filteredTables.length / pageSize));

    const columns = useMemo(() => {
        const cols = [
            { key: 'name', label: 'Name', sortable: true },
            { key: 'number_of_person', label: 'Number of Person', sortable: true },
            { key: 'description', label: 'Description', sortable: true },
        ];
        if (metadata.restaurant_enabled) {
            cols.push({
                key: 'floor_name',
                label: 'Floor',
                sortable: true,
                render: (row) => row.floor_name || '—',
            });
        }
        cols.push({
            key: 'actions',
            label: 'Action',
            align: 'right',
            render: (row) => (
                <ActionMenu
                    id={row.id}
                    openId={openMenu}
                    setOpenId={setOpenMenu}
                    items={[
                        canEdit && { label: '✎ Edit', onClick: () => openEdit(row) },
                        canDelete && {
                            label: '🗑 Delete',
                            danger: true,
                            onClick: () => setDeleteId(row.id),
                        },
                    ].filter(Boolean)}
                />
            ),
        });
        return cols;
    }, [metadata.restaurant_enabled, openMenu, canEdit, canDelete]);

    const renderFormFields = () => (
        <>
            <FormRow cols={2}>
                <FormField label="Name *" error={formErrors.name}>
                    <TextInput value={form.name} onChange={setField('name')} placeholder="Type table name" />
                </FormField>
                <FormField label="Number of Person *" error={formErrors.number_of_person}>
                    <NumberInput value={form.number_of_person} onChange={setField('number_of_person')} min={1} />
                </FormField>
            </FormRow>
            <FormField label="Description">
                <TextareaInput rows={4} value={form.description} onChange={setField('description')} />
            </FormField>
            {metadata.restaurant_enabled && (
                <FormField label="Floor *" error={formErrors.floor_id}>
                    <SelectInput
                        value={form.floor_id}
                        onChange={setField('floor_id')}
                        options={floorOptions}
                        placeholder="Select floor"
                    />
                </FormField>
            )}
        </>
    );

    return (
        <PageLayout
            title="Tables"
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
                        + Add Table
                    </button>
                ) : null
            }
        >
            <Toast toast={toast} />

            <div className="ui-toolbar">
                <input
                    className="ui-search"
                    placeholder="Search by name, description, or floor…"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                />
            </div>

            <DataTable
                columns={columns}
                rows={paginatedTables}
                loading={loading}
                emptyText="No tables found"
                emptyIcon="🪑"
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
                totalRows={filteredTables.length}
                onChange={setPage}
                onPageSize={(size) => {
                    setPageSize(size);
                    setPage(1);
                }}
            />

            {addOpen && (
                <Modal
                    title="Add Table"
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
                    title="Update Table"
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
                    title="Delete Table"
                    message="Are you sure you want to delete this table?"
                    danger
                    onConfirm={handleDelete}
                    onClose={() => setDeleteId(null)}
                />
            )}
        </PageLayout>
    );
};

export default TableManager;
