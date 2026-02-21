import React, { useState, useEffect, useCallback } from 'react';
import { api, msg } from '../services';

const DECIMAL = 2;

const Pos = () => {
  const [formData, setFormData] = useState({
    warehouses: [],
    billers: [],
    customers: [],
    categories: [],
    brands: [],
    taxes: [],
    currency: null,
    payment_options: [],
    decimal: DECIMAL,
  });
  const [warehouseId, setWarehouseId] = useState('');
  const [billerId, setBillerId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [products, setProducts] = useState({ data: {}, next_page_url: null });
  const [productsLoading, setProductsLoading] = useState(false);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [filterType, setFilterType] = useState('featured');
  const [filterId, setFilterId] = useState('1');
  const [orderTaxRate, setOrderTaxRate] = useState(0);
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [paymentModal, setPaymentModal] = useState(false);
  const [payingAmount, setPayingAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingFormData, setLoadingFormData] = useState(true);

  const decimal = formData.decimal ?? DECIMAL;
  const formatNum = (n) => Number(n).toFixed(decimal);

  const fetchPosFormData = useCallback(async () => {
    try {
      setLoadingFormData(true);
      const res = await api.get('sales/pos-form-data');
      const d = res?.data;
      if (d?.status === 200 && d?.data) {
        setFormData((prev) => ({ ...prev, ...d.data }));
        const wh = d.data.warehouses?.[0]?.id;
        const biller = d.data.billers?.[0]?.id;
        const cust = d.data.customers?.[0]?.id;
        if (wh) setWarehouseId(String(wh));
        if (biller) setBillerId(String(biller));
        if (cust) setCustomerId(String(cust));
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load POS data');
    } finally {
      setLoadingFormData(false);
    }
  }, []);

  useEffect(() => {
    fetchPosFormData();
  }, [fetchPosFormData]);

  const fetchProducts = useCallback(async (pageUrl = null) => {
    if (!warehouseId) return;
    try {
      setProductsLoading(true);
      const url =
        pageUrl ||
        `sales/getproducts/${warehouseId}/${filterType}/${filterId}`;
      const res = await api.get(url);
      const data = res?.data;
      if (data?.data) {
        if (pageUrl) {
          setProducts((prev) => ({
            data: {
              name: [...(prev.data.name || []), ...(data.data.name || [])],
              code: [...(prev.data.code || []), ...(data.data.code || [])],
              image: [...(prev.data.image || []), ...(data.data.image || [])],
              qty: [...(prev.data.qty || []), ...(data.data.qty || [])],
              price: [...(prev.data.price || []), ...(data.data.price || [])],
              is_imei: [...(prev.data.is_imei || []), ...(data.data.is_imei || [])],
            },
            next_page_url: data.next_page_url,
          }));
        } else {
          setProducts({ data: data.data, next_page_url: data.next_page_url });
        }
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load products');
    } finally {
      setProductsLoading(false);
    }
  }, [warehouseId, filterType, filterId]);

  useEffect(() => {
    if (warehouseId) fetchProducts();
  }, [warehouseId, filterType, filterId]);

  const searchProducts = useCallback(async () => {
    const term = searchTerm?.trim();
    if (!warehouseId || !term || term.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      setSearching(true);
      const encoded = btoa(term);
      const res = await api.get(`sales/search/${warehouseId}/${encoded}`);
      const data = res?.data;
      setSearchResults(Array.isArray(data) ? data : []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [warehouseId, searchTerm]);

  useEffect(() => {
    const t = setTimeout(searchProducts, 300);
    return () => clearTimeout(t);
  }, [searchTerm, searchProducts]);

  const addToCart = useCallback(
    async (item) => {
      if (!customerId || !warehouseId || !billerId) {
        msg.error('Please select Customer, Warehouse and Biller');
        return;
      }
      const code = item.code || item.item_code;
      const qty = item.qty ?? 1;
      const price = item.price ?? 0;
      const existing = cart.find((c) => (c.code || c.product_code) === code);
      const preQty = existing ? existing.qty : 0;
      try {
        const res = await api.get('sales/lims_product_search', {
          params: {
            'data[code]': code,
            'data[qty]': qty,
            'data[embedded]': 0,
            'data[batch]': item.product_batch_id || '',
            'data[customer_id]': customerId,
            'data[pre_qty]': preQty + 1,
            'data[imei]': item.imei_number || '',
            'data[price]': price,
          },
        });
        const arr = res?.data;
        if (!Array.isArray(arr) || arr.length < 10) return;
        const name = arr[0];
        const productCode = arr[1];
        const unitPrice = parseFloat(arr[2]) || 0;
        const taxRate = parseFloat(arr[3]) || 0;
        const taxMethod = arr[5];
        const unitStr = arr[6];
        const saleUnit = typeof unitStr === 'string' ? unitStr.split(',')[0] : 'n/a';
        const productId = arr[9];
        const qtyToAdd = parseFloat(arr[15]) || 1;
        const batchId = arr[21] || '';
        const batchNo = arr[22] || '';
        const imeiNumber = arr[18] || '';

        let netUnitPrice = unitPrice;
        let taxPerUnit = 0;
        if (taxMethod === 1) {
          taxPerUnit = (unitPrice * taxRate) / 100;
        } else {
          netUnitPrice = unitPrice / (1 + taxRate / 100);
          taxPerUnit = unitPrice - netUnitPrice;
        }
        const discountPerUnit = 0;
        const subtotalItem = (netUnitPrice + taxPerUnit - discountPerUnit) * qtyToAdd;
        const taxTotal = taxPerUnit * qtyToAdd;
        const discountTotal = discountPerUnit * qtyToAdd;

        const newRow = {
          product_id: productId,
          product_code: productCode,
          name,
          qty: qtyToAdd,
          sale_unit: saleUnit,
          net_unit_price: netUnitPrice,
          discount: discountTotal,
          tax_rate: taxRate,
          tax: taxTotal,
          subtotal: subtotalItem,
          product_batch_id: batchId,
          batch_no: batchNo,
          imei_number: imeiNumber,
        };

        if (existing) {
          setCart((prev) =>
            prev.map((c) =>
              (c.code || c.product_code) === productCode
                ? {
                    ...c,
                    qty: c.qty + qtyToAdd,
                    discount: c.discount + discountTotal,
                    tax: c.tax + taxTotal,
                    subtotal: c.subtotal + subtotalItem,
                  }
                : c
            )
          );
        } else {
          setCart((prev) => [...prev, { ...newRow, code: productCode }]);
        }
        setSearchTerm('');
        setSearchResults([]);
      } catch (err) {
        msg.error(err?.response?.data?.message || 'Failed to add product');
      }
    },
    [customerId, warehouseId, billerId, cart]
  );

  const updateCartQty = (index, delta) => {
    setCart((prev) => {
      const row = prev[index];
      if (!row) return prev;
      const newQty = Math.max(0, row.qty + delta);
      if (newQty === 0) return prev.filter((_, i) => i !== index);
      const ratio = newQty / row.qty;
      return prev.map((r, i) =>
        i === index
          ? {
              ...r,
              qty: newQty,
              discount: r.discount * ratio,
              tax: r.tax * ratio,
              subtotal: r.subtotal * ratio,
            }
          : r
      );
    });
  };

  const removeFromCart = (index) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const subtotalCart = cart.reduce((s, r) => s + (r.subtotal || 0), 0);
  const totalDiscountCart = cart.reduce((s, r) => s + (r.discount || 0), 0);
  const totalTaxCart = cart.reduce((s, r) => s + (r.tax || 0), 0);
  const afterOrderDiscount = Math.max(0, subtotalCart - orderDiscount);
  const orderTaxAmount = (afterOrderDiscount * (orderTaxRate || 0)) / 100;
  const grandTotal = afterOrderDiscount + orderTaxAmount + (Number(shippingCost) || 0);
  const totalQty = cart.reduce((s, r) => s + (r.qty || 0), 0);

  const handlePay = () => {
    if (cart.length === 0) {
      msg.error('Add at least one product');
      return;
    }
    setPayingAmount(formatNum(grandTotal));
    setPaymentModal(true);
  };

  const handleSubmitSale = async (asDraft = false) => {
    if (cart.length === 0) {
      msg.error('Add at least one product');
      return;
    }
    const paid = parseFloat(payingAmount) || 0;
    if (!asDraft && paid <= 0) {
      msg.error('Enter paying amount');
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        warehouse_id: warehouseId,
        biller_id: billerId,
        customer_id: customerId,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        product_id: cart.map((c) => c.product_id),
        product_code: cart.map((c) => c.product_code || c.code),
        qty: cart.map((c) => c.qty),
        sale_unit: cart.map((c) => c.sale_unit || 'n/a'),
        net_unit_price: cart.map((c) => c.net_unit_price),
        discount: cart.map((c) => c.discount),
        tax_rate: cart.map((c) => c.tax_rate),
        tax: cart.map((c) => c.tax),
        subtotal: cart.map((c) => c.subtotal),
        product_batch_id: cart.map((c) => c.product_batch_id || ''),
        imei_number: cart.map((c) => c.imei_number || ''),
        total_qty: totalQty,
        total_discount: totalDiscountCart + orderDiscount,
        total_tax: totalTaxCart + orderTaxAmount,
        total_price: subtotalCart,
        order_tax_rate: orderTaxRate,
        order_tax: orderTaxAmount,
        order_discount_type: 'Flat',
        order_discount: orderDiscount,
        order_discount_value: orderDiscount,
        shipping_cost: shippingCost || 0,
        grand_total: grandTotal,
        paid_amount: asDraft ? [0] : [paid],
        paid_by_id: [1],
        paying_amount: asDraft ? [0] : [paid],
        sale_status: asDraft ? 3 : 1,
        pos: 1,
        draft: asDraft ? 1 : 0,
        item: cart.length,
        coupon_active: '',
        coupon_id: '',
        coupon_discount: 0,
        used_points: '',
      };
      const res = await api.post('sales').values(payload);
      if (res?.response) {
        const errData = res.response?.data;
        throw new Error(errData?.message || errData?.errors ? JSON.stringify(errData.errors) : 'Failed to save sale');
      }
      msg.success(asDraft ? 'Saved as draft' : 'Sale completed');
      setPaymentModal(false);
      setCart([]);
      setPayingAmount('');
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to save sale');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingFormData) {
    return (
      <div className="p-4">
        <p>Loading POS...</p>
      </div>
    );
  }

  const productNames = products.data?.name || [];
  const productCodes = products.data?.code || [];
  const productImages = products.data?.image || [];
  const productQtys = products.data?.qty || [];
  const productPrices = products.data?.price || [];

  return (
    <div className="container-fluid p-3">
      <div className="row">
        <div className="col-md-5">
          <div className="mb-2 d-flex gap-2 flex-wrap">
            <button
              type="button"
              className={`btn btn-sm ${filterType === 'featured' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => { setFilterType('featured'); setFilterId('1'); }}
            >
              Featured
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-info"
              onClick={() => setFilterType('category')}
            >
              Category
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-info"
              onClick={() => setFilterType('brand')}
            >
              Brand
            </button>
          </div>
          {filterType === 'category' && (
            <div className="mb-2 d-flex flex-wrap gap-1">
              {(formData.categories || []).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => { setFilterId(String(cat.id)); }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
          {filterType === 'brand' && (
            <div className="mb-2 d-flex flex-wrap gap-1">
              {(formData.brands || []).map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => { setFilterId(String(b.id)); }}
                >
                  {b.title}
                </button>
              ))}
            </div>
          )}
          <div className="product-grid row g-2">
            {productsLoading && <div className="col-12">Loading...</div>}
            {!productsLoading &&
              productNames.map((name, i) => (
                <div
                  key={`${productCodes[i]}-${i}`}
                  className="col-6 col-md-4"
                  style={{ cursor: 'pointer' }}
                  onClick={() =>
                    addToCart({
                      code: productCodes[i],
                      qty: productQtys[i],
                      price: productPrices[i],
                    })
                  }
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && addToCart({ code: productCodes[i], qty: productQtys[i], price: productPrices[i] })}
                >
                  <div className="border rounded p-2 text-center">
                    {productImages[i] ? (
                      <img
                        src={`${process.env.REACT_APP_DEFAULT_PATH || 'http://127.0.0.1:8000'}/images/product/${productImages[i]}`}
                        alt=""
                        style={{ maxHeight: 80, objectFit: 'contain' }}
                      />
                    ) : (
                      <div style={{ height: 80 }} className="bg-light d-flex align-items-center justify-content-center small text-muted">
                        No image
                      </div>
                    )}
                    <div className="small fw-bold text-truncate" title={name}>{name}</div>
                    <div className="small text-muted">[{productCodes[i]}]</div>
                    <div className="small">{formatNum(productPrices[i])}</div>
                  </div>
                </div>
              ))}
          </div>
          {products.next_page_url && (
            <button
              type="button"
              className="btn btn-sm btn-primary mt-2"
              onClick={() => {
                const url = products.next_page_url;
                const path = url.startsWith('http') ? new URL(url).pathname.replace(/^\/api\/?/, '') + (new URL(url).search || '') : url;
                fetchProducts(path);
              }}
            >
              Load more
            </button>
          )}
        </div>

        <div className="col-md-7">
          <div className="row g-2 mb-2">
            <div className="col-6 col-md-3">
              <label className="form-label small">Warehouse</label>
              <select
                className="form-select form-select-sm"
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
              >
                <option value="">Select</option>
                {(formData.warehouses || []).map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label small">Biller</label>
              <select
                className="form-select form-select-sm"
                value={billerId}
                onChange={(e) => setBillerId(e.target.value)}
              >
                <option value="">Select</option>
                {(formData.billers || []).map((b) => (
                  <option key={b.id} value={b.id}>{b.name} {b.company_name ? `(${b.company_name})` : ''}</option>
                ))}
              </select>
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label small">Customer</label>
              <select
                className="form-select form-select-sm"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              >
                <option value="">Select</option>
                {(formData.customers || []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name} {c.wa_number ? `(${c.wa_number})` : ''}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-2">
            <label className="form-label small">Scan / Search product</label>
            <div className="input-group input-group-sm">
              <input
                type="text"
                className="form-control"
                placeholder="Name or code"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {searchResults.length > 0 && (
              <ul className="list-group list-group-flush mt-1" style={{ maxHeight: 200, overflow: 'auto' }}>
                {searchResults.map((p, i) => (
                  <li
                    key={p.id || i}
                    className="list-group-item list-group-item-action py-2 small"
                    style={{ cursor: 'pointer' }}
                    onClick={() => addToCart(p)}
                    role="button"
                  >
                    {p.name} ({p.code}) - {formatNum(p.price)}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="table-responsive">
            <table className="table table-sm table-bordered">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((row, i) => (
                  <tr key={i}>
                    <td className="small">{row.name} [{row.product_code || row.code}]</td>
                    <td>{formatNum(row.net_unit_price)}</td>
                    <td>
                      <button type="button" className="btn btn-sm btn-outline-secondary py-0" onClick={() => updateCartQty(i, -1)}>-</button>
                      <span className="mx-2">{row.qty}</span>
                      <button type="button" className="btn btn-sm btn-outline-secondary py-0" onClick={() => updateCartQty(i, 1)}>+</button>
                    </td>
                    <td>{formatNum(row.subtotal)}</td>
                    <td>
                      <button type="button" className="btn btn-sm btn-danger py-0" onClick={() => removeFromCart(i)}>×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="row g-2 mb-2 small">
            <div className="col-6">
              <label className="form-label">Order tax %</label>
              <select
                className="form-select form-select-sm"
                value={orderTaxRate}
                onChange={(e) => setOrderTaxRate(Number(e.target.value))}
              >
                <option value={0}>No tax</option>
                {(formData.taxes || []).map((t) => (
                  <option key={t.id} value={t.rate}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="col-6">
              <label className="form-label">Order discount</label>
              <input
                type="number"
                className="form-control form-control-sm"
                min={0}
                step={0.01}
                value={orderDiscount}
                onChange={(e) => setOrderDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
              />
            </div>
            <div className="col-6">
              <label className="form-label">Shipping</label>
              <input
                type="number"
                className="form-control form-control-sm"
                min={0}
                step={0.01}
                value={shippingCost}
                onChange={(e) => setShippingCost(e.target.value)}
              />
            </div>
          </div>

          <div className="border rounded p-2 mb-2 bg-light">
            <div className="d-flex justify-content-between small">
              <span>Items:</span>
              <span>{cart.length} ({totalQty})</span>
            </div>
            <div className="d-flex justify-content-between small">
              <span>Subtotal:</span>
              <span>{formatNum(subtotalCart)}</span>
            </div>
            <div className="d-flex justify-content-between small">
              <span>Order discount:</span>
              <span>{formatNum(orderDiscount)}</span>
            </div>
            <div className="d-flex justify-content-between small">
              <span>Tax:</span>
              <span>{formatNum(orderTaxAmount)}</span>
            </div>
            <div className="d-flex justify-content-between small">
              <span>Shipping:</span>
              <span>{formatNum(shippingCost)}</span>
            </div>
            <div className="d-flex justify-content-between fw-bold">
              <span>Grand total:</span>
              <span>{formatNum(grandTotal)}</span>
            </div>
          </div>

          <div className="d-flex gap-2">
            <button type="button" className="btn btn-primary" onClick={handlePay} disabled={cart.length === 0}>
              Pay
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => handleSubmitSale(true)} disabled={cart.length === 0}>
              Save as draft
            </button>
            <button type="button" className="btn btn-outline-danger" onClick={() => setCart([])}>
              Cancel
            </button>
          </div>
        </div>
      </div>

      {paymentModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Payment</h5>
                <button type="button" className="btn-close" onClick={() => setPaymentModal(false)} aria-label="Close" />
              </div>
              <div className="modal-body">
                <div className="mb-2">
                  <label className="form-label">Grand total</label>
                  <p className="fw-bold">{formatNum(grandTotal)}</p>
                </div>
                <div className="mb-2">
                  <label className="form-label">Paying amount</label>
                  <input
                    type="number"
                    className="form-control"
                    step="any"
                    min={0}
                    value={payingAmount}
                    onChange={(e) => setPayingAmount(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setPaymentModal(false)}>
                  Close
                </button>
                <button type="button" className="btn btn-primary" disabled={submitting} onClick={() => handleSubmitSale(false)}>
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pos;
