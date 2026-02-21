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
// import InvoicePrint from '../../../printouts/InvoicePrint';
import AdvancePaymentA4Half from '../../../printouts/AdvancePaymentA4Half';

const AdvancePayment = () => {
  // Module name
  const moduleName = 'Advance Payment';

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
    sales_order_id: '',
    customer_id: '',
    nicno: '',
    cusname: '',
    address: '',
    mobile: '',

    memo: '',
    employee_id: '',
    employee_name: '',
    amount: 0,

    sales_order_amount: 0,
    sales_order_balance: 0,
    advance_total: 0,
  });

  const [paymentData, setPaymentData] = useState({
    type: 'Advance',
    invoice_amount: 0,
    cash_amount: 0,
    card_amount: 0,
    old_gold_amount: 0,
    return_amount: 0,
    credit_amount: 0,
  });

  const [salesOrders, setSalesOrders] = useState([]);
  const [paidAdvancesForOrder, setPaidAdvancesForOrder] = useState([]);
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

    getSalesOrders(dataObj.customer_id);
  };
  /* ---  End of Customer List Selection Required ---- */

  useEffect(() => {
    fetchData();
  }, []);

  //   useEffect(() => {
  //     calColumnTotals();
  //   }, [newData.details]);

  useEffect(() => {
    setSalesOrderDetails();
  }, [newData.sales_order_id]);

  /* --- Component functions --- */

  const fetchData = async () => {
    try {
      setIsLoading({
        ...isLoading,
        init: true,
      });

      const response = await api.get(`advance-payments`);

      setEmployees(response.data.employees);
      setNewData({
        ...newData,
        ddate: response.data.ddate,
        newDate: response.data.ddate,
        id: response.data.new_id,
        newId: response.data.new_id,

        sales_order_id: '',
        customer_id: '',
        nicno: '',
        cusname: '',
        address: '',
        mobile: '',

        memo: '',
        employee_id: '',
        employee_name: '',
        amount: 0,

        sales_order_amount: 0,
        sales_order_balance: 0,
        advance_total: 0,
      });

      clearPayments();
      setSalesOrders([]);
      setPaidAdvancesForOrder([]);

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

          getSalesOrders(response.data.customer.customer_id);
        }
      } catch (error) {
        return msg.error('Unable to get customer details.');
      }
    } else if (e.key === 'F2') {
      showCustomerListSelection();
    }
  };

  const getSalesOrders = async (customerID) => {
    try {
      const response = await api
        .post(`sales-orders/get-by-customer`)
        .values({ customer_id: customerID });

      if (response.data.sales_orders) {
        setSalesOrders(response.data.sales_orders);
      }
    } catch (error) {
      return msg.error('Unable to get sales orders.');
    }
  };

  const setSalesOrderDetails = async () => {
    let so = salesOrders.find((obj) => {
      return parseInt(obj.id) === parseInt(newData.sales_order_id);
    });
    let balance = 0;
    if (so) {
      const response = await api
        .post(`advance-payments/of-sales-order`)
        .values({ sales_order_id: newData.sales_order_id });
      if (response.data.records) {
        setPaidAdvancesForOrder(response.data.records);
      }
      balance = parseFloat(so.tot_amount).toFixed(2);
      if (response.data.sum) {
        balance = (
          parseFloat(so.tot_amount) - parseFloat(response.data.sum)
        ).toFixed(2);
      }
      setNewData({
        ...newData,
        amount: balance,
        sales_order_amount: so.tot_amount,
        sales_order_balance: balance,
        advance_total: response.data.sum,
        employee_id: so.employee_id,
      });

      setPaymentData({
        ...paymentData,
        invoice_amount: balance,
      });
    }
  };

  const updatePayments = (
    cash_amount,
    card_amount,
    old_gold_amount,
    return_amount,
    credit_amount,
  ) => {
    setPaymentData({
      ...paymentData,
      cash_amount: cash_amount,
      card_amount: card_amount,
      old_gold_amount: old_gold_amount,
      return_amount: return_amount,
      credit_amount: credit_amount,
    });
    console.log('asap' + paymentData);
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

    if (inputName === 'amount') {
      setPaymentData({
        ...paymentData,
        invoice_amount: inputValue,
      });
    }
  };

  const handleSubmit = async () => {
    if (checkBeforeSave() === false) return;
    await save();
  };

  const save = async () => {
    try {
      const response = await api
        .post('advance-payments')
        .values({ formdata: newData, payment: paymentData });

      console.log('Invoice No.:' + response.data);

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
    // debugger;
    if (
      newData.customer_id === '' ||
      newData.cusname === '' ||
      newData.nicno === ''
    ) {
      msg.warning('Enter Customer NIC and Name before save the invoice.');
      return false;
    }

    if (parseFloat(newData.amount) <= 0) {
      msg.warning('Enter pay amount before save.');
      return false;
    }
    if (parseFloat(newData.amount) >= parseFloat(newData.sales_order_balance)) {
      msg.warning('Cannot pay more than sales order balance.');
      return false;
    }

    const tot_pay =
      parseFloat(paymentData.cash_amount) +
      parseFloat(paymentData.card_amount) +
      parseFloat(paymentData.old_gold_amount) +
      parseFloat(paymentData.return_amount) +
      parseFloat(paymentData.credit_amount);
    if (parseFloat(newData.amount) != tot_pay) {
      msg.warning(
        'Advance Payment pay amount must be equals to total payments. Check the payments before save.',
      );
      return false;
    }

    if (newData.employee_id === '') {
      msg.warning('Select a salesman before save the Advance Payment.');
      return false;
    }

    return true;
  };

  const clearPayments = () => {
    setPaymentData({
      type: 'Advance',
      invoice_amount: 0,
      cash_amount: 0,
      card_amount: 0,
      old_gold_amount: 0,
      return_amount: 0,
      credit_amount: 0,
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
      nicno: '',
      cusname: '',
      address: '',
      mobile: '',

      memo: '',
      employee_id: '',
      employee_name: '',
      amount: 0,
    });

    setEmployees([]);

    clearPayments();

    return true;
  };

  const showPaymentForm = () => {
    setViewPaymentForm(!viewPaymentForm);
  };

  const printReceipt = (invoice_no, is_dupplicate) => {
    AdvancePaymentA4Half.load(
      invoice_no,
      cookie.get('user_branch'),
      is_dupplicate,
    );
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
          <div className="row mb-2">
            <div className="col-sm-8">
              <div className="form-group row mb-0">
                <label htmlFor="nicno" className="col-sm-3 col-form-label ">
                  Customer
                </label>
                <div className="col-sm-3">
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
                {/* <label
                  htmlFor="cusname"
                  className="col-sm-1 col-form-label "
                >
                  Name
                </label> */}
                <div className="col-sm-6 pl-0">
                  <input
                    type="text"
                    id="cusname"
                    name="cusname"
                    className="form-control form-control-sm rounded-0"
                    maxLength="100"
                    value={newData.cusname}
                    // onChange={handleValueChanges}
                    placeholder="Customer Name"
                    readOnly
                  />
                </div>
              </div>

              <div className="row">
                <label
                  htmlFor="sales_order_id"
                  className="col-sm-3 col-form-label "
                >
                  Sales Order
                </label>
                <div className="col-sm-3">
                  <select
                    id="sales_order_id"
                    name="sales_order_id"
                    className="form-control form-control-sm"
                    required
                    onChange={handleValueChanges}
                    value={newData.sales_order_id}
                  >
                    <option value="">---</option>
                    {salesOrders.map((obj) => {
                      return (
                        <option key={obj.id} value={obj.id}>
                          {obj.id}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="row">
                <label htmlFor="amount" className="col-sm-3 col-form-label ">
                  Advance Amount
                </label>
                <div className="col-sm-3">
                  <input
                    name="amount"
                    id="amount"
                    className="form-control form-control-sm  text-right"
                    min="1"
                    step="any"
                    max="100000000"
                    required
                    value={newData.amount}
                    onFocus={(e) => e.target.select()}
                    onChange={handleValueChanges}
                  />
                </div>
              </div>
              <hr />
              <div className="form-group row ">
                <label htmlFor="notes" className="col-sm-3 col-form-label ">
                  Memo
                </label>
                <div className="col-sm-9 ">
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
              <hr />
              <div className="row">
                <div className="col-sm-3">
                  <SystemButton
                    type="no-form-save"
                    showText
                    method={handleSubmit}
                  />
                </div>
                {/* <div className="col-sm-2">
              <SystemButton type="cancel" showText method={handleSubmit} />
              </div>*/}
                <div className="col-sm-3">
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
                <div className="col-sm-3">
                  <SystemButton type="reset" showText method={resetAll} />
                </div>
                <div className="col-sm-3">
                  <SystemButton
                    type="payment"
                    showText
                    method={showPaymentForm}
                  />
                </div>
              </div>
            </div>

            <div className="col-sm-4">
              <div className="row">
                <label htmlFor="ddate" className="col-sm-6 col-form-label px-0">
                  Date
                </label>
                <div className="col-sm-6">
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

              <div className="row">
                <label htmlFor="po_no" className="col-sm-6 col-form-label px-0">
                  Invoice No.
                </label>
                <div className="col-sm-6">
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

              <hr />
              <div className="row mt-2 mb-1">
                <h5 className="font-weight-bold">Sales Order Details</h5>
              </div>
              <fieldset disabled>
                <div className="row">
                  <label
                    htmlFor="sales_order_amount"
                    className="col-sm-6 col-form-label px-0"
                  >
                    Sales Order Total
                  </label>
                  <div className="col-sm-6">
                    <input
                      type="text"
                      name="sales_order_amount"
                      id="sales_order_amount"
                      className="form-control form-control-sm  text-right"
                      value={newData.sales_order_amount}
                      readOnly
                    />
                  </div>
                </div>
                <div className="row">
                  <label
                    htmlFor="sales_order_balance"
                    className="col-sm-6 col-form-label px-0"
                  >
                    Sales Order Balance
                  </label>
                  <div className="col-sm-6">
                    <input
                      type="text"
                      name="sales_order_balance"
                      id="sales_order_balance"
                      className="form-control form-control-sm  text-right"
                      value={newData.sales_order_balance}
                      readOnly
                    />
                  </div>
                </div>
                <div className="row">
                  <label className="col-sm-6 col-form-label px-0">
                    Salesman
                  </label>
                  <div className="col-sm-6">
                    <select
                      id="employee_id"
                      name="employee_id"
                      className="form-control form-control-sm"
                      required
                      onChange={handleValueChanges}
                      value={newData.employee_id}
                      style={{
                        textIndent: '1px',
                        textOverflow: '',
                        WebkitAppearance: 'none',
                        MozAppearance: 'none',
                      }}
                    >
                      <option value="">---</option>
                      {employees.map((obj) => {
                        return (
                          <option key={obj.id} value={obj.id}>
                            {obj.name}
                          </option>
                        ); 
                      })}
                    </select>
                  </div>
                </div>
              </fieldset>
              <div className="row mt-2 mb-1">
                <h5 className="font-weight-bold">Advance Payments</h5>
              </div>
              <div className="row">
                <div className="table-responsive header-fixed-scrollable">
                  <table className="table table-bordered table-sm table-hover">
                    <thead className="thead-dark text-center">
                      <tr>
                        <td width="10%">#</td>
                        <td width="20%"> No.</td>
                        <td width="20%">Amount</td>
                      </tr>
                    </thead>
                    <tbody>
                      {paidAdvancesForOrder
                        ? paidAdvancesForOrder.map((item, index) => {
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
                                    value={item.id}
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
                                    value={item.amount}
                                    readOnly
                                  />
                                </td>
                              </tr>
                            );
                          })
                        : null}
                    </tbody>
                    <tfoot className="tfoot-dark">
                      <tr>
                        <th className="text-center" colSpan="2">
                          Total
                        </th>
                        <td>
                          <input
                            type="text"
                            className="form-control-plaintext text-right kinda-important-text-3"
                            id="total_settlement"
                            name="total_settlement"
                            value={newData.advance_total}
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

          <div className="row">
            <div className="col-sm-8"></div>
            <div className="col-sm-4"></div>
          </div>

          <hr />
        </div>
      )}
    </div>
  );

  /* --- End of component renders --- */
};

export default AdvancePayment;
