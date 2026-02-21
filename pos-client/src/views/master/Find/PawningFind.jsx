import React, { useState } from 'react';
import moment from 'moment';
import { SystemButton, UnderDevelopment } from '../../../components';
import { api, msg } from '../../../services';

function PawningFind() {
  const [pawningSearch, setPawningSearch] = useState({
    fromDate: moment().format(`YYYY-MM-DD`),
    toDate: moment().format(`YYYY-MM-DD`),
    billState: 'P',
  });

  const [billList, setBillList] = useState([]);

  const [billKeys, setBillKeys] = useState([]);

  const [billData, setBillData] = useState([]);

  const [isLoading, setIsLoading] = useState({
    resultSet: false,
    singleResult: false,
  });

  const [showSectionStates, setShowSectionStates] = useState({
    showResultsSection: false,
    showSingleBillSection: false,
  });

  const handleValueChanges = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue =
      targetInput.type === 'checkbox' ? targetInput.checked : targetInput.value;

    setPawningSearch({
      ...pawningSearch,
      [inputName]: inputValue,
    });
  };

  const fetchLoans = async (e) => {
    e.preventDefault();

    try {
      setIsLoading({
        ...isLoading,
        resultSet: true,
      });

      setShowSectionStates({
        ...showSectionStates,
        showResultsSection: true,
      });

      const response = await api
        .post(`find/find-pawning`)
        .values(pawningSearch);

      console.log(response.data);
      if (response.data.message) {
        msg.error(response.data.message);
      } else {
        setBillKeys(Object.keys(response.data));
        setBillList(response.data);
      }

      setIsLoading({
        ...isLoading,
        resultSet: false,
      });
    } catch (error) {
      setIsLoading({
        ...isLoading,
        resultSet: false,
      });

      setShowSectionStates({
        ...showSectionStates,
        showResultsSection: false,
      });
      msg.error_stick(error);
    }
  };

  const fetchBillData = async (billId, billType) => {
    try {
      setIsLoading({
        ...isLoading,
        singleResult: true,
      });
      setShowSectionStates({
        ...showSectionStates,
        showSingleBillSection: true,
      });
      const response = await api.get(
        `find/show-bill-data/${billId}/${billType}`,
      );

      setBillData(response.data[0]);

      console.log(response.data[0]);

      setIsLoading({
        ...isLoading,
        singleResult: false,
      });
    } catch (error) {
      setIsLoading({
        ...isLoading,
        singleResult: false,
      });
      setShowSectionStates({
        ...showSectionStates,
        showSingleBillSection: false,
      });
      msg.error_stick(error);
    }
  };

  return (
    <div>
      {isLoading.pawningList ? (
        <div>
          <br />
          <br />
          <div className="d-flex justify-content-center">
            <div className="spinner-border text-primary" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* <UnderDevelopment /> */}

      <form className="compactForm" onSubmit={fetchLoans}>
        <div className="row">
          <div className="col-sm-2">
            <div className="form-group">
              <label htmlFor="fromDate">From Date</label>
              <input
                type="date"
                name="fromDate"
                id="fromDate"
                className="form-control form-control-sm text-right"
                value={pawningSearch.fromDate}
                onChange={handleValueChanges}
              />
            </div>
          </div>
          <div className="col-sm-2">
            <div className="form-group">
              <label htmlFor="toDate">To Date</label>
              <input
                type="date"
                name="toDate"
                id="toDate"
                className="form-control form-control-sm text-right"
                value={pawningSearch.toDate}
                onChange={handleValueChanges}
              />
            </div>
          </div>
          <div className="col-sm-2">
            <div className="form-group">
              <label htmlFor="billState">Status</label>
              <select
                name="billState"
                id="billState"
                className="form-control form-control-sm"
                value={pawningSearch.billState}
                onChange={handleValueChanges}
              >
                <option value="" disabled className="text-muted">
                  -- Select a state
                </option>
                <option value="P">Pawning</option>
                <option value="R">Redeemed</option>
                <option value="C">Canceled</option>
                <option value="F">Forfieted</option>
              </select>
            </div>
          </div>
        </div>
        <div className="row justify-content-end">
          <div className="col-sm-2">
            <SystemButton type="search" showText />
          </div>
        </div>
      </form>
      {showSectionStates.showResultsSection ? (
        <div>
          <hr />
          {isLoading.resultSet ? (
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
              <div style={{ height: '300px', overflow: 'auto' }}>
                <table
                  className="table table-sm table-hover"
                  style={{ position: 'relative' }}
                >
                  <thead>
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">Type</th>
                      <th scope="col">Branch</th>
                      <th scope="col">Bill type</th>
                      <th scope="col">Bill number</th>
                      <th scope="col">Date</th>
                      <th scope="col">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billKeys.map((type) => {
                      return billList[type].map((entity, index) => {
                        return (
                          <tr
                            key={entity.id}
                            onClick={() => fetchBillData(entity.id, type)}
                            style={{ cursor: 'pointer' }}
                          >
                            <th scope="row">{index + 1}</th>
                            <td>{type}</td>
                            <td>{entity.branch.name}</td>
                            <td>{entity.bill_type.des}</td>
                            <td>{entity.bill_no}</td>
                            <td>{entity.ddate}</td>
                            <td>{entity.required_amount}</td>
                          </tr>
                        );
                      });
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {showSectionStates.showSingleBillSection ? (
        <div>
          <br />
          {isLoading.singleResult ? (
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
                  <div className="col-sm-3 font-weight-bold">NIC</div>
                  <div className="col-sm-9">{billData.customer.nic}</div>
                </div>
                <div className="row">
                  <div className="col-sm-3 font-weight-bold">Old NIC</div>
                  <div className="col-sm-9">
                    {billData.customer.old_nic
                      ? billData.customer.old_nic
                      : '----------'}
                  </div>
                </div>
                <div className="row">
                  <div className="col-sm-3 font-weight-bold">Name</div>
                  <div className="col-sm-9">{billData.customer.name}</div>
                </div>
                <div className="row">
                  <div className="col-sm-3 font-weight-bold">Other names</div>
                  <div className="col-sm-9">
                    {billData.customer.other_names
                      ? billData.customer.other_names
                      : '----------'}
                  </div>
                </div>
                <div className="row">
                  <div className="col-sm-3 font-weight-bold">
                    Postal address
                  </div>
                  <div className="col-sm-9" style={{ wordWrap: 'break-word' }}>
                    {billData.customer.address_1}
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
                    {billData.customer.address_2
                      ? billData.customer.address_2
                      : '----------'}
                  </div>
                </div>
                <div className="row">
                  <div className="col-sm-3 font-weight-bold">Telephone</div>
                  <div className="col-sm-9">
                    {billData.customer.telephone
                      ? billData.customer.telephone
                      : '----------'}
                  </div>
                </div>
                <div className="row">
                  <div className="col-sm-3 font-weight-bold">Blacklisted</div>
                  <div className="col-sm-9">
                    {billData.customer.is_blacklisted ? 'Yes' : 'No'}
                  </div>
                </div>
                <hr />
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
                <hr />
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

export default PawningFind;
