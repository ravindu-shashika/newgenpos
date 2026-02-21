import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import { Loader, SDD, SystemButton } from '../../../components';
import { api, cookie, msg } from '../../../services';
import OpeningStockPrint from '../../../printouts/OpeningStockA4Half';

const OpeningStock = () => {
  // Module name
  const moduleName = 'Opening Stock';

  /* --- Route params --- */

  const { nno, bc_no } = useParams();

  /* --- End of route params --- */

  /* --- State declarations --- */

  const [isLoading, setIsLoading] = useState({
    init: false,
  });

  const [isEdit, setIsEdit] = useState(false);

  const [newData, setNewData] = useState({
    id: '',
    bc_no: cookie.get('user_branch'),
    ddate: '',
    new_ddate: '',
    store_id: '',
    store_name: '',
    total_value: 0,
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
    item_id: '',
    item: {
      itemcode: '',
      itemname: '',
    },
    qty: 0,
    weight: 0,
    stone_weight: 0,
    value: 0,
  });

  const [officers, setOfficers] = useState([]);
  const [stores, setStores] = useState([]);
  const [items, setItems] = useState([]);
  const [goldTypes, setGoldTypes] = useState([]);

  const [approved, setApproved] = useState(false);

  /* --- End of state declarations --- */

  const initUpdate = useRef(true);
  const isApproved = useRef(false);

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

  /* --- Component functions --- */

  const fetchData = async () => {
    try {
      // setIsLoading({
      //   ...isLoading,
      //   init: true,
      // });

      isApproved.current = false;

      const response = await api.get(`opening-stock`);

      setStores(response.data.stores);

      setItems(response.data.items);
      setGoldTypes(response.data.gold_types);

      setApproved(false);

      setNewData({
        bc_no: cookie.get('user_branch'),
        ddate: moment(response.data.new_date).format('YYYY-MM-DD'),
        new_ddate: moment(response.data.new_date).format('YYYY-MM-DD'),
        id: response.data.new_id,
        new_id: response.data.new_id,
        store_id: '',
        store_name: '',
        total_value: 0,
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

      // setIsLoading({
      //   ...isLoading,
      //   init: false,
      // });
    } catch (error) {
      return msg.error('Unable to fetch data!');
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
        `opening-stock/${newData.id}/${newData.bc_no}`,
      );

      isApproved.current = response.data.is_approved ? true : false;

      let dataObj = response.data;

      const details = response.data.details.map((item) => {
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
      return msg.error('Unable to fetch data!');
    }
  };

  const loadPO = async () => {
    isApproved.current = false;

    const response = await api.get(
      `purchase-orders/${newData.po_id}/${newData.bc_no}`,
    );

    const details = response.data.details.map((item) => {
      return { ...item, index: uuidv4() };
    });

    setNewData({
      ...response.data,
      nno: newData.new_nno,
      ddate: newData.new_ddate,
      new_nno: newData.new_nno,
      new_ddate: newData.new_ddate,
      po_id: response.data.nno,
      vendor_invoice_no: '',
      store_id: '',
      store_name: '',
      discount: 0,
      total_value: response.data.total_amount,
      details: details,
    });
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
    if (checkBeforeSave() === false) return;

    await save();
  };

  const save = async () => {
    try {
      if (!isEdit) {
        const response = await api.post('opening-stock').values(newData);

        if (parseInt(response.data) > 0) {
          printReceipt(response.data, false);
          fetchData();
          msg.success('Opening Stock Saved Successfully.');
        }
      } else {
        // const response = await api
        //   .update(`opening-stock/${newData.id}`)
        //   .values(newData);
        const response = await api
          .put('opening-stock', newData.id)
          .values(newData);

          if (parseInt(response.data) > 0) {
            printReceipt(response.data, false);
            fetchData();
            msg.success('Opening Stock Saved Successfully.');
          }

      }
      // // resetAll();
      // fetchData();
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
      item_id: '',
      item: {
        itemcode: '',
        itemname: '',
      },
      qty: 0,
      weight: 0,
      stone_weight: 0,
      value: 0,
    });
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

    if (itemRow.value === '' || itemRow.value === 0) {
      msg.warning('Item value not valid.');
      return false;
    }

    return true;
  };

  const checkBeforeSave = () => {
    if (parseFloat(newData.details) === []) {
      msg.warning('Please add at least one item');
      return false;
    }

    // if (newData.officer_id === '' || newData.officer_name === '') {
    //   msg.warning('Select an officer');
    //   return false;
    // }

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

    newData.details.forEach((row) => {
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
      total_amount = parseFloat(parseFloat(total_amount) + parseFloat(row.value)).toFixed(2);
      // prettier-ignore-end
    });

    setNewData({
      ...newData,
      total_qty: total_qty,
      total_weight: total_weight,
      total_stone_weight: total_stone_weight,
      total_amount: total_amount,
      total_value: parseFloat(total_amount).toFixed(2),
    });
  };

  const printReceipt = (trans_no, is_dupplicate) => {
    OpeningStockPrint.load(trans_no, cookie.get('user_branch'), is_dupplicate);
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
      id: newData.new_id,
      store_id: '',
      store_name: '',
      total_value: 0,
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

    setItems([]);

    clearItemRow();
  };

  /* --- End of component functions --- */

  /* --- Component renders --- */

  return (
    <div>
      <h5 className="text-center">{moduleName}</h5>
      <br />
      {isLoading.init ? (
        <Loader />
      ) : (
        <div>
          <div className="row">
            <div className="col-sm-8">
              <div className="form-group row mb-0">
                <label htmlFor="supplier" className="col-sm-2 col-form-label">
                  Stores
                </label>
                <div className="col-sm-8">
                  <select
                    id="store_id"
                    name="store_id"
                    className="form-control form-control-sm form-control-sm "
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
                    className="form-control form-control-sm"
                    id="ddate"
                    name="ddate"
                    value={newData.ddate}
                    onChange={handleValueChanges}
                  />
                </div>
              </div>

              <div className="form-group row mb-0">
                <label htmlFor="id" className="col-sm-5 col-form-label">
                  No
                </label>
                <div className="col-sm-7">
                  <input
                    type="text"
                    className="form-control form-control-sm text-right"
                    id="id"
                    name="id"
                    onFocus={(e) => e.target.select()}
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

              {/* <div className="form-group row mb-0">
                <label htmlFor="gold_rate" className="col-sm-5 col-form-label">
                  Gold Rate
                </label>
                <div className="col-sm-7">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    id="gold_rate"
                    name="gold_rate"
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
                    <td width="30%">Item</td>
                    <td width="19%">Gold Type</td>
                    <td width="10%">Quantity</td>
                    <td width="10%">Weight (g)</td>
                    <td width="10%">Stone Weight (g)</td>
                    <td width="15%">Value (LKR)</td>
                    <td width="3%"></td>
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
                      <select
                        id="gold_type"
                        name="gold_type"
                        className="form-control form-control-sm form-control-sm "
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
                        onFocus={(e) => e.target.select()}
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
                        onFocus={(e) => e.target.select()}
                        placeholder="Weight"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="stone_weight"
                        id="stone_weight"
                        step="0.01"
                        className="form-control form-control-sm text-right"
                        value={itemRow.stone_weight}
                        onChange={handleItemRowChanges}
                        onFocus={(e) => e.target.select()}
                        placeholder="ST Weight"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        name="value"
                        id="value"
                        className="form-control form-control-sm text-right"
                        value={itemRow.value}
                        onChange={handleItemRowChanges}
                        onFocus={(e) => e.target.select()}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            addNewItem();
                          }
                        }}
                        placeholder="Cost (LKR)"
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
                            className="form-control-plaintext form-control-sm"
                            value={newData.details[index].item.itemname}
                            readOnly
                          />
                        </td>
                        <td>
                          {/* <input
                            type="text"
                            name="gold_type"
                            id="gold_type"
                            data-id={index}
                            className="form-control form-control-sm"
                            value={newData.details[index].gold_type}
                            onChange={handleItemsChange}
                            
                          /> */}
                          <select
                            id="gold_type"
                            name="gold_type"
                            className="form-control form-control-sm form-control-sm "
                            data-id={index}
                            onChange={handleItemsChange}
                            value={newData.details[index].gold_type}
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
                            name="stone_weight"
                            id="stone_weight"
                            step="0.01"
                            data-id={index}
                            className="form-control form-control-sm text-right"
                            value={newData.details[index].stone_weight}
                            onChange={handleItemsChange}
                            placeholder="ST Weight"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            name="value"
                            id="value"
                            data-id={index}
                            className="form-control form-control-sm text-right"
                            value={newData.details[index].value}
                            onChange={handleItemsChange}
                            placeholder="Value (LKR)"
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
                    <th className="text-center" colSpan="6">
                      Totals
                    </th>

                    <td>
                      <input
                        type="text"
                        className="form-control-plaintext text-right kinda-important-text-3"
                        id="total_value"
                        name="total_value"
                        value={newData.total_value}
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
                  ></textarea>
                </div>
              </div>
            </div>
            <div className="col-sm-4">
              {/* <div className="form-group row mb-0">
                <label htmlFor="total_value" className="col-sm-5 col-form-label">
                  Total Value
                </label>
                <div className="col-sm-7">
                  <input
                    type="text"
                    className="form-control-plaintext form-control-sm text-right kinda-important-text-2"
                    id="total_value"
                    name="total_value"
                    onFocus={(e) => e.target.select()}
                    value={newData.total_value}
                    readOnly
                  />
                </div>
              </div> */}
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
            {isEdit && !newData.is_approved ? (
              <div className="col-sm-2">
                <SystemButton type="cancel" showText />
              </div>
            ) : null}
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

export default OpeningStock;
