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
    start_time: '',
    end_time: '',
    grace_in: '0',
    grace_out: '0',
    shift_id: null,
};

function hasShiftAccess(permissions) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.some(
        (p) =>
            p === 'shift' ||
            p === 'shifts' ||
            p.startsWith('shifts.')
    );
}

function toTimeInputValue(time) {
    if (!time) return '';
    const str = String(time);
    const match = str.match(/(\d{1,2}):(\d{2})/);
    if (match) {
        return `${match[1].padStart(2, '0')}:${match[2]}`;
    }
    return '';
}

function formatTimeDisplay(time) {
    const value = toTimeInputValue(time);
    if (!value) return '—';
    const [h, m] = value.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

const ShiftManager = ({ controllerName }) => {
    const ctrl = controllerName === 'shifts' ? 'shifts' : (controllerName || 'shift');
    const perms = usePermissions(ctrl);
    const authPerms = authStore.getPermissions();
    const legacyAccess = hasShiftAccess(authPerms);
    const canView = perms.canView || legacyAccess;
    const canAdd = perms.canAdd || legacyAccess;
    const canEdit = perms.canEdit || legacyAccess;
    const canDelete = perms.canDelete || legacyAccess;

    const [rows, setRows] = useState([]);
    const [defaults, setDefaults] = useState({ start_time: '09:00', end_time: '18:00' });
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [sortCol, setSortCol] = useState('name');
    const [sortDir, setSortDir] = useState('asc');
    const [selected, setSelected] = useState(new Set());
    const [openMenu, setOpenMenu] = useState(null);

    const [addOpen, setAddOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

    const [form, setForm] = useState(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const { toast, showToast } = useToast();

    const setField = (name) => (e) =>
        setForm((f) => ({ ...f, [name]: e.target.value }));

    useEffect(() => {
        fetchShifts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchShifts = async () => {
        try {
            setLoading(true);
            const res = await api.get('shift');
            const data = res.data?.data ?? res.data ?? [];
            setRows(Array.isArray(data) ? data : []);
            if (res.data?.defaults) {
                setDefaults({
                    start_time: toTimeInputValue(res.data.defaults.start_time) || '09:00',
                    end_time: toTimeInputValue(res.data.defaults.end_time) || '18:00',
                });
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to load shifts.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredAndSorted = useMemo(() => {
        let list = [...rows];
        list.sort((a, b) => {
            const va = String(a[sortCol] ?? '').toLowerCase();
            const vb = String(b[sortCol] ?? '').toLowerCase();
            if (va < vb) return sortDir === 'asc' ? -1 : 1;
            if (va > vb) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
        return list;
    }, [rows, sortCol, sortDir]);

    const paginated = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredAndSorted.slice(start, start + pageSize);
    }, [filteredAndSorted, page, pageSize]);

    const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize) || 1);

    const toggleRow = (id) =>
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    const toggleAll = () => {
        const ids = paginated.map((r) => r.id);
        const allSelected = ids.length > 0 && ids.every((id) => selected.has(id));
        setSelected((prev) => {
            const next = new Set(prev);
            ids.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
            return next;
        });
    };

    const resetForm = (useDefaults = false) => {
        setForm({
            ...EMPTY_FORM,
            start_time: useDefaults ? defaults.start_time : '',
            end_time: useDefaults ? defaults.end_time : '',
        });
        setFormErrors({});
    };

    const validate = () => {
        const errors = {};
        if (!form.name?.trim()) errors.name = 'Shift name is required.';
        if (!form.start_time) errors.start_time = 'Start time is required.';
        if (!form.end_time) errors.end_time = 'End time is required.';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const buildPayload = () => ({
        name: form.name.trim(),
        start_time: form.start_time,
        end_time: form.end_time,
        grace_in: Number(form.grace_in || 0),
        grace_out: Number(form.grace_out || 0),
    });

    const handleAdd = async () => {
        if (!validate()) return;
        try {
            setSaving(true);
            const res = await api.post('shift', buildPayload());
            showToast(res.data?.message || 'Shift created.', 'success');
            setAddOpen(false);
            resetForm();
            fetchShifts();
        } catch (err) {
            if (err.response?.data?.errors) setFormErrors(err.response.data.errors);
            else showToast(err.response?.data?.message || 'Failed to create shift.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const openEdit = (row) => {
        setForm({
            name: row.name || '',
            start_time: toTimeInputValue(row.start_time),
            end_time: toTimeInputValue(row.end_time),
            grace_in: String(row.grace_in ?? 0),
            grace_out: String(row.grace_out ?? 0),
            shift_id: row.id,
        });
        setFormErrors({});
        setEditOpen(true);
    };

    const handleUpdate = async () => {
        if (!validate() || !form.shift_id) return;
        try {
            setSaving(true);
            const res = await api.put(`shift/${form.shift_id}`, {
                ...buildPayload(),
                shift_id: form.shift_id,
            });
            showToast(res.data?.message || 'Shift updated.', 'success');
            setEditOpen(false);
            resetForm();
            fetchShifts();
        } catch (err) {
            if (err.response?.data?.errors) setFormErrors(err.response.data.errors);
            else showToast(err.response?.data?.message || 'Failed to update shift.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await api.delete(`shift/${deleteId}`);
            showToast(res.data?.message || 'Shift deleted.', 'success');
            setDeleteId(null);
            setSelected((prev) => {
                const next = new Set(prev);
                next.delete(deleteId);
                return next;
            });
            fetchShifts();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to delete shift.', 'error');
        }
    };

    const handleBulkDelete = async () => {
        try {
            const res = await api.post('shift/deletebyselection', {
                shiftIdArray: [...selected],
            });
            showToast(res.data?.message || `${selected.size} shift(s) deleted.`, 'success');
            setBulkDeleteOpen(false);
            setSelected(new Set());
            fetchShifts();
        } catch (err) {
            showToast(err.response?.data?.message || 'Bulk delete failed.', 'error');
        }
    };

    const renderFormFields = () => (
        <>
            <FormField label="Name" required error={formErrors.name}>
                <TextInput
                    value={form.name}
                    onChange={setField('name')}
                    placeholder="Type shift name"
                />
            </FormField>
            <FormRow cols={2}>
                <FormField label="Start time" required error={formErrors.start_time}>
                    <TextInput type="time" value={form.start_time} onChange={setField('start_time')} />
                </FormField>
                <FormField label="End time" required error={formErrors.end_time}>
                    <TextInput type="time" value={form.end_time} onChange={setField('end_time')} />
                </FormField>
            </FormRow>
            <FormRow cols={2}>
                <FormField label="Grace in (min)" error={formErrors.grace_in}>
                    <NumberInput value={form.grace_in} onChange={setField('grace_in')} min={0} step={1} />
                </FormField>
                <FormField label="Grace out (min)" error={formErrors.grace_out}>
                    <NumberInput value={form.grace_out} onChange={setField('grace_out')} min={0} step={1} />
                </FormField>
            </FormRow>
        </>
    );

    const columns = [
        { label: 'Shift', key: 'name', sortable: true },
        {
            label: 'Start time',
            key: 'start_time',
            sortable: true,
            render: (row) => formatTimeDisplay(row.start_time),
        },
        {
            label: 'End time',
            key: 'end_time',
            sortable: true,
            render: (row) => formatTimeDisplay(row.end_time),
        },
        { label: 'Grace in (min)', key: 'grace_in', sortable: true },
        { label: 'Grace out (min)', key: 'grace_out', sortable: true },
        {
            label: 'Action',
            key: 'action',
            render: (row) => (
                <ActionMenu
                    id={row.id}
                    openId={openMenu}
                    setOpenId={setOpenMenu}
                    items={[
                        canEdit && { label: '✎ Edit', onClick: () => openEdit(row) },
                        canEdit && canDelete && { divider: true },
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

    if (!canView) {
        return (
            <PageLayout title="Shift">
                <p>You do not have permission to view shifts.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout
            title="Shift"
            onClick={(e) => {
                if (!e.target.closest('.ui-action-wrap')) setOpenMenu(null);
            }}
            actions={
                <>
                    {canAdd && (
                        <button
                            type="button"
                            className="ui-btn primary"
                            onClick={() => {
                                resetForm(true);
                                setAddOpen(true);
                            }}
                        >
                            Add Shift
                        </button>
                    )}
                    {selected.size > 0 && canDelete && (
                        <button type="button" className="ui-btn danger" onClick={() => setBulkDeleteOpen(true)}>
                            Delete Selected ({selected.size})
                        </button>
                    )}
                </>
            }
        >
            <Toast toast={toast} />

            <DataTable
                columns={columns}
                rows={paginated}
                loading={loading}
                sortCol={sortCol}
                sortDir={sortDir}
                onSort={(col) => {
                    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
                    else {
                        setSortCol(col);
                        setSortDir('asc');
                    }
                }}
                selected={canDelete ? selected : undefined}
                onToggleRow={canDelete ? toggleRow : undefined}
                onToggleAll={canDelete ? toggleAll : undefined}
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

            {addOpen && (
                <Modal
                    title="Add Shift"
                    onClose={() => setAddOpen(false)}
                    footer={
                        <>
                            <button type="button" className="ui-btn ghost" onClick={() => setAddOpen(false)}>
                                Cancel
                            </button>
                            {canAdd && (
                                <button type="button" className="ui-btn primary" disabled={saving} onClick={handleAdd}>
                                    {saving ? 'Saving…' : 'Submit'}
                                </button>
                            )}
                        </>
                    }
                >
                    {renderFormFields()}
                </Modal>
            )}

            {editOpen && (
                <Modal
                    title="Update Shift"
                    onClose={() => setEditOpen(false)}
                    footer={
                        <>
                            <button type="button" className="ui-btn ghost" onClick={() => setEditOpen(false)}>
                                Cancel
                            </button>
                            {canEdit && (
                                <button type="button" className="ui-btn primary" disabled={saving} onClick={handleUpdate}>
                                    {saving ? 'Saving…' : 'Submit'}
                                </button>
                            )}
                        </>
                    }
                >
                    {renderFormFields()}
                </Modal>
            )}

            {deleteId && (
                <ConfirmModal
                    title="Delete shift?"
                    message="Are you sure you want to delete this shift?"
                    danger
                    onConfirm={handleDelete}
                    onClose={() => setDeleteId(null)}
                />
            )}

            {bulkDeleteOpen && (
                <ConfirmModal
                    title="Delete selected shifts?"
                    message={`Are you sure you want to delete ${selected.size} shift(s)?`}
                    danger
                    onConfirm={handleBulkDelete}
                    onClose={() => setBulkDeleteOpen(false)}
                />
            )}
        </PageLayout>
    );
};

export default ShiftManager;
