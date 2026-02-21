import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, msg } from '../../services';

const moduleName = 'Add Return';
const DECIMAL_DEFAULT = 2;

const ReturnPurchaseCreate = () => {
  const { purchaseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(null);
  const [rows, setRows] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    account_id: '',
    order_tax_rate: '0',
    return_note: '',
    staff_note: '',
  });

  const decimal = formData?.decimal ?? DECIMAL_DEFAULT;

  useEffect(() => {
    if (!purchaseId) {
      msg.error('Purchase ID is required.');
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await api.get('return-purchase/create-data?purchase_id=' + encodeURIComponent(purchaseId));
        const data = res?.data;
        if (data?.status === 200 && data?.data) {
          setFormData(data.data);
          setRows(
            (data.data.product_rows || []).map((r) => ({
              ...r,
              is_return: false,
              unit_cost: r.unit_cost ?? (r.actual_qty ? r.total / r.actual_qty : 0),
              unit_tax: r.actual_qty ? r.tax / r.actual_qty : 0,
              discount_per_unit: r.actual_qty ? r.discount / r.actual_qty : 0,
            }))
          );
          if (data.data.default_account_id) {
            setForm((f) => ({ ...f, account_id: String(data.data.default_account_id) }));
          }
        } else {
          msg.error(data?.message || 'Failed to load return data.');
        }
      } catch (e) {
        msg.error(e?.response?.data?.message || 'Failed to load return data.');
      } finally {
        setLoading(false);
      }
    })();
  }, [purchaseId]);

  const onCheckChange = (index, checked) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, is_return: checked } : r)));
  };

  const onQtyChange = (index, value) => {
    const r = rows[index];
    if (!r) return;
    let qty = Math.max(0, parseFloat(value) || 0);
    if (r.actual_qty != null && qty > r.actual_qty) {
      qty = r.actual_qty;
    }
    const unit_cost = r.unit_cost ?? 0;
    const unit_tax = r.unit_tax ?? 0;
    const discount_per_unit = r.discount_per_unit ?? 0;
    setRows((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              qty,
              discount: discount_per_unit * qty,
              tax: unit_tax * qty,
              total: unit_cost * qty,
            }
          : row
      )
    );
  };

  const totals = useMemo(() => {
    let total_qty = 0;
    let total_discount = 0;
    let total_tax = 0;
    let total_cost = 0;
    let item = 0;
    rows.forEach((r) => {
      if (!r.is_return) return;
      total_qty += parseFloat(r.qty) || 0;
      total_discount += parseFloat(r.discount) || 0;
      total_tax += parseFloat(r.tax) || 0;
      total_cost += parseFloat(r.total) || 0;
      item += 1;
    });
    const order_tax_rate = parseFloat(form.order_tax_rate) || 0;
    const order_tax = total_cost * (order_tax_rate / 100);
    const grand_total = total_cost + order_tax;
    return {
      total_qty,
      total_discount,
      total_tax,
      total_cost,
      item,
      order_tax,
      grand_total,
    };
  }, [rows, form.order_tax_rate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const selected = rows.filter((r) => r.is_return);
    if (selected.length === 0) {
      msg.error('Please select at least one product to return.');
      return;
    }
    if (!form.account_id) {
      msg.error('Please select Account.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        purchase_id: formData.purchase_id,
        account_id: Number(form.account_id),
        order_tax_rate: parseFloat(form.order_tax_rate) || 0,
        return_note: form.return_note || '',
        staff_note: form.staff_note || '',
        total_qty: totals.total_qty,
        total_discount: totals.total_discount,
        total_tax: totals.total_tax,
        total_cost: totals.total_cost,
        item: totals.item,
        order_tax: totals.order_tax,
        grand_total: totals.grand_total,
        is_return: selected.map((r) => r.product_purchase_id),
        product_purchase_id: rows.map((r) => r.product_purchase_id),
        product_id: rows.map((r) => r.product_id),
        product_code: rows.map((r) => r.product_code),
        qty: rows.map((r) => r.qty),
        purchase_unit: rows.map((r) => r.purchase_unit),
        net_unit_cost: rows.map((r) => r.net_unit_cost),
        discount: rows.map((r) => r.discount),
        tax_rate: rows.map((r) => r.tax_rate),
        tax: rows.map((r) => r.tax),
        subtotal: rows.map((r) => r.total),
        product_batch_id: rows.map((r) => r.product_batch_id || ''),
        imei_number: rows.map((r) => r.imei_number || ''),
      };
      const res = await api.post('return-purchase/store').values(payload);
      const data = res?.data;
      if (res?.status === 200 && data?.status === 200) {
        msg.success(data?.message || 'Return created successfully.');
        navigate(-1);
      } else {
        msg.error(data?.message || res?.data?.message || 'Failed to create return.');
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || err?.message || 'Failed to create return.');
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

  if (!formData) {
    return (
      <div className="container-fluid">
        <p className="text-danger">Unable to load return form.</p>
        <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <h4 className="mb-3">{moduleName}</h4>
      <p className="text-muted small">Purchase: <strong>{formData.purchase_reference_no}</strong>. Select products to return and set quantity. Fields marked with * are required.</p>
      <form onSubmit={handleSubmit}>
        <div className="card mb-3">
          <div className="card-body">
            <h5>Order Table *</h5>
            <div className="table-responsive">
              <table className="table table-hover table-bordered">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Batch No</th>
                    <th>Quantity</th>
                    <th>Net Unit Cost</th>
                    <th>Discount</th>
                    <th>Tax</th>
                    <th>Subtotal</th>
                    <th>Choose</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr key={r.product_purchase_id}>
                      <td>{r.product_name}</td>
                      <td>{r.product_code}</td>
                      <td>{r.batch_no ?? 'N/A'}</td>
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          style={{ width: 80 }}
                          value={r.qty}
                          onChange={(e) => onQtyChange(idx, e.target.value)}
                          step="any"
                          min="0"
                          max={r.actual_qty}
                          disabled={!r.is_return}
                        />
                        {r.actual_qty != null && (
                          <small className="text-muted">/ {r.actual_qty}</small>
                        )}
                      </td>
                      <td>{Number(r.net_unit_cost).toFixed(decimal)}</td>
                      <td>{Number(r.discount).toFixed(decimal)}</td>
                      <td>{Number(r.tax).toFixed(decimal)}</td>
                      <td>{Number(r.total).toFixed(decimal)}</td>
                      <td>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={!!r.is_return}
                          onChange={(e) => onCheckChange(idx, e.target.checked)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-body">
            <div className="row">
              <div className="col-md-4 form-group">
                <label>Account *</label>
                <select
                  className="form-control"
                  value={form.account_id}
                  onChange={(e) => setForm((f) => ({ ...f, account_id: e.target.value }))}
                  required
                >
                  <option value="">Select account...</option>
                  {(formData.accounts || []).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} {a.account_no ? `[${a.account_no}]` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4 form-group">
                <label>Order Tax</label>
                <select
                  className="form-control"
                  value={form.order_tax_rate}
                  onChange={(e) => setForm((f) => ({ ...f, order_tax_rate: e.target.value }))}
                >
                  <option value="0">No Tax</option>
                  {(formData.taxes || []).map((t) => (
                    <option key={t.id} value={t.rate}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 form-group">
                <label>Return Note</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={form.return_note}
                  onChange={(e) => setForm((f) => ({ ...f, return_note: e.target.value }))}
                />
              </div>
              <div className="col-md-6 form-group">
                <label>Staff Note</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={form.staff_note}
                  onChange={(e) => setForm((f) => ({ ...f, staff_note: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-3">
          <table className="table table-bordered table-sm">
            <tbody>
              <tr>
                <td><strong>Items</strong> {totals.item} ({totals.total_qty.toFixed(decimal)})</td>
                <td><strong>Total</strong> {totals.total_cost.toFixed(decimal)}</td>
                <td><strong>Order Tax</strong> {totals.order_tax.toFixed(decimal)}</td>
                <td><strong>Grand Total</strong> {totals.grand_total.toFixed(decimal)}</td>
              </tr>
            </tbody>
          </table>
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

export default ReturnPurchaseCreate;
