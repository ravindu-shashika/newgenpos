import React, { useState, useEffect } from 'react';
import { api, msg } from '../services';
import { Loader, SafeFontAwesomeIcon, FormModal } from '../components';
import { faPlus, faEdit, faTrash, faEllipsisV, faFilePdf, faFileExcel, faFileCsv, faPrint, faEye, faSearch, faFilter } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import authStore from '../stores/authStore';

const ExpenseList = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(authStore.getUser());

    useEffect(() => {
        const unsubscribe = authStore.subscribe((state) => {
            setUser(state.user);
        });
        return () => unsubscribe();
    }, []);
    const [loading, setLoading] = useState(false);
    const [expenses, setExpenses] = useState([]);
    const [metadata, setMetadata] = useState({
        lims_account_list: [],
        lims_warehouse_list: [],
        lims_expense_category_list: [],
        lims_employee_list: [],
        all_permission: [],
        starting_date: '',
        ending_date: '',
        warehouse_id: 0
    });

    const [filters, setFilters] = useState({
        starting_date: '',
        ending_date: '',
        warehouse_id: 0
    });

    const [selectedIds, setSelectedIds] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        expense_id: '',
        created_at: '',
        warehouse_id: '',
        expense_category_id: '',
        amount: '',
        account_id: '',
        note: '',
        employee_id: '',
        type: 'expense'
    });
    const [documentFile, setDocumentFile] = useState(null);

    useEffect(() => {
        fetchMetadata();
    }, []);

    const fetchMetadata = async () => {
        setLoading(true);
        try {
            const response = await api.get('expenses');
            if (response.status === 200) {
                setMetadata(response.data);
                const initFilters = {
                    starting_date: response.data.starting_date,
                    ending_date: response.data.ending_date,
                    warehouse_id: response.data.warehouse_id
                };
                setFilters(initFilters);
                // fetchExpenses(initFilters);
            }
        } catch (error) {
            msg.error('Failed to fetch metadata');
        } finally {
            setLoading(false);
        }
    };

    // const fetchExpenses = async (f = filters) => {
    //     setLoading(true);
    //     try {
    //         const response = await api.get('expenses/expense-data', {
    //             params: {
    //                 ...f,
    //                 length: -1, // Fetch all for simplicity or handle pagination
    //                 all_permission: metadata.all_permission 
    //             }
    //         });
    //         if (response.status === 200) {
    //             setExpenses(response.data.data);
    //         }
    //     } catch (error) {
    //         msg.error('Failed to fetch expenses');
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        fetchExpenses();
    };

    const handleOpenAddModal = () => {
        setIsEditing(false);
        setFormData({
            expense_id: '',
            created_at: new Date().toISOString().split('T')[0],
            warehouse_id: user?.warehouse_id || '',
            expense_category_id: '',
            amount: '',
            account_id: metadata.lims_account_list.find(a => a.is_default)?.id || '',
            note: '',
            employee_id: '',
            type: 'expense'
        });
        setDocumentFile(null);
        setShowModal(true);
    };

    const handleOpenEditModal = (expense) => {
        setIsEditing(true);
        setFormData({
            expense_id: expense.id,
            created_at: expense.date.split('-').reverse().join('-'), // Assuming DD-MM-YYYY converts to YYYY-MM-DD
            warehouse_id: expense.warehouse_id,
            expense_category_id: expense.expense_category_id,
            amount: expense.amount,
            account_id: expense.account_id,
            note: expense.note || '',
            employee_id: expense.employee_id || '',
            type: expense.type || 'expense'
        });
        setDocumentFile(null);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const data = new FormData();
        Object.keys(formData).forEach(key => {
            data.append(key, formData[key]);
        });
        if (documentFile) {
            data.append('document', documentFile);
        }

        try {
            let response;
            if (isEditing) {
                response = await api.post(`expenses/${formData.expense_id}/update`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                response = await api.post('expenses', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            if (response.data.status === 200) {
                msg.success(response.data.message);
                setShowModal(false);
                fetchExpenses();
            } else {
                msg.error(response.data.message);
            }
        } catch (error) {
            msg.error('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this expense?')) return;
        setLoading(true);
        try {
            const response = await api.delete(`expenses/${id}`);
            if (response.data.status === 200) {
                msg.success(response.data.message);
                fetchExpenses();
            }
        } catch (error) {
            msg.error('Failed to delete');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm('Delete selected expenses?')) return;
        setLoading(true);
        try {
            const response = await api.post('expenses/deletebyselection', {
                expenseIdArray: selectedIds
            });
            if (response.data.status === 200) {
                msg.success(response.data.message);
                setSelectedIds([]);
                fetchExpenses();
            }
        } catch (error) {
            msg.error('Bulk deletion failed');
        } finally {
            setLoading(false);
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === expenses.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(expenses.map(e => e.id));
        }
    };

    const totalAmount = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

    return (
        <div className="container-fluid py-4 p-4">
            {loading && <Loader />}

            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="font-weight-bold text-dark mb-0">Expense List</h3>
                    <p className="text-muted small">Monitor and manage company expenditures</p>
                </div>
                <div className="d-flex gap-2">
                    {metadata.all_permission.includes('expenses.create') && (
                        <button className="btn btn-info shadow-sm d-flex align-items-center px-4" onClick={handleOpenAddModal}>
                            <SafeFontAwesomeIcon icon={faPlus} className="mr-2" /> Add Expense
                        </button>
                    )}
                    {selectedIds.length > 0 && (
                        <button className="btn btn-danger shadow-sm d-flex align-items-center" onClick={handleBulkDelete}>
                            <SafeFontAwesomeIcon icon={faTrash} className="mr-2" /> Delete Selected
                        </button>
                    )}
                </div>
            </div>

            <div className="card shadow-sm border-0 mb-4">
                <div className="card-body">
                    <form onSubmit={handleFilterSubmit} className="row align-items-end">
                        <div className="col-md-3">
                            <label className="small font-weight-bold text-muted text-uppercase">Starting Date</label>
                            <input
                                type="date"
                                className="form-control"
                                value={filters.starting_date}
                                onChange={e => setFilters({ ...filters, starting_date: e.target.value })}
                            />
                        </div>
                        <div className="col-md-3">
                            <label className="small font-weight-bold text-muted text-uppercase">Ending Date</label>
                            <input
                                type="date"
                                className="form-control"
                                value={filters.ending_date}
                                onChange={e => setFilters({ ...filters, ending_date: e.target.value })}
                            />
                        </div>
                        {user?.role_id <= 2 && (
                            <div className="col-md-4">
                                <label className="small font-weight-bold text-muted text-uppercase">Warehouse</label>
                                <select
                                    className="form-control"
                                    value={filters.warehouse_id}
                                    onChange={e => setFilters({ ...filters, warehouse_id: e.target.value })}
                                >
                                    <option value="0">All Warehouses</option>
                                    {metadata.lims_warehouse_list.map(w => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="col-md-2">
                            <button type="submit" className="btn btn-primary btn-block shadow-sm">
                                <SafeFontAwesomeIcon icon={faFilter} className="mr-2" /> Filter
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="card shadow-sm border-0">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0">
                            <thead className="bg-light text-muted text-uppercase small">
                                <tr>
                                    <th className="px-4 py-3" style={{ width: '50px' }}>
                                        <div className="custom-control custom-checkbox">
                                            <input
                                                type="checkbox"
                                                className="custom-control-input"
                                                id="selectAll"
                                                checked={expenses.length > 0 && selectedIds.length === expenses.length}
                                                onChange={toggleSelectAll}
                                            />
                                            <label className="custom-control-label" htmlFor="selectAll"></label>
                                        </div>
                                    </th>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Reference No</th>
                                    <th className="px-4 py-3">Warehouse</th>
                                    <th className="px-4 py-3">Category</th>
                                    <th className="px-4 py-3 text-right">Amount</th>
                                    <th className="px-4 py-3">Note</th>
                                    <th className="px-4 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.length === 0 ? (
                                    <tr><td colSpan="8" className="text-center py-5 text-muted font-italic">No expenses found matching the criteria.</td></tr>
                                ) : (
                                    expenses.map(expense => (
                                        <tr key={expense.id} className="align-middle">
                                            <td className="px-4 py-3">
                                                <div className="custom-control custom-checkbox">
                                                    <input
                                                        type="checkbox"
                                                        className="custom-control-input"
                                                        id={`select-${expense.id}`}
                                                        checked={selectedIds.includes(expense.id)}
                                                        onChange={() => toggleSelect(expense.id)}
                                                    />
                                                    <label className="custom-control-label" htmlFor={`select-${expense.id}`}></label>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-nowrap">{expense.date}</td>
                                            <td className="px-4 py-3 font-weight-medium">{expense.reference_no}</td>
                                            <td className="px-4 py-3">
                                                <span className="badge badge-light border px-2 py-1">{expense.warehouse}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`badge ${expense.expense_category_id === 0 ? 'badge-soft-warning' : 'badge-soft-info'} px-2 py-1`}>
                                                    {expense.expenseCategory}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-weight-bold text-dark">
                                                {parseFloat(expense.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-3 small text-muted">{expense.note}</td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="dropdown">
                                                    <button className="btn btn-light btn-sm dropdown-toggle border" type="button" data-toggle="dropdown">
                                                        <SafeFontAwesomeIcon icon={faEllipsisV} />
                                                    </button>
                                                    <div className="dropdown-menu dropdown-menu-right shadow border-0">
                                                        {expense.document && (
                                                            <a className="dropdown-item py-2" href={`${api.defaults.baseURL}/../documents/expense/${expense.document}`} target="_blank" rel="noreferrer">
                                                                <SafeFontAwesomeIcon icon={faEye} className="mr-2 text-info" /> View Document
                                                            </a>
                                                        )}
                                                        {metadata.all_permission.includes('expenses.edit') && (
                                                            <button className="dropdown-item py-2" onClick={() => handleOpenEditModal(expense)}>
                                                                <SafeFontAwesomeIcon icon={faEdit} className="mr-2 text-primary" /> Edit
                                                            </button>
                                                        )}
                                                        {metadata.all_permission.includes('expenses.delete') && (
                                                            <button className="dropdown-item py-2 text-danger" onClick={() => handleDelete(expense.id)}>
                                                                <SafeFontAwesomeIcon icon={faTrash} className="mr-2" /> Delete
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            <tfoot className="bg-light font-weight-bold">
                                <tr>
                                    <td colSpan="5" className="px-4 py-3 text-right text-uppercase">Total</td>
                                    <td className="px-4 py-3 text-right text-primary h6 mb-0">
                                        {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td colSpan="2"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add/Edit Modal */}
            <FormModal
                moduleName={isEditing ? 'Update Expense' : 'Add Expense'}
                modalState={showModal}
                toggleFormModal={() => setShowModal(false)}
                width="800px"
            >
                <form onSubmit={handleSubmit} className="p-3">
                    <p className="font-italic text-sm text-muted mb-4">The field labels marked with * are required input fields.</p>

                    <div className="row">
                        <div className="col-md-6 form-group mb-3">
                            <label className="font-weight-bold small text-dark">Date</label>
                            <input
                                type="date"
                                className="form-control"
                                value={formData.created_at}
                                onChange={e => setFormData({ ...formData, created_at: e.target.value })}
                            />
                        </div>
                        <div className="col-md-6 form-group mb-3">
                            <label className="font-weight-bold small text-dark">Expense Category *</label>
                            <select
                                className="form-control"
                                required
                                value={formData.expense_category_id}
                                onChange={e => setFormData({ ...formData, expense_category_id: parseInt(e.target.value) })}
                            >
                                <option value="">Select Category...</option>
                                <option value="0">Employee Expense</option>
                                {metadata.lims_expense_category_list.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                                ))}
                            </select>
                        </div>

                        <div className="col-md-6 form-group mb-3">
                            <label className="font-weight-bold small text-dark">Warehouse *</label>
                            <select
                                className="form-control"
                                required
                                value={formData.warehouse_id}
                                onChange={e => setFormData({ ...formData, warehouse_id: e.target.value })}
                            >
                                <option value="">Select Warehouse...</option>
                                {metadata.lims_warehouse_list.map(w => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-6 form-group mb-3">
                            <label className="font-weight-bold small text-dark">Amount *</label>
                            <input
                                type="number"
                                step="any"
                                className="form-control"
                                required
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                            />
                        </div>

                        {formData.expense_category_id === 0 && (
                            <>
                                <div className="col-md-6 form-group mb-3">
                                    <label className="font-weight-bold small text-dark">Employee *</label>
                                    <select
                                        className="form-control"
                                        required
                                        value={formData.employee_id}
                                        onChange={e => setFormData({ ...formData, employee_id: e.target.value })}
                                    >
                                        <option value="">Select Employee...</option>
                                        {metadata.lims_employee_list.map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-6 form-group mb-3">
                                    <label className="font-weight-bold small text-dark">Type *</label>
                                    <select
                                        className="form-control"
                                        required
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="expense">Expense</option>
                                        <option value="advance">Advance</option>
                                    </select>
                                </div>
                            </>
                        )}

                        <div className="col-md-6 form-group mb-3">
                            <label className="font-weight-bold small text-dark">Account</label>
                            <select
                                className="form-control"
                                value={formData.account_id}
                                onChange={e => setFormData({ ...formData, account_id: e.target.value })}
                            >
                                <option value="">Select Account...</option>
                                {metadata.lims_account_list.map(a => (
                                    <option key={a.id} value={a.id}>{a.name} [{a.account_no}]</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-6 form-group mb-3">
                            <label className="font-weight-bold small text-dark">Attach Document</label>
                            <input
                                type="file"
                                className="form-control-file border p-1 rounded"
                                onChange={e => setDocumentFile(e.target.files[0])}
                            />
                            <small className="text-muted">Max size: 2MB (jpg, jpeg, png, gif, pdf, csv, docx, xlsx, txt)</small>
                        </div>
                    </div>

                    <div className="form-group mb-4">
                        <label className="font-weight-bold small text-dark">Note</label>
                        <textarea
                            className="form-control"
                            rows="3"
                            value={formData.note}
                            onChange={e => setFormData({ ...formData, note: e.target.value })}
                        ></textarea>
                    </div>

                    <div className="d-flex gap-2 mt-4">
                        <button type="submit" className="btn btn-primary px-5 py-2 shadow-sm text-white">Submit</button>
                        <button type="button" className="btn btn-light border px-5 py-2" onClick={() => setShowModal(false)}>Cancel</button>
                    </div>
                </form>
            </FormModal>

            <style>{`
                .badge-soft-warning { background-color: rgba(255, 193, 7, 0.1); color: #ffc107; border: 1px solid rgba(255, 193, 7, 0.2); }
                .badge-soft-info { background-color: rgba(23, 162, 184, 0.1); color: #17a2b8; border: 1px solid rgba(23, 162, 184, 0.2); }
                .badge-soft-success { background-color: rgba(40, 167, 69, 0.1); color: #28a745; }
                .form-control:focus { border-color: #7c5cc4; box-shadow: 0 0 0 0.2rem rgba(124, 92, 196, 0.1); }
            `}</style>
        </div>
    );
};

export default ExpenseList;
