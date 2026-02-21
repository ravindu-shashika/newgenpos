import React, { useState } from 'react';
import { api, cookie, msg } from './../../services';
import moment from 'moment';
import { SystemButton, Loader } from '../../components';
import { SafeFontAwesomeIcon } from '../../components';
import { faBackward, faForward } from '@fortawesome/free-solid-svg-icons';

const BillChange = () => {
  const [isLoading, setIsLoading] = useState({
    init: false,
    oldCustomer: false,
    oldHistory: false,
    newCustomer: false,
    newHistory: false,
  });

  const [oldCustomer, setOldCustomer] = useState({
    branch_id: cookie.get('user_branch'),
    nic: '',
    old_nic: '',
    id: '',
    name: '',
    other_names: '',
    address_1: '',
    address_2: '',
    telephone: '',
    notes: '',
    allowed_bills: '',
    is_blacklisted: false,
  });

  const [newCustomer, setNewCustomer] = useState({
    branch_id: cookie.get('user_branch'),
    nic: '',
    old_nic: '',
    id: '',
    name: '',
    other_names: '',
    address_1: '',
    address_2: '',
    telephone: '',
    notes: '',
    allowed_bills: '',
    is_blacklisted: false,
  });

  const [oldLoansHistory, setOldLoansHistory] = useState([]);

  const [newLoansHistory, setNewLoansHistory] = useState([]);

  const [transferingBills, setTransferingBills] = useState([]);

  const handleOldCustomerValueChanges = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue =
      targetInput.type === 'checkbox' ? targetInput.checked : targetInput.value;

    if (inputName === 'old_nic') {
      setOldCustomer({
        ...oldCustomer,
        nic: inputValue,
      });
    }
  };

  const handleNewCustomerValueChanges = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue =
      targetInput.type === 'checkbox' ? targetInput.checked : targetInput.value;

    if (inputName === 'new_nic') {
      setNewCustomer({
        ...newCustomer,
        nic: inputValue,
      });
    }
  };

  const handleCustomerSearch = async (type) => {
    if (type === 'old') {
      if (oldCustomer.nic !== newCustomer.nic) {
        setIsLoading({
          ...isLoading,
          oldCustomer: true,
        });

        const response = await api.get(`showCustomer/${oldCustomer.nic}`);

        if (response.data.errMessage) {
          msg.error(response.data.errMessage);

          if (response.data.blacklisted) {
            msg.info_stick(response.data.blacklisted);
          }
        } else {
          setOldCustomer({
            ...oldCustomer,
            old_nic: response.data[0].old_nic,
            id: response.data[0].id,
            name: response.data[0].name,
            other_names: response.data[0].other_names,
            address_1: response.data[0].address_1,
            address_2: response.data[0].address_2,
            telephone: response.data[0].telephone,
            notes: response.data[0].notes,
            allowed_bills: response.data[0].allowed_bills,
            is_blacklisted: response.data[0].is_blacklisted,
          });

          setIsLoading({
            ...isLoading,
            oldCustomer: false,
            oldHistory: true,
          });

          const custHistory = await api.get(
            `cust-history/${response.data[0].id}`,
          );

          setOldLoansHistory({
            ...oldLoansHistory,
            loans: custHistory.data[0].loan,
            redeem_count: custHistory.data[0].redeem_count,
            other_count: custHistory.data[0].other_count,
            redeemed_total: custHistory.data.redeemedAmountTot,
            pawning_total: custHistory.data.pawningAmountTot,
          });

          setIsLoading({
            ...isLoading,
            oldHistory: false,
          });
        }
      } else {
        msg.warning('Cannot load the same customer on both sides');
      }
    }

    if (type === 'new') {
      if (oldCustomer.nic !== newCustomer.nic) {
        setIsLoading({
          ...isLoading,
          newCustomer: true,
        });

        const response = await api.get(`showCustomer/${newCustomer.nic}`);

        if (response.data.errMessage) {
          msg.error(response.data.errMessage);

          if (response.data.blacklisted) {
            msg.info_stick(response.data.blacklisted);
          }
        } else {
          setNewCustomer({
            ...newCustomer,
            old_nic: response.data[0].old_nic,
            id: response.data[0].id,
            name: response.data[0].name,
            other_names: response.data[0].other_names,
            address_1: response.data[0].address_1,
            address_2: response.data[0].address_2,
            telephone: response.data[0].telephone,
            notes: response.data[0].notes,
            allowed_bills: response.data[0].allowed_bills,
            is_blacklisted: response.data[0].is_blacklisted,
          });

          setIsLoading({
            ...isLoading,
            newCustomer: false,
            newHistory: true,
          });

          const custHistory = await api.get(
            `cust-history/${response.data[0].id}`,
          );

          setNewLoansHistory({
            ...oldLoansHistory,
            loans: custHistory.data[0].loan,
            redeem_count: custHistory.data[0].redeem_count,
            other_count: custHistory.data[0].other_count,
            redeemed_total: custHistory.data.redeemedAmountTot,
            pawning_total: custHistory.data.pawningAmountTot,
          });

          setIsLoading({
            ...isLoading,
            newHistory: false,
          });
        }
      } else {
        msg.warning('Cannot load the same customer on both sides');
      }
    }
  };

  const transferBill = (loanObj) => {
    if (newCustomer.name) {
      setNewLoansHistory({
        ...newLoansHistory,
        loans: [...newLoansHistory.loans, loanObj],
      });

      setTransferingBills([...transferingBills, loanObj.id]);

      setOldLoansHistory({
        ...oldLoansHistory,
        loans: oldLoansHistory.loans.filter((row) => row !== loanObj),
      });

      console.log('transfering bills', transferingBills);
    } else {
      msg.warning('Please load a customer to transfer first');
    }
  };

  const revertBill = (loanObj) => {
    if (newCustomer.name) {
      setOldLoansHistory({
        ...oldLoansHistory,
        loans: [...oldLoansHistory.loans, loanObj],
      });

      setTransferingBills(
        transferingBills.filter((loan) => loan !== loanObj.id),
      );

      setNewLoansHistory({
        ...newLoansHistory,
        loans: newLoansHistory.loans.filter((row) => row !== loanObj),
      });

      console.log('transfering bills', transferingBills);
    } else {
      msg.warning('Please load a customer to transfer first');
    }
  };

  const handleSubmit = async () => {
    const response = await api.post('change-bill-owner').values({
      transferringLoans: transferingBills,
      newCustomer: newCustomer.id,
    });

    console.log(response);

    if (response.data.errMessage) {
      msg.error(response.data.errMessage);
      return;
    } else {
      msg.success(response.data);
      resetAll();
      return;
    }
  };

  const resetAll = () => {
    setIsLoading({
      init: false,
      oldCustomer: false,
      oldHistory: false,
      newCustomer: false,
      newHistory: false,
    });

    setOldCustomer({
      branch_id: cookie.get('user_branch'),
      nic: '',
      old_nic: '',
      id: '',
      name: '',
      other_names: '',
      address_1: '',
      address_2: '',
      telephone: '',
      notes: '',
      allowed_bills: '',
      is_blacklisted: false,
    });

    setNewCustomer({
      branch_id: cookie.get('user_branch'),
      nic: '',
      old_nic: '',
      id: '',
      name: '',
      other_names: '',
      address_1: '',
      address_2: '',
      telephone: '',
      notes: '',
      allowed_bills: '',
      is_blacklisted: false,
    });

    setOldLoansHistory([]);

    setNewLoansHistory([]);

    setTransferingBills([]);
  };

  return (
    <div>
      <div className="row compactForm">
        {/* Left column */}
        <div className="col-sm-6 section-wrap">
          <div className="form-group row">
            <div className="col-sm-6">
              <h5>Original</h5>
            </div>
          </div>
          <div>
            <div className="form-group row">
              <label htmlFor="old_nic" className="col-sm-4 col-form-label">
                NIC Number
              </label>
              <div className="col-sm-8">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  id="old_nic"
                  name="old_nic"
                  placeholder="NIC number"
                  value={oldCustomer.nic ?? ''}
                  onChange={handleOldCustomerValueChanges}
                  onKeyUp={(e) => {
                    if (e.keyCode === 13) handleCustomerSearch('old');
                  }}
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="form-group row">
              <label htmlFor="old_old_nic" className="col-sm-4 col-form-label">
                Old NIC
              </label>
              <div className="col-sm-8">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  id="old_old_nic"
                  name="old_old_nic"
                  placeholder="Old NIC number"
                  value={oldCustomer.old_nic ?? ''}
                  readOnly
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="form-group row">
              <label htmlFor="old_name" className="col-sm-4 col-form-label">
                Name
              </label>
              <div className="col-sm-8">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  id="old_name"
                  name="old_name"
                  placeholder="Full name"
                  value={oldCustomer.name ?? ''}
                  readOnly
                />
              </div>
            </div>

            <div className="form-group row">
              <label
                htmlFor="old_other_names"
                className="col-sm-4 col-form-label"
              >
                Other Names
              </label>
              <div className="col-sm-8">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  id="old_other_names"
                  name="old_other_names"
                  placeholder="Other names"
                  value={oldCustomer.other_names ?? ''}
                  readOnly
                />
              </div>
            </div>

            <div className="form-group row">
              <label
                htmlFor="old_address_1"
                className="col-sm-4 col-form-label"
              >
                Postal Address
              </label>
              <div className="col-sm-8">
                <textarea
                  className="form-control form-control-sm rounded-0"
                  rows="1"
                  id="old_address_1"
                  name="old_address_1"
                  placeholder="Postal address"
                  value={oldCustomer.address_1 ?? ''}
                  readOnly
                ></textarea>
              </div>
            </div>

            <div className="form-group row">
              <label
                htmlFor="old_address_2"
                className="col-sm-4 col-form-label"
              >
                Address on NIC
              </label>
              <div className="col-sm-8">
                <textarea
                  className="form-control form-control-sm rounded-0"
                  rows="1"
                  id="old_address_2"
                  name="old_address_2"
                  placeholder="Address on NIC"
                  value={oldCustomer.address_2 ?? ''}
                  readOnly
                ></textarea>
              </div>
            </div>

            <div className="form-group row">
              <label
                htmlFor="old_telephone"
                className="col-sm-4 col-form-label"
              >
                Telephone
              </label>
              <div className="col-sm-8">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  id="old_telephone"
                  name="old_telephone"
                  placeholder="Telephone"
                  value={oldCustomer.telephone ?? ''}
                  readOnly
                />
              </div>
            </div>

            <div className="form-group row">
              <label htmlFor="old_notes" className="col-sm-4 col-form-label">
                Notes
              </label>
              <div className="col-sm-8">
                <textarea
                  id="old_notes"
                  name="old_notes"
                  rows="1"
                  className="form-control form-control-sm rounded-0"
                  value={oldCustomer.notes ?? ''}
                  readOnly
                ></textarea>
              </div>
            </div>
          </div>

          <hr />

          <div
            className="row"
            style={{
              padding: '10px',
            }}
          >
            <div
              className="table-responsive"
              style={{
                height: '200px',
                overflowY: 'auto',
              }}
            >
              <table className="table table-bordered table-sm table-hover">
                <thead className="thead-light">
                  <tr>
                    <th scope="col" className="text-center">
                      #
                    </th>
                    <th scope="col" className="text-center">
                      Branch
                    </th>
                    <th scope="col" className="text-center">
                      Bill Type
                    </th>
                    <th scope="col" className="text-center">
                      No
                    </th>
                    <th scope="col" className="text-center">
                      Date
                    </th>
                    <th scope="col" className="text-center">
                      Gold Weight
                    </th>
                    <th scope="col" className="text-center">
                      Loan Amount
                    </th>
                    {/* <th scope="col">State</th> */}
                  </tr>
                </thead>
                <tbody>
                  {oldLoansHistory.loans ? (
                    oldLoansHistory.loans.map((loan, index) => {
                      return (
                        <tr key={loan.id}>
                          <td>{index + 1}</td>
                          <td>{loan.branch.name}</td>
                          <td>{loan.bill_type.des}</td>
                          <td>{loan.bill_no}</td>
                          <td>{loan.ddate}</td>
                          <td className="text-right">{loan.total_weight}</td>
                          <td className="text-right">{loan.required_amount}</td>
                          <td
                            className="text-center"
                            style={{ cursor: 'pointer' }}
                            onClick={() => transferBill(loan)}
                          >
                            <span>
                              <SafeFontAwesomeIcon
                                icon={faForward}
                                size="lg"
                                color="purple"
                              />
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center">
                        No data
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="col-sm-6 section-wrap">
          <div className="form-group row">
            <div className="col-sm-6">
              <h5>Transfer To...</h5>
            </div>
          </div>
          <div>
            <div className="form-group row">
              <label htmlFor="new_nic" className="col-sm-4 col-form-label">
                NIC Number
              </label>
              <div className="col-sm-8">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  id="new_nic"
                  name="new_nic"
                  placeholder="NIC number"
                  value={newCustomer.nic ?? ''}
                  onChange={handleNewCustomerValueChanges}
                  onKeyUp={(e) => {
                    if (e.keyCode === 13) handleCustomerSearch('new');
                  }}
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="form-group row">
              <label htmlFor="new_old_nic" className="col-sm-4 col-form-label">
                Old NIC
              </label>
              <div className="col-sm-8">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  id="new_old_nic"
                  name="new_old_nic"
                  placeholder="Old NIC number"
                  value={newCustomer.old_nic ?? ''}
                  readOnly
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="form-group row">
              <label htmlFor="new_name" className="col-sm-4 col-form-label">
                Name
              </label>
              <div className="col-sm-8">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  id="new_name"
                  name="new_name"
                  placeholder="Full name"
                  value={newCustomer.name ?? ''}
                  readOnly
                />
              </div>
            </div>

            <div className="form-group row">
              <label
                htmlFor="new_other_names"
                className="col-sm-4 col-form-label"
              >
                Other Names
              </label>
              <div className="col-sm-8">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  id="new_other_names"
                  name="new_other_names"
                  placeholder="Other names"
                  value={newCustomer.other_names ?? ''}
                  readOnly
                />
              </div>
            </div>

            <div className="form-group row">
              <label
                htmlFor="new_address_1"
                className="col-sm-4 col-form-label"
              >
                Postal Address
              </label>
              <div className="col-sm-8">
                <textarea
                  className="form-control form-control-sm rounded-0"
                  rows="1"
                  id="new_address_1"
                  name="new_address_1"
                  placeholder="Postal address"
                  value={newCustomer.address_1 ?? ''}
                  readOnly
                ></textarea>
              </div>
            </div>

            <div className="form-group row">
              <label
                htmlFor="new_address_2"
                className="col-sm-4 col-form-label"
              >
                Address on NIC
              </label>
              <div className="col-sm-8">
                <textarea
                  className="form-control form-control-sm rounded-0"
                  rows="1"
                  id="new_address_2"
                  name="new_address_2"
                  placeholder="Address on NIC"
                  value={newCustomer.address_2 ?? ''}
                  readOnly
                ></textarea>
              </div>
            </div>

            <div className="form-group row">
              <label
                htmlFor="new_telephone"
                className="col-sm-4 col-form-label"
              >
                Telephone
              </label>
              <div className="col-sm-8">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  id="new_telephone"
                  name="new_telephone"
                  placeholder="Telephone"
                  value={newCustomer.telephone ?? ''}
                  readOnly
                />
              </div>
            </div>

            <div className="form-group row">
              <label htmlFor="new_notes" className="col-sm-4 col-form-label">
                Notes
              </label>
              <div className="col-sm-8">
                <textarea
                  id="new_notes"
                  name="new_notes"
                  rows="1"
                  className="form-control form-control-sm rounded-0"
                  value={newCustomer.notes ?? ''}
                  readOnly
                ></textarea>
              </div>
            </div>
          </div>

          <hr />

          <div
            className="row"
            style={{
              padding: '10px',
            }}
          >
            <div
              className="table-responsive"
              style={{
                height: '200px',
                overflowY: 'auto',
              }}
            >
              <table className="table table-bordered table-sm table-hover">
                <thead className="thead-light">
                  <tr>
                    <th scope="col" className="text-center">
                      #
                    </th>
                    <th scope="col" className="text-center">
                      Branch
                    </th>
                    <th scope="col" className="text-center">
                      Bill Type
                    </th>
                    <th scope="col" className="text-center">
                      No
                    </th>
                    <th scope="col" className="text-center">
                      Date
                    </th>
                    <th scope="col" className="text-center">
                      Gold Weight
                    </th>
                    <th scope="col" className="text-center">
                      Loan Amount
                    </th>
                    {/* <th scope="col">State</th> */}
                  </tr>
                </thead>
                <tbody>
                  {newLoansHistory.loans ? (
                    newLoansHistory.loans.map((loan, index) => {
                      return (
                        <tr key={loan.id}>
                          <td>{index + 1}</td>
                          <td>{loan.branch.name}</td>
                          <td>{loan.bill_type.des}</td>
                          <td>{loan.bill_no}</td>
                          <td>{loan.ddate}</td>
                          <td className="text-right">{loan.total_weight}</td>
                          <td className="text-right">{loan.required_amount}</td>
                          {transferingBills.includes(loan.id) ? (
                            <td
                              className="text-center"
                              style={{ cursor: 'pointer' }}
                              onClick={() => revertBill(loan)}
                            >
                              <span>
                                <SafeFontAwesomeIcon
                                  icon={faBackward}
                                  size="lg"
                                  color="purple"
                                />
                              </span>
                            </td>
                          ) : null}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center">
                        No data
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <br />
      <div className="row justify-content-end">
        <div className="col-sm-2">
          <SystemButton type="reset" showText={true} method={resetAll} />
        </div>
        <div className="col-sm-2">
          <SystemButton
            type="no-form-save"
            showText
            btnText={'Save'}
            disabled={!transferingBills.length}
            method={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
};

export default BillChange;
