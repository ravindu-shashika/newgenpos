import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    SelectInput,
    NumberInput,
    Toast,
    useToast,
    FormField,
    Modal,
} from '../../../components/ui';
import { api, auth, defaultPath, posApi } from '../../../services';
import authStore from '../../../stores/authStore';
import usePermissions from '../../../stores/usePermissions';
import {
    buildLineFromLookup,
    buildLineFromDraft,
    buildPosFormData,
    calcPosTotals,
    mergeOrAppendLine,
    recalcPosLine,
    resetLineIdCounter,
    round,
} from './posCartHelpers';
import {
    applyCoupon,
    brandImageUrl,
    categoryImageUrl,
    resolvePaymentButtons,
} from './posHelpers';
import './pos.css';

function productImageUrl(meta, image) {
    const base = meta?.product_image_base || '';
    const fallback = meta?.default_product_image || '';
    if (!image) return fallback;
    if (String(image).startsWith('http')) return image;
    return `${base}/${image}`;
}

function appHashUrl(path) {
    if (typeof window === 'undefined') return `#${path}`;
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${window.location.origin}${window.location.pathname}#${normalized}`;
}

function dashboardUrl() {
    return appHashUrl('/dashboard');
}

function PosClock() {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);
    return (
        <span>
            {now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            {' · '}
            {now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
        </span>
    );
}

export default function PosPage() {
    const { draftId } = useParams();
    const { toast, showToast } = useToast();
    const salesPerms = usePermissions('sales');
    const authPerms = authStore.getPermissions();
    const canUse = salesPerms.canAdd || authPerms.includes('sales-add');

    const user = authStore.getUser();
    const searchRef = useRef(null);
    const searchTimer = useRef(null);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [meta, setMeta] = useState(null);
    const [customerGroupRate, setCustomerGroupRate] = useState(0);
    const [lines, setLines] = useState([]);
    const [products, setProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [productFilter, setProductFilter] = useState({ type: 'featured', id: 1 });
    const [nextProductPage, setNextProductPage] = useState(null);
    const [searchCode, setSearchCode] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchOpen, setSearchOpen] = useState(false);
    const [draftSaleId, setDraftSaleId] = useState(draftId || null);
    const [recentSales, setRecentSales] = useState([]);
    const [recentDrafts, setRecentDrafts] = useState([]);

    const [filterPanel, setFilterPanel] = useState(null);
    const [filterSearch, setFilterSearch] = useState('');

    const [paymentModal, setPaymentModal] = useState(null);
    const [cashReceived, setCashReceived] = useState('');
    const [printAfterSale, setPrintAfterSale] = useState(true);
    const [couponModal, setCouponModal] = useState(false);
    const [couponCodeInput, setCouponCodeInput] = useState('');
    const [discountModal, setDiscountModal] = useState(false);
    const [shippingModal, setShippingModal] = useState(false);
    const [recentModal, setRecentModal] = useState(false);
    const [discountDraft, setDiscountDraft] = useState({ type: 'Flat', value: 0 });
    const [shippingDraft, setShippingDraft] = useState(0);

    const [header, setHeader] = useState({
        created_at: new Date().toISOString().slice(0, 10),
        customer_id: '',
        warehouse_id: '',
        biller_id: '',
        currency_id: '',
        exchange_rate: 1,
        order_tax_rate: '0',
        order_discount: 0,
        order_discount_type: 'Flat',
        order_discount_value: 0,
        shipping_cost: 0,
        coupon_id: '',
        coupon_discount: 0,
        coupon_code: '',
        sale_note: '',
        staff_note: '',
        account_id: '',
    });

    const decimal = meta?.decimal ?? 2;
    const totals = useMemo(() => calcPosTotals(lines, header, decimal), [lines, header, decimal]);

    const paymentOptions = meta?.pos_setting?.payment_options || meta?.payment_options;
    const { primary: paymentButtons, more: morePaymentButtons } = useMemo(
        () => resolvePaymentButtons(paymentOptions),
        [paymentOptions]
    );

    const loadBootstrap = useCallback(async () => {
        setLoading(true);
        try {
            const res = await posApi.get('/');
            const data = res.data || {};
            setMeta(data);
            setPrintAfterSale(Boolean(data.pos_setting?.show_print_invoice ?? true));
            setHeader((h) => ({
                ...h,
                customer_id: data.default_customer_id
                    ? String(data.default_customer_id)
                    : (data.customers?.[0]?.id ? String(data.customers[0].id) : ''),
                warehouse_id: data.default_warehouse_id
                    ? String(data.default_warehouse_id)
                    : (data.warehouses?.[0]?.id ? String(data.warehouses[0].id) : ''),
                biller_id: data.default_biller_id
                    ? String(data.default_biller_id)
                    : (data.billers?.[0]?.id ? String(data.billers[0].id) : ''),
                currency_id: data.default_currency_id ? String(data.default_currency_id) : '',
                exchange_rate: data.default_exchange_rate || 1,
                account_id: data.default_account_id ? String(data.default_account_id) : '',
            }));
        } catch (err) {
            showToast(err?.message || 'Failed to load POS.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    const fetchProducts = useCallback(async (page = 1, append = false) => {
        if (!header.warehouse_id) {
            setProducts([]);
            setNextProductPage(null);
            return;
        }
        setProductsLoading(true);
        try {
            const q = new URLSearchParams({
                warehouse_id: header.warehouse_id,
                filter: productFilter.type,
                filter_id: String(productFilter.id),
                page: String(page),
            });
            const res = await posApi.get(`products?${q}`);
            const items = res.data?.items || [];
            setProducts((prev) => (append ? [...prev, ...items] : items));
            setNextProductPage(res.data?.next_page || null);
        } catch (err) {
            showToast(err?.message || 'Failed to load products.', 'error');
        } finally {
            setProductsLoading(false);
        }
    }, [header.warehouse_id, productFilter, showToast]);

    const loadRecentSales = useCallback(async () => {
        try {
            const res = await api.get('sales/recent-sale');
            setRecentSales(Array.isArray(res.data) ? res.data : res.data?.data || []);
        } catch {
            setRecentSales([]);
        }
    }, []);

    const loadRecentDrafts = useCallback(async () => {
        try {
            const res = await api.get('sales/recent-draft');
            setRecentDrafts(Array.isArray(res.data) ? res.data : res.data?.data || []);
        } catch {
            setRecentDrafts([]);
        }
    }, []);

    useEffect(() => {
        if (canUse) loadBootstrap();
        else setLoading(false);
    }, [canUse, loadBootstrap]);

    useEffect(() => {
        loadRecentDrafts();
        loadRecentSales();
    }, [loadRecentDrafts, loadRecentSales]);

    useEffect(() => {
        fetchProducts(1, false);
    }, [fetchProducts]);

    useEffect(() => {
        if (!header.customer_id) {
            setCustomerGroupRate(0);
            return;
        }
        api.get(`sales/customer-group/${header.customer_id}`)
            .then((res) => setCustomerGroupRate((parseFloat(res.data?.percentage ?? res.data) || 0) / 100))
            .catch(() => setCustomerGroupRate(0));
    }, [header.customer_id]);

    useEffect(() => {
        if (!draftId || !meta) return;
        posApi.get(`draft/${draftId}`)
            .then((res) => {
                const d = res.data || {};
                setDraftSaleId(d.sale_id);
                setHeader((h) => ({
                    ...h,
                    customer_id: String(d.customer_id || h.customer_id),
                    warehouse_id: String(d.warehouse_id || h.warehouse_id),
                    biller_id: String(d.biller_id || h.biller_id),
                    currency_id: String(d.currency_id || h.currency_id),
                    exchange_rate: d.exchange_rate || h.exchange_rate,
                    order_tax_rate: String(d.order_tax_rate ?? h.order_tax_rate),
                    order_discount: d.order_discount ?? h.order_discount,
                    order_discount_value: d.order_discount ?? h.order_discount_value,
                    shipping_cost: d.shipping_cost ?? h.shipping_cost,
                }));
                resetLineIdCounter();
                setLines((d.lines || []).map((line) => buildLineFromDraft(line, decimal)));
            })
            .catch(() => showToast('Could not load draft sale.', 'error'));
    }, [draftId, meta, decimal, showToast]);

    useEffect(() => {
        if (!loading && canUse) searchRef.current?.focus();
    }, [loading, canUse]);

    useEffect(() => {
        if (!header.warehouse_id || searchCode.trim().length < 2) {
            setSearchResults([]);
            setSearchOpen(false);
            return undefined;
        }
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(async () => {
            try {
                const q = new URLSearchParams({
                    warehouse_id: header.warehouse_id,
                    search: searchCode.trim(),
                });
                const res = await api.get(`sales/search?${q}`);
                const list = Array.isArray(res.data) ? res.data : [];
                setSearchResults(list);
                setSearchOpen(list.length > 0);
            } catch {
                setSearchResults([]);
                setSearchOpen(false);
            }
        }, 280);
        return () => clearTimeout(searchTimer.current);
    }, [searchCode, header.warehouse_id]);

    useEffect(() => {
        const onKey = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                if (!(e.shiftKey && e.key.toLowerCase() === 's')) return;
            }
            if (!e.shiftKey) return;
            const key = e.key.toLowerCase();
            if (key === 's') { e.preventDefault(); searchRef.current?.focus(); }
            if (key === 'd') { e.preventDefault(); saveDraftRef.current?.(); }
            if (key === 'f') { e.preventDefault(); openPaymentRef.current?.('1'); }
            if (key === 'e') { e.preventDefault(); setDiscountModal(true); }
            if (key === 'k') { e.preventDefault(); setCouponModal(true); }
            if (key === 'q') { e.preventDefault(); setShippingModal(true); }
            if (key === 'x') { e.preventDefault(); document.getElementById('pos-order-tax')?.focus(); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const saveDraftRef = useRef(null);
    const openPaymentRef = useRef(null);

    const addProductByCode = async (code, opts = {}) => {
        if (!code?.trim() || !header.customer_id || !header.warehouse_id) {
            showToast('Select customer and warehouse first.', 'error');
            return;
        }
        try {
            const res = await posApi.post('product-lookup', {
                code: code.trim(),
                customer_id: header.customer_id,
                qty: opts.qty || 1,
                batch_id: opts.batch_id || null,
                embedded: opts.embedded || 0,
                price: opts.price || 0,
                pre_qty: opts.pre_qty || 0,
                imei: opts.imei || null,
            });
            const line = buildLineFromLookup(res.data, customerGroupRate, decimal, opts.qty || 1);
            setLines((prev) => mergeOrAppendLine(prev, line, customerGroupRate, decimal));
            setSearchCode('');
            setSearchOpen(false);
            searchRef.current?.focus();
        } catch (err) {
            showToast(err?.message || 'Product not found.', 'error');
        }
    };

    const onSearchResultClick = (item) => {
        addProductByCode(item.code, {
            qty: 1,
            batch_id: item.product_batch_id || null,
            embedded: item.is_embeded ? 1 : 0,
            price: item.price || 0,
            pre_qty: item.qty,
            imei: item.imei_number || null,
        });
    };

    const onGridProductClick = (item) => {
        onSearchResultClick(item);
    };

    const updateLineQty = (id, qty) => {
        setLines((prev) =>
            prev.map((l) =>
                l._id === id ? recalcPosLine({ ...l, qty: Math.max(0, parseFloat(qty) || 0) }, decimal) : l
            ).filter((l) => l.qty > 0)
        );
    };

    const removeLine = (id) => setLines((prev) => prev.filter((l) => l._id !== id));

    const resetCart = () => {
        resetLineIdCounter();
        setLines([]);
        setDraftSaleId(null);
        setHeader((h) => ({
            ...h,
            order_discount_value: 0,
            order_discount: 0,
            shipping_cost: 0,
            coupon_id: '',
            coupon_discount: 0,
            coupon_code: '',
        }));
    };

    const clearCart = () => {
        if (lines.length && !window.confirm('Clear cart and cancel this sale?')) return;
        resetCart();
    };

    const printInvoice = (saleId) => {
        if (!saleId) return;
        window.open(`${defaultPath}/sales/gen_invoice/${saleId}?is_print=true`, '_blank', 'noopener,noreferrer');
    };

    const saveDraft = async () => {
        if (!totals.updated?.length) {
            showToast('Add at least one product.', 'error');
            return;
        }
        if (!header.customer_id || !header.warehouse_id || !header.biller_id) {
            showToast('Customer, warehouse and biller are required.', 'error');
            return;
        }
        setSubmitting(true);
        try {
            const fd = buildPosFormData({ header, totals, draftSaleId, isDraft: true });
            const res = await api.post('sales', fd);
            const newId = res.data?.id || res.data;
            if (newId) setDraftSaleId(String(newId));
            showToast('Draft saved.', 'success');
            loadRecentDrafts();
        } catch (err) {
            showToast(err?.message || 'Failed to save draft.', 'error');
        } finally {
            setSubmitting(false);
        }
    };
    saveDraftRef.current = saveDraft;

    const completeSale = async (paidById, paidAmount) => {
        if (!totals.updated?.length) {
            showToast('Add at least one product.', 'error');
            return;
        }
        if (!header.customer_id || !header.warehouse_id || !header.biller_id) {
            showToast('Customer, warehouse and biller are required.', 'error');
            return;
        }
        const amount = paidAmount ?? totals.grand_total;
        setSubmitting(true);
        try {
            const fd = buildPosFormData({
                header,
                totals,
                paidById,
                paidAmount: amount,
                draftSaleId,
                accountId: header.account_id,
            });
            const res = await api.post('sales', fd);
            const saleId = res.data?.id || res.data;
            showToast('Sale completed.', 'success');
            if (printAfterSale && meta?.pos_setting?.show_print_invoice && saleId) {
                printInvoice(saleId);
            }
            resetCart();
            setPaymentModal(null);
            loadRecentSales();
            loadRecentDrafts();
            searchRef.current?.focus();
        } catch (err) {
            showToast(err?.message || 'Failed to complete sale.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const openPayment = (paidById) => {
        const btn = [...paymentButtons, ...morePaymentButtons].find((b) => b.id === paidById);
        setCashReceived('');
        setPaymentModal({ paidById, label: btn?.label || 'Payment' });
    };
    openPaymentRef.current = openPayment;

    const confirmPayment = () => {
        if (!paymentModal) return;
        const { paidById } = paymentModal;
        let paidAmount = totals.grand_total;
        if (paidById === 'credit') {
            paidAmount = 0;
        } else if (paidById === '1' && cashReceived !== '') {
            paidAmount = parseFloat(cashReceived) || totals.grand_total;
        }
        completeSale(paidById, paidAmount);
    };

    const applyCouponCode = () => {
        const preCouponTotal = round(
            totals.total_price + totals.order_tax + totals.shipping_cost - totals.order_discount,
            decimal
        );
        const result = applyCoupon(
            couponCodeInput,
            meta?.coupons,
            preCouponTotal,
            header.exchange_rate
        );
        if (!result.ok) {
            showToast(result.message, 'error');
            return;
        }
        setHeader((h) => ({
            ...h,
            coupon_id: result.coupon_id,
            coupon_discount: result.coupon_discount,
            coupon_code: couponCodeInput.trim(),
        }));
        setCouponModal(false);
        showToast(result.message, 'success');
    };

    const onCurrencyChange = (currencyId) => {
        const cur = (meta?.currencies || []).find((c) => String(c.id) === String(currencyId));
        setHeader((h) => ({
            ...h,
            currency_id: currencyId,
            exchange_rate: cur?.exchange_rate || 1,
        }));
    };

    const onSearchKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (searchResults.length === 1) {
                onSearchResultClick(searchResults[0]);
            } else {
                addProductByCode(searchCode);
            }
        }
        if (e.key === 'Escape') setSearchOpen(false);
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
        else document.exitFullscreen?.();
    };

    if (!canUse) {
        return (
            <div className="pos-denied">
                <p>You do not have permission to use POS.</p>
                <a href={dashboardUrl()} className="pos-header-btn" style={{ marginTop: 16 }}>Back to Dashboard</a>
            </div>
        );
    }

    if (loading) {
        return <div className="pos-loading">Loading POS terminal…</div>;
    }

    const customerOptions = (meta?.customers || []).map((c) => ({
        value: String(c.id),
        label: c.phone_number ? `${c.name} (${c.phone_number})` : c.name,
    }));
    const warehouseOptions = (meta?.warehouses || []).map((w) => ({ value: String(w.id), label: w.name }));
    const billerOptions = (meta?.billers || []).map((b) => ({ value: String(b.id), label: b.name }));
    const taxOptions = (meta?.order_tax_options || []).map((t) => ({ value: String(t.rate), label: t.name }));
    const currencyOptions = (meta?.currencies || []).map((c) => ({
        value: String(c.id),
        label: `${c.code} (${c.exchange_rate})`,
    }));
    const accountOptions = (meta?.accounts || []).map((a) => ({ value: String(a.id), label: a.name }));

    const lockWarehouse = meta?.lock_warehouse_id;
    const lockBiller = meta?.lock_biller_id;
    const siteTitle = meta?.site_title || 'SalePro POS';
    const warehouseName = warehouseOptions.find((w) => w.value === header.warehouse_id)?.label || '—';

    const filteredBrands = (meta?.brands || []).filter((b) =>
        !filterSearch || String(b.name).toLowerCase().includes(filterSearch.toLowerCase())
    );
    const filteredCategories = (meta?.categories || []).filter((c) =>
        !filterSearch || String(c.name).toLowerCase().includes(filterSearch.toLowerCase())
    );

    const cashChange = paymentModal?.paidById === '1' && cashReceived !== ''
        ? round(parseFloat(cashReceived) - totals.grand_total, decimal)
        : null;

    return (
        <div className="pos-standalone">
            <header className="pos-header">
                <div className="pos-header-brand">
                    <div className="pos-header-logo">POS</div>
                    <div>
                        <div className="pos-header-title">{siteTitle}</div>
                        <div className="pos-header-sub">Point of Sale</div>
                    </div>
                </div>
                <div className="pos-header-meta">
                    <PosClock />
                    <span>Warehouse: <strong>{warehouseName}</strong></span>
                    <span>Items: <strong>{totals.item}</strong></span>
                </div>
                <div className="pos-header-actions">
                    <span className="pos-header-user">{user?.name || 'Cashier'}</span>
                    <button type="button" className="pos-header-btn" onClick={toggleFullscreen} title="Fullscreen">⛶</button>
                    <button type="button" className="pos-header-btn" onClick={() => setRecentModal(true)}>Recent</button>
                    <a href={dashboardUrl()} className="pos-header-btn">Dashboard</a>
                    <a href={appHashUrl('/sales')} className="pos-header-btn">Sales</a>
                    <button
                        type="button"
                        className="pos-header-btn pos-header-btn--logout"
                        onClick={() => auth.signOutUser()}
                    >
                        Logout
                    </button>
                </div>
            </header>

            <div className="pos-main">
                <section className="pos-catalog" aria-label="Product catalog">
                    <div className="pos-search-bar">
                        <input
                            ref={searchRef}
                            type="text"
                            value={searchCode}
                            onChange={(e) => setSearchCode(e.target.value)}
                            onKeyDown={onSearchKeyDown}
                            onFocus={() => searchResults.length && setSearchOpen(true)}
                            placeholder="Scan barcode or search product name/code — Enter"
                            autoComplete="off"
                        />
                        {searchOpen && searchResults.length > 0 && (
                            <ul className="pos-search-dropdown">
                                {searchResults.slice(0, 12).map((item) => (
                                    <li key={`${item.id}-${item.code}`}>
                                        <button type="button" onClick={() => onSearchResultClick(item)}>
                                            <span>{item.name}</span>
                                            <span className="pos-search-meta">{item.code} · Qty {item.qty ?? '∞'}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="pos-filter-bar">
                        <button
                            type="button"
                            className={`pos-chip ${productFilter.type === 'featured' ? 'active' : ''}`}
                            onClick={() => setProductFilter({ type: 'featured', id: 1 })}
                        >
                            Featured
                        </button>
                        <button type="button" className="pos-chip" onClick={() => { setFilterPanel('brand'); setFilterSearch(''); }}>
                            Brand
                        </button>
                        <button type="button" className="pos-chip" onClick={() => { setFilterPanel('category'); setFilterSearch(''); }}>
                            Category
                        </button>
                    </div>

                    {filterPanel && (
                        <div className="pos-filter-overlay">
                            <div className="pos-filter-head">
                                <strong>Choose {filterPanel}</strong>
                                <button type="button" onClick={() => setFilterPanel(null)}>×</button>
                            </div>
                            <input
                                className="pos-filter-search"
                                placeholder={`Search ${filterPanel}…`}
                                value={filterSearch}
                                onChange={(e) => setFilterSearch(e.target.value)}
                            />
                            <div className="pos-filter-grid">
                                {(filterPanel === 'brand' ? filteredBrands : filteredCategories).map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        className={`pos-filter-item ${productFilter.type === filterPanel && productFilter.id === item.id ? 'active' : ''}`}
                                        onClick={() => {
                                            setProductFilter({ type: filterPanel, id: item.id });
                                            setFilterPanel(null);
                                        }}
                                    >
                                        <img
                                            src={filterPanel === 'brand' ? brandImageUrl(meta, item.image) : categoryImageUrl(meta, item.image)}
                                            alt=""
                                            onError={(e) => { e.target.src = meta?.default_product_image || ''; }}
                                        />
                                        <span>{item.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="pos-grid-wrap">
                        <div className="pos-grid">
                            {productsLoading && products.length === 0 && (
                                <p className="pos-grid-msg">Loading products…</p>
                            )}
                            {!productsLoading && products.length === 0 && (
                                <p className="pos-grid-msg">No products in this warehouse.</p>
                            )}
                            {products.map((item) => (
                                <button
                                    key={`${item.code}-${item.batch_id}`}
                                    type="button"
                                    className="pos-card"
                                    onClick={() => onGridProductClick(item)}
                                >
                                    <img
                                        src={productImageUrl(meta, item.image)}
                                        alt=""
                                        onError={(e) => { e.target.src = meta?.default_product_image || ''; }}
                                    />
                                    <p className="pos-card-name">{item.name}</p>
                                    <span className="pos-card-meta">{item.code} · Qty {item.qty}</span>
                                    {item.price != null && (
                                        <span className="pos-card-price">{Number(item.price).toFixed(decimal)}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                        {nextProductPage && (
                            <button
                                type="button"
                                className="pos-load-more"
                                disabled={productsLoading}
                                onClick={() => fetchProducts(nextProductPage, true)}
                            >
                                {productsLoading ? 'Loading…' : 'Load more products'}
                            </button>
                        )}
                    </div>
                </section>

                <section className="pos-checkout" aria-label="Checkout">
                    <div className="pos-checkout-fields">
                        <FormField label="Customer">
                            <SelectInput
                                value={header.customer_id}
                                onChange={(e) => setHeader({ ...header, customer_id: e.target.value })}
                                options={customerOptions}
                            />
                        </FormField>
                        {!lockWarehouse && (
                            <FormField label="Warehouse">
                                <SelectInput
                                    value={header.warehouse_id}
                                    onChange={(e) => setHeader({ ...header, warehouse_id: e.target.value })}
                                    options={warehouseOptions}
                                />
                            </FormField>
                        )}
                        {!lockBiller && (
                            <FormField label="Biller">
                                <SelectInput
                                    value={header.biller_id}
                                    onChange={(e) => setHeader({ ...header, biller_id: e.target.value })}
                                    options={billerOptions}
                                />
                            </FormField>
                        )}
                        <FormField label="Currency">
                            <SelectInput
                                value={header.currency_id}
                                onChange={(e) => onCurrencyChange(e.target.value)}
                                options={currencyOptions}
                            />
                        </FormField>
                        {accountOptions.length > 0 && (
                            <FormField label="Account">
                                <SelectInput
                                    value={header.account_id}
                                    onChange={(e) => setHeader({ ...header, account_id: e.target.value })}
                                    options={accountOptions}
                                />
                            </FormField>
                        )}
                    </div>

                    <div className="pos-cart-wrap">
                        <table className="pos-cart-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Qty</th>
                                    <th>Price</th>
                                    <th>Total</th>
                                    <th />
                                </tr>
                            </thead>
                            <tbody>
                                {(totals.updated || []).length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="pos-cart-empty">Cart is empty — scan or tap a product</td>
                                    </tr>
                                ) : (
                                    totals.updated.map((l) => (
                                        <tr key={l._id}>
                                            <td>
                                                <div className="pos-line-name">{l.name}</div>
                                                <span className="pos-line-code">{l.code}</span>
                                            </td>
                                            <td style={{ width: 72 }}>
                                                <NumberInput
                                                    min="0"
                                                    step="any"
                                                    value={l.qty}
                                                    onChange={(e) => updateLineQty(l._id, e.target.value)}
                                                />
                                            </td>
                                            <td>{Number(l.net_unit_price).toFixed(decimal)}</td>
                                            <td>{Number(l.subtotal).toFixed(decimal)}</td>
                                            <td>
                                                <button type="button" className="pos-remove-btn" onClick={() => removeLine(l._id)} aria-label="Remove">×</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="pos-summary">
                        <div className="pos-summary-row"><span>Subtotal</span><strong>{round(totals.total_price, decimal).toFixed(decimal)}</strong></div>
                        <div className="pos-summary-row"><span>Tax</span><strong>{round(totals.total_tax + totals.order_tax, decimal).toFixed(decimal)}</strong></div>
                        <div className="pos-summary-row">
                            <span>Discount <button type="button" className="pos-link-btn" onClick={() => { setDiscountDraft({ type: header.order_discount_type, value: header.order_discount_value }); setDiscountModal(true); }}>Edit</button></span>
                            <strong>{round(totals.total_discount + totals.order_discount, decimal).toFixed(decimal)}</strong>
                        </div>
                        <div className="pos-summary-row">
                            <span>Coupon {header.coupon_code && `(${header.coupon_code})`} <button type="button" className="pos-link-btn" onClick={() => setCouponModal(true)}>Apply</button></span>
                            <strong>{round(totals.coupon_discount, decimal).toFixed(decimal)}</strong>
                        </div>
                        <div className="pos-summary-row">
                            <span>Shipping <button type="button" className="pos-link-btn" onClick={() => { setShippingDraft(header.shipping_cost); setShippingModal(true); }}>Edit</button></span>
                            <strong>{round(totals.shipping_cost, decimal).toFixed(decimal)}</strong>
                        </div>
                        <div className="pos-summary-extra">
                            <FormField label="Order tax">
                                <SelectInput
                                    id="pos-order-tax"
                                    value={header.order_tax_rate}
                                    onChange={(e) => setHeader({ ...header, order_tax_rate: e.target.value })}
                                    options={taxOptions}
                                />
                            </FormField>
                        </div>
                        <div className="pos-summary-grand">
                            <span>Grand Total</span>
                            <span>{round(totals.grand_total, decimal).toFixed(decimal)}</span>
                        </div>
                    </div>

                    <div className="pos-payments">
                        {paymentButtons.map((btn) => (
                            <button
                                key={btn.key}
                                type="button"
                                className={`pos-pay ${btn.className}`}
                                disabled={submitting || !totals.updated?.length}
                                onClick={() => openPayment(btn.id)}
                            >
                                {btn.label}
                            </button>
                        ))}
                        {morePaymentButtons.length > 0 && (
                            <details className="pos-pay-more">
                                <summary className="pos-pay custom">More</summary>
                                <div className="pos-pay-more-list">
                                    {morePaymentButtons.map((btn) => (
                                        <button
                                            key={btn.key}
                                            type="button"
                                            className="pos-pay custom"
                                            disabled={submitting || !totals.updated?.length}
                                            onClick={() => openPayment(btn.id)}
                                        >
                                            {btn.label}
                                        </button>
                                    ))}
                                </div>
                            </details>
                        )}
                        <button type="button" className="pos-pay draft" disabled={submitting || !totals.updated?.length} onClick={saveDraft}>Save Draft</button>
                        <button type="button" className="pos-pay clear" disabled={submitting} onClick={clearCart}>Clear</button>
                    </div>
                </section>
            </div>

            <Modal
                isOpen={Boolean(paymentModal)}
                title={`${paymentModal?.label || 'Payment'} — ${round(totals.grand_total, decimal).toFixed(decimal)}`}
                onClose={() => setPaymentModal(null)}
                footer={(
                    <>
                        <button type="button" className="ui-btn ghost" onClick={() => setPaymentModal(null)}>Cancel</button>
                        <button type="button" className="ui-btn primary" disabled={submitting} onClick={confirmPayment}>Complete sale</button>
                    </>
                )}
            >
                {paymentModal?.paidById === '1' ? (
                    <>
                        <FormField label="Cash received">
                            <NumberInput min="0" step="any" value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} autoFocus />
                        </FormField>
                        {cashChange != null && !Number.isNaN(cashChange) && (
                            <p className="pos-change">Change: <strong>{cashChange.toFixed(decimal)}</strong></p>
                        )}
                    </>
                ) : (
                    <p>Confirm payment of {round(totals.grand_total, decimal).toFixed(decimal)} via {paymentModal?.label}.</p>
                )}
                {meta?.pos_setting?.show_print_invoice && (
                    <label className="ui-checkbox-row" style={{ marginTop: 16 }}>
                        <input
                            type="checkbox"
                            checked={printAfterSale}
                            onChange={(e) => setPrintAfterSale(e.target.checked)}
                        />
                        print_invoice
                    </label>
                )}
            </Modal>

            <Modal
                isOpen={discountModal}
                title="Order discount"
                onClose={() => setDiscountModal(false)}
                footer={(
                    <button
                        type="button"
                        className="ui-btn primary"
                        onClick={() => {
                            setHeader((h) => ({
                                ...h,
                                order_discount_type: discountDraft.type,
                                order_discount_value: parseFloat(discountDraft.value) || 0,
                            }));
                            setDiscountModal(false);
                        }}
                    >
                        Apply
                    </button>
                )}
            >
                <FormField label="Type">
                    <SelectInput
                        value={discountDraft.type}
                        onChange={(e) => setDiscountDraft((d) => ({ ...d, type: e.target.value }))}
                        options={[{ value: 'Flat', label: 'Flat' }, { value: 'Percentage', label: 'Percentage' }]}
                    />
                </FormField>
                <FormField label="Value">
                    <NumberInput min="0" step="any" value={discountDraft.value} onChange={(e) => setDiscountDraft((d) => ({ ...d, value: e.target.value }))} />
                </FormField>
            </Modal>

            <Modal isOpen={couponModal} title="Coupon code" onClose={() => setCouponModal(false)} footer={(
                <button type="button" className="ui-btn primary" onClick={applyCouponCode}>Apply coupon</button>
            )}>
                <FormField label="Code">
                    <input className="pos-plain-input" value={couponCodeInput} onChange={(e) => setCouponCodeInput(e.target.value)} placeholder="Enter coupon code" />
                </FormField>
            </Modal>

            <Modal isOpen={shippingModal} title="Shipping cost" onClose={() => setShippingModal(false)} footer={(
                <button type="button" className="ui-btn primary" onClick={() => { setHeader((h) => ({ ...h, shipping_cost: parseFloat(shippingDraft) || 0 })); setShippingModal(false); }}>Apply</button>
            )}>
                <FormField label="Amount">
                    <NumberInput min="0" step="any" value={shippingDraft} onChange={(e) => setShippingDraft(e.target.value)} />
                </FormField>
            </Modal>

            <Modal isOpen={recentModal} title="Recent transactions" onClose={() => setRecentModal(false)} size="sm">
                {recentDrafts.length > 0 && (
                    <>
                        <div className="pos-recent-title">Drafts</div>
                        {recentDrafts.map((s) => (
                            <Link key={s.id} to={`/pos/${s.id}`} className="pos-recent-row" onClick={() => setRecentModal(false)}>
                                <span>{s.reference_no}</span>
                                <span>{s.name || s.customer_name}</span>
                                <span>{Number(s.grand_total).toFixed(decimal)}</span>
                            </Link>
                        ))}
                    </>
                )}
                {recentSales.length > 0 && (
                    <>
                        <div className="pos-recent-title" style={{ marginTop: 12 }}>Sales</div>
                        {recentSales.map((s) => (
                            <div key={s.id} className="pos-recent-row">
                                <span>{s.reference_no}</span>
                                <span>{s.name || s.customer_name}</span>
                                <span>{Number(s.grand_total).toFixed(decimal)}</span>
                            </div>
                        ))}
                    </>
                )}
            </Modal>

            <Toast toast={toast} />
        </div>
    );
}
