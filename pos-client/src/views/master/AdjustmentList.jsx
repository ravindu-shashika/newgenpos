import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, msg } from '../../services';
import { SafeFontAwesomeIcon } from '../../components';
import { faPlus, faTrash, faEdit } from '@fortawesome/free-solid-svg-icons';

const moduleName = 'Quantity Adjustment';

const AdjustmentList = () => {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchList();
  }, []);

  const fetchList = async () => {
    try {
      const res = await api.get('adjustments/list');
      const data = res?.data;
      if (data?.status === 200 && Array.isArray(data?.data)) {
        setList(data.data);
      }
    } catch (e) {
      msg.error(e?.response?.data?.message || 'Failed to load adjustments');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete?')) return;
    try {
      const res = await api.delete('adjustments/' + id);
      if (res?.status === 200 || res?.data?.status === 200) {
        setList((prev) => prev.filter((a) => a.id !== id));
        msg.success('Deleted successfully');
      } else {
        msg.error(res?.data?.message || 'Delete failed');
      }
    } catch (e) {
      msg.error(e?.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="container-fluid">
      <h5 className="mb-3">{moduleName}</h5>
      <div className="mb-3">
        <button
          type="button"
          className="btn btn-info"
          onClick={() => navigate('/adjustment-create')}
        >
          <SafeFontAwesomeIcon icon={faPlus} className="mr-2" /> Add Adjustment
        </button>
      </div>
      {loading ? (
        <div className="text-center p-5">
          <span className="spinner-border text-primary" /> Loading...
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Reference</th>
                <th>Warehouse</th>
                <th>Products</th>
                <th>Note</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row, idx) => (
                <tr key={row.id}>
                  <td>{idx + 1}</td>
                  <td>{row.created_at}</td>
                  <td>{row.reference_no}</td>
                  <td>{row.warehouse_name}</td>
                  <td>
                    <small style={{ whiteSpace: 'pre-line' }}>{row.products || '-'}</small>
                  </td>
                  <td>{row.note || '-'}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-link p-0 mr-2"
                      onClick={() => navigate('/adjustment-edit/' + row.id)}
                    >
                      <SafeFontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-danger p-0"
                      onClick={() => handleDelete(row.id)}
                    >
                      <SafeFontAwesomeIcon icon={faTrash} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && (
            <p className="text-muted text-center py-4">No adjustments found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdjustmentList;
