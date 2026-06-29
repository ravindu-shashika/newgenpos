import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    PageLayout,
    FormRow,
    FormSection,
    FormField,
    SelectInput,
    TextInput,
    TextareaInput,
    NumberInput,
    Toast,
    useToast,
    Modal,
} from '../../../components/ui';
import { api } from '../../../services';

let lineId = 1;

function parseLimsUnits(d) {
    if (Array.isArray(d?.units) && d.units.length) return d.units;
    const names = (typeof d?.[6] === 'string' ? d[6] : '').split(',').filter(Boolean);
    const operators = (typeof d?.[7] === 'string' ? d[7] : '').split(',').filter(Boolean);
    const values = (typeof d?.[8] === 'string' ? d[8] : '').split(',').filter(Boolean);
    return names.map((name, i) => ({
        name: String(name).trim(),
        operator: operators[i] || '*',
        operation_value: parseFloat(values[i]) || 1,
    }));
}

function displayCostFromBase(baseCost, unit) {
    const base = parseFloat(baseCost) || 0;
    const op = unit?.operator || '*';
    const val = parseFloat(unit?.operation_value) || 1;
    return op === '*' ? base * val : base / val;
}

function baseCostFromDisplay(displayCost, unit) {
    const display = parseFloat(displayCost) || 0;
    const op = unit?.operator || '*';
    const val = parseFloat(unit?.operation_value) || 1;
    return op === '*' ? display / val : display * val;
}

function calcPriceFromMargin(cost, margin, marginType) {
    const c = parseFloat(cost) || 0;
    const m = parseFloat(margin) || 0;
    if (marginType === 'flat') return c + m;
    return c + (c * m) / 100;
}

function calcMarginFromPrice(cost, price, marginType) {
    const c = parseFloat(cost) || 0;
    const p = parseFloat(price) || 0;
    if (c <= 0) return 0;
    if (marginType === 'flat') return p - c;
    return ((p - c) / c) * 100;
}

function calcLineTotals(line, taxMethod = 1) {
    const qty = parseFloat(line.qty) || 0;
    const netUnitCost = parseFloat(line.net_unit_cost) || 0;
    const discount = parseFloat(line.discount) || 0;
    const rate = parseFloat(line.tax_rate) || 0;
    if (taxMethod === 2) {
        const subTotalUnit = netUnitCost * (1 + rate / 100);
        const tax = (subTotalUnit - netUnitCost) * qty;
        return { subtotal: subTotalUnit * qty, tax };
    }
    const base = qty * netUnitCost;
    const tax = ((base - discount) * rate) / 100;
    return { subtotal: base - discount + tax, tax };
}

function calcLine(line) {
    const { subtotal, tax } = calcLineTotals(line, line.tax_method || 1);
    return { subtotal, tax };
}

function marginTypeLabel(type) {
    return type === 'flat' ? 'Flat' : 'Percentage (%)';
}

function receivedForStatus(qty, status, current) {
    const q = parseFloat(qty) || 0;
    if (status === 1) return q;
    if (status === 2) return current ?? q;
    if (status === 3 || status === 4) return 0;
    return q;
}

function unitCostFromNet(netCost, taxRate) {
    const net = parseFloat(netCost) || 0;
    const rate = parseFloat(taxRate) || 0;
    return net + (net * rate) / 100;
}

function formatDateForInput(value) {
    if (value == null || value === '') return '';
    const raw = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    if (/^\d{4}-\d{2}-\d{2}[ T]/.test(raw)) return raw.slice(0, 10);
    const parsed = Date.parse(raw);
    if (!Number.isNaN(parsed)) {
        return new Date(parsed).toISOString().slice(0, 10);
    }
    const dmy = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (dmy) {
        return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
    }
    return '';
}

