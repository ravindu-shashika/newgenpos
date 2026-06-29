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
    Toast,
    useToast,
    ActionMenu,
    Pagination,
} from '../../../components/ui';
import { api } from '../../../services';
import usePermissions from '../../../stores/usePermissions';

const PAGE_SIZES = [10, 25, 50];

const EMPTY_FORM = {
    id: null,
    name: '',
    code: '',
    symbol: '',
    exchange_rate: '',
};

const CurrencyManager = ({ controllerName }) => {
    const ctrl = controllerName === 'currencies' ? 'currency' : (controllerName || 'currency');
    const { canAdd, canEdit, canDelete } = usePermissions(ctrl);

    const [currencies, setCurrencies] = useState([]);
    const [defaultCurrency, setDefaultCurrency] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [sortCol, setSortCol] = useState('name');
    const [sortDir, setSortDir] = useState('asc');
    const [search, setSearch] = useState('');
    const [openMenu, setOpenMenu] = useState(null);

    const [addOpen, setAddOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const { toast, showToast } = useToast();

    const setField = (name) => (e) =>
        setForm((f) => ({ ...f, [name]: e.target.value }));

    useEffect(() => {
        fetchCurrencies();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchCurrencies = async () => {
        try {
            setLoading(true);
            const res = await api.get('currency');
            const data = res.data?.data ?? res.data ?? [];
            setCurrencies(Array.isArray(data) ? data : []);
            setDefaultCurrency(res.data?.metadata?.default_currency ?? null);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to load currencies.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setFormErrors({});
    };

    const validateExchangeRate = (rate, currencyId = null) => {
        const num = Number(rate);
        if (num !== 1) return null;

        if (!defaultCurrency) return null;
        if (currencyId && Number(defaultCurrency.id) === Number(currencyId)) return null;

        return `Only the default currency can have an exchange rate of 1. Change the rate for ${defaultCurrency.name} first.`;
    };

    const validateForm = () => {
        const errors = {};
        if (!form.name?.trim()) errors.name = 'Name is required';
        if (!form.code?.trim()) errors.code = 'Code is required';
        if (!form.exchange_rate && form.exchange_rate !== 0) {
            errors.exchange_rate = 'Exchange rate is required';
        } else if (Number(form.exchange_rate) <= 0) {
            errors.exchange_rate = 'Exchange rate must be greater than 0';
        } else {
            const rateError = validateExchangeRate(form.exchange_rate, form.id);
            if (rateError) errors.exchange_rate = rateError;
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCreate = async () => {
        if (!validateForm()) return;
        try {
            setSaving(true);
            const payload = {
                name: form.name.trim(),
                code: form.code.trim(),
                symbol: form.symbol?.trim() || '',
                exchange_rate: Number(form.exchange_rate),
            };
            const res = await api.post('currency', payload);
            showToast(res.data?.message || 'Currency created.', 'success');
            setAddOpen(false);
            resetForm();
            fetchCurrencies();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to create currency.';
            showToast(msg, 'error');
        } finally {
            setSaving(false);
        }
    };

    const openEdit = (row) => {
        setForm({
            id: row.id,
            name: row.name || '',
            code: row.code || '',
            symbol: row.symbol || '',
            exchange_rate: row.exchange_rate ?? '',
        });
        setFormErrors({});
        setEditOpen(true);
    };

    const handleUpdate = async () => {
        if (!validateForm() || !form.id) return;
        try {
            setSaving(true);
            const payload = {
                currency_id: form.id,
                name: form.name.trim(),
                code: form.code.trim(),
                symbol: form.symbol?.trim() || '',
                exchange_rate: Number(form.exchange_rate),
            };
            const res = await api.put(`currency/${form.id}`, payload);
            showToast(res.data?.message || 'Currency updated.', 'success');
            setEditOpen(false);
            resetForm();
            fetchCurrencies();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to update currency.';
            showToast(msg, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await api.delete(`currency/${deleteId}`);
            showToast(res.data?.message || 'Currency deleted.', 'success');
            setDeleteId(null);
            fetchCurrencies();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to delete currency.', 'error');
        }
    };

    const filteredCurrencies = useMemo(() => {
        let list = [...currencies];
        if (search) {
            const low = search.toLowerCase();
            list = list.filter(
                (c) =>
                    (c.name || '').toLowerCase().includes(low) ||
                    (c.code || '').toLowerCase().includes(low) ||
                    (c.symbol || '').toLowerCase().includes(low)
            );
        }
        list.sort((a, b) => {
            let valA = a[sortCol];
            let valB = b[sortCol];
            if (sortCol === 'exchange_rate') {
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
    }, [currencies, search, sortCol, sortDir]);

    const paginatedCurrencies = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredCurrencies.slice(start, start + pageSize);
    }, [filteredCurrencies, page, pageSize]);

    const totalPages = Math.max(1, Math.ceil(filteredCurrencies.length / pageSize));

    const columns = useMemo(
        () => [
            { key: 'name', label: 'Currency Name', sortable: true },
            { key: 'code', label: 'Currency Code', sortable: true },
            {
                key: 'symbol',
                label: 'Symbol',
                sortable: true,
                render: (row) => row.symbol || '—',
            },
            { key: 'exchange_rate', label: 'Exchange Rate', sortable: true },
            {
                key: 'actions',
                label: 'Action',
                align: 'right',
                render: (row) => (
                    <ActionMenu
                        id={row.id}
                        openId={openMenu}
                        setOpenId={setOpenMenu}
                        items={[
                            canEdit && { label: '✎ Edit', onClick: () => openEdit(row) },
                            canDelete &&
                                Number(row.exchange_rate) !== 1 && {
                                    label: '🗑 Delete',
                                    danger: true,
                                    onClick: () => setDeleteId(row.id),
                                },
                        ].filter(Boolean)}
                    />
                ),
            },
        ],
        [openMenu, canEdit, canDelete]
    );

    const renderFormFields = () => (
        <>
            <FormRow cols={2}>
                <FormField label="Name *" error={formErrors.name}>
                    <TextInput value={form.name} onChange={setField('name')} placeholder="Type currency name" />
                </FormField>
                <FormField label="Code *" error={formErrors.code}>
                    <TextInput value={form.code} onChange={setField('code')} placeholder="USD, NGN, INR…" />
                </FormField>
            </FormRow>
            <FormRow cols={2}>
                <FormField label="Symbol">
                    <TextInput value={form.symbol} onChange={setField('symbol')} placeholder="$, ₹, €…" />
                </FormField>
                <FormField label="Exchange Rate *" error={formErrors.exchange_rate}>
                    <NumberInput
                        value={form.exchange_rate}
                        onChange={setField('exchange_rate')}
                        min={0.0000001}
                        step="any"
                        placeholder="Type exchange rate"
                    />
                </FormField>
            </FormRow>
        </>
    );

    return (
        <PageLayout
            title="Currency"
            onClick={(e) => {
                if (!e.target.closest('.ui-action-wrap')) setOpenMenu(null);
            }}
            actions={
                canAdd ? (
                    <button
                        type="button"
                        className="ui-btn primary"
                        onClick={() => {
                            resetForm();
                            setAddOpen(true);
                        }}
                    >
                        + Add Currency
                    </button>
                ) : null
            }
        >
            <Toast toast={toast} />

            <div className="ui-toolbar">
                <input
                    className="ui-search"
                    placeholder="Search by name, code, or symbol…"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                />
            </div>

            <DataTable
                columns={columns}
                rows={paginatedCurrencies}
                loading={loading}
                emptyText="No currencies found"
                emptyIcon="💱"
                sortCol={sortCol}
                sortDir={sortDir}
                onSort={(col) => {
                    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
                    else {
                        setSortCol(col);
                        setSortDir('asc');
                    }
                }}
            />

            <Pagination
                page={page}
                totalPages={totalPages}
                pageSize={pageSize}
                pageSizes={PAGE_SIZES}
                totalRows={filteredCurrencies.length}
                onChange={setPage}
                onPageSize={(size) => {
                    setPageSize(size);
                    setPage(1);
                }}
            />

            {addOpen && (
                <Modal
                    title="Add Currency"
                    onClose={() => {
                        setAddOpen(false);
                        resetForm();
                    }}
                    footer={
                        <>
                            <button type="button" className="ui-btn ghost" onClick={() => setAddOpen(false)}>
                                Cancel
                            </button>
                            <button type="button" className="ui-btn primary" disabled={saving} onClick={handleCreate}>
                                {saving ? 'Saving…' : 'Save'}
                            </button>
                        </>
                    }
                >
                    {renderFormFields()}
                </Modal>
            )}

            {editOpen && (
                <Modal
                    title="Update Currency"
                    onClose={() => {
                        setEditOpen(false);
                        resetForm();
                    }}
                    footer={
                        <>
                            <button type="button" className="ui-btn ghost" onClick={() => setEditOpen(false)}>
                                Cancel
                            </button>
                            <button type="button" className="ui-btn primary" disabled={saving} onClick={handleUpdate}>
                                {saving ? 'Saving…' : 'Update'}
                            </button>
                        </>
                    }
                >
                    {renderFormFields()}
                </Modal>
            )}

            {deleteId && (
                <ConfirmModal
                    title="Delete Currency"
                    message="Are you sure you want to delete this currency?"
                    danger
                    onConfirm={handleDelete}
                    onClose={() => setDeleteId(null)}
                />
            )}
        </PageLayout>
    );
};

export default CurrencyManager;
