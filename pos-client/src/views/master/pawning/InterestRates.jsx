import React, { useState, useEffect } from 'react';
import { api, msg, cookie } from '../../../services';
import { FormModal, ListView, SystemButton } from '../../../components';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import { MultiSelect } from 'react-multi-select-component';
import styles from './InterestRates.module.css';

const InterestRates = () => {
  // Module name
  const moduleName = 'Interest Rates';

  /* --- State declarationss --- */

  const [entities, setEntities] = useState([]);

  const [newData, setNewData] = useState({
    des: '',
    is_active: 1,
    user_id: cookie.get('user_id'),
  });

  const [interestRateList, setInterestRateList] = useState([
    {
      index: uuidv4(),
      from_amount: '',
      to_amount: '',
      fm_interest_rate: 0.0,
      nm_interest_rate: 0.0,
      discount_days: 0,
      discount_rate: 0.0,
      grace_period: 0,
      grace_rate: 0.0,
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
    {
      title: 'From Amount (LKR)',
      name: 'from_amount',
      class: 'text-right text-wrap',
      searchable: true,
    },
    {
      title: 'To Amount (LKR)',
      name: 'to_amount',
      class: 'text-right text-wrap',
      searchable: true,
    },
    {
      title: 'First Month Interest (%)',
      name: 'fm_interest_rate',
      class: 'text-right text-wrap',
      searchable: true,
    },
    {
      title: 'Interest After Second Month (%)',
      name: 'nm_interest_rate',
      class: 'text-right text-wrap',
      searchable: true,
    },
    {
      title: 'Discount Period (Days)',
      name: 'discount_days',
      class: 'text-center text-wrap',
      searchable: true,
    },
    {
      title: 'Discount Rate (%)',
      name: 'discount_rate',
      class: 'text-right',
      searchable: true,
    },
    {
      title: 'State',
      name: 'state',
      class: 'text-center',
    },
    {
      title: 'User',
      name: 'user',
      searchable: true,
    },
    {
      title: 'Created At',
      name: 'created_at',
      class: 'text-center text-wrap',
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
      setIsLoading(true);

      const response = await api.get('interest-rates');

      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err[0]);
        });
        return;
      }

      response.data.rates.data.map((entity) => {
        if (entity.id !== 0) {
          dataRows.push({
            id: entity.id,
            des: entity.des,
            from_amount: parseFloat(entity.from_amount).toFixed(2),
            to_amount: parseFloat(entity.to_amount).toFixed(2),
            fm_interest_rate: parseFloat(entity.fm_interest_rate).toFixed(2),
            nm_interest_rate: parseFloat(entity.nm_interest_rate).toFixed(2),
            discount_days: entity.discount_days,
            discount_rate: parseFloat(entity.discount_rate).toFixed(2),
            is_active: entity.is_active,
            state: entity.is_active ? 'Active' : 'Inactive',
            grace_period: entity.grace_period,
            grace_rate: entity.grace_rate,
            template_id: entity.template_id,
            user: entity.user.name,
            created_at: moment(entity.created_at).format(
              'YYYY-MM-DD | hh:mm A',
            ),
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
        `interest-rates/search/${searchPhrase}/${selectedColumn}`,
      );

      if (response.data.data.length === 0) {
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
    const inputValue = targetInput.value;

    setNewData({
      ...newData,
      [inputName]: inputValue,
    });
  };

  const handleRatesChange = (e) => {
    const targetInput = e.target;
    const datasetId = targetInput.dataset.id;
    const inputName = targetInput.name;
    const ratesDataSet = [...interestRateList];
    const inputValue =
      targetInput.type === 'checkbox' ? targetInput.checked : targetInput.value;

    ratesDataSet[datasetId][inputName] = inputValue;

    setInterestRateList(ratesDataSet);
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
            from_amount: row.from_amount,
            to_amount: row.to_amount,
            fm_interest_rate: row.fm_interest_rate,
            nm_interest_rate: row.nm_interest_rate,
            discount_days: row.discount_days,
            discount_rate: row.discount_rate,
            grace_period: row.grace_period,
            grace_rate: row.grace_rate,
          });
        });

        setInterestRateList(dataArr);
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
        const response = await api.post('interest-rates').values({
          rate: newData,
          amount_rates: interestRateList,
        });

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
      }
    } else {
      try {
        const response = await api
          .update(`interest-rates/${selectedId}/update`)
          .values({
            rate: newData,
            amount_rates: interestRateList,
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
      }
    }
  };

  const addNewRow = () => {
    setInterestRateList([
      ...interestRateList,
      {
        index: uuidv4(),
        from_amount: '',
        to_amount: '',
        fm_interest_rate: 0.0,
        nm_interest_rate: 0.0,
        discount_days: 0,
        discount_rate: 0.0,
        grace_period: 0,
        grace_rate: 0.0,
      },
    ]);
  };

  const removeRow = (i) => {
    // TODO: Create a better dialog box component... Use the FormModal component as a base template
    if (window.confirm('Are you sure you want to remove this row?')) {
      setInterestRateList(interestRateList.filter((row) => row.index !== i));
    }
  };

  const resetAll = () => {
    setNewData({
      des: '',
      is_active: 1,
      user_id: cookie.get('user_id'),
    });

    setInterestRateList([
      {
        index: uuidv4(),
        from_amount: '',
        to_amount: '',
        fm_interest_rate: 0.0,
        nm_interest_rate: 0.0,
        discount_days: 0,
        discount_rate: 0.0,
        grace_period: 0,
        grace_rate: 0.0,
      },
    ]);

    setIsLoading(false);
    setShowModalState(false);
    setIsEdit(false);
    setSelectedId('');
    setEntities([]);
  };

  const resetForm = () => {
    setNewData({
      des: '',
      is_active: 1,
      user_id: cookie.get('user_id'),
    });

    setInterestRateList([
      {
        index: uuidv4(),
        from_amount: '',
        to_amount: '',
        fm_interest_rate: 0.0,
        nm_interest_rate: 0.0,
        discount_days: 0,
        discount_rate: 0.0,
        grace_period: 0,
        grace_rate: 0.0,
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
                btnText="Add new range"
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
                        <th scope="col" colSpan="2" className="col-sm-4">
                          Amount range
                        </th>
                        <th scope="col" className="col-sm-2">
                          First month interest
                        </th>
                        <th scope="col" className="col-sm-2">
                          Interest from next month
                        </th>
                        <th scope="col" className="col-sm-2">
                          Discount period
                        </th>
                        <th scope="col" className="col-sm-2">
                          Discount rate
                        </th>
                        <th scope="col">
                          <SystemButton
                            type={'add-row'}
                            method={() => addNewRow()}
                            showText={false}
                          />
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-center">
                      {interestRateList.map((rate, index) => {
                        return (
                          <tr key={rate.index}>
                            <th scope="row">{parseInt(index) + 1}</th>
                            <td>
                              <input
                                type="number"
                                step="0.01"
                                name="from_amount"
                                id="from_amount"
                                data-id={index}
                                className="form-control form-control-sm text-right"
                                value={interestRateList[index].from_amount}
                                onChange={handleRatesChange}
                                placeholder="From     "
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                step="0.01"
                                name="to_amount"
                                id="to_amount"
                                data-id={index}
                                className="form-control form-control-sm text-right"
                                value={interestRateList[index].to_amount}
                                onChange={handleRatesChange}
                                placeholder="To     "
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                step="0.01"
                                name="fm_interest_rate"
                                id="fm_interest_rate"
                                data-id={index}
                                className="form-control form-control-sm text-right"
                                value={interestRateList[index].fm_interest_rate}
                                onChange={handleRatesChange}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                step="0.01"
                                name="nm_interest_rate"
                                id="nm_interest_rate"
                                data-id={index}
                                className="form-control form-control-sm text-right"
                                value={interestRateList[index].nm_interest_rate}
                                onChange={handleRatesChange}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                step="0.01"
                                name="discount_days"
                                id="discount_days"
                                data-id={index}
                                className="form-control form-control-sm text-right"
                                value={interestRateList[index].discount_days}
                                onChange={handleRatesChange}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                step="0.01"
                                name="discount_rate"
                                id="discount_rate"
                                data-id={index}
                                className="form-control form-control-sm text-right"
                                value={interestRateList[index].discount_rate}
                                onChange={handleRatesChange}
                              />
                            </td>
                            <td>
                              <SystemButton
                                type={'remove-row'}
                                method={() =>
                                  removeRow(interestRateList[index].index)
                                }
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
            actionsColumn={true}
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

export default InterestRates;
