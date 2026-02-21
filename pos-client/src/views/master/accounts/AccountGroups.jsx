import React, { useState, useEffect } from 'react';
import { api, msg } from '../../../services';
import { FormModal, ListView, SystemButton } from '../../../components';

const AccountGroups = () => {
  // Module name
  const moduleName = 'Account Groups';

  /* --- State declarationss --- */

  const [entities, setEntities] = useState([]);

  const [newData, setNewData] = useState({
    user_id: 1,
    branch_id: 0,
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
  const dataColumns = [{ title: 'Description', name: 'des' }];
  let dataRows = [];

  /* --- End of state declarations --- */

  useEffect(() => {
    fetchData();
  }, []);

  /* --- Component functions --- */

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const response = await api.get('account-groups');
      if (typeof response.error !== 'undefined') {
        msg.error(response.error.err);
        return;
      } else {
        response.data.map((entity) => {
          dataRows.push({
            des: entity.des,
          });
        });
        // console.log(response.data);

        setEntities(dataRows);

        setEntities(response.data);
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
        `account-groups/search/${searchPhrase}/${selectedColumn}`,
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
    setShowModalState(true);

    setNewData({
      ...newData,
      des: dataObj.des,
    });

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
    });
  };

  const save = async () => {
    if (isEdit === false) {
      try {
        const response = await api.post('account-groups').values(newData);
        console.log(response);
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
          .update(`account-groups/${selectedId}/update`)
          .values(newData);
        //console.log(response,newData);
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
            <label htmlFor="des">Description</label>
            <input
              type="text"
              name="des"
              id="des"
              className="form-control form-control-sm"
              value={newData.des}
              onChange={handleValueChange}
            />
          </div>
          <div className="modal-footer">
            <SystemButton type={'close'} method={toggleFormModal} />
            <SystemButton type={'save'} />
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

export default AccountGroups;
