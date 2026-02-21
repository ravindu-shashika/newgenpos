import React, { useState, useEffect } from 'react';
import { api, msg, cookie } from '../../services';
import moment from 'moment';
import { SystemButton, FormModal, SDD } from '../../components';

const Cancellations = () => {
  // Module name
  const moduleName = 'Paying Amount Change';

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
    current_paid_amount: 0,
    new_paid_amount: 0,
    redeem_id: 0,
    user_id: cookie.get('user_id'),
  });

  const [completeDelete, setCompleteDelete] = useState(false);

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
    branch_name: '',
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

      const response = await api.get(`pay-amount-change`);

      setAllBranchesBillTypes(response.data);
    } catch (error) {
      msg.error('Unable to fetch data!');

      return console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRelatedBIllTypes = async (branchId) => {
    const response = await api.get(`bill-types-by-branch/${branchId}`);

    setBillTypes(response.data);
  };

  const handleValueChange = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue = targetInput.value;

    const dataset =
      targetInput.type == 'select-one'
        ? targetInput.options[e.target.selectedIndex].dataset
        : targetInput.dataset;

    if (inputName === 'complete_delete') {
      if (targetInput.checked) {
        setCompleteDelete(true);
      } else {
        setCompleteDelete(false);
      }
    }

    if (inputName === 'search_branch') {
      setIsBillTypeLoading(true);
      setPawningData({
        ...pawningData,
        branch_id: inputValue,
      });

      fetchRelatedBIllTypes(inputValue);
      // setBillTypes(
      //   allBranchesBillTypes.filter(
      //     (branch) => parseInt(branch.id) === parseInt(inputValue),
      //   )[0].bill_types,
      // );
      setIsBillTypeLoading(false);
    }

    if (inputName === 'search_bill_type') {
      setPawningData({
        ...pawningData,
        bill_type_id: inputValue,
        bill_type: dataset.billtype,
      });
    }

    if (inputName === 'search_bill_no') {
      setPawningData({
        ...pawningData,
        bill_no: inputValue,
      });
    }
  };

  const handleValueChanges = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    let inputValue = targetInput.value;

    if (inputName === 'discount' && inputValue === '') {
      inputValue = 0;
    }

    setNewData({
      ...newData,
      [inputName]: inputValue,
    });
  };

  // Search and fetch all data of pawning
  const fetchLoanData = async (e) => {
    e.preventDefault();

    const response = await api.post(`pay-amount-paid-amount`).values({
      branch_id: pawningData.branch_id,
      bill_type_id: pawningData.bill_type_id,
      bill_type_name: pawningData.bill_type,
      bill_no: pawningData.bill_no,
    });

    console.log(response.data);

    if (response.data.status) {
      setNewData({
        ...newData,
        current_paid_amount: response.data.entities.paying_amount,
        redeem_id: response.data.entities.id,
        user_id: cookie.get('user_id'),
      });
    } else {
      msg.warning(
        'This bill dose not have any paying amount! Please try another bill',
      );
    }
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
        .post(`new-amount-paid-amount-save`).values({
            branch_id: pawningData.branch_id,
            bill_type_id: pawningData.bill_type_id,
            bill_type_name: pawningData.bill_type,
            bill_no: pawningData.bill_no,
            old_amount: newData.current_paid_amount,
            new_amount: newData.new_paid_amount,
            redeem_id: newData.redeem_id,
            user_id: cookie.get('user_id'),
          });

      msg.success(response.data);
    } catch (error) {
      msg.error(error);
      return console.log(error);
    } finally {
    //   setShowConfirmationModal(false);
    }
  };


  const resetForm = () => {
    setNewData({
      current_paid_amount: 0,
      new_paid_amount: 0,
      redeem_id: 0,
      user_id: cookie.get('user_id'),
    });

    setPawningData({
      loan_id: '',
      customer: [],
      items: [],
      branch_id: '',
      bill_type_id: '',
      bill_no: '',
      branch_id: '',
      branch_name: '',
    });
  };

  const branchSelect = (selectedObj) => {
    setPawningData({
      ...pawningData,
      branch_id: selectedObj.id,
      branch_name: selectedObj.name,
    });

    fetchRelatedBIllTypes(selectedObj.id);
    // setBillTypes(
    //   allBranchesBillTypes.filter(
    //     (branch) => parseInt(branch.id) === parseInt(inputValue),
    //   )[0].bill_types,
    // );
    setIsBillTypeLoading(false);
    // setNewData({
    //   ...newData,
    //   vendor_id: selectedObj.code,
    //   vendor_name: selectedObj.description,
    // });
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
          <form onSubmit={fetchLoanData} className="compactForm">
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
                    <SDD
                      method={branchSelect}
                      data={allBranchesBillTypes}
                      value="name"
                      rowId="id"
                      classes="form-control"
                      placeholder="-- Select a branch"
                      listId="vendors"
                      selected={pawningData.branch_name}
                    />
                    {/* <select
                      type="text"
                      className="form-control form-control-sm"
                      id="search_branch"
                      name="search_branch"
                      placeholder="Type"
                      value={pawningData.branch_id}
                      onChange={handleValueChange}
                    >
                      <option
                        value=""
                        className="dropdown-item text-muted text-light"
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
                            {branch.code} - {branch.name}
                          </option>
                        );
                      })}
                    </select> */}
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
                          className="form-control col-sm-6"
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
                          {billTypes.length
                            ? billTypes.map((bill) => {
                                return (
                                  <option
                                    className="dropdown-item"
                                    data-billtype={bill.des}
                                    key={bill.id}
                                    value={bill.id}
                                  >
                                    {bill.des}
                                  </option>
                                );
                              })
                            : null}
                        </select>

                        <input
                          type="text"
                          className="form-control  col-sm-6"
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
            {/* <div className="row">
              <div className="col-sm-10"></div>
              <div className="col-sm-2">
                <SystemButton
                  type={'reset'}
                  method={() => resetForm()}
                  showText={true}
                />
              </div>
            </div> */}
          </form>
          <br />
          <div>
            <div class="form-row">
              <div class="form-group col-md-4">
                <label for="current_paid_amount">Current Paid Amount</label>
                <input
                  type="number"
                  class="form-control"
                  id="current_paid_amount"
                  name="current_paid_amount"
                  value={newData.current_paid_amount}
                  placeholder="Current Paid Amount"
                  readOnly
                />
              </div>
              <div class="form-group col-md-4">
                <label for="new_paid_amount">New Paid Amount</label>
                <input
                  type="number"
                  class="form-control"
                  id="new_paid_amount"
                  name="new_paid_amount"
                  value={newData.new_paid_amount}
                  onChange={handleValueChanges}
                  placeholder="New Paid Amount"
                />
              </div>
            </div>
          </div>

          <div>
            <hr className="border-white" />
            <div className="row">
            <div className="col-sm-8"></div>
              <div className="col-sm-2">
                <SystemButton
                  type={'reset'}
                  method={() => resetForm()}
                  showText={true}
                />
              </div>
              <div className="col-sm-2">
                <SystemButton
                  type="no-form-save"
                  showText
                  btnText={'Save'}
                  method={handleSubmit}
                />
              </div>
            </div>
            {/* <div className="row">
              <div className="col-sm-10"></div>
              <div className="col-sm-2">
                <SystemButton
                  type={'reset'}
                  method={() => resetForm()}
                  showText={true}
                />
              </div>
            </div> */}
          </div>
        </div>
      )}
    </div>
  );

  /* --- End of component renders --- */
};

export default Cancellations;
