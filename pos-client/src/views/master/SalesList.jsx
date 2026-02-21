import React, { useState, useEffect } from 'react';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import { api, msg } from '../../services';
import { FormModal, SafeFontAwesomeIcon } from '../../components';

const moduleName = 'Sales List';
const DECIMAL = 2;

const getDefaultDates = () => {
  const end = new Date();
  const start = new Date(end.getFullYear() - 1, end.getMonth(), 1);
  return { starting_date: start.toISOString().slice(0, 10), ending_date: end.toISOString().slice(0, 10) };
};

const SALE_STATUS_OPTIONS = [
  { value: '0', label: 'All' },
  { value: '1', label: 'Completed' },
  { value: '2', label: 'Pending' },
  { value: '4', label: 'Returned' },
  { value: '5', label: 'Processing' },
  { value: '6', label: 'Cooked' },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: '0', label: 'All' },
  { value: '1', label: 'Pending' },
  { value: '2', label: 'Due' },
  { value: '3', label: 'Partial' },
  { value: '4', label: 'Paid' },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: '0', label: 'All' },
  { value: 'Cash', label: 'Cash' },
  { value: 'Gift Card', label: 'Gift Card' },
  { value: 'Credit Card', label: 'Credit Card' },
  { value: 'Cheque', label: 'Cheque' },
  { value: 'Deposit', label: 'Deposit' },
  { value: 'Points', label: 'Points' },
];

const SALE_TYPE_OPTIONS = [
  { value: '0', label: 'All' },
  { value: 'pos', label: 'POS' },
  { value: 'online', label: 'eCommerce' },
];

