import React, { useState, useEffect } from 'react';
import { api, msg, cookie } from '../../services';
import DataTable from 'react-data-table-component';
import { SafeFontAwesomeIcon } from '../../components';
import { faBan, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { FormModal, SystemButton } from '../../components';

const CustomerApprovals = ({ countAgain }) => {
  /* --- State declarationss --- */

  const [newLoanApproval, setNewLoanApproval] = useState({
    id: '',
    status: 'APPROVED',
    comment: '',
    releasedBy: cookie.get('user_id'),
  });

  const columns = [
    {
      name: 'Reference',
      selector: 'ref',
      sortable: true,
    },
    {
      name: 'Branch',
      selector: 'branch',
      sortable: true,
    },
    {
      name: 'NIC',
      selector: 'nic',
      sortable: true,
    },
    {
      name: 'Customer',
      selector: 'customer',
      sortable: true,
    },
    {
      name: 'Telephone',
      selector: 'telephone',
    },
    {
      name: 'Loan Count',
      selector: 'loan_count',
      sortable: true,
    },
    {
      name: 'Requested By',
      selector: 'requested_by',
      wrap: true,
      sortable: true,
    },
  ];

  const [isLoading, setIsLoading] = useState(false);

  const [loanApprovalRows, setLoanApprovalRows] = useState([
    {
      id: '',
      ref: '',
      branch: '',
      nic: '',
      customer: '',
      address_1: '',
      address_2: '',
      telephone: '',
      note: '',
      loans: [
        {
          id: '',
          amount: '',
          ddate: '',
          status: '',
        },
      ],
      requested_by: '',
    },
  ]);

  const [showLoanHistory, setShowLoanHistory] = useState(false);

  const [loanHistory, setLoanHistory] = useState({
    loans: [],
    redeems: [],
    others: [],
  });

  let tempRows = [];

  let pawningTotal = 0;
  let redeemTotal = 0;

  /* --- End of state declarations --- */

  useEffect(() => {
    fetchData();
  }, []);

  /* --- Component functions --- */

  const fetchData = async () => {
    try {
      setIsLoading(true);

      tempRows = [];

      const response = await api.get(`showCustReleaseRequsets`);

      console.log(response);

      response.data.map((row) => {
        tempRows.push({
          id: row.id,
          ref: row.id,
          branch: row.branch.name,
          nic: row.customer.nic,
          customer: row.customer.name,
          address_1: row.customer.address_1,
          address_2: row.customer.address_2,
          telephone: row.customer.telephone,
          note: row.customer.note,
          loans: row.customer.loan,
          redeems: row.customer.redeem,
          others: row.customer.other,
          requested_by: row.user.name,
          loan_count: row.customer.loan.length,
        });
      });

      setLoanApprovalRows(tempRows);
    } catch (error) {
      msg.error('Unable to fetch data!');
      return console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleHistoryModal = () => {
    pawningTotal = 0;
    redeemTotal = 0;

    setShowLoanHistory(!showLoanHistory);
  };

  const handleValueChange = (e) => {
    const targetInput = e.target;
    const datasetId = targetInput.dataset.id;
    const inputName = targetInput.name;
    const inputValue = targetInput.value;

    if (inputName === 'comment') {
      setNewLoanApproval({
        ...newLoanApproval,
        id: datasetId,
        comment: inputValue,
      });
    }
  };

  const validator = async () => {
    if (!newLoanApproval.allowedBills) {
      return {
        state: true,
      };
    } else {
      return {
        state: true,
      };
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validated = await validator();

    if (validated.state) {
      await save();
    } else {
      msg.error(validated.message);
      return;
    }
  };

  const save = async () => {
    try {
      const response = await api
        .post(`approveRequsetCustRelease`)
        .values(newLoanApproval);
      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err[0]);
        });
        return;
      }
      msg.success(response.data);
    } catch (error) {
      msg.error(error);
      return console.log(error);
    } finally {
      resetAll();
      fetchData();
      countAgain();
    }
  };

  const handleReject = async (id) => {
    try {
      const response = await api.delete(`rejectRequsetCustRelease/` + id);

      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err[0]);
        });
        return;
      }
      msg.success('Rejected Successfully..!');
    } catch (error) {
      msg.error(error);
      return console.log(error);
    } finally {
      resetAll();
      fetchData();
      countAgain();
    }
  };

  const LoanApprovalDetails = ({ data }) => {
    return (
      <div className="light_div">
        <div className="row">
          <div className="col-sm-6">
            <div className="form-group row">
              <label htmlFor="ref" className="col-sm-5 col-form-label">
                Reference Number
              </label>
              <div className="col-sm-7">
                <input
                  type="text"
                  className="form-control-plaintext form-control-sm font-weight-bold"
                  id="ref"
                  name="ref"
                  value={data.ref}
                  readOnly
                />
              </div>
            </div>
            <div className="form-group row">
              <label htmlFor="branch" className="col-sm-5 col-form-label">
                Requested branch
              </label>
              <div className="col-sm-7">
                <input
                  type="text"
                  className="form-control-plaintext form-control-sm font-weight-bold"
                  id="branch"
                  name="branch"
                  value={data.branch}
                  readOnly
                />
              </div>
            </div>
            <div className="form-group row">
              <label htmlFor="requested_by" className="col-sm-5 col-form-label">
                Requested by
              </label>
              <div className="col-sm-7">
                <input
                  type="text"
                  className="form-control-plaintext form-control-sm font-weight-bold"
                  id="requested_by"
                  name="requested_by"
                  value={data.requested_by}
                  readOnly
                />
              </div>
            </div>
          </div>
          <div className="col-sm-6">
            <div className="form-group row">
              <label htmlFor="customer" className="col-sm-5 col-form-label">
                Customer
              </label>
              <div className="col-sm-7">
                <input
                  type="text"
                  className="form-control-plaintext form-control-sm font-weight-bold"
                  id="customer"
                  name="customer"
                  value={data.customer}
                  readOnly
                />
              </div>
            </div>
            <div className="form-group row">
              <label htmlFor="nic" className="col-sm-5 col-form-label">
                NIC
              </label>
              <div className="col-sm-7">
                <input
                  type="text"
                  className="form-control-plaintext form-control-sm font-weight-bold"
                  id="nic"
                  name="nic"
                  value={data.nic}
                  readOnly
                />
              </div>
            </div>
            <div className="form-group row">
              <label htmlFor="address_1" className="col-sm-5 col-form-label">
                Address
              </label>
              <div className="col-sm-7">
                <input
                  type="text"
                  className="form-control-plaintext form-control-sm font-weight-bold"
                  id="address_1"
                  name="address_1"
                  value={data.address_1}
                  readOnly
                />
              </div>
            </div>
            <div>
              <a href="#" onClick={toggleHistoryModal}>
                Customer's pawning history..
              </a>
            </div>
          </div>
        </div>
        <br />
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="offset-1 col-sm-7">
              <input
                type="text"
                name="comment"
                id="comment"
                data-id={data.id}
                className="form-control form-control-sm text-right font-weight-bold"
                value={newLoanApproval.comment}
                onChange={handleValueChange}
                placeholder="Comment"
                required
                autoFocus
              />
            </div>
            <div className="col-sm-2">
              <button
                type="button"
                className="btn btn-sm btn-block btn-outline-danger rounded-0"
                onClick={() => {
                  handleReject(data.id);
                }}
              >
                <span>
                  <SafeFontAwesomeIcon icon={faBan} size="sm" />
                </span>
                &nbsp; Reject
              </button>
            </div>
            <div className="col-sm-2">
              <button
                type="submit"
                className="btn btn-sm btn-block btn-primary rounded-0"
              >
                <span>
                  <SafeFontAwesomeIcon icon={faCheckCircle} size="sm" />
                </span>
                &nbsp; Approve
              </button>
            </div>
          </div>
        </form>
        <br />
      </div>
    );
  };

  const rowExpanded = (toggleState, row) => {
    console.log(row);
    setLoanHistory({
      loans: row.loans,
      redeems: row.redeems,
      others: row.others,
    });
  };

  const resetAll = () => {
    setNewLoanApproval({
      id: '',
      status: 'APPROVED',
      comment: '',
      releasedBy: cookie.get('user_id'),
    });

    setLoanApprovalRows([]);

    tempRows = [];
  };

  /* --- End of component functions --- */

  /* --- Component renders --- */

  return (
    <div className="container">
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
        <div style={{ width: '100%' }}>
          {/* List view componenet */}
          <DataTable
            title="Customer Pawning Limit Approvals"
            columns={columns}
            data={loanApprovalRows}
            expandableRows
            expandableRowsComponent={<LoanApprovalDetails />}
            expandOnRowClicked
            onRowExpandToggled={rowExpanded}
            highlightOnHover={true}
          />
          {/* End of list view component */}
        </div>
      )}

      {showLoanHistory ? (
        <FormModal
          moduleName={`Pawning history`}
          modalState={showLoanHistory}
          toggleFormModal={toggleHistoryModal}
        >
          <div className="modal-body" style={{ overflowX: 'scroll' }}>
            <table className="table table-hover">
              <thead className="thead-light text-center">
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Branch</th>
                  <th scope="col">Pawning date</th>
                  <th scope="col">Bill type</th>
                  <th scope="col">Bill no</th>
                  <th scope="col">Articles</th>
                  <th scope="col">Pawning Amount</th>
                  <th scope="col">Status</th>
                  <th scope="col">Redeem/Other Date</th>
                  <th scope="col">Redeem Amount</th>
                </tr>
              </thead>
              <tbody>
                {
                  // prettier-ignore
                  loanHistory.loans.map((loan, index) => {
                    pawningTotal += parseFloat(loan.required_amount);
                    return (
                      <tr key={loan.id}>
                        <td>{index + 1}</td>
                        <td>{loan.branch.name}</td>
                        <td>{loan.ddate}</td>
                        <td>{loan.bill_type.des}</td>
                        <td>{loan.bill_no}</td>
                        <td>
                            {
                              loan.loan_item.map((item, index) => `${index !== 0 ? ', ' : ''}${item.item.name}`)
                            }
                          </td>
                        <td className="text-right">{loan.required_amount}</td>
                        <td className="text-center">Pawning</td>
                        <td className="text-center">----</td>
                        <td className="text-center">----</td>
                      </tr>
                    );
                  })
                  // prettier-ignore-end
                }
                {loanHistory.loans.length ? (
                  <tr>
                    <td colSpan="6" className="text-center small-bold-text">
                      Total
                    </td>
                    <td className="text-right small-bold-text">
                      {parseFloat(pawningTotal).toFixed(2)}
                    </td>
                    <td colSpan="3"></td>
                  </tr>
                ) : null}
                {
                  // prettier-ignore
                  loanHistory.redeems.map((redeem, index) => {
                    redeemTotal += parseFloat(redeem.required_amount);
                    return (
                      <tr key={redeem.id}>
                        <td>{index + 1}</td>
                        <td>{redeem.branch.name}</td>
                        <td>{redeem.ddate}</td>
                        <td>{redeem.bill_type.des}</td>
                        <td>{redeem.bill_no}</td>
                        <td>
                          {
                            redeem.loan_item.map((item, index) => `${index !== 0 ? ', ' : ''}${item.item.name}`)
                          }
                        </td>
                        <td className="text-right">{redeem.required_amount}</td>
                        <td className="text-center">Redeemed</td>
                        <td>{redeem.created_at}</td>
                        <td>{redeem.redeem_amount}</td>
                      </tr>
                    );
                  })
                  // prettier-ignore-end
                }
                {loanHistory.redeems.length ? (
                  <tr>
                    <td colSpan="6" className="text-center small-bold-text">
                      Total
                    </td>
                    <td className="text-right small-bold-text">
                      {parseFloat(redeemTotal).toFixed(2)}
                    </td>
                    <td colSpan="3"></td>
                  </tr>
                ) : null}
                {loanHistory.others.forEach((other, index) => {
                  return (
                    <tr key={other.id}>
                      <td>{index + 1}</td>
                      <td>{other.branch.name}</td>
                      <td>{other.ddate}</td>
                      <td className="text-right">{other.required_amount}</td>
                      <td>{other.bill_type.des}</td>
                      <td>{other.bill_no}</td>
                      <td className="text-center">
                        {other.loan_trans.some((trans) =>
                          trans.trans_type_id == 4
                            ? `Forfeited`
                            : trans.trans_type_id == 5
                            ? `Lost`
                            : `Other`,
                        )}
                      </td>
                      <td>{other.created_at}</td>
                      <td>{other.redeem_amount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="modal-footer">
            <SystemButton
              type={'close'}
              method={toggleHistoryModal}
              showText={true}
            />
          </div>
        </FormModal>
      ) : null}
    </div>
  );

  /* --- End of component renders --- */
};

export default CustomerApprovals;
