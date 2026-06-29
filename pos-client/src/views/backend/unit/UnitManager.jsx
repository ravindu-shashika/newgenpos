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
    FileInput,
} from '../../../components/ui';
import { api } from '../../../services';
import usePermissions from '../../../stores/usePermissions';

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZES = [10, 25, 50];

const EMPTY_FORM = {
    unit_code: '',
    unit_name: '',
    base_unit: '',
    operator: '*',
    operation_value: 1,
    unit_id: null,
};

// ─── Component ────────────────────────────────────────────────────────────────
const UnitManager = ({ controllerName }) => {

    // ── Data ──────────────────────────────────────────────────────────────────
    const [units, setUnits] = useState([]);
    const [baseUnitsList, setBaseUnitsList] = useState([]);
    const [loading, setLoading] = useState(true);

    // ── Pagination / sort / search ─────────────────────────────────────────────
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [sortCol, setSortCol] = useState('unit_name');
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

    // -- Client-side Filtering/Sorting/Pagination -------------------------------
    const filteredAndSorted = useMemo(() => {
        let list = [...units];

        // Search
        if (search) {
            const low = search.toLowerCase();
            list = list.filter(u =>
                (u.unit_code || '').toLowerCase().includes(low) ||
                (u.unit_name || '').toLowerCase().includes(low)
            );
        }

        // Sort
        list.sort((a, b) => {
            const valA = (a[sortCol] ?? '').toString().toLowerCase();
            const valB = (b[sortCol] ?? '').toString().toLowerCase();
            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

        return list;
    }, [units, search, sortCol, sortDir]);

    const paginatedUnits = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredAndSorted.slice(start, start + pageSize);
    }, [filteredAndSorted, page, pageSize]);

    const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize));

    // ── Fetch ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        fetchUnits();
        fetchBaseUnits();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchUnits = async () => {
        try {
            setLoading(true);
            const res = await api.get('unit');
            const data = res.data?.data ?? res.data ?? [];
            setUnits(Array.isArray(data) ? data : []);
        } catch {
            showToast('Failed to load units.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchBaseUnits = async () => {
        try {
            const res = await api.get('unit/base-units');
            const data = res.data?.data ?? res.data ?? [];
            setBaseUnitsList(Array.isArray(data) ? data : []);
        } catch { /* silent */ }
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
        if (!f.unit_code.trim()) e.unit_code = 'Code is required.';
        if (!f.unit_name.trim()) e.unit_name = 'Name is required.';
        return e;
    };

    // ── CRUD ───────────────────────────────────────────────────────────────────
    const handleAdd = async () => {
        const errs = validate(form);
        if (Object.keys(errs).length) { setFormErrors(errs); return; }
        try {
            await api.post('unit', form);
            setAddOpen(false);
            resetForm();
            fetchUnits();
            fetchBaseUnits();
            showToast('Unit added successfully.');
        } catch {
            showToast('Failed to add unit.', 'error');
        }
    };

    const openEdit = useCallback((row) => {
        setForm({
            unit_code: row.unit_code || '',
            unit_name: row.unit_name || '',
            base_unit: row.base_unit || '',
            operator: row.operator || '*',
            operation_value: row.operation_value || 1,
            unit_id: row.id,
        });
        setFormErrors({});
        setEditOpen(true);
    }, []);

    const handleEdit = async () => {
        const errs = validate(form);
        if (Object.keys(errs).length) { setFormErrors(errs); return; }
        try {
            await api.put(`unit/${form.unit_id}`, form);
            setEditOpen(false);
            resetForm();
            fetchUnits();
            fetchBaseUnits();
            showToast('Unit updated successfully.');
        } catch {
            showToast('Failed to update unit.', 'error');
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`unit/${deleteId}`);
            setDeleteId(null);
            fetchUnits();
            fetchBaseUnits();
            showToast('Unit deleted.');
        } catch {
            showToast('Failed to delete unit.', 'error');
        }
    };

    const handleBulkDelete = async () => {
        try {
            await api.post('unit/deletebyselection', {
                unitIdArray: [...selected],
            });
            setBulkDeleteOpen(false);
            setSelected(new Set());
            fetchUnits();
            fetchBaseUnits();
            showToast(`${selected.size} unit${selected.size > 1 ? 's' : ''} deleted.`);
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
            await api.post('unit/import', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setImportOpen(false);
            fetchUnits();
            fetchBaseUnits();
            showToast('Units imported successfully.');
        } catch {
            showToast('Import failed.', 'error');
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
        const ids = paginatedUnits.map((r) => r.id);
        const allSel = ids.every((id) => selected.has(id));
        setSelected((prev) => {
            const next = new Set(prev);
            ids.forEach((id) => (allSel ? next.delete(id) : next.add(id)));
            return next;
        });
    };

    // ── Table columns ──────────────────────────────────────────────────────────
    const columns = [
        { key: 'unit_code', label: 'Code', sortable: true },
        { key: 'unit_name', label: 'Name', sortable: true },
        {
            key: 'base_unit_name', label: 'Base Unit', sortable: true,
            render: (r) => r.base_unit_name || 'N/A'
        },
        {
            key: 'operator', label: 'Operator',
            render: (r) => r.operator || 'N/A'
        },
        {
            key: 'operation_value', label: 'Operation Value',
            render: (r) => r.operation_value || 'N/A'
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
            <FormRow cols={2}>
                <FormField label="Code" required error={formErrors.unit_code}>
                    <TextInput
                        name="unit_code"
                        value={form.unit_code}
                        onChange={setField('unit_code')}
                    />
                </FormField>

                <FormField label="Name" required error={formErrors.unit_name}>
                    <TextInput
                        name="unit_name"
                        value={form.unit_name}
                        onChange={setField('unit_name')}
                    />
                </FormField>
            </FormRow>

            <FormRow cols={2}>
                <FormField label="Base Unit">
                    <SelectInput
                        name="base_unit"
                        value={form.base_unit}
                        onChange={setField('base_unit')}
                    >
                        <option value="">No Base Unit</option>
                        {baseUnitsList.map((unit) => (
                            <option key={unit.id} value={unit.id}>{unit.unit_name}</option>
                        ))}
                    </SelectInput>
                </FormField>

                {form.base_unit && (
                    <FormField label="Operator" required>
                        <SelectInput
                            name="operator"
                            value={form.operator}
                            onChange={setField('operator')}
                        >
                            <option value="*">* (Multiplication)</option>
                            <option value="/">/ (Division)</option>
                        </SelectInput>
                    </FormField>
                )}
            </FormRow>

            {form.base_unit && (
                <FormRow cols={2}>
                    <FormField label="Operation Value" required>
                        <NumberInput
                            name="operation_value"
                            value={form.operation_value}
                            onChange={setField('operation_value')}
                            step="any"
                        />
                    </FormField>
                    <div className="ui-hint" style={{ fontSize: '0.75rem', marginTop: 32, opacity: 0.7 }}>
                        <strong>Example:</strong> 1 Dozen = 1 <strong>*</strong> 12 Piece
                    </div>
                </FormRow>
            )}
        </>
    );

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <PageLayout
            eyebrow="Products"
            title="Units"
            onClick={(e) => { if (!e.target.closest('.ui-action-wrap')) setOpenMenu(null); }}
            actions={
                <>
                    {canAdd && (
                        <button
                            className="ui-btn primary"
                            onClick={() => { resetForm(); setAddOpen(true); }}
                        >
                            + Add Unit
                        </button>
                    )}
                    {canImport && (
                        <button
                            className="ui-btn ghost"
                            onClick={() => setImportOpen(true)}
                        >
                            ↑ Import
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
                    placeholder="Search by code or name…"
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
                rows={paginatedUnits}
                loading={loading}
                emptyText="No units found"
                emptyIcon="📏"
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
                    title="Add Unit"
                    onClose={() => setAddOpen(false)}
                    footer={
                        <>
                            <button className="ui-btn ghost" onClick={() => setAddOpen(false)}>Cancel</button>
                            <button className="ui-btn primary" onClick={handleAdd}>Add Unit</button>
                        </>
                    }
                >
                    {renderFormFields()}
                </Modal>
            )}

            {/* ── Edit Modal ── */}
            {editOpen && (
                <Modal
                    title="Update Unit"
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

            {/* ── Import Modal ── */}
            {importOpen && (
                <Modal
                    title="Import Units"
                    onClose={() => setImportOpen(false)}
                    footer={
                        <>
                            <button className="ui-btn ghost" onClick={() => setImportOpen(false)}>Cancel</button>
                            <button className="ui-btn primary" onClick={handleImport}>Import</button>
                        </>
                    }
                >
                    <p style={{ fontSize: '0.8rem', marginBottom: 16, lineHeight: 1.6 }}>
                        CSV column order: <strong>unit_code*</strong>, <strong>unit_name*</strong>, base_unit [code], operator, operation_value
                    </p>
                    <FormRow cols={2}>
                        <FormField label="Upload CSV File" required>
                            <FileInput
                                name="file"
                                accept=".csv"
                                inputRef={importFileRef}
                            />
                        </FormField>
                        <FormField label="Sample File">
                            <a
                                href="/sample_file/sample_unit.csv"
                                download
                                className="ui-btn ghost"
                                style={{ justifyContent: 'center' }}
                            >
                                ↓ Download Sample
                            </a>
                        </FormField>
                    </FormRow>
                </Modal>
            )}

            {/* ── Single delete confirm ── */}
            {deleteId && (
                <ConfirmModal
                    title="Delete Unit"
                    danger
                    message="Are you sure you want to delete this unit?"
                    onConfirm={handleDelete}
                    onClose={() => setDeleteId(null)}
                />
            )}

            {/* ── Bulk delete confirm ── */}
            {bulkDeleteOpen && (
                <ConfirmModal
                    title="Bulk Delete Units"
                    danger
                    message={`Are you sure you want to delete ${selected.size} units?`}
                    onConfirm={handleBulkDelete}
                    onClose={() => setBulkDeleteOpen(false)}
                />
            )}

            {/* Toast */}
            <Toast toast={toast} />
        </PageLayout>
    );
};

export default UnitManager;
