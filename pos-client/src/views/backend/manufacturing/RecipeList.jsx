import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    PageLayout,
    DataTable,
    TextInput,
    ConfirmModal,
    ActionMenu,
    useToast,
    Pagination,
} from '../../../components/ui';
import { api } from '../../../services';
import authStore from '../../../stores/authStore';
import { permissionsBypassed } from '../../../config/permissions';
import ProductViewModal from '../product/ProductViewModal';

function hasPermission(name) {
    if (permissionsBypassed()) return true;
    return authStore.getPermissions()?.includes(name);
}

function stripHtml(html) {
    if (!html || typeof html !== 'string') return html ?? '';
    return html.replace(/<[^>]*>/g, '').trim();
}

export default function RecipeList() {
    const { showToast } = useToast();
    const canAdd = hasPermission('recipe-add');
    const canEdit = hasPermission('recipe-edit');
    const canDelete = hasPermission('recipe-delete');

    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [search, setSearch] = useState('');
    const [openMenu, setOpenMenu] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [viewRow, setViewRow] = useState(null);

    const fetchRows = async () => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('start', page * size);
            formData.append('length', size);
            formData.append('search[value]', search);
            formData.append('order[0][column]', '2');
            formData.append('order[0][dir]', 'asc');
            formData.append('is_recipe', '1');
            formData.append('warehouse_id', '0');

            const res = await api.post('manufacturing/product-data', formData);
            const data = res.data ?? {};
            setRows(data.data || []);
            setTotalRecords(data.recordsFiltered || 0);
        } catch (err) {
            showToast(err?.message || 'Failed to load recipes.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const t = setTimeout(fetchRows, 300);
        return () => clearTimeout(t);
    }, [page, size, search]);

    const handleDelete = async (id) => {
        try {
            await api.delete(`manufacturing/recipes/${id}`);
            showToast('Recipe removed.', 'success');
            setDeleteId(null);
            fetchRows();
        } catch (err) {
            showToast(err?.message || 'Failed to remove recipe.', 'error');
        }
    };

    const columns = [
        {
            key: 'name',
            label: 'Product',
            render: (row) => stripHtml(String(row.name ?? '')),
        },
        { key: 'code', label: 'Code' },
        { key: 'category', label: 'Category' },
        { key: 'qty', label: 'Qty', render: (row) => stripHtml(String(row.qty ?? '')) },
        { key: 'unit', label: 'Unit' },
        { key: 'price', label: 'Price', render: (row) => stripHtml(String(row.price ?? '')) },
        { key: 'cost', label: 'Cost' },
        {
            key: 'actions',
            label: 'Action',
            render: (row) => {
                const items = [
                    { label: '👁 View', onClick: () => setViewRow(row) },
                ];
                if (canEdit) {
                    items.push({ label: '✎ Edit', to: `/manufacturing/recipes/${row.id}/edit` });
                }
                if (canDelete) {
                    items.push({ divider: true });
                    items.push({
                        label: '🗑 Delete',
                        danger: true,
                        onClick: () => setDeleteId(row.id),
                    });
                }
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

    const totalPages = Math.max(1, Math.ceil(totalRecords / size) || 1);

    return (
        <PageLayout title="Recipe">
            <div className="d-flex flex-wrap gap-2 mb-3">
                {canAdd && (
                    <Link to="/manufacturing/recipes/create" className="ui-btn primary">
                        Add Recipe
                    </Link>
                )}
                <div style={{ width: 250 }}>
                    <TextInput
                        placeholder="Search recipes…"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                    />
                </div>
            </div>

            <DataTable columns={columns} rows={rows} loading={loading} emptyText="No recipes found." />

            <Pagination
                page={page + 1}
                totalPages={totalPages}
                pageSize={size}
                totalRows={totalRecords}
                onChange={(next) => setPage(next - 1)}
                pageSizes={[10, 25, 50, 100]}
                onPageSize={(nextSize) => { setSize(nextSize); setPage(0); }}
            />

            {deleteId != null && (
                <ConfirmModal
                    title="Remove recipe"
                    message="Remove recipe flag from this product?"
                    danger
                    onConfirm={() => handleDelete(deleteId)}
                    onClose={() => setDeleteId(null)}
                />
            )}

            {viewRow && (
                <ProductViewModal row={viewRow} onClose={() => setViewRow(null)} />
            )}
        </PageLayout>
    );
}
