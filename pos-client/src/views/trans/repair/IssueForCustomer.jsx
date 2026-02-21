import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import {
  Loader,
  SDD,
  SystemButton,
  ListSelection,
  FormModal,
  CustomerListSelection,
} from '../../../components';
import { api, cookie, msg } from '../../../services';
import IssueForCustomerA4Half from '../../../printouts/IssueForCustomerA4Half';

const IssueForCustomer = () => { 
  // Module name
  const moduleName = 'Issue For Customer';
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

    customer_id: '',
    nicno: '',
    cusname: '',
    address: '',
    mobile: '',
    email: '',

    gold_type: '',
    repair_no: '',
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
    design_id: '',
    design: {
      designcode: '',
      designname: '',
    },
    metal_type: '',
    metal: {
      id: '',
      description: '',
    },
    color_type: '',
    color: {
      id: '',
      description: '',
    },
    gender_type: '',
    gender: {
      id: '',
      description: '',
    },
    stone_details: [],
    note: '',
    qty: 0,
    weight: 0,
    stone_weight: 0,
    cost: 0,
    lcv: 0,
    metal_type: '',
    gender_type: '',
    color_type: '',
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
    email: '',
    notes: '',
    is_blacklisted: 0,
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

  const [viewCustomerForm, setViewCustomerForm] = useState(false);

  const [viewCustomerListSelection, setViewCustomerListSelection] =
    useState(false);

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

      const response = await api.get(`issue-for-customer`);

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

        customer_id: '',
        nicno: '',
        cusname: '',
        address: '',
        mobile: '',
        email: '',

        stone_details: [],

        gold_type: '',
        repair_no: '',
        og_weight: 0,
        og_rate: response.data.daily_gold_rate.rate,
      });

      setCustomerData({
        customer_id: '',
        cusname: '',
        nicno: '',
        address: '',
        telNo: '',
        mobile: '',
        email: '',
        notes: '',
        is_blacklisted: 0,
        // b/ranch_code: response.data.branch.bc,
        // customer_no: response.data.customer_max_no,
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

  const getRepairDetails = async () => {
    try {
      setIsLoading({
        ...isLoading,
        init: true,
      });
      // newData.repair_no
      const response = await api.get(
        `get-repair-details/${newData.repair_no}/${newData.bc_no}`,
      );

      if (response.data.customer_repair) {
        let dataObj = response.data.customer_repair;
        dataObj.repair_no = dataObj.nno;
        dataObj.nno = response.data.new_id;
        dataObj.customer_id = dataObj.customer_id;
        dataObj.nicno = dataObj.customer.nicno;
        dataObj.cusname = dataObj.customer.cusname;
        dataObj.address = dataObj.customer.address;
        dataObj.mobile = dataObj.customer.mobile;
        dataObj.email = dataObj.customer.email;

        const details = response.data.customer_repair.details.map((item) => {
          return { ...item, index: uuidv4() };
        });

        dataObj.details = details;

        setNewData(dataObj);
      }else if(response.data.record_exsist){
        msg.warning('This item already issued to customer!');
        fetchData();
      } else {
        msg.warning('this item still not repeired!');
        fetchData();
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
          design_id: '',
          design: {
            designcode: '',
            designname: '',
          },
          metal_type: '',
          metal: {
            id: '',
            description: '',
          },
          color_type: '',
          color: {
            id: '',
            description: '',
          },
          gender_type: '',
          gender: {
            id: '',
            description: '',
          },
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
            design_id: '',
            design: {
              designcode: '',
              designname: '',
            },
            metal_type: '',
            metal: {
              id: '',
              description: '',
            },
            color_type: '',
            color: {
              id: '',
              description: '',
            },
            gender_type: '',
            gender: {
              id: '',
              description: '',
            },
            lcv: 0,
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
    if (checkBeforeSave()) {
      await save();
    }
    // resetAll();
  };

  const save = async () => {
    try {
      const response = await api.post('issue-for-customer').values(newData);

      if (parseInt(response.data) > 0) {
        // printReceipt(parseInt(response.data), false);
        fetchData();
        msg.success('Saved Successfully.');
      }
    } catch (err) {
      msg.error(err);
      return;
    }
  };

  const checkBeforeSave = () => {
    if (newData.vendor_id === '' || newData.vendor_name === '') {
      msg.warning('Enter Vendor before save the form.');
      return false;
    }

    // if (newData.employee_id === '' || newData.employee_name === '') {
    //   msg.warning('Select a salesman before save the invoice.');
    //   return false;
    // }

    return true;
  };

  const addNewItem = () => {
    console.log(itemRow);
    setNewData({
      ...newData,
      details: [...newData.details, itemRow],
    });

    // toggleMoreModal();
    // clearStoneNewData();

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
      metal_type: '',
      metal: {
        id: '',
        description: '',
      },
      color_type: '',
      color: {
        id: '',
        description: '',
      },
      gender_type: '',
      gender: {
        id: '',
        description: '',
      },
      gold_type: '',
      stone_details: [],
      note: '',
      qty: 0,
      weight: 0,
      stone_weight: 0,
      cost: 0,
      lcv: 0,
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
    IssueForCustomerA4Half.loadInvoice(
      trans_no,
      cookie.get('user_branch'),
      is_dupplicate,
    );
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

      customer_id: '',
      nicno: '',
      cusname: '',
      address: '',
      mobile: '',
      email: '',
    });

    setCustomerData({
        customer_id: '',
        cusname: '',
        nicno: '',
        address: '',
        telNo: '',
        mobile: '',
        email: '',
        notes: '',
        is_blacklisted: 0,
        // branch_code: response.data.branch.bc,
        // customer_no: response.data.customer_max_no,
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
      lcv: 0,
      design_id: '',
      design: {
        designcode: '',
        designname: '',
      },
      metal_type: '',
      metal: {
        id: '',
        description: '',
      },
      color_type: '',
      color: {
        id: '',
        description: '',
      },
      gender_type: '',
      gender: {
        id: '',
        description: '',
      },
      metal_type: '',
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
    setNewData({
      ...newData,
      stone_details: [...newData.stone_details, itemStoneRow],
    });

    setItemRow({
      ...itemRow,
      stone_details: [...itemRow.stone_details, itemStoneRow],
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

  const colorSelect = (selectedObj) => {
    setItemRow({
      ...itemRow,
      color_type: selectedObj.id,
      color: {
        id: '',
        description: selectedObj.description,
      },
    });
  };

  const genderSelect = (selectedObj) => {
    setItemRow({
      ...itemRow,
      gender_type: selectedObj.id,
      gender: {
        id: '',
        description: selectedObj.description,
      },
    });
  };

  const getCustomer = async (e) => {
    if (e.key === 'Enter') {
      try {
        const response = await api
          .post(`get_customer_by_nic`)
          .values({ nic: newData.mobile });

        if (response.data.customer === null) {
          msg.warning(
            'There is no customer exist for entered Mobile No. Please check the Mobile No or create new by clicking Add button.',
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
            nicno: response.data.customer.nicno,
          });
        }
      } catch (error) {
        return msg.error('Unable to get customer details.');
      }
    } else if (e.key === 'F2') {
      showCustomerListSelection();
    }
  };

  const showCustomerForm = () => {
    setViewCustomerForm(!viewCustomerForm);
  };

  const showCustomerListSelection = () => {
    setViewCustomerListSelection(!viewCustomerListSelection);
  };

  const selectCustomer = (dataObj) => {
    console.log(dataObj);
    setCustomerData({ ...dataObj, branch_code: dataObj.bc });
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
      <CustomerListSelection
        toggleFormModal={showCustomerListSelection}
        showModalState={viewCustomerListSelection}
        selectRow={selectCustomer}
      />
      <br />
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
                <div className="col-sm-3 ">
                  <input
                    name="mobile"
                    id="mobile"
                    className="form-control form-control-sm "
                    maxLength="10"
                    placeholder="Mobile No"
                    autoComplete="no"
                    value={newData.mobile}
                    onKeyDown={getCustomer}
                    onChange={handleValueChanges}
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
              </div>

              <div className="row">
                <label htmlFor="notes" className="col-sm-1 col-form-label ">
                  NIC
                </label>
                <div className="col-sm-3">
                  <input
                    type="text"
                    className="form-control form-control-sm "
                    id="nicno"
                    name="nicno"
                    value={newData.nicno}
                    onChange={handleValueChanges}
                    placeholder="NIC"
                    autoComplete="no"
                    readOnly
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
                    onChange={handleValueChanges}
                    placeholder="Customer Address"
                    readOnly
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
                    value={newData.nno}
                    readOnly
                  />
                </div>
              </div>

              <div className="row ">
                <label htmlFor="nno" className="col-sm-4 col-form-label">
                  Issued No.
                </label>
                <div className="col-sm-8">
                  <input
                    type="text"
                    className="form-control form-control-sm rounded-0"
                    id="repair_no"
                    name="repair_no"
                    value={newData.repair_no}
                    onChange={handleValueChanges}
                    onFocus={(e) => e.target.select()}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        getRepairDetails();
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          <br />
          <hr />
          <br />
          <div className="row">
            <div className="table-responsive header-fixed-scrollable">
              <table className="table table-bordered table-sm table-hover">
                <thead className="thead-dark text-center">
                  <tr>
                    <td width="2%">#</td>
                    <td width="12%">Item Name.</td>
                    <td width="10%">Design</td>
                    <td width="10%">Gold Type</td>
                    <td width="10%">Metal</td>
                    <td width="10%">Color</td>
                    <td width="10%">Gender</td>
                    <td width="17%">Description</td>
                    <td width="10%">Weight (g)</td>
                    <td width="13%">Cost</td>
                    <td width="3%"></td>
                  </tr>
                  <tr>
                    <td></td>
                    <td>
                      <input
                        type="text"
                        name="item_name"
                        id="item_name"
                        className="form-control form-control-sm rounded-0"
                        value={itemRow.item_name}
                        onChange={handleItemRowChanges}
                        placeholder="Item Name"
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
                      <SDD
                        method={colorSelect}
                        data={colorTypes}
                        value="description"
                        rowId="id"
                        classes="form-control form-control-sm"
                        placeholder="Color"
                        listId="color_type"
                        selected={itemRow.color.description}
                      />
                    </td>
                    <td>
                      <SDD
                        method={genderSelect}
                        data={genderTypes}
                        value="description"
                        rowId="id"
                        classes="form-control form-control-sm"
                        placeholder="Gender"
                        listId="gender_type"
                        selected={itemRow.gender.description}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="description"
                        id="description"
                        step="0.01"
                        className="form-control form-control-sm rounded-0 text-right"
                        value={itemRow.description}
                        onChange={handleItemRowChanges}
                        placeholder="Description"
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
                    <td>
                      <input
                        type="number"
                        name="cost"
                        id="cost"
                        step="0.01"
                        className="form-control form-control-sm rounded-0 text-right"
                        value={itemRow.cost}
                        onChange={handleItemRowChanges}
                        placeholder="Cost"
                      />
                    </td>
                    <td>
                      <SystemButton
                        type={'add-row'}
                        method={() => addNewItem()}
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
                            className="form-control-plaintext form-control-sm rounded-0"
                            value={newData.details[index].item_name}
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
                        <td>
                          <input
                            type="text"
                            name="metal_type"
                            id="metal_type"
                            step="0.01"
                            data-id={index}
                            className="form-control form-control-sm text-right"
                            value={newData.details[index].metal.description}
                            onChange={handleItemsChange}
                            placeholder="Metal Type"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            name="color_type"
                            id="color_type"
                            data-id={index}
                            className="form-control form-control-sm text-right"
                            value={newData.details[index].color.description}
                            onChange={handleItemsChange}
                            placeholder="Color Type"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            name="gender_type"
                            id="gender_type"
                            data-id={index}
                            className="form-control form-control-sm text-right"
                            value={newData.details[index].gender.description}
                            onChange={handleItemsChange}
                            placeholder="Gender Type"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            name="description"
                            id="description"
                            data-id={index}
                            className="form-control form-control-sm text-right"
                            value={newData.details[index].description}
                            onChange={handleItemsChange}
                            placeholder="Description"
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
                        <td>
                          <input
                            type="number"
                            name="cost"
                            id="cost"
                            step="0.01"
                            data-id={index}
                            className="form-control form-control-sm rounded-0 text-right"
                            value={newData.details[index].cost}
                            onChange={handleItemsChange}
                            placeholder="Cost"
                          />
                        </td>
                        {/* <td className="text-center">
                          <SystemButton
                            type={'option-row'}
                            method={() =>
                              toggleMoreModalDetails(newData.details[index])
                            }
                            showText={false}
                          />
                        </td> */}
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
                    <th className="text-center" colSpan="8">
                      Total Weight
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
                    <td>
                      <input
                        type="text"
                        className="form-control-plaintext text-right kinda-important-text-3"
                        id="total_weight"
                        name="total_weight"
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
    </div>
  );

  /* --- End of component renders --- */
};

export default IssueForCustomer;
