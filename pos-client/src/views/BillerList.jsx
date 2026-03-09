import React, { useState, useEffect } from 'react';
import { api, msg } from '../services';
import { Loader, SafeFontAwesomeIcon, FormModal } from '../components';
import { faPlus, faCopy, faEdit, faTrash, faEye, faEllipsisV, faCloudUploadAlt, faDownload } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

const BillerList = () => {
    const navigate = useNavigate();
    const [billers, setBillers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [permissions, setPermissions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal state
    const [showImportModal, setShowImportModal] = useState(false);
    const [importFile, setImportFile] = useState(null);

    useEffect(() => {
        fetchBillers();
    }, []);

    const fetchBillers = async () => {
        setLoading(true);
        try {
            const response = await api.get('biller');
            if (response.status === 200 && response.data.status === 200) {
                setBillers(response.data.data);
                setPermissions(response.data.all_permission || []);
            } else {
                msg.error(response.data?.message || 'Failed to fetch billers');
            }
        } catch (error) {
            msg.error('An error occurred while fetching billers');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this biller?')) return;

        try {
            const response = await api.delete(`biller/${id}`);
            if (response.status === 200 && response.data.status === 200) {
                msg.success(response.data.message);
                setBillers(billers.filter(biller => biller.id !== id));
            } else {
                msg.error(response.data?.message || 'Deletion failed');
            }
        } catch (error) {
            msg.error('An error occurred during deletion');
        }
    };

    const handleImportSubmit = async (e) => {
        e.preventDefault();
        if (!importFile) {
            msg.warning('Please select a CSV file');
            return;
        }

        const formData = new FormData();
        formData.append('file', importFile);

        try {
            const response = await api.post('importbiller').values(formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.status === 200 && response.data.status === 200) {
                msg.success(response.data.message);
                setShowImportModal(false);
                fetchBillers();
            } else {
                msg.error(response.data?.message || 'Import failed');
            }
        } catch (error) {
            msg.error('An error occurred during import');
        }
    };

    const filteredBillers = billers.filter(biller => 
        biller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        biller.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        biller.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        biller.phone_number.includes(searchTerm)
    );

    return (
        <div className="container-fluid py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="font-weight-bold text-dark mb-0">Biller List</h3>
                    <p className="text-muted small mb-0">Manage your billers and their contact details</p>
                </div>
                <div className="d-flex gap-2">
                    {permissions.includes('billers-add') && (
                        <button 
                            className="btn btn-info shadow-sm d-flex align-items-center px-4" 
                            onClick={() => navigate('/biller/create')}
                        >
                            <SafeFontAwesomeIcon icon={faPlus} className="mr-2" /> Add Biller
                        </button>
                    )}
                    {permissions.includes('billers-import') && (
                        <button 
                            className="btn btn-primary shadow-sm d-flex align-items-center px-4" 
                            onClick={() => setShowImportModal(true)}
                        >
                            <SafeFontAwesomeIcon icon={faCopy} className="mr-2" /> Import Biller
                        </button>
                    )}
                </div>
            </div>

            <div className="card shadow-lg border-0 rounded-xl overflow-hidden">
                <div className="card-header bg-white py-4 px-4 border-0">
                    <div className="row align-items-center">
                        <div className="col-md-4">
                            <div className="search-wrapper position-relative">
                                <span className="search-icon position-absolute h-100 d-flex align-items-center px-3 text-muted">
                                    <SafeFontAwesomeIcon icon={faEye} />
                                </span>
                                <input 
                                    type="text" 
                                    className="form-control pl-5 border-light-2 rounded-pill shadow-none" 
                                    placeholder="Search billers..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="table table-hover mb-0 custom-biller-table">
                        <thead className="bg-light-soft">
                            <tr>
                                <th className="px-4 py-3 text-muted small text-uppercase font-weight-bold">#</th>
                                <th className="py-3 text-muted small text-uppercase font-weight-bold">Biller Info</th>
                                <th className="py-3 text-muted small text-uppercase font-weight-bold">Company</th>
                                <th className="py-3 text-muted small text-uppercase font-weight-bold">Contact</th>
                                <th className="py-3 text-muted small text-uppercase font-weight-bold">Address</th>
                                <th className="text-center py-3 pr-4 text-muted small text-uppercase font-weight-bold">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-5">
                                        <Loader />
                                        <p className="mt-3 text-muted animate-pulse font-italic">Fetching your billers...</p>
                                    </td>
                                </tr>
                            ) : filteredBillers.length > 0 ? (
                                filteredBillers.map((biller, index) => (
                                    <tr key={biller.id} className="align-middle">
                                        <td className="px-4 font-weight-bold text-muted" style={{width: '60px'}}>{index + 1}</td>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <div className="biller-avatar mr-3 bg-light rounded-lg overflow-hidden border shadow-sm" style={{width: '60px', height: '60px'}}>
                                                    {biller.image ? (
                                                        <img 
                                                            src={`/images/biller/${biller.image}`} 
                                                            alt={biller.name} 
                                                            className="w-100 h-100 object-fit-cover" 
                                                            onError={(e) => {
                                                                e.target.onerror = null; 
                                                                e.target.src = '/images/placeholder-user.png';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-soft-secondary text-secondary font-weight-bold">
                                                            {biller.name.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-weight-bold text-dark h6 mb-0">{biller.name}</div>
                                                    <div className="small text-info font-weight-medium">VAT: {biller.vat_number || 'N/A'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="font-weight-bold text-dark-75">{biller.company_name}</div>
                                        </td>
                                        <td>
                                            <div className="text-dark small"><span className="text-muted mr-1">Email:</span> {biller.email}</div>
                                            <div className="text-dark small"><span className="text-muted mr-1">Phone:</span> {biller.phone_number}</div>
                                        </td>
                                        <td>
                                            <div className="small text-dark-50 text-wrap" style={{maxWidth: '200px'}}>
                                                {biller.address}
                                                {biller.city && `, ${biller.city}`}
                                                {biller.state && `, ${biller.state}`}
                                                {biller.postal_code && ` ${biller.postal_code}`}
                                                {biller.country && `, ${biller.country}`}
                                            </div>
                                        </td>
                                        <td className="text-center pr-4">
                                            <div className="dropdown">
                                                <button 
                                                    className="btn btn-sm btn-icon btn-light-soft rounded-circle shadow-none" 
                                                    type="button" 
                                                    data-toggle="dropdown"
                                                >
                                                    <SafeFontAwesomeIcon icon={faEllipsisV} className="text-muted" />
                                                </button>
                                                <div className="dropdown-menu dropdown-menu-right shadow-lg border-0 p-2 rounded-lg">
                                                    {permissions.includes('billers-edit') && (
                                                        <button 
                                                            className="dropdown-item py-2 px-3 rounded d-flex align-items-center transition-all" 
                                                            onClick={() => navigate(`/biller/edit/${biller.id}`)}
                                                        >
                                                            <SafeFontAwesomeIcon icon={faEdit} className="mr-2 text-info" /> Edit Biller
                                                        </button>
                                                    )}
                                                    {permissions.includes('billers-delete') && (
                                                        <button 
                                                            className="dropdown-item py-2 px-3 rounded d-flex align-items-center text-danger transition-all" 
                                                            onClick={() => handleDelete(biller.id)}
                                                        >
                                                            <SafeFontAwesomeIcon icon={faTrash} className="mr-2" /> Delete Biller
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center py-5">
                                        <div className="empty-state">
                                            <img src="/images/no-data.png" alt="No data" className="mb-3 opacity-50" style={{width: '80px'}} />
                                            <p className="text-muted h6 mb-0">No billers found.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Import Modal */}
            <FormModal 
                moduleName="Import Biller" 
                modalState={showImportModal} 
                toggleFormModal={() => setShowImportModal(false)}
            >
                <div className="px-4 py-4">
                    <p className="small text-muted mb-4 border-bottom pb-2">
                        <span className="text-danger font-weight-bold">* Required fields</span>: Name, Company Name, Email, Phone Number, Address.
                        Column order: name*, image, company_name*, vat_number, email*, phone_number*, address*, city*, state, postal_code, country.
                    </p>
                    <form onSubmit={handleImportSubmit}>
                        <div className="row g-4">
                            <div className="col-md-6">
                                <div className="p-4 border-dashed rounded-lg text-center bg-light-soft hover-bg-light transition-all cursor-pointer position-relative">
                                    <input 
                                        type="file" 
                                        className="position-absolute w-100 h-100 opacity-0 top-0 left-0 cursor-pointer" 
                                        accept=".csv"
                                        onChange={(e) => setImportFile(e.target.files[0])}
                                    />
                                    <SafeFontAwesomeIcon icon={faCloudUploadAlt} className="h3 text-primary mb-2" />
                                    <div className="font-weight-bold text-dark small">
                                        {importFile ? importFile.name : 'Upload CSV File *'}
                                    </div>
                                    <div className="text-muted smaller">Click or drag to select file</div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="h-100 d-flex flex-column justify-content-center">
                                    <label className="small text-muted mb-2 font-weight-bold">Download Template</label>
                                    <a 
                                        href="/sample_file/sample_biller.csv" 
                                        className="btn btn-outline-info d-flex align-items-center justify-content-center py-3 rounded-lg border-dashed"
                                    >
                                        <SafeFontAwesomeIcon icon={faDownload} className="mr-2" /> Sample File
                                    </a>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 pt-3 border-top d-flex justify-content-end">
                            <button type="button" className="btn btn-light-soft px-4 mr-2" onClick={() => setShowImportModal(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary px-5 shadow-sm">Process Import</button>
                        </div>
                    </form>
                </div>
            </FormModal>

            <style>{`
                .rounded-xl { border-radius: 1.25rem !important; }
                .bg-light-soft { background-color: #f8fafc; }
                .hover-bg-light:hover { background-color: #f1f5f9; }
                .text-dark-75 { color: #374151; }
                .text-dark-50 { color: #6b7280; }
                .border-light-2 { border: 2px solid #f1f5f9; }
                .border-dashed { border: 2px dashed #e2e8f0 !important; }
                .bg-soft-secondary { background-color: #f1f5f9; }
                .transition-all { transition: all 0.3s ease; }
                .cursor-pointer { cursor: pointer; }
                .align-middle td { vertical-align: middle !important; }
                .btn-light-soft { background-color: #f1f5f9; border: none; }
                .btn-light-soft:hover { background-color: #e2e8f0; }
                .dropdown-item:hover { background-color: #f8fafc; transform: translateX(5px); }
                .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
                .border-dashed:hover { border-color: #3b82f6 !important; background-color: #eff6ff; }
            `}</style>
        </div>
    );
};

export default BillerList;
