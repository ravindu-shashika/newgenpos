import React, { useState, useEffect } from 'react';
import { api, cookie, msg, print } from './../../services';
import moment from 'moment';
import { FormModal, SystemButton } from '../../components';
import { faDollarSign } from '@fortawesome/free-solid-svg-icons';

const PartPayments = () => {
  // Module name
  const moduleName = 'Part Payments';

  /* --- State declarationss --- */

  const [loanId, setLoanId] = useState('');

  const [billTypeSearch, setBillTypeSearch] = useState({
    bill_type_id: '',
    bill_no: '',
    branch_id: cookie.get('user_branch'),
  });

  // const [allBillTypes, setAllBillTypes] = useState([]);

  const [branchBillTypes, setBranchBillTypes] = useState([]);

  const [allBranches, setAllBranches] = useState([]);

  const [pawningItems, setPawningItems] = useState([]);

  const [transHistory, setTransHistory] = useState([]);

  const [pawningData, setPawningData] = useState({
    id: '',
    branch_id: '',
    ddate: moment().format(`YYYY-MM-DD`),
    final_date: moment().format(`YYYY-MM-DD`),
    total_weight: (0).toFixed(2),
    gold_value: (0).toFixed(2),
    required_amount: (0).toFixed(2),
  });

  const [customer, setCustomer] = useState({
    nic: '',
    name: '',
    address_1: '',
    address_2: '',
    telephone: '',
    old_nic: '',
    other_names: '',
    is_blacklisted: false,
    notes: '',
  });

  const [payment, setPayment] = useState({
    loan_id: '',
    ddate: moment().format(`YYYY-MM-DD`),
    trans_type_id: '',
    interest_for: '',
    amount: '',
    bill_extended_period: '0',
  });

  const [additionalPayData, setAdditionalPayData] = useState({
    tot_balance: '',
    new_balance: '',
    monthsElapsed: 0,
    fm_int_rate: '',
    nm_int_rate: '',
    fm_int: '',
    nm_int: '',
    init_capital: '',
    interest_to_date: '',
    curr_capital_balance: '',
    new_capital_balance: '',
    curr_interest_balance: '',
    new_interest_balance: '',
    paid_int: '',
    paid_capital: '',
    elapsedTime: '',
  });

  const [isLoading, setIsLoading] = useState(false);

  const [isCapitalPayment, setIsCapitalPayment] = useState(false);

  const [showSectionStates, setShowSectionStates] = useState({
    customerSection: true,
    pawningSection: true,
    transHistorySection: true,
    itemSection: true,
    paymentMediumModal: false,
  });

  /* --- End of state declarations --- */

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setTransType();
  }, [isCapitalPayment]);

  /* --- Component functions --- */

  const fetchData = async () => {
    const response = await api.get(`part-payments`);

    console.log(response.data);

    setAllBranches(response.data);

    response.data.forEach((row) => {
      if (parseInt(row.id) === parseInt(cookie.get('user_branch'))) {
        setBranchBillTypes(row.bill_types);
      }
    });
  };

  const fetchLoanData = async () => {
    try {
      setIsLoading(true);

      const response = await api.post(`showLoan`).values({
        branch_id: billTypeSearch.branch_id,
        bill_type_id: billTypeSearch.bill_type_id,
        bill_no: billTypeSearch.bill_no,
      });

      console.log(response.data);

      // ----------------------------- Cal paid amounts -----------------------------
      const paidAmounts = await calPaidAmounts(response.data[0].loan_trans);
      console.log(
        '-----------------------Paid amounts---------------------------',
      );
      console.log(paidAmounts);
      console.log(
        '-----------------------Paid amounts---------------------------',
      );
      // ----------------------------- Cal paid amounts end -----------------------------

      // ----------------------------- Dates -----------------------------
      // prettier-ignore
      const months = moment().diff(moment(response.data[0].ddate), 'months');
      // prettier-ignore-end
      // prettier-ignore
      const nextMonthDate = moment(response.data[0].ddate).add(1, 'months');
      // prettier-ignore-end
      // prettier-ignore
      const days = moment().add(1, 'days').diff(moment(response.data[0].ddate), 'days');
      // prettier-ignore-end
      // prettier-ignore
      const nextMonthDays = moment().diff(moment(nextMonthDate), 'days');
      // prettier-ignore-end

      // prettier-ignore
      const elapsedMonths = moment().diff(moment(response.data[0].ddate), 'months');
      // prettier-ignore-end
      // prettier-ignore
      const elapsedDays = elapsedMonths == 0 ? moment().add(1, 'days').diff(moment(response.data[0].ddate).add(elapsedMonths, 'months'), 'days') : moment().diff(moment(response.data[0].ddate).add(elapsedMonths, 'months'), 'days');
      // prettier-ignore-end

      // ----------------------------- Dates end -----------------------------

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

      setPawningData({
        id: response.data[0].id,
        branch_id: response.data[0].branch_id,
        ddate: response.data[0].ddate,
        final_date: response.data[0].final_date,
        total_weight: parseFloat(response.data[0].total_weight).toFixed(2),
        gold_value: parseFloat(response.data[0].gold_value).toFixed(2),
        required_amount: parseFloat(response.data[0].required_amount).toFixed(
          2,
        ),
      });

      setPayment({
        ...payment,
        loan_id: response.data[0].id,
      });

      // prettier-ignore
      setAdditionalPayData({
        ...additionalPayData,
        monthsElapsed: months,
        fm_int_rate: response.data[0].int_rate.fm_interest_rate,
        nm_int_rate: response.data[0].int_rate.nm_interest_rate,
        init_capital: response.data[0].required_amount,
        fm_int: (parseFloat(response.data[0].required_amount) * parseFloat(response.data[0].int_rate.fm_interest_rate)) / 100,
        nm_int: (parseFloat(response.data[0].required_amount) * parseFloat(response.data[0].int_rate.nm_interest_rate)) / 100,
        interest_to_date: parseFloat(totInterest).toFixed(2),
        curr_capital_balance: parseFloat(response.data[0].required_amount) - parseFloat(paidAmounts.paidCapital),
        curr_interest_balance: parseFloat(totInterest) - parseFloat(paidAmounts.paidInterest),
        new_capital_balance: parseFloat(response.data[0].required_amount) - parseFloat(paidAmounts.paidCapital),
        new_interest_balance: parseFloat(totInterest) - parseFloat(paidAmounts.paidInterest),
        tot_balance: days <= 7
        ? parseFloat(response.data[0].required_amount) -
          parseFloat(paidAmounts.paidCapital)
        : parseFloat(parseFloat(response.data[0].required_amount) - parseFloat(paidAmounts.paidCapital)) +
          parseFloat(parseFloat(totInterest) - parseFloat(paidAmounts.paidInterest)),
        new_balance: days <= 7
        ? parseFloat(response.data[0].required_amount) -
          parseFloat(paidAmounts.paidCapital)
        : parseFloat(parseFloat(response.data[0].required_amount) - parseFloat(paidAmounts.paidCapital)) +
          parseFloat(parseFloat(totInterest) - parseFloat(paidAmounts.paidInterest)),
        paid_int: parseFloat(paidAmounts.paidInterest).toFixed(2),
        paid_capital: parseFloat(paidAmounts.paidCapital).toFixed(2),
        elapsedTime: elapsedTimeText(elapsedMonths, elapsedDays)
      });
      // prettier-ignore-end

      setCustomer(response.data[0].customer);

      setPawningItems(response.data[0].loan_item);

      setTransHistory(response.data[0].loan_trans);

      if (months === 0) {
        setIsCapitalPayment(true);
      } else {
        setIsCapitalPayment(false);
      }

      if (response.data[0].customer.is_blacklisted === 1) {
        msg.error('Customer is blacklisted');
        msg.info_stick(response.data[0].customer.notes);
      }

      setShowSectionStates({
        ...showSectionStates,
        customerSection: true,
        pawningSection: true,
        transHistorySection: true,
        itemSection: true,
      });

      setIsLoading(false);
    } catch (error) {
      console.log(error);
      setIsLoading(false);
      return msg.error('Unable to fetch data!');
    }
  };

  const calPaidAmounts = async (trans) => {
    let paidCapital = 0;
    let paidInterest = 0;
    return Promise.all(
      trans.map((row) => {
        if (row.trans_type_id === 8) {
          paidCapital += row.amount;
        }
        if (row.trans_type_id === 7 || row.trans_type_id === 11) {
          paidInterest += row.amount;
        }
      }),
    ).then(() => {
      return {
        paidCapital: paidCapital,
        paidInterest: paidInterest,
      };
    });
  };

  // const calDiscount = async (
  //   requiredAmount,
  //   payableAmount,
  //   intRates,
  //   totInt,
  //   months,
  //   days,
  //   nmDays,
  // ) => {
  //   let discount = 0;
  //   if (months == 0) {
  //     if (days <= intRates.discount_days) {
  //       // prettier-ignore
  //       return Promise.all([
  //         (discount = parseFloat((parseFloat(requiredAmount) * parseFloat(intRates.discount_rate)) / 100).toFixed(2)),
  //       ]).then(() => {
  //         return discount;
  //       });
  //       // prettier-ignore-end
  //     } else {
  //       // prettier-ignore
  //       return Promise.all([
  //         (discount = (0).toFixed(2)),
  //       ]).then(() => {
  //         return discount;
  //       });
  //       // prettier-ignore-end
  //     }
  //   } else {
  //     // if (nmDays >= 1 && nmDays <= 7) {
  //     //   return Promise.all([
  //     //     // (discount = (parseFloat((parseFloat(payableAmount) * parseFloat(intRates.fm_interest_rate)) / 100) - parseFloat(totInt)).toFixed(2)),
  //     //     (discount = (0).toFixed(2))
  //     //   ]).then(() => {
  //     //     return discount;
  //     //   });
  //     // } else {
  //     //   return Promise.all([
  //     //     (discount = (0).toFixed(2)),
  //     //   ]).then(() => {
  //     //     return discount;
  //     //   });

  //     // prettier-ignore
  //     return Promise.all([
  //       (discount = (0).toFixed(2)),
  //     ]).then(() => {
  //       return discount;
  //     });
  //     // prettier-ignore-end
  //   }
  // };

  const calTotalInterest = async (
    requiredAmount,
    payableAmount,
    intRates,
    months,
    days,
    nmDays,
  ) => {
    // prettier-ignore
    let fmInt = parseFloat(parseFloat(parseFloat(payableAmount) * parseFloat(intRates.fm_interest_rate)) / 100).toFixed(2);
    // prettier-ignore-end
    // prettier-ignore
    let nmInt = parseFloat(parseFloat(parseFloat(requiredAmount) * parseFloat(intRates.nm_interest_rate)) / 100).toFixed(2);
    // prettier-ignore-end
    let totInt = 0;

    if (months == 0) {
      // prettier-ignore
      // if (days <= intRates.discount_days) {
      //   return Promise.all([
      //     // (totInt = parseFloat(parseFloat(parseFloat(payableAmount) * (parseFloat(intRates.fm_interest_rate) - parseFloat(intRates.discount_rate))) / 100).toFixed(2)),
      //     (totInt = fmInt),
      //   ]).then(() => {
      //     return totInt;
      //   });
      // } else {
      //   return Promise.all([
      //     (totInt = fmInt),
      //   ]).then(() => {
      //     return totInt;
      //   });
      // }
      return Promise.all([
          (totInt = fmInt),
        ]).then(() => {
          return totInt;
        });
      // prettier-ignore-end
    } else {
      // prettier-ignore
      if (nmDays < 7) {
        return Promise.all([
          (totInt = parseFloat(parseFloat(fmInt) + parseFloat(parseFloat(parseFloat(nmInt) * parseInt(nmDays)) / parseFloat(parseFloat(30)))).toFixed(2))
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

  // const calNewBalances = async () => {
  //   // prettier-ignore
  //   if (isCapitalPayment) {
  //     setAdditionalPayData({
  //       ...additionalPayData,
  //       new_capital_balance: payment.amount
  //       ? (parseFloat(additionalPayData.curr_capital_balance) -
  //       parseFloat(payment.amount)).toFixed(2)
  //       : parseFloat(additionalPayData.curr_capital_balance).toFixed(2),
  //       new_balance: payment.amount
  //         ? (parseFloat(additionalPayData.tot_balance) -
  //           parseFloat(payment.amount)).toFixed(2)
  //         : parseFloat(additionalPayData.tot_balance).toFixed(2),
  //     });
  //   }
  //   if (!isCapitalPayment) {
  //     setAdditionalPayData({
  //       ...additionalPayData,
  //       new_interest_balance: payment.amount
  //         ? (
  //             parseFloat(additionalPayData.curr_interest_balance) -
  //             parseFloat(payment.amount)
  //           ).toFixed(2)
  //         : parseFloat(additionalPayData.curr_interest_balance).toFixed(2),
  //       new_balance: payment.amount
  //         ? (
  //             parseFloat(additionalPayData.tot_balance) -
  //             parseFloat(payment.amount)
  //           ).toFixed(2)
  //         : parseFloat(additionalPayData.tot_balance).toFixed(2),
  //     });
  //   }
  //   // prettier-ignore-end
  // };

  const handleValueChanges = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue = targetInput.value;

    if (inputName === 'search_branch') {
      setBillTypeSearch({
        ...billTypeSearch,
        branch_id: inputValue,
      });

      allBranches.map((branch) => {
        if (parseInt(branch.id) === parseInt(inputValue)) {
          setBranchBillTypes(branch.bill_types);
        }
      });
    }

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

    if (inputName === 'interest_for') {
      if (inputValue === '' || parseInt(inputValue) === 0) {
        setPayment({
          ...payment,
          ddate: moment().format('YYYY-MM-DD'),
          interest_for: 0,
          amount: 0,
        });
      } else {
        if (inputValue <= additionalPayData.monthsElapsed) {
          // prettier-ignore
          setPayment({
            ...payment,
            ddate: moment().format('YYYY-MM-DD'),
            amount:
              parseInt(additionalPayData.monthsElapsed) === 1
                ? parseFloat(additionalPayData.fm_int)
                : parseFloat(additionalPayData.fm_int) + parseFloat(parseFloat(additionalPayData.nm_int_rate) * (parseInt(inputValue) - 1)),
            interest_for: inputValue,
          });
          // prettier-ignore-end
        } else {
          msg.error(
            `Interest payment cannot exceed ${additionalPayData.monthsElapsed} month/s`,
          );
        }
      }
    }

    if (inputName === 'amount') {
      setPayment({
        ...payment,
        ddate: moment().format('YYYY-MM-DD'),
        amount: inputValue,
      });
    }
  };

  const handleSubmit = async () => {
    await save();

    resetAll();
  };

  const save = async () => {
    try {
      const response = await api.post('savePartPayment').values({
        loan_trans: payment,
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
        console.log(response);
        msg.success(
          `Part-payment made for bill no ${response.data[0].loan.bill_type.des} - ${response.data[0].loan.bill_no}`,
        );
        print.partPaymentBill(response.data[0]);
      }
      msg.success(response.data);
    } catch (error) {
      msg.error(error);
      return console.log(error);
    }
  };

  const setTransType = () => {
    if (isCapitalPayment) {
      setPayment({
        ...payment,
        trans_type_id: 8,
        amount: 0,
        interest_for: 0,
      });
    } else {
      setPayment({
        ...payment,
        trans_type_id: 7,
        amount: 0,
        interest_for: 0,
      });
    }
  };

  const resetForm = () => {
    setPawningData({
      id: '',
      branch_id: '',
      ddate: moment().format(`YYYY-MM-DD`),
      final_date: moment().format(`YYYY-MM-DD`),
      total_weight: (0).toFixed(2),
      gold_value: (0).toFixed(2),
      required_amount: (0).toFixed(2),
    });

    setCustomer({
      nic: '',
      id: '',
      name: '',
      address_1: '',
      address_2: '',
      telephone: '',
      old_nic: '',
      other_names: '',
      notes: '',
      is_blacklisted: false,
    });

    setPayment({
      loan_id: '',
      trans_type_id: '',
      interest_for: '',
      bill_extended_period: 0,
      amount: (0).toFixed(2),
    });

    setAdditionalPayData({
      tot_balance: '',
      new_balance: '',
      monthsElapsed: '',
      fm_int_rate: '',
      nm_int_rate: '',
      fm_int: '',
      nm_int: '',
      init_capital: '',
      interest_to_date: '',
      curr_capital_balance: '',
      new_capital_balance: '',
      curr_interest_balance: '',
      new_interest_balance: '',
      paid_int: '',
      paid_capital: '',
      elapsedTime: '',
    });

    setBillTypeSearch({
      bill_type_id: '',
      bill_no: '',
      branch_id: cookie.get('user_branch'),
    });
  };

  const resetAll = () => {
    setPawningData({
      id: '',
      branch_id: '',
      ddate: moment().format(`YYYY-MM-DD`),
      final_date: moment().format(`YYYY-MM-DD`),
      total_weight: (0).toFixed(2),
      gold_value: (0).toFixed(2),
      required_amount: (0).toFixed(2),
    });

    setCustomer({
      nic: '',
      id: '',
      name: '',
      address_1: '',
      address_2: '',
      telephone: '',
      old_nic: '',
      other_names: '',
      notes: '',
      is_blacklisted: false,
    });

    setPayment({
      loan_id: '',
      trans_type_id: '',
      interest_for: '',
      bill_extended_period: 0,
      amount: (0).toFixed(2),
    });

    setAdditionalPayData({
      tot_balance: '',
      new_balance: '',
      monthsElapsed: '',
      fm_int_rate: '',
      nm_int_rate: '',
      fm_int: '',
      nm_int: '',
      init_capital: '',
      interest_to_date: '',
      curr_capital_balance: '',
      new_capital_balance: '',
      curr_interest_balance: '',
      new_interest_balance: '',
      paid_int: '',
      paid_capital: '',
      elapsedTime: '',
    });

    setBillTypeSearch({
      bill_type_id: '',
      bill_no: '',
      branch_id: cookie.get('user_branch'),
    });

    setPawningItems([]);

    setTransHistory([]);

    setLoanId('');

    setShowSectionStates({
      ...showSectionStates,
      customerSection: true,
      pawningSection: true,
      transHistorySection: true,
      itemSection: true,
    });
  };

  const toggleCustomerSection = () => {
    setShowSectionStates({
      ...showSectionStates,
      customerSection: !showSectionStates.customerSection,
    });
  };

  const togglePawningSection = () => {
    setShowSectionStates({
      ...showSectionStates,
      pawningSection: !showSectionStates.pawningSection,
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

  const togglePaymentMediumModal = () => {
    setShowSectionStates({
      ...showSectionStates,
      paymentMediumModal: !showSectionStates.paymentMediumModal,
    });
  };

  const selectAllText = (e) => {
    e.target.select();
  };

  /* --- End of component functions --- */

  /* --- Component renders --- */

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
                        className="form-control form-control-sm"
                        id="search_branch"
                        name="search_branch"
                        placeholder="Type"
                        value={billTypeSearch.branch_id}
                        onChange={handleValueChanges}
                      >
                        <option
                          value=""
                          className="dropdown-item text-muted text-light"
                          disabled
                        >
                          -- Select a branch
                        </option>
                        {allBranches.map((branch) => {
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
                          {branchBillTypes
                            ? branchBillTypes.map((bill) => {
                                return (
                                  <option
                                    className="dropdown-item"
                                    key={bill.bill_type.id}
                                    value={bill.bill_type.id}
                                  >
                                    {bill.bill_type.des}
                                  </option>
                                );
                              })
                            : null}
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
          <div className="container">
            <div>
              <div className="row compactForm">
                {/* Customer section */}
                <div className="col-sm-6 section-wrap">
                  <div className="form-group row bg-light">
                    <div className="col-sm-10">
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
                      <div>
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
                              value={customer.address_1}
                              rows="1"
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
                              name="address_2"
                              value={customer.address_2}
                              rows="1"
                              readOnly
                            ></textarea>
                          </div>
                        </div>
                        <br />
                      </div>
                    ) : null}
                  </div>
                </div>
                {/* End of customer section */}

                {/* Items section */}
                <div className="col-sm-6 section-wrap">
                  <div className="form-group row bg-light">
                    <div className="col-sm-3">
                      <h5>
                        Items &nbsp;
                        {pawningItems.length ? (
                          <span className="badge badge-pill badge-secondary">
                            {pawningItems.length}
                          </span>
                        ) : null}
                      </h5>
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
                      <div>
                        <div className="row table-responsive header-fixed-scrollable">
                          <table
                            className="table table-striped table-sm"
                            style={{ overflowY: 'auto' }}
                          >
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
                                    <td>
                                      {item.gold_rate.gold_types.category}
                                    </td>
                                    <td>{item.qty}</td>
                                    <td className="text-right">
                                      {item.gold_weight}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
                {/* End of items section */}
              </div>

              <div className="row">
                {/* Transaction history section */}
                <div className="col-sm-6 section-wrap">
                  <div className="form-group row bg-light">
                    <div className="col-sm-7">
                      <h5>Transaction History</h5>
                    </div>
                    <div className="offset-3 col-sm-2">
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
                      <div>
                        <div
                          className="table-responsive header-fixed-scrollable"
                          style={{ maxHeight: '150px' }}
                        >
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
                      </div>
                    ) : null}
                  </div>
                </div>
                {/* End of transaction history section */}
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
                        method={() => togglePawningSection()}
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

              <div className="compactForm">
                <div className="form-group row bg-light">
                  <div className="col-sm-4">
                    <h5>Payments</h5>
                  </div>
                </div>
                <div className="row">
                  {/* Capitals */}
                  <div className="col-sm-4">
                    <div className="row form-group">
                      <label htmlFor="init_capital" className="col-sm-7">
                        Loan Amount (LKR)
                      </label>
                      <div className="col-sm-5">
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
                      <label htmlFor="interest_to_date" className="col-sm-7">
                        Total Interest (LKR)
                      </label>
                      <div className="col-sm-5">
                        <input
                          type="text"
                          className="form-control form-control-sm text-right font-weight-bold"
                          id="interest_to_date"
                          name="interest_to_date"
                          value={additionalPayData.interest_to_date}
                          disabled
                        />
                      </div>
                    </div>
                    <div className="row form-group">
                      <label htmlFor="paid_capital" className="col-sm-7">
                        Paid Capital (LKR)
                      </label>
                      <div className="col-sm-5">
                        <input
                          type="text"
                          className="form-control form-control-sm text-right font-weight-bold"
                          id="paid_capital"
                          name="paid_capital"
                          value={additionalPayData.paid_capital}
                          disabled
                        />
                      </div>
                    </div>
                    <div className="row form-group">
                      <label htmlFor="paid_int" className="col-sm-7">
                        Paid Interest (LKR)
                      </label>
                      <div className="col-sm-5">
                        <input
                          type="text"
                          className="form-control form-control-sm text-right font-weight-bold"
                          id="paid_int"
                          name="paid_int"
                          value={additionalPayData.paid_int}
                          disabled
                        />
                      </div>
                    </div>
                    <div className="row form-group">
                      <label
                        htmlFor="curr_capital_balance"
                        className="col-sm-7"
                      >
                        Loan Balance (LKR)
                      </label>
                      <div className="col-sm-5">
                        <input
                          type="text"
                          className="form-control form-control-sm text-right font-weight-bold"
                          id="curr_capital_balance"
                          name="curr_capital_balance"
                          value={additionalPayData.curr_capital_balance}
                          disabled
                        />
                      </div>
                    </div>
                    <div className="row form-group">
                      <label
                        htmlFor="curr_interest_balance"
                        className="col-sm-7"
                      >
                        Interest Balance (LKR)
                      </label>
                      <div className="col-sm-5">
                        <input
                          type="text"
                          className="form-control form-control-sm text-right font-weight-bold"
                          id="curr_interest_balance"
                          name="curr_interest_balance"
                          value={additionalPayData.curr_interest_balance}
                          disabled
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mid column */}
                  {/* prettier-ignore */}
                  <div className="col-sm-3">
                    <div className="form-group">
                      <label htmlFor="nm_int_rate" className="font-weight-bold">Next Month Interest</label>
                      <div className="row">
                        <div className="col-sm-5 input-group input-group-sm">
                          <div className="input-group-prepend">
                            <span
                              className="input-group-text input-group-text-custom"
                              id="nm_int_rate"
                            >
                              %
                            </span>
                          </div>
                          <input
                            type="text"
                            name="nm_int_rate"
                            id="nm_int_rate"
                            className="form-control text-right font-weight-bold"
                            value={
                              additionalPayData.nm_int_rate
                                ? parseFloat(additionalPayData.nm_int_rate).toFixed(2)
                                : ''
                            }
                            readOnly
                          />
                        </div>
                        <div className="col-sm-7 input-group input-group-sm">
                          <div className="input-group-prepend">
                            <span
                              className="input-group-text input-group-text-custom"
                              id="nm_int_rate"
                            >
                              LKR
                            </span>
                          </div>
                          <input
                            type="text"
                            name="nm_int_rate"
                            id="nm_int_rate"
                            className="form-control text-right font-weight-bold"
                            value={
                              additionalPayData.nm_int
                                ? parseFloat(additionalPayData.nm_int).toFixed(2)
                                : ''
                            }
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="nm_int_rate" className="font-weight-bold">New Balances</label>
                      <div className="row form-group">
                        <label
                          htmlFor="new_interest_balance"
                          className="col-sm-7"
                        >
                          Interest (LKR)
                        </label>
                        <div className="col-sm-5">
                          <input
                            type="text"
                            className="form-control form-control-sm text-right font-weight-bold"
                            id="new_interest_balance"
                            name="new_interest_balance"
                            value={additionalPayData.new_interest_balance}
                            disabled
                          />
                        </div>
                      </div>
                      <div className="row form-group">
                        <label
                          htmlFor="new_capital_balance"
                          className="col-sm-7"
                        >
                          Capital (LKR)
                        </label>
                        <div className="col-sm-5">
                          <input
                            type="text"
                            className="form-control form-control-sm text-right font-weight-bold"
                            id="new_capital_balance"
                            name="new_capital_balance"
                            value={additionalPayData.new_capital_balance}
                            disabled
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* prettier-ignore-end */}

                  <div className="col-sm-5">
                    {/* Switches */}
                    <div className="row form-group">
                      <label htmlFor="elapsed_time" className="col-sm-5">
                        Time since pawning
                      </label>
                      <div className="col-sm-7">
                        <input
                          type="text"
                          className="form-control-plaintext text-right kinda-important-text-3"
                          id="redeem_interest"
                          name="redeem_interest"
                          value={
                            additionalPayData.elapsedTime
                              ? additionalPayData.elapsedTime
                              : null
                          }
                          onChange={handleValueChanges}
                          disabled
                        />
                      </div>
                    </div>
                    <div
                      className="btn btn-sm btn-block"
                      onClick={() => setIsCapitalPayment(false)}
                      style={
                        additionalPayData.monthsElapsed === 0
                          ? { pointerEvents: 'none' }
                          : null
                      }
                    >
                      <a
                        className={
                          isCapitalPayment
                            ? 'nav-link tab-inactive'
                            : 'nav-link tab-active'
                        }
                      >
                        Interest Payment
                      </a>
                    </div>
                    <div
                      className="btn btn-sm btn-block"
                      onClick={() => setIsCapitalPayment(true)}
                    >
                      <a
                        className={
                          isCapitalPayment
                            ? 'nav-link tab-active'
                            : 'nav-link tab-inactive'
                        }
                      >
                        Capital Payment
                      </a>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="offset-6 col-sm-3">
                    {isCapitalPayment ? null : (
                      <div className="form-group">
                        <label htmlFor="interest_for">
                          Interest for (months)
                        </label>
                        <input
                          type="number"
                          className="form-control form-control-sm text-right font-weight-bold"
                          id="interest_for"
                          name="interest_for"
                          min="1"
                          max={additionalPayData.monthsElapsed}
                          step="1"
                          onFocus={selectAllText}
                          value={payment.interest_for}
                          onChange={handleValueChanges}
                        />
                      </div>
                    )}
                  </div>

                  <div className="col-sm-3">
                    <div className="form-group">
                      <label htmlFor="amount">Amount (LKR)</label>
                      <input
                        type="number"
                        className="form-control form-control-sm text-right font-weight-bold text-danger"
                        id="amount"
                        name="amount"
                        value={payment.amount}
                        onFocus={selectAllText}
                        onChange={handleValueChanges}
                        disabled={isCapitalPayment ? false : true}
                      />
                    </div>
                  </div>
                </div>

                <br />

                <div className="row justify-content-end">
                  <div className="col-sm-2">
                    <SystemButton
                      type={'reset'}
                      method={() => resetAll()}
                      showText={true}
                    />
                  </div>
                  <div className="col-sm-2">
                    <SystemButton
                      type={'no-form-save'}
                      method={handleSubmit}
                      showText={true}
                      disabled={customer.is_blacklisted ? true : false}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <br />
        </div>
      )}
    </div>
  );

  /* --- End of component renders --- */
};

export default PartPayments;
