import React, { useState, useEffect } from 'react';
import { api, cookie, msg } from '../../../services';
import moment from 'moment';
import { SystemButton } from '../../../components';

const DebitNote = () => {
  // Module name
  const moduleName = 'Debit Note';

  /* --- State declarationss --- */

  const [entities, setEntities] = useState([]);

  // Account types list
  const [accounts, setAccounts] = useState([]);

  const [newData, setNewData] = useState({
    ddate: moment().format('YYYY-MM-DD'),
    debit_account_id: '',
    credit_account_id: '',
    note: '',
    amount: 0.0,
    state: '',
  });

  // Data loading status
  const [isLoading, setIsLoading] = useState(false);

  // Data edit state
  const [isEdit, setIsEdit] = useState(false);

  // Selected data
  const [selectedId, setSelectedId] = useState('');

  /* --- End of state declarations --- */

  useEffect(() => {
    fetchData();
  }, []);

  /* --- Component functions --- */

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const response = await api.get('debit-notes');

      setAccounts(response.data);

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
      } finally {
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
      {isLoading ? (
        <div className="d-flex justify-content-center">
          <div className="spinner-border text-secondary" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      ) : (
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
                      />
                    </div>
                  </div>
                </div>
                {/* Left-side column */}
                <div className="col-10 row">
                  {/* Customer / supplier selector */}
                  <div className="col-4">
                    <div className="custom-control custom-radio">
                      <input
                        className="custom-control-input"
                        type="radio"
                        name="is_customer"
                        id="is_customer"
                        value="1"
                      />
                      <label
                        className="custom-control-label"
                        htmlFor="is_customer"
                      >
                        Customer
                      </label>
                    </div>
                  </div>
                  <div className="col-8">
                    <div className="custom-control custom-radio">
                      <input
                        className="custom-control-input"
                        type="radio"
                        name="is_customer"
                        id="is_supplier"
                        value="0"
                      />
                      <label
                        className="custom-control-label"
                        htmlFor="is_supplier"
                      >
                        Supplier
                      </label>
                    </div>
                  </div>
                  <div className="col-12">&nbsp;</div>
                  {/* Debit Account */}
                  <div className="form-group col-5">
                    <label htmlFor="debit_account_id">Debit Account</label>
                    <select
                      name="debit_account_id"
                      id="debit_account_id"
                      className="form-control form-control-sm"
                      value={newData.debit_account_id}
                      required
                    >
                      <option
                        value=""
                        className="dropdown-item text-muted text-light"
                        disabled
                      >
                        -- Select debit account
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
                  {/* Credit account */}
                  <div className="form-group col-5">
                    <label htmlFor="credit_account_id">Credit Account</label>
                    <select
                      name="credit_account_id"
                      id="credit_account_id"
                      className="form-control form-control-sm"
                      value={newData.credit_account_id}
                      required
                    >
                      <option
                        value=""
                        className="dropdown-item text-muted text-light"
                        disabled
                      >
                        -- Select credit account
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
                  {/* Notes */}
                  <div className="form-group col-6">
                    <label htmlFor="des">Description</label>
                    <textarea
                      name="des"
                      id="des"
                      className="form-control form-control-sm"
                      rows="1"
                      maxLength="100"
                    ></textarea>
                  </div>
                  {/* Account */}
                  <div className="form-group col-4">
                    <label htmlFor="amount">Amount</label>
                    <input
                      type="number"
                      className="form-control form-control-sm text-right"
                      name="amount"
                      id="amount"
                      min="0.00"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              <div className="row text-center">
                <div className="col-2 offset-8">
                  <SystemButton type={'reset'} />
                </div>
                <div className="col-2">
                  <SystemButton type={'save'} />
                </div>
              </div>
            </form>
            <br />
          </div>
        </div>
      )}
    </div>
  );

  /* --- End of component renders --- */
};

export default DebitNote;
