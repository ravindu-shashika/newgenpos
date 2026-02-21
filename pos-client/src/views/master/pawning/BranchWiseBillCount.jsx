import React, { useState, useEffect } from 'react';
import { api, msg } from '../../../services';
import { Loader, SystemButton } from '../../../components';
import Select from 'react-select';

const BranchWiseBillCount = () => {
  // Module name
  const moduleName = 'Branch-wise Bill Count Change';

  /* --- State declarationss --- */

  const [searchParams, setSearchParams] = useState({
    branch: '',
    bill_type: '',
  });
  const [selectedId, setSelectedId] = useState('');

  const [branches, setBranches] = useState([]);

  const [billTypes, setBillTypes] = useState([]);

  const [interestRates, setInterestRates] = useState([]);

  const [goldRates, setGoldRates] = useState([]);
  // Data loading status
  const [isLoading, setIsLoading] = useState({
    main: false,
    relatedData: false,
  });

  const [saveButtonDisabled, setSaveButtonDisabled] = useState(false);

  const [currentBranch, setCurrentBranch] = useState({});

  /* --- End of state declarations --- */

  useEffect(() => {
    fetchData();
  }, []);

  /* --- Component functions --- */

  const fetchData = async () => {
    setIsLoading({
      ...isLoading,
      main: true,
    });
    try {
      const response = await api.get(`all-branches`);
      setBranches(response.data);
    } catch (error) {
      msg.error('Unable to fetch data!');
      return console.log(error);
    } finally {
      setIsLoading({
        ...isLoading,
        main: false,
      });
    }
  };

  const handleSearchValueChange = (e) => {
    // console.log(e);
    const targetInput = e.target;
    // const inputName = targetInput.name;
    // const inputValue = targetInput.value;
    const inputValue = e.value;

    // if (inputName === 'branch') {
    fetchBillTypeDetails(inputValue);
    // }

    setCurrentBranch({
      value: inputValue,
      label: e.label,
    });

    // setSearchParams({
    //   ...searchParams,
    //   [inputName]: inputValue,
    // });
  };

  const fetchBillTypeDetails = async (branchId) => {
    setIsLoading({
      ...isLoading,
      main: true,
    });
    try {
      const response = await api.get(`all-bill-count-by-branch/${branchId}`);

      console.log(response.data);
      setSelectedId(branchId);
      setBillTypes(response.data);

      setIsLoading({
        ...isLoading,
        relatedData: true,
      });
    } catch (error) {
      msg.error('Unable to fetch data!');
      return console.log(error);
    } finally {
      // setIsLoading({
      //   ...isLoading,
      //   main: false,
      // });
    }
  };

  const save = async () => {
    const response = await api
      .update(`bill-count-change/${selectedId}/update`)
      .values({ billcounts: billTypes });
    if (response.status == 200 && response.data.status == 200) {
      msg.success(response.data.message);
      resetAll();
    } else if (response.status == 200 && response.data.status == 500) {
      msg.error(response.data.message);
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
  };

  const handleSubmit = async (event) => {
    setSaveButtonDisabled(true);
    event.preventDefault();

    await save();
  };

  const handleBillCountChange = (index, newValue) => {
    // Clone the billTypes array to avoid mutating the original state
    const updatedBillTypes = [...billTypes];

    // Update the bill_count for the specific index
    updatedBillTypes[index].bill_count = newValue;

    // Update the state with the new billTypes array
    setBillTypes(updatedBillTypes); // Assuming you're using useState for billTypes
  };
  // const fetchRelatedData = async (billTypeId) => {
  //   setIsLoading({
  //     ...isLoading,
  //     relatedData: true,
  //   });

  //   billTypes.forEach((billType) => {
  //     if (billType.id == billTypeId) {
  //       setInterestRates(billType.bill_type.int_rate);
  //       setGoldRates(billType.bill_type.gold_rate);
  //       setSearchParams({
  //         ...searchParams,
  //         bill_type: billType.bill_type.des,
  //       });
  //     }
  //   });

  //   setIsLoading({
  //     ...isLoading,
  //     relatedData: false,
  //   });
  // };

  const resetAll = () => {
    setSaveButtonDisabled(false);
    setCurrentBranch([]);
    setBillTypes([]);
    setIsLoading({
      main: false,
      relatedData: false,
    });
  };

  /* --- End of component functions --- */

  /* --- Component renders --- */

  return (
    <div>
      <h3 className="text-center">{moduleName}</h3>
      <br />
      {isLoading.main ? (
        <div>
          <br />
          <br />
          <Loader />
          {/* <div className="d-flex justify-content-center">
            <div className="spinner-border text-primary" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          </div> */}
        </div>
      ) : (
        <div className="container">
          <div className="row compactForm">
            <div className="col-sm-4">
              <div className="form-group row">
                <label
                  htmlFor="search_branch"
                  className="col-sm-3 col-form-label"
                >
                  Branch
                </label>
                <div className="col-sm-9">
                  {/* <select
                    type="text"
                    className="form-control drop-toggle"
                    id="branch"
                    name="branch"
                    placeholder="Type"
                    value={searchParams.branch}
                    onChange={handleSearchValueChange}
                  >
                    <option
                      value=""
                      className="drop-item text-muted text-light"
                      disabled
                    >
                      -- Select a branch
                    </option>
                    {branches.map((branch) => {
                      return (
                        <option
                          className="drop-item"
                          key={branch.id}
                          value={branch.id}
                        >
                          {branch.code} - {branch.name}
                        </option>
                      );
                    })}
                  </select> */}
                  <Select
                    name="branch"
                    id="branch"
                    selectAllLabel={'All Branches'}
                    options={branches.map((branch) => ({
                      value: branch.id,
                      label: `${branch.code} - ${branch.name}`,
                    }))}
                    // value={currentBranch}
                    // onChange={handleValueChangeselect}
                    value={currentBranch}
                    onChange={handleSearchValueChange}
                  />
                </div>
              </div>
            </div>
          </div>
          <br />
          <form
            onSubmit={handleSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.preventDefault();
            }}
            className="compactForm"
          >
            <div className="row table-responsive ">
              <table className="table table-sm table-bordered">
                <thead className="thead-light text-center">
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Bill Type</th>
                    <th scope="col">Current Bill Count</th>
                  </tr>
                </thead>
                <tbody>
                  {billTypes.map((billType, index) => {
                    return (
                      <tr key={billType.id}>
                        <th className="text-center">
                          {parseInt(index) + parseInt(1)}
                        </th>
                        <td className="text-center">
                          {billType.bill_type.des}
                        </td>
                        <td className="text-left">
                          <input
                            type="text"
                            name="bill_count"
                            className="form-control-sm"
                            value={billType.bill_count}
                            onChange={(e) =>
                              handleBillCountChange(index, e.target.value)
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {isLoading.relatedData ? (
                <SystemButton
                  type={'save'}
                  showText={true}
                  disabled={saveButtonDisabled}
                />
              ) : (
                ''
              )}
            </div>
          </form>
          <br />
          <hr />
          <br />
        </div>
      )}
    </div>
  );
};

export default BranchWiseBillCount;
