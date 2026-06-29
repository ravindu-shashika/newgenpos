import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    PageLayout,
    DataTable,
    Modal,
    ConfirmModal,
    FormField,
    FormRow,
    TextInput,
    TextareaInput,
    FileInput,
    Toast,
    useToast,
    ActionMenu,
    Pagination,
    SelectionBar,
} from '../../../components/ui';
import { api } from '../../../services';
import usePermissions from '../../../stores/usePermissions';

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZES = [10, 25, 50];

const EMPTY_FORM = {
    name: '',
    phone: '',
    email: '',
    address: '',
    warehouse_id: null,
};

// ─── Component ────────────────────────────────────────────────────────────────
const WarehouseManager = ({ controllerName }) => {

    // ── Data ──────────────────────────────────────────────────────────────────
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);

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
    const [addOpen, setAddOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

    // ── Form ───────────────────────────────────────────────────────────────────
    const [form, setForm] = useState(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState({});
    const importFileRef = useRef(null);

    // ── Toast ──────────────────────────────────────────────────────────────────
    const { toast, showToast } = useToast();

    // -- Permissions --
    const { canAdd, canEdit, canDelete, canImport } = usePermissions(controllerName);

    // ── Fetch ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        fetchWarehouses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchWarehouses = async () => {
        try {
            setLoading(true);
            const res = await api.get('warehouse');
            const data = res.data?.data ?? res.data ?? [];
            setWarehouses(Array.isArray(data) ? data : []);
        } catch {
            showToast('Failed to load warehouses.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ── Form helpers ───────────────────────────────────────────────────────────
    const setField = (name) => (e) =>
        setForm((f) => ({
            ...f,
            [name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
        }));

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setFormErrors({});
    };

    const validate = (f) => {
        const e = {};
        if (!f.name?.trim()) e.name = 'Name is required.';
        if (!f.phone?.trim()) e.phone = 'Phone Number is required.';
        if (!f.address?.trim()) e.address = 'Address is required.';
        return e;
    };

    // ── CRUD ───────────────────────────────────────────────────────────────────
    const handleAdd = async () => {
        const errs = validate(form);
        if (Object.keys(errs).length) { setFormErrors(errs); return; }
        try {
            await api.post('warehouse', form);
            setAddOpen(false);
            resetForm();
            fetchWarehouses();
            showToast('Warehouse added successfully.');
        } catch (err) {
            if (err.response?.data?.errors) setFormErrors(err.response.data.errors);
            else showToast('Failed to add warehouse.', 'error');
        }
    };

    const openEdit = useCallback((row) => {
        setForm({
            name: row.name || '',
            phone: row.phone || '',
            email: row.email || '',
            address: row.address || '',
            warehouse_id: row.id,
        });
        setFormErrors({});
        setEditOpen(true);
    }, []);

    const handleEdit = async () => {
        const errs = validate(form);
        if (Object.keys(errs).length) { setFormErrors(errs); return; }
        try {
            await api.put(`warehouse/${form.warehouse_id}`, form);
            setEditOpen(false);
            resetForm();
            fetchWarehouses();
            showToast('Warehouse updated successfully.');
        } catch (err) {
            if (err.response?.data?.errors) setFormErrors(err.response.data.errors);
            else showToast('Failed to update warehouse.', 'error');
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`warehouse/${deleteId}`);
            setDeleteId(null);
            fetchWarehouses();
            showToast('Warehouse deleted.');
        } catch {
            showToast('Failed to delete warehouse.', 'error');
        }
    };

    const handleBulkDelete = async () => {
        try {
            await api.post('warehouse/deletebyselection', {
                warehouseIdArray: [...selected],
            });
            setBulkDeleteOpen(false);
            setSelected(new Set());
            fetchWarehouses();
            showToast(`${selected.size} warehouse${selected.size > 1 ? 's' : ''} deleted.`);
        } catch {
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
            await api.post('/importwarehouse', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setImportOpen(false);
            fetchWarehouses();
            showToast('Warehouses imported successfully.');
        } catch (err) {
            showToast(err.response?.data?.message || 'Import failed.', 'error');
        }
    };

    // ── Sort ───────────────────────────────────────────────────────────────────
    const handleSort = (key) => {
        if (sortCol === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        else { setSortCol(key); setSortDir('asc'); }
        setPage(1);
    };

    // ── Selection ──────────────────────────────────────────────────────────────
    const toggleRow = (id) =>
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    const toggleAll = () => {
        const ids = paginated.map((r) => r.id);
        const allSel = ids.every((id) => selected.has(id));
        setSelected((prev) => {
            const next = new Set(prev);
            ids.forEach((id) => (allSel ? next.delete(id) : next.add(id)));
            return next;
        });
    };

    // ── Table Logic ───────────────────────────────────────────────────────────
    const filteredAndSorted = useMemo(() => {
        let list = [...warehouses];

        if (search) {
            const low = search.toLowerCase();
            list = list.filter(w =>
                (w.name || '').toLowerCase().includes(low) ||
                (w.phone || '').toLowerCase().includes(low) ||
                (w.email || '').toLowerCase().includes(low) ||
                (w.address || '').toLowerCase().includes(low)
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
    }, [warehouses, search, sortCol, sortDir]);

    const paginated = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredAndSorted.slice(start, start + pageSize);
    }, [filteredAndSorted, page, pageSize]);

    const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize));

    // ── Table Columns ─────────────────────────────────────────────────────────
    const columns = [
        { 
            key: 'name', 
            label: 'Warehouse', 
            sortable: true,
            render: (w) => <span className="font-medium text-ui-text">{w.name}</span>
        },
        { key: 'phone', label: 'Phone Number', sortable: true },
        { key: 'email', label: 'Email', sortable: true },
        { key: 'address', label: 'Address', sortable: true },
        { key: 'product_count', label: 'Number of Product', sortable: true },
        { key: 'stock_qty', label: 'Stock Quantity', sortable: true },
        {
            key: 'actions',
            label: 'Action',
            render: (r) => (
                <ActionMenu
                    id={r.id}
                    openId={openMenu}
                    setOpenId={setOpenMenu}
                    items={[
                        canEdit && { label: '✎ Edit', onClick: () => openEdit(r) },
                        (canEdit && canDelete) && { divider: true },
                        canDelete && { label: '🗑 Delete', danger: true, onClick: () => setDeleteId(r.id) },
                    ].filter(Boolean)}
                />
            )
        }
    ];

    // ── Shared form fields ─────────────────────────────────────────────────────
    const renderFormFields = () => (
        <>
            <FormRow cols={2}>
                <FormField label="Warehouse Name" required error={formErrors.name}>
                    <TextInput
                        value={form.name}
                        onChange={setField('name')}
                        placeholder="Type Warehouse Name"
                    />
                </FormField>
                <FormField label="Phone Number" required error={formErrors.phone}>
                    <TextInput
                        value={form.phone}
                        onChange={setField('phone')}
                    />
                </FormField>
            </FormRow>
            <FormField label="Email" error={formErrors.email}>
                <TextInput
                    type="email"
                    value={form.email}
                    onChange={setField('email')}
                    placeholder="example@example.com"
                />
            </FormField>
            <FormField label="Address" required error={formErrors.address}>
                <TextareaInput
                    rows={3}
                    value={form.address}
                    onChange={setField('address')}
                />
            </FormField>
        </>
    );

    return (
        <PageLayout
            title="Warehouse"
            onClick={(e) => { if (!e.target.closest('.ui-action-wrap')) setOpenMenu(null); }}
            actions={
                <>
                    {canAdd && (
                        <button className="ui-btn primary" onClick={() => { resetForm(); setAddOpen(true); }}>
                            + Add Warehouse
                        </button>
                    )}
                    {canImport && (
                        <button className="ui-btn ghost" onClick={() => setImportOpen(true)}>
                            ↑ Import
                        </button>
                    )}
                    {selected.size > 0 && canDelete && (
                        <button className="ui-btn danger" onClick={() => setBulkDeleteOpen(true)}>
                            🗑 Delete Selected ({selected.size})
                        </button>
                    )}
                </>
            }
        >
            <div className="ui-toolbar">
                <input
                    className="ui-search"
                    placeholder="Search by name, phone, email…"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
            </div>

            <SelectionBar
                count={selected.size}
                onClear={() => setSelected(new Set())}
            />

            <DataTable
                columns={columns}
                rows={paginated}
                loading={loading}
                emptyText="No warehouses found"
                emptyIcon="🏢"
                sortCol={sortCol}
                sortDir={sortDir}
                onSort={(col) => {
                    if (sortCol === col) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                    else { setSortCol(col); setSortDir('asc'); }
                }}
                selected={selected}
                onToggleRow={toggleRow}
                onToggleAll={toggleAll}
            />

            <Pagination
                page={page}
                totalPages={totalPages}
                pageSize={pageSize}
                totalRows={filteredAndSorted.length}
                onChange={setPage}
                pageSizes={PAGE_SIZES}
                onPageSize={(s) => { setPageSize(s); setPage(1); }}
            />

            {/* -- Add Modal -- */}
            {addOpen && (
                <Modal
                    title="Add Warehouse"
                    onClose={() => setAddOpen(false)}
                    footer={
                        <>
                            <button className="ui-btn ghost" onClick={() => setAddOpen(false)}>Cancel</button>
                            <button className="ui-btn primary" onClick={handleAdd}>Add Warehouse</button>
                        </>
                    }
                >
                    {renderFormFields()}
                </Modal>
            )}

            {/* -- Edit Modal -- */}
            {editOpen && (
                <Modal
                    title="Update Warehouse"
                    onClose={() => setEditOpen(false)}
                    footer={
                        <>
                            <button className="ui-btn ghost" onClick={() => setEditOpen(false)}>Cancel</button>
                            <button className="ui-btn primary" onClick={handleEdit}>Update</button>
                        </>
                    }
                >
                    {renderFormFields()}
                </Modal>
            )}

            {/* -- Import Modal -- */}
            {importOpen && (
                <Modal
                    title="Import Warehouse"
                    onClose={() => setImportOpen(false)}
                    footer={
                        <>
                            <button className="ui-btn ghost" onClick={() => setImportOpen(false)}>Cancel</button>
                            <button className="ui-btn primary" onClick={handleImport}>Import</button>
                        </>
                    }
                >
                    <p style={{ fontSize: '0.8rem', marginBottom: 16, lineHeight: 1.6 }}>
                        The correct column order is <strong>name*</strong>, phone, email, <strong>address*</strong>
                    </p>
                    <FormRow cols={2}>
                        <FormField label="Upload CSV File" required>
                            <FileInput ref={importFileRef} accept=".csv" />
                        </FormField>
                        <FormField label="Sample File">
                            <a href="/sample_file/sample_warehouse.csv" className="ui-btn ghost" style={{ justifyContent: 'center' }}>
                                ↓ Download Sample
                            </a>
                        </FormField>
                    </FormRow>
                </Modal>
            )}

            {/* -- Confirm Delete -- */}
            {deleteId && (
                <ConfirmModal
                    title="Delete Warehouse"
                    message="Are you sure you want to delete this warehouse?"
                    danger
                    onConfirm={handleDelete}
                    onClose={() => setDeleteId(null)}
                />
            )}

            {/* -- Bulk Delete -- */}
            {bulkDeleteOpen && (
                <ConfirmModal
                    title="Bulk Delete"
                    message={`Are you sure you want to delete ${selected.size} selected warehouses?`}
                    danger
                    onConfirm={handleBulkDelete}
                    onClose={() => setBulkDeleteOpen(false)}
                />
            )}

            <Toast toast={toast} />
        </PageLayout>
    );
};

export default WarehouseManager;
