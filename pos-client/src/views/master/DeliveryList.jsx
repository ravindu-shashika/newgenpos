import React, { useState, useEffect } from 'react';
import { faEdit, faTrash, faEye } from '@fortawesome/free-solid-svg-icons';
import { api, msg } from '../../services';
import { FormModal, SafeFontAwesomeIcon } from '../../components';

const moduleName = 'Delivery List';

const defaultEditForm = {
  delivery_id: null,
  reference_no: '',
  sale_reference: '',
  status: '1',
  delivered_by: '',
  recieved_by: '',
  customer_name: '',
  address: '',
  note: '',
  courier_id: '',
};

const statusBadgeClass = (statusCode) => {
  const s = String(statusCode);
  if (s === '1') return 'badge-info';
  if (s === '2') return 'badge-primary';
  return 'badge-success';
};

const DeliveryList = () => {
  const [entities, setEntities] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [editForm, setEditForm] = useState({ ...defaultEditForm });
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
    fetchCouriers();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const url = search
        ? `delivery/list?search=${encodeURIComponent(search)}`
        : 'delivery/list';
      const res = await api.get(url);
      const data = res?.data;
      if (data?.status === 200 && Array.isArray(data?.data)) {
        setEntities(data.data);
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load deliveries');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCouriers = async () => {
    try {
      const res = await api.get('couriers/list');
      const data = res?.data;
      if (data?.status === 200 && Array.isArray(data?.data)) {
        setCouriers(data.data);
      }
    } catch (err) {}
  };

  const openDetails = async (row) => {
    setDetailsLoading(true);
    setShowDetailsModal(true);
    setDetails(null);
    try {
      const res = await api.get('delivery/details/' + row.id);
      const data = res?.data;
      if (data?.status === 200 && data?.data) {
        setDetails(data.data);
      } else {
        msg.error('Failed to load details');
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const openEdit = async (row) => {
    try {
      const res = await api.get('delivery/edit-api/' + row.id);
      const d = res?.data?.data;
      if (!d) return;
      setEditForm({
        delivery_id: d.delivery_id,
        reference_no: d.reference_no,
        sale_reference: d.sale_reference,
        status: String(d.status),
        delivered_by: d.delivered_by || '',
        recieved_by: d.recieved_by || '',
        customer_name: d.customer_name || '',
        address: d.address || '',
        note: d.note || '',
        courier_id: d.courier_id ? String(d.courier_id) : '',
      });
      setShowEditModal(true);
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load delivery');
    }
  };

  const closeEdit = () => {
    setShowEditModal(false);
    setEditForm({ ...defaultEditForm });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.delivery_id) return;
    const payload = {
      status: editForm.status,
      address: editForm.address,
      courier_id: editForm.courier_id || null,
      delivered_by: editForm.delivered_by || null,
      recieved_by: editForm.recieved_by || null,
      note: editForm.note || null,
    };
    setSubmitting(true);
    try {
      const res = await api.put('delivery/update-api/' + editForm.delivery_id, payload);
      const data = res?.data;
      if (data?.status === 200) {
        msg.success(data?.message || 'Delivery updated');
        closeEdit();
        fetchData();
      } else {
        msg.error(data?.message || 'Update failed');
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Update failed');
    } finally {
      setSubmitting(false);
    }
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
      const res = await api.delete('delivery/delete-api/' + itemToDelete.id);
      const data = res?.data;
      if (data?.status === 200) {
        setEntities((prev) => prev.filter((e) => e.id !== itemToDelete.id));
        msg.success(data?.message || 'Delivery deleted');
      } else {
        msg.error(data?.message || 'Delete failed');
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Delete failed');
    }
    setDeleteDialog(false);
    setItemToDelete(null);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchData();
  };

  return (
    <div>
      <h5 className="text-center">{moduleName}</h5>
      <br />
      <div className="container-fluid">
        <form onSubmit={handleSearch} className="form-inline mb-2">
          <input
            type="text"
            className="form-control mr-2"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-secondary">Search</button>
        </form>

        <div className="table-responsive">
          {isLoading ? (
            <div className="text-center p-4">Loading...</div>
          ) : (
            <table className="table table-bordered table-hover table-striped">
              <thead className="thead-light">
                <tr>
                  <th>Delivery Reference</th>
                  <th>Sale Reference</th>
                  <th>Packing Slip Reference</th>
                  <th>Customer</th>
                  <th>Courier</th>
                  <th>Address</th>
                  <th>Products</th>
                  <th className="text-right">Grand Total</th>
                  <th>Status</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {entities.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center text-muted">
                      No deliveries found.
                    </td>
                  </tr>
                ) : (
                  entities.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <button
                          type="button"
                          className="btn btn-link p-0 text-left font-weight-normal"
                          onClick={() => openDetails(row)}
                        >
                          {row.reference_no || '-'}
                        </button>
                      </td>
                      <td>{row.sale_reference || '-'}</td>
                      <td>{row.packing_slip_references || 'N/A'}</td>
                      <td>
                        {row.customer_name || row.customer || '-'}
                        {row.customer_phone && (
                          <br />
                        )}
                        {row.customer_phone}
                      </td>
                      <td>{row.courier || 'N/A'}</td>
                      <td>{row.address || '-'}</td>
                      <td className="small">{row.products || '-'}</td>
                      <td className="text-right">{row.grand_total ?? '-'}</td>
                      <td>
                        <span className={`badge ${statusBadgeClass(row.status_code)}`}>
                          {row.status || '-'}
                        </span>
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary mr-1"
                          onClick={() => openDetails(row)}
                          title="View"
                        >
                          <SafeFontAwesomeIcon icon={faEye} size="sm" />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary mr-1"
                          onClick={(e) => { e.stopPropagation(); openEdit(row); }}
                          title="Edit"
                        >
                          <SafeFontAwesomeIcon icon={faEdit} size="sm" />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={(e) => { e.stopPropagation(); confirmDelete(row); }}
                          title="Delete"
                        >
                          <SafeFontAwesomeIcon icon={faTrash} size="sm" />
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

      {/* Details Modal */}
      <FormModal
        moduleName="Delivery Details"
        modalState={showDetailsModal}
        toggleFormModal={() => { setShowDetailsModal(false); setDetails(null); }}
        width="700px"
      >
        <div className="modal-body">
          {detailsLoading ? (
            <div className="text-center p-4">Loading...</div>
          ) : details ? (
            <>
              <table className="table table-bordered table-sm mb-3">
                <tbody>
                  <tr><td><strong>Date</strong></td><td>{details.date}</td></tr>
                  <tr><td><strong>Delivery Reference</strong></td><td>{details.reference_no}</td></tr>
                  <tr><td><strong>Sale Reference</strong></td><td>{details.sale_reference}</td></tr>
                  <tr><td><strong>Status</strong></td><td>{details.status}</td></tr>
                  <tr><td><strong>Customer Name</strong></td><td>{details.customer_name}</td></tr>
                  <tr><td><strong>Phone</strong></td><td>{details.customer_phone}</td></tr>
                  <tr><td><strong>Address</strong></td><td>{details.address}{details.city ? ', ' + details.city : ''}</td></tr>
                  <tr><td><strong>Note</strong></td><td>{details.note || '-'}</td></tr>
                  <tr><td><strong>Prepared By</strong></td><td>{details.prepared_by}</td></tr>
                  <tr><td><strong>Delivered By</strong></td><td>{details.delivered_by}</td></tr>
                  <tr><td><strong>Recieved By</strong></td><td>{details.recieved_by}</td></tr>
                </tbody>
              </table>
              <table className="table table-bordered table-sm">
                <thead><tr><th>No</th><th>Code</th><th>Description</th><th>Batch No</th><th>Expired Date</th><th>Qty</th></tr></thead>
                <tbody>
                  {(details.products || []).map((p, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{p.code}</td>
                      <td>{p.description}</td>
                      <td>{p.batch_no}</td>
                      <td>{p.expired_date}</td>
                      <td>{p.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {details.barcode && (
                <div className="text-center mt-2">
                  <img src={`data:image/png;base64,${details.barcode}`} alt="QR" style={{ maxWidth: 120, height: 'auto' }} />
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-muted">No data</div>
          )}
        </div>
      </FormModal>

      {/* Edit Modal */}
      <FormModal moduleName="Update Delivery" modalState={showEditModal} toggleFormModal={closeEdit} width="560px">
        <div className="modal-body">
          <form onSubmit={handleEditSubmit}>
            <div className="row">
              <div className="col-md-6 form-group">
                <label>Delivery Reference</label>
                <p className="form-control-plaintext">{editForm.reference_no}</p>
              </div>
              <div className="col-md-6 form-group">
                <label>Sale Reference</label>
                <p className="form-control-plaintext">{editForm.sale_reference}</p>
              </div>
              <div className="col-md-12 form-group">
                <label>Status *</label>
                <select
                  className="form-control"
                  value={editForm.status}
                  onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                  required
                >
                  <option value="1">Packing</option>
                  <option value="2">Delivering</option>
                  <option value="3">Delivered</option>
                </select>
              </div>
              <div className="col-md-6 form-group">
                <label>Courier</label>
                <select
                  className="form-control"
                  value={editForm.courier_id}
                  onChange={(e) => setEditForm((f) => ({ ...f, courier_id: e.target.value }))}
                >
                  <option value="">Select courier...</option>
                  {couriers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6 form-group">
                <label>Delivered By</label>
                <input
                  type="text"
                  className="form-control"
                  value={editForm.delivered_by}
                  onChange={(e) => setEditForm((f) => ({ ...f, delivered_by: e.target.value }))}
                />
              </div>
              <div className="col-md-6 form-group">
                <label>Recieved By</label>
                <input
                  type="text"
                  className="form-control"
                  value={editForm.recieved_by}
                  onChange={(e) => setEditForm((f) => ({ ...f, recieved_by: e.target.value }))}
                />
              </div>
              <div className="col-md-6 form-group">
                <label>Customer</label>
                <p className="form-control-plaintext">{editForm.customer_name}</p>
              </div>
              <div className="col-md-12 form-group">
                <label>Address *</label>
                <textarea
                  rows={3}
                  className="form-control"
                  value={editForm.address}
                  onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-12 form-group">
                <label>Note</label>
                <textarea
                  rows={2}
                  className="form-control"
                  value={editForm.note}
                  onChange={(e) => setEditForm((f) => ({ ...f, note: e.target.value }))}
                />
              </div>
            </div>
            <div className="form-group mb-0">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Updating...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </FormModal>

      {/* Delete confirm */}
      <FormModal
        moduleName="Confirm delete"
        modalState={deleteDialog}
        toggleFormModal={() => { setDeleteDialog(false); setItemToDelete(null); }}
        width="420px"
      >
        <div className="modal-body">
          <p>
            Are you sure you want to delete delivery <strong>"{itemToDelete?.reference_no}"</strong>?
          </p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={() => { setDeleteDialog(false); setItemToDelete(null); }}>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={handleDelete}>
            <SafeFontAwesomeIcon icon={faTrash} className="mr-2" size="sm" /> Delete
          </button>
        </div>
      </FormModal>
    </div>
  );
};

export default DeliveryList;
