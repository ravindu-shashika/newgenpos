import React, { useState, useEffect, useMemo } from 'react';
import { api, msg } from '../services';
import { Loader, SafeFontAwesomeIcon } from '../components';
import { faFileCsv, faPrint, faSearch, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

const BalanceSheet = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchPhrase, setSearchPhrase] = useState('');

    useEffect(() => {
        fetchBalanceSheet();
    }, []);

    const fetchBalanceSheet = async () => {
        setLoading(true);
        try {
            const response = await api.get('balance-sheet');
            if (response.status === 200 && response.data.status === 200) {
                setData(response.data.data);
            } else {
                msg.error(response.data?.message || 'Failed to fetch balance sheet');
            }
        } catch (error) {
            msg.error('An error occurred while fetching data');
        } finally {
            setLoading(false);
        }
    };

    const filteredData = useMemo(() => {
        if (!searchPhrase) return data;
        const phrase = searchPhrase.toLowerCase();
        return data.filter(item => 
            item.name.toLowerCase().includes(phrase) || 
            item.account_no.toLowerCase().includes(phrase)
        );
    }, [data, searchPhrase]);

    const totals = useMemo(() => {
        return filteredData.reduce((acc, curr) => ({
            credit: acc.credit + Number(curr.credit),
            debit: acc.debit + Number(curr.debit),
            balance: acc.balance + (Number(curr.credit) - Number(curr.debit))
        }), { credit: 0, debit: 0, balance: 0 });
    }, [filteredData]);

    const handlePrint = () => {
        window.print();
    };

    const handleExportCSV = () => {
        if (!filteredData.length) return;
        
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Name,Account No,Credit,Debit,Balance\n";
        
        filteredData.forEach(row => {
            csvContent += `${row.name},${row.account_no},${row.credit},${row.debit},${row.balance}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "balance_sheet.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="container-fluid py-4 balance-sheet-wrapper">
            <div className="card shadow-lg border-0 mb-4 overflow-hidden">
                <div className="card-header bg-gradient-primary text-white py-3 border-0 d-flex justify-content-between align-items-center">
                    <div>
                        <h3 className="mb-0 font-weight-bold">Balance Sheet</h3>
                        <p className="mb-0 small opacity-75">Overview of all account balances</p>
                    </div>
                    <div className="d-flex gap-2">
                        <button className="btn btn-light btn-sm shadow-sm" onClick={handleExportCSV}>
                            <SafeFontAwesomeIcon icon={faFileCsv} className="mr-2 text-success" /> CSV
                        </button>
                        <button className="btn btn-light btn-sm shadow-sm ml-2" onClick={handlePrint}>
                            <SafeFontAwesomeIcon icon={faPrint} className="mr-2 text-primary" /> Print
                        </button>
                    </div>
                </div>
                
                <div className="card-body bg-white p-4">
                    <div className="row mb-4">
                        <div className="col-md-6">
                            <div className="search-box position-relative">
                                <span className="position-absolute h-100 d-flex align-items-center px-3 text-muted">
                                    <SafeFontAwesomeIcon icon={faSearch} />
                                </span>
                                <input 
                                    type="text" 
                                    className="form-control pl-5 shadow-none border-dashed" 
                                    placeholder="Search by name or account number..." 
                                    value={searchPhrase}
                                    onChange={(e) => setSearchPhrase(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="table-responsive rounded shadow-sm border">
                        <table className="table table-hover mb-0 custom-bs-table">
                            <thead className="thead-dark-premium">
                                <tr>
                                    <th className="px-4 py-3">#</th>
                                    <th className="py-3">Name</th>
                                    <th className="py-3">Account No</th>
                                    <th className="text-right py-3">Credit</th>
                                    <th className="text-right py-3">Debit</th>
                                    <th className="text-right py-3 pr-4">Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-5">
                                            <Loader />
                                            <p className="mt-2 text-muted animate-pulse">Fetching ledger data...</p>
                                        </td>
                                    </tr>
                                ) : filteredData.length > 0 ? (
                                    filteredData.map((item, index) => (
                                        <tr key={item.id} className="align-middle">
                                            <td className="px-4 font-weight-bold text-muted">{index + 1}</td>
                                            <td className="font-weight-bold text-dark">{item.name}</td>
                                            <td><code className="text-primary font-weight-bold">{item.account_no}</code></td>
                                            <td className="text-right text-success font-weight-bold">
                                                {Number(item.credit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="text-right text-danger font-weight-bold">
                                                {Number(item.debit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="text-right pr-4 font-weight-bold h6 mb-0">
                                                <span className={item.balance >= 0 ? "text-primary" : "text-warning"}>
                                                    {Number(item.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center py-5 text-muted italic">
                                            <SafeFontAwesomeIcon icon={faInfoCircle} className="mr-2 h4 mb-2 d-block mx-auto" />
                                            No matching accounts found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            {!loading && filteredData.length > 0 && (
                                <tfoot className="tfoot-premium">
                                    <tr className="bg-light font-weight-bold">
                                        <td colSpan="3" className="text-right py-3 px-4 uppercase small tracking-wider">Total Summary</td>
                                        <td className="text-right py-3 text-success h5 mb-0">
                                            {totals.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="text-right py-3 text-danger h5 mb-0">
                                            {totals.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="text-right pr-4 py-3 text-primary h4 mb-0 font-weight-black">
                                            {totals.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            </div>

            <style>{`
                .bg-gradient-primary {
                    background: linear-gradient(135deg, #4e73df 0%, #224abe 100%);
                }
                .thead-dark-premium th {
                    background-color: #1a1a1a;
                    color: #fff;
                    font-size: 0.85rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    border: none;
                }
                .custom-bs-table tr {
                    transition: all 0.2s;
                }
                .custom-bs-table tbody tr:hover {
                    background-color: rgba(78, 115, 223, 0.05);
                    transform: scale(1.002);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }
                .tfoot-premium td {
                    border-top: 2px solid #dee2e6;
                }
                .font-weight-black {
                    font-weight: 900;
                }
                .border-dashed {
                    border: 2px dashed #e3e6f0;
                    border-radius: 8px;
                }
                .search-box input:focus {
                    border-color: #4e73df;
                    border-style: solid;
                }
                .animate-pulse {
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: .5; }
                }
                @media print {
                    .navbar, .sidenav, .search-box, .btn, .card-header p {
                        display: none !important;
                    }
                    .card {
                        box-shadow: none !important;
                        border: none !important;
                    }
                    .thead-dark-premium th {
                        background-color: #f8f9fa !important;
                        color: #000 !important;
                        border-bottom: 2px solid #000 !important;
                    }
                    .container-fluid {
                        padding: 0 !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default BalanceSheet;
