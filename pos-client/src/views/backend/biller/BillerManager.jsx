import React, { useState, useEffect, useMemo, useRef } from 'react';

import {
    PageLayout,
    DataTable,
    Modal,
    ConfirmModal,
    FormField,
    FormRow,
    TextInput,
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
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    image: null,
};

function hasBillerPermission(permissions, key) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.includes(`billers-${key}`);
}

const BillerManager = ({ controllerName }) => {
    const ctrl = controllerName || 'biller';
    const authPerms = authStore.getPermissions();
    const perms = usePermissions(ctrl);
    const canView = perms.canView || hasBillerPermission(authPerms, 'index');
    const canAdd = perms.canAdd || hasBillerPermission(authPerms, 'add');
    const canEdit = perms.canEdit || hasBillerPermission(authPerms, 'edit');
    const canDelete = perms.canDelete || hasBillerPermission(authPerms, 'delete');
    const canImport = perms.canImport || hasBillerPermission(authPerms, 'import') || canAdd;

    const [allBillers, setAllBillers] = useState([]);
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
            const res = await api.get('biller');
            setAllBillers(res.data?.billers || []);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to load billers.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredBillers = useMemo(() => {
        let rows = allBillers;
        if (search.trim()) {
            const q = search.toLowerCase();
            rows = rows.filter((r) =>
                (r.name || '').toLowerCase().includes(q) ||
                (r.company_name || '').toLowerCase().includes(q) ||
                (r.email || '').toLowerCase().includes(q) ||
                (r.phone_number || '').toLowerCase().includes(q) ||
                (r.vat_number || '').toLowerCase().includes(q) ||
                (r.address_display || '').toLowerCase().includes(q)
            );
        }
        return [...rows].sort((a, b) => {
            const av = String(a[sortCol] ?? '').toLowerCase();
            const bv = String(b[sortCol] ?? '').toLowerCase();
            if (av < bv) return sortDir === 'asc' ? -1 : 1;
            if (av > bv) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
    }, [allBillers, search, sortCol, sortDir]);

    const billers = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredBillers.slice(start, start + pageSize);
    }, [filteredBillers, page, pageSize]);

    const totalRows = filteredBillers.length;
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
        const ids = billers.map((b) => b.id);
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
            address: row.address || '',
            city: row.city || '',
            state: row.state || '',
            postal_code: row.postal_code || '',
            country: row.country || '',
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
        fd.append('state', form.state?.trim() || '');
        fd.append('postal_code', form.postal_code?.trim() || '');
        fd.append('country', form.country?.trim() || '');
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
        if (!form.address?.trim() || !form.city?.trim()) {
            showToast('Address and city are required.', 'error');
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
                await api.put(`biller/${editId}`, fd);
                showToast('Biller updated.');
                setEditOpen(false);
            } else {
                await api.post('biller', fd);
                showToast('Biller created.');
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
            await api.delete(`biller/${deleteId}`);
            setDeleteId(null);
            fetchData();
            showToast('Biller deleted.');
        } catch {
            showToast('Delete failed.', 'error');
        }
    };

    const handleBulkDelete = async () => {
        try {
            await api.post('biller/deletebyselection', { billerIdArray: Array.from(selected) });
            setBulkDeleteOpen(false);
            setSelected(new Set());
            fetchData();
            showToast(`${selected.size} biller(s) deleted.`);
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
            await api.post('importbiller', fd);
            setImportOpen(false);
            fetchData();
            showToast('Billers imported.');
        } catch (err) {
            showToast(err.response?.data?.message || 'Import failed.', 'error');
        }
    };

    const columns = [
        {
            key: 'image_url',
            label: 'Image',
            render: (row) => row.image_url
                ? <img src={row.image_url} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }} />
                : '—',
        },
        { key: 'name', label: 'Name', sortable: true },
        { key: 'company_name', label: 'Company Name', sortable: true },
        { key: 'vat_number', label: 'VAT Number', sortable: true },
        { key: 'email', label: 'Email', sortable: true },
        { key: 'phone_number', label: 'Phone Number', sortable: true },
        { key: 'address_display', label: 'Address', sortable: true },
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

    const renderForm = () => (
        <>
            <FormRow cols={3}>
                <FormField label="Name" required>
                    <TextInput value={form.name} onChange={(e) => patchForm({ name: e.target.value })} required />
                </FormField>
                <FormField label="Image">
                    <FileInput accept="image/*" onChange={(e) => patchForm({ image: e.target.files?.[0] || null })} />
                </FormField>
                <FormField label="Company Name" required>
                    <TextInput value={form.company_name} onChange={(e) => patchForm({ company_name: e.target.value })} required />
                </FormField>
            </FormRow>
            <FormRow cols={3}>
                <FormField label="VAT Number">
                    <TextInput value={form.vat_number} onChange={(e) => patchForm({ vat_number: e.target.value })} />
                </FormField>
                <FormField label="Email" required>
                    <TextInput type="email" value={form.email} onChange={(e) => patchForm({ email: e.target.value })} required />
                </FormField>
                <FormField label="Phone Number" required>
                    <TextInput value={form.phone_number} onChange={(e) => patchForm({ phone_number: e.target.value })} required />
                </FormField>
            </FormRow>
            <FormRow cols={3}>
                <FormField label="Address" required>
                    <TextInput value={form.address} onChange={(e) => patchForm({ address: e.target.value })} required />
                </FormField>
                <FormField label="City" required>
                    <TextInput value={form.city} onChange={(e) => patchForm({ city: e.target.value })} required />
                </FormField>
                <FormField label="State">
                    <TextInput value={form.state} onChange={(e) => patchForm({ state: e.target.value })} />
                </FormField>
            </FormRow>
            <FormRow cols={2}>
                <FormField label="Postal Code">
                    <TextInput value={form.postal_code} onChange={(e) => patchForm({ postal_code: e.target.value })} />
                </FormField>
                <FormField label="Country">
                    <TextInput value={form.country} onChange={(e) => patchForm({ country: e.target.value })} />
                </FormField>
            </FormRow>
        </>
    );

    if (!canView) {
        return (
            <PageLayout title="Biller List">
                <p>You do not have permission to view billers.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout
            title="Biller List"
            actions={
                <>
                    {canAdd && <button type="button" className="ui-btn primary" onClick={openAdd}>+ Add Biller</button>}
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
            <Toast toast={toast} />

            <div className="ui-toolbar">
                <input
                    className="ui-search"
                    placeholder="Search by name, company, email, phone or address…"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
            </div>

            <SelectionBar count={selected.size} onClear={() => setSelected(new Set())} />

            <DataTable
                loading={loading}
                columns={columns}
                rows={billers}
                emptyText="No billers found"
                emptyIcon="🧾"
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

            {(addOpen || editOpen) && (
                <Modal
                    title={editId ? 'Update Biller' : 'Add Biller'}
                    onClose={() => { setAddOpen(false); setEditOpen(false); setEditId(null); }}
                    footer={
                        <button type="button" className="ui-btn primary" disabled={saving} onClick={handleSubmit}>
                            {saving ? 'Saving…' : 'Submit'}
                        </button>
                    }
                    size="xl"
                >
                    {renderForm()}
                </Modal>
            )}

            {importOpen && (
                <Modal
                    title="Import Biller"
                    onClose={() => setImportOpen(false)}
                    footer={<button type="button" className="ui-btn primary" onClick={handleImport}>Submit</button>}
                >
                    <p className="ui-text-sm mb-4">
                        Column order: name*, image, company_name*, vat_number, email*, phone_number*, address*, city*, state, postal_code, country.
                        Images must exist in the <code>images/biller</code> directory.
                    </p>
                    <FormRow cols={2}>
                        <FormField label="Upload CSV File" required>
                            <FileInput inputRef={importFileRef} accept=".csv" />
                        </FormField>
                        <FormField label="Sample File">
                            <a href="/sample_file/sample_biller.csv" className="ui-btn ghost">Download</a>
                        </FormField>
                    </FormRow>
                </Modal>
            )}

            {deleteId && (
                <ConfirmModal
                    title="Delete Biller"
                    message="Are you sure you want to delete this biller?"
                    danger
                    onConfirm={handleDelete}
                    onClose={() => setDeleteId(null)}
                />
            )}

            {bulkDeleteOpen && (
                <ConfirmModal
                    title="Delete Billers"
                    message={`Delete ${selected.size} selected biller(s)?`}
                    danger
                    onConfirm={handleBulkDelete}
                    onClose={() => setBulkDeleteOpen(false)}
                />
            )}
        </PageLayout>
    );
};

export default BillerManager;
