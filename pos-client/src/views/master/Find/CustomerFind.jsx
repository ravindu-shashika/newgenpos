import moment from 'moment';
import React, { useState } from 'react';
import { SystemButton } from '../../../components';
import { api, msg, cookie } from '../../../services';

function CustomerFind() {
  const [customersList, setCustomersList] = useState([]);

  const [customer, setCustomer] = useState([]);

  const [searchParams, setSearchParams] = useState({
    cusFilterBy: '',
    cusSearchPhrase: '',
    cusResultCount: '5',
  });

  const [billData, setBillData] = useState({});

  const [isCusListLoading, setIsCusListLoading] = useState(false);

  const [isCusDataLoading, setIsCusDataLoading] = useState(false);

  const [isBillDataLoading, setIsBillDataLoading] = useState(false);

  const [showResults, setShowResults] = useState(false);

  const [showCustomerData, setShowCustomerData] = useState(false);

  const [showPawningData, setShowPawningData] = useState(false);

  const [showRedeemData, setShowRedeemData] = useState(false);

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

  const fetchCustomers = async (e) => {
    e.preventDefault();

    try {
      setIsCusListLoading(true);
      setShowResults(true);

      const response = await api.get(
        `find/find-customers/${searchParams.cusFilterBy}/${searchParams.cusSearchPhrase}/${searchParams.cusResultCount}`,
      );

      console.log(response.data.data);
      setCustomersList(response.data.data);

      setIsCusListLoading(false);
    } catch (error) {
      setShowResults(false);
      setIsCusListLoading(false);
      msg.error_stick(error);
    }
  };

  const fetchCustomerData = async (cusId) => {
    try {
      setIsCusDataLoading(true);
      setShowCustomerData(true);

      const response = await api.get(`find/show-customer-data/${cusId}`);

      console.log(response.data[0]);
      setCustomer(response.data[0]);

      setIsCusDataLoading(false);
    } catch (error) {
      setShowCustomerData(false);
      setIsCusDataLoading(false);
      msg.error_stick(error);
    }
  };

  const viewPawning = (dataObj) => {
    setIsBillDataLoading(true);
    setShowRedeemData(false);
    setBillData(dataObj);
    setShowPawningData(true);
    setIsBillDataLoading(false);
  };

  const viewRedemption = (dataObj) => {
    setIsBillDataLoading(true);
    setShowPawningData(false);
    setBillData(dataObj);
    setShowRedeemData(true);
    setIsBillDataLoading(false);
  };

  const resetAll = () => {
    setCustomersList([]);
    setIsCusListLoading(false);
    setIsCusDataLoading(false);
    setIsBillDataLoading(false);
    setShowResults(false);
    setShowPawningData(false);
    setShowRedeemData(false);
    setSearchParams({
      cusFilterBy: '',
      cusSearchPhrase: '',
      cusResultCount: '5',
    });
    setCustomer([]);
  };

  // const PawningData = (dataOjb) => {
  //   showRedeemData(false);
  //   showPawningData(true);

  //   return (
  //     <div>

  //     </div>
  //   );
  // };

  // const RedeemData = (dataObj) => {
  //   showRedeemData(true);
  //   showPawningData(false);

  //   return (
  //     <div>

  //     </div>
  //   );
  // };

  return (
    <div>
      <form className="compactForm" onSubmit={fetchCustomers}>
        <div className="row">
          <div className="col-sm-3">
            <div className="form-group">
              <label htmlFor="cusFilterBy">Search customer by...</label>
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
                {/* <option value="old_nic">Old NIC</option> */}
                <option value="name">Name</option>
                {/* <option value="telephone">Telephone</option> */}
              </select>
            </div>
          </div>
          <div className="col-sm-3">
            <div className="form-group">
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
          </div>
          <div className="col-sm-3">
            <div className="form-group">
              <label htmlFor="cusResultCount">Results count</label>
              <select
                name="cusResultCount"
                id="cusResultCount"
                className="form-control"
                value={searchParams.cusResultCount}
                onChange={handleValueChanges}
              >
                <option value="" disabled className="text-muted">
                  -- Select result count
                </option>
                <option value="5">Top 5</option>
                <option value="50">Top 50</option>
                <option value="200">Top 200</option>
                <option value="1000">Top 1000</option>
              </select>
            </div>
          </div>
          <div className="offset-1 col-sm-2">
            <div className="form-group">
              <SystemButton
                type="search"
                showText
                classes="btn btn-success btn-block rounded-0"
              />
            </div>
          </div>
        </div>
      </form>
      {showResults ? (
        <div>
          <br />
          {isCusListLoading ? (
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
              <h6 className="text-center">Search Results</h6>
              <br />
              <div style={{ height: '200px', overflow: 'auto' }}>
                <table
                  className="table table-sm table-hover"
                  style={{ position: 'relative' }}
                >
                  <thead>
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">NIC</th>
                      <th scope="col">Name</th>
                      <th scope="col">Address</th>
                      <th scope="col">Telephone</th>
                      <th scope="col">Blacklisted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customersList.map((entity, index) => {
                      return (
                        <tr
                          key={entity.id}
                          onClick={() => fetchCustomerData(entity.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <th scope="row">{index + 1}</th>
                          <td>{entity.nic}</td>
                          <td>{entity.name}</td>
                          <td>{entity.address_1}</td>
                          <td>{entity.telephone}</td>
                          <td className="text-center">
                            {entity.is_blacklisted ? 'Yes' : 'No'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : null}
      {showCustomerData ? (
        <div>
          <br />
          {isCusDataLoading ? (
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
              <h6 className="text-center">Details</h6>
              <br />
              <div className="row">
                <div className="col-sm-6 border rounded-0">
                  <div className="row">
                    <div className="col-sm-3 font-weight-bold">NIC</div>
                    <div className="col-sm-9">{customer.nic}</div>
                  </div>
                  <div className="row">
                    <div className="col-sm-3 font-weight-bold">Old NIC</div>
                    <div className="col-sm-9">
                      {customer.old_nic ? customer.old_nic : '----------'}
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-sm-3 font-weight-bold">Name</div>
                    <div className="col-sm-9">{customer.name}</div>
                  </div>
                  <div className="row">
                    <div className="col-sm-3 font-weight-bold">Other names</div>
                    <div className="col-sm-9">
                      {customer.other_names
                        ? customer.other_names
                        : '----------'}
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-sm-3 font-weight-bold">
                      Postal address
                    </div>
                    <div
                      className="col-sm-9"
                      style={{ wordWrap: 'break-word' }}
                    >
                      {customer.address_1}
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-sm-3 font-weight-bold">
                      Address on NIC
                    </div>
                    <div
                      className="col-sm-9"
                      style={{ overflowWrap: 'break-word' }}
                    >
                      {customer.address_2 ? customer.address_2 : '----------'}
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-sm-3 font-weight-bold">Telephone</div>
                    <div className="col-sm-9">
                      {customer.telephone ? customer.telephone : '----------'}
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-sm-3 font-weight-bold">Blacklisted</div>
                    <div className="col-sm-9">
                      {customer.is_blacklisted ? 'Yes' : 'No'}
                    </div>
                  </div>
                </div>
                <div className="col-sm-6 border rounded-0">
                  <div style={{ height: '200px', overflow: 'auto' }}>
                    <table className="table table-sm table-hover">
                      <thead className="text-center">
                        <tr>
                          <th scope="row">Status</th>
                          <th scope="row">Bill Type</th>
                          <th scope="row">Bill No</th>
                          <th scope="row">Branch</th>
                          <th scope="row">Date</th>
                          <th scope="row">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customer.loan
                          ? customer.loan.map((row) => {
                              return (
                                <tr
                                  key={row.id}
                                  onClick={() => viewPawning(row)}
                                  style={{ cursor: 'pointer' }}
                                >
                                  <th>Active</th>
                                  <th>{row.bill_type.des}</th>
                                  <th className="text-center">{row.bill_no}</th>
                                  <th>{row.branch.name}</th>
                                  <th>{row.ddate}</th>
                                  <th className="text-right">
                                    {row.loan_capital}
                                  </th>
                                </tr>
                              );
                            })
                          : null}
                        {customer.redeem
                          ? customer.redeem.map((row) => {
                              return (
                                <tr
                                  key={row.id}
                                  onClick={() => viewRedemption(row)}
                                  style={{ cursor: 'pointer' }}
                                >
                                  <th>Redeemed</th>
                                  <th>{row.bill_type.des}</th>
                                  <th className="text-center">{row.bill_no}</th>
                                  <th>{row.branch.name}</th>
                                  <th>{row.ddate}</th>
                                  <th className="text-right">
                                    {row.loan_capital}
                                  </th>
                                </tr>
                              );
                            })
                          : null}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
      {showPawningData ? (
        <div>
          <br />
          {isBillDataLoading ? (
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
              <div className="col-sm-6 border rounded-0">
                <div className="row">
                  <div className="col-sm-6 font-weight-bold">Bill Type</div>
                  <div className="col-sm-6">{billData.bill_type.des}</div>
                </div>
                <div className="row">
                  <div className="col-sm-6 font-weight-bold">Bill No</div>
                  <div className="col-sm-6">{billData.bill_no}</div>
                </div>
                <div className="row">
                  <div className="col-sm-6 font-weight-bold">Branch</div>
                  <div className="col-sm-6">{billData.branch.name}</div>
                </div>
                <div className="row">
                  <div className="col-sm-6 font-weight-bold">Pawning Date</div>
                  <div className="col-sm-6">{billData.ddate}</div>
                </div>
                <div className="row">
                  <div className="col-sm-6 font-weight-bold">Final Date</div>
                  <div className="col-sm-6">{billData.final_date}</div>
                </div>
                <div className="row">
                  <div className="col-sm-6 font-weight-bold">
                    Pawning Amount (LKR)
                  </div>
                  <div className="col-sm-6">{billData.required_amount}</div>
                </div>
                <br />
                <div className="row">
                  <div className="col-sm-6 font-weight-bold">
                    First month's interest rate (%)
                  </div>
                  <div className="col-sm-6">
                    {billData.int_rate.fm_interest_rate}
                  </div>
                </div>
                <div className="row">
                  <div className="col-sm-6 font-weight-bold">
                    Other months' interest rate (%)
                  </div>
                  <div className="col-sm-6">
                    {billData.int_rate.nm_interest_rate}
                  </div>
                </div>
                <div className="row">
                  <div className="col-sm-6 font-weight-bold">Discount days</div>
                  <div className="col-sm-6">
                    {billData.int_rate.discount_days}
                  </div>
                </div>
                <div className="row">
                  <div className="col-sm-6 font-weight-bold">
                    Discount rate (%)
                  </div>
                  <div className="col-sm-6">
                    {billData.int_rate.discount_rate}
                  </div>
                </div>
              </div>
              <div className="col-sm-6 border rounded-0">
                <div
                  className="row table-responsive"
                  style={{ height: '120px', overflow: 'auto' }}
                >
                  <table className="table table-sm">
                    <thead className="text-center">
                      <tr>
                        <th scope="col">#</th>
                        <th scope="col">Item</th>
                        <th scope="col">Condition</th>
                        <th scope="col">KT</th>
                        <th scope="col">Qty</th>
                        <th scope="col">Weight</th>
                        <th scope="col">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billData.loan_item.map((entity, index) => {
                        return (
                          <tr key={entity.id}>
                            <th scope="row">{index + 1}</th>
                            <td>{entity.item.name}</td>
                            <td>{entity.condition.description}</td>
                            <td>{entity.gold_rate.gold_types.category}</td>
                            <td>{entity.qty}</td>
                            <td className="text-right">{entity.gold_weight}</td>
                            <td className="text-right">{entity.gold_value}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="5">Total</td>
                        <td className="text-right">{billData.total_weight}</td>
                        <td className="text-right">{billData.gold_value}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <br />
                <div
                  className="row table-responsive"
                  style={{ height: '180px', overflow: 'auto' }}
                >
                  <table className="table table-sm">
                    <thead className="text-center">
                      <tr>
                        <th scope="col">#</th>
                        <th scope="col">Transaction</th>
                        <th scope="col">Date</th>
                        <th scope="col">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billData.loan_trans.map((entity, index) => {
                        return (
                          <tr key={entity.id}>
                            <th scope="row">{index + 1}</th>
                            <td>{entity.trans_type.description}</td>
                            <td>{entity.ddate}</td>
                            <td className="text-right">{entity.amount}</td>
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
      ) : null}
      {showRedeemData ? (
        <div>
          {isBillDataLoading ? (
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
              <div className="col-sm-6 border rounded-0">
                <div className="row">
                  <div className="col-sm-6 font-weight-bold">Bill Type</div>
                  <div className="col-sm-6">{billData.bill_type.des}</div>
                </div>
                <div className="row">
                  <div className="col-sm-6 font-weight-bold">Bill No</div>
                  <div className="col-sm-6">{billData.bill_no}</div>
                </div>
                <div className="row">
                  <div className="col-sm-6 font-weight-bold">Branch</div>
                  <div className="col-sm-6">{billData.branch.name}</div>
                </div>
                <div className="row">
                  <div className="col-sm-6 font-weight-bold">Pawning Date</div>
                  <div className="col-sm-6">{billData.ddate}</div>
                </div>
                <div className="row">
                  <div className="col-sm-6 font-weight-bold">Final Date</div>
                  <div className="col-sm-6">{billData.final_date}</div>
                </div>
                <div className="row">
                  <div className="col-sm-6 font-weight-bold">
                    Pawning Amount (LKR)
                  </div>
                  <div className="col-sm-6">{billData.loan_capital}</div>
                </div>
                <div className="row">
                  <div className="col-sm-6 font-weight-bold">
                    Redeem Amount (LKR)
                  </div>
                  <div className="col-sm-6">{billData.redeem_amount}</div>
                </div>
                <div className="row">
                  <div className="col-sm-6 font-weight-bold">Redeem Date</div>
                  <div className="col-sm-6">
                    {moment(billData.created_at).format('YYYY-MM-DD')}
                  </div>
                </div>
                <br />
                <div className="row">
                  <div className="col-sm-6 font-weight-bold">
                    First month's interest rate (%)
                  </div>
                  <div className="col-sm-6">
                    {billData.int_rate.fm_interest_rate}
                  </div>
                </div>
                <div className="row">
                  <div className="col-sm-6 font-weight-bold">
                    Other months' interest rate (%)
                  </div>
                  <div className="col-sm-6">
                    {billData.int_rate.nm_interest_rate}
                  </div>
                </div>
                <div className="row">
                  <div className="col-sm-6 font-weight-bold">Discount days</div>
                  <div className="col-sm-6">
                    {billData.int_rate.discount_days}
                  </div>
                </div>
                <div className="row">
                  <div className="col-sm-6 font-weight-bold">
                    Discount rate (%)
                  </div>
                  <div className="col-sm-6">
                    {billData.int_rate.discount_rate}
                  </div>
                </div>
              </div>
              <div className="col-sm-6 border rounded-0">
                <div
                  className="row table-responsive"
                  style={{ height: '120px', overflow: 'auto' }}
                >
                  <table className="table table-sm">
                    <thead className="text-center">
                      <tr>
                        <th scope="col">#</th>
                        <th scope="col">Item</th>
                        <th scope="col">Condition</th>
                        <th scope="col">KT</th>
                        <th scope="col">Qty</th>
                        <th scope="col">Weight</th>
                        <th scope="col">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billData.loan_item.map((entity, index) => {
                        return (
                          <tr key={entity.id}>
                            <th scope="row">{index + 1}</th>
                            <td>{entity.item.name}</td>
                            <td>{entity.condition.description}</td>
                            <td>{entity.gold_rate.gold_types.category}</td>
                            <td>{entity.qty}</td>
                            <td className="text-right">{entity.gold_weight}</td>
                            <td className="text-right">{entity.gold_value}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="5">Total</td>
                        <td className="text-right">{billData.total_weight}</td>
                        <td className="text-right">{billData.gold_value}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <br />
                <div
                  className="row table-responsive"
                  style={{ height: '180px', overflow: 'auto' }}
                >
                  <table className="table table-sm">
                    <thead className="text-center">
                      <tr>
                        <th scope="col">#</th>
                        <th scope="col">Transaction</th>
                        <th scope="col">Date</th>
                        <th scope="col">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billData.loan_trans.map((entity, index) => {
                        return (
                          <tr key={entity.id}>
                            <th scope="row">{index + 1}</th>
                            <td>{entity.trans_type.description}</td>
                            <td>{entity.ddate}</td>
                            <td className="text-right">{entity.amount}</td>
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
      ) : null}
    </div>
  );
}

export default CustomerFind;
