import React, { useState, useEffect, useMemo } from 'react';
import { faTimes, faPlus, faTrash, faEye } from '@fortawesome/free-solid-svg-icons';
import { api, msg } from '../../services';
import { FormModal, SafeFontAwesomeIcon } from '../../components';

const moduleName = 'Quotation List';
const DECIMAL = 2;

// Build product list from getProduct response (quotations: code, name, qty, is_embeded, imei_number)
function buildQuotationProductList(getProductData) {
  if (!Array.isArray(getProductData) || getProductData.length < 13) return [];
  const codes = getProductData[0] || [];
  const names = getProductData[1] || [];
  const imei_number = getProductData[12] || [];
  const is_embeded = getProductData[11] || [];
  const list = [];
  const len = codes.length;
  for (let i = 0; i < len; i++) {
    list.push({
      code: String(codes[i] ?? ''),
      name: String(names[i] ?? ''),
      key: `${codes[i]}|${names[i]}|${imei_number[i] ?? 'null'}|${is_embeded[i] ?? 0}`,
    });
  }
  return list;
}

// limsProductSearch response indices (quotation)
const P_NAME = 0, P_CODE = 1, P_PRICE = 2, P_TAX_RATE = 3, P_TAX_METHOD = 5;
const P_UNIT_NAME = 6, P_UNIT_OP = 7, P_UNIT_VAL = 8, P_PRODUCT_ID = 9, P_AVAIL_QTY = 15;

function calcQuotationRow(product, qty, discountPerUnit = 0) {
  const price = parseFloat(product[P_PRICE]) || 0;
  const taxRate = parseFloat(product[P_TAX_RATE]) || 0;
  const taxMethod = parseInt(product[P_TAX_METHOD], 10) || 0;
  const unitNameStr = product[P_UNIT_NAME] || 'n/a,';
  const unitOpStr = product[P_UNIT_OP] || 'n/a,';
  const unitValStr = product[P_UNIT_VAL] || 'n/a,';
  const unitNames = unitNameStr.split(',').filter(Boolean);
  const unitOps = unitOpStr.split(',').filter(Boolean);
  const unitVals = unitValStr.split(',').filter(Boolean);
  const op = unitOps[0] === '*' ? '*' : '/';
  const opVal = parseFloat(unitVals[0]) || 1;
  const rowProductPrice = op === '*' ? price * opVal : price / opVal;
  const saleUnit = unitNames[0] || 'n/a';
  const netUnitPrice = Math.max(0, rowProductPrice - discountPerUnit);
  let tax, subTotal;
  if (taxMethod === 1) {
    tax = netUnitPrice * qty * (taxRate / 100);
    subTotal = netUnitPrice * qty + tax;
  } else {
    const subTotalUnit = rowProductPrice - discountPerUnit;
    const netUnit = (100 / (100 + taxRate)) * subTotalUnit;
    tax = (subTotalUnit - netUnit) * qty;
    subTotal = subTotalUnit * qty;
  }
  const totalDiscount = discountPerUnit * qty;
  return {
    product_id: product[P_PRODUCT_ID],
    product_code: product[P_CODE],
    name: product[P_NAME],
    purchase_unit: saleUnit,
    qty,
    discount_per_unit: discountPerUnit,
    discount: totalDiscount,
    net_unit_price: taxMethod === 1 ? netUnitPrice : (100 / (100 + taxRate)) * (rowProductPrice - discountPerUnit),
    tax_rate: taxRate,
    tax,
    subtotal: subTotal,
    unit_operator: unitOpStr,
    unit_operation_value: unitValStr,
    tax_method: taxMethod,
    product_price: price,
    available_qty: parseFloat(product[P_AVAIL_QTY]) || 999,
  };
}

const getDefaultDates = () => {
  const end = new Date();
  const start = new Date(end.getFullYear() - 1, end.getMonth(), 1);
  return { starting_date: start.toISOString().slice(0, 10), ending_date: end.toISOString().slice(0, 10) };
};

