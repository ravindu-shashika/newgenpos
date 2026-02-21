import React, { useState, useEffect } from 'react';
import { api, msg, cookie } from '../../services';
import { FormModal, ListView, SystemButton } from '../../components';
import moment from 'moment';

const ItemCategories = () => {
  // Module name
  const moduleName = 'Roles';

  /* --- State declarationss --- */

  const [entities, setEntities] = useState([]);

  const [newRole, setNewRole] = useState('');

  // Data loading status
  const [isLoading, setIsLoading] = useState(false);

  // Form modal state
  const [showModalState, setShowModalState] = useState(false);

  // Data edit state
  const [isEdit, setIsEdit] = useState(false);

  // Selected data
  const [selectedId, setSelectedId] = useState('');

  // List view states
  const dataColumns = [
    { title: 'Role Name', name: 'name', searchable: true },
    { title: 'User', name: 'user', class: 'text-center', searchable: true },
    {
      title: 'Created At',
      name: 'created_at',
      class: 'text-center',
      searchable: true,
    },
  ];

  /* --- End of state declarations --- */
  let dataRows = [];
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
    dataRows = [];
    try {
      setIsLoading(true);

      const response = await api.get('role');
      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err[0]);
        });
        return;
      }
      response.data.data.map((entity) => {
        dataRows.push({
          name: entity.name,
          created_at: moment(entity.created_at).format('YYYY-MM-DD | h:mm A'),
          user: entity.user.name,
        });
      });
      setEntities(dataRows);
      // setEntities(response.data.data);
      setIsLoading(false);
    } catch (error) {
      msg.error('Unable to fetch data!');
      return console.log(error);
    }
  };

  const searchAndFetch = async (searchPhrase, selectedColumn) => {};

  const handleValueChange = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue = targetInput.value;

    setNewRole(inputValue);
  };

  const editRow = (dataObj) => {
    setShowModalState(true);
    setNewRole(dataObj.name);
    setIsEdit(true);
    setSelectedId(dataObj.id);
  };

  const toggleFormModal = () => {
    setShowModalState(!showModalState);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await save();
  };

  const save = async () => {
    if (isEdit === false) {
      const response = await api.post('role').values(newRole);
      if (response.status == 200 && response.data.status == 200) {
        msg.success(response.data.message);
        setNewRole('');
        fetchData();
        setShowModalState(false);
      } else if (response.status == 200 && response.data.status == 400) {
        msg.warning(response.data.message);
      } else if (response.status == 200 && response.data.status == 500) {
        msg.error(response.data.message);
      } else {
        msg.error('Something went wrong...');
      }
    } else {
      const response = await api.patch(`role`, selectedId).values(newRole);
      if (response.status == 200 && response.data.status == 200) {
        msg.success(response.data.message);
        setIsEdit(false);
        setSelectedId('');
        setNewRole('');
        fetchData();
        setShowModalState(false);
      } else if (response.status == 200 && response.data.status == 400) {
        msg.warning(response.data.message);
      } else if (response.status == 200 && response.data.status == 500) {
        msg.error(response.data.message);
      } else {
        msg.error('Something went wrong...');
      }
    }
  };

  const removeRow = async (dataObj) => {
    if (window.confirm('Are you sure want t remove this ?') == true) {
      const response = await api.delete(`role/${dataObj.id}`);
      if (response.status == 200 && response.data.status == 200) {
        msg.success(response.data.message);
        setIsEdit(false);
        setSelectedId('');
        setNewRole('');
        fetchData();
        setShowModalState(false);
      } else if (response.status == 200 && response.data.status == 400) {
        msg.warning(response.data.message);
      } else if (response.status == 200 && response.data.status == 500) {
        msg.error(response.data.message);
      } else {
        msg.error('Something went wrong...');
      }
    }
  };

  const resetForm = () => {
    setNewRole('');
    setSelectedId('');
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
            btnText="Add new category"
          />
        </div>
      </div>

      {/* Form modal componenet */}
      <FormModal
        moduleName={moduleName}
        modalState={showModalState}
        toggleFormModal={toggleFormModal}
      >
        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.preventDefault();
          }}
          className="compactForm"
        >
          <div className="modal-body">
            <label htmlFor="role">Role Name</label>
            <input
              type="text"
              name="role"
              id="role"
              className="form-control input-sm"
              value={newRole}
              onChange={handleValueChange}
            />
          </div>
          <div className="modal-footer">
            <SystemButton
              type={'close'}
              method={toggleFormModal}
              showText={true}
            />
            <SystemButton type={isEdit ? 'update' : 'save'} showText={true} />
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
        deleteFunc={removeRow}
        loadingState={isLoading}
        searchAndFetch={searchAndFetch}
        actionsColumn
        showEditButton
        showDeleteButton
        resetSearch={resetSearch}
      />
      {/* End of list view component */}
    </div>
  );

  /* --- End of component renders --- */
};

export default ItemCategories;
