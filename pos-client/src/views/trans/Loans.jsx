import React, { useState, useEffect, useRef } from 'react';
import { api, cookie, msg, print, roundup } from './../../services';
import moment from 'moment';
import {
  SystemButton,
  UnclosableModal,
  FormModal,
  Alert,
} from '../../components';
import { v4 as uuidv4 } from 'uuid';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';

/**
 * TODO : Declare one state to hold all states for showing and hiding sections and declare each in that state (like done in the loading states)
 */

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

  const [loanHistory, setLoanHistory] = useState({
    loans: [],
    loanItems: [],
    redeems: [],
    others: [],
    redeem_count: 0,
    other_count: 0,
    redeemed_total: 0,
    pawning_total: 0,
  });

  const [itemCategories, setItemCategories] = useState([]);

  const [itemConditions, setItemConditions] = useState([]);

  const [goldRates, setGoldRates] = useState([]);

  const [approvalRefNo, setApprovalRefNo] = useState('');

  const [billTypes, setBillTypes] = useState([]);

  const [stampFees, setStampFees] = useState([]);

  const [interestRates, setInterestRates] = useState([]);

  const [newLoan, setNewLoan] = useState({
    branch_id: cookie.get('user_branch'),
    ddate: moment().format(`YYYY-MM-DD`),
    final_date: '',
    total_weight: (0).toFixed(2),
    gold_value: (0).toFixed(2),
    required_amount: (0).toFixed(2),
    payable_amount: '',
    customer_id: '',
    bill_type_id: '',
    bill_count: '',
    interest_rate_id: '',
    stamp_fee_id: '',
    remd_letr_no: '0',
    is_renew: false,
    prev_bill_type: '',
    prev_bill_no: '',
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
    maxPrevBillNum: 0,
    refNo: '',
  });

  const [isLoading, setIsLoading] = useState({
    init: false,
    customer: false,
    items: false,
    history: false,
    billCount: false,
    newBillno: false,
  });

  // const [showTimerModal, setShowTimerModal] = useState(false);

  const [showSectionStates, setShowSectionStates] = useState({
    customerSection: true,
    itemSection: false,
    transHistorySection: true,
    timerModal: false,
    historyModal: false,
    historyModalType: 'items',
    quickRenewModal: false,
    oldPawningItems: false,
  });

  const [renewData, setRenewData] = useState({
    branch_id: cookie.get('user_branch'),
    oldLoanId: '',
    newBillTypeId: '',
    newBillno: '',
    newAmount: '',
    newPawningDate: moment().format(`YYYY-MM-DD`),
  });

  const [additionalRenewData, setAdditionalRenewData] = useState({
    newDuration: '',
    newMonths: '',
    newFinalDate: '',
    newGoldRates: [],
    newInterestrates: [],
  });

  /* --- End of state declarations --- */

  /* --- Reference declarations --- */

  const dataSection = useRef(null);

  const cusNameControl = useRef(null);

  const itemQtyControl = useRef(null);

  /* --- End of referance declarations --- */

  useEffect(() => {
    fetchData();
  }, []);

  /* --- Component functions --- */

  const fetchData = async () => {
    try {
      setIsLoading({
        ...isLoading,
        init: true,
      });

      const response = await api.get(`newLoan/${cookie.get('user_branch')}`);
      console.log(response.data);

      setBillTypes(response.data.bill_types);

      setItemCategories(response.data.category);

      setItemConditions(response.data.itemConditions);

      setStampFees(response.data.stamp_fee);

      // setBillCounts(response.data.bill_counts);

      setIsLoading({
        ...isLoading,
        init: false,
      });
    } catch (error) {
      return msg.error('Unable to fetch data!');
    }
  };

  const fetchCustomerOrBill = async () => {
    resetAll();
    try {
      if (isOldPawning) {
        // If searched by bill number
        setIsLoading({
          ...isLoading,
          customer: true,
          history: true,
        });

        const response = await api.post(`showLoan`).values({
          branch_id: cookie.get('user_branch'),
          bill_type_id: billTypeSearch.bill_type_id,
          bill_no: billTypeSearch.bill_no,
        });

        console.log(response.data[0]);

        if (response.data.message) {
          msg.error(response.data.message);
          setIsLoading({
            ...isLoading,
            customer: false,
            history: false,
          });
          return;
        } else {
          let itemsArr = [];
          let loanTransArr = [];
          let stampFee = 0;
          let fmInt = 0;
          let adjustment = 0;
          let requiredAmt = 0;
          let refNo = '';

          setRenewData({
            ...renewData,
            oldLoanId: response.data[0].id,
            newAmount: response.data[0].loan_capital,
          });

          setCustomer({
            branch_id: cookie.get('user_branch'),
            nic: response.data[0].customer.nic,
            old_nic: response.data[0].customer.old_nic,
            id: response.data[0].customer.id,
            name: response.data[0].customer.name,
            other_names: response.data[0].customer.other_names,
            address_1: response.data[0].customer.address_1,
            address_2: response.data[0].customer.address_2,
            telephone: response.data[0].customer.telephone,
            notes: response.data[0].customer.notes,
            allowed_bills: response.data[0].customer.allowed_bills,
            is_blacklisted: response.data[0].customer.is_blacklisted,
          });

          response.data[0].loan_trans.forEach((trans) => {
            if (trans.trans_type_id === 11) {
              fmInt = trans.amount;
            }

            if (trans.trans_type_id === 10) {
              stampFee = trans.amount;
            }

            if (trans.trans_type_id === 23) {
              adjustment = trans.amount;
            }

            if (trans.trans_type_id === 1) {
              requiredAmt = trans.amount;
            }

            loanTransArr.push({
              ref_no: trans.ref_no,
              ddate: trans.ddate,
              trans_type_id: trans.trans_type_id,
              amount: trans.amount,
              bill_extended_period: trans.bill_extended_period,
            });

            refNo = trans.ref_no;
          });

          setTransactionData(loanTransArr);

          // prettier-ignore
          setNewLoan({
            id: response.data[0].id,
            branch_id: cookie.get('user_branch'),
            ddate: response.data[0].ddate,
            final_date: response.data[0].final_date,
            total_weight: response.data[0].total_weight,
            gold_value: response.data[0].gold_value,
            required_amount: parseFloat(response.data[0].required_amount).toFixed(2),
            payable_amount: parseFloat(response.data[0].loan_capital).toFixed(2),
            customer_id: response.data[0].customer_id,
            bill_type_id: response.data[0].bill_type_id,
            bill_count: response.data[0].bill_no,
            stamp_fee_id: '',
            remd_letr_no: '',
            user: cookie.get('user_id'),
            status: 'PENDING',
          });
          // prettier-ignore-end

          // prettier-ignore
          setAdditionalPawnData({
            ...additionalPawnData,
            duration: response.data[0].bill_type.period.des,
            months: response.data[0].bill_type.period.months,
            fm_interest_rate: parseFloat(response.data[0].int_rate.fm_interest_rate).toFixed(2),
            nm_interest_rate: parseFloat(response.data[0].int_rate.nm_interest_rate).toFixed(2),
            first_month_interest: parseFloat((parseFloat(response.data[0].int_rate.fm_interest_rate) * parseFloat(response.data[0].required_amount)) / 100).toFixed(2),
            next_month_interest: parseFloat((parseFloat(response.data[0].int_rate.nm_interest_rate) * parseFloat(response.data[0].required_amount)) / 100).toFixed(2),
            stamp_fee: parseFloat(response.data[0].stamp_fee.stamp_fee).toFixed(2),
            refNo: refNo,
          });
          // prettier-ignore-end

          // prettier-ignore
          response.data[0].loan_item.forEach((item) => {
            itemsArr.push({
              index: uuidv4(),
              id: item.id,
              category_id: item.item.category_id,
              items: [item.item],
              item_id: item.item_id,
              qty: item.qty,
              item_condition_id: item.item_condition_id,
              gold_rate: parseFloat(item.gold_rate.rate).toFixed(2),
              gold_rate_id: item.gold_rate_id,
              gold_weight: parseFloat(item.gold_weight).toFixed(2),
              gold_value: parseFloat(parseFloat(parseFloat(item.gold_weight) * parseFloat(item.gold_rate.rate)) / parseFloat(8.0)).toFixed(2),
              item_density: item.item_density,
            });
          });
          // prettier-ignore-end

          setPawningItems(itemsArr);

          setGoldRates(response.data[0].bill_type.gold_rate);

          // Fetch customer's pawning history by id
          const custHistory = await api.get(
            `cust-history/${response.data[0].customer.id}`,
          );
          console.log(custHistory.data[0]);
          setLoanHistory({
            ...loanHistory,
            loans: custHistory.data[0].loan,
            redeem_count: custHistory.data[0].redeem_count,
            other_count: custHistory.data[0].other_count,
            redeemed_total: custHistory.data.redeemedAmountTot,
            pawning_total: custHistory.data.pawningAmountTot,
          });

          setIsLoading({
            ...isLoading,
            customer: false,
            history: false,
          });

          setShowSectionStates({
            ...showSectionStates,
            customerSection: true,
            transHistorySection: true,
            itemSection: true,
          });
        }
      } else {
        // If searched by NIC

        setCustomer({
          ...customer,
          nic: customerNic,
        });

        setIsLoading({
          ...isLoading,
          customer: true,
        });

        const response = await api.get(`showCustomer/${customerNic}`);

        console.log(response);

        if (response.data.errMessage) {
          msg.error(response.data.errMessage);

          if (response.data.blacklisted) {
            setCustomer({
              ...customer,
              notes: response.data.blacklisted,
              is_blacklisted: true,
            });
            if (cookie.get('permissions').full_edit_customer) {
              msg.info_stick(response.data.blacklisted);
            }
          } else {
            setCustomer({
              ...customer,
              nic: customerNic,
            });
            cusNameControl.current.focus();
          }

          setIsLoading({
            ...isLoading,
            customer: false,
            history: false,
          });
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

          setIsLoading({
            ...isLoading,
            customer: false,
            history: true,
          });

          window.scrollTo(0, dataSection.current.offsetTop);

          const custHistory = await api.get(
            `cust-history/${response.data[0].id}`,
          );

          console.log(`------------------------------------`);
          console.log(custHistory);
          console.log(`------------------------------------`);

          setLoanHistory({
            ...loanHistory,
            loans: custHistory.data[0].loan,
            redeem_count: custHistory.data[0].redeem_count,
            other_count: custHistory.data[0].other_count,
            redeemed_total: custHistory.data.redeemedAmountTot,
            pawning_total: custHistory.data.pawningAmountTot,
          });

          setIsLoading({
            ...isLoading,
            history: false,
          });

          if (
            parseInt(response.data[0].loan_count) >=
            parseInt(response.data[0].allowed_bills)
          ) {
            if (
              window.confirm(
                'This customers bill pawning limit is exceeded! Do you want to send it for approval?',
              )
            ) {
              sendToCustomerApproval(
                response.data[0].id,
                response.data[0].allowed_bills,
              );

              setNewLoan({
                ...newLoan,
                bill_type_id: '',
                bill_count: '',
                customer_id: response.data[0].id,
              });

              setBillTypeSearch({
                bill_type_id: '',
                bill_no: '',
              });
            } else {
              resetAll();
            }
          } else {
            setNewLoan({
              ...newLoan,
              bill_type_id: '',
              bill_count: '',
              customer_id: response.data[0].id,
            });

            setBillTypeSearch({
              bill_type_id: '',
              bill_no: '',
            });
          }

          // setShowSectionStates({
          //   ...showSectionStates,
          //   customerSection: true,
          //   transHistorySection: true,
          // });
        }
      }
    } catch (error) {
      setIsLoading({
        ...isLoading,
        init: false,
      });

      return msg.error('Unable to fetch data!');
    }
  };

  const filterItemsList = async (e) => {
    const datasetId = e.target.dataset.id;
    const targetValue = e.target.value;

    try {
      setIsLoading({
        ...isLoading,
        items: true,
      });

      const response = await api.get(`items-by-category/${targetValue}`);

      setPawningItems(
        [...pawningItems],
        (pawningItems[datasetId].category_id = targetValue),
        (pawningItems[datasetId].items = response.data),
        (pawningItems[datasetId].item_id = ''),
      );
    } catch (error) {
      return msg.error(error);
    } finally {
      setIsLoading({
        ...isLoading,
        items: false,
      });
    }
  };

  const validateControlValues = (input, value) => {
    /**
     * This function can be used to validate any input value when the onChange (or onKeyPress, or onKeyDown, or whatever tf you like...) event fires
     * Pass the form element's name as the 1st parameter, @param {any} input
     * And the value needs to be validated as the 2nd, @param {any} value
     * Use the promise to do any required validation and resolve with true
     * Don't use reject coz it's not handled in the onChange event
     */

    return new Promise((resolve, reject) => {
      if (input === 'qty') {
        if (value === '') {
          resolve(true);
        } else {
          if (isNaN(value) || value.includes('.')) {
            msg.warning('Quantity can only be an integer');
          } else {
            resolve(true);
          }
        }
      } else if (input === 'gold_weight') {
        if (value === '') {
          resolve(true);
        } else {
          if (isNaN(value)) {
            msg.warning('Gold weight must be a number');
          } else if (
            value.indexOf('.') != -1
              ? value.substring(value.indexOf('.') + 1).length > 3
              : false
          ) {
            msg.warning(
              'Gold weight must NOT exceed 3 values after the decimal point',
            );
          } else {
            resolve(true);
          }
        }
      } else if (input === 'payable_amount') {
        if (value === '') {
          msg.warning('Amount should not be empty');
          resolve(true);
        } else {
          if (isNaN(value)) {
            msg.warning('Loan amount must be a number');
          } else if (
            value.indexOf('.') != -1
              ? value.substring(value.indexOf('.') + 1).length > 2
              : false
          ) {
            msg.warning(
              'Loan amount must NOT exceed 2 values after the decimal point',
            );
          } else {
            resolve(true);
          }
        }
      } else {
        resolve(true);
      }
    });
  };

  const selectAllText = (e) => {
    e.target.select();
  };

  const handleItemsChange = async (e) => {
    const targetInput = e.target;
    const datasetId = targetInput.dataset.id;
    const inputName = targetInput.name;
    const inputValue = targetInput.value;
    const setOfItems = [...pawningItems];

    const validated = await validateControlValues(inputName, inputValue);

    if (validated) {
      setOfItems[datasetId][inputName] = inputValue;
      setPawningItems(setOfItems);
    }

    if (inputName === 'gold_weight' || inputName === 'gold_rate_id') {
      if (
        pawningItems[datasetId].gold_weight &&
        pawningItems[datasetId].gold_rate_id
      ) {
        calItemValue(inputName, datasetId, inputValue);
      } else {
        calItemValue(inputName, datasetId, 0);
      }
    }
  };

  const calItemValue = (inputName, index, inputVal) => {
    // prettier-ignore
    let rateData = goldRates.filter(
      (rate) =>
        parseInt(rate.id) === parseInt(pawningItems[index].gold_rate_id),
    );

    let setOfItems = [...pawningItems];

    Promise.all(rateData).then((res) => {
      if (inputName === 'gold_weight') {
        setOfItems[index]['gold_value'] = (
          (parseFloat(res[0].rate).toFixed(2) / parseFloat(8.0).toFixed(3)) *
          parseFloat(inputVal).toFixed(3)
        ).toFixed(2);

        setPawningItems(setOfItems);
      } else if (inputName === 'gold_rate_id') {
        setOfItems[index]['gold_value'] = (
          (parseFloat(res[0].rate).toFixed(2) / parseFloat(8.0).toFixed(3)) *
          parseFloat(pawningItems[index].gold_weight).toFixed(3)
        ).toFixed(2);
        setOfItems[index]['gold_rate'] = parseFloat(res[0].rate).toFixed(2);

        setPawningItems(setOfItems);
      }
    });
    // prettier-ignore-end
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
      setIsOldPawning(false);
      fetchCustomerOrBill(dataSection);
    }
  };

  const handleBillSearch = (e) => {
    if (e.keyCode === 13) {
      setIsOldPawning(true);
      fetchCustomerOrBill(dataSection);
    }
  };

  const handleCustomerValueChanges = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue =
      targetInput.type === 'checkbox' ? targetInput.checked : targetInput.value;

    if (inputName === 'nic') {
      setIsOldPawning(false);
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

    const validated = await validateControlValues(inputName, inputValue);

    if (validated) {
      if (inputName === 'bill_count') {
        setIsOldPawning(true);
        setBillTypeSearch({
          ...billTypeSearch,
          bill_no: inputValue,
        });
        setNewLoan({
          ...newLoan,
          bill_count: inputValue,
        });
      }

      if (inputName === 'bill_type_id') {
        setBillTypeSearch({
          ...billTypeSearch,
          bill_type_id: inputValue,
        });

        billTypes.map(async (bill) => {
          if (parseInt(bill.id) === parseInt(inputValue)) {
            setIsLoading({
              ...isLoading,
              billCount: true,
            });

            const response = await api.get(
              `bill-count/${cookie.get('user_branch')}/${inputValue}`,
            );

            setNewLoan({
              ...newLoan,
              bill_count: parseInt(response.data) + parseInt(1),
              bill_type_id: bill.id,
              final_date: moment(newLoan.ddate)
                .add(bill.period.months, 'months')
                .format('YYYY-MM-DD'),
              gold_value: 0,
              total_weight: 0,
            });

            setGoldRates(bill.gold_rate);

            setInterestRates(bill.int_rate);

            setAdditionalPawnData({
              ...additionalPawnData,
              duration: bill.period.des,
              months: bill.period.months,
            });

            setIsLoading({
              ...isLoading,
              billCount: false,
            });
          }

          setPawningItems([
            {
              index: uuidv4(),
              category_id: '',
              items: [],
              item_id: '',
              qty: '',
              item_condition_id: '',
              gold_rate_id: '',
              gold_rate: '',
              gold_weight: '',
              gold_value: '',
              item_density: '',
            },
          ]);
        });

        setShowSectionStates({
          ...showSectionStates,
          itemSection: true,
        });
      }

      if (inputName === 'ddate') {
        setNewLoan({
          ...newLoan,
          ddate: inputValue,
          final_date: moment(inputValue)
            .add(additionalPawnData.months, 'months')
            .format('YYYY-MM-DD'),
        });
      }

      if (inputName === 'is_renew') {
        setNewLoan({
          ...newLoan,
          [inputName]: inputValue,
        });
      }

      if (inputName === 'prev_bill_type') {
        setNewLoan({
          ...newLoan,
          prev_bill_type: inputValue,
        });

        const response = await api.get(
          `bill-count/${cookie.get('user_branch')}/${inputValue}`,
        );

        setAdditionalPawnData({
          ...additionalPawnData,
          maxPrevBillNum: response.data,
        });
      }

      if (inputName === 'prev_bill_no') {
        if (inputValue <= additionalPawnData.maxPrevBillNum) {
          setNewLoan({
            ...newLoan,
            prev_bill_no: inputValue,
          });
        } else {
          msg.error_stick(
            `Bill number for the selected bill type cannot exceed ${additionalPawnData.maxPrevBillNum}`,
          );
        }
      }

      if (inputName === 'payable_amount') {
        const stamp_fee = await selectStampFee(inputValue);

        const int_amounts = await calInterestAndAmount(
          inputValue,
          stamp_fee.fee,
        );

        /**
         * NOTE Pawning amount (required amount) is rounded to the next multiple of 5
         *
         * NOTE Calculation goes like following
         * Payable Alount + (Payable Alount * FM Interest Rate) + ((Payable Alount * FM Interest Rate) * FM Interest Rate) + Stamp Fee
         * An interest for the first month interst is calculated again and added to the loan amount
         */

        // prettier-ignore
        const requiredOriginal = parseFloat(int_amounts.req_amount_original).toFixed(2);
        // prettier-ignore-end

        // prettier-ignore
        const required = parseFloat(int_amounts.req_amount).toFixed(2);
        // prettier-ignore-end

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
            amount: parseFloat(int_amounts.final_fm_interest),
            bill_extended_period: '4',
          },
          {
            ddate: newLoan.ddate,
            trans_type_id: '10',
            amount: stamp_fee.fee,
            bill_extended_period: '4',
          },
          {
            ddate: newLoan.ddate,
            trans_type_id: '23',
            amount: parseFloat(required) - parseFloat(requiredOriginal),
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

        // prettier-ignore
        setAdditionalPawnData({
          ...additionalPawnData,
          stamp_fee: parseFloat(stamp_fee.fee).toFixed(2),
          fm_interest_rate: parseFloat(int_amounts.fm_interest_rate).toFixed(2),
          nm_interest_rate: parseFloat(int_amounts.nm_interest_rate).toFixed(2),
          first_month_interest: parseFloat(int_amounts.final_fm_interest).toFixed(2),
          next_month_interest: parseFloat(int_amounts.nm_interest).toFixed(2),
        });
        // prettier-ignore-end
      }

      if (inputName === 'required_amount') {
        setTransactionData([
          {
            ref_no: additionalPawnData.refNo,
            ddate: newLoan.ddate,
            trans_type_id: '1',
            amount: inputValue,
            bill_extended_period: '0',
          },
          {
            ref_no: additionalPawnData.refNo,
            ddate: newLoan.ddate,
            trans_type_id: '11',
            amount: parseFloat(
              parseFloat(inputValue) -
                parseFloat(additionalPawnData.stamp_fee) -
                parseFloat(newLoan.payable_amount),
            ).toFixed(2),
            bill_extended_period: '0',
          },
        ]);

        setNewLoan({
          ...newLoan,
          required_amount: inputValue,
        });

        setAdditionalPawnData({
          ...additionalPawnData,
          first_month_interest: parseFloat(
            parseFloat(inputValue) -
              parseFloat(additionalPawnData.stamp_fee) -
              parseFloat(newLoan.payable_amount),
          ).toFixed(2),
        });
      }
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

  const calInterestAndAmount = async (inputValue, stampFee) => {
    let rate_id = 0;
    let fm_interest = 0; // First month interest
    let nm_interest = 0; // Interest from the second month
    let fm_interest_rate = 0; // First month interest rate
    let nm_interest_rate = 0; // Interest from the second month rate
    let extra_interest = 0; // Dat extra interest taken unfairly from customers
    let final_fm_interest = 0; // Interest for the bill amount (NOT the capital) after even taking the extra interest. Low key theives 💰
    let req_amount = 0; //
    let req_amount_original = 0; //

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

    extra_interest =
      (parseFloat(fm_interest) * parseFloat(fm_interest_rate)) / 100;

    // prettier-ignore
    req_amount_original = parseFloat((parseFloat(inputValue) + parseFloat(fm_interest) + parseFloat(extra_interest) + parseFloat(stampFee))).toFixed(2);
    // prettier-ignore-end
    // prettier-ignore
    req_amount = await roundup.pawning(parseFloat(inputValue) + parseFloat(fm_interest) + parseFloat(extra_interest) + parseFloat(stampFee));
    // prettier-ignore-end

    // prettier-ignore
    final_fm_interest = parseFloat(parseFloat(req_amount) * parseFloat(fm_interest_rate)) / 100;
    // prettier-ignore-end

    nm_interest =
      ((parseFloat(inputValue) +
        parseFloat(fm_interest) +
        parseFloat(stampFee)) *
        parseFloat(nm_interest_rate)) /
      100;

    return {
      fm_interest_rate,
      nm_interest_rate,
      rate_id,
      fm_interest,
      nm_interest,
      extra_interest,
      final_fm_interest,
      req_amount,
      req_amount_original,
    };
  };

  const handleRenewValueChanges = async (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue =
      targetInput.type === 'checkbox' ? targetInput.checked : targetInput.value;

    if (inputName === 'new_bill_type_id') {
      try {
        setIsLoading({
          ...isLoading,
          newBillno: true,
        });

        const response = await api.get(
          `bill-count/${cookie.get('user_branch')}/${inputValue}`,
        );

        setRenewData({
          ...renewData,
          newBillTypeId: inputValue,
          newBillno: parseInt(response.data) + parseInt(1),
        });

        billTypes.forEach(async (bill) => {
          if (parseInt(bill.id) === parseInt(inputValue)) {
            setAdditionalRenewData({
              ...additionalRenewData,
              newDuration: bill.period.des,
              newMonths: bill.period.months,
              newFinalDate: moment(newLoan.ddate)
                .add(bill.period.months, 'months')
                .format('YYYY-MM-DD'),
              newGoldRates: bill.gold_rate,
              newInterestrates: bill.int_rate,
            });
          }
        });
      } catch (error) {
        msg.error('Unable to fetch bill count');
        console.log(error);
      } finally {
        setIsLoading({
          ...isLoading,
          newBillno: false,
        });
      }
    }
  };

  // Validate data prior to saving
  const validator = async () => {
    let state = true;
    let message = '';

    if (customer.name == '') {
      state = false;
      message = 'Customer name cannot be empty';
    }
    if (customer.address_1 == '' || customer.address_2 == '') {
      state = false;
      message = `Customer's address cannot be empty`;
    }
    if (customer.telephone == '') {
      state = false;
      message = `Customer's telephone number cannot be empty`;
    }

    return {
      state: state,
      message: message,
    };
  };

  const handleSubmit = async () => {
    const validated = await validator();

    if (validated.state) {
      if (
        parseFloat(newLoan.gold_value) < parseFloat(newLoan.required_amount)
      ) {
        await sendToOverAdvanceApproval();
      } else {
        await save();
        resetAll();
      }
    } else {
      msg.error(validated.message);
      return;
    }
  };

  const handleRenewSubmit = () => {
    msg.info_stick(
      `\u{1F6A7} Sorry! We're doing some work on this feature at the moment \u{1F6A7}`,
    );
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

      // setShowTimerModal(true);
      setShowSectionStates({
        ...showSectionStates,
        timerModal: true,
      });

      checkOverAdvanceApprovalStatus(response.data);
    } catch (error) {
      msg.error(error);
      return console.log(error);
    }
  };

  const sendToCustomerApproval = async (cusId, allowedBills) => {
    //prettier-ignore
    try {
      const response = await api.post('sendCustReleaseRequset').values({
        customer_id: cusId,
        allowed_bills: allowedBills,
        branch_id: cookie.get('user_branch'),
        user_id: cookie.get('user_id'),
      });

      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err[0]);
        });
        return;
      }
      setApprovalRefNo(response.data);

      // setShowTimerModal(true);
      setShowSectionStates({
        ...showSectionStates,
        timerModal: true,
      });

      checkCustomerApprovalStatus(response.data);
    } catch (error) {
      msg.error(error);
      return console.log(error);
    }
    //prettier-ignore-end
  };

  const endTimer = () => {
    // setShowTimerModal(false);
    setShowSectionStates({
      ...showSectionStates,
      timerModal: false,
    });
    // resetAll();
    msg.info('Please contact the admin for approval');
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

  const reprintPawningBill = async () => {
    try {
      const response = await api.get(`show-loan-by-id/${newLoan.id}`);

      console.log(response.data);

      if (response.data.message) {
        msg.error(`${response.data.message}`);
      } else {
        msg.success(`Done`);
        print.pawningBill(response.data);
      }
    } catch (error) {
      msg.error(error);
      return console.log(error);
    }
  };

  const updatePawning = async () => {
    try {
      const response = await api.post('updatePawning').values({
        customer: customer,
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

      if (response.data.errMessage) {
        msg.error(`${response.data.errMessage}`);
      } else {
        msg.success(response.data);
        resetAll();
      }
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
              gold_rate: '',
              gold_weight: '',
              gold_value: '',
              item_density: '',
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
              gold_rate: '',
              gold_weight: '',
              gold_value: '',
              item_density: '',
            },
          ]);
        }
      }, 200);
    }
  };

  const renew = async () => {
    // console.log(loanId);
    // msg.info_stick(
    //   `This feature is under construction!! Please try again later`,
    // );

    // prettier-ignore
    if (window.confirm(`Are you sure you want re-new this pawning? NOTE: This will redeem this pawning and add new one under a new bill number`)) {
      setShowSectionStates({
        ...showSectionStates,
        quickRenewModal: true,
      });
      // try {
      //   const response = await api.post('renewPawning').values({
      //     loan_id: loanId,
      //   });

      //   if (response.error) {
      //     Object.values(response.error).forEach((err) => {
      //       msg.error(err[0]);
      //     });
      //     return;
      //   }

      //   msg.success(response.data);
      // } catch (error) {
      //   msg.error(error);
      //   return console.log(error);
      // }
    }
    // prettier-ignore-end
  };

  const checkOverAdvanceApprovalStatus = async (approval_id) => {
    //prettier-ignore
    const checkStatus = setInterval(async () => {
      const response = await api.get(`showOverAdvanceApprovalStatus/${approval_id}`);

      if (response.data[0].status === 'APPROVED') {
        // setShowTimerModal(false);
        setShowSectionStates({
          ...showSectionStates,
          timerModal: false,
        });
        msg.success(`Your request have been approved`);

        await save();
        resetAll();

        clearInterval(checkStatus);
      }
    }, 3000);
    //prettier-ignore-end

    setTimeout(() => {
      clearInterval(checkStatus);
    }, 300000);
  };

  const checkCustomerApprovalStatus = async (approval_id) => {
    const checkStatus = setInterval(async () => {
      const response = await api.get(
        `showCustomerApprovalStatus/${approval_id}`,
      );

      if (response.data[0]) {
        if (response.data[0].status === 'APPROVED') {
          // setShowTimerModal(false);
          setShowSectionStates({
            ...showSectionStates,
            timerModal: false,
          });
          clearInterval(checkStatus);
          msg.success_stick(
            `Your request have been approved. Please proceed with the pawning.`,
          );
        }
      } else {
        // setShowTimerModal(false);
        setShowSectionStates({
          ...showSectionStates,
          timerModal: false,
        });
        clearInterval(checkStatus);
        msg.info_stick('Your approval request was rejected!');
        resetAll();
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
    setShowSectionStates({
      ...showSectionStates,
      customerSection: !showSectionStates.customerSection,
    });
  };

  const toggleItemsSection = () => {
    setShowSectionStates({
      ...showSectionStates,
      itemSection: !showSectionStates.itemSection,
    });
  };

  const toggleTrasHistorySection = () => {
    setShowSectionStates({
      ...showSectionStates,
      transHistorySection: !showSectionStates.transHistorySection,
    });
  };

  const toggleQuickRenewModal = () => {
    setShowSectionStates({
      ...showSectionStates,
      quickRenewModal: !showSectionStates.quickRenewModal,
    });
  };

  const viewOldItems = (items) => {
    setLoanHistory({
      ...loanHistory,
      loanItems: items,
    });
    setShowSectionStates({
      ...showSectionStates,
      oldPawningItems: true,
    });
  };

  const toggleOldItemsModal = () => {
    if (showSectionStates.oldPawningItems) {
      setLoanHistory({
        ...loanHistory,
        loanItems: [],
      });
    }

    setShowSectionStates({
      ...showSectionStates,
      oldPawningItems: !showSectionStates.oldPawningItems,
    });
  };

  const toggleTransHistoryModal = async (type) => {
    if (showSectionStates.historyModal === false) {
      if (type === 'redeem') {
        setIsLoading({
          ...isLoading,
          history: true,
        });

        try {
          const response = await api.get(`showRedeemHistory/${customer.id}`);

          console.log(response);

          setLoanHistory({
            ...loanHistory,
            redeems: response.data[0].redeem,
          });
        } catch (error) {
          msg.error('Unable to fetch redeem data!');
        } finally {
          setIsLoading({
            ...isLoading,
            history: false,
          });
        }
      } else {
        setIsLoading({
          ...isLoading,
          history: true,
        });

        try {
          const response = await api.get(`showOtherHistory/${customer.id}`);

          console.log(response);

          setLoanHistory({
            ...loanHistory,
            others: response.data[0].other,
          });
        } catch (error) {
          msg.error('Unable to fetch data!');
        } finally {
          setIsLoading({
            ...isLoading,
            history: false,
          });
        }
      }
    }

    setShowSectionStates({
      ...showSectionStates,
      historyModal: !showSectionStates.historyModal,
      historyModalType: type,
    });
  };

  const HistoryDetails = ({ type }) => {
    if (type === 'redeem') {
      return (
        <div
          className="table-responsive"
          style={{
            height: '300px',
            overflowY: 'auto',
          }}
        >
          <table
            className="table table-bordered table-sm"
            style={{
              borderCollapse: 'separate',
              borderSpacing: '0 2px',
            }}
          >
            <thead className="thead-light">
              <tr>
                <th scope="col">#</th>
                <th scope="col">Branch</th>
                <th scope="col">Bill Type</th>
                <th scope="col">No</th>
                <th scope="col">Pawning Date</th>
                <th scope="col">Gold Weight</th>
                <th scope="col">Loan Amount</th>
                <th scope="col">Redeem Date</th>
                <th scope="col">Redeem Amount</th>
                {/* <th scope="col">State</th> */}
              </tr>
            </thead>
            <tbody>
              {loanHistory.redeems ? (
                loanHistory.redeems.map((redeem, index) => {
                  return (
                    <>
                      <tr key={redeem.id}>
                        <td rowSpan="2">{index + 1}</td>
                        <td>{redeem.branch.name}</td>
                        <td>{redeem.bill_type.des}</td>
                        <td>{redeem.bill_no}</td>
                        <td>{redeem.ddate}</td>
                        <td className="text-right">{redeem.total_weight}</td>
                        <td className="text-right">{redeem.required_amount}</td>
                        <td>
                          {moment(redeem.created_at).format('DD-MM-YYYY')}
                        </td>
                        <td className="text-right">{redeem.redeem_amount}</td>
                        {/* <td>{loan.state}</td> */}
                      </tr>
                      <tr className="table-warning">
                        <td className="text-center">--- ITEMS ---</td>
                        <td colSpan="7">
                          <table className="table table-sm">
                            <thead className="thead-light">
                              <tr>
                                <th scope="col">#</th>
                                <th scope="col">Item</th>
                                <th scope="col">Condition</th>
                                <th scope="col">KT</th>
                                <th scope="col">Quantity</th>
                              </tr>
                            </thead>
                            <tbody>
                              {redeem.loan_item ? (
                                redeem.loan_item.map((item, index) => {
                                  return (
                                    <tr key={item.id}>
                                      <td>{index + 1}</td>
                                      <td>{item.item.name}</td>
                                      <td>{item.condition.description}</td>
                                      <td>
                                        {item.gold_rate.gold_types.category}
                                      </td>
                                      <td>{item.qty}</td>
                                    </tr>
                                  );
                                })
                              ) : (
                                <tr>
                                  <td colSpan="7" className="text-center">
                                    No data
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="text-center">
                    No data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      );
    } else {
      return (
        <div
          className="table-responsive"
          style={{
            height: '300px',
            overflowY: 'auto',
          }}
        >
          <table
            className="table table-bordered table-sm"
            style={{
              borderCollapse: 'separate',
              borderSpacing: '0 2px',
            }}
          >
            <thead className="thead-light">
              <tr>
                <th scope="col">#</th>
                <th scope="col">Branch</th>
                <th scope="col">Bill Type</th>
                <th scope="col">No</th>
                <th scope="col">Pawning Date</th>
                <th scope="col">Gold Weight</th>
                <th scope="col">Final Redeem Amount</th>
                <th scope="col">Forfieted Date</th>
              </tr>
            </thead>
            <tbody>
              {loanHistory.others ? (
                loanHistory.others.map((other, index) => {
                  return (
                    <>
                      <tr key={other.id}>
                        <td rowSpan="2">{index + 1}</td>
                        <td>{other.branch.name}</td>
                        <td>{other.bill_type.des}</td>
                        <td>{other.bill_no}</td>
                        <td>{other.ddate}</td>
                        <td className="text-right">{other.total_weight}</td>
                        <td className="text-right">
                          {other.required_redeem_amount}
                        </td>
                        <td>{moment(other.created_at).format('DD-MM-YYYY')}</td>
                      </tr>
                      <tr className="table-warning">
                        <td className="text-center">--- ITEMS ---</td>
                        <td colSpan="6">
                          <div>
                            <table className="table table-sm">
                              <thead className="thead-light">
                                <tr>
                                  <th scope="col">#</th>
                                  <th scope="col">Item</th>
                                  <th scope="col">Condition</th>
                                  <th scope="col">KT</th>
                                  <th scope="col">Quantity</th>
                                </tr>
                              </thead>
                              <tbody>
                                {other.loan_item ? (
                                  other.loan_item.map((item, index) => {
                                    return (
                                      <tr key={item.id}>
                                        <td>{index + 1}</td>
                                        <td>{item.item.name}</td>
                                        <td>{item.condition.description}</td>
                                        <td>
                                          {item.gold_rate.gold_types.category}
                                        </td>
                                        <td>{item.qty}</td>
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
                        </td>
                      </tr>
                    </>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="text-center">
                    No data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      );
    }
  };

  const resetAll = () => {
    setNewLoan({
      branch_id: cookie.get('user_branch'),
      ddate: moment().format(`YYYY-MM-DD`),
      final_date: '',
      total_weight: (0).toFixed(2),
      gold_value: (0).toFixed(2),
      required_amount: (0).toFixed(2),
      payable_amount: '',
      customer_id: '',
      bill_type_id: '',
      bill_count: '',
      interest_rate_id: '',
      stamp_fee_id: '',
      remd_letr_no: '0',
      is_renew: false,
      prev_bill_type: '',
      prev_bill_no: '',
      user: cookie.get('user_id'),
      status: 'PENDING',
    });

    setCustomer({
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

    setPawningItems([]);

    setTransactionData([]);

    setLoanHistory({
      loans: [],
      loanItems: [],
      redeems: [],
      others: [],
      redeem_count: 0,
      other_count: 0,
      redeemed_total: 0,
      pawning_total: 0,
    });

    setAdditionalPawnData({
      duration: '',
      months: 0,
      fm_interest_rate: (0).toFixed(2),
      nm_interest_rate: (0).toFixed(2),
      first_month_interest: (0).toFixed(2),
      next_month_interest: (0).toFixed(2),
      stamp_fee: (0).toFixed(2),
      maxPrevBillNum: 0,
      refNo: '',
    });

    setIsLoading({
      ...isLoading,
      init: false,
    });

    // setShowTimerModal(false);

    setShowSectionStates({
      customerSection: true,
      itemSection: false,
      transHistorySection: true,
      timerModal: false,
      historyModal: false,
      historyModalType: 'items',
      quickRenewModal: false,
      oldPawningItems: false,
    });

    setCustomerNic('');

    setRenewData({
      branch_id: cookie.get('user_branch'),
      oldLoanId: '',
      newBillTypeId: '',
      newBillno: '',
      newAmount: '',
      newPawningDate: moment().format(`YYYY-MM-DD`),
    });

    setAdditionalRenewData({
      newDuration: '',
      newMonths: '',
      newFinalDate: '',
      newGoldRates: [],
      newInterestrates: [],
    });
  };

  /* --- End of component functions --- */

  /* --- Component renders --- */

  return (
    <div>
      <h5 className="text-center" ref={dataSection}>
        {moduleName}
      </h5>
      <br />
      {isLoading.init ? (
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
          <div className="row compactForm">
            {/* Left column */}
            <div className="col-sm-6 section-wrap">
              <div className="form-group row">
                <div className="col-sm-3">
                  <h5>Customer</h5>
                </div>
                <div className="col-sm-7">
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
                        disabled={
                          isOldPawning
                            ? customer.nic
                              ? cookie.get('permissions').full_edit_customer
                                ? false
                                : true
                              : false
                            : false
                        }
                        autoComplete="off"
                      />
                    </div>
                    <div className="col-sm-2">
                      {isLoading.customer ? (
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
                    <div className="col-sm-4">
                      {/* <div className="form-group row justify-content-end">
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
                      </div> */}
                    </div>
                  </div>
                </div>
                <div className="col-sm-2">
                  <SystemButton
                    type={'section-toggle'}
                    collapseState={showSectionStates.customerSection}
                    method={() => toggleCustomerSection()}
                    showText={false}
                    disabled={customer.is_blacklisted ? true : false}
                  />
                </div>
              </div>
              {showSectionStates.customerSection ? (
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
                        disabled={
                          isOldPawning
                            ? !cookie.get('permissions').full_edit_customer ||
                              customer.old_nic
                              ? true
                              : false
                            : customer.is_blacklisted
                            ? true
                            : false
                        }
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
                        ref={cusNameControl}
                        value={customer.name}
                        onChange={handleCustomerValueChanges}
                        disabled={
                          (isOldPawning &&
                            customer.name &&
                            !cookie.get('permissions').full_edit_customer) ||
                          customer.is_blacklisted
                            ? true
                            : false
                        }
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
                        disabled={
                          (isOldPawning &&
                            customer.other_names &&
                            !cookie.get('permissions').full_edit_customer) ||
                          customer.is_blacklisted
                            ? true
                            : false
                        }
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
                      <textarea
                        className="form-control form-control-sm rounded-0"
                        rows="1"
                        id="address_1"
                        name="address_1"
                        placeholder="Postal address"
                        value={customer.address_1}
                        onChange={handleCustomerValueChanges}
                        disabled={
                          (isOldPawning &&
                            customer.address_1 &&
                            !cookie.get('permissions').full_edit_customer) ||
                          customer.is_blacklisted
                            ? true
                            : false
                        }
                      ></textarea>
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
                      <textarea
                        className="form-control form-control-sm rounded-0"
                        rows="1"
                        id="address_2"
                        name="address_2"
                        placeholder="Address on NIC"
                        value={customer.address_2}
                        onChange={handleCustomerValueChanges}
                        disabled={
                          (isOldPawning &&
                            customer.address_2 &&
                            !cookie.get('permissions').full_edit_customer) ||
                          customer.is_blacklisted
                            ? true
                            : false
                        }
                      ></textarea>
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
                        disabled={
                          (isOldPawning &&
                            customer.telephone &&
                            !cookie.get('permissions').full_edit_customer) ||
                          customer.is_blacklisted
                            ? true
                            : false
                        }
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
                        className="form-control form-control-sm rounded-0"
                        value={customer.notes}
                        onChange={handleCustomerValueChanges}
                        disabled={
                          (isOldPawning &&
                            customer.notes &&
                            !cookie.get('permissions').full_edit_customer) ||
                          customer.is_blacklisted
                            ? true
                            : false
                        }
                      ></textarea>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Right column */}
            <div className="col-sm-6 section-wrap">
              <div className="form-group row">
                <div className="col-sm-5">
                  <h5>Loan History</h5>
                </div>
                <div className="col-sm-2">
                  {isLoading.history ? (
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
                    collapseState={showSectionStates.transHistorySection}
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
                {showSectionStates.transHistorySection ? (
                  <div
                    className="table-responsive"
                    style={{
                      height: '200px',
                      overflowY: 'auto',
                    }}
                  >
                    <table className="table table-bordered table-sm table-hover">
                      <thead className="thead-light">
                        <tr>
                          <th scope="col">#</th>
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
                        {loanHistory.loans ? (
                          loanHistory.loans.map((loan, index) => {
                            return (
                              <tr
                                key={loan.id}
                                // onClick={() => setShowSectionStates({...showSectionStates, oldPawningItems: true})}
                                onClick={() => viewOldItems(loan.loan_item)}
                                style={{ cursor: 'pointer' }}
                              >
                                <td>{index + 1}</td>
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

              <div
                className="row font-weight-bold text-white"
                style={{
                  bottom: '1px',
                  marginLeft: 0,
                  marginRight: 0,
                }}
              >
                <div
                  className="col-sm-5 bg-secondary"
                  style={{ border: '1px solid #eee' }}
                >
                  <h6>Pawning</h6>
                  <p className="small-bold-text">
                    {`Count: ${
                      loanHistory.loans.length ? loanHistory.loans.length : 0
                    }`}
                    &nbsp; | &nbsp;
                    {`Total: ${
                      loanHistory.pawning_total ? loanHistory.pawning_total : 0
                    }`}
                  </p>
                </div>
                <div
                  className="col-sm-5 bg-secondary"
                  style={{
                    border: '1px solid #eee',
                    cursor: loanHistory.redeem_count ? 'pointer' : 'default',
                  }}
                  onClick={
                    loanHistory.redeem_count
                      ? () => toggleTransHistoryModal('redeem')
                      : null
                  }
                >
                  <h6>Redeemed</h6>
                  <p className="small-bold-text">
                    {`Count: ${
                      loanHistory.redeem_count ? loanHistory.redeem_count : 0
                    }`}
                    &nbsp; | &nbsp;
                    {`Total: ${
                      loanHistory.redeemed_total
                        ? loanHistory.redeemed_total
                        : 0
                    }`}
                  </p>
                </div>
                <div
                  className="col-sm-2 bg-secondary"
                  style={{
                    border: '1px solid #eee',
                    cursor: loanHistory.other_count ? 'pointer' : 'default',
                  }}
                  onClick={
                    loanHistory.other_count
                      ? () => toggleTransHistoryModal('other')
                      : null
                  }
                >
                  <h6>Other</h6>
                  <p className="small-bold-text">
                    {`Count: ${
                      loanHistory.other_count ? loanHistory.other_count : 0
                    }`}
                  </p>
                </div>
                {/* <div className="col-sm-3 bg-secondary">
                  {`Pawning Total : ${
                    loanHistory.other_count ? loanHistory.other_count : 0
                  }`}
                </div> */}
              </div>
            </div>
          </div>
          <div className="compactForm">
            <div className="row bill-info">
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
                  <label htmlFor="bill_count">Bill No</label>
                  <input
                    type="text"
                    name="bill_count"
                    id="bill_count"
                    value={newLoan.bill_count}
                    onFocus={selectAllText}
                    className={`form-control form-control-sm font-weight-bold text-right ${
                      isLoading.billCount ? 'inputLoader' : ''
                    }`}
                    onChange={handlePawningAmountChanges}
                    onKeyUp={handleBillSearch}
                  />
                </div>
              </div>
              <div className="col-sm-2">
                <label htmlFor="ddate">Pawning date</label>
                <input
                  type="date"
                  name="ddate"
                  id="ddate"
                  className={`form-control form-control-sm text-right font-weight-bold ${
                    isLoading.billCount ? 'inputLoader' : ''
                  }`}
                  value={newLoan.ddate}
                  onChange={handlePawningAmountChanges}
                  // readOnly={customer.is_blacklisted ? true : false}
                  // disabled
                />
              </div>
              <div className="col-sm-2">
                <label htmlFor="duration">Duration</label>
                <input
                  type="text"
                  name="duration"
                  id="duration"
                  className={`form-control-plaintext form-control-sm font-weight-bold ${
                    isLoading.billCount ? 'inputLoader' : ''
                  }`}
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
                  className={`form-control-plaintext form-control-sm font-weight-bold ${
                    isLoading.billCount ? 'inputLoader' : ''
                  }`}
                  value={newLoan.final_date}
                  placeholder="-- Select a bill type"
                  readOnly
                />
              </div>
            </div>

            <div className="form-group row bg-items">
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
                  collapseState={showSectionStates.itemSection}
                  method={() => toggleItemsSection()}
                  showText={false}
                  classes="btn btn-white btn-block btn-sm"
                  disabled={newLoan.bill_type_id ? false : true}
                />
              </div>
            </div>
            {showSectionStates.itemSection ? (
              <div className="row table-responsive header-fixed-scrollable">
                <table className="table table-sm table-bordered">
                  <thead className="thead-light text-center">
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">Category</th>
                      <th scope="col">Item</th>
                      <th scope="col">Condition</th>
                      <th scope="col">Type</th>
                      <th scope="col">Rate</th>
                      <th scope="col">Densimeter KT</th>
                      <th scope="col">Count</th>
                      <th scope="col">Weight(g)</th>
                      <th scope="col">Value(LKR)</th>
                      <th scope="col"></th>
                    </tr>
                  </thead>
                  <tbody className="text-center bg-items">
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
                                customer.is_blacklisted ||
                                (isOldPawning &&
                                  !cookie.get('permissions').update_loan)
                                  ? true
                                  : false
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
                            <select
                              name="item_id"
                              id="item_id"
                              data-id={index}
                              className={`form-control form-control-sm ${
                                isLoading.items ? 'inputLoaderCenter' : ''
                              }`}
                              value={pawningItems[index].item_id}
                              onChange={handleItemsChange}
                              disabled={
                                customer.is_blacklisted ||
                                (isOldPawning &&
                                  !cookie.get('permissions').update_loan)
                                  ? true
                                  : false
                              }
                            >
                              <option
                                value=""
                                className="dropdown-item text-muted text-light"
                                disabled
                              >
                                -- Item
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
                                customer.is_blacklisted ||
                                (isOldPawning &&
                                  !cookie.get('permissions').update_loan)
                                  ? true
                                  : false
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
                          <td style={{ width: '100px' }}>
                            <select
                              name="gold_rate_id"
                              id="gold_rate_id"
                              data-id={index}
                              className="form-control form-control-sm"
                              value={pawningItems[index].gold_rate_id}
                              onChange={handleItemsChange}
                              disabled={
                                customer.is_blacklisted ||
                                (isOldPawning &&
                                  !cookie.get('permissions').update_loan)
                                  ? true
                                  : false
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
                          <td style={{ width: '100px' }}>
                            <input
                              type="text"
                              className="form-control-plaintext form-control-sm text-right"
                              name="gold_rate"
                              id="gold_rate"
                              data-id={index}
                              value={pawningItems[index].gold_rate}
                              onChange={handleItemsChange}
                              readOnly
                            />
                          </td>
                          <td style={{ width: '80px' }}>
                            <input
                              type="text"
                              className="form-control form-control-sm text-right"
                              name="item_density"
                              id="item_density"
                              data-id={index}
                              value={pawningItems[index].item_density}
                              onChange={handleItemsChange}
                              disabled={
                                customer.is_blacklisted ||
                                (isOldPawning &&
                                  !cookie.get('permissions').update_loan)
                                  ? true
                                  : false
                              }
                            />
                          </td>
                          <td style={{ width: '80px' }}>
                            <input
                              type="text"
                              className="form-control form-control-sm text-right"
                              name="qty"
                              id="qty"
                              data-id={index}
                              value={pawningItems[index].qty}
                              onChange={handleItemsChange}
                              ref={itemQtyControl}
                              disabled={
                                customer.is_blacklisted ||
                                (isOldPawning &&
                                  !cookie.get('permissions').update_loan)
                                  ? true
                                  : false
                              }
                            />
                          </td>
                          <td style={{ width: '100px' }}>
                            <input
                              type="text"
                              className="form-control form-control-sm text-right"
                              name="gold_weight"
                              id="gold_weight"
                              data-id={index}
                              value={pawningItems[index].gold_weight}
                              onChange={handleItemsChange}
                              disabled={
                                customer.is_blacklisted ||
                                (isOldPawning &&
                                  !cookie.get('permissions').update_loan)
                                  ? true
                                  : false
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
                              disabled={
                                isOldPawning
                                  ? cookie.get('permissions').update_loan
                                    ? false
                                    : true
                                  : false
                              }
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-items">
                    <tr>
                      <td className="text-center">
                        <SystemButton
                          type={'add-row'}
                          method={() => addNewItem()}
                          showText={false}
                          disabled={
                            isOldPawning
                              ? cookie.get('permissions').update_loan
                                ? false
                                : true
                              : false
                          }
                        />
                      </td>
                      <td colSpan="7" className="text-center">
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
                  <label htmlFor="stamp_fee">Stamp Duty</label>
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
                  <label htmlFor="payable_amount">Payable Amount</label>
                  <input
                    type="text"
                    className="form-control form-control-sm text-right font-weight-bold"
                    id="payable_amount"
                    name="payable_amount"
                    value={newLoan.payable_amount}
                    onFocus={selectAllText}
                    onChange={handlePawningAmountChanges}
                    disabled={
                      customer.is_blacklisted ||
                      newLoan.bill_type_id === '' ||
                      newLoan.gold_value == 0 ||
                      isOldPawning
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
                      className="form-control-plaintext form-control-lg text-right font-weight-bold important-text"
                      id="required_amount"
                      name="required_amount"
                      min="0.00"
                      step="0.01"
                      value={newLoan.required_amount}
                      onChange={
                        cookie.get('permissions').update_loan
                          ? handlePawningAmountChanges
                          : null
                      }
                      readOnly={
                        cookie.get('permissions').update_loan ? false : true
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
              {isOldPawning ? null : (
                <>
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
                      <label
                        className="custom-control-label"
                        htmlFor="is_renew"
                      >
                        Renewal
                        {/* {newLoan.is_renew ? `Renewal` : `New Pawning`} */}
                      </label>
                    </div>
                  </div>
                  <div className="col-sm-2">
                    <select
                      name="prev_bill_type"
                      id="prev_bill_type"
                      hidden={newLoan.is_renew ? false : true}
                      className="form-control-sm font-weight-bold"
                      value={newLoan.prev_bill_type}
                      onChange={handlePawningAmountChanges}
                    >
                      <option value="" className="text-muted">
                        --Select old bill type
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
                  <div className="col-sm-2">
                    <input
                      type={newLoan.is_renew ? 'text' : 'hidden'}
                      className="form-control-sm font-weight-bold"
                      id="prev_bill_no"
                      name="prev_bill_no"
                      value={newLoan.prev_bill_no}
                      onChange={handlePawningAmountChanges}
                      placeholder="Old bill number"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="row justify-content-end">
              <div className="col-sm-2">
                <SystemButton
                  type={'reset'}
                  showText={true}
                  method={resetAll}
                />
              </div>
              {isOldPawning ? (
                <>
                  <div className="col-sm-3">
                    {(cookie.get('permissions')
                      ? cookie.get('permissions').show_branch_selector
                      : 0) === 1 ? (
                      <SystemButton
                        type={'print'}
                        showText={true}
                        btnText="Re-print Bill"
                        method={reprintPawningBill}
                      />
                    ) : null}
                  </div>
                  <div className="col-sm-3">
                    <SystemButton
                      type={'load'}
                      showText={true}
                      btnText="Quick Renew"
                      method={renew}
                    />
                  </div>
                  {cookie.get('permissions') ? (
                    cookie.get('permissions').update_loan ? (
                      <div className="col-sm-3">
                        <SystemButton
                          type={'no-form-save'}
                          showText={true}
                          btnText="Update"
                          method={updatePawning}
                        />
                      </div>
                    ) : null
                  ) : null}
                </>
              ) : (
                <div className="col-sm-3">
                  {/* <SystemButton
                    type={'save'}
                    showText={true}
                    disabled={customer.is_blacklisted ? true : false}
                  /> */}
                  <SystemButton
                    type={'no-form-save'}
                    showText={true}
                    disabled={customer.is_blacklisted ? true : false}
                    method={handleSubmit}
                  />
                </div>
              )}
            </div>
          </div>
          <br />
        </div>
      )}

      {/* Timer modal componenet */}
      <UnclosableModal modalState={showSectionStates.timerModal}>
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
                duration={1800}
                colors={'#004777'}
                onComplete={() => endTimer()}
              >
                {approvalTimerText}
              </CountdownCircleTimer>
            </div>
          </div>
          <br />
        </div>
      </UnclosableModal>
      {/* End of timer modal componenet */}

      {/* History component modal */}
      <FormModal
        moduleName="Loan History"
        modalState={showSectionStates.historyModal}
        toggleFormModal={toggleTransHistoryModal}
      >
        <div className="modal-body">
          {isLoading.history ? (
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
            <HistoryDetails type={showSectionStates.historyModalType} />
          )}
        </div>
        <div className="modal-footer">
          <SystemButton
            type={'close'}
            method={toggleTransHistoryModal}
            showText={true}
          />
        </div>
      </FormModal>
      {/* End of history component modal */}

      {/* Old pawning items modal */}
      <FormModal
        moduleName="Old pawning items"
        modalState={showSectionStates.oldPawningItems}
        toggleFormModal={toggleOldItemsModal}
      >
        <div className="modal-body">
          <table className="table table-bordered table-striped table-sm">
            <thead className="thead-light">
              <tr>
                <th scope="col">#</th>
                <th scope="col">Item</th>
                <th scope="col">Condition</th>
                <th scope="col">KT</th>
                <th scope="col">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {loanHistory.loanItems ? (
                loanHistory.loanItems.map((item, index) => {
                  return (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>{item.item.name}</td>
                      <td>{item.condition.description}</td>
                      <td>{item.gold_rate.gold_types.category}</td>
                      <td>{item.qty}</td>
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
        <div className="modal-footer">
          <SystemButton
            type={'close'}
            method={toggleOldItemsModal}
            showText={true}
          />
        </div>
      </FormModal>
      {/* End of old pawning items modal */}

      {/* Quick renew modal */}
      <FormModal
        moduleName="Quick Renew"
        modalState={showSectionStates.quickRenewModal}
        toggleFormModal={toggleQuickRenewModal}
      >
        <div className="compactForm">
          <div className="modal-body">
            <div className="row">
              <div className="offset-10 col-sm-2">
                <div className="form-group">
                  <label htmlFor="new_pawning_date">New Pawning Date</label>
                  <input
                    type="text"
                    name="new_pawning_date"
                    id="new_pawning_date"
                    className="form-control-plaintext form-control-sm font-weight-bold"
                    value={renewData.newPawningDate}
                    readOnly
                  />
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-sm-3">
                <div className="form-group">
                  <label htmlFor="new_bill_type_id">New Bill Type</label>
                  <select
                    name="new_bill_type_id"
                    id="new_bill_type_id"
                    className="form-control form-control-sm"
                    value={renewData.newBillTypeId}
                    onChange={handleRenewValueChanges}
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
                  <label htmlFor="new_bill_no">New Bill No</label>
                  <input
                    type="text"
                    name="new_bill_no"
                    id="new_bill_no"
                    value={renewData.newBillno}
                    className={`form-control-plaintext form-control-sm font-weight-bold ${
                      isLoading.newBillno ? 'inputLoader' : ''
                    }`}
                    disabled
                  />
                </div>
              </div>
              <div className="offset-3 col-sm-2">
                <div className="form-group">
                  <label htmlFor="new_duration">New Pawning Duration</label>
                  <input
                    type="text"
                    name="new_duration"
                    id="new_duration"
                    className={`form-control-plaintext form-control-sm font-weight-bold ${
                      isLoading.newBillno ? 'inputLoader' : ''
                    }`}
                    value={additionalRenewData.newDuration}
                    placeholder="-- Select a bill type"
                    disabled
                  />
                </div>
              </div>
              <div className="col-sm-2">
                <div className="form-group">
                  <label htmlFor="new_last_date">New Final Date</label>
                  <input
                    type="text"
                    name="new_last_date"
                    id="new_last_date"
                    className={`form-control-plaintext form-control-sm font-weight-bold text-right ${
                      isLoading.newBillno ? 'inputLoader' : ''
                    }`}
                    value={additionalRenewData.newFinalDate}
                    placeholder="-- Select a bill type"
                    disabled
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <SystemButton
              type={'close'}
              method={toggleQuickRenewModal}
              showText={true}
            />
            <SystemButton
              type="no-form-save"
              method={toggleQuickRenewModal}
              showText={true}
              method={handleRenewSubmit}
            />
          </div>
        </div>
      </FormModal>
      {/* Quick renew modal end */}
    </div>
  );

  /* --- End of component renders --- */
};

export default Loans;
