import React, { useState, useEffect } from 'react';
import { api, msg } from '../services';
import { FormModal, Loader, SafeFontAwesomeIcon } from '../components';
import { 
    faPlus, faCopy, faEdit, faTrash, faEye, faChartLine, 
    faEraser, faCoins, faHistory, faBell, faEllipsisV 
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

const CustomerList = () => {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initData, setInitData] = useState({
        custom_fields: [],
        field_names: [],
        accounts: [],
        payment_options: [],
        reward_point_setting: null
    });

    // Modal States
    const [showClearDueModal, setShowClearDueModal] = useState(false);
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [showViewDepositModal, setShowViewDepositModal] = useState(false);
    const [showPointModal, setShowPointModal] = useState(false);
    const [showViewPointsModal, setShowViewPointsModal] = useState(false);

    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [deposits, setDeposits] = useState([]);
    const [points, setPoints] = useState([]);

    // Form Data States
    const [clearDueData, setClearDueData] = useState({ amount: 0, paid_by_id: 1, account_id: '', payment_note: '' });
    const [depositData, setDepositData] = useState({ amount: 0, note: '' });
    const [pointData, setPointData] = useState({ points: 0, note: '' });

    useEffect(() => {
        fetchInitData();
        fetchCustomers();
    }, []);

    const fetchInitData = async () => {
        try {
            const response = await api.get('customer');
            if (response.status === 200 && response.data.status === 200) {
                setInitData(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch init data', error);
        }
    };

    const fetchCustomers = async (search = '') => {
        setLoading(true);
        try {
            const data = {
                draw: 1,
                start: 0,
                length: 10,
                search: { value: search },
                order: [{ column: 0, dir: 'desc' }]
            };
            const response = await api.post('customers/customer-data').values(data);
            if (response.status === 200 && response.data.status === 200) {
                setCustomers(response.data.data);
            }
        } catch (error) {
            msg.error('Failed to load customers');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this customer?')) {
            try {
                const response = await api.delete(`customer/${id}`);
                if (response.status === 200 && response.data.status === 200) {
                    msg.success(response.data.message);
                    fetchCustomers();
                } else {
                    msg.error(response.data.message);
                }
            } catch (error) {
                msg.error('Action failed');
            }
        }
    };

    // Modal Actions
    const handleClearDue = (customer) => {
        setSelectedCustomer(customer);
        setClearDueData({ ...clearDueData, amount: parseFloat(customer.total_due.replace(/,/g, '')) });
        setShowClearDueModal(true);
    };

    const submitClearDue = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('customers/clear-due').values({
                ...clearDueData,
                customer_id: selectedCustomer.id
            });
            if (response.status === 200 && response.data.status === 200) {
                msg.success(response.data.message);
                setShowClearDueModal(false);
                fetchCustomers();
            } else {
                msg.error(response.data.message);
            }
        } catch (error) {
            msg.error('Failed to clear due');
        }
    };

    const handleAddDeposit = (customer) => {
        setSelectedCustomer(customer);
        setDepositData({ amount: 0, note: '' });
        setShowDepositModal(true);
    };

    const submitDeposit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('customer/add_deposit').values({
                ...depositData,
                customer_id: selectedCustomer.id
            });
            if (response.status === 200 && response.data.status === 200) {
                msg.success(response.data.message);
                setShowDepositModal(false);
                fetchCustomers();
            } else {
                msg.error(response.data.message);
            }
        } catch (error) {
            msg.error('Failed to add deposit');
        }
    };

    const handleViewDeposit = async (customer) => {
        setSelectedCustomer(customer);
        try {
            const response = await api.get(`customer/getDeposit/${customer.id}`);
            if (response.status === 200 && response.data.status === 200) {
                setDeposits(response.data.data);
                setShowViewDepositModal(true);
            }
        } catch (error) {
            msg.error('Failed to fetch deposits');
        }
    };

    const handleAddPoint = (customer) => {
        setSelectedCustomer(customer);
        setPointData({ points: 0, note: '' });
        setShowPointModal(true);
    };

    const submitPoint = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('customer/add-point').values({
                ...pointData,
                customer_id: selectedCustomer.id
            });
            if (response.status === 200 && response.data.status === 200) {
                msg.success(response.data.message);
                setShowPointModal(false);
                fetchCustomers();
            } else {
                msg.error(response.data.message);
            }
        } catch (error) {
            msg.error('Failed to add points');
        }
    };

    const handleViewPoints = async (customer) => {
        setSelectedCustomer(customer);
        try {
            const response = await api.get(`customer/getPoints/${customer.id}`);
            if (response.status === 200 && response.data.status === 200) {
                setPoints(response.data.data);
                setShowViewPointsModal(true);
            }
        } catch (error) {
            msg.error('Failed to fetch points');
        }
    };

    return (
        <div className="container-fluid py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="text-primary font-weight-bold mb-0">Customer List</h3>
                <div className="d-flex gap-2">
                    <button className="btn btn-info shadow-sm d-flex align-items-center" onClick={() => navigate('/customer/create')}>
                        <SafeFontAwesomeIcon icon={faPlus} className="mr-2" /> Add Customer
                    </button>
                    <button className="btn btn-primary shadow-sm d-flex align-items-center">
                        <SafeFontAwesomeIcon icon={faCopy} className="mr-2" /> Import Customer
                    </button>
                </div>
            </div>

            <div className="card shadow-sm border-0 rounded-lg overflow-hidden">
                <div className="card-header bg-white py-3 border-0">
                    <div className="input-group" style={{ maxWidth: '300px' }}>
                        <input 
                            type="text" 
                            className="form-control border-right-0" 
                            placeholder="Search customers..." 
                            onChange={(e) => fetchCustomers(e.target.value)}
                        />
                        <div className="input-group-append">
                            <span className="input-group-text bg-white border-left-0 text-muted">
                                <SafeFontAwesomeIcon icon={faEllipsisV} />
                            </span>
                        </div>
                    </div>
                </div>
                <div className="table-responsive">
                    <table className="table table-hover mb-0">
                        <thead className="bg-light">
                            <tr>
                                <th>#</th>
                                <th>Group</th>
                                <th>Details</th>
                                <th>Points</th>
                                <th>Deposited</th>
                                <th>Due</th>
                                {initData.field_names.map((name, i) => (
                                    <th key={i}>{initData.custom_fields[i]}</th>
                                ))}
                                <th className="text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7 + initData.field_names.length} className="text-center py-5">
                                        <Loader />
                                    </td>
                                </tr>
                            ) : customers.length > 0 ? (
                                customers.map((customer, index) => (
                                    <tr key={index}>
                                        <td>{customer.key + 1}</td>
                                        <td><span className="badge badge-info">{customer.customer_group}</span></td>
                                        <td>
                                            <div className="d-flex flex-column">
                                                <span className="font-weight-bold">{customer.name}</span>
                                                <small className="text-muted">{customer.phone_number}</small>
                                                <small className="text-muted">{customer.email}</small>
                                            </div>
                                        </td>
                                        <td className="text-info font-weight-bold">{customer.points}</td>
                                        <td className="text-success">{customer.deposited_balance}</td>
                                        <td className="text-danger font-weight-bold">{customer.total_due}</td>
                                        {initData.field_names.map((fname, i) => (
                                            <td key={i}>{customer[fname] || '---'}</td>
                                        ))}
                                        <td className="text-center">
                                            <div className="dropdown">
                                                <button className="btn btn-outline-secondary btn-sm rounded-circle" type="button" data-toggle="dropdown">
                                                    <SafeFontAwesomeIcon icon={faEllipsisV} />
                                                </button>
                                                <div className="dropdown-menu dropdown-menu-right shadow-lg border-0">
                                                    <button className="dropdown-item py-2" onClick={() => navigate(`/customer/show/${customer.id}`)}>
                                                        <SafeFontAwesomeIcon icon={faEye} className="mr-2 text-primary" /> Details
                                                    </button>
                                                    <button className="dropdown-item py-2" onClick={() => navigate(`/customer/edit/${customer.id}`)}>
                                                        <SafeFontAwesomeIcon icon={faEdit} className="mr-2 text-info" /> Edit
                                                    </button>
                                                    {parseFloat(customer.total_due.replace(/,/g, '')) > 0 && (
                                                        <button className="dropdown-item py-2" onClick={() => handleClearDue(customer)}>
                                                            <SafeFontAwesomeIcon icon={faEraser} className="mr-2 text-warning" /> Clear Due
                                                        </button>
                                                    )}
                                                    <button className="dropdown-item py-2" onClick={() => handleAddDeposit(customer)}>
                                                        <SafeFontAwesomeIcon icon={faPlus} className="mr-2 text-success" /> Add Deposit
                                                    </button>
                                                    <button className="dropdown-item py-2" onClick={() => handleViewDeposit(customer)}>
                                                        <SafeFontAwesomeIcon icon={faHistory} className="mr-2 text-dark" /> View Deposit
                                                    </button>
                                                    {initData.reward_point_setting?.is_active && (
                                                        <>
                                                            <button className="dropdown-item py-2" onClick={() => handleAddPoint(customer)}>
                                                                <SafeFontAwesomeIcon icon={faCoins} className="mr-2 text-warning" /> Add Point
                                                            </button>
                                                            <button className="dropdown-item py-2" onClick={() => handleViewPoints(customer)}>
                                                                <SafeFontAwesomeIcon icon={faChartLine} className="mr-2 text-info" /> View Points
                                                            </button>
                                                        </>
                                                    )}
                                                    <div className="dropdown-divider"></div>
                                                    <button className="dropdown-item py-2 text-danger" onClick={() => handleDelete(customer.id)}>
                                                        <SafeFontAwesomeIcon icon={faTrash} className="mr-2" /> Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7 + initData.field_names.length} className="text-center py-4 text-muted">No customers found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Clear Due Modal */}
            <FormModal 
                moduleName={`Clear Due - ${selectedCustomer?.name}`} 
                modalState={showClearDueModal} 
                toggleFormModal={() => setShowClearDueModal(false)}
            >
                <form onSubmit={submitClearDue} className="p-3">
                    <div className="form-group mb-3">
                        <label className="small font-weight-bold">Amount *</label>
                        <input 
                            type="number" 
                            step="any" 
                            required 
                            className="form-control" 
                            value={clearDueData.amount} 
                            onChange={(e) => setClearDueData({...clearDueData, amount: e.target.value})}
                        />
                    </div>
                    <div className="form-group mb-3">
                        <label className="small font-weight-bold">Paid By *</label>
                        <select 
                            className="form-control" 
                            value={clearDueData.paid_by_id} 
                            onChange={(e) => setClearDueData({...clearDueData, paid_by_id: e.target.value})}
                        >
                            <option value="1">Cash</option>
                            <option value="2">Gift Card</option>
                            <option value="3">Credit Card</option>
                            <option value="4">Cheque</option>
                            <option value="6">Deposit</option>
                        </select>
                    </div>
                    <div className="form-group mb-3">
                        <label className="small font-weight-bold">Account *</label>
                        <select 
                            className="form-control" 
                            required 
                            value={clearDueData.account_id}
                            onChange={(e) => setClearDueData({...clearDueData, account_id: e.target.value})}
                        >
                            <option value="">Select Account</option>
                            {initData.accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name} [{acc.account_no}]</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group mb-4">
                        <label className="small font-weight-bold">Note</label>
                        <textarea 
                            className="form-control" 
                            rows="2" 
                            value={clearDueData.payment_note}
                            onChange={(e) => setClearDueData({...clearDueData, payment_note: e.target.value})}
                        ></textarea>
                    </div>
                    <div className="d-flex justify-content-end">
                        <button type="submit" className="btn btn-primary px-4">Clear Due Now</button>
                    </div>
                </form>
            </FormModal>

            {/* Deposit Modal */}
            <FormModal 
                moduleName={`Add Deposit - ${selectedCustomer?.name}`} 
                modalState={showDepositModal} 
                toggleFormModal={() => setShowDepositModal(false)}
            >
                <form onSubmit={submitDeposit} className="p-3">
                    <div className="form-group mb-3">
                        <label className="small font-weight-bold">Amount *</label>
                        <input 
                            type="number" 
                            step="any" 
                            required 
                            className="form-control" 
                            value={depositData.amount} 
                            onChange={(e) => setDepositData({...depositData, amount: e.target.value})}
                        />
                    </div>
                    <div className="form-group mb-4">
                        <label className="small font-weight-bold">Note</label>
                        <textarea 
                            className="form-control" 
                            rows="3" 
                            value={depositData.note}
                            onChange={(e) => setDepositData({...depositData, note: e.target.value})}
                        ></textarea>
                    </div>
                    <div className="d-flex justify-content-end">
                        <button type="submit" className="btn btn-success px-4">Add Deposit</button>
                    </div>
                </form>
            </FormModal>

            {/* View Deposit Modal */}
            <FormModal 
                moduleName={`Deposits - ${selectedCustomer?.name}`} 
                modalState={showViewDepositModal} 
                toggleFormModal={() => setShowViewDepositModal(false)}
            >
                <div className="p-3">
                    <div className="table-responsive">
                        <table className="table table-sm small">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Amount</th>
                                    <th>Note</th>
                                    <th>Created By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deposits.length > 0 ? deposits.map((d, i) => (
                                    <tr key={i}>
                                        <td>{d.date}</td>
                                        <td className="font-weight-bold text-success">{d.amount}</td>
                                        <td>{d.note}</td>
                                        <td>{d.user_name}</td>
                                    </tr>
                                )) : <tr><td colSpan="4" className="text-center">No deposits found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </FormModal>

            {/* Point Modal */}
            <FormModal 
                moduleName={`Add Reward Point - ${selectedCustomer?.name}`} 
                modalState={showPointModal} 
                toggleFormModal={() => setShowPointModal(false)}
            >
                <form onSubmit={submitPoint} className="p-3">
                    <div className="form-group mb-3">
                        <label className="small font-weight-bold">Points *</label>
                        <input 
                            type="number" 
                            required 
                            className="form-control" 
                            value={pointData.points} 
                            onChange={(e) => setPointData({...pointData, points: e.target.value})}
                        />
                    </div>
                    <div className="form-group mb-4">
                        <label className="small font-weight-bold">Note</label>
                        <textarea 
                            className="form-control" 
                            rows="3" 
                            value={pointData.note}
                            onChange={(e) => setPointData({...pointData, note: e.target.value})}
                        ></textarea>
                    </div>
                    <div className="d-flex justify-content-end">
                        <button type="submit" className="btn btn-warning px-4">Add Points</button>
                    </div>
                </form>
            </FormModal>

            {/* View Points Modal */}
            <FormModal 
                moduleName={`Reward Points - ${selectedCustomer?.name}`} 
                modalState={showViewPointsModal} 
                toggleFormModal={() => setShowViewPointsModal(false)}
            >
                <div className="p-3">
                    <div className="table-responsive">
                        <table className="table table-sm small">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Points</th>
                                    <th>Note</th>
                                    <th>Created By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {points.length > 0 ? points.map((p, i) => (
                                    <tr key={i}>
                                        <td>{p.date}</td>
                                        <td className="font-weight-bold text-info">{p.points}</td>
                                        <td>{p.note}</td>
                                        <td>{p.user_name}</td>
                                    </tr>
                                )) : <tr><td colSpan="4" className="text-center">No points found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </FormModal>

            <style>{`
                .rounded-lg { border-radius: 1rem !important; }
                .table thead th { border-top: 0; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; color: #6c757d; }
                .dropdown-menu { border-radius: 0.75rem; padding: 0.5rem; }
                .dropdown-item { border-radius: 0.5rem; transition: all 0.2s; }
                .dropdown-item:hover { background-color: #f8f9fa; transform: translateX(4px); }
                .badge { font-weight: 500; padding: 0.4em 0.8em; }
            `}</style>
        </div>
    );
};

export default CustomerList;
