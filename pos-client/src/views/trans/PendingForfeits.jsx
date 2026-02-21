import React, { useState, useEffect } from 'react';
import { api, msg, cookie } from '../../services';
import { FormModal, ListView, SystemButton, Loader } from '../../components';
import { MultiSelect } from 'react-multi-select-component';
import moment from 'moment';
import styles from '../master/pawning/BillTypes.module.css';
import { SafeFontAwesomeIcon } from '../../components';
import { faArrowDown, faArrowUp } from '@fortawesome/free-solid-svg-icons';

const Forfeits = () => {
  // Module name
  const moduleName = 'Pending Forfeits';

  /* --- State declarationss --- */

  const [newData, setNewData] = useState({
    branch_id: cookie.get('user_branch'),
    from_date: moment().format('YYYY-MM-DD'),
    to_date: moment().format('YYYY-MM-DD'),
    batch_no: '',
    new_batch_no: '',
    no1: '',
    no2: '',
    user_id: cookie.get('user_id'),
    pending_forfeit_date: moment().format('YYYY-MM-DD'),
  });

  const [showSectionStates, setShowSectionStates] = useState({
    toggleForfeitBills: false,
  });

  const [forfeitsBills, setForfeitsBills] = useState([]);

  const [controlDisabledStates, setControlDisabledStates] = useState({
    list: {
      add: true,
      remove: true,
    },
    description: true,
    status: false,
    pending_forfeit_date: false,
    forfeit_date: false,
    forfeit_rate: false,
    saveButton: true,
    savePending: true,
    saveForfeit: false,
  });

  // Data loading status
  const [isLoading, setIsLoading] = useState({
    init: false,
    billTypes: false,
    foreitList: false,
  });

  function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Edit status
  const [isEdit, setIsEdit] = useState(false);

  const [isLoaded, setIsLoaded] = useState(true);

  const [deletedisabled, setdeletedisabled] = useState(false);

  const [billTypes, setBillTypes] = useState([]);

  const [selectedBillTypes, setSelectedBillTypes] = useState([]);

  const [entities, setEntities] = useState([]);
  const [entitiesTempList, setEntitiesTempList] = useState([]);

  const [selectedLoans, setSelectedLoans] = useState([]);

  const [forfeitableEntities, setForfeitableEntities] = useState([]);

  const [forfeitableSelectedLoans, setForfeitableSelectedLoans] = useState([]);

  const [forfeitableDeleteSelectedLoans, setForfeitableDeleteSelectedLoans] =
    useState([]);

  const [forfeitingList, setForfeitingList] = useState([]);

  const [branches, setBranches] = useState([]);

  /* --- End of state declarations --- */

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (newData.branch_id !== '') {
      fetchBillTypes();
    }
  }, [newData.branch_id]);

  useEffect(() => {
    let forfilt_list = [];
    forfeitableEntities.map((entity) => {
      forfilt_list.push({
        id: entity.id,
        description: entity.note || null,
        forfeit_rate: entity.forfeit_rate || null,
      });
    });
    setForfeitingList(forfilt_list);
    // setForfeitingList(forfeitableEntities.map((entity) => entity.id));
  }, [forfeitableEntities]);

  /* --- Component functions --- */

  const fetchData = async () => {
    try {
      setIsLoading({
        ...isLoading,
        init: true,
      });
      let branch_id = cookie.get('user_branch');
      const response = await api.get(`forfeits/${branch_id}`);

      setNewData({
        ...newData,
        batch_no: response.data.nextBatch,
        new_batch_no: response.data.nextBatch,
      });

      setBranches(response.data.branches);
    } catch (error) {
      msg.error('Unable to fetch data!');
      console.log(error);
    } finally {
      setIsLoading({
        ...isLoading,
        init: false,
      });
    }
  };

  const fetchBillTypes = async () => {
    try {
      setIsLoading({
        ...isLoading,
        billTypes: true,
      });

      let billTypesTemp = [];

      const response = await api.get(
        `bill-types-by-branch/${newData.branch_id}`,
      );

      response.data.map((billType) => {
        if (billType.id !== 0) {
          billTypesTemp.push({
            label: billType.des,
            value: billType.id,
          });
        }
      });

      setBillTypes(billTypesTemp);
    } catch (error) {
      msg.error('Unable to fetch data!');
      return console.log(error);
    } finally {
      setIsLoading({
        ...isLoading,
        billTypes: false,
      });
    }
  };

  const selectAllLetters = (e) => {
    const targetInput = e.target;
    const inputValue = targetInput.checked;

    let selectedListTemp = [];

    if (inputValue === true) {
      forfeitableEntities.map((row) => {
        selectedListTemp.push(row.id);
      });
    }

    setForfeitableDeleteSelectedLoans(selectedListTemp);
  };

  const clickRow = async (selectedRow) => {
    searchBatch(selectedRow.batch_no);
    // setCancelOldBill(true);
    console.log('after click raw' + selectedRow.batch_no);
    // console.log(cancelOldBill);
    setNewData({
      ...newData,
      batch_no: selectedRow.batch_no,
    });

    // });
    toggleForfeitBills(false);
  };

  const handleValueChange = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue = targetInput.value;

    setNewData({
      ...newData,
      [inputName]: inputValue,
    });

    if (inputName == 'no1') {
      setEntities(
        entitiesTempList.filter((row) => {
          return row['bill_no'].toString().includes(inputValue);
        }),
      );
    }

    if (inputName == 'no2') {
      if (newData.no1 != '') {
        setEntities(
          entitiesTempList.filter((row) => {
            return (
              parseInt(row['bill_no']) >= parseInt(newData.no1) &&
              parseInt(row['bill_no']) <= parseInt(inputValue)
            );
          }),
        );
      }
    }
  };

  const handleLoanSelection = (e) => {
    const targetInput = e.target;
    const datasetId = targetInput.dataset.id;
    const inputValue = targetInput.checked;

    let selectedListTemp = [];

    if (targetInput.dataset.type === 'active') {
      selectedListTemp = [...selectedLoans];

      if (!selectedLoans.includes(parseInt(datasetId))) {
        selectedListTemp.push(parseInt(datasetId));
      } else {
        // prettier-ignore
        selectedListTemp = selectedLoans.filter(item => parseInt(item) !== parseInt(datasetId));
        // prettier-ignore-end
      }

      setSelectedLoans(selectedListTemp);
    } else {
      selectedListTemp = [...forfeitableSelectedLoans];

      if (!forfeitableSelectedLoans.includes(parseInt(datasetId))) {
        selectedListTemp.push(parseInt(datasetId));
      } else {
        // prettier-ignore
        selectedListTemp = forfeitableSelectedLoans.filter(item => parseInt(item) !== parseInt(datasetId));
        // prettier-ignore-end
      }

      setForfeitableSelectedLoans(selectedListTemp);
    }
  };

  const validateBeforeSearch = () => {
    if (!selectedBillTypes) {
      return { status: false, message: 'Bill types not valid' };
    }

    return { status: true, message: '' };
  };

  const handleSearch = async () => {
    const validated = validateBeforeSearch();

    if (validated.status) {
      await searchForfietList();
    } else {
      msg.error(validated.message);
    }
  };

  const selectOneLetter = (e) => {
    console.log('dd', e);
    const targetInput = e.target;
    const datasetId = targetInput.dataset.id;
    const inputValue = targetInput.checked;

    let selectedListTemp = [...forfeitableDeleteSelectedLoans];

    if (!forfeitableDeleteSelectedLoans.includes(parseInt(datasetId))) {
      selectedListTemp.push(parseInt(datasetId));
    } else {
      // prettier-ignore
      selectedListTemp = forfeitableDeleteSelectedLoans.filter(item => parseInt(item) !== parseInt(datasetId));
      // prettier-ignore-end
    }

    setForfeitableDeleteSelectedLoans(selectedListTemp);
  };

  const searchForfietList = async () => {
    setIsLoading({
      ...isLoading,
      foreitList: true,
    });

    let loansTemp = [];
    // console.log('data fetching');
    if (cookie.get('user_roles') == 3) {
      console.log('list o 33f');
      setControlDisabledStates({
        ...controlDisabledStates,
        list: {
          add: true,
          remove: true,
        },
        removelist: false,
        description: true,
        status: false,
        forfeit_rate: false,
        pending_forfeit_date: false,
        forfeit_date: false,
        saveButton: true,
        savePending: true,
        saveForfeit: false,
      });
    } else if (cookie.get('user_roles') == 1) {
      setControlDisabledStates({
        ...controlDisabledStates,
        list: {
          add: true,
          remove: true,
        },
        removelist: false,
        description: true,
        status: false,
        forfeit_rate: false,
        pending_forfeit_date: false,
        forfeit_date: false,
        saveButton: true,
        savePending: true,
        saveForfeit: false,
      });
    }

    const response = await api.post('show-forfeit-list').values({
      branch_id: newData.branch_id,
      date_range: [newData.from_date, newData.to_date],
      bill_types: selectedBillTypes.map((billType) => billType.label),
    });

    response.data.map((loan) => {
      let paidCapitol = 0.0;
      let paidInt = 0.0;
      let fmInt = 0.0;
      let nmInt = 0.0;
      loan.loan_trans.map((trans) => {
        if (trans.trans_type.code === 'PPL') {
          paidCapitol = parseFloat(paidCapitol) + parseFloat(trans.amount);
        }
        if (trans.trans_type.code === 'PPI') {
          paidInt = parseFloat(paidInt) + parseFloat(trans.amount);
        }
        if (trans.trans_type.code === 'FMI') {
          fmInt = parseFloat(trans.amount);
        }
        if (trans.trans_type.code === 'P') {
          nmInt =
            (parseFloat(trans.amount) *
              parseFloat(loan.int_rate.nm_interest_rate)) /
            100;
        }
      });

      loansTemp.push({
        ...loan,
        paidCapitol: paidCapitol,
        paidInt: paidInt,
        fmInt: fmInt,
        nmInt: nmInt,
      });
    });

    setEntities(loansTemp);
    setEntitiesTempList(loansTemp);

    setIsLoading({
      ...isLoading,
      foreitList: false,
    });
  };

  const save = async () => {
    console.log('batch data', newData);
    const response = await api.post('save-pendingforfeit-list').values({
      batch_data: newData,
      forfeit_list: forfeitingList,
    });

    if (response.status === 200) {
      msg.success(response.data);
      resetAll();
      fetchData();
    } else {
      msg.error(response.data);
    }
  };

  const saveforefeit = async () => {
    const response = await api.post('mark-as-forfeit').values({
      batch_data: newData,
      forfeit_list: forfeitingList,
    });

    if (response.status === 200) {
      msg.success(response.data);
      resetAll();
      fetchData();
    } else {
      msg.error(response.data);
    }
  };

  const removeList = async () => {
    setdeletedisabled(true);
    // TODO: Create a better dialog box component... Use the FormModal component as a base template
    if (window.confirm('Are you sure you want to remove this item?')) {
      const response = await api.post('remove-pendingforfeit-list').values({
        delete_list: forfeitableDeleteSelectedLoans,
        batch_no: newData.batch_no,
      });

      setNewData({
        ...newData,
        batch_no: newData.batch_no,
      });

      if (response.status === 200) {
        msg.success(response.data);
        resetAll();
        fetchData();
        searchBatch(newData.batch_no);
      } else {
        msg.error(response.data);
      }
    }
  };

  const searchBatch = async (batch_number) => {
    const response = await api.get(
      `show-pendingforfeited-by-batch/${batch_number}/${cookie.get(
        'user_branch',
      )}`,
    );
    console.log(newData);
    setdeletedisabled(false);
    setNewData({
      ...newData,
      branch_id: cookie.get('user_branch'),
      batch_no: batch_number,
      user_id: cookie.get('user_id'),
    });
    let loansTemp = [];
    let saveButton;
    let statushandle;
    if (response.data.length == 0) {
      resetAll();
      msg.error('Unable to fetch data!');
    }
    response.data.map((loan) => {
      let paidCapitol = 0.0;
      let paidInt = 0.0;
      let fmInt = 0.0;

      let nmInt = 0.0;
      loan.loan_trans.map((trans) => {
        if (trans.trans_type.code === 'PPL') {
          paidCapitol = parseFloat(paidCapitol) + parseFloat(trans.amount);
        }
        if (trans.trans_type.code === 'PPI') {
          paidInt = parseFloat(paidInt) + parseFloat(trans.amount);
        }
        if (trans.trans_type.code === 'FMI') {
          fmInt = parseFloat(trans.amount);
        }
        if (trans.trans_type.code === 'P') {
          nmInt =
            (parseFloat(trans.amount) *
              parseFloat(loan.int_rate.nm_interest_rate)) /
            100;
        }
      });

      loansTemp.push({
        ...loan,
        paidCapitol: paidCapitol,
        paidInt: paidInt,
        fmInt: fmInt,
        nmInt: nmInt,
      });

      if (loan.type == 'FORFEITED') {
        console.log('forfet');

        if (cookie.get('user_roles') == 3) {
          console.log('list o 33f');
          setControlDisabledStates({
            ...controlDisabledStates,
            list: {
              add: false,
              remove: false,
            },
            removelist: false,
            description: false,
            status: true,
            forfeit_rate: false,
            pending_forfeit_date: false,
            forfeit_date: false,
            saveButton: false,
            savePending: false,
            saveForfeit: false,
          });
        } else if (cookie.get('user_roles') == 1) {
          setControlDisabledStates({
            ...controlDisabledStates,
            list: {
              add: false,
              remove: false,
            },
            removelist: true,
            description: false,
            status: true,
            forfeit_rate: true,
            pending_forfeit_date: false,
            forfeit_date: true,
            saveButton: false,
            savePending: false,
            saveForfeit: false,
          });
        }
      } else {
        if (cookie.get('user_roles') == 3) {
          console.log('list o 33f');
          setControlDisabledStates({
            ...controlDisabledStates,
            list: {
              add: false,
              remove: false,
            },
            removelist: false,
            description: false,
            status: true,
            forfeit_rate: false,
            pending_forfeit_date: false,
            forfeit_date: false,
            saveButton: false,
            savePending: false,
            saveForfeit: false,
          });
        } else if (cookie.get('user_roles') == 1) {
          setControlDisabledStates({
            ...controlDisabledStates,
            list: {
              add: false,
              remove: false,
            },
            removelist: true,
            description: false,
            status: true,
            forfeit_rate: true,
            pending_forfeit_date: true,
            forfeit_date: false,
            saveButton: true,
            savePending: false,
            saveForfeit: true,
          });
        }
      }
    });

    // setEntities(loansTemp);
    // setEntitiesTempList(loansTemp);
    setForfeitableEntities(loansTemp);

    // setForfeitableEntities(response.data);
    // let firstMonthIntrest = response.data[0].loan_trans.filter(
    //   (trans) => trans.trans_type_id == 11,
    // );
    // setIsLoaded(false);

    console.log(controlDisabledStates);
  };

  const addToForfitingList = () => {
    let forfeitableTemp = [...forfeitableEntities];
    let newEntitiesTemp = [...entities];

    entities.forEach((entity) => {
      if (selectedLoans.some((selected) => entity.id === selected)) {
        forfeitableTemp.push(entity);
        newEntitiesTemp.splice(newEntitiesTemp.indexOf(entity), 1);
      }
    });

    setEntities(
      newEntitiesTemp.sort(
        (prev, curr) => parseInt(prev.id) - parseInt(curr.id),
      ),
    );

    let loansTemp = [];

    forfeitableTemp.map((loan) => {
      let paidCapitol = 0.0;
      let paidInt = 0.0;
      let fmInt = 0.0;
      let nmInt = 0.0;
      loan.loan_trans.map((trans) => {
        if (trans.trans_type.code === 'PPL') {
          paidCapitol = parseFloat(paidCapitol) + parseFloat(trans.amount);
        }
        if (trans.trans_type.code === 'PPI') {
          paidInt = parseFloat(paidInt) + parseFloat(trans.amount);
        }
        if (trans.trans_type.code === 'FMI') {
          fmInt = parseFloat(trans.amount);
        }
        if (trans.trans_type.code === 'P') {
          nmInt =
            (parseFloat(trans.amount) *
              parseFloat(loan.int_rate.nm_interest_rate)) /
            100;
        }
      });

      loansTemp.push({
        ...loan,
        paidCapitol: paidCapitol,
        paidInt: paidInt,
        fmInt: fmInt,
        nmInt: nmInt,
      });
    });

    setForfeitableEntities(loansTemp);

    // setForfeitableEntities(
    //   forfeitableTemp.sort(
    //     (prev, curr) => parseInt(prev.id) - parseInt(curr.id),
    //   ),
    // );
    setSelectedLoans([]);
    setForfeitableSelectedLoans([]);
  };

  const toggleForfeitBills = async () => {
    try {
      if (showSectionStates.toggleForfeitBills == false) {
        const response = await api.get(
          'load-forfeit-bills/' + cookie.get('user_branch'),
        );
        if (response.status == 200 && response.data.status == 200) {
          setForfeitsBills(response.data.data);
          setShowSectionStates({
            ...showSectionStates,
            toggleForfeitBills: !showSectionStates.toggleForfeitBills,
          });
        } else if (response.status == 200 && response.data.status == 403) {
          msg.warning('Access Denided !!');
        } else {
          msg.error('Forfeit Bill Loading Error');
        }
      } else {
        setShowSectionStates({
          ...showSectionStates,
          toggleForfeitBills: !showSectionStates.toggleForfeitBills,
        });
      }
    } catch (error) {
      console.log(error);
      msg.error('Something Went Wrong');
    }
  };

  const removeFromForfitingList = () => {
    let newEntitiesTemp = [...entities];
    let newForfeitableTemp = [...forfeitableEntities];

    forfeitableEntities.forEach((entity) => {
      if (forfeitableSelectedLoans.some((selected) => entity.id === selected)) {
        newEntitiesTemp.push(entity);
        newForfeitableTemp.splice(newForfeitableTemp.indexOf(entity), 1);
      }
    });

    setEntities(
      newEntitiesTemp.sort(
        (prev, curr) => parseInt(prev.id) - parseInt(curr.id),
      ),
    );
    setForfeitableEntities(
      newForfeitableTemp.sort(
        (prev, curr) => parseInt(prev.id) - parseInt(curr.id),
      ),
    );
    setSelectedLoans([]);
    setForfeitableSelectedLoans([]);
  };

  const resetAll = () => {
    setEntities([]);

    setNewData({
      ...newData,
      branch_id: cookie.get('user_branch'),
      from_date: moment().format('YYYY-MM-DD'),
      to_date: moment().format('YYYY-MM-DD'),
      batch_no: newData.new_batch_no,
      user_id: cookie.get('user_id'),
      pending_forfeit_date: moment().format('YYYY-MM-DD'),
    });

    setForfeitableDeleteSelectedLoans([]);
    setIsLoading({
      init: false,
      billTypes: false,
      foreitList: false,
    });

    setSelectedBillTypes([]);

    // setBillTypes([]);

    // setBranches([]);

    // setIsEdit(true);

    setSelectedBillTypes([]);

    setEntities([]);

    setSelectedLoans([]);

    setForfeitableEntities([]);

    setForfeitableSelectedLoans([]);

    setForfeitingList([]);
  };

  const handleDescriptionChange = (index, value) => {
    console.log(value);
    console.log(index);
    forfeitingList[index].description = value;
    forfeitableEntities[index].note = value;
  };

  const handleRateChange = (index, value) => {
    console.log(value);
    console.log(index);
    forfeitingList[index].forfeit_rate = value;
    forfeitableEntities[index].forfeit_rate = value;
  };
  /* --- End of component functions --- */

  /* --- Component renders --- */

  return (
    <div>
      <h5 className="text-center">{moduleName}</h5>

      <br />

      <div className="compactForm">
        <div className="row mb-2 justify-content-start">
          <div className="col-sm-2">
            <div className="form-group">
              <label htmlFor="branch_id" className="col-form-label">
                Branch
              </label>
              <select
                className="form-control form-control-sm"
                id="branch_id"
                name="branch_id"
                value={newData.branch_id}
                onChange={handleValueChange}
              >
                <option value="" className="text-muted" disabled>
                  ---
                </option>
                {branches.map((branch) => {
                  return (
                    <option value={branch.id} key={branch.id}>
                      {branch.code} - {branch.name}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
          <div className="col-sm-2">
            <div className="form-group">
              <label htmlFor="from_date" className="col-form-label">
                From date
              </label>
              <input
                type="date"
                className="form-control form-control-sm"
                id="from_date"
                name="from_date"
                value={newData.from_date}
                onChange={handleValueChange}
              />
            </div>
          </div>
          <div className="col-sm-2">
            <div className="form-group">
              <label htmlFor="to_date" className="col-form-label">
                To date
              </label>
              <input
                type="date"
                className="form-control form-control-sm"
                id="to_date"
                name="to_date"
                value={newData.to_date}
                onChange={handleValueChange}
              />
            </div>
          </div>
          <div className="col-sm-2">
            <div className="form-group">
              <label htmlFor="billTypes" className="col-form-label">
                Bill types
              </label>
              {isLoading.billTypes ? (
                <input
                  type="text"
                  className="form-control form-control-sm inputLoaderCenter"
                  disabled
                />
              ) : (
                <MultiSelect
                  selectAllLabel="All Bill Types"
                  options={billTypes}
                  value={selectedBillTypes}
                  onChange={setSelectedBillTypes}
                  labelledBy="Bill Type"
                  className={styles.multiselect}
                />
              )}
            </div>
          </div>
          <div className="col-sm-2">
            <label htmlFor="batch_no" className="col-sm-6">
              Batch No.
            </label>
            <div className="col">
              <input
                type="text"
                id="batch_no"
                name="batch_no"
                className="form-control text-right"
                disabled={isEdit ? true : false}
                value={newData.batch_no}
                onChange={handleValueChange}
                onFocus={(e) => e.target.select()}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    searchBatch(e.target.value);
                  }
                }}
              />
            </div>
          </div>
          <div className="col-sm-2 ml-auto mt-3">
            {/* <div class="dropdown"> */}
            <button
              class="btn btn-block btn-primary btn-sm mr-2 rounded-0"
              type="button"
              id="renewBillDropdown"
              onClick={() => toggleForfeitBills()}
            >
              <span className="text-white">Pending Foefeits List</span>
            </button>
            {/* </div> */}
          </div>
        </div>
        <div className="row justify-content-start">
          <div className="col-sm-2 ">
            <div className="form-group">
              <label htmlFor="no1" className="col-form-label">
                No 1
              </label>
              <input
                type="number"
                className="form-control form-control-sm"
                id="no1"
                name="no1"
                value={newData.no1}
                onChange={handleValueChange}
              />
            </div>
          </div>
          <div className="col-sm-2">
            <div className="form-group">
              <label htmlFor="no1" className="col-form-label">
                No 2
              </label>
              <input
                type="number"
                className="form-control form-control-sm"
                id="no2"
                name="no2"
                value={newData.no2}
                onChange={handleValueChange}
              />
            </div>
          </div>
          <div className="col-sm-2">
            <div className="form-group">
              <label htmlFor="date" className="col-sm-10">
                Transaction Date
              </label>

              <input
                type="date"
                className="form-control form-control-sm"
                id="pending_forfeit_date"
                name="pending_forfeit_date"
                value={newData.pending_forfeit_date}
                onChange={handleValueChange}
              />
            </div>
          </div>

          <div className="col-sm-2 m-3 ml-auto">
            {/* <div className="row form-group"> */}
            {/* <div className="m-2"> */}
            {/* <input
                  type="date"
                  className="form-control form-control-sm"
                  id="pending_forfeit_date"
                  name="pending_forfeit_date"
                  value={newData.pending_forfeit_date}
                  onChange={handleValueChange}
                /> */}
            {/* <br /> */}
            <SystemButton type="load" showText method={handleSearch} />
            {/* </div> */}
            {/* </div> */}
          </div>
        </div>
      </div>

      <div>
        {isLoading.foreitList ? (
          <Loader color="#F7911D" />
        ) : (
          <>
            {entities.length ? (
              <div>
                <h6>Active Pawning</h6>
                <div
                  className="row table-responsive header-fixed-scrollable"
                  style={{ maxHeight: '400px' }}
                >
                  <table className="table table-sm table-bordered table-hover">
                    <thead className="thead-dark text-center">
                      <tr>
                        <th scope="col"></th>
                        <th scope="col">#</th>
                        <th scope="col">Bill Type</th>
                        <th scope="col">Bill No</th>
                        <th scope="col">Amount</th>
                        <th scope="col">Weight</th>
                        <th scope="col">Item</th>
                        <th scope="col">Final Date</th>
                        <th scope="col">First Month Int</th>
                        <th scope="col">Next Month Int</th>
                        <th scope="col">Paid Interest</th>
                        <th scope="col">Part Payment</th>
                        <th scope="col">Customer NIC</th>
                        <th scope="col">Customer Contact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entities.map((entity, index) => {
                        return (
                          <tr key={entity.id}>
                            <td>
                              <input
                                type="checkbox"
                                name="selected"
                                id="selected"
                                selected={selectedLoans.includes(entity.id)}
                                checked={selectedLoans.includes(entity.id)}
                                data-id={entity.id}
                                data-type="active"
                                onChange={handleLoanSelection}
                              />
                            </td>
                            <th scope="row">{parseInt(index) + 1}</th>
                            <td>{entity.bill_type.des}</td>
                            <td>{entity.bill_no}</td>
                            <td>{entity.required_amount}</td>
                            <td>{entity.total_weight}</td>
                            <td style={{ fontSize: '12px' }}>
                              {entity.loan_item
                                .map((item) => {
                                  return item.item.name;
                                })
                                .join('')}
                            </td>
                            <td>{formatDate(entity.final_date)}</td>
                            <td>{entity.fmInt}</td>
                            <td>{entity.nmInt}</td>
                            <td>{entity.paidInt}</td>
                            <td>{entity.paidCapitol}</td>
                            <td>{entity.customer.nic}</td>
                            <td>{entity.customer.telephone}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
            <br />

            {forfeitableEntities.length || entities.length ? (
              <div className="row justify-content-md-center">
                {controlDisabledStates.list.remove ? (
                  <div className="col-sm-2">
                    <button
                      className="btn btn-sm btn-outline-secondary btn-block rounded-0"
                      onClick={removeFromForfitingList}
                      disabled={!forfeitableSelectedLoans.length}
                    >
                      <span>
                        <SafeFontAwesomeIcon icon={faArrowUp} size="sm" />
                      </span>
                      &nbsp; Remove
                    </button>
                  </div>
                ) : null}
                {controlDisabledStates.list.add ? (
                  <div className="offset-1 col-sm-2">
                    <button
                      className="btn btn-sm btn-outline-info btn-block rounded-0"
                      onClick={addToForfitingList}
                      disabled={!selectedLoans.length}
                    >
                      <span>
                        <SafeFontAwesomeIcon icon={faArrowDown} size="sm" />
                      </span>
                      &nbsp; Add
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            <br />
            {forfeitableEntities.length ? (
              <div>
                <h6> List </h6>
                <div
                  className="row table-responsive header-fixed-scrollable"
                  style={{ maxHeight: '400px' }}
                >
                  <table className="table table-sm table-bordered table-hover">
                    <thead className="thead-dark text-center">
                      <tr>
                        {controlDisabledStates.list.remove ? (
                          <th scope="col"></th>
                        ) : null}
                        <th scope="col">#</th>
                        {controlDisabledStates.removelist ? (
                          <th scope="col">
                            <input
                              type="checkbox"
                              name="select_all"
                              id="select_all"
                              onChange={selectAllLetters}
                              checked={
                                forfeitableEntities.length ===
                                forfeitableDeleteSelectedLoans.length
                                  ? true
                                  : false
                              }
                            />
                          </th>
                        ) : null}

                        <th scope="col">Bill Type</th>
                        <th scope="col">Bill No</th>
                        <th scope="col">Amount</th>
                        <th scope="col">Weight</th>
                        <th scope="col">Item</th>
                        <th scope="col">Final Date</th>
                        <th scope="col">First Month Int</th>
                        <th scope="col">Next Month Int</th>
                        <th scope="col">Paid Interest</th>
                        <th scope="col">Part Payment</th>
                        <th scope="col">Customer NIC</th>
                        <th scope="col">Customer Contact</th>
                        <th scope="col">Description</th>
                        {controlDisabledStates.pending_forfeit_date ? (
                          <th scope="col">Pending Forfeit Date</th>
                        ) : null}
                        {controlDisabledStates.forfeit_date ? (
                          <th scope="col">Forfeit Date</th>
                        ) : null}
                        {controlDisabledStates.forfeit_rate ? (
                          <th scope="col">Rate</th>
                        ) : null}
                        {controlDisabledStates.status ? (
                          <th scope="col">Status</th>
                        ) : null}
                      </tr>
                    </thead>
                    <tbody>
                      {forfeitableEntities.map((entity, index) => {
                        return (
                          <tr key={entity.id}>
                            {controlDisabledStates.list.remove ? (
                              <td>
                                <input
                                  type="checkbox"
                                  name="selected"
                                  id="selected"
                                  selected={forfeitableSelectedLoans.includes(
                                    entity.id,
                                  )}
                                  checked={forfeitableSelectedLoans.includes(
                                    entity.id,
                                  )}
                                  data-id={entity.id}
                                  data-type="forfeitable"
                                  onChange={handleLoanSelection}
                                />
                              </td>
                            ) : null}
                            <th scope="row">{parseInt(index) + 1}</th>
                            {controlDisabledStates.removelist ? (
                              <td>
                                {/* <SystemButton
                                  type={'remove-row'}
                                  classes={
                                    'btn btn-outline-danger btn-sm rounded-0 shadow-sm'
                                  }
                                  method={() =>
                                    removeList([entity.id, entity.batch_no])
                                  }
                                  showText={false}
                                /> */}
                                <input
                                  type="checkbox"
                                  name="select_all"
                                  id="select_all"
                                  selected={forfeitableDeleteSelectedLoans.includes(
                                    entity.id,
                                  )}
                                  checked={forfeitableDeleteSelectedLoans.includes(
                                    entity.id,
                                  )}
                                  data-id={entity.id}
                                  onChange={selectOneLetter}
                                />
                              </td>
                            ) : null}
                            <td>{entity.bill_type.des}</td>
                            <td>{entity.bill_no}</td>
                            <td>{entity.required_amount}</td>
                            <td>{entity.total_weight}</td>
                            <td style={{ fontSize: '12px' }}>
                              {entity.loan_item
                                .map((item) => {
                                  return item.item.name;
                                })
                                .join('')}
                            </td>
                            <td>{formatDate(entity.final_date)}</td>
                            <td> {entity.fmInt}</td>
                            <td>{entity.nmInt}</td>
                            <td>{entity.paidInt}</td>
                            <td>{entity.paidCapitol}</td>

                            <td>{entity.customer.nic}</td>
                            <td>{entity.customer.telephone}</td>
                            <td>
                              {' '}
                              {controlDisabledStates.description ? (
                                <input
                                  type="text"
                                  name="description"
                                  id={forfeitingList.id}
                                  data-id={entity.id}
                                  onChange={(e) =>
                                    handleDescriptionChange(
                                      index,
                                      e.target.value,
                                    )
                                  }
                                  value={entity.note}
                                />
                              ) : (
                                entity.note
                              )}{' '}
                            </td>
                            {controlDisabledStates.pending_forfeit_date ? (
                              <td>
                                {entity.forfeit_histories
                                  ? formatDate(
                                      entity.forfeit_histories
                                        .pending_forfeit_date,
                                    )
                                  : ''}
                              </td>
                            ) : (
                              ''
                            )}
                            {controlDisabledStates.forfeit_date ? (
                              <td>
                                {entity.forfeit_histories
                                  ? formatDate(
                                      entity.forfeit_histories.forfeit_date,
                                    )
                                  : ''}
                              </td>
                            ) : (
                              ''
                            )}
                            {controlDisabledStates.forfeit_rate ? (
                              <td>
                                {entity.forfeit_rate ? (
                                  entity.forfeit_rate
                                ) : (
                                  <input
                                    type="text"
                                    name="forfeit_rate"
                                    id={forfeitingList.id}
                                    data-id={entity.id}
                                    onChange={(e) =>
                                      handleRateChange(index, e.target.value)
                                    }
                                    //  value={entity.forfeit_rate}
                                  />
                                )}
                              </td>
                            ) : (
                              ''
                            )}
                            {controlDisabledStates.status ? (
                              <td style={{ fontSize: '12px' }}>
                                {entity.type.replace(/_/g, ' ')}
                              </td>
                            ) : null}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </>
        )}
        <br />
        {forfeitableEntities.length || entities.length ? (
          <div className="row">
            <div className="offset-8 col-sm-2">
              <SystemButton type="reset" showText method={resetAll} />
            </div>
            <SystemButton
              type="no-form-save"
              showText={true}
              btnText="Remove Forfeit"
              method={removeList}
              disabled={
                !forfeitableDeleteSelectedLoans.length || deletedisabled
              }
            />
            {controlDisabledStates.saveButton ? (
              <div className="col-sm-2">
                {controlDisabledStates.savePending ? (
                  <SystemButton
                    type="no-form-save"
                    showText
                    btnText={'Mark AS Pending'}
                    method={save}
                    disabled={!forfeitableEntities.length}
                  />
                ) : null}
                {controlDisabledStates.saveForfeit ? (
                  <SystemButton
                    type="no-form-save"
                    showText
                    btnText={'Save Frofeit'}
                    method={saveforefeit}
                    disabled={!forfeitableEntities.length}
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      {/* start forfeit bills model */}
      <FormModal
        moduleName="Fofeit Bills"
        modalState={showSectionStates.toggleForfeitBills}
        toggleFormModal={toggleForfeitBills}
        width="50%"
        // baseColor="#6C757D"
      >
        <div className="modal-body">
          <div style={{ maxHeight: '500px', overflowY: 'scroll' }}>
            <table className="table table-sm table-hover">
              <thead
                class="thead-dark"
                style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  width: '100%',
                }}
              >
                <tr>
                  <th className="col-2">Date</th>
                  <th className="col-2">Batch No </th>
                  <th className="col-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {forfeitsBills.map((bill) => {
                  return (
                    <tr
                      style={{ cursor: 'pointer' }}
                      onClick={() => clickRow(bill)}
                    >
                      <td className="col-2">{bill.ddate}</td>
                      <td className="col-1">{bill.batch_no}</td>
                      <td className="col-5">
                        {bill.type == 'FORFEITED' ? (
                          <span className="badge badge-warning w-50">
                            <h6 className="mb-0">FORFE</h6>
                          </span>
                        ) : (
                          <span className="badge badge-danger w-50">
                            <h6 className="mb-0">PEN FORFE</h6>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="modal-footer">
          <div className="row">
            <button
              type="button"
              className="btn btn-outline-secondary btn-block btn-sm rounded-0 shadow-sm"
              onClick={() => toggleForfeitBills(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </FormModal>
      {/* end forfeit bills model */}
      <br />
    </div>
  );

  /* --- End of component renders --- */
};

export default Forfeits;
