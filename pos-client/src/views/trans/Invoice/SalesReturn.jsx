import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import { Loader, SDD, SystemButton } from '../../../components';
import { api, cookie, msg } from '../../../services';
import CustomerForm from '../../master/customers/CustomerForm';
import PaymentModel from '../PaymentModel';
import SalesReturnNote from '../../../printouts/SalesReturnPrintA4Half';

const Invoice = () => {
  // Module name
  const moduleName = 'Sales Return';

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
    gold_rate: '',
    store_id: '',
    invoice_id: '',

    customer_id: '',
    nicno: '',
    cusname: '',
    address: '',
    mobile: '',

    memo: '',
    employee_id: '',
    employee_name: '',

    tot_qty: 0,
    tot_weight: 0,
    tot_st_weight: 0,
    tot_price: 0,

    discount: 0,
    net_amount: 0,

    details: [],
  });

  const [controlsReadOnly, setControlsReadOnly] = useState({
    invoice_id: false,
    customer_nic: true,
  });

  const [paymentData, setPaymentData] = useState({
    type: 'Invoice',
    invoice_amount: 0,
    cash_amount: 0,
    card_amount: 0,
    old_gold_amount: 0,
    return_amount: 0,
    credit_amount: 0,
  });

  const [customerData, setCustomerData] = useState({
    branch_code: '',
    customer_id: '',
    customer_no: '',
    cusname: '',
    nicno: '',
    address: '',
    telNo: '',
    mobile: '',
    notes: '',
    is_blacklisted: 0,
  });

  const [itemRow, setItemRow] = useState({
    index: uuidv4(),
    tag_no: '',
    item_id: '',
    item_name: '',
    weight: 0,
    st_weight: 0,
    cost: 0,
    price: 0,
    agree_rate: 0,
  });

  const [stores, setStores] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [tags, setTags] = useState([]);
  const [viewCustomerForm, setViewCustomerForm] = useState(false);
  const [viewPaymentForm, setViewPaymentForm] = useState(false);

  /* --- End of state declarations --- */

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    calColumnTotals();
  }, [newData.details]);

  useEffect(() => {
    setNewData({
      ...newData,
      customer_id: customerData.customer_id,
      nicno: customerData.nicno,
      cusname: customerData.cusname,
      address: customerData.address,
      mobile: customerData.mobile,
    });
  }, [customerData]);

  /* --- Component functions --- */

  const fetchData = async () => {
    try {
      setIsLoading({
        ...isLoading,
        init: true,
      });

      const response = await api.get(`sales-returns`);

      setTags(response.data.tags);
      setStores(response.data.stores);
      setNewData({
        ...newData,
        ddate: response.data.ddate,
        newDate: response.data.ddate,
        id: response.data.new_id,
        newId: response.data.new_id,

        gold_rate: '',
        store_id: '',
        customer_id: '',
        nicno: '',
        cusname: '',
        address: '',
        mobile: '',

        memo: '',
        employee_id: response.data.employees.id,
        employee_name: response.data.employees.name,

        tot_qty: 0,
        tot_weight: 0,
        tot_st_weight: 0,
        tot_price: 0,

        discount: 0,
        net_amount: 0,

        details: [],
      });

      // if (response.data.employees) {
      //   setEmployees(response.data.employees);
      // }

      clearItemRow();

      clearPayments();

      setIsLoading({
        ...isLoading,
        init: false,
      });
    } catch (error) {
      return msg.error('Unable to fetch data!');
    }
  };

  const updateCustomerData = (
    bc,
    customerId,
    customerNo,
    cusName,
    nicNo,
    address,
    telNo,
    mobile,
    notes,
    isBlacklisted,
  ) => {
    setCustomerData({
      branch_code: bc,
      customer_id: customerId,
      customer_no: customerNo,
      cusname: cusName,
      nicno: nicNo,
      address: address,
      telNo: telNo,
      mobile: mobile,
      notes: notes,
      is_blacklisted: isBlacklisted,
    });
  };

  const getCustomer = async (e) => {
    if (e.key === 'Enter') {
      try {
        const response = await api
          .post(`get_customer_by_nic`)
          .values({ nic: newData.nicno });

        if (response.data.customer === null) {
          msg.warning(
            'There is no customer exist for entered NIC. Please check the NIC or create new by clicking Add button.',
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
        }
      } catch (error) {
        return msg.error('Unable to get customer details.');
      }
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

  const handleItemsChange = async (e) => {
    const targetInput = e.target;
    const datasetId = targetInput.dataset.id;
    const inputName = targetInput.name;
    const inputValue = targetInput.value;
    const setOfItems = [...newData.details];

    const validated = await validateControlValues(inputName, inputValue);

    if (validated) {
      setOfItems[datasetId][inputName] = inputValue;

      setNewData({
        ...newData,
        details: setOfItems,
      });
    }
  };

  const handleSubmit = async () => {
    if (checkBeforeSave()) {
      await save();
    }
  };

  const save = async () => {
    try {
      const response = await api.post('sales-returns').values({
        formdata: newData,
      });

      if (parseInt(response.data) > 0) {
        printReceipt(response.data, false);
        // resetAll();
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

    if (newData.store_id === '') {
      msg.warning('Select store before save the invoice.');
      return false;
    }

    if (parseFloat(newData.net_amount) <= 0) {
      msg.warning(
        'This invoice value zero. Check the items and the value added to invoice.',
      );
      return false;
    }

    if (newData.employee_id === '' || newData.employee_name === '') {
      msg.warning('Select a salesman before save the invoice.');
      return false;
    }

    return true;
  };

  const loadItemDetails = (e) => {
    if (e.key === 'Enter') {
      let tag_item = tags.find((tag) => {
        return tag.tag_no === itemRow.tag_no;
      });

      if (tag_item) {
        setItemRow({
          ...itemRow,
          item_id: tag_item.item_id,
          item_name: tag_item.item_name,
          weight: tag_item.weight,
          st_weight: tag_item.weight_stome,
          cost: tag_item.cost,
          price: tag_item.max_price,
          agree_rate: 0,
        });
      } else {
        clearItemRow();
      }
    }
  };

  const addNewItem = () => {
    if (checkBeforeAddItem() === false) return;
    setNewData({
      ...newData,
      details: [...newData.details, itemRow],
    });

    clearItemRow();
  };

  const clearItemRow = () => {
    setItemRow({
      index: uuidv4(),
      tag_no: '',
      item_id: '',
      item_name: '',
      weight: 0,
      st_weight: 0,
      cost: 0,
      price: 0,
      agree_rate: 0,
    });
  };

  const clearPayments = () => {
    setPaymentData({
      type: 'Invoice',
      invoice_amount: 0,
      cash_amount: 0,
      card_amount: 0,
      old_gold_amount: 0,
      return_amount: 0,
      credit_amount: 0,
    });
  };

  const checkBeforeAddItem = () => {
    if (itemRow.tag_no === '') {
      msg.warning('Enter Tag No.');
      return false;
    }
    if (itemRow.item_name === '') {
      msg.warning('Enter Tag No and load Item details.');
      return false;
    }
    if (itemRow.weight === '' || itemRow.weight === 0) {
      msg.warning('Enter Tag No and load Item details.');
      return false;
    }
    if (itemRow.st_weight === '' || itemRow.st_weight === 0) {
      msg.warning('Enter Tag No and load Item details.');
      return false;
    }
    if (itemRow.price === '' || itemRow.price === 0) {
      msg.warning('Enter Tag No and load Item details.');
      return false;
    }
    if (itemRow.agree_rate === '' || itemRow.agree_rate === 0) {
      msg.warning('Enter valid Agree Rate.');
      return false;
    }

    return true;
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
    let tot_qty = 0;
    let tot_weight = 0;
    let tot_st_weight = 0;
    let tot_price = 0;
    let tot_amount = 0;

    newData.details.forEach((row) => {
      tot_qty++;
      tot_weight += parseFloat(row.weight);
      tot_st_weight += parseFloat(row.st_weight);
      tot_price += parseFloat(row.price);
      tot_amount += parseFloat(row.agree_rate);
    });

    setNewData({
      ...newData,
      tot_qty: tot_qty,
      tot_weight: tot_weight,
      tot_st_weight: tot_st_weight,
      tot_price: tot_price.toFixed(2),
      net_amount: tot_amount.toFixed(2),
    });

    setPaymentData({
      ...paymentData,
      invoice_amount: tot_amount.toFixed(2),
    });
  };

  const loadInvoice = async (e) => {
    if (e.key === 'Enter') {
      const response = await api
        .post('sales-invoices/get-details-for-return')
        .values({ invoice_id: newData.invoice_id, bc_no: newData.bc_no });

      const invoice = response.data.invoice;
      if (invoice === null) {
        msg.warning('Invalid invoice number.');
        return;
      }
      if (response.data.det === null) {
        msg.warning('This invoice already returned.');
        return;
      }

      let details = [];
      invoice.details.map((item) => {
        if (item.is_returned === 0) {
          details.push({
            index: uuidv4(),
            tag_id: item.tag.id,
            tag_no: item.tag_no,
            item_id: item.tag.item_id,
            item_name: item.tag.item_name,
            weight: item.weight,
            st_weight: item.st_weight,
            cost: item.tag.cost,
            price: item.price,
            agree_rate: item.agree_rate,
          });
        }
      });

      setNewData({
        ...newData,
        order_type: invoice.order_type,
        // ddate: invoice.ddate,
        customer_id: invoice.customer_id,
        nicno: invoice.customer.nicno,
        cusname: invoice.customer.cusname,
        address: invoice.customer.address,
        mobile: invoice.customer.mobile,

        employee_id: invoice.employee_id,
        employee_name: invoice.salesman.name,

        tot_qty: invoice.tot_qty,
        tot_weight: invoice.tot_weight,
        tot_st_weight: invoice.tot_st_weight,
        net_amount: invoice.tot_amount,

        details: details,
      });

      setControlsReadOnly({
        ...controlsReadOnly,
        invoice_id: true,
      });
    }
  };

  const resetAll = () => {
    setIsLoading({
      init: false,
    });

    setIsEdit(false);

    setNewData({
      user_id: cookie.get('user_id'),
      bc_no: cookie.get('user_branch'),

      ddate: newData.newDate,
      id: newData.newId,
      gold_rate: '',
      store_id: '',
      invoice_id: '',

      customer_id: '',
      nicno: '',
      cusname: '',
      address: '',
      mobile: '',

      memo: '',
      employee_id: '',
      employee_name: '',

      tot_qty: 0,
      tot_weight: 0,
      tot_st_weight: 0,
      tot_price: 0,
      net_amount: 0,

      discount: 0,

      details: [],
    });

    clearItemRow();

    clearPayments();
  };

  const showCustomerForm = () => {
    setViewCustomerForm(!viewCustomerForm);
  };

  const showPaymentForm = () => {
    setViewPaymentForm(!viewPaymentForm);
  };

  const printReceipt = async (invoice_no, is_dupplicate) => {
    const result = await SalesReturnNote.load(
      invoice_no,
      cookie.get('user_branch'),
      is_dupplicate,
    );

    if (result === false) msg.warning('Invalid Sales Return No..');
  };

  /* --- End of component functions --- */

  /* --- Component renders --- */

  return (
    <div>
      {/* <form
      onSubmit={handleSubmit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.preventDefault();
      }}
    > */}
      <CustomerForm
        toggleFormModal={showCustomerForm}
        showModalState={viewCustomerForm}
        customerData={customerData}
        updateCustomerData={updateCustomerData}
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
              <div className="col-sm-9 pl-0">
                <div className=" row ">
                  <label htmlFor="nicno" className="col-sm-1 col-form-label ">
                    Customer
                </label>
                  <div className="col-sm-3">
                    <input
                      type="text"
                      className="form-control form-control-sm "
                      id="nicno"
                      name="nicno"
                      value={newData.nicno}
                      readOnly={controlsReadOnly.customer_nic}
                      onChange={handleValueChanges}
                      onKeyDown={getCustomer}
                      placeholder="NIC"
                    />
                  </div>
                  <div className="col-sm-6 pl-0">
                    <input
                      type="text"
                      id="cusname"
                      name="cusname"
                      className="form-control form-control-sm "
                      maxLength="100"
                      value={newData.cusname}
                      // onChange={handleValueChanges}
                      placeholder="Customer Name"
                      readOnly
                    />
                  </div>

                  {/* <div className="col-sm-2">
                  <SystemButton
                    type="add-new"
                    method={showCustomerForm}
                    showText
                    btnText="Add"
                  />
                </div> */}
                </div>

                <div className=" row ">
                  <label htmlFor="notes" className="col-sm-1 col-form-label ">
                    Mobile
                </label>
                  <div className="col-sm-3 ">
                    <input
                      name="mobile"
                      id="mobile"
                      className="form-control form-control-sm "
                      maxLength="10"
                      value={newData.mobile}
                      readOnly
                    // onChange={handleValueChanges}
                    />
                  </div>
                  {/* <label
                  htmlFor="notes"
                  className="col-sm-1 col-form-label text-right px-0"
                >
                  Address
                </label> */}
                  <div className="col-sm-6 pl-0">
                    <input
                      name="address"
                      id="address"
                      className="form-control form-control-sm "
                      maxLength="200"
                      value={newData.address}
                      readOnly
                      // onChange={handleValueChanges}
                      placeholder="Customer Address"
                    />
                  </div>
                </div>

                <div className="row">
                  <label htmlFor="gold_rate" className="col-sm-1 col-form-label">
                    Stores
                </label>
                  <div className="col-sm-3 ">
                    <select
                      id="store_id"
                      name="store_id"
                      className="form-control form-control-sm"
                      required
                      onChange={handleValueChanges}
                      value={newData.store_id}
                    >
                      <option value="">---</option>
                      {stores.map((store) => {
                        return (
                          <option key={store.id} value={store.id}>
                            {store.description}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <label
                    htmlFor="invoice_id"
                    className="col-sm-3 col-form-label text-right"
                  >
                    Invoice No.
                </label>
                  <div className="col-sm-3">
                    <input
                      type="text"
                      className="form-control form-control-sm  text-right"
                      id="invoice_id"
                      name="invoice_id"
                      readOnly={controlsReadOnly.invoice_id}
                      value={newData.invoice_id}
                      onChange={handleValueChanges}
                      onKeyDown={loadInvoice}
                    />
                  </div>
                </div>
              </div>

              <div className="col-sm-3 border-left border-white ">
                <div className=" row ">
                  <label htmlFor="ddate" className="col-sm-4 col-form-label ">
                    Date
                </label>
                  <div className="col-sm-8">
                    <input
                      type="date"
                      className="form-control form-control-sm "
                      id="ddate"
                      name="ddate"
                      value={newData.ddate}
                      onChange={handleValueChanges}
                    />
                  </div>
                </div>

                <div className=" row ">
                  <label htmlFor="id" className="col-sm-4 col-form-label ">
                    No.
                </label>
                  <div className="col-sm-8">
                    <input
                      type="text"
                      className="form-control form-control-sm  text-right"
                      id="id"
                      name="id"
                      value={newData.id}
                      readOnly
                    />
                  </div>
                </div>

                {/* <div className="form-group row mb-0">
                <label
                  htmlFor="gold_rate"
                  className="col-sm-4 col-form-label px-0"
                >
                  Sales Order
                </label>
                <div className="col-sm-8">
                  <input
                    type="text"
                    id="gold_rate"
                    name="gold_rate"
                    className="form-control form-control-sm "
                  />
                </div>                
              </div> */}
              </div>
            </div>
            <hr className="border-white" />
            <div className="row">
              <div className="table-responsive header-fixed-scrollable">
                <table className="table table-bordered table-sm table-hover">
                  <thead className="thead-dark text-center">
                    <tr>
                      <td width="5%">#</td>
                      <td width="12%">Tag No.</td>
                      <td width="40%">Description</td>
                      <td width="10%">Weight (g)</td>
                      <td width="10%">St Weight (g)</td>
                      <td width="10%">Price (LKR)</td>
                      <td width="10%">Agree Rate (LKR)</td>
                      <td width="3%"></td>
                    </tr>
                    {/* <tr>
                    <td></td>
                    <td>
                      <input
                        type="text"
                        name="tag_no"
                        id="tag_no"
                        className="form-control form-control-sm "
                        value={itemRow.tag_no}
                        onChange={handleItemRowChanges}
                        onKeyDown={loadItemDetails}
                        placeholder="Tag No."
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="description"
                        id="description"
                        className="form-control form-control-sm "
                        value={itemRow.item_name}
                        onChange={handleItemRowChanges}
                        placeholder="Description"
                        readOnly
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="weight"
                        id="weight"
                        step="any"
                        max="10000"
                        className="form-control form-control-sm  text-right"
                        value={itemRow.weight}
                        onChange={handleItemRowChanges}
                        placeholder="Weight"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="st_weight"
                        id="st_weight"
                        step="any"
                        max="10000"
                        className="form-control form-control-sm  text-right"
                        value={itemRow.st_weight}
                        onChange={handleItemRowChanges}
                        placeholder="ST Weight"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="price"
                        id="price"
                        max="9999999"
                        step="any"
                        className="form-control form-control-sm  text-right"
                        value={itemRow.price}
                        onChange={handleItemRowChanges}
                        placeholder="Price (LKR)"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="agree_rate"
                        id="agree_rate"
                        max="9999999"
                        step="any"
                        maxLength="7"
                        className="form-control form-control-sm  text-right"
                        value={itemRow.agree_rate}
                        onFocus={(e) => e.target.select()}
                        onChange={handleItemRowChanges}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            addNewItem();
                          }
                        }}
                        placeholder="Agree Rate (LKR)"
                      />
                    </td>
                    <td>
                      <SystemButton
                        type={'add-row'}
                        method={() => addNewItem()}
                        showText={false}
                      />
                    </td>
                  </tr> */}
                  </thead>
                  <tbody>
                    {newData.details.map((item, index) => {
                      return (
                        <tr key={item.index}>
                          <th scope="row">{parseInt(index) + 1}</th>
                          <td>
                            <input
                              type="text"
                              name="tag_no"
                              id="tag_no"
                              data-id={index}
                              className="form-control-plaintext form-control-sm "
                              value={newData.details[index].tag_no}
                              readOnly
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              name="item_name"
                              id="item_name"
                              data-id={index}
                              className="form-control form-control-sm "
                              value={newData.details[index].item_name}
                              onChange={handleItemsChange}
                              readOnly
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              name="weight"
                              id="weight"
                              step="0.01"
                              data-id={index}
                              className="form-control form-control-sm  text-right"
                              value={newData.details[index].weight}
                              onChange={handleItemsChange}
                              placeholder="Weight"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              name="st_weight"
                              id="st_weight"
                              step="0.01"
                              data-id={index}
                              className="form-control form-control-sm  text-right"
                              value={newData.details[index].st_weight}
                              onChange={handleItemsChange}
                              placeholder="ST Weight"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              name="price"
                              id="price"
                              data-id={index}
                              className="form-control form-control-sm  text-right"
                              value={newData.details[index].price}
                              onChange={handleItemsChange}
                              placeholder="Price (LKR)"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              name="agree_rate"
                              id="agree_rate"
                              data-id={index}
                              className="form-control form-control-sm  text-right"
                              value={newData.details[index].agree_rate}
                              onChange={handleItemsChange}
                              placeholder="Agree Rate (LKR)"
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
                      <th className="text-center" colSpan="3">
                        Totals
                    </th>
                      <td>
                        <input
                          type="text"
                          className="form-control-plaintext text-right kinda-important-text-3"
                          id="tot_weight"
                          name="tot_weight"
                          value={newData.tot_weight}
                          readOnly
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control-plaintext text-right kinda-important-text-3"
                          id="tot_st_weight"
                          name="tot_st_weight"
                          value={newData.tot_st_weight}
                          readOnly
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control-plaintext text-right kinda-important-text-3"
                          id="tot_price"
                          name="tot_price"
                          value={newData.tot_price}
                          readOnly
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control-plaintext text-right kinda-important-text-3"
                          id="net_amount"
                          name="net_amount"
                          value={newData.net_amount}
                          readOnly
                        />
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            <div className="row ">
              <div className="col-sm-6">
                <div className="form-group row mb-0">
                  <label htmlFor="notes" className="col-sm-2 col-form-label pr-0">
                    Memo
                </label>
                  <div className="col-sm-8 ">
                    <textarea
                      name="memo"
                      id="memo"
                      rows="1"
                      maxLength="100"
                      className="form-control form-control-sm "
                      value={newData.memo}
                      onChange={handleValueChanges}
                    ></textarea>
                  </div>
                </div>
                <div className="form-group row mb-0 mt-2">
                  <label htmlFor="supplier" className="col-sm-2 col-form-label">
                    Salesman
                </label>
                  <div className="col-sm-8">
                    <input
                      type="text"
                      className="form-control form-control-sm "
                      id="supplier"
                      name="supplier"
                      value={newData.employee_name}
                      onChange={handleValueChanges}
                      placeholder="Employee"
                      autoComplete="no"
                      readOnly
                    />
                    {/* <SDD
                    method={officerSelect}
                    data={employees}
                    value="name"
                    rowId="id"
                    classes="form-control form-control-sm "
                    placeholder="Salesman"
                    listId="employees"
                    selected={newData.employee_name}
                  /> */}
                  </div>
                </div>
              </div>
            </div>
            <hr className="border-white" />
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
            <hr className="border-white" />
          </div>
        )}
    </div>
  );

  /* --- End of component renders --- */
};

export default Invoice;
