import React, { useState, useEffect } from 'react';
import { api, msg, cookie, print, roundup, cal, txt } from './../../services';
import moment from 'moment';
import { SystemButton, UnclosableModal } from '../../components';
import { SafeFontAwesomeIcon } from '../../components';
import { faCross, faGavel, faTrash } from '@fortawesome/free-solid-svg-icons';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { faArrowUp } from '@fortawesome/free-solid-svg-icons';
import { faArrowDown } from '@fortawesome/free-solid-svg-icons';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';
// import { format } from 'exceljs/dist/exceljs';

const MarkBill = () => {
  // Module name
  const moduleName = 'Mark Bill';

  /* --- State declarationss --- */

  const [billTypeSearch, setBillTypeSearch] = useState({
    branch_id: '',
    from_date: moment().format('YYYY-MM-DD'),
    to_date: moment().format('YYYY-MM-DD'),
    bill_type_id: '',
    bill_type_name: '',
    from_bill_no: '',
    to_bill_no: '',
    rate_id: '',
    rate_name: '',
    period_id: '',
    period_name: '',
  });

  const [isEdit, setIsEdit] = useState(false);

  const [branchBillTypes, setBranchBillTypes] = useState([]);

  const [pawningItems, setPawningItems] = useState([]);

  const [transHistory, setTransHistory] = useState([
    {
      id: '',
      loan_id: '',
      ddate: '',
      trans_type_id: '',
      amount: '',
      bill_extended_period: '',
      ref_no: '',
      prev_ref_no: '',
      trans_type: [],
    },
  ]);

  const [pawningData, setPawningData] = useState({
    branch_id: cookie.get('user_branch'),
    ddate: moment().format(`YYYY-MM-DD`),
    final_date: moment().format(`YYYY-MM-DD`),
    total_weight: 0,
    gold_value: 0,
    required_amount: 0,
    payable_amount: 0,
    balance: 0,
    total_interest: 0,
    stamp_fee: 0,
    paying_amount: 0,
    bill_type: [],
  });

  const [newData, setNewData] = useState({
    note: '',
    reason: '',
    already_marked: false,
    user_id: cookie.get('user_id'),
  });

  const [reasons, setReasons] = useState([]);

  const [additionalPayData, setAdditionalPayData] = useState({
    fm_int_rate: '',
    nm_int_rate: '',
    discount_days: 0,
    discount_rate: 0.0,
    tot_balance: '',
    new_balance: '',
    monthsElapsed: '',
    fm_int: '',
    nm_int: '',
    init_capital: '',
    interest_to_date: '',
    capital_balance: '',
    new_capital_balance: '',
    interest_balance: '',
    new_interest_balance: '',
    to_date: moment().format(`YYYY-MM-DD`),
    special_discount: 0,
    manual_discount: '',
    paid_int: '',
    paid_capital: '',
    document_fee: '',
    last_letter: '',
    elapsedTime: '',
    intCalTime: '',
    originalRedeemAmt: '',
  });

  const [customer, setCustomer] = useState({
    nic: '',
    id: '',
    name: '',
    address_1: '',
    address_2: '',
    telephone: '',
    notes: '',
    old_nic: '',
    other_names: '',
    is_blacklisted: false,
  });

  const [payment, setPayment] = useState({
    branch_id: cookie.get('user_branch'),
    ddate: moment().format(`YYYY-MM-DD`),
    loan_id: '',
    redeem_amount: (0).toFixed(2),
    redeem_interest: 0,
    paying_amount: '',
    discount: 0,
    jp_note: false,
    jp_seriel: '',
  });

  const [reminderLetterDetails, setReminderLetterDetails] = useState([]);

  // const [transactionData, setTransactionData] = useState([]);

  const [isLoading, setIsLoading] = useState(false);

  const [isRedeemedBill, setIsRedeemedBill] = useState(false);

  const [approvalRefNo, setApprovalRefNo] = useState('');

  const [discounts, setDiscounts] = useState([]);

  const [showSectionStates, setShowSectionStates] = useState({
    customerSection: true,
    itemSection: true,
    transHistorySection: true,
    pawningSection: true,
    timerModal: false,
  });

  const [markedIds, setMarkedIds] = useState([]);

  const [intRates, setIntRates] = useState([]);

  const [rate, setRates] = useState([]);

  const [period, setPeriod] = useState([]);

  const [resultsList, setResultsList] = useState([]);

  const [markBillList, setMarkBillList] = useState([]);

  const [deletemarkBillList, setdeleteMarkBillList] = useState([]);

  const [markBillListChanged, setMarkBillListChanged] = useState([]);

  const [repawningList, setRepawningList] = useState([]);

  const [paidCapAndInt, setPaidCapAndInt] = useState({
    paidCapital: '',
    paidInterest: '',
  });

  const [markBillFilter, setMarkBillFilter] = useState({
    number: '',
    date: moment().format('YYYY-MM-DD'),
    branch_id: cookie.get('user_branch'),
  });

  /* --- End of state declarations --- */

  useEffect(() => {
    fetchData();
  }, []);

  /* --- Component functions --- */

  const fetchData = async () => {
    const response = await api.get(
      `mark-bill-form_values/${cookie.get('user_branch')}`,
    );
    if (response.status == 200 && response.data.status == 200) {
      setReasons(response.data.data.reasons);
      setBranchBillTypes(response.data.data.bill_types);
      setRates(response.data.data.interest_rates);
      setPeriod(response.data.data.periods);
      setMarkBillFilter({
        ...markBillFilter,
        number: response.data.data.mark_bill_number,
      });
    } else {
      msg.error('Data Loading Error...');
    }
  };

  const fetchLoanData = async () => {
    if (
      billTypeSearch.bill_type_id != '' ||
      billTypeSearch.from_date != '' ||
      billTypeSearch.to_date != ''
    ) {
      setIsLoading(true);
      const response = await api
        .post(`get-bill-details-for-mark-bills`)
        .values({
          branch_id: cookie.get('user_branch'),
          bill_type_id: billTypeSearch.bill_type_id,
          bill_type_name: billTypeSearch.bill_type_name,
          from_bill_no: billTypeSearch.from_bill_no,
          to_bill_no: billTypeSearch.to_bill_no,
          from_date: billTypeSearch.from_date,
          to_date: billTypeSearch.to_date,
          rate: billTypeSearch.rate_id,
          period_id: billTypeSearch.period_id,
        });
      console.log('received billls');
      console.log(response);
      if (response.status == 200 && response.data.status == 200) {
        setResultsList(response.data.data);
        let already_marked_list = [];
        response.data.data
          .map((bill) => {
            if (bill.marked_bill == 1) {
              let child = bill;
              child.note = bill.mark_bill.extra_note;
              already_marked_list.push(child);
            }
          })
          .join('');
        setMarkBillList(already_marked_list);
        setIsLoading(false);
      } else {
        msg.error('Bill Loading Error...');
        setIsLoading(false);
      }
    } else {
      msg.error('You have to select atlest bill type or date range');
    }
  };

  const handleValueChange = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue = targetInput.value;
    let isControl = 0;

    setNewData({
      ...newData,
      is_control: isControl,
      [inputName]: inputValue,
    });
  };

  const handleValueChanges = async (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue =
      targetInput.type === 'checkbox' ? targetInput.checked : targetInput.value;
    const dataset =
      targetInput.type == 'select-one'
        ? targetInput.options[e.target.selectedIndex].dataset
        : targetInput.dataset;

    if (inputName === 'search_bill_type') {
      setBillTypeSearch({
        ...billTypeSearch,
        bill_type_id: inputValue,
        bill_type_name: dataset.billtype,
      });
    } else if (inputName === 'period') {
      setBillTypeSearch({
        ...billTypeSearch,
        period_id: inputValue,
        period_name: dataset.billtype,
      });
    } else if (inputName === 'rate') {
      setBillTypeSearch({
        ...billTypeSearch,
        rate_id: inputValue,
        rate_name: dataset.billtype,
      });
    } else if (inputName === 'from') {
      setBillTypeSearch({
        ...billTypeSearch,
        from_bill_no: inputValue,
      });
    } else if (inputName === 'from_date') {
      setBillTypeSearch({
        ...billTypeSearch,
        from_date: inputValue,
      });
    } else if (inputName === 'to_date') {
      setBillTypeSearch({
        ...billTypeSearch,
        to_date: inputValue,
      });
    } else {
      setBillTypeSearch({
        ...billTypeSearch,
        to_bill_no: inputValue,
      });
    }
  };

  const handleSubmit = async () => {
    if (newData.reason != '' && newData.note != '') {
      await save();
    } else {
      msg.error('Please Put a note and Select a Reason');
    }
  };

  const save = async () => {
    // if (isEdit == true) {
    // } else {
    let bill_for_mark = {
      reason: newData.reason,
      branch_id: cookie.get('user_branch'),
      note: newData.note,
      tdate: markBillFilter.date,
      already_marked: newData.already_marked,
      bills: [],
      repawning_list: [],
    };
    console.log(markBillList);

    markBillList.map((bill) => {
      bill_for_mark.bills.push({
        id: bill.id,
        // note: bill.note,
        is_marked: bill.marked_bill,
      });
    });
    repawningList.map((bill) => {
      if (bill.mark_bill !== null) {
        bill_for_mark.repawning_list.push({
          id: bill.id,
        });
      }
    });
    const response = await api.post('mark-bills').values(bill_for_mark);
    console.log(response);
    if (response.status == 200 && response.data.status == 200) {
      msg.success(response.data.message);
      resetAll();
    } else if (response.status == 200 && response.data.status == 401) {
      msg.warning(response.data.message);
      resetAll();
    } else if (response.status == 200 && response.data.status == 500) {
      response.data.errors.map((error) => {
        msg.error(error);
      });
    } else {
      msg.error('Something went wrong');
    }
    // }
  };

  const resetAll = () => {
    setMarkBillList([]);
    setResultsList([]);
    setdeleteMarkBillList([]);
    setMarkBillFilter({
      number: '',
      date: moment().format('YYYY-MM-DD'),
      branch_id: cookie.get('user_branch'),
    });
    setNewData({
      branch_id: cookie.get('user_branch'),
      loan_id: '',
      note: '',
      reason: '',
      already_marked: false,
      user_id: cookie.get('user_id'),
    });

    setPawningData({
      branch_id: cookie.get('user_branch'),
      ddate: moment().format(`YYYY-MM-DD`),
      final_date: moment().format(`YYYY-MM-DD`),
      total_weight: 0,
      gold_value: 0,
      payable_amount: 0,
      required_amount: 0,
      balance: 0,
      total_interest: 0,
      stamp_fee: 0,
      paying_amount: 0,
    });

    setCustomer({
      nic: '',
      id: '',
      name: '',
      address_1: '',
      address_2: '',
      telephone: '',
      notes: '',
      old_nic: '',
      other_names: '',
      is_blacklisted: false,
    });

    setAdditionalPayData({
      fm_int_rate: '',
      nm_int_rate: '',
      discount_days: 0,
      discount_rate: 0.0,
      tot_balance: '',
      new_balance: '',
      monthsElapsed: '',
      fm_int: '',
      nm_int: '',
      init_capital: '',
      interest_to_date: '',
      capital_balance: '',
      new_capital_balance: '',
      interest_balance: '',
      new_interest_balance: '',
      to_date: moment().format(`YYYY-MM-DD`),
      special_discount: 0,
      manual_discount: '',
      paid_int: '',
      paid_capital: '',
      document_fee: '',
      last_letter: '',
      elapsedTime: '',
      intCalTime: '',
      originalRedeemAmt: '',
    });

    setPayment({
      branch_id: cookie.get('user_branch'),
      ddate: moment().format(`YYYY-MM-DD`),
      loan_id: '',
      redeem_amount: (0).toFixed(2),
      redeem_interest: 0,
      paying_amount: '',
      discount: 0,
      jp_note: false,
      jp_seriel: '',
    });

    setTransHistory([
      {
        id: '',
        loan_id: '',
        ddate: '',
        trans_type_id: '',
        amount: '',
        bill_extended_period: '',
        ref_no: '',
        prev_ref_no: '',
        trans_type: [],
      },
    ]);

    setIsLoading(false);

    setIsRedeemedBill(false);

    setIntRates([]);

    setMarkedIds([]);

    setPaidCapAndInt({
      paidCapital: '',
      paidInterest: '',
    });

    setShowSectionStates({
      customerSection: true,
      itemSection: true,
      transHistorySection: true,
      pawningSection: true,
      timerModal: false,
    });

    setReminderLetterDetails([]);
    fetchData();
  };

  const moreToMarkList = async (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue = targetInput.value;
    const count = markBillList.filter((mark_bill) => {
      return mark_bill.id == inputValue;
    });
    const selected = resultsList.filter((results) => {
      return results.id == inputValue;
    });
    if (count.length == 0) {
      // * add
      selected[0].note = '';
      setMarkBillList(markBillList.concat(selected[0]));
    } else {
      // * remove
      const index = markBillList.findIndex(
        (mark_bill) => mark_bill.id == inputValue,
      );
      var exist_list = [...markBillList];
      exist_list.splice(index, 1);
      setMarkBillList(exist_list);
    }
  };

  const removeFromMarkList = async (id) => {
    console.log(id);
    let row = markBillList.find((bill) => {
      return bill.id == id;
    });
    const response = await api.post(`delete-mark-bill/${id}`).values({
      loan_id: row.id,
    });

    if (response.status == 200 && response.data.status == 200) {
      msg.success('Removed Successfully');
    } else if (response.status == 200 && response.data.status == 400) {
      msg.warning(response.data.message);
    } else if (response.status == 200 && response.data.status == 500) {
      msg.error(response.data.message);
    } else {
      msg.error('Something went wrong...');
    }
    // if (row.marked_bill) {
    //   setRepawningList(repawningList.concat(row));
    // }
    let key = 'result_list_' + id;
    const element = document.getElementById(key);
    if (element) {
      document.getElementById(key).checked = false;
    }
    const index = markBillList.findIndex((mark_bill) => mark_bill.id == id);
    var exist_list = [...markBillList];
    exist_list.splice(index, 1);
    setMarkBillList(exist_list);
    var parent = [...resultsList];
    parent.map((bill) => {
      if (bill.id == id) {
        bill.marked_bill = 0;
      }
    });
    setResultsList(parent);
  };

  const handleNoteChange = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue = targetInput.value;
    let name = inputName.split('_');
    const id = parseInt(name[2]);
    var mark_bill_list = [...markBillList];
    console.log('inname', name);
    markBillList.map((markBill) => {
      if (markBill.id == name[2]) {
        markBill.note = inputValue;
      }
    });
    setMarkBillList(mark_bill_list);
  };

  const paidAmount = (trans_list) => {
    let paid_amount = 0;
    trans_list.map((trans) => {
      if (trans.trans_type_id == 8) {
        paid_amount += parseFloat(trans.amount);
      }
    });
    return paid_amount;
  };

  const paidInterest = (trans_list) => {
    let paid_interest = 0;
    trans_list.map((trans) => {
      if (trans.trans_type_id == 7 || trans.trans_type_id == 11) {
        paid_interest += parseFloat(trans.amount);
      }
    });
    return paid_interest;
  };

  const handleMarkBillSearchChanges = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue = targetInput.value;
    setMarkBillFilter({
      ...markBillFilter,
      [inputName]: inputValue,
    });
  };

  const handleMark = (id) => {
    if (markedIds.includes(id)) {
      setMarkedIds(markedIds.filter((markedId) => markedId !== id));
    } else {
      setMarkedIds([...markedIds, id]);
    }
  };

  const handleAllMarked = (e) => {
    const isChecked = e.target.checked;
    const allIds = markBillList.map((item) => item.id);
    if (isChecked) {
      setMarkedIds(allIds);
    } else {
      setMarkedIds([]);
    }
  };

  const handleDeleteAllMarked = async () => {
    console.log('mids', markedIds);

    if (markedIds == null || markedIds.length === 0) {
      msg.error('Pleas Mark bill to Delete...');
    } else {
      const response = await api.post(`delete-mark-allbills`).values({
        loan_ids: markedIds,
      });

      if (response.status == 200 && response.data.status == 200) {
        msg.success('Removed Successfully');
      } else if (response.status == 200 && response.data.status == 400) {
        msg.warning(response.data.message);
      } else if (response.status == 200 && response.data.status == 500) {
        msg.error(response.data.message);
      } else {
        msg.error('Something went wrong...');
      }

      markedIds.forEach((id) => {
        const index = markBillList.findIndex((mark_bill) => mark_bill.id == id);
        const removedItem = markBillList[index];
        var exist_list = [...markBillList];
        exist_list.splice(index, 1);
        setMarkBillList(exist_list);
        setdeleteMarkBillList((prevList) => [...prevList, removedItem]);
      });
    }
  };

  const searchMarkBills = async (event) => {
    if (event.key === 'Enter') {
      const response = await api
        .post('get-old-marked-bill_details')
        .values(markBillFilter);
      console.log(response.data);
      if (response.status == 200 && response.data.status == 200) {
        if (response.data.data.length > 0) {
          // setResultsList(response.data.data);
          // let already_marked_list = [];
          // response.data.data
          //   .map((bill) => {
          //     // if (bill.marked_bill == 1) {
          //     let child = bill;
          //     child.note = bill.mark_bill.extra_note;
          //     already_marked_list.push(child);
          //     // }
          //   })
          //   .join('');
          setIsEdit(true);
          // setMarkBillList(already_marked_list);
          setMarkBillList(response.data.data);
          setdeleteMarkBillList(response.data.deleted_bills);
          setMarkBillFilter({
            ...markBillFilter,
            date: response.data.data[0].tdate,
          });

          setNewData({
            note: response.data.data[0].mark_bill.note,
            reason: response.data.data[0].mark_bill.reason,
            already_marked: true,
          });
        } else {
          // msg.info('Bill Not Found');
          setMarkBillList([]);
          setdeleteMarkBillList(response.data.deleted_bills);
        }
      } else if (response.status == 200 && response.data.status == 400) {
        msg.warning(response.data.message);
      } else if (response.status == 200 && response.data.status == 500) {
        response.data.errors.map((error) => {
          msg.error(error);
        });
      } else {
        msg.error('Something Went Wrong...');
      }
    }
  };

  //prettier-ignore
  return (
    <div>
      <h5 className="text-center mb-0">{moduleName}</h5>
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
        <div>
            <div className="col-sm-12">
                {/* onSubmit={() => fetchLoanData()} */}
                <form  className="compactForm">
                    <div className="row">
                        <table className="table table-sm">
                            <tbody>
                                <tr className='border border-bottom'>
                                    <td>
                                        <div className="form-group mb-0">
                                            <label htmlFor="from_date">From Date</label>
                                            <input 
                                                type="date" 
                                                className="form-control form-control-sm" 
                                                id="from_date"
                                                name='from_date'
                                                value={billTypeSearch.from_date}
                                                onChange={handleValueChanges}
                                            />
                                        </div>
                                    </td>
                                    <td>
                                        <div className="form-group mb-0">
                                            <label htmlFor="to_date">To Date</label>
                                            <input 
                                                type="date" 
                                                className="form-control form-control-sm" 
                                                id="to_date"
                                                name='to_date'
                                                value={billTypeSearch.to_date}
                                                onChange={handleValueChanges}    
                                            />
                                        </div>
                                    </td>
                                    <td>
                                        <div className="form-group mb-0">
                                            <label htmlFor="bill_type_id">Bill Type</label>
                                            <select
                                                type="text"
                                                className="form-control form-control-sm"
                                                id="search_bill_type"
                                                name="search_bill_type"
                                                placeholder="Type"
                                                value={billTypeSearch.bill_type_id}
                                                onChange={handleValueChanges}
                                            >
                                                <option
                                                    value=""
                                                    className="dropdown-item text-muted text-light"
                                                    disabled
                                                >
                                                    -- Select a bill type
                                                </option>
                                                {branchBillTypes.map((bill) => {
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
                                                })}
                                            </select>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="form-group mb-0">
                                            <label htmlFor="from">From</label>
                                            <input 
                                                type="number" 
                                                className="form-control form-control-sm text-right" 
                                                name='from' 
                                                id='from'
                                                value={billTypeSearch.from_bill_no}
                                                onChange={handleValueChanges}
                                            />
                                        </div> 
                                    </td>
                                    <td>
                                        <div className="form-group mb-0">
                                            <label htmlFor="to" >To</label>
                                            <input 
                                                type="number" 
                                                className="form-control form-control-sm text-right" 
                                                name='to' 
                                                id='to'
                                                value={billTypeSearch.to_bill_no}
                                                onChange={handleValueChanges}
                                            />
                                        </div>
                                    </td>
                                    <td>
                                        <div className="form-group mb-0">
                                            <label htmlFor="rate">Rate</label>
                                            <select
                                                type="text"
                                                className="form-control form-control-sm"
                                                id="rate"
                                                name="rate"
                                                placeholder="Type"
                                                value={billTypeSearch.rate_id}
                                                onChange={handleValueChanges}
                                            >
                                                <option
                                                    value=""
                                                    className="dropdown-item text-muted text-light"
                                                    disabled
                                                >
                                                    -- Select a rate
                                                </option>
                                                {rate.map((rate) => {
                                                    return (
                                                    <option
                                                        className="dropdown-item"
                                                        data-billtype={rate.des}
                                                        key={rate.id}
                                                        value={rate.id}
                                                    >
                                                        {rate.des}
                                                    </option>
                                                    );
                                                })}
                                            </select>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="form-group mb-0">
                                            <label htmlFor="period">Period</label>
                                            <select
                                                type="text"
                                                className="form-control form-control-sm"
                                                id="period"
                                                name="period"
                                                placeholder="Type"
                                                value={billTypeSearch.period_id}
                                                onChange={handleValueChanges}
                                            >
                                                <option
                                                    value=""
                                                    className="dropdown-item text-muted text-light"
                                                    disabled
                                                >
                                                    -- Select a Period
                                                </option>
                                                {period.map((period) => {
                                                    return (
                                                    <option
                                                        className="dropdown-item"
                                                        data-billtype={period.des}
                                                        key={period.id}
                                                        value={period.id}
                                                    >
                                                        {period.des}
                                                    </option>
                                                    );
                                                })}
                                            </select>
                                        </div>
                                    </td>
                                    <td className='align-bottom'>
                                        <button 
                                            type='button'
                                            className="btn btn-sm btn-success pt-0 pb-0 mt-2"
                                            onClick={() => fetchLoanData()}
                                        >
                                            <span>
                                                <SafeFontAwesomeIcon icon={faSearch} size="sm" />
                                            </span>
                                        </button> 
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </form>
            </div>
            <div className="col-sm-12">
                <div className="row justify-content-between">
                    <h5 className=''>Result List</h5>
                    {/* <button className='btn btn-sm btn-danger pt-0 pb-0'>
                        <span>
                            <SafeFontAwesomeIcon 
                            icon={faArrowDown} 
                            size="sm" 
                            />
                        </span>
                    </button> */}
                </div>
                <div className="row">
                    <div className='col-sm-12 pl-0 pr-0' style={{ maxHeight: '200px', overflowY: 'scroll', scrollbarWidth: 'thin'}}>
                        <table class="table table-sm">
                            <thead className="table-dark" style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor:'orange', color: 'black'}}>
                                <tr>
                                    <th scope="col">#</th>
                                    <th scope="col">BC</th>
                                    <th scope="col">Bill Type</th>
                                    <th scope="col">Bill No</th>
                                    <th scope="col">Loan Date</th>
                                    <th scope="col">Total Weight</th>
                                    <th scope="col">Loan Amount</th>
                                    <th scope="col">Paid Amount</th>
                                    <th scope="col">Paid Intrest</th>
                                    <th scope="col">Customer ID</th>
                                    <th scope="col">Customer Name</th>
                                    <th scope="col">Item/s</th>
                                </tr>
                            </thead>
                            <tbody>
                                { resultsList.map((result, index) => {
                                    return (
                                        <tr style={{ cursor: 'pointer'}} key={index} className={result.marked_bill ? 'bg-warning' : ''}>
                                            <td scope="row">
                                                <input type="checkbox" value={result.id} id={'result_list_'+result.id} onChange={moreToMarkList} disabled={result.marked_bill}/>
                                            </td>
                                            <td>
                                                <label style={{ cursor: 'pointer'}} htmlFor={'result_list_'+index}>{ result.branch.code+' - '+result.branch.name }</label>
                                            </td>
                                            <td>    
                                                <label style={{ cursor: 'pointer'}} htmlFor={'result_list_'+index}>{ result.get_bill_type.des }</label>
                                            </td>
                                            <td>
                                                <label style={{ cursor: 'pointer'}} htmlFor={'result_list_'+index}>{ result.bill_no }</label>
                                            </td>
                                            <td>
                                                <label style={{ cursor: 'pointer'}} htmlFor={'result_list_'+index}>{ result.ddate }</label>
                                            </td>
                                            <td>
                                                <label style={{ cursor: 'pointer'}} htmlFor={'result_list_'+index}>{ result.loan_capital }</label>
                                            </td>
                                            <td>
                                                <label style={{ cursor: 'pointer'}} htmlFor={'result_list_'+index}>{ result.total_weight }</label>
                                            </td>
                                            <td>
                                                <label style={{ cursor: 'pointer'}} htmlFor={'result_list_'+index}>{ paidAmount(result.loan_trans) }</label>
                                            </td>
                                            <td>
                                                <label style={{ cursor: 'pointer'}} htmlFor={'result_list_'+index}>{ paidInterest(result.loan_trans) }</label>
                                            </td>
                                            <td>
                                                <label style={{ cursor: 'pointer'}} htmlFor={'result_list_'+index}>{ result.customer.nic }</label>
                                            </td>
                                            <td>
                                                <label style={{ cursor: 'pointer'}} htmlFor={'result_list_'+index}>{ result.customer.name }</label>
                                            </td>
                                            <td>
                                                <label style={{ cursor: 'pointer'}} htmlFor={'result_list_'+index}>
                                                    {result.loan_item.map(item => {
                                                        return (item.item.name+',')
                                                    })}
                                                </label>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <br/>
            <div className="col-sm-12">
                <div className="row justify-content-between">
                    <h5 className=''>Mark Bill List</h5>
                </div>
                <div className="row justify-content-between">
                    <div className="">
                        <div className="form-group row mb-0">
                            <label htmlFor="number" className='col-sm-3 mb-0'>No</label>
                            <input 
                                type="number" 
                                className="form-control form-control-sm text-right col-sm-9 p-0" 
                                name='number' 
                                id='number'
                                value={markBillFilter.number}
                                onChange={handleMarkBillSearchChanges}
                                onKeyDown={searchMarkBills}
                            />
                        </div>
                    </div>
                    <div className="">
                        <div className="form-group row mb-0">
                            <label htmlFor="date" className='col-sm-3 mb-0 '>Date</label>
                            <input 
                                type="date" 
                                className="form-control form-control-sm text-right col-sm-9 p-0" 
                                name='date' 
                                id='date'
                                value={markBillFilter.date}
                                onChange={handleMarkBillSearchChanges}
                                onKeyDown={searchMarkBills}
                            />
                        </div>
                    </div>
                </div>
                <br/>
                <div className="row">
              
                    <div className='col-sm-12 pl-0 pr-0' style={{ maxHeight: '200px', overflowY: 'scroll', scrollbarWidth: 'thin'}}>
                        <table class="table table-sm">
                            <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor:'orange', color: 'black'}}>
                                <tr>
                           {isEdit==true ?( <th scope="col"><input type="checkbox"  onChange={(e) => handleAllMarked(e)} /></th>):('') }    
                                    <th scope="col">BC</th>
                                    <th scope="col">Bill Type</th>
                                    <th scope="col">Bill No</th>
                                    <th scope="col">Loan Date</th>
                                    <th scope="col">Total Weight</th>
                                    <th scope="col">Loan Amount</th>
                                    <th scope="col">Paid Amount</th>
                                    <th scope="col">Paid Intrest</th>
                                    <th scope="col">Customer ID</th>
                                    <th scope="col">Customer Name</th>
                                    <th scope="col">Item/s</th>
                                    {/* <th scope="col">Note</th> */}
                                    {/* <th scope="col"></th> */}
                                </tr>
                            </thead>
                            <tbody>
                                { markBillList.map((result, index) => {
                                    return (
                                        <tr style={{ cursor: 'pointer'}} key={index}>
                                       {isEdit==true ?(   <td scope="row">
                                          <input type="checkbox" value={result.id} onChange={() => handleMark(result.id)} checked={markedIds.includes(result.id)} />
                                            </td>):('')}
                                            <td>
                                                <label style={{ cursor: 'pointer'}} htmlFor={'mark_bill_list_'+index}>{ result.branch.code+' - '+result.branch.name }</label>
                                            </td>
                                            <td>    
                                                <label style={{ cursor: 'pointer'}} htmlFor={'mark_bill_list_'+index}>{ result.get_bill_type.des }</label>
                                            </td>
                                            <td>
                                                <label style={{ cursor: 'pointer'}} htmlFor={'mark_bill_list_'+index}>{ result.bill_no }</label>
                                            </td>
                                            <td>
                                                <label style={{ cursor: 'pointer'}} htmlFor={'mark_bill_list_'+index}>{ result.ddate }</label>
                                            </td>
                                            <td>
                                                <label style={{ cursor: 'pointer'}} htmlFor={'mark_bill_list_'+index}>{ result.loan_capital }</label>
                                            </td>
                                            <td>
                                                <label style={{ cursor: 'pointer'}} htmlFor={'mark_bill_list_'+index}>{ result.total_weight }</label>
                                            </td>
                                            <td>
                                                <label style={{ cursor: 'pointer'}} htmlFor={'mark_bill_list_'+index}>{ paidAmount(result.loan_trans) }</label>
                                            </td>
                                            <td>
                                                <label style={{ cursor: 'pointer'}} htmlFor={'mark_bill_list_'+index}>{ paidInterest(result.loan_trans) }</label>
                                            </td>
                                            <td>
                                                <label style={{ cursor: 'pointer'}} htmlFor={'mark_bill_list_'+index}>{ result.customer.nic }</label>
                                            </td>
                                            <td>
                                                <label style={{ cursor: 'pointer'}} htmlFor={'mark_bill_list_'+index}>{ result.customer.name }</label>
                                            </td>
                                            <td>
                                                <label style={{ cursor: 'pointer'}} htmlFor={'mark_bill_list_'+index}>
                                                    {result.loan_item.map(item => {
                                                        return (item.item.name+',')
                                                    })}
                                                </label>
                                            </td>
                                            {/* <td>
                                              {result.mark_bill ?(
                                                <input type="text" value={result.mark_bill.extra_note} name={'mark_note_'+result.id+'_'+index} 
                                                onChange={handleNoteChange}
                                                />
                                              ):(
                                                <input type="text"  name={'mark_note_'+result.id+'_'+index} 
                                                onChange={handleNoteChange}
                                                />
                                              )}
                                              
                                            </td> */}
                                            {/* <td scope="row">
                                                <button className='btn btn-sm btn-danger pt-0 pb-0' onClick={() => removeFromMarkList(result.id)}>
                                                    <span>
                                                        <SafeFontAwesomeIcon 
                                                        icon={faTrash} 
                                                        size="sm" 
                                                        />
                                                    </span>
                                                </button>
                                            </td> */}
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <br/>
            <div className="col-sm-12">
                <div className="compactForm">
                <div className="row">
                    <div className="col-6 pl-0">
                    <div className="form-group">
                        <label htmlFor="note">Note</label>
                        <input
                        type="input"
                        name="note"
                        id="note"
                        className="form-control form-control-sm"
                        value={newData.note}
                        onChange={handleValueChange}
                        required
                        />
                    </div>
                    </div>
        
                    <div className="col-6 pr-0">
                    <div className="form-group">
                        <label htmlFor="reason">Reason</label>
                        <select
                            name="reason"
                            id="reason"
                            className="form-control form-control-sm"
                            value={newData.reason}
                            onChange={handleValueChange}
                        
                        >
                            <option
                            value=""
                            className="dropdown-item text-muted text-light"
                            disabled
                            >
                            -- Select a Reason
                            </option>
                            {reasons.map((type, index) => {
                            return (
                                <option
                                key={index}
                                className="dropdown-item"
                                data-billtype={type.des}
                                value={type.des}
                                >
                                {type.des}                              
                                </option>
                            );
                            })}
                        </select>
                    </div>
                    </div>
                </div>

                {newData.already_marked?(<h3 className='important-text-3'>This bill already marked.</h3>) : null }

                { deletemarkBillList.length ? (
                <div className="row">
                <div className="row justify-content-between">
                    <h5 className=''>Deleted Mark Bill List</h5>
                </div>
                    <div className='col-sm-12 pl-0 pr-0' style={{ maxHeight: '200px', overflowY: 'scroll', scrollbarWidth: 'thin'}}>
                        <table class="table table-sm">
                            <thead className="table-dark" style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor:'orange', color: 'black'}}>
                                <tr>
                                    <th scope="col">BC</th>
                                    <th scope="col">Bill Type</th>
                                    <th scope="col">Bill No</th>
                                    <th scope="col">Loan Date</th>
                                    <th scope="col">Total Weight</th>
                                    <th scope="col">Loan Amount</th>
                                    <th scope="col">Paid Amount</th>
                                    <th scope="col">Paid Intrest</th>
                                    <th scope="col">Customer ID</th>
                                    <th scope="col">Customer Name</th>
                                    <th scope="col">Item/s</th>
                                </tr>
                            </thead>
                            <tbody>
                                { deletemarkBillList.map((result, index) => {
                                    return (
                                        <tr style={{ cursor: 'pointer'}} key={index} >
                                        
                                            <td>
                                                <label style={{ cursor: 'pointer'}} htmlFor={'result_list_'+index}>{ result.branch.code+' - '+result.branch.name }</label>
                                            </td>
                                            <td>    
                                                <label style={{ cursor: 'pointer'}} htmlFor={'result_list_'+index}>{ result.get_bill_type.des }</label>
                                            </td>
                                            <td>
                                                <label style={{ cursor: 'pointer'}} htmlFor={'result_list_'+index}>{ result.bill_no }</label>
                                            </td>
                                            <td>
                                                <label style={{ cursor: 'pointer'}} htmlFor={'result_list_'+index}>{ result.ddate }</label>
                                            </td>
                                            <td>
                                                <label style={{ cursor: 'pointer'}} htmlFor={'result_list_'+index}>{ result.loan_capital }</label>
                                            </td>
                                            <td>
                                                <label style={{ cursor: 'pointer'}} htmlFor={'result_list_'+index}>{ result.total_weight }</label>
                                            </td>
                                            <td>
                                                <label style={{ cursor: 'pointer'}} htmlFor={'result_list_'+index}>{ paidAmount(result.loan_trans) }</label>
                                            </td>
                                            <td>
                                                <label style={{ cursor: 'pointer'}} htmlFor={'result_list_'+index}>{ paidInterest(result.loan_trans) }</label>
                                            </td>
                                            <td>
                                                <label style={{ cursor: 'pointer'}} htmlFor={'result_list_'+index}>{ result.customer.nic }</label>
                                            </td>
                                            <td>
                                                <label style={{ cursor: 'pointer'}} htmlFor={'result_list_'+index}>{ result.customer.name }</label>
                                            </td>
                                            <td>
                                                <label style={{ cursor: 'pointer'}} htmlFor={'result_list_'+index}>
                                                    {result.loan_item.map(item => {
                                                        return (item.item.name+',')
                                                    })}
                                                </label>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
                ) : ('')}
                    
                <br />         


                <div className="row justify-content-end">
                    
                {isEdit==true ?(  
                    <button onClick={handleDeleteAllMarked} className='btn-danger btn-outline-light btn-sm rounded-0'>Delete Marked Bills</button>
                   ):( ' ')  
                }
                    
                    <div className="col-sm-2">
                    <SystemButton
                        type={'reset'}
                        method={() => resetAll()}
                        showText={true}
                    />
                    </div>
                    <div className="col-sm-3">
                    <SystemButton
                        type="no-form-save"
                        showText={true}
                        method={handleSubmit}
                        btnText={newData.already_marked? 'Update Mark Bill' : 'Mark Bill'}
                        
                    />
                    </div>
                </div>
                </div>
            </div>
            <br />
        </div>
      )}
    </div>
  );
  //prettier-ignore-end

  /* --- End of component renders --- */
};

export default MarkBill;
