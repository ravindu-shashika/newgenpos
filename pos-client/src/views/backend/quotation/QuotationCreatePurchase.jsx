import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    PageLayout,
    FormField,
    FormRow,
    SelectInput,
    TextareaInput,
    FileInput,
    Toast,
    useToast,
    NumberInput,
} from '../../../components/ui';
import { api } from '../../../services';

function calcPurchaseLine(line) {
    const qty = parseFloat(line.qty) || 0;
    const cost = parseFloat(line.net_unit_cost) || 0;
    const discount = parseFloat(line.discount) || 0;
    const rate = parseFloat(line.tax_rate) || 0;
    const base = qty * cost - discount;
    const tax = (base * rate) / 100;
    return { tax, subtotal: base + tax };
}

export default function QuotationCreatePurchase() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast, showToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [meta, setMeta] = useState(null);
    const [lines, setLines] = useState([]);
    const [document, setDocument] = useState(null);

    const [header, setHeader] = useState({
        warehouse_id: '',
        supplier_id: '',
        status: 1,
        currency_id: '',
        exchange_rate: 1,
        order_tax_rate: '0',
        order_discount: '0',
        shipping_cost: '0',
        note: '',
    });

    const loadForm = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`quotations/${id}/create-purchase`);
            const data = res.data || {};
            setMeta(data);
            const q = data.quotation || {};
            setHeader((h) => ({
                ...h,
                warehouse_id: String(q.warehouse_id || ''),
                supplier_id: q.supplier_id ? String(q.supplier_id) : '',
                order_tax_rate: String(q.order_tax_rate ?? 0),
                order_discount: String(q.order_discount ?? 0),
                shipping_cost: String(q.shipping_cost ?? 0),
                currency_id: data.default_currency_id ? String(data.default_currency_id) : '',
                exchange_rate: data.default_exchange_rate || 1,
            }));
            setLines((data.lines || []).map((l, i) => ({ ...l, _id: i + 1 })));
        } catch (err) {
            showToast(err?.message || 'Failed to load purchase form.', 'error');
        } finally {
            setLoading(false);
        }
    }, [id, showToast]);

    useEffect(() => {
        loadForm();
    }, [loadForm]);

    const totals = useMemo(() => {
        let totalCost = 0;
        let totalTax = 0;
        let totalQty = 0;
        const updated = lines.map((line) => {
            const { subtotal, tax } = calcPurchaseLine(line);
            totalCost += subtotal;
            totalTax += tax;
            totalQty += parseFloat(line.qty) || 0;
            return { ...line, tax, subtotal };
        });
        const orderTaxRate = parseFloat(header.order_tax_rate) || 0;
        const orderTax = (totalCost * orderTaxRate) / 100;
        const orderDiscount = parseFloat(header.order_discount) || 0;
        const shipping = parseFloat(header.shipping_cost) || 0;
        const grandTotal = totalCost + orderTax + shipping - orderDiscount;
        return {
            updated,
            totalCost,
            totalTax,
            totalQty,
            orderTax,
            grandTotal,
        };
    }, [lines, header.order_tax_rate, header.order_discount, header.shipping_cost]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!header.warehouse_id) {
            showToast('Warehouse is required.', 'error');
            return;
        }
        if (!totals.updated.length) {
            showToast('No standard products on this quotation.', 'error');
            return;
        }

        const products = totals.updated.map((l) => ({
            product_id: l.product_id,
            code: l.code,
            qty: l.qty,
            recieved: l.recieved ?? l.qty,
            purchase_unit: l.sale_unit !== 'n/a' ? l.sale_unit : '',
            purchase_unit_id: l.sale_unit_id || null,
            net_unit_cost: l.net_unit_cost,
            net_unit_margin: l.net_unit_margin ?? 0,
            net_unit_margin_type: 'percentage',
            net_unit_price: l.net_unit_price ?? 0,
            discount: l.discount || 0,
            tax_rate: l.tax_rate || 0,
            tax: l.tax,
            subtotal: l.subtotal,
        }));

        const payload = {
            warehouse_id: Number(header.warehouse_id),
            supplier_id: header.supplier_id ? Number(header.supplier_id) : null,
            status: Number(header.status),
            currency_id: Number(header.currency_id),
            exchange_rate: Number(header.exchange_rate),
            order_tax_rate: Number(header.order_tax_rate) || 0,
            order_tax: totals.orderTax,
            order_discount: Number(header.order_discount) || 0,
            shipping_cost: Number(header.shipping_cost) || 0,
            note: header.note || '',
            grand_total: totals.grandTotal,
            total_cost: totals.totalCost,
            total_tax: totals.totalTax,
            total_qty: totals.totalQty,
            payment_status: 1,
            products,
        };

        setSubmitting(true);
        try {
            await api.post('purchases', payload);
            showToast('Purchase created.', 'success');
            navigate('/purchases');
        } catch (err) {
            showToast(err?.message || 'Failed to create purchase.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <PageLayout eyebrow="Quotation" title="Create Purchase from Quotation">
                <p>Loading…</p>
            </PageLayout>
        );
    }

    const q = meta?.quotation || {};

    return (
        <PageLayout eyebrow="Quotation" title="Create Purchase from Quotation">
            <p className="text-muted small mb-3">
                Quotation: <strong>{q.reference_no}</strong> · <Link to="/quotations">Back to list</Link>
            </p>

            <form onSubmit={handleSubmit}>
                <FormRow>
                    <FormField label="Warehouse *">
                        <SelectInput
                            value={header.warehouse_id}
                            onChange={(e) => setHeader({ ...header, warehouse_id: e.target.value })}
                            options={(meta?.warehouses || []).map((w) => ({ value: String(w.id), label: w.name }))}
                        />
                    </FormField>
                    <FormField label="Supplier">
                        <SelectInput
                            value={header.supplier_id}
                            onChange={(e) => setHeader({ ...header, supplier_id: e.target.value })}
                            options={[
                                { value: '', label: '— None —' },
                                ...(meta?.suppliers || []).map((s) => ({
                                    value: String(s.id),
                                    label: `${s.name}${s.company_name ? ` (${s.company_name})` : ''}`,
                                })),
                            ]}
                        />
                    </FormField>
                    <FormField label="Purchase status">
                        <SelectInput
                            value={String(header.status)}
                            onChange={(e) => setHeader({ ...header, status: Number(e.target.value) })}
                            options={[
                                { value: '1', label: 'Received' },
                                { value: '2', label: 'Partial' },
                                { value: '3', label: 'Pending' },
                                { value: '4', label: 'Ordered' },
                            ]}
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
                                <th>Net unit cost</th>
                                <th>Tax</th>
                                <th>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {totals.updated.map((l) => (
                                <tr key={l._id}>
                                    <td>{l.name}</td>
                                    <td>{l.code}</td>
                                    <td>{l.qty}</td>
                                    <td>{l.net_unit_cost}</td>
                                    <td>{l.tax}</td>
                                    <td>{l.subtotal}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <FormRow>
                    <FormField label="Order tax">
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

                <FormField label="Note">
                    <TextareaInput
                        rows={3}
                        value={header.note}
                        onChange={(e) => setHeader({ ...header, note: e.target.value })}
                    />
                </FormField>
                <FormField label="Document">
                    <FileInput onChange={(e) => setDocument(e.target.files?.[0] || null)} />
                </FormField>

                <div className="border rounded p-3 mb-3">
                    <strong>Grand total:</strong> {totals.grandTotal.toFixed(2)}
                </div>

                <button type="submit" className="ui-btn primary" disabled={submitting}>
                    {submitting ? 'Submitting…' : 'Create purchase'}
                </button>
            </form>
            <Toast toast={toast} />
        </PageLayout>
    );
}
