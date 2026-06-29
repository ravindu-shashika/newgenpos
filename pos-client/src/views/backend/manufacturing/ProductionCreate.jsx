import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    PageLayout,
    DataTable,
    TextInput,
    SelectInput,
    FormField,
    FormRow,
    useToast,
} from '../../../components/ui';
import { api } from '../../../services';

function calcSubtotal(row) {
    const qty = parseFloat(row.qty) || 0;
    const price = parseFloat(row.unit_price) || 0;
    return (qty * price).toFixed(2);
}

export default function ProductionCreate() {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [recipes, setRecipes] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [ingredients, setIngredients] = useState([]);

    const [createdAt, setCreatedAt] = useState(new Date().toISOString().slice(0, 10));
    const [warehouseId, setWarehouseId] = useState('');
    const [recipeId, setRecipeId] = useState('');
    const [totalQty, setTotalQty] = useState('1');
    const [status, setStatus] = useState(false);
    const [note, setNote] = useState('');
    const [shippingCost, setShippingCost] = useState('0');
    const [productionCost, setProductionCost] = useState('0');

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get('manufacturing/productions/create');
                const data = res.data ?? {};
                setRecipes(Array.isArray(data.recipes) ? data.recipes : []);
                setWarehouses(Array.isArray(data.warehouses) ? data.warehouses : []);
                if (data.warehouses?.[0]) {
                    setWarehouseId(String(data.warehouses[0].id));
                }
            } catch (err) {
                showToast(err?.message || 'Failed to load production form.', 'error');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [showToast]);

    useEffect(() => {
        if (!recipeId || !warehouseId) {
            setIngredients([]);
            return;
        }

        const loadIngredients = async () => {
            try {
                const formData = new FormData();
                formData.append('product_id', recipeId);
                formData.append('warehouse_id', warehouseId);
                const res = await api.post('manufacturing/get-ingredients', formData);
                const rows = Array.isArray(res.data?.ingredients) ? res.data.ingredients : [];
                const multiplier = parseFloat(totalQty) || 1;
                setIngredients(rows.map((row) => {
                    const baseQty = parseFloat(row.base_qty ?? row.qty) || 1;
                    const qty = baseQty * multiplier;
                    const unitPrice = parseFloat(row.unit_price) || 0;
                    return {
                        ...row,
                        base_qty: baseQty,
                        qty,
                        unit_price: unitPrice,
                        subtotal: (qty * unitPrice).toFixed(2),
                    };
                }));
            } catch (err) {
                showToast(err?.message || 'Failed to load ingredients.', 'error');
                setIngredients([]);
            }
        };

        loadIngredients();
    }, [recipeId, warehouseId, showToast]);

    useEffect(() => {
        if (!ingredients.length) return;
        const multiplier = parseFloat(totalQty) || 1;
        setIngredients((prev) => prev.map((row) => {
            const baseQty = parseFloat(row.base_qty ?? row.qty) || 1;
            const qty = baseQty * multiplier;
            const unitPrice = parseFloat(row.unit_price) || 0;
            return { ...row, qty, subtotal: (qty * unitPrice).toFixed(2) };
        }));
    }, [totalQty]);

    const grandTotal = useMemo(
        () => ingredients.reduce((sum, row) => sum + (parseFloat(row.subtotal) || 0), 0),
        [ingredients]
    );

    const updateIngredient = (index, field, value) => {
        setIngredients((prev) => prev.map((row, i) => {
            if (i !== index) return row;
            const next = { ...row, [field]: value };
            const qty = parseFloat(next.qty) || 0;
            const unitPrice = parseFloat(next.unit_price) || 0;
            next.subtotal = (qty * unitPrice).toFixed(2);
            return next;
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!warehouseId || !recipeId) {
            showToast('Warehouse and recipe are required.', 'warning');
            return;
        }
        if (!ingredients.length) {
            showToast('Add a recipe with ingredients first.', 'warning');
            return;
        }

        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('created_at', createdAt);
            formData.append('warehouse_id', warehouseId);
            formData.append('product_id', recipeId);
            formData.append('total_qty', totalQty);
            if (status) formData.append('status', '1');
            formData.append('note', note);
            formData.append('shipping_cost', shippingCost);
            formData.append('production_cost', productionCost);
            formData.append('grand_total', String(grandTotal));
            formData.append('total_cost', String(grandTotal));

            ingredients.forEach((row) => {
                formData.append('product_list[]', row.product_id);
                formData.append('variant_id[]', row.variant_id ?? '');
                formData.append('wastage_percent[]', row.wastage_percent ?? 0);
                formData.append('product_qty[]', row.qty);
                formData.append('production_unit_ids[]', row.production_unit_id);
                formData.append('unit_price[]', row.unit_price);
                formData.append('subtotal[]', row.subtotal);
                formData.append('stock_list[]', row.stock ?? 0);
            });

            await api.post('manufacturing/productions', formData);
            showToast('Production created successfully.', 'success');
            navigate('/manufacturing/productions');
        } catch (err) {
            showToast(err?.message || 'Failed to create production.', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <PageLayout title="Add Production">
                <p className="text-muted">Loading…</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout title="Add Production">
            <Link to="/manufacturing/productions" className="ui-btn secondary sm mb-3">
                ← Back to Production List
            </Link>

            <form onSubmit={handleSubmit}>
                <FormRow>
                    <FormField label="Date">
                        <TextInput type="date" value={createdAt} onChange={(e) => setCreatedAt(e.target.value)} />
                    </FormField>
                    <FormField label="Warehouse *">
                        <SelectInput
                            value={warehouseId}
                            onChange={(e) => setWarehouseId(e.target.value)}
                            options={warehouses.map((w) => ({ value: String(w.id), label: w.name }))}
                        />
                    </FormField>
                    <FormField label="Recipe *">
                        <SelectInput
                            value={recipeId}
                            onChange={(e) => setRecipeId(e.target.value)}
                            options={[
                                { value: '', label: 'Select recipe…' },
                                ...recipes.map((r) => ({ value: String(r.id), label: r.name })),
                            ]}
                        />
                    </FormField>
                    <FormField label="Total Qty">
                        <TextInput type="number" min="1" step="any" value={totalQty} onChange={(e) => setTotalQty(e.target.value)} />
                    </FormField>
                </FormRow>

                <FormRow>
                    <FormField label="Shipping Cost">
                        <TextInput type="number" step="any" value={shippingCost} onChange={(e) => setShippingCost(e.target.value)} />
                    </FormField>
                    <FormField label="Production Cost">
                        <TextInput type="number" step="any" value={productionCost} onChange={(e) => setProductionCost(e.target.value)} />
                    </FormField>
                    <FormField label="Note">
                        <TextInput value={note} onChange={(e) => setNote(e.target.value)} />
                    </FormField>
                    <FormField label=" ">
                        <label className="d-flex align-items-center gap-2" style={{ marginTop: 28 }}>
                            <input type="checkbox" checked={status} onChange={(e) => setStatus(e.target.checked)} />
                            Finalized
                        </label>
                    </FormField>
                </FormRow>

                <h6 className="mt-4 mb-2">Ingredient List</h6>
                <DataTable
                    columns={[
                        { key: 'name', label: 'Product', render: (r) => `${r.name} [${r.code}]` },
                        {
                            key: 'wastage_percent',
                            label: 'Wastage %',
                            render: (row) => (
                                <TextInput
                                    type="number"
                                    step="any"
                                    value={row.wastage_percent}
                                    onChange={(e) => updateIngredient(
                                        ingredients.findIndex((r) => r.product_id === row.product_id && String(r.variant_id) === String(row.variant_id)),
                                        'wastage_percent',
                                        e.target.value
                                    )}
                                />
                            ),
                        },
                        {
                            key: 'qty',
                            label: 'Qty',
                            render: (row) => (
                                <TextInput
                                    type="number"
                                    step="any"
                                    value={row.qty}
                                    onChange={(e) => updateIngredient(
                                        ingredients.findIndex((r) => r.product_id === row.product_id && String(r.variant_id) === String(row.variant_id)),
                                        'qty',
                                        e.target.value
                                    )}
                                />
                            ),
                        },
                        {
                            key: 'production_unit_id',
                            label: 'Unit',
                            render: (row) => (
                                <SelectInput
                                    value={String(row.production_unit_id)}
                                    onChange={(e) => updateIngredient(
                                        ingredients.findIndex((r) => r.product_id === row.product_id && String(r.variant_id) === String(row.variant_id)),
                                        'production_unit_id',
                                        e.target.value
                                    )}
                                    options={(row.units || []).map((u) => ({
                                        value: String(u.id),
                                        label: u.unit_name,
                                    }))}
                                />
                            ),
                        },
                        {
                            key: 'unit_price',
                            label: 'Unit Price',
                            render: (row) => (
                                <TextInput
                                    type="number"
                                    step="any"
                                    value={row.unit_price}
                                    onChange={(e) => updateIngredient(
                                        ingredients.findIndex((r) => r.product_id === row.product_id && String(r.variant_id) === String(row.variant_id)),
                                        'unit_price',
                                        e.target.value
                                    )}
                                />
                            ),
                        },
                        { key: 'subtotal', label: 'Subtotal', align: 'right' },
                        { key: 'stock', label: 'Stock', align: 'right' },
                    ]}
                    rows={ingredients}
                    rowKey="product_id"
                    emptyText="Select a recipe to load ingredients."
                />

                <div className="d-flex justify-content-between align-items-center mt-4">
                    <strong>Grand Total: {grandTotal.toFixed(2)}</strong>
                    <button type="submit" className="ui-btn primary" disabled={saving}>
                        {saving ? 'Saving…' : 'Submit'}
                    </button>
                </div>
            </form>
        </PageLayout>
    );
}
