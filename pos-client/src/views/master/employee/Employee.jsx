import React, { useState, useEffect } from 'react';
import { api, msg, cookie } from '../../../services';
import { FormModal, ListView, SystemButton } from '../../../components';

const Employee = () => {
  // Module name
  const moduleName = 'Employee';

  /* --- State declarationss --- */

  const [entities, setEntities] = useState([]);

  const [users, setUsers] = useState([]);

  const [newData, setNewData] = useState({
    id: '',
    name: '',
    is_salesman: 0,
    user_id: cookie.get('user_id'),
    bc_no: cookie.get('user_branch'),
    salesman_user: '',
  });

  // Data loading status
  const [isLoading, setIsLoading] = useState(false);

  // Form modal state
  const [showModalState, setShowModalState] = useState(false);

  // Data edit state
  const [isEdit, setIsEdit] = useState(false);

  const [isUserHaveEmployee, setIsUserHaveEmployee] = useState(false);

  // Selected data
  const [selectedId, setSelectedId] = useState('');

  // List view states
  const dataColumns = [
    { title: 'Code', name: 'id', searchable: true },
    { title: 'Name', name: 'name', searchable: true },
    // { title: 'Is Salesman', name: 'is_salesman', searchable: true },
  ];

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

  const fetchId = async () => {
    const response = await api.get('employees');
    setNewData({
      ...newData,
      id: response.data.new_id,
      name: '',
      is_salesman: 0,
      salesman_user: '',
    });
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const response = await api.get('employees');
      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err[0]);
        });
        return;
      }

      setNewData({
        ...newData,
        id: response.data.new_id,
        name: '',
        is_salesman: 0,
        salesman_user: '',
      });
      console.log(newData);
      setEntities(response.data.categories.data);
      setUsers(response.data.user);
      setIsLoading(false);
    } catch (error) {
      msg.error('Unable to fetch data!');
      return console.log(error);
    }
  };

  const isUserHaveSalesMan = async ($id) => {
    const response = await api.get(`is-user-have-employee/${$id}`);

    if (response.data) {
      setIsUserHaveEmployee(true);
    } else {
      setIsUserHaveEmployee(false);
    }
  };

  const searchAndFetch = async (searchPhrase, selectedColumn) => {
    try {
      setIsLoading(true);

      const response = await api.get(
        `employees/search/${searchPhrase}/${selectedColumn}`,
      );

      if (response.data.total === 0) {
        msg.warning(`No results returned your search!`);
      } else {
        setEntities(response.data.data);
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
    const inputValue =
      targetInput.type === 'checkbox' ? targetInput.checked : targetInput.value;

    if (inputName === 'salesman_user') {
      isUserHaveSalesMan(inputValue);
    }

    setNewData({
      ...newData,
      [inputName]: inputValue,
    });
  };

  const editRow = (dataObj) => {
    setShowModalState(true);
    console.log(dataObj);
    setNewData({
      ...newData,
      id: dataObj.id,
      name: dataObj.name,
      salesman_user: dataObj.salesman_user,
      is_salesman: dataObj.is_salesman,
    });

    setIsEdit(true);
    setSelectedId(dataObj.id);
  };

  const toggleFormModal = () => {
    setShowModalState(!showModalState);
    fetchId();
    isUserHaveSalesMan(newData.salesman_user);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    await save();

    setNewData({
      description: '',
    });

    // fetchData();
  };

  const save = async () => {
    if (isEdit === false) {
      try {
        const response = await api.post('employees').values(newData);

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
        return console.log(error);
      }
      // } finally {
      //   setShowModalState(false);
      // }
    } else {
      try {
        const response = await api
          .update(`employees/${selectedId}/update`)
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

  const resetForm = () => {
    setNewData({
      // id: '',
      name: '',
      is_salesman: 0,
      user_id: cookie.get('user_id'),
      bc_no: cookie.get('user_branch'),
      salesman_user: '',
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
            btnText="Add new Employee"
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
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="row">
              <label htmlFor="id" className="col-sm-2 col-form-label">
                Code
              </label>
              <div className="col-sm-4">
                <input
                  type="text"
                  name="id"
                  id="id"
                  maxLength="10"
                  className="form-control form-control-sm"
                  value={newData.id}
                  onChange={handleValueChange}
                  required
                  readOnly
                />
              </div>
            </div>
            <div className="row">
              <label htmlFor="name" className="col-sm-2 col-form-label">
                Name
              </label>
              <div className="col-sm-6">
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
            </div>
            <div className="row">
              <label
                htmlFor="salesman_user"
                className="col-sm-2 col-form-label"
              >
                User
              </label>
              <div className="col-sm-6">
                <select
                  name="salesman_user"
                  className="form-control form-control-sm"
                  id="salesman_user"
                  value={newData.salesman_user}
                  onChange={handleValueChange}
                  required
                >
                  <option
                    value="0"
                    className="dropdown-item text-muted text-light"
                    disabled
                  >
                    -- Select user
                  </option>
                  {users.map((category) => {
                    return (
                      <option value={category.id} key={category.id}>
                        {category.name}
                      </option>
                    );
                  })}
                </select>
                {/* </div> */}
              </div>
            </div>
            <div className="row mx-2">
              <div className="col-sm-4 ">
                <input
                  type="checkbox"
                  className={
                    newData.is_salesman
                      ? `custom-control-input is-valid`
                      : `custom-control-input is-invalid`
                  }
                  id="is_salesman"
                  name="is_salesman"
                  checked={newData.is_salesman}
                  onChange={handleValueChange}
                />
                <label className="custom-control-label" htmlFor="is_salesman">
                  {newData.is_salesman ? `Is Salesman` : `Is Salesman`}
                </label>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <SystemButton
              type={'close'}
              method={toggleFormModal}
              showText={true}
            />

            {!isUserHaveEmployee ? (
              <SystemButton type={'save'} showText={true} />
            ) : null}
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

export default Employee;
