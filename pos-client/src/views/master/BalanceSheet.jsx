import React, { useState, useEffect } from 'react';
import { api, msg } from '../../services';

const moduleName = 'Balance Sheet';

const BalanceSheet = () => {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [decimal, setDecimal] = useState(2);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('accounts/balance-sheet');
      const data = res?.data;
      if (data?.status === 200 && Array.isArray(data?.data)) {
        setRows(data.data);
        if (data.decimal != null) setDecimal(Number(data.decimal));
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load balance sheet');
    } finally {
      setIsLoading(false);
    }
  };

  const totalCredit = rows.reduce((sum, r) => sum + (parseFloat(r.credit) || 0), 0);
  const totalDebit = rows.reduce((sum, r) => sum + (parseFloat(r.debit) || 0), 0);
  const totalBalance = rows.reduce((sum, r) => sum + (parseFloat(r.balance) || 0), 0);

  return (
    <div>
      <h3 className="text-center">{moduleName}</h3>
      <div className="table-responsive mb-4 mt-4">
        {isLoading ? (
          <div className="text-center p-4">Loading...</div>
        ) : (
          <table className="table table-hover table-bordered" id="account-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Account No</th>
                <th>Credit</th>
                <th>Debit</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.name ?? '—'}</td>
                  <td>{row.account_no ?? '—'}</td>
                  <td>{row.credit_formatted ?? Number(row.credit).toFixed(decimal)}</td>
                  <td>{row.debit_formatted ?? Number(row.debit * -1).toFixed(decimal)}</td>
                  <td>{row.balance_formatted ?? Number(row.balance).toFixed(decimal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="tfoot active">
              <tr>
                <th></th>
                <th>Total</th>
                <th>{totalCredit.toFixed(decimal)}</th>
                <th>{(totalDebit * -1).toFixed(decimal)}</th>
                <th>{totalBalance.toFixed(decimal)}</th>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
};

export default BalanceSheet;
