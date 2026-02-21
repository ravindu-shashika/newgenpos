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
import ResellRepairPrintA4Half from '../../../printouts/ResellRepairPrintA4Half';
import { useNavigate } from 'react-router-dom';

const ResellRepair = () => {
  // Module name 
  const moduleName = 'Re-Sell Repair';
  const moduleNameMore = 'More';

  /* --- Route params --- */

  let navigate = useNavigate();

  const { nno, bc_no } = useParams();

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
    // stone_details: [
    //   {
    //     stone_type: '',
    //     stone_weight: 0,
    //   },
    // ],
    stone_details:[],
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
    is_melt: false
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
    console.log(nno != ':nno');
    // if (nno != ':nno') {
    //   newData.nno = nno;
    //   // fetchData();
    //   edit();
    // } else {
    //   fetchData();
    // }
    fetchData();
  }, []);

  useEffect(() => {
    calColumnTotals();
  }, [newData.details]);

//   useEffect(() => {
//     console.log(nno != ':nno');
//     console.log(bc_no);
//     if (nno != ':nno') {
//       newData.nno = nno;
//       // fetchData();
//       edit();
//     } else {
//       fetchData();
//     }
//   }, [nno]);

  useEffect(() => {
    // prettier-ignore
    setNewData({
      ...newData,
      net_amount: parseFloat(parseFloat(newData.total_amount) - parseFloat(newData.discount)).toFixed(2),
    });
    // prettier-ignore-end
  }, [newData.discount]);

  // useEffect(() => {
  //   if (isApproved.current && newData.is_approved) {
  //     handleSubmit();
  //   }
  // }, [newData.is_approved]);

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

      const response = await api.get(`resell-repair`);

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

        daily_gold_rate: response.data.daily_gold_rate.rate,

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

  // const loadFromApproval = () => {
  //   setNewData({
  //     ...newData,
  //     nno: nno,
  //   });

  //   edit();
  // };

  const edit = async () => {
    try {
      setIsLoading({
        ...isLoading,
        init: true,
      });

      const response = await api.get(
        `forfeit-purchases/${newData.nno}/${newData.bc_no}`,
      );

      isApproved.current = response.data.result.is_approved ? true : false;
 
      let dataObj = response.data.result;
      dataObj.vendor_name = response.data.result.vendor.name;
      dataObj.officer_name = response.data.result.officer.name;

      const details = response.data.result.details.map((item) => {
        return { ...item, index: uuidv4() };
      });

      const st_details = response.data.result.details.map((st_item) => {
        return { ...st_item.stone_details, index: uuidv4() };
      });

      dataObj.details = details;
      dataObj.stone_details = [];
      dataObj.stone_details = st_details;
      console.log(dataObj);
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
      console.log(error)
      return msg.error('Unable to fetch data!');
    }
  };

  const loadForPurchase = async () => {
    try {
      setIsLoading({
        ...isLoading,
        init: true,
      });

      const response = await api.get(
        `forfeit-purchases-for-resell-repair/${newData.forfiet_purchase_id}/${newData.bc_no}`,
      );

      // isApproved.current = response.data.result.is_approved ? true : false;

      if(response.data.result){
        let dataObj = response.data.result;
        dataObj.forfiet_purchase_id = response.data.result.nno;
        dataObj.nno = newData.nno;
        dataObj.total_amount = newData.repair_cost;
        dataObj.net_amount = newData.net_amount;
        dataObj.vendor_name = response.data.result.vendor.name;
        dataObj.officer_name = response.data.result.officer.name;
  
        const details = response.data.result.details.map((item) => {
          return { ...item, index: uuidv4() };
        });
  
        const st_details = response.data.result.details.map((st_item) => {
          return { ...st_item.stone_details, index: uuidv4() };
        });
  
        dataObj.details = details;
        dataObj.stone_details = [];
        dataObj.stone_details = st_details;
        console.log(dataObj);
        // dataObj.details.stone_details = st_details;
  
        setNewData(dataObj);
      }else{
        setIsLoading({
          ...isLoading,
          init: false,
        });
        fetchData();
        return msg.info('This Forefited is not a re-sell purchase or already repaired for re-sell!');
      }

      // setIsEdit(true);

      setIsLoading({
        ...isLoading,
        init: false,
      });
    } catch (error) {
      setIsLoading({
        ...isLoading,
        init: false,
      });
      console.log(error)
      return msg.error('Unable to fetch data!');
    }
  };

  const loadPO = async () => {
    isApproved.current = false;

    const response = await api.get(
      `purchase-orders/${newData.po_id}/${newData.bc_no}`,
    );

    if (response.data.po.details.length > 0) {
      const details = response.data.po.details.map((item) => {
        return { ...item, index: uuidv4() };
      });

      setNewData({
        ...response.data,
        nno: newData.new_nno,
        bc_no: newData.bc_no,
        ddate: newData.new_ddate,
        new_nno: newData.new_nno,
        new_ddate: newData.new_ddate,
        po_id: response.data.nno,
        vendor_invoice_no: '',
        store_id: '',
        store_name: '',
        vendor_id: response.data.po.vendor_id,
        vendor_name: response.data.po.vendor.name,
        officer_id: response.data.po.officer_id,
        officer_name: response.data.po.officer
          ? response.data.po.officer.name
          : '',
        discount: 0,
        net_amount: response.data.po.total_amount,
        details: details,
        gold_rate: response.data.daily_gold_rate.rate,
        daily_gold_rate: response.data.daily_gold_rate.rate,
        user_id: newData.user_id,
        supplier_gold: newData.supplier_gold,
        so_no: response.data.so_details.id,
      });

      setControlsVisibility({
        ...controlsVisibility,
        po_no: true,
        vendor: true,
      });
    } else {
      msg.warning('Entered PO No not correct.');
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

  const officerSelect = (selectedObj) => {
    setNewData({
      ...newData,
      officer_id: selectedObj.id,
      officer_name: selectedObj.name,
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
    console.log(selectedObj);
    setItemRow({
      ...itemRow,
      design_id: selectedObj.id,
      design: {
        designcode: '',
        designname: selectedObj.designname,
      },
    });
  };

  const stoneSelect = (selectedObj) => {
    console.log(selectedObj);
    setItemStoneRow({
      ...itemStoneRow,
      stone_type: selectedObj.id,
      stone_type_name: selectedObj.description,
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

  const handleStoneItemRowChanges = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue = targetInput.value;

    setItemStoneRow({
      ...itemStoneRow,
      [inputName]: inputValue,
    });

    // itemStoneRow, setItemStoneRow
  };

  const handleItemsChange = async (e) => {
    const targetInput = e.target;
    const datasetId = targetInput.dataset.id;
    const inputName = targetInput.name;
    const inputValue = targetInput.value;
    const setOfItems = [...newData.details];

    const validated = await validateControlValues(inputName, inputValue);

    // if (inputName === 'la_cost' && inputValue != '') {
    //   document.getElementById('gold_rates').readOnly = true;
    // } else {
    //   document.getElementById('gold_rates').readOnly = false;
    // }

    // if (inputName === 'gold_rate' && inputValue != '') {
    //   document.getElementById('la_costt').readOnly = true;
    //   document.getElementById('wastage_per_pounds').readOnly = true;
    // } else {
    //   document.getElementById('la_costt').readOnly = false;
    //   document.getElementById('wastage_per_pounds').readOnly = false;
    // }

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
        const response = await api.post('resell-repair').values(newData);

        if (parseInt(response.data) > 0) {
          printReceipt(response.data, false);
          fetchData();
          msg.success('Purchase Saved Successfully.');
        }
      } else {
        // const response = await api
        //   .update(`purchases/${newData.id}`)
        //   .values(newData);
        const response = await api.put('resell-repair', newData.id).values(newData);

        if (parseInt(response.data) > 0) {
          printReceipt(response.data, false);
          fetchData();
          msg.success('Purchase Saved Successfully.');
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

    // handleSubmit();
    // setNewData({
    //   ...newData,
    //   is_approved: true,
    // });
  };

  const addNewItem = (e) => {

    console.log(newData.stone_details)

    console.log(itemRow)
    
    if (checkBeforeAddItem() === false) return;
    setNewData({
      ...newData,
      details: [...newData.details, itemRow],
    });

    // addstonetomain();

    toggleMoreModal();

    clearItemRow();
    clearStoneNewData();
  };

  const addStoneItem = async (e) => {
    console.log(itemRow);
    setNewData({
      ...newData,
      stone_details: [...newData.stone_details, itemStoneRow],
    });

    setItemRow({
      ...itemRow,
      stone_details : [...itemRow.stone_details, itemStoneRow],
    });

    clearStoneItemRow();
    // clearStoneNewData();
  };

  const addstonetomain =  () => {
    const setOfItems = [...newData.details];
    setOfItems['stone_details'] = newData.stone_details;

    setNewData({
      ...newData,
      details: setOfItems,
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
      stone_details:[],
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
      is_melt: false
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
    setNewData(prev => {return{
      ...prev,
      stone_details: []
    }});
  };

  const checkBeforeAddItem = () => {
    if (itemRow.item.itemname === '') {
      msg.warning('Item cannot be empty!');
      return false;
    }
    if (itemRow.qty === '' || itemRow.qty === 0) {
      msg.warning('Item quantity not valit');
      return false;
    }
    if (itemRow.weight === '' || itemRow.weight === 0) {
      msg.warning('Item weight not valid.');
      return false;
    }
    if (itemRow.stone_weight === '') {
      msg.warning('Item stone weight not valid.');
      return false;
    }
    if (itemRow.cost === '' || itemRow.cost === 0) {
      msg.warning('Item cost not valid.');
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

    if (newData.store_id === '') {
      msg.warning('Select a store');
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

  const addCostForRate = async () => {
    // itemRow.gold_rate
    let total_cost = 0;
    let value_for_one = 0;
    let total_stone_weight = 0;

    const response = await api.get(`get-gold-rate-value/${itemRow.gold_type}`);

    value_for_one = (itemRow.gold_rate / 24) * response.data.result.value;

    total_cost = (value_for_one / 8) * itemRow.weight;

    // console.log(total_cost);itemRow.cost

    setItemRow({
      ...itemRow,
      cost: parseFloat(total_cost),
    });
  };

  const addCostForWastage = async () => {
    let total_cost_one = 0;
    let total_cost_with_lc = 0;
    let total_cost_with_wastage = 0;
    let value_for_one = 0;
    let total_stone_weight = 0;

    let wastage_one = 0;
    let wastage_two = 0;
    let deducted_weight = 0;

    const response = await api.get(`get-gold-rate-value/${itemRow.gold_type}`);

    wastage_one = (itemRow.weight / 8) * itemRow.wastage_per_pound;

    value_for_one = (newData.daily_gold_rate / 24) * response.data.result.value;

    wastage_two = (value_for_one / 8) * wastage_one;

    total_cost_one = (value_for_one / 8) * itemRow.weight;

    total_cost_with_lc =
      parseFloat(total_cost_one) + parseFloat(itemRow.la_cost);

    deducted_weight =
      parseFloat(newData.supplier_gold) +
      parseFloat(wastage_one) +
      parseFloat(itemRow.weight);

    setNewData({
      ...newData,
      supplier_gold: parseFloat(deducted_weight).toFixed(2),
    });

    total_cost_with_wastage =
      parseFloat(total_cost_with_lc) + parseFloat(wastage_two);

    setItemRow({
      ...itemRow,
      tot_wastage: parseFloat(wastage_two).toFixed(2),
      cost: parseFloat(total_cost_with_wastage).toFixed(2),
    });
  };

  const addCostForRateAsIndex = async (data, e) => {
    // itemRow.gold_rate
    let total_cost = 0;
    let value_for_one = 0;
    let total_stone_weight = 0;
    const targetInput = e.target;
    const datasetId = targetInput.dataset.id;
    const setOfItems = [...newData.details];

    const response = await api.get(`get-gold-rate-value/${data.gold_type}`);

    value_for_one = (data.gold_rate / 24) * response.data.result.value;

    total_cost = (value_for_one / 8) * data.weight;

    // console.log(total_cost); //itemRow.cost

    data.cost = parseFloat(total_cost);

    setOfItems[datasetId]['cost'] = parseFloat(total_cost);

    setNewData({
      ...newData,
      details: setOfItems,
    });
  };

  const addCostForWastageAsIndex = async (data, e) => {
    let total_cost_one = 0;
    let total_cost_with_lc = 0;
    let total_cost_with_wastage = 0;
    let value_for_one = 0;
    let total_stone_weight = 0;

    let wastage_one = 0;
    let wastage_two = 0;
    let deducted_weight = 0;

    const targetInput = e.target;
    const datasetId = targetInput.dataset.id;
    const setOfItems = [...newData.details];

    const response = await api.get(`get-gold-rate-value/${data.gold_type}`);

    wastage_one = (data.weight / 8) * data.wastage_per_pound;

    value_for_one = (newData.daily_gold_rate / 24) * response.data.result.value;

    console.log(newData.daily_gold_rate);

    wastage_two = (value_for_one / 8) * wastage_one;

    total_cost_one = (value_for_one / 8) * data.weight;

    total_cost_with_lc = parseFloat(total_cost_one) + parseFloat(data.la_cost);

    deducted_weight =
      parseFloat(newData.supplier_gold) +
      parseFloat(wastage_one) +
      parseFloat(data.weight);

    setNewData({
      ...newData,
      supplier_gold: parseFloat(deducted_weight).toFixed(2),
    });

    total_cost_with_wastage =
      parseFloat(total_cost_with_lc) + parseFloat(wastage_two);

    console.log(newData.daily_gold_rate);

    setOfItems[datasetId]['cost'] = parseFloat(total_cost_with_wastage);
    setOfItems[datasetId]['tot_wastage'] = parseFloat(wastage_two);

    setNewData({
      ...newData,
      details: setOfItems,
    });

    // setItemRow({
    //   ...itemRow,
    //   tot_wastage: parseFloat(wastage_two).toFixed(2),
    //   cost: parseFloat(total_cost_with_wastage).toFixed(2),
    // });
  };

  const printReceipt = (trans_no, is_dupplicate) => {
    ResellRepairPrintA4Half.load(trans_no, cookie.get('user_branch'), is_dupplicate);
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
      is_melt: false
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

    if(!showModalState){
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
      stone_details : details
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
                {/* <div className="col-sm-2">
                  <label
                    htmlFor="vendor_invoice_no"
                    className="col-form-label mx-0"
                  >
                    Inv No
                  </label>
                </div> */}
              </div>
              <div className="form-group row mb-0">
                <label htmlFor="supplier" className="col-sm-2 col-form-label">
                  Store
                </label>
                <div className="col-sm-3 pr-0">
                  <input
                    type="text"
                    className="form-control form-control-sm bg-white"
                    id="store_id"
                    name="store_id"
                    value={newData.store_id}
                    // onChange={handleValueChanges}
                    readOnly
                    onKeyDown={(event) => {
                      if (event.key === 'F2') {
                        setListType('store');
                        showListSelection();
                      }
                    }}
                    placeholder="Press <F2>"
                  />
                </div>
                <div className="col-sm-7 pl-0">
                  <SDD
                    method={storeSelect}
                    data={stores}
                    value="description"
                    rowId="id"
                    classes="form-control form-control-sm"
                    placeholder="Store description"
                    listId="stores"
                    selected={newData.store_name}
                  />
                </div>
              </div>
              <div className="form-group row mb-0">
                {/* <label
                  htmlFor="vendor_invoice_no"
                  className="col-sm-2 col-form-label"
                >
                  Invoice No.
                </label>
                <div className="col-sm-3 pr-0">
                  <input
                    type="text"
                    id="vendor_invoice_no"
                    name="vendor_invoice_no"
                    className="form-control form-control-sm"
                    value={newData.vendor_invoice_no}
                    onChange={handleValueChanges}
                    placeholder="Supplier Invoice #"
                    maxLength="25"
                  />
                </div> */}
                {/* <label
                  htmlFor="supplier"
                  className="col-sm-2 offset-2 col-form-label text-right"
                >
                  PO Number
                </label>
                <div className="col-sm-3">
                  <input
                    type="number"
                    className="form-control form-control-sm text-right"
                    id="po_id"
                    name="po_id"
                    readOnly={controlsVisibility.po_no}
                    value={newData.po_id}
                    onChange={handleValueChanges}
                    onFocus={(e) => e.target.select()}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        loadPO();
                      }
                    }}
                    placeholder="Purchase Order ID"
                  />
                </div> */}
                {/* <div className="col-sm-7">
                  <SDD
                    method={supplierSelect}
                    data={vendors}
                    value="description"
                    rowId="code"
                    classes="form-control form-control-sm"
                    placeholder="Name"
                    listId="vendors"
                    selected={newData.vendor_name}
                  />
                </div> */}
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
                    readOnly
                  />
                </div>
              </div>
              <div className="form-group row mb-0">
              <label htmlFor="forfiet_purchase_id" className="col-sm-5 col-form-label">
                  Forfiet Purchase
                </label>
                <div className="col-sm-7">
                  <input
                    type="text"
                    className="form-control form-control-sm text-right"
                    id="forfiet_purchase_id"
                    name="forfiet_purchase_id"
                    value={newData.forfiet_purchase_id}
                    onChange={handleValueChanges}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        loadForPurchase();
                      }
                    }}
                  />
                </div>
              </div>

            </div>
          </div>
          <hr className="border-white" />
          <div className="row">
            <div className="table-responsive header-fixed-scrollable">
              <table className="table table-bordered table-sm table-hover">
                <thead className="thead-dark text-center">
                  <tr>
                  {/* rowSpan="2" */}
                    <td width="3%" rowSpan="2">  
                      #
                    </td>
                    <td width="15%">Item</td>
                    <td width="15%">Design</td>
                    <td width="15%">Gold Type</td>
                    <td width="15%">Quantity</td>
                    <td width="15%">Weight (g)</td>
                    <td width="15%">Repair Cost</td>
                    <td width="5%">More</td>
                  </tr>
                  <tr>
                    <td>
                      <SDD
                        method={itemSelect}
                        data={items}
                        value="itemname"
                        rowId="itemcode"
                        classes="form-control form-control-sm"
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
                        listId="items_design"
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
                    <td>
                      <input
                        type="number"
                        name="qty"
                        id="qty"
                        step="1"
                        className="form-control form-control-sm text-right"
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
                        className="form-control form-control-sm text-right"
                        value={itemRow.weight}
                        onChange={handleItemRowChanges}
                        placeholder="Weight"
                      />
                    </td>
                     <td>
                      <input
                        type="number"
                        name="repair_cost"
                        id="repair_cost"
                        step="0.01"
                        className="form-control form-control-sm text-right"
                        value={itemRow.repair_cost}
                        onChange={handleItemRowChanges}
                        placeholder="Repair Cost"
                      />
                    </td>
                    <td>
                      <SystemButton
                        type={'option-row'}
                        method={() => toggleMoreModal()}
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
                            className="form-control-plaintext form-control-sm"
                            value={newData.details[index].gold_type}
                            readOnly
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            name="qty"
                            id="qty"
                            step="1"
                            data-id={index}
                            className="form-control form-control-sm text-right"
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
                            className="form-control form-control-sm text-right"
                            value={newData.details[index].weight}
                            onChange={handleItemsChange}
                            placeholder="Weight"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            name="repair_cost"
                            id="repair_cost"
                            data-id={index}
                            className="form-control form-control-sm text-right"
                            value={newData.details[index].repair_cost}
                            onChange={handleItemsChange}
                            placeholder="Repair Cost (LKR)"
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
                          {/* <SystemButton
                            type={'remove-row'}
                            method={() =>
                              removeItem(newData.details[index].index)
                            }
                            showText={false}
                          /> */}
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
            <div className="col-sm-4">
              <div className="form-group row mb-0">
                <label htmlFor="discount" className="col-sm-5 col-form-label">
                  Discount
                </label>
                <div className="col-sm-7">
                  <input
                    type="number"
                    className="form-control form-control-sm text-right"
                    id="discount"
                    name="discount"
                    onFocus={(e) => e.target.select()}
                    value={newData.discount}
                    onChange={handleValueChanges}
                  />
                </div>
              </div>
              <div className="form-group row mb-0">
                <label htmlFor="net_amount" className="col-sm-5 col-form-label">
                  Net Amount
                </label>
                <div className="col-sm-7">
                  <input
                    type="text"
                    className="form-control-plaintext form-control-sm text-right kinda-important-text-2"
                    id="net_amount"
                    name="net_amount"
                    onFocus={(e) => e.target.select()}
                    value={newData.net_amount}
                    readOnly
                  />
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

      <FormModal
        moduleName={moduleNameMore}
        modalState={showModalState}
        toggleFormModal={toggleMoreModal}
        width="50%"
      >
        {/* <form onSubmit={handleSubmit} className="compactForm">
        </form> */}
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

              

              {/* <label htmlFor="code" className="col-sm-2 col-form-label">
                Stones
              </label>
              <div className="col-sm-4">
              <select
                  id="stone_type"
                  name="stone_type"
                  className="form-control form-control-sm"
                  required
                  onChange={handleItemRowChanges}
                  value={itemRow.stone_type}
                >
                  <option value="">---</option>
                  {stoneTypes.map((obj) => {
                    return (
                      <option key={obj.id} value={obj.id}>
                        {obj.description}
                      </option>
                    );
                  })}
                </select>
              </div> */}
            </div>

            {/* <div className="row">
              <label htmlFor="code" className="col-sm-2 col-form-label">
                Repair Cost
              </label>
              <div className="col-sm-4">
                <input
                        type="number"
                        name="repair_cost"
                        id="repair_cost"
                        step="0.01"
                        className="form-control form-control-sm"
                        value={itemRow.repair_cost}
                        onChange={handleItemRowChanges}
                        placeholder="Repair Cost"
                      />
                      </div>
              </div> */}

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
                        // onKeyDown={(event) => {
                        //   if (event.key === 'Enter') {
                        //     addCostForRateAsIndex(
                        //       newData.details[index],
                        //       event,
                        //     );
                        //   }
                        // }}
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
              method={(event) => {addNewItem(event)}}
              showText={true}
            />
          </div>
        </div>
      </FormModal>
      <br />
      <br />
    </div>
  );

  /* --- End of component renders --- */
};

export default ResellRepair;
