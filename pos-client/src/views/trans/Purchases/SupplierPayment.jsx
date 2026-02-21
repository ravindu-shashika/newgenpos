import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import {
  Loader,
  SDD,
  SystemButton,
  UnderDevelopment,
  ListSelection,
} from '../../../components';
import { api, cookie, msg } from '../../../services';
import PaymentModel from '../PaymentModel';
import SupplierPaymentA4Half from '../../../printouts/SupplierPaymentA4Half';

const SupplierPayment = () => {
  // Module name
  const moduleName = 'Supplier Payment';

  /* --- State declarationss --- */

  const [isLoading, setIsLoading] = useState({
    init: false,
  });

  const [isEdit, setIsEdit] = useState(false);

  const [newData, setNewData] = useState({
    user_id: cookie.get('user_id'),
    bc_no: cookie.get('user_branch'),
    newDate: '',
    newId: '',

    ddate: '',
    id: '',
    vendor_id: '',
    vendor: {
      code: '',
      name: '',
      nic: '',
      description: '',
      account_id:'',
    },

    memo: '',
    total_outstanding: 0,
    total_settlement: 0,
    cash_pay: 0,
    card_pay: 0,
    old_gold_pay: 0,
    crn_amount: 0,
    total_pay: 0,
  });
 
  const [paymentData, setPaymentData] = useState({
    type: 'Voucher',
    invoice_amount: 0.0,
    cash_amount: 0.0,
    card_amount: 0.0,
    old_gold_amount: 0.0,
    return_amount: 0.0,
    credit_amount: 0.0,
    crn_amount: 0.0,
    drn_amount: 0.0,
    bank_deposit: 0.0,
    bank_account_id: '',
    note: '',
    og_weight: '',
    og_rate: '',
    gold_type: '',
    fc_amount: 0.0,
    currency_id: '',
    currency_rate: '',
    currency_qty: '',
    note: '',
    debitNotes:[],
    account_id:'',
  });

  const [outstandings, setOutstandings] = useState([]);

  const [vendors, setVendors] = useState([]);

  const [employees, setEmployees] = useState([]);

  const [viewPaymentForm, setViewPaymentForm] = useState(false);

  /* --- End of state declarations --- */

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    calculatePaytotal();
  }, [paymentData]);

  /* --- Component functions --- */

  /* --- List Selection Required ---- */
  const [listType, setListType] = useState([]);
  const [viewListSelection, setViewListSelection] = useState(false);

  const showListSelection = () => {
    setViewListSelection(!viewListSelection);
  };

  const selectRow = (dataObj) => {
    if (listType === 'vendor') {
      setNewData({
        ...newData,
        vendor_id: dataObj.code,
        vendor: dataObj,
      });
      getSupplierOutstanding(dataObj.code);
    } /* else if (listType === 'officer') {
      setNewData({
        ...newData,
        officer_id: dataObj.id,
        officer_name: dataObj.name,
      });
    } else if (listType === 'stores') {
      setNewData({
        ...newData,
        store_id: dataObj.code,
        store_name: dataObj.description,
      });
    } */
  };

  const setColulmns = () => {
    if (listType === 'vendor') {
      return vendorColumns;
    } else {
      return null;
    } /*  else if (listType === 'officer') {
      return officerColumns;
    } else if (listType === 'stores') {
      return storeColumns;
    }  */
  };

  const vendorColumns = [
    { title: 'Code', name: 'code', searchable: true },
    { title: 'Name', name: 'name', searchable: true },
  ];
  /*   const officerColumns = [
    { title: 'Code', name: 'id', searchable: true },
    { title: 'Name', name: 'name', searchable: true },
  ];
  const storeColumns = [
    { title: 'Code', name: 'code', searchable: true },
    { title: 'Description', name: 'description', searchable: true },
  ]; */

  const setListData = () => {
    if (listType === 'vendor') {
      return vendors;
    } else {
      return null;
    }
    /* else if (listType === 'officer') {
      return employees;
    } else if (listType === 'stores') {
      return stores; 
    }*/
  };

  /* ---  End of List Selection Required ---- */

  const fetchData = async () => {
    try {
      setIsLoading({
        ...isLoading,
        init: true,
      });

      const response = await api.get(`supplier-payments`);

      setEmployees(response.data.employees);
      setNewData({
        ...newData,
        ddate: response.data.ddate,
        newDate: response.data.ddate,
        id: response.data.new_id,
        newId: response.data.new_id,

        vendor_id: '',
        vendor: {
          code: '',
          name: '',
          nic: '',
          description: '',
        },

        memo: '',
        total_outstanding: 0,
        total_settlement: 0,
        cash_pay: 0,
        card_pay: 0,
        old_gold_pay: 0,
        crn_amount: 0,
        total_pay: 0,
      });

      setVendors(response.data.vendors);
      setOutstandings([]);

      setIsLoading({
        ...isLoading,
        init: false,
      });
    } catch (error) {
      return msg.error('Unable to fetch data!');
    }
  };

  // const updatePayments = (
  //   cash_amount,
  //   card_amount,
  //   old_gold_amount,
  //   return_amount,
  //   credit_amount,
  // ) => {
  //   setPaymentData({
  //     ...paymentData,
  //     cash_amount: cash_amount,
  //     card_amount: card_amount,
  //     old_gold_amount: old_gold_amount,
  //     return_amount: return_amount,
  //     credit_amount: credit_amount,
  //   });
  // };

  const updatePayments = (
    cash_amount,
    card_amount,
    old_gold_amount,
    return_amount,
    credit_amount,
    crn_amount,
    drn_amount,
    bank_deposit,
    bank_account_id,
    note,
    og_weight,
    og_rate,
    gold_type,
    fc_amount,
    currency_id,
    currency_rate,
    currency_qty,
  ) => {
    setPaymentData({
      ...paymentData,
      cash_amount: cash_amount,
      card_amount: card_amount,
      old_gold_amount: old_gold_amount,
      return_amount: return_amount,
      credit_amount: credit_amount,
      crn_amount: crn_amount,
      drn_amount: drn_amount,
      bank_deposit: bank_deposit,
      bank_account_id: bank_account_id,
      note: note,
      og_weight: og_weight,
      og_rate: og_rate,
      gold_type: gold_type,
      fc_amount: fc_amount,
      currency_id: currency_id,
      currency_rate: currency_rate,
      currency_qty: currency_qty,
    });
  };

  const supplierSelect = (selectedObj) => {
    setNewData({
      ...newData,
      vendor_id: selectedObj.code,
      vendor: selectedObj,
    });

    getSupplierOutstanding(selectedObj.code);
    getSupplierDebitNotes(selectedObj.code);
  };

  const getSupplierOutstanding = async (vendorId, acc) => {
    try {
      const response = await api.get(`get-supplier-outstandings/${vendorId}`);

      console.log(response.data);

      if (response.data.balance_invoices) {
        paymentData.account_id = response.data.account_id;
        setOutstandings(response.data.balance_invoices);
        getSupplierDebitNotes(response.data.account_id);
      }
    } catch (error) {
      return msg.error('Unable to get outstanding balances.');
    }
  };

  const getSupplierDebitNotes = async (vendorId) => {
    try {
      const response = await api
        .post(`get-debit-notes-balances`)
        .values({ account_id: vendorId, bc_no: cookie.get('user_branch') });

      if (response.data) {
        setPaymentData({
          ...paymentData,
          debitNotes: response.data,
        });
      }
    } catch (error) {
      return msg.error('Unable to get sales orders.');
    }
  };

  const validateControlValues = (input, value) => {
    /**
     * This function can be used to validate any input value when the onChange (or onKeyPress, or onKeyDown, or whatever tf you like...) event fires
     * Pass the form element's name as the 1st parameter, @param {string} input
     * And the value needs to be validated as the 2nd, @param {any} value
     * Use the promise to do any required validation and resolve with true
     * Don't use reject fot the timebeing coz it's not handled here
     */

    return new Promise((resolve, reject) => {
      switch (input) {
        default:
          resolve(true);
          break;
      }
    });
  };

  const handleValueChanges = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue = targetInput.value;

    setNewData({
      ...newData,
      [inputName]: inputValue,
    });

    // if (inputName === 'amount') {
    //   setPaymentData({
    //     ...paymentData,
    //     invoice_amount: inputValue,
    //   });
    // }
  };

  const saveFromPaymentModel = () => {
    handleSubmit();
  };

  const handleSubmit = async () => {
    if (checkBeforeSave() === false) return;
    await save();
  };

  const save = async () => {
    try {
      const response = await api
        .post('supplier-payments')
        .values({ formdata: newData, payment: paymentData, outstandings });

      // console.log('Invoice No.:' + response.data);

      if (parseInt(response.data) > 0) {
        printReceipt(response.data, false);

        fetchData();
      }
    } catch (err) {
      msg.error(err);
      return;
    }
  };

  const checkBeforeSave = () => {
    if (newData.vendor_id === '' || newData.vendor.name === '') {
      msg.warning('Select Supplier before save the payment.');
      return false;
    }

    if (parseFloat(newData.total_settlement) <= 0) {
      msg.warning('Enter valid settle amounts.');
      return false;
    }

    if (parseFloat(newData.total_pay) <= 0) {
      msg.warning('Add payments by click on [ Payment ] button before save.');
      return false;
    }

    if (parseFloat(newData.total_pay) != parseFloat(newData.total_settlement)) {
      msg.warning(
        'Total pay amount must be equals to total settlement. Check the payments and settle amounts before save.',
      );
      return false;
    }

    return true;
  };

  const clearPayments = () => {
    setPaymentData({
      type: 'Voucher',
      invoice_amount: 0.0,
      cash_amount: 0.0,
      card_amount: 0.0,
      old_gold_amount: 0.0,
      return_amount: 0.0,
      credit_amount: 0.0,
      crn_amount: 0.0,
      bank_deposit: 0.0,
      bank_account_id: '',
      note: '',
      og_weight: '',
      og_rate: '',
      gold_type: '',
      fc_amount: 0.0,
      currency_id: '',
      currency_rate: '',
      currency_qty: '',
      note: '',
    });
  };

  const resetAll = async () => {
    setIsLoading({
      init: false,
    });

    setIsEdit(false);

    setNewData({
      user_id: cookie.get('user_id'),
      bc_no: cookie.get('user_branch'),

      ddate: newData.newDate,
      id: newData.newId,
      sales_order_id: '',
      customer_id: '',
      memo: '',
      total_outstanding: 0,
      total_settlement: 0,
      cash_pay: 0,
      card_pay: 0,
      old_gold_pay: 0,
      crn_amount: 0,
      total_pay: 0,
    });

    setEmployees([]);

    clearPayments();

    return true;
  };

  const showPaymentForm = () => {
    setViewPaymentForm(!viewPaymentForm);
  };

  const printReceipt = (invoice_no, is_dupplicate) => {
    SupplierPaymentA4Half.load(
      invoice_no,
      cookie.get('user_branch'),
      is_dupplicate,
    );
  };

  const handleItemsChange = async (e) => {
    const targetInput = e.target;
    const datasetId = targetInput.dataset.id;
    const inputName = targetInput.name;
    const inputValue = targetInput.value;
    const setOfItems = [...outstandings];

    const validated = await validateControlValues(inputName, inputValue);

    if (validated) {
      setOfItems[datasetId][inputName] = inputValue;

      setOutstandings(setOfItems);
    }
  };

  const updateInvoicePay = async (e) => {
    const targetInput = e.target;
    const datasetId = targetInput.dataset.id;
    const inputName = targetInput.name;
    const inputValue = targetInput.value;
    if (inputValue === '') return;

    let table = [...outstandings];
    if (parseFloat(table[datasetId]['balance']) >= parseFloat(inputValue)) {
      table[datasetId][inputName] = inputValue;
    } else {
      table[datasetId][inputName] = 0;
    }
    setOutstandings(table);
    calculateTotalSettle();
  };

  const calculateTotalSettle = () => {
    let total = 0;
    outstandings.forEach((item) => {
      total += parseFloat(item.settle);
    });

    setNewData({
      ...newData,
      total_settlement: total.toFixed(2),
    });

    setPaymentData({
      ...paymentData,
      invoice_amount: total.toFixed(2),
    });
  };

  const calculatePaytotal = () => {
    let pay_total = 0;
    for (const [key, value] of Object.entries(paymentData)) {
         //console.log(`${key}: ${value}`);
      if (
        key !== 'Voucher' &&
        key !== 'invoice_amount' &&
        key !== 'type' &&
        key !== 'creditNotes' &&
        key !== 'debitNotes' &&
        key !== 'bank_account_id' &&
        key !== 'og_weight' &&
        key !== 'og_rate' &&
        key !== 'gold_type' &&
        key !== 'currency_id' &&
        key !== 'currency_rate' &&
        key !== 'currency_qty' &&
        key !== 'note' &&
        key !== 'account_id' &&
        value !== ''
      ) {
        console.log(value);
        pay_total += parseFloat(value);
      }
    }
    setNewData({
      ...newData,
      total_pay: pay_total.toFixed(2),
    });
  };

  /* --- End of component functions --- */

  /* --- Component renders --- */

  // return process.env.NODE_ENV === 'production' ? (
  //   <UnderDevelopment />
  // ) : (
  //   <div></div>
  // );
  return (
    <div>
      <ListSelection
        toggleFormModal={showListSelection}
        showModalState={viewListSelection}
        entities={setListData}
        dataColumns={setColulmns}
        selectRow={selectRow}
      />
      <PaymentModel
        toggleFormModal={showPaymentForm}
        showModalState={viewPaymentForm}
        paymentData={paymentData}
        updatePayments={updatePayments}
        callBack={saveFromPaymentModel}
      />
      <h5 className="text-center">{moduleName}</h5>
      <br />
      {isLoading.init ? (
        <Loader />
      ) : (
        <div>
          <div className="row mb-3">
            <div className="col-sm-7 px-0">
              <div className="form-group row mb-0">
                <label
                  htmlFor="supplier"
                  className="col-sm-2 col-form-label mx-0"
                >
                  Supplier
                </label>
                <div className="col-sm-2 mx-0 pr-0">
                  <input
                    type="text"
                    id="vendor_id"
                    name="vendor_id"
                    className="form-control form-control-sm bg-white"
                    readOnly
                    value={newData.vendor_id}
                    onChange={handleValueChanges}
                    placeholder="Press <F2>"
                    onKeyDown={(event) => {
                      if (event.key === 'F2') {
                        setListType('vendor');
                        showListSelection();
                      }
                    }}
                  />
                </div>
                <div className="col-sm-8 mx-0 pl-0">
                  <SDD
                    method={supplierSelect}
                    data={vendors}
                    value="description"
                    rowId="code"
                    classes="form-control form-control-sm"
                    placeholder="Type hear for search"
                    listId="vendors"
                    selected={newData.vendor.name}
                  />
                </div>

                {/* <label htmlFor="nicno" className="col-sm-3 col-form-label pr-0">
                  Supplier
                </label>
                <div className="col-sm-2 pr-0">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    id="vendor_id"
                    name="vendor_id"
                    value={newData.vendor.code}
                    onChange={handleValueChanges}
                    placeholder="Code"
                  />
                </div>

                <div className="col-sm-7">
                  <SDD
                    method={supplierSelect}
                    data={vendors}
                    value="name"
                    rowId="code"
                    classes="form-control form-control-sm"
                    placeholder="Supplier Name"
                    listId="vendors"
                    selected={newData.vendor.name}
                  />
                </div> */}
              </div>

              <div className="form-group row">
                <label htmlFor="notes" className="col-sm-2 col-form-label mx-0">
                  Memo
                </label>
                <div className="col-sm-10 mx-0 ">
                  <textarea
                    name="memo"
                    id="memo"
                    rows="1"
                    maxLength="100"
                    className="form-control form-control-sm"
                    value={newData.memo}
                    onChange={handleValueChanges}
                  ></textarea>
                </div>
              </div>

              <hr />

              {/*  <div className="row form-group mb-0">
                <label htmlFor="amount" className="col-sm-2 col-form-label">
                  Total Outstanding
                </label>
                <div className="col-sm-3">
                  <input
                    name="total_outstanding"
                    id="total_outstanding"
                    className="form-control form-control-sm  text-right"
                    value={newData.total_outstanding}
                    readOnly
                  />
                </div>
              </div> */}

              <div className="row form-group">
                <label htmlFor="amount" className="col-sm-2 col-form-label ">
                  Pay Total
                </label>
                <div className="col-sm-3">
                  <input
                    name="total_pay"
                    id="total_pay"
                    className="form-control form-control-sm  text-right"
                    value={newData.total_pay}
                    readOnly
                  />
                </div>
              </div>
            </div>

            <div className="col-sm-5 ">
              <div className="row">
                <div className="offset-3 col-sm-9">
                  <div className="row ">
                    <label
                      htmlFor="ddate"
                      className="col-sm-4 col-form-label px-0"
                    >
                      Date
                    </label>
                    <div className="col-sm-8">
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        id="ddate"
                        name="ddate"
                        value={newData.ddate}
                        onChange={handleValueChanges}
                      />
                    </div>
                  </div>

                  <div className="row">
                    <label
                      htmlFor="po_no"
                      className="col-sm-4 col-form-label px-0"
                    >
                      No.
                    </label>
                    <div className="col-sm-8">
                      <input
                        type="text"
                        className="form-control form-control-sm text-right"
                        id="id"
                        name="id"
                        value={newData.id}
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>
              <hr />
              <div className="row">
                <div className="col-sm-12">
                  <div className="table-responsive header-fixed-scrollable">
                    <table className="table table-bordered table-sm table-hover">
                      <thead className="thead-dark text-center">
                        <tr>
                          <td width="10%">#</td>
                          <td width="20%">Invoice No.</td>
                          <td width="20%">Amount</td>
                          <td width="20%">Balance</td>
                          <td width="30%">Settle</td>
                        </tr>
                      </thead>
                      <tbody>
                        {outstandings
                          ? outstandings.map((item, index) => {
                              return (
                                <tr key={index}>
                                  <th scope="row">{parseInt(index) + 1}</th>
                                  <td>
                                    <input
                                      type="text"
                                      name="trans_no"
                                      id="trans_no"
                                      data-id={index}
                                      className="form-control-plaintext form-control-sm "
                                      value={item.trans_no}
                                      readOnly
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="text"
                                      name="sum_cr"
                                      id="sum_cr"
                                      data-id={index}
                                      className="form-control-plaintext form-control-sm  text-right"
                                      value={item.sum_cr}
                                      readOnly
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="text"
                                      name="balance"
                                      id="balance"
                                      data-id={index}
                                      className="form-control-plaintext form-control-sm  text-right"
                                      value={item.balance}
                                      readOnly
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      name="settle"
                                      id="settle"
                                      step="any"
                                      data-id={index}
                                      className="form-control-plaintext form-control-sm  text-right"
                                      value={item.settle}
                                      onFocus={(e) => e.target.select()}
                                      onChange={updateInvoicePay}
                                    />
                                  </td>
                                </tr>
                              );
                            })
                          : null}
                      </tbody>
                      <tfoot className="tfoot-dark">
                        <tr>
                          <th className="text-center" colSpan="4">
                            Totals Settlement
                          </th>

                          <td>
                            <input
                              type="text"
                              className="form-control-plaintext text-right kinda-important-text-3"
                              id="total_settlement"
                              name="total_settlement"
                              value={newData.total_settlement}
                              readOnly
                            />
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <hr />
          <div className="row">
            <div className="col-sm-2">
              <SystemButton
                type="no-form-save"
                showText
                btnText="Save"
                method={handleSubmit}
              />
            </div>
            {/* <div className="col-sm-2">
                <SystemButton type="cancel" showText method={handleSubmit} />
                </div>*/}
            <div className="col-sm-2">
              <SystemButton
                type="print"
                showText
                method={() => {
                  const invoiceNo = prompt('Please enter Invoice No.');
                  if (invoiceNo !== null && invoiceNo !== '') {
                    printReceipt(invoiceNo, true);
                  }
                }}
              />
            </div>
            <div className="col-sm-2">
              <SystemButton type="reset" showText method={resetAll} />
            </div>
            <div className="col-sm-2">
              <SystemButton type="payment" showText method={showPaymentForm} />
            </div>
          </div>
          <hr />
        </div>
      )}
    </div>
  );

  /* --- End of component renders --- */
};

export default SupplierPayment;
