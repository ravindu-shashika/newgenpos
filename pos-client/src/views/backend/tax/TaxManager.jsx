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
    FileInput,
    Toast,
    useToast,
    ActionMenu,
    Pagination,
    SelectionBar,
} from '../../../components/ui';
import { api } from '../../../services';
import usePermissions from '../../../stores/usePermissions';

const PAGE_SIZES = [10, 25, 50];

const EMPTY_FORM = {
    name: '',
    rate: '',
    tax_id: null,
};

const TaxManager = ({ controllerName }) => {
    const ctrl = controllerName === 'taxes' ? 'tax' : (controllerName || 'tax');
    const { canAdd, canEdit, canDelete, canImport } = usePermissions(ctrl);

    const [taxes, setTaxes] = useState([]);
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
    const [importOpen, setImportOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

    const [form, setForm] = useState(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState({});
    const importFileRef = useRef(null);

    const { toast, showToast } = useToast();

    const setField = (name) => (e) =>
        setForm((f) => ({ ...f, [name]: e.target.value }));

    useEffect(() => {
        fetchTaxes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchTaxes = async () => {
        try {
            setLoading(true);
            const res = await api.get('tax');
            const data = res.data?.data ?? res.data ?? [];
            setTaxes(Array.isArray(data) ? data : []);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to load taxes.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setFormErrors({});
    };

    const validate = (f) => {
        const errors = {};
        if (!f.name?.trim()) errors.name = 'Name is required.';
        if (f.rate === '' || f.rate === null || f.rate === undefined) {
            errors.rate = 'Rate is required.';
        } else if (Number(f.rate) < 0 || Number(f.rate) > 100) {
            errors.rate = 'Rate must be between 0 and 100.';
        }
        return errors;
    };

    const handleAdd = async () => {
        const errs = validate(form);
        if (Object.keys(errs).length) {
            setFormErrors(errs);
            return;
        }
        try {
            const res = await api.post('tax', {
                name: form.name.trim(),
                rate: Number(form.rate),
            });
            setAddOpen(false);
            resetForm();
            fetchTaxes();
            showToast(res.data?.message || 'Tax added successfully.', 'success');
        } catch (err) {
            if (err.response?.data?.errors) setFormErrors(err.response.data.errors);
            else showToast(err.response?.data?.message || 'Failed to add tax.', 'error');
        }
    };

    const openEdit = useCallback((row) => {
        setForm({
            name: row.name || '',
            rate: row.rate ?? '',
            tax_id: row.id,
        });
        setFormErrors({});
        setEditOpen(true);
    }, []);

    const handleEdit = async () => {
        const errs = validate(form);
        if (Object.keys(errs).length) {
            setFormErrors(errs);
            return;
        }
        try {
            const res = await api.put(`tax/${form.tax_id}`, {
                tax_id: form.tax_id,
                name: form.name.trim(),
                rate: Number(form.rate),
            });
            setEditOpen(false);
            resetForm();
            fetchTaxes();
            showToast(res.data?.message || 'Tax updated successfully.', 'success');
        } catch (err) {
            if (err.response?.data?.errors) setFormErrors(err.response.data.errors);
            else showToast(err.response?.data?.message || 'Failed to update tax.', 'error');
        }
    };

    const handleDelete = async () => {
        try {
            const res = await api.delete(`tax/${deleteId}`);
            setDeleteId(null);
            fetchTaxes();
            showToast(res.data?.message || 'Tax deleted.', 'success');
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to delete tax.', 'error');
        }
    };

    const handleBulkDelete = async () => {
        try {
            const res = await api.post('tax/deletebyselection', {
                taxIdArray: [...selected],
            });
            setBulkDeleteOpen(false);
            setSelected(new Set());
            fetchTaxes();
            showToast(res.data?.message || `${selected.size} tax(es) deleted.`, 'success');
        } catch (err) {
            showToast(err.response?.data?.message || 'Bulk delete failed.', 'error');
        }
    };

    const handleImport = async (e) => {
        e.preventDefault();
        const file = importFileRef.current?.files[0];
        if (!file) return;
        const fd = new FormData();
        fd.append('file', file);
        try {
            const res = await api.post('importtax', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setImportOpen(false);
            fetchTaxes();
            showToast(res.data?.message || 'Taxes imported successfully.', 'success');
        } catch (err) {
            showToast(err.response?.data?.message || 'Import failed.', 'error');
        }
    };

    const handleSort = (key) => {
        if (sortCol === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        else {
            setSortCol(key);
            setSortDir('asc');
        }
        setPage(1);
    };

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

    const filteredAndSorted = useMemo(() => {
        let list = [...taxes];
        if (search) {
            const low = search.toLowerCase();
            list = list.filter(
                (t) =>
                    (t.name || '').toLowerCase().includes(low) ||
                    String(t.rate ?? '').includes(low)
            );
        }
        list.sort((a, b) => {
            let valA = a[sortCol];
            let valB = b[sortCol];
            if (sortCol === 'rate') {
                valA = Number(valA);
                valB = Number(valB);
            } else {
                valA = (valA ?? '').toString().toLowerCase();
                valB = (valB ?? '').toString().toLowerCase();
            }
            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
        return list;
    }, [taxes, search, sortCol, sortDir]);

    const paginated = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredAndSorted.slice(start, start + pageSize);
    }, [filteredAndSorted, page, pageSize]);

    const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize));

    const columns = [
        { key: 'name', label: 'Name', sortable: true },
        {
            key: 'rate',
            label: 'Rate (%)',
            sortable: true,
            render: (row) => row.rate ?? '—',
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

    const renderFormFields = () => (
        <>
            <FormField label="Tax Name" required error={formErrors.name}>
                <TextInput
                    value={form.name}
                    onChange={setField('name')}
                    placeholder="Type tax name"
                />
            </FormField>
            <FormField label="Rate (%)" required error={formErrors.rate}>
                <NumberInput
                    value={form.rate}
                    onChange={setField('rate')}
                    min={0}
                    max={100}
                    step="any"
                    placeholder="Type tax rate"
                />
            </FormField>
        </>
    );

    return (
        <PageLayout
            title="Tax"
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
                                resetForm();
                                setAddOpen(true);
                            }}
                        >
                            + Add Tax
                        </button>
                    )}
                    {canImport && (
                        <button type="button" className="ui-btn ghost" onClick={() => setImportOpen(true)}>
                            ↑ Import
                        </button>
                    )}
                    {selected.size > 0 && canDelete && (
                        <button type="button" className="ui-btn danger" onClick={() => setBulkDeleteOpen(true)}>
                            🗑 Delete Selected ({selected.size})
                        </button>
                    )}
                </>
            }
        >
            <Toast toast={toast} />

            <div className="ui-toolbar">
                <input
                    className="ui-search"
                    placeholder="Search by name or rate…"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                />
            </div>

            <SelectionBar count={selected.size} onClear={() => setSelected(new Set())} />

            <DataTable
                columns={columns}
                rows={paginated}
                loading={loading}
                emptyText="No taxes found"
                emptyIcon="📊"
                sortCol={sortCol}
                sortDir={sortDir}
                onSort={handleSort}
                selected={selected}
                onToggleRow={toggleRow}
                onToggleAll={toggleAll}
            />

            <Pagination
                page={page}
                totalPages={totalPages}
                pageSize={pageSize}
                pageSizes={PAGE_SIZES}
                totalRows={filteredAndSorted.length}
                onChange={setPage}
                onPageSize={(size) => {
                    setPageSize(size);
                    setPage(1);
                }}
            />

            {addOpen && (
                <Modal
                    title="Add Tax"
                    onClose={() => setAddOpen(false)}
                    footer={
                        <>
                            <button type="button" className="ui-btn ghost" onClick={() => setAddOpen(false)}>
                                Cancel
                            </button>
                            <button type="button" className="ui-btn primary" onClick={handleAdd}>
                                Submit
                            </button>
                        </>
                    }
                >
                    {renderFormFields()}
                </Modal>
            )}

            {editOpen && (
                <Modal
                    title="Update Tax"
                    onClose={() => setEditOpen(false)}
                    footer={
                        <>
                            <button type="button" className="ui-btn ghost" onClick={() => setEditOpen(false)}>
                                Cancel
                            </button>
                            <button type="button" className="ui-btn primary" onClick={handleEdit}>
                                Update
                            </button>
                        </>
                    }
                >
                    {renderFormFields()}
                </Modal>
            )}

            {importOpen && (
                <Modal
                    title="Import Tax"
                    onClose={() => setImportOpen(false)}
                    footer={
                        <>
                            <button type="button" className="ui-btn ghost" onClick={() => setImportOpen(false)}>
                                Cancel
                            </button>
                            <button type="button" className="ui-btn primary" onClick={handleImport}>
                                Import
                            </button>
                        </>
                    }
                >
                    <p style={{ fontSize: '0.8rem', marginBottom: 16, lineHeight: 1.6 }}>
                        The correct column order is <strong>name*</strong>, <strong>rate*</strong>.
                    </p>
                    <FormRow cols={2}>
                        <FormField label="Upload CSV File" required>
                            <FileInput inputRef={importFileRef} accept=".csv" />
                        </FormField>
                        <FormField label="Sample File">
                            <a
                                href="/sample_file/sample_tax.csv"
                                className="ui-btn ghost"
                                style={{ justifyContent: 'center' }}
                            >
                                ↓ Download Sample
                            </a>
                        </FormField>
                    </FormRow>
                </Modal>
            )}

            {deleteId && (
                <ConfirmModal
                    title="Delete Tax"
                    message="Are you sure you want to delete this tax?"
                    danger
                    onConfirm={handleDelete}
                    onClose={() => setDeleteId(null)}
                />
            )}

            {bulkDeleteOpen && (
                <ConfirmModal
                    title="Delete Selected Taxes"
                    message={`Are you sure you want to delete ${selected.size} tax(es)?`}
                    danger
                    onConfirm={handleBulkDelete}
                    onClose={() => setBulkDeleteOpen(false)}
                />
            )}
        </PageLayout>
    );
};

export default TaxManager;
