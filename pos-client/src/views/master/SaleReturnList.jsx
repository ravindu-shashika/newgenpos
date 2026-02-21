import React, { useState, useEffect } from 'react';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import { api, msg } from '../../services';
import { FormModal, SafeFontAwesomeIcon } from '../../components';

const moduleName = 'Sale Return List';
const DECIMAL = 2;

const getDefaultDates = () => {
  const end = new Date();
  const start = new Date(end.getFullYear() - 1, end.getMonth(), 1);
  return { starting_date: start.toISOString().slice(0, 10), ending_date: end.toISOString().slice(0, 10) };
};

const SaleReturnList = () => {
  const { starting_date: defStart, ending_date: defEnd } = getDefaultDates();
  const [filter, setFilter] = useState({
    starting_date: defStart,
    ending_date: defEnd,
    warehouse_id: '0',
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
  }, [filter.starting_date, filter.ending_date, filter.warehouse_id]);

  const fetchFormData = async () => {
    try {
      const res = await api.get('return-sale/form-data');
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
      const res = await api.get('return-sale/list?' + params.toString());
      const data = res?.data;
      if (data?.status === 200 && Array.isArray(data?.data)) {
        setEntities(data.data);
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load returns');
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
      const res = await api.get('return-sale/details/' + row.id);
      const data = res?.data;
      if (data?.status === 200 && data?.data) {
        setDetails(data.data);
      } else {
        msg.error('Failed to load return details');
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load return details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setDetailsModal(false);
    setDetails(null);
  };

  const openAddReturn = () => {
    const base = window.__POS_LARAVEL_URL__ || '';
    const url = base ? `${base.replace(/\/$/, '')}/return-sale/create` : '#';
    if (url !== '#') window.open(url, '_blank');
    else msg.info('Configure backend URL for Add Return.');
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
                  <option value="0">All Warehouse</option>
                  {(formData.warehouses || []).map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-2 form-group mb-0">
                <button type="submit" className="btn btn-primary">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
        <div className="mb-2">
          <button type="button" className="btn btn-info" onClick={openAddReturn}>
            Add Return
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
                  <th>Sale Reference</th>
                  <th>Warehouse</th>
                  <th>Biller</th>
                  <th>Customer</th>
                  <th className="text-right">Grand Total</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {entities.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center text-muted">
                      No returns found.
                    </td>
                  </tr>
                ) : (
                  entities.map((row) => (
                    <tr key={row.id}>
                      <td>{row.date || '-'}</td>
                      <td>{row.reference_no || '-'}</td>
                      <td>{row.sale_reference || '-'}</td>
                      <td>{row.warehouse || '-'}</td>
                      <td>{row.biller || '-'}</td>
                      <td>{row.customer || '-'}</td>
                      <td className="text-right">{Number(row.grand_total).toFixed(DECIMAL)}</td>
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
        moduleName="Return Details"
        modalState={detailsModal}
        toggleFormModal={closeDetails}
        width="900px"
      >
        <div className="modal-body text-left">
          {detailsLoading ? (
            <div className="text-center p-4">Loading...</div>
          ) : details?.return ? (
            <>
              <div className="mb-3 small">
                <strong>Date:</strong> {details.return.date} &nbsp;|&nbsp;
                <strong>Reference:</strong> {details.return.reference_no} &nbsp;|&nbsp;
                <strong>Sale Reference:</strong> {details.return.sale_reference}
              </div>
              <div className="mb-2">
                <strong>Warehouse:</strong> {details.return.warehouse} &nbsp;|&nbsp;
                <strong>Biller:</strong> {details.return.biller} &nbsp;|&nbsp;
                <strong>Customer:</strong> {details.return.customer}
                {details.return.customer_phone && ` (${details.return.customer_phone})`}
              </div>
              <div className="mb-2">
                <strong>Currency:</strong> {details.return.currency}
                {details.return.exchange_rate != null && ` / Exchange Rate: ${details.return.exchange_rate}`}
              </div>
              <div className="mb-2">
                <strong>Order Tax:</strong> {Number(details.return.order_tax).toFixed(DECIMAL)}
                {details.return.order_tax_rate != null && ` (${details.return.order_tax_rate}%)`} &nbsp;|&nbsp;
                <strong>Total Discount:</strong> {Number(details.return.total_discount).toFixed(DECIMAL)} &nbsp;|&nbsp;
                <strong>Grand Total:</strong> {Number(details.return.grand_total).toFixed(DECIMAL)}
              </div>
              {details.return.return_note && (
                <div className="mb-2">
                  <strong>Return Note:</strong> {details.return.return_note}
                </div>
              )}
              {details.return.staff_note && (
                <div className="mb-3">
                  <strong>Staff Note:</strong> {details.return.staff_note}
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
                      <th>Batch No</th>
                      <th className="text-right">Qty</th>
                      <th>Unit</th>
                      <th className="text-right">Unit Price</th>
                      <th className="text-right">Tax</th>
                      <th className="text-right">Discount</th>
                      <th className="text-right">Subtotal</th>
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
                        <td className="text-right">{Number(p.unit_price).toFixed(DECIMAL)}</td>
                        <td className="text-right">{Number(p.tax).toFixed(DECIMAL)}</td>
                        <td className="text-right">{Number(p.discount).toFixed(DECIMAL)}</td>
                        <td className="text-right">{Number(p.total).toFixed(DECIMAL)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-2 small text-muted">
                Created by: {details.return.created_by}
                {details.return.created_by_email && ` (${details.return.created_by_email})`}
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

export default SaleReturnList;
