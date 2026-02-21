import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import {
  ListSelection,
  Loader,
  SDD,
  SystemButton,
  UnderDevelopment,
} from '../../../components';
import { api, cookie, msg } from '../../../services';
import CustomerForm from '../../master/customers/CustomerForm';
import PaymentModel from '../PaymentModel';

import PRNPrint from '../../../printouts/PRNPrintA4Half';


const PurchaseReturn = () => {
  // Module name
  const moduleName = 'Purchase Return';

  /* --- State declarationss --- */

  const [isLoading, setIsLoading] = useState({
    init: false,
  });

  const [isEdit, setIsEdit] = useState(false);

  const [newData, setNewData] = useState({
    user_id: cookie.get('user_id'),
    bc_no: cookie.get('user_branch'),

    ddate: '',
    new_ddate: '',
    nno: '',
    new_nno: '',
    purchase_nno: '',
    vendor_id: '',
    vendor_name: '',

    store_id: '',
    store_name: '',

    total_qty: 0,
    total_weight: 0,
    total_stone_weight: 0,
    total_amount: 0,
    discount: 0,
    net_amount: 0,
    officer_id: '',
    officer_name: '',
    memo: '',
    is_approved: false,
    approved_by: cookie.get('user_id'),
    approved_on: '',
    is_cancelled: false,
    user_id: cookie.get('user_id'),
    details: [],
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
  const [vendors, setVendors] = useState([]);
  const [tags, setTags] = useState([]);
  const [viewCustomerForm, setViewCustomerForm] = useState(false);
  const [viewPaymentForm, setViewPaymentForm] = useState(false);

  /* --- End of state declarations --- */

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
        vendor_name: dataObj.name,
      });
    } else if (listType === 'officer') {
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
    }
  };

  const setColulmns = () => {
    if (listType === 'vendor') {
      return vendorColumns;
    } else if (listType === 'officer') {
      return officerColumns;
    } else if (listType === 'stores') {
      return storeColumns;
    } else {
      return null;
    }
  };

  const vendorColumns = [
    { title: 'Code', name: 'code', searchable: true },
    { title: 'Name', name: 'name', searchable: true },
  ];
  const officerColumns = [
    { title: 'Code', name: 'id', searchable: true },
    { title: 'Name', name: 'name', searchable: true },
  ];
  const storeColumns = [
    { title: 'Code', name: 'code', searchable: true },
    { title: 'Description', name: 'description', searchable: true },
  ];

  const setListData = () => {
    if (listType === 'vendor') {
      return vendors;
    } else if (listType === 'officer') {
      return employees;
    } else if (listType === 'stores') {
      return stores;
    } else {
      return null;
    }
  };

  /* ---  End of List Selection Required ---- */

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    calColumnTotals();
  }, [newData.details]);

  /* --- Component functions --- */

  const fetchData = async () => {
    try {
      // setIsLoading({
      //   ...isLoading,
      //   init: true,
      // });

      const response = await api.get(`purchase-returns`);

      setStores(response.data.stores);
      setVendors(response.data.vendors);
      setEmployees(response.data.officers);
      setNewData({
        ...newData,
        id: '',
        bc_no: cookie.get('user_branch'),
        ddate: moment(response.data.new_date).format('YYYY-MM-DD'),
        new_ddate: moment(response.data.new_date).format('YYYY-MM-DD'),
        nno: response.data.new_id,
        new_nno: response.data.new_id,
        purchase_nno: '',
        vendor_id: '',
        vendor_name: '',
        vendor_invoice_no: '',
        store_id: '',
        store_name: '',
        gold_rate: '',
        total_qty: 0,
        total_weight: 0,
        total_stone_weight: 0,
        total_amount: 0,
        discount: 0,
        net_amount: 0,
        officer_id: '',
        officer_name: '',
        memo: '',
        is_approved: '',
        approved_by: cookie.get('user_id'),
        approved_on: '',
        is_cancelled: '',
        user_id: cookie.get('user_id'),
        details: [],
      });

      clearItemRow();

      // setIsLoading({
      //   ...isLoading,
      //   init: false,
      // });
    } catch (error) {
      console.log(error);
      //debugger;
      return msg.error('Unable to fetch data!');
    }
  };

  const loadPurchase = async () => {
    const response = await api
      .post(`purchases/get-for-prn`)
      .values({ nno: newData.purchase_nno, bc_no: newData.bc_no });
    // `purchases/${newData.purchase_nno}/${newData.bc_no}`,

    const details = response.data.details.map((item) => {
      return {
        ...item,
        index: uuidv4(),
        bal_qty:
          parseInt(item.qty) -
          (parseInt(item.tag_qty) + parseInt(item.return_qty)),
        bal_weight:
          parseFloat(item.weight) -
          (parseFloat(item.tag_weight) + parseFloat(item.return_weight)),
        bal_stone_weight:
          parseFloat(item.stone_weight) -
          (parseFloat(item.tag_stone_weight) +
            parseFloat(item.return_stone_weight)),
        ret_qty: 0,
        ret_weight: 0,
        ret_st_weight: 0,
      };
    });

    setNewData({
      ...response.data,
      nno: newData.new_nno,
      ddate: newData.new_ddate,
      new_nno: newData.new_nno,
      new_ddate: newData.new_ddate,
      purchase_nno: response.data.nno,
      vendor_name: response.data.vendor.name,
      officer_name: response.data.officer.name,
      store_name: response.data.store.description,
      total_amount: 0,
      discount: 0,
      net_amount: 0,
      total_weight: 0,
      total_stone_weight: 0,
      details: details,
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
      officer_id: selectedObj.id,
      officer_name: selectedObj.name,
    });
  };

  const storeSelect = (selectedObj) => {
    setNewData({
      ...newData,
      store_id: selectedObj.id,
      store_name: selectedObj.description,
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
    let inputValue = targetInput.value;
    const setOfItems = [...newData.details];

    const validated = await validateControlValues(inputName, inputValue);

    if (inputName === 'ret_qty') {
      if (parseInt(setOfItems[datasetId]['bal_qty']) < parseInt(inputValue)) {
        msg.warning('Cannot return more than balance quantity.');
        inputValue = 0;
      }
    }
    if (inputName === 'ret_weight') {
      if (parseFloat(setOfItems[datasetId]['bal_weight']) < parseFloat(inputValue)) {
        msg.warning('Cannot return more than balance weight.');
        inputValue = 0;
      }
    }
    if (inputName === 'ret_st_weight') {
      if (parseFloat(setOfItems[datasetId]['bal_stone_weight']) < parseFloat(inputValue)) {
        msg.warning('Cannot return more than balance stone weight.');
        inputValue = 0;
      }
    }

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
      const response = await api.post('purchase-returns').values(newData);

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
    if (newData.store_id === '') {
      msg.warning('Select store before save the invoice.');
      return false;
    }

    if (parseFloat(newData.tot_amount) <= 0) {
      msg.warning(
        'This invoice value zero. Check the items and the value added to invoice.',
      );
      return false;
    }

    if (newData.officer_id === '' || newData.officer_name === '') {
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
    let bal_tot_qty = 0;
    let bal_tot_weight = 0;
    let bal_tot_st_weight = 0;
    let bal_tot_amount = 0;

    let tot_qty = 0;
    let tot_weight = 0;
    let tot_st_weight = 0;
    let tot_price = 0;
    let tot_amount = 0;

    newData.details.forEach((row) => {
      bal_tot_qty += parseInt(row.bal_qty);
      bal_tot_weight += parseFloat(row.bal_weight);
      bal_tot_st_weight += parseFloat(row.bal_stone_weight);
      bal_tot_amount += parseFloat(row.cost) * parseInt(row.bal_qty);

      tot_qty += parseInt(row.ret_qty);
      tot_weight += parseFloat(row.ret_weight);
      tot_st_weight += parseFloat(row.ret_st_weight);
      tot_amount += parseFloat(row.cost) * parseInt(row.ret_qty);
    });

    setNewData({
      ...newData,
      bal_tot_qty: bal_tot_qty,
      bal_tot_weight: bal_tot_weight,
      bal_tot_st_weight: bal_tot_st_weight,
      bal_tot_amount: bal_tot_amount.toFixed(2),

      total_qty: tot_qty,
      total_weight: tot_weight,
      total_stone_weight: tot_st_weight,

      total_amount: tot_amount.toFixed(2),
      net_amount: tot_amount.toFixed(2),
    });
  };

  const calculateTotals = () => {
    let tot_qty = 0;
    let tot_weight = 0;
    let tot_st_weight = 0;
    let tot_price = 0;
    let tot_amount = 0;

    newData.details.forEach((row) => {
      tot_qty += parseInt(row.ret_qty);
      tot_weight += parseFloat(row.ret_weight);
      tot_st_weight += parseFloat(row.ret_st_weight);
      tot_amount += parseFloat(row.cost) * parseInt(row.ret_qty);
    });

    setNewData({
      ...newData,
      total_qty: tot_qty,
      total_weight: tot_weight,
      total_stone_weight: tot_st_weight,

      total_amount: tot_amount.toFixed(2),
      net_amount: tot_amount.toFixed(2),
    });
  };

  const resetAll = () => {
    setIsLoading({
      init: false,
    });

    setIsEdit(false);

    setNewData({
      bc_no: cookie.get('user_branch'),
      ddate: moment(newData.new_ddate).format('YYYY-MM-DD'),
      new_ddate: moment(newData.new_ddate).format('YYYY-MM-DD'),
      nno: newData.new_nno,
      new_nno: newData.new_nno,
      purchase_nno: '',
      vendor_id: '',
      vendor_name: '',
      vendor_invoice_no: '',
      store_id: '',
      store_name: '',
      gold_rate: '',
      total_qty: 0,
      total_weight: 0,
      total_stone_weight: 0,
      total_amount: 0,
      discount: 0,
      net_amount: 0,
      officer_id: '',
      officer_name: '',
      memo: '',
      is_approved: '',
      approved_by: cookie.get('user_id'),
      approved_on: '',
      is_cancelled: '',
      user_id: cookie.get('user_id'),
      details: [],
    });

    clearItemRow();
  };

  const printReceipt = async (invoice_no, is_dupplicate) => {
    const result = await PRNPrint.load(
      invoice_no,
      cookie.get('user_branch'),
      is_dupplicate,
    );

    if (result === false) msg.warning('Invalid invoice no..');
  };

  /* --- End of component functions --- */

  /* --- Component renders --- */

  return process.env.NODE_ENV === 'production' ? (
    <UnderDevelopment />
  ) : (
    <div>
      <ListSelection
        toggleFormModal={showListSelection}
        showModalState={viewListSelection}
        entities={setListData}
        dataColumns={setColulmns}
        selectRow={selectRow}
      />
      {/* <form
      onSubmit={handleSubmit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.preventDefault();
      }}
    > */}
      <h5 className="text-center">{moduleName}</h5>
      <br />
      {isLoading.init ? (
        <Loader />
      ) : (
        <div>
          <div className="row mb-3">
            <div className="col-sm-9">
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
                <div className="col-sm-5 mx-0 pl-0">
                  <SDD
                    method={supplierSelect}
                    data={vendors}
                    value="description"
                    rowId="code"
                    classes="form-control form-control-sm"
                    placeholder="Type hear for search"
                    listId="vendors"
                    selected={newData.vendor_name}
                  />
                </div>

                {/* <div className="col-sm-3 mx-0">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    id="vendor_invoice_no"
                    name="vendor_invoice_no"
                    value={newData.vendor_invoice_no}
                    onChange={handleValueChanges}
                    placeholder="Supplier Invoice #"
                  />
                </div> */}
              </div>
              <div className="form-group row mb-0">
                <label htmlFor="supplier" className="col-sm-2 col-form-label">
                  Store
                </label>
                <div className="col-sm-2 mx-0 pr-0">
                  <input
                    type="text"
                    id="store_id"
                    name="store_id"
                    className="form-control form-control-sm bg-white"
                    readOnly
                    value={newData.store_id}
                    onChange={handleValueChanges}
                    placeholder="Press <F2>"
                    onKeyDown={(event) => {
                      if (event.key === 'F2') {
                        setListType('stores');
                        showListSelection();
                      }
                    }}
                  />
                </div>
                <div className="col-sm-5 mx-0 pl-0">
                  <SDD
                    method={storeSelect}
                    data={stores}
                    value="description"
                    rowId="id"
                    classes="form-control form-control-sm"
                    placeholder="Type hear for search"
                    listId="stores"
                    selected={newData.store_name}
                  />
                </div>
              </div>
              <div className="form-group row mb-0">
                <label htmlFor="supplier" className="col-sm-2 col-form-label">
                  Purchase No.
                </label>
                <div className="col-sm-2 mx-0 pr-0">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    id="purchase_nno"
                    name="purchase_nno"
                    value={newData.purchase_nno}
                    onChange={handleValueChanges}
                    onFocus={(e) => e.target.select()}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        loadPurchase();
                      }
                    }}
                    placeholder="Purchase No."
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
                <label htmlFor="nno" className="col-sm-4 col-form-label ">
                  No.
                </label>
                <div className="col-sm-8">
                  <input
                    type="text"
                    className="form-control form-control-sm  text-right"
                    id="nno"
                    name="nno"
                    value={newData.nno}
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
                    <td width="3%" rowSpan="2">
                      #
                    </td>
                    <td width="19%">Item</td>
                    <td width="10%">Balance Qty</td>
                    <td width="10%">Balance Weight</td>
                    <td width="10%">Balance St. Weight</td>
                    <td width="10%">Ret. Qty</td>
                    <td width="10%">Ret. Weight</td>
                    <td width="10%">Ret. St. Weight</td>
                    <td width="15%">Cost (LKR)</td>
                    <td width="3%"></td>
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
                            name="item_name"
                            id="item_name"
                            data-id={index}
                            className="form-control-plaintext form-control-sm"
                            value={newData.details[index].item.itemname}
                            readOnly
                          />
                        </td>

                        <td>
                          <input
                            type="number"
                            name="bal_qty"
                            id="bal_qty"
                            step="1"
                            data-id={index}
                            className="form-control-plaintext form-control-sm text-right"
                            value={newData.details[index].bal_qty}
                            readOnly
                            placeholder="Quantity"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            name="bal_weight"
                            id="bal_weight"
                            step="0.01"
                            data-id={index}
                            className="form-control-plaintext form-control-sm text-right"
                            value={newData.details[index].bal_weight}
                            readOnly
                            placeholder="Weight"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            name="bal_stone_weight"
                            id="bal_stone_weight"
                            step="0.01"
                            data-id={index}
                            className="form-control-plaintext form-control-sm text-right"
                            value={newData.details[index].bal_stone_weight}
                            readOnly
                            placeholder="ST Weight"
                          />
                        </td>

                        <td>
                          <input
                            type="number"
                            name="ret_qty"
                            id="ret_qty"
                            step="1"
                            data-id={index}
                            className="form-control form-control-sm text-right"
                            value={newData.details[index].ret_qty}
                            onChange={handleItemsChange}
                            onFocus={(e) => e.target.select()}
                            placeholder="Quantity"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            name="ret_weight"
                            id="ret_weight"
                            step="0.01"
                            data-id={index}
                            className="form-control form-control-sm text-right"
                            value={newData.details[index].ret_weight}
                            onChange={handleItemsChange}
                            onFocus={(e) => e.target.select()}
                            placeholder="Weight"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            name="ret_st_weight"
                            id="ret_st_weight"
                            step="0.01"
                            data-id={index}
                            className="form-control form-control-sm text-right"
                            value={newData.details[index].ret_st_weight}
                            onChange={handleItemsChange}
                            onFocus={(e) => e.target.select()}
                            placeholder="ST Weight"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            name="cost"
                            id="cost"
                            data-id={index}
                            className="form-control-plaintext form-control-sm text-right"
                            value={newData.details[index].cost}
                            readOnly
                            placeholder="Cost (LKR)"
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
                    <th className="text-center" colSpan="5">
                      Totals
                    </th>
                    {/*  <td>
                      <input
                        type="text"
                        className="form-control-plaintext text-right kinda-important-text-3"
                        id="total_qty"
                        name="total_qty"
                        value={newData.total_qty}
                        readOnly
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control-plaintext text-right kinda-important-text-3"
                        id="total_weight"
                        name="total_weight"
                        value={newData.total_weight}
                        readOnly
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control-plaintext text-right kinda-important-text-3"
                        id="total_stone_weight"
                        name="total_stone_weight"
                        value={newData.total_stone_weight}
                        readOnly
                      />
                    </td> */}

                    <td>
                      <input
                        type="text"
                        className="form-control-plaintext text-right kinda-important-text-3"
                        id="total_qty"
                        name="total_qty"
                        value={newData.total_qty}
                        readOnly
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control-plaintext text-right kinda-important-text-3"
                        id="total_weight"
                        name="total_weight"
                        value={newData.total_weight}
                        readOnly
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control-plaintext text-right kinda-important-text-3"
                        id="total_stone_weight"
                        name="total_stone_weight"
                        value={newData.total_stone_weight}
                        readOnly
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control-plaintext text-right kinda-important-text-3"
                        id="total_amount"
                        name="total_amount"
                        value={newData.total_amount}
                        readOnly
                      />
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          <div className="row">
            <div className="col-sm-9">
              <div className="form-group row mb-0">
                <label htmlFor="notes" className="col-sm-2 col-form-label mx-0">
                  Memo
                </label>
                <div className="col-sm-7 mx-0">
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
              <div className="form-group row mb-0">
                <label className="col-sm-2 col-form-label mx-0 pr-0">
                  Officer
                </label>
                <div className="col-sm-4">
                  <SDD
                    method={officerSelect}
                    data={employees}
                    value="name"
                    rowId="id"
                    classes="form-control form-control-sm "
                    placeholder="Type hear for search"
                    listId="employees"
                    selected={newData.officer_name}
                  />
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
          </div>
          <hr className="border-white" />
        </div>
      )}
    </div>
  );

  /* --- End of component renders --- */
};

export default PurchaseReturn;
