import React, { useState, useEffect } from 'react';
import { api, msg } from '../../../services';
import { Loader } from '../../../components';
import moment from 'moment';

const BranchWiseBillTypeDetails = () => {
  // Module name
  const moduleName = 'Branch-wise Interest Rate Details';

  /* --- State declarationss --- */

  const [searchParams, setSearchParams] = useState({
    type: 'branch',
    branch: '',
    templateId: '',
  });

  const [branches, setBranches] = useState([]);

  const [templates, setTemplates] = useState([]);

  const [billTypes, setBillTypes] = useState([]);

  const [interestRates, setInterestRates] = useState([]);

  const [goldRates, setGoldRates] = useState([]);
  // Data loading status
  const [isLoading, setIsLoading] = useState({
    main: false,
    relatedData: false,
    allInterests: false,
    allBranches: false,
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
      const response = await api.get(`interest-rate-details`);
      console.log(response);
      setBranches(response.data.branches);
      setTemplates(response.data.interestRates);
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

    setSearchParams({
      ...searchParams,
      [inputName]: inputValue,
    });
  };

  const fetchAllInterestsByBranch = async () => {
    setIsLoading({
      ...isLoading,
      allInterests: true,
    });

    const response = await api.get(
      `all-interest-rates-by-branch/${searchParams.branch}`,
    );

    console.log(response);

    setInterestRates(response.data.interestRates);
    setBillTypes(response.data.billTypes);
    setSearchParams({
      ...searchParams,
      templateId: '',
    });

    setIsLoading({
      ...isLoading,
      allInterests: false,
    });
  };

  const fetchAllBranchesByInterest = async () => {
    setIsLoading({
      ...isLoading,
      allInterests: true,
    });

    const response = await api.get(
      `all-branches-by-interest/${searchParams.templateId}`,
    );

    setInterestRates(response.data.interestRates);
    setBillTypes(response.data.billTypes);
    setSearchParams({
      ...searchParams,
      branch: '',
    });

    setIsLoading({
      ...isLoading,
      allInterests: false,
    });

    msg.info_stick(searchParams.templateId);
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
        </div>
      ) : (
        <div className="container">
          <div className="row compactForm">
            <div className="col-sm-4">
              <div className="btn-group" role="group" aria-label="Search by">
                <button
                  type="button"
                  className={
                    searchParams.type === 'branch'
                      ? 'btn btn-sm btn-info rounded-0'
                      : 'btn btn-sm btn-outline-secondary rounded-0'
                  }
                  onClick={() => {
                    setSearchParams({ ...searchParams, type: 'branch' });
                  }}
                >
                  Search by Branch
                </button>
                <button
                  type="button"
                  className={
                    searchParams.type === 'interest'
                      ? 'btn btn-sm btn-info rounded-0'
                      : 'btn btn-sm btn-outline-secondary rounded-0'
                  }
                  onClick={() => {
                    setSearchParams({
                      ...searchParams,
                      type: 'interest',
                    });
                  }}
                >
                  Search by Interest Rate
                </button>
              </div>
            </div>
            {searchParams.type === 'branch' ? (
              <div className="col-sm-5">
                <div className="form-group row">
                  <label
                    htmlFor="search_branch"
                    className="col-sm-2 col-form-label"
                  >
                    Branch
                  </label>
                  <div className="col-sm-10">
                    <select
                      type="text"
                      className="form-control drop-toggle"
                      id="branch"
                      name="branch"
                      placeholder="Type"
                      value={searchParams.branch}
                      onChange={handleSearchValueChange}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          fetchAllInterestsByBranch();
                        }
                      }}
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
            ) : (
              <div className="col-sm-5">
                <div className="form-group row">
                  <label
                    htmlFor="search_branch"
                    className="col-sm-2 col-form-label"
                  >
                    Template
                  </label>
                  <div className="col-sm-10">
                    <select
                      name="templateId"
                      id="templateId"
                      className="form-control"
                      value={searchParams.templateId}
                      onChange={handleSearchValueChange}
                    >
                      <option value="" className="text-mute" disabled>
                        -- Select template
                      </option>
                      {templates.map((template) => {
                        return (
                          <option
                            value={template.template_id}
                            key={template.id}
                          >
                            {template.des} -{' '}
                            {moment(template.created_at).format('YYYY-MM-DD')}
                          </option>
                        );
                      })}
                    </select>
                    {/* <input
                      type="text"
                      name="templateId"
                      id="templateId"
                      list="templateList"
                      className="form-control"
                      value={searchParams.templateId}
                      onChange={handleSearchValueChange}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          fetchAllBranchesByInterest();
                        }
                      }}
                    />
                    <datalist id="templateList">
                      {templates.map((template) => {
                        return (
                          <option
                            value={`${template.des} - ${moment(
                              template.created_at,
                            ).format('YYYY-MM-DD')}`}
                            key={template.id}
                          />
                        );
                      })}
                    </datalist> */}
                  </div>
                </div>
              </div>
            )}
            <div className="offset-1 col-sm-2">
              <button
                type="button"
                className="btn btn-sm btn-success btn-block rounded-0"
                onClick={() => {
                  searchParams.type === 'branch'
                    ? fetchAllInterestsByBranch()
                    : fetchAllBranchesByInterest();
                }}
              >
                Search
              </button>
            </div>
            {/* <div className="col-sm-2">
              <button
                type="button"
                className="btn btn-sm btn-danger btn-block"
                onClick={() => {
                  searchParams.type === 'branch'
                    ? fetchAllInterestsByBranch()
                    : fetchAllBranchesByInterest();
                }}
              >
                Reset
              </button>
            </div> */}
          </div>
          <br />
          {/* <div className="row table-responsive header-fixed-scrollable">
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
          <br /> */}
          {isLoading.allBranches ? (
            <Loader />
          ) : (
            <div>
              {interestRates.map((interest) => {
                return (
                  <div className="row" key={interest.id}>
                    <div className="col-sm-9">
                      <h5>
                        <span style={{ float: 'right' }}>
                          <div className="led-box">
                            {interest.int_rate[0].is_active ? (
                              <div>
                                <div className="led-green"></div>
                              </div>
                            ) : (
                              <div>
                                <div className="led-red"></div>
                              </div>
                            )}
                          </div>
                          &nbsp;
                          {interest.int_rate[0].is_active
                            ? 'Active'
                            : 'Inactive'}
                        </span>
                        {interest.int_rate[0].des}
                      </h5>
                      <div
                        className="row table-responsive header-fixed-scrollable"
                        style={{ maxHeight: 'max-content' }}
                      >
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
                            {interest.int_rate.map((int, index) => {
                              return (
                                <tr key={int.id}>
                                  <th className="text-center">
                                    {parseInt(index) + parseInt(1)}
                                  </th>
                                  <td className="text-right">
                                    {int.from_amount}
                                  </td>
                                  <td className="text-right">
                                    {int.to_amount}
                                  </td>
                                  <td className="text-center">
                                    {int.fm_interest_rate}
                                  </td>
                                  <td className="text-center">
                                    {int.nm_interest_rate}
                                  </td>
                                  <td className="text-center">
                                    {`${int.discount_days} days`}
                                  </td>
                                  <td className="text-center">
                                    {int.discount_rate}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <br />
                    </div>
                    <div className="col-sm-3">
                      <h5 className="text-right">Assigned to...</h5>
                      <div className="row">
                        {billTypes.map((billType) => {
                          if (
                            billType.int_rate_template_id ===
                            interest.int_rate_template_id
                          ) {
                            return (
                              <div
                                className="col-sm-6 text-right"
                                key={billType.id}
                              >
                                {billType.des}
                              </div>
                            );
                          }
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BranchWiseBillTypeDetails;
