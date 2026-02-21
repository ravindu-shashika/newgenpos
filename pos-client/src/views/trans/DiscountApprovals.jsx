import React, { useState, useEffect } from 'react';
import { api, msg, cookie } from '../../services';
import DataTable from 'react-data-table-component';
import { SafeFontAwesomeIcon } from '../../components';
import { faBan, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

const PawningApprovals = ({ countAgain }) => {
  /* --- State declarationss --- */

  const [newDiscountApproval, setNewDiscountApproval] = useState({
    id: '',
    officer: '',
    approvedBy: cookie.get('user_id'),
  });

  const [isLoading, setIsLoading] = useState(false);

  const [discountApprovalRows, setDiscountApprovalRows] = useState([]);

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
      name: 'Loan Amount',
      selector: 'required_amount',
      right: true,
      wrap: true,
      grow: 1,
    },
    {
      name: 'Discount',
      selector: 'discount',
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

      const response = await api.get(`showDiscountApprovalRequests`);

      console.log(response.data);

      response.data.approvalRequests.forEach((row) => {
        tempRows.push({
          id: row.id,
          branch: row.branch.name,
          bill_type_no: `${row.loan.bill_type.des} - ${row.loan.bill_no}`,
          bill_no: row.loan.bill_no,
          bill_type: row.loan.bill_type.des,
          period: row.loan.bill_type.period.months,
          ddate: row.loan.ddate,
          final_date: row.loan.final_date,
          int_rate: row.loan.int_rate,
          gold_weight: parseFloat(row.loan.tot_weight).toFixed(2),
          gold_value: parseFloat(row.loan.gold_value).toFixed(2),
          payable_amount: parseFloat(row.loan.loan_capital).toFixed(2),
          required_amount: parseFloat(row.loan.required_amount).toFixed(2),
          requested_discount: parseFloat(row.requested_amount).toFixed(2),
          special_discount: parseFloat(row.special_discounts).toFixed(2),
          capital_balance: parseFloat(row.capital_balance).toFixed(2),
          interest_balance: parseFloat(row.interest_balance).toFixed(2),
          loan_balance: parseFloat(row.loan_balance).toFixed(2),
          customer: row.loan.customer,
          requested_by: row.user.name,
          items: row.loan.loan_item,
          trans_history: row.loan.loan_trans,
        });
      });

      setApprovalOfficer(response.data.approvalOfficers);

      setDiscountApprovalRows(tempRows);
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
      setNewDiscountApproval({
        ...newDiscountApproval,
        id: dataset.id,
        officer: inputValue,
      });

      // discountApprovalRows.map((row) => {
      //   if(row.id === datasetId) {

      //   }
      // });
    }
  };

  const validator = async () => {
    if (!newDiscountApproval.officer) {
      return {
        state: false,
        message: 'An officer must be selected!',
      };
      return {
        state: true,
      };
    } else {
      return {
        state: true,
      };
    }
  };

  const handleSubmit = async () => {
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
        .post('approveDiscount')
        .values(newDiscountApproval);
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
      const response = await api.delete(`rejectDiscount/${id}`);

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

  const DiscountApprovalDetails = ({ data }) => {
    //console.log(data);
    // setNewDiscountApproval({
    //   ...newDiscountApproval,
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
                <input
                  type="text"
                  className="form-control-plaintext form-control-sm font-weight-bold text-right"
                  id="address_1"
                  name="address_1"
                  value={data.customer.address_1}
                  readOnly
                />
              </div>
            </div>

            <br />

            <div className="form-group row">
              <label
                htmlFor="payable_amount"
                className="col-sm-6 col-form-label"
              >
                Loan Amount (LKR)
              </label>
              <div className="col-sm-6">
                <input
                  type="text"
                  className="form-control-plaintext form-control-sm font-weight-bold text-right"
                  id="payable_amount"
                  name="payable_amount"
                  value={parseFloat(data.required_amount).toFixed(2)}
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
              <table className="table table-sm">
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
                        <td>{item.gold_rate.gold_types.category}</td>
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

            <br />

            <div className="form-group row">
              <label
                htmlFor="capital_balance"
                className="col-sm-6 col-form-label"
              >
                Capital Balance (LKR)
              </label>
              <div className="col-sm-6">
                <input
                  type="text"
                  className="form-control-plaintext form-control-sm font-weight-bold text-right"
                  id="capital_balance"
                  name="capital_balance"
                  value={parseFloat(data.capital_balance).toFixed(2)}
                  readOnly
                />
              </div>
            </div>
            <div className="form-group row">
              <label
                htmlFor="interest_balance"
                className="col-sm-6 col-form-label"
              >
                Interest Balance (LKR)
              </label>
              <div className="col-sm-6">
                <input
                  type="text"
                  className="form-control-plaintext form-control-sm font-weight-bold text-right"
                  id="interest_balance"
                  name="interest_balance"
                  value={parseFloat(data.interest_balance).toFixed(2)}
                  readOnly
                />
              </div>
            </div>
            <div className="form-group row">
              <label htmlFor="loan_balance" className="col-sm-6 col-form-label">
                Total Balance (LKR)
              </label>
              <div className="col-sm-6">
                <input
                  type="text"
                  className="form-control-plaintext form-control-sm font-weight-bold text-right"
                  id="loan_balance"
                  name="loan_balance"
                  value={parseFloat(data.loan_balance).toFixed(2)}
                  readOnly
                />
              </div>
            </div>
            <div className="form-group row">
              <label
                htmlFor="special_discount"
                className="col-sm-6 col-form-label"
              >
                Special Discounts (LKR)
              </label>
              <div className="col-sm-6">
                <input
                  type="text"
                  className="form-control-plaintext form-control-sm font-weight-bold text-right"
                  id="special_discount"
                  name="special_discount"
                  value={parseFloat(data.special_discount).toFixed(2)}
                  readOnly
                />
              </div>
            </div>
            <div className="form-group row">
              <label
                htmlFor="requested_amount"
                className="col-sm-6 col-form-label"
              >
                Discount Amount (LKR)
              </label>
              <div className="col-sm-6">
                <input
                  type="text"
                  className="form-control-plaintext form-control-sm font-weight-bold text-right"
                  id="requested_discount"
                  name="requested_discount"
                  value={parseFloat(data.requested_discount).toFixed(2)}
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>
        <div>
          <div className="row">
            <div className="offset-6 col-sm-2">
              <select
                name="officer"
                id="officer"
                className="form-control-sm"
                data-id={data.id}
                data-approved={data.requested_amount}
                value={newDiscountApproval.officer}
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
            {/* <div className="offset-5 col-sm-3">
              <input
                type="number"
                name="approved_amt"
                id="approved_amt"
                step="0.01"
                data-id={data.id}
                className="form-control form-control-sm text-right font-weight-bold"
                value={newDiscountApproval.approved_amt}
                onChange={handleValueChange}
                placeholder="Approved Amount      "
                autoFocus
              />
            </div> */}
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
                onClick={handleSubmit}
              >
                <span>
                  <SafeFontAwesomeIcon icon={faCheckCircle} size="sm" />
                </span>
                &nbsp; Approve
              </button>
            </div>
          </div>
        </div>
        <br />
      </div>
    );
  };

  const resetAll = () => {
    setNewDiscountApproval({
      id: '',
      approvedBy: cookie.get('user_id'),
    });

    setDiscountApprovalRows([]);

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
            title={'Discount Approvals'}
            columns={columns}
            data={discountApprovalRows}
            expandableRows
            expandableRowsComponent={<DiscountApprovalDetails />}
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
