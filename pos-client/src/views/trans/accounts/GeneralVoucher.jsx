import React, { useState, useEffect } from 'react';
import { api, cookie, msg } from '../../../services';
import moment from 'moment';
import { SystemButton } from '../../../components';
import { v4 as uuidv4 } from 'uuid';

const GeneralVoucher = () => {
  // Module name
  const moduleName = 'General Voucher';

  /* --- State declarationss --- */

  const [entities, setEntities] = useState([]);

  // Account types list
  const [accounts, setAccounts] = useState([]);

  const [newData, setNewData] = useState({
    ddate: moment().format('YYYY-MM-DD'),
    payee_name: '',
    des: '',
    cash: 0.0,
    cheque: 0.0,
    card: 0.0,
    total_pay: 0.0,
  });

  // Entries
  const [entries, setEntries] = useState([
    {
      index: uuidv4(),
      account_id: '',
      account_name: '',
      amount: 0.0,
    },
  ]);

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

      const response = await api.get('general-voucher');

      console.log(response.data);

      setAccounts(response.data.accounts);

      setIsLoading(false);
    } catch (error) {
      msg.error('Unable to fetch data!');
      return console.log(error);
    }
  };

  const addNewRow = () => {
    setEntries([
      ...entries,
      {
        index: uuidv4(),
        account_id: '',
        account_name: '',
        amount: 0.0,
      },
    ]);
  };

  const removeRow = (i) => {
    setEntries(entries.filter((entry) => entry.index !== i));
  };

  const handleValueChange = (e) => {
    const targetInput = e.target;
    const datasetId = targetInput.dataset.id;
    const inputName = targetInput.name;
    const inputValue = targetInput.value;

    if (['account_id', 'amount'].includes(inputName)) {
      let entryList = [...entries];

      entryList[datasetId][inputName] = inputValue;

      if (inputName === 'account_id') {
        entryList[datasetId]['account_name'] = accounts.map((account) => {
          if (account.id === parseInt(inputValue)) {
            return account.des;
          }
        });
      }

      setEntries(entryList);
    } else {
      setNewData({
        ...newData,
        [inputName]: inputValue,
      });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    await save();

    setNewData({});

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
      <h3 className="text-center">{moduleName}</h3>
      <div className="bg-light">
        <br />
        {isLoading ? (
          <div className="d-flex justify-content-center">
            <div className="spinner-border text-secondary" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        ) : (
          <div>
            <form className="form" onSubmit={handleSubmit}>
              <div className="row">
                <div className="container">
                  <div className="col-12">
                    {/* Payee name */}
                    <div className="form-group row">
                      <label
                        htmlFor="des"
                        className="col-sm-2 col-form-label col-form-label-sm"
                      >
                        Payee Name
                      </label>
                      <div className="col-sm-4">
                        <input
                          type="text"
                          name="des"
                          id="des"
                          className="form-control form-control-sm"
                        />
                      </div>

                      <div className="col-4 offset-2 text-right">
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
                              onChange={handleValueChange}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Description */}
                    <div className="form-group row">
                      <label
                        htmlFor="des"
                        className="col-sm-2 col-form-label col-form-label-sm"
                      >
                        Description
                      </label>
                      <div className="col-sm-6">
                        <textarea
                          name="des"
                          id="des"
                          className="form-control form-control-sm"
                          rows="1"
                          maxLength="100"
                        ></textarea>
                      </div>
                    </div>
                  </div>
                  {/* Inputs table */}
                  <div className="row container">
                    <table className="table">
                      <thead className="text-center">
                        <tr>
                          <th scope="col">#</th>
                          <th scope="col">Account</th>
                          <th scope="col">Account Name</th>
                          <th scope="col">Amount</th>
                          <th scope="col"></th>
                        </tr>
                      </thead>
                      <tbody className="text-center">
                        {entries.map((entry, index) => {
                          return (
                            <tr key={entry.index}>
                              <th scope="row">{parseInt(index) + 1}</th>
                              <td>
                                <select
                                  name="account_id"
                                  id="account_id"
                                  data-id={index}
                                  className="form-control form-control-sm"
                                  value={entry.account_id}
                                  onChange={handleValueChange}
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
                                        {account.display_text}
                                      </option>
                                    );
                                  })}
                                </select>
                              </td>
                              <td>{entry.account_name}</td>
                              <td>
                                <input
                                  type="number"
                                  className="form-control form-control-sm text-right"
                                  name="debit_amount"
                                  id="debit_amount"
                                  data-id={index}
                                  min="0.00"
                                  step="0.01"
                                  value={parseFloat(entry.amount).toFixed(2)}
                                  onChange={handleValueChange}
                                />
                              </td>
                              <td>
                                <SystemButton
                                  type={'remove-row'}
                                  method={() => removeRow(entry.index)}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td className="text-center" colspan="5">
                            <div className="col-2">
                              <SystemButton
                                type={'add-row'}
                                method={() => addNewRow()}
                              />
                            </div>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <div className="container">
                    <h6>
                      <strong>Payments</strong>
                    </h6>
                    <div className="row">
                      {/* Payments */}
                      <div className="col-md-6">
                        <div className="form-group row">
                          <label
                            htmlFor="cash"
                            className="col-sm-4 offset-1 col-form-label col-form-label-sm"
                          >
                            Cash amount
                          </label>
                          <div className="col-sm-6">
                            <input
                              type="number"
                              name="cash"
                              id="cash"
                              value={parseFloat(newData.cash).toFixed(2)}
                              onChange={handleValueChange}
                              className="form-control form-control-sm text-right"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>
                        <div className="form-group row">
                          <label
                            htmlFor="cheque"
                            className="col-sm-4 offset-1 col-form-label col-form-label-sm"
                          >
                            Cheque amount
                          </label>
                          <div className="col-sm-6">
                            <input
                              type="number"
                              name="cheque"
                              id="cheque"
                              value={parseFloat(newData.cheque).toFixed(2)}
                              onChange={handleValueChange}
                              className="form-control form-control-sm text-right"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>
                        <div className="form-group row">
                          <label
                            htmlFor="card"
                            className="col-sm-4 offset-1 col-form-label col-form-label-sm"
                          >
                            Card amount
                          </label>
                          <div className="col-sm-6">
                            <input
                              type="number"
                              name="card"
                              id="card"
                              value={parseFloat(newData.card).toFixed(2)}
                              onChange={handleValueChange}
                              className="form-control form-control-sm text-right"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>
                        <div className="form-group row">
                          <label
                            htmlFor="total_pay"
                            className="col-sm-4 offset-1 col-form-label col-form-label-sm"
                          >
                            Total amount
                          </label>
                          <div className="col-sm-6">
                            <input
                              type="number"
                              name="total_pay"
                              id="total_pay"
                              value={parseFloat(newData.total_pay).toFixed(2)}
                              onChange={handleValueChange}
                              className="form-control form-control-sm text-right"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>
                      </div>
                      {/* Card & cheque details */}
                      <div className="col-md-6"></div>
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
                  <br />
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );

  /* --- End of component renders --- */
};

export default GeneralVoucher;
