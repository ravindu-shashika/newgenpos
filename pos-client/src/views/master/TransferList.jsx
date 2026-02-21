import React, { useState, useEffect, useMemo } from 'react';
import { faTimes, faPlus, faTrash, faEye } from '@fortawesome/free-solid-svg-icons';
import { api, msg } from '../../services';
import { FormModal, SafeFontAwesomeIcon } from '../../components';

const moduleName = 'Transfer List';
const DECIMAL = 2;

// Build product list for autocomplete from getProduct response (array of arrays)
function buildProductList(getProductData) {
  if (!Array.isArray(getProductData) || getProductData.length < 3) return [];
  const codes = getProductData[0] || [];
  const names = getProductData[1] || [];
  const qtys = getProductData[2] || [];
  const list = [];
  const len = Math.min(codes.length, names.length, qtys.length);
  for (let i = 0; i < len; i++) {
    list.push({
      code: String(codes[i] ?? ''),
      name: String(names[i] ?? ''),
      qty: parseFloat(qtys[i]) || 0,
      key: `${codes[i]}|${names[i]}|null|0|${qtys[i]}`,
    });
  }
  return list;
}

// Product search response indices (limsProductSearch)
const P_NAME = 0, P_CODE = 1, P_COST = 2, P_TAX_RATE = 3, P_TAX_METHOD = 5;
const P_UNIT_NAME = 6, P_UNIT_OP = 7, P_UNIT_VAL = 8, P_PRODUCT_ID = 9, P_AVAIL_QTY = 15;

function calcRowFromProduct(product, qty) {
  const cost = parseFloat(product[P_COST]) || 0;
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
  const rowProductCost = op === '*' ? cost * opVal : cost / opVal;
  const purchaseUnit = unitNames[0] || 'n/a';
  let netUnitCost, tax, subTotal;
  if (taxMethod === 1) {
    netUnitCost = rowProductCost;
    tax = netUnitCost * qty * (taxRate / 100);
    subTotal = netUnitCost * qty + tax;
  } else {
    const subTotalUnit = rowProductCost;
    netUnitCost = (100 / (100 + taxRate)) * subTotalUnit;
    tax = (subTotalUnit - netUnitCost) * qty;
    subTotal = subTotalUnit * qty;
  }
  const availableQty = parseFloat(product[P_AVAIL_QTY]) || 0;
  return {
    product_id: product[P_PRODUCT_ID],
    product_code: product[P_CODE],
    name: product[P_NAME],
    purchase_unit: purchaseUnit,
    qty,
    net_unit_cost: netUnitCost,
    tax_rate: taxRate,
    tax,
    subtotal: subTotal,
    unit_operator: unitOpStr,
    unit_operation_value: unitValStr,
    tax_method: taxMethod,
    product_cost: cost,
    available_qty: availableQty,
  };
}

const getDefaultDates = () => {
  const end = new Date();
  const start = new Date(end.getFullYear() - 1, end.getMonth(), 1);
  return {
    starting_date: start.toISOString().slice(0, 10),
    ending_date: end.toISOString().slice(0, 10),
  };
};

