import React, { useState, useEffect } from 'react';
import { api, cookie, msg } from '../../../services';
import { FormModal, ListView, SystemButton } from '../../../components';

const BranchWiseBillTypeDetails = () => {
  // Module name
  const moduleName = 'Branch-wise Bill Type Details';

  /* --- State declarationss --- */

  const [searchParams, setSearchParams] = useState({
    branch: '',
  });

  const [branches, setBranches] = useState([]);

  const [billTypes, setBillTypes] = useState([]);

  const [interestRates, setInterestRates] = useState([]);

  const [goldRates, setGoldRates] = useState([]);
  // Data loading status
  const [isLoading, setIsLoading] = useState({
    main: false,
    relatedData: false,
  });

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
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue = targetInput.value;

    if (inputName === 'branch') {
      fetchBillTypeDetails(inputValue);
    }

    setSearchParams({
      ...searchParams,
      [inputName]: inputValue,
    });
  };

  const fetchBillTypeDetails = async (branchId) => {
    setIsLoading({
      ...isLoading,
      main: true,
    });
    try {
      const response = await api.get(`all-bill-type-det-by-branch/${branchId}`);
      setBillTypes(response.data);
      console.log(response.data);
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

  const fetchRelatedData = async (billTypeId) => {
    setIsLoading({
      ...isLoading,
      relatedData: true,
    });

    billTypes.forEach((billType) => {
      if (billType.id == billTypeId) {
        setInterestRates(billType.bill_type.int_rate);
        setGoldRates(billType.bill_type.gold_rate);
      }
    });

    setIsLoading({
      ...isLoading,
      relatedData: false,
    });
  };

  // const resetAll = () => {
  //   setAllBranchesBillTypes([]);

  //   setTransactions([
  //     {
  //       pawningTrans: [],
  //       partPaymentTrans: [],
  //       redeemTrans: [],
  //     },
  //   ]);

  //   setPawningData({
  //     loan_id: '',
  //     customer: [],
  //     items: [],
  //     branch_id: '',
  //     bill_type_id: '',
  //     bill_no: '',
  //   });

  //   setIsLoading(false);
  // };

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
          <div className="d-flex justify-content-center">
            <div className="spinner-border text-primary" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
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
                  <select
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
                  </select>
                </div>
              </div>
            </div>
          </div>
          <br />
          <div className="row table-responsive header-fixed-scrollable">
            <table className="table table-sm table-hover table-bordered">
              <thead className="thead-light text-center">
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Bill Type</th>
                  <th scope="col">Max Bill Number</th>
                  <th scope="col">Interest Rates Template</th>
                  <th scope="col">Gold Rates Template</th>
                  <th scope="col">Status</th>
                  <th scope="col">Created At</th>
                </tr>
              </thead>
              <tbody>
                {billTypes.map((billType, index) => {
                  return (
                    <tr
                      key={billType.id}
                      onClick={() => fetchRelatedData(billType.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <th className="text-center">
                        {parseInt(index) + parseInt(1)}
                      </th>
                      <td>{billType.bill_type.des}</td>
                      <td className="text-right">{billType.bill_count}</td>
                      <td>{billType.bill_type.int_rate[0].des}</td>
                      <td>{billType.bill_type.gold_rate[0].des}</td>
                      <td className="text-center">
                        {billType.is_active ? 'Active' : 'Inactive'}
                      </td>
                      <td className="text-center">{billType.created_at}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <br />
          <hr />
          <br />
          {isLoading.relatedData ? (
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
            <div className="row">
              <div className="col-sm-9">
                <h5>Interest Rates</h5>
                <div className="row table-responsive header-fixed-scrollable">
                  <table className="table table-sm table-hover table-bordered">
                    <thead className="thead-light text-center">
                      <tr>
                        <th scope="col">#</th>
                        <th scope="col">From Amount(LKR)</th>
                        <th scope="col">To Amount(LKR)</th>
                        <th scope="col">First Month Interest(%)</th>
                        <th scope="col">Next Months' Interest(%)</th>
                        <th scope="col">Discount Period</th>
                        <th scope="col">Discount Rate(%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {interestRates.map((int, index) => {
                        return (
                          <tr key={int.id}>
                            <th className="text-center">
                              {parseInt(index) + parseInt(1)}
                            </th>
                            <td className="text-right">{int.from_amount}</td>
                            <td className="text-right">{int.to_amount}</td>
                            <td className="text-center">
                              {int.fm_interest_rate}
                            </td>
                            <td className="text-center">
                              {int.nm_interest_rate}
                            </td>
                            <td className="text-center">
                              {`${int.discount_days} days`}
                            </td>
                            <td className="text-center">{int.discount_rate}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="col-sm-3">
                <h5>Gold Rates</h5>
                <div className="row table-responsive header-fixed-scrollable">
                  <table className="table table-sm table-hover table-bordered">
                    <thead className="thead-light text-center">
                      <tr>
                        <th scope="col">#</th>
                        <th scope="col">Gold Type</th>
                        <th scope="col">Rate (LKR)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {goldRates.map((rate, index) => {
                        return (
                          <tr key={rate.id}>
                            <th className="text-center">
                              {parseInt(index) + parseInt(1)}
                            </th>
                            <td>{rate.gold_types.category}</td>
                            <td className="text-right">{rate.rate}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BranchWiseBillTypeDetails;
