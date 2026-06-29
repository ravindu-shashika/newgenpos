import React, { useState, useEffect, useMemo, useRef } from 'react';

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
import api from '../../../services/api';
import authStore from '../../../stores/authStore';
import usePermissions from '../../../stores/usePermissions';

const PAGE_SIZES = [10, 25, 50, 100];

const INITIAL_FORM = {
    name: '',
    company_name: '',
    vat_number: '',
    email: '',
    phone_number: '',
    wa_number: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    opening_balance: 0,
    pay_term_no: '',
    pay_term_period: 'days',
    bank_details: '',
    customer_group_id: '',
    both: false,
    image: null,
};

function hasSupplierPermission(permissions, key) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.includes(`suppliers-${key}`);
}

const SupplierManager = ({ controllerName }) => {
    const ctrl = controllerName === 'supplier' ? 'suppliers' : (controllerName || 'suppliers');
    const authPerms = authStore.getPermissions();
    const perms = usePermissions(ctrl);
    const canView = perms.canView || hasSupplierPermission(authPerms, 'index');
    const canAdd = perms.canAdd || hasSupplierPermission(authPerms, 'add');
    const canEdit = perms.canEdit || hasSupplierPermission(authPerms, 'edit');
    const canDelete = perms.canDelete || hasSupplierPermission(authPerms, 'delete');
    const canImport = perms.canImport || hasSupplierPermission(authPerms, 'import') || hasSupplierPermission(authPerms, 'add');

    const [allSuppliers, setAllSuppliers] = useState([]);
    const [metadata, setMetadata] = useState({ lims_customer_group_all: [] });
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
    const [importOpen, setImportOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [clearDueOpen, setClearDueOpen] = useState(false);
    const [clearDueForm, setClearDueForm] = useState({ supplier_id: '', amount: '', note: '' });

    const [form, setForm] = useState(INITIAL_FORM);
    const [saving, setSaving] = useState(false);
    const importFileRef = useRef(null);

    const { toast, showToast } = useToast();
    const patchForm = (patch) => setForm((f) => ({ ...f, ...patch }));

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get('supplier');
            const data = res.data || {};
            setAllSuppliers(data.suppliers || []);
            setMetadata({
                lims_customer_group_all: data.lims_customer_group_all || [],
            });
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to load suppliers.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredSuppliers = useMemo(() => {
        let rows = allSuppliers;
        if (search.trim()) {
            const q = search.toLowerCase();
            rows = rows.filter((r) =>
                (r.name || '').toLowerCase().includes(q) ||
                (r.company_name || '').toLowerCase().includes(q) ||
                (r.phone_number || '').toLowerCase().includes(q) ||
                (r.email || '').toLowerCase().includes(q)
            );
        }
        return [...rows].sort((a, b) => {
            const av = String(a[sortCol] ?? '').toLowerCase();
            const bv = String(b[sortCol] ?? '').toLowerCase();
            if (av < bv) return sortDir === 'asc' ? -1 : 1;
            if (av > bv) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
    }, [allSuppliers, search, sortCol, sortDir]);

    const totalRows = filteredSuppliers.length;
    const suppliers = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredSuppliers.slice(start, start + pageSize);
    }, [filteredSuppliers, page, pageSize]);

    const toggleRow = (id) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        const ids = suppliers.map((s) => s.id);
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
        setForm(INITIAL_FORM);
        setAddOpen(true);
    };

    const openEdit = (row) => {
        setEditId(row.id);
        setForm({
            ...INITIAL_FORM,
            name: row.name || '',
            company_name: row.company_name || '',
            vat_number: row.vat_number || '',
            email: row.email || '',
            phone_number: row.phone_number || '',
            wa_number: row.wa_number || '',
            address: row.address || '',
            city: row.city || '',
            state: row.state || '',
            postal_code: row.postal_code || '',
            country: row.country || '',
            opening_balance: row.opening_balance || 0,
            pay_term_no: row.pay_term_no || '',
            pay_term_period: row.pay_term_period || 'days',
            bank_details: row.bank_details || '',
            image: null,
        });
        setEditOpen(true);
    };

    const buildFormData = () => {
        const fd = new FormData();
        fd.append('name', form.name.trim());
        fd.append('company_name', form.company_name.trim());
        fd.append('email', form.email.trim());
        fd.append('phone_number', form.phone_number.trim());
        fd.append('address', form.address.trim());
        fd.append('city', form.city.trim());
        fd.append('vat_number', form.vat_number?.trim() || '');
        fd.append('wa_number', form.wa_number?.trim() || '');
        fd.append('state', form.state?.trim() || '');
        fd.append('postal_code', form.postal_code?.trim() || '');
        fd.append('country', form.country?.trim() || '');
        fd.append('opening_balance', form.opening_balance ?? 0);
        fd.append('pay_term_no', form.pay_term_no || '');
        fd.append('pay_term_period', form.pay_term_period || 'days');
        fd.append('bank_details', form.bank_details?.trim() || '');
        if (form.both) {
            fd.append('both', '1');
            fd.append('customer_group_id', form.customer_group_id);
        }
        if (form.image) fd.append('image', form.image);
        return fd;
    };

    const validateForm = () => {
        if (!form.name?.trim()) {
            showToast('Name is required.', 'error');
            return false;
        }
        if (!form.company_name?.trim()) {
            showToast('Company name is required.', 'error');
            return false;
        }
        if (!form.email?.trim()) {
            showToast('Email is required.', 'error');
            return false;
        }
        if (!form.phone_number?.trim()) {
            showToast('Phone number is required.', 'error');
            return false;
        }
        if (!form.address?.trim()) {
            showToast('Address is required.', 'error');
            return false;
        }
        if (!form.city?.trim()) {
            showToast('City is required.', 'error');
            return false;
        }
        if (form.both && !form.customer_group_id) {
            showToast('Customer group is required when creating both customer and supplier.', 'error');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        try {
            setSaving(true);
            const fd = buildFormData();
            if (editId) {
                await api.put(`supplier/${editId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                showToast('Supplier updated.');
                setEditOpen(false);
            } else {
                await api.post('supplier', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                showToast('Supplier created.');
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
            await api.delete(`supplier/${deleteId}`);
            setDeleteId(null);
            fetchData();
            showToast('Supplier deleted.');
        } catch {
            showToast('Delete failed.', 'error');
        }
    };

    const handleBulkDelete = async () => {
        try {
            await api.post('supplier/deletebyselection', { supplierIdArray: Array.from(selected) });
            setBulkDeleteOpen(false);
            setSelected(new Set());
            fetchData();
            showToast(`${selected.size} supplier(s) deleted.`);
        } catch {
            showToast('Bulk delete failed.', 'error');
        }
    };

    const handleImport = async (e) => {
        e.preventDefault();
        const file = importFileRef.current?.files?.[0];
        if (!file) return;
        const fd = new FormData();
        fd.append('file', file);
        try {
            await api.post('importsupplier', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setImportOpen(false);
            fetchData();
            showToast('Suppliers imported.');
        } catch (err) {
            showToast(err.response?.data?.message || 'Import failed.', 'error');
        }
    };

    const openClearDue = (row) => {
        setClearDueForm({
            supplier_id: row.id,
            amount: parseFloat(String(row.total_due || '0').replace(/,/g, '')) || '',
            note: '',
        });
        setClearDueOpen(true);
    };

    const handleClearDue = async () => {
        try {
            await api.post('suppliers/clear-due', clearDueForm);
            setClearDueOpen(false);
            fetchData();
            showToast('Due cleared.');
        } catch {
            showToast('Failed to clear due.', 'error');
        }
    };

    const groupOptions = useMemo(
        () => (metadata.lims_customer_group_all || []).map((g) => ({ value: String(g.id), label: g.name })),
        [metadata.lims_customer_group_all]
    );

    const columns = useMemo(() => [
        {
            key: 'image_url',
            label: 'Image',
            render: (r) => (
                <img src={r.image_url} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }} />
            ),
        },
        {
            key: 'supplier_details',
            label: 'Supplier Details',
            sortable: true,
            render: (r) => <div dangerouslySetInnerHTML={{ __html: r.supplier_details }} className="ui-text-sm" />,
        },
        { key: 'total_due', label: 'Total Due', align: 'right', sortable: true },
        {
            key: 'actions',
            label: 'Action',
            align: 'right',
            render: (r) => (
                <ActionMenu
                    id={r.id}
                    openId={openMenu}
                    setOpenId={setOpenMenu}
                    items={[
                        { label: '👁 View', onClick: () => { window.location.hash = `#/supplier/view/${r.id}`; } },
                        canEdit && { label: '✎ Edit', onClick: () => openEdit(r) },
                        parseFloat(String(r.total_due || '0').replace(/,/g, '')) > 0 && {
                            label: '🧹 Clear Due',
                            onClick: () => openClearDue(r),
                        },
                        { divider: true },
                        canDelete && { label: '🗑 Delete', danger: true, onClick: () => setDeleteId(r.id) },
                    ].filter(Boolean)}
                />
            ),
        },
    ], [canEdit, canDelete, openMenu]);

    if (!canView) {
        return (
            <PageLayout title="Supplier List">
                <p>You do not have permission to view suppliers.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout
            title="Supplier List"
            actions={
                <>
                    {canAdd && <button type="button" className="ui-btn primary" onClick={openAdd}>+ Add Supplier</button>}
                    {canImport && <button type="button" className="ui-btn ghost" onClick={() => setImportOpen(true)}>↑ Import</button>}
                    {selected.size > 0 && canDelete && (
                        <button type="button" className="ui-btn danger" onClick={() => setBulkDeleteOpen(true)}>
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
                    placeholder="Search by name, company, phone or email…"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
            </div>

            <SelectionBar count={selected.size} onClear={() => setSelected(new Set())} />

            <DataTable
                columns={columns}
                rows={suppliers}
                loading={loading}
                emptyText="No suppliers found"
                emptyIcon="🏢"
                sortCol={sortCol}
                sortDir={sortDir}
                onSort={(k) => { setSortCol(k); setSortDir((d) => (d === 'asc' ? 'desc' : 'asc')); }}
                selected={selected}
                onToggleRow={toggleRow}
                onToggleAll={toggleAll}
            />

            <Pagination
                page={page}
                totalPages={Math.max(1, Math.ceil(totalRows / pageSize))}
                pageSize={pageSize}
                totalRows={totalRows}
                onChange={setPage}
                pageSizes={PAGE_SIZES}
                onPageSize={(s) => { setPageSize(s); setPage(1); }}
            />

            {(addOpen || editOpen) && (
                <Modal
                    title={editId ? 'Update Supplier' : 'Add Supplier'}
                    onClose={() => { setAddOpen(false); setEditOpen(false); }}
                    footer={
                        <button type="button" className="ui-btn primary" onClick={handleSubmit} disabled={saving}>
                            {saving ? 'Saving…' : 'Submit'}
                        </button>
                    }
                    size="xl"
                >
                    <FormRow cols={3}>
                        {!editId && (
                            <FormField label="Both Customer and Supplier">
                                <label className="ui-checkbox-row">
                                    <input
                                        type="checkbox"
                                        checked={form.both}
                                        onChange={(e) => patchForm({ both: e.target.checked })}
                                    />
                                    Both Customer and Supplier
                                </label>
                            </FormField>
                        )}
                        {!editId && form.both && (
                            <FormField label="Customer Group" required>
                                <SelectInput
                                    value={form.customer_group_id}
                                    onChange={(e) => patchForm({ customer_group_id: e.target.value })}
                                    options={groupOptions}
                                    placeholder="Select customer group"
                                    required
                                />
                            </FormField>
                        )}
                        <FormField label="Name" required>
                            <TextInput value={form.name} onChange={(e) => patchForm({ name: e.target.value })} required />
                        </FormField>
                    </FormRow>

                    <FormRow cols={3}>
                        <FormField label="Image">
                            <FileInput onChange={(e) => patchForm({ image: e.target.files?.[0] || null })} accept="image/*" />
                        </FormField>
                        <FormField label="Company Name" required>
                            <TextInput value={form.company_name} onChange={(e) => patchForm({ company_name: e.target.value })} required />
                        </FormField>
                        <FormField label="VAT / Tax Number">
                            <TextInput value={form.vat_number} onChange={(e) => patchForm({ vat_number: e.target.value })} />
                        </FormField>
                    </FormRow>

                    <FormRow cols={3}>
                        {!editId && (
                            <FormField label="Opening Balance (Due)">
                                <NumberInput value={form.opening_balance} onChange={(e) => patchForm({ opening_balance: e.target.value })} step="any" />
                            </FormField>
                        )}
                        <FormField label="Email" required>
                            <TextInput type="email" value={form.email} onChange={(e) => patchForm({ email: e.target.value })} required />
                        </FormField>
                        <FormField label="Phone Number" required>
                            <TextInput value={form.phone_number} onChange={(e) => patchForm({ phone_number: e.target.value })} required />
                        </FormField>
                    </FormRow>

                    <FormRow cols={3}>
                        <FormField label="WhatsApp Number">
                            <TextInput value={form.wa_number} onChange={(e) => patchForm({ wa_number: e.target.value })} />
                        </FormField>
                        <FormField label="Address" required>
                            <TextInput value={form.address} onChange={(e) => patchForm({ address: e.target.value })} required />
                        </FormField>
                        <FormField label="City" required>
                            <TextInput value={form.city} onChange={(e) => patchForm({ city: e.target.value })} required />
                        </FormField>
                    </FormRow>

                    <FormRow cols={3}>
                        <FormField label="State">
                            <TextInput value={form.state} onChange={(e) => patchForm({ state: e.target.value })} />
                        </FormField>
                        <FormField label="Postal Code">
                            <TextInput value={form.postal_code} onChange={(e) => patchForm({ postal_code: e.target.value })} />
                        </FormField>
                        <FormField label="Country">
                            <TextInput value={form.country} onChange={(e) => patchForm({ country: e.target.value })} />
                        </FormField>
                    </FormRow>

                    <FormRow cols={2}>
                        <FormField label="Payment Term">
                            <div className="flex gap-2">
                                <NumberInput placeholder="e.g. 30" value={form.pay_term_no} onChange={(e) => patchForm({ pay_term_no: e.target.value })} />
                                <SelectInput
                                    value={form.pay_term_period}
                                    onChange={(e) => patchForm({ pay_term_period: e.target.value })}
                                    options={[
                                        { value: 'days', label: 'Days' },
                                        { value: 'months', label: 'Months' },
                                    ]}
                                />
                            </div>
                        </FormField>
                        <FormField label="Bank Details">
                            <TextareaInput value={form.bank_details} onChange={(e) => patchForm({ bank_details: e.target.value })} rows={3} />
                        </FormField>
                    </FormRow>
                </Modal>
            )}

            {importOpen && (
                <Modal title="Import Supplier" onClose={() => setImportOpen(false)} footer={<button type="button" className="ui-btn primary" onClick={handleImport}>Submit</button>}>
                    <p className="ui-text-sm mb-4">Column order: name*, image, company_name*, vat_number, email*, phone_number*, address*, city*, state, postal_code, country</p>
                    <FormRow cols={2}>
                        <FormField label="Upload CSV File" required>
                            <FileInput ref={importFileRef} accept=".csv" />
                        </FormField>
                        <FormField label="Sample File">
                            <a href="/sample_file/sample_supplier.csv" className="ui-btn ghost">Download</a>
                        </FormField>
                    </FormRow>
                </Modal>
            )}

            {clearDueOpen && (
                <Modal title="Clear Due" onClose={() => setClearDueOpen(false)} footer={<button type="button" className="ui-btn primary" onClick={handleClearDue}>Submit</button>}>
                    <FormField label="Amount" required>
                        <NumberInput value={clearDueForm.amount} onChange={(e) => setClearDueForm((f) => ({ ...f, amount: e.target.value }))} />
                    </FormField>
                    <FormField label="Note">
                        <TextareaInput value={clearDueForm.note} onChange={(e) => setClearDueForm((f) => ({ ...f, note: e.target.value }))} rows={3} />
                    </FormField>
                </Modal>
            )}

            {deleteId && (
                <ConfirmModal
                    title="Delete Supplier"
                    message="Are you sure? This will deactivate the supplier."
                    danger
                    onConfirm={handleDelete}
                    onClose={() => setDeleteId(null)}
                />
            )}

            {bulkDeleteOpen && (
                <ConfirmModal
                    title="Bulk Delete"
                    message={`Delete ${selected.size} selected supplier(s)?`}
                    danger
                    onConfirm={handleBulkDelete}
                    onClose={() => setBulkDeleteOpen(false)}
                />
            )}

            <Toast toast={toast} />
        </PageLayout>
    );
};

export default SupplierManager;
