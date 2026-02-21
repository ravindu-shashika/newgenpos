import React, { useState, useEffect } from 'react';
import { faTimes, faPlus, faCheck, faTrash } from '@fortawesome/free-solid-svg-icons';
import { api, msg } from '../../services';
import { FormModal, ListView, SystemButton, SafeFontAwesomeIcon } from '../../components';

const moduleName = 'Printer';

const defaultForm = {
  name: '',
  warehouse_id: '',
  connection_type: 'network',
  capability_profile: 'default',
  char_per_line: '42',
  ip_address: '',
  port: '9100',
  path: '',
};

const Printer = () => {
  const [entities, setEntities] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [connectionTypes, setConnectionTypes] = useState({});
  const [capabilityProfiles, setCapabilityProfiles] = useState({});
  const [form, setForm] = useState(defaultForm);
  const [showModal, setShowModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [printerToDelete, setPrinterToDelete] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const dataColumns = [
    { title: 'Printer Name', name: 'name', searchable: true },
    { title: 'Warehouse', name: 'warehouse_name', searchable: false },
    { title: 'Connection Type', name: 'connection_type_str', searchable: false },
    { title: 'Capability Profile', name: 'capability_profile_str', searchable: false },
    { title: 'Chars/line', name: 'char_per_line', searchable: false },
    { title: 'IP Address', name: 'ip_address', searchable: false },
    { title: 'Port', name: 'port', searchable: false },
    { title: 'Path', name: 'path', searchable: false },
  ];

  const isNetwork = form.connection_type === 'network';
  const isWinLinux = form.connection_type === 'windows' || form.connection_type === 'linux';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('printers');
      const data = res?.data;
      if (data?.status === 200) {
        const list = (data.data || []).map((p) => ({
          id: p.id,
          name: p.name,
          warehouse_id: p.warehouse_id,
          warehouse_name: p.warehouse?.name ?? '—',
          connection_type: p.connection_type,
          connection_type_str: p.connection_type_str ?? p.connection_type,
          capability_profile: p.capability_profile,
          capability_profile_str: p.capability_profile_str ?? p.capability_profile,
          char_per_line: p.char_per_line,
          ip_address: p.ip_address ?? '—',
          port: p.port ?? '—',
          path: p.path ?? '—',
        }));
        setEntities(list);
        setWarehouses(data.warehouses || []);
        setConnectionTypes(data.connection_types || { network: 'Network', windows: 'Windows', linux: 'Linux' });
        setCapabilityProfiles(data.capability_profiles || { default: 'Default', simple: 'Simple Capability Profile' });
      }
    } catch (err) {
      msg.error(err?.response?.data?.message ?? 'Failed to load printers');
    } finally {
      setIsLoading(false);
    }
  };

  const openNew = () => {
    setForm({
      ...defaultForm,
      warehouse_id: warehouses[0]?.id ?? '',
    });
    setSubmitted(false);
    setIsEdit(false);
    setSelectedId(null);
    setShowModal(true);
  };

  const hideDialog = () => {
    setShowModal(false);
    setForm(defaultForm);
    setSubmitted(false);
    setIsEdit(false);
    setSelectedId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const editRow = async (row) => {
    try {
      const res = await api.get(`printers/${row.id}/edit`);
      const d = res?.data;
      if (d) {
        setForm({
          name: d.name ?? '',
          warehouse_id: String(d.warehouse_id ?? ''),
          connection_type: d.connection_type ?? 'network',
          capability_profile: d.capability_profile ?? 'default',
          char_per_line: String(d.char_per_line ?? '42'),
          ip_address: d.ip_address ?? '',
          port: d.port ?? '9100',
          path: d.path ?? '',
        });
        setSelectedId(row.id);
        setIsEdit(true);
        setSubmitted(false);
        setShowModal(true);
      }
    } catch (err) {
      msg.error(err?.response?.data?.message ?? 'Failed to load printer');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (!form.name?.trim()) {
      msg.error('Printer name is required');
      return;
    }
    if (!form.warehouse_id) {
      msg.error('Warehouse is required');
      return;
    }
    if (isNetwork) {
      if (!form.ip_address?.trim()) {
        msg.error('IP Address is required for network printers');
        return;
      }
      if (!form.port?.trim()) {
        msg.error('Port is required for network printers');
        return;
      }
    }
    if (isWinLinux && !form.path?.trim()) {
      msg.error('Path is required for this connection type');
      return;
    }

    const payload = {
      name: form.name.trim(),
      warehouse_id: form.warehouse_id,
      connection_type: form.connection_type,
      capability_profile: form.capability_profile,
      char_per_line: parseInt(form.char_per_line, 10) || 42,
      ip_address: isNetwork ? form.ip_address : '',
      port: isNetwork ? form.port : '',
      path: isWinLinux ? form.path : '',
    };

    try {
      if (isEdit && selectedId) {
        const res = await api.put(`printers/${selectedId}`, payload);
        const data = res?.data;
        if (res?.status === 200 && data?.status === 200) {
          msg.success(data?.message ?? 'Printer updated');
          hideDialog();
          fetchData();
        } else {
          msg.error(data?.message ?? 'Update failed');
        }
      } else {
        const res = await api.post('printers', payload);
        const data = res?.data;
        if (res?.status === 200 && data?.status === 200) {
          msg.success(data?.message ?? 'Printer added');
          hideDialog();
          fetchData();
        } else {
          msg.error(data?.message ?? 'Add failed');
        }
      }
    } catch (err) {
      const message = err?.response?.data?.message ?? err?.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(' ')
        : 'Failed to save printer';
      msg.error(message);
    }
  };

  const confirmDelete = (row) => {
    setPrinterToDelete(row);
    setDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!printerToDelete?.id) {
      setDeleteDialog(false);
      setPrinterToDelete(null);
      return;
    }
    try {
      const res = await api.delete(`printers/${printerToDelete.id}`);
      const data = res?.data;
      if (res?.status === 200 && data?.status === 200) {
        setEntities((prev) => prev.filter((p) => p.id !== printerToDelete.id));
        msg.success(data?.message ?? 'Printer deleted');
      } else {
        msg.error(data?.message ?? 'Delete failed');
      }
    } catch (err) {
      msg.error(err?.response?.data?.message ?? 'Failed to delete printer');
    }
    setDeleteDialog(false);
    setPrinterToDelete(null);
  };

  return (
    <div>
      <h5 className="text-center">{moduleName}</h5>
      <br />
      <div className="row">
        <div className="col-sm-2">
          <SystemButton type="add-new" method={openNew} showText btnText="Add Printer" />
        </div>
      </div>

      <FormModal
        moduleName={isEdit ? 'Update Printer' : 'Add Printer'}
        modalState={showModal}
        toggleFormModal={hideDialog}
        width="520px"
      >
        <form onSubmit={handleSubmit}>
          <div className="modal-body text-left" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
            <p className="small text-muted">Fields marked with * are required.</p>
            <p className="text-danger small">
              When you assign a receipt printer to a warehouse, browser printing may be turned off. Receipts will use the assigned printer and the template set in invoice settings.
            </p>

            <div className="form-group">
              <label>Name <span className="text-danger">*</span></label>
              <input
                type="text"
                name="name"
                className={`form-control ${submitted && !form.name?.trim() ? 'is-invalid' : ''}`}
                placeholder="Printer Name"
                value={form.name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Warehouse <span className="text-danger">*</span></label>
              <select
                name="warehouse_id"
                className={`form-control ${submitted && !form.warehouse_id ? 'is-invalid' : ''}`}
                value={form.warehouse_id}
                onChange={handleChange}
              >
                <option value="">Select Warehouse...</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Connection Type <span className="text-danger">*</span></label>
              <select name="connection_type" className="form-control" value={form.connection_type} onChange={handleChange}>
                {Object.entries(connectionTypes).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Capability Profile <span className="text-danger">*</span></label>
              <select name="capability_profile" className="form-control" value={form.capability_profile} onChange={handleChange}>
                {Object.entries(capabilityProfiles).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <small className="text-muted">Different printers support different commands. If unsure, use Simple Capability Profile.</small>
            </div>

            <div className="form-group">
              <label>Characters per line <span className="text-danger">*</span></label>
              <input
                type="number"
                name="char_per_line"
                className="form-control"
                placeholder="42"
                value={form.char_per_line}
                onChange={handleChange}
                min={1}
              />
            </div>

            {isNetwork && (
              <>
                <div className="form-group">
                  <label>IP Address <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    name="ip_address"
                    className="form-control"
                    placeholder="Printer IP address"
                    value={form.ip_address}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Port <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    name="port"
                    className="form-control"
                    placeholder="9100"
                    value={form.port}
                    onChange={handleChange}
                  />
                  <small className="text-muted">Most printers use port 9100.</small>
                </div>
              </>
            )}

            {isWinLinux && (
              <div className="form-group">
                <label>Path <span className="text-danger">*</span></label>
                <input
                  type="text"
                  name="path"
                  className="form-control"
                  placeholder={form.connection_type === 'windows' ? 'e.g. LPT1, COM1' : 'e.g. /dev/usb/lp1'}
                  value={form.path}
                  onChange={handleChange}
                />
                <span className="help-block small text-muted">
                  <b>Windows:</b> e.g. LPT1 (parallel) / COM1 (serial).<br />
                  <b>Linux:</b> e.g. /dev/lp0, /dev/usb/lp1, /dev/ttyUSB0, /dev/ttyS0.
                </span>
              </div>
            )}

          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={hideDialog}>
              <SafeFontAwesomeIcon icon={faTimes} className="mr-2" size="sm" />
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <SafeFontAwesomeIcon icon={isEdit ? faCheck : faPlus} className="mr-2" size="sm" />
              {isEdit ? 'Update' : 'Submit'}
            </button>
          </div>
        </form>
      </FormModal>

      {deleteDialog && (
        <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm delete</h5>
                <button type="button" className="close" onClick={() => setDeleteDialog(false)} aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <p className="text-danger font-weight-bold">This action cannot be undone.</p>
                <p>Are you sure you want to delete the printer <strong>"{printerToDelete?.name}"</strong>?</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setDeleteDialog(false)}>
                  <SafeFontAwesomeIcon icon={faTimes} className="mr-2" size="sm" />
                  Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={handleDelete}>
                  <SafeFontAwesomeIcon icon={faTrash} className="mr-2" size="sm" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <br />
      <ListView
        columns={dataColumns}
        rows={entities}
        edit={editRow}
        onDelete={confirmDelete}
        loadingState={isLoading}
        searchAndFetch={() => fetchData()}
        actionsColumn
        showEditButton
        showDeleteButton
        resetSearch={() => fetchData()}
        rowKey="id"
      />
    </div>
  );
};

export default Printer;
