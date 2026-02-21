import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
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
import GoldSmithGoldRecivedA4Half from '../../../printouts/GoldSmithGoldRecivedA4Half'; 
import { useNavigate } from 'react-router-dom';

const GoldSmithGoldRecived = () => { 
  // Module name
  const moduleName = 'Gold Smith Gold Recived';
  const moduleNameMore = 'More';

  /* --- Route params --- */

  let navigate = useNavigate();


  /* --- End of route params --- */

  /* --- State declarations --- */

  const [isLoading, setIsLoading] = useState({
    init: false,
  });

  const [isEdit, setIsEdit] = useState(false);

  const [showModalState, setShowModalState] = useState(false);

  const [goldTypes, setGoldTypes] = useState([]);

  const [metalTypes, setMetalTypes] = useState([]);

  const [colorTypes, setColorTypes] = useState([]);

  const [stoneTypes, setStoneTypes] = useState([]);

  const [genderTypes, setGenderTypes] = useState([]);

  const [newData, setNewData] = useState({
    id: '',
    bc_no: cookie.get('user_branch'),
    ddate: '',
    new_ddate: '',
    nno: '',
    new_nno: '',
    po_id: '',
    vendor_id: '',
    vendor_name: '',
    vendor_invoice_no: '',
    store_id: '',
    store_name: '',
    gold_rate: 10,
    total_qty: 0,
    total_weight: 0,
    convert_total_weight: 0,
    total_stone_weight: 0,
    total_amount: 0,
    discount: 0,
    net_amount: 0,
    forfiet_purchase_id: '',
    officer_id: '',
    officer_name: '',
    memo: '',
    is_approved: false,
    approved_by: cookie.get('user_id'),
    approved_on: '',
    is_cancelled: false,
    user_id: cookie.get('user_id'),
    details: [],
    convert_details: [],
    stone_details: [],

    stone_details_all: [
      {
        stone_weight: 0.0,
        stone_type: '',
        stone_type_name: '',
      },
    ],

    total_gold_rate: 0.0,
    total_la_cost: 0.0,
    total_wastage_per_pound: 0.0,
    total_tot_wastage: 0.0,
    daily_gold_rate: 0.0,

    supplier_gold: 0.0,
    dataseIDRow: '',
  });

  const [convertItemRow, setConvertItemRow] = useState({
    index: uuidv4(),
    purchase_id: '',
    bc_no: cookie.get('user_branch'),
    convert_metal_type: '',
    convert_metal: {
      id: '',
      description: '',
    },
    convert_weight: 0,
    convert_gold_type: '',
    convert_metal_type: '',
  });

  const [itemRow, setItemRow] = useState({
    index: uuidv4(),
    purchase_id: '',
    bc_no: cookie.get('user_branch'),
    item_id: '',
    design_id: '',
    item: {
      itemcode: '',
      itemname: '',
    },
    design: {
      designcode: '',
      designname: '',
    },
    stone_id: '',
    metal_type: '',
    metal: {
      id: '',
      description: '',
    },
    
    stone_details: [],
    note: '',
    qty: 0,
    weight: 0,
    
    stone_weight: 0,
    cost: 0,
    return_qty: 0,
    tag_qty: 0,
    tag_weight: 0,
    tag_stone_weight: 0,

    gold_rate: 0.0,
    repair_cost: 0.0,
    la_cost: 0.0,
    wastage_per_pound: 0.0,
    tot_wastage: 0.0,
    gold_type: '',
    metal_type: '',
    gender_type: '',
    color_type: '',
    is_melt: false,
  });

  const [itemStoneRow, setItemStoneRow] = useState({
    stone_weight: 0.0,
    stone_type: '',
    stone_type_name: '',
  });

  const [vendors, setVendors] = useState([]);

  const [officers, setOfficers] = useState([]);

  const [stores, setStores] = useState([]);

  const [items, setItems] = useState([]);

  const [design, setDesign] = useState([]);

  const [controlsVisibility, setControlsVisibility] = useState({
    po_no: false,
    vendor: false,
  });

  /* --- End of state declarations --- */

  const initUpdate = useRef(true);
  const isApproved = useRef(false);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    calColumnTotals();
  }, [newData.details]);

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
    } else if (listType === 'store') {
      setNewData({
        ...newData,
        store_id: dataObj.id,
        store_name: dataObj.description,
      });
    }
  };

  const setColulmns = () => {
    if (listType === 'vendor') {
      return vendorColumns;
    } else if (listType === 'officer') {
      return officerColumns;
    } else if (listType === 'store') {
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
    { title: 'Code', name: 'id', searchable: true },
    { title: 'Description', name: 'description', searchable: true },
  ];

  const setListData = () => {
    if (listType === 'vendor') {
      return vendors;
    } else if (listType === 'officer') {
      return officers;
    } else if (listType === 'store') {
      return stores;
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

      isApproved.current = false;

      const response = await api.get(`goldsmith-gold-recived`);

      setVendors(response.data.vendors);

      setOfficers(response.data.officers);

      setStores(response.data.stores);

      setItems(response.data.items);

      setDesign(response.data.designs);

      setGenderTypes(response.data.gender);

      setMetalTypes(response.data.metal);
      setColorTypes(response.data.color);
      setStoneTypes(response.data.stone);

      setApproved(false);

      setNewData({
        id: '',
        bc_no: cookie.get('user_branch'),
        ddate: moment(response.data.new_date).format('YYYY-MM-DD'),
        new_ddate: moment(response.data.new_date).format('YYYY-MM-DD'),
        nno: response.data.new_id,
        new_nno: response.data.new_id,
        po_id: '',
        vendor_id: '',
        vendor_name: '',
        vendor_invoice_no: '',
        store_id: '',
        store_name: '',
        gold_rate: '',
        total_qty: 0,
        total_weight: 0,
        convert_total_weight: 0,
        total_stone_weight: 0,
        total_amount: 0,
        discount: 0,
        net_amount: 0,
        officer_id: response.data.officers.id,
        officer_name: response.data.officers.name,
        memo: '',
        is_approved: '',
        forfiet_purchase_id: '',
        approved_by: cookie.get('user_id'),
        approved_on: '',
        is_cancelled: '',
        user_id: cookie.get('user_id'),
        details: [],
        stone_details: [],
        convert_details: [],

        stone_details_all: [
          {
            stone_weight: 0.0,
            stone_type: '',
            stone_type_name: '',
          },
        ],

        total_gold_rate: 0.0,
        total_la_cost: 0.0,
        total_wastage_per_pound: 0.0,
        total_tot_wastage: 0.0,

        supplier_gold: 0.0,

        daily_gold_rate: parseFloat(response.data.daily_gold_rate.rate).toFixed(2),

        so_no: 0,
      });

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
        `goldsmith-gold-recived/${newData.nno}/${newData.bc_no}`,
      );

      isApproved.current = response.data.result.is_approved ? true : false;

      let dataObj = response.data.result;
      dataObj.vendor_name = response.data.result.vendor.name;
      dataObj.officer_name = response.data.result.officer.name;
      dataObj.daily_gold_rate = response.data.daily_gold_rate;

      const details = response.data.result.details.map((item) => {
        return { ...item, index: uuidv4() };
      });

      dataObj.details = details;

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


  const supplierSelect = (selectedObj) => {
    setNewData({
      ...newData,
      vendor_id: selectedObj.code,
      vendor_name: selectedObj.description,
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
    let inputValue = targetInput.value;

    if (inputName === 'discount' && inputValue === '') {
      inputValue = 0;
    }

    setNewData({
      ...newData,
      [inputName]: inputValue,
    });
  };

  const handleItemRowChanges = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    // const inputValue = targetInput.value;
    const inputValue =
      targetInput.type === 'checkbox' ? targetInput.checked : targetInput.value;

    console.log(inputName, inputValue);

    setItemRow({
      ...itemRow,
      [inputName]: inputValue,
    });
  };

  const handleConvertItemRowChanges = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue =
      targetInput.type === 'checkbox' ? targetInput.checked : targetInput.value;

    setConvertItemRow({
      ...convertItemRow,
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
    if (checkBeforeSave() === false) return;

    await save();
  };

  const save = async () => {
    try {
      if (!isEdit) {
        const response = await api.post('goldsmith-gold-recived').values(newData);

        if (parseInt(response.data) > 0) {
          printReceipt(response.data, false);
          fetchData();
          msg.success('Gold Issue Saved Successfully.');
        }
      } else {
        const response = await api
          .put('goldsmith-gold-recived', newData.id)
          .values(newData);

        if (parseInt(response.data) > 0) {
          printReceipt(response.data, false);
          fetchData();
          msg.success('Gold Issue Saved Successfully.');
          navigate('/purchases/:nno/:bc_no');
          // window.location.reload(false);
        }
      }
      // resetAll();
    } catch (err) {
      msg.error(err);
      return;
    }
  };

  const approve = () => {
    isApproved.current = true;

    setApproved(true);

  };

  const addNewItem = (e) => {
    if (checkBeforeAddItem() === false) return;
    setNewData({
      ...newData,
      details: [...newData.details, itemRow],
    });

    toggleMoreModal();

    clearItemRow();
    clearStoneNewData();
  };

  const addNewConvertItem = (e) => {
    if (checkBeforeAddConvertItem() === false) return;
    setNewData({
      ...newData,
      convert_details: [...newData.convert_details, convertItemRow],
    });

    toggleMoreModal();

    clearConvertItemRow();
  };

  const addStoneItem = async (e) => {
    console.log(itemRow);
    setNewData({
      ...newData,
      stone_details: [...newData.stone_details, itemStoneRow],
    });

    setItemRow({
      ...itemRow,
      stone_details: [...itemRow.stone_details, itemStoneRow],
    });

  };

  const clearItemRow = () => {
    setItemRow({
      index: uuidv4(),
      purchase_id: '',
      bc_no: cookie.get('user_branch'),
      item_id: '',
      design_id: '',
      item: {
        itemcode: '',
        itemname: '',
      },
      design: {
        designcode: '',
        designname: '',
      },
      stone_id: '',
      stone_details: {
        stone_type: '',
        stone_weight: 0,
      },
      metal_type: '',
      metal: {
        id: '',
        description: '',
      },
      stone_details: [],
      note: '',
      qty: 0,
      weight: 0,
      stone_weight: 0,
      cost: 0,
      return_qty: 0,
      tag_qty: 0,
      tag_weight: 0,
      tag_stone_weight: 0,

      gold_rate: 0.0,
      la_cost: 0.0,
      wastage_per_pound: 0.0,
      tot_wastage: 0.0,
      gold_type: '',
      metal_type: '',
      gender_type: '',
      color_type: '',
      stone_type: '',
      repair_cost: 0.0,
      is_melt: false,
    });
  };

  const clearConvertItemRow = () => {
    setConvertItemRow({
      ...convertItemRow,
      index: uuidv4(),
      purchase_id: '',
      bc_no: cookie.get('user_branch'),
      convert_metal_type: '',
      convert_metal: {
        id: '',
        description: '',
      },
      convert_weight: 0,
      convert_gold_type: '',
      convert_metal_type: '',
    });
  };

  const clearStoneItemRow = () => {
    setItemStoneRow({
      ...itemStoneRow,
      stone_weight: 0.0,
      stone_type: '',
      stone_type_name: '',
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

  const checkBeforeAddItem = () => {
    
    if (itemRow.weight === '' || itemRow.weight === 0) {
      msg.warning('Item weight not valid.');
      return false;
    }

    return true;
  };

  const checkBeforeAddConvertItem = () => {
    
    if (convertItemRow.convert_weight === '' || convertItemRow.convert_weight === 0) {
      msg.warning('Item weight not valid.');
      return false;
    }

    return true;
  };

  const checkBeforeSave = () => {
    if (parseFloat(newData.details) === []) {
      msg.warning('Please add at least one item');
      return false;
    }

    if (newData.officer_id === '' || newData.officer_name === '') {
      msg.warning('Select an officer');
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

  const removeConvertItem = (i) => {
    // TODO: Create a better dialog box component... Use the FormModal component as a base template

    if (window.confirm('Are you sure you want to remove this item?')) {
      let filteredRows = newData.convert_details.filter((item) => item.index !== i);

      setNewData({
        ...newData,
        convert_details: filteredRows,
      });
    }
  };

  const calColumnTotals = () => {
    let total_qty = 0;
    let total_weight = 0;
    let total_stone_weight = 0;
    let total_amount = 0;
    let total_la_cost = 0;
    let total_wastage_per_pound = 0;
    let total_tot_wastage = 0;

    newData.details.forEach((row) => {
      console.log(row);
      // prettier-ignore
      total_qty = parseInt(total_qty) + parseInt(row.qty);
      // prettier-ignore-end
      // prettier-ignore
      total_weight = parseFloat(parseFloat(total_weight) + parseFloat(row.weight)).toFixed(3);
      // prettier-ignore-end
      // prettier-ignore
      total_stone_weight = parseFloat(parseFloat(total_stone_weight) + parseFloat(row.stone_weight)).toFixed(3);
      // prettier-ignore-end
      // prettier-ignore
      total_amount = parseFloat(parseFloat(total_amount) + parseFloat(row.repair_cost)).toFixed(2);
      // prettier-ignore-end
      // prettier-ignore
      total_la_cost = parseFloat(parseFloat(total_la_cost) + parseFloat(row.la_cost)).toFixed(2);
      // prettier-ignore-end
      // prettier-ignore
      total_wastage_per_pound = parseFloat(parseFloat(total_wastage_per_pound) + parseFloat(row.wastage_per_pound)).toFixed(2);
      // prettier-ignore-end
      // prettier-ignore
      total_tot_wastage = parseFloat(parseFloat(total_tot_wastage) + parseFloat(row.tot_wastage)).toFixed(2);
      // prettier-ignore-end
    });

    setNewData({
      ...newData,
      total_qty: total_qty,
      total_weight: total_weight,
      total_stone_weight: total_stone_weight,
      total_amount: total_amount,
      total_la_cost: total_la_cost,
      total_wastage_per_pound: total_wastage_per_pound,
      total_tot_wastage: total_tot_wastage,
      net_amount: parseFloat(
        parseFloat(total_amount) - parseFloat(newData.discount),
      ).toFixed(2),
    });
  };

  const printReceipt = (trans_no, is_dupplicate) => {
    GoldSmithGoldRecivedA4Half.load(
      trans_no,
      cookie.get('user_branch'),
      is_dupplicate,
    );
  };

  const resetAll = () => {
    isApproved.current = false;

    setIsLoading({
      init: false,
    });

    setIsEdit(false);
    setApproved(false);
    setNewData({
      id: '',
      bc_no: cookie.get('user_branch'),
      ddate: newData.new_ddate,
      nno: newData.new_nno,
      po_id: '',
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
      convert_total_weight: 0,
    });

    setItems([]);

    setItemRow({
      index: uuidv4(),
      purchase_id: '',
      bc_no: cookie.get('user_branch'),
      item_id: '',
      design_id: '',
      item: {
        itemcode: '',
        itemname: '',
      },
      design: {
        designcode: '',
        designname: '',
      },
      metal_type: '',
      metal: {
        id: '',
        description: '',
      },
      stone_details: [],
      note: '',
      qty: 0,
      weight: 0,
      stone_weight: 0,
      cost: 0,
      return_qty: 0,
      tag_qty: 0,
      tag_weight: 0,
      tag_stone_weight: 0,
      gold_type: '',
      metal_type: '',
      gender_type: '',
      color_type: '',
      stone_type: '',
      repair_cost: 0.0,
      is_melt: false,
    });

    setControlsVisibility({
      po_no: false,
      vendor: false, 
    });
  };

  const toggleMoreModal = () => {
    setShowModalState(!showModalState);
    console.log(itemRow);
    clearStoneItemRow();
  };

  const toggleMoreModalDetails = (data) => {
    setShowModalState(!showModalState);
    console.log(data);

    clearStoneNewData();

    if (!showModalState) {
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
    // dataObj.stone_details = details;

    setNewData({
      ...newData,
      stone_details: details,
    });
  };

  const metalSelect = (selectedObj) => {
    setItemRow({
      ...itemRow,
      metal_type: selectedObj.id,
      metal: {
        id: '',
        description: selectedObj.description,
      },
    });
  };

  const convertMetalSelect = (selectedObj) => {
    setConvertItemRow({
      ...convertItemRow,
      convert_metal_type: selectedObj.id,
      convert_metal: {
        id: '',
        description: selectedObj.description,
      },
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
            <div className="col-sm-8">
              <div className="form-group row mb-0">
                <label
                  htmlFor="supplier"
                  className="col-sm-2 col-form-label mx-0"
                >
                  Supplier
                </label>
                <div className="col-sm-3 mx-0 pr-0">
                  <input
                    type="text"
                    className="form-control form-control-sm bg-white"
                    id="vendor_id"
                    name="vendor_id"
                    value={newData.vendor_id}
                    // onChange={handleValueChanges}
                    readOnly
                    onKeyDown={(event) => {
                      if (event.key === 'F2') {
                        if (controlsVisibility.vendor === false) {
                          setListType('vendor');
                          showListSelection();
                        } else {
                          msg.warning(
                            'Not allowed to change supplier for purchase order base purchases.',
                          );
                        }
                      }
                    }}
                    placeholder="Press <F2>"
                  />
                </div>
                <div className="col-sm-7 mx-0 pl-0">
                  {controlsVisibility.vendor ? (
                    <input
                      type="text"
                      className="form-control form-control-sm bg-white"
                      name="vendor_name"
                      value={newData.vendor_name}
                      readOnly
                    />
                  ) : (
                    <SDD
                      method={supplierSelect}
                      data={vendors}
                      value="description"
                      rowId="code"
                      classes="form-control form-control-sm"
                      placeholder="Supplier description"
                      listId="vendors"
                      selected={newData.vendor_name}
                    />
                  )}
                </div>
              </div>
             
            </div>

            <div className="col-sm-4 border-left border-white">
              <div className="form-group row mb-0">
                <label htmlFor="ddate" className="col-sm-5 col-form-label">
                  Date
                </label>
                <div className="col-sm-7">
                  <input
                    type="date"
                    className="form-control form-control-sm text-right"
                    id="ddate"
                    name="ddate"
                    value={newData.ddate}
                    onChange={handleValueChanges}
                    readOnly
                  />
                </div>
              </div>

              <div className="form-group row mb-0">
                <label htmlFor="nno" className="col-sm-5 col-form-label">
                  No
                </label>
                <div className="col-sm-7">
                  <input
                    type="text"
                    className="form-control form-control-sm text-right"
                    id="nno"
                    name="nno"
                    onFocus={(e) => e.target.select()}
                    value={newData.nno}
                    onChange={handleValueChanges}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        edit();
                      }
                    }}
                    // readOnly
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
                    className="form-control form-control-sm text-right"
                    id="daily_gold_rate"
                    name="daily_gold_rate"
                    value={newData.daily_gold_rate}
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>
          <hr className="border-white" />
          <div className="row">
            <div className="table-responsive header-fixed-scrollable col-sm-12">
              {/* <h2>Issued Gold</h2> */}
              <table className="table table-bordered table-sm table-hover">
                <thead className="thead-dark text-center">
                  <tr>
                    <td width="5%" rowSpan="2">
                      #
                    </td>
                    <td width="30%">Metal</td>
                    <td width="30%">Gold Type</td>
                    <td width="25%">Weight</td>
                    <td width="5%"></td>
                  </tr>
                  <tr>
                    <td>
                      <SDD
                        method={metalSelect}
                        data={metalTypes}
                        value="description"
                        rowId="id"
                        classes="form-control form-control-sm"
                        placeholder="Metal"
                        listId="metal_types"
                        selected={itemRow.metal.description}
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
                    <td>
                      <input
                        type="number"
                        name="weight"
                        id="weight"
                        step="0.01"
                        className="form-control form-control-sm text-right"
                        value={itemRow.weight}
                        onChange={handleItemRowChanges}
                        placeholder="Weight"
                      />
                    </td>

                    <td>
                      <SystemButton
                        type="add-row"
                        // method={addNewItem}
                        method={(event) => {
                          addNewItem(event);
                        }}
                        showText={true}
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
                            name="item_name"
                            id="item_name"
                            data-id={index}
                            className="form-control-plaintext form-control-sm"
                            value={newData.details[index].metal.description}
                            readOnly
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            name="gold_type"
                            id="gold_type"
                            data-id={index}
                            className="form-control-plaintext form-control-sm"
                            value={newData.details[index].gold_type}
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
                            className="form-control form-control-sm text-right"
                            value={newData.details[index].weight}
                            onChange={handleItemsChange}
                            placeholder="Weight"
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
                        id="total_weight"
                        name="total_weight"
                        value={newData.total_weight}
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
            <div className="col-sm-8">
              <hr className="border-white" />
              <div className="form-group row mb-0">
                <label htmlFor="supplier" className="col-sm-2 col-form-label">
                  Officer
                </label>
                <div className="col-sm-2 pr-0">
                  <input
                    type="text"
                    className="form-control form-control-sm bg-white"
                    id="officer_id"
                    name="officer_id"
                    value={newData.officer_id}
                    // onChange={handleValueChanges}
                    readOnly
                    placeholder="Press <F2>"
                  />
                </div>
                <div className="col-sm-8 pl-0">
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
              </div>
              <div className="form-group row mb-0">
                <label htmlFor="notes" className="col-sm-2 col-form-label">
                  Memo
                </label>
                <div className="col-sm-10">
                  <textarea
                    name="memo"
                    id="memo"
                    rows="1"
                    className="form-control form-control-sm"
                    value={newData.memo}
                    onChange={handleValueChanges}
                    maxLength="100"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
          <hr className="border-white" />
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
            {/* {isEdit && !newData.is_approved ? (
              <div className="col-sm-2">
                <SystemButton type="approve" showText method={approve} />
              </div>
            ) : null} */}
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
              <SystemButton type="cancel" showText />
            </div>
            <div className="col-sm-2">
              <SystemButton type="reset" showText method={resetAll} />
            </div>
          </div>
          <hr />
        </div>
      )}

      <br />
      <br />
    </div>
  );

  /* --- End of component renders --- */
};

export default GoldSmithGoldRecived;
