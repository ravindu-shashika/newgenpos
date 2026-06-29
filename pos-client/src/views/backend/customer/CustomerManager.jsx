import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
    TextareaInput,
    FileInput,
    Toast,
    useToast,
    ActionMenu,
    Pagination,
    SelectionBar,
} from '../../../components/ui';
import { api } from '../../../services';
import authStore from '../../../stores/authStore';
import usePermissions from '../../../stores/usePermissions';

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZES = [10, 25, 50, 100];

function hasCustomerPermission(permissions, key) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.includes(`customers-${key}`);
}

// ─── Component ────────────────────────────────────────────────────────────────
const CustomerManager = ({ controllerName }) => {
    const ctrl = controllerName === 'customer' ? 'customers' : (controllerName || 'customers');
    const authPerms = authStore.getPermissions();
    const perms = usePermissions(ctrl);
    const canView = perms.canView || hasCustomerPermission(authPerms, 'index');
    const canAdd = perms.canAdd || hasCustomerPermission(authPerms, 'add');
    const canEdit = perms.canEdit || hasCustomerPermission(authPerms, 'edit');
    const canDelete = perms.canDelete || hasCustomerPermission(authPerms, 'delete');
    const canImport = perms.canImport || hasCustomerPermission(authPerms, 'import') || hasCustomerPermission(authPerms, 'add');
    const [allCustomers, setAllCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [options, setOptions] = useState({
        lims_account_list: [],
        lims_gift_card_list: [],
        lims_reward_point_setting_data: null,
        lims_pos_setting_data: null,
        options: [],
        custom_fields: [],
        field_name: []
    });

    // ── Pagination / sort / search ─────────────────────────────────────────────
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [sortCol, setSortCol] = useState('name');
    const [sortDir, setSortDir] = useState('asc');
    const [search, setSearch] = useState('');

    // ── Selection ──────────────────────────────────────────────────────────────
    const [selected, setSelected] = useState(new Set());
    const [openMenu, setOpenMenu] = useState(null);

    // ── Modals ─────────────────────────────────────────────────────────────────
    const [importOpen, setImportOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [addOpen, setAddOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editId, setEditId] = useState(null);

    const initialCustomerForm = {
        customer_name: '',
        customer_group_id: '',
        company_name: '',
        email: '',
        phone_number: '',
        wa_number: '',
        tax_no: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
        opening_balance: 0,
        deposit: 0,
        credit_limit: 0,
        pay_term_no: '',
        pay_term_period: 'days',
        both: false,
        user: false,
        username: '',
        password: '',
        type: 'regular'
    };
    const [customerForm, setCustomerForm] = useState(initialCustomerForm);

    const patchCustomerForm = (patch) => setCustomerForm((f) => ({ ...f, ...patch }));

    // Clear Due
    const [clearDueOpen, setClearDueOpen] = useState(false);
    const [clearDueForm, setClearDueForm] = useState({
        customer_id: '',
        balance: 0,
        paying_amount: 0,
        amount: 0,
        paid_by_id: '1',
        payment_receiver: '',
        gift_card_id: '',
        cheque_no: '',
        account_id: '',
        payment_note: ''
    });

    // Deposit
    const [depositOpen, setDepositOpen] = useState(false);
    const [depositForm, setDepositForm] = useState({ customer_id: '', amount: 0, note: '' });
    const [viewDepositOpen, setViewDepositOpen] = useState(false);
    const [deposits, setDeposits] = useState([]);
    const [editDepositOpen, setEditDepositOpen] = useState(false);
    const [editDepositForm, setEditDepositForm] = useState({ deposit_id: '', amount: 0, note: '' });

    // Points
    const [pointOpen, setPointOpen] = useState(false);
    const [pointForm, setPointForm] = useState({ customer_id: '', points: 0, note: '' });
    const [viewPointsOpen, setViewPointsOpen] = useState(false);
    const [pointsData, setPointsData] = useState([]);
    const [editPointOpen, setEditPointOpen] = useState(false);
    const [editPointForm, setEditPointForm] = useState({ point_id: '', points: 0, note: '' });

    // ── Toast ─────────────────────────────────────────────────────────────────
    const { toast, showToast } = useToast();

    const importFileRef = useRef(null);

    // ── Data ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get('customer');
            const data = res.data;
            setAllCustomers(data.customers || []);
            setOptions(data);
            // set default account
            const defAcc = (data.lims_account_list || []).find(a => a.is_default);
            if (defAcc) {
                setClearDueForm(f => ({ ...f, account_id: defAcc.id }));
            }
        } catch (err) {
            showToast('Failed to load customers.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ── Client-side filter / sort / paginate ───────────────────────────────────
    const filteredCustomers = useMemo(() => {
        let rows = allCustomers;
        if (search.trim()) {
            const q = search.toLowerCase();
            rows = rows.filter(r =>
                (r.name || '').toLowerCase().includes(q) ||
                (r.phone_number || '').toLowerCase().includes(q) ||
                (r.email || '').toLowerCase().includes(q) ||
                (r.customer_group || '').toLowerCase().includes(q)
            );
        }
        rows = [...rows].sort((a, b) => {
            const av = (a[sortCol] ?? '');
            const bv = (b[sortCol] ?? '');
            if (av < bv) return sortDir === 'asc' ? -1 : 1;
            if (av > bv) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
        return rows;
    }, [allCustomers, search, sortCol, sortDir]);

    const totalRows = filteredCustomers.length;
    const customers = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredCustomers.slice(start, start + pageSize);
    }, [filteredCustomers, page, pageSize]);


    // ── Selection Logic ────────────────────────────────────────────────────────
    const toggleRow = (id) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        const ids = customers.map(c => c.id);
        const allSelected = ids.every(id => selected.has(id));
        setSelected(prev => {
            const next = new Set(prev);
            ids.forEach(id => { if (allSelected) next.delete(id); else next.add(id); });
            return next;
        });
    };

    // ── Open Handlers ─────────────────────────────────────────────────────────
    const openAdd = () => {
        setEditId(null);
        setCustomerForm(initialCustomerForm);
        setAddOpen(true);
    };

    const openEdit = (row) => {
        setEditId(row.id);
        const form = {
            ...initialCustomerForm,
            customer_name: row.name,
            customer_group_id: row.customer_group_id,
            company_name: row.company_name || '',
            email: row.email || '',
            phone_number: row.phone_number || '',
            wa_number: row.wa_number || '',
            tax_no: row.tax_no || '',
            address: row.address || '',
            city: row.city || '',
            state: row.state || '',
            postal_code: row.postal_code || '',
            country: row.country || '',
            opening_balance: row.opening_balance || 0,
            deposit: 0,
            credit_limit: row.credit_limit || 0,
            pay_term_no: row.pay_term_no || '',
            pay_term_period: row.pay_term_period || 'days',
            type: row.type || 'regular',
            user: !!row.user_id,
        };
        // custom fields
        (options.custom_fields || []).forEach((field) => {
            const key = field.field_name || (typeof field === 'string' ? field : field.name).toLowerCase().replace(/ /g, '_');
            form[key] = row[key] || '';
        });
        setCustomerForm(form);
        setEditOpen(true);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!customerForm.customer_group_id) {
            showToast('Customer group is required.', 'error');
            return;
        }
        if (!customerForm.customer_name?.trim()) {
            showToast('Customer name is required.', 'error');
            return;
        }
        try {
            const payload = {
                customer_group_id: String(customerForm.customer_group_id),
                customer_name: customerForm.customer_name.trim(),
                type: customerForm.type,
                company_name: customerForm.company_name,
                email: customerForm.email,
                phone_number: customerForm.phone_number,
                wa_number: customerForm.wa_number,
                tax_no: customerForm.tax_no,
                address: customerForm.address,
                city: customerForm.city,
                state: customerForm.state,
                postal_code: customerForm.postal_code,
                country: customerForm.country,
                opening_balance: customerForm.opening_balance,
                deposit: customerForm.deposit,
                credit_limit: customerForm.credit_limit,
                pay_term_no: customerForm.pay_term_no,
                pay_term_period: customerForm.pay_term_period,
            };
            if (customerForm.both === true) {
                payload.both = 1;
            }
            if (customerForm.user === true) {
                payload.user = 1;
                payload.username = customerForm.username;
                payload.password = customerForm.password;
            }
            // Format checkbox/multi-select custom fields as arrays for backend
            (options.custom_fields || []).forEach(field => {
                const fn = field.field_name || (typeof field === 'string' ? field : field.name).toLowerCase().replace(/ /g, '_');
                payload[fn] = customerForm[fn] || '';
                if (field.type === 'checkbox' || field.type === 'multi_select') {
                    if (typeof payload[fn] === 'string') {
                        payload[fn] = payload[fn] ? payload[fn].split(',') : [];
                    }
                }
            });

            if (editId) {
                await api.put(`customer/${editId}`, payload);
                showToast('Customer updated.');
                setEditOpen(false);
            } else {
                await api.post('customer', payload);
                showToast('Customer created.');
                setAddOpen(false);
            }
            fetchData();
        } catch (err) {
            showToast(err.response?.data?.message || 'Submit failed.', 'error');
        }
    };

    // ── CRUD Actions ───────────────────────────────────────────────────────────
    const handleDelete = async () => {
        try {
            await api.delete(`customer/${deleteId}`);
            setDeleteId(null);
            fetchData();
            showToast('Customer deleted successfully.');
        } catch (err) {
            showToast('Delete failed.', 'error');
        }
    };

    const handleBulkDelete = async () => {
        try {
            await api.post('customer/deletebyselection', { customerIdArray: Array.from(selected) });
            setBulkDeleteOpen(false);
            setSelected(new Set());
            fetchData();
            showToast(`${selected.size} items deleted.`);
        } catch (err) {
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
            await api.post('importcustomer', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setImportOpen(false);
            fetchData();
            showToast('Customers imported successfully.');
        } catch (err) {
            showToast(err.response?.data?.message || 'Import failed.', 'error');
        }
    };

    // ── Clear Due ──────────────────────────────────────────────────────────────
    const openClearDue = (row) => {
        const due = parseFloat((row.total_due || '0').replace(/,/g, ''));
        setClearDueForm({
            ...clearDueForm,
            customer_id: row.id,
            balance: due,
            paying_amount: due,
            amount: due,
            paid_by_id: '1',
            gift_card_id: '',
            cheque_no: '',
            payment_note: '',
            payment_receiver: ''
        });
        setClearDueOpen(true);
    };

    const handleClearDue = async () => {
        try {
            await api.post('customers/clear-due', clearDueForm);
            setClearDueOpen(false);
            fetchData();
            showToast('Due cleared successfully.');
        } catch (err) {
            showToast('Failed to clear due.', 'error');
        }
    };

    // ── Deposit Logic ──────────────────────────────────────────────────────────
    const openDeposit = (row) => {
        setDepositForm({ customer_id: row.id, amount: 0, note: '' });
        setDepositOpen(true);
    };

    const handleDeposit = async () => {
        try {
            await api.post('customer/add_deposit', depositForm);
            setDepositOpen(false);
            fetchData();
            showToast('Deposit added successfully.');
        } catch (err) {
            showToast('Failed to add deposit.', 'error');
        }
    };

    const viewDeposits = async (id) => {
        try {
            const res = await api.get(`customer/getDeposit/${id}`);
            // Format: [[ids], [dates], [amounts], [notes], [names], [emails]]
            const raw = res.data || [];
            if (raw.length) {
                const formatted = raw[0].map((_, i) => ({
                    id: raw[0][i],
                    date: raw[1][i],
                    amount: raw[2][i],
                    note: raw[3][i],
                    createdBy: raw[4][i]
                }));
                setDeposits(formatted);
                setViewDepositOpen(true);
            } else {
                setDeposits([]);
                setViewDepositOpen(true);
            }
        } catch (err) {
            showToast('Failed to load deposits.', 'error');
        }
    };

    const openEditDeposit = (dep) => {
        setEditDepositForm({ deposit_id: dep.id, amount: dep.amount, note: dep.note || '' });
        setEditDepositOpen(true);
    };

    const handleUpdateDeposit = async () => {
        try {
            await api.post('customer/update_deposit', editDepositForm);
            setEditDepositOpen(false);
            // Refresh deposits
            const depRes = await api.get(`customer/getDeposit/${deposits[0]?.id ? deposits.find(d => d.id === editDepositForm.deposit_id).customer_id : ''}`); 
            // Simplified: just show toast and user has to reopen or I find id from somewhere.
            // Better: update 'deposits' state locally or re-fetch for specific customer.
            showToast('Deposit updated.');
            setViewDepositOpen(false);
            fetchData();
        } catch (err) {
            showToast('Failed to update deposit.', 'error');
        }
    };

    const handleDeleteDeposit = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await api.post('customer/deleteDeposit', { id });
            setDeposits(prev => prev.filter(d => d.id !== id));
            showToast('Deposit deleted.');
            fetchData();
        } catch (err) {
            showToast('Failed to delete deposit.', 'error');
        }
    };

    // ── Points Logic ───────────────────────────────────────────────────────────
    const openPoint = (row) => {
        setPointForm({ customer_id: row.id, points: 0, note: '' });
        setPointOpen(true);
    };

    const handleAddPoint = async () => {
        try {
            await api.post('customer/add-point', pointForm);
            setPointOpen(false);
            fetchData();
            showToast('Points added.');
        } catch (err) {
            showToast('Failed to add points.', 'error');
        }
    };

    const viewPoints = async (id) => {
        try {
            const res = await api.get(`customer/getPoints/${id}`);
            const raw = res.data || [];
            // [[ids], [dates], [points], [notes], [names], [emails], [types], [deducted]]
            if (raw.length) {
                const formatted = raw[0].map((_, i) => ({
                    id: raw[0][i],
                    date: raw[1][i],
                    points: raw[2][i],
                    note: raw[3][i],
                    createdBy: raw[4][i],
                    type: raw[6][i]
                }));
                setPointsData(formatted);
                setViewPointsOpen(true);
            } else {
                setPointsData([]);
                setViewPointsOpen(true);
            }
        } catch (err) {
            showToast('Failed to load points.', 'error');
        }
    };

    const openEditPoint = (pt) => {
        setEditPointForm({ point_id: pt.id, points: pt.points, note: pt.note || '' });
        setEditPointOpen(true);
    };

    const handleUpdatePoint = async () => {
        try {
            await api.post('customer/update_point', editPointForm);
            setEditPointOpen(false);
            setViewPointsOpen(false);
            fetchData();
            showToast('Points updated.');
        } catch (err) {
            showToast('Failed to update points.', 'error');
        }
    };

    const handleDeletePoints = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await api.post('customer/deletePoints', { id });
            setPointsData(prev => prev.filter(p => p.id !== id));
            showToast('Points deleted.');
            fetchData();
        } catch (err) {
            showToast('Failed to delete points.', 'error');
        }
    };

    // ── Table Definitions ──────────────────────────────────────────────────────
    const columns = useMemo(() => {
        const cols = [
            { key: 'customer_group', label: 'Customer Group', sortable: true },
            { 
                key: 'customer_details', 
                label: 'Customer Details', 
                render: (r) => (
                    <div dangerouslySetInnerHTML={{ __html: r.customer_details }} className="ui-text-sm" />
                )
            },
            { key: 'discount_plan', label: 'Discount Plan' },
            { key: 'reward_point', label: 'Reward Points', align: 'center' },
            { key: 'deposited_balance', label: 'Deposited Balance', align: 'right' },
            { key: 'total_due', label: 'Total Due', align: 'right' },
        ];

        // Add dynamic custom fields
        (options.custom_fields || []).forEach(fieldName => {
            const fieldKey = (typeof fieldName === 'string' ? fieldName : fieldName.name).toLowerCase().replace(/ /g, '_');
            const label = typeof fieldName === 'string' ? fieldName : fieldName.name;
            cols.push({ key: fieldKey, label });
        });

        cols.push({
            key: 'actions',
            label: 'Action',
            align: 'right',
            render: (r) => (
                <ActionMenu
                    id={r.id}
                    openId={openMenu}
                    setOpenId={setOpenMenu}
                    items={[
                        { label: '👁 View', onClick: () => window.location.href = `/customer/view/${r.id}` },
                        canEdit && { label: '✎ Edit', onClick: () => openEdit(r) },
                        r.total_due !== '0.00' && { label: '🧹 Clear Due', onClick: () => openClearDue(r) },
                        { label: '💰 Add Deposit', onClick: () => openDeposit(r) },
                        { label: '📜 View Deposits', onClick: () => viewDeposits(r.id) },
                        options.lims_reward_point_setting_data?.is_active && { label: '⭐ Add Point', onClick: () => openPoint(r) },
                        options.lims_reward_point_setting_data?.is_active && { label: '🏆 View Points', onClick: () => viewPoints(r.id) },
                        { divider: true },
                        canDelete && { label: '🗑 Delete', danger: true, onClick: () => setDeleteId(r.id) },
                    ].filter(Boolean)}
                />
            )
        });

        return cols;
    }, [options, canEdit, canDelete, openMenu]);

    if (!canView) {
        return (
            <PageLayout title="Customer Manager">
                <p>You do not have permission to view customers.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout
            title="Customer Manager"
            actions={
                <>
                    {canAdd && <button className="ui-btn primary" onClick={openAdd}>+ Add Customer</button>}
                    {canImport && <button className="ui-btn ghost" onClick={() => setImportOpen(true)}>↑ Import</button>}
                    {selected.size > 0 && canDelete && (
                        <button className="ui-btn danger" onClick={() => setBulkDeleteOpen(true)}>
                            🗑 Delete Selected ({selected.size})
                        </button>
                    )}
                </>
            }
            onClick={(e) => { if (!e.target.closest('.ui-action-wrap')) setOpenMenu(null); }}
        >
            <div className="ui-toolbar">
                <input
                    className="ui-search"
                    placeholder="Search by name, company or phone…"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
            </div>

            <SelectionBar count={selected.size} onClear={() => setSelected(new Set())} />

            <DataTable
                columns={columns}
                rows={customers}
                loading={loading}
                emptyText="No customers found"
                emptyIcon="👥"
                sortCol={sortCol}
                sortDir={sortDir}
                onSort={(k) => { setSortCol(k); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}
                selected={selected}
                onToggleRow={toggleRow}
                onToggleAll={toggleAll}
            />

            <Pagination
                page={page}
                totalPages={Math.ceil(totalRows / pageSize)}
                pageSize={pageSize}
                totalRows={totalRows}
                onChange={setPage}
                pageSizes={PAGE_SIZES}
                onPageSize={(s) => { setPageSize(s); setPage(1); }}
            />

            {/* Modals */}

            {(addOpen || editOpen) && (
                <Modal 
                    title={editId ? "Update Customer" : "Add Customer"} 
                    onClose={() => { setAddOpen(false); setEditOpen(false); }}
                    footer={<button className="ui-btn primary" onClick={handleSubmit}>Submit</button>}
                    size="xl"
                >
                    <p className="ui-text-sm italic mb-4">The field labels marked with * are required input fields.</p>

                    {!editId && (
                        <FormField label="Both Customer and Supplier">
                            <div className="flex items-center h-full pt-1">
                                <input type="checkbox" checked={customerForm.both} onChange={(e) => patchCustomerForm({both: e.target.checked})} />
                                <span className="ml-2 font-medium">Both Customer and Supplier</span>
                            </div>
                        </FormField>
                    )}

                    <FormRow cols={3}>
                        <FormField label="Type" required>
                            <SelectInput
                                value={customerForm.type}
                                onChange={(e) => patchCustomerForm({type: e.target.value})}
                                options={options.customer_types || []}
                                required
                            />
                        </FormField>
                        <FormField label="Customer Group" required>
                            <SelectInput 
                                value={customerForm.customer_group_id}
                                onChange={(e) => patchCustomerForm({customer_group_id: e.target.value})}
                                options={(options.lims_customer_group_all || []).map(g => ({ value: String(g.id), label: g.name }))}
                                placeholder="Select customer group"
                                required
                            />
                        </FormField>
                        <FormField label="Name" required>
                            <TextInput value={customerForm.customer_name} onChange={(e) => patchCustomerForm({customer_name: e.target.value})} required />
                        </FormField>
                    </FormRow>

                    <FormRow cols={3}>
                        <FormField label="Company Name" required={customerForm.both}>
                            <TextInput value={customerForm.company_name} onChange={(e) => patchCustomerForm({company_name: e.target.value})} required={customerForm.both} />
                        </FormField>
                        <FormField label="Email" required={customerForm.both}>
                            <TextInput type="email" value={customerForm.email} placeholder="example@example.com" onChange={(e) => patchCustomerForm({email: e.target.value})} required={customerForm.both} />
                        </FormField>
                        <FormField label="Phone Number" required>
                            <TextInput value={customerForm.phone_number} onChange={(e) => patchCustomerForm({phone_number: e.target.value})} required />
                        </FormField>
                    </FormRow>

                    <FormRow cols={3}>
                        <FormField label="WhatsApp Number">
                            <TextInput value={customerForm.wa_number} placeholder="e.g. +123456789" onChange={(e) => patchCustomerForm({wa_number: e.target.value})} />
                        </FormField>
                        <FormField label="Tax Number">
                            <TextInput value={customerForm.tax_no} onChange={(e) => patchCustomerForm({tax_no: e.target.value})} />
                        </FormField>
                        <FormField label="Address" required={customerForm.both}>
                            <TextInput value={customerForm.address} onChange={(e) => patchCustomerForm({address: e.target.value})} required={customerForm.both} />
                        </FormField>
                    </FormRow>

                    <FormRow cols={3}>
                        <FormField label="City" required={customerForm.both}>
                            <TextInput value={customerForm.city} onChange={(e) => patchCustomerForm({city: e.target.value})} required={customerForm.both} />
                        </FormField>
                        <FormField label="State">
                            <TextInput value={customerForm.state} onChange={(e) => patchCustomerForm({state: e.target.value})} />
                        </FormField>
                        <FormField label="Postal Code">
                            <TextInput value={customerForm.postal_code} onChange={(e) => patchCustomerForm({postal_code: e.target.value})} />
                        </FormField>
                    </FormRow>

                    <FormRow cols={3}>
                        <FormField label="Country">
                            <TextInput value={customerForm.country} onChange={(e) => patchCustomerForm({country: e.target.value})} />
                        </FormField>
                        {!editId ? (
                            <>
                                <FormField label="Opening balance (Due)">
                                    <NumberInput value={customerForm.opening_balance} onChange={(e) => patchCustomerForm({opening_balance: e.target.value})} />
                                </FormField>
                                <FormField label="Initial Deposit">
                                    <NumberInput value={customerForm.deposit} onChange={(e) => patchCustomerForm({deposit: e.target.value})} />
                                </FormField>
                            </>
                        ) : (
                            <>
                                <FormField label="Credit Limit">
                                    <NumberInput value={customerForm.credit_limit} onChange={(e) => patchCustomerForm({credit_limit: e.target.value})} />
                                </FormField>
                                <FormField label="Payment Term">
                                    <div className="flex gap-2">
                                        <NumberInput placeholder="e.g. 30" value={customerForm.pay_term_no} onChange={(e) => patchCustomerForm({pay_term_no: e.target.value})} />
                                        <SelectInput 
                                            value={customerForm.pay_term_period}
                                            onChange={(e) => patchCustomerForm({pay_term_period: e.target.value})}
                                            options={[{ value: 'days', label: 'Days' }, { value: 'months', label: 'Months' }]}
                                        />
                                    </div>
                                </FormField>
                            </>
                        )}
                    </FormRow>

                    {!editId && (
                        <FormRow cols={3}>
                            <FormField label="Credit Limit">
                                <NumberInput value={customerForm.credit_limit} onChange={(e) => patchCustomerForm({credit_limit: e.target.value})} />
                            </FormField>
                            <FormField label="Payment Term">
                                <div className="flex gap-2">
                                    <NumberInput placeholder="e.g. 30" value={customerForm.pay_term_no} onChange={(e) => patchCustomerForm({pay_term_no: e.target.value})} />
                                    <SelectInput 
                                        value={customerForm.pay_term_period}
                                        onChange={(e) => patchCustomerForm({pay_term_period: e.target.value})}
                                        options={[{ value: 'days', label: 'Days' }, { value: 'months', label: 'Months' }]}
                                    />
                                </div>
                            </FormField>
                        </FormRow>
                    )}

                    {/* Custom Fields */}
                    {options.custom_fields && options.custom_fields.length > 0 && (
                        <FormRow cols={2}>
                            {options.custom_fields.map(field => {
                                const fn = field.field_name;
                                return (
                                    <FormField key={field.id} label={field.name} required={!!field.is_required}>
                                        {field.type === 'text' && <TextInput value={customerForm[fn] || ''} onChange={(e) => patchCustomerForm({[fn]: e.target.value})} required={!!field.is_required} />}
                                        {field.type === 'number' && <NumberInput value={customerForm[fn] || ''} onChange={(e) => patchCustomerForm({[fn]: e.target.value})} required={!!field.is_required} />}
                                        {field.type === 'textarea' && <TextareaInput value={customerForm[fn] || ''} onChange={(e) => patchCustomerForm({[fn]: e.target.value})} required={!!field.is_required} />}
                                        {field.type === 'select' && (
                                            <SelectInput 
                                                value={customerForm[fn] || ''}
                                                onChange={(e) => patchCustomerForm({[fn]: e.target.value})}
                                                options={(field.option_value || '').split(',').map(o => ({ value: o, label: o }))}
                                                required={!!field.is_required}
                                            />
                                        )}
                                        {field.type === 'radio_button' && (
                                            <div className="flex gap-4 p-2">
                                                {(field.option_value || '').split(',').map(o => (
                                                    <label key={o} className="flex items-center gap-1 cursor-pointer">
                                                        <input type="radio" checked={customerForm[fn] === o} onChange={() => patchCustomerForm({[fn]: o})} required={!!field.is_required} /> {o}
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                        {field.type === 'checkbox' && (
                                            <div className="flex flex-wrap gap-4 p-2">
                                                {(field.option_value || '').split(',').map(o => (
                                                    <label key={o} className="flex items-center gap-1 cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={(customerForm[fn] || '').split(',').includes(o)} 
                                                            onChange={(e) => {
                                                                const vals = (customerForm[fn] || '').split(',').filter(x => x);
                                                                if (e.target.checked) vals.push(o); else vals.splice(vals.indexOf(o), 1);
                                                                patchCustomerForm({[fn]: vals.join(',')});
                                                            }} 
                                                        /> {o}
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                        {field.type === 'date_picker' && <TextInput type="date" value={customerForm[fn] || ''} onChange={(e) => patchCustomerForm({[fn]: e.target.value})} required={!!field.is_required} />}
                                    </FormField>
                                );
                            })}
                        </FormRow>
                    )}

                    {!editId && (
                        <FormRow cols={3}>
                            <FormField label="Add User">
                                <div className="flex items-center h-full pt-4">
                                    <input type="checkbox" checked={customerForm.user} onChange={(e) => patchCustomerForm({user: e.target.checked})} />
                                    <span className="ml-2 font-medium">Add User</span>
                                </div>
                            </FormField>
                            {customerForm.user && (
                                <>
                            <FormField label="Username" required error={formErrors.username}>
                                <TextInput value={customerForm.username} onChange={(e) => patchCustomerForm({username: e.target.value})} required />
                            </FormField>
                                    <FormField label="Password" required>
                                        <TextInput type="password" value={customerForm.password} onChange={(e) => patchCustomerForm({password: e.target.value})} required />
                                    </FormField>
                                </>
                            )}
                        </FormRow>
                    )}
                </Modal>
            )}

            {/* Import Modal */}
            {importOpen && (
                <Modal title="Import Customer" onClose={() => setImportOpen(false)} footer={<button className="ui-btn primary" onClick={handleImport}>Submit</button>}>
                    <p className="ui-text-sm mb-4">Correct order: <b>customer_group*, name*, company_name, email, phone_number*, address*, city*, state, postal_code, country, deposit</b></p>
                    <FormRow cols={2}>
                        <FormField label="Upload CSV File" required>
                            <FileInput ref={importFileRef} accept=".csv" />
                        </FormField>
                        <FormField label="Sample File">
                            <a href="/sample_file/sample_customer.csv" className="ui-btn ghost">Download</a>
                        </FormField>
                    </FormRow>
                </Modal>
            )}

            {/* Clear Due Modal */}
            {clearDueOpen && (
                <Modal title="Clear Due" onClose={() => setClearDueOpen(false)} footer={<button className="ui-btn primary" onClick={handleClearDue}>Submit</button>}>
                    <FormRow cols={2}>
                        <FormField label="Received Amount" required>
                            <NumberInput value={clearDueForm.paying_amount} onChange={(e) => setClearDueForm({...clearDueForm, paying_amount: e.target.value})} />
                        </FormField>
                        <FormField label="Paying Amount" required>
                            <NumberInput value={clearDueForm.amount} onChange={(e) => setClearDueForm({...clearDueForm, amount: e.target.value})} />
                        </FormField>
                        <FormField label="Paid By">
                            <SelectInput 
                                value={clearDueForm.paid_by_id} 
                                onChange={(e) => setClearDueForm({...clearDueForm, paid_by_id: e.target.value})}
                                options={[
                                    { value: '1', label: 'Cash' },
                                    { value: '2', label: 'Gift Card' },
                                    { value: '3', label: 'Credit Card' },
                                    { value: '4', label: 'Cheque' },
                                    { value: '6', label: 'Deposit' },
                                    { value: '7', label: 'Points' }
                                ]}
                            />
                        </FormField>
                        <FormField label="Account">
                            <SelectInput 
                                value={clearDueForm.account_id}
                                onChange={(e) => setClearDueForm({...clearDueForm, account_id: e.target.value})}
                                options={(options.lims_account_list || []).map(a => ({ value: a.id, label: `${a.name} [${a.account_no}]` }))}
                            />
                        </FormField>
                    </FormRow>
                    <FormField label="Payment Note">
                        <TextareaInput value={clearDueForm.payment_note} onChange={(e) => setClearDueForm({...clearDueForm, payment_note: e.target.value})} rows={2} />
                    </FormField>
                </Modal>
            )}

            {/* Deposit Modals */}
            {depositOpen && (
                <Modal title="Add Deposit" onClose={() => setDepositOpen(false)} footer={<button className="ui-btn primary" onClick={handleDeposit}>Submit</button>}>
                    <FormField label="Amount" required>
                        <NumberInput value={depositForm.amount} onChange={(e) => setDepositForm({...depositForm, amount: e.target.value})} />
                    </FormField>
                    <FormField label="Note">
                        <TextareaInput value={depositForm.note} onChange={(e) => setDepositForm({...depositForm, note: e.target.value})} rows={3} />
                    </FormField>
                </Modal>
            )}

            {viewDepositOpen && (
                <Modal title="All Deposits" onClose={() => setViewDepositOpen(false)} size="lg">
                    <DataTable 
                        columns={[
                            { key: 'date', label: 'Date' },
                            { key: 'amount', label: 'Amount', align: 'right' },
                            { key: 'note', label: 'Note' },
                            { key: 'createdBy', label: 'Created By' },
                            { 
                                key: 'action', 
                                label: 'Action', 
                                render: (d) => (
                                    <div className="ui-btn-group">
                                        <button className="ui-btn-icon" onClick={() => openEditDeposit(d)}>✎</button>
                                        <button className="ui-btn-icon danger" onClick={() => handleDeleteDeposit(d.id)}>🗑</button>
                                    </div>
                                )
                            }
                        ]}
                        rows={deposits}
                        emptyText="No deposits found"
                    />
                </Modal>
            )}

            {editDepositOpen && (
                <Modal title="Update Deposit" onClose={() => setEditDepositOpen(false)} footer={<button className="ui-btn primary" onClick={handleUpdateDeposit}>Update</button>}>
                    <FormField label="Amount" required>
                        <NumberInput value={editDepositForm.amount} onChange={(e) => setEditDepositForm({...editDepositForm, amount: e.target.value})} />
                    </FormField>
                    <FormField label="Note">
                        <TextareaInput value={editDepositForm.note} onChange={(e) => setEditDepositForm({...editDepositForm, note: e.target.value})} rows={3} />
                    </FormField>
                </Modal>
            )}

            {/* Points Modals */}
            {pointOpen && (
                <Modal title="Add Points" onClose={() => setPointOpen(false)} footer={<button className="ui-btn primary" onClick={handleAddPoint}>Submit</button>}>
                    <FormField label="Points" required>
                        <NumberInput value={pointForm.points} onChange={(e) => setPointForm({...pointForm, points: e.target.value})} />
                    </FormField>
                    <FormField label="Note">
                        <TextareaInput value={pointForm.note} onChange={(e) => setPointForm({...pointForm, note: e.target.value})} rows={3} />
                    </FormField>
                </Modal>
            )}

            {viewPointsOpen && (
                <Modal title="Point History" onClose={() => setViewPointsOpen(false)} size="lg">
                    <DataTable 
                        columns={[
                            { key: 'date', label: 'Date' },
                            { key: 'points', label: 'Points', align: 'center' },
                            { key: 'type', label: 'Type' },
                            { key: 'note', label: 'Note' },
                            { key: 'createdBy', label: 'Created By' },
                            { 
                                key: 'action', 
                                label: 'Action', 
                                render: (p) => (
                                    <div className="ui-btn-group">
                                        <button className="ui-btn-icon" onClick={() => openEditPoint(p)}>✎</button>
                                        <button className="ui-btn-icon danger" onClick={() => handleDeletePoints(p.id)}>🗑</button>
                                    </div>
                                )
                            }
                        ]}
                        rows={pointsData}
                        emptyText="No points found"
                    />
                </Modal>
            )}

            {editPointOpen && (
                <Modal title="Update Point" onClose={() => setEditPointOpen(false)} footer={<button className="ui-btn primary" onClick={handleUpdatePoint}>Update</button>}>
                    <FormField label="Points" required>
                        <NumberInput value={editPointForm.points} onChange={(e) => setEditPointForm({...editPointForm, points: e.target.value})} />
                    </FormField>
                    <FormField label="Note">
                        <TextareaInput value={editPointForm.note} onChange={(e) => setEditPointForm({...editPointForm, note: e.target.value})} rows={3} />
                    </FormField>
                </Modal>
            )}

            {deleteId && (
                <ConfirmModal 
                    title="Delete Customer" 
                    message="Are you sure? This will deactivate the customer and remove access to generic discount plans."
                    danger 
                    onConfirm={handleDelete} 
                    onClose={() => setDeleteId(null)} 
                />
            )}

            {bulkDeleteOpen && (
                <ConfirmModal 
                    title="Bulk Delete" 
                    message={`Delete ${selected.size} selected customers?`}
                    danger 
                    onConfirm={handleBulkDelete} 
                    onClose={() => setBulkDeleteOpen(false)} 
                />
            )}

            <Toast toast={toast} />
        </PageLayout>
    );
};

export default CustomerManager;
