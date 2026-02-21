import React, { useState, useEffect } from 'react';
import { api, msg } from '../services';
import { FormModal, ListView, SystemButton } from '../components';
import moment from 'moment';

const Users = () => {
  // Module name
  const moduleName = 'Users';

  /* --- State declarationss --- */

  const [entities, setEntities] = useState([]);

  const [newData, setNewData] = useState({
    id: '',
    name: '',
    email: '',
    password: '',
    branch_id: '',
  });

  const [branches, setBranches] = useState([]);

  // Form modal state
  const [showModalState, setShowModalState] = useState(false);

  // Data loading status
  const [isLoading, setIsLoading] = useState(false);

  // Data edit state
  const [isEdit, setIsEdit] = useState(false);

  // Selected data
  const [selectedId, setSelectedId] = useState('');

  // List view states
  const dataColumns = [
    { title: 'Id', name: 'id' },
    { title: 'Name', name: 'name' },
    { title: 'Email', name: 'email' },
    { title: 'Branch', name: 'branch_id', class: 'text-center' },
  ];

  let dataRows = [];

  let is_passwords_match = true;

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

      const response = await api.get('users');

      setBranches(response.data.branches);

      // response.data.users.map(user => {
      //   dataRows.push(
      //     {
      //       id: user.id,
      //       name: user.name,
      //       email: user.email,
      //       branch_id: user.branch_id,
      //     }
      //   )
      // })

      setEntities(response.data.users);

      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err[0]);
        });
        return;
      }
    } catch (error) {
      msg.error('Unable to fetch data!');
      return console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  // const searchAndFetch = async (searchPhrase, selectedColumn) => {
  //   try {
  //     setIsLoading(true);

  //     const response = await api.get(
  //       `expense-types/search/${searchPhrase}/${selectedColumn}`,
  //     );

  //     dataRows = [];

  //     console.log(response);

  //     if (response.data.total === 0) {
  //       msg.warning(`No results returned your search!`);
  //     } else {
  //       response.data.data.map((entity) => {
  //         return dataRows.push({
  //           id: entity.id,
  //           name: entity.name,
  //           account: entity.account,
  //         });
  //       });
  //       setEntities(dataRows);
  //     }
  //     setIsLoading(false);
  //   } catch (error) {
  //     msg.error(`Unable to search data! --> ${error}`);
  //     setIsLoading(false);
  //     return console.log(error);
  //   }
  // };

  const handleValueChange = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue = targetInput.value;

    if (inputName === 'conf_password') {
      if (inputValue === newData.password) {
        is_passwords_match = true;
      } else {
        is_passwords_match = false;
      }
    } else {
      setNewData({
        ...newData,
        [inputName]: inputValue,
      });
    }
  };

  const toggleFormModal = () => {
    setShowModalState(!showModalState);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    await save();
    // resetAll();
    // fetchData();
  };

  const save = async () => {
    if (is_passwords_match) {
      try {
        if (!isEdit) {
          const response = await api.post('register').values(newData);

          if (response.status == 200 && response.data.status == 200) {
            msg.success(response.data.message);
            resetForm();
            fetchData();
            setShowModalState(false);
          } else if (response.status == 200 && response.data.status == 400) {
            Object.values(response.data.message).forEach((err) => {
              msg.error(err[0]);
            });
          } else if (response.status == 200 && response.data.status == 500) {
            msg.error(response.data.message);
            // if (response.data.success == false) {
            //   Object.values(response.data.error).forEach((err) => {
            //     msg.error(err[0]);
            //   });
            // } else {
            //   msg.success('User Created');
            //   resetAll();
            //   fetchData();
            //   setShowModalState(false);
            // }
          } else {
            msg.error('Error creating user');
          }
        } else {
          //console.log(newData);
          const response = await api
            .put('editUser', newData.id)
            .values(newData);

          if (response.status == 200 && response.data.status == 200) {
            msg.success(response.data.message);
            resetAll();
            fetchData();
            setShowModalState(false);
          } else if (response.status == 200 && response.data.status == 500) {
            msg.error(response.data.message);
          } else if (response.status == 200 && response.data.status == 400) {
            Object.values(response.data.message).forEach((err) => {
              msg.error(err[0]);
            });
          } else if (response.data.status == 400) {
            Object.values(response.message).forEach((err) => {
              msg.error(err[0]);
            });
          }

          // msg.success(response.data);
          // resetAll();
          // fetchData();
          // setShowModalState(false);
        }
      } catch (error) {
        msg.error(error);
        //   return console.log(error);
      } finally {
        // setShowModalState(false);
      }
    } else {
      msg.error(`Password and Confirmation Password fields doesn't match`);
    }
  };

  const resetAll = () => {
    setEntities([]);

    setNewData({
      id: '',
      name: '',
      email: '',
      password: '',
      branch_id: '',
    });

    setShowModalState(false);

    setIsLoading(false);

    dataRows = [];
  };

  const editRow = (dataObj) => {
    setNewData({
      id: dataObj.id,
      name: dataObj.name,
      email: dataObj.email,
      branch_id: dataObj.branch_id,
    });

    setShowModalState(true);
    setIsEdit(true);
    setSelectedId(dataObj.id);
  };

  const resetForm = () => {
    setNewData({
      id: '',
      name: '',
      email: '',
      branch_id: '',
    });
    setIsEdit(false);
  };
  /* --- End of component functions --- */

  /* --- Component renders --- */

  return (
    <div>
      <h5 className="text-center">{moduleName}</h5>
      <br />
      <div className="col-sm-2">
        <SystemButton
          type={'add-new'}
          method={toggleFormModal}
          showText={true}
        />
      </div>

      {/* Form modal componenet */}
      <FormModal
        moduleName={moduleName}
        modalState={showModalState}
        toggleFormModal={toggleFormModal}
      >
        <form onSubmit={handleSubmit} className="compactForm">
          <div className="modal-body">
            <div className="row">
              <div className="col-sm-6">
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
              <div className="col-sm-6">
                <label htmlFor="email">Email</label>

                {!isEdit ? (
                  <input
                    type="email"
                    name="email"
                    id="email"
                    className="form-control form-control-sm"
                    value={newData.email}
                    onChange={handleValueChange}
                  />
                ) : (
                  <input
                    type="email"
                    name="email"
                    id="email"
                    className="form-control form-control-sm"
                    value={newData.email}
                    onChange={handleValueChange}
                    readOnly
                  />
                )}
              </div>
            </div>
            <div className="row">
              <div className="col-sm-6">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  className="form-control form-control-sm"
                  value={newData.password}
                  onChange={handleValueChange}
                />
              </div>
              <div className="col-sm-6">
                <label htmlFor="conf_password">Confirm Password</label>
                <input
                  type="password"
                  name="conf_password"
                  id="conf_password"
                  className="form-control form-control-sm"
                  value={newData.conf_password}
                  onChange={handleValueChange}
                />
              </div>
            </div>
            <div className="row">
              <div className="col-sm-6">
                <label htmlFor="branch_id">Branch</label>
                <select
                  name="branch_id"
                  id="branch_id"
                  className="form-control form-control-sm"
                  value={newData.branch_id}
                  onChange={handleValueChange}
                >
                  <option value="" className="muted" disabled>
                    -- Select a branch
                  </option>
                  {branches.map((branch) => {
                    return (
                      <option value={branch.code} key={branch.code}>
                        {branch.code} - {branch.name}
                      </option>
                    );
                  })}
                </select>
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
      {/* End of form modal componenet */}

      <br />
      <br />

      {/* List view componenet */}
      <ListView
        columns={dataColumns}
        rows={entities}
        edit={editRow}
        loadingState={isLoading}
        actionsColumn={true}
        showEditButton={true}
        showDeleteButton={false}
      />
      {/* End of list view component */}
    </div>
  );

  /* --- End of component renders --- */
};

export default Users;
