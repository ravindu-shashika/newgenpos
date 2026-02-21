import React, { useState, useEffect } from 'react';
import { api, msg, cookie } from '../../services';
import { FormModal, ListView, SystemButton } from '../../components';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';

const IssueCheques = () => {
  // Module name
  const moduleName = 'Issue Cheques';

  /* --- State declarationss --- */

  const [fundTransTypesList, setFundTransTypesList] = useState([
    {
      id: '',
      description: '',
      account_id: '',
      t_type: '',
      is_cheque_trans: '',
    },
  ]);

  const [entities, setEntities] = useState([]);

  const [banksList, setBanksList] = useState([]);

  const [bankBranches, setBankBranches] = useState([]);

  const [branchesList, setBranchesList] = useState([]);

  const [tempBranchList, setTempBranchList] = useState([]);

  const [issuedCheques, setIssuedCheques] = useState([]);

  const [newData, setNewData] = useState({
    branch_id: cookie.get('user_branch'),
    tdate: moment().format('YYYY-MM-DD'),
    bank_id: '',
    bank_branch_id: '',
    account: '',
    cheque_no: '',
    status: 'I',
    amount: (0).toFixed(2),
    cheque_date: moment().format('YYYY-MM-DD'),
    user_id: cookie.get('user_id'),
    is_return: 0,
    issue_account_id: '',
    issue_branch_id: '',
    acc_des: '',
  });

  // Form modal state
  const [showModalState, setShowModalState] = useState(false);

  // Data loading status
  const [isLoading, setIsLoading] = useState(false);

  // List view states
  const dataColumns = [
    { title: 'Transaction Date', name: 'tdate', class: 'text-center' },
    { title: 'Bank Branch', name: 'bank_branch' },
    { title: 'Cheque Number', name: 'cheque_no', class: 'text-center' },
    { title: 'Amount (LKR)', name: 'amount', class: 'text-right' },
    { title: 'Cheque Date', name: 'cheque_date', class: 'text-center' },
    { title: 'Bank Account', name: 'bank_account', class: 'text-center' },
    { title: 'Issue Account', name: 'issue_account' },
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
        `showIssuedChequeByBranch/${cookie.get('user_branch')}`,
      );
      //console.log(response);
      if (typeof response.error !== 'undefined') {
        msg.error(response.error.err);
        return;
      } else {
        setBanksList(response.data.banks);
        setBankBranches(response.data.bankBranches);
        setFundTransTypesList(response.data.chqTransTypes);
        setIssuedCheques(response.data.issuedCheques);
        setBranchesList(response.data.branches);
        response.data.issuedCheques.map((cheque) => {
          dataRows.push({
            id: uuidv4(),
            tdate: cheque.tdate,
            bank_branch: response.data.bankBranches.map((branch) => {
              if (branch.id === cheque.bank_branch_id) {
                return branch.des;
              }
            }),
            cheque_no: cheque.cheque_no,
            amount: cheque.amount,
            cheque_date: cheque.cheque_date,
            bank_account: cheque.account,
            issue_account: response.data.chqTransTypes.map((type) => {
              if (type.id === cheque.issue_account_id) {
                return type.description;
              }
            }),
          });
        });
        setEntities(dataRows);
        console.log(dataRows);
        return;
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

    if (inputName === 'bank_id') {
      setTempBranchList(
        bankBranches.filter(
          (branchList) => parseInt(branchList.bank_id) === parseInt(inputValue),
        ),
      );
    }

    setNewData({
      ...newData,
      [inputName]: inputValue,
    });
  };

  const toggleFormModal = () => {
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
      const response = await api.post('issuedCheque').values(newData);

      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err);
        });
        return;
      } else {
        msg.success('Saved successfully!');
        return;
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
        t_type: '',
        is_cheque_trans: '',
      },
    ]);

    setEntities([]);

    setNewData({
      branch_id: cookie.get('user_branch'),
      tdate: moment().format('YYYY-MM-DD'),
      bank_id: '',
      bank_branch_id: '',
      account: '',
      cheque_no: '',
      status: 'I',
      amount: (0).toFixed(2),
      cheque_date: moment().format('YYYY-MM-DD'),
      user_id: cookie.get('user_id'),
      is_return: 0,
      issue_account_id: '',
      issue_branch_id: '',
      acc_des: '',
    });

    setShowModalState(false);

    setIsLoading(false);

    dataRows = [];
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
          btnText={'New Transfer'}
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
              <div className="offset-7 col-sm-5">
                <div className="form-group row">
                  <label htmlFor="tdate" className="col-sm-5 col-form-label">
                    Transaction Date
                  </label>
                  <div className="col-sm-7">
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      id="tdate"
                      name="tdate"
                      value={newData.tdate}
                      onChange={handleValueChange}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-sm-6">
                <div className="form-group">
                  <label htmlFor="issue_account_id">Issue account</label>
                  <select
                    type="text"
                    name="issue_account_id"
                    id="issue_account_id"
                    className="form-control form-control-sm"
                    value={newData.issue_account_id}
                    onChange={handleValueChange}
                  >
                    <option value="">-- Select a transfer type</option>
                    {fundTransTypesList.map((transfer) => {
                      return transfer.t_type === 'OUT' ? (
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
                  <label htmlFor="branch_id">Issue cheque to</label>
                  <select
                    type="text"
                    name="issue_branch_id"
                    id="issue_branch_id"
                    className="form-control form-control-sm"
                    value={newData.issue_branch_id}
                    onChange={handleValueChange}
                  >
                    <option value="">-- Select a branch to issues</option>
                    {branchesList.map((branch) => {
                      return (
                        <option value={branch.id} key={branch.id}>
                          {branch.code} - {branch.name}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-sm-4">
                <div className="form-group">
                  <label htmlFor="bank_id">Bank</label>
                  <select
                    type="text"
                    name="bank_id"
                    id="bank_id"
                    className="form-control form-control-sm"
                    value={newData.bank_id}
                    onChange={handleValueChange}
                  >
                    <option value="">-- Select a bank</option>
                    {banksList.map((bank) => {
                      return (
                        <option value={bank.id} key={bank.id}>
                          {bank.des}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
              <div className="col-sm-4">
                <div className="form-group">
                  <label htmlFor="bank_branch_id">Bank Branch</label>
                  <select
                    type="text"
                    name="bank_branch_id"
                    id="bank_branch_id"
                    className="form-control form-control-sm"
                    value={newData.bank_branch_id}
                    onChange={handleValueChange}
                    disabled={newData.bank_id === '' ? true : false}
                  >
                    <option value="">-- Select a bank branch</option>
                    {tempBranchList.map((branch) => {
                      return (
                        <option value={branch.id} key={branch.id}>
                          {branch.des}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
              <div className="col-sm-4">
                <div className="form-group">
                  <label htmlFor="account">Account Number</label>
                  <input
                    type="text"
                    name="account"
                    id="account"
                    className="form-control form-control-sm"
                    value={newData.account}
                    onChange={handleValueChange}
                  />
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-sm-4">
                <div className="form-group">
                  <label htmlFor="cheque_no">Cheque Number</label>
                  <input
                    type="number"
                    name="cheque_no"
                    id="cheque_no"
                    step="0.01"
                    className="form-control form-control-sm text-right"
                    value={newData.cheque_no}
                    onChange={handleValueChange}
                  />
                </div>
              </div>
              <div className="col-sm-4">
                <div className="form-group">
                  <label htmlFor="cheque_date">Cheque Date</label>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    id="cheque_date"
                    name="cheque_date"
                    value={newData.cheque_date}
                    onChange={handleValueChange}
                  />
                </div>
              </div>
              <div className="col-sm-4">
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
                  <label htmlFor="acc_des">Description</label>
                  <textarea
                    name="acc_des"
                    id="acc_des"
                    rows="2"
                    className="form-control form-control-sm"
                    value={newData.acc_des}
                    onChange={handleValueChange}
                    disabled={
                      newData.issue_account_id &&
                      newData.amount &&
                      newData.issue_branch_id != 0
                        ? false
                        : true
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
            <SystemButton type={'save'} showText={true} />
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

export default IssueCheques;
