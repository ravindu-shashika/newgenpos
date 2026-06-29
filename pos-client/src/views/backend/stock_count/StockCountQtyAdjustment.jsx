import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    PageLayout,
    FormSection,
    FormField,
    FileInput,
    Toast,
    useToast,
} from '../../../components/ui';
import { api } from '../../../services';

export default function StockCountQtyAdjustment() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast, showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [meta, setMeta] = useState(null);
    const [lines, setLines] = useState([]);
    const [document, setDocument] = useState(null);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res = await api.get(`stock-count/${id}/adjustment-form`);
                setMeta(res.data || {});
                setLines((res.data?.lines || []).map((l, i) => ({ ...l, _id: i + 1 })));
            } catch (err) {
                showToast(err?.message || 'Failed to load adjustment data.', 'error');
                navigate('/stock-count');
            } finally {
                setLoading(false);
            }
        })();
    }, [id, navigate, showToast]);

    const totalQty = useMemo(
        () => lines.reduce((s, l) => s + (parseFloat(l.qty) || 0), 0),
        [lines]
    );

    const updateLine = (lineId, field, value) => {
        setLines((prev) => prev.map((l) => (l._id === lineId ? { ...l, [field]: value } : l)));
    };

    const removeLine = (lineId) => setLines((prev) => prev.filter((l) => l._id !== lineId));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!lines.length) {
            showToast('No adjustment lines.', 'error');
            return;
        }

        const fd = new FormData();
        fd.append('warehouse_id', String(meta.warehouse_id));
        fd.append('stock_count_id', String(meta.stock_count_id));
        fd.append('total_qty', String(totalQty));
        fd.append('item', String(lines.length));
        if (document) fd.append('document', document);

        lines.forEach((l) => {
            fd.append('product_id[]', l.product_id);
            fd.append('product_code[]', l.product_code);
            fd.append('qty[]', String(l.qty));
            fd.append('action[]', l.action);
            fd.append('unit_cost[]', String(l.unit_cost || 0));
        });

        setSubmitting(true);
        try {
            await api.post('qty_adjustment', fd);
            showToast('Adjustment saved successfully.', 'success');
            navigate('/stock-count');
        } catch (err) {
            showToast(err?.message || 'Failed to save adjustment.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <PageLayout title="Add Adjustment">
                <div className="p-5 text-center">Loading...</div>
            </PageLayout>
        );
    }

    return (
        <PageLayout eyebrow="Stock Count" title="Add Adjustment from Stock Count">
            <Toast toast={toast} />
            <p className="text-muted">
                Reference: <strong>{meta?.reference_no}</strong>
            </p>
            <form onSubmit={handleSubmit}>
                <FormSection title="Details">
                    <FormField label="Attach Document">
                        <FileInput onChange={(e) => setDocument(e.target.files?.[0] || null)} />
                    </FormField>
                </FormSection>

                <FormSection title="Adjustment lines">
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Code</th>
                                    <th>Qty</th>
                                    <th>Action</th>
                                    <th />
                                </tr>
                            </thead>
                            <tbody>
                                {lines.map((l) => (
                                    <tr key={l._id}>
                                        <td>{l.name}</td>
                                        <td>{l.product_code}</td>
                                        <td style={{ width: 100 }}>
                                            <input
                                                type="number"
                                                className="form-control form-control-sm"
                                                min="0"
                                                step="any"
                                                required
                                                value={l.qty}
                                                onChange={(e) => updateLine(l._id, 'qty', e.target.value)}
                                            />
                                        </td>
                                        <td style={{ width: 140 }}>
                                            <select
                                                className="form-select form-select-sm"
                                                value={l.action}
                                                onChange={(e) => updateLine(l._id, 'action', e.target.value)}
                                            >
                                                <option value="+">Addition</option>
                                                <option value="-">Subtraction</option>
                                            </select>
                                        </td>
                                        <td>
                                            <button type="button" className="btn btn-sm btn-danger" onClick={() => removeLine(l._id)}>×</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </FormSection>

                <div className="d-flex gap-2">
                    <button type="submit" className="ui-btn primary" disabled={submitting}>
                        {submitting ? 'Saving...' : 'Submit'}
                    </button>
                    <button type="button" className="ui-btn" onClick={() => navigate('/stock-count')}>Cancel</button>
                </div>
            </form>
        </PageLayout>
    );
}
