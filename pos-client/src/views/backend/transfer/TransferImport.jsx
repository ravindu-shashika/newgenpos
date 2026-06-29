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

function hasTransferPermission(permissions, name) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.includes(name);
}

function canImportTransfer(permissions) {
    return (
        hasTransferPermission(permissions, 'transfers-import')
        || hasTransferPermission(permissions, 'transfers-add')
    );
}

export default function TransferImport() {
    const navigate = useNavigate();
    const { toast, showToast } = useToast();
    const perms = usePermissions('transfers');
    const authPerms = authStore.getPermissions();
    const canSubmit = perms.canImport || canImportTransfer(authPerms);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [meta, setMeta] = useState(null);
    const [csvFile, setCsvFile] = useState(null);
    const [documentFile, setDocumentFile] = useState(null);

    const [header, setHeader] = useState({
        from_warehouse_id: '',
        to_warehouse_id: '',
        status: '1',
        shipping_cost: '',
        note: '',
    });

    const loadForm = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('transfers/transfer_by_csv');
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

    const statusOptions = useMemo(
        () => meta?.status_options || [
            { value: '1', label: 'Completed' },
            { value: '2', label: 'Pending' },
            { value: '3', label: 'Sent' },
        ],
        [meta]
    );

    const sampleUrl = meta?.sample_file_url || '/sample_file/sample_transfer_products.csv';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit) {
            showToast('You are not allowed to perform this action.', 'error');
            return;
        }
        if (!header.from_warehouse_id) {
            showToast('From warehouse is required.', 'error');
            return;
        }
        if (!header.to_warehouse_id) {
            showToast('To warehouse is required.', 'error');
            return;
        }
        if (header.from_warehouse_id === header.to_warehouse_id) {
            showToast('Both Warehouse can not be same!', 'error');
            return;
        }
        if (!csvFile) {
            showToast('Please upload a CSV file.', 'error');
            return;
        }

        const data = new FormData();
        data.append('from_warehouse_id', header.from_warehouse_id);
        data.append('to_warehouse_id', header.to_warehouse_id);
        data.append('status', header.status);
        data.append('file', csvFile);
        data.append('total_qty', '0');
        data.append('total_tax', '0');
        data.append('total_cost', '0');
        data.append('item', '0');
        data.append('grand_total', '0');
        data.append('shipping_cost', header.shipping_cost === '' ? '0' : String(header.shipping_cost));
        data.append('note', header.note || '');
        if (documentFile) data.append('document', documentFile);

        setSubmitting(true);
        try {
            await api.post('importtransfer', data);
            showToast('Transfer imported successfully.', 'success');
            navigate('/transfers');
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
            <PageLayout eyebrow="Transfer" title="Import Transfer">
                <div className="p-5 text-center">Loading…</div>
            </PageLayout>
        );
    }

    if (!canSubmit) {
        return (
            <PageLayout eyebrow="Transfer" title="Import Transfer">
                <p className="text-danger">You are not allowed to access this page.</p>
                <Link to="/transfers" className="ui-btn">Back to list</Link>
            </PageLayout>
        );
    }

    return (
        <PageLayout eyebrow="Transfer" title="Import Transfer">
            <Toast toast={toast} />
            <p className="text-muted small mb-3">
                Fields marked with * are required.
            </p>

            <form onSubmit={handleSubmit}>
                <FormSection title="Transfer information">
                    <FormRow>
                        <FormField label="From warehouse" required>
                            <SelectInput
                                required
                                value={header.from_warehouse_id}
                                onChange={(e) =>
                                    setHeader({ ...header, from_warehouse_id: e.target.value })
                                }
                                options={warehouseOptions}
                            />
                        </FormField>
                        <FormField label="To warehouse" required>
                            <SelectInput
                                required
                                value={header.to_warehouse_id}
                                onChange={(e) =>
                                    setHeader({ ...header, to_warehouse_id: e.target.value })
                                }
                                options={warehouseOptions}
                            />
                        </FormField>
                        <FormField label="Status">
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
                                <strong>product_code, quantity, product_unit, product_cost, tax_name</strong>
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

                <FormSection title="Additional details">
                    <FormRow>
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
                    <Link to="/transfers" className="ui-btn">
                        Cancel
                    </Link>
                </div>
            </form>
        </PageLayout>
    );
}
