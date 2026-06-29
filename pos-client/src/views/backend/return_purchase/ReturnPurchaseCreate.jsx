import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
    PageLayout,
    FormField,
    FormRow,
    NumberInput,
    SelectInput,
    TextareaInput,
    FileInput,
    Toast,
    useToast,
    Modal,
} from '../../../components/ui';
import { api } from '../../../services';

function round(n, d = 2) {
    const f = 10 ** d;
    return Math.round((Number(n) + Number.EPSILON) * f) / f;
}

/** Matches old Blade create.blade.php calculateTotal() for a selected row. */
function recalcSelectedLine(line, qty, decimal) {
    let q = Number(qty);
    if (Number.isNaN(q) || q < 1) q = 1;
    const max = Number(line.actual_qty) || 0;
    if (q > max) q = max;

    const unitCost = Number(line.unit_cost) || 0;
    const unitTax = Number(line.unit_tax) || 0;

    return {
        ...line,
        qty: q,
        tax: round(unitTax * q, decimal),
        subtotal: round(unitCost * q, decimal),
        discount: line.line_discount,
    };
}

function resetLineDisplay(line) {
    return {
        ...line,
        selected: false,
        qty: line.actual_qty,
        tax: line.line_tax,
        subtotal: line.line_subtotal,
        discount: line.line_discount,
        return_imei: '',
    };
}

