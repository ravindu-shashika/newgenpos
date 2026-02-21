import React, { useState, useEffect } from 'react';
import { api, cookie, msg } from '../../../services';
import { SystemButton } from '../../../components';

const BankEntry = () => {
  // Module name
  const moduleName = 'Bank Entries';

  /* --- State declarationss --- */

  const [entities, setEntities] = useState([]);

  // Account types list
  const [accounts, setAccounts] = useState([]);

  const [newData, setNewData] = useState({
    credit_account_id: '',
    debit_account_id: '',
    description: '',
    narration: '',
    amount: 0.0,
  });

  // Data loading status
  const [isLoading, setIsLoading] = useState(false);

  // Form modal state
  const [showModalState, setShowModalState] = useState(false);

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

      const response = await api.get('bank-entries');

      console.log(response.data);

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

  const editRow = (dataObj) => {
    setShowModalState(true);

    setNewData({
      account_type_id: dataObj.account_type_id,
      des: dataObj.des,
    });

    setIsEdit(true);
    setSelectedId(dataObj.id);
  };

  const toggleFormModal = () => {
    setShowModalState(!showModalState);
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
        const response = await api.post('account-categories').values(newData);

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
        setShowModalState(false);
      }
    } else {
      try {
        const response = await api
          .update(`account-categories/${selectedId}/update`)
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
        setShowModalState(false);
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
                  />
                </div>
              </div>
              {/* Ref number */}
              <div className="form-group row">
                <label
                  htmlFor="ref_no"
                  className="col-sm-4 col-form-label col-form-label-sm"
                >
                  Ref Number
                </label>
                <div className="col-sm-8">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    name="ref_no"
                    id="ref_no"
                  />
                </div>
              </div>
            </div>
            {/* Left-side column */}
            <div className="col-10 row">
              {/* Credit account */}
              <div className="form-group col-6">
                <label htmlFor="credit_account_id">Credit Account</label>
                <select
                  name="credit_account_id"
                  id="credit_account_id"
                  className="form-control form-control-sm"
                  // value={newData.credit_account_id}
                  // onChange={handleValueChange}
                  required
                >
                  <option
                    value=""
                    className="dropdown-item text-muted text-light"
                    disabled
                  >
                    Select credit account
                  </option>
                  {accounts.map((creditAcc) => {
                    return (
                      <option
                        className="dropdown-item"
                        key={creditAcc.id}
                        value={creditAcc.id}
                      >
                        {creditAcc.des}
                      </option>
                    );
                  })}
                </select>
              </div>
              {/* Debit account */}
              <div className="form-group col-6">
                <label htmlFor="credit_account_id">Debit Account</label>
                <select
                  name="credit_account_id"
                  id="credit_account_id"
                  className="form-control form-control-sm"
                  // value={newData.credit_account_id}
                  // onChange={handleValueChange}
                  required
                >
                  <option
                    value=""
                    className="dropdown-item text-muted text-light"
                    disabled
                  >
                    Select debit account
                  </option>
                  {accounts.map((debitAcc) => {
                    return (
                      <option
                        className="dropdown-item"
                        key={debitAcc.id}
                        value={debitAcc.id}
                      >
                        {debitAcc.des}
                      </option>
                    );
                  })}
                </select>
              </div>
              {/* Description */}
              <div className="form-group col-6">
                <label htmlFor="des">Description</label>
                <textarea
                  name="des"
                  id="des"
                  className="form-control form-control-sm"
                  rows="1"
                ></textarea>
              </div>
              {/* Narration */}
              <div className="form-group col-6">
                <label htmlFor="narration">Narration</label>
                <textarea
                  name="narration"
                  id="narration"
                  className="form-control form-control-sm"
                  rows="1"
                ></textarea>
              </div>
              {/* Amount */}
              <div className="form-group col-4 offset-8">
                <label htmlFor="amount">Amount</label>
                <input
                  type="number"
                  className="form-control form-control-sm text-right"
                  name="amount"
                  id="amount"
                  step="0.01"
                />
              </div>
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
        </form>
        <br />
      </div>
    </div>
  );

  /* --- End of component renders --- */
};

export default BankEntry;
