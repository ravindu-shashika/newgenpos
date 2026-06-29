import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    PageLayout,
    DataTable,
    ConfirmModal,
    Modal,
    TextInput,
    NumberInput,
    SelectInput,
    CheckboxInput,
    Toast,
    useToast,
    ActionMenu,
    Pagination,
    FormField,
    FormRow,
    SelectionBar,
} from '../../../components/ui';
import { api, generateUniqueCode, assertCodeAvailable } from '../../../services';
import authStore from '../../../stores/authStore';
import usePermissions from '../../../stores/usePermissions';

const PAGE_SIZES = [10, 25, 50, -1];

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = () => ({
    gift_card_id: '',
    card_no: '',
    amount: '',
    is_user: false,
    customer_id: '',
    user_id: '',
    expired_date: today(),
});

function hasGiftCardAccess(permissions) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.some(
        (p) =>
            p === 'gift_card' ||
            p === 'gift-cards.view' ||
            p.startsWith('gift-cards.')
    );
}

function formatValidationError(err) {
    if (err?.errors && typeof err.errors === 'object') {
        const first = Object.values(err.errors).flat()[0];
        if (first) return first;
    }
    return err?.message || 'Request failed';
}

export default function GiftCardList({ controllerName }) {
    const { toast, showToast } = useToast();
    const ctrl = controllerName || 'gift-cards';
    const perms = usePermissions(ctrl);
    const authPerms = authStore.getPermissions();
    const canView = perms.canView || hasGiftCardAccess(authPerms);
    const canAdd = perms.canAdd || hasGiftCardAccess(authPerms);
    const canEdit = perms.canEdit || hasGiftCardAccess(authPerms);
    const canDelete = perms.canDelete || canEdit;

    const [rows, setRows] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(new Set());
    const [openMenu, setOpenMenu] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

    const [addOpen, setAddOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [rechargeOpen, setRechargeOpen] = useState(false);
    const [viewRow, setViewRow] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [rechargeAmount, setRechargeAmount] = useState('');
    const [rechargeCard, setRechargeCard] = useState(null);
    const [saving, setSaving] = useState(false);

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const q = new URLSearchParams({ search });
            const res = await api.get(`gift-cards?${q}`);
            setRows(res.data?.data || []);
            if (res.data?.customers) setCustomers(res.data.customers);
            if (res.data?.users) setUsers(res.data.users);
            setSelected(new Set());
        } catch (err) {
            showToast(err?.message || 'Failed to load gift cards.', 'error');
        } finally {
            setLoading(false);
        }
    }, [search, showToast]);

    useEffect(() => {
        if (canView) fetchList();
        else setLoading(false);
    }, [canView, fetchList]);

    const paginated = useMemo(() => {
        if (pageSize === -1) return rows;
        const start = (page - 1) * pageSize;
        return rows.slice(start, start + pageSize);
    }, [rows, page, pageSize]);

    const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(rows.length / pageSize) || 1);

    const customerOptions = useMemo(
        () => [{ value: '', label: 'Select customer…' }, ...customers.map((c) => ({ value: String(c.id), label: c.label }))],
        [customers]
    );

    const userOptions = useMemo(
        () => [{ value: '', label: 'Select user…' }, ...users.map((u) => ({ value: String(u.id), label: u.label }))],
        [users]
    );

    const openAdd = () => {
        setForm(emptyForm());
        setAddOpen(true);
    };

    const openEdit = async (row) => {
        try {
            const res = await api.get(`gift-cards/${row.id}`);
            const card = res.data?.gift_card || {};
            setForm({
                gift_card_id: String(card.id),
                card_no: card.card_no || '',
                amount: card.amount ?? '',
                is_user: Boolean(card.is_user),
                customer_id: card.customer_id ? String(card.customer_id) : '',
                user_id: card.user_id ? String(card.user_id) : '',
                expired_date: card.expired_date || today(),
            });
            setEditOpen(true);
        } catch (err) {
            showToast(err?.message || 'Failed to load gift card.', 'error');
        }
    };

    const openRecharge = (row) => {
        setRechargeCard(row);
        setRechargeAmount('');
        setRechargeOpen(true);
    };

    const handleGenerateCode = async () => {
        try {
            const cardNo = await generateUniqueCode('gift_card', {
                exceptId: form.gift_card_id || null,
            });
            setForm((f) => ({ ...f, card_no: String(cardNo) }));
        } catch (err) {
            showToast(err?.message || 'Failed to generate card number.', 'error');
        }
    };

    const buildPayload = () => ({
        card_no: form.card_no.trim(),
        amount: Number(form.amount),
        expired_date: form.expired_date || today(),
        user: form.is_user ? '1' : '0',
        customer_id: form.is_user ? null : form.customer_id,
        user_id: form.is_user ? form.user_id : null,
    });

    const handleAdd = async () => {
        setSaving(true);
        try {
            await assertCodeAvailable('gift_card', form.card_no);
            const res = await api.post('gift-cards', buildPayload());
            showToast(res.data?.message || 'Gift card created.', 'success');
            setAddOpen(false);
            fetchList();
        } catch (err) {
            showToast(formatValidationError(err), 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = async () => {
        setSaving(true);
        try {
            await assertCodeAvailable('gift_card', form.card_no, form.gift_card_id);
            const res = await api.put(`gift-cards/${form.gift_card_id}`, buildPayload());
            showToast(res.data?.message || 'Gift card updated.', 'success');
            setEditOpen(false);
            fetchList();
        } catch (err) {
            showToast(formatValidationError(err), 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleRecharge = async () => {
        if (!rechargeCard) return;
        setSaving(true);
        try {
            const res = await api.post(`gift-cards/${rechargeCard.id}/recharge`, {
                amount: Number(rechargeAmount),
            });
            showToast(res.data?.message || 'Gift card recharged.', 'success');
            setRechargeOpen(false);
            fetchList();
        } catch (err) {
            showToast(formatValidationError(err), 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`gift-cards/${id}`);
            showToast('Gift card deleted.', 'success');
            setDeleteId(null);
            fetchList();
        } catch (err) {
            showToast(err?.message || 'Failed to delete gift card.', 'error');
        }
    };

    const handleBulkDelete = async () => {
        try {
            const res = await api.post('gift-cards/deletebyselection', {
                gift_cardIdArray: Array.from(selected),
            });
            showToast(res.data?.message || 'Gift cards deleted.', 'success');
            setBulkDeleteOpen(false);
            fetchList();
        } catch (err) {
            showToast(formatValidationError(err), 'error');
        }
    };

    const toggleSelect = (id) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selected.size === paginated.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(paginated.map((r) => r.id)));
        }
    };

    const renderFormFields = () => (
        <>
            <FormRow>
                <FormField label="Card no *">
                    <div className="d-flex gap-2">
                        <TextInput
                            value={form.card_no}
                            onChange={(e) => setForm((f) => ({ ...f, card_no: e.target.value }))}
                            required
                        />
                        <button type="button" className="ui-btn secondary" onClick={handleGenerateCode}>
                            Generate
                        </button>
                    </div>
                </FormField>
                <FormField label="Amount *">
                    <NumberInput
                        step="any"
                        min="0"
                        value={form.amount}
                        onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                        required
                    />
                </FormField>
            </FormRow>
            <FormRow>
                <CheckboxInput
                    label="Assign to user (not customer)"
                    checked={form.is_user}
                    onChange={(e) => setForm((f) => ({
                        ...f,
                        is_user: e.target.checked,
                        customer_id: '',
                        user_id: '',
                    }))}
                />
            </FormRow>
            <FormRow>
                {form.is_user ? (
                    <FormField label="User *">
                        <SelectInput
                            value={form.user_id}
                            onChange={(e) => setForm((f) => ({ ...f, user_id: e.target.value }))}
                            options={userOptions}
                        />
                    </FormField>
                ) : (
                    <FormField label="Customer *">
                        <SelectInput
                            value={form.customer_id}
                            onChange={(e) => setForm((f) => ({ ...f, customer_id: e.target.value }))}
                            options={customerOptions}
                        />
                    </FormField>
                )}
                <FormField label="Expired date">
                    <input
                        type="date"
                        className="ui-input"
                        value={form.expired_date}
                        min={today()}
                        onChange={(e) => setForm((f) => ({ ...f, expired_date: e.target.value }))}
                    />
                </FormField>
            </FormRow>
        </>
    );

    const columns = [
        {
            label: (
                <input
                    type="checkbox"
                    checked={paginated.length > 0 && selected.size === paginated.length}
                    onChange={toggleSelectAll}
                />
            ),
            key: 'select',
            render: (row) => (
                <input
                    type="checkbox"
                    checked={selected.has(row.id)}
                    onChange={() => toggleSelect(row.id)}
                />
            ),
        },
        { label: 'Card no.', key: 'card_no', sortable: true },
        { label: 'Customer / user', key: 'client_name', sortable: true },
        { label: 'Amount', key: 'amount', align: 'right' },
        { label: 'Expense', key: 'expense', align: 'right' },
        { label: 'Balance', key: 'balance', align: 'right' },
        { label: 'Created by', key: 'created_by' },
        {
            label: 'Expired date',
            key: 'expired_date',
            render: (row) => (
                <span className={row.is_expired ? 'ui-badge warning' : 'ui-badge success'}>
                    {row.expired_date}
                </span>
            ),
        },
        {
            label: 'Action',
            key: 'action',
            render: (row) => {
                const items = [
                    canView && {
                        label: 'View',
                        onClick: () => setViewRow(row),
                    },
                    canEdit && {
                        label: 'Edit',
                        onClick: () => openEdit(row),
                    },
                    canEdit && {
                        label: 'Recharge',
                        onClick: () => openRecharge(row),
                    },
                    canDelete && {
                        label: 'Delete',
                        danger: true,
                        onClick: () => setDeleteId(row.id),
                    },
                ].filter(Boolean);

                if (!items.length) return '—';

                return (
                    <ActionMenu
                        id={row.id}
                        openId={openMenu}
                        setOpenId={setOpenMenu}
                        items={items}
                    />
                );
            },
        },
    ];

    if (!canView) {
        return (
            <PageLayout eyebrow="Sale" title="Gift Card List">
                <p className="text-muted">You do not have permission to view gift cards.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout eyebrow="Sale" title="Gift Card List">
            <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
                {canAdd && (
                    <button type="button" className="ui-btn primary" onClick={openAdd}>
                        Add gift card
                    </button>
                )}
                {canDelete && selected.size > 0 && (
                    <button type="button" className="ui-btn danger" onClick={() => setBulkDeleteOpen(true)}>
                        Delete selected ({selected.size})
                    </button>
                )}
            </div>

            <SelectionBar count={selected.size} onClear={() => setSelected(new Set())} />

            <div className="ui-form-grid two mb-3">
                <FormField label="Search">
                    <TextInput
                        placeholder="Card no., customer, user…"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </FormField>
            </div>

            <DataTable
                columns={columns}
                rows={paginated}
                loading={loading}
                emptyText="No gift cards found."
            />

            <Pagination
                page={page}
                totalPages={totalPages}
                pageSize={pageSize === -1 ? rows.length || 10 : pageSize}
                totalRows={rows.length}
                onChange={setPage}
                pageSizes={PAGE_SIZES}
                onPageSize={(s) => { setPageSize(s); setPage(1); }}
            />

            <Modal
                isOpen={addOpen}
                title="Add gift card"
                onClose={() => setAddOpen(false)}
                footer={
                    <>
                        <button type="button" className="ui-btn ghost" onClick={() => setAddOpen(false)}>Cancel</button>
                        <button type="button" className="ui-btn primary" disabled={saving} onClick={handleAdd}>
                            {saving ? 'Saving…' : 'Create'}
                        </button>
                    </>
                }
            >
                {renderFormFields()}
            </Modal>

            <Modal
                isOpen={editOpen}
                title="Update gift card"
                onClose={() => setEditOpen(false)}
                footer={
                    <>
                        <button type="button" className="ui-btn ghost" onClick={() => setEditOpen(false)}>Cancel</button>
                        <button type="button" className="ui-btn primary" disabled={saving} onClick={handleEdit}>
                            {saving ? 'Saving…' : 'Update'}
                        </button>
                    </>
                }
            >
                {renderFormFields()}
            </Modal>

            <Modal
                isOpen={rechargeOpen}
                title={rechargeCard ? `Recharge: ${rechargeCard.card_no}` : 'Recharge gift card'}
                onClose={() => setRechargeOpen(false)}
                footer={
                    <>
                        <button type="button" className="ui-btn ghost" onClick={() => setRechargeOpen(false)}>Cancel</button>
                        <button type="button" className="ui-btn primary" disabled={saving} onClick={handleRecharge}>
                            {saving ? 'Saving…' : 'Recharge'}
                        </button>
                    </>
                }
            >
                <FormField label="Amount *">
                    <NumberInput
                        step="any"
                        min="0.01"
                        value={rechargeAmount}
                        onChange={(e) => setRechargeAmount(e.target.value)}
                    />
                </FormField>
            </Modal>

            <Modal
                isOpen={!!viewRow}
                title="Card details"
                onClose={() => setViewRow(null)}
            >
                {viewRow && (
                    <div className="small">
                        <p><strong>Card no:</strong> {viewRow.card_no}</p>
                        <p><strong>Client:</strong> {viewRow.client_name}</p>
                        <p><strong>Balance:</strong> {Number(viewRow.balance).toFixed(2)}</p>
                        <p><strong>Amount:</strong> {Number(viewRow.amount).toFixed(2)}</p>
                        <p><strong>Expense:</strong> {Number(viewRow.expense).toFixed(2)}</p>
                        <p><strong>Valid thru:</strong> {viewRow.expired_date}</p>
                    </div>
                )}
            </Modal>

            {deleteId != null && (
                <ConfirmModal
                    title="Delete gift card"
                    message="Deactivate this gift card? It will no longer appear in the list."
                    danger
                    onConfirm={() => handleDelete(deleteId)}
                    onClose={() => setDeleteId(null)}
                />
            )}

            {bulkDeleteOpen && (
                <ConfirmModal
                    title="Delete selected gift cards"
                    message={`Deactivate ${selected.size} gift card(s)?`}
                    danger
                    onConfirm={handleBulkDelete}
                    onClose={() => setBulkDeleteOpen(false)}
                />
            )}

            <Toast toast={toast} />
        </PageLayout>
    );
}
