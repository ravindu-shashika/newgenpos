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
    code: '',
    acc_code: '',
    description: ''    
  });  

  const [accounts, setAccounts] = useState([]);

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
    { title: 'Code', name: 'code', searchable: true },
    { title: 'Description', name: 'description', searchable: true },
    { title: 'Account', name: 'acc_code' , searchable: true},    
  ];

  const [switchPull, setSwitchPull] = useState(false);

  let dataRows = [];

  /* --- End of state declarations --- */

  useEffect(() => {
    fetchData();
  }, []);

  // useEffect(() => {
  //   setNewData({
  //     ...newData,      
  //   });
  // }, [switchPull]);

  /* --- Component functions --- */

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const response = await api.get('default-accounts');
      console.log(response.data);

      if (typeof response.error !== 'undefined') {
        msg.error(response.error.err);
        return;
      } else {
        response.data.entities.map((entity) => {
          //console.log(entity)
          dataRows.push({
            code: entity.code,
            description: entity.description,
            acc_code: entity.acc_code,            
          });
        });

        setEntities(dataRows);    
        setAccounts(response.data.accounts);
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
        `default-accounts/search/${searchPhrase}/${selectedColumn}`,
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

    setNewData({
      ...newData,      
      [inputName]: inputValue,
    });
  };

  const editRow = (dataObj) => {
    console.log(dataObj);
    setShowModalState(true);

    setNewData({
      ...newData,
      code: dataObj.code,
      acc_code: dataObj.acc_code,
      description: dataObj.description,      
    });

    //console.log(newData);    
    setIsEdit(true);
    setSelectedId(dataObj.code);
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
      code: '',
      description: '',
      acc_code: '',      
    });
  };

  const save = async () => {
    if (isEdit === false) {
      try {
        const response = await api.post('default-accounts').values(newData);
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
          .update(`default-accounts/${selectedId}/update`)
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
        width = {'60%'}
      >
        <form className="form" onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="row">
              <div className="col-6">
                <div className="form-group">
                  <label htmlFor="code">Code</label>
                  <input
                    type="text"
                    name="code"
                    id="code"
                    maxLength="40"
                    className="form-control form-control-sm"
                    value={newData.code}
                    onChange={handleValueChange}
                    required
                  />
                </div>
              </div>
              <div className="col-6">
              <div className="form-group">
                  <label htmlFor="acc_code">Account</label>
                  <select
                    name="acc_code"
                    className="form-control form-control-sm"
                    id="acc_code"
                    value={newData.acc_code}
                    onChange={handleValueChange}
                    required
                  >
                    <option
                      value=""
                      className="dropdown-item text-muted text-light"
                      disabled
                    >
                      -- Select account
                    </option>
                    {accounts.map((type) => {
                      return (
                        <option value={type.code} key={type.code}>
                          {type.description}
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
                  <label htmlFor="description">Description</label>
                  <input
                    type="text"
                    name="description"
                    id="description"
                    className="form-control form-control-sm"
                    maxLength = "50"
                    value={newData.description}
                    onChange={handleValueChange}
                    required
                  />
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
        rowKey="code"
        showEditButton
        actionsColumn    
      />
      {/* End of list view component */}
    </div>
  );

  /* --- End of component renders --- */
};

export default Accounts;
