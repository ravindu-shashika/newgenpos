import React, { useState, useEffect } from 'react';
import { api, msg } from '../../../services';
import { FormModal, ListView } from '../../../components';

const GoldRates = () => {
  // Module name
  const moduleName = 'Expense Types';

  /* --- State declarationss --- */

  const [entities, setEntities] = useState([]);

  const [newData, setNewData] = useState({
    name: '',
    account: '',
  });

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
    { title: 'Name', name: 'name', searchable: true },
    {
      title: 'Account',
      name: 'account',
      searchable: true,
      class: 'text-center',
    },
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

      const response = await api.get('expense-types');

      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err[0]);
        });
        return;
      }
      response.data.map((entity) => {
        dataRows.push({
          id: entity.id,
          name: entity.name,
          account: entity.account,
        });
      });

      setEntities(response.data);
    } catch (error) {
      msg.error('Unable to fetch data!');
      return console.log(error);
    }
    setIsLoading(false);
  };

  const searchAndFetch = async (searchPhrase, selectedColumn) => {
    try {
      setIsLoading(true);

      const response = await api.get(
        `expense-types/search/${searchPhrase}/${selectedColumn}`,
      );

      dataRows = [];

      console.log(response);

      if (response.data.total === 0) {
        msg.warning(`No results returned your search!`);
      } else {
        response.data.data.map((entity) => {
          return dataRows.push({
            id: entity.id,
            name: entity.name,
            account: entity.account,
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
    const inputValue = targetInput.value;

    setNewData({
      ...newData,
      [inputName]: inputValue,
    });
  };

  const editRow = (dataObj) => {
    setShowModalState(true);

    setNewData({
      name: dataObj.name,
      account: dataObj.account,
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
      name: '',
      account: '',
    });

    fetchData();
  };

  const save = async () => {
    if (isEdit === false) {
      try {
        const response = await api.post('expense-types').values(newData);

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
          .update(`expense-types/${selectedId}/update`)
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
      <button
        type="button"
        className="btn btn-primary"
        onClick={toggleFormModal}
      >
        Add New
      </button>

      {/* Form modal componenet */}
      <FormModal
        moduleName={moduleName}
        modalState={showModalState}
        toggleFormModal={toggleFormModal}
      >
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                name="name"
                id="name"
                className="form-control input-sm"
                value={newData.name}
                onChange={handleValueChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="account">Rate</label>
              <input
                type="text"
                name="account"
                id="account"
                className="form-control input-sm"
                value={newData.account}
                onChange={handleValueChange}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={toggleFormModal}
            >
              Close
            </button>
            <button type="submit" className="btn btn-outline-success">
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
        showDeleteButton={true}
      />
      {/* End of list view component */}
    </div>
  );

  /* --- End of component renders --- */
};

export default GoldRates;
