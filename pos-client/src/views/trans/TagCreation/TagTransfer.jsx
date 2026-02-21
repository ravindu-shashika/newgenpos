import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { Loader, SDD, SystemButton } from '../../../components';
import { api, cookie, msg } from '../../../services';
import JsBarcode from 'jsbarcode';
import { jsPDF } from 'jspdf';

const TagTransfer = () => {
  // Module name
  const moduleName = 'Tag Transfer';

  /* --- State declarationss --- */

  const [isLoading, setIsLoading] = useState({
    init: false,
  });

  const [isEdit, setIsEdit] = useState(false);

  const [isShowDetails, setIsShowDetails] = useState(false);

  const [newData, setNewData] = useState({
    id: '',
    user_id: cookie.get('user_id'),
    bc_no: cookie.get('user_branch'),
    newDate: '',
    newId: '',
    ddate: moment().format(`YYYY-MM-DD`),
    id: '',
    to_bc: '',

    tag_id: '',
    tag_no: '',
    new_tag_no: '',
    stores: '',
    to_bc: '',
    to_stores: '',
  });

  const [tagDetails, setTagDetails] = useState({
    item_name: '',
    gold_type: '',
    gold_rate: '',
    weight: '',
    weight_stome: '',
    tag_type: '',
  });

  const [tags, setTags] = useState([]);
  const [stores, setStores] = useState([]);
  const [branches, setBranches] = useState([]);
  const [toStores, setToStores] = useState([]);

  /* --- End of state declarations --- */

  useEffect(() => {
    fetchData();
  }, []);

  /* --- Component functions --- */

  const fetchData = async () => {
    try {
      const response = await api.get(`get-transfer`);

      if (response.data) {
        setStores(response.data.stores);
        setBranches(response.data.branches);
      }

      setNewData({
        ...newData,
        user_id: cookie.get('user_id'),
        bc_no: cookie.get('user_branch'),
        newDate: '',
        newId: response.data.new_id,
        ddate: moment().format(`YYYY-MM-DD`),
        id: '',
        to_bc: '',

        tag_id: '',
        tag_no: '',
        new_tag_no: '',
        stores: '',
        to_bc: '',
        to_stores: '',
      });
    } catch (error) {
      return msg.error('Unable to fetch data!');
    }
  };

  const handleValueChanges = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue = targetInput.value;

    if (inputName === 'stores') {
      getTagsForStores(inputValue);
    }

    if (inputName === 'to_bc') {
      getStoresForBranch(inputValue);
    }

    if (inputName === 'tag_id') {
      getTagDetails(inputValue);

      let tag_no = targetInput.options[targetInput.selectedIndex].text;

      setNewData({
        ...newData,
        [inputName]: inputValue,
        tag_no: tag_no,
      });

      // generateBarcode(tag_no);
    } else {
      setNewData({
        ...newData,
        [inputName]: inputValue,
      });
    }
  };

  const getTagsForStores = async (id) => {
    try {
      setIsShowDetails(false);
      const response = await api.get(`get-tags-for-store/${id}`);

      if (response.data) {
        setTags(response.data.tags);
      }
    } catch (error) {
      return msg.error('Unable to fetch data!');
    }
  };

  const getStoresForBranch = async (id) => {
    try {
      const response = await api.get(`get-stores-for-to-branch/${id}`);

      if (response.data) {
        setToStores(response.data.toStores);
      }
    } catch (error) {
      return msg.error('Unable to fetch data!');
    }
  };

  const getTagDetails = async (id) => {
    try {
      var tagtype = '';
      setIsShowDetails(true);
      const response = await api.get(`get-tag-details/${id}`);

      if (response.data.tagDetails) {
        if (response.data.tagDetails.tag_type === 'N') {
          tagtype = 'New Tag';
        } else if (response.data.tagDetails.tag_type === 'F') {
          tagtype = 'Forfited Tag';
        } else if (response.data.tagDetails.tag_type === 'F') {
          tagtype = 'Opening Stock Tag';
        }
        setTagDetails({
          ...tagDetails,
          item_name: response.data.tagDetails.item_name,
          gold_type: response.data.tagDetails.gold_type,
          gold_rate: response.data.tagDetails.gold_rate,
          weight: response.data.tagDetails.weight,
          weight_stome: response.data.tagDetails.weight_stome,
          tag_type: tagtype, //response.data.tagDetails.tag_type,
        });
      }
    } catch (error) {
      return msg.error('Unable to fetch data!');
    }
  };

  const handleSubmit = async () => {
    // event.preventDefault();
    if (checkBeforeSave() === false) return;
    await save();
  };

  const save = async () => {
    try {
      const response = await api.update(`get-transfer`).values(newData);

      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err[0]);
        });
        return;
      }

      msg.success(response.data);
      resetAll();
    } catch (error) {
      console.error(error);
    } finally {
      fetchData();
      resetAll();
    }
  };

  const checkBeforeSave = () => {
    if (newData.stores === '') {
      msg.warning('Select From Store before save.');
      return false;
    }
    
    if (newData.tag_no === '') {
      msg.warning('Select Transfer Tag No before save.');
      return false;
    }

    if (newData.to_bc === '') {
      msg.warning('Select To Branch No before save.');
      return false;
    }

    if (newData.to_stores === '') {
      msg.warning('Select To Store before save.');
      return false;
    }

    return true;
  };

  const resetAll = async () => {
    setIsLoading({
      init: false,
    });

    setNewData({
      user_id: cookie.get('user_id'),
      bc_no: cookie.get('user_branch'),
      newDate: '',
      newId: '',
      ddate: '',
      id: '',
      to_bc: '',

      tag_id: '',
      tag_no: '',
      new_tag_no: '',
      stores: '',
      to_bc: '',
      to_stores: '',
    });

    setTagDetails({
      ...tagDetails,
      item_name: '',
      gold_type: '',
      gold_rate: '',
      weight: '',
      weight_stome: '',
      tag_type: '',
    });

    setIsShowDetails(false);

    return true;
  };

  /* --- End of component functions --- */

  /* --- Component renders --- */

  return (
    <div>
      <br />
      <h5 className="text-center">{moduleName}</h5>
      <br />
      {isLoading.init ? (
        <Loader />
      ) : (
        <div>
          <div className="row mb-3">
            <div className="col-sm-9 px-0"></div>
          </div>

          <div className="row">
            <label htmlFor="ddate" className="col-sm-6 col-form-label"></label>
            <label htmlFor="ddate" className="col-sm-1 col-form-label">
              Date.
            </label>
            <div class="col-md-2 mb-3">
              <input
                type="text"
                className="form-control form-control-sm  text-right"
                id="ddate"
                name="ddate"
                value={newData.ddate}
                readOnly
              />
            </div>
          </div>
          <div className="row">
            <label htmlFor="newId" className="col-sm-6 col-form-label"></label>
            <label htmlFor="newId" className="col-sm-1 col-form-label">
              No.
            </label>
            <div class="col-md-2 mb-3">
              <input
                type="text"
                className="form-control form-control-sm  text-right"
                id="newId"
                name="newId"
                value={newData.newId}
                readOnly
              />
            </div>
          </div>

          <br />

          <div className="row">
            <label htmlFor="stores" className="col-sm-2 col-form-label">
              Stores
            </label>
            <div className="col-sm-3">
              <select
                id="stores"
                name="stores"
                className="form-control form-control-sm "
                required
                onChange={handleValueChanges}
                value={newData.stores}
              >
                <option value="">---</option>
                {stores
                  ? stores.map((obj) => {
                      return (
                        <option key={obj.id} value={obj.id}>
                          {obj.description}
                        </option>
                      );
                    })
                  : null}
              </select>
            </div>

            <label htmlFor="tag_id" className="col-sm-1 col-form-label">
              Tag No
            </label>
            <div className="col-sm-3">
              <select
                id="tag_id"
                name="tag_id"
                className="form-control form-control-sm "
                required
                onChange={handleValueChanges}
                value={newData.tag_id}
              >
                <option value="">---</option>

                {tags
                  ? tags.map((obj) => {
                      return (
                        <option key={obj.id} value={obj.id}>
                          {obj.tag_no}
                        </option>
                      );
                    })
                  : null}
              </select>
            </div>
          </div>

          <br />
          <br />
          {isShowDetails ? (
            <div>
              <div className="row">
                <label
                  htmlFor="stores"
                  className="col-sm-2 col-form-label"
                ></label>
                <div class="col-md-3 mb-3">
                  <label for="item_name">Item Name</label>
                  <input
                    type="text"
                    className="form-control form-control-sm "
                    id="item_name"
                    name="item_name"
                    value={tagDetails.item_name}
                    onChange={handleValueChanges}
                    readOnly
                  />
                </div>
                <div class="col-md-2 mb-3">
                  <label for="gold_type">Gold Type</label>
                  <input
                    type="text"
                    className="form-control form-control-sm "
                    id="gold_type"
                    name="gold_type"
                    value={tagDetails.gold_type}
                    onChange={handleValueChanges}
                    readOnly
                  />
                </div>
                <div class="col-md-2 mb-3">
                  <label for="gold_rate">Gold Rate</label>
                  <input
                    type="text"
                    className="form-control form-control-sm "
                    id="gold_rate"
                    name="gold_rate"
                    value={tagDetails.gold_rate}
                    onChange={handleValueChanges}
                    readOnly
                  />
                </div>
              </div>

              <div className="row">
                <label
                  htmlFor="stores"
                  className="col-sm-2 col-form-label"
                ></label>
                <div class="col-md-3 mb-3">
                  <label for="item_name">Weight</label>
                  <input
                    type="text"
                    className="form-control form-control-sm "
                    id="weight"
                    name="weight"
                    value={tagDetails.weight}
                    onChange={handleValueChanges}
                    readOnly
                  />
                </div>
                <div class="col-md-2 mb-3">
                  <label for="weight_stome">Stone Weight</label>
                  <input
                    type="text"
                    className="form-control form-control-sm "
                    id="weight_stome"
                    name="weight_stome"
                    value={tagDetails.weight_stome}
                    onChange={handleValueChanges}
                    readOnly
                  />
                </div>
                <div class="col-md-2 mb-3">
                  <label for="tag_type">Tag Type</label>
                  <input
                    type="text"
                    className="form-control form-control-sm "
                    id="tag_type"
                    name="tag_type"
                    value={tagDetails.tag_type}
                    onChange={handleValueChanges}
                    readOnly
                  />
                </div>
              </div>
            </div>
          ) : null}
          <br />
          <br />
          <div className="row">
            <label htmlFor="to_bc" className="col-sm-2 col-form-label">
              To Branch
            </label>
            <div className="col-sm-3">
              <select
                id="to_bc"
                name="to_bc"
                className="form-control form-control-sm "
                required
                onChange={handleValueChanges}
                value={newData.to_bc}
              >
                <option value="">---</option>
                {branches
                  ? branches.map((obj) => {
                      return (
                        <option key={obj.bc_no} value={obj.bc_no}>
                          {obj.name}
                        </option>
                      );
                    })
                  : null}
              </select>
            </div>

            <label htmlFor="to_stores" className="col-sm-1 col-form-label">
              To Stores
            </label>
            <div className="col-sm-3">
              <select
                id="to_stores"
                name="to_stores"
                className="form-control form-control-sm "
                required
                onChange={handleValueChanges}
                value={newData.to_stores}
              >
                <option value="">---</option>

                {toStores
                  ? toStores.map((obj) => {
                      return (
                        <option key={obj.id} value={obj.id}>
                          {obj.description}
                        </option>
                      );
                    })
                  : null}
              </select>
            </div>
          </div>

          <br />
          <br />
          <hr />
          <div className="row d-flex justify-content-end">
            <div className="col-sm-2">
              <SystemButton
                type="no-form-save"
                showText
                method={handleSubmit}
              />
            </div>

            {/* <div className="col-sm-2">
              <SystemButton
                type="print"
                showText
              />
            </div> */}
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

export default TagTransfer;
