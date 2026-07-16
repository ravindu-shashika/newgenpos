import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { faPlus, faUpload, faFilter, faFileExcel } from '@fortawesome/free-solid-svg-icons';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import ProductViewModal from './ProductViewModal';
import {
    PageLayout,
    DataTable,
    TextInput,
    SelectInput,
    FormRow,
    FormField,
    ConfirmModal,
    Modal,
    ActionMenu,
    useToast,
    Pagination,
    BtnIcon,
    CheckboxInput,
} from '../../../components/ui';
import { api } from '../../../services';
import usePermissions, { usePermissionNames } from '../../../stores/usePermissions';
import { hasPermission as checkPermission } from '../../../config/permissions';

const EXPORT_FIELD_OPTIONS = [
    { key: 'name', label: 'Name' },
    { key: 'code', label: 'Code' },
    { key: 'alt_code', label: 'Alt Code' },
    { key: 'brand', label: 'Brand' },
    { key: 'category', label: 'Category' },
    { key: 'qty', label: 'Quantity' },
    { key: 'unit', label: 'Unit' },
    { key: 'price', label: 'Price' },
    { key: 'cost', label: 'Cost' },
    { key: 'max_price', label: 'Max Price' },
    { key: 'wholesale_price', label: 'Wholesale Price' },
    { key: 'type', label: 'Type' },
    { key: 'alert_quantity', label: 'Alert Qty' },
];

const DEFAULT_EXPORT_FIELDS = ['name', 'code', 'brand', 'category', 'qty', 'price'];

