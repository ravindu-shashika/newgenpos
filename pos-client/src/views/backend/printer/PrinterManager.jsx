import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

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
    warehouse_id: '',
    connection_type: 'network',
    capability_profile: 'default',
    char_per_line: 42,
    ip_address: '',
    port: '9100',
    path: '',
    printer_id: null,
};

// ─── Component ────────────────────────────────────────────────────────────────
const PrinterManager = ({ controllerName }) => {

    // ── Data ──────────────────────────────────────────────────────────────────
    const [printers, setPrinters] = useState([]);
    const [metadata, setMetadata] = useState({ warehouses: [], connection_types: [], capability_profiles: [] });
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
    const [deleteId, setDeleteId] = useState(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

    // ── Form ───────────────────────────────────────────────────────────────────
    const [form, setForm] = useState(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState({});

    // ── Toast ──────────────────────────────────────────────────────────────────
    const { toast, showToast } = useToast();

    // -- Permissions --
    const { canAdd, canEdit, canDelete } = usePermissions(controllerName);

    // -- Client-side Filtering/Sorting/Pagination -------------------------------
    const filteredAndSorted = useMemo(() => {
        let list = [...printers];

        // Search
        if (search) {
            const low = search.toLowerCase();
            list = list.filter(p =>
                (p.name || '').toLowerCase().includes(low) ||
                (p.warehouse?.name || '').toLowerCase().includes(low) ||
                (p.ip_address || '').toLowerCase().includes(low)
            );
        }

        // Sort
        list.sort((a, b) => {
            let valA = a[sortCol];
            let valB = b[sortCol];
            
            if (sortCol === 'warehouse') {
                valA = a.warehouse?.name || '';
                valB = b.warehouse?.name || '';
            }

            valA = (valA ?? '').toString().toLowerCase();
            valB = (valB ?? '').toString().toLowerCase();

            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

        return list;
    }, [printers, search, sortCol, sortDir]);

    const paginatedPrinters = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredAndSorted.slice(start, start + pageSize);
    }, [filteredAndSorted, page, pageSize]);

    const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize));

    // ── Fetch ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        fetchPrinters();
        fetchMetadata();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchPrinters = async () => {
        try {
            setLoading(true);
            const res = await api.get('printers');
            const data = res.data?.data ?? res.data ?? [];
            setPrinters(Array.isArray(data) ? data : []);
        } catch {
            showToast('Failed to load printers.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchMetadata = async () => {
        try {
            const res = await api.get('printers/pre-load');
            setMetadata(res.data);
            if (res.data.warehouses?.length && !form.warehouse_id) {
                // Pre-select first warehouse for NEW forms
                // setForm(f => ({ ...f, warehouse_id: res.data.warehouses[0].id }));
            }
        } catch { /* silent */ }
    };

    // ── Form helpers ───────────────────────────────────────────────────────────
    const setField = (name) => (e) =>
        setForm((f) => ({
            ...f,
            [name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
        }));

    const resetForm = () => {
        setForm({
            ...EMPTY_FORM,
            warehouse_id: metadata.warehouses[0]?.id || '',
            connection_type: Object.keys(metadata.connection_types)[0] || 'network',
            capability_profile: Object.keys(metadata.capability_profiles)[0] || 'default',
        });
        setFormErrors({});
    };

    const validate = (f) => {
        const e = {};
        if (!f.name.trim()) e.name = 'Name is required.';
        if (!f.warehouse_id) e.warehouse_id = 'Warehouse is required.';
        if (f.connection_type === 'network') {
            if (!f.ip_address.trim()) e.ip_address = 'IP address is required.';
            if (!f.port.trim()) e.port = 'Port is required.';
        } else {
            if (!f.path.trim()) e.path = 'Path is required.';
        }
        return e;
    };

    // ── CRUD ───────────────────────────────────────────────────────────────────
    const handleAdd = async () => {
        const errs = validate(form);
        if (Object.keys(errs).length) { setFormErrors(errs); return; }
        try {
            await api.post('printers', form);
            setAddOpen(false);
            resetForm();
            fetchPrinters();
            showToast('Printer added successfully.');
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to add printer.', 'error');
        }
    };

    const openEdit = useCallback((row) => {
        setForm({
            name: row.name || '',
            warehouse_id: row.warehouse_id || '',
            connection_type: row.connection_type || 'network',
            capability_profile: row.capability_profile || 'default',
            char_per_line: row.char_per_line || 42,
            ip_address: row.ip_address || '',
            port: row.port || '9100',
            path: row.path || '',
            printer_id: row.id,
        });
        setFormErrors({});
        setEditOpen(true);
    }, []);

    const handleEdit = async () => {
        const errs = validate(form);
        if (Object.keys(errs).length) { setFormErrors(errs); return; }
        try {
            await api.put(`printers/${form.printer_id}`, form);
            setEditOpen(false);
            resetForm();
            fetchPrinters();
            showToast('Printer updated successfully.');
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to update printer.', 'error');
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`printers/${deleteId}`);
            setDeleteId(null);
            fetchPrinters();
            showToast('Printer deleted.');
        } catch {
            showToast('Failed to delete printer.', 'error');
        }
    };

    const handleBulkDelete = async () => {
        try {
            await api.post('printers/deletebyselection', {
                printerIdArray: [...selected],
            });
            setBulkDeleteOpen(false);
            setSelected(new Set());
            fetchPrinters();
            showToast(`${selected.size} printer${selected.size > 1 ? 's' : ''} deleted.`);
        } catch {
            showToast('Bulk delete failed.', 'error');
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
        const ids = paginatedPrinters.map((r) => r.id);
        const allSel = ids.every((id) => selected.has(id));
        setSelected((prev) => {
            const next = new Set(prev);
            ids.forEach((id) => (allSel ? next.delete(id) : next.add(id)));
            return next;
        });
    };

    // ── Table columns ──────────────────────────────────────────────────────────
    const columns = [
        { key: 'name', label: 'Printer Name', sortable: true },
        {
            key: 'warehouse', label: 'Warehouse', sortable: true,
            render: (r) => r.warehouse?.name || 'N/A'
        },
        {
            key: 'connection_type', label: 'Connection Type', sortable: true,
            render: (r) => <span className="ui-badge ghost">{r.connection_type}</span>
        },
        { key: 'capability_profile', label: 'Capability Profile' },
        { key: 'char_per_line', label: 'Chars/Line' },
        {
            key: 'details', label: 'Connection Details',
            render: (r) => (
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                    {r.connection_type === 'network' ? (
                        `${r.ip_address}:${r.port}`
                    ) : (
                        r.path || '-'
                    )}
                </div>
            )
        },
        {
            key: 'action',
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
            ),
        },
    ];

    // ── Shared form fields ─────────────────────────────────────────────────────
    const renderFormFields = () => (
        <>
            <p className="ui-hint" style={{ color: 'var(--red-text)', marginBottom: 24, padding: 12, borderRadius: 8, background: 'var(--red-bg-soft)' }}>
                When you assign a receipt printer to a warehouse, browser printing will be turned off for that warehouse.
            </p>

            <FormRow cols={2}>
                <FormField label="Printer Name" required error={formErrors.name}>
                    <TextInput
                        name="name"
                        value={form.name}
                        onChange={setField('name')}
                    />
                </FormField>

                <FormField label="Warehouse" required error={formErrors.warehouse_id}>
                    <SelectInput
                        name="warehouse_id"
                        value={form.warehouse_id}
                        onChange={setField('warehouse_id')}
                    >
                        {metadata.warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </SelectInput>
                </FormField>
            </FormRow>

            <FormRow cols={2}>
                <FormField label="Connection Type" required>
                    <SelectInput
                        name="connection_type"
                        value={form.connection_type}
                        onChange={setField('connection_type')}
                    >
                        {Object.entries(metadata.connection_types).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                        ))}
                    </SelectInput>
                </FormField>

                <FormField label="Capability Profile" required>
                    <SelectInput
                        name="capability_profile"
                        value={form.capability_profile}
                        onChange={setField('capability_profile')}
                    >
                        {Object.entries(metadata.capability_profiles).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                        ))}
                    </SelectInput>
                </FormField>
            </FormRow>

            <FormRow cols={2}>
                <FormField label="Characters per Line" required>
                    <NumberInput
                        name="char_per_line"
                        value={form.char_per_line}
                        onChange={setField('char_per_line')}
                    />
                </FormField>

                {form.connection_type === 'network' ? (
                    <FormField label="IP Address" required error={formErrors.ip_address}>
                        <TextInput
                            name="ip_address"
                            value={form.ip_address}
                            onChange={setField('ip_address')}
                            placeholder="e.g. 192.168.1.100"
                        />
                    </FormField>
                ) : (
                    <FormField label="Path" required error={formErrors.path}>
                        <TextInput
                            name="path"
                            value={form.path}
                            onChange={setField('path')}
                            placeholder="e.g. LPT1 or /dev/lp0"
                        />
                    </FormField>
                )}
            </FormRow>

            {form.connection_type === 'network' && (
                <FormRow cols={2}>
                    <FormField label="Port" required error={formErrors.port}>
                        <TextInput
                            name="port"
                            value={form.port}
                            onChange={setField('port')}
                        />
                    </FormField>
                    <div className="ui-hint" style={{ fontSize: '0.75rem', marginTop: 32, opacity: 0.7 }}>
                        Most network printers use port <strong>9100</strong>.
                    </div>
                </FormRow>
            )}

            {form.connection_type !== 'network' && (
                <div style={{ padding: 12, borderRadius: 8, background: 'rgba(0,0,0,0.03)', fontSize: '0.75rem', lineHeight: 1.6 }}>
                    <strong>Windows:</strong> <code>LPT1</code> (parallel) / <code>COM1</code> (serial)<br/>
                    <strong>Linux:</strong> <code>/dev/lp0</code> (parallel), <code>/dev/usb/lp1</code> (USB)
                </div>
            )}
        </>
    );

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <PageLayout
            eyebrow="Settings"
            title="Printers"
            onClick={(e) => { if (!e.target.closest('.ui-action-wrap')) setOpenMenu(null); }}
            actions={
                <>
                    {canAdd && (
                        <button
                            className="ui-btn primary"
                            onClick={() => { resetForm(); setAddOpen(true); }}
                        >
                            + Add Printer
                        </button>
                    )}
                    {selected.size > 0 && (
                        <button
                            className="ui-btn danger"
                            onClick={() => setBulkDeleteOpen(true)}
                        >
                            🗑 Delete Selected ({selected.size})
                        </button>
                    )}
                </>
            }
        >
            {/* Toolbar */}
            <div className="ui-toolbar">
                <input
                    className="ui-search"
                    placeholder="Search by name or warehouse…"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
            </div>

            {/* Selection bar */}
            <SelectionBar
                count={selected.size}
                onClear={() => setSelected(new Set())}
            />

            {/* Table */}
            <DataTable
                columns={columns}
                rows={paginatedPrinters}
                loading={loading}
                emptyText="No printers found"
                emptyIcon="🖨️"
                sortCol={sortCol}
                sortDir={sortDir}
                onSort={handleSort}
                selected={selected}
                onToggleRow={toggleRow}
                onToggleAll={toggleAll}
            />

            {/* Pagination */}
            <Pagination
                page={page}
                totalPages={totalPages}
                pageSize={pageSize}
                totalRows={filteredAndSorted.length}
                onChange={setPage}
                pageSizes={PAGE_SIZES}
                onPageSize={(s) => { setPageSize(s); setPage(1); }}
            />

            {/* ── Add Modal ── */}
            {addOpen && (
                <Modal
                    title="Add Printer"
                    onClose={() => setAddOpen(false)}
                    footer={
                        <>
                            <button className="ui-btn ghost" onClick={() => setAddOpen(false)}>Cancel</button>
                            <button className="ui-btn primary" onClick={handleAdd}>Add Printer</button>
                        </>
                    }
                >
                    {renderFormFields()}
                </Modal>
            )}

            {/* ── Edit Modal ── */}
            {editOpen && (
                <Modal
                    title="Update Printer"
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

            {/* ── Single delete confirm ── */}
            {deleteId && (
                <ConfirmModal
                    title="Delete Printer"
                    danger
                    message="Are you sure you want to delete this printer?"
                    onConfirm={handleDelete}
                    onClose={() => setDeleteId(null)}
                />
            )}

            {/* ── Bulk delete confirm ── */}
            {bulkDeleteOpen && (
                <ConfirmModal
                    title="Bulk Delete Printers"
                    danger
                    message={`Are you sure you want to delete ${selected.size} printers?`}
                    onConfirm={handleBulkDelete}
                    onClose={() => setBulkDeleteOpen(false)}
                />
            )}

            {/* Toast */}
            <Toast toast={toast} />
        </PageLayout>
    );
};

export default PrinterManager;
