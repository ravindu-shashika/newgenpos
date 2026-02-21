import React, { useState, useEffect } from 'react';
import { api, msg } from '../services';
import { FormModal, ListView, SystemButton } from '../components';
import { v4 as uuidv4 } from 'uuid';
import { SafeFontAwesomeIcon } from '../components';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

const RolePermissions = () => {
  // Module name
  const moduleName = 'Role Permissions';

  /* --- State declarationss --- */

  const [entities, setEntities] = useState([]);

  const [rolesList, setRolesList] = useState([]);

  const [newData, setNewData] = useState({
    role_id: '',
  });

  const [userRoles, setUserRoles] = useState([
    {
      index: '',
      id: '',
    },
  ]);

  const [menuList, setMenuList] = useState([]);

  const [menuFilterList, setFilterMenuList] = useState([]);

  const [checkedList, setCheckedList] = useState([]);

  // Form modal state
  const [showModalState, setShowModalState] = useState(false);

  // Data loading status
  const [isLoading, setIsLoading] = useState(false);

  // List view states

  let dataRows = [];

  let checkedRoles = [];

  let routes = [];

  /* --- End of state declarations --- */

  useEffect(() => {
    fetchData();
  }, []);

  /* --- Component functions --- */

  const fetchData = async () => {
    dataRows = [];
    try {
      setIsLoading(true);

      let currentRoles = [];

      const response = await api.get('showRoles');
      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err[0]);
        });
        return;
      }

      setUserRoles(response.data);
    } catch (error) {
      msg.error('Unable to fetch data!');
      return console.log(error);
    }
  };

  const handleValueChange = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue = targetInput.value;

    console.log(targetInput.checked);
    console.log(inputValue);

    if (inputName === 'role_id') {
      getMenuList(inputValue);

      setNewData({
        ...newData,
        role_id: inputValue,
      });
    }

    if (inputName === 'menu_id') {
      console.log(targetInput.checked);
      if (targetInput.checked) {
        checkedRoles.push(inputValue);
        console.log(checkedRoles);
      } else {
        const index = checkedRoles.indexOf(inputValue);
        if (index > -1) {
          checkedRoles.splice(index, 1);
        }
      }
      setCheckedList(checkedRoles);
    }
  };

  const checkIfMenuIdExist = async (array, element) => {
    array
      .map((value) => {
        if (value.permission_id == element) {
          console.log('found');
          return '1';
        }
      })
      .join('');
    console.log('not found');
    return '0';
  };

  const addMenuToRole = async () => {
    const permissionIds = [];
    const menuIds = [];
    menuList.forEach((list) => {
      let allow_menu = false;
      list.permission.forEach((menuList, index) => {
        let status = menuList.store == true ? 1 : 0;
        if (status == 1) {
          allow_menu = true;
        }
        let exist_key = permissionIds
          .map((value, key) => {
            if (value.permission_id == menuList.id) {
              return key;
            }
          })
          .join('');
        if (exist_key) {
          if (permissionIds[exist_key].value == 0 && status == 1) {
            console.log('need to add new object');
            console.log('place : ' + exist_key);
            let name = permissionIds[exist_key].permission_name;
            let id = permissionIds[exist_key].permission_id;
            permissionIds[exist_key] = {
              permission_name: name,
              permission_id: id,
              value: status,
            };
          }
        } else {
          permissionIds.push({
            permission_name: menuList.name,
            permission_id: menuList.id,
            value: status,
          });
        }
      });
      if (allow_menu == true) {
        menuIds.push({ menu_name: list.name, menu_id: list.id });
      }
    });

    const menu_response = await api
      .post(`add-menu-access/${newData.role_id}`)
      .values({ menu_ids: menuIds });
    const chunk_size = 30;
    const responses = [];
    for (let index = 0; index < permissionIds.length; index += chunk_size) {
      const child_array = permissionIds.slice(index, index + chunk_size);
      console.log(child_array);
      const response = await api
        .post(`add-menu-to-role/${newData.role_id}`)
        .values({ permission_ids: child_array });
      responses.push(response);
    }

    if (menu_response.data.status == 200) {
      msg.success('Update menu permission successfully !');
    } else {
      msg.error('fail to update menu access !');
    }
    let backend_result = true;
    responses.forEach((res) => {
      if (res.status != 200) {
        backend_result = false;
      }
    });
    if (backend_result == true) {
      msg.success('Update permission successfully !');
    } else {
      msg.error('Fail to updated permission !');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    await addMenuToRole();

    // resetAll();
  };

  const getMenuList = async (role_id) => {
    setNewData({
      role_id: role_id,
    });

    const response = await api.get(`show-menu-list-by-role/${role_id}`);
    setMenuList(response.data);
  };

  const handleMenuListChange = async (event) => {
    // const targetInput = e.target;
    // const inputName = targetInput.name;
    const selectedValue = event.target.value;

    // const indexes = inputName.split('-');
    //  const checked_state = menuList[indexes[0]].permission[indexes[1]].store == true ? false : true;
    // menuList[indexes[0]].permission[indexes[1]].store = checked_state;
    //  let table = [...menuList];

    // Extract the 'name' property from the filtered options
    const names = menuList.filter((perm) => perm.name === selectedValue);
    setFilterMenuList(names);

    console.log(names);
  };

  const handleStatusChecked = async (event) => {
    const targetInput = event.target;
    const inputName = targetInput.name;
    // const selectedValue = event.target.value;
    const indexes = inputName.split('-');
    const checked_state =
      menuFilterList[indexes[0]].permission[indexes[1]].store == true
        ? false
        : true;
    menuFilterList[indexes[0]].permission[indexes[1]].store = checked_state;
    let table = [...menuFilterList];

    // Extract the 'name' property from the filtered options
    // const names = menuList.filter((perm) => perm.name === selectedValue);
    setFilterMenuList(table);

    console.log(table);
  };

  const removeSpecialCharacters = (string) => {
    const cleanedString = string.replace(/[._]/g, ' '); // Replace dots and underscores with an empty string
    return cleanedString;
  };

  const handleMenuListChangeOne = async (e) => {
    const targetInput = e.target;
    console.log(targetInput);
    console.log('test');
    // const datasetId = targetInput.dataset.id;
    // const datasetId1 = targetInput.dataset.id1;
    // const inputName = targetInput.name;
    // const inputValue = targetInput.value;
  };

  /* --- End of component functions --- */

  /* --- Component renders --- */

  return (
    <div>
      <h5 className="text-center">{moduleName}</h5>
      <br />
      <br />
      <br />
      <form onSubmit={handleSubmit}>
        <div className="row d-flex justify-content-center">
          <label htmlFor="role_id" className="col-sm-1 col-form-label mx-0">
            Role
          </label>
          <div className="col-sm-5">
            <select
              id="role_id"
              name="role_id"
              className="form-control form-control-sm "
              onChange={handleValueChange}
              // value={newData.opening_stock_id}
            >
              <option value="">---</option>
              {userRoles
                ? userRoles.map((obj) => {
                    return (
                      <option key={obj.id} value={obj.id}>
                        {obj.name}
                      </option>
                    );
                  })
                : null}
            </select>
          </div>
        </div>
        <div className="row d-flex justify-content-center">
          <label htmlFor="role_id" className="col-sm-1 col-form-label mx-0">
            Permission
          </label>
          <div className="col-sm-5">
            <select
              id="role_id"
              name="role_id"
              className="form-control form-control-sm "
              onChange={handleMenuListChange}
              // value={newData.opening_stock_id}
            >
              <option value="">---</option>
              {menuList
                ? menuList.map((obj, index) => {
                    return (
                      <option key={obj.name} value={obj.name}>
                        {obj.name}
                      </option>
                    );
                  })
                : null}
            </select>
          </div>
        </div>
        <br />
        <br />
        <div className="row d-flex justify-content-center">
          {menuFilterList
            ? menuFilterList.map((obj, index) => {
                return (
                  // <tbody>
                  //     <tr key={index}>
                  //         <td>{obj.name}</td>
                  //         {/* <td className="text-center"><input type="checkbox" name="view1"  className="input-sm "  /></td> */}
                  //         <td className="text-center"><input data-id={index} type="checkbox" name="show" checked={obj.show} className="input-sm " onChange={handleMenuListChange} /></td>
                  //         <td className="text-center"><input data-id={index} type="checkbox" name="store" checked={obj.store}  className="input-sm " onChange={handleMenuListChange}  /></td>
                  //         <td className="text-center"><input data-id={index} type="checkbox" name="update" checked={obj.update}  className="input-sm " onChange={handleMenuListChange}  /></td>
                  //         <td className="text-center"><input data-id={index} type="checkbox" name="destroy" checked={obj.destroy} className="input-sm " onChange={handleMenuListChange}  /></td>
                  //     </tr>
                  // </tbody>
                  <div id="accordion" className="col-sm-12">
                    <div className="card">
                      {/* <div className="card-header" id={'headingOne' + index}>
                        <h5 className="mb-0">
                          <input
                            type="button"
                            className="btn"
                            data-toggle="collapse"
                            value={obj.name}
                            data-target={'#collapseOne_' + index}
                            aria-controls={'collapseOne_' + index}
                          />
                        </h5>
                      </div> */}
                      <div
                        data-parent="#accordion"
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          flexWrap: 'wrap',
                        }}
                      >
                        {obj['permission']
                          ? obj['permission'].map((obj1, index1) => {
                              return (
                                <div
                                  className="card-body"
                                  style={{
                                    flex: 'none',
                                    paddingTop: '10px',
                                    paddingBottom: '10px',
                                  }}
                                >
                                  {/* <label htmlFor={index + '-' + index1}>
                                    {obj1.name}
                                  </label>
                                  <input
                                    data-id={index1}
                                    data-id1={index}
                                    checked={obj1.store}
                                    name={index + '-' + index1}
                                    id={index + '-' + index1}
                                    type="checkbox"
                                    className="input-sm  ml-2"
                                    onChange={handleMenuListChange}
                                  /> */}
                                  <input
                                    type="checkbox"
                                    data-id={index1}
                                    data-id1={index}
                                    id={index + '-' + index1}
                                    name={index + '-' + index1}
                                    value=""
                                    checked={obj1.store}
                                    onChange={handleStatusChecked}
                                    className="check-box"
                                  />
                                  <label
                                    htmlFor={index + '-' + index1}
                                    className="check-box-label"
                                  >
                                    <div className="label-content">
                                      <div className="mr-2">
                                        {removeSpecialCharacters(obj1.name)}
                                      </div>
                                      <div className="icon">
                                        <div className="icon-content">
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="16"
                                            height="16"
                                            fill="currentColor"
                                            className="bi bi-check svgdefault"
                                            viewBox="0 0 16 16"
                                          >
                                            <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
                                          </svg>
                                        </div>
                                      </div>
                                    </div>
                                  </label>
                                </div>
                              );
                            })
                          : null}{' '}
                      </div>{' '}
                    </div>{' '}
                  </div>
                );
              })
            : null}
        </div>
        <div className="modal-footer">
          <SystemButton type={'save'} showText={true} />
        </div>
      </form>
    </div>
  );

  /* --- End of component renders --- */
};

export default RolePermissions;
