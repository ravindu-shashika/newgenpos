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
import AdvanceRefundA4Half from '../../../printouts/AdvanceRefundA4Half';
import Cookies from 'universal-cookie';

const AdvanceRefund = () => {
  // Module name
  const moduleName = 'Cash Refund';

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
    advance_payment_id: '',
    sales_return_id: '',
    advance_amount: '',
    credit_note_id: '',
    credit_note_balance: '',
    memo: '',
    amount: 0,

    type: 'Advance',
  });

  const [paymentData, setPaymentData] = useState({
    type: 'Advance',
    invoice_amount: 0,
    cash_amount: '',
    card_amount: '',
    old_gold_amount: '',
    return_amount: '',
    credit_amount: '',
  });

  const [advancePayments, setAdvancePayments] = useState([]);
  const [salesReturns, setSalesReturns] = useState([]);
  //   const [employees, setEmployees] = useState([]);
  const [viewCustomerForm, setViewCustomerForm] = useState(false);
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

    getAdvancePayments(dataObj.customer_id);
    getSalesReturns(dataObj.customer_id);
  };
  /* ---  End of Customer List Selection Required ---- */

  useEffect(() => {
    fetchData();
  }, []);

  //   useEffect(() => {
  //     calColumnTotals();
  //   }, [newData.details]);

  useEffect(() => {
    setAdvancePaymentDetails();
  }, [newData.advance_payment_id]);

  useEffect(() => {
    setSalesReturnDetails();
  }, [newData.sales_return_id]);

  /* --- Component functions --- */

  const fetchData = async () => {
    try {
      setIsLoading({
        ...isLoading,
        init: true,
      });

      const response = await api.get(`advance-refunds`);

      //   setEmployees(response.data.employees);
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
        advance_payment_id: '',
        advance_amount: '',
        credit_note_id: '',
        credit_note_balance: '',
        memo: '',
        amount: 0,
      });

      setAdvancePayments([]);

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

          getAdvancePayments(response.data.customer.customer_id);
        }
      } catch (error) {
        return msg.error('Unable to get customer details.');
      }
    } else if (e.key === 'F2') {
      showCustomerListSelection();
    }
  };

  const getAdvancePayments = async (customerID) => {
    try {
      const response = await api
        .post(`advance-payments/of-customer`)
        .values({ customer_id: customerID, bc_no: cookie.get('user_branch') });

      if (response.data.records) {
        setAdvancePayments(response.data.records);
      }
    } catch (error) {
      return msg.error('Unable to get advance payments.');
    }
  };
  const getSalesReturns = async (customerID) => {
    try {
      const response = await api
        .post(`sales-returns/of-customer`)
        .values({ customer_id: customerID, bc_no: cookie.get('user_branch') });

      if (response.data.records) {
        setSalesReturns(response.data.records);
      }
    } catch (error) {
      return msg.error('Unable to get advance payments.');
    }
  };

  const setAdvancePaymentDetails = async () => {
    if (newData.advance_payment_id === '') return;
    let so = advancePayments.find((obj) => {
      return parseInt(obj.id) === parseInt(newData.advance_payment_id);
    });

    let creditNote;

    try {
      const response = await api.post(`get-balance-of-crn`).values({
        credit_note_id: so.credit_note_id,
        bc_no: cookie.get('user_branch'),
      });

      if (response.data.trans) {
        creditNote = response.data.trans;
      }
    } catch (error) {
      return msg.error('Unable to get credit note balance1.');
    }

    if (so) {
      setNewData({
        ...newData,
        advance_amount: so.amount,
        credit_note_id: so.credit_note_id,
        credit_note_balance: creditNote ? creditNote.balance : 0,
        amount: creditNote ? creditNote.balance : 0,
      });
    }
  };

  const setSalesReturnDetails = async () => {
    if (newData.sales_return_id === '') return;
    let so = salesReturns.find((obj) => {
      return parseInt(obj.id) === parseInt(newData.sales_return_id);
    });

    let creditNote;

    try {
      const response = await api.post(`get-balance-of-crn`).values({
        credit_note_id: so.credit_note.id,
        bc_no: cookie.get('user_branch'),
      });

      if (response.data.trans) {
        creditNote = response.data.trans;
      }
    } catch (error) {
     if(so){
      return msg.error('Unable to get credit note balancez.');
     }
    }

    // newData.advance_payment_id

    if (so) {
      setNewData({
        ...newData,
        advance_amount: so.net_amount,
        // advance_payment_id:so.credit_note.id,
        credit_note_id: so.credit_note.id,
        credit_note_balance: creditNote ? creditNote.balance : 0,
        amount: creditNote ? creditNote.balance : 0,
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
        .post('advance-refunds')
        .values({ formdata: newData, payment: paymentData });

      if (parseInt(response.data) > 0) {
        printReceipt(response.data, false);
        const reseted = await resetAll();
        if (reseted) fetchData();
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

    if (newData.advance_payment_id === '' && newData.type === 'advance') {
      msg.warning('Select advance payment before save.');
      return false;
    }

    if (parseFloat(newData.credit_note_balance) <= 0) {
      msg.warning('Advance balance zero(0). Already settled it to a invoice.');
      return false;
    }

    if (parseFloat(newData.amount) <= 0) {
      msg.warning('Enter refund amount before save.');
      return false;
    }

    if (parseFloat(newData.credit_note_balance) < parseFloat(newData.amount)) {
      msg.warning('Refund amount cannot larger than advance balance.');
      return false;
    }

    if(newData.type === 'SRN'){
      paymentData.type = 'SRN';
    }

    return true;
  };

  const clearPayments = () => {
    setPaymentData({
      type: 'Customer',
      invoice_amount: 0,
      cash_amount: '',
      card_amount: '',
      old_gold_amount: '',
      return_amount: '',
      credit_amount: '',
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
      advance_payment_id: '',
      advance_amount: '',
      credit_note_id: '',
      credit_note_balance: '',
      memo: '',
      amount: 0,
    });

    setAdvancePayments([]);

    clearPayments();

    return true;
  };

  const showCustomerForm = () => {
    setViewCustomerForm(!viewCustomerForm);
  };

  const showPaymentForm = () => {
    setViewPaymentForm(!viewPaymentForm);
  };

  const changeOrderType = (type) => {
    setNewData({
      ...newData,
      type: type,
    });
  };

  const printReceipt = (invoice_no, is_dupplicate) => {
    AdvanceRefundA4Half.load(
      invoice_no,
      cookie.get('user_branch'),
      is_dupplicate,
    );
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
      />
      <h5 className="text-center">{moduleName}</h5>
      <br />
      {isLoading.init ? (
        <Loader />
      ) : (
        <div>
          <div className="row mb-3">
            <div className="col-sm-9 ">
              <div className="row">
                <label htmlFor="nicno" className="col-sm-2 col-form-label ">
                  Customer
                </label>
                <div className="col-sm-2 pr-0">
                  <input
                    type="text"
                    className="form-control form-control-sm rounded-0 bg-white"
                    id="nicno"
                    name="nicno"
                    value={newData.nicno}
                    // onChange={handleValueChanges}
                    onKeyDown={getCustomer}
                    placeholder="Press <F2>"
                    readOnly
                  />
                </div>

                <div className="col-sm-7 pl-0">
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

              <div className=" row ">
                <label htmlFor="notes" className="col-sm-2 col-form-label">
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
            </div>

            <div className="col-sm-3 border-left">
              <div className=" row ">
                <label htmlFor="ddate" className="col-sm-4 col-form-label ">
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

              <div className=" row ">
                <label htmlFor="po_no" className="col-sm-4 col-form-label ">
                  No.
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

          <hr />
          <div className="row mb-2">
            <div className="btn-group mx-3" role="group">
              <button
                type="button"
                className="btn btn-outline-success "
                onClick={() => changeOrderType('Advance')}
              >
                Advance Payment
              </button>
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={() => changeOrderType('SRN')}
              >
                Sales Return
              </button>
            </div>
          </div>
          {newData.type === 'Advance' ? (
            <div className="row">
              <label
                htmlFor="advance_payment_id"
                className="col-sm-2 col-form-label "
              >
                Advance Payment #
              </label>
              <div className="col-sm-2">
                <select
                  id="advance_payment_id"
                  name="advance_payment_id"
                  className="form-control form-control-sm"
                  required
                  onChange={handleValueChanges}
                  value={newData.advance_payment_id}
                >
                  <option value="">Select Advance</option>
                  {advancePayments.map((obj) => {
                    return (
                      <option key={obj.id} value={obj.id}>
                        {obj.id}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          ) : null}

          {newData.type === 'SRN' ? (
            <div className="row">
              <label
                htmlFor="sales_return_id"
                className="col-sm-2 col-form-label "
              >
                Sales Return #
              </label>
              <div className="col-sm-2">
                <select
                  id="sales_return_id"
                  name="sales_return_id"
                  className="form-control form-control-sm"
                  required
                  onChange={handleValueChanges}
                  value={newData.sales_return_id}
                >
                  <option value="">Select SRN</option>
                  {salesReturns.map((obj) => {
                    return (
                      <option key={obj.id} value={obj.id}>
                        {obj.nno}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          ) : null}

          <div className="row">
            <label htmlFor="amount" className="col-sm-2 col-form-label">
              Advance Amount
            </label>
            <div className="col-sm-2">
              <input
                name="amount"
                id="amount"
                className="form-control form-control-sm  text-right"
                required
                readOnly
                value={newData.advance_amount}
              />
            </div>
            <label
              htmlFor="amount"
              className="col-sm-2 col-form-label text-right "
            >
              Balance
            </label>
            <div className="col-sm-2">
              <input
                name="amount"
                id="amount"
                className="form-control form-control-sm  text-right"
                required
                readOnly
                value={newData.credit_note_balance}
              />
            </div>
          </div>
          <div className="row">
            <label htmlFor="amount" className="col-sm-2 col-form-label ">
              Refund Amount
            </label>
            <div className="col-sm-2">
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
            {/* <div className="col-sm-2">
              <SystemButton type="payment" showText method={showPaymentForm} />
            </div> */}
          </div>
          <hr />
        </div>
      )}
    </div>
  );

  /* --- End of component renders --- */
};

export default AdvanceRefund;
