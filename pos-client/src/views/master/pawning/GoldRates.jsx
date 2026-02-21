import React, { useState, useEffect } from 'react';
import { api, cookie, msg } from '../../../services';
import { FormModal, ListView, SystemButton } from '../../../components';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import { MultiSelect } from 'react-multi-select-component';
import styles from './GoldRates.module.css';

const GoldRates = () => {
  // Module name
  const moduleName = 'Gold Rates';

  /* --- State declarationss --- */

  const [entities, setEntities] = useState([]);

  const [goldTypes, setGoldTypes] = useState([]);

  const [pawningPeriods, setPawningPeriods] = useState([]);

  const [newData, setNewData] = useState({
    des: '',
    is_active: true,
    user_id: cookie.get('user_id'),
  });

  const [ratesList, setRatesList] = useState([
    {
      index: uuidv4(),
      gold_type_id: '',
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
    { title: 'Description', name: 'des', searchable: true },
    { title: 'Gold Type Category', name: 'category', class: 'text-center' },
    {
      title: 'Rate (LKR)',
      name: 'rate',
      class: 'text-right',
      searchable: true,
    },
    { title: 'State', name: 'state', class: 'text-center' },
    { title: 'User', name: 'user', searchable: true },
    {
      title: 'Created At',
      name: 'created_at',
      class: 'text-center',
      searchable: true,
    },
  ];

  let dataRows = [];
  let pawnPeriodsArr = [];
  let goldTypesArr = [];

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
      pawnPeriodsArr = [];
      goldTypesArr = [];
      dataRows = [];
      setIsLoading(true);

      const response = await api.get('gold-rates');

      console.log(response.data);

      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err[0]);
        });
        return;
      }

      response.data.rates.data.map((rate) => {
        if (rate.id !== 0) {
          dataRows.push({
            id: rate.id,
            des: rate.des,
            category: rate.gold_types.category,
            rate: rate.rate,
            state: rate.is_active ? 'Active' : 'Inactive',
            user: rate.user.name,
            created_at: moment(rate.created_at).format('YYYY-MM-DD | h:mm A'),
            template_id: rate.template_id,
            gold_type_id: rate.gold_types.id,
            user_id: rate.user_id,
            is_active: rate.is_active,
          });
        }
      });

      setEntities(dataRows);

      response.data.gold_types.map((typeRow) => {
        goldTypesArr.push(typeRow);
      });

      setGoldTypes(goldTypesArr);
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
        `gold-rates/search/${searchPhrase}/${selectedColumn}`,
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
            gold_type_id: row.gold_type_id,
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
        const response = await api.post('gold-rates').values({
          gold_rate: newData,
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
          .update(`gold-rates/${selectedId}/update`)
          .values({
            gold_rate: newData,
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
        gold_type_id: '',
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
    setGoldTypes([]);
    setNewData({
      des: '',
      is_active: true,
      user_id: cookie.get('user_id'),
    });
    setRatesList([
      {
        index: uuidv4(),
        gold_type_id: '',
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
        gold_type_id: '',
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
        <div>
          <div className="d-flex justify-content-center">
            <div className="spinner-border text-secondary" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="row">
            <div className="col-sm-2">
              <SystemButton
                type="add-new"
                method={toggleFormModal}
                showText
                btnText="Add gold rate"
              />
            </div>
          </div>

          {/* Form modal componenet */}
          <FormModal
            moduleName={moduleName}
            modalState={showModalState}
            toggleFormModal={toggleFormModal}
          >
            <form className="compactForm" onSubmit={handleSubmit}>
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
                  {/* <div className="offset-5 col-sm-1">
                    <div className="form-group justify-content-end">
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
                        <label
                          className="custom-control-label"
                          htmlFor="is_active"
                        >
                          {newData.is_active ? `Active` : `Inactive`}
                        </label>
                      </div>
                    </div>
                  </div> */}
                </div>
                <div className="row container">
                  <table className="table table-sm table-bordered">
                    <thead className="thead-light text-center">
                      <tr>
                        <th scope="col">#</th>
                        <th scope="col" className="col-sm-6">
                          Gold Type
                        </th>
                        <th scope="col">Rate</th>
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
                              <select
                                name="gold_type_id"
                                id="gold_type_id"
                                data-id={index}
                                className="form-control"
                                value={ratesList[index].gold_type_id}
                                onChange={handleRatesChange}
                              >
                                <option
                                  value=""
                                  className="text-muted"
                                  disabled
                                >
                                  -- Select gold type
                                </option>
                                {goldTypes.map((type, index) => {
                                  return (
                                    <option key={index} value={type.id}>
                                      {type.category}
                                    </option>
                                  );
                                })}
                              </select>
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

export default GoldRates;