export default function ReturnPurchaseCreate() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const referenceNo = searchParams.get('reference_no') || '';
    const { toast, showToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [purchase, setPurchase] = useState(null);
    const [lines, setLines] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [taxes, setTaxes] = useState([]);
    const [decimal, setDecimal] = useState(2);
    const [accountId, setAccountId] = useState('');
    const [orderTaxRate, setOrderTaxRate] = useState('0');
    const [returnNote, setReturnNote] = useState('');
    const [staffNote, setStaffNote] = useState('');
    const [document, setDocument] = useState(null);
    const [imeiModal, setImeiModal] = useState(null);
    const [imeiSelection, setImeiSelection] = useState([]);

    const loadForm = useCallback(async () => {
        if (!referenceNo.trim()) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const res = await api.get(`return-purchase/create?reference_no=${encodeURIComponent(referenceNo.trim())}`);
            const data = res.data || {};
            setPurchase(data.purchase);
            setLines((data.lines || []).map((l) => ({
                ...l,
                selected: false,
                line_discount: l.line_discount ?? l.discount,
                line_tax: l.line_tax ?? l.tax,
                line_subtotal: l.line_subtotal ?? l.subtotal,
            })));
            setAccounts(data.accounts || []);
            setTaxes(data.taxes || []);
            setDecimal(data.decimal ?? 2);
            const defaultAcc = data.default_account_id
                || data.accounts?.find((a) => a.is_default)?.id
                || data.accounts?.[0]?.id
                || '';
            setAccountId(String(defaultAcc));
        } catch (err) {
            showToast(err?.message || 'Failed to load purchase return form.', 'error');
        } finally {
            setLoading(false);
        }
    }, [referenceNo, showToast]);

    useEffect(() => {
        loadForm();
    }, [loadForm]);

    const updateLineQty = (index, rawQty) => {
        setLines((prev) => prev.map((l, i) => {
            if (i !== index) return l;
            let q = rawQty === '' ? '' : Number(rawQty);
            if (rawQty !== '' && q < 1) {
                showToast("Quantity can't be less than 1", 'error');
                q = 1;
            }
            if (rawQty !== '' && q > Number(l.actual_qty)) {
                showToast('Quantity can not be bigger than the actual quantity!', 'error');
                q = Number(l.actual_qty);
            }
            if (!l.selected) {
                return { ...l, qty: q === '' ? l.actual_qty : q };
            }
            return recalcSelectedLine(l, q === '' ? l.qty : q, decimal);
        }));
    };

    const toggleLine = (index, checked) => {
        const line = lines[index];
        if (!checked) {
            setLines((prev) => prev.map((l, i) => (i === index ? resetLineDisplay(l) : l)));
            return;
        }
        if (line.is_imei && line.imei_number) {
            const nums = String(line.imei_number).split(',').map((s) => s.trim()).filter(Boolean);
            setImeiSelection(nums.map((n) => ({ value: n, checked: true })));
            setImeiModal({ index });
            return;
        }
        setLines((prev) => prev.map((l, i) => (
            i === index ? { ...recalcSelectedLine(l, l.qty, decimal), selected: true } : l
        )));
    };

    const applyImeiSelection = () => {
        if (!imeiModal) return;
        const chosen = imeiSelection.filter((i) => i.checked).map((i) => i.value);
        if (!chosen.length) {
            showToast('Please choose imei or serial number!', 'error');
            return;
        }
        const idx = imeiModal.index;
        setLines((prev) => prev.map((l, i) => {
            if (i !== idx) return l;
            return {
                ...recalcSelectedLine(l, chosen.length, decimal),
                selected: true,
                return_imei: chosen.join(','),
            };
        }));
        setImeiModal(null);
    };

    const totals = useMemo(() => {
        const selected = lines.filter((l) => l.selected);
        let totalQty = 0;
        let totalDiscount = 0;
        let totalTax = 0;
        let totalCost = 0;
        selected.forEach((l) => {
            totalQty += Number(l.qty) || 0;
            totalDiscount += Number(l.line_discount) || 0;
            totalTax += Number(l.tax) || 0;
            totalCost += Number(l.subtotal) || 0;
        });
        const item = selected.length;
        const orderTax = round(totalCost * (Number(orderTaxRate) / 100), decimal);
        const grandTotal = round(totalCost + orderTax, decimal);
        return { totalQty, totalDiscount, totalTax, totalCost, item, orderTax, grandTotal };
    }, [lines, orderTaxRate, decimal]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const selected = lines.filter((l) => l.selected);
        if (!selected.length) {
            showToast('Please select at least one product.', 'error');
            return;
        }
        for (const line of selected) {
            const q = Number(line.qty);
            if (q < 1 || q > Number(line.actual_qty)) {
                showToast(`Invalid quantity for ${line.name}.`, 'error');
                return;
            }
        }

        const data = new FormData();
        data.append('purchase_id', purchase.id);
        data.append('account_id', accountId);
        data.append('order_tax_rate', orderTaxRate);
        data.append('return_note', returnNote);
        data.append('staff_note', staffNote);
        data.append('total_qty', String(totals.totalQty));
        data.append('total_discount', totals.totalDiscount.toFixed(decimal));
        data.append('total_tax', totals.totalTax.toFixed(decimal));
        data.append('total_cost', totals.totalCost.toFixed(decimal));
        data.append('item', String(totals.item));
        data.append('order_tax', totals.orderTax.toFixed(decimal));
        data.append('grand_total', totals.grandTotal.toFixed(decimal));
        if (document) data.append('document', document);

        lines.forEach((line) => {
            data.append('product_purchase_id[]', line.product_purchase_id);
            data.append('product_id[]', line.product_id);
            data.append('product_code[]', line.code);
            data.append('product_variant_id[]', line.product_variant_id ?? '');
            data.append('product_batch_id[]', line.product_batch_id ?? '');
            data.append('actual_qty[]', String(line.actual_qty));
            data.append('qty[]', String(line.qty));
            data.append('net_unit_cost[]', String(line.net_unit_cost));
            data.append('discount[]', String(line.discount));
            data.append('tax_rate[]', String(line.tax_rate));
            data.append('tax[]', String(line.tax));
            data.append('subtotal[]', String(line.subtotal));
            data.append('product_cost[]', String(line.product_cost));
            data.append('purchase_unit[]', line.purchase_unit);
            data.append('imei_number[]', line.return_imei || '');
            if (line.selected) {
                data.append('is_return[]', line.product_purchase_id);
            }
        });

        setSubmitting(true);
        try {
            await api.post('return-purchase', data);
            showToast('Return created successfully.', 'success');
            navigate('/return-purchase');
        } catch (err) {
            showToast(err?.message || 'Failed to create purchase return.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (!referenceNo.trim()) {
        return (
            <PageLayout eyebrow="Purchase" title="Add Return">
                <p className="text-muted">Purchase reference is required.</p>
                <Link to="/return-purchase" className="ui-btn">Back to list</Link>
            </PageLayout>
        );
    }

    if (loading) {
        return (
            <PageLayout eyebrow="Purchase" title="Add Return">
                <p>Loading…</p>
            </PageLayout>
        );
    }

    if (!purchase) {
        return (
            <PageLayout eyebrow="Purchase" title="Add Return">
                <p className="text-danger">Could not load purchase {referenceNo}.</p>
                <Link to="/return-purchase" className="ui-btn">Back to list</Link>
            </PageLayout>
        );
    }

    const taxOptions = [{ value: '0', label: 'No Tax' }, ...taxes.map((t) => ({ value: String(t.rate), label: t.name }))];
    const accountOptions = accounts.map((a) => ({ value: String(a.id), label: a.name }));

    return (
        <PageLayout eyebrow="Purchase" title="Add Return">
            <p className="text-muted small mb-3">
                Purchase reference: <strong>{purchase.reference_no}</strong>
            </p>

            <form onSubmit={handleSubmit}>
                <div className="table-responsive mb-3">
                    <table className="table table-hover table-sm bg-white">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Code</th>
                                <th>Batch No</th>
                                <th>Quantity</th>
                                <th>Net Unit Cost</th>
                                <th>Discount</th>
                                <th>Tax</th>
                                <th>Subtotal</th>
                                <th>Choose</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lines.map((line, index) => (
                                <tr key={line.product_purchase_id}>
                                    <td>
                                        {line.name}
                                        {line.return_qty > 0 && (
                                            <small className="d-block text-muted">Already returned: {line.return_qty}</small>
                                        )}
                                    </td>
                                    <td>{line.code}</td>
                                    <td>{line.batch_no}</td>
                                    <td style={{ width: 100 }}>
                                        <NumberInput
                                            min="1"
                                            max={line.actual_qty}
                                            step="any"
                                            value={line.qty}
                                            onChange={(e) => updateLineQty(index, e.target.value)}
                                        />
                                    </td>
                                    <td>{line.net_unit_cost}</td>
                                    <td>{Number(line.discount).toFixed(decimal)}</td>
                                    <td>{Number(line.tax).toFixed(decimal)}</td>
                                    <td>{Number(line.subtotal).toFixed(decimal)}</td>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={!!line.selected}
                                            onChange={(e) => toggleLine(index, e.target.checked)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <FormRow cols={3}>
                    <FormField label="Account">
                        <SelectInput value={accountId} onChange={(e) => setAccountId(e.target.value)} options={accountOptions} />
                    </FormField>
                    <FormField label="Order Tax">
                        <SelectInput value={orderTaxRate} onChange={(e) => setOrderTaxRate(e.target.value)} options={taxOptions} />
                    </FormField>
                    <FormField label="Attach Document">
                        <FileInput onChange={(e) => setDocument(e.target.files?.[0] || null)} />
                    </FormField>
                </FormRow>

                <FormRow cols={2}>
                    <FormField label="Return Note">
                        <TextareaInput rows={4} value={returnNote} onChange={(e) => setReturnNote(e.target.value)} />
                    </FormField>
                    <FormField label="Staff Note">
                        <TextareaInput rows={4} value={staffNote} onChange={(e) => setStaffNote(e.target.value)} />
                    </FormField>
                </FormRow>

                <table className="table table-bordered table-sm mb-3" style={{ maxWidth: 720 }}>
                    <tbody>
                        <tr><td><strong>Items</strong></td><td className="text-end">{totals.item} ({totals.totalQty})</td></tr>
                        <tr><td><strong>Total</strong></td><td className="text-end">{totals.totalCost.toFixed(decimal)}</td></tr>
                        <tr><td><strong>Order Tax</strong></td><td className="text-end">{totals.orderTax.toFixed(decimal)}</td></tr>
                        <tr><td><strong>Grand Total</strong></td><td className="text-end">{totals.grandTotal.toFixed(decimal)}</td></tr>
                    </tbody>
                </table>

                <div className="d-flex gap-2">
                    <button type="submit" className="ui-btn primary" disabled={submitting}>
                        {submitting ? 'Saving…' : 'Submit'}
                    </button>
                    <Link to="/return-purchase" className="ui-btn">Cancel</Link>
                </div>
            </form>

            <Modal isOpen={!!imeiModal} onClose={() => setImeiModal(null)} title="IMEI or Serial Numbers">
                <div className="table-responsive">
                    <table className="table table-sm">
                        <tbody>
                            {imeiSelection.map((item, i) => (
                                <tr key={item.value}>
                                    <td>{item.value}</td>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={item.checked}
                                            onChange={(e) => setImeiSelection((prev) => prev.map((x, j) => (j === i ? { ...x, checked: e.target.checked } : x)))}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <button type="button" className="ui-btn primary mt-2" onClick={applyImeiSelection}>Update</button>
            </Modal>

            <Toast {...toast} />
        </PageLayout>
    );
}
