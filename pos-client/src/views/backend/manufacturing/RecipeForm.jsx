import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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

export default function RecipeForm() {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [saving, setSaving] = useState(false);
    const [products, setProducts] = useState([]);
    const [productId, setProductId] = useState('');
    const [ingredients, setIngredients] = useState([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const url = isEdit
                    ? `manufacturing/recipes/${id}/edit`
                    : 'manufacturing/recipes/create';
                const res = await api.get(url);
                const data = res.data ?? {};
                setProducts(Array.isArray(data.products) ? data.products : []);

                if (data.recipe) {
                    setProductId(String(data.recipe.id));
                    await loadIngredientsForProduct(String(data.recipe.id), data.recipe);
                }
            } catch (err) {
                const message = err?.message || 'Failed to load recipe form.';
                setLoadError(message);
                showToast(message, 'error');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id, isEdit, showToast]);

    const loadIngredientsForProduct = async (recipeProductId, recipeData = null) => {
        try {
            const formData = new FormData();
            formData.append('product_id', recipeProductId);
            formData.append('recipe', '1');
            const res = await api.post('manufacturing/get-ingredients', formData);
            let rows = Array.isArray(res.data?.ingredients) ? res.data.ingredients : [];

            if (recipeData?.product_list) {
                const ids = recipeData.product_list.split(',').filter(Boolean);
                const qtys = recipeData.qty_list?.split(',') ?? [];
                const prices = recipeData.price_list?.split(',') ?? [];
                const wastages = recipeData.wastage_percent?.split(',') ?? [];
                const units = recipeData.combo_unit_id?.split(',') ?? [];
                rows = ids.map((pid, index) => ({
                    product_id: pid,
                    variant_id: recipeData.variant_list?.split(',')[index] ?? '',
                    qty: qtys[index] ?? 1,
                    unit_price: prices[index] ?? 0,
                    wastage_percent: wastages[index] ?? 0,
                    combo_unit_id: units[index] ?? '',
                    name: rows[index]?.name ?? `Product #${pid}`,
                    code: rows[index]?.code ?? '',
                    product_unit_cost: rows[index]?.unit_price ?? prices[index] ?? 0,
                }));
            }

            setIngredients(rows);
        } catch {
            setIngredients([]);
        }
    };

    useEffect(() => {
        if (!isEdit && productId) {
            loadIngredientsForProduct(productId);
        }
    }, [productId, isEdit]);

    const addIngredientFromSearch = async () => {
        if (search.trim().length < 3) return;
        try {
            const res = await api.get(`products/lims_product_search?data=${encodeURIComponent(search.trim())}`);
            const rows = Array.isArray(res.data) ? res.data : [];
            const item = rows[0];
            if (!item) {
                showToast('Product not found.', 'warning');
                return;
            }
            const pid = item[8];
            if (ingredients.some((r) => String(r.product_id) === String(pid))) {
                showToast('Duplicate ingredient.', 'warning');
                return;
            }
            setIngredients((prev) => [...prev, {
                product_id: pid,
                variant_id: item[9] ?? '',
                name: item[0],
                code: item[1],
                qty: 1,
                unit_price: item[2] ?? 0,
                product_unit_cost: item[10] ?? 0,
                wastage_percent: 0,
                combo_unit_id: item[17] ?? '',
            }]);
            setSearch('');
        } catch (err) {
            showToast(err?.message || 'Search failed.', 'error');
        }
    };

    const updateRow = (index, field, value) => {
        setIngredients((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
    };

    const removeRow = (index) => {
        setIngredients((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!productId) {
            showToast('Select a finished product.', 'warning');
            return;
        }
        if (!ingredients.length) {
            showToast('Add at least one ingredient.', 'warning');
            return;
        }

        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('p_id', productId);
            ingredients.forEach((row) => {
                formData.append('product_list[]', row.product_id);
                formData.append('variant_list[]', row.variant_id ?? '');
                formData.append('product_qty[]', row.qty ?? 1);
                formData.append('unit_price[]', row.unit_price ?? 0);
                formData.append('wastage_percent[]', row.wastage_percent ?? 0);
                formData.append('combo_unit_id[]', row.combo_unit_id ?? '');
                formData.append('product_unit_cost[]', row.product_unit_cost ?? row.unit_price ?? 0);
            });

            await api.post('manufacturing/recipes', formData);
            showToast('Recipe saved.', 'success');
            navigate('/manufacturing/recipes');
        } catch (err) {
            showToast(err?.message || 'Failed to save recipe.', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <PageLayout title={isEdit ? 'Edit Recipe' : 'Add Recipe'}>
                <p className="text-muted">Loading…</p>
            </PageLayout>
        );
    }

    if (loadError) {
        return (
            <PageLayout title={isEdit ? 'Edit Recipe' : 'Add Recipe'}>
                <p className="text-warning">{loadError}</p>
                <Link to="/manufacturing/recipes" className="ui-btn secondary mt-3">
                    ← Back to Recipes
                </Link>
            </PageLayout>
        );
    }

    return (
        <PageLayout title={isEdit ? 'Edit Recipe' : 'Add Recipe'}>
            <Link to="/manufacturing/recipes" className="ui-btn secondary sm mb-3">
                ← Back to Recipes
            </Link>

            <form onSubmit={handleSubmit}>
                <FormRow>
                    <FormField label="Finished Product *">
                        <SelectInput
                            value={productId}
                            disabled={isEdit}
                            onChange={(e) => setProductId(e.target.value)}
                            options={[
                                { value: '', label: 'Select product…' },
                                ...products.map((p) => ({ value: String(p.id), label: `${p.name} [${p.code || p.id}]` })),
                            ]}
                        />
                    </FormField>
                </FormRow>

                {!isEdit && (
                    <div className="d-flex gap-2 mb-3 align-items-end">
                        <FormField label="Search ingredient">
                            <TextInput
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Type product name or code…"
                            />
                        </FormField>
                        <button type="button" className="ui-btn secondary" onClick={addIngredientFromSearch}>
                            Add Ingredient
                        </button>
                    </div>
                )}

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
                                    value={row.wastage_percent ?? 0}
                                    onChange={(e) => updateRow(
                                        ingredients.findIndex((r) => String(r.product_id) === String(row.product_id)),
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
                                    value={row.qty ?? 1}
                                    onChange={(e) => updateRow(
                                        ingredients.findIndex((r) => String(r.product_id) === String(row.product_id)),
                                        'qty',
                                        e.target.value
                                    )}
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
                                    value={row.unit_price ?? 0}
                                    onChange={(e) => updateRow(
                                        ingredients.findIndex((r) => String(r.product_id) === String(row.product_id)),
                                        'unit_price',
                                        e.target.value
                                    )}
                                />
                            ),
                        },
                        {
                            key: 'actions',
                            label: '',
                            render: (row) => (
                                <button
                                    type="button"
                                    className="ui-btn sm danger"
                                    onClick={() => removeRow(
                                        ingredients.findIndex((r) => String(r.product_id) === String(row.product_id))
                                    )}
                                >
                                    Remove
                                </button>
                            ),
                        },
                    ]}
                    rows={ingredients}
                    rowKey="product_id"
                    emptyText="No ingredients added."
                />

                <div className="mt-4">
                    <button type="submit" className="ui-btn primary" disabled={saving}>
                        {saving ? 'Saving…' : 'Save Recipe'}
                    </button>
                </div>
            </form>
        </PageLayout>
    );
}
