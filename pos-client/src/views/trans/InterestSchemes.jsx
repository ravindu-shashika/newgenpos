import React, { useState, useEffect } from 'react';
import { api, msg } from '../../services';
import { FormModal, ListView } from '../../components';
import styles from './InterestSchemes.module.css';

const InterestSchemes = () => {
  // Module name
  const moduleName = 'Interest Schemes';

  /* --- State declarationss --- */

  const [entities, setEntities] = useState([]);

  const [newData, setNewData] = useState({
    des: '',
    loan_period_id: '',
    gold_type_id: '',
    gold_rate: 0.0,
    fm_interest_rate: 0.0,
    nm_interest_rate: 0.0,
    discount_days: '',
    discount_rate: 0.0,
    grace_period: '',
    grace_rate: 0.0,
    is_active: 1,
    branch_ids: [],
  });

  // Related data lists
  const [periods, setPeriods] = useState([]);

  const [amounts, setAmounts] = useState([]);

  const [billTypes, setBillTypes] = useState([]);

  const [branches, setBranches] = useState([]);

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
    { title: 'Description', name: 'des' },
    { title: 'Loan Period', name: 'loan_period', class: 'text-center' },
    { title: 'Gold Type', name: 'gold_type', calss: 'text-center' },
    {
      title: 'First Month Interest (%)',
      name: 'fm_interest_rate',
      class: 'text-right',
    },
    {
      title: 'Interest After Second Month (%)',
      name: 'nm_interest_rate',
      class: 'text-right',
    },
    { title: 'Discount Period (Days)', name: 'discount_days' },
    { title: 'Discount Rate (%)', name: 'discount_rate', class: 'text-right' },
    { title: 'Grace Period (Days)', name: 'grace_period' },
    { title: 'Grace Rate (%)', name: 'grace_rate', class: 'text-right' },
  ];

  let dataRows = [];

  let branchIdList = [];

  /* --- End of state declarations --- */

  useEffect(() => {
    fetchData();
  }, []);

  /* --- Component functions --- */

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const response = await api.get('int-schemes');
      setEntities(response.data);

      await fetchRelatedData();

      setIsLoading(false);
    } catch (error) {
      msg.error('Unable to fetch data!');
      return console.log(error);
    }
  };

  const fetchRelatedData = async () => {
    console.log(`Fetch related data function!!!!`);

    const periodsList = await api.get('loan-periods');
    setPeriods(periodsList.data);

    const amountsList = await api.get('loan-amounts');
    setAmounts(amountsList.data);

    const billTypesList = await api.get('bill-types');
    setBillTypes(billTypesList.data);

    const branchesList = await api.get('branches/custom-ints');
    setBranches(branchesList.data);
  };

  const searchAndFetch = async (searchPhrase, selectedColumn) => {
    try {
      setIsLoading(true);

      const response = await api.get(
        `int-schemes/search/${searchPhrase}/${selectedColumn}`,
      );

      if (response.data.total === 0) {
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
    console.log('Handle Value Change function');
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue =
      inputName === 'branch_ids'
        ? branchIds(targetInput.checked, targetInput.value)
        : targetInput.value;

    setNewData({
      ...newData,
      [inputName]: inputValue,
    });
  };

  const branchIds = (checkedState, id) => {
    if (checkedState) {
      branchIdList.push(...newData.branch_ids, id);

      return branchIdList;
    } else {
      branchIdList = newData.branch_ids;

      branchIdList.splice(parseInt(branchIdList.indexOf(id)), 1);

      return branchIdList;
    }
  };

  const editRow = (dataObj) => {
    // setShowModalState(true);

    // setNewData({
    //   bill_type_id: '',
    //   loan_period_id: '',
    //   loan_amount_id: '',
    //   fm_interest_rate: 0.0,
    //   nm_interest_rate: 0.0,
    //   discount_days: '',
    //   discount_rate: 0.0,
    //   grace_period: '',
    //   grace_rate: 0.0,
    //   branch_ids: dataObj.months,
    // });

    // setIsEdit(true);
    // setSelectedId(dataObj.id);

    msg.info(
      'Cannot edit an interest scheme... Please add a new scheme with required options',
    );
  };

  const toggleFormModal = () => {
    setShowModalState(!showModalState);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    await save();

    setNewData({
      bill_type_id: '',
      loan_period_id: '',
      loan_amount_id: '',
      fm_interest_rate: 0.0,
      nm_interest_rate: 0.0,
      discount_days: '',
      discount_rate: 0.0,
      grace_period: '',
      grace_rate: 0.0,
      branch_ids: [],
    });

    fetchData();
  };

  const save = async () => {
    if (isEdit === false) {
      try {
        const response = await api.post('int-schemes').values(newData);

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
          .update(`int-schemes/${selectedId}/update`)
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

  /* --- End of component functions --- */

  /* --- Component renders --- */

  return (
    <div>
      <h3 className="text-center">{moduleName}</h3>
      <br />
      <button
        type="button"
        className="btn btn-primary btn-sm"
        onClick={toggleFormModal}
      >
        Add New
      </button>

      {/* Form modal componenet */}
      <FormModal
        moduleName={moduleName}
        modalState={showModalState}
        toggleFormModal={toggleFormModal}
      >
        <form className="form" onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="row">
              <div className="form-group col-9">
                <div className="row">
                  <div className="form-group col-4">
                    <label htmlFor="loan_period_id">Loan Periods</label>
                    <select
                      name="loan_period_id"
                      id="loan_period_id"
                      className="form-control form-control-sm"
                      value={newData.loan_period_id}
                      onChange={handleValueChange}
                    >
                      {periods.map((period) => {
                        return (
                          <option key={period.id} value={period.id}>
                            {period.des}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="form-group col-4">
                    <label htmlFor="loan_amount_id">Loan amount</label>
                    <select
                      name="loan_amount_id"
                      id="loan_amount_id"
                      className="form-control form-control-sm"
                      value={newData.loan_amount_id}
                      onChange={handleValueChange}
                    >
                      {amounts.map((amount) => {
                        return (
                          <option
                            key={amount.id}
                            value={amount.id}
                          >{`${amount.from_amount} to ${amount.to_amount}`}</option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="form-group col-4">
                    <label htmlFor="bill_type_id">Bill type</label>
                    <select
                      name="bill_type_id"
                      id="bill_type_id"
                      className="form-control form-control-sm"
                      value={newData.bill_type_id}
                      onChange={handleValueChange}
                    >
                      {billTypes.map((billType) => {
                        return (
                          <option key={billType.id} value={billType.id}>
                            {billType.des}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="form-group col-6">
                    <label htmlFor="fm_interest_rate">
                      First Month Interest Rate (%)
                    </label>
                    <input
                      type="number"
                      name="fm_interest_rate"
                      id="fm_interest_rate"
                      className="form-control form-control-sm text-right"
                      value={newData.fm_interest_rate}
                      onChange={handleValueChange}
                    />
                  </div>

                  <div className="form-group col-6">
                    <label htmlFor="nm_interest_rate">
                      Interest Rate After Second Month (%)
                    </label>
                    <input
                      type="number"
                      name="nm_interest_rate"
                      id="nm_interest_rate"
                      className="form-control form-control-sm text-right"
                      value={newData.nm_interest_rate}
                      onChange={handleValueChange}
                    />
                  </div>

                  <div className="form-group col-3">
                    <label htmlFor="discount_days">Discount Period</label>
                    <input
                      type="number"
                      name="discount_days"
                      id="discount_days"
                      className="form-control form-control-sm"
                      placeholder="Days"
                      value={newData.discount_days}
                      onChange={handleValueChange}
                    />
                  </div>

                  <div className="form-group col-3">
                    <label htmlFor="discount_rate">Discount Rate</label>
                    <input
                      type="number"
                      name="discount_rate"
                      id="discount_rate"
                      className="form-control form-control-sm text-right"
                      value={newData.discount_rate}
                      onChange={handleValueChange}
                    />
                  </div>

                  <div className="form-group col-3">
                    <label htmlFor="grace_period">Grace Period</label>
                    <input
                      type="number"
                      name="grace_period"
                      id="grace_period"
                      className="form-control form-control-sm"
                      placeholder="Days"
                      value={newData.grace_period}
                      onChange={handleValueChange}
                    />
                  </div>

                  <div className="form-group col-3">
                    <label htmlFor="grace_rate">Grace Rate</label>
                    <input
                      type="number"
                      name="grace_rate"
                      id="grace_rate"
                      className="form-control form-control-sm text-right"
                      value={newData.grace_rate}
                      onChange={handleValueChange}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group col-3">
                <label htmlFor="branch_id">Branches</label>
                <div className="h-25 w-100 d-inline-block overflow-auto">
                  <div className={styles.shortDiv}>
                    <div className="list-group">
                      {branches.map((branch) => {
                        return (
                          <div
                            className="custom-control custom-checkbox"
                            key={branch.id}
                          >
                            <input
                              type="checkbox"
                              className="custom-control-input"
                              id={`branch_${branch.id}`}
                              name="branch_ids"
                              value={branch.id}
                              onChange={handleValueChange}
                            />
                            <label
                              className="custom-control-label"
                              htmlFor={`branch_${branch.id}`}
                            >
                              {branch.name}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={toggleFormModal}
            >
              Close
            </button>
            <button type="submit" className="btn btn-outline-success btn-sm">
              Save Changes
            </button>
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
        showDeleteButton={false}
      />
      {/* End of list view component */}
    </div>
  );

  /* --- End of component renders --- */
};

export default InterestSchemes;
