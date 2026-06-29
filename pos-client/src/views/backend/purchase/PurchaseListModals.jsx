import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Modal,
    ConfirmModal,
    FormField,
    SelectInput,
    TextInput,
} from '../../../components/ui';
import { api } from '../../../services';

const basePath =
    import.meta.env.VITE_APP_DEFAULT_PATH ||
    import.meta.env.VITE_API_URL ||
    'http://127.0.0.1:8000';

const PAID_BY_OPTIONS = [
    { value: '1', label: 'Cash' },
    { value: '4', label: 'Cheque' },
];

function defaultAccountId(accounts) {
    if (!accounts?.length) return '';
    const def = accounts.find((a) => a.is_default);
    return String((def || accounts[0]).id);
}

export function PurchaseViewModal({ purchaseId, onClose }) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const res = await api.get(`purchases/${purchaseId}/details`);
                if (!cancelled) setData(res.data || {});
            } catch {
                if (!cancelled) setData(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [purchaseId]);

    const p = data?.purchase;
    const lines = data?.lines || [];

    return (
        <Modal isOpen onClose={onClose} title="Purchase Details" size="lg" hideHint>
            {loading && <p>Loading…</p>}
            {!loading && !p && <p className="text-muted">Failed to load purchase details.</p>}
            {!loading && p && (
                <>
                    <p className="small mb-3">
                        <strong>Date:</strong> {p.date}<br />
                        <strong>Reference:</strong> {p.reference_no}<br />
                        <strong>Status:</strong> {p.status_label}<br />
                        <strong>Currency:</strong> {p.currency_code} (rate {p.exchange_rate})
                        {p.pay_term && (
                            <>
                                <br />
                                <strong>Payment term:</strong> {p.pay_term}
                            </>
                        )}
                        {p.due_date && (
                            <>
                                <br />
                                <strong>Due date:</strong> {p.due_date}
                            </>
                        )}
                        {p.document && (
                            <>
                                <br />
                                <strong>Document:</strong>{' '}
                                <a href={`${basePath}/documents/purchase/${p.document}`} target="_blank" rel="noreferrer">
                                    Download
                                </a>
                            </>
                        )}
                    </p>
                    <div className="row small mb-3">
                        <div className="col-md-6">
                            <strong>From (supplier)</strong><br />
                            {p.supplier?.name}<br />
                            {p.supplier?.company_name}<br />
                            {p.supplier?.email}<br />
                            {p.supplier?.phone_number}<br />
                            {p.supplier?.address}{p.supplier?.city ? `, ${p.supplier.city}` : ''}
                        </div>
                        <div className="col-md-6">
                            <strong>To (warehouse)</strong><br />
                            {p.warehouse?.name}<br />
                            {p.warehouse?.phone}<br />
                            {p.warehouse?.address}
                        </div>
                    </div>
                    <div className="table-responsive mb-3">
                        <table className="table table-bordered table-sm">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Product</th>
                                    <th>Batch</th>
                                    <th>Qty</th>
                                    <th>Returned</th>
                                    <th>Unit cost</th>
                                    <th>Tax</th>
                                    <th>Discount</th>
                                    <th>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lines.map((line, i) => (
                                    <tr key={i}>
                                        <td>{i + 1}</td>
                                        <td>{line.product}</td>
                                        <td>{line.batch_no}</td>
                                        <td>{line.qty} {line.unit_code}</td>
                                        <td>{line.returned_qty}</td>
                                        <td>{line.unit_cost}</td>
                                        <td>{line.tax} ({line.tax_rate}%)</td>
                                        <td>{line.discount}</td>
                                        <td>{line.subtotal}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="small">
                        <p className="mb-1"><strong>Order tax:</strong> {p.order_tax} ({p.order_tax_rate}%)</p>
                        <p className="mb-1"><strong>Order discount:</strong> {p.order_discount}</p>
                        <p className="mb-1"><strong>Shipping:</strong> {p.shipping_cost}</p>
                        <p className="mb-1"><strong>Grand total:</strong> {p.grand_total}</p>
                        <p className="mb-1"><strong>Paid:</strong> {p.paid_amount}</p>
                        <p className="mb-1"><strong>Returned:</strong> {p.returned_amount}</p>
                        <p className="mb-1"><strong>Due:</strong> {p.due}</p>
                        {p.note && <p className="mb-1"><strong>Note:</strong> {p.note}</p>}
                        <p className="mb-0"><strong>Created by:</strong> {p.created_by}</p>
                    </div>
                </>
            )}
        </Modal>
    );
}

export function PurchaseAddPaymentModal({ row, accounts, onClose, onSuccess, showToast }) {
    const dueNative = useMemo(
        () => Math.max(0, (Number(row.due) || 0) * (Number(row.exchange_rate) || 1)),
        [row.due, row.exchange_rate]
    );
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        paying_amount: String(dueNative),
        amount: String(dueNative),
        paid_by_id: '1',
        account_id: defaultAccountId(accounts),
        payment_at: new Date().toISOString().slice(0, 10),
        payment_note: '',
        cheque_no: '',
    });

    const change = useMemo(() => {
        const paying = parseFloat(form.paying_amount) || 0;
        const amount = parseFloat(form.amount) || 0;
        return Math.max(0, paying - amount);
    }, [form.paying_amount, form.amount]);

    const accountOptions = useMemo(
        () => (accounts || []).map((a) => ({ value: String(a.id), label: a.name })),
        [accounts]
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        const amount = parseFloat(form.amount);
        const payingAmount = parseFloat(form.paying_amount);
        if (!amount || amount <= 0) {
            showToast('Paying amount is required.', 'error');
            return;
        }
        if (amount > dueNative + 0.0001) {
            showToast('Paying amount cannot exceed due amount.', 'error');
            return;
        }
        if (payingAmount < amount) {
            showToast('Received amount cannot be less than paying amount.', 'error');
            return;
        }
        if (form.paid_by_id === '4' && !form.cheque_no.trim()) {
            showToast('Cheque number is required.', 'error');
            return;
        }
        setSubmitting(true);
        try {
            await api.post('purchases/add_payment', {
                purchase_id: row.id,
                balance: dueNative,
                paying_amount: payingAmount,
                amount,
                paid_by_id: Number(form.paid_by_id),
                account_id: Number(form.account_id),
                payment_at: form.payment_at,
                payment_note: form.payment_note,
                cheque_no: form.cheque_no,
                currency_id: row.currency_id,
                exchange_rate: row.exchange_rate,
            });
            showToast('Payment created successfully.', 'success');
            onSuccess();
        } catch (err) {
            showToast(err?.response?.data?.message || err?.message || 'Failed to add payment.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen onClose={onClose} title="Add Payment" hideHint>
            <form onSubmit={handleSubmit}>
                <p className="small text-muted mb-3">
                    Reference: <strong>{row.reference_no}</strong> · Due: <strong>{row.due}</strong>{' '}
                    {row.currency_code} (rate {row.exchange_rate})
                </p>
                <div className="ui-form-grid two">
                    <FormField label="Received amount *">
                        <TextInput
                            type="number"
                            step="any"
                            min="0"
                            value={form.paying_amount}
                            onChange={(e) => setForm((f) => ({ ...f, paying_amount: e.target.value }))}
                        />
                    </FormField>
                    <FormField label="Paying amount *">
                        <TextInput
                            type="number"
                            step="any"
                            min="0"
                            value={form.amount}
                            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                        />
                    </FormField>
                    <FormField label="Change">
                        <TextInput readOnly value={change.toFixed(2)} />
                    </FormField>
                    <FormField label="Paid by">
                        <SelectInput
                            value={form.paid_by_id}
                            onChange={(e) => setForm((f) => ({ ...f, paid_by_id: e.target.value }))}
                            options={PAID_BY_OPTIONS}
                        />
                    </FormField>
                    {form.paid_by_id === '4' && (
                        <FormField label="Cheque number *">
                            <TextInput
                                value={form.cheque_no}
                                onChange={(e) => setForm((f) => ({ ...f, cheque_no: e.target.value }))}
                            />
                        </FormField>
                    )}
                    <FormField label="Account">
                        <SelectInput
                            value={form.account_id}
                            onChange={(e) => setForm((f) => ({ ...f, account_id: e.target.value }))}
                            options={accountOptions}
                        />
                    </FormField>
                    <FormField label="Payment date">
                        <input
                            type="date"
                            className="ui-input"
                            value={form.payment_at}
                            onChange={(e) => setForm((f) => ({ ...f, payment_at: e.target.value }))}
                        />
                    </FormField>
                </div>
                <FormField label="Payment note">
                    <textarea
                        className="ui-input"
                        rows={3}
                        value={form.payment_note}
                        onChange={(e) => setForm((f) => ({ ...f, payment_note: e.target.value }))}
                    />
                </FormField>
                <div className="d-flex gap-2 mt-3">
                    <button type="submit" className="ui-btn primary" disabled={submitting}>
                        {submitting ? 'Saving…' : 'Submit'}
                    </button>
                    <button type="button" className="ui-btn" onClick={onClose}>Cancel</button>
                </div>
            </form>
        </Modal>
    );
}

export function PurchasePaymentsModal({
    purchaseId,
    referenceNo,
    accounts,
    canEditPayment,
    canDeletePayment,
    onClose,
    onChanged,
    showToast,
}) {
    const [loading, setLoading] = useState(true);
    const [payments, setPayments] = useState([]);
    const [editId, setEditId] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [editForm, setEditForm] = useState(null);

    const accountOptions = useMemo(
        () => (accounts || []).map((a) => ({ value: String(a.id), label: a.name })),
        [accounts]
    );

    const loadPayments = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`purchases/getpayment/${purchaseId}`);
            setPayments(res.data?.payments || []);
        } catch (err) {
            showToast(err?.message || 'Failed to load payments.', 'error');
            setPayments([]);
        } finally {
            setLoading(false);
        }
    }, [purchaseId, showToast]);

    useEffect(() => {
        loadPayments();
    }, [loadPayments]);

    const startEdit = (payment) => {
        setEditId(payment.id);
        setEditForm({
            edit_paying_amount: String(payment.paying_amount),
            edit_amount: String(payment.amount),
            edit_paid_by_id: String(payment.paid_by_id || 1),
            account_id: String(payment.account_id || defaultAccountId(accounts)),
            payment_at: payment.payment_at_input || new Date().toISOString().slice(0, 10),
            edit_payment_note: payment.payment_note || '',
            edit_cheque_no: payment.cheque_no || '',
        });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!editForm) return;
        if (editForm.edit_paid_by_id === '4' && !editForm.edit_cheque_no.trim()) {
            showToast('Cheque number is required.', 'error');
            return;
        }
        setSubmitting(true);
        try {
            await api.post('purchases/updatepayment', {
                payment_id: editId,
                edit_paying_amount: parseFloat(editForm.edit_paying_amount),
                edit_amount: parseFloat(editForm.edit_amount),
                edit_paid_by_id: Number(editForm.edit_paid_by_id),
                account_id: Number(editForm.account_id),
                payment_at: editForm.payment_at,
                edit_payment_note: editForm.edit_payment_note,
                edit_cheque_no: editForm.edit_cheque_no,
            });
            showToast('Payment updated successfully.', 'success');
            setEditId(null);
            setEditForm(null);
            await loadPayments();
            onChanged();
        } catch (err) {
            showToast(err?.response?.data?.message || err?.message || 'Failed to update payment.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        try {
            await api.post('purchases/deletepayment', { id: deleteId });
            showToast('Payment deleted successfully.', 'success');
            setDeleteId(null);
            await loadPayments();
            onChanged();
        } catch (err) {
            showToast(err?.response?.data?.message || err?.message || 'Failed to delete payment.', 'error');
        }
    };

    return (
        <>
            <Modal isOpen onClose={onClose} title="All Payments" size="lg" hideHint>
                <p className="small text-muted mb-3">Purchase reference: <strong>{referenceNo}</strong></p>
                {loading && <p>Loading…</p>}
                {!loading && editId && editForm && (
                    <form onSubmit={handleUpdate} className="mb-4 p-3 border rounded">
                        <h6 className="mb-3">Edit payment</h6>
                        <div className="ui-form-grid two">
                            <FormField label="Received amount *">
                                <TextInput
                                    type="number"
                                    step="any"
                                    value={editForm.edit_paying_amount}
                                    onChange={(e) => setEditForm((f) => ({ ...f, edit_paying_amount: e.target.value }))}
                                />
                            </FormField>
                            <FormField label="Paying amount *">
                                <TextInput
                                    type="number"
                                    step="any"
                                    value={editForm.edit_amount}
                                    onChange={(e) => setEditForm((f) => ({ ...f, edit_amount: e.target.value }))}
                                />
                            </FormField>
                            <FormField label="Paid by">
                                <SelectInput
                                    value={editForm.edit_paid_by_id}
                                    onChange={(e) => setEditForm((f) => ({ ...f, edit_paid_by_id: e.target.value }))}
                                    options={PAID_BY_OPTIONS}
                                />
                            </FormField>
                            {editForm.edit_paid_by_id === '4' && (
                                <FormField label="Cheque number *">
                                    <TextInput
                                        value={editForm.edit_cheque_no}
                                        onChange={(e) => setEditForm((f) => ({ ...f, edit_cheque_no: e.target.value }))}
                                    />
                                </FormField>
                            )}
                            <FormField label="Account">
                                <SelectInput
                                    value={editForm.account_id}
                                    onChange={(e) => setEditForm((f) => ({ ...f, account_id: e.target.value }))}
                                    options={accountOptions}
                                />
                            </FormField>
                            <FormField label="Payment date">
                                <input
                                    type="date"
                                    className="ui-input"
                                    value={editForm.payment_at}
                                    onChange={(e) => setEditForm((f) => ({ ...f, payment_at: e.target.value }))}
                                />
                            </FormField>
                        </div>
                        <FormField label="Payment note">
                            <textarea
                                className="ui-input"
                                rows={2}
                                value={editForm.edit_payment_note}
                                onChange={(e) => setEditForm((f) => ({ ...f, edit_payment_note: e.target.value }))}
                            />
                        </FormField>
                        <div className="d-flex gap-2 mt-2">
                            <button type="submit" className="ui-btn primary" disabled={submitting}>
                                {submitting ? 'Updating…' : 'Update'}
                            </button>
                            <button type="button" className="ui-btn" onClick={() => { setEditId(null); setEditForm(null); }}>
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
                {!loading && (
                    <div className="table-responsive">
                        <table className="table table-bordered table-sm">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Reference</th>
                                    <th>Account</th>
                                    <th>Amount</th>
                                    <th>Paid by</th>
                                    <th>Payment date</th>
                                    {(canEditPayment || canDeletePayment) && <th>Action</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {payments.length === 0 && (
                                    <tr>
                                        <td colSpan={canEditPayment || canDeletePayment ? 7 : 6} className="text-muted text-center">
                                            No payments found.
                                        </td>
                                    </tr>
                                )}
                                {payments.map((p) => (
                                    <tr key={p.id}>
                                        <td>{p.created_at}</td>
                                        <td>{p.payment_reference}</td>
                                        <td>{p.account_name}</td>
                                        <td>{p.amount}</td>
                                        <td>{p.paying_method}</td>
                                        <td>{p.payment_at}</td>
                                        {(canEditPayment || canDeletePayment) && (
                                            <td>
                                                <div className="d-flex gap-1 flex-wrap">
                                                    {canEditPayment && (
                                                        <button type="button" className="ui-btn sm" onClick={() => startEdit(p)}>
                                                            Edit
                                                        </button>
                                                    )}
                                                    {canDeletePayment && (
                                                        <button type="button" className="ui-btn sm danger" onClick={() => setDeleteId(p.id)}>
                                                            Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Modal>
            {deleteId && (
                <ConfirmModal
                    title="Delete Payment"
                    danger
                    message="Are you sure you want to delete this payment?"
                    onConfirm={handleDelete}
                    onClose={() => setDeleteId(null)}
                />
            )}
        </>
    );
}
