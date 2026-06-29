import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductViewModal from './ProductViewModal';
import {
    PageLayout,
    DataTable,
    TextInput,
    SelectInput,
    FormRow,
    FormField,
    ConfirmModal,
    ActionMenu,
    useToast,
    Pagination,
} from '../../../components/ui';
import { api } from '../../../services';
import usePermissions from '../../../stores/usePermissions';
import authStore from '../../../stores/authStore';
import { permissionsBypassed } from '../../../config/permissions';

function hasPermission(name) {
    if (permissionsBypassed()) return true;
    const perms = authStore.getPermissions();
    return Array.isArray(perms) && perms.includes(name);
}

function stripHtml(html) {
    if (!html || typeof html !== 'string') return html ?? '';
    return html.replace(/<[^>]*>/g, '').trim();
}

function productDisplayName(row) {
    if (Array.isArray(row.product) && row.product[1]) {
        return String(row.product[1]).replace(/^[\s"]+|[\s"]+$/g, '');
    }
    return stripHtml(row.name) || row.code || '';
}

function printBarcodePath(row) {
    const label = `${row.code} (${productDisplayName(row)})`;
    return {
        pathname: '/products/print_barcode',
        search: `?data=${encodeURIComponent(label)}`,
    };
}

function productHistoryPath(row) {
    return {
        pathname: '/products/history',
        search: `?product_id=${row.id}`,
    };
}

