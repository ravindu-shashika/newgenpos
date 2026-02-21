import React, { useState, useEffect } from 'react';
import { api, msg, cookie } from '../../services';
import moment from 'moment';
import { SystemButton, FormModal, SDD } from '../../components';
import Select from 'react-select';

const Backdate = () => {
  // Module name
  const moduleName = 'Backdate';

  const btnText = 'Select Branches';

  const [searchName, setSearchName] = useState('');

  const [selectedBranchList, setSelectedBranchList] = useState([]);

  // Data loading status
  const [isLoading, setIsLoading] = useState(false);

  const [newData, setNewData] = useState({
    date: '',
    trans_date: moment().format(`YYYY-MM-DD`),
    effected_branches: [],
    user_id: cookie.get('user_id'),
  });

  const [branchList, setBranchList] = useState([]);

  const [userChoice, setUserChoice] = useState([]);

  const [sortList, setSortList] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  /* --- Component functions --- */
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`branch_list`);
      if (response.status == 200) {
        setBranchList(response.data);
        setSortList(response.data);
      }
    } catch (error) {
      msg.error('Unable to fetch data!');
      return console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleValueChange = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue = targetInput.value;
    if (inputName == 'date') {
      setNewData({
        ...newData,
        date: inputValue,
      });
    }
    if (inputName == 'trans_date') {
      setNewData({
        ...newData,
        trans_date: inputValue,
      });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (newData.date == '' || newData.trans_date == '') {
      msg.error('Select Dates');
    } else {
      if (newData.effected_branches.length > 0) {
        await save();
        resetForm();
      } else {
        msg.error('You should have to select at least one branch');
      }
    }
  };

  const handleBlur = (e) => {
    setNewData({
      ...newData,
      effected_branches: userChoice,
    });
  };

  const save = async () => {
    try {
      const response = await api.post(`save-backdate-branch`).values(newData);

      if (response.data.status == 200) {
        localStorage.setItem('new_date', newData.date);
        msg.success('Updated Successfully');
        resetAll();
      } else {
        msg.error('Error Updating');
      }
    } catch (error) {
      msg.error(error);
      return console.log(error);
    } finally {
      // setShowConfirmationModal(false);
    }
  };

  const resetAll = () => {
    setNewData({
      date: '',
      trans_date: moment().format(`YYYY-MM-DD`),
      effected_branches: [],
      user_id: cookie.get('user_id'),
    });
    setUserChoice([]);
  };

  const resetForm = () => {
    setNewData({
      date: '',
      trans_date: moment().format(`YYYY-MM-DD`),
      effected_branches: [],
      user_id: cookie.get('user_id'),
    });
    setUserChoice([]);
  };

  /* --- End of component functions --- */

  /* --- Component renders --- */

  return (
    <div>
      <h3 className="text-center">{moduleName}</h3>
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
        <div className="container">
          {/* <div className='row justify-content-center'>
                    <div className="col-sm-6">
                        <h1 className='text-center'>
                            Under Construction
                        </h1>
                    </div>
                </div> */}
          <form
            onSubmit={handleSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.preventDefault();
            }}
            className="compactForm"
          >
            <div className="row justify-content-center">
              <div className="col-sm-10">
                <div className="card">
                  <div className="card-body">
                    <div className="form-group row">
                      <label
                        htmlFor="search_branch"
                        className="col-sm-3 col-form-label"
                      >
                        Backdate
                      </label>
                      <div className="col-sm-3">
                        <input
                          type="date"
                          className="form-control col-sm-12"
                          id="date"
                          name="date"
                          placeholder="date"
                          value={newData.date}
                          onChange={handleValueChange}
                        />
                      </div>
                    </div>
                    <div className="form-group row">
                      <label
                        htmlFor="search_branch"
                        className="col-sm-3 col-form-label"
                      >
                        Transaction Date
                      </label>
                      <div className="col-sm-3">
                        <input
                          type="date"
                          className="form-control col-sm-12"
                          id="trans_date"
                          name="trans_date"
                          placeholder="trans_date"
                          value={newData.trans_date}
                          onChange={handleValueChange}
                          readOnly
                        />
                      </div>
                    </div>
                    <div className="form-group row">
                      <label
                        htmlFor="branch_list"
                        className="col-sm-3 col-form-label"
                      >
                        Branch List
                      </label>
                    </div>
                    <div className="">
                      <Select
                        isMulti
                        closeMenuOnSelect={false}
                        id="to_branch_ids"
                        name="to_branch_ids"
                        options={sortList.map((branch) => ({
                          value: branch.id,
                          id: branch.id,
                          label: branch.code + ' - ' + branch.name,
                        }))}
                        className="basic-multi-select"
                        classNamePrefix="select"
                        onChange={(choice) => setUserChoice(choice)}
                        onBlur={handleBlur}
                        value={userChoice}
                      />
                    </div>

                    <div className="row justify-content-center">
                      <div className="col-sm-4">
                        <SystemButton type={'save'} showText={true} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
          <br />
        </div>
      )}
    </div>
  );
  /* --- End of component renders --- */
};

export default Backdate;
