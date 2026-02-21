import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, msg } from '../../services';
import { SafeFontAwesomeIcon } from '../../components';
import { faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';

const DECIMAL_DEFAULT = 2;

// Purchase product search response: 0=name, 1=code, 2=cost, 3=tax_rate, 4=tax_name, 5=tax_method,
// 6=unit_name, 7=unit_operator, 8=unit_operation_value, 9=id, 10=is_batch, 11=is_imei + profit_margin, profit_margin_type, product_price
function rowFromProduct(product, qty = 1, decimal = DECIMAL_DEFAULT) {
  const cost = parseFloat(product[2]) || 0;
  const taxRate = parseFloat(product[3]) || 0;
  const taxMethod = parseInt(product[5], 10) || 0;
  const unitNameStr = (product[6] || '').toString();
  const unitOpStr = (product[7] || '').toString();
  const unitValStr = (product[8] || '').toString();
  const unitNames = unitNameStr.split(',').filter(Boolean);
  const unitOps = unitOpStr.split(',').filter(Boolean);
  const unitVals = unitValStr.split(',').filter(Boolean);
  const op = unitOps[0] === '*' ? '*' : '/';
  const opVal = parseFloat(unitVals[0]) || 1;
  const rowProductCost = op === '*' ? cost * opVal : cost / opVal;
  const purchaseUnit = unitNames[0] || '';

  const profitMargin = parseFloat(product.profit_margin) || 0;
  const profitMarginType = (product.profit_margin_type || 'percentage').toLowerCase();
  const productPrice = parseFloat(product.product_price) || 0;
  const discountPerUnit = 0;

  let netUnitCost, tax, subTotal, unitCost;
  if (taxMethod === 1) {
    netUnitCost = rowProductCost - discountPerUnit;
    tax = netUnitCost * qty * (taxRate / 100);
    unitCost = netUnitCost + (netUnitCost * taxRate / 100);
    subTotal = netUnitCost * qty + tax;
  } else {
    const subTotalUnit = rowProductCost - discountPerUnit;
    unitCost = subTotalUnit;
    netUnitCost = (100 / (100 + taxRate)) * subTotalUnit;
    tax = (subTotalUnit - netUnitCost) * qty;
    subTotal = subTotalUnit * qty;
  }

  return {
    product_id: product[9],
    product_code: product[1],
    name: product[0],
    qty,
    recieved: qty,
    purchase_unit: purchaseUnit,
    unit_cost: unitCost,
    net_unit_cost: netUnitCost,
    net_unit_margin: profitMargin,
    net_unit_margin_type: profitMarginType,
    net_unit_price: productPrice,
    discount: discountPerUnit * qty,
    discount_per_unit: discountPerUnit,
    tax_rate: taxRate,
    tax,
    subtotal: subTotal,
    unit_name: unitNameStr,
    unit_operator: unitOpStr,
    unit_operation_value: unitValStr,
    tax_method: taxMethod,
    product_cost: cost,
    is_batch: !!product[10],
    is_imei: !!product[11],
    batch_no: '',
    expired_date: '',
  };
}

function recalcRow(row, decimal = DECIMAL_DEFAULT) {
  const qty = parseFloat(row.qty) || 0;
  const recieved = parseFloat(row.recieved) || 0;
  const unitOpStr = (row.unit_operator || '').toString();
  const unitValStr = (row.unit_operation_value || '').toString();
  const unitOps = unitOpStr.split(',').filter(Boolean);
  const unitVals = unitValStr.split(',').filter(Boolean);
  const op = unitOps[0] === '*' ? '*' : '/';
  const opVal = parseFloat(unitVals[0]) || 1;
  const rowProductCost = op === '*' ? row.product_cost * opVal : row.product_cost / opVal;
  const discountPerUnit = parseFloat(row.discount_per_unit) || 0;
  const taxRate = parseFloat(row.tax_rate) || 0;
  const taxMethod = parseInt(row.tax_method, 10) || 0;

  let netUnitCost, tax, subTotal, unitCost;
  if (taxMethod === 1) {
    netUnitCost = rowProductCost - discountPerUnit;
    tax = netUnitCost * qty * (taxRate / 100);
    unitCost = netUnitCost + (netUnitCost * taxRate / 100);
    subTotal = netUnitCost * qty + tax;
  } else {
    const subTotalUnit = rowProductCost - discountPerUnit;
    unitCost = subTotalUnit;
    netUnitCost = (100 / (100 + taxRate)) * subTotalUnit;
    tax = (subTotalUnit - netUnitCost) * qty;
    subTotal = subTotalUnit * qty;
  }

  return {
    ...row,
    qty,
    recieved,
    net_unit_cost: netUnitCost,
    unit_cost: unitCost,
    discount: discountPerUnit * qty,
    discount_per_unit: discountPerUnit,
    tax,
    subtotal: subTotal,
    net_unit_margin: row.net_unit_margin,
    net_unit_margin_type: row.net_unit_margin_type || 'percentage',
    net_unit_price: row.net_unit_price,
  };
}

/** Get display (row) unit cost from row (product_cost in base unit → cost in purchase unit) */
function getRowProductCost(row) {
  const unitOpStr = (row.unit_operator || '').toString();
  const unitValStr = (row.unit_operation_value || '').toString();
  const unitOps = unitOpStr.split(',').filter(Boolean);
  const unitVals = unitValStr.split(',').filter(Boolean);
  const op = unitOps[0] === '*' ? '*' : '/';
  const opVal = parseFloat(unitVals[0]) || 1;
  return op === '*' ? row.product_cost * opVal : row.product_cost / opVal;
}

const PurchaseCreate = () => {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const isEditMode = Boolean(editId);
  const [formData, setFormData] = useState({
    warehouses: [],
    suppliers: [],
    taxes: [],
    currencies: [],
    accounts: [],
    decimal: DECIMAL_DEFAULT,
    date_format: 'Y-m-d',
    default_currency: null,
  });
  const [loading, setLoading] = useState(true);
  const [productCodes, setProductCodes] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [editRowIndex, setEditRowIndex] = useState(null);
  const [editModal, setEditModal] = useState({
    qty: '',
    discount: '',
    unit_cost: '',
    profit_margin: '',
    profit_margin_type: 'percentage',
    product_price: '',
    tax_rate_index: 0,
    unit_index: 0,
  });
  const documentInputRef = React.useRef(null);
  const [initialPaidAmount, setInitialPaidAmount] = useState(0);

  const [form, setForm] = useState({
    created_at: new Date().toISOString().slice(0, 10),
    reference_no: '',
    warehouse_id: '',
    supplier_id: '',
    status: '1',
    currency_id: '',
    exchange_rate: '1',
    order_tax_rate: '0',
    order_discount: '',
    shipping_cost: '',
    payment_status: '1',
    account_id: '',
    paid_by_id: '1',
    paying_amount: '',
    amount: '',
    payment_receiver: '',
    payment_note: '',
    document: null,
    note: '',
  });

  const decimal = formData.decimal ?? DECIMAL_DEFAULT;

  useEffect(() => {
    (async () => {
      try {
        const [resF, resP] = await Promise.all([
          api.get('purchase-create/form-data'),
          api.get('purchase-create/product-codes'),
        ]);
        const dataF = resF?.data;
        const dataP = resP?.data;
        if (dataF?.status === 200 && dataF?.data) {
          setFormData((prev) => ({ ...prev, ...dataF.data }));
          const def = dataF.data.default_currency;
          if (def) {
            setForm((f) => ({
              ...f,
              currency_id: String(def.id),
              exchange_rate: String(def.exchange_rate),
            }));
          }
          const wh = dataF.data.warehouses?.[0];
          if (wh) setForm((f) => ({ ...f, warehouse_id: String(wh.id) }));
          const acc = dataF.data.accounts?.find((a) => a.is_default) || dataF.data.accounts?.[0];
          if (acc) setForm((f) => ({ ...f, account_id: String(acc.id) }));
        }
        if (dataP?.status === 200 && Array.isArray(dataP?.data)) {
          setProductCodes(dataP.data);
        }
      } catch (e) {
        msg.error(e?.response?.data?.message || 'Failed to load form data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!editId || loading) return;
    (async () => {
      try {
        const res = await api.get(`purchase-create/edit-data/${editId}`);
        const data = res?.data?.data;
        if (!data?.purchase || !Array.isArray(data?.rows)) {
          msg.error('Invalid edit data');
          return;
        }
        const p = data.purchase;
        setForm((f) => ({
          ...f,
          created_at: p.created_at?.slice(0, 10) || f.created_at,
          reference_no: p.reference_no ?? f.reference_no,
          warehouse_id: p.warehouse_id != null ? String(p.warehouse_id) : f.warehouse_id,
          supplier_id: p.supplier_id != null ? String(p.supplier_id) : f.supplier_id,
          status: p.status != null ? String(p.status) : f.status,
          currency_id: p.currency_id != null ? String(p.currency_id) : f.currency_id,
          exchange_rate: p.exchange_rate != null ? String(p.exchange_rate) : f.exchange_rate,
          order_tax_rate: p.order_tax_rate != null ? String(p.order_tax_rate) : f.order_tax_rate,
          order_discount: p.order_discount != null ? String(p.order_discount) : f.order_discount,
          shipping_cost: p.shipping_cost != null ? String(p.shipping_cost) : f.shipping_cost,
          payment_status: p.payment_status != null ? String(p.payment_status) : f.payment_status,
          account_id: p.account_id != null ? String(p.account_id) : f.account_id,
          note: p.note ?? f.note,
        }));
        setInitialPaidAmount(parseFloat(p.paid_amount) || 0);
        setRows(data.rows.map((r) => ({
          ...r,
          qty: Number(r.qty),
          recieved: Number(r.recieved),
        })));
      } catch (e) {
        msg.error(e?.response?.data?.message || 'Failed to load purchase');
      }
    })();
  }, [editId, loading]);

  const filteredProducts = useMemo(() => {
    const term = (productSearch || '').toLowerCase().trim();
    if (!term) return productCodes.slice(0, 80);
    return productCodes.filter(
      (p) =>
        (p.code && p.code.toLowerCase().includes(term)) ||
        (p.name && p.name.toLowerCase().includes(term))
    ).slice(0, 80);
  }, [productCodes, productSearch]);

  const onProductSelect = async (item) => {
    if (!form.warehouse_id) {
      msg.error('Please select Warehouse first.');
      return;
    }
    setSearchLoading(true);
    try {
      const res = await api.get('purchase-create/lims_product_search?data=' + encodeURIComponent(item.key));
      const product = res?.data;
      if (!product || typeof product !== 'object') {
        msg.error('Product not found or invalid response.');
        return;
      }
      const combined = [];
      for (let i = 0; i <= 11; i++) combined[i] = product[i] ?? product[String(i)];
      combined.profit_margin = product.profit_margin;
      combined.profit_margin_type = product.profit_margin_type;
      combined.product_price = product.product_price;

      const existing = rows.find((r) => String(r.product_code) === String(combined[1]));
      if (existing) {
        const idx = rows.findIndex((r) => String(r.product_code) === String(combined[1]));
        const newQty = (parseFloat(existing.qty) || 0) + 1;
        const newRow = rowFromProduct(combined, newQty, decimal);
        newRow.recieved = form.status === '1' || form.status === '2' ? newQty : 0;
        setRows((prev) => prev.map((r, i) => (i === idx ? recalcRow({ ...newRow, discount_per_unit: r.discount_per_unit }, decimal) : r)));
      } else {
        const newRow = rowFromProduct(combined, 1, decimal);
        newRow.recieved = form.status === '1' || form.status === '2' ? 1 : 0;
        setRows((prev) => [...prev, newRow]);
      }
      setProductSearch('');
    } catch (e) {
      msg.error(e?.response?.data?.message || 'Failed to load product.');
    } finally {
      setSearchLoading(false);
    }
  };

  const onRowQtyChange = (index, value) => {
    const qty = Math.max(0, parseFloat(value) || 0);
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== index) return r;
        const updated = { ...r, qty };
        if (form.status === '1' || form.status === '2') updated.recieved = qty;
        return recalcRow(updated, decimal);
      })
    );
  };

  const onRowReceivedChange = (index, value) => {
    const recieved = Math.max(0, parseFloat(value) || 0);
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, recieved } : r)));
  };

  const removeRow = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
    if (editRowIndex === index) setEditRowIndex(null);
    else if (editRowIndex != null && editRowIndex > index) setEditRowIndex(editRowIndex - 1);
  };

  const taxListForEdit = useMemo(() => {
    const list = [{ rate: 0, name: 'No Tax' }];
    (formData.taxes || []).forEach((t) => list.push({ rate: parseFloat(t.rate) || 0, name: t.name }));
    return list;
  }, [formData.taxes]);

  const openEditRow = (index) => {
    const row = rows[index];
    if (!row) return;
    const rowCost = getRowProductCost(row);
    const unitNames = (row.unit_name || '').toString().split(',').filter(Boolean);
    setEditModal({
      qty: row.qty,
      discount: (row.discount_per_unit ?? row.discount / (parseFloat(row.qty) || 1)) || 0,
      unit_cost: rowCost,
      profit_margin: row.net_unit_margin ?? 0,
      profit_margin_type: row.net_unit_margin_type || 'percentage',
      product_price: row.net_unit_price ?? 0,
      tax_rate_index: taxListForEdit.findIndex((t) => Math.abs(parseFloat(t.rate) - parseFloat(row.tax_rate)) < 0.01) >= 0 ? taxListForEdit.findIndex((t) => Math.abs(parseFloat(t.rate) - parseFloat(row.tax_rate)) < 0.01) : 0,
      unit_index: 0,
      unit_names: unitNames,
    });
    setEditRowIndex(index);
  };

  const closeEditModal = () => setEditRowIndex(null);

  const recalcEditPrice = () => {
    setEditModal((m) => {
      const cost = parseFloat(m.unit_cost) || 0;
      const margin = parseFloat(m.profit_margin) || 0;
      const type = m.profit_margin_type || 'percentage';
      let price = 0;
      if (type === 'percentage') price = cost + (cost * margin / 100);
      else price = cost + margin;
      return { ...m, product_price: price ? Number(price.toFixed(decimal)) : 0 };
    });
  };

  const recalcEditMargin = () => {
    setEditModal((m) => {
      const cost = parseFloat(m.unit_cost) || 0;
      const price = parseFloat(m.product_price) || 0;
      const type = m.profit_margin_type || 'percentage';
      let margin = 0;
      if (cost <= 0) return m;
      if (type === 'percentage') margin = ((price - cost) / cost) * 100;
      else margin = price - cost;
      return { ...m, profit_margin: margin ? Number(margin.toFixed(decimal)) : 0 };
    });
  };

  const applyEditRow = () => {
    if (editRowIndex == null || !rows[editRowIndex]) return;
    const row = rows[editRowIndex];
    const unitOpStr = (row.unit_operator || '').toString();
    const unitValStr = (row.unit_operation_value || '').toString();
    const unitOps = unitOpStr.split(',').filter(Boolean);
    const unitVals = unitValStr.split(',').filter(Boolean);
    const op = unitOps[0] === '*' ? '*' : '/';
    const opVal = parseFloat(unitVals[0]) || 1;
    const editUnitCost = parseFloat(editModal.unit_cost) || 0;
    const baseCost = op === '*' ? editUnitCost / opVal : editUnitCost * opVal;
    const taxRate = taxListForEdit[editModal.tax_rate_index] ? taxListForEdit[editModal.tax_rate_index].rate : 0;
    const unitNames = editModal.unit_names || (row.unit_name || '').toString().split(',').filter(Boolean);
    const chosenName = unitNames[editModal.unit_index];
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== editRowIndex) return r;
        const updated = {
          ...r,
          qty: parseFloat(editModal.qty) || 0,
          recieved: form.status === '1' || form.status === '2' ? (parseFloat(editModal.qty) || 0) : r.recieved,
          product_cost: baseCost,
          net_unit_margin: parseFloat(editModal.profit_margin) || 0,
          net_unit_margin_type: editModal.profit_margin_type || 'percentage',
          net_unit_price: parseFloat(editModal.product_price) || 0,
          discount_per_unit: parseFloat(editModal.discount) || 0,
          tax_rate: taxRate,
          purchase_unit: chosenName || r.purchase_unit,
        };
        return recalcRow(updated, decimal);
      })
    );
    closeEditModal();
  };

  const totals = useMemo(() => {
    let totalQty = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let totalCost = 0;
    rows.forEach((r) => {
      totalQty += parseFloat(r.qty) || 0;
      totalDiscount += parseFloat(r.discount) || 0;
      totalTax += parseFloat(r.tax) || 0;
      totalCost += parseFloat(r.subtotal) || 0;
    });
    const orderDiscount = parseFloat(form.order_discount) || 0;
    const shipping = parseFloat(form.shipping_cost) || 0;
    const orderTaxRate = parseFloat(form.order_tax_rate) || 0;
    const orderTax = (totalCost - orderDiscount) * (orderTaxRate / 100);
    const grandTotal = totalCost + orderTax + shipping - orderDiscount;
    return {
      total_qty: totalQty,
      total_discount: totalDiscount,
      total_tax: totalTax,
      total_cost: totalCost,
      order_tax: orderTax,
      order_discount: orderDiscount,
      shipping_cost: shipping,
      grand_total: grandTotal,
    };
  }, [rows, form.order_discount, form.shipping_cost, form.order_tax_rate]);

  const showPayment = form.payment_status === '3' || form.payment_status === '4';
  const isPaid = form.payment_status === '4';

  useEffect(() => {
    if (isPaid) {
      setForm((f) => ({
        ...f,
        paying_amount: String(totals.grand_total.toFixed(decimal)),
        amount: String(totals.grand_total.toFixed(decimal)),
      }));
    }
  }, [isPaid, totals.grand_total, decimal]);

  const handleCurrencyChange = (e) => {
    const id = e.target.value;
    const cur = formData.currencies.find((c) => String(c.id) === id);
    if (cur) {
      setForm((f) => ({ ...f, currency_id: id, exchange_rate: String(cur.exchange_rate) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.warehouse_id) {
      msg.error('Please select Warehouse.');
      return;
    }
    if (rows.length === 0) {
      msg.error('Please insert product to order table!');
      return;
    }
    if (form.status !== '1') {
      const hasDifferent = rows.some((r) => String(r.qty) !== String(r.recieved));
      if (!hasDifferent) {
        msg.error('Quantity and Received value are the same. Please change Purchase Status or Received value.');
        return;
      }
    }
    if (showPayment && !form.account_id) {
      msg.error('Please select Account when payment status is Partial or Paid.');
      return;
    }
    const payingAmt = parseFloat(form.paying_amount) || 0;
    const paidAmt = parseFloat(form.amount) || 0;
    if (showPayment && paidAmt > payingAmt) {
      msg.error('Paying amount cannot be bigger than received amount.');
      return;
    }
    if (showPayment && paidAmt > totals.grand_total) {
      msg.error('Paying amount cannot be bigger than grand total.');
      return;
    }
    if (showPayment && !isPaid && paidAmt <= 0) {
      msg.error('Paying amount must be greater than 0.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        created_at: form.created_at,
        reference_no: form.reference_no || undefined,
        warehouse_id: Number(form.warehouse_id),
        supplier_id: form.supplier_id ? Number(form.supplier_id) : null,
        status: Number(form.status),
        currency_id: form.currency_id ? Number(form.currency_id) : null,
        exchange_rate: form.exchange_rate ? parseFloat(form.exchange_rate) : 1,
        product_id: rows.map((r) => r.product_id),
        product_code: rows.map((r) => r.product_code),
        qty: rows.map((r) => r.qty),
        recieved: rows.map((r) => r.recieved),
        purchase_unit: rows.map((r) => r.purchase_unit),
        unit_cost: rows.map((r) => r.unit_cost),
        net_unit_cost: rows.map((r) => r.net_unit_cost),
        net_unit_margin: rows.map((r) => r.net_unit_margin),
        net_unit_margin_type: rows.map((r) => r.net_unit_margin_type || 'percentage'),
        net_unit_price: rows.map((r) => r.net_unit_price),
        discount: rows.map((r) => r.discount),
        tax_rate: rows.map((r) => r.tax_rate),
        tax: rows.map((r) => r.tax),
        subtotal: rows.map((r) => r.subtotal),
        batch_no: rows.map((r) => r.batch_no || ''),
        expired_date: rows.map((r) => r.expired_date || ''),
        imei_number: rows.map((r) => r.imei_number || ''),
        total_qty: totals.total_qty,
        total_discount: totals.total_discount,
        total_tax: totals.total_tax,
        total_cost: totals.total_cost,
        item: rows.length,
        order_tax_rate: parseFloat(form.order_tax_rate) || 0,
        order_tax: totals.order_tax,
        order_discount: totals.order_discount,
        shipping_cost: totals.shipping_cost,
        grand_total: totals.grand_total,
        payment_status: Number(form.payment_status),
        note: form.note || '',
      };
      if (showPayment) {
        payload.account_id = Number(form.account_id);
        payload.paid_by_id = [Number(form.paid_by_id)];
        payload.paying_amount = [parseFloat(form.paying_amount) || 0];
        payload.amount = [parseFloat(form.amount) || 0];
        payload.payment_note = form.payment_note || '';
        payload.paid_amount = isPaid ? totals.grand_total : (parseFloat(form.amount) || 0);
        payload.payment_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
      } else {
        payload.paid_amount = isEditMode ? initialPaidAmount : 0;
      }
      const isUpdate = isEditMode && editId;
      const res = isUpdate
        ? await api.put('purchase-create/update', editId).values(payload)
        : await api.post('purchase-create/store').values(payload);
      const data = res?.data;
      if (res?.status === 200 && data?.status === 200) {
        msg.success(data?.message || (isUpdate ? 'Purchase updated successfully.' : 'Purchase created successfully.'));
        navigate(-1);
      } else {
        msg.error(data?.message || res?.data?.message || (isUpdate ? 'Failed to update purchase.' : 'Failed to create purchase.'));
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || err?.message || (isEditMode ? 'Failed to update purchase.' : 'Failed to create purchase.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <span className="spinner-border text-primary" /> Loading...
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <h4 className="mb-3">{isEditMode ? 'Update Purchase' : 'Add Purchase'}</h4>
      <p className="text-muted small">Fields marked with * are required.</p>
      <form onSubmit={handleSubmit}>
        <div className="card mb-3">
          <div className="card-body">
            <div className="row">
              <div className="col-md-4 form-group">
                <label>Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.created_at}
                  onChange={(e) => setForm((f) => ({ ...f, created_at: e.target.value }))}
                />
              </div>
              <div className="col-md-4 form-group">
                <label>Reference No</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.reference_no}
                  onChange={(e) => setForm((f) => ({ ...f, reference_no: e.target.value }))}
                />
              </div>
              <div className="col-md-4 form-group">
                <label>Warehouse *</label>
                <select
                  className="form-control"
                  value={form.warehouse_id}
                  onChange={(e) => setForm((f) => ({ ...f, warehouse_id: e.target.value }))}
                  required
                >
                  <option value="">Select warehouse...</option>
                  {formData.warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4 form-group">
                <label>Supplier</label>
                <select
                  className="form-control"
                  value={form.supplier_id}
                  onChange={(e) => setForm((f) => ({ ...f, supplier_id: e.target.value }))}
                >
                  <option value="">Select supplier...</option>
                  {formData.suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.company_name})</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4 form-group">
                <label>Purchase Status</label>
                <select
                  className="form-control"
                  value={form.status}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm((f) => ({ ...f, status: v }));
                    if (v === '1' || v === '2') {
                      setRows((prev) => prev.map((r) => ({ ...r, recieved: r.qty })));
                    } else {
                      setRows((prev) => prev.map((r) => ({ ...r, recieved: 0 })));
                    }
                  }}
                >
                  <option value="1">Recieved</option>
                  <option value="2">Partial</option>
                  <option value="3">Pending</option>
                  <option value="4">Ordered</option>
                </select>
              </div>
              <div className="col-md-2 form-group">
                <label>Currency *</label>
                <select
                  className="form-control"
                  value={form.currency_id}
                  onChange={handleCurrencyChange}
                >
                  {formData.currencies.map((c) => (
                    <option key={c.id} value={c.id} data-rate={c.exchange_rate}>{c.code}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-2 form-group">
                <label>Exchange Rate *</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.exchange_rate}
                  onChange={(e) => setForm((f) => ({ ...f, exchange_rate: e.target.value }))}
                />
              </div>
              <div className="col-md-4 form-group">
                <label>Attach Document</label>
                <input
                  type="file"
                  className="form-control"
                  ref={documentInputRef}
                  accept=".jpg,.jpeg,.png,.gif,.pdf,.csv,.docx,.xlsx,.txt"
                />
                <small className="text-muted">jpg, jpeg, png, gif, pdf, csv, docx, xlsx, txt</small>
              </div>
            </div>

            <div className="row mt-3">
              <div className="col-md-12">
                <label>Select Product</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Type product code or name and select..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    onFocus={() => setProductSearch(productSearch)}
                    list="purchase-product-list"
                  />
                  <datalist id="purchase-product-list">
                    {filteredProducts.map((p) => (
                      <option key={p.key} value={p.key} label={`${p.code} - ${p.name}`} />
                    ))}
                  </datalist>
                  <div className="input-group-append">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        const sel = filteredProducts[0];
                        if (sel) onProductSelect(sel);
                      }}
                      disabled={searchLoading || filteredProducts.length === 0}
                    >
                      {searchLoading ? <span className="spinner-border spinner-border-sm" /> : <SafeFontAwesomeIcon icon={faPlus} />}
                    </button>
                  </div>
                </div>
                {productSearch && filteredProducts.length > 0 && (
                  <ul className="list-group mt-1" style={{ maxHeight: 200, overflow: 'auto' }}>
                    {filteredProducts.slice(0, 20).map((p) => (
                      <li
                        key={p.key}
                        className="list-group-item list-group-item-action"
                        style={{ cursor: 'pointer' }}
                        onClick={() => onProductSelect(p)}
                      >
                        {p.code} - {p.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-body">
            <h5>Order Table *</h5>
            <div className="table-responsive">
              <table className="table table-hover table-bordered">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    {(form.status === '1' || form.status === '2') && <th>Received</th>}
                    <th>Net Unit Cost</th>
                    <th>Profit Margin</th>
                    <th>Margin Type</th>
                    <th>Product Price</th>
                    <th>Discount</th>
                    <th>Tax</th>
                    <th>Subtotal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr key={idx}>
                      <td>
                        {r.name} ({r.product_code}){' '}
                        <button type="button" className="btn btn-link btn-sm p-0" onClick={() => openEditRow(idx)} title="Edit row">
                          <i className="dripicons-document-edit" />
                        </button>
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          style={{ width: 70 }}
                          value={r.qty}
                          onChange={(e) => onRowQtyChange(idx, e.target.value)}
                          step="any"
                          min="0"
                        />
                      </td>
                      {(form.status === '1' || form.status === '2') && (
                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            style={{ width: 70 }}
                            value={r.recieved}
                            onChange={(e) => onRowReceivedChange(idx, e.target.value)}
                            step="any"
                            min="0"
                          />
                        </td>
                      )}
                      <td>{Number(r.net_unit_cost).toFixed(decimal)}</td>
                      <td>{Number(r.net_unit_margin).toFixed(decimal)}</td>
                      <td>{r.net_unit_margin_type}</td>
                      <td>{Number(r.net_unit_price).toFixed(decimal)}</td>
                      <td>{Number(r.discount).toFixed(decimal)}</td>
                      <td>{Number(r.tax).toFixed(decimal)}</td>
                      <td>{Number(r.subtotal).toFixed(decimal)}</td>
                      <td>
                        <button type="button" className="btn btn-sm btn-danger" onClick={() => removeRow(idx)}>
                          <SafeFontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-weight-bold">
                    <td>Total</td>
                    <td>{totals.total_qty.toFixed(decimal)}</td>
                    {(form.status === '1' || form.status === '2') && <td></td>}
                    <td colSpan={4}></td>
                    <td>{totals.total_discount.toFixed(decimal)}</td>
                    <td>{totals.total_tax.toFixed(decimal)}</td>
                    <td>{totals.total_cost.toFixed(decimal)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-body">
            <div className="row">
              <div className="col-md-4 form-group">
                <label>Order Tax</label>
                <select
                  className="form-control"
                  value={form.order_tax_rate}
                  onChange={(e) => setForm((f) => ({ ...f, order_tax_rate: e.target.value }))}
                >
                  <option value="0">No Tax</option>
                  {formData.taxes.map((t) => (
                    <option key={t.id} value={t.rate}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4 form-group">
                <label>Order Discount</label>
                <input
                  type="number"
                  className="form-control"
                  step="any"
                  value={form.order_discount}
                  onChange={(e) => setForm((f) => ({ ...f, order_discount: e.target.value }))}
                />
              </div>
              <div className="col-md-4 form-group">
                <label>Shipping Cost</label>
                <input
                  type="number"
                  className="form-control"
                  step="any"
                  value={form.shipping_cost}
                  onChange={(e) => setForm((f) => ({ ...f, shipping_cost: e.target.value }))}
                />
              </div>
            </div>
            <div className="row">
              <div className="col-md-4 form-group">
                <label>Payment Status *</label>
                <select
                  className="form-control"
                  value={form.payment_status}
                  onChange={(e) => setForm((f) => ({ ...f, payment_status: e.target.value }))}
                >
                  <option value="1">Due</option>
                  <option value="3">Partial</option>
                  <option value="4">Paid</option>
                </select>
              </div>
              {showPayment && (
                <>
                  <div className="col-md-4 form-group">
                    <label>Account</label>
                    <select
                      className="form-control"
                      value={form.account_id}
                      onChange={(e) => setForm((f) => ({ ...f, account_id: e.target.value }))}
                    >
                      {formData.accounts.map((a) => (
                        <option key={a.id} value={a.id}>{a.name} [{a.account_no}]</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4 form-group">
                    <label>Paid By</label>
                    <select
                      className="form-control"
                      value={form.paid_by_id}
                      onChange={(e) => setForm((f) => ({ ...f, paid_by_id: e.target.value }))}
                    >
                      <option value="1">Cash</option>
                      <option value="3">Credit Card</option>
                      <option value="4">Cheque</option>
                    </select>
                  </div>
                  <div className="col-md-4 form-group">
                    <label>Received Amount</label>
                    <input
                      type="number"
                      className="form-control"
                      step="any"
                      value={form.paying_amount}
                      onChange={(e) => setForm((f) => ({ ...f, paying_amount: e.target.value }))}
                      readOnly={isPaid}
                    />
                  </div>
                  <div className="col-md-4 form-group">
                    <label>Paying Amount</label>
                    <input
                      type="number"
                      className="form-control"
                      step="any"
                      value={form.amount}
                      onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                      readOnly={isPaid}
                    />
                  </div>
                  <div className="col-md-4 form-group">
                    <label>Payment Receiver</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.payment_receiver || ''}
                      onChange={(e) => setForm((f) => ({ ...f, payment_receiver: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-4 form-group">
                    <label>Change</label>
                    <p className="form-control-plaintext mb-0">
                      {((parseFloat(form.paying_amount) || 0) - (parseFloat(form.amount) || 0)).toFixed(decimal)}
                    </p>
                  </div>
                  <div className="col-md-4 form-group">
                    <label>Payment Note</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.payment_note}
                      onChange={(e) => setForm((f) => ({ ...f, payment_note: e.target.value }))}
                    />
                  </div>
                </>
              )}
            </div>
            <div className="row mt-2">
              <div className="col-md-12 form-group">
                <label>Note</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-3">
          <table className="table table-bordered table-sm">
            <tbody>
              <tr>
                <td><strong>Items</strong> {rows.length} ({totals.total_qty.toFixed(decimal)})</td>
                <td><strong>Total</strong> {totals.total_cost.toFixed(decimal)}</td>
                <td><strong>Order Tax</strong> {totals.order_tax.toFixed(decimal)}</td>
                <td><strong>Order Discount</strong> {totals.order_discount.toFixed(decimal)}</td>
                <td><strong>Shipping</strong> {totals.shipping_cost.toFixed(decimal)}</td>
                <td><strong>Grand Total</strong> {totals.grand_total.toFixed(decimal)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {editRowIndex != null && rows[editRowIndex] && (
          <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    Edit: {rows[editRowIndex].name} ({rows[editRowIndex].product_code})
                  </h5>
                  <button type="button" className="close" onClick={closeEditModal} aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                  </button>
                </div>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-4 form-group">
                      <label>Quantity</label>
                      <input
                        type="number"
                        className="form-control"
                        step="any"
                        value={editModal.qty}
                        onChange={(e) => setEditModal((m) => ({ ...m, qty: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-4 form-group">
                      <label>Unit Discount</label>
                      <input
                        type="number"
                        className="form-control"
                        step="0.01"
                        value={editModal.discount}
                        onChange={(e) => setEditModal((m) => ({ ...m, discount: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-4 form-group">
                      <label>Unit Cost</label>
                      <input
                        type="number"
                        className="form-control"
                        step="0.01"
                        value={editModal.unit_cost}
                        onChange={(e) => {
                          setEditModal((m) => ({ ...m, unit_cost: e.target.value }));
                          setTimeout(recalcEditPrice, 0);
                        }}
                      />
                    </div>
                    <div className="col-md-4 form-group">
                      <label>Profit Margin Type</label>
                      <select
                        className="form-control"
                        value={editModal.profit_margin_type}
                        onChange={(e) => {
                          setEditModal((m) => ({ ...m, profit_margin_type: e.target.value }));
                          setTimeout(recalcEditPrice, 0);
                        }}
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="flat">Flat</option>
                      </select>
                    </div>
                    <div className="col-md-4 form-group">
                      <label>Profit Margin</label>
                      <input
                        type="number"
                        className="form-control"
                        step="0.01"
                        value={editModal.profit_margin}
                        onChange={(e) => {
                          setEditModal((m) => ({ ...m, profit_margin: e.target.value }));
                          setTimeout(recalcEditPrice, 0);
                        }}
                      />
                    </div>
                    <div className="col-md-4 form-group">
                      <label>Product Price</label>
                      <input
                        type="number"
                        className="form-control"
                        step="0.01"
                        value={editModal.product_price}
                        onChange={(e) => {
                          setEditModal((m) => ({ ...m, product_price: e.target.value }));
                          setTimeout(recalcEditMargin, 0);
                        }}
                      />
                    </div>
                    <div className="col-md-4 form-group">
                      <label>Tax Rate</label>
                      <select
                        className="form-control"
                        value={editModal.tax_rate_index}
                        onChange={(e) => setEditModal((m) => ({ ...m, tax_rate_index: parseInt(e.target.value, 10) }))}
                      >
                        {taxListForEdit.map((t, i) => (
                          <option key={i} value={i}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4 form-group">
                      <label>Product Unit</label>
                      <select
                        className="form-control"
                        value={editModal.unit_index}
                        onChange={(e) => setEditModal((m) => ({ ...m, unit_index: parseInt(e.target.value, 10) }))}
                      >
                        {(editModal.unit_names || []).map((name, i) => (
                          <option key={i} value={i}>{name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeEditModal}>Cancel</button>
                  <button type="button" className="btn btn-primary" onClick={applyEditRow}>Update</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="form-group">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? <span className="spinner-border spinner-border-sm mr-1" /> : null}
            Submit
          </button>
          <button type="button" className="btn btn-secondary ml-2" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default PurchaseCreate;
