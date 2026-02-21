import React, { useState, useEffect } from 'react';
import { FormModal, SystemButton } from '../../components';
import { api, cookie, msg } from '../../services';

const PaymentModel = ({
  toggleFormModal,
  showModalState,
  paymentData,
  updatePayments,
  callBack,
}) => {
  //Module name
  const moduleName = 'Payment';

  /* --- State declarationss --- */

  const [newData, setNewData] = useState({
    type: '',
    cash_amount: 0.0,
    card_amount: 0.0,
    old_gold_amount: 0.0,
    return_amount: 0.0,
    credit_amount: 0.0,
    debit_amount:0.0,
    crn_amount: 0.0,
    drn_amount:0.0,
    fc_amount: 0.0,
    creditNotes: [],
    debitNotes: [],
    bank_deposit: 0.0,
    bank_account_id: '',
    og_weight: 0,
    og_rate: '',
    gold_type: '',    
    currency_id: '',
    currency_rate: 0.0,
    currency_qty: 0,
    note: '',
  });

  const [showFields, setShowFields] = useState({
    showCardAmount: false,
    showBankDeposit: false,
    showOldGold: false,
    showReturnAMount: false,
    showCreditAmount: false,
    showDebitAmount: false,
    showCRNAmount: false,
    invoiceAmountCaption: 'Total Amount',

    showCreditNotes: false,
    showBankDepositDetails: false,
    showOldGoldDetails: false,
    showFCAmount: false,
    showCurrencyDetails: false,
    showNote: false,
    showDebitNotes: false,
  });

  const [bankAccounts, setBankAccounts] = useState([]);
  const [goldTypes, setGoldTypes] = useState([]);
  const [currencies, setCurrencies] = useState([]);

  useEffect(() => {
    if (showModalState === true) {
      setInitialData();
    }
  }, [showModalState]);

  const setInitialData = () => {
    let credit_amount = 0;
    console.log(paymentData.type);
    if (paymentData.type === 'Invoice') {
      setShowFields({
        showCardAmount: true,
        showBankDeposit: true,
        showOldGold: true,
        showReturnAMount: false,
        showCreditAmount: true,
        showFCAmount: true,
        showCRNAmount: false,
        showDebitNotes: false,
        showDebitAmount: false,
        invoiceAmountCaption: 'Invoice Amount',
      });

      credit_amount =
        parseFloat(paymentData.invoice_amount) -
        (parseFloat(paymentData.cash_amount) +
          parseFloat(paymentData.card_amount) +
          parseFloat(paymentData.old_gold_amount) +
          parseFloat(paymentData.return_amount));
    } else if (paymentData.type === 'Advance') {
      setShowFields({
        showCardAmount: true,
        showBankDeposit: true,
        showFCAmount: true,
        showOldGold: false,
        showReturnAMount: false,
        showCreditAmount: false,
        showCRNAmount: false,
        showDebitNotes: false,
        showDebitAmount: false,
        invoiceAmountCaption: 'Advance Amount',
      });
    } else if (paymentData.type === 'Receipt') {
      setShowFields({
        showCardAmount: true,
        showBankDeposit: true,
        showFCAmount: true,
        showOldGold: false,
        showReturnAMount: false,
        showCreditAmount: false,
        showCRNAmount: true,
        showDebitNotes: false,
        showDebitAmount: false,
        invoiceAmountCaption: 'Total Pay',
      });
    } else if (paymentData.type === 'Voucher') {
      setShowFields({

        showCardAmount: true,
        showBankDeposit: true,
        showOldGold: true,
        showReturnAMount: false,
        showCreditAmount: false,
        showFCAmount: true,
        showCRNAmount: false,
        showDebitNotes: false,
        // showDebitAmount: false,


        // showCardAmount: false,
        // showBankDeposit: false,
        // showFCAmount: false,
        // showOldGold: true,
        // showReturnAMount: false,
        // showCreditAmount: false,
        // showCRNAmount: false,
        showCreditNotes: false,
        // showFCAmount: false,
       
        showDebitAmount: true,
        invoiceAmountCaption: 'Total Pay',
      });
    }

    setNewData({
      ...newData,
      type: paymentData.type,
      invoice_amount: paymentData.invoice_amount,
      cash_amount: paymentData.cash_amount,
      card_amount: paymentData.card_amount,
      old_gold_amount: paymentData.old_gold_amount,
      bank_deposit: paymentData.bank_deposit,
      fc_amount: paymentData.fc_amount,
      return_amount: paymentData.return_amount,
      credit_amount: credit_amount.toFixed(2),
      crn_amount: paymentData.crn_amount,
      creditNotes: paymentData.creditNotes,
      drn_amount: paymentData.drn_amount,
      debitNotes: paymentData.debitNotes,
    });

    // calPayments();
  };

  useEffect(() => {
    updatePayments(
      newData.cash_amount,
      newData.card_amount,
      newData.old_gold_amount,
      newData.return_amount,
      newData.credit_amount,
      newData.crn_amount,
      newData.drn_amount,
      newData.bank_deposit,
      newData.bank_account_id,
      newData.note,
      newData.og_weight,
      newData.og_rate,
      newData.gold_type,
      newData.fc_amount,
      newData.currency_id,
      newData.currency_rate,
      newData.currency_qty,
    );
  }, [newData]);

  // useEffect(() => {
  //   setNewData({
  //     type: paymentData.type,
  //     invoice_amount: paymentData.invoice_amount,
  //     cash_amount: paymentData.cash_amount,
  //     card_amount: paymentData.card_amount,
  //     old_gold_amount: paymentData.old_gold_amount,
  //     return_amount: paymentData.return_amount,
  //     credit_amount: paymentData.credit_amount,
  //   });

  //   calPayments();
  // }, []);

  const resetForm = () => {
    setNewData({
      type: '',
      cash_amount: '',
      card_amount: '',
      old_gold_amount: '',
      return_amount: '',
      credit_amount: '',
    });
  };

  const getBankAccounts = async () => {
    const response = await api.get(`get-bank-accounts`);

    if (response.data.bank_accounts) {
      setBankAccounts(response.data.bank_accounts);
    }
  };

  const getGoldTypes = async () => {
    const response = await api.get(`get-gold-types`);

    if (response.data.gold_types) {
      setGoldTypes(response.data.gold_types);
    }
  };

  const getCurrencies = async () => {
    const response = await api.get(`get-currencies`);

    if (response.data.currencies) {
      setCurrencies(response.data.currencies);
    }
  };

  const handleValueChange = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue =
      targetInput.type === 'checkbox' ? targetInput.checked : targetInput.value;

    setNewData({
      ...newData,
      [inputName]: inputValue,
    });

    // showDebitNotes: true,

    if (e.target.name === 'crn_amount') {
      if (parseFloat(inputValue) > 0) {
        setShowFields({
          ...showFields,
          showCreditNotes: true,
        });
      } else {
        setShowFields({
          ...showFields,
          showCreditNotes: false,
        });
      }
    } else if(e.target.name === 'debit_amount'){
      if (parseFloat(inputValue) > 0) {
        setShowFields({
          ...showFields,
          showDebitNotes: true,
        });
      } else {
        setShowFields({
          ...showFields,
          showDebitNotes: false,
        });
      }
    }else if (e.target.name == 'bank_deposit' && parseFloat(inputValue) > 0) {
      getBankAccounts();
      setShowFields({
        ...showFields,
        showBankDepositDetails: true,
        showCreditNotes: false,
        showDebitAmount:false,
        showNote: true,
      });
    } else if (
      e.target.name == 'old_gold_amount' &&
      parseFloat(inputValue) > 0
    ) {
      getGoldTypes();
      setShowFields({
        ...showFields,
        showBankDepositDetails: false,
        showCreditNotes: false,
        showDebitAmount:false,
        showNote: true,
        showOldGoldDetails: true,
      });
    } else if (e.target.name == 'fc_amount' && parseFloat(inputValue) > 0) {
      getCurrencies();
      setShowFields({
        ...showFields,
        showBankDepositDetails: false,
        showCreditNotes: false,
        showDebitAmount:false,
        showNote: true,
        showOldGoldDetails: false,
        showCurrencyDetails: true,
      });
    } else if (e.target.name == 'debit_amount') {
      if (parseFloat(inputValue) > 0) {
        setShowFields({
          ...showFields,
          showDebitNotes: true,
        });
      } else {
        setShowFields({
          ...showFields,
          showDebitNotes: false,
        });
      }
    }else {
      setShowFields({
        ...showFields,
        showCreditNotes: false,
        showDebitAmount:false,
        showNote: true,
        showBankDepositDetails: false,
      });
    }
  };

  const onFocusAmount = (e) => {
    e.target.select();
    const inputValue = e.target.value;
    if (e.target.name === 'crn_amount') {
      if (parseFloat(newData.crn_amount) > 0) {
        setShowFields({
          ...showFields,
          showCreditNotes: true,
        });
      } else {
        setShowFields({
          ...showFields,
          showCreditNotes: false,
          showDebitAmount:false,
          showNote: true,
          showOldGoldDetails: false,
          showCurrencyDetails: false,
          showBankDepositDetails: false,
        });
      }
    } else if (e.target.name == 'bank_deposit' && parseFloat(inputValue) > 0) {
      getBankAccounts();
      setShowFields({
        ...showFields,
        showBankDepositDetails: true,
        showCreditNotes: false,
        showDebitAmount:false,
        showNote: true,
        showOldGoldDetails: false,
        showCurrencyDetails: false,
      });
    } else if (
      e.target.name == 'old_gold_amount' &&
      parseFloat(inputValue) > 0
    ) {
      getGoldTypes();
      setShowFields({
        ...showFields,
        showBankDepositDetails: false,
        showCreditNotes: false,
        showDebitAmount:false,
        showNote: true,
        showOldGoldDetails: true,
        showCurrencyDetails: false,
      });
    } else if (e.target.name == 'fc_amount' && parseFloat(inputValue) > 0) {
      getCurrencies();
      setShowFields({
        ...showFields,
        showBankDepositDetails: false,
        showCreditNotes: false,
        showDebitAmount:false,
        showNote: true,
        showOldGoldDetails: false,
        showCurrencyDetails: true,
      });
    } else {
      setShowFields({
        ...showFields,
        showCreditNotes: false,
        showDebitAmount:false,
        showNote: true,
        showBankDepositDetails: false,
        showOldGoldDetails: false,
        showCurrencyDetails: false,
      });
    }
    // } else {
    //   setShowFields({
    //     ...showFields,
    //     showCreditNotes: false,
    //     showNote: false,
    //   });
    // }
  };

  const calPayments = () => {
    if (newData.type === 'Invoice') {
      const credit_amount =
        parseFloat(paymentData.invoice_amount) -
        (parseFloat(newData.cash_amount) +
          parseFloat(newData.card_amount) +
          parseFloat(newData.bank_deposit) +
          parseFloat(newData.old_gold_amount) +
          parseFloat(newData.return_amount) +
          parseFloat(newData.crn_amount) +
          parseFloat(newData.fc_amount));
      setNewData({
        ...newData,
        credit_amount: credit_amount.toFixed(2),
      });
    } else if (newData.type === 'Advance') {
    }
  };

  const checkTotalPay = () => {
    const tot_pay =
      parseFloat(newData.cash_amount) +
      parseFloat(newData.card_amount) +
      parseFloat(newData.old_gold_amount) +
      parseFloat(newData.return_amount) +
      parseFloat(newData.credit_amount);
    if (parseFloat(paymentData.invoice_amount) < tot_pay) {
      msg.warning('Pay amounts total cannot be larger than Invoice amount.');
      return false;
    } else {
      return true;
    }
  };

  const onBlurPayAmount = () => {
    calPayments();

    // if (parseFloat(newData.credit_amount) < 0) {
    //   setNewData({
    //     ...newData,
    //     [inputName]: 0,
    //     credit_amount:
    //       parseFloat(newData.credit_amount) + parseFloat(inputValue),
    //   });
    // }
  };

  const updateCRNSettle = async (e) => {
    const targetInput = e.target;
    const datasetId = targetInput.dataset.id;
    const inputName = targetInput.name;
    const inputValue = targetInput.value;
    if (inputValue === '') return;

    let table = [...newData.creditNotes];
    if (parseFloat(table[datasetId]['balance']) >= parseFloat(inputValue)) {
      table[datasetId][inputName] = inputValue;
    } else {
      table[datasetId][inputName] = 0;
    }
    setNewData({
      ...newData,
      table,
    });
    calculateCRNTotal();
  };

  const updateDBNSettle = async (e) => {
    const targetInput = e.target;
    const datasetId = targetInput.dataset.id;
    const inputName = targetInput.name;
    const inputValue = targetInput.value;
    if (inputValue === '') return;

    let table = [...newData.debitNotes];
    if (parseFloat(table[datasetId]['balance']) >= parseFloat(inputValue)) {
      table[datasetId][inputName] = inputValue;
    } else {
      table[datasetId][inputName] = 0;
    }
    setNewData({
      ...newData,
      table,
    });
    calculateDBNTotal();
  };

  const calculateDBNTotal = () => {
    let total = 0;
    newData.debitNotes.forEach((item) => {
      total += parseFloat(item.settle);
    });

    setNewData({
      ...newData,
      drn_amount: total.toFixed(2),
    });
  };

  const calculateCRNTotal = () => {
    let total = 0;
    newData.creditNotes.forEach((item) => {
      total += parseFloat(item.settle);
    });

    setNewData({
      ...newData,
      crn_amount: total.toFixed(2),
    });
  };

  const closeModel = () => {
    toggleFormModal();
    callBack();
  };

  return (
    <div>
      <FormModal
        moduleName={moduleName}
        modalState={showModalState}
        toggleFormModal={toggleFormModal}
        width="70%"
      >
        <div className="container row mt-2">
          <div className="col-sm-6 border-2 border-right">
            <div className="row">
              <label
                htmlFor="invoice_amount"
                className="col-sm-6 col-form-label "
              >
                {showFields.invoiceAmountCaption}
              </label>
              <div className="col-sm-6">
                <input
                  type="number"
                  name="invoice_amount"
                  id="invoice_amount"
                  className="form-control form-control-sm text-right"
                  placeholder="0.00"
                  readOnly
                  value={paymentData.invoice_amount}
                />
              </div>
            </div>
            <div className="row">
              <label htmlFor="cash_amount" className="col-sm-6 col-form-label ">
                Cash
              </label>
              <div className="col-sm-6">
                <input
                  type="number"
                  name="cash_amount"
                  id="cash_amount"
                  className="form-control form-control-sm text-right"
                  placeholder="0.00"
                  value={newData.cash_amount}
                  onChange={handleValueChange}
                  onBlur={onBlurPayAmount}
                  onFocus={(e) => e.target.select()}
                />
              </div>
            </div>

            {showFields.showCardAmount ? (
              <div className="row">
                <label
                  htmlFor="card_amount"
                  className="col-sm-6 col-form-label "
                >
                  Merchant Card
                </label>
                <div className="col-sm-6">
                  <input
                    type="number"
                    name="card_amount"
                    id="card_amount"
                    className="form-control form-control-sm text-right"
                    placeholder="0.00"
                    value={newData.card_amount}
                    onChange={handleValueChange}
                    onBlur={onBlurPayAmount}
                    onFocus={(e) => e.target.select()}
                  />
                </div>
              </div>
            ) : null}

            {showFields.showBankDeposit ? (
              <div className="row">
                <label
                  htmlFor="bank_deposit"
                  className="col-sm-6 col-form-label "
                >
                  Bank Deposit
                </label>
                <div className="col-sm-6">
                  <input
                    type="number"
                    name="bank_deposit"
                    id="bank_deposit"
                    className="form-control form-control-sm text-right"
                    placeholder="0.00"
                    value={newData.bank_deposit}
                    onChange={handleValueChange}
                    onBlur={onBlurPayAmount}
                    onFocus={onFocusAmount}
                    // onFocus={(e) => e.target.select()}
                  />
                </div>
              </div>
            ) : null}

            {showFields.showOldGold ? (
              <div className="row">
                <label
                  htmlFor="old_gold_amount"
                  className="col-sm-6 col-form-label "
                >
                  Old Gold Value
                </label>
                <div className="col-sm-6">
                  <input
                    type="number"
                    name="old_gold_amount"
                    id="old_gold_amount"
                    className="form-control form-control-sm text-right"
                    placeholder="0.00"
                    value={newData.old_gold_amount}
                    onChange={handleValueChange}
                    onBlur={onBlurPayAmount}
                    onFocus={onFocusAmount}
                    // onFocus={(e) => e.target.select()}
                  />
                </div>
              </div>
            ) : null}

            {showFields.showFCAmount ? (
              <div className="row">
                <label htmlFor="fc_amount" className="col-sm-6 col-form-label ">
                  Foreign Currency Amount (LKR)
                </label>
                <div className="col-sm-6">
                  <input
                    type="number"
                    name="fc_amount"
                    id="fc_amount"
                    className="form-control form-control-sm text-right"
                    placeholder="0.00"
                    value={newData.fc_amount}
                    onChange={handleValueChange}
                    onBlur={onBlurPayAmount}
                    onFocus={onFocusAmount}
                    // onFocus={(e) => e.target.select()}
                  />
                </div>
              </div>
            ) : null}

            {showFields.showReturnAMount ? (
              <div className="row">
                <label
                  htmlFor="return_amount"
                  className="col-sm-6 col-form-label "
                >
                  Return Amount
                </label>
                <div className="col-sm-6">
                  <input
                    type="number"
                    name="return_amount"
                    id="return_amount"
                    className="form-control form-control-sm text-right"
                    placeholder="0.00"
                    value={newData.return_amount}
                    onChange={handleValueChange}
                    onBlur={onBlurPayAmount}
                    onFocus={(e) => e.target.select()}
                  />
                </div>
              </div>
            ) : null}

            {showFields.showCRNAmount ? (
              <div className="row">
                <label
                  htmlFor="crn_amount"
                  className="col-sm-6 col-form-label "
                >
                  Credit Note Settle
                </label>
                <div className="col-sm-6">
                  <input
                    type="number"
                    name="crn_amount"
                    id="crn_amount"
                    className="form-control form-control-sm text-right"
                    placeholder="0.00"
                    value={newData.crn_amount}
                    onChange={handleValueChange}
                    onBlur={onBlurPayAmount}
                    onFocus={onFocusAmount}
                  />
                </div>
              </div>
            ) : null}

            {showFields.showDebitAmount ? (
              <div className="row">
                <label
                  htmlFor="debit_amount"
                  className="col-sm-6 col-form-label "
                >
                  Debit Amount
                </label>
                <div className="col-sm-6">
                  <input
                    type="number"
                    name="debit_amount"
                    id="debit_amount"
                    className="form-control form-control-sm text-right"
                    placeholder="0.00"
                    value={newData.debit_amount}
                    onChange={handleValueChange}
                    onBlur={onBlurPayAmount}
                    onFocus={(e) => e.target.select()}
                  />
                </div>
              </div>
            ) : null}

            {showFields.showCreditAmount ? (
              <div className="row">
                <label
                  htmlFor="credit_amount"
                  className="col-sm-6 col-form-label "
                >
                  Credit Amount
                </label>
                <div className="col-sm-6">
                  <input
                    type="number"
                    name="credit_amount"
                    id="credit_amount"
                    className="form-control form-control-sm text-right"
                    placeholder="0.00"
                    value={newData.credit_amount}
                    onChange={handleValueChange}
                    onBlur={onBlurPayAmount}
                    onFocus={(e) => e.target.select()}
                  />
                </div>
              </div>
            ) : null}
          </div>
          {showFields.showDebitNotes ? (<div className="col-sm-6">
            <div className="row">
              {showFields.showDebitNotes ? <h4>Debit Notes</h4> : null}
            </div>
            <div className="row">
              {showFields.showDebitNotes ? (
                <div className="table-responsive header-fixed-scrollable">
                  <table className="table table-bordered table-sm table-hover">
                    <thead className="thead-dark text-center">
                      <tr>
                        <td width="10%">#</td>
                        <td width="30%">CRN No</td>
                        <td width="30%">Balance</td>
                        <td width="30%">Settle</td>
                      </tr>
                    </thead>
                    <tbody>
                      {newData.debitNotes
                        ? newData.debitNotes.map((item, index) => {
                            return (
                              <tr key={index}>
                                <th scope="row">{parseInt(index) + 1}</th>
                                <td>
                                  <input
                                    type="text"
                                    name="credit_note_id"
                                    data-id={index}
                                    className="form-control-plaintext form-control-sm rounded-0"
                                    value={item.credit_note_id}
                                    readOnly
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    name="balance"
                                    data-id={index}
                                    className="form-control-plaintext form-control-sm rounded-0 text-right"
                                    value={item.balance}
                                    readOnly
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    name="settle"
                                    step="any"
                                    data-id={index}
                                    className="form-control-plaintext form-control-sm rounded-0 text-right"
                                    value={item.settle}
                                    onFocus={(e) => e.target.select()}
                                    onChange={updateDBNSettle}
                                  />
                                </td>
                              </tr>
                            );
                          })
                        : null}
                    </tbody>
                    <tfoot className="tfoot-dark">
                      <tr>
                        <th className="text-center" colSpan="3">
                          Total Settlement
                        </th>

                        <td>
                          <input
                            type="text"
                            className="form-control-plaintext text-right kinda-important-text-3"
                            id="drn_amount"
                            name="drn_amount"
                            value={newData.drn_amount}
                            readOnly
                          />
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : null}
            </div>
          </div>) : null }
          <div className="col-sm-6">
            <div className="row">
              {showFields.showCreditNotes ? <h4>Credit Notes</h4> : null}
            </div>
            <div className="row">
              {showFields.showCreditNotes ? (
                <div className="table-responsive header-fixed-scrollable">
                  <table className="table table-bordered table-sm table-hover">
                    <thead className="thead-dark text-center">
                      <tr>
                        <td width="10%">#</td>
                        <td width="30%">CRN No</td>
                        <td width="30%">Balance</td>
                        <td width="30%">Settle</td>
                      </tr>
                    </thead>
                    <tbody>
                      {newData.creditNotes
                        ? newData.creditNotes.map((item, index) => {
                            return (
                              <tr key={index}>
                                <th scope="row">{parseInt(index) + 1}</th>
                                <td>
                                  <input
                                    type="text"
                                    name="credit_note_id"
                                    data-id={index}
                                    className="form-control-plaintext form-control-sm rounded-0"
                                    value={item.credit_note_id}
                                    readOnly
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    name="balance"
                                    data-id={index}
                                    className="form-control-plaintext form-control-sm rounded-0 text-right"
                                    value={item.balance}
                                    readOnly
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    name="settle"
                                    step="any"
                                    data-id={index}
                                    className="form-control-plaintext form-control-sm rounded-0 text-right"
                                    value={item.settle}
                                    onFocus={(e) => e.target.select()}
                                    onChange={updateCRNSettle}
                                  />
                                </td>
                              </tr>
                            );
                          })
                        : null}
                    </tbody>
                    <tfoot className="tfoot-dark">
                      <tr>
                        <th className="text-center" colSpan="3">
                          Total Settlement
                        </th>

                        <td>
                          <input
                            type="text"
                            className="form-control-plaintext text-right kinda-important-text-3"
                            id="crn_amount"
                            name="crn_amount"
                            value={newData.crn_amount}
                            readOnly
                          />
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : null}
            </div>

            {showFields.showBankDepositDetails ? (
              <div className="row">
                <label
                  htmlFor="bank_account_id"
                  className="col-sm-3 col-form-label "
                >
                  Bank Account
                </label>
                <div className="col-sm-8">
                  <select
                    id="bank_account_id"
                    name="bank_account_id"
                    className="form-control form-control-sm"
                    required
                    onChange={handleValueChange}
                    value={newData.bank_account_id}
                  >
                    <option value="">---</option>
                    {bankAccounts.map((obj) => {
                      return (
                        <option key={obj.code} value={obj.code}>
                          {obj.description}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            ) : null}

            {showFields.showOldGoldDetails ? (
              <div>
                <div className="row">
                  <label
                    htmlFor="gold_type"
                    className="col-sm-3 col-form-label "
                  >
                    Gold Type
                  </label>
                  <div className="col-sm-4">
                    <select
                      id="gold_type"
                      name="gold_type"
                      className="form-control form-control-sm"
                      required
                      onChange={handleValueChange}
                      value={newData.gold_type}
                    >
                      <option value="">---</option>
                      {goldTypes.map((obj) => {
                        return (
                          <option key={obj.printval} value={obj.printval}>
                            {obj.printval}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <label
                    htmlFor="og_weight"
                    className="col-sm-2 col-form-label text-right px-0"
                  >
                    Weight (g)
                  </label>
                  <div className="col-sm-3">
                    <input
                      type="number"
                      name="og_weight"
                      id="og_weight"
                      className="form-control form-control-sm text-right"
                      value={newData.og_weight}
                      onChange={handleValueChange}
                    />
                  </div>
                </div>
                <div className="row">
                  <label htmlFor="og_rate" className="col-sm-3 col-form-label ">
                    Gold Rate (LKR)
                  </label>
                  <div className="col-sm-4">
                    <input
                      type="number"
                      name="og_rate"
                      id="og_rate"
                      className="form-control form-control-sm text-right"
                      value={newData.og_rate}
                      onChange={handleValueChange}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {showFields.showCurrencyDetails ? (
              <div>
                <div className="row">
                  <label
                    htmlFor="currency_id"
                    className="col-sm-3 col-form-label "
                  >
                    Currency
                  </label>
                  <div className="col-sm-9">
                    <select
                      id="currency_id"
                      name="currency_id"
                      className="form-control form-control-sm"
                      required
                      onChange={handleValueChange}
                      value={newData.currency_id}
                    >
                      <option value="">---</option>
                      {currencies.map((obj) => {
                        return (
                          <option key={obj.id} value={obj.id}>
                            {obj.des}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
                <div className="row">
                  <label
                    htmlFor="currency_rate"
                    className="col-sm-3 col-form-label "
                  >
                    Currency Rate (LKR)
                  </label>
                  <div className="col-sm-3">
                    <input
                      type="number"
                      name="currency_rate"
                      id="currency_rate"
                      className="form-control form-control-sm text-right"
                      value={newData.currency_rate}
                      onChange={handleValueChange}
                    />
                  </div>
                  <label
                    htmlFor="currency_qty"
                    className="col-sm-3 col-form-label text-right "
                  >
                    Qunatity
                  </label>
                  <div className="col-sm-3">
                    <input
                      type="number"
                      name="currency_qty"
                      id="currency_qty"
                      className="form-control form-control-sm text-right"
                      value={newData.currency_qty}
                      onChange={handleValueChange}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {showFields.showNote ? (
              <div className="row">
                <label htmlFor="note" className="col-sm-3 col-form-label ">
                  Note
                </label>
                <div className="col-sm-9">
                  <input
                    type="text"
                    name="note"
                    id="note"
                    className="form-control form-control-sm"
                    value={newData.note}
                    onChange={handleValueChange}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
        <div className="modal-footer">
          <div className="col-sm-2 offset-10">
            <SystemButton
              btnText="Save"
              type="no-form-save"
              method={closeModel}
              showText={true}
            />
          </div>
        </div>
      </FormModal>
    </div>
  );
};

export default PaymentModel;
