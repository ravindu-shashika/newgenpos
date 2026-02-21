import React, { useState, useEffect, useRef } from 'react';
import { api, msg, cookie } from '../../../services';
import { SystemButton, SDD, ListSelection } from '../../../components';
import JsBarcode from 'jsbarcode';
import { jsPDF } from 'jspdf';

const TagCreation = () => {
  // Module name
  const moduleName = 'Tag Creation';

  // Gneral Focus Hook
  const UseFocus = () => {
    const htmlElRef = useRef(null);
    const setFocus = () => {
      htmlElRef.current && htmlElRef.current.focus();
    };

    return [htmlElRef, setFocus];
  };

  /* --- State declarationss --- */
  const [newData, setNewData] = useState({
    id: '',
    ddate: '',
    tag_type: '',
    tag_no: '',

    purchase_id: '',
    purchase_det_id: '',
    forfieted_no: '',
    sales_order_id: '',
    so_item_descriptions: '',

    from_store_id: '',
    store_id: '',
    item_id: '',
    item_name: '',
    gold_rate: '',
    design_id: '',
    gold_type: '',
    size_id: '',
    weight: '',
    stone_weight: '',
    stone_amount: '',
    cost: '',
    min_price: '',
    max_price: '',
    available: 1,
    maker_id: 0,
    vendor_id: '',
    item_prefix: '',
    metal_type: '',
    color_type: '',
    gender_type: '',
    // stone_type: '',

    opening_stock_id: '',

    user_id: cookie.get('user_id'),
    bc_no: cookie.get('user_branch'),
    new_id: '',
    new_ddate: '',
    so_no: 0,
  });

  const [cusData, setCusData] = useState({
    id: '',
    name: '',
    tell_no: '',
    so_item_descriptions: '',
  });

  const [stores, setStores] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [goldTypes, setGoldTypes] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [items, setItems] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [vendorPurchases, setVendorPurchases] = useState([]);
  const [metalTypes, setMetalTypes] = useState([]);
  const [colorTypes, setColorTypes] = useState([]);
  const [stoneTypes, setStoneTypes] = useState([]);
  const [genderTypes, setGenderTypes] = useState([]);

  const [openingStockValues, setOpeningStockValues] = useState([]);

  const [purchaseDet, setPurchaseDet] = useState([
    {
      item_id: '',
      item: { itemcode: '', itemname: '' },
      qty: '',
      balance_qty: '',
      weight: '',
      balance_weight: '',
      stone_weight: '',
      balance_stone_weight: '',
    },
  ]);
  const [controlsVisibility, setControlsVisibility] = useState({
    showPurchaseDetTable: false,
    showSalesOrderDes: false,
  });

  const [taggedItems, setTaggedItems] = useState([]);
  const [purchaseSum, setPurchaseSum] = useState([]);
  const [purchaseLoaded, setPurchaseLoaded] = useState(false);

  const [forfeited, setForfeited] = useState([]);
  const [forfeitedItems, setForfeitedItems] = useState([]);

  const [salesOrders, setSalesOrders] = useState([]);

  const [openingStock, setOpeningStock] = useState([]);

  // Data loading status
  const [isLoading, setIsLoading] = useState(false);

  // Form modal state
  const [showModalState, setShowModalState] = useState(false);

  // Data edit state
  const [isEdit, setIsEdit] = useState(false);

  const [isHaveSOForPO, setIsHaveSOForPO] = useState(false);

  // Selected data
  const [selectedId, setSelectedId] = useState('');

  const [input1Ref, setInput1Focus] = UseFocus();
  const [refCost, setRefCost] = UseFocus();
  const [refMaxPrice, setRefMaxPrice] = UseFocus();

  /* --- End of state declarations --- */

  /* --- List Selection Required ---- */
  const [listType, setListType] = useState([]);
  const [viewListSelection, setViewListSelection] = useState(false);

  const showListSelection = () => {
    setViewListSelection(!viewListSelection);
  };

  const selectRow = (dataObj) => {
    if (listType === 'item') {
      setNewData({
        ...newData,
        item_id: dataObj.itemcode,
        item_name: dataObj.itemname,
      });
    } else {
    }
  };

  const setColulmns = () => {
    if (listType === 'item') {
      return itemColumns;
    } else {
      return null;
    }
  };

  const itemColumns = [
    { title: 'Code', name: 'itemcode', searchable: true },
    { title: 'Name', name: 'itemname', searchable: true },
  ];

  const setListData = () => {
    if (listType === 'item') {
      return items;
    } else {
      return null;
    }
  };

  /* ---  End of List Selection Required ---- */

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    loadOpeningStocks(newData.opening_stock_id);
  }, [openingStockValues]);

  useEffect(() => {
    if (showModalState === false) {
      resetForm();
    }
  }, [showModalState]);

  useEffect(() => {
    if (newData.item_id) {
      const item = items.find((itm) => {
        return itm.itemcode == newData.item_id;
      });
      if (item) {
        const new_tag_no = generateTagNo(item.prefix);

        setNewData({
          ...newData,
          tag_no: new_tag_no,
        });
        generateBarcode(new_tag_no);
      }
    }
  }, [newData.item_id]);

  /* --- Component functions --- */

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const response = await api.get('tags');
      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err[0]);
        });
        return;
      }

      // setEntities(response.data.entities.data);
      setStores(response.data.stores);
      setDesigns(response.data.designs);
      setGoldTypes(response.data.gold_types);
      setSizes(response.data.sizes);
      setItems(response.data.items);
      setVendors(response.data.vendors);
      setGenderTypes(response.data.gender);
      setMetalTypes(response.data.metal);
      setColorTypes(response.data.color);
      setStoneTypes(response.data.stone);

      setNewData({
        ...newData,
        id: response.data.new_id,
        new_id: response.data.new_id,
        ddate: response.data.ddate,
        new_ddate: response.data.ddate,

        tag_type: '',
        tag_no: '',
        purchase_id: '',
        forfieted_no: '',
        from_store_id: '',
        sales_order_id: '',
        store_id: '',
        item_id: '',
        item_name: '',
        gold_rate: response.data.daily_gold_rate,
        design_id: '',
        gold_type: '',
        size_id: '',
        weight: '',
        stone_weight: '',
        stone_amount: '',
        cost: '',
        min_price: '',
        max_price: '',
        available: 1,
        maker_id: 0,
        item_prefix: '',
        metal_type: '',
        color_type: '',
        gender_type: '',

        user_id: cookie.get('user_id'),
        bc_no: cookie.get('user_branch'),
      });
      setIsLoading(false);

      document.getElementById('barcode_print').src = '';
      setIsEdit(false);
      setPurchaseLoaded(false);
      setPurchaseDet([]);
      setForfeited([]);
    } catch (error) {
      msg.error('Unable to fetch data!');
      return console.log(error);
    }
  };

  const handleValueChange = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue =
      targetInput.type === 'checkbox' ? targetInput.checked : targetInput.value;

    let so_item_descriptions = newData.so_item_descriptions;
    if (inputName === 'sales_order_id') {
      const selected_sales_order = salesOrders.find((so) => {
        return parseInt(so.id) === parseInt(inputValue);
      });

      if (selected_sales_order) {
        so_item_descriptions = selected_sales_order.item_description;
      }
    }

    setNewData({
      ...newData,
      [inputName]: inputValue,
      so_item_descriptions: so_item_descriptions,
    });

    if (inputName === 'vendor_id') {
      if (newData.tag_type === 'N') {
        loadPurchasesOfVendor(inputValue);
      }
    }

    if (inputName === 'opening_stock_id') {
      loadOpeningStocks(inputValue);
    }

    if (inputName === 'purchase_id') {
      setPurchaseDetails(inputValue);
    }

    if (inputName === 'tag_no') {
      generateBarcode(inputValue);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (checkBeforeSave() === false) return;
    await save();

    // setNewData({
    //   size: '',
    // });
  };

  const save = async () => {
    if (isEdit === false) {
      try {
        const response = await api.post('tags').values(newData);
        if (response.error) {
          Object.values(response.error).forEach((err) => {
            msg.error(err[0]);
          });
          return;
        }
        printReceipt();
        msg.success(response.data);
        // resetForm();
        fetchData();
      } catch (error) {
        console.log(error);
      } finally {
        // setShowModalState(false);
      }
    } else {
      try {
        const response = await api
          .update(`tags/${selectedId}/update`)
          .values(newData);

        if (response.error) {
          Object.values(response.error).forEach((err) => {
            msg.error(err[0]);
          });
          return;
        }

        msg.success(response.data);
        resetForm();
      } catch (error) {
        console.error(error);
      } finally {
        setIsEdit(false);
        setSelectedId('');
        setShowModalState(false);
      }
    }
  };

  const checkBeforeSave = () => {
    if (newData.cost <= 0) {
      setRefCost();
      msg.warning('Cost cannot be zero.');
      return false;
    }
    if (newData.max_price <= 0) {
      setRefMaxPrice();
      msg.warning('Max Price cannot be zero.');
      return false;
    }
    return true;
  };

  const resetForm = () => {
    setNewData({
      id: newData.new_id,
      ddate: newData.new_ddate,
      tag_type: '',
      tag_no: '',
      purchase_id: '',
      forfieted_no: '',
      from_store_id: '',
      store_id: '',
      item_id: '',
      item_name: '',
      gold_rate: '',
      design_id: '',
      gold_type: '',
      size_id: '',
      weight: '',
      stone_weight: '',
      stone_amount: '',
      cost: '',
      min_price: '',
      max_price: '',
      available: 1,
      maker_id: 0,
      item_prefix: '',

      user_id: cookie.get('user_id'),
      bc_no: cookie.get('user_branch'),
    });
    document.getElementById('barcode_print').src = '';
    setIsEdit(false);
    setPurchaseLoaded(false);
    setPurchaseDet([]);
    setForfeited([]);
  };

  const changeTagType = (type) => {
    setNewData({
      ...newData,
      tag_type: type,
    });
    if (type === 'F') loadForfeitedList();
    if (type === 'S') loadSalesOrders();
    if (type === 'O') loadOpeningStocksId();
  };

  const loadSalesOrders = async () => {
    try {
      const response = await api
        .post('sales-orders/get-new-type')
        .values({ bc_no: cookie.get('user_branch') });

      setControlsVisibility({
        showPurchaseDetTable: false,
        showSalesOrderDes: true,
      });

      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err);
        });
        return;
      }

      setSalesOrders(response.data.sales_orders);
    } catch (error) {
      msg.error('Unable to fetch data!');
      return console.log(error);
    }
  };

  const loadOpeningStocksId = async () => {
    try {
      const response = await api
        .post('get_opening_stock_ids')
        .values({ bc_no: cookie.get('user_branch') });

      setOpeningStockValues(response.data);
    } catch (error) {
      msg.error('Unable to fetch data!');
      return console.log(error);
    }
  };

  const loadOpeningStocks = async (op_no) => {
    try {

      const response = await api
        .post('get_opening_stock')
        .values({ bc_no: cookie.get('user_branch'), open_stock_id: op_no });

      if (response.data.details) {
        setControlsVisibility({
          showPurchaseDetTable: true,
          showSalesOrderDes: false,
        });
      }

      let openstock = [];

      if (response.data.details) {
        response.data.details.map((item) => {
          console.log(item);
          openstock.push({
            item_id: item.item_id,
            item: {
              itemcode: item.item_id,
              itemname: item.item.itemname,
              prefix: item.item.prefix,
            },
            qty: item.qty,
            balance_qty: parseInt(item.qty) - parseInt(item.tag_qty),
            weight: item.weight,
            balance_weight: (
              parseFloat(item.weight) - parseFloat(item.tag_weight)
            ).toFixed(3),
            stone_weight: item.stone_weight,
            balance_stone_weight: (
              parseFloat(item.stone_weight) - parseFloat(item.tag_stone_weight)
            ).toFixed(3),
          });
        });
      }



      setOpeningStock(response.data.details);
      setPurchaseDet(openstock);
      // setOpeningStockValues(res);
    } catch (error) {
      msg.error('Unable to fetch data!');
      return console.log(error);
    }
  }

  const loadSalesOrderItems = (so_no) => {
    const selected_sales_order = salesOrders.find((so) => {
      return parseInt(so.id) === parseInt(so_no);
    });

    setNewData({
      ...newData,
      so_item_descriptions: selected_sales_order.item_description,
    });

    setControlsVisibility({
      showPurchaseDetTable: false,
      showSalesOrderDes: true,
    });

    // prettier-ignore

    // prettier-ignore-end

    setPurchaseLoaded(true);
  };

  const fromStoreSelect = (e) => {
    setNewData({
      ...newData,
      from_store_id: e.id,
    });
  };

  const vendorSelect = (e) => {
    setNewData({
      ...newData,
      vendor_id: e.code,
    });
  };

  const tagStoreSelect = (e) => {
    setNewData({
      ...newData,
      store_id: e.id,
    });
  };

  const designSelect = (e) => {
    setNewData({
      ...newData,
      design_id: e.id,
    });
  };

  const itemSelect = (e) => {
    setNewData({
      ...newData,
      item_id: e.itemcode,
      item_name: e.itemname,
    });
  };

  const sizeSelect = (e) => {
    setNewData({
      ...newData,
      size_id: e.id,
    });
  };

  const loadPurchasesOfVendor = async (vendor_id) => {
    const response = await api
      .post('get_purchase_vendor')
      .values({ vendor_id: vendor_id });

    if (response.data.purchases) {
      setVendorPurchases(response.data.purchases);
    }
  };

  const setPurchaseDetails = async (purchase_id) => {
    setControlsVisibility({
      showPurchaseDetTable: true,
      showSalesOrderDes: false,
    });

    const response = await api
      .post('get_purchase')
      .values({ purchase_id: purchase_id });

    if (response.error) {
      Object.values(response.error).forEach((err) => {
        msg.error(err);
      });
      return;
    }

    let purchase = []; 

    response.data.purchase.map((item) => {
      purchase.push({
        purchase_det_id: item.id,
        item_id: item.item_id,
        item: {
          itemcode: item.item_id,
          itemname: item.item.itemname,
          prefix: item.item.prefix,
        },
        qty: item.qty,
        balance_qty: parseInt(item.qty) - parseInt(item.tag_qty),
        weight: item.weight,
        balance_weight: (
          parseFloat(item.weight) - parseFloat(item.tag_weight)
        ).toFixed(3),
        stone_weight: item.stone_weight,
        balance_stone_weight: (
          parseFloat(item.stone_weight) - parseFloat(item.tag_stone_weight)
        ).toFixed(3),
        cost: item.cost,
        gold_type: item.gold_type,
        design_id: item.design_id,
        metal_type: item.metal_type,
        color_type: item.color_type,
        gender_type: item.gender_type,
      });
    });

    setPurchaseDet(purchase);
    loadAlreadyTagedInPurchase(purchase_id);

    setPurchaseSum(response.data.purchase_sum);
    setNewData({
      ...newData,
      purchase_id: purchase_id,
      from_store_id: response.data.purchase_sum.store_id,
      so_no: response.data.salesorder_det ? response.data.salesorder_det.id : 0,
    });

    if(response.data.salesorder_det){
      setCusData({
        ...cusData,
        id: response.data.salesorder_det.id,
        name: response.data.salesorder_det.customer.cusname,
        tell_no: response.data.salesorder_det.customer.telNo,
        so_item_descriptions: response.data.salesorder_det.item_description,
      });

      setIsHaveSOForPO(true);
    }else{
      setCusData({
        ...cusData,
        name: '',
        tell_no: '',
        so_item_descriptions: '',
      });
      setIsHaveSOForPO(false);
    }

    setPurchaseLoaded(true);
  };

  const loadAlreadyTagedInPurchase = async (purchase_id) => {
    const response = await api
      .post('get_tagged_purchased_items')
      .values({ purchase_id: purchase_id });

    if (response.error) {
      Object.values(response.error).forEach((err) => {
        msg.error(err);
      });
      return;
    }

    setTaggedItems(response.data.tagged_items);
  };

  const loadGRN = async (e) => {
    if (e.keyCode === 13) {
      const response = await api
        .post('get_purchase')
        .values({ purchase_id: newData.purchase_id });

      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err);
        });
        return;
      }

      let purchase = [];

      response.data.purchase.map((item) => {
        purchase.push({
          item_id: item.item_id,
          item: {
            itemcode: item.item_id,
            itemname: item.itemname,
            prefix: item.prefix,
          },
          qty: item.qty,
          balance_qty: parseInt(item.qty) - parseInt(item.tag_qty),
          weight: item.weight,
          balance_weight: (
            parseFloat(item.weight) - parseFloat(item.tag_weight)
          ).toFixed(3),
          stone_weight: item.stone_weight,
          balance_stone_weight: (
            parseFloat(item.stone_weight) - parseFloat(item.tag_stone_weight)
          ).toFixed(3),
        });
      });

      setPurchaseDet(purchase);

      setPurchaseSum(response.data.purchase_sum);
      setNewData({
        ...newData,
        from_store_id: response.data.purchase_sum.store_id,
      });

      setPurchaseLoaded(true);
    }
  };

  const loadForfeitedList = async () => {
    const response = await api
      .post('get_forfeited_list')
      .values({ purchase_id: newData.purchase_id });

    if (response.error) {
      Object.values(response.error).forEach((err) => {
        msg.error(err);
      });
      return;
    }

    setForfeited(response.data.forfeited_list);
  };

  const loadForfeitedItems = async () => {
    if (newData.forfieted_no === '') return;
    const response = await api
      .post('get_forfeited_items')
      .values({ forfeited_no: newData.forfieted_no });

    if (response.error) {
      Object.values(response.error).forEach((err) => {
        msg.error(err);
      });
      return;
    }

    setForfeitedItems(response.data.forfeited_list);

    let purchase = [];

    // prettier-ignore
    response.data.forfeited_list.map((item) => {
      purchase.push({
        item_id: item.itemcode,
        item: { itemcode: item.itemcode, itemname: item.itemname, prefix: item.prefix },
        qty: item.qty,
        balance_qty: parseInt(item.qty) - parseInt(item.tag_qty),
        weight: item.goldweight,
        balance_weight: (
          parseFloat(item.goldweight) - parseFloat(item.tag_goldweight)
        ).toFixed(3),
        stone_weight: parseFloat(item.goldweight) - parseFloat(item.pure_weight),
        balance_stone_weight: (
          (parseFloat(item.goldweight) - parseFloat(item.pure_weight)) - parseFloat(item.tag_stone_weight)
        ).toFixed(3),
      });
    });
    // prettier-ignore-end

    setPurchaseDet(purchase);
    setPurchaseLoaded(true);

    setControlsVisibility({
      showPurchaseDetTable: true,
      showSalesOrderDes: false,
    });
  };

  const clickOnForfeitedNo = () => {
    loadForfeitedItems();
  };

  const clickOnPurchaseDetails = (item) => {
    let new_tag_no = generateTagNo(item.item.prefix);
    console.log(item)
    setNewData({
      ...newData,
      tag_no: new_tag_no,
      item_id: item.item_id,
      item_name: item.item.itemname,
      item_prefix: item.item.prefix,
      size_id: '',
      weight: item.weight,
      stone_weight: item.stone_weight,
      stone_amount: 0,
      cost: item.cost,
      min_price: 0,
      max_price: 0,
      so_no: cusData.id,
      gold_type: item.gold_type,
      design_id: item.design_id,
      metal_type: item.metal_type,
      color_type: item.color_type,
      gender_type: item.gender_type,
      purchase_det_id: item.purchase_det_id,
    });
    generateBarcode(new_tag_no);
  };

  const generateTagNo = (prefix) => {
    let new_tag_no = '';
    if (newData.tag_type === 'N') {
      new_tag_no = 'N';
    } else if (newData.tag_type === 'O') {
      new_tag_no = 'O';
    } else if (newData.tag_type === 'F') {
      new_tag_no = 'F';
    } else if (newData.tag_type === 'S') {
      new_tag_no = 'S';
    }
    new_tag_no += prefix + pad(newData.id, 5);
    return new_tag_no;
  };

  const pad = (num, size) => {
    num = num.toString();
    while (num.length < size) num = '0' + num;
    return num;
  };

  const clickOnVendor = () => { };

  const printReceipt = () => {
    let img = document.querySelector('img#barcode_print');

    let no_of_stickers_per_page = parseInt(2);

    /* For 50mm * 50mm sticker */
    let sticker_width = parseInt(40);
    let sticker_height = parseInt(40);
    let page_width = sticker_width;
    let page_height = sticker_height;
    let page_gap = parseFloat(26);

    if (no_of_stickers_per_page > 1) {
      page_width =
        page_width * no_of_stickers_per_page +
        (page_gap * no_of_stickers_per_page - 1);
    }

    let doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [page_width, page_height],
    });
    /*   format: [parseInt(50.8), parseInt(22.86)] inches 2 and 0.9  */
    doc.setFontSize(5);
    /*//                doc.addImage(img.src, 'JPEG', 10, 10, 180, 160);*/

    let x = 0;
    let y = 0;
    y += 1.5;
    // doc.addImage(img.src, 'JPEG', x, y, 25, 15); // with image width and height
    doc.addImage(img.src, 'JPEG', x, y); // without image width and height

    /* let item_name = '';
    if (this.form.s_description !== '') {
      item_name = this.form.s_description;
    } else {
      item_name = this.form.des;
    }
    let print_name_1 = item_name;
    let print_name_2 = '';

    if (item_name.length > 27) {
      print_name_1 = print_name_1.slice(0, 26);
      print_name_1 = print_name_1.slice(
        0,
        Math.min(print_name_1.length, print_name_1.lastIndexOf(' ')),
      );
      print_name_2 = item_name.slice(print_name_1.length, item_name.length);
    }

    let x = 0;
    let y = 0;
    let page_count = parseInt(this.form.qty / 2);
    if (parseInt(this.form.qty) % 2 > 0) {
      page_count++;
    }

    for (let l = 0; l < page_count; l++) {
      x = 0;
      for (let p = 0; p < no_of_stickers_per_page; p++) {
        y = 1.5;
        doc.text(x, y, 'Rs.' + this.form.max_price);
        y += 2;
        doc.setFontSize(5);
        doc.text(x, y, print_name_1);
        if (print_name_2 !== '') {
          y += 1.5;
          doc.text(x, y, print_name_2);
        }
        y += 2;
        doc.text(x, y, 'Manufactured: ');
        doc.text(x + 12, y, this.form.manufacture_date);
        y += 2;
        doc.text(x, y, 'Expired: ');
        doc.text(x + 12, y, this.form.expire_date);
        y += 2;
        doc.text(x, y, 'Reg.No.: ');
        doc.text(x + 12, y, this.company.var_reg_no);
        y += 1.5;
        doc.addImage(img.src, 'JPEG', x, y, 25, 15);

        x += 25 + page_gap / 2;
      }
      if (l < parseInt(page_count) - 1) {
        doc.addPage();
      }
    } */
    //                doc.text(x + 10, y, 'Rs.' + this.form.max_price);
    //                doc.addImage(img.src, 'JPEG', x, y);

    const pdfname = newData.tag_no + '.pdf';
    doc.save(pdfname);

    // doc.autoPrint(); // <<--------------------- !!
    // let newWindow = window.open(doc.output("bloburl"), '_blank');
  };

  const generateBarcode = (text) => {
    JsBarcode('#barcode_print', text, {
      format: 'CODE128',
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

      <form
        onSubmit={handleSubmit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.preventDefault();
        }}
      >
        <div className="">
          <h5 className="text-center py-3">{moduleName}</h5>
          <div className="row">
            <div className="col-sm-9">
              <div className="row mb-3">
                {/* <div className="col-sm-3 px-0"> */}
                <div
                  className="btn-group"
                  role="group"
                  aria-label="Basic mixed styles example"
                  style={
                    purchaseLoaded
                      ? { pointerEvents: 'none', opacity: '0.4' }
                      : null
                  }
                >
                  <button
                    type="button"
                    className="btn btn-outline-primary "
                    onClick={() => changeTagType('N')}
                  >
                    New Tag
                  </button>
                  {/* <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => changeTagType('O')}
                  >
                    Old Tag
                  </button> */}
                  {/* <button
                    type="button"
                    className="btn btn-outline-success"
                    onClick={() => changeTagType('F')}
                  >
                    Forfeited Tag
                  </button> */}
                  {/* <button
                    type="button"
                    className="btn btn-outline-warning"
                    onClick={() => changeTagType('S')}
                  >
                    Sales Order
                  </button> */}
                  <button
                    type="button"
                    className="btn btn-outline-info"
                    onClick={() => changeTagType('O')}
                  >
                    Opening Stock
                  </button>
                </div>
                {/* </div> */}
              </div>

              <div className="row  mb-1 p-1">
                <div className="col-sm-6">
                  <div className="row">
                    <label
                      htmlFor="vendor_id"
                      className="col-sm-4 col-form-label mr-0"
                    >
                      Vendor
                    </label>
                    <div className="col-sm-7 pl-1">
                      <select
                        id="vendor_id"
                        name="vendor_id"
                        className="form-control form-control-sm "
                        required
                        // disabled={purchaseLoaded}
                        onChange={handleValueChange}
                        value={newData.vendor_id}
                      >
                        <option value="">---</option>
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

                <div className="col-sm-6">
                  {newData.tag_type == 'N' ? (
                    <div className="row">
                      <label
                        htmlFor="purchase_id"
                        className="col-sm-4 col-form-label mx-0 text-right"
                      >
                        Purchase No.
                      </label>
                      <div className="col-sm-8">
                        <select
                          id="purchase_id"
                          name="purchase_id"
                          className="form-control form-control-sm "
                          // disabled={purchaseLoaded}
                          onChange={handleValueChange}
                          value={newData.purchase_id}
                        >
                          <option value="">---</option>
                          {vendorPurchases
                            ? vendorPurchases.map((obj) => {
                              return (
                                <option key={obj.id} value={obj.id}>
                                  {obj.nno}
                                </option>
                              );
                            })
                            : null}
                        </select>
                      </div>
                    </div>
                  ) : null}

                  {newData.tag_type == 'O' ? (
                    <div className="row">
                      <label
                        htmlFor="opening_stock_id"
                        className="col-sm-5 col-form-label mx-0 text-right"
                      >
                        Opening Stock No.
                    </label>
                      <div className="col-sm-7">
                        <select
                          id="opening_stock_id"
                          name="opening_stock_id"
                          className="form-control form-control-sm "
                          // disabled={purchaseLoaded}
                          onChange={handleValueChange}
                          value={newData.opening_stock_id}
                        >
                          <option value="">---</option>
                          {openingStockValues
                            ? openingStockValues.map((obj) => {
                              return (
                                <option key={obj.id} value={obj.id}>
                                  {obj.id}
                                </option>
                              );
                            })
                            : null}
                        </select>
                      </div>
                    </div>
                  ) : null}
                  {newData.tag_type == 'F' ? (
                    <div className="row">
                      <label
                        htmlFor="forfieted_no"
                        className="col-sm-4 col-form-label mx-0 text-right"
                      >
                        Forfeited No.
                      </label>

                      <div className="col-sm-7">
                        <select
                          id="forfieted_no"
                          name="forfieted_no"
                          className="form-control form-control-sm "
                          disabled={purchaseLoaded}
                          onChange={handleValueChange}
                          onClick={clickOnForfeitedNo}
                          value={newData.forfieted_no}
                        >
                          <option value="">---</option>
                          {forfeited.map((obj) => {
                            return (
                              <option key={obj.billno} value={obj.billno}>
                                {obj.billno}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="col-sm-3">
              <div className="row">
                <label
                  htmlFor="ddate"
                  className="col-sm-4 col-form-label text-right"
                >
                  Date
                </label>
                <div className="col-sm-8">
                  <input
                    type="text"
                    name="ddate"
                    id="ddate"
                    className="form-control form-control-sm text-center border-0"
                    readOnly
                    value={newData.ddate}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* <div className="row py-2">
          <div className="col-sm-6"></div>

          <div className="col-sm-6">
            {newData.tag_type == 'N' ? (
              <div className="row">
                <label
                  htmlFor="item_id"
                  className="col-sm-3 col-form-label mx-0 text-right"
                >
                  Purchase No.
                </label>
                <div className="col-sm-5">
                  <select
                    id="purchase_id"
                    name="purchase_id"
                    className="form-control form-control-sm"
                    // disabled={purchaseLoaded}
                    onChange={handleValueChange}
                    value={newData.purchase_id}
                  >
                    <option value="">---</option>
                    {vendorPurchases
                      ? vendorPurchases.map((obj) => {
                          return (
                            <option key={obj.id} value={obj.id}>
                              {obj.nno}
                            </option>
                          );
                        })
                      : null}
                  </select>
                </div>
              </div>
            ) : null}
            <div className="row">
              {newData.tag_type == 'O' ? (
                <div>
                  <h3>Enter From Old Stock</h3>
                </div>
              ) : null}
              {newData.tag_type == 'F' ? (
                <div className="form-inline">
                  <div className="form-group">
                    <label htmlFor="grn_no" className="pr-2">
                      Forfeited No.
                    </label>

                    <select
                      id="forfieted_no"
                      name="forfieted_no"
                      className="form-control form-control-sm"
                      disabled={purchaseLoaded}
                      onChange={handleValueChange}
                      onClick={clickOnForfeitedNo}
                      value={newData.forfieted_no}
                    >
                      <option value="">---</option>
                      {forfeited.map((obj) => {
                        return (
                          <option key={obj.billno} value={obj.billno}>
                            {obj.billno}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div> */}
          {controlsVisibility.showPurchaseDetTable ? (
            <div className="row mt-3">
              <table className="table table-bordered table-hover">
                <thead className="thead-light">
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Item</th>
                    <th scope="col">Description</th>
                    <th scope="col">Qty</th>
                    <th scope="col">Balance Qty</th>
                    <th scope="col">Weight</th>
                    {newData.tag_type == 'O' ? null : (<th scope="col">Balance Weight</th>)}
                    <th scope="col">Stone Weight</th>
                    {newData.tag_type == 'O' ? null : (<th scope="col">Balance Stone Weight</th>)}
                  </tr>
                </thead>
                <tbody>
                  {purchaseDet ? (
                    purchaseDet.map((item, index) => {
                      return (
                        <tr
                          key={item.item_id}
                          onClick={() => clickOnPurchaseDetails(item)}
                        >
                          <td scope="row">{index + 1}</td>
                          <td>{item.item.itemcode}</td>
                          <td>{item.item.itemname}</td>
                          <td className="text-right">{item.qty}</td>
                          <td className="text-right">{item.balance_qty}</td>
                          <td className="text-right">{item.weight}</td>
                          {newData.tag_type == 'O' ? null : (<td className="text-right">{item.balance_weight}</td>)}
                          <td className="text-right">{item.stone_weight}</td>
                          {newData.tag_type == 'O' ? null : (<td className="text-right">
                            {item.balance_stone_weight}
                          </td>)}
                        </tr>
                      );
                    })
                  ) : (
                      <tr>
                        <td colSpan="8" className="text-center">
                          No data
                      </td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>
          ) : null}

          {newData.tag_type == 'S' ? (
            <div className="row">
              <div className="col-sm-9">
                <div className="row">
                  <label
                    htmlFor="sales_order_id"
                    className="col-sm-2 col-form-label mr-0"
                  >
                    Sales Orders
                  </label>

                  <div className="col-sm-10 pl-0 ">
                    <select
                      id="sales_order_id"
                      name="sales_order_id"
                      className="form-control form-control-sm "
                      disabled={purchaseLoaded}
                      onChange={handleValueChange}
                      value={newData.sales_order_id}
                    >
                      <option value="">---</option>
                      {salesOrders.map((obj) => {
                        return (
                          <option key={obj.id} value={obj.id}>
                            SO No.: {obj.id} | Date: {obj.ddate} | Customer: {obj.customer.cusname}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ) : null}


          {controlsVisibility.showSalesOrderDes && newData.tag_type == 'S' ? (
            <div className="row mt-3">
              <div className="col-sm-9">
                <div className="row">
                  <label
                    htmlFor="from_store_id"
                    className="col-sm-2 col-form-label mr-0"
                  >
                    Order Details:
                  </label>
                  <div className="col-sm-10 pl-0 ">
                    <textarea
                      name="so_item_descriptions"
                      id="so_item_descriptions"
                      rows="4"
                      maxLength="100"
                      className="form-control form-control-sm "
                      value={newData.so_item_descriptions}
                      onChange={handleValueChange}
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* {isHaveSOForPO && newData.tag_type == 'N' ? (
            <div className="row mt-3">
              <div className="col-sm-9">
                <div className="row">
                  <label
                    htmlFor="from_store_id"
                    className="col-sm-2 col-form-label mr-0"
                  >
                    Order Details:
                  </label>
                  <div className="col-sm-10 pl-0 ">
                    <textarea
                      name="so_item_descriptions"
                      id="so_item_descriptions"
                      rows="4"
                      maxLength="100"
                      className="form-control form-control-sm "
                      value={cusData.so_item_descriptions}
                      onChange={handleValueChange}
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          ) : null} */}

          {isHaveSOForPO && newData.tag_type == 'N' ? (
            <div className="row mt-3">
              <div className="col-sm-9">
                <div className="row  ">
                  <label
                    htmlFor="customer"
                    className="col-sm-2 col-form-label mr-0"
                  >
                    Sales No
                </label>
                  <div className="col-sm-2 pl-0">
                    <input
                      type="text"
                      name="tell_no"
                      id="tell_no"
                      className="form-control form-control-sm bg-white"
                      value={cusData.id}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {isHaveSOForPO && newData.tag_type == 'N' ? (
            <div className="row mt-3">
              <div className="col-sm-9">
                <div className="row  ">
                  <label
                    htmlFor="customer"
                    className="col-sm-2 col-form-label mr-0"
                  >
                    Customer Details
                </label>
                  <div className="col-sm-2 pl-0">
                    <input
                      type="text"
                      name="tell_no"
                      id="tell_no"
                      className="form-control form-control-sm bg-white"
                      value={cusData.tell_no}
                      readOnly
                    />
                  </div>
                  <div className="col-sm-8 pl-0">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      className="form-control form-control-sm  "
                      maxLength="100"
                      value={cusData.name}
                      autoComplete="off"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="row mt-3">
            {/* ===== Tag Item Section ===== */}
            <div className="col-sm-9">
              {/* ===== Tag Item Section Left Column ===== */}

              <div className="row  ">
                <label
                  htmlFor="from_store_id"
                  className="col-sm-2 col-form-label mr-0"
                >
                  From Store:
                </label>
                <div className="col-sm-4 pl-0 pr-2">
                  <select
                    id="from_store_id"
                    name="from_store_id"
                    className="form-control form-control-sm form-control-sm "
                    required
                    /* disabled={purchaseLoaded} */
                    onChange={handleValueChange}
                    value={newData.from_store_id}
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
                  htmlFor="tag_store_id"
                  className="col-sm-2 col-form-label text-right "
                >
                  Tag Store:
                </label>
                <div className="col-sm-4 pl-0">
                  <select
                    id="store_id"
                    name="store_id"
                    className="form-control form-control-sm form-control-sm "
                    required
                    onChange={handleValueChange}
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
              </div>
              <div className="row  ">
                <label
                  htmlFor="item_id"
                  className="col-sm-2 col-form-label mr-0"
                >
                  Item
                </label>
                {/* <div className="col-sm-4 pl-0">
                <SDD
                  listId="item_id"
                  method={itemSelect}
                  data={items}
                  value="itemname"
                  rowId="itemcode"
                  classes="form-control form-control-sm rounded-0"
                />        
              </div> */}
                <div className="col-sm-2 pl-0">
                  <input
                    type="text"
                    name="item_id"
                    id="item_id"
                    className="form-control form-control-sm bg-white"
                    readOnly
                    required
                    value={newData.item_id}
                    onChange={handleValueChange}
                    onKeyDown={(event) => {
                      if (event.key === 'F2') {
                        setListType('item');
                        showListSelection();
                      }
                    }}
                  />
                </div>
                <div className="col-sm-8 pl-0">
                  <input
                    type="text"
                    name="item_name"
                    id="item_name"
                    className="form-control form-control-sm  "
                    maxLength="100"
                    autoComplete="off"
                    required
                    value={newData.item_name}
                    onChange={handleValueChange}
                    onKeyDown={(event) => {
                      if (event.key === 'F2') {
                        setListType('item');
                        showListSelection();
                      }
                    }}
                  />
                </div>
              </div>
              <div className="row  ">
                <label
                  htmlFor="design_id"
                  className="col-sm-2 col-form-label mr-0 "
                >
                  Design
                </label>
                <div className="col-sm-6 pl-0">
                  {/* <SDD
                  listId="design_id"
                  method={designSelect}
                  data={designs}
                  value="design"
                  rowId="id"
                  classes="form-control form-control-sm rounded-0"
                /> */}
                  <select
                    id="design_id"
                    name="design_id"
                    className="form-control form-control-sm "
                    required
                    onChange={handleValueChange}
                    value={newData.design_id}
                  >
                    <option value="">---</option>
                    {designs.map((obj) => {
                      return (
                        <option key={obj.id} value={obj.id}>
                          {obj.designname}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <label
                  htmlFor="gold_type"
                  className="col-sm-2 col-form-label mr-0 "
                >
                  Gold Type
                </label>
                <div className="col-sm-2">
                  <select
                    id="gold_type"
                    name="gold_type"
                    className="form-control form-control-sm "
                    required
                    onChange={handleValueChange}
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
              </div>
              <div className="row  ">
                <label
                  htmlFor="weight"
                  className="col-sm-2 col-form-label mr-0 "
                >
                  Weight
                </label>
                <div className="col-sm-2 pl-0">
                  <input
                    type="text"
                    name="weight"
                    id="weight"
                    className="form-control form-control-sm text-right "
                    onFocus={(e) => e.target.select()}
                    required
                    value={newData.weight}
                    onChange={handleValueChange}
                  />
                </div>

                <label htmlFor="size" className="col-sm-2 col-form-label  ">
                  Size/ Length
                </label>
                <div className="col-sm-2 ">
                  {/* <SDD
                  listId="size_id"
                  method={sizeSelect}
                  data={sizes}
                  value="size"
                  rowId="id"
                  classes="form-control form-control-sm rounded-0"
                /> */}
                  <select
                    id="size_id"
                    name="size_id"
                    className="form-control form-control-sm "
                    required
                    onChange={handleValueChange}
                    value={newData.size_id}
                  >
                    <option value="">---</option>
                    {sizes.map((obj) => {
                      return (
                        <option key={obj.id} value={obj.id}>
                          {obj.size}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <label htmlFor="metal_type" className="col-sm-2 col-form-label  ">
                  Metal
                </label>
                <div className="col-sm-2 ">
                <select
                    id="metal_type"
                    name="metal_type"
                    className="form-control form-control-sm "
                    required
                    onChange={handleValueChange}
                    value={newData.metal_type}
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
              </div>

              <div className="row  ">
                <label
                  htmlFor="stone_weight"
                  className="col-sm-2 col-form-label mr-0 "
                >
                  Stone Weight
                </label>
                <div className="col-sm-2 pl-0">
                  <input
                    type="text"
                    name="stone_weight"
                    id="stone_weight"
                    className="form-control form-control-sm text-right "
                    onFocus={(e) => e.target.select()}
                    required
                    value={newData.stone_weight}
                    onChange={handleValueChange}
                  />
                </div>
                <label
                  htmlFor="stone_amount"
                  className="col-sm-2 col-form-label  "
                >
                  Stone Amount
                </label>
                <div className="col-sm-2 ">
                  <input
                    type="text"
                    name="stone_amount"
                    id="stone_amount"
                    className="form-control form-control-sm text-right "
                    onFocus={(e) => e.target.select()}
                    required
                    value={newData.stone_amount}
                    onChange={handleValueChange}
                  />
                </div>

                <label htmlFor="color_type" className="col-sm-2 col-form-label  ">
                  Color
                </label>
                <div className="col-sm-2 ">
                <select
                    id="color_type"
                    name="color_type"
                    className="form-control form-control-sm "
                    required
                    onChange={handleValueChange}
                    value={newData.color_type}
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

              <div className="row  ">
                <label htmlFor="gender_type" className="col-sm-2 col-form-label mr-0 ">
                  Gender
                </label>
                <div className="col-sm-2 pl-0">
                <select
                    id="gender_type"
                    name="gender_type"
                    className="form-control form-control-sm text-right "
                    required
                    onChange={handleValueChange}
                    value={newData.gender_type}
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

              <div className="row  ">
                <label htmlFor="cost" className="col-sm-2 col-form-label mr-0 ">
                  Cost
                </label>
                <div className="col-sm-2 pl-0">
                  <input
                    ref={refCost}
                    type="text"
                    name="cost"
                    id="cost"
                    className="form-control form-control-sm text-right "
                    onFocus={(e) => e.target.select()}
                    required
                    value={newData.cost}
                    onChange={handleValueChange}
                  />
                </div>
                <label htmlFor="min_price" className="col-sm-2 col-form-label ">
                  Min Price
                </label>
                <div className="col-sm-2 ">
                  <input
                    type="text"
                    name="min_price"
                    id="min_price"
                    className="form-control form-control-sm text-right "
                    onFocus={(e) => e.target.select()}
                    required
                    value={newData.min_price}
                    onChange={handleValueChange}
                  />
                </div>
                <label htmlFor="max_price" className="col-sm-2 col-form-label ">
                  Max Price
                </label>
                <div className="col-sm-2 ">
                  <input
                    ref={refMaxPrice}
                    type="text"
                    name="max_price"
                    id="max_price"
                    className="form-control form-control-sm text-right "
                    onFocus={(e) => e.target.select()}
                    required
                    value={newData.max_price}
                    onChange={handleValueChange}
                  />
                </div>
              </div>

              {/* ===== End of Left Column ===== */}
            </div>
            <div className="col-sm-3">
              {/* ===== Tag Item Section Right Column ===== */}
              <div className=" row ">
                <label
                  htmlFor="tag_no"
                  className="col-sm-4 col-form-label px-0"
                >
                  Tag No.
                </label>
                <div className="col-sm-8">
                  <input
                    type="text"
                    name="tag_no"
                    id="tag_no"
                    className="form-control form-control-sm "
                    minLength="7"
                    maxLength="10"
                    required
                    value={newData.tag_no}
                    onChange={handleValueChange}
                  />
                </div>
              </div>
              <div className="row">
                <label
                  htmlFor="gold_rate"
                  className="col-sm-4 col-form-label px-0 "
                >
                  Gold Rate
                </label>
                <div className="col-sm-8">
                  <input
                    type="text"
                    name="gold_rate"
                    id="gold_rate"
                    className="form-control form-control-sm text-right"
                    required
                    value={newData.gold_rate}
                    onChange={handleValueChange}
                    readOnly
                  />
                </div>
              </div>
              <div className="row">
                <img id="barcode_print" className="p-0 m-0" />
              </div>
            </div>
            {/* ===== End of Tag Item Section ===== */}
          </div>
          <hr />
          <div className="form-row my-2">
            {/* ===== Action buttons section ===== */}
            <div className="col-sm-2">
              {/* <SystemButton type="no-form-save" showText method={save} /> */}
              <SystemButton type="save" showText />
            </div>
            <div className="col-sm-2">
              <SystemButton type="print" showText method={printReceipt} />
            </div>
            <div className="col-sm-2">
              <SystemButton type="cancel" showText />
            </div>
            <div className="col-sm-2">
              <SystemButton type="reset" showText method={resetForm} />
            </div>
          </div>
          <hr />
          {Object.keys(taggedItems).length !== 0 ? (
            <div className="row mt-3">
              <table className="table table-bordered">
                <thead className="thead-light">
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Tag No.</th>
                    <th scope="col">Item</th>
                    <th scope="col" className="text-right">
                      Weight
                    </th>
                    <th scope="col" className="text-right">
                      Stone Weight
                    </th>
                    <th scope="col" className="text-right">
                      Cost
                    </th>
                    {/* <th scope="col">Location</th> */}
                  </tr>
                </thead>
                <tbody>
                  {taggedItems.map((item, index) => {
                    return (
                      <tr key={item.id}>
                        <th scope="row">{index + 1}</th>
                        <td>{item.tag_no}</td>
                        <td>{item.item_name}</td>
                        <td className="text-right">{item.weight}</td>
                        <td className="text-right">{item.weight_stome}</td>
                        <td className="text-right">{item.cost}</td>
                        {/* <td>{item.store_id}</td> */}
                      </tr>
                    );
                  })}
                </tbody>
                {/* <tfoot>
                <tr>
                  <td colSpan="3" className="text-right">
                    {' '}
                    Total
                  </td>
                  <td className="text-right">20g</td>
                  <td className="text-right">4g</td>
                  <td className="text-right">200000</td>
                </tr>
              </tfoot> */}
              </table>
            </div>
          ) : null}
        </div>
      </form>
    </div>
  );

  /* --- End of component renders --- */
};

export default TagCreation;
