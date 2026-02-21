import React, { useState, useEffect } from 'react';
import { api, msg, cookie } from '../../../services';
import { FormModal, ListView, SystemButton } from '../../../components';

const ReminderLetterPeriods = () => {
  //Module name
  const moduleName = 'Remind Letter Periods';

  // Data states
  const [entities, setEntities] = useState([]);

  const [branches, setBranches] = useState([]);
  const [billTypes, setBillTypes] = useState([]);

  const [newData, setNewData] = useState({
    id: '',
    bill_type_id: '',
    branch_id: '',
    first_letter: '',
    second_letter: '',
    third_letter: '',
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
  let dataColumns = [
    { title: 'Branch ID', name: 'branch_id', class: 'text-center' },
    {
      title: 'Branch Name',
      name: 'branch_name',
      class: 'text-center',
      searchable: true,
    },
    {
      title: 'Bill Type',
      name: 'bill_type_des',
      class: 'text-center',
      searchable: true,
    },
    {
      title: 'First Letter',
      name: 'first_letter',
      class: 'text-center',
      searchable: true,
    },
    {
      title: 'Second Letter',
      name: 'second_letter',
      class: 'text-center',
      searchable: true,
    },
    {
      title: 'Third Letter',
      name: 'third_letter',
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
      const response = await api.get('showAllRemindLetterPeriod');

      console.log(response.data);

      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err[0]);
        });
        return;
      } else {
        response.data.letterPeriod.map((entity) => {
          dataRows.push({
            id: entity.id,
            bill_type_id: entity.bill_type_id,
            bill_type_des: response.data.billTypes.map((billType) => {
              if (billType.id === entity.bill_type_id) {
                return billType.des;
              }
            }),
            branch_id: entity.branch_id,
            branch_name: response.data.branches.map((branch) => {
              if (branch.id === entity.branch_id) {
                return branch.name;
              }
            }),
            first_letter: entity.first_letter,
            second_letter: entity.second_letter,
            third_letter: entity.third_letter,
          });
        });
      }
      setBillTypes(response.data.billTypes);
      setBranches(response.data.branches);
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
        `remindLetterPeriod/search/${searchPhrase}/${selectedColumn}`,
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
    setNewData({
      id: dataObj.id,
      bill_type_id: dataObj.bill_type_id,
      branch_id: dataObj.branch_id,
      first_letter: dataObj.first_letter,
      second_letter: dataObj.second_letter,
      third_letter: dataObj.third_letter,
      user_id: cookie.get('user_id'),
    });

    setShowModalState(true);
    setIsEdit(true);
    setSelectedId(dataObj.id);
  };

  const deleteRow = async (id) => {
    try {
      const response = await api.delete(`items/${id}`);

      msg.success(response.data);
    } catch (error) {
      return console.log(error);
    } finally {
      fetchData();
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

  const submitData = async () => {
    if (isEdit === false) {
      try {
        const response = await api
          .post('saveRemindLetterPeriod')
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
    } else {
      try {
        const response = await api
          .put(`updateRemindLetterPeriod`, newData.id)
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
      } finally {
        setIsEdit(false);
        setSelectedId('');
      }
    }
  };

  const resetForm = () => {
    setNewData({
      id: '',
      bill_type_id: '',
      branch_id: '',
      first_letter: '',
      second_letter: '',
      third_letter: '',
      user_id: cookie.get('user_id'),
    });
    setIsEdit(false);
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
            btnText="Add item"
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
                <label htmlFor="bill_type_id">Bill Type</label>

                <select
                  type="text"
                  name="bill_type_id"
                  id="bill_type_id"
                  placeholder="Enter item name"
                  className="form-control"
                  value={newData.bill_type_id}
                  onChange={handleValueChange}
                >
                  <option value="">-- Select Bill Type</option>
                  {billTypes.map((billType, index) => {
                    return (
                      <option key={billType.id} value={billType.id}>
                        {billType.des}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="col-sm-6 form-group">
                <label htmlFor="barnch_id">branch</label>
                <select
                  name="branch_id"
                  id="branch_id"
                  className="form-control"
                  value={newData.branch_id}
                  onChange={handleValueChange}
                >
                  <option value="">-- Select Branch</option>
                  {branches.map((branch, index) => {
                    return (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
            <div className="row">
              <div className="col-sm-6 form-group">
                <label htmlFor="first_letter">First Letter</label>
                <input
                  className="form-control"
                  type="text"
                  name="first_letter"
                  id="first_letter"
                  value={newData.first_letter}
                  onChange={handleValueChange}
                />
              </div>
              <div className="col-sm-6 form-group">
                <label htmlFor="second_letter">Second Letter</label>
                <input
                  className="form-control"
                  type="text"
                  name="second_letter"
                  id="second_letter"
                  value={newData.second_letter}
                  onChange={handleValueChange}
                />
              </div>

              <div className="col-sm-6 form-group">
                <label htmlFor="third_letter">Third Letter</label>
                <input
                  className="form-control"
                  type="text"
                  name="third_letter"
                  id="third_letter"
                  value={newData.third_letter}
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
        actionsColumn
        showEditButton
        showDeleteButton={false}
      />
      {/* End of list view component */}
    </div>
  );
};

export default ReminderLetterPeriods;
