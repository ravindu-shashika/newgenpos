import React, { useState, useEffect } from 'react';
import { api, msg, cookie } from '../../services';
import moment from 'moment';
import { SystemButton, FormModal, SDD } from '../../components';
import { event } from 'jquery';

const Cancellations = () => {
  // Module name
  const moduleName = 'Cancellations';

  /* --- State declarationss --- */

  let rowcount = 0;

  const [allBranchesBillTypes, setAllBranchesBillTypes] = useState([]);

  const [isCancelBill, setIsCancelBill] = useState(false);

  const [transactions, setTransactions] = useState([
    {
      pawningTrans: [],
      partPaymentTrans: [],
      redeemTrans: [],
      partPaymentsIntrest: [],
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
    complete_delete: false,
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
    branch_code: '',
    bill_type_id: '',
    bill_no: '',
    loan_amount: '',
    total_weight: '',
    customer_nic: '',
    customer_name: '',
    status: '',
    items: '',
    condition: '',
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

  useEffect(
    (e) => {
      if (showConfirmationModal === false) {
        // const bill_type = pawningData;
        resetForm();
        // if (pawningData != null) {
        //   setPawningData({
        //     ...pawningData,
        //     branch_id: bill_type.branch_id,
        //     bill_type_id: bill_type.bill_type_id,
        //     bill_type_name: bill_type.bill_type,
        //     bill_no: bill_type.bill_no,
        //   });
        //   const event = new Event('submit');
        //   fetchLoanData(event);
        //   console.log(event);
        // }
      }
    },
    [showConfirmationModal],
  );

  /* --- Component functions --- */

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const response = await api.get(`cancellations`);

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
        bill_type_name: pawningData.bill_type,
        bill_no: pawningData.bill_no,
      });

    // console.log(response.data);

    if (!response.data.length) {
      msg.error('Unable to find the bill number');
      return;
    } else {
      // let pawnings = response.data[0].loan_trans.filter(
      //   // (trans) => trans.trans_type.trans_group.trans_group_code === 'P',
      //   (trans) => trans.trans_type.trans_group.trans_group_code === 'P',
      // );

      // let redemptions = response.data[0].loan_trans.filter(
      //   (trans) => trans.trans_type.trans_group.trans_group_code === 'R',
      // );

      // let cancelredemptions = response.data[0].cancelredeems.filter(
      //   (value) => value.code == 'R',
      // );

      // let cancelPartPayments = response.data[0].cancelredeems.filter(
      //   (trans) => trans.code == 'PP',
      // );
      // let cancelPartPaymentsNew = response.data[0].cancelpartpayment.filter(
      //   (trans) => trans.trans_type.id == 8,
      // );

      // let partPayments = response.data[0].loan_trans.filter(
      //   //  (trans) => trans.trans_type.trans_group.trans_group_code === 'PP',
      //   (trans) => trans.trans_type.id == 8,
      // );

      // let partPaymentsIntrest = response.data[0].loan_trans.filter(
      //   (trans) => trans.trans_type.id == 7,
      // );

      setTransactions([
        {
          transdata: response.data[0].transactions,
          // redeemTrans: redemptions,
          // partPaymentTrans: partPayments,
          // cancelRedeems: cancelredemptions,
          // cancelPartpayments: cancelPartPayments.concat(cancelPartPaymentsNew),
          // partPaymentsIntrest: partPaymentsIntrest,
        },
      ]);

      console.log(transactions);
      // let items = '';
      // response.data[0].loan_item
      //   .map((item) => {
      //     items += `${item.item.name}(${item.qty})-${item.condition.description}-${item.gold_rate.gold_types.display_name}-${item.gold_weight} /`;
      //   })
      //   .join('');

      setPawningData({
        ...pawningData,
        customer: response.data[0].customer,
        items: response.data[0].loan_item,
        // items: response.data[0].loan_item,
        bill_type: response.data[0].bill_type.des,
        ddate: response.data[0].ddate,
        final_date: response.data[0].final_date,
        gold_value: response.data[0].gold_value,
        loan_capital: response.data[0].loan_capital,
        loan_amount: response.data[0].required_amount,
        total_weight: response.data[0].total_weight,
        customer_nic: response.data[0].customer.nic,
        customer_name: response.data[0].customer.name,
        status: response.data[0].status,
        //    condition: response.data[0].loan_item.condition.description,
      });
      response.data[0].status == 'C'
        ? setIsCancelBill(true)
        : setIsCancelBill(false);
    }
  };

  const cancelConfirmation = (dataObj) => {
    console.log(dataObj);
    toggleConfirmationModal();

    // setNewData({
    //   ...newData,
    //   amount: dataObj.amount,
    //   bill_extended_period: dataObj.bill_extended_period,
    //   ddate: dataObj.ddate,
    //   id: dataObj.id,
    //   loan_id: dataObj.loan_id,
    //   prev_ref_no: dataObj.prev_ref_no,
    //   ref_no: dataObj.ref_no,
    //   trans_type_id: dataObj.trans_type_id,
    //   complete_delete: completeDelete,
    //   trans_group_id: dataObj.trans_type.trans_group_id,
    // });

    //newdata arrays
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
      complete_delete: completeDelete,
      trans_group_id: dataObj.trans_group_id,
    });
  };

  const toggleConfirmationModal = () => {
    setShowConfirmationModal(!showConfirmationModal);
  };

  const handleSubmit = async () => {
    await save();

    // resetAll();

    // fetchData();

    // resetForm();
  };

  const save = async () => {
    try {
      const bill_type = pawningData;
      const response = await api
        .post(`cancellations/cancel-transaction`)
        .values(newData);

      setPawningData({
        ...pawningData,
        branch_id: bill_type.branch_id,
        bill_type_id: bill_type.bill_type_id,
        bill_type_name: bill_type.bill_type,
        bill_no: bill_type.bill_no,
      });
      const event = new Event('submit');
      fetchLoanData(event);
      msg.success(response.data);
      // fetchLoanData();
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
      complete_delete: false,
      user_id: cookie.get('user_id'),
    });
    setIsCancelBill(false);
    setPawningData({
      loan_id: '',
      customer: [],
      items: [],
      branch_id: '',
      bill_type_id: '',
      bill_no: '',
      branch_id: '',
      branch_name: '',
      loan_amount: '',
      total_weight: '',
      customer_nic: '',
      customer_name: '',
      status: '',
    });

    setTransactions([
      {
        pawningTrans: [],
        partPaymentTrans: [],
        redeemTrans: [],
      },
    ]);
  };

  const branchSelect = (selectedObj) => {
    setPawningData({
      ...pawningData,
      branch_id: selectedObj.id,
      branch_code: selectedObj.code,
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
            <div className="row">
              <div className="col-sm-10"></div>
              <div className="col-sm-2">
                <SystemButton
                  type={'reset'}
                  method={() => resetForm()}
                  showText={true}
                />
              </div>
            </div>
            <div className="row">
              <div className="col-sm-4">
                <div className="form-group row">
                  <label
                    htmlFor="search_branch"
                    className="col-form-label col-4"
                  >
                    Loan Date :
                  </label>
                  <input
                    type="text"
                    className="form-control  col-sm-6"
                    id="read_ddate"
                    name="read_ddate"
                    placeholder="Number"
                    value={pawningData.ddate}
                  />
                </div>
              </div>
              <div className="col-sm-4">
                <div className="form-group row">
                  <label
                    htmlFor="search_branch"
                    className="col-form-label col-4"
                  >
                    Final Date :
                  </label>
                  <input
                    type="text"
                    className="form-control  col-sm-6"
                    id="read_final_date"
                    name="read_final_date"
                    placeholder="Number"
                    value={pawningData.final_date}
                  />
                </div>
              </div>
              <div className="col-sm-4">
                <div className="form-group row">
                  <label
                    htmlFor="search_branch"
                    className="col-form-label col-6"
                  >
                    Loan Amount :
                  </label>
                  <input
                    type="text"
                    className="form-control  col-sm-6"
                    id="read_load_amount"
                    name="read_load_amount"
                    placeholder="Number"
                    value={pawningData.loan_amount}
                  />
                </div>
              </div>
              <div className="col-sm-4">
                <div className="form-group row">
                  <label
                    htmlFor="search_branch"
                    className="col-form-label col-4"
                  >
                    Customer Id :
                  </label>
                  <input
                    type="text"
                    className="form-control  col-sm-6"
                    id="read_customer_nic"
                    name="read_customer_nic"
                    placeholder="Number"
                    value={pawningData.customer_nic}
                  />
                </div>
              </div>
              <div className="col-sm-8">
                <div className="form-group row">
                  <label
                    htmlFor="search_branch"
                    className="col-form-label col-2"
                  >
                    Cust Name :
                  </label>
                  <input
                    type="text"
                    className="form-control  col-sm-10"
                    id="customer_name"
                    name="customer_name"
                    placeholder="Number"
                    value={pawningData.customer_name}
                  />
                </div>
              </div>
              {/* <div className="col-sm-4">
                <div className="form-group row">
                  <label
                    htmlFor="search_branch"
                    className="col-form-label col-6"
                  >
                    Weight :
                  </label>
                  <input
                    type="text"
                    className="form-control  col-sm-6"
                    id="read_weight"
                    name="read_weight"
                    placeholder="Number"
                    value={pawningData.total_weight}
                  />
                </div>
              </div> */}
              <div className="col-sm-12">
                <div className="col-12 form-group row">
                  <table className="table table-sm table-bordered">
                    <thead className="text-center">
                      <tr>
                        <th scope="col" className="text-center">
                          Item
                        </th>
                        <th scope="col" className="text-center">
                          Type
                        </th>
                        <th scope="col" className="text-right">
                          Gold Weight
                        </th>
                        <th scope="col" className="text-right">
                          Gold Value
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pawningData.items.length
                        ? pawningData.items.map((item) => {
                            return (
                              <tr>
                                <td>
                                  {item.item.name}({item.qty})-
                                  {item.condition.description}{' '}
                                </td>
                                <td>{item.gold_rate.gold_types.category}</td>
                                <td className="text-right">
                                  {item.gold_weight}
                                </td>
                                <td className="text-right">
                                  {item.gold_value}
                                </td>
                              </tr>
                            );
                          })
                        : null}
                    </tbody>
                    <tfoot>
                      <td colSpan={2} className="text-center">
                        Total
                      </td>
                      <td className="text-right">
                        {parseFloat(pawningData.total_weight).toFixed(2)}
                      </td>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </form>
          <br />
          <div>
            <table className="table table-bordered form-control-sm">
              <thead className="text-center">
                <tr>
                  <th scope="col">Type</th>
                  <th scope="col">Transaction Date</th>
                  <th scope="col">Cancelled Date</th>
                  <th scope="col">Transaction</th>
                  <th scope="col">Amount (LKR)</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions[0].transdata
                  ? (() => {
                      const countByType = {};
                      const rows = [];

                      const sortedDataDescending = transactions[0].transdata
                        .slice()
                        .sort((a, b) => {
                          if (a.ddate < b.ddate) return 1;
                          if (a.ddate > b.ddate) return -1;
                          return 0;
                        });

                      const sortedTransdata = sortedDataDescending.sort(
                        (a, b) => {
                          // Sort rows where type is "PAWNING" to appear first
                          if (a.type === 'PAWNING' && b.type !== 'PAWNING') {
                            return 1;
                          }
                          if (a.type !== 'PAWNING' && b.type === 'PAWNING') {
                            return -1;
                          }
                          return 0;
                        },
                      );

                      // const sortedTransdata = transactions[0].transdata.sort(
                      //   (a, b) => {
                      //     // Sort rows where type is "PAWNING" to appear first
                      //     if (a.type === 'PAWNING' && b.type !== 'PAWNING') {
                      //       return 1;
                      //     }
                      //     if (a.type !== 'PAWNING' && b.type === 'PAWNING') {
                      //       return -1;
                      //     }
                      //     return 0;
                      //   },
                      // );

                      sortedTransdata.forEach((row) => {
                        const { type, ref_no } = row;
                        countByType[(type, ref_no)] =
                          (countByType[type] || 0) + 1;
                      });

                      sortedTransdata.forEach((row, index) => {
                        const { type, ddate, description, amount, status } =
                          row;
                        const isFirstRowOfType =
                          index === 0 ||
                          row.type !== sortedTransdata[index - 1].type;
                        let counttype = countByType[row.type];
                        let rowspan = 0;

                        if (
                          row.type == 'PARTPAYMENT' ||
                          row.type == 'CANCELLED PARTPAYMENT' ||
                          row.type == 'CANCELLED PARTPAYMENT INTREST' ||
                          row.type == 'PARTPAYMENT INTREST'
                        ) {
                          // console.log('PARTPAYMENT');
                          rowspan = 1;
                          rowcount = 0;
                        } else {
                          // console.log('type' + row.type);
                          rowcount += 1;
                          rowspan = 3;
                        }
                        // console.log('count' + rowcount);
                        const activeCount = sortedTransdata.reduce(
                          (count, row) => {
                            if (
                              row.status === 'ACTIVE' &&
                              row.trans_group_id !== 1 &&
                              row.trans_type_id !== 1 &&
                              row.trans_type_id !== 11 &&
                              row.trans_type_id !== 10 &&
                              row.trans_type_id !== 16
                            ) {
                              return count + 1;
                            } else if (
                              row.status === 'CANCELLED' &&
                              row.trans_group_id !== 1 &&
                              row.trans_type_id !== 1 &&
                              row.trans_type_id !== 11 &&
                              row.trans_type_id !== 10 &&
                              row.trans_type_id !== 16
                            ) {
                            }
                            return count;
                          },
                          0,
                        );

                        const redeemCount = sortedTransdata.reduce(
                          (count, row) => {
                            if (row.status === 'REDEEMS') {
                              return count + 1;
                            }
                            return count;
                          },
                          0,
                        );

                        if (
                          index === 0 ||
                          row.ref_no !== sortedTransdata[index - 1].ref_no
                        ) {
                          rows.push(
                            <tr key={row.id}>
                              <td
                                rowSpan={rowspan}
                                className="text-center"
                                style={{
                                  verticalAlign: 'middle',
                                  borderBottomColor: 'black',
                                }}
                              >
                                {row.type}
                              </td>
                              <td
                                // rowSpan={rowspan}
                                style={
                                  rowcount % 3 == 0
                                    ? { borderBottom: '1px solid black' }
                                    : {}
                                }
                              >
                                {row.ddate}
                              </td>
                              <td
                                //  rowSpan={rowspan}
                                style={
                                  rowcount % 3 == 0
                                    ? { borderBottom: '1px solid black' }
                                    : {}
                                }
                              >
                                {moment(row.created_at).format(
                                  `YYYY-MM-DD HH:mm`,
                                )}
                              </td>
                              <td
                                style={
                                  rowcount % 3 == 0
                                    ? { borderBottom: '1px solid black' }
                                    : {}
                                }
                              >
                                {row.description}
                              </td>
                              <td
                                className="text-right"
                                style={
                                  rowcount % 3 == 0
                                    ? { borderBottom: '1px solid black' }
                                    : {}
                                }
                              >
                                {row.amount}
                              </td>
                              <td
                                rowSpan={rowspan}
                                className="text-center"
                                style={{
                                  verticalAlign: 'middle',
                                  borderBottomColor: 'black',
                                }}
                              >
                                {row.type === 'PAWNING' ? (
                                  <div>
                                    <SystemButton
                                      type="cancel"
                                      method={() => cancelConfirmation(row)}
                                      showText
                                    />
                                    <p className="text-muted">
                                      Cancel most recent transactions first...
                                    </p>
                                    <div className="custom-control custom-switch">
                                      <input
                                        type="checkbox"
                                        className="custom-control-input"
                                        id="complete_delete"
                                        name="complete_delete"
                                        checked={completeDelete}
                                        onChange={handleValueChange}
                                      />
                                      <label
                                        className="custom-control-label"
                                        htmlFor="complete_delete"
                                      >
                                        Complete Delete
                                      </label>
                                    </div>
                                    {row.status === 'CANCELLED' ? (
                                      <label
                                        htmlFor="cancel_bill"
                                        className="bg-warning col-form-label col-sm-6"
                                      >
                                        {row.status}
                                      </label>
                                    ) : (
                                      ''
                                    )}
                                  </div>
                                ) : row.type === 'PART_PAYMENT' &&
                                  redeemCount > 1 ? (
                                  <label
                                    htmlFor="block_delete"
                                    className="bg-danger col-form-label col-auto"
                                  >
                                    Delete Blocked
                                  </label>
                                ) : row.status == 'CANCELLED' ? (
                                  <label
                                    htmlFor="cacnel_bill"
                                    className="bg-warning col-form-label col-auto"
                                  >
                                    {row.status}
                                  </label>
                                ) : (
                                  <SystemButton
                                    type="cancel"
                                    method={() => cancelConfirmation(row)}
                                    showText
                                  />
                                )}
                              </td>
                            </tr>,
                          );
                        } else if (index === 0 || row.type == 'PARTPAYMENT') {
                          rows.push(
                            <tr key={row.id}>
                              <td
                                rowSpan={rowspan}
                                className="text-center"
                                style={{
                                  verticalAlign: 'middle',
                                  borderBottomColor: 'black',
                                }}
                              >
                                {row.type}
                              </td>
                              <td
                                // rowSpan={rowspan}
                                style={
                                  rowcount % 3 == 0
                                    ? { borderBottom: '1px solid black' }
                                    : {}
                                }
                              >
                                {row.ddate}
                              </td>
                              <td
                                //  rowSpan={rowspan}
                                style={
                                  rowcount % 3 == 0
                                    ? { borderBottom: '1px solid black' }
                                    : {}
                                }
                              >
                                {moment(row.created_at).format(
                                  `YYYY-MM-DD HH:mm`,
                                )}
                              </td>
                              <td
                                style={
                                  rowcount % 3 == 0
                                    ? { borderBottom: '1px solid black' }
                                    : {}
                                }
                              >
                                {row.description}
                              </td>
                              <td
                                className="text-right"
                                style={
                                  rowcount % 3 == 0
                                    ? { borderBottom: '1px solid black' }
                                    : {}
                                }
                              >
                                {row.amount}
                              </td>
                              <td
                                rowSpan={rowspan}
                                className="text-center"
                                style={{
                                  verticalAlign: 'middle',
                                  borderBottomColor: 'black',
                                }}
                              >
                                {row.type === 'PART_PAYMENT' &&
                                redeemCount > 1 ? (
                                  <label
                                    htmlFor="block_delete"
                                    className="bg-danger col-form-label col-auto"
                                  >
                                    Delete Blocked
                                  </label>
                                ) : row.status == 'CANCELLED' ? (
                                  <label
                                    htmlFor="cacnel_bill"
                                    className="bg-warning col-form-label col-auto"
                                  >
                                    {row.status}
                                  </label>
                                ) : (
                                  <SystemButton
                                    type="cancel"
                                    method={() => cancelConfirmation(row)}
                                    showText
                                  />
                                )}
                              </td>
                            </tr>,
                          );
                        } else {
                          rows.push(
                            <tr key={row.id}>
                              <td
                                style={
                                  rowcount % 3 == 0
                                    ? { borderBottom: '1px solid black' }
                                    : {}
                                }
                              >
                                {row.ddate}
                              </td>
                              <td
                                //  rowSpan={rowspan}
                                style={
                                  rowcount % 3 == 0
                                    ? { borderBottom: '1px solid black' }
                                    : {}
                                }
                              >
                                {moment(row.created_at).format(
                                  `YYYY-MM-DD HH:mm`,
                                )}
                              </td>
                              <td
                                style={
                                  rowcount % 3 == 0
                                    ? { borderBottom: '1px solid black' }
                                    : {}
                                }
                              >
                                {row.description}
                              </td>
                              <td
                                className="text-right"
                                style={
                                  rowcount % 3 == 0
                                    ? { borderBottom: '1px solid black' }
                                    : {}
                                }
                              >
                                {row.amount}
                              </td>
                            </tr>,
                          );
                        }
                      });

                      return rows;
                    })()
                  : null}
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
