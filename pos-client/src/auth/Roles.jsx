import React, { useState, useEffect } from 'react';
import { api, msg } from '../services';
import { FormModal, ListView, SystemButton } from '../components';
import { v4 as uuidv4 } from 'uuid';

const Roles = () => {
  // Module name
  const moduleName = 'Roles';

  /* --- State declarationss --- */

  const [entities, setEntities] = useState([]);

  const [rolesList, setRolesList] = useState([]);

  const [userRoles, setUserRoles] = useState([
    {
      index: '',
      id: '',
    },
  ]);

  const [newData, setNewData] = useState({
    user_id: '',
  });

  // Form modal state
  const [showModalState, setShowModalState] = useState(false);

  // Data loading status
  const [isLoading, setIsLoading] = useState(false);

  // List view states
  const dataColumns = [
    { title: 'Name', name: 'name' },
    { title: 'Email', name: 'email' },
    { title: 'Branch', name: 'branch_id', class: 'text-center' },
  ];

  let dataRows = [];
  let role_ids = [];

  /* --- End of state declarations --- */

  useEffect(() => {
    fetchData();
  }, []);

  /* --- Component functions --- */

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const response = await api.get('users');

      if (typeof response.error !== 'undefined') {
        msg.error(response.error.err);
        return;
      } else {
        setEntities(response.data.users);

        setRolesList(response.data.roles);
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

  const fetchUserRole = async (userId) => {
    let currentRoles = [];

    setNewData({
      user_id: userId,
    });

    const response = await api.get(`showRolesByUser/${userId}`);

    await response.data.map((row) => {
      rolesList.map((role) => {
        if (role.name === row) {
          currentRoles.push({
            index: uuidv4(),
            id: role.id,
          });
        }
      });
    });

    setUserRoles(currentRoles);
  };

  const handleValueChange = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue = targetInput.value;

    if (inputName === 'user_id') {
      fetchUserRole(inputValue);
    }
  };

  const handleRoleChange = (e) => {
    const targetInput = e.target;
    const datasetId = targetInput.dataset.id;
    const inputName = targetInput.name;
    const setOfRoles = [...userRoles];
    const inputValue = targetInput.value;

    setOfRoles[datasetId][inputName] = inputValue;
    setUserRoles(setOfRoles);
  };

  const toggleFormModal = () => {
    if (showModalState) {
      formReset();
    }
    setShowModalState(!showModalState);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    userRoles.map((role) => {
      role_ids.push(parseInt(role.id));
    });

    await save();

    resetAll();

    fetchData();
  };

  const save = async () => {
    try {
      const response = await api.post('assignRoleToUser').values({
        user_id: newData.user_id,
        role_ids: role_ids,
      });
      console.log(newData, role_ids);
      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err);
        });
        return;
      }

      msg.success(response.data.message);
    } catch (error) {
      msg.error(error);
      return console.log(error);
    } finally {
      setShowModalState(false);
    }
  };

  const addRow = () => {
    setUserRoles([
      ...userRoles,
      {
        index: uuidv4(),
        id: '',
      },
    ]);
  };

  const removeRow = (i) => {
    // TODO: Create a better dialog box component... Use the FormModal component as a base template
    if (window.confirm('Are you sure you want to remove this item?')) {
      setUserRoles(userRoles.filter((role) => role.index !== i));
    }
  };

  const resetAll = () => {
    setEntities([]);

    setNewData({
      user_id: '',
    });

    setRolesList([]);

    setShowModalState(false);

    setIsLoading(false);

    dataRows = [];
  };

  const formReset = () => {
    setNewData({
      user_id: '',
    });
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
          btnText={`Assign Role`}
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
                <label htmlFor="user_id">User</label>
                <select
                  name="user_id"
                  id="user_id"
                  className="form-control form-control-sm"
                  value={newData.user_id}
                  onChange={handleValueChange}
                >
                  <option value="" className="muted" disabled>
                    -- Select a user
                  </option>
                  {entities.map((user) => {
                    return (
                      <option value={user.id} key={user.id}>
                        {user.name}
                      </option>
                    );
                  })}
                </select>
              </div>
              {/* <div className="col-sm-6">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  className="form-control form-control-sm"
                  value={newData.email}
                  onChange={handleValueChange}
                />
              </div> */}
              {newData.user_id ? (
                <table className="table">
                  <thead className="thead-light text-center">
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">Roles</th>
                      <th scope="col">
                        <SystemButton
                          type={'add-row'}
                          method={() => addRow()}
                          showText={false}
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-center">
                    {userRoles.map((row, index) => {
                      return (
                        <tr key={row.index}>
                          <th scope="row">{parseInt(index) + 1}</th>
                          <td>
                            <select
                              name="id"
                              id="id"
                              data-id={index}
                              className="form-control form-control-sm"
                              value={userRoles[index].id}
                              onChange={handleRoleChange}
                            >
                              <option
                                value=""
                                className="dropdown-item text-muted text-light"
                                disabled
                              >
                                -- Select role
                              </option>
                              {rolesList.map((role) => {
                                return (
                                  <option
                                    className="dropdown-item"
                                    key={role.id}
                                    value={role.id}
                                  >
                                    {role.name}
                                  </option>
                                );
                              })}
                            </select>
                          </td>
                          <td>
                            <SystemButton
                              type={'remove-row'}
                              method={() => removeRow(userRoles[index].index)}
                              showText={false}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : null}
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
        loadingState={isLoading}
        actionsColumn={false}
        showEditButton={false}
        showDeleteButton={false}
      />
      {/* End of list view component */}
    </div>
  );

  /* --- End of component renders --- */
};

export default Roles;
