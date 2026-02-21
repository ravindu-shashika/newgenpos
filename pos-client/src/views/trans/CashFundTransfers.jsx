import React, { useState, useEffect } from 'react';
import { api, msg, cookie } from '../../services';
import { FormModal, ListView, SystemButton } from '../../components';
import moment from 'moment';

const CashFundTransfers = () => {
  // Module name
  const moduleName = 'Cash Transfers';

  /* --- State declarationss --- */

  const [fundTransTypesList, setFundTransTypesList] = useState([
    {
      id: '',
      description: '',
      account_id: '',
      t_type: '',
    },
  ]);

  const [branchesList, setBranchesList] = useState([
    {
      id: '',
      code: '',
      name: '',
    },
  ]);

  const [entities, setEntities] = useState([]);

  const [newData, setNewData] = useState({
    branch_id: cookie.get('user_branch'),
    ddate: moment().format('YYYY-MM-DD'),
    acc_id: '',
    amount: (0).toFixed(2),
    des: '',
    user_id: cookie.get('user_id'),
    type: 'OUT',
    // to_branch_id: '',
  });

  // Form modal state
  const [showModalState, setShowModalState] = useState(false);

  // Transaction type state
  const [isReceive, setIsReceive] = useState(false);

  // Data loading status
  const [isLoading, setIsLoading] = useState(false);

  // List view states
  const dataColumns = [
    { title: 'Date', name: 'ddate', class: 'text-center' },
    { title: 'Description', name: 'des' },
    { title: 'Amount (LKR)', name: 'amount', class: 'text-right' },
    { title: 'Transfer Type', name: 'trans_type', class: 'text-center' },
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
      const response = await api.get(
        `fundTransTypes/${cookie.get('user_branch')}`,
      );

      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err);
        });
        return;
      }

      setFundTransTypesList(response.data.fundTransTypes);
      setBranchesList(response.data.branches);

      response.data.fundTrans.map((trans) => {
        dataRows.push({
          id: trans.id,
          trans_type:
            parseInt(trans.trans_type_id) === parseInt(18)
              ? 'Sent'
              : 'Received',
          ddate: trans.ddate,
          des: trans.des,
          amount:
            parseInt(trans.trans_type_id) === parseInt(18)
              ? trans.dr_amount
              : trans.cr_amount,
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
  //   try {
  //     setIsLoading(true);

  //     const response = await api.get(
  //       `expense-types/search/${searchPhrase}/${selectedColumn}`,
  //     );

  //     dataRows = [];

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
    if (isReceive) {
      setNewData({
        ...newData,
        user_id: cookie.get('user_id'),
        //to_branch_id: 0,
        [inputName]: inputValue,
      });
    } else {
      setNewData({
        ...newData,
        user_id: cookie.get('user_id'),
        [inputName]: inputValue,
      });
    }
  };

  const toggleFormModal = () => {
    setShowModalState(!showModalState);
  };

  const transTypeSend = () => {
    setIsReceive(false);

    setNewData({
      ...newData,
      type: 'OUT',
    });
  };

  const transTypeReceive = () => {
    setIsReceive(true);

    setNewData({
      ...newData,
      type: 'IN',
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    await save();

    resetAll();

    fetchData();
  };

  const save = async () => {
    try {
      //console.log(newData);
      const response = await api.post('saveFundTrans').values(newData);
      //console.log(response.data);
      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err);
        });
        return;
      } else {
        msg.success('Saved successfully!');
      }
    } catch (error) {
      msg.error(error);
      return console.log(error);
    } finally {
      setShowModalState(false);
    }
  };

  const resetAll = () => {
    setFundTransTypesList([
      {
        id: '',
        description: '',
        account_id: '',
        trans_type: '',
      },
    ]);

    setEntities([]);

    setNewData({
      branch_id: cookie.get('user_branch'),
      ddate: moment().format('YYYY-MM-DD'),
      acc_id: '',
      amount: (0).toFixed(2),
      des: '',
      user_id: cookie.get('user_id'),
      type: 'OUT',
      // to_branch_id: '',
    });

    setShowModalState(false);

    setIsLoading(false);

    dataRows = [];
  };

  const hadleChangeBranch = (e) => {
    setNewData({
      ...newData,
      des: e.target[e.target.selectedIndex].text,
    });
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
          btnText={'New Transfer'}
        />
      </div>

      {/* Form modal componenet */}
      <FormModal
        moduleName={moduleName}
        modalState={showModalState}
        toggleFormModal={toggleFormModal}
      >
        <ul className="nav nav-tabs nav-pills nav-justified">
          <li className="nav-item">
            <div className="btn btn-sm btn-block" onClick={transTypeSend}>
              <div className={isReceive ? 'nav-link' : 'nav-link active'}>
                Send Funds
              </div>
            </div>
          </li>
          <li className="nav-item">
            <div className="btn btn-sm btn-block" onClick={transTypeReceive}>
              <a className={isReceive ? 'nav-link active' : 'nav-link'}>
                Receive Funds
              </a>
            </div>
          </li>
        </ul>
        <form onSubmit={handleSubmit} className="compactForm">
          <div className="modal-body">
            <div className="row">
              <div className="offset-8 col-sm-4">
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
                  <label htmlFor="acc_id">
                    {isReceive ? 'Receive transfer type' : 'Send transfer type'}
                  </label>
                  <select
                    type="text"
                    name="acc_id"
                    id="acc_id"
                    className="form-control form-control-sm"
                    value={newData.acc_id}
                    onChange={handleValueChange}
                  >
                    <option value="">-- Select a transfer type</option>
                    {fundTransTypesList.map((transfer) => {
                      return isReceive ? (
                        transfer.t_type === 'IN' ? (
                          <option value={transfer.account_id} key={transfer.id}>
                            {transfer.description}
                          </option>
                        ) : null
                      ) : transfer.t_type === 'OUT' ? (
                        <option value={transfer.account_id} key={transfer.id}>
                          {transfer.description}
                        </option>
                      ) : null;
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
              <div className="col-sm-6">
                <div className="form-group">
                  <label htmlFor="to_branch_id">From Branch</label>
                  <select
                    type="text"
                    name="to_branch_id"
                    id="to_branch_id"
                    className="form-control form-control-sm"
                    value={newData.to_branch_id}
                    onChange={hadleChangeBranch}
                  >
                    <option value="">-- Select a Branch</option>
                    {branchesList.map((branch) => {
                      return (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}-{branch.code}
                        </option>
                      );
                    })}
                  </select>
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
                    // readOnly={
                    //   newData.acc_id && newData.dr_amount != 0 ? false : true
                    // }
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
              showText={true}
              btnText={newData.acc_id === '' ? 'Save' : 'Save Changes'}
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
        actionsColumn={false}
        showEditButton={false}
        showDeleteButton={false}
      />
      {/* End of list view component */}
    </div>
  );

  /* --- End of component renders --- */
};

export default CashFundTransfers;