function productCode(row) {
    if (Array.isArray(row.product) && row.product[2]) {
        return String(row.product[2]).replace(/^[\s"']+|[\s"']+$/g, '').trim();
    }
    return stripHtml(row.code) || String(row.code ?? '').trim();
}

function productDisplayName(row) {
    if (Array.isArray(row.product) && row.product[1]) {
        return String(row.product[1]).replace(/^[\s"']+|[\s"']+$/g, '').trim();
    }
    return stripHtml(row.name) || row.code || '';
}

function printBarcodePath(row) {
    const code = productCode(row);
    if (!code) return null;
    const name = productDisplayName(row);
    const label = `${code} (${name})`;
    return {
        pathname: '/products/print_barcode',
        search: `?data=${encodeURIComponent(label)}`,
    };
}

function stripHtml(html) {
    if (!html || typeof html !== 'string') return html ?? '';
    return html.replace(/<[^>]*>/g, '').trim();
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
    const permissionNames = usePermissionNames();
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
    const [exportOpen, setExportOpen] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [exportFields, setExportFields] = useState(() => [...DEFAULT_EXPORT_FIELDS]);
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

    const appendListFilters = (formData) => {
        formData.append('search[value]', search);
        Object.keys(filters).forEach((key) => {
            formData.append(key, filters[key] || '0');
        });
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('start', page * size);
            formData.append('length', size);
            appendListFilters(formData);
            formData.append('order[0][column]', '2');
            formData.append('order[0][dir]', 'asc');
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

    const toggleExportField = (key, checked) => {
        setExportFields((prev) => {
            if (checked) {
                return EXPORT_FIELD_OPTIONS.map((f) => f.key).filter(
                    (k) => k === key || prev.includes(k),
                );
            }
            return prev.filter((k) => k !== key);
        });
    };

    const selectAllExportFields = () => {
        setExportFields(EXPORT_FIELD_OPTIONS.map((f) => f.key));
    };

    const selectDefaultExportFields = () => {
        setExportFields([...DEFAULT_EXPORT_FIELDS]);
    };

    const handleExportExcel = async () => {
        if (!exportFields.length) {
            showToast('Select at least one field to export.', 'error');
            return;
        }
        setExporting(true);
        try {
            const formData = new FormData();
            appendListFilters(formData);
            exportFields.forEach((field) => formData.append('fields[]', field));

            const res = await api.post('products/export-data', formData);
            if (res.error) {
                throw res.error;
            }
            const payload = res.data ?? {};
            const rows = Array.isArray(payload.data) ? payload.data : [];
            const headers = payload.headers || {};
            const fields = Array.isArray(payload.fields) && payload.fields.length
                ? payload.fields
                : exportFields;

            if (!rows.length) {
                showToast('No products match the current filters.', 'warning');
                return;
            }

            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Products');
            sheet.columns = fields.map((key) => ({
                header: headers[key] || EXPORT_FIELD_OPTIONS.find((f) => f.key === key)?.label || key,
                key,
                width: Math.max(12, String(headers[key] || key).length + 4),
            }));
            sheet.getRow(1).font = { bold: true };
            rows.forEach((row) => {
                const line = {};
                fields.forEach((key) => {
                    line[key] = row[key] ?? '';
                });
                sheet.addRow(line);
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const stamp = new Date().toISOString().slice(0, 10);
            saveAs(
                new Blob([buffer], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                }),
                `products-export-${stamp}.xlsx`,
            );
            showToast(`Exported ${rows.length} product${rows.length === 1 ? '' : 's'}.`, 'success');
            setExportOpen(false);
        } catch (err) {
            showToast(err?.message || 'Failed to export products.', 'error');
        } finally {
            setExporting(false);
        }
    };

    const canPrintBarcode = checkPermission('print_barcode', permissionNames);
    const canProductHistory = checkPermission('product_history', permissionNames);

    const stripHtmlCell = stripHtml;
    const exportFieldSet = useMemo(() => new Set(exportFields), [exportFields]);

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
                const barcodeTo = printBarcodePath(row);
                const items = [
                    {
                        label: 'View',
                        onClick: () => setViewRow(row),
                    },
                    canEdit && row.id != null && {
                        label: 'Edit',
                        to: `/products/${row.id}/edit`,
                    },
                    canPrintBarcode && barcodeTo && {
                        label: 'Print Barcode',
                        to: barcodeTo,
                    },
                    canProductHistory && row.id != null && {
                        label: 'Product History',
                        to: productHistoryPath(row),
                    },
                    (canEdit || canPrintBarcode || canProductHistory) && canDelete && { divider: true },
                    canDelete && {
                        label: 'Delete',
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
            <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
                <div className="ui-btn-group">
                    {canAdd && (
                        <Link to="/products/create" className="ui-btn primary">
                            <BtnIcon icon={faPlus} /> Add Product
                        </Link>
                    )}
                    {canImport && (
                        <button type="button" className="ui-btn outline">
                            <BtnIcon icon={faUpload} /> Import Product
                        </button>
                    )}
                    <button
                        type="button"
                        className={`ui-btn ${showFilters ? 'outline-primary' : 'outline'}`}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <BtnIcon icon={faFilter} /> Filter Products
                    </button>
                    <button
                        type="button"
                        className="ui-btn outline"
                        onClick={() => {
                            setExportFields([...DEFAULT_EXPORT_FIELDS]);
                            setExportOpen(true);
                        }}
                    >
                        <BtnIcon icon={faFileExcel} /> Export Excel
                    </button>
                </div>
                <div style={{ marginLeft: 'auto', width: 280, minWidth: 200 }}>
                    <TextInput
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                    />
                </div>
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

            {exportOpen && (
                <Modal
                    title="Export products to Excel"
                    onClose={() => !exporting && setExportOpen(false)}
                    size="md"
                    footer={(
                        <>
                            <button
                                type="button"
                                className="ui-btn ghost"
                                disabled={exporting}
                                onClick={() => setExportOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="ui-btn primary"
                                disabled={exporting || exportFields.length === 0}
                                onClick={handleExportExcel}
                            >
                                {exporting ? 'Exporting…' : 'Download Excel'}
                            </button>
                        </>
                    )}
                >
                    <p className="text-muted mb-3" style={{ fontSize: '0.9rem' }}>
                        Exports products matching the current search and filters
                        {totalRecords ? ` (${totalRecords} in list)` : ''}. Choose which columns to include.
                    </p>
                    <div className="d-flex flex-wrap gap-2 mb-3">
                        <button type="button" className="ui-btn ghost sm" onClick={selectDefaultExportFields}>
                            Default fields
                        </button>
                        <button type="button" className="ui-btn ghost sm" onClick={selectAllExportFields}>
                            Select all
                        </button>
                    </div>
                    <div className="d-flex flex-wrap gap-3">
                        {EXPORT_FIELD_OPTIONS.map((field) => (
                            <CheckboxInput
                                key={field.key}
                                label={field.label}
                                name={`export_${field.key}`}
                                checked={exportFieldSet.has(field.key)}
                                onChange={(e) => toggleExportField(field.key, e.target.checked)}
                            />
                        ))}
                    </div>
                </Modal>
            )}

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
