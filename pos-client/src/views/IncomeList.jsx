import React, { useState, useEffect } from 'react';
import { api, msg } from '../services';
import { Loader, SafeFontAwesomeIcon, FormModal } from '../components';
import { faPlus, faEdit, faTrash, faEllipsisV, faSearch, faCalendarAlt, faWarehouse } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

const IncomeList = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [incomes, setIncomes] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [incomeCategories, setIncomeCategories] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);

    // Filters
    const [startingDate, setStartingDate] = useState('');
    const [endingDate, setEndingDate] = useState('');
    const [warehouseId, setWarehouseId] = useState(0);

    // Modal state
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [formData, setFormData] = useState({
        income_id: '',
        reference_no: '',
        created_at: new Date().toISOString().split('T')[0],
        income_category_id: '',
        warehouse_id: '',
        amount: '',
        account_id: '',
        note: ''
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const response = await api.get('incomes');
            if (response.status === 200 && response.data.status === 200) {
                setStartingDate(response.data.starting_date);
                setEndingDate(response.data.ending_date);
                setWarehouses(response.data.lims_warehouse_list);
                setAccounts(response.data.lims_account_list);
                setIncomeCategories(response.data.lims_income_category_list);
                setPermissions(response.data.all_permission || []);

                // Fetch incomes based on initial dates
                fetchIncomes(response.data.starting_date, response.data.ending_date, response.data.warehouse_id, response.data.all_permission || []);
            }
        } catch (error) {
            msg.error('Failed to load initial data');
        } finally {
            setLoading(false);
        }
    };

    const fetchIncomes = async (start = startingDate, end = endingDate, whId = warehouseId, perms = permissions) => {
        setLoading(true);
        try {
            const response = await api.post('incomes/income-data', {
                starting_date: start,
                ending_date: end,
                warehouse_id: whId,
                all_permission: perms,
                length: -1,
                start: 0,
                'order.0.column': 1,
                'order.0.dir': 'desc',
                'search.value': ''
            });

            if (response.status === 200) {
                setIncomes(response.data.data || []);
                setSelectedIds([]);
            }
        } catch (error) {
            msg.error('Failed to fetch income data');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        fetchIncomes();
    };

    const handleOpenAddModal = () => {
        setFormData({
            income_id: '',
            reference_no: 'er-' + new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14),
            created_at: new Date().toISOString().split('T')[0],
            income_category_id: '',
            warehouse_id: warehouseId !== 0 ? warehouseId : '',
            amount: '',
            account_id: accounts.find(a => a.is_default)?.id || (accounts[0]?.id || ''),
            note: ''
        });
        setShowAddModal(true);
    };

    const handleEdit = async (id) => {
        setLoading(true);
        try {
            const response = await api.get(`incomes/${id}/edit`);
            if (response.status === 200 && response.data.status === 200) {
                const data = response.data.data;
                setFormData({
                    income_id: data.id,
                    reference_no: data.reference_no,
                    created_at: data.created_at.split(' ')[0],
                    income_category_id: data.income_category_id,
                    warehouse_id: data.warehouse_id,
                    amount: data.amount,
                    account_id: data.account_id,
                    note: data.note || ''
                });
                setShowEditModal(true);
            }
        } catch (error) {
            msg.error('Failed to fetch income details');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure want to delete?')) return;
        try {
            const response = await api.delete(`incomes/${id}`);
            if (response.status === 200 && response.data.status === 200) {
                msg.success(response.data.message);
                fetchIncomes();
            }
        } catch (error) {
            msg.error('An error occurred during deletion');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) {
            msg.error('Nothing is selected!');
            return;
        }
        if (!window.confirm('Are you sure want to delete?')) return;

        try {
            const response = await api.post('incomes/deletebyselection', {
                incomeIdArray: selectedIds
            });
            if (response.status === 200 && response.data.status === 200) {
                msg.success(response.data.message);
                fetchIncomes();
            }
        } catch (error) {
            msg.error('Bulk deletion failed');
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === incomes.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(incomes.map(item => item.id));
        }
    };

    const toggleSelect = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let response;
            if (showEditModal) {
                response = await api.put(`incomes/${formData.income_id}`, formData);
            } else {
                response = await api.post('incomes', formData);
            }

            if (response.status === 200 && response.data.status === 200) {
                msg.success(response.data.message);
                setShowAddModal(false);
                setShowEditModal(false);
                fetchIncomes();
            } else {
                msg.error(response.data.message || 'Operation failed');
            }
        } catch (error) {
            msg.error('An error occurred while saving');
        }
    };

    return (
        <div className="container-fluid py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="font-weight-bold text-dark mb-0">Income List</h3>
                    <p className="text-muted small mb-0">Manage your income records and transactions</p>
                </div>
                <div className="d-flex gap-2">
                    {permissions.includes('incomes.create') && (
                        <button className="btn btn-info shadow-sm d-flex align-items-center px-4" onClick={handleOpenAddModal}>
                            <SafeFontAwesomeIcon icon={faPlus} className="mr-2" /> Add Income
                        </button>
                    )}
                </div>
            </div>

            <div className="card shadow-sm border-0 rounded-xl mb-4">
                <div className="card-body p-4 text-center">
                    <form onSubmit={handleFilterSubmit} className="d-flex flex-wrap justify-content-center align-items-end gap-3">
                        <div className="text-left">
                            <label className="small font-weight-bold text-muted mb-1 d-block text-center">Choose Your Date</label>
                            <div className="input-group border rounded shadow-sm overflow-hidden bg-white" style={{ maxWidth: '350px' }}>
                                <span className="input-group-text bg-white border-0 px-3">
                                    <SafeFontAwesomeIcon icon={faCalendarAlt} className="text-primary" />
                                </span>
                                <input
                                    type="date"
                                    className="form-control border-0 shadow-none bg-transparent py-2 px-1"
                                    value={startingDate}
                                    onChange={(e) => setStartingDate(e.target.value)}
                                />
                                <span className="input-group-text bg-white border-0 px-1 text-muted">To</span>
                                <input
                                    type="date"
                                    className="form-control border-0 shadow-none bg-transparent py-2 px-1"
                                    value={endingDate}
                                    onChange={(e) => setEndingDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="text-left">
                            <label className="small font-weight-bold text-muted mb-1 d-block text-center">Choose Warehouse</label>
                            <div className="input-group border rounded shadow-sm overflow-hidden bg-white" style={{ minWidth: '200px' }}>
                                <span className="input-group-text bg-white border-0 px-3">
                                    <SafeFontAwesomeIcon icon={faWarehouse} className="text-primary" />
                                </span>
                                <select
                                    className="form-control border-0 shadow-none bg-transparent py-2"
                                    value={warehouseId}
                                    onChange={(e) => setWarehouseId(e.target.value)}
                                >
                                    <option value="0">All Warehouses</option>
                                    {warehouses.map(wh => (
                                        <option key={wh.id} value={wh.id}>{wh.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <button type="submit" className="btn btn-primary px-4 py-2 shadow-sm font-weight-bold">
                                Submit
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="mb-3">
                {selectedIds.length > 0 && permissions.includes('incomes-delete') && (
                    <button className="btn btn-danger shadow-sm d-flex align-items-center px-4" onClick={handleBulkDelete}>
                        <SafeFontAwesomeIcon icon={faTrash} className="mr-2" /> Delete Selected
                    </button>
                )}
            </div>

            <div className="card shadow-lg border-0 rounded-xl overflow-hidden">
                <div className="table-responsive">
                    <table className="table table-hover mb-0">
                        <thead className="bg-light">
                            <tr>
                                <th className="px-4 py-3" style={{ width: '40px' }}>
                                    <div className="custom-control custom-checkbox">
                                        <input
                                            type="checkbox"
                                            className="custom-control-input"
                                            id="select-all"
                                            checked={incomes.length > 0 && selectedIds.length === incomes.length}
                                            onChange={toggleSelectAll}
                                        />
                                        <label className="custom-control-label" htmlFor="select-all"></label>
                                    </div>
                                </th>
                                <th className="py-3 text-muted small text-uppercase font-weight-bold">Date</th>
                                <th className="py-3 text-muted small text-uppercase font-weight-bold">Reference</th>
                                <th className="py-3 text-muted small text-uppercase font-weight-bold">Warehouse</th>
                                <th className="py-3 text-muted small text-uppercase font-weight-bold">Category</th>
                                <th className="py-3 text-muted small text-uppercase font-weight-bold text-right">Amount</th>
                                <th className="py-3 text-muted small text-uppercase font-weight-bold">Note</th>
                                <th className="text-center py-3 pr-4 text-muted small text-uppercase font-weight-bold">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-5">
                                        <Loader />
                                        <p className="mt-3 text-muted small">Loading income records...</p>
                                    </td>
                                </tr>
                            ) : incomes.length > 0 ? (
                                incomes.map((income) => (
                                    <tr key={income.id} className={`align-middle ${selectedIds.includes(income.id) ? 'bg-light-soft' : ''}`}>
                                        <td className="px-4">
                                            <div className="custom-control custom-checkbox">
                                                <input
                                                    type="checkbox"
                                                    className="custom-control-input"
                                                    id={`income-${income.id}`}
                                                    checked={selectedIds.includes(income.id)}
                                                    onChange={() => toggleSelect(income.id)}
                                                />
                                                <label className="custom-control-label" htmlFor={`income-${income.id}`}></label>
                                            </div>
                                        </td>
                                        <td>{income.date}</td>
                                        <td className="font-weight-bold text-dark">{income.reference_no}</td>
                                        <td>{income.warehouse}</td>
                                        <td>{income.incomeCategory}</td>
                                        <td className="text-right font-weight-bold text-primary">{income.amount}</td>
                                        <td className="text-muted small" style={{ maxWidth: '200px' }} title={income.note}>
                                            {income.note || '-'}
                                        </td>
                                        <td className="text-center pr-4">
                                            <div className="dropdown">
                                                <button className="btn btn-sm btn-light border-0 rounded-circle" type="button" data-toggle="dropdown">
                                                    <SafeFontAwesomeIcon icon={faEllipsisV} className="text-muted" />
                                                </button>
                                                <div className="dropdown-menu dropdown-menu-right shadow-lg border-0 p-2 rounded-lg">
                                                    {permissions.includes('incomes-edit') && (
                                                        <button
                                                            className="dropdown-item py-2 px-3 rounded d-flex align-items-center"
                                                            onClick={() => handleEdit(income.id)}
                                                        >
                                                            <SafeFontAwesomeIcon icon={faEdit} className="mr-2 text-info" /> Edit
                                                        </button>
                                                    )}
                                                    {permissions.includes('incomes-delete') && (
                                                        <button
                                                            className="dropdown-item py-2 px-3 rounded d-flex align-items-center text-danger"
                                                            onClick={() => handleDelete(income.id)}
                                                        >
                                                            <SafeFontAwesomeIcon icon={faTrash} className="mr-2" /> Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="text-center py-5 text-muted">No records found.</td>
                                </tr>
                            )}
                        </tbody>
                        {incomes.length > 0 && (
                            <tfoot className="bg-light font-weight-bold">
                                <tr>
                                    <td colSpan="1"></td>
                                    <td colSpan="4" className="text-right py-3 px-4">Total</td>
                                    <td className="text-right py-3 text-primary">
                                        {incomes.reduce((acc, curr) => acc + parseFloat(curr.amount.replace(/,/g, '') || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td colSpan="2"></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            {/* Add Income Modal (matches #income-modal in layout/main.blade.php) */}
            <FormModal
                moduleName="Add Income"
                modalState={showAddModal}
                toggleFormModal={() => setShowAddModal(false)}
            >
                <div className="p-4">
                    <p className="small text-muted italic mb-4">The field labels marked with * are required input fields.</p>
                    <form onSubmit={handleSubmit}>
                        <div className="row g-3">
                            <div className="col-md-6 mb-3">
                                <label className="small font-weight-bold mb-1">Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={formData.created_at}
                                    onChange={(e) => setFormData({ ...formData, created_at: e.target.value })}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="small font-weight-bold mb-1">Income Category *</label>
                                <select
                                    className="form-control"
                                    required
                                    value={formData.income_category_id}
                                    onChange={(e) => setFormData({ ...formData, income_category_id: e.target.value })}
                                >
                                    <option value="">Select Income Category...</option>
                                    {incomeCategories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name} ({cat.code})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="small font-weight-bold mb-1">Warehouse *</label>
                                <select
                                    className="form-control"
                                    required
                                    value={formData.warehouse_id}
                                    onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                                >
                                    <option value="">Select Warehouse...</option>
                                    {warehouses.map(wh => (
                                        <option key={wh.id} value={wh.id}>{wh.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="small font-weight-bold mb-1">Amount *</label>
                                <input
                                    type="number"
                                    step="any"
                                    className="form-control"
                                    required
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="small font-weight-bold mb-1">Account</label>
                                <select
                                    className="form-control"
                                    value={formData.account_id}
                                    onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                                >
                                    <option value="">Select Account...</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name} [{acc.account_no}]</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="form-group mt-3">
                            <label className="small font-weight-bold mb-1">Note</label>
                            <textarea
                                rows="3"
                                className="form-control"
                                value={formData.note}
                                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                            ></textarea>
                        </div>
                        <div className="mt-4 pt-3 border-top text-right">
                            <button type="submit" className="btn btn-primary px-5 font-weight-bold">
                                Submit
                            </button>
                        </div>
                    </form>
                </div>
            </FormModal>

            {/* Edit Income Modal (matches #editModal in index.blade.php) */}
            <FormModal
                moduleName="Update Income"
                modalState={showEditModal}
                toggleFormModal={() => setShowEditModal(false)}
            >
                <div className="p-4">
                    <p className="small text-muted italic mb-4">The field labels marked with * are required input fields.</p>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group mb-4">
                            <label className="small font-weight-bold mb-1">Reference</label>
                            <p className="h6 text-muted mb-0">{formData.reference_no}</p>
                            <input type="hidden" name="income_id" value={formData.income_id} />
                        </div>
                        <div className="row g-3">
                            <div className="col-md-6 mb-3">
                                <label className="small font-weight-bold mb-1">Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={formData.created_at}
                                    onChange={(e) => setFormData({ ...formData, created_at: e.target.value })}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="small font-weight-bold mb-1">Income Category *</label>
                                <select
                                    className="form-control"
                                    required
                                    value={formData.income_category_id}
                                    onChange={(e) => setFormData({ ...formData, income_category_id: e.target.value })}
                                >
                                    {incomeCategories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name} ({cat.code})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="small font-weight-bold mb-1">Warehouse *</label>
                                <select
                                    className="form-control"
                                    required
                                    value={formData.warehouse_id}
                                    onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                                >
                                    {warehouses.map(wh => (
                                        <option key={wh.id} value={wh.id}>{wh.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="small font-weight-bold mb-1">Amount *</label>
                                <input
                                    type="number"
                                    step="any"
                                    className="form-control"
                                    required
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                />
                            </div>
                            <div className="col-md-12 mb-3">
                                <label className="small font-weight-bold mb-1">Account</label>
                                <select
                                    className="form-control"
                                    value={formData.account_id}
                                    onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                                >
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name} [{acc.account_no}]</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-12 mb-3">
                                <label className="small font-weight-bold mb-1">Note</label>
                                <textarea
                                    rows="3"
                                    className="form-control"
                                    value={formData.note}
                                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                ></textarea>
                            </div>
                        </div>
                        <div className="mt-4 pt-3 border-top text-right">
                            <button type="submit" className="btn btn-primary px-5 font-weight-bold">
                                Submit
                            </button>
                        </div>
                    </form>
                </div>
            </FormModal>

            <style>{`
                .rounded-xl { border-radius: 12px !important; }
                .bg-light-soft { background-color: #f1f5f9; }
                .gap-2 { gap: 0.5rem; }
                .gap-3 { gap: 1rem; }
                .italic { font-style: italic; }
                .badge-light-info { background-color: #e0f2fe; color: #0369a1; }
                .dropdown-item:hover { background-color: #f8fafc; transform: translateX(5px); transition: all 0.2s; }
            `}</style>
        </div>
    );
};

export default IncomeList;
