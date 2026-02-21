import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import {
  Loader,
  SDD,
  SystemButton,
  CustomerListSelection,
} from '../../../components';
import { api, cookie, msg } from '../../../services';
import CustomerForm from '../../master/customers/CustomerForm';
import PaymentModel from '../PaymentModel';
import CustomerPaymentA4Half from '../../../printouts/CustomerPaymentA4Half';

const CustomerPayment = () => {
  // Module name
  const moduleName = 'Customer Payment';

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
    customer_id: '',
    nicno: '',
    cusname: '',
    address: '',
    mobile: '',

    memo: '',
    total_outstanding: 0,
    total_settlement: 0,
    // cash_pay: 0,
    // card_pay: 0,
    // old_gold_pay: 0,
    // crn_amount: 0,
    total_pay: 0,
  });

  const [paymentData, setPaymentData] = useState({
    type: 'Receipt',
    invoice_amount: 0,
    cash_amount: 0,
    card_amount: 0,
    old_gold_amount: 0,
    return_amount: 0,
    credit_amount: 0,
    crn_amount: 0,
    creditNotes: [],
  });

  const [outstandings, setOutstandings] = useState([]);
  const [creditNotes, setCreditNotes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [viewPaymentForm, setViewPaymentForm] = useState(false);

  /* --- End of state declarations --- */
  /* --- Customer List Selection Required ---- */
  const [viewCustomerListSelection, setViewCustomerListSelection] =
    useState(false);
  const showCustomerListSelection = () => {
    setViewCustomerListSelection(!viewCustomerListSelection);
  };

  const selectCustomer = (dataObj) => {
    // setCustomerData({ ...dataObj, branch_code: dataObj.bc });
    setNewData({
      ...newData,
      ...dataObj,
      branch_code: dataObj.bc,
    });

    getCustomerOutstanding(dataObj.customer_id);
    getCustomerCreditNotes(dataObj.customer_id);
  };
  /* ---  End of Customer List Selection Required ---- */

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    calculatePaytotal();
  }, [paymentData]);

  /* --- Component functions --- */

  const fetchData = async () => {
    try {
      setIsLoading({
        ...isLoading,
        init: true,
      });

      const response = await api.get(`customer-payments`);

      setNewData({
        ...newData,
        ddate: response.data.ddate,
        newDate: response.data.ddate,
        id: response.data.new_id,
        newId: response.data.new_id,
        customer_id: '',
        nicno: '',
        cusname: '',
        address: '',
        mobile: '',

        memo: '',
        total_outstanding: 0,
        total_settlement: 0,
        total_pay: 0,
      });

      clearPayments();

      setOutstandings([]);

      setIsLoading({
        ...isLoading,
        init: false,
      });
    } catch (error) {
      return msg.error('Unable to fetch data!');
    }
  };

  const getCustomer = async (e) => {
    if (e.key === 'Enter') {
      try {
        const response = await api
          .post(`get_customer_by_nic`)
          .values({ nic: newData.nicno });

        if (response.data.customer === null) {
          msg.warning_stick(
            'There is no customer exist for entered NIC. Please check the NIC or create new customer and enter sales order before do advance payments ..',
          );
          setNewData({
            ...newData,
            customer_id: '',
            nicno: '',
            cusname: '',
            address: '',
            mobile: '',
          });
        } else {
          setNewData({
            ...newData,
            customer_id: response.data.customer.customer_id,
            cusname: response.data.customer.cusname,
            address: response.data.customer.address,
            mobile: response.data.customer.mobile,
          });

          getCustomerOutstanding(response.data.customer.customer_id);
          getCustomerCreditNotes(response.data.customer.customer_id);
        }
      } catch (error) {
        return msg.error('Unable to get customer details.');
      }
    } else if (e.key === 'F2') {
      showCustomerListSelection();
    }
  };

  const getCustomerOutstanding = async (customerID) => {
    try {
      const response = await api
        .post(`get-customer-outstandings`)
        .values({ customer_id: customerID });

      if (response.data.balance_invoices) {
        setOutstandings(response.data.balance_invoices);
      }
    } catch (error) {
      return msg.error('Unable to get sales orders.');
    }
  };

  const getCustomerCreditNotes = async (customerID) => {
    try {
      const response = await api
        .post(`get-credit-notes-balances`)
        .values({ account_id: customerID, bc_no: cookie.get('user_branch') });

      if (response.data.trans) {
        // setCreditNotes(response.data.trans);
        setPaymentData({
          ...paymentData,
          creditNotes: response.data.trans,
        });
      }
    } catch (error) {
      return msg.error('Unable to get sales orders.');
    }
  };

  const updatePayments = (
    cash_amount,
    card_amount,
    old_gold_amount,
    return_amount,
    credit_amount,
    crn_amount,
  ) => {
    setPaymentData({
      ...paymentData,
      cash_amount: cash_amount,
      card_amount: card_amount,
      old_gold_amount: old_gold_amount,
      return_amount: return_amount,
      credit_amount: credit_amount,
      crn_amount: crn_amount,
    });
  };

  const supplierSelect = (selectedObj) => {
    setNewData({
      ...newData,
      nicno: selectedObj.code,
      cusname: selectedObj.description,
    });
  };

  const officerSelect = (selectedObj) => {
    setNewData({
      ...newData,
      employee_id: selectedObj.id,
      employee_name: selectedObj.name,
    });
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

  const handleSubmit = async () => {
    if (checkBeforeSave() === false) return;
    await save();
  };

  const save = async () => {
    try {
      const response = await api
        .post('customer-payments')
        .values({ formdata: newData, payment: paymentData, outstandings });

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
    if (
      newData.customer_id === '' ||
      newData.cusname === '' ||
      newData.nicno === ''
    ) {
      msg.warning('Enter Customer NIC and Name before save the invoice.');
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
      type: 'Receipt',
      invoice_amount: 0,
      cash_amount: 0,
      card_amount: 0,
      old_gold_amount: 0,
      return_amount: 0,
      credit_amount: 0,
      crn_amount: 0,
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
      customer_id: '',
      nicno: '',
      cusname: '',
      address: '',
      mobile: '',

      memo: '',
      total_outstanding: 0,
      total_settlement: 0,
      total_pay: 0,
    });

    clearPayments();
    setOutstandings([]);

    return true;
  };

  const showPaymentForm = () => {
    setViewPaymentForm(!viewPaymentForm);
  };

  const printReceipt = (invoice_no, is_dupplicate) => {
    CustomerPaymentA4Half.load(
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
      // console.log(`${key}: ${value}`);
      if (
        key !== 'invoice_amount' &&
        key !== 'type' &&
        key !== 'creditNotes' &&
        value !== ''
      ) {
        pay_total += parseFloat(value);
      }
    }
    // console.log('Pay total: ' + pay_total);
    setNewData({
      ...newData,
      total_pay: pay_total.toFixed(2),
    });
  };

  const saveFromPaymentModel = () => {
    handleSubmit();
  };

  /* --- End of component functions --- */

  /* --- Component renders --- */

  return (
    <div>
      <CustomerListSelection
        toggleFormModal={showCustomerListSelection}
        showModalState={viewCustomerListSelection}
        selectRow={selectCustomer}
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
            <div className="col-sm-8">
              <div className="form-group row mb-0">
                <label htmlFor="nicno" className="col-sm-3 col-form-label ">
                  Customer
                </label>
                <div className="col-sm-3 pr-0">
                  <input
                    type="text"
                    className="form-control form-control-sm rounded-0 bg-white"
                    id="nicno"
                    name="nicno"
                    value={newData.nicno}
                    onChange={handleValueChanges}
                    onKeyDown={getCustomer}
                    placeholder="Press <F2>"
                    readOnly
                  />
                </div>

                <div className="col-sm-6">
                  <input
                    type="text"
                    id="cusname"
                    name="cusname"
                    className="form-control form-control-sm rounded-0"
                    maxLength="100"
                    value={newData.cusname}
                    onChange={handleValueChanges}
                    placeholder="Customer Name"
                    readOnly
                  />
                </div>
              </div>

              {/* <div className="form-group row mb-0">
                <label htmlFor="notes" className="col-sm-1 col-form-label pr-0">
                  Mobile
                </label>
                <div className="col-sm-3 pr-0">
                  <input
                    name="mobile"
                    id="mobile"
                    className="form-control form-control-sm rounded-0"
                    maxLength="10"
                    value={newData.mobile}
                    onChange={handleValueChanges}
                  />
                </div>
                <label
                  htmlFor="notes"
                  className="col-sm-1 col-form-label text-right px-0"
                >
                  Address
                </label>
                <div className="col-sm-6">
                  <input
                    name="address"
                    id="address"
                    className="form-control form-control-sm rounded-0"
                    maxLength="200"
                    value={newData.address}
                    onChange={handleValueChanges}
                  />
                </div>
              </div> */}
              <div className="form-group row mb-0">
                <label htmlFor="notes" className="col-sm-3 col-form-label ">
                  Memo
                </label>
                <div className="col-sm-9">
                  <textarea
                    name="memo"
                    id="memo"
                    rows="1"
                    maxLength="100"
                    className="form-control form-control-sm rounded-0"
                    value={newData.memo}
                    onChange={handleValueChanges}
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="col-sm-4">
              <div className="form-group row mb-0">
                <label htmlFor="ddate" className="col-sm-4 col-form-label px-0">
                  Date
                </label>
                <div className="col-sm-8">
                  <input
                    type="date"
                    className="form-control form-control-sm rounded-0"
                    id="ddate"
                    name="ddate"
                    value={newData.ddate}
                    onChange={handleValueChanges}
                  />
                </div>
              </div>

              <div className="form-group row mb-0">
                <label htmlFor="po_no" className="col-sm-4 col-form-label px-0">
                  Invoice No.
                </label>
                <div className="col-sm-8">
                  <input
                    type="text"
                    className="form-control form-control-sm rounded-0 text-right"
                    id="id"
                    name="id"
                    value={newData.id}
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-sm-8">
              <div className="row">
                <label htmlFor="amount" className="col-sm-3 col-form-label ">
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
              </div>
              <div className="row">
                <label htmlFor="amount" className="col-sm-3 col-form-label ">
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
            <div className="col-sm-4">
              <div className="row">
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
                                    className="form-control-plaintext form-control-sm rounded-0"
                                    value={item.trans_no}
                                    readOnly
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    name="sum_dr"
                                    id="sum_dr"
                                    data-id={index}
                                    className="form-control-plaintext form-control-sm rounded-0 text-right"
                                    value={item.sum_dr}
                                    readOnly
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    name="balance"
                                    id="balance"
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
                                    id="settle"
                                    step="any"
                                    data-id={index}
                                    className="form-control-plaintext form-control-sm rounded-0 text-right"
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
                          Total Settlement
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

          <hr />
          <div className="row">
            <div className="col-sm-2">
              <SystemButton
                type="no-form-save"
                showText
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

export default CustomerPayment;
