import React, { useState, useEffect } from 'react';
import { api, msg, cookie } from '../../services';
import DataTable from 'react-data-table-component';
import { SafeFontAwesomeIcon } from '../../components';
import { faBan, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

const BillCountApprovals = () => {
  /* --- State declarationss --- */

  const [newLoanApproval, setNewLoanApproval] = useState({
    id: '',
    status: 'APPROVED',
    approved_amt: '',
    approvedBy: cookie.get('user_id'),
  });

  const columns = [
    {
      name: 'Branch',
      selector: 'branch',
      sortable: true,
      wrap: true,
    },
    {
      name: 'Bill No',
      selector: 'bill_no',
      sortable: true,
    },
    {
      name: 'Gold Weight (g)',
      selector: 'gold_weight',
      right: true,
      wrap: true,
    },
    {
      name: 'Payable Amount (LKR)',
      selector: 'payable_amount',
      right: true,
      wrap: true,
    },
    {
      name: 'Requested Amount (LKR)',
      selector: 'requested_amount',
      right: true,
      wrap: true,
    },
    {
      name: 'Excess Amount Requested (LKR)',
      selector: 'excess_amount',
      right: true,
      wrap: true,
    },
    {
      name: 'Requested By',
      selector: 'requested_by',
      wrap: true,
      sortable: true,
    },
  ];

  const [isLoading, setIsLoading] = useState(false);

  const [loanApprovalRows, setLoanApprovalRows] = useState([]);

  let tempRows = [];

  /* --- End of state declarations --- */

  useEffect(() => {
    fetchData();
  }, []);

  /* --- Component functions --- */

  const fetchData = async () => {
    try {
      setIsLoading(true);

      tempRows = [];

      const response = await api.get(`showOverAdvaceAprovalRequests`);

      response.data.map((row) => {
        tempRows.push({
          id: row.id,
          branch: row.branch.name,
          bill_no: row.bill_no,
          gold_weight: parseFloat(row.tot_weight).toFixed(2),
          payable_amount: parseFloat(row.amount).toFixed(2),
          requested_amount: parseFloat(row.payable_amt).toFixed(2),
          excess_amount: parseFloat(row.requested_amt).toFixed(2),
          requested_by: row.user.name,
          interest_scheme: row.interest_scheme,
          items: row.loan_approval_items,
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

  const handleValueChange = (e) => {
    const targetInput = e.target;
    const datasetId = targetInput.dataset.id;
    const inputName = targetInput.name;
    const inputValue = targetInput.value;

    if (inputName === 'approved_amt') {
      setNewLoanApproval({
        ...newLoanApproval,
        id: datasetId,
        approved_amt: inputValue,
      });
    }
  };

  const validator = async () => {
    if (!newLoanApproval.approved_amt) {
      return {
        state: false,
        message: 'Approval amount is not valid',
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
        .post('approveOverAdvanceApprovalRequest')
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
    }
  };

  const LoanApprovalDetails = ({ data }) => {
    return (
      <div className="bg-light">
        <div className="row">
          <div className="col-sm-5">
            <div className="form-group row">
              <label htmlFor="bill_no" className="col-sm-6 col-form-label">
                Bill no
              </label>
              <div className="col-sm-6">
                <input
                  type="text"
                  className="form-control-plaintext form-control-sm font-weight-bold"
                  id="bill_no"
                  name="bill_no"
                  value={data.bill_no}
                  readOnly
                />
              </div>
            </div>
            <div className="form-group row">
              <label htmlFor="branch" className="col-sm-6 col-form-label">
                Requested branch
              </label>
              <div className="col-sm-6">
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
              <label htmlFor="requested_by" className="col-sm-6 col-form-label">
                Requested by
              </label>
              <div className="col-sm-6">
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
            <div className="form-group row">
              <label
                htmlFor="payable_amount"
                className="col-sm-6 col-form-label"
              >
                Payable Amount (LKR)
              </label>
              <div className="col-sm-6">
                <input
                  type="text"
                  className="form-control-plaintext form-control-sm font-weight-bold text-right"
                  id="payable_amount"
                  name="payable_amount"
                  value={parseFloat(data.payable_amount).toFixed(2)}
                  readOnly
                />
              </div>
            </div>
            <div className="form-group row">
              <label
                htmlFor="requested_amount"
                className="col-sm-6 col-form-label"
              >
                Requested Amount (LKR)
              </label>
              <div className="col-sm-6">
                <input
                  type="text"
                  className="form-control-plaintext form-control-sm font-weight-bold text-right"
                  id="requested_amount"
                  name="requested_amount"
                  value={parseFloat(data.requested_amount).toFixed(2)}
                  readOnly
                />
              </div>
            </div>
            <div className="form-group row">
              <label
                htmlFor="excess_amount"
                className="col-sm-6 col-form-label"
              >
                Excess Amount (LKR)
              </label>
              <div className="col-sm-6">
                <input
                  type="text"
                  className="form-control-plaintext form-control-sm font-weight-bold text-right"
                  id="excess_amount"
                  name="excess_amount"
                  value={parseFloat(data.excess_amount).toFixed(2)}
                  readOnly
                />
              </div>
            </div>
          </div>
          <div className="col-sm-7">
            <div className="form-group row">
              <table className="table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Condition</th>
                    <th>Type</th>
                    <th>Weight (g)</th>
                    <th>Value (LKR)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item) => {
                    return (
                      <tr key={item.id}>
                        <td>{item.item.name}</td>
                        <td>{item.condition.description}</td>
                        <td>{item.gold_type.category}</td>
                        <td className="text-right">
                          {parseFloat(item.gold_weight).toFixed(2)}
                        </td>
                        <td className="text-right">
                          {parseFloat(item.gold_value).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" className="font-weight-bold text-center">
                      Total
                    </td>
                    <td className="font-weight-bold text-right">
                      {parseFloat(data.gold_weight).toFixed(2)}
                    </td>
                    <td className="font-weight-bold text-right">
                      {parseFloat(data.payable_amount).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="offset-5 col-sm-3">
              <input
                type="number"
                name="approved_amt"
                id="approved_amt"
                step="0.01"
                data-id={data.id}
                className="form-control form-control-sm text-right font-weight-bold"
                value={newLoanApproval.approved_amt}
                onChange={handleValueChange}
                placeholder="Approved Amount      "
                autoFocus
              />
            </div>
            <div className="col-sm-2">
              <button
                type="button"
                className="btn btn-sm btn-block btn-outline-danger align-top"
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
                className="btn btn-sm btn-block btn-primary"
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

  const resetAll = () => {
    setNewLoanApproval({
      id: '',
      status: 'APPROVED',
      approved_amt: '',
      approvedBy: cookie.get('user_id'),
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
        <div>
          {/* List view componenet */}
          <DataTable
            title={'Loan Approvals'}
            columns={columns}
            data={loanApprovalRows}
            expandableRows
            expandableRowsComponent={<LoanApprovalDetails />}
          />
          {/* End of list view component */}
        </div>
      )}
    </div>
  );

  /* --- End of component renders --- */
};

export default BillCountApprovals;