const SalesList = () => {
  const { starting_date: defStart, ending_date: defEnd } = getDefaultDates();
  const [filter, setFilter] = useState({
    starting_date: defStart,
    ending_date: defEnd,
    warehouse_id: '0',
    sale_status: '0',
    payment_status: '0',
    payment_method: '0',
    sale_type: '0',
  });
  const [entities, setEntities] = useState([]);
  const [formData, setFormData] = useState({ warehouses: [] });
  const [detailsModal, setDetailsModal] = useState(false);
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchFormData();
  }, []);

  useEffect(() => {
    fetchData();
  }, [
    filter.starting_date,
    filter.ending_date,
    filter.warehouse_id,
    filter.sale_status,
    filter.payment_status,
    filter.payment_method,
    filter.sale_type,
  ]);

  const fetchFormData = async () => {
    try {
      const res = await api.get('sales/form-data');
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
        sale_status: filter.sale_status,
        payment_status: filter.payment_status,
        payment_method: filter.payment_method,
        sale_type: filter.sale_type,
      });
      const res = await api.get('sales/list?' + params.toString());
      const data = res?.data;
      if (data?.status === 200 && Array.isArray(data?.data)) {
        setEntities(data.data);
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load sales');
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
      const res = await api.get('sales/details/' + row.id);
      const data = res?.data;
      if (data?.status === 200 && data?.data) {
        setDetails(data.data);
      } else {
        msg.error('Failed to load sale details');
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load sale details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setDetailsModal(false);
    setDetails(null);
  };

  const openAddSale = () => {
    const base = window.__POS_LARAVEL_URL__ || '';
    const url = base ? `${base.replace(/\/$/, '')}/sales/create` : '#';
    if (url !== '#') window.open(url, '_blank');
    else msg.info('Configure backend URL for Add Sale.');
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
              <div className="col-md-2 form-group mb-0">
                <label className="font-weight-bold">Date (from)</label>
                <input
                  type="date"
                  name="starting_date"
                  className="form-control"
                  value={filter.starting_date}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="col-md-2 form-group mb-0">
                <label className="font-weight-bold">To</label>
                <input
                  type="date"
                  name="ending_date"
                  className="form-control"
                  value={filter.ending_date}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="col-md-2 form-group mb-0">
                <label className="font-weight-bold">Warehouse</label>
                <select
                  name="warehouse_id"
                  className="form-control"
                  value={filter.warehouse_id}
                  onChange={handleFilterChange}
                >
                  <option value="0">All</option>
                  {(formData.warehouses || []).map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-2 form-group mb-0">
                <label className="font-weight-bold">Sale Status</label>
                <select
                  name="sale_status"
                  className="form-control"
                  value={filter.sale_status}
                  onChange={handleFilterChange}
                >
                  {SALE_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-2 form-group mb-0">
                <label className="font-weight-bold">Payment Status</label>
                <select
                  name="payment_status"
                  className="form-control"
                  value={filter.payment_status}
                  onChange={handleFilterChange}
                >
                  {PAYMENT_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-2 form-group mb-0">
                <label className="font-weight-bold">Payment Method</label>
                <select
                  name="payment_method"
                  className="form-control"
                  value={filter.payment_method}
                  onChange={handleFilterChange}
                >
                  {PAYMENT_METHOD_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-2 form-group mb-0">
                <label className="font-weight-bold">Sale Type</label>
                <select
                  name="sale_type"
                  className="form-control"
                  value={filter.sale_type}
                  onChange={handleFilterChange}
                >
                  {SALE_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-2 form-group mb-0">
                <button type="submit" className="btn btn-primary">
                  Filter
                </button>
              </div>
            </form>
          </div>
        </div>
        <div className="mb-2">
          <button type="button" className="btn btn-info" onClick={openAddSale}>
            Add Sale
          </button>
        </div>

        <div className="table-responsive">
          {isLoading ? (
            <div className="text-center p-4">Loading...</div>
          ) : (
            <table className="table table-bordered table-hover table-striped">
              <thead className="thead-light">
                <tr>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Created By</th>
                  <th>Customer</th>
                  <th>Warehouse</th>
                  <th>Sale Status</th>
                  <th>Payment Status</th>
                  <th>Payment Method</th>
                  <th>Currency</th>
                  <th>Delivery</th>
                  <th className="text-right">Grand Total</th>
                  <th className="text-right">Returned</th>
                  <th className="text-right">Paid</th>
                  <th className="text-right">Due</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {entities.length === 0 ? (
                  <tr>
                    <td colSpan="15" className="text-center text-muted">
                      No sales found.
                    </td>
                  </tr>
                ) : (
                  entities.map((row) => (
                    <tr key={row.id}>
                      <td>{row.date || '-'}</td>
                      <td>{row.reference_no || '-'}</td>
                      <td>{row.created_by || '-'}</td>
                      <td>{row.customer || '-'}</td>
                      <td>{row.warehouse_name || '-'}</td>
                      <td>{row.sale_status || '-'}</td>
                      <td>{row.payment_status || '-'}</td>
                      <td>{row.payment_method || '-'}</td>
                      <td>{row.currency || '-'}</td>
                      <td>{row.delivery_status || '-'}</td>
                      <td className="text-right">{Number(row.grand_total).toFixed(DECIMAL)}</td>
                      <td className="text-right">{Number(row.returned_amount).toFixed(DECIMAL)}</td>
                      <td className="text-right">{Number(row.paid_amount).toFixed(DECIMAL)}</td>
                      <td className="text-right">{Number(row.due).toFixed(DECIMAL)}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => openDetails(row)}
                          title="View"
                        >
                          <SafeFontAwesomeIcon icon={faEye} size="sm" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* View Details Modal */}
      <FormModal
        moduleName="Sale Details"
        modalState={detailsModal}
        toggleFormModal={closeDetails}
        width="900px"
      >
        <div className="modal-body text-left">
          {detailsLoading ? (
            <div className="text-center p-4">Loading...</div>
          ) : details?.sale ? (
            <>
              <div className="mb-3 small">
                <strong>Date:</strong> {details.sale.date} &nbsp;|&nbsp;
                <strong>Reference:</strong> {details.sale.reference_no} &nbsp;|&nbsp;
                <strong>Status:</strong> {details.sale.sale_status} &nbsp;|&nbsp;
                <strong>Payment:</strong> {details.sale.payment_status}
              </div>
              <div className="mb-2">
                <strong>Customer:</strong> {details.sale.customer}
                {details.sale.customer_phone && ` (${details.sale.customer_phone})`}
              </div>
              <div className="mb-2">
                <strong>Warehouse:</strong> {details.sale.warehouse} &nbsp;|&nbsp;
                <strong>Biller:</strong> {details.sale.biller} &nbsp;|&nbsp;
                <strong>Currency:</strong> {details.sale.currency} / {details.sale.exchange_rate}
              </div>
              <div className="mb-2">
                <strong>Order Tax:</strong> {Number(details.sale.order_tax).toFixed(DECIMAL)} &nbsp;|&nbsp;
                <strong>Order Discount:</strong> {Number(details.sale.order_discount).toFixed(DECIMAL)} &nbsp;|&nbsp;
                <strong>Shipping:</strong> {Number(details.sale.shipping_cost).toFixed(DECIMAL)}
              </div>
              <div className="mb-3">
                <strong>Grand Total:</strong> {Number(details.sale.grand_total).toFixed(DECIMAL)} &nbsp;|&nbsp;
                <strong>Paid:</strong> {Number(details.sale.paid_amount).toFixed(DECIMAL)} &nbsp;|&nbsp;
                <strong>Returned:</strong> {Number(details.sale.returned_amount).toFixed(DECIMAL)} &nbsp;|&nbsp;
                <strong>Due:</strong> {Number(details.sale.due).toFixed(DECIMAL)}
              </div>
              {details.sale.sale_note && (
                <div className="mb-2">
                  <strong>Sale Note:</strong> {details.sale.sale_note}
                </div>
              )}
              {details.sale.staff_note && (
                <div className="mb-3">
                  <strong>Staff Note:</strong> {details.sale.staff_note}
                </div>
              )}

              <h6 className="mt-3">Products</h6>
              <div className="table-responsive">
                <table className="table table-bordered table-sm">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Product</th>
                      <th>Code</th>
                      <th>Batch</th>
                      <th className="text-right">Qty</th>
                      <th>Unit</th>
                      <th className="text-right">Returned</th>
                      <th className="text-right">Unit Price</th>
                      <th className="text-right">Tax</th>
                      <th className="text-right">Discount</th>
                      <th className="text-right">Subtotal</th>
                      <th>Delivered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(details.products || []).map((p, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>{p.product_name}</td>
                        <td>{p.product_code}</td>
                        <td>{p.batch_no}</td>
                        <td className="text-right">{Number(p.qty).toFixed(DECIMAL)}</td>
                        <td>{p.unit_code}</td>
                        <td className="text-right">{Number(p.return_qty).toFixed(DECIMAL)}</td>
                        <td className="text-right">{Number(p.net_unit_price).toFixed(DECIMAL)}</td>
                        <td className="text-right">{Number(p.tax).toFixed(DECIMAL)}</td>
                        <td className="text-right">{Number(p.discount).toFixed(DECIMAL)}</td>
                        <td className="text-right">{Number(p.total).toFixed(DECIMAL)}</td>
                        <td>{p.is_delivered}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-2 small text-muted">
                Created by: {details.sale.created_by}
              </div>
            </>
          ) : details ? (
            <div className="text-center text-muted">No details available.</div>
          ) : null}
        </div>
      </FormModal>
    </div>
  );
};

export default SalesList;