export default function PurchaseForm() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const duplicateFrom = searchParams.get('duplicate_from');
    const isEdit = Boolean(id);
    const navigate = useNavigate();
    const { toast, showToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [meta, setMeta] = useState(null);
    const [productSearch, setProductSearch] = useState('');
    const [searchHits, setSearchHits] = useState([]);
    const [showHits, setShowHits] = useState(false);
    const [variantPicker, setVariantPicker] = useState({
        open: false,
        product: null,
        variants: [],
        loading: false,
        filter: '',
    });
    const [lineEditModal, setLineEditModal] = useState({
        open: false,
        loading: false,
        lineId: null,
        title: '',
        draft: null,
        units: [],
        base_unit_cost: 0,
        tax_method: 1,
    });

    const [header, setHeader] = useState({
        reference_no: '',
        created_at: new Date().toISOString().slice(0, 10),
        warehouse_id: '',
        supplier_id: '',
        status: 1,
        currency_id: '',
        exchange_rate: 1,
        order_tax_rate: 0,
        order_discount: 0,
        shipping_cost: 0,
        note: '',
        paid_amount: 0,
        payment_status: 1,
        paid_by_id: '1',
        account_id: '',
        paying_amount: '',
        payment_amount: '',
        cheque_no: '',
        payment_note: '',
        pay_term_no: '',
        pay_term_period: 'days',
    });
    const [lines, setLines] = useState([]);

    const mapEditLines = (existing) =>
        (existing || []).map((l) => {
            const qty = parseFloat(l.qty) || 0;
            const unitDiscount = qty > 0 ? (parseFloat(l.discount) || 0) / qty : 0;
            const netUnitCost = parseFloat(l.net_unit_cost) || 0;
            const isBatch = Boolean(l.is_batch);
            return {
                _id: lineId++,
                product_id: l.product_id,
                code: l.code,
                name: l.name,
                is_variant: Boolean((l.name || '').includes('(')),
                qty: l.qty,
                recieved: l.recieved,
                purchase_unit: l.purchase_unit || '',
                purchase_unit_id: l.purchase_unit_id || null,
                net_unit_cost: l.net_unit_cost,
                net_unit_margin: l.net_unit_margin ?? 0,
                net_unit_margin_type: l.net_unit_margin_type || 'percentage',
                net_unit_price: l.net_unit_price ?? 0,
                discount: l.discount || 0,
                unit_discount: unitDiscount,
                base_unit_cost: netUnitCost + unitDiscount,
                units: [],
                tax_rate: l.tax_rate || 0,
                tax_name: l.tax_name || 'No Tax',
                tax_method: 1,
                tax: l.tax || 0,
                subtotal: l.subtotal,
                is_batch: isBatch,
                product_batch_id: isBatch ? (l.product_batch_id || null) : null,
                batch_no: isBatch ? (l.batch_no || '') : '',
                expired_date: isBatch ? formatDateForInput(l.expired_date) : '',
            };
        });

    const loadForm = useCallback(async () => {
        setLoading(true);
        try {
            if (isEdit) {
                const res = await api.get(`purchases/${id}/edit`);
                const { purchase, lines: existing, meta: m } = res.data;
                setMeta(m);
                setHeader({
                    reference_no: purchase.reference_no,
                    created_at: purchase.created_at,
                    warehouse_id: String(purchase.warehouse_id || ''),
                    supplier_id: purchase.supplier_id ? String(purchase.supplier_id) : '',
                    status: purchase.status,
                    currency_id: String(purchase.currency_id || ''),
                    exchange_rate: purchase.exchange_rate || 1,
                    order_tax_rate: purchase.order_tax_rate || 0,
                    order_discount: purchase.order_discount || 0,
                    shipping_cost: purchase.shipping_cost || 0,
                    note: purchase.note || '',
                    paid_amount: purchase.paid_amount || 0,
                    pay_term_no: purchase.pay_term_no || '',
                    pay_term_period: purchase.pay_term_period || 'days',
                });
                setLines(mapEditLines(existing));
            } else if (duplicateFrom) {
                const res = await api.get(`purchases/duplicate/${duplicateFrom}`);
                const { purchase, lines: existing, meta: m } = res.data;
                setMeta(m);
                setHeader((h) => ({
                    ...h,
                    reference_no: purchase.reference_no || m.reference_no || h.reference_no,
                    created_at: purchase.created_at || h.created_at,
                    warehouse_id: String(purchase.warehouse_id || ''),
                    supplier_id: purchase.supplier_id ? String(purchase.supplier_id) : '',
                    status: purchase.status ?? h.status,
                    currency_id: String(purchase.currency_id || m.default_currency_id || ''),
                    exchange_rate: purchase.exchange_rate || m.default_exchange_rate || 1,
                    order_tax_rate: purchase.order_tax_rate || 0,
                    order_discount: purchase.order_discount || 0,
                    shipping_cost: purchase.shipping_cost || 0,
                    note: purchase.note || '',
                    pay_term_no: purchase.pay_term_no || '',
                    pay_term_period: purchase.pay_term_period || 'days',
                    account_id: m.accounts?.find((a) => a.is_default)?.id
                        ? String(m.accounts.find((a) => a.is_default).id)
                        : (m.accounts?.[0]?.id ? String(m.accounts[0].id) : ''),
                }));
                setLines(mapEditLines(existing));
            } else {
                const res = await api.get('purchases/create');
                const m = res.data;
                setMeta(m);
                setHeader((h) => ({
                    ...h,
                    reference_no: m.reference_no || h.reference_no,
                    currency_id: m.default_currency_id ? String(m.default_currency_id) : '',
                    exchange_rate: m.default_exchange_rate || 1,
                    warehouse_id: m.warehouses?.[0]?.id ? String(m.warehouses[0].id) : '',
                    account_id: m.accounts?.find((a) => a.is_default)?.id
                        ? String(m.accounts.find((a) => a.is_default).id)
                        : (m.accounts?.[0]?.id ? String(m.accounts[0].id) : ''),
                }));
            }
        } catch (err) {
            showToast(err?.message || 'Failed to load form.', 'error');
        } finally {
            setLoading(false);
        }
    }, [id, isEdit, duplicateFrom]);

    useEffect(() => {
        loadForm();
    }, [loadForm]);

    useEffect(() => {
        const term = productSearch.trim();
        if (term.length < 3 || /https?:\/\//i.test(term) || /\bapi\.js\b/i.test(term)) {
            setSearchHits([]);
            return;
        }
        const t = setTimeout(async () => {
            try {
                const res = await api.get(`purchases/product-search?term=${encodeURIComponent(term)}`);
                const hits = res.data?.data ?? res.data;
                setSearchHits(Array.isArray(hits) ? hits : []);
            } catch {
                setSearchHits([]);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [productSearch]);

    const totals = useMemo(() => {
        let totalCost = 0;
        let totalTax = 0;
        const updated = lines.map((line) => {
            const { subtotal, tax } = calcLine(line);
            totalCost += subtotal;
            totalTax += tax;
            return { ...line, tax, subtotal };
        });
        const orderTaxRate = parseFloat(header.order_tax_rate) || 0;
        const orderTax = (totalCost * orderTaxRate) / 100;
        const orderDiscount = parseFloat(header.order_discount) || 0;
        const shipping = parseFloat(header.shipping_cost) || 0;
        const grandTotal = totalCost + orderTax + shipping - orderDiscount;
        return { updated, totalCost, totalTax, orderTax, grandTotal };
    }, [lines, header.order_tax_rate, header.order_discount, header.shipping_cost]);

    const hasBatchLines = useMemo(() => lines.some((l) => l.is_batch), [lines]);

    const filteredVariants = useMemo(() => {
        const q = variantPicker.filter.trim().toLowerCase();
        if (!q) return variantPicker.variants;
        return variantPicker.variants.filter(
            (v) =>
                (v.item_code || '').toLowerCase().includes(q) ||
                (v.variant_name || '').toLowerCase().includes(q) ||
                (v.name || '').toLowerCase().includes(q)
        );
    }, [variantPicker.variants, variantPicker.filter]);

    const addedVariantsInPicker = useMemo(() => {
        if (!variantPicker.product) return new Map();
        const map = new Map();
        lines
            .filter((l) => l.product_id === variantPicker.product.id)
            .forEach((l) => {
                map.set(l.code, l);
            });
        return map;
    }, [lines, variantPicker.product]);

    const closeVariantPicker = () => {
        setVariantPicker({ open: false, product: null, variants: [], loading: false, filter: '' });
    };

    const fetchLimsDetails = async (code, name, defaults) => {
        let cost = parseFloat(defaults.cost) || 0;
        let taxRate = parseFloat(defaults.tax_rate) || 0;
        let taxName = defaults.tax_name || 'No Tax';
        let taxMethod = defaults.tax_method || 1;
        let margin = parseFloat(defaults.profit_margin) || 0;
        let marginType = defaults.profit_margin_type || 'percentage';
        let price = parseFloat(defaults.price) || 0;
        let purchaseUnit = defaults.purchase_unit || '';
        let purchaseUnitId = defaults.purchase_unit_id || null;
        let units = defaults.units || [];
        let isImei = Boolean(defaults.is_imei);
        let isBatch = Boolean(defaults.is_batch);
        let batchNo = defaults.batch_no || '';
        let productBatchId = defaults.product_batch_id || null;
        let expiredDate = defaults.expired_date || '';

        try {
            const limsData = `${code}|${name}`;
            const res = await api.get(
                `purchases/lims_product_search?data=${encodeURIComponent(limsData)}`
            );
            const d = res.data?.data ?? res.data;
            if (Array.isArray(d) || (d != null && typeof d === 'object')) {
                cost = parseFloat(d[2] ?? d.cost) || cost;
                taxRate = parseFloat(d.tax_rate ?? d[3]) || taxRate;
                taxName = d.tax_name ?? d[4] ?? taxName;
                taxMethod = parseInt(d.tax_method ?? d[12] ?? taxMethod, 10) || 1;
                margin = parseFloat(d.profit_margin) || margin;
                marginType = d.profit_margin_type || marginType;
                price = parseFloat(d.product_price ?? d.price) || price;
                units = parseLimsUnits(d);
                isImei = Boolean(d.is_imei ?? d[13]);
                isBatch = Boolean(d.is_batch ?? d[10]);
                batchNo = d.batch_no ?? batchNo;
                productBatchId = d.product_batch_id ?? productBatchId;
                expiredDate = formatDateForInput(d.expired_date ?? expiredDate);
                if (d.purchase_unit) {
                    purchaseUnit = d.purchase_unit;
                } else if (typeof d[6] === 'string' && d[6]) {
                    purchaseUnit = d[6].split(',')[0].trim() || purchaseUnit;
                }
                if (d.purchase_unit_id) {
                    purchaseUnitId = d.purchase_unit_id;
                }
            }
        } catch (err) {
            if (err?.status === 404) {
                showToast(err?.message || 'Product details not found; using defaults.', 'warning');
            }
        }

        return {
            cost,
            taxRate,
            taxName,
            taxMethod,
            margin,
            marginType,
            price,
            purchaseUnit,
            purchaseUnitId,
            units,
            isImei,
            isBatch,
            batchNo,
            productBatchId,
            expiredDate,
        };
    };

    const resolveBatchForLine = useCallback(
        async (line) => {
            if (!line.is_batch) return line;
            try {
                const params = new URLSearchParams({
                    product_id: String(line.product_id),
                    net_unit_cost: String(line.net_unit_cost ?? 0),
                    net_unit_price: String(line.net_unit_price ?? 0),
                });
                const res = await api.get(`purchases/suggest-batch?${params}`);
                const data = res.data?.data ?? res.data;
                return {
                    ...line,
                    batch_no: data.batch_no || '',
                    product_batch_id: data.product_batch_id || null,
                    is_new_batch: Boolean(data.is_new_batch),
                    expired_date: line.expired_date || formatDateForInput(data.expired_date) || '',
                };
            } catch {
                return line;
            }
        },
        []
    );

    const appendLine = async (product, details) => {
        const qty = 1;
        const recieved = receivedForStatus(qty, header.status, qty);
        const line = {
            _id: lineId++,
            product_id: product.id,
            code: product.code,
            name: product.name,
            variant_id: product.variant_id || null,
            is_variant: Boolean(product.variant_id),
            qty,
            recieved,
            purchase_unit: details.purchaseUnit,
            purchase_unit_id: details.purchaseUnitId,
            base_unit_cost: details.cost,
            units: details.units || [],
            unit_discount: 0,
            net_unit_cost: details.cost,
            net_unit_margin: details.margin,
            net_unit_margin_type: details.marginType,
            net_unit_price: details.price,
            discount: 0,
            tax_rate: details.taxRate,
            tax_name: details.taxName,
            tax_method: details.taxMethod,
            is_imei: details.isImei,
            is_batch: Boolean(details.isBatch),
            product_batch_id: details.isBatch ? (details.productBatchId || null) : null,
            batch_no: details.isBatch ? (details.batchNo || '') : '',
            expired_date: details.isBatch ? formatDateForInput(details.expiredDate) : '',
            catalog_cost: details.cost,
            catalog_price: details.price,
            tax: 0,
            subtotal: details.cost,
        };
        const { subtotal, tax } = calcLine(line);
        let nextLine = { ...line, tax, subtotal };
        if (details.isBatch) {
            nextLine = await resolveBatchForLine(nextLine);
        }
        setLines((prev) => [...prev, nextLine]);
    };

    const incrementLine = (productId, code) => {
        setLines((prev) =>
            prev.map((l) => {
                if (l.product_id !== productId || l.code !== code) return l;
                const qty = Number(l.qty) + 1;
                const next = {
                    ...l,
                    qty,
                    recieved: receivedForStatus(qty, header.status, Number(l.recieved) + 1),
                };
                const { subtotal, tax } = calcLine(next);
                return { ...next, subtotal, tax };
            })
        );
    };

    const openVariantPicker = async (product, filter = '') => {
        setProductSearch('');
        setShowHits(false);
        setVariantPicker({ open: true, product, variants: [], loading: true, filter });
        try {
            const res = await api.get(`purchases/products/${product.id}/variants`);
            const data = res.data?.data ?? res.data;
            setVariantPicker({
                open: true,
                product: data.product || product,
                variants: data.variants || [],
                loading: false,
                filter: filter || '',
            });
        } catch (err) {
            showToast(err?.message || 'Failed to load variants.', 'error');
            setVariantPicker({ open: false, product: null, variants: [], loading: false, filter: '' });
        }
    };

    const handleSearchSelect = (product) => {
        if (product.is_variant && product.variant_count > 0) {
            openVariantPicker(product, product.matched_variant_code || '');
            return;
        }
        addProduct(product);
    };

    const addVariantFromPicker = async (variant) => {
        const parent = variantPicker.product;
        if (!parent) return;

        const existing = lines.find((l) => l.product_id === parent.id && l.code === variant.item_code);
        if (existing) {
            incrementLine(parent.id, variant.item_code);
            showToast(`Qty updated for ${variant.item_code}.`, 'success');
            return;
        }

        const defaults = {
            cost: variant.cost,
            tax_rate: variant.tax_rate,
            profit_margin: variant.profit_margin,
            profit_margin_type: variant.profit_margin_type,
            price: variant.price,
            purchase_unit_id: parent.purchase_unit_id,
            is_batch: parent.is_batch,
        };
        const details = await fetchLimsDetails(variant.item_code, variant.name, defaults);
        appendLine(
            {
                id: parent.id,
                code: variant.item_code,
                name: variant.name,
                variant_id: variant.variant_id,
            },
            details
        );
        showToast(`${variant.item_code} added to purchase.`, 'success');
    };

    const addProduct = async (product) => {
        setProductSearch('');
        setShowHits(false);

        const existing = lines.find((l) => l.product_id === product.id && l.code === product.code);
        if (existing) {
            incrementLine(product.id, product.code);
            return;
        }

        const details = await fetchLimsDetails(product.code, product.name, {
            cost: product.cost,
            tax_rate: product.tax_rate,
            profit_margin: product.profit_margin,
            profit_margin_type: product.profit_margin_type,
            price: product.price,
            purchase_unit_id: product.purchase_unit_id,
            is_batch: product.is_batch,
        });
        appendLine(product, details);
    };

    const updateLine = (lineIdKey, field, value) => {
        setLines((prev) =>
            prev.map((l) => {
                if (l._id !== lineIdKey) return l;
                const next = { ...l, [field]: value };
                if (field === 'qty') {
                    next.recieved = receivedForStatus(value, header.status, l.recieved);
                    const unitDiscount = parseFloat(l.unit_discount);
                    if (Number.isFinite(unitDiscount)) {
                        next.discount = unitDiscount * (parseFloat(value) || 0);
                    }
                }
                const { subtotal, tax } = calcLine(next);
                return { ...next, subtotal, tax };
            })
        );
    };

    const handleStatusChange = (status) => {
        const num = Number(status);
        setHeader((h) => ({ ...h, status: num }));
        setLines((prev) =>
            prev.map((l) => {
                const next = {
                    ...l,
                    recieved: receivedForStatus(l.qty, num, l.recieved),
                };
                const { subtotal, tax } = calcLine(next);
                return { ...next, subtotal, tax };
            })
        );
    };

    const handleSupplierChange = (supplierId) => {
        const supplier = meta?.suppliers?.find((s) => String(s.id) === supplierId);
        setHeader((h) => ({
            ...h,
            supplier_id: supplierId,
            pay_term_no: supplier?.pay_term_no ?? h.pay_term_no,
            pay_term_period: supplier?.pay_term_period ?? h.pay_term_period,
        }));
    };

    const removeLine = (lineIdKey) => setLines((prev) => prev.filter((l) => l._id !== lineIdKey));

    const closeLineEditor = () => {
        setLineEditModal({
            open: false,
            loading: false,
            lineId: null,
            title: '',
            draft: null,
            units: [],
            base_unit_cost: 0,
            tax_method: 1,
        });
    };

    const patchLineEditDraft = (patch) => {
        setLineEditModal((prev) => {
            if (!prev.draft) return prev;
            const draft = { ...prev.draft, ...patch };
            const displayCost = parseFloat(draft.unit_cost) || 0;

            if (patch.profit_margin != null && patch.product_price == null) {
                draft.product_price = calcPriceFromMargin(
                    displayCost,
                    draft.profit_margin,
                    draft.profit_margin_type
                ).toFixed(2);
            } else if (patch.product_price != null && patch.profit_margin == null) {
                draft.profit_margin = calcMarginFromPrice(
                    displayCost,
                    draft.product_price,
                    draft.profit_margin_type
                ).toFixed(2);
            } else if (patch.unit_cost != null && draft.profit_margin !== '') {
                draft.product_price = calcPriceFromMargin(
                    displayCost,
                    draft.profit_margin,
                    draft.profit_margin_type
                ).toFixed(2);
            } else if (
                patch.profit_margin_type != null
                && displayCost > 0
                && draft.profit_margin !== ''
            ) {
                draft.product_price = calcPriceFromMargin(
                    displayCost,
                    draft.profit_margin,
                    draft.profit_margin_type
                ).toFixed(2);
            }

            return { ...prev, draft };
        });
    };

    const openLineEditor = async (line) => {
        setLineEditModal({
            open: true,
            loading: true,
            lineId: line._id,
            title: `${line.name} (${line.code})`,
            draft: null,
            units: line.units || [],
            base_unit_cost: line.base_unit_cost ?? line.net_unit_cost,
            tax_method: line.tax_method || 1,
        });

        let units = line.units || [];
        let baseCost = parseFloat(line.base_unit_cost);
        if (!Number.isFinite(baseCost)) {
            baseCost = (parseFloat(line.net_unit_cost) || 0) + (parseFloat(line.unit_discount) || 0);
        }
        let taxMethod = line.tax_method || 1;

        if (!units.length) {
            try {
                const details = await fetchLimsDetails(line.code, line.name, {
                    cost: baseCost,
                    tax_rate: line.tax_rate,
                    tax_name: line.tax_name,
                    profit_margin: line.net_unit_margin,
                    profit_margin_type: line.net_unit_margin_type,
                    price: line.net_unit_price,
                    purchase_unit_id: line.purchase_unit_id,
                });
                units = details.units || [];
                baseCost = details.cost || baseCost;
                taxMethod = details.taxMethod || taxMethod;
            } catch {
                showToast('Could not load product units.', 'warning');
            }
        }

        const unitIndex = Math.max(
            0,
            units.findIndex(
                (u) =>
                    (line.purchase_unit_id && u.id === line.purchase_unit_id)
                    || u.name === line.purchase_unit
            )
        );
        const unit = units[unitIndex] || units[0];
        const unitDiscount = parseFloat(line.unit_discount);
        const resolvedUnitDiscount = Number.isFinite(unitDiscount)
            ? unitDiscount
            : (parseFloat(line.discount) || 0) / (parseFloat(line.qty) || 1);
        const displayCost = unit
            ? displayCostFromBase(baseCost, unit)
            : (parseFloat(line.net_unit_cost) || 0) + resolvedUnitDiscount;

        setLineEditModal({
            open: true,
            loading: false,
            lineId: line._id,
            title: `${line.name} (${line.code})`,
            draft: {
                qty: line.qty,
                unit_discount: resolvedUnitDiscount,
                unit_cost: displayCost,
                profit_margin_type: line.net_unit_margin_type || 'percentage',
                profit_margin: line.net_unit_margin,
                product_price: line.net_unit_price,
                tax_rate: line.tax_rate,
                unit_index: unitIndex >= 0 ? unitIndex : 0,
            },
            units,
            base_unit_cost: baseCost,
            tax_method: taxMethod,
        });
    };

    const saveLineEditor = async () => {
        const { lineId, draft, units, tax_method: taxMethod } = lineEditModal;
        if (!draft || lineId == null) return;

        const unit = units[draft.unit_index] || units[0];
        const displayCost = parseFloat(draft.unit_cost) || 0;
        const unitDiscount = parseFloat(draft.unit_discount) || 0;

        if (unitDiscount > displayCost) {
            showToast('Invalid Discount Input!', 'error');
            return;
        }

        const qty = parseFloat(draft.qty) || 0;
        if (qty < 1) {
            showToast("Quantity can't be less than 0", 'error');
            return;
        }

        const baseCost = unit ? baseCostFromDisplay(displayCost, unit) : displayCost;
        const netUnitCost = displayCost - unitDiscount;
        const taxRate = parseFloat(draft.tax_rate) || 0;
        const discount = unitDiscount * qty;
        const taxMeta = (meta?.taxes || []).find((t) => parseFloat(t.rate) === taxRate);

        const currentLine = lines.find((l) => l._id === lineId);
        if (!currentLine) return;

        let nextLine = {
            ...currentLine,
            qty,
            recieved: receivedForStatus(qty, header.status, currentLine.recieved),
            base_unit_cost: baseCost,
            units,
            purchase_unit: unit?.name || currentLine.purchase_unit,
            purchase_unit_id: unit?.id ?? currentLine.purchase_unit_id,
            unit_discount: unitDiscount,
            net_unit_cost: netUnitCost,
            net_unit_margin: parseFloat(draft.profit_margin) || 0,
            net_unit_margin_type: draft.profit_margin_type || 'percentage',
            net_unit_price: parseFloat(draft.product_price) || 0,
            discount,
            tax_rate: taxRate,
            tax_name: taxMeta?.name || (taxRate === 0 ? 'No Tax' : currentLine.tax_name),
            tax_method: taxMethod || 1,
        };
        const { subtotal, tax } = calcLine(nextLine);
        nextLine = { ...nextLine, subtotal, tax };

        if (nextLine.is_batch) {
            nextLine = await resolveBatchForLine(nextLine);
        }

        setLines((prev) => prev.map((l) => (l._id === lineId ? nextLine : l)));
        closeLineEditor();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!header.warehouse_id) {
            showToast('Warehouse is required.', 'error');
            return;
        }
        if (!header.currency_id) {
            showToast('Currency is required.', 'error');
            return;
        }
        if (lines.length === 0) {
            showToast('Add at least one product.', 'error');
            return;
        }

        const batchLine = lines.find(
            (l) => l.is_batch && (!String(l.batch_no || '').trim() || !String(l.expired_date || '').trim())
        );
        if (batchLine) {
            showToast('Batch No and Expired Date are required for batch products.', 'error');
            return;
        }

        if (!isEdit && (header.payment_status === 3 || header.payment_status === 4)) {
            const payAmt = parseFloat(header.payment_amount) || 0;
            if (payAmt <= 0) {
                showToast('Paying amount must be greater than 0.', 'error');
                return;
            }
            if (header.payment_status === 4 && payAmt < totals.grandTotal - 0.01) {
                showToast('Paid status requires full payment amount.', 'error');
                return;
            }
        }

        const products = totals.updated.map((l) => ({
            product_id: l.product_id,
            code: l.code,
            qty: l.qty,
            recieved: l.recieved,
            purchase_unit: l.purchase_unit,
            purchase_unit_id: l.purchase_unit_id,
            net_unit_cost: l.net_unit_cost,
            unit_cost: unitCostFromNet(l.net_unit_cost, l.tax_rate),
            net_unit_margin: l.net_unit_margin,
            net_unit_margin_type: l.net_unit_margin_type,
            net_unit_price: l.net_unit_price,
            discount: l.discount,
            tax_rate: l.tax_rate,
            tax: l.tax,
            subtotal: l.subtotal,
            batch_no: l.is_batch ? (l.batch_no || '') : '',
            expired_date: l.is_batch ? (l.expired_date || '') : '',
        }));

        const payload = {
            ...header,
            warehouse_id: Number(header.warehouse_id),
            supplier_id: header.supplier_id ? Number(header.supplier_id) : null,
            status: Number(header.status),
            currency_id: Number(header.currency_id),
            exchange_rate: Number(header.exchange_rate),
            order_tax_rate: Number(header.order_tax_rate) || 0,
            order_tax: totals.orderTax,
            order_discount: Number(header.order_discount) || 0,
            shipping_cost: Number(header.shipping_cost) || 0,
            grand_total: totals.grandTotal,
            total_cost: totals.totalCost,
            total_tax: totals.totalTax,
            total_qty: products.reduce((s, p) => s + Number(p.qty), 0),
            paid_amount: isEdit ? Number(header.paid_amount) || 0 : 0,
            products,
        };

        if (!isEdit) {
            payload.payment_status = Number(header.payment_status) || 1;
            if (payload.payment_status === 3 || payload.payment_status === 4) {
                const payAmt = parseFloat(header.payment_amount) || 0;
                payload.paying_amount = [payAmt];
                payload.amount = [payAmt];
                payload.paid_by_id = [Number(header.paid_by_id) || 1];
                payload.account_id = header.account_id ? Number(header.account_id) : null;
                payload.cheque_no = header.cheque_no || null;
                payload.payment_note = header.payment_note || null;
            }
        }

        setSubmitting(true);
        try {
            if (isEdit) {
                await api.put(`purchases/${id}`, payload);
                showToast('Purchase updated.', 'success');
            } else {
                await api.post('purchases', payload);
                showToast('Purchase created.', 'success');
            }
            navigate('/purchases');
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || 'Save failed.';
            const errs = err?.response?.data?.errors;
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

    const taxOptions = [
        { value: '0', label: 'No Tax' },
        ...(meta?.taxes || []).map((t) => ({
            value: String(t.rate),
            label: t.name,
        })),
    ];
    const lineUnitOptions = (lineEditModal.units || []).map((u, index) => ({
        value: String(index),
        label: u.name,
    }));
    const marginTypeOptions = [
        { value: 'percentage', label: 'Percentage (%)' },
        { value: 'flat', label: 'Flat' },
    ];
    const minExpiryDate = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().slice(0, 10);
    }, []);

    if (loading) {
        return (
            <PageLayout title={isEdit ? 'Edit Purchase' : 'Add Purchase'}>
                <div className="p-5 text-center">Loading...</div>
            </PageLayout>
        );
    }

    const supplierOptions = [
        { value: '', label: 'Select supplier…' },
        ...(meta?.suppliers || []).map((s) => ({
            value: String(s.id),
            label: `${s.name}${s.company_name ? ` (${s.company_name})` : ''}`,
        })),
    ];
    const warehouseOptions = (meta?.warehouses || []).map((w) => ({
        value: String(w.id),
        label: w.name,
    }));
    const currencyOptions = (meta?.currencies || []).map((c) => ({
        value: String(c.id),
        label: c.code,
    }));
    const statusOptions = (meta?.status_options || []).map((s) => ({
        value: String(s.value),
        label: s.label,
    }));

    return (
        <PageLayout eyebrow="Purchase" title={isEdit ? 'Edit Purchase' : 'Add Purchase'}>
            <Toast toast={toast} />
            <form onSubmit={handleSubmit}>
                <FormSection title="Purchase information">
                    <FormRow>
                        <FormField label="Reference">
                            <TextInput
                                value={header.reference_no}
                                onChange={(e) => setHeader({ ...header, reference_no: e.target.value })}
                            />
                        </FormField>
                        <FormField label="Date">
                            <input
                                type="date"
                                className="ui-input"
                                value={header.created_at}
                                onChange={(e) => setHeader({ ...header, created_at: e.target.value })}
                            />
                        </FormField>
                        <FormField label="Warehouse" required>
                            <SelectInput
                                required
                                value={header.warehouse_id}
                                onChange={(e) => setHeader({ ...header, warehouse_id: e.target.value })}
                                options={[{ value: '', label: 'Select…' }, ...warehouseOptions]}
                            />
                        </FormField>
                        <FormField label="Supplier">
                            <SelectInput
                                value={header.supplier_id}
                                onChange={(e) => handleSupplierChange(e.target.value)}
                                options={supplierOptions}
                            />
                        </FormField>
                        <FormField label="Status">
                            <SelectInput
                                value={String(header.status)}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                options={statusOptions}
                            />
                        </FormField>
                        <FormField label="Currency" required>
                            <SelectInput
                                required
                                value={header.currency_id}
                                onChange={(e) => {
                                    const cur = meta?.currencies?.find((c) => String(c.id) === e.target.value);
                                    setHeader({
                                        ...header,
                                        currency_id: e.target.value,
                                        exchange_rate: cur?.exchange_rate ?? header.exchange_rate,
                                    });
                                }}
                                options={[{ value: '', label: 'Select…' }, ...currencyOptions]}
                            />
                        </FormField>
                        <FormField label="Exchange rate">
                            <TextInput
                                type="number"
                                step="any"
                                value={header.exchange_rate}
                                onChange={(e) => setHeader({ ...header, exchange_rate: e.target.value })}
                            />
                        </FormField>
                    </FormRow>
                </FormSection>

                <FormSection title="Products">
                    <div style={{ position: 'relative', maxWidth: 480, marginBottom: 16 }}>
                        <TextInput
                            placeholder="Search product (min 3 characters)…"
                            value={productSearch}
                            onChange={(e) => { setProductSearch(e.target.value); setShowHits(true); }}
                            onFocus={() => setShowHits(true)}
                            onBlur={() => setTimeout(() => setShowHits(false), 200)}
                        />
                        {showHits && searchHits.length > 0 && (
                            <ul className="list-group position-absolute w-100 shadow-sm" style={{ zIndex: 50 }}>
                                {searchHits.map((p) => (
                                    <li
                                        key={`${p.id}-${p.code}`}
                                        className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                                        style={{ cursor: 'pointer' }}
                                        onMouseDown={() => handleSearchSelect(p)}
                                    >
                                        <span>
                                            {p.name}{' '}
                                            <span className="text-muted">({p.code})</span>
                                        </span>
                                        {p.is_variant && p.variant_count > 0 && (
                                            <span
                                                className="badge bg-secondary"
                                                style={{ fontSize: '0.75rem' }}
                                            >
                                                {p.variant_count} variant{p.variant_count !== 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="table-responsive">
                        <table className="table table-sm table-hover">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Qty</th>
                                    {header.status === 2 && <th>Received</th>}
                                    {hasBatchLines && <th>Batch no</th>}
                                    {hasBatchLines && <th>Expired date</th>}
                                    <th>Unit cost</th>
                                    <th>Margin</th>
                                    <th>Margin type</th>
                                    <th>Price</th>
                                    <th>Discount</th>
                                    <th>Tax</th>
                                    <th>Subtotal</th>
                                    <th />
                                </tr>
                            </thead>
                            <tbody>
                                {lines.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={(header.status === 2 ? 12 : 11) + (hasBatchLines ? 2 : 0)}
                                            className="text-center text-muted py-4"
                                        >
                                            No products — search above to add
                                        </td>
                                    </tr>
                                ) : (
                                    lines.map((l) => {
                                        const { subtotal, tax } = calcLine(l);
                                        return (
                                        <tr key={l._id}>
                                            <td>
                                                <div className="d-flex align-items-start gap-1 flex-wrap">
                                                    <div>
                                                        <div className="d-flex align-items-center gap-2 flex-wrap">
                                                            <span>{l.name}</span>
                                                            {l.is_variant && (
                                                                <span className="badge bg-info text-dark" style={{ fontSize: '0.7rem' }}>
                                                                    Variant
                                                                </span>
                                                            )}
                                                        </div>
                                                        <small className="text-muted">{l.code}</small>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="btn btn-link btn-sm p-0"
                                                        title="Edit line"
                                                        onClick={() => openLineEditor(l)}
                                                    >
                                                        ✎
                                                    </button>
                                                </div>
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    className="form-control form-control-sm"
                                                    min="0"
                                                    step="any"
                                                    value={l.qty}
                                                    onChange={(e) => updateLine(l._id, 'qty', e.target.value)}
                                                    style={{ maxWidth: 72 }}
                                                />
                                            </td>
                                            {header.status === 2 && (
                                                <td>
                                                    <input
                                                        type="number"
                                                        className="form-control form-control-sm"
                                                        min="0"
                                                        step="any"
                                                        value={l.recieved}
                                                        onChange={(e) => updateLine(l._id, 'recieved', e.target.value)}
                                                        style={{ maxWidth: 72 }}
                                                    />
                                                </td>
                                            )}
                                            {hasBatchLines && (
                                                <td>
                                                    {l.is_batch ? (
                                                        <input
                                                            type="text"
                                                            className="form-control form-control-sm bg-light"
                                                            value={l.batch_no || ''}
                                                            placeholder="Auto batch"
                                                            readOnly
                                                            title="Batch number is auto-assigned. It increments when unit cost or sale price changes."
                                                        />
                                                    ) : (
                                                        <span className="text-muted">—</span>
                                                    )}
                                                </td>
                                            )}
                                            {hasBatchLines && (
                                                <td>
                                                    {l.is_batch ? (
                                                        <input
                                                            type="date"
                                                            className="form-control form-control-sm"
                                                            value={l.expired_date || ''}
                                                            min={minExpiryDate}
                                                            required
                                                            onChange={(e) => updateLine(l._id, 'expired_date', e.target.value)}
                                                        />
                                                    ) : (
                                                        <span className="text-muted">—</span>
                                                    )}
                                                </td>
                                            )}
                                            <td>{Number(l.net_unit_cost).toFixed(2)}</td>
                                            <td>{Number(l.net_unit_margin).toFixed(2)}</td>
                                            <td>{marginTypeLabel(l.net_unit_margin_type)}</td>
                                            <td>{Number(l.net_unit_price).toFixed(2)}</td>
                                            <td>{Number(l.discount).toFixed(2)}</td>
                                            <td>{Number(tax).toFixed(2)}</td>
                                            <td>{Number(subtotal).toFixed(2)}</td>
                                            <td>
                                                <button type="button" className="btn btn-sm btn-danger" onClick={() => removeLine(l._id)}>
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                        );
                                    })
                                )}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <th
                                        colSpan={(header.status === 2 ? 12 : 11) + (hasBatchLines ? 2 : 0) - 2}
                                        className="text-end"
                                    >
                                        Grand total
                                    </th>
                                    <th colSpan={2}>{totals.grandTotal.toFixed(2)}</th>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </FormSection>

                <FormSection title="Totals & note">
                    <FormRow>
                        <FormField label="Order tax %">
                            <TextInput
                                type="number"
                                step="any"
                                value={header.order_tax_rate}
                                onChange={(e) => setHeader({ ...header, order_tax_rate: e.target.value })}
                            />
                        </FormField>
                        <FormField label="Order discount">
                            <TextInput
                                type="number"
                                step="any"
                                value={header.order_discount}
                                onChange={(e) => setHeader({ ...header, order_discount: e.target.value })}
                            />
                        </FormField>
                        <FormField label="Shipping cost">
                            <TextInput
                                type="number"
                                step="any"
                                value={header.shipping_cost}
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
                </FormSection>

                {!isEdit && (
                    <FormSection title="Payment">
                        <FormRow>
                            <FormField label="Payment status">
                                <SelectInput
                                    value={String(header.payment_status)}
                                    onChange={(e) => setHeader({ ...header, payment_status: Number(e.target.value) })}
                                    options={[
                                        { value: '1', label: 'Due' },
                                        { value: '3', label: 'Partial' },
                                        { value: '4', label: 'Paid' },
                                    ]}
                                />
                            </FormField>
                            {(header.payment_status === 3 || header.payment_status === 4) && (
                                <>
                                    <FormField label="Account">
                                        <SelectInput
                                            value={header.account_id}
                                            onChange={(e) => setHeader({ ...header, account_id: e.target.value })}
                                            options={[
                                                { value: '', label: 'Select account…' },
                                                ...(meta?.accounts || []).map((a) => ({
                                                    value: String(a.id),
                                                    label: a.name,
                                                })),
                                            ]}
                                        />
                                    </FormField>
                                    <FormField label="Paid by">
                                        <SelectInput
                                            value={header.paid_by_id}
                                            onChange={(e) => setHeader({ ...header, paid_by_id: e.target.value })}
                                            options={[
                                                { value: '1', label: 'Cash' },
                                                { value: '3', label: 'Credit Card' },
                                                { value: '4', label: 'Cheque' },
                                            ]}
                                        />
                                    </FormField>
                                    <FormField label="Paying amount">
                                        <TextInput
                                            type="number"
                                            step="any"
                                            value={header.payment_amount}
                                            onChange={(e) => setHeader({ ...header, payment_amount: e.target.value })}
                                        />
                                    </FormField>
                                    {header.paid_by_id === '4' && (
                                        <FormField label="Cheque no">
                                            <TextInput
                                                value={header.cheque_no}
                                                onChange={(e) => setHeader({ ...header, cheque_no: e.target.value })}
                                            />
                                        </FormField>
                                    )}
                                </>
                            )}
                        </FormRow>
                    </FormSection>
                )}

                <div className="d-flex gap-2">
                    <button type="submit" className="ui-btn primary" disabled={submitting}>
                        {submitting ? 'Saving…' : isEdit ? 'Update' : 'Submit'}
                    </button>
                    <button type="button" className="ui-btn" onClick={() => navigate('/purchases')}>
                        Cancel
                    </button>
                </div>
            </form>

            <Modal
                isOpen={lineEditModal.open}
                title={lineEditModal.title || 'Edit product'}
                onClose={closeLineEditor}
                footer={(
                    <>
                        <button type="button" className="ui-btn" onClick={closeLineEditor}>
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="ui-btn primary"
                            disabled={lineEditModal.loading || !lineEditModal.draft}
                            onClick={saveLineEditor}
                        >
                            Update
                        </button>
                    </>
                )}
            >
                {lineEditModal.loading || !lineEditModal.draft ? (
                    <p className="text-center text-muted py-4">Loading product details…</p>
                ) : (
                    <FormRow>
                        <FormField label="Quantity">
                            <NumberInput
                                min="1"
                                step="1"
                                value={lineEditModal.draft.qty}
                                onChange={(e) => patchLineEditDraft({ qty: e.target.value })}
                            />
                        </FormField>
                        <FormField label="Unit discount">
                            <NumberInput
                                step="0.01"
                                min="0"
                                value={lineEditModal.draft.unit_discount}
                                onChange={(e) => patchLineEditDraft({ unit_discount: e.target.value })}
                            />
                        </FormField>
                        <FormField label="Unit cost">
                            <NumberInput
                                step="0.01"
                                min="0"
                                value={lineEditModal.draft.unit_cost}
                                onChange={(e) => patchLineEditDraft({ unit_cost: e.target.value })}
                            />
                        </FormField>
                        <FormField label="Profit margin type">
                            <SelectInput
                                value={lineEditModal.draft.profit_margin_type}
                                onChange={(e) => patchLineEditDraft({ profit_margin_type: e.target.value })}
                                options={marginTypeOptions}
                            />
                        </FormField>
                        <FormField label="Profit margin">
                            <NumberInput
                                step="0.01"
                                value={lineEditModal.draft.profit_margin}
                                onChange={(e) => patchLineEditDraft({ profit_margin: e.target.value })}
                            />
                        </FormField>
                        <FormField label="Product price">
                            <NumberInput
                                step="0.01"
                                min="0"
                                value={lineEditModal.draft.product_price}
                                onChange={(e) => patchLineEditDraft({ product_price: e.target.value })}
                            />
                        </FormField>
                        <FormField label="Tax rate">
                            <SelectInput
                                value={String(lineEditModal.draft.tax_rate ?? 0)}
                                onChange={(e) => patchLineEditDraft({ tax_rate: e.target.value })}
                                options={taxOptions}
                            />
                        </FormField>
                        <FormField label="Product unit">
                            <SelectInput
                                value={String(lineEditModal.draft.unit_index ?? 0)}
                                onChange={(e) => {
                                    const unitIndex = Number(e.target.value);
                                    const unit = lineEditModal.units[unitIndex];
                                    const displayCost = unit
                                        ? displayCostFromBase(lineEditModal.base_unit_cost, unit)
                                        : lineEditModal.draft.unit_cost;
                                    const productPrice = calcPriceFromMargin(
                                        displayCost,
                                        lineEditModal.draft.profit_margin,
                                        lineEditModal.draft.profit_margin_type
                                    ).toFixed(2);
                                    patchLineEditDraft({
                                        unit_index: unitIndex,
                                        unit_cost: displayCost,
                                        product_price: productPrice,
                                    });
                                }}
                                options={lineUnitOptions.length ? lineUnitOptions : [{ value: '0', label: 'Piece' }]}
                            />
                        </FormField>
                    </FormRow>
                )}
            </Modal>

            <Modal
                isOpen={variantPicker.open}
                title={variantPicker.product ? `Select variant — ${variantPicker.product.name}` : 'Select variant'}
                onClose={closeVariantPicker}
            >
                {variantPicker.loading ? (
                    <p className="text-center text-muted py-4">Loading variants…</p>
                ) : (
                    <>
                        <div style={{ marginBottom: 12 }}>
                            <TextInput
                                placeholder="Filter by variant code or name…"
                                value={variantPicker.filter}
                                onChange={(e) => setVariantPicker((s) => ({ ...s, filter: e.target.value }))}
                            />
                        </div>
                        {addedVariantsInPicker.size > 0 && (
                            <p className="text-muted small mb-2">
                                {addedVariantsInPicker.size} variant{addedVariantsInPicker.size !== 1 ? 's' : ''} added to grid — select more or click Done.
                            </p>
                        )}
                        <div className="table-responsive">
                            <table className="table table-sm table-hover">
                                <thead>
                                    <tr>
                                        <th>Code</th>
                                        <th>Variant</th>
                                        <th>Stock</th>
                                        <th>Cost</th>
                                        <th>Status</th>
                                        <th />
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredVariants.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center text-muted py-3">
                                                No variants found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredVariants.map((v) => {
                                            const inGrid = addedVariantsInPicker.get(v.item_code);
                                            return (
                                                <tr
                                                    key={v.id}
                                                    className={inGrid ? 'table-success' : undefined}
                                                >
                                                    <td><code>{v.item_code}</code></td>
                                                    <td>{v.variant_name}</td>
                                                    <td>{Number(v.qty).toFixed(2)}</td>
                                                    <td>{Number(v.cost).toFixed(2)}</td>
                                                    <td>
                                                        {inGrid ? (
                                                            <span className="badge bg-success">
                                                                In grid · qty {inGrid.qty}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted">—</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <button
                                                            type="button"
                                                            className={`btn btn-sm ${inGrid ? 'btn-outline-success' : 'btn-primary'}`}
                                                            onClick={() => addVariantFromPicker(v)}
                                                        >
                                                            {inGrid ? '+ Qty' : 'Add'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="d-flex justify-content-end mt-3">
                            <button type="button" className="ui-btn primary" onClick={closeVariantPicker}>
                                Done
                            </button>
                        </div>
                    </>
                )}
            </Modal>
        </PageLayout>
    );
}
