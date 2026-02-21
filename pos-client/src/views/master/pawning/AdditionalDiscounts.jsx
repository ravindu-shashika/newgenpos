import React, { useState, useEffect } from 'react';
import { api, cookie, msg } from '../../../services';
import { FormModal, ListView, Loader, SystemButton } from '../../../components';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';

const AdditionalDiscounts = () => {
  // Module name
  const moduleName = 'Additional Discounts';

  /* --- State declarationss --- */

  const [entities, setEntities] = useState([]);

  const [newData, setNewData] = useState({
    des: '',
    is_active: true,
    user_id: cookie.get('user_id'),
  });

  const [ratesList, setRatesList] = useState([
    {
      index: uuidv4(),
      days: 0,
      rate: 0.0,
    },
  ]);

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
    { title: 'Template ID', name: 'template_id', class: 'text-center' },
    { title: 'Description', name: 'des', searchable: true },
    {
      title: 'Period (Days)',
      name: 'days',
      class: 'text-center',
      searchable: true,
    },
    {
      title: 'Rate (LKR)',
      name: 'rate',
      class: 'text-right',
      searchable: true,
    },
    // { title: 'State', name: 'state', class: 'text-center' },
    { title: 'User', name: 'user', searchable: true },
    {
      title: 'Created At',
      name: 'created_at',
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
    try {
      dataRows = [];
      setIsLoading(true);

      const response = await api.get('additional-discounts');

      console.log(response.data);

      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err[0]);
        });
        return;
      }

      response.data.data.map((discount) => {
        dataRows.push({
          id: discount.id,
          template_id: discount.template_id,
          des: discount.des,
          days: discount.days,
          rate: discount.rate,
          user: discount.user.name,
          created_at: moment(discount.created_at).format('YYYY-MM-DD | h:mm A'),
          user_id: discount.user_id,
        });
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
        `additional-discounts/search/${searchPhrase}/${selectedColumn}`,
      );

      dataRows = [];

      console.log(response);

      if (response.data.total === 0) {
        msg.warning(`No results returned your search!`);
      } else {
        response.data.data.map((entity) => {
          return dataRows.push({
            id: entity.id,
            category: entity.rates.category,
            rate: parseFloat(entity.rate).toFixed(2),
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
    const inputValue =
      targetInput.type === 'checkbox' ? targetInput.checked : targetInput.value;

    setNewData({
      ...newData,
      [inputName]: inputValue,
    });
  };

  const handleRatesChange = (e) => {
    const targetInput = e.target;
    const datasetId = targetInput.dataset.id;
    const inputName = targetInput.name;
    const ratesDataSet = [...ratesList];
    const inputValue =
      targetInput.type === 'checkbox' ? targetInput.checked : targetInput.value;

    ratesDataSet[datasetId][inputName] = inputValue;

    setRatesList(ratesDataSet);
  };

  // const calRowDiscountRate = (e) => {
  //   const targetInput = e.target;
  //   const datasetId = targetInput.dataset.id;
  //   const inputName = targetInput.name;
  //   const ratesDataSet = [...ratesList];
  //   const inputValue =
  //     targetInput.type === 'checkbox' ? targetInput.checked : targetInput.value;

  //   ratesDataSet[datasetId]['rate'] = (
  //     parseFloat(ratesDataSet[datasetId]['fm_interest_rate']) -
  //     parseFloat(inputValue)
  //   ).toFixed(2);

  //   setRatesList(ratesDataSet);
  // };

  const editRow = (dataObj) => {
    let dataArr = [];

    const selectedData = entities.filter((entity) => {
      if (entity.template_id === dataObj.template_id) {
        return entity;
      }
    });

    Promise.all(selectedData)
      .then((res) => {
        setNewData({
          des: res[0].des,
          is_active: res[0].is_active ? true : false,
          user_id: cookie.get('user_id'),
        });

        res.forEach((row) => {
          dataArr.push({
            index: uuidv4(),
            days: row.days,
            rate: row.rate,
          });
        });

        setRatesList(dataArr);
      })
      .then(setShowModalState(true))
      .catch((err) => console.log(err));

    setIsEdit(true);
    setSelectedId(dataObj.template_id);
  };

  const toggleFormModal = () => {
    setShowModalState(!showModalState);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    await save();

    resetAll();

    fetchData();
  };

  const save = async () => {
    if (isEdit === false) {
      try {
        const response = await api.post('additional-discounts').values({
          discount_rates: newData,
          type_rates: ratesList,
        });

        if (response.error) {
          Object.values(response.error).forEach((err) => {
            msg.error(err[0]);
          });
          return;
        }

        msg.success(response.data);
      } catch (error) {
        return console.log(error);
      } finally {
        resetAll();
      }
    } else {
      try {
        const response = await api
          .update(`additional-discounts/${selectedId}/update`)
          .values({
            discount_rates: newData,
            type_rates: ratesList,
          });

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
        resetAll();
      }
    }
  };

  const addNewRow = () => {
    setRatesList([
      ...ratesList,
      {
        index: uuidv4(),
        days: 0,
        rate: 0.0,
      },
    ]);
  };

  const removeRow = (i) => {
    // TODO: Create a better dialog box component... Use the FormModal component as a base template
    if (window.confirm('Are you sure you want to remove this row?')) {
      setRatesList(ratesList.filter((row) => row.index !== i));
    }
  };

  const resetAll = () => {
    dataRows = [];
    setEntities([]);

    setNewData({
      des: '',
      is_active: true,
      user_id: cookie.get('user_id'),
    });

    setRatesList([
      {
        index: uuidv4(),
        days: 0,
        rate: 0.0,
      },
    ]);

    setIsLoading(false);

    setShowModalState(false);

    setIsEdit(false);

    setSelectedId('');
  };

  const resetForm = () => {
    setNewData({
      des: '',
      is_active: true,
      user_id: cookie.get('user_id'),
    });

    setRatesList([
      {
        index: uuidv4(),
        days: 0,
        rate: 0.0,
      },
    ]);

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
      {isLoading ? (
        // <div>
        //   <div className="d-flex justify-content-center">
        //     <div className="spinner-border text-secondary" role="status">
        //       <span className="sr-only">Loading...</span>
        //     </div>
        //   </div>
        // </div>
        <Loader />
      ) : (
        <div>
          <div className="row">
            <div className="col-sm-2">
              <SystemButton
                type="add-new"
                method={toggleFormModal}
                showText
                btnText="Add template"
              />
            </div>
          </div>

          {/* Form modal componenet */}
          <FormModal
            moduleName={moduleName}
            modalState={showModalState}
            toggleFormModal={toggleFormModal}
          >
            <form
              className="compactForm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.preventDefault();
              }}
              onSubmit={handleSubmit}
            >
              <div className="modal-body">
                <div className="row container">
                  <div className="col-sm-6">
                    <div className="form-group row">
                      <label htmlFor="des" className="col-sm-3">
                        Description
                      </label>
                      <div className="col-sm-9">
                        <input
                          type="text"
                          name="des"
                          id="des"
                          className="form-control"
                          value={newData.des}
                          onChange={handleValueChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row container">
                  <table className="table table-sm table-bordered">
                    <thead className="thead-light text-center">
                      <tr>
                        <th scope="col">#</th>
                        <th scope="col" className="col-sm-6">
                          Discount Days
                        </th>
                        <th scope="col">Discount Rate</th>
                        <th scope="col" className="col-sm-1">
                          <SystemButton
                            type={'add-row'}
                            method={() => addNewRow()}
                            showText={false}
                          />
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-center">
                      {ratesList.map((rate, index) => {
                        return (
                          <tr key={rate.index}>
                            <th scope="row">{parseInt(index) + 1}</th>
                            <td>
                              <input
                                type="number"
                                step="0.01"
                                name="days"
                                id="days"
                                min="0.00"
                                data-id={index}
                                className="form-control input-sm text-right"
                                value={ratesList[index].days}
                                onChange={handleRatesChange}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                step="0.01"
                                name="rate"
                                id="rate"
                                min="0.00"
                                data-id={index}
                                className="form-control input-sm text-right"
                                value={ratesList[index].rate}
                                onChange={handleRatesChange}
                              />
                            </td>
                            <td>
                              <SystemButton
                                type={'remove-row'}
                                method={() => removeRow(ratesList[index].index)}
                                showText={false}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <SystemButton
                  type={'close'}
                  method={toggleFormModal}
                  showText={true}
                />
                <SystemButton
                  type={isEdit ? 'update' : 'save'}
                  showText={true}
                />
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
            showEditButton={true}
            showDeleteButton={false}
            resetSearch={resetSearch}
          />
          {/* End of list view component */}
        </div>
      )}
    </div>
  );

  /* --- End of component renders --- */
};

export default AdditionalDiscounts;
