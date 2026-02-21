import React, { useState, useEffect, useRef } from 'react';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import {
  Loader,
  SDD,
  SystemButton,
  CustomerListSelection,
} from '../../../components';
import { api, cookie, msg } from '../../../services';
// import CustomerForm from '../../master/customers/CustomerForm';
import PaymentModel from '../PaymentModel';
import PaymentVoucherA4Half from '../../../printouts/PaymentVoucherA4Half';
import Cookies from 'universal-cookie';
import { useNavigate, useParams } from 'react-router-dom';

const PaymentVoucher = () => {
  // Module name
  const moduleName = 'Payment Voucher';

  /* --- State declarationss --- */

  let navigate = useNavigate();

  const { nno, bc_no } = useParams();

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
    nno: '',
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
    is_approved: false,
    note: '',
    type: '',
    vendor_id: '',
    amount: 0,
    total_amount: 0,
    details: [],
    paid_acc: '',

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

  const [itemRow, setItemRow] = useState({
    amount: 0.0,
    acc_code: '',
    account: {
      code: '',
      description: '',
    },
    bc: '',
    branches: {
      bc_no: '',
      name: '',
    },
  });

  const [advancePayments, setAdvancePayments] = useState([]);
  const [payingAcount, setPayingAcount] = useState([]);
  const [salesReturns, setSalesReturns] = useState([]);
  //   const [employees, setEmployees] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [branches, setBranches] = useState([]);
  const [payingAccount, setPayingAccount] = useState([]);
  const [viewCustomerForm, setViewCustomerForm] = useState(false);
  const [viewPaymentForm, setViewPaymentForm] = useState(false);

  const isApproved = useRef(false);

  const [approved, setApproved] = useState(false);

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

  // useEffect(() => {
  //   fetchData();
  // }, []);

  useEffect(() => {
    if (nno) {
      newData.nno = nno;
      // edit();
    } else {
      fetchData();
    }
  }, []);

  useEffect(() => {
    if (nno != ':nno') {
      newData.nno = nno;
      edit();
    } else {
      fetchData();
    }
  }, [nno]);

  useEffect(() => {
    calColumnTotals();
  }, [newData.details]);

  // useEffect(() => {
  //   setAdvancePaymentDetails();
  // }, [newData.advance_payment_id]);

  // useEffect(() => {
  //   setSalesReturnDetails();
  // }, [newData.sales_return_id]);

  useEffect(() => {
    set_paying_acc();
  }, [newData.type]);

  useEffect(() => {
    setNewData({
      ...newData,
      is_approved: approved,
    });
  }, [approved]);

  useEffect(() => {
    if (approved && newData.is_approved && isEdit) {
      handleSubmit();
    }
  }, [newData.is_approved && approved]);

  /* --- Component functions --- */

  const fetchData = async () => {
    try {
      setIsLoading({
        ...isLoading,
        init: true,
      });

      const response = await api.get(`payment-voucher`);

      //   setEmployees(response.data.employees);
      setVendors(response.data.vendor);
      setPayingAccount(response.data.accounts);
      setBranches(response.data.branches);
      setNewData({
        ...newData,
        ddate: response.data.ddate,
        newDate: response.data.ddate,
        nno: response.data.new_id,
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
        is_approved: '',
        type: '',
        vendor_id: '',
        note: '',
        amount: 0,
        details: [],
        paid_acc: '',
      });

      setAdvancePayments([]);

      // setIsEdit(false);

      // setApproved(false);

      // isApproved(false);

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
      if (so) {
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

  const handleItemRowChanges = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue = targetInput.value;

    setItemRow({
      ...itemRow,
      [inputName]: inputValue,
    });
  };

  const handleSubmit = async () => {
    // if (checkBeforeSave() === false) return;
    await save();
  };

  const save = async () => {
    try {
      if (!isEdit) {
        const response = await api.post('payment-voucher').values(newData);

        // if (response.data) {
        //   printReceipt(response.data, false);

        //   const reseted = await resetAll();
        //   if (reseted) fetchData();
        //   msg.success('Saved Successfully.');
        // }
        if (response.status == 200 && response.data.status == 200) {
          printReceipt(response.data.newid, false);
          msg.success(response.data.message);
          resetAll();
          fetchData();
        } else if (response.status == 200 && response.data.status == 500) {
          msg.error(response.data.message);
        } else if (response.status == 200 && response.data.status == 400) {
          Object.values(response.data.message).forEach((err) => {
            msg.error(err[0]);
          });
          console.log('reee');
          msg.error(response.data.message);
        } else if (response.data.status == 400) {
          // Object.values(response.message).forEach((err) => {
          //   msg.error(err[0]);
          // });
          msg.error(response.data.message);
        }
      } else {
        const response = await api
          .put('payment-voucher', newData.nno)
          .values(newData);

        if (parseInt(response.data) > 0) {
          printReceipt(response.data, false);
          fetchData();
          msg.success('Voucher Saved Successfully.');
          navigate('/payment-voucher/:nno/:bc_no');
          // window.location.reload(false);
        }
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

    if (newData.type === 'SRN') {
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
      note: '',
      type: '',
      vendor_id: '',
      amount: 0,
      total_amount: 0,
      details: [],
    });

    setItemRow({
      index: uuidv4(),
      amount: 0.0,
      acc_code: '',
      account: {
        code: '',
        description: '',
      },
      bc: '',
      branches: {
        bc_no: '',
        name: '',
      },
    });

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
    PaymentVoucherA4Half.load(
      invoice_no,
      cookie.get('user_branch'),
      is_dupplicate,
    );
  };

  const set_paying_acc = async () => {
    try {
      const response = await api
        .post('set-paying-acc')
        .values({ payment_type: newData.type });

      setPayingAcount(response.data.account);
    } catch (err) {
      msg.error(err);
      return;
    }
  };

  const payingAccountSelect = (selectedObj) => {
    console.log(selectedObj);
    setItemRow({
      ...itemRow,
      acc_code: selectedObj.code,
      account: {
        code: selectedObj.code,
        description: selectedObj.description,
      },
    });
  };

  const branchSelect = (selectedObj) => {
    setItemRow({
      ...itemRow,
      bc: selectedObj.bc_no,
      branches: {
        bc_no: selectedObj.bc_no,
        name: selectedObj.name,
      },
    });
  };

  const addNewItem = () => {
    setNewData({
      ...newData,
      details: [...newData.details, itemRow],
    });

    setItemRow({
      index: uuidv4(),
      amount: 0.0,
      acc_code: '',
      account: {
        code: '',
        description: '',
      },
      bc: '',
      branches: {
        bc_no: '',
        name: '',
      },
    });
  };

  const removeItem = (i) => {
    // TODO: Create a better dialog box component... Use the FormModal component as a base template

    if (window.confirm('Are you sure you want to remove this item?')) {
      let filteredRows = newData.details.filter((item) => item.index !== i);

      setNewData({
        ...newData,
        details: filteredRows,
      });
    }
  };

  const calColumnTotals = () => {
    let total_amount = 0;

    newData.details.forEach((row) => {
      total_amount += parseFloat(row.amount);
    });

    setNewData({
      ...newData,
      total_amount: parseFloat(total_amount).toFixed(2),
    });
  };

  const edit = async () => {
    try {
      setIsLoading({
        ...isLoading,
        init: true,
      });

      const response = await api.get(
        `vouchers/${newData.nno}/${newData.bc_no}`,
      );

      isApproved.current = response.data.result.is_approved ? true : false;

      let dataObj = response.data.result;
      // dataObj.vendor_name = response.data.result.vendor.name;
      // dataObj.officer_name = response.data.result.officer.name;

      const details = response.data.result.details.map((item) => {
        return { ...item, index: uuidv4() };
      });

      // dataObj.details = details;
      // dataObj.stone_details = [];
      // dataObj.stone_details = st_details;
      // console.log(dataObj);
      // dataObj.details.stone_details = st_details;

      setNewData(dataObj);

      setIsEdit(true);

      setIsLoading({
        ...isLoading,
        init: false,
      });
    } catch (error) {
      setIsLoading({
        ...isLoading,
        init: false,
      });
      console.log(error);
      return msg.error('Unable to fetch data!');
    }
  };

  const approve = () => {
    isApproved.current = true;

    setApproved(true);
  };

  /* --- End of component functions --- */

  /* --- Component renders --- */

  return (
    <div>
      <br />
      <h5 className="text-center">{moduleName}</h5>
      <br />
      {isLoading.init ? (
        <Loader />
      ) : (
        <div>
          <div className="row mb-3">
            <div className="col-sm-9 ">
              <div className="row">
                <label htmlFor="type" className="col-sm-2 col-form-label ">
                  Payment Type
                </label>
                <div className="col-sm-3 pr-0">
                  <select
                    id="type"
                    name="type"
                    className="form-control form-control-sm"
                    required
                    onChange={handleValueChanges}
                    value={newData.type}
                  >
                    <option value="">Select</option>
                    <option value="Cash">Cash</option>
                    {/* <option value="Cheque">Cheque</option> */}
                  </select>
                </div>
              </div>
              <br />
              <div className="row">
                <h4 className="col-sm-4">Paying From:</h4>
              </div>

              <div className="row">
                <label
                  htmlFor="sales_return_id"
                  className="col-sm-2 col-form-label "
                >
                  Account
                </label>
                <div className="col-sm-4 pr-0">
                  <select
                    id="paid_acc"
                    name="paid_acc"
                    className="form-control form-control-sm"
                    required
                    onChange={handleValueChanges}
                    value={newData.paid_acc}
                    // value={newData.account_id}
                  >
                    <option value="">Select</option>
                    {payingAcount.map((obj) => {
                      return (
                        <option key={obj.code} value={obj.code}>
                          {obj.code} - {obj.description}
                        </option>
                      );
                    })}
                  </select>
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
                    id="nno"
                    name="nno"
                    value={newData.nno}
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>

          <hr />

          <div className="row">
            <h4 className="col-sm-4">Paying To:</h4>
          </div>

          <div className="row mb-3">
            <div className="col-sm-9 ">
              <div className="row">
                <label htmlFor="vendor_id" className="col-sm-2 col-form-label ">
                  Vendor
                </label>
                <div className="col-sm-3 pr-0">
                  <select
                    id="vendor_id"
                    name="vendor_id"
                    className="form-control form-control-sm"
                    required
                    onChange={handleValueChanges}
                    value={newData.vendor_id}
                  >
                    <option value="">Select Vendors</option>
                    {vendors.map((obj) => {
                      return (
                        <option key={obj.code} value={obj.code}>
                          {obj.name}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <br />
          <div className="row">
            <div className="table-responsive header-fixed-scrollable">
              <table className="table table-bordered table-sm table-hover">
                <thead className="thead-dark text-center">
                  <tr>
                    <td width="3%" rowSpan="2">
                      #
                    </td>
                    <td width="15%">Account</td>
                    <td width="15%">Amount</td>
                    <td width="12%">Ref Branch</td>
                    <td width="3%"></td>
                  </tr>
                  <tr>
                    <td>
                      <SDD
                        method={payingAccountSelect}
                        data={payingAccount}
                        value="description"
                        rowId="code"
                        classes="form-control form-control-sm"
                        placeholder="Account"
                        listId="description"
                        selected={itemRow.account.description}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="amount"
                        id="amount"
                        step="1"
                        className="form-control form-control-sm text-right"
                        value={itemRow.amount}
                        onChange={handleItemRowChanges}
                        placeholder="Quantity"
                      />
                    </td>
                    {/* branches */}
                    <td>
                      <SDD
                        method={branchSelect}
                        data={branches}
                        value="name"
                        rowId="bc_no"
                        classes="form-control form-control-sm"
                        placeholder="Branches"
                        listId="name"
                        selected={itemRow.branches.name}
                      />
                    </td>
                    <td>
                      <SystemButton
                        type={'add-row'}
                        method={(event) => {
                          addNewItem(event);
                        }}
                        showText={false}
                      />
                    </td>
                  </tr>
                </thead>
                <tbody>
                  {newData.details.map((item, index) => {
                    return (
                      <tr key={item.index}>
                        <th scope="row">{parseInt(index) + 1}</th>
                        <td>
                          <input
                            type="text"
                            name="description"
                            id="description"
                            data-id={index}
                            className="form-control-plaintext form-control-sm rounded-0"
                            value={newData.details[index].account.description}
                            readOnly
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            name="amount"
                            id="amount"
                            step="0.01"
                            data-id={index}
                            className="form-control form-control-sm rounded-0 text-right"
                            value={newData.details[index].amount}
                            // onChange={handleItemsChange}
                            placeholder="Amount"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            name="name"
                            id="name"
                            step="0.01"
                            data-id={index}
                            className="form-control form-control-sm rounded-0 text-right"
                            value={newData.details[index].branches.name}
                            // onChange={handleItemsChange}
                            placeholder="Branches"
                          />
                        </td>
                        <td className="text-center">
                          <SystemButton
                            type={'remove-row'}
                            method={() =>
                              removeItem(newData.details[index].index)
                            }
                            showText={false}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="tfoot-dark">
                  <tr>
                    <th className="text-center" colSpan="2">
                      Totals
                    </th>
                    <td>
                      <input
                        type="text"
                        className="form-control-plaintext text-right kinda-important-text-3"
                        id="total_qty"
                        name="total_qty"
                        value={newData.total_amount}
                        readOnly
                      />
                    </td>
                    <td></td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-sm-9 ">
              <div className="row">
                <label htmlFor="notes" className="col-sm-2 col-form-label pr-0">
                  Note
                </label>
                <div className="col-sm-8 ">
                  <textarea
                    name="note"
                    id="note"
                    rows="1"
                    maxLength="100"
                    className="form-control form-control-sm "
                    value={newData.note}
                    onChange={handleValueChanges}
                  ></textarea>
                </div>
              </div>
            </div>
          </div>

          <hr />
          <div className="row">
            {!newData.is_approved ? (
              <div className="col-sm-2">
                <SystemButton
                  type="no-form-save"
                  showText
                  btnText={isEdit ? 'Update' : 'Save'}
                  method={handleSubmit}
                />
              </div>
            ) : null}

            {isEdit && !newData.is_approved ? (
              <div className="col-sm-2">
                <SystemButton type="approve" showText method={approve} />
              </div>
            ) : null}

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
          </div>
          <hr />
        </div>
      )}
    </div>
  );

  /* --- End of component renders --- */
};

export default PaymentVoucher;
