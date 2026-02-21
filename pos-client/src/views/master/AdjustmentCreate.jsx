import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, msg } from '../../services';
import { SafeFontAwesomeIcon } from '../../components';
import { faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';

const moduleName = 'Add Adjustment';

const AdjustmentCreate = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ warehouses: [] });
  const [warehouseId, setWarehouseId] = useState('');
  const [productList, setProductList] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('adjustments/form-data');
        const data = res?.data;
        if (data?.status === 200 && data?.data) {
          setFormData(data.data);
        }
      } catch (e) {
        msg.error(e?.response?.data?.message || 'Failed to load form data');
      }
    })();
  }, []);

  useEffect(() => {
    if (!warehouseId) {
      setProductList([]);
      return;
    }
    (async () => {
      try {
        const res = await api.get('adjustments/warehouses/' + warehouseId);
        const data = res?.data;
        if (Array.isArray(data) && data.length >= 4) {
          const codes = data[0] || [];
          const names = data[1] || [];
          const qtys = data[2] || [];
          const costs = data[3] || [];
          const list = [];
          const len = Math.min(codes.length, names.length, qtys.length, costs.length);
          for (let i = 0; i < len; i++) {
            list.push({
              code: String(codes[i] ?? ''),
              name: String(names[i] ?? ''),
              qty: parseFloat(qtys[i]) || 0,
              cost: parseFloat(costs[i]) || 0,
              key: codes[i] + ' (' + names[i] + ')|' + (costs[i] ?? 0),
            });
          }
          setProductList(list);
        } else {
          setProductList([]);
        }
      } catch (e) {
        setProductList([]);
      }
    })();
  }, [warehouseId]);

  const filteredProducts = useMemo(() => {
    const term = (productSearch || '').toLowerCase().trim();
    if (!term) return productList.slice(0, 80);
    return productList.filter(
      (p) =>
        (p.code && p.code.toLowerCase().includes(term)) ||
        (p.name && p.name.toLowerCase().includes(term))
    ).slice(0, 80);
  }, [productList, productSearch]);

  const onProductSelect = async (item) => {
    if (!warehouseId) {
      msg.error('Please select Warehouse first.');
      return;
    }
    setSearchLoading(true);
    try {
      const res = await api.get('adjustments/product-lookup?data=' + encodeURIComponent(item.key));
      const product = res?.data;
      if (!product || (typeof product !== 'object' && !Array.isArray(product))) {
        msg.error('Product not found.');
        return;
      }
      const arr = Array.isArray(product) ? product : [];
      const name = arr[0] ?? product[0];
      const code = arr[1] ?? product[1];
      const product_id = arr[2] ?? product[2];
      const product_variant_id = arr[3] ?? product[3];
      const unit_cost = parseFloat(arr[4] ?? product[4]) || 0;
      const available_qty = arr[5] != null ? parseFloat(arr[5]) : (item.qty != null ? item.qty : 0);

      const existing = rows.find((r) => String(r.product_code) === String(code));
      if (existing) {
        const idx = rows.findIndex((r) => String(r.product_code) === String(code));
        const newQty = (parseFloat(existing.qty) || 0) + 1;
        if (existing.action === '-' && newQty > (existing.available_qty ?? 999999)) {
          msg.error('Quantity exceeds stock quantity!');
          setSearchLoading(false);
          return;
        }
        setRows((prev) =>
          prev.map((r, i) => (i === idx ? { ...r, qty: newQty } : r))
        );
      } else {
        setRows((prev) => [
          ...prev,
          {
            product_id,
            product_code: code,
            product_name: name,
            unit_cost,
            qty: 1,
            action: '-',
            available_qty,
          },
        ]);
      }
      setProductSearch('');
    } catch (e) {
      msg.error(e?.response?.data?.message || 'Failed to load product');
    } finally {
      setSearchLoading(false);
    }
  };

  const onQtyChange = (index, value) => {
    const r = rows[index];
    if (!r) return;
    let qty = Math.max(0, parseFloat(value) || 0);
    if (r.action === '-' && r.available_qty != null && qty > r.available_qty) {
      msg.error('Quantity exceeds stock quantity!');
      qty = r.available_qty;
    }
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, qty } : row)));
  };

  const onActionChange = (index, value) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, action: value } : row)));
  };

  const removeRow = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const totals = useMemo(() => {
    let total_qty = 0;
    rows.forEach((r) => {
      total_qty += parseFloat(r.qty) || 0;
    });
    return { total_qty, item: rows.length };
  }, [rows]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!warehouseId) {
      msg.error('Please select Warehouse.');
      return;
    }
    if (rows.length === 0) {
      msg.error('Please add at least one product.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        warehouse_id: Number(warehouseId),
        product_id: rows.map((r) => r.product_id),
        product_code: rows.map((r) => r.product_code),
        qty: rows.map((r) => r.qty),
        unit_cost: rows.map((r) => r.unit_cost),
        action: rows.map((r) => r.action),
        total_qty: totals.total_qty,
        item: totals.item,
        note: note || '',
      };
      const res = await api.post('adjustments/store').values(payload);
      const data = res?.data;
      if (res?.status === 200 && data?.status === 200) {
        msg.success(data?.message || 'Adjustment created successfully.');
        navigate(-1);
      } else {
        msg.error(data?.message || res?.data?.message || 'Failed to create adjustment.');
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || err?.message || 'Failed to create adjustment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-fluid">
      <h4 className="mb-3">{moduleName}</h4>
      <p className="text-muted small">Fields marked with * are required.</p>
      <form onSubmit={handleSubmit}>
        <div className="card mb-3">
          <div className="card-body">
            <div className="row">
              <div className="col-md-4 form-group">
                <label>Warehouse *</label>
                <select
                  className="form-control"
                  value={warehouseId}
                  onChange={(e) => {
                    setWarehouseId(e.target.value);
                    setRows([]);
                  }}
                  required
                >
                  <option value="">Select warehouse...</option>
                  {formData.warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="row mt-3">
              <div className="col-md-12">
                <label>Select Product</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Type product code or name..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                  <div className="input-group-append">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => filteredProducts[0] && onProductSelect(filteredProducts[0])}
                      disabled={searchLoading || !warehouseId || filteredProducts.length === 0}
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
              <table className="table table-bordered table-hover">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Unit Cost</th>
                    <th>Quantity</th>
                    <th>Action</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr key={idx}>
                      <td>{r.product_name}</td>
                      <td>{r.product_code}</td>
                      <td>{Number(r.unit_cost)}</td>
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          style={{ width: 90 }}
                          value={r.qty}
                          onChange={(e) => onQtyChange(idx, e.target.value)}
                          step="any"
                          min="0"
                          required
                        />
                      </td>
                      <td>
                        <select
                          className="form-control form-control-sm"
                          value={r.action}
                          onChange={(e) => onActionChange(idx, e.target.value)}
                        >
                          <option value="-">Subtraction</option>
                          <option value="+">Addition</option>
                        </select>
                      </td>
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
                    <td colSpan="3">Total</td>
                    <td>{totals.total_qty}</td>
                    <td colSpan="2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-body">
            <div className="form-group">
              <label>Note</label>
              <textarea className="form-control" rows={4} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>
        </div>

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

export default AdjustmentCreate;
