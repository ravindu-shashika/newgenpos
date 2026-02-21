import React, { useState, useEffect } from 'react';
import { api, msg, cookie } from '../../services';
import {
  FormModal,
  ListView,
  SystemButton,
  ProgressBar,
} from '../../components';

const CustomerLimit = () => {
  //Module name
  const moduleName = 'CustomerLimit';

  /* --- State declarationss --- */

  // Data states
  const [entities, setEntities] = useState([]);

  const [newData, setNewData] = useState({
    title: '',
    name: '',
    nic: '',
    old_nic: '',
    address_1: '',
    address_2: '',
    telephone: '',
    notes: '',
    is_blacklisted: 0,
    branch_id: cookie.get('user_branch'),
    user_id: cookie.get('user_id'),
    set_new_as_main: false,
  });

  // Data loading status
  const [isLoading, setIsLoading] = useState(false);

  const [isLoadAllCustomers, setIsLoadAllCustomers] = useState(false);

  // Form modal state
  const [showModalState, setShowModalState] = useState(false);

  // Data edit state
  const [isEdit, setIsEdit] = useState(false);

  // Selected data
  const [selectedId, setSelectedId] = useState('');

  // hide save button
  const [hideSaveBtn, setHideSaveBtn] = useState(false);

  const [allow_to_blacklist, setAllowtoBlacklist] = useState(false);

  const [totalCustomers, setTotalCustomers] = useState(0);
  const [listedCustomers, setListedCustomers] = useState(0);
  const [listLoadingProgress, setListLoadingProgress] = useState(0);

  const [btnText, setButtonText] = useState('Save');

  const [searchParams, setSearchParams] = useState({
    cusFilterBy: '',
    cusSearchPhrase: '',
  });

  const handleValueChanges = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue =
      targetInput.type === 'checkbox' ? targetInput.checked : targetInput.value;

    setSearchParams({
      ...searchParams,
      [inputName]: inputValue,
    });
  };
  // List view states
  let dataColumns = [
    { title: 'NIC', name: 'nic', searchable: true, haveData: true },
    { title: 'Name', name: 'name', searchable: true, haveData: true },
    { title: 'Address', name: 'address_1', searchable: true, haveData: true },
    { title: 'Telephone', name: 'telephone', searchable: true, haveData: true },
    { title: 'Branch', name: 'branch', searchable: true, haveData: true },
    {
      title: 'Allow Max Bills',
      name: 'allowed_bills',
      searchable: true,
      haveData: true,
    },
    // { title: 'User', name: 'user', searchable: true, haveData: true },
    // { title: 'Action', name: 'action', searchable: true, haveData: false },
  ];
  let dataRows = [];

  const resetAll = () => {
    setEntities([]);
    setSearchParams({
      cusFilterBy: '',
      cusSearchPhrase: '',
    });
  };

  // List of districts
  // const districtsList = [
  //     'Jaffna',
  //     'Kilinochchi',
  //     'Mannar',
  //     'Mullaitivu',
  //     'Vavuniya',
  //     'Puttalam',
  //     'Kurunegala',
  //     'Gampaha',
  //     'Colombo',
  //     'Kalutara',
  //     'Matale',
  //     'Kandy',
  //     'Nuwara Eliya',
  //     'Kegalle',
  //     'Ratnapura',
  //     'Trincomalee',
  //     'Batticaloa',
  //     'Ampara',
  //     'Badulla',
  //     'Monaragala',
  //     'Hambantota',
  //     'Matara',
  //     'Galle'
  //   ];

  /* --- End of state declarations --- */

  useEffect(() => {
    fetchData();
  }, []);

  // useEffect(() => {
  //   const percentage =
  //     (parseFloat(listedCustomers) / parseFloat(totalCustomers)) * 100;
  //   console.log('percentage : ' + percentage);
  //   setListLoadingProgress(percentage);
  // }, [totalCustomers, listedCustomers]);

  useEffect(() => {
    // if (showModalState === false) {
    //   resetForm();
    // }
  }, [showModalState]);

  /* --- Component functions --- */

  const fetchData = async () => {
    // console.log('fetch data');
  };

  const fetchCustomers = async (e) => {
    e.preventDefault();
    try {
      //   setIsLoading(true);
      setHideSaveBtn(false);

      const response = await api.get(
        `customers/${searchParams.cusFilterBy}/${searchParams.cusSearchPhrase}`,
      );
      dataRows = [];

      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err[0]);
        });
        return;
      }
      setTotalCustomers(response.data.length);
      console.log(response);
      let row_count = 0;
      response.data.map((entity, index) => {
        row_count++;

        return dataRows.push({
          title: entity.title,
          id: entity.id,
          nic: entity.nic,
          old_nic: entity.old_nic,
          name: entity.title + ' ' + entity.name,
          name_edit: entity.name,
          address_1: entity.address_1 ? entity.address_1 : '',
          address_2: entity.address_2 ? entity.address_2 : '',
          telephone: entity.telephone ? entity.telephone : '',
          notes: entity.notes ? entity.notes : '',
          is_blacklisted: entity.is_blacklisted,
          allowed_bills: entity.allowed_bills,
          branch: entity.branch.name,
          user: entity.user ? entity.user.name : '',
          last_modified: entity.updated_at.slice(0, 10),
          is_deleted: entity.is_deleted,
          allow_blacklist: entity.allow_blacklist,
          allow_delete: entity.allow_delete,
          allow_edit: entity.allow_edit,
        });
      });

      setEntities(dataRows);
      //   setIsLoadAllCustomers(true);

      //   setIsLoading(false);
    } catch (error) {
      //   setIsLoading(false);
      console.log(error);
      msg.error('Unable to fetch data!');
    }
  };

  const searchAndFetch = async (searchPhrase, selectedColumn) => {
    // try {
    //   setIsLoading(true);
    //   const response = await api.get(
    //     `customers/search/${searchPhrase}/${selectedColumn}`,
    //   );
    //   dataRows = [];
    //   if (response.data.total === 0) {
    //     msg.warning(`No results returned your search!`);
    //   } else {
    //     response.data.data.map((entity) => {
    //       return dataRows.push({
    //         title: entity.title,
    //         id: entity.id,
    //         nic: entity.nic,
    //         old_nic: entity.old_nic,
    //         name: entity.name,
    //         address_1: entity.address_1,
    //         address_2: entity.address_2,
    //         telephone: entity.telephone,
    //         notes: entity.notes,
    //         is_blacklisted: entity.is_blacklisted,
    //       });
    //     });
    //     setEntities(dataRows);
    //   }
    //   setIsLoading(false);
    // } catch (error) {
    //   msg.error('Unable to search data!');
    //   setIsLoading(false);
    // }
  };

  const toggleFormModal = () => {
    setShowModalState(!showModalState);
    if (showModalState == false) {
      setButtonText('Save');
      setNewData({
        title: '',
        name: '',
        nic: '',
        old_nic: '',
        address_1: '',
        address_2: '',
        telephone: '',
        notes: '',
        is_blacklisted: 0,
        branch_id: cookie.get('user_branch'),
        user_id: cookie.get('user_id'),
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    await submitData();
    // setNewData({
    //   title: '',
    //   name: '',
    //   nic: '',
    //   old_nic: '',
    //   address_1: '',
    //   address_2: '',
    //   telephone: '',
    //   notes: '',
    //   is_blacklisted: 0,
    //   branch_id: cookie.get('user_branch'),
    //   user_id: cookie.get('user_id'),
    // });

    // fetchData();
  };

  const updateCustomerDataInState = (customerId, updatedData) => {
    setEntities((prevEntities) =>
      prevEntities.map((entity) =>
        entity.id === customerId ? { ...entity, ...updatedData } : entity,
      ),
    );
  };

  const editRow = async (dataObj) => {
    setButtonText('Save Changes');
    setShowModalState(true);
    setNewData({
      ...newData,
      title: dataObj.title,
      name: dataObj.name_edit,
      nic: dataObj.nic,
      old_nic: dataObj.old_nic,
      address_1: dataObj.address_1,
      address_2: dataObj.address_2,
      telephone: dataObj.telephone,
      notes: dataObj.notes,
      is_blacklisted: dataObj.is_blacklisted,
      allowed_bills: dataObj.allowed_bills,
      allow_blacklist: dataObj.allow_blacklist,
    });
    setIsEdit(true);
    setSelectedId(dataObj.id);
  };

  const deleteRow = async (dataObj) => {
    try {
      console.log('delete id' + dataObj.nic);
      const response = await api.delete(`customers/${dataObj.id}`);
      msg.success(response.data);
    } catch (error) {
    } finally {
      fetchData();
      resetAll();
    }
  };

  const handleValueChange = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue =
      targetInput.type === 'checkbox' ? targetInput.checked : targetInput.value;
    if (inputName == 'address_1' || inputName == 'address_2') {
      setNewData({
        ...newData,
        [inputName]: inputValue.toUpperCase(),
      });
    } else if (inputName == 'name') {
      const { value } = e.target;
      const onlyAlphabet = /^[A-Za-z.\s]+$/;
      if (onlyAlphabet.test(value) || value === '') {
        setNewData({
          ...newData,
          [inputName]: value,
        });
      }
    } else {
      setNewData({
        ...newData,
        [inputName]: inputValue,
      });
    }
  };

  const changeNewToMain = (e) => {
    const { checked } = e.target;
    if (checked) {
      // If checkbox is checked, set old_nic value to nic field
      setNewData((prevData) => ({
        ...prevData,
        nic: prevData.old_nic,
        old_nic: prevData.nic,
        set_new_as_main: true,
      }));
    } else {
      // If checkbox is unchecked, clear nic field
      setNewData((prevData) => ({
        ...prevData,
        nic: prevData.old_nic,
        old_nic: prevData.nic,
        set_new_as_main: false,
      }));
    }
  };

  const checkMobileNumber = async (e) => {
    e = e ? e : window.event;
    var charCode = e.which ? e.which : e.keyCode;
    if (
      charCode > 31 &&
      (charCode < 48 || charCode > 57) &&
      charCode !== 46 &&
      charCode !== 44
    ) {
      e.preventDefault();
    } else {
      return true;
    }
  };

  const submitData = async () => {
    console.log('addbtn', newData);
    if (isEdit === false) {
      setHideSaveBtn(true);
      console.log('save data---------------------------');
      console.log(newData);
      let status = false;
      if (newData.nic) {
        entities.filter((Entity) => {
          if (Entity.nic === newData.nic) {
            status = true;
            msg.error('Already Added !..');
            setShowModalState(false);
          }
        });
      }
      if (status == false) {
        const response = await api.post('customers').values(newData);
        console.log(response);
        if (response.status == 200 && response.data.status == 200) {
          msg.success(response.data.message);

          setNewData({
            title: '',
            name: '',
            nic: '',
            old_nic: '',
            address_1: '',
            address_2: '',
            telephone: '',
            notes: '',
            is_blacklisted: 0,
            branch_id: cookie.get('user_branch'),
            user_id: cookie.get('user_id'),
          });

          fetchData();
          setShowModalState(false);
        } else if (response.status == 200 && response.data.status == 400) {
          msg.warning(response.data.message);
        } else if (response.status == 200 && response.data.status == 500) {
          msg.error(response.data.message);
        } else {
          msg.error('Something went wrong...');
        }
      }
      setHideSaveBtn(false);
    } else {
      setHideSaveBtn(true);
      const response = await api
        .update(`customers/${selectedId}/update`)
        .values(newData);

      if (response.status == 200 && response.data.status == 200) {
        msg.success(response.data.message);
        setIsEdit(false);
        setSelectedId('');
        updateCustomerDataInState(selectedId, newData);
        setNewData({
          title: '',
          name: '',
          nic: '',
          old_nic: '',
          address_1: '',
          address_2: '',
          telephone: '',
          notes: '',
          is_blacklisted: 0,
          branch_id: cookie.get('user_branch'),
          user_id: cookie.get('user_id'),
        });
        // setIsLoadAllCustomers(false);
        fetchData();

        //  console.log('feth');
        setShowModalState(false);
      } else if (response.status == 200 && response.data.status == 400) {
        msg.warning(response.data.message);
      } else if (response.status == 200 && response.data.status == 500) {
        msg.error(response.data.message);
      } else {
        msg.error('Something went wrong...');
      }
      setHideSaveBtn(false);
      resetAll();
    }
  };

  const resetForm = () => {
    setNewData({
      title: '',
      name: '',
      nic: '',
      old_nic: '',
      address_1: '',
      address_2: '',
      telephone: '',
      notes: '',
      is_blacklisted: 0,
      branch_id: cookie.get('user_branch'),
      user_id: cookie.get('user_id'),
    });
    setIsEdit(false);
    // setIsLoadAllCustomers(false);
  };

  const resetSearch = () => {
    setEntities([]);

    fetchData();
  };

  const editCustomer = () => {
    alert('click edit customer');
  };

  const handleDelete = (itemId) => {
    // Handle delete logic here
    console.log(`Delete item with ID: ${itemId}`);
  };

  const handleEdit = (itemId) => {
    // Handle edit logic here
    console.log(`Edit item with ID: ${itemId}`);
  };

  /* --- End of component functions --- */

  /* --- Component renders --- */

  return (
    <div>
      <h5 className="text-center">{moduleName}</h5>
      <br />
      <form className="compactForm" onSubmit={fetchCustomers}>
        <div className="row">
          <div className="form-group col-sm-2">
            <label htmlFor="cusFilterBy">Search customer..</label>
            <select
              name="cusFilterBy"
              id="cusFilterBy"
              className="form-control"
              value={searchParams.cusFilterBy}
              onChange={handleValueChanges}
            >
              <option value="" disabled className="text-muted">
                -- Select a filter
              </option>
              <option value="nic">NIC</option>
              <option value="name">Name</option>
            </select>
          </div>
          <div className="form-group col-sm-2">
            <label htmlFor="cusSearchPhrase">Search for...</label>
            <input
              type="text"
              name="cusSearchPhrase"
              id="cusSearchPhrase"
              className="form-control form-control-sm"
              value={searchParams.cusSearchPhrase}
              onChange={handleValueChanges}
            />
          </div>
          <div className="form-group col-sm-2 mt-3">
            <SystemButton type="search" showText />
          </div>
          <div className="form-group col-sm-2 mt-3">
            <SystemButton
              type="reset"
              showText={true}
              btnText="Clear All"
              method={resetAll}
            />
          </div>
        </div>
      </form>
      {/* Modal componenet */}
      <FormModal
        moduleName={moduleName}
        modalState={showModalState}
        toggleFormModal={toggleFormModal}
      >
        <form onSubmit={handleSubmit} className="compactForm">
          <div className="modal-body">
            <div className="row">
              <div className="col-sm-3">
                <label htmlFor="title">Customer Title</label>
                <select
                  className="custom-select"
                  id="title"
                  name="title"
                  onChange={handleValueChange}
                  disabled
                >
                  <option value="" selected>
                    Select Title...
                  </option>
                  <option value="MS." selected={newData.title == 'MS.'}>
                    MS.
                  </option>
                  <option value="MRS." selected={newData.title == 'MRS.'}>
                    MRS.
                  </option>
                  <option value="MR." selected={newData.title == 'MR.'}>
                    MR.
                  </option>
                  <option value="MISS." selected={newData.title == 'MISS.'}>
                    MISS.
                  </option>
                </select>
              </div>
              <div className="form-group col-sm-7">
                <label htmlFor="name">Customer Name</label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  className="form-control input-sm"
                  value={newData.name}
                  onChange={handleValueChange}
                  disabled
                />
              </div>
            </div>

            <div className="row">
              <div className="col-3">
                <div className="form-group">
                  <label htmlFor="telephone">Telephone Number</label>
                  <input
                    type="text"
                    name="telephone"
                    id="telephone"
                    maxLength="35"
                    minLength="9"
                    className="form-control input-sm"
                    value={newData.telephone}
                    onChange={handleValueChange}
                    onKeyPress={checkMobileNumber}
                    disabled
                  />
                </div>
              </div>

              <div className="form-group col-3">
                <label htmlFor="nic">NIC</label>
                <input
                  type="text"
                  name="nic"
                  id="nic"
                  maxLength="12"
                  minLength="10"
                  className="form-control input-sm"
                  value={newData.nic}
                  onChange={handleValueChange}
                  disabled
                />
              </div>

              <div className="form-group col-3">
                <label htmlFor="bills">Allowed Bills</label>
                <input
                  type="number"
                  name="allowed_bills"
                  id="allowed_bills"
                  className="form-control input-sm"
                  value={newData.allowed_bills}
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
            <SystemButton
              type={'save'}
              btnText={btnText}
              showText={true}
              disabled={hideSaveBtn}
            />
          </div>
        </form>
      </FormModal>
      {/* End of modal componenet */}
      <br />
      <br />
      {isLoadAllCustomers ? (
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
        <ListView
          columns={dataColumns}
          rows={entities}
          edit={editRow}
          loadingState={isLoading}
          // searchAndFetch={searchAndFetch}
          actionsColumn={true}
          showEditButton={true}
          // showDeleteButton={false}
          // resetSearch={resetSearch}
        />
        // <DataTable
        //   dataList={entities}
        //   editProduct={editRow}
        //   deletecus={deleteRow}
        // ></DataTable>
      )}
      {/* List view componenet */}

      {/* <table id="myTable" className="display">
        <thead>
            <tr>
                {
                    dataColumns.map(column => {
                       return <th>{ column.title }</th>
                    })
                }
            </tr>
        </thead>
        <tbody>
            {
                entities.map(row => {
                    return (
                        <tr>
                            <td>{row.nic}</td>
                            <td>{row.name}</td>
                            <td>{row.address_1}</td>
                            <td>{row.telephone}</td>
                            <td>{row.branch}</td>
                            <td>{row.last_modified}</td>
                        </tr>
                    )
                })
            }
        </tbody>
    </table> */}
      {/* {
                <div>
                    <input type="text" value={listLoadingProgress}/>
                    <h1>Data Loading Progress: {listLoadingProgress.toFixed(2)}%</h1>
                    <progress value={listedCustomers} max={totalCustomers}></progress>
                </div> */}
      {/* } */}

      {/* End of list view component */}
    </div>
  );

  /* --- End of component renders --- */
};

export default CustomerLimit;
