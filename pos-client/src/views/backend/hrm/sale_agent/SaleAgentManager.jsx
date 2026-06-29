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
    SelectInput,
    FileInput,
    Toast,
    useToast,
    ActionMenu,
    Pagination,
    SelectionBar,
} from '../../../../components/ui';
import api from '../../../../services/api';
import authStore from '../../../../stores/authStore';
import usePermissions from '../../../../stores/usePermissions';

const PAGE_SIZES = [10, 25, 50];

const EMPTY_TARGET = { sales_from: '', sales_to: '', percent: '' };

const INITIAL_FORM = {
    name: '',
    email: '',
    phone_number: '',
    address: '',
    city: '',
    country: '',
    department_id: '0',
    image: null,
    sales_target: [{ ...EMPTY_TARGET }],
    add_user: false,
    username: '',
    password: '',
    role_id: '',
    warehouse_id: '',
    biller_id: '',
};

function hasSaleAgentPermission(permissions) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.includes('sale-agents');
}

function hasEmployeeAddPermission(permissions) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.includes('employees-add');
}

function toOptions(items, labelFn = (item) => item.name) {
    return (items || []).map((item) => ({
        value: String(item.id),
        label: labelFn(item),
    }));
}

function validateSalesTargets(targets) {
    let prevTo = null;
    for (const row of targets) {
        const fromVal = parseFloat(row.sales_from) || 0;
        const toVal = parseFloat(row.sales_to) || 0;
        const percent = row.percent;
        if (percent === '' && !fromVal && !toVal) continue;
        if (toVal && fromVal >= toVal) return 'Each sales range "From" must be less than "To".';
        if (prevTo !== null && fromVal && fromVal <= prevTo) {
            return 'Each "From" amount must be greater than the previous row\'s "To" amount.';
        }
        if (percent === '' || percent === null) return 'Commission percent is required for each sales target row.';
        prevTo = toVal || prevTo;
    }
    return null;
}

