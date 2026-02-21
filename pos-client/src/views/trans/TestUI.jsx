import React, { useState, useEffect, useRef } from 'react';
import { api, cookie, msg, print } from './../../services';
import moment from 'moment';
import { SystemButton, UnclosableModal } from '../../components';
import { v4 as uuidv4 } from 'uuid';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';

const Loans = () => {
  // Module name
  const moduleName = 'Pawning';

  /* --- State declarationss --- */

  const [customer, setCustomer] = useState({
    branch_id: cookie.get('user_branch'),
    nic: '',
    old_nic: '',
    id: '',
    name: '',
    other_names: '',
    address_1: '',
    address_2: '',
    telephone: '',
    notes: '',
    allowed_bills: '',
    is_blacklisted: false,
  });

  const [customerNic, setCustomerNic] = useState('');

  const [billTypeSearch, setBillTypeSearch] = useState({
    bill_type_id: '',
    bill_no: '',
  });

  const [loanHistory, setLoanHistory] = useState([]);

  const [itemCategories, setItemCategories] = useState([]);

  const [itemConditions, setItemConditions] = useState([]);

  const [goldRates, setGoldRates] = useState([]);

  const [approvalRefNo, setApprovalRefNo] = useState('');

  const [billTypes, setBillTypes] = useState([]);

  // const [allBillTypes, setAllBillTypes] = useState([]);

  const [stampFees, setStampFees] = useState([]);

  const [interestRates, setInterestRates] = useState([]);

  const [billCounts, setBillCounts] = useState([]);

  const [newLoan, setNewLoan] = useState({
    branch_id: cookie.get('user_branch'),
    ddate: moment().format(`YYYY-MM-DD`),
    final_date: '',
    total_weight: (0).toFixed(2),
    gold_value: (0).toFixed(2),
    required_amount: (0).toFixed(2),
    payable_amount: '0.00',
    customer_id: '',
    bill_type_id: '',
    bill_count: '',
    interest_rate_id: '',
    stamp_fee_id: '',
    remd_letr_no: '0',
    is_renew: false,
    prev_bill: '',
    user: cookie.get('user_id'),
    status: 'PENDING',
  });

  const [pawningItems, setPawningItems] = useState([]);

  const [transactionData, setTransactionData] = useState([]);

  const [isOldPawning, setIsOldPawning] = useState(false);

  const [additionalPawnData, setAdditionalPawnData] = useState({
    duration: '',
    months: 0,
    fm_interest_rate: (0).toFixed(2),
    nm_interest_rate: (0).toFixed(2),
    first_month_interest: (0).toFixed(2),
    next_month_interest: (0).toFixed(2),
    stamp_fee: (0).toFixed(2),
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isCustLoading, setIsCustLoading] = useState(false);
  const [isItemLoading, setIsItemLoading] = useState(true);
  const [isHistLoading, setIsHistLoading] = useState(false);

  const [showCustomerSection, setShowCustomerSection] = useState(true);

  // const [showPawningSection, setShowPawningSection] = useState(false);

  const [showItemSection, setShowItemSection] = useState(true);

  const [showTransHistorySection, setShowTransHistorySection] = useState(true);

  const [showTimerModal, setShowTimerModal] = useState(false);

  const [loanId, setLoanId] = useState('');

  let amountRanges = [];

  /* --- End of state declarations --- */

  /* --- Reference declarations --- */

  const dataSection = useRef(null);

  /* --- End of referance declarations --- */

  useEffect(() => {
    fetchData();
  }, []);

  /* --- Component functions --- */

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const response = await api.get(`newLoan/${cookie.get('user_branch')}`);
      setBillTypes(response.data.bill_types);

      setItemCategories(response.data.category);

      setItemConditions(response.data.itemConditions);

      setStampFees(response.data.stamp_fee);

      // setAllBillTypes(response.data.all_bill_types);

      setBillCounts(response.data.bill_counts);

      setIsLoading(false);
    } catch (error) {
      return msg.error('Unable to fetch data!');
    }
  };

  const fetchCustomerOrBill = async () => {
    resetAll();
    try {
      setIsCustLoading(true);
      setIsHistLoading(true);

      if (isOldPawning) {
        const response = await api.get(
          `showLoan/${cookie.get('user_branch')}/${
            billTypeSearch.bill_type_id
          }/${billTypeSearch.bill_no}`,
        );

        if (response.data.errMessage) {
          msg.warning(`Loan does not exist`);
        } else {
          let itemsArr = [];
          let goldRatesArr = [];
          let stampFee = 0;
          let fmInt = 0;

          console.log(response.data[0].id);

          setLoanId(response.data[0].id);

          // setCustomer(response.data[0]);

          // setLoanHistory(response.data[0].loan);

          response.data[0].loan_trans.forEach((trans) => {
            if (trans.trans_type_id === 11) {
              fmInt = trans.amount;
            }

            if (trans.trans_type_id === 10) {
              stampFee = trans.amount;
            }
          });

          setNewLoan({
            branch_id: cookie.get('user_branch'),
            ddate: response.data[0].ddate,
            final_date: response.data[0].final_date,
            total_weight: response.data[0].total_weight,
            gold_value: response.data[0].gold_value,
            required_amount: response.data[0].required_amount,
            payable_amount:
              parseFloat(response.data[0].required_amount) -
              (parseFloat(stampFee) + parseFloat(fmInt)),
            customer_id: response.data[0].customer_id,
            bill_type_id: response.data[0].bill_type_id,
            stamp_fee_id: '',
            remd_letr_no: '',
            user: cookie.get('user_id'),
            status: 'PENDING',
          });

          setAdditionalPawnData({
            duration: response.data[0].bill_type.period.des,
            months: response.data[0].bill_type.period.months,
            fm_interest_rate: parseFloat(
              response.data[0].int_rate.fm_interest_rate,
            ).toFixed(2),
            nm_interest_rate: parseFloat(
              response.data[0].int_rate.nm_interest_rate,
            ).toFixed(2),
            first_month_interest: parseFloat(fmInt).toFixed(2),
            next_month_interest: parseFloat(
              (parseFloat(response.data[0].int_rate.nm_interest_rate) *
                parseFloat(response.data[0].required_amount)) /
                100,
            ).toFixed(2),
            stamp_fee: parseFloat(stampFee).toFixed(2),
          });

          response.data[0].loan_item.forEach((item) => {
            goldRatesArr.push(item.gold_rate);

            itemsArr.push({
              index: uuidv4(),
              category_id: item.item.category_id,
              items: [item.item_id],
              item_id: item.item_id,
              qty: item.qty,
              item_condition_id: item.item_condition_id,
              gold_rate_id: item.gold_rate_id,
              gold_weight: parseFloat(item.gold_weight).toFixed(2),
              gold_value: parseFloat(item.gold_value).toFixed(2),
            });
          });

          setGoldRates(goldRatesArr);

          setPawningItems(itemsArr);

          setIsCustLoading(false);
          setIsHistLoading(false);

          setShowCustomerSection(true);
          setShowTransHistorySection(true);

          window.scrollTo(0, dataSection.current.offsetTop);
        }
      } else {
        const response = await api.get(`showCustomer/${customerNic}`);

        if (response.data.errMessage) {
          msg.error(response.data.errMessage);

          if (response.data.blacklisted) {
            setCustomer({
              ...customer,
              notes: response.data.blacklisted,
              is_blacklisted: true,
            });
            msg.info_stick(response.data.blacklisted);
          } else {
            setShowCustomerSection(true);
          }
          setIsCustLoading(false);
          setIsHistLoading(false);
        } else {
          setCustomer({
            ...customer,
            old_nic: response.data[0].old_nic,
            id: response.data[0].id,
            name: response.data[0].name,
            other_names: response.data[0].other_names,
            address_1: response.data[0].address_1,
            address_2: response.data[0].address_2,
            telephone: response.data[0].telephone,
            notes: response.data[0].notes,
            allowed_bills: response.data[0].allowed_bills,
            is_blacklisted: response.data[0].is_blacklisted,
          });

          setLoanHistory(response.data[0].loan);

          setNewLoan({
            ...newLoan,
            customer_id: response.data[0].id,
          });

          setIsCustLoading(false);
          setIsHistLoading(false);

          setShowCustomerSection(true);
          setShowTransHistorySection(true);

          window.scrollTo(0, dataSection.current.offsetTop);
        }
      }
      // setShowItemSection(true);
    } catch (error) {
      setIsLoading(false);

      return msg.error('Unable to fetch data!');
    }
  };

  const filterItemsList = async (e) => {
    const datasetId = e.target.dataset.id;
    const targetValue = e.target.value;

    try {
      setIsItemLoading(true);

      const response = await api.get(`items-by-category/${targetValue}`);

      setPawningItems(
        [...pawningItems],
        (pawningItems[datasetId].category_id = targetValue),
        (pawningItems[datasetId].items = response.data),
      );
    } catch (error) {
      return msg.error(error);
    } finally {
      setIsItemLoading(false);
    }
  };

  const handleItemsChange = (e) => {
    const targetInput = e.target;
    const datasetId = targetInput.dataset.id;
    const inputName = targetInput.name;
    const inputValue = targetInput.value;
    const setOfItems = [...pawningItems];

    setOfItems[datasetId][inputName] = inputValue;

    setPawningItems(setOfItems);

    console.log(datasetId);

    if (inputName === 'gold_weight' || inputName === 'gold_rate_id') {
      if (
        pawningItems[datasetId].gold_weight &&
        pawningItems[datasetId].gold_rate_id
      ) {
        calItemValue(inputName, datasetId, inputValue);
      }
    }
  };

  const calItemValue = (inputName, index, inputVal) => {
    // let ratesTemp = [...goldRates];
    let rateData = goldRates.filter(
      (rate) =>
        parseInt(rate.id) === parseInt(pawningItems[index].gold_rate_id),
    );
    let setOfItems = [...pawningItems];

    Promise.all(rateData).then((res) => {
      if (inputName === 'gold_weight') {
        setOfItems[index]['gold_value'] = parseFloat(
          parseFloat(res[0].rate) * parseFloat(inputVal),
        ).toFixed(2);

        setPawningItems(setOfItems);
      } else if (inputName === 'gold_rate_id') {
        setOfItems[index]['gold_value'] = parseFloat(
          parseFloat(res[0].rate) * pawningItems[index].gold_weight,
        ).toFixed(2);

        setPawningItems(setOfItems);
      }
    });

    // setTimeout(() => {
    //   calItemTotals();
    // }, 700);
  };

  useEffect(() => {
    calItemTotals();
  }, [pawningItems]);

  const calItemTotals = () => {
    let totGoldWeight = 0;
    let totGoldValue = 0;

    pawningItems.map((item) => {
      if (item.gold_weight) {
        totGoldWeight = (
          parseFloat(totGoldWeight) + parseFloat(item.gold_weight)
        ).toFixed(2);
      }
      if (item.gold_value) {
        totGoldValue = (
          parseFloat(totGoldValue) + parseFloat(item.gold_value)
        ).toFixed(2);
      }
    });

    setNewLoan({
      ...newLoan,
      gold_value: Number.isNaN(parseFloat(totGoldValue)) ? 0 : totGoldValue,
      total_weight: Number.isNaN(parseFloat(totGoldWeight)) ? 0 : totGoldWeight,
    });
  };

  const handleCustomerSearch = (e) => {
    if (e.keyCode === 13) {
      fetchCustomerOrBill(dataSection);
    }
  };

  const handleCustomerValueChanges = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue =
      targetInput.type === 'checkbox' ? targetInput.checked : targetInput.value;

    if (inputName === 'nic') {
      setCustomerNic(inputValue);
    }
    setCustomer({
      ...customer,
      [inputName]: inputValue,
    });
  };

  const handlePawningAmountChanges = async (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue =
      targetInput.type === 'checkbox' ? targetInput.checked : targetInput.value;

    if (inputName === 'search_bill_type') {
      setBillTypeSearch({
        ...billTypeSearch,
        bill_type_id: inputValue,
      });
    }

    if (inputName === 'search_bill_no') {
      setBillTypeSearch({
        ...billTypeSearch,
        bill_no: inputValue,
      });
    }

    if (inputName === 'bill_type_id') {
      billTypes.map((bill) => {
        if (bill.id === parseInt(targetInput.value)) {
          amountRanges = [
            {
              id: bill.int_rate.id,
              des: bill.int_rate.des,
              from_amount: bill.int_rate.from_amount,
              to_amount: bill.int_rate.to_amount,
              fm_interest_rate: bill.int_rate.fm_interest_rate,
              nm_interest_rate: bill.int_rate.nm_interest_rate,
              discount_days: bill.int_rate.discount_days,
              discount_rate: bill.int_rate.discount_rate,
              grace_period: bill.int_rate.grace_period,
              grace_rate: bill.int_rate.grace_rate,
            },
          ];

          setGoldRates(bill.gold_rate);

          setInterestRates(bill.int_rate);

          setAdditionalPawnData({
            ...additionalPawnData,
            duration: bill.period.des,
            months: bill.period.months,
          });

          setPawningItems([
            {
              index: uuidv4(),
              category_id: '',
              items: [],
              item_id: '',
              qty: '',
              item_condition_id: '',
              gold_rate_id: '',
              gold_weight: '',
              gold_value: '',
            },
          ]);

          billCounts.map((count) => {
            if (count.bill_type_id == inputValue) {
              setNewLoan({
                ...newLoan,
                bill_count: parseInt(count.bill_count) + parseInt(1),
                bill_type_id: bill.id,
                final_date: moment(newLoan.ddate)
                  .add(bill.period.months, 'months')
                  .format('YYYY-MM-DD'),
                gold_value: 0,
                total_weight: 0,
              });
            }
          });

          // setNewLoan({
          //   ...newLoan,
          //   bill_type_id: bill.id,
          //   final_date: moment(newLoan.ddate)
          //     .add(bill.period.months, 'months')
          //     .format('YYYY-MM-DD'),
          //   gold_value: 0,
          //   total_weight: 0,
          // });
        }
      });

      setShowItemSection(true);
    }

    if (inputName === 'ddate') {
      setNewLoan({
        ...newLoan,
        ddate: inputValue,
        final_date: moment(inputValue)
          .add(additionalPawnData.months, 'months')
          .format('YYYY-MM-DD'),
        // final_date: moment(inputValue).add(additionalPawnData.months, 'months'),
      });
    }

    if (inputName === 'is_renew') {
      setNewLoan({
        ...newLoan,
        is_renew: inputValue,
      });
    }

    if (inputName === 'prev_bill') {
      setNewLoan({
        ...newLoan,
        prev_bill: inputValue,
      });
    }

    if (inputName === 'payable_amount') {
      const stamp_fee = await selectStampFee(inputValue);

      const int_amounts = await calInterestAndAmount(inputValue);

      // let payable = inputValue;

      console.log(stamp_fee);

      let required = parseFloat(
        parseFloat(inputValue) +
          parseFloat(int_amounts.fm_interest) +
          parseFloat(stamp_fee.fee),
      ).toFixed(2);

      setTransactionData([
        {
          ddate: newLoan.ddate,
          trans_type_id: '1',
          amount: required,
          bill_extended_period: '4',
        },
        {
          ddate: newLoan.ddate,
          trans_type_id: '11',
          amount: int_amounts.fm_interest,
          bill_extended_period: '4',
        },
        {
          ddate: newLoan.ddate,
          trans_type_id: '10',
          amount: stamp_fee.fee,
          bill_extended_period: '4',
        },
      ]);

      setNewLoan({
        ...newLoan,
        payable_amount: inputValue,
        required_amount: required,
        stamp_fee_id: stamp_fee.fee_id,
        interest_rate_id: int_amounts.rate_id,
      });

      setAdditionalPawnData({
        ...additionalPawnData,
        stamp_fee: parseFloat(stamp_fee.fee).toFixed(2),
        fm_interest_rate: parseFloat(int_amounts.fm_interest_rate).toFixed(2),
        nm_interest_rate: parseFloat(int_amounts.nm_interest_rate).toFixed(2),
        first_month_interest: parseFloat(int_amounts.fm_interest).toFixed(2),
        next_month_interest: parseFloat(int_amounts.nm_interest).toFixed(2),
      });
    }
  };

  const selectStampFee = async (inputValue) => {
    let fee = 0;
    let fee_id = 0;

    stampFees.map((stampFee) => {
      if (
        parseFloat(stampFee.from_value) <= parseFloat(inputValue) &&
        parseFloat(inputValue) <= parseFloat(stampFee.to_value)
      ) {
        fee = parseFloat(stampFee.stamp_fee);
        fee_id = stampFee.id;
      }
    });

    return { fee_id, fee };
  };

  const calInterestAndAmount = async (inputValue) => {
    let rate_id = 0;
    let fm_interest = 0; // First month interest
    let nm_interest = 0; // Interest from the second month
    let fm_interest_rate = 0; // First month interest rate
    let nm_interest_rate = 0; // Interest from the second month rate

    interestRates.map((rates) => {
      if (
        parseFloat(rates.from_amount) <= parseFloat(inputValue) &&
        parseFloat(inputValue) <= parseFloat(rates.to_amount)
      ) {
        fm_interest_rate = parseFloat(rates.fm_interest_rate);
        nm_interest_rate = parseFloat(rates.nm_interest_rate);
        rate_id = rates.id;
      }
    });

    fm_interest = (parseFloat(inputValue) * parseFloat(fm_interest_rate)) / 100;

    nm_interest = (parseFloat(inputValue) * parseFloat(nm_interest_rate)) / 100;

    return {
      fm_interest_rate,
      nm_interest_rate,
      rate_id,
      fm_interest,
      nm_interest,
    };
  };

  // TODO: Validate data prior to saving
  const validator = async () => {
    let state = true;
    let message = '';

    return {
      state: state,
      message: message,
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validated = await validator();

    if (validated.state) {
      if (newLoan.gold_value < newLoan.required_amount) {
        await sendToOverAdvanceApproval();
      } else if (customer.allowed_bills) {
        if (loanHistory.length >= customer.allowed_bills) {
          await sendToCustomerApproval();
        } else {
          await save();
          resetAll();
        }
      } else {
        await save();
        resetAll();
      }
    } else {
      msg.error(validated.message);
      return;
    }
  };

  const sendToOverAdvanceApproval = async () => {
    try {
      const response = await api
        .post('sendApproveRequestCustOverAdvance')
        .values({
          loan: newLoan,
          loan_items: pawningItems,
          loan_trans: transactionData,
        });

      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err[0]);
        });
        return;
      }
      setApprovalRefNo(response.data);

      setShowTimerModal(true);

      checkOverAdvanceApprovalStatus(response.data);
    } catch (error) {
      msg.error(error);
      return console.log(error);
    }
  };

  const sendToCustomerApproval = async () => {
    try {
      const response = await api.post('sendCustReleaseRequset').values({
        customer: customer,
        loan: newLoan,
      });

      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err[0]);
        });
        return;
      }
      setApprovalRefNo(response.data);

      setShowTimerModal(true);

      checkCustomerApprovalStatus(response.data);
    } catch (error) {
      msg.error(error);
      return console.log(error);
    }
  };

  const save = async () => {
    try {
      const response = await api.post('newLoanSave').values({
        loan: newLoan,
        loan_items: pawningItems,
        loan_trans: transactionData,
        customerInfo: customer,
      });

      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err[0]);
        });
        return;
      }

      if (response.data.errMessage) {
        msg.error(`${response.data.errMessage}`);
      } else {
        msg.success(
          `Bill no ${response.data[0].bill_type.des} - ${response.data[0].bill_no} saved successfully`,
        );
        print.pawningBill(response.data);
      }

      // msg.success(response.data);
    } catch (error) {
      msg.error(error);
      return console.log(error);
    }
  };

  const addNewItem = () => {
    pawningItems.map((item) => {
      if (item.qty != 0) {
        if (item.gold_value != 0) {
          setPawningItems([
            ...pawningItems,
            {
              index: uuidv4(),
              category_id: '',
              items: [],
              item_id: '',
              qty: '',
              item_condition_id: '',
              gold_rate_id: '',
              gold_weight: '',
              gold_value: '',
            },
          ]);
        } else {
          msg.error(`Gold values cannot be empty or zero!`);
        }
      } else {
        msg.error(`Item counts cannot be empty or zero!`);
      }
    });
  };

  const removeItem = (i) => {
    // TODO: Create a better dialog box component... Use the FormModal component as a base template
    if (window.confirm('Are you sure you want to remove this item?')) {
      setPawningItems(pawningItems.filter((task) => task.index !== i));

      setTimeout(() => {
        if (pawningItems.length === 1) {
          setPawningItems([
            {
              index: uuidv4(),
              category_id: '',
              items: [],
              item_id: '',
              qty: '',
              item_condition_id: '',
              gold_rate_id: '',
              gold_weight: '',
              gold_value: '',
            },
          ]);
        }
      }, 200);
    }
  };

  const renew = async () => {
    console.log(loanId);
    if (
      window.confirm(
        `Are you sure you want re-new this pawning? NOTE: This will redeem this pawning and add new one under a new bill number`,
      )
    ) {
      try {
        const response = await api.post('renewPawning').values({
          loan_id: loanId,
        });

        if (response.error) {
          Object.values(response.error).forEach((err) => {
            msg.error(err[0]);
          });
          return;
        }

        msg.success(response.data);
      } catch (error) {
        msg.error(error);
        return console.log(error);
      }
    }
  };

  const cancelBill = async () => {
    try {
      const response = await api.post('cancelPawning').values({
        loan_id: loanId,
      });

      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err[0]);
        });
        return;
      }

      msg.success(response.data);
    } catch (error) {
      msg.error(error);
      return console.log(error);
    }
  };

  const checkOverAdvanceApprovalStatus = async (approval_id) => {
    const checkStatus = setInterval(async () => {
      const response = await api.get(
        `showOverAdvanceApprovalStatus/${approval_id}`,
      );

      if (response.data[0].status === 'APPROVED') {
        setShowTimerModal(false);

        await save();
        resetAll();

        clearInterval(checkStatus);
      }
    }, 3000);

    setTimeout(() => {
      clearInterval(checkStatus);
    }, 300000);
  };

  const checkCustomerApprovalStatus = async (approval_id) => {
    const checkStatus = setInterval(async () => {
      const response = await api.get(
        `showCustomerApprovalStatus/${approval_id}`,
      );

      if (response.data[0].status === 'APPROVED') {
        setShowTimerModal(false);

        await save();
        resetAll();

        clearInterval(checkStatus);
      }
    }, 3000);

    setTimeout(() => {
      clearInterval(checkStatus);
    }, 300000);
  };

  const approvalTimerText = ({ remainingTime }) => {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;

    return (
      <div className="container text-center">
        <div className="text-muted">Remaining</div>
        <div className="h2">
          {`
            ${('0' + minutes).slice(-2)}
            :
            ${('0' + seconds).slice(-2)}
          `}
        </div>
        <div className="text-muted">minutes</div>
      </div>
    );
  };

  // const printBill = (billData) => {
  //   console.log(billData);
  // };

  const toggleCustomerSection = () => {
    setShowCustomerSection(!showCustomerSection);
  };

  const toggleItemsSection = () => {
    setShowItemSection(!showItemSection);
  };

  const toggleTrasHistorySection = () => {
    setShowTransHistorySection(!showTransHistorySection);
  };

  const resetAll = () => {
    setNewLoan({
      branch_id: cookie.get('user_branch'),
      ddate: moment().format(`YYYY-MM-DD`),
      final_date: moment().format(`YYYY-MM-DD`),
      total_weight: (0).toFixed(2),
      gold_value: (0).toFixed(2),
      required_amount: (0).toFixed(2),
      payable_amount: 0,
      customer_id: '',
      bill_type_id: '',
      bill_count: '',
      stamp_fee_id: '',
      remd_letr_no: '0',
      is_renew: false,
      prev_bill: '',
      user: cookie.get('user_id'),
      status: 'PENDING',
    });

    setCustomer({
      branch_id: cookie.get('user_branch'),
      nic: '',
      id: '',
      name: '',
      other_names: '',
      address_1: '',
      address_2: '',
      telephone: '',
      notes: '',
      is_blacklisted: false,
    });

    setPawningItems([]);

    setAdditionalPawnData({
      duration: 0,
      fm_interest_rate: (0).toFixed(2),
      nm_interest_rate: (0).toFixed(2),
      first_month_interest: (0).toFixed(2),
      next_month_interest: (0).toFixed(2),
      stamp_fee: (0).toFixed(2),
    });

    setIsLoading(false);

    setShowCustomerSection(false);

    setShowItemSection(false);

    setShowTransHistorySection(false);

    setShowTimerModal(false);

    setCustomerNic('');

    setTransactionData([]);

    setLoanHistory([]);

    // setItemCategories([]);

    // setItemConditions([]);

    // setGoldRates([]);

    // setStampFees([]);
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
        <div ref={dataSection}>
          <div className="row">
            <div className="col-sm-6">
              <ul className="nav nav-tabs nav-pills nav-justified">
                <li className="nav-item">
                  <div
                    className="btn btn-sm btn-block"
                    onClick={() => setIsOldPawning(false)}
                  >
                    <div
                      className={isOldPawning ? 'nav-link' : 'nav-link active'}
                    >
                      New Pawninig
                    </div>
                  </div>
                </li>
                <li className="nav-item">
                  <div
                    className="btn btn-sm btn-block"
                    onClick={() => setIsOldPawning(true)}
                  >
                    <a
                      className={isOldPawning ? 'nav-link active' : 'nav-link'}
                    >
                      Existing Pawning
                    </a>
                  </div>
                </li>
              </ul>
            </div>
            <div className="col-sm-6">
              <form onSubmit={fetchCustomerOrBill} className="compactForm">
                <div className="row">
                  <div className="col-sm-11">
                    {isOldPawning ? (
                      <div className="form-group row">
                        <label
                          htmlFor="search_nic"
                          className="col-sm-4 col-form-label"
                        >
                          Bill Number
                        </label>
                        <div className="col-sm-8">
                          <div className="row">
                            <select
                              type="text"
                              className="form-control form-control-sm col-sm-6"
                              id="search_bill_type"
                              name="search_bill_type"
                              placeholder="Type"
                              value={billTypeSearch.bill_type_id}
                              onChange={handlePawningAmountChanges}
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
                                    key={bill.id}
                                    value={bill.id}
                                  >
                                    {bill.des}
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
                              value={billTypeSearch.bill_no}
                              onChange={handlePawningAmountChanges}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="form-group row">
                        <label
                          htmlFor="search_nic"
                          className="col-sm-4 col-form-label"
                        >
                          Customer
                        </label>
                        <div className="col-sm-8">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            id="search_nic"
                            name="search_nic"
                            placeholder="Customer NIC"
                            value={customerNic}
                            onChange={handleCustomerValueChanges}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="col-sm-1">
                    <SystemButton
                      type={'search'}
                      showText={false}
                      btnText="Search.."
                    />
                  </div>
                </div>
              </form>
            </div>
          </div>
          <div className="row compactForm">
            {/* Left column */}
            <div
              className="col-sm-6"
              style={{
                padding: '10px',
                backgroundColor: '#CAE9F5',
              }}
            >
              <div className="form-group row">
                <div className="col-sm-3">
                  <h5>Customer</h5>
                </div>
                <div className="col-sm-8">
                  <div className="form-row">
                    <div className="col-sm-6">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        id="nic"
                        name="nic"
                        placeholder="NIC"
                        value={customer.nic}
                        onChange={handleCustomerValueChanges}
                        onKeyUp={handleCustomerSearch}
                      />
                    </div>
                    <div className="col-sm-1">
                      {isCustLoading ? (
                        <div>
                          <div className="d-flex justify-content-center">
                            <div
                              className="spinner-border spinner-border-sm text-dark"
                              role="status"
                            ></div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <div className="col-sm-5">
                      <div className="form-group row justify-content-end">
                        <label
                          htmlFor="nic"
                          className="col-sm-3 text-right col-form-label"
                        >
                          ID
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-sm col-sm-8"
                          id="id"
                          placeholder="System ID"
                          value={customer.id}
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-sm-1">
                  <SystemButton
                    type={'section-toggle'}
                    collapseState={showCustomerSection}
                    method={() => toggleCustomerSection()}
                    showText={false}
                    disabled={customer.is_blacklisted ? true : false}
                  />
                </div>
              </div>
              {showCustomerSection ? (
                <div>
                  <div className="form-group row">
                    <label
                      htmlFor="old_nic"
                      className="col-sm-4 col-form-label"
                    >
                      Old NIC
                    </label>
                    <div className="col-sm-8">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        id="old_nic"
                        name="old_nic"
                        placeholder="Old NIC number"
                        value={customer.old_nic}
                        onChange={handleCustomerValueChanges}
                      />
                    </div>
                  </div>

                  <div className="form-group row">
                    <label htmlFor="name" className="col-sm-4 col-form-label">
                      Name
                    </label>
                    <div className="col-sm-8">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        id="name"
                        name="name"
                        placeholder="Full name"
                        value={customer.name}
                        onChange={handleCustomerValueChanges}
                      />
                    </div>
                  </div>

                  <div className="form-group row">
                    <label
                      htmlFor="other_names"
                      className="col-sm-4 col-form-label"
                    >
                      Other Names
                    </label>
                    <div className="col-sm-8">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        id="other_names"
                        name="other_names"
                        placeholder="Other names"
                        value={customer.other_names}
                        onChange={handleCustomerValueChanges}
                      />
                    </div>
                  </div>

                  <div className="form-group row">
                    <label
                      htmlFor="telephone"
                      className="col-sm-4 col-form-label"
                    >
                      Telephone
                    </label>
                    <div className="col-sm-8">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        id="telephone"
                        name="telephone"
                        placeholder="Telephone"
                        value={customer.telephone}
                        onChange={handleCustomerValueChanges}
                      />
                    </div>
                  </div>

                  <div className="form-group row">
                    <label
                      htmlFor="address_1"
                      className="col-sm-4 col-form-label"
                    >
                      Postal Address
                    </label>
                    <div className="col-sm-8">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        id="address_1"
                        name="address_1"
                        placeholder="Postal address"
                        value={customer.address_1}
                        onChange={handleCustomerValueChanges}
                      />
                    </div>
                  </div>

                  <div className="form-group row">
                    <label
                      htmlFor="address_2"
                      className="col-sm-4 col-form-label"
                    >
                      Address on NIC
                    </label>
                    <div className="col-sm-8">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        id="address_2"
                        name="address_2"
                        placeholder="Address on NIC"
                        value={customer.address_2}
                        onChange={handleCustomerValueChanges}
                      />
                    </div>
                  </div>

                  <div className="form-group row">
                    <label htmlFor="notes" className="col-sm-4 col-form-label">
                      Notes
                    </label>
                    <div className="col-sm-8">
                      <textarea
                        name="notes"
                        id="notes"
                        name="notes"
                        rows="1"
                        className="form-control form-control-sm"
                        value={customer.notes}
                        onChange={handleCustomerValueChanges}
                      ></textarea>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Right column */}
            <div
              className="col-sm-6"
              style={{
                padding: '10px',
                backgroundColor: '#F0F8FF',
              }}
            >
              <div className="form-group row">
                <div className="col-sm-5">
                  <h5>Loan History</h5>
                </div>
                <div className="col-sm-2">
                  {isHistLoading ? (
                    <div>
                      <div className="d-flex justify-content-center">
                        <div
                          className="spinner-border spinner-border-sm text-dark"
                          role="status"
                        ></div>
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="offset-2 col-sm-3">
                  <SystemButton
                    type={'section-toggle'}
                    collapseState={showTransHistorySection}
                    method={() => toggleTrasHistorySection()}
                    showText={false}
                    disabled={customer.is_blacklisted ? true : false}
                  />
                </div>
              </div>
              <div
                className="row"
                style={{
                  padding: '10px',
                }}
              >
                {showTransHistorySection ? (
                  <div
                    className="table-responsive"
                    style={{
                      height: '160px',
                      overflowY: 'auto',
                    }}
                  >
                    <table className="table table-bordered table-striped table-sm">
                      <thead className="thead-light">
                        <tr>
                          <th scope="col">Branch</th>
                          <th scope="col">Bill Type</th>
                          <th scope="col">No</th>
                          <th scope="col">Date</th>
                          <th scope="col">Gold Weight</th>
                          <th scope="col">Loan Amount</th>
                          {/* <th scope="col">State</th> */}
                        </tr>
                      </thead>
                      <tbody>
                        {loanHistory ? (
                          loanHistory.map((loan) => {
                            return (
                              <tr key={loan.id}>
                                <td>{loan.branch.name}</td>
                                <td>{loan.bill_type.des}</td>
                                <td>{loan.bill_no}</td>
                                <td>{loan.ddate}</td>
                                <td className="text-right">
                                  {loan.total_weight}
                                </td>
                                <td className="text-right">
                                  {loan.required_amount}
                                </td>
                                {/* <td>{loan.state}</td> */}
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="6" className="text-center">
                              No data
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          <form className="compactForm" onSubmit={handleSubmit}>
            <div className="row" style={{ backgroundColor: '#F0F8FF' }}>
              {/* <div>
                <div className="form-group row">
                  <div className="col-sm-5">
                    <h5>Pawning</h5>
                  </div>
                </div>
              </div> */}
              <div className="col-sm-3">
                <div className="form-group">
                  <label htmlFor="bill_type_id">Bill Type</label>
                  <select
                    name="bill_type_id"
                    id="bill_type_id"
                    className="form-control form-control-sm"
                    value={newLoan.bill_type_id}
                    onChange={handlePawningAmountChanges}
                    readOnly={customer.is_blacklisted ? true : false}
                  >
                    <option
                      value=""
                      className="dropdown-item text-muted text-light"
                      disabled
                    >
                      -- Select a bill type
                    </option>
                    {billTypes.map((bill, index) => {
                      return (
                        <option
                          key={index}
                          className="dropdown-item"
                          value={bill.id}
                        >
                          {bill.des}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
              <div className="col-sm-2">
                <div className="form-group">
                  <label htmlFor="bill_type_id">Bill No</label>
                  <input
                    type="text"
                    name="bill_count"
                    id="bill_count"
                    value={newLoan.bill_count}
                    className="form-control form-control-sm font-weight-bold text-right"
                    readOnly
                  />
                </div>
              </div>
              <div className="col-sm-2">
                <label htmlFor="ddate">Pawning date</label>
                <input
                  type="date"
                  name="ddate"
                  id="ddate"
                  className="form-control form-control-sm text-right font-weight-bold"
                  value={newLoan.ddate}
                  onChange={handlePawningAmountChanges}
                  // readOnly={customer.is_blacklisted ? true : false}
                  disabled
                />
              </div>
              <div className="col-sm-2">
                <label htmlFor="duration">Duration</label>
                <input
                  type="text"
                  name="duration"
                  id="duration"
                  className="form-control-plaintext form-control-sm font-weight-bold"
                  value={additionalPawnData.duration}
                  placeholder="-- Select a bill type"
                  readOnly
                />
              </div>
              <div className="col-sm-2">
                <label htmlFor="last_date">Final date</label>
                <input
                  type="text"
                  name="last_date"
                  id="last_date"
                  className="form-control-plaintext form-control-sm font-weight-bold"
                  value={newLoan.final_date}
                  placeholder="-- Select a bill type"
                  readOnly
                />
              </div>
            </div>
            <div className="container bg-white">
              <div className="form-group row bg-white">
                <div className="col-sm-5">
                  <h5>
                    Items &nbsp;
                    {pawningItems ? (
                      <small>
                        <span className="badge badge-pill badge-secondary">
                          {pawningItems.length}
                        </span>
                      </small>
                    ) : null}
                  </h5>
                </div>
                <div className="offset-5 col-sm-2">
                  <SystemButton
                    type={'section-toggle'}
                    collapseState={showItemSection}
                    method={() => toggleItemsSection()}
                    showText={false}
                    classes="btn btn-white btn-block btn-sm"
                    disabled={newLoan.bill_type_id ? false : true}
                  />
                </div>
              </div>
              {showItemSection ? (
                <div className="row">
                  <table className="table table-sm table-bordered table-responsive">
                    <thead className="thead-light text-center">
                      <tr>
                        <th scope="col">#</th>
                        <th scope="col">Category</th>
                        <th scope="col">Item</th>
                        <th scope="col">Condition</th>
                        <th scope="col">Type</th>
                        <th scope="col">Count</th>
                        <th scope="col">Weight(g)</th>
                        <th scope="col">Value(LKR)</th>
                        <th scope="col">
                          <SystemButton
                            type={'add-row'}
                            method={() => addNewItem()}
                            showText={false}
                          />
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-center">
                      {pawningItems.map((item, index) => {
                        return (
                          <tr key={item.index}>
                            <th scope="row">{parseInt(index) + 1}</th>
                            <td>
                              <select
                                name="item_category"
                                id="item_category"
                                data-id={index}
                                className="form-control form-control-sm"
                                value={pawningItems[index].category_id}
                                onChange={filterItemsList}
                                disabled={
                                  customer.is_blacklisted ? true : false
                                }
                              >
                                <option
                                  value=""
                                  className="dropdown-item text-muted text-light"
                                  disabled
                                >
                                  -- Category
                                </option>
                                {itemCategories.map((category) => {
                                  return (
                                    <option
                                      className="dropdown-item"
                                      key={category.id}
                                      value={category.id}
                                    >
                                      {category.description}
                                    </option>
                                  );
                                })}
                              </select>
                            </td>
                            <td>
                              {isItemLoading ? (
                                <div className="d-flex justify-content-center">
                                  <div
                                    className="spinner-border spinner-border-sm text-dark"
                                    role="status"
                                  >
                                    <span className="sr-only">Loading...</span>
                                  </div>
                                </div>
                              ) : (
                                <select
                                  name="item_id"
                                  id="item_id"
                                  data-id={index}
                                  className="form-control form-control-sm"
                                  value={pawningItems[index].item_id}
                                  onChange={handleItemsChange}
                                  disabled={
                                    customer.is_blacklisted ? true : false
                                  }
                                >
                                  <option
                                    value=""
                                    className="dropdown-item text-muted text-light"
                                    disabled
                                  >
                                    {pawningItems[index].items
                                      ? '-- Item'
                                      : '-- Select category'}
                                  </option>
                                  {pawningItems[index].items.map((row) => {
                                    return (
                                      <option
                                        className="dropdown-item"
                                        key={row.id}
                                        value={row.id}
                                      >
                                        {row.name}
                                      </option>
                                    );
                                  })}
                                </select>
                              )}
                            </td>
                            <td>
                              <select
                                name="item_condition_id"
                                id="item_condition_id"
                                data-id={index}
                                className="form-control form-control-sm"
                                value={pawningItems[index].item_condition_id}
                                onChange={handleItemsChange}
                                disabled={
                                  customer.is_blacklisted ? true : false
                                }
                              >
                                <option
                                  value=""
                                  className="dropdown-item text-muted text-light"
                                  disabled
                                >
                                  -- Condition
                                </option>
                                {itemConditions.map((condition) => {
                                  return (
                                    <option
                                      className="dropdown-item"
                                      key={condition.id}
                                      value={condition.id}
                                    >
                                      {condition.description}
                                    </option>
                                  );
                                })}
                              </select>
                            </td>
                            <td>
                              <select
                                name="gold_rate_id"
                                id="gold_rate_id"
                                data-id={index}
                                className="form-control form-control-sm"
                                value={pawningItems[index].gold_rate_id}
                                onChange={handleItemsChange}
                                disabled={
                                  customer.is_blacklisted ? true : false
                                }
                              >
                                <option
                                  value=""
                                  className="dropdown-item text-muted text-light"
                                  disabled
                                >
                                  -- Type
                                </option>
                                {goldRates.map((type) => {
                                  return (
                                    <option
                                      className="dropdown-item"
                                      key={type.id}
                                      value={type.id}
                                    >
                                      {type.gold_types.category}
                                    </option>
                                  );
                                })}
                              </select>
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm text-right"
                                name="qty"
                                id="qty"
                                data-id={index}
                                min="1"
                                step="1"
                                value={pawningItems[index].qty}
                                onChange={handleItemsChange}
                                disabled={
                                  customer.is_blacklisted ? true : false
                                }
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm text-right"
                                name="gold_weight"
                                id="gold_weight"
                                data-id={index}
                                min="0.000"
                                step="0.001"
                                value={pawningItems[index].gold_weight}
                                onChange={handleItemsChange}
                                disabled={
                                  customer.is_blacklisted ? true : false
                                }
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-control-plaintext form-control-sm text-right"
                                name="gold_value"
                                id="gold_value"
                                data-id={index}
                                value={pawningItems[index].gold_value}
                                onChange={handleItemsChange}
                                readOnly
                              />
                            </td>
                            <td>
                              <SystemButton
                                type={'remove-row'}
                                method={() =>
                                  removeItem(pawningItems[index].index)
                                }
                                showText={false}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="6" className="text-center">
                          Total
                        </td>
                        <td className="text-right font-weight-bold">
                          {parseFloat(newLoan.total_weight).toFixed(2)}
                        </td>
                        <td className="text-right font-weight-bold">
                          {parseFloat(newLoan.gold_value).toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : null}
            </div>
            <div className="row">
              <div className="col-sm-3">
                <div className="form-group">
                  <label htmlFor="fm_interest_rate">
                    First month interest rate
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm text-right font-weight-bold"
                    id="fm_interest_rate"
                    name="fm_interest_rate"
                    value={additionalPawnData.fm_interest_rate}
                    readOnly
                  />
                </div>
              </div>
              <div className="col-sm-3">
                <div className="form-group">
                  <label htmlFor="nm_interest_rate">
                    Other months' interest rate
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm text-right font-weight-bold"
                    id="nm_interest_rate"
                    name="nm_interest_rate"
                    value={additionalPawnData.nm_interest_rate}
                    readOnly
                  />
                </div>
              </div>
              <div className="col-sm-3">
                <div className="form-group">
                  <label htmlFor="stamp_fee">Stamp Fee</label>
                  <input
                    type="text"
                    className="form-control form-control-sm text-right font-weight-bold"
                    id="stamp_fee"
                    name="stamp_fee"
                    value={additionalPawnData.stamp_fee}
                    readOnly
                  />
                </div>
              </div>
              <div className="col-sm-3">
                <div className="form-group">
                  <label htmlFor="stamp_fee">Payable Amount</label>
                  <input
                    type="number"
                    className="form-control form-control-sm text-right font-weight-bold"
                    id="payable_amount"
                    name="payable_amount"
                    min="0.00"
                    step="0.01"
                    value={newLoan.payable_amount}
                    onChange={handlePawningAmountChanges}
                    readOnly={
                      customer.is_blacklisted ||
                      newLoan.bill_type_id === '' ||
                      newLoan.gold_value == 0
                        ? true
                        : false
                    }
                  />
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-sm-3">
                <div className="form-group">
                  <label htmlFor="fm_interest">First month interest</label>
                  <input
                    type="text"
                    className="form-control form-control-sm text-right font-weight-bold"
                    id="fm_interest"
                    name="fm_interest"
                    value={additionalPawnData.first_month_interest}
                    readOnly
                  />
                </div>
              </div>
              <div className="col-sm-3">
                <div className="form-group">
                  <label htmlFor="nm_interest">Other months' interest</label>
                  <input
                    type="text"
                    className="form-control form-control-sm text-right font-weight-bold"
                    id="nm_interest"
                    name="nm_interest"
                    value={additionalPawnData.next_month_interest}
                    readOnly
                  />
                </div>
              </div>
              <div className="offset-2 col-sm-4">
                <div className="form-group row">
                  <label
                    htmlFor="required_amount"
                    className="col-sm-6 col-form-label"
                    style={{ fontSize: '20px' }}
                  >
                    Loan Amount
                  </label>
                  <div className="col-sm-6">
                    <input
                      type="text"
                      className="form-control-plaintext form-control-lg text-right font-weight-bold"
                      id="required_amount"
                      name="required_amount"
                      min="0.00"
                      step="0.01"
                      value={newLoan.required_amount}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>
            {isOldPawning ? (
              <div className="row justify-content-end">
                <div className="col-sm-2">
                  <SystemButton
                    type={'delete'}
                    showText={true}
                    btnText="Cancel Bill"
                    disabled={customer.is_blacklisted ? true : false}
                    method={cancelBill}
                  />
                </div>
                <div className="col-sm-2">
                  <SystemButton
                    type={'load'}
                    showText={true}
                    btnText="Renew Loan"
                    method={renew}
                  />
                </div>
                <div className="col-sm-2">
                  <SystemButton type={'print'} showText={true} />
                </div>
                {/* <div className="col-sm-2">
                    <div className="row">
                    </div>
                  </div> */}
              </div>
            ) : null}
            {isOldPawning ? null : (
              <div className="row">
                <div className="col-sm-2">
                  <div className="custom-control custom-switch">
                    <input
                      type="checkbox"
                      className={
                        newLoan.is_renew
                          ? `custom-control-input is-valid`
                          : `custom-control-input`
                      }
                      id="is_renew"
                      name="is_renew"
                      checked={newLoan.is_renew}
                      onChange={handlePawningAmountChanges}
                    />
                    <label className="custom-control-label" htmlFor="is_renew">
                      Renewal
                      {/* {newLoan.is_renew ? `Renewal` : `New Pawning`} */}
                    </label>
                  </div>
                </div>
                <div className="col-sm-2">
                  <div className="form-group">
                    <input
                      type={newLoan.is_renew ? 'text' : 'hidden'}
                      className="form-control-sm font-weight-bold"
                      id="prev_bill"
                      name="prev_bill"
                      value={newLoan.prev_bill}
                      onChange={handlePawningAmountChanges}
                      placeholder="Old bill number"
                    />
                  </div>
                </div>
                <div className="offset-3 col-sm-2">
                  <SystemButton
                    type={'reset'}
                    showText={true}
                    disabled={customer.is_blacklisted ? true : false}
                  />
                </div>
                <div className="col-sm-3">
                  <SystemButton
                    type={'save'}
                    showText={true}
                    disabled={customer.is_blacklisted ? true : false}
                  />
                </div>
              </div>
            )}
          </form>
          <br />
        </div>
      )}

      {/* Timer modal componenet */}
      <UnclosableModal modalState={showTimerModal}>
        <div className="container">
          <br />
          <div className="row">
            <div className="col-sm-7">
              <h5>
                Pawning approval request sent. Please wait for the response..
              </h5>
              <br />
              <h6>Reference number</h6>
              <h2>{approvalRefNo}</h2>
            </div>
            <div className="offset-1 col-sm-4">
              <CountdownCircleTimer
                isPlaying
                duration={300}
                colors={'#004777'}
                onComplete={() => [true, 1000]}
              >
                {approvalTimerText}
              </CountdownCircleTimer>
            </div>
          </div>
          <br />
        </div>
      </UnclosableModal>
      {/* End of timer modal componenet */}
    </div>
  );

  /* --- End of component renders --- */
};

export default Loans;
