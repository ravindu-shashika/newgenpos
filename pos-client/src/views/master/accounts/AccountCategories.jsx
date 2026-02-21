import React, { useState, useEffect } from 'react';
import { api, msg } from '../../../services';
import { FormModal, ListView, SystemButton } from '../../../components';

const AccountCategories = () => {
  // Module name
  const moduleName = 'Account Categories';

  /* --- State declarationss --- */

  const [entities, setEntities] = useState([]);

  // Account types list
  const [accountTypes, setAccountTypes] = useState([]);

  const [newData, setNewData] = useState({
    user_id: 1,
    branch_id: 0,
    account_type_id: '',
    des: '',
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
  const dataColumns = [
    { title: 'Account Type', name: 'account_type' },
    { title: 'Description', name: 'des' },
  ];
  let dataRows = [];

  /* --- End of state declarations --- */

  useEffect(() => {
    fetchData();
  }, []);

  /* --- Component functions --- */

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const response = await api.get('account-categories');
      // console.log(response.data);

      if (typeof response.error !== 'undefined') {
        msg.error(response.error.err);
        return;
      } else {
        response.data.map((entity) => {
          dataRows.push({
            id: entity.id,
            account_type: entity.account_type_id,
            des: entity.des,
          });
        });

        setEntities(dataRows);

        setIsLoading(false);
      }
    } catch (error) {
      msg.error('Unable to fetch data!');
      return console.log(error);
    }

    await fetchRelatedModels();
  };

  const fetchRelatedModels = async () => {
    try {
      const response = await api.get('account-types');

      setAccountTypes(response.data);
    } catch (error) {
      return msg.error(`Couldn't fetch related models`);
    }
  };

  const searchAndFetch = async (searchPhrase, selectedColumn) => {
    try {
      setIsLoading(true);

      const response = await api.get(
        `account-categorires/search/${searchPhrase}/${selectedColumn}`,
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

    setNewData({
      ...newData,
      [inputName]: inputValue,
    });
  };

  const editRow = (dataObj) => {
    console.log(dataObj);

    setShowModalState(true);

    setNewData({
      account_type_id: dataObj.account_type,
      des: dataObj.des,
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
      user_id: 1,
      branch_id: 0,
      account_type_id: '',
      des: '',
    });

    fetchData();
  };

  const save = async () => {
    if (isEdit === false) {
      try {
        const response = await api.post('account-categories').values(newData);

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
        const response = await api
          .update(`account-categories/${selectedId}/update`)
          .values(newData);

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
      <div className="row">
        <div className="col-2">
          <SystemButton type={'add-new'} method={toggleFormModal} />
        </div>
      </div>
      {/* Form modal componenet */}
      <FormModal
        moduleName={moduleName}
        modalState={showModalState}
        toggleFormModal={toggleFormModal}
      >
        <form className="form" onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="row">
              <div className="form-group col-6">
                <label htmlFor="account_type_id">Account Type</label>
                <select
                  name="account_type_id"
                  id="account_type_id"
                  className="form-control form-control-sm"
                  value={newData.account_type_id}
                  onChange={handleValueChange}
                  required
                >
                  <option
                    value=""
                    className="dropdown-item text-muted text-light"
                    disabled
                  >
                    Select account type
                  </option>
                  {accountTypes.map((accountType) => {
                    return (
                      <option
                        className="dropdown-item"
                        key={accountType.id}
                        value={accountType.id}
                      >
                        {accountType.des}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="form-group col-6">
                <label htmlFor="des">Description</label>
                <input
                  type="text"
                  name="des"
                  id="des"
                  maxLength="20"
                  className="form-control form-control-sm"
                  value={newData.des}
                  onChange={handleValueChange}
                  required
                />
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

export default AccountCategories;