const TransferList = () => {
  const { starting_date: defStart, ending_date: defEnd } = getDefaultDates();
  const [filter, setFilter] = useState({
    starting_date: defStart,
    ending_date: defEnd,
    from_warehouse_id: '0',
    to_warehouse_id: '0',
  });
  const [entities, setEntities] = useState([]);
  const [formData, setFormData] = useState({ warehouses: [] });
  const [showAddModal, setShowAddModal] = useState(false);
  const [detailsModal, setDetailsModal] = useState(false);
  const [details, setDetails] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Add Transfer form state
  const [addForm, setAddForm] = useState({
    created_at: new Date().toISOString().slice(0, 10),
    from_warehouse_id: '',
    to_warehouse_id: '',
    status: '2',
    shipping_cost: '',
    note: '',
    productSearch: '',
  });
  const [addFormRows, setAddFormRows] = useState([]);
  const [addFormProductList, setAddFormProductList] = useState([]);
  const [addFormSubmitting, setAddFormSubmitting] = useState(false);
  const [addFormSearchLoading, setAddFormSearchLoading] = useState(false);

  useEffect(() => {
    fetchFormData();
  }, []);

  useEffect(() => {
    fetchData();
  }, [filter.starting_date, filter.ending_date, filter.from_warehouse_id, filter.to_warehouse_id]);

  const fetchFormData = async () => {
    try {
      const res = await api.get('transfers/form-data');
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
        from_warehouse_id: filter.from_warehouse_id,
        to_warehouse_id: filter.to_warehouse_id,
      });
      const res = await api.get('transfers/list?' + params.toString());
      const data = res?.data;
      if (data?.status === 200 && Array.isArray(data?.data)) {
        setEntities(data.data);
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load transfers');
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
      const res = await api.get('transfers/details/' + row.id);
      const data = res?.data;
      if (data?.status === 200 && data?.data) {
        setDetails(data.data);
      } else {
        msg.error('Failed to load transfer details');
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load transfer details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setDetailsModal(false);
    setDetails(null);
  };

  const confirmDelete = (row) => {
    setItemToDelete(row);
    setDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete?.id) {
      setDeleteDialog(false);
      setItemToDelete(null);
      return;
    }
    try {
      const res = await api.delete('transfers/delete/' + itemToDelete.id);
      const data = res?.data;
      if (res?.status === 200 && data?.status === 200) {
        setEntities((prev) => prev.filter((e) => e.id !== itemToDelete.id));
        msg.success(data?.message || 'Transfer deleted');
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

  // When Add modal opens, reset form and set default date
  useEffect(() => {
    if (showAddModal) {
      setAddForm((prev) => ({
        ...prev,
        created_at: new Date().toISOString().slice(0, 10),
        from_warehouse_id: prev.from_warehouse_id || '',
        to_warehouse_id: prev.to_warehouse_id || '',
        status: '2',
        shipping_cost: '',
        note: '',
        productSearch: '',
      }));
      setAddFormRows([]);
    }
  }, [showAddModal]);

  // When from_warehouse changes, fetch products for search
  useEffect(() => {
    if (!showAddModal || !addForm.from_warehouse_id) {
      setAddFormProductList([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('transfers/getproduct/' + addForm.from_warehouse_id);
        const data = res?.data;
        if (cancelled) return;
        if (Array.isArray(data)) {
          setAddFormProductList(buildProductList(data));
        } else {
          setAddFormProductList([]);
        }
      } catch (e) {
        if (!cancelled) setAddFormProductList([]);
      }
    })();
    return () => { cancelled = true; };
  }, [showAddModal, addForm.from_warehouse_id]);

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
    if (!addForm.from_warehouse_id) {
      msg.error('Please select From Warehouse first.');
      return;
    }
    const dataStr = item.key + '?0?1'; // customer_id 0, pre_qty 1
    setAddFormSearchLoading(true);
    try {
      const res = await api.get('transfers/lims_product_search?data=' + encodeURIComponent(dataStr));
      const product = res?.data;
      if (!Array.isArray(product) || product.length < 10) {
        msg.error('Product not found or invalid response.');
        return;
      }
      const availableQty = parseFloat(product[P_AVAIL_QTY]) || 0;
      if (availableQty < 1) {
        msg.error('Quantity not available.');
        return;
      }
      const existing = addFormRows.find((r) => String(r.product_code) === String(product[P_CODE]));
      let qty = 1;
      if (existing) {
        qty = Math.min((existing.qty || 0) + 1, availableQty);
        setAddFormRows((prev) =>
          prev.map((r) =>
            r.product_code === product[P_CODE]
              ? calcRowFromProduct(product, qty)
              : r
          )
        );
      } else {
        const newRow = calcRowFromProduct(product, 1);
        setAddFormRows((prev) => [...prev, newRow]);
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
    const qty = Math.max(0, parseFloat(newQty) || 0);
    const maxQty = row.available_qty != null ? row.available_qty : 999999;
    const clampedQty = Math.min(qty, maxQty);
    const updated = {
      ...row,
      qty: clampedQty,
      ...(function () {
        const cost = row.product_cost;
        const taxRate = row.tax_rate;
        const taxMethod = row.tax_method;
        const unitOpStr = row.unit_operator || '';
        const unitValStr = row.unit_operation_value || '';
        const unitOps = unitOpStr.split(',').filter(Boolean);
        const unitVals = unitValStr.split(',').filter(Boolean);
        const op = unitOps[0] === '*' ? '*' : '/';
        const opVal = parseFloat(unitVals[0]) || 1;
        const rowProductCost = op === '*' ? cost * opVal : cost / opVal;
        let netUnitCost, tax, subTotal;
        if (taxMethod === 1) {
          netUnitCost = rowProductCost;
          tax = netUnitCost * clampedQty * (taxRate / 100);
          subTotal = netUnitCost * clampedQty + tax;
        } else {
          const subTotalUnit = rowProductCost;
          netUnitCost = (100 / (100 + taxRate)) * subTotalUnit;
          tax = (subTotalUnit - netUnitCost) * clampedQty;
          subTotal = subTotalUnit * clampedQty;
        }
        return { net_unit_cost: netUnitCost, tax, subtotal: subTotal };
      })(),
    };
    setAddFormRows((prev) => prev.map((r, i) => (i === index ? updated : r)));
  };

  const removeAddFormRow = (index) => {
    setAddFormRows((prev) => prev.filter((_, i) => i !== index));
  };

  const addFormTotals = useMemo(() => {
    let totalQty = 0;
    let totalTax = 0;
    let totalCost = 0;
    addFormRows.forEach((r) => {
      totalQty += parseFloat(r.qty) || 0;
      totalTax += parseFloat(r.tax) || 0;
      totalCost += parseFloat(r.subtotal) || 0;
    });
    const shipping = parseFloat(addForm.shipping_cost) || 0;
    const grandTotal = totalCost + shipping;
    return { totalQty, totalTax, totalCost, grandTotal };
  }, [addFormRows, addForm.shipping_cost]);

  const submitAddTransfer = async (e) => {
    e.preventDefault();
    if (addForm.from_warehouse_id === '' || addForm.to_warehouse_id === '') {
      msg.error('Please select From Warehouse and To Warehouse.');
      return;
    }
    if (Number(addForm.from_warehouse_id) === Number(addForm.to_warehouse_id)) {
      msg.error('From and To warehouse cannot be the same.');
      return;
    }
    if (addFormRows.length === 0) {
      msg.error('Please add at least one product.');
      return;
    }
    setAddFormSubmitting(true);
    try {
      const payload = {
        created_at: addForm.created_at,
        from_warehouse_id: Number(addForm.from_warehouse_id),
        to_warehouse_id: Number(addForm.to_warehouse_id),
        status: Number(addForm.status),
        shipping_cost: addForm.shipping_cost ? parseFloat(addForm.shipping_cost) : 0,
        note: addForm.note || '',
        product_id: addFormRows.map((r) => r.product_id),
        product_code: addFormRows.map((r) => r.product_code),
        qty: addFormRows.map((r) => r.qty),
        purchase_unit: addFormRows.map((r) => r.purchase_unit),
        net_unit_cost: addFormRows.map((r) => r.net_unit_cost),
        tax_rate: addFormRows.map((r) => r.tax_rate),
        tax: addFormRows.map((r) => r.tax),
        subtotal: addFormRows.map((r) => r.subtotal),
        total_qty: addFormTotals.totalQty,
        total_tax: addFormTotals.totalTax,
        total_cost: addFormTotals.totalCost,
        item: addFormRows.length,
        grand_total: addFormTotals.grandTotal,
        paid_amount: 0,
        payment_status: 1,
      };
      const res = await api.post('transfers/store').values(payload);
      const data = res?.data;
      if (res?.status === 200 && data?.status === 200) {
        msg.success(data?.message || 'Transfer created successfully.');
        closeAddModal();
      } else {
        msg.error(data?.message || 'Failed to create transfer.');
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || err?.message || 'Failed to create transfer.');
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
            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchData();
              }}
              className="row align-items-end"
            >
              <div className="col-md-2 form-group">
                <label className="font-weight-bold">Date (from)</label>
                <input
                  type="date"
                  name="starting_date"
                  className="form-control"
                  value={filter.starting_date}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="col-md-2 form-group">
                <label className="font-weight-bold">To</label>
                <input
                  type="date"
                  name="ending_date"
                  className="form-control"
                  value={filter.ending_date}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="col-md-2 form-group">
                <label className="font-weight-bold">From Warehouse</label>
                <select
                  name="from_warehouse_id"
                  className="form-control"
                  value={filter.from_warehouse_id}
                  onChange={handleFilterChange}
                >
                  <option value="0">All Warehouse</option>
                  {formData.warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-2 form-group">
                <label className="font-weight-bold">To Warehouse</label>
                <select
                  name="to_warehouse_id"
                  className="form-control"
                  value={filter.to_warehouse_id}
                  onChange={handleFilterChange}
                >
                  <option value="0">All Warehouse</option>
                  {formData.warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-2 form-group">
                <button type="submit" className="btn btn-primary">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
        <button type="button" className="btn btn-info" onClick={() => setShowAddModal(true)}>
          <SafeFontAwesomeIcon icon={faPlus} className="mr-2" size="sm" /> Add Transfer
        </button>
      </div>

      {/* Add Transfer Modal - inline form */}
      <FormModal
        moduleName="Add Transfer"
        modalState={showAddModal}
        toggleFormModal={closeAddModal}
        width="95%"
        height="90vh"
      >
        <form onSubmit={submitAddTransfer} className="modal-body" style={{ maxHeight: 'calc(90vh - 120px)', overflow: 'auto' }}>
          <p className="text-muted small">Fields marked with * are required.</p>
          <div className="row">
            <div className="col-md-4 form-group">
              <label>Date *</label>
              <input
                type="date"
                className="form-control"
                value={addForm.created_at}
                onChange={(e) => setAddForm((f) => ({ ...f, created_at: e.target.value }))}
                required
              />
            </div>
            <div className="col-md-4 form-group">
              <label>From Warehouse *</label>
              <select
                className="form-control"
                value={addForm.from_warehouse_id}
                onChange={(e) => setAddForm((f) => ({ ...f, from_warehouse_id: e.target.value }))}
                required
              >
                <option value="">Select warehouse...</option>
                {formData.warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4 form-group">
              <label>To Warehouse *</label>
              <select
                className="form-control"
                value={addForm.to_warehouse_id}
                onChange={(e) => setAddForm((f) => ({ ...f, to_warehouse_id: e.target.value }))}
                required
              >
                <option value="">Select warehouse...</option>
                {formData.warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4 form-group">
              <label>Status</label>
              <select
                className="form-control"
                value={addForm.status}
                onChange={(e) => setAddForm((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="1">Completed</option>
                <option value="2">Pending</option>
                <option value="3">Sent</option>
              </select>
            </div>
          </div>
          <div className="row mt-3">
            <div className="col-md-12">
              <label>Select Product *</label>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Type product code or name and select below..."
                  value={addForm.productSearch}
                  onChange={(e) => setAddForm((f) => ({ ...f, productSearch: e.target.value }))}
                  autoComplete="off"
                />
              </div>
              {addFormFilteredProducts.length > 0 && (
                <ul className="list-group mt-1" style={{ maxHeight: 180, overflow: 'auto' }}>
                  {addFormFilteredProducts.map((p, i) => (
                    <li
                      key={i}
                      className="list-group-item list-group-item-action"
                      style={{ cursor: 'pointer' }}
                      onClick={() => onAddFormProductSelect(p)}
                    >
                      {p.code} — {p.name} (Avail: {p.qty})
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
                      <th>Quantity</th>
                      <th>Net Unit Cost</th>
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
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            style={{ maxWidth: 80 }}
                            min={0}
                            max={row.available_qty}
                            step="any"
                            value={row.qty}
                            onChange={(e) => onAddFormQtyChange(idx, e.target.value)}
                          />
                        </td>
                        <td className="text-right">{Number(row.net_unit_cost).toFixed(DECIMAL)}</td>
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
                      <td className="text-right">{addFormTotals.totalTax.toFixed(DECIMAL)}</td>
                      <td className="text-right">{addFormTotals.totalCost.toFixed(DECIMAL)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
          <div className="row mt-2">
            <div className="col-md-4 form-group">
              <label>Shipping Cost</label>
              <input
                type="number"
                className="form-control"
                step="any"
                value={addForm.shipping_cost}
                onChange={(e) => setAddForm((f) => ({ ...f, shipping_cost: e.target.value }))}
              />
            </div>
            <div className="col-md-8 form-group">
              <label>Note</label>
              <textarea
                className="form-control"
                rows={2}
                value={addForm.note}
                onChange={(e) => setAddForm((f) => ({ ...f, note: e.target.value }))}
              />
            </div>
          </div>
          <div className="mb-2">
            <strong>Grand Total:</strong> {addFormTotals.grandTotal.toFixed(DECIMAL)}
          </div>
          <div className="modal-footer border-top pt-2">
            <button type="button" className="btn btn-secondary" onClick={closeAddModal}>
              <SafeFontAwesomeIcon icon={faTimes} className="mr-2" size="sm" /> Close
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={addFormSubmitting || addFormRows.length === 0}
            >
              {addFormSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </FormModal>

      {/* View Details Modal */}
      <FormModal
        moduleName="Transfer Details"
        modalState={detailsModal}
        toggleFormModal={closeDetails}
        width="800px"
      >
        <div className="modal-body text-left">
          {detailsLoading ? (
            <div className="text-center p-4">Loading...</div>
          ) : details ? (
            <>
              <div className="mb-3">
                <strong>Date:</strong> {details.transfer?.date} &nbsp;|&nbsp;
                <strong>Reference:</strong> {details.transfer?.reference_no} &nbsp;|&nbsp;
                <strong>Status:</strong> {details.transfer?.status}
              </div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <strong>From:</strong> {details.transfer?.from_warehouse}
                </div>
                <div className="col-md-6">
                  <strong>To:</strong> {details.transfer?.to_warehouse}
                </div>
              </div>
              <table className="table table-bordered table-sm">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product</th>
                    <th>Batch No</th>
                    <th>Qty</th>
                    <th>Unit Cost</th>
                    <th>Tax</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {details.products?.map((p, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{p.product_name}</td>
                      <td>{p.batch_no}</td>
                      <td>{p.qty} {p.unit_code}</td>
                      <td className="text-right">{p.total && p.qty ? (p.total / p.qty).toFixed(2) : '—'}</td>
                      <td className="text-right">{p.tax != null ? Number(p.tax).toFixed(2) : '—'} ({p.tax_rate}%)</td>
                      <td className="text-right">{p.total != null ? Number(p.total).toFixed(2) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-top pt-2">
                <strong>Total Tax:</strong> {details.transfer?.total_tax != null ? Number(details.transfer.total_tax).toFixed(2) : '0'} &nbsp;|&nbsp;
                <strong>Total:</strong> {details.transfer?.total_cost != null ? Number(details.transfer.total_cost).toFixed(2) : '0'} &nbsp;|&nbsp;
                <strong>Shipping Cost:</strong> {details.transfer?.shipping_cost != null ? Number(details.transfer.shipping_cost).toFixed(2) : '0'} &nbsp;|&nbsp;
                <strong>Grand Total:</strong> {details.transfer?.grand_total != null ? Number(details.transfer.grand_total).toFixed(2) : '0'}
              </div>
              {details.transfer?.note && (
                <div className="mt-2">
                  <strong>Note:</strong> {details.transfer.note}
                </div>
              )}
              <div className="mt-2 small text-muted">
                <strong>Created by:</strong> {details.transfer?.created_by} ({details.transfer?.created_by_email})
              </div>
            </>
          ) : (
            <div className="text-center p-4">No data</div>
          )}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={closeDetails}>
            <SafeFontAwesomeIcon icon={faTimes} className="mr-2" size="sm" /> Close
          </button>
        </div>
      </FormModal>

      {/* Delete confirm modal */}
      <FormModal
        moduleName="Confirm delete"
        modalState={deleteDialog}
        toggleFormModal={() => { setDeleteDialog(false); setItemToDelete(null); }}
        width="420px"
      >
        <div className="modal-body">
          <p>
            Are you sure you want to delete transfer <strong>"{itemToDelete?.reference_no}"</strong>?
          </p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={() => { setDeleteDialog(false); setItemToDelete(null); }}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={handleDelete}>
            <SafeFontAwesomeIcon icon={faTrash} className="mr-2" size="sm" /> Delete
          </button>
        </div>
      </FormModal>

      <div className="table-responsive mt-3">
        {isLoading ? (
          <div className="text-center p-4">Loading...</div>
        ) : (
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Date</th>
                <th>Reference No</th>
                <th>From Warehouse</th>
                <th>To Warehouse</th>
                <th className="text-right">Shipping Cost</th>
                <th className="text-right">Grand Total</th>
                <th>Status</th>
                <th>Email Sent</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {entities.map((row) => (
                <tr key={row.id}>
                  <td>{row.date ?? '—'}</td>
                  <td>{row.reference_no ?? '—'}</td>
                  <td>{row.from_warehouse ?? '—'}</td>
                  <td>{row.to_warehouse ?? '—'}</td>
                  <td className="text-right">{row.shipping_cost != null ? Number(row.shipping_cost).toFixed(2) : '—'}</td>
                  <td className="text-right">{row.grand_total != null ? Number(row.grand_total).toFixed(2) : '—'}</td>
                  <td>{row.status ?? '—'}</td>
                  <td>{row.is_sent ? 'Yes' : 'No'}</td>
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

export default TransferList;
