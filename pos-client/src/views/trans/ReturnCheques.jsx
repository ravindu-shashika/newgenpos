import React, { useState, useEffect } from 'react';
import { api, msg, cookie, print } from '../../services';
import { FormModal, ListView, SystemButton, SDD } from '../../components';
import moment from 'moment';
import { SafeFontAwesomeIcon } from '../../components';
import { faPlus, faSearch } from '@fortawesome/free-solid-svg-icons';
// import { async } from 'exceljs/dist/exceljs';

const moduleName = 'Return Cheques';
const PendingRealizeCheques = () => {
  const [pendingRelizedChequeList, setPendingRelizedChequeList] = useState([]);

  const [returnedChequeList, setReturnedChequeList] = useState([]);

  const [selectedList, setSelectedList] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showRealizingModal, setShowRealizingModal] = useState(false);

  const [isEdit, setIsEdit] = useState(false);
  const [isReturnLoad, setIsReturnLoad] = useState(false);
  const [isReturn, setIsReturn] = useState(false);
  const [branchesList, setBranchesList] = useState([]);
  const [realizedDate, setrealizedDate] = useState('');
  const [buttonText, setButtonText] = useState('Save');
  const [batchNo, setBatchNo] = useState(0);

  const [dissableButton, setDissableButton] = useState(true);

  const [showListModal, setShowListModal] = useState(false);
  const [newRecord, setNewRecord] = useState({
    branch_id: cookie.get('user_branch'),
    branch: '',
    issue_account_id: '',
    return_date: '',
    return_branch_id: '',
    return_branch: '',
  });
  const [realizingCheque_id, setRealizingCheque_id] = useState(0);
  const [fundTransTypesList, setFundTransTypesList] = useState([
    {
      id: '',
      description: '',
      account_id: '',
      t_type: '',
      is_cheque_trans: '',
    },
  ]);

  const [editChequeDetails, setEditChequeDetails] = useState({
    id: '',
    branch_id: cookie.get('user_branch'),
    return_date: moment().format('YYYY-MM-DD'),
    bank_id: '',
    bank: '',
    bank_branch_id: '',
    bank_branch: '',
    account: '',
    cheque_no: '',
    status: 'R',
    amount: (0).toFixed(2),
    cheque_date: moment().format('YYYY-MM-DD'),
    received_account_id: '',
    bank_deposit_acc: '',
    user_id: cookie.get('user_id'),
    issue_branch_id: '',
    trans_id: '',
    operation: '',
    return_branch: '',
    return_branch_id: '',
    issue_account_id: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedList.length > 0) {
      setDissableButton(false);
    } else {
      setDissableButton(true);
    }
  }, [selectedList]);

  const toggleRealizingFormModal = () => {
    setShowRealizingModal(!showRealizingModal);
    setIsReturn(false);
  };

  const fetchData = async () => {
    //  * transaction date
    const trans_date = await api.get(`trans_date/${cookie.get('user_branch')}`);
    const batch_number = await api.get(
      `load-received-cheques/${cookie.get('user_branch')}`,
    );

    setNewRecord({
      ...newRecord,
      branch_id: cookie.get('user_branch'),
      branch: cookie.get('user_branch_name'),
      issue_account_id: '',
      return_date: trans_date.data,
      return_branch_id: '',
      return_branch: '',
    });

    setBatchNo(batch_number.data.batch_no);
    setrealizedDate(trans_date.data);
    setBranchesList(batch_number.data.branches);
    setFundTransTypesList(batch_number.data.chqTransTypes);
    setPendingRelizedChequeList(batch_number.data.data);
  };

  // const handleValaueChange = async (e) => {
  //   let input_name = e.target.name;
  //   let input_value = e.target.value;
  //   setNewRecord({
  //     ...newRecord,
  //     [input_name]: input_value,
  //   });
  // };

  // const loadPendingRealizedCheques = async () => {
  //   // * get search Results
  //   let cheque_number =
  //     newRecord.cheque_number != '' ? newRecord.cheque_number : 'No';
  //   let search_date =
  //     newRecord.search_date != '' ? newRecord.search_date : 'No';
  //   const pending_realized_cheque = await api.get(
  //     `load-pending-realized-cheques/${cookie.get(
  //       'user_branch',
  //     )}/${cheque_number}/${search_date}`,
  //   );
  //   console.log(pending_realized_cheque);
  //   if (
  //     pending_realized_cheque.status == 200 &&
  //     pending_realized_cheque.data.status == 200
  //   ) {
  //     setPendingRelizedChequeList(pending_realized_cheque.data.data);
  //     setBranchesList(pending_realized_cheque.data.branches);
  //     setFundTransTypesList(pending_realized_cheque.data.chqTransTypes);
  //   } else if (
  //     pending_realized_cheque.status == 200 &&
  //     pending_realized_cheque.data.status == 500
  //   ) {
  //     msg.error(pending_realized_cheque.data.error);
  //   } else if (
  //     pending_realized_cheque.status == 200 &&
  //     pending_realized_cheque.data.status == 400
  //   ) {
  //     msg.warning(pending_realized_cheque.data.message);
  //   } else {
  //     msg.error('Something went wrong');
  //   }
  // };

  const toggleSelectedList = async (id) => {
    if (selectedList.includes(id)) {
      setSelectedList((current) =>
        current.filter((value) => {
          return value !== id;
        }),
      );
    } else {
      setSelectedList((current) => [...current, id]);
    }
  };

  const saveEdit = async () => {
    // console.log(selectedList);
    if (newRecord.return_branch_id != '') {
      if (newRecord.issue_account_id != '') {
        // const response = await api
        //   .post('return-cheque')
        //   .values(editChequeDetails);
        const response = await api.post(`save-return-cheques`).values({
          selected_cheques: selectedList,
          record_details: newRecord,
          batch_no: batchNo,
        });
        if (response.status == 200 && response.data.status == 200) {
          msg.success('Successfully Returend Cheque');
          toggleRealizingFormModal();
          resetAll();
          fetchData();
        } else {
          msg.error('Fail to Return Cheque !!');
        }
      } else {
        msg.error('Please Select Issue Account !!');
      }
    } else {
      msg.error('Please Enter Return Branch !!');
    }
  };

  // const toggleFormModal = () => {
  //   setShowFormModal(!showListModal);
  // };

  // const Return = (chqId) => {
  //   setIsReturn(true);
  //   setRealizingCheque_id(chqId.id);
  //   console.log('checkno' + chqId);
  //   pendingRelizedChequeList.map((cheque) => {
  //     if (parseInt(cheque.id) === parseInt(chqId)) {
  //       let issue_branch = branchesList
  //         .map((branch) => {
  //           if (branch.id == cheque.issue_branch_id) {
  //             return branch.code + ' - ' + branch.name;
  //           }
  //         })
  //         .join('');

  //       setEditChequeDetails({
  //         ...editChequeDetails,
  //         id: cheque.id,
  //         branch_id: cookie.get('user_branch'),
  //         branch: cookie.get('user_branch_name'),
  //         return_date: moment().format('YYYY-MM-DD'),
  //         bank_id: cheque.bank_id,
  //         bank_branch_id: cheque.bank_branch_id,
  //         account: cheque.account,
  //         cheque_no: cheque.cheque_no,
  //         status: 'R',
  //         amount: cheque.amount,
  //         cheque_date: cheque.cheque_date,
  //         received_account_id: cheque.received_account_id,
  //         // bank_deposit_acc: cheque.bank_deposit_acc,
  //         bank_deposit_acc: cheque.account,
  //         user_id: cookie.get('user_id'),
  //         trans_id: cheque.trans_id,
  //         bank_account: cheque.account,
  //         bank: cheque.bank.des,
  //         bank_branch: cheque.bank_branch.des,
  //       });
  //     }
  //   });
  //   toggleRealizingFormModal();
  // };
  const handleDataChange = (e) => {
    const newData = e.target.value; // Get the new value from the input element
    setNewRecord({ newRecord, ...newRecord, return_date: newData });
  };

  const handleValueChange = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue = targetInput.value;

    setBatchNo(inputValue);
  };

  const selectReturnToBranch = (branch) => {
    console.log(branch);
    // setEditChequeDetails({
    //   ...editChequeDetails,
    //   return_branch: branch.name,
    //   return_branch_id: branch.id,
    // });
    setNewRecord({
      ...newRecord,
      return_branch: branch.name,
      return_branch_id: branch.id,
    });
  };

  const searchBatch = async (batch_number) => {
    const response = await api.get(
      `show-returncheque-by-batch/${batch_number}/${cookie.get('user_branch')}`,
    );
    console.log(response);

    setBatchNo(response.data.batch_no);
    setBranchesList(response.data.branches);
    setFundTransTypesList(response.data.chqTransTypes);
    setReturnedChequeList(response.data.data);
    setIsReturnLoad(true);
  };

  const handleIssueAccountChange = (e) => {
    let value = e.target.value;
    // setEditChequeDetails({
    //   ...editChequeDetails,
    //   issue_account_id: value,
    // });
    setNewRecord({
      ...newRecord,
      issue_account_id: value,
    });
  };

  const resetAll = async () => {
    setNewRecord({
      ...newRecord,
      branch_id: cookie.get('user_branch'),
      branch: cookie.get('user_branch_name'),
      issue_account_id: '',
      return_date: '',
      return_branch_id: '',
      return_branch: '',
    });
    setPendingRelizedChequeList([]);
    setSelectedList([]);
    setBranchesList([]);
    setFundTransTypesList([
      {
        id: '',
        description: '',
        account_id: '',
        t_type: '',
        is_cheque_trans: '',
      },
    ]);
    setShowFormModal(false);
    setBatchNo(0);
    setReturnedChequeList([]);
    setIsReturnLoad(false);
    // setIsReturn(false);
    fetchData();
  };

  return (
    <div>
      <h5 className="text-center mt-2"> Return Cheques</h5>

      <div className="row justify-content-end">
        <div className="col-sm-3">
          <div className="row form-group">
            <label htmlFor="batch_no" className="col-sm-6">
              Batch No.
            </label>
            <div className="col-sm-6 pr-0 pl-20">
              <input
                type="text"
                id="batch_no"
                name="batch_no"
                className="form-control-sm form-control text-right"
                // disabled={isEdit ? true : false}
                value={batchNo}
                onChange={handleValueChange}
                onFocus={(e) => e.target.select()}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    searchBatch(e.target.value);
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="row ">
        <div className="">
          <div className="form-group row">
            <label htmlFor="search_branch" className="col-form-label">
              Date
            </label>
            <div className="col-9">
              <input
                id="return_date"
                className="form-control form-control-sm"
                type="date"
                value={newRecord.return_date}
                // value={realizedDate}
                //onChange={(e) => setrealizedDate(e.target.value)}
                onChange={handleDataChange}
              />
            </div>
          </div>
        </div>
        <div className="">
          <div className="form-group row ">
            <label for="return_branch" class="col-form-label">
              Cheque Return from {cookie.get('user_branch_name')} to{' '}
            </label>
            <div className="col-sm-5">
              <SDD
                method={selectReturnToBranch}
                data={branchesList}
                value="name"
                rowId="branch_id"
                classes="form-control form-control-sm"
                placeholder="-- Select a Branch"
                listId="branch"
                selected={newRecord.return_branch}
              />
            </div>
          </div>
        </div>
        <div className="col">
          <div className="form-group row">
            <label htmlFor="issue_account" className=" col-form-label">
              Issue Account
            </label>
            <div className="col-sm-8">
              {/* <div className="d-flex justify-content-center"></div> */}
              <select
                type="text"
                name="issue_account_id"
                id="issue_account_id"
                className="form-control form-control-sm "
                value={newRecord.issue_account_id}
                onChange={handleIssueAccountChange}
                // value={newRecord.issue_account_id}
                // onChange={handleValaueChange}
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
        </div>
      </div>

      {isReturnLoad ? (
        <div className="row">
          {returnedChequeList.length > 0 ? (
            <table className="table table-hover table-sm">
              <thead className="thead-dark">
                <tr>
                  {/* <th scope="col"></th> */}
                  <th scope="col">Cheque No</th>
                  <th scope="col">Cheque Date</th>
                  <th scope="col">Amount</th>
                  <th scope="col">Account No</th>
                  <th scope="col">Bank Name</th>
                  <th scope="col">Branch Name</th>
                  <th scope="col">Returned Date</th>
                  <th scope="col">Returned To</th>
                </tr>
              </thead>
              <tbody>
                {returnedChequeList.map((cheque) => {
                  return (
                    <tr>
                      {/* <th>
                        <div className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id="exampleCheck1"
                            name="selected_list"
                            checked={
                              selectedList.includes(cheque.id) ? true : false
                            }
                            onChange={() => toggleSelectedList(cheque.id)}
                          />
                        </div>
                      </th> */}

                      <td>{cheque.cheque_no}</td>
                      <td>{cheque.cheque_date}</td>
                      <td>{cheque.amount}</td>
                      <td>{cheque.received_account.account_number}</td>
                      <td>{cheque.bank.des}</td>
                      <td>{cheque.bank_branch.des}</td>
                      <td>{moment(cheque.tdate).format(`YYYY-MM-DD HH:mm`)}</td>
                      <td>{cheque.issue_branch.name}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            ''
          )}
        </div>
      ) : (
        <div className="row">
          {pendingRelizedChequeList.length > 0 ? (
            <table className="table table-hover table-sm">
              <thead className="thead-dark">
                <tr>
                  <th scope="col"></th>
                  <th scope="col">Cheque No</th>
                  <th scope="col">Cheque Date</th>
                  <th scope="col">Amount</th>
                  <th scope="col">Account No</th>
                  <th scope="col">Bank Name</th>
                  <th scope="col">Branch Name</th>
                  <th scope="col">Received Date</th>
                </tr>
              </thead>
              <tbody>
                {pendingRelizedChequeList.map((cheque) => {
                  return (
                    <tr>
                      <th>
                        <div className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id="exampleCheck1"
                            name="selected_list"
                            checked={
                              selectedList.includes(cheque.id) ? true : false
                            }
                            onChange={() => toggleSelectedList(cheque.id)}
                          />
                        </div>
                      </th>

                      <td>{cheque.cheque_no}</td>
                      <td>{cheque.cheque_date}</td>
                      <td>{cheque.amount}</td>
                      <td>{cheque.received_account.account_number}</td>
                      <td>{cheque.bank.des}</td>
                      <td>{cheque.bank_branch.des}</td>
                      <td>
                        {moment(cheque.created_at).format(`YYYY-MM-DD HH:mm`)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="col-sm-12">
              <div className="alert alert-info">
                <h6>No cheques found!</h6>
              </div>
            </div>
          )}
        </div>
      )}

      {isReturnLoad == false ? (
        <div className="row justify-content-end p-2">
          <div className="pr-2">
            <button
              className="btn btn-sm btn-light"
              type="button"
              onClick={resetAll}
            >
              Reset
            </button>
          </div>
          <div>
            <button
              className="btn btn-sm btn-success"
              type="button"
              onClick={saveEdit}
              disabled={dissableButton}
            >
              {buttonText}
            </button>
          </div>
        </div>
      ) : (
        <div className="row justify-content-end p-2">
          <div className="pr-2">
            <button
              className="btn btn-sm btn-light"
              type="button"
              onClick={resetAll}
            >
              Reset
            </button>
          </div>
        </div>
      )}
      {/* <FormModal
        moduleName={moduleName}
        modalState={showRealizingModal}
        toggleFormModal={toggleRealizingFormModal}
      >
        <div className="modal-body">
          <div className="row border-top">
            <div class="form-group row m-2">
              <label for="realized_date" class="col-sm-2 col-form-label">
                Date
              </label>
              <div class="col-sm-10">
                <input
                  id="realized_date"
                  className="form-control form-control-sm"
                  type="date"
                  value={realizedDate}
                  onChange={(e) => setrealizedDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="row border-top">
            <div className="col mt-2">
              <div className="row justify-content-between">
                <div className="col-auto">
                  <div className="row">
                    <div className="col-sm-auto">
                      <h5 className="mt-1 mb-1">
                        Cheque Return from {cookie.get('user_branch_name')} to{' '}
                      </h5>
                    </div>
                    <div className="col-sm-3 pl-0">
                      <SDD
                        method={selectReturnToBranch}
                        data={branchesList}
                        value="name"
                        rowId="branch_id"
                        classes="form-control form-control-sm"
                        placeholder="-- Select a Branch"
                        listId="branch"
                        selected={editChequeDetails.branch_name}
                      />
                    </div>
                  </div>
                </div>
                <div className="col">
                  <div className="row justify-content-end">
                    <div class="form-group row mb-0">
                      <label
                        for="realized_date"
                        class="col-sm-2 col-form-label"
                      >
                        Date
                      </label>
                      <div class="col-sm-10">
                        <input
                          id="realized_date"
                          className="form-control form-control-sm"
                          type="date"
                          value={editChequeDetails.return_date}
                          onChange={(e) =>
                            setEditChequeDetails({
                              ...editChequeDetails,
                              return_date: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col pr-0">
                  <div className="row justify-content-end">
                    <label htmlFor="" className="col-sm-auto mt-1 mb-1">
                      Issue Account
                    </label>
                    <select
                      type="text"
                      name="issue_account_id"
                      id="issue_account_id"
                      className="form-control form-control-sm col-sm-6"
                      value={editChequeDetails.issue_account_id}
                      onChange={handleIssueAccountChange}
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
              </div>
              <table class="table table-sm mt-2">
                <tr>
                  <th scope="col">Cheque No</th>
                  <td scope="col">{editChequeDetails.cheque_no}</td>
                  <th scope="col">Amount</th>
                  <td scope="col">{editChequeDetails.amount}</td>
                </tr>
                <tr>
                  <th scope="col">Cheque Date</th>
                  <td scope="col">{editChequeDetails.cheque_date}</td>
                  <th scope="col">Bank Account</th>
                  <td scope="col">{editChequeDetails.bank_account}</td>
                </tr>
                <tr>
                  <th scope="col">Bank</th>
                  <td scope="col">{editChequeDetails.bank}</td>
                  <th scope="col">Bank Branch</th>
                  <td scope="col">{editChequeDetails.bank_branch}</td>
                </tr>
              </table>
            </div>
          </div>

          <div className="row justify-content-end">
            <button className="btn btn-success" onClick={saveEdit}>
              <h6 className="text-white mb-0">Save</h6>
            </button>
          </div>
        </div>
      </FormModal> */}
    </div>
  );

  /* --- End of component renders --- */
};

export default PendingRealizeCheques;
