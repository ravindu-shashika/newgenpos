import React, { useState, useEffect } from 'react';
import { api, msg, cookie } from '../../../services';
import { FormModal, ListView, SystemButton } from '../../../components';
import moment from 'moment';

const Stone = () => {
  // Module name
  const moduleName = 'Stone';

  /* --- State declarationss --- */

  const [entities, setEntities] = useState([]);

  const [newData, setNewData] = useState({
    code: '',
    description: '',
    ddate: moment(),
    oc: cookie.get('user_id'),
    action_date: moment(),
  });

  // Form modal state
  const [showModalState, setShowModalState] = useState(false);

  // Data edit state
  const [isEdit, setIsEdit] = useState(false);

  // Data loading status
  const [isLoading, setIsLoading] = useState(false);

  // Selected data
  const [selectedId, setSelectedId] = useState('');

  // List view states
  const dataColumns = [
    { title: 'Date', name: 'ddate', searchable: true },
    { title: 'Description', name: 'description', searchable: true },
  ];
  let dataRows = [];

  /* --- End of state declarations --- */

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // if (showModalState === false) {
    //   resetForm();
    // }
  }, [showModalState]);

  /* --- Component functions --- */

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const response = await api.get('add-stone');

      console.log(response.data.entities);

      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err[0]);
        });
        return;
      }

      response.data.entities.map((entity) => {
        dataRows.push({
          id: entity.id,
          ddate: moment(entity.ddate).format('YYYY-MM-DD'),
          description: entity.description,
        });
      });

      setNewData({
        ...newData,
        // code: response.data.new_id,
        // new_id: response.data.new_id,
        ddate: moment().format('YYYY-MM-DD'),
      });

      setEntities(dataRows);
    } catch (error) {
      console.log(error);
      msg.error('Unable to fetch data!');
    } finally {
      setIsLoading(false);
    }
  };

  const searchAndFetch = async (searchPhrase, selectedColumn) => {
    try {
      setIsLoading(true);

      const response = await api.get(
        `vendors/search/${searchPhrase}/${selectedColumn}`,
      );

      dataRows = [];

      console.log(response);

      if (response.data.total === 0) {
        msg.warning(`No results returned your search!`);
      } else {
        response.data.data.map((entity) => {
          return dataRows.push({
            code: entity.code,
            name: entity.name,
            nic: entity.nic,
            description: entity.description,
            oc: entity.oc,
            action_date: entity.action_date,
            is_cash_customer: entity.is_cash_customer,
            address: entity.address,
            tp: entity.tp,
            mobile: entity.mobile,
            fax: entity.fax,
            e_mail: entity.e_mail,
            inactive: entity.inactive,
            account_id: entity.account_id,
            cash_customer_status: entity.is_cash_customer
              ? 'Cash Customer'
              : 'Not Cash Customer',
            active_status: entity.inactive ? 'Inactive' : 'Active',
          });
        });

        setEntities(dataRows);
      }
    } catch (error) {
      msg.error(`Unable to search data! --> ${error}`);
      return console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleValueChange = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    // const inputValue = targetInput.value;
    const inputValue =
      targetInput.type === 'checkbox' ? targetInput.checked : targetInput.value;

    setNewData({
      ...newData,
      [inputName]: inputValue,
    });
  };

  const editRow = (dataObj) => {
    console.log(dataObj);
    setShowModalState(true);
    setNewData({
      ddate: dataObj.ddate,
      description: dataObj.description,
    });

    setIsEdit(true);
    setSelectedId(dataObj.id);
  };

  const toggleFormModal = () => {
    setShowModalState(!showModalState);
  };

  const handleSubmit = async () => {
    await save();

    resetForm();

    fetchData();
  };

  const save = async () => {
    if (isEdit === false) {
      try {
        const response = await api.post('add-stone').values(newData);

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
          .update(`add-stone/${selectedId}/update`)
          .values(newData);

        if (response.error) {
          Object.values(response.error).forEach((err) => {
            msg.error(err[0]);
          });
          return;
        }

        msg.success(response.data);
      } catch (error) {
        msg.error(error);
        return console.error(error);
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
      description: '',
      ddate: moment().format('YYYY-MM-DD'),
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
            btnText="Add Stone"
          />
        </div>
      </div>

      {/* End of form modal componenet */}
      <FormModal
        moduleName={moduleName}
        modalState={showModalState}
        toggleFormModal={toggleFormModal}
        width="50%"
      >
        {/* <form onSubmit={handleSubmit} className="compactForm">
        </form> */}
        <div>
          <div className="modal-body">
            <div className="row">
              <label htmlFor="code" className="col-sm-2 col-form-label">
                Date
              </label>
              <div className="col-sm-4">
                <input
                  type="date"
                  name="ddate"
                  id="ddate"
                  maxLength="20"
                  minLength="10"
                  className="form-control form-control-sm text-right"
                  value={newData.ddate}
                  onChange={handleValueChange}
                  readOnly
                />
              </div>
            </div>

            <div className="row">
              <label htmlFor="code" className="col-sm-2 col-form-label">
                Description
              </label>
              <div className="col-sm-4">
                <input
                  type="Text"
                  name="description"
                  id="description"
                  maxLength="20"
                  minLength="10"
                  className="form-control form-control-sm"
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
            <SystemButton
              type="no-form-save"
              method={handleSubmit}
              showText={true}
            />
          </div>
        </div>
      </FormModal>
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
        resetSearch={resetSearch}
        rowKey="code"
      />
      {/* End of list view component */}
    </div>
  );

  /* --- End of component renders --- */
};

export default Stone;
