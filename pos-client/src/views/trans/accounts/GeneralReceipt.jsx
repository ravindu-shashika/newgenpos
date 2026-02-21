import React, { useState, useEffect } from 'react';
import { api, cookie, msg } from '../../../services';
import moment from 'moment';
import { SystemButton, PaymentOptions } from '../../../components';
import { v4 as uuidv4 } from 'uuid';

const GeneralReceipt = () => {
  // Module name
  const moduleName = 'General Receipt';

  /* --- State declarationss --- */

  const [entities, setEntities] = useState([]);

  // Account types list
  const [accounts, setAccounts] = useState([]);

  // Account categories
  const [accountCategories, setAccountCategories] = useState([]);

  const [newData, setNewData] = useState({
    ddate: moment().format('YYYY-MM-DD'),
    account_category_id: '',
    account_id: '',
    note: '',
    cash: 0.0,
    cheque: 0.0,
    card: 0.0,
    total_pay: 0.0,
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

      const response = await api.get('general-receipts');

      setAccounts(response.data.accounts);

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

    setNewData({});

    fetchData();
  };

  const save = async () => {
    if (isEdit === false) {
      try {
        const response = await api.post('general-receipts').values(newData);

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
          .update(`general-receipts/${selectedId}/update`)
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
                            onChange={handleValueChange}
                          />
                        </div>
                      </div>
                    </div>
                    {/* Account category */}
                    <div className="form-group row">
                      <label
                        htmlFor="des"
                        className="col-sm-2 col-form-label col-form-label-sm"
                      >
                        Account Category
                      </label>
                      <div className="col-sm-6">
                        <select
                          name="account_category_id"
                          id="account_category_id"
                          className="form-control form-control-sm"
                          value={newData.account_category_id}
                          onChange={handleValueChange}
                          required
                        >
                          <option
                            value=""
                            className="dropdown-item text-muted text-light"
                            disabled
                          >
                            -- Select account category
                          </option>
                          {accountCategories.map((category) => {
                            return (
                              <option
                                className="dropdown-item"
                                key={category.id}
                                value={category.id}
                              >
                                {category.des}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>
                    {/* Credit account */}
                    <div className="form-group row">
                      <label
                        htmlFor="des"
                        className="col-sm-2 col-form-label col-form-label-sm"
                      >
                        Credit Account
                      </label>
                      <div className="col-sm-6">
                        <select
                          name="account_id"
                          id="account_id"
                          className="form-control form-control-sm"
                          value={newData.account_id}
                          onChange={handleValueChange}
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
                                {account.display_text}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>
                    {/* Note */}
                    <div className="form-group row">
                      <label
                        htmlFor="des"
                        className="col-sm-2 col-form-label col-form-label-sm"
                      >
                        Note
                      </label>
                      <div className="col-sm-6">
                        <input
                          type="text"
                          name="note"
                          id="note"
                          className="form-control form-control-sm"
                          value={newData.note}
                          onChange={handleValueChange}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  {/* Inputs table */}
                  <div className="row container"></div>
                  <div className="container">
                    <h6>
                      <strong>Payments</strong>
                    </h6>
                    <div className="row">
                      {/* Payments */}
                      <div className="col-md-4">
                        <div className="form-group row">
                          <label
                            htmlFor="cash"
                            className="col-sm-5 offset-1 col-form-label col-form-label-sm"
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
                            className="col-sm-5 offset-1 col-form-label col-form-label-sm"
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
                            className="col-sm-5 offset-1 col-form-label col-form-label-sm"
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
                            className="col-sm-5 offset-1 col-form-label col-form-label-sm"
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
                              disabled
                            />
                          </div>
                        </div>
                      </div>
                      {/* Card & cheque details */}
                      <div className="col-md-4">
                        {parseFloat(newData.cheque).toFixed(2) !==
                        parseFloat(0.0).toFixed(2) ? (
                          <div></div>
                        ) : null}
                      </div>
                    </div>
                    <PaymentOptions />
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

export default GeneralReceipt;
