import React, { useState, useEffect } from 'react';
import { api, msg, cookie } from '../../../services';
import { FormModal, ListView, SystemButton } from '../../../components';

const DocumentFees = () => {
  //Module name
  const moduleName = 'Document Fees';

  // Data states
  const [entities, setEntities] = useState([]);

  const [newData, setNewData] = useState({
    id: '',
    letter_no: '',
    amount: 0,
    user_id: cookie.get('user_id'),
  });

  // Data loading status
  const [isLoading, setIsLoading] = useState(false);

  // Form modal state
  const [showModalState, setShowModalState] = useState(false);

  // Selected data
  const [selectedId, setSelectedId] = useState('');

  // List view states
  let dataColumns = [
    {
      title: 'Letter No',
      name: 'letter_no',
      class: 'text-center',
      searchable: true,
    },
    { title: 'Amount', name: 'amount', class: 'text-center', searchable: true },
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
      const response = await api.get('showAllDocFees');

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
            letter_no: entity.letter_no,
            amount: entity.amount,
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
    setNewData({
      id: dataObj.id,
      letter_no: dataObj.letter_no,
      amount: dataObj.amount,
      user_id: cookie.get('user_id'),
    });

    setSelectedId(dataObj.id);

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
    try {
      const response = await api
        .put(`updateDocFee`, selectedId)
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
  };

  const resetForm = () => {
    setNewData({
      id: '',
      letter_no: '',
      amount: 0,
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
                <label htmlFor="letter_no">Letter No</label>

                <select
                  type="text"
                  name="letter_no"
                  id="letter_no"
                  placeholder="Letter No"
                  className="form-control"
                  value={newData.letter_no}
                  onChange={handleValueChange}
                >
                  <option value="">-- Select Letter No</option>
                  <option value="1">1st Letter</option>
                  <option value="2">2nd Letter</option>
                  <option value="3">3rd Letter</option>
                </select>
              </div>
              <div className="col-sm-6 form-group">
                <label htmlFor="amount">Amount (LKR)</label>
                <input
                  name="amount"
                  id="amount"
                  className="form-control text-right"
                  value={newData.amount}
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

export default DocumentFees;
