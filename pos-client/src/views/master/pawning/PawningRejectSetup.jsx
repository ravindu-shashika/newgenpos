import React, { useState, useEffect } from 'react';
import { api, msg, cookie } from '../../../services';
import { FormModal, ListView, SystemButton } from '../../../components';
import moment from 'moment';

const PawningRejectSetup = () => {
  //Module name
  const moduleName = 'Pawning Reject Setup';

  // Data states
  const [entities, setEntities] = useState([]);

  const [newData, setNewData] = useState({
    id: '',
    description: '',
    ddate : cookie.get('new_date')
      ? cookie.get('new_date')
      : moment().format(`YYYY-MM-DD`),
    user_id: cookie.get('user_id'),
  });

  // Data loading status
  const [isLoading, setIsLoading] = useState(false);

  // Form modal state
  const [showModalState, setShowModalState] = useState(false);

  // Selected data
  const [selectedId, setSelectedId] = useState('');

  // Data edit state
  const [isEdit, setIsEdit] = useState(false);

  // List view states
  let dataColumns = [
    {
      title: 'Description',
      name: 'description',
      class: 'text-center',
      searchable: true,
    },
  ];
  let dataRows = [];

  /* --- End of state declarations --- */
  useEffect(() => {
    fetchData();
  }, []);

  /* --- Component functions --- */

  const fetchData = async () => {
    dataRows = [];

    try {
      setIsLoading(true);
      const response = await api.get('save-reject-pawning-setup');

      console.log(response.data);

      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err[0]);
        });
        return;
      } else {
        response.data.map((entity) => {
          dataRows.push({
            id: entity.id,
            description: entity.description,
          });
        });
      }

      setIsLoading(false);
      setEntities(dataRows);
    } catch (error) {
      return console.log(error);
    }
  };

  const searchAndFetch = async (searchPhrase, selectedColumn) => {
    dataRows = [];

    try {
      setIsLoading(true);
      const response = await api.get(
        `docFees/search/${searchPhrase}/${selectedColumn}`,
      );

      console.log(response.data);

      if (!response.data) {
        msg.error(`Your search didn't return any results!`);
        setIsLoading(false);
        return;
      } else {
        response.data.data.map((entity) => {
          dataRows.push({
            id: entity.id,
            name: entity.name,
            category_id: entity.category_id,
            category: entity.category.description,
          });
        });
        setIsLoading(false);
        setEntities(dataRows);
      }
    } catch (error) {
      return console.log(error);
    }
  };

  const toggleFormModal = () => {
    setShowModalState(!showModalState);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    await submitData();

    resetForm();

    fetchData();

    setShowModalState(false);
  };

  const editRow = (dataObj) => {
    console.log(dataObj)
    setNewData({
      description: dataObj.description,
      user_id: cookie.get('user_id'),
    });

    setSelectedId(dataObj.id);
    setIsEdit(true);
    setShowModalState(true);
  };

  // const deleteRow = async (id) => {
  //   try {
  //     const response = await api.delete(`items/${id}`);

  //     msg.success(response.data);
  //   } catch (error) {
  //     return console.log(error);
  //   } finally {
  //     fetchData();
  //   }
  // };

  const handleValueChange = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue = targetInput.value;

    setNewData({
      ...newData,
      [inputName]: inputValue,
    });
  };

  const submitData = async () => {
    if (isEdit === false) {
        try {
            const response = await api
              .post(`save-reject-pawning-setup`)
              .values(newData);
      
            if (response.error) {
              Object.values(response.error).forEach((err) => {
                msg.error(err[0]);
              });
              return;
            } else {
              msg.success(response.data);
            }
          } catch (error) {
            console.error(error);
          }
    }else{
        try {
            const response = await api
              .update(`reject-pawning-setup/${selectedId}/update`)
              .values(newData);
      
            if (response.error) {
              Object.values(response.error).forEach((err) => {
                msg.error(err[0]);
              });
              return;
            } else {
              msg.success(response.data);
            }
          } catch (error) {
            console.error(error);
          }
    }
  };

  const resetForm = () => {
    setNewData({
      id: '',
      description: '',
      user_id: cookie.get('user_id'),
    });
    setSelectedId('');
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
            btnText="Add Reject Options"
          />
        </div>
      </div>

      {/* Modal componenet */}
      <FormModal
        moduleName={moduleName}
        modalState={showModalState}
        toggleFormModal={toggleFormModal}
      >
        <form onSubmit={handleSubmit} className="compactForm">
          <div className="modal-body">
            <div className="row">
              <div className="col-sm-6 form-group">
              <label htmlFor="description">Description</label>
                <input
                  type="text"
                  name="description"
                  id="description"
                  className="form-control"
                  value={newData.description}
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
      {/* End of modal componenet */}

      <br />
      <br /> 

      {/* List view componenet */}
      <ListView
        columns={dataColumns}
        rows={entities}
        edit={editRow}
        loadingState={isLoading}
        searchAndFetch={searchAndFetch}
        resetSearch={fetchData}
        actionsColumn
        showEditButton
        showDeleteButton={false}
      />
      {/* End of list view component */}
    </div>
  );
};

export default PawningRejectSetup;
