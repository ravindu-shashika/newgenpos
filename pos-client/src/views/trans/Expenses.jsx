import React, { useState, useEffect } from 'react';
import { api, msg, cookie } from '../../services';
import { FormModal, ListView, SystemButton } from '../../components';
import moment from 'moment';

const Expenses = () => {
  // Module name
  const moduleName = 'Expenses';

  /* --- State declarationss --- */

  const [expenseTypesList, setExpenseTypesList] = useState([
    {
      id: '',
      description: '',
      account_id: '',
    },
  ]);

  const [entities, setEntities] = useState([]);

  const [newData, setNewData] = useState({
    branch_id: cookie.get('user_branch'),
    trans_id: '',
    ddate: moment().format('YYYY-MM-DD'),
    acc_id: '',
    amount: (0).toFixed(2),
    des: '',
    user_id: cookie.get('user_id'),
  });

  // Form modal state
  const [showModalState, setShowModalState] = useState(false);

  // Data loading status
  const [isLoading, setIsLoading] = useState(false);

  //
  const [isEdit, setIsEdit] = useState(false);

  // List view states
  const dataColumns = [
    { title: 'Reference No', name: 'trans_id', class: 'text-center' },
    { title: 'Date', name: 'ddate', class: 'text-center' },
    { title: 'Description', name: 'des' },
    { title: 'Amount (LKR)', name: 'dr_amount', class: 'text-right' },
    { title: 'User', name: 'user_name' },
  ];

  let dataRows = [];

  /* --- End of state declarations --- */

  useEffect(() => {
    fetchData();
  }, []);
  useEffect(() => {
    if (showModalState === false) {
      resetForm();
    }
  }, [showModalState]);
  /* --- Component functions --- */

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const response = await api.get(
        `expenseTypes/${cookie.get('user_branch')}`,
      );

      //console.log(response);

      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err);
        });
      }

      setExpenseTypesList(response.data.expenseTypes);

      response.data.expenseTrans.map((trans) => {
        dataRows.push({
          id: trans.id,
          account_id: trans.account_id,
          b_rec: trans.b_rec,
          branch_id: trans.branch_id,
          cr_amount: trans.cr_amount,
          created_at: trans.created_at,
          ddate: trans.ddate,
          des: trans.des,
          dr_amount: trans.dr_amount,
          ref_no: trans.ref_no,
          trans_id: trans.trans_id,
          trans_type_id: trans.trans_type_id,
          updated_at: trans.updated_at,
          user_id: trans.user_id,
          user_name: trans.user_name,
          user_email: trans.useremaild,
        });
      });

      setEntities(dataRows);
    } catch (error) {
      msg.error('Unable to fetch data!');
      return console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  // const searchAndFetch = async (searchPhrase, selectedColumn) => {
  //   dataRows = [];
  //   try {
  //     setIsLoading(true);

  //     const response = await api.get(
  //       `expense-types/search/${searchPhrase}/${selectedColumn}`,
  //     );

  //     console.log(response);

  //     if (response.data.total === 0) {
  //       msg.warning(`No results returned your search!`);
  //     } else {
  //       response.data.data.map((entity) => {
  //         return dataRows.push({
  //           id: entity.id,
  //           name: entity.name,
  //           account: entity.account,
  //         });
  //       });
  //       setEntities(dataRows);
  //     }
  //     setIsLoading(false);
  //   } catch (error) {
  //     msg.error(`Unable to search data! --> ${error}`);
  //     setIsLoading(false);
  //     return console.log(error);
  //   }
  // };

  const handleValueChange = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue = targetInput.value;

    // let expenseType = '';
    // let amount = '';

    // if (inputName === 'acc_id') {
    //   expenseType = expenseTypesList.filter((expense) => {
    //     if (parseInt(inputValue) === parseInt(expense.account_id)) {
    //       return expense.description;
    //     }
    //   });
    // }

    // if (inputName === 'dr_amount') {
    //   amount = inputValue;
    // }

    // setNewData({
    //   ...newData,
    //   des: `Branch 150-Embilipitiya : Payment of ${amount} for ${expenseType}`,
    //   [inputName]: inputValue,
    // });

    if (inputName === 'acc_id') {
      setNewData({
        ...newData,
        acc_id: inputValue,
        des: `The Expense of LKR ${
          newData.amount
        } for ${expenseTypesList.filter((expense) => {
          if (parseInt(expense.id) === parseInt(inputValue)) {
            return expense.description;
          }
        })}`,
      });
    } else if (inputName === 'amount') {
      setNewData({
        ...newData,
        amount: inputValue,
        des: `The Expense of LKR ${parseFloat(inputValue).toFixed(
          2,
        )} for ${expenseTypesList.filter((expense) => {
          return expense.id === newData.acc_id;
        })}`,
      });
    } else {
      setNewData({
        ...newData,
        [inputName]: inputValue,
      });
    }
  };

  const editRow = (dataObj) => {
    console.log(dataObj);

    setIsEdit(true);

    setNewData({
      branch_id: cookie.get('user_branch'),
      trans_id: dataObj.trans_id,
      ddate: dataObj.ddate,
      acc_id: dataObj.account_id,
      amount: dataObj.dr_amount,
      des: dataObj.des,
      user_id: cookie.get('user_id'),
    });

    setShowModalState(true);
  };

  const toggleFormModal = (e) => {
    setShowModalState(!showModalState);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    await save();

    resetAll();

    fetchData();
  };

  const save = async () => {
    try {
      if (isEdit === false) {
        const response = await api.post('saveExpense').values(newData);
        //console.log(response);
        if (response.error) {
          Object.values(response.error).forEach((err) => {
            msg.error(err);
          });

          return;
        } else {
          msg.success('Saved successfully!');
        }
      } else {
        console.log('edit');
        const response = await api
          .put('editExpense', newData.trans_id)
          .values(newData);

        if (response.error) {
          Object.values(response.error).forEach((err) => {
            msg.error(err);
          });
          setIsEdit(false);
          return;
        } else {
          msg.success('Updated successfully!');
        }
      }
    } catch (error) {
      msg.error(error);
      return console.log(error);
    } finally {
      setShowModalState(false);
    }
  };

  const resetAll = () => {
    setExpenseTypesList([
      {
        id: '',
        description: '',
        account_id: '',
      },
    ]);

    setEntities([]);

    setNewData({
      branch_id: cookie.get('user_branch'),
      trans_id: '',
      ddate: moment().format('YYYY-MM-DD'),
      acc_id: '',
      amount: (0).toFixed(2),
      des: '',
      user_id: cookie.get('user_id'),
    });

    setShowModalState(false);

    setIsLoading(false);

    dataRows = [];
  };

  const resetForm = () => {
    setNewData({
      branch_id: cookie.get('user_branch'),
      trans_id: '',
      ddate: moment().format('YYYY-MM-DD'),
      acc_id: '',
      amount: (0).toFixed(2),
      des: '',
      user_id: cookie.get('user_id'),
    });
    setIsEdit(false);
  };
  /* --- End of component functions --- */

  /* --- Component renders --- */

  return (
    <div>
      <h5 className="text-center">{moduleName}</h5>
      <br />
      <div className="col-sm-2">
        <SystemButton
          type={'add-new'}
          method={toggleFormModal}
          showText={true}
        />
      </div>

      {/* Form modal componenet */}
      <FormModal
        moduleName={moduleName}
        modalState={showModalState}
        toggleFormModal={toggleFormModal}
      >
        <form onSubmit={handleSubmit} className="compactForm">
          <div className="modal-body">
            <div className="row">
              <div className="offset-9 col-sm-3">
                <div className="form-group row">
                  <label htmlFor="ddate" className="col-sm-3 col-form-label">
                    Date
                  </label>
                  <div className="col-sm-9">
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      id="ddate"
                      name="ddate"
                      value={newData.ddate}
                      onChange={handleValueChange}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-sm-6">
                <div className="form-group">
                  <label htmlFor="acc_id">Expense type</label>
                  <select
                    type="text"
                    name="acc_id"
                    id="acc_id"
                    className="form-control form-control-sm"
                    value={newData.acc_id}
                    onChange={handleValueChange}
                  >
                    <option value="" className="text-muted" disabled>
                      -- Select expense type
                    </option>
                    {expenseTypesList.map((expense) => {
                      return (
                        <option value={expense.account_id} key={expense.id}>
                          {expense.description}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
              <div className="col-sm-6">
                <div className="form-group">
                  <label htmlFor="amount">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    id="amount"
                    step="0.01"
                    className="form-control form-control-sm text-right"
                    value={newData.amount}
                    onChange={handleValueChange}
                  />
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-sm-12">
                <div className="form-group">
                  <label htmlFor="des">Description</label>
                  <textarea
                    name="des"
                    id="des"
                    rows="2"
                    className="form-control form-control-sm"
                    value={newData.des}
                    onChange={handleValueChange}
                    readOnly={
                      newData.acc_id && newData.dr_amount != 0 ? false : true
                    }
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <SystemButton
              type={'close'}
              method={toggleFormModal}
              showText={true}
            />
            <SystemButton
              type={'save'}
              btnText={newData.acc_id === '' ? 'Save' : 'Save Changes'}
              showText={true}
            />
          </div>
        </form>
      </FormModal>
      {/* End of form modal componenet */}

      <br />
      <br />

      {/* List view componenet */}
      <ListView
        columns={dataColumns}
        rows={entities}
        loadingState={isLoading}
        edit={editRow}
        // searchAndFetch={searchAndFetch}
        actionsColumn={true}
        showEditButton={true}
        showDeleteButton={false}
      />
      {/* End of list view component */}
    </div>
  );

  /* --- End of component renders --- */
};

export default Expenses;
