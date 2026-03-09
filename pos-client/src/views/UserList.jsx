import React, { useState, useEffect } from 'react';
import { api, msg } from '../services';
import { Loader, SafeFontAwesomeIcon } from '../components';
import { faPlus, faEdit, faTrash, faSearch, faUser, faShieldAlt } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

const UserList = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchPhrase, setSearchPhrase] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get('user-list');
            if (response.status === 200 && response.data.status === 200) {
                setUsers(response.data.data);
            } else {
                msg.error(response.data?.message || 'Failed to fetch users');
            }
        } catch (error) {
            msg.error('An error occurred while fetching users');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        const newStatus = !currentStatus;
        try {
            const response = await api.post('user/toggle-status').values({
                id: id,
                is_active: newStatus ? 1 : 0
            });

            if (response.status === 200 && response.data.status === 200) {
                msg.success(response.data.message);
                setUsers(users.map(user => 
                    user.id === id ? { ...user, is_active: newStatus } : user
                ));
            } else {
                msg.error(response.data?.message || 'Status update failed');
            }
        } catch (error) {
            msg.error('An error occurred during status update');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            const response = await api.delete(`delete-user/${id}`);
            if (response.status === 200 && response.data.status === 200) {
                msg.success(response.data.message);
                setUsers(users.filter(user => user.id !== id));
            } else {
                msg.error(response.data?.message || 'Deletion failed');
            }
        } catch (error) {
            msg.error('An error occurred during deletion');
        }
    };

    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(searchPhrase.toLowerCase()) ||
        user.email.toLowerCase().includes(searchPhrase.toLowerCase()) ||
        (user.phone && user.phone.includes(searchPhrase))
    );

    return (
        <div className="container-fluid py-4 user-list-wrapper">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="font-weight-bold text-dark mb-0">User List</h3>
                    <p className="text-muted small mb-0">Manage system users and their permissions</p>
                </div>
                <button 
                    className="btn btn-info shadow-sm d-flex align-items-center px-4 py-2" 
                    onClick={() => navigate('/user/create')}
                >
                    <SafeFontAwesomeIcon icon={faPlus} className="mr-2" /> Add User
                </button>
            </div>

            <div className="card shadow-lg border-0 rounded-lg overflow-hidden">
                <div className="card-header bg-white py-4 px-4 border-0">
                    <div className="row align-items-center">
                        <div className="col-md-4">
                            <div className="search-box position-relative">
                                <span className="position-absolute h-100 d-flex align-items-center px-3 text-muted">
                                    <SafeFontAwesomeIcon icon={faSearch} />
                                </span>
                                <input 
                                    type="text" 
                                    className="form-control pl-5 shadow-none border-dashed" 
                                    placeholder="Search by name, email..." 
                                    value={searchPhrase}
                                    onChange={(e) => setSearchPhrase(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="table table-hover mb-0 custom-user-table">
                        <thead className="bg-light">
                            <tr>
                                <th className="px-4 py-3">#</th>
                                <th className="py-3">User Details</th>
                                <th className="py-3">Contact</th>
                                <th className="py-3 text-center">Role</th>
                                <th className="py-3 text-center">Status</th>
                                <th className="text-center py-3 pr-4">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-5">
                                        <Loader />
                                        <p className="mt-2 text-muted animate-pulse">Loading users...</p>
                                    </td>
                                </tr>
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map((user, index) => (
                                    <tr key={user.id} className="align-middle">
                                        <td className="px-4 font-weight-bold text-muted">{index + 1}</td>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <div className="avatar mr-3 bg-soft-primary text-primary rounded-circle d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                                                    <SafeFontAwesomeIcon icon={faUser} />
                                                </div>
                                                <div>
                                                    <div className="font-weight-bold text-dark">{user.name}</div>
                                                    <div className="small text-muted">{user.company_name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="small text-dark font-weight-medium">{user.email}</div>
                                            <div className="small text-muted">{user.phone}</div>
                                        </td>
                                        <td className="text-center">
                                            <span className="badge badge-soft-info px-3 py-2 rounded-pill font-weight-bold">
                                                <SafeFontAwesomeIcon icon={faShieldAlt} className="mr-1 mr-1-small" /> {user.role_name}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            <div className="custom-control custom-switch">
                                                <input 
                                                    type="checkbox"
                                                    className="custom-control-input"
                                                    id={`switch_${user.id}`}
                                                    checked={user.is_active}
                                                    onChange={() => handleToggleStatus(user.id, user.is_active)}
                                                />
                                                <label className="custom-control-label" htmlFor={`switch_${user.id}`}></label>
                                            </div>
                                        </td>
                                        <td className="text-center pr-4">
                                            <div className="btn-group shadow-sm rounded">
                                                <button 
                                                    className="btn btn-sm btn-outline-info border-0" 
                                                    onClick={() => navigate(`/user/edit/${user.id}`)}
                                                    title="Edit User"
                                                >
                                                    <SafeFontAwesomeIcon icon={faEdit} />
                                                </button>
                                                <button 
                                                    className="btn btn-sm btn-outline-danger border-0" 
                                                    onClick={() => handleDelete(user.id)}
                                                    title="Delete User"
                                                >
                                                    <SafeFontAwesomeIcon icon={faTrash} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center py-5 text-muted h6 mb-0 italic">
                                        No users found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <style>{`
                .bg-soft-primary { background-color: rgba(78, 115, 223, 0.1); }
                .badge-soft-info { background-color: rgba(54, 185, 204, 0.1); color: #36b9cc; }
                .font-weight-medium { font-weight: 500; }
                .border-dashed { border: 2px dashed #e3e6f0; border-radius: 8px; }
                .mr-1-small { margin-right: 4px; }
                
                /* Custom Switch Styling from User Request */
                .custom-control.custom-switch {
                    display: inline-flex;
                    align-items: center;
                    cursor: pointer;
                }

                .custom-control-input:checked ~ .custom-control-label::before {
                    background-color: #7c5cc4;
                    border-color: #7c5cc4;
                }

                .custom-control-input:not(:checked) ~ .custom-control-label::before {
                    background-color: #ddd;
                    border-color: #ddd;
                }

                .custom-control-label::before {
                    height: 22px;
                    width: 40px;
                    border-radius: 20px;
                    background-color: #ccc;
                    border: 1px solid #aaa;
                    transition: background-color 0.25s, border-color 0.25s;
                }

                .custom-control-label::after {
                    top: 5px;
                    left: 2px;
                    width: 18px;
                    height: 18px;
                    background-color: #fff;
                    border-radius: 50%;
                    transition: transform 0.25s ease-in-out;
                }

                .custom-control-input:checked ~ .custom-control-label::after {
                    transform: translateX(18px);
                }

                .custom-control-input:focus ~ .custom-control-label::before {
                    box-shadow: 0 0 0 0.2rem rgba(124, 92, 196, 0.25);
                }
                
                .align-middle td { vertical-align: middle !important; }
                
                .animate-pulse {
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: .5; }
                }
            `}</style>
        </div>
    );
};

export default UserList;
