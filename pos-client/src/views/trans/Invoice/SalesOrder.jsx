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
import SalesOrderPrint from '../../../printouts/SalesOrderPrintA4Half';

const SalesOrder = () => {
  // Module name
  const moduleName = 'Sales Order';
  const moduleNameMore = 'More';

  /* --- State declarationss --- */

  const [isLoading, setIsLoading] = useState({
    init: false,
  });

  const [isEdit, setIsEdit] = useState(false);

  const [jewItems, setJewItems] = useState([]);

  const [newData, setNewData] = useState({
    user_id: cookie.get('user_id'),
    bc_no: cookie.get('user_branch'),
    newDate: '',
    newId: '',

    ddate: '',
    id: '',

    order_type: 'N',
    gold_rate: '',
    store_id: '',
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

    item_description: '',
    design_image: '',
    design_image1: '',
    design_image2: '',
    design_image_data: '',
    design_image_url: '',
    design_image_url1: '',
    design_image_url2: '',

    details: [],
    image: [],
    design_images: [],
    newItems: [],
    stone_details: [],
  });

  const [itemStoneRow, setItemStoneRow] = useState({
    stone_weight: 0.0,
    stone_type: '',
    stone_type_name: '',
  });

  const [designImage, setDesignImage] = useState([]);
  const [designImage1, setDesignImage1] = useState([]);
  const [designImage2, setDesignImage2] = useState([]);

  const [design, setDesign] = useState([]);

  const [goldTypes, setGoldTypes] = useState([]);

  const [metalTypes, setMetalTypes] = useState([]);

  const [colorTypes, setColorTypes] = useState([]);

  const [stoneTypes, setStoneTypes] = useState([]);

  const [genderTypes, setGenderTypes] = useState([]);

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
    tag_id: 0,
    tag_no: 0,
    item_id: 0,
    item: {
      itemcode: '',
      itemname: '',
    },
    design_id: '',
    design: {
      designcode: '',
      designname: '',
    },
    item_name: '',
    weight: 0,
    st_weight: 0,
    cost: 0,
    price: 0,
    agree_rate: 0,
  });

  const [newItem, setNewItem] = useState({
    index: uuidv4(),
    item_id: '',
    qty: 0,
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
    item_description: '',
    stone_details: [],
    gold_type: '',
    weight: 0,
    design_url: '',
    price: 0,
    agree_rate: 0,
    metal_type: '',
    gender_type: '',
    color_type: '',
  });

  const [stores, setStores] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [tags, setTags] = useState([]);
  const [viewCustomerForm, setViewCustomerForm] = useState(false);
  const [viewPaymentForm, setViewPaymentForm] = useState(false);
  const [entities, setEntities] = useState([]);

  const [imageArray, setImageArray] = useState([]);

  const [showModalState, setShowModalState] = useState(false);

  //const image = [];
  const imageArrayDet = [];

  /* --- End of state declarations --- */

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

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    calColumnTotals();
  }, [newData.details]);

  useEffect(() => {
    calTotalNewTag();
  }, [newData.newItems]);

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
    if (listType === 'employee') {
      setNewData({
        ...newData,
        employee_id: dataObj.id,
        employee_name: dataObj.name,
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
    if (listType === 'employee') {
      return employeeColumns;
    } else if (listType === 'stores') {
      return storeColumns;
    } else if (listType === 'tags') {
      return tagColumns;
    } else {
      return null;
    }
  };

  const employeeColumns = [
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
    if (listType === 'employee') {
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

  /* --- Component functions --- */
  const fetchData = async () => {
    try {
      setIsLoading({
        ...isLoading,
        init: true,
      });

      const response = await api.get(`sales-orders`);

      setEmployees(response.data.employees);

      setJewItems(response.data.items);

      setDesign(response.data.designs);

      setGenderTypes(response.data.gender);

      setMetalTypes(response.data.metal);
      setColorTypes(response.data.color);
      setStoneTypes(response.data.stone);

      setTags(response.data.tags);
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
        tot_amount: 0,

        discount: 0,
        net_amount: 0,

        details: [],
        newItems: [],
        stone_details: [],
      });

      setStores(response.data.stores);

      setCustomerData({
        customer_id: '',
        cusname: '',
        nicno: '',
        address: '',
        telNo: '',
        mobile: '',
        notes: '',
        is_blacklisted: 0,
        branch_code: response.data.branch.bc,
        customer_no: response.data.customer_max_no,
      });

      clearItemRow();

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

  const itemSelect = (selectedObj) => {
    setNewData({
      ...newData,
      item_id: selectedObj.itemcode,
    });
    // item_id
    setItemRow({
      ...itemRow,
      item_id: selectedObj.itemcode,
      item: {
        itemcode: selectedObj.itemcode,
        itemname: selectedObj.itemname,
      },
    });
  };

  const itemSelectNew = (selectedObj) => {
    setNewItem({
      ...newItem,
      item_id: selectedObj.itemcode,
      item: {
        itemcode: selectedObj.itemcode,
        itemname: selectedObj.itemname,
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

    setNewItem({
      ...newItem,
      [inputName]: inputValue,
    });
  };

  const handleItemTagRowChanges = (e) => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (checkBeforeSave() === false) return;
    // await saveImage();
    await save();
  };

  const save = async () => {
    if (isEdit === false) {
      try {
        const response = await api.post('sales-orders').values({
          sales_order: newData,
          customer: customerData,
          image: designImage,
        });

        if (parseInt(response.data) > 0) {
          printReceipt(response.data, false);
          // resetAll();
          if (newData.order_type === 'N') {
            if (newData.design_image_url) {
              saveImage(response.data);
            }
            // saveImage(response.data);
            if (newData.design_image_url1) {
              saveImage1(response.data);
            }
            if (newData.design_image_url2) {
              saveImage2(response.data);
            }
          }
          fetchData();
          msg.success('Saved successfully!');
        }
      } catch (err) {
        msg.error(err);
        return;
      }
    } else {
      try {
        const response = await api
          .update(`sales-orders/${newData.id}/update`)
          .values({ sales_order: newData });

        if (response.error) {
          Object.values(response.error).forEach((err) => {
            msg.error(err[0]);
          });
          return;
        }

        if (parseInt(response.data) > 0) {
          printReceipt(response.data, false);
          // resetAll();
          fetchData();
          msg.success('Saved successfully!');
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsEdit(false);
        resetAll();
        fetchData();
      }
    }
  };

  const saveImage = async (salesOrderId) => {
    // const formData = designImage;

    const formData = designImage;
    // const data = [
    //   {'sales_order_id':salesOrderId},
    //   {'data':newData.design_image}
    // ];
    // formData.append(
    //   'files',
    //   newData.design_images,
    // );
    formData.append('sales_order_id', salesOrderId);
    // formData.append('design_image1, designImage);
    // formData.append('design_image2', designImage2);

    // const formDatafinal.append();

    const response = await api
      .post('sales-orders/store-design-image')
      .values(formData);

    console.log(response);
  };

  const saveImage1 = async (salesOrderId) => {
    const formData = designImage1;

    formData.append('sales_order_id', salesOrderId);

    const response = await api
      .post('sales-orders/store-design-image-one')
      .values(formData);

    console.log(response);
  };

  const saveImage2 = async (salesOrderId) => {
    const formData = designImage2;

    formData.append('sales_order_id', salesOrderId);

    const response = await api
      .post('sales-orders/store-design-image-two')
      .values(formData);

    console.log(response);
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

    /*  if (newData.store_id === '') {
      msg.warning('Select store before save the invoice.');
      return false;
    } */

    console.log(parseFloat(newData.tot_amount));

    if (parseFloat(newData.newItems.tot_amount) <= 0) {
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
          tag_id: tag_item.id,
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

  const addNewItemNewDesigns = () => {
    // if (checkBeforeAddItem() === false) return;
    if (newData.newItems.length > 2) {
      msg.warning('You can select only 3 items at once.');
    } else {
      setNewData({
        ...newData,
        newItems: [...newData.newItems, newItem],
      });

      toggleMoreModal();
      clearStoneNewData();
      clearNewItem();
    }

    //     newData.total_qty
    // newData.total_weight
    // newData.total_amount

    // clearNewItem();
  };

  const clearItemRow = () => {
    setItemRow({
      index: uuidv4(),
      tag_id: '',
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

  const clearNewItem = () => {
    setNewItem({
      index: uuidv4(),
      item_id: '',
      qty: 0,
      item: {
        itemcode: '',
        itemname: '',
      },
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
      metal_type: '',
      gender_type: '',
      color_type: '',
      item_description: '',
      weight: 0,
      design_url: '',
      price: 0,
      stone_details: [],
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
      tot_amount: tot_amount.toFixed(2),
    });
  };

  const calTotalNewTag = () => {
    let tot_qty = 0;
    let tot_weight = 0;
    let tot_st_weight = 0;
    let tot_price = 0;
    let tot_amount = 0;

    newData.newItems.forEach((row) => {
      tot_qty++;
      tot_weight += parseFloat(row.weight);
      tot_price += parseFloat(row.price);
      tot_amount += parseFloat(row.price);
    });

    setNewData({
      ...newData,
      total_qty: tot_qty,
      total_weight: tot_weight,
      tot_price: tot_price.toFixed(2),
      total_amount: tot_amount.toFixed(2),
    });
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
      customer_id: '',
      nicno: '',
      cusname: '',
      address: '',
      mobile: '',

      item_id: '',

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
      image: [],
      design_images: [],

      design_image_url: '',
      design_image_url1: '',
      design_image_url2: '',
    });

    clearItemRow();
  };

  const showCustomerForm = () => {
    setViewCustomerForm(!viewCustomerForm);
  };

  const edit = async () => {
    try {
      setIsLoading({
        ...isLoading,
        init: true,
      });

      const response = await api.get(`sales-orders/` + newData.id);

      if (response.data.sales_order === null) {
        setIsLoading({
          ...isLoading,
          init: false,
        });
        fetchData();
        return;
      }

      const salesOder = response.data.sales_order;

      const details = salesOder.details.map((item) => {
        return {
          index: uuidv4(),
          tag_id: item.tag_id,
          tag_no: item.tag_no,
          // item_id: item.tag.item_id,
          item_name: item.item_note,
          weight: item.weight,
          st_weight: item.st_weight,
          price: item.price,
          agree_rate: item.agree_rate,
        };
      });

      const newdesigndetails = salesOder.details.map((item) => {
        return {
          index: uuidv4(),
          tag_id: item.tag_id,
          tag_no: item.tag_no,
          item_id: item.item_id,
          item: {
            itemname: item.item ? item.item.itemname : '',
          },
          item_description: item.item_note,
          qty: item.qty,
          weight: item.weight,
          st_weight: item.st_weight,
          price: item.price,
          agree_rate: item.agree_rate,
          design_id: item.item_note,
          gold_type: item.gold_type,
          design: {
            designcode: item.design.id,
            designname: item.design.designname,
          },
          metal_type: item.metal_type,
          metal: {
            id: item.metal.id,
            description: item.metal.description,
          },
          color_type: item.color_type,
          color: {
            id: item.color.id,
            description: item.color.description,
          },
          gender_type: item.gender_type,
          gender: {
            id: item.gender.id,
            description: item.gender.description,
          },
        };
      });

      const st_details = salesOder.details.map((st_item) => {
        return {
          ...st_item.stone_details,index: uuidv4(),
        };
      });

      console.log(st_details);

      setNewData({
        ...newData,
        order_type: salesOder.order_type,
        ddate: salesOder.ddate,
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
        item_description: salesOder.item_description,
        design_image: '',
        design_image_data: '',
        design_image_url:
          salesOder.new_design_images[0] && salesOder.new_design_images[0]
            ? api.getMainImagePath() + salesOder.new_design_images[0].image_url
            : '',
        design_image_url1:
          salesOder.new_design_images[1] && salesOder.new_design_images[1]
            ? api.getMainImagePath() + salesOder.new_design_images[1].image_url
            : '',
        design_image_url2:
          salesOder.new_design_images[2] && salesOder.new_design_images[2]
            ? api.getMainImagePath() + salesOder.new_design_images[2].image_url
            : '',

        details: details,
        newItems: newdesigndetails,
        stone_details: st_details,
      });

      setIsEdit(true);

      setIsLoading({
        ...isLoading,
        init: false,
      });
    } catch (error) {
      console.log(error);
      return msg.error('Unable to fetch data!');
    }
  };

  const changeOrderType = (type) => {
    setNewData({
      ...newData,
      order_type: type,
    });
  };

  // const uploadImage = (e) => {
  //   const file = e.target.files[0];
  //   if (newData.image.length < 3) {
  //     if (file.type == 'image/jpeg') {
  //       const formData = new FormData();
  //       formData.append('design_image', file, file.name);
  //       const img_url = URL.createObjectURL(file);
  //       setNewData({
  //         ...newData,
  //         design_image: file,
  //         design_image_data: formData,
  //         design_image_url: img_url,
  //       });
  //       newData.image.push(img_url);
  //       newData.design_images.push(formData);
  //       setDesignImage(formData);
  //     } else {
  //       msg.warning('Please select Jpeg Images only.');
  //     }
  //   } else {
  //     msg.warning('You can select only 3 items at once.');
  //   }
  //   console.log(newData.design_images.length);
  // };

  const uploadImage = (e) => {
    const file = e.target.files[0];
    if (newData.image.length < 3) {
      if (file.type == 'image/jpeg') {
        const formData = new FormData();
        formData.append('design_image', file, file.name);
        const img_url = URL.createObjectURL(file);
        setNewData({
          ...newData,
          design_image: file,
          design_image_data: formData,
          design_image_url: img_url,
        });
        newData.image.push(img_url);
        newData.design_images.push(formData);
        setDesignImage(formData);
      } else {
        msg.warning('Please select Jpeg Images only.');
      }
    } else {
      msg.warning('You can select only 3 items at once.');
    }
    console.log(newData.image);
  };

  const uploadImage1 = (e) => {
    const file = e.target.files[0];
    if (newData.image.length < 3) {
      if (file.type == 'image/jpeg') {
        const formData1 = new FormData();
        formData1.append('design_image', file, file.name);
        const img_url = URL.createObjectURL(file);
        setNewData({
          ...newData,
          design_image1: file,
          design_image_data: formData1,
          design_image_url1: img_url,
        });
        newData.image.push(img_url);
        newData.design_images.push(formData1);
        setDesignImage1(formData1);
      } else {
        msg.warning('Please select Jpeg Images only.');
      }
    } else {
      msg.warning('You can select only 3 items at once.');
    }
    console.log(newData.image);
  };

  const uploadImage2 = (e) => {
    const file = e.target.files[0];
    if (newData.image.length < 3) {
      if (file.type == 'image/jpeg') {
        const formData2 = new FormData();
        formData2.append('design_image', file, file.name);
        const img_url = URL.createObjectURL(file);
        setNewData({
          ...newData,
          design_image2: file,
          design_image_data: formData2,
          design_image_url2: img_url,
        });
        newData.image.push(img_url);
        newData.design_images.push(formData2);
        setDesignImage2(formData2);
      } else {
        msg.warning('Please select Jpeg Images only.');
      }
    } else {
      msg.warning('You can select only 3 items at once.');
    }
    console.log(newData.image);
  };

  // const uploadImage = (e) => {
  //   const file = e.target.files[0];
  //   if (file.type == 'image/jpeg') {
  //     const formData = new FormData();
  //     formData.append('design_image', file, file.name);
  //     const img_url = URL.createObjectURL(file);
  //     setNewData({
  //       ...newData,
  //       design_image: file,
  //       design_image_data: formData,
  //       design_image_url: img_url,
  //     });

  //     setDesignImage(formData);
  //   } else {
  //     msg.warning('Please select Jpeg Images only.');
  //   }
  // };

  const printReceipt = (trans_no, is_dupplicate) => {
    SalesOrderPrint.load(trans_no, cookie.get('user_branch'), is_dupplicate);
  };

  const designSelect = (selectedObj) => {
    setNewItem({
      ...newItem,
      design_id: selectedObj.id,
      design: {
        designcode: '',
        designname: selectedObj.designname,
      },
    });
  };

  const getGoldTypes = async () => {
    const response = await api.get(`get-gold-types`);

    if (response.data.gold_types) {
      setGoldTypes(response.data.gold_types);
    }
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

    setNewItem({
      ...newItem,
      stone_details: [...newItem.stone_details, itemStoneRow],
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

  const clearStoneNewData = () => {
    setNewData((prev) => {
      return {
        ...prev,
        stone_details: [],
      };
    });
  };

  const metalSelect = (selectedObj) => {
    setNewItem({
      ...newItem,
      metal_type: selectedObj.id,
      metal: {
        id: '',
        description: selectedObj.description,
      },
    });
  };

  const colorSelect = (selectedObj) => {
    setNewItem({
      ...newItem,
      color_type: selectedObj.id,
      color: {
        id: '',
        description: selectedObj.description,
      },
    });
  };

  const genderSelect = (selectedObj) => {
    setNewItem({
      ...newItem,
      gender_type: selectedObj.id,
      gender: {
        id: '',
        description: selectedObj.description,
      },
    });
  };

  const toggleMoreModalDetails = (data) => {
    console.log(data)
    setShowModalState(!showModalState);

    clearStoneNewData();

    if (showModalState == false) {
      clearStoneNewData();
    }

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
      <CustomerListSelection
        toggleFormModal={showCustomerListSelection}
        showModalState={viewCustomerListSelection}
        selectRow={selectCustomer}
      />
      <CustomerForm
        toggleFormModal={showCustomerForm}
        showModalState={viewCustomerForm}
        customerData={customerData}
        updateCustomerData={updateCustomerData}
      />

      <ListSelection
        toggleFormModal={showListSelection}
        showModalState={viewListSelection}
        entities={setListData}
        dataColumns={setColulmns}
        selectRow={selectRow}
      />

      <h5 className="text-center">{moduleName}</h5>
      <br />
      {isLoading.init ? (
        <Loader />
      ) : (
        <form
          encType="multipart/form-data"
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.preventDefault();
          }}
        >
          <div className="row mb-3">
            <div className="col-sm-9">
              <div className="row">
                <label htmlFor="nicno" className="col-sm-1 col-form-label ">
                  Customer
                </label>
                <div className="col-sm-2 pr-0">
                  <input
                    type="text"
                    name="mobile"
                    id="mobile"
                    className="form-control form-control-sm "
                    maxLength="10"
                    onKeyDown={getCustomer}
                    placeholder="Mobile No"
                    value={newData.mobile}
                    onChange={handleValueChanges}
                    autoComplete="off"
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
                    onChange={handleValueChanges}
                    placeholder="Customer Name"
                    autoComplete="off"
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
                <div className="col-sm-2 pr-0">
                  <input
                    type="text"
                    className="form-control form-control-sm "
                    id="nicno"
                    name="nicno"
                    value={newData.nicno}
                    onChange={handleValueChanges}
                    autoComplete="off"
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
                    type="text"
                    name="address"
                    id="address"
                    className="form-control form-control-sm "
                    maxLength="200"
                    value={newData.address}
                    onChange={handleValueChanges}
                    placeholder="Customer Address"
                    autoComplete="off"
                    readOnly
                  />
                </div>
              </div>
            </div>

            <div className="col-sm-3 border-left border-white ">
              <div className="row">
                <label htmlFor="ddate" className="col-sm-4 col-form-label">
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

              <div className="row">
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
                    onChange={handleValueChanges}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        edit();
                      }
                    }}
                  />
                </div>
              </div>

              {/* <div className=" row ">
                <label
                  htmlFor="gold_rate"
                  className="col-sm-4 col-form-label px-0"
                >
                  Gold Rate
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

              {/* <div className=" row ">
                <label
                  htmlFor="store_id"
                  className="col-sm-4 col-form-label px-0"
                >
                  Stores
                </label>
                <div className="col-sm-8">
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
              </div> */}
            </div>
          </div>
          <hr className="border-white" />
          <div className="row mb-2">
            <div className="btn-group mx-3" role="group">
              <button
                type="button"
                className="btn btn-outline-success "
                onClick={() => changeOrderType('N')}
              >
                New Design
              </button>
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={() => changeOrderType('T')}
              >
                Tagged Item
              </button>
            </div>
          </div>
          {newData.order_type === 'N' ? (
            <div>
              <div className="row">
                <div className="table-responsive header-fixed-scrollable">
                  <table className="table table-bordered table-sm table-hover">
                    <thead className="thead-dark text-center">
                      <tr>
                        <td width="3%" rowSpan="2">
                          #
                        </td>
                        <td width="15%">Item</td>
                        <td width="10%">Design</td>
                        <td width="10%">Gold Type</td>
                        <td width="10%">Metal Type</td>
                        <td width="10%">Color Type</td>
                        <td width="10%">Gender Type</td>
                        <td width="10%">Quantity</td>
                        <td width="10%">Weight (g)</td>
                        <td width="10%">Price</td>
                        {/* <td width="15%">Design Image</td> */}
                        <td width="3%" colSpan="2"></td>
                      </tr>
                      <tr>
                        <td>
                          <SDD
                            method={itemSelectNew}
                            data={jewItems}
                            value="itemname"
                            rowId="itemcode"
                            classes="form-control form-control-sm"
                            placeholder="Item"
                            listId="items"
                            selected={newItem.item.itemname} 
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
                            selected={newItem.design.designname}
                          />
                        </td>
                        <td>
                          <select
                            id="gold_type"
                            name="gold_type"
                            className="form-control form-control-sm"
                            onChange={handleItemRowChanges}
                            value={newItem.gold_type}
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
                            selected={newItem.metal.description}
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
                            selected={newItem.color.description}
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
                            selected={newItem.gender.description}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            name="qty"
                            id="qty"
                            step="1"
                            className="form-control form-control-sm text-right"
                            value={newItem.qty}
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
                            value={newItem.weight}
                            onChange={handleItemRowChanges}
                            placeholder="Weight"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            name="price"
                            id="price"
                            className="form-control form-control-sm text-right"
                            value={newItem.price}
                            onChange={handleItemRowChanges}
                            placeholder="Price"
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
                            method={() => addNewItemNewDesigns()}
                            showText={false}
                          />
                        </td> */}
                      </tr>
                    </thead>
                    <tbody>
                      {newData.newItems.map((item, index) => {
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
                                value={newData.newItems[index].item.itemname}
                                readOnly
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                name="designname"
                                id="designname"
                                data-id={index}
                                className="form-control form-control-sm"
                                value={
                                  newData.newItems[index].design.designname
                                }
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
                                value={newData.newItems[index].gold_type}
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
                                value={
                                  newData.newItems[index].metal.description
                                }
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
                                value={
                                  newData.newItems[index].color.description
                                }
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
                                value={
                                  newData.newItems[index].gender.description
                                }
                                onChange={handleItemsChange}
                                placeholder="Gender Type"
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                name="qty"
                                id="qty"
                                data-id={index}
                                className="form-control form-control-sm text-right"
                                value={newData.newItems[index].qty}
                                onChange={handleItemsChange}
                                placeholder="QTY"
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                name="weight"
                                id="weight"
                                data-id={index}
                                className="form-control form-control-sm text-right"
                                value={newData.newItems[index].weight}
                                onChange={handleItemsChange}
                                placeholder="Weight"
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                name="price"
                                id="price"
                                data-id={index}
                                className="form-control form-control-sm text-right"
                                value={newData.newItems[index].price}
                                onChange={handleItemsChange}
                                placeholder="Price"
                              />
                            </td>
                            <td className="text-center">
                              <SystemButton
                                type={'option-row'}
                                method={() =>
                                  toggleMoreModalDetails(
                                    newData.newItems[index],
                                  )
                                }
                                showText={false}
                              />
                            </td>
                            <td className="text-center">
                              <SystemButton
                                type={'remove-row'}
                                method={() =>
                                  removeItem(newData.newItems[index].index)
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
              <div className="row my-2 ">
                <div className="col-sm-4">
                  <div className="form-group">
                    <h6 className="font-weight-bold">Desing Image Upload</h6>
                    <div className="custom-file mb-3">
                      <input
                        type="file"
                        className="custom-file-input"
                        id="customFile"
                        name="filename[]"
                        accept="image/jpg"
                        onChange={uploadImage}
                        multiple
                      />
                      <label className="custom-file-label" htmlFor="customFile">
                        Choose file
                      </label>
                    </div>
                  </div>
                  {newData.design_image ? (
                    <div className="form-group">
                      <h6>{newData.design_image.name}</h6>
                      {/* <h6>{newData.design_image.type}</h6> */}
                      <img
                        id="design_image"
                        src={newData.design_image_url}
                        alt="New Design"
                        width={'100%'}
                        height={'100%'}
                      />
                    </div>
                  ) : null}

                  {isEdit ? (
                    <div className="form-group">
                      <h6>{newData.design_url}</h6>
                      {/* <h6>{newData.design_image.type}</h6> */}
                      <img
                        id="design_image"
                        src={newData.design_image_url}
                        alt="New Design"
                        width={'100%'}
                        height={'100%'}
                      />
                    </div>
                  ) : null}
                </div>
                <div className="col-sm-4">
                  <div className="form-group">
                    {/* <h6 className="font-weight-bold">fdfdf</h6> */}
                    <div className="custom-file mb-3 mt-4">
                      <input
                        type="file"
                        className="custom-file-input"
                        id="customFile"
                        name="filename[]"
                        accept="image/jpg"
                        onChange={uploadImage1}
                        multiple
                      />
                      <label className="custom-file-label" htmlFor="customFile">
                        Choose file
                      </label>
                    </div>
                  </div>
                  {newData.design_image1 ? (
                    <div className="form-group">
                      <h6>{newData.design_image1.name}</h6>
                      {/* <h6>{newData.design_image.type}</h6> */}
                      <img
                        id="design_image"
                        src={newData.design_image_url1}
                        alt="New Design"
                        width={'100%'}
                        height={'100%'}
                      />
                    </div>
                  ) : null}

                  {isEdit ? (
                    <div className="form-group">
                      <h6>{newData.design_url}</h6>
                      {/* <h6>{newData.design_image.type}</h6> */}
                      <img
                        id="design_image"
                        src={newData.design_image_url1}
                        alt="New Design"
                        width={'100%'}
                        height={'100%'}
                      />
                    </div>
                  ) : null}
                </div>

                <div className="col-sm-4">
                  <div className="form-group">
                    {/* <h6 className="font-weight-bold">fdfdf</h6> */}
                    <div className="custom-file mb-3 mt-4">
                      <input
                        type="file"
                        className="custom-file-input"
                        id="customFile"
                        name="filename[]"
                        accept="image/jpg"
                        onChange={uploadImage2}
                        multiple
                      />
                      <label className="custom-file-label" htmlFor="customFile">
                        Choose file
                      </label>
                    </div>
                  </div>
                  {newData.design_image2 ? (
                    <div className="form-group">
                      <h6>{newData.design_image2.name}</h6>
                      {/* <h6>{newData.design_image.type}</h6> */}
                      <img
                        id="design_image"
                        src={newData.design_image_url2}
                        alt="New Design"
                        width={'100%'}
                        height={'100%'}
                      />
                    </div>
                  ) : null}

                  {isEdit ? (
                    <div className="form-group">
                      <h6>{newData.design_url}</h6>
                      {/* <h6>{newData.design_image.type}</h6> */}
                      <img
                        id="design_image"
                        src={newData.design_image_url2}
                        alt="New Design"
                        width={'100%'}
                        height={'100%'}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
          {newData.order_type === 'T' ? (
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
                    <tr>
                      <td></td>
                      <td>
                        <input
                          type="text"
                          name="tag_no"
                          id="tag_no"
                          className="form-control form-control-sm "
                          value={itemRow.tag_no}
                          onChange={handleItemTagRowChanges}
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
                          onChange={handleItemTagRowChanges}
                          placeholder="Description"
                          readOnly
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          name="weight"
                          id="weight"
                          step="0.01"
                          className="form-control form-control-sm  text-right"
                          value={itemRow.weight}
                          onChange={handleItemTagRowChanges}
                          placeholder="Weight"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          name="st_weight"
                          id="st_weight"
                          step="0.01"
                          className="form-control form-control-sm  text-right"
                          value={itemRow.st_weight}
                          onChange={handleItemTagRowChanges}
                          placeholder="ST Weight"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          name="price"
                          id="price"
                          className="form-control form-control-sm  text-right"
                          value={itemRow.price}
                          onChange={handleItemTagRowChanges}
                          placeholder="Price (LKR)"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          name="agree_rate"
                          id="agree_rate"
                          className="form-control form-control-sm  text-right"
                          value={itemRow.agree_rate}
                          onChange={handleItemTagRowChanges}
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
                          id="tot_amount"
                          name="tot_amount"
                          value={newData.tot_amount}
                          readOnly
                        />
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : null}

          <hr className="border-white" />

          <div className="row">
            <div className="col-sm-9">
              <div className="row">
                <label htmlFor="notes" className="col-sm-1 col-form-label ">
                  Memo
                </label>
                <div className="col-sm-8 pr-0">
                  <textarea
                    name="memo"
                    id="memo"
                    rows="2"
                    maxLength="100"
                    className="form-control form-control-sm "
                    value={newData.memo}
                    onChange={handleValueChanges}
                  ></textarea>
                </div>
              </div>
              <div className="row mt-2">
                <label htmlFor="supplier" className="col-sm-1 col-form-label">
                  Salesman
                </label>
                <div className="col-sm-2 pr-0">
                  <input
                    type="text"
                    name="employee_id"
                    id="employee_id"
                    className="form-control form-control-sm bg-white"
                    value={newData.employee_id}
                    // onChange={handleValueChanges}
                    readOnly
                  />
                </div>
                <div className="col-sm-6 px-0">
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
              {/* <SystemButton
                type="no-form-save"
                showText
                method={handleSubmit}
              /> */}
              <SystemButton type="save" showText />
            </div>
            {/* <div className="col-sm-2">
              <SystemButton type="cancel" showText method={handleSubmit} />
              </div>*/}
            <div className="col-sm-2">
              <SystemButton
                type="print"
                showText
                method={() => {
                  if (isEdit) {
                    printReceipt(newData.id, true);
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
          <hr className="border-white" />
        </form>
      )}

      <FormModal
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
                  addNewItemNewDesigns(event);
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

export default SalesOrder;
