import React, { useState, useEffect } from 'react';
import { api, msg, cookie } from '../../../services';
import { FormModal, ListView, SystemButton } from '../../../components';

const Customers = () => {
  //Module name
  const moduleName = 'Customer';

  /* --- State declarationss --- */

  // Data states
  const [entities, setEntities] = useState([]);

  const [newData, setNewData] = useState({ 
    name: '',
    nic: '',
    old_nic: '',
    address_1: '',
    address_2: '',
    telephone: '',
    mobile:'',
    email:'',
    notes: '',
    is_blacklisted: 0,
    branch_id: cookie.get('user_branch'),
    user_id: cookie.get('user_id'),
  });

  // Data loading status
  const [isLoading, setIsLoading] = useState(false);

  // Form modal state
  const [showModalState, setShowModalState] = useState(false);

  // Data edit state
  const [isEdit, setIsEdit] = useState(false);

  // Selected data
  const [selectedId, setSelectedId] = useState('');

  // List view states
  let dataColumns = [
    { title: 'NIC', name: 'nicno', searchable: true },
    { title: 'Name', name: 'cusname', searchable: true },
    { title: 'Address', name: 'address', searchable: true },
    { title: 'Email', name: 'email', searchable: true },
    { title: 'Mobile', name: 'mobile', searchable: true },
  ];
  let dataRows = [];

  // List of districts
  // const districtsList = [
  //     'Jaffna',
  //     'Kilinochchi',
  //     'Mannar',
  //     'Mullaitivu',
  //     'Vavuniya',
  //     'Puttalam',
  //     'Kurunegala',
  //     'Gampaha',
  //     'Colombo',
  //     'Kalutara',
  //     'Matale',
  //     'Kandy',
  //     'Nuwara Eliya',
  //     'Kegalle',
  //     'Ratnapura',
  //     'Trincomalee',
  //     'Batticaloa',
  //     'Ampara',
  //     'Badulla',
  //     'Monaragala',
  //     'Hambantota',
  //     'Matara',
  //     'Galle'
  //   ];

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

  const searchAndFetch = async (searchPhrase, selectedColumn) => {
    try {
      setIsLoading(true);

      const response = await api.get(
        `customers/search/${searchPhrase}/${selectedColumn}`,
      );

      dataRows = [];

      if (response.data.total === 0) {
        msg.warning(`No results returned your search!`);
      } else {
        response.data.data.map((entity) => {
          return dataRows.push({
            customer_id: entity.customer_id,
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
      }

      setIsLoading(false);
    } catch (error) {
      msg.error('Unable to search data!');
      setIsLoading(false);
    }
  };

  const toggleFormModal = () => {
    setShowModalState(!showModalState);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    await submitData();

    setNewData({
      name: '',
      nic: '',
      old_nic: '',
      address_1: '',
      address_2: '',
      telephone: '',
      email:'',
      notes: '',
      is_blacklisted: 0,
      branch_id: cookie.get('user_branch'),
      user_id: cookie.get('user_id'),
    });

    fetchData();
  };

  const editRow = async (dataObj) => {
    console.log(dataObj);
    setShowModalState(true);
    setNewData({
      ...newData,
      name: dataObj.cusname,
      nic: dataObj.nicno,
      address_1: dataObj.address,
      address_2: dataObj.address2,
      telephone: dataObj.telNo,
      mobile: dataObj.mobile,
      email: dataObj.email,
      notes: dataObj.notes,
      is_blacklisted: dataObj.isblackListed,
    });

    setIsEdit(true);
    setSelectedId(dataObj.customer_id);
  };

  const deleteRow = async (id) => {
    try {
      const response = await api.delete(`customers/${id}`);

      msg.success(response.data);
    } catch (error) {
    } finally {
      fetchData();
    }
  };

  const handleValueChange = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue =
      targetInput.type === 'checkbox' ? targetInput.checked : targetInput.value;

    setNewData({
      ...newData,
      [inputName]: inputValue,
    });
  };

  const submitData = async () => {
    if (isEdit === false) {
      try {
        const response = await api.post('customers').values(newData);
        if (response.error) {
          Object.values(response.error).forEach((err) => {
            msg.error(err[0]);
          });
          return;
        }
        msg.success(response.data);
      } catch (error) {
        msg.error(error);
        return console.error(error);
      } finally {
        setShowModalState(false);
      }
    } else {
      try {
        const response = await api
          .update(`customers/${selectedId}/update`)
          .values(newData);
        if (response.error) {
          Object.values(response.error).forEach((err) => {
            msg.error(err[0]);
          });
          return;
        }
        msg.success(response.data);
      } catch (error) {
        msg.error(error);
        return console.error(error);
      } finally {
        setIsEdit(false);
        setSelectedId('');
        setShowModalState(false);
      }
    }
  };

  const resetForm = () => {
    setNewData({
      name: '',
      nic: '',
      old_nic: '',
      address_1: '',
      address_2: '',
      telephone: '',
      email: '',
      notes: '',
      is_blacklisted: 0,
      branch_id: cookie.get('user_branch'),
      user_id: cookie.get('user_id'),
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
      {/* <div className="row">
        <div className="col-sm-2"> 
          <SystemButton
            type="add-new"
            method={toggleFormModal}
            showText
            btnText="Add customer"
          />
        </div>
      </div> */}

      {/* Modal componenet */}
      <FormModal
        moduleName={moduleName}
        modalState={showModalState}
        toggleFormModal={toggleFormModal}
        width="60%"
      >
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* <div className="row justify-content-end">
                            
                        </div> */}
            <div className="row">
              <label htmlFor="name" className="col-sm-3 col-form-label">
                Customer Name
              </label>
              <div className="col-sm-4">
                <input
                  type="text"
                  name="name"
                  id="name"
                  maxLength="30"
                  className="form-control form-control-sm"
                  value={newData.name}
                  onChange={handleValueChange}
                  required
                />
              </div>

              {/* <div className="form-group col-sm-4">
                <label htmlFor="name">Other Names</label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  className="form-control input-sm"
                  value={newData.name}
                  onChange={handleValueChange}
                />
              </div> */}

              <div className="offset-1 col-sm-3">
                <div className="form-group">
                  <div className="custom-control custom-switch">
                    <input
                      type="checkbox"
                      className={
                        newData.is_blacklisted
                          ? `custom-control-input is-invalid`
                          : `custom-control-input is-valid`
                      }
                      id="is_blacklisted"
                      name="is_blacklisted"
                      checked={newData.is_blacklisted}
                      onChange={handleValueChange}
                    />
                    <label
                      className="custom-control-label"
                      htmlFor="is_blacklisted"
                    >
                      {newData.is_blacklisted
                        ? `Blacklisted`
                        : `Not blacklisted`}
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="row">

              <label htmlFor="address_1" className="col-sm-3 col-form-label">
                Postal Address
              </label>
              <div className="col-sm-8">
                <textarea
                  id="address_1"
                  name="address_1"
                  className="form-control form-control-sm mb-1"
                  rows="2"
                  maxLength="200"
                  placeholder="Postal Address"
                  value={newData.address_1}
                  onChange={handleValueChange}
                ></textarea>
              </div>

              {/* <div className="form-group col-6">
                <label htmlFor="address_1">Postal Address</label>
                <input
                  type="text"
                  name="address_1"
                  id="address_1"
                  className="form-control input-sm"
                  value={newData.address_1}
                  onChange={handleValueChange}
                  required
                />
              </div> */}

              <label htmlFor="address_2" className="col-sm-3 col-form-label">
                Address on NIC
              </label>
              <div className="col-sm-8">
                <textarea
                  id="address_2"
                  name="address_2"
                  className="form-control form-control-sm mb-1"
                  rows="2"
                  maxLength="200"
                  placeholder="Address on NIC"
                  value={newData.address_2}
                  onChange={handleValueChange}
                ></textarea>
              </div>

              {/* <div className="form-group col-6">
                <div className="form-group">
                  <label htmlFor="address_2">Address on NIC</label>
                  <input
                    type="text"
                    name="address_2"
                    id="address_2"
                    className="form-control input-sm"
                    value={newData.address_2}
                    onChange={handleValueChange}
                    required
                  />
                </div>
              </div> */}
            </div>

            <div className="row">
                <label htmlFor="telephone" className="col-sm-3 col-form-label">
                    Telephone Number
                </label>
                <div className="col-sm-4">
                  <input
                    type="text"
                    name="telephone"
                    id="telephone"
                    maxLength="20"
                    minLength="9"
                    className="form-control form-control-sm"
                    value={newData.telephone}
                    onChange={handleValueChange}
                    required
                  />
                </div>
            </div>

            <div className="row">
            <label htmlFor="email" className="col-sm-3 col-form-label">
                      Email
                </label>
                <div className="col-sm-4">
                  <input
                    type="text"
                    name="email"
                    id="email"
                    maxLength="20"
                    minLength="9"
                    className="form-control form-control-sm"
                    value={newData.email}
                    onChange={handleValueChange}
                    required
                  />
                </div>
            </div>

            <div className="row">
                <label htmlFor="nic" className="col-sm-3 col-form-label">
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
                    required
                  />
                </div>
              {/* <div className="form-group col-4">
                <label htmlFor="nic">NIC</label>
                <input
                  type="text"
                  name="nic"
                  id="nic"
                  maxLength="20"
                  minLength="10"
                  className="form-control input-sm"
                  value={newData.nic}
                  onChange={handleValueChange}
                  required
                />
              </div> */}
            </div>

            <div className="row">
                {/* <label htmlFor="old_nic" className="col-sm-3 col-form-label">
                    Old NIC
                </label>
                <div className="col-sm-4">
                  <input
                    type="text"
                    name="old_nic"
                    id="old_nic"
                    maxLength="20"
                    minLength="10"
                    className="form-control form-control-sm"
                    value={newData.old_nic}
                    onChange={handleValueChange}
                  />
                </div> */}
              {/* <div className="form-group col-4">
                <label htmlFor="old_nic">Old NIC</label>
                <input
                  type="text"
                  name="old_nic"
                  id="old_nic"
                  className="form-control input-sm"
                  value={newData.old_nic}
                  onChange={handleValueChange}
                />
              </div> */}
            </div>

            <div className="row">
            <label htmlFor="notes" className="col-sm-3 col-form-label">
                Notes
              </label>
              <div className="col-sm-8">
                <textarea
                  id="notes"
                  name="notes"
                  className="form-control form-control-sm mb-1"
                  rows="2"
                  maxLength="200"
                  placeholder="Address on NIC"
                  value={newData.notes}
                  onChange={handleValueChange}
                ></textarea>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <SystemButton
              type={'close'}
              method={toggleFormModal}
              showText={true}
            />
            <SystemButton type={'save'} showText={true} />
          </div>
        </form>
      </FormModal>
      {/* End of modal componenet */}

      <br />
      <br />

      {/* List view componenet */}
      <ListView
        columns={dataColumns}
        rows={entities}
        edit={editRow}
        loadingState={isLoading}
        searchAndFetch={searchAndFetch}
        actionsColumn={true}
        showEditButton={true}
        showDeleteButton={false}
        resetSearch={resetSearch}
      />
      {/* End of list view component */}
    </div>
  );

  /* --- End of component renders --- */
};

export default Customers;
