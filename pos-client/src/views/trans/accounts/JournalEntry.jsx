import React, { useState, useEffect } from 'react';
import { api, cookie, msg } from '../../../services';
import moment from 'moment';
import { SystemButton } from '../../../components';
import { v4 as uuidv4 } from 'uuid';

const JournalEntry = () => {
  // Module name
  const moduleName = 'Journal Entries';

  /* --- State declarationss --- */

  //const [entities, setEntities] = useState([]);

  // Account types list
  const [accounts, setAccounts] = useState([]);

  // TODO: Check and make the changes in all state setting and reading positions in this file

  // Entries
  const [entries, setEntries] = useState([
    {
      index: uuidv4(),
      account_id: '',
      credit_amount: 0.0,
      debit_amount: 0.0,
    },
  ]);

  const [newData, setNewData] = useState({
    branch_id: cookie.get('user_branch'),
    tdate: moment().format('YYYY-MM-DD'),
    accounts: [entries],
    des: '',
    amount: 0.0,
    user_id: cookie.get('user_id'),
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

  const [drTotal, setDrTotal] = useState(0);
  const [crTotal, setCrTotal] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    cal_total_cr_dr();
  }, [entries]);

  /* --- Component functions --- */

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const response = await api.get('journal-entries');
      // console.log(response.data);

      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err);
        });
        return;
      }

      setAccounts(response.data);

      setIsLoading(false);
    } catch (error) {
      msg.error('Unable to fetch data!');
      return console.log(error);
    }
  };

  const handleValueChange = (e) => {
    const targetInput = e.target;
    const datasetId = targetInput.dataset.id;
    const inputName = targetInput.name;
    const inputValue = targetInput.value;

    if (['account_id', 'credit_amount', 'debit_amount'].includes(inputName)) {
      let entryList = [...entries];

      entryList[datasetId][inputName] = inputValue;

      setEntries(entryList);

      // let amount=0;

      // let cr_total=0;
      //  if (["credit_amount"].includes(inputName)) {

      //   if(entries.length>0){

      //     entries.map((entry,index) =>{             //console.log(crTotal );
      //          cr_total+=Number(entry.credit_amount);
      //         setCrTotal(cr_total) ;

      //         });
      //   }
      //    amount=cr_total;
      //    setTotal(amount);

      // }

      // let dr_total=0;
      //   if (["debit_amount"].includes(inputName)) {

      //     if(entryList.length>0){

      //       entryList.map((entry) =>{

      //         dr_total+= Number(entry.debit_amount);
      //         setDrTotal(dr_total) ;

      //       });
      //     }

      //      amount=dr_total;
      //      setTotal(amount);
      //   }

      //   if (["account_id"].includes(inputName)) {
      //     amount=total;
      //   }

      // setNewData({
      //   ...newData,
      //   amount:amount,
      //  accounts:  entryList,
      // });

      //console.log(newData);
    } else {
      setNewData({
        ...newData,
        [inputName]: inputValue,
      });
    }
  };

  const addNewRow = () => {
    setEntries([
      ...entries,
      {
        index: uuidv4(),
        account_id: '',
        credit_amount: 0.0,
        debit_amount: 0.0,
      },
    ]);
  };

  const removeRow = (i) => {
    setEntries(entries.filter((entry) => entry.index !== i));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    await save();
    resetAll();
    fetchData();
  };

  const save = async () => {
    //console.log(newData);

    if (validate_cr_dr_total()) {
      if (isEdit === false) {
        try {
          const response = await api.post('journal-entries').values(newData);
          console.log(response.error);

          if (response.error) {
            Object.values(response.error).forEach((err) => {
              msg.error(err);
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
              msg.error(err);
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
    } else {
      msg.error('Credit/Debit totals are not balance');
    }
  };

  const validate_cr_dr_total = () => {
    //console.log(crTotal,drTotal);
    if (crTotal === drTotal) {
      return true;
    } else {
      return false;
    }
  };

  const cal_total_cr_dr = () => {
    let amount = 0;

    let cr_total = 0;
    let dr_total = 0;
    if (entries.length > 0) {
      entries.map((entry, index) => {
        //console.log(crTotal );
        cr_total += Number(entry.credit_amount);
        dr_total += Number(entry.debit_amount);
      });
    }
    setCrTotal(cr_total);
    setDrTotal(dr_total);
    amount = cr_total;
    setTotal(amount);

    setNewData({
      ...newData,
      amount: amount,
      accounts: entries,
    });

    //console.log(entries);
  };

  const resetAll = () => {
    setNewData({
      ...newData,
      accounts: [],
      des: '',
      amount: 0.0,
    });

    setEntries([
      {
        index: uuidv4(),
        account_id: '',
        credit_amount: 0.0,
        debit_amount: 0.0,
      },
    ]);
  };
  /* --- End of component functions --- */

  /* --- Component renders --- */
  // TODO: Complete the UI
  // TODO: Create a method to add new rows of inputs with a button click

  return (
    <div>
      <h5 className="text-center">{moduleName}</h5>
      <br />
      <div className="bg-light">
        <form className="form" onSubmit={handleSubmit}>
          <br />
          <div className="container row">
            {/* Left-side column */}
            <div className="col-8">
              {/* Description */}
              <div className="form-group row">
                <label
                  htmlFor="des"
                  className="col-sm-2 col-form-label col-form-label-sm"
                >
                  Description
                </label>
                <div className="col-sm-8">
                  <textarea
                    onChange={handleValueChange}
                    name="des"
                    id="des"
                    className="form-control form-control-sm"
                    rows="1"
                    maxLength="100"
                    value={newData.des}
                  ></textarea>
                </div>
              </div>
            </div>
            {/* Right-side column */}
            <div className="col-4 text-right">
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
                    value={newData.tdate}
                    onChange={handleValueChange}
                  />
                </div>
              </div>
            </div>
            <br />
            <br />
            {/* Inputs table */}
            <div className="row container">
              <table className="table">
                <thead className="thead-dark text-center">
                  <tr>
                    <td scope="col">#</td>
                    <td scope="col">Account</td>
                    <td scope="col">Credit Amount</td>
                    <td scope="col">Debit Amount</td>
                    <td scope="col"></td>
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
                            value={entries[index].account_id}
                            onChange={handleValueChange}
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
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm text-right"
                            name="credit_amount"
                            id="credit_amount"
                            data-id={index}
                            min="0.00"
                            step="0.01"
                            value={entries[index].credit_amount}
                            onChange={handleValueChange}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm text-right"
                            name="debit_amount"
                            id="debit_amount"
                            data-id={index}
                            min="0.00"
                            step="0.01"
                            value={entries[index].debit_amount}
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
                    <td>
                      <SystemButton
                        type={'add-row'}
                        method={() => addNewRow()}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td></td>
                    <td style={{ textAlign: 'right' }}>
                      <label style={{ fontWeight: 'bold' }}>Total</label>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <label style={{ fontWeight: 'bold' }}>{crTotal}</label>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <label style={{ fontWeight: 'bold' }}>{drTotal}</label>
                    </td>
                  </tr>
                </tfoot>
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
        </form>
        <br />
      </div>
    </div>
  );

  /* --- End of component renders --- */
};

export default JournalEntry;
