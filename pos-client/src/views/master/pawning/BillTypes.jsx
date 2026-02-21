import React, { useState, useEffect } from 'react';
import { api, cookie, msg } from '../../../services';
import { FormModal, ListView, SystemButton } from '../../../components';
import { MultiSelect } from 'react-multi-select-component';
import moment from 'moment';
import styles from './BillTypes.module.css';

const BillTypes = () => {
  // Module name
  const moduleName = 'Bill Types';

  /* --- State declarationss --- */

  const [entities, setEntities] = useState([]);

  const [newData, setNewData] = useState({
    des: '',
    loan_period_id: '',
    gold_rate_template_id: '',
    int_rate_template_id: '',
    is_active: 1,
    is_hidden: 0,
    is_gem: 0,
    user_id: cookie.get('user_id'),
  });

  const [branches, setBranches] = useState([]);

  const [goldRates, setGoldRates] = useState([]);

  const [pawningPeriods, setPawningPeriods] = useState([]);

  const [interestRates, setInterestRates] = useState([]);

  // Data loading status
  const [isLoading, setIsLoading] = useState(false);

  // Form modal state
  const [showModalState, setShowModalState] = useState(false);

  // Data edit state
  const [isEdit, setIsEdit] = useState(false);

  // Selected branches list
  const [effectiveBranches, setEffectiveBranches] = useState([]);

  // Selected data
  const [selectedId, setSelectedId] = useState('');

  // List view columns
  const dataColumns = [
    { title: 'Name', name: 'des', searchable: true },
    { title: 'Loan Period', name: 'loan_period', class: 'text-wrap' },
    { title: 'Gold Rate Template', name: 'gold_rate', class: 'text-wrap' },
    { title: 'Interest Rate Template', name: 'int_rate', class: 'text-wrap' },
    {
      title: 'State',
      name: 'state',
      class: 'text-center',
    },
    { title: 'User', name: 'user', class: 'text-wrap', searchable: true },
    {
      title: 'Created At',
      name: 'created_at',
      class: 'text-center',
      searchable: true,
    },
  ];

  let branchesArr = [];
  let dataRows = [];
  let pawnPeriodsArr = [];
  let interestRatesArr = [];

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
      branchesArr = [];
      dataRows = [];
      pawnPeriodsArr = [];
      interestRatesArr = [];

      setIsLoading(true);

      const response = await api.get('bill-types');

      console.log(response);
      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err[0]);
        });
        return;
      }

      response.data.branches.map((branchRow) => {
        if (branchRow.id !== 0) {
          branchesArr.push({
            label: branchRow.name,
            value: branchRow.id,
          });
        }
      });

      response.data.bill_types.data.map((billTypeRow) => {
        if (billTypeRow.id !== 0) {
          dataRows.push({
            id: billTypeRow.id,
            des: billTypeRow.des,
            state: billTypeRow.is_active ? 'Active' : 'Inactive',
            user: billTypeRow.user.name,
            loan_period: billTypeRow.period.des,
            gold_rate: billTypeRow.gold_rate[0].des,
            int_rate: billTypeRow.int_rate[0].des,
            is_active: billTypeRow.is_active,
            is_hidden: billTypeRow.is_hidden,
            is_gem: billTypeRow.is_gem,
            user_id: billTypeRow.user_id,
            created_at: moment(billTypeRow.created_at).format(
              'YYYY-MM-DD | hh:mm A',
            ),
          });
        }
      });

      response.data.loan_periods.map((periodRow) => {
        if (periodRow.id !== 0) {
          pawnPeriodsArr.push(periodRow);
        }
      });

      response.data.int_rates.map((intRow) => {
        if (intRow.id !== 0) {
          interestRatesArr.push(intRow);
        }
      });

      setBranches(branchesArr);
      setGoldRates(response.data.gold_rates);
      setPawningPeriods(pawnPeriodsArr);
      setInterestRates(interestRatesArr);
      setEntities(dataRows);

      setIsLoading(false);
    } catch (error) {
      msg.error('Unable to fetch data!');
      return console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function that fetches data on enter key-down in the search field
  const searchAndFetch = async (searchPhrase, selectedColumn) => {
    try {
      setIsLoading(true);

      const response = await api.get(
        `bill-types/search/${searchPhrase}/${selectedColumn}`,
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
    const inputValue =
      targetInput.type === 'checkbox' ? targetInput.checked : targetInput.value;

    setNewData({
      ...newData,
      [inputName]: inputValue,
    });
  };

  const editRow = (dataObj) => {
    setShowModalState(true);

    setNewData({
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
      des: '',
      loan_period_id: '',
      gold_rate_template_id: '',
      int_rate_template_id: '',
      is_active: 1,
      is_hidden: 0,
      is_gem: 0,
      user_id: cookie.get('user_id'),
    });

    setEffectiveBranches([]);

    fetchData();
  };

  const save = async () => {
    if (isEdit === false) {
      try {
        const response = await api.post('bill-types').values({
          bill_type: newData,
          effective_branches: effectiveBranches,
        });
        console.log(response.message);
        if (response.message) {
          console.log(response.data);
          Object.values(response.errors).forEach((err) => {
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
          .update(`bill-types/${selectedId}/update`)
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
      des: '',
      loan_period_id: '',
      gold_rate_template_id: '',
      int_rate_template_id: '',
      is_active: 1,
      is_hidden: 0,
      is_gem: 0,
      user_id: cookie.get('user_id'),
    });

    setEffectiveBranches([]);

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
          <br />
          <br />
          <div className="d-flex justify-content-center">
            <div className="spinner-border text-primary" role="status">
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
                btnText="Add bill type"
              />
            </div>
          </div>

          {/* Form modal componenet */}
          <FormModal
            moduleName={moduleName}
            modalState={showModalState}
            toggleFormModal={toggleFormModal}
          >
            <form className="form compactForm" onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="container">
                  <div className="row">
                    <div className="col-sm-5 form-group">
                      <label htmlFor="des">Name</label>
                      <input
                        type="text"
                        name="des"
                        id="des"
                        maxLength="20"
                        className="form-control form-control-sm"
                        value={newData.des}
                        onChange={handleValueChange}
                      />
                    </div>
                    <div className="offset-5 col-sm-2">
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
                  </div>
                  <div className="row">
                    <div className="col-sm-4 form-group">
                      <label htmlFor="gold_rate_template_id">Gold Rate</label>
                      <select
                        name="gold_rate_template_id"
                        id="gold_rate_template_id"
                        maxLength="20"
                        className="form-control form-control-sm"
                        value={newData.gold_rate_template_id}
                        onChange={handleValueChange}
                      >
                        <option value="" className="text-muted" disabled>
                          -- Select gold rate
                        </option>
                        {goldRates.map((rate) => {
                          return (
                            <option value={rate.template_id} key={rate.id}>
                              {rate.des}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div className="col-sm-4 form-group">
                      <label htmlFor="loan_period_id">Loan Period</label>
                      <select
                        name="loan_period_id"
                        id="loan_period_id"
                        className="form-control form-control-sm"
                        value={newData.loan_period_id}
                        onChange={handleValueChange}
                      >
                        <option value="" className="text-muted" disabled>
                          -- Select pawning period
                        </option>
                        {pawningPeriods.map((period) => {
                          return (
                            <option value={period.id} key={period.id}>
                              {period.des}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div className="col-sm-4 form-group">
                      <label htmlFor="int_rate_template_id">
                        Interest Rate
                      </label>
                      <select
                        name="int_rate_template_id"
                        id="int_rate_template_id"
                        className="form-control form-control-sm"
                        value={newData.int_rate_template_id}
                        onChange={handleValueChange}
                      >
                        <option value="" className="text-muted" disabled>
                          -- Select interest rate
                        </option>
                        {interestRates.map((int) => {
                          return (
                            <option value={int.template_id} key={int.id}>
                              {int.des}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-sm-8 form-group">
                      <label htmlFor="branches">Effective branches</label>
                      {/* <pre>{JSON.stringify(branches)}</pre> */}
                      <MultiSelect
                        selectAllLabel={'All Branches'}
                        options={branches}
                        value={effectiveBranches}
                        onChange={setEffectiveBranches}
                        labelledBy={'Branches'}
                        className={styles.multiselect}
                      />
                    </div>

                    <div className="col-sm-1">Special</div>

                    <div className="col-sm-1">
                      <br />
                      <div className="custom-control custom-switch">
                        <input
                          type="checkbox"
                          className="custom-control-input"
                          id="is_hidden"
                          name="is_hidden"
                          checked={newData.is_hidden}
                          onChange={handleValueChange}
                        />
                        <label
                          className="custom-control-label"
                          htmlFor="is_hidden"
                        >
                          Hidden
                        </label>
                      </div>
                    </div>

                    <div className="offset-1 col-sm-1">
                      <br />
                      <div className="custom-control custom-switch">
                        <input
                          type="checkbox"
                          className="custom-control-input"
                          id="is_gem"
                          name="is_gem"
                          checked={newData.is_gem}
                          onChange={handleValueChange}
                        />
                        <label
                          className="custom-control-label"
                          htmlFor="is_gem"
                        >
                          Gem
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <SystemButton type="close" method={toggleFormModal} showText />
                <SystemButton type="save" showText />
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
            showEditButton={true}
            showDeleteButton={true}
            resetSearch={resetSearch}
          />
          {/* End of list view component */}
        </div>
      )}
    </div>
  );

  /* --- End of component renders --- */
};

export default BillTypes;
