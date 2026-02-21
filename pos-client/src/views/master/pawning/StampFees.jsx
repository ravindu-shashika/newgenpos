import React, { useState, useEffect } from 'react';
import { api, msg, cookie } from '../../../services';
import { FormModal, ListView, SystemButton } from '../../../components';

const StampFees = () => {
  // Module name
  const moduleName = 'Stamp Fees';

  /* --- State declarationss --- */

  const [entities, setEntities] = useState([]);

  const [newData, setNewData] = useState({
    is_active: 1,
    from_value: 0.0,
    to_value: 0.0,
    stamp_fee: 0.0,
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
    {
      title: 'From Value',
      name: 'from_value',
      class: 'text-right',
      searchable: true,
    },
    {
      title: 'To Value',
      name: 'to_value',
      class: 'text-right',
      searchable: true,
    },
    {
      title: 'Stamp Fee',
      name: 'stamp_fee',
      class: 'text-right',
      searchable: true,
    },
    {
      title: 'State',
      name: 'active_status',
      class: 'text-center',
      searchable: false,
    },
  ];
  const dataRows = [];

  /* --- End of state declarations --- */

  useEffect(() => {
    fetchData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const response = await api.get('stamp-fees');
      if (typeof response.error !== 'undefined') {
        msg.error(response.error.err);
        return;
      } else {
        response.data.data.map((entity) => {
          return dataRows.push({
            id: entity.id,
            active_status: entity.is_active ? `Active` : `Inactive`,
            is_active: entity.is_active,
            from_value: parseFloat(entity.from_value).toFixed(2),
            to_value: parseFloat(entity.to_value).toFixed(2),
            stamp_fee: parseFloat(entity.stamp_fee).toFixed(2),
          });
        });

        setIsLoading(false);
        setEntities(dataRows);
      }
    } catch (error) {
      msg.error('Unable to fetch data!');
      return console.log(error);
    }
  };

  const searchAndFetch = async (searchPhrase, selectedColumn) => {
    try {
      setIsLoading(true);

      const response = await api.get(`items/${searchPhrase}/${selectedColumn}`);

      if (response.data.total === 0) {
        msg.warning(`No results returned your search!`);
      } else {
        response.data.data.map((entity) => {
          dataRows.push({
            id: entity.id,
            active_status: entity.is_active ? `Active` : `Inactive`,
            is_active: entity.is_active,
            from_value: parseFloat(entity.from_value).toFixed(2),
            to_value: parseFloat(entity.to_value).toFixed(2),
            stamp_fee: parseFloat(entity.stamp_fee).toFixed(2),
          });
        });
      }
      setEntities(response.data.data);
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
    const inputValue =
      targetInput.type === 'checkbox' ? targetInput.checked : targetInput.value;

    setNewData({
      ...newData,
      [inputName]: inputValue,
    });
  };

  const editRow = (dataObj) => {
    console.log(dataObj);

    setNewData({
      ...newData,
      is_active: dataObj.is_active,
      from_value: dataObj.from_value,
      to_value: dataObj.to_value,
      stamp_fee: dataObj.stamp_fee,
    });

    setShowModalState(true);
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
      is_active: 1,
      from_value: 0.0,
      to_value: 0.0,
      stamp_fee: 0.0,
      user_id: cookie.get('user_id'),
    });

    fetchData();
  };

  const save = async () => {
    if (isEdit === false) {
      try {
        const response = await api.post('stamp-fees').values(newData);

        if (response.error) {
          Object.values(response.error).forEach((err) => {
            msg.error(err);
          });
          return;
        }

        msg.success(response.data);
      } catch (error) {
        return console.log(error);
      } finally {
        setShowModalState(false);
      }
    } else {
      try {
        const response = await api
          .update(`stamp-fees/${selectedId}/update`)
          .values(newData);

        if (response.error) {
          Object.values(response.error).forEach((err) => {
            msg.error(err);
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

  const resetForm = () => {
    setNewData({
      is_active: 1,
      from_value: 0.0,
      to_value: 0.0,
      stamp_fee: 0.0,
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
            btnText="Add stamp fee"
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
            <div className="form-group">
              <div className="row">
                <div className="offset-10 col-sm-2">
                  <div className="custom-control custom-switch">
                    <input
                      type="checkbox"
                      className={
                        newData.is_active
                          ? `custom-control-input is-valid`
                          : `custom-control-input is-invalid`
                      }
                      id="is_active"
                      name="is_active"
                      checked={newData.is_active}
                      onChange={handleValueChange}
                    />
                    <label className="custom-control-label" htmlFor="is_active">
                      {newData.is_active ? `Active` : `Inactive`}
                    </label>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-sm-4">
                  <label htmlFor="from_value">From Value</label>
                  <input
                    type="number"
                    step="0.01"
                    name="from_value"
                    id="from_value"
                    className="form-control input-sm text-right"
                    value={newData.from_value}
                    onChange={handleValueChange}
                    required
                  />
                </div>
                <div className="col-sm-4">
                  <label htmlFor="to_valuee">To Value</label>
                  <input
                    type="number"
                    step="0.01"
                    name="to_value"
                    id="to_value"
                    className="form-control input-sm text-right"
                    value={newData.to_value}
                    onChange={handleValueChange}
                    required
                  />
                </div>
                <div className="col-sm-4">
                  <label htmlFor="stamp_fee">Stamp Fee</label>
                  <input
                    type="number"
                    name="stamp_fee"
                    step="0.01"
                    id="stamp_fee"
                    className="form-control input-sm text-right"
                    value={newData.stamp_fee}
                    onChange={handleValueChange}
                    required
                  />
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

export default StampFees;
