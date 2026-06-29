import React, { useState, useEffect } from 'react';
import { Printer, Eye, Edit, FileText, X } from 'lucide-react';
import DataTable from './components/DataTable'; // Generic wrapper
import SaleDetailsModal from './components/SaleDetailsModal';

const CustomerLedger = ({ customerData, summary }) => {
    const [activeTab, setActiveTab] = useState('ledger');
    const [selectedSaleId, setSelectedSaleId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handlePrint = () => {
        // In React, it's cleaner to use a dedicated printable component 
        // or a library like react-to-print.
        window.print();
    };

    return (
        <div className="container-fluid p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <button onClick={handlePrint} className="btn btn-outline-secondary btn-sm">
                    <Printer size={16} className="me-2" /> Print Page
                </button>
            </div>

            {/* Customer Header */}
            <div className="card mb-4" id="customer-info">
                <div className="card-body d-flex justify-content-between">
                    <div>
                        <h4 className="mb-1">{customerData?.name || '-'}</h4>
                        <span className="text-muted">Customer</span>
                        <p className="mb-0 mt-2"><strong>Email:</strong> {customerData?.email}</p>
                        <p className="mb-0"><strong>Phone:</strong> {customerData?.phone_number}</p>
                    </div>
                    <div className="text-end">
                        <strong>Address:</strong> {customerData?.address}<br />
                        <strong>City:</strong> {customerData?.city}<br />
                        <strong>Country:</strong> {customerData?.country}
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <ul className="nav nav-tabs mb-3">
                {['ledger', 'sales', 'payments', 'installments'].map((tab) => (
                    <li className="nav-item" key={tab}>
                        <button
                            className={`nav-link capitalize ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                    </li>
                ))}
            </ul>

            {/* Ledger Summary Boxes */}
            {activeTab === 'ledger' && (
                <div className="row g-3 mb-4">
                    <SummaryCard title="Opening Balance" value={summary.opening} />
                    <SummaryCard title="Total Sales" value={summary.sales} />
                    <SummaryCard title="Total Paid" value={summary.paid} />
                    <SummaryCard title="Total Returns" value={summary.returns} />
                    <SummaryCard title="Balance Due" value={summary.due} variant="danger" />
                </div>
            )}

            {/* Tables Content */}
            <div className="tab-content">
                {activeTab === 'ledger' && (
                    <DataTable
                        endpoint={`/api/customers/ledger/${customerData.id}`}
                        columns={ledgerColumns}
                    />
                )}
                {activeTab === 'sales' && (
                    <DataTable
                        endpoint={`/api/sales/customer/${customerData.id}`}
                        columns={salesColumns(setSelectedSaleId, setIsModalOpen)}
                    />
                )}
                {/* ... other tables mapping ... */}
            </div>

            {isModalOpen && (
                <SaleDetailsModal
                    saleId={selectedSaleId}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
};

const SummaryCard = ({ title, value, variant = 'dark' }) => (
    <div className="col">
        <div className="p-3 border rounded bg-light text-center">
            <small className="text-uppercase fw-bold">{title}</small>
            <h5 className={`mb-0 ${variant === 'danger' ? 'text-danger' : ''}`}>
                {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(value)}
            </h5>
        </div>
    </div>
);

export default CustomerLedger;