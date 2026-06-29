import React, { useState, useEffect, useMemo } from 'react';

import {
    PageLayout,
    DataTable,
    Modal,
    ConfirmModal,
    FormField,
    FormRow,
    TextInput,
    TextareaInput,
    SelectInput,
    Toast,
    useToast,
    ActionMenu,
    Pagination,
    SelectionBar,
} from '../../../../components/ui';
import api from '../../../../services/api';
import authStore from '../../../../stores/authStore';
import usePermissions from '../../../../stores/usePermissions';

const PAGE_SIZES = [10, 25, 50, 100];

const RECURRING_OPTIONS = [
    { value: '0', label: 'No' },
    { value: '1', label: 'Yes' },
];

const INITIAL_FORM = {
    id: null,
    from_date: '',
    to_date: '',
    recurring: '0',
    region: '',
    note: '',
};

function hasHolidayPermission(permissions) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.includes('holiday') || list.includes('holidays');
}

const HolidayManager = ({ controllerName }) => {
    const ctrl = controllerName || 'holidays';
    const authPerms = authStore.getPermissions();
    const perms = usePermissions(ctrl);
    const legacyAccess = hasHolidayPermission(authPerms);
    const canApprove = legacyAccess || perms.canApprove;
    const canAdd = true;
    const canEdit = true;
    const canDelete = true;

    const [allRows, setAllRows] = useState([]);
    const [approvePermission, setApprovePermission] = useState(false);
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [sortCol, setSortCol] = useState('created_at_display');
    const [sortDir, setSortDir] = useState('desc');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(new Set());
    const [openMenu, setOpenMenu] = useState(null);

    const [addOpen, setAddOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [form, setForm] = useState(INITIAL_FORM);
    const [saving, setSaving] = useState(false);

    const { toast, showToast } = useToast();
    const patchForm = (patch) => setForm((f) => ({ ...f, ...patch }));

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get('holidays');
            setAllRows(res.data?.holidays || []);
            setApprovePermission(Boolean(res.data?.approve_permission));
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to load holidays.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const applyListResponse = (res) => {
        if (res.data?.holidays) setAllRows(res.data.holidays);
        if (res.data?.approve_permission !== undefined) {
            setApprovePermission(Boolean(res.data.approve_permission));
        }
    };

    const filteredRows = useMemo(() => {
        let rows = allRows;
        if (search.trim()) {
            const q = search.toLowerCase();
            rows = rows.filter((r) =>
                (r.user_name || '').toLowerCase().includes(q) ||
                (r.note || '').toLowerCase().includes(q) ||
                (r.region || '').toLowerCase().includes(q) ||
                (r.from_date_display || '').toLowerCase().includes(q) ||
                (r.to_date_display || '').toLowerCase().includes(q) ||
                (r.created_at_display || '').toLowerCase().includes(q)
            );
        }
        return [...rows].sort((a, b) => {
            const av = String(a[sortCol] ?? '').toLowerCase();
            const bv = String(b[sortCol] ?? '').toLowerCase();
            if (av < bv) return sortDir === 'asc' ? -1 : 1;
            if (av > bv) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
    }, [allRows, search, sortCol, sortDir]);

    const rows = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredRows.slice(start, start + pageSize);
    }, [filteredRows, page, pageSize]);

    const totalRows = filteredRows.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize) || 1);

    const toggleRow = (id) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        const ids = rows.map((r) => r.id);
        const allSelected = ids.every((id) => selected.has(id));
        setSelected((prev) => {
            const next = new Set(prev);
            ids.forEach((id) => {
                if (allSelected) next.delete(id);
                else next.add(id);
            });
            return next;
        });
    };

    const today = () => new Date().toISOString().slice(0, 10);

    const openAdd = () => {
        const d = today();
        setForm({ ...INITIAL_FORM, from_date: d, to_date: d });
        setAddOpen(true);
    };

    const openEdit = (row) => {
        setForm({
            id: row.id,
            from_date: row.from_date?.slice(0, 10) || '',
            to_date: row.to_date?.slice(0, 10) || '',
            recurring: String(row.recurring ?? 0),
            region: row.region || '',
            note: row.note || '',
        });
        setEditOpen(true);
        setOpenMenu(null);
    };

    const validateForm = () => {
        if (!form.from_date || !form.to_date) {
            showToast('From and To dates are required.', 'error');
            return false;
        }
        if (form.from_date > form.to_date) {
            showToast('From date cannot be after To date.', 'error');
            return false;
        }
        return true;
    };

    const buildPayload = () => ({
        from_date: form.from_date,
        to_date: form.to_date,
        recurring: form.recurring === '1' ? 1 : 0,
        region: form.region || '',
        note: form.note || '',
    });

    const handleSubmit = async () => {
        if (!validateForm()) return;
        try {
            setSaving(true);
            const res = await api.post('holidays', buildPayload());
            showToast(res.data?.message || 'Holiday created.', 'success');
            applyListResponse(res);
            setAddOpen(false);
            setForm(INITIAL_FORM);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to create holiday.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async () => {
        if (!validateForm() || !form.id) return;
        try {
            setSaving(true);
            const res = await api.put(`holidays/${form.id}`, {
                ...buildPayload(),
                id: form.id,
            });
            showToast(res.data?.message || 'Holiday updated.', 'success');
            applyListResponse(res);
            setEditOpen(false);
            setForm(INITIAL_FORM);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to update holiday.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            const res = await api.get(`approve-holiday/${id}`);
            showToast(res.data?.message || 'Holiday approved.', 'success');
            applyListResponse(res);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to approve holiday.', 'error');
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await api.delete(`holidays/${deleteId}`);
            showToast(res.data?.message || 'Holiday deleted.', 'success');
            applyListResponse(res);
            setSelected((prev) => {
                const next = new Set(prev);
                next.delete(deleteId);
                return next;
            });
            setDeleteId(null);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to delete holiday.', 'error');
        }
    };

    const handleBulkDelete = async () => {
        try {
            const res = await api.post('holidays/deletebyselection', {
                holidayIdArray: [...selected],
            });
            showToast(res.data?.message || 'Selected holidays deleted.', 'success');
            applyListResponse(res);
            setSelected(new Set());
            setBulkDeleteOpen(false);
        } catch (err) {
            showToast(err.response?.data?.message || 'Bulk delete failed.', 'error');
        }
    };

    const renderForm = () => (
        <FormRow cols={2}>
            <FormField label="From" required>
                <input
                    type="date"
                    className="ui-input"
                    value={form.from_date}
                    onChange={(e) => patchForm({ from_date: e.target.value })}
                    required
                />
            </FormField>
            <FormField label="To" required>
                <input
                    type="date"
                    className="ui-input"
                    value={form.to_date}
                    onChange={(e) => patchForm({ to_date: e.target.value })}
                    required
                />
            </FormField>
            <FormField label="Recurring" required>
                <SelectInput
                    value={form.recurring}
                    onChange={(e) => patchForm({ recurring: e.target.value })}
                    options={RECURRING_OPTIONS}
                />
            </FormField>
            <FormField label="Region">
                <TextInput
                    value={form.region}
                    onChange={(e) => patchForm({ region: e.target.value })}
                />
            </FormField>
            <FormField label="Note" span2>
                <TextareaInput
                    value={form.note}
                    onChange={(e) => patchForm({ note: e.target.value })}
                    rows={3}
                />
            </FormField>
        </FormRow>
    );

    const columns = [
        { key: 'created_at_display', label: 'Date', sortable: true },
        { key: 'user_name', label: 'Created By', sortable: true },
        { key: 'from_date_display', label: 'From', sortable: true },
        { key: 'to_date_display', label: 'To', sortable: true },
        { key: 'note', label: 'Note', sortable: true },
        { key: 'recurring_label', label: 'Recurring', sortable: true },
        { key: 'region', label: 'Region', sortable: true },
        {
            key: 'actions',
            label: '',
            render: (row) => (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {!row.is_approved && approvePermission && canApprove && (
                        <button
                            type="button"
                            className="ui-btn ghost"
                            title="Approve"
                            onClick={() => handleApprove(row.id)}
                        >
                            ✓ Approve
                        </button>
                    )}
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
                </div>
            ),
        },
    ];

    return (
        <PageLayout
            title="Holiday"
            actions={
                <>
                    {canAdd && (
                        <button type="button" className="ui-btn primary" onClick={openAdd}>
                            + Add Holiday
                        </button>
                    )}
                    {selected.size > 0 && canDelete && (
                        <button type="button" className="ui-btn danger" onClick={() => setBulkDeleteOpen(true)}>
                            Delete Selected ({selected.size})
                        </button>
                    )}
                </>
            }
            onClick={(e) => { if (!e.target.closest('.ui-action-wrap')) setOpenMenu(null); }}
        >
            <Toast toast={toast} />

            <div className="ui-toolbar">
                <input
                    className="ui-search"
                    placeholder="Search by user, note, region or dates…"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
            </div>

            <SelectionBar count={selected.size} onClear={() => setSelected(new Set())} />

            <DataTable
                loading={loading}
                columns={columns}
                rows={rows}
                emptyText="No holidays found"
                emptyIcon="📅"
                sortCol={sortCol}
                sortDir={sortDir}
                onSort={(k) => { setSortCol(k); setSortDir((d) => (d === 'asc' ? 'desc' : 'asc')); }}
                selected={canDelete ? selected : undefined}
                onToggleRow={toggleRow}
                onToggleAll={toggleAll}
            />

            <Pagination
                page={page}
                totalPages={totalPages}
                pageSize={pageSize}
                totalRows={totalRows}
                onChange={setPage}
                pageSizes={PAGE_SIZES}
                onPageSize={(s) => { setPageSize(s); setPage(1); }}
            />

            {addOpen && (
                <Modal
                    title="Add Holiday"
                    onClose={() => setAddOpen(false)}
                    footer={
                        <button type="button" className="ui-btn primary" disabled={saving} onClick={handleSubmit}>
                            {saving ? 'Saving…' : 'Submit'}
                        </button>
                    }
                >
                    {renderForm()}
                </Modal>
            )}

            {editOpen && (
                <Modal
                    title="Update Holiday"
                    onClose={() => setEditOpen(false)}
                    footer={
                        <button type="button" className="ui-btn primary" disabled={saving} onClick={handleUpdate}>
                            {saving ? 'Saving…' : 'Submit'}
                        </button>
                    }
                >
                    {renderForm()}
                </Modal>
            )}

            {deleteId && (
                <ConfirmModal
                    title="Delete Holiday"
                    message="Are you sure you want to delete this holiday?"
                    onConfirm={handleDelete}
                    onClose={() => setDeleteId(null)}
                    danger
                />
            )}

            {bulkDeleteOpen && (
                <ConfirmModal
                    title="Delete Selected"
                    message={`Delete ${selected.size} holiday record(s)?`}
                    onConfirm={handleBulkDelete}
                    onClose={() => setBulkDeleteOpen(false)}
                    danger
                />
            )}
        </PageLayout>
    );
};

export default HolidayManager;
