import React, { useState, useEffect } from 'react';
import { api, msg, cookie } from '../../services';
import { FormModal, ListView, SystemButton } from '../../components';
import moment from 'moment';
import { SafeFontAwesomeIcon } from '../../components';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

const ReceiveCheque = () => {
  // Module name
  const moduleName = 'Receive Cheques';

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

  const [receivedCheques, setReceivedCheques] = useState([]);

  const [banks, setBanks] = useState([]);

  const [bankBranches, setBankBranches] = useState([]);

  const [branchesList, setBranchesList] = useState([]);

  const [newData, setNewData] = useState({
    branch_id: cookie.get('user_branch'),
    tdate: moment().format('YYYY-MM-DD'),
    bank_id: '',
    bank_branch_id: '',
    account: '',
    cheque_no: '',
    status: 'R',
    amount: (0).toFixed(2),
    cheque_date: moment().format('YYYY-MM-DD'),
    received_account_id: '',
    bank_deposit_acc: '',
    user_id: cookie.get('user_id'),
    issue_branch_id: '',
    acc_des: '',
    trans_id: '',
    is_realized: false,
  });

  // List modal state
  const [showListModal, setShowListModal] = useState(false);

  // Form modal state
  const [showFormModal, setShowFormModal] = useState(false);

  // Data loading status
  const [isLoading, setIsLoading] = useState(false);

  const [realizingCheque_id, setRealizingCheque_id] = useState(0);

  const [showRealizingModal, setShowRealizingModal] = useState(false);

  const [isRealized, setIsRealized] = useState(false);

  // List view states
  const dataColumns = [
    { title: 'Transaction Date', name: 'tdate' },
    { title: 'Bank Branch', name: 'bank_branch' },
    { title: 'Cheque Number', name: 'cheque_no', class: 'text-center' },
    { title: 'Amount (LKR)', name: 'amount', class: 'text-right' },
    { title: 'Cheque Date', name: 'cheque_date', class: 'text-center' },
    { title: 'Bank Account', name: 'bank_account' },
    //{ title: 'Issue Account', name: 'issue_account' },
    { title: 'Received Account', name: 'received_account' },
    { title: 'User', name: 'user_name' },
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
        `showReceivedChequeByBranch/${cookie.get('user_branch')}`,
      );

      //console.log(response.data.receivedCheques);

      if (typeof response.error !== 'undefined') {
        msg.error(response.error.err);
      } else {
        setBankBranches(response.data.bankBranches);

        setFundTransTypesList(response.data.chqTransTypes);

        setBanks(response.data.banks);

        setBranchesList(response.data.branches);

        setReceivedCheques(response.data.sentCheques);

        if (response.data.receivedCheques) {
          response.data.receivedCheques.map((cheque) => {
            dataRows.push({
              id: cheque.id,
              tdate: cheque.created_at,
              account: cheque.account,
              amount: cheque.amount,
              bank_branch_id: cheque.bank_branch_id,
              bank_branch: response.data.bankBranches.map((branch) => {
                if (branch.id === cheque.bank_branch_id) {
                  return branch.des;
                }
              }),
              bank_deposit_acc: cheque.bank_deposit_acc,
              bank_id: cheque.bank_id,
              cheque_date: cheque.cheque_date,
              issue_branch_id: cheque.issue_branch_id,
              issue_branch: response.data.branches.map((branch) => {
                if (branch.id === cheque.issue_branch_id) {
                  return branch.des;
                }
              }),
              received_account_id: cheque.received_account_id,
              issue_account_id: cheque.issue_account_id,
              status: cheque.status,
              trans_id: cheque.trans_id,
              trans_type_id: cheque.trans_type_id,
              cheque_no: cheque.cheque_no,
              bank_account: cheque.account,
              received_account: response.data.chqTransTypes.map((type) => {
                if (type.account_id === cheque.received_account_id) {
                  return type.description;
                }
              }),
              issue_account: response.data.chqTransTypes.map((type) => {
                if (type.id === cheque.issue_account_id) {
                  return type.description;
                }
              }),
              user_name: cheque.user_name,
              trans_id: cheque.trans_id,
              is_realized: cheque.is_realized,
            });
          });

          setEntities(dataRows);
        }
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

    setNewData({
      ...newData,
      [inputName]: inputValue,
    });
  };

  const toggleListModal = () => {
    setShowListModal(!showListModal);
  };

  const toggleFormModal = () => {
    setShowFormModal(!showListModal);
  };

  const ReceiveCheque = (chqId) => {
    receivedCheques.map((cheque) => {
      if (parseInt(cheque.id) === parseInt(chqId)) {
        setNewData({
          ...newData,
          bank_id: cheque.banck_id,
          bank_branch_id: cheque.bank_branch_id,
          account: cheque.account,
          cheque_no: cheque.cheque_no,
          amount: cheque.amount,
          cheque_date: cheque.cheque_date,
          //received_account_id: 11,
          bank_deposit_acc: cheque.account,
          user_id: cookie.get('user_id'),
          issue_branch_id: cheque.branch_id,
          trans_id: cheque.trans_id,
          acc_des: `Cheque transaction received for LKR ${cheque.amount} from ${cheque.issue_branch_id}`,
          branch: branchesList
            .map((branch) => {
              if (parseInt(branch.id) === parseInt(newData.branch_id)) {
                return branch.name;
              }
            })
            .join(''),
          bank: banks
            .map((bank) => {
              if (parseInt(bank.id) === parseInt(cheque.banck_id)) {
                return bank.des;
              }
            })
            .join(''),
          bank_branch: bankBranches
            .map((branch) => {
              if (branch.id === cheque.bank_branch_id) {
                return branch.des;
              }
            })
            .join(''),
        });
      }
    });

    setShowFormModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await save();
    resetAll();
    fetchData();
  };

  const save = async () => {
    try {
      const response = await api.post('receivedCheque').values(newData);
      console.log(response);
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
      setShowListModal(false);
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
      status: 'R',
      amount: (0).toFixed(2),
      cheque_date: moment().format('YYYY-MM-DD'),
      received_account_id: '',
      bank_deposit_acc: '',
      user_id: cookie.get('user_id'),
      issue_branch_id: '',
      acc_des: '',
      trans_id: '',
      is_realized: false,
    });

    setShowListModal(false);
    setShowFormModal(false);

    setIsLoading(false);

    dataRows = [];
  };

  /* --- End of component functions --- */

  const toggleRealizingFormModal = () => {
    setShowRealizingModal(!showRealizingModal);
  };

  const realizing_cheque = (obj) => {
    setRealizingCheque_id(obj.id);
    setIsRealized(
      entities.filter((cheque) => {
        return obj.id === cheque.id;
      })[0].is_realized,
    );
    toggleRealizingFormModal();
  };

  const toggleIsRealized = async () => {
    if (!isRealized) {
      await saveRealized();
    }

    setIsRealized(!isRealized);
    fetchData();
  };

  const saveRealized = async () => {
    try {
      const response = await api.get(
        `saveRealizedCheque/${realizingCheque_id}`,
      );

      console.log(response.data);
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
    }
  };

  /* --- Component renders --- */

  return (
    <div>
      <h5 className="text-center">{moduleName}</h5>
      <br />

      <div className="col-sm-2">
        <SystemButton
          type={'add-new'}
          method={toggleListModal}
          btnText={'Receive transfer'}
          showText={true}
        />
      </div>
      {/* BEGIN Realizing Form Modal */}

      <FormModal
        moduleName={moduleName}
        modalState={showRealizingModal}
        toggleFormModal={toggleRealizingFormModal}
      >
        <div className="modal-body">
          <div className="material-switch pull-right">
            <span>
              <label htmlFor="is_realized">Realizing Cheque</label>
            </span>
            <br />
            <input
              id="is_realized"
              name="is_realized"
              type="checkbox"
              checked={isRealized}
              onClick={toggleIsRealized}
              disabled={isRealized ? 'desable' : ''}
            />
            <label htmlFor="is_realized" className="btn-success"></label>
          </div>
        </div>
        <div className="modal-footer"></div>
      </FormModal>

      {/* END Realizing Form Modal */}

      {/* List modal componenet */}
      <FormModal
        moduleName={moduleName}
        modalState={showListModal}
        toggleFormModal={toggleListModal}
      >
        <table className="table table-hover">
          <thead className="thead-light text-center">
            <tr>
              <th scope="col">From Branch</th>
              <th scope="col">Bank Branch</th>
              <th scope="col">Account No</th>
              <th scope="col">Cheque No</th>
              <th scope="col">Amount</th>
              <th scope="col">Cheque Date</th>
              {/* <th scope="col">State</th> */}
            </tr>
          </thead>
          <tbody>
            {receivedCheques ? (
              receivedCheques.map((cheque) => {
                return (
                  <tr key={cheque.id} onClick={() => ReceiveCheque(cheque.id)}>
                    <td>
                      {branchesList.map((branch) => {
                        if (
                          parseInt(branch.id) === parseInt(cheque.branch_id)
                        ) {
                          return branch.name;
                        }
                      })}
                    </td>
                    <td>
                      {bankBranches.map((bank) => {
                        if (bank.id === cheque.bank_branch_id) {
                          return bank.des;
                        }
                      })}
                    </td>
                    <td>{cheque.account}</td>
                    <td>{cheque.cheque_no}</td>
                    <td className="text-right">{cheque.amount}</td>
                    <td className="text-center">{cheque.cheque_date}</td>
                    {/* <td>
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={() => handleSubmit(cheque.id)}
                      >
                        Receive
                      </button>
                    </td> */}
                  </tr>
                );
              })
            ) : (
              <p className="text-center">No received cheques to display</p>
            )}
          </tbody>
        </table>
      </FormModal>
      {/* End of list modal componenet */}

      {/* Form modal componenet */}
      <FormModal
        moduleName={'Cheque details'}
        modalState={showFormModal}
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
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-sm-3">
                <div className="form-group">
                  <label htmlFor="received_account_id">Receive account</label>
                  <select
                    type="text"
                    name="received_account_id"
                    id="received_account_id"
                    className="form-control form-control-sm"
                    value={newData.received_account_id}
                    onChange={handleValueChange}
                  >
                    <option value="">-- Select a transfer type</option>
                    {fundTransTypesList.map((transfer) => {
                      return transfer.t_type === 'IN' ? (
                        <option value={transfer.account_id} key={transfer.id}>
                          {transfer.description}
                        </option>
                      ) : null;
                    })}
                  </select>
                </div>
              </div>
              <div className="col-sm-3">
                <div className="form-group">
                  <label htmlFor="issue_branch">Received cheque from</label>
                  <input
                    type="text"
                    name="issue_branch"
                    id="issue_branch"
                    className="form-control form-control-sm"
                    value={newData.branch}
                    readOnly
                  />
                </div>
              </div>
              <div className="col-sm-3">
                <div className="form-group">
                  <label htmlFor="bank">Bank</label>
                  <input
                    type="text"
                    name="bank"
                    id="bank"
                    className="form-control form-control-sm"
                    value={newData.bank}
                    readOnly
                  />
                </div>
              </div>
              <div className="col-sm-3">
                <div className="form-group">
                  <label htmlFor="bank_branch">Bank branch</label>
                  <input
                    type="text"
                    name="bank_branch"
                    id="bank_branch"
                    className="form-control form-control-sm"
                    value={newData.bank_branch}
                    readOnly
                  />
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-sm-3">
                <div className="form-group">
                  <label htmlFor="account">Account Number</label>
                  <input
                    type="text"
                    name="account"
                    id="account"
                    className="form-control form-control-sm"
                    value={newData.account}
                    readOnly
                  />
                </div>
              </div>
              <div className="col-sm-3">
                <div className="form-group">
                  <label htmlFor="cheque_no">Cheque Number</label>
                  <input
                    type="text"
                    name="cheque_no"
                    id="cheque_no"
                    className="form-control form-control-sm"
                    value={newData.cheque_no}
                    readOnly
                  />
                </div>
              </div>
              <div className="col-sm-3">
                <div className="form-group">
                  <label htmlFor="cheque_date">Cheque Date</label>
                  <input
                    type="text"
                    name="cheque_date"
                    id="cheque_date"
                    className="form-control form-control-sm"
                    value={newData.cheque_date}
                    readOnly
                  />
                </div>
              </div>
              <div className="col-sm-3">
                <div className="form-group">
                  <label htmlFor="amount">Amount</label>
                  <input
                    type="text"
                    name="amount"
                    id="amount"
                    className="form-control form-control-sm text-right"
                    value={newData.amount}
                    readOnly
                  />
                </div>
              </div>
            </div>
            <div className="row"></div>
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
                    readOnly
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
        actionsColumn={true}
        showEditButton={false}
        showDeleteButton={false}
        showEditButton
        edit={realizing_cheque}
      />
      {/* End of list view component */}
    </div>
  );

  /* --- End of component renders --- */
};

export default ReceiveCheque;
