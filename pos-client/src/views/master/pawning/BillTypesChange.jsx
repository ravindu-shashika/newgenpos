import React, { useState, useEffect } from 'react';
import { api, cookie, msg } from '../../../services';
import {
  FormModal,
  ListView,
  Loader,
  SystemButton,
  BillTypeView,
  
} from '../../../components';
import { MultiSelect } from 'react-multi-select-component';
import moment from 'moment';
import styles from './BillTypes.module.css';

const BillTypesChange = () => {
  // Module name
  const moduleName = 'Bill Types Change(Branch Wise)';

  /* --- State declarationss --- */

  const [entities, setEntities] = useState([]);

  const [newData, setNewData] = useState({
    des: '',
    loan_period_id: '',
    gold_rate_template_id: '',
    int_rate_template_id: '',
    is_active: 1,
    is_hidden: 0,
    is_active: 1,
    is_gem: 0,
    grace_period: 0,
    user_id: cookie.get('user_id'),
    branch_id: '',
    // branch_id: cookie.get('user_branch'),
  });

  const [branches, setBranches] = useState([]);

  const [goldRates, setGoldRates] = useState([]);

  const [pawningPeriods, setPawningPeriods] = useState([]);

  const [interestRates, setInterestRates] = useState([]);

  // Data loading status
  const [isLoading, setIsLoading] = useState({
    init: false,
    branches: false,
  });

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
    {
      title: 'Id',
      name: 'bill_type_id',
      searchable: true,
      class: 'text-center',
    },
    { title: 'Name', name: 'des', searchable: true },
    {
      title: 'Loan Period',
      name: 'loan_period',
      searchable: true,
      class: 'text-wrap',
    },
    {
      title: 'Gold Rate Template',
      name: 'gold_rate',
      searchable: true,
      class: 'text-wrap',
    },
    {
      title: 'Interest Rate Template',
      name: 'int_rate',
      searchable: true,
      class: 'text-wrap',
    },
    { title: 'Branch', name: 'branch', searchable: true, class: 'text-wrap' },
    {
      title: 'Bill Count',
      name: 'bill_count',
      searchable: true,
      class: 'text-wrap',
    },
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

      setIsLoading({
        ...isLoading,
        init: true,
      });

      const response = await api.get('bill-types');
      const bill_types = await api.get('all-bill-types');

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
            code: branchRow.code,
            value: branchRow.id,
          });
        }
      });

      bill_types.data.map((billTypeRow, index) => {
        billTypeRow.branches.map((branchRow) => {
          if (billTypeRow.id !== 0) {
            branchesArr.map((branch, indexn) => {
              if (branchRow.branch_id == branch.value) {
                dataRows.push({
                  bill_type_id: billTypeRow.id,
                  bill_type_branch_id: branchRow.id,
                  branch_id: branchRow.branch_id,
                  branch_code: branch.code,
                  branch: branch.label,
                  bill_count: branchRow.bill_count,
                  des: billTypeRow.des,
                  state: billTypeRow.is_active ? 'Active' : 'Inactive',
                  // user: billTypeRow.user.name,
                  user: branchRow.user.name,
                  loan_period: billTypeRow.period.des,
                  loan_period_id: billTypeRow.loan_period_id,
                  grace_period: billTypeRow.grace_period,
                  gold_rate: billTypeRow.gold_rate[0].des,
                  gold_rate_template_id: billTypeRow.gold_rate_template_id,
                  int_rate: billTypeRow.int_rate[0].des,
                  int_rate_template_id: billTypeRow.int_rate_template_id,
                  is_active: billTypeRow.is_active,
                  is_hidden: billTypeRow.is_hidden,
                  is_gem: billTypeRow.is_gem,
                  user_id: billTypeRow.user_id,
                  created_at: moment(branchRow.created_at).format(
                    'YYYY-MM-DD | hh:mm A',
                  ),
                });
              }
            });
          }
        });
      });

      dataRows.sort((a, b) => {
        const dateA = new Date(a.bill_type_id);
        const dateB = new Date(b.bill_type_id);
        return dateB - dateA;
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
      // console.log('===============================================');
      // console.log(dataRows);

      setIsLoading({
        ...isLoading,
        init: false,
      });
    } catch (error) {
      msg.error('Unable to fetch data!');
      return console.log(error);
    } finally {
      setIsLoading({
        ...isLoading,
        init: false,
      });
    }
  };

  // Function that fetches data on enter key-down in the search field
  const searchAndFetch = async (searchPhrase, selectedColumn) => {
    // try {
    //   setIsLoading({
    //     ...isLoading,
    //     init: true,
    //   });
    //   const response = await api.get(
    //     `bill-types/search/${searchPhrase}/${selectedColumn}`,
    //   );
    //   if (response.data.data.length === 0) {
    //     msg.warning(`No results returned your search!`);
    //   } else {
    //     setEntities(response.data.data);
    //   }
    //   setIsLoading(false);
    // } catch (error) {
    //   msg.error(`Unable to search data! --> ${error}`);
    //   setIsLoading({
    //     ...isLoading,
    //     init: false,
    //   });
    //   return console.log(error);
    // }
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

  const editRow = async (dataObj) => {
    console.log(dataObj);
    setIsLoading({
      ...isLoading,
      branches: true,
    });

    const response = await api.get(
      `all-branches-by-bill-type/${dataObj.bill_type_id}/${dataObj.branch_id}`,
    );

    let effectiveBranchesTemp = [];

    response.data.map((branch) => {
      effectiveBranchesTemp.push({
        label: branch.branch.code + ' - ' + branch.branch.name,
        value: branch.branch.id,
      });
    });

    console.log(dataObj);

    setNewData({
      ...newData,
      //  id: dataObj.id,
      des: dataObj.des,
      loan_period_id: dataObj.loan_period_id,
      gold_rate_template_id: dataObj.gold_rate_template_id,
      int_rate_template_id: dataObj.int_rate_template_id,
      is_active: dataObj.is_active,
      is_hidden: dataObj.is_hidden,
      is_gem: dataObj.is_gem,
      grace_period: dataObj.grace_period,
      branch_id: dataObj.branch_id,
      bill_type_id: dataObj.bill_type_id,
      bill_type_branch_id: dataObj.bill_type_branch_id,
    });

    setEffectiveBranches(effectiveBranchesTemp);

    setShowModalState(true);

    setIsEdit(true);
    setSelectedId(dataObj.bill_type_id);

    setIsLoading({
      ...isLoading,
      branches: false,
    });
  };

  const toggleFormModal = () => {
    setShowModalState(!showModalState);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    await save();

    // setNewData({
    //   des: '',
    //   loan_period_id: '',
    //   gold_rate_template_id: '',
    //   int_rate_template_id: '',
    //   is_active: 1,
    //   is_hidden: 0,
    //   is_gem: 0,
    //   user_id: cookie.get('user_id'),
    // });

    // setEffectiveBranches([]);

    // fetchData();
  };

  const save = async () => {
    if (isEdit === false) {
      try {
        const response = await api.post('bill-type-update').values({
          bill_type: newData,
        });

        if (response.status == 200 && response.data.status == 200) {
          msg.success(response.data.message);
          resetForm();
          fetchData();
          setShowModalState(false);
        } else if (response.status == 200 && response.data.status == 500) {
          msg.error(response.data.message);
        } else if (response.status == 200 && response.data.status == 400) {
          Object.values(response.data.message).forEach((err) => {
            msg.error(err[0]);
          });
        } else if (response.data.status == 400) {
          Object.values(response.message).forEach((err) => {
            msg.error(err[0]);
          });
        } else if (response.data.status == 520) {
          msg.warning(response.data.message);
        }
      } catch (error) {
        //  return console.log(error);
      }
      // finally {
      //   setShowModalState(false);
      // }
    } else {
      try {
        // console.log('dfedtd');
        // console.log(newData);
        const response = await api
          .update(`bill-type-update/${selectedId}`)
          .values({
            bill_type: newData,
          });

        // if (response.error) {
        //   Object.values(response.error).forEach((err) => {
        //     msg.error(err[0]);
        //   });
        //   return;
        // }
        //  msg.success(response.data.status);
        if (response.status == 200 && response.data.status == 200) {
          msg.success(response.data.message);
          resetForm();
          fetchData();
          setShowModalState(false);
        } else if (response.status == 200 && response.data.status == 500) {
          msg.error(response.data.message);
        } else if (response.status == 200 && response.data.status == 400) {
          // Object.values(response.data.message).forEach((err) => {
          //   msg.error(err[0]);
          // });
          msg.error(response.data.message);
        } else if (response.data.status == 400) {
          // Object.values(response.message).forEach((err) => {
          //   msg.error(err[0]);
          // });
          msg.error(response.data.message);
        }
      } catch (error) {
        console.error(error);
      }
      //  finally {
      //   setIsEdit(false);
      //   setSelectedId('');
      //   setShowModalState(false);
      // }
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
      <span class="text-danger">Only One Branch Can Update Onetime</span>
      <br />

      {isLoading.init ? (
        <div>
          <br />
          <br />
          <Loader />
        </div>
      ) : (
        <div>
          {/* Form modal componenet */}
          <FormModal
            moduleName={moduleName}
            modalState={showModalState}
            toggleFormModal={toggleFormModal}
          >
            {isLoading.branches ? (
              <Loader />
            ) : (
              <form
                className="form compactForm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.preventDefault();
                }}
                onSubmit={handleSubmit}
              >
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
                          readOnly={!newData.is_active ? true : false}
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
                            readOnly={!newData.is_active ? true : false}
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
                          readOnly={!newData.is_active ? true : false}
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
                          readOnly={!newData.is_active ? true : false}
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
                          disabled={!newData.is_active ? true : false}
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
                          disabled={true}
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
                    <div className="row">
                      <div className="col-sm-2 form-group">
                        <label htmlFor="grace_period">Grace Period</label>
                        <input
                          type="number"
                          name="grace_period"
                          id="grace_period"
                          maxLength="1"
                          min="1"
                          max="30"
                          className="form-control form-control-sm"
                          value={newData.grace_period}
                          onChange={handleValueChange}
                          readOnly={!newData.is_active ? true : false}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <SystemButton
                    type="close"
                    method={toggleFormModal}
                    showText
                  />

                  <SystemButton
                    type={isEdit ? 'update' : 'save'}
                    showText={true}
                  />
                </div>
              </form>
            )}
          </FormModal>
          {/* End of form modal componenet */}

          {/* <br /> */}
          <br />
          {/* <BillTypesTable
            dataList={entities}
            editBill={editRow}
          ></BillTypesTable> */}
          {/* List view componenet */}
          {/* <BillTypeView
            columns={dataColumns}
            rows={entities}
            edit={editRow}
            loadingState={isLoading.init}
            searchAndFetch={searchAndFetch}
            actionsColumn={true}
            showEditButton={true}
            resetSearch={resetSearch}
          /> */}
          {/* <BillTypeSingle
            dataList={entities}
            editProduct={editRow}
          ></BillTypeSingle> */}
          {/* End of list view component */}
        </div>
      )}
    </div>
  );

  /* --- End of component renders --- */
};

export default BillTypesChange;
