import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import {
  Loader,
  SDD,
  SystemButton,
  ListSelection,
  CustomerListSelection,
  FormModal,
} from '../../../components';
import { api, cookie, msg } from '../../../services';
import CustomerForm from '../../master/customers/CustomerForm';
import PaymentModel from '../PaymentModel';
// import InvoicePrint from '../../../printouts/InvoicePrint';
import CustomerRepairA4Half from '../../../printouts/CustomerRepairA4Half'; 

const CustomerRepair = () => {
  // Module name
  const moduleName = 'Customer Repair';
  const moduleNameMore = 'More';

  /* --- State declarationss --- */

  const [isLoading, setIsLoading] = useState({
    init: false,
  });

  const [isEdit, setIsEdit] = useState(false);

  const [design, setDesign] = useState([]);

  const [goldTypes, setGoldTypes] = useState([]);

  const [metalTypes, setMetalTypes] = useState([]);

  const [colorTypes, setColorTypes] = useState([]);

  const [stoneTypes, setStoneTypes] = useState([]);

  const [genderTypes, setGenderTypes] = useState([]);

  const [showModalState, setShowModalState] = useState(false);

  const [newData, setNewData] = useState({
    user_id: cookie.get('user_id'),
    bc_no: cookie.get('user_branch'),
    newDate: '',
    newId: '',

    ddate: '',
    id: '',
    gold_rate: '',
    store_id: '',
    sales_order_id: '',

    customer_id: '',
    nicno: '',
    cusname: '',
    address: '',
    mobile: '',
    email: '',

    memo: '',
    employee_id: '',
    employee_name: '',

    tot_qty: 0,
    tot_weight: 0,
    tot_st_weight: 0,
    tot_price: 0,
    tot_amount: 0,

    discount: 0,
    net_amount: 0,

    details: [],
    stone_details: [],
    advance_amount: 0.0,
  });

  const [paymentData, setPaymentData] = useState({
    type: 'Invoice',
    invoice_amount: 0.0,
    cash_amount: 0.0,
    card_amount: 0.0,
    old_gold_amount: 0.0,
    return_amount: 0.0,
    credit_amount: 0.0,
    crn_amount: 0.0,
    drn_amount: 0.0,
    bank_deposit: 0.0,
    bank_account_id: '',
    note: '',
    og_weight: '',
    og_rate: '',
    gold_type: '',
    fc_amount: 0.0,
    currency_id: '',
    currency_rate: 0.0,
    currency_qty: 0,
    note: '',
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

  const [itemRow, setItemRow] = useState({
    index: uuidv4(),
    tag_no: '',
    item_id: '',
    item_name: '',
    description: '',
    gold_type: '',
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
    weight: 0,
    st_weight: 0,
    cost: 0,
    price: 0,
    agree_rate: 0,
    stone_details: [],
  });

  const [itemStoneRow, setItemStoneRow] = useState({
    stone_weight: 0.0,
    stone_type: '',
    stone_type_name: '',
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

  /* --- List Selection Required ---- */
  const [listType, setListType] = useState([]);
  const [viewListSelection, setViewListSelection] = useState(false);

  const showListSelection = () => {
    setViewListSelection(!viewListSelection);
  };

  const selectRow = (dataObj) => {
    if (listType === 'officer') {
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
    } else if (listType === 'tags') {
      setItemRow({
        index: uuidv4(),
        item_id: '',
        item_name: '',
        design_id: '',
        gold_type: '',
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
        weight: 0,
        st_weight: 0,
        cost: 0,
        price: 0,
        agree_rate: 0,
        tag_no: dataObj.tag_no,
      });
    }
  };

  const setColulmns = () => {
    if (listType === 'officer') {
      return officerColumns;
    } else if (listType === 'stores') {
      return storeColumns;
    } else if (listType === 'tags') {
      return tagColumns;
    } else {
      return null;
    }
  };

  const officerColumns = [
    { title: 'Code', name: 'id', searchable: true },
    { title: 'Name', name: 'name', searchable: true },
  ];
  const storeColumns = [
    { title: 'Code', name: 'code', searchable: true },
    { title: 'Description', name: 'description', searchable: true },
  ];
  const tagColumns = [
    { title: 'Tag', name: 'tag_no', searchable: true },
    { title: 'Item', name: 'item_name', searchable: true },
  ];

  const setListData = () => {
    if (listType === 'officer') {
      return employees;
    } else if (listType === 'stores') {
      return stores;
    } else if (listType === 'tags') {
      return tags;
    } else {
      return null;
    }
  };

  /* ---  End of List Selection Required ---- */

  /* --- Customer List Selection Required ---- */
  const [viewCustomerListSelection, setViewCustomerListSelection] =
    useState(false);
  const showCustomerListSelection = () => {
    setViewCustomerListSelection(!viewCustomerListSelection);
  };

  const selectCustomer = (dataObj) => {
    setCustomerData({ ...dataObj, branch_code: dataObj.bc });
  };
  /* ---  End of Customer List Selection Required ---- */
  /* --- Component functions --- */

  const fetchData = async () => {
    try {
      setIsLoading({
        ...isLoading,
        init: true,
      });

      const response = await api.get(`customer-repair`);

      setTags(response.data.tags);
      setStores(response.data.stores);
      setDesign(response.data.designs);

      setGenderTypes(response.data.gender);

      setMetalTypes(response.data.metal);
      setColorTypes(response.data.color);
      setStoneTypes(response.data.stone);

      setNewData({
        ...newData,
        ddate: response.data.ddate,
        newDate: response.data.ddate,
        id: response.data.new_id,
        newId: response.data.new_id,

        gold_rate: '',
        store_id: '',
        customer_id: '',
        sales_order_id: '',
        nicno: '',
        cusname: '',
        address: '',
        mobile: '',
        email: '',

        memo: '',
        employee_id: response.data.employees.id,
        employee_name: response.data.employees.name,

        tot_qty: 0,
        tot_weight: 0,
        tot_st_weight: 0,
        tot_price: 0,
        tot_amount: 0,

        discount: 0,
        net_amount: 0,

        details: [],
        stone_details: [],
      });

      // if (response.data.employees) {
      //   setNewData({
      //     ...newData,
      //     employee_id: response.data.employees.id,
      //     employee_name: response.data.employees.name,
      //   });
      // }

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
        branch_code: response.data.branch.bc,
        customer_no: response.data.customer_max_no,
      });

      clearItemRow();

      clearPayments();

      getGoldTypes();

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
    email,
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
      email: email,
      notes: notes,
      is_blacklisted: isBlacklisted,
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

  const updatePayments = (
    cash_amount,
    card_amount,
    old_gold_amount,
    return_amount,
    credit_amount,
    crn_amount,
    drn_amount,
    bank_deposit,
    bank_account_id,
    note,
    og_weight,
    og_rate,
    gold_type,
    fc_amount,
    currency_id,
    currency_rate,
    currency_qty,
  ) => {
    setPaymentData({
      ...paymentData,
      cash_amount: cash_amount,
      card_amount: card_amount,
      old_gold_amount: old_gold_amount,
      return_amount: return_amount,
      credit_amount: credit_amount,
      crn_amount: crn_amount,
      drn_amount: drn_amount,
      bank_deposit: bank_deposit,
      bank_account_id: bank_account_id,
      note: note,
      og_weight: og_weight,
      og_rate: og_rate,
      gold_type: gold_type,
      fc_amount: fc_amount,
      currency_id: currency_id,
      currency_rate: currency_rate,
      currency_qty: currency_qty,
    });

    console.log(bank_deposit, credit_amount);
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
      const response = await api.post('customer-repair').values({
        repair: newData,
        // payment: paymentData,
        customer: customerData,
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
        console.log(tag_item)
        setItemRow({
          ...itemRow,
          item_id: tag_item.item_id,
          item_name: tag_item.item_name,
          weight: tag_item.weight,
          st_weight: tag_item.weight_stome,
          cost: tag_item.cost,
          price: tag_item.max_price,
          agree_rate: 0,
          gold_type: tag_item.gold_type,
          design_id: tag_item.design_id,
          design: {
            designcode: tag_item.design.design_id,
            designname: tag_item.design.designname,
          },
          metal_type: tag_item.metal_type,
          metal: {
            id: tag_item.metal.id,
            description: tag_item.metal.description,
          },
          color_type: tag_item.color_type,
          color: {
            id: tag_item.color.id,
            description: tag_item.color.description,
          },
          gender_type: tag_item.gender_type,
          gender: {
            id: tag_item.gender.id,
            description: tag_item.gender.description,
          },
        });
      } else {
        clearItemRow();
      }
    } else if (e.key === 'F2') {
      setListType('tags');
      showListSelection();
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
      gold_type: '',
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
      weight: 0,
      st_weight: 0,
      cost: 0,
      price: 0,
      agree_rate: 0,
      stone_details: [],
    });
  };

  const clearPayments = () => {
    setPaymentData({
      type: 'Invoice',
      invoice_amount: 0.0,
      cash_amount: 0.0,
      card_amount: 0.0,
      old_gold_amount: 0.0,
      return_amount: 0.0,
      credit_amount: 0.0,
      crn_amount: 0.0,
      bank_deposit: 0.0,
      bank_account_id: '',
      note: '',
      og_weight: '',
      og_rate: '',
      gold_type: '',
      fc_amount: 0.0,
      currency_id: '',
      currency_rate: '',
      currency_qty: '',
      note: '',
    });
  };

  const checkBeforeAddItem = () => {
    // if (itemRow.item_name === '') {
    //   msg.warning('Enter Tag No and load Item details.');
    //   return false;
    // }
    if (itemRow.weight === '' || itemRow.weight === 0) {
      msg.warning('Enter Tag No and load Item details.');
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
    let advance_amount =
      parseFloat(newData.advance_amount) != 0
        ? parseFloat(newData.advance_amount)
        : 0.0;

    newData.details.forEach((row) => {
      tot_qty++;
      tot_weight += parseFloat(row.weight);
      tot_st_weight += parseFloat(row.st_weight);
      tot_price += parseFloat(row.price);
      tot_amount += parseFloat(row.agree_rate); //- advance_amount;
    });

    setNewData({
      ...newData,
      tot_qty: tot_qty,
      tot_weight: tot_weight,
      tot_st_weight: tot_st_weight,
      tot_price: tot_price.toFixed(2),
      tot_amount: tot_amount.toFixed(2),
    });

    setPaymentData({
      ...paymentData,
      invoice_amount: tot_amount.toFixed(2),
    });
  };

  const loadSalesOrder = async (e) => {
    if (e.key === 'Enter') {
      const response = await api
        .post('sales-orders/get-details')
        .values({ trans_no: newData.sales_order_id, bc_no: newData.bc_no });

      const salesOder = response.data.sales_order;

      if (salesOder.is_posted === true) {
        msg.warning('Entered sales order already attched to a invoice.');
        return;
      }

      let details = [];
      if (salesOder.order_type === 'N') {
        const tagResponse = await api
          .post('get_tag_by_sales_order')
          .values({ sales_order_id: newData.sales_order_id });

        const tag_item = tagResponse.data.tagged_items;

        if (tag_item === '' || tag_item === null) {
          msg.warning('Need to create tag for the entered Sales Order.');
          return;
        } else {
          details.push({
            index: uuidv4(),
            tag_id: tag_item.id,
            tag_no: tag_item.tag_no,
            item_id: tag_item.item_id,
            item_name: tag_item.item_name,
            weight: tag_item.weight,
            st_weight: tag_item.weight_stome,
            cost: tag_item.cost,
            price: tag_item.max_price,
            agree_rate: tag_item.max_price,
          });
        }
      } else {
        details = salesOder.details.map((item) => {
          return {
            index: uuidv4(),
            tag_id: item.tag_id,
            tag_no: item.tag_no,
            item_id: item.tag.item_id,
            item_name: item.tag.item_name,
            weight: item.weight,
            st_weight: item.st_weight,
            cost: item.tag.cost,
            price: item.price,
            agree_rate: item.agree_rate,
          };
        });
      }

      setNewData({
        ...newData,
        order_type: salesOder.order_type,
        // ddate: salesOder.ddate,
        customer_id: salesOder.customer_id,
        nicno: salesOder.customer.nicno,
        cusname: salesOder.customer.cusname,
        address: salesOder.customer.address,
        mobile: salesOder.customer.mobile,

        memo: salesOder.memo,
        employee_id: salesOder.employee_id,
        employee_name: salesOder.salesman.name,

        tot_qty: salesOder.tot_qty,
        tot_weight: salesOder.tot_weight,
        tot_st_weight: salesOder.tot_st_weight,
        tot_amount: salesOder.tot_amount,
        advance_amount: salesOder.advance ? salesOder.advance.amount : 0.0,

        details: details,
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
      sales_order_id: '',

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
      tot_amount: 0,

      discount: 0,
      net_amount: 0,

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
    const result = await CustomerRepairA4Half.loadInvoice(
      invoice_no,
      cookie.get('user_branch'),
      is_dupplicate,
    );

    if (result === false) msg.warning('Invalid invoice no..');
  };

  const saveFromPaymentModel = () => {
    handleSubmit();
  };

  const getGoldTypes = async () => {
    const response = await api.get(`get-gold-types`);

    if (response.data.gold_types) {
      setGoldTypes(response.data.gold_types);
    }
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

  const toggleMoreModal = () => {
    setShowModalState(!showModalState);

    // clearStoneItemRow();
    // clearStoneNewData();
  };

  const stoneSelect = (selectedObj) => {
    console.log(selectedObj);
    setItemStoneRow({
      ...itemStoneRow,
      stone_type: selectedObj.id,
      stone_type_name: selectedObj.description,
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
        callBack={saveFromPaymentModel}
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

                <div className="col-sm-2">
                  <SystemButton
                    type="add-new"
                    method={showCustomerForm}
                    showText
                    btnText="Add"
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
                    value={newData.id}
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>
          <hr className="border-white " />
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
                    <td width="20%">Description</td>
                    <td width="10%">Weight (g)</td>
                    <td width="3%"></td>
                  </tr>
                  <tr>
                    <td></td>
                    <td>
                      <input
                        type="text"
                        name="tag_no"
                        id="tag_no"
                        className="form-control form-control-sm "
                        value={itemRow.tag_no}
                        onChange={handleItemRowChanges}
                        // onKeyDown={loadItemDetails}
                        placeholder="Tag No."
                        autoComplete="no"
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
                        className="form-control form-control-sm "
                        value={itemRow.description}
                        onChange={handleItemRowChanges}
                        // onKeyDown={loadItemDetails}
                        placeholder="Description"
                        autoComplete="no"
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
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              addNewItem();
                            }
                          }}
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
                            name="tag_no"
                            id="tag_no"
                            data-id={index}
                            className="form-control-plaintext form-control-sm "
                            value={newData.details[index].tag_no}
                            readOnly
                          />
                        </td>
                        {/* <td>
                          <input
                            type="text"
                            name="item_name"
                            id="item_name"
                            data-id={index}
                            className="form-control-plaintext form-control-sm"
                            value={newData.details[index].item.itemname}
                            readOnly
                          />
                        </td> */}
                        <td>
                          <input
                            type="text"
                            name="designname"
                            id="designname"
                            data-id={index}
                            className="form-control form-control-sm"
                            value={newData.details[index].design.designname}
                            onChange={handleItemsChange}
                            placeholder="Notes"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            name="gold_type"
                            id="gold_type"
                            step="1"
                            data-id={index}
                            className="form-control form-control-sm text-right"
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
                            className="form-control form-control-sm  text-right"
                            value={newData.details[index].weight}
                            onChange={handleItemsChange}
                            placeholder="Weight"
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
                    <th className="text-center" colSpan="7">
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
                    <td></td>
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
              <div className="form-group row mb-0">
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
                    placeholder="Officer"
                    autoComplete="no"
                    readOnly
                  />
                </div>
                {/* <div className="col-sm-8">
                  <SDD
                    method={officerSelect}
                    data={employees}
                    value="name"
                    rowId="id"
                    classes="form-control form-control-sm "
                    placeholder="Salesman"
                    listId="employees"
                    selected={newData.employee_name}
                  />
                </div> */}
              </div>
            </div>
          </div>
          <hr className="border-white " />
          <div className="row">
            {/* <div className="col-sm-2">
              <SystemButton
                type="no-form-save"
                showText
                method={handleSubmit}
              />
            </div> */}
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
            <div className="col-sm-2">
                <SystemButton
                  type="no-form-save"
                  showText
                  method={handleSubmit}
                />
              </div>
          </div>
          <hr className="border-white " />
        </div>
      )}

{/* <FormModal
        moduleName={moduleNameMore}
        modalState={showModalState}
        toggleFormModal={toggleMoreModal}
        width="50%"
      >
        <div>
          <div className="modal-body">
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
      </FormModal> */}
    </div>
  );

  /* --- End of component renders --- */
};

export default CustomerRepair;
