import React, { useState, useEffect } from 'react';
import { api, msg, cookie } from '../../services';
import { FormModal, ListView, SystemButton, SDD } from '../../components';
import moment from 'moment';
// import { async } from 'exceljs/dist/exceljs';

const Incomes = () => {
  // Module name
  const moduleName = 'Incomes';
  /* --- State declarationss --- */

  const [incomeTypesList, setIncomeTypesList] = useState([
    {
      id: '',
      description: '',
      account_id: '',
    },
  ]);

  const [entities, setEntities] = useState([]);

  const [newData, setNewData] = useState({
    branch_id: cookie.get('user_branch'),
    id: '',
    ddate: cookie.get('new_date')
      ? cookie.get('new_date')
      : moment().format(`YYYY-MM-DD`),
    acc_id: '',
    amount: '',
    account: '',
    des: '',
    user_id: cookie.get('user_id'),
    trans_id: '',
  });

  // Form modal state
  const [showModalState, setShowModalState] = useState(false);

  const [newId, setNewId] = useState(0);

  const [isDisabled, setIsDisabled] = useState(false);

  // Data loading status
  const [isLoading, setIsLoading] = useState(false);

  //
  const [isEdit, setIsEdit] = useState(false);

  // List view states
  const dataColumns = [
    {
      title: 'Batch No',
      name: 'income_number',
      class: 'text-center',
      searchable: true,
    },
    // {
    //   title: 'Reference No',
    //   name: 'trans_id',
    //   class: 'text-center',
    // },
    {
      title: 'Date',
      name: 'ddate',
      class: 'text-center',
      searchable: true,
    },
    {
      title: 'Account',
      name: 'account',
      searchable: true,
    },
    {
      title: 'Description',
      name: 'des',
      searchable: true,
    },
    {
      title: 'Amount (LKR)',
      name: 'cr_amount',
      class: 'text-right',
      searchable: true,
    },
    {
      title: 'Created At',
      name: 'created_at',
      class: 'text-right',
      searchable: true,
    },
    { title: 'User', name: 'user' },
  ];

  let dataRows = [];

  /* --- End of state declarations --- */

  useEffect(() => {
    fetchData();
  }, []);

  //   useEffect(() => {
  //     if (showModalState === false) {
  //       resetForm();
  //     }
  //   }, [showModalState]);
  /* --- Component functions --- */

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`incomes/${cookie.get('user_branch')}`);
      console.log(response.data);
      const trans_date = await api.get(
        'trans_date/' + cookie.get('user_branch'),
      );
      if (response.status == 200 && response.data.status == 200) {
        setNewData({
          ...newData,
          income_number: response.data.data.new_number,
          ddate: trans_date.data
            ? trans_date.data
            : moment().format('YYYY-MM-DD'),
          branch_id: cookie.get('user_branch'),
          id: '',
          acc_id: '',
          amount: '',
          account: '',
          des: '',
          user_id: cookie.get('user_id'),
          trans_id: '',
        });

        setNewId(response.data.data.new_number);

        // * accounts with account code
        let accounts = [];
        response.data.data.incomeTypes
          .map((type) => {
            accounts.push({
              id: type.id,
              description: type.number + ' - ' + type.description,
              account_id: type.account_id,
            });
          })
          .join('');

        setIncomeTypesList(accounts);
        response.data.data.expenseTrans.map((trans) => {
          dataRows.push({
            income_number: trans.income_number,
            id: trans.id,
            account_id: trans.income_type,
            // b_rec: trans.b_rec,
            branch_id: trans.branch_id,
            cr_amount: trans.amount,
            // created_at: trans.created_at,
            ddate: trans.ddate,
            des: trans.description,
            dr_amount: trans.amount,
            ref_no: trans.trans_id,
            trans_id: trans.trans_id,
            trans_type_id: trans.trans_type_id,
            updated_at: trans.updated_at,
            user_id: trans.user_id,
            user: trans.user.name,
            user_email: trans.useremaild,
            account: trans.account.account_number + ' - ' + trans.account.des,
            // account:
            //   trans.account_trans[0].account.account_number +
            //   ' - ' +
            //   trans.account_trans[0].account.des,
            created_at: moment(trans.created_at).format('YYYY-MM-DD | h:mm A'),
          });
        });

        setEntities(dataRows);
      } else if (response.status == 200 && response.data.status == 400) {
        msg.warning(response.data.message);
      } else if (response.status == 200 && response.data.status == 500) {
        msg.error(response.data.message);
      } else if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err);
        });
      } else {
        msg.error('Something went wrong...');
      }
    } catch (error) {
      msg.error('Unable to fetch data!');
      return console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleValueChange = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue = targetInput.value;
    if (inputName === 'acc_id') {
      setNewData({
        ...newData,
        acc_id: inputValue,
        // des: '',
      });
    } else {
      setNewData({
        ...newData,
        [inputName]: inputValue,
      });
    }
  };

  const editRow = (dataObj) => {
    setIsEdit(true);
    setIsDisabled(false);
    setNewData({
      income_number: dataObj.income_number,
      branch_id: cookie.get('user_branch'),
      id: dataObj.id,
      ddate: dataObj.ddate,
      acc_id: dataObj.account_id,
      amount: dataObj.cr_amount,
      des: dataObj.des,
      user_id: cookie.get('user_id'),
      trans_id: dataObj.trans_id,
      account: dataObj.account,
    });
    setShowModalState(true);
  };

  const toggleFormModal = async (e) => {
    console.log('open moel');
    setIsEdit(false);
    setIsDisabled(false);
    setShowModalState(!showModalState);
    const trans_date = await api.get('trans_date/' + cookie.get('user_branch'));
    setNewData({
      ...newData,
      income_number: newId,
      branch_id: cookie.get('user_branch'),
      id: '',
      ddate: trans_date.data ? trans_date.data : moment().format('YYYY-MM-DD'),
      acc_id: '',
      amount: '',
      account: '',
      des: '',
      user_id: cookie.get('user_id'),
      trans_id: '',
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsDisabled(true);
    await save();
    // resetAll();
    // fetchData();
  };

  const save = async () => {
    try {
      if (isEdit === false) {
        const response = await api.post('saveIncome').values(newData);
        if (response.status == 200 && response.data.status == 200) {
          msg.success(response.data.message);
          resetAll();
          fetchData();
        } else if (response.status == 200 && response.data.status == 500) {
          msg.error(response.data.message);
        } else if (response.status == 200 && response.data.status == 400) {
          Object.values(response.data.message).forEach((err) => {
            msg.error(err[0]);
          });
        } else if (response.data.status == 400) {
          Object.values(response.message).forEach((err) => {
            msg.error(err[0]);
          });
        }
      } else {
        const response = await api
          .put('editIncome', newData.trans_id)
          .values(newData);
        if (response.status == 200 && response.data.status == 200) {
          msg.success(response.data.message);
          resetAll();
          fetchData();
        } else if (response.status == 200 && response.data.status == 500) {
          msg.error(response.data.message);
        } else if (response.status == 200 && response.data.status == 400) {
          Object.values(response.data.message).forEach((err) => {
            msg.error(err[0]);
          });
        } else if (response.data.status == 400) {
          Object.values(response.message).forEach((err) => {
            msg.error(err[0]);
          });
        }
      }
    } catch (error) {
      msg.error(error);
      return console.log(error);
    }
  };

  const resetAll = () => {
    setIncomeTypesList([
      {
        id: '',
        description: '',
        account_id: '',
      },
    ]);

    setNewId(0);

    setEntities([]);

    setNewData({
      ...newData,
      branch_id: cookie.get('user_branch'),
      id: '',
      ddate: moment().format('YYYY-MM-DD'),
      acc_id: '',
      amount: '',
      account: '',
      des: '',
      user_id: cookie.get('user_id'),
      trans_id: '',
    });

    setShowModalState(false);

    setIsLoading(false);

    dataRows = [];
  };

  const resetForm = () => {
    setNewData({
      branch_id: cookie.get('user_branch'),
      id: '',
      ddate: cookie.get('new_date')
        ? cookie.get('new_date')
        : moment().format(`YYYY-MM-DD`),
      acc_id: '',
      amount: '',
      des: '',
      user_id: cookie.get('user_id'),
      trans_id: '',
    });
    setIsEdit(false);
    fetchData();
  };

  const resetSearch = () => {
    setEntities([]);

    fetchData();
  };

  const deleteRow = async (dataObj) => {
    const choose = window.confirm('Are You Sure Want to Delete ?');
    if (choose == true) {
      const response = await api.post('delete-income').values({
        id: dataObj.id,
        branch_id: dataObj.branch_id,
      });
      if (response.status == 200 && response.data.status == 200) {
        msg.success(response.data.message);
        resetAll();
        fetchData();
      } else if (response.status == 200 && response.data.status == 400) {
        msg.warning(response.data.message);
      } else if (response.status == 200 && response.data.status == 500) {
        msg.error(response.data.message);
      } else {
        msg.error('Something went wrong...');
      }
    }
  };

  const accountSelect = async (selectedObj) => {
    // console.log('selected row');
    // console.log(selectedObj.account_id);
    setNewData({
      ...newData,
      acc_id: selectedObj.account_id,
    });
  };

  const searchAndFetch = () => {};
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
        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.preventDefault();
          }}
          className="compactForm"
        >
          <div className="modal-body">
            <div className="row">
              <div className="col-sm-3">
                <div className="form-group row">
                  <label htmlFor="ddate" className="col-sm-3 col-form-label">
                    No
                  </label>
                  <div className="col-sm-9">
                    <input
                      type="text"
                      className="form-control form-control-sm text-right"
                      id="ddate"
                      name="ddate"
                      value={newData.income_number}
                      readOnly
                    />
                  </div>
                </div>
              </div>
              <div className="offset-6 col-sm-3">
                <div className="form-group row">
                  <label htmlFor="ddate" className="col-sm-3 col-form-label">
                    Date
                  </label>
                  <div className="col-sm-9">
                    <input
                      type="date"
                      className="form-control form-control-sm text-right"
                      id="ddate"
                      name="ddate"
                      value={newData.ddate}
                      onChange={handleValueChange}
                      readOnly={cookie.get('user_roles') != 1}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-sm-6">
                <div className="form-group">
                  <label htmlFor="acc_id">Income type</label>
                  {/* <select
                                    type="text"
                                    name="acc_id"
                                    id="acc_id"
                                    className="form-control form-control-sm"
                                    value={newData.acc_id}
                                    onChange={handleValueChange}
                                >
                                    <option value="" className="text-muted" disabled>
                                    -- Select type
                                    </option>
                                    {incomeTypesList.map((income) => {
                                    return (
                                        <option value={income.account_id} key={income.id}>
                                        {income.description}
                                        </option>
                                    );
                                    })}
                                </select> */}
                  <SDD
                    method={accountSelect}
                    data={incomeTypesList}
                    value="description"
                    rowId="account_id"
                    classes="form-control"
                    placeholder="-- Select an account"
                    listId="vendors"
                    selected={newData.account}
                  />
                </div>
              </div>
              <div className="col-sm-6">
                <div className="form-group">
                  <label htmlFor="amount">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    id="amount"
                    min="0.00"
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
              btnText={isEdit ? 'Save Changes' : 'Save'}
              showText={true}
              disabled={isDisabled}
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
        searchAndFetch={searchAndFetch}
        actionsColumn={true}
        showEditButton={true}
        showDeleteButton={true}
        resetSearch={resetSearch}
        deleteFunc={deleteRow}
      />
      {/* End of list view component */}
    </div>
  );

  /* --- End of component renders --- */
};

export default Incomes;
