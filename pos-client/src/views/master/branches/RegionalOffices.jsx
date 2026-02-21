import React, { useState, useEffect } from 'react';
import { api, msg, cookie } from '../../../services';
import { FormModal, ListView, SystemButton } from '../../../components';

const RegionalOffice = () => {
  // Module name
  const moduleName = 'Regional Offices';

  /* --- State declarationss --- */

  const [entities, setEntities] = useState([]);

  const [regionalOfficers, setRegionalOfficers] = useState([]);

  const [newData, setNewData] = useState({
    code: '',
    name: '',
    address: '',
    telephone: '',
    fax: '',
    email: '',
    officer_id: '',
    is_headoffice: 0,
    user_id: cookie.get('user_id'),
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
      title: 'Branch Code',
      name: 'code',
      searchable: true,
      class: 'text-center',
    },
    { title: 'Name', name: 'name', searchable: true },
    { title: 'Address', name: 'address', searchable: true },
    { title: 'Telephone', name: 'telephone', searchable: true },
    { title: 'Fax', name: 'fax', searchable: true },
    { title: 'E-mail', name: 'email', searchable: true },
    { title: 'Regional Officer', name: 'officer' },
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

      const response = await api.get('regional-offices');

      console.log(response.data);

      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err[0]);
        });
        return;
      }

      setRegionalOfficers(response.data.officers);

      response.data.regionalOffices.data.map((entity) => {
        dataRows.push({
          id: entity.id,
          code: entity.code,
          name: entity.name,
          address: entity.address,
          telephone: entity.telephone,
          fax: entity.fax,
          email: entity.email,
          is_headoffice: entity.is_headoffice,
          officer: entity.user.name,
          officer_id: entity.user.id,
        });
      });

      setEntities(dataRows);
      return setIsLoading(false);
    } catch (error) {
      return msg.error('Unable to fetch data!');
    }
  };

  const searchAndFetch = async (searchPhrase, selectedColumn) => {
    try {
      setIsLoading(true);

      const response = await api.get(
        `regional-offices/search/${searchPhrase}/${selectedColumn}`,
      );

      dataRows = [];

      console.log(response);

      if (response.data.total === 0) {
        msg.warning(`No results returned your search!`);
      } else {
        response.data.data.map((entity) => {
          return dataRows.push({
            id: entity.id,
            code: entity.code,
            name: entity.name,
            address: entity.address,
            telephone: entity.telephone,
            fax: entity.fax,
            email: entity.email,
            is_headoffice: entity.is_headoffice,
            officer: entity.user.name,
            officer_id: entity.user.id,
          });
        });
        setEntities(dataRows);
      }

      setIsLoading(false);
    } catch (error) {
      msg.error(`Unable to search data! --> ${error}`);
      setIsLoading(false);
      return console.log(error);
    }
  };

  const handleValueChange = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    // const inputValue = targetInput.value;
    const inputValue =
      inputName === 'is_headoffice' ? targetInput.checked : targetInput.value;

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
      address: dataObj.address,
      telephone: dataObj.telephone,
      fax: dataObj.fax,
      email: dataObj.email,
      officer_id: dataObj.officer_id,
      is_headoffice: dataObj.is_headoffice,
    });

    setIsEdit(true);
    setSelectedId(dataObj.id);
  };

  const toggleFormModal = () => {
    setShowModalState(!showModalState);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    await save();

    setNewData({
      code: '',
      name: '',
      address: '',
      telephone: '',
      fax: '',
      email: '',
      is_headoffice: 0,
      officer_id: '',
      user_id: cookie.get('user_id'),
    });

    fetchData();
  };

  const save = async () => {
    if (isEdit === false) {
      try {
        const response = await api.post('regional-offices').values(newData);

        if (response.error) {
          Object.values(response.error).forEach((err) => {
            msg.error(err[0]);
          });
          return;
        }

        msg.success(response.data);
      } catch (error) {
        msg.error(error);
        return console.log(error);
      } finally {
        setShowModalState(false);
      }
    } else {
      try {
        const response = await api
          .update(`regional-offices/${selectedId}/update`)
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
      code: '',
      name: '',
      address: '',
      telephone: '',
      fax: '',
      email: '',
      is_headoffice: 0,
      officer_id: '',
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
      <div className="row">
        <div className="col-sm-2">
          <SystemButton
            type="add-new"
            method={toggleFormModal}
            showText
            btnText="Add branch"
          />
        </div>
      </div>

      {/* Form modal componenet */}
      <FormModal
        moduleName={moduleName}
        modalState={showModalState}
        toggleFormModal={toggleFormModal}
      >
        <form onSubmit={handleSubmit} className="compactForm">
          <div className="modal-body">
            <div className="row justify-content-end">
              <div className="col-sm-2">
                <div className="custom-control custom-checkbox mr-sm-2">
                  <input
                    type="checkbox"
                    className="custom-control-input"
                    id="is_headoffice"
                    name="is_headoffice"
                    value="1"
                    checked={newData.is_headoffice}
                    onChange={handleValueChange}
                  />
                  <label
                    className="custom-control-label"
                    htmlFor="is_headoffice"
                  >
                    Head Office
                  </label>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-sm-4">
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    className="form-control form-control-sm"
                    value={newData.name}
                    onChange={handleValueChange}
                  />
                </div>
              </div>

              <div className="col-sm-2">
                <div className="form-group">
                  <label htmlFor="code">Branch Code</label>
                  <input
                    type="text"
                    name="code"
                    id="code"
                    className="form-control form-control-sm"
                    value={newData.code}
                    onChange={handleValueChange}
                  />
                </div>
              </div>

              <div className="col-6">
                <div className="form-group">
                  <label htmlFor="address">Address</label>
                  <input
                    type="text"
                    name="address"
                    id="address"
                    className="form-control form-control-sm"
                    value={newData.address}
                    onChange={handleValueChange}
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-3">
                <div className="form-group">
                  <label htmlFor="telephone">Telephone</label>
                  <input
                    type="text"
                    name="telephone"
                    id="telephone"
                    className="form-control form-control-sm"
                    value={newData.telephone}
                    onChange={handleValueChange}
                  />
                </div>
              </div>

              <div className="col-3">
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    className="form-control form-control-sm"
                    value={newData.email}
                    onChange={handleValueChange}
                  />
                </div>
              </div>

              <div className="col-3">
                <div className="form-group">
                  <label htmlFor="fax">Fax</label>
                  <input
                    type="tel"
                    name="fax"
                    id="fax"
                    className="form-control form-control-sm"
                    value={newData.fax}
                    onChange={handleValueChange}
                  />
                </div>
              </div>

              <div className="col-3">
                <div className="form-group">
                  <label htmlFor="officer_id">Officer</label>
                  <select
                    name="officer_id"
                    id="officer_id"
                    className="form-control form-control-sm"
                    value={newData.officer_id}
                    onChange={handleValueChange}
                  >
                    <option value="">-- Select regional officer</option>
                    {regionalOfficers.map((officer) => {
                      return (
                        <option value={officer.id} key={officer.id}>
                          {officer.name}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* <div className="col-4">
                <div className="form-group">
                  <label htmlFor="grade">Grade</label>
                  <input
                    type="tel"
                    name="grade"
                    id="grade"
                    className="form-control form-control-sm"
                    value={newData.grade}
                    onChange={handleValueChange}
                  />
                </div>
              </div> */}
            </div>

            {/* <div className="row">
              <div className="col-4">
                <div className="custom-control custom-checkbox mr-sm-2">
                  <input
                    type="checkbox"
                    className="custom-control-input"
                    id="is_headoffice"
                    name="is_headoffice"
                    value="1"
                    checked={newData.is_headoffice}
                    onChange={handleValueChange}
                  />
                  <label
                    className="custom-control-label"
                    htmlFor="is_headoffice"
                  >
                    Head Office
                  </label>
                </div>
              </div>
              <div className="col-4">
                <div className="custom-control custom-checkbox">
                  <input
                    type="checkbox"
                    className="custom-control-input"
                    id="has_unique_int"
                    name="has_unique_int"
                    value="1"
                    checked={newData.has_unique_int}
                    onChange={handleValueChange}
                  />
                  <label
                    className="custom-control-label"
                    htmlFor="has_unique_int"
                  >
                    Has Unique Interest Schemes
                  </label>
                </div>
              </div>
            </div> */}
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
        showDeleteButton={false}
        resetSearch={resetSearch}
      />
      {/* End of list view component */}
    </div>
  );

  /* --- End of component renders --- */
};

export default RegionalOffice;