const SaleAgentManager = ({ controllerName }) => {
    const ctrl = controllerName || 'sale-agents';
    const authPerms = authStore.getPermissions();
    const perms = usePermissions(ctrl);
    const canView = perms.canView || hasSaleAgentPermission(authPerms);
    const canAdd = perms.canAdd || hasEmployeeAddPermission(authPerms) || hasSaleAgentPermission(authPerms);
    const canEdit = perms.canEdit || hasSaleAgentPermission(authPerms);
    const canDelete = perms.canDelete || hasSaleAgentPermission(authPerms);

    const [agents, setAgents] = useState([]);
    const [metadata, setMetadata] = useState({
        lims_role_list: [],
        lims_biller_list: [],
        lims_warehouse_list: [],
        project_enabled: false,
        user_verified: true,
    });
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [sortCol, setSortCol] = useState('name');
    const [sortDir, setSortDir] = useState('asc');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(new Set());
    const [openMenu, setOpenMenu] = useState(null);

    const [addOpen, setAddOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editId, setEditId] = useState(null);
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
            const res = await api.get('sale-agents');
            const data = res.data || {};
            setAgents(data.sale_agents || []);
            setMetadata({
                lims_role_list: data.lims_role_list || [],
                lims_biller_list: data.lims_biller_list || [],
                lims_warehouse_list: data.lims_warehouse_list || [],
                project_enabled: !!data.project_enabled,
                user_verified: data.user_verified !== false,
            });
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to load sale agents.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        let rows = agents;
        if (search.trim()) {
            const q = search.toLowerCase();
            rows = rows.filter((r) =>
                (r.name || '').toLowerCase().includes(q) ||
                (r.email || '').toLowerCase().includes(q) ||
                (r.phone_number || '').toLowerCase().includes(q) ||
                (r.department_name || '').toLowerCase().includes(q) ||
                (r.staff_id || '').toLowerCase().includes(q)
            );
        }
        return [...rows].sort((a, b) => {
            const av = String(a[sortCol] ?? '').toLowerCase();
            const bv = String(b[sortCol] ?? '').toLowerCase();
            if (av < bv) return sortDir === 'asc' ? -1 : 1;
            if (av > bv) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
    }, [agents, search, sortCol, sortDir]);

    const pageRows = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page, pageSize]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize) || 1);

    const toggleRow = (id) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        const ids = pageRows.map((r) => r.id);
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

    const openAdd = () => {
        setEditId(null);
        setForm({ ...INITIAL_FORM, sales_target: [{ ...EMPTY_TARGET }] });
        setAddOpen(true);
    };

    const openEdit = (row) => {
        setEditId(row.id);
        setAddOpen(false);
        const targets = Array.isArray(row.sales_target) && row.sales_target.length
            ? row.sales_target.map((t) => ({
                sales_from: t.sales_from ?? '',
                sales_to: t.sales_to ?? '',
                percent: t.percent ?? '',
            }))
            : [{ ...EMPTY_TARGET }];
        setForm({
            ...INITIAL_FORM,
            name: row.name || '',
            email: row.email || '',
            phone_number: row.phone_number || '',
            address: row.address || '',
            city: row.city || '',
            country: row.country || '',
            department_id: row.department_id ? String(row.department_id) : '0',
            sales_target: targets,
            add_user: false,
            role_id: row.role_id ? String(row.role_id) : '',
            warehouse_id: row.warehouse_id ? String(row.warehouse_id) : '',
            biller_id: row.biller_id ? String(row.biller_id) : '',
        });
        setEditOpen(true);
    };

    const updateTarget = (index, field, value) => {
        setForm((f) => {
            const sales_target = f.sales_target.map((row, i) =>
                i === index ? { ...row, [field]: value } : row
            );
            return { ...f, sales_target };
        });
    };

    const addTargetRow = () => {
        patchForm({ sales_target: [...form.sales_target, { ...EMPTY_TARGET }] });
    };

    const removeTargetRow = (index) => {
        patchForm({
            sales_target: form.sales_target.filter((_, i) => i !== index),
        });
    };

    const showStaffUserFields = form.add_user && Number(form.role_id) > 2;

    const buildFormData = () => {
        const fd = new FormData();
        fd.append('name', form.name.trim());
        fd.append('email', form.email?.trim() || '');
        fd.append('phone_number', form.phone_number.trim());
        fd.append('address', form.address.trim());
        fd.append('city', form.city.trim());
        fd.append('country', form.country?.trim() || '');
        fd.append('department_id', form.department_id || '0');
        fd.append('is_sale_agent', '1');
        form.sales_target.forEach((row, i) => {
            fd.append(`sales_target[${i}][sales_from]`, row.sales_from ?? '');
            fd.append(`sales_target[${i}][sales_to]`, row.sales_to ?? '');
            fd.append(`sales_target[${i}][percent]`, row.percent ?? '');
        });
        if (form.image) fd.append('image', form.image);
        if (editId) fd.append('employee_id', String(editId));
        if (form.add_user && !editId) {
            fd.append('user', '1');
            fd.append('username', form.username.trim());
            fd.append('password', form.password);
            fd.append('role_id', form.role_id);
            if (showStaffUserFields) {
                fd.append('warehouse_id', form.warehouse_id);
                fd.append('biller_id', form.biller_id);
            }
        }
        return fd;
    };

    const validateForm = () => {
        if (!form.name?.trim()) {
            showToast('Name is required.', 'error');
            return false;
        }
        if (!form.phone_number?.trim()) {
            showToast('Phone number is required.', 'error');
            return false;
        }
        if (!form.address?.trim() || !form.city?.trim()) {
            showToast('Address and city are required.', 'error');
            return false;
        }
        const targetError = validateSalesTargets(form.sales_target);
        if (targetError) {
            showToast(targetError, 'error');
            return false;
        }
        if (form.add_user && !editId) {
            if (!form.username?.trim() || !form.password || !form.role_id) {
                showToast('Username, password, and role are required when adding a user account.', 'error');
                return false;
            }
            if (showStaffUserFields && (!form.warehouse_id || !form.biller_id)) {
                showToast('Warehouse and biller are required for this role.', 'error');
                return false;
            }
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        try {
            setSaving(true);
            const fd = buildFormData();
            if (editId) {
                await api.put(`sale-agents/${editId}`, fd);
                showToast('Sale agent updated.');
                setEditOpen(false);
            } else {
                await api.post('sale-agents', fd);
                showToast('Sale agent created.');
                setAddOpen(false);
            }
            fetchData();
        } catch (err) {
            showToast(err.response?.data?.message || err.message || 'Submit failed.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`sale-agents/${deleteId}`);
            setDeleteId(null);
            fetchData();
            showToast('Sale agent deleted.');
        } catch (err) {
            showToast(err.response?.data?.message || 'Delete failed.', 'error');
        }
    };

    const handleBulkDelete = async () => {
        try {
            await api.post('sale-agents/deletebyselection', { employeeIdArray: Array.from(selected) });
            setBulkDeleteOpen(false);
            setSelected(new Set());
            fetchData();
            showToast(`${selected.size} sale agent(s) deleted.`);
        } catch (err) {
            showToast(err.response?.data?.message || 'Bulk delete failed.', 'error');
        }
    };

    const roleOptions = toOptions(metadata.lims_role_list);
    const billerOptions = toOptions(metadata.lims_biller_list, (b) =>
        b.company_name ? `${b.name} (${b.company_name})` : b.name
    );
    const warehouseOptions = toOptions(metadata.lims_warehouse_list);

    const renderSalesTargets = () => (
        <div style={{ marginTop: 12 }}>
            <h4 style={{ marginBottom: 8 }}>Sales Target</h4>
            {form.sales_target.map((row, index) => (
                <FormRow cols={4} key={index}>
                    <FormField label="Total Sales From">
                        <NumberInput
                            value={row.sales_from}
                            onChange={(e) => updateTarget(index, 'sales_from', e.target.value)}
                        />
                    </FormField>
                    <FormField label="Total Sales To">
                        <NumberInput
                            value={row.sales_to}
                            onChange={(e) => updateTarget(index, 'sales_to', e.target.value)}
                        />
                    </FormField>
                    <FormField label="Commission %" required>
                        <NumberInput
                            step="0.01"
                            value={row.percent}
                            onChange={(e) => updateTarget(index, 'percent', e.target.value)}
                        />
                    </FormField>
                    <FormField label=" ">
                        {form.sales_target.length > 1 && (
                            <button type="button" className="ui-btn danger" onClick={() => removeTargetRow(index)}>
                                Remove
                            </button>
                        )}
                    </FormField>
                </FormRow>
            ))}
            <button type="button" className="ui-btn" onClick={addTargetRow}>+ Add More</button>
        </div>
    );

    const renderAgentForm = (isEdit) => (
        <>
            <FormRow cols={3}>
                <FormField label="Name" required>
                    <TextInput value={form.name} onChange={(e) => patchForm({ name: e.target.value })} required />
                </FormField>
                <FormField label="Image">
                    <FileInput accept="image/*" onChange={(e) => patchForm({ image: e.target.files?.[0] || null })} />
                </FormField>
                <FormField label="Email">
                    <TextInput type="email" value={form.email} onChange={(e) => patchForm({ email: e.target.value })} />
                </FormField>
            </FormRow>
            <FormRow cols={3}>
                <FormField label="Phone Number" required>
                    <TextInput value={form.phone_number} onChange={(e) => patchForm({ phone_number: e.target.value })} required />
                </FormField>
                <FormField label="Address" required>
                    <TextInput value={form.address} onChange={(e) => patchForm({ address: e.target.value })} required />
                </FormField>
                <FormField label="City" required>
                    <TextInput value={form.city} onChange={(e) => patchForm({ city: e.target.value })} required />
                </FormField>
            </FormRow>
            <FormRow cols={3}>
                <FormField label="Country">
                    <TextInput value={form.country} onChange={(e) => patchForm({ country: e.target.value })} />
                </FormField>
            </FormRow>
            {renderSalesTargets()}
            {!isEdit && (
                <>
                    <FormRow cols={1}>
                        <FormField label="">
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <input
                                    type="checkbox"
                                    checked={form.add_user}
                                    onChange={(e) => patchForm({ add_user: e.target.checked })}
                                />
                                Add User (login access)
                            </label>
                        </FormField>
                    </FormRow>
                    {form.add_user && (
                        <FormRow cols={3}>
                            <FormField label="Username" required>
                                <TextInput value={form.username} onChange={(e) => patchForm({ username: e.target.value })} required />
                            </FormField>
                            <FormField label="Password" required>
                                <TextInput type="password" value={form.password} onChange={(e) => patchForm({ password: e.target.value })} required />
                            </FormField>
                            <FormField label="Role" required>
                                <SelectInput
                                    value={form.role_id}
                                    onChange={(e) => patchForm({ role_id: e.target.value })}
                                    options={[{ value: '', label: 'Select role…' }, ...roleOptions]}
                                    required
                                />
                            </FormField>
                        </FormRow>
                    )}
                    {showStaffUserFields && (
                        <FormRow cols={2}>
                            <FormField label="Warehouse" required>
                                <SelectInput
                                    value={form.warehouse_id}
                                    onChange={(e) => patchForm({ warehouse_id: e.target.value })}
                                    options={[{ value: '', label: 'Select warehouse…' }, ...warehouseOptions]}
                                    required
                                />
                            </FormField>
                            <FormField label="Biller" required>
                                <SelectInput
                                    value={form.biller_id}
                                    onChange={(e) => patchForm({ biller_id: e.target.value })}
                                    options={[{ value: '', label: 'Select biller…' }, ...billerOptions]}
                                    required
                                />
                            </FormField>
                        </FormRow>
                    )}
                </>
            )}
        </>
    );

    const columns = [
        {
            key: 'image_url',
            label: 'Image',
            render: (row) => row.image_url
                ? <img src={row.image_url} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }} />
                : '—',
        },
        { key: 'name', label: 'Name', sortable: true },
        { key: 'email', label: 'Email', sortable: true },
        { key: 'phone_number', label: 'Phone Number', sortable: true },
        { key: 'department_name', label: 'Department', sortable: true },
        { key: 'address_display', label: 'Address', sortable: true },
        { key: 'staff_id', label: 'Staff Id', sortable: true },
        ...(metadata.project_enabled ? [{ key: 'company_name', label: 'Company', sortable: true }] : []),
        {
            key: 'actions',
            label: 'Action',
            render: (row) => (
                <ActionMenu
                    id={row.id}
                    openId={openMenu}
                    setOpenId={setOpenMenu}
                    items={[
                        canEdit && { label: '✎ Edit', onClick: () => openEdit(row) },
                        canDelete && { divider: true },
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
            <PageLayout title="Sale Agents">
                <p>You do not have permission to view sale agents.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout
            title="Sale Agents"
            actions={
                <>
                    {canAdd && (
                        <button type="button" className="ui-btn primary" onClick={openAdd}>+ Add Sale Agent</button>
                    )}
                    {selected.size > 0 && canDelete && (
                        <button type="button" className="ui-btn danger" onClick={() => setBulkDeleteOpen(true)}>
                            🗑 Delete Selected ({selected.size})
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
                    placeholder="Search by name, email, phone, department or staff id…"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
            </div>

            <SelectionBar count={selected.size} onClear={() => setSelected(new Set())} />

            <DataTable
                loading={loading}
                columns={columns}
                rows={pageRows}
                emptyText="No sale agents found"
                emptyIcon="🧑‍💼"
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
                totalRows={filtered.length}
                onChange={setPage}
                pageSizes={PAGE_SIZES}
                onPageSize={(s) => { setPageSize(s); setPage(1); }}
            />

            {(addOpen || editOpen) && (
                <Modal
                    title={editId ? 'Update Sale Agent' : 'Add Sale Agent'}
                    onClose={() => { setAddOpen(false); setEditOpen(false); setEditId(null); }}
                    footer={
                        <button type="button" className="ui-btn primary" disabled={saving} onClick={handleSubmit}>
                            {saving ? 'Saving…' : 'Submit'}
                        </button>
                    }
                    size="xl"
                >
                    {renderAgentForm(!!editId)}
                </Modal>
            )}

            {deleteId && (
                <ConfirmModal
                    title="Delete Sale Agent"
                    message="Are you sure you want to delete this sale agent?"
                    danger
                    onConfirm={handleDelete}
                    onClose={() => setDeleteId(null)}
                />
            )}

            {bulkDeleteOpen && (
                <ConfirmModal
                    title="Delete Sale Agents"
                    message={`Delete ${selected.size} selected sale agent(s)?`}
                    danger
                    onConfirm={handleBulkDelete}
                    onClose={() => setBulkDeleteOpen(false)}
                />
            )}
        </PageLayout>
    );
};

export default SaleAgentManager;
