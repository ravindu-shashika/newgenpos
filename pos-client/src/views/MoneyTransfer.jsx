import React, { useState, useEffect } from 'react';
import { api, msg } from '../services';
import { FormModal, Loader, SafeFontAwesomeIcon } from '../components';
import { faPlus, faEdit, faTrash, faExchangeAlt, faSearch } from '@fortawesome/free-solid-svg-icons';

const MoneyTransfer = () => {
    const [transfers, setTransfers] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        from_account_id: '',
        to_account_id: '',
        amount: '',
        created_at: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await api.get('money-transfers');
            if (response.status === 200 && response.data.status === 200) {
                setTransfers(response.data.data.transfers);
                setAccounts(response.data.data.accounts);
            } else {
                msg.error(response.data?.message || 'Failed to fetch money transfers');
            }
        } catch (error) {
            msg.error('An error occurred while fetching data');
        } finally {
            setLoading(false);
        }
    };

    const handleValueChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const toggleModal = () => {
        if (showModal) {
            setFormData({
                id: '',
                from_account_id: '',
                to_account_id: '',
                amount: '',
                created_at: new Date().toISOString().split('T')[0]
            });
            setIsEdit(false);
        }
        setShowModal(!showModal);
    };

    const handleEdit = (transfer) => {
        setFormData({
            id: transfer.id,
            from_account_id: transfer.from_account_id,
            to_account_id: transfer.to_account_id,
            amount: transfer.amount,
            created_at: transfer.created_at.split('T')[0]
        });
        setIsEdit(true);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.from_account_id === formData.to_account_id) {
            msg.warning('From Account and To Account cannot be the same!');
            return;
        }

        try {
            let response;
            if (isEdit) {
                response = await api.update(`money-transfers/${formData.id}`).values(formData);
            } else {
                response = await api.post('money-transfers').values(formData);
            }

            if (response.status === 200 && response.data.status === 200) {
                msg.success(response.data.message);
                toggleModal();
                fetchData();
            } else {
                msg.error(response.data?.message || 'Something Went Wrong...');
            }
        } catch (error) {
            msg.error('An error occurred during submission');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this transfer?')) {
            try {
                const response = await api.delete(`money-transfers/${id}`);
                if (response.status === 200 && response.data.status === 200) {
                    msg.success(response.data.message);
                    fetchData();
                } else {
                    msg.error(response.data?.message || 'Deletion failed');
                }
            } catch (error) {
                msg.error('Deletion failed');
            }
        }
    };

    return (
        <div className="container-fluid py-4">
            <div className="card shadow-lg border-0 mb-4 overflow-hidden">
                <div className="card-header bg-gradient-info text-white py-3 border-0 d-flex justify-content-between align-items-center">
                    <div>
                        <h3 className="mb-0 font-weight-bold">Money Transfer</h3>
                        <p className="mb-0 small opacity-75">Move funds between accounts</p>
                    </div>
                    <button className="btn btn-light shadow-sm" onClick={toggleModal}>
                        <SafeFontAwesomeIcon icon={faPlus} className="mr-2 text-info" /> Add Transfer
                    </button>
                </div>

                <div className="table-responsive">
                    <table className="table table-hover mb-0">
                        <thead className="bg-light">
                            <tr>
                                <th className="px-4 py-3">#</th>
                                <th className="py-3 text-center">Date</th>
                                <th className="py-3">Reference No</th>
                                <th className="py-3">From Account</th>
                                <th className="py-3 text-center"><SafeFontAwesomeIcon icon={faExchangeAlt} className="text-muted" /></th>
                                <th className="py-3">To Account</th>
                                <th className="text-right py-3">Amount</th>
                                <th className="text-center py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-5">
                                        <Loader />
                                    </td>
                                </tr>
                            ) : transfers.length > 0 ? (
                                transfers.map((transfer, index) => (
                                    <tr key={transfer.id} className="align-middle">
                                        <td className="px-4 text-muted font-weight-bold">{index + 1}</td>
                                        <td className="text-center small text-muted">
                                            {new Date(transfer.created_at).toLocaleDateString()} {new Date(transfer.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td><span className="badge badge-light border px-2 py-1">{transfer.reference_no}</span></td>
                                        <td><span className="font-weight-bold text-danger">{transfer.from_account?.name}</span></td>
                                        <td className="text-center"><SafeFontAwesomeIcon icon={faExchangeAlt} className="text-info opacity-50" /></td>
                                        <td><span className="font-weight-bold text-success">{transfer.to_account?.name}</span></td>
                                        <td className="text-right font-weight-bold h6 mb-0">
                                            {Number(transfer.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="text-center">
                                            <div className="btn-group shadow-sm rounded">
                                                <button className="btn btn-sm btn-outline-info" onClick={() => handleEdit(transfer)} title="Edit">
                                                    <SafeFontAwesomeIcon icon={faEdit} />
                                                </button>
                                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(transfer.id)} title="Delete">
                                                    <SafeFontAwesomeIcon icon={faTrash} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="text-center py-5 text-muted">No transfer records found.</td>
                                </tr>
                            )}
                        </tbody>
                        {!loading && transfers.length > 0 && (
                            <tfoot className="bg-light-50 font-weight-bold">
                                <tr>
                                    <td colSpan="6" className="text-right py-3 px-4 uppercase small">Total Transferred</td>
                                    <td className="text-right py-3 h5 mb-0 text-primary">
                                        {transfers.reduce((sum, t) => sum + Number(t.amount), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            <FormModal
                moduleName={isEdit ? 'Update Transfer' : 'Add Money Transfer'}
                modalState={showModal}
                toggleFormModal={toggleModal}
            >
                <form onSubmit={handleSubmit} className="p-3">
                    <p className="small text-muted italic mb-4">The field labels marked with * are required input fields.</p>
                    
                    {isEdit && (
                        <div className="form-group mb-3">
                            <label className="font-weight-bold small">Date</label>
                            <input 
                                type="date" 
                                name="created_at" 
                                className="form-control" 
                                value={formData.created_at} 
                                onChange={handleValueChange} 
                            />
                        </div>
                    )}

                    <div className="row">
                        <div className="col-md-6 form-group mb-3">
                            <label className="font-weight-bold small">From Account *</label>
                            <select 
                                name="from_account_id" 
                                className="form-control" 
                                required 
                                value={formData.from_account_id}
                                onChange={handleValueChange}
                            >
                                <option value="">Select from account...</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name} [{acc.account_no}]</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-6 form-group mb-3">
                            <label className="font-weight-bold small">To Account *</label>
                            <select 
                                name="to_account_id" 
                                className="form-control" 
                                required 
                                value={formData.to_account_id}
                                onChange={handleValueChange}
                            >
                                <option value="">Select to account...</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name} [{acc.account_no}]</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group mb-4">
                        <label className="font-weight-bold small">Amount *</label>
                        <div className="input-group">
                            <div className="input-group-prepend">
                                <span className="input-group-text">$</span>
                            </div>
                            <input 
                                type="number" 
                                name="amount" 
                                step="any" 
                                className="form-control" 
                                required 
                                value={formData.amount} 
                                onChange={handleValueChange} 
                            />
                        </div>
                    </div>

                    <div className="d-flex justify-content-end gap-2">
                        <button type="button" className="btn btn-secondary mr-2" onClick={toggleModal}>Close</button>
                        <button type="submit" className="btn btn-primary px-4 shadow-sm">{isEdit ? 'Update Transfer' : 'Submit Transfer'}</button>
                    </div>
                </form>
            </FormModal>

            <style>{`
                .bg-gradient-info {
                    background: linear-gradient(135deg, #36b9cc 0%, #258391 100%);
                }
                .bg-light-50 {
                    background-color: rgba(0,0,0,0.02);
                }
                .gap-2 { gap: 0.5rem; }
                .opacity-75 { opacity: 0.75; }
                .opacity-50 { opacity: 0.5; }
                .align-middle td { vertical-align: middle !important; }
            `}</style>
        </div>
    );
};

export default MoneyTransfer;
