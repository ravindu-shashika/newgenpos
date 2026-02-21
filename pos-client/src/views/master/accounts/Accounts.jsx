import React, { useState, useEffect } from 'react';
import { api, msg } from '../../../services';
import { FormModal, ListView, SystemButton } from '../../../components';
import { SafeFontAwesomeIcon } from '../../../components';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

const Accounts = () => {
  // Module name
  const moduleName = 'Accounts';

  /* --- State declarationss --- */

  const [entities, setEntities] = useState([]);

  const [newData, setNewData] = useState({
    des: '',
    account_number: '',
    account_category_id: 0,
    account_type_id: 0,
    display_text: '',
    account_group_id: 0,
    control_account_id: 0,
    is_control: 0,
  });

  const [accountCategories, setAccountCategories] = useState([]);

  const [accountGroups, setAccountGroups] = useState([]);

  const [controlAccount, setControlAccounts] = useState([]);

  const [accountTypes, setAccountTypes] = useState([]);

  // Data loading status
  const [isLoading, setIsLoading] = useState(false);

  // Form modal state
  const [showModalState, setShowModalState] = useState(false);

  // Data edit state
  const [isEdit, setIsEdit] = useState(false);

  // Selected data
  const [selectedId, setSelectedId] = useState(false);

  // List view states
  const dataColumns = [
    { title: 'ID', name: 'id' },
    { title: 'Display Text', name: 'display_text' },
    { title: 'Acc No.', name: 'account_number' },
    { title: 'Account Type', name: 'account_type' },
    { title: 'Category', name: 'account_category' },
    { title: 'Group', name: 'account_group' },
    { title: 'Control Account', name: 'is_control' },
  ];

  const [switchPull, setSwitchPull] = useState(false);

  let dataRows = [];

  /* --- End of state declarations --- */

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setNewData({
      ...newData,
      is_control: switchPull,
    });
  }, [switchPull]);

  /* --- Component functions --- */

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const response = await api.get('accounts');
      console.log(response.data);

      if (typeof response.error !== 'undefined') {
        msg.error(response.error.err);
        return;
      } else {
        response.data.entities.map((entity) => {
          //console.log(entity)
          dataRows.push({
            id: entity.id,
            display_text: entity.display_text,
            des: entity.des,
            account_number: entity.account_number,
            account_category_id: entity.account_category.id,
            account_category: entity.account_category.des,
            account_type_id: entity.account_type.id,
            account_type: entity.account_type.des,
            account_group_id: entity.account_group.id,
            account_group: entity.account_group.des,
            // control_account: entity.control_account
            is_control: entity.is_control ? 'Yes' : 'No',
          });
        });

        setEntities(dataRows);

        setAccountCategories(response.data.account_categories);
        setAccountTypes(response.data.account_types);
        setAccountGroups(response.data.account_groups);
        setControlAccounts(response.data.control_accounts);

        setIsLoading(false);
      }
    } catch (error) {
      msg.error('Unable to fetch data!');
      return console.log(error);
    }
  };

  const searchAndFetch = async (searchPhrase, selectedColumn) => {
    try {
      setIsLoading(true);

      const response = await api.get(
        `accounts/search/${searchPhrase}/${selectedColumn}`,
      );

      if (response.data.total === 0) {
        msg.warning(`No results returned your search!`);
      } else {
        setEntities(response.data);
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
    const inputValue = targetInput.value;
    let isControl = 0;

    if (inputName === 'is_control' && targetInput.checked) {
      isControl = 1;
      setSwitchPull(true);
    } else {
      isControl = 0;
      setSwitchPull(false);
    }

    setNewData({
      ...newData,
      is_control: isControl,
      [inputName]: inputValue,
    });
  };

  const editRow = (dataObj) => {
    console.log(dataObj);
    setShowModalState(true);

    setNewData({
      ...newData,
      id: dataObj.id,
      des: dataObj.des,
      account_number: dataObj.account_number,
      account_category_id: dataObj.account_category_id,
      account_type_id: dataObj.account_type_id,
      display_text: dataObj.display_text,
      account_group_id: dataObj.account_group_id,
      control_account_id: dataObj.control_account_id,
      is_control: dataObj.is_control,
    });

    //console.log(newData);
    setSwitchPull(dataObj.is_control === 'Yes' ? true : false);
    setIsEdit(true);
    setSelectedId(dataObj.id);
  };

  const toggleFormModal = () => {
    reset();
    setShowModalState(!showModalState);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    await save();

    reset();

    fetchData();
  };

  const reset = () => {
    setNewData({
      ...newData,
      des: '',
      account_number: '',
      account_category_id: '',
      account_type_id: '',
      display_text: '',
      account_group_id: '',
      control_account_id: 0,
      is_control: 0,
    });
  };

  const save = async () => {
    if (isEdit === false) {
      try {
        const response = await api.post('accounts').values(newData);
        console.log(response, newData);
        if (response.error) {
          Object.values(response.error).forEach((err) => {
            msg.error(err);
          });
          return;
        } else {
          return msg.success(response.data);
        }
      } catch (error) {
        return console.log(error);
      } finally {
        setShowModalState(false);
      }
    } else {
      try {
        console.log(newData);
        const response = await api
          .update(`accounts/${selectedId}/update`)
          .values(newData);
        console.log(response);
        if (response.error) {
          Object.values(response.error).forEach((err) => {
            msg.error(err[0]);
          });
          return;
        }

        msg.success(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsEdit(false);
        setSelectedId('');
        setShowModalState(false);
      }
    }
  };

  /* --- End of component functions --- */

  /* --- Component renders --- */

  return (
    <div>
      <h5 className="text-center">{moduleName}</h5>
      <br />
      <button
        type="button"
        className="btn btn-primary btn-sm"
        onClick={toggleFormModal}
      >
        <span>
          <SafeFontAwesomeIcon icon={faPlus} size="sm" />
        </span>
        &nbsp; Add New
      </button>

      {/* Form modal componenet */}
      <FormModal
        moduleName={moduleName}
        modalState={showModalState}
        toggleFormModal={toggleFormModal}
      >
        <form className="form" onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="row">
              <div className="col-6">
                <div className="form-group">
                  <label htmlFor="des">Description</label>
                  <input
                    type="text"
                    name="des"
                    id="des"
                    className="form-control form-control-sm"
                    value={newData.des}
                    onChange={handleValueChange}
                    required
                  />
                </div>
              </div>
              <div className="col-6">
                <div className="form-group">
                  <label htmlFor="display_text">Display Text</label>
                  <input
                    type="text"
                    name="display_text"
                    id="display_text"
                    className="form-control form-control-sm"
                    value={newData.display_text}
                    onChange={handleValueChange}
                    required
                  />
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-6">
                <div className="form-group">
                  <label htmlFor="account_number">Account number</label>
                  <input
                    type="input"
                    name="account_number"
                    id="account_number"
                    className="form-control form-control-sm"
                    value={newData.account_number}
                    onChange={handleValueChange}
                    required
                  />
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-6">
                <div className="form-group">
                  <label htmlFor="account_category_id">Account Category</label>
                  <select
                    name="account_category_id"
                    className="form-control form-control-sm"
                    id="account_category_id"
                    value={newData.account_category_id}
                    onChange={handleValueChange}
                    required
                  >
                    <option
                      value=""
                      className="dropdown-item text-muted text-light"
                      disabled
                    >
                      -- Select account category
                    </option>
                    {accountCategories.map((category) => {
                      return (
                        <option value={category.id} key={category.id}>
                          {category.des}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
              <div className="col-6">
                <div className="form-group">
                  <label htmlFor="account_type_id">Account Type</label>
                  <select
                    name="account_type_id"
                    className="form-control form-control-sm"
                    id="account_type_id"
                    value={newData.account_type_id}
                    onChange={handleValueChange}
                    required
                  >
                    <option
                      value=""
                      className="dropdown-item text-muted text-light"
                      disabled
                    >
                      -- Select account type
                    </option>
                    {accountTypes.map((type) => {
                      return (
                        <option value={type.id} key={type.id}>
                          {type.des}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-6">
                <div className="form-group">
                  <label htmlFor="account_group_id">Account Group</label>
                  <select
                    name="account_group_id"
                    className="form-control form-control-sm"
                    id="account_group_id"
                    value={newData.account_group_id}
                    onChange={handleValueChange}
                    required
                  >
                    <option
                      value=""
                      className="dropdown-item text-muted text-light"
                      disabled
                    >
                      -- Select account group
                    </option>
                    {accountGroups.map((group) => {
                      return (
                        <option value={group.id} key={group.id}>
                          {group.des}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
              <div className="col-6">
                <div className="form-group">
                  <label htmlFor="control_account_id">Control Account</label>
                  <select
                    name="control_account_id"
                    className="form-control form-control-sm"
                    id="control_account_id"
                    value={newData.control_account_id}
                    onChange={handleValueChange}
                  >
                    <option
                      value=""
                      className="dropdown-item text-muted text-light"
                      disabled
                    >
                      -- Select control account
                    </option>
                    {controlAccount.map((account) => {
                      return (
                        <option value={account.id} key={account.id}>
                          {account.des}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-3 offset-2">
                <div className="form-group">
                  <div className="material-switch pull-right">
                    <span>
                      <label htmlFor="is_control">Control Account</label>
                    </span>
                    <br />
                    <input
                      type="checkbox"
                      id="is_control"
                      name="is_control"
                      value={newData.is_control}
                      onChange={handleValueChange}
                      checked={switchPull}
                    />
                    <label htmlFor="is_control" className="btn-success"></label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={toggleFormModal}
            >
              Close
            </button>
            <button type="submit" className="btn btn-outline-success btn-sm">
              Save Changes
            </button>
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
        showEditButton={true}
        showDeleteButton={false}
      />
      {/* End of list view component */}
    </div>
  );

  /* --- End of component renders --- */
};

export default Accounts;
