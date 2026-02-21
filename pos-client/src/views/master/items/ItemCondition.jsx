import React, { useState, useEffect } from 'react';
import { api, msg, cookie } from '../../../services';
import { FormModal, ListView, SystemButton } from '../../../components';

const ItemCondition = () => {
  // Module name
  const moduleName = 'Item Condition';

  /* --- State declarationss --- */

  const [entities, setEntities] = useState([]);

  const [newData, setNewData] = useState({
    description: '',
    user_id: cookie.get('user_id'),
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
    { title: 'Item Condition', name: 'description', searchable: true },
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

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const response = await api.get('item-conditions');
      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err[0]);
        });
        return;
      }
      setIsLoading(false);
      setEntities(response.data.data);
    } catch (error) {
      msg.error('Unable to fetch data!');
      return console.log(error);
    }
  };

  const searchAndFetch = async (searchPhrase, selectedColumn) => {
    try {
      setIsLoading(true);

      const response = await api.get(
        `item-conditions/${searchPhrase}/${selectedColumn}`,
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
    const inputValue = targetInput.value;

    setNewData({
      [inputName]: inputValue,
    });
  };

  const editRow = (dataObj) => {
    setShowModalState(true);

    setNewData({
      description: dataObj.description,
    });

    setIsEdit(true);
    setSelectedId(dataObj.id);
  };

  const toggleFormModal = () => {
    setShowModalState(!showModalState);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    await saveData();

    setNewData({
      description: '',
    });

    fetchData();
  };

  const saveData = async () => {
    if (isEdit === false) {
      try {
        const response = await api.post('item-conditions').values(newData);

        if (response.error) {
          Object.values(response.error).forEach((err) => {
            msg.error(err[0]);
          });
          return;
        }

        msg.success(response.data);
      } catch (error) {
        msg.error('Unable to save data!');
        return console.log(error);
      } finally {
        setShowModalState(false);
      }
    } else {
      try {
        const response = await api
          .update(`item-conditions/${selectedId}/update`)
          .values(newData);

        if (response.error) {
          Object.values(response.error).forEach((err) => {
            msg.error(err[0]);
          });
          return;
        }

        msg.success(response.data);
      } catch (error) {
        msg.error('Unable to update data!');
        return console.log(error);
      } finally {
        setIsEdit(false);
        setSelectedId('');
        setShowModalState(false);
      }
    }
  };

  const resetForm = () => {
    setNewData({
      description: '',
      user_id: cookie.get('user_id'),
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
            btnText="Add condition"
          />
        </div>
      </div>

      {/* Form modal componenet */}
      <FormModal
        moduleName={moduleName}
        modalState={showModalState}
        toggleFormModal={toggleFormModal}
      >
        <form onSubmit={handleSubmit} className="compactForm">
          <div className="modal-body">
            <label htmlFor="itemCategory">Condition</label>
            <input
              type="text"
              name="description"
              id="itemCategory"
              className="form-control input-sm"
              value={newData.description}
              onChange={handleValueChange}
            />
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

export default ItemCondition;
