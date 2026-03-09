import React, { useState, useEffect } from 'react';
import { api, msg } from '../services';
import { SafeFontAwesomeIcon, Loader, SystemButton } from '../components';
import { faFilePdf, faFileCsv, faPrint, faSearch, faUndo } from '@fortawesome/free-solid-svg-icons';
import Select from 'react-select';
import { useLocation } from 'react-router-dom';

const AccountStatement = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState('0'); // 0: All, 1: Debit, 2: Credit
  const [statementData, setStatementData] = useState(null);

  // For accounts selection
  useEffect(() => {
    const loadAccountsDirectly = async () => {
        try {
            const response = await api.get('accounts'); 
            if (response.status == 200 && response.data.status == 200 && Array.isArray(response.data.data)) {
                const options = response.data.data.map(acc => ({
                    value: acc.id,
                    label: `${acc.name} [${acc.account_no}]`
                }));
                setAccounts(options);
                
                // If passed via navigation state
                if (location.state && location.state.account_id) {
                    const passedAcc = options.find(acc => acc.value === location.state.account_id);
                    if (passedAcc) {
                        setSelectedAccount(passedAcc);
                        return;
                    }
                }

                // Set default account if available
                const defaultAcc = response.data.data.find(acc => acc.is_default);
                if (defaultAcc) {
                    setSelectedAccount({
                        value: defaultAcc.id,
                        label: `${defaultAcc.name} [${defaultAcc.account_no}]`
                    });
                }
            }
        } catch (e) {
            console.error(e);
        }
    };
    loadAccountsDirectly();
  }, [location.state]);

  useEffect(() => {
    if (selectedAccount) {
        fetchStatement();
    }
  }, [selectedAccount, startDate, endDate, type]);

  const fetchStatement = async () => {
    if (!selectedAccount) {
      msg.error('Please select an account');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        account_id: selectedAccount.value,
        start_date: startDate,
        end_date: endDate,
        type: type
      };
      const response = await api.post('account-statement').values(payload);
      if (response.status == 200 && response.data.status == 200) {
        setStatementData(response.data);
      } else {
        msg.error(response.data?.message || 'Failed to fetch account statement');
      }
    } catch (error) {
      msg.error('Failed to fetch account statement');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!statementData || !statementData.transactions.length) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Reference No,Related Transaction,Credit,Debit,Balance\n";
    
    statementData.transactions.forEach(row => {
      csvContent += `${row.date},${row.reference_no},${row.transaction_ref},${row.credit},${row.debit},${row.balance}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `account_statement_${selectedAccount.label}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="container-fluid py-4">
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-white border-0 py-3">
          <div className="row align-items-center">
            <div className="col">
              <h3 className="mb-0 text-primary font-weight-bold">Account Statement</h3>
            </div>
            <div className="col-auto">
              <div className="btn-group shadow-sm">
                <button className="btn btn-outline-secondary btn-sm" onClick={handleExportCSV}>
                  <SafeFontAwesomeIcon icon={faFileCsv} className="mr-2" /> CSV
                </button>
                <button className="btn btn-outline-secondary btn-sm" onClick={() => msg.info('PDF Export coming soon')}>
                  <SafeFontAwesomeIcon icon={faFilePdf} className="mr-2" /> PDF
                </button>
                <button className="btn btn-primary btn-sm" onClick={handlePrint}>
                  <SafeFontAwesomeIcon icon={faPrint} className="mr-2" /> Print
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card-body bg-light-50">
          <div className="row g-3">
            <div className="col-md-3">
              <label className="small font-weight-bold text-muted uppercase">Select Account</label>
              <Select
                options={accounts}
                value={selectedAccount}
                onChange={setSelectedAccount}
                placeholder="Choose account..."
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </div>
            <div className="col-md-3">
              <label className="small font-weight-bold text-muted uppercase">Start Date</label>
              <input 
                type="date" 
                className="form-control form-control-sm" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
              />
            </div>
            <div className="col-md-3">
              <label className="small font-weight-bold text-muted uppercase">End Date</label>
              <input 
                type="date" 
                className="form-control form-control-sm" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
              />
            </div>
            <div className="col-md-2">
              <label className="small font-weight-bold text-muted uppercase">Type</label>
              <select 
                className="form-control form-control-sm" 
                value={type} 
                onChange={(e) => setType(e.target.value)}
              >
                <option value="0">All Transactions</option>
                <option value="2">Credit Only</option>
                <option value="1">Debit Only</option>
              </select>
            </div>
            <div className="col-md-1 d-flex align-items-end">
              <button className="btn btn-info btn-sm btn-block" onClick={fetchStatement}>
                <SafeFontAwesomeIcon icon={faSearch} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Loader />
          <p className="mt-2 text-muted">Calculating transactions...</p>
        </div>
      ) : (
        statementData && (
          <div className="card shadow-sm border-0 animated fadeIn">
            <div className="card-header bg-white border-0 py-3">
               <div className="d-flex justify-content-between align-items-center text-muted small">
                  <div>
                     <strong>Account:</strong> {statementData.account.name} [{statementData.account.account_no}]
                  </div>
                  <div>
                     <strong>Initial Balance:</strong> {Number(statementData.initial_balance.initial_balance).toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </div>
               </div>
            </div>
            <div className="table-responsive">
              <table className="table table-hover table-striped mb-0">
                <thead className="thead-light">
                  <tr>
                    <th className="border-0">#</th>
                    <th className="border-0">Date</th>
                    <th className="border-0">Reference No</th>
                    <th className="border-0">Related Transaction</th>
                    <th className="border-0 text-right">Credit</th>
                    <th className="border-0 text-right">Debit</th>
                    <th className="border-0 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {statementData.transactions.length > 0 ? (
                    statementData.transactions.map((row, index) => (
                      <tr key={index}>
                        <td>{statementData.transactions.length - index}</td>
                        <td>{new Date(row.date).toLocaleDateString()}</td>
                        <td><span className="badge badge-light border">{row.reference_no}</span></td>
                        <td>{row.transaction_ref || '---'}</td>
                        <td className="text-right text-success font-weight-bold">
                          {row.credit > 0 ? Number(row.credit).toLocaleString(undefined, {minimumFractionDigits: 2}) : '0.00'}
                        </td>
                        <td className="text-right text-danger font-weight-bold">
                          {row.debit > 0 ? Number(row.debit).toLocaleString(undefined, {minimumFractionDigits: 2}) : '0.00'}
                        </td>
                        <td className="text-right font-weight-bold bg-light-50">
                          {Number(row.balance).toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-4 text-muted">No transactions found for the selected period.</td>
                    </tr>
                  )}
                  
                  {/* Initial Balance Row (as per Blade logic if empty or at the end) */}
                  <tr>
                    <td>-</td>
                    <td>{new Date(statementData.initial_balance.created_at).toLocaleDateString()}</td>
                    <td><span className="font-weight-bold">Initial Balance</span></td>
                    <td>------</td>
                    <td className="text-right font-weight-bold">{Number(statementData.initial_balance.initial_balance).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    <td className="text-right font-weight-bold">0.00</td>
                    <td className="text-right font-weight-bold bg-light-50">{Number(statementData.initial_balance.initial_balance).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                  </tr>
                </tbody>
                <tfoot className="bg-light">
                    <tr>
                        <th colSpan="4" className="text-right">Total Balance</th>
                        <th colSpan="3" className="text-right text-primary h5 mb-0">
                            {Number(statementData.total_balance).toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </th>
                    </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )
      )}
      
      <style>{`
        .bg-light-50 { background-color: rgba(0,0,0,0.02); }
        .animated { animation-duration: 0.5s; animation-fill-mode: both; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .fadeIn { animation-name: fadeIn; }
        .react-select-container .react-select__control {
            border-color: #ced4da;
            border-radius: 0.2rem;
            min-height: 31px;
            height: 31px;
        }
        .react-select-container .react-select__value-container {
            padding: 0 8px;
        }
        .react-select-container .react-select__indicators {
            height: 29px;
        }
        @media print {
            .card-header, .card-body { border: none !important; box-shadow: none !important; }
            .btn, label, select, input, .col-auto, .btn-group { display: none !important; }
            body { padding: 0 !important; }
            .container-fluid { width: 100% !important; padding: 0 !important; }
            .table { border-collapse: collapse !important; }
            .table-striped tbody tr:nth-of-type(odd) { background-color: rgba(0,0,0,.05) !important; }
        }
      `}</style>
    </div>
  );
};

export default AccountStatement;
