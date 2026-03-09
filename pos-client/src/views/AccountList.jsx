import React, { useState, useEffect } from 'react';
import { api, msg } from '../services';
import { FormModal, Loader, SystemButton, SafeFontAwesomeIcon } from '../components';
import { faPlus, faEdit, faFileAlt, faTrash, faCheck, faTimes, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

const AccountList = () => {
    const navigate = useNavigate();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [formData, setFormData] = useState({
        account_id: '',
        account_no: '',
        name: '',
        initial_balance: '',
        note: ''
    });

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const response = await api.get('accounts');
            if (response.status == 200 && response.data.status == 200) {
                setAccounts(response.data.data);
            } else {
                msg.error(response.data.message);
            }
        } catch (error) {
            msg.error(response.data.message);
        } finally {
            setLoading(false);
        }
    };

    const handleValueChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const toggleModal = () => {
        if (showModal) {
            setFormData({ account_id: '', account_no: '', name: '', initial_balance: '', note: '' });
            setIsEdit(false);
        }
        setShowModal(!showModal);
    };

    const handleEdit = (account) => {
        setFormData({
            account_id: account.id,
            account_no: account.account_no,
            name: account.name,
            initial_balance: account.initial_balance || '',
            note: account.note || ''
        });
        setIsEdit(true);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let response;
            if (isEdit) {
                response = await api.update(`accounts/${formData.account_id}`).values(formData);
            } else {
                response = await api.post('accounts').values(formData);
            }

            if (response.status == 200 && response.data.status == 200) {
                msg.success(response.data.message);
                toggleModal();
                fetchAccounts();
            } else if (response.status == 200 && response.data.status == 409) {
                msg.warning(response.data.message);
            } else if (response.status == 200 && response.data.status == 401) {
                msg.warning(response.data.message);
            } else if (response.status == 200 && response.data.status == 500) {
                response.data.error?.map((err) => {
                    msg.error(err);
                });
            } else {
                msg.error(response.data?.message || 'Something Went Wrong...');
            }
        } catch (error) {
            msg.error('An error occurred');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this account?')) {
            try {
                const response = await api.delete(`accounts/${id}`);
                if (response.status == 200 && response.data.status == 200) {
                    msg.success(response.data.message);
                    fetchAccounts();
                } else if (response.status == 200 && (response.data.status == 403 || response.data.status == 401)) {
                    msg.warning(response.data.message);
                } else {
                    msg.error(response.data?.message || 'Something Went Wrong...');
                }
            } catch (error) {
                msg.error('Deletion failed');
            }
        }
    };

    const handleMakeDefault = async (id, currentDefault) => {
        if (currentDefault) {
            msg.warning('Please make another account default first!');
            return;
        }
        try {
            const response = await api.get(`make-default/${id}`);
            if (response.status == 200 && response.data.status == 200) {
                msg.success(response.data.message);
                fetchAccounts();
            } else {
                msg.error(response.data?.message || 'Failed to update default account');
            }
        } catch (error) {
            msg.error('Failed to update default account');
        }
    };

    const viewStatement = (accountId) => {
        // We can navigate to account statement with account_id or just navigate 
        // and let them select, but navigating with state is better.
        // For now, let's just navigate to the route we enabled.
        navigate('/account-statement', { state: { account_id: accountId } });
    };

    return (
        <div className="container-fluid py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="text-primary font-weight-bold mb-0">Account List</h3>
                <button className="btn btn-info shadow-sm" onClick={toggleModal}>
                    <SafeFontAwesomeIcon icon={faPlus} className="mr-2" /> Add Account
                </button>
            </div>

            <div className="card shadow-sm border-0">
                <div className="table-responsive">
                    <table className="table table-hover table-striped mb-0">
                        <thead className="thead-dark">
                            <tr>
                                <th className="border-0">#</th>
                                <th className="border-0">Account No</th>
                                <th className="border-0">Name</th>
                                <th className="border-0 text-right">Initial Balance</th>
                                <th className="border-0 text-right">Available Balance</th>
                                <th className="border-0 text-center">Default</th>
                                <th className="border-0">Note</th>
                                <th className="border-0 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-5">
                                        <Loader />
                                    </td>
                                </tr>
                            ) : accounts.length > 0 ? (
                                accounts.map((account, index) => (
                                    <tr key={account.id}>
                                        <td>{index + 1}</td>
                                        <td><span className="badge badge-light border">{account.account_no}</span></td>
                                        <td className="font-weight-bold">{account.name}</td>
                                        <td className="text-right">
                                            {Number(account.initial_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="text-right font-weight-bold text-info">
                                            {Number(account.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="text-center">
                                            <div className="custom-control custom-switch">
                                                <input
                                                    type="checkbox"
                                                    className="custom-control-input"
                                                    id={`customSwitch${account.id}`}
                                                    checked={account.is_default}
                                                    onChange={() => handleMakeDefault(account.id, account.is_default)}
                                                />
                                                <label className="custom-control-label" htmlFor={`customSwitch${account.id}`}>
                                                    {account.is_default ? 'Yes' : 'No'}
                                                </label>
                                            </div>
                                        </td>
                                        <td className="small text-muted">{account.note || '---'}</td>
                                        <td className="text-center">
                                            <div className="dropdown">
                                                <button className="btn btn-light btn-sm dropdown-toggle border" type="button" data-toggle="dropdown">
                                                    Action
                                                </button>
                                                <div className="dropdown-menu dropdown-menu-right shadow border-0">
                                                    <button className="dropdown-item py-2" onClick={() => handleEdit(account)}>
                                                        <SafeFontAwesomeIcon icon={faEdit} className="mr-2 text-info" /> Edit
                                                    </button>
                                                    <button className="dropdown-item py-2" onClick={() => viewStatement(account.id)}>
                                                        <SafeFontAwesomeIcon icon={faFileAlt} className="mr-2 text-primary" /> Statement
                                                    </button>
                                                    <div className="dropdown-divider"></div>
                                                    <button className="dropdown-item py-2 text-danger" onClick={() => handleDelete(account.id)}>
                                                        <SafeFontAwesomeIcon icon={faTrash} className="mr-2" /> Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="text-center py-4 text-muted">No accounts found.</td>
                                </tr>
                            )}
                        </tbody>
                        {accounts.length > 0 && (
                            <tfoot className="bg-light">
                                <tr>
                                    <th colSpan="3" className="text-right">Total</th>
                                    <th className="text-right">
                                        {accounts.reduce((sum, acc) => sum + Number(acc.initial_balance || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </th>
                                    <th className="text-right">
                                        {accounts.reduce((sum, acc) => sum + Number(acc.balance || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </th>
                                    <th colSpan="3"></th>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            <FormModal
                moduleName={isEdit ? 'Update Account' : 'Add Account'}
                modalState={showModal}
                toggleFormModal={toggleModal}
            >
                <form onSubmit={handleSubmit} className="p-3">
                    <p className="small text-muted italic mb-4">The field labels marked with * are required input fields.</p>
                    <div className="form-group mb-3">
                        <label className="font-weight-bold small">Account No *</label>
                        <input
                            type="text"
                            name="account_no"
                            required
                            className="form-control"
                            value={formData.account_no}
                            onChange={handleValueChange}
                        />
                    </div>
                    <div className="form-group mb-3">
                        <label className="font-weight-bold small">Name *</label>
                        <input
                            type="text"
                            name="name"
                            required
                            className="form-control"
                            value={formData.name}
                            onChange={handleValueChange}
                        />
                    </div>
                    <div className="form-group mb-3">
                        <label className="font-weight-bold small">Initial Balance</label>
                        <input
                            type="number"
                            name="initial_balance"
                            step="any"
                            className="form-control"
                            value={formData.initial_balance}
                            onChange={handleValueChange}
                        />
                    </div>
                    <div className="form-group mb-4">
                        <label className="font-weight-bold small">Note</label>
                        <textarea
                            name="note"
                            rows="3"
                            className="form-control"
                            value={formData.note}
                            onChange={handleValueChange}
                        ></textarea>
                    </div>
                    <div className="d-flex justify-content-end">
                        <button type="button" className="btn btn-secondary mr-2" onClick={toggleModal}>Close</button>
                        <button type="submit" className="btn btn-primary">{isEdit ? 'Update' : 'Save'}</button>
                    </div>
                </form>
            </FormModal>

            <style>{`
                .custom-switch .custom-control-label::before { height: 1.5rem; width: 2.75rem; border-radius: 1rem; }
                .custom-switch .custom-control-label::after { width: calc(1.5rem - 4px); height: calc(1.5rem - 4px); background-color: #adb5bd; border-radius: 50%; transition: transform .15s ease-in-out,background-color .15s ease-in-out,border-color .15s ease-in-out,box-shadow .15s ease-in-out; }
                .custom-switch .custom-control-input:checked ~ .custom-control-label::after { transform: translateX(1.25rem); background-color: #fff; }
                .custom-switch .custom-control-input:checked ~ .custom-control-label::before { color: #fff; border-color: #28a745; background-color: #28a745; }
                .dropdown-item:active { background-color: #f8f9fa; color: inherit; }
                .dropdown-item { cursor: pointer; transition: all 0.2s; }
                .dropdown-item:hover { background-color: #f8f9fa; transform: translateX(3px); }
            `}</style>
        </div>
    );
};

export default AccountList;
