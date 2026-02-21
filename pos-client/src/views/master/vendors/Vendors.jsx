import React, { useState, useEffect } from 'react';
import { api, msg, cookie } from '../../../services';
import { FormModal, ListView, SystemButton } from '../../../components';
import moment from 'moment';

const Vendors = () => {
  // Module name
  const moduleName = 'Vendors';

  /* --- State declarationss --- */

  const [entities, setEntities] = useState([]);

  const [newData, setNewData] = useState({
    code: '',
    name: '',
    nic: '',
    description: '',
    oc: cookie.get('user_id'),
    action_date: moment(),
    is_cash_customer: false,
    address: '',
    tp: '',
    mobile: '',
    fax: '',
    e_mail: '',
    inactive: false,
    new_id: '',
    account_id: '',
  });

  // Form modal state
  const [showModalState, setShowModalState] = useState(false);

  // Data edit state
  const [isEdit, setIsEdit] = useState(false);

  // Data loading status
  const [isLoading, setIsLoading] = useState(false);

  // Selected data
  const [selectedId, setSelectedId] = useState('');

  // List view states
  const dataColumns = [
    {
      title: 'Code',
      name: 'code',
      searchable: true,
      class: 'text-center',
    },
    { title: 'Name', name: 'name', searchable: true },
    // { title: 'NIC', name: 'nic', searchable: true },
    { title: 'Description', name: 'description' },
    // {
    //   title: 'Cash Customer',
    //   name: 'cash_customer_status',
    //   class: 'text-center',
    // },
    { title: 'Address', name: 'address', searchable: true },
    { title: 'Telephone', name: 'tp', searchable: true },
    { title: 'E-mail', name: 'e_mail', searchable: true },
    { title: 'Inactive', name: 'active_status', class: 'text-center' },
  ];
  let dataRows = [];

  /* --- End of state declarations --- */

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (showModalState === false) {
      resetForm();
    }
  }, [showModalState]);

  /* --- Component functions --- */

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const response = await api.get('vendors');

      console.log(response.data.entities);

      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err[0]);
        });
        return;
      }

      response.data.entities.map((entity) => {
        dataRows.push({
          code: entity.code,
          name: entity.name,
          nic: entity.nic,
          description: entity.description,
          oc: entity.oc,
          action_date: entity.action_date,
          is_cash_customer: entity.is_cash_customer,
          address: entity.address,
          tp: entity.tp,
          mobile: entity.mobile,
          fax: entity.fax,
          e_mail: entity.e_mail,
          inactive: entity.inactive,
          account_id: entity.account_id,
          cash_customer_status: entity.is_cash_customer
            ? 'Cash Customer'
            : 'Not Cash Customer',
          active_status: entity.inactive ? 'Inactive' : 'Active',
        });
      });

      setNewData({
        ...newData,
        code: response.data.new_id,
        new_id: response.data.new_id,
      });

      setEntities(dataRows);
    } catch (error) {
      console.log(error);
      msg.error('Unable to fetch data!');
    } finally {
      setIsLoading(false);
    }
  };

  const searchAndFetch = async (searchPhrase, selectedColumn) => {
    try {
      setIsLoading(true);

      const response = await api.get(
        `vendors/search/${searchPhrase}/${selectedColumn}`,
      );

      dataRows = [];

      console.log(response);

      if (response.data.total === 0) {
        msg.warning(`No results returned your search!`);
      } else {
        response.data.data.map((entity) => {
          return dataRows.push({
            code: entity.code,
            name: entity.name,
            nic: entity.nic,
            description: entity.description,
            oc: entity.oc,
            action_date: entity.action_date,
            is_cash_customer: entity.is_cash_customer,
            address: entity.address,
            tp: entity.tp,
            mobile: entity.mobile,
            fax: entity.fax,
            e_mail: entity.e_mail,
            inactive: entity.inactive,
            account_id: entity.account_id,
            cash_customer_status: entity.is_cash_customer
              ? 'Cash Customer'
              : 'Not Cash Customer',
            active_status: entity.inactive ? 'Inactive' : 'Active',
          });
        });

        setEntities(dataRows);
      }
    } catch (error) {
      msg.error(`Unable to search data! --> ${error}`);
      return console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleValueChange = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    // const inputValue = targetInput.value;
    const inputValue =
      targetInput.type === 'checkbox' ? targetInput.checked : targetInput.value;

    setNewData({
      ...newData,
      [inputName]: inputValue,
    });
  };

  const editRow = (dataObj) => {
    setShowModalState(true);
    setNewData({
      code: dataObj.code,
      name: dataObj.name,
      nic: dataObj.nic,
      description: dataObj.description,
      oc: dataObj.oc,
      action_date: dataObj.action_date,
      is_cash_customer: dataObj.is_cash_customer,
      address: dataObj.address,
      tp: dataObj.tp,
      mobile: dataObj.mobile,
      fax: dataObj.fax,
      e_mail: dataObj.e_mail,
      inactive: dataObj.inactive,
      new_id: dataObj.new_id,
      account_id: dataObj.account_id,
    });

    setIsEdit(true);
    setSelectedId(dataObj.code);
  };

  const toggleFormModal = () => {
    setShowModalState(!showModalState);
  };

  const handleSubmit = async () => {
    // await save();

    if (checkBeforeSave()) {
      await save();
    }

    // resetForm();

    // fetchData();
  };

  const save = async () => {
    if (isEdit === false) {
      try {
        const response = await api.post('vendors').values(newData);

        if (response.status == 200 && response.data.status == 200) {
          msg.success(response.data.message);
          resetForm();
          fetchData();
          setShowModalState(false);
        } else if (response.status == 200 && response.data.status == 500) {
          msg.error(response.data.message);
        } else if (response.status == 200 && response.data.status == 400) {
          Object.values(response.data.message).forEach((err) => {
            msg.error(err[0]);
          });
          console.log('reee');
          msg.error(response.data.message);
        } else if (response.data.status == 400) {
          // Object.values(response.message).forEach((err) => {
          //   msg.error(err[0]);
          // });
          msg.error(response.data.message);
        }
      } catch (error) {
        console.error(error);
      }
      // } finally {
      //   // setShowModalState(false);
      // }
    } else {
      try {
        const response = await api
          .update(`vendors/${selectedId}/update`)
          .values(newData);

        if (response.status == 200 && response.data.status == 200) {
          msg.success(response.data.message);
          resetForm();
          fetchData();

          setIsEdit(false);
          setSelectedId('');
          setShowModalState(false);
        } else if (response.status == 200 && response.data.status == 500) {
          msg.error(response.data.message);
        } else if (response.status == 200 && response.data.status == 400) {
          Object.values(response.data.message).forEach((err) => {
            msg.error(err[0]);
          });
          console.log('reee');
          msg.error(response.data.message);
        } else if (response.data.status == 400) {
          // Object.values(response.message).forEach((err) => {
          //   msg.error(err[0]);
          // });
          msg.error(response.data.message);
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  const checkBeforeSave = () => {
    if (newData.name === '') {
      msg.warning('Customer Name Cannot Be Empty');
      return false;
    }

    if (newData.description === '') {
      msg.warning('Description Cannot Be Null.');
      return false;
    }

    if (newData.address === '') {
      msg.warning('Address Cannot Be Null.');
      return false;
    }

    if (newData.tp === '') {
      msg.warning('Tel Cannot Be Null.');
      return false;
    }

    if (newData.mobile === '') {
      msg.warning('Mobile Cannot Be Null.');
      return false;
    }

    return true;
  };

  const resetForm = () => {
    setNewData({
      ...newData,
      code: newData.new_id,
      name: '',
      nic: '',
      description: '',
      oc: cookie.get('user_id'),
      action_date: moment(),
      is_cash_customer: false,
      address: '',
      tp: '',
      mobile: '',
      fax: '',
      e_mail: '',
      inactive: false,
      account_id: '',
    });

    setIsEdit(false);
  };

  const resetSearch = () => {
    setEntities([]);

    fetchData();
  };

  /* --- End of component functions --- */

  /* --- Component renders --- */

  return (
    <div>
      <h5 className="text-center">{moduleName}</h5>
      <br />
      <div className="row">
        <div className="col-sm-2">
          <SystemButton
            type="add-new"
            method={toggleFormModal}
            showText
            btnText="Add vendor"
          />
        </div>
      </div>

      {/* Form modal componenet */}
      <FormModal
        moduleName={moduleName}
        modalState={showModalState}
        toggleFormModal={toggleFormModal}
        width="50%"
      >
        {/* <form onSubmit={handleSubmit} className="compactForm">
        </form> */}
        <div>
          <div className="modal-body">
            <div className="row">
              <label htmlFor="code" className="col-sm-2 col-form-label">
                Code
              </label>
              <div className="col-sm-4">
                <input
                  type="text"
                  name="code"
                  id="code"
                  maxLength="20"
                  minLength="10"
                  className="form-control form-control-sm"
                  value={newData.code}
                  onChange={handleValueChange}
                  readOnly
                />
              </div>

              {/* <label
                htmlFor="grade"
                className="col-sm-2 col-form-label text-right"
              >
                NIC
              </label>
              <div className="col-sm-4">
                <input
                  type="text"
                  name="nic"
                  id="nic"
                  maxLength="20"
                  minLength="10"
                  className="form-control form-control-sm"
                  value={newData.nic}
                  onChange={handleValueChange}
                />
              </div> */}
            </div>

            <div className="row">
              <label htmlFor="name" className="col-sm-2 col-form-label">
                Name
              </label>
              <div className="col-sm-10">
                <input
                  type="text"
                  name="name"
                  id="name"
                  maxLength="20"
                  minLength="10"
                  placeholder="Vendor Name"
                  className="form-control form-control-sm"
                  value={newData.name}
                  onChange={handleValueChange}
                />
              </div>
            </div>

            <div className="row">
              <label htmlFor="description" className="col-sm-2 col-form-label">
                Description
              </label>
              <div className="col-sm-10">
                <textarea
                  name="description"
                  id="description"
                  placeholder="Description"
                  className="form-control form-control-sm mb-1"
                  rows="2"
                  maxLength="200"
                  value={newData.description}
                  onChange={handleValueChange}
                ></textarea>
              </div>
            </div>

            <div className=" row"></div>

            <div className="row">
              <label htmlFor="address" className="col-sm-2 col-form-label">
                Address
              </label>
              <div className="col-sm-10">
                <textarea
                  name="address"
                  id="address"
                  className="form-control form-control-sm mb-1"
                  rows="2"
                  placeholder="Postal Address"
                  maxLength="200"
                  value={newData.address}
                  onChange={handleValueChange}
                ></textarea>
              </div>
            </div>

            <div className=" row"></div>

            <div className="row">
              <label htmlFor="tp" className="col-sm-2 col-form-label">
                Telephone
              </label>
              <div className="col-sm-4">
                <input
                  type="text"
                  name="tp"
                  id="tp"
                  maxLength="20"
                  minLength="10"
                  className="form-control form-control-sm"
                  value={newData.tp}
                  onChange={handleValueChange}
                />
              </div>

              <label htmlFor="mobile" className="col-sm-2 col-form-label">
                Mobile
              </label>
              <div className="col-sm-4">
                <input
                  type="text"
                  name="mobile"
                  id="mobile"
                  maxLength="20"
                  minLength="10"
                  className="form-control form-control-sm"
                  value={newData.mobile}
                  onChange={handleValueChange}
                />
              </div>
            </div>

            <div className="row">
              <label htmlFor="fax" className="col-sm-2 col-form-label">
                Fax
              </label>
              <div className="col-sm-4">
                <input
                  type="tel"
                  name="fax"
                  id="fax"
                  maxLength="20"
                  minLength="10"
                  className="form-control form-control-sm"
                  value={newData.fax}
                  onChange={handleValueChange}
                />
              </div>

              <label htmlFor="e_mail" className="col-sm-2 col-form-label">
                Email
              </label>
              <div className="col-sm-4">
                <input
                  type="email"
                  name="e_mail"
                  id="e_mail"
                  maxLength="20"
                  minLength="10"
                  className="form-control form-control-sm"
                  value={newData.e_mail}
                  onChange={handleValueChange}
                />
              </div>
            </div>

            <div className="row justify-content-end">
              {/* <div className="offset-1 col-sm-3">
                <br />
                <div className="custom-control custom-switch">
                  <input
                    type="checkbox"
                    className="custom-control-input"
                    id="is_cash_customer"
                    name="is_cash_customer"
                    checked={newData.is_cash_customer}
                    onChange={handleValueChange}
                  />
                  <label
                    className="custom-control-label"
                    htmlFor="is_cash_customer"
                  >
                    {newData.is_cash_customer
                      ? 'Cash customer'
                      : 'Not a cash customer'}
                  </label>
                </div>
              </div> */}

              <div className="offset-1 col-sm-2">
                <br />
                <div className="custom-control custom-switch">
                  <input
                    type="checkbox"
                    className="custom-control-input"
                    id="inactive"
                    name="inactive"
                    checked={newData.inactive}
                    onChange={handleValueChange}
                  />
                  <label className="custom-control-label" htmlFor="inactive">
                    {newData.inactive ? 'Inactive' : 'Active'}
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <SystemButton
              type={'close'}
              method={toggleFormModal}
              showText={true}
            />
            <SystemButton
              type="no-form-save"
              method={handleSubmit}
              showText={true}
            />
          </div>
        </div>
      </FormModal>
      {/* End of form modal componenet */}

      <br />
      <br />

      {/* List view componenet */}
      <ListView
        columns={dataColumns}
        rows={entities}
        edit={editRow}
        loadingState={isLoading}
        searchAndFetch={searchAndFetch}
        actionsColumn
        showEditButton
        resetSearch={resetSearch}
        rowKey="code"
      />
      {/* End of list view component */}
    </div>
  );

  /* --- End of component renders --- */
};

export default Vendors;
