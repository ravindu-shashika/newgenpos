import React, { useState, useEffect } from 'react';
import { api, msg } from '../../services';

const moduleName = 'Account Statement';

const TYPE_OPTIONS = [
  { value: '0', label: 'All' },
  { value: '1', label: 'Debit only' },
  { value: '2', label: 'Credit only' },
];

const AccountStatement = () => {
  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState('0');
  const [account, setAccount] = useState(null);
  const [rows, setRows] = useState([]);
  const [initialBalanceRow, setInitialBalanceRow] = useState(null);
  const [decimal, setDecimal] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchAccounts();
    const today = new Date().toISOString().slice(0, 10);
    setStartDate(today);
    setEndDate(today);
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await api.get('accounts/options');
      const data = res?.data;
      if (data?.status === 200 && Array.isArray(data?.data)) {
        setAccounts(data.data);
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load accounts');
    }
  };

  const fetchStatement = async () => {
    if (!accountId) {
      msg.error('Please select an account');
      return;
    }
    if (!startDate || !endDate) {
      msg.error('Please select start date and end date');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      msg.error('Start date must be before or equal to end date');
      return;
    }
    try {
      setIsLoading(true);
      setLoaded(false);
      const params = new URLSearchParams({
        account_id: accountId,
        start_date: startDate,
        end_date: endDate,
        type,
      });
      const res = await api.get('accounts/statement?' + params.toString());
      const data = res?.data;
      if (data?.status === 200) {
        setAccount(data.account || null);
        setRows(data.rows || []);
        setInitialBalanceRow(data.initial_balance_row || null);
        if (data.decimal != null) setDecimal(Number(data.decimal));
        setLoaded(true);
      } else {
        msg.error(data?.message || 'Failed to load statement');
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load statement');
      setLoaded(false);
    } finally {
      setIsLoading(false);
    }
  };

  const displayRows = initialBalanceRow
    ? [...rows].reverse().concat([initialBalanceRow])
    : [...rows].reverse();

  return (
    <div>
      <h3 className="text-center">{moduleName}</h3>
      <div className="container-fluid mt-4">
        <div className="row mb-3">
          <div className="col-md-3 form-group">
            <label>Account</label>
            <select
              className="form-control"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
            >
              <option value="">Select account...</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} [{acc.account_no || acc.id}]
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2 form-group">
            <label>Start date</label>
            <input
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="col-md-2 form-group">
            <label>End date</label>
            <input
              type="date"
              className="form-control"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="col-md-2 form-group">
            <label>Type</label>
            <select className="form-control" value={type} onChange={(e) => setType(e.target.value)}>
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2 form-group d-flex align-items-end">
            <button type="button" className="btn btn-primary" onClick={fetchStatement} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Show'}
            </button>
          </div>
        </div>
        {account && (
          <p className="mb-2">
            <strong>Account:</strong> {account.name} [{account.account_no ?? '—'}]
          </p>
        )}
      </div>

      <div className="table-responsive mb-4">
        {isLoading ? (
          <div className="text-center p-4">Loading...</div>
        ) : loaded ? (
          <table className="table table-hover table-bordered" id="account-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Reference No</th>
                <th>Related Transaction</th>
                <th>Credit</th>
                <th>Debit</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row, idx) => (
                <tr key={row.is_initial_balance ? 'initial' : idx}>
                  <td>{row.date_formatted ?? '—'}</td>
                  <td>{row.reference_no ?? '—'}</td>
                  <td>{row.related_transaction ?? '—'}</td>
                  <td>{row.credit_formatted ?? Number(row.credit).toFixed(decimal)}</td>
                  <td>{row.debit_formatted ?? Number(row.debit).toFixed(decimal)}</td>
                  <td>{row.balance_formatted ?? Number(row.balance).toFixed(decimal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-muted text-center p-4">Select account and date range, then click Show.</p>
        )}
      </div>
    </div>
  );
};

export default AccountStatement;