export default function ProductList() {
    const { showToast } = useToast();
    const perms = usePermissions('products');
    const canAdd = perms.canAdd;
    const canImport = perms.canImport;
    const canEdit = perms.canEdit;
    const canDelete = perms.canDelete;

    const [loading, setLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [tableData, setTableData] = useState([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [openMenu, setOpenMenu] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [viewRow, setViewRow] = useState(null);
    const [options, setOptions] = useState({
        brands: [],
        categories: [],
        units: [],
        taxes: [],
        warehouses: [],
        modules: [],
    });

    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({
        warehouse_id: '0',
        product_type: 'all',
        brand_id: '0',
        category_id: '0',
        unit_id: '0',
        tax_id: '0',
        imeiorvariant: '0',
        stock_filter: 'all',
    });

    useEffect(() => {
        const fetchInitial = async () => {
            try {
                const res = await api.get('products/initial-data');
                setOptions(res.data || {});
            } catch (err) {
                console.error(err);
            }
        };
        fetchInitial();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('start', page * size);
            formData.append('length', size);
            formData.append('search[value]', search);
            formData.append('order[0][column]', '2');
            formData.append('order[0][dir]', 'asc');

            Object.keys(filters).forEach((key) => {
                formData.append(key, filters[key] || '0');
            });
            formData.append('all_permission[]', 'products-edit');
            formData.append('all_permission[]', 'products-delete');
            formData.append('all_permission[]', 'product_history');
            formData.append('all_permission[]', 'print_barcode');
            formData.append('all_permission[]', 'product_sale');

            const res = await api.post('products/product-data', formData);
            if (res.data) {
                setTableData(res.data.data || []);
                setTotalRecords(res.data.recordsFiltered || 0);
            }
        } catch (error) {
            console.error('Failed to load products', error);
            showToast('Failed to load product data.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchProducts();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [page, size, search, filters]);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setPage(0);
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`products/${id}`);
            showToast('Product deleted.', 'success');
            setDeleteId(null);
            fetchProducts();
        } catch (err) {
            showToast(err?.message || 'Error deleting product.', 'error');
        }
    };

    const canPrintBarcode = hasPermission('print_barcode');
    const canProductHistory = hasPermission('product_history');

    const stripHtmlCell = stripHtml;

    const columns = [
        {
            label: 'Product',
            key: 'name',
            render: (row) => stripHtmlCell(row.name) || row.name,
        },
        {
            label: 'Code',
            key: 'code',
            render: (row) => stripHtmlCell(row.code) || row.code,
        },
        { label: 'Brand', key: 'brand' },
        { label: 'Category', key: 'category' },
        { label: 'Quantity', key: 'qty' },
        { label: 'Unit', key: 'unit' },
        { label: 'Price', key: 'price' },
        { label: 'Cost', key: 'cost' },
        { label: 'Stock Worth', key: 'stock_worth' },
        {
            label: 'Action',
            key: 'action',
            render: (row) => {
                const items = [
                    {
                        label: '👁 View',
                        onClick: () => setViewRow(row),
                    },
                    canEdit && row.id != null && {
                        label: '✎ Edit',
                        to: `/products/${row.id}/edit`,
                    },
                    canProductHistory && row.id != null && {
                        label: '📋 Product History',
                        to: productHistoryPath(row),
                    },
                    canPrintBarcode && row.code && {
                        label: '🖨 Print Barcode',
                        to: printBarcodePath(row),
                    },
                    (canEdit || canProductHistory || canPrintBarcode) && canDelete && { divider: true },
                    canDelete && {
                        label: '🗑 Delete',
                        danger: true,
                        onClick: () => setDeleteId(row.id),
                    },
                ].filter(Boolean);

                if (!items.length) return '—';

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
        <PageLayout title="Product List">
            <div className="d-flex gap-2 mb-3">
                {canAdd && (
                    <Link to="/products/create" className="ui-btn primary">
                        <i className="fa fa-plus" /> Add Product
                    </Link>
                )}
                {canImport && (
                    <button type="button" className="ui-btn secondary">
                        <i className="fa fa-copy" /> Import Product
                    </button>
                )}
                <button type="button" className="ui-btn secondary" onClick={() => setShowFilters(!showFilters)}>
                    <i className="fa fa-filter" /> Filter Products
                </button>
            </div>

            {showFilters && (
                <div className="card mt-3 mb-4">
                    <div className="card-body">
                        <FormRow cols={4}>
                            <FormField label="Warehouse">
                                <SelectInput name="warehouse_id" value={filters.warehouse_id} onChange={handleFilterChange}>
                                    <option value="0">All Warehouse</option>
                                    {options.warehouses?.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </SelectInput>
                            </FormField>
                            <FormField label="Product Type">
                                <SelectInput name="product_type" value={filters.product_type} onChange={handleFilterChange}>
                                    <option value="all">All Types</option>
                                    <option value="standard">Standard</option>
                                    <option value="combo">Combo</option>
                                    <option value="digital">Digital</option>
                                    <option value="service">Service</option>
                                </SelectInput>
                            </FormField>
                            <FormField label="Brand">
                                <SelectInput name="brand_id" value={filters.brand_id} onChange={handleFilterChange}>
                                    <option value="0">All Brands</option>
                                    {options.brands?.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
                                </SelectInput>
                            </FormField>
                            <FormField label="Category">
                                <SelectInput name="category_id" value={filters.category_id} onChange={handleFilterChange}>
                                    <option value="0">All Categories</option>
                                    {options.categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </SelectInput>
                            </FormField>
                            <FormField label="Unit">
                                <SelectInput name="unit_id" value={filters.unit_id} onChange={handleFilterChange}>
                                    <option value="0">All Unit</option>
                                    {options.units?.map((u) => <option key={u.id} value={u.id}>{u.unit_name}</option>)}
                                </SelectInput>
                            </FormField>
                            <FormField label="Tax">
                                <SelectInput name="tax_id" value={filters.tax_id} onChange={handleFilterChange}>
                                    <option value="0">All Tax</option>
                                    {options.taxes?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </SelectInput>
                            </FormField>
                            <FormField label="Product with">
                                <SelectInput name="imeiorvariant" value={filters.imeiorvariant} onChange={handleFilterChange}>
                                    <option value="0">Select IMEI/Variant</option>
                                    <option value="imei">IMEI</option>
                                    <option value="variant">Variant</option>
                                </SelectInput>
                            </FormField>
                            <FormField label="Stock">
                                <SelectInput name="stock_filter" value={filters.stock_filter} onChange={handleFilterChange}>
                                    <option value="all">All</option>
                                    <option value="with">With Stock</option>
                                    <option value="without">Without Stock</option>
                                </SelectInput>
                            </FormField>
                        </FormRow>
                    </div>
                </div>
            )}

            <div className="d-flex justify-content-between align-items-center mb-3">
                <div style={{ width: '250px' }}>
                    <TextInput
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                    />
                </div>
            </div>

            <DataTable
                columns={columns}
                rows={tableData}
                loading={loading}
                emptyText="No products found."
            />

            <Pagination
                page={page + 1}
                totalPages={totalPages}
                pageSize={size}
                totalRows={totalRecords}
                onChange={(nextPage) => setPage(nextPage - 1)}
                pageSizes={[10, 25, 50, 100]}
                onPageSize={(nextSize) => {
                    setSize(nextSize);
                    setPage(0);
                }}
            />

            {deleteId != null && (
                <ConfirmModal
                    title="Delete product"
                    message="Delete this product? It will be deactivated and removed from the list."
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
