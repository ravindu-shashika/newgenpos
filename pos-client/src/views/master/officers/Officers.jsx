import React, { useState, useEffect } from 'react';
import { api, msg, cookie } from '../../../services';
import { FormModal, ListView, SystemButton } from '../../../components';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import styles from '../pawning/BillTypes.module.css';
import { MultiSelect } from 'react-multi-select-component';

const Officers = () => {
  // Module name
  const moduleName = 'Officers';

  /* --- State declarationss --- */

  const [entities, setEntities] = useState([]);

  const [rolesList, setRolesList] = useState([]);

  const [newData, setNewData] = useState({
    id: '',
    name: '',
    officer_role: '',
    branch: '',
    email: '',
    password: '',
    confirm_password: '',
    is_show_all_branches: '',
    user_id: cookie.get('user_id'),
  });

  const [userRoles, setUserRoles] = useState([
    {
      index: '',
      id: '',
    },
  ]);

  const [branchList, setBranchList] = useState([]);

  const [checkedList, setCheckedList] = useState([]);

  // Form modal state
  const [showModalState, setShowModalState] = useState(false);

  // Data loading status
  const [isLoading, setIsLoading] = useState(false);

  const [isEdit, setIsEdit] = useState(false);

  const [isShowAll, setIsShowAll] = useState(false);

  const [effectiveBranch, setEffectiveBranches] = useState([]);

  const [dissableSaveButton, setDissableSaveButton] = useState(true);
  const [existingEmails, setExistingEmails] = useState([]);
  const [emailExistWarning, setEmailExistWarning] = useState(false);

  const [nameError, setNameError] = useState(false);
  const [officerNameList, setOfficerNameList] = useState([]);

  const [passwordNotMatch, setPasswordNotMatch] = useState(false);

  const [codeError, setCodeError] = useState(false);
  const [officerCodeList, setOfficerCodeList] = useState([]);

  const [removedItems, setRemovedItems] = useState({
    name: '',
    email: '',
    code: '',
  });

  // List view states

  const dataColumns = [
    { title: 'ID', name: 'id', class: 'text-center' },
    { title: 'Name', name: 'name', class: 'text-left', searchable: true },
    { title: 'Code', name: 'code', class: 'text-left', searchable: true },
    { title: 'Officer Role', name: 'officer_role', class: 'text-left' },
    { title: 'Branch', name: 'branch_name', class: 'text-left' },
    { title: 'User', name: 'user', class: 'text-left' },
    { title: 'Created At', name: 'created_at', class: 'text-left' },
  ];

  let dataRows = [];

  /* --- End of state declarations --- */

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setNewData({
      ...newData,
      branch: effectiveBranch,
    });
  }, [effectiveBranch]);

  useEffect(() => {
    if (newData.password != newData.confirm_password) {
      setDissableSaveButton(true);
      setPasswordNotMatch(true);
    } else {
      setDissableSaveButton(false);
      setPasswordNotMatch(false);
    }
  }, [newData.password, newData.confirm_password]);

  useEffect(() => {
    if (isEdit == false) {
      if (existingEmails.includes(newData.email) && newData.email != '') {
        setEmailExistWarning(true);
      } else {
        setEmailExistWarning(false);
      }
    }
  }, [newData.email]);

  useEffect(() => {
    if (isEdit == false) {
      if (officerNameList.includes(newData.name) && newData.name != '') {
        setDissableSaveButton(true);
        setNameError(true);
      } else {
        setDissableSaveButton(false);
        setNameError(false);
      }
    }
  }, [newData.name]);

  useEffect(() => {
    if (isEdit == false) {
      for (let index = 0; index < officerCodeList.length; index++) {
        if (
          officerCodeList[index] == newData.code &&
          officerCodeList[index] != ''
        ) {
          setDissableSaveButton(true);
          setCodeError(true);
          break;
        } else {
          setDissableSaveButton(false);
          setCodeError(false);
        }
      }
    }
  }, [newData.code]);

  /* --- Component functions --- */

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`officer-data`);
      let branch_list = [];
      let branch_count = 0;
      response.data.branches
        .map((branch) => {
          branch_list.push({
            label: branch.code + ' ' + branch.name,
            value: branch.id,
          });
          branch_count += 1;
        })
        .join('');
      setBranchList(branch_list);
      setRolesList(response.data.officer_roles);
      let officers = [];
      let officer_names = [];
      let officer_codes = [];
      response.data.officers
        .map((officer) => {
          let officer_branches = '';
          let officer_branch_count = 0;
          officer.officer_branches
            .map((br) => {
              officer_branches += `${br.branch.name}, `;
              officer_branch_count += 1;
            })
            .join('');
          officers.push({
            id: officer.id,
            name: officer.name,
            code: officer.code,
            officer_role: officer.officer_role.name,
            branch_name:
              officer_branch_count == branch_count
                ? 'All Branch'
                : officer_branches,
            email: officer.user.email,
            branch_list: officer.officer_branches,
            created_at: moment(officer.created_at).format(
              'YYYY-MM-DD | h:mm A',
            ),
            user: officer.added_by.name,
          });
          officer_names.push(officer.name.toUpperCase());
          officer_codes.push(officer.code);
        })
        .join('');
      setEntities(officers);
      setOfficerNameList([...officer_names]);
      setOfficerCodeList([...officer_codes]);
      setExistingEmails(response.data.emails);
    } catch (error) {
      msg.error('Unable to fetch data!');
      return console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleValueChange = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue =
      targetInput.type === 'checkbox' ? targetInput.checked : targetInput.value;
    if (inputName == 'name') {
      setNewData({
        ...newData,
        [inputName]: inputValue.toUpperCase(),
      });
    } else {
      setNewData({
        ...newData,
        [inputName]: inputValue,
      });
    }
    if (inputName == 'is_show_all_branches') {
      if (targetInput.checked) {
        setIsShowAll(true);
      } else {
        setIsShowAll(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    await save();

    // resetAll();
    // fetchData();
  };

  const save = async () => {
    if (isEdit === false) {
      const response = await api.post('add-officers').values(newData);
      if (response.status == 200 && response.data.status == 200) {
        msg.success(response.data.message);
        resetAll();
        fetchData();
      } else if (response.status == 200 && response.data.status == 500) {
        msg.error(response.data.message);
      } else if (response.status == 200 && response.data.status == 400) {
        msg.warning(response.data.message);
      } else if (response.data.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err);
        });
      } else {
        msg.error('Something Went Wrong...');
      }
    } else {
      const response = await api
        .post(`update-officers/${newData.id}`)
        .values(newData);
      if (response.status == 200 && response.data.status == 200) {
        msg.success(response.data.message);
        resetAll();
        fetchData();
      } else if (response.status == 200 && response.data.status == 500) {
        msg.error(response.data.message);
      } else if (response.status == 200 && response.data.status == 400) {
        msg.warning(response.data.message);
      } else if (response.data.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err);
        });
      } else {
        msg.error('Something Went Wrong...');
      }
    }
  };

  const editRow = async (dataObj) => {
    setIsEdit(true);
    const response = await api.get(`officer-is-show-all/${dataObj.id}`);
    if (response.data[0].is_show_all_branch === 1) {
      setIsShowAll(true);
    } else {
      setIsShowAll(false);
    }
    dataObj.branch_list
      .map((branch) => {
        effectiveBranch.push({
          label: branch.branch.name,
          value: branch.branch.id,
        });
      })
      .join('');
    let index = existingEmails.indexOf(dataObj.email);
    existingEmails.slice(index, 1);
    setNewData({
      id: dataObj.id,
      name: dataObj.name,
      code: dataObj.code,
      officer_role: response.data[0].officer_role,
      branch: response.data[0].branch_id,
      is_show_all_branches: isShowAll,
      user_id: cookie.get('user_id'),
      email: dataObj.email,
      branch: effectiveBranch,
    });
    // * assign removed items
    setRemovedItems({
      ...removedItems,
      name: dataObj.name,
      email: dataObj.email,
      code: dataObj.code,
    });
    // * remove element from officerNameList
    let name_index = officerNameList.indexOf(dataObj.name);
    if (name_index !== -1) {
      officerNameList.splice(name_index, 1);
    }
    // * remove element from officerCodeList
    let code_index = officerCodeList.indexOf(dataObj.code);
    if (code_index !== -1) {
      officerCodeList.splice(code_index, 1);
    }
    // * remove element from existingEmails
    let email_index = existingEmails.indexOf(dataObj.email);
    if (email_index !== -1) {
      existingEmails.splice(email_index, 1);
    }
    setShowModalState(true);
  };

  const toggleFormModal = (e) => {
    setShowModalState(!showModalState);
    setNewData({
      ...newData,
      id: '',
      name: '',
      code: '',
      officer_role: '',
      branch: '',
      email: '',
      password: '',
      confirm_password: '',
      is_show_all_branches: '',
      user_id: cookie.get('user_id'),
    });
    // * repush removed elements
    officerNameList.push(removedItems.name);
    officerCodeList.push(removedItems.code);
    existingEmails.push(removedItems.email);
    setRemovedItems({
      ...removedItems,
      name: '',
      email: '',
      code: '',
    });
    setEffectiveBranches([]);
    setIsEdit(false);
  };

  const resetAll = () => {
    setNewData({
      ...newData,
      id: '',
      name: '',
      code: '',
      officer_role: '',
      branch: '',
      email: '',
      password: '',
      confirm_password: '',
      is_show_all_branches: '',
      user_id: cookie.get('user_id'),
    });
    setEffectiveBranches([]);
    setOfficerCodeList([]);
    setOfficerNameList([]);
    setShowModalState(false);
    setIsLoading(false);
    setIsEdit(false);
  };

  const searchAndFetch = async (searchPhrase, selectedColumn) => {
    // try {
    //   setIsLoading(true);
    //   const response = await api.get(
    //     `officers/search/${searchPhrase}/${selectedColumn}`,
    //   );
    //   dataRows = [];
    //   if (response.data.total === 0) {
    //     msg.warning(`No results returned your search!`);
    //   } else {
    //     response.data.data.map((entity) => {
    //       return dataRows.push({
    //         id: entity.id,
    //         name: entity.name,
    //         officer_role: '',
    //         branch: '',
    //       });
    //     });
    //     setEntities(dataRows);
    //   }
    //   setIsLoading(false);
    // } catch (error) {
    //   msg.error('Unable to search data!');
    //   setIsLoading(false);
    // }
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
        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.preventDefault();
          }}
          className="compactForm"
        >
          <div className="modal-body">
            <div className="row">
              <div className="col-sm-5">
                <div className="form-group mb-0">
                  <label htmlFor="name">Name</label>
                  <input
                    type="test"
                    name="name"
                    id="name"
                    className="form-control form-control-sm"
                    value={newData.name}
                    onChange={handleValueChange}
                    autoComplete="off"
                  />
                </div>
                {nameError ? (
                  <span className="text-danger">
                    This name is already tacken
                  </span>
                ) : null}
              </div>
              <div className="col-sm-5">
                <div className="form-group mb-0">
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
                {emailExistWarning ? (
                  <span className="text-danger">Email Exist...</span>
                ) : null}
              </div>
              <div className="col-sm-2">
                <div className="form-group mb-0">
                  <label htmlFor="code">Code</label>
                  <input
                    type="text"
                    name="code"
                    id="code"
                    className="form-control form-control-sm"
                    value={newData.code}
                    onChange={handleValueChange}
                  />
                </div>
                {codeError ? (
                  <span className="text-danger">Code Exist...</span>
                ) : null}
              </div>
            </div>
            <div className="row">
              <div className="col-sm-6">
                <div className="form-group mb-0">
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
                {passwordNotMatch ? (
                  <span className="text-danger">Password Mismatch...</span>
                ) : null}
              </div>
              <div className="col-sm-6">
                <div className="form-group">
                  <label htmlFor="confirm_password">Confirm Password</label>
                  <input
                    type="password"
                    name="confirm_password"
                    id="confirm_password"
                    className="form-control form-control-sm"
                    value={newData.confirm_password}
                    onChange={handleValueChange}
                  />
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-sm-6">
                <div className="form-group">
                  <label htmlFor="officer_role">Branches</label>
                  <MultiSelect
                    id="branch_ids"
                    name="branch_ids"
                    selectAllLabel={'All Branches'}
                    options={branchList}
                    value={effectiveBranch}
                    onChange={setEffectiveBranches}
                    // onChange={() => changeRegionalOffice(effectiveOffices)}
                    labelledBy={'branch'}
                    className={styles.multiselect}
                  />
                </div>
              </div>
              <div className="col-sm-6">
                <div className="form-group">
                  <label htmlFor="officer_role">Officer Roles</label>
                  <select
                    type="text"
                    name="officer_role"
                    id="officer_role"
                    className="form-control form-control-sm"
                    value={newData.officer_role}
                    onChange={handleValueChange}
                  >
                    <option value="" className="text-muted" disabled>
                      -- Select type
                    </option>
                    {rolesList.map((income) => {
                      return (
                        <option value={income.id} key={income.id}>
                          {income.name}
                        </option>
                      );
                    })}
                  </select>
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
              type={'save'}
              btnText={isEdit ? 'Save Changes' : 'Save'}
              showText={true}
              disabled={dissableSaveButton}
            />
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
        edit={editRow}
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

export default Officers;