const QuotationList = () => {
  const { starting_date: defStart, ending_date: defEnd } = getDefaultDates();
  const [filter, setFilter] = useState({
    starting_date: defStart,
    ending_date: defEnd,
    warehouse_id: '0',
  });
  const [entities, setEntities] = useState([]);
  const [formData, setFormData] = useState({ billers: [], suppliers: [], customers: [], warehouses: [], taxes: [] });
  const [showAddModal, setShowAddModal] = useState(false);
  const [detailsModal, setDetailsModal] = useState(false);
  const [details, setDetails] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [addForm, setAddForm] = useState({
    biller_id: '',
    supplier_id: '',
    customer_id: '',
    warehouse_id: '',
    order_tax_rate: '0',
    order_discount: '',
    shipping_cost: '',
    quotation_status: '1',
    note: '',
    productSearch: '',
  });
  const [addFormRows, setAddFormRows] = useState([]);
  const [addFormProductList, setAddFormProductList] = useState([]);
  const [addFormSubmitting, setAddFormSubmitting] = useState(false);
  const [addFormSearchLoading, setAddFormSearchLoading] = useState(false);

  useEffect(() => { fetchFormData(); }, []);
  useEffect(() => {
    fetchData();
  }, [filter.starting_date, filter.ending_date, filter.warehouse_id]);

  const fetchFormData = async () => {
    try {
      const res = await api.get('quotations/form-data');
      const data = res?.data;
      if (data?.status === 200 && data?.data) {
        setFormData(data.data);
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load form data');
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        starting_date: filter.starting_date,
        ending_date: filter.ending_date,
        warehouse_id: filter.warehouse_id,
      });
      const res = await api.get('quotations/list?' + params.toString());
      const data = res?.data;
      if (data?.status === 200 && Array.isArray(data?.data)) {
        setEntities(data.data);
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load quotations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value }));
  };

  const openDetails = async (row) => {
    setDetails(null);
    setDetailsModal(true);
    setDetailsLoading(true);
    try {
      const res = await api.get('quotations/details/' + row.id);
      const data = res?.data;
      if (data?.status === 200 && data?.data) {
        setDetails(data.data);
      } else {
        msg.error('Failed to load quotation details');
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load quotation details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => { setDetailsModal(false); setDetails(null); };

  const confirmDelete = (row) => { setItemToDelete(row); setDeleteDialog(true); };

  const handleDelete = async () => {
    if (!itemToDelete?.id) { setDeleteDialog(false); setItemToDelete(null); return; }
    try {
      const res = await api.delete('quotations/delete/' + itemToDelete.id);
      const data = res?.data;
      if (res?.status === 200 && data?.status === 200) {
        setEntities((prev) => prev.filter((e) => e.id !== itemToDelete.id));
        msg.success(data?.message || 'Quotation deleted');
      } else {
        msg.error(data?.message || 'Delete failed');
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Delete failed');
    }
    setDeleteDialog(false);
    setItemToDelete(null);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setAddFormRows([]);
    setAddFormProductList([]);
    fetchData();
  };

  useEffect(() => {
    if (showAddModal) {
      setAddForm((prev) => ({
        ...prev,
        biller_id: prev.biller_id || '',
        supplier_id: prev.supplier_id || '',
        customer_id: prev.customer_id || '',
        warehouse_id: prev.warehouse_id || '',
        order_tax_rate: '0',
        order_discount: '',
        shipping_cost: '',
        quotation_status: '1',
        note: '',
        productSearch: '',
      }));
      setAddFormRows([]);
    }
  }, [showAddModal]);

  useEffect(() => {
    if (!showAddModal || !addForm.warehouse_id) {
      setAddFormProductList([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('quotations/getproduct/' + addForm.warehouse_id);
        const data = res?.data;
        if (cancelled) return;
        if (Array.isArray(data)) {
          setAddFormProductList(buildQuotationProductList(data));
        } else {
          setAddFormProductList([]);
        }
      } catch (e) {
        if (!cancelled) setAddFormProductList([]);
      }
    })();
    return () => { cancelled = true; };
  }, [showAddModal, addForm.warehouse_id]);

  const addFormFilteredProducts = useMemo(() => {
    const term = (addForm.productSearch || '').toLowerCase().trim();
    if (!term) return addFormProductList.slice(0, 50);
    return addFormProductList.filter(
      (p) =>
        (p.code && p.code.toLowerCase().includes(term)) ||
        (p.name && p.name.toLowerCase().includes(term))
    ).slice(0, 50);
  }, [addFormProductList, addForm.productSearch]);

  const onAddFormProductSelect = async (item) => {
    if (!addForm.warehouse_id || !addForm.customer_id) {
      msg.error('Please select Warehouse and Customer first.');
      return;
    }
    const dataStr = item.key + '?' + addForm.customer_id + '?1';
    setAddFormSearchLoading(true);
    try {
      const res = await api.get('quotations/lims_product_search?data=' + encodeURIComponent(dataStr));
      const product = res?.data;
      if (!product || !Array.isArray(product) || product.length < 10) {
        msg.error('Product not found or invalid response.');
        return;
      }
      const existing = addFormRows.find((r) => String(r.product_code) === String(product[P_CODE]));
      let qty = 1;
      if (existing) {
        qty = (existing.qty || 0) + 1;
        setAddFormRows((prev) =>
          prev.map((r) =>
            r.product_code === product[P_CODE]
              ? calcQuotationRow(product, qty, r.discount_per_unit || 0)
              : r
          )
        );
      } else {
        setAddFormRows((prev) => [...prev, calcQuotationRow(product, 1, 0)]);
      }
      setAddForm((f) => ({ ...f, productSearch: '' }));
    } catch (e) {
      msg.error(e?.response?.data?.message || 'Failed to load product.');
    } finally {
      setAddFormSearchLoading(false);
    }
  };

  const onAddFormQtyChange = (index, newQty) => {
    const row = addFormRows[index];
    if (!row) return;
    const qty = Math.max(0.01, parseFloat(newQty) || 0);
    const updated = { ...row, qty, ...recalcQuotationRow(row, qty) };
    setAddFormRows((prev) => prev.map((r, i) => (i === index ? updated : r)));
  };

  function recalcQuotationRow(row, qty) {
    const discountPerUnit = row.discount_per_unit || 0;
    const rowProductPrice = row.product_price;
    const taxRate = row.tax_rate;
    const taxMethod = row.tax_method;
    const unitOpStr = row.unit_operator || '';
    const unitValStr = row.unit_operation_value || '';
    const unitOps = unitOpStr.split(',').filter(Boolean);
    const unitVals = unitValStr.split(',').filter(Boolean);
    const op = unitOps[0] === '*' ? '*' : '/';
    const opVal = parseFloat(unitVals[0]) || 1;
    const rowPrice = op === '*' ? rowProductPrice * opVal : rowProductPrice / opVal;
    const netUnitPrice = Math.max(0, rowPrice - discountPerUnit);
    let tax, subTotal;
    if (taxMethod === 1) {
      tax = netUnitPrice * qty * (taxRate / 100);
      subTotal = netUnitPrice * qty + tax;
    } else {
      const subTotalUnit = rowPrice - discountPerUnit;
      const netUnit = (100 / (100 + taxRate)) * subTotalUnit;
      tax = (subTotalUnit - netUnit) * qty;
      subTotal = subTotalUnit * qty;
    }
    return {
      discount: discountPerUnit * qty,
      net_unit_price: taxMethod === 1 ? netUnitPrice : (100 / (100 + taxRate)) * (rowPrice - discountPerUnit),
      tax,
      subtotal: subTotal,
    };
  }

  const removeAddFormRow = (index) => {
    setAddFormRows((prev) => prev.filter((_, i) => i !== index));
  };

  const addFormTotals = useMemo(() => {
    let totalQty = 0, totalDiscount = 0, totalTax = 0, totalPrice = 0;
    addFormRows.forEach((r) => {
      totalQty += parseFloat(r.qty) || 0;
      totalDiscount += parseFloat(r.discount) || 0;
      totalTax += parseFloat(r.tax) || 0;
      totalPrice += parseFloat(r.subtotal) || 0;
    });
    const orderTaxRate = parseFloat(addForm.order_tax_rate) || 0;
    const orderDiscount = parseFloat(addForm.order_discount) || 0;
    const shippingCost = parseFloat(addForm.shipping_cost) || 0;
    const orderTax = (totalPrice - orderDiscount) * (orderTaxRate / 100);
    const grandTotal = totalPrice - orderDiscount + orderTax + shippingCost;
    return { totalQty, totalDiscount, totalTax, totalPrice, orderTax, orderDiscount, shippingCost, grandTotal };
  }, [addFormRows, addForm.order_tax_rate, addForm.order_discount, addForm.shipping_cost]);

  const submitAddQuotation = async (e) => {
    e.preventDefault();
    if (!addForm.biller_id || !addForm.customer_id || !addForm.warehouse_id) {
      msg.error('Please select Biller, Customer and Warehouse.');
      return;
    }
    if (addFormRows.length === 0) {
      msg.error('Please add at least one product.');
      return;
    }
    setAddFormSubmitting(true);
    try {
      const payload = {
        biller_id: Number(addForm.biller_id),
        supplier_id: addForm.supplier_id ? Number(addForm.supplier_id) : null,
        customer_id: Number(addForm.customer_id),
        warehouse_id: Number(addForm.warehouse_id),
        order_tax_rate: parseFloat(addForm.order_tax_rate) || 0,
        order_discount: addFormTotals.orderDiscount,
        shipping_cost: addFormTotals.shippingCost,
        quotation_status: Number(addForm.quotation_status),
        note: addForm.note || '',
        product_id: addFormRows.map((r) => r.product_id),
        product_code: addFormRows.map((r) => r.product_code),
        qty: addFormRows.map((r) => r.qty),
        sale_unit: addFormRows.map((r) => r.purchase_unit),
        net_unit_price: addFormRows.map((r) => r.net_unit_price),
        discount: addFormRows.map((r) => r.discount),
        tax_rate: addFormRows.map((r) => r.tax_rate),
        tax: addFormRows.map((r) => r.tax),
        subtotal: addFormRows.map((r) => r.subtotal),
        total_qty: addFormTotals.totalQty,
        total_discount: addFormTotals.totalDiscount,
        total_tax: addFormTotals.totalTax,
        total_price: addFormTotals.totalPrice,
        order_tax: addFormTotals.orderTax,
        item: addFormRows.length,
        grand_total: addFormTotals.grandTotal,
      };
      const res = await api.post('quotations/store').values(payload);
      const data = res?.data;
      if (res?.status === 200 && data?.status === 200) {
        msg.success(data?.message || 'Quotation created.');
        closeAddModal();
      } else {
        msg.error(data?.message || 'Failed to create quotation.');
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || err?.message || 'Failed to create quotation.');
    } finally {
      setAddFormSubmitting(false);
    }
  };

  return (
    <div>
      <h5 className="text-center">{moduleName}</h5>
      <br />
      <div className="container-fluid">
        <div className="card mb-3">
          <div className="card-body">
            <form onSubmit={(e) => { e.preventDefault(); fetchData(); }} className="row align-items-end">
              <div className="col-md-2 form-group">
                <label className="font-weight-bold">Date (from)</label>
                <input type="date" name="starting_date" className="form-control" value={filter.starting_date} onChange={handleFilterChange} />
              </div>
              <div className="col-md-2 form-group">
                <label className="font-weight-bold">To</label>
                <input type="date" name="ending_date" className="form-control" value={filter.ending_date} onChange={handleFilterChange} />
              </div>
              <div className="col-md-2 form-group">
                <label className="font-weight-bold">Warehouse</label>
                <select name="warehouse_id" className="form-control" value={filter.warehouse_id} onChange={handleFilterChange}>
                  <option value="0">All</option>
                  {formData.warehouses.map((w) => (<option key={w.id} value={w.id}>{w.name}</option>))}
                </select>
              </div>
              <div className="col-md-2 form-group">
                <button type="submit" className="btn btn-primary">Submit</button>
              </div>
            </form>
          </div>
        </div>
        <button type="button" className="btn btn-info" onClick={() => setShowAddModal(true)}>
          <SafeFontAwesomeIcon icon={faPlus} className="mr-2" size="sm" /> Add Quotation
        </button>
      </div>

      {/* Add Quotation Modal */}
      <FormModal moduleName="Add Quotation" modalState={showAddModal} toggleFormModal={closeAddModal} width="95%" height="90vh">
        <form onSubmit={submitAddQuotation} className="modal-body" style={{ maxHeight: 'calc(90vh - 120px)', overflow: 'auto' }}>
          <p className="text-muted small">Fields marked with * are required.</p>
          <div className="row">
            <div className="col-md-6 form-group">
              <label>Biller *</label>
              <select className="form-control" value={addForm.biller_id} onChange={(e) => setAddForm((f) => ({ ...f, biller_id: e.target.value }))} required>
                <option value="">Select biller...</option>
                {formData.billers.map((b) => (<option key={b.id} value={b.id}>{b.name} ({b.company_name})</option>))}
              </select>
            </div>
            <div className="col-md-6 form-group">
              <label>Supplier</label>
              <select className="form-control" value={addForm.supplier_id} onChange={(e) => setAddForm((f) => ({ ...f, supplier_id: e.target.value }))}>
                <option value="">Select supplier...</option>
                {formData.suppliers.map((s) => (<option key={s.id} value={s.id}>{s.name} ({s.company_name})</option>))}
              </select>
            </div>
            <div className="col-md-6 form-group">
              <label>Customer *</label>
              <select className="form-control" value={addForm.customer_id} onChange={(e) => setAddForm((f) => ({ ...f, customer_id: e.target.value }))} required>
                <option value="">Select customer...</option>
                {formData.customers.map((c) => (<option key={c.id} value={c.id}>{c.name} ({c.phone_number})</option>))}
              </select>
            </div>
            <div className="col-md-6 form-group">
              <label>Warehouse *</label>
              <select className="form-control" value={addForm.warehouse_id} onChange={(e) => setAddForm((f) => ({ ...f, warehouse_id: e.target.value }))} required>
                <option value="">Select warehouse...</option>
                {formData.warehouses.map((w) => (<option key={w.id} value={w.id}>{w.name}</option>))}
              </select>
            </div>
          </div>
          <div className="row mt-3">
            <div className="col-md-12">
              <label>Select Product *</label>
              <div className="input-group">
                <input type="text" className="form-control" placeholder="Type product code or name and select below..." value={addForm.productSearch} onChange={(e) => setAddForm((f) => ({ ...f, productSearch: e.target.value }))} autoComplete="off" />
              </div>
              {addFormFilteredProducts.length > 0 && (
                <ul className="list-group mt-1" style={{ maxHeight: 180, overflow: 'auto' }}>
                  {addFormFilteredProducts.map((p, i) => (
                    <li key={i} className="list-group-item list-group-item-action" style={{ cursor: 'pointer' }} onClick={() => onAddFormProductSelect(p)}>
                      {p.code} — {p.name}
                    </li>
                  ))}
                </ul>
              )}
              {addFormSearchLoading && <span className="small text-muted">Loading...</span>}
            </div>
          </div>
          <div className="row mt-3">
            <div className="col-12">
              <h6>Order Table *</h6>
              <div className="table-responsive">
                <table className="table table-hover table-bordered table-sm">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Code</th>
                      <th>Qty</th>
                      <th>Net Unit Price</th>
                      <th>Discount</th>
                      <th>Tax</th>
                      <th>Subtotal</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {addFormRows.map((row, idx) => (
                      <tr key={idx}>
                        <td>{row.name}</td>
                        <td>{row.product_code}</td>
                        <td>
                          <input type="number" className="form-control form-control-sm" style={{ maxWidth: 80 }} min={0.01} step="any" value={row.qty} onChange={(e) => onAddFormQtyChange(idx, e.target.value)} />
                        </td>
                        <td className="text-right">{Number(row.net_unit_price).toFixed(DECIMAL)}</td>
                        <td className="text-right">{Number(row.discount).toFixed(DECIMAL)}</td>
                        <td className="text-right">{Number(row.tax).toFixed(DECIMAL)}</td>
                        <td className="text-right">{Number(row.subtotal).toFixed(DECIMAL)}</td>
                        <td>
                          <button type="button" className="btn btn-sm btn-danger" onClick={() => removeAddFormRow(idx)}>
                            <SafeFontAwesomeIcon icon={faTrash} size="sm" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="font-weight-bold">
                    <tr>
                      <td colSpan="2">Total</td>
                      <td>{addFormTotals.totalQty}</td>
                      <td></td>
                      <td className="text-right">{addFormTotals.totalDiscount.toFixed(DECIMAL)}</td>
                      <td className="text-right">{addFormTotals.totalTax.toFixed(DECIMAL)}</td>
                      <td className="text-right">{addFormTotals.totalPrice.toFixed(DECIMAL)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
          <div className="row mt-2">
            <div className="col-md-4 form-group">
              <label>Order Tax</label>
              <select className="form-control" value={addForm.order_tax_rate} onChange={(e) => setAddForm((f) => ({ ...f, order_tax_rate: e.target.value }))}>
                <option value="0">No Tax</option>
                {formData.taxes.map((t) => (<option key={t.id} value={t.rate}>{t.name}</option>))}
              </select>
            </div>
            <div className="col-md-4 form-group">
              <label>Order Discount</label>
              <input type="number" className="form-control" step="any" value={addForm.order_discount} onChange={(e) => setAddForm((f) => ({ ...f, order_discount: e.target.value }))} />
            </div>
            <div className="col-md-4 form-group">
              <label>Shipping Cost</label>
              <input type="number" className="form-control" step="any" value={addForm.shipping_cost} onChange={(e) => setAddForm((f) => ({ ...f, shipping_cost: e.target.value }))} />
            </div>
            <div className="col-md-4 form-group">
              <label>Status</label>
              <select className="form-control" value={addForm.quotation_status} onChange={(e) => setAddForm((f) => ({ ...f, quotation_status: e.target.value }))}>
                <option value="1">Pending</option>
                <option value="2">Sent</option>
              </select>
            </div>
            <div className="col-md-8 form-group">
              <label>Note</label>
              <textarea className="form-control" rows={2} value={addForm.note} onChange={(e) => setAddForm((f) => ({ ...f, note: e.target.value }))} />
            </div>
          </div>
          <div className="mb-2">
            <strong>Order Tax:</strong> {addFormTotals.orderTax.toFixed(DECIMAL)} &nbsp;|&nbsp;
            <strong>Grand Total:</strong> {addFormTotals.grandTotal.toFixed(DECIMAL)}
          </div>
          <div className="modal-footer border-top pt-2">
            <button type="button" className="btn btn-secondary" onClick={closeAddModal}>
              <SafeFontAwesomeIcon icon={faTimes} className="mr-2" size="sm" /> Close
            </button>
            <button type="submit" className="btn btn-primary" disabled={addFormSubmitting || addFormRows.length === 0}>
              {addFormSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </FormModal>

      {/* View Details Modal */}
      <FormModal moduleName="Quotation Details" modalState={detailsModal} toggleFormModal={closeDetails} width="800px">
        <div className="modal-body text-left">
          {detailsLoading ? (<div className="text-center p-4">Loading...</div>) : details ? (
            <>
              <div className="mb-3">
                <strong>Date:</strong> {details.quotation?.date} &nbsp;|&nbsp;
                <strong>Reference:</strong> {details.quotation?.reference_no} &nbsp;|&nbsp;
                <strong>Status:</strong> {details.quotation?.status}
              </div>
              <div className="row mb-3">
                <div className="col-md-6"><strong>Biller:</strong> {details.quotation?.biller}</div>
                <div className="col-md-6"><strong>Customer:</strong> {details.quotation?.customer}</div>
                <div className="col-md-6"><strong>Warehouse:</strong> {details.quotation?.warehouse}</div>
                <div className="col-md-6"><strong>Supplier:</strong> {details.quotation?.supplier || '—'}</div>
              </div>
              <table className="table table-bordered table-sm">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product</th>
                    <th>Batch</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Discount</th>
                    <th>Tax</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {details.products?.map((p, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{p.product_name} [{p.product_code}]</td>
                      <td>{p.batch_no}</td>
                      <td>{p.qty} {p.unit_code}</td>
                      <td className="text-right">{p.net_unit_price != null ? Number(p.net_unit_price).toFixed(DECIMAL) : '—'}</td>
                      <td className="text-right">{p.discount != null ? Number(p.discount).toFixed(DECIMAL) : '—'}</td>
                      <td className="text-right">{p.tax != null ? Number(p.tax).toFixed(DECIMAL) : '—'} ({p.tax_rate}%)</td>
                      <td className="text-right">{p.total != null ? Number(p.total).toFixed(DECIMAL) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-top pt-2">
                <strong>Total Discount:</strong> {details.quotation?.total_discount != null ? Number(details.quotation.total_discount).toFixed(DECIMAL) : '0'} &nbsp;|&nbsp;
                <strong>Total Tax:</strong> {details.quotation?.total_tax != null ? Number(details.quotation.total_tax).toFixed(DECIMAL) : '0'} &nbsp;|&nbsp;
                <strong>Order Tax:</strong> {details.quotation?.order_tax != null ? Number(details.quotation.order_tax).toFixed(DECIMAL) : '0'} &nbsp;|&nbsp;
                <strong>Order Discount:</strong> {details.quotation?.order_discount != null ? Number(details.quotation.order_discount).toFixed(DECIMAL) : '0'} &nbsp;|&nbsp;
                <strong>Shipping:</strong> {details.quotation?.shipping_cost != null ? Number(details.quotation.shipping_cost).toFixed(DECIMAL) : '0'} &nbsp;|&nbsp;
                <strong>Grand Total:</strong> {details.quotation?.grand_total != null ? Number(details.quotation.grand_total).toFixed(DECIMAL) : '0'}
              </div>
              {details.quotation?.note && (<div className="mt-2"><strong>Note:</strong> {details.quotation.note}</div>)}
              <div className="mt-2 small text-muted">
                <strong>Created by:</strong> {details.quotation?.created_by} ({details.quotation?.created_by_email})
              </div>
            </>
          ) : (<div className="text-center p-4">No data</div>)}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={closeDetails}>
            <SafeFontAwesomeIcon icon={faTimes} className="mr-2" size="sm" /> Close
          </button>
        </div>
      </FormModal>

      {/* Delete confirm */}
      <FormModal moduleName="Confirm delete" modalState={deleteDialog} toggleFormModal={() => { setDeleteDialog(false); setItemToDelete(null); }} width="420px">
        <div className="modal-body">
          <p>Are you sure you want to delete quotation <strong>"{itemToDelete?.reference_no}"</strong>?</p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={() => { setDeleteDialog(false); setItemToDelete(null); }}>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={handleDelete}>
            <SafeFontAwesomeIcon icon={faTrash} className="mr-2" size="sm" /> Delete
          </button>
        </div>
      </FormModal>

      <div className="table-responsive mt-3">
        {isLoading ? (<div className="text-center p-4">Loading...</div>) : (
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Date</th>
                <th>Reference No</th>
                <th>Warehouse</th>
                <th>Biller</th>
                <th>Customer</th>
                <th>Supplier</th>
                <th>Status</th>
                <th className="text-right">Grand Total</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {entities.map((row) => (
                <tr key={row.id}>
                  <td>{row.date ?? '—'}</td>
                  <td>{row.reference_no ?? '—'}</td>
                  <td>{row.warehouse ?? '—'}</td>
                  <td>{row.biller ?? '—'}</td>
                  <td>{row.customer ?? '—'}</td>
                  <td>{row.supplier ?? '—'}</td>
                  <td>{row.status ?? '—'}</td>
                  <td className="text-right">{row.grand_total != null ? Number(row.grand_total).toFixed(DECIMAL) : '—'}</td>
                  <td className="text-center">
                    <button type="button" className="btn btn-sm btn-link" onClick={() => openDetails(row)} title="View">
                      <SafeFontAwesomeIcon icon={faEye} size="sm" /> View
                    </button>
                    <button type="button" className="btn btn-sm btn-link text-danger" onClick={() => confirmDelete(row)} title="Delete">
                      <SafeFontAwesomeIcon icon={faTrash} size="sm" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default QuotationList;
