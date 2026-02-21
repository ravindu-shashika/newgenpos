import React, { useState, useEffect } from 'react';
import moment from 'moment';
import {
  Loader,
  SDD,
  SystemButton,
  CustomerListSelection,
  FormModal,
} from '../../../components';
import { api, cookie, msg } from '../../../services';
import JsBarcode from 'jsbarcode';
import { jsPDF } from 'jspdf';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';

const JewellerySearch = () => {
  // Module name
  const moduleName = 'Jewellery Search';

  /* --- State declarationss --- */

  const [isLoading, setIsLoading] = useState({
    init: false,
  });

  const [isEdit, setIsEdit] = useState(false);

  const [entities, setEntities] = useState([]);

  const [newData, setNewData] = useState({
    user_id: cookie.get('user_id'),
    bc_no: cookie.get('user_branch'),
    ddate: moment().format('YYYY-MM-DD'),
    newDate: '',
    newId: '',
    // ddate: '',
    id: '',

    article: '',
    weight: '',
    weight_diff: '',
    designs: [],
    caratages: [],

    customer_id: '',
    customer_no: '',
    cusname: '',
    nicno: '',
    address: '',
    telNo: '',
    mobile: '',
    notes: '',
    reserved_customer_id: '',
    reserved_cusname: '',
  });

  const [tags, setTags] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [goldTypes, setGoldTypes] = useState([]);
  const [items, setItems] = useState([]);

  const [searchResult, setSearchResult] = useState([]);

  const [showModalState, setShowModalState] = useState(false);
  // reserved
  const [reserved, setReserved] = useState(false);

  // Selected data
  const [selectedId, setSelectedId] = useState('');

  const animatedComponents = makeAnimated();

  const options = [
    { value: 'chocolate', label: 'Chocolate' },
    { value: 'strawberry', label: 'Strawberry' },
    { value: 'vanilla', label: 'Vanilla' },
  ];

  let dataRows = [];

  /* --- End of state declarations --- */

  useEffect(() => {
    fetchData();
  }, []);

  const [showSectionStates, setShowSectionStates] = useState({
    customerSection: false,
    showInquiryButton: false,
    showNotFoundMsg: false,
  });

  /* --- Customer List Selection Required ---- */
  const [viewCustomerListSelection, setViewCustomerListSelection] =
    useState(false);
  const showCustomerListSelection = () => {
    setViewCustomerListSelection(!viewCustomerListSelection);
  };

  const selectCustomer = (dataObj) => {
    setNewData({
      ...newData,
      customer_id: dataObj.customer_id,
      customer_no: dataObj.customer_no,
      cusname: dataObj.cusname,
      nicno: dataObj.nicno,
      address: dataObj.address,
      telNo: dataObj.telNO,
      mobile: dataObj.mobile,
    });
  };
  /* ---  End of Customer List Selection Required ---- */
  /* --- Component functions --- */

  const fetchData = async () => {
    try {
      const response = await api.get(`jewellery-search`);

      if (response.data.items) {
        setItems(
          response.data.items.map((item) => {
            return { value: item.itemcode, label: item.itemname };
          }),
        );
      }
      if (response.data.designs) {
        setDesigns(
          response.data.designs.map((design) => {
            return { value: design.id, label: design.designname };
          }),
        );
      }
      if (response.data.gold_types) {
        setGoldTypes(
          response.data.gold_types.map((type) => {
            return { value: type.printval, label: type.printval };
          }),
        );
      }

      getCustomers();

      setNewData({
        ...newData,
        user_id: cookie.get('user_id'),
        bc_no: cookie.get('user_branch'),
        ddate: moment().format('YYYY-MM-DD'),
        newDate: '',
        newId: '',
        id: '',

        article: '',
        weight: '',
        weight_diff: '',
        designs: [],
        caratages: [],

        customer_id: '',
        customer_no: '',
        cusname: '',
        nicno: '',
        address: '',
        telNo: '',
        mobile: '',
        notes: '',
      });

      getAllAvailableTags();
    } catch (error) {
      return msg.error('Unable to fetch data!');
    }
  };

  const getAllAvailableTags = async () => {
    try {
      const response = await api.get(`get-available-tags`);

      if (response.data) {
        setTags(response.data);
      }
    } catch (error) {
      return msg.error('Unable to fetch data!');
    }
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

  const changeArticle = (article) => {
    setNewData({
      ...newData,
      article: article,
    });
  };
  const changeDesign = (option) => {
    setNewData({
      ...newData,
      designs: option,
    });
  };
  const changeCaratage = (option) => {
    setNewData({
      ...newData,
      caratages: option,
    });
  };

  const handleSubmit = async () => {
    if (checkBeforeSave() === false) return;
    await save();
  };

  const save = async () => {
    try {
      const response = await api
        .post('jewellery-search/make-inquiry')
        .values(newData);
      if (response.data) {
        resetAll();
      }
      //   if (parseInt(response.data) > 0) {
      //     printReceipt(response.data, false);
      //   }
    } catch (err) {
      msg.error(err);
      return;
    }
  };

  const checkBeforeSave = () => {
    if (newData.tag_id === '') {
      msg.warning('Select Tag before save.');
      return false;
    }

    if (newData.new_tag_no === '') {
      msg.warning('Enter New Tag No before save.');
      return false;
    }

    return true;
  };

  const searchJewellery = async () => {
    try {
      const response = await api.post('jewellery-search').values(newData);
      if (response.data.tags) {
        setSearchResult(response.data.tags);
        // setReserved()
      }
      setShowSectionStates({
        ...showSectionStates,
        showInquiryButton: false,
        showNotFoundMsg: true,
      });
    } catch (err) {
      msg.error(err);
      return;
    }
  };

  const resetAll = async () => {
    setIsEdit(false);

    setNewData({
      user_id: cookie.get('user_id'),
      bc_no: cookie.get('user_branch'),

      ddate: newData.newDate,
      id: newData.newId,

      article: '',
      weight: '',
      weight_diff: '',
      designs: [],
      caratages: [],

      customer_id: '',
      customer_no: '',
      cusname: '',
      nicno: '',
      address: '',
      telNo: '',
      mobile: '',
      notes: '',
    });

    setSearchResult([]);

    return true;
  };

  const toggleCustomerSection = () => {
    setShowSectionStates({
      ...showSectionStates,
      customerSection: !showSectionStates.customerSection,
    });
  };

  const toggleReservedForm = () => {
    setShowModalState(!showModalState);
  };

  const toggleReservedFormWithParameeter = (tag_no) => {
    setSelectedId(tag_no);
    setShowModalState(!showModalState);
  };

  const reserveTag = async () => {
    console.log(selectedId);
    try {
      const response = await api
        .post(`reserve-jewellery/${selectedId}`)
        .values(newData);
      if (response.data) {
        window.location.reload();
        toggleReservedForm();
        resetAll();
      }
      // /${selectedId}
    } catch (err) {
      msg.error(err);
      return;
    }
  };

  const getCustomers = async () => {
    try {
      setIsLoading(true);

      const response = await api.get('customers');
      dataRows = [];

      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err[0]);
        });
        return;
      }
      response.data.data.map((entity) => {
        return dataRows.push({
          customer_id: entity.customer_id,
          customer_no: entity.customer_no,
          bc: entity.bc,
          nicno: entity.nicno,
          cusname: entity.cusname,
          address: entity.address ? entity.address : '',
          address2: entity.address2 ? entity.address2 : '',
          telNo: entity.telNo ? entity.telNo : '',
          mobile: entity.mobile ? entity.mobile : '',
          email: entity.email ? entity.email : '',
          notes: entity.notes ? entity.notes : '',
          isblackListed: entity.isblackListed,
        });
      });

      setEntities(dataRows);

      setIsLoading(false);
    } catch (error) {
      msg.error('Unable to fetch data!');
    }
  };

  const cusSelect = (selectedObj) => {
    setNewData({
      ...newData,
      reserved_cusname: selectedObj.cusname,
      reserved_customer_id: selectedObj.customer_id,
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
      <FormModal
        moduleName={'Reserve Tag'}
        modalState={showModalState}
        toggleFormModal={toggleReservedForm}
        width="50%"
      >
        <div>
          <div className="modal-body">
            <div className="row">
              <label htmlFor="code" className="col-sm-2 col-form-label">
                Date
              </label>
              <div className="col-sm-4">
                <input
                  type="date"
                  name="ddate"
                  id="ddate"
                  maxLength="20"
                  minLength="10"
                  className="form-control form-control-sm text-right"
                  value={newData.ddate}
                  onChange={handleValueChanges}
                />
              </div>
            </div>
            <div className="row">
              <label htmlFor="weight" className="col-sm-2 col-form-label">
                Customer
              </label>
              <div className="col-sm-4">
              <SDD
                method={cusSelect}
                data={entities}
                value="cusname"
                rowId="customer_id"
                classes="form-control form-control-sm"
                placeholder="Customer"
                listId="customer"
                selected={newData.reserved_cusname}
              />
              </div>
            </div>
          </div>
          {/* searchResult */}
          <div className="modal-footer">
            <SystemButton
              type="no-form-save"
              method={reserveTag}
              showText={true}
            />
            <SystemButton
              type={'close'}
              method={toggleReservedForm}
              showText={true}
            />
          </div>
        </div>
      </FormModal>
      <br />
      <h4 className="text-center">{moduleName}</h4>
      <br />
      <div className="row">
        <div className="col-sm-9">
          <div className="row">
            <label htmlFor="article" className="col-sm-2 col-form-label">
              Article
            </label>
            <div className="col-sm-6 pl-0">
              <Select
                name="article"
                options={items}
                components={animatedComponents}
                className="basic-multi-select"
                classNamePrefix="Select a Article"
                onChange={changeArticle}
              />
            </div>
          </div>
          <div className="row mt-1">
            <label htmlFor="design" className="col-sm-2 col-form-label">
              Design
            </label>
            <div className="col-sm-6 pl-0">
              <Select
                // defaultValue={[options[2], options[3]]}
                isMulti
                name="design"
                options={designs}
                className="basic-multi-select"
                classNamePrefix="Select Designs"
                components={animatedComponents}
                onChange={changeDesign}
              />
            </div>
          </div>
          <div className="row mt-1">
            <label htmlFor="caratage" className="col-sm-2 col-form-label">
              Caratage
            </label>
            <div className="col-sm-6 pl-0">
              <Select
                // defaultValue={[options[2], options[3]]}
                isMulti
                components={animatedComponents}
                name="caratage"
                options={goldTypes}
                className="basic-multi-select"
                classNamePrefix="Select Caratages"
                onChange={changeCaratage}
              />
            </div>
          </div>
          <div className="row mt-2">
            <label htmlFor="weight" className="col-sm-2 col-form-label">
              Weight (g)
            </label>
            <div className="col-sm-2 pl-0">
              <input
                type="number"
                name="weight"
                id="weight"
                min="0"
                max="800"
                step="any"
                className="form-control form-control-sm text-right"
                value={newData.weight}
                onChange={handleValueChanges}
              />
            </div>
            <label
              htmlFor="weight_diff"
              className="col-sm-1 col-form-label text-right"
            >
              + / -
            </label>
            <div className="col-sm-2 pl-0">
              <input
                type="number"
                name="weight_diff"
                id="weight_diff"
                min="0"
                max="2"
                step="any"
                className="form-control form-control-sm text-right"
                value={newData.weight_diff}
                onChange={handleValueChanges}
              />
            </div>
          </div>
        </div>
        <div className="col-sm-3">
          {/* <div className="form-group row mb-0">
            <label htmlFor="ddate" className="col-sm-4 col-form-label px-0">
              Date
            </label>
            <div className="col-sm-8">
              <input
                type="date"
                className="form-control form-control-sm rounded-0"
                id="ddate"
                name="ddate"
                value={newData.ddate}
                onChange={handleValueChanges}
              />
            </div>
          </div> */}

          {/* <div className="form-group row mb-0">
            <label htmlFor="po_no" className="col-sm-4 col-form-label px-0">
              No.
            </label>
            <div className="col-sm-8">
              <input
                type="text"
                className="form-control form-control-sm rounded-0 text-right"
                id="id"
                name="id"
                value={newData.id}
                readOnly
              />
            </div>
          </div> */}
        </div>
      </div>
      <hr />
      <div className="row">
        <div className="col-sm-2">
          <SystemButton
            type="search2"
            showText="true"
            method={searchJewellery}
          />
        </div>
        {showSectionStates.showInquiryButton ? (
          <div className="col-sm-2">
            <SystemButton
              type={'section-toggle-2'}
              collapseState={showSectionStates.customerSection}
              method={() => toggleCustomerSection()}
              btnText="Make Inquiry"
              showText={true}
            />
          </div>
        ) : null}
      </div>
      <hr />

      {Object.keys(searchResult).length !== 0 ? (
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
                  Price
                </th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {searchResult.map((item, index) => {
                return (
                  <tr key={item.id}>
                    <th scope="row">{index + 1}</th>
                    <td>{item.tag_no}</td>
                    <td>{item.item_name}</td>
                    <td className="text-right">{item.weight}</td>
                    <td className="text-right">{item.weight_stome}</td>
                    <td className="text-right">{item.max_price}</td>
                    <td className="center">
                      {item.reserved ? (
                        <SystemButton
                          type={'reserve-tag'}
                          btnText="Reserved"
                          showText={true}
                          disabled={true}
                        />
                      ) : (
                        <SystemButton
                          type={'reserve-tag'}
                          method={() =>
                            toggleReservedFormWithParameeter(item.tag_no)
                          }
                          btnText="Reserve Tag"
                          showText={true}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : showSectionStates.showNotFoundMsg == true ? (
        <h4> Not found jewelleries as per your search details.</h4>
      ) : null}

      <hr />
      {showSectionStates.customerSection ? (
        <div>
          <h5 className="text-center">Customer Details</h5>
          <div className="row">
            <label htmlFor="customer_id" className="col-sm-2 col-form-label ">
              Customer Code
            </label>
            <div className="col-sm-3">
              <input
                type="text"
                className="form-control form-control-sm "
                id="customer_id"
                name="customer_id"
                value={newData.customer_id}
                onChange={handleValueChanges}
                onKeyDown={(e) => {
                  if (e.key === 'F2') {
                    showCustomerListSelection();
                  }
                }}
                readOnly
                placeholder="Press <F2>"
                autoComplete="no"
              />
            </div>
          </div>
          <div className="row">
            <label htmlFor="cusname" className="col-sm-2 col-form-label">
              Customer Name
            </label>
            <div className="col-sm-10">
              <input
                type="text"
                id="cusname"
                name="cusname"
                className="form-control form-control-sm"
                placeholder="Customer Name"
                maxLength="100"
                value={newData.cusname}
                onChange={handleValueChanges}
              />
            </div>
          </div>

          <div className="row">
            <label htmlFor="address" className="col-sm-2 col-form-label">
              Address
            </label>
            <div className="col-sm-10">
              <textarea
                id="address"
                name="address"
                className="form-control form-control-sm mb-1"
                rows="2"
                maxLength="200"
                placeholder="Postal Address"
                value={newData.address}
                onChange={handleValueChanges}
              ></textarea>
            </div>
          </div>

          <div className=" row"></div>
          <div className=" row">
            <label htmlFor="mobile" className="col-sm-2 col-form-label ">
              Mobile
            </label>
            <div className="col-sm-4">
              <input
                type="text"
                name="mobile"
                id="mobile"
                maxLength="12"
                minLength="9"
                className="form-control form-control-sm "
                value={newData.mobile}
                onChange={handleValueChanges}
              />
            </div>
          </div>

          <div className=" row">
            <label htmlFor="notes" className="col-sm-2 col-form-label">
              Notes
            </label>
            <div className="col-sm-10">
              <textarea
                name="notes"
                id="notes"
                rows="2"
                maxLength="100"
                className="form-control form-control-sm mb-1"
                value={newData.notes}
                onChange={handleValueChanges}
              ></textarea>
            </div>
          </div>

          <div className="row">
            <div className="col-sm-2">
              <SystemButton
                type="no-form-save"
                showText
                method={handleSubmit}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );

  /* --- End of component renders --- */
};

export default JewellerySearch;
