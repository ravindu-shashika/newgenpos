import React, { useState, useEffect } from 'react';
import { api, cookie, msg } from '../../../services';
import moment from 'moment';
import { SystemButton } from '../../../components';

const BankReconciliation = () => {
  // Module name
  const moduleName = 'Bank Reconciliation';

  /* --- State declarationss --- */

  const [entities, setEntities] = useState([]);

  // Account types list
  const [accounts, setAccounts] = useState([]);

  // Search parameters
  const [parameters, setParameters] = useState({
    account_id: '',
    cheque_date: '',
  });

  const [newData, setNewData] = useState({
    ddate: moment().format('YYYY-MM-DD'),
    state: '',
  });

  // Data loading status
  const [isLoading, setIsLoading] = useState(false);

  // Form modal state
  const [showList, setShowList] = useState(false);

  // Data edit state
  const [isEdit, setIsEdit] = useState(false);

  // Selected data
  const [selectedId, setSelectedId] = useState('');

  // Data to generate the table
  const dataColumns = [
    {
      title: 'Date',
      name: 'date',
    },
    {
      title: 'Description',
      name: 'des',
    },
    {
      title: 'Type',
      name: 'type',
    },
    {
      title: 'Transaction Number',
      name: 'trans_no',
    },
    {
      title: 'Debit',
      name: 'debit',
    },
    {
      title: 'Credit',
      name: 'credit',
    },
    {
      title: 'Action',
      name: 'action',
    },
  ];

  let dataRows = [];

  /* --- End of state declarations --- */

  useEffect(() => {
    fetchData();
  }, []);

  /* --- Component functions --- */

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const response = await api.get('bank-reconciliation');

      // setAccounts(response.data.accounts);

      setIsLoading(false);
    } catch (error) {
      msg.error('Unable to fetch data!');
      return console.log(error);
    }
  };

  const handleValueChange = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue = targetInput.value;

    setNewData({
      ...newData,
      [inputName]: inputValue,
    });
  };

  const handleRequirementChange = (e) => {
    const targetReqInput = e.target;
    const inputReqName = targetReqInput.name;
    const inputReqValue = targetReqInput.value;

    setParameters({
      ...parameters,
      [inputReqName]: inputReqValue,
    });
  };

  const fetchCheques = async () => {
    setShowList(true);
    setIsLoading(true);

    const response = await api.get('bank-reconciliation');

    dataRows = [];

    await response.data.map((entity) => {
      dataRows.push({
        id: entity.id,
        date: entity.date,
        des: entity.des,
        type: entity.type,
        trans_no: entity.trans_no,
        debit: entity.debit,
        credit: entity.credit,
        action: entity.action,
      });
    });

    setIsLoading(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    await save();

    setNewData({
      user_id: 1,
      branch_id: 0,
      account_type_id: '',
      des: '',
    });

    fetchData();
  };

  const save = async () => {
    if (isEdit === false) {
      try {
        const response = await api.post('cheque-deposit').values(newData);

        if (response.error) {
          Object.values(response.error).forEach((err) => {
            msg.error(err[0]);
          });
          return;
        } else {
          return msg.success(response.data);
        }
      } catch (error) {
        return console.log(error);
      }
    } else {
      try {
        const response = await api
          .update(`cheque-deposit/${selectedId}/update`)
          .values(newData);

        if (response.error) {
          Object.values(response.error).forEach((err) => {
            msg.error(err[0]);
          });
          return;
        }

        msg.success(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsEdit(false);
        setSelectedId('');
      }
    }
  };

  /* --- End of component functions --- */

  /* --- Component renders --- */

  return (
    <div>
      <h3 className="text-center">{moduleName}</h3>
      <br />
      <div className="bg-light">
        <form className="form" onSubmit={handleSubmit}>
          <br />
          <div className="container row">
            {/* Right-side column */}
            <div className="col-4 offset-8 text-right">
              {/* Date */}
              <div className="form-group row">
                <label
                  htmlFor="ddate"
                  className="col-sm-4 col-form-label col-form-label-sm"
                >
                  Date
                </label>
                <div className="col-sm-8">
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    name="ddate"
                    id="ddate"
                    value={newData.ddate}
                    readOnly
                  />
                </div>
              </div>
            </div>
            {/* Left-side column */}
            <div className="col-12 row">
              {/* Account */}
              <div className="form-group col-5">
                <label htmlFor="account_id">Bank Account</label>
                <select
                  name="account_id"
                  id="account_id"
                  className="form-control form-control-sm"
                  value={parameters.account_id}
                  onChange={handleRequirementChange}
                  required
                >
                  <option
                    value=""
                    className="dropdown-item text-muted text-light"
                    disabled
                  >
                    -- Select account
                  </option>
                  {accounts.map((account) => {
                    return (
                      <option
                        className="dropdown-item"
                        key={account.id}
                        value={account.id}
                      >
                        {account.des}
                      </option>
                    );
                  })}
                </select>
              </div>
              {/* From date */}
              <div className="form-group col-2">
                <label htmlFor="from_date">From Date</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  name="from_date"
                  id="from_date"
                  onChange={handleRequirementChange}
                />
              </div>
              {/* To date */}
              <div className="form-group col-2">
                <label htmlFor="to_date">To Date</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  name="to_date"
                  id="to_date"
                  onChange={handleRequirementChange}
                />
              </div>
              {/* Load cheques */}
              <div className="form-group col-2">
                <label>&nbsp;</label>
                <SystemButton type={'load'} method={fetchCheques} />
              </div>
            </div>
          </div>
          {!showList ? (
            <div>
              <br />
              <h6 className="text-center">
                Fill all fields and click{' '}
                <span className="badge badge-info">Load Data</span> to view the
                list of cheques.
              </h6>
            </div>
          ) : isLoading ? (
            <div className="d-flex justify-content-center">
              <div className="spinner-border text-secondary" role="status">
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          ) : (
            <div>
              <div className="row">
                <div className="container">
                  {/* Chque list */}
                  <table className="table table-striped">
                    <thead className="thead-dark">
                      <tr>
                        <th scope="col">Date</th>
                        <th scope="col">Description</th>
                        <th scope="col">Type</th>
                        <th scope="col">Transaction Number</th>
                        <th scope="col">Debit</th>
                        <th scope="col">Credit</th>
                        <th scope="col">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataRows.map((row) => {
                        return (
                          <tr key={row.id}>
                            <tr>{row.des}</tr>
                            <tr>{row.type}</tr>
                            <tr>{row.trans_no}</tr>
                            <tr>{row.debit}</tr>
                            <tr>{row.credit}</tr>
                            <tr>
                              <input
                                type="checkbox"
                                name="issue"
                                id="issue"
                                value={row.action}
                              />
                            </tr>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <br />
              <div className="row text-center">
                <div className="col-2 offset-8">
                  <SystemButton type={'reset'} />
                </div>
                <div className="col-2">
                  <SystemButton type={'save'} />
                </div>
              </div>
            </div>
          )}
        </form>
        <br />
      </div>
    </div>
  );

  /* --- End of component renders --- */
};

export default BankReconciliation;
