import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    PageLayout,
    FormField,
    FormRow,
    FormSection,
    SelectInput,
    TextareaInput,
    FileInput,
    NumberInput,
    Toast,
    useToast,
} from '../../../components/ui';
import { api } from '../../../services';
import authStore from '../../../stores/authStore';
import usePermissions from '../../../stores/usePermissions';

function canImportPurchase(permissions) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.includes('purchases-import') || list.includes('purchases-add');
}

export default function PurchaseImport() {
    const navigate = useNavigate();
    const { toast, showToast } = useToast();
    const perms = usePermissions('purchases');
    const authPerms = authStore.getPermissions();
    const canSubmit = perms.canImport || canImportPurchase(authPerms);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [meta, setMeta] = useState(null);
    const [csvFile, setCsvFile] = useState(null);
    const [documentFile, setDocumentFile] = useState(null);

    const [header, setHeader] = useState({
        warehouse_id: '',
        supplier_id: '',
        status: '1',
        order_tax_rate: '0',
        order_discount: '',
        shipping_cost: '',
        note: '',
    });

    const loadForm = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('purchases/purchase_by_csv');
            const data = res.data || {};
            setMeta(data);
            setHeader((h) => ({
                ...h,
                status: data.status_options?.[0]?.value ?? '1',
            }));
        } catch (err) {
            showToast(err?.message || 'Failed to load form.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        loadForm();
    }, [loadForm]);

    const warehouseOptions = useMemo(
        () => [
            { value: '', label: 'Select warehouse…' },
            ...(meta?.warehouses || []).map((w) => ({ value: String(w.id), label: w.name })),
        ],
        [meta]
    );

    const supplierOptions = useMemo(
        () => [
            { value: '', label: 'Select supplier…' },
            ...(meta?.suppliers || []).map((s) => ({
                value: String(s.id),
                label: s.label || s.name,
            })),
        ],
        [meta]
    );

    const statusOptions = useMemo(
        () => meta?.status_options || [
            { value: '1', label: 'Received' },
            { value: '3', label: 'Pending' },
            { value: '4', label: 'Ordered' },
        ],
        [meta]
    );

    const taxOptions = useMemo(
        () => [
            { value: '0', label: 'No Tax' },
            ...(meta?.taxes || []).map((t) => ({
                value: String(t.rate),
                label: t.name,
            })),
        ],
        [meta]
    );

    const sampleUrl = meta?.sample_file_url || '/sample_file/sample_purchase_products.csv';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit) {
            showToast('You are not allowed to perform this action.', 'error');
            return;
        }
        if (!header.warehouse_id) {
            showToast('Warehouse is required.', 'error');
            return;
        }
        if (!csvFile) {
            showToast('Please upload a CSV file.', 'error');
            return;
        }

        const data = new FormData();
        data.append('warehouse_id', header.warehouse_id);
        if (header.supplier_id) data.append('supplier_id', header.supplier_id);
        data.append('status', header.status);
        data.append('file', csvFile);
        data.append('total_qty', '0');
        data.append('total_discount', '0');
        data.append('total_tax', '0');
        data.append('total_cost', '0');
        data.append('item', '0');
        data.append('order_tax', '0');
        data.append('grand_total', '0');
        data.append('paid_amount', '0');
        data.append('payment_status', '1');
        data.append('order_tax_rate', header.order_tax_rate || '0');
        data.append('order_discount', header.order_discount === '' ? '0' : String(header.order_discount));
        data.append('shipping_cost', header.shipping_cost === '' ? '0' : String(header.shipping_cost));
        data.append('note', header.note || '');
        if (documentFile) data.append('document', documentFile);

        setSubmitting(true);
        try {
            await api.post('importpurchase', data);
            showToast('Purchase imported successfully.', 'success');
            navigate('/purchases');
        } catch (err) {
            const msg = err?.message || 'Import failed.';
            const errs = err?.errors;
            if (errs) {
                const first = Object.values(errs).flat()[0];
                showToast(first || msg, 'error');
            } else {
                showToast(msg, 'error');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <PageLayout eyebrow="Purchase" title="Import Purchase">
                <div className="p-5 text-center">Loading…</div>
            </PageLayout>
        );
    }

    if (!canSubmit) {
        return (
            <PageLayout eyebrow="Purchase" title="Import Purchase">
                <p className="text-danger">You are not allowed to access this page.</p>
                <Link to="/purchases" className="ui-btn">Back to list</Link>
            </PageLayout>
        );
    }

    return (
        <PageLayout eyebrow="Purchase" title="Import Purchase">
            <Toast toast={toast} />
            <p className="text-muted small mb-3">
                Fields marked with * are required.
            </p>

            <form onSubmit={handleSubmit}>
                <FormSection title="Purchase information">
                    <FormRow>
                        <FormField label="Warehouse" required>
                            <SelectInput
                                required
                                value={header.warehouse_id}
                                onChange={(e) =>
                                    setHeader({ ...header, warehouse_id: e.target.value })
                                }
                                options={warehouseOptions}
                            />
                        </FormField>
                        <FormField label="Supplier">
                            <SelectInput
                                value={header.supplier_id}
                                onChange={(e) =>
                                    setHeader({ ...header, supplier_id: e.target.value })
                                }
                                options={supplierOptions}
                            />
                        </FormField>
                        <FormField label="Purchase status">
                            <SelectInput
                                value={header.status}
                                onChange={(e) => setHeader({ ...header, status: e.target.value })}
                                options={statusOptions}
                            />
                        </FormField>
                    </FormRow>
                </FormSection>

                <FormSection title="CSV file">
                    <FormRow>
                        <FormField label="Upload CSV file" required>
                            <FileInput
                                accept=".csv"
                                required
                                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                            />
                            <p className="text-muted small mt-2 mb-0">
                                The correct column order is{' '}
                                <strong>
                                    product_code, quantity, purchase_unit_code, cost, discount_per_unit,
                                    tax_name, profit_margin, profit_margin_type, price, imei_number
                                </strong>
                                {' '}and you must follow this. All columns are required.
                            </p>
                        </FormField>
                        <FormField label="Sample file">
                            <a
                                href={sampleUrl}
                                className="ui-btn ghost"
                                style={{ justifyContent: 'center' }}
                                download
                            >
                                ↓ Download sample file
                            </a>
                        </FormField>
                    </FormRow>
                </FormSection>

                <FormSection title="Totals &amp; extras">
                    <FormRow>
                        <FormField label="Order tax">
                            <SelectInput
                                value={header.order_tax_rate}
                                onChange={(e) =>
                                    setHeader({ ...header, order_tax_rate: e.target.value })
                                }
                                options={taxOptions}
                            />
                        </FormField>
                        <FormField label="Discount">
                            <NumberInput
                                step="any"
                                min="0"
                                value={header.order_discount}
                                onChange={(e) =>
                                    setHeader({ ...header, order_discount: e.target.value })
                                }
                            />
                        </FormField>
                        <FormField label="Shipping cost">
                            <NumberInput
                                step="any"
                                min="0"
                                value={header.shipping_cost}
                                onChange={(e) =>
                                    setHeader({ ...header, shipping_cost: e.target.value })
                                }
                            />
                        </FormField>
                    </FormRow>
                    <FormRow>
                        <FormField label="Attach document">
                            <FileInput onChange={(e) => setDocumentFile(e.target.files?.[0] || null)} />
                            <p className="text-muted small mt-1 mb-0">
                                jpg, jpeg, png, gif, pdf, csv, docx, xlsx and txt supported.
                            </p>
                        </FormField>
                    </FormRow>
                    <FormField label="Note">
                        <TextareaInput
                            rows={5}
                            value={header.note}
                            onChange={(e) => setHeader({ ...header, note: e.target.value })}
                        />
                    </FormField>
                </FormSection>

                <div className="d-flex gap-2">
                    <button type="submit" className="ui-btn primary" disabled={submitting}>
                        {submitting ? 'Importing…' : 'Submit'}
                    </button>
                    <Link to="/purchases" className="ui-btn">
                        Cancel
                    </Link>
                </div>
            </form>
        </PageLayout>
    );
}
