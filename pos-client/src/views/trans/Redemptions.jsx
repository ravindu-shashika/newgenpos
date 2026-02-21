import React, { useState, useEffect } from 'react';
import { api, msg, cookie, print, roundup } from './../../services';
import moment from 'moment';
import { SystemButton, UnclosableModal } from '../../components';
import { SafeFontAwesomeIcon } from '../../components';
import { faGavel } from '@fortawesome/free-solid-svg-icons';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';

const Redemptions = () => {
  // Module name
  const moduleName = 'Redemption';

  /* --- State declarationss --- */

  const [billTypeSearch, setBillTypeSearch] = useState({
    branch_id: '',
    bill_type_id: '',
    bill_no: '',
  });

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
  });

  const [additionalPayData, setAdditionalPayData] = useState({
    fm_int_rate: '',
    nm_int_rate: '',
    discount_days: '',
    discount_rate: '',
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

  const [transactionData, setTransactionData] = useState([]);

  const [isLoading, setIsLoading] = useState(false);

  const [isRedeemedBill, setIsRedeemedBill] = useState(false);

  const [approvalRefNo, setApprovalRefNo] = useState('');

  const [showSectionStates, setShowSectionStates] = useState({
    customerSection: true,
    itemSection: true,
    transHistorySection: true,
    pawningSection: true,
    timerModal: false,
  });

  const [intRates, setIntRates] = useState([]);

  const [paidCapAndInt, setPaidCapAndInt] = useState({
    paidCapital: '',
    paidInterest: '',
  });

  /* --- End of state declarations --- */

  useEffect(() => {
    fetchData();
  }, []);

  /* --- Component functions --- */

  const fetchData = async () => {
    const response = await api.get(`redemptions/${cookie.get('user_branch')}`);

    setBranchBillTypes(response.data);
  };

  const fetchLoanData = async () => {
    try {
      setIsLoading(true);

      const response = await api.post(`showLoanFromRedeem`).values({
        branch_id: cookie.get('user_branch'),
        bill_type_id: billTypeSearch.bill_type_id,
        bill_no: billTypeSearch.bill_no,
      });

      if (response.data.message) {
        msg.error(response.data.message);
        setIsLoading(false);
        return;
      } else {
        // ----------------------------- Dates -----------------------------
        // prettier-ignore
        let months = moment().diff(moment(response.data[0].ddate), 'months');
        // prettier-ignore-end
        // prettier-ignore
        const nextMonthDate = moment(response.data[0].ddate).add(months, 'months');
        // prettier-ignore-end
        // prettier-ignore
        const days = moment().add(1, 'days').diff(moment(response.data[0].ddate), 'days');
        // prettier-ignore-end
        // prettier-ignore
        const nextMonthDays = moment().diff(moment(nextMonthDate), 'days');
        // prettier-ignore-end

        // prettier-ignore
        if (nextMonthDays < 7) months = parseInt(months) - parseInt(1);
        // prettier-ignore-end

        // prettier-ignore
        const elapsedMonths = moment().diff(moment(response.data[0].ddate), 'months');
        // prettier-ignore-end
        // prettier-ignore
        const elapsedDays = elapsedMonths == 0 ? moment().add(1, 'days').diff(moment(response.data[0].ddate).add(elapsedMonths, 'months'), 'days') : moment().diff(moment(response.data[0].ddate).add(elapsedMonths, 'months'), 'days');
        // prettier-ignore-end

        // ----------------------------- Dates end -----------------------------

        // ----------------------------- Cal paid amounts -----------------------------
        const paidAmounts = await calPaidAmounts(response.data[0].loan_trans);
        // ----------------------------- Cal paid amounts end -----------------------------

        // ----------------------------- Cal total interest -----------------------------
        const totInterest = await calTotalInterest(
          response.data[0].required_amount,
          response.data[0].loan_capital,
          response.data[0].int_rate,
          months,
          days,
          nextMonthDays,
        );
        // ----------------------------- Cal total interest end -----------------------------

        // ----------------------------- Cal discount -----------------------------
        const redeemDis = await calDiscount(
          response.data[0].required_amount,
          response.data[0].loan_capital,
          response.data[0].int_rate,
          totInterest,
          months,
          days,
          nextMonthDays,
        );
        // ----------------------------- Cal discount end -----------------------------

        // ----------------------------- Redeem interest -----------------------------
        // prettier-ignore
        const redeemInterest =
          months == (-1) ? parseFloat(totInterest) : (parseFloat(totInterest) - parseFloat(paidAmounts.paidInterest)).toFixed(2);
        // prettier-ignore-end
        // ----------------------------- Redeem interest end -----------------------------

        // ----------------------------- Document fees -----------------------------
        // prettier-ignore
        const documentFees = response.data[0].reminder_letters.length ? response.data[0].reminder_letters.reduce((accumilator, value) => parseFloat(accumilator) + parseFloat(value)) : 0;
        // prettier-ignore-end
        // ----------------------------- Document fees end -----------------------------

        // ----------------------------- Redeem amount -----------------------------
        // prettier-ignore
        const redeemAmt = months == (-1) ?
          parseFloat(response.data[0].loan_capital) + parseFloat(response.data[0].stamp_fee.stamp_fee) + parseFloat(redeemInterest) + parseFloat(documentFees) - parseFloat(redeemDis) - parseFloat(paidAmounts.paidCapital):
          parseFloat(response.data[0].required_amount) + parseFloat(redeemInterest) + parseFloat(documentFees) - parseFloat(redeemDis) - parseFloat(paidAmounts.paidCapital);

        const finalRedeemAmt = await roundup.redeem(redeemAmt);

        if (redeemAmt == 0) {
          msg.warning_stick(
            'Hmm..🤔 Something went wrong! Please contact the admin!',
          );
          msg.error_stick('ERROR CODE:- REDEEM_AMT_CAL_INIT');
        }
        // prettier-ignore-end
        // ----------------------------- Redeem amount end -----------------------------

        setIntRates(response.data[0].int_rate);

        setCustomer(response.data[0].customer);

        setPawningItems(response.data[0].loan_item);

        setTransHistory(response.data[0].loan_trans);

        setReminderLetterDetails(response.data[0].reminder_letters);

        setShowSectionStates({
          ...showSectionStates,
          customerSection: true,
          itemSection: true,
          transHistorySection: true,
          pawningSection: true,
        });

        setPaidCapAndInt(paidAmounts);

        // prettier-ignore
        setPawningData({
          ...pawningData,
          ddate: moment(response.data[0].ddate).format(`YYYY-MM-DD`),
          final_date: moment(response.data[0].final_date).format(`YYYY-MM-DD`),
          total_weight: response.data[0].total_weight,
          gold_value: response.data[0].gold_value,
          payable_amount: response.data[0].loan_capital,
          required_amount: response.data[0].required_amount,
          stamp_fee: response.data[0].stamp_fee.stamp_fee,
          paying_amount: response.data[0].paying_amount,
        });
        // prettier-ignore-end

        // prettier-ignore
        setAdditionalPayData({
          ...additionalPayData,
          fm_int_rate: response.data[0].int_rate.fm_interest_rate,
          nm_int_rate: response.data[0].int_rate.nm_interest_rate,
          init_capital: parseFloat(response.data[0].required_amount).toFixed(2),
          tot_balance:
            days <= 7
              ? parseFloat(response.data[0].required_amount) -
                parseFloat(paidAmounts.paidCapital)
              : parseFloat(parseFloat(response.data[0].required_amount) - parseFloat(paidAmounts.paidCapital)) +
                parseFloat(parseFloat(totInterest) - parseFloat(paidAmounts.paidInterest)),
          fm_int:
            (parseFloat(response.data[0].loan_capital) *
              parseFloat(response.data[0].int_rate.fm_interest_rate)) /
            100,
          nm_int: (parseFloat(response.data[0].required_amount) *
              parseFloat(response.data[0].int_rate.nm_interest_rate)) /
            100,
          interest_to_date: parseFloat(totInterest),
          capital_balance:
            parseFloat(response.data[0].required_amount) -
            parseFloat(paidAmounts.paidCapital),
          interest_balance:
            parseFloat(totInterest) - parseFloat(paidAmounts.paidInterest),
          special_discount: parseFloat(redeemDis).toFixed(2),
          paid_int: parseFloat(paidAmounts.paidInterest).toFixed(2),
          paid_capital: parseFloat(paidAmounts.paidCapital).toFixed(2),
          document_fee: parseFloat(documentFees).toFixed(2),
          elapsedTime: elapsedTimeText(elapsedMonths, elapsedDays),
          intCalTime: intCalTimeText(elapsedMonths, elapsedDays),
          originalRedeemAmt: parseFloat(redeemAmt).toFixed(2)
        });
        // prettier-ignore-end

        // prettier-ignore
        setPayment({
          ...payment,
          loan_id: response.data[0].id,
          discount: parseFloat(redeemDis).toFixed(2),
          redeem_amount: finalRedeemAmt,
          redeem_interest: parseFloat(parseFloat(totInterest) - parseFloat(paidAmounts.paidInterest)).toFixed(2),
        });
        // prettier-ignore-end

        if (response.data[0].customer.is_blacklisted === 1) {
          msg.error('Customer is blacklisted');
          msg.info_stick(response.data[0].customer.notes);
        }

        if (response.data.redeemed_bill) {
          setIsRedeemedBill(true);
          msg.info_stick('This bill is already redeemed!');
        }
        setIsLoading(false);
      }
    } catch (error) {
      setIsLoading(false);
      console.log(error);
      return msg.error('Unable to complete operation!');
    }
  };

  const calPaidAmounts = async (trans) => {
    let paidCapital = 0;
    let paidInterest = 0;
    return Promise.all(
      trans.map((row) => {
        if (row.trans_type_id === 8) {
          paidCapital += parseFloat(row.amount);
        }
        if (row.trans_type_id === 7 || row.trans_type_id === 11) {
          paidInterest += parseFloat(row.amount);
        }
      }),
    ).then(() => {
      return {
        paidCapital: paidCapital,
        paidInterest: paidInterest,
      };
    });
  };

  const calDiscount = async (
    requiredAmount,
    payableAmount,
    intRates,
    totInt,
    months,
    days,
    nmDays,
  ) => {
    let discount = 0;
    if (months == -1) {
      if (days <= intRates.discount_days) {
        // prettier-ignore
        return Promise.all([
          (discount = parseFloat((parseFloat(requiredAmount) * parseFloat(intRates.discount_rate)) / 100).toFixed(2)),
        ]).then(() => {
          return discount;
        });
        // prettier-ignore-end
      } else {
        // prettier-ignore
        return Promise.all([
          (discount = (0).toFixed(2)),
        ]).then(() => {
          return discount;
        });
        // prettier-ignore-end
      }
    } else {
      // prettier-ignore
      return Promise.all([
        (discount = (0).toFixed(2)),
      ]).then(() => {
        return discount;
      });
      // prettier-ignore-end
    }
  };

  const calTotalInterest = async (
    requiredAmount,
    payableAmount,
    intRates,
    months,
    days,
    nmDays,
  ) => {
    // prettier-ignore
    let fmInt = parseFloat(parseFloat(parseFloat(requiredAmount) * parseFloat(intRates.fm_interest_rate)) / 100).toFixed(2);
    // prettier-ignore-end
    // prettier-ignore
    let extraInt = parseFloat(parseFloat(parseFloat(fmInt) * parseFloat(intRates.fm_interest_rate)) / 100).toFixed(2);
    // prettier-ignore-end
    // prettier-ignore
    let nmInt = parseFloat(parseFloat(parseFloat(requiredAmount) * parseFloat(intRates.nm_interest_rate)) / 100).toFixed(2);
    // prettier-ignore-end
    let totInt = 0;

    if (months == -1) {
      return Promise.all([(totInt = parseFloat(fmInt))]).then(() => {
        return totInt;
      });
      // prettier-ignore-end
    } else {
      // prettier-ignore
      if (nmDays < 7) {
        return Promise.all([
          (totInt = parseFloat(parseFloat(fmInt) + parseFloat(parseFloat(nmInt) * parseInt(months)) + parseFloat(parseFloat(parseFloat(nmInt) * parseInt(nmDays)) / parseFloat(parseFloat(30)))).toFixed(2))
        ]).then(() => {
          return totInt;
        });
      } else {
        return Promise.all([
          (totInt = parseFloat(parseFloat(fmInt) + parseFloat(parseFloat(nmInt) * parseInt(months))).toFixed(2))
        ]).then(() => {
          return totInt;
        });
      }
      // prettier-ignore-end
    }
  };

  const dateChange = async (newDate) => {
    // ----------------------------- Dates -----------------------------

    // prettier-ignore
    let months = moment(newDate).diff(moment(pawningData.ddate), 'months');
    // prettier-ignore-end
    // prettier-ignore
    const nextMonthDate = moment(pawningData.ddate).add(months, 'months');
    // prettier-ignore-end
    // prettier-ignore
    const days = moment(newDate).add(1, 'days').diff(moment(pawningData.ddate), 'days');
    // prettier-ignore-end
    // prettier-ignore
    const nmDays = moment(newDate).diff(moment(nextMonthDate), 'days');
    // prettier-ignore-end
    // prettier-ignore
    if (nmDays < 7) months = parseInt(months) - parseInt(1);
    // prettier-ignore-end

    // prettier-ignore
    const elapsedMonths = moment(newDate).diff(moment(pawningData.ddate), 'months');
    // prettier-ignore-end
    // prettier-ignore
    const elapsedDays = elapsedMonths == 0 ? moment(newDate).add(1, 'days').diff(moment(pawningData.ddate).add(elapsedMonths, 'months'), 'days') : moment(newDate).diff(moment(pawningData.ddate).add(elapsedMonths, 'months'), 'days');
    // prettier-ignore-end
    // ----------------------------- Dates end -----------------------------

    // ----------------------------- Cal total interest -----------------------------
    const totInterest = await calTotalInterest(
      pawningData.required_amount,
      pawningData.payable_amount,
      intRates,
      months,
      days,
      nmDays,
    );
    // ----------------------------- Cal total interest end -----------------------------

    // ----------------------------- Cal discount -----------------------------
    const redeemDis = await calDiscount(
      pawningData.required_amount,
      pawningData.payable_amount,
      intRates,
      totInterest,
      months,
      days,
      nmDays,
    );
    // ----------------------------- Cal discount end -----------------------------

    // ----------------------------- Redeem interest -----------------------------
    // prettier-ignore
    const redeemInterest = months == (-1) ? parseFloat(totInterest) : (parseFloat(totInterest) - parseFloat(paidCapAndInt.paidInterest)).toFixed(2);
    // prettier-ignore-end
    // ----------------------------- Redeem interest end -----------------------------

    // ----------------------------- Document fees -----------------------------
    // prettier-ignore
    const documentFees = additionalPayData.document_fee ? parseFloat(additionalPayData.document_fee).toFixed(2) : 0;
    // prettier-ignore-end
    // ----------------------------- Document fees end -----------------------------

    // ----------------------------- Redeem amount -----------------------------
    // prettier-ignore
    const redeemAmt = months == (-1) ?
      parseFloat(pawningData.payable_amount) + parseFloat(pawningData.stamp_fee) + parseFloat(redeemInterest) + parseFloat(documentFees) - parseFloat(redeemDis) - parseFloat(paidCapAndInt.paidCapital) :
      parseFloat(pawningData.required_amount) + parseFloat(redeemInterest) + parseFloat(documentFees) - parseFloat(redeemDis) - parseFloat(paidCapAndInt.paidCapital);
    // prettier-ignore-end

    const finalRedeemAmt = await roundup.redeem(redeemAmt);

    if (redeemAmt == 0) {
      msg.warning_stick(
        'Hmm..🤔 Something went wrong! Please contact the admin!',
      );
      msg.error_stick('ERROR CODE:- REDEEM_AMT_CAL_DATE_CHANGE');
    }
    // ----------------------------- Redeem amount end -----------------------------

    setAdditionalPayData({
      ...additionalPayData,
      to_date: newDate,
      tot_balance: parseFloat(redeemAmt).toFixed(2),
      interest_to_date: parseFloat(totInterest).toFixed(2),
      capital_balance:
        parseFloat(pawningData.required_amount) -
        parseFloat(paidCapAndInt.paidCapital),
      interest_balance:
        parseFloat(totInterest) - parseFloat(paidCapAndInt.paidInterest),
      special_discount: parseFloat(redeemDis).toFixed(2),
      elapsedTime: elapsedTimeText(elapsedMonths, elapsedDays),
      intCalTime: intCalTimeText(elapsedMonths, elapsedDays),
      originalRedeemAmt: parseFloat(redeemAmt).toFixed(2),
    });
    // prettier-ignore-end

    // prettier-ignore
    setPayment({
      ...payment,
      discount: parseFloat(redeemDis).toFixed(2),
      redeem_amount: finalRedeemAmt,
      redeem_interest: parseFloat(parseFloat(totInterest) - parseFloat(paidCapAndInt.paidInterest)).toFixed(2),
    });
    // prettier-ignore-end
  };

  const selectAllText = (e) => {
    e.target.select();
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
      if (input === 'manual_discount') {
        if (value === '') {
          resolve(true);
        } else {
          if (isNaN(value)) {
            msg.warning('Discount amount must be a number');
          } else if (
            value.indexOf('.') != -1
              ? value.substring(value.indexOf('.') + 1).length > 2
              : false
          ) {
            msg.warning(
              'Discount amount must NOT exceed 2 values after the decimal point',
            );
          } else {
            resolve(true);
          }
        }
      } else {
        resolve(true);
      }

      if (input === 'paying_amount') {
        if (value === '') {
          resolve(true);
        } else {
          if (isNaN(value)) {
            msg.warning('Paying amount must be a number');
          } else if (
            value.indexOf('.') != -1
              ? value.substring(value.indexOf('.') + 1).length > 2
              : false
          ) {
            msg.warning(
              'Payment must NOT exceed 2 values after the decimal point',
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

  const handleValueChanges = async (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue =
      targetInput.type === 'checkbox' ? targetInput.checked : targetInput.value;

    const validated = await validateControlValues(inputName, inputValue);

    if (validated) {
      if (inputName === 'search_bill_type') {
        setBillTypeSearch({
          ...billTypeSearch,
          bill_type_id: inputValue,
        });
      } else if (inputName === 'search_bill_no') {
        setBillTypeSearch({
          ...billTypeSearch,
          bill_no: inputValue,
        });
      } else if (inputName === 'to_date') {
        dateChange(inputValue);
      } else if (inputName === 'manual_discount') {
        if (inputValue === '') {
          setAdditionalPayData({
            ...additionalPayData,
            manual_discount: 0,
          });
          setPayment({
            ...payment,
            discount: parseFloat(additionalPayData.special_discount).toFixed(2),
            redeem_amount: parseFloat(
              parseFloat(additionalPayData.capital_balance) +
                parseFloat(additionalPayData.interest_balance) -
                parseFloat(additionalPayData.special_discount),
            ).toFixed(2),
          });
        } else if (inputName === 'paying_amount') {
          setPayment({
            ...payment,
            paying_amount: inputValue,
          });
        } else {
          setAdditionalPayData({
            ...additionalPayData,
            manual_discount: inputValue,
          });
          setPayment({
            ...payment,
            discount: (
              parseFloat(additionalPayData.special_discount) +
              parseFloat(inputValue)
            ).toFixed(2),
            redeem_amount: parseFloat(
              parseFloat(additionalPayData.capital_balance) +
                parseFloat(additionalPayData.interest_balance) -
                parseFloat(additionalPayData.special_discount) -
                parseFloat(inputValue),
            ).toFixed(2),
          });
        }
      } else {
        setPayment({
          ...payment,
          [inputName]: inputValue,
        });
      }
    }
  };

  const handleSubmit = async () => {
    if (parseFloat(additionalPayData.manual_discount) > 0) {
      sendToDiscountApproval();
    } else {
      await save();

      resetAll();
    }
  };

  const save = async () => {
    console.log({
      loan: payment,
      loan_trans: transactionData,
    });
    try {
      const response = await api.post('saveRedeem').values({
        loan: payment,
        loan_trans: transactionData,
      });

      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err[0]);
        });
        return;
      }

      if (response.data[0].errMessage) {
        msg.error(`${response.data[0].errMessage}`);
        return;
      } else {
        msg.success(
          `Successfully redeemed bill no ${response.data[0].bill_type.des} - ${response.data[0].bill_no}`,
        );
        print.redeemBill(response.data[0]);
      }

      msg.success(response.data);
    } catch (error) {
      msg.error(error);
      return console.log(error);
    }
  };

  const reprintPawningBill = async () => {
    try {
      const response = await api.get(
        `show-loan-by-id/${pawningData.branch_id}`,
      );

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

  const reprintRedeemBill = async () => {
    try {
      const response = await api.get(`show-redeem-by-id/${payment.loan_id}`);

      console.log(response.data);

      if (response.data.message) {
        msg.error(`${response.data.message}`);
      } else {
        msg.success(`Done`);
        print.redeemBill(response.data);
      }
    } catch (error) {
      msg.error(error);
      return console.log(error);
    }
  };

  const sendToDiscountApproval = async () => {
    //prettier-ignore
    try {
      const response = await api.post('sendRedeemDisApproval').values({
        loan_id: payment.loan_id,
        special_discount: additionalPayData.special_discount,
        manual_discount: additionalPayData.manual_discount,
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

      checkDiscountApprovalStatus(response.data);
    } catch (error) {
      msg.error(error);
      return console.log(error);
    }
    //prettier-ignore-end
  };

  // TODO: Maintain a 'LOCKED' status and set it to TRUE when sent to approval. If LOCKED is TRUE refreshing the browser in anyway should not be allowed.

  const checkDiscountApprovalStatus = async (approval_id) => {
    //prettier-ignore
    const checkStatus = setInterval(async () => {
      const response = await api.get(`showDiscountApprovalStatus/${approval_id}`);

      console.log(response.data);

      if (response.data[0]) {
        if (response.data[0].status === 'APPROVED') {
          setShowSectionStates({
            ...showSectionStates,
            timerModal: false,
          });
          clearInterval(checkStatus);
          msg.success(`Your request have been approved`);
          await save();
          resetAll();
        }
      } else {
        // setShowTimerModal(false);
        setShowSectionStates({
          ...showSectionStates,
          timerModal: false,
        });
        msg.info_stick('Your approval request was rejected!');
        clearInterval(checkStatus);
        resetAll();
      }
    }, 3000);
    //prettier-ignore-end

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

  const endTimer = () => {
    // setShowSectionStates({
    //   ...showSectionStates,
    //   timerModal: false,
    // });
    // resetAll();
    msg.info('Please contact the admin for approval');
  };

  const forfeitItems = () => {
    try {
      setIsLoading(true);
      api.post(`saveForfeitList`).values({
        loan_ids: [payment.loan_id],
      });
    } catch (error) {
      console.log(error);
      msg.error('Unable to forfeit');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetAll = () => {
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
      elapsedTime: '',
      intCalTime: '',
      originalRedeemAmt: '',
    });

    setPayment({
      loan_id: '',
      redeem_amount: (0).toFixed(2),
      redeem_interest: 0,
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
  };

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

  const togglePawnigSection = () => {
    setShowSectionStates({
      ...showSectionStates,
      pawningSection: !showSectionStates.pawningSection,
    });
  };

  const toggleTrasHistorySection = () => {
    setShowSectionStates({
      ...showSectionStates,
      transHistorySection: !showSectionStates.transHistorySection,
    });
  };

  const elapsedTimeText = (months, days) => {
    if (months == 0) {
      if (days == 1) {
        return '1 day';
      } else {
        return `${days} days`;
      }
    } else {
      if (months == 1) {
        if (days == 1) {
          return '1 month and 1 day';
        } else {
          return `1 month and ${days} days`;
        }
      } else {
        if (days == 1) {
          return `${months} months and 1 day`;
        } else {
          return `${months} months and ${days} days`;
        }
      }
    }
  };

  const intCalTimeText = (months, days) => {
    if (months == 0) {
      return '0 months';
    } else {
      if (months == 1) {
        if (days == 1) {
          return '1 day';
        } else if (days <= 7) {
          return `${days} days`;
        } else {
          return '1 month';
        }
      } else if (months == 2) {
        if (days == 1) {
          return '1 month and 1 day';
        } else if (days <= 7) {
          return `1 month and ${days} days`;
        } else {
          return '2 months';
        }
      } else {
        if (days == 1) {
          return `${months - 1} months and 1 day`;
        } else if (days <= 7) {
          return `${months - 1} months and ${days} days`;
        } else {
          return `${months} months`;
        }
      }
    }
  };

  /* --- End of component functions --- */

  /* --- Component renders --- */

  //prettier-ignore
  return (
    <div>
      <h5 className="text-center">{moduleName}</h5>
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
          <div className="container">
            <form onSubmit={() => fetchLoanData()} className="compactForm">
              <div className="row">
                <div className="col-sm-6">
                  <div className="form-group row">
                    <label
                      htmlFor="search_nic"
                      className="col-sm-3 col-form-label"
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
                          onFocus={selectAllText}
                          value={billTypeSearch.bill_no}
                          onChange={handleValueChanges}
                        />
                      </div>
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
          </div>
          <br />
          <div className="container">
            <div className="compactForm">
              <div className="row">
                {/* Customer section */}
                <div className="col-sm-6 section-wrap">
                  <div className="form-group row bg-light">
                    <div className="col-sm-10">
                      {/* <h5>Customer</h5> */}
                      <input
                        style={{
                          fontSize: '1.25rem',
                          fontWeight: '700',
                        }}
                        type="text"
                        name="customer_heading"
                        id="customer_heading"
                        className="form-control-plaintext form-control-lg"
                        value={
                          customer.name === '' ? 'Customer' : customer.name
                        }
                        readOnly
                      />
                    </div>
                    <div className="col-sm-2">
                      <SystemButton
                        type={'section-toggle'}
                        collapseState={showSectionStates.customerSection}
                        method={() => toggleCustomerSection()}
                        showText={false}
                      />
                    </div>
                  </div>
                  <div>
                    {showSectionStates.customerSection ? (
                      <div className="compactForm">
                        <div className="form-group row">
                          <label
                            htmlFor="nic"
                            className="col-sm-4 col-form-label"
                          >
                            NIC
                          </label>
                          <div className="col-sm-8">
                            <input
                              type="text"
                              className="form-control-plaintext small-bold-text"
                              id="nic"
                              value={customer.nic}
                              readOnly
                            />
                          </div>
                        </div>
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
                              className="form-control-plaintext small-bold-text"
                              id="old_nic"
                              value={customer.old_nic}
                              readOnly
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
                              className="form-control-plaintext small-bold-text"
                              id="other_names"
                              value={customer.other_names}
                              readOnly
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
                              className="form-control-plaintext small-bold-text"
                              id="telephone"
                              name="telephone"
                              value={customer.telephone}
                              readOnly
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
                              className="form-control-plaintext small-bold-text"
                              id="address_1"
                              name="address_1"
                              rows="1"
                              value={customer.address_1}
                              readOnly
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
                              className="form-control-plaintext small-bold-text"
                              id="address_2"
                              value={customer.address_2}
                              rows="1"
                              readOnly
                            ></textarea>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
                {/* End of customer section */}
                {/* Item section */}
                <div className="col-sm-6 section-wrap">
                  <div className="form-group row bg-light">
                    <div className="col-sm-3">
                      <h5>Items</h5>
                    </div>
                    <div className="offset-7 col-sm-2">
                      <SystemButton
                        type={'section-toggle'}
                        collapseState={showSectionStates.itemSection}
                        method={() => toggleItemsSection()}
                        showText={false}
                      />
                    </div>
                  </div>
                  <div>
                    {showSectionStates.itemSection ? (
                      <div className="table-responsive header-fixed-scrollable">
                        <table className="table table-sm table-striped">
                          <thead className="thead-light">
                            <tr>
                              <th scope="col" className="text-center">
                                Item
                              </th>
                              <th scope="col" className="text-center">
                                Condition
                              </th>
                              <th scope="col" className="text-center">
                                Type
                              </th>
                              <th scope="col" className="text-center">
                                Count
                              </th>
                              <th scope="col" className="text-center">
                                Weight
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {pawningItems.map((item) => {
                              return (
                                <tr key={item.id}>
                                  <td>{item.item.name}</td>
                                  <td>{item.condition.description}</td>
                                  <td>{item.gold_rate.gold_types.category}</td>
                                  <td className="text-center">{item.qty}</td>
                                  <td className="text-right">
                                    {item.gold_weight}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </div>
                </div>
                {/* End of item section */}
              </div>
              <div className="row">
                {/* History section */}
                <div className="col-sm-6 section-wrap">
                  <div className="form-group row bg-light">
                    <div className="col-sm-10">
                      <h5>Transaction History</h5>
                    </div>
                    <div className="col-sm-2">
                      <SystemButton
                        type={'section-toggle'}
                        collapseState={showSectionStates.transHistorySection}
                        method={() => toggleTrasHistorySection()}
                        showText={false}
                      />
                    </div>
                  </div>
                  <div>
                    {showSectionStates.transHistorySection ? (
                      <div className="table-responsive header-fixed-scrollable" style={{maxHeight: '150px'}}>
                        <table className="table table-striped table-sm">
                          <thead className="thead-light">
                            <tr>
                              <th scope="col" className="text-center">
                                Date
                              </th>
                              <th scope="col" className="text-center">
                                Type
                              </th>
                              <th scope="col" className="text-center">
                                Amount
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {transHistory.map((rec) => {
                              return (
                                <tr key={rec.id}>
                                  <td className="text-center">{rec.ddate}</td>
                                  <td>{rec.trans_type.description}</td>
                                  <td className="text-right">{rec.amount}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </div>
                </div>
                {/* End of history section */}

                {/* Pawning section */}
                <div className="col-sm-6 section-wrap">
                  <div className="form-group row bg-light">
                    <div className="col-sm-3">
                      <h5>Pawning</h5>
                    </div>
                    <div className="offset-7 col-sm-2">
                      <SystemButton
                        type={'section-toggle'}
                        collapseState={showSectionStates.pawningSection}
                        method={() => togglePawnigSection()}
                        showText={false}
                      />
                    </div>
                  </div>
                  <div>
                    {showSectionStates.pawningSection ? (
                      <div className="compactForm">
                        <div className="form-group row">
                          <label
                            htmlFor="date"
                            className="col-sm-6 col-form-label"
                          >
                            Date
                          </label>
                          <div className="col-sm-6">
                            <input
                              type="text"
                              name="date"
                              id="date"
                              className="form-control-plaintext form-control-sm text-right font-weight-bold"
                              value={pawningData.ddate}
                              readOnly
                            />
                          </div>
                        </div>
                        <div className="form-group row">
                          <label
                            htmlFor="last_date"
                            className="col-sm-6 col-form-label"
                          >
                            Last date
                          </label>
                          <div className="col-sm-6">
                            <input
                              type="text"
                              name="last_date"
                              id="last_date"
                              className="form-control-plaintext form-control-sm text-right font-weight-bold"
                              value={pawningData.final_date}
                              readOnly
                            />
                          </div>
                        </div>
                        <div className="form-group row">
                          <label
                            htmlFor="gold_weight"
                            className="col-sm-6 col-form-label"
                          >
                            Gold weight (g)
                          </label>
                          <div className="col-sm-6">
                            <input
                              type="text"
                              name="gold_weight"
                              id="gold_weight"
                              className="form-control-plaintext form-control-sm text-right font-weight-bold"
                              value={pawningData.total_weight}
                              readOnly
                            />
                          </div>
                        </div>
                        <div className="form-group row">
                          <label
                            htmlFor="gold_value"
                            className="col-sm-6 col-form-label"
                          >
                            Gold value (LKR)
                          </label>
                          <div className="col-sm-6">
                            <input
                              type="text"
                              name="gold_value"
                              id="gold_value"
                              className="form-control-plaintext form-control-sm text-right font-weight-bold"
                              value={pawningData.gold_value}
                              readOnly
                            />
                          </div>
                        </div>
                        <div className="form-group row">
                          <label
                            htmlFor="loan_amount"
                            className="col-sm-6 col-form-label"
                          >
                            Loan amount (LKR)
                          </label>
                          <div className="col-sm-6">
                            <input
                              type="text"
                              name="loan_amount"
                              id="loan_amount"
                              className="form-control-plaintext form-control-sm text-right font-weight-bold"
                              value={pawningData.required_amount}
                              readOnly
                            />
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
                {/* End of pawning section */}
              </div>

              <div className="form-group row bg-light">
                <div className="col-sm-4">
                  <h5>Redemption Payments</h5>
                </div>
              </div>

              <div className="row">
                <div className="col-sm-4">
                  <div className="row form-group">
                    <label
                      htmlFor="to_date"
                      className="col-form-label col-sm-6"
                    >
                      Redeem Date
                    </label>
                    <div className="col-sm-6">
                      <input
                        type="date"
                        name="to_date"
                        id="to_date"
                        className="form-control form-control-sm text-right font-weight-bold"
                        value={additionalPayData.to_date}
                        onChange={handleValueChanges}
                        disabled={isRedeemedBill ? true : false}
                      />
                    </div>
                  </div>
                  <div className="row form-group">
                    <label htmlFor="init_capital" className="col-sm-6">
                      Loan Amount (LKR)
                    </label>
                    <div className="col-sm-6">
                      <input
                        type="text"
                        className="form-control form-control-sm text-right font-weight-bold"
                        id="init_capital"
                        name="init_capital"
                        value={additionalPayData.init_capital}
                        disabled
                      />
                    </div>
                  </div>
                  <div className="row form-group">
                    <label htmlFor="interest_to_date" className="col-sm-6">
                      Total Interest (LKR)
                    </label>
                    <div className="col-sm-6">
                      <input
                        type="text"
                        className="form-control form-control-sm text-right font-weight-bold"
                        id="interest_to_date"
                        name="interest_to_date"
                        value={additionalPayData.interest_to_date ? parseFloat(additionalPayData.interest_to_date).toFixed(2) : ''}
                        disabled
                      />
                    </div>
                  </div>
                  <div className="row form-group">
                    <label htmlFor="paid_int" className="col-sm-6">
                      Paid Interest (LKR)
                    </label>
                    <div className="col-sm-6">
                      <input
                        type="text"
                        className="form-control form-control-sm text-right font-weight-bold"
                        id="paid_int"
                        name="paid_int"
                        value={additionalPayData.paid_int ? parseFloat(additionalPayData.paid_int).toFixed(2) : ''}
                        disabled
                      />
                    </div>
                  </div>
                  <div className="row form-group">
                    <label htmlFor="paid_capital" className="col-sm-6">
                      Paid Capital (LKR)
                    </label>
                    <div className="col-sm-6">
                      <input
                        type="text"
                        className="form-control form-control-sm text-right font-weight-bold"
                        id="paid_capital"
                        name="paid_capital"
                        value={additionalPayData.paid_capital ? parseFloat(additionalPayData.paid_capital).toFixed(2) : ''}
                        disabled
                      />
                    </div>
                  </div>
                  {/* <div className="row form-group">
                    <label htmlFor="capital_balance" className="col-sm-6">
                      Capital Balance (LKR)
                    </label>
                    <div className="col-sm-6">
                      <input
                        type="text"
                        className="form-control form-control-sm text-right font-weight-bold"
                        id="capital_balance"
                        name="capital_balance"
                        value={additionalPayData.capital_balance ? parseFloat(additionalPayData.capital_balance).toFixed(2) : ''}
                        onChange={handleValueChanges}
                        disabled
                      />
                    </div>
                  </div> */}
                  <div className="row form-group">
                    <label htmlFor="capital_balance" className="col-sm-6">
                      Balance (LKR)
                    </label>
                    <div className="col-sm-6">
                      <input
                        type="text"
                        className="form-control form-control-sm text-right font-weight-bold"
                        id="capital_balance"
                        name="capital_balance"
                        value={additionalPayData.originalRedeemAmt ? parseFloat(additionalPayData.originalRedeemAmt).toFixed(2) : ''}
                        disabled
                      />
                    </div>
                  </div>
                  <div className="form-group row">
                    <label htmlFor="document_fee" className="col-sm-6">Reminder Letters Fees</label>
                    <div className="col-sm-6">
                      <input
                        type="text"
                        name="document_fee"
                        id="document_fee"
                        className="form-control text-right font-weight-bold"
                        disabled
                        value={additionalPayData.document_fee}
                      />
                    </div>
                  </div>
                </div>

                {/* Interest rates and discount rates column */}
                <div className="col-sm-3">
                  {/* Interest rates */}
                  {/* <h6 className="font-weight-bold">Interest and Discount Rates</h6> */}
                  <div className="form-group">
                    <label htmlFor="fm_int_rate">
                      First Month Interest
                    </label>
                    <div className="row">
                      <div className="col-sm-5 input-group input-group-sm">
                        <div className="input-group-prepend">
                          <span className="input-group-text input-group-text-custom" id="fm_int_rate">%</span>
                        </div>
                        <input
                          type="text"
                          name="fm_int_rate"
                          id="fm_int_rate"
                          className="form-control text-right font-weight-bold"
                          value={additionalPayData.fm_int_rate ? parseFloat(additionalPayData.fm_int_rate).toFixed(2) : ''}
                          readOnly
                        />
                      </div>
                      <div className="col-sm-7 input-group input-group-sm">
                        <div className="input-group-prepend">
                          <span className="input-group-text input-group-text-custom" id="fm_int_rate">LKR</span>
                        </div>
                        <input
                          type="text"
                          name="fm_int_rate"
                          id="fm_int_rate"
                          className="form-control text-right font-weight-bold"
                          value={additionalPayData.fm_int ? parseFloat(additionalPayData.fm_int).toFixed(2) : ''}
                          readOnly
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="nm_int_rate">
                      Next Month Interest
                    </label>
                    <div className="row">
                      <div className="col-sm-5 input-group input-group-sm">
                        <div className="input-group-prepend">
                          <span className="input-group-text input-group-text-custom" id="nm_int_rate">%</span>
                        </div>
                        <input
                          type="text"
                          name="nm_int_rate"
                          id="nm_int_rate"
                          className="form-control text-right font-weight-bold"
                          value={additionalPayData.nm_int_rate ? parseFloat(additionalPayData.nm_int_rate).toFixed(2) : ''}
                          readOnly
                        />
                      </div>
                      <div className="col-sm-7 input-group input-group-sm">
                        <div className="input-group-prepend">
                          <span className="input-group-text input-group-text-custom" id="nm_int_rate">LKR</span>
                        </div>
                        <input
                          type="text"
                          name="nm_int_rate"
                          id="nm_int_rate"
                          className="form-control text-right font-weight-bold"
                          value={additionalPayData.nm_int ? parseFloat(additionalPayData.nm_int).toFixed(2) : ''}
                          readOnly
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="discount_days">
                      Discounts
                    </label>
                    <div className="row">
                      <div className="col-sm-5 input-group input-group-sm">
                        <div className="input-group-prepend">
                          <span className="input-group-text input-group-text-custom" id="discount_rate">%</span>
                        </div>
                        <input
                          type="text"
                          name="discount_rate"
                          id="discount_rate"
                          className="form-control text-right font-weight-bold"
                          value={intRates.discount_rate ? parseFloat(intRates.discount_rate).toFixed(2) : ''}
                          readOnly
                        />
                      </div>
                      <div className="col-sm-7 input-group input-group-sm">
                        <div className="input-group-prepend">
                          <span className="input-group-text input-group-text-custom" id="discount_days">Days</span>
                        </div>
                        <input
                          type="text"
                          name="discount_days"
                          id="discount_days"
                          className="form-control text-right font-weight-bold"
                          value={intRates.discount_days ? parseInt(intRates.discount_days) : ''}
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                </div>
                {/* End of interest and discount rates and column */}

                <div className="col-sm-5">
                  <div className="row form-group">
                    <label htmlFor="elapsed_time" className="col-sm-5">
                      Interest Calculated For
                    </label>
                    <div className="col-sm-7">
                      <input
                        type="text"
                        className="form-control-plaintext text-right kinda-important-text-3"
                        id="elapsed_time"
                        name="elapsed_time"
                        value={additionalPayData.intCalTime ? additionalPayData.intCalTime : null}
                        onChange={handleValueChanges}
                        disabled
                      />
                    </div>
                  </div>
                  <div className="row form-group">
                    <label htmlFor="redeem_interest" className="col-sm-6">
                      Redeem Interest (LKR)
                    </label>
                    <div className="col-sm-6">
                      <input
                        type="text"
                        className="form-control-plaintext form-control-sm text-right font-weight-bold important-text-3"
                        id="redeem_interest"
                        name="redeem_interest"
                        value={payment.redeem_interest ? parseFloat(payment.redeem_interest).toFixed(2) : ''}
                        onChange={handleValueChanges}
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="row form-group">
                    <label
                      htmlFor="manual_discount"
                      className="col-form-label col-sm-6"
                    >
                      Discount (LKR)
                    </label>
                    <div className="col-sm-6">
                      <input
                        type="text"
                        name="manual_discount"
                        id="manual_discount"
                        className="form-control form-control-sm text-right font-weight-bold"
                        onFocus={selectAllText}
                        value={additionalPayData.manual_discount}
                        onChange={handleValueChanges}
                        disabled={isRedeemedBill ? true : false}
                      />
                    </div>
                  </div>
                  <div className="row form-group">
                    <label
                      htmlFor="discount"
                      className="col-form-label col-sm-6"
                    >
                      Total Discount (LKR)
                    </label>
                    <div className="col-sm-6">
                      <input
                        type="text"
                        name="discount"
                        id="discount"
                        className="form-control-plaintext form-control-sm text-right font-weight-bold important-text-3"
                        value={payment.discount}
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="row form-group">
                    <label
                      htmlFor="paying_amount"
                      className="col-form-label col-sm-6"
                    >
                      Paying Amount (LKR)
                    </label>
                    <div className="col-sm-6">
                      <input
                        type="text"
                        name="paying_amount"
                        id="paying_amount"
                        className="form-control form-control-sm text-right font-weight-bold"
                        onFocus={selectAllText}
                        value={additionalPayData.paying_amount}
                        onChange={handleValueChanges}
                        disabled={isRedeemedBill ? true : false}
                      />
                    </div>
                  </div>
                  <br />
                  <div className="row form-group">
                    <label htmlFor="redeem_amount" className="col-sm-6">
                      Amount (LKR)
                    </label>
                    <div className="col-sm-6">
                      <input
                        type="text"
                        className="form-control-plaintext form-control-lg text-right font-weight-bold important-text"
                        id="redeem_amount"
                        name="redeem_amount"
                        value={parseFloat(payment.redeem_amount).toFixed(2)}
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>

              <br />

              <div className="row">
                <div className="col-sm-2">
                  <div className="custom-control custom-switch">
                    <input
                      type="checkbox"
                      className={
                        payment.jp_note
                          ? `custom-control-input`
                          : `custom-control-input`
                      }
                      id="jp_note"
                      name="jp_note"
                      checked={payment.jp_note}
                      onChange={handleValueChanges}
                      disabled={
                        customer.is_blacklisted || isRedeemedBill ? true : false
                      }
                    />
                    <label className="custom-control-label" htmlFor="jp_note">
                      JP note
                    </label>
                  </div>
                </div>
                <div className="col-sm-2">
                  {payment.jp_note ? (
                    <div className="form-group">
                      <input
                        className="form-control-sm font-weight-bold"
                        id="jp_seriel"
                        name="jp_seriel"
                        value={payment.jp_seriel}
                        onChange={handleValueChanges}
                        placeholder="JP note seriel number"
                      />
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="row justify-content-end">
                {
                  isRedeemedBill ? (
                    <> 
                      <div className="col-sm-3">
                        <SystemButton
                          type={'print'}
                          showText={true}
                          btnText="Re-print Bill"
                          method={reprintRedeemBill}
                        />
                      </div>
                      <div className="col-sm-3">
                        <SystemButton
                          type={'print'}
                          showText={true}
                          btnText="Re-print Pawning Bill"
                          method={reprintPawningBill}
                        />
                      </div>
                    </>
                  ) : (
                    moment().diff(moment(pawningData.final_date), 'days') > 1 ? (
                      <div className="col-sm-2">
                        <button
                          className="btn btn-sm btn-block btn-info"
                          onClick={forfeitItems}
                        >
                          <span>
                            <SafeFontAwesomeIcon icon={faGavel} size="sm" />
                          </span>
                          &nbsp; Forfeit
                        </button>
                      </div>
                    ) : null
                  )
                }
                  {/* {moment().diff(moment(pawningData.final_date), 'days') > 1 ? (
                    <button
                      className="btn btn-sm btn-block btn-info"
                      onClick={forfeitItems}
                    >
                      <span>
                        <SafeFontAwesomeIcon icon={faGavel} size="sm" />
                      </span>
                      &nbsp; Forfeit
                    </button>
                  ) : null} */}
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
                    btnText="Redeem"
                    disabled={
                      moment().format(`YYYY-MM-DD`).toString() !=
                        moment(additionalPayData.to_date)
                          .format(`YYYY-MM-DD`)
                          .toString() ||
                      isRedeemedBill ||
                      customer.is_blacklisted
                        ? true
                        : false
                    }
                  />
                </div>
              </div>
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
                Discount approval request sent. Please wait for the response..
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
    </div>
  );
  //prettier-ignore-end

  /* --- End of component renders --- */
};

export default Redemptions;
