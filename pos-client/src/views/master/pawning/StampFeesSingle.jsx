import React, { useState, useEffect } from 'react';
import { api, msg, cookie } from '../../../services';
import {
  BillTypeView,
  FormModal,
  ListView,
  SystemButton,
} from '../../../components';
import moment from 'moment';
import Select from 'react-select';
import styles from './Access.module.css';
import { MultiSelect } from 'react-multi-select-component';

const StampFeesSingle = () => {
  // Module name
  const moduleName = 'Stamp Fees Single Branch';

  /* --- State declarationss --- */

  const [entities, setEntities] = useState([]);

  const [originalBranches, setOriginalBranches] = useState([]);

  const [effectiveBranch, setEffectiveBranches] = useState([]);

  const [saveButtonDisabled, setSaveButtonDisabled] = useState(false);

  const [currentBranch, setCurrentBranch] = useState({
    value: '',
    label: '',
  });

  const [newData, setNewData] = useState({
    is_active: 1,
    from_value: 0.0,
    to_value: 0.0,
    stamp_fee: 0.0,
    user_id: cookie.get('user_id'),
    effected_branches: [],
    old_branches: [],
  });

  // Data loading status
  const [isLoading, setIsLoading] = useState(false);

  const [isSaveOrUpdate, setIsSaveOrUpdate] = useState(false);

  const [searchName, setSearchName] = useState('');

  // Form modal state
  const [showModalState, setShowModalState] = useState(false);

  // Data edit state
  const [isEdit, setIsEdit] = useState(false);

  // Selected data
  const [selectedId, setSelectedId] = useState('');

  const [branchList, setBranchList] = useState([]);
  const [sortList, setSortList] = useState([]);
  const [allBranchStatus, setAllBranchStatus] = useState(false);

  // List view states
  const dataColumns = [
    {
      title: 'From Value',
      name: 'from_value',
      class: 'text-right',
      searchable: true,
    },
    {
      title: 'To Value',
      name: 'to_value',
      class: 'text-right',
      searchable: true,
    },
    {
      title: 'Stamp Fee',
      name: 'stamp_fee',
      class: 'text-right',
      searchable: true,
    },
    {
      title: 'Branch ',
      name: 'branch',
      class: 'text-left',
      searchable: true,
    },
    {
      title: 'State',
      name: 'active_status',
      class: 'text-center',
      searchable: false,
    },
    {
      title: 'User',
      name: 'updated_user',
      class: 'text-center',
      searchable: false,
    },
    {
      title: 'Updated At',
      name: 'updated_at',
      class: 'text-center',
      searchable: false,
    },
  ];
  const dataRows = [];

  /* --- End of state declarations --- */

  useEffect(() => {
    fetchData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // if (showModalState === false) {
    // resetForm();
    // }
  }, [showModalState]);

  /* --- Component functions --- */

  const fetchData = async () => {
    try {
      console.log('count');
      setIsLoading(true);
      const branch_id = cookie.get('user_branch');
      const response = await api.get(`stamp-fees-all-branch/${branch_id}`);
      if (typeof response.error !== 'undefined') {
        msg.error(response.error.err);
        return;
      } else {
        response.data.entities.data.map((entity) => {
          return dataRows.push({
            id: entity.id,
            active_status: entity.is_active ? `Active` : `Inactive`,
            is_active: entity.is_active,
            from_value: parseFloat(entity.from_value).toFixed(2),
            to_value: parseFloat(entity.to_value).toFixed(2),
            stamp_fee: parseFloat(entity.stamp_fee).toFixed(2),
            updated_user: entity.updated_user ? entity.updated_user.name : '',
            updated_at: entity.updated_at
              ? moment(entity.updated_at).format(`YYYY-MM-DD HH:mm`)
              : '', //moment().format(`YYYY-MM-DD`)
            branch: entity.branch.name,
            branch_id: entity.branch_id,
            branch_code: entity.branch.code,
          });
        });

        setIsLoading(false);
        setEntities(dataRows);

        //  setBranchList(response.data.branches);
        // let branch_list = [];
        // let branch_count = 0;
        // response.data.branches
        //   .map((branch) => {
        //     branch_list.push({
        //       label: branch.code + ' ' + branch.name,
        //       value: branch.id,
        //     });
        //     branch_count += 1;
        //   })
        //   .join('');
        // setBranchList(branch_list);

        // setSortList(response.data.branches);
      }
    } catch (error) {
      msg.error('Unable to fetch data!');
      return console.log(error);
    }
  };

  const searchAndFetch = async (searchPhrase, selectedColumn) => {
    // try {
    //   setIsLoading(true);
    //   const response = await api.get(`items/${searchPhrase}/${selectedColumn}`);
    //   if (response.data.total === 0) {
    //     msg.warning(`No results returned your search!`);
    //   } else {
    //     response.data.data.map((entity) => {
    //       dataRows.push({
    //         id: entity.id,
    //         active_status: entity.is_active ? `Active` : `Inactive`,
    //         is_active: entity.is_active,
    //         from_value: parseFloat(entity.from_value).toFixed(2),
    //         to_value: parseFloat(entity.to_value).toFixed(2),
    //         stamp_fee: parseFloat(entity.stamp_fee).toFixed(2),
    //       });
    //     });
    //   }
    //   setEntities(response.data.data);
    //   setIsLoading(false);
    // } catch (error) {
    //   msg.error(`Unable to search data! --> ${error}`);
    //   setIsLoading(false);
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
    // let response = await api.get(
    //   `get-effected-branches-for-stamp-fees/${dataObj.from_value}/${dataObj.to_value}/${dataObj.stamp_fee}`,
    // );
    setCurrentBranch({
      value: dataObj.branch_id,
      label: dataObj.branch_code + ' - ' + dataObj.branch,
    });

    effectiveBranch.push({
      value: dataObj.branch_id,
      label: dataObj.branch_code + ' - ' + dataObj.branch,
    });

    setNewData({
      ...newData,
      is_active: dataObj.is_active,
      from_value: dataObj.from_value,
      to_value: dataObj.to_value,
      stamp_fee: dataObj.stamp_fee,
      branch_id: dataObj.branch_id,
      old_from_value: dataObj.from_value,
      old_to_value: dataObj.to_value,
      old_stamp_fee: dataObj.stamp_fee,
    });

    // setOriginalBranches(branches);

    setShowModalState(true);
    setIsEdit(true);
    setSelectedId(dataObj.id);
  };

  // const effectedBranch = async (from_value, to_value, stamp_fee) => {
  //   return await api.get(
  //     `get-effected-branches-for-stamp-fees/${from_value}/${to_value}/${stamp_fee}`,
  //   );
  // };

  const toggleFormModal = () => {
    resetForm();
    setShowModalState(!showModalState);
    setSaveButtonDisabled(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaveOrUpdate(true);
    setSaveButtonDisabled(true);
    await save();

    // setIsSaveOrUpdate(false);

    // setNewData({
    //   is_active: 1,
    //   from_value: 0.0,
    //   to_value: 0.0,
    //   stamp_fee: 0.0,
    //   user_id: cookie.get('user_id'),
    //   effected_branches: [],
    // });

    // fetchData();
  };

  const save = async () => {
    if (isEdit === false) {
      const response = await api.post('stamp-fees-single').values(newData);
      if (response.status == 200 && response.data.status == 200) {
        msg.success(response.data.message);

        resetForm();
      } else if (response.status == 200 && response.data.status == 401) {
        msg.warning(response.data.message);
      } else if (response.status == 200 && response.data.status == 403) {
        response.data.error
          .map((error) => {
            msg.error(error);
          })
          .join('');
      } else {
        response.data.error
          .map((error) => {
            msg.error(error);
          })
          .join('');
      }
    } else {
      const response = await api
        .update(`stamp-fees-single/${selectedId}/update`)
        .values(newData);
      if (response.status == 200 && response.data.status == 200) {
        msg.success(response.data.message);
        fetchData();
        resetForm();
      } else if (response.status == 200 && response.data.status == 401) {
        msg.warning(response.data.message);
      } else if (response.status == 200 && response.data.status == 403) {
        response.data.error
          .map((error) => {
            msg.error(error);
          })
          .join('');
      } else {
        response.data.error
          .map((error) => {
            msg.error(error);
          })
          .join('');
      }
    }
  };

  const resetForm = () => {
    setNewData({
      is_active: 1,
      from_value: 0.0,
      to_value: 0.0,
      stamp_fee: 0.0,
      user_id: cookie.get('user_id'),
      effected_branches: [],
      old_branches: [],
    });
    setIsEdit(false);
    setAllBranchStatus(false);
    setIsSaveOrUpdate(false);
    setShowModalState(false);
    // fetchData();
  };

  const resetSearch = () => {
    setEntities([]);

    fetchData();
  };

  const deleteFunc = (Obj) => {
    console.log(Obj);
    setSelectedId(Obj.id);
    console.log(selectedId);
    deleteStampFee(Obj.id);
  };

  const deleteStampFee = async (id) => {
    if (window.confirm('Are you sure you want to remove this row?')) {
      try {
        const response = await api
          .post(`delete-stamp-fees/${id}/destroy`)
          .values(newData);

        if (response.error) {
          Object.values(response.error).forEach((err) => {
            msg.error(err);
          });
          return;
        }

        msg.success(response.data);
      } catch (error) {
        return console.log(error);
      } finally {
        fetchData();
        setShowModalState(false);
      }
    } else {
      fetchData();
    }
  };

  const handleSearch = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue = targetInput.value;
    setSearchName(inputValue);
    // if (inputName != '') {
    setSortList(
      branchList.filter((row) => {
        return row['name']
          .toString()
          .toLowerCase()
          .includes(inputValue.toString().toLowerCase());
      }),
    );
    // }
  };

  const toggleBranchId = (id, name) => {
    var status = false;
    var position = 0;
    newData.effected_branches.map((branch, index) => {
      if (branch.id == id) {
        status = true;
        position = index;
      }
    });
    if (status == false) {
      var new_branches = newData.effected_branches;
      new_branches.push({ id: id, name: name });
      setNewData({
        ...newData,
        effected_branches: new_branches,
      });
    } else {
      var new_branches = newData.effected_branches.slice();
      new_branches.splice(position, 1);
      setNewData({
        ...newData,
        effected_branches: new_branches,
      });
      setAllBranchStatus(false);
    }
  };

  const toggleAllBranch = () => {
    if (allBranchStatus == true) {
      setAllBranchStatus(false);
      setNewData({
        ...newData,
        effected_branches: [],
      });
    } else {
      setAllBranchStatus(true);
      console.log('toggle-----------------------------------------');
      console.log(sortList);
      var branches = [];
      sortList
        .map((branch) => {
          branches.push({ id: branch.id, name: branch.name });
        })
        .join('');
      setNewData({
        ...newData,
        effected_branches: branches,
      });
    }
  };

  /* --- End of component functions --- */

  /* --- Component renders --- */

  return (
    <div>
      <h5 className="text-center">{moduleName}</h5>
      <span class="text-danger">Only One Branch and Can Update</span>
      <br />
      {/* <div className="row">
        <div className="col-sm-2">
          <SystemButton
            type="add-new"
            method={toggleFormModal}
            showText
            btnText="Add stamp fee"
          />
        </div>
      </div> */}

      {/* Form modal componenet */}
      <FormModal
        moduleName={moduleName}
        modalState={showModalState}
        toggleFormModal={toggleFormModal}
      >
        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.preventDefault();
          }}
          className="compactForm"
        >
          <div className="modal-body">
            <div className="form-group">
              <div className="row">
                <div className="offset-10 col-sm-2">
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
                    <label className="custom-control-label" htmlFor="is_active">
                      {newData.is_active ? `Active` : `Inactive`}
                    </label>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-sm-4">
                  <label htmlFor="from_value">From Value</label>
                  <input
                    type="number"
                    step="0.01"
                    name="from_value"
                    id="from_value"
                    className="form-control input-sm text-right"
                    value={newData.from_value}
                    onChange={handleValueChange}
                    required
                  />
                </div>
                <div className="col-sm-4">
                  <label htmlFor="to_valuee">To Value</label>
                  <input
                    type="number"
                    step="0.01"
                    name="to_value"
                    id="to_value"
                    className="form-control input-sm text-right"
                    min={newData.from_value}
                    value={newData.to_value}
                    onChange={handleValueChange}
                    required
                  />
                </div>
                <div className="col-sm-4">
                  <label htmlFor="stamp_fee">Stamp Fee</label>
                  <input
                    type="number"
                    name="stamp_fee"
                    step="0.01"
                    id="stamp_fee"
                    className="form-control input-sm text-right"
                    value={newData.stamp_fee}
                    onChange={handleValueChange}
                    required
                  />
                </div>
              </div>
              <br />
              <div className="row" style={{ marginTop: '20px' }}>
                <label
                  htmlFor="branch_list"
                  className="col-auto col-form-label"
                >
                  Branch
                </label>

                <div className="col-sm-5">
                  <MultiSelect
                    name="branch_id"
                    id="branch_id"
                    options={branchList}
                    onChange={setEffectiveBranches}
                    // onChange={() => changeRegionalOffice(effectiveOffices)}
                    labelledBy={'branch'}
                    className={styles.multiselect}
                    value={effectiveBranch}
                    disabled={true}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <SystemButton
              type={'close'}
              method={toggleFormModal}
              showText={true}
            />
            {isSaveOrUpdate ? (
              <div class="text-center">
                <div class="spinner-border" role="status">
                  <span class="sr-only">Loading...</span>
                </div>
              </div>
            ) : (
              <SystemButton
                type={isEdit ? 'update' : 'save'}
                showText={true}
                disabled={saveButtonDisabled}
              />
            )}
          </div>
        </form>
      </FormModal>
      {/* End of form modal componenet */}

      <br />
      <br />

      {/* List view componenet */}
      {/* <ListView
        columns={dataColumns}
        rows={entities}
        edit={editRow}
        loadingState={isLoading}
        searchAndFetch={searchAndFetch}
        actionsColumn
        showEditButton
        showDeleteButton={false}
        resetSearch={resetSearch}
        // deleteFunc={deleteFunc}
      /> */}
      <BillTypeView
        columns={dataColumns}
        rows={entities}
        edit={editRow}
        loadingState={isLoading}
        searchAndFetch={searchAndFetch}
        actionsColumn={true}
        showEditButton={true}
        resetSearch={resetSearch}
      />
      {/* End of list view component */}
    </div>
  );

  /* --- End of component renders --- */
};

export default StampFeesSingle;
