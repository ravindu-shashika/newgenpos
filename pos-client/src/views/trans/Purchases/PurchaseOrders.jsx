import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import {
  Loader,
  SDD,
  SystemButton,
  ListSelection,
  FormModal,
} from '../../../components';
import { api, cookie, msg } from '../../../services';
import PurchaseOrderPrint from '../../../printouts/PurchaseOrderPrintA4Half';

const PurchaseOrders = () => {
  // Module name
  const moduleName = 'Purchase Orders';
  const moduleNameMore = 'More';

  /* --- State declarationss --- */

  const [isLoading, setIsLoading] = useState({
    init: false,
  });

  const [isEdit, setIsEdit] = useState(false);

  const [newData, setNewData] = useState({
    ddate: '',
    nno: '',
    newDdate: '',
    newNno: '',
    bc_no: cookie.get('user_branch'),
    gold_rate: '',
    vendor_id: '',
    vendor_name: '',
    memo: '',
    gross_amount: 0,
    discount: 0,
    net_amount: 0,
    officer_id: '',
    officer_name: '',
    is_approve: 0,
    is_cancel: 0,
    approve_by: '',
    approve_time: '',
    details: [],
    total_qty: 0,
    total_weight: 0,
    total_stone_weight: 0,
    total_amount: 0,
    user_id: cookie.get('user_id'),

    stone_details: [],

    gold_type: '',
    og_weight: 0,
    og_rate: 0,
    so_no: 0,
  });

  const [itemRow, setItemRow] = useState({
    index: uuidv4(),
    item_id: '',
    gold_type: '',
    design_id: '',
    item: {
      itemcode: '',
      itemname: '',
    },
    design: {
      designcode: '',
      designname: '',
    },
    stone_details: [],
    note: '',
    qty: 0,
    weight: 0,
    stone_weight: 0,
    cost: 0,
    metal_type: '',
    gender_type: '',
    color_type: '',
  });

  const [itemStoneRow, setItemStoneRow] = useState({
    stone_weight: 0.0,
    stone_type: '',
    stone_type_name: '',
  });

  const [showFields, setShowFields] = useState({
    showOldGoldDetails: true,
  });

  const [goldTypes, setGoldTypes] = useState([]);

  const [vendors, setVendors] = useState([]);

  const [officers, setOfficers] = useState([]);

  const [items, setItems] = useState([]);

  const [design, setDesign] = useState([]);

  const [metalTypes, setMetalTypes] = useState([]);

  const [colorTypes, setColorTypes] = useState([]);

  const [stoneTypes, setStoneTypes] = useState([]);

  const [genderTypes, setGenderTypes] = useState([]);

  const [isFromSO, setIsFromSO] = useState(false);

  const [showModalState, setShowModalState] = useState(false);

  /* --- End of state declarations --- */

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    calColumnTotals();
  }, [newData.details]);

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
    }
  };

  const setColulmns = () => {
    if (listType === 'vendor') {
      return vendorColumns;
    } else if (listType === 'officer') {
      return officerColumns;
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

  const setListData = () => {
    if (listType === 'vendor') {
      return vendors;
    } else if (listType === 'officer') {
      return officers;
    } else {
      return null;
    }
  };

  /* ---  End of List Selection Required ---- */

  /* --- Component functions --- */

  const fetchData = async () => {
    try {
      setIsLoading({
        ...isLoading,
        init: true,
      });

      const response = await api.get(`purchase-orders`);

      setVendors(response.data.vendors);

      setOfficers(response.data.officers);

      setItems(response.data.items);

      setDesign(response.data.designs);

      setGenderTypes(response.data.gender);

      setMetalTypes(response.data.metal);
      setColorTypes(response.data.color);
      setStoneTypes(response.data.stone);

      setNewData({
        ...newData,
        nno: response.data.new_id,
        ddate: moment(response.data.new_date).format('YYYY-MM-DD'),
        newDdate: moment(response.data.new_date).format('YYYY-MM-DD'),
        newNno: response.data.new_id,
        bc_no: cookie.get('user_branch'),
        user_id: cookie.get('user_id'),
        gold_rate: response.data.daily_gold_rate.rate,
        vendor_id: '',
        vendor_name: '',
        memo: '',
        gross_amount: 0,
        discount: 0,
        net_amount: 0,
        officer_id: response.data.officers.id,
        officer_name: response.data.officers.name,
        is_approve: 0,
        is_cancel: 0,
        approve_by: '',
        approve_time: '',
        details: [],
        total_qty: 0,
        total_weight: 0,
        total_stone_weight: 0,
        total_amount: 0,
        so_no: 0,

        stone_details: [],

        gold_type: '',
        og_weight: 0,
        og_rate: response.data.daily_gold_rate.rate,
      });

      setIsFromSO(false);

      getGoldTypes();

      setIsLoading({
        ...isLoading,
        init: false,
      });
    } catch (error) {
      return msg.error('Unable to fetch data!');
    }
  };

  const getGoldTypes = async () => {
    const response = await api.get(`get-gold-types`);

    if (response.data.gold_types) {
      setGoldTypes(response.data.gold_types);
    }
  };

  const edit = async () => {
    try {
      setIsLoading({
        ...isLoading,
        init: true,
      });

      const response = await api.get(
        `purchase-orders/${newData.nno}/${newData.bc_no}`,
      );

      let dataObj = response.data.po;
      dataObj.newDdate = newData.newDdate;
      dataObj.newNno = newData.newNno;

      const details = response.data.po.details.map((item) => {
        return { ...item, index: uuidv4() };
      });

      const st_details = response.data.po.details.map((st_item) => {
        return { ...st_item.stone_details, index: uuidv4() };
      });

      dataObj.details = details;
      dataObj.stone_details = [];
      dataObj.stone_details = st_details;

      setNewData(dataObj);

      setIsEdit(true);

      if (dataObj.so_no != 0) {
        setIsFromSO(true);
      } else {
        setIsFromSO(false);
      }

      setIsLoading({
        ...isLoading,
        init: false,
      });
    } catch (error) {
      console.log(error);
      return msg.error('Unable to fetch data!');
    }
  };

  const editWithSO = async () => {
    try {
      const response = await api.get(
        `purchase-orders-for-so/${newData.so_no}/${newData.bc_no}`,
      );

      if (response.data.exist) {
        setItemRow({
          ...itemRow,
          item: {
            itemname: '',
          },
          item_id: '',
          note: '',
        });

        msg.warning(`Already this SO have PO!`);
      } else {
        if (response.data.po) {
          const details = response.data.po.details.map((item) => {
            return { ...item, index: uuidv4() };
          });

          setNewData({
            ...response.data,
            details: details,
            ddate: newData.newDdate,
            bc_no: newData.bc_no,
            user_id: newData.user_id,
            gross_amount: newData.gross_amount,
            memo: newData.memo,
            discount: newData.discount,
            gold_rate: newData.gold_rate,
            net_amount: newData.net_amount,
            officer_id: newData.officer_id,
            officer_name: newData.officer_name,
            is_approve: newData.is_approve,
            is_cancel: newData.is_cancel,
            approve_by: newData.approve_by,
            approve_time: newData.approve_time,
            so_no: newData.so_no,

            gold_type: newData.gold_type,
            og_weight: newData.og_weight,
            og_rate: newData.og_rate,
          });
        } else {
          setItemRow({
            ...itemRow,
            item: {
              itemname: '',
            },
            item_id: '',
            note: '',
          });
          msg.warning(`No SO to this No!`);
        }
      }
    } catch (error) {
      return msg.error('Unable to fetch data!');
    }
  };

  const supplierSelect = (selectedObj) => {
    setNewData({
      ...newData,
      vendor_id: selectedObj.code,
      vendor_name: selectedObj.description,
    });
  };

  const officerSelect = (selectedObj) => {
    setNewData({
      ...newData,
      officer_id: selectedObj.cCode,
      officer_name: selectedObj.display_name,
    });
  };

  const itemSelect = (selectedObj) => {
    setItemRow({
      ...itemRow,
      item_id: selectedObj.itemcode,
      item: {
        itemcode: selectedObj.itemcode,
        itemname: selectedObj.itemname,
      },
    });
  };

  const designSelect = (selectedObj) => {
    setItemRow({
      ...itemRow,
      design_id: selectedObj.id,
      design: {
        designcode: '',
        designname: selectedObj.designname,
      },
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
    // const inputValue = targetInput.value;
    const inputValue =
      targetInput.type === 'checkbox' ? targetInput.checked : targetInput.value;

    console.log(inputName, inputValue);

    if (inputName === 'from_so') {
      if (inputValue) {
        setIsFromSO(true);
      } else {
        setIsFromSO(false);
      }
    }

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

    console.log(validated);

    if (validated) {
      setOfItems[datasetId][inputName] = inputValue;

      setNewData({
        ...newData,
        details: setOfItems,
      });
    }
  };

  const handleSubmit = async () => {
    await save();

    // resetAll();
  };

  const save = async () => {
    try {
      //  console.log(newData);
      //   return 0;
      const response = await api.post('purchase-orders').values(newData);

      if (parseInt(response.data) > 0) {
        printReceipt(parseInt(response.data), false);
        fetchData();
        msg.success('Saved Successfully.');
        resetAll();
      }
    } catch (err) {
      msg.error(err);
      return;
    }
  };

  const addNewItem = () => {
    console.log(itemRow);
    setNewData({
      ...newData,
      details: [...newData.details, itemRow],
    });

    toggleMoreModal();
    clearStoneNewData();

    setItemRow({
      index: uuidv4(),
      item_id: '',
      item: {
        itemcode: '',
        itemname: '',
      },
      design_id: '',
      design: {
        designcode: '',
        designname: '',
      },
      // gold_type:'',
      stone_details: [],
      note: '',
      qty: 0,
      weight: 0,
      stone_weight: 0,
      cost: 0,
      metal_type: '',
      gender_type: '',
      color_type: '',
    });
  };

  const clearStoneNewData = () => {
    setNewData((prev) => {
      return {
        ...prev,
        stone_details: [],
      };
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
    let total_qty = 0;
    let total_weight = 0;
    let total_stone_weight = 0;
    let total_amount = 0;

    newData.details.forEach((row) => {
      total_qty += parseFloat(row.qty);
      total_weight += parseFloat(row.weight);
      total_stone_weight += parseFloat(row.stone_weight);
      total_amount += parseFloat(row.cost);
    });

    setNewData({
      ...newData,
      total_qty: parseFloat(total_qty).toFixed(2),
      total_weight: parseFloat(total_weight).toFixed(3),
      total_stone_weight: parseFloat(total_stone_weight).toFixed(3),
      total_amount: parseFloat(total_amount).toFixed(2),
    });
  };

  const printReceipt = (trans_no, is_dupplicate) => {
    PurchaseOrderPrint.load(trans_no, cookie.get('user_branch'), is_dupplicate);
  };

  const resetAll = () => {
    setIsLoading({
      init: false,
    });

    setIsEdit(false);

    setNewData({
      ddate: newData.newDdate,
      nno: newData.newNno,
      bc_no: cookie.get('user_branch'),
      gold_rate: '',
      vendor_id: '',
      vendor_name: '',
      memo: '',
      gross_amount: 0,
      discount: 0,
      net_amount: 0,
      officer_id: '',
      officer_name: '',
      is_approve: 0,
      is_cancel: 0,
      user_id: cookie.get('user_id'),
      approve_by: '',
      approve_time: '',
      details: [],
      total_qty: 0,
      total_weight: 0,
      total_stone_weight: 0,
      total_amount: 0,
      stone_details: [],
    });

    setItemRow({
      index: uuidv4(),
      item_id: '',
      item: {
        itemcode: '',
        itemname: '',
      },
      note: '',
      qty: 0,
      weight: 0,
      stone_weight: 0,
      cost: 0,
      design_id: '',
      design: {
        designcode: '',
        designname: '',
      },
      metal_type: '',
      gold_type: '',
      gender_type: '',
      color_type: '',
    });
  };

  const toggleMoreModal = () => {
    setShowModalState(!showModalState);

    clearStoneItemRow();
    clearStoneNewData();
  };

  const stoneSelect = (selectedObj) => {
    console.log(selectedObj);
    setItemStoneRow({
      ...itemStoneRow,
      stone_type: selectedObj.id,
      stone_type_name: selectedObj.description,
    });
  };

  const handleStoneItemRowChanges = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue = targetInput.value;

    setItemStoneRow({
      ...itemStoneRow,
      [inputName]: inputValue,
    });
  };

  const addStoneItem = async (e) => {
    console.log(itemRow);

    const updatedStoneDetails = Array.isArray(itemRow.stone_details)
      ? [...itemRow.stone_details, itemStoneRow]
      : [itemStoneRow];

    setNewData({
      ...newData,
      stone_details: [...newData.stone_details, itemStoneRow],
    });
    // setNewData({
    //   ...newData,
    //   stone_details: updatedStoneDetails,
    // });

    // setItemRow({
    //   ...itemRow,
    //   stone_details: [...itemRow.stone_details, itemStoneRow],
    // });

    setItemRow({
      ...itemRow,
      stone_details: updatedStoneDetails,
    });

    clearStoneItemRow();
  };

  const clearStoneItemRow = () => {
    setItemStoneRow({
      ...itemStoneRow,
      stone_weight: 0.0,
      stone_type: '',
      stone_type_name: '',
    });
  };

  const toggleMoreModalDetails = (data) => {
    setShowModalState(!showModalState);
    console.log(data);

    clearStoneNewData();

    if (showModalState == false) {
      clearStoneNewData();
    }
    // fetchData();
    setItemRow({
      bc_no: cookie.get('user_branch'),
      item_id: data.item_id,
      item: {
        itemcode: data.item.itemcode,
        itemname: data.item.itemname,
      },
      design_id: data.id,
      design: {
        designcode: data.design.id,
        designname: data.design.design,
      },
      metal_type: data.metal_type,
      gender_type: data.gender_type,
      color_type: data.color_type,
      stone_type: data.stone_type,
    });

    const details = data.stone_details.map((item) => {
      return { ...item, index: uuidv4() };
    });

    let dataObj = data;

    setNewData({
      ...newData,
      stone_details: details,
    });
  };

  /* --- End of component functions --- */

  /* --- Component renders --- */

  return (
    <div>
      <ListSelection
        toggleFormModal={showListSelection}
        showModalState={viewListSelection}
        entities={setListData}
        dataColumns={setColulmns}
        selectRow={selectRow}
      />
      <br />
      <h5 className="text-center">{moduleName}</h5>
      <br />
      {isLoading.init ? (
        <Loader />
      ) : (
        <div>
          <div className="row">
            <div className="col-sm-6">
              <div className="form-group row mb-0">
                <label htmlFor="supplier" className="col-sm-2 col-form-label">
                  Supplier
                </label>
                <div className="col-sm-3 pr-0">
                  <input
                    type="text"
                    className="form-control form-control-sm rounded-0 bg-white"
                    id="vendor_id"
                    name="vendor_id"
                    value={newData.vendor_id}
                    // onChange={handleValueChanges}
                    readOnly
                    placeholder="Press <F2>"
                    onKeyDown={(event) => {
                      if (event.key === 'F2') {
                        setListType('vendor');
                        showListSelection();
                      }
                    }}
                  />
                </div>
                <div className="col-sm-7 px-0">
                  <SDD
                    method={supplierSelect}
                    data={vendors}
                    value="description"
                    rowId="code"
                    classes="form-control form-control-sm rounded-0"
                    placeholder="Name"
                    listId="vendors"
                    selected={newData.vendor_name}
                  />
                </div>
              </div>
              <div className="form-group row mb-0">
                <label htmlFor="notes" className="col-sm-2 col-form-label">
                  Memo
                </label>
                <div className="col-sm-10 pr-0">
                  <textarea
                    name="memo"
                    id="memo"
                    rows="1"
                    maxLength="200"
                    className="form-control form-control-sm rounded-0"
                    value={newData.memo}
                    onChange={handleValueChanges}
                  ></textarea>
                </div>
              </div>
              <div className="form-group row mb-0">
                <label htmlFor="nno" className="col-sm-2 col-form-label">
                  From SO
                </label>
                <div className="col-sm-3 pr-0">
                  <input
                    type="checkbox"
                    id="from_so"
                    name="from_so"
                    onChange={handleValueChanges}
                    value="1"
                  />
                  {isFromSO ? (
                    <label htmlFor="so_no" className="ml-3 col-form-label">
                      SO No
                    </label>
                  ) : null}
                </div>
                {isFromSO ? (
                  <div className="col-sm-7 px-0">
                    <input
                      type="text"
                      className="form-control form-control-sm rounded-0"
                      id="so_no"
                      name="so_no"
                      value={newData.so_no}
                      onChange={handleValueChanges}
                      autoComplete="off"
                      onFocus={(e) => e.target.select()}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          editWithSO();
                        }
                      }}
                    />
                  </div>
                ) : null}
              </div>

              {/* {isFromSO ? (
                  <div className="form-group row mb-0">
                    <label htmlFor="so_no" className="col-sm-2 col-form-label">
                      SO No
                    </label>
                    <div className="col-sm-7">
                      <input
                        type="text"
                        className="form-control form-control-sm rounded-0"
                        id="so_no"
                        name="so_no"
                        value={newData.so_no}
                        onChange={handleValueChanges}
                        onFocus={(e) => e.target.select()}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            editWithSO();
                          }
                        }}
                      />
                    </div>
                  </div>
                ) : null} */}
            </div>

            <div className="offset-3 col-sm-3">
              <div className="form-group row mb-0">
                <label htmlFor="ddate" className="col-sm-5 col-form-label">
                  Date
                </label>
                <div className="col-sm-7">
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
                <label htmlFor="nno" className="col-sm-5 col-form-label">
                  PO Number
                </label>
                <div className="col-sm-7">
                  <input
                    type="text"
                    className="form-control form-control-sm rounded-0"
                    id="nno"
                    name="nno"
                    value={newData.nno}
                    onChange={handleValueChanges}
                    onFocus={(e) => e.target.select()}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        edit();
                      }
                    }}
                  />
                </div>
              </div>

              <div className="form-group row mb-0">
                <label htmlFor="gold_rate" className="col-sm-5 col-form-label">
                  Gold Rate
                </label>
                <div className="col-sm-7">
                  <input
                    type="text"
                    className="form-control form-control-sm rounded-0"
                    id="gold_rate"
                    name="gold_rate"
                    value={newData.gold_rate}
                    onChange={handleValueChanges}
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="table-responsive header-fixed-scrollable">
              <table className="table table-bordered table-sm table-hover">
                <thead className="thead-dark text-center">
                  <tr>
                    <td width="3%">#</td>
                    <td width="13%">Item</td>
                    <td width="13%">Design</td>
                    <td width="13%">Gold Type</td>
                    {/* <td width="13%">Note</td> */}
                    <td width="13%">Quantity</td>
                    <td width="13%">Weight (g)</td>
                    {/* <td width="13%">St Weight (g)</td> */}
                    <td width="13%">Cost (LKR)</td>
                    <td width="3%" colSpan="2"></td>
                    {/* <td width="3%"></td> */}
                  </tr>
                  <tr>
                    <td></td>
                    <td>
                      <SDD
                        method={itemSelect}
                        data={items}
                        value="itemname"
                        rowId="itemcode"
                        classes="form-control form-control-sm rounded-0"
                        placeholder="Item"
                        listId="items"
                        selected={itemRow.item.itemname}
                      />
                    </td>
                    <td>
                      <SDD
                        method={designSelect}
                        data={design}
                        value="designname"
                        rowId="id"
                        classes="form-control form-control-sm"
                        placeholder="Design"
                        // listId="designs"
                        selected={itemRow.design.designname}
                      />
                    </td>
                    <td>
                      <select
                        id="gold_type"
                        name="gold_type"
                        className="form-control form-control-sm"
                        required
                        onChange={handleItemRowChanges}
                        value={itemRow.gold_type}
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
                    </td>
                    {/* <td>
                      <input
                        type="text"
                        name="note"
                        id="note"
                        className="form-control form-control-sm rounded-0"
                        value={itemRow.note}
                        onChange={handleItemRowChanges}
                        placeholder="Notes"
                      />
                    </td> */}
                    <td>
                      <input
                        type="number"
                        name="qty"
                        id="qty"
                        step="1"
                        className="form-control form-control-sm rounded-0 text-right"
                        value={itemRow.qty}
                        onChange={handleItemRowChanges}
                        placeholder="Quantity"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="weight"
                        id="weight"
                        step="0.01"
                        className="form-control form-control-sm rounded-0 text-right"
                        value={itemRow.weight}
                        onChange={handleItemRowChanges}
                        placeholder="Weight"
                      />
                    </td>
                    {/* <td>
                      <input
                        type="number"
                        name="stone_weight"
                        id="stone_weight"
                        step="0.01"
                        className="form-control form-control-sm rounded-0 text-right"
                        value={itemRow.stone_weight}
                        onChange={handleItemRowChanges}
                        placeholder="ST Weight"
                      />
                    </td> */}
                    <td>
                      <input
                        type="number"
                        name="cost"
                        id="cost"
                        className="form-control form-control-sm rounded-0 text-right"
                        value={itemRow.cost}
                        onChange={handleItemRowChanges}
                        // onKeyDown={(e) => {
                        //   if (e.key === 'Enter') {
                        //     addNewItem();
                        //   }
                        // }}
                        placeholder="Cost (LKR)"
                      />
                    </td>
                    <td colSpan="2">
                      <SystemButton
                        type={'option-row'}
                        method={() => toggleMoreModal()}
                        showText={false}
                      />
                    </td>
                    {/* <td>
                      <SystemButton
                        type={'add-row'}
                        method={() => addNewItem()}
                        showText={false}
                      />
                    </td> */}
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
                            className="form-control-plaintext form-control-sm rounded-0"
                            value={newData.details[index].item.itemname}
                            readOnly
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            name="item_name"
                            id="item_name"
                            data-id={index}
                            className="form-control-plaintext form-control-sm"
                            value={newData.details[index].design.designname}
                            readOnly
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            name="gold_type"
                            id="gold_type"
                            data-id={index}
                            className="form-control form-control-sm rounded-0"
                            value={newData.details[index].gold_type}
                            onChange={handleItemsChange}
                            placeholder="Gold Type"
                          />
                        </td>
                        {/* <td>
                          <input
                            type="text"
                            name="note"
                            id="note"
                            data-id={index}
                            className="form-control form-control-sm rounded-0"
                            value={newData.details[index].note}
                            onChange={handleItemsChange}
                            placeholder="Notes"
                          />
                        </td> */}
                        <td>
                          <input
                            type="number"
                            name="qty"
                            id="qty"
                            step="1"
                            data-id={index}
                            className="form-control form-control-sm rounded-0 text-right"
                            value={newData.details[index].qty}
                            onChange={handleItemsChange}
                            placeholder="Quantity"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            name="weight"
                            id="weight"
                            step="0.01"
                            data-id={index}
                            className="form-control form-control-sm rounded-0 text-right"
                            value={newData.details[index].weight}
                            onChange={handleItemsChange}
                            placeholder="Weight"
                          />
                        </td>
                        {/* <td>
                          <input
                            type="number"
                            name="stone_weight"
                            id="stone_weight"
                            step="0.01"
                            data-id={index}
                            className="form-control form-control-sm rounded-0 text-right"
                            value={newData.details[index].stone_weight}
                            onChange={handleItemsChange}
                            placeholder="ST Weight"
                          />
                        </td> */}
                        <td>
                          <input
                            type="number"
                            name="cost"
                            id="cost"
                            data-id={index}
                            className="form-control form-control-sm rounded-0 text-right"
                            value={newData.details[index].cost}
                            onChange={handleItemsChange}
                            placeholder="Cost (LKR)"
                          />
                        </td>
                        <td className="text-center">
                          <SystemButton
                            type={'option-row'}
                            method={() =>
                              toggleMoreModalDetails(newData.details[index])
                            }
                            showText={false}
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
                    <th className="text-center" colSpan="4">
                      Totals
                    </th>
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
                    {/* <td>
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

          {/* {showFields.showOldGoldDetails ? (
            <div>
              <div className="row border border-4 border-grey p-1">
                <div className="col-sm-12">
                  <h5> Gold for Make Juwellery </h5>
                </div>
                <label htmlFor="gold_type" className="col-sm-2 col-form-label ">
                  Gold Type
                </label>
                <div className="col-sm-2">
                  <select
                    id="gold_type"
                    name="gold_type"
                    className="form-control form-control-sm"
                    required
                    onChange={handleValueChanges}
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
                  className="col-sm-1 col-form-label text-right px-0 text-right"
                >
                  Weight (g)
                </label>
                <div className="col-sm-2">
                  <input
                    type="number"
                    name="og_weight"
                    id="og_weight"
                    className="form-control form-control-sm text-right"
                    value={newData.og_weight}
                    onChange={handleValueChanges}
                  />
                </div>

                <label
                  htmlFor="og_rate"
                  className="col-sm-2 col-form-label text-right"
                >
                  Gold Rate (LKR)
                </label>
                <div className="col-sm-2">
                  <input
                    type="number"
                    name="og_rate"
                    id="og_rate"
                    className="form-control form-control-sm text-right"
                    value={newData.og_rate}
                    onChange={handleValueChanges}
                    readOnly
                  />
                </div>
              </div>
            </div>
          ) : null} */}

          <br />
          <div className="row  p-1">
            {/* <div className="col-sm-6"> */}
            {/* <div className="form-group row mb-0"> */}
            <label htmlFor="supplier" className="col-sm-1 col-form-label">
              Officer
            </label>
            <div className="col-sm-2 ">
              <input
                type="text"
                className="form-control form-control-sm "
                id="officer_id"
                name="officer_id"
                value={newData.officer_id}
                readOnly
                // onChange={handleValueChanges}
                // placeholder="Press <F2>"
                // readOnly
              />
            </div>
            <div className="col-sm-7">
              <input
                type="text"
                className="form-control form-control-sm "
                id="supplier"
                name="supplier"
                value={newData.officer_name}
                onChange={handleValueChanges}
                placeholder="Officer"
                autoComplete="no"
                readOnly
              />
            </div>
            {/* <div className="col-sm-7 mx-0 px-0">
                  <SDD
                    method={officerSelect}
                    data={officers}
                    value="name"
                    rowId="id"
                    classes="form-control form-control-sm rounded-0"
                    placeholder="Name"
                    listId="officers"
                    selected={newData.officer_name}
                  />
                </div> */}
            {/* </div> */}
            {/* </div> */}
          </div>
          <hr />
          <div className="row">
            {isEdit == false ? (
              <div className="col-sm-2">
                <SystemButton
                  type="no-form-save"
                  showText
                  method={handleSubmit}
                />
              </div>
            ) : null}

            {/* <div className="col-sm-2">
                          <SystemButton type="cancel" showText />
                      </div> */}
            <div className="col-sm-2">
              <SystemButton
                type="print"
                showText
                method={() => {
                  if (isEdit) {
                    printReceipt(newData.nno, true);
                  } else {
                    const trans_no = prompt('Please enter Sales Order No.');
                    if (trans_no !== null && trans_no !== '') {
                      printReceipt(trans_no, true);
                    }
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

      <FormModal
        moduleName={moduleNameMore}
        modalState={showModalState}
        toggleFormModal={toggleMoreModal}
        width="50%"
      >
        <div>
          <div className="modal-body">
            <div className="row">
              <label htmlFor="code" className="col-sm-2 col-form-label">
                Metal
              </label>
              <div className="col-sm-4">
                <select
                  id="metal_type"
                  name="metal_type"
                  className="form-control form-control-sm"
                  required
                  onChange={handleItemRowChanges}
                  value={itemRow.metal_type}
                >
                  <option value="">---</option>
                  {metalTypes.map((obj) => {
                    return (
                      <option key={obj.id} value={obj.id}>
                        {obj.description}
                      </option>
                    );
                  })}
                </select>
              </div>

              <label htmlFor="code" className="col-sm-2 col-form-label">
                Gender
              </label>
              <div className="col-sm-4">
                <select
                  id="gender_type"
                  name="gender_type"
                  className="form-control form-control-sm"
                  required
                  onChange={handleItemRowChanges}
                  value={itemRow.gender_type}
                >
                  <option value="">---</option>
                  {genderTypes.map((obj) => {
                    return (
                      <option key={obj.id} value={obj.id}>
                        {obj.description}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="row">
              <label htmlFor="code" className="col-sm-2 col-form-label">
                Color
              </label>
              <div className="col-sm-4">
                <select
                  id="color_type"
                  name="color_type"
                  className="form-control form-control-sm"
                  required
                  onChange={handleItemRowChanges}
                  value={itemRow.color_type}
                >
                  <option value="">---</option>
                  {colorTypes.map((obj) => {
                    return (
                      <option key={obj.id} value={obj.id}>
                        {obj.description}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <br />
            <h5 className="text-left">Stone Details</h5>
            <br />

            <div className="table-responsive header-fixed-scrollable">
              <table className="table table-bordered table-sm table-hover">
                <thead className="thead-dark text-center">
                  <tr>
                    <td width="3%" rowSpan="2">
                      #
                    </td>
                    <td width="15%">Stone</td>
                    <td width="12%">Weight</td>
                    <td width="3%"></td>
                  </tr>
                  <tr>
                    <td>
                      <SDD
                        method={stoneSelect}
                        data={stoneTypes}
                        value="description"
                        rowId="id"
                        classes="form-control form-control-sm"
                        placeholder="Store description"
                        listId="stone"
                        selected={itemStoneRow.stone_type_name}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="stone_weight"
                        id="stone_weight"
                        step="1"
                        className="form-control form-control-sm text-right"
                        value={itemStoneRow.stone_weight}
                        onChange={handleStoneItemRowChanges}
                        placeholder="Quantity"
                      />
                    </td>
                    <td>
                      <SystemButton
                        type={'add-row'}
                        method={(event) => {
                          addStoneItem(event);
                        }}
                        showText={false}
                      />
                    </td>
                  </tr>
                </thead>
                <tbody>
                  {newData.stone_details.map((item, index) => {
                    return (
                      <tr key={item.index}>
                        <th scope="row">{parseInt(index) + 1}</th>
                        <td>
                          <input
                            type="text"
                            name="item_name"
                            id="item_name"
                            data-id={index}
                            className="form-control-plaintext form-control-sm rounded-0"
                            value={newData.stone_details[index].stone_type_name}
                            readOnly
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            name="stone_weight"
                            id="stone_weight"
                            step="0.01"
                            data-id={index}
                            className="form-control form-control-sm rounded-0 text-right"
                            value={newData.stone_details[index].stone_weight}
                            onChange={handleItemsChange}
                            placeholder="ST Weight"
                          />
                        </td>
                        <td className="text-center">
                          <SystemButton
                            type={'remove-row'}
                            method={() =>
                              removeItem(newData.stone_details[index].index)
                            }
                            showText={false}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="modal-footer">
              <SystemButton
                type={'close'}
                method={toggleMoreModal}
                showText={true}
              />
              <SystemButton
                type="add-row-more"
                // method={addNewItem}
                method={(event) => {
                  addNewItem(event);
                }}
                showText={true}
              />
            </div>
          </div>
        </div>
      </FormModal>
    </div>
  );

  /* --- End of component renders --- */
};

export default PurchaseOrders;
