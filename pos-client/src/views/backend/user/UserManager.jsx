import React, { useState, useEffect, useMemo } from 'react';

import {
    PageLayout,
    DataTable,
    Modal,
    ConfirmModal,
    FormField,
    FormRow,
    TextInput,
    SelectInput,
    Toast,
    useToast,
    ActionMenu,
    Pagination,
    SelectionBar,
} from '../../../components/ui';
import api from '../../../services/api';
import authStore from '../../../stores/authStore';
import usePermissions from '../../../stores/usePermissions';

const PAGE_SIZES = [10, 25, 50, 100];

const INITIAL_FORM = {
    name: '',
    password: '',
    access_pin: '',
    email: '',
    phone_number: '',
    phone: '',
    company_name: '',
    role_id: '',
    account_id: '',
    biller_id: '',
    warehouse_id: '',
    customer_group_id: '',
    customer_name: '',
    tax_number: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    is_active: true,
    service_staff: false,
};

function hasUserPermission(permissions, key) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.includes(`users-${key}`);
}

function toOptions(items) {
    return (items || []).map((item) => ({
        value: String(item.id),
        label: item.name,
    }));
}

function roleShowsStaffFields(roleId) {
    const id = Number(roleId);
    return id > 2 && id !== 5;
}

function roleIsCustomer(roleId) {
    return Number(roleId) === 5;
}

