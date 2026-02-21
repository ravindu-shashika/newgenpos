import React, { useState, useEffect } from 'react';
import { api, msg, cookie } from '../../../services';
import { FormModal, ListView, SystemButton } from '../../../components';

const Design = () => {
  // Module name
  const moduleName = 'Jewellery Design';

  /* --- State declarationss --- */

  const [entities, setEntities] = useState([]);

  const [newData, setNewData] = useState({
    id: '',
    designname: '',
    user_id: cookie.get('user_id'),
    bc_no: cookie.get('user_branch'),
    new_id: '',
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
    { title: 'Code', name: 'id', searchable: true },
    { title: 'Design', name: 'designname', searchable: true },
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

      const response = await api.get('designs');
      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err[0]);
        });
        return;
      }

      setEntities(response.data.entities.data);
      setNewData({
        ...newData,
        id: response.data.new_id,
        new_id: response.data.new_id,
      });
      setIsLoading(false);
    } catch (error) {
      msg.error('Unable to fetch data!');
      return console.log(error);
    }
  };

  const searchAndFetch = async (searchPhrase, selectedColumn) => {
    try {
      setIsLoading(true);

      const response = await api.get(
        `designs/search/${searchPhrase}/${selectedColumn}`,
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
    let inputValue =
      targetInput.type === 'checkbox' ? targetInput.checked : targetInput.value;

    if (inputName == 'design') {
      inputValue = inputValue.toUpperCase();
    }
    setNewData({
      ...newData,
      [inputName]: inputValue,
    });
  };

  const editRow = (dataObj) => {
    setShowModalState(true);

    setNewData({
      ...newData,
      id: dataObj.id,
      design: dataObj.design,
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
      design: '',
    });

    fetchData();
  };

  const save = async () => {
    if (isEdit === false) {
      try {
        const response = await api.post('designs').values(newData);

        if (response.error) {
          Object.values(response.error).forEach((err) => {
            msg.error(err[0]);
          });
          return;
        }
        resetForm();
        msg.success(response.data);
      } catch (error) {
        return console.log(error);
      } finally {
        setShowModalState(false);
      }
    } else {
      try {
        const response = await api
          .update(`designs/${selectedId}/update`)
          .values(newData);

        if (response.error) {
          Object.values(response.error).forEach((err) => {
            msg.error(err[0]);
          });
          return;
        }

        resetForm();
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

  const resetForm = () => {
    setNewData({
      ...newData,
      id: newData.new_id,
      design: '',
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
            btnText="Add new Design"
          />
        </div>
      </div>

      {/* Form modal componenet */}
      <FormModal
        moduleName={moduleName}
        modalState={showModalState}
        toggleFormModal={toggleFormModal}
        width="50%"
      >
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="row">
              <label htmlFor="id" className="col-sm-2 col-form-label">
                Code
              </label>
              <div className="col-sm-4">
                <input
                  type="number"
                  name="id"
                  id="id"
                  className="form-control form-control-sm"
                  max="9999"
                  required
                  value={newData.id}
                  onChange={handleValueChange}
                />
              </div>
            </div>
            <div className="row">
              <label htmlFor="designname" className="col-sm-2 col-form-label">
                Design
              </label>
              <div className="col-sm-10">
                <input
                  type="text"
                  name="designname"
                  id="designname"
                  className="form-control form-control-sm"
                  placeholder="Jewellery Design"
                  autoComplete="no"
                  maxLength="50"
                  required
                  value={newData.designname}
                  onChange={handleValueChange}
                />
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

export default Design;
