import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    PageLayout,
    FormField,
    FormRow,
    SelectInput,
    TextInput,
    TextareaInput,
    FileInput,
    Toast,
    useToast,
    NumberInput,
} from '../../../components/ui';
import { api } from '../../../services';
import { applyLineCalc, calcQuotationTotals } from './quotationCalc';

export default function QuotationCreateSale() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast, showToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [meta, setMeta] = useState(null);
    const [lines, setLines] = useState([]);
    const [document, setDocument] = useState(null);

    const [header, setHeader] = useState({
        reference_no: '',
        customer_id: '',
        warehouse_id: '',
        biller_id: '',
        order_tax_rate: '0',
        order_discount: '0',
        shipping_cost: '0',
        sale_status: '1',
        payment_status: '1',
        paid_by_id: '1',
        paying_amount: '',
        paid_amount: '',
        sale_note: '',
        staff_note: '',
    });

    const decimal = meta?.decimal ?? 2;

    const loadForm = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`quotations/${id}/create-sale`);
            const data = res.data || {};
            setMeta(data);
            const q = data.quotation || {};
            setHeader((h) => ({
                ...h,
                customer_id: String(q.customer_id || ''),
                warehouse_id: String(q.warehouse_id || ''),
                biller_id: String(q.biller_id || ''),
                order_tax_rate: String(q.order_tax_rate ?? 0),
                order_discount: String(q.order_discount ?? 0),
                shipping_cost: String(q.shipping_cost ?? 0),
            }));
            setLines((data.lines || []).map((l, i) => ({ ...l, _id: i + 1 })));
        } catch (err) {
            showToast(err?.message || 'Failed to load sale form.', 'error');
        } finally {
            setLoading(false);
        }
    }, [id, showToast]);

    useEffect(() => {
        loadForm();
    }, [loadForm]);

    const computedLines = useMemo(
        () => lines.map((l) => applyLineCalc(l, decimal)),
        [lines, decimal]
    );

    const totals = useMemo(
        () => calcQuotationTotals(computedLines, header, decimal),
        [computedLines, header, decimal]
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!computedLines.length) {
            showToast('No products on this quotation.', 'error');
            return;
        }

        const fd = new FormData();
        if (header.reference_no) fd.append('reference_no', header.reference_no);
        fd.append('customer_id', header.customer_id);
        fd.append('warehouse_id', header.warehouse_id);
        fd.append('biller_id', header.biller_id);
        fd.append('sale_status', header.sale_status);
        fd.append('payment_status', header.payment_status);
        fd.append('order_tax_rate', totals.order_tax_rate);
        fd.append('order_tax', totals.order_tax);
        fd.append('order_discount', totals.order_discount);
        fd.append('shipping_cost', totals.shipping_cost);
        fd.append('total_qty', totals.total_qty);
        fd.append('total_discount', totals.total_discount);
        fd.append('total_tax', totals.total_tax);
        fd.append('total_price', totals.total_price);
        fd.append('item', totals.item);
        fd.append('grand_total', totals.grand_total);
        fd.append('sale_note', header.sale_note || '');
        fd.append('staff_note', header.staff_note || '');
        if (document) fd.append('document', document);

        const payAmt = parseFloat(header.paid_amount) || 0;
        fd.append('paid_by_id[]', header.paid_by_id);
        fd.append('paying_amount[]', header.paying_amount || payAmt);
        fd.append('paid_amount[]', payAmt);

        computedLines.forEach((l) => {
            fd.append('product_id[]', l.product_id);
            fd.append('product_code[]', l.code);
            fd.append('product_batch_id[]', l.product_batch_id || '');
            fd.append('qty[]', l.qty);
            fd.append('sale_unit[]', l.sale_unit || 'n/a');
            fd.append('net_unit_price[]', l.net_unit_price);
            fd.append('discount[]', l.discount);
            fd.append('tax_rate[]', l.tax_rate);
            fd.append('tax[]', l.tax);
            fd.append('subtotal[]', l.subtotal);
            fd.append('product_price[]', l.product_price);
        });

        setSubmitting(true);
        try {
            const res = await api.post('sales', fd);
            const data = res.data;
            if (typeof data === 'number' || (data && !data.redirect)) {
                showToast('Sale created.', 'success');
                navigate('/sales');
            } else if (data?.redirect) {
                showToast('Sale created.', 'success');
                navigate('/sales');
            } else {
                showToast('Sale created.', 'success');
                navigate('/sales');
            }
        } catch (err) {
            showToast(err?.message || 'Failed to create sale.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <PageLayout eyebrow="Quotation" title="Create Sale from Quotation">
                <p>Loading…</p>
            </PageLayout>
        );
    }

    const q = meta?.quotation || {};

    return (
        <PageLayout eyebrow="Quotation" title="Create Sale from Quotation">
            <p className="text-muted small mb-3">
                Quotation: <strong>{q.reference_no}</strong> · <Link to="/quotations">Back to list</Link>
            </p>

            <form onSubmit={handleSubmit}>
                <FormRow>
                    <FormField label="Reference no">
                        <TextInput
                            value={header.reference_no}
                            onChange={(e) => setHeader({ ...header, reference_no: e.target.value })}
                            placeholder="Auto if empty"
                        />
                    </FormField>
                    <FormField label="Customer *">
                        <SelectInput
                            value={header.customer_id}
                            onChange={(e) => setHeader({ ...header, customer_id: e.target.value })}
                            options={(meta?.customers || []).map((c) => ({
                                value: String(c.id),
                                label: `${c.name}${c.phone_number ? ` (${c.phone_number})` : ''}`,
                            }))}
                        />
                    </FormField>
                    <FormField label="Warehouse *">
                        <SelectInput
                            value={header.warehouse_id}
                            onChange={(e) => setHeader({ ...header, warehouse_id: e.target.value })}
                            options={(meta?.warehouses || []).map((w) => ({ value: String(w.id), label: w.name }))}
                        />
                    </FormField>
                    <FormField label="Biller *">
                        <SelectInput
                            value={header.biller_id}
                            onChange={(e) => setHeader({ ...header, biller_id: e.target.value })}
                            options={(meta?.billers || []).map((b) => ({
                                value: String(b.id),
                                label: `${b.name}${b.company_name ? ` (${b.company_name})` : ''}`,
                            }))}
                        />
                    </FormField>
                </FormRow>

                <div className="table-responsive mb-3">
                    <table className="table table-sm table-bordered">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Code</th>
                                <th>Qty</th>
                                <th>Net unit price</th>
                                <th>Tax</th>
                                <th>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {computedLines.map((l) => (
                                <tr key={l._id}>
                                    <td>{l.name}</td>
                                    <td>{l.code}</td>
                                    <td>{l.qty}</td>
                                    <td>{l.net_unit_price}</td>
                                    <td>{l.tax}</td>
                                    <td>{l.subtotal}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <FormRow>
                    <FormField label="Order tax rate">
                        <SelectInput
                            value={header.order_tax_rate}
                            onChange={(e) => setHeader({ ...header, order_tax_rate: e.target.value })}
                            options={(meta?.order_tax_options || []).map((t) => ({
                                value: String(t.rate),
                                label: t.name,
                            }))}
                        />
                    </FormField>
                    <FormField label="Order discount">
                        <NumberInput
                            value={header.order_discount}
                            step="any"
                            onChange={(e) => setHeader({ ...header, order_discount: e.target.value })}
                        />
                    </FormField>
                    <FormField label="Shipping cost">
                        <NumberInput
                            value={header.shipping_cost}
                            step="any"
                            onChange={(e) => setHeader({ ...header, shipping_cost: e.target.value })}
                        />
                    </FormField>
                </FormRow>

                <FormRow>
                    <FormField label="Sale status">
                        <SelectInput
                            value={header.sale_status}
                            onChange={(e) => setHeader({ ...header, sale_status: e.target.value })}
                            options={[
                                { value: '1', label: 'Completed' },
                                { value: '2', label: 'Pending' },
                            ]}
                        />
                    </FormField>
                    <FormField label="Payment status">
                        <SelectInput
                            value={header.payment_status}
                            onChange={(e) => setHeader({ ...header, payment_status: e.target.value })}
                            options={[
                                { value: '1', label: 'Pending' },
                                { value: '2', label: 'Due' },
                                { value: '3', label: 'Partial' },
                                { value: '4', label: 'Paid' },
                            ]}
                        />
                    </FormField>
                    <FormField label="Paid by">
                        <SelectInput
                            value={header.paid_by_id}
                            onChange={(e) => setHeader({ ...header, paid_by_id: e.target.value })}
                            options={[
                                { value: '1', label: 'Cash' },
                                { value: '4', label: 'Cheque' },
                                { value: '6', label: 'Deposit' },
                            ]}
                        />
                    </FormField>
                    <FormField label="Paying amount">
                        <NumberInput
                            value={header.paying_amount}
                            step="any"
                            onChange={(e) => setHeader({ ...header, paying_amount: e.target.value })}
                        />
                    </FormField>
                    <FormField label="Paid amount">
                        <NumberInput
                            value={header.paid_amount}
                            step="any"
                            onChange={(e) => setHeader({ ...header, paid_amount: e.target.value })}
                        />
                    </FormField>
                </FormRow>

                <FormField label="Document">
                    <FileInput onChange={(e) => setDocument(e.target.files?.[0] || null)} />
                </FormField>

                <div className="border rounded p-3 mb-3">
                    <strong>Grand total:</strong> {totals.grand_total}
                </div>

                <button type="submit" className="ui-btn primary" disabled={submitting}>
                    {submitting ? 'Submitting…' : 'Create sale'}
                </button>
            </form>
            <Toast toast={toast} />
        </PageLayout>
    );
}
