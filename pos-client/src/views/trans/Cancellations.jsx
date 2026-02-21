import React, { useState, useEffect } from 'react';
import { api, msg, cookie } from '../../services';
import moment from 'moment';
import { SystemButton, FormModal } from '../../components';

const Cancellations = () => {
  // Module name
  const moduleName = 'Cancellations';

  /* --- State declarationss --- */

  const [allBranchesBillTypes, setAllBranchesBillTypes] = useState([]);

  const [transactions, setTransactions] = useState([
    {
      pawningTrans: [],
      partPaymentTrans: [],
      redeemTrans: [],
    },
  ]);

  const [newData, setNewData] = useState({
    amount: '',
    bill_extended_period: '',
    ddate: '',
    id: '',
    loan_id: '',
    prev_ref_no: '',
    ref_no: '',
    trans_type_id: '',
    trans_group_id: '',
    reason: '',
    user_id: cookie.get('user_id'),
  });

  const [billTypes, setBillTypes] = useState([]);

  const [pawningData, setPawningData] = useState({
    bill_type: '',
    ddate: '',
    final_date: '',
    gold_value: '',
    loan_capital: '',
    customer: {
      nic: '',
      id: '',
      name: '',
      address_1: '',
      address_2: '',
      telephone: '',
      notes: '',
      is_blacklisted: false,
    },
    items: [],
    branch_id: '',
    bill_type_id: '',
    bill_no: '',
  });

  // Data loading status
  const [isLoading, setIsLoading] = useState(false);

  const [isBillTypeLoading, setIsBillTypeLoading] = useState(false);

  // Modal status
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  /* --- End of state declarations --- */

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (showConfirmationModal === false) {
      resetForm();
    }
  }, [showConfirmationModal]);

  /* --- Component functions --- */

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const response = await api.get(`cancellations`);

      console.log(response.data);

      setAllBranchesBillTypes(response.data);
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

    if (inputName === 'search_branch') {
      setIsBillTypeLoading(true);
      setPawningData({
        ...pawningData,
        branch_id: inputValue,
      });
      setBillTypes(
        allBranchesBillTypes.filter(
          (branch) => parseInt(branch.id) === parseInt(inputValue),
        )[0].bill_types,
      );
      setIsBillTypeLoading(false);
    }

    if (inputName === 'search_bill_type') {
      setPawningData({
        ...pawningData,
        bill_type_id: inputValue,
      });
    }

    if (inputName === 'search_bill_no') {
      setPawningData({
        ...pawningData,
        bill_no: inputValue,
      });
    }

    if (inputName === 'reason') {
      setNewData({
        ...newData,
        reason: inputValue,
      });
    }
  };

  // Search and fetch all data of pawning
  const fetchLoanData = async (e) => {
    e.preventDefault();

    const response = await api
      .post(`cancellations/fetch-pawning-bills`)
      .values({
        branch_id: pawningData.branch_id,
        bill_type_id: pawningData.bill_type_id,
        bill_no: pawningData.bill_no,
      });

    console.log(response.data);
    let pawnings = response.data[0].loan_trans.filter(
      (trans) => trans.trans_type.trans_group.trans_group_code === 'P',
    );

    let redemptions = response.data[0].loan_trans.filter(
      (trans) => trans.trans_type.trans_group.trans_group_code === 'R',
    );

    let partPayments = response.data[0].loan_trans.filter(
      (trans) => trans.trans_type.trans_group.trans_group_code === 'PP',
    );

    setTransactions([
      {
        pawningTrans: pawnings,
        redeemTrans: redemptions,
        partPaymentTrans: partPayments,
      },
    ]);

    setPawningData({
      ...pawningData,
      customer: response.data[0].customer,
      items: response.data[0].loan_item,
      bill_type: response.data[0].bill_type.des,
      ddate: response.data[0].ddate,
      final_date: response.data[0].final_date,
      gold_value: response.data[0].gold_value,
      loan_capital: response.data[0].loan_capital,
    });
  };

  const cancelConfirmation = (dataObj) => {
    console.log(dataObj);
    toggleConfirmationModal();

    setNewData({
      ...newData,
      amount: dataObj.amount,
      bill_extended_period: dataObj.bill_extended_period,
      ddate: dataObj.ddate,
      id: dataObj.id,
      loan_id: dataObj.loan_id,
      prev_ref_no: dataObj.prev_ref_no,
      ref_no: dataObj.ref_no,
      trans_type_id: dataObj.trans_type_id,
      trans_group_id: dataObj.trans_type.trans_group_id,
    });
  };

  const toggleConfirmationModal = () => {
    setShowConfirmationModal(!showConfirmationModal);
  };

  const handleSubmit = async () => {
    await save();

    // resetAll();

    // fetchData();

    resetForm();
  };

  const save = async () => {
    try {
      const response = await api
        .post(`cancellations/cancel-transaction`)
        .values(newData);

      msg.success(response.data);
    } catch (error) {
      msg.error(error);
      return console.log(error);
    } finally {
      setShowConfirmationModal(false);
    }
  };

  const resetAll = () => {
    setAllBranchesBillTypes([]);

    setTransactions([
      {
        pawningTrans: [],
        partPaymentTrans: [],
        redeemTrans: [],
      },
    ]);

    setPawningData({
      loan_id: '',
      customer: [],
      items: [],
      branch_id: '',
      bill_type_id: '',
      bill_no: '',
    });

    setIsLoading(false);
  };

  const resetForm = () => {
    setNewData({
      amount: '',
      bill_extended_period: '',
      ddate: '',
      id: '',
      loan_id: '',
      prev_ref_no: '',
      ref_no: '',
      trans_type_id: '',
      trans_group_id: '',
      reason: '',
      user_id: cookie.get('user_id'),
    });

    setPawningData({
      loan_id: '',
      customer: [],
      items: [],
      branch_id: '',
      bill_type_id: '',
      bill_no: '',
    });

    setTransactions([
      {
        pawningTrans: [],
        partPaymentTrans: [],
        redeemTrans: [],
      },
    ]);
  };
  /* --- End of component functions --- */

  /* --- Component renders --- */

  return (
    <div>
      <h3 className="text-center">{moduleName}</h3>
      <br />
      {isLoading ? (
        <div>
          <br />
          <br />
          <div className="d-flex justify-content-center">
            <div className="spinner-border text-primary" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="container">
          <form onSubmit={fetchLoanData} >
            <div className="row">
              <div className="col-sm-4">
                <div className="form-group row">
                  <label
                    htmlFor="search_branch"
                    className="col-sm-3 col-form-label"
                  >
                    Branch
                  </label>
                  <div className="col-sm-9">
                    <select
                      type="text"
                      // className="form-control form-control-sm"
                      id="search_branch"
                      name="search_branch"
                      placeholder="Type"
                      value={pawningData.branch_id}
                      onChange={handleValueChange}
                    >
                      <option
                        value=""
                        // className="dropdown-item text-muted text-light"
                        disabled
                      >
                        -- Select a branch
                      </option>
                      {allBranchesBillTypes.map((branch) => {
                        return (
                          <option
                            className="dropdown-item"
                            key={branch.id}
                            value={branch.id}
                          >
                            {branch.name} - {branch.code}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>
              <div className="col-sm-6">
                <div className="form-group row">
                  <label
                    htmlFor="search_nic"
                    className="col-sm-3 col-form-label"
                  >
                    Bill Number
                  </label>
                  <div className="col-sm-8">
                    {isBillTypeLoading ? (
                      <div>
                        <div className="d-flex justify-content-center">
                          <div
                            className="spinner-border spinner-border-sm text-dark"
                            role="status"
                          ></div>
                        </div>
                      </div>
                    ) : (
                      <div className="row">
                        <select
                          type="text"
                          className="form-control form-control-sm col-sm-6"
                          id="search_bill_type"
                          name="search_bill_type"
                          placeholder="Type"
                          value={pawningData.bill_type_id}
                          onChange={handleValueChange}
                        >
                          <option
                            value=""
                            className="dropdown-item text-muted text-light"
                            disabled
                          >
                            -- Select a bill type
                          </option>
                          {billTypes.map((bill) => {
                            return (
                              <option
                                className="dropdown-item"
                                key={bill.bill_type.id}
                                value={bill.bill_type.id}
                              >
                                {bill.bill_type.des}
                              </option>
                            );
                          })}
                        </select>

                        <input
                          type="text"
                          className="form-control form-control-sm col-sm-6"
                          id="search_bill_no"
                          name="search_bill_no"
                          placeholder="Number"
                          value={pawningData.bill_no}
                          onChange={handleValueChange}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="col-sm-2">
                <SystemButton
                  type={'search'}
                  method={() => fetchLoanData()}
                  showText
                  btnText="Search.."
                />
              </div>
            </div>
          </form>
          <br />
          <div>
            <table className="table table-bordered">
              <thead className="text-center">
                <tr>
                  <th scope="col">Type</th>
                  <th scope="col">Date</th>
                  <th scope="col">Transaction</th>
                  <th scope="col">Amount (LKR)</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions[0].redeemTrans
                  ? transactions[0].redeemTrans.map((row, index) => {
                      return (
                        <tr key={row.id}>
                          {index === 0 ? (
                            <td
                              rowSpan={transactions[0].redeemTrans.length}
                              className="text-center"
                              style={{ verticalAlign: 'middle' }}
                            >
                              Redemption
                            </td>
                          ) : null}
                          {index === 0 ? (
                            <td
                              rowSpan={transactions[0].redeemTrans.length}
                              className="text-center"
                              style={{ verticalAlign: 'middle' }}
                            >
                              {row.ddate}
                            </td>
                          ) : null}
                          <td>{row.trans_type.description}</td>
                          <td className="text-right">{row.amount}</td>
                          {index === 0 ? (
                            <td
                              className="text-center"
                              rowSpan={transactions[0].redeemTrans.length}
                              style={{ verticalAlign: 'middle' }}
                            >
                              <SystemButton
                                type="cancel"
                                method={() => cancelConfirmation(row)}
                                showText
                              />
                            </td>
                          ) : null}
                        </tr>
                      );
                    })
                  : null}
                {transactions[0].partPaymentTrans
                  ? transactions[0].partPaymentTrans.map((row, index) => {
                      return (
                        <tr key={row.id}>
                          {index === 0 ? (
                            <td
                              rowSpan={transactions[0].partPaymentTrans.length}
                              className="text-center"
                              style={{ verticalAlign: 'middle' }}
                            >
                              Part-payments
                            </td>
                          ) : null}
                          <td>{row.ddate}</td>
                          <td>{row.trans_type.description}</td>
                          <td className="text-right">{row.amount}</td>
                          <td className="text-center">
                            {transactions[0].redeemTrans.length ? (
                              <p className="text-muted">
                                Cancel most recent transactions first...
                              </p>
                            ) : (
                              <SystemButton
                                type="cancel"
                                method={() => cancelConfirmation(row)}
                                showText
                              />
                            )}
                          </td>
                        </tr>
                      );
                    })
                  : null}
                {transactions[0].pawningTrans.map((row, index) => {
                  return (
                    <tr key={row.id}>
                      {index === 0 ? (
                        <td
                          rowSpan={transactions[0].pawningTrans.length}
                          className="text-center"
                          style={{ verticalAlign: 'middle' }}
                        >
                          Pawning
                        </td>
                      ) : null}
                      {index === 0 ? (
                        <td
                          rowSpan={transactions[0].pawningTrans.length}
                          className="text-center"
                          style={{ verticalAlign: 'middle' }}
                        >
                          {row.ddate}
                        </td>
                      ) : null}
                      <td>{row.trans_type.description}</td>
                      <td className="text-right">{row.amount}</td>
                      {index === 0 ? (
                        <td
                          className="text-center"
                          rowSpan={transactions[0].pawningTrans.length}
                          style={{ verticalAlign: 'middle' }}
                        >
                          {transactions[0].redeemTrans.length ? (
                            <p className="text-muted">
                              Cancel most recent transactions first...
                            </p>
                          ) : transactions[0].partPaymentTrans.length ? (
                            <p className="text-muted">
                              Cancel most recent transactions first...
                            </p>
                          ) : (
                            <SystemButton
                              type="cancel"
                              method={() => cancelConfirmation(row)}
                              showText
                            />
                          )}
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
                {/* {transactions[0].pawningTrans.map((row, index) => {
                  return (
                    //   <td>{row.ddate}</td>
                    //   <td className="text-right">{row.amount}</td>
                    //   <td className="text-center">
                    //     <SystemButton
                    //       type="cancel"
                    //       method={() => cancelConfirmation(row)}
                    //       showText
                    //     />
                    //   </td>
                    // </tr>
                  );
                })} */}
              </tbody>
            </table>
            {/* Form modal componenet */}
            <FormModal
              moduleName={moduleName}
              modalState={showConfirmationModal}
              toggleFormModal={toggleConfirmationModal}
            >
              <div className="container">
                <div className="form-group compactForm">
                  <label htmlFor="reason">Reason...</label>
                  <textarea
                    name="reason"
                    id="reason"
                    rows="3"
                    className="form-control"
                    value={newData.reason}
                    onChange={handleValueChange}
                  ></textarea>
                </div>
                <div className="modal-footer">
                  <SystemButton
                    type="close"
                    method={toggleConfirmationModal}
                    showText={true}
                  />
                  <SystemButton
                    type="cancel"
                    method={() => handleSubmit()}
                    showText
                  />
                </div>
              </div>
            </FormModal>
            {/* End of form modal componenet */}
          </div>
        </div>
      )}
    </div>
  );

  /* --- End of component renders --- */
};

export default Cancellations;
