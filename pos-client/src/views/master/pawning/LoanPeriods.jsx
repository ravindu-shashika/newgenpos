import React, { useState, useEffect } from 'react';
import { api, msg, cookie } from '../../../services';
import { FormModal, ListView, SystemButton } from '../../../components';

const LoanPeriods = () => {
  // Module name
  const moduleName = 'Loan Periods';

  /* --- State declarationss --- */

  const [entities, setEntities] = useState([]);

  const [newData, setNewData] = useState({
    months: '',
    des: '',
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
    { title: 'Description', name: 'des', searchable: true },
    {
      title: 'Duration (months)',
      name: 'months',
      class: 'text-center',
      searchable: true,
    },
  ];

  let dataRows = [];

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
    dataRows = [];
    try {
      setIsLoading(true);

      const response = await api.get('loan-periods');
      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err[0]);
        });
        return;
      }
      response.data.map((row) => {
        if (row.id !== 0) {
          dataRows.push({
            id: row.id,
            des: row.des,
            months: row.months,
          });
        }
      });

      setEntities(dataRows);
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
        `loan-periods/search/${searchPhrase}/${selectedColumn}`,
      );

      if (response.data.length === 0) {
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
      months: dataObj.months,
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
      months: '',
      des: '',
      user_id: cookie.get('user_id'),
    });

    fetchData();
  };

  const save = async () => {
    if (isEdit === false) {
      try {
        const response = await api.post('loan-periods').values(newData);

        if (response.error) {
          Object.values(response.error).forEach((err) => {
            msg.error(err[0]);
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
          .update(`loan-periods/${selectedId}/update`)
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

  const resetForm = () => {
    setNewData({
      months: '',
      des: '',
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
            btnText="Add new period"
          />
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
              <div className="form-group col-3">
                <label htmlFor="months">Duration (months)</label>
                <input
                  type="number"
                  step="1"
                  name="months"
                  id="months"
                  className="form-control form-control-sm"
                  value={newData.months}
                  onChange={handleValueChange}
                />
              </div>
              <div className="form-group col-9">
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
        actionsColumn={true}
        showEditButton={true}
        showDeleteButton={false}
        resetSearch={resetSearch}
      />
      {/* End of list view component */}
    </div>
  );

  /* --- End of component renders --- */
};

export default LoanPeriods;
