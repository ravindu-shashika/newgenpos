import React, { useState, useEffect } from 'react';
import { api, msg, cookie } from '../../services';
import DataTable from 'react-data-table-component';
import { SafeFontAwesomeIcon } from '../../components';
import { faBan, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

const PawningApprovals = ({ countAgain }) => {
  /* --- State declarationss --- */

  const [newLoanApproval, setNewLoanApproval] = useState({
    id: '',
    status: 'APPROVED',
    approved_amt: '',
    officer: '',
    approvedBy: cookie.get('user_id'),
  });

  const [isLoading, setIsLoading] = useState(false);

  const [loanApprovalRows, setLoanApprovalRows] = useState([]);

  const [approvalOfficer, setApprovalOfficer] = useState([]);

  const columns = [
    {
      name: 'Branch',
      selector: 'branch',
      sortable: true,
    },
    {
      name: 'Bill Number',
      selector: 'bill_type_no',
      sortable: true,
      center: true,
    },
    {
      name: 'Gold Weight',
      selector: 'gold_weight',
      right: true,
      wrap: true,
    },
    {
      name: 'Payable Amount',
      selector: 'payable_amount',
      right: true,
      wrap: true,
      grow: 1,
    },
    {
      name: 'Requested Amount',
      selector: 'requested_amount',
      right: true,
      wrap: true,
      grow: 1,
    },
    {
      name: 'Excess Amount',
      selector: 'excess_amount',
      right: true,
      wrap: true,
      grow: 1,
    },
    {
      name: 'Requested By',
      selector: 'requested_by',
      wrap: true,
      sortable: true,
    },
  ];

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

      console.log(response);

      // prettier-ignore
      response.data.loanApproval.map((row) => {
        tempRows.push({
          id: row.id,
          branch: row.branch.name,
          bill_type_no: `${row.bill_type.des} - ${row.bill_no}`,
          bill_no: row.bill_no,
          bill_type: row.bill_type.des,
          period: row.bill_type.period.months,
          gold_weight: parseFloat(row.tot_weight).toFixed(2),
          payable_amount: parseFloat(row.amount).toFixed(2),
          requested_amount: parseFloat(row.payable_amt).toFixed(2),
          requested_amount_temp: parseFloat(row.payable_amt).toFixed(2),
          excess_amount: parseFloat(row.requested_amt).toFixed(2),
          avg_gold_value: parseFloat(parseFloat(row.payable_amt) * 8) / parseFloat(row.tot_weight),
          requested_by: row.user.name,
          items: row.loan_approval_items,
          customer: row.customer,
        });
      });
      // prettier-ignore-end

      setApprovalOfficer(response.data.approvalOfficers);

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
    const dataset = targetInput.dataset;
    const inputName = targetInput.name;
    const inputValue = targetInput.value;

    if (inputName === 'officer') {
      setNewLoanApproval({
        ...newLoanApproval,
        id: dataset.id,
        officer: inputValue,
      });

      // loanApprovalRows.map((row) => {
      //   if(row.id === datasetId) {

      //   }
      // });
    }
  };

  const validator = async () => {
    if (!newLoanApproval.approved_amt) {
      // return {
      //   state: false,
      //   message: 'Approval amount is not valid',
      // };
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
      countAgain();
    }
  };

  const handleReject = async (id) => {
    try {
      const response = await api.delete(
        `rejectOverAdvanceApprovalRequest/` + id,
      );

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
    //console.log(data);
    // setNewLoanApproval({
    //   ...newLoanApproval,
    //   approved_amt: data.requested_amount,
    // });

    return (
      <div className="light_div">
        <div className="row compactForm">
          <div className="col-sm-5">
            <div className="form-group row">
              <label htmlFor="bill_type" className="col-sm-6 col-form-label">
                Bill type
              </label>
              <div className="col-sm-6">
                <input
                  type="text"
                  className="form-control-plaintext form-control-sm font-weight-bold"
                  id="bill_type"
                  name="bill_type"
                  value={data.bill_type}
                  readOnly
                />
              </div>
            </div>
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

            <br />

            <div className="form-group row">
              <label htmlFor="customer_nic" className="col-sm-6 col-form-label">
                Customer NIC
              </label>
              <div className="col-sm-6">
                <input
                  type="text"
                  className="form-control-plaintext form-control-sm font-weight-bold text-right"
                  id="customer_nic"
                  name="customer_nic"
                  value={data.customer.nic}
                  readOnly
                />
              </div>
            </div>
            <div className="form-group row">
              <label
                htmlFor="customer_name"
                className="col-sm-6 col-form-label"
              >
                Customer Name
              </label>
              <div className="col-sm-6">
                <input
                  type="text"
                  className="form-control-plaintext form-control-sm font-weight-bold text-right"
                  id="customer_name"
                  name="customer_name"
                  value={data.customer.name}
                  readOnly
                />
              </div>
            </div>
            <div className="form-group row">
              <label htmlFor="address_1" className="col-sm-6 col-form-label">
                Postal Address
              </label>
              <div className="col-sm-6">
                <textarea
                  type="text"
                  className="form-control-plaintext small-bold-text text-right"
                  id="address_1"
                  name="address_1"
                  rows="3"
                  value={data.customer.address_1}
                  readOnly
                ></textarea>
              </div>
            </div>

            <br />

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
              <label htmlFor="period" className="col-sm-6 col-form-label">
                Loan period (months)
              </label>
              <div className="col-sm-6">
                <input
                  type="text"
                  className="form-control-plaintext form-control-sm font-weight-bold text-right"
                  id="period"
                  name="period"
                  value={data.period}
                  readOnly
                />
              </div>
            </div>
            <br />
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
                  className="form-control form-control-sm font-weight-bold text-right"
                  id="excess_amount"
                  name="excess_amount"
                  value={parseFloat(data.excess_amount).toFixed(2)}
                  readOnly
                />
              </div>
            </div>
            <div className="form-group row">
              <label
                htmlFor="avg_gold_value"
                className="col-sm-6 col-form-label"
              >
                Average Gold Value (LKR)
              </label>
              <div className="col-sm-6">
                <input
                  type="text"
                  className="form-control form-control-sm font-weight-bold text-right"
                  id="avg_gold_value"
                  name="avg_gold_value"
                  value={parseFloat(data.avg_gold_value).toFixed(2)}
                  readOnly
                />
              </div>
            </div>
          </div>
          <div className="col-sm-7">
            <div className="form-group row">
              <table className="table table-sm">
                <thead className="text-center">
                  <tr>
                    <th>Item</th>
                    <th>Condition</th>
                    <th>Type</th>
                    <th>Rate</th>
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
                        <td className="text-center">
                          {item.gold_rate.gold_types.category}
                        </td>
                        <td className="text-right">{item.gold_rate.rate}</td>
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
                    <td colSpan="4" className="font-weight-bold text-center">
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
            <div className="offset-6 col-sm-2">
              <select
                name="officer"
                id="officer"
                className="form-control-sm"
                data-id={data.id}
                data-approved={data.requested_amount}
                value={newLoanApproval.officer}
                onChange={handleValueChange}
              >
                <option value="">-- Select officer</option>
                {approvalOfficer.map((officer) => {
                  return (
                    <option value={officer.id} key={officer.id}>
                      {officer.name}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="col-sm-2">
              <button
                type="button"
                className="btn btn-sm btn-block btn-outline-danger align-top"
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
        <div style={{ width: '100%' }}>
          {/* List view componenet */}
          <DataTable
            title={'Loan Approvals'}
            columns={columns}
            data={loanApprovalRows}
            expandableRows
            expandableRowsComponent={<LoanApprovalDetails />}
            expandOnRowClicked
            highlightOnHover={true}
          />
          {/* End of list view component */}
        </div>
      )}
    </div>
  );

  /* --- End of component renders --- */
};

export default PawningApprovals;
