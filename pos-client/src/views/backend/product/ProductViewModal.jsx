import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from '../../../components/ui';
import { api } from '../../../services';
import authStore from '../../../stores/authStore';
import { hasPermission } from '../../../config/permissions';
import { usePermissionNames } from '../../../stores/usePermissions';

function printBarcodePath(row, name, code) {
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

function cleanToken(value) {
    return String(value ?? '')
        .replace(/^[\s\["']+|[\s\]"']+$/g, '')
        .trim();
}

export function parseProductPayload(raw) {
    if (!Array.isArray(raw) || raw.length < 13) return null;

    return {
        type: cleanToken(raw[0]),
        name: cleanToken(raw[1]),
        code: cleanToken(raw[2]),
        brand: cleanToken(raw[3]),
        category: cleanToken(raw[4]),
        unit: cleanToken(raw[5]),
        cost: cleanToken(raw[6]),
        price: cleanToken(raw[7]),
        tax: cleanToken(raw[8]),
        taxMethod: cleanToken(raw[9]),
        alertQuantity: cleanToken(raw[10]),
        details: cleanToken(raw[11]).replace(/@/g, '"'),
        id: cleanToken(raw[12]),
        productList: cleanToken(raw[13]),
        variantList: cleanToken(raw[14]),
        qtyList: cleanToken(raw[15]),
        priceList: cleanToken(raw[16]),
        qty: cleanToken(raw[17]),
        image: cleanToken(raw[18]),
        isVariant: ['1', 'true', true].includes(raw[19]) || cleanToken(raw[19]) === '1',
        comboUnit: cleanToken(raw[20]),
        wastagePercent: cleanToken(raw[21]),
    };
}

function resolveProductDetails(row) {
    const parsed = parseProductPayload(row?.product);
    const name = parsed?.name || stripHtml(row?.name) || row?.code || 'Product';
    const id = parsed?.id || row?.id;

    return {
        ...parsed,
        id,
        name,
        code: parsed?.code || row?.code,
        brand: parsed?.brand || row?.brand,
        category: parsed?.category || row?.category,
        unit: parsed?.unit || row?.unit,
        price: parsed?.price || stripHtml(String(row?.price ?? '')),
        cost: parsed?.cost ?? row?.cost,
        qty: parsed?.qty ?? stripHtml(String(row?.qty ?? '')),
        type: parsed?.type || 'standard',
        image: parsed?.image || '',
        isVariant: parsed?.isVariant ?? false,
        productList: parsed?.productList || '',
        variantList: parsed?.variantList || '',
        qtyList: parsed?.qtyList || '',
        priceList: parsed?.priceList || '',
        comboUnit: parsed?.comboUnit || '',
        wastagePercent: parsed?.wastagePercent || '',
        tax: parsed?.tax || 'N/A',
        taxMethod: parsed?.taxMethod || 'N/A',
        alertQuantity: parsed?.alertQuantity || '—',
        details: parsed?.details || '',
    };
}

function productImageUrls(imageField, imagePathFallback) {
    const serverBase = api.defaultPath.replace(/\/api\/?$/, '');

    if (imagePathFallback) {
        return [imagePathFallback];
    }
    if (!imageField) {
        return [`${serverBase}/images/zummXD2dvAtI.png`];
    }

    const urls = String(imageField)
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
        .map((file) => {
            if (file === 'zummXD2dvAtI.png') {
                return `${serverBase}/images/zummXD2dvAtI.png`;
            }
            return `${serverBase}/images/product/${file}`;
        });

    return urls.length ? urls : [`${serverBase}/images/zummXD2dvAtI.png`];
}

function DetailTable({ columns, rows, emptyText = 'No records.' }) {
    if (!rows?.length) {
        return <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>{emptyText}</p>;
    }

    return (
        <div className="ui-table-wrap">
            <table className="ui-table">
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th key={col.key}>{col.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, index) => (
                        <tr key={index}>
                            {columns.map((col) => (
                                <td key={col.key}>{row[col.key] ?? '—'}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function ProductViewModal({ row, onClose }) {
    const details = useMemo(() => resolveProductDetails(row), [row]);
    const permissionNames = usePermissionNames();
    const canPrintBarcode = hasPermission('print_barcode', permissionNames);
    const roleId = Number(authStore.getUser()?.role_id ?? 99);
    const showCost = roleId <= 2;

    const [loading, setLoading] = useState(true);
    const [variants, setVariants] = useState([]);
    const [warehouseRows, setWarehouseRows] = useState([]);
    const [variantWarehouseRows, setVariantWarehouseRows] = useState([]);
    const [comboRows, setComboRows] = useState([]);
    const [imageIndex, setImageIndex] = useState(0);

    const images = useMemo(
        () => productImageUrls(details.image, row?.image_path),
        [details.image, row?.image_path]
    );

    useEffect(() => {
        if (!details.id) return;

        let cancelled = false;

        const load = async () => {
            setLoading(true);
            try {
                const tasks = [];

                if (details.type === 'standard' || details.type === 'combo') {
                    if (details.isVariant) {
                        tasks.push(
                            api.get(`products/variant-data/${details.id}`).then((res) => {
                                const data = res.data?.data ?? res.data ?? [];
                                if (!cancelled) setVariants(Array.isArray(data) ? data : []);
                            })
                        );
                    }

                    if (showCost) {
                        tasks.push(
                            api.get(`products/product_warehouse/${details.id}`).then((res) => {
                                const data = res.data ?? {};
                                const pw = data.product_warehouse || [];
                                const pvw = data.product_variant_warehouse || [];

                                if (cancelled) return;

                                const [warehouses = [], qtys = [], batches = [], expired = [], imeis = []] = pw;
                                setWarehouseRows(
                                    warehouses.map((warehouse, index) => ({
                                        warehouse,
                                        batch: batches[index] ?? 'N/A',
                                        expired: expired[index] ?? 'N/A',
                                        qty: qtys[index] ?? 0,
                                        imei: imeis[index] ?? 'N/A',
                                    }))
                                );

                                const [vwWarehouses = [], vwVariants = [], vwQtys = []] = pvw;
                                setVariantWarehouseRows(
                                    vwWarehouses.map((warehouse, index) => ({
                                        warehouse,
                                        variant: vwVariants[index] ?? '',
                                        qty: vwQtys[index] ?? 0,
                                    }))
                                );
                            })
                        );
                    }
                }

                if (details.type === 'combo' && details.productList) {
                    const productIds = details.productList.split(',').filter(Boolean);
                    const variantIds = details.variantList.split(',').filter(Boolean);
                    const qtys = details.qtyList.split(',').filter(Boolean);
                    const prices = details.priceList.split(',').filter(Boolean);
                    const units = details.comboUnit.split(',').filter(Boolean);
                    const wastages = details.wastagePercent.split(',').filter(Boolean);

                    tasks.push(
                        Promise.all(
                            productIds.map((productId, index) =>
                                api
                                    .get(`products/getdata/${productId}/${variantIds[index] || 0}`)
                                    .then((res) => res.data ?? {})
                                    .then((item) => ({
                                        name: item.name ?? '—',
                                        code: item.code ?? item.item_code ?? '—',
                                        wastage: wastages[index] ?? '—',
                                        qty: qtys[index] ?? '—',
                                        unit: units[index] ?? '',
                                        price: prices[index] ?? '—',
                                    }))
                                    .catch(() => ({
                                        name: '—',
                                        code: '—',
                                        wastage: wastages[index] ?? '—',
                                        qty: qtys[index] ?? '—',
                                        unit: units[index] ?? '',
                                        price: prices[index] ?? '—',
                                    }))
                            )
                        ).then((rows) => {
                            if (!cancelled) setComboRows(rows);
                        })
                    );
                }

                await Promise.all(tasks);
            } catch (error) {
                console.error('Failed to load product details', error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [details.id, details.type, details.isVariant, details.productList, showCost]);

    useEffect(() => {
        setImageIndex(0);
    }, [details.id]);

    return (
        <Modal
            title="Product Details"
            onClose={onClose}
            size="lg"
            hideHint
            headerExtra={
                canPrintBarcode && details.code ? (
                    <Link
                        to={printBarcodePath(row, details.name, details.code)}
                        className="ui-btn sm secondary"
                        onClick={onClose}
                    >
                        Print Barcode
                    </Link>
                ) : null
            }
            footer={
                <button type="button" className="ui-btn ghost" onClick={onClose}>
                    Close
                </button>
            }
        >
            <div className="row g-4">
                <div className="col-12 col-md-5">
                    <img
                        src={images[imageIndex]}
                        alt={details.name}
                        style={{ width: '100%', maxHeight: 280, objectFit: 'contain' }}
                    />
                    {images.length > 1 && (
                                <div className="d-flex gap-2 mt-2 flex-wrap">
                                    {images.map((src, index) => (
                                        <button
                                            key={src}
                                            type="button"
                                            className={`ui-btn sm ${index === imageIndex ? 'primary' : 'secondary'}`}
                                            onClick={() => setImageIndex(index)}
                                        >
                                            {index + 1}
                                        </button>
                                    ))}
                        </div>
                    )}
                </div>

                <div className="col-12 col-md-7">
                    <h6 className="mb-3">{details.name}</h6>
                    <dl
                        className="mb-0"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '140px 1fr',
                            gap: '8px 12px',
                            fontSize: '0.9rem',
                        }}
                    >
                        <dt>Type</dt><dd>{details.type}</dd>
                        <dt>Name</dt><dd>{details.name}</dd>
                        <dt>Code</dt><dd>{details.code}</dd>
                        <dt>Brand</dt><dd>{details.brand}</dd>
                        <dt>Category</dt><dd>{details.category}</dd>
                        <dt>Quantity</dt><dd>{details.qty}</dd>
                        <dt>Unit</dt><dd>{details.unit}</dd>
                        {showCost && (
                            <>
                                <dt>Cost</dt><dd>{details.cost ?? '—'}</dd>
                            </>
                        )}
                        <dt>Price</dt><dd>{details.price}</dd>
                        <dt>Tax</dt><dd>{details.tax}</dd>
                        <dt>Tax Method</dt><dd>{details.taxMethod}</dd>
                        <dt>Alert Quantity</dt><dd>{details.alertQuantity}</dd>
                    </dl>
                    {details.details && (
                        <div className="mt-3">
                            <strong style={{ fontSize: '0.9rem' }}>Product Details</strong>
                            <div
                                className="mt-1 text-muted"
                                style={{ fontSize: '0.85rem' }}
                                dangerouslySetInnerHTML={{ __html: details.details }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {loading && (
                <p className="text-muted mt-4 mb-0" style={{ fontSize: '0.85rem' }}>Loading additional details…</p>
            )}

            {!loading && details.type === 'combo' && comboRows.length > 0 && (
                <div className="mt-4">
                    <h6 className="mb-2">Combo Products</h6>
                    <DetailTable
                        columns={[
                            { key: 'name', label: 'Product' },
                            { key: 'wastage', label: 'Wastage %' },
                            { key: 'qty', label: 'Quantity' },
                            { key: 'price', label: 'Price' },
                        ]}
                        rows={comboRows.map((item) => ({
                            name: `${item.name} [${item.code}]${item.unit ? ` (${item.unit})` : ''}`,
                            wastage: item.wastage,
                            qty: item.qty,
                            price: item.price,
                        }))}
                    />
                </div>
            )}

            {!loading && variants.length > 0 && (
                <div className="mt-4">
                    <h6 className="mb-2">Product Variant Information</h6>
                    <DetailTable
                        columns={[
                            { key: 'name', label: 'Variant' },
                            { key: 'item_code', label: 'Item Code' },
                            { key: 'additional_cost', label: 'Additional Cost' },
                            { key: 'additional_price', label: 'Additional Price' },
                            { key: 'qty', label: 'Qty' },
                        ]}
                        rows={variants}
                    />
                </div>
            )}

            {!loading && showCost && warehouseRows.length > 0 && (
                <div className="mt-4">
                    <h6 className="mb-2">Warehouse Quantity</h6>
                    <DetailTable
                        columns={[
                            { key: 'warehouse', label: 'Warehouse' },
                            { key: 'batch', label: 'Batch No' },
                            { key: 'expired', label: 'Expired Date' },
                            { key: 'qty', label: 'Quantity' },
                            { key: 'imei', label: 'IMEI / Serial' },
                        ]}
                        rows={warehouseRows.map((item) => ({
                            ...item,
                            imei: String(item.imei || 'N/A').split(',').join(', '),
                        }))}
                    />
                </div>
            )}

            {!loading && showCost && variantWarehouseRows.length > 0 && (
                <div className="mt-4">
                    <h6 className="mb-2">Warehouse quantity of product variants</h6>
                    <DetailTable
                        columns={[
                            { key: 'warehouse', label: 'Warehouse' },
                            { key: 'variant', label: 'Variant' },
                            { key: 'qty', label: 'Quantity' },
                        ]}
                        rows={variantWarehouseRows}
                    />
                </div>
            )}
        </Modal>
    );
}