const UserManager = ({ controllerName }) => {
    const ctrl = controllerName === 'users' ? 'user' : (controllerName || 'user');
    const authPerms = authStore.getPermissions();
    const perms = usePermissions(ctrl);
    const canView = perms.canView || hasUserPermission(authPerms, 'index');
    const canAdd = perms.canAdd || hasUserPermission(authPerms, 'add');
    const canEdit = perms.canEdit || hasUserPermission(authPerms, 'edit');
    const canDelete = perms.canDelete || hasUserPermission(authPerms, 'delete');

    const [allUsers, setAllUsers] = useState([]);
    const [metadata, setMetadata] = useState({
        lims_role_list: [],
        lims_biller_list: [],
        lims_warehouse_list: [],
        lims_account_list: [],
        lims_customer_group_list: [],
        user_verified: true,
        restaurant_enabled: false,
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
            const res = await api.get('user');
            const data = res.data || {};
            setAllUsers(data.users || []);
            setMetadata({
                lims_role_list: data.lims_role_list || [],
                lims_biller_list: data.lims_biller_list || [],
                lims_warehouse_list: data.lims_warehouse_list || [],
                lims_account_list: data.lims_account_list || [],
                lims_customer_group_list: data.lims_customer_group_list || [],
                user_verified: data.user_verified !== false,
                restaurant_enabled: !!data.restaurant_enabled,
            });
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to load users.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = useMemo(() => {
        let rows = allUsers;
        if (search.trim()) {
            const q = search.toLowerCase();
            rows = rows.filter((r) =>
                (r.name || '').toLowerCase().includes(q) ||
                (r.email || '').toLowerCase().includes(q) ||
                (r.phone || '').toLowerCase().includes(q) ||
                (r.company_name || '').toLowerCase().includes(q) ||
                (r.role || '').toLowerCase().includes(q)
            );
        }
        return [...rows].sort((a, b) => {
            const av = String(a[sortCol] ?? '').toLowerCase();
            const bv = String(b[sortCol] ?? '').toLowerCase();
            if (av < bv) return sortDir === 'asc' ? -1 : 1;
            if (av > bv) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
    }, [allUsers, search, sortCol, sortDir]);

    const users = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredUsers.slice(start, start + pageSize);
    }, [filteredUsers, page, pageSize]);

    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize) || 1);

    const toggleRow = (id) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        const ids = users.map((u) => u.id);
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
        setEditOpen(false);
        setForm({ ...INITIAL_FORM, is_active: true });
        setAddOpen(true);
    };

    const openEdit = (row) => {
        setEditId(row.id);
        setAddOpen(false);
        setForm({
            ...INITIAL_FORM,
            name: row.name || '',
            email: row.email || '',
            phone: row.phone || '',
            company_name: row.company_name || '',
            role_id: row.role_id ? String(row.role_id) : '',
            account_id: row.account_id ? String(row.account_id) : '',
            biller_id: row.biller_id ? String(row.biller_id) : '',
            warehouse_id: row.warehouse_id ? String(row.warehouse_id) : '',
            is_active: !!row.is_active,
            service_staff: !!row.service_staff,
            password: '',
            access_pin: '',
        });
        setEditOpen(true);
    };

    const generatePassword = async () => {
        try {
            const res = await api.get('user/genpass');
            patchForm({ password: res.data?.password || '' });
        } catch {
            showToast('Could not generate password.', 'error');
        }
    };

    const generateAccessPin = async () => {
        try {
            const res = await api.get('user/genpin');
            patchForm({ access_pin: res.data?.access_pin || '' });
        } catch {
            showToast('Could not generate access PIN.', 'error');
        }
    };

    const buildCreatePayload = () => {
        const payload = {
            name: form.name.trim(),
            email: form.email.trim(),
            phone_number: form.phone_number.trim(),
            password: form.password,
            role_id: form.role_id,
            company_name: form.company_name?.trim() || '',
        };
        if (form.access_pin) payload.access_pin = form.access_pin;
        if (form.is_active) payload.is_active = 1;
        if (form.service_staff) payload.service_staff = 1;
        if (form.account_id) payload.account_id = form.account_id;
        if (roleShowsStaffFields(form.role_id)) {
            payload.biller_id = form.biller_id;
            payload.warehouse_id = form.warehouse_id;
        }
        if (roleIsCustomer(form.role_id)) {
            payload.customer_group_id = form.customer_group_id;
            payload.customer_name = form.customer_name.trim();
            payload.address = form.address.trim();
            payload.city = form.city.trim();
            payload.state = form.state?.trim() || '';
            payload.country = form.country?.trim() || '';
            payload.postal_code = form.postal_code?.trim() || '';
            payload.tax_number = form.tax_number?.trim() || '';
        }
        return payload;
    };

    const buildUpdatePayload = () => {
        const payload = {
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            role_id: form.role_id,
            company_name: form.company_name?.trim() || '',
        };
        if (form.is_active) payload.is_active = 1;
        if (form.service_staff) payload.service_staff = 1;
        if (form.account_id) payload.account_id = form.account_id;
        if (form.password) payload.password = form.password;
        if (form.access_pin) payload.access_pin = form.access_pin;
        if (roleShowsStaffFields(form.role_id)) {
            payload.biller_id = form.biller_id;
            payload.warehouse_id = form.warehouse_id;
        }
        return payload;
    };

    const validateForm = (isEdit) => {
        if (!form.name?.trim()) {
            showToast('Username is required.', 'error');
            return false;
        }
        if (!form.email?.trim()) {
            showToast('Email is required.', 'error');
            return false;
        }
        if (!isEdit && !form.password) {
            showToast('Password is required.', 'error');
            return false;
        }
        if (!isEdit && !form.phone_number?.trim()) {
            showToast('Phone number is required.', 'error');
            return false;
        }
        if (isEdit && !form.phone?.trim()) {
            showToast('Phone number is required.', 'error');
            return false;
        }
        if (!form.role_id) {
            showToast('Role is required.', 'error');
            return false;
        }
        if (roleShowsStaffFields(form.role_id)) {
            if (!form.biller_id || !form.warehouse_id) {
                showToast('Biller and warehouse are required for this role.', 'error');
                return false;
            }
        }
        if (!isEdit && roleIsCustomer(form.role_id)) {
            if (!form.customer_group_id || !form.customer_name?.trim() || !form.address?.trim() || !form.city?.trim()) {
                showToast('Customer group, name, address, and city are required for customer role.', 'error');
                return false;
            }
        }
        if (!isEdit && roleShowsStaffFields(form.role_id) && !form.access_pin) {
            showToast('POS access PIN is required for staff users.', 'error');
            return false;
        }
        if (form.access_pin && !/^\d{4,8}$/.test(form.access_pin)) {
            showToast('Access PIN must be 4–8 digits.', 'error');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        const isEdit = !!editId;
        if (!validateForm(isEdit)) return;
        try {
            setSaving(true);
            if (isEdit) {
                await api.put(`user/${editId}`, buildUpdatePayload());
                showToast('User updated.');
                setEditOpen(false);
            } else {
                await api.post('user', buildCreatePayload());
                showToast('User created.');
                setAddOpen(false);
            }
            fetchData();
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Submit failed.';
            showToast(typeof msg === 'string' ? msg : 'Submit failed.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (row, checked) => {
        if (!metadata.user_verified) {
            showToast('This feature is disabled for demo.', 'error');
            return;
        }
        try {
            await api.post('user/toggle-status', { id: row.id, is_active: checked ? 1 : 0 });
            setAllUsers((prev) =>
                prev.map((u) => (u.id === row.id ? { ...u, is_active: checked } : u))
            );
            showToast('User status updated.');
        } catch (err) {
            showToast(err.response?.data?.message || 'Status update failed.', 'error');
            fetchData();
        }
    };

    const handleDelete = async () => {
        if (!metadata.user_verified) {
            showToast('This feature is disabled for demo.', 'error');
            setDeleteId(null);
            return;
        }
        try {
            const res = await api.delete(`user/${deleteId}`);
            setDeleteId(null);
            if (res.data?.logout) {
                api.signOut();
                return;
            }
            fetchData();
            showToast('User deleted.');
        } catch (err) {
            showToast(err.response?.data?.message || 'Delete failed.', 'error');
        }
    };

    const handleBulkDelete = async () => {
        if (!metadata.user_verified) {
            showToast('This feature is disabled for demo.', 'error');
            setBulkDeleteOpen(false);
            return;
        }
        try {
            await api.post('user/deletebyselection', { userIdArray: Array.from(selected) });
            setBulkDeleteOpen(false);
            setSelected(new Set());
            fetchData();
            showToast(`${selected.size} user(s) deleted.`);
        } catch (err) {
            showToast(err.response?.data?.message || 'Bulk delete failed.', 'error');
        }
    };

    const roleOptions = toOptions(metadata.lims_role_list);
    const billerOptions = toOptions(metadata.lims_biller_list);
    const warehouseOptions = toOptions(metadata.lims_warehouse_list);
    const accountOptions = toOptions(metadata.lims_account_list);
    const customerGroupOptions = toOptions(metadata.lims_customer_group_list);

    const showStaffFields = roleShowsStaffFields(form.role_id);
    const showCustomerFields = !editId && roleIsCustomer(form.role_id);
    const showAccountField = form.role_id && !roleIsCustomer(form.role_id);

    const columns = [
        { key: 'name', label: 'UserName', sortable: true },
        { key: 'email', label: 'Email', sortable: true },
        { key: 'company_name', label: 'Company Name', sortable: true },
        { key: 'phone', label: 'Phone Number', sortable: true },
        { key: 'role', label: 'Role', sortable: true },
        {
            key: 'has_access_pin',
            label: 'POS PIN',
            render: (row) => (
                <span style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: row.has_access_pin ? '#006D44' : '#9CA3AF',
                }}>
                    {row.has_access_pin ? 'Set' : 'Not set'}
                </span>
            ),
        },
        {
            key: 'is_active',
            label: 'Status',
            render: (row) => (
                <input
                    type="checkbox"
                    className="ui-chk"
                    checked={!!row.is_active}
                    disabled={!canEdit || !metadata.user_verified}
                    onChange={(e) => handleToggleStatus(row, e.target.checked)}
                />
            ),
        },
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
                        canDelete && metadata.user_verified && { divider: true },
                        canDelete && metadata.user_verified && {
                            label: '🗑 Delete',
                            danger: true,
                            onClick: () => setDeleteId(row.id),
                        },
                    ].filter(Boolean)}
                />
            ),
        },
    ];

    const renderUserForm = (isEdit) => (
        <>
            <FormRow>
                <FormField label="UserName" required>
                    <TextInput value={form.name} onChange={(e) => patchForm({ name: e.target.value })} required />
                </FormField>
                <FormField label={isEdit ? 'Change Password' : 'Password'} required={!isEdit}>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <TextInput
                            type="password"
                            value={form.password}
                            onChange={(e) => patchForm({ password: e.target.value })}
                            required={!isEdit}
                            style={{ flex: 1 }}
                        />
                        <button type="button" className="ui-btn" onClick={generatePassword}>Generate</button>
                    </div>
                </FormField>
            </FormRow>
            <FormRow>
                <FormField
                    label="POS Access PIN"
                    required={!isEdit && showStaffFields}
                >
                    <div style={{ display: 'flex', gap: 8 }}>
                        <TextInput
                            type="password"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={form.access_pin}
                            onChange={(e) => patchForm({ access_pin: e.target.value.replace(/\D/g, '').slice(0, 8) })}
                            placeholder={isEdit ? 'Leave blank to keep current PIN' : '4–8 digits'}
                            style={{ flex: 1 }}
                        />
                        <button type="button" className="ui-btn" onClick={generateAccessPin}>Generate</button>
                    </div>
                    <p className="ui-form-hint" style={{ marginTop: 6 }}>
                        This PIN is used on the POS terminal login screen.
                    </p>
                </FormField>
            </FormRow>
            <FormRow>
                <FormField label="Email" required>
                    <TextInput type="email" value={form.email} onChange={(e) => patchForm({ email: e.target.value })} required />
                </FormField>
                <FormField label="Phone Number" required>
                    <TextInput
                        value={isEdit ? form.phone : form.phone_number}
                        onChange={(e) => patchForm(isEdit ? { phone: e.target.value } : { phone_number: e.target.value })}
                        required
                    />
                </FormField>
            </FormRow>
            <FormRow>
                <FormField label="Company Name">
                    <TextInput value={form.company_name} onChange={(e) => patchForm({ company_name: e.target.value })} />
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
            {showAccountField && (
                <FormRow>
                    <FormField label="Account">
                        <SelectInput
                            value={form.account_id}
                            onChange={(e) => patchForm({ account_id: e.target.value })}
                            options={[{ value: '', label: 'Select account…' }, ...accountOptions]}
                        />
                    </FormField>
                </FormRow>
            )}
            {showStaffFields && (
                <FormRow>
                    <FormField label="Biller" required>
                        <SelectInput
                            value={form.biller_id}
                            onChange={(e) => patchForm({ biller_id: e.target.value })}
                            options={[{ value: '', label: 'Select biller…' }, ...billerOptions]}
                            required
                        />
                    </FormField>
                    <FormField label="Warehouse" required>
                        <SelectInput
                            value={form.warehouse_id}
                            onChange={(e) => patchForm({ warehouse_id: e.target.value })}
                            options={[{ value: '', label: 'Select warehouse…' }, ...warehouseOptions]}
                            required
                        />
                    </FormField>
                </FormRow>
            )}
            {showCustomerFields && (
                <>
                    <FormRow>
                        <FormField label="Customer Group" required>
                            <SelectInput
                                value={form.customer_group_id}
                                onChange={(e) => patchForm({ customer_group_id: e.target.value })}
                                options={[{ value: '', label: 'Select group…' }, ...customerGroupOptions]}
                                required
                            />
                        </FormField>
                        <FormField label="Customer Name" required>
                            <TextInput value={form.customer_name} onChange={(e) => patchForm({ customer_name: e.target.value })} required />
                        </FormField>
                    </FormRow>
                    <FormRow>
                        <FormField label="Address" required>
                            <TextInput value={form.address} onChange={(e) => patchForm({ address: e.target.value })} required />
                        </FormField>
                        <FormField label="City" required>
                            <TextInput value={form.city} onChange={(e) => patchForm({ city: e.target.value })} required />
                        </FormField>
                    </FormRow>
                    <FormRow>
                        <FormField label="State">
                            <TextInput value={form.state} onChange={(e) => patchForm({ state: e.target.value })} />
                        </FormField>
                        <FormField label="Country">
                            <TextInput value={form.country} onChange={(e) => patchForm({ country: e.target.value })} />
                        </FormField>
                    </FormRow>
                    <FormRow>
                        <FormField label="Postal Code">
                            <TextInput value={form.postal_code} onChange={(e) => patchForm({ postal_code: e.target.value })} />
                        </FormField>
                        <FormField label="Tax Number">
                            <TextInput value={form.tax_number} onChange={(e) => patchForm({ tax_number: e.target.value })} />
                        </FormField>
                    </FormRow>
                </>
            )}
            <FormRow>
                <FormField label="">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input type="checkbox" checked={form.is_active} onChange={(e) => patchForm({ is_active: e.target.checked })} />
                        Active
                    </label>
                </FormField>
                {metadata.restaurant_enabled && (
                    <FormField label="">
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="checkbox" checked={form.service_staff} onChange={(e) => patchForm({ service_staff: e.target.checked })} />
                            Waiter
                        </label>
                    </FormField>
                )}
            </FormRow>
        </>
    );

    if (!canView) {
        return (
            <PageLayout title="User List">
                <p>You do not have permission to view users.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout
            title="User List"
            actions={
                <>
                    {canAdd && <button type="button" className="ui-btn primary" onClick={openAdd}>+ Add User</button>}
                    {selected.size > 0 && canDelete && metadata.user_verified && (
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
                    placeholder="Search by name, email, phone, company or role…"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
            </div>

            <SelectionBar count={selected.size} onClear={() => setSelected(new Set())} />

            <DataTable
                loading={loading}
                columns={columns}
                rows={users}
                emptyText="No users found"
                emptyIcon="👤"
                sortCol={sortCol}
                sortDir={sortDir}
                onSort={(k) => { setSortCol(k); setSortDir((d) => (d === 'asc' ? 'desc' : 'asc')); }}
                selected={canDelete && metadata.user_verified ? selected : undefined}
                onToggleRow={toggleRow}
                onToggleAll={toggleAll}
            />

            <Pagination
                page={page}
                totalPages={totalPages}
                pageSize={pageSize}
                totalRows={filteredUsers.length}
                onChange={setPage}
                pageSizes={PAGE_SIZES}
                onPageSize={(s) => { setPageSize(s); setPage(1); }}
            />

            {(addOpen || editOpen) && (
                <Modal
                    title={editId ? 'Update User' : 'Add User'}
                    onClose={() => { setAddOpen(false); setEditOpen(false); setEditId(null); }}
                    footer={
                        <button type="button" className="ui-btn primary" disabled={saving} onClick={handleSubmit}>
                            {saving ? 'Saving…' : 'Submit'}
                        </button>
                    }
                >
                    {renderUserForm(!!editId)}
                </Modal>
            )}

            {deleteId && (
                <ConfirmModal
                    title="Delete User"
                    message="Are you sure you want to delete this user?"
                    danger
                    onConfirm={handleDelete}
                    onClose={() => setDeleteId(null)}
                />
            )}

            {bulkDeleteOpen && (
                <ConfirmModal
                    title="Delete Users"
                    message={`Delete ${selected.size} selected user(s)?`}
                    danger
                    onConfirm={handleBulkDelete}
                    onClose={() => setBulkDeleteOpen(false)}
                />
            )}
        </PageLayout>
    );
};

export default UserManager;
